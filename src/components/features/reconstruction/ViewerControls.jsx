import React, { useState, useCallback } from 'react';
import { Button, IconButton } from '../ui';
import { cn } from '../../utils/cn';

interface ViewerControlsProps {
  onRotate: (axis: 'x' | 'y' | 'z', value: number) => void;
  onZoom: (value: number) => void;
  onReset: () => void;
  onToggleAutoRotate: () => void;
  autoRotate: boolean;
  zoom: number;
  className?: string;
}

export const ViewerControls = React.forwardRef<HTMLDivElement, ViewerControlsProps>(
  ({ 
    onRotate, 
    onZoom, 
    onReset, 
    onToggleAutoRotate,
    autoRotate,
    zoom,
    className,
    ...props 
  }, ref) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const handleRotateX = useCallback((value: number) => {
      onRotate('x', value);
    }, [onRotate]);
    
    const handleRotateY = useCallback((value: number) => {
      onRotate('y', value);
    }, [onRotate]);
    
    const handleRotateZ = useCallback((value: number) => {
      onRotate('z', value);
    }, [onRotate]);
    
    const handleZoomIn = useCallback(() => {
      onZoom(Math.min(zoom + 0.1, 2));
    }, [zoom, onZoom]);
    
    const handleZoomOut = useCallback(() => {
      onZoom(Math.max(zoom - 0.1, 0.5));
    }, [zoom, onZoom]);
    
    const handleReset = useCallback(() => {
      onReset();
    }, [onReset]);
    
    const handleToggleAutoRotate = useCallback(() => {
      onToggleAutoRotate();
    }, [onToggleAutoRotate]);
    
    return (
      <div 
        ref={ref} 
        className={cn('bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4', className)} 
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">3D Controls</h3>
          <IconButton
            onClick={() => setIsExpanded(!isExpanded)}
            variant="ghost"
            size="sm"
          >
            {isExpanded ? '−' : '+'}
          </IconButton>
        </div>
        
        {/* Controls */}
        {isExpanded && (
          <div className="space-y-4">
            {/* Rotation Controls */}
            <div className="space-y-2">
              <h4 className="text-zinc-400 text-sm font-medium">Rotation</h4>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => handleRotateX(-15)}
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                >
                  X−
                </Button>
                <Button
                  onClick={() => handleRotateY(-15)}
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                >
                  Y−
                </Button>
                <Button
                  onClick={() => handleRotateZ(-15)}
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                >
                  Z−
                </Button>
                <Button
                  onClick={() => handleRotateX(15)}
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                >
                  X+
                </Button>
                <Button
                  onClick={() => handleRotateY(15)}
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                >
                  Y+
                </Button>
                <Button
                  onClick={() => handleRotateZ(15)}
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                >
                  Z+
                </Button>
              </div>
            </div>
            
            {/* Zoom Controls */}
            <div className="space-y-2">
              <h4 className="text-zinc-400 text-sm font-medium">Zoom</h4>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleZoomOut}
                  variant="secondary"
                  size="sm"
                >
                  −
                </Button>
                <div className="flex-1 text-center text-white text-sm">
                  {(zoom * 100).toFixed(0)}%
                </div>
                <Button
                  onClick={handleZoomIn}
                  variant="secondary"
                  size="sm"
                >
                  +
                </Button>
              </div>
            </div>
            
            {/* Action Controls */}
            <div className="space-y-2">
              <h4 className="text-zinc-400 text-sm font-medium">Actions</h4>
              <div className="flex gap-2">
                <Button
                  onClick={handleToggleAutoRotate}
                  variant={autoRotate ? 'primary' : 'secondary'}
                  size="sm"
                  className="flex-1"
                >
                  {autoRotate ? 'Stop Rotation' : 'Auto Rotate'}
                </Button>
                
                <Button
                  onClick={handleReset}
                  variant="ghost"
                  size="sm"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ViewerControls.displayName = 'ViewerControls';

export { ViewerControls };
