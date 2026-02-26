'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import Container from '@/components/ui/Container';
import {
  fetchNewsletterStats,
  fetchDonationStats,
  fetchSupportStats,
  NewsletterStats,
  DonationStats,
  SupportStats,
} from '@/lib/api';

interface DashboardStats {
  newsletter: NewsletterStats | null;
  donations: DonationStats | null;
  support: SupportStats | null;
}

const ADMIN_LINKS = [
  { href: '/admin/users', label: 'User Management', icon: '👥', description: 'Manage users and roles' },
  { href: '/admin/cms', label: 'Content Editor', icon: '📝', description: 'Edit page content' },
  { href: '/admin/events', label: 'Events', icon: '📅', description: 'Manage events & schedules' },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: '💳', description: 'Plans & user subscriptions' },
  { href: '/admin/content-library', label: 'Content Library', icon: '📿', description: 'Upload stotras, kavach & PDFs' },
  { href: '/admin/monthly-schedule', label: 'Monthly Schedule', icon: '🗓️', description: 'Assign content to months per plan' },
  { href: '/admin/newsletter', label: 'Newsletter', icon: '📧', description: 'Manage subscribers & campaigns' },
  { href: '/admin/donations', label: 'Donations', icon: '🙏', description: 'View donations & configure' },
  { href: '/admin/support', label: 'Support Tickets', icon: '🎫', description: 'Handle user queries' },
  { href: '/admin/media', label: 'Media Library', icon: '🖼️', description: 'Manage uploaded files' },
  { href: '/admin/products', label: 'Products', icon: '🛒', description: 'Manage products & categories' },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading } = useAuth();

  const [stats, setStats] = useState<DashboardStats>({
    newsletter: null,
    donations: null,
    support: null,
  });
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'content_editor';

  const loadStats = useCallback(async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const [newsletter, donations, support] = await Promise.all([
        fetchNewsletterStats(accessToken).catch(() => null),
        fetchDonationStats(accessToken).catch(() => null),
        fetchSupportStats(accessToken).catch(() => null),
      ]);

      setStats({ newsletter, donations, support });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/admin');
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

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back, {user?.name || user?.email}! Here's an overview of your site.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Newsletter Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📧</span>
            <h3 className="font-semibold text-gray-900 dark:text-white">Newsletter</h3>
          </div>
          {stats.newsletter ? (
            <div className="space-y-2">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.newsletter.activeSubscribers.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Subscribers</p>
              <p className="text-sm text-green-600 dark:text-green-400">
                +{stats.newsletter.thirtyDayGrowth} this month
              </p>
            </div>
          ) : (
            <p className="text-gray-400">No data available</p>
          )}
        </div>

        {/* Donations Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🙏</span>
            <h3 className="font-semibold text-gray-900 dark:text-white">Donations</h3>
          </div>
          {stats.donations ? (
            <div className="space-y-2">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ₹{stats.donations.thisMonthAmount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">This Month</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {stats.donations.totalDonations} total donations
              </p>
            </div>
          ) : (
            <p className="text-gray-400">No data available</p>
          )}
        </div>

        {/* Support Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🎫</span>
            <h3 className="font-semibold text-gray-900 dark:text-white">Support</h3>
          </div>
          {stats.support ? (
            <div className="space-y-2">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.support.openTickets}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Open Tickets</p>
              <p className="text-sm text-orange-600 dark:text-orange-400">
                {stats.support.inProgressTickets} in progress
              </p>
            </div>
          ) : (
            <p className="text-gray-400">No data available</p>
          )}
        </div>

        {/* Quick Summary */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 shadow-sm text-white">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📊</span>
            <h3 className="font-semibold">Total Activity</h3>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold">
              {((stats.newsletter?.totalCampaignsSent || 0) + (stats.donations?.totalDonations || 0) + (stats.support?.totalTickets || 0)).toLocaleString()}
            </p>
            <p className="text-sm opacity-90">Total interactions</p>
            <p className="text-sm opacity-75">Across all modules</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ADMIN_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{link.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {link.label}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{link.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Donations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            <Link href="/admin/donations" className="text-sm text-orange-600 hover:text-orange-700">
              View all →
            </Link>
          </div>
          <div className="p-4">
            {stats.donations ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Donors</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.donations.donorCount}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Recurring Donors</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.donations.recurringDonors}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Avg Donation</span>
                  <span className="font-medium text-gray-900 dark:text-white">₹{Math.round(stats.donations.averageDonation).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Last Month</span>
                  <span className="font-medium text-gray-900 dark:text-white">₹{stats.donations.lastMonthAmount.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No donation data</p>
            )}
          </div>
        </div>

        {/* Support Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">Support Overview</h3>
            <Link href="/admin/support" className="text-sm text-orange-600 hover:text-orange-700">
              View all →
            </Link>
          </div>
          <div className="p-4">
            {stats.support ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Tickets</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.support.totalTickets}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Resolved</span>
                  <span className="font-medium text-green-600">{stats.support.resolvedTickets}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">This Week</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.support.ticketsThisWeek}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Avg Resolution</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.support.averageResolutionTime}h</span>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No support data</p>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}
