"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { CreditCard, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

function TempPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  const amount = searchParams.get('amount') || '199';
  const plan = searchParams.get('plan') || 'starter';
  const email = searchParams.get('email') || '';
  const returnUrl = searchParams.get('return_url') || '';

  // Map plan names to display names and pricing
  const planDetails = {
    'prod_starter_199': { name: 'Starter', monthlyPrice: 199, yearlyPrice: 1799 },
    'prod_professional_499': { name: 'Professional', monthlyPrice: 499, yearlyPrice: 4499 },
    'starter': { name: 'Starter', monthlyPrice: 199, yearlyPrice: 1799 },
    'professional': { name: 'Professional', monthlyPrice: 499, yearlyPrice: 4499 }
  };

  const currentPlan = planDetails[plan as keyof typeof planDetails] || planDetails['starter'];
  const displayAmount = amount;
  const isYearly = parseInt(amount) > 500; // If amount is high, it's yearly
  const billingCycle = isYearly ? 'Yearly' : 'Monthly';
  const savings = isYearly ? Math.round(((currentPlan.monthlyPrice * 12) - parseInt(amount)) / (currentPlan.monthlyPrice * 12) * 100) : 0;

  const handlePayment = async () => {
    setProcessing(true);
    
    // Simulate realistic payment processing time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Redirect to success page with proper parameters
    const planName = plan.replace('prod_', '').replace('_199', '').replace('_499', '');
    const successUrl = `${decodeURIComponent(returnUrl)}&payment_id=demo_${Date.now()}&status=succeeded&email=${email}&amount=${amount}&billing=${billingCycle.toLowerCase()}`;
    
    window.location.href = successUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full"
      >
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-blue-500/20 border-2 border-blue-500">
            <CreditCard size={32} className="text-blue-500" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Complete Payment
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {currentPlan.name} Plan - {billingCycle} Billing
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Plan:</span>
              <div className="text-right">
                <span className="font-semibold text-slate-900 dark:text-white">{currentPlan.name}</span>
                <div className="text-xs text-slate-500 dark:text-slate-400">{billingCycle} Billing</div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Amount:</span>
              <div className="text-right">
                <span className="font-bold text-2xl text-slate-900 dark:text-white">₹{displayAmount}</span>
                {isYearly && (
                  <div className="text-xs text-green-600 dark:text-green-400">
                    Save {savings}% vs Monthly
                  </div>
                )}
              </div>
            </div>
            
            {isYearly && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Monthly equivalent:</span>
                <span className="text-slate-600 dark:text-slate-300">₹{Math.round(parseInt(displayAmount) / 12)}/month</span>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Email:</span>
              <span className="font-medium text-slate-900 dark:text-white text-sm">{email}</span>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Demo Payment Mode
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  This is a temporary payment page while we configure the real payment gateway. 
                  Click "Pay Now" to simulate a successful payment.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handlePayment}
              disabled={processing}
              className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                processing
                  ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {processing ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Payment...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle size={18} />
                  Pay ₹{displayAmount} Now
                </div>
              )}
            </button>

            <button
              onClick={() => router.back()}
              className="w-full py-3 px-6 rounded-xl font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function TempPayment() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TempPaymentContent />
    </Suspense>
  );
}