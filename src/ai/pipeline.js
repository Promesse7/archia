import { setupCamera } from "./camera";
import { loadMobileNet, extractFeatures } from "./mobilenet";
import { createFragmentClassifier, classifyFragment } from "./fragmentClassifier";
import { reconstruct3D } from "./reconstruction3D";
import { adjustMesh } from "./meshAdjuster";

export async function startPipeline(videoElement) {
  await setupCamera(videoElement);
  await loadMobileNet();
  createFragmentClassifier();

  setInterval(async () => {
    const embedding = extractFeatures(videoElement);
    const fragmentType = classifyFragment(embedding);

    const features = embedding.dataSync();
    const pointCloud = reconstruct3D(fragmentType, features);
    const mesh = adjustMesh(pointCloud, fragmentType);

    console.log("Fragment:", fragmentType);
    console.log("Mesh:", mesh);

    embedding.dispose();
  }, 500);
}
