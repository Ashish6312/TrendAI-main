"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, Home, LogIn, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function NotFound() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (status === "loading") return;

    // If user is not authenticated, redirect to login after countdown
    if (!session) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/api/auth/signin');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#020617] dark:via-[#0f172a] dark:to-[#1e293b] flex items-center justify-center px-6 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="max-w-xl w-full text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="space-y-10"
        >
          {/* Main Illustration Area */}
          <div className="relative inline-block">
             <motion.div 
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="text-9xl font-black text-slate-200 dark:text-slate-800 opacity-50 tracking-tighter"
             >
               404
             </motion.div>
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl flex items-center justify-center rotate-12 group hover:rotate-0 transition-transform duration-500">
                  <Search size={48} className="text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
                </div>
             </div>
          </div>

          {/* Text Content */}
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Page <span className="text-emerald-600 dark:text-emerald-400">Not Found</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg font-medium leading-relaxed max-w-md mx-auto">
              We searched everywhere but couldn't find the page you're looking for. It might have been moved or removed.
            </p>
          </div>

          {/* Action Area */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-md mx-auto">
            {!session ? (
              <>
                 <Link
                  href="/api/auth/signin"
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95 translate-y-0 hover:-translate-y-1"
                >
                  <LogIn size={20} />
                  Login Account
                </Link>
                <div className="relative group">
                   <div className="absolute inset-x-0 -bottom-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center animate-pulse">
                     Redirecting in {countdown}s
                   </div>
                   <Link
                    href="/"
                    className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold rounded-2xl transition-all hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95"
                  >
                    <Home size={20} />
                    Go Home
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95 translate-y-0 hover:-translate-y-1"
                >
                  <Home size={20} />
                  Dashboard
                </Link>
                <button
                  onClick={() => router.back()}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold rounded-2xl transition-all hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95"
                >
                  <ArrowLeft size={20} />
                  Go Back
                </button>
              </>
            )}
          </div>

          {/* Footer Assistance */}
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
             <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
               Need assistance? <a href="mailto:StarterScope7@gmail.com" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">Contact Support</a>
             </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}