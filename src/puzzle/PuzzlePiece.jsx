import { useRef, useEffect, useState } from "react";

export default function PuzzlePiece({ piece, image, onUpdate, snapThreshold = 20 }) {
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Draw the piece on the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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

    // Add a subtle border if not placed
    if (!piece.placed) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, piece.width, piece.height);
    }
  }, [image, piece]);

  const handleMouseDown = (e) => {
    if (piece.placed) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || piece.placed) return;

    const parent = canvasRef.current.parentElement;
    const parentRect = parent.getBoundingClientRect();

    const newX = e.clientX - parentRect.left - dragOffset.x;
    const newY = e.clientY - parentRect.top - dragOffset.y;

    onUpdate(piece.id, newX, newY, false);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Check if close to correct position
    const dx = Math.abs(piece.currentX - piece.correctX);
    const dy = Math.abs(piece.currentY - piece.correctY);

    if (dx < snapThreshold && dy < snapThreshold) {
      // Snap to correct position
      onUpdate(piece.id, piece.correctX, piece.correctY, true);
    }
  };

  const handleTouchStart = (e) => {
    if (piece.placed) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || piece.placed) return;
    e.preventDefault();

    const touch = e.touches[0];
    const parent = canvasRef.current.parentElement;
    const parentRect = parent.getBoundingClientRect();

    const newX = touch.clientX - parentRect.left - dragOffset.x;
    const newY = touch.clientY - parentRect.top - dragOffset.y;

    onUpdate(piece.id, newX, newY, false);
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  return (
    <canvas
      ref={canvasRef}
      width={piece.width}
      height={piece.height}
      style={{
        position: "absolute",
        left: `${piece.currentX}px`,
        top: `${piece.currentY}px`,
        cursor: piece.placed ? "default" : isDragging ? "grabbing" : "grab",
        opacity: piece.placed ? 1 : 0.9,
        transition: piece.placed ? "opacity 0.3s" : "none",
        zIndex: isDragging ? 1000 : piece.placed ? 1 : 10,
        touchAction: "none"
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
