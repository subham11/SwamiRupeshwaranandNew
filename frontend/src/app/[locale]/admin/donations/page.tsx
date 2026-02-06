'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import {
  fetchAllDonations,
  fetchDonationStats,
  fetchAllDonationConfigs,
  createDonationConfig,
  updateDonationConfig,
  deleteDonationConfig,
  updateDonation,
  Donation,
  DonationStats,
  DonationConfig,
} from '@/lib/api';

type Tab = 'donations' | 'config';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  refunded: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

const PURPOSE_LABELS: Record<string, string> = {
  general: 'General',
  temple: 'Temple',
  annadaan: 'Annadaan',
  goshala: 'Goshala',
  education: 'Education',
  medical: 'Medical',
  festival: 'Festival',
  other: 'Other',
};

export default function AdminDonationsPage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('donations');
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [configs, setConfigs] = useState<DonationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Config modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<DonationConfig | null>(null);
  const [configForm, setConfigForm] = useState({
    purpose: 'general',
    titleEn: '',
    titleHi: '',
    descEn: '',
    descHi: '',
    minimumAmount: 100,
    maximumAmount: 100000,
    allowCustomAmount: true,
    isActive: true,
    suggestedAmounts: '500,1000,2100,5100' as string,
  });
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const [donList, donStats, donConfigs] = await Promise.all([
        fetchAllDonations(accessToken).catch(() => []),
        fetchDonationStats(accessToken).catch(() => null),
        fetchAllDonationConfigs(accessToken).catch(() => []),
      ]);
      setDonations(Array.isArray(donList) ? donList : []);
      setStats(donStats);
      setConfigs(Array.isArray(donConfigs) ? donConfigs : []);
    } catch {
      setError('Failed to load donation data');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/admin/donations');
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

  const openCreateConfig = () => {
    setEditingConfig(null);
    setConfigForm({
      purpose: 'general', titleEn: '', titleHi: '', descEn: '', descHi: '',
      minimumAmount: 100, maximumAmount: 100000, allowCustomAmount: true, isActive: true,
      suggestedAmounts: '500,1000,2100,5100',
    });
    setShowConfigModal(true);
  };

  const openEditConfig = (config: DonationConfig) => {
    setEditingConfig(config);
    setConfigForm({
      purpose: config.purpose,
      titleEn: config.title?.en || '',
      titleHi: config.title?.hi || '',
      descEn: config.description?.en || '',
      descHi: config.description?.hi || '',
      minimumAmount: config.minimumAmount,
      maximumAmount: config.maximumAmount || 100000,
      allowCustomAmount: config.allowCustomAmount,
      isActive: config.isActive,
      suggestedAmounts: config.suggestedAmounts?.map(a => a.amount).join(',') || '',
    });
    setShowConfigModal(true);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    try {
      const data = {
        purpose: configForm.purpose,
        title: { en: configForm.titleEn, hi: configForm.titleHi },
        description: { en: configForm.descEn, hi: configForm.descHi },
        minimumAmount: configForm.minimumAmount,
        maximumAmount: configForm.maximumAmount,
        allowCustomAmount: configForm.allowCustomAmount,
        isActive: configForm.isActive,
        suggestedAmounts: configForm.suggestedAmounts.split(',').filter(Boolean).map((a, i) => ({
          amount: parseInt(a.trim()),
          isPopular: i === 1,
        })),
      };
      if (editingConfig) {
        await updateDonationConfig(editingConfig.id, data, accessToken);
        setSuccess('Configuration updated');
      } else {
        await createDonationConfig(data, accessToken);
        setSuccess('Configuration created');
      }
      setShowConfigModal(false);
      loadData();
    } catch {
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfig = async (id: string) => {
    if (!accessToken || !confirm('Delete this donation configuration?')) return;
    try {
      await deleteDonationConfig(id, accessToken);
      setSuccess('Configuration deleted');
      loadData();
    } catch {
      setError('Failed to delete configuration');
    }
  };

  const handleUpdateDonationStatus = async (donationId: string, status: string) => {
    if (!accessToken) return;
    try {
      await updateDonation(donationId, { status } as Partial<Donation>, accessToken);
      setSuccess('Donation status updated');
      loadData();
    } catch {
      setError('Failed to update donation');
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Donation Management</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">View donations and configure donation settings</p>
          </div>
        </div>

        {/* Messages */}
        {error && <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">{error}</div>}
        {success && <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">{success}</div>}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Donations', value: stats.totalDonations },
              { label: 'Total Amount', value: `₹${stats.totalAmount.toLocaleString()}` },
              { label: 'This Month', value: `₹${stats.thisMonthAmount.toLocaleString()}` },
              { label: 'Avg Donation', value: `₹${Math.round(stats.averageDonation).toLocaleString()}` },
              { label: 'Total Donors', value: stats.donorCount },
              { label: 'Recurring Donors', value: stats.recurringDonors },
              { label: 'Last Month', value: `₹${stats.lastMonthAmount.toLocaleString()}` },
              { label: 'Top Purpose', value: PURPOSE_LABELS[stats.topPurpose] || stats.topPurpose },
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
          {([
            { key: 'donations' as Tab, label: `Donations (${donations.length})` },
            { key: 'config' as Tab, label: `Configuration (${configs.length})` },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Donations Tab */}
        {activeTab === 'donations' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {donations.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">No donations yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">#</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Donor</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Purpose</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {donations.map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-400">{d.donationNumber}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">{d.isAnonymous ? 'Anonymous' : d.donorName || '—'}</div>
                          {!d.isAnonymous && d.donorEmail && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">{d.donorEmail}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">₹{d.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{PURPOSE_LABELS[d.purpose] || d.purpose}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 capitalize">{d.donationType?.replace('_', ' ')}</td>
                        <td className="px-6 py-4">
                          <select
                            value={d.status}
                            onChange={(e) => handleUpdateDonationStatus(d.id, e.target.value)}
                            className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[d.status] || ''}`}
                            title={`Update status of donation ${d.donationNumber}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(d.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {d.wants80GCertificate && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                              80G
                            </span>
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

        {/* Config Tab */}
        {activeTab === 'config' && (
          <div>
            <div className="mb-4 flex justify-end">
              <Button onClick={openCreateConfig}>+ New Configuration</Button>
            </div>
            <div className="space-y-4">
              {configs.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-500 dark:text-gray-400 shadow-sm border border-gray-200 dark:border-gray-700">
                  No donation configurations. Create one to set up donation purposes.
                </div>
              ) : (
                configs.map((config) => (
                  <div
                    key={config.id}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {config.title?.en || PURPOSE_LABELS[config.purpose] || config.purpose}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${config.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {config.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {config.description?.en && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{config.description.en}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span>Purpose: {PURPOSE_LABELS[config.purpose] || config.purpose}</span>
                          <span>Min: ₹{config.minimumAmount}</span>
                          {config.maximumAmount && <span>Max: ₹{config.maximumAmount.toLocaleString()}</span>}
                          <span>Custom: {config.allowCustomAmount ? 'Yes' : 'No'}</span>
                        </div>
                        {config.suggestedAmounts?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {config.suggestedAmounts.map((a, i) => (
                              <span key={i} className={`text-xs px-2 py-1 rounded ${a.isPopular
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 font-semibold'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                ₹{a.amount.toLocaleString()} {a.isPopular ? '★' : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditConfig(config)}
                          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteConfig(config.id)}
                          className="px-3 py-1.5 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Container>

      {/* Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingConfig ? 'Edit Configuration' : 'New Configuration'}
            </h2>
            <form onSubmit={handleSaveConfig}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="config-purpose" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
                  <select
                    id="config-purpose"
                    value={configForm.purpose}
                    onChange={(e) => setConfigForm({ ...configForm, purpose: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {Object.entries(PURPOSE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title (English)</label>
                    <input type="text" value={configForm.titleEn} onChange={(e) => setConfigForm({ ...configForm, titleEn: e.target.value })} required
                      placeholder="Title in English"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title (Hindi)</label>
                    <input type="text" value={configForm.titleHi} onChange={(e) => setConfigForm({ ...configForm, titleHi: e.target.value })}
                      placeholder="हिंदी में शीर्षक"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (English)</label>
                    <textarea value={configForm.descEn} onChange={(e) => setConfigForm({ ...configForm, descEn: e.target.value })} rows={3}
                      placeholder="Description in English"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Hindi)</label>
                    <textarea value={configForm.descHi} onChange={(e) => setConfigForm({ ...configForm, descHi: e.target.value })} rows={3}
                      placeholder="हिंदी में विवरण"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Amount (₹)</label>
                    <input type="number" value={configForm.minimumAmount} onChange={(e) => setConfigForm({ ...configForm, minimumAmount: parseInt(e.target.value) })}
                      placeholder="100"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Amount (₹)</label>
                    <input type="number" value={configForm.maximumAmount} onChange={(e) => setConfigForm({ ...configForm, maximumAmount: parseInt(e.target.value) })}
                      placeholder="100000"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  </div>
                  <div className="flex items-end gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={configForm.allowCustomAmount} onChange={(e) => setConfigForm({ ...configForm, allowCustomAmount: e.target.checked })}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Custom Amount</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={configForm.isActive} onChange={(e) => setConfigForm({ ...configForm, isActive: e.target.checked })}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Suggested Amounts (comma-separated)
                  </label>
                  <input type="text" value={configForm.suggestedAmounts}
                    onChange={(e) => setConfigForm({ ...configForm, suggestedAmounts: e.target.value })}
                    placeholder="500,1000,2100,5100"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowConfigModal(false)} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? 'Saving...' : editingConfig ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
