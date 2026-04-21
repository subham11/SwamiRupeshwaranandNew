'use client';

import { useCallback, useEffect, useState } from 'react';
import { verifyYagyaPayment, cancelYagyaPayment, type YagyaPaymentResponse } from '@/lib/api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayYagyaCheckoutProps {
  /** Payment data from initiateYagyaPayment API */
  paymentData: YagyaPaymentResponse;
  /** Booking category (needed for verification) */
  category: string;
  /** Tier ID (needed to select correct Razorpay account for sponsor tiers) */
  tier?: string;
  /** Participant info for prefill */
  participant: {
    name: string;
    email?: string;
    phone?: string;
  };
  /** Called on successful payment verification */
  onSuccess: (response: { bookingId: string; message: string }) => void;
  /** Called on payment failure */
  onFailure: (error: { message: string; code?: string }) => void;
  /** Called when user closes the checkout modal */
  onDismiss?: () => void;
  /** Auto-open checkout on mount */
  autoOpen?: boolean;
}

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

export default function RazorpayYagyaCheckout({
  paymentData,
  category,
  tier,
  participant,
  onSuccess,
  onFailure,
  onDismiss,
  autoOpen = true,
}: RazorpayYagyaCheckoutProps) {
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
        order_id: paymentData.razorpayOrderId,
        amount: paymentData.amount,
        currency: paymentData.currency || 'INR',
        name: 'Swami Rupeshwaranand Ashram',
        description: `Maha Yagya — ${paymentData.notes?.category || category}`,
        image: '/logo.png',
        prefill: {
          name: participant.name,
          email: participant.email || '',
          contact: participant.phone || '',
        },
        theme: {
          color: '#F97316',
        },
        notes: paymentData.notes || {},
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            // Mark payment as failed/cancelled in DB (fire-and-forget)
            cancelYagyaPayment(paymentData.bookingId).catch(() => {});
            onDismiss?.();
          },
          escape: true,
          confirm_close: true,
        },
        handler: async (response: any) => {
          try {
            const result = await verifyYagyaPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              bookingId: paymentData.bookingId,
              category,
              tier: tier || paymentData.notes?.tierId,
            });

            if (result.success) {
              onSuccess({
                bookingId: paymentData.bookingId,
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
        },
      };

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
  }, [scriptLoaded, paymentData, category, tier, participant, onSuccess, onFailure, onDismiss]);

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

      {!autoOpen && (
        <button
          onClick={openCheckout}
          disabled={!scriptLoaded || isLoading}
          className="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isLoading ? 'Processing...' : !scriptLoaded ? 'Loading...' : `Pay ₹${paymentData.amount / 100}`}
        </button>
      )}
    </>
  );
}
