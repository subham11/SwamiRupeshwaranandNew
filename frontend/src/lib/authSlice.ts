import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'super_admin' | 'admin' | 'content_editor' | 'user';

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  hasPassword: boolean;
  isVerified: boolean;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  otpSent: boolean;
  otpEmail: string | null;
  otpPurpose: 'login' | 'reset-password' | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  otpSent: false,
  otpEmail: null,
  otpPurpose: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setOtpSent: (state, action: PayloadAction<{ email: string; purpose: 'login' | 'reset-password' }>) => {
      state.otpSent = true;
      state.otpEmail = action.payload.email;
      state.otpPurpose = action.payload.purpose;
      state.isLoading = false;
      state.error = null;
    },
    clearOtpState: (state) => {
      state.otpSent = false;
      state.otpEmail = null;
      state.otpPurpose = null;
    },
    loginSuccess: (state, action: PayloadAction<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      state.otpSent = false;
      state.otpEmail = null;
      state.otpPurpose = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    refreshTokenSuccess: (state, action: PayloadAction<{
      accessToken: string;
      refreshToken: string;
    }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      state.otpSent = false;
      state.otpEmail = null;
      state.otpPurpose = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setOtpSent,
  clearOtpState,
  loginSuccess,
  updateUser,
  refreshTokenSuccess,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
