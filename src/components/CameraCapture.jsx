import React, { useRef, useState, useEffect } from "react";
import { classifyFragment } from "../ai/classifier";
import { getDepthEstimator } from "../ai/depthEstimator";

export default function CameraCapture({ onResult }) {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [streamStarted, setStreamStarted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [depthEstimator, setDepthEstimator] = useState(null);

  useEffect(() => {
    // Initialize depth estimator on mount
    getDepthEstimator().then(estimator => {
      setDepthEstimator(estimator);
      console.log("Depth estimator ready");
    });
  }, []);

  const startCamera = async () => {
    if (!streamStarted) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "environment",
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreamStarted(true);
      } catch (err) {
        console.error("Camera access error:", err);
        alert("Cannot access camera. Please grant permissions.");
      }
    }
  };

  const captureImage = async () => {
    if (!depthEstimator) {
      alert("Depth estimator not ready yet");
      return;
    }

    setProcessing(true);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      // Set canvas to match video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

      // Create image element for processing
      const img = new Image();
      img.src = dataUrl;

      img.onload = async () => {
        console.log("Processing fragment image...");

        // 1. Fragment classification
        const classification = await classifyFragment(img);
        console.log("Classification:", classification);

        // 2. Depth estimation
        const depthTensor = depthEstimator.estimateDepth(img);
        console.log("Depth map computed:", depthTensor.shape);

        // 3. Convert depth to point cloud
        const pointCloud = depthEstimator.depthToPointCloud(depthTensor);
        console.log("Point cloud generated:", pointCloud.length, "points");

        // 4. Pass results to parent
        onResult({
          image: dataUrl,
          classification,
          depthMap: await depthTensor.array(), // Convert to JS array for storage
          pointCloud,
          timestamp: Date.now()
        });

        // Clean up tensor
        depthTensor.dispose();
        setProcessing(false);
      };

      img.onerror = () => {
        console.error("Failed to load captured image");
        setProcessing(false);
      };

    } catch (err) {
      console.error("Capture error:", err);
      setProcessing(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setStreamStarted(false);
    }
  };

  return (
    <div style={{ 
      border: "2px solid #444", 
      borderRadius: "8px", 
      padding: "16px",
      backgroundColor: "#1a1a1a"
    }}>
      <h3 style={{ marginTop: 0 }}>Fragment Capture</h3>
      
      <div style={{ position: "relative", marginBottom: "12px" }}>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline
          muted
          style={{ 
            width: "100%", 
            maxWidth: "640px",
            borderRadius: "4px",
            backgroundColor: "#000",
            display: streamStarted ? "block" : "none"
          }} 
        />
        <canvas 
          ref={canvasRef} 
          style={{ display: "none" }} 
        />
        
        {!streamStarted && (
          <div style={{
            width: "100%",
            maxWidth: "640px",
            height: "300px",
            backgroundColor: "#000",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#666"
          }}>
            Camera not started
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {!streamStarted ? (
          <button 
            onClick={startCamera}
            style={{ flex: 1, minWidth: "120px" }}
          >
            📷 Start Camera
          </button>
        ) : (
          <>
            <button 
              onClick={captureImage}
              disabled={processing}
              style={{ 
                flex: 1, 
                minWidth: "120px",
                opacity: processing ? 0.5 : 1
              }}
            >
              {processing ? "⏳ Processing..." : "📸 Capture Fragment"}
            </button>
            <button 
              onClick={stopCamera}
              style={{ flex: 1, minWidth: "120px" }}
            >
              ⏹ Stop Camera
            </button>
          </>
        )}
      </div>

      {!depthEstimator && (
        <div style={{ 
          marginTop: "12px", 
          color: "#ff9800", 
          fontSize: "0.9em" 
        }}>
          ⚠ Loading AI models...
        </div>
      )}
    </div>
  );
}