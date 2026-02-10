import { getMiDaSDepthEstimator } from "../ai/midasDepthEstimator";
import { getFragmentClassifier } from "../ai/classifier";
import { PointCloudGenerator } from "../reconstruction/pointCloudGenerator";
import { PoissonReconstructor } from "../reconstruction/poissonReconstructor";
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

      // Stage 2.5: CNN Vessel Parameter Prediction (NEW)
      this._reportProgress("Predicting vessel parameters...", 50);
      const vesselParams = await this.classifier.predictVesselParams(videoElement);

      // Stage 2.6: Profile Analysis
      this._reportProgress("Analyzing profile curve...", 55);
      const depthArray = await depthTensor.array();
      const profile = await this.depthEstimator.extractProfileCurve(
        depthArray,
        videoElement.videoWidth || 384,
        videoElement.videoHeight || 384
      );

      const segments = this.segmentProfile(profile);

      // Simple rule-based override for classification
      let finalType = classification.fragmentType;
      let finalConf = classification.confidence;

      if (segments.rim.length > segments.body.length * 1.5) {
        finalType = "rim";
        finalConf = Math.max(0.7, finalConf);
        console.log('Rule-based override: Detected RIM fragment');
      } else if (segments.base.length > segments.body.length * 1.2) {
        finalType = "base";
        finalConf = Math.max(0.65, finalConf);
        console.log('Rule-based override: Detected BASE fragment');
      }

      // Update classification with rule-based improvements
      classification.fragmentType = finalType;
      classification.confidence = finalConf;

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

      // Stage 3.5: Poisson Surface Reconstruction (NEW)
      this._reportProgress("Performing Poisson reconstruction...", 80);
      const poissonReconstructor = new PoissonReconstructor({
        useCNNParams: true,
        cnnWeight: 0.7,
        samplesPerPoint: 1.5,
        minDistance: 0.5,
        maxDistance: 3.0
      });

      const reconstructedMesh = poissonReconstructor.reconstructPointCloud(
        pointCloudData.points,
        vesselParams,
        pointCloudData.normals
      );

      this._reportProgress("Creating geometry...", 85);

      depthTensor.dispose();

      const processingTime = performance.now() - startTime;

      const result = {
        classification,
        pointCloud: pointCloudData.points,
        pointCount: pointCloudData.count,
        depthMap: depthArray,
        normals: pointCloudData.normals,
        vesselParams, // NEW: CNN-predicted vessel parameters
        reconstructedMesh, // NEW: Poisson reconstructed mesh
        profileAnalysis: {
          profile,
          segments,
          ruleBasedType: finalType,
          originalType: classification.fragmentType
        },
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

  segmentProfile(profileResult) {
    const { profilePoints, maxCurvatureIndex } = profileResult;

    // Very simple rule-based segmentation
    let segments = {
      rim: [],
      body: [],
      base: []
    };

    // Rim: top part until max curvature
    segments.rim = profilePoints.slice(0, maxCurvatureIndex + 1);

    // Body: middle flat-ish part
    const bodyEnd = profilePoints.length * 0.7; // rough heuristic
    segments.body = profilePoints.slice(maxCurvatureIndex + 1, bodyEnd);

    // Base: bottom flat part
    segments.base = profilePoints.slice(bodyEnd);

    console.log('Profile Segmentation:', {
      rimLength: segments.rim.length,
      bodyLength: segments.body.length,
      baseLength: segments.base.length,
      totalLength: profilePoints.length
    });

    return segments;
  }

  generateGuidedLathePoints(params, pointCloud) {
    const points = [];
    const steps = 100;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      let radius = params.baseWidth +
        (params.maxDiameter - params.baseWidth) * Math.sin(t * Math.PI) +
        params.rimRadius * (t > 0.8 ? (t - 0.8) * 5 : 0);

      // Blend with real point cloud average radius at this height
      const realRadius = this.averageRadiusAtHeight(pointCloud, t * params.height);
      radius = 0.6 * radius + 0.4 * realRadius;

      points.push({ x: radius, y: t * params.height });
    }

    console.log('Generated Guided Lathe Points:', {
      totalPoints: points.length,
      maxHeight: params.height,
      maxRadius: Math.max(...points.map(p => p.x))
    });

    return points;
  }

  averageRadiusAtHeight(pointCloud, targetHeight) {
    if (!pointCloud || pointCloud.length === 0) return 5.0;

    const nearbyPoints = pointCloud.filter(point =>
      Math.abs(point.z - targetHeight) < 2.0
    );

    if (nearbyPoints.length === 0) return 5.0;

    const radii = nearbyPoints.map(point => Math.sqrt(point.x * point.x + point.y * point.y));
    return radii.reduce((sum, r) => sum + r, 0) / radii.length;
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