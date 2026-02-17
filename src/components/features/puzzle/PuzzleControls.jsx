import React from 'react';
import { Button, Badge } from '../ui';
import { cn } from '../../utils/cn';

interface PuzzleControlsProps {
  mode: 'quick' | 'timed' | 'free';
  timer: number;
  isPlaying: boolean;
  onReset: () => void;
  onHint: () => void;
  onExit: () => void;
  className?: string;
}

export const PuzzleControls = React.forwardRef < HTMLDivElement, PuzzleControlsProps> (
  ({ mode, timer, isPlaying, onReset, onHint, onExit, className, ...props }, ref) => {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getModeInfo = () => {
      switch (mode) {
        case 'quick':
          return { label: 'Quick Puzzle', variant: 'success' as const };
        case 'timed':
          return { label: 'Timed Challenge', variant: 'warning' as const };
        case 'free':
          return { label: 'Free Play', variant: 'info' as const };
        default:
          return { label: 'Puzzle', variant: 'neutral' as const };
      }
    };

    const modeInfo = getModeInfo();

    return (
      <div ref={ref} className={cn('space-y-4 overflow-hidden', className)} {...props}>
        {/* Mode Info */}
        <div className="flex items-center justify-between">
          <Badge variant={modeInfo.variant} size="sm">
            {modeInfo.label}
          </Badge>

          {mode === 'timed' && (
            <div className="flex items-center gap-2 text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-mono">{formatTime(timer)}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={onHint}
            disabled={!isPlaying}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Hint
          </Button>

          <Button
            onClick={onReset}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </Button>

          <Button
            onClick={onExit}
            variant="outline"
            size="sm"
          >
            Exit
          </Button>
        </div>
      </div>
    );
  }
);

PuzzleControls.displayName = 'PuzzleControls';

export { PuzzleControls };
