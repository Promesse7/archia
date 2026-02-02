/**
 * Generate jigsaw-shaped puzzle pieces with tabs and blanks
 * Creates realistic puzzle piece shapes with magnetic snapping capabilities
 */

export class JigsawGenerator {
  constructor() {
    this.tabSize = 15; // Reduced size of tabs/blanks
    this.curveVariation = 0.3; // How much curves vary
  }

  /**
   * Generate jigsaw piece shape with tabs and blanks
   * @param {number} row - Row index
   * @param {number} col - Column index  
   * @param {number} totalRows - Total rows
   * @param {number} totalCols - Total columns
   * @param {number} pieceWidth - Width of piece
   * @param {number} pieceHeight - Height of piece
   * @returns {Object} Piece shape data
   */
  generatePieceShape(row, col, totalRows, totalCols, pieceWidth, pieceHeight) {
    const shape = {
      id: `${row}-${col}`,
      row,
      col,
      width: pieceWidth,
      height: pieceHeight,
      paths: [],
      tabs: {},
      neighbors: this.getNeighbors(row, col, totalRows, totalCols)
    };

    // Generate edges with tabs/blanks
    // Top edge
    if (shape.neighbors.top) {
      const tabType = this.getRandomTabType();
      shape.tabs.top = tabType;
      shape.paths.push(this.generateEdgePath('top', tabType, pieceWidth, pieceHeight));
    } else {
      shape.paths.push(this.generateStraightEdge('top', pieceWidth, pieceHeight));
    }

    // Right edge
    if (shape.neighbors.right) {
      const tabType = this.getRandomTabType();
      shape.tabs.right = tabType;
      shape.paths.push(this.generateEdgePath('right', tabType, pieceWidth, pieceHeight));
    } else {
      shape.paths.push(this.generateStraightEdge('right', pieceWidth, pieceHeight));
    }

    // Bottom edge
    if (shape.neighbors.bottom) {
      const tabType = this.getOppositeTabType(shape.tabs.top);
      shape.tabs.bottom = tabType;
      shape.paths.push(this.generateEdgePath('bottom', tabType, pieceWidth, pieceHeight));
    } else {
      shape.paths.push(this.generateStraightEdge('bottom', pieceWidth, pieceHeight));
    }

    // Left edge
    if (shape.neighbors.left) {
      const tabType = this.getOppositeTabType(shape.tabs.right);
      shape.tabs.left = tabType;
      shape.paths.push(this.generateEdgePath('left', tabType, pieceWidth, pieceHeight));
    } else {
      shape.paths.push(this.generateStraightEdge('left', pieceWidth, pieceHeight));
    }

    return shape;
  }

  /**
   * Get neighboring piece positions
   */
  getNeighbors(row, col, totalRows, totalCols) {
    return {
      top: row > 0 ? { row: row - 1, col } : null,
      right: col < totalCols - 1 ? { row, col: col + 1 } : null,
      bottom: row < totalRows - 1 ? { row: row + 1, col } : null,
      left: col > 0 ? { row, col: col - 1 } : null
    };
  }

  /**
   * Get random tab type (tab or blank)
   */
  getRandomTabType() {
    return Math.random() > 0.5 ? 'tab' : 'blank';
  }

  /**
   * Get opposite tab type for matching edges
   */
  getOppositeTabType(tabType) {
    return tabType === 'tab' ? 'blank' : 'tab';
  }

  /**
   * Generate straight edge (for border pieces)
   */
  generateStraightEdge(side, width, height) {
    const path = [];
    
    switch (side) {
      case 'top':
        path.push({ x: 0, y: 0 });
        path.push({ x: width, y: 0 });
        break;
      case 'right':
        path.push({ x: width, y: 0 });
        path.push({ x: width, y: height });
        break;
      case 'bottom':
        path.push({ x: width, y: height });
        path.push({ x: 0, y: height });
        break;
      case 'left':
        path.push({ x: 0, y: height });
        path.push({ x: 0, y: 0 });
        break;
    }
    
    return { side, type: 'straight', path };
  }

