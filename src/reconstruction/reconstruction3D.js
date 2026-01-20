export function reconstruct3D(fragmentType, features) {
  const points = [];

  const baseDepth = {
    rim: 0.3,
    body: 0.6,
    base: 0.2
  }[fragmentType];

  for (let i = 0; i < 1024; i += 3) {
    const x = features[i] ?? Math.random();
    const y = features[i + 1] ?? Math.random();
    const z = baseDepth + (features[i + 2] ?? 0) * 0.2;

    points.push({ x, y, z });
  }

  return points;
}
