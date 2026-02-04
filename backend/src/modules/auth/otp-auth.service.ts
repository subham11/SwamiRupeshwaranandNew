import { Injectable, Inject, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../common/email/email.service';
import { DATABASE_SERVICE, DatabaseService } from '../../common/database/database.interface';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

// ============================================
// Types & Interfaces
// ============================================

interface OtpRecord {
  PK: string;
  SK: string;
  email: string;
  otp: string;
  purpose: 'login' | 'signup' | 'reset-password' | 'verify-email';
  expiresAt: number;
  attempts: number;
  createdAt: string;
  GSI1PK?: string;
  GSI1SK?: string;
}

interface UserRecord {
  PK: string;
  SK: string;
  id: string;
  email: string;
  name?: string;
  phone?: string;
  passwordHash?: string;
  hasPassword: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  GSI1PK?: string;
  GSI1SK?: string;
}

interface TokenPayload {
  sub: string;
  email: string;
  name?: string;
  hasPassword?: boolean;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

// ============================================
// OTP Authentication Service
// ============================================

@Injectable()
export class OtpAuthService {
  private readonly logger = new Logger(OtpAuthService.name);
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly MAX_OTP_ATTEMPTS = 3;
  private readonly OTP_COOLDOWN_SECONDS = 60;
  private readonly ACCESS_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour
  private readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    @Inject(DATABASE_SERVICE) private readonly databaseService: DatabaseService,
  ) {}

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Generate a 6-digit OTP
   */
  private generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Hash OTP or password for storage
   */
  private hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  /**
   * Hash password with salt for secure storage
   */
  private hashPassword(password: string): string {
    const salt = this.configService.get('PASSWORD_SALT', 'ashram-secure-salt-2024');
    return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  }

  /**
   * Verify password against stored hash
   */
  private verifyPassword(password: string, storedHash: string): boolean {
    const hash = this.hashPassword(password);
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
  }

  /**
   * Generate JWT token
   */
  private generateToken(userId: string, email: string, name?: string, hasPassword?: boolean, type: 'access' | 'refresh' = 'access'): string {
    const expiry = type === 'access' ? this.ACCESS_TOKEN_EXPIRY : this.REFRESH_TOKEN_EXPIRY;
    const payload: TokenPayload = {
      sub: userId,
      email,
      name,
      hasPassword,
      type,
      iat: Date.now(),
      exp: Date.now() + expiry,
    };
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const secret = this.configService.get('JWT_SECRET', 'ashram-jwt-secret-key-2024');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(base64Payload)
      .digest('base64url');
    return `${base64Payload}.${signature}`;
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 2) return null;

      const [base64Payload, signature] = parts;
      const secret = this.configService.get('JWT_SECRET', 'ashram-jwt-secret-key-2024');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(base64Payload)
        .digest('base64url');

      if (signature !== expectedSignature) return null;

      const payload = JSON.parse(Buffer.from(base64Payload, 'base64url').toString('utf-8')) as TokenPayload;
      
      if (Date.now() > payload.exp) return null;

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Generate both access and refresh tokens
   */
  private generateTokenPair(user: UserRecord): { accessToken: string; refreshToken: string; expiresIn: number } {
    const accessToken = this.generateToken(user.id, user.email, user.name, user.hasPassword, 'access');
    const refreshToken = this.generateToken(user.id, user.email, user.name, user.hasPassword, 'refresh');
    return {
      accessToken,
      refreshToken,
      expiresIn: Math.floor(this.ACCESS_TOKEN_EXPIRY / 1000),
    };
  }

  /**
   * Mask email for privacy in responses
   */
  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    const maskedLocal = localPart.length > 2
      ? `${localPart.charAt(0)}${'*'.repeat(localPart.length - 2)}${localPart.charAt(localPart.length - 1)}`
      : '*'.repeat(localPart.length);
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<UserRecord | null> {
    const normalizedEmail = email.toLowerCase().trim();
    return this.databaseService.get<UserRecord>(
      `USER#${normalizedEmail}`,
      'PROFILE',
    );
  }

  // ============================================
  // OTP Methods
  // ============================================

  /**
   * Request OTP for email login
   */
  async requestOtp(email: string): Promise<{ success: boolean; message: string; expiresIn: number }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Check for cooldown (prevent OTP spam)
    const existingOtp = await this.databaseService.get<OtpRecord>(
      `OTP#${normalizedEmail}`,
      'PENDING',
    );

    if (existingOtp) {
      const cooldownEnd = existingOtp.createdAt 
        ? new Date(existingOtp.createdAt).getTime() + this.OTP_COOLDOWN_SECONDS * 1000
        : 0;
      
      if (Date.now() < cooldownEnd) {
        const waitSeconds = Math.ceil((cooldownEnd - Date.now()) / 1000);
        throw new BadRequestException(
          `Please wait ${waitSeconds} seconds before requesting a new OTP`,
        );
      }

      // Delete old OTP
      await this.databaseService.delete(
        `OTP#${normalizedEmail}`,
        'PENDING',
      );
    }

    // Generate new OTP
    const otp = this.generateOtp();
    const hashedOtp = this.hashOtp(otp);
    const expiresAt = Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000;

    // Store OTP
    const otpRecord: OtpRecord = {
      PK: `OTP#${normalizedEmail}`,
      SK: 'PENDING',
      email: normalizedEmail,
      otp: hashedOtp,
      purpose: 'login',
      expiresAt,
      attempts: 0,
      createdAt: new Date().toISOString(),
      GSI1PK: 'OTP',
      GSI1SK: new Date().toISOString(),
    };

    await this.databaseService.put(otpRecord);

    // Send OTP email
    await this.emailService.sendOtpEmail(normalizedEmail, otp);

    return {
      success: true,
      message: `OTP sent successfully to ${this.maskEmail(normalizedEmail)}`,
      expiresIn: this.OTP_EXPIRY_MINUTES,
    };
  }

  /**
   * Request OTP for password reset
   */
  async requestPasswordResetOtp(email: string): Promise<{ success: boolean; message: string; expiresIn: number }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const user = await this.getUserByEmail(normalizedEmail);
    if (!user) {
      // Don't reveal if user exists - return success anyway
      this.logger.warn(`Password reset requested for non-existent user: ${this.maskEmail(normalizedEmail)}`);
      return {
        success: true,
        message: `If an account exists for ${this.maskEmail(normalizedEmail)}, an OTP has been sent.`,
        expiresIn: this.OTP_EXPIRY_MINUTES,
      };
    }

    // Generate and store OTP
    const otp = this.generateOtp();
    const hashedOtp = this.hashOtp(otp);
    const expiresAt = Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000;

    // Delete any existing reset OTP
    await this.databaseService.delete(
      `OTP#${normalizedEmail}`,
      'RESET',
    );

    const otpRecord: OtpRecord = {
      PK: `OTP#${normalizedEmail}`,
      SK: 'RESET',
      email: normalizedEmail,
      otp: hashedOtp,
      purpose: 'reset-password',
      expiresAt,
      attempts: 0,
      createdAt: new Date().toISOString(),
      GSI1PK: 'OTP',
      GSI1SK: new Date().toISOString(),
    };

    await this.databaseService.put(otpRecord);

    // Send password reset email
    await this.emailService.sendPasswordResetOtpEmail(normalizedEmail, otp);

    return {
      success: true,
      message: `Password reset OTP sent to ${this.maskEmail(normalizedEmail)}`,
      expiresIn: this.OTP_EXPIRY_MINUTES,
    };
  }

  /**
   * Verify OTP and authenticate user
   */
  async verifyOtp(email: string, otp: string): Promise<{
    success: boolean;
    message: string;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    user?: { id: string; email: string; name?: string; hasPassword: boolean; isVerified: boolean; isNewUser: boolean };
  }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Get OTP record
    const otpRecord = await this.databaseService.get<OtpRecord>(
      `OTP#${normalizedEmail}`,
      'PENDING',
    );

    if (!otpRecord) {
      throw new BadRequestException('No OTP request found. Please request a new OTP.');
    }

    // Check if OTP expired
    if (Date.now() > otpRecord.expiresAt) {
      await this.databaseService.delete(
        `OTP#${normalizedEmail}`,
        'PENDING',
      );
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    // Check attempts
    if (otpRecord.attempts >= this.MAX_OTP_ATTEMPTS) {
      await this.databaseService.delete(
        `OTP#${normalizedEmail}`,
        'PENDING',
      );
      throw new UnauthorizedException('Too many failed attempts. Please request a new OTP.');
    }

    // Verify OTP
    const hashedInputOtp = this.hashOtp(otp);
    if (hashedInputOtp !== otpRecord.otp) {
      // Increment attempts
      await this.databaseService.update('OTP', {
        key: { PK: `OTP#${normalizedEmail}`, SK: 'PENDING' },
        update: { attempts: otpRecord.attempts + 1 },
      });
      
      const remainingAttempts = this.MAX_OTP_ATTEMPTS - otpRecord.attempts - 1;
      throw new UnauthorizedException(
        `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
      );
    }

    // OTP verified - delete it
    await this.databaseService.delete(
      `OTP#${normalizedEmail}`,
      'PENDING',
    );

    // Find or create user
    let user = await this.databaseService.get<UserRecord>(
      `USER#${normalizedEmail}`,
      'PROFILE',
    );

    let isNewUser = false;

    if (!user) {
      // Create new user
      isNewUser = true;
      const userId = uuidv4();
      const now = new Date().toISOString();

      user = {
        PK: `USER#${normalizedEmail}`,
        SK: 'PROFILE',
        id: userId,
        email: normalizedEmail,
        hasPassword: false,
        isVerified: true,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        GSI1PK: 'USER',
        GSI1SK: now,
      };

      await this.databaseService.put(user);

      // Send welcome email
      await this.emailService.sendWelcomeEmail(normalizedEmail);
    } else {
      // Update last login
      await this.databaseService.update('USER', {
        key: { PK: `USER#${normalizedEmail}`, SK: 'PROFILE' },
        update: { lastLoginAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      });
    }

    // Generate tokens
    const tokens = this.generateTokenPair(user);

    this.logger.log(`User ${isNewUser ? 'created and' : ''} logged in: ${this.maskEmail(normalizedEmail)}`);

    return {
      success: true,
      message: isNewUser ? 'Account created successfully!' : 'Login successful!',
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        hasPassword: user.hasPassword || false,
        isVerified: user.isVerified,
        isNewUser,
      },
    };
  }

  /**
   * Resend OTP (with cooldown check)
   */
  async resendOtp(email: string): Promise<{ success: boolean; message: string; expiresIn: number }> {
    return this.requestOtp(email);
  }

  // ============================================
  // Password Methods
  // ============================================

  /**
   * Set password for user (after OTP verification)
   */
  async setPassword(userId: string, email: string, password: string, confirmPassword: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Validate passwords match
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Get user
    const user = await this.databaseService.get<UserRecord>(
      `USER#${normalizedEmail}`,
      'PROFILE',
    );

    if (!user || user.id !== userId) {
      throw new UnauthorizedException('Invalid user');
    }

    // Hash and store password
    const passwordHash = this.hashPassword(password);
    await this.databaseService.update('USER', {
      key: { PK: `USER#${normalizedEmail}`, SK: 'PROFILE' },
      update: { 
        passwordHash, 
        hasPassword: true, 
        updatedAt: new Date().toISOString() 
      },
    });

    this.logger.log(`Password set for user: ${this.maskEmail(normalizedEmail)}`);

    return {
      success: true,
      message: 'Password set successfully. You can now login with your email and password.',
    };
  }

  /**
   * Login with email and password
   */
  async loginWithPassword(email: string, password: string): Promise<{
    success: boolean;
    message: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: { id: string; email: string; name?: string; hasPassword: boolean; isVerified: boolean; isNewUser: boolean };
  }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Get user
    const user = await this.databaseService.get<UserRecord>(
      `USER#${normalizedEmail}`,
      'PROFILE',
    );

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.hasPassword || !user.passwordHash) {
      throw new BadRequestException('Password not set. Please login with OTP and set a password.');
    }

    // Verify password
    if (!this.verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.databaseService.update('USER', {
      key: { PK: `USER#${normalizedEmail}`, SK: 'PROFILE' },
      update: { lastLoginAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    });

    // Generate tokens
    const tokens = this.generateTokenPair(user);

    this.logger.log(`User logged in with password: ${this.maskEmail(normalizedEmail)}`);

    return {
      success: true,
      message: 'Login successful!',
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        hasPassword: true,
        isVerified: user.isVerified,
        isNewUser: false,
      },
    };
  }

  /**
   * Reset password using OTP
   */
  async resetPassword(email: string, otp: string, newPassword: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Get reset OTP record
    const otpRecord = await this.databaseService.get<OtpRecord>(
      `OTP#${normalizedEmail}`,
      'RESET',
    );

    if (!otpRecord) {
      throw new BadRequestException('No password reset request found. Please request a new OTP.');
    }

    // Check if OTP expired
    if (Date.now() > otpRecord.expiresAt) {
      await this.databaseService.delete(
        `OTP#${normalizedEmail}`,
        'RESET',
      );
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    // Check attempts
    if (otpRecord.attempts >= this.MAX_OTP_ATTEMPTS) {
      await this.databaseService.delete(
        `OTP#${normalizedEmail}`,
        'RESET',
      );
      throw new UnauthorizedException('Too many failed attempts. Please request a new OTP.');
    }

    // Verify OTP
    const hashedInputOtp = this.hashOtp(otp);
    if (hashedInputOtp !== otpRecord.otp) {
      await this.databaseService.update('OTP', {
        key: { PK: `OTP#${normalizedEmail}`, SK: 'RESET' },
        update: { attempts: otpRecord.attempts + 1 },
      });
      
      const remainingAttempts = this.MAX_OTP_ATTEMPTS - otpRecord.attempts - 1;
      throw new UnauthorizedException(
        `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
      );
    }

    // Delete OTP
    await this.databaseService.delete(
      `OTP#${normalizedEmail}`,
      'RESET',
    );

    // Update password
    const passwordHash = this.hashPassword(newPassword);
    await this.databaseService.update('USER', {
      key: { PK: `USER#${normalizedEmail}`, SK: 'PROFILE' },
      update: { 
        passwordHash, 
        hasPassword: true, 
        updatedAt: new Date().toISOString() 
      },
    });

    this.logger.log(`Password reset for user: ${this.maskEmail(normalizedEmail)}`);

    return {
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    };
  }

  /**
   * Change password (for authenticated users)
   */
  async changePassword(userId: string, email: string, currentPassword: string, newPassword: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Get user
    const user = await this.databaseService.get<UserRecord>(
      `USER#${normalizedEmail}`,
      'PROFILE',
    );

    if (!user || user.id !== userId) {
      throw new UnauthorizedException('Invalid user');
    }

    if (!user.hasPassword || !user.passwordHash) {
      throw new BadRequestException('No password set. Use set password instead.');
    }

    // Verify current password
    if (!this.verifyPassword(currentPassword, user.passwordHash)) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Update password
    const passwordHash = this.hashPassword(newPassword);
    await this.databaseService.update('USER', {
      key: { PK: `USER#${normalizedEmail}`, SK: 'PROFILE' },
      update: { 
        passwordHash, 
        updatedAt: new Date().toISOString() 
      },
    });

    this.logger.log(`Password changed for user: ${this.maskEmail(normalizedEmail)}`);

    return {
      success: true,
      message: 'Password changed successfully.',
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{
    success: boolean;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const payload = this.verifyToken(refreshToken);
    
    if (!payload || payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Get user to ensure they still exist
    const user = await this.getUserByEmail(payload.email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate new tokens
    const tokens = this.generateTokenPair(user);

    return {
      success: true,
      ...tokens,
    };
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string, email: string): Promise<{
    id: string;
    email: string;
    name?: string;
    phone?: string;
    hasPassword: boolean;
    isVerified: boolean;
    createdAt: string;
    lastLoginAt?: string;
  }> {
    const user = await this.getUserByEmail(email);
    
    if (!user || user.id !== userId) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      hasPassword: user.hasPassword || false,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, email: string, updates: { name?: string; phone?: string }): Promise<{
    success: boolean;
    message: string;
  }> {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.getUserByEmail(normalizedEmail);
    if (!user || user.id !== userId) {
      throw new UnauthorizedException('User not found');
    }

    await this.databaseService.update('USER', {
      key: { PK: `USER#${normalizedEmail}`, SK: 'PROFILE' },
      update: { 
        ...updates,
        updatedAt: new Date().toISOString() 
      },
    });

    return {
      success: true,
      message: 'Profile updated successfully',
    };
  }
}
