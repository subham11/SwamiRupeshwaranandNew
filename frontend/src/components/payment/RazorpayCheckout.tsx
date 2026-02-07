'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  SubscriptionPaymentResponse,
  verifyOrderPayment,
  verifySubscriptionPayment,
} from '@/lib/api';

// Razorpay Checkout script type
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayCheckoutProps {
  /** Payment data returned from initiateSubscriptionPayment API */
  paymentData: SubscriptionPaymentResponse;
  /** Access token for verification API calls */
  accessToken: string;
  /** User info for prefill */
  user: {
    email: string;
    name?: string;
    phone?: string;
  };
  /** Called on successful payment verification */
  onSuccess: (response: { subscriptionId: string; message: string }) => void;
  /** Called on payment failure */
  onFailure: (error: { message: string; code?: string }) => void;
  /** Called when user closes the checkout modal */
  onDismiss?: () => void;
  /** Auto-open checkout on mount */
  autoOpen?: boolean;
}

/**
 * Loads the Razorpay checkout.js script dynamically
 */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RazorpayCheckout({
  paymentData,
  accessToken,
  user,
  onSuccess,
  onFailure,
  onDismiss,
  autoOpen = true,
}: RazorpayCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    loadRazorpayScript().then((loaded) => {
      setScriptLoaded(loaded);
      if (!loaded) {
        onFailure({ message: 'Failed to load payment gateway. Please refresh and try again.' });
      }
    });
  }, [onFailure]);

  const openCheckout = useCallback(async () => {
    if (!scriptLoaded || !window.Razorpay) {
      onFailure({ message: 'Payment gateway not loaded. Please refresh the page.' });
      return;
    }

    setIsLoading(true);

    try {
      const options: any = {
        key: paymentData.razorpayKeyId,
        name: 'Swami Rupeshwaranand Ashram',
        description: paymentData.planDescription || paymentData.planName,
        image: '/logo.png', // Ashram logo
        prefill: {
          email: user.email,
          name: user.name || '',
          contact: user.phone || '',
        },
        theme: {
          color: '#F97316', // Orange theme matching the site
        },
        notes: paymentData.notes || {},
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            onDismiss?.();
          },
          escape: true,
          confirm_close: true,
        },
      };

      if (paymentData.isAutopay && paymentData.razorpaySubscriptionId) {
        // ===== AUTOPAY FLOW (Razorpay Subscription) =====
        options.subscription_id = paymentData.razorpaySubscriptionId;
        options.recurring = true;

        options.handler = async (response: any) => {
          try {
            const result = await verifySubscriptionPayment(
              {
                razorpaySubscriptionId: response.razorpay_subscription_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                subscriptionId: paymentData.subscriptionId,
              },
              accessToken,
            );

            if (result.success) {
              onSuccess({
                subscriptionId: paymentData.subscriptionId,
                message: result.message,
              });
            } else {
              onFailure({ message: result.message || 'Payment verification failed' });
            }
          } catch (error: any) {
            onFailure({
              message: error?.message || 'Payment verification failed. Please contact support.',
            });
          } finally {
            setIsLoading(false);
          }
        };
      } else if (paymentData.razorpayOrderId) {
        // ===== ONE-TIME FLOW (Razorpay Order) =====
        options.order_id = paymentData.razorpayOrderId;
        options.amount = paymentData.amount;
        options.currency = paymentData.currency || 'INR';

        options.handler = async (response: any) => {
          try {
            const result = await verifyOrderPayment(
              {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                subscriptionId: paymentData.subscriptionId,
              },
              accessToken,
            );

            if (result.success) {
              onSuccess({
                subscriptionId: paymentData.subscriptionId,
                message: result.message,
              });
            } else {
              onFailure({ message: result.message || 'Payment verification failed' });
            }
          } catch (error: any) {
            onFailure({
              message: error?.message || 'Payment verification failed. Please contact support.',
            });
          } finally {
            setIsLoading(false);
          }
        };
      } else {
        // Free plan - already activated
        onSuccess({
          subscriptionId: paymentData.subscriptionId,
          message: 'Free plan activated successfully!',
        });
        setIsLoading(false);
        return;
      }

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (response: any) => {
        setIsLoading(false);
        onFailure({
          message: response.error?.description || 'Payment failed. Please try again.',
          code: response.error?.code,
        });
      });

      rzp.open();
    } catch (error: any) {
      setIsLoading(false);
      onFailure({
        message: error?.message || 'Failed to open payment gateway.',
      });
    }
  }, [scriptLoaded, paymentData, accessToken, user, onSuccess, onFailure, onDismiss]);

  // Auto-open checkout when script is loaded
  useEffect(() => {
    if (autoOpen && scriptLoaded && paymentData) {
      openCheckout();
    }
  }, [autoOpen, scriptLoaded, paymentData, openCheckout]);

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-xl text-center max-w-sm mx-4">
            <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-900 dark:text-white font-medium">Processing Payment...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Please complete the payment in the Razorpay window.
            </p>
          </div>
        </div>
      )}

      {/* Manual trigger button (when autoOpen is false) */}
      {!autoOpen && (
        <button
          onClick={openCheckout}
          disabled={!scriptLoaded || isLoading}
          className="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isLoading
            ? 'Processing...'
            : !scriptLoaded
              ? 'Loading...'
              : paymentData.isAutopay
                ? `Subscribe - ₹${paymentData.amount / 100}/month (Autopay)`
                : `Pay ₹${paymentData.amount / 100}`}
        </button>
      )}
    </>
  );
}
