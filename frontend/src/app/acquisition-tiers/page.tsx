"use client";

import React, { useState, useEffect } from "react";
import { Check, X, Crown, Zap, Rocket, Star, Shield, ArrowRight, ShieldCheck, CreditCard, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useNotifications } from "@/context/NotificationContext";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import PaymentSuccessModal from "@/components/PaymentSuccessModal";
import Script from "next/script";
import { getApiUrl } from "@/config/api";

export default function AcquisitionTiers() {
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

  const handlePayment = async (tier: any) => {
    if (!session?.user) {
      router.push('/api/auth/signin');
      return;
    }

    setLoading(tier.id);
    try {
      const apiUrl = getApiUrl();
      
      // 1. Create Razorpay Order
      const resOrder = await fetch(`${apiUrl}/api/payments/razorpay/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: tier.id,
          billing_cycle: billingCycle,
          user_email: session?.user?.email
        })
      });

      if (!resOrder.ok) {
        const errorData = await resOrder.json();
        throw new Error(errorData.detail || 'Failed to create payment order');
      }

      const orderData = await resOrder.json();
      
      // 2. Open Razorpay Checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount * 100,
        currency: orderData.currency,
        name: "StarterScope",
        description: `${tier.name} Plan - ${billingCycle}`,
        order_id: orderData.order_id,
        handler: async (response: any) => {
          // 3. Verify Payment
          try {
            const resVerify = await fetch(`${apiUrl}/api/payments/razorpay/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                user_email: session?.user?.email,
                plan_id: tier.id,
                billing_cycle: billingCycle
              })
            });

            if (resVerify.ok) {
              const verifyData = await resVerify.json();
              setPaymentDetails(verifyData);
              setShowSuccessModal(true);
              addNotification({
                type: 'payment',
                title: 'Payment Successful',
                message: `You have successfully subscribed to the ${tier.name} plan!`,
                priority: 'high'
              });
            } else {
              const errorData = await resVerify.json();
              throw new Error(errorData.detail || 'Payment verification failed');
            }
          } catch (err: any) {
            addNotification({
              type: 'payment',
              title: 'Verification Failed',
              message: err.message || 'Payment verification failed. Please contact support.',
              priority: 'high'
            });
          }
        },
        prefill: {
          name: session?.user?.name || '',
          email: session?.user?.email || ''
        },
        theme: {
          color: "#10b981"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error: any) {
      console.error('Razorpay Error:', error);
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
        { text: "City-level insights", active: true },
        { text: "Basic profit estimation", active: true },
        { text: "Alpha Vault (5 Saves)", active: true },
        { text: "Standard AI processing", active: true, sub: true },
        { text: "No competitor heatmaps", active: false },
        { text: "No custom AI search", active: false }
      ],
      cta: "Get Started"
    },
    {
      id: "professional",
      name: "Professional",
      tagline: "Built for serious entrepreneurs",
      monthPrice: 499,
      yearPrice: 4499,
      originalMonth: 699,
      originalYear: 6999,
      dailyLabel: "Only ₹15/day",
      icon: <Rocket className="w-6 h-6" />,
      color: "from-indigo-600 to-emerald-500",
      popular: true,
      badge: "🔥 MOST POPULAR",
      bestValue: "Best Value",
      comparison: "Everything in Starter, plus:",
      features: [
        { text: "Unlimited recommendations", active: true, bold: true },
        { text: "Neural Profit Engine (AI)", active: true },
        { text: "Competitor Neural Heatmaps", active: true },
        { text: "Elite Alpha Vault (Unlimited)", active: true },
        { text: "6-Month Strategic Roadmaps", active: true },
        { text: "Real-time Demand Scoring", active: true },
        { text: "Priority Support Concierge", active: true }
      ],
      cta: "Upgrade Now →",
      triggers: ["Make smarter business decisions", "Maximize your profits"]
    }
  ];

  return (
    <div className={`min-h-screen selection:bg-emerald-500/30 ${isDark ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full blur-[120px] opacity-20 ${isDark ? 'bg-indigo-500/30' : 'bg-indigo-500/10'}`} />
        <div className={`absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[100px] opacity-10 ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-500/5'}`} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-20 pb-24">
        {/* Header Section */}
        <div className="text-center mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/5"
          >
            <Sparkles size={12} /> Transform Your Business with AI
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]"
          >
            Precision Pricing for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-emerald-400 to-cyan-400">
              Maximum Growth.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-base max-w-xl mx-auto font-medium"
          >
            Make smarter business decisions with our high-performance recommendation ecosystem. Choose the plan that fits your ambition.
          </motion.p>

          {/* Toggle */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-4 pt-8"
          >
            <div className={`inline-flex items-center p-1 rounded-2xl border backdrop-blur-3xl shadow-2xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-200/50 border-slate-300'}`}>
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={`relative px-8 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${
                  billingCycle === 'monthly' 
                    ? (isDark ? 'text-white bg-white/10' : 'text-slate-900 bg-white shadow-xl') 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
              <div className="relative">
                <button 
                  onClick={() => setBillingCycle('yearly')}
                  className={`relative px-8 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${
                    billingCycle === 'yearly' ? 'text-white bg-gradient-to-r from-indigo-600 to-emerald-500 shadow-xl' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Yearly
                </button>
                <div className="absolute -top-3 -right-4 translate-x-1/2">
                  <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-emerald-500/40 animate-pulse">
                    Save 20%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-500" /> Cancel anytime</span>
              <span className="flex items-center gap-1.5"><CreditCard size={14} className="text-emerald-500" /> Secure payment</span>
              <span className="flex items-center gap-1.5 font-black text-emerald-400">Trusted by 5,000+ Entrepreneurs</span>
            </div>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 max-w-4xl mx-auto">
          {tiers.map((tier, idx) => {
            const currentPrice = billingCycle === 'monthly' ? tier.monthPrice : Math.floor(tier.yearPrice / 12);
            const originalPrice = billingCycle === 'monthly' ? tier.originalMonth : Math.floor(tier.originalYear / 12);
            
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className={`relative group w-full max-w-[310px] rounded-[1.25rem] p-4 transition-all duration-300 border ${
                  tier.popular 
                    ? `z-20 ${isDark ? 'bg-slate-900/90 border-emerald-500 shadow-2xl shadow-emerald-500/10' : 'bg-white border-emerald-500 shadow-2xl shadow-emerald-500/20 scale-[1.03]'}` 
                    : `${isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-200'} shadow-xl hover:border-emerald-500/30`
                }`}
              >
                {/* Popular Accents */}
                {tier.popular && (
                  <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-indigo-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
                )}
                
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-2xl bg-gradient-to-br ${tier.color} text-white shadow-lg`}>
                    {tier.icon}
                  </div>
                  {tier.popular && (
                    <div className="flex flex-col items-end gap-1">
                      <span className="bg-indigo-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter">
                        {tier.badge}
                      </span>
                      <span className="text-emerald-500 text-[10px] font-black uppercase italic">
                        {tier.bestValue}
                      </span>
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-black mb-0">{tier.name}</h3>
                <p className="text-slate-500 text-[8px] font-bold leading-relaxed mb-2">{tier.tagline}</p>

                <div className="mb-6 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 line-through text-xs font-bold tracking-tighter">₹{originalPrice}</span>
                    <span className="bg-emerald-500/10 text-emerald-500 text-[9px] font-black px-2 py-0.5 rounded-lg">
                      Save ₹{originalPrice - currentPrice}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black tracking-tighter">₹{currentPrice}</span>
                    <span className="text-slate-500 font-bold text-[10px] tracking-tighter">/mo</span>
                  </div>
                  <div className="flex flex-col gap-1 pt-1">
                    {billingCycle === 'yearly' && (
                       <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">
                         ₹{tier.yearPrice} Paid At Once
                       </p>
                    )}
                    <p className="text-emerald-500 font-black text-sm italic tracking-tight">{tier.dailyLabel}</p>
                    <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest leading-none">
                      Inclusive of 18% GST • No hidden charges
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4 min-h-[140px]">
                  {tier.comparison && (
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-white/5 pb-1.5 mb-2">
                      {tier.comparison}
                    </div>
                  )}
                  {tier.features.map((f: any, i) => (
                    <div key={i} className={`flex items-start gap-3 ${!f.active ? 'opacity-30' : ''}`}>
                      <div className={`mt-0.5 p-0.5 rounded-full ${f.active ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                        {f.active ? <Check size={7} strokeWidth={4} /> : <X size={7} strokeWidth={2} />}
                      </div>
                      <span className={`text-[11px] ${f.bold ? 'font-black' : 'font-medium'} ${isDark ? 'text-slate-300' : 'text-slate-600'} ${f.sub ? 'italic text-[9px]' : ''}`}>
                        {f.text}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  {tier.triggers && (
                    <div className="flex flex-col gap-2 mb-4">
                      {tier.triggers.map((t, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] italic">
                          <Check size={12} strokeWidth={3} /> {t}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <button
                    onClick={() => handlePayment(tier)}
                    disabled={loading === tier.id}
                    className={`w-full py-2.5 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 ${
                      tier.popular 
                        ? 'bg-gradient-to-r from-indigo-600 to-emerald-500 text-white shadow-lg' 
                        : (isDark ? 'bg-white/5 text-white border border-white/10' : 'bg-slate-900 text-white shadow-md')
                    }`}
                  >
                    {loading === tier.id ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      tier.cta
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-24 text-center space-y-6">
          <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.3em]">
            Need custom solutions? <Link href="/contact" className="text-indigo-400 hover:text-emerald-400 underline decoration-indigo-400/30 underline-offset-8 transition-all">Contact Enterprise Sales</Link>
          </p>
          <div className="flex items-center justify-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            {/* Trust symbols */}
            <div className="flex flex-col items-center gap-1">
              <Shield size={24} />
              <span className="text-[8px] font-black uppercase">Secure SSL</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Sparkles size={24} />
              <span className="text-[8px] font-black uppercase">AI Certified</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Users size={24} />
              <span className="text-[8px] font-black uppercase">Community Verified</span>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSuccessModal && (
          <PaymentSuccessModal 
            isOpen={showSuccessModal} 
            onClose={() => setShowSuccessModal(false)} 
            paymentData={paymentDetails} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}