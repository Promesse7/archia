/**
 * Slice an image into jigsaw puzzle pieces
 * @param {HTMLImageElement} img - The loaded image
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @returns {Array} Array of puzzle piece objects
 */
export function sliceImage(img, rows, cols) {
  const pieces = [];
  const pieceWidth = img.width / cols;
  const pieceHeight = img.height / rows;

  let id = 0;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      pieces.push({
        id: id++,
        xIndex: x,
        yIndex: y,
        width: pieceWidth,
        height: pieceHeight,
        correctX: x * pieceWidth,
        correctY: y * pieceHeight,
        currentX: Math.random() * (img.width - pieceWidth),
        currentY: Math.random() * (img.height - pieceHeight),
        placed: false
      });
    }
  }

  return pieces;
}

/**
 * Check if two pieces are neighbors
 * @param {Object} piece1 
 * @param {Object} piece2 
 * @returns {boolean}
 */
export function areNeighbors(piece1, piece2) {
  const xDiff = Math.abs(piece1.xIndex - piece2.xIndex);
  const yDiff = Math.abs(piece1.yIndex - piece2.yIndex);
  
  return (xDiff === 1 && yDiff === 0) || (xDiff === 0 && yDiff === 1);
}

/**
 * Calculate distance between two points
 * @param {number} x1 
 * @param {number} y1 
 * @param {number} x2 
 * @param {number} y2 
 * @returns {number}
 */
export function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Shuffle array in place
 * @param {Array} array 
 * @returns {Array}
 */
export function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
