import { useCallback } from 'react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentOptions {
  amount: number;
  currency?: string;
  planName: string;
  billingCycle: 'monthly' | 'yearly';
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

interface PaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export const useRazorpay = () => {
  const loadRazorpayScript = useCallback(() => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const initiatePayment = useCallback(async (options: PaymentOptions) => {
    const scriptLoaded = await loadRazorpayScript();
    
    if (!scriptLoaded) {
      throw new Error('Failed to load Razorpay SDK');
    }

    try {
      // Create order
      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: options.amount,
          currency: options.currency || 'INR',
          planName: options.planName,
          billingCycle: options.billingCycle,
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const orderData = await orderResponse.json();

      // Configure Razorpay options
      const razorpayOptions = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'TrendAI',
        description: `${options.planName} - ${options.billingCycle} subscription`,
        order_id: orderData.orderId,
        prefill: {
          name: options.customerName || '',
          email: options.customerEmail || '',
          contact: options.customerPhone || '',
        },
        theme: {
          color: '#10b981', // Emerald color
        },
        handler: async (response: PaymentResponse) => {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(response),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              // Payment successful - pass currency and amount info
              const params = new URLSearchParams({
                payment_success: 'true',
                payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id,
                plan: options.planName,
                amount: options.amount.toString(),
                currency: options.currency || 'INR',
                billing: options.billingCycle
              });
              window.location.href = `/payment-success?${params.toString()}`;
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal closed');
          },
        },
      };

      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.open();
    } catch (error) {
      console.error('Payment initiation error:', error);
      throw error;
    }
  }, [loadRazorpayScript]);

  return { initiatePayment };
};