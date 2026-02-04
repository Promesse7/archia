import * as THREE from 'three';

/**
 * Extracts pottery profile primitives (rim, neck, shoulder, body, base)
 * Uses curvature and slope analysis on the profile curve
 * Provides constraints for geometric reconstruction
 */
export class PotteryProfileAnalyzer {
  constructor() {
    this.primitives = null;
    this.profileCurve = null;
    this.debugInfo = [];
  }

  /**
   * Analyze pottery profile and extract primitives
   * @param {THREE.Vector3[]} profilePoints - 2D profile points (radius vs height)
   * @param {Object} options - Analysis parameters
   * @returns {Object} Extracted primitives with confidence scores
   */
  analyzeProfile(profilePoints, options = {}) {
    const {
      smoothingWindow = 3,
      curvatureThreshold = 0.1,
      minSegmentLength = 5,
      vesselType = 'unknown' // 'bowl', 'jar', 'plate', 'unknown'
    } = options;

    if (profilePoints.length < minSegmentLength * 2) {
      throw new Error('Insufficient profile points for analysis');
    }

    // Preprocess profile
    this.profileCurve = this.smoothProfile(profilePoints, smoothingWindow);
    
    // Calculate geometric properties
    const curvature = this.calculateCurvature(this.profileCurve);
    const slope = this.calculateSlope(this.profileCurve);
    const radius = this.profileCurve.map(p => p.x); // radius
    const height = this.profileCurve.map(p => p.y); // height

    // Detect primitives using rule-based approach
    const primitives = this.detectPrimitives({
      curvature, slope, radius, height,
      vesselType,
      curvatureThreshold,
      minSegmentLength
    });

    this.primitives = primitives;
    return primitives;
  }

  /**
   * Smooth profile curve to reduce noise
   */
  smoothProfile(points, windowSize) {
    const smoothed = [];
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let i = 0; i < points.length; i++) {
      let sumX = 0, sumY = 0, count = 0;
      
      for (let j = Math.max(0, i - halfWindow); 
           j <= Math.min(points.length - 1, i + halfWindow); j++) {
        sumX += points[j].x;
        sumY += points[j].y;
        count++;
      }
      
      smoothed.push(new THREE.Vector2(sumX / count, sumY / count));
    }
    
