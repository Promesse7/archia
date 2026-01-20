import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";

let model;

// Load MobileNet model
export async function loadModel() {
  if (!model) {
    model = await mobilenet.load({ version: 2, alpha: 1.0 });
    console.log("MobileNet loaded!");
  }
  return model;
}

// Classify fragment
export async function classifyFragment(imageElement) {
  if (!model) await loadModel();
  
  // Run classification
  const predictions = await model.classify(imageElement, 3); // top 3 predictions

  // For demo: map MobileNet predictions to pottery fragment classes
  // In real implementation, retrain or use transfer learning
  let fragmentType = "unknown";

  predictions.forEach(pred => {
    const name = pred.className.toLowerCase();
    if (name.includes("rim") || name.includes("cup")) fragmentType = "rim";
    else if (name.includes("vase") || name.includes("pot")) fragmentType = "body";
    else if (name.includes("base") || name.includes("stand")) fragmentType = "base";
  });

  return {
    fragmentType,
    symmetry: "radial", // fixed for now
    curvature: "outward", // simple assumption
    confidence: predictions[0].probability,
    rawPredictions: predictions
  };
}
