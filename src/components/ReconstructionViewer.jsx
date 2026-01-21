import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Environment, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

function PotteryMesh({ mesh }) {
  const meshRef = useRef();
  const [localMesh, setLocalMesh] = useState(null);

  useEffect(() => {
    if (mesh) {
      console.log("✅ Updating 3D viewer with new mesh");
      console.log("Geometry vertices:", mesh.geometry.attributes.position.count);
      console.log("Material:", mesh.material.type);
      
      // Clone the mesh to avoid sharing references
      const clonedGeometry = mesh.geometry.clone();
      const clonedMaterial = mesh.material.clone();
      
      setLocalMesh({
        geometry: clonedGeometry,
        material: clonedMaterial
      });
    }
  }, [mesh]);

  // Gentle rotation for presentation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
    }
  });

  if (!localMesh) {
    // Show placeholder while waiting for real data
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
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={0.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-10, 5, -5]} intensity={0.3} color="#ffd700" />

      {/* Environment for reflections */}
      <Environment preset="sunset" />

      {/* Ground plane */}
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

      {/* Grid for reference */}
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

      {/* Point cloud (optional visualization) */}
      <PointCloudVisualization points={pointCloud} visible={showPointCloud} />

      {/* Pottery mesh */}
      <PotteryMesh mesh={mesh} />

      {/* Camera controls */}
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

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        shadows
        style={{ width: "100%", height: "100%" }}
        dpr={[1, 2]}
      >
        <PerspectiveCamera
          makeDefault
          position={[8, 6, 8]}
          fov={50}
        />
        
        <Scene mesh={mesh} showPointCloud={showPointCloud} pointCloud={pointCloud} />
      </Canvas>

      {/* Stats overlay */}
      {stats && (
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