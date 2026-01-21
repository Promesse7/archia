import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";

export class FragmentClassifier {
  constructor() {
    this.mobileNet = null;
    this.classifier = null;
    this.labels = ["rim", "body", "base"];
    this.loading = false;
    this.loaded = false;
    this.embeddingSize = null;
    this.onProgress = null; // Progress callback
  }

  setProgressCallback(callback) {
    this.onProgress = callback;
  }

  reportProgress(stage, percent) {
    if (this.onProgress) {
      this.onProgress({ stage, percent });
    }
    console.log(`[${percent.toFixed(0)}%] ${stage}`);
  }

  async initialize() {
    if (this.loading) {
      console.log("Already loading, please wait...");
      return;
    }

    if (this.loaded) {
      console.log("Already loaded");
      return true;
    }

    this.loading = true;

    try {
      // Stage 1: TensorFlow.js (0-25%)
      this.reportProgress("Initializing TensorFlow.js...", 0);
      await tf.ready();
      this.reportProgress("TensorFlow.js ready (backend: " + tf.getBackend() + ")", 25);

      // Stage 2: MobileNet Download (25-75%)
      this.reportProgress("Downloading MobileNet (~16MB)...", 30);
      
      // Use lighter model for faster loading
this.mobileNet = await mobilenet.load({
  version: 2,
  alpha: 0.75,
  modelUrl: "/models/mobilenet/model.json"
});


      this.reportProgress("MobileNet loaded successfully", 75);

      // Stage 3: Detect embedding size (75-80%)
      this.reportProgress("Detecting model configuration...", 76);
      await this.detectEmbeddingSize();
      this.reportProgress("Model configured", 80);

      // Stage 4: Load/Create Classifier (80-100%)
      this.reportProgress("Loading classifier...", 85);
      try {
        this.classifier = await tf.loadLayersModel("indexeddb://fragment-classifier");
        this.reportProgress("Classifier loaded from cache", 95);
        
        const expectedShape = this.classifier.layers[0].getInputAt(0).shape[1];
        if (expectedShape !== this.embeddingSize) {
          console.warn(`Cached classifier mismatch, creating new one`);
          this.createClassifier();
        }
      } catch (err) {
        this.reportProgress("Creating new classifier...", 90);
        this.createClassifier();
      }

      this.reportProgress("All models ready!", 100);
      this.loaded = true;
      this.loading = false;
      return true;

    } catch (err) {
      this.loading = false;
      this.reportProgress("Failed to load models", 0);
      console.error("❌ Initialization failed:", err);
      throw new Error(`Model loading failed: ${err.message}`);
    }
  }

  async detectEmbeddingSize() {
    const dummyImage = tf.zeros([224, 224, 3]);
    
    return tf.tidy(() => {
      const batch = dummyImage.expandDims(0);
      const normalized = batch.div(255.0);
      const embedding = this.mobileNet.infer(normalized, true);
      
      this.embeddingSize = embedding.shape[1];
      console.log(`✅ Embedding size: ${this.embeddingSize}`);
      
      return this.embeddingSize;
    });
  }

  createClassifier() {
    this.classifier = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [this.embeddingSize],
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
  }

  extractFeatures(imgElement) {
    return tf.tidy(() => {
      const img = tf.browser.fromPixels(imgElement)
        .resizeBilinear([224, 224])
        .toFloat()
        .div(255.0)
        .expandDims(0);

      return this.mobileNet.infer(img, true);
    });
  }

  async classify(imgElement) {
    if (!this.loaded) {
      if (this.loading) {
        await new Promise((resolve, reject) => {
          const check = setInterval(() => {
            if (this.loaded) {
              clearInterval(check);
              resolve();
            } else if (!this.loading) {
              clearInterval(check);
              reject(new Error("Loading failed"));
            }
          }, 100);
        });
      } else {
        await this.initialize();
      }
    }

    if (!this.mobileNet || !this.classifier) {
      throw new Error("Models not initialized");
    }

    return tf.tidy(() => {
      const features = this.extractFeatures(imgElement);
      const predictions = this.classifier.predict(features);
      
      const probabilities = predictions.dataSync();
      const maxIndex = predictions.argMax(-1).dataSync()[0];

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

    const { epochs = 20, batchSize = 16, validationSplit = 0.2, onEpochEnd = null } = options;

    const features = [];
    const labels = [];

    for (const sample of trainingData) {
      const feature = this.extractFeatures(sample.image);
      features.push(feature);
      labels.push(tf.oneHot(sample.label, 3));
    }

    const xs = tf.concat(features);
    const ys = tf.concat(labels);

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

    await this.save();
  }

  async save() {
    if (this.classifier) {
      await this.classifier.save("indexeddb://fragment-classifier");
      console.log("✅ Classifier saved");
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
    if (this.classifier) this.classifier.dispose();
    if (this.mobileNet) this.mobileNet.dispose();
    this.loaded = false;
  }
}

// Singleton
let classifierInstance = null;

export async function getFragmentClassifier() {
  if (classifierInstance?.loaded) {
    return classifierInstance;
  }

  if (!classifierInstance) {
    classifierInstance = new FragmentClassifier();
  }

  if (!classifierInstance.loaded && !classifierInstance.loading) {
    await classifierInstance.initialize();
  }

  return classifierInstance;
}

export async function classifyFragment(imgElement) {
  if (!imgElement || !imgElement.complete) {
    throw new Error("Invalid image");
  }

  const classifier = await getFragmentClassifier();
  return await classifier.classify(imgElement);
}

export async function preloadModels(onProgress) {
  try {
    const classifier = new FragmentClassifier();
    
    if (onProgress) {
      classifier.setProgressCallback(onProgress);
    }
    
    await classifier.initialize();
    classifierInstance = classifier;
    
    return true;
  } catch (err) {
    console.error("❌ Preload failed:", err);
    return false;
  }
}