"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { locationAPI } from "@/utils/locationAPI";
import { getApiUrl } from "@/config/api";

import {
  ArrowRight, Zap, Rocket,
  Globe2, Cpu, MapPin,
  Network, Layers, Star, ShieldCheck
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AINetworkBackground from "@/components/AINetworkBackground";
import CountUp from "react-countup";

import { useLanguage } from "@/context/LanguageContext";

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [detectedLocation, setDetectedLocation] = useState<{ city: string, country: string } | null>(null);

  useEffect(() => {
    const detect = async () => {
      // 1. Try to get saved location from profile if logged in
      if (session?.user?.email) {
        try {
          const apiUrl = getApiUrl();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
          
          const profileRes = await fetch(`${apiUrl}/api/users/${session.user.email}/profile`, {
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          clearTimeout(timeoutId);
          
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData.user?.location) {
              const savedLocation = profileData.user.location;
              console.log('👤 Using saved profile location:', savedLocation);
              
              // We can split the string for display or use it as is
              const parts = savedLocation.split(',').map((p: string) => p.trim());
              setDetectedLocation({ 
                city: parts[0] || savedLocation, 
                country: parts[parts.length - 1] || 'Saved' 
              });
              return; // EXIT EARLY - Found saved location
            }
          }
        } catch (e: any) {
          if (e.name === 'AbortError') {
            console.warn('Backend location proxy timed out, trying fallbacks...');
          } else {
            console.warn('Backend location proxy failed, trying fallbacks...');
          }
        }
      }

      // 2. Fallback to GPS/IP detection
      try {
        const loc = await locationAPI.detectUserLocation();
        if (loc) {
          setDetectedLocation({ city: loc.city, country: loc.country });
        }
      } catch (e) {
        console.warn('Location detection failed, using default');
        setDetectedLocation({ city: 'Global', country: 'Worldwide' });
      }
    };
    detect();
  }, [session]);

  const handleStartScan = () => {
    if (session) {
      router.push("/dashboard");
    } else {
      router.push("/auth");
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  };

  const staggerContainer = {
    initial: {},
    whileInView: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="flex flex-col items-center bg-gradient-to-br from-indigo-50/20 via-white to-emerald-50/20 dark:from-[#020617] dark:via-[#0f172a] dark:to-[#1e1b4b] selection:bg-blue-500/30 overflow-x-hidden min-h-screen transition-colors duration-500">

      {/* 1. WELCOME SECTION - Immersive Split Layout */}
      <section id="hero" className="w-full relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* AI Neural Network Background - Full Screen */}
        <div className="absolute inset-0 z-0">
          <AINetworkBackground />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/50 to-white dark:via-[#020617]/50 dark:to-[#020617] pointer-events-none" />
        </div>

        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left Side: Strategic Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8 text-left"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="inline-flex items-center gap-2 p-1 pr-4 rounded-full bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-xl shadow-2xl"
              >
                <div className="flex -space-x-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 shadow-lg overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i + 45}`} alt="User" />
                    </div>
                  ))}
                </div>
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">
                  <span className="animate-pulse mr-2 inline-block w-2 h-2 bg-cyan-500 rounded-full" />
                  {t('hero_badge')}
                </span>
              </motion.div>

              <div className="space-y-4">
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-slate-900 dark:text-white leading-[0.9] drop-shadow-sm"
                >
                  {t('hero_title_1')} <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 italic pr-2 py-1">{t('hero_title_2')}</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 1 }}
                  className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-xl font-medium leading-relaxed"
                >
                  {t('hero_subtitle')}
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 items-start"
              >
                <button
                  onClick={handleStartScan}
                  className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black uppercase tracking-widest shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-1 transition-all duration-300 rounded-xl active:scale-95 flex items-center justify-center gap-2"
                >
                  {t('btn_start_scan')}
                  <ArrowRight size={16} />
                </button>
                <Link href="/acquisition-tiers" className="w-full sm:w-auto px-10 py-4 bg-white/10 dark:bg-white/5 border border-slate-300/50 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-black uppercase tracking-widest transition-all duration-500 backdrop-blur-xl flex items-center justify-center hover:bg-white/20 dark:hover:bg-white/10 rounded-xl">
                  {t('btn_pricing')}
                </Link>
              </motion.div>

              {/* Quick Nav - Immersive */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="flex flex-wrap gap-4 pt-4 border-t border-slate-200/50 dark:border-white/5"
              >
                {[
                  { label: t('home_nav_features'), href: "#features" },
                  { label: t('home_nav_plan'), href: "#business-plan" },
                  { label: t('home_nav_stories'), href: "#testimonials" }
                ].map((link, idx) => (
                  <a
                    key={idx}
                    href={link.href}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Side: Visual Data Display */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:block relative"
            >
              <div className="absolute -inset-20 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[100px] animate-pulse-slow" />

              <div className="relative group perspective-1000">
                <motion.div
                  whileHover={{ rotateY: -10, rotateX: 5 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
                >
                  {/* Internal Grid Lines */}
                  <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 opacity-20" />

                  <div className="relative space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Scanning: ACTIVE</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">Smart Analysis</div>
                      </div>
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <Zap size={24} className="text-emerald-500 animate-pulse" />
                      </div>
                    </div>

                    <div className="h-64 relative bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden group">
                      <img 
                        src="https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                        alt="AI Strategic Analysis" 
                        className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-1000" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                        <div className="text-white">
                          <div className="text-xs font-bold opacity-70">Saturation Level</div>
                          <div className="text-xl font-black">Low - 14.3%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] px-2 py-0.5 bg-emerald-500 rounded-full text-white font-bold mb-1">RECOMMENDED</div>
                          <div className="text-emerald-400 font-black">HIGH PROFIT</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Growth Index</div>
                        <div className="text-lg font-black text-slate-900 dark:text-white">+284%</div>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Demand Score</div>
                        <div className="text-lg font-black text-slate-900 dark:text-white">9.4 / 10</div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Elements around the visual */}
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-6 -right-6 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl"
                >
                  <Star className="text-emerald-500 fill-emerald-500" size={20} />
                </motion.div>

                <motion.div
                  animate={{ y: [0, 15, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  className="absolute -bottom-10 -left-6 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl"
                >
                  <ShieldCheck className="text-emerald-500" size={24} />
                </motion.div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 2. SIMPLE MARKET TOOLS */}
      <section id="features" className="w-full responsive-container ultra-compact-section scroll-mt-20">
        <div className="grid lg:grid-cols-2 compact-gap-6 items-center">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="whileInView"
            className="compact-space-y-4"
          >
            <div className="inline-flex items-center compact-gap-2 compact-p-3 rounded-full bg-emerald-500/15 dark:bg-emerald-500/10 border border-emerald-500/30 dark:border-emerald-500/20 compact-text-xs font-black text-emerald-600 dark:text-emerald-400 tracking-[0.3em] uppercase shadow-lg">
              <Globe2 size={12} /> {t('dash_neural_input')}
            </div>
            <h2 className="compact-text-3xl sm:compact-text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.85] drop-shadow-sm">
              {t('feat_title')}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 compact-text-base font-medium leading-relaxed drop-shadow-sm">{t('feat_subtitle')}</p>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              className="grid grid-cols-1 sm:grid-cols-2 compact-gap-4"
            >
              <motion.div
                variants={fadeInUp}
                whileHover={{
                  scale: 1.03,
                  y: -8,
                  boxShadow: "0 25px 50px rgba(16, 185, 129, 0.15)"
                }}
                transition={{ duration: 0.3 }}
                className="compact-card bg-white/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 compact-space-y-3 cursor-pointer transition-all duration-300 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30 shadow-lg hover:shadow-xl backdrop-blur-sm"
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-10 h-10 rounded-xl bg-emerald-600/15 dark:bg-emerald-600/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg"
                >
                  <Network size={16} />
                </motion.div>
                <h4 className="compact-text-lg font-black text-slate-900 dark:text-white">{t('feat_1_title')}</h4>
                <p className="compact-text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{t('feat_1_desc')}</p>
              </motion.div>
              <motion.div
                variants={fadeInUp}
                whileHover={{
                  scale: 1.03,
                  y: -8,
                  boxShadow: "0 25px 50px rgba(16, 185, 129, 0.15)"
                }}
                transition={{ duration: 0.3 }}
                className="compact-card bg-white/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 compact-space-y-3 cursor-pointer transition-all duration-300 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30 shadow-lg hover:shadow-xl backdrop-blur-sm"
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-10 h-10 rounded-xl bg-emerald-600/15 dark:bg-emerald-600/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg"
                >
                  <Layers size={16} />
                </motion.div>
                <h4 className="compact-text-lg font-black text-slate-900 dark:text-white">{t('feat_2_title')}</h4>
                <p className="compact-text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{t('feat_2_desc')}</p>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-emerald-600/10 dark:bg-emerald-600/5 rounded-full blur-[50px] animate-pulse" />
            <img
              src="https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              alt="Predictive Market Intelligence"
              className="compact-img relative border border-slate-200/50 dark:border-slate-700/50 shadow-2xl transform -rotate-1 hover:rotate-0 transition-transform duration-500 w-full backdrop-blur-sm max-h-[350px] md:max-h-none object-cover rounded-2xl"
            />
            {/* Overlay Stat Card Removed (V7.4) */}
          </motion.div>
        </div>
      </section>

      {/* 3. YOUR STEP-BY-STEP PLAN */}
      <section id="business-plan" className="w-full bg-slate-100/80 dark:bg-slate-900/50 ultra-compact-section border-y border-slate-200/80 dark:border-slate-700/50 transition-colors duration-500 scroll-mt-20 backdrop-blur-sm">
        <div className="responsive-container grid md:grid-cols-2 compact-gap-6 items-center">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="whileInView"
            className="order-2 md:order-1 relative group"
          >
            <div className="absolute inset-0 bg-indigo-500/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all" />
            <img
              src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              alt="Co-Pilot Strategic Execution"
              className="compact-img relative border border-slate-200/50 dark:border-slate-700/50 shadow-2xl w-full backdrop-blur-sm max-h-[350px] md:max-h-none object-cover rounded-3xl grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
            />
          </motion.div>

          <div className="order-1 md:order-2 compact-space-y-4">
            <div className="inline-flex items-center compact-gap-2 compact-p-3 rounded-full bg-indigo-500/15 dark:bg-indigo-500/10 border border-indigo-500/30 dark:border-indigo-500/20 compact-text-xs font-black text-indigo-600 dark:text-indigo-400 tracking-[0.3em] uppercase shadow-lg">
              <Cpu size={12} /> EASY PLANNER
            </div>
            <h2 className="compact-text-3xl sm:compact-text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.85] drop-shadow-sm">
              {t('road_directive')}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 compact-text-base font-medium leading-relaxed drop-shadow-sm">{t('road_confirmed_desc')}</p>

            <ul className="compact-space-y-4 relative">
              {[
                { title: t('feat_1_title'), desc: t('feat_1_desc'), delay: 0.1 },
                { title: t('feat_2_title'), desc: t('feat_2_desc'), delay: 0.2 },
                { title: t('feat_3_title'), desc: t('feat_3_desc'), delay: 0.3 }
              ].map((item, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  whileHover={{ x: 8 }}
                  transition={{ delay: item.delay, duration: 0.3 }}
                  className="flex compact-gap-4 group cursor-pointer relative"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    transition={{ duration: 0.3 }}
                    className="w-10 h-10 bg-white/80 dark:bg-slate-800/50 group-hover:bg-indigo-600/20 dark:group-hover:bg-indigo-600/15 rounded-xl flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700/50 transition-all shadow-lg backdrop-blur-sm"
                  >
                    <Zap size={16} className="text-indigo-600 dark:text-indigo-400" />
                  </motion.div>
                  <div className="group-hover:translate-x-2 transition-transform duration-300">
                    <h4 className="compact-text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">{item.title}</h4>
                    <p className="compact-text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{item.desc}</p>
                  </div>

                  {/* Workflow connector line */}
                  {idx < 2 && (
                    <motion.div
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      transition={{ delay: item.delay + 0.3, duration: 0.5 }}
                      className="absolute left-5 mt-10 w-0.5 h-6 bg-gradient-to-b from-indigo-600/50 dark:from-indigo-400/50 to-transparent origin-top"
                    />
                  )}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 4. FEATURES SHOWCASE - Ultra Compact */}
      <section id="showcase" className="w-full responsive-container ultra-compact-section scroll-mt-20">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="whileInView"
          className="text-center compact-space-y-4 mb-8"
        >
          <div className="inline-flex items-center compact-gap-2 compact-p-3 rounded-full bg-blue-500/15 dark:bg-blue-500/10 border border-blue-500/30 dark:border-blue-500/20 compact-text-xs font-black text-blue-600 dark:text-blue-400 tracking-[0.3em] uppercase shadow-lg">
            <Zap size={12} /> {t('home_feat_badge')}
          </div>
          <h2 className="compact-text-3xl sm:compact-text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.85] drop-shadow-sm">
            {t('home_feat_title_1')} <br />
            <span className="text-blue-600 dark:text-blue-400 italic">{t('home_feat_title_2')}</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-300 compact-text-base font-medium max-w-3xl mx-auto leading-relaxed px-2 drop-shadow-sm">
            {t('home_feat_desc')}
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 compact-gap-4"
        >
          {[
            {
              icon: <Globe2 size={20} />,
              title: t('home_feat_1_title'),
              description: t('home_feat_1_desc'),
              color: "emerald",
              delay: 0.1
            },
            {
              icon: <Cpu size={20} />,
              title: t('home_feat_2_title'),
              description: t('home_feat_2_desc'),
              color: "blue",
              delay: 0.2
            },
            {
              icon: <Rocket size={20} />,
              title: t('home_feat_3_title'),
              description: t('home_feat_3_desc'),
              color: "purple",
              delay: 0.3
            },
            {
              icon: <Network size={20} />,
              title: t('home_feat_4_title'),
              description: t('home_feat_4_desc'),
              color: "indigo",
              delay: 0.4
            },
            {
              icon: <Layers size={20} />,
              title: t('home_feat_5_title'),
              description: t('home_feat_5_desc'),
              color: "rose",
              delay: 0.5
            },
            {
              icon: <Zap size={20} />,
              title: t('home_feat_6_title'),
              description: t('home_feat_6_desc'),
              color: "indigo",
              delay: 0.6
            }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              whileHover={{
                y: -12,
                scale: 1.03,
                rotateY: 3,
                boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.25)"
              }}
              transition={{ duration: 0.3 }}
              className="group relative compact-feature-card bg-white/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:shadow-2xl backdrop-blur-sm rounded-xl"
            >
              {/* Animated background gradient */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                whileHover={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-600/10 dark:from-blue-500/10 dark:to-purple-600/15 rounded-xl"
              />

              <motion.div
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-12 h-12 rounded-xl bg-blue-500/15 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-lg"
              >
                {feature.icon}
              </motion.div>

              <div className="relative z-10">
                <motion.h3
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.3 }}
                  className="compact-text-lg font-black text-slate-900 dark:text-white mb-2 tracking-tight"
                >
                  {feature.title}
                </motion.h3>
                <motion.p
                  whileHover={{ x: 5 }}
                  transition={{ delay: 0.05, duration: 0.3 }}
                  className="compact-text-sm text-slate-600 dark:text-slate-300 leading-relaxed"
                >
                  {feature.description}
                </motion.p>
              </div>

              {/* Interactive hover indicator */}
              <motion.div
                initial={{ width: 0 }}
                whileHover={{ width: "100%" }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-b-xl"
              />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 5. TESTIMONIALS SECTION - Ultra Compact */}
      <section id="testimonials" className="w-full bg-slate-100/80 dark:bg-slate-900/50 ultra-compact-section border-y border-slate-200/80 dark:border-slate-700/50 transition-colors duration-500 scroll-mt-20 backdrop-blur-sm">
        <div className="responsive-container">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="whileInView"
            className="text-center compact-space-y-4 mb-8"
          >
            <div className="inline-flex items-center compact-gap-2 compact-p-3 rounded-full bg-purple-500/15 dark:bg-purple-500/10 border border-purple-500/30 dark:border-purple-500/20 compact-text-xs font-black text-purple-600 dark:text-purple-400 tracking-[0.3em] uppercase shadow-lg">
              <Star size={12} /> {t('home_story_badge')}
            </div>
            <h2 className="compact-text-3xl sm:compact-text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.85] drop-shadow-sm">
              {t('home_story_title_1')} <br />
              <span className="text-slate-500 dark:text-slate-400">{t('home_story_title_2')}</span>
            </h2>
          </motion.div>

          <div className="relative">
            {/* Testimonials Carousel - Compact */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 compact-gap-4"
            >
              {[
                {
                  name: "Sarah Chen",
                  role: t('home_story_1_role'),
                  location: "San Francisco, CA",
                  quote: t('home_story_1_quote'),
                  revenue: "$45K/month",
                  avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150",
                  delay: 0.1
                },
                {
                  name: "Marcus Rodriguez",
                  role: t('home_story_2_role'),
                  location: "Austin, TX",
                  quote: t('home_story_2_quote'),
                  revenue: "$12K/month",
                  avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150",
                  delay: 0.2
                },
                {
                  name: "Emily Johnson",
                  role: t('home_story_3_role'),
                  location: "Denver, CO",
                  quote: t('home_story_3_quote'),
                  revenue: "$28K/month",
                  avatar: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150",
                  delay: 0.3
                }
              ].map((testimonial, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeInUp}
                  whileHover={{
                    y: -8,
                    scale: 1.02,
                    rotateY: 3,
                    boxShadow: "0 25px 50px -12px rgba(139, 92, 246, 0.25)"
                  }}
                  transition={{ duration: 0.3 }}
                  className="group relative compact-testimonial bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 hover:border-purple-500/30 dark:hover:border-purple-500/20 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:shadow-2xl backdrop-blur-sm rounded-xl"
                >
                  {/* Animated background */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 dark:from-purple-500/10 dark:to-pink-500/10 rounded-xl"
                  />

                  {/* Floating quote marks */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 0.1, scale: 1 }}
                    whileHover={{ opacity: 0.2, scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                    className="absolute top-3 right-3 text-3xl font-black text-purple-500 dark:text-purple-400 leading-none"
                  >
                    "
                  </motion.div>

                  <div className="relative z-10">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center compact-gap-3 mb-4"
                    >
                      <motion.img
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-10 h-10 rounded-full border-2 border-purple-500/30 dark:border-purple-500/20 group-hover:border-purple-500/50 dark:group-hover:border-purple-500/40 transition-colors duration-300 shadow-lg"
                      />
                      <div>
                        <motion.h4
                          whileHover={{ x: 5 }}
                          transition={{ duration: 0.3 }}
                          className="compact-text-sm font-black text-slate-900 dark:text-white"
                        >
                          {testimonial.name}
                        </motion.h4>
                        <motion.p
                          whileHover={{ x: 5 }}
                          transition={{ delay: 0.05, duration: 0.3 }}
                          className="compact-text-xs text-slate-600 dark:text-slate-300"
                        >
                          {testimonial.role}
                        </motion.p>
                        <motion.p
                          whileHover={{ x: 5 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                          className="compact-text-xs text-purple-600 dark:text-purple-400 font-bold"
                        >
                          {testimonial.location}
                        </motion.p>
                      </div>
                    </motion.div>

                    <motion.blockquote
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.3 }}
                      className="compact-text-sm text-slate-700 dark:text-slate-200 leading-relaxed mb-4 italic relative z-10"
                    >
                      "{testimonial.quote}"
                    </motion.blockquote>

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-between pt-3 border-t border-slate-200/80 dark:border-slate-700/50"
                    >
                      <span className="compact-text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t('home_story_revenue_label')}
                      </span>
                      <motion.span
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                        className="compact-text-lg font-black text-emerald-600 dark:text-emerald-400"
                      >
                        {testimonial.revenue}
                      </motion.span>
                    </motion.div>
                  </div>

                  {/* Success indicator */}
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    transition={{ delay: testimonial.delay + 0.5, duration: 1 }}
                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-b-xl"
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. FINAL CTA - Compact */}
      <section id="get-started" className="w-full min-h-[60vh] sm:min-h-[70vh] flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-t border-slate-200 dark:border-white/5 pt-24 sm:pt-32 pb-20">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/20 dark:bg-emerald-500/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 dark:opacity-20 mix-blend-overlay" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center max-w-5xl mx-auto px-4 sm:px-6"
        >
          {/* Floating Stats with Counters - Compact */}
          <div className="flex flex-wrap justify-center gap-4 md:block mb-10 md:mb-0">
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              whileInView={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ delay: 0.2 }}
              className="md:absolute md:top-20 md:-left-24 lg:-left-40 p-3 rounded-xl bg-white/90 dark:bg-white/5 border border-slate-300 dark:border-white/10 backdrop-blur-xl group cursor-pointer shadow-2xl z-20"
            >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", bounce: 0.5 }}
              className="text-lg font-black text-emerald-600 dark:text-emerald-400"
            >
              <CountUp end={10000} duration={2} suffix="+" />
            </motion.div>
            <div className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider">Businesses Launched</div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-600 dark:bg-emerald-400 rounded-full opacity-50"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05, rotate: -2 }}
            transition={{ delay: 0.4 }}
            className="md:absolute md:top-20 md:-right-24 lg:-right-40 p-3 rounded-xl bg-white/90 dark:bg-white/5 border border-slate-300 dark:border-white/10 backdrop-blur-xl group cursor-pointer shadow-2xl z-20"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ delay: 0.7, type: "spring", bounce: 0.5 }}
              className="text-lg font-black text-blue-600 dark:text-blue-400"
            >
              $<CountUp end={2.5} decimals={1} duration={2.5} suffix="B+" />
            </motion.div>
            <div className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider">Revenue Generated</div>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute -top-1 -left-1 w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full opacity-50"
            />
          </motion.div>
          </div>

          {/* Main Content - Compact */}
          <div className="space-y-6 sm:space-y-8 pt-10 md:pt-20 lg:pt-32">

            {/* Title */}
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9]">
                {t('banner_title')}
              </h2>
              <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base md:text-lg font-medium max-w-3xl mx-auto leading-relaxed">
                {t('banner_desc')}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <button
                onClick={handleStartScan}
                className="group px-8 py-3 sm:px-10 sm:py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-black uppercase tracking-wider shadow-[0_15px_30px_-10px_rgba(16,185,129,0.4)] hover:-translate-y-2 hover:scale-105 transition-all duration-500 active:scale-95 flex items-center gap-2"
              >
                <Rocket size={16} className="group-hover:rotate-12 transition-transform" />
                {t('banner_btn')}
              </button>

              <Link
                href="/acquisition-tiers"
                className="px-8 py-3 sm:px-10 sm:py-4 rounded-xl bg-slate-200/80 dark:bg-white/10 border border-slate-300/50 dark:border-white/20 text-slate-800 dark:text-white hover:bg-slate-300/80 dark:hover:bg-white/20 text-sm font-black uppercase tracking-wider transition-all duration-500 backdrop-blur-xl flex items-center justify-center hover:-translate-y-1"
              >
                {t('btn_pricing')}
              </Link>
            </div>

            {/* Success Rate Badge with Animation - Compact */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ delay: 1, type: "spring", bounce: 0.4 }}
              className="flex justify-center pt-10 sm:pt-16"
            >
              <div className="relative inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-white/95 dark:bg-white/5 border border-slate-300 dark:border-white/10 backdrop-blur-xl group cursor-pointer shadow-xl">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: 1.2, type: "spring", bounce: 0.6 }}
                  className="text-xl font-black text-purple-600 dark:text-purple-400"
                >
                  <CountUp end={98.7} decimals={1} duration={3} suffix="%" />
                </motion.div>
                <div className="text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider font-bold">Success Rate</div>

                {/* Animated success indicators */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-1 -right-1 w-3 h-3 border-2 border-purple-600 dark:border-purple-400 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-purple-600 dark:bg-purple-400 rounded-full"
                />
              </div>
            </motion.div>

            {/* Trust Indicators with Animations - Compact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
              className="flex flex-wrap justify-center items-center gap-6 pt-4"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-1.5 bg-green-600 dark:bg-green-500 rounded-full"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Live Data
                </span>
              </motion.div>
              <div className="h-3 w-px bg-slate-400 dark:bg-slate-600"></div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <ShieldCheck size={12} className="text-blue-600 dark:text-blue-400" />
                </motion.div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Secure & Private
                </span>
              </motion.div>
              <div className="h-3 w-px bg-slate-400 dark:bg-slate-600"></div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap size={12} className="text-blue-600 dark:text-blue-400" />
                </motion.div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Instant Results
                </span>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

    </div>
  );
}