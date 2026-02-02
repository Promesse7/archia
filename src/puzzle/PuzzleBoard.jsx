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
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ 
    width: cols * pieceSize, 
    height: rows * pieceSize, 
    scale: 1 
  });

  // Responsive sizing
  useEffect(() => {
    const updateSize = () => {
      const maxWidth = Math.min(window.innerWidth - 40, 800);
      const maxHeight = Math.min(window.innerHeight - 300, 600);
      const scale = Math.min(maxWidth / (cols * pieceSize), maxHeight / (rows * pieceSize), 1);
      setContainerSize({
        width: cols * pieceSize * scale,
        height: rows * pieceSize * scale,
        scale
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [rows, cols, pieceSize]);

  // Initialize puzzle with error handling
  useEffect(() => {
    console.log('PuzzleBoard: Initializing with imageSrc:', imageSrc);
    
    if (!imageSrc) {
      console.log('PuzzleBoard: No imageSrc provided');
      setImageError(true);
      setLoading(false);
      return;
    }

    setImageError(false);
    const img = new Image();
    
    const handleLoad = () => {
      console.log('PuzzleBoard: Image loaded successfully');
      initializePuzzle(img);
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

  const initializePuzzle = useCallback((img) => {
    console.log('PuzzleBoard: Initializing puzzle with img dimensions:', img.width, 'x', img.height);
    console.log('PuzzleBoard: Container size:', containerSize);
    
    const newPieces = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const id = `${row}-${col}`;
        const correctPosition = row * cols + col;
        
        newPieces.push({
          id,
          row,
          col,
          correctPosition,
          currentPosition: correctPosition,
          x: (correctPosition % cols) * pieceSize,
          y: Math.floor(correctPosition / cols) * pieceSize,
          width: pieceSize,
          height: pieceSize,
          imageX: col * (img.width / cols),
          imageY: row * (img.height / rows),
          imageWidth: img.width / cols,
          imageHeight: img.height / rows
        });
      }
    }

    // Shuffle pieces using Fisher-Yates algorithm
    const shuffled = [...newPieces];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tempPos = shuffled[i].currentPosition;
      shuffled[i].currentPosition = shuffled[j].currentPosition;
      shuffled[j].currentPosition = tempPos;
      
      // Update x,y positions based on new position
      const iPos = shuffled[i].currentPosition;
      const jPos = shuffled[j].currentPosition;
      shuffled[i].x = (iPos % cols) * pieceSize;
      shuffled[i].y = Math.floor(iPos / cols) * pieceSize;
      shuffled[j].x = (jPos % cols) * pieceSize;
      shuffled[j].y = Math.floor(jPos / cols) * pieceSize;
    }

    console.log('PuzzleBoard: Created', shuffled.length, 'pieces');
    setPieces(shuffled);
  }, [rows, cols, pieceSize, containerSize]);

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
    if (imageSrc) {
      const img = new Image();
      img.onload = () => {
        initializePuzzle(img);
      };
      img.src = imageSrc;
    }
  }, [imageSrc, initializePuzzle]);

  // Resolve puzzle - auto-complete
  const resolvePuzzle = useCallback(() => {
    const resolvedPieces = pieces.map(piece => ({
      ...piece,
      currentPosition: piece.correctPosition,
      x: (piece.correctPosition % cols) * pieceSize,
      y: Math.floor(piece.correctPosition / cols) * pieceSize,
      snapped: true
    }));
    
    setPieces(resolvedPieces);
    setShowHint(false);
    
    setTimeout(() => {
      setIsCompleted(true);
      onComplete();
    }, 500);
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
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Loading state
  if (loading) {
    console.log('PuzzleBoard: Rendering loading state');
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: '18px',
        color: '#666',
        flexDirection: 'column',
        gap: '20px'
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
    );
  }

  // Error state
  if (imageError) {
    console.log('PuzzleBoard: Rendering error state');
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: '18px',
        color: '#f44336',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div>❌ Failed to load puzzle image</div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Please check the image source and try again
        </div>
      </div>
    );
  }

  console.log('PuzzleBoard: Rendering puzzle with', pieces.length, 'pieces');
  console.log('PuzzleBoard: Container size:', containerSize);

  const progress = calculateProgress();

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      gap: '20px',
      padding: '20px',
      maxWidth: '100vw',
      overflow: 'hidden'
    }}>
      {/* Header with piece count */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ 
          margin: '0 0 10px 0',
          fontSize: 'clamp(20px, 4vw, 28px)',
          color: '#333'
        }}>
          🏺 Archaeological Puzzle
        </h2>
        <p style={{ 
          margin: 0,
          color: '#666',
          fontSize: 'clamp(14px, 2.5vw, 16px)'
        }}>
          {rows} × {cols} = {rows * cols} pieces • {rows * cols <= 16 ? 'Easy' : rows * cols <= 36 ? 'Medium' : 'Hard'}
        </p>
      </div>

      {/* Progress Bar */}
      <div style={{ 
        width: '100%', 
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '100%',
          height: '24px',
          backgroundColor: '#e0e0e0',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '8px',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: progress === 100 ? '#4caf50' : '#2196f3',
            transition: 'width 0.5s ease',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {progress > 10 && `${progress}%`}
          </div>
        </div>
        <div style={{
          fontSize: 'clamp(12px, 2vw, 14px)',
          color: '#666',
          fontWeight: '500'
        }}>
          {progress === 100 ? '🎉 Complete!' : `${progress}% Complete • ${pieces.filter(p => p.currentPosition === p.correctPosition).length} of ${pieces.length} pieces in place`}
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
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

      {/* Puzzle Container */}
      <div 
        ref={containerRef}
        style={{
          position: 'relative',
          width: `${containerSize.width}px`,
          height: `${containerSize.height}px`,
          border: '2px solid #ddd',
          borderRadius: '12px',
          backgroundColor: '#f5f5f5',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}
      >
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

        {/* Puzzle pieces */}
        {pieces.map((piece) => (
          <div
            key={piece.id}
            draggable
            onDragStart={(e) => handleDragStart(e, piece)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, piece)}
            onTouchStart={(e) => handleTouchStart(e, piece)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              position: 'absolute',
              left: piece.x * (containerSize.scale || 1),
              top: piece.y * (containerSize.scale || 1),
              width: piece.width * (containerSize.scale || 1),
              height: piece.height * (containerSize.scale || 1),
              backgroundImage: `url(${imageSrc})`,
              backgroundPosition: `-${piece.imageX * (containerSize.scale || 1)}px -${piece.imageY * (containerSize.scale || 1)}px`,
              backgroundSize: `${cols * piece.imageWidth * (containerSize.scale || 1)}px ${rows * piece.imageHeight * (containerSize.scale || 1)}px`,
              border: piece.currentPosition === piece.correctPosition 
                ? '3px solid #4caf50' 
                : piece.snapped 
                  ? '2px solid #2196f3' 
                  : '1px solid #ccc',
              cursor: draggedPiece?.id === piece.id ? 'grabbing' : 'grab',
              borderRadius: '4px',
              transition: draggedPiece?.id === piece.id ? 'none' : 'all 0.2s ease',
              zIndex: draggedPiece?.id === piece.id ? 1000 : piece.currentPosition === piece.correctPosition ? 10 : 1,
              opacity: draggedPiece?.id === piece.id ? 0.8 : 1,
              boxShadow: piece.currentPosition === piece.correctPosition 
                ? '0 2px 8px rgba(76, 175, 80, 0.4)' 
                : '0 1px 3px rgba(0,0,0,0.2)',
              transform: draggedPiece?.id === piece.id ? 'scale(1.05)' : 'scale(1)',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none'
            }}
          />
        ))}
        
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
