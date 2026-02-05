import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: {
    login: jest.Mock;
    refreshToken: jest.Mock;
    setNewPassword: jest.Mock;
  };

  beforeEach(async () => {
    mockAuthService = {
      login: jest.fn(),
      refreshToken: jest.fn(),
      setNewPassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'TestPassword123!',
    };

    it('should login successfully with valid credentials', async () => {
      const expectedResponse = {
        success: true,
        message: 'Login successful',
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        idToken: 'id-token-123',
        expiresIn: 3600,
      };
      mockAuthService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResponse);
      expect(result.success).toBe(true);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockAuthService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(controller.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      const nonExistentUserDto = {
        email: 'nonexistent@example.com',
        password: 'SomePassword123!',
      };
      mockAuthService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(controller.login(nonExistentUserDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException for new password required challenge', async () => {
      mockAuthService.login.mockRejectedValue(
        new BadRequestException({
          message: 'New password required',
          challengeName: 'NEW_PASSWORD_REQUIRED',
          session: 'session-token-123',
        }),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(BadRequestException);
    });

    it('should handle login with email in different cases', async () => {
      const uppercaseEmailDto = {
        email: 'TEST@EXAMPLE.COM',
        password: 'TestPassword123!',
      };
      const expectedResponse = {
        success: true,
        message: 'Login successful',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        idToken: 'id-token',
        expiresIn: 3600,
      };
      mockAuthService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(uppercaseEmailDto);

      expect(result.success).toBe(true);
      expect(mockAuthService.login).toHaveBeenCalledWith(uppercaseEmailDto);
    });

    it('should handle empty password', async () => {
      const emptyPasswordDto = {
        email: 'test@example.com',
        password: '',
      };
      mockAuthService.login.mockRejectedValue(
        new BadRequestException('Password must be at least 8 characters'),
      );

      await expect(controller.login(emptyPasswordDto)).rejects.toThrow(BadRequestException);
    });

    it('should handle short password', async () => {
      const shortPasswordDto = {
        email: 'test@example.com',
        password: 'short',
      };
      mockAuthService.login.mockRejectedValue(
        new BadRequestException('Password must be at least 8 characters'),
      );

      await expect(controller.login(shortPasswordDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('refresh', () => {
    const refreshDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should refresh token successfully', async () => {
      const expectedResponse = {
        success: true,
        message: 'Token refreshed successfully',
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        idToken: 'new-id-token',
        expiresIn: 3600,
      };
      mockAuthService.refreshToken.mockResolvedValue(expectedResponse);

      const result = await controller.refresh(refreshDto);

      expect(result).toEqual(expectedResponse);
      expect(result.success).toBe(true);
      expect(result.accessToken).toBeDefined();
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(refreshDto);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const invalidRefreshDto = {
        refreshToken: 'invalid-refresh-token',
      };
      mockAuthService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token'),
      );

      await expect(controller.refresh(invalidRefreshDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      const expiredRefreshDto = {
        refreshToken: 'expired-refresh-token',
      };
      mockAuthService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Refresh token expired'),
      );

      await expect(controller.refresh(expiredRefreshDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('setNewPassword', () => {
    const newPasswordDto = {
      email: 'test@example.com',
      newPassword: 'NewSecurePassword123!',
      session: 'cognito-session-token',
    };

    it('should set new password successfully', async () => {
      const expectedResponse = {
        success: true,
        message: 'Password set successfully',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        idToken: 'id-token',
        expiresIn: 3600,
      };
      mockAuthService.setNewPassword.mockResolvedValue(expectedResponse);

      const result = await controller.setNewPassword(newPasswordDto);

      expect(result).toEqual(expectedResponse);
      expect(result.success).toBe(true);
      expect(mockAuthService.setNewPassword).toHaveBeenCalledWith(newPasswordDto);
    });

    it('should throw UnauthorizedException for invalid session', async () => {
      const invalidSessionDto = {
        email: 'test@example.com',
        newPassword: 'NewPassword123!',
        session: 'invalid-session',
      };
      mockAuthService.setNewPassword.mockRejectedValue(
        new UnauthorizedException('Invalid session'),
      );

      await expect(controller.setNewPassword(invalidSessionDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException for weak password', async () => {
      const weakPasswordDto = {
        email: 'test@example.com',
        newPassword: 'weak',
        session: 'valid-session',
      };
      mockAuthService.setNewPassword.mockRejectedValue(
        new BadRequestException('Password does not meet requirements'),
      );

      await expect(controller.setNewPassword(weakPasswordDto)).rejects.toThrow(BadRequestException);
    });
  });
});
