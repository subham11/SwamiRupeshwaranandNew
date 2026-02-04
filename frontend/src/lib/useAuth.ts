'use client';

import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import type { RootState, AppDispatch } from '@/lib/store';
import {
  setLoading,
  setError,
  setOtpSent,
  clearOtpState,
  loginSuccess,
  updateUser,
  refreshTokenSuccess,
  logout,
  type User,
} from '@/lib/authSlice';
import authService from '@/lib/authService';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER: 'auth_user',
};

// Helper functions for local storage
const storage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
  clear: (): void => {
    storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    storage.removeItem(STORAGE_KEYS.USER);
  },
};

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const authState = useSelector((state: RootState) => state.auth);

  // Initialize auth state from localStorage
  useEffect(() => {
    const accessToken = storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    const userStr = storage.getItem(STORAGE_KEYS.USER);

    if (accessToken && refreshToken && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        dispatch(loginSuccess({ user, accessToken, refreshToken }));
      } catch {
        storage.clear();
      }
    }
  }, [dispatch]);

  // Request OTP for login
  const requestOtp = useCallback(async (email: string) => {
    dispatch(setLoading(true));
    try {
      await authService.requestOtp(email);
      dispatch(setOtpSent({ email, purpose: 'login' }));
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send OTP';
      dispatch(setError(message));
      return { success: false, error: message };
    }
  }, [dispatch]);

  // Verify OTP and login
  const verifyOtp = useCallback(async (email: string, otp: string) => {
    dispatch(setLoading(true));
    try {
      const response = await authService.verifyOtp(email, otp);
      const { accessToken, refreshToken, user } = response;
      
      // Store tokens and user
      storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      
      dispatch(loginSuccess({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          hasPassword: user.hasPassword,
          isVerified: user.isVerified,
        },
        accessToken,
        refreshToken,
      }));
      
      return { success: true, isNewUser: user.isNewUser };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify OTP';
      dispatch(setError(message));
      return { success: false, error: message };
    }
  }, [dispatch]);

  // Login with password
  const loginWithPassword = useCallback(async (email: string, password: string) => {
    dispatch(setLoading(true));
    try {
      const response = await authService.loginWithPassword(email, password);
      const { accessToken, refreshToken, user } = response;
      
      storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      
      dispatch(loginSuccess({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          hasPassword: user.hasPassword,
          isVerified: user.isVerified,
        },
        accessToken,
        refreshToken,
      }));
      
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid email or password';
      dispatch(setError(message));
      return { success: false, error: message };
    }
  }, [dispatch]);

  // Set password (after OTP login)
  const setPassword = useCallback(async (password: string, confirmPassword: string) => {
    if (!authState.accessToken) {
      dispatch(setError('Not authenticated'));
      return { success: false, error: 'Not authenticated' };
    }

    dispatch(setLoading(true));
    try {
      await authService.setPassword(password, confirmPassword, authState.accessToken);
      dispatch(updateUser({ hasPassword: true }));
      
      // Update stored user
      const userStr = storage.getItem(STORAGE_KEYS.USER);
      if (userStr) {
        const user = JSON.parse(userStr);
        user.hasPassword = true;
        storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      }
      
      dispatch(setLoading(false));
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set password';
      dispatch(setError(message));
      return { success: false, error: message };
    }
  }, [authState.accessToken, dispatch]);

  // Forgot password - request OTP
  const forgotPassword = useCallback(async (email: string) => {
    dispatch(setLoading(true));
    try {
      await authService.forgotPassword(email);
      dispatch(setOtpSent({ email, purpose: 'reset-password' }));
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reset OTP';
      dispatch(setError(message));
      return { success: false, error: message };
    }
  }, [dispatch]);

  // Reset password with OTP
  const resetPassword = useCallback(async (email: string, otp: string, newPassword: string) => {
    dispatch(setLoading(true));
    try {
      await authService.resetPassword(email, otp, newPassword);
      dispatch(clearOtpState());
      dispatch(setLoading(false));
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset password';
      dispatch(setError(message));
      return { success: false, error: message };
    }
  }, [dispatch]);

  // Change password (for authenticated users)
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!authState.accessToken) {
      dispatch(setError('Not authenticated'));
      return { success: false, error: 'Not authenticated' };
    }

    dispatch(setLoading(true));
    try {
      await authService.changePassword(currentPassword, newPassword, authState.accessToken);
      dispatch(setLoading(false));
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change password';
      dispatch(setError(message));
      return { success: false, error: message };
    }
  }, [authState.accessToken, dispatch]);

  // Update profile
  const updateProfile = useCallback(async (updates: { name?: string; phone?: string }) => {
    if (!authState.accessToken) {
      dispatch(setError('Not authenticated'));
      return { success: false, error: 'Not authenticated' };
    }

    dispatch(setLoading(true));
    try {
      await authService.updateProfile(updates, authState.accessToken);
      dispatch(updateUser(updates));
      
      // Update stored user
      const userStr = storage.getItem(STORAGE_KEYS.USER);
      if (userStr) {
        const user = JSON.parse(userStr);
        Object.assign(user, updates);
        storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      }
      
      dispatch(setLoading(false));
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      dispatch(setError(message));
      return { success: false, error: message };
    }
  }, [authState.accessToken, dispatch]);

  // Refresh tokens
  const refreshTokens = useCallback(async () => {
    const refreshToken = storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) return false;

    try {
      const response = await authService.refreshToken(refreshToken);
      storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
      storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
      dispatch(refreshTokenSuccess({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      }));
      return true;
    } catch {
      handleLogout();
      return false;
    }
  }, [dispatch]);

  // Logout
  const handleLogout = useCallback(() => {
    storage.clear();
    dispatch(logout());
    router.push('/');
  }, [dispatch, router]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch(setError(null));
  }, [dispatch]);

  // Clear OTP state
  const handleClearOtpState = useCallback(() => {
    dispatch(clearOtpState());
  }, [dispatch]);

  return {
    // State
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,
    otpSent: authState.otpSent,
    otpEmail: authState.otpEmail,
    otpPurpose: authState.otpPurpose,
    accessToken: authState.accessToken,
    
    // Actions
    requestOtp,
    verifyOtp,
    loginWithPassword,
    setPassword,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,
    refreshTokens,
    logout: handleLogout,
    clearError,
    clearOtpState: handleClearOtpState,
  };
}

export default useAuth;
