import * as THREE from "three";

/**
 * Scientific Mesh Analysis Utilities
 * Provides archaeological analysis tools for 3D meshes
 */

// Detect symmetry axis for pottery
export function detectSymmetryAxis(mesh) {
  const geometry = mesh.geometry;
  const positions = geometry.attributes.position;
  
  // Find center of mass
  const center = new THREE.Vector3();
  for (let i = 0; i < positions.count; i++) {
    center.x += positions.getX(i);
    center.y += positions.getY(i);
    center.z += positions.getZ(i);
  }
  center.divideScalar(positions.count);
  
  // Find vertical axis (Y-axis is typically the symmetry axis for pottery)
  const axis = new THREE.Vector3(0, 1, 0);
  
  // Calculate symmetry error
  let symmetryError = 0;
  const sampleCount = Math.min(100, positions.count);
  
  for (let i = 0; i < sampleCount; i++) {
    const idx = Math.floor((i / sampleCount) * positions.count);
    const pos = new THREE.Vector3(
      positions.getX(idx),
      positions.getY(idx),
      positions.getZ(idx)
    );
    
    // Reflect point across Y-axis
    const reflected = new THREE.Vector3(-pos.x, pos.y, -pos.z);
    
    // Find nearest point to reflected position
    let minDist = Infinity;
    for (let j = 0; j < positions.count; j++) {
      const other = new THREE.Vector3(
        positions.getX(j),
        positions.getY(j),
        positions.getZ(j)
      );
      const dist = reflected.distanceTo(other);
      if (dist < minDist) minDist = dist;
    }
    
    symmetryError += minDist;
  }
  
  symmetryError = (symmetryError / sampleCount) * 100; // Percentage
  
  return {
    axis,
    center,
    error: symmetryError,
  };
}

// Detect damage and fractures
export function detectDamage(mesh) {
  const geometry = mesh.geometry;
  const positions = geometry.attributes.position;
  const normals = geometry.attributes.normal;
  
  const damagePoints = [];
  const fractureLines = [];
  
  // Detect sharp edges (high normal variation)
  for (let i = 0; i < positions.count - 1; i++) {
    const n1 = new THREE.Vector3(
      normals.getX(i),
      normals.getY(i),
      normals.getZ(i)
    );
    
    const n2 = new THREE.Vector3(
      normals.getX(i + 1),
      normals.getY(i + 1),
      normals.getZ(i + 1)
    );
    
    const angle = n1.angleTo(n2);
    
    // Sharp edge detection (angle > threshold)
    if (angle > 0.5) {
      const pos = new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );
      damagePoints.push(pos);
      
      if (i < positions.count - 1) {
        const nextPos = new THREE.Vector3(
          positions.getX(i + 1),
          positions.getY(i + 1),
          positions.getZ(i + 1)
        );
        fractureLines.push([pos, nextPos]);
      }
    }
  }
  
  return {
    points: damagePoints,
    fractures: fractureLines,
    severity: damagePoints.length / positions.count,
  };
}

// Calculate mesh statistics
export function calculateMeshStats(mesh) {
  const geometry = mesh.geometry;
  const positions = geometry.attributes.position;
  
  // Bounding box
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  
  // Volume approximation (using bounding box for simplicity)
  const volume = size.x * size.y * size.z;
  
  // Surface area approximation
  let surfaceArea = 0;
  if (geometry.index) {
    const indices = geometry.index;
    for (let i = 0; i < indices.count; i += 3) {
      const i0 = indices.getX(i);
      const i1 = indices.getX(i + 1);
      const i2 = indices.getX(i + 2);
      
      const v0 = new THREE.Vector3(
        positions.getX(i0),
        positions.getY(i0),
        positions.getZ(i0)
      );
      const v1 = new THREE.Vector3(
        positions.getX(i1),
        positions.getY(i1),
        positions.getZ(i1)
      );
      const v2 = new THREE.Vector3(
        positions.getX(i2),
        positions.getY(i2),
        positions.getZ(i2)
      );
      
      const area = v0.distanceTo(v1) * v1.distanceTo(v2) * 0.5;
      surfaceArea += area;
    }
  }
  
  // Average wall thickness (simplified)
  const avgThickness = size.x * 0.1; // Rough estimate
  
  return {
    vertices: positions.count,
    faces: geometry.index ? geometry.index.count / 3 : 0,
    volume: volume,
    surfaceArea: surfaceArea,
    boundingBox: {
      size: { x: size.x, y: size.y, z: size.z },
      center: { x: center.x, y: center.y, z: center.z },
    },
    avgThickness: avgThickness,
    centerOfMass: center,
  };
}

// Generate confidence data for reconstruction
export function generateConfidenceData(mesh, fragments) {
  const geometry = mesh.geometry;
  const positions = geometry.attributes.position;
  const confidenceData = new Array(positions.count);
  
  // Base confidence on fragment coverage
  // Areas near fragment points have higher confidence
  const fragmentPoints = fragments.flatMap(f => f.pointCloud || []);
  
  for (let i = 0; i < positions.count; i++) {
    const pos = new THREE.Vector3(
      positions.getX(i),
      positions.getY(i),
      positions.getZ(i)
    );
    
    // Find nearest fragment point
    let minDist = Infinity;
    for (const fragmentPoint of fragmentPoints) {
      if (fragmentPoint.length >= 3) {
        const fp = new THREE.Vector3(
          fragmentPoint[0],
          fragmentPoint[1],
          fragmentPoint[2]
        );
        const dist = pos.distanceTo(fp);
        if (dist < minDist) minDist = dist;
      }
    }
    
    // Confidence decreases with distance from fragments
    const maxDist = 5.0; // Maximum distance for confidence calculation
    const confidence = Math.max(0, 1 - (minDist / maxDist));
    confidenceData[i] = confidence;
  }
  
  return confidenceData;
}
