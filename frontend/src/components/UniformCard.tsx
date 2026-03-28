"use client";

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface UniformCardProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  delay?: number;
}

export default function UniformCard({ 
  title, 
  subtitle, 
  icon, 
  children, 
  className = '', 
  variant = 'default',
  size = 'md',
  hover = true,
  delay = 0
}: UniformCardProps) {
  const sizeClasses = {
    sm: 'p-2 sm:p-2.5',
    md: 'p-3 sm:p-4',
    lg: 'p-4 sm:p-6'
  };

  const variantClasses = {
    default: 'bg-white dark:bg-[#0a0f25] border border-slate-200 dark:border-slate-700 shadow-sm',
    gradient: 'bg-gradient-to-br from-white to-slate-50 dark:from-[#0a0f25] dark:to-[#050818] border border-slate-200 dark:border-slate-700 shadow-lg',
    glass: 'bg-white/80 dark:bg-[#0a0f25]/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-600/50 shadow-xl'
  };

  const hoverClasses = hover ? 'hover:shadow-lg dark:hover:shadow-2xl hover:-translate-y-1 hover:border-slate-300 dark:hover:border-slate-500' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${hoverClasses}
        rounded-xl sm:rounded-2xl
        transition-all duration-300
        ${className}
      `}
    >
      {(title || subtitle || icon) && (
        <div className="flex items-start justify-between mb-4 sm:mb-6">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20 dark:border-emerald-500/30">
                <span className="text-emerald-600 dark:text-emerald-400">
                  {icon}
                </span>
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {children}
    </motion.div>
  );
}