import {
  Injectable,
  Inject,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CognitoService, AuthResult, CustomAuthInitResult } from '../../common/cognito/cognito.service';
import { DATABASE_SERVICE, DatabaseService } from '../../common/database/database.interface';
import * as crypto from 'crypto';

// ============================================
// Types & Interfaces
// ============================================

interface UserRecord {
  PK: string;
  SK: string;
  id: string;
  email: string;
  name?: string;
  phone?: string;
  cognitoSub?: string;
  hasPassword: boolean;
  isVerified: boolean;
  role: 'super_admin' | 'admin' | 'content_editor' | 'user';
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  GSI1PK?: string;
  GSI1SK?: string;
}

/**
 * Temporary in-memory session store for OTP challenge sessions.
 * In production with multiple Lambda instances, this would need
 * to be stored in DynamoDB. However, since Cognito sessions are
 * short-lived (3 min), and our Lambda is a single-concurrency
 * function, this is acceptable.
 *
 * Key: email, Value: Cognito session token
 */
const otpSessions = new Map<string, { session: string; expiresAt: number }>();

// ============================================
// OTP Authentication Service (Cognito-backed)
// ============================================

@Injectable()
export class OtpAuthService {
  private readonly logger = new Logger(OtpAuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly cognitoService: CognitoService,
    @Inject(DATABASE_SERVICE) private readonly databaseService: DatabaseService,
  ) {}

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Mask email for privacy in responses
   */
  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    const maskedLocal =
      localPart.length > 2
        ? `${localPart.charAt(0)}${'*'.repeat(localPart.length - 2)}${localPart.charAt(localPart.length - 1)}`
        : '*'.repeat(localPart.length);
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Get user by email from app's DynamoDB table
   */
  async getUserByEmail(email: string): Promise<UserRecord | null> {
    const normalizedEmail = email.toLowerCase().trim();
    return this.databaseService.get<UserRecord>(`USER#${normalizedEmail}`, 'PROFILE');
  }

  /**
   * Ensure user exists in Cognito. If not, create them.
   * Returns true if user was just created.
   */
  private async ensureCognitoUser(email: string): Promise<boolean> {
    const existing = await this.cognitoService.getUser(email);
    if (existing) return false;

    // Create user in Cognito with a random temp password (they'll use OTP to login)
    const tempPassword = crypto.randomBytes(16).toString('base64') + '!1aA';
    await this.cognitoService.createUser(email, tempPassword);
    // Set a permanent password so user isn't stuck in FORCE_CHANGE_PASSWORD state
    await this.cognitoService.setUserPassword(email, tempPassword, true);
    return true;
  }

