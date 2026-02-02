import React, { useState, useEffect } from "react";
import CameraCapture from "./components/CameraCapture";
import EnhancedReconstructionViewer from "./components/EnhancedReconstructionViewer";
import LoadingScreen from "./components/LoadingScreen";
import { getEnhancedPipeline } from "./pipeline/enhancedPipeline";
import { getPotteryReconstructor } from "./reconstruction/potteryRebuilder";
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
      console.log("Starting reconstruction with fragments:", fragmentsList.length);
      
      const reconstructor = getPotteryReconstructor();
      reconstructor.clear();

      fragmentsList.forEach((fragment, index) => {
        if (fragment.pointCloud && fragment.pointCloud.length > 0) {
          console.log(`Adding fragment ${index}: ${fragment.pointCloud.length} points, type: ${fragment.classification?.fragmentType}`);
          reconstructor.addFragment(fragment.pointCloud, {
            fragmentType: fragment.classification?.fragmentType,
            confidence: fragment.classification?.confidence,
          });
        } else {
          console.warn(`Fragment ${index} has no point cloud data`);
        }
      });

      const mesh = reconstructor.reconstruct();
      console.log("Reconstruction complete, mesh:", mesh);
      console.log("Mesh geometry:", mesh.geometry);
      console.log("Mesh material:", mesh.material);
      
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
    <AppShell>
      <TopBar>
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
            ARCHIA v2.0
          </h1>
          <p className="text-zinc-500">
            AI-Powered Pottery Reconstruction with MiDaS Depth Estimation
          </p>
        </div>
      </TopBar>

      {/* Processing Progress */}
      {processingProgress && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/95 border-2 border-amber-500 rounded-xl p-8 text-center z-50 min-w-[320px] shadow-2xl">
          <h3 className="mt-0 text-amber-500">
            {processingProgress.stage}
          </h3>
          <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300"
              style={{ width: `${processingProgress.percent}%` }}
            />
          </div>
          <div className="text-zinc-400">
            {processingProgress.percent.toFixed(0)}%
          </div>
        </div>
      )}

      <MainContent>
        <LeftPanel>
          <Card>
            <CardHeader>
              <CardTitle>Camera Capture</CardTitle>
            </CardHeader>
            <CardContent>
              <CameraCapture
                onResult={handleCaptureResult}
                modelsReady={modelsLoaded}
              />
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
                    src={currentFragment.image}
                    alt="Captured fragment"
                    className="w-full rounded-lg"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-800 p-3 rounded-lg">
                      <div className="text-zinc-400 text-sm">Type</div>
                      <div
                        className="font-bold text-lg"
                        style={{
                          color: getFragmentColor(
                            currentFragment.classification?.fragmentType
                          ),
                        }}
                      >
                        {currentFragment.classification?.fragmentType || "unknown"}
                      </div>
                    </div>

                    <div className="bg-zinc-800 p-3 rounded-lg">
                      <div className="text-zinc-400 text-sm">
                        Confidence
                      </div>
                      <div className="font-bold text-lg">
                        {(
                          (currentFragment.classification?.confidence || 0) * 100
                        ).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-800 p-3 rounded-lg">
                    <div className="text-zinc-400 text-sm">
                      Processing Time
                    </div>
                    <div className="font-bold">
                      {currentFragment.processingTime?.toFixed(0) || 0}ms
                    </div>
                  </div>

                  <div className="bg-zinc-800 p-3 rounded-lg">
                    <div className="text-zinc-400 text-sm">
                      Points
                    </div>
                    <div className="font-bold">
                      {currentFragment.pointCloud?.length?.toLocaleString() || 0}
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
                      Clear
                    </Button>
                  </div>
                }
              />
            </CardHeader>
            <CardContent>
              <div className="h-[500px] rounded-lg bg-zinc-950">
                <EnhancedReconstructionViewer
                  mesh={reconstructedMesh}
                  classification={currentFragment?.classification || null}
                  showPointCloud={false}
                  showMesh={true}
                  autoRotate={true}
                />
              </div>
            </CardContent>
          </Card>
        </ReconstructionSection>

        {fragments.length > 0 && (
          <GallerySection>
            <Card>
              <CardHeader>
                <SectionHeader
                  title={`Fragment Gallery (${fragments.length})`}
                  description="Click fragments to view details"
                />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {fragments.map((fragment, index) => (
                    <div
                      key={fragment.timestamp}
                      onClick={() => setCurrentFragment(fragment)}
                      className="border-2 border-zinc-700 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 transform scale-100 opacity-80 hover:scale-105 hover:opacity-100 hover:border-amber-500"
                    >
                      <img
                        src={fragment.image}
                        alt={`Fragment ${index + 1}`}
                        className="w-full aspect-square"
                      />
                      <div
                        className="p-2 bg-zinc-800 text-center text-xs"
                        style={{
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
              </CardContent>
            </Card>
          </GallerySection>
        )}
      </MainContent>

      <footer className="mt-12 py-6 border-t text-center text-zinc-500 text-sm">
        <p>
          Enhanced with MiDaS Depth Estimation | Powered by TensorFlow.js &
          Three.js
        </p>
        <p className="text-xs mt-1">
          FIRST LEGO League Research Project
        </p>
      </footer>
    </AppShell>
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