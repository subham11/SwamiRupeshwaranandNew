import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { OtpAuthService } from '../otp-auth.service';
import { CognitoService } from '../../../common/cognito/cognito.service';
import { DATABASE_SERVICE } from '../../../common/database/database.interface';

describe('OtpAuthService', () => {
  let service: OtpAuthService;
  let mockDatabaseService: {
    get: jest.Mock;
    put: jest.Mock;
    delete: jest.Mock;
    update: jest.Mock;
  };
  let mockCognitoService: {
    getUser: jest.Mock;
    createUser: jest.Mock;
    setUserPassword: jest.Mock;
    initiateCustomAuth: jest.Mock;
    respondToCustomChallenge: jest.Mock;
    authenticate: jest.Mock;
    refreshToken: jest.Mock;
    updateUserAttributes: jest.Mock;
  };

  beforeEach(async () => {
    mockDatabaseService = {
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    };

    mockCognitoService = {
      getUser: jest.fn().mockResolvedValue({ username: 'test-sub', email: 'test@example.com' }),
      createUser: jest.fn().mockResolvedValue(undefined),
      setUserPassword: jest.fn().mockResolvedValue(undefined),
      initiateCustomAuth: jest.fn().mockResolvedValue({
        session: 'cognito-session-token',
        challengeName: 'CUSTOM_CHALLENGE',
        challengeParameters: {},
      }),
      respondToCustomChallenge: jest.fn(),
      authenticate: jest.fn(),
      refreshToken: jest.fn(),
      updateUserAttributes: jest.fn().mockResolvedValue(undefined),
    };

    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const config: Record<string, any> = {
          COGNITO_USER_POOL_ID: 'test-pool-id',
          COGNITO_CLIENT_ID: 'test-client-id',
        };
        return config[key] || defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpAuthService,
        { provide: DATABASE_SERVICE, useValue: mockDatabaseService },
        { provide: CognitoService, useValue: mockCognitoService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<OtpAuthService>(OtpAuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestOtp', () => {
    it('should initiate Cognito CUSTOM_AUTH and return success', async () => {
      const result = await service.requestOtp('test@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toContain('OTP sent successfully');
      expect(result.expiresIn).toBe(5);
      expect(mockCognitoService.initiateCustomAuth).toHaveBeenCalledWith('test@example.com');
    });

    it('should auto-create Cognito user if not found', async () => {
      mockCognitoService.getUser.mockResolvedValueOnce(null);

      const result = await service.requestOtp('new@example.com');

      expect(result.success).toBe(true);
      expect(mockCognitoService.createUser).toHaveBeenCalledWith('new@example.com', expect.any(String));
      expect(mockCognitoService.setUserPassword).toHaveBeenCalled();
    });

    it('should not create Cognito user if already exists', async () => {
      const result = await service.requestOtp('test@example.com');

      expect(result.success).toBe(true);
      expect(mockCognitoService.createUser).not.toHaveBeenCalled();
    });

    it('should normalize email to lowercase', async () => {
      await service.requestOtp('Test@Example.COM');

      expect(mockCognitoService.initiateCustomAuth).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('verifyOtp', () => {
    const mockAuthResult = {
      accessToken: 'cognito-access-token',
      refreshToken: 'cognito-refresh-token',
      idToken: 'cognito-id-token',
      expiresIn: 3600,
    };

    beforeEach(async () => {
      // First request OTP to store a session
      await service.requestOtp('test@example.com');
    });

    it('should verify OTP and return tokens for existing user', async () => {
      const existingUser = {
        PK: 'USER#test@example.com',
        SK: 'PROFILE',
        id: 'user-123',
        email: 'test@example.com',
        hasPassword: false,
        isVerified: true,
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockCognitoService.respondToCustomChallenge.mockResolvedValue(mockAuthResult);
      mockDatabaseService.get.mockResolvedValue(existingUser);

      const result = await service.verifyOtp('test@example.com', '123456');

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('cognito-access-token');
      expect(result.idToken).toBe('cognito-id-token');
      expect(result.refreshToken).toBe('cognito-refresh-token');
      expect(result.user?.email).toBe('test@example.com');
      expect(result.user?.isNewUser).toBe(false);
    });

    it('should create app user record if not found', async () => {
      mockCognitoService.respondToCustomChallenge.mockResolvedValue(mockAuthResult);
      mockDatabaseService.get.mockResolvedValue(null);
      mockDatabaseService.put.mockResolvedValue({} as any);

      const result = await service.verifyOtp('test@example.com', '123456');

      expect(result.success).toBe(true);
      expect(result.user?.isNewUser).toBe(true);
      expect(mockDatabaseService.put).toHaveBeenCalled();
    });

    it('should throw error if no OTP session found', async () => {
      await expect(service.verifyOtp('unknown@example.com', '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error on wrong OTP (Cognito returns new challenge)', async () => {
      mockCognitoService.respondToCustomChallenge.mockResolvedValue({
        session: 'new-session',
        challengeName: 'CUSTOM_CHALLENGE',
        challengeParameters: {},
      });

      await expect(service.verifyOtp('test@example.com', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('loginWithPassword', () => {
    const mockAuthResult = {
      accessToken: 'cognito-access-token',
      refreshToken: 'cognito-refresh-token',
      idToken: 'cognito-id-token',
      expiresIn: 3600,
    };

    it('should login successfully with correct password', async () => {
      const existingUser = {
        PK: 'USER#test@example.com',
        SK: 'PROFILE',
        id: 'user-123',
        email: 'test@example.com',
        hasPassword: true,
        isVerified: true,
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockCognitoService.authenticate.mockResolvedValue(mockAuthResult);
      mockDatabaseService.get.mockResolvedValue(existingUser);

      const result = await service.loginWithPassword('test@example.com', 'TestPassword123!');

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('cognito-access-token');
      expect(result.user?.email).toBe('test@example.com');
      expect(mockCognitoService.authenticate).toHaveBeenCalledWith('test@example.com', 'TestPassword123!');
    });

    it('should throw error for invalid credentials', async () => {
      mockCognitoService.authenticate.mockRejectedValue(
        new UnauthorizedException('Incorrect username or password'),
      );

      await expect(
        service.loginWithPassword('test@example.com', 'WrongPassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('setPassword', () => {
    const existingUser = {
      PK: 'USER#test@example.com',
      SK: 'PROFILE',
      id: 'user-123',
      email: 'test@example.com',
      hasPassword: false,
      isVerified: true,
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should set password via Cognito successfully', async () => {
      mockDatabaseService.get.mockResolvedValue(existingUser);
      mockDatabaseService.update.mockResolvedValue({} as any);

      const result = await service.setPassword(
        'user-123',
        'test@example.com',
        'NewPassword123!',
        'NewPassword123!',
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('Password set successfully');
      expect(mockCognitoService.setUserPassword).toHaveBeenCalledWith(
        'test@example.com',
        'NewPassword123!',
        true,
      );
      expect(mockDatabaseService.update).toHaveBeenCalled();
    });

    it('should throw error if passwords do not match', async () => {
      await expect(
        service.setPassword('user-123', 'test@example.com', 'Password1', 'Password2'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if user not found', async () => {
      mockDatabaseService.get.mockResolvedValue(null);

      await expect(
        service.setPassword('user-123', 'test@example.com', 'Password1', 'Password1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw error if user ID does not match', async () => {
      mockDatabaseService.get.mockResolvedValue({ ...existingUser, id: 'different-user' });

      await expect(
        service.setPassword('user-123', 'test@example.com', 'Password1', 'Password1'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens via Cognito successfully', async () => {
      mockCognitoService.refreshToken.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        idToken: 'new-id-token',
        expiresIn: 3600,
      });

      const result = await service.refreshToken('old-refresh-token');

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(result.idToken).toBe('new-id-token');
      expect(mockCognitoService.refreshToken).toHaveBeenCalledWith('old-refresh-token');
    });

    it('should throw error for invalid refresh token', async () => {
      mockCognitoService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token'),
      );

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('requestPasswordResetOtp', () => {
    it('should send reset OTP for existing user', async () => {
      const user = {
        PK: 'USER#test@example.com',
        SK: 'PROFILE',
        id: 'user-123',
        email: 'test@example.com',
        hasPassword: true,
        isVerified: true,
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockDatabaseService.get.mockResolvedValue(user);

      const result = await service.requestPasswordResetOtp('test@example.com');

      expect(result.success).toBe(true);
      expect(mockCognitoService.initiateCustomAuth).toHaveBeenCalled();
    });

    it('should return success even for non-existent user (security)', async () => {
      mockDatabaseService.get.mockResolvedValue(null);

      const result = await service.requestPasswordResetOtp('nonexistent@example.com');

      expect(result.success).toBe(true);
      expect(mockCognitoService.initiateCustomAuth).not.toHaveBeenCalled();
    });
  });
});
