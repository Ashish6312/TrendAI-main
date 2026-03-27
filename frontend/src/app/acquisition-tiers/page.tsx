"use client";

import React, { useState, useEffect, Suspense } from "react";
import { 
  Check, X, Crown, Zap, Rocket, Star, Shield, 
  ArrowRight, ShieldCheck, CreditCard, Sparkles 
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useNotifications } from "@/context/NotificationContext";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import PaymentSuccessModal from "@/components/PaymentSuccessModal";
import { getApiUrl } from "@/config/api";

function AcquisitionTiersContent() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const { addNotification } = useNotifications();
  
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [loading, setLoading] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const isDark = resolvedTheme !== 'light';

  // Check for successful payment in URL on mount (V7.5)
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const planId = searchParams.get('plan');
    const paymentId = searchParams.get('checkout_id'); // Dodo callback param
    
    if (paymentStatus === 'success' && planId) {
      setPaymentDetails({
        payment_id: paymentId || 'DODO_' + Date.now(),
        order_id: 'ORDER_' + Date.now(),
        plan: planId,
        amount: planId === 'starter' ? '199' : '499',
        currency: 'INR',
        billing: billingCycle
      });
      setShowSuccessModal(true);
    }
  }, [searchParams]);

  const handlePayment = async (tier: any) => {
    if (!session?.user) {
      router.push('/api/auth/signin');
      return;
    }

    setLoading(tier.id);
    try {
      const apiUrl = getApiUrl();
      
      const dodoProductIdMap: Record<string, string> = {
        'starter': process.env.NEXT_PUBLIC_DODO_STARTER_ID || 'p_starter_placeholder',
        'professional': process.env.NEXT_PUBLIC_DODO_PROFESSIONAL_ID || 'p_professional_placeholder'
      };

      const resSession = await fetch(`${apiUrl}/api/dodo/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: dodoProductIdMap[tier.id] || tier.id,
          quantity: 1,
          email: session?.user?.email,
          name: session?.user?.name || 'Venture Partner',
          return_url: `${window.location.origin}/acquisition-tiers?payment=success&plan=${tier.id}`
        })
      });

      if (!resSession.ok) {
        const errorData = await resSession.json();
        throw new Error(errorData.detail || 'Failed to initialize Dodo checkout');
      }

      const sessionData = await resSession.json();
      
      if (sessionData && sessionData.checkout_url) {
        window.location.href = sessionData.checkout_url;
      } else {
        throw new Error('Dodo Checkout URL not found in response');
      }

    } catch (error: any) {
      console.error('Dodo Payment Error:', error);
      addNotification({
        type: 'payment',
        title: 'Payment Error',
        message: error.message || 'Payment initialization failed. Please try again.',
        priority: 'high'
      });
    } finally {
      setLoading(null);
    }
  };

  const tiers = [
    {
      id: "starter",
      name: "Starter",
      tagline: "Basic analytics for beginners",
      monthPrice: 199,
      yearPrice: 1799,
      originalMonth: 299,
      originalYear: 2999,
      dailyLabel: "Only ₹6/day",
      icon: <Zap className="w-6 h-6" />,
      color: "from-blue-500 to-cyan-400",
      popular: false,
      features: [
        { text: "100 recommendations/month", active: true },
        { text: "Daily market pulse", active: true },
        { text: "Community access", active: true },
        { text: "Standard support", active: true },
        { text: "Global location scouting", active: false },
        { text: "Indestructible Fallback Engine", active: false }
      ]
    },
    {
      id: "professional",
      name: "Professional",
      tagline: "Full-scale intelligence for growth",
      monthPrice: 499,
      yearPrice: 4499,
      originalMonth: 699,
      originalYear: 6999,
      dailyLabel: "Only ₹12/day",
      icon: <Rocket className="w-6 h-6" />,
      color: "from-emerald-500 to-teal-400",
      popular: true,
      features: [
        { text: "Unlimited recommendations", active: true },
        { text: "Eternal Reliability Bridge", active: true },
        { text: "Priority scouting speed", active: true },
        { text: "24/7 Strategic support", active: true },
        { text: "Full roadmap generation", active: true },
        { text: "Dual AI provider priority", active: true }
      ]
    }
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'} transition-colors duration-500 overflow-x-hidden`}>
      {/* Premium Navigation Bar */}
      <nav className={`fixed top-0 w-full z-50 border-b ${isDark ? 'bg-[#020617]/80 border-white/5' : 'bg-white/80 border-slate-200'} backdrop-blur-xl`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform shadow-lg shadow-emerald-500/20">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-xl font-black italic tracking-tighter">StarterScope</span>
          </Link>
          <div className="flex items-center gap-6 text-xs font-black uppercase tracking-widest">
            <Link href="/dashboard" className="opacity-70 hover:opacity-100 transition-opacity">{t('nav_dashboard')}</Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-4 relative">
        <div className="max-w-7xl mx-auto">
          {/* Strategic Header */}
          <div className="text-center space-y-6 mb-16 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-black uppercase tracking-[0.2em]"
            >
              <Sparkles size={14} className="animate-pulse" />
              {t('pricing_badge')}
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none italic uppercase">
              {t('pricing_title')}
            </h1>
            <p className="text-lg md:text-xl opacity-70 max-w-2xl mx-auto font-medium">
              Join 1,000+ entrepreneurs building with AI precision.
            </p>

            {/* Toggle Billing Cycle */}
            <div className="flex items-center justify-center gap-4 mt-10">
              <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-emerald-500' : 'opacity-40'}`}>Monthly</span>
              <button 
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className={`w-14 h-7 rounded-full relative transition-colors ${isDark ? 'bg-white/10' : 'bg-slate-200'} border border-white/10`}
              >
                <div className={`absolute top-1 left-1 bottom-1 w-5 bg-emerald-500 rounded-full transition-all ${billingCycle === 'yearly' ? 'translate-x-7' : ''}`} />
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${billingCycle === 'yearly' ? 'text-emerald-500' : 'opacity-40'}`}>Yearly</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-500 text-[10px] font-black rounded uppercase">Save 30%</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto relative z-10">
            {tiers.map((tier) => (
              <motion.div
                key={tier.id}
                whileHover={{ y: -10 }}
                className={`p-8 rounded-3xl border ${tier.popular ? 'border-emerald-500/50 scale-[1.02] shadow-2xl shadow-emerald-500/10' : isDark ? 'border-white/5 shadow-xl shadow-black/20' : 'border-slate-200 shadow-xl'} ${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl relative flex flex-col`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-emerald-500/40 animate-pulse">
                    MOST POPULAR
                  </div>
                )}
                
                <div className="space-y-6 flex-grow">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-white shadow-lg`}>
                      {tier.icon}
                    </div>
                    {tier.popular && <Crown size={20} className="text-emerald-500" />}
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">{tier.name}</h3>
                    <p className="text-sm opacity-60 font-medium">{tier.tagline}</p>
                  </div>

                  <div className="py-2 border-y border-white/5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black italic">₹{billingCycle === 'monthly' ? tier.monthPrice : tier.yearPrice}</span>
                      <span className="text-xs opacity-50 font-bold uppercase tracking-widest">/ {billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] line-through opacity-40">₹{billingCycle === 'monthly' ? tier.originalMonth : tier.originalYear}</span>
                      <span className="text-[10px] font-black text-emerald-500 uppercase">{tier.dailyLabel}</span>
                    </div>
                  </div>

                  <ul className="space-y-4">
                    {tier.features.map((feature, fIdx) => (
                      <li key={fIdx} className={`flex items-center gap-3 text-sm ${feature.active ? 'opacity-100' : 'opacity-30'}`}>
                        {feature.active ? (
                          <div className="p-0.5 bg-emerald-500/20 text-emerald-500 rounded">
                            <Check size={14} strokeWidth={4} />
                          </div>
                        ) : (
                          <X size={14} strokeWidth={4} className="text-slate-500" />
                        )}
                        <span className="font-bold tracking-tight">{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-10">
                  <button 
                    onClick={() => handlePayment(tier)}
                    disabled={loading !== null}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${tier.popular ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20' : isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xl'} ${loading === tier.id ? 'animate-pulse scale-95 opacity-70' : ''}`}
                  >
                    {loading === tier.id ? (
                      <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Upgrade Now <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                  <p className="text-[9px] text-center mt-4 opacity-40 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                    <ShieldCheck size={14} /> Dodo Encrypted Transaction
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-center mt-12 opacity-30 text-xs font-black uppercase tracking-widest">
            Institutional Encryption Active • 24/7 Priority Support
          </p>
        </div>
      </main>

      <AnimatePresence>
        {showSuccessModal && (
          <PaymentSuccessModal 
            isOpen={showSuccessModal} 
            onClose={() => {
              setShowSuccessModal(false);
              router.push('/dashboard');
            }} 
            paymentData={paymentDetails} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// 🏛️ Final Wrapper with Suspense Boundary for Vercel Static Building (V7.5)
export default function AcquisitionTiers() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#020617] flex items-center justify-center flex-col gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <Zap size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500 animate-pulse" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 animate-pulse">Initializing Strategic Tiers...</p>
      </div>
    }>
      <AcquisitionTiersContent />
    </Suspense>
  );
}