import React from 'react';
import { Card, CardContent } from './ui';

export default function LoadingScreen({ progress, stage, error }) {
  const percentage = Math.min(100, Math.max(0, progress));
  
  return (
    <div className="min-h-screen bg-background text-ink flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-6">
          {/* Pottery Icon with Animation */}
          <div className="text-6xl animate-bounce">
            🏺
          </div>
          
          {/* Title */}
          <h2 className="text-headline font-bold bg-gradient-to-r from-accent to-accentHover bg-clip-text text-transparent">
            Loading ARCHIA
          </h2>
          
          {/* Stage Description */}
          <p className="text-muted max-w-sm mx-auto min-h-[24px]">
            {stage || "Initializing..."}
          </p>

          {/* Progress Bar Container */}
          <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
            {/* Progress Bar Fill */}
            <progress 
              className="w-full h-2 bg-surface rounded-full overflow-hidden [&::-webkit-progress-bar]:bg-surface [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-accent [&::-webkit-progress-value]:to-accentHover transition-all duration-300"
              value={percentage}
              max={100}
            />
          </div>

          {/* Percentage Display */}
          <div className={`text-2xl font-bold tabular-nums ${
            error ? "text-red-600" : "text-accent"
          }`}>
            {percentage.toFixed(0)}%
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-left">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Loading Stages Indicator */}
          {!error && (
            <div className="flex justify-center items-center gap-3">
              {['TensorFlow', 'Depth', 'MobileNet', 'Classifier'].map((label, idx) => {
                const stageProgress = (percentage / 100) * 4;
                const isComplete = stageProgress > idx + 1;
                const isCurrent = stageProgress > idx && stageProgress <= idx + 1;
                
                return (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300
                      ${isComplete 
                        ? "bg-accent text-white" 
                        : isCurrent 
                          ? "bg-accent text-white scale-110 shadow-lift" 
                          : "bg-surface text-muted"
                      }
                    `}>
                      {isComplete ? "✓" : "○"}
                    </div>
                    <div className={`
                      text-xs text-center max-w-[60px]
                      ${isComplete 
                        ? "text-accent" 
                        : isCurrent 
                          ? "text-muted" 
                          : "text-muted"
                      }
                    `}>
                      {label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tips */}
          {!error && percentage < 50 && (
            <div className="text-muted text-sm text-center max-w-sm italic">
              💡 First load may take 30-60 seconds on slower connections.<br />
              Subsequent loads will be instant (cached).
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}