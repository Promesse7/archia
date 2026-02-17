import React from 'react';
import { cn } from '../../utils/cn';

export function InsightSummary({ summary, className }) {
  if (!summary) return null;

  return (
    <div className={cn("p-4 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-700/30", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-cyan-600 rounded flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-cyan-400 font-semibold text-sm">AI Analysis Summary</h3>
      </div>

      {/* Main Topic */}
      <div className="mb-4">
        <div className="text-xs text-cyan-300 mb-1">Primary Discussion Topic</div>
        <div className="text-sm text-zinc-200 font-medium">
          {summary.mainTopic}
        </div>
      </div>

      {/* Key Debates */}
      <div className="mb-4">
        <div className="text-xs text-cyan-300 mb-2">Key Discussion Points</div>
        <div className="space-y-1">
          {summary.keyDebates.map((debate, index) => (
            <div key={index} className="flex items-center gap-2 text-xs text-zinc-300">
              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
              {debate}
            </div>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Confidence Divergence */}
        <div className="bg-zinc-800/50 rounded p-3">
          <div className="text-xs text-zinc-500 mb-1">Expert-AI Confidence Divergence</div>
          <div className={cn(
            "text-lg font-bold",
            summary.confidenceDivergence > 15 ? "text-red-400" :
            summary.confidenceDivergence > 8 ? "text-amber-400" :
            "text-green-400"
          )}>
            {summary.confidenceDivergence}%
          </div>
        </div>

        {/* Consensus Status */}
        <div className="bg-zinc-800/50 rounded p-3">
          <div className="text-xs text-zinc-500 mb-1">Expert Consensus</div>
          <div className="text-sm text-zinc-200">
            {summary.expertConsensus}
          </div>
        </div>
      </div>

      {/* Open Questions */}
      {summary.openQuestions && summary.openQuestions.length > 0 && (
        <div>
          <div className="text-xs text-cyan-300 mb-2">Open Research Questions</div>
          <div className="space-y-1">
            {summary.openQuestions.map((question, index) => (
              <div key={index} className="flex items-start gap-2 text-xs text-zinc-300">
                <span className="text-cyan-500">Q{index + 1}:</span>
                <span>{question}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-700">
        <button className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded transition-colors">
          Generate Detailed Report
        </button>
        <button className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs font-medium rounded transition-colors">
          Export Analysis
        </button>
      </div>
    </div>
  );
}
