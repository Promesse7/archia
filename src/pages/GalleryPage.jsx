import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, SectionHeader } from '../components/ui';

// Icon components
const CameraIcon = () => (
  <svg className="w-12 h-12 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const GridIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const ListIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export default function GalleryPage({ onNavigate, fragments = [] }) {
  const [selectedFragments, setSelectedFragments] = useState(new Set());
  const [hoveredFragment, setHoveredFragment] = useState(null);
  const [focusedFragment, setFocusedFragment] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [lastAction, setLastAction] = useState(null);

  const hasFragments = fragments && fragments.length > 0;

  // Selection management with proper state tracking
  const handleFragmentClick = useCallback((fragmentId, event) => {
    event?.preventDefault();
    setSelectedFragments(prev => {
      const newSet = new Set(prev);
      const wasSelected = newSet.has(fragmentId);
      
      if (wasSelected) {
        newSet.delete(fragmentId);
        setLastAction('deselected');
      } else {
        newSet.add(fragmentId);
        setLastAction('selected');
      }
      
      return newSet;
    });
  }, []);

  const handleFragmentHover = useCallback((fragmentId) => {
    setHoveredFragment(fragmentId);
  }, []);

  const handleFragmentFocus = useCallback((fragmentId) => {
    setFocusedFragment(fragmentId);
  }, []);

  const handleFragmentBlur = useCallback(() => {
    setFocusedFragment(null);
  }, []);

  // Bulk operations with enhanced functionality
  const handleSelectAll = useCallback(() => {
    if (selectedFragments.size === fragments.length) {
      setSelectedFragments(new Set());
      setLastAction('cleared_all');
    } else {
      setSelectedFragments(new Set(fragments.map(f => f.timestamp || f.id)));
      setLastAction('selected_all');
    }
  }, [selectedFragments.size, fragments]);

  const handleClearSelection = useCallback(() => {
    setSelectedFragments(new Set());
    setLastAction('cleared_selection');
  }, []);

  const handleReconstructSelected = useCallback(() => {
    if (selectedFragments.size > 0) {
      setLastAction('reconstruct_selected');
      onNavigate('reconstruct');
    }
  }, [selectedFragments.size, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl/Cmd + A: Select all
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        handleSelectAll();
      }
      
      // Escape: Clear selection
      if (event.key === 'Escape') {
        handleClearSelection();
      }
      
      // Enter: Reconstruct selected if any are selected
      if (event.key === 'Enter' && selectedFragments.size > 0) {
        event.preventDefault();
        handleReconstructSelected();
      }
      
      // Arrow keys: Navigate between fragments
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || 
          event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        if (focusedFragment !== null) {
          event.preventDefault();
          const currentIndex = fragments.findIndex(f => 
            (f.timestamp || f.id) === focusedFragment
          );
          
          let newIndex = currentIndex;
          const cols = viewMode === 'grid' ? 
            (window.innerWidth >= 1280 ? 4 : window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1) : 1;
          
          switch (event.key) {
            case 'ArrowDown':
              newIndex = Math.min(currentIndex + cols, fragments.length - 1);
              break;
            case 'ArrowUp':
              newIndex = Math.max(currentIndex - cols, 0);
              break;
            case 'ArrowRight':
              newIndex = Math.min(currentIndex + 1, fragments.length - 1);
              break;
            case 'ArrowLeft':
              newIndex = Math.max(currentIndex - 1, 0);
              break;
          }
          
          if (newIndex !== currentIndex) {
            const newFragmentId = fragments[newIndex]?.timestamp || fragments[newIndex]?.id;
            if (newFragmentId) {
              setFocusedFragment(newFragmentId);
              // Focus the corresponding element
              const element = document.querySelector(`[data-fragment-id="${newFragmentId}"]`);
              element?.focus();
            }
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [fragments, focusedFragment, viewMode, handleSelectAll, handleClearSelection, handleReconstructSelected, selectedFragments.size]);

  const getFragmentVariant = (type) => {
    const variants = {
      rim: "success",
      body: "info", 
      base: "warning",
      unknown: "neutral"
    };
    return variants[type] || variants.unknown;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSelectionStats = useCallback(() => {
    const selected = Array.from(selectedFragments);
    const selectedFragmentData = fragments.filter(f => 
      selected.includes(f.timestamp || f.id)
    );
    
    const stats = {
      total: selected.length,
      byType: {},
      avgConfidence: 0,
      totalPoints: 0
    };
    
    selectedFragmentData.forEach(fragment => {
      const type = fragment.classification?.fragmentType || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      stats.avgConfidence += fragment.classification?.confidence || 0;
      stats.totalPoints += fragment.pointCloud?.length || 0;
    });
    
    if (selected.length > 0) {
      stats.avgConfidence = (stats.avgConfidence / selected.length) * 100;
    }
    
    return stats;
  }, [selectedFragments, fragments]);

  // Responsive grid classes
  const getGridClasses = () => {
    if (viewMode === 'list') return 'space-y-4';
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
  };

  return (
    <div className="min-h-screen bg-charcoal-900 px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Section Header with Enhanced Controls */}
        <SectionHeader
          title="Fragment Gallery"
          subtitle={`Browse and select fragments for reconstruction (${fragments.length} total)`}
          action={
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-charcoal-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid' ? 'bg-amber-500 text-white' : 'text-charcoal-400 hover:text-white'
                  }`}
                  aria-label="Grid view"
                  title="Grid view"
                >
                  <GridIcon />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list' ? 'bg-amber-500 text-white' : 'text-charcoal-400 hover:text-white'
                  }`}
                  aria-label="List view"
                  title="List view"
                >
                  <ListIcon />
                </button>
              </div>

              {/* Bulk Actions */}
              {hasFragments && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleSelectAll}
                    variant="secondary"
                    size="sm"
                    aria-label={selectedFragments.size === fragments.length ? 'Deselect all fragments' : 'Select all fragments'}
                  >
                    {selectedFragments.size === fragments.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button
                    onClick={handleReconstructSelected}
                    variant="primary"
                    size="sm"
                    disabled={selectedFragments.size === 0}
                    aria-label={`Reconstruct ${selectedFragments.size} selected fragments`}
                  >
                    Reconstruct Selected ({selectedFragments.size})
                  </Button>
                </div>
              )}
            </div>
          }
        />

        {/* Empty State */}
        {!hasFragments && (
          <Card className="bg-charcoal-800/50 border-charcoal-700/50">
            <CardContent className="p-16 text-center">
              <div className="flex justify-center mb-6">
                <CameraIcon />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                No fragments yet
              </h3>
              <p className="text-charcoal-400 mb-8 max-w-md mx-auto">
                Capture pottery fragments to build your gallery and begin reconstruction analysis
              </p>
              <Button
                onClick={() => onNavigate('capture')}
                variant="primary"
                size="lg"
                className="px-8"
                aria-label="Go to capture page to add your first fragment"
              >
                Capture your first fragment
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Fragment Grid/List */}
        {hasFragments && (
          <div className={getGridClasses()} role="grid" aria-label="Fragment gallery">
            {fragments.map((fragment, index) => {
              const fragmentId = fragment.timestamp || fragment.id || index;
              const isSelected = selectedFragments.has(fragmentId);
              const isHovered = hoveredFragment === fragmentId;
              const isFocused = focusedFragment === fragmentId;
              
              return (
                <Card
                  key={fragmentId}
                  data-fragment-id={fragmentId}
                  className={`
                    cursor-pointer transition-all duration-300 transform outline-none
                    ${isSelected 
                      ? 'ring-2 ring-amber-500/50 border-amber-500/50 scale-105' 
                      : 'border-charcoal-700/50 hover:border-amber-500/30 hover:scale-[1.02] hover:-translate-y-1'
                    }
                    ${isHovered && !isSelected ? 'scale-[1.03] -translate-y-2' : ''}
                    ${isFocused ? 'ring-2 ring-amber-400/50' : ''}
                  `}
                  onClick={(e) => handleFragmentClick(fragmentId, e)}
                  onMouseEnter={() => handleFragmentHover(fragmentId)}
                  onMouseLeave={() => setHoveredFragment(null)}
                  onFocus={() => handleFragmentFocus(fragmentId)}
                  onBlur={handleFragmentBlur}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      handleFragmentClick(fragmentId, e);
                    }
                  }}
                  role="gridcell"
                  aria-selected={isSelected}
                  aria-label={`Fragment ${index + 1}: ${fragment.classification?.fragmentType || 'Unknown type'}, ${((fragment.classification?.confidence || 0) * 100).toFixed(1)}% confidence, ${isSelected ? 'selected' : 'not selected'}`}
                  tabIndex={0}
                >
                  <CardContent className="p-0">
                    {viewMode === 'grid' ? (
                      // Grid View Layout
                      <>
                        {/* Fragment Image */}
                        <div className="relative aspect-square bg-charcoal-950 overflow-hidden">
                          <img
                            src={fragment.image}
                            alt={`Fragment ${index + 1} - ${fragment.classification?.fragmentType || 'Unknown type'}`}
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Selection Indicator */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-amber-500 rounded-full p-1" aria-hidden="true">
                              <CheckIcon />
                            </div>
                          )}
                          
                          {/* Hover Overlay */}
                          {isHovered && (
                            <div className="absolute inset-0 bg-amber-500/10 backdrop-blur-sm flex items-center justify-center" aria-hidden="true">
                              <div className="text-amber-400 text-sm font-medium">
                                {isSelected ? 'Deselect' : 'Select'}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Fragment Info */}
                        <div className="p-4 space-y-3">
                          {/* Classification Badge */}
                          <div className="flex items-center justify-between">
                            <Badge 
                              variant={getFragmentVariant(fragment.classification?.fragmentType)}
                              size="sm"
                            >
                              {fragment.classification?.fragmentType || "Unknown"}
                            </Badge>
                            
                            <div className="text-xs text-charcoal-500">
                              {((fragment.classification?.confidence || 0) * 100).toFixed(1)}%
                            </div>
                          </div>
                          
                          {/* Additional Info */}
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-charcoal-500">Points:</span>
                              <span className="text-white font-medium">
                                {fragment.pointCloud?.length || 0}
                              </span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-charcoal-500">Captured:</span>
                              <span className="text-white font-medium text-xs">
                                {formatDate(fragment.timestamp)}
                              </span>
                            </div>
                            
                            {fragment.processingTime && (
                              <div className="flex justify-between">
                                <span className="text-charcoal-500">Processing:</span>
                                <span className="text-white font-medium text-xs">
                                  {(fragment.processingTime / 1000).toFixed(1)}s
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Quick Actions */}
                          <div className="flex gap-2 pt-2 border-t border-charcoal-800">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFragmentClick(fragmentId, e);
                              }}
                              aria-label={isSelected ? 'Deselect this fragment' : 'Select this fragment'}
                            >
                              {isSelected ? 'Selected' : 'Select'}
                            </Button>
                            
                            <Button
                              variant="secondary"
                              size="sm"
                              className="flex-1 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigate('reconstruct');
                              }}
                              aria-label="View this fragment in reconstruction"
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      // List View Layout
                      <div className="flex items-center p-4 gap-4">
                        {/* Thumbnail */}
                        <div className="relative w-20 h-20 bg-charcoal-950 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={fragment.image}
                            alt={`Fragment ${index + 1} thumbnail`}
                            className="w-full h-full object-cover"
                          />
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-amber-500 rounded-full p-0.5" aria-hidden="true">
                              <CheckIcon />
                            </div>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <Badge 
                              variant={getFragmentVariant(fragment.classification?.fragmentType)}
                              size="sm"
                            >
                              {fragment.classification?.fragmentType || "Unknown"}
                            </Badge>
                            <div className="text-xs text-charcoal-500">
                              {((fragment.classification?.confidence || 0) * 100).toFixed(1)}%
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div>
                              <span className="text-charcoal-500">Points:</span>
                              <span className="text-white font-medium ml-1">
                                {fragment.pointCloud?.length || 0}
                              </span>
                            </div>
                            <div>
                              <span className="text-charcoal-500">Captured:</span>
                              <span className="text-white font-medium ml-1 text-xs">
                                {formatDate(fragment.timestamp)}
                              </span>
                            </div>
                            {fragment.processingTime && (
                              <div>
                                <span className="text-charcoal-500">Processing:</span>
                                <span className="text-white font-medium ml-1">
                                  {(fragment.processingTime / 1000).toFixed(1)}s
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFragmentClick(fragmentId, e);
                            }}
                            aria-label={isSelected ? 'Deselect this fragment' : 'Select this fragment'}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate('reconstruct');
                            }}
                            aria-label="View this fragment in reconstruction"
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Enhanced Selection Summary */}
        {hasFragments && selectedFragments.size > 0 && (
          <Card className="bg-charcoal-800/50 border-charcoal-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <span className="font-medium">
                    {selectedFragments.size} fragment{selectedFragments.size !== 1 ? 's' : ''} selected
                  </span>
                  <span className="text-charcoal-400 ml-2">
                    for reconstruction
                  </span>
                  {/* Additional stats */}
                  <div className="text-xs text-charcoal-500 mt-1">
                    {(() => {
                      const stats = getSelectionStats();
                      return `Avg confidence: ${stats.avgConfidence.toFixed(1)}% | Total points: ${stats.totalPoints.toLocaleString()}`;
                    })()}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleClearSelection}
                    variant="ghost"
                    size="sm"
                    aria-label="Clear all selected fragments"
                  >
                    Clear Selection
                  </Button>
                  <Button
                    onClick={handleReconstructSelected}
                    variant="primary"
                    size="sm"
                    aria-label={`Reconstruct ${selectedFragments.size} selected fragments`}
                  >
                    Reconstruct
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Navigation */}
        <nav className="text-center space-x-4" aria-label="Gallery navigation">
          <Button
            onClick={() => onNavigate('home')}
            variant="ghost"
            aria-label="Go back to home page"
          >
            ← Back to Home
          </Button>
          {hasFragments && (
            <Button
              onClick={() => onNavigate('capture')}
              variant="secondary"
              aria-label="Go to capture page to add more fragments"
            >
              Capture More
            </Button>
          )}
        </nav>

        {/* Status indicator for screen readers */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {lastAction && `Last action: ${lastAction.replace('_', ' ')}`}
        </div>
      </div>
    </div>
  );
}
