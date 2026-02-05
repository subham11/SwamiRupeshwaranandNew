'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import Container from '@/components/ui/Container';
import {
  fetchMySubscription,
  fetchSubscriptionPlans,
  ApiSubscriptionPlan,
} from '@/lib/api';

interface UserSubscription {
  id: string;
  planId: string;
  planName: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentMethod?: string;
  lastPaymentDate?: string;
  nextBillingDate?: string;
  amount: number;
  currency: string;
  features: string[];
}

export default function SubscriptionDashboardPage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading } = useAuth();

  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<ApiSubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const loadData = useCallback(async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const [subResponse, plansResponse] = await Promise.all([
        fetchMySubscription(accessToken).catch(() => null),
        fetchSubscriptionPlans().catch(() => [] as ApiSubscriptionPlan[]),
      ]);

      if (subResponse) {
        setSubscription(subResponse as unknown as UserSubscription);
      }
      setAvailablePlans(plansResponse);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard/subscription');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      loadData();
    }
  }, [isAuthenticated, accessToken, loadData]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
    return styles[status] || styles.pending;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (isLoading || loading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <Link href="/dashboard" className="hover:text-orange-600">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Subscription</span>
        </nav>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Subscription</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your subscription and access premium spiritual content.
        </p>
      </div>

      {subscription ? (
        <>
          {/* Current Subscription Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm opacity-90 mb-1">Current Plan</p>
                  <h2 className="text-2xl font-bold">{subscription.planName}</h2>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(subscription.status)}`}>
                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Start Date</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(subscription.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">End Date</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(subscription.endDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Days Remaining</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {getDaysRemaining(subscription.endDate) > 0 
                      ? `${getDaysRemaining(subscription.endDate)} days`
                      : 'Expired'}
                  </p>
                </div>
              </div>

              {subscription.status === 'active' && getDaysRemaining(subscription.endDate) <= 7 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                    ⚠️ Your subscription is expiring soon. Renew now to continue enjoying premium content.
                  </p>
                </div>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Your Benefits</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {subscription.features?.length > 0 ? (
                    subscription.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <span className="text-green-500">✓</span>
                        {feature}
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <span className="text-green-500">✓</span>
                        Access to premium teachings
                      </li>
                      <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <span className="text-green-500">✓</span>
                        Exclusive video content
                      </li>
                      <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <span className="text-green-500">✓</span>
                        Downloadable resources
                      </li>
                      <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <span className="text-green-500">✓</span>
                        Priority event access
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Upgrade Plan
                </button>
                <Link
                  href="/teachings"
                  className="px-4 py-2 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                >
                  Browse Content
                </Link>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Payment Details</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Amount</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    ₹{subscription.amount} / {subscription.planName.includes('Annual') ? 'year' : 'month'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Auto Renewal</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {subscription.autoRenew ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                {subscription.lastPaymentDate && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Last Payment</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(subscription.lastPaymentDate)}
                    </p>
                  </div>
                )}
                {subscription.nextBillingDate && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Next Billing</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(subscription.nextBillingDate)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* No Subscription - Show Plans */
        <div className="text-center py-8">
          <div className="max-w-md mx-auto mb-8">
            <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🧘</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No Active Subscription
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Subscribe to access premium spiritual content, exclusive teachings, and much more.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {availablePlans.length > 0 ? (
              availablePlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${
                    plan.popular
                      ? 'border-orange-500 ring-2 ring-orange-500'
                      : 'border-gray-200 dark:border-gray-700'
                  } overflow-hidden`}
                >
                  {plan.popular && (
                    <div className="bg-orange-500 text-white text-center py-1 text-sm font-medium">
                      Most Popular
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                      ₹{plan.price}
                      <span className="text-sm font-normal text-gray-500">
                        /{plan.interval === 'year' ? 'year' : 'month'}
                      </span>
                    </p>
                    <ul className="space-y-2 mb-6">
                      {plan.features?.slice(0, 4).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <span className="text-green-500">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/subscribe?plan=${plan.id}`}
                      className={`block w-full py-2 rounded-lg text-center font-medium transition-colors ${
                        plan.popular
                          ? 'bg-orange-600 text-white hover:bg-orange-700'
                          : 'border border-orange-600 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                      }`}
                    >
                      Subscribe Now
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No subscription plans available at the moment.
                </p>
                <Link
                  href="/contact"
                  className="text-orange-600 hover:underline"
                >
                  Contact us for more information
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upgrade Your Plan</h2>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {availablePlans
                  .filter((p) => p.price > (subscription?.amount || 0))
                  .map((plan) => (
                    <div
                      key={plan.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-orange-500 transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          ₹{plan.price}/{plan.interval === 'year' ? 'yr' : 'mo'}
                        </p>
                      </div>
                      <button className="mt-4 w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                        Upgrade to {plan.name}
                      </button>
                    </div>
                  ))}
              </div>
              {availablePlans.filter((p) => p.price > (subscription?.amount || 0)).length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  You're already on the highest plan! 🎉
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
