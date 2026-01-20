import React, { useRef, useState, useEffect } from "react";
import { classifyFragment, getFragmentClassifier } from "../ai/classifier";
import { getDepthEstimator } from "../ai/depthEstimator";

export default function CameraCapture({ onResult }) {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [streamStarted, setStreamStarted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [depthEstimator, setDepthEstimator] = useState(null);
  const [classifier, setClassifier] = useState(null);
  const [error, setError] = useState(null);
  const [cameraStatus, setCameraStatus] = useState("Not started");
  const [isModelsReady, setIsModelsReady] = useState(false);

  useEffect(() => {
    // Initialize models on mount
    const initializeModels = async () => {
      setCameraStatus("Loading AI models...");
      
      try {
        // Initialize depth estimator
        const [estimator, classifierInstance] = await Promise.all([
          getDepthEstimator(),
          getFragmentClassifier()
        ]);
        
        setDepthEstimator(estimator);
        setClassifier(classifierInstance);
        setIsModelsReady(true);
        setCameraStatus("Ready to start camera");
        console.log("AI models loaded successfully");
      } catch (err) {
        console.error("Failed to load AI models:", err);
        setError("Failed to load AI models: " + err.message);
        setCameraStatus("Error loading models");
      }
    };
    
    initializeModels();
  }, []);

  const startCamera = async () => {
    setError(null);
    setCameraStatus("Requesting camera access...");

    try {
      console.log("Attempting to access camera...");

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser. Please use Chrome, Firefox, or Edge.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      console.log("Camera access granted:", stream);

      if (!videoRef.current) {
        throw new Error("Video element not found");
      }

      videoRef.current.srcObject = stream;
      
      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          resolve();
        };
        
        videoRef.current.onerror = (e) => {
          console.error("Video error:", e);
          reject(new Error("Failed to load video stream"));
        };

        // Timeout after 10 seconds
        setTimeout(() => reject(new Error("Camera timeout - took too long to start")), 10000);
      });

      await videoRef.current.play();
      console.log("Video playing");

      setStreamStarted(true);
      setCameraStatus("Camera active");
      setError(null);

    } catch (err) {
      console.error("Camera error:", err);
      
      let userMessage = "Camera failed to start: ";
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        userMessage += "Permission denied. Please allow camera access in your browser settings.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        userMessage += "No camera found. Please connect a camera and try again.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        userMessage += "Camera is already in use by another application. Please close other apps using the camera.";
      } else if (err.name === "OverconstrainedError") {
        userMessage += "Camera doesn't support the requested settings. Trying fallback...";
        
        // Try again with minimal constraints
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          videoRef.current.srcObject = fallbackStream;
          await videoRef.current.play();
          setStreamStarted(true);
          setCameraStatus("Camera active (fallback mode)");
          return;
        } catch (fallbackErr) {
          userMessage += " Fallback also failed: " + fallbackErr.message;
        }
      } else if (err.message.includes("secure context")) {
        userMessage += "Camera requires HTTPS or localhost. Please use http://localhost:5173 instead of an IP address.";
      } else {
        userMessage += err.message;
      }
      
      setError(userMessage);
      setCameraStatus("Error");
    }
  };

  const captureImage = async () => {
    if (!depthEstimator || !classifier) {
      setError("AI models not fully loaded yet. Please wait...");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (!video || !video.videoWidth || !video.videoHeight) {
        throw new Error("Video not ready - dimensions are 0");
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

      const img = new Image();
      img.src = dataUrl;

      img.onload = async () => {
        console.log("Processing fragment image...");

        try {
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
            depthMap: await depthTensor.array(),
            pointCloud,
            timestamp: Date.now()
          });

          depthTensor.dispose();
          setProcessing(false);
          setError(null);

        } catch (procErr) {
          console.error("Processing error:", procErr);
          setError("Failed to process image: " + procErr.message);
          setProcessing(false);
        }
      };

      img.onerror = () => {
        console.error("Failed to load captured image");
        setError("Failed to load captured image");
        setProcessing(false);
      };

    } catch (err) {
      console.error("Capture error:", err);
      setError("Capture failed: " + err.message);
      setProcessing(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => {
        track.stop();
        console.log("Stopped track:", track.label);
      });
      videoRef.current.srcObject = null;
      setStreamStarted(false);
      setCameraStatus("Camera stopped");
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
      
      {/* Status indicator */}
      <div style={{
        marginBottom: "12px",
        padding: "8px",
        borderRadius: "4px",
        backgroundColor: error ? "#5d1a1a" : streamStarted ? "#1a5d1a" : "#5d5d1a",
        fontSize: "0.9em",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}>
        <span style={{ fontSize: "1.2em" }}>
          {error ? "❌" : streamStarted ? "✅" : "⏳"}
        </span>
        <span>{error ? "Error" : cameraStatus}</span>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          marginBottom: "12px",
          padding: "12px",
          borderRadius: "4px",
          backgroundColor: "#3d1a1a",
          border: "1px solid #d32f2f",
          fontSize: "0.85em",
          lineHeight: "1.4"
        }}>
          <strong>⚠️ Error:</strong><br />
          {error}
        </div>
      )}
      
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
            flexDirection: "column",
            gap: "12px",
            color: "#666"
          }}>
            <div style={{ fontSize: "3em" }}>📷</div>
            <div>Camera not started</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {!streamStarted ? (
          <button 
            onClick={startCamera}
            disabled={!depthEstimator}
            style={{ 
              flex: 1, 
              minWidth: "120px",
              opacity: !depthEstimator ? 0.5 : 1
            }}
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
    </div>
  );
}