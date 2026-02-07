import React, { useState, useEffect } from 'react';
import { getEnhancedPipeline } from '../pipeline/enhancedPipeline';
import { useNavigation } from '../contexts/NavigationContext.jsx';

export default function SplashPage() {
  const { navigate } = useNavigation();
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

        // Auto-advance to home after brief delay
        setTimeout(() => {
          navigate('home');
        }, 1500);
      } catch (err) {
        console.error('Model loading failed:', err);
        setStage('Ready');
        setIsReady(true);
        setTimeout(() => {
          navigate('home');
        }, 1500);
      }
    }

    preloadModels();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-ink">
      <div className="text-center space-y-8">
        <h1 className="text-title font-bold bg-gradient-to-r from-accent to-accentHover bg-clip-text text-transparent">
          ARCHIA
        </h1>
        
        <p className="text-body text-muted max-w-md">
          AI-Powered Archaeological Reconstruction
        </p>

        <div className="w-64 space-y-3">
          <div className="text-label text-muted text-center">{stage}</div>
          
          <progress 
            className="w-full h-1 bg-surface rounded-full overflow-hidden [&::-webkit-progress-bar]:bg-surface [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-accent [&::-webkit-progress-value]:to-accentHover transition-all duration-500"
            value={progress}
            max={100}
          />
          
          <div className="text-label text-muted text-center">{progress}%</div>
        </div>

        {isReady && (
          <div className="text-label text-muted animate-pulse">
            Initializing workspace...
          </div>
        )}
      </div>
    </div>
  );
}
