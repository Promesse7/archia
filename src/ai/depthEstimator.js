import * as tf from "@tensorflow/tfjs";

let depthModel = null;

export async function loadDepthModel() {
  if (!depthModel) {
    depthModel = await tf.loadGraphModel("/models/midas/model.json");
    console.log("Depth model loaded");
  }
  return depthModel;
}

export function estimateDepth(imgElement) {
  return tf.tidy(() => {
    const input = tf.browser.fromPixels(imgElement)
      .resizeBilinear([256, 256])
      .toFloat()
      .div(255.0)
      .expandDims(0);

    const depth = depthModel.execute(input);
    return depth.squeeze(); // [256, 256]
  });
}
