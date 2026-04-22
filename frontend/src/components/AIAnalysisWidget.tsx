"use client";

import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

const Scene = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pointsRef = useRef<THREE.Points>(null);
  const sphereRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  // Create random points for the background
  const particlesCount = 300;
  const positions = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.05;
      pointsRef.current.rotation.x = t * 0.02;
    }
    if (sphereRef.current) {
      sphereRef.current.rotation.y = t * 0.2;
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
      <pointLight position={[5, 5, 5]} intensity={2} />
      
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        <Sphere ref={sphereRef} args={[1.5, 16, 16]}>
          <MeshDistortMaterial
            color={colors.primary}
            speed={3}
            distort={0.4}
            radius={1}
            roughness={0.2}
            metalness={0.5}
            emissive={colors.primary}
            emissiveIntensity={1.2}
          />
        </Sphere>
      </Float>

      <Points ref={pointsRef} positions={positions}>
        <PointMaterial
          transparent
          color={colors.secondary}
          size={0.12}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </>
  );
};

const AIAnalysisWidget: React.FC<{ 
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
}> = ({ 
  className = "", 
  size = 'md',
  showStatus = true 
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const dimensions = {
    sm: { width: 200, height: 150 },
    md: { width: 300, height: 200 },
    lg: { width: 400, height: 300 }
  }[size];

  return (
    <div className={`relative ${className}`} style={{ 
      width: dimensions.width, 
      height: dimensions.height,
      maxWidth: '100%'
    }}>
      {showStatus && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-2 left-2 z-20 space-y-1"
        >
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Neural Core
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
            Active Scan
          </div>
        </motion.div>
      )}

      <Canvas 
        camera={{ position: [0, 0, 5], fov: 45 }} 
        dpr={[1, 1]}
        gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      <div className={`absolute inset-0 bg-gradient-radial from-transparent pointer-events-none rounded-lg ${
        isDark ? 'via-emerald-500/5 to-[#020617]/20' : 'via-emerald-500/5 to-white/20'
      }`} />
    </div>
  );
};

export default AIAnalysisWidget;