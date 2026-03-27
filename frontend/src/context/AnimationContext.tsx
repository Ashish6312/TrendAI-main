"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

interface AnimationContextType {
  triggerPaymentAnimation: () => void;
  isAnimationActive: boolean;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const [isAnimationActive, setIsAnimationActive] = useState(false);

  const triggerPaymentAnimation = useCallback(() => {
    if (isAnimationActive) return; // Prevent multiple animations
    
    console.log('🌊 Starting global payment success animation...');
    setIsAnimationActive(true);
    
    // Define theme colors with fallbacks
    const primaryColor = '#10b981'; // emerald-500
    const secondaryColor = '#06b6d4'; // cyan-500
    
    // Create water particles
    const particleCount = 80;
    const particles: HTMLElement[] = [];
    
    // Add CSS for water animation with fixed colors
    if (!document.getElementById('global-water-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'global-water-animation-styles';
      style.textContent = `
        @keyframes waterFlow {
          0% {
            transform: translate(0, 0) scale(0.2);
            opacity: 0;
          }
          10% {
            opacity: 0.9;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translate(calc(100vw + 300px), calc(-100vh - 300px)) scale(2);
            opacity: 0;
          }
        }
        
        @keyframes rippleWave {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(30);
            opacity: 0;
          }
        }
        
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 30px ${primaryColor}60;
          }
          50% {
            box-shadow: 0 0 60px ${primaryColor}80, 0 0 90px ${primaryColor}40;
          }
        }
        
        .global-water-particle {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
          animation: waterFlow 6s ease-out forwards;
          will-change: transform, opacity;
        }
        
        .global-water-ripple {
          position: fixed;
          border: 3px solid ${primaryColor};
          border-radius: 50%;
          pointer-events: none;
          z-index: 9998;
          animation: rippleWave 4s ease-out forwards;
          will-change: transform, opacity;
        }
        
        @keyframes pageRefresh {
          0% { opacity: 1; transform: scale(1); }
          25% { opacity: 0.9; transform: scale(1.01); }
          50% { opacity: 0.95; transform: scale(0.99); }
          75% { opacity: 0.98; transform: scale(1.005); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        .global-page-refresh-animation {
          animation: pageRefresh 3s ease-in-out;
        }
        
        .global-success-flash {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15);
          pointer-events: none;
          z-index: 9997;
          animation: successFlash 1.5s ease-out forwards;
        }
        
        @keyframes successFlash {
          0% { opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 0.8; }
          100% { opacity: 0; }
        }
        
        @keyframes sparkle {
          0%, 100% { 
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% { 
            transform: scale(1) rotate(180deg);
            opacity: 1;
          }
        }
        
        .global-sparkle {
          position: fixed;
          width: 4px;
          height: 4px;
          background: ${primaryColor};
          border-radius: 50%;
          pointer-events: none;
          z-index: 10000;
          animation: sparkle 2s ease-in-out forwards;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Create success flash overlay
    const flash = document.createElement('div');
    flash.className = 'global-success-flash';
    document.body.appendChild(flash);
    setTimeout(() => {
      if (flash.parentNode) flash.parentNode.removeChild(flash);
    }, 1500);
    
    // Create sparkle effects
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const sparkle = document.createElement('div');
        sparkle.className = 'global-sparkle';
        sparkle.style.cssText = `
          left: ${Math.random() * window.innerWidth}px;
          top: ${Math.random() * window.innerHeight}px;
          animation-delay: ${Math.random() * 1}s;
        `;
        document.body.appendChild(sparkle);
        
        setTimeout(() => {
          if (sparkle.parentNode) {
            sparkle.parentNode.removeChild(sparkle);
          }
        }, 2000);
      }, i * 50);
    }
    
    // Create multiple ripple effects from different positions
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const ripple = document.createElement('div');
        ripple.className = 'global-water-ripple';
        ripple.style.cssText = `
          left: ${20 + i * 30}px;
          bottom: ${20 + i * 25}px;
          width: 20px;
          height: 20px;
          animation-delay: ${i * 0.4}s;
        `;
        document.body.appendChild(ripple);
        
        setTimeout(() => {
          if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
          }
        }, 4000);
      }, i * 300);
    }
    
    // Create water particles flowing from bottom-left to top-right
    for (let i = 0; i < particleCount; i++) {
      setTimeout(() => {
        const particle = document.createElement('div');
        particle.className = 'global-water-particle';
        
        const size = Math.random() * 20 + 8; // 8-28px
        const delay = Math.random() * 4; // 0-4s delay
        const duration = 5 + Math.random() * 3; // 5-8s duration
        const startX = Math.random() * 200; // Spread start positions
        const startY = Math.random() * 200;
        
        // Create gradient colors for particles
        const opacity = 0.7 + Math.random() * 0.3;
        const hue = Math.random() * 60 + 160; // Blue-green range
        
        particle.style.cssText = `
          left: ${startX}px;
          bottom: ${startY}px;
          width: ${size}px;
          height: ${size}px;
          background: radial-gradient(circle, hsl(${hue}, 70%, 60%) 0%, hsl(${hue + 20}, 80%, 50%) 100%);
          box-shadow: 
            0 0 ${size * 2}px hsl(${hue}, 70%, 60%),
            inset 0 0 ${size * 0.5}px hsl(${hue + 30}, 90%, 70%);
          animation-delay: ${delay}s;
          animation-duration: ${duration}s;
          opacity: ${opacity};
        `;
        
        document.body.appendChild(particle);
        particles.push(particle);
        
        // Remove particle after animation
        setTimeout(() => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        }, (duration + delay) * 1000);
      }, i * 40); // Stagger particle creation
    }
    
    // Add page refresh animation
    const mainContent = document.querySelector('body');
    if (mainContent) {
      mainContent.classList.add('global-page-refresh-animation');
      setTimeout(() => {
        mainContent.classList.remove('global-page-refresh-animation');
      }, 3000);
    }
    
    // Reset animation state after completion
    setTimeout(() => {
      setIsAnimationActive(false);
      console.log('🌊 Global payment animation completed!');
    }, 10000);
    
  }, [isAnimationActive]);

  return (
    <AnimationContext.Provider value={{ triggerPaymentAnimation, isAnimationActive }}>
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimation() {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
}