  /**
   * Generate tab/blank edge path
   */
  generateEdgePath(side, tabType, width, height) {
    const path = [];
    const tabSize = this.tabSize;
    const tabOffset = width * 0.4 + Math.random() * width * 0.2; // More centered position
    
    switch (side) {
      case 'top':
        path.push({ x: 0, y: 0 });
        path.push({ x: tabOffset, y: 0 });
        
        if (tabType === 'tab') {
          // Tab pointing up - create smooth curve
          path.push({ x: tabOffset + tabSize * 0.2, y: -tabSize * 0.3 });
          path.push({ x: tabOffset + tabSize * 0.5, y: -tabSize * 0.6 });
          path.push({ x: tabOffset + tabSize * 0.8, y: -tabSize * 0.3 });
          path.push({ x: tabOffset + tabSize, y: 0 });
        } else {
          // Blank (indent) - create smooth curve inward
          path.push({ x: tabOffset + tabSize * 0.2, y: tabSize * 0.3 });
          path.push({ x: tabOffset + tabSize * 0.5, y: tabSize * 0.6 });
          path.push({ x: tabOffset + tabSize * 0.8, y: tabSize * 0.3 });
          path.push({ x: tabOffset + tabSize, y: 0 });
        }
        
        path.push({ x: width, y: 0 });
        break;
        
      case 'right':
        path.push({ x: width, y: 0 });
        path.push({ x: width, y: tabOffset });
        
        if (tabType === 'tab') {
          // Tab pointing right
          path.push({ x: width + tabSize * 0.3, y: tabOffset + tabSize * 0.2 });
          path.push({ x: width + tabSize * 0.6, y: tabOffset + tabSize * 0.5 });
          path.push({ x: width + tabSize * 0.3, y: tabOffset + tabSize * 0.8 });
          path.push({ x: width, y: tabOffset + tabSize });
        } else {
          // Blank (indent)
          path.push({ x: width - tabSize * 0.3, y: tabOffset + tabSize * 0.2 });
          path.push({ x: width - tabSize * 0.6, y: tabOffset + tabSize * 0.5 });
          path.push({ x: width - tabSize * 0.3, y: tabOffset + tabSize * 0.8 });
          path.push({ x: width, y: tabOffset + tabSize });
        }
        
        path.push({ x: width, y: height });
        break;
        
      case 'bottom':
        path.push({ x: width, y: height });
        path.push({ x: width - tabOffset, y: height });
        
        if (tabType === 'tab') {
          // Tab pointing down
          path.push({ x: width - tabOffset - tabSize * 0.2, y: height + tabSize * 0.3 });
          path.push({ x: width - tabOffset - tabSize * 0.5, y: height + tabSize * 0.6 });
          path.push({ x: width - tabOffset - tabSize * 0.8, y: height + tabSize * 0.3 });
          path.push({ x: width - tabOffset - tabSize, y: height });
        } else {
          // Blank (indent)
          path.push({ x: width - tabOffset - tabSize * 0.2, y: height - tabSize * 0.3 });
          path.push({ x: width - tabOffset - tabSize * 0.5, y: height - tabSize * 0.6 });
          path.push({ x: width - tabOffset - tabSize * 0.8, y: height - tabSize * 0.3 });
          path.push({ x: width - tabOffset - tabSize, y: height });
        }
        
        path.push({ x: 0, y: height });
        break;
        
      case 'left':
        path.push({ x: 0, y: height });
        path.push({ x: 0, y: height - tabOffset });
        
        if (tabType === 'tab') {
          // Tab pointing left
          path.push({ x: -tabSize * 0.3, y: height - tabOffset - tabSize * 0.2 });
          path.push({ x: -tabSize * 0.6, y: height - tabOffset - tabSize * 0.5 });
          path.push({ x: -tabSize * 0.3, y: height - tabOffset - tabSize * 0.8 });
          path.push({ x: 0, y: height - tabOffset - tabSize });
        } else {
          // Blank (indent)
          path.push({ x: tabSize * 0.3, y: height - tabOffset - tabSize * 0.2 });
          path.push({ x: tabSize * 0.6, y: height - tabOffset - tabSize * 0.5 });
          path.push({ x: tabSize * 0.3, y: height - tabOffset - tabSize * 0.8 });
          path.push({ x: 0, y: height - tabOffset - tabSize });
        }
        
        path.push({ x: 0, y: 0 });
        break;
    }
    
    return { side, type: tabType, path };
  }

