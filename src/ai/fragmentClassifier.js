import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";

/**
 * Fragment Classifier using Transfer Learning
 * Fine-tunes MobileNet to classify pottery fragments into: rim, body, base
 */

export class FragmentClassifier {
  constructor() {
    this.mobileNet = null;
    this.classifier = null;
    this.labels = ["rim", "body", "base"];
  }

  /**
   * Initialize the classifier (load MobileNet)
   */
  async initialize() {
    console.log("Loading MobileNet base model...");
    this.mobileNet = await mobilenet.load({ version: 2, alpha: 1.0 });
    console.log("MobileNet loaded");

    // Try to load pre-trained classifier
    try {
      this.classifier = await tf.loadLayersModel("indexeddb://fragment-classifier");
      console.log("Loaded saved classifier from IndexedDB");
    } catch (err) {
      console.log("No saved classifier found, creating new one");
      this.createClassifier();
    }
  }

  /**
   * Create the classification head
   */
  createClassifier() {
    this.classifier = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [1024], // MobileNet embedding size
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
          units: 3, // rim, body, base
          activation: "softmax"
        })
      ]
    });

    this.classifier.compile({
      optimizer: tf.train.adam(0.0001),
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"]
    });
  }

  /**
   * Extract features from image using MobileNet
   * @param {HTMLImageElement} imgElement 
   * @returns {tf.Tensor2D} Feature embedding [1, 1024]
   */
  extractFeatures(imgElement) {
    return tf.tidy(() => {
      const img = tf.browser.fromPixels(imgElement)
        .resizeBilinear([224, 224])
        .toFloat()
        .div(255.0)
        .expandDims(0);

      // Get intermediate layer activation (embeddings)
      const embedding = this.mobileNet.infer(img, true);
      return embedding;
    });
  }

  /**
   * Classify a fragment image
   * @param {HTMLImageElement} imgElement 
   * @returns {Object} Classification result
   */
  async classify(imgElement) {
    if (!this.mobileNet || !this.classifier) {
      throw new Error("Classifier not initialized");
    }

    return tf.tidy(() => {
      const features = this.extractFeatures(imgElement);
      const predictions = this.classifier.predict(features);
      
      const probabilities = predictions.dataSync();
      const maxIndex = predictions.argMax(-1).dataSync()[0];

      // Extract geometric features from MobileNet predictions
      // (heuristic: use MobileNet's raw output to guess curvature/symmetry)
      const mobileNetPreds = this.mobileNet.classify(imgElement, 3);

      return {
        fragmentType: this.labels[maxIndex],
        confidence: probabilities[maxIndex],
        probabilities: {
          rim: probabilities[0],
          body: probabilities[1],
          base: probabilities[2]
        },
        // Placeholder geometric features (can be refined)
        symmetry: "radial",
        curvature: maxIndex === 0 ? "outward" : maxIndex === 2 ? "flat" : "cylindrical"
      };
    });
  }

  /**
   * Train the classifier on labeled data
   * @param {Array<{image: HTMLImageElement, label: number}>} trainingData 
   * @param {Object} options Training options
   */
  async train(trainingData, options = {}) {
    const {
      epochs = 20,
      batchSize = 16,
      validationSplit = 0.2,
      onEpochEnd = null
    } = options;

    console.log(`Training on ${trainingData.length} samples...`);

    // Extract features for all training images
    const features = [];
    const labels = [];

    for (const sample of trainingData) {
      const feature = this.extractFeatures(sample.image);
      features.push(feature);
      labels.push(tf.oneHot(sample.label, 3));
    }

    const xs = tf.concat(features);
    const ys = tf.concat(labels);

    // Train the classifier
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

    // Clean up tensors
    features.forEach(f => f.dispose());
    labels.forEach(l => l.dispose());
    xs.dispose();
    ys.dispose();

    console.log("Training complete");

    // Save the trained model
    await this.save();
  }

  /**
   * Save classifier to browser storage
   */
  async save() {
    if (this.classifier) {
      await this.classifier.save("indexeddb://fragment-classifier");
      console.log("Classifier saved to IndexedDB");
    }
  }

  /**
   * Get model info
   */
  getInfo() {
    if (!this.classifier) return null;

    return {
      layers: this.classifier.layers.length,
      trainableParams: this.classifier.countParams(),
      labels: this.labels
    };
  }

  /**
   * Dispose resources
   */
  dispose() {
    if (this.classifier) {
      this.classifier.dispose();
    }
    if (this.mobileNet) {
      this.mobileNet.dispose();
    }
  }
}

// Singleton instance
let classifierInstance = null;

export async function getFragmentClassifier() {
  if (!classifierInstance) {
    classifierInstance = new FragmentClassifier();
    await classifierInstance.initialize();
  }
  return classifierInstance;
}

/**
 * Simplified API matching original classifier.js
 */
export async function classifyFragment(imgElement) {
  const classifier = await getFragmentClassifier();
  return await classifier.classify(imgElement);
}