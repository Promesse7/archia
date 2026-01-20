import * as tf from "@tensorflow/tfjs";

let classifier;

export function createFragmentClassifier() {
  classifier = tf.sequential();

  classifier.add(tf.layers.dense({
    inputShape: [1024],
    units: 128,
    activation: "relu"
  }));

  classifier.add(tf.layers.dense({
    units: 3,
    activation: "softmax"
  }));

  classifier.compile({
    optimizer: tf.train.adam(0.0005),
    loss: "categoricalCrossentropy"
  });

  return classifier;
}

export function classifyFragment(embedding) {
  const prediction = classifier.predict(embedding);
  const classIndex = prediction.argMax(-1).dataSync()[0];

  return ["rim", "body", "base"][classIndex];
}
