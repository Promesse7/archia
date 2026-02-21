import * as THREE from "three";

/**
 * Scientific Clay Material Shader System
 * Creates physically-accurate clay materials for archaeological visualization
 */

// Clay Realism Material - Museum quality, reads well under directional light
export function createClayMaterial(options = {}) {
  const {
    baseColor = 0x8b6f47,    // Reduced from 0xb85c2a - more muted clay brown
    roughness = 0.85,        // Increased from 0.82 - more matte
    metalness = 0.05,        // Reduced from 0.08 - less metallic
    emissive = 0x6b5d54,     // Reduced from 0x8b4513 - more subtle emissive
    emissiveIntensity = 0.03, // Reduced from 0.06 - less glow
  } = options;

  return new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: roughness,
    metalness: metalness,
    emissive: emissive,
    emissiveIntensity: emissiveIntensity,
    side: THREE.DoubleSide,
    flatShading: false,
    envMapIntensity: 0.2,    // Reduced from 0.3 - less environmental reflection
  });
}

// Structural Analysis Material - Curvature-based coloring
export function createStructuralAnalysisMaterial(geometry) {
  // Compute vertex curvature
  const positions = geometry.attributes.position;
  const normals = geometry.attributes.normal;
  const colors = new Float32Array(positions.count * 3);

  // Simple curvature approximation using normal variation
  for (let i = 0; i < positions.count; i++) {
    const nx = normals.getX(i);
    const ny = normals.getY(i);
    const nz = normals.getZ(i);

    // High curvature = red, low = cyan
    const curvature = Math.abs(nx) + Math.abs(ny) + Math.abs(nz);
    const normalized = Math.min(curvature / 3, 1);

    // Red to cyan gradient
    colors[i * 3] = normalized; // R
    colors[i * 3 + 1] = 1 - normalized * 0.5; // G
    colors[i * 3 + 2] = 1 - normalized; // B
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  return new THREE.MeshStandardMaterial({
    vertexColors: true,
    wireframe: false,
    side: THREE.DoubleSide,
    roughness: 0.7,
    metalness: 0.0,
  });
}

// Thickness Heatmap Material
export function createThicknessHeatmapMaterial(geometry, thicknessData) {
  const colors = new Float32Array(geometry.attributes.position.count * 3);
  const minThickness = Math.min(...thicknessData);
  const maxThickness = Math.max(...thicknessData);
  const range = maxThickness - minThickness || 1;

  thicknessData.forEach((thickness, i) => {
    const normalized = (thickness - minThickness) / range;

    // Thin (red) to Thick (blue) gradient
    colors[i * 3] = 1 - normalized; // R decreases
    colors[i * 3 + 1] = 0.2; // G constant
    colors[i * 3 + 2] = normalized; // B increases
  });

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  return new THREE.MeshStandardMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    roughness: 0.8,
    metalness: 0.0,
  });
}

// Compute thickness data for mesh
export function computeThicknessData(mesh, samples = 100) {
  const geometry = mesh.geometry;
  const positions = geometry.attributes.position;
  const normals = geometry.attributes.normal;
  const thicknessData = [];

  const raycaster = new THREE.Raycaster();

  for (let i = 0; i < positions.count; i += Math.floor(positions.count / samples)) {
    const pos = new THREE.Vector3(
      positions.getX(i),
      positions.getY(i),
      positions.getZ(i)
    );

    const normal = new THREE.Vector3(
      normals.getX(i),
      normals.getY(i),
      normals.getZ(i)
    );

    // Cast ray inward
    raycaster.set(pos, normal.clone().negate());
    const intersects = raycaster.intersectObject(mesh, true);

    if (intersects.length > 1) {
      const thickness = intersects[0].distance;
      thicknessData.push(thickness);
    } else {
      thicknessData.push(0.1); // Default thin
    }
  }

  // Interpolate for all vertices
  const fullThicknessData = new Array(positions.count);
  for (let i = 0; i < positions.count; i++) {
    const sampleIndex = Math.floor((i / positions.count) * thicknessData.length);
    fullThicknessData[i] = thicknessData[Math.min(sampleIndex, thicknessData.length - 1)] || 0.1;
  }

  return fullThicknessData;
}

// Confidence Visualization Material
export function createConfidenceMaterial(geometry, confidenceData) {
  const colors = new Float32Array(geometry.attributes.position.count * 3);
  const opacity = new Float32Array(geometry.attributes.position.count);

  confidenceData.forEach((confidence, i) => {
    // High confidence = solid, low = transparent
    opacity[i] = confidence;

    // Green (high) to red (low) gradient
    colors[i * 3] = 1 - confidence; // R increases with low confidence
    colors[i * 3 + 1] = confidence; // G increases with high confidence
    colors[i * 3 + 2] = 0.2; // B constant
  });

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  return new THREE.MeshStandardMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
    roughness: 0.7,
  });
}

// Wireframe overlay for structural analysis
export function createWireframeOverlay(geometry, color = 0xfbbf24) {
  return new THREE.MeshBasicMaterial({
    color: color,
    wireframe: true,
    transparent: true,
    opacity: 0.15,
  });
}
