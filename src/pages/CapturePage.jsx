import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusPill } from '../components/ui/StatusPill';
import { SectionHeader } from '../components/ui/SectionHeader';
import { LazyCameraCapture } from '../components/ui/LazyCameraCapture';
import { useMemoryManager } from '../utils/memoryManager';
import { getEnhancedPipeline } from '../pipeline/enhancedPipeline';
import { useNavigation } from '../contexts/NavigationContext';

export default function CapturePage() {
  const { navigate, addFragment } = useNavigation(); // Use addFragment from NavigationContext
  const [capturedFragment, setCapturedFragment] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('idle');
  const [cameraReady, setCameraReady] = useState(false);

  // Initialize camera when screen mounts
  useEffect(() => {
    setCameraStatus('loading');
    // Camera will be initialized by CameraCapture component
    const timer = setTimeout(() => {
      setCameraReady(true);
      setCameraStatus('ready');
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleCaptureResult = async (result) => {
    console.log("Fragment captured:", result);

    if (result.error) {
      console.error("Capture error:", result.error);
      setCameraStatus('error');
      return;
    }

    try {
      setCameraStatus('processing');
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
        imageElement: img, // Include image element for CNN semantic guidance
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

      setCapturedFragment(fragmentData);
      setCameraStatus('success');
      setProcessingProgress(null);
    } catch (err) {
      console.error("Processing error:", err);
      setCameraStatus('error');
      setProcessingProgress(null);
    }
  };

  const handleAddToSession = () => {
    if (capturedFragment) {
      addFragment(capturedFragment); // Use central fragment management
      setCapturedFragment(null);
      setCameraStatus('ready');
      // Navigate to reconstruct screen
      navigate('reconstruct');
    }
  };

  const handleRetake = () => {
    setCapturedFragment(null);
    setCameraStatus('ready');
  };

  const getStatusMessage = () => {
    switch (cameraStatus) {
      case 'loading':
        return 'Initializing camera...';
      case 'processing':
        return processingProgress?.stage || 'Processing fragment...';
      case 'success':
        return 'Fragment captured successfully';
      case 'error':
        return 'Capture failed';
      default:
        return 'Ready to capture';
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-950 px-4 py-6 sm:px-8 sm:py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Section Header */}
        <SectionHeader
          title="Capture Fragment"
          subtitle="Analyze pottery fragments with AI vision"
        />

        {/* Camera Card */}
        <Card className="bg-charcoal-900/80 border-charcoal-800/50 shadow-2xl">
          <CardContent className="p-6 sm:p-10">
            <div className="space-y-8">
              {/* Camera Feed */}
              <div className="relative aspect-[4/3] sm:aspect-video bg-charcoal-950 rounded-xl border-2 border-charcoal-700/50 overflow-hidden shadow-inner">
                {!capturedFragment ? (
                  <LazyCameraCapture 
                    onResult={handleCaptureResult} 
                    modelsReady={cameraReady}
                  />
                ) : (
                  <div className="w-full h-full">
                    <img 
                      src={capturedFragment.image} 
                      alt="Captured fragment"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                )}
              </div>

              {/* Status Indicator */}
              <div className="flex justify-center pt-2">
                <StatusPill 
                  status={cameraStatus}
                  message={getStatusMessage()}
                  className="text-base px-4 py-2"
                />
              </div>

              {/* Controls Panel */}
              <div className="flex flex-col sm:flex-row gap-5 justify-center pt-4">
                {!capturedFragment ? (
                  <>
                    {/* The LazyCameraCapture component handles its own controls */}
                  </>
                ) : (
                  <>
                    <Button 
                      variant="primary" 
                      size="lg"
                      onClick={handleAddToSession}
                      className="px-10 py-3 text-base sm:text-lg"
                    >
                      Add to Session
                    </Button>
                    
                    <Button 
                      variant="secondary" 
                      size="lg"
                      onClick={handleRetake}
                      className="px-10 py-3 text-base sm:text-lg"
                    >
                      Retake
                    </Button>
                  </>
                )}
              </div>

              {/* Processing Progress Overlay */}
              {processingProgress && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/95 border-2 border-amber-500 rounded-xl p-8 text-center z-50 min-w-[320px] shadow-2xl">
                  <h3 className="mt-0 text-amber-500">
                    {processingProgress.stage}
                  </h3>
                  <div className="w-full h-2 bg-charcoal-700 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300"
                      style={{ width: `${processingProgress.percent}%` }}
                    />
                  </div>
                  <div className="text-charcoal-400">
                    {processingProgress.percent.toFixed(0)}%
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fragment Info (if captured) */}
        {capturedFragment && (
          <Card className="bg-charcoal-900/80 border-charcoal-800/50">
            <CardHeader>
              <CardTitle className="text-white">Fragment Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-charcoal-500">Type:</span>
                  <div className="font-medium text-white mt-1">
                    {capturedFragment.classification?.fragmentType || "unknown"}
                  </div>
                </div>
                
                <div>
                  <span className="text-charcoal-500">Confidence:</span>
                  <div className="font-medium text-white mt-1">
                    {((capturedFragment.classification?.confidence || 0) * 100).toFixed(1)}%
                  </div>
                </div>
                
                <div>
                  <span className="text-charcoal-500">Points:</span>
                  <div className="font-medium text-white mt-1">
                    {capturedFragment.pointCloud?.length || 0}
                  </div>
                </div>
                
                <div>
                  <span className="text-charcoal-500">Processing:</span>
                  <div className="font-medium text-white mt-1">
                    {(capturedFragment.processingTime / 1000).toFixed(1)}s
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
