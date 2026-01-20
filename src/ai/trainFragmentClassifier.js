import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";

export async function trainClassifier(samples) {
  const mobilenetModel = await mobilenet.load({ version: 2, alpha: 1.0 });

  const xs = [];
  const ys = [];

  for (const sample of samples) {
    const img = tf.browser.fromPixels(sample.image)
      .resizeBilinear([224, 224])
      .toFloat()
      .div(255)
      .expandDims(0);

    const embedding = mobilenetModel.infer(img, true);
    xs.push(embedding);
    ys.push(tf.oneHot(sample.label, 3));
  }

  const xTensor = tf.concat(xs);
  const yTensor = tf.concat(ys);

  const classifier = tf.sequential();
  classifier.add(tf.layers.dense({ inputShape: [1024], units: 128, activation: "relu" }));
  classifier.add(tf.layers.dense({ units: 3, activation: "softmax" }));

  classifier.compile({
    optimizer: tf.train.adam(0.0005),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"]
  });

  await classifier.fit(xTensor, yTensor, {
    epochs: 20,
    shuffle: true
  });

  await classifier.save("indexeddb://fragment-classifier");
}
