import * as THREE from 'three';

/**
 * Thickness Profile Analysis for ceramic fragments
 * Extracts thickness along profile normals and compares fragments
 * Provides quantitative similarity metrics for fragment matching
 */
export class PotteryThicknessAnalyzer {
  constructor() {
    this.profiles = new Map(); // Cache thickness profiles
    this.debugInfo = [];
  }

  /**
   * Extract thickness profile from mesh geometry
   * @param {THREE.Mesh} mesh - Pottery mesh
   * @param {Object} axis - Detected symmetry axis
   * @param {Object} options - Analysis options
   * @returns {Object} Thickness profile with metadata
   */
  extractThicknessProfile(mesh, axis, options = {}) {
    const {
      numSamples = 100,
      smoothingWindow = 3,
      minThickness = 0.1,
      maxThickness = 5.0
    } = options;

    if (!mesh || !axis) {
      throw new Error('Mesh and axis are required for thickness analysis');
    }

    // Extract profile points along the axis
    const profilePoints = this.extractProfilePoints(mesh, axis, numSamples);
    
    // Calculate thickness at each profile point
    const thicknessProfile = this.calculateThicknessAtPoints(mesh, profilePoints, axis);
    
    // Smooth the thickness profile
    const smoothedProfile = this.smoothProfile(thicknessProfile, smoothingWindow);
    
    // Validate thickness values
    const validatedProfile = this.validateThickness(smoothedProfile, minThickness, maxThickness);
    
    const result = {
      thickness: validatedProfile.thickness,
      positions: validatedProfile.positions,
      metadata: {
        numPoints: validatedProfile.thickness.length,
        meanThickness: this.calculateMean(validatedProfile.thickness),
        maxThickness: Math.max(...validatedProfile.thickness),
        minThickness: Math.min(...validatedProfile.thickness),
        standardDeviation: this.calculateStdDev(validatedProfile.thickness),
        axisDirection: axis.axis,
        axisCenter: axis.center
      },
      quality: this.assessProfileQuality(validatedProfile)
    };

    // Cache the result
    const meshId = this.getMeshId(mesh);
    this.profiles.set(meshId, result);

    return result;
  }

  /**
   * Extract profile points along the symmetry axis
   */
  extractProfilePoints(mesh, axis, numSamples) {
    const geometry = mesh.geometry;
    const positions = geometry.attributes.position;
    const bbox = new THREE.Box3().setFromObject(mesh);
    
    const profilePoints = [];
    const axisStart = axis.center.clone().add(axis.axis.clone().multiplyScalar(bbox.min.y));
    const axisEnd = axis.center.clone().add(axis.axis.clone().multiplyScalar(bbox.max.y));
    
    for (let i = 0; i < numSamples; i++) {
      const t = i / (numSamples - 1);
      const point = axisStart.clone().lerp(axisEnd, t);
      profilePoints.push(point);
    }
    
    return profilePoints;
  }

  /**
   * Calculate thickness at profile points using ray casting
   */
  calculateThicknessAtPoints(mesh, profilePoints, axis) {
    const thickness = [];
    const positions = [];
    
    profilePoints.forEach((point, index) => {
      // Cast rays in opposite directions perpendicular to axis
      const perpendicular = this.getPerpendicularDirection(axis.axis);
      const raycaster1 = new THREE.Raycaster(point, perpendicular);
      const raycaster2 = new THREE.Raycaster(point, perpendicular.clone().multiplyScalar(-1));
      
      const intersects1 = raycaster1.intersectObject(mesh);
      const intersects2 = raycaster2.intersectObject(mesh);
      
      if (intersects1.length > 0 && intersects2.length > 0) {
        const distance = intersects1[0].distance + intersects2[0].distance;
        thickness.push(distance);
        positions.push(point.clone());
      } else {
        // Fallback: estimate thickness from nearby vertices
        const estimatedThickness = this.estimateThicknessFromVertices(mesh, point, axis);
        thickness.push(estimatedThickness);
        positions.push(point.clone());
      }
    });
    
    return { thickness, positions };
  }

  /**
   * Get perpendicular direction to axis
   */
  getPerpendicularDirection(axis) {
    // Create a perpendicular vector
    const up = new THREE.Vector3(0, 1, 0);
    if (Math.abs(axis.dot(up)) > 0.9) {
      // Axis is mostly vertical, use X direction
      return new THREE.Vector3(1, 0, 0);
    } else {
      // Use cross product with up vector
      return new THREE.Vector3().crossVectors(axis, up).normalize();
    }
  }

  /**
   * Estimate thickness from nearby vertices (fallback method)
   */
  estimateThicknessFromVertices(mesh, point, axis) {
    const positions = mesh.geometry.attributes.position;
    const nearbyPoints = [];
    const searchRadius = 0.5;
    
    for (let i = 0; i < positions.count; i++) {
      const vertex = new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );
      
      if (vertex.distanceTo(point) < searchRadius) {
        nearbyPoints.push(vertex);
      }
    }
    
    if (nearbyPoints.length < 2) return 0.5; // Default thickness
    
    // Calculate spread of nearby points
    const perpendicular = this.getPerpendicularDirection(axis.axis);
    const projections = nearbyPoints.map(p => p.dot(perpendicular));
    
    return Math.max(...projections) - Math.min(...projections);
  }

  /**
   * Smooth thickness profile using moving average
   */
  smoothProfile(profile, windowSize) {
    const { thickness, positions } = profile;
    const smoothedThickness = [];
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let i = 0; i < thickness.length; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = Math.max(0, i - halfWindow); 
           j <= Math.min(thickness.length - 1, i + halfWindow); j++) {
        sum += thickness[j];
        count++;
      }
      
      smoothedThickness.push(sum / count);
    }
    
    return {
      thickness: smoothedThickness,
      positions: positions
    };
  }

  /**
   * Validate thickness values and filter outliers
   */
  validateThickness(profile, minThickness, maxThickness) {
    const { thickness, positions } = profile;
    const validThickness = [];
    const validPositions = [];
    
    thickness.forEach((value, index) => {
      if (value >= minThickness && value <= maxThickness) {
        validThickness.push(value);
        validPositions.push(positions[index]);
      }
    });
    
    return {
      thickness: validThickness,
      positions: validPositions
    };
  }

  /**
   * Compare two thickness profiles using multiple metrics
   * @param {Object} profile1 - First thickness profile
   * @param {Object} profile2 - Second thickness profile
   * @param {Object} options - Comparison options
   * @returns {Object} Similarity metrics
   */
  compareProfiles(profile1, profile2, options = {}) {
    const {
      method = 'dtw', // 'correlation' or 'dtw'
      normalize = true,
      weightByQuality = true
    } = options;

    // Normalize profiles if requested
    const p1 = normalize ? this.normalizeProfile(profile1.thickness) : profile1.thickness;
    const p2 = normalize ? this.normalizeProfile(profile2.thickness) : profile2.thickness;

    // Resample to same length for comparison
    const maxLength = Math.max(p1.length, p2.length);
    const resampled1 = this.resampleProfile(p1, maxLength);
    const resampled2 = this.resampleProfile(p2, maxLength);

    let similarity;
    let distance;

    if (method === 'correlation') {
      const correlation = this.calculateCorrelation(resampled1, resampled2);
      similarity = correlation;
      distance = 1 - correlation;
    } else if (method === 'dtw') {
      const dtwResult = this.calculateDTW(resampled1, resampled2);
      similarity = 1 / (1 + dtwResult.distance);
      distance = dtwResult.distance;
    }

    // Apply quality weighting
    let qualityFactor = 1.0;
    if (weightByQuality) {
      const quality1 = profile1.quality?.overall || 0.5;
      const quality2 = profile2.quality?.overall || 0.5;
      qualityFactor = Math.sqrt(quality1 * quality2);
    }

    return {
      similarity: similarity * qualityFactor,
      distance: distance,
      method: method,
      qualityFactor: qualityFactor,
      metadata: {
        profile1Length: p1.length,
        profile2Length: p2.length,
        comparisonLength: maxLength,
        normalized: normalize
      }
    };
  }

  /**
   * Normalize thickness profile to [0, 1] range
   */
  normalizeProfile(thickness) {
    const min = Math.min(...thickness);
    const max = Math.max(...thickness);
    const range = max - min;
    
    if (range === 0) return thickness.map(() => 0.5);
    
    return thickness.map(value => (value - min) / range);
  }

  /**
   * Resample profile to target length
   */
  resampleProfile(profile, targetLength) {
    if (profile.length === targetLength) return profile;
    
    const resampled = [];
    const step = (profile.length - 1) / (targetLength - 1);
    
    for (let i = 0; i < targetLength; i++) {
      const index = i * step;
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const fraction = index - lower;
      
      if (lower === upper) {
        resampled.push(profile[lower]);
      } else {
        const interpolated = profile[lower] * (1 - fraction) + profile[upper] * fraction;
        resampled.push(interpolated);
      }
    }
    
    return resampled;
  }

  /**
   * Calculate Pearson correlation between two profiles
   */
  calculateCorrelation(profile1, profile2) {
    if (profile1.length !== profile2.length) {
      throw new Error('Profiles must have same length for correlation');
    }
    
    const n = profile1.length;
    const mean1 = this.calculateMean(profile1);
    const mean2 = this.calculateMean(profile2);
    
    let numerator = 0;
    let sum1 = 0;
    let sum2 = 0;
    
    for (let i = 0; i < n; i++) {
      const diff1 = profile1[i] - mean1;
      const diff2 = profile2[i] - mean2;
      numerator += diff1 * diff2;
      sum1 += diff1 * diff1;
      sum2 += diff2 * diff2;
    }
    
    const denominator = Math.sqrt(sum1 * sum2);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate Dynamic Time Warping distance between profiles
   */
  calculateDTW(profile1, profile2) {
    const n = profile1.length;
    const m = profile2.length;
    const dtw = Array(n + 1).fill(null).map(() => Array(m + 1).fill(Infinity));
    
    dtw[0][0] = 0;
    
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const cost = Math.abs(profile1[i - 1] - profile2[j - 1]);
        dtw[i][j] = cost + Math.min(
          dtw[i - 1][j],      // insertion
          dtw[i][j - 1],      // deletion
          dtw[i - 1][j - 1]   // substitution
        );
      }
    }
    
    return {
      distance: dtw[n][m],
      path: this.backtrackPath(dtw)
    };
  }

  /**
   * Backtrack to find optimal DTW path
   */
  backtrackPath(dtw) {
    const path = [];
    let i = dtw.length - 1;
    let j = dtw[0].length - 1;
    
    while (i > 0 || j > 0) {
      path.push([i - 1, j - 1]);
      
      if (i === 0) {
        j--;
      } else if (j === 0) {
        i--;
      } else {
        const min = Math.min(dtw[i - 1][j], dtw[i][j - 1], dtw[i - 1][j - 1]);
        if (min === dtw[i - 1][j - 1]) {
          i--; j--;
        } else if (min === dtw[i - 1][j]) {
          i--;
        } else {
          j--;
        }
      }
    }
    
    return path.reverse();
  }

  /**
   * Find best matching fragments for a target profile
   * @param {Object} targetProfile - Target thickness profile
   * @param {Array} candidateProfiles - Array of candidate profiles
   * @param {Object} options - Matching options
   * @returns {Array} Sorted matches with similarity scores
   */
  findBestMatches(targetProfile, candidateProfiles, options = {}) {
    const {
      maxResults = 10,
      minSimilarity = 0.3,
      method = 'dtw'
    } = options;

    const matches = candidateProfiles.map(candidate => {
      const comparison = this.compareProfiles(targetProfile, candidate, { method });
      return {
        profile: candidate,
        similarity: comparison.similarity,
        distance: comparison.distance,
        qualityFactor: comparison.qualityFactor
      };
    });

    // Filter by minimum similarity and sort
    return matches
      .filter(match => match.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);
  }

  /**
   * Assess profile quality based on completeness and consistency
   */
  assessProfileQuality(profile) {
    const { thickness } = profile;
    
    if (thickness.length === 0) {
      return { overall: 0, completeness: 0, consistency: 0 };
    }
    
    // Completeness: ratio of valid points to expected points
    const completeness = Math.min(1.0, thickness.length / 100);
    
    // Consistency: inverse of coefficient of variation
    const mean = this.calculateMean(thickness);
    const stdDev = this.calculateStdDev(thickness);
    const consistency = mean > 0 ? Math.max(0, 1 - (stdDev / mean)) : 0;
    
    // Overall quality (weighted average)
    const overall = (completeness * 0.6) + (consistency * 0.4);
    
    return {
      overall,
      completeness,
      consistency,
      numPoints: thickness.length
    };
  }

  /**
   * Utility functions
   */
  calculateMean(values) {
    return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
  }

  calculateStdDev(values) {
    const mean = this.calculateMean(values);
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  getMeshId(mesh) {
    // Generate a simple ID based on geometry hash
    const geometry = mesh.geometry;
    const positions = geometry.attributes.position;
    let hash = 0;
    
    for (let i = 0; i < Math.min(positions.count, 100); i++) {
      hash += positions.getX(i) + positions.getY(i) + positions.getZ(i);
    }
    
    return `mesh_${hash}_${positions.count}`;
  }

  /**
   * Export thickness analysis results
   */
  exportAnalysis(profile, filename = 'thickness_analysis') {
    const exportData = {
      profile: profile,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${filename}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
}
