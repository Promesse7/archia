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
    if (!capturedFragment) return;

    try {
      setCameraStatus('adding');
      setProcessingProgress({ stage: "Adding fragment to session...", percent: 0 });

      // Simulate adding progress
      const addProgressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          const nextProgress = Math.min(prev.percent + 10, 90);
          return { stage: "Adding fragment to session...", percent: nextProgress };
        });
      }, 100);

      const fragmentCount = await addFragment(capturedFragment); // Wait for fragment to be added

      clearInterval(addProgressInterval);
      setProcessingProgress({ stage: "Fragment added successfully!", percent: 100 });

      console.log('Fragment added successfully, total fragments:', fragmentCount);

      // Small delay to show completion before navigation
      setTimeout(() => {
        setCapturedFragment(null);
        setCameraStatus('ready');
        setProcessingProgress(null);

        // Navigate to reconstruction page
        navigate('reconstruct');
      }, 1000);

    } catch (err) {
      console.error("Error adding fragment to session:", err);
      setCameraStatus('error');
      setProcessingProgress({ stage: "Failed to add fragment", percent: 0 });

      // Reset after error
      setTimeout(() => {
        setProcessingProgress(null);
        setCameraStatus('success');
      }, 2000);
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
      case 'adding':
        return processingProgress?.stage || 'Adding fragment to session...';
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
            {/* Status Icon */}
            <div className="mb-4">
              {processingProgress.percent === 100 ? (
                <div className="w-12 h-12 mx-auto bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-12 h-12 mx-auto bg-amber-500 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <h3 className={`font-medium mb-4 tracking-wide ${processingProgress.percent === 100 ? 'text-green-400' : 'text-amber-400'
              }`}>
              {processingProgress.stage}
            </h3>

            <div className="w-full h-2 bg-stone-700 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full transition-all duration-300 ${processingProgress.percent === 100
                  ? 'bg-gradient-to-r from-green-500 to-green-600'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600'
                  }`}
                style={{ width: `${processingProgress.percent}%` }}
              />
            </div>

            <div className="text-stone-400 text-sm">
              {processingProgress.percent.toFixed(0)}%
            </div>

            {/* Completion Message */}
            {processingProgress.percent === 100 && (
              <div className="mt-4 text-green-400 text-sm animate-fade-in">
                Redirecting to reconstruction...
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
