import React, { useState, useEffect } from "react";
import CameraCapture from "./components/CameraCapture";
import ReconstructionViewer from "./components/ReconstructionViewer";
import { getPotteryReconstructor } from "./reconstruction/potteryRebuilder";
import { preloadModels } from "./ai/classifier";
import { getDepthEstimator } from "./ai/depthEstimator";

export default function App() {
  const [fragments, setFragments] = useState([]);
  const [currentFragment, setCurrentFragment] = useState(null);
  const [reconstructedMesh, setReconstructedMesh] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState("Initializing...");

  // Preload all AI models on app startup
  useEffect(() => {
    async function loadModels() {
      try {
        setLoadingProgress("Loading TensorFlow.js...");
        
        // Load depth estimator
        setLoadingProgress("Loading depth estimator...");
        await getDepthEstimator();
        
        // Load classifier (includes MobileNet)
        setLoadingProgress("Loading MobileNet (16MB - may take 30-60 sec)...");
        const success = await preloadModels();
        
        if (success) {
          setLoadingProgress("All models loaded!");
          setModelsLoaded(true);
        } else {
          setLoadingProgress("Failed to load models - see console");
        }
      } catch (err) {
        console.error("Model loading error:", err);
        setLoadingProgress("Error: " + err.message);
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

  // Show loading screen while models are loading
  if (!modelsLoaded) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1a1a1a",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        padding: "20px"
      }}>
        <div style={{
          fontSize: "4em",
          marginBottom: "20px",
          animation: "spin 2s linear infinite"
        }}>
          🏺
        </div>
        
        <h2 style={{ margin: "0 0 12px 0" }}>Loading ARCHIA</h2>
        
        <div style={{
          width: "300px",
          height: "4px",
          backgroundColor: "#333",
          borderRadius: "2px",
          overflow: "hidden",
          marginBottom: "12px"
        }}>
          <div style={{
            width: "100%",
            height: "100%",
            background: "linear-gradient(90deg, #c2a070, #8b6f47)",
            animation: "loading 1.5s ease-in-out infinite"
          }} />
        </div>
        
        <p style={{ 
          color: "#888", 
          fontSize: "0.9em",
          textAlign: "center",
          maxWidth: "400px"
        }}>
          {loadingProgress}
        </p>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes loading {
            0%, 100% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

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
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          flex: 1,
          minHeight: 0,
          '@media (min-width: 768px)': {
            flexDirection: 'row',
            '> *': {
              flex: 1,
              minWidth: 0
            }
          }
        }}>
          {/* Camera Section */}
          <div style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            padding: '1rem',
            flex: '1 1 50%',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '50vh',
            order: 1
          }}>
            <h2 style={{ marginTop: 0 }}>Camera</h2>
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              minHeight: 0
            }}>
              <CameraCapture 
                onResult={handleCaptureResult} 
                modelsReady={modelsLoaded}
              />
            </div>
          </div>

          {/* 3D Reconstruction Section */}
          <div style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            padding: '1rem',
            flex: '1 1 50%',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '50vh',
            order: 3,
            '@media (min-width: 768px)': {
              order: 2
            }
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <h2 style={{ margin: 0 }}>3D Reconstruction</h2>
              <button
                onClick={clearFragments}
                disabled={fragments.length === 0}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  opacity: fragments.length === 0 ? 0.5 : 1,
                  pointerEvents: fragments.length === 0 ? 'none' : 'auto',
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap'
                }}
              >
                Clear All
              </button>
            </div>
            <div style={{
              flex: 1,
              minHeight: '300px',
              backgroundColor: '#1a1a1a',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative',
              touchAction: 'none',
              WebkitTapHighlightColor: 'transparent'
            }}>
              <ReconstructionViewer 
                fragments={fragments}
                currentFragment={currentFragment}
                reconstructedMesh={reconstructedMesh}
              />
            </div>
          </div>

          {/* Fragments Gallery - Moves below on mobile */}
          {fragments.length > 0 && (
            <div style={{
              backgroundColor: '#2a2a2a',
              borderRadius: '8px',
              padding: '1rem',
              order: 2,
              '@media (min-width: 768px)': {
                order: 3,
                gridColumn: '1 / -1'
              }
            }}>
              <h3>Captured Fragments ({fragments.length})</h3>
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                overflowX: 'auto',
                padding: '0.5rem 0.25rem',
                scrollbarWidth: 'thin',
                scrollbarColor: '#555 #2a2a2a',
                WebkitOverflowScrolling: 'touch',
                '&::-webkit-scrollbar': {
                  height: '6px'
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#555',
                  borderRadius: '3px'
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#2a2a2a',
                  borderRadius: '3px'
                }
              }}>
                {fragments.map((fragment, index) => (
                  <div 
                    key={index}
                    style={{
                      flex: '0 0 auto',
                      width: '80px',
                      height: '80px',
                      backgroundColor: '#1a1a1a',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      position: 'relative',
                      border: currentFragment === fragment ? '2px solid #4CAF50' : '1px solid #444',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, border-color 0.2s',
                      ':active': {
                        transform: 'scale(0.95)'
                      },
                      '@media (min-width: 480px)': {
                        width: '100px',
                        height: '100px'
                      }
                    }}
                    onClick={() => setCurrentFragment(fragment)}
                  >
                    {fragment.imageData && (
                      <img 
                        src={fragment.imageData} 
                        alt={`Fragment ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          opacity: 0.9
                        }}
                        draggable="false"
                      />
                    )}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      padding: '2px 4px',
                      fontSize: '0.65rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      minHeight: '20px',
                      '@media (min-width: 480px)': {
                        fontSize: '0.7rem'
                      }
                    }}>
                      <span>#{index + 1}</span>
                      {fragment.classification && (
                        <span style={{ 
                          color: getFragmentColor(fragment.classification.fragmentType),
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          marginLeft: '4px',
                          maxWidth: '60%'
                        }}>
                          {fragment.classification.fragmentType}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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

     <div/>
      <div/>
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