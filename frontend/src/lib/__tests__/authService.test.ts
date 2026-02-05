import authService from '../authService';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('loginWithPassword', () => {
    const email = 'test@example.com';
    const password = 'TestPassword123!';

    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        success: true,
        message: 'Login successful',
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        expiresIn: 3600,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          hasPassword: true,
          isVerified: true,
          isNewUser: false,
          role: 'user',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await authService.loginWithPassword(email, password);

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('access-token-123');
      expect(result.refreshToken).toBe('refresh-token-123');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.hasPassword).toBe(true);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ email, password }),
        })
      );
    });

    it('should throw error for invalid credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          message: 'Invalid email or password',
        }),
      });

      await expect(
        authService.loginWithPassword(email, 'WrongPassword123!')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for non-existent user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          message: 'Invalid email or password',
        }),
      });

      await expect(
        authService.loginWithPassword('nonexistent@example.com', password)
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error when password is not set', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          message: 'Password not set. Please login with OTP and set a password.',
        }),
      });

      await expect(
        authService.loginWithPassword(email, password)
      ).rejects.toThrow('Password not set. Please login with OTP and set a password.');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        authService.loginWithPassword(email, password)
      ).rejects.toThrow('Network error');
    });

    it('should handle server errors (500)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          message: 'Internal server error',
        }),
      });

      await expect(
        authService.loginWithPassword(email, password)
      ).rejects.toThrow('Internal server error');
    });

    it('should send correct request headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresIn: 3600,
          user: { id: '1', email, hasPassword: true, isVerified: true, role: 'user' },
        }),
      });

      await authService.loginWithPassword(email, password);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle email with different cases', async () => {
      const uppercaseEmail = 'TEST@EXAMPLE.COM';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresIn: 3600,
          user: { id: '1', email: uppercaseEmail.toLowerCase(), hasPassword: true, isVerified: true, role: 'user' },
        }),
      });

      const result = await authService.loginWithPassword(uppercaseEmail, password);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ email: uppercaseEmail, password }),
        })
      );
    });

    it('should handle password with special characters', async () => {
      const specialPassword = 'P@$$w0rd!#$%^&*()';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresIn: 3600,
          user: { id: '1', email, hasPassword: true, isVerified: true, role: 'user' },
        }),
      });

      const result = await authService.loginWithPassword(email, specialPassword);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ email, password: specialPassword }),
        })
      );
    });

    it('should return user role correctly', async () => {
      const mockAdminResponse = {
        success: true,
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresIn: 3600,
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          hasPassword: true,
          isVerified: true,
          isNewUser: false,
          role: 'admin',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAdminResponse),
      });

      const result = await authService.loginWithPassword('admin@example.com', password);

      expect(result.user.role).toBe('admin');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = {
        success: true,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await authService.refreshToken('old-refresh-token');

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/refresh'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ refreshToken: 'old-refresh-token' }),
        })
      );
    });

    it('should throw error for invalid refresh token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          message: 'Invalid refresh token',
        }),
      });

      await expect(
        authService.refreshToken('invalid-token')
      ).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error for expired refresh token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          message: 'Token expired',
        }),
      });

      await expect(
        authService.refreshToken('expired-token')
      ).rejects.toThrow('Token expired');
    });
  });

  describe('setPassword', () => {
    const accessToken = 'valid-access-token';

    it('should set password successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: 'Password set successfully',
        }),
      });

      const result = await authService.setPassword('NewPassword123!', 'NewPassword123!', accessToken);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/set-password'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          }),
          body: JSON.stringify({
            password: 'NewPassword123!',
            confirmPassword: 'NewPassword123!',
          }),
        })
      );
    });

    it('should throw error when passwords do not match', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          message: 'Passwords do not match',
        }),
      });

      await expect(
        authService.setPassword('Password1', 'Password2', accessToken)
      ).rejects.toThrow('Passwords do not match');
    });

    it('should throw error for weak password', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          message: 'Password must contain uppercase, lowercase, number and special character',
        }),
      });

      await expect(
        authService.setPassword('weak', 'weak', accessToken)
      ).rejects.toThrow('Password must contain uppercase, lowercase, number and special character');
    });

    it('should throw error without authentication', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          message: 'Unauthorized',
        }),
      });

      await expect(
        authService.setPassword('Password123!', 'Password123!', '')
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('forgotPassword', () => {
    it('should request password reset successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: 'OTP sent successfully',
          expiresIn: 10,
        }),
      });

      const result = await authService.forgotPassword('test@example.com');

      expect(result.success).toBe(true);
      expect(result.expiresIn).toBe(10);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/forgot-password'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com' }),
        })
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: 'Password reset successfully',
        }),
      });

      const result = await authService.resetPassword('test@example.com', '123456', 'NewPassword123!');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/reset-password'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            otp: '123456',
            newPassword: 'NewPassword123!',
          }),
        })
      );
    });

    it('should throw error for invalid OTP', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          message: 'Invalid OTP',
        }),
      });

      await expect(
        authService.resetPassword('test@example.com', 'wrong', 'NewPassword123!')
      ).rejects.toThrow('Invalid OTP');
    });
  });

  describe('changePassword', () => {
    const accessToken = 'valid-access-token';

    it('should change password successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: 'Password changed successfully',
        }),
      });

      const result = await authService.changePassword('OldPassword123!', 'NewPassword123!', accessToken);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/change-password'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${accessToken}`,
          }),
          body: JSON.stringify({
            currentPassword: 'OldPassword123!',
            newPassword: 'NewPassword123!',
          }),
        })
      );
    });

    it('should throw error for wrong current password', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          message: 'Current password is incorrect',
        }),
      });

      await expect(
        authService.changePassword('WrongPassword', 'NewPassword123!', accessToken)
      ).rejects.toThrow('Current password is incorrect');
    });
  });
});
