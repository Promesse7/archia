import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { cn } from '../../utils/cn';

export function ArtifactViewer({ artifactId, highlightedRegions = [], onRegionHover }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const meshRef = useRef(null);
  const controlsRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredRegion, setHoveredRegion] = useState(null);

  // Initialize 3D scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(8, 6, 8);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(5, 10, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    scene.add(keyLight);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a,
      roughness: 0.9
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Create mock pottery mesh
    const geometry = new THREE.CylinderGeometry(2, 3, 4, 32);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x8B4513,
      roughness: 0.7,
      metalness: 0.1
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    meshRef.current = mesh;
    scene.add(mesh);

    // Highlight regions
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6b35,
      transparent: true,
      opacity: 0.3
    });

    highlightedRegions.forEach((regionId, index) => {
      const highlightGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial);
      highlightMesh.position.set(
        Math.sin(index) * 2.5,
        Math.random() * 2,
        Math.cos(index) * 2.5
      );
      highlightMesh.userData = { regionId, isHighlight: true };
      mesh.add(highlightMesh);
    });

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (meshRef.current) {
        meshRef.current.rotation.y += 0.005;
      }
      
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    setIsLoading(false);

    // Handle resize
    const handleResize = () => {
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Update highlights when regions change
  useEffect(() => {
    if (!meshRef.current) return;

    // Remove old highlights
    const oldHighlights = meshRef.current.children.filter(child => 
      child.userData?.isHighlight
    );
    oldHighlights.forEach(child => meshRef.current.remove(child));

    // Add new highlights
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6b35,
      transparent: true,
      opacity: 0.3
    });

    highlightedRegions.forEach((regionId, index) => {
      const highlightGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial);
      highlightMesh.position.set(
        Math.sin(index) * 2.5,
        Math.random() * 2,
        Math.cos(index) * 2.5
      );
      highlightMesh.userData = { regionId, isHighlight: true };
      meshRef.current.add(highlightMesh);
    });
  }, [highlightedRegions]);

  return (
    <div className="relative w-full h-full bg-zinc-900">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-2"></div>
            <p className="text-sm text-zinc-400">Loading artifact...</p>
          </div>
        </div>
      )}

      {/* Artifact Info Overlay */}
      <div className="absolute top-4 right-4 bg-zinc-900/90 backdrop-blur-sm rounded-lg p-3 border border-zinc-700 max-w-xs">
        <h4 className="text-amber-400 font-semibold text-sm mb-2">Amphora Fragment</h4>
        <div className="space-y-1 text-xs text-zinc-300">
          <div>Era: 12th-14th Century CE</div>
          <div>Origin: Mediterranean</div>
          <div>Confidence: 87%</div>
        </div>
      </div>
    </div>
  );
}
