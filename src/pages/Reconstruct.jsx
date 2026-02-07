import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, Button, SectionHeader, IconButton } from '../components/ui';
import EnhancedReconstructionViewer from '../components/EnhancedReconstructionViewer';
import { useMemoryManager } from '../utils/memoryManager.js';
import { getPotteryReconstructor } from '../reconstruction/potteryRebuilder';
import { getFragmentClassifier } from '../ai/classifier';
import { useFragmentContext } from '../contexts/FragmentContext';
import { useNavigation } from '../contexts/NavigationContext';
import FragmentList from '../components/FragmentList';

// Icon components for controls
const RebuildIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const RotateIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const ResetIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const CameraIcon = () => (
  <svg className="w-12 h-12 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default function ReconstructionPage({ onNavigate }) {
  const { selectedFragments } = useFragmentContext();
  const { fragments } = useNavigation(); // Get fragments from NavigationContext
  const [reconstructedMesh, setReconstructedMesh] = useState(null);
  const [isViewerReady, setIsViewerReady] = useState(false);
  const [viewerScale, setViewerScale] = useState(0.95);
  const [activeFragmentId, setActiveFragmentId] = useState(null);
  const viewerRef = useRef(null);

  const fragmentsToUse = selectedFragments.length > 0 ? selectedFragments : fragments;
  const hasFragments = fragmentsToUse && fragmentsToUse.length > 0;

  // Handle fragment click for highlighting
  const handleFragmentClick = useCallback((fragmentId) => {
    setActiveFragmentId(activeFragmentId === fragmentId ? null : fragmentId);
  }, [activeFragmentId]);

  // Define reconstructPottery first since it's used in other functions
  const reconstructPottery = useCallback(async (fragmentsList) => {
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

      // Use semantic guidance if available, otherwise fall back to standard reconstruction
      const mesh = cnnParams 
        ? reconstructor.reconstructWithSemanticParams(cnnParams)
        : reconstructor.reconstruct();
        
      console.log("Reconstruction complete, mesh:", mesh);
      
      setReconstructedMesh(mesh);

      console.log("Reconstruction complete:", reconstructor.getStats());
    } catch (err) {
      console.error("Reconstruction error:", err);
    }
  }, []);

  const handleRebuild = useCallback(() => {
    if (hasFragments) {
      console.log('Rebuilding reconstruction...');
      reconstructPottery(fragmentsToUse);
    }
  }, [fragmentsToUse, hasFragments, reconstructPottery]);

  const handleRotate = useCallback(() => {
    if (viewerRef.current) {
      viewerRef.current.resetCamera();
    }
  }, []);

  const handleReset = useCallback(() => {
    setReconstructedMesh(null);
    if (viewerRef.current) {
      viewerRef.current.reset();
    }
  }, []);

  // Auto-reconstruct when fragments are available
  useEffect(() => {
    if (hasFragments && fragmentsToUse.length > 0) {
      console.log("Auto-reconstructing with fragments:", fragmentsToUse.length);
      reconstructPottery(fragmentsToUse);
    }
  }, [fragmentsToUse, hasFragments, reconstructPottery]);

  // Animate viewer scale on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setViewerScale(1.0);
      setIsViewerReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const viewerHeight = 'calc(100vh - 200px)'; // Account for nav and header

  return (
    <div className="min-h-screen bg-black">
      <div className="relative">
        {/* Section Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-black/80 backdrop-blur-sm border-b border-charcoal-900/50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Button 
                onClick={() => window.history.back()}
                variant="ghost"
                size="sm"
                className="mb-2"
              >
                ← Back to Gallery
              </Button>
              <div className="text-center flex-1">
                <SectionHeader
                  title="3D Reconstruction"
                  subtitle={hasFragments 
                    ? `Analyzing ${fragmentsToUse.length} fragment${fragmentsToUse.length !== 1 ? 's' : ''}` 
                    : "Archaeological reconstruction workspace"
                  }
                />
              </div>
              <div className="w-20"></div> {/* Spacer for alignment */}
            </div>
          </div>
        </div>

        {/* Main Viewer Container */}
        <div className="pt-24">
          <Card className="bg-black border-charcoal-900/50 rounded-none">
            <CardContent className="p-0">
              <div 
                ref={viewerRef}
                className="relative"
                style={{ height: viewerHeight }}
              >
                {hasFragments ? (
                  <div 
                    className="w-full h-full transition-transform duration-400 ease-out"
                    style={{ transform: `scale(${viewerScale})` }}
                  >
                    {/* Subtle grid pattern background */}
                    <div 
                      className="absolute inset-0 opacity-5"
                      style={{
                        backgroundImage: `
                          linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
                        `,
                        backgroundSize: '50px 50px'
                      }}
                    ></div>
                    
                    {/* Subtle vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none"></div>
                    
                    {/* 3D Viewer */}
                    <div className="relative w-full h-full">
                      <EnhancedReconstructionViewer
                        fragments={fragmentsToUse}
                        activeFragmentId={activeFragmentId}
                        onFragmentHover={setActiveFragmentId}
                        mesh={reconstructedMesh}
                        classification={fragmentsToUse[fragmentsToUse.length - 1]?.classification || null}
                        showPointCloud={true}
                        showMesh={true}
                        autoRotate={false}
                        onReady={() => console.log('3D viewer ready')}
                      />
                      
                      <FragmentList 
                        fragments={fragmentsToUse}
                        activeFragmentId={activeFragmentId}
                        onFragmentClick={handleFragmentClick}
                      />
                    </div>

                    {/* Floating Controls */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <div className="bg-black/60 backdrop-blur-md border border-charcoal-800/50 rounded-lg p-2">
                        <div className="flex flex-col gap-1">
                          <IconButton
                            icon={<RebuildIcon />}
                            tooltip="Rebuild reconstruction"
                            variant="ghost"
                            onClick={handleRebuild}
                          />
                          <IconButton
                            icon={<RotateIcon />}
                            tooltip="Reset camera"
                            variant="ghost"
                            onClick={handleRotate}
                          />
                          <IconButton
                            icon={<ResetIcon />}
                            tooltip="Clear all"
                            variant="ghost"
                            onClick={handleReset}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Empty State */
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-center space-y-6 max-w-md">
                      <div className="flex justify-center">
                        <CameraIcon />
                      </div>
                      
                      <h3 className="text-2xl font-semibold text-charcoal-300">
                        No fragments captured yet
                      </h3>
                      
                      <p className="text-charcoal-500 leading-relaxed">
                        Capture pottery fragments to begin 3D reconstruction analysis
                      </p>
                      
                      <Button
                        onClick={() => onNavigate('capture')}
                        variant="primary"
                        size="lg"
                        className="px-8"
                      >
                        Go to Capture
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
