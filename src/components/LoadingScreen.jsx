import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function LoadingScreen({ progress = 0, stage = "Initializing visual intelligence", error, onComplete }) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [logHistory, setLogHistory] = useState([]);
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const mountRef = useRef(null);

  const systemLogs = [
    'Initializing visual intelligence',
    'Calibrating spatial recognition',
    'Preparing reconstruction tools',
    'Loading heritage analysis model',
    'Optimizing artifact profiler',
    'Validating authenticity protocols'
  ];

  // Smooth progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayProgress(prev => {
        const diff = progress - prev;
        if (Math.abs(diff) < 0.1) return progress;
        return prev + diff * 0.12;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [progress]);

  // System log rotation
  useEffect(() => {
    const logInterval = setInterval(() => {
      setCurrentLogIndex(prev => {
        const nextIndex = (prev + 1) % systemLogs.length;
        setLogHistory(prevHistory => {
          const newHistory = [systemLogs[nextIndex], ...prevHistory.slice(0, 1)];
          return newHistory;
        });
        return nextIndex;
      });
    }, 3500);
    return () => clearInterval(logInterval);
  }, []);

  // Three.js 3D Scene
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
    camera.position.z = 14;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(360, 360);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Artifact geometry with warm amber
    const geometry = new THREE.ConeGeometry(3, 5, 24);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0xd97706,
      wireframe: true,
      emissive: 0xd97706,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.85
    });
    const artifact = new THREE.Mesh(geometry, material);
    scene.add(artifact);

    // Orbit ring with cool cyan
    const ringGeometry = new THREE.TorusGeometry(4.5, 0.015, 16, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.4
    });
    const orbitRing = new THREE.Mesh(ringGeometry, ringMaterial);
    orbitRing.rotation.x = Math.PI / 2;
    scene.add(orbitRing);

    // Light band
    const lightBandGeometry = new THREE.PlaneGeometry(0.05, 10);
    const lightBandMaterial = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    });
    const lightBand = new THREE.Mesh(lightBandGeometry, lightBandMaterial);
    lightBand.position.x = -6;
    scene.add(lightBand);

    // Lighting
    const rimLight = new THREE.SpotLight(0xf59e0b, 2.5, 50, Math.PI / 6);
    rimLight.position.set(8, 8, 8);
    rimLight.target = artifact;
    scene.add(rimLight);

    const accentLight = new THREE.PointLight(0x06b6d4, 1.2, 50);
    accentLight.position.set(-6, -4, 6);
    scene.add(accentLight);

    const fillLight = new THREE.PointLight(0xfbbf24, 0.8, 60);
    fillLight.position.set(0, -6, 4);
    scene.add(fillLight);

    const ambientLight = new THREE.AmbientLight(0x2d2d2d, 0.4);
    scene.add(ambientLight);

    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const time = Date.now();
      
      artifact.rotation.y += 0.004;
      artifact.rotation.x = Math.sin(time * 0.0004) * 0.08;
      
      orbitRing.rotation.z += 0.002;
      orbitRing.position.y = Math.sin(time * 0.0008) * 0.3;
      
      lightBand.position.x = -6 + Math.sin(time * 0.0005) * 4;
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      lightBandGeometry.dispose();
      lightBandMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  // Complete transition
  useEffect(() => {
    if (displayProgress >= 99.5 && onComplete) {
      setTimeout(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 800);
      }, 500);
    }
  }, [displayProgress, onComplete]);

  const isLargeScreen = typeof window !== 'undefined' && window.innerWidth >= 1024;

  return (
    <div 
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #1a1a1a 0%, #0f0f0f 50%, #1a1a1a 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 1s ease-out',
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? 'scale(1.05)' : 'scale(1)'
      }}
    >
      
      {/* Radial glow */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 50% 40%, rgba(217, 119, 6, 0.08), transparent 60%)',
        pointerEvents: 'none'
      }} />
      
      {/* Grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.03,
        backgroundImage: 'linear-gradient(to right, #4a4a4a 1px, transparent 1px), linear-gradient(to bottom, #4a4a4a 1px, transparent 1px)',
        backgroundSize: '80px 80px',
        pointerEvents: 'none'
      }} />

      {/* Main content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px'
      }}>
        <div style={{
          background: 'linear-gradient(to bottom right, rgba(28, 25, 23, 0.4), rgba(12, 10, 9, 0.4))',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          borderRadius: '24px',
          padding: '48px',
          border: '1px solid rgba(68, 64, 60, 0.3)',
          boxShadow: '0 20px 80px rgba(0, 0, 0, 0.5)'
        }}>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isLargeScreen ? '1fr 1fr' : '1fr',
            gap: '64px',
            alignItems: 'center'
          }}>
            
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
              
              {/* Header */}
              <div style={{
                textAlign: isLargeScreen ? 'left' : 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
                <h1 style={{
                  fontSize: '84px',
                  fontWeight: 300,
                  letterSpacing: '0.3em',
                  color: '#f2f2f2',
                  textShadow: '0 2px 20px rgba(217, 119, 6, 0.2)',
                  margin: 0,
                  lineHeight: 1
                }}>
                  ARCHIA
                </h1>
                <div style={{
                  height: '1px',
                  background: 'linear-gradient(to right, transparent, rgba(217, 119, 6, 0.4), transparent)'
                }} />
                <p style={{
                  fontSize: '14px',
                  color: '#78716c',
                  letterSpacing: '0.25em',
                  fontWeight: 300,
                  textTransform: 'uppercase',
                  margin: 0
                }}>
                  Archaeological Intelligence Laboratory
                </p>
              </div>

              {/* 3D Viewer */}
              <div style={{
                display: 'flex',
                justifyContent: isLargeScreen ? 'flex-start' : 'center'
              }}>
                <div style={{ position: 'relative' }}>
                  
                  <div style={{
                    position: 'relative',
                    background: 'linear-gradient(to bottom right, rgba(28, 25, 23, 0.6), rgba(0, 0, 0, 0.8))',
                    borderRadius: '24px',
                    padding: '24px',
                    border: '1px solid rgba(146, 64, 14, 0.2)'
                  }}>
                    <div 
                      ref={mountRef} 
                      style={{
                        width: '360px',
                        height: '360px',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        background: 'rgba(0, 0, 0, 0.4)'
                      }}
                    />
                    
                    {/* Corner accents */}
                    {[
                      { top: '20px', left: '20px', borderTop: '1px solid rgba(217, 119, 6, 0.3)', borderLeft: '1px solid rgba(217, 119, 6, 0.3)' },
                      { top: '20px', right: '20px', borderTop: '1px solid rgba(217, 119, 6, 0.3)', borderRight: '1px solid rgba(217, 119, 6, 0.3)' },
                      { bottom: '20px', left: '20px', borderBottom: '1px solid rgba(217, 119, 6, 0.3)', borderLeft: '1px solid rgba(217, 119, 6, 0.3)' },
                      { bottom: '20px', right: '20px', borderBottom: '1px solid rgba(217, 119, 6, 0.3)', borderRight: '1px solid rgba(217, 119, 6, 0.3)' }
                    ].map((style, i) => (
                      <div key={i} style={{ position: 'absolute', width: '48px', height: '48px', ...style }} />
                    ))}
                  </div>

                  {/* Status badge */}
                  <div style={{
                    position: 'absolute',
                    bottom: '-20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '10px 24px',
                    background: 'rgba(28, 25, 23, 0.9)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(183, 121, 31, 0.3)',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{ position: 'relative', width: '8px', height: '8px' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#b7791f'
                      }} />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#b7791f',
                        animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                        opacity: 0.75
                      }} />
                    </div>
                    <span style={{
                      fontSize: '12px',
                      color: 'rgba(183, 121, 31, 0.9)',
                      letterSpacing: '0.1em',
                      fontWeight: 300
                    }}>SCANNING ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Progress */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '4px',
                    height: '48px',
                    background: 'linear-gradient(to bottom, #d97706, #92400e)',
                    borderRadius: '9999px'
                  }} />
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: 300,
                    letterSpacing: '0.15em',
                    color: '#eaeaea',
                    textTransform: 'uppercase',
                    margin: 0
                  }}>Loading</h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: '14px',
                    color: '#78716c',
                    letterSpacing: '0.05em',
                    fontWeight: 300,
                    textTransform: 'uppercase'
                  }}>Initialization</span>
                  <div style={{
                    fontSize: '84px',
                    fontWeight: 300,
                    fontVariantNumeric: 'tabular-nums',
                    color: '#d97706',
                    lineHeight: 1
                  }}>
                    {displayProgress.toFixed(0)}<span style={{ fontSize: '36px', color: '#78716c' }}>%</span>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div style={{
                  position: 'relative',
                  height: '10px',
                  background: 'rgba(28, 25, 23, 0.6)',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                  border: '1px solid rgba(41, 37, 36, 0.5)'
                }}>
                  <div style={{
                    height: '100%',
                    background: 'linear-gradient(to right, #d97706, #f59e0b, #d97706)',
                    transition: 'width 700ms ease-out',
                    borderRadius: '9999px',
                    position: 'relative',
                    overflow: 'hidden',
                    width: `${displayProgress}%`
                  }}>
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.3), transparent)',
                      animation: 'shimmer 3s ease-in-out infinite'
                    }} />
                    <div style={{
                      position: 'absolute',
                      right: '-16px',
                      top: 0,
                      bottom: 0,
                      width: '32px',
                      background: 'linear-gradient(to right, transparent, rgba(245, 158, 11, 0.4))',
                      filter: 'blur(4px)'
                    }} />
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  letterSpacing: '0.05em'
                }}>
                  <span style={{ color: '#78716c', fontWeight: 300 }}>Model Package</span>
                  <span style={{ color: '#a8a29e', fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ color: '#d97706' }}>{(16 * displayProgress / 100).toFixed(1)}</span>
                    <span style={{ color: '#44403c', margin: '0 6px' }}>/</span>
                    <span style={{ color: '#78716c' }}>16.0 MB</span>
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div style={{
                height: '1px',
                background: 'linear-gradient(to right, transparent, rgba(68, 64, 60, 0.5), transparent)'
              }} />

              {/* Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '4px',
                    height: '48px',
                    background: 'linear-gradient(to bottom, #b7791f, rgba(183, 121, 31, 0.7))',
                    borderRadius: '9999px'
                  }} />
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: 300,
                    letterSpacing: '0.15em',
                    color: '#eaeaea',
                    textTransform: 'uppercase',
                    margin: 0
                  }}>Status</h2>
                </div>

                <div style={{ minHeight: '120px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {logHistory.length > 0 ? logHistory.map((log, index) => (
                    <div
                      key={`${log}-${index}`}
                      style={{
                        transition: 'all 1s ease-out',
                        opacity: index === 0 ? 1 : 0.4,
                        transform: `translateY(${index * 8}px)`
                      }}
                    >
                      <p style={{
                        fontSize: '16px',
                        lineHeight: 1.6,
                        color: index === 0 ? '#b7791f' : 'rgba(183, 121, 31, 0.4)',
                        margin: 0
                      }}>
                        {log}
                      </p>
                    </div>
                  )) : (
                    <p style={{
                      fontSize: '16px',
                      color: '#b7791f',
                      lineHeight: 1.6,
                      margin: 0
                    }}>
                      {systemLogs[0]}
                    </p>
                  )}
                </div>

                <div style={{
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(68, 64, 60, 0.4)'
                }}>
                  <p style={{
                    fontSize: '12px',
                    color: 'rgba(120, 113, 108, 0.7)',
                    lineHeight: 1.6,
                    fontWeight: 300,
                    margin: 0
                  }}>
                    Initial setup downloads AI models to your device. Subsequent sessions will load instantly from cache.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}} />
    </div>
  );
}