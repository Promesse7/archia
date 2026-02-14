import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusPill } from '../components/ui/StatusPill';
import { SectionHeader } from '../components/ui/SectionHeader';
import CameraCapture from '../components/CameraCapture';
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

  const handleAddToSession = async () => {
    if (capturedFragment) {
      const fragmentCount = await addFragment(capturedFragment); // Wait for fragment to be added
      console.log('Fragment added successfully, total fragments:', fragmentCount);
      setCapturedFragment(null);
      setCameraStatus('ready');

      // Small delay to ensure React state update cycle completes
      setTimeout(() => {
        navigate('reconstruct');
      }, 50);
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
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      <CameraCapture
        onResult={handleCaptureResult}
        modelsReady={cameraReady}
        cameraStatus={cameraStatus}
        capturedFragment={capturedFragment}
        onRetake={handleRetake}
        onAddToSession={handleAddToSession}
        processingProgress={processingProgress}
      />


      {/* Processing Overlay */}
      {processingProgress && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/95 z-50">
          <div className="px-8 py-6 bg-stone-900/90 backdrop-blur-xl border border-amber-500/20 rounded-2xl text-center max-w-md mx-4 shadow-2xl">
            <h3 className="text-amber-400 font-medium mb-4 tracking-wide">
              {processingProgress.stage}
            </h3>
            <div className="w-full h-2 bg-stone-700 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300"
                style={{ width: `${processingProgress.percent}%` }}
              />
            </div>
            <div className="text-stone-400 text-sm">
              {processingProgress.percent.toFixed(0)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
