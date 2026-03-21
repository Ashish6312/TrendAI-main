"use client";

import React from "react";
import { CheckCircle, ArrowRight, Star, Sparkles, Crown, Zap, Download, Mail, Calendar, CreditCard, Shield, Gift } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useRef } from "react";
import { useNotifications } from "@/context/NotificationContext";
import { useSubscription, SubscriptionPlan } from "@/context/SubscriptionContext";
import { useSession } from "next-auth/react";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { addNotification } = useNotifications();
  const { setPlan, theme } = useSubscription();
  const [showConfetti, setShowConfetti] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const hasProcessed = useRef(false);
  
  const paymentId = searchParams.get('payment_id') || `pay_${Date.now()}`;
  const planParam = searchParams.get('plan') || 'Market Dominator';
  const amount = searchParams.get('amount') || '5999';
  const billingCycle = searchParams.get('billing') || 'monthly';
  const currency = searchParams.get('currency') || 'INR';

  // Button handlers
  const handleCheckEmail = () => {
    // Open default email client
    if (session?.user?.email) {
      window.open(`mailto:${session.user.email}?subject=TrendAI Payment Receipt - ${planParam}&body=Thank you for your payment! Your receipt and setup guide are attached.`, '_blank');
    } else {
      window.open('mailto:', '_blank');
    }
    
    // Also show notification
    addNotification({
      type: 'system',
      title: 'Email Client Opened',
      message: 'Check your email for payment receipt and setup guide',
      priority: 'medium',
      actionUrl: '/dashboard'
    });
  };

  const handleDownloadResources = () => {
    // Show notification about available resources
    addNotification({
      type: 'system',
      title: 'Resources Available',
      message: 'Your exclusive templates and guides are ready for download',
      priority: 'high',
      actionUrl: '/resources'
    });

    // Redirect to resources page
    window.location.href = '/resources';
  };

  const handleManageSubscription = () => {
    // Redirect to profile page with billing tab
    window.location.href = '/profile?tab=billing';
  };

  const handleGoToDashboard = () => {
    window.location.href = '/dashboard';
  };

  const handleViewRoadmap = () => {
    window.location.href = '/roadmap';
  };

  const handleUpdateProfile = () => {
    window.location.href = '/profile';
  };

  // Robust mapping for all naming variants
  const planMapping: Record<string, SubscriptionPlan> = {
    'Starter': 'free',
    'Market Explorer': 'free',
    'Professional': 'professional',
    'Growth Accelerator': 'professional', 
    'Enterprise': 'enterprise',
    'Market Dominator': 'enterprise',
    'free': 'free',
    'pro': 'professional',
    'professional': 'professional',
    'enterprise': 'enterprise'
  };
  const currentPlan = planMapping[planParam] || 'free';

  // Plan features for display
  const planFeatures = {
    'Market Explorer': {
      analyses: 5,
      features: ['Basic Analytics', 'Email Support', 'Standard Reports'],
      color: '#10b981'
    },
    'Growth Accelerator': {
      analyses: 50,
      features: ['Advanced Analytics', 'Priority Support', 'Custom Reports', 'API Access'],
      color: '#3b82f6'
    },
    'Market Dominator': {
      analyses: -1,
      features: ['Unlimited Analytics', '24/7 Premium Support', 'White-label Reports', 'Full API Access', 'Custom Integrations', 'Dedicated Account Manager'],
      color: '#8b5cf6'
    }
  };

  const currentPlanFeatures = planFeatures[planParam as keyof typeof planFeatures] || planFeatures['Market Dominator'];

  // Auto-advance steps
  useEffect(() => {
    const stepTimers = [
      setTimeout(() => setCurrentStep(1), 2000),
      setTimeout(() => setCurrentStep(2), 4000),
      setTimeout(() => setCurrentStep(3), 6000),
    ];

    return () => stepTimers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (hasProcessed.current) return;
    
    const processPaymentImmediately = async () => {
      if (!session?.user?.email || !paymentId) return;

      hasProcessed.current = true;
      
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        console.log('🔔 Processing payment immediately...');
        
        // Call immediate processing endpoint
        const processData = {
          user_email: session.user.email,
          razorpay_payment_id: paymentId,
          razorpay_order_id: searchParams.get('order_id') || `order_${paymentId}`,
          amount: parseFloat(amount),
          plan_name: planParam,
          billing_cycle: billingCycle
        };

        console.log('Processing payment data:', processData);
        const processResponse = await fetch(`${apiUrl}/api/process-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(processData)
        });

        if (processResponse.ok) {
          const result = await processResponse.json();
          console.log('✅ Payment processed successfully:', result);
          
          // Update subscription plan immediately
          setPlan(result.plan_name);
          
          // Add success notification
          addNotification({
            type: 'payment',
            title: 'Payment Processed Successfully!',
            message: `Your ${result.plan_display_name} subscription is now active`,
            priority: 'high',
            actionUrl: '/profile?tab=billing',
            metadata: {
              paymentId: result.payment_id,
              planName: result.plan_display_name,
              amount: parseFloat(amount)
            }
          });
          
          // Store success state for animation trigger
          sessionStorage.setItem('payment_success_trigger', 'true');
          sessionStorage.setItem('payment_id_trigger', paymentId);
          
          // Redirect to profile with animation trigger after 3 seconds
          setTimeout(() => {
            window.location.href = `/profile?payment_success=true&payment_id=${paymentId}&tab=billing`;
          }, 3000);
          
        } else {
          const errorText = await processResponse.text();
          console.error('❌ Payment processing failed:', errorText);
          
          // Fallback to old method
          await fallbackPaymentProcessing();
        }

      } catch (error) {
        console.error('❌ Error processing payment:', error);
        
        // Fallback to old method
        await fallbackPaymentProcessing();
      }
    };

    const fallbackPaymentProcessing = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        
        // Create subscription record
        const subscriptionData = {
          user_email: session?.user?.email,
          plan_name: currentPlan,
          plan_display_name: planParam,
          billing_cycle: billingCycle,
          price: parseFloat(amount),
          currency: currency,
          max_analyses: currentPlanFeatures.analyses,
          features: {
            advancedFeatures: currentPlan !== 'free',
            prioritySupport: currentPlan === 'enterprise',
            exportToPdf: currentPlan !== 'free',
            apiAccess: currentPlan !== 'free'
          }
        };

        const subscriptionResponse = await fetch(`${apiUrl}/api/subscriptions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscriptionData)
        });

        let subscriptionId = null;
        if (subscriptionResponse.ok) {
          const subscription = await subscriptionResponse.json();
          subscriptionId = subscription.id;
        }

        // Create payment record
        const paymentData = {
          user_email: session?.user?.email,
          subscription_id: subscriptionId,
          razorpay_payment_id: paymentId,
          razorpay_order_id: searchParams.get('order_id') || '',
          amount: parseFloat(amount),
          currency: currency,
          status: 'success',
          payment_method: 'razorpay',
          plan_name: currentPlan,
          billing_cycle: billingCycle
        };

        const paymentResponse = await fetch(`${apiUrl}/api/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentData)
        });

        if (paymentResponse.ok) {
          console.log('✅ Fallback payment processing successful');
          
          addNotification({
            type: 'payment',
            title: 'Payment Processed',
            message: `Your ${planParam} subscription has been activated`,
            priority: 'high',
            actionUrl: '/profile?tab=billing'
          });
        } else {
          console.error('❌ Fallback payment processing failed:', paymentResponse.status, paymentResponse.statusText);
          const errorData = await paymentResponse.json().catch(() => ({}));
          console.error('Payment processing error details:', errorData);
          
          addNotification({
            type: 'alert',
            title: 'Payment Processing Issue',
            message: 'Your payment was successful, but there was an issue saving the records. Please contact support.',
            priority: 'medium',
            actionUrl: '/profile?tab=billing'
          });
        }

      } catch (error) {
        console.error('❌ Fallback processing failed:', error);
        
        addNotification({
          type: 'alert',
          title: 'Payment Processing Issue',
          message: 'Your payment was successful, but there was an issue saving the records. Please contact support.',
          priority: 'medium',
          actionUrl: '/profile?tab=billing'
        });
      }
    };

    // Set subscription plan based on payment
    setPlan(currentPlan);
    
    // Process payment immediately
    processPaymentImmediately();

    // Hide confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [session?.user?.email, paymentId, planParam, amount, addNotification, setPlan, currentPlan, searchParams, billingCycle, currency, currentPlanFeatures.analyses]);

  const planIcons = {
    free: Star,
    professional: Zap,
    enterprise: Crown
  };

  const PlanIcon = planIcons[currentPlan];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white transition-colors duration-300 flex items-center justify-center relative overflow-hidden">
      
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
        >
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: `linear-gradient(45deg, ${theme.primary}, ${theme.secondary})`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Premium Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(80)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-20px',
                }}
                initial={{ y: -20, rotate: 0, opacity: 1 }}
                animate={{ 
                  y: window.innerHeight + 20, 
                  rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                  x: Math.random() * 300 - 150
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 4 + Math.random() * 3,
                  ease: "easeOut",
                  delay: Math.random() * 3,
                }}
              >
                {i % 4 === 0 ? (
                  <Crown size={12} style={{ color: currentPlanFeatures.color }} />
                ) : i % 4 === 1 ? (
                  <Star size={10} style={{ color: '#fbbf24' }} />
                ) : i % 4 === 2 ? (
                  <Sparkles size={8} style={{ color: '#ec4899' }} />
                ) : (
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ background: `hsl(${Math.random() * 360}, 70%, 60%)` }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className="responsive-container text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          className="space-y-8"
        >
          {/* Success Icon with Enhanced Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", bounce: 0.6 }}
            className="relative inline-flex items-center justify-center"
          >
            <motion.div
              className="w-32 h-32 rounded-full border-4 flex items-center justify-center relative"
              style={{ 
                backgroundColor: `${currentPlanFeatures.color}20`,
                borderColor: currentPlanFeatures.color,
                boxShadow: `0 0 50px ${currentPlanFeatures.color}40`
              }}
              animate={{ 
                boxShadow: [
                  `0 0 50px ${currentPlanFeatures.color}40`,
                  `0 0 80px ${currentPlanFeatures.color}60`,
                  `0 0 50px ${currentPlanFeatures.color}40`
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
              >
                <CheckCircle size={64} style={{ color: currentPlanFeatures.color }} />
              </motion.div>
              
              {/* Pulsing ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: currentPlanFeatures.color }}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>

          {/* Enhanced Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4 sm:space-y-6"
          >
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent px-4">
              Payment Successful!
            </h1>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7, type: "spring" }}
              className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 rounded-full border backdrop-blur-sm"
              style={{ 
                backgroundColor: `${currentPlanFeatures.color}20`,
                borderColor: `${currentPlanFeatures.color}40`
              }}
            >
              <PlanIcon size={20} className="sm:w-6 sm:h-6" style={{ color: currentPlanFeatures.color }} />
              <span className="font-bold text-lg sm:text-xl" style={{ color: currentPlanFeatures.color }}>
                {planParam}
              </span>
              <Crown size={16} className="sm:w-5 sm:h-5" style={{ color: currentPlanFeatures.color }} />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-slate-800/50 rounded-2xl p-4 sm:p-8 border border-slate-700 backdrop-blur-sm max-w-2xl mx-auto"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full mb-2 sm:mb-3 mx-auto"
                     style={{ backgroundColor: `${currentPlanFeatures.color}20` }}>
                  <CreditCard size={16} className="sm:w-5 sm:h-5" style={{ color: currentPlanFeatures.color }} />
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mb-1">Payment ID</p>
                <p className="font-mono text-xs sm:text-sm font-semibold text-white break-all px-2">{paymentId}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full mb-2 sm:mb-3 mx-auto"
                     style={{ backgroundColor: `${currentPlanFeatures.color}20` }}>
                  <Gift size={16} className="sm:w-5 sm:h-5" style={{ color: currentPlanFeatures.color }} />
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mb-1">Amount Paid</p>
                <p className="font-bold text-xl sm:text-2xl" style={{ color: currentPlanFeatures.color }}>
                  {currency === 'INR' ? '₹' : 
                   currency === 'USD' ? '$' : 
                   currency === 'EUR' ? '€' : 
                   currency === 'GBP' ? '£' : 
                   currency === 'JPY' ? '¥' : 
                   currency === 'CNY' ? '¥' : 
                   currency === 'AUD' ? 'A$' : 
                   currency === 'CAD' ? 'C$' : 
                   currency === 'SGD' ? 'S$' : 
                   currency === 'MYR' ? 'RM' : 
                   currency === 'THB' ? '฿' : 
                   currency === 'IDR' ? 'Rp' : 
                   currency === 'BRL' ? 'R$' : 
                   currency === 'MXN' ? 'MX$' : 
                   currency === 'ZAR' ? 'R' : 
                   currency === 'AED' ? 'AED' : 
                   currency === 'PLN' ? 'zł' : 
                   currency === 'CZK' ? 'Kč' : 
                   '$'}{currency === 'INR' ? parseInt(amount).toLocaleString('en-IN') : amount}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full mb-2 sm:mb-3 mx-auto"
                     style={{ backgroundColor: `${currentPlanFeatures.color}20` }}>
                  <Calendar size={16} className="sm:w-5 sm:h-5" style={{ color: currentPlanFeatures.color }} />
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mb-1">Billing Cycle</p>
                <p className="font-semibold text-white capitalize">{billingCycle}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="bg-gradient-to-r from-slate-800/30 to-slate-700/30 rounded-2xl p-4 sm:p-8 border border-slate-600/30 backdrop-blur-sm max-w-3xl mx-auto"
          >
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center">
              🎉 You now have access to:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {currentPlanFeatures.features.map((feature: string, index: number) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.3 + index * 0.1 }}
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center flex-shrink-0"
                       style={{ backgroundColor: currentPlanFeatures.color }}>
                    <CheckCircle size={12} className="sm:w-3.5 sm:h-3.5 text-white" />
                  </div>
                  <span className="text-white font-medium text-sm sm:text-base">{feature}</span>
                </motion.div>
              ))}
            </div>
            
            {currentPlanFeatures.analyses !== -1 && (
              <div className="mt-6 text-center p-4 rounded-lg bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30">
                <p className="text-white">
                  <span className="font-bold text-2xl" style={{ color: currentPlanFeatures.color }}>
                    {currentPlanFeatures.analyses}
                  </span>
                  <span className="text-slate-300 ml-2">Market Analyses per month</span>
                </p>
              </div>
            )}
            
            {currentPlanFeatures.analyses === -1 && (
              <div className="mt-6 text-center p-4 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30">
                <p className="text-white">
                  <span className="font-bold text-2xl text-purple-400">∞</span>
                  <span className="text-slate-300 ml-2">Unlimited Market Analyses</span>
                </p>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="max-w-4xl mx-auto px-4"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 text-center">What's Next?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[
                { 
                  icon: Shield, 
                  title: "Access Dashboard", 
                  desc: "Start using all premium features immediately",
                  action: "Go to Dashboard",
                  href: "/dashboard",
                  primary: true,
                  onClick: handleGoToDashboard
                },
                { 
                  icon: Mail, 
                  title: "Email Confirmation", 
                  desc: "Check your email for receipt and setup guide",
                  action: "Check Email",
                  href: "mailto:",
                  primary: false,
                  onClick: handleCheckEmail
                },
                { 
                  icon: Download, 
                  title: "Download Resources", 
                  desc: "Get exclusive templates and guides",
                  action: "Download Now",
                  href: "/resources",
                  primary: false,
                  onClick: handleDownloadResources
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: currentStep >= index ? 1 : 0.3, y: 0 }}
                  transition={{ delay: 1.5 + index * 0.2 }}
                  className={`relative p-4 sm:p-6 rounded-2xl border backdrop-blur-sm transition-all duration-500 ${
                    currentStep >= index 
                      ? 'bg-slate-800/50 border-slate-600/50 hover:bg-slate-800/70' 
                      : 'bg-slate-900/30 border-slate-700/30'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div 
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${
                        currentStep >= index ? 'scale-100' : 'scale-75'
                      }`}
                      style={{ 
                        backgroundColor: currentStep >= index ? `${currentPlanFeatures.color}20` : '#374151',
                        color: currentStep >= index ? currentPlanFeatures.color : '#9ca3af'
                      }}
                    >
                      <item.icon size={18} className="sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-sm sm:text-base">{item.title}</h4>
                      <p className="text-xs sm:text-sm text-slate-400 line-clamp-2">{item.desc}</p>
                    </div>
                  </div>
                  
                  {currentStep >= index && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <button
                        onClick={item.onClick}
                        className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105 text-sm sm:text-base ${
                          item.primary
                            ? 'text-white'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                        }`}
                        style={item.primary ? { 
                          background: `linear-gradient(135deg, ${currentPlanFeatures.color}, ${currentPlanFeatures.color}dd)`
                        } : {}}
                      >
                        {item.action}
                        <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    </motion.div>
                  )}
                  
                  {/* Step indicator */}
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                    <div 
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                        currentStep >= index 
                          ? 'text-white' 
                          : 'bg-slate-700 text-slate-400'
                      }`}
                      style={currentStep >= index ? { backgroundColor: currentPlanFeatures.color } : {}}
                    >
                      {index + 1}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-lg mx-auto px-4"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1"
            >
              <button
                onClick={handleGoToDashboard}
                className="inline-flex items-center justify-center gap-2 sm:gap-3 w-full px-6 sm:px-8 py-3 sm:py-4 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-white text-sm sm:text-base"
                style={{ 
                  background: `linear-gradient(135deg, ${currentPlanFeatures.color}, ${currentPlanFeatures.color}dd)`,
                  boxShadow: `0 10px 30px -5px ${currentPlanFeatures.color}40`
                }}
              >
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Start Analyzing
                </motion.span>
                <ArrowRight size={16} className="sm:w-5 sm:h-5" />
              </button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <button
                onClick={handleManageSubscription}
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-slate-700/50 text-white font-semibold rounded-xl hover:bg-slate-600/50 transition-all duration-300 backdrop-blur-sm border border-slate-600 text-sm sm:text-base"
              >
                Manage Subscription
              </button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0 }}
            className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-2xl mx-auto px-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleViewRoadmap}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm sm:text-base"
            >
              <Star size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">View Roadmap</span>
              <span className="sm:hidden">Roadmap</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUpdateProfile}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm sm:text-base"
            >
              <Shield size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Update Profile</span>
              <span className="sm:hidden">Profile</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadResources}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm sm:text-base"
            >
              <Download size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Get Resources</span>
              <span className="sm:hidden">Resources</span>
            </motion.button>
          </motion.div>

          {/* Professional Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.0 }}
            className="pt-8 border-t border-slate-700 max-w-2xl mx-auto"
          >
            <div className="text-center space-y-4">
              <p className="text-slate-400">
                🎯 <strong>Pro Tip:</strong> Bookmark your dashboard for quick access to market insights
              </p>
              <p className="text-sm text-slate-500">
                Need help? Our {currentPlan === 'enterprise' ? 'dedicated' : 'priority'} support team is here for you at{" "}
                <a 
                  href="mailto:support@trendai.com" 
                  className="hover:underline transition-colors"
                  style={{ color: currentPlanFeatures.color }}
                >
                  support@trendai.com
                </a>
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-slate-600">
                <span>🔒 Secure Payment</span>
                <span>•</span>
                <span>📧 Receipt Sent</span>
                <span>•</span>
                <span>🚀 Instant Access</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading payment confirmation...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}