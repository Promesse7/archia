import React, { useState, useEffect } from "react";
import CameraCapture from "./components/CameraCapture";
import EnhancedReconstructionViewer from "./components/EnhancedReconstructionViewer";
import LoadingScreen from "./components/LoadingScreen";
import { getEnhancedPipeline } from "./pipeline/enhancedPipeline";
import { getPotteryReconstructor } from "./reconstruction/potteryRebuilder";

let pipelineStarted = false;

export default function App() {
  const [fragments, setFragments] = useState([]);
  const [currentFragment, setCurrentFragment] = useState(null);
  const [reconstructedMesh, setReconstructedMesh] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState("Initializing...");
  const [loadingError, setLoadingError] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(null);

  useEffect(() => {
    if (pipelineStarted) return;
    pipelineStarted = true;

    async function loadModels() {
      try {
        setLoadingStage("Loading pottery reconstruction pipeline...");
        setLoadingProgress(10);

        const pipeline = await getEnhancedPipeline((progress) => {
          setLoadingProgress(progress.percent);
          setLoadingStage(progress.stage);
        });

        setLoadingProgress(100);
        setLoadingStage("All systems ready!");

        await new Promise((resolve) => setTimeout(resolve, 500));
        setModelsLoaded(true);
      } catch (err) {
        console.error("Pipeline loading error:", err);
        setLoadingError(err.message);
        setLoadingStage("Failed to load pipeline");
      }
    }

    loadModels();
  }, []);

  const handleCaptureResult = async (result) => {
    console.log("Fragment captured:", result);

    if (result.error) {
      console.error("Capture error:", result.error);
      return;
    }

    try {
      setProcessingProgress({ stage: "Processing fragment...", percent: 0 });

      const pipeline = await getEnhancedPipeline((progress) => {
        setProcessingProgress(progress);
      });

      // Create temporary image element for processing
      const img = new Image();
      img.src = result.image;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Process through enhanced pipeline
      const processedResult = await pipeline.processFrame(img);

      const fragmentData = {
        image: result.image,
        classification: processedResult.classification,
        pointCloud: processedResult.pointCloud,
        pointCloudData: {
          points: processedResult.pointCloud,
          count: processedResult.pointCount,
        },
        depthMap: processedResult.depthMap,
        timestamp: processedResult.timestamp,
        processingTime: processedResult.processingTime,
      };

      setCurrentFragment(fragmentData);

      const newFragments = [...fragments, fragmentData];
      setFragments(newFragments);

      // Update reconstruction
      reconstructPottery(newFragments);

      setProcessingProgress(null);
    } catch (err) {
      console.error("Processing error:", err);
      setProcessingProgress(null);
    }
  };

  const reconstructPottery = (fragmentsList) => {
    try {
      const reconstructor = getPotteryReconstructor();
      reconstructor.clear();

      fragmentsList.forEach((fragment) => {
        if (fragment.pointCloud && fragment.pointCloud.length > 0) {
          reconstructor.addFragment(fragment.pointCloud, {
            fragmentType: fragment.classification?.fragmentType,
            confidence: fragment.classification?.confidence,
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

  if (!modelsLoaded) {
    return (
      <LoadingScreen
        progress={loadingProgress}
        stage={loadingStage}
        error={loadingError}
      />
    );
  }

  return (
    <div
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        backgroundColor: "#0f0f0f",
        color: "#fff",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <header
        style={{
          textAlign: "center",
          marginBottom: "32px",
          paddingBottom: "16px",
          borderBottom: "2px solid #333",
        }}
      >
        <h1
          style={{
            fontSize: "2.8em",
            margin: "0 0 8px 0",
            background: "linear-gradient(135deg, #c2a070, #8b6f47)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontWeight: "800",
            letterSpacing: "-1px",
          }}
        >
          🏺 ARCHIA v2.0
        </h1>
        <p style={{ color: "#aaa", margin: 0, fontSize: "1.1em" }}>
          AI-Powered Pottery Reconstruction with MiDaS Depth Estimation
        </p>
      </header>

      {/* Processing Progress */}
      {processingProgress && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(0, 0, 0, 0.95)",
            border: "2px solid #c2a070",
            borderRadius: "12px",
            padding: "32px",
            textAlign: "center",
            zIndex: 1000,
            minWidth: "320px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
          }}
        >
          <h3 style={{ marginTop: 0, color: "#c2a070" }}>
            {processingProgress.stage}
          </h3>
          <div
            style={{
              width: "100%",
              height: "8px",
              backgroundColor: "#333",
              borderRadius: "4px",
              overflow: "hidden",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                width: `${processingProgress.percent}%`,
                height: "100%",
                background: "linear-gradient(90deg, #c2a070, #8b6f47)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <div style={{ color: "#aaa" }}>
            {processingProgress.percent.toFixed(0)}%
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        {/* Camera Capture */}
        <div
          style={{
            border: "2px solid #333",
            borderRadius: "12px",
            overflow: "hidden",
            backgroundColor: "#1a1a1a",
          }}
        >
          <CameraCapture
            onResult={handleCaptureResult}
            modelsReady={modelsLoaded}
          />
        </div>

        {/* Fragment Info */}
        <div
          style={{
            border: "2px solid #333",
            borderRadius: "12px",
            padding: "20px",
            backgroundColor: "#1a1a1a",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#c2a070" }}>
            Latest Fragment
          </h3>

          {currentFragment ? (
            <div>
              <img
                src={currentFragment.image}
                alt="Captured fragment"
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  marginBottom: "16px",
                }}
              />

              <div style={{ display: "grid", gap: "8px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#222",
                      padding: "12px",
                      borderRadius: "6px",
                    }}
                  >
                    <div style={{ color: "#aaa", fontSize: "0.85em" }}>Type</div>
                    <div
                      style={{
                        color: getFragmentColor(
                          currentFragment.classification?.fragmentType
                        ),
                        fontWeight: "bold",
                        fontSize: "1.1em",
                      }}
                    >
                      {currentFragment.classification?.fragmentType || "unknown"}
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: "#222",
                      padding: "12px",
                      borderRadius: "6px",
                    }}
                  >
                    <div style={{ color: "#aaa", fontSize: "0.85em" }}>
                      Confidence
                    </div>
                    <div style={{ fontWeight: "bold", fontSize: "1.1em" }}>
                      {(
                        (currentFragment.classification?.confidence || 0) * 100
                      ).toFixed(1)}
                      %
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "#222",
                    padding: "12px",
                    borderRadius: "6px",
                  }}
                >
                  <div style={{ color: "#aaa", fontSize: "0.85em" }}>
                    Processing Time
                  </div>
                  <div style={{ fontWeight: "bold" }}>
                    {currentFragment.processingTime?.toFixed(0) || 0}ms
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "#222",
                    padding: "12px",
                    borderRadius: "6px",
                  }}
                >
                  <div style={{ color: "#aaa", fontSize: "0.85em" }}>
                    Points
                  </div>
                  <div style={{ fontWeight: "bold" }}>
                    {currentFragment.pointCloud?.length?.toLocaleString() || 0}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "#666",
              }}
            >
              No fragment captured yet
            </div>
          )}
        </div>
      </div>

      {/* 3D Viewer */}
      <div
        style={{
          border: "2px solid #333",
          borderRadius: "12px",
          padding: "20px",
          backgroundColor: "#1a1a1a",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h3 style={{ margin: 0, color: "#c2a070" }}>3D Reconstruction</h3>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => reconstructPottery(fragments)}
              disabled={fragments.length === 0}
              style={{
                padding: "8px 16px",
                backgroundColor: fragments.length > 0 ? "#c2a070" : "#555",
                color: "#000",
                border: "none",
                borderRadius: "6px",
                cursor: fragments.length > 0 ? "pointer" : "not-allowed",
                fontWeight: "bold",
                fontSize: "0.9em",
              }}
            >
              🔄 Rebuild
            </button>

            <button
              onClick={clearFragments}
              disabled={fragments.length === 0}
              style={{
                padding: "8px 16px",
                backgroundColor: fragments.length > 0 ? "#f44336" : "#555",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: fragments.length > 0 ? "pointer" : "not-allowed",
                fontWeight: "bold",
                fontSize: "0.9em",
              }}
            >
              🗑 Clear
            </button>
          </div>
        </div>

        <div style={{ height: "500px", borderRadius: "8px" }}>
          <EnhancedReconstructionViewer
            pointCloudData={
              currentFragment?.pointCloudData || null
            }
            depthMap={currentFragment?.depthMap || null}
            classification={currentFragment?.classification || null}
            showPointCloud={true}
            showMesh={true}
            autoRotate={true}
          />
        </div>
      </div>

      {/* Fragment Gallery */}
      {fragments.length > 0 && (
        <div
          style={{
            border: "2px solid #333",
            borderRadius: "12px",
            padding: "20px",
            backgroundColor: "#1a1a1a",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#c2a070" }}>
            Fragment Gallery ({fragments.length})
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
              gap: "12px",
            }}
          >
            {fragments.map((fragment, index) => (
              <div
                key={fragment.timestamp}
                onClick={() => setCurrentFragment(fragment)}
                style={{
                  border: "2px solid #333",
                  borderRadius: "8px",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  transform: "scale(1)",
                  opacity: 0.8,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.borderColor = "#c2a070";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.opacity = "0.8";
                  e.currentTarget.style.borderColor = "#333";
                }}
              >
                <img
                  src={fragment.image}
                  alt={`Fragment ${index + 1}`}
                  style={{ width: "100%", aspectRatio: "1" }}
                />
                <div
                  style={{
                    padding: "6px",
                    backgroundColor: "#222",
                    textAlign: "center",
                    fontSize: "0.75em",
                    color:
                      getFragmentColor(
                        fragment.classification?.fragmentType
                      ) || "#aaa",
                  }}
                >
                  {fragment.classification?.fragmentType || "?"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        style={{
          marginTop: "32px",
          paddingTop: "16px",
          borderTop: "1px solid #333",
          textAlign: "center",
          color: "#666",
          fontSize: "0.9em",
        }}
      >
        <p>
          Enhanced with MiDaS Depth Estimation | Powered by TensorFlow.js &
          Three.js
        </p>
        <p style={{ fontSize: "0.85em", marginTop: "4px" }}>
          FIRST LEGO League Research Project
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
    unknown: "#888",
  };
  return colors[type] || colors.unknown;
}