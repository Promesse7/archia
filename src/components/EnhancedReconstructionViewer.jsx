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

      if (!animationIdRef.current) return;

      if (!mesh) {
        setStats(prev => ({ ...prev, vertices: 0, faces: 0, type: "No Mesh" }));
        return;
      }

      try {
        // Remove old mesh
        if (meshRef.current) {
          sceneRef.current.remove(meshRef.current);

          if (meshRef.current.geometry) {
            meshRef.current.geometry.dispose();
          }

          if (meshRef.current.material) {
            if (Array.isArray(meshRef.current.material)) {
              meshRef.current.material.forEach(m => m.dispose());
            } else {
              meshRef.current.material.dispose();
            }
          }
        }

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
    };
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

  // Loading state
  if (isLoading) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-zinc-900 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading reconstruction viewer...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-zinc-900 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className={`relative w-full h-full bg-zinc-900 ${className}`}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Professional toolbar */}
      <div className="absolute top-4 left-4 bg-zinc-900/90 backdrop-blur-sm rounded-lg p-2 shadow-xl border border-zinc-700">
        <div className="flex flex-col space-y-2">
          {/* Annotation tools */}
          <div className="flex space-x-1">
            <button
              onClick={() => setAnnotationMode(!annotationMode)}
              className={`p-2 rounded transition-colors ${annotationMode ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
                }`}
              title="Toggle Annotation Mode"
            >
              <AnnotationIcon />
            </button>
          </div>

          {/* Measurement tools */}
          <div className="flex space-x-1">
            <button
              onClick={() => setMeasurementMode(measurementMode === 'distance' ? null : 'distance')}
              className={`p-2 rounded transition-colors ${measurementMode === 'distance' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
                }`}
              title="Distance Measurement"
            >
              <MeasureIcon />
            </button>
            <button
              onClick={() => setMeasurementMode(measurementMode === 'angle' ? null : 'angle')}
              className={`p-2 rounded transition-colors ${measurementMode === 'angle' ? 'bg-green-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
                }`}
              title="Angle Measurement"
            >
              <AngleIcon />
            </button>
          </div>

          {/* Export tools */}
          <div className="flex space-x-1">
            <button
              onClick={exportSnapshot}
              className="p-2 rounded text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
              title="Export Snapshot"
            >
              <ExportIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Measurement mode indicator */}
      {measurementMode && (
        <div className="absolute bottom-4 left-4 bg-zinc-900/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-zinc-700">
          <p className="text-sm text-amber-400">
            {measurementMode === 'distance' ? 'Click to set distance points' : 'Click to set angle points'}
          </p>
        </div>
      )}

      {/* Annotation mode indicator */}
      {annotationMode && (
        <div className="absolute bottom-4 left-4 bg-zinc-900/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-zinc-700">
          <p className="text-sm text-amber-400">Click on model to add annotation</p>
        </div>
      )}

      {/* Hover info */}
      {hoveredObject && (
        <div className="absolute bottom-4 right-4 bg-zinc-900/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-zinc-700">
          <p className="text-sm text-zinc-400">
            {hoveredObject.userData?.fragmentId ? `Fragment: ${hoveredObject.userData.fragmentId}` : '3D Object'}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!mesh && fragments.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
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