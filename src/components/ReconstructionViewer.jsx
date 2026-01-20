import React, { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { buildPotteryMesh } from "../reconstruction/potteryRebuilder";

export default function ReconstructionViewer() {
  const meshRef = useRef();

  return (
    <Canvas camera={{ position: [5, 5, 10], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <primitive object={buildPotteryMesh()} ref={meshRef} />
      <OrbitControls />
    </Canvas>
  );
}
