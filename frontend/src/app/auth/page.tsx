"use client";

import { signIn, getSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Zap, TrendingUp, Users, Shield, Star, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import React from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function AuthPage() {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const router = useRouter();
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    setMounted(true);
    const checkSession = async () => {
      try {
        const session = await getSession();
        if (session) {
          const urlParams = new URLSearchParams(window.location.search);
          const callbackUrl = urlParams.get('callbackUrl') || '/dashboard';
          router.push(callbackUrl);
        }
      } catch (error) {
        console.error('Session check failed:', error);
      }
    };
    
    // Check backend health
    const checkBackend = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://trendai-api.onrender.com';
      try {
        const res = await fetch(`${apiUrl}/api/health`, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          console.log('✅ Backend connectivity test: PASSED');
        } else {
          console.warn(`⚠️ Backend connectivity test: FAILED (${res.status})`);
        }
      } catch (e) {
        console.error('❌ Backend connectivity test: ERROR', e);
      }
    };

    const timeoutId = setTimeout(checkSession, 500);
    checkBackend();
    return () => clearTimeout(timeoutId);
  }, [router]);

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError("");
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const callbackUrl = urlParams.get('callbackUrl') || '/dashboard';
      const result = await signIn('google', {
        callbackUrl,
        redirect: false
      });
      if (result?.ok) {
        window.location.href = callbackUrl;
      } else if (result?.error) {
        setError('Google authentication failed. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Google authentication error:', error);
      setError('Google authentication failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!formData.email.trim()) {
      setError("Email is required!");
      return;
    }
    if (!formData.email.includes('@')) {
      setError("Please enter a valid email address!");
      return;
    }
    if (!formData.password) {
      setError("Password is required!");
      return;
    }
    if (!isLogin) {
      if (!formData.name.trim()) {
        setError("Name is required!");
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters!");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match!");
        return;
      }
    }
    setLoading(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const callbackUrl = urlParams.get('callbackUrl') || '/dashboard';
      const result = await signIn('credentials', {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        name: formData.name.trim() || undefined,
        isSignUp: (!isLogin).toString(),
        callbackUrl,
        redirect: false
      });
      if (result?.error) {
        setError(`Failed: ${result.error}`);
      } else if (result?.ok) {
        window.location.href = callbackUrl;
      } else {
        setError('Failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(`Error: ${error.message || 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <TrendingUp size={20} />, text: t('auth_feat_1') },
    { icon: <Users size={20} />, text: t('auth_feat_2') },
    { icon: <Shield size={20} />, text: t('auth_feat_3') },
    { icon: <Star size={20} />, text: t('auth_feat_4') }
  ];

  const stats = [
    { value: "$2M+", label: t('price_stat_capital') },
    { value: "94%", label: t('price_stat_market') },
    { value: "48h", label: t('price_stat_precision') }
  ];

  if (!mounted) {
    return (
      <div className="h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t('auth_init')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#020617] dark:via-[#0f172a] dark:to-[#1e293b] text-slate-900 dark:text-white transition-all duration-700 overflow-hidden">
      <div className="h-screen flex">
        <div className="flex-1 flex items-center justify-center p-6 relative">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
          </div>

          <div className="w-full max-w-sm relative z-10">
            <div className="absolute -top-2 -right-2 z-20">
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 shadow-lg hover:scale-105"
                aria-label="Toggle theme"
              >
                <AnimatePresence mode="wait">
                  {isDarkMode ? (
                    <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                      <Sun size={18} />
                    </motion.div>
                  ) : (
                    <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                      <Moon size={18} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>

            <div className="text-center mb-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-xl shadow-emerald-500/30 border border-emerald-400/30 relative">
                  <Zap className="text-white" size={20} fill="currentColor" />
                </div>
                <div className="text-left">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Trend<span className="text-emerald-600 dark:text-emerald-400">AI</span></span>
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Smart Systems</div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                  {isLogin ? t('auth_welcome') : t('auth_join')}
                </h1>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isLogin ? t('auth_login_desc') : t('auth_signup_desc')}
                </p>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex bg-slate-100/80 dark:bg-slate-800/50 border-2 border-slate-300/80 dark:border-slate-700/50 rounded-xl p-1.5 mb-6 shadow-lg backdrop-blur-sm">
              <button onClick={() => setIsLogin(true)} className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${isLogin ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                {t('auth_signin_tab')}
              </button>
              <button onClick={() => setIsLogin(false)} className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${!isLogin ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                {t('auth_signup_tab')}
              </button>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div key={isLogin ? 'login' : 'signup'} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-xs font-medium text-center backdrop-blur-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                      <input type="text" placeholder={t('auth_name')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-white/90 dark:bg-slate-800/50 border-2 border-slate-300/80 dark:border-slate-700/50 rounded-xl text-sm font-medium focus:border-emerald-500/70 focus:outline-none backdrop-blur-sm shadow-sm" required={!isLogin} autoComplete="name" />
                    </div>
                  )}
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                    <input type="email" placeholder={t('auth_email')} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-white/90 dark:bg-slate-800/50 border-2 border-slate-300/80 dark:border-slate-700/50 rounded-xl text-sm font-medium focus:border-emerald-500/70 focus:outline-none backdrop-blur-sm shadow-sm" required autoComplete="email" />
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                    <input type={showPassword ? "text" : "password"} placeholder={t('auth_pass')} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full pl-10 pr-12 py-3 bg-white/90 dark:bg-slate-800/50 border-2 border-slate-300/80 dark:border-slate-700/50 rounded-xl text-sm font-medium focus:border-emerald-500/70 focus:outline-none backdrop-blur-sm shadow-sm" required autoComplete={isLogin ? "current-password" : "new-password"} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {!isLogin && (
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                      <input type={showPassword ? "text" : "password"} placeholder={t('auth_confirm')} value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-white/90 dark:bg-slate-800/50 border-2 border-slate-300/80 dark:border-slate-700/50 rounded-xl text-sm font-medium focus:border-emerald-500/70 focus:outline-none backdrop-blur-sm shadow-sm" required={!isLogin} autoComplete="new-password" />
                    </div>
                  )}
                  <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25">
                    {loading ? (
                      <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div></div>
                    ) : (
                      <div className="flex items-center gap-2"><span className="text-sm font-bold">{isLogin ? t('auth_btn_login') : t('auth_btn_signup')}</span><ArrowRight size={16} /></div>
                    )}
                  </button>
                </form>
                <div className="relative py-3">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-slate-300/80 dark:border-slate-700"></div></div>
                  <div className="relative flex justify-center text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span className="px-3 bg-slate-50 dark:bg-[#020617]">{t('auth_or')}</span>
                  </div>
                </div>
                <button onClick={handleGoogleAuth} disabled={loading} className="w-full py-3 bg-white dark:bg-slate-800/50 border-2 border-slate-300/80 dark:border-slate-700/50 rounded-xl flex items-center justify-center gap-3 backdrop-blur-sm disabled:opacity-70">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('auth_google')}</span>
                </button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-slate-100 to-slate-50 dark:from-[#0f172a] dark:to-[#334155] border-l border-slate-200/50 dark:border-slate-700/50 items-center justify-center p-8 transition-all duration-700">
          <div className="max-w-lg relative z-10 space-y-8">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="grid grid-cols-3 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center space-y-2">
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{stat.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{stat.label}</div>
                  <div className="h-0.5 w-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mx-auto opacity-60" />
                </div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="space-y-4">
              <h2 className="text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                {t('auth_footer_1')}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-md">
                {t('auth_footer_desc')}
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                    {React.cloneElement(feature.icon as React.ReactElement<any>, { size: 14 })}
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-200">{feature.text}</span>
                </div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl p-6 shadow-lg group">
              <div className="relative z-10">
                <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed text-sm mb-4">
                  "{t('home_story_3_quote')}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs">S</div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">Sarah C.</div>
                    <div className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{t('home_story_3_role')}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
