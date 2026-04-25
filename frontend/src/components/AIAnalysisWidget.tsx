"use client";

import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

const NeuralConnections = ({ positions }: { positions: Float32Array }) => {
  const lineRef = useRef<THREE.LineSegments>(null);
  
  const connectionIndices = useMemo(() => {
    const indices = [];
    for (let i = 0; i < 40; i++) {
      const a = Math.floor(Math.random() * (positions.length / 3));
      const b = Math.floor(Math.random() * (positions.length / 3));
      if (a !== b) indices.push(a, b);
    }
    return new Uint16Array(indices);
  }, [positions]);

  useFrame((state) => {
    if (lineRef.current) {
      const t = state.clock.getElapsedTime();
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      material.opacity = 0.05 + Math.sin(t * 1.5) * 0.05;
    }
  });

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="index"
          args={[connectionIndices, 1]}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color="#3b82f6"
        transparent
        opacity={0.1}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
};

const Scene = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pointsRef = useRef<THREE.Points>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const outerSphereRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  // Create organic flowing points for the background
  const particlesCount = 400;
  const positions = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      const r = 2 + Math.random() * 4;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.05;
      pointsRef.current.rotation.z = t * 0.02;
      
      const scale = 1 + Math.sin(t * 0.5) * 0.05;
      pointsRef.current.scale.set(scale, scale, scale);
    }
    
    if (sphereRef.current) {
      sphereRef.current.rotation.y = t * 0.3;
      sphereRef.current.rotation.x = t * 0.2;
    }

    if (outerSphereRef.current) {
      outerSphereRef.current.rotation.y = -t * 0.2;
      outerSphereRef.current.rotation.z = t * 0.15;
    }

    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * 2) * 0.15;
      coreRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  const colors = isDark ? {
    primary: '#10b981', 
    secondary: '#3b82f6', 
    accent: '#14b8a6', 
    core: '#34d399',   
  } : {
    primary: '#059669', 
    secondary: '#2563eb', 
    accent: '#0d9488', 
    core: '#10b981',
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color={colors.primary} />
      <pointLight position={[-10, -10, -10]} intensity={1} color={colors.secondary} />
      
      <NeuralConnections positions={positions} />
      
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshBasicMaterial 
          color={colors.core} 
          transparent 
          opacity={0.8} 
        />
      </mesh>

      <Float speed={3} rotationIntensity={1.5} floatIntensity={2}>
        <Sphere ref={sphereRef} args={[1.2, 32, 32]}>
          <MeshDistortMaterial
            color={colors.primary}
            speed={4}
            distort={0.5}
            radius={1}
            roughness={0.1}
            metalness={0.8}
            emissive={colors.primary}
            emissiveIntensity={0.8}
            transparent
            opacity={0.7}
          />
        </Sphere>
      </Float>

      <Float speed={1.5} rotationIntensity={2} floatIntensity={1}>
        <mesh ref={outerSphereRef}>
          <sphereGeometry args={[1.6, 32, 32]} />
          <meshPhongMaterial
            color={colors.accent}
            wireframe
            transparent
            opacity={0.15}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </Float>

      <Points ref={pointsRef} positions={positions}>
        <PointMaterial
          transparent
          color={colors.secondary}
          size={0.08}
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
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 left-4 z-20 space-y-2 p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="relative flex h-2 w-2">
              <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
              <div className="relative rounded-full h-2 w-2 bg-emerald-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 drop-shadow-md">
              Neural Core
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex h-2 w-2">
              <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75" style={{ animationDelay: '0.5s' }} />
              <div className="relative rounded-full h-2 w-2 bg-blue-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 drop-shadow-md">
              Active Scan
            </span>
          </div>
        </motion.div>
      )}

      <Canvas 
        camera={{ position: [0, 0, 5], fov: 45 }} 
        dpr={[1, 2]} // Better quality on high DPI
        gl={{ 
          antialias: true, 
          alpha: true, 
          powerPreference: "high-performance",
          toneMapping: THREE.ReinhardToneMapping
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      <div className={`absolute inset-0 bg-gradient-radial from-transparent pointer-events-none rounded-lg ${
        isDark ? 'via-emerald-500/[0.02] to-[#020617]/40' : 'via-emerald-500/[0.02] to-white/40'
      }`} />
    </div>
  );
};

export default AIAnalysisWidget;