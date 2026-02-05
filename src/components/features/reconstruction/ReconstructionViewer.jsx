import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '../../../utils/cn';

/**
 * @typedef {Object} ReconstructionViewerProps
 * @property {any} [mesh]
 * @property {any} [classification]
 * @property {boolean} [showPointCloud]
 * @property {boolean} [showMesh]
 * @property {boolean} [autoRotate]
 * @property {() => void} [onReady]
 * @property {string} [className]
 */

export const ReconstructionViewer = React.forwardRef(
  ({ 
    mesh, 
    classification, 
    showPointCloud = false, 
    showMesh = true, 
    autoRotate = false,
    onReady,
    className,
    ...props 
  }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Initialize 3D viewer
    useEffect(() => {
      if (!containerRef.current || !canvasRef.current) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const canvas = canvasRef.current;
        const container = containerRef.current;
        
        // Set canvas size
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        // Initialize Three.js scene (simplified for this example)
        const gl = canvas.getContext('webgl');
        if (!gl) {
          throw new Error('WebGL not supported');
        }
        
        // Clear canvas with gradient background
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
          gradient.addColorStop(0, '#1a1a1a');
          gradient.addColorStop(1, '#0f0f0f');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw placeholder text
          ctx.fillStyle = '#71717a';
          ctx.font = '16px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText('3D Reconstruction Viewer', canvas.width / 2, canvas.height / 2 - 20);
          ctx.fillText('Loading mesh data...', canvas.width / 2, canvas.height / 2 + 10);
        }
        
        setIsLoading(false);
        onReady?.();
        
      } catch (err) {
        console.error('Failed to initialize 3D viewer:', err);
        setError('Failed to initialize 3D viewer');
        setIsLoading(false);
      }
    }, [onReady]);
    
    // Handle window resize
    useEffect(() => {
      const handleResize = () => {
        if (canvasRef.current && containerRef.current) {
          canvasRef.current.width = containerRef.current.clientWidth;
          canvasRef.current.height = containerRef.current.clientHeight;
        }
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    return (
      <div 
        ref={ref} 
        className={cn('relative w-full h-full', className)} 
        {...props}
      >
        <div ref={containerRef} className="w-full h-full">
          <canvas 
            ref={canvasRef}
            className="w-full h-full rounded-lg"
            style={{ 
              background: 'linear-gradient(to bottom, #1a1a1a, #0f0f0f)' 
            }}
          />
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 rounded-lg">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-zinc-400 text-sm">Initializing 3D viewer...</p>
              </div>
            </div>
          )}
          
          {/* Error State */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 rounded-lg">
              <div className="text-center space-y-2">
                <div className="text-red-400 text-lg">⚠️</div>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}
          
          {/* Mesh Info Overlay */}
          {!isLoading && !error && mesh && (
            <div className="absolute top-4 left-4 bg-zinc-900/80 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
              <div className="space-y-1">
                <div>Type: {classification?.fragmentType || 'Unknown'}</div>
                <div>Confidence: {((classification?.confidence || 0) * 100).toFixed(1)}%</div>
                {autoRotate && <div className="text-amber-400">Auto-rotating</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ReconstructionViewer.displayName = 'ReconstructionViewer';
