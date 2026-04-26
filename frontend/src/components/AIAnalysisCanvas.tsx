"use client";

import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Icosahedron, MeshDistortMaterial, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

const Scene = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pointsRef = useRef<THREE.Points>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    // Silence THREE.Clock deprecation warnings in the console
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const msg = args[0];
      if (typeof msg === 'string' && (msg.includes('Clock') || msg.includes('Timer') || msg.includes('THREE.'))) return;
      originalWarn(...args);
    };
    
    setMounted(true);
    return () => { console.warn = originalWarn; };
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  // Create random points for the background
  const particlesCount = 1000;
  const positions = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.05;
      pointsRef.current.rotation.x = t * 0.02;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.1;
      meshRef.current.rotation.z = t * 0.05;
    }
  });

  const colors = isDark ? {
    primary: '#10b981', // emerald-500
    secondary: '#3b82f6', // blue-500
    accent: '#8b5cf6', // violet-500
  } : {
    primary: '#059669', // emerald-600
    secondary: '#2563eb', // blue-600
    accent: '#7c3aed', // violet-600
  };

  return (
    <>
      <ambientLight intensity={1} />
      <pointLight position={[10, 10, 10]} intensity={2} />
      
      <Float speed={3} rotationIntensity={0.5} floatIntensity={1}>
        <Icosahedron ref={meshRef} args={[2.5, 3]} scale={1}>
          <MeshDistortMaterial
            color={colors.primary}
            speed={2}
            distort={0.3}
            radius={1}
            roughness={0.2}
            metalness={0.5}
            emissive={colors.primary}
            emissiveIntensity={1}
            wireframe
          />
        </Icosahedron>
      </Float>

      <Points ref={pointsRef} positions={positions}>
        <PointMaterial
          transparent
          color={colors.secondary}
          size={0.15}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.8}
        />
      </Points>
    </>
  );
};

const AIAnalysisCanvas: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [metrics, setMetrics] = useState({
    efficiency: 98.7,
    dataPoints: 2.4,
    confidence: 94.2
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        efficiency: Math.min(99.9, Math.max(95.0, prev.efficiency + (Math.random() * 0.4 - 0.2))),
        dataPoints: Math.min(5.0, Math.max(1.2, prev.dataPoints + (Math.random() * 0.1 - 0.05))),
        confidence: Math.min(99.9, Math.max(90.0, prev.confidence + (Math.random() * 0.4 - 0.2)))
      }));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Metrics Overlay */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-4 right-4 z-20 text-right space-y-1 hidden sm:block"
      >
        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
          Neural Efficiency: {metrics.efficiency.toFixed(1)}%
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-blue-500">
          Data Points: {metrics.dataPoints.toFixed(1)}M
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-purple-500">
          Confidence: {metrics.confidence.toFixed(1)}%
        </div>
      </motion.div>

      <Canvas 
        camera={{ position: [0, 0, 8], fov: 50 }} 
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      <div className="absolute inset-0 bg-gradient-radial from-transparent pointer-events-none via-transparent to-[#020617]/10" />
    </div>
  );
};

export default AIAnalysisCanvas;