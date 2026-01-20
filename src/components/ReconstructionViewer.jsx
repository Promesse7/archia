import React, { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Environment, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

function PotteryMesh({ mesh }) {
  const meshRef = useRef();

  useEffect(() => {
    if (mesh && meshRef.current) {
      // Copy geometry and material from the provided mesh
      meshRef.current.geometry = mesh.geometry;
      meshRef.current.material = mesh.material;
    }
  }, [mesh]);

  // Gentle rotation for presentation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      {/* Default geometry before mesh is loaded */}
      {!mesh && (
        <>
          <cylinderGeometry args={[2, 2, 5, 32]} />
          <meshStandardMaterial 
            color="#c2a070" 
            metalness={0.1} 
            roughness={0.8} 
          />
        </>
      )}
    </mesh>
  );
}

function Scene({ mesh }) {
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

export default function ReconstructionViewer({ mesh }) {
  return (
    <Canvas
      shadows
      style={{ width: "100%", height: "100%" }}
      dpr={[1, 2]} // Device pixel ratio
    >
      <PerspectiveCamera
        makeDefault
        position={[8, 6, 8]}
        fov={50}
      />
      
      <Scene mesh={mesh} />
    </Canvas>
  );
}