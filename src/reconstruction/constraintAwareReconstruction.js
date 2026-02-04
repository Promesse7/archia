import * as THREE from 'three';

/**
 * Constraint-Aware Reconstruction System
 * Combines analysis layers to generate archaeologically plausible reconstructions
 * Prevents hallucinated geometry through multi-layer constraints
 */
export class ConstraintAwareReconstructor {
  constructor() {
    this.constraints = new Map();
    this.reconstructionHistory = [];
    this.confidenceThreshold = 0.7;
  }

  /**
   * Initialize reconstruction with analysis constraints
   * @param {Object} analysisData - Combined analysis from all layers
   * @param {Object} options - Reconstruction options
   */
  initialize(analysisData, options = {}) {
    const {
      axis,
      primitives,
      thickness,
      profile,
      vesselType = 'unknown'
    } = analysisData;

    // Store all analysis constraints
    this.constraints.set('axis', this.createAxisConstraints(axis));
    this.constraints.set('primitives', this.createPrimitiveConstraints(primitives));
    this.constraints.set('thickness', this.createThicknessConstraints(thickness));
    this.constraints.set('profile', this.createProfileConstraints(profile));
    this.constraints.set('vesselType', vesselType);

    // Validate constraint consistency
    this.validateConstraintConsistency();

    return {
      constraints: Object.fromEntries(this.constraints),
      confidence: this.calculateOverallConfidence(),
      metadata: {
        vesselType,
        totalConstraints: this.constraints.size,
        reconstructionDate: new Date().toISOString()
      }
    };
  }

  /**
   * Create axis-based constraints
   */
  createAxisConstraints(axisData) {
    if (!axisData || axisData.confidence < this.confidenceThreshold) {
      return { enabled: false, reason: 'Low confidence axis detection' };
    }

    return {
      enabled: true,
      type: 'rotational_symmetry',
      axis: axisData.axis,
      center: axisData.center,
      confidence: axisData.confidence,
      constraints: {
        // Enforce rotational symmetry
        enforceSymmetry: true,
        // Allow small deviations for natural variation
        symmetryTolerance: 0.05,
        // Constrain reconstruction to axis-aligned coordinate system
        alignToAxis: true
      }
    };
  }

  /**
   * Create primitive-based constraints
   */
  createPrimitiveConstraints(primitiveData) {
    if (!primitiveData || primitiveData.metadata.confidence < this.confidenceThreshold) {
      return { enabled: false, reason: 'Low confidence primitive detection' };
    }

    const constraints = {
      enabled: true,
      type: 'primitive_based',
      confidence: primitiveData.metadata.confidence,
      primitives: {}
    };

    // Add constraints for each detected primitive
    Object.entries(primitiveData).forEach(([key, primitive]) => {
      if (!primitive || primitive.type === 'metadata') return;

      switch (primitive.type) {
        case 'rim':
          constraints.primitives.rim = {
            radius: primitive.radius,
            height: primitive.height,
            orientation: primitive.orientation,
            constraints: {
              // Rim defines lip angle and maximum diameter
              maxRadius: primitive.radius * 1.1,
              minRadius: primitive.radius * 0.9,
              lipAngle: primitive.orientation.angle,
              // Rim should be smooth and continuous
              smoothness: 0.95
            }
          };
          break;

        case 'base':
          constraints.primitives.base = {
            radius: primitive.radius,
            height: primitive.height,
            isFlat: primitive.isFlat,
            constraints: {
              // Base defines minimum radius and termination
              minRadius: primitive.radius * 0.8,
              maxRadius: primitive.radius * 1.2,
              // Base should be flat or gently curved
              flatness: primitive.isFlat ? 0.9 : 0.6,
              // Base marks vessel bottom
              bottomConstraint: true
            }
          };
          break;

        case 'shoulder':
          constraints.primitives.shoulder = {
            radius: primitive.radius,
            height: primitive.height,
            constraints: {
              // Shoulder defines maximum diameter point
              maxDiameter: primitive.radius,
              // Sharp curvature change at shoulder
              curvatureChange: 0.8,
              // Shoulder should be prominent
              prominence: primitive.isProminent ? 0.9 : 0.6
            }
          };
          break;

        case 'neck':
          if (primitive.confidence > 0.5) {
            constraints.primitives.neck = {
              radius: primitive.radius,
              height: primitive.height,
              constraints: {
                // Neck is concave region
                concavity: primitive.isConcave ? 0.8 : 0.4,
                // Neck connects rim to shoulder
                connectivity: 0.9
              }
            };
          }
          break;

        case 'body':
          constraints.primitives.body = {
            segments: primitive.segments,
            constraints: {
              // Body provides overall vessel shape
              smoothness: 0.85,
              // Body should respect overall proportions
              aspectRatio: this.calculateBodyAspectRatio(primitive)
            }
          };
          break;
      }
    });

    return constraints;
  }