    return smoothed;
  }

  /**
   * Calculate curvature at each point along the profile
   */
  calculateCurvature(points) {
    const curvature = [];
    
    for (let i = 1; i < points.length - 1; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];
      const p3 = points[i + 1];
      
      // Calculate curvature using three-point formula
      const v1 = new THREE.Vector2().subVectors(p2, p1);
      const v2 = new THREE.Vector2().subVectors(p3, p2);
      
      const cross = v1.x * v2.y - v1.y * v2.x;
      const dot = v1.x * v2.x + v1.y * v2.y;
      
      const angle = Math.atan2(cross, dot);
      const distance = v1.length() + v2.length();
      
      curvature.push(Math.abs(angle) / distance);
    }
    
    // Pad with zeros at ends
    curvature.unshift(0);
    curvature.push(0);
    
    return curvature;
  }

  /**
   * Calculate slope (derivative) at each point
   */
  calculateSlope(points) {
    const slope = [];
    
    for (let i = 1; i < points.length; i++) {
      const dy = points[i].y - points[i - 1].y;
      const dx = points[i].x - points[i - 1].x;
      slope.push(dy / (dx + 1e-6)); // Avoid division by zero
    }
    
    slope.push(slope[slope.length - 1]); // Pad last value
    
    return slope;
  }

  /**
   * Detect pottery primitives using geometric rules
   */
  detectPrimitives(data) {
    const { curvature, slope, radius, height, vesselType, curvatureThreshold, minSegmentLength } = data;
    
    const primitives = {
      rim: null,
      neck: null,
      shoulder: null,
      body: null,
      base: null,
      metadata: {
        vesselType,
        maxHeight: Math.max(...height),
        maxRadius: Math.max(...radius),
        confidence: 0
      }
    };

    // Detect rim (top edge with high curvature)
    primitives.rim = this.detectRim(curvature, radius, height, curvatureThreshold);
    
    // Detect base (bottom edge)
    primitives.base = this.detectBase(radius, height, slope);
    
    // Detect shoulder (maximum radius or significant curvature change)
    primitives.shoulder = this.detectShoulder(curvature, radius, height, slope);
    
    // Detect neck (concave region between rim and shoulder)
    primitives.neck = this.detectNeck(curvature, radius, height, slope, primitives.rim, primitives.shoulder);
    
    // Body is everything else
    primitives.body = this.detectBody(primitives, height.length);
    
    // Calculate overall confidence
    primitives.metadata.confidence = this.calculateConfidence(primitives);
    
    return primitives;
  }

  /**
   * Detect rim primitive
   */
  detectRim(curvature, radius, height, threshold) {
    // Rim is typically at the top with high curvature
    const topIndex = height.indexOf(Math.max(...height));
    const rimCurvature = curvature[topIndex];
    const rimRadius = radius[topIndex];
    
    // Check if curvature indicates a rim edge
    const isRimEdge = rimCurvature > threshold;
    
    return {
      type: 'rim',
      startIndex: Math.max(0, topIndex - 2),
      endIndex: Math.min(curvature.length - 1, topIndex + 2),
      radius: rimRadius,
      height: height[topIndex],
      orientation: this.calculateRimOrientation(curvature, topIndex),
      confidence: isRimEdge ? Math.min(1.0, rimCurvature / threshold) : 0.3
    };
  }

  /**
   * Detect base primitive
   */
  detectBase(radius, height, slope) {
    // Base is at the bottom, often with minimal radius
    const bottomIndex = height.indexOf(Math.min(...height));
    const baseRadius = radius[bottomIndex];
    const baseSlope = Math.abs(slope[bottomIndex]);
    
    // Flat base should have minimal slope
    const isFlatBase = baseSlope < 0.1;
    
    return {
      type: 'base',
      startIndex: Math.max(0, bottomIndex - 2),
      endIndex: Math.min(radius.length - 1, bottomIndex + 2),
      radius: baseRadius,
      height: height[bottomIndex],
      isFlat: isFlatBase,
      confidence: isFlatBase ? 0.9 : 0.5
    };
  }

  /**
   * Detect shoulder primitive
   */
  detectShoulder(curvature, radius, height, slope) {
    // Find maximum radius point
    const maxRadiusIndex = radius.indexOf(Math.max(...radius));
    const maxRadius = radius[maxRadiusIndex];
    const maxRadiusHeight = height[maxRadiusIndex];
    
    // Check for significant curvature change at shoulder
    const shoulderCurvature = curvature[maxRadiusIndex];
    const hasCurvatureChange = shoulderCurvature > 0.05;
    
    return {
      type: 'shoulder',
      startIndex: Math.max(0, maxRadiusIndex - 3),
      endIndex: Math.min(curvature.length - 1, maxRadiusIndex + 3),
      radius: maxRadius,
      height: maxRadiusHeight,
      isProminent: hasCurvatureChange,
      confidence: hasCurvatureChange ? 0.8 : 0.6
    };
  }

  /**
   * Detect neck primitive (if present)
   */
  detectNeck(curvature, radius, height, slope, rim, shoulder) {
    if (!rim || !shoulder) return null;
    
    // Neck is between rim and shoulder, typically concave
    const neckStart = rim.endIndex;
    const neckEnd = shoulder.startIndex;
    
    if (neckEnd <= neckStart + 2) return null; // No space for neck
    
    // Check if region is concave (negative slope)
    const neckSlopes = slope.slice(neckStart, neckEnd);
    const avgSlope = neckSlopes.reduce((a, b) => a + b, 0) / neckSlopes.length;
    const isConcave = avgSlope < -0.1;
    
    return {
      type: 'neck',
      startIndex: neckStart,
      endIndex: neckEnd,
      radius: radius[Math.floor((neckStart + neckEnd) / 2)],
      height: height[Math.floor((neckStart + neckEnd) / 2)],
      isConcave,
      confidence: isConcave ? 0.7 : 0.3
    };
  }

  /**
   * Detect body primitive (remaining area)
   */
  detectBody(primitives, totalPoints) {
    const bodySegments = [];
    const usedRanges = [];
    
    // Collect all used ranges from other primitives
    Object.values(primitives).forEach(primitive => {
      if (primitive && primitive.type !== 'body' && primitive.type !== 'metadata') {
        usedRanges.push({ start: primitive.startIndex, end: primitive.endIndex });
      }
    });
    
    // Find gaps (body segments)
    for (let i = 0; i < totalPoints - 1; i++) {
      const isUsed = usedRanges.some(range => i >= range.start && i <= range.end);
      if (!isUsed) {
        let segmentStart = i;
        while (i < totalPoints - 1 && !usedRanges.some(range => i >= range.start && i <= range.end)) {
          i++;
        }
        if (i - segmentStart > 2) {
          bodySegments.push({ start: segmentStart, end: i });
        }
      }
    }
    
    return {
      type: 'body',
      segments: bodySegments,
      confidence: bodySegments.length > 0 ? 0.8 : 0.1
    };
  }

  /**
   * Calculate rim orientation (lip angle)
   */
  calculateRimOrientation(curvature, centerIndex) {
    // Simple approximation based on local curvature
    const leftCurvature = curvature[Math.max(0, centerIndex - 1)];
    const rightCurvature = curvature[Math.min(curvature.length - 1, centerIndex + 1)];
    
    const angle = Math.atan2(rightCurvature - leftCurvature, 2);
    return {
      angle: angle,
      description: angle > 0 ? 'outward-flaring' : 'inward-tapering'
    };
  }

  /**
   * Calculate overall confidence for the primitive extraction
   */
  calculateConfidence(primitives) {
    const confidences = [];
    
    Object.values(primitives).forEach(primitive => {
      if (primitive && primitive.confidence !== undefined) {
        confidences.push(primitive.confidence);
      }
    });
    
    return confidences.length > 0 
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length 
      : 0;
  }

  /**
   * Create visualization helpers for primitives
   */
  createPrimitiveHelpers() {
    if (!this.primitives || !this.profileCurve) return null;
    
    const helpers = {
      primitiveLines: [],
      primitiveLabels: [],
      coloredSegments: []
    };
    
    // Color code each primitive
    const colors = {
      rim: 0xff0000,    // Red
      neck: 0xff8800,   // Orange  
      shoulder: 0xffff00, // Yellow
      body: 0x00ff00,   // Green
      base: 0x0088ff    // Blue
    };
    
    Object.values(this.primitives).forEach(primitive => {
      if (!primitive || primitive.type === 'metadata') return;
      
      const color = colors[primitive.type] || 0x888888;
      
      if (primitive.segments) {
        // Body has multiple segments
        primitive.segments.forEach(segment => {
          const points = this.profileCurve.slice(segment.start, segment.end + 1);
          const geometry = new THREE.BufferGeometry().setFromPoints(
            points.map(p => new THREE.Vector3(p.x, 0, p.y))
          );
          const material = new THREE.LineBasicMaterial({ color, linewidth: 3 });
          helpers.coloredSegments.push(new THREE.Line(geometry, material));
        });
      } else if (primitive.startIndex !== undefined) {
        // Single segment primitive
        const points = this.profileCurve.slice(primitive.startIndex, primitive.endIndex + 1);
        const geometry = new THREE.BufferGeometry().setFromPoints(
          points.map(p => new THREE.Vector3(p.x, 0, p.y))
        );
        const material = new THREE.LineBasicMaterial({ color, linewidth: 3 });
        helpers.coloredSegments.push(new THREE.Line(geometry, material));
      }
    });
    
    return helpers;
  }

  /**
   * Export primitives as constraints for reconstruction
   */
  exportConstraints() {
    if (!this.primitives) return null;
    
    return {
      axisymmetric: true,
      primitives: this.primitives,
      constraints: {
        rimRadius: this.primitives.rim?.radius,
        baseRadius: this.primitives.base?.radius,
        vesselHeight: this.primitives.metadata?.maxHeight,
        maxRadius: this.primitives.metadata?.maxRadius,
        hasNeck: !!this.primitives.neck,
        shoulderPosition: this.primitives.shoulder?.height
      },
      confidence: this.primitives.metadata?.confidence || 0
    };
  }
}
