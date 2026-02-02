import React from 'react';
import { Card, CardContent } from './ui';

export default function LoadingScreen({ progress, stage, error }) {
  const percentage = Math.min(100, Math.max(0, progress));
  
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-6">
          {/* Pottery Icon with Animation */}
          <div className="text-6xl animate-bounce">
            🏺
          </div>
          
          {/* Title */}
          <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
            Loading ARCHIA
          </h2>
          
          {/* Stage Description */}
          <p className="text-zinc-500 max-w-sm mx-auto min-h-[24px]">
            {stage || "Initializing..."}
          </p>

          {/* Progress Bar Container */}
          <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
            {/* Progress Bar Fill */}
            <div 
              className={`h-full transition-all duration-300 ease-out ${
                error 
                  ? "bg-gradient-to-r from-red-500 to-red-600" 
                  : "bg-gradient-to-r from-amber-500 to-amber-600"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Percentage Display */}
          <div className={`text-2xl font-bold tabular-nums ${
            error ? "text-red-600" : "text-amber-500"
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
                        ? "bg-amber-500 text-white" 
                        : isCurrent 
                          ? "bg-amber-600 text-white scale-110 shadow-lg shadow-amber-500/50" 
                          : "bg-zinc-200 text-zinc-500"
                      }
                    `}>
                      {isComplete ? "✓" : "○"}
                    </div>
                    <div className={`
                      text-xs text-center max-w-[60px]
                      ${isComplete 
                        ? "text-amber-500" 
                        : isCurrent 
                          ? "text-zinc-500" 
                          : "text-zinc-400"
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
            <div className="text-zinc-400 text-sm text-center max-w-sm italic">
              💡 First load may take 30-60 seconds on slower connections.<br />
              Subsequent loads will be instant (cached).
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}