import React, { useState, useEffect } from "react";
import CameraCapture from "./components/CameraCapture";
import ReconstructionViewer from "./components/ReconstructionViewer";
import LoadingScreen from "./components/LoadingScreen";
import ErrorBoundary from "./components/ErrorBoundary";
import { getPotteryReconstructor } from "./reconstruction/potteryRebuilder";
import { preloadModels } from "./ai/classifier";
import { getDepthEstimator } from "./ai/depthEstimator";
import {
  AppShell,
  TopBar,
  MainContent,
  LeftPanel,
  RightPanel,
  ReconstructionSection,
  GallerySection,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  SectionHeader
} from "./components/ui";

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
    <AppShell>
      <TopBar>
        <div className="text-center">
          <p className="text-zinc-500">
            AI-Powered Pottery Reconstruction
          </p>
        </div>
      </TopBar>

      <MainContent>
        <LeftPanel>
          <Card>
            <CardHeader>
              <CardTitle>Camera Capture</CardTitle>
            </CardHeader>
            <CardContent>
              <CameraCapture onResult={handleCaptureResult} modelsReady={modelsLoaded} />
            </CardContent>
          </Card>
        </LeftPanel>

        <RightPanel>
          <Card>
            <CardHeader>
              <CardTitle>Latest Fragment</CardTitle>
            </CardHeader>
            <CardContent>

              {currentFragment ? (
                <div className="space-y-4">
                  <img
                    src={currentFragment.image || ''}
                    alt="Captured fragment"
                    className="w-full rounded-lg"
                  />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-zinc-500">Type:</span>
                      <div className="font-medium">
                        <Badge variant={getFragmentVariant(currentFragment.classification?.fragmentType)}>
                          {currentFragment.classification?.fragmentType || "unknown"}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <span className="text-zinc-500">Confidence:</span>
                      <div className="font-medium">
                        {((currentFragment.classification?.confidence || 0) * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div>
                      <span className="text-zinc-500">Points:</span>
                      <div className="font-medium">
                        {currentFragment.pointCloud?.length || 0}
                      </div>
                    </div>

                    <div>
                      <span className="text-zinc-500">Symmetry:</span>
                      <div className="font-medium">
                        {currentFragment.classification?.symmetry || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-500">
                  No fragment captured yet
                </div>
              )}
            </CardContent>
          </Card>
        </RightPanel>
      </MainContent>

      <ReconstructionSection>
        <Card>
          <CardHeader>
            <SectionHeader
              title="3D Reconstruction"
              description="View and interact with the reconstructed pottery"
              actions={
                <div className="flex space-x-2">
                  <Button
                    onClick={() => reconstructPottery(fragments)}
                    disabled={fragments.length === 0}
                    variant="outline"
                    size="sm"
                  >
                    Rebuild
                  </Button>

                  <Button
                    onClick={clearFragments}
                    disabled={fragments.length === 0}
                    variant="destructive"
                    size="sm"
                  >
                    Clear All
                  </Button>
                </div>
              }
            />
          </CardHeader>
          <CardContent>
            <div className="h-[500px] rounded-lg bg-zinc-950 relative overflow-hidden">
              <BrandMark variant="watermark" />
              <ErrorBoundary
                errorMessage="3D reconstruction viewer failed to load. Try capturing new fragments."
                onError={(error, errorInfo) => {
                  console.error('ReconstructionViewer error:', error, errorInfo);
                }}
              >
                <ReconstructionViewer
                  mesh={reconstructedMesh}
                  pointCloud={currentFragment?.pointCloud}
                  showPointCloud={false}
                />
              </ErrorBoundary>

              {fragments.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
                  <div className="text-center">
                    <p>Capture fragments to begin reconstruction</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </ReconstructionSection>

      {
        fragments.length > 0 && (
          <GallerySection>
            <Card>
              <CardHeader>
                <SectionHeader
                  title={`Fragment Gallery (${fragments.length})`}
                  description="Click fragments to view details"
                />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {fragments.map((fragment, index) => (
                    <div
                      key={fragment.timestamp || `fragment-${index}`}
                      onClick={() => setCurrentFragment(fragment)}
                      className="cursor-pointer rounded-lg border bg-card hover:bg-accent transition-colors p-2"
                    >
                      <img
                        src={fragment.image || ''}
                        alt={`Fragment ${index + 1}`}
                        className="w-full rounded mb-2"
                      />
                      <div className="text-center">
                        <Badge variant={getFragmentVariant(fragment.classification?.fragmentType)} className="text-xs">
                          {fragment.classification?.fragmentType || "Unknown"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </GallerySection>
        )
      }

      <footer className="mt-12 py-6 border-t text-center text-zinc-500 text-sm">
        <p>
          Powered by TensorFlow.js, MobileNet & Three.js
        </p>
        <p className="text-xs mt-1">
          FIRST LEGO League Research Project
        </p>
      </footer>
    </AppShell>
  );
}

function getFragmentVariant(type) {
  const variants = {
    rim: "success",
    body: "info",
    base: "warning",
    unknown: "secondary"
  };
  return variants[type] || variants.unknown;
}