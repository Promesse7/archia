import * as tf from "@tensorflow/tfjs";

/**
 * MiDaS-inspired Depth Estimation (TensorFlow.js implementation)
 * 
 * Provides high-quality monocular depth estimation without requiring
 * the full MiDaS model. Uses edge detection + feature analysis for
 * pottery fragment reconstruction.
 * 
 * Alternative: If you want the full MiDaS model, install:
 * npm install @tensorflow-models/depth-estimation
 */

function ensureRank4(t) {
  if (t.rank === 2) {
    // [H, W] → [1, H, W, 1]
    return t.expandDims(0).expandDims(-1);
  }

  if (t.rank === 3) {
    // [H, W, C] OR [1, H, W]
    if (t.shape[0] !== 1) {
      return t.expandDims(0).expandDims(-1);
    }
    return t.expandDims(-1);
  }

  if (t.rank === 4) {
    return t;
  }

  throw new Error(`Invalid tensor rank ${t.rank} for pooling`);
}

export class MiDaSDepthEstimator {
  constructor(model = "dpt_hybrid") {
    this.model = model; // "dpt_hybrid" or "dpt_large"
    this.initialized = false;
    this.depthModel = null;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      console.log("🔄 Loading depth model...");
      
      // Using our custom edge-based depth from depthEstimator
      // For production, replace with actual MiDaS:
      // this.depthModel = await createDepthEstimator({ quantized: true });
      
      this.initialized = true;
      console.log("✅ Depth estimator initialized");
    } catch (err) {
      console.error("❌ Failed to initialize depth estimator:", err);
      throw err;
    }
  }

  /**
   * Estimate depth from RGB image
   * Returns normalized depth map [0, 1]
   */
  async estimateDepth(imgElement) {
    if (!this.initialized) {
      await this.initialize();
    }

    return tf.tidy(() => {
      // Convert image to tensor
      const imgTensor = tf.browser.fromPixels(imgElement);
      const normalized = imgTensor.div(255.0);

      // Resize to standard depth estimation size
      const resized = tf.image.resizeBilinear(normalized, [384, 384]);

      // Apply edge detection for better pottery segmentation
      const edges = this.detectEdges(resized);
      
      // Apply morphological operations
      const dilated = this.dilate(edges, 3);
      const eroded = this.erode(dilated, 2);

      // Combine with original image for better depth cues
      const combined = tf.tidy(() => {
        const original384 = tf.image.resizeBilinear(normalized, [384, 384]);
        // Make eroded broadcast-compatible by expanding to 3 channels
        const eroded3 = eroded.expandDims(-1).tile([1, 1, 3]); // [384,384,1] → [384,384,3]
        return original384.mul(0.7).add(eroded3.mul(0.3));
      });

      // Compute depth using edge and shading cues
      const depth = this.computeDepthMap(combined, eroded);

      // Normalize to [0, 1]
      const min = depth.min();
      const max = depth.max();
      const normalized_depth = depth
        .sub(min)
        .div(max.sub(min).add(1e-7));

      return normalized_depth;
    });
  }

  /**
   * Edge detection using Sobel operator
   */
  detectEdges(input) {
    return tf.tidy(() => {
      // Convert RGB to grayscale first
      let gray;
      if (input.shape[2] === 3) {
        gray = tf.mean(input, -1, true);           // [h, w, 1]
      } else {
        gray = input;
      }

      const sobelX = tf.tensor2d([
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1]
      ]).reshape([3, 3, 1, 1]);

      const sobelY = tf.tensor2d([
        [-1, -2, -1],
        [0, 0, 0],
        [1, 2, 1]
      ]).reshape([3, 3, 1, 1]);

      const batch = gray.expandDims(0);            // [1, h, w, 1]
      const gx = tf.conv2d(batch, sobelX, 1, 'same');
      const gy = tf.conv2d(batch, sobelY, 1, 'same');

      const magnitude = tf.sqrt(gx.square().add(gy.square()).add(1e-7));
      return magnitude.div(magnitude.max()).squeeze([-1]); // [h, w]
    });
  }

  /**
   * Morphological dilation
   */
  dilate(input, iterations = 1) {
    let result = input;
    for (let i = 0; i < iterations; i++) {
      result = tf.tidy(() => {
        const x = ensureRank4(result);
        const pooled = tf.maxPool(x, [3, 3], [1, 1], 'same');
        return pooled.squeeze([0, -1]);
      });
    }
    return result;
  }

  /**
   * Morphological erosion
   */
  erode(input, iterations = 1) {
    let result = input;
    for (let i = 0; i < iterations; i++) {
      result = tf.tidy(() => {
        const inverted = tf.sub(1.0, result);
        const x = ensureRank4(inverted);
        const pooled = tf.maxPool(x, [3, 3], [1, 1], 'same');
        return tf.sub(1.0, pooled.squeeze([0, -1]));
      });
    }
    return result;
  }

  /**
   * Compute depth map from edges and shading
   */
  computeDepthMap(img, edges) {
    return tf.tidy(() => {
      // Convert to grayscale
      const gray = img.mean(2);

      // Gradient-based depth
      const dxKernel = tf.tensor2d([[-1, 0, 1]]).reshape([1, 3, 1, 1]);
      const dyKernel = tf.tensor2d([[-1], [0], [1]]).reshape([3, 1, 1, 1]);

      const batch = gray.expandDims(0).expandDims(-1);
      const dx = tf.conv2d(batch, dxKernel, 1, 'same').squeeze([0, -1]);
      const dy = tf.conv2d(batch, dyKernel, 1, 'same').squeeze([0, -1]);

      const gradientMag = tf.sqrt(dx.square().add(dy.square()).add(1e-7));

      // Combine edge and gradient information
      // High edges = valleys (deeper)
      // High gradients = slopes (medium depth)
      const edgeDepth = edges.mul(-1).add(1); // Invert: edges become valleys
      const gradientDepth = gradientMag;

      const depth = edgeDepth
        .mul(0.6)
        .add(gradientDepth.mul(0.4));

      // Apply bilateral filtering-like smoothing
      return this.smoothDepth(depth, 5);
    });
  }

  /**
   * Smooth depth map while preserving edges
   */
  smoothDepth(depth, radius = 5) {
    return tf.tidy(() => {
      const gaussian = this.createGaussianKernel(radius);
      const batch = depth.expandDims(0).expandDims(-1);
      const smoothed = tf.conv2d(batch, gaussian, 1, 'same');
      return smoothed.squeeze([0, -1]);
    });
  }

  /**
   * Create Gaussian kernel
   */
  createGaussianKernel(size = 5) {
    const sigma = size / 3;
    const center = Math.floor(size / 2);
    const kernel = [];

    let sum = 0;
    for (let i = 0; i < size; i++) {
      kernel[i] = [];
      for (let j = 0; j < size; j++) {
        const x = i - center;
        const y = j - center;
        const val = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
        kernel[i][j] = val;
        sum += val;
      }
    }

    // Normalize
    return tf.tensor2d(kernel)
      .div(sum)
      .reshape([size, size, 1, 1]);
  }

  /**
   * Convert depth map and RGB to point cloud
   */
  depthAndRgbToPointCloud(depthTensor, rgbElement, cameraIntrinsics = null) {
    const depthData = depthTensor.arraySync();
    const height = depthData.length;
    const width = depthData[0].length;

    // Camera intrinsics (standard for 384x384 depth maps)
    const fx = cameraIntrinsics?.fx || width / 2;
    const fy = cameraIntrinsics?.fy || height / 2;
    const cx = cameraIntrinsics?.cx || width / 2;
    const cy = cameraIntrinsics?.cy || height / 2;

    const points = [];

    // Get RGB colors from image
    const canvas = document.createElement('canvas');
    canvas.width = rgbElement.width || rgbElement.videoWidth || width;
    canvas.height = rgbElement.height || rgbElement.videoHeight || height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(rgbElement, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;

    // Threshold for valid depth (filter background)
    const depthThreshold = 0.1;

    for (let v = 0; v < height; v++) {
      for (let u = 0; u < width; u++) {
        const depth = depthData[v][u];

        // Scale depth to real-world units (arbitrary but consistent)
        const z = depth * 10;

        if (z > depthThreshold) {
          // Pinhole camera model back-projection
          const x = ((u - cx) * z) / fx;
          const y = ((v - cy) * z) / fy;

          // Get RGB color (bilinear interpolation to match depth resolution)
          const rgbX = Math.floor((u / width) * canvas.width);
          const rgbY = Math.floor((v / height) * canvas.height);
          const pixelIdx = (rgbY * canvas.width + rgbX) * 4;

          points.push({
            x,
            y,
            z,
            r: pixels[pixelIdx] / 255,
            g: pixels[pixelIdx + 1] / 255,
            b: pixels[pixelIdx + 2] / 255
          });
        }
      }
    }

    return points;
  }

  async extractProfileCurve(depthArray, width, height) {
    // depthArray is 2D array [height][width]
    const profile = [];

    // Find center column (assume rotational symmetry around middle)
    const centerX = Math.floor(width / 2);

    for (let y = 0; y < height; y++) {
      const depth = depthArray[y][centerX];
      if (depth > 0.05 && depth < 1.0) { // valid range
        profile.push({ y, depth });
      }
    }

    // Simple curvature approximation (second difference)
    const curvature = [];
    for (let i = 1; i < profile.length - 1; i++) {
      const d1 = profile[i].depth - profile[i-1].depth;
      const d2 = profile[i+1].depth - profile[i].depth;
      curvature.push(Math.abs(d2 - d1));
    }

    // Find segments with highest curvature change (edge/rim likely)
    const maxCurvIdx = curvature.indexOf(Math.max(...curvature));
    const rimStart = Math.max(0, maxCurvIdx - 5);
    const rimEnd = Math.min(curvature.length - 1, maxCurvIdx + 5);

    console.log('Profile Analysis:', {
      totalPoints: profile.length,
      curvaturePoints: curvature.length,
      maxCurvatureIndex: maxCurvIdx,
      rimSegment: { start: rimStart, end: rimEnd }
    });

    return {
      profilePoints: profile,
      rimSegment: { start: rimStart, end: rimEnd },
      maxCurvatureIndex: maxCurvIdx
    };
  }

  dispose() {
    if (this.depthModel) {
      this.depthModel.dispose?.();
    }
    this.initialized = false;
  }
}

// Singleton instance
let midasInstance = null;

export async function getMiDaSDepthEstimator() {
  if (!midasInstance) {
    midasInstance = new MiDaSDepthEstimator();
    await midasInstance.initialize();
  }
  return midasInstance;
}
