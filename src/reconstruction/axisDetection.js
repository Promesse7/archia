import * as THREE from 'three';

/**
 * Detects the rotational symmetry axis of pottery fragments
 * Uses center-of-mass fitting across horizontal slices
 * Returns axis direction and center point for alignment
 */
export class PotteryAxisDetector {
  constructor() {
    this.axis = null;
    this.confidence = 0;
    this.debugPoints = [];
  }

  /**
   * Detect symmetry axis from point cloud or mesh
   * @param {THREE.Points|THREE.Mesh} geometry - Point cloud or mesh
   * @param {Object} options - Detection parameters
   * @returns {Object} { axis: THREE.Vector3, center: THREE.Vector3, confidence: number }
   */
  detectAxis(geometry, options = {}) {
    const {
      numSlices = 20,
      minPointsPerSlice = 10,
      verticalAxis = new THREE.Vector3(0, 1, 0),
      tolerance = 0.1
    } = options;

    // Extract points from geometry
    const points = this.extractPoints(geometry);
    if (points.length < minPointsPerSlice * numSlices) {
      throw new Error('Insufficient points for reliable axis detection');
    }

    // Find vertical bounds
    const bounds = this.findVerticalBounds(points, verticalAxis);
    
    // Analyze horizontal slices
    const sliceCenters = [];
    const sliceHeights = [];

    for (let i = 0; i < numSlices; i++) {
      const t = i / (numSlices - 1);
      const height = bounds.min + t * (bounds.max - bounds.min);
      
      const slicePoints = this.getHorizontalSlice(points, height, verticalAxis, tolerance);
      
      if (slicePoints.length >= minPointsPerSlice) {
        const center = this.calculateCenterOfMass(slicePoints);
        sliceCenters.push(center);
        sliceHeights.push(height);
      }
    }

    if (sliceCenters.length < 3) {
      throw new Error('Not enough valid slices for axis detection');
    }

    // Fit axis through slice centers using least squares
    const { axis, center, confidence } = this.fitAxisThroughPoints(sliceCenters, sliceHeights, verticalAxis);
    
    this.axis = axis;
    this.center = center;
    this.confidence = confidence;
    this.debugPoints = sliceCenters;

    return { axis, center, confidence };
  }

  /**
   * Extract points from various geometry types
   */
  extractPoints(geometry) {
    const points = [];
    
    if (geometry.isPoints) {
      const positions = geometry.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        points.push(new THREE.Vector3(
          positions.getX(i),
          positions.getY(i),
          positions.getZ(i)
        ));
      }
    } else if (geometry.isMesh) {
      const positions = geometry.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        points.push(new THREE.Vector3(
          positions.getX(i),
          positions.getY(i),
          positions.getZ(i)
        ));
      }
    }
    
    return points;
  }

  /**
   * Find vertical bounds of point cloud
   */
  findVerticalBounds(points, verticalAxis) {
    let min = Infinity, max = -Infinity;
    
    points.forEach(point => {
      const projection = point.dot(verticalAxis);
      min = Math.min(min, projection);
      max = Math.max(max, projection);
    });
    
    return { min, max };
  }

  /**
   * Get points within a horizontal slice
   */
  getHorizontalSlice(points, height, verticalAxis, tolerance) {
    return points.filter(point => {
      const projection = point.dot(verticalAxis);
      return Math.abs(projection - height) <= tolerance;
    });
  }

  /**
   * Calculate center of mass for a set of points
   */
  calculateCenterOfMass(points) {
    const center = new THREE.Vector3();
    points.forEach(point => center.add(point));
    center.divideScalar(points.length);
    return center;
  }

  /**
   * Fit axis through slice centers using least squares
   */
  fitAxisThroughPoints(sliceCenters, sliceHeights, initialAxis) {
    // Use PCA to find dominant direction
    const matrix = new THREE.Matrix3();
    const centroid = new THREE.Vector3();
    
    // Calculate centroid
    sliceCenters.forEach(center => centroid.add(center));
    centroid.divideScalar(sliceCenters.length);
    
    // Build covariance matrix
    sliceCenters.forEach(center => {
      const v = center.clone().sub(centroid);
      matrix.elements[0] += v.x * v.x;
      matrix.elements[4] += v.y * v.y;
      matrix.elements[8] += v.z * v.z;
      matrix.elements[1] += v.x * v.y;
      matrix.elements[3] += v.x * v.y;
      matrix.elements[2] += v.x * v.z;
      matrix.elements[6] += v.x * v.z;
      matrix.elements[5] += v.y * v.z;
      matrix.elements[7] += v.y * v.z;
    });
    
    // Find eigenvector with largest eigenvalue
    const eigenvalues = new THREE.Vector3();
    const eigenvectors = new THREE.Matrix3();
    
    // Simple power iteration for dominant eigenvector
    let axis = initialAxis.clone().normalize();
    for (let i = 0; i < 50; i++) {
      const newAxis = new THREE.Vector3();
      newAxis.x = matrix.elements[0] * axis.x + matrix.elements[1] * axis.y + matrix.elements[2] * axis.z;
      newAxis.y = matrix.elements[3] * axis.x + matrix.elements[4] * axis.y + matrix.elements[5] * axis.z;
      newAxis.z = matrix.elements[6] * axis.x + matrix.elements[7] * axis.y + matrix.elements[8] * axis.z;
      axis = newAxis.normalize();
    }
    
    // Calculate confidence based on point alignment
    let totalDeviation = 0;
    sliceCenters.forEach(center => {
      const projected = this.projectPointOntoAxis(center, centroid, axis);
      const deviation = center.distanceTo(projected);
      totalDeviation += deviation;
    });
    
    const avgDeviation = totalDeviation / sliceCenters.length;
    const confidence = Math.max(0, 1 - avgDeviation / 0.1); // Normalize to 0-1
    
    return { axis, center: centroid, confidence };
  }

  /**
   * Project a point onto the axis line
   */
  projectPointOntoAxis(point, axisCenter, axisDirection) {
    const v = point.clone().sub(axisCenter);
    const projection = axisDirection.clone().multiplyScalar(v.dot(axisDirection));
    return axisCenter.clone().add(projection);
  }

  /**
   * Create visualization helpers for the detected axis
   */
  createAxisHelpers(length = 10) {
    if (!this.axis || !this.center) return null;
    
    const helpers = {
      axisLine: null,
      slicePoints: [],
      confidenceIndicator: null
    };
    
    // Main axis line
    const axisGeometry = new THREE.BufferGeometry().setFromPoints([
      this.center.clone().add(this.axis.clone().multiplyScalar(length)),
      this.center.clone().add(this.axis.clone().multiplyScalar(-length))
    ]);
    
    const axisMaterial = new THREE.LineBasicMaterial({ 
      color: 0x00ff00, 
      linewidth: 3 
    });
    helpers.axisLine = new THREE.Line(axisGeometry, axisMaterial);
    
    // Slice center points
    this.debugPoints.forEach(point => {
      const sphereGeometry = new THREE.SphereGeometry(0.05, 8, 8);
      const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.copy(point);
      helpers.slicePoints.push(sphere);
    });
    
    return helpers;
  }

  /**
   * Align geometry to detected axis
   */
  alignGeometryToAxis(geometry) {
    if (!this.axis) return geometry;
    
    // Calculate rotation to align axis with Y-axis
    const targetAxis = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(this.axis, targetAxis);
    
    // Apply rotation to geometry
    geometry.applyQuaternion4(quaternion);
    
    // Center geometry on axis
    const bbox = new THREE.Box3().setFromObject(geometry);
    const center = bbox.getCenter(new THREE.Vector3());
    geometry.position.sub(center);
    
    return geometry;
  }
}
