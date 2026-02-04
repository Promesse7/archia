import React, { useState } from 'react';
import CameraCapture from '../components/CameraCapture';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../components/ui';
import { getEnhancedPipeline } from '../pipeline/enhancedPipeline';

export default function CapturePage({ onNavigate, onFragmentAdded }) {
  const [capturedFragment, setCapturedFragment] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(null);

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
      setProcessingProgress(null);
    } catch (err) {
      console.error("Processing error:", err);
      setProcessingProgress(null);
    }
  };

  const handleAddToSession = () => {
    if (capturedFragment) {
      onFragmentAdded(capturedFragment);
      setCapturedFragment(null);
      // Navigate back to home to show updated count
      onNavigate('home');
    }
  };

  const handleRetake = () => {
    setCapturedFragment(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            Capture Fragment
          </h1>
          <p className="text-zinc-400 text-lg">
            Photograph or upload a pottery fragment for AI analysis
          </p>
        </div>

        {/* Processing progress overlay */}
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

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Camera section */}
          <Card>
            <CardHeader>
              <CardTitle>Camera Capture</CardTitle>
            </CardHeader>
            <CardContent>
              <CameraCapture
                onResult={handleCaptureResult}
                modelsReady={true} // Models are preloaded in splash
              />
            </CardContent>
          </Card>

          {/* Preview/Results section */}
          <Card>
            <CardHeader>
              <CardTitle>
                {capturedFragment ? 'Fragment Analysis' : 'Waiting for Capture'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {capturedFragment ? (
                <div className="space-y-6">
                  {/* Image preview */}
                  <img
                    src={capturedFragment.image}
                    alt="Captured fragment"
                    className="w-full rounded-lg"
                  />

                  {/* Analysis results */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-800 p-3 rounded-lg">
                      <div className="text-zinc-400 text-sm">Type</div>
                      <div className="font-bold text-lg text-amber-500">
                        {capturedFragment.classification?.fragmentType || "unknown"}
                      </div>
                    </div>

                    <div className="bg-zinc-800 p-3 rounded-lg">
                      <div className="text-zinc-400 text-sm">Confidence</div>
                      <div className="font-bold text-lg">
                        {(
                          (capturedFragment.classification?.confidence || 0) * 100
                        ).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-800 p-3 rounded-lg">
                    <div className="text-zinc-400 text-sm">Processing Time</div>
                    <div className="font-bold">
                      {capturedFragment.processingTime?.toFixed(0) || 0}ms
                    </div>
                  </div>

                  <div className="bg-zinc-800 p-3 rounded-lg">
                    <div className="text-zinc-400 text-sm">Points Generated</div>
                    <div className="font-bold">
                      {capturedFragment.pointCloud?.length?.toLocaleString() || 0}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex space-x-4">
                    <Button
                      onClick={handleAddToSession}
                      className="flex-1"
                    >
                      Add to Session
                    </Button>
                    <Button
                      onClick={handleRetake}
                      variant="outline"
                      className="flex-1"
                    >
                      Retake
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-500">
                  <div className="text-6xl mb-4">📸</div>
                  <p>Capture a fragment to see analysis results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Navigation hint */}
        <div className="text-center">
          <Button
            onClick={() => onNavigate('home')}
            variant="ghost"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