  /**
   * Map Cognito AuthResult to our API response format.
   * Also syncs user record in app table.
   */
  private async buildAuthResponse(
    email: string,
    authResult: AuthResult,
    isNewUser: boolean,
  ) {
    const normalizedEmail = email.toLowerCase().trim();

    // Get or create user in app table
    let user = await this.getUserByEmail(normalizedEmail);

    if (!user) {
      // PostAuthentication trigger should have created the user,
      // but in case of race condition, create here
      const { v4: uuidv4 } = await import('uuid');
      const now = new Date().toISOString();
      user = {
        PK: `USER#${normalizedEmail}`,
        SK: 'PROFILE',
        id: uuidv4(),
        email: normalizedEmail,
        hasPassword: false,
        isVerified: true,
        role: 'user',
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        GSI1PK: 'USER',
        GSI1SK: now,
      };
      await this.databaseService.put(user);
      isNewUser = true;
    }

    return {
      success: true,
      message: isNewUser ? 'Account created successfully!' : 'Login successful!',
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken,
      idToken: authResult.idToken,
      expiresIn: authResult.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        hasPassword: user.hasPassword || false,
        isVerified: user.isVerified,
        role: user.role || 'user',
        isNewUser,
      },
    };
  }

  // ============================================
  // OTP Methods (Cognito CUSTOM_AUTH flow)
  // ============================================

  /**
   * Request OTP for email login.
   * Initiates Cognito CUSTOM_AUTH flow which triggers:
   *   DefineAuthChallenge → CreateAuthChallenge (sends OTP via SES)
   */
  async requestOtp(
    email: string,
  ): Promise<{ success: boolean; message: string; expiresIn: number }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Ensure user exists in Cognito (auto-create if new)
    const isNew = await this.ensureCognitoUser(normalizedEmail);
    if (isNew) {
      this.logger.log(`New Cognito user created for: ${this.maskEmail(normalizedEmail)}`);
    }

    // Initiate CUSTOM_AUTH flow (Cognito will call CreateAuthChallenge → sends OTP)
    const result = await this.cognitoService.initiateCustomAuth(normalizedEmail);

    // Store session for verify step
    otpSessions.set(normalizedEmail, {
      session: result.session,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
    });

    this.logger.log(`OTP requested for: ${this.maskEmail(normalizedEmail)}`);

    return {
      success: true,
      message: `OTP sent successfully to ${this.maskEmail(normalizedEmail)}`,
      expiresIn: 5,
    };
  }

  /**
   * Verify OTP and authenticate user.
   * Responds to Cognito CUSTOM_CHALLENGE with the user's OTP answer.
   */
  async verifyOtp(
    email: string,
    otp: string,
  ): Promise<{
    success: boolean;
    message: string;
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    expiresIn?: number;
    user?: {
      id: string;
      email: string;
      name?: string;
      hasPassword: boolean;
      isVerified: boolean;
      role: 'super_admin' | 'admin' | 'content_editor' | 'user';
      isNewUser: boolean;
    };
  }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Get stored session
    const sessionData = otpSessions.get(normalizedEmail);
    if (!sessionData) {
      throw new BadRequestException('No OTP request found. Please request a new OTP.');
    }

    if (Date.now() > sessionData.expiresAt) {
      otpSessions.delete(normalizedEmail);
      throw new BadRequestException('OTP session expired. Please request a new OTP.');
    }

    // Respond to Cognito challenge with OTP
    const result = await this.cognitoService.respondToCustomChallenge(
      normalizedEmail,
      otp.trim(),
      sessionData.session,
    );

    // Check if we got tokens (success) or another challenge (wrong OTP)
    if ('accessToken' in result) {
      // Success — clean up session
      otpSessions.delete(normalizedEmail);

      // Check if this is a new user in our app table
      const existingUser = await this.getUserByEmail(normalizedEmail);
      const isNewUser = !existingUser;

      return this.buildAuthResponse(normalizedEmail, result, isNewUser);
    }

    // Wrong OTP — Cognito issued another challenge for retry
    // Update session with new session token
    otpSessions.set(normalizedEmail, {
      session: (result as CustomAuthInitResult).session,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    throw new UnauthorizedException('Invalid OTP. Please try again.');
  }

  /**
   * Resend OTP (re-initiates the flow)
   */
  async resendOtp(
    email: string,
  ): Promise<{ success: boolean; message: string; expiresIn: number }> {
    return this.requestOtp(email);
  }

  // ============================================
  // Password Methods (Cognito USER_PASSWORD_AUTH)
  // ============================================

  /**
   * Login with email and password via Cognito
   */
  async loginWithPassword(
    email: string,
    password: string,
  ): Promise<{
    success: boolean;
    message: string;
    accessToken: string;
    refreshToken: string;
    idToken: string;
    expiresIn: number;
    user: {
      id: string;
      email: string;
      name?: string;
      hasPassword: boolean;
      isVerified: boolean;
      role: 'super_admin' | 'admin' | 'content_editor' | 'user';
      isNewUser: boolean;
    };
  }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Authenticate with Cognito (password flow)
    const authResult = await this.cognitoService.authenticate(normalizedEmail, password);

    this.logger.log(`User logged in with password: ${this.maskEmail(normalizedEmail)}`);

    return this.buildAuthResponse(normalizedEmail, authResult, false) as any;
  }

  /**
   * Set password for user (after OTP verification).
   * Sets the password in Cognito so user can use password login next time.
   */
  async setPassword(
    userId: string,
    email: string,
    password: string,
    confirmPassword: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const normalizedEmail = email.toLowerCase().trim();

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Get user from app table for validation
    const user = await this.databaseService.get<UserRecord>(`USER#${normalizedEmail}`, 'PROFILE');
    if (!user || user.id !== userId) {
      throw new UnauthorizedException('Invalid user');
    }

    // Set password in Cognito
    await this.cognitoService.setUserPassword(normalizedEmail, password, true);

    // Update app table
    await this.databaseService.update('USER', {
      key: { PK: `USER#${normalizedEmail}`, SK: 'PROFILE' },
      update: {
        hasPassword: true,
        updatedAt: new Date().toISOString(),
      },
    });

    this.logger.log(`Password set for user: ${this.maskEmail(normalizedEmail)}`);

    return {
      success: true,
      message: 'Password set successfully. You can now login with your email and password.',
    };
  }

  /**
   * Request OTP for password reset (uses same OTP flow)
   */
  async requestPasswordResetOtp(
    email: string,
  ): Promise<{ success: boolean; message: string; expiresIn: number }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists (don't reveal if they don't)
    const user = await this.getUserByEmail(normalizedEmail);
    if (!user) {
      this.logger.warn(
        `Password reset requested for non-existent user: ${this.maskEmail(normalizedEmail)}`,
      );
      return {
        success: true,
        message: `If an account exists for ${this.maskEmail(normalizedEmail)}, an OTP has been sent.`,
        expiresIn: 5,
      };
    }

    // Use same OTP flow
    return this.requestOtp(normalizedEmail);
  }

  /**
   * Reset password using OTP.
   * First verifies OTP via Cognito, then sets new password.
   */
  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP first (this also authenticates the user)
    const verifyResult = await this.verifyOtp(normalizedEmail, otp);
    if (!verifyResult.success) {
      throw new BadRequestException('Invalid OTP');
    }

    // Now set the new password in Cognito
    await this.cognitoService.setUserPassword(normalizedEmail, newPassword, true);

    // Update app table
    await this.databaseService.update('USER', {
      key: { PK: `USER#${normalizedEmail}`, SK: 'PROFILE' },
      update: {
        hasPassword: true,
        updatedAt: new Date().toISOString(),
      },
    });

    this.logger.log(`Password reset for user: ${this.maskEmail(normalizedEmail)}`);

    return {
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    };
  }

  /**
   * Change password (for authenticated users).
   * Verifies old password by trying to authenticate, then sets new one.
   */
  async changePassword(
    userId: string,
    email: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Verify current password by attempting Cognito auth
    try {
      await this.cognitoService.authenticate(normalizedEmail, currentPassword);
    } catch {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Set new password
    await this.cognitoService.setUserPassword(normalizedEmail, newPassword, true);

    this.logger.log(`Password changed for user: ${this.maskEmail(normalizedEmail)}`);

    return {
      success: true,
      message: 'Password changed successfully.',
    };
  }

  /**
   * Refresh access token via Cognito
   */
  async refreshToken(refreshToken: string): Promise<{
    success: boolean;
    accessToken: string;
    refreshToken: string;
    idToken: string;
    expiresIn: number;
  }> {
    const result = await this.cognitoService.refreshToken(refreshToken);

    return {
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      idToken: result.idToken,
      expiresIn: result.expiresIn,
    };
  }

  /**
   * Get current user profile
   */
  async getProfile(
    userId: string,
    email: string,
  ): Promise<{
    id: string;
    email: string;
    name?: string;
    phone?: string;
    hasPassword: boolean;
    isVerified: boolean;
    role: 'super_admin' | 'admin' | 'content_editor' | 'user';
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
      role: user.role || 'user',
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    email: string,
    updates: { name?: string; phone?: string },
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.getUserByEmail(normalizedEmail);
    if (!user || user.id !== userId) {
      throw new UnauthorizedException('User not found');
    }

    // Update in Cognito if name changed
    if (updates.name) {
      try {
        await this.cognitoService.updateUserAttributes(normalizedEmail, { name: updates.name });
      } catch (error) {
        this.logger.warn(`Failed to update Cognito attributes: ${error}`);
      }
    }

    // Update in app table
    await this.databaseService.update('USER', {
      key: { PK: `USER#${normalizedEmail}`, SK: 'PROFILE' },
      update: {
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    });

    return {
      success: true,
      message: 'Profile updated successfully',
    };
  }
}
