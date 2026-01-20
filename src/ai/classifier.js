import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";

export class FragmentClassifier {
  constructor() {
    this.mobileNet = null;
    this.classifier = null;
    this.labels = ["rim", "body", "base"];
    this.loading = false;
    this.loaded = false;
    this.embeddingSize = null; // Will be determined after loading MobileNet
  }

  async initialize() {
    if (this.loading) {
      console.log("Already loading MobileNet, please wait...");
      return;
    }

    if (this.loaded) {
      console.log("MobileNet already loaded");
      return;
    }

    this.loading = true;

    try {
      console.log("🔄 Loading MobileNet base model (this may take 30-60 seconds)...");
      console.log("Model size: ~16MB - please be patient");

      // Set TensorFlow backend
      await tf.ready();
      console.log("TensorFlow.js backend:", tf.getBackend());

      // Load MobileNet
      this.mobileNet = await mobilenet.load({ 
        version: 2, 
        alpha: 1.0 
      });

      console.log("✅ MobileNet loaded successfully!");

      // Detect embedding size by running a test inference
      await this.detectEmbeddingSize();

      // Try to load pre-trained classifier
      try {
        this.classifier = await tf.loadLayersModel("indexeddb://fragment-classifier");
        console.log("✅ Loaded saved classifier from browser storage");
        
        // Verify loaded classifier matches current embedding size
        const expectedShape = this.classifier.layers[0].getInputAt(0).shape[1];
        if (expectedShape !== this.embeddingSize) {
          console.warn(`⚠️ Saved classifier expects ${expectedShape} features but MobileNet outputs ${this.embeddingSize}`);
          console.log("Creating new classifier to match current MobileNet configuration");
          this.createClassifier();
        }
      } catch (err) {
        console.log("No saved classifier found, creating new one");
        this.createClassifier();
      }

      this.loaded = true;
      this.loading = false;

    } catch (err) {
      this.loading = false;
      console.error("❌ Failed to load MobileNet:", err);
      throw new Error(`MobileNet loading failed: ${err.message}`);
    }
  }

  async detectEmbeddingSize() {
    // Create a dummy image to detect embedding size
    const dummyImage = tf.zeros([224, 224, 3]);
    
    return tf.tidy(() => {
      const batch = dummyImage.expandDims(0);
      const normalized = batch.div(255.0);
      const embedding = this.mobileNet.infer(normalized, true);
      
      this.embeddingSize = embedding.shape[1];
      console.log(`✅ MobileNet embedding size detected: ${this.embeddingSize}`);
      
      return this.embeddingSize;
    });
  }

  createClassifier() {
    console.log(`Creating new classifier neural network for ${this.embeddingSize} features...`);

    this.classifier = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [this.embeddingSize], // Dynamic based on MobileNet output
          units: 128,
          activation: "relu",
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 64,
          activation: "relu"
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 3,
          activation: "softmax"
        })
      ]
    });

    this.classifier.compile({
      optimizer: tf.train.adam(0.0001),
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"]
    });

    console.log("✅ Classifier created");
    console.log("Model summary:");
    this.classifier.summary();
  }

  extractFeatures(imgElement) {
    return tf.tidy(() => {
      const img = tf.browser.fromPixels(imgElement)
        .resizeBilinear([224, 224])
        .toFloat()
        .div(255.0)
        .expandDims(0);

      const embedding = this.mobileNet.infer(img, true);
      return embedding;
    });
  }

  async classify(imgElement) {
    if (!this.mobileNet || !this.classifier) {
      throw new Error("Classifier not initialized. Please wait for models to load.");
    }

    console.log("🔍 Classifying fragment...");

    return tf.tidy(() => {
      const features = this.extractFeatures(imgElement);
      
      console.log("Feature shape:", features.shape);
      console.log("Expected shape: [1," + this.embeddingSize + "]");
      
      const predictions = this.classifier.predict(features);
      
      const probabilities = predictions.dataSync();
      const maxIndex = predictions.argMax(-1).dataSync()[0];

      console.log("Classification probabilities:", {
        rim: probabilities[0].toFixed(3),
        body: probabilities[1].toFixed(3),
        base: probabilities[2].toFixed(3)
      });

      return {
        fragmentType: this.labels[maxIndex],
        confidence: probabilities[maxIndex],
        probabilities: {
          rim: probabilities[0],
          body: probabilities[1],
          base: probabilities[2]
        },
        symmetry: "radial",
        curvature: maxIndex === 0 ? "outward" : maxIndex === 2 ? "flat" : "cylindrical"
      };
    });
  }

  async train(trainingData, options = {}) {
    if (!this.mobileNet || !this.classifier) {
      throw new Error("Classifier not initialized");
    }

    const {
      epochs = 20,
      batchSize = 16,
      validationSplit = 0.2,
      onEpochEnd = null
    } = options;

    console.log(`Training on ${trainingData.length} samples...`);

    const features = [];
    const labels = [];

    for (const sample of trainingData) {
      const feature = this.extractFeatures(sample.image);
      features.push(feature);
      labels.push(tf.oneHot(sample.label, 3));
    }

    const xs = tf.concat(features);
    const ys = tf.concat(labels);

    console.log("Training data shape:", xs.shape, "Labels shape:", ys.shape);

    await this.classifier.fit(xs, ys, {
      epochs,
      batchSize,
      validationSplit,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}/${epochs}:`, logs);
          if (onEpochEnd) onEpochEnd(epoch, logs);
        }
      }
    });

    features.forEach(f => f.dispose());
    labels.forEach(l => l.dispose());
    xs.dispose();
    ys.dispose();

    console.log("✅ Training complete");
    await this.save();
  }

  async save() {
    if (this.classifier) {
      await this.classifier.save("indexeddb://fragment-classifier");
      console.log("✅ Classifier saved to browser storage");
    }
  }

  getInfo() {
    if (!this.classifier) return null;

    return {
      layers: this.classifier.layers.length,
      trainableParams: this.classifier.countParams(),
      labels: this.labels,
      loaded: this.loaded,
      embeddingSize: this.embeddingSize
    };
  }

  dispose() {
    if (this.classifier) {
      this.classifier.dispose();
    }
    if (this.mobileNet) {
      this.mobileNet.dispose();
    }
    this.loaded = false;
  }
}

// Singleton instance
let classifierInstance = null;

export async function getFragmentClassifier() {
  if (!classifierInstance) {
    classifierInstance = new FragmentClassifier();
    await classifierInstance.initialize();
  } else if (!classifierInstance.loaded && !classifierInstance.loading) {
    // If instance exists but not loaded, initialize it
    await classifierInstance.initialize();
  }
  return classifierInstance;
}

export async function classifyFragment(imgElement) {
  const classifier = await getFragmentClassifier();
  return await classifier.classify(imgElement);
}

// Preload function to call on app startup
export async function preloadModels() {
  console.log("🚀 Preloading AI models...");
  try {
    await getFragmentClassifier();
    console.log("✅ All AI models preloaded successfully");
    return true;
  } catch (err) {
    console.error("❌ Failed to preload models:", err);
    return false;
  }
}