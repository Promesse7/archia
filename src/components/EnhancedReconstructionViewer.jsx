import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { ConvexHull } from 'three/examples/jsm/math/ConvexHull.js';
import { PointCloudGenerator } from "../reconstruction/pointCloudGenerator";

export default function EnhancedReconstructionViewer({
  pointCloudData = null,
  depthMap = null,
  classification = null,
  showPointCloud = true,
  showMesh = true,
  autoRotate = true,
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
  useEffect(() => {
    if (!pointCloudData || !sceneRef.current) return;

    try {
      // Remove old points
      if (pointsRef.current) {
        sceneRef.current.remove(pointsRef.current);
        pointsRef.current.geometry.dispose();
        pointsRef.current.material.dispose();
      }

      if (!showPointCloud) return;

      // Create new point cloud
      const geometry = PointCloudGenerator.pointsToGeometry(
        pointCloudData
      );
      const points = PointCloudGenerator.geometryToPoints(geometry);
      pointsRef.current = points;
      sceneRef.current.add(points);

      // Update stats
      setStats({
        points: pointCloudData.points.length,
        type: "Point Cloud",
      });
    } catch (err) {
      console.error("Failed to update point cloud:", err);
      setError(err.message);
    }
  }, [pointCloudData, showPointCloud]);

  // Update mesh when data changes
useEffect(() => {
  if (!pointCloudData || !sceneRef.current || !showMesh) return;

  try {
    // Remove old mesh
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      meshRef.current.geometry?.dispose();
      meshRef.current.material?.dispose();
    }

    // Add this import at the top of the file:
    // import { ConvexHull } from 'three/examples/jsm/math/ConvexHull.js';

    const hull = new ConvexHull();
    const threePoints = pointCloudData.points.map(p => 
      new THREE.Vector3(p.x, p.y, p.z)
    );
    hull.setFromPoints(threePoints);

    const vertices = [];
    hull.faces.forEach(face => {
      const a = face.a;
      const b = face.b;
      const c = face.c;
      vertices.push(
        a.x, a.y, a.z,
        b.x, b.y, b.z,
        c.x, c.y, c.z
      );
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3)
    );

    const material = new THREE.MeshStandardMaterial({
      color: 0xc2a070,
      side: THREE.DoubleSide,
      roughness: 0.7,
      metalness: 0.1
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    sceneRef.current.add(mesh);
    meshRef.current = mesh;

    setStats({
      vertices: vertices.length / 3,
      faces: hull.faces.length,
      type: "Convex Hull Mesh"
    });
  } catch (err) {
    console.error("Failed to create mesh:", err);
  }
}, [pointCloudData, showMesh]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: "#0a0a0a",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      {error && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            backgroundColor: "rgba(255, 0, 0, 0.1)",
            border: "1px solid #ff6b6b",
            color: "#ff6b6b",
            padding: "10px",
            borderRadius: "4px",
            zIndex: 10,
            maxWidth: "200px",
            fontSize: "0.85em",
          }}
        >
          {error}
        </div>
      )}

      {!pointCloudData && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#666",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontSize: "1.2em", marginBottom: "10px" }}>
            🎨 Capture fragments to begin
          </div>
          <div style={{ fontSize: "0.9em" }}>Point cloud will appear here</div>
        </div>
      )}

      {stats && (
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            left: "10px",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: "#fff",
            padding: "12px",
            borderRadius: "4px",
            fontSize: "0.8em",
            fontFamily: "monospace",
            zIndex: 5,
          }}
        >
          <div style={{ marginBottom: "4px", color: "#c2a070", fontWeight: "bold" }}>
            {stats.type}
          </div>
          {stats.points && <div>Points: {stats.points.toLocaleString()}</div>}
          {stats.vertices && <div>Vertices: {stats.vertices.toLocaleString()}</div>}
          {stats.faces && <div>Faces: {Math.floor(stats.faces).toLocaleString()}</div>}
        </div>
      )}

      {classification && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: "#fff",
            padding: "12px",
            borderRadius: "4px",
            fontSize: "0.85em",
            zIndex: 5,
          }}
        >
          <div style={{ marginBottom: "4px", color: "#4caf50", fontWeight: "bold" }}>
            {classification.fragmentType?.toUpperCase()}
          </div>
          <div style={{ color: "#aaa" }}>
            Confidence: {(classification.confidence * 100).toFixed(1)}%
          </div>
          <div style={{ color: "#aaa", fontSize: "0.8em", marginTop: "4px" }}>
            {classification.curvature}
          </div>
        </div>
      )}
    </div>
  );
}