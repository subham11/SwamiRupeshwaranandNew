'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import {
  fetchNewsletterSubscribers,
  fetchNewsletterCampaigns,
  fetchNewsletterStats,
  createNewsletterCampaign,
  sendNewsletterCampaign,
  deleteNewsletterCampaign,
  deleteNewsletterSubscriber,
  NewsletterSubscriber,
  NewsletterCampaign,
  NewsletterStats,
  LocalizedString,
} from '@/lib/api';

type Tab = 'subscribers' | 'campaigns' | 'stats';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  unsubscribed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  bounced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  sending: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  sent: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function AdminNewsletterPage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('subscribers');
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create campaign modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    subjectEn: '',
    subjectHi: '',
    contentEn: '',
    contentHi: '',
  });
  const [creating, setCreating] = useState(false);

  // Send campaign modal
  const [sendingCampaignId, setSendingCampaignId] = useState<string | null>(null);
  const [sendLocale, setSendLocale] = useState<'en' | 'hi'>('en');

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'content_editor';

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const [subs, camps, st] = await Promise.all([
        fetchNewsletterSubscribers(accessToken).catch(() => []),
        fetchNewsletterCampaigns(accessToken).catch(() => []),
        fetchNewsletterStats(accessToken).catch(() => null),
      ]);
      setSubscribers(Array.isArray(subs) ? subs : []);
      setCampaigns(Array.isArray(camps) ? camps : []);
      setStats(st);
    } catch (err) {
      setError('Failed to load newsletter data');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/admin/newsletter');
    } else if (!isLoading && isAuthenticated && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, isAdmin, router]);

  useEffect(() => {
    if (isAuthenticated && isAdmin && accessToken) {
      loadData();
    }
  }, [isAuthenticated, isAdmin, accessToken, loadData]);

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(null), 5000); return () => clearTimeout(t); }
  }, [success]);

  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(null), 5000); return () => clearTimeout(t); }
  }, [error]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setCreating(true);
    try {
      await createNewsletterCampaign({
        subject: { en: campaignForm.subjectEn, hi: campaignForm.subjectHi } as LocalizedString,
        content: { en: campaignForm.contentEn, hi: campaignForm.contentHi } as LocalizedString,
      }, accessToken);
      setSuccess('Campaign created successfully!');
      setShowCreateModal(false);
      setCampaignForm({ subjectEn: '', subjectHi: '', contentEn: '', contentHi: '' });
      loadData();
    } catch {
      setError('Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const handleSendCampaign = async () => {
    if (!accessToken || !sendingCampaignId) return;
    try {
      await sendNewsletterCampaign(sendingCampaignId, sendLocale, accessToken);
      setSuccess('Campaign sent successfully!');
      setSendingCampaignId(null);
      loadData();
    } catch {
      setError('Failed to send campaign');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!accessToken || !confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await deleteNewsletterCampaign(id, accessToken);
      setSuccess('Campaign deleted');
      loadData();
    } catch {
      setError('Failed to delete campaign');
    }
  };

  const handleDeleteSubscriber = async (id: string) => {
    if (!accessToken || !confirm('Remove this subscriber?')) return;
    try {
      await deleteNewsletterSubscriber(id, accessToken);
      setSuccess('Subscriber removed');
      loadData();
    } catch {
      setError('Failed to remove subscriber');
    }
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
    <div className="min-h-[70vh] py-8 bg-gradient-to-b from-amber-50/30 to-white dark:from-gray-900 dark:to-gray-800">
      <Container>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/admin" className="text-sm text-orange-600 hover:text-orange-700">← Admin</Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Newsletter Management</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">Manage subscribers and email campaigns</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button onClick={() => setShowCreateModal(true)}>+ New Campaign</Button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">{error}</div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">{success}</div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Total Subscribers', value: stats.totalSubscribers },
              { label: 'Active', value: stats.activeSubscribers },
              { label: 'Unsubscribed', value: stats.unsubscribed },
              { label: '30-Day Growth', value: `+${stats.thirtyDayGrowth}` },
              { label: 'Campaigns Sent', value: stats.totalCampaignsSent },
            ].map((s) => (
              <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
          {(['subscribers', 'campaigns'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab === 'subscribers' ? `Subscribers (${subscribers.length})` : `Campaigns (${campaigns.length})`}
            </button>
          ))}
        </div>

        {/* Subscribers Tab */}
        {activeTab === 'subscribers' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {subscribers.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">No subscribers yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Subscribed</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {subscribers.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{sub.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{sub.name || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_COLORS[sub.status] || ''}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(sub.subscribedAt || sub.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {(user?.role === 'super_admin' || user?.role === 'admin') && (
                            <button
                              onClick={() => handleDeleteSubscriber(sub.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 text-sm font-medium"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="space-y-4">
            {campaigns.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-500 dark:text-gray-400 shadow-sm border border-gray-200 dark:border-gray-700">
                No campaigns yet. Create your first campaign!
              </div>
            ) : (
              campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {campaign.subject?.en || 'Untitled'}
                        </h3>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_COLORS[campaign.status] || ''}`}>
                          {campaign.status}
                        </span>
                      </div>
                      {campaign.subject?.hi && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{campaign.subject.hi}</p>
                      )}
                      <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>Created: {new Date(campaign.createdAt).toLocaleDateString()}</span>
                        {campaign.sentAt && <span>Sent: {new Date(campaign.sentAt).toLocaleDateString()}</span>}
                        {campaign.stats && (
                          <span>
                            Recipients: {campaign.stats.sent}/{campaign.stats.totalRecipients}
                            {campaign.stats.failed > 0 && ` (${campaign.stats.failed} failed)`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {campaign.status === 'draft' && (
                        <button
                          onClick={() => setSendingCampaignId(campaign.id)}
                          className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          Send
                        </button>
                      )}
                      {(user?.role === 'super_admin' || user?.role === 'admin') && (
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="px-3 py-1.5 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Container>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create Campaign</h2>
            <form onSubmit={handleCreateCampaign}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject (English)</label>
                    <input
                      type="text"
                      value={campaignForm.subjectEn}
                      onChange={(e) => setCampaignForm({ ...campaignForm, subjectEn: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      placeholder="Newsletter subject"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject (Hindi)</label>
                    <input
                      type="text"
                      value={campaignForm.subjectHi}
                      onChange={(e) => setCampaignForm({ ...campaignForm, subjectHi: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      placeholder="न्यूज़लेटर विषय"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content (English)</label>
                  <textarea
                    value={campaignForm.contentEn}
                    onChange={(e) => setCampaignForm({ ...campaignForm, contentEn: e.target.value })}
                    required
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    placeholder="Newsletter content in English..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content (Hindi)</label>
                  <textarea
                    value={campaignForm.contentHi}
                    onChange={(e) => setCampaignForm({ ...campaignForm, contentHi: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    placeholder="हिंदी में न्यूज़लेटर सामग्री..."
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={creating} className="flex-1">
                  {creating ? 'Creating...' : 'Create Campaign'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Campaign Modal */}
      {sendingCampaignId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Send Campaign</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Choose the language for sending this campaign to all active subscribers.
            </p>
            <div className="mb-6">
              <label htmlFor="send-locale" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label>
              <select
                id="send-locale"
                value={sendLocale}
                onChange={(e) => setSendLocale(e.target.value as 'en' | 'hi')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setSendingCampaignId(null)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSendCampaign} className="flex-1">
                Send Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
