import React, { useRef, useState, useEffect } from "react";
import { classifyFragment } from "../ai/classifier";
import { getDepthEstimator } from "../ai/depthEstimator";

export default function CameraCapture({ onResult, modelsReady }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  
  const [streamStarted, setStreamStarted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [cameraStatus, setCameraStatus] = useState("Ready");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showControls, setShowControls] = useState(true);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const toggleControls = () => {
    setShowControls(prev => !prev);
  };

  const startCamera = async () => {
    // CRITICAL: Ensure video ref exists BEFORE making async call
    if (!videoRef.current) {
      setError("Video element not initialized. Please refresh the page.");
      setCameraStatus("Video element error");
      return;
    }

    if (!modelsReady) {
      setError("AI models not ready yet. Please wait for loading to complete.");
      return;
    }

    setError(null);
    setCameraStatus("Requesting camera access...");

    try {
      console.log("📹 Starting camera...");

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        },
        audio: false
      });

      console.log("✅ Camera access granted");

      // Double-check ref still exists
      if (!videoRef.current) {
        stream.getTracks().forEach(track => track.stop());
        throw new Error("Video element lost after camera request");
      }

      videoRef.current.srcObject = stream;
      
      // Wait for metadata to load
      await new Promise((resolve, reject) => {
        const video = videoRef.current;
        if (!video) {
          reject(new Error("Video element disappeared"));
          return;
        }

        const onLoadedMetadata = () => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          clearTimeout(timeoutId);
          resolve();
        };

        const onError = (e) => {
          console.error("Video stream error:", e);
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          clearTimeout(timeoutId);
          reject(new Error("Failed to load video stream"));
        };

        const timeoutId = setTimeout(() => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('error', onError);
          reject(new Error("Camera timeout - metadata never loaded"));
        }, 10000);

        video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
        video.addEventListener('error', onError, { once: true });
      });

      // Play video
      if (videoRef.current) {
        console.log("Video element before play:", {
          srcObject: !!videoRef.current.srcObject,
          videoWidth: videoRef.current.videoWidth,
          videoHeight: videoRef.current.videoHeight,
          readyState: videoRef.current.readyState
        });
        
        // Force video to be visible for debugging
        videoRef.current.style.display = 'block';
        videoRef.current.style.visibility = 'visible';
        
        await videoRef.current.play();
        
        console.log("Video element after play:", {
          videoWidth: videoRef.current.videoWidth,
          videoHeight: videoRef.current.videoHeight,
          currentTime: videoRef.current.currentTime,
          paused: videoRef.current.paused,
          srcObject: !!videoRef.current.srcObject
        });
        
        // Add a small delay to ensure video is actually playing
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if video is actually playing
        if (videoRef.current.paused) {
          console.warn("Video is still paused after play() call");
        } else {
          console.log("Video is playing successfully");
        }
        
        setStreamStarted(true);
        setCameraStatus("Camera active");
        setError(null);
        console.log("✅ Camera ready");
      }

    } catch (err) {
      console.error("❌ Camera error:", err);
      
      let userMessage = "Camera failed: ";
      if (err.name === "NotAllowedError") {
        userMessage += "Permission denied. Allow camera access in browser settings.";
      } else if (err.name === "NotFoundError") {
        userMessage += "No camera found on this device.";
      } else if (err.name === "NotReadableError") {
        userMessage += "Camera is in use by another app.";
      } else {
        userMessage += err.message;
      }
      
      setError(userMessage);
      setCameraStatus("Camera error");
    }
  };

  const processImage = async (imgElement) => {
    if (!modelsReady) {
      setError("AI models not ready yet. Please wait...");
      return;
    }

    setProcessing(true);
    setError(null);
    setCameraStatus("Processing image...");

    try {
      console.log("🔍 Processing image...");

      const depthEstimator = await getDepthEstimator();
      const classification = await classifyFragment(imgElement);
      const depthTensor = await depthEstimator.estimateDepth(imgElement);

      console.log("✅ Classification:", classification);

      let pointCloud = [];
      try {
        pointCloud = depthEstimator.depthToPointCloud(depthTensor);
        console.log(`✅ Point cloud: ${pointCloud.length} points`);
      } catch (err) {
        console.error("Point cloud error:", err);
      }

      const dataUrl = imgElement.src || canvasRef.current?.toDataURL("image/jpeg", 0.95) || '';

      onResult({
        image: dataUrl,
        classification,
        depthMap: await depthTensor.array(),
        pointCloud,
        timestamp: Date.now()
      });

      depthTensor.dispose();
      setCameraStatus("Processing complete");

    } catch (procErr) {
      console.error("❌ Processing error:", procErr);
      setError(`Processing failed: ${procErr.message}`);
      
      onResult({
        image: imgElement.src || '',
        error: procErr.message,
        timestamp: Date.now()
      });
    } finally {
      setProcessing(false);
    }
  };

  const captureFromCamera = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!video?.videoWidth || !video?.videoHeight) {
      setError("Video not ready - try restarting the camera");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.src = canvas.toDataURL("image/jpeg", 0.95);

    img.onload = () => processImage(img);
    img.onerror = () => setError("Failed to load captured image");
  };

  const captureFromFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => processImage(img);
      img.onerror = () => setError("Failed to load uploaded image");
    };

    reader.onerror = () => setError("Failed to read file");
    reader.readAsDataURL(file);
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => {
        track.stop();
        console.log("🛑 Stopped track:", track.label);
      });
      videoRef.current.srcObject = null;
      setStreamStarted(false);
      setCameraStatus("Camera stopped");
    }
  };

  return (
    <div 
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        height: '100%',
        position: 'relative',
        touchAction: 'manipulation'
      }}
    >
      {/* Camera Preview Area */}
      <div style={{
        position: 'relative',
        width: '100%',
        flex: '1 1 auto',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        aspectRatio: isMobile ? '9/16' : '16/9',
        maxHeight: isMobile ? '70vh' : 'none',
        margin: '0 auto',
        touchAction: 'none'
      }}>
        {/* Video Element - positioned inside preview area */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: streamStarted ? 1 : 0,
            borderRadius: '8px',
            backgroundColor: '#000',
            zIndex: 1,
            transform: 'scaleX(-1)', // Mirror the video for better UX
            transition: 'opacity 0.3s ease'
          }}
        />

        {!streamStarted && !error ? (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#888',
            padding: '1.5rem',
            textAlign: 'center',
            gap: '1rem'
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>
              Camera is off
            </div>
          </div>
        ) : error ? (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#888',
            padding: '1.5rem',
            textAlign: 'center',
            gap: '1rem'
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>
              Camera Error
            </div>
            <div style={{ 
              color: '#ff6b6b',
              backgroundColor: 'rgba(255, 0, 0, 0.1)',
              padding: '0.75rem',
              borderRadius: '6px',
              fontSize: '0.9rem',
              maxWidth: '100%',
              wordBreak: 'break-word'
            }}>
              {error}
            </div>
          </div>
        ) : (
          <>
            {/* Canvas for capturing (hidden) */}
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                display: 'none'
              }}
            />
            
            {/* Capture Button (Mobile) */}
            {isMobile && showControls && (
              <div 
                onClick={captureFromCamera}
                style={{
                  position: 'absolute',
                  bottom: '2rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '3px solid rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                  zIndex: 10
                }}
              >
                <div style={{
                  width: '70%',
                  height: '70%',
                  borderRadius: '50%',
                  backgroundColor: '#f44336'
                }} />
              </div>
            )}

            {/* Mirror effect overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              borderRadius: '8px',
              pointerEvents: 'none'
            }} />
          </>
        )}
      </div>

      {/* Controls Section */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          transition: 'opacity 0.3s ease',
          opacity: isMobile && !showControls ? 0 : 1,
          pointerEvents: isMobile && !showControls ? 'none' : 'auto'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}>
          {!streamStarted ? (
            <button
              onClick={startCamera}
              disabled={processing || !modelsReady}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: modelsReady ? '#4CAF50' : '#777',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: modelsReady ? 'pointer' : 'not-allowed',
                fontSize: isMobile ? '1rem' : '0.95rem',
                fontWeight: '500',
                flex: isMobile ? '1 1 100%' : '0 0 auto'
              }}
            >
              📷 Start Camera
            </button>
          ) : (
            !isMobile && (
              <button
                onClick={captureFromCamera}
                disabled={processing}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '500'
                }}
              >
                {processing ? '⏳ Processing...' : '📸 Capture'}
              </button>
            )
          )}

          {streamStarted && !isMobile && (
            <button
              onClick={stopCamera}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.95rem'
              }}
            >
              🛑 Stop
            </button>
          )}
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={processing}
          style={{
            padding: '0.65rem 1.25rem',
            backgroundColor: '#555',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: isMobile ? '0.9rem' : '0.85rem',
            flex: isMobile ? '1 1 100%' : '0 0 auto'
          }}
        >
          📁 Upload Image
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={captureFromFile}
          style={{ display: 'none' }}
        />

        {isMobile && streamStarted && (
          <button
            onClick={stopCamera}
            style={{
              padding: '0.65rem 1.25rem',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              flex: '1 1 100%'
            }}
          >
            🛑 Stop Camera
          </button>
        )}
      </div>

      {/* Status Bar */}
      <div style={{
        textAlign: 'center',
        color: '#aaa',
        fontSize: '0.85rem',
        padding: '0.5rem',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: '4px'
      }}>
        {cameraStatus}
      </div>
    </div>
  );
}