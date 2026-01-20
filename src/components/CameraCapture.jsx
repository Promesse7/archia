import React, { useRef, useState, useEffect } from "react";
import { classifyFragment } from "../ai/classifier";
import { loadDepthModel, estimateDepth } from "../ai/depthEstimator";
import { depthToPointCloud } from "../reconstruction/depthToPointCloud";

export default function CameraCapture({ onResult }) {
  const videoRef = useRef();
  const [streamStarted, setStreamStarted] = useState(false);

  useEffect(() => {
    loadDepthModel(); // load once on mount
  }, []);

  const startCamera = async () => {
    if (!streamStarted) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      videoRef.current.srcObject = stream;
      setStreamStarted(true);
    }
  };

  const captureImage = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg");
    const img = new Image();
    img.src = dataUrl;

    img.onload = async () => {
      // 1. Fragment classification
      const classification = await classifyFragment(img);

      // 2. Depth estimation
      const depthTensor = estimateDepth(img);

      // 3. Convert depth → 3D point cloud
      const pointCloud = depthToPointCloud(depthTensor);

      onResult({
        image: dataUrl,
        classification,
        depthMap: depthTensor,
        pointCloud
      });

      depthTensor.dispose();
    };
  };

  return (
    <div>
      <video ref={videoRef} autoPlay style={{ width: "300px" }} />
      <div>
        <button onClick={startCamera}>Start Camera</button>
        <button onClick={captureImage}>Capture Fragment</button>
      </div>
    </div>
  );
}
