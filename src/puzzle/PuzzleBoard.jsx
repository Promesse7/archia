import { useState, useRef, useEffect, useCallback } from "react";

export default function PuzzleBoard({ 
  imageSrc, 
  rows = 4, 
  cols = 4,
  onComplete = () => {},
  pieceSize = 80,
  snapThreshold = 30,
  showGrid = true
}) {
  const [pieces, setPieces] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadedImage, setLoadedImage] = useState(null);
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const puzzleRef = useRef(null);
  const rafRef = useRef(null);
  const lastProgressUpdateRef = useRef(0);
  const initTokenRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ 
    width: cols * pieceSize, 
    height: rows * pieceSize, 
    scale: 1 
  });

  // Responsive sizing
  useEffect(() => {
    const updateSize = () => {
      const fullscreenActive =
        document.fullscreenElement &&
        (document.fullscreenElement === containerRef.current);

      const maxWidth = fullscreenActive
        ? window.innerWidth
        : Math.min(window.innerWidth - 40, 800);
      const maxHeight = fullscreenActive
        ? window.innerHeight
        : Math.min(window.innerHeight - 300, 600);
      const scale = Math.min(maxWidth / (cols * pieceSize), maxHeight / (rows * pieceSize), 1);
      setContainerSize({
        width: cols * pieceSize * scale,
        height: rows * pieceSize * scale,
        scale
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    document.addEventListener('fullscreenchange', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
      document.removeEventListener('fullscreenchange', updateSize);
    };
  }, [rows, cols, pieceSize]);

  useEffect(() => {
    const onFs = () => {
      const fullscreenActive =
        document.fullscreenElement &&
        (document.fullscreenElement === containerRef.current);
      setIsFullscreen(!!fullscreenActive);
    };

    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // Initialize puzzle with error handling
  useEffect(() => {
    console.log('PuzzleBoard: Initializing with imageSrc:', imageSrc);
    
    if (!imageSrc) {
      console.log('PuzzleBoard: No imageSrc provided');
      setImageError(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setImageError(false);
    setLoadedImage(null);
    initTokenRef.current = null;
    const img = new Image();
    
    const handleLoad = () => {
      console.log('PuzzleBoard: Image loaded successfully');
      setLoadedImage(img);
      setLoading(false);
    };
    
    const handleError = () => {
      console.log('PuzzleBoard: Image failed to load');
      setImageError(true);
      setLoading(false);
    };

    img.onload = handleLoad;
    img.onerror = handleError;
    img.src = imageSrc;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageSrc, rows, cols]);

  useEffect(() => {
    if (!loadedImage) return;
    if (!canvasRef.current) return;
    if (!window.Puzzle) return;

    const token = `${imageSrc}|${rows}|${cols}|${Math.round(containerSize.width)}x${Math.round(containerSize.height)}`;
    if (initTokenRef.current === token) return;
    initTokenRef.current = token;

    initializePuzzle(loadedImage);
  }, [loadedImage, imageSrc, rows, cols, containerSize.width, containerSize.height]);

  function initializePuzzle(img) {
    console.log('PuzzleBoard: Initializing puzzle with img dimensions:', img.width, 'x', img.height);
    console.log('PuzzleBoard: Container size:', containerSize);
    
    // Store image dimensions for background sizing
    setImageDimensions({ width: img.width, height: img.height });

    // Reset any existing animation
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Create library puzzle instance
    if (!window.Puzzle) {
      console.error('PuzzleBoard: window.Puzzle is not available. Did /js/puzzle.js load?');
      setImageError(true);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    // Ensure the canvas has the right CSS size before Puzzle reads its bounding rect
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    const puzzle = new window.Puzzle({
      canvas,
      rows,
      columns: cols,
      image: img,
      maxImageWidth: 60,
      maxImageHeight: 75,
      solveRandom: true,
      hintsEnabled: true,
      scaleMultiplier: 1
    });

    puzzle.generatePieces();
    puzzle.randomizePieces();

    puzzleRef.current = puzzle;
    setIsCompleted(false);
    setPieces([]);

    const tick = (t) => {
      if (!puzzleRef.current) return;

      puzzleRef.current.draw();

      // Update progress a few times per second
      if (!lastProgressUpdateRef.current || t - lastProgressUpdateRef.current > 250) {
        lastProgressUpdateRef.current = t;

        const p = puzzleRef.current;
        let snappedCount = 0;
        let total = 0;

        if (p && Array.isArray(p.pieces)) {
          p.pieces.forEach((colList) => {
            colList.forEach((piece) => {
              total += 1;
              if (piece && piece.snapped === true) snappedCount += 1;
            });
          });
        }

        // Keep existing progress UI working by storing a lightweight array
        if (total > 0) {
          const temp = new Array(total).fill(0).map((_, i) => ({
            correctPosition: i,
            currentPosition: i < snappedCount ? i : -1
          }));
          setPieces(temp);

          if (snappedCount === total && total > 0 && !isCompleted) {
            setIsCompleted(true);
            onComplete();
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      puzzleRef.current = null;
    };
  }, []);

  // Calculate snap position for auto-snapping
  const calculateSnapPosition = useCallback((piece, targetX, targetY) => {
    const gridX = Math.round(targetX / pieceSize) * pieceSize;
    const gridY = Math.round(targetY / pieceSize) * pieceSize;
    
    const distance = Math.sqrt(
      Math.pow(targetX - gridX, 2) + Math.pow(targetY - gridY, 2)
    );
    
    if (distance < snapThreshold) {
      return { x: gridX, y: gridY, snapped: true };
    }
    
    return { x: targetX, y: targetY, snapped: false };
  }, [pieceSize, snapThreshold]);

  // Handle drag start
  const handleDragStart = useCallback((e, piece) => {
    setDraggedPiece(piece);
    e.dataTransfer.effectAllowed = 'move';
    
    // Store piece ID for mobile touch events
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', piece.id);
    }
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop with auto-snapping
  const handleDrop = useCallback((e, targetPiece) => {
    e.preventDefault();
    
    if (!draggedPiece || draggedPiece.id === targetPiece.id) {
      setDraggedPiece(null);
      return;
    }

    const newPieces = pieces.map(piece => {
      if (piece.id === draggedPiece.id) {
        const snap = calculateSnapPosition(piece, targetPiece.x, targetPiece.y);
        return {
          ...piece,
          currentPosition: targetPiece.currentPosition,
          x: targetPiece.x,
          y: targetPiece.y,
          snapped: snap.snapped
        };
      }
      if (piece.id === targetPiece.id) {
        const snap = calculateSnapPosition(piece, draggedPiece.x, draggedPiece.y);
        return {
          ...piece,
          currentPosition: draggedPiece.currentPosition,
          x: draggedPiece.x,
          y: draggedPiece.y,
          snapped: snap.snapped
        };
      }
      return piece;
    });

    setPieces(newPieces);
    setDraggedPiece(null);
    checkCompletion(newPieces);
  }, [draggedPiece, pieces, calculateSnapPosition]);

  // Touch event handlers for mobile support
  const handleTouchStart = useCallback((e, piece) => {
    e.preventDefault();
    const touch = e.touches[0];
    setTouchStart({
      piece,
      x: touch.clientX,
      y: touch.clientY,
      pieceX: piece.x,
      pieceY: piece.y
    });
    setDraggedPiece(piece);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStart) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    const newPieces = pieces.map(piece => {
      if (piece.id === touchStart.piece.id) {
        const newX = touchStart.pieceX + deltaX;
        const newY = touchStart.pieceY + deltaY;
        const snap = calculateSnapPosition(piece, newX, newY);
        
        return {
          ...piece,
          x: snap.x,
          y: snap.y,
          snapped: snap.snapped
        };
      }
      return piece;
    });
    
    setPieces(newPieces);
  }, [touchStart, pieces, calculateSnapPosition]);

  const handleTouchEnd = useCallback((e) => {
    if (!touchStart) return;
    e.preventDefault();
    
    // Find the piece at the current position
    const currentPiece = pieces.find(p => p.id === touchStart.piece.id);
    if (!currentPiece) return;
    
    // Check if piece is over another piece
    const targetPiece = pieces.find(piece => {
      if (piece.id === currentPiece.id) return false;
      const distance = Math.sqrt(
        Math.pow(piece.x - currentPiece.x, 2) + 
        Math.pow(piece.y - currentPiece.y, 2)
      );
      return distance < pieceSize;
    });
    
    if (targetPiece) {
      handleDrop(e, targetPiece);
    }
    
    setTouchStart(null);
    setDraggedPiece(null);
  }, [touchStart, pieces, pieceSize, handleDrop]);

  // Check completion
  const checkCompletion = useCallback((currentPieces) => {
    const isComplete = currentPieces.every(piece => 
      piece.currentPosition === piece.correctPosition
    );
    
    if (isComplete && !isCompleted) {
      setIsCompleted(true);
      onComplete();
    }
  }, [isCompleted, onComplete]);

  // Calculate progress percentage
  const calculateProgress = useCallback(() => {
    if (pieces.length === 0) return 0;
    const correctPieces = pieces.filter(piece => 
      piece.currentPosition === piece.correctPosition
    ).length;
    return Math.round((correctPieces / pieces.length) * 100);
  }, [pieces]);

  // Reset puzzle
  const resetPuzzle = useCallback(() => {
    setIsCompleted(false);
    setShowHint(false);
    if (puzzleRef.current) {
      puzzleRef.current.randomizePieces();
    }
  }, [imageSrc, initializePuzzle]);

  // Resolve puzzle - auto-complete
  const resolvePuzzle = useCallback(() => {
    setShowHint(false);
    if (puzzleRef.current) {
      puzzleRef.current.solve();
    }
  }, [pieces, cols, pieceSize, onComplete]);

  // Show hint
  const toggleHint = useCallback(() => {
    setShowHint(!showHint);
    setTimeout(() => {
      setShowHint(false);
    }, 2000);
  }, [showHint]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Error state
  if (imageError) {
    console.log('PuzzleBoard: Rendering error state');
    return (
      <div className="flex flex-col items-center justify-center h-96 text-red-600 text-lg gap-5">
        <div>❌ Failed to load puzzle image</div>
        <div className="text-sm text-muted">
          Please check the image source and try again
        </div>
      </div>
    );
  }

  console.log('PuzzleBoard: Rendering puzzle with', pieces.length, 'pieces');
  console.log('PuzzleBoard: Container size:', containerSize);

  const progress = calculateProgress();

  return (
    <div className="flex flex-col items-center gap-5 p-5 max-w-screen overflow-hidden">
      <div className="text-center">
        <h2 className="m-0 mb-2.5 text-[clamp(20px,4vw,28px)] text-ink">
          🏺 Archaeological Puzzle
        </h2>
        <p className="m-0 text-muted text-[clamp(14px,2.5vw,16px)]">
          Drag pieces to reconstruct the artifact
        </p>
      </div>
      {/* Progress Bar */}
      <div className="w-full max-w-[600px] text-center">
        <div className="relative w-full h-6 bg-surface rounded-lg mb-2 shadow-inner">
          <progress 
            className="absolute inset-0 w-full h-6 [&::-webkit-progress-bar]:bg-surface [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-accent [&::-webkit-progress-value]:to-accentHover rounded-lg"
            value={progress}
            max={100}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-ink mix-blend-difference">
            {progress > 10 && `${progress}%`}
          </div>
        </div>
        <div className="text-[clamp(12px,2vw,14px)] text-muted font-medium">
          {pieces.filter(p => p?.snapped).length} of {pieces.length} pieces placed
        </div>
      </div>

      {/* Puzzle Container */}
      <div 
        ref={containerRef}
        style={{
          position: 'relative',
          width: isFullscreen ? '100vw' : `${containerSize.width}px`,
          height: isFullscreen ? '100vh' : `${containerSize.height}px`,
          border: '2px solid #ddd',
          borderRadius: '12px',
          backgroundColor: '#f5f5f5',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}
      >
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          alignItems: 'center',
          zIndex: 900,
          backgroundColor: 'rgba(255,255,255,0.8)',
          padding: '8px',
          borderRadius: '10px',
          backdropFilter: 'blur(6px)'
        }}>
          <button
            onClick={toggleHint}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: 'clamp(12px, 2vw, 14px)',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            💡 Hint
          </button>

          <button
            onClick={resolvePuzzle}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: 'clamp(12px, 2vw, 14px)',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            ✅ Resolve
          </button>

          <button
            onClick={toggleFullscreen}
            style={{
              padding: '10px 20px',
              backgroundColor: '#9c27b0',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: 'clamp(12px, 2vw, 14px)',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            {isFullscreen ? '🔲 Exit Fullscreen' : '🔳 Fullscreen'}
          </button>

          <button
            onClick={resetPuzzle}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: 'clamp(12px, 2vw, 14px)',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            🔄 Reset Puzzle
          </button>
        </div>
        {loading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            gap: '20px',
            backgroundColor: 'rgba(245,245,245,0.85)',
            zIndex: 999
          }}>
            <div>Loading puzzle...</div>
            <div style={{
              width: '50px',
              height: '50px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #4caf50',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        )}
        {/* Hint Overlay */}
        {showHint && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${imageSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.7,
            zIndex: 100,
            transition: 'opacity 0.3s ease',
            borderRadius: '12px'
          }} />
        )}

        {/* Grid overlay */}
        {showGrid && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              repeating-linear-gradient(0deg, rgba(200,200,200,0.3) 0px, transparent 1px, transparent ${pieceSize * (containerSize.scale || 1)}px, rgba(200,200,200,0.3) ${pieceSize * (containerSize.scale || 1) + 1}px),
              repeating-linear-gradient(90deg, rgba(200,200,200,0.3) 0px, transparent 1px, transparent ${pieceSize * (containerSize.scale || 1)}px, rgba(200,200,200,0.3) ${pieceSize * (containerSize.scale || 1) + 1}px)
            `,
            pointerEvents: 'none',
            zIndex: 1
          }} />
        )}

        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 2
          }}
        />
        
        {/* Completion Overlay */}
        {isCompleted && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(76, 175, 80, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            zIndex: 1000,
            borderRadius: '12px',
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              fontSize: 'clamp(36px, 6vw, 60px)',
              marginBottom: '20px',
              animation: 'bounce 1s ease-in-out'
            }}>
              🎉
            </div>
            <div style={{
              fontSize: 'clamp(24px, 4vw, 36px)',
              fontWeight: 'bold',
              marginBottom: '10px',
              textAlign: 'center'
            }}>
              Puzzle Complete!
            </div>
            <div style={{
              fontSize: 'clamp(14px, 2.5vw, 18px)',
              opacity: 0.9,
              textAlign: 'center',
              marginBottom: '30px',
              maxWidth: '80%'
            }}>
              Excellent archaeological reconstruction skills! 
              You've successfully restored this ancient artifact.
            </div>
            <button
              onClick={resetPuzzle}
              style={{
                padding: '12px 24px',
                backgroundColor: 'white',
                color: '#4caf50',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: 'clamp(14px, 2.5vw, 16px)',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              🎮 Play Again
            </button>
          </div>
        )}
      </div>

      {/* Educational Instructions */}
      <div style={{
        textAlign: 'center',
        color: '#666',
        fontSize: 'clamp(12px, 2vw, 14px)',
        maxWidth: '600px',
        lineHeight: '1.5',
        padding: '15px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        border: '1px solid #e0e0e0'
      }}>
        <strong style={{ color: '#333' }}>🔍 How to play:</strong> 
        Drag and drop puzzle pieces to reconstruct the archaeological image. 
        Pieces will <strong style={{ color: '#2196f3' }}>snap</strong> when close to the correct position. 
        <strong style={{ color: '#4caf50' }}>Green borders</strong> indicate pieces in the correct position. 
        This trains pattern recognition skills essential for real archaeological reconstruction work.
      </div>

      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-20px); }
            60% { transform: translateY(-10px); }
          }
        `
      }} />
    </div>
  );
}
