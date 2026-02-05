'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';

export default function DashboardPage() {
  const router = useRouter();
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error, 
    updateProfile, 
    changePassword, 
    logout, 
    setPassword,
    clearError 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  
  // Status messages
  const [successMessage, setSuccessMessage] = useState('');

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

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

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

    if (newPassword !== confirmPassword) {
      return;
    }

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

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'Contains uppercase', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'Contains lowercase', test: (p: string) => /[a-z]/.test(p) },
    { label: 'Contains number', test: (p: string) => /\d/.test(p) },
    { label: 'Contains special char', test: (p: string) => /[@$!%*?&]/.test(p) },
  ];

  const isPasswordValid = passwordRequirements.every(req => req.test(newPassword));
  const doPasswordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  return (
    <div className="min-h-[70vh] py-12">
      <Container>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                  {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{user.name || 'Welcome!'}</h1>
                  <p className="text-white/80">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {user.isVerified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 rounded-full text-xs">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    )}
                    {user.hasPassword && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 rounded-full text-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Password Set
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                onClick={logout}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                Logout
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-zinc-800 rounded-b-2xl shadow-xl">
            {/* Tabs */}
            <div className="border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-6 py-4 font-medium text-sm transition-colors ${
                    activeTab === 'profile'
                      ? 'text-amber-600 border-b-2 border-amber-600'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => router.push('/dashboard/subscription')}
                  className="px-6 py-4 font-medium text-sm transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                >
                  Subscription
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`px-6 py-4 font-medium text-sm transition-colors ${
                    activeTab === 'security'
                      ? 'text-amber-600 border-b-2 border-amber-600'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Security
                </button>
              </div>
            </div>

            {/* Status Messages */}
            {(successMessage || error) && (
              <div className="px-8 pt-6">
                {successMessage && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-green-700 dark:text-green-400">{successMessage}</p>
                  </div>
                )}
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-700 dark:text-red-400">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                    Profile Information
                  </h2>
                  {!editMode && (
                    <Button
                      variant="outline"
                      onClick={() => setEditMode(true)}
                    >
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
                        className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg 
                                 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white
                                 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                        className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg 
                                 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white
                                 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                    <div>
                      <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                        Email
                      </label>
                      <p className="text-zinc-900 dark:text-white">{user.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                        Full Name
                      </label>
                      <p className="text-zinc-900 dark:text-white">{user.name || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                        Phone Number
                      </label>
                      <p className="text-zinc-900 dark:text-white">{user.phone || 'Not set'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="p-8">
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
                        className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg 
                                 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white
                                 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                      className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg 
                               bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white
                               focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  {/* Password Requirements */}
                  <div className="grid grid-cols-2 gap-2">
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className={req.test(newPassword) ? 'text-green-500' : 'text-zinc-400'}>
                          {req.test(newPassword) ? '✓' : '○'}
                        </span>
                        <span className={req.test(newPassword) ? 'text-green-600' : 'text-zinc-500'}>
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
                      className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg 
                               bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white
                               focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
      </Container>
    </div>
  );
}
