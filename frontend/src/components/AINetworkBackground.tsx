"use client";

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from 'next-themes';

const Scene = () => {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const globeRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const currentTheme = mounted ? (theme === 'system' ? systemTheme : theme) : 'dark';
  const isDark = currentTheme === 'dark';

  // Colors based on theme
  const colors = useMemo(() => {
    if (isDark) {
      return {
        globe: '#3b82f6', // blue-500
        wireframe: '#1e3a8a', // blue-900
        points: '#22d3ee', // cyan-400
        glow: '#1d4ed8' // blue-700
      };
    }
    return {
      globe: '#10b981', // emerald-500
      wireframe: '#059669', // emerald-600
      points: '#3b82f6', // blue-500
      glow: '#10b981'
    };
  }, [isDark]);

  // Generate random points for the background
  const [points, sizes] = useMemo(() => {
    const count = 1500;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      sizes[i] = Math.random() * 0.1;
    }
    return [positions, sizes];
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (globeRef.current) {
      globeRef.current.rotation.y = time * 0.1;
      globeRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
    }
    
    if (groupRef.current) {
      // Gentle rotation + mouse influence
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, time * 0.05 + mouse.current.x * 0.2, 0.1);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, mouse.current.y * 0.1, 0.1);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Background Particles */}
      <Points positions={points}>
        <PointMaterial
          transparent
          color={colors.points}
          size={0.05}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={isDark ? 0.4 : 0.2}
        />
      </Points>

      {/* Main Intelligent Globe */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={globeRef} position={[2, -1, 0]}>
          <icosahedronGeometry args={[4, 15]} />
          <meshBasicMaterial 
            color={colors.globe} 
            wireframe 
            transparent 
            opacity={isDark ? 0.15 : 0.1} 
          />
        </mesh>
      </Float>

      {/* Pulsing Core */}
      <Float speed={5} rotationIntensity={2} floatIntensity={2}>
        <mesh position={[2, -1, 0]}>
          <sphereGeometry args={[1.5, 32, 32]} />
          <MeshDistortMaterial
            color={colors.globe}
            speed={3}
            distort={0.4}
            radius={1}
            transparent
            opacity={isDark ? 0.3 : 0.2}
          />
        </mesh>
      </Float>

      {/* Ambient Light for subtle depth */}
      <ambientLight intensity={isDark ? 0.2 : 0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color={colors.points} />
    </group>
  );
};

const AINetworkBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 15], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene />
      </Canvas>
    </div>
  );
};

export default AINetworkBackground;