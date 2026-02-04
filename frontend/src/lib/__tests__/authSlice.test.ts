import authReducer, {
  setLoading,
  setError,
  setOtpSent,
  clearOtpState,
  loginSuccess,
  updateUser,
  refreshTokenSuccess,
  logout,
  AuthState,
} from '../authSlice';

describe('authSlice', () => {
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

  describe('initial state', () => {
    it('should return the initial state', () => {
      expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      const actual = authReducer(initialState, setLoading(true));
      expect(actual.isLoading).toBe(true);
    });

    it('should set loading to false', () => {
      const state = { ...initialState, isLoading: true };
      const actual = authReducer(state, setLoading(false));
      expect(actual.isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const actual = authReducer(initialState, setError('Invalid credentials'));
      expect(actual.error).toBe('Invalid credentials');
    });

    it('should clear error when passed null', () => {
      const state = { ...initialState, error: 'Some error' };
      const actual = authReducer(state, setError(null));
      expect(actual.error).toBeNull();
    });
  });

  describe('setOtpSent', () => {
    it('should set OTP sent state', () => {
      const actual = authReducer(
        initialState,
        setOtpSent({ email: 'test@example.com', purpose: 'login' })
      );
      expect(actual.otpSent).toBe(true);
      expect(actual.otpEmail).toBe('test@example.com');
      expect(actual.otpPurpose).toBe('login');
    });

    it('should handle reset purpose', () => {
      const actual = authReducer(
        initialState,
        setOtpSent({ email: 'test@example.com', purpose: 'reset' })
      );
      expect(actual.otpPurpose).toBe('reset');
    });
  });

  describe('clearOtpState', () => {
    it('should clear all OTP-related state', () => {
      const state = {
        ...initialState,
        otpSent: true,
        otpEmail: 'test@example.com',
        otpPurpose: 'login' as const,
      };
      const actual = authReducer(state, clearOtpState());
      expect(actual.otpSent).toBe(false);
      expect(actual.otpEmail).toBeNull();
      expect(actual.otpPurpose).toBeNull();
    });
  });

  describe('loginSuccess', () => {
    it('should set user and tokens on login success', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        hasPassword: true,
        isVerified: true,
      };
      const actual = authReducer(
        initialState,
        loginSuccess({
          user,
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        })
      );
      expect(actual.user).toEqual(user);
      expect(actual.accessToken).toBe('access-token');
      expect(actual.refreshToken).toBe('refresh-token');
      expect(actual.isAuthenticated).toBe(true);
      expect(actual.isLoading).toBe(false);
      expect(actual.error).toBeNull();
    });

    it('should clear OTP state on login', () => {
      const state = {
        ...initialState,
        otpSent: true,
        otpEmail: 'test@example.com',
        otpPurpose: 'login' as const,
      };
      const actual = authReducer(
        state,
        loginSuccess({
          user: { id: '1', email: 'test@example.com', hasPassword: true, isVerified: true },
          accessToken: 'token',
          refreshToken: 'refresh',
        })
      );
      expect(actual.otpSent).toBe(false);
      expect(actual.otpEmail).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user properties', () => {
      const state = {
        ...initialState,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Old Name',
          hasPassword: false,
          isVerified: true,
        },
        isAuthenticated: true,
      };
      const actual = authReducer(
        state,
        updateUser({ name: 'New Name', hasPassword: true })
      );
      expect(actual.user?.name).toBe('New Name');
      expect(actual.user?.hasPassword).toBe(true);
      expect(actual.user?.email).toBe('test@example.com');
    });

    it('should not update if no user exists', () => {
      const actual = authReducer(
        initialState,
        updateUser({ name: 'New Name' })
      );
      expect(actual.user).toBeNull();
    });
  });

  describe('refreshTokenSuccess', () => {
    it('should update tokens', () => {
      const state = {
        ...initialState,
        accessToken: 'old-access',
        refreshToken: 'old-refresh',
        isAuthenticated: true,
      };
      const actual = authReducer(
        state,
        refreshTokenSuccess({
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
        })
      );
      expect(actual.accessToken).toBe('new-access');
      expect(actual.refreshToken).toBe('new-refresh');
    });
  });

  describe('logout', () => {
    it('should reset to initial state', () => {
      const state = {
        ...initialState,
        user: { id: '1', email: 'test@example.com', hasPassword: true, isVerified: true },
        accessToken: 'token',
        refreshToken: 'refresh',
        isAuthenticated: true,
        otpSent: true,
        otpEmail: 'test@example.com',
        otpPurpose: 'login' as const,
      };
      const actual = authReducer(state, logout());
      expect(actual).toEqual(initialState);
    });
  });
});
