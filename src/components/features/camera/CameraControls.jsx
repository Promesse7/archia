import React from 'react';
import { Button, IconButton } from '../ui';
import { cn } from '../../utils/cn';

interface CameraControlsProps {
  onCapture: () => void;
  onRetake: () => void;
  onUpload: () => void;
  isCapturing: boolean;
  hasPreview: boolean;
  disabled?: boolean;
  className?: string;
}

export const CameraControls = React.forwardRef<HTMLDivElement, CameraControlsProps>(
  ({ onCapture, onRetake, onUpload, isCapturing, hasPreview, disabled = false, className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('flex gap-3', className)} {...props}>
      {!hasPreview ? (
        <>
          <Button
            onClick={onCapture}
            disabled={disabled || isCapturing}
            variant="primary"
            className="flex-1"
          >
            {isCapturing ? 'Capturing...' : 'Capture Fragment'}
          </Button>
          
          <Button
            onClick={onUpload}
            disabled={disabled}
            variant="secondary"
          >
            Upload Image
          </Button>
        </>
      ) : (
        <>
          <Button
            onClick={onRetake}
            disabled={disabled}
            variant="secondary"
            className="flex-1"
          >
            Retake
          </Button>
          
          <Button
            onClick={onUpload}
            disabled={disabled}
            variant="primary"
            className="flex-1"
          >
            Use This Fragment
          </Button>
        </>
      )}
    </div>
  );
});

CameraControls.displayName = 'CameraControls';

export { CameraControls };
