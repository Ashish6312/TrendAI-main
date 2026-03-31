"use client";

import React, { useEffect, useState, useRef } from "react";
import { 
  CheckCircle, ArrowRight, Star, Sparkles, Crown, Zap, 
  Download, Mail, Calendar, CreditCard, Shield, Gift, 
  Target, TrendingUp, X 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/context/NotificationContext";
import { useSubscription, SubscriptionPlan } from "@/context/SubscriptionContext";
import { useSession } from "next-auth/react";
import { getApiUrl } from "@/config/api";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: {
    payment_id: string;
    order_id: string;
    plan: string;
    amount: string;
    currency: string;
    billing: string;
  };
  isPage?: boolean; // If true, render as full page instead of modal
}

export default function PaymentSuccessModal({ isOpen, onClose, paymentData, isPage = false }: PaymentSuccessModalProps) {
  const { data: session } = useSession();
  const { addNotification } = useNotifications();
  const { setPlan, theme } = useSubscription();
  const [showConfetti, setShowConfetti] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const hasProcessed = useRef(false);

  const { payment_id, order_id, plan: planParam, amount, currency, billing: billingCycle } = paymentData || {};

  // Robust mapping for all naming variants in the 5-tier architecture
  const planMapping: Record<string, SubscriptionPlan> = {
    'Starter': 'starter',
    'Starter Strategist': 'starter',
    'Growth Architect': 'professional',
    'Professional': 'professional',
    'Business Accelerator': 'growth',
    'Growth Accelerator': 'growth',
    'Territorial Dominance': 'enterprise',
    'Enterprise Dominance': 'enterprise',
    'Market Influencer': 'starter',
    'Venture Strategist': 'starter',
    'Explorer': 'free',
    'free': 'free',
    'starter': 'starter',
    'professional': 'professional',
    'growth': 'growth',
    'enterprise': 'enterprise'
  };
  
  const currentPlan = planMapping[planParam] || (planParam?.toLowerCase().includes('enterprise') ? 'enterprise' : planParam?.toLowerCase().includes('growth') ? 'growth' : 'professional');

  // Plan features for display
  const planFeaturesDetails = {
    'Explorer': {
      analyses: 5,
      features: ['Basic Analytics', 'Email Support', 'Standard Reports'],
      color: '#64748b'
    },
    'Starter': {
      analyses: 100,
      features: ['100 Analysis Actions', 'Priority Insights', 'Alpha Vault Storage', 'Community Access'],
      color: '#2563eb'
    },
    'Professional': {
      analyses: -1,
      features: ['Unlimited Strategic Scans', 'Neural Profit Engine', '24/7 Priority Support', 'Strategic Roadmaps', 'Full API Access', 'Custom Reports'],
      color: '#10b981'
    },
    'Growth': {
      analyses: -1,
      features: ['AI Growth Acceleration', 'Multi-market Dominance', 'Global Scouting Swarm', 'Enterprise Resilience'],
      color: '#8b5cf6'
    },
    'Enterprise': {
      analyses: -1,
      features: ['Territorial Dominance', 'Custom Neural Architecture', 'Dedicated Data Cluster', 'Elite White-glove Support'],
      color: '#f43f5e'
    }
  };

  const currentPlanFeatures = (planFeaturesDetails[planParam as keyof typeof planFeaturesDetails] || 
                             (planParam?.toLowerCase().includes('enterprise') ? planFeaturesDetails['Enterprise'] : 
                              planParam?.toLowerCase().includes('acceleration') ? planFeaturesDetails['Growth'] : 
                              planParam?.toLowerCase().includes('professional') ? planFeaturesDetails['Professional'] : 
                              planFeaturesDetails['Starter']));

  useEffect(() => {
    if (isOpen) {
      const stepTimers = [
        setTimeout(() => setCurrentStep(1), 2000),
        setTimeout(() => setCurrentStep(2), 4000),
        setTimeout(() => setCurrentStep(3), 6000),
      ];
      
      const confettiTimer = setTimeout(() => setShowConfetti(false), 8000);

      return () => {
        stepTimers.forEach(clearTimeout);
        clearTimeout(confettiTimer);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || hasProcessed.current || !session?.user?.email || !payment_id) return;

    const pollForSubscription = async () => {
      hasProcessed.current = true;
      let attempts = 0;
      const maxAttempts = 15; // 45 seconds total (3s interval)
      const apiUrl = getApiUrl();
      const targetPlan = currentPlan;

      console.log(`📡 [POLLING] Waiting for Webhook activation... Target: ${targetPlan}`);

      const interval = setInterval(async () => {
        attempts++;
        try {
          const response = await fetch(`${apiUrl}/api/subscriptions/${session?.user?.email}`);
          if (response.ok) {
            const result = await response.json();
            const currentSubPlan = result.plan_name;
            
            console.log(`🔄 [POLLING] Attempt ${attempts}: Current backend plan: ${currentSubPlan}`);

            // Success condition: Backend profile matches or exceeds target tier
            const planHierarchy = { free: 0, starter: 1, professional: 2, growth: 3, enterprise: 4 };
            if (planHierarchy[currentSubPlan as keyof typeof planHierarchy] >= planHierarchy[targetPlan as keyof typeof planHierarchy]) {
              clearInterval(interval);
              setPlan(currentSubPlan);
              addNotification({
                type: 'payment',
                title: 'Activation Complete',
                message: `${result.plan_display_name} protocols are now online.`,
                priority: 'high'
              });
            }
          }
        } catch (e) {
          console.warn('Polling check failed - continuing...', e);
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval);
          console.warn('⚠️ [POLLING] Timeout waiting for webhook. The plan will update silently in the background.');
          addNotification({
            type: 'system',
            title: 'Synergy Syncing',
            message: "Our neural network is reconciling your payment. Your features will activate within 1-2 minutes.",
            priority: 'medium'
          });
        }
      }, 3000);

      return () => clearInterval(interval);
    };

    pollForSubscription();
  }, [isOpen, session, payment_id, order_id, amount, planParam, billingCycle, setPlan, addNotification]);

  const handleAction = (url: string) => {
    if (isPage) {
      window.location.href = url;
    } else {
      // If modal, we might want to just close and navigate
      onClose();
      window.location.href = url;
    }
  };

  const planIcons: Record<string, any> = {
    free: Star,
    starter: Target,
    professional: Zap,
    growth: TrendingUp,
    enterprise: Crown
  };

  const PlanIcon = planIcons[currentPlan] || Target;

  const content = (
    <div className={`relative ${isPage ? 'min-h-screen flex items-center justify-center p-4' : 'w-full max-w-sm'}`}>
      
      {/* Premium Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-[100]">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-20px',
                }}
                initial={{ y: -20, rotate: 0, opacity: 1 }}
                animate={{ 
                  y: typeof window !== 'undefined' ? window.innerHeight + 20 : 1000, 
                  rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                  x: Math.random() * 200 - 100
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  ease: "easeOut",
                  delay: Math.random() * 2,
                }}
              >
                {i % 3 === 0 ? <Star size={12} className="text-emerald-400" /> : 

                 i % 3 === 1 ? <Zap size={10} className="text-blue-400" /> : 
                 <div className="w-2 h-2 rounded-full" style={{ background: theme.primary }} />}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.div
        initial={isPage ? { opacity: 0, scale: 0.9 } : { opacity: 0, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        className={`relative bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden ${isPage ? 'w-full max-w-sm' : ''}`}
      >
        {/* Background Accents */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-blue-500/10 dark:from-emerald-500/10 to-transparent blur-3xl opacity-50 dark:opacity-100" />
          <div className="absolute inset-0 bg-noise opacity-[0.03] dark:opacity-10" />
        </div>

        {!isPage && (
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all z-50"
          >
            <X size={20} />
          </button>
        )}

        <div className="relative z-10 p-5 sm:p-6 space-y-3">
          {/* Header */}
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
              className="inline-flex items-center justify-center p-4 rounded-full bg-emerald-500/20 border-2 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
            >
              <CheckCircle size={48} className="text-emerald-500" />
            </motion.div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter">Payment Successful!</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Your strategic upgrade has been authorized.</p>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 backdrop-blur-md"
            >
              <PlanIcon size={18} style={{ color: currentPlanFeatures.color }} />
              <span className="font-black text-sm uppercase tracking-[0.2em]" style={{ color: currentPlanFeatures.color }}>
                {planParam}
              </span>
              <Crown size={14} style={{ color: currentPlanFeatures.color }} />
            </motion.div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-3 gap-2 bg-slate-900/5 dark:bg-white/5 rounded-2xl p-4 border border-slate-900/10 dark:border-white/10 backdrop-blur-sm">
            {[
              { label: 'Payment ID', value: payment_id, icon: CreditCard },
              { label: 'Amount', value: `${currency} ${parseFloat(amount).toLocaleString()}`, icon: Gift, color: currentPlanFeatures.color },
              { label: 'Cycle', value: billingCycle, icon: Calendar }
            ].map((detail, i) => (
              <div key={i} className="text-center space-y-0.5">
                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/5 mx-auto mb-1">
                  <detail.icon size={10} style={{ color: detail.color || '#94a3b8' }} />
                </div>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">{detail.label}</p>
                <p className="font-bold text-slate-900 dark:text-white text-[10px] truncate px-1" style={detail.color ? { color: detail.color } : {}}>{detail.value}</p>
              </div>
            ))}
          </div>

          {/* Features Granted */}
          <div className="space-y-4">
            <h3 className="text-center text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Privileges Unlocked</h3>
            <div className="grid grid-cols-3 gap-2">
              {currentPlanFeatures.features.slice(0, 6).map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1 + i * 0.1 }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/[0.02] dark:bg-white/[0.02] border border-slate-900/5 dark:border-white/5 group hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.05] transition-all"
                >
                  <div className="shrink-0 w-3 h-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle size={8} className="text-emerald-500" />
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 group-hover:text-white transition-colors truncate">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Next Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: 'Dashboard', desc: 'Start Analyzing', icon: TrendingUp, url: '/dashboard', primary: true },
              { title: 'Profile', desc: 'Sync Data', icon: Shield, url: '/profile' },
              { title: 'Billing', desc: 'View Invoice', icon: Download, url: '/profile?tab=billing' }
            ].map((action, i) => (
              <motion.button
                key={i}
                whileHover={{ y: -5, scale: 1.02 }}
                onClick={() => handleAction(action.url)}
                className={`p-5 rounded-2xl border text-left space-y-3 transition-all ${
                  action.primary 
                    ? 'bg-gradient-to-br from-indigo-600 to-emerald-500 text-white border-transparent shadow-xl ring-2 ring-emerald-500/20' 
                    : 'bg-slate-900/5 dark:bg-white/5 text-slate-900 dark:text-white border-slate-900/10 dark:border-white/10 hover:bg-slate-900/10 dark:hover:bg-white/10'
                }`}
              >
                <action.icon size={20} className={action.primary ? 'text-white' : ''} style={!action.primary ? { color: theme.primary } : {}} />
                <div>
                  <p className={`font-black uppercase tracking-widest text-[9px] ${action.primary ? 'text-white/60' : 'text-slate-500'}`}>{action.title}</p>
                  <p className="font-bold text-xs">{action.desc}</p>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Footer Footer */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
             <div className="flex items-center gap-2">
               <Shield size={12} className="text-emerald-500" />
               <span>Institutional Encryption Active</span>
             </div>
             <p>Support: StarterScope7@gmail.com</p>
          </div>
        </div>
      </motion.div>
    </div>
  );

  if (!isOpen || !paymentData) return null;

  if (isPage) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">{content}</div>;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />
        {content}
      </div>
    </AnimatePresence>
  );
}
