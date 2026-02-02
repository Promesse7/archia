import JigsawGenerator from './jigsawGenerator';

/**
 * Slice an image into jigsaw puzzle pieces with tabs and blanks
 * @param {HTMLImageElement} img - The loaded image
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @returns {Array} Array of puzzle piece objects
 */
export function sliceImage(img, rows, cols) {
  const generator = new JigsawGenerator();
  const pieces = [];
  const pieceWidth = img.width / cols;
  const pieceHeight = img.height / rows;

  let id = 0;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Generate jigsaw shape for this piece
      const shape = generator.generatePieceShape(y, x, rows, cols, pieceWidth, pieceHeight);
      
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
        placed: false,
        shape: shape,
        groupId: null, // For grouping snapped pieces
        rotation: 0
      });
    }
  }

  return pieces;
}

/**
 * Check if two pieces are neighbors (updated for jigsaw pieces)
 * @param {Object} piece1 
 * @param {Object} piece2 
 * @returns {boolean}
 */
export function areNeighbors(piece1, piece2) {
  if (!piece1.shape || !piece2.shape) return false;
  
  const generator = new JigsawGenerator();
  return generator.areNeighbors(piece1.shape, piece2.shape);
}

/**
 * Check if two pieces can snap together (magnetic snapping)
 * @param {Object} piece1 
 * @param {Object} piece2 
 * @param {number} threshold - Snap distance threshold
 * @returns {boolean}
 */
export function canSnapTogether(piece1, piece2, threshold = 15) {
  if (!piece1.shape || !piece2.shape) return false;
  if (piece1.groupId === piece2.groupId && piece1.groupId !== null) return false;
  
  const generator = new JigsawGenerator();
  return generator.canSnapTogether(piece1, piece2, threshold);
}

/**
 * Calculate snap position for two pieces
 * @param {Object} piece1 - Moving piece
 * @param {Object} piece2 - Target piece
 * @returns {Object} Target position {x, y}
 */
export function calculateSnapPosition(piece1, piece2) {
  if (!piece1.shape || !piece2.shape) return piece1;
  
  const generator = new JigsawGenerator();
  return generator.calculateSnapPosition(piece1, piece2);
}

/**
 * Merge two pieces into a group
 * @param {Object} piece1 
 * @param {Object} piece2 
 * @param {Array} allPieces - All pieces array
 * @returns {number} New group ID
 */
export function mergePieces(piece1, piece2, allPieces) {
  const groupId = Date.now(); // Unique group ID
  
  // Update both pieces to same group
  piece1.groupId = groupId;
  piece2.groupId = groupId;
  
  // If either piece was already in a group, merge all pieces from that group
  const existingGroup1 = piece1.groupId;
  const existingGroup2 = piece2.groupId;
  
  allPieces.forEach(piece => {
    if (piece.groupId === existingGroup1 || piece.groupId === existingGroup2) {
      piece.groupId = groupId;
    }
  });
  
  return groupId;
}

/**
 * Get all pieces in a group
 * @param {number} groupId 
 * @param {Array} allPieces 
 * @returns {Array} Pieces in the group
 */
export function getGroupPieces(groupId, allPieces) {
  return allPieces.filter(piece => piece.groupId === groupId);
}

/**
 * Check if a puzzle is complete
 * @param {Array} pieces 
 * @returns {boolean}
 */
export function isPuzzleComplete(pieces) {
  return pieces.every(piece => piece.placed);
}

/**
 * Calculate puzzle completion percentage
 * @param {Array} pieces 
 * @returns {number} Percentage (0-100)
 */
export function getCompletionPercentage(pieces) {
  const placedPieces = pieces.filter(piece => piece.placed).length;
  return (placedPieces / pieces.length) * 100;
}

/**
 * Calculate distance between two points
 * @param {number} x1 
 * @param {number} y1 
 * @param {number} x2 
 * @param {number} y2 
 * @returns {number}
 */
export function calculateDistance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}
