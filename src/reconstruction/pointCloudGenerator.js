import * as THREE from "three";

/**
 * Advanced Point Cloud Generator
 * Combines RGB image + Depth map to create colored 3D point clouds
 */
export class PointCloudGenerator {
  static rgbDepthToPointCloud(rgbElement, depthTensor, options = {}) {
    const {
      downsample = 1,
      minDepth = 0.1,
      maxDepth = 1.0,
      scale = 10,
      filterNoise = true,
      smoothNormal = false,
    } = options;

    const depthData = depthTensor.arraySync();
    const height = depthData.length;
    const width = depthData[0].length;

    // Get RGB canvas
    const canvas = document.createElement("canvas");
    canvas.width = rgbElement.videoWidth || rgbElement.width || width;
    canvas.height = rgbElement.videoHeight || rgbElement.height || height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(rgbElement, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;

    const points = [];
    const normals = [];

    // Camera intrinsics
    const fx = width / 2;
    const fy = height / 2;
    const cx = width / 2;
    const cy = height / 2;

    // Step 1: Create point cloud from depth + RGB
    for (let v = 0; v < height; v += downsample) {
      for (let u = 0; u < width; u += downsample) {
        const depth = depthData[v][u];

        // Filter by depth range
        if (depth < minDepth || depth > maxDepth) continue;

        const z = depth * scale;

        // Back-project to 3D
        const x = ((u - cx) * z) / fx;
        const y = ((v - cy) * z) / fy;

        // Sample RGB (with bilinear interpolation)
        const rgbX = Math.floor((u / width) * canvas.width);
        const rgbY = Math.floor((v / height) * canvas.height);
        const pixelIdx = (rgbY * canvas.width + rgbX) * 4;

        const point = {
          x,
          y: -y, // Flip Y for three.js
          z,
          r: Math.min(pixels[pixelIdx] / 255, 1),
          g: Math.min(pixels[pixelIdx + 1] / 255, 1),
          b: Math.min(pixels[pixelIdx + 2] / 255, 1),
          idx: points.length,
        };

        points.push(point);
      }
    }

    // Step 2: Compute normals (if requested)
    if (smoothNormal) {
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const neighbors = [];

        // Find nearby points
        for (let j = 0; j < points.length; j++) {
          if (i === j) continue;
          const dx = points[j].x - p.x;
          const dy = points[j].y - p.y;
          const dz = points[j].z - p.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < 0.5) neighbors.push(j);
        }

        // Compute normal using PCA-like approach
        if (neighbors.length >= 3) {
          // Simplified: use cross product of two edges
          const p1 = points[neighbors[0]];
          const p2 = points[neighbors[1]];
          const p3 = points[neighbors[2]];

          const v1 = { x: p1.x - p.x, y: p1.y - p.y, z: p1.z - p.z };
          const v2 = { x: p2.x - p.x, y: p2.y - p.y, z: p2.z - p.z };

          const normal = {
            x: v1.y * v2.z - v1.z * v2.y,
            y: v1.z * v2.x - v1.x * v2.z,
            z: v1.x * v2.y - v1.y * v2.x,
          };

          const len = Math.sqrt(
            normal.x * normal.x + normal.y * normal.y + normal.z * normal.z
          );
          if (len > 0) {
            normal.x /= len;
            normal.y /= len;
            normal.z /= len;
          }

          normals[i] = normal;
        } else {
          normals[i] = { x: 0, y: 0, z: 1 }; // Default
        }
      }
    }

    // Step 3: Optional noise filtering (statistical outlier removal)
    let filteredPoints = points;
    if (filterNoise) {
      filteredPoints = PointCloudGenerator.filterOutliers(points, 20, 2.0);
    }

    return {
      points: filteredPoints,
      normals: smoothNormal ? normals : null,
      count: filteredPoints.length,
    };
  }

  /**
   * Statistical outlier removal
   */
  static filterOutliers(points, k = 20, threshold = 2.0) {
    if (!points || points.length === 0) {
      console.warn("No points to filter for outliers");
      return [];
    }

    if (points.length < 3) {
      console.warn("Too few points for outlier filtering, returning as-is");
      return points;
    }

    const distances = [];

    // Compute mean distance to k nearest neighbors
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const dists = [];

      for (let j = 0; j < points.length; j++) {
        if (i === j) continue;
        const dx = points[j].x - p.x;
        const dy = points[j].y - p.y;
        const dz = points[j].z - p.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        dists.push(dist);
      }

      dists.sort((a, b) => a - b);
      const meanDist = dists.slice(0, Math.min(k, dists.length)).reduce((a, b) => a + b) / Math.min(k, dists.length);
      distances.push(meanDist);
    }

    const meanAll = distances.reduce((a, b) => a + b) / distances.length;
    const stdDev = Math.sqrt(
      distances.reduce((sum, d) => sum + (d - meanAll) ** 2) / distances.length
    );

    // Filter points within threshold * stdDev
    return points.filter((p, i) => distances[i] < meanAll + threshold * stdDev);
  }

  /**
   * Convert point cloud to Three.js BufferGeometry
   */
  static pointsToGeometry(pointCloudData) {
    const { points } = pointCloudData;
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(points.length * 3);
    const colors = new Float32Array(points.length * 3);

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;

      colors[i * 3] = p.r;
      colors[i * 3 + 1] = p.g;
      colors[i * 3 + 2] = p.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    return geometry;
  }

  /**
   * Create Three.js Points object from point cloud
   */
  static geometryToPoints(geometry) {
    const material = new THREE.PointsMaterial({
      size: 0.02,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
    });

    return new THREE.Points(geometry, material);
  }

  /**
   * Create surface mesh from point cloud using convex hull or alpha shapes
   */
  static pointsToMesh(pointCloudData, options = {}) {
    const { method = "poisson", color = 0xc2a070 } = options;
    const { points } = pointCloudData;

    // For now, use convex hull approximation
    // In production, integrate with THREE-CSGMesh or similar
    const vertices = points.map((p) => new THREE.Vector3(p.x, p.y, p.z));

    // Create simple convex hull-like surface using alpha shapes
    // Simplified: create tetrahedra and extract surface
    const geometry = this.alphaShapeGeometry(vertices, 0.5);

    const material = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.1,
      roughness: 0.8,
      wireframe: false,
    });

    return new THREE.Mesh(geometry, material);
  }

  /**
   * Simple alpha shape geometry (3D Delaunay-like)
   * For production, use libraries like three-csg or hull.js
   */
  static alphaShapeGeometry(vertices, alpha = 0.5) {
    const geometry = new THREE.ConvexGeometry(vertices);
    return geometry;
  }
}

/**
 * Real-time point cloud renderer for Three.js
 */
export class RealTimePointCloudRenderer {
  constructor(containerElement) {
    this.container = containerElement;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      containerElement.clientWidth / containerElement.clientHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.controls = null;
    this.pointsObject = null;
    this.meshObject = null;

    this.setup();
  }

  setup() {
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.renderer.setClearColor(0x000000, 0.1);
    this.container.appendChild(this.renderer.domElement);

    // Lighting
    const light1 = new THREE.DirectionalLight(0xffffff, 0.8);
    light1.position.set(10, 10, 5);
    this.scene.add(light1);

    const light2 = new THREE.AmbientLight(0x404040);
    this.scene.add(light2);

    // Camera position
    this.camera.position.z = 10;
    this.camera.position.y = 2;

    // Grid helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    this.scene.add(gridHelper);

    // Handle resize
    window.addEventListener("resize", () => this.onWindowResize());
  }

  updatePointCloud(pointCloudData) {
    // Remove old points
    if (this.pointsObject) {
      this.scene.remove(this.pointsObject);
      this.pointsObject.geometry.dispose();
      this.pointsObject.material.dispose();
    }

    // Create new geometry and points
    const geometry = PointCloudGenerator.pointsToGeometry(pointCloudData);
    this.pointsObject = PointCloudGenerator.geometryToPoints(geometry);
    this.scene.add(this.pointsObject);

    // Auto-fit camera
    this.fitCameraToObject();
  }

  updateMesh(pointCloudData) {
    // Remove old mesh
    if (this.meshObject) {
      this.scene.remove(this.meshObject);
      this.meshObject.geometry.dispose();
      this.meshObject.material.dispose();
    }

    // Create new mesh
    this.meshObject = PointCloudGenerator.pointsToMesh(pointCloudData);
    this.scene.add(this.meshObject);

    this.fitCameraToObject();
  }

  fitCameraToObject() {
    const box = new THREE.Box3();
    if (this.pointsObject) box.expandByObject(this.pointsObject);
    if (this.meshObject) box.expandByObject(this.meshObject);

    if (!box.isEmpty()) {
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = this.camera.fov * (Math.PI / 180); // convert vertical fov to radians
      let cameraZ = Math.abs((maxDim / 2) / Math.tan(fov / 2)); // eslint-disable-line no-mixed-operators

      cameraZ *= 1.5; // zoom out a bit so that objects don't fill the screen

      this.camera.position.z = cameraZ;
      this.camera.position.x = center.x;
      this.camera.position.y = center.y;
      this.camera.lookAt(center);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.pointsObject) {
      this.pointsObject.rotation.y += 0.001;
    }
    if (this.meshObject) {
      this.meshObject.rotation.y += 0.001;
    }
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  dispose() {
    if (this.pointsObject) {
      this.pointsObject.geometry.dispose();
      this.pointsObject.material.dispose();
    }
    if (this.meshObject) {
      this.meshObject.geometry.dispose();
      this.meshObject.material.dispose();
    }
    this.renderer.dispose();
  }
}