'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import Button from '@/components/ui/Button';

interface OtpVerificationFormProps {
  onVerifySuccess?: (isNewUser: boolean) => void;
  onResendOtp?: () => void;
  onBack?: () => void;
}

export default function OtpVerificationForm({ 
  onVerifySuccess, 
  onBack 
}: OtpVerificationFormProps) {
  const { verifyOtp, requestOtp, isLoading, error, clearError, otpEmail, otpPurpose } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Take only last digit
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    
    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex(digit => !digit);
    inputRefs.current[nextEmptyIndex === -1 ? 5 : nextEmptyIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!otpEmail) return;

    const otpString = otp.join('');
    if (otpString.length !== 6) return;

    const result = await verifyOtp(otpEmail, otpString);
    if (result.success && onVerifySuccess) {
      onVerifySuccess(result.isNewUser || false);
    }
  };

  const handleResend = async () => {
    if (!otpEmail || resendCooldown > 0) return;
    clearError();
    await requestOtp(otpEmail);
    setResendCooldown(60);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const isComplete = otp.every(digit => digit);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {otpPurpose === 'reset-password' ? 'Reset Password' : 'Verify Your Email'}
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            We&apos;ve sent a 6-digit code to
          </p>
          <p className="text-amber-600 dark:text-amber-400 font-medium">
            {otpEmail}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-xl font-bold
                         border-2 border-zinc-300 dark:border-zinc-600 rounded-lg 
                         bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white
                         focus:ring-2 focus:ring-amber-500 focus:border-transparent
                         transition-colors"
              />
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !isComplete}
            className="w-full py-3"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verifying...
              </span>
            ) : (
              'Verify OTP'
            )}
          </Button>
        </form>

        <div className="mt-6 space-y-4 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Didn&apos;t receive the code?{' '}
            {resendCooldown > 0 ? (
              <span className="text-amber-600">Resend in {resendCooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-amber-600 dark:text-amber-400 hover:underline font-medium"
              >
                Resend OTP
              </button>
            )}
          </p>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-zinc-600 dark:text-zinc-400 hover:underline"
            >
              ← Back to login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
