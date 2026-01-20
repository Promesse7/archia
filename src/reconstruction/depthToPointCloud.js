export function depthToPointCloud(depthTensor) {
  const data = depthTensor.dataSync();
  const size = 256;
  const points = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const z = data[y * size + x];

      points.push({
        x: (x / size) - 0.5,
        y: (y / size) - 0.5,
        z: z * 0.5 // scale depth
      });
    }
  }

  return points;
}
