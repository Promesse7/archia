import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { ConvexHull } from 'three/examples/jsm/math/ConvexHull.js';
import { PointCloudGenerator } from "../reconstruction/pointCloudGenerator";

export default function EnhancedReconstructionViewer({
  classification = null,
  showPointCloud = true,
  showMesh = true,
  autoRotate = true,
  mesh = null, 
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const pointsRef = useRef(null);
  const meshRef = useRef(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(8, 6, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
 
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffd700, 0.4);
    pointLight.position.set(-10, 5, -5);
    scene.add(pointLight);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.8,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -3;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid
    const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
    gridHelper.position.y = -2.99;
    scene.add(gridHelper);

    // Animation loop
    let animationId = null;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Auto-rotate
      if (autoRotate) {
        if (pointsRef.current) {
          pointsRef.current.rotation.y += 0.002;
        }
        if (meshRef.current) {
          meshRef.current.rotation.y += 0.002;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // Mouse controls (simple orbit)
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    renderer.domElement.addEventListener("mousedown", (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    renderer.domElement.addEventListener("mousemove", (e) => {
      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        if (pointsRef.current) {
          pointsRef.current.rotation.y += deltaX * 0.01;
          pointsRef.current.rotation.x += deltaY * 0.01;
        }
        if (meshRef.current) {
          meshRef.current.rotation.y += deltaX * 0.01;
          meshRef.current.rotation.x += deltaY * 0.01;
        }

        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });

    renderer.domElement.addEventListener("mouseup", () => {
      isDragging = false;
    });

    renderer.domElement.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomSpeed = 0.1;
      camera.position.z += e.deltaY > 0 ? zoomSpeed : -zoomSpeed;
      camera.position.z = Math.max(1, Math.min(100, camera.position.z));
    });

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [autoRotate]);

  // Update point cloud when data changes

  // Update mesh when data changes
useEffect(() => {
  if (!sceneRef.current || !showMesh) return;

  // Remove old mesh
  if (meshRef.current) {
    sceneRef.current.remove(meshRef.current);
    meshRef.current.geometry?.dispose();
    meshRef.current.material?.dispose();
    console.log("Removed old mesh from scene");
  }

  if (!mesh) {
    console.log("No mesh provided to render");
    return;
  }

  console.log("Adding mesh to scene:", mesh);
  console.log("Mesh geometry:", mesh.geometry);
  console.log("Mesh material:", mesh.material);
  
  // Position and scale the mesh for visibility
  mesh.position.set(0, 0, 0);  // Center the mesh
  mesh.scale.set(0.5, 0.5, 0.5);  // Scale down if too large
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  
  // Calculate bounding box for debugging
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  console.log("Mesh bounding box:", { size, center });
  
  sceneRef.current.add(mesh);
  meshRef.current = mesh;

  const geo = mesh.geometry;
  setStats({
    vertices: geo.attributes.position?.count || 0,
    faces: geo.index ? geo.index.count / 3 : 0,
    type: "Rebuilt Pottery Mesh"
  });

  console.log("Mesh successfully added to scene");
}, [mesh, showMesh]);

return (
  <div
    ref={containerRef}
    className="relative w-full h-full bg-background rounded-lg overflow-hidden"
  >
    {error && (
      <div className="absolute top-2.5 left-2.5 bg-red-500/10 border border-red-400 text-red-400 p-2.5 rounded z-10 max-w-[200px] text-xs">
        {error}
      </div>
    )}

    {!mesh && (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-muted text-center pointer-events-none">
        <div className="text-lg mb-2.5">
          Rebuild to show pottery
        </div>
      </div>
    )}

    {stats && (
      <div
        className="absolute bottom-2.5 left-2.5 bg-black/70 text-white p-2.5 rounded z-5 text-xs font-mono"
      >
        <div className="mb-1 text-orange-400 font-bold">
          {stats.type}
        </div>
        {stats.points && <div>Points: {stats.points.toLocaleString()}</div>}
        {stats.vertices && <div>Vertices: {stats.vertices.toLocaleString()}</div>}
        {stats.faces && <div>Faces: {Math.floor(stats.faces).toLocaleString()}</div>}
      </div>
    )}

    {classification && (
      <div
        className="absolute top-2.5 right-2.5 bg-black/70 text-white p-2.5 rounded z-5 text-xs"
      >
        <div className="mb-1 text-green-500 font-bold">
          {classification.fragmentType?.toUpperCase()}
        </div>
        <div className="text-gray-400">
          Confidence: {(classification.confidence * 100).toFixed(1)}%
        </div>
        <div className="text-gray-400 text-xs mt-1">
          {classification.curvature}
        </div>
      </div>
    )}
  </div>
);