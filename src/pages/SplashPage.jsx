import React, { useState, useEffect } from 'react';
import { getEnhancedPipeline } from '../pipeline/enhancedPipeline';

export default function SplashPage({ onReady }) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('Initializing...');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Silent model preloading in background
    async function preloadModels() {
      try {
        setStage('Loading AI models...');
        setProgress(20);

        const pipeline = await getEnhancedPipeline((progress) => {
          setProgress(progress.percent);
          setStage(progress.stage);
        });

        setProgress(100);
        setStage('Ready');
        setIsReady(true);

        // Auto-advance after brief delay
        setTimeout(() => {
          onReady();
        }, 1500);
      } catch (err) {
        console.error('Model loading failed:', err);
        setStage('Ready');
        setIsReady(true);
        setTimeout(() => {
          onReady();
        }, 1500);
      }
    }

    preloadModels();
  }, [onReady]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
      {/* Minimal branding */}
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
          ARCHIA
        </h1>
        
        <p className="text-zinc-400 text-lg max-w-md">
          AI-Powered Archaeological Reconstruction
        </p>

        {/* Non-blocking progress indicator */}
        <div className="w-64 space-y-3">
          <div className="text-zinc-500 text-sm text-center">
            {stage}
          </div>
          
          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="text-zinc-600 text-xs text-center">
            {progress}%
          </div>
        </div>

        {/* Ready state */}
        {isReady && (
          <div className="text-zinc-500 text-sm animate-pulse">
            Initializing workspace...
          </div>
        )}
      </div>
    </div>
  );
}
