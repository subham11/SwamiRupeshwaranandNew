'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import Container from '@/components/ui/Container';
import {
  fetchOrderStats,
  fetchProductStats,
  fetchUserStats,
  fetchNewsletterStats,
  fetchDonationStats,
  fetchSupportStats,
  OrderStats,
  ProductStats,
  UserStats,
  NewsletterStats,
  DonationStats,
  SupportStats,
} from '@/lib/api';

// Dynamic import for recharts (client-only)
import dynamic from 'next/dynamic';

const RechartsBarChart = dynamic(
  () => import('recharts').then((mod) => {
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } = mod;
    return function BarChartWrapper({ data, bars, xKey }: {
      data: Array<Record<string, unknown>>;
      bars: Array<{ key: string; color: string; name: string }>;
      xKey: string;
    }) {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey={xKey} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F9FAFB' }}
              labelStyle={{ color: '#F9FAFB' }}
            />
            <Legend />
            {bars.map((bar) => (
              <Bar key={bar.key} dataKey={bar.key} fill={bar.color} name={bar.name} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <div className="h-[300px] flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" /></div> }
);

const RechartsLineChart = dynamic(
  () => import('recharts').then((mod) => {
    const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } = mod;
    return function LineChartWrapper({ data, lines, xKey }: {
      data: Array<Record<string, unknown>>;
      lines: Array<{ key: string; color: string; name: string }>;
      xKey: string;
    }) {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey={xKey} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F9FAFB' }}
              labelStyle={{ color: '#F9FAFB' }}
            />
            <Legend />
            {lines.map((line) => (
              <Line key={line.key} type="monotone" dataKey={line.key} stroke={line.color} name={line.name} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <div className="h-[300px] flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" /></div> }
);

const RechartsPieChart = dynamic(
  () => import('recharts').then((mod) => {
    const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } = mod;
    const COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B', '#EC4899', '#06B6D4'];
    return function PieChartWrapper({ data }: { data: Array<{ name: string; value: number }> }) {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value"
              label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F9FAFB' }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <div className="h-[300px] flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" /></div> }
);

interface AllStats {
  orders: OrderStats | null;
  products: ProductStats | null;
  users: UserStats | null;
  newsletter: NewsletterStats | null;
  donations: DonationStats | null;
  support: SupportStats | null;
}

type TabKey = 'overview' | 'revenue' | 'users' | 'products';

export default function AnalyticsDashboardPage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading } = useAuth();
  const [stats, setStats] = useState<AllStats>({
    orders: null,
    products: null,
    users: null,
    newsletter: null,
    donations: null,
    support: null,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const loadStats = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const [orders, products, users, newsletter, donations, support] = await Promise.all([
        fetchOrderStats(accessToken).catch(() => null),
        fetchProductStats(accessToken).catch(() => null),
        fetchUserStats(accessToken).catch(() => null),
        fetchNewsletterStats(accessToken).catch(() => null),
        fetchDonationStats(accessToken).catch(() => null),
        fetchSupportStats(accessToken).catch(() => null),
      ]);
      setStats({ orders, products, users, newsletter, donations, support });
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/admin/analytics');
    } else if (!isLoading && isAuthenticated && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, isAdmin, router]);

  useEffect(() => {
    if (isAuthenticated && isAdmin && accessToken) {
      loadStats();
    }
  }, [isAuthenticated, isAdmin, accessToken, loadStats]);

  if (isLoading || loading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </Container>
    );
  }

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: '\uD83D\uDCCA' },
    { key: 'revenue', label: 'Revenue & Orders', icon: '\uD83D\uDCB0' },
    { key: 'users', label: 'Users & Growth', icon: '\uD83D\uDC65' },
    { key: 'products', label: 'Products & Inventory', icon: '\uD83D\uDED2' },
  ];

  // Helpers
  const formatCurrency = (n: number) => '\u20B9' + n.toLocaleString('en-IN');
  const pctChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const pct = ((current - previous) / previous * 100).toFixed(1);
    return Number(pct) >= 0 ? `+${pct}%` : `${pct}%`;
  };

  const revenueChange = stats.orders
    ? pctChange(stats.orders.thisMonthRevenue, stats.orders.lastMonthRevenue)
    : '0%';
  const userGrowthChange = stats.users
    ? pctChange(stats.users.newUsersThisMonth, stats.users.newUsersLastMonth)
    : '0%';

  // Prepare chart data
  const monthlyRevenueData = stats.orders?.monthlyRevenue || [];
  const userGrowthData = stats.users?.monthlyGrowth || [];

  const categoryData = stats.products?.productsByCategory
    ? Object.entries(stats.products.productsByCategory).map(([name, value]) => ({ name, value }))
    : [];

  const orderStatusData = stats.orders?.ordersByStatus
    ? Object.entries(stats.orders.ordersByStatus).map(([name, value]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        value,
      }))
    : [];

  const topProductsData = stats.orders?.topProducts?.map((p) => ({
    name: p.title.length > 20 ? p.title.substring(0, 20) + '...' : p.title,
    revenue: p.revenue,
    quantity: p.quantity,
  })) || [];

  const roleData = stats.users?.usersByRole
    ? Object.entries(stats.users.usersByRole).map(([name, value]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        value,
      }))
    : [];

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive overview of your site&apos;s performance
          </p>
        </div>
        <button
          onClick={loadStats}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
        >
          {'\u21BB'} Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards Row 1 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={'\uD83D\uDCB0'}
              label="Total Revenue"
              value={stats.orders ? formatCurrency(stats.orders.totalRevenue) : '--'}
              change={revenueChange}
              changeLabel="vs last month"
              positive={revenueChange.startsWith('+')}
            />
            <StatCard
              icon={'\uD83D\uDCE6'}
              label="Total Orders"
              value={stats.orders?.totalOrders?.toLocaleString() || '0'}
              sublabel={`Avg ${stats.orders ? formatCurrency(stats.orders.averageOrderValue) : '--'}`}
            />
            <StatCard
              icon={'\uD83D\uDC65'}
              label="Total Users"
              value={stats.users?.totalUsers?.toLocaleString() || '0'}
              change={userGrowthChange}
              changeLabel="new this month"
              positive={userGrowthChange.startsWith('+')}
            />
            <StatCard
              icon={'\uD83D\uDED2'}
              label="Total Products"
              value={stats.products?.totalProducts?.toLocaleString() || '0'}
              sublabel={`${stats.products?.activeProducts || 0} active`}
            />
          </div>

          {/* KPI Cards Row 2 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={'\uD83D\uDCE7'}
              label="Newsletter Subscribers"
              value={stats.newsletter?.activeSubscribers?.toLocaleString() || '0'}
              sublabel={`+${stats.newsletter?.thirtyDayGrowth || 0} this month`}
            />
            <StatCard
              icon={'\uD83D\uDE4F'}
              label="Donations"
              value={stats.donations ? formatCurrency(stats.donations.thisMonthAmount) : '--'}
              sublabel={`${stats.donations?.totalDonations || 0} total`}
            />
            <StatCard
              icon={'\uD83C\uDFAB'}
              label="Support Tickets"
              value={stats.support?.openTickets?.toString() || '0'}
              sublabel={`${stats.support?.inProgressTickets || 0} in progress`}
              accent="yellow"
            />
            <StatCard
              icon={'\u2B50'}
              label="Featured Products"
              value={stats.products?.featuredCount?.toLocaleString() || '0'}
              sublabel={`${stats.products?.outOfStockProducts || 0} out of stock`}
              accent={stats.products?.outOfStockProducts ? 'red' : undefined}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Monthly Revenue" icon={'\uD83D\uDCCA'}>
              {monthlyRevenueData.length > 0 ? (
                <RechartsBarChart
                  data={monthlyRevenueData}
                  bars={[
                    { key: 'revenue', color: '#F97316', name: 'Revenue (\u20B9)' },
                    { key: 'orders', color: '#3B82F6', name: 'Orders' },
                  ]}
                  xKey="month"
                />
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            <ChartCard title="Order Status Distribution" icon={'\uD83D\uDCCB'}>
              {orderStatusData.length > 0 ? (
                <RechartsPieChart data={orderStatusData} />
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Revenue KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={'\uD83D\uDCB0'}
              label="This Month"
              value={stats.orders ? formatCurrency(stats.orders.thisMonthRevenue) : '--'}
              change={revenueChange}
              positive={revenueChange.startsWith('+')}
            />
            <StatCard
              icon={'\uD83D\uDCC5'}
              label="Last Month"
              value={stats.orders ? formatCurrency(stats.orders.lastMonthRevenue) : '--'}
            />
            <StatCard
              icon={'\uD83C\uDFC6'}
              label="All Time Revenue"
              value={stats.orders ? formatCurrency(stats.orders.totalRevenue) : '--'}
            />
            <StatCard
              icon={'\uD83D\uDED2'}
              label="Avg Order Value"
              value={stats.orders ? formatCurrency(stats.orders.averageOrderValue) : '--'}
            />
          </div>

          {/* Revenue Chart */}
          <ChartCard title="Revenue Trend (Last 6 Months)" icon={'\uD83D\uDCC8'}>
            {monthlyRevenueData.length > 0 ? (
              <RechartsLineChart
                data={monthlyRevenueData}
                lines={[{ key: 'revenue', color: '#F97316', name: 'Revenue (\u20B9)' }]}
                xKey="month"
              />
            ) : (
              <EmptyChart />
            )}
          </ChartCard>

          {/* Top Products & Order Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Top Products by Revenue" icon={'\uD83C\uDFC6'}>
              {topProductsData.length > 0 ? (
                <RechartsBarChart
                  data={topProductsData}
                  bars={[
                    { key: 'revenue', color: '#F97316', name: 'Revenue (\u20B9)' },
                    { key: 'quantity', color: '#10B981', name: 'Units Sold' },
                  ]}
                  xKey="name"
                />
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            <ChartCard title="Orders by Status" icon={'\uD83D\uDCCB'}>
              {orderStatusData.length > 0 ? (
                <RechartsPieChart data={orderStatusData} />
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
          </div>

          {/* Recent Orders Table */}
          {stats.orders?.recentOrders && stats.orders.recentOrders.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">{'\uD83D\uDCE6'} Recent Orders</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Order ID</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Customer</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Amount</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {stats.orders.recentOrders.map((order: Record<string, unknown>, i: number) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">
                          {(order.id as string)?.substring(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{order.userEmail as string}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {formatCurrency(order.totalAmount as number)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={order.status as string} />
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                          {order.createdAt ? new Date(order.createdAt as string).toLocaleDateString() : '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* User KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={'\uD83D\uDC65'}
              label="Total Users"
              value={stats.users?.totalUsers?.toLocaleString() || '0'}
            />
            <StatCard
              icon={'\u2705'}
              label="Active Users"
              value={stats.users?.activeUsers?.toLocaleString() || '0'}
            />
            <StatCard
              icon={'\uD83C\uDD95'}
              label="New This Month"
              value={stats.users?.newUsersThisMonth?.toLocaleString() || '0'}
              change={userGrowthChange}
              positive={userGrowthChange.startsWith('+')}
            />
            <StatCard
              icon={'\uD83D\uDCE7'}
              label="Subscribers"
              value={stats.newsletter?.activeSubscribers?.toLocaleString() || '0'}
              sublabel={`+${stats.newsletter?.thirtyDayGrowth || 0} this month`}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="User Growth (Last 6 Months)" icon={'\uD83D\uDCC8'}>
              {userGrowthData.length > 0 ? (
                <RechartsLineChart
                  data={userGrowthData}
                  lines={[{ key: 'count', color: '#3B82F6', name: 'New Users' }]}
                  xKey="month"
                />
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            <ChartCard title="Users by Role" icon={'\uD83D\uDC64'}>
              {roleData.length > 0 ? (
                <RechartsPieChart data={roleData} />
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
          </div>

          {/* Engagement Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">{'\uD83C\uDFAB'} Support Activity</h4>
              <div className="space-y-3">
                <MetricRow label="Total Tickets" value={stats.support?.totalTickets || 0} />
                <MetricRow label="Open" value={stats.support?.openTickets || 0} color="text-yellow-600" />
                <MetricRow label="In Progress" value={stats.support?.inProgressTickets || 0} color="text-blue-600" />
                <MetricRow label="Resolved" value={stats.support?.resolvedTickets || 0} color="text-green-600" />
                <MetricRow label="Avg Resolution" value={`${stats.support?.averageResolutionTime || 0}h`} />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">{'\uD83D\uDE4F'} Donation Activity</h4>
              <div className="space-y-3">
                <MetricRow label="Total Donations" value={stats.donations?.totalDonations || 0} />
                <MetricRow label="Total Amount" value={stats.donations ? formatCurrency(stats.donations.totalAmount || 0) : '--'} />
                <MetricRow label="This Month" value={stats.donations ? formatCurrency(stats.donations.thisMonthAmount) : '--'} />
                <MetricRow label="Unique Donors" value={stats.donations?.donorCount || 0} />
                <MetricRow label="Recurring" value={stats.donations?.recurringDonors || 0} />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">{'\uD83D\uDCE7'} Newsletter</h4>
              <div className="space-y-3">
                <MetricRow label="Total Subscribers" value={stats.newsletter?.totalSubscribers || 0} />
                <MetricRow label="Active" value={stats.newsletter?.activeSubscribers || 0} color="text-green-600" />
                <MetricRow label="Unsubscribed" value={stats.newsletter?.unsubscribed || 0} color="text-red-600" />
                <MetricRow label="30-Day Growth" value={`+${stats.newsletter?.thirtyDayGrowth || 0}`} color="text-green-600" />
                <MetricRow label="Campaigns Sent" value={stats.newsletter?.totalCampaignsSent || 0} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Product KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={'\uD83D\uDED2'}
              label="Total Products"
              value={stats.products?.totalProducts?.toLocaleString() || '0'}
            />
            <StatCard
              icon={'\u2705'}
              label="Active"
              value={stats.products?.activeProducts?.toLocaleString() || '0'}
            />
            <StatCard
              icon={'\u26A0\uFE0F'}
              label="Out of Stock"
              value={stats.products?.outOfStockProducts?.toLocaleString() || '0'}
              accent={stats.products?.outOfStockProducts ? 'red' : undefined}
            />
            <StatCard
              icon={'\uD83D\uDCB0'}
              label="Avg Price"
              value={stats.products ? formatCurrency(stats.products.averagePrice) : '--'}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Products by Category" icon={'\uD83D\uDCCA'}>
              {categoryData.length > 0 ? (
                <RechartsPieChart data={categoryData} />
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            <ChartCard title="Top Selling Products" icon={'\uD83C\uDFC6'}>
              {topProductsData.length > 0 ? (
                <RechartsBarChart
                  data={topProductsData}
                  bars={[
                    { key: 'quantity', color: '#10B981', name: 'Units Sold' },
                    { key: 'revenue', color: '#F97316', name: 'Revenue (\u20B9)' },
                  ]}
                  xKey="name"
                />
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
          </div>

          {/* Category Breakdown Table */}
          {categoryData.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">{'\uD83D\uDCCB'} Category Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Category</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Products</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">% of Total</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Bar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {categoryData.sort((a, b) => b.value - a.value).map((cat, i) => {
                      const total = categoryData.reduce((s, c) => s + c.value, 0);
                      const pct = total > 0 ? (cat.value / total * 100).toFixed(1) : '0';
                      return (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{cat.name}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{cat.value}</td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{pct}%</td>
                          <td className="px-4 py-3">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                              <div
                                className="bg-orange-500 h-2.5 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Products */}
          {stats.products?.recentProducts && stats.products.recentProducts.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">{'\uD83C\uDD95'} Recently Added Products</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Product</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Category</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Price</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Stock</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Added</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {stats.products.recentProducts.map((p: Record<string, unknown>, i: number) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.title as string}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.categoryName as string}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">{formatCurrency(p.price as number)}</td>
                        <td className="px-4 py-3">
                          <StockBadge status={p.stockStatus as string} />
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                          {p.createdAt ? new Date(p.createdAt as string).toLocaleDateString() : '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </Container>
  );
}

// ============================================
// Sub-components
// ============================================

function StatCard({
  icon,
  label,
  value,
  sublabel,
  change,
  changeLabel,
  positive,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  sublabel?: string;
  change?: string;
  changeLabel?: string;
  positive?: boolean;
  accent?: 'red' | 'yellow';
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${
        accent === 'red' ? 'text-red-600 dark:text-red-400' :
        accent === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
        'text-gray-900 dark:text-white'
      }`}>
        {value}
      </p>
      {change && (
        <p className={`text-xs mt-1 ${positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {change} {changeLabel}
        </p>
      )}
      {sublabel && !change && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sublabel}</p>
      )}
    </div>
  );
}

function ChartCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span>{icon}</span> {title}
        </h3>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[300px] flex flex-col items-center justify-center text-gray-400">
      <span className="text-4xl mb-2">{'\uD83D\uDCCA'}</span>
      <p className="text-sm">No data available yet</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    payment_pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
      {label}
    </span>
  );
}

function StockBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    in_stock: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    low_stock: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    out_of_stock: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    limited: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  };
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {label}
    </span>
  );
}

function MetricRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className={`text-sm font-medium ${color || 'text-gray-900 dark:text-white'}`}>{value}</span>
    </div>
  );
}
