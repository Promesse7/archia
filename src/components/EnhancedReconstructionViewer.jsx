// EnhancedReconstructionViewer.jsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ConvexHull } from 'three/examples/jsm/math/ConvexHull.js';
import { PointCloudGenerator } from "../reconstruction/pointCloudGenerator";

// Icon components
const AnnotationIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const MeasureIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const LayersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const AngleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const SelectIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2z" />
  </svg>
);

const CrossSectionIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
  </svg>
);

const ExportIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

export default function EnhancedReconstructionViewer({
  fragments = [],
  activeFragmentIndex = null,
  showPointCloud = true,
  showMesh = true,
  autoRotate = true,
  mesh = null,
  classification = null,
  className = "",
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const pointsRef = useRef([]);
  const meshRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const animationIdRef = useRef(null);

  // Feature states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [measurementMode, setMeasurementMode] = useState(null); // 'distance', 'angle'
  const [showLayers, setShowLayers] = useState({
    original: true,
    reconstruction: true,
    damage: false,
    materials: false
  });
  const [showCrossSection, setShowCrossSection] = useState(false);
  const [crossSectionPlane, setCrossSectionPlane] = useState('X'); // X, Y, Z
  const [selectedGeometry, setSelectedGeometry] = useState(null);
  const [highlightedGeometry, setHighlightedGeometry] = useState(null);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [hoveredObject, setHoveredObject] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [editingAnnotation, setEditingAnnotation] = useState(null);

  // Initialize Three.js scene
  const initScene = useCallback(() => {
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
    camera.position.set(10, 8, 10);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Professional lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(10, 10, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.left = -20;
    keyLight.shadow.camera.right = 20;
    keyLight.shadow.camera.top = 20;
    keyLight.shadow.camera.bottom = -20;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffd700, 0.3);
    fillLight.position.set(-10, 5, -5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x4169e1, 0.2);
    rimLight.position.set(0, -10, 0);
    scene.add(rimLight);

    // Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 3;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI;
    controlsRef.current = controls;

    // Ground reference plane
    const groundGeometry = new THREE.PlaneGeometry(30, 30);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -3;
    ground.receiveShadow = true;
    scene.add(ground);

    // Professional grid
    const gridHelper = new THREE.GridHelper(30, 30, 0x444444, 0x222222);
    gridHelper.position.y = -2.99;
    scene.add(gridHelper);

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Auto-rotate
      if (autoRotate && meshRef.current) {
        meshRef.current.rotation.y += delta * 0.2;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // Mouse interactions for annotations and measurements
    const handleClick = (event) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      if (annotationMode) {
        handleAnnotationPlacement();
      } else if (measurementMode) {
        handleMeasurement();
      } else {
        handleObjectSelection();
      }
    };

    const handleMouseMove = (event) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(scene.children, true);

      setHoveredObject(intersects.length > 0 ? intersects[0].object : null);
    };

    renderer.domElement.addEventListener('click', handleClick);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationIdRef.current);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [autoRotate, annotationMode, measurementMode]);

  // Initialize scene on mount
  useEffect(() => {
    const cleanup = initScene();
    return () => {
      cleanup?.();
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [initScene]);

  // Update fragments point clouds
  useEffect(() => {
    if (!sceneRef.current || !showPointCloud) return;

    // Remove old point clouds
    pointsRef.current.forEach(points => {
      sceneRef.current.remove(points);
      if (points.geometry) points.geometry.dispose();
      if (points.material) points.material.dispose();
    });
    pointsRef.current = [];

    if (fragments.length === 0) return;

    // Add new point clouds
    fragments.forEach((fragment, index) => {
      if (!fragment.pointCloud?.length) return;

      const pointsGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(fragment.pointCloud.flat());
      pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const fragmentId = fragment.id || fragment.timestamp;
      const isActive = fragmentId === activeFragmentIndex;
      const color = isActive ? 0xff6b6b : 0x4ecdc4;
      const size = isActive ? 0.08 : 0.05;

      const pointsMaterial = new THREE.PointsMaterial({
        color,
        size,
        sizeAttenuation: true,
        transparent: true,
        opacity: isActive ? 1.0 : 0.8
      });

      const points = new THREE.Points(pointsGeometry, pointsMaterial);
      points.position.y = 0;
      points.castShadow = true;
      points.userData = { fragmentId };

      sceneRef.current.add(points);
      pointsRef.current.push(points);
    });

    // Update stats
    setStats(prev => ({
      ...prev,
      fragments: fragments.length,
      totalPoints: fragments.reduce((sum, f) => sum + (f.pointCloud?.length || 0), 0)
    }));

  }, [fragments, showPointCloud, activeFragmentIndex]);

  // Update mesh when it changes
  useEffect(() => {
    if (!sceneRef.current || !showMesh) return;

    // Remove old mesh
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      if (meshRef.current.geometry) meshRef.current.geometry.dispose();
      if (meshRef.current.material) {
        if (Array.isArray(meshRef.current.material)) {
          meshRef.current.material.forEach(m => m.dispose());
        } else {
          meshRef.current.material.dispose();
        }
      }
    }

    if (!mesh) {
      setStats(prev => ({ ...prev, vertices: 0, faces: 0, type: "No Mesh" }));
      return;
    }

    try {
      // Clone the mesh to avoid modifying the original
      const meshClone = mesh.clone();

      // Position and scale the mesh
      meshClone.position.set(0, 0, 0);
      meshClone.scale.set(0.5, 0.5, 0.5);
      meshClone.castShadow = true;
      meshClone.receiveShadow = true;

      // Add to scene
      sceneRef.current.add(meshClone);
      meshRef.current = meshClone;

      // Calculate stats
      const geo = meshClone.geometry;
      setStats(prev => ({
        ...prev,
        vertices: geo.attributes?.position?.count || 0,
        faces: geo.index ? geo.index.count / 3 : 0,
        type: "Reconstructed Pottery"
      }));

      // Center the camera on the mesh
      if (cameraRef.current && controlsRef.current) {
        const box = new THREE.Box3().setFromObject(meshClone);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = cameraRef.current.fov * (Math.PI / 180);
        const cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) * 0.8;

        cameraRef.current.position.copy(center);
        cameraRef.current.position.z += cameraDistance;
        cameraRef.current.lookAt(center);

        controlsRef.current.target.copy(center);
        controlsRef.current.update();
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Error rendering mesh:", err);
      setError("Failed to render 3D model");
      setIsLoading(false);
    }
  }, [mesh, showMesh]);

  // Annotation placement
  const handleAnnotationPlacement = useCallback(() => {
    if (!sceneRef.current || !meshRef.current) return;

    const intersects = raycasterRef.current.intersectObject(meshRef.current, true);
    if (intersects.length > 0) {
      const point = intersects[0].point;
      const annotation = {
        id: Date.now(),
        position: point.clone(),
        text: `Annotation ${annotations.length + 1}`,
        typology: '',
        useWear: '',
        date: '',
        notes: ''
      };

      setAnnotations(prev => [...prev, annotation]);
      addToHistory('addAnnotation', annotation);
    }
  }, [annotations.length]);

  // Measurement tools (distance and angle)
  const handleMeasurement = useCallback(() => {
    if (!sceneRef.current) return;

    const intersects = raycasterRef.current.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      const point = intersects[0].point;

      setMeasurements(prev => {
        const newMeasurements = [...prev];

        if (measurementMode === 'distance') {
          if (newMeasurements.length % 2 === 1) {
            // Complete distance measurement
            const lastPoint = newMeasurements[newMeasurements.length - 1];
            const distance = lastPoint.distanceTo(point);
            newMeasurements.push({
              type: 'distance',
              start: lastPoint,
              end: point,
              value: distance
            });
            setMeasurementMode(null);
          } else {
            // Start new distance measurement
            newMeasurements.push(point);
          }
        } else if (measurementMode === 'angle') {
          if (newMeasurements.length % 3 === 2) {
            // Complete angle measurement
            const p1 = newMeasurements[newMeasurements.length - 2];
            const p2 = newMeasurements[newMeasurements.length - 1];
            const v1 = p1.clone().sub(point);
            const v2 = p2.clone().sub(point);
            const angle = v1.angleTo(v2) * (180 / Math.PI);

            newMeasurements.push({
              type: 'angle',
              vertex: point,
              point1: p1,
              point2: p2,
              value: angle
            });
            setMeasurementMode(null);
          } else {
            // Add angle point
            newMeasurements.push(point);
          }
        }

        return newMeasurements;
      });
    }
  }, [measurementMode]);

  // Object selection
  const handleObjectSelection = useCallback(() => {
    if (!sceneRef.current || !meshRef.current) return;

    const intersects = raycasterRef.current.intersectObject(meshRef.current, true);
    if (intersects.length > 0) {
      const object = intersects[0].object;
      setSelectedGeometry(object);

      // Show metadata panel
      console.log('Selected object:', object);
    }
  }, []);

  // History management
  const addToHistory = useCallback((action, data) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ action, data, timestamp: Date.now() });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      // Restore previous state
    }
  }, [historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      // Restore next state
    }
  }, [historyIndex, history.length]);

  // Export functionality
  const exportSnapshot = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataURL = rendererRef.current.domElement.toDataURL('image/png');

    const link = document.createElement('a');
    link.download = `pottery-reconstruction-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  }, []);

  const exportJSON = useCallback(() => {
    const exportData = {
      annotations,
      measurements,
      metadata: {
        classification,
        timestamp: Date.now(),
        version: '1.0'
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `pottery-analysis-${Date.now()}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [annotations, measurements, classification]);

  // Render measurement lines and angles
  useEffect(() => {
    if (!sceneRef.current) return;

    // Clear old measurement visualizations
    const oldVisuals = sceneRef.current.children.filter(child => child.userData.isMeasurement);
    oldVisuals.forEach(viz => sceneRef.current.remove(viz));

    measurements.forEach((measurement, index) => {
      if (measurement.type === 'distance' && measurement.start && measurement.end) {
        // Distance line
        const geometry = new THREE.BufferGeometry().setFromPoints([measurement.start, measurement.end]);
        const material = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 });
        const line = new THREE.Line(geometry, material);
        line.userData.isMeasurement = true;
        sceneRef.current.add(line);

        // End points
        const sphereGeometry = new THREE.SphereGeometry(0.05);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

        const startSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        startSphere.position.copy(measurement.start);
        startSphere.userData.isMeasurement = true;
        sceneRef.current.add(startSphere);

        const endSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        endSphere.position.copy(measurement.end);
        endSphere.userData.isMeasurement = true;
        sceneRef.current.add(endSphere);

      } else if (measurement.type === 'angle' && measurement.vertex && measurement.point1 && measurement.point2) {
        // Angle visualization
        const angleGeometry = new THREE.RingGeometry(0.5, 1, 32, 1, 0, measurement.value * Math.PI / 180);
        const angleMaterial = new THREE.MeshBasicMaterial({
          color: 0xff6600,
          side: THREE.DoubleSide,
          opacity: 0.7,
          transparent: true
        });
        const angleMesh = new THREE.Mesh(angleGeometry, angleMaterial);
        angleMesh.position.copy(measurement.vertex);
        angleMesh.userData.isMeasurement = true;

        // Orient the angle arc
        const v1 = measurement.point1.clone().sub(measurement.vertex).normalize();
        const v2 = measurement.point2.clone().sub(measurement.vertex).normalize();
        const normal = new THREE.Vector3().crossVectors(v1, v2).normalize();
        angleMesh.lookAt(measurement.vertex.clone().add(normal));

        sceneRef.current.add(angleMesh);

        // Angle lines
        const line1Geometry = new THREE.BufferGeometry().setFromPoints([measurement.vertex, measurement.point1]);
        const line2Geometry = new THREE.BufferGeometry().setFromPoints([measurement.vertex, measurement.point2]);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff6600, linewidth: 2 });

        const line1 = new THREE.Line(line1Geometry, lineMaterial);
        const line2 = new THREE.Line(line2Geometry, lineMaterial);
        line1.userData.isMeasurement = true;
        line2.userData.isMeasurement = true;

        sceneRef.current.add(line1);
        sceneRef.current.add(line2);
      }
    });
  }, [measurements]);

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {/* Main viewer */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Professional toolbar */}
      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md border border-zinc-800/50 rounded-lg p-2">
        <div className="flex flex-col gap-2">
          {/* Annotation tools */}
          <button
            onClick={() => setAnnotationMode(!annotationMode)}
            className={`p-2 rounded transition-colors ${annotationMode ? 'bg-amber-500/20 text-amber-400' : 'text-zinc-400 hover:text-white'
              }`}
            title="Toggle annotation mode"
          >
            <AnnotationIcon />
          </button>

          {/* Measurement tools */}
          <div className="flex gap-1">
            <button
              onClick={() => setMeasurementMode(measurementMode === 'distance' ? null : 'distance')}
              className={`p-2 rounded transition-colors ${measurementMode === 'distance' ? 'bg-green-500/20 text-green-400' : 'text-zinc-400 hover:text-white'
                }`}
              title="Distance measurement"
            >
              <MeasureIcon />
            </button>
            <button
              onClick={() => setMeasurementMode(measurementMode === 'angle' ? null : 'angle')}
              className={`p-2 rounded transition-colors ${measurementMode === 'angle' ? 'bg-orange-500/20 text-orange-400' : 'text-zinc-400 hover:text-white'
                }`}
              title="Angle measurement"
            >
              <AngleIcon />
            </button>
          </div>

          {/* Selection tool */}
          <button
            className="p-2 rounded text-zinc-400 hover:text-white transition-colors"
            title="Select geometry"
          >
            <SelectIcon />
          </button>

          {/* Layer toggles */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">Layers:</label>
            {Object.entries(showLayers).map(([layer, visible]) => (
              <button
                key={layer}
                onClick={() => setShowLayers(prev => ({ ...prev, [layer]: !visible }))}
                className={`p-1 rounded text-xs transition-colors ${visible ? 'bg-blue-500/20 text-blue-400' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
              >
                {layer.charAt(0).toUpperCase() + layer.slice(1)}
              </button>
            ))}
          </div>

          {/* Cross-section */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">Section:</label>
            {['X', 'Y', 'Z'].map(plane => (
              <button
                key={plane}
                onClick={() => {
                  setShowCrossSection(true);
                  setCrossSectionPlane(plane);
                }}
                className={`p-1 rounded text-xs transition-colors ${showCrossSection && crossSectionPlane === plane
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                  }`}
              >
                {plane}-Plane
              </button>
            ))}
          </div>

          {/* Export */}
          <div className="flex gap-1">
            <button
              onClick={exportSnapshot}
              className="p-2 rounded text-zinc-400 hover:text-white transition-colors"
              title="Export image"
            >
              <ExportIcon />
            </button>
            <button
              onClick={exportJSON}
              className="p-2 rounded text-zinc-400 hover:text-white transition-colors"
              title="Export data"
            >
              <ExportIcon />
            </button>
          </div>

          {/* Undo/Redo */}
          <div className="flex gap-1">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 rounded text-zinc-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo"
            >
              ←
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded text-zinc-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Metadata panel */}
      {hoveredObject && (
        <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md border border-zinc-800/50 rounded-lg p-3 max-w-xs">
          <div className="text-white text-sm">
            <div className="font-semibold mb-1">Object Properties</div>
            <div className="text-zinc-400 text-xs space-y-1">
              <div>Type: {hoveredObject.type || 'Mesh'}</div>
              <div>Vertices: {hoveredObject.geometry?.attributes.position?.count || 0}</div>
              {classification && (
                <>
                  <div>Typology: {classification.fragmentType}</div>
                  <div>Confidence: {(classification.confidence * 100).toFixed(1)}%</div>
                  <div>Heritage: Protected under Law 28/2016</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Annotations display */}
      {annotations.map(annotation => (
        <div
          key={annotation.id}
          className="absolute bg-amber-500/90 text-white text-xs px-2 py-1 rounded pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          {annotation.text}
        </div>
      ))}

      {/* Measurements display */}
      {measurements.map((measurement, index) => {
        if (measurement.type === 'distance') {
          return (
            <div
              key={index}
              className="absolute bg-green-500/90 text-white text-xs px-2 py-1 rounded"
              style={{
                left: '50%',
                top: '40%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              {(measurement.value * 100).toFixed(1)}cm
            </div>
          );
        } else if (measurement.type === 'angle') {
          return (
            <div
              key={index}
              className="absolute bg-orange-500/90 text-white text-xs px-2 py-1 rounded"
              style={{
                left: '50%',
                top: '30%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              {measurement.value.toFixed(1)}°
            </div>
          );
        }
        return null;
      })}

      {/* Stats overlay */}
      {stats && (
        <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md border border-zinc-800/50 rounded-lg p-3 text-xs font-mono text-white">
          <div className="text-amber-400 font-bold mb-1">{stats.type}</div>
          <div>Vertices: {stats.vertices.toLocaleString()}</div>
          <div>Faces: {Math.floor(stats.faces).toLocaleString()}</div>
          {stats.fragments > 0 && <div>Fragments: {stats.fragments}</div>}
          {stats.totalPoints > 0 && <div>Points: {stats.totalPoints.toLocaleString()}</div>}
          {annotations.length > 0 && <div>Annotations: {annotations.length}</div>}
          {measurements.length > 0 && (
            <div>
              Measurements: {
                Math.floor(measurements.filter(m => m.type === 'distance').length) +
                Math.floor(measurements.filter(m => m.type === 'angle').length)
              }
            </div>
          )}
          {selectedGeometry && <div className="text-green-400">Geometry Selected</div>}
        </div>
      )}

      {/* Mode indicators */}
      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md border border-zinc-800/50 rounded-lg p-2">
        <div className="flex flex-col gap-1 text-xs">
          {annotationMode && (
            <div className="text-amber-400 font-semibold">ANNOTATION MODE</div>
          )}
          {measurementMode && (
            <div className="text-green-400 font-semibold">
              {measurementMode.toUpperCase()} MEASUREMENT
            </div>
          )}
          {showCrossSection && (
            <div className="text-purple-400 font-semibold">
              {crossSectionPlane}-PLANE SECTION
            </div>
          )}
          {selectedGeometry && (
            <div className="text-blue-400 font-semibold">GEOMETRY SELECTED</div>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white text-center">
            <div className="inline-block w-8 h-8 border-4 border-t-amber-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-2"></div>
            <p>Loading 3D model...</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-2.5 left-2.5 bg-red-500/10 border border-red-400 text-red-400 p-2.5 rounded z-10 max-w-[300px] text-sm">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!mesh && fragments.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <div className="text-center p-4">
            <div className="text-4xl mb-2">🏺</div>
            <p className="font-medium">No fragments available</p>
            <p className="text-sm mt-1">Capture or upload fragments to begin reconstruction</p>
          </div>
        </div>
      )}
    </div>
  );
}