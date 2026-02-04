import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { OtpAuthService } from '../otp-auth.service';
import { EmailService } from '../../../common/email/email.service';
import { DATABASE_SERVICE } from '../../../common/database/database.interface';

describe('OtpAuthService', () => {
  let service: OtpAuthService;
  let mockDatabaseService: {
    get: jest.Mock;
    put: jest.Mock;
    delete: jest.Mock;
    update: jest.Mock;
  };
  let mockEmailService: {
    sendOtpEmail: jest.Mock;
    sendPasswordResetOtpEmail: jest.Mock;
    sendWelcomeEmail: jest.Mock;
  };

  beforeEach(async () => {
    // Create mock services
    mockDatabaseService = {
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    };

    mockEmailService = {
      sendOtpEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetOtpEmail: jest.fn().mockResolvedValue(undefined),
      sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
    };

    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const config: Record<string, any> = {
          JWT_SECRET: 'test-jwt-secret',
          PASSWORD_SALT: 'test-password-salt',
        };
        return config[key] || defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpAuthService,
        { provide: DATABASE_SERVICE, useValue: mockDatabaseService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<OtpAuthService>(OtpAuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestOtp', () => {
    it('should send OTP successfully for new request', async () => {
      mockDatabaseService.get.mockResolvedValue(null);
      mockDatabaseService.put.mockResolvedValue({} as any);

      const result = await service.requestOtp('test@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toContain('OTP sent successfully');
      expect(result.expiresIn).toBe(10);
      expect(mockEmailService.sendOtpEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
      );
      expect(mockDatabaseService.put).toHaveBeenCalled();
    });

    it('should throw error if OTP request is on cooldown', async () => {
      const recentOtp = {
        PK: 'OTP#test@example.com',
        SK: 'PENDING',
        createdAt: new Date().toISOString(),
        expiresAt: Date.now() + 600000,
        attempts: 0,
      };
      mockDatabaseService.get.mockResolvedValue(recentOtp);

      await expect(service.requestOtp('test@example.com')).rejects.toThrow(BadRequestException);
    });

    it('should delete old OTP if cooldown expired', async () => {
      const oldOtp = {
        PK: 'OTP#test@example.com',
        SK: 'PENDING',
        createdAt: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
        expiresAt: Date.now() + 600000,
        attempts: 0,
      };
      mockDatabaseService.get.mockResolvedValue(oldOtp);
      mockDatabaseService.delete.mockResolvedValue(undefined);
      mockDatabaseService.put.mockResolvedValue({} as any);

      const result = await service.requestOtp('test@example.com');

      expect(result.success).toBe(true);
      expect(mockDatabaseService.delete).toHaveBeenCalledWith('OTP#test@example.com', 'PENDING');
    });

    it('should normalize email to lowercase', async () => {
      mockDatabaseService.get.mockResolvedValue(null);
      mockDatabaseService.put.mockResolvedValue({} as any);

      await service.requestOtp('Test@Example.COM');

      const putCall = mockDatabaseService.put.mock.calls[0][0];
      expect(putCall.email).toBe('test@example.com');
    });
  });

  describe('verifyOtp', () => {
    const validOtpRecord = {
      PK: 'OTP#test@example.com',
      SK: 'PENDING',
      email: 'test@example.com',
      otp: '', // Will be set dynamically
      expiresAt: Date.now() + 600000,
      attempts: 0,
      purpose: 'login',
    };

    it('should verify OTP and create new user', async () => {
      // Generate OTP and hash it the same way the service does
      const otp = '123456';
      const crypto = require('crypto');
      const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

      mockDatabaseService.get
        .mockResolvedValueOnce({ ...validOtpRecord, otp: hashedOtp }) // OTP record
        .mockResolvedValueOnce(null); // No existing user
      mockDatabaseService.delete.mockResolvedValue(undefined);
      mockDatabaseService.put.mockResolvedValue({} as any);

      const result = await service.verifyOtp('test@example.com', otp);

      expect(result.success).toBe(true);
      expect(result.user?.isNewUser).toBe(true);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalled();
    });

    it('should throw error if no OTP request found', async () => {
      mockDatabaseService.get.mockResolvedValue(null);

      await expect(service.verifyOtp('test@example.com', '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if OTP expired', async () => {
      const expiredOtp = {
        ...validOtpRecord,
        otp: 'somehash',
        expiresAt: Date.now() - 1000, // Expired
      };
      mockDatabaseService.get.mockResolvedValue(expiredOtp);
      mockDatabaseService.delete.mockResolvedValue(undefined);

      await expect(service.verifyOtp('test@example.com', '123456')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockDatabaseService.delete).toHaveBeenCalled();
    });

    it('should throw error after max attempts', async () => {
      const maxAttemptsOtp = {
        ...validOtpRecord,
        otp: 'somehash',
        attempts: 3,
      };
      mockDatabaseService.get.mockResolvedValue(maxAttemptsOtp);
      mockDatabaseService.delete.mockResolvedValue(undefined);

      await expect(service.verifyOtp('test@example.com', '123456')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should increment attempts on wrong OTP', async () => {
      const wrongOtpRecord = {
        ...validOtpRecord,
        otp: 'different-hash',
        attempts: 0,
      };
      mockDatabaseService.get.mockResolvedValue(wrongOtpRecord);
      mockDatabaseService.update.mockResolvedValue({} as any);

      await expect(service.verifyOtp('test@example.com', '123456')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockDatabaseService.update).toHaveBeenCalled();
    });
  });

  describe('loginWithPassword', () => {
    const existingUser = {
      PK: 'USER#test@example.com',
      SK: 'PROFILE',
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      hasPassword: true,
      passwordHash: '', // Will be set dynamically
      isVerified: true,
    };

    it('should login successfully with correct password', async () => {
      // Hash password the same way the service does
      const crypto = require('crypto');
      const salt = 'test-password-salt';
      const passwordHash = crypto
        .pbkdf2Sync('TestPassword123!', salt, 100000, 64, 'sha512')
        .toString('hex');

      mockDatabaseService.get.mockResolvedValue({ ...existingUser, passwordHash });
      mockDatabaseService.update.mockResolvedValue({} as any);

      const result = await service.loginWithPassword('test@example.com', 'TestPassword123!');

      expect(result.success).toBe(true);
      expect(result.accessToken).toBeDefined();
      expect(result.user?.email).toBe('test@example.com');
    });

    it('should throw error for non-existent user', async () => {
      mockDatabaseService.get.mockResolvedValue(null);

      await expect(
        service.loginWithPassword('nonexistent@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw error for user without password set', async () => {
      mockDatabaseService.get.mockResolvedValue({
        ...existingUser,
        hasPassword: false,
        passwordHash: undefined,
      });

      await expect(service.loginWithPassword('test@example.com', 'password')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error for wrong password', async () => {
      const crypto = require('crypto');
      const salt = 'test-password-salt';
      const passwordHash = crypto
        .pbkdf2Sync('CorrectPassword', salt, 100000, 64, 'sha512')
        .toString('hex');

      mockDatabaseService.get.mockResolvedValue({ ...existingUser, passwordHash });

      await expect(service.loginWithPassword('test@example.com', 'WrongPassword')).rejects.toThrow(
        UnauthorizedException,
      );
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
    };

    it('should set password successfully', async () => {
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

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      // Generate a token using the service's method
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        hasPassword: true,
        isVerified: true,
        PK: 'USER#test@example.com',
        SK: 'PROFILE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockDatabaseService.get.mockResolvedValue(user);
      mockDatabaseService.update.mockResolvedValue({} as any);
      mockDatabaseService.delete.mockResolvedValue(undefined);
      mockDatabaseService.put.mockResolvedValue({} as any);

      // Create a valid token manually
      const crypto = require('crypto');
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Date.now(),
        exp: Date.now() + 3600000,
      };
      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const signature = crypto
        .createHmac('sha256', 'test-jwt-secret')
        .update(base64Payload)
        .digest('base64url');
      const token = `${base64Payload}.${signature}`;

      const result = service.verifyToken(token);

      expect(result).not.toBeNull();
      expect(result?.sub).toBe('user-123');
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null for expired token', () => {
      const crypto = require('crypto');
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Date.now() - 7200000,
        exp: Date.now() - 3600000, // Expired
      };
      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const signature = crypto
        .createHmac('sha256', 'test-jwt-secret')
        .update(base64Payload)
        .digest('base64url');
      const token = `${base64Payload}.${signature}`;

      const result = service.verifyToken(token);

      expect(result).toBeNull();
    });

    it('should return null for invalid signature', () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Date.now(),
        exp: Date.now() + 3600000,
      };
      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const token = `${base64Payload}.invalidsignature`;

      const result = service.verifyToken(token);

      expect(result).toBeNull();
    });

    it('should return null for malformed token', () => {
      expect(service.verifyToken('invalid')).toBeNull();
      expect(service.verifyToken('')).toBeNull();
      expect(service.verifyToken('a.b.c')).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const user = {
        PK: 'USER#test@example.com',
        SK: 'PROFILE',
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        hasPassword: true,
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockDatabaseService.get.mockResolvedValue(user);

      // Create a valid refresh token
      const crypto = require('crypto');
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        type: 'refresh',
        iat: Date.now(),
        exp: Date.now() + 604800000, // 7 days
      };
      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const signature = crypto
        .createHmac('sha256', 'test-jwt-secret')
        .update(base64Payload)
        .digest('base64url');
      const refreshToken = `${base64Payload}.${signature}`;

      const result = await service.refreshToken(refreshToken);

      expect(result.success).toBe(true);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error for invalid refresh token', async () => {
      await expect(service.refreshToken('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw error if user not found', async () => {
      mockDatabaseService.get.mockResolvedValue(null);

      const crypto = require('crypto');
      const payload = {
        sub: 'user-123',
        email: 'deleted@example.com',
        type: 'refresh',
        iat: Date.now(),
        exp: Date.now() + 604800000,
      };
      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const signature = crypto
        .createHmac('sha256', 'test-jwt-secret')
        .update(base64Payload)
        .digest('base64url');
      const refreshToken = `${base64Payload}.${signature}`;

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
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
      };

      mockDatabaseService.get.mockResolvedValue(user);
      mockDatabaseService.delete.mockResolvedValue(undefined);
      mockDatabaseService.put.mockResolvedValue({} as any);

      const result = await service.requestPasswordResetOtp('test@example.com');

      expect(result.success).toBe(true);
      expect(mockEmailService.sendPasswordResetOtpEmail).toHaveBeenCalled();
    });

    it('should return success even for non-existent user (security)', async () => {
      mockDatabaseService.get.mockResolvedValue(null);

      const result = await service.requestPasswordResetOtp('nonexistent@example.com');

      // Should return success to not reveal if user exists
      expect(result.success).toBe(true);
      expect(mockEmailService.sendPasswordResetOtpEmail).not.toHaveBeenCalled();
    });
  });
});
