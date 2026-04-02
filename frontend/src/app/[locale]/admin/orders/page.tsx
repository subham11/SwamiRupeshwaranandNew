'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import {
  fetchAllOrdersAdmin,
  updateOrderStatusAdmin,
  Order,
} from '@/lib/api';

// ============================================
// Types & Constants
// ============================================

type FilterStatus = 'all' | 'payment_pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const STATUS_COLORS: Record<string, string> = {
  payment_pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  delivered: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300',
};

const STATUS_LABELS: Record<string, string> = {
  payment_pending: 'Payment Pending',
  paid: 'Paid',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const FILTER_TABS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'payment_pending', label: 'Payment Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_OPTIONS = ['payment_pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

// ============================================
// Main Component
// ============================================

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading } = useAuth();

  // Data state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // Expanded order
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Status update modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  // ============================================
  // Load Data
  // ============================================

  const loadOrders = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const data = await fetchAllOrdersAdmin(accessToken);
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && isAdmin && accessToken) {
      loadOrders();
    }
  }, [isAuthenticated, isAdmin, accessToken, loadOrders]);

  // Auto-dismiss success
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  // Auto-dismiss error
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  // ============================================
  // Filtered orders
  // ============================================

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter((o) => o.status === filterStatus);

  // ============================================
  // Stats
  // ============================================

  const stats = {
    total: orders.length,
    paid: orders.filter((o) => o.status === 'paid').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
  };

  // ============================================
  // Status Update
  // ============================================

  const openStatusModal = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    setUpdatingOrder(order);
    setNewStatus(order.status);
    setTrackingNumber(order.trackingNumber || '');
    setAdminNotes('');
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!updatingOrder || !accessToken) return;
    try {
      setSaving(true);
      const data: { status: string; adminNotes?: string; trackingNumber?: string } = {
        status: newStatus,
      };
      if (adminNotes.trim()) data.adminNotes = adminNotes.trim();
      if (trackingNumber.trim()) data.trackingNumber = trackingNumber.trim();

      await updateOrderStatusAdmin(updatingOrder.id, data, accessToken);
      setSuccess(`Order ${updatingOrder.id.slice(0, 8)} status updated to ${STATUS_LABELS[newStatus] || newStatus}`);
      setShowStatusModal(false);
      setUpdatingOrder(null);
      loadOrders();
    } catch {
      setError('Failed to update order status');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // Render helpers
  // ============================================

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    const symbol = currency === 'INR' ? '₹' : '$';
    return `${symbol}${amount.toLocaleString()}`;
  };

  // ============================================
  // Auth guard
  // ============================================

  if (isLoading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </Container>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <Container className="py-8">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">You do not have permission to view this page.</p>
        </div>
      </Container>
    );
  }

  // ============================================
  // Main Render
  // ============================================

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Orders Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">View and manage customer orders</p>
        </div>
        <Button onClick={loadOrders} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg">
          Refresh
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Paid</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.paid}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Processing</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.processing}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Shipped</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.shipped}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === tab.value
                ? 'bg-orange-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
            {tab.value !== 'all' && (
              <span className="ml-1.5 text-xs opacity-75">
                ({orders.filter((o) => o.status === tab.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No orders found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Order ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Items</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Payment</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    isExpanded={expandedOrderId === order.id}
                    onToggle={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                    onUpdateStatus={openStatusModal}
                    formatDate={formatDate}
                    formatAmount={formatAmount}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && updatingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Update Order Status
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Order: {updatingOrder.id.slice(0, 8)}... | {updatingOrder.userEmail}
            </p>

            {/* New Status */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s] || s}
                  </option>
                ))}
              </select>
            </div>

            {/* Tracking Number (shown when status is shipped) */}
            {(newStatus === 'shipped' || newStatus === 'delivered') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            )}

            {/* Admin Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Admin Notes (optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any internal notes..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setUpdatingOrder(null);
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={saving || newStatus === updatingOrder.status}
                className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}

// ============================================
// Order Row Component
// ============================================

function OrderRow({
  order,
  isExpanded,
  onToggle,
  onUpdateStatus,
  formatDate,
  formatAmount,
}: {
  order: Order;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateStatus: (order: Order, e: React.MouseEvent) => void;
  formatDate: (d: string) => string;
  formatAmount: (amount: number, currency: string) => string;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
      >
        <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">
          {order.id.slice(0, 8)}...
        </td>
        <td className="px-4 py-3">
          <div className="text-gray-900 dark:text-white text-sm">{order.shippingAddress?.fullName || '—'}</div>
          <div className="text-gray-500 dark:text-gray-400 text-xs">{order.userEmail}</div>
        </td>
        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
          {order.totalItems} item{order.totalItems !== 1 ? 's' : ''}
        </td>
        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
          {formatAmount(order.totalAmount, order.currency)}
        </td>
        <td className="px-4 py-3">
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
            {STATUS_LABELS[order.status] || order.status}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
            order.paymentStatus === 'paid' || order.paymentStatus === 'captured'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : order.paymentStatus === 'failed'
              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
          }`}>
            {order.paymentStatus}
          </span>
        </td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
          {formatDate(order.createdAt)}
        </td>
        <td className="px-4 py-3">
          <button
            onClick={(e) => onUpdateStatus(order, e)}
            className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 text-sm font-medium"
          >
            Update
          </button>
        </td>
      </tr>

      {/* Expanded Details */}
      {isExpanded && (
        <tr className="bg-gray-50 dark:bg-gray-700/20">
          <td colSpan={8} className="px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Shipping Address */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Shipping Address</h4>
                {order.shippingAddress ? (
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                    <p>{order.shippingAddress.fullName}</p>
                    <p>{order.shippingAddress.addressLine1}</p>
                    {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                    <p className="mt-1">Phone: {order.shippingAddress.phone}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No address provided</p>
                )}
              </div>

              {/* Order Items */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Items</h4>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">
                        {item.title} x{item.quantity}
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {formatAmount(item.subtotal, order.currency)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between text-sm font-semibold">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatAmount(order.totalAmount, order.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Details</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p><span className="font-medium">Order ID:</span> {order.id}</p>
                  {order.razorpayOrderId && (
                    <p><span className="font-medium">Razorpay Order:</span> {order.razorpayOrderId}</p>
                  )}
                  {order.razorpayPaymentId && (
                    <p><span className="font-medium">Payment ID:</span> {order.razorpayPaymentId}</p>
                  )}
                  {order.trackingNumber && (
                    <p><span className="font-medium">Tracking:</span> {order.trackingNumber}</p>
                  )}
                  <p><span className="font-medium">Created:</span> {formatDate(order.createdAt)}</p>
                  <p><span className="font-medium">Updated:</span> {formatDate(order.updatedAt)}</p>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
