import React, { useState, useEffect } from "react";
import CameraCapture from "./components/CameraCapture";
import ReconstructionViewer from "./components/ReconstructionViewer";
import LoadingScreen from "./components/LoadingScreen";
import { getPotteryReconstructor } from "./reconstruction/potteryRebuilder";
import { preloadModels } from "./ai/classifier";
import { getDepthEstimator } from "./ai/depthEstimator";

// Prevent double-loading in React StrictMode
let modelsStarted = false;

export default function App() {
  const [fragments, setFragments] = useState([]);
  const [currentFragment, setCurrentFragment] = useState(null);
  const [reconstructedMesh, setReconstructedMesh] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState("Initializing...");
  const [loadingError, setLoadingError] = useState(null);

  useEffect(() => {
    // Prevent duplicate loading in development
    if (modelsStarted) return;
    modelsStarted = true;

    async function loadModels() {
      try {
        let currentProgress = 0;

        // Stage 1: Depth Estimator (0-25%)
        setLoadingStage("Initializing depth estimator...");
        setLoadingProgress(5);
        
        await getDepthEstimator();
        
        setLoadingProgress(25);
        setLoadingStage("Depth estimator ready");

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 300));

        // Stage 2-4: MobileNet & Classifier (25-100%)
        setLoadingStage("Loading AI models...");
        
        const success = await preloadModels((progressData) => {
          // Map classifier progress (0-100) to our range (25-100)
          const mappedProgress = 25 + (progressData.percent * 0.75);
          setLoadingProgress(mappedProgress);
          setLoadingStage(progressData.stage);
        });

        if (success) {
          setLoadingProgress(100);
          setLoadingStage("All models loaded!");
          
          // Small delay before showing main app
          await new Promise(resolve => setTimeout(resolve, 500));
          
          setModelsLoaded(true);
        } else {
          throw new Error("Model initialization returned false");
        }

      } catch (err) {
        console.error("Model loading error:", err);
        setLoadingError(err.message);
        setLoadingStage("Failed to load models");
      }
    }

    loadModels();
  }, []);

  const handleCaptureResult = (result) => {
    console.log("Fragment captured:", result);
    setCurrentFragment(result);

    const newFragments = [...fragments, result];
    setFragments(newFragments);

    reconstructPottery(newFragments);
  };

  const reconstructPottery = (fragmentsList) => {
    try {
      const reconstructor = getPotteryReconstructor();
      reconstructor.clear();

      fragmentsList.forEach(fragment => {
        if (fragment.pointCloud && fragment.pointCloud.length > 0) {
          reconstructor.addFragment(fragment.pointCloud, {
            fragmentType: fragment.classification?.fragmentType,
            confidence: fragment.classification?.confidence
          });
        }
      });

      const mesh = reconstructor.reconstruct();
      setReconstructedMesh(mesh);

      console.log("Reconstruction complete:", reconstructor.getStats());
    } catch (err) {
      console.error("Reconstruction error:", err);
    }
  };

  const clearFragments = () => {
    setFragments([]);
    setCurrentFragment(null);
    setReconstructedMesh(null);
    getPotteryReconstructor().clear();
  };

  // Show loading screen
  if (!modelsLoaded) {
    return (
      <LoadingScreen 
        progress={loadingProgress}
        stage={loadingStage}
        error={loadingError}
      />
    );
  }

  // Main app
  return (
    <div style={{ 
      maxWidth: "1200px", 
      margin: "0 auto", 
      padding: "20px",
      fontFamily: "system-ui, sans-serif"
    }}>
      <header style={{ 
        textAlign: "center", 
        marginBottom: "32px",
        borderBottom: "2px solid #444",
        paddingBottom: "16px"
      }}>
        <h1 style={{ 
          fontSize: "2.5em", 
          margin: "0 0 8px 0",
          background: "linear-gradient(45deg, #c2a070, #8b6f47)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>
          🏺 ARCHIA
        </h1>
        <p style={{ 
          color: "#888", 
          margin: 0,
          fontSize: "1.1em"
        }}>
          AI-Powered Pottery Reconstruction
        </p>
      </header>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
        marginBottom: "24px"
      }}>
        {/* Camera Capture Section */}
        <div>
          <CameraCapture onResult={handleCaptureResult} modelsReady={modelsLoaded} />
        </div>

        {/* Current Fragment Info */}
        <div style={{
          border: "2px solid #444",
          borderRadius: "8px",
          padding: "16px",
          backgroundColor: "#1a1a1a"
        }}>
          <h3 style={{ marginTop: 0 }}>Latest Fragment</h3>
          
          {currentFragment ? (
            <div>
              <img 
                src={currentFragment.image} 
                alt="Captured fragment"
                style={{ 
                  width: "100%", 
                  borderRadius: "4px",
                  marginBottom: "12px"
                }} 
              />
              
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                fontSize: "0.9em"
              }}>
                <div>
                  <strong>Type:</strong><br />
                  <span style={{ 
                    color: getFragmentColor(currentFragment.classification?.fragmentType)
                  }}>
                    {currentFragment.classification?.fragmentType || "unknown"}
                  </span>
                </div>
                
                <div>
                  <strong>Confidence:</strong><br />
                  {(currentFragment.classification?.confidence * 100).toFixed(1)}%
                </div>
                
                <div>
                  <strong>Points:</strong><br />
                  {currentFragment.pointCloud?.length || 0}
                </div>
                
                <div>
                  <strong>Symmetry:</strong><br />
                  {currentFragment.classification?.symmetry || "N/A"}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              padding: "60px 20px",
              textAlign: "center",
              color: "#666"
            }}>
              No fragment captured yet
            </div>
          )}
        </div>
      </div>

      {/* 3D Reconstruction Viewer */}
      <div style={{
        border: "2px solid #444",
        borderRadius: "8px",
        padding: "16px",
        backgroundColor: "#1a1a1a",
        marginBottom: "24px"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px"
        }}>
          <h3 style={{ margin: 0 }}>3D Reconstruction</h3>
          
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => reconstructPottery(fragments)}
              disabled={fragments.length === 0}
              style={{
                padding: "6px 12px",
                fontSize: "0.9em",
                opacity: fragments.length === 0 ? 0.5 : 1
              }}
            >
              🔄 Rebuild
            </button>
            
            <button
              onClick={clearFragments}
              disabled={fragments.length === 0}
              style={{
                padding: "6px 12px",
                fontSize: "0.9em",
                opacity: fragments.length === 0 ? 0.5 : 1
              }}
            >
              🗑 Clear All
            </button>
          </div>
        </div>
        
        <div style={{ 
          height: "500px",
          borderRadius: "4px",
          backgroundColor: "#0a0a0a",
          position: "relative"
        }}>
          <ReconstructionViewer 
            mesh={reconstructedMesh} 
            pointCloud={currentFragment?.pointCloud}
            showPointCloud={false}
          />
          
          {fragments.length === 0 && (
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "#666",
              fontSize: "1.1em",
              textAlign: "center",
              pointerEvents: "none"
            }}>
              Capture fragments to begin reconstruction
            </div>
          )}
        </div>
      </div>

      {/* Fragment Gallery */}
      {fragments.length > 0 && (
        <div style={{
          border: "2px solid #444",
          borderRadius: "8px",
          padding: "16px",
          backgroundColor: "#1a1a1a"
        }}>
          <h3 style={{ marginTop: 0 }}>
            Fragment Gallery ({fragments.length})
          </h3>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: "12px"
          }}>
            {fragments.map((fragment, index) => (
              <div 
                key={fragment.timestamp}
                style={{
                  border: "1px solid #444",
                  borderRadius: "4px",
                  padding: "8px",
                  backgroundColor: "#222",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                }}
                onClick={() => setCurrentFragment(fragment)}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                <img 
                  src={fragment.image} 
                  alt={`Fragment ${index + 1}`}
                  style={{ 
                    width: "100%", 
                    borderRadius: "2px",
                    marginBottom: "4px"
                  }} 
                />
                <div style={{
                  fontSize: "0.75em",
                  textAlign: "center",
                  color: getFragmentColor(fragment.classification?.fragmentType)
                }}>
                  {fragment.classification?.fragmentType}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        marginTop: "32px",
        paddingTop: "16px",
        borderTop: "1px solid #444",
        textAlign: "center",
        color: "#666",
        fontSize: "0.9em"
      }}>
        <p>
          Powered by TensorFlow.js, MobileNet & Three.js<br />
          <small>FIRST LEGO League Research Project</small>
        </p>
      </footer>
    </div>
  );
}

function getFragmentColor(type) {
  const colors = {
    rim: "#4caf50",
    body: "#2196f3",
    base: "#ff9800",
    unknown: "#666"
  };
  return colors[type] || colors.unknown;
}