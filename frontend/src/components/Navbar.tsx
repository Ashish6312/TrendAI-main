"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Languages, LogOut, Zap, Home, User, Settings, Moon, Sun, ChevronDown, X, Menu, LayoutDashboard, Bookmark, CreditCard } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useSubscription } from "@/context/SubscriptionContext";
import { useTheme } from "next-themes";
import { SystemStatusPulse } from "./GlobalFallbacks";
import { useSearch } from "@/context/SearchContext";

const languages = [
  { code: "English", name: "English" },
  { code: "Hindi", name: "हिन्दी" },
  { code: "Spanish", name: "Español" },
  { code: "French", name: "Français" },
  { code: "German", name: "Deutsch" },
];

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { plan, theme: subscriptionTheme, planFeatures, actualPlanName } = useSubscription();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { clearSearch } = useSearch();
  const [showLangs, setShowLangs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering theme-dependent content
  useEffect(() => {
    setMounted(true);
  }, []);


  // Click outside handlers
  const langRef = useClickOutside<HTMLDivElement>(useCallback(() => setShowLangs(false), []));
  const profileRef = useClickOutside<HTMLDivElement>(useCallback(() => setShowProfile(false), []));
  const mobileMenuRef = useClickOutside<HTMLDivElement>(useCallback(() => setShowMobileMenu(false), []));

  const toggleTheme = () => {
    // Correctly toggle based on visual state, not just stored state
    const current = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(current);
  };

  const isActivePage = (path: string) => {
    return pathname === path;
  };

  const navLinks = [
    { path: '/', label: t('nav_home'), icon: Home },
    { path: '/dashboard', label: t("nav_dashboard"), icon: LayoutDashboard },
    ...(session ? [{ path: '/profile?tab=vault', label: 'Vault', icon: Bookmark }] : []),
    { path: '/acquisition-tiers', label: t("nav_pricing"), icon: CreditCard },
  ];

  // Need to import Bookmark from lucide-react

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-slate-300 dark:border-white/5 bg-white/70 dark:bg-[#020617]/70 transition-all duration-300">
      {/* Primary Nav Content - Elevated Layer */}
      <div className="relative z-30 responsive-container px-4 sm:px-6 lg:px-8 h-14 sm:h-16 lg:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* LEFT: LOGO */}
        <div className="flex shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer" onClick={() => { clearSearch(); router.push('/'); }}>
            <div 
              className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-105 transition-all duration-300 overflow-hidden border border-white/10"
              style={{ 
                boxShadow: `0 0 40px -5px ${subscriptionTheme.primary}40`
              }}
            >
              <img 
                src="/brand-logo-v3.png" 
                className="w-full h-full object-contain" 
                alt="Startup Scope" 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tight leading-none">
                <span className="text-slate-900 dark:text-white">Startup</span>
                <span className="text-teal-400 dark:text-[#2dd4bf] drop-shadow-[0_0_15px_rgba(45,212,191,0.3)]">Scope</span>
              </span>
              {plan !== 'free' && (
                <span
                  className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest opacity-90 transition-colors"
                  style={{ color: subscriptionTheme.primary }}
                >
                  {actualPlanName || planFeatures.planName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CENTER: NAV LINKS (Desktop) */}
        <div className="hidden lg:flex flex-1 justify-center items-center gap-4 xl:gap-8">
          {navLinks.map((link) => {
            const isActive = isActivePage(link.path);
            return (
              <Link
                key={link.path}
                href={link.path}
                onClick={link.path !== '/dashboard' ? clearSearch : undefined}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-300 group relative ${isActive
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 bg-slate-900/5 dark:bg-white/[0.05] border border-slate-900/10 dark:border-white/10 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.02)]"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                
                {/* Hover Glow Effect */}
                {!isActive && (
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-slate-400/5 dark:bg-white/[0.02] rounded-2xl transition-all duration-300" />
                )}

                <span className="relative z-10">{link.label}</span>
                {link.icon && (
                  <link.icon 
                    size={14} 
                    className={`relative z-10 transition-all duration-300 ${
                      isActive 
                        ? 'text-teal-500 dark:text-[#2dd4bf] drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]' 
                        : 'text-slate-400 dark:text-gray-600 group-hover:text-teal-500 dark:group-hover:text-[#2dd4bf]'
                    }`} 
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* RIGHT: ACTIONS */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
          {/* Mobile Menu Button */}
          <div className="lg:hidden relative" ref={mobileMenuRef}>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-gray-500 hover:text-blue-500 rounded-xl transition-all"
            >
              <Menu size={20} />
            </button>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
              {showMobileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 mt-3 w-64 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/50 dark:border-slate-600/50 shadow-2xl navbar-dropdown overflow-hidden"
                >
                  <div className="space-y-2">
                    {navLinks.map((link) => {
                      const isActive = isActivePage(link.path);
                      return (
                        <Link
                          key={link.path}
                          href={link.path}
                          onClick={() => {
                            setShowMobileMenu(false);
                            if (link.path !== '/dashboard') clearSearch();
                          }}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${isActive
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50'
                              : 'text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                          {link.icon && <link.icon size={16} />}
                          <span>{link.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* System Status Pulse */}
          <div className="hidden md:block">
            <SystemStatusPulse />
          </div>

          {/* Dark/Light Mode Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200 dark:border-white/10 shadow-sm relative group overflow-hidden"
            title={mounted ? (resolvedTheme === 'dark' ? t('nav_theme_dark') : t('nav_theme_light')) : 'Theme Toggle'}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/0 via-blue-500/0 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            {mounted && resolvedTheme === 'dark' ? (
              <Sun size={16} className="relative z-10 text-amber-500" />
            ) : (
              <Moon size={16} className="relative z-10 text-slate-800" />
            )}
          </motion.button>

          {/* Language Selector - Disabled as requested */}
          {/* <div className="relative" ref={langRef}>
            <button 
              onClick={() => setShowLangs(!showLangs)}
              className="flex items-center gap-1.5 sm:gap-2.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full sm:rounded-full bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200 dark:border-white/10 shadow-sm"
            >
              <Languages size={14} className="text-blue-500" />
              <span className="hidden sm:inline">
                {languages.find(l => l.code === language)?.name}
              </span>
              <ChevronDown 
                size={10} 
                className={`text-slate-400 dark:text-gray-500 transition-transform duration-300 ${showLangs ? 'rotate-180' : ''}`} 
              />
            </button>

            <AnimatePresence>
              {showLangs && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 mt-3 w-56 sm:w-64 bg-white dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] overflow-hidden"
                  style={{
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <Languages size={16} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        {t("nav_select_lang")}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowLangs(false)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <X size={14} className="text-slate-400 dark:text-gray-500" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setShowLangs(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-300 flex items-center justify-between group relative overflow-hidden ${
                          language === lang.code 
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' 
                            : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 relative z-10">
                          <span className={`font-bold tracking-tight transition-colors ${language === lang.code ? 'text-blue-600 dark:text-blue-400' : 'group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                            {lang.name}
                          </span>
                        </div>
                        {language === lang.code && (
                          <motion.div 
                            layoutId="lang-active-dot"
                            className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)] relative z-10"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5">
                    <p className="text-[10px] text-slate-400 dark:text-gray-500 text-center font-black uppercase tracking-widest italic opacity-70">
                      {t('nav_sync_active')}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div> */}

          {/* Get Started Button */}
          {!session?.user && (
            <div className="flex items-center">
              <button
                onClick={() => router.push('/auth')}
                className="px-3 sm:px-4 lg:px-8 py-2 sm:py-2.5 lg:py-3.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:-translate-y-0.5 active:scale-95 whitespace-nowrap italic"
              >
                <span className="hidden sm:inline">{t('nav_get_started')}</span>
                <span className="sm:hidden">{t('auth_init')}</span>
              </button>
            </div>
          )}

          {/* Profile Dropdown */}
          {session?.user && (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 rounded-lg sm:rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-slate-300 dark:hover:border-white/10"
              >
                <div className="relative">
                  <img
                    src={session.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name || 'User')}&background=${subscriptionTheme.primary.slice(1)}&color=ffffff&size=200&bold=true`}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm object-cover"
                    alt="Profile"
                  />
                </div>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-200 hidden sm:block ${showProfile ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-64 bg-white dark:bg-[#0a0f25] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl z-[100] overflow-hidden"
                  >
                    {/* User Info Header */}
                    <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <img
                          src={session.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name || 'User')}&background=${subscriptionTheme.primary.slice(1)}&color=ffffff&size=200&bold=true`}
                          className="w-10 h-10 rounded-lg border border-slate-200 dark:border-white/10 object-cover"
                          alt="Profile"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {session.user.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {session.user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Simple Professional Plan Display */}
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t('nav_current_plan')}</span>
                          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{planFeatures.planName}</span>
                        </div>
                        {plan === 'free' ? (
                          <button
                            onClick={() => {
                              router.push('/acquisition-tiers');
                              setShowProfile(false);
                            }}
                            className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {t('nav_upgrade_btn')}
                          </button>
                        ) : (
                          <div className="p-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                            <Zap size={12} className="text-emerald-500" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Menu Items - Refined Professional Style */}
                    <div className="p-2">
                      <button
                        onClick={() => {
                          clearSearch();
                          router.push('/profile');
                          setShowProfile(false);
                        }}
                        className="w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all group"
                      >
                        <User size={16} className="mr-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                        {t("nav_profile")}
                      </button>

                      <div className="my-1 border-t border-slate-100 dark:border-white/5" />

                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all group"
                      >
                        <LogOut size={16} className="mr-3 opacity-70 group-hover:opacity-100 transition-opacity" />
                        {t("nav_logout")}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
