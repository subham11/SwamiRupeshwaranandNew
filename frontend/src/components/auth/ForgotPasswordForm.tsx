'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import Button from '@/components/ui/Button';
import OtpVerificationForm from './OtpVerificationForm';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export default function ForgotPasswordForm({ onSuccess, onBack }: ForgotPasswordFormProps) {
  const { forgotPassword, resetPassword, isLoading, error, clearError, otpSent, otpEmail, clearOtpState } = useAuth();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'Contains uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'Contains lowercase letter', test: (p: string) => /[a-z]/.test(p) },
    { label: 'Contains a number', test: (p: string) => /\d/.test(p) },
    { label: 'Contains special character', test: (p: string) => /[@$!%*?&]/.test(p) },
  ];

  const isPasswordValid = passwordRequirements.every(req => req.test(newPassword));
  const doPasswordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const result = await forgotPassword(email);
    if (result.success) {
      setShowResetForm(true);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!isPasswordValid || !doPasswordsMatch || !otpEmail) return;

    const result = await resetPassword(otpEmail, otp, newPassword);
    if (result.success && onSuccess) {
      onSuccess();
    }
  };

  const handleBack = () => {
    if (showResetForm) {
      setShowResetForm(false);
      clearOtpState();
    } else if (onBack) {
      onBack();
    }
  };

  // If OTP is sent but we're not yet on reset form, show OTP verification
  if (otpSent && !showResetForm) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8">
          <OtpVerificationForm
            onVerifySuccess={() => setShowResetForm(true)}
            onBack={handleBack}
          />
        </div>
      </div>
    );
  }

  // Show reset password form after OTP verification
  if (showResetForm) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Create New Password
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              Enter the OTP and your new password
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                OTP Code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit OTP"
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg 
                         bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white text-center text-xl tracking-widest
                         focus:ring-2 focus:ring-amber-500 focus:border-transparent
                         transition-colors"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 border border-zinc-300 dark:border-zinc-600 rounded-lg 
                           bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white
                           focus:ring-2 focus:ring-amber-500 focus:border-transparent
                           transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="space-y-1">
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
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg 
                         bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white
                         focus:ring-2 focus:ring-amber-500 focus:border-transparent
                         transition-colors"
              />
              {confirmPassword && !doPasswordsMatch && (
                <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !isPasswordValid || !doPasswordsMatch || otp.length !== 6}
              className="w-full py-3"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-zinc-600 dark:text-zinc-400 hover:underline"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Initial form - enter email
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Forgot Password?
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Enter your email and we&apos;ll send you an OTP to reset your password
          </p>
        </div>

        <form onSubmit={handleRequestOtp} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg 
                       bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white
                       focus:ring-2 focus:ring-amber-500 focus:border-transparent
                       transition-colors"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !email}
            className="w-full py-3"
          >
            {isLoading ? 'Sending...' : 'Send Reset OTP'}
          </Button>
        </form>

        {onBack && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-zinc-600 dark:text-zinc-400 hover:underline"
            >
              ← Back to login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
