import * as THREE from "three";

export function buildPotteryMesh() {
  // Example: simple vase curve
  const points = [];
  for (let i = 0; i <= 10; i++) {
    points.push(new THREE.Vector2(Math.sin(i * 0.2) * 2 + 2, i));
  }

  const geometry = new THREE.LatheGeometry(points, 64);
  const material = new THREE.MeshStandardMaterial({
    color: "#c2a070",
    metalness: 0.1,
    roughness: 0.8,
  });

  return new THREE.Mesh(geometry, material);
}
 