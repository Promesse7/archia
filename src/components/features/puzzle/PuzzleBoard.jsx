import React, { useState, useCallback } from 'react';
import { cn } from '../../utils/cn';

interface PuzzleBoardProps {
  pieces: number;
  onPiecePlaced: (pieceId: number, position: number) => void;
  onPuzzleComplete: () => void;
  className?: string;
}

export const PuzzleBoard = React.forwardRef<HTMLDivElement, PuzzleBoardProps>(
  ({ pieces, onPiecePlaced, onPuzzleComplete, className, ...props }, ref) => {
    const [placedPieces, setPlacedPieces] = useState(new Set<number>());
    const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
    
    const handlePieceClick = useCallback((pieceId: number) => {
      setSelectedPiece(pieceId);
    }, []);
    
    const handleCellClick = useCallback((position: number) => {
      if (selectedPiece !== null) {
        onPiecePlaced(selectedPiece, position);
        setPlacedPieces(prev => new Set(prev).add(selectedPiece));
        setSelectedPiece(null);
        
        // Check if puzzle is complete
        if (placedPieces.size + 1 === pieces) {
          onPuzzleComplete();
        }
      }
    }, [selectedPiece, onPiecePlaced, placedPieces.size, pieces, onPuzzleComplete]);
    
    const getGridSize = () => {
      return pieces === 9 ? 'grid-cols-3' : 'grid-cols-4';
    };
    
    const isPiecePlaced = (pieceId: number) => {
      return placedPieces.has(pieceId);
    };
    
    return (
      <div ref={ref} className={cn('space-y-6', className)} {...props}>
        {/* Puzzle Grid */}
        <div className={cn(
          'aspect-square max-w-2xl mx-auto',
          'grid gap-2',
          getGridSize()
        )}>
          {Array.from({ length: pieces }, (_, index) => {
            const isPlaced = isPiecePlaced(index);
            
            return (
              <div
                key={index}
                onClick={() => !isPlaced && handleCellClick(index)}
                className={cn(
                  'border-2 rounded-lg flex items-center justify-center text-2xl font-bold cursor-pointer',
                  'transition-all duration-200 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]',
                  isPlaced 
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400' 
                    : 'bg-zinc-800/50 border-zinc-600 text-zinc-400 hover:border-amber-500/50 hover:bg-zinc-700/50'
                )}
              >
                {isPlaced ? index + 1 : '?'}
              </div>
            );
          })}
        </div>
        
        {/* Available Pieces */}
        <div className="flex flex-wrap gap-3 justify-center">
          {Array.from({ length: pieces }, (_, index) => {
            const isPlaced = isPiecePlaced(index);
            const isSelected = selectedPiece === index;
            
            return (
              <button
                key={index}
                onClick={() => !isPlaced && handlePieceClick(index)}
                disabled={isPlaced}
                className={cn(
                  'w-12 h-12 rounded-lg font-bold transition-all duration-200',
                  isPlaced 
                    ? 'bg-zinc-700 text-zinc-600 cursor-not-allowed' 
                    : isSelected
                      ? 'bg-amber-500 text-white scale-110'
                      : 'bg-zinc-600 text-zinc-300 hover:bg-zinc-500 hover:scale-105'
                )}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);

PuzzleBoard.displayName = 'PuzzleBoard';

export { PuzzleBoard };