  /**
   * Create canvas path from piece shape
   */
  createCanvasPath(ctx, shape) {
    ctx.beginPath();
    
    let firstPoint = true;
    
    // Combine all edge paths into one continuous path
    shape.paths.forEach((edge) => {
      edge.path.forEach((point, i) => {
        if (firstPoint) {
          ctx.moveTo(point.x, point.y);
          firstPoint = false;
        } else {
          // Use smooth curves for tabs
          if (edge.type !== 'straight' && i > 0 && i < edge.path.length - 1) {
            const prevPoint = edge.path[i - 1];
            const nextPoint = edge.path[i + 1];
            
            // Create smooth curve through control points
            const cp1x = prevPoint.x + (point.x - prevPoint.x) * 0.5;
            const cp1y = prevPoint.y + (point.y - prevPoint.y) * 0.5;
            const cp2x = point.x + (nextPoint.x - point.x) * 0.5;
            const cp2y = point.y + (nextPoint.y - point.y) * 0.5;
            
            ctx.bezierCurveTo(cp1x, cp1y, point.x, point.y, cp2x, cp2y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        }
      });
    });
    
    ctx.closePath();
  }

  /**
   * Check if two pieces can snap together
   */
  canSnapTogether(piece1, piece2, threshold = 15) {
    // Check if they are neighbors
    const isNeighbor = this.areNeighbors(piece1.shape, piece2.shape);
    if (!isNeighbor) return false;

    // Check distance
    const distance = this.calculateDistance(piece1, piece2);
    if (distance > threshold) return false;

    // Check if edges are compatible (tab matches blank)
    return this.areEdgesCompatible(piece1.shape, piece2.shape);
  }

  /**
   * Check if two pieces are neighbors
   */
  areNeighbors(shape1, shape2) {
    const rowDiff = Math.abs(shape1.row - shape2.row);
    const colDiff = Math.abs(shape1.col - shape2.col);
    
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }

  /**
   * Calculate distance between pieces
   */
  calculateDistance(piece1, piece2) {
    const dx = piece1.currentX - piece2.currentX;
    const dy = piece1.currentY - piece2.currentY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check if edges are compatible for snapping
   */
  areEdgesCompatible(shape1, shape2) {
    // Top of piece1 should match bottom of piece2 if piece2 is above
    if (shape1.row === shape2.row + 1) {
      return shape1.tabs.top !== shape2.tabs.bottom;
    }
    
    // Bottom of piece1 should match top of piece2 if piece2 is below
    if (shape1.row === shape2.row - 1) {
      return shape1.tabs.bottom !== shape2.tabs.top;
    }
    
    // Left of piece1 should match right of piece2 if piece2 is to the left
    if (shape1.col === shape2.col + 1) {
      return shape1.tabs.left !== shape2.tabs.right;
    }
    
    // Right of piece1 should match left of piece2 if piece2 is to the right
    if (shape1.col === shape2.col - 1) {
      return shape1.tabs.right !== shape2.tabs.left;
    }
    
    return false;
  }

  /**
   * Calculate snap position for two pieces
   */
  calculateSnapPosition(piece1, piece2) {
    const shape1 = piece1.shape;
    const shape2 = piece2.shape;
    
    let targetX = piece2.currentX;
    let targetY = piece2.currentY;
    
    // Calculate based on relative positions
    if (shape1.row === shape2.row + 1) {
      // piece1 is below piece2
      targetY = piece2.currentY + shape2.height;
      targetX = piece2.currentX;
    } else if (shape1.row === shape2.row - 1) {
      // piece1 is above piece2
      targetY = piece2.currentY - shape1.height;
      targetX = piece2.currentX;
    } else if (shape1.col === shape2.col + 1) {
      // piece1 is to the right of piece2
      targetX = piece2.currentX + shape2.width;
      targetY = piece2.currentY;
    } else if (shape1.col === shape2.col - 1) {
      // piece1 is to the left of piece2
      targetX = piece2.currentX - shape1.width;
      targetY = piece2.currentY;
    }
    
    return { x: targetX, y: targetY };
  }
}

export default JigsawGenerator;
