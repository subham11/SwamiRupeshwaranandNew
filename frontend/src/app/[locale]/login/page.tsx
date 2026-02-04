'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { LoginForm, OtpVerificationForm, SetPasswordForm, ForgotPasswordForm } from '@/components/auth';
import Container from '@/components/ui/Container';

type AuthStep = 'login' | 'otp' | 'set-password' | 'forgot-password';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user, otpSent } = useAuth();
  const [step, setStep] = useState<AuthStep>('login');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      router.push(redirectTo);
    }
  }, [isAuthenticated, user, router, searchParams]);

  // Handle OTP sent state
  useEffect(() => {
    if (otpSent && step === 'login') {
      setStep('otp');
    }
  }, [otpSent, step]);

  const handleOtpSent = () => {
    setStep('otp');
  };

  const handleLoginSuccess = () => {
    const redirectTo = searchParams.get('redirect') || '/dashboard';
    router.push(redirectTo);
  };

  const handleVerifySuccess = (isNewUser: boolean) => {
    if (isNewUser) {
      setStep('set-password');
    } else {
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      router.push(redirectTo);
    }
  };

  const handleSetPasswordSuccess = () => {
    const redirectTo = searchParams.get('redirect') || '/dashboard';
    router.push(redirectTo);
  };

  const handleSkipPassword = () => {
    const redirectTo = searchParams.get('redirect') || '/dashboard';
    router.push(redirectTo);
  };

  const handleForgotPassword = () => {
    setStep('forgot-password');
  };

  const handleForgotPasswordSuccess = () => {
    setStep('login');
  };

  const handleBack = () => {
    setStep('login');
  };

  return (
    <div className="max-w-md mx-auto">
      {step === 'login' && (
        <LoginForm
          onOtpSent={handleOtpSent}
          onLoginSuccess={handleLoginSuccess}
          onForgotPassword={handleForgotPassword}
        />
      )}

      {step === 'otp' && (
        <OtpVerificationForm
          onVerifySuccess={handleVerifySuccess}
          onBack={handleBack}
        />
      )}

      {step === 'set-password' && (
        <SetPasswordForm
          onSuccess={handleSetPasswordSuccess}
          onSkip={handleSkipPassword}
        />
      )}

      {step === 'forgot-password' && (
        <ForgotPasswordForm
          onSuccess={handleForgotPasswordSuccess}
          onBack={handleBack}
        />
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <Container>
        <Suspense fallback={
          <div className="max-w-md mx-auto flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        }>
          <LoginContent />
        </Suspense>
      </Container>
    </div>
  );
}
