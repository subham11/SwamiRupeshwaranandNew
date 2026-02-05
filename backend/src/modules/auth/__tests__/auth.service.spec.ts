import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { CognitoService } from '../../../common/cognito/cognito.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockCognitoService: {
    authenticate: jest.Mock;
    refreshToken: jest.Mock;
    respondToNewPasswordChallenge: jest.Mock;
  };

  beforeEach(async () => {
    mockCognitoService = {
      authenticate: jest.fn(),
      refreshToken: jest.fn(),
      respondToNewPasswordChallenge: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, { provide: CognitoService, useValue: mockCognitoService }],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'TestPassword123!',
    };

    const authResult = {
      accessToken: 'cognito-access-token',
      refreshToken: 'cognito-refresh-token',
      idToken: 'cognito-id-token',
      expiresIn: 3600,
    };

    it('should login successfully with valid credentials', async () => {
      mockCognitoService.authenticate.mockResolvedValue(authResult);

      const result = await service.login(loginDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Login successful');
      expect(result.accessToken).toBe('cognito-access-token');
      expect(result.refreshToken).toBe('cognito-refresh-token');
      expect(result.idToken).toBe('cognito-id-token');
      expect(result.expiresIn).toBe(3600);
      expect(mockCognitoService.authenticate).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      mockCognitoService.authenticate.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      mockCognitoService.authenticate.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.login({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        }),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw BadRequestException when new password is required', async () => {
      mockCognitoService.authenticate.mockRejectedValue(
        new BadRequestException({
          message: 'New password required',
          challengeName: 'NEW_PASSWORD_REQUIRED',
          session: 'session-token',
        }),
      );

      await expect(service.login(loginDto)).rejects.toThrow(BadRequestException);
    });

    it('should handle login with various valid email formats', async () => {
      const emails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user@subdomain.example.com',
      ];

      mockCognitoService.authenticate.mockResolvedValue(authResult);

      for (const email of emails) {
        const result = await service.login({ email, password: 'TestPassword123!' });
        expect(result.success).toBe(true);
      }

      expect(mockCognitoService.authenticate).toHaveBeenCalledTimes(emails.length);
    });

    it('should pass password with special characters correctly', async () => {
      const specialPasswordDto = {
        email: 'test@example.com',
        password: 'P@$$w0rd!#$%^&*()',
      };
      mockCognitoService.authenticate.mockResolvedValue(authResult);

      const result = await service.login(specialPasswordDto);

      expect(result.success).toBe(true);
      expect(mockCognitoService.authenticate).toHaveBeenCalledWith(
        specialPasswordDto.email,
        specialPasswordDto.password,
      );
    });

    it('should handle network errors gracefully', async () => {
      mockCognitoService.authenticate.mockRejectedValue(new Error('Network error'));

      await expect(service.login(loginDto)).rejects.toThrow('Network error');
    });
  });

  describe('refreshToken', () => {
    const refreshDto = {
      refreshToken: 'valid-refresh-token',
    };

    const refreshResult = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      idToken: 'new-id-token',
      expiresIn: 3600,
    };

    it('should refresh token successfully', async () => {
      mockCognitoService.refreshToken.mockResolvedValue(refreshResult);

      const result = await service.refreshToken(refreshDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Token refreshed successfully');
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(mockCognitoService.refreshToken).toHaveBeenCalledWith(refreshDto.refreshToken);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockCognitoService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token'),
      );

      await expect(
        service.refreshToken({
          refreshToken: 'invalid-token',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      mockCognitoService.refreshToken.mockRejectedValue(new UnauthorizedException('Token expired'));

      await expect(
        service.refreshToken({
          refreshToken: 'expired-token',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle empty refresh token', async () => {
      mockCognitoService.refreshToken.mockRejectedValue(
        new BadRequestException('Refresh token is required'),
      );

      await expect(
        service.refreshToken({
          refreshToken: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('setNewPassword', () => {
    const newPasswordDto = {
      email: 'test@example.com',
      newPassword: 'NewSecurePassword123!',
      session: 'cognito-session-token',
    };

    const passwordSetResult = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      idToken: 'id-token',
      expiresIn: 3600,
    };

    it('should set new password successfully', async () => {
      mockCognitoService.respondToNewPasswordChallenge.mockResolvedValue(passwordSetResult);

      const result = await service.setNewPassword(newPasswordDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password set successfully');
      expect(result.accessToken).toBe('access-token');
      expect(mockCognitoService.respondToNewPasswordChallenge).toHaveBeenCalledWith(
        newPasswordDto.email,
        newPasswordDto.newPassword,
        newPasswordDto.session,
      );
    });

    it('should throw UnauthorizedException for invalid session', async () => {
      mockCognitoService.respondToNewPasswordChallenge.mockRejectedValue(
        new UnauthorizedException('Invalid session'),
      );

      await expect(
        service.setNewPassword({
          ...newPasswordDto,
          session: 'invalid-session',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired session', async () => {
      mockCognitoService.respondToNewPasswordChallenge.mockRejectedValue(
        new UnauthorizedException('Session expired'),
      );

      await expect(
        service.setNewPassword({
          ...newPasswordDto,
          session: 'expired-session',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException for password not meeting policy', async () => {
      mockCognitoService.respondToNewPasswordChallenge.mockRejectedValue(
        new BadRequestException('Password does not meet complexity requirements'),
      );

      await expect(
        service.setNewPassword({
          ...newPasswordDto,
          newPassword: 'weak',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle password with all required complexity', async () => {
      const complexPasswordDto = {
        email: 'test@example.com',
        newPassword: 'C0mpl3x!P@ssw0rd#2024',
        session: 'valid-session',
      };
      mockCognitoService.respondToNewPasswordChallenge.mockResolvedValue(passwordSetResult);

      const result = await service.setNewPassword(complexPasswordDto);

      expect(result.success).toBe(true);
    });
  });
});
