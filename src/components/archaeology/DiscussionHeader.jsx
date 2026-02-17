import React from 'react';
import { cn } from '../../utils/cn';

export function DiscussionHeader({ artifact, className }) {
  return (
    <div className={cn("p-6 bg-zinc-900/50 backdrop-blur-sm", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white mb-2">{artifact.name}</h2>
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <span className="text-amber-400">AI Typology: {artifact.aiTypology}</span>
            <span>•</span>
            <span>Era: {artifact.eraEstimate}</span>
            <span>•</span>
            <span>Confidence: {artifact.reconstructionConfidence}%</span>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-medium border",
          artifact.status === 'Under Review' 
            ? "bg-amber-900/30 text-amber-400 border-amber-700"
            : "bg-green-900/30 text-green-400 border-green-700"
        )}>
          {artifact.status}
        </div>
      </div>

      {/* Artifact Details */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
        <div className="bg-zinc-800/50 rounded p-3">
          <div className="text-zinc-500 mb-1">Dimensions</div>
          <div className="text-zinc-300 space-y-1">
            <div>Height: {artifact.dimensions.height}</div>
            <div>Rim: {artifact.dimensions.rimDiameter}</div>
            <div>Wall: {artifact.dimensions.wallThickness}</div>
          </div>
        </div>
        
        <div className="bg-zinc-800/50 rounded p-3">
          <div className="text-zinc-500 mb-1">Composition</div>
          <div className="text-zinc-300 space-y-1">
            <div>Clay: {artifact.composition.primaryClay}</div>
            <div>Temper: {artifact.composition.temper}</div>
            <div>Firing: {artifact.composition.firingTemp}</div>
          </div>
        </div>
        
        <div className="bg-zinc-800/50 rounded p-3">
          <div className="text-zinc-500 mb-1">Analysis</div>
          <div className="text-zinc-300 space-y-1">
            <div>3 Experts Reviewing</div>
            <div>12 Public Comments</div>
            <div>4 AI Insights</div>
          </div>
        </div>
      </div>
    </div>
  );
}
