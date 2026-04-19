'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import Container from '@/components/ui/Container';
import {
  fetchAdminTransactions,
  initiateAdminRefund,
  PaymentRecord,
} from '@/lib/api';

// ============================================
// Constants & helpers
// ============================================

type TypeFilter = 'all' | 'yagya' | 'subscription' | 'donation';
type StatusFilter = 'all' | 'created' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'cancelled';

const STATUS_COLORS: Record<string, string> = {
  captured: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-purple-100 text-purple-800',
  created: 'bg-yellow-100 text-yellow-800',
  authorized: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-zinc-100 text-zinc-600',
};

const TYPE_COLORS: Record<string, string> = {
  yagya: 'bg-orange-100 text-orange-800',
  subscription: 'bg-blue-100 text-blue-800',
  donation: 'bg-green-100 text-green-800',
};

const TYPE_TABS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'yagya', label: 'Yagya' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'donation', label: 'Donation' },
];

const STATUS_OPTIONS: StatusFilter[] = ['all', 'created', 'authorized', 'captured', 'failed', 'refunded', 'cancelled'];

function formatAmount(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ============================================
// Loading skeleton
// ============================================

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-12 bg-zinc-100 rounded-lg" />
      ))}
    </div>
  );
}

// ============================================
// Detail modal
// ============================================

function DetailModal({ payment, onClose }: { payment: PaymentRecord; onClose: () => void }) {
  const rows: { label: string; value: string | undefined }[] = [
    { label: 'Booking ID', value: payment.id },
    { label: 'Name', value: payment.name },
    { label: 'Email', value: payment.userEmail },
    { label: 'Phone', value: payment.phone },
    { label: 'Type', value: payment.type },
    { label: 'Category', value: payment.category },
    { label: 'Tier', value: payment.tier },
    { label: 'Amount', value: formatAmount(payment.amount) },
    { label: 'Status', value: payment.status },
    { label: 'Razorpay Order ID', value: payment.razorpayOrderId },
    { label: 'Razorpay Payment ID', value: payment.razorpayPaymentId },
    { label: 'Failure Reason', value: payment.failureReason },
    { label: 'Created', value: formatDate(payment.createdAt) },
    { label: 'Updated', value: formatDate(payment.updatedAt) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-lg font-bold text-gray-900">Booking Details</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-2xl leading-none">✕</button>
        </div>
        <div className="px-6 py-4 space-y-3">
          {rows.map(({ label, value }) =>
            value ? (
              <div key={label} className="flex gap-3 text-sm">
                <span className="w-40 flex-shrink-0 font-medium text-zinc-500">{label}</span>
                <span className="text-gray-900 break-all">{value}</span>
              </div>
            ) : null
          )}
        </div>
        <div className="px-6 py-4 border-t border-zinc-100">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Refund modal
// ============================================

interface RefundModalProps {
  payment: PaymentRecord;
  onClose: () => void;
  onConfirm: (amount: number, reason: string) => Promise<void>;
  loading: boolean;
}

function RefundModal({ payment, onClose, onConfirm, loading }: RefundModalProps) {
  const [amount, setAmount] = useState<string>(String(payment.amount / 100));
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    const amountRupees = parseFloat(amount);
    if (isNaN(amountRupees) || amountRupees <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    const maxRupees = payment.amount / 100;
    if (amountRupees > maxRupees) {
      setError(`Amount cannot exceed ${formatAmount(payment.amount)}.`);
      return;
    }
    setError('');
    await onConfirm(Math.round(amountRupees * 100), reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Initiate Refund</h2>
        <p className="text-sm text-zinc-500 mb-4">
          Refund for payment <span className="font-mono text-xs">{payment.id}</span>
        </p>

        {/* Payment details */}
        <div className="bg-zinc-50 rounded-lg p-3 mb-4 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-500">Name / Email</span>
            <span className="font-medium">{payment.name || payment.userEmail || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Type</span>
            <span className="font-medium capitalize">{payment.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Original Amount</span>
            <span className="font-medium">{formatAmount(payment.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Razorpay Payment ID</span>
            <span className="font-mono text-xs">{payment.razorpayPaymentId || '—'}</span>
          </div>
        </div>

        {/* Amount input */}
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Refund Amount (₹)
        </label>
        <input
          type="number"
          className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={1}
          max={payment.amount / 100}
          step={0.01}
        />

        {/* Reason textarea */}
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Reason (optional)
        </label>
        <textarea
          className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          rows={3}
          placeholder="Reason for refund…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Confirm Refund
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main component
// ============================================

export default function AdminTransactionsPage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading } = useAuth();

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Refund modal
  const [refundPayment, setRefundPayment] = useState<PaymentRecord | null>(null);
  const [refundLoading, setRefundLoading] = useState(false);
  const [detailPayment, setDetailPayment] = useState<PaymentRecord | null>(null);

  // Auth redirect
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/admin/transactions');
    } else if (!isLoading && isAuthenticated && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, isAdmin, router]);

  const loadTransactions = useCallback(
    async (reset = false) => {
      if (!accessToken) return;

      if (reset) {
        setLoading(true);
        setPayments([]);
        setCursor(undefined);
      } else {
        setLoadingMore(true);
      }

      try {
        const currentCursor = reset ? undefined : cursor;
        const res = await fetchAdminTransactions(accessToken, {
          limit: 50,
          cursor: currentCursor,
          type: typeFilter !== 'all' ? typeFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        });

        if (reset) {
          setPayments(res.items);
        } else {
          setPayments((prev) => [...prev, ...res.items]);
        }
        setCursor(res.cursor);
        setHasMore(!!res.cursor);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load transactions';
        setError(msg);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [accessToken, typeFilter, statusFilter, cursor],
  );

  // Initial load & filter changes
  useEffect(() => {
    if (isAuthenticated && isAdmin && accessToken) {
      loadTransactions(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin, accessToken, typeFilter, statusFilter]);

  const handleRefund = async (amount: number, reason: string) => {
    if (!refundPayment || !accessToken) return;
    setRefundLoading(true);
    try {
      await initiateAdminRefund(refundPayment.id, { amount, reason }, accessToken);
      setSuccess(`Refund of ${formatAmount(amount)} initiated successfully.`);
      setRefundPayment(null);
      // Update local state
      setPayments((prev) =>
        prev.map((p) => (p.id === refundPayment.id ? { ...p, status: 'refunded' } : p)),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Refund failed';
      setError(msg);
    } finally {
      setRefundLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  // Stats derived from loaded items
  const capturedItems = payments.filter((p) => p.status === 'captured');
  const failedCount = payments.filter((p) => p.status === 'failed').length;
  const cancelledCount = payments.filter((p) => p.status === 'cancelled').length;
  const refundedCount = payments.filter((p) => p.status === 'refunded').length;
  const totalCaptured = capturedItems.reduce((sum, p) => sum + p.amount, 0);

  if (isLoading) {
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Transactions &amp; Bookings</h1>
        <p className="text-zinc-500">View, filter and manage all payments across subscriptions, donations, and yagya bookings.</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold ml-4">✕</button>
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Stats bar */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Loaded</p>
            <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
            <p className="text-xs text-zinc-400">transactions</p>
          </div>
          <div className="bg-white border border-zinc-200 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Total Captured</p>
            <p className="text-2xl font-bold text-green-700">{formatAmount(totalCaptured)}</p>
            <p className="text-xs text-zinc-400">{capturedItems.length} payments</p>
          </div>
          <div className="bg-white border border-zinc-200 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Failed / Cancelled</p>
            <p className="text-2xl font-bold text-red-600">{failedCount} <span className="text-zinc-400 text-base font-medium">/ {cancelledCount}</span></p>
            <p className="text-xs text-zinc-400">failed / user-cancelled</p>
          </div>
          <div className="bg-white border border-zinc-200 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Refunded</p>
            <p className="text-2xl font-bold text-purple-700">{refundedCount}</p>
            <p className="text-xs text-zinc-400">payments</p>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4">
        {/* Type tabs */}
        <div className="flex gap-1 bg-zinc-100 rounded-lg p-1">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setTypeFilter(tab.value)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                typeFilter === tab.value
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton />
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">💰</p>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No transactions found</h3>
            <p className="text-zinc-500 text-sm">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Name / Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Category / Tier</th>
                  <th className="text-right px-4 py-3 font-semibold text-zinc-600">Amount</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Razorpay ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-zinc-50 transition-colors">
                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                      {formatDate(payment.createdAt)}
                    </td>

                    {/* Name / Email — click to open detail */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDetailPayment(payment)}
                        className="text-left hover:underline cursor-pointer group"
                      >
                        <div className="font-medium text-gray-900 truncate max-w-[160px] group-hover:text-orange-600">
                          {payment.name || '—'}
                        </div>
                        <div className="text-xs text-zinc-400 truncate max-w-[160px]">
                          {payment.userEmail || '—'}
                        </div>
                      </button>
                    </td>

                    {/* Type badge */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLORS[payment.type] || 'bg-zinc-100 text-zinc-700'}`}
                      >
                        {payment.type}
                      </span>
                    </td>

                    {/* Category / Tier */}
                    <td className="px-4 py-3 text-xs text-zinc-600">
                      <div>{payment.category || '—'}</div>
                      {payment.tier && <div className="text-zinc-400">{payment.tier}</div>}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                      {formatAmount(payment.amount)}
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[payment.status] || 'bg-zinc-100 text-zinc-700'}`}
                      >
                        {payment.status}
                      </span>
                    </td>

                    {/* Razorpay ID */}
                    <td className="px-4 py-3 text-xs font-mono text-zinc-500 max-w-[140px] truncate">
                      {payment.razorpayPaymentId || payment.razorpayOrderId || '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {payment.status === 'captured' && (
                          <button
                            onClick={() => setRefundPayment(payment)}
                            className="text-xs px-2 py-1 rounded bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 font-medium"
                          >
                            Refund
                          </button>
                        )}
                        <button
                          onClick={() => copyToClipboard(payment.razorpayPaymentId || payment.razorpayOrderId || payment.id)}
                          className="text-xs px-2 py-1 rounded bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
                          title="Copy ID"
                        >
                          Copy ID
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Load more */}
        {hasMore && !loading && (
          <div className="px-4 py-4 border-t border-zinc-100 flex justify-center">
            <button
              onClick={() => loadTransactions(false)}
              disabled={loadingMore}
              className="px-6 py-2 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {loadingMore && (
                <span className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
              )}
              Load more
            </button>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detailPayment && (
        <DetailModal payment={detailPayment} onClose={() => setDetailPayment(null)} />
      )}

      {/* Refund modal */}
      {refundPayment && (
        <RefundModal
          payment={refundPayment}
          onClose={() => setRefundPayment(null)}
          onConfirm={handleRefund}
          loading={refundLoading}
        />
      )}
    </Container>
  );
}
