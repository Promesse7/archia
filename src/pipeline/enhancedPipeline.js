import { getMiDaSDepthEstimator } from "../ai/midasDepthEstimator";
import { getFragmentClassifier } from "../ai/classifier";
import { PointCloudGenerator } from "../reconstruction/pointCloudGenerator";
import * as tf from "@tensorflow/tfjs";

/**
 * Enhanced Pottery Reconstruction Pipeline
 *
 * Flow:
 * 1. Input: RGB frame from camera
 * 2. Stage 1: Depth Estimation (MiDaS-inspired)
 * 3. Stage 2: Fragment Classification (MobileNet)
 * 4. Stage 3: Point Cloud Generation (RGB + Depth)
 * 5. Output: Colored 3D point cloud for reconstruction
 */

export class EnhancedPotteryPipeline {
  constructor(onProgress = null) {
    this.depthEstimator = null;
    this.classifier = null;
    this.onProgress = onProgress;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this._reportProgress("Initializing depth estimator...", 0);
      this.depthEstimator = await getMiDaSDepthEstimator();

      this._reportProgress("Initializing fragment classifier...", 33);
      this.classifier = await getFragmentClassifier();

      this._reportProgress("Pipeline ready", 100);
      this.initialized = true;
    } catch (err) {
      console.error("Pipeline initialization failed:", err);
      throw err;
    }
  }

  /**
   * Process a single frame end-to-end
   */
  async processFrame(videoElement) {
    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = performance.now();

    try {
      // Stage 1: Depth Estimation
      this._reportProgress("Estimating depth map...", 10);
      const depthTensor = await this.depthEstimator.estimateDepth(videoElement);

      // Stage 2: Fragment Classification
      this._reportProgress("Classifying fragment...", 40);
      const classification = await this.classifier.classify(videoElement);

      // Stage 3: Point Cloud Generation
      this._reportProgress("Generating point cloud...", 70);
      const pointCloudData = PointCloudGenerator.rgbDepthToPointCloud(
        videoElement,
        depthTensor,
        {
          downsample: 4,
          minDepth: 0.05,
          maxDepth: 1.0,
          scale: 10,
          filterNoise: true,
          smoothNormal: false,
        }
      );

      this._reportProgress("Creating geometry...", 85);

      // Capture depth data before disposal
      const depthArray = await depthTensor.array();
      depthTensor.dispose();

      const processingTime = performance.now() - startTime;

      const result = {
        classification,
        pointCloud: pointCloudData.points,
        pointCount: pointCloudData.count,
        depthMap: depthArray,
        normals: pointCloudData.normals,
        processingTime,
        timestamp: Date.now(),
      };

      this._reportProgress("Processing complete", 100);

      return result;
    } catch (err) {
      console.error("Frame processing failed:", err);
      this._reportProgress(`Error: ${err.message}`, 0);
      throw err;
    }
  }

  /**
   * Process multiple frames for better reconstruction
   */
  async processFrameSequence(videoElement, frameCount = 5, delayMs = 200) {
    const frames = [];

    for (let i = 0; i < frameCount; i++) {
      try {
        this._reportProgress(
          `Processing frame ${i + 1}/${frameCount}...`,
          (i / frameCount) * 100
        );

        const result = await this.processFrame(videoElement);
        frames.push(result);

        // Wait before next frame
        if (i < frameCount - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      } catch (err) {
        console.error(`Frame ${i} failed:`, err);
      }
    }

    // Merge results
    return this.mergeFrameResults(frames);
  }

  /**
   * Merge multiple frames for robust reconstruction
   */
  mergeFrameResults(frames) {
    if (frames.length === 0) {
      throw new Error("No frames to merge");
    }

    // Use classification from best frame (highest confidence)
    const bestFrame = frames.reduce((best, curr) =>
      curr.classification.confidence > best.classification.confidence
        ? curr
        : best
    );

    // Merge point clouds
    const mergedPoints = [];
    const seenPoints = new Map();

    for (const frame of frames) {
      for (const point of frame.pointCloud) {
        // Simple spatial hashing to avoid duplicates
        const key = `${Math.round(point.x * 100)},${Math.round(
          point.y * 100
        )},${Math.round(point.z * 100)}`;

        if (!seenPoints.has(key)) {
          mergedPoints.push(point);
          seenPoints.set(key, true);
        }
      }
    }

    // Average depth maps
    const mergedDepth = frames[0].depthMap.map((row, rowIdx) =>
      row.map((depth, colIdx) => {
        let sum = depth;
        for (let i = 1; i < frames.length; i++) {
          sum += frames[i].depthMap[rowIdx][colIdx];
        }
        return sum / frames.length;
      })
    );

    return {
      classification: bestFrame.classification,
      pointCloud: mergedPoints,
      pointCount: mergedPoints.length,
      depthMap: mergedDepth,
      frameCount: frames.length,
      averageProcessingTime:
        frames.reduce((sum, f) => sum + f.processingTime, 0) / frames.length,
      timestamp: Date.now(),
    };
  }

  /**
   * Filter point cloud by fragment type
   */
  filterByFragmentType(pointCloud, fragmentType) {
    // Different filtering strategies for different fragment types
    switch (fragmentType) {
      case "rim":
        // Rim fragments: preserve outer edges
        return this._filterRim(pointCloud);

      case "base":
        // Base fragments: preserve flat bottom
        return this._filterBase(pointCloud);

      case "body":
        // Body fragments: preserve all points
        return pointCloud;

      default:
        return pointCloud;
    }
  }

  _filterRim(pointCloud) {
    // Keep points with high curvature (outer edges)
    return pointCloud.filter((p) => {
      // Points far from center are likely rim
      const distFromCenter = Math.sqrt(p.x * p.x + p.y * p.y);
      return distFromCenter > 1.0;
    });
  }

  _filterBase(pointCloud) {
    // Keep points near the bottom (low z)
    const minZ = Math.min(...pointCloud.map((p) => p.z));
    const threshold = minZ + 0.5; // 0.5 units above minimum

    return pointCloud.filter((p) => p.z < threshold);
  }

  _reportProgress(stage, percent) {
    if (this.onProgress) {
      this.onProgress({ stage, percent });
    }
    console.log(`[${Math.round(percent)}%] ${stage}`);
  }

  dispose() {
    if (this.depthEstimator) {
      this.depthEstimator.dispose();
    }
    if (this.classifier) {
      this.classifier.dispose();
    }
  }
}

/**
 * Singleton instance
 */
let pipelineInstance = null;

export async function getEnhancedPipeline(onProgress = null) {
  if (!pipelineInstance) {
    pipelineInstance = new EnhancedPotteryPipeline(onProgress);
    await pipelineInstance.initialize();
  }
  return pipelineInstance;
}