"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, Crown, Zap, CreditCard, X, User, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { useNotifications } from "@/context/NotificationContext";
import { useSubscription, SubscriptionPlan } from "@/context/SubscriptionContext";
import { useAnimation } from "@/context/AnimationContext";
import { useSession } from "next-auth/react";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentDetails?: {
    payment_id: string | null;
    order_id: string | null;
    plan: string | null;
    amount: string | null;
    currency: string | null;
    billing: string | null;
  } | null;
}

export default function PaymentSuccessModal({ isOpen, onClose, paymentDetails }: PaymentSuccessModalProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { addNotification } = useNotifications();
  const { setPlan } = useSubscription();
  const { triggerPaymentAnimation } = useAnimation();
  const [wasSynced, setWasSynced] = useState(false);
  
  const currentDetails = React.useMemo(() => ({
    paymentId: paymentDetails?.payment_id || searchParams.get('payment_id') || `pay_${Date.now()}`,
    planParam: paymentDetails?.plan || searchParams.get('plan') || 'Venture Strategist',
    amount: paymentDetails?.amount || searchParams.get('amount') || '0',
    billingCycle: paymentDetails?.billing || searchParams.get('billing') || 'monthly',
    currency: paymentDetails?.currency || searchParams.get('currency') || 'INR'
  }), [paymentDetails, searchParams]);

  const { paymentId, planParam, amount, billingCycle, currency } = currentDetails;

  useEffect(() => {
    if (isOpen && session?.user?.email && !wasSynced) {
      document.body.style.overflow = 'hidden';
      
      // Trigger the global animation immediately when modal opens
      console.log('🌊 Payment success modal opened - triggering global animation');
      triggerPaymentAnimation();
      
      const planMapping: Record<string, SubscriptionPlan> = {
        'Starter': 'free',
        'Venture Strategist': 'free',
        'Market Explorer': 'free',
        'Professional': 'professional',
        'Growth Architect': 'professional',
        'Growth Accelerator': 'professional', 
        'Enterprise': 'enterprise',
        'Territorial Dominance': 'enterprise',
        'Market Dominator': 'enterprise',
        'free': 'free',
        'pro': 'professional',
        'professional': 'professional',
        'enterprise': 'enterprise'
      };
      
      const currentPlan = planMapping[planParam] || 'free';

      const planFeaturesMap: Record<SubscriptionPlan, any> = {
        'free': { max_analyses: 5, features: { advancedFeatures: false, prioritySupport: false, exportToPdf: false, apiAccess: false } },
        'professional': { max_analyses: -1, features: { advancedFeatures: true, prioritySupport: true, exportToPdf: true, apiAccess: true } },
        'enterprise': { max_analyses: -1, features: { advancedFeatures: true, prioritySupport: true, exportToPdf: true, apiAccess: true, dedicatedManager: true } }
      };

      const syncPlanWithBackend = async () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const userEmail = session.user!.email!.toLowerCase().trim();
        
        // 1. IMMEDIATE LOCAL ACTIVATION (CACHE)
        setPlan(currentPlan);
        localStorage.setItem(`subscription_${userEmail}`, currentPlan);
        
        // 2. Proactively update profile cache to reflect new plan status
        const cachedProfileData = localStorage.getItem(`profile_data_${userEmail}`);
        if (cachedProfileData) {
          try {
            const parsed = JSON.parse(cachedProfileData);
            if (parsed.subscriptionDetails) {
              parsed.subscriptionDetails.plan_name = currentPlan;
              parsed.subscriptionDetails.plan_display_name = planParam;
              parsed.subscriptionDetails.status = 'active';
              localStorage.setItem(`profile_data_${userEmail}`, JSON.stringify(parsed));
            }
          } catch(e) {}
        }

        const payload = {
          user_email: userEmail,
          plan_name: currentPlan,
          plan_display_name: planParam,
          billing_cycle: billingCycle,
          price: parseFloat(amount),
          currency: currency,
          max_analyses: planFeaturesMap[currentPlan]?.max_analyses || 5,
          features: planFeaturesMap[currentPlan]?.features || {}
        };

        try {
          // 3. Sync Subscription
          const subResponse = await fetch(`${apiUrl}/api/subscriptions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          let subId = null;
          if (subResponse.ok) {
            const subData = await subResponse.json();
            subId = subData.id;
          }
          
          // 4. Sync Payment Record
          try {
            const paymentResponse = await fetch(`${apiUrl}/api/payments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_email: userEmail,
                subscription_id: subId,
                razorpay_payment_id: paymentId,
                razorpay_order_id: paymentDetails?.order_id || `ord_${Date.now()}`,
                amount: parseFloat(amount),
                currency: currency,
                status: 'success',
                plan_name: planParam,
                billing_cycle: billingCycle
              })
            });
            
            if (!paymentResponse.ok) {
              console.error('Payment sync failed:', paymentResponse.status, paymentResponse.statusText);
              const errorData = await paymentResponse.json().catch(() => ({}));
              console.error('Payment sync error details:', errorData);
            } else {
              console.log('✅ Payment record synced successfully');
            }
          } catch (error) {
            console.error('Payment sync error:', error);
          }
          
          addNotification({
            type: 'payment',
            title: 'Protocol Activated',
            message: `${planParam} is now live. Intelligence nodes synchronized.`,
            priority: 'medium'
          });

          router.refresh();
        } catch (err) {
          console.error('❌ AI Terminal: Sync failure:', err);
        }
      };

      setWasSynced(true);
      syncPlanWithBackend();

      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, session, wasSynced, amount, billingCycle, currency, paymentId, planParam, setPlan, router, addNotification, paymentDetails?.order_id]);

  const handleUpdateProfile = () => {
    router.push('/profile');
    onClose();
  };

  const handleManageBilling = () => {
    router.push('/profile?tab=billing');
    onClose();
  };

  const planFeaturesDetails = {
    'Venture Strategist': {
      features: ['Regional Intelligence', 'Strategic Reports'],
    },
    'Growth Architect': {
      features: ['Unlimited Neural Intel', 'Profit Engine', 'Priority Support'],
    },
    'Territorial Dominance': {
      features: ['Sovereign Control', 'Full API Infra', 'White-Label Intel'],
    }
  };

  const currentPlanDetails = planFeaturesDetails[planParam as keyof typeof planFeaturesDetails] || planFeaturesDetails['Venture Strategist'];

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-4 overflow-y-auto sm:overflow-hidden">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative w-full max-w-[340px] sm:max-w-sm bg-white dark:bg-[#0a0f1e] border border-blue-500/30 rounded-2xl shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)] overflow-hidden"
          >
            <button 
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all z-50"
            >
              <X size={14} />
            </button>

            <div className="p-4 sm:p-6 text-center">
              <div className="relative mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                  className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 relative z-10"
                >
                  <CheckCircle className="text-emerald-500" size={24} />
                </motion.div>
                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full scale-150 opacity-20" />
              </div>

              <div className="space-y-1 mb-4">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase leading-none">
                  Success Activated
                </h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/80">Premium Access Unlocked</p>
              </div>

              <div className="bg-slate-50 dark:bg-blue-500/[0.03] rounded-xl p-3 flex items-center justify-between mb-4 border border-slate-100 dark:border-blue-500/10">
                <div className="text-left">
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-0.5">Tier</span>
                  <div className="flex items-center gap-1.5">
                    <Crown size={10} className="text-amber-400" />
                    <span className="text-xs font-black uppercase text-slate-900 dark:text-white">
                      {planParam}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-0.5">Amount</span>
                  <p className="font-black text-xs text-slate-900 dark:text-emerald-400">
                    {currency === 'INR' ? '₹' : '$'}{parseInt(amount).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 mb-6">
                <div className="grid grid-cols-1 gap-1.5">
                  {currentPlanDetails.features.map((feature: string) => (
                    <div key={feature} className="flex items-center gap-2 text-left bg-slate-50/50 dark:bg-white/[0.02] px-3 py-1.5 rounded-lg border border-slate-100 dark:border-white/5">
                      <div className="w-3.5 h-3.5 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                        <CheckCircle size={8} strokeWidth={4} />
                      </div>
                      <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight line-clamp-1">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={onClose}
                  className="w-full h-10 rounded-xl bg-blue-600 dark:bg-white text-white dark:text-slate-950 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Zap size={12} fill="currentColor" />
                  Dashboard
                </button>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleManageBilling}
                    className="flex-1 h-9 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-1.5"
                  >
                    <CreditCard size={10} />
                    Billing
                  </button>
                  <button
                    onClick={handleUpdateProfile}
                    className="flex-1 h-9 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-1.5"
                  >
                    <User size={10} />
                    Profile
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-1.5 text-[7px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest opacity-60">
                <Shield size={9} />
                Neural Secure Verified
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
