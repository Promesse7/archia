import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";

export class FragmentClassifier {
  constructor() {
    this.mobileNet = null;
    this.classifier = null;
    this.labels = ["rim", "body", "base"];
  }

  async initialize() {
    console.log("Loading MobileNet base model...");
    this.mobileNet = await mobilenet.load({ version: 2, alpha: 1.0 });
    console.log("MobileNet loaded");

    try {
      this.classifier = await tf.loadLayersModel("indexeddb://fragment-classifier");
      console.log("Loaded saved classifier from IndexedDB");
    } catch (err) {
      console.log("No saved classifier found, creating new one");
      this.createClassifier();
    }
  }

  createClassifier() {
    this.classifier = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [1024],
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
      throw new Error("Classifier not initialized");
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

    console.log("Training complete");
    await this.save();
  }

  async save() {
    if (this.classifier) {
      await this.classifier.save("indexeddb://fragment-classifier");
      console.log("Classifier saved to IndexedDB");
    }
  }

  getInfo() {
    if (!this.classifier) return null;

    return {
      layers: this.classifier.layers.length,
      trainableParams: this.classifier.countParams(),
      labels: this.labels
    };
  }

  dispose() {
    if (this.classifier) {
      this.classifier.dispose();
    }
    if (this.mobileNet) {
      this.mobileNet.dispose();
    }
  }
}

let classifierInstance = null;

export async function getFragmentClassifier() {
  if (!classifierInstance) {
    classifierInstance = new FragmentClassifier();
    await classifierInstance.initialize();
  }
  return classifierInstance;
}

export async function classifyFragment(imgElement) {
  const classifier = await getFragmentClassifier();
  return await classifier.classify(imgElement);
}