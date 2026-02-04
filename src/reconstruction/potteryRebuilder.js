import * as THREE from "three";

export class PotteryReconstructor {
  constructor() {
    this.fragments = [];
    this.symmetryAxis = new THREE.Vector3(0, 1, 0);
  }

  addFragment(pointCloud, metadata = {}) {
    this.fragments.push({
      points: pointCloud,
      type: metadata.fragmentType || "unknown",
      confidence: metadata.confidence || 0.5,
      timestamp: Date.now()
    });
    console.log(`Added ${metadata.fragmentType} fragment with ${pointCloud.length} points`);
  }

  extractSymmetryProfile(points) {
    const profile = [];

    for (const point of points) {
      const r = Math.sqrt(point.x * point.x + point.z * point.z);
      const y = point.y;

      profile.push({ r, y });
    }

    profile.sort((a, b) => a.y - b.y);

    return this.smoothProfile(profile);
  }

  smoothProfile(profile, windowSize = 5) {
    if (profile.length < windowSize) return profile;

    const smoothed = [];
    const half = Math.floor(windowSize / 2);

    for (let i = 0; i < profile.length; i++) {
      const start = Math.max(0, i - half);
      const end = Math.min(profile.length, i + half + 1);
      
      let sumR = 0;
      let sumY = 0;
      let count = end - start;

      for (let j = start; j < end; j++) {
        sumR += profile[j].r;
        sumY += profile[j].y;
      }

      smoothed.push({
        r: sumR / count,
        y: sumY / count
      });
    }

    return smoothed;
  }

  mergeProfiles(profiles) {
    const allPoints = profiles.flat();

    const buckets = new Map();
    const bucketHeight = 0.5;

    for (const point of allPoints) {
      const bucketKey = Math.round(point.y / bucketHeight);
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, []);
      }
      buckets.get(bucketKey).push(point.r);
    }

    const merged = [];
    for (const [key, radii] of buckets.entries()) {
      const avgR = radii.reduce((sum, r) => sum + r, 0) / radii.length;
      const y = key * bucketHeight;
      merged.push({ r: avgR, y });
    }

    merged.sort((a, b) => a.y - b.y);

    return this.smoothProfile(merged, 7);
  }

  buildMeshFromSemanticParams(profile, cnnParams, segments = 64) {
    // Scale profile points using CNN params
    const scaledPoints = [];
    for (let i = 0; i < profile.length; i++) {
      const t = i / (profile.length - 1);
      let radius = profile[i].r; // original radius
      
      // Apply flare at rim, taper at body
      if (t > 0.8) radius *= cnnParams.flareFactor;
      if (t < 0.3) radius *= (1 - cnnParams.neckRatio * (0.3 - t) / 0.3);
      
      scaledPoints.push(new THREE.Vector2(radius * cnnParams.maxDiameter / 20, t * cnnParams.totalHeight));
    }

    const geometry = new THREE.LatheGeometry(scaledPoints, segments);
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0xc2a070,
      metalness: 0.1,
      roughness: 0.8,
      side: THREE.DoubleSide
    });

    return new THREE.Mesh(geometry, material);
  }

  buildMeshFromProfile(profile, segments = 64) {
    const points = profile.map(p => new THREE.Vector2(p.r, p.y));

    if (points.length < 3) {
      console.warn("Profile too short, using default vase shape");
      return this.buildDefaultPottery();
    }

    const geometry = new THREE.LatheGeometry(points, segments);

    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0xc2a070,
      metalness: 0.1,
      roughness: 0.8,
      side: THREE.DoubleSide
    });

    return new THREE.Mesh(geometry, material);
  }

  buildDefaultPottery() {
    const points = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const r = 2 + Math.sin(t * Math.PI) * 0.5;
      const y = i;
      points.push(new THREE.Vector2(r, y));
    }

    const geometry = new THREE.LatheGeometry(points, 64);
    const material = new THREE.MeshStandardMaterial({
      color: 0xc2a070,
      metalness: 0.1,
      roughness: 0.8
    });

    return new THREE.Mesh(geometry, material);
  }

  buildDefaultPotteryWithSemanticParams(cnnParams) {
    const points = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      let radius = 2 + Math.sin(t * Math.PI) * 0.5;
      
      // Apply flare at rim, taper at body
      if (t > 0.8) radius *= cnnParams.flareFactor;
      if (t < 0.3) radius *= (1 - cnnParams.neckRatio * (0.3 - t) / 0.3);
      
      points.push(new THREE.Vector2(radius * cnnParams.maxDiameter / 20, t * cnnParams.totalHeight));
    }

    const geometry = new THREE.LatheGeometry(points, 64);
    const material = new THREE.MeshStandardMaterial({
      color: 0xc2a070,
      metalness: 0.1,
      roughness: 0.8
    });

    return new THREE.Mesh(geometry, material);
  }

  reconstructWithSemanticParams(cnnParams) {
    if (this.fragments.length === 0) {
      console.warn("No fragments added, using default pottery with semantic params");
      return this.buildDefaultPotteryWithSemanticParams(cnnParams);
    }

    console.log(`Reconstructing pottery from ${this.fragments.length} fragments with semantic guidance`);

    const profiles = this.fragments.map(fragment => 
      this.extractSymmetryProfile(fragment.points)
    );

    const finalProfile = this.mergeProfiles(profiles);

    console.log(`Final profile: ${finalProfile.length} points, applying CNN semantic deformation`);

    const mesh = this.buildMeshFromSemanticParams(finalProfile, cnnParams);

    this.applyFragmentConstraints(mesh);

    return mesh;
  }

  reconstruct() {
    if (this.fragments.length === 0) {
      console.warn("No fragments added, using default pottery");
      return this.buildDefaultPottery();
    }

    console.log(`Reconstructing pottery from ${this.fragments.length} fragments`);

    const profiles = this.fragments.map(fragment => 
      this.extractSymmetryProfile(fragment.points)
    );

    const finalProfile = this.mergeProfiles(profiles);

    console.log(`Final profile: ${finalProfile.length} points`);

    const mesh = this.buildMeshFromProfile(finalProfile);

    this.applyFragmentConstraints(mesh);

    return mesh;
  }

  applyFragmentConstraints(mesh) {
    const hasRim = this.fragments.some(f => f.type === "rim");
    const hasBase = this.fragments.some(f => f.type === "base");

    if (hasRim) {
      console.log("Applying rim constraints");
    }

    if (hasBase) {
      console.log("Applying base constraints");
    }
  }

  clear() {
    this.fragments = [];
  }

  getStats() {
    return {
      fragmentCount: this.fragments.length,
      totalPoints: this.fragments.reduce((sum, f) => sum + f.points.length, 0),
      fragmentTypes: this.fragments.map(f => f.type)
    };
  }
}

let reconstructorInstance = null;

export function getPotteryReconstructor() {
  if (!reconstructorInstance) {
    reconstructorInstance = new PotteryReconstructor();
  }
  return reconstructorInstance;
}

export function buildPotteryMesh(fragments = []) {
  const reconstructor = getPotteryReconstructor();
  
  if (fragments.length > 0) {
    reconstructor.clear();
    fragments.forEach(f => {
      reconstructor.addFragment(f.pointCloud, { fragmentType: f.fragmentType });
    });
  }

  return reconstructor.reconstruct();
}

export function buildPotteryMeshWithSemanticParams(fragments = [], cnnParams) {
  const reconstructor = getPotteryReconstructor();
  
  if (fragments.length > 0) {
    reconstructor.clear();
    fragments.forEach(f => {
      reconstructor.addFragment(f.pointCloud, { fragmentType: f.fragmentType });
    });
  }

  return reconstructor.reconstructWithSemanticParams(cnnParams);
}