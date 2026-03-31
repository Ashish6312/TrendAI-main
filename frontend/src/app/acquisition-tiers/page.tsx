"use client";

import { useState, useEffect, Suspense } from "react";
import {
  Check, X, Crown, Zap, Rocket,
  ArrowRight, ShieldCheck, Sparkles
} from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import PaymentSuccessModal from "@/components/PaymentSuccessModal";
import { getApiUrl } from "@/config/api";

function AcquisitionTiersContent() {
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

  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const planId = searchParams.get('plan');
    const paymentId = searchParams.get('payment_id') || searchParams.get('checkout_id');
    const status = searchParams.get('status');
    const cycleParam = searchParams.get('cycle');
    const amountParam = searchParams.get('amount');

    if ((paymentStatus === 'success' || status === 'succeeded') && planId) {
      setPaymentDetails({
        payment_id: paymentId || 'DODO_' + Date.now(),
        order_id: 'ORDER_' + Date.now(),
        plan: planId,
        amount: amountParam || (planId === 'starter' ? (cycleParam === 'yearly' ? '1799' : '199') : (cycleParam === 'yearly' ? '4499' : '499')),
        currency: 'INR',
        billing: cycleParam || billingCycle
      });
      setShowSuccessModal(true);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams, billingCycle]);

  const handlePayment = async (tier: any) => {
    if (!session?.user) {
      router.push('/api/auth/signin');
      return;
    }

    setLoading(tier.id);
    try {
      const apiUrl = getApiUrl();
      const dodoProductIdMap: Record<string, string> = {
        'starter': process.env.NEXT_PUBLIC_DODO_STARTER_ID || 'pdt_0NbF7kyfPVbNBhxmWQHp5',
        'professional': process.env.NEXT_PUBLIC_DODO_PROFESSIONAL_ID || 'pdt_0NbF8QfBIb551VXZMggGQ'
      };

      const productId = dodoProductIdMap[tier.id];
      const amount = billingCycle === 'monthly' ? tier.monthPrice : tier.yearPrice;

      const resSession = await fetch(`${apiUrl}/api/dodo/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          quantity: 1,
          email: session.user.email,
          name: session.user.name || 'TrendAI Customer',
          return_url: `${window.location.origin}/acquisition-tiers?payment=success&plan=${tier.id}&cycle=${billingCycle}&amount=${amount}&checkout_id=`,
          amount: amount,
          billing_cycle: billingCycle
        })
      });

      if (!resSession.ok) throw new Error('Payment initialization failed');
      const sessionData = await resSession.json();
      if (sessionData?.checkout_url) window.location.href = sessionData.checkout_url;
    } catch (error: any) {
      addNotification({ type: 'alert', title: 'Payment Error', message: error.message || 'Failed to initialize payment.', priority: 'high' });
    } finally {
      setLoading(null);
    }
  };

  const tiers = [
    {
      id: "starter",
      name: "STARTER",
      tagline: "Basic analytics for beginners",
      monthPrice: 199,
      yearPrice: 1799,
      originalMonth: 299,
      dailyLabel: "ONLY ₹6/DAY",
      icon: <Zap className="w-5 h-5 text-white" />,
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
      name: "PROFESSIONAL",
      tagline: "Full-scale intelligence for growth",
      monthPrice: 499,
      yearPrice: 4499,
      originalMonth: 699,
      dailyLabel: "ONLY ₹12/DAY",
      icon: <Rocket className="w-5 h-5 text-white" />,
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
    <div className={`min-h-screen ${isDark ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'} transition-colors duration-500`}>
      <main className="pt-6 pb-6 px-4 max-w-7xl mx-auto">
        <div className="text-center space-y-2 mb-6 italic uppercase text-3xl md:text-4xl font-black tracking-tighter leading-none">
          Acquisition Tiers
          <div className="mt-2 flex items-center justify-center gap-4 not-italic normal-case text-sm opacity-60 font-medium tracking-normal leading-normal">
            Join 1,000+ entrepreneurs building with AI precision.
          </div>
          
          <div className="flex items-center justify-center gap-4 mt-4 not-italic normal-case text-base tracking-normal">
            <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-emerald-500' : 'opacity-40'}`}>Monthly</span>
            <button
               onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
               className={`w-12 h-6 rounded-full relative transition-colors ${isDark ? 'bg-white/10' : 'bg-slate-200'} border border-white/10`}
            >
              <div className={`absolute top-1 left-1 bottom-1 w-4 bg-emerald-500 rounded-full transition-all ${billingCycle === 'yearly' ? 'translate-x-6' : ''}`} />
            </button>
            <span className={`text-sm font-bold ${billingCycle === 'yearly' ? 'text-emerald-500' : 'opacity-40'}`}>Yearly (Save 30%)</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 max-w-5xl mx-auto relative z-10">
          {tiers.map((tier) => (
            <motion.div
              key={tier.id}
              whileHover={{ y: -5 }}
              className={`p-6 rounded-2xl border ${tier.popular ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'border-white/5'} ${isDark ? 'bg-[#0b1120]' : 'bg-white'} relative overflow-hidden flex flex-col`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 left-0 h-40 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />
              )}
              
              {tier.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 px-8 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-b-2xl shadow-lg shadow-emerald-500/20">
                  MOST POPULAR
                </div>
              )}

              <div className="relative z-10 space-y-4 flex-grow">
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-lg transform rotate-3`}>
                    {tier.icon}
                  </div>
                  {tier.popular && (
                    <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500">
                      <Crown size={20} />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black tracking-tight">{tier.name}</h3>
                  <p className="text-sm opacity-60 font-medium">{tier.tagline}</p>
                </div>

                <div className="py-3 border-y border-white/5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black italic tracking-tighter">₹{billingCycle === 'monthly' ? tier.monthPrice : tier.yearPrice}</span>
                    <span className="text-sm opacity-50 font-bold uppercase tracking-widest">/ {billingCycle === 'monthly' ? 'MO' : 'YR'}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs line-through opacity-30">₹{billingCycle === 'monthly' ? tier.originalMonth : tier.originalMonth * tier.monthPrice}</span>
                    <span className="text-xs font-black text-emerald-500 uppercase">{tier.dailyLabel}</span>
                  </div>
                </div>

                <ul className="space-y-2">
                  {tier.features.map((feature, fIdx) => (
                    <li key={fIdx} className={`flex items-center gap-3 transition-opacity ${feature.active ? 'opacity-100' : 'opacity-20'}`}>
                      <div className={`p-1 rounded-lg ${feature.active ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                        {feature.active ? <Check size={14} strokeWidth={4} /> : <X size={14} strokeWidth={4} />}
                      </div>
                      <span className="font-bold text-sm tracking-tight">{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 space-y-3 relative z-10">
                <button
                  onClick={() => handlePayment(tier)}
                  disabled={loading !== null}
                  className={`w-full py-3 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all flex items-center justify-center gap-3 ${tier.popular ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_8px_25px_rgba(16,185,129,0.3)]' : 'bg-[#1e293b] hover:bg-[#334155] text-white shadow-xl'} ${loading === tier.id ? 'opacity-50' : ''}`}
                >
                  {loading === tier.id ? (
                    <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      UPGRADE NOW <ArrowRight size={20} />
                    </>
                  )}
                </button>
                
                <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                   <ShieldCheck size={14} />
                   DODO ENCRYPTED TRANSACTION
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <AnimatePresence>
        {showSuccessModal && (
          <PaymentSuccessModal
            isOpen={showSuccessModal}
            onClose={() => { setShowSuccessModal(false); router.push('/dashboard'); }}
            paymentData={paymentDetails}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AcquisitionTiers() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    }>
      <AcquisitionTiersContent />
    </Suspense>
  );
}