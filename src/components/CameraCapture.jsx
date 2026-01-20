import React, { useRef, useState } from "react";
import { classifyFragment } from "../ai/classifier";

export default function CameraCapture({ onResult }) {
  const videoRef = useRef();
  const [streamStarted, setStreamStarted] = useState(false);

  const startCamera = async () => {
    if (!streamStarted) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
    const imgElement = new Image();
    imgElement.src = dataUrl;

    imgElement.onload = async () => {
      const result = await classifyFragment(imgElement);
      onResult({ image: dataUrl, classification: result });
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
