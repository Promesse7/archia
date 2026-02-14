// EnhancedReconstructionViewer.jsx - Scientific Artifact Visualization System
import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ConvexHull } from 'three/examples/jsm/math/ConvexHull.js';
import { PointCloudGenerator } from "../reconstruction/pointCloudGenerator";
import {
  createClayMaterial,
  createStructuralAnalysisMaterial,
  createThicknessHeatmapMaterial,
  computeThicknessData,
  createConfidenceMaterial,
  createWireframeOverlay
} from "../utils/clayShaders";
import {
  detectSymmetryAxis,
  detectDamage,
  calculateMeshStats,
  generateConfidenceData
} from "../utils/meshAnalysis";

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

const EnhancedReconstructionViewer = React.memo(function EnhancedReconstructionViewer({
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

  // Use refs for values that don't need to trigger re-renders
  const isReconstructingRef = useRef(false);
  const lastMeshRef = useRef(null);
  const localShowPointCloudRef = useRef(showPointCloud);
  const localShowMeshRef = useRef(showMesh);
  const animationIdRef = useRef(null);
  const isProcessingMeshRef = useRef(false);

  // Memoize raycaster to prevent recreation on every render
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);

  // View state management - only keep states that need to trigger re-renders
  const [isLoading, setIsLoading] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
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

  // Scientific visualization modes
  const [visualizationMode, setVisualizationMode] = useState('clay'); // 'clay', 'structural', 'thickness', 'confidence'
  const [showWireframe, setShowWireframe] = useState(false);
  const [showSymmetryAxis, setShowSymmetryAxis] = useState(false);
  const [showDamage, setShowDamage] = useState(false);
  const [morphTimeline, setMorphTimeline] = useState(1.0); // 0.0 to 1.0
  const [meshAnalysis, setMeshAnalysis] = useState(null);
  const [symmetryData, setSymmetryData] = useState(null);
  const [damageData, setDamageData] = useState(null);
  const [thicknessData, setThicknessData] = useState(null);
  const [confidenceData, setConfidenceData] = useState(null);

  // UI state for toggle buttons (minimal re-render impact)
  const [uiShowMesh, setUiShowMesh] = useState(showMesh);
  const [uiShowPointCloud, setUiShowPointCloud] = useState(showPointCloud);

  // Refs for visualization overlays
  const wireframeRef = useRef(null);
  const symmetryAxisRef = useRef(null);
  const damageVisualizationRef = useRef([]);

  // Update refs when props change
  useEffect(() => {
    localShowPointCloudRef.current = showPointCloud;
    localShowMeshRef.current = showMesh;
  }, [showPointCloud, showMesh]);

  // Optimized setters that update refs and trigger minimal re-renders
  const updateLocalShowPointCloud = useCallback((value) => {
    localShowPointCloudRef.current = value;
    setUiShowPointCloud(value); // Update UI state
    // Update point cloud visibility directly without state change
    if (pointsRef.current && pointsRef.current.length > 0) {
      pointsRef.current.forEach(point => {
        if (point.visible !== undefined) {
          point.visible = value;
        }
      });
    }
  }, []);

  const updateLocalShowMesh = useCallback((value) => {
    localShowMeshRef.current = value;
    setUiShowMesh(value); // Update UI state
    // Update mesh visibility directly without state change
    if (meshRef.current) {
      meshRef.current.visible = value;
    }
  }, []);

  // Annotation placement
  const handleAnnotationPlacement = useCallback(() => {
    if (!sceneRef.current || !meshRef.current) return;

    const intersects = raycaster.intersectObject(meshRef.current, true);
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
      if (addToHistory) {
        addToHistory('addAnnotation', annotation);
      }
    }
  }, [annotations.length, raycaster]);

  // Measurement tools (distance and angle)
  const handleMeasurement = useCallback(() => {
    if (!sceneRef.current) return;

    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
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
  }, [measurementMode, raycaster]);

  // Object selection
  const handleObjectSelection = useCallback(() => {
    if (!sceneRef.current || !meshRef.current) return;

    const intersects = raycaster.intersectObject(meshRef.current, true);
    if (intersects.length > 0) {
      const object = intersects[0].object;
      setSelectedGeometry(object);
      console.log('Selected object:', object);
    }
  }, [raycaster]);

  // Initialize Three.js scene
  const initScene = useCallback(() => {
    if (!containerRef.current) return null;

    // Reset scene ready state
    setSceneReady(false);

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
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Professional lighting setup – key light casts visible shadows
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(8, 12, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 80;
    keyLight.shadow.camera.left = -20;
    keyLight.shadow.camera.right = 20;
    keyLight.shadow.camera.top = 20;
    keyLight.shadow.camera.bottom = -20;
    keyLight.shadow.bias = -0.0002;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffd4a3, 0.4);
    rimLight.position.set(-6, 6, -6);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.25);
    fillLight.position.set(0, 4, 10);
    scene.add(fillLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI;
    controlsRef.current = controls;

    // Ground plane – receives shadows and defines floor
    const groundGeometry = new THREE.PlaneGeometry(40, 40, 1, 1);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x252525,
      roughness: 0.95,
      metalness: 0.05,
      envMapIntensity: 0.2,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1; // Lowered to ensure mesh sits on top
    ground.receiveShadow = true;
    ground.name = 'ground';
    scene.add(ground);

    // Grid helper for reference (above ground, no shadow)
    const gridHelper = new THREE.GridHelper(40, 40, 0x333333, 0x222222);
    gridHelper.position.y = -0.99; // Just above ground plane
    gridHelper.material.opacity = 0.4;
    gridHelper.material.transparent = true;
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

    // Scene is now ready
    setSceneReady(true);
    console.log("EnhancedReconstructionViewer: Scene initialized and ready");

    // Mouse interactions for annotations and measurements
    const handleClick = (event) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

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
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      setHoveredObject(intersects.length > 0 ? intersects[0].object : null);
    };

    renderer.domElement.addEventListener('click', handleClick);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    // Handle resize
    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Return cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);

      // Cancel animation frame
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }

      // Dispose of all Three.js resources
      if (sceneRef.current) {
        // Recursively dispose of all objects in the scene
        const disposeObject = (obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(material => material.dispose());
            } else {
              obj.material.dispose();
            }
          }
          if (obj.texture) obj.texture.dispose();
        };

        sceneRef.current.traverse(disposeObject);
        sceneRef.current.clear();
      }

      // Dispose renderer
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }

      // Remove DOM element
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [autoRotate, annotationMode, measurementMode, handleAnnotationPlacement, handleMeasurement, handleObjectSelection]);

  // Initialize scene on mount
  useEffect(() => {
    let cleanup = null;

    // Wait for container to be ready using requestAnimationFrame
    const init = () => {
      if (!containerRef.current) {
        console.log("EnhancedReconstructionViewer: Container not ready, retrying...");
        requestAnimationFrame(init);
        return;
      }

      console.log("EnhancedReconstructionViewer: Container ready, initializing scene...");
      cleanup = initScene();
    };

    requestAnimationFrame(init);

    // Return cleanup function
    return () => {
      if (cleanup) cleanup();
    };
  }, [initScene]);

  // Handle mesh rendering when mesh prop changes or scene becomes ready
  useEffect(() => {
    // Prevent infinite loops
    if (isProcessingMeshRef.current) {
      console.log("EnhancedReconstructionViewer: Already processing mesh, skipping");
      return;
    }

    console.log("EnhancedReconstructionViewer: Mesh effect triggered, mesh:", mesh ? "present" : "null", "sceneReady:", sceneReady);

    // Ensure scene is initialized before trying to render mesh
    if (!sceneReady || !sceneRef.current) {
      console.log("EnhancedReconstructionViewer: Scene not ready, skipping mesh render", { sceneReady, hasSceneRef: !!sceneRef.current });
      return;
    }

    if (!mesh) {
      console.log("EnhancedReconstructionViewer: No mesh, setting empty stats");
      setStats(prev => ({ ...prev, vertices: 0, faces: 0, type: "No Mesh" }));
      setIsLoading(false);
      isProcessingMeshRef.current = false;
      return;
    }

    try {
      console.log("EnhancedReconstructionViewer: Starting mesh rendering...");
      isProcessingMeshRef.current = true;

      // Remove old mesh
      if (meshRef.current) {
        console.log("Removing old mesh");
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

      // Clean up any orphaned ground planes or grids (safety check)
      const groundObjects = sceneRef.current.children.filter(child =>
        child.name === 'ground' || child.type === 'GridHelper'
      );
      if (groundObjects.length > 2) { // Should only have 1 ground + 1 grid
        console.warn("Found duplicate ground objects, cleaning up:", groundObjects.length - 2);
        groundObjects.slice(2).forEach(obj => {
          sceneRef.current.remove(obj);
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
        });
      }

      // Clone the mesh to avoid modifying the original
      console.log("EnhancedReconstructionViewer: Cloning mesh...");

      let meshClone;
      try {
        // Validate mesh before cloning
        if (!mesh || !mesh.geometry) {
          throw new Error("Invalid mesh: mesh or geometry is missing");
        }

        meshClone = mesh.clone();
        console.log("EnhancedReconstructionViewer: Mesh cloned:", meshClone);
      } catch (cloneError) {
        console.error("EnhancedReconstructionViewer: Failed to clone mesh:", cloneError);
        setError("Failed to process 3D mesh data");
        setIsLoading(false);
        return;
      }

      // Scale and ensure geometry has correct normals for shading
      meshClone.scale.set(0.5, 0.5, 0.5);
      meshClone.geometry.computeVertexNormals();
      meshClone.position.set(0, 0, 0);

      // Sit mesh on ground: align bottom of bbox with ground plane (y = -1)
      const box = new THREE.Box3().setFromObject(meshClone);
      const minY = box.min.y;
      const maxY = box.max.y;
      const groundY = -1;
      meshClone.position.y = groundY - minY;

      console.log("Mesh positioning:", {
        minY,
        maxY,
        groundY,
        finalY: meshClone.position.y,
        height: maxY - minY
      });

      meshClone.castShadow = true;
      meshClone.receiveShadow = true;
      meshClone.updateMatrixWorld(true);

      // Perform scientific analysis
      console.log("EnhancedReconstructionViewer: Performing mesh analysis...");
      const analysis = calculateMeshStats(meshClone);
      setMeshAnalysis(analysis);

      const symmetry = detectSymmetryAxis(meshClone);
      setSymmetryData(symmetry);

      const damage = detectDamage(meshClone);
      setDamageData(damage);

      // Compute thickness data
      const thickness = computeThicknessData(meshClone);
      setThicknessData(thickness);

      // Generate confidence data
      const confidence = generateConfidenceData(meshClone, fragments);
      setConfidenceData(confidence);

      // Apply visualization material based on mode
      let material;
      const geometry = meshClone.geometry.clone();

      switch (visualizationMode) {
        case 'clay':
          material = createClayMaterial();
          break;
        case 'structural':
          material = createStructuralAnalysisMaterial(geometry);
          meshClone.geometry = geometry;
          break;
        case 'thickness':
          material = createThicknessHeatmapMaterial(geometry, thickness);
          meshClone.geometry = geometry;
          break;
        case 'confidence':
          material = createConfidenceMaterial(geometry, confidence);
          meshClone.geometry = geometry;
          break;
        default:
          material = createClayMaterial();
      }

      meshClone.material = material;

      // Add wireframe overlay if enabled
      if (showWireframe) {
        const wireframeMaterial = createWireframeOverlay(meshClone.geometry);
        const wireframeMesh = new THREE.Mesh(meshClone.geometry, wireframeMaterial);
        wireframeMesh.position.copy(meshClone.position);
        wireframeMesh.scale.copy(meshClone.scale);
        wireframeRef.current = wireframeMesh;
        meshClone.add(wireframeMesh);
      }

      // Add to scene with error handling
      console.log("EnhancedReconstructionViewer: Adding mesh to scene...");
      try {
        if (!sceneRef.current) {
          throw new Error("Scene is not initialized");
        }

        sceneRef.current.add(meshClone);
        meshRef.current = meshClone;
        console.log("EnhancedReconstructionViewer: Mesh added to scene");
      } catch (sceneError) {
        console.error("EnhancedReconstructionViewer: Failed to add mesh to scene:", sceneError);
        setError("Failed to display 3D mesh");
        setIsLoading(false);
        return;
      }

      // Set visibility based on ref values
      meshClone.visible = localShowMeshRef.current;

      // Calculate enhanced stats
      const geo = meshClone.geometry;
      setStats(prev => ({
        ...prev,
        vertices: geo.attributes?.position?.count || 0,
        faces: geo.index ? geo.index.count / 3 : 0,
        type: "Reconstructed Pottery",
        volume: analysis?.volume || 0,
        surfaceArea: analysis?.surfaceArea || 0,
        avgThickness: analysis?.avgThickness || 0,
        symmetryError: symmetry?.error || 0,
        damageSeverity: damage?.severity || 0
      }));

      // Center the camera on the mesh
      if (cameraRef.current && controlsRef.current) {
        console.log("EnhancedReconstructionViewer: Centering camera on mesh...");
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
        console.log("EnhancedReconstructionViewer: Camera positioned, setting loading to false");
      }

      setIsLoading(false);
      console.log("EnhancedReconstructionViewer: Loading set to false");
    } catch (err) {
      console.error("Error rendering mesh:", err);
      setError("Failed to render 3D model");
      setIsLoading(false);
    } finally {
      isProcessingMeshRef.current = false;
    }
  }, [mesh, sceneReady, visualizationMode, showWireframe]);

  // History management
  const addToHistory = useCallback((action, data) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ action, data, timestamp: Date.now() });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Update visualization mode
  useEffect(() => {
    if (!meshRef.current || !sceneRef.current) return;

    const mesh = meshRef.current;
    const geometry = mesh.geometry.clone();
    let material;

    switch (visualizationMode) {
      case 'clay':
        material = createClayMaterial();
        break;
      case 'structural':
        material = createStructuralAnalysisMaterial(geometry);
        mesh.geometry = geometry;
        break;
      case 'thickness':
        if (thicknessData) {
          material = createThicknessHeatmapMaterial(geometry, thicknessData);
          mesh.geometry = geometry;
        } else {
          material = createClayMaterial();
        }
        break;
      case 'confidence':
        if (confidenceData) {
          material = createConfidenceMaterial(geometry, confidenceData);
          mesh.geometry = geometry;
        } else {
          material = createClayMaterial();
        }
        break;
      default:
        material = createClayMaterial();
    }

    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    }

    mesh.material = material;
  }, [visualizationMode, thicknessData, confidenceData]);

  // Update wireframe overlay
  useEffect(() => {
    if (!meshRef.current) return;

    if (showWireframe && !wireframeRef.current) {
      const wireframeMaterial = createWireframeOverlay(meshRef.current.geometry);
      const wireframeMesh = new THREE.Mesh(meshRef.current.geometry, wireframeMaterial);
      wireframeMesh.position.copy(meshRef.current.position);
      wireframeMesh.scale.copy(meshRef.current.scale);
      wireframeRef.current = wireframeMesh;
      meshRef.current.add(wireframeMesh);
    } else if (!showWireframe && wireframeRef.current) {
      meshRef.current.remove(wireframeRef.current);
      if (wireframeRef.current.material) wireframeRef.current.material.dispose();
      wireframeRef.current = null;
    }
  }, [showWireframe]);

  // Update symmetry axis visualization
  useEffect(() => {
    if (!sceneRef.current || !symmetryData) return;

    // Remove old symmetry axis
    if (symmetryAxisRef.current) {
      sceneRef.current.remove(symmetryAxisRef.current);
      if (symmetryAxisRef.current.geometry) symmetryAxisRef.current.geometry.dispose();
      if (symmetryAxisRef.current.material) symmetryAxisRef.current.material.dispose();
    }

    if (showSymmetryAxis) {
      const axisGeometry = new THREE.CylinderGeometry(0.02, 0.02, 20, 8);
      const axisMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.6
      });
      const axis = new THREE.Mesh(axisGeometry, axisMaterial);
      axis.position.copy(symmetryData.center);
      axis.rotation.z = Math.PI / 2;
      symmetryAxisRef.current = axis;
      sceneRef.current.add(axis);
    }
  }, [showSymmetryAxis, symmetryData]);

  // Update damage visualization
  useEffect(() => {
    if (!sceneRef.current || !damageData) return;

    // Remove old damage visualizations
    damageVisualizationRef.current.forEach(viz => {
      sceneRef.current.remove(viz);
      if (viz.geometry) viz.geometry.dispose();
      if (viz.material) viz.material.dispose();
    });
    damageVisualizationRef.current = [];

    if (showDamage) {
      // Visualize fracture lines
      damageData.fractures.forEach(([start, end]) => {
        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const material = new THREE.LineBasicMaterial({
          color: 0xff6600,
          linewidth: 3
        });
        const line = new THREE.Line(geometry, material);
        damageVisualizationRef.current.push(line);
        sceneRef.current.add(line);
      });

      // Visualize damage points
      damageData.points.forEach(point => {
        const geometry = new THREE.SphereGeometry(0.05, 8, 8);
        const material = new THREE.MeshBasicMaterial({
          color: 0xff0000,
          transparent: true,
          opacity: 0.8
        });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(point);
        damageVisualizationRef.current.push(sphere);
        sceneRef.current.add(sphere);
      });
    }
  }, [showDamage, damageData]);

  // Handle loading state when scene and mesh are both ready
  // This effect ensures that when sceneReady becomes true, if we have a mesh, 
  // the mesh rendering effect will be triggered
  useEffect(() => {
    if (sceneReady && mesh) {
      // Scene is ready and we have a mesh, the mesh effect will handle rendering
      console.log("EnhancedReconstructionViewer: Scene and mesh both ready, mesh effect should render");
      // Force a small delay to ensure state is fully updated
      requestAnimationFrame(() => {
        // The mesh effect will handle the actual rendering
        console.log("EnhancedReconstructionViewer: Animation frame - mesh should render now");
      });
    } else if (sceneReady && !mesh) {
      // Scene is ready but no mesh, set loading to false
      console.log("EnhancedReconstructionViewer: Scene ready, no mesh - setting loading to false");
      setIsLoading(false);
    } else if (!sceneReady && mesh) {
      // We have a mesh but scene isn't ready yet
      console.log("EnhancedReconstructionViewer: Mesh available but scene not ready yet");
    }
  }, [mesh, sceneReady]);

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

  // Don't return early on loading - we need the container to be rendered for scene initialization

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

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-zinc-400">Loading reconstruction viewer...</p>
          </div>
        </div>
      )}

      {/* Professional toolbar */}
      <div className="absolute top-4 left-4 bg-zinc-900/90 backdrop-blur-sm rounded-lg p-2 shadow-xl border border-zinc-700 z-10">
        <div className="flex flex-col space-y-2 max-h-[80vh] overflow-y-auto">
          {/* Scientific Visualization Modes */}
          <div className="border-b border-zinc-700 pb-2 mb-2">
            <div className="text-xs text-zinc-500 mb-1 px-1">Visualization</div>
            <div className="flex flex-col space-y-1">
              <button
                onClick={() => setVisualizationMode('clay')}
                className={`px-2 py-1 text-xs rounded transition-colors ${visualizationMode === 'clay' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
                title="Clay Realism Mode"
              >
                🏺 Clay
              </button>
              <button
                onClick={() => setVisualizationMode('structural')}
                className={`px-2 py-1 text-xs rounded transition-colors ${visualizationMode === 'structural' ? 'bg-cyan-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
                title="Structural Analysis"
              >
                🔬 Structure
              </button>
              <button
                onClick={() => setVisualizationMode('thickness')}
                className={`px-2 py-1 text-xs rounded transition-colors ${visualizationMode === 'thickness' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
                title="Thickness Heatmap"
              >
                📏 Thickness
              </button>
              <button
                onClick={() => setVisualizationMode('confidence')}
                className={`px-2 py-1 text-xs rounded transition-colors ${visualizationMode === 'confidence' ? 'bg-green-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
                title="Reconstruction Confidence"
              >
                ✓ Confidence
              </button>
            </div>
          </div>

          {/* Analysis Tools */}
          <div className="border-b border-zinc-700 pb-2 mb-2">
            <div className="text-xs text-zinc-500 mb-1 px-1">Analysis</div>
            <div className="flex flex-col space-y-1">
              <button
                onClick={() => setShowWireframe(!showWireframe)}
                className={`px-2 py-1 text-xs rounded transition-colors ${showWireframe ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
                title="Wireframe Overlay"
              >
                ⚡ Wireframe
              </button>
              <button
                onClick={() => setShowSymmetryAxis(!showSymmetryAxis)}
                className={`px-2 py-1 text-xs rounded transition-colors ${showSymmetryAxis ? 'bg-green-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
                title="Symmetry Axis"
              >
                ↻ Symmetry
              </button>
              <button
                onClick={() => setShowDamage(!showDamage)}
                className={`px-2 py-1 text-xs rounded transition-colors ${showDamage ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
                title="Damage Detection"
              >
                ⚠ Damage
              </button>
            </div>
          </div>

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

          {/* View toggle tools */}
          <div className="flex space-x-1">
            <button
              onClick={() => updateLocalShowMesh(!uiShowMesh)}
              className={`p-2 rounded transition-colors ${uiShowMesh ? 'bg-green-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
                }`}
              title="Toggle 3D Mesh View"
            >
              <LayersIcon />
            </button>
            <button
              onClick={() => updateLocalShowPointCloud(!uiShowPointCloud)}
              className={`p-2 rounded transition-colors ${uiShowPointCloud ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
                }`}
              title="Toggle Point Cloud View"
            >
              <SelectIcon />
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

      {/* Scientific Analysis Panel */}
      {meshAnalysis && (
        <div className="absolute bottom-4 right-4 bg-zinc-900/90 backdrop-blur-sm rounded-lg p-3 border border-zinc-700 max-w-xs z-10">
          <div className="text-xs font-semibold text-amber-400 mb-2">Scientific Analysis</div>
          <div className="space-y-1 text-xs text-zinc-300">
            <div>Vertices: {meshAnalysis.vertices.toLocaleString()}</div>
            <div>Faces: {Math.floor(meshAnalysis.faces).toLocaleString()}</div>
            {meshAnalysis.volume > 0 && (
              <div>Volume: {(meshAnalysis.volume / 1000).toFixed(2)}L</div>
            )}
            {meshAnalysis.surfaceArea > 0 && (
              <div>Surface: {(meshAnalysis.surfaceArea / 100).toFixed(1)}cm²</div>
            )}
            {meshAnalysis.avgThickness > 0 && (
              <div>Avg Thickness: {(meshAnalysis.avgThickness * 10).toFixed(1)}mm</div>
            )}
            {symmetryData && (
              <div className="mt-2 pt-2 border-t border-zinc-700">
                <div className="text-amber-400 font-semibold">Symmetry</div>
                <div>Error: {symmetryData.error.toFixed(2)}%</div>
              </div>
            )}
            {damageData && damageData.severity > 0 && (
              <div className="mt-2 pt-2 border-t border-zinc-700">
                <div className="text-red-400 font-semibold">Damage</div>
                <div>Severity: {(damageData.severity * 100).toFixed(1)}%</div>
                <div>Fractures: {damageData.fractures.length}</div>
              </div>
            )}
            {classification && (
              <div className="mt-2 pt-2 border-t border-zinc-700">
                <div className="text-cyan-400 font-semibold">Classification</div>
                <div>Type: {classification.fragmentType || 'Unknown'}</div>
                <div>Confidence: {((classification.confidence || 0) * 100).toFixed(1)}%</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hover info */}
      {hoveredObject && !meshAnalysis && (
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
});

EnhancedReconstructionViewer.displayName = 'EnhancedReconstructionViewer';

export default EnhancedReconstructionViewer;