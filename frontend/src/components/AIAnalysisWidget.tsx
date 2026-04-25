"use client";

import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

const ScanningRings = ({ color }: { color: string }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      groupRef.current.children.forEach((child, i) => {
        child.rotation.x = t * (0.2 + i * 0.1);
        child.rotation.y = t * (0.1 + i * 0.05);
        const s = 1 + Math.sin(t * 2 + i) * 0.05;
        child.scale.set(s, s, s);
      });
    }
  });

  return (
    <group ref={groupRef}>
      {[1.8, 2.1, 2.4].map((radius, i) => (
        <mesh key={i}>
          <ringGeometry args={[radius, radius + 0.02, 64]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={0.1 - i * 0.02} 
            side={THREE.DoubleSide} 
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
};

const NeuralCore = ({ color }: { color: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime;
      const s = 1 + Math.sin(t * 3) * 0.1;
      meshRef.current.scale.set(s, s, s);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={0.9} 
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

const Scene = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const sphereRef = useRef<THREE.Mesh>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const { gl } = useThree();

  useEffect(() => {
    setMounted(true);
    // Cleanup on unmount to prevent memory leaks and WebGL context loss
    return () => {
      gl.dispose();
    };
  }, [gl]);

  const isDark = mounted ? resolvedTheme === 'dark' : true;
  const primaryColor = isDark ? '#10b981' : '#059669';
  const secondaryColor = isDark ? '#3b82f6' : '#2563eb';

  const particles = useMemo(() => {
    const count = 300;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.5 + Math.random() * 2;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (sphereRef.current) {
      sphereRef.current.rotation.y = t * 0.4;
      sphereRef.current.rotation.z = t * 0.1;
    }
    if (shellRef.current) {
      shellRef.current.rotation.y = -t * 0.2;
      shellRef.current.rotation.x = t * 0.1;
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.05;
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={2} color={primaryColor} />
      <pointLight position={[-5, -5, -5]} intensity={1} color={secondaryColor} />
      
      <NeuralCore color={primaryColor} />
      
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        <mesh ref={sphereRef}>
          <sphereGeometry args={[1.2, 64, 64]} />
          <MeshDistortMaterial
            color={primaryColor}
            speed={4}
            distort={0.4}
            radius={1}
            emissive={primaryColor}
            emissiveIntensity={0.5}
            transparent
            opacity={0.6}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      </Float>

      <mesh ref={shellRef}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial 
          color={secondaryColor} 
          wireframe 
          transparent 
          opacity={0.1} 
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <ScanningRings color={primaryColor} />

      <Points ref={pointsRef} positions={particles}>
        <PointMaterial
          transparent
          color={secondaryColor}
          size={0.05}
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
  const dimensions = {
    sm: { width: 250, height: 250 },
    md: { width: 350, height: 350 },
    lg: { width: 450, height: 450 }
  }[size];

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ 
      width: dimensions.width, 
      height: dimensions.height,
      maxWidth: '100%'
    }}>
      {showStatus && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-0 left-0 right-0 z-20 flex flex-col items-center gap-2"
        >
          <div className="px-4 py-2 rounded-full bg-slate-900/40 dark:bg-black/40 backdrop-blur-xl border border-white/10 flex items-center gap-4 shadow-2xl">
            <div className="flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                <div className="relative rounded-full h-2 w-2 bg-emerald-500" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400">
                Neural Hub
              </span>
            </div>
            <div className="w-[1px] h-3 bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75" style={{ animationDelay: '0.5s' }} />
                <div className="relative rounded-full h-2 w-2 bg-blue-500" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400">
                Deep Scan
              </span>
            </div>
          </div>
        </motion.div>
      )}

      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <Canvas 
          camera={{ position: [0, 0, 6], fov: 40 }} 
          dpr={[1, 1.5]} // Capped at 1.5 for performance stability
          gl={{ 
            antialias: false, // Set to false for better mobile/low-end stability
            alpha: true, 
            powerPreference: "high-performance",
            toneMapping: THREE.ReinhardToneMapping,
            preserveDrawingBuffer: false // Free memory faster
          }}
        >
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </div>

      <div className="absolute inset-0 bg-gradient-radial from-emerald-500/[0.05] via-transparent to-transparent pointer-events-none opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)] pointer-events-none" />
    </div>
  );
};

export default AIAnalysisWidget;