'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { useCart } from '@/lib/CartContext';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import {
  fetchMyOrders,
  fetchMySubscription,
  fetchMyPayments,
  fetchWishlist,
  removeFromWishlist,
  getInvoiceUrl,
  type Order,
  type WishlistItem,
} from '@/lib/api';

type TabKey = 'profile' | 'orders' | 'subscriptions' | 'wishlist' | 'security';

// ---- Skeleton components ----

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-zinc-200 dark:border-zinc-700 p-5">
      <div className="flex justify-between mb-3">
        <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded" />
        <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
      </div>
      <div className="h-3 w-40 bg-zinc-200 dark:bg-zinc-700 rounded mb-2" />
      <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-700 rounded mb-2" />
      <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="animate-pulse rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <div className="aspect-square bg-zinc-200 dark:bg-zinc-700 rounded-lg mb-3" />
          <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded mb-2" />
          <div className="h-3 w-1/2 bg-zinc-200 dark:bg-zinc-700 rounded mb-3" />
          <div className="h-9 bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// ---- Status badge helper ----

const ORDER_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  payment_pending: { label: 'Payment Pending', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
  paid: { label: 'Paid', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  processing: { label: 'Processing', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  shipped: { label: 'Shipped', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
  delivered: { label: 'Delivered', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = ORDER_STATUS_CONFIG[status] || { label: status, bg: 'bg-zinc-100 dark:bg-zinc-700', text: 'text-zinc-600 dark:text-zinc-300' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

// ---- Tab config ----

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  {
    key: 'profile',
    label: 'Profile',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    key: 'orders',
    label: 'Orders',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    key: 'subscriptions',
    label: 'Subscriptions',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
  },
  {
    key: 'wishlist',
    label: 'Wishlist',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    key: 'security',
    label: 'Security',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
];

// ---- Main Component ----

export default function DashboardPage() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    accessToken,
    updateProfile,
    changePassword,
    logout,
    setPassword,
    clearError,
  } = useAuth();

  const { addToCart } = useCart();

  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  // Profile state
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Messages
  const [successMessage, setSuccessMessage] = useState('');

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Subscriptions state
  const [subscription, setSubscription] = useState<any>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState('');
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // Wishlist state
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/login?redirect=/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Initialize form fields
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  // Clear messages after timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Fetch orders when tab is active
  const loadOrders = useCallback(async () => {
    if (!accessToken) return;
    setOrdersLoading(true);
    setOrdersError('');
    try {
      const data = await fetchMyOrders(accessToken);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setOrdersError(err?.message || 'Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  }, [accessToken]);

  // Fetch subscriptions when tab is active
  const loadSubscription = useCallback(async () => {
    if (!accessToken) return;
    setSubLoading(true);
    setSubError('');
    try {
      const data = await fetchMySubscription(accessToken);
      setSubscription(data);
    } catch (err: any) {
      if (err?.message?.includes('404') || err?.message?.includes('not found')) {
        setSubscription(null);
      } else {
        setSubError(err?.message || 'Failed to load subscription');
      }
    } finally {
      setSubLoading(false);
    }
  }, [accessToken]);

  const loadPayments = useCallback(async () => {
    if (!accessToken) return;
    setPaymentsLoading(true);
    try {
      const data = await fetchMyPayments(accessToken);
      setPayments(Array.isArray(data) ? data : []);
    } catch {
      // non-critical
    } finally {
      setPaymentsLoading(false);
    }
  }, [accessToken]);

  // Fetch wishlist when tab is active
  const loadWishlist = useCallback(async () => {
    if (!accessToken) return;
    setWishlistLoading(true);
    setWishlistError('');
    try {
      const data = await fetchWishlist(accessToken);
      setWishlistItems(data?.items || []);
    } catch (err: any) {
      setWishlistError(err?.message || 'Failed to load wishlist');
    } finally {
      setWishlistLoading(false);
    }
  }, [accessToken]);

  // Load data when switching tabs
  useEffect(() => {
    if (activeTab === 'orders' && orders.length === 0 && !ordersLoading) {
      loadOrders();
    }
  }, [activeTab, orders.length, ordersLoading, loadOrders]);

  useEffect(() => {
    if (activeTab === 'subscriptions' && !subscription && !subLoading) {
      loadSubscription();
      loadPayments();
    }
  }, [activeTab, subscription, subLoading, loadSubscription, loadPayments]);

  useEffect(() => {
    if (activeTab === 'wishlist' && wishlistItems.length === 0 && !wishlistLoading) {
      loadWishlist();
    }
  }, [activeTab, wishlistItems.length, wishlistLoading, loadWishlist]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
      </div>
    );
  }

  // ---- Handlers ----

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const result = await updateProfile({ name, phone });
    if (result.success) {
      setSuccessMessage('Profile updated successfully!');
      setEditMode(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (newPassword !== confirmPassword) return;
    let result;
    if (!user.hasPassword) {
      result = await setPassword(newPassword, confirmPassword);
    } else {
      result = await changePassword(currentPassword, newPassword);
    }
    if (result.success) {
      setSuccessMessage(user.hasPassword ? 'Password changed successfully!' : 'Password set successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    if (!accessToken) return;
    // Optimistic update
    setWishlistItems((prev) => prev.filter((item) => item.productId !== productId));
    try {
      await removeFromWishlist(productId, accessToken);
    } catch {
      // Revert on failure
      loadWishlist();
    }
  };

  const handleAddToCartFromWishlist = async (item: WishlistItem) => {
    const success = await addToCart(item.productId, 1);
    if (success) {
      setSuccessMessage(`"${item.productTitle}" added to cart!`);
    }
  };

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'Contains uppercase', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'Contains lowercase', test: (p: string) => /[a-z]/.test(p) },
    { label: 'Contains number', test: (p: string) => /\d/.test(p) },
    { label: 'Contains special char', test: (p: string) => /[@$!%*?&]/.test(p) },
  ];

  const isPasswordValid = passwordRequirements.every((req) => req.test(newPassword));
  const doPasswordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
  };

  const shortId = (id: string) => {
    if (!id) return '';
    return id.length > 8 ? `#${id.slice(-8).toUpperCase()}` : `#${id.toUpperCase()}`;
  };

  // Initials for avatar
  const initials = user.name
    ? user.name
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email.charAt(0).toUpperCase();

  // ---- Render ----

  return (
    <div className="min-h-[70vh] py-8 lg:py-12">
      <Container>
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 sm:p-8 text-white mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold shrink-0 border-2 border-white/30">
              {initials}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold">{user.name || 'Welcome!'}</h1>
              <p className="text-white/80 mt-1">{user.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 flex-wrap">
                {user.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-500/20 rounded-full text-xs font-medium">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                )}
                {user.hasPassword && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-500/20 rounded-full text-xs font-medium">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Password Set
                  </span>
                )}
              </div>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 shrink-0"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Layout: sidebar (desktop) + content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar (desktop) / Horizontal tabs (mobile) */}
          <nav className="lg:w-56 shrink-0">
            {/* Mobile: horizontal scrollable tabs */}
            <div className="lg:hidden overflow-x-auto -mx-4 px-4 pb-2">
              <div className="flex gap-1 min-w-max">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    data-testid={`dash-tab-${tab.key}`}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.key
                        ? 'bg-amber-500 text-white'
                        : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Desktop: vertical sidebar */}
            <div className="hidden lg:flex flex-col gap-1 bg-white dark:bg-zinc-800 rounded-xl p-2 shadow-sm border border-zinc-200 dark:border-zinc-700">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  data-testid={`dash-tab-${tab.key}`}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left ${
                    activeTab === tab.key
                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
              {/* Status Messages */}
              {(successMessage || error) && (
                <div className="px-6 pt-6">
                  {successMessage && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-green-700 dark:text-green-400 text-sm">{successMessage}</p>
                    </div>
                  )}
                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ===== PROFILE TAB ===== */}
              {activeTab === 'profile' && (
                <div data-testid="profile-section" className="p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                      Profile Information
                    </h2>
                    {!editMode && (
                      <Button variant="outline" onClick={() => setEditMode(true)}>
                        Edit Profile
                      </Button>
                    )}
                  </div>

                  {editMode ? (
                    <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-lg">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your full name"
                          className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Enter your phone number"
                          className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex gap-4">
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditMode(false);
                            setName(user.name || '');
                            setPhone(user.phone || '');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6 max-w-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Email</label>
                          <p className="text-zinc-900 dark:text-white">{user.email}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Full Name</label>
                          <p className="text-zinc-900 dark:text-white">{user.name || 'Not set'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Phone Number</label>
                          <p className="text-zinc-900 dark:text-white">{user.phone || 'Not set'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Account Status</label>
                          <p className="text-zinc-900 dark:text-white">
                            {user.isVerified ? 'Verified' : 'Unverified'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ===== ORDERS TAB ===== */}
              {activeTab === 'orders' && (
                <div data-testid="orders-section" className="p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                      Order History
                    </h2>
                    <Button variant="outline" onClick={loadOrders} disabled={ordersLoading}>
                      {ordersLoading ? 'Refreshing...' : 'Refresh'}
                    </Button>
                  </div>

                  {ordersLoading && orders.length === 0 ? (
                    <div className="space-y-4">
                      <CardSkeleton />
                      <CardSkeleton />
                      <CardSkeleton />
                    </div>
                  ) : ordersError ? (
                    <div className="text-center py-12">
                      <p className="text-red-500 dark:text-red-400 mb-4">{ordersError}</p>
                      <Button variant="outline" onClick={loadOrders}>Try Again</Button>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-16">
                      <svg className="w-16 h-16 mx-auto text-zinc-300 dark:text-zinc-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">No orders yet</h3>
                      <p className="text-zinc-500 dark:text-zinc-400 mb-6">Start shopping to see your orders here.</p>
                      <Link href="/products">
                        <Button>Browse Products</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden transition-shadow hover:shadow-md"
                        >
                          {/* Order summary row */}
                          <button
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            className="w-full p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-white">
                                  {shortId(order.id)}
                                </span>
                                <StatusBadge status={order.status || order.paymentStatus} />
                              </div>
                              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                {formatDate(order.createdAt)} &middot; {order.totalItems} item{order.totalItems !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-lg font-semibold text-zinc-900 dark:text-white">
                                {formatCurrency(order.totalAmount, order.currency)}
                              </span>
                              <svg
                                className={`w-5 h-5 text-zinc-400 transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </button>

                          {/* Expanded details */}
                          {expandedOrder === order.id && (
                            <div className="border-t border-zinc-200 dark:border-zinc-700 p-4 sm:p-5 bg-zinc-50 dark:bg-zinc-800/50 space-y-4">
                              {/* Items */}
                              <div>
                                <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Items</h4>
                                <div className="space-y-2">
                                  {order.items?.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                      {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.title} className="w-10 h-10 rounded-lg object-cover" />
                                      ) : (
                                        <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                                          <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{item.title}</p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Qty: {item.quantity} x {formatCurrency(item.price)}</p>
                                      </div>
                                      <span className="text-sm font-medium text-zinc-900 dark:text-white">
                                        {formatCurrency(item.subtotal)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Shipping address */}
                              {order.shippingAddress && (
                                <div>
                                  <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Shipping Address</h4>
                                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                    {order.shippingAddress.fullName}, {order.shippingAddress.addressLine1}
                                    {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}
                                    , {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                                  </p>
                                </div>
                              )}

                              {/* Tracking number */}
                              {order.trackingNumber && (
                                <div>
                                  <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tracking Number</h4>
                                  <p className="text-sm font-mono text-amber-600 dark:text-amber-400">{order.trackingNumber}</p>
                                </div>
                              )}

                              {/* Download Invoice */}
                              {(order.paymentStatus === 'paid' || order.status === 'paid' || order.status === 'delivered' || order.status === 'shipped') && (
                                <a
                                  href={getInvoiceUrl(order.id)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Download Invoice
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ===== SUBSCRIPTIONS TAB ===== */}
              {activeTab === 'subscriptions' && (
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">
                    Subscription
                  </h2>

                  {subLoading ? (
                    <div className="space-y-4">
                      <CardSkeleton />
                      <CardSkeleton />
                    </div>
                  ) : subError ? (
                    <div className="text-center py-12">
                      <p className="text-red-500 dark:text-red-400 mb-4">{subError}</p>
                      <Button variant="outline" onClick={loadSubscription}>Try Again</Button>
                    </div>
                  ) : subscription ? (
                    <div className="space-y-6">
                      {/* Current plan card */}
                      <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                              {subscription.planName || subscription.plan?.name || 'Current Plan'}
                            </h3>
                            <div className="mt-2">
                              {subscription.status === 'active' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                  Active
                                </span>
                              ) : subscription.status === 'expired' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                  Expired
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                                  {subscription.status}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                              {formatCurrency(subscription.price || subscription.plan?.price || 0)}
                            </p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                              /{subscription.interval || subscription.plan?.interval || 'month'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
                          {subscription.startDate && (
                            <div>
                              <span className="text-zinc-500 dark:text-zinc-400">Start date: </span>
                              <span className="text-zinc-900 dark:text-white">{formatDate(subscription.startDate)}</span>
                            </div>
                          )}
                          {subscription.endDate && (
                            <div>
                              <span className="text-zinc-500 dark:text-zinc-400">End date: </span>
                              <span className="text-zinc-900 dark:text-white">{formatDate(subscription.endDate)}</span>
                            </div>
                          )}
                        </div>

                        {/* Features list */}
                        {(subscription.features || subscription.plan?.features) && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Features</h4>
                            <ul className="space-y-1.5">
                              {(subscription.features || subscription.plan?.features || []).map((f: string, i: number) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                  <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {subscription.status === 'active' ? (
                          <Link href="/subscribe">
                            <Button variant="outline">Manage Subscription</Button>
                          </Link>
                        ) : (
                          <Link href="/subscribe">
                            <Button>Renew Subscription</Button>
                          </Link>
                        )}
                      </div>

                      {/* Payment history */}
                      {payments.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Payment History</h3>
                          <div className="space-y-3">
                            {payments.slice(0, 10).map((payment: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                                <div>
                                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                                    {payment.description || payment.planName || 'Payment'}
                                  </p>
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {formatDate(payment.createdAt || payment.paidAt || '')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                    {formatCurrency(payment.amount || 0, payment.currency || 'INR')}
                                  </p>
                                  <span className={`text-xs ${payment.status === 'captured' || payment.status === 'paid' ? 'text-green-600 dark:text-green-400' : 'text-zinc-500'}`}>
                                    {payment.status || 'completed'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* No subscription */
                    <div className="text-center py-16">
                      <svg className="w-16 h-16 mx-auto text-zinc-300 dark:text-zinc-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                      <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">No active subscription</h3>
                      <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                        Subscribe to access exclusive spiritual content and teachings.
                      </p>
                      <Link href="/subscribe">
                        <Button>View Plans</Button>
                      </Link>

                      {/* Show payment history even without active subscription */}
                      {payments.length > 0 && (
                        <div className="mt-8 text-left">
                          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Past Payments</h3>
                          <div className="space-y-3">
                            {payments.slice(0, 10).map((payment: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                                <div>
                                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                                    {payment.description || payment.planName || 'Payment'}
                                  </p>
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {formatDate(payment.createdAt || payment.paidAt || '')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                    {formatCurrency(payment.amount || 0, payment.currency || 'INR')}
                                  </p>
                                  <span className={`text-xs ${payment.status === 'captured' || payment.status === 'paid' ? 'text-green-600 dark:text-green-400' : 'text-zinc-500'}`}>
                                    {payment.status || 'completed'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ===== WISHLIST TAB ===== */}
              {activeTab === 'wishlist' && (
                <div data-testid="wishlist-section" className="p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                      Wishlist
                    </h2>
                    {wishlistItems.length > 0 && (
                      <Button variant="outline" onClick={loadWishlist} disabled={wishlistLoading}>
                        {wishlistLoading ? 'Refreshing...' : 'Refresh'}
                      </Button>
                    )}
                  </div>

                  {wishlistLoading && wishlistItems.length === 0 ? (
                    <GridSkeleton />
                  ) : wishlistError ? (
                    <div className="text-center py-12">
                      <p className="text-red-500 dark:text-red-400 mb-4">{wishlistError}</p>
                      <Button variant="outline" onClick={loadWishlist}>Try Again</Button>
                    </div>
                  ) : wishlistItems.length === 0 ? (
                    <div className="text-center py-16">
                      <svg className="w-16 h-16 mx-auto text-zinc-300 dark:text-zinc-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">Your wishlist is empty</h3>
                      <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                        Save items you love for later.
                      </p>
                      <Link href="/products">
                        <Button>Browse Products</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {wishlistItems.map((item) => (
                        <div
                          key={item.productId}
                          className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden group hover:shadow-md transition-shadow"
                        >
                          {/* Image */}
                          <Link href={`/products/${item.productSlug}`}>
                            <div className="aspect-square bg-zinc-100 dark:bg-zinc-700 relative overflow-hidden">
                              {item.productImage ? (
                                <img
                                  src={item.productImage}
                                  alt={item.productTitle}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg className="w-12 h-12 text-zinc-300 dark:text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                              {/* Remove button */}
                              <button
                                data-testid="remove-wishlist-btn"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleRemoveFromWishlist(item.productId);
                                }}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 dark:bg-zinc-800/90 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors shadow-sm"
                                title="Remove from wishlist"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </Link>
                          {/* Info */}
                          <div className="p-3">
                            <Link href={`/products/${item.productSlug}`}>
                              <h3 className="text-sm font-medium text-zinc-900 dark:text-white line-clamp-2 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                                {item.productTitle}
                              </h3>
                            </Link>
                            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mt-1">
                              {formatCurrency(item.productPrice)}
                            </p>
                            <button
                              onClick={() => handleAddToCartFromWishlist(item)}
                              className="w-full mt-2 px-3 py-2 text-xs font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ===== SECURITY TAB ===== */}
              {activeTab === 'security' && (
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">
                    {user.hasPassword ? 'Change Password' : 'Set Password'}
                  </h2>

                  <form onSubmit={handleChangePassword} className="space-y-6 max-w-lg">
                    {user.hasPassword && (
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          Current Password
                        </label>
                        <input
                          type={showPasswords ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        New Password
                      </label>
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>

                    {/* Password Requirements */}
                    <div className="grid grid-cols-2 gap-2">
                      {passwordRequirements.map((req, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span className={req.test(newPassword) ? 'text-green-500' : 'text-zinc-400'}>
                            {req.test(newPassword) ? '\u2713' : '\u25CB'}
                          </span>
                          <span className={req.test(newPassword) ? 'text-green-600 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-400'}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                      {confirmPassword && !doPasswordsMatch && (
                        <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showPasswords"
                        checked={showPasswords}
                        onChange={(e) => setShowPasswords(e.target.checked)}
                        className="rounded border-zinc-300"
                      />
                      <label htmlFor="showPasswords" className="text-sm text-zinc-600 dark:text-zinc-400">
                        Show passwords
                      </label>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading || !isPasswordValid || !doPasswordsMatch || (user.hasPassword && !currentPassword)}
                    >
                      {isLoading ? 'Saving...' : user.hasPassword ? 'Change Password' : 'Set Password'}
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
