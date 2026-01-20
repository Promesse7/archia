import React, { useState } from "react";
import CameraCapture from "./components/CameraCapture";
import ReconstructionViewer from "./components/ReconstructionViewer";
import { classifyFragment } from "./ai/classifier";

export default function App() {
  const [fragmentImage, setFragmentImage] = useState(null);
  const [classification, setClassification] = useState(null);

  const handleCapture = async (dataUrl) => {
    setFragmentImage(dataUrl);
    const result = await classifyFragment(dataUrl);
    setClassification(result);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>AI Pottery Rebuilder Demo</h1>
      <CameraCapture onCapture={handleCapture} />
      {fragmentImage && (
        <div>
          <h3>Captured Fragment</h3>
          <img src={fragmentImage} width={150} />
          <pre>{JSON.stringify(classification, null, 2)}</pre>
        </div>
      )}
      <h3>3D Reconstruction</h3>
      <div style={{ height: "400px" }}>
        <ReconstructionViewer />
      </div>
    </div>
  );
}
