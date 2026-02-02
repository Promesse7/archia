import { useEffect, useRef, useState } from "react";
import { sliceImage } from "./puzzleUtils";
import PuzzlePiece from "./PuzzlePiece";

export default function PuzzleBoard({ 
  imageSrc, 
  rows = 10, 
  cols = 10,
  onComplete = () => {}
}) {
  const imgRef = useRef();
  const containerRef = useRef();
  const [pieces, setPieces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      // Scale image to fit container while maintaining aspect ratio
      const maxWidth = 800;
      const maxHeight = 600;
      
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (maxHeight / height) * width;
        height = maxHeight;
      }

      setImageSize({ width, height });
      
      // Create a canvas to resize the image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // Store the resized image
      const resizedImg = new Image();
      resizedImg.src = canvas.toDataURL();
      resizedImg.onload = () => {
        imgRef.current = resizedImg;
        setPieces(sliceImage(resizedImg, rows, cols));
        setLoading(false);
      };
    };
  }, [imageSrc, rows, cols]);

  useEffect(() => {
    const placedCount = pieces.filter(p => p.placed).length;
    const totalPieces = pieces.length;
    
    if (totalPieces > 0) {
      const progressPercent = Math.round((placedCount / totalPieces) * 100);
      setProgress(progressPercent);
      
      if (placedCount === totalPieces && totalPieces > 0) {
        onComplete();
      }
    }
  }, [pieces, onComplete]);

  const updatePiece = (id, x, y, placed) => {
    setPieces(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, currentX: x, currentY: y, placed }
          : p
      )
    );
  };

  const resetPuzzle = () => {
    if (!imgRef.current) return;
    setPieces(sliceImage(imgRef.current, rows, cols));
  };

  const showHint = () => {
    // Flash the background image briefly
    const container = containerRef.current;
    if (!container) return;
    
    container.style.backgroundImage = `url(${imageSrc})`;
    container.style.backgroundSize = `${imageSize.width}px ${imageSize.height}px`;
    container.style.backgroundRepeat = 'no-repeat';
    container.style.opacity = '0.3';
    
    setTimeout(() => {
      container.style.opacity = '1';
      setTimeout(() => {
        container.style.backgroundImage = 'none';
      }, 200);
    }, 1000);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading puzzle...
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      gap: '20px'
    }}>
      {/* Progress Bar */}
      <div style={{ 
        width: '100%', 
        maxWidth: `${imageSize.width}px`,
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
      }}>
        <div style={{
          flex: 1,
          height: '30px',
          backgroundColor: '#e0e0e0',
          borderRadius: '15px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: progress === 100 ? '#4caf50' : '#2196f3',
            transition: 'width 0.3s ease, background-color 0.3s ease',
            borderRadius: '15px'
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontWeight: 'bold',
            color: progress > 50 ? 'white' : '#333',
            fontSize: '14px'
          }}>
            {progress}%
          </div>
        </div>
        
        {/* Control Buttons */}
        <button
          onClick={showHint}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          💡 Hint
        </button>
        
        <button
          onClick={resetPuzzle}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          🔄 Reset
        </button>
      </div>

      {/* Puzzle Board */}
      <div
        ref={containerRef}
        className="puzzle-board"
        style={{
          position: 'relative',
          width: `${imageSize.width}px`,
          height: `${imageSize.height}px`,
          backgroundColor: '#f5f5f5',
          border: '2px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden',
          transition: 'opacity 0.2s ease'
        }}
      >
        {pieces.map(piece => (
          <PuzzlePiece
            key={piece.id}
            piece={piece}
            image={imgRef.current}
            onUpdate={updatePiece}
            allPieces={pieces}
            snapThreshold={15}
          />
        ))}
        
        {progress === 100 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(76, 175, 80, 0.95)',
            color: 'white',
            padding: '30px 60px',
            borderRadius: '15px',
            fontSize: '32px',
            fontWeight: 'bold',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            zIndex: 2000
          }}>
            🎉 Puzzle Complete! 🎉
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{
        color: '#666',
        fontSize: '14px',
        textAlign: 'center'
      }}>
        {rows} × {cols} = {rows * cols} pieces
      </div>
    </div>
  );
}
