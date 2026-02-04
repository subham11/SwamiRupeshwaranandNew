'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import Button from '@/components/ui/Button';

interface LoginFormProps {
  onOtpSent?: () => void;
  onLoginSuccess?: () => void;
  onForgotPassword?: () => void;
}

export default function LoginForm({ onOtpSent, onLoginSuccess, onForgotPassword }: LoginFormProps) {
  const { requestOtp, loginWithPassword, isLoading, error, clearError, otpSent } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginMode, setLoginMode] = useState<'otp' | 'password'>('otp');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (loginMode === 'otp') {
      const result = await requestOtp(email);
      if (result.success && onOtpSent) {
        onOtpSent();
      }
    } else {
      const result = await loginWithPassword(email, password);
      if (result.success && onLoginSuccess) {
        onLoginSuccess();
      }
    }
  };

  const toggleMode = () => {
    setLoginMode(prev => prev === 'otp' ? 'password' : 'otp');
    setPassword('');
    clearError();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Welcome Back
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            {loginMode === 'otp' 
              ? 'Enter your email to receive a one-time password'
              : 'Enter your email and password to login'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          {loginMode === 'password' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg 
                         bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white
                         focus:ring-2 focus:ring-amber-500 focus:border-transparent
                         transition-colors"
              />
            </div>
          )}

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
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {loginMode === 'otp' ? 'Sending OTP...' : 'Logging in...'}
              </span>
            ) : (
              loginMode === 'otp' ? 'Send OTP' : 'Login'
            )}
          </Button>
        </form>

        <div className="mt-6 space-y-4">
          <button
            type="button"
            onClick={toggleMode}
            className="w-full text-center text-sm text-amber-600 dark:text-amber-400 hover:underline"
          >
            {loginMode === 'otp' 
              ? 'Login with password instead' 
              : 'Login with OTP instead'
            }
          </button>

          {loginMode === 'password' && onForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              className="w-full text-center text-sm text-zinc-600 dark:text-zinc-400 hover:underline"
            >
              Forgot your password?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
