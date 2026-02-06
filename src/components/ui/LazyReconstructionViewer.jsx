import React, { Suspense, lazy } from 'react';
import { cn } from '../../utils/cn.js';

// Lazy load the heavy 3D viewer
const HeavyReconstructionViewer = lazy(() => 
  import('../features/reconstruction/ReconstructionViewer').then(module => ({
    default: module.ReconstructionViewer
  }))
);

/**
 * @typedef {Object} LazyReconstructionViewerProps
 * @property {any} [mesh]
 * @property {any} [classification]
 * @property {boolean} [showPointCloud]
 * @property {boolean} [showMesh]
 * @property {boolean} [autoRotate]
 * @property {() => void} [onReady]
 * @property {string} [className]
 * @property {React.ReactNode} [fallback]
 */

export const LazyReconstructionViewer = React.forwardRef(
  ({ 
    mesh, 
    classification, 
    showPointCloud = false, 
    showMesh = true, 
    autoRotate = false,
    onReady,
    className,
    fallback = (
      <div className={cn(
        'w-full h-full bg-zinc-900 rounded-lg',
        'flex items-center justify-center'
      )}>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-zinc-400">Loading 3D viewer...</p>
          <p className="text-zinc-500 text-sm">This may take a moment</p>
        </div>
      </div>
    )
  }, ref) => {
  return (
    <div ref={ref} className={cn('w-full h-full', className)}>
      <Suspense fallback={fallback}>
        <HeavyReconstructionViewer
          mesh={mesh}
          classification={classification}
          showPointCloud={showPointCloud}
          showMesh={showMesh}
          autoRotate={autoRotate}
          onReady={onReady}
        />
      </Suspense>
    </div>
  );
}
);
LazyReconstructionViewer.displayName = 'LazyReconstructionViewer';
