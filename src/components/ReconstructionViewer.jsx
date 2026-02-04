import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Environment, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { PotteryAxisDetector } from "../reconstruction/axisDetection.js";
import { PotteryProfileAnalyzer } from "../reconstruction/profilePrimitives.js";
import { PotteryProfileExporter } from "../reconstruction/profileExporter.js";
import { PotteryThicknessAnalyzer } from "../reconstruction/thicknessAnalysis.js";
import { ConstraintAwareReconstructor } from "../reconstruction/constraintAwareReconstruction.js";

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
                    <span className={`${
                      primitive.confidence > 0.7 ? 'text-green-600' : 'text-orange-600'
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
            )
          </div>
        )

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
