"use client";

import React, { Component, ErrorInfo, ReactNode, useState, useEffect } from "react";
import { 
  AlertTriangle, RefreshCcw, Home, WifiOff, ShieldAlert, 
  Terminal, Globe, Zap, Cpu, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- 1. GLOBAL ERROR BOUNDARY (CLASS COMPONENT) ---
interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class FallbacksErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Log to external service could go here
    console.error("❌ GLOBAL_CRITICAL_FAULT:", error, errorInfo);
  }

  handleReset = () => {
    // Clear potentially corrupted state
    try {
      // Don't clear EVERYTHING, just common culprits
      Object.keys(localStorage)
        .filter(key => key.startsWith('profile_') || key.startsWith('subscription_'))
        .forEach(key => localStorage.removeItem(key));
    } catch (e) {}
    
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6 font-sans">
          <div className="absolute inset-0 bg-grid-white/[0.02]" />
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl w-full bg-slate-900/80 backdrop-blur-2xl border border-red-500/20 rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden shadow-2xl"
          >
            {/* Visual Header */}
            <div className="flex items-start justify-between mb-8">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest italic">
                  Critical System Fault
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight italic">
                  Kernel <span className="text-red-500">Panic</span>
                </h1>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <ShieldAlert size={32} className="text-red-500" />
              </div>
            </div>

            <p className="text-slate-400 text-lg font-medium leading-relaxed mb-10">
              The AI Engine encountered an unrecoverable exception in the neural layout. Core services remain protected, but this page must be re-initialized.
            </p>

            {/* Error Trace Display (Dev only or hidden button) */}
            <div className="mb-10 p-4 bg-black/50 rounded-2xl border border-white/5 font-mono text-xs overflow-hidden">
               <div className="flex items-center gap-2 text-slate-500 mb-2 border-b border-white/10 pb-2">
                  <Terminal size={14} />
                  <span>DUMP_TRACE_LOG</span>
               </div>
               <div className="text-red-400/70 whitespace-pre-wrap break-all max-h-32 overflow-y-auto custom-scrollbar">
                  {this.state.error?.toString() || "No error description available."}
                  {this.state.errorInfo?.componentStack}
               </div>
            </div>

            {/* Action Buttons */}
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                onClick={this.handleReset}
                className="group relative flex items-center justify-center gap-3 px-8 py-5 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest italic rounded-2xl transition-all shadow-[0_10px_30px_rgba(220,38,38,0.3)] active:scale-95"
              >
                <RefreshCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                Hard Reset
              </button>
              
              <Link
                href="/"
                className="flex items-center justify-center gap-3 px-8 py-5 bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest italic rounded-2xl transition-all active:scale-95"
              >
                <Home size={20} />
                Return Base
              </Link>
            </div>

            {/* Bottom Status */}
            <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between opacity-50">
               <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 tracking-tighter uppercase">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                  Protection: ACTIVE
               </div>
               <div className="text-[10px] font-mono text-slate-500" suppressHydrationWarning>
                  REF_ID: {Math.random().toString(36).substring(7).toUpperCase()}
               </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- 2. OFFLINE OVERLAY / STATUS ---
export function GlobalOfflineDetection() {
  const [isOnline, setIsOnline] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Initial check
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-max max-w-[90vw]"
        >
          <div className="px-6 py-4 bg-orange-600/90 backdrop-blur-xl border border-orange-400/30 rounded-2xl shadow-2xl flex items-center gap-4 text-white">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center animate-pulse">
              <WifiOff size={20} />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-widest italic leading-none mb-1">Grid Loss Detected</p>
              <p className="text-[10px] font-medium opacity-80 uppercase tracking-tighter">Running on Local Synthesis Buffer</p>
            </div>
          </div>
        </motion.div>
      )}

      {showNotification && isOnline && (
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-max max-w-[90vw]"
        >
          <div className="px-6 py-4 bg-emerald-600/90 backdrop-blur-xl border border-emerald-400/30 rounded-2xl shadow-2xl flex items-center gap-4 text-white">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
               <Globe size={20} className="animate-spin-slow" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-widest italic leading-none mb-1">Grid Sync Restored</p>
              <p className="text-[10px] font-medium opacity-80 uppercase tracking-tighter">Connection to Neural Mainframe: STABLE</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- 3. SYSTEM STATUS INDICATOR (For Navbar/Footer) ---
export function SystemStatusPulse() {
  const [latency, setLatency] = useState(24);
  const [status, setStatus] = useState<"optimal" | "warning" | "error">("optimal");

  useEffect(() => {
    const interval = setInterval(() => {
      const base = 20;
      const variation = Math.random() * 15;
      setLatency(Math.floor(base + variation));
      
      // Randomly simulate pressure
      if (Math.random() > 0.95) setStatus("warning");
      else setStatus("optimal");
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl border border-white/5 bg-white/[0.02] transition-all hover:bg-white/5 group">
       <div className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === 'optimal' ? 'bg-emerald-400' : 'bg-indigo-400'}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${status === 'optimal' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></span>
       </div>

       <div className="flex flex-col">
          <span className="text-[8px] font-black text-slate-500 group-hover:text-slate-400 transition-colors uppercase tracking-[0.2em] leading-none mb-0.5">Quantum Link</span>
          <span className="text-[10px] font-mono text-slate-400 group-hover:text-white transition-colors leading-none">{latency}ms</span>
       </div>
    </div>
  );
}
