import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { OtpAuthController } from '../otp-auth.controller';
import { OtpAuthService } from '../otp-auth.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUserData } from '../../../common/decorators/current-user.decorator';

describe('OtpAuthController', () => {
  let controller: OtpAuthController;
  let mockOtpAuthService: {
    requestOtp: jest.Mock;
    verifyOtp: jest.Mock;
    resendOtp: jest.Mock;
    loginWithPassword: jest.Mock;
    setPassword: jest.Mock;
    requestPasswordResetOtp: jest.Mock;
    resetPassword: jest.Mock;
    changePassword: jest.Mock;
    refreshToken: jest.Mock;
    getProfile: jest.Mock;
    updateProfile: jest.Mock;
  };

  beforeEach(async () => {
    mockOtpAuthService = {
      requestOtp: jest.fn(),
      verifyOtp: jest.fn(),
      resendOtp: jest.fn(),
      loginWithPassword: jest.fn(),
      setPassword: jest.fn(),
      requestPasswordResetOtp: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
      refreshToken: jest.fn(),
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OtpAuthController],
      providers: [
        { provide: OtpAuthService, useValue: mockOtpAuthService },
        { provide: ConfigService, useValue: mockConfigService },
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OtpAuthController>(OtpAuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestOtp', () => {
    it('should request OTP for given email', async () => {
      const expectedResponse = {
        success: true,
        message: 'OTP sent successfully',
        expiresIn: 10,
      };
      mockOtpAuthService.requestOtp.mockResolvedValue(expectedResponse);

      const result = await controller.requestOtp({ email: 'test@example.com' });

      expect(result).toEqual(expectedResponse);
      expect(mockOtpAuthService.requestOtp).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP and return tokens', async () => {
      const expectedResponse = {
        success: true,
        message: 'OTP verified successfully',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: null,
          phone: null,
          hasPassword: false,
          isNewUser: true,
          isVerified: true,
        },
      };
      mockOtpAuthService.verifyOtp.mockResolvedValue(expectedResponse);

      const result = await controller.verifyOtp({
        email: 'test@example.com',
        otp: '123456',
      });

      expect(result).toEqual(expectedResponse);
      expect(mockOtpAuthService.verifyOtp).toHaveBeenCalledWith('test@example.com', '123456');
    });
  });

  describe('resendOtp', () => {
    it('should resend OTP', async () => {
      const expectedResponse = {
        success: true,
        message: 'OTP resent successfully',
        expiresIn: 10,
      };
      mockOtpAuthService.resendOtp.mockResolvedValue(expectedResponse);

      const result = await controller.resendOtp({ email: 'test@example.com' });

      expect(result).toEqual(expectedResponse);
      expect(mockOtpAuthService.resendOtp).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('loginWithPassword', () => {
    it('should login with email and password', async () => {
      const expectedResponse = {
        success: true,
        message: 'Login successful',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          phone: null,
          hasPassword: true,
          isNewUser: false,
          isVerified: true,
        },
      };
      mockOtpAuthService.loginWithPassword.mockResolvedValue(expectedResponse);

      const result = await controller.loginWithPassword({
        email: 'test@example.com',
        password: 'TestPassword123!',
      });

      expect(result).toEqual(expectedResponse);
      expect(mockOtpAuthService.loginWithPassword).toHaveBeenCalledWith(
        'test@example.com',
        'TestPassword123!',
      );
    });
  });

  describe('setPassword', () => {
    it('should set password for authenticated user', async () => {
      const user: CurrentUserData = { sub: 'user-123', email: 'test@example.com' };
      const expectedResponse = {
        success: true,
        message: 'Password set successfully',
      };
      mockOtpAuthService.setPassword.mockResolvedValue(expectedResponse);

      const result = await controller.setPassword(user, {
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      });

      expect(result).toEqual(expectedResponse);
      expect(mockOtpAuthService.setPassword).toHaveBeenCalledWith(
        'user-123',
        'test@example.com',
        'NewPassword123!',
        'NewPassword123!',
      );
    });
  });

  describe('forgotPassword', () => {
    it('should request password reset OTP', async () => {
      const expectedResponse = {
        success: true,
        message: 'If an account exists, a reset OTP has been sent',
        expiresIn: 10,
      };
      mockOtpAuthService.requestPasswordResetOtp.mockResolvedValue(expectedResponse);

      const result = await controller.forgotPassword({ email: 'test@example.com' });

      expect(result).toEqual(expectedResponse);
      expect(mockOtpAuthService.requestPasswordResetOtp).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('resetPassword', () => {
    it('should reset password with OTP', async () => {
      const expectedResponse = {
        success: true,
        message: 'Password reset successfully',
      };
      mockOtpAuthService.resetPassword.mockResolvedValue(expectedResponse);

      const result = await controller.resetPassword({
        email: 'test@example.com',
        otp: '123456',
        newPassword: 'NewPassword123!',
      });

      expect(result).toEqual(expectedResponse);
      expect(mockOtpAuthService.resetPassword).toHaveBeenCalledWith(
        'test@example.com',
        '123456',
        'NewPassword123!',
      );
    });
  });

  describe('changePassword', () => {
    it('should change password for authenticated user', async () => {
      const user: CurrentUserData = { sub: 'user-123', email: 'test@example.com' };
      const expectedResponse = {
        success: true,
        message: 'Password changed successfully',
      };
      mockOtpAuthService.changePassword.mockResolvedValue(expectedResponse);

      const result = await controller.changePassword(user, {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      });

      expect(result).toEqual(expectedResponse);
      expect(mockOtpAuthService.changePassword).toHaveBeenCalledWith(
        'user-123',
        'test@example.com',
        'OldPassword123!',
        'NewPassword123!',
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens', async () => {
      const expectedResponse = {
        success: true,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };
      mockOtpAuthService.refreshToken.mockResolvedValue(expectedResponse);

      const result = await controller.refreshToken({ refreshToken: 'old-refresh-token' });

      expect(result).toEqual(expectedResponse);
      expect(mockOtpAuthService.refreshToken).toHaveBeenCalledWith('old-refresh-token');
    });
  });

  describe('getProfile', () => {
    it('should get user profile', async () => {
      const user: CurrentUserData = { sub: 'user-123', email: 'test@example.com' };
      const expectedResponse = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        phone: '+1234567890',
        hasPassword: true,
        isVerified: true,
      };
      mockOtpAuthService.getProfile.mockResolvedValue(expectedResponse);

      const result = await controller.getProfile(user);

      expect(result).toEqual(expectedResponse);
      expect(mockOtpAuthService.getProfile).toHaveBeenCalledWith('user-123', 'test@example.com');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const user: CurrentUserData = { sub: 'user-123', email: 'test@example.com' };
      const updates = { name: 'Updated Name', phone: '+9876543210' };
      const expectedResponse = {
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Updated Name',
          phone: '+9876543210',
          hasPassword: true,
          isVerified: true,
        },
      };
      mockOtpAuthService.updateProfile.mockResolvedValue(expectedResponse);

      const result = await controller.updateProfile(user, updates);

      expect(result).toEqual(expectedResponse);
      expect(mockOtpAuthService.updateProfile).toHaveBeenCalledWith(
        'user-123',
        'test@example.com',
        updates,
      );
    });

    it('should update only name', async () => {
      const user: CurrentUserData = { sub: 'user-123', email: 'test@example.com' };
      const updates = { name: 'New Name Only' };
      mockOtpAuthService.updateProfile.mockResolvedValue({
        success: true,
        message: 'Profile updated successfully',
      });

      await controller.updateProfile(user, updates);

      expect(mockOtpAuthService.updateProfile).toHaveBeenCalledWith(
        'user-123',
        'test@example.com',
        { name: 'New Name Only' },
      );
    });
  });
});
