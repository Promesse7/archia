import React, { useState, useRef } from 'react';
import EnhancedReconstructionViewer from '../components/EnhancedReconstructionViewer';
import ErrorBoundary from '../components/ErrorBoundary';
import { Card, CardHeader, CardTitle, CardContent, Button, SectionHeader } from '../components/ui';
import { getPotteryReconstructor } from '../reconstruction/potteryRebuilder';
import { getFragmentClassifier } from '../ai/classifier';

export default function ReconstructionPage({ onNavigate, fragments }) {
  const [reconstructedMesh, setReconstructedMesh] = useState(null);
  const [isReconstructing, setIsReconstructing] = useState(false);
  const hasReconstructedRef = useRef(false); // Track if we've already reconstructed for current fragments

  // Auto-reconstruct when fragments are available
  React.useEffect(() => {
    const hasFragments = fragments && fragments.length > 0;
    const fragmentCount = fragments?.length || 0;

    // Only reconstruct if we have fragments and haven't reconstructed for this count yet
    if (hasFragments && !isReconstructing && hasReconstructedRef.current !== fragmentCount) {
      console.log("Auto-reconstructing with fragments:", fragmentCount);
      hasReconstructedRef.current = fragmentCount; // Mark as reconstructed for this count
      reconstructPottery(fragments);
    }
  }, [fragments]); // Only depend on fragments

  const reconstructPottery = React.useCallback(async (fragmentsList) => {
    if (isReconstructing) return; // Prevent race conditions

    try {
      setIsReconstructing(true);
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

      console.log("All fragments added, starting reconstruction...");

      // Get CNN semantic guidance from the most recent fragment image
      let cnnParams = null;
      if (fragmentsList.length > 0) {
        const latestFragment = fragmentsList[fragmentsList.length - 1];
        if (latestFragment.imageElement) {
          console.log("Extracting CNN semantic parameters from fragment image...");
          const classifier = await getFragmentClassifier();
          cnnParams = await classifier.predictVesselParams(latestFragment.imageElement);
          console.log("CNN semantic parameters:", cnnParams);
        }
      }

      console.log("Starting final reconstruction...");
      // Use semantic guidance if available, otherwise fall back to standard reconstruction
      const mesh = cnnParams
        ? reconstructor.reconstructWithSemanticParams(cnnParams)
        : reconstructor.reconstruct();

      console.log("Reconstruction complete, mesh:", mesh);

      setReconstructedMesh(mesh);

      console.log("Reconstruction complete:", reconstructor.getStats());
    } catch (err) {
      console.error("Reconstruction error:", err);
    } finally {
      setIsReconstructing(false);
    }
  }, []); // Empty dependency array since we're using ref pattern

  const clearSession = () => {
    setReconstructedMesh(null);
    getPotteryReconstructor().clear();
    hasReconstructedRef.current = false; // Reset reconstruction tracking
  };

  const hasFragments = fragments && fragments.length > 0;

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            3D Reconstruction
          </h1>
          <p className="text-zinc-400 text-lg">
            Assemble fragments into complete pottery models
          </p>
        </div>

        {/* Empty state */}
        {!hasFragments && (
          <Card>
            <CardContent className="p-16 text-center">
              <div className="text-6xl mb-4">🏺</div>
              <h3 className="text-2xl font-bold text-white mb-4">
                No Fragments Yet
              </h3>
              <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                Capture pottery fragments first to reconstruct them into 3D models
              </p>
              <Button
                onClick={() => onNavigate('capture')}
                size="lg"
              >
                Capture Fragments
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Reconstruction viewer */}
        {hasFragments && (
          <Card>
            <CardHeader>
              <SectionHeader
                title="Fragment Assembly"
                description={`Reconstructing from ${fragments.length} fragment${fragments.length !== 1 ? 's' : ''}`}
                actions={
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => reconstructPottery(fragments)}
                      variant="outline"
                      size="sm"
                    >
                      Rebuild
                    </Button>
                    <Button
                      onClick={clearSession}
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
              <div className="h-[600px] rounded-lg bg-zinc-950">
                <ErrorBoundary
                  errorMessage="Enhanced 3D viewer failed to load. Try refreshing the page."
                  onError={(error, errorInfo) => {
                    console.error('EnhancedReconstructionViewer error:', error, errorInfo);
                  }}
                >
                  <EnhancedReconstructionViewer
                    mesh={reconstructedMesh}
                    classification={fragments[fragments.length - 1]?.classification || null}
                    showPointCloud={false}
                    showMesh={true}
                    autoRotate={true}
                  />
                </ErrorBoundary>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fragment gallery */}
        {hasFragments && (
          <Card>
            <CardHeader>
              <CardTitle>
                Captured Fragments ({fragments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 overflow-y-auto max-h-96">
                {fragments.map((fragment, index) => (
                  <div
                    key={fragment.timestamp || `fragment-${index}`}
                    className="border-2 border-zinc-700 rounded-lg overflow-hidden hover:border-amber-500 transition-colors"
                  >
                    <img
                      src={fragment.image || ''}
                      alt={`Fragment ${index + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="p-2 bg-zinc-800 text-center text-xs">
                      <div className="text-amber-500 font-medium">
                        {fragment.classification?.fragmentType || "?"}
                      </div>
                      <div className="text-zinc-500">
                        {((fragment.classification?.confidence || 0) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation hint */}
        <div className="text-center space-x-4">
          <Button
            onClick={() => onNavigate('home')}
            variant="ghost"
          >
            ← Back to Home
          </Button>
          {hasFragments && (
            <Button
              onClick={() => onNavigate('capture')}
              variant="outline"
            >
              Capture More
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
