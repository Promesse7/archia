import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, Button, StatusPill } from '../ui';
import { cn } from '../../utils/cn';

interface CameraCaptureProps {
  onResult: (result: any) => void;
  modelsReady: boolean;
  className?: string;
}

const CAMERA_STATES = {
  IDLE: 'idle',
  INITIALIZING: 'initializing',
  CAPTURING: 'capturing',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  ERROR: 'error'
} as const;

export const CameraCapture = React.forwardRef<HTMLDivElement, CameraCaptureProps>(
  ({ onResult, modelsReady, className, ...props }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    const [cameraState, setCameraState] = useState(CAMERA_STATES.IDLE);
    const [error, setError] = useState<string | null>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);

    // Initialize camera
    const initializeCamera = useCallback(async () => {
      if (!modelsReady) return;
      
      try {
        setCameraState(CAMERA_STATES.INITIALIZING);
        setError(null);
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setIsCameraReady(true);
          setCameraState(CAMERA_STATES.IDLE);
        }
      } catch (err) {
        console.error('Camera initialization failed:', err);
        setError('Failed to access camera');
        setCameraState(CAMERA_STATES.ERROR);
      }
    }, [modelsReady]);

    // Capture image
    const captureImage = useCallback(async () => {
      if (!videoRef.current || !canvasRef.current || !isCameraReady) return;
      
      try {
        setCameraState(CAMERA_STATES.CAPTURING);
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (!context) throw new Error('Canvas context not available');
        
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to blob
        canvas.toBlob(async (blob) => {
          if (!blob) throw new Error('Failed to capture image');
          
          setCameraState(CAMERA_STATES.PROCESSING);
          
          // Create image element for processing
          const imageElement = new Image();
          imageElement.onload = () => {
            onResult({
              imageElement,
              imageBlob: blob,
              timestamp: Date.now()
            });
            setCameraState(CAMERA_STATES.SUCCESS);
          };
          imageElement.src = URL.createObjectURL(blob);
        }, 'image/jpeg', 0.95);
        
      } catch (err) {
        console.error('Capture failed:', err);
        setError('Failed to capture image');
        setCameraState(CAMERA_STATES.ERROR);
      }
    }, [isCameraReady, onResult]);

    // Cleanup camera on unmount
    useEffect(() => {
      return () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };
    }, []);

    // Auto-initialize when models are ready
    useEffect(() => {
      if (modelsReady && cameraState === CAMERA_STATES.IDLE && !isCameraReady) {
        initializeCamera();
      }
    }, [modelsReady, cameraState, isCameraReady, initializeCamera]);

    const getStatusMessage = () => {
      switch (cameraState) {
        case CAMERA_STATES.INITIALIZING:
          return 'Initializing camera...';
        case CAMERA_STATES.CAPTURING:
          return 'Capturing...';
        case CAMERA_STATES.PROCESSING:
          return 'Processing fragment...';
        case CAMERA_STATES.SUCCESS:
          return 'Fragment captured!';
        case CAMERA_STATES.ERROR:
          return error || 'Camera error';
        default:
          return 'Ready to capture';
      }
    };

    return (
      <div ref={ref} className={cn('space-y-4', className)} {...props}>
        <Card className="bg-zinc-800/50 border-zinc-700/50">
          <CardContent className="p-6 space-y-4">
            {/* Camera Preview */}
            <div className="relative aspect-video bg-zinc-900 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {!isCameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80">
                  <div className="text-center space-y-2">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-zinc-400 text-sm">Initializing camera...</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Status */}
            <StatusPill
              status={cameraState === CAMERA_STATES.ERROR ? 'error' : 
                     cameraState === CAMERA_STATES.SUCCESS ? 'success' : 
                     cameraState === CAMERA_STATES.PROCESSING ? 'loading' : 'idle'}
              message={getStatusMessage()}
            />
            
            {/* Controls */}
            <div className="flex gap-3">
              <Button
                onClick={captureImage}
                disabled={!isCameraReady || cameraState === CAMERA_STATES.PROCESSING}
                variant="primary"
                className="flex-1"
              >
                {cameraState === CAMERA_STATES.PROCESSING ? 'Processing...' : 'Capture Fragment'}
              </Button>
              
              {cameraState === CAMERA_STATES.SUCCESS && (
                <Button
                  onClick={() => setCameraState(CAMERA_STATES.IDLE)}
                  variant="secondary"
                >
                  Capture Another
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

CameraCapture.displayName = 'CameraCapture';

export { CameraCapture, CAMERA_STATES };
