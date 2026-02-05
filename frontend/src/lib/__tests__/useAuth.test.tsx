/**
 * useAuth Hook Tests - Password Login Flow
 * Tests the complete password login flow including state management
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React, { ReactNode } from 'react';
import authReducer from '../authSlice';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock authService
const mockLoginWithPassword = jest.fn();
const mockRefreshToken = jest.fn();
const mockSetPassword = jest.fn();

jest.mock('../authService', () => ({
  __esModule: true,
  default: {
    loginWithPassword: (...args: any[]) => mockLoginWithPassword(...args),
    refreshToken: (...args: any[]) => mockRefreshToken(...args),
    setPassword: (...args: any[]) => mockSetPassword(...args),
    requestOtp: jest.fn().mockResolvedValue({ success: true }),
    verifyOtp: jest.fn().mockResolvedValue({ success: true }),
    forgotPassword: jest.fn().mockResolvedValue({ success: true }),
    resetPassword: jest.fn().mockResolvedValue({ success: true }),
    changePassword: jest.fn().mockResolvedValue({ success: true }),
    getProfile: jest.fn().mockResolvedValue({ success: true }),
  },
}));

// Import useAuth after mocking
import { useAuth } from '../useAuth';

describe('useAuth - Password Login', () => {
  let store: ReturnType<typeof configureStore>;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });
  });

  describe('loginWithPassword', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      hasPassword: true,
      isVerified: true,
      isNewUser: false,
      role: 'user' as const,
    };

    const mockSuccessResponse = {
      success: true,
      message: 'Login successful',
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-123',
      expiresIn: 3600,
      user: mockUser,
    };

    it('should login successfully with valid credentials', async () => {
      mockLoginWithPassword.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const response = await result.current.loginWithPassword('test@example.com', 'TestPassword123!');
        expect(response.success).toBe(true);
      });

      expect(mockLoginWithPassword).toHaveBeenCalledWith('test@example.com', 'TestPassword123!');
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('test@example.com');
    });

    it('should store tokens in localStorage after successful login', async () => {
      mockLoginWithPassword.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.loginWithPassword('test@example.com', 'TestPassword123!');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_access_token', 'access-token-123');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_refresh_token', 'refresh-token-123');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_user', JSON.stringify(mockUser));
    });

    it('should handle login failure with invalid credentials', async () => {
      mockLoginWithPassword.mockRejectedValue(new Error('Invalid email or password'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const response = await result.current.loginWithPassword('test@example.com', 'WrongPassword');
        expect(response.success).toBe(false);
        expect(response.error).toBe('Invalid email or password');
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe('Invalid email or password');
    });

    it('should handle login failure when password not set', async () => {
      mockLoginWithPassword.mockRejectedValue(
        new Error('Password not set. Please login with OTP and set a password.')
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const response = await result.current.loginWithPassword('test@example.com', 'AnyPassword123!');
        expect(response.success).toBe(false);
        expect(response.error).toContain('Password not set');
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should set loading state during login', async () => {
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      mockLoginWithPassword.mockReturnValue(loginPromise);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Start login
      act(() => {
        result.current.loginWithPassword('test@example.com', 'TestPassword123!');
      });

      // Loading should be true while waiting
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Resolve login
      await act(async () => {
        resolveLogin!(mockSuccessResponse);
      });

      // Loading should be false after completion
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should clear error state on successful login', async () => {
      // First, cause an error
      mockLoginWithPassword.mockRejectedValueOnce(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.loginWithPassword('test@example.com', 'WrongPassword');
      });

      expect(result.current.error).toBe('Invalid credentials');

      // Then, login successfully
      mockLoginWithPassword.mockResolvedValueOnce(mockSuccessResponse);

      await act(async () => {
        await result.current.loginWithPassword('test@example.com', 'TestPassword123!');
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle network errors', async () => {
      mockLoginWithPassword.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const response = await result.current.loginWithPassword('test@example.com', 'TestPassword123!');
        expect(response.success).toBe(false);
        expect(response.error).toBe('Network error');
      });
    });

    it('should update user state with correct role', async () => {
      const adminUser = {
        ...mockUser,
        role: 'admin' as const,
      };
      mockLoginWithPassword.mockResolvedValue({
        ...mockSuccessResponse,
        user: adminUser,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.loginWithPassword('admin@example.com', 'AdminPass123!');
      });

      expect(result.current.user?.role).toBe('admin');
    });

    it('should handle user with hasPassword true', async () => {
      mockLoginWithPassword.mockResolvedValue(mockSuccessResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.loginWithPassword('test@example.com', 'TestPassword123!');
      });

      expect(result.current.user?.hasPassword).toBe(true);
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      mockLoginWithPassword.mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.loginWithPassword('test@example.com', 'WrongPassword');
      });

      expect(result.current.error).toBe('Invalid credentials');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('logout after password login', () => {
    it('should clear all auth state on logout', async () => {
      mockLoginWithPassword.mockResolvedValue({
        success: true,
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresIn: 3600,
        user: {
          id: '1',
          email: 'test@example.com',
          hasPassword: true,
          isVerified: true,
          role: 'user',
        },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Login first
      await act(async () => {
        await result.current.loginWithPassword('test@example.com', 'TestPassword123!');
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_refresh_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');
    });
  });
});
