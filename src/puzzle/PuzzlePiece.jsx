import { useRef, useEffect, useState } from "react";
import { canSnapTogether, calculateSnapPosition, mergePieces } from "./puzzleUtils";
import JigsawGenerator from "./jigsawGenerator";

export default function PuzzlePiece({ piece, image, onUpdate, snapThreshold = 15, allPieces }) {
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isSnapping, setIsSnapping] = useState(false);

  // Draw the jigsaw-shaped piece on the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image || !piece.shape) return;

    const ctx = canvas.getContext("2d");
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save the current context state
    ctx.save();
    
    // Create clipping path for jigsaw shape
    const generator = new JigsawGenerator();
    generator.createCanvasPath(ctx, piece.shape);
    ctx.clip();

    // Draw the piece from the source image
    ctx.drawImage(
      image,
      piece.xIndex * piece.width,
      piece.yIndex * piece.height,
      piece.width,
      piece.height,
      0,
      0,
      piece.width,
      piece.height
    );

    // Restore the context state (removes clipping)
    ctx.restore();
    
    // Draw the border on top
    generator.createCanvasPath(ctx, piece.shape);
    
    if (!piece.placed) {
      ctx.strokeStyle = isSnapping ? "#4ade80" : "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = isSnapping ? 3 : 2;
    } else {
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2;
    }
    
    ctx.stroke();
  }, [image, piece, isSnapping]);

  const handleMouseDown = (e) => {
    if (piece.placed) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left - piece.currentX,
      y: e.clientY - rect.top - piece.currentY
    });
    setIsDragging(true);
    setIsSnapping(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || piece.placed) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;

    // Check for magnetic snapping with nearby pieces
    let snappedPosition = { x: newX, y: newY };
    let shouldSnap = false;

    allPieces.forEach(otherPiece => {
      if (otherPiece.id === piece.id || otherPiece.placed) return;

      // Temporarily update position to check snap
      const originalX = piece.currentX;
      const originalY = piece.currentY;
      piece.currentX = newX;
      piece.currentY = newY;

      if (canSnapTogether(piece, otherPiece, snapThreshold)) {
        const snapPos = calculateSnapPosition(piece, otherPiece);
        snappedPosition = snapPos;
        shouldSnap = true;
        
        // Visual feedback for snapping
        setIsSnapping(true);
      }

      // Restore original position
      piece.currentX = originalX;
      piece.currentY = originalY;
    });

    if (!shouldSnap) {
      setIsSnapping(false);
    }

    // Update piece position
    const updatedPiece = {
      ...piece,
      currentX: snappedPosition.x,
      currentY: snappedPosition.y
    };

    onUpdate(updatedPiece);
  };

  const handleMouseUp = () => {
    if (!isDragging || piece.placed) return;

    setIsDragging(false);

    // Check for final snap and merge pieces
    let snappedWithPiece = null;

    allPieces.forEach(otherPiece => {
      if (otherPiece.id === piece.id || otherPiece.placed) return;

      if (canSnapTogether(piece, otherPiece, snapThreshold)) {
        const snapPos = calculateSnapPosition(piece, otherPiece);
        
        // Snap to position
        piece.currentX = snapPos.x;
        piece.currentY = snapPos.y;
        
        snappedWithPiece = otherPiece;
      }
    });

    if (snappedWithPiece) {
      // Merge pieces into a group
      mergePieces(piece, snappedWithPiece, allPieces);
      
      // Check if piece is now in correct position
      const isCorrectPosition = 
        Math.abs(piece.currentX - piece.correctX) < 5 &&
        Math.abs(piece.currentY - piece.correctY) < 5;

      if (isCorrectPosition) {
        piece.currentX = piece.correctX;
        piece.currentY = piece.correctY;
        piece.placed = true;
      }

      onUpdate(piece);
    } else {
      // Check if piece is close to correct position for auto-placement
      const isCorrectPosition = 
        Math.abs(piece.currentX - piece.correctX) < 20 &&
        Math.abs(piece.currentY - piece.correctY) < 20;

      if (isCorrectPosition) {
        piece.currentX = piece.correctX;
        piece.currentY = piece.correctY;
        piece.placed = true;
        onUpdate(piece);
      }
    }

    setIsSnapping(false);
  };

  // Handle touch events for mobile
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    handleMouseDown(mouseEvent);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    handleMouseMove(mouseEvent);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    handleMouseUp();
  };

  return (
    <canvas
      ref={canvasRef}
      width={piece.width}
      height={piece.height}
      style={{
        position: "absolute",
        left: piece.currentX,
        top: piece.currentY,
        cursor: piece.placed ? "default" : isDragging ? "grabbing" : "grab",
        zIndex: isDragging ? 1000 : piece.groupId || 1,
        transition: isSnapping ? "none" : "transform 0.1s",
        transform: isSnapping ? "scale(1.05)" : "scale(1)"
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}
