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

  const handlePayment = async () => {
    setProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      // Redirect to success page
      const successUrl = `${returnUrl}&payment=success&plan=${plan}&payment_id=temp_${Date.now()}&status=succeeded&email=${email}`;
      window.location.href = successUrl;
    }, 2000);
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
              Temporary payment page - Dodo integration in progress
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Plan:</span>
              <span className="font-semibold text-slate-900 dark:text-white capitalize">{plan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Amount:</span>
              <span className="font-semibold text-slate-900 dark:text-white">₹{amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Email:</span>
              <span className="font-semibold text-slate-900 dark:text-white text-sm">{email}</span>
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
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle size={18} />
                  Pay Now (Demo)
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