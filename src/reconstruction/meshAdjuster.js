export function adjustMesh(points, fragmentType) {
  return points.map(p => {
    if (fragmentType === "rim") {
      // enforce circular curvature
      const angle = Math.atan2(p.y, p.x);
      const radius = Math.sqrt(p.x * p.x + p.y * p.y);
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: p.z + 0.1
      };
    }

    if (fragmentType === "base") {
      // flatten base
      return { ...p, z: 0 };
    }

    // body fragment
    return {
      x: p.x * 1.02,
      y: p.y * 1.02,
      z: p.z
    };
  });
}
