import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

export function LiveIndicator({ activeExperts = 0, isActive = false, className }) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setPulse(p => !p);
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className={cn(
      "bg-zinc-900/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-zinc-700 shadow-lg",
      className
    )}>
      {/* Live Indicator */}
      <div className="flex items-center gap-2 mb-2">
        <div className={cn(
          "w-2 h-2 rounded-full",
          pulse ? "bg-red-500" : "bg-green-500"
        )} />
        <span className="text-xs text-zinc-300 font-medium">
          {pulse ? 'Live Review Session' : 'Active'}
        </span>
      </div>

      {/* Expert Count */}
      <div className="text-xs text-zinc-400">
        {activeExperts} expert{activeExperts !== 1 ? 's' : ''} viewing
      </div>

      {/* Expert Avatars */}
      <div className="flex -space-x-2">
        {[...Array(Math.min(activeExperts, 3))].map((_, index) => (
          <div
            key={index}
            className="w-5 h-5 rounded-full bg-amber-600 border-2 border-zinc-900 flex items-center justify-center text-xs font-medium text-white"
            style={{ zIndex: 3 - index }}
          >
            {String.fromCharCode(65 + index)} {/* A, B, C */}
          </div>
        ))}
        {activeExperts > 3 && (
          <div className="w-5 h-5 rounded-full bg-zinc-600 border-2 border-zinc-900 flex items-center justify-center text-xs font-medium text-white">
            +{activeExperts - 3}
          </div>
        )}
      </div>
    </div>
  );
}