  /**
   * Create thickness-based constraints
   */
  createThicknessConstraints(thicknessData) {
    if (!thicknessData || thicknessData.quality.overall < this.confidenceThreshold) {
      return { enabled: false, reason: 'Low quality thickness profile' };
    }

    return {
      enabled: true,
      type: 'thickness_based',
      confidence: thicknessData.quality.overall,
      thickness: thicknessData.thickness,
      metadata: thicknessData.metadata,
      constraints: {
        // Thickness should vary smoothly
        smoothness: 0.9,
        // Thickness should be within realistic bounds
        minThickness: thicknessData.metadata.minThickness * 0.8,
        maxThickness: thicknessData.metadata.maxThickness * 1.2,
        // Thickness variation patterns
        variationPattern: this.analyzeThicknessPattern(thicknessData.thickness),
        // Wall thickness consistency
        consistency: thicknessData.quality.consistency
      }
    };
  }

  /**
   * Create profile-based constraints
   */
  createProfileConstraints(profileData) {
    if (!profileData || profileData.length < 10) {
      return { enabled: false, reason: 'Insufficient profile data' };
    }

    return {
      enabled: true,
      type: 'profile_based',
      profile: profileData,
      constraints: {
        // Profile should be smooth and continuous
        smoothness: 0.95,
        // Profile should respect vessel proportions
        aspectRatio: this.calculateProfileAspectRatio(profileData),
        // Profile curvature should be realistic
        curvatureConstraints: this.analyzeProfileCurvature(profileData),
        // Profile should be monotonic in certain regions
        monotonicity: this.analyzeProfileMonotonicity(profileData)
      }
    };
  }

  /**
   * Generate constrained reconstruction mesh
   * @param {Object} constraints - All analysis constraints
   * @param {Object} options - Reconstruction options
   * @returns {THREE.Mesh} Constrained reconstruction mesh
   */
  generateConstrainedMesh(constraints, options = {}) {
    const {
      resolution = 64,
      height = 10,
      baseRadius = 5,
      method = 'constraint_driven'
    } = options;

    // Create base geometry
    const geometry = new THREE.CylinderGeometry(baseRadius, baseRadius, height, resolution, 1, 1, false);
    
    // Apply constraints sequentially
    if (constraints.axis?.enabled) {
      this.applyAxisConstraints(geometry, constraints.axis);
    }
    
    if (constraints.primitives?.enabled) {
      this.applyPrimitiveConstraints(geometry, constraints.primitives);
    }
    
    if (constraints.thickness?.enabled) {
      this.applyThicknessConstraints(geometry, constraints.thickness);
    }
    
    if (constraints.profile?.enabled) {
      this.applyProfileConstraints(geometry, constraints.profile);
    }

    // Create material with archaeological properties
    const material = new THREE.MeshStandardMaterial({
      color: 0x8b7355, // Clay color
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    
    // Store reconstruction metadata
    mesh.userData = {
      reconstructionType: 'constraint_aware',
      constraints: constraints,
      confidence: this.calculateOverallConfidence(),
      timestamp: Date.now()
    };

    return mesh;
  }

  /**
   * Apply axis constraints to geometry
   */
  applyAxisConstraints(geometry, axisConstraints) {
    const positions = geometry.attributes.position;
    const { axis, center } = axisConstraints;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);

      // Project point onto axis plane
      const point = new THREE.Vector3(x, y, z);
      const projected = this.projectPointOntoAxis(point, center, axis);
      
      // Enforce rotational symmetry
      const distance = point.distanceTo(projected);
      const angle = Math.atan2(z, x);
      
      // Apply symmetry constraint with tolerance
      const symmetricX = distance * Math.cos(angle);
      const symmetricZ = distance * Math.sin(angle);
      
      positions.setXYZ(i, symmetricX, y, symmetricZ);
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  /**
   * Apply primitive constraints to geometry
   */
  applyPrimitiveConstraints(geometry, primitiveConstraints) {
    const positions = geometry.attributes.position;
    const { primitives } = primitiveConstraints;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const radius = Math.sqrt(x * x + z * z);

      // Apply rim constraints
      if (primitives.rim) {
        const rim = primitives.rim;
        if (y > rim.height - 1 && y < rim.height + 1) {
          // Near rim height
          const constrainedRadius = Math.min(radius, rim.constraints.maxRadius);
          const scale = constrainedRadius / radius;
          positions.setXYZ(i, x * scale, y, z * scale);
        }
      }

      // Apply base constraints
      if (primitives.base) {
        const base = primitives.base;
        if (y < base.height + 1) {
          // Near base height
          const constrainedRadius = Math.min(radius, base.constraints.maxRadius);
          const scale = constrainedRadius / radius;
          positions.setXYZ(i, x * scale, y, z * scale);
        }
      }

      // Apply shoulder constraints
      if (primitives.shoulder) {
        const shoulder = primitives.shoulder;
        if (Math.abs(y - shoulder.height) < 1) {
          // Near shoulder height
          const constrainedRadius = Math.min(radius, shoulder.constraints.maxDiameter);
          const scale = constrainedRadius / radius;
          positions.setXYZ(i, x * scale, y, z * scale);
        }
      }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  /**
   * Apply thickness constraints to geometry
   */
  applyThicknessConstraints(geometry, thicknessConstraints) {
    const positions = geometry.attributes.position;
    const { thickness, constraints } = thicknessConstraints;

    // Create thickness profile lookup
    const thicknessProfile = this.interpolateThicknessProfile(thickness);

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const radius = Math.sqrt(x * x + z * z);

      // Get expected thickness at this height
      const expectedThickness = this.getThicknessAtHeight(y, thicknessProfile);
      
      // Calculate current thickness (distance from surface to center)
      const currentThickness = radius;
      
      // Apply thickness constraint
      if (currentThickness > expectedThickness * constraints.maxThickness) {
        const scale = (expectedThickness * constraints.maxThickness) / currentThickness;
        positions.setXYZ(i, x * scale, y, z * scale);
      }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  /**
   * Apply profile constraints to geometry
   */
  applyProfileConstraints(geometry, profileConstraints) {
    const positions = geometry.attributes.position;
    const { profile, constraints } = profileConstraints;

    // Create profile interpolation
    const profileFunction = this.interpolateProfile(profile);

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const radius = Math.sqrt(x * x + z * z);

      // Get expected radius at this height
      const expectedRadius = profileFunction(y);
      
      // Apply profile constraint with tolerance
      const tolerance = expectedRadius * 0.1;
      if (Math.abs(radius - expectedRadius) > tolerance) {
        const scale = expectedRadius / radius;
        positions.setXYZ(i, x * scale, y, z * scale);
      }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  /**
   * Helper methods
   */
  projectPointOntoAxis(point, center, axis) {
    const v = point.clone().sub(center);
    const projection = axis.clone().multiplyScalar(v.dot(axis));
    return center.clone().add(projection);
  }

  interpolateThicknessProfile(thickness) {
    // Create interpolation function for thickness profile
    return (height) => {
      // Simple linear interpolation - in practice, use more sophisticated interpolation
      const index = Math.floor(height * (thickness.length - 1) / 10);
      return thickness[Math.min(index, thickness.length - 1)] || 0.5;
    };
  }

  getThicknessAtHeight(height, thicknessProfile) {
    return thicknessProfile(height);
  }

  interpolateProfile(profile) {
    // Create interpolation function for profile radius
    return (height) => {
      const index = Math.floor(height * (profile.length - 1) / 10);
      return profile[Math.min(index, profile.length - 1)]?.x || 5;
    };
  }

  calculateBodyAspectRatio(primitive) {
    // Calculate aspect ratio from body segments
    if (!primitive.segments || primitive.segments.length === 0) return 1.5;
    
    const heights = primitive.segments.map(seg => seg.end - seg.start);
    const totalHeight = heights.reduce((a, b) => a + b, 0);
    const avgRadius = 5; // Placeholder - would calculate from actual data
    
    return totalHeight / (avgRadius * 2);
  }

  analyzeThicknessPattern(thickness) {
    // Analyze thickness variation patterns
    const variation = Math.max(...thickness) - Math.min(...thickness);
    const mean = thickness.reduce((a, b) => a + b, 0) / thickness.length;
    
    return {
      variation,
      mean,
      pattern: variation < mean * 0.3 ? 'uniform' : 'variable'
    };
  }

  calculateProfileAspectRatio(profile) {
    const heights = profile.map(p => p.y);
    const radii = profile.map(p => p.x);
    
    const height = Math.max(...heights) - Math.min(...heights);
    const avgRadius = radii.reduce((a, b) => a + b, 0) / radii.length;
    
    return height / (avgRadius * 2);
  }

  analyzeProfileCurvature(profile) {
    // Calculate curvature constraints from profile
    const curvatures = [];
    for (let i = 1; i < profile.length - 1; i++) {
      const p1 = profile[i - 1];
      const p2 = profile[i];
      const p3 = profile[i + 1];
      
      const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
      const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
      
      const cross = v1.x * v2.y - v1.y * v2.x;
      const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
      const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
      
      curvatures.push(cross / (len1 * len2));
    }
    
    return {
      maxCurvature: Math.max(...curvatures),
      minCurvature: Math.min(...curvatures),
      avgCurvature: curvatures.reduce((a, b) => a + b, 0) / curvatures.length
    };
  }

  analyzeProfileMonotonicity(profile) {
    // Check if profile is monotonic in appropriate regions
    let increasing = 0;
    let decreasing = 0;
    
    for (let i = 1; i < profile.length; i++) {
      if (profile[i].x > profile[i - 1].x) increasing++;
      else decreasing++;
    }
    
    return {
      increasing: increasing / (profile.length - 1),
      decreasing: decreasing / (profile.length - 1),
      isMonotonic: Math.max(increasing, decreasing) / (profile.length - 1) > 0.8
    };
  }

  validateConstraintConsistency() {
    // Check if constraints from different layers are consistent
    const issues = [];
    
    // Check axis vs profile consistency
    const axis = this.constraints.get('axis');
    const profile = this.constraints.get('profile');
    
    if (axis?.enabled && profile?.enabled) {
      // Profile should be compatible with rotational symmetry
      const profileAspectRatio = this.calculateProfileAspectRatio(profile.profile);
      if (profileAspectRatio > 3 || profileAspectRatio < 0.3) {
        issues.push('Profile aspect ratio inconsistent with rotational symmetry');
      }
    }
    
    // Check primitive vs thickness consistency
    const primitives = this.constraints.get('primitives');
    const thickness = this.constraints.get('thickness');
    
    if (primitives?.enabled && thickness?.enabled) {
      const avgThickness = thickness.metadata.meanThickness;
      const rimRadius = primitives.primitives.rim?.radius || 5;
      
      if (avgThickness > rimRadius * 0.8) {
        issues.push('Wall thickness too large relative to vessel size');
      }
    }
    
    if (issues.length > 0) {
      console.warn('Constraint consistency issues:', issues);
    }
    
    return issues;
  }

  calculateOverallConfidence() {
    let totalConfidence = 0;
    let enabledCount = 0;
    
    this.constraints.forEach((constraint, key) => {
      if (constraint.enabled) {
        totalConfidence += constraint.confidence || 0.5;
        enabledCount++;
      }
    });
    
    return enabledCount > 0 ? totalConfidence / enabledCount : 0;
  }

  /**
   * Export reconstruction results
   */
  exportReconstruction(mesh, filename = 'constrained_reconstruction') {
    const exportData = {
      mesh: {
        vertices: mesh.geometry.attributes.position.count,
        faces: mesh.geometry.index ? mesh.geometry.index.count / 3 : 0,
        type: mesh.geometry.type
      },
      constraints: Object.fromEntries(this.constraints),
      confidence: this.calculateOverallConfidence(),
      metadata: mesh.userData,
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
