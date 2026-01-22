import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Environment, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

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

export default function ReconstructionViewer({ mesh, pointCloud = null, showPointCloud = false }) {
  const [stats, setStats] = useState(null);
  const [contextLost, setContextLost] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

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
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {contextLost && (
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          borderRadius: "8px"
        }}>
          <div style={{
            backgroundColor: "#333",
            padding: "20px",
            borderRadius: "8px",
            textAlign: "center",
            color: "#fff"
          }}>
            <div style={{ fontSize: "1.2em", marginBottom: "10px" }}>
              ⚠️ Graphics Error
            </div>
            <div style={{ color: "#aaa", marginBottom: "15px" }}>
              WebGL context lost. Recovering...
            </div>
            <div style={{ fontSize: "0.9em", color: "#666" }}>
              Attempt {retryCount + 1}
            </div>
          </div>
        </div>
      )}

      <Canvas
        key={`canvas-${retryCount}`}
        shadows
        style={{ width: "100%", height: "100%" }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false,
          // Attempt to preserve the drawing buffer to help with context recovery
          preserveDrawingBuffer: false,
          // Reduce memory pressure
          maxTextures: 16,
          maxVertexUniforms: 4096
        }}
        onCreated={(state) => {
          console.log("Canvas created, WebGL backend ready");
          
          // Handle context loss
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

      {/* Stats overlay */}
      {stats && !contextLost && (
        <div style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: "4px",
          fontSize: "0.75em",
          fontFamily: "monospace",
          pointerEvents: "none"
        }}>
          <div>Vertices: {stats.vertices.toLocaleString()}</div>
          <div>Faces: {stats.faces.toLocaleString()}</div>
          <div>Type: {stats.type}</div>
        </div>
      )}
    </div>
  );
}