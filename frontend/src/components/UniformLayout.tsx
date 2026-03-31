"use client";

import { ReactNode } from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSubscription } from '@/context/SubscriptionContext';

interface UniformLayoutProps {
  title: string;
  subtitle?: string;
  location?: string;
  children: ReactNode;
  tabs?: Array<{
    id: string;
    label: string;
    icon: ReactNode;
    active?: boolean;
    onClick: () => void;
  }>;
  actions?: ReactNode;
}

export default function UniformLayout({ 
  title, 
  subtitle, 
  location, 
  children, 
  tabs, 
  actions 
}: UniformLayoutProps) {
  const router = useRouter();
  const { theme } = useSubscription();


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] transition-colors duration-500">
      {/* Header - Professional Static Flow */}
      <div className="relative z-40 bg-white dark:bg-[#0a0f25] border-b border-slate-200 dark:border-white/5 shadow-sm">
        <div className="responsive-container py-8 md:py-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
              <button
                onClick={() => router.push('/dashboard')}
                className="shrink-0 flex items-center space-x-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-white/10 transition-all border border-slate-200/50 dark:border-white/10">
                  <ArrowLeft size={18} />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.2em] italic">Back</span>
              </button>
              
              <div className="hidden md:block h-16 w-px bg-slate-200 dark:bg-white/10" />
              
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1]">
                  {title}
                </h1>
                <div className="flex flex-wrap items-center gap-4">
                  {subtitle && (
                    <p className="text-sm sm:text-base font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-[0.1em] opacity-70">
                      {subtitle}
                    </p>
                  )}
                  {location && (
                    <div 
                      className="flex items-center gap-2.5 px-4 py-1.5 rounded-xl border-2 transition-all hover:scale-105"
                      style={{ 
                        borderColor: `${theme.primary}20`, 
                        backgroundColor: `${theme.primary}08`,
                        boxShadow: `0 4px 20px -5px ${theme.primary}15`
                      }}
                    >
                      <MapPin size={14} style={{ color: theme.primary }} className="animate-bounce-slow flex-shrink-0" />
                      <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.15em] whitespace-nowrap" style={{ color: theme.primary }}>
                        {location}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {actions}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Static Flow */}
      {tabs && (
        <div className="relative z-30 bg-white dark:bg-[#0a0f25] border-b border-slate-200 dark:border-white/5">
          <div className="responsive-container">
            <div className="flex space-x-6 sm:space-x-8 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={tab.onClick}
                  className={`flex items-center space-x-2 py-3 sm:py-4 px-1 border-b-2 transition-all whitespace-nowrap ${
                    tab.active
                      ? 'text-slate-900 dark:text-white'
                      : 'border-transparent text-slate-500 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                  style={{ 
                    borderBottomColor: tab.active ? theme.primary : 'transparent',
                    color: tab.active ? theme.primary : undefined
                  }}
                >
                  <span className="flex-shrink-0" style={{ color: tab.active ? theme.primary : undefined }}>{tab.icon}</span>
                  <span className="font-black text-[10px] sm:text-xs uppercase tracking-widest">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="responsive-container py-8 sm:py-12 lg:py-16">
        {children}
      </div>
    </div>
  );
}