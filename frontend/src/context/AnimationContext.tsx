"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useSubscription } from './SubscriptionContext';

interface AnimationContextType {
  triggerPaymentAnimation: () => void;
  isAnimationActive: boolean;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const [isAnimationActive, setIsAnimationActive] = useState(false);
  const { theme } = useSubscription();

  const triggerPaymentAnimation = useCallback(() => {
    if (isAnimationActive) return; // Prevent multiple animations
    
    console.log('🌊 Starting global payment success animation...');
    setIsAnimationActive(true);
    
    // Create water particles
    const particleCount = 60;
    const particles: HTMLElement[] = [];
    
    // Add CSS for water animation
    if (!document.getElementById('global-water-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'global-water-animation-styles';
      style.textContent = `
        @keyframes waterFlow {
          0% {
            transform: translate(0, 0) scale(0.3);
            opacity: 0;
          }
          5% {
            opacity: 0.9;
          }
          95% {
            opacity: 0.7;
          }
          100% {
            transform: translate(calc(100vw + 200px), calc(-100vh - 200px)) scale(1.5);
            opacity: 0;
          }
        }
        
        @keyframes rippleWave {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(25);
            opacity: 0;
          }
        }
        
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 20px ${theme.primary}60;
          }
          50% {
            box-shadow: 0 0 40px ${theme.primary}80, 0 0 60px ${theme.primary}40;
          }
        }
        
        .global-water-particle {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
          animation: waterFlow 5s ease-out forwards;
        }
        
        .global-water-ripple {
          position: fixed;
          border: 4px solid ${theme.primary};
          border-radius: 50%;
          pointer-events: none;
          z-index: 9998;
          animation: rippleWave 3s ease-out forwards;
        }
        
        @keyframes pageRefresh {
          0% { opacity: 1; transform: scale(1); }
          25% { opacity: 0.8; transform: scale(1.02); }
          50% { opacity: 0.9; transform: scale(0.98); }
          75% { opacity: 0.95; transform: scale(1.01); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        .global-page-refresh-animation {
          animation: pageRefresh 2s ease-in-out;
        }
        
        .global-success-flash {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, ${theme.primary}20, ${theme.secondary}20);
          pointer-events: none;
          z-index: 9997;
          animation: successFlash 1s ease-out forwards;
        }
        
        @keyframes successFlash {
          0% { opacity: 0; }
          30% { opacity: 1; }
          100% { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Create success flash overlay
    const flash = document.createElement('div');
    flash.className = 'global-success-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 1000);
    
    // Create multiple ripple effects
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const ripple = document.createElement('div');
        ripple.className = 'global-water-ripple';
        ripple.style.cssText = `
          left: ${30 + i * 20}px;
          bottom: ${30 + i * 20}px;
          width: 30px;
          height: 30px;
          animation-delay: ${i * 0.3}s;
        `;
        document.body.appendChild(ripple);
        
        setTimeout(() => {
          if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
          }
        }, 3000);
      }, i * 200);
    }
    
    // Create water particles flowing from bottom-left to top-right
    for (let i = 0; i < particleCount; i++) {
      setTimeout(() => {
        const particle = document.createElement('div');
        particle.className = 'global-water-particle';
        
        const size = Math.random() * 16 + 6; // 6-22px
        const delay = Math.random() * 3; // 0-3s delay
        const duration = 4 + Math.random() * 2; // 4-6s duration
        const startX = Math.random() * 150; // Spread start positions
        const startY = Math.random() * 150;
        
        particle.style.cssText = `
          left: ${startX}px;
          bottom: ${startY}px;
          width: ${size}px;
          height: ${size}px;
          background: linear-gradient(135deg, ${theme.primary}90, ${theme.secondary}90, ${theme.primary}60);
          box-shadow: 0 0 ${size * 3}px ${theme.primary}60, inset 0 0 ${size}px ${theme.secondary}40;
          animation-delay: ${delay}s;
          animation-duration: ${duration}s;
        `;
        
        document.body.appendChild(particle);
        particles.push(particle);
        
        // Remove particle after animation
        setTimeout(() => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        }, (duration + delay) * 1000);
      }, i * 30); // Faster stagger for more fluid effect
    }
    
    // Add page refresh animation
    const mainContent = document.querySelector('body');
    if (mainContent) {
      mainContent.classList.add('global-page-refresh-animation');
      setTimeout(() => {
        mainContent.classList.remove('global-page-refresh-animation');
      }, 2000);
    }
    
    // Reset animation state after completion
    setTimeout(() => {
      setIsAnimationActive(false);
      console.log('🌊 Global payment animation completed!');
    }, 8000);
    
  }, [theme, isAnimationActive]);

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