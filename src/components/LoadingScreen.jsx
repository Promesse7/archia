import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function LoadingScreen({ progress = 0, stage = "Initializing neural vision core", error, onComplete }) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [currentLog, setCurrentLog] = useState('Initializing neural vision core');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const mountRef = useRef(null);

  const systemLogs = [
    'Initializing neural vision core',
    'Calibrating 3D inference engine',
    'Preparing artifact profiler',
    'Loading MobileNet model',
    'Optimizing reconstruction pipeline',
    'Validating heritage protocols'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayProgress(prev => Math.min(prev + 0.5, progress));
    }, 50);
    return () => clearInterval(interval);
  }, [progress]);

  useEffect(() => {
    const logInterval = setInterval(() => {
      setCurrentLog(prev => {
        const currentIndex = systemLogs.indexOf(prev);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % systemLogs.length;
        return systemLogs[nextIndex];
      });
    }, 3000);
    return () => clearInterval(logInterval);
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(300, 300);
    mountRef.current.appendChild(renderer.domElement);

    // Artifact geometry
    const geometry = new THREE.ConeGeometry(2, 3, 12);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x22faff,
      wireframe: true,
      emissive: 0x22faff,
      emissiveIntensity: 0.3
    });
    const artifact = new THREE.Mesh(geometry, material);
    scene.add(artifact);

    // Lighting
    const pointLight = new THREE.PointLight(0x0ff, 2, 100);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0x0b1220, 0.4);
    scene.add(ambientLight);

    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      artifact.rotation.y += 0.008;
      artifact.rotation.x = Math.sin(Date.now() * 0.001) * 0.15;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (displayProgress >= 100 && onComplete) {
      setTimeout(() => {
        setIsTransitioning(true);
        setTimeout(() => onComplete(), 800);
      }, 500);
    }
  }, [displayProgress, onComplete]);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#030712] via-[#0b1220] to-[#030712] text-[#e5e7eb] flex items-center justify-center relative overflow-hidden transition-all duration-1000 ${isTransitioning ? 'opacity-0 scale-105' : 'opacity-100'}`}>
      
      {/* Background grid */}
      <div className="absolute inset-0 opacity-12">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] mx-auto px-6 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-[300] tracking-[0.15em] text-[#e5e7eb]">
            ARCHIA LAB
          </h1>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-sm text-[#94a3b8] tracking-wide">SYSTEM ONLINE</span>
          </div>
        </div>

        {/* Hologram */}
        <div className="flex justify-center">
          <div className="relative">
            <div ref={mountRef} className="w-[300px] h-[300px] rounded-2xl overflow-hidden border border-[#22faff]/20 bg-black/50 backdrop-blur-sm" />
            <div className="absolute -inset-4 border border-[#14b8a6]/30 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Progress */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#94a3b8] font-medium">MODEL INITIALIZATION</span>
            <span className="text-2xl font-mono font-bold text-[#22faff]">
              {displayProgress.toFixed(1)}%
            </span>
          </div>
          
          <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="relative h-full bg-gradient-to-r from-[#22faff] via-[#3b82f6] to-[#22faff] transition-all duration-500 rounded-full shadow-[0_0_12px_rgba(34,255,255,0.4)]"
              style={{ width: `${displayProgress}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-[#94a3b8]">
            <span>MobileNet Model</span>
            <span className="font-mono">{(16 * displayProgress / 100).toFixed(1)}MB / 16MB</span>
          </div>

          <p className="text-center text-sm text-[#e5e7eb] animate-pulse">
            {stage}
          </p>
        </div>

        {/* System Logs */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-[#8b5cf6] animate-pulse" />
            <span className="text-xs text-[#94a3b8] font-mono tracking-wider">SYSTEM LOGS</span>
          </div>
          
          <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
            <div className="font-mono text-sm text-[#14b8a6]">
              <span className="text-[#22c55e]">&gt;</span> {currentLog}
            </div>
          </div>

          <p className="text-xs text-[#94a3b8]">
            First launch downloads AI models to your device.
            Future sessions open instantly from cache.
          </p>
        </div>
      </div>
    </div>
  );
}