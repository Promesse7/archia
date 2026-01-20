import * as tf from "@tensorflow/tfjs";

/**
 * Edge-based depth estimation for pottery fragments
 * Uses Sobel edge detection + gradient analysis to approximate 3D depth
 * Suitable for symmetric pottery with clear contours
 */

export class DepthEstimator {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    await tf.ready();
    this.initialized = true;
    console.log("DepthEstimator initialized");
  }

  /**
   * Estimate depth map from RGB image
   * @param {HTMLImageElement|HTMLVideoElement} imgElement 
   * @returns {tf.Tensor3D} Depth map [height, width, 1]
   */
  estimateDepth(imgElement) {
    if (!this.initialized) {
      throw new Error("DepthEstimator not initialized");
    }

    return tf.tidy(() => {
      // 1. Convert to grayscale tensor [H, W, 1]
      const rgb = tf.browser.fromPixels(imgElement);
      const grayscale = rgb.mean(2, true); // Average RGB channels

      // 2. Normalize to [0, 1]
      const normalized = grayscale.div(255.0);

      // 3. Apply Sobel edge detection
      const edges = this.applySobelEdges(normalized);

      // 4. Convert edges to depth cues
      // Key insight: For pottery, edges indicate curvature changes
      // Darker edges = sharper curves = greater depth variation
      const depthFromEdges = edges.mul(-1).add(1); // Invert: strong edges = low depth

      // 5. Apply gradient-based depth (shading cues)
      const gradientDepth = this.computeGradientDepth(normalized);

      // 6. Combine edge and gradient depth
      const combinedDepth = depthFromEdges.mul(0.6).add(gradientDepth.mul(0.4));

      // 7. Apply smoothing (pottery is smooth, not jagged)
      const smoothed = this.gaussianBlur(combinedDepth, 3);

      // 8. Normalize final depth to [0, 1] range
      const min = smoothed.min();
      const max = smoothed.max();
      const finalDepth = smoothed.sub(min).div(max.sub(min).add(1e-7));

      return finalDepth;
    });
  }

  /**
   * Apply Sobel edge detection
   * @param {tf.Tensor3D} input Grayscale image [H, W, 1]
   * @returns {tf.Tensor3D} Edge magnitude [H, W, 1]
   */
  applySobelEdges(input) {
    return tf.tidy(() => {
      // Sobel kernels for horizontal and vertical edges
      const sobelX = tf.tensor2d([
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1]
      ]).expandDims(2).expandDims(3); // [3, 3, 1, 1]

      const sobelY = tf.tensor2d([
        [-1, -2, -1],
        [0, 0, 0],
        [1, 2, 1]
      ]).expandDims(2).expandDims(3);

      const inputBatch = input.expandDims(0); // [1, H, W, 1]

      // Apply convolution
      const gx = tf.conv2d(inputBatch, sobelX, 1, 'same');
      const gy = tf.conv2d(inputBatch, sobelY, 1, 'same');

      // Compute gradient magnitude
      const magnitude = tf.sqrt(gx.square().add(gy.square()));

      return magnitude.squeeze([0]); // Remove batch dim
    });
  }

  /**
   * Compute depth from image gradients (shading → curvature)
   * @param {tf.Tensor3D} input Normalized grayscale [H, W, 1]
   * @returns {tf.Tensor3D} Depth map [H, W, 1]
   */
  computeGradientDepth(input) {
    return tf.tidy(() => {
      // Simple gradient kernel
      const kernelX = tf.tensor2d([
        [-1, 0, 1]
      ]).expandDims(2).expandDims(3);

      const kernelY = tf.tensor2d([
        [-1],
        [0],
        [1]
      ]).expandDims(2).expandDims(3);

      const inputBatch = input.expandDims(0);

      const dx = tf.conv2d(inputBatch, kernelX, 1, 'same');
      const dy = tf.conv2d(inputBatch, kernelY, 1, 'same');

      // Gradients indicate surface orientation
      // For pottery: gradients perpendicular to symmetry axis indicate depth
      const gradientMagnitude = tf.sqrt(dx.square().add(dy.square()));

      return gradientMagnitude.squeeze([0]);
    });
  }

  /**
   * Apply Gaussian blur for smoothing
   * @param {tf.Tensor3D} input [H, W, 1]
   * @param {number} kernelSize Blur kernel size (must be odd)
   * @returns {tf.Tensor3D} Blurred [H, W, 1]
   */
  gaussianBlur(input, kernelSize = 5) {
    return tf.tidy(() => {
      // Create Gaussian kernel
      const sigma = kernelSize / 3;
      const center = Math.floor(kernelSize / 2);
      
      const kernel = [];
      let sum = 0;

      for (let i = 0; i < kernelSize; i++) {
        kernel[i] = [];
        for (let j = 0; j < kernelSize; j++) {
          const x = i - center;
          const y = j - center;
          const val = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
          kernel[i][j] = val;
          sum += val;
        }
      }

      // Normalize kernel
      const gaussianKernel = tf.tensor2d(kernel)
        .div(sum)
        .expandDims(2)
        .expandDims(3);

      const inputBatch = input.expandDims(0);
      const blurred = tf.conv2d(inputBatch, gaussianKernel, 1, 'same');

      return blurred.squeeze([0]);
    });
  }

  /**
   * Convert depth map to point cloud
   * @param {tf.Tensor3D} depthMap [H, W, 1]
   * @param {Object} cameraIntrinsics {fx, fy, cx, cy}
   * @returns {Array<{x, y, z}>} 3D points
   */
  depthToPointCloud(depthMap, cameraIntrinsics = null) {
    const depthData = depthMap.arraySync();
    const height = depthData.length;
    const width = depthData[0].length;

    // Default camera intrinsics (can be calibrated)
    const fx = cameraIntrinsics?.fx || width / 2;
    const fy = cameraIntrinsics?.fy || height / 2;
    const cx = cameraIntrinsics?.cx || width / 2;
    const cy = cameraIntrinsics?.cy || height / 2;

    const points = [];

    for (let v = 0; v < height; v++) {
      for (let u = 0; u < width; u++) {
        const z = depthData[v][u][0] * 10; // Scale depth (arbitrary units)

        if (z > 0.1) { // Filter out near-zero depths (background)
          // Pinhole camera model: back-project pixel to 3D
          const x = (u - cx) * z / fx;
          const y = (v - cy) * z / fy;

          points.push({ x, y, z });
        }
      }
    }

    return points;
  }

  /**
   * Dispose resources
   */
  dispose() {
    // TF.js handles memory automatically with tidy()
    this.initialized = false;
  }
}

// Singleton instance
let depthEstimatorInstance = null;

export async function getDepthEstimator() {
  if (!depthEstimatorInstance) {
    depthEstimatorInstance = new DepthEstimator();
    await depthEstimatorInstance.initialize();
  }
  return depthEstimatorInstance;
}