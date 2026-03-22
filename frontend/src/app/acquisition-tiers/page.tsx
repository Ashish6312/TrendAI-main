"use client";

import React from "react";
import { Check, X, Crown, Zap, Building2, ArrowRight, Star, TrendingUp, Shield, Users, Target, Rocket, MapPin, Globe, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useNotifications } from "@/context/NotificationContext";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRazorpay } from "@/hooks/useRazorpay";
import { useSession } from "next-auth/react";
import { getPricingForCountry, formatPrice, getSavingsPercentage, CountryPricing } from "@/utils/locationPricing";

export default function AcquisitionTiers() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const { initiatePayment } = useRazorpay();
  const { userLocation } = useNotifications();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPricing, setCurrentPricing] = useState<CountryPricing | null>(null);
  const [profileLocation, setProfileLocation] = useState<string | null>(null);

  // 1. Prioritize profile location from session/user record
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.email) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/users/${session.user.email}`);
        if (response.ok) {
          const data = await response.json();
          if (data.location) {
            setProfileLocation(data.location);
          }
        }
      } catch (e) {
        console.error("Profile sync failed:", e);
      }
    };
    fetchProfile();
  }, [session]);

  // 2. Update pricing based on prioritized location
  useEffect(() => {
    // Priority: 
    // 1. Manually filled profile location
    // 2. IP-detected userLocation
    const effectiveLocation = profileLocation || userLocation?.country;
    
    if (effectiveLocation) {
      const pricing = getPricingForCountry(effectiveLocation);
      setCurrentPricing(pricing);
    }
  }, [userLocation, profileLocation]);

  // Use default pricing if location not available
  const pricing = currentPricing || getPricingForCountry('Global');

  const handlePayment = async (tier: any) => {
    if (tier.price === 0) {
      // Free tier - redirect to dashboard
      window.location.href = '/dashboard';
      return;
    }

    if (!session?.user) {
      // Redirect to login
      window.location.href = '/api/auth/signin';
      return;
    }

    setLoading(tier.id);

    try {
      await initiatePayment({
        amount: tier.price,
        currency: pricing.currency,
        planName: tier.name,
        billingCycle,
        customerName: session.user.name || '',
        customerEmail: session.user.email || '',
      });
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const tiers = [
    {
      id: "starter",
      name: t('price_starter'),
      tagline: t('price_starter_desc'),
      price: pricing.free.price,
      originalPrice: null,
      icon: <Target size={32} />,
      color: "gray",
      popular: false,
      features: [
        { text: t('price_searches'), available: true },
        { text: t('price_recs'), available: true },
        { text: t('price_google'), available: true },
        { text: t('price_free'), available: true },
        { text: t('price_adv_data'), available: false },
        { text: t('price_sent'), available: false },
        { text: t('price_comp'), available: false },
        { text: t('price_export'), available: false }
      ],
      cta: t('nav_login'),
      href: "/dashboard",
      description: t('price_starter_desc')
    },
    {
      id: "professional",
      name: t('price_pro'),
      tagline: t('price_pro_desc'),
      price: billingCycle === "monthly" ? pricing.professional.monthly : pricing.professional.yearly,
      originalPrice: billingCycle === "monthly" ? pricing.professional.originalMonthly : pricing.professional.originalYearly,
      icon: <Rocket size={32} />,
      color: "emerald",
      popular: true,
      features: [
        { text: t('price_unlimited'), available: true },
        { text: t('price_recs'), available: true },
        { text: t('price_adv_data'), available: true },
        { text: t('price_sent'), available: true },
        { text: t('price_comp'), available: true },
        { text: t('price_export'), available: true },
        { text: t('price_feat_support'), available: true },
        { text: t('price_feat_api'), available: false }
      ],
      cta: t('price_upgrade'),
      href: "/dashboard",
      description: t('price_pro_desc')
    },
    {
      id: "enterprise",
      name: t('price_enterprise'),
      tagline: t('price_enterprise_desc'),
      price: billingCycle === "monthly" ? pricing.enterprise.monthly : pricing.enterprise.yearly,
      originalPrice: billingCycle === "monthly" ? pricing.enterprise.originalMonthly : pricing.enterprise.originalYearly,
      icon: <Crown size={32} />,
      color: "purple",
      popular: false,
      features: [
        { text: t('price_unlimited'), available: true },
        { text: t('price_feat_api'), available: true },
        { text: t('price_export'), available: true },
        { text: t('price_feat_support'), available: true },
        { text: t('price_feat_multi'), available: true },
        { text: t('price_custom'), available: true },
        { text: t('price_contact'), available: true }
      ],
      cta: t('price_contact'),
      href: "/dashboard",
      description: t('price_enterprise_desc')
    }
  ];

  const savingsAmount = billingCycle === "yearly" && pricing.professional.monthly && pricing.professional.yearly 
    ? getSavingsPercentage(pricing.professional.monthly, pricing.professional.yearly)
    : 0;

  const savings = savingsAmount > 0 ? `${savingsAmount}%` : "";

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] relative selection:bg-emerald-500/30 overflow-x-hidden transition-colors duration-500">
      {/* Immersive Background Architecture */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-purple-600/10 dark:bg-purple-600/5 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] dark:opacity-[0.02] mix-blend-overlay" />
        
        {/* Animated Grid Path */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10">
        {/* Hero Section - Compact */}
        <div className="responsive-container navbar-aware pb-16">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8 md:space-y-12"
          >
            <div className="flex flex-col items-center gap-8">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[var(--background)] bg-slate-800 flex items-center justify-center overflow-hidden shadow-lg">
                      <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400">{t('price_trusted')}</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{t('price_partnerships')}</span>
                </div>
              </motion.div>
 
              <h1 className="responsive-text-5xl md:responsive-text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight italic">
                {t('price_title')}
              </h1>
 
              <p className="responsive-text-base md:responsive-text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed tracking-tight px-4 opacity-80 dark:opacity-60">
                {t('price_subtitle')}
              </p>
            </div>
            
            {/* Precision Stats - Compact Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 max-w-4xl mx-auto w-full items-center divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-white/5">
              {[
                { label: t('price_stat_capital'), value: "₹2,300Cr+", color: "text-emerald-600 dark:text-emerald-400", sub: "India Flow" },
                { label: t('price_stat_market'), value: "94%", color: "text-blue-600 dark:text-blue-400", sub: "AI Accuracy" },
                { label: t('price_stat_precision'), value: "99.9%", color: "text-purple-600 dark:text-purple-400", sub: "Reliability" }
              ].map((stat, i) => (
                <div key={i} className="px-6 py-4 md:py-0 text-center group cursor-default transition-all">
                  <div className={`responsive-text-2xl md:responsive-text-3xl font-black ${stat.color} tracking-tighter group-hover:scale-110 transition-transform duration-700 mb-1`}>{stat.value}</div>
                  <div className="text-[9px] text-slate-900 dark:text-slate-200 font-black uppercase tracking-[0.2em] italic">{stat.label}</div>
                  <div className="text-[7px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-[0.1em] mt-1">{stat.sub}</div>
                </div>
              ))}
            </div>
 
            {/* Billing Switcher - Compact */}
            <div className="relative flex flex-col items-center gap-8 pt-6">
              <div className="relative group">
                {savings && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute left-[72%] -top-12 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center"
                  >
                    <div className="bg-emerald-500 text-white text-[9px] font-black px-4 py-2 rounded-full shadow-[0_15px_30px_-5px_rgba(16,185,129,0.4)] border border-white/20 whitespace-nowrap flex items-center gap-1">
                      <Zap size={10} fill="currentColor" /> SAVE {savings}
                    </div>
                    <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-emerald-500 -mt-0.5" />
                  </motion.div>
                )}
 
                <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-100 dark:bg-white/[0.03] border border-slate-300 dark:border-white/10 backdrop-blur-3xl shadow-xl relative">
                  <button 
                    onClick={() => setBillingCycle('monthly')}
                    className={`relative z-10 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400 hover:text-white'}`}
                  >
                    {billingCycle === 'monthly' && (
                      <motion.div layoutId="activeTab" className="absolute inset-0 bg-white rounded-xl shadow-lg" />
                    )}
                    <span className="relative z-20">{t('price_bill_monthly')}</span>
                  </button>
                  <button 
                    onClick={() => setBillingCycle('yearly')}
                    className={`relative z-10 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${billingCycle === 'yearly' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    {billingCycle === 'yearly' && (
                      <motion.div layoutId="activeTab" className="absolute inset-0 bg-emerald-500 rounded-xl shadow-[0_10px_20px_rgba(16,185,129,0.3)]" />
                    )}
                    <span className="relative z-20">{t('price_bill_yearly')}</span>
                  </button>
                </div>
              </div>
 
              {userLocation?.country && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 bg-slate-900/5 dark:bg-white/[0.02] px-6 py-3 rounded-2xl border border-slate-900/10 dark:border-white/5 italic shadow-lg backdrop-blur-3xl"
                >
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-500">
                    <Globe size={14} className="animate-pulse" /> 
                  </div>
                  <span className="flex items-center gap-2">
                    Region: <span className="text-slate-900 dark:text-slate-200">{profileLocation || userLocation?.country || 'India'}</span>
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
 
        {/* Pricing Matrix - Professional Layout */}
        <div className="responsive-container navbar-aware pb-12 border-t border-slate-200 dark:border-white/5 mt-12 relative overflow-visible">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#020617] px-6 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-800 italic border-x border-slate-200 dark:border-white/5">
            Choose Your Plan
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
                transition={{ delay: index * 0.05 }}
                className={`group relative flex flex-col rounded-xl backdrop-blur-3xl border transition-all duration-300 h-full ${
                  tier.popular 
                    ? 'bg-gradient-to-b from-emerald-500/10 via-white/80 to-white/95 dark:from-emerald-500/10 dark:via-slate-900/90 dark:to-slate-900/95 border-emerald-500/30 shadow-[0_10px_25px_-5px_rgba(16,185,129,0.2)] z-20' 
                    : 'bg-white/80 dark:bg-slate-900/60 border-slate-300 dark:border-white/5 hover:border-slate-400 dark:hover:border-white/10 shadow-lg'
                }`}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-40">
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.1em] shadow-lg border border-white/20 whitespace-nowrap">
                      {t('price_most_popular')}
                    </div>
                  </div>
                )}

                {/* Card Content */}
                <div className="flex-1 flex flex-col p-4 relative z-20">
                  
                  {/* Header Section */}
                  <div className="text-center mb-4">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-3 transition-all duration-200 ${
                      tier.id === 'professional' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                      tier.id === 'enterprise' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400' :
                      'bg-slate-200 dark:bg-slate-800/80 text-slate-500 dark:text-slate-500'
                    }`}>
                      {React.cloneElement(tier.icon, { size: 20 })}
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight italic mb-1">{tier.name}</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-[8px] font-bold uppercase tracking-wide">{tier.tagline}</p>
                  </div>

                  {/* Pricing Section */}
                  <div className="text-center mb-4">
                    <div className="bg-slate-100 dark:bg-white/[0.02] rounded-lg p-3 border border-slate-200 dark:border-white/5">
                      {tier.originalPrice && (
                        <div className="text-slate-400 dark:text-slate-600 text-[10px] font-bold line-through mb-1 opacity-60">
                          {formatPrice(tier.originalPrice, pricing)}
                        </div>
                      )}
                      <div className="flex items-baseline justify-center gap-1 mb-1">
                        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                          {typeof tier.price === 'number' ? formatPrice(tier.price, pricing).split('.')[0] : tier.price}
                        </span>
                        {typeof tier.price === 'number' && tier.price > 0 && (
                          <span className="text-slate-500 dark:text-slate-400 font-bold text-[8px] uppercase">/mo</span>
                        )}
                      </div>
                      {billingCycle === 'yearly' && typeof tier.price === 'number' && tier.price > 0 && (
                        <div className="text-[7px] font-bold text-slate-400 dark:text-slate-600 uppercase">{t('price_bill_annually')}</div>
                      )}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="mb-4">
                    <button
                      onClick={() => handlePayment(tier)}
                      disabled={loading === tier.id}
                      className={`w-full group relative overflow-hidden px-4 py-2.5 rounded-lg font-black text-[8px] uppercase tracking-[0.1em] transition-all duration-300 active:scale-95 ${
                        tier.popular
                          ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-emerald-500/20'
                          : 'bg-white dark:bg-white/5 text-slate-900 dark:text-white border border-slate-300 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 shadow-sm'
                      }`}
                    >
                      <span className="relative z-20 flex items-center justify-center gap-1.5 group-hover:gap-2 transition-all">
                        {loading === tier.id ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <>
                            {tier.cta}
                            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                          </>
                        )}
                      </span>
                    </button>
                  </div>

                  {/* Features List */}
                  <div className="flex-1">
                    <div className="space-y-2">
                      {tier.features.slice(0, 6).map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 group/item">
                          <div className={`mt-0.5 flex-shrink-0 w-3 h-3 rounded flex items-center justify-center transition-all duration-150 ${
                            feature.available 
                              ? tier.id === 'professional' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                tier.id === 'enterprise' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                                'bg-slate-200 dark:bg-slate-600/20 text-slate-600 dark:text-slate-400'
                              : 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-700'
                          }`}>
                            {feature.available ? <Check size={6} strokeWidth={3} /> : <X size={6} strokeWidth={3} />}
                          </div>
                           <span className={`text-[9px] font-medium tracking-tight leading-tight transition-all ${
                            feature.available 
                              ? 'text-slate-600 dark:text-slate-300' 
                              : 'text-slate-300 dark:text-slate-700 line-through opacity-40'
                          }`}>
                            {feature.text}
                          </span>
                        </div>
                      ))}
                      {tier.features.length > 6 && (
                        <div className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide text-center pt-1 border-t border-slate-200/50 dark:border-white/5 mt-2">
                          +{tier.features.length - 6} More Features
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Trust Footer */}
                  <div className="pt-3 mt-auto flex items-center justify-center gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                     <Shield size={8} className="text-emerald-600 dark:text-emerald-500" />
                     <span className="text-[7px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">Secure</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategic Advantage Section - High Engagement Utility */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border-y border-slate-200 dark:border-white/5 py-32 backdrop-blur-3xl relative overflow-hidden transition-colors duration-500">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.05),transparent_50%)]" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-24 space-y-4">
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 dark:text-emerald-500 italic">Competitive Edge</div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white italic tracking-tighter">Why Settle for Average?</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto">Deploy the most advanced market acquisition tools in the industry.</p>
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: <TrendingUp size={40} />,
                title: "Capital Capture Engine",
                description: "Our neural algorithms identified ₹2,340Cr in high-conviction market opportunities last fiscal quarter alone.",
                color: "emerald"
              },
              {
                icon: <Shield size={40} />,
                title: "Risk Mitigation Shield",
                description: "Sovereign performance guarantee. If our tactical insights don't clarify your path, we reset your capital flow.",
                color: "blue"
              },
              {
                icon: <Users size={40} />,
                title: "Global Node Network",
                description: "Distributed neural processing across 50+ regional sub-sectors with real-time institutional synchronization.",
                color: "purple"
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                  className="group p-10 rounded-[2.5rem] bg-slate-900/5 dark:bg-white/[0.02] border border-slate-900/10 dark:border-white/5 hover:bg-slate-900/10 dark:hover:bg-white/[0.04] hover:border-slate-900/20 dark:hover:border-white/10 transition-all duration-500"
                >
                  <div className={`mb-8 inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-${benefit.color}-500/10 text-${benefit.color}-600 dark:text-${benefit.color}-400 group-hover:scale-110 group-hover:rotate-6 transition-all`}>
                    {benefit.icon}
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter mb-4">{benefit.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium opacity-90 dark:opacity-80">{benefit.description}</p>
                </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Intelligence FAQ - Professional Interaction */}
      <div className="py-32 relative">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-24 space-y-4">
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-600 dark:text-purple-500 italic">Common Questions</div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white italic tracking-tighter">Clarify Your Path</h2>
          </div>
 
          <div className="space-y-4">
            {[
              {
                question: "Can I change my plan later?",
                answer: "Yes. You can upgrade, downgrade, or cancel your subscription at any time from your account settings."
              },
              {
                question: "Is there a free plan?",
                answer: "The Starter plan is completely free forever. It's the perfect way to explore basic features."
              },
              {
                question: "Which institutional payment gateways are active?",
                answer: "We support Tier-1 sovereign credit networks, encrypted PayPal tunnels, and direct institutional wire transfers for absolute dominance."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-slate-900/5 dark:bg-white/[0.01] hover:bg-slate-900/10 dark:hover:bg-white/[0.03] rounded-3xl p-8 border border-slate-900/10 dark:border-white/5 hover:border-slate-900/20 dark:hover:border-white/10 transition-all duration-300"
              >
                <h3 className="text-lg font-black text-slate-900 dark:text-white italic tracking-tighter mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition-colors flex items-center justify-between">
                  {faq.question}
                  <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed opacity-90 dark:opacity-70">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Final Launch Sequence - Dramatic Engagement */}
      <div className="relative py-40 border-t border-slate-200 dark:border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-purple-500/5" />
        <div className="absolute -bottom-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/20 blur-[120px] rounded-full" />
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div className="space-y-6">
              <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white italic tracking-tighter leading-none">Execute Your <br /> Vision Now.</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">
                Terminal ready for launch. Join 10k+ founders already dominating their regional sectors.
              </p>
            </div>

            <button
              onClick={() => window.location.href = '/dashboard'}
              className="group relative inline-flex items-center gap-6 px-12 py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-xs uppercase tracking-[0.4em] rounded-[2rem] hover:scale-110 active:scale-95 transition-all shadow-[0_20px_60px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_rgba(255,255,255,0.2)]"
            >
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-r from-emerald-400 to-blue-500 opacity-0 group-hover:opacity-10 transition-opacity" />
              Start Your Journey
              <ArrowRight size={20} className="group-hover:translate-x-3 transition-transform" />
            </button>
            
            <div className="pt-8 flex items-center justify-center gap-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 italic">
               <Shield size={12} fill="currentColor" /> Encrypted Deployment Tunnel: Active
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}