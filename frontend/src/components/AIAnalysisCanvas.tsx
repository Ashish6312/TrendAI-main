"use client";

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  life: number;
}

interface WavePoint {
  x: number;
  y: number;
  baseY: number;
  angle: number;
  speed: number;
}

const AIAnalysisCanvas: React.FC<{ className?: string }> = ({ className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const { theme: currentTheme } = useTheme();
  const isDark = currentTheme === 'dark';
  const particlesRef = useRef<Particle[]>([]);
  const wavePointsRef = useRef<WavePoint[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState({
    efficiency: 98.7,
    dataPoints: 2.4,
    confidence: 94.2
  });

  // Dynamic metrics update
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

  // Initialize particles and wave points
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      // Use lower resolution on mobile for better performance
      const pixelRatio = Math.min(window.devicePixelRatio, width < 768 ? 1.5 : 2);
      
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(pixelRatio, pixelRatio);
      }

      const centerX = width / 2;
      const centerY = height / 2;

      // Responsive particle count based on screen size and device capability
      const isMobile = width < 768;
      const baseParticleCount = isMobile ? 20 : 50;
      const particleCount = Math.min(80, Math.max(15, Math.floor(width * height / (isMobile ? 12000 : 8000))));
      const finalParticleCount = Math.min(baseParticleCount, particleCount);
      
      particlesRef.current = Array.from({ length: finalParticleCount }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (isMobile ? 0.3 : 0.5),
        vy: (Math.random() - 0.5) * (isMobile ? 0.3 : 0.5),
        size: Math.random() * (isMobile ? 1.5 : 2) + (isMobile ? 0.8 : 1),
        color: ['#00ffff', '#0080ff', '#8000ff'][Math.floor(Math.random() * 3)],
        opacity: Math.random() * 0.5 + 0.2,
        life: Math.random() * 100
      }));

      // Initialize wave points for energy field - fewer points on mobile
      const waveRadius = Math.min(width, height) * (isMobile ? 0.12 : 0.15);
      const numPoints = isMobile ? 32 : 64;
      wavePointsRef.current = Array.from({ length: numPoints }, (_, i) => {
        const angle = (i / numPoints) * Math.PI * 2;
        return {
          x: centerX + Math.cos(angle) * waveRadius,
          y: centerY + Math.sin(angle) * waveRadius,
          baseY: centerY + Math.sin(angle) * waveRadius,
          angle: angle,
          speed: 0.02 + Math.random() * 0.01
        };
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    setIsVisible(true);

    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isVisible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const animate = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const isMobile = width < 768;

      // Clear canvas with theme-aware background
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = isDark ? 'rgba(2, 6, 23, 0.05)' : 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(0, 0, width, height);

      time += 0.016; // ~60fps

      // Draw neural network connections - reduced on mobile
      if (!isMobile || time % 2 < 1) { // Skip every other frame on mobile for performance
        ctx.strokeStyle = isDark ? 'rgba(0, 255, 255, 0.1)' : 'rgba(0, 150, 255, 0.1)';
        ctx.lineWidth = isMobile ? 0.5 : 1;
        const connectionDistance = Math.min(width, height) * (isMobile ? 0.08 : 0.12);
        
        particlesRef.current.forEach((particle, i) => {
          // Reduce connections on mobile
          const maxConnections = isMobile ? 2 : 4;
          let connectionCount = 0;
          
          particlesRef.current.slice(i + 1).forEach(otherParticle => {
            if (connectionCount >= maxConnections) return;
            
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < connectionDistance) {
              const opacity = (connectionDistance - distance) / connectionDistance * (isMobile ? 0.15 : 0.2);
              ctx.strokeStyle = isDark ? `rgba(0, 255, 255, ${opacity})` : `rgba(0, 100, 255, ${opacity})`;
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.stroke();
              connectionCount++;
            }
          });
        });
      }

      // Update and draw particles
      particlesRef.current.forEach(particle => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life += 1;

        // Wrap around edges
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;

        // Animate opacity
        particle.opacity = 0.3 + Math.sin(particle.life * 0.02) * 0.2;

        // Draw particle
        const colors = isDark ? {
          '#00ffff': `rgba(0, 255, 255, ${particle.opacity})`,
          '#0080ff': `rgba(0, 128, 255, ${particle.opacity})`,
          '#8000ff': `rgba(128, 0, 255, ${particle.opacity})`
        } : {
          '#00ffff': `rgba(0, 180, 255, ${particle.opacity})`,
          '#0080ff': `rgba(0, 100, 255, ${particle.opacity})`,
          '#8000ff': `rgba(100, 0, 255, ${particle.opacity})`
        };
        
        ctx.fillStyle = colors[particle.color as keyof typeof colors] || `rgba(0, 255, 255, ${particle.opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        // Add glow effect - reduced on mobile
        if (!isMobile) {
          ctx.shadowColor = particle.color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Draw flowing energy wave around AI core - responsive sizing
      const waveRadius = Math.min(width, height) * (isMobile ? 0.12 : 0.15);
      const waveAmplitude = Math.min(width, height) * (isMobile ? 0.02 : 0.03);
      
      // Create gradient for energy wave - ensure positive radius values
      const innerRadius = Math.max(0, waveRadius - 30);
      const outerRadius = Math.max(innerRadius + 1, waveRadius + 30);
      const gradient = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, outerRadius);
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0.6)');
      gradient.addColorStop(0.5, 'rgba(0, 128, 255, 0.4)');
      gradient.addColorStop(1, 'rgba(128, 0, 255, 0.2)');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = Math.max(isMobile ? 1.5 : 2, width / 200);
      ctx.beginPath();

      // Draw flowing wave
      for (let i = 0; i < wavePointsRef.current.length; i++) {
        const point = wavePointsRef.current[i];
        const nextPoint = wavePointsRef.current[(i + 1) % wavePointsRef.current.length];
        
        // Update wave point
        const wave1 = Math.sin(time * 2 + point.angle * 3) * waveAmplitude * 0.5;
        const wave2 = Math.sin(time * 1.5 + point.angle * 2) * waveAmplitude * 0.3;
        const wave3 = Math.sin(time * 3 + point.angle * 4) * waveAmplitude * 0.2;
        
        const currentRadius = waveRadius + wave1 + wave2 + wave3;
        point.x = centerX + Math.cos(point.angle) * currentRadius;
        point.y = centerY + Math.sin(point.angle) * currentRadius;
        
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          // Create smooth curves
          const cpX = (point.x + nextPoint.x) / 2;
          const cpY = (point.y + nextPoint.y) / 2;
          ctx.quadraticCurveTo(point.x, point.y, cpX, cpY);
        }
      }
      
      ctx.closePath();
      ctx.stroke();

      // Draw AI core with pulsing effect - responsive sizing
      const coreRadius = Math.min(width, height) * (isMobile ? 0.05 : 0.06) + Math.sin(time * 3) * (Math.min(width, height) * (isMobile ? 0.008 : 0.01));
      
      // Outer glow
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(coreRadius * 1.5, 1));
      coreGradient.addColorStop(0, 'rgba(0, 170, 255, 0.8)');
      coreGradient.addColorStop(0.7, 'rgba(0, 255, 255, 0.4)');
      coreGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
      
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, Math.max(coreRadius * 1.5, 1), 0, Math.PI * 2);
      ctx.fill();

      // Inner core
      const innerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius);
      innerGradient.addColorStop(0, 'rgba(0, 255, 255, 1)');
      innerGradient.addColorStop(1, 'rgba(0, 128, 255, 0.6)');
      
      ctx.fillStyle = innerGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      // AI text - responsive font size
      const fontSize = Math.max(12, Math.min(width, height) * (isMobile ? 0.035 : 0.04));
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('AI', centerX, centerY);

      // Add subtle glow to text - reduced on mobile
      if (!isMobile) {
        ctx.shadowColor = isDark ? '#00ffff' : 'rgba(0, 128, 255, 0.4)';
        ctx.shadowBlur = isDark ? 10 : 5;
        ctx.fillText('AI', centerX, centerY);
        ctx.shadowBlur = 0;
      }

      // Draw data streams - responsive
      const streamCount = Math.max(isMobile ? 3 : 4, Math.min(isMobile ? 6 : 8, Math.floor(width / (isMobile ? 120 : 100))));
      for (let i = 0; i < streamCount; i++) {
        const angle = (i / streamCount) * Math.PI * 2 + time * 0.5;
        const startRadius = coreRadius * 1.8;
        const endRadius = Math.min(width, height) * (isMobile ? 0.25 : 0.35);
        
        const startX = centerX + Math.cos(angle) * startRadius;
        const startY = centerY + Math.sin(angle) * startRadius;
        const endX = centerX + Math.cos(angle) * endRadius;
        const endY = centerY + Math.sin(angle) * endRadius;
        
        // Animated stream
        const streamGradient = ctx.createLinearGradient(startX, startY, endX, endY);
        streamGradient.addColorStop(0, 'rgba(0, 255, 255, 0.6)');
        streamGradient.addColorStop(0.5, 'rgba(0, 128, 255, 0.3)');
        streamGradient.addColorStop(1, 'rgba(128, 0, 255, 0)');
        
        ctx.strokeStyle = streamGradient;
        ctx.lineWidth = Math.max(isMobile ? 0.8 : 1, width / 300);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Moving dots along streams
        const dotProgress = (time * 0.5 + i * 0.3) % 1;
        const dotX = startX + (endX - startX) * dotProgress;
        const dotY = startY + (endY - startY) * dotProgress;
        
        ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(dotX, dotY, Math.max(isMobile ? 1.5 : 2, width / 200), 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, currentTheme]);

  return (
    <div className={`ai-animation-container ${className}`}>
      {/* Status indicators */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10 space-y-1 sm:space-y-2"
      >
        <div className={`flex items-center gap-1 sm:gap-2 text-[8px] sm:text-xs font-mono transition-colors ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
          <div className={`w-1 sm:w-2 h-1 sm:h-2 rounded-full animate-pulse transition-colors ${isDark ? 'bg-cyan-400' : 'bg-cyan-600'}`} />
          <span className="hidden sm:inline">Analyzing Market Data...</span>
          <span className="sm:hidden">Analyzing...</span>
        </div>
        <div className={`flex items-center gap-1 sm:gap-2 text-[8px] sm:text-xs font-mono transition-colors ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
          <div className={`w-1 sm:w-2 h-1 sm:h-2 rounded-full animate-pulse transition-colors ${isDark ? 'bg-blue-400' : 'bg-blue-600'}`} style={{ animationDelay: '0.5s' }} />
          <span className="hidden sm:inline">Processing Business Ideas...</span>
          <span className="sm:hidden">Processing...</span>
        </div>
        <div className={`flex items-center gap-1 sm:gap-2 text-[8px] sm:text-xs font-mono transition-colors ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
          <div className={`w-1 sm:w-2 h-1 sm:h-2 rounded-full animate-pulse transition-colors ${isDark ? 'bg-purple-400' : 'bg-purple-600'}`} style={{ animationDelay: '1s' }} />
          <span className="hidden sm:inline">Generating Recommendations...</span>
          <span className="sm:hidden">Generating...</span>
        </div>
      </motion.div>
      
      {/* Performance metrics */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 text-right space-y-0.5 sm:space-y-1"
      >
        <div className={`text-[8px] sm:text-xs font-mono transition-colors ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
          <span className="hidden sm:inline">Neural Efficiency: </span>{metrics.efficiency.toFixed(1)}%
        </div>
        <div className={`text-[8px] sm:text-xs font-mono transition-colors ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
          <span className="hidden sm:inline">Data Points: </span>{metrics.dataPoints.toFixed(1)}M
        </div>
        <div className={`text-[8px] sm:text-xs font-mono transition-colors ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
          <span className="hidden sm:inline">Confidence: </span>{metrics.confidence.toFixed(1)}%
        </div>
      </motion.div>
      
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="ai-canvas w-full h-full"
        style={{ background: 'transparent' }}
      />
      
      {/* Background gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-radial from-transparent transition-colors duration-500 pointer-events-none ${
        isDark ? 'via-blue-900/5 to-purple-900/10' : 'via-blue-500/5 to-purple-500/5'
      }`} />
    </div>
  );
};

export default AIAnalysisCanvas;