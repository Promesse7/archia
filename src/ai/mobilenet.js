import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";

let model;

export async function loadMobileNet() {
  model = await mobilenet.load({
    version: 2,
    alpha: 1.0
  });
  return model;
}

export function extractFeatures(video) {
  return tf.tidy(() => {
    const img = tf.browser.fromPixels(video)
      .resizeBilinear([224, 224])
      .toFloat()
      .div(255.0)
      .expandDims(0);

    // embedding from MobileNet
    return model.infer(img, true); // shape: [1, 1024]
  });
}
