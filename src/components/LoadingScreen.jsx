import React from 'react';
import { Card, CardContent } from './ui';

export default function LoadingScreen({ progress, stage, error }) {
  const percentage = Math.min(100, Math.max(0, progress));
  
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-6">
          {/* Pottery Icon with Animation */}
          <div className="text-6xl animate-bounce">
            🏺
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
            Loading ARCHIA
          </h2>
          
          {/* Stage Description */}
          <p className="text-zinc-400 max-w-sm mx-auto min-h-[24px] transition-opacity duration-[150ms] ease-out">
            {stage || "Initializing..."}
          </p>

          {/* Progress Bar Container */}
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            {/* Progress Bar Fill */}
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-[500ms] ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Percentage Display */}
          <div className={`
            text-2xl font-bold tabular-nums transition-all duration-[150ms] ease-out
            ${error ? "text-red-500" : "text-amber-400"}
          `}>
            {percentage.toFixed(0)}%
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-left transition-all duration-[150ms] ease-out">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Loading Stages Indicator */}
          {!error && (
            <div className="flex justify-center space-x-2">
              {[25, 50, 75, 100].map((threshold, index) => (
                <div 
                  key={index} 
                  className={`w-2 h-2 rounded-full transition-all duration-[150ms] ease-out ${
                    percentage >= threshold ? 'bg-amber-500' : 'bg-zinc-600'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Tips */}
          {!error && percentage < 50 && (
            <div className="text-zinc-400 text-sm text-center max-w-sm italic">
              <p>
                First load may take 30-60 seconds on slower connections.<br />
                Subsequent loads will be instant (cached).
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}