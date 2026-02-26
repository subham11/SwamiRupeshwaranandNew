'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import Container from '@/components/ui/Container';
import RazorpayCheckout from '@/components/payment/RazorpayCheckout';
import {
  fetchSubscriptionPlans,
  initiateSubscriptionPayment,
  ApiSubscriptionPlan,
  SubscriptionPaymentResponse,
} from '@/lib/api';

type CheckoutState = 'plans' | 'initiating' | 'checkout' | 'success' | 'failure';

function SubscribeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPlanId = searchParams.get('plan');

  const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();

  const [plans, setPlans] = useState<ApiSubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(preselectedPlanId);
  const [state, setState] = useState<CheckoutState>('plans');
  const [paymentData, setPaymentData] = useState<SubscriptionPaymentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Load plans
  useEffect(() => {
    fetchSubscriptionPlans()
      .then((data) => {
        setPlans(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load subscription plans.');
        setLoading(false);
      });
  }, []);

  // Auto-initiate if plan is preselected and user is authenticated
  useEffect(() => {
    if (preselectedPlanId && isAuthenticated && accessToken && plans.length > 0 && state === 'plans') {
      const plan = plans.find((p) => p.id === preselectedPlanId);
      if (plan) {
        handleSelectPlan(plan.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedPlanId, isAuthenticated, accessToken, plans]);

  const handleSelectPlan = useCallback(
    async (planId: string) => {
      // If not logged in, redirect to login with return URL
      if (!isAuthenticated || !accessToken) {
        router.push(`/login?redirect=${encodeURIComponent(`/subscribe?plan=${planId}`)}`);
        return;
      }

      setSelectedPlanId(planId);
      setState('initiating');
      setError(null);

      try {
        const response = await initiateSubscriptionPayment(planId, accessToken);
        setPaymentData(response);

        // If it's a free plan (amount = 0), go straight to success
        if (response.amount === 0) {
          setState('success');
          setSuccessMessage('Free plan activated successfully!');
        } else {
          setState('checkout');
        }
      } catch (err: any) {
        setState('failure');
        setError(err?.message || 'Failed to initiate payment. Please try again.');
      }
    },
    [accessToken],
  );

  const handlePaymentSuccess = useCallback(
    (response: { subscriptionId: string; message: string }) => {
      setState('success');
      setSuccessMessage(response.message);
    },
    [],
  );

  const handlePaymentFailure = useCallback((err: { message: string; code?: string }) => {
    setState('failure');
    setError(err.message);
  }, []);

  const handleDismiss = useCallback(() => {
    setState('plans');
    setPaymentData(null);
  }, []);

  const getPlanBadge = (plan: ApiSubscriptionPlan) => {
    if (plan.price === 0) return 'Free';
    if (plan.price <= 2100) return 'UPI Autopay';
    return 'One-time';
  };

  const getPlanBadgeColor = (plan: ApiSubscriptionPlan) => {
    if (plan.price === 0) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (plan.price <= 2100) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
  };

  if (loading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          Choose Your Spiritual Journey
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Subscribe to access sacred Stotras, protective Kavach, and guidance from the Ashram.
          Plans up to &#8377;2100 support convenient UPI Autopay.
        </p>
      </div>

      {/* Success State */}
      {state === 'success' && (
        <div className="max-w-md mx-auto text-center">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8 mb-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
              Subscription Activated!
            </h2>
            <p className="text-green-700 dark:text-green-300">{successMessage}</p>
          </div>
          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard/subscription"
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Go to My Subscription
            </Link>
            <Link
              href="/teachings"
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Browse Content
            </Link>
          </div>
        </div>
      )}

      {/* Failure State */}
      {state === 'failure' && (
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">
              Payment Failed
            </h2>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
          <button
            onClick={() => {
              setState('plans');
              setError(null);
              setPaymentData(null);
            }}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Initiating State */}
      {state === 'initiating' && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-900 dark:text-white font-medium">Preparing your payment...</p>
          </div>
        </div>
      )}

      {/* Checkout State - Razorpay Modal */}
      {state === 'checkout' && paymentData && user && (
        <RazorpayCheckout
          paymentData={paymentData}
          accessToken={accessToken!}
          user={{
            email: user.email || '',
            name: (user as any).name || '',
          }}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
          onDismiss={handleDismiss}
          autoOpen={true}
        />
      )}

      {/* Plans Grid */}
      {(state === 'plans' || state === 'checkout') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const isPopular = plan.price === 2100; // Premium as popular

            return (
              <div
                key={plan.id}
                className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden transition-all duration-200 ${
                  isSelected
                    ? 'border-orange-500 ring-2 ring-orange-500 scale-[1.02]'
                    : isPopular
                      ? 'border-orange-300 dark:border-orange-700'
                      : 'border-gray-200 dark:border-gray-700'
                } hover:shadow-md`}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="bg-orange-500 text-white text-center py-1.5 text-sm font-medium">
                    Most Popular
                  </div>
                )}

                <div className="p-6">
                  {/* Plan badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanBadgeColor(plan)}`}>
                      {getPlanBadge(plan)}
                    </span>
                  </div>

                  {/* Plan name & price */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString()}`}
                    </span>
                    {plan.price > 0 && plan.price <= 2100 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">/month</span>
                    )}
                    {plan.price > 2100 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400"> one-time</span>
                    )}
                  </div>

                  {/* Description */}
                  {plan.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {plan.description}
                    </p>
                  )}

                  {/* Features */}
                  <ul className="space-y-2 mb-6">
                    {plan.features?.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="text-green-500 mt-0.5 shrink-0">&#10003;</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Subscribe button */}
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={state === 'checkout'}
                    className={`w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isPopular
                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                        : plan.price === 0
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'border-2 border-orange-600 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                    }`}
                  >
                    {plan.price === 0
                      ? 'Start Free'
                      : plan.price <= 2100
                        ? 'Subscribe with Autopay'
                        : 'Pay & Subscribe'}
                  </button>

                  {/* Payment method hint */}
                  {plan.price > 0 && plan.price <= 2100 && (
                    <p className="text-xs text-center text-gray-400 mt-2">
                      Auto-debited monthly via UPI
                    </p>
                  )}
                  {plan.price > 2100 && (
                    <p className="text-xs text-center text-gray-400 mt-2">
                      One-time payment via UPI/Card/NetBanking
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info section */}
      {state === 'plans' && (
        <div className="mt-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 md:p-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Payment Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">UPI Autopay Plans (&#8377;300 - &#8377;2100)</h4>
              <ul className="space-y-1">
                <li>&#8226; Automatic monthly renewal via UPI</li>
                <li>&#8226; Cancel anytime from your dashboard</li>
                <li>&#8226; Secured by Razorpay</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Premium Plans (&#8377;5100 & &#8377;21000)</h4>
              <ul className="space-y-1">
                <li>&#8226; One-time payment via UPI, Card, or NetBanking</li>
                <li>&#8226; Lifetime access to content</li>
                <li>&#8226; Includes personal guidance sessions</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}

export default function SubscribePage() {
  return (
    <Suspense
      fallback={
        <Container className="py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
          </div>
        </Container>
      }
    >
      <SubscribeContent />
    </Suspense>
  );
}
