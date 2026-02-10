import React, { Suspense, lazy } from 'react';
import { cn } from '../../utils/cn';

// Lazy load the heavy camera component
const HeavyCameraCapture = lazy(() =>
  import('../CameraCapture').then(module => ({
    default: module.default
  }))
);

/**
 * @typedef {Object} LazyCameraCaptureProps
 * @property {(result: any) => void} onResult
 * @property {boolean} modelsReady
 * @property {string} [className]
 * @property {React.ReactNode} [fallback]
 */

export const LazyCameraCapture = React.forwardRef((props, ref) => {
  const {
    onResult,
    modelsReady,
    className,
    fallback = (
      <div className={cn(
        'w-full h-full bg-zinc-900 rounded-lg',
        'flex items-center justify-center'
      )}>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-zinc-400">Initializing camera...</p>
          <p className="text-zinc-500 text-sm">Please allow camera access</p>
        </div>
      </div>
    )
  } = props;
  return (
    <div ref={ref} className={cn('w-full h-full', className)}>
      <Suspense fallback={fallback}>
        <HeavyCameraCapture
          onResult={onResult}
          modelsReady={modelsReady}
        />
      </Suspense>
    </div>
  );
});
LazyCameraCapture.displayName = 'LazyCameraCapture';

// Default export for backward compatibility
export default LazyCameraCapture;
