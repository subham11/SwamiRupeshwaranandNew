'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import Container from '@/components/ui/Container';
import {
  fetchSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  fetchAllSubscriptions,
  activateSubscription,
  cancelSubscription,
  ApiSubscriptionPlan,
  UserSubscription,
} from '@/lib/api';

type TabType = 'plans' | 'subscriptions';

interface PlanFormData {
  name: string;
  description: string;
  price: string;
  currency: string;
  interval: 'month' | 'year';
  features: string;
  popular: boolean;
  isActive: boolean;
}

const EMPTY_PLAN: PlanFormData = {
  name: '',
  description: '',
  price: '',
  currency: 'INR',
  interval: 'month',
  features: '',
  popular: false,
  isActive: true,
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  trialing: 'bg-blue-100 text-blue-800',
};

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading } = useAuth();

  const [tab, setTab] = useState<TabType>('plans');
  const [plans, setPlans] = useState<ApiSubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Plan form
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<PlanFormData>(EMPTY_PLAN);
  const [saving, setSaving] = useState(false);

  // Subscription filter
  const [subFilter, setSubFilter] = useState('all');

  // Cancel modal
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const loadPlans = useCallback(async () => {
    try {
      const data = await fetchSubscriptionPlans();
      setPlans(data);
    } catch {
      setError('Failed to load plans');
    }
  }, []);

  const loadSubscriptions = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await fetchAllSubscriptions(accessToken);
      setSubscriptions(data.items || []);
    } catch {
      setError('Failed to load subscriptions');
    }
  }, [accessToken]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    await Promise.all([loadPlans(), loadSubscriptions()]);
    setLoading(false);
  }, [loadPlans, loadSubscriptions]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && isAdmin && accessToken) {
      loadAll();
    }
  }, [isAuthenticated, isAdmin, accessToken, loadAll]);

  if (isLoading || loading) {
    return (
      <Container className="py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
        <p className="mt-4 text-gray-600">Loading subscriptions…</p>
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Container className="py-20 text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-2 text-gray-600">Only admins and super admins can manage subscriptions.</p>
      </Container>
    );
  }

  // ---- Plan helpers ----
  const openCreatePlan = () => {
    setEditingPlanId(null);
    setPlanForm(EMPTY_PLAN);
    setShowPlanForm(true);
    setError('');
  };

  const openEditPlan = (p: ApiSubscriptionPlan) => {
    setEditingPlanId(p.id);
    setPlanForm({
      name: p.name,
      description: p.description || '',
      price: String(p.price),
      currency: p.currency || 'INR',
      interval: p.interval,
      features: (p.features || []).join('\n'),
      popular: !!p.popular,
      isActive: p.isActive,
    });
    setShowPlanForm(true);
    setError('');
  };

  const handleSavePlan = async () => {
    if (!accessToken) return;
    if (!planForm.name || !planForm.price) {
      setError('Name and price are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: planForm.name,
        description: planForm.description || undefined,
        price: parseFloat(planForm.price),
        currency: planForm.currency,
        interval: planForm.interval,
        features: planForm.features
          .split('\n')
          .map((f) => f.trim())
          .filter(Boolean),
        popular: planForm.popular,
        isActive: planForm.isActive,
      };
      if (editingPlanId) {
        await updateSubscriptionPlan(editingPlanId, payload, accessToken);
      } else {
        await createSubscriptionPlan(payload as Omit<ApiSubscriptionPlan, 'id'>, accessToken);
      }
      setShowPlanForm(false);
      await loadPlans();
    } catch {
      setError('Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!accessToken) return;
    if (!confirm('Delete this plan? This cannot be undone.')) return;
    try {
      await deleteSubscriptionPlan(id, accessToken);
      await loadPlans();
    } catch {
      setError('Failed to delete plan. Only super admins can delete plans.');
    }
  };

  // ---- Subscription helpers ----
  const handleActivate = async (id: string) => {
    if (!accessToken) return;
    try {
      await activateSubscription(id, accessToken);
      await loadSubscriptions();
    } catch {
      setError('Failed to activate subscription');
    }
  };

  const handleCancel = async () => {
    if (!accessToken || !cancelId) return;
    try {
      await cancelSubscription(cancelId, accessToken, cancelReason || undefined);
      setCancelId(null);
      setCancelReason('');
      await loadSubscriptions();
    } catch {
      setError('Failed to cancel subscription');
    }
  };

  const filteredSubs =
    subFilter === 'all'
      ? subscriptions
      : subscriptions.filter((s) => s.status === subFilter);

  const getPlanName = (planId: string) => plans.find((p) => p.id === planId)?.name || planId;

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Container className="py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-500 mt-1">Manage plans and user subscriptions</p>
        </div>
        <button
          onClick={() => router.push('/admin')}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          ← Back
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{plans.length}</p>
          <p className="text-sm text-gray-500">Total Plans</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {plans.filter((p) => p.isActive).length}
          </p>
          <p className="text-sm text-gray-500">Active Plans</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{subscriptions.length}</p>
          <p className="text-sm text-gray-500">Total Subscriptions</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {subscriptions.filter((s) => s.status === 'active').length}
          </p>
          <p className="text-sm text-gray-500">Active Subscriptions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {([
          { key: 'plans', label: 'Plans' },
          { key: 'subscriptions', label: 'User Subscriptions' },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === t.key
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* =================== PLANS TAB =================== */}
      {tab === 'plans' && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={openCreatePlan}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              + Create Plan
            </button>
          </div>

          {plans.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-gray-500">No subscription plans yet</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white rounded-xl border p-6 relative ${
                    !plan.isActive ? 'opacity-60' : ''
                  } ${plan.popular ? 'ring-2 ring-orange-400' : ''}`}
                >
                  {plan.popular && (
                    <span className="absolute -top-2 right-4 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                  )}
                  <p className="text-3xl font-bold text-orange-600 mt-3">
                    ₹{plan.price}
                    <span className="text-sm font-normal text-gray-400">/{plan.interval}</span>
                  </p>
                  {plan.features && plan.features.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {plan.features.map((f, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-center gap-1">
                          <span className="text-green-500">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        plan.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditPlan(plan)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* =================== SUBSCRIPTIONS TAB =================== */}
      {tab === 'subscriptions' && (
        <>
          {/* Filter */}
          <div className="flex gap-2 mb-6">
            {['all', 'active', 'cancelled', 'expired', 'pending'].map((s) => (
              <button
                key={s}
                onClick={() => setSubFilter(s)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  subFilter === s
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {filteredSubs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border">
              <p className="text-4xl mb-3">📊</p>
              <p className="text-gray-500">No subscriptions found</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 text-sm">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Start</th>
                    <th className="px-4 py-3">End</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSubs.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                        {sub.userId.slice(0, 12)}…
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {getPlanName(sub.planId)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            STATUS_COLORS[sub.status] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(sub.startDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(sub.endDate)}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {sub.status !== 'active' && (
                          <button
                            onClick={() => handleActivate(sub.id)}
                            className="text-green-600 hover:underline text-sm"
                          >
                            Activate
                          </button>
                        )}
                        {sub.status === 'active' && (
                          <button
                            onClick={() => setCancelId(sub.id)}
                            className="text-red-600 hover:underline text-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* =================== PLAN FORM MODAL =================== */}
      {showPlanForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPlanId ? 'Edit Plan' : 'Create Plan'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Plan name"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Plan description"
                  rows={2}
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="499"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    title="Currency"
                    value={planForm.currency}
                    onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interval</label>
                  <select
                    title="Billing interval"
                    value={planForm.interval}
                    onChange={(e) =>
                      setPlanForm({ ...planForm, interval: e.target.value as 'month' | 'year' })
                    }
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  >
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Features (one per line)
                </label>
                <textarea
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                  rows={4}
                  value={planForm.features}
                  onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.popular}
                    onChange={(e) => setPlanForm({ ...planForm, popular: e.target.checked })}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  Mark as Popular
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.isActive}
                    onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  Active
                </label>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPlanForm(false);
                  setEditingPlanId(null);
                  setError('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlan}
                disabled={saving}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving…' : editingPlanId ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================== CANCEL MODAL =================== */}
      {cancelId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Cancel Subscription</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to cancel this subscription? This action can be reversed by activating it again.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cancellation Reason (optional)
                </label>
                <textarea
                  placeholder="Reason for cancellation"
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setCancelId(null);
                  setCancelReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Keep Active
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
