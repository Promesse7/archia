/**
 * Exports pottery profile as archaeological drawings
 * Generates clean 2D SVG and PNG outputs with professional standards
 */

export class PotteryProfileExporter {
  constructor() {
    this.scale = 100; // pixels per unit
    this.strokeWidth = 0.02;
    this.dimensions = { width: 800, height: 600 };
  }

  /**
   * Export profile as SVG with archaeological drawing standards
   * @param {Array} profilePoints - Array of {x: radius, y: height} points
   * @param {Object} primitives - Detected primitives for annotation
   * @param {Object} options - Export options
   * @returns {String} SVG string
   */
  exportSVG(profilePoints, primitives = null, options = {}) {
    const {
      includeAnnotations = true,
      includeScale = true,
      includeGrid = false,
      title = "Pottery Profile",
      vesselId = "unknown"
    } = options;

    // Calculate bounds and center
    const bounds = this.calculateBounds(profilePoints);
    const center = {
      x: this.dimensions.width / 2,
      y: this.dimensions.height - 50 // Leave margin at bottom
    };

    // Start SVG
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${this.dimensions.width}" height="${this.dimensions.height}" 
     xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.dimensions.width} ${this.dimensions.height}">
  <defs>
    <style>
      .profile-line { stroke: #000; stroke-width: 2; fill: none; }
      .axis-line { stroke: #666; stroke-width: 1; stroke-dasharray: 5,5; }
      .annotation { font-family: Arial, sans-serif; font-size: 12px; fill: #333; }
      .primitive-label { font-family: Arial, sans-serif; font-size: 10px; fill: #666; font-style: italic; }
      .scale-bar { stroke: #000; stroke-width: 2; }
      .grid-line { stroke: #e0e0e0; stroke-width: 0.5; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="white"/>
`;

    // Add grid if requested
    if (includeGrid) {
      svg += this.generateGrid(center, bounds);
    }

    // Draw axis
    svg += this.generateAxis(center, bounds);

    // Draw profile (both sides for complete vessel)
    svg += this.generateProfileLine(profilePoints, center, bounds);

    // Add primitive annotations
    if (includeAnnotations && primitives) {
      svg += this.generatePrimitiveAnnotations(primitives, center, bounds);
    }

    // Add scale bar
    if (includeScale) {
      svg += this.generateScaleBar(center, bounds);
    }

    // Add title and metadata
    svg += this.generateMetadata(title, vesselId, bounds);

    svg += '</svg>';
    return svg;
  }

  /**
   * Export profile as PNG raster image
   * @param {Array} profilePoints - Profile points
   * @param {Object} primitives - Detected primitives
   * @param {Object} options - Export options
   * @returns {Promise<Blob>} PNG blob
   */
  async exportPNG(profilePoints, primitives = null, options = {}) {
    const svgString = this.exportSVG(profilePoints, primitives, options);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = this.dimensions.width;
      canvas.height = this.dimensions.height;
      
      img.onload = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate PNG'));
          }
        }, 'image/png');
      };
      
      img.onerror = () => reject(new Error('Failed to load SVG'));
      
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      img.src = url;
    });
  }

  /**
   * Calculate bounding box of profile
   */
  calculateBounds(profilePoints) {
    const xValues = profilePoints.map(p => p.x);
    const yValues = profilePoints.map(p => p.y);
    
    return {
      minX: Math.min(...xValues),
      maxX: Math.max(...xValues),
      minY: Math.min(...yValues),
      maxY: Math.max(...yValues),
      width: Math.max(...xValues) - Math.min(...xValues),
      height: Math.max(...yValues) - Math.min(...yValues)
    };
  }

  /**
   * Generate grid lines
   */
  generateGrid(center, bounds) {
    let grid = '<g class="grid">';
    
    const gridSize = 20; // pixels
    const numVertical = Math.ceil(this.dimensions.width / gridSize);
    const numHorizontal = Math.ceil(this.dimensions.height / gridSize);
    
    for (let i = 0; i <= numVertical; i++) {
      const x = i * gridSize;
      grid += `<line x1="${x}" y1="0" x2="${x}" y2="${this.dimensions.height}" class="grid-line"/>`;
    }
    
    for (let i = 0; i <= numHorizontal; i++) {
      const y = i * gridSize;
      grid += `<line x1="0" y1="${y}" x2="${this.dimensions.width}" y2="${y}" class="grid-line"/>`;
    }
    
    grid += '</g>';
    return grid;
  }

  /**
   * Generate central axis line
   */
  generateAxis(center, bounds) {
    const axisHeight = bounds.height * this.scale + 100;
    return `<line x1="${center.x}" y1="${center.y - axisHeight/2}" 
                  x2="${center.x}" y2="${center.y + axisHeight/2}" class="axis-line"/>`;
  }

  /**
   * Generate profile line (mirrored for complete vessel)
   */
  generateProfileLine(profilePoints, center, bounds) {
    // Transform points to SVG coordinates
    const transformPoint = (point, side = 1) => {
      const x = center.x + (point.x * this.scale * side);
      const y = center.y - (point.y * this.scale);
      return `${x},${y}`;
    };
    
    // Generate path data for both sides
    const rightSide = profilePoints.map(p => transformPoint(p, 1)).join(' ');
    const leftSide = profilePoints.slice().reverse().map(p => transformPoint(p, -1)).join(' ');
    
    const pathData = `M ${rightSide} L ${leftSide} Z`;
    
    return `<path d="${pathData}" class="profile-line"/>`;
  }

  /**
   * Generate primitive annotations
   */
  generatePrimitiveAnnotations(primitives, center, bounds) {
    let annotations = '<g class="annotations">';
    
    const colors = {
      rim: '#ff0000',
      neck: '#ff8800',
      shoulder: '#ffff00',
      body: '#00ff00',
      base: '#0088ff'
    };
    
    Object.values(primitives).forEach(primitive => {
      if (!primitive || primitive.type === 'metadata') return;
      
      const color = colors[primitive.type] || '#666';
      
      // Calculate annotation position
      const midIndex = Math.floor((primitive.startIndex + primitive.endIndex) / 2);
      const profilePoint = this.getProfilePointAtIndex(midIndex);
      
      if (profilePoint) {
        const x = center.x + (profilePoint.x * this.scale * 1.2);
        const y = center.y - (profilePoint.y * this.scale);
        
        annotations += `<circle cx="${x}" cy="${y}" r="3" fill="${color}"/>`;
        annotations += `<text x="${x + 10}" y="${y}" class="primitive-label">${primitive.type}</text>`;
      }
    });
    
    annotations += '</g>';
    return annotations;
  }

  /**
   * Generate scale bar
   */
  generateScaleBar(center, bounds) {
    const barLength = 100; // pixels (representing 1 unit)
    const barY = center.y + bounds.height * this.scale / 2 + 30;
    const barX = center.x - barLength / 2;
    
    return `<g class="scale">
      <line x1="${barX}" y1="${barY}" x2="${barX + barLength}" y2="${barY}" class="scale-bar"/>
      <text x="${center.x}" y="${barY + 15}" text-anchor="middle" class="annotation">1 cm</text>
    </g>`;
  }

  /**
   * Generate title and metadata
   */
  generateMetadata(title, vesselId, bounds) {
    return `<g class="metadata">
      <text x="20" y="30" class="annotation" font-weight="bold">${title}</text>
      <text x="20" y="50" class="annotation">ID: ${vesselId}</text>
      <text x="20" y="70" class="annotation">Max H: ${bounds.height.toFixed(1)} cm</text>
      <text x="20" y="85" class="annotation">Max R: ${bounds.maxX.toFixed(1)} cm</text>
    </g>`;
  }

  /**
   * Helper to get profile point at index (placeholder)
   */
  getProfilePointAtIndex(index) {
    // This would need access to the actual profile points
    // For now, return a dummy point
    return { x: 0.1, y: index * 0.1 };
  }

  /**
   * Download file helper
   */
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export and download SVG
   */
  downloadSVG(profilePoints, primitives, options = {}) {
    const svg = this.exportSVG(profilePoints, primitives, options);
    const filename = `${options.vesselId || 'pottery'}_profile.svg`;
    this.downloadFile(svg, filename, 'image/svg+xml');
  }

  /**
   * Export and download PNG
   */
  async downloadPNG(profilePoints, primitives, options = {}) {
    try {
      const blob = await this.exportPNG(profilePoints, primitives, options);
      const filename = `${options.vesselId || 'pottery'}_profile.png`;
      this.downloadFile(blob, filename, 'image/png');
    } catch (error) {
      console.error('Failed to export PNG:', error);
      throw error;
    }
  }

  /**
   * Export profile data as JSON for further analysis
   */
  exportJSON(profilePoints, primitives, metadata = {}) {
    const exportData = {
      profile: profilePoints,
      primitives,
      metadata: {
        ...metadata,
        exportDate: new Date().toISOString(),
        scale: this.scale,
        dimensions: this.dimensions
      }
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const filename = `${metadata.vesselId || 'pottery'}_data.json`;
    this.downloadFile(jsonString, filename, 'application/json');
  }

  /**
   * Generate measurement report
   */
  generateMeasurementReport(profilePoints, primitives) {
    const bounds = this.calculateBounds(profilePoints);
    
    const report = {
      basicMeasurements: {
        totalHeight: bounds.height,
        maximumRadius: bounds.maxX,
        minimumRadius: bounds.minX,
        wallThickness: this.estimateWallThickness(profilePoints)
      },
      primitiveAnalysis: primitives ? {
        hasRim: !!primitives.rim,
        hasNeck: !!primitives.neck,
        hasShoulder: !!primitives.shoulder,
        rimRadius: primitives.rim?.radius,
        baseRadius: primitives.base?.radius,
        shoulderHeight: primitives.shoulder?.height
      } : null,
      vesselClassification: this.classifyVesselType(bounds, primitives)
    };
    
    return report;
  }

  /**
   * Estimate wall thickness from profile
   */
  estimateWallThickness(profilePoints) {
    // Simple estimation - would need actual thickness data
    return 0.5; // cm
  }

  /**
   * Classify vessel type based on proportions
   */
  classifyVesselType(bounds, primitives) {
    const aspectRatio = bounds.height / bounds.maxX;
    
    if (aspectRatio < 0.5) return 'plate/bowl';
    if (aspectRatio < 1.0) return 'bowl';
    if (aspectRatio < 2.0) return 'jar';
    return 'tall vessel';
  }
}
