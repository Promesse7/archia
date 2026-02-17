import React, { useState, useEffect, useRef } from 'react';
import { mockThreads, mockArtifactSummary, mockExperts } from '../data/mockDiscussions';
import { Card, CardHeader, CardContent } from './ui';
import { cn } from '../utils/cn';

// Component imports
import { ArtifactViewer } from './archaeology/ArtifactViewer';
import { DiscussionHeader } from './archaeology/DiscussionHeader';
import { CategoryTabs } from './archaeology/CategoryTabs';
import { ThreadList } from './archaeology/ThreadList';
import { ThreadView } from './archaeology/ThreadView';
import { InsightSummary } from './archaeology/InsightSummary';
import { LiveIndicator } from './archaeology/LiveIndicator';

export default function ArchaeologicalInterface({ artifactId = 'fragment_001' }) {
  const [selectedThread, setSelectedThread] = useState(null);
  const [activeCategory, setActiveCategory] = useState('General Discussion');
  const [highlightedMeshRegions, setHighlightedMeshRegions] = useState([]);
  const [liveExperts, setLiveExperts] = useState(3);

  // Filter threads by active category
  const filteredThreads = mockThreads.filter(thread =>
    thread.category === activeCategory || activeCategory === 'General Discussion'
  );

  // Handle mesh region highlighting
  const handleMeshHighlight = (regions) => {
    setHighlightedMeshRegions(regions);
  };

  const handleThreadSelect = (thread) => {
    setSelectedThread(thread);
    // Highlight mesh regions referenced in thread
    const allReferences = thread.messages.flatMap(msg => msg.meshReferences || []);
    handleMeshHighlight(allReferences);
  };

  return (
    <div className="h-screen bg-charcoal-950 text-zinc-100 flex">
      {/* Left Panel - 3D Artifact Viewer */}
      <div className="w-1/2 border-r border-charcoal-800 relative">
        <ArtifactViewer
          artifactId={artifactId}
          highlightedRegions={highlightedMeshRegions}
          onRegionHover={handleMeshHighlight}
        />

        {/* Live Session Indicator */}
        <LiveIndicator
          activeExperts={liveExperts}
          isActive={true}
          className="absolute top-4 left-4"
        />
      </div>

      {/* Right Panel - Discussion System */}
      <div className="w-1/2 flex flex-col">
        {/* Artifact Summary Header */}
        <DiscussionHeader
          artifact={mockArtifactSummary}
          className="border-b border-charcoal-800"
        />

        {/* Category Tabs */}
        <CategoryTabs
          categories={['General Discussion', 'Structural Integrity', 'Historical Context', 'Reconstruction Debate', 'AI Analysis Feedback']}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          className="border-b border-charcoal-800"
        />

        {/* Main Discussion Area */}
        <div className="flex-1 flex">
          {/* Thread List */}
          <div className={cn(
            "w-2/5 border-r border-charcoal-800",
            selectedThread ? "hidden lg:block" : "block"
          )}>
            <ThreadList
              threads={filteredThreads}
              selectedThread={selectedThread}
              onThreadSelect={handleThreadSelect}
            />
          </div>

          {/* Thread View */}
          <div className={cn(
            "flex-1 flex flex-col overflow-hidden",
            !selectedThread && "hidden lg:flex"
          )}>
            {selectedThread ? (
              <>
                {/* AI Insight Summary */}
                <InsightSummary
                  summary={selectedThread.aiSummary}
                  className="border-b border-zinc-800"
                />

                {/* Thread Messages */}
                <ThreadView
                  thread={selectedThread}
                  experts={mockExperts}
                  onMeshHighlight={handleMeshHighlight}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">🏛️</div>
                  <h3 className="text-xl font-semibold mb-2">Select a Discussion Thread</h3>
                  <p className="text-sm">Choose a thread to view archaeological analysis and expert commentary</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
