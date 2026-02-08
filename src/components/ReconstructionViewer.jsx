import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Environment, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { PotteryAxisDetector } from "../reconstruction/axisDetection.js";
import { PotteryProfileAnalyzer } from "../reconstruction/profilePrimitives.js";
import { PotteryProfileExporter } from "../reconstruction/profileExporter.js";
import { PotteryThicknessAnalyzer } from "../reconstruction/thicknessAnalysis.js";
import { ConstraintAwareReconstructor } from "../reconstruction/constraintAwareReconstruction.js";

// Archaeological metadata icons
const ContextIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314-3.314l4.244 4.243a1.998 1.998 0 010 2.828zM7 10a3 3 0 100-6 3 3 0 000 6z" />
  </svg>
);

const FabricIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
  </svg>
);

const VesselIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const HeritageIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

function PotteryMesh({ mesh }) {
  const meshRef = useRef();
  const [localMesh, setLocalMesh] = useState(null);

  useEffect(() => {
    if (mesh) {
      try {
        console.log("✅ Updating 3D viewer with new mesh");

        // Add safety checks for geometry
        if (!mesh.geometry || !mesh.geometry.attributes ||
          !mesh.geometry.attributes.position ||
          mesh.geometry.attributes.position.count === 0) {
          console.warn("Invalid mesh geometry provided");
          return;
        }

        console.log("Geometry vertices:", mesh.geometry.attributes.position.count);
        console.log("Material:", mesh.material?.type || "default material");

        const clonedGeometry = mesh.geometry.clone();
        const clonedMaterial = mesh.material?.clone() || new THREE.MeshStandardMaterial({
          color: '#555',
          metalness: 0.1,
          roughness: 0.9
        });

        // Ensure the geometry is valid
        if (clonedGeometry) {
          if (!clonedGeometry.boundingBox) {
            clonedGeometry.computeBoundingBox();
          }
          if (!clonedGeometry.boundingSphere) {
            clonedGeometry.computeBoundingSphere();
          }
        }

        setLocalMesh({
          geometry: clonedGeometry,
          material: clonedMaterial
        });
      } catch (error) {
        console.error("Error processing mesh:", error);
      }
    }
  }, [mesh]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
    }
  });

  if (!localMesh) {
    return (
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2, 2.5, 5, 32]} />
        <meshStandardMaterial
          color="#555"
          metalness={0.1}
          roughness={0.9}
          transparent
          opacity={0.3}
          wireframe
        />
      </mesh>
    );
  }

  return (
    <mesh
      ref={meshRef}
      geometry={localMesh.geometry}
      material={localMesh.material}
      castShadow
      receiveShadow
      position={[0, 0, 0]}
    />
  );
}

function PointCloudVisualization({ points, visible = false }) {
  const pointsRef = useRef();

  useEffect(() => {
    if (!points || points.length === 0 || !visible) return;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(points.length * 3);

    points.forEach((point, i) => {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    });

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    if (pointsRef.current) {
      pointsRef.current.geometry = geometry;
    }

    return () => {
      geometry.dispose();
    };
  }, [points, visible]);

  if (!visible || !points || points.length === 0) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry />
      <pointsMaterial
        size={0.05}
        color="#4caf50"
        sizeAttenuation
      />
    </points>
  );
}

function Scene({ mesh, showPointCloud, pointCloud }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-10, 5, -5]} intensity={0.3} color="#ffd700" />

      <Environment preset="sunset" />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -3, 0]}
        receiveShadow
      >
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial
          color="#2a2a2a"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      <Grid
        args={[50, 50]}
        position={[0, -2.99, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#444"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#666"
        fadeDistance={30}
        fadeStrength={1}
      />

      <PointCloudVisualization points={pointCloud} visible={showPointCloud} />

      <PotteryMesh mesh={mesh} />

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={30}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.5}
      />
    </>
  );
}

export default function ReconstructionViewer({
  mesh,
  pointCloud = null,
  showPointCloud = false,
  onAnalysisComplete = null
}) {
  const [stats, setStats] = useState(null);
  const [contextLost, setContextLost] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Analysis state
  const [axisDetection, setAxisDetection] = useState(null);
  const [profilePrimitives, setProfilePrimitives] = useState(null);
  const [thicknessProfile, setThicknessProfile] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [constrainedReconstruction, setConstrainedReconstruction] = useState(null);
  const [showConstraints, setShowConstraints] = useState(false);

  // Archaeological metadata state
  const [showMetadataPanel, setShowMetadataPanel] = useState(false);
  const [activeMetadataTab, setActiveMetadataTab] = useState('context');
  const [archaeologicalMetadata, setArchaeologicalMetadata] = useState({
    // Context/Findspot
    context: {
      site: "Kigali Genocide Memorial",
      trench: "Unit A-3",
      contextId: "KGM-2024-A3-001",
      stratigraphicPhase: "Late Colonial Period",
      coordinates: { lat: -1.9536, lng: 30.0606, elevation: 1433 }
    },
    // Fabric analysis
    fabric: {
      type: "Fine Ware",
      color: "Reddish Brown (2.5YR 4/4)",
      inclusions: "Fine quartz sand, mica flakes",
      hardness: "Mohs 3.5",
      source: "Local Kigali clay deposits",
      temper: "Vegetable matter, 15% by volume"
    },
    // Sherd characteristics
    sherdType: {
      type: "Rim Sherd",
      form: "Everted rim",
      thickness: "0.8cm average",
      weight: "125g",
      preservation: "Good, slight weathering"
    },
    // Vessel classification
    vesselForm: {
      class: "Storage Jar",
      specificForm: "Globular body with everted rim",
      estimatedCapacity: "15-20 liters",
      rimDiameter: "28cm",
      baseDiameter: "12cm",
      height: "35cm (estimated)"
    },
    // Manufacturing techniques
    manufacture: {
      primaryTechnique: "Wheel-thrown",
      secondaryTechnique: "Coiling for lower body",
      evidence: "Wheel marks visible on interior",
      firing: "Oxidizing atmosphere, 850-900°C",
      finish: "Burnished exterior, smooth interior"
    },
    // Surface treatment and decoration
    surfaceTreatment: {
      exterior: "Burnished",
      interior: "Slipped",
      decoration: "Incised geometric patterns",
      motif: "Diamond pattern below rim",
      technique: "Incising before firing",
      position: "Upper body zone"
    },
    // Use-wear analysis
    useWear: {
      sooting: "Light carbon deposits on rim",
      limescale: "Minimal interior deposits",
      abrasion: "Moderate base wear",
      repairs: "Ancient repair hole near rim",
      function: "Cooking/storage vessel"
    },
    // Condition assessment
    condition: {
      abrasion: "Light surface erosion",
      burning: "Localized fire blackening",
      fragmentation: "Clean breaks, 5 fragments",
      stability: "Stable, no active deterioration"
    },
    // Chronology
    chronology: {
      dateRange: "1890-1920 CE",
      wareGroup: "Colonial Rwandan Ware",
      culturalPeriod: "German Colonial Period",
      confidence: "High (85%)"
    },
    // Heritage metadata (Rwanda specific)
    heritage: {
      classification: "Tangible Cultural Heritage",
      protectionStatus: "Protected under Law 28/2016",
      ministerialOrder: "Ministerial Order 001/2024",
      cidocCRM: "E22_Man-Made_Object",
      significance: "High - represents colonial-era material culture",
      accessionNumber: "KGM-2024-POT-001"
    },
    // Reconstruction notes
    reconstruction: {
      matchingConfidence: "92%",
      joinEvidence: "Clear morphological continuity",
      virtualStage: "Complete profile reconstruction",
      completeness: "75% (missing handle)",
      uncertainty: "Handle attachment method"
    }
  });

  // Analysis modules
  const axisDetector = useRef(new PotteryAxisDetector());
  const profileAnalyzer = useRef(new PotteryProfileAnalyzer());
  const profileExporter = useRef(new PotteryProfileExporter());
  const thicknessAnalyzer = useRef(new PotteryThicknessAnalyzer());
  const constraintReconstructor = useRef(new ConstraintAwareReconstructor());

  // Run geometric analysis when mesh is available
  useEffect(() => {
    if (!mesh) return;

    const runAnalysis = async () => {
      try {
        setAnalysisProgress('Detecting symmetry axis...');

        // 1. Axis Detection
        const axisResult = axisDetector.current.detectAxis(mesh);
        setAxisDetection(axisResult);

        setAnalysisProgress('Extracting profile primitives...');

        // 2. Extract profile from mesh
        const profilePoints = extractProfileFromMesh(mesh);

        // 3. Profile primitive analysis
        const primitiveResult = profileAnalyzer.current.analyzeProfile(profilePoints);
        setProfilePrimitives(primitiveResult);

        setAnalysisProgress('Analyzing thickness profile...');

        // 4. Thickness analysis
        const thicknessResult = thicknessAnalyzer.current.extractThicknessProfile(mesh, axisResult);
        setThicknessProfile(thicknessResult);

        setAnalysisProgress('Analysis complete');

        // Notify parent component
        if (onAnalysisComplete) {
          const analysisData = {
            axis: axisResult,
            primitives: primitiveResult,
            thickness: thicknessResult,
            profile: profilePoints,
            constraints: profileAnalyzer.current.exportConstraints()
          };

          onAnalysisComplete(analysisData);

          // Initialize constraint-aware reconstruction
          const reconstructor = constraintReconstructor.current;
          const constraintData = reconstructor.initialize(analysisData);
          setConstrainedReconstruction(constraintData);
        }

        // Clear progress after delay
        setTimeout(() => setAnalysisProgress(null), 2000);

      } catch (error) {
        console.error('Analysis failed:', error);
        setAnalysisProgress('Analysis failed');
        setTimeout(() => setAnalysisProgress(null), 2000);
      }
    };

    runAnalysis();
  }, [mesh, onAnalysisComplete]);

  // Extract profile curve from mesh
  const extractProfileFromMesh = (mesh) => {
    const positions = mesh.geometry.attributes.position;
    const profilePoints = [];

    // Simple profile extraction - take cross-section at Y=0
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);

      // Only take points near the center plane (z ≈ 0)
      if (Math.abs(z) < 0.1) {
        profilePoints.push(new THREE.Vector2(Math.abs(x), y));
      }
    }

    // Sort by height and remove duplicates
    profilePoints.sort((a, b) => a.y - b.y);
    const uniqueProfile = [];
    let lastY = -Infinity;

    profilePoints.forEach(point => {
      if (point.y - lastY > 0.01) {
        uniqueProfile.push(point);
        lastY = point.y;
      }
    });

    return uniqueProfile;
  };

  // Export functions
  const exportProfileDrawing = () => {
    if (!profilePrimitives) return;

    const profilePoints = mesh ? extractProfileFromMesh(mesh) : [];
    profileExporter.current.downloadSVG(profilePoints, profilePrimitives, {
      title: 'ARCHIA Pottery Profile',
      vesselId: `vessel_${Date.now()}`
    });
  };

  const exportAnalysisData = () => {
    if (!profilePrimitives) return;

    const profilePoints = mesh ? extractProfileFromMesh(mesh) : [];
    const report = profileExporter.current.generateMeasurementReport(profilePoints, profilePrimitives);

    profileExporter.current.exportJSON(profilePoints, profilePrimitives, {
      vesselId: `vessel_${Date.now()}`,
      ...report
    });
  };

  const exportArchaeologicalReport = () => {
    const report = {
      // Report metadata
      reportInfo: {
        title: "Archaeological Pottery Analysis Report",
        generated: new Date().toISOString(),
        vesselId: archaeologicalMetadata.heritage.accessionNumber,
        software: "ARCHIA Pottery AI v1.0",
        standards: ["PCRG", "CIfA", "CIDOC-CRM", "Rwanda Law 28/2016"]
      },

      // Context and findspot
      context: archaeologicalMetadata.context,

      // Fabric analysis
      fabric: archaeologicalMetadata.fabric,

      // Sherd characteristics
      sherdType: archaeologicalMetadata.sherdType,

      // Vessel classification
      vesselForm: archaeologicalMetadata.vesselForm,

      // Manufacturing techniques
      manufacture: archaeologicalMetadata.manufacture,

      // Surface treatment and decoration
      surfaceTreatment: archaeologicalMetadata.surfaceTreatment,

      // Use-wear analysis
      useWear: archaeologicalMetadata.useWear,

      // Condition assessment
      condition: archaeologicalMetadata.condition,

      // Chronology
      chronology: archaeologicalMetadata.chronology,

      // Heritage metadata (Rwanda specific)
      heritage: archaeologicalMetadata.heritage,

      // Reconstruction notes
      reconstruction: archaeologicalMetadata.reconstruction,

      // Technical analysis
      technicalAnalysis: {
        geometry: stats,
        axisDetection: axisDetection,
        profilePrimitives: profilePrimitives,
        thicknessProfile: thicknessProfile,
        constrainedReconstruction: constrainedReconstruction
      },

      // Export metadata
      exportInfo: {
        format: "JSON",
        version: "1.0",
        compliance: "Rwanda Heritage Documentation Standards"
      }
    };

    // Create and download JSON file
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.download = `archaeological-report-${archaeologicalMetadata.heritage.accessionNumber}-${Date.now()}.json`;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);

    console.log("✅ Archaeological report exported:", report);
  };

  // Constraint-aware reconstruction functions
  const generateConstrainedReconstruction = () => {
    if (!constrainedReconstruction) return;

    try {
      const reconstructor = constraintReconstructor.current;
      const constrainedMesh = reconstructor.generateConstrainedMesh(
        constrainedReconstruction.constraints,
        {
          resolution: 64,
          height: 10,
          baseRadius: 5,
          method: 'constraint_driven'
        }
      );

      // Store the constrained mesh for visualization
      setConstrainedReconstruction(prev => ({
        ...prev,
        constrainedMesh,
        reconstructionDate: Date.now()
      }));

      setAnalysisProgress('Constraint-aware reconstruction generated');
      setTimeout(() => setAnalysisProgress(null), 2000);

    } catch (error) {
      console.error('Constraint reconstruction failed:', error);
      setAnalysisProgress('Reconstruction failed');
      setTimeout(() => setAnalysisProgress(null), 2000);
    }
  };

  const exportConstrainedReconstruction = () => {
    if (!constrainedReconstruction?.constrainedMesh) return;

    constraintReconstructor.current.exportReconstruction(
      constrainedReconstruction.constrainedMesh,
      `constrained_reconstruction_${Date.now()}`
    );
  };

  const toggleConstraints = () => {
    setShowConstraints(!showConstraints);
  };

  // Update mesh stats
  useEffect(() => {
    if (mesh) {
      const vertexCount = mesh.geometry.attributes.position.count;
      const faceCount = mesh.geometry.index ? mesh.geometry.index.count / 3 : vertexCount / 3;

      setStats({
        vertices: vertexCount,
        faces: Math.floor(faceCount),
        type: mesh.geometry.type
      });
    }
  }, [mesh]);

  // Retry rendering after context loss
  useEffect(() => {
    if (contextLost) {
      const timer = setTimeout(() => {
        console.log("Attempting to recover WebGL context...");
        setContextLost(false);
        setRetryCount(prev => prev + 1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [contextLost]);

  return (
    <div className="relative w-full h-full">
      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10 rounded-lg">
          <div className="bg-surface p-5 rounded-lg text-center text-white">
            <div className="text-lg mb-2.5">
              ⚠️ Graphics Error
            </div>
            <div className="text-gray-400 mb-4">
              WebGL context lost. Recovering...
            </div>
            <div className="text-sm text-gray-500">
              Attempt {retryCount + 1}
            </div>
          </div>
        </div>
      )}

      <Canvas
        key={`canvas-${retryCount}`}
        shadows
        className="w-full h-full"
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false,
          preserveDrawingBuffer: false
        }}
        onCreated={(state) => {
          const canvas = state.gl.domElement;

          const handleContextLost = (e) => {
            console.error("WebGL context lost");
            e.preventDefault();
            setContextLost(true);
          };

          const handleContextRestored = () => {
            console.log("WebGL context restored");
            setContextLost(false);
          };

          canvas.addEventListener("webglcontextlost", handleContextLost, false);
          canvas.addEventListener("webglcontextrestored", handleContextRestored, false);

          return () => {
            canvas.removeEventListener("webglcontextlost", handleContextLost);
            canvas.removeEventListener("webglcontextrestored", handleContextRestored);
          };
        }}
      >
        <PerspectiveCamera
          makeDefault
          position={[8, 6, 8]}
          fov={50}
        />

        <Scene mesh={mesh} showPointCloud={showPointCloud} pointCloud={pointCloud} />
      </Canvas>

      {/* Analysis Progress */}
      {analysisProgress && (
        <div className="absolute top-2.5 left-2.5 bg-accent/90 text-ink px-4 py-2 rounded-lg text-sm font-medium z-20">
          {analysisProgress}
        </div>
      )}

      {/* Analysis Controls */}
      {showAnalysis && axisDetection && (
        <div className="absolute top-2.5 right-2.5 bg-surface/95 text-ink p-4 rounded-lg z-20 max-w-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">Analysis</h4>
            <button
              onClick={() => setShowAnalysis(false)}
              className="text-muted hover:text-ink text-xs"
            >
              ✕
            </button>
          </div>

          {/* Axis Detection Results */}
          <div className="mb-4">
            <div className="text-xs font-medium text-accent mb-1">Symmetry Axis</div>
            <div className="text-xs text-muted">
              Confidence: {(axisDetection.confidence * 100).toFixed(1)}%
            </div>
            {axisDetection.confidence > 0.7 && (
              <div className="text-xs text-green-600">✓ Aligned</div>
            )}
          </div>

          {/* Profile Primitives */}
          {profilePrimitives && (
            <div className="mb-4">
              <div className="text-xs font-medium text-accent mb-2">Profile Primitives</div>
              <div className="space-y-1">
                {Object.entries(profilePrimitives).map(([key, primitive]) => {
                  if (!primitive || primitive.type === 'metadata') return null;
                  return (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="capitalize text-muted">{key}</span>
                      <span className={`${primitive.confidence > 0.7 ? 'text-green-600' : 'text-orange-600'
                        }`}>
                        {(primitive.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Thickness Profile */}
          {thicknessProfile && (
            <div className="mb-4">
              <div className="text-xs font-medium text-accent mb-1">Thickness Analysis</div>
              <div className="text-xs text-muted">
                Mean: {thicknessProfile.metadata.meanThickness.toFixed(2)} cm
              </div>
              <div className="text-xs text-muted">
                Range: {thicknessProfile.metadata.minThickness.toFixed(2)} - {thicknessProfile.metadata.maxThickness.toFixed(2)} cm
              </div>
              <div className="text-xs text-muted">
                Quality: {(thicknessProfile.quality.overall * 100).toFixed(0)}%
              </div>
              {thicknessProfile.quality.overall > 0.7 && (
                <div className="text-xs text-green-600">✓ Reliable</div>
              )}
          </div>
            
          )};

        {/* Export Controls */}
          <div className="border-t border-border pt-3 space-y-2">
            <button
              onClick={exportProfileDrawing}
              className="w-full px-3 py-1.5 bg-accent text-white rounded text-xs font-medium hover:bg-accentHover transition-colors"
            >
              Export Drawing
            </button>
            <button
              onClick={exportAnalysisData}
              className="w-full px-3 py-1.5 bg-surface2 text-ink rounded text-xs font-medium hover:bg-surface transition-colors"
            >
              Export Data
            </button>
            {constrainedReconstruction && (
              <button
                onClick={generateConstrainedReconstruction}
                className="w-full px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors"
              >
                Generate Reconstruction
              </button>
            )}
            {constrainedReconstruction?.constrainedMesh && (
              <button
                onClick={exportConstrainedReconstruction}
                className="w-full px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                Export Reconstruction
              </button>
            )}
          </div>

          {/* Constraint-Aware Reconstruction Status */}
          {constrainedReconstruction && (
            <div className="border-t border-border pt-3">
              <div className="text-xs font-medium text-accent mb-2">Reconstruction</div>
              <div className="text-xs text-muted">
                Confidence: {(constrainedReconstruction.confidence * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted">
                Constraints: {constrainedReconstruction.metadata.totalConstraints}
              </div>
              {constrainedReconstruction.constrainedMesh && (
                <div className="text-xs text-green-600">✓ Generated</div>
              )}
              <button
                onClick={toggleConstraints}
                className="mt-2 text-xs text-accent hover:text-accentHover transition-colors"
              >
                {showConstraints ? 'Hide' : 'Show'} Details
              </button>
            </div>
          )}
        </div>
      )}

      {/* Constraints Detail Panel */}
      {showConstraints && constrainedReconstruction && (
        <div className="absolute top-2.5 right-72 bg-surface/95 text-ink p-4 rounded-lg z-20 max-w-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">Constraints</h4>
            <button
              onClick={toggleConstraints}
              className="text-muted hover:text-ink text-xs"
            >
              ✕
            </button>
          </div>

          {Object.entries(constrainedReconstruction.constraints).map(([key, constraint]) => {
            if (!constraint.enabled) return null;
            return (
              <div key={key} className="mb-2">
                <div className="text-xs font-medium capitalize">{key}</div>
                <div className="text-xs text-muted">
                  Confidence: {(constraint.confidence * 100).toFixed(0)}%
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Archaeological Metadata Panel */}
      <div className="absolute top-2.5 left-2.5 z-20">
        <button
          onClick={() => setShowMetadataPanel(!showMetadataPanel)}
          className="bg-amber-600/90 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors mb-2"
        >
          <HeritageIcon />
          <span className="ml-2">Archaeological Data</span>
        </button>

        {showMetadataPanel && (
          <div className="bg-black/95 backdrop-blur-md border border-amber-600/30 rounded-lg p-4 mt-2 w-80 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-amber-400 font-bold text-sm">Pottery Recording Standards</h3>
              <button
                onClick={() => setShowMetadataPanel(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {/* Metadata Tabs */}
            <div className="flex space-x-1 mb-4 border-b border-zinc-700">
              {[
                { id: 'context', label: 'Context', icon: ContextIcon },
                { id: 'fabric', label: 'Fabric', icon: FabricIcon },
                { id: 'vessel', label: 'Vessel', icon: VesselIcon },
                { id: 'heritage', label: 'Heritage', icon: HeritageIcon }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveMetadataTab(tab.id)}
                  className={`px-2 py-1 text-xs rounded-t transition-colors ${activeMetadataTab === tab.id
                    ? 'bg-amber-600 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
                    }`}
                >
                  <tab.icon className="inline w-3 h-3 mr-1" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Context Tab */}
            {activeMetadataTab === 'context' && (
              <div className="space-y-3 text-xs">
                <div className="border-b border-zinc-700 pb-2">
                  <h4 className="text-amber-400 font-semibold mb-2">Context/Findspot</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Site:</span>
                      <span className="text-white">{archaeologicalMetadata.context.site}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Trench:</span>
                      <span className="text-white">{archaeologicalMetadata.context.trench}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Context ID:</span>
                      <span className="text-white">{archaeologicalMetadata.context.contextId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Stratigraphy:</span>
                      <span className="text-white">{archaeologicalMetadata.context.stratigraphicPhase}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Coordinates:</span>
                      <span className="text-white">
                        {archaeologicalMetadata.context.coordinates.lat.toFixed(4)}, {archaeologicalMetadata.context.coordinates.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fabric Tab */}
            {activeMetadataTab === 'fabric' && (
              <div className="space-y-3 text-xs">
                <div className="border-b border-zinc-700 pb-2">
                  <h4 className="text-amber-400 font-semibold mb-2">Fabric Analysis</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Type:</span>
                      <span className="text-white">{archaeologicalMetadata.fabric.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Color:</span>
                      <span className="text-white">{archaeologicalMetadata.fabric.color}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Inclusions:</span>
                      <span className="text-white">{archaeologicalMetadata.fabric.inclusions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Hardness:</span>
                      <span className="text-white">{archaeologicalMetadata.fabric.hardness}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Source:</span>
                      <span className="text-white">{archaeologicalMetadata.fabric.source}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vessel Tab */}
            {activeMetadataTab === 'vessel' && (
              <div className="space-y-3 text-xs">
                <div className="border-b border-zinc-700 pb-2">
                  <h4 className="text-amber-400 font-semibold mb-2">Vessel Form & Dimensions</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Class:</span>
                      <span className="text-white">{archaeologicalMetadata.vesselForm.class}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Form:</span>
                      <span className="text-white">{archaeologicalMetadata.vesselForm.specificForm}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Rim Diameter:</span>
                      <span className="text-white">{archaeologicalMetadata.vesselForm.rimDiameter}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Base Diameter:</span>
                      <span className="text-white">{archaeologicalMetadata.vesselForm.baseDiameter}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Height:</span>
                      <span className="text-white">{archaeologicalMetadata.vesselForm.height}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Capacity:</span>
                      <span className="text-white">{archaeologicalMetadata.vesselForm.estimatedCapacity}</span>
                    </div>
                  </div>
                </div>

                <div className="border-b border-zinc-700 pb-2">
                  <h4 className="text-amber-400 font-semibold mb-2">Manufacture & Surface</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Technique:</span>
                      <span className="text-white">{archaeologicalMetadata.manufacture.primaryTechnique}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Firing:</span>
                      <span className="text-white">{archaeologicalMetadata.manufacture.firing}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Surface:</span>
                      <span className="text-white">{archaeologicalMetadata.surfaceTreatment.exterior}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Decoration:</span>
                      <span className="text-white">{archaeologicalMetadata.surfaceTreatment.decoration}</span>
                    </div>
                  </div>
                </div>

                <div className="pb-2">
                  <h4 className="text-amber-400 font-semibold mb-2">Use-Wear & Condition</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Function:</span>
                      <span className="text-white">{archaeologicalMetadata.useWear.function}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Sooting:</span>
                      <span className="text-white">{archaeologicalMetadata.useWear.sooting}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Condition:</span>
                      <span className="text-white">{archaeologicalMetadata.condition.stability}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Heritage Tab */}
            {activeMetadataTab === 'heritage' && (
              <div className="space-y-3 text-xs">
                <div className="border-b border-zinc-700 pb-2">
                  <h4 className="text-amber-400 font-semibold mb-2">Chronology</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Date Range:</span>
                      <span className="text-white">{archaeologicalMetadata.chronology.dateRange}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Period:</span>
                      <span className="text-white">{archaeologicalMetadata.chronology.culturalPeriod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Ware Group:</span>
                      <span className="text-white">{archaeologicalMetadata.chronology.wareGroup}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Confidence:</span>
                      <span className="text-white">{archaeologicalMetadata.chronology.confidence}</span>
                    </div>
                  </div>
                </div>

                <div className="border-b border-zinc-700 pb-2">
                  <h4 className="text-amber-400 font-semibold mb-2">Rwanda Heritage Status</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Classification:</span>
                      <span className="text-white">{archaeologicalMetadata.heritage.classification}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Protection:</span>
                      <span className="text-white">{archaeologicalMetadata.heritage.protectionStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Order:</span>
                      <span className="text-white">{archaeologicalMetadata.heritage.ministerialOrder}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">CIDOC-CRM:</span>
                      <span className="text-white">{archaeologicalMetadata.heritage.cidocCRM}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Accession:</span>
                      <span className="text-white">{archaeologicalMetadata.heritage.accessionNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="pb-2">
                  <h4 className="text-amber-400 font-semibold mb-2">Reconstruction Notes</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Matching:</span>
                      <span className="text-white">{archaeologicalMetadata.reconstruction.matchingConfidence}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Completeness:</span>
                      <span className="text-white">{archaeologicalMetadata.reconstruction.completeness}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Virtual Stage:</span>
                      <span className="text-white">{archaeologicalMetadata.reconstruction.virtualStage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Uncertainty:</span>
                      <span className="text-white">{archaeologicalMetadata.reconstruction.uncertainty}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Export Actions */}
            <div className="border-t border-zinc-700 pt-3 mt-4">
              <button
                onClick={exportArchaeologicalReport}
                className="w-full px-3 py-2 bg-amber-600 text-white rounded text-xs font-medium hover:bg-amber-700 transition-colors"
              >
                Export Archaeological Report
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Show Analysis Toggle */}
      {!showAnalysis && axisDetection && (
        <button
          onClick={() => setShowAnalysis(true)}
          className="absolute top-2.5 right-2.5 bg-surface/95 text-ink px-3 py-1.5 rounded-lg text-xs font-medium z-20 hover:bg-surface transition-colors"
        >
          Show Analysis
        </button>
      )}

      {/* Axis Visualization */}
      {axisDetection && axisDetection.confidence > 0.7 && (
        <div className="absolute bottom-2.5 right-2.5 bg-green-600/90 text-white px-3 py-2 rounded-lg text-xs font-medium z-20">
          ✓ Symmetry Detected
        </div>
      )}

      {/* Original Stats */}
      {stats && !contextLost && (
        <div className="absolute bottom-2.5 left-2.5 bg-black/70 text-white px-3 py-2 rounded text-xs font-mono pointer-events-none">
          <div>Vertices: {stats.vertices.toLocaleString()}</div>
          <div>Faces: {stats.faces.toLocaleString()}</div>
          <div>Type: {stats.type}</div>
        </div>
      )}
    </div>
  );
}
