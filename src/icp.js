export function icpAlign(source, target, iterations = 10) {
  let aligned = source;

  for (let i = 0; i < iterations; i++) {
    aligned = aligned.map(p => {
      const closest = target.reduce((best, q) =>
        distance(p, q) < distance(p, best) ? q : best
      );
      return {
        x: (p.x + closest.x) / 2,
        y: (p.y + closest.y) / 2,
        z: (p.z + closest.z) / 2
      };
    });
  }

  return aligned;
}

function distance(a, b) {
  return Math.sqrt(
    (a.x - b.x) ** 2 +
    (a.y - b.y) ** 2 +
    (a.z - b.z) ** 2
  );
}
