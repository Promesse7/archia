import React, { useRef, useState, useEffect } from "react";
import { classifyFragment } from "../ai/classifier";
import { getDepthEstimator } from "../ai/depthEstimator";

export default function CameraCapture({ onResult, modelsReady }) {
  const videoRef = useRef();
  const canvasRef = useRef();
  const fileInputRef = useRef();
  const containerRef = useRef();
  
  const [streamStarted, setStreamStarted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [cameraStatus, setCameraStatus] = useState("Ready");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showControls, setShowControls] = useState(true);
  const [orientation, setOrientation] = useState(
    window.screen.orientation?.type || 'landscape-primary'
  );

  // Handle window resize and orientation changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const handleOrientationChange = () => {
      setOrientation(window.screen.orientation?.type || 'landscape-primary');
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Toggle controls visibility (useful for mobile fullscreen)
  const toggleControls = () => {
    setShowControls(prev => !prev);
  };

  const startCamera = async () => {
    if (!modelsReady) {
      setError("AI models not ready yet. Please wait for loading to complete.");
      return;
    }

    setError(null);
    setCameraStatus("Requesting camera access...");

    try {
      console.log("Attempting to access camera...");

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser.");
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
      
      await new Promise((resolve, reject) => {
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          resolve();
        };
        
        videoRef.current.onerror = (e) => {
          console.error("Video error:", e);
          reject(new Error("Failed to load video stream"));
        };

        setTimeout(() => reject(new Error("Camera timeout")), 10000);
      });

      await videoRef.current.play();
      console.log("Video playing");

      setStreamStarted(true);
      setCameraStatus("Camera active");
      setError(null);

    } catch (err) {
      console.error("Camera error:", err);
      
      let userMessage = "Camera failed: ";
      
      if (err.name === "NotAllowedError") {
        userMessage += "Permission denied. Allow camera access.";
      } else if (err.name === "NotFoundError") {
        userMessage += "No camera found.";
      } else if (err.name === "NotReadableError") {
        userMessage += "Camera in use by another app.";
      } else {
        userMessage += err.message;
      }
      
      setError(userMessage);
      setCameraStatus("Error");
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
      console.log("🔍 Starting image processing...");

      // 1. Load models in parallel
      const [depthEstimator] = await Promise.all([
        getDepthEstimator().catch(err => {
          console.error("Depth estimator error:", err);
          throw new Error("Failed to load depth estimation model");
        })
      ]);

      // 2. Process classification and depth estimation in parallel
      const [classification, depthTensor] = await Promise.all([
        classifyFragment(imgElement).catch(err => {
          console.error("Classification error:", err);
          // Return a default classification if it fails
          return {
            fragmentType: "unknown",
            confidence: 0,
            probabilities: { rim: 0, body: 0, base: 0 },
            symmetry: "unknown",
            curvature: "unknown"
          };
        }),
        depthEstimator.estimateDepth(imgElement).catch(err => {
          console.error("Depth estimation error:", err);
          throw new Error("Failed to estimate depth");
        })
      ]);

      console.log("✅ Classification result:", classification);
      console.log("✅ Depth map computed:", depthTensor.shape);

      // 3. Convert depth to point cloud
      let pointCloud = [];
      try {
        pointCloud = depthEstimator.depthToPointCloud(depthTensor);
        console.log("✅ Point cloud generated:", pointCloud.length, "points");
      } catch (err) {
        console.error("Point cloud generation error:", err);
        // Continue with empty point cloud if generation fails
        pointCloud = [];
      }

      // 4. Get image data
      const dataUrl = imgElement.src || (canvasRef.current?.toDataURL("image/jpeg", 0.95) || '');

      // 5. Pass results to parent
      onResult({
        image: dataUrl,
        classification,
        depthMap: await depthTensor.array(),
        pointCloud,
        timestamp: Date.now()
      });

      // Clean up
      depthTensor.dispose();
      setCameraStatus("Processing complete");
      setProcessing(false);

    } catch (procErr) {
      console.error("❌ Processing error:", procErr);
      setError(`Processing failed: ${procErr.message}. Please try again.`);
      setCameraStatus("Error during processing");
      setProcessing(false);
      
      // Still notify parent with error state
      onResult({
        image: imgElement.src || '',
        error: procErr.message,
        timestamp: Date.now()
      });
    }
  };

  const captureFromCamera = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!video || !video.videoWidth || !video.videoHeight) {
      setError("Video not ready");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    const img = new Image();
    img.src = dataUrl;

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
        console.log("Stopped track:", track.label);
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
      onTouchStart={isMobile ? toggleControls : undefined}
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
        aspectRatio: isMobile && orientation.includes('portrait') ? '9/16' : '16/9',
        maxHeight: isMobile ? '70vh' : 'none',
        margin: '0 auto',
        touchAction: 'none'
      }}>
        {!streamStarted ? (
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
              {error ? 'Camera Error' : 'Camera is off'}
            </div>
            {error && (
              <div style={{ 
                color: '#ff6b6b',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.9rem',
                maxWidth: '100%',
                wordBreak: 'break-word',
                lineHeight: 1.4
              }}>
                {error}
              </div>
            )}
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
                touchAction: 'none',
                WebkitTapHighlightColor: 'transparent'
              }}
            />
            
            {/* Capture button overlay for mobile */}
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
                  transition: 'transform 0.1s, box-shadow 0.2s',
                  ':active': {
                    transform: 'translateX(-50%) scale(0.95)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                  }
                }}
              >
                <div style={{
                  width: '70%',
                  height: '70%',
                  borderRadius: '50%',
                  backgroundColor: '#f44336',
                  border: '2px solid rgba(255, 255, 255, 0.8)'
                }} />
              </div>
            )}
          </>
        )}
        
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'none',
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* Controls Section */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          transition: 'opacity 0.3s ease',
          opacity: isMobile && !showControls ? 0 : 1,
          pointerEvents: isMobile && !showControls ? 'none' : 'auto',
          padding: isMobile ? '0.5rem' : '0',
          marginTop: isMobile ? 'auto' : '0.5rem'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          padding: isMobile ? '0.5rem' : '0'
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
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                flex: isMobile ? '1 1 100%' : '0 0 auto',
                justifyContent: 'center',
                minHeight: '48px',
                ':hover': {
                  backgroundColor: modelsReady ? '#45a049' : '#777',
                  transform: modelsReady ? 'translateY(-1px)' : 'none',
                  boxShadow: modelsReady ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
                },
                ':active': {
                  transform: modelsReady ? 'translateY(1px)' : 'none',
                  boxShadow: 'none'
                }
              }}
            >
              <span>Start Camera</span>
              {!modelsReady && <span style={{ fontSize: '0.85em' }}>(Loading...)</span>}
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
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  minWidth: '180px',
                  justifyContent: 'center',
                  ':hover': {
                    backgroundColor: '#1976D2',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  },
                  ':active': {
                    transform: 'translateY(1px)',
                    boxShadow: 'none'
                  }
                }}
              >
                {processing ? (
                  <>
                    <span className="spinner"></span>
                    <span>Processing...</span>
                  </>
                ) : (
                  'Capture Fragment'
                )}
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
                fontSize: '0.95rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                minWidth: '140px',
                justifyContent: 'center',
                ':hover': {
                  backgroundColor: '#d32f2f',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                },
                ':active': {
                  transform: 'translateY(1px)',
                  boxShadow: 'none'
                }
              }}
            >
              Stop Camera
            </button>
          )}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          padding: isMobile ? '0.5rem' : '0'
        }}>
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
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: processing ? 0.7 : 1,
              transition: 'all 0.2s',
              flex: isMobile ? '1 1 100%' : '0 0 auto',
              justifyContent: 'center',
              ':hover': {
                opacity: processing ? 0.7 : 0.9,
                transform: processing ? 'none' : 'translateY(-1px)',
                boxShadow: processing ? 'none' : '0 2px 6px rgba(0,0,0,0.15)'
              },
              ':active': {
                transform: 'translateY(1px)',
                boxShadow: 'none'
              }
            }}
          >
            <span>📁 Upload Image</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={captureFromFile}
            style={{ display: 'none' }}
            capture={isMobile ? 'environment' : undefined}
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
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                flex: '1 1 100%',
                justifyContent: 'center',
                ':hover': {
                  backgroundColor: '#d32f2f',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                },
                ':active': {
                  transform: 'translateY(1px)',
                  boxShadow: 'none'
                }
              }}
            >
              <span>🛑 Stop Camera</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div style={{
        textAlign: 'center',
        color: '#aaa',
        fontSize: isMobile ? '0.8rem' : '0.85rem',
        padding: '0.5rem',
        minHeight: '1.5rem',
        opacity: isMobile && !showControls ? 0.7 : 1,
        transition: 'opacity 0.3s ease',
        backgroundColor: isMobile ? 'rgba(0,0,0,0.2)' : 'transparent',
        borderRadius: '4px',
        marginTop: 'auto'
      }}>
        {cameraStatus}
      </div>
      
      {/* Add some styles for the spinner */}
      <style jsx="true">{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}