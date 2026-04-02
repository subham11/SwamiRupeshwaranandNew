'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import {
  fetchSettingsByCategory,
  bulkUpdateSettings,
  testRazorpayConnection,
  invalidateSettingsCache,
  SettingItem,
} from '@/lib/api';

type Tab = 'razorpay' | 'general';

// Razorpay setting keys
const RAZORPAY_SETTINGS = [
  {
    key: 'RAZORPAY_KEY_ID',
    label: 'Razorpay Key ID',
    description: 'Your Razorpay API Key ID (starts with rzp_live_ or rzp_test_)',
    placeholder: 'rzp_live_xxxxxxxxxxxxxxxx',
    isSecret: false,
  },
  {
    key: 'RAZORPAY_KEY_SECRET',
    label: 'Razorpay Key Secret',
    description: 'Your Razorpay API Key Secret',
    placeholder: 'Enter key secret',
    isSecret: true,
  },
  {
    key: 'RAZORPAY_WEBHOOK_SECRET',
    label: 'Webhook Secret',
    description: 'Secret used to verify Razorpay webhook signatures',
    placeholder: 'Enter webhook secret',
    isSecret: true,
  },
];

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('razorpay');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Razorpay form state
  const [razorpayForm, setRazorpayForm] = useState<Record<string, string>>({
    RAZORPAY_KEY_ID: '',
    RAZORPAY_KEY_SECRET: '',
    RAZORPAY_WEBHOOK_SECRET: '',
  });
  const [existingSettings, setExistingSettings] = useState<SettingItem[]>([]);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const isSuperAdmin = user?.role === 'super_admin';

  // Load settings
  const loadSettings = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const settings = await fetchSettingsByCategory('razorpay', accessToken);
      setExistingSettings(settings);

      // Pre-fill form with existing values
      const formValues: Record<string, string> = { ...razorpayForm };
      for (const setting of settings) {
        formValues[setting.key] = setting.value;
      }
      setRazorpayForm(formValues);
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/en/login?redirect=/en/admin/settings');
      return;
    }
    if (!isLoading && user && !isSuperAdmin) {
      router.push('/en/admin');
      return;
    }
    if (accessToken) {
      loadSettings();
    }
  }, [isLoading, isAuthenticated, user, accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-clear messages
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(t);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(t);
    }
  }, [error]);

  // Save Razorpay settings
  const handleSaveRazorpay = async () => {
    if (!accessToken) return;

    // Validate
    if (!razorpayForm.RAZORPAY_KEY_ID?.trim()) {
      setError('Razorpay Key ID is required');
      return;
    }
    if (!razorpayForm.RAZORPAY_KEY_SECRET?.trim() && !isSecretMasked(razorpayForm.RAZORPAY_KEY_SECRET)) {
      setError('Razorpay Key Secret is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Only send settings that have actually changed (skip masked secrets)
      const settingsToUpdate = RAZORPAY_SETTINGS
        .filter(s => {
          const val = razorpayForm[s.key]?.trim();
          if (!val) return false;
          // Don't send masked values back to the server
          if (isSecretMasked(val)) return false;
          return true;
        })
        .map(s => ({
          key: s.key,
          value: razorpayForm[s.key].trim(),
          description: s.description,
          isSecret: s.isSecret,
        }));

      if (settingsToUpdate.length === 0) {
        setError('No changes to save');
        setSaving(false);
        return;
      }

      await bulkUpdateSettings(
        { category: 'razorpay', settings: settingsToUpdate },
        accessToken
      );

      // Invalidate cache so services pick up new values
      await invalidateSettingsCache(accessToken);

      setSuccess('Razorpay settings saved successfully! Changes will take effect within 5 minutes.');
      await loadSettings();
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Test Razorpay connection
  const handleTestConnection = async () => {
    if (!accessToken) return;

    const keyId = razorpayForm.RAZORPAY_KEY_ID?.trim();
    const keySecret = razorpayForm.RAZORPAY_KEY_SECRET?.trim();

    if (!keyId) {
      setError('Enter Razorpay Key ID first');
      return;
    }
    if (!keySecret || isSecretMasked(keySecret)) {
      setError('Enter the full Key Secret (not masked) to test connection');
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);
      setError(null);

      const result = await testRazorpayConnection(keyId, keySecret, accessToken);
      setTestResult(result);

      if (result.success) {
        setSuccess('Razorpay connection test passed!');
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Test failed' });
    } finally {
      setTesting(false);
    }
  };

  // Check if a value is a masked secret (e.g., "rzp_****5Uio")
  const isSecretMasked = (value: string): boolean => {
    return value?.includes('****') ?? false;
  };

  // Get display info for a setting
  const getSettingInfo = (key: string): SettingItem | undefined => {
    return existingSettings.find(s => s.key === key);
  };

  if (isLoading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
        </div>
      </Container>
    );
  }

  if (!isSuperAdmin) {
    return (
      <Container className="py-8">
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Only Super Admins can access settings.
          </p>
          <Link href="/en/admin" className="mt-4 inline-block text-orange-600 hover:underline">
            Back to Admin Dashboard
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/en/admin"
              className="text-gray-500 hover:text-orange-600 transition"
            >
              Admin
            </Link>
            <span className="text-gray-400">/</span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            Configure payment gateway, email, and system settings
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
          <span className="text-green-600 dark:text-green-400 text-lg">{'\u2713'}</span>
          <span className="text-green-800 dark:text-green-200">{success}</span>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <span className="text-red-600 dark:text-red-400 text-lg">{'\u2717'}</span>
          <span className="text-red-800 dark:text-red-200">{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <nav className="flex gap-6">
          {[
            { id: 'razorpay' as Tab, label: 'Razorpay Payment Gateway' },
            { id: 'general' as Tab, label: 'General' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Razorpay Tab */}
      {activeTab === 'razorpay' && (
        <div>
          {/* Info Banner */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
              Razorpay Integration
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              Configure your Razorpay API keys for payment processing. Changes take effect
              within 5 minutes without requiring a server restart. You can get your keys from{' '}
              <a
                href="https://dashboard.razorpay.com/app/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                Razorpay Dashboard &rarr; Settings &rarr; API Keys
              </a>
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Razorpay Key Fields */}
              {RAZORPAY_SETTINGS.map((setting) => {
                const existing = getSettingInfo(setting.key);
                return (
                  <div key={setting.key} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                          {setting.label}
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {setting.description}
                        </p>
                      </div>
                      {existing?.updatedAt && (
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                          Updated {new Date(existing.updatedAt).toLocaleDateString()}
                          {existing.updatedBy && ` by ${existing.updatedBy}`}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={setting.isSecret ? 'password' : 'text'}
                        value={razorpayForm[setting.key] || ''}
                        onChange={(e) =>
                          setRazorpayForm((prev) => ({
                            ...prev,
                            [setting.key]: e.target.value,
                          }))
                        }
                        placeholder={setting.placeholder}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
                      />
                      {setting.isSecret && razorpayForm[setting.key] && isSecretMasked(razorpayForm[setting.key]) && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded">
                          Masked — enter new value to change
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Test Connection Result */}
              {testResult && (
                <div
                  className={`p-4 rounded-lg border ${
                    testResult.success
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={testResult.success ? 'text-green-600' : 'text-red-600'}>
                      {testResult.success ? '\u2713' : '\u2717'}
                    </span>
                    <span
                      className={
                        testResult.success
                          ? 'text-green-800 dark:text-green-200'
                          : 'text-red-800 dark:text-red-200'
                      }
                    >
                      {testResult.message}
                    </span>
                  </div>
                </div>
              )}

              {/* Mode indicator */}
              {razorpayForm.RAZORPAY_KEY_ID && (
                <div className={`flex items-center gap-2 text-sm font-medium ${
                  razorpayForm.RAZORPAY_KEY_ID.startsWith('rzp_test_')
                    ? 'text-amber-600 dark:text-amber-400'
                    : razorpayForm.RAZORPAY_KEY_ID.startsWith('rzp_live_')
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-500'
                }`}>
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    razorpayForm.RAZORPAY_KEY_ID.startsWith('rzp_test_')
                      ? 'bg-amber-500'
                      : razorpayForm.RAZORPAY_KEY_ID.startsWith('rzp_live_')
                      ? 'bg-green-500'
                      : 'bg-gray-400'
                  }`} />
                  {razorpayForm.RAZORPAY_KEY_ID.startsWith('rzp_test_')
                    ? 'Test Mode — No real payments will be processed'
                    : razorpayForm.RAZORPAY_KEY_ID.startsWith('rzp_live_')
                    ? 'Live Mode — Real payments will be processed'
                    : 'Unknown key format'}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={handleSaveRazorpay}
                  disabled={saving}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-medium transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Razorpay Settings'}
                </Button>

                <button
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition disabled:opacity-50"
                >
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>
              </div>

              {/* Help Section */}
              <div className="mt-8 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  How to set up Razorpay
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    Sign up at{' '}
                    <a
                      href="https://razorpay.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:underline"
                    >
                      razorpay.com
                    </a>{' '}
                    and complete KYC verification
                  </li>
                  <li>
                    Go to{' '}
                    <a
                      href="https://dashboard.razorpay.com/app/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:underline"
                    >
                      Dashboard &rarr; Account &amp; Settings &rarr; API Keys
                    </a>
                  </li>
                  <li>Generate a new API key pair (Key ID + Key Secret)</li>
                  <li>Copy both values and paste them above</li>
                  <li>Click &ldquo;Test Connection&rdquo; to verify the keys work</li>
                  <li>Click &ldquo;Save&rdquo; to activate</li>
                  <li>
                    For webhooks, go to{' '}
                    <a
                      href="https://dashboard.razorpay.com/app/webhooks"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:underline"
                    >
                      Dashboard &rarr; Webhooks
                    </a>
                    , add your webhook URL, and paste the secret above
                  </li>
                </ol>

                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-sm text-amber-800 dark:text-amber-200">
                  <strong>Tip:</strong> Start with Test Mode keys (rzp_test_...) to verify
                  everything works, then switch to Live Mode keys (rzp_live_...) when ready
                  to accept real payments.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* General Tab (placeholder for future settings) */}
      {activeTab === 'general' && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">{'\u2699\uFE0F'}</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            General Settings
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Additional settings like SMTP configuration, site name, contact info,
            and more will be available here in a future update.
          </p>
        </div>
      )}
    </Container>
  );
}
