import { Injectable, Inject, BadRequestException, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { DatabaseService, DATABASE_SERVICE } from '@/common/database';
import { EmailService } from '@/common/email';
import { InviteUserDto, UpdateUserRoleDto, AdminUserResponseDto } from './dto';
import { UserRole } from '@/modules/users/dto';

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
  role: 'super_admin' | 'admin' | 'content_editor' | 'user';
  invitedBy?: string;
  tempPasswordExpiry?: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  GSI1PK?: string;
  GSI1SK?: string;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    @Inject(DATABASE_SERVICE) private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Generate a secure temporary password
   */
  private generateTemporaryPassword(): string {
    // Generate 12 character password with mixed case, numbers, and symbols
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(crypto.randomInt(chars.length));
    }
    return password;
  }

  /**
   * Hash password with salt for secure storage
   */
  private hashPassword(password: string): string {
    const salt = this.configService.get('PASSWORD_SALT', 'ashram-secure-salt-2024');
    return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  }

  /**
   * Invite a new admin or content editor
   */
  async inviteUser(
    dto: InviteUserDto,
    invitedByEmail: string,
    invitedByRole: string,
  ): Promise<{ success: boolean; message: string; user: AdminUserResponseDto }> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // Validate role hierarchy - admins can only invite content editors
    if (invitedByRole === 'admin' && dto.role === UserRole.ADMIN) {
      throw new ForbiddenException('Admins cannot invite other admins. Only Super Admins can.');
    }

    // Check if user already exists
    const existingUser = await this.databaseService.get<UserRecord>(
      `USER#${normalizedEmail}`,
      'PROFILE',
    );

    if (existingUser) {
      throw new BadRequestException('A user with this email already exists');
    }

    // Generate temporary password
    const temporaryPassword = this.generateTemporaryPassword();
    const passwordHash = this.hashPassword(temporaryPassword);
    const now = new Date().toISOString();
    const userId = uuidv4();

    // Create user record
    const user: UserRecord = {
      PK: `USER#${normalizedEmail}`,
      SK: 'PROFILE',
      id: userId,
      email: normalizedEmail,
      name: dto.name,
      passwordHash,
      hasPassword: true,
      isVerified: true,
      role: dto.role,
      invitedBy: invitedByEmail,
      tempPasswordExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      createdAt: now,
      updatedAt: now,
      GSI1PK: 'USER',
      GSI1SK: now,
    };

    await this.databaseService.put(user);

    // Get frontend URL for the login link
    const frontendUrl = this.configService.get('FRONTEND_URL', 'https://main.d25c4jn4vz213v.amplifyapp.com');
    const loginUrl = `${frontendUrl}/en/auth/login`;

    // Send invitation email
    await this.emailService.sendAdminInviteEmail(
      normalizedEmail,
      dto.name,
      dto.role,
      temporaryPassword,
      loginUrl,
    );

    this.logger.log(`Admin invitation sent to ${normalizedEmail} with role ${dto.role} by ${invitedByEmail}`);

    return {
      success: true,
      message: 'Invitation sent successfully',
      user: this.mapToResponse(user),
    };
  }

  /**
   * Get all users (for admin dashboard)
   */
  async getAllUsers(): Promise<AdminUserResponseDto[]> {
    const result = await this.databaseService.query<UserRecord>('USER', {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      expressionAttributeValues: {
        ':pk': 'USER',
      },
    });

    return result.items.map((user) => this.mapToResponse(user));
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<AdminUserResponseDto> {
    // First, we need to find the user by ID
    // Since our PK is email-based, we'll need to scan or use GSI
    const result = await this.databaseService.query<UserRecord>('USER', {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      filterExpression: 'id = :id',
      expressionAttributeValues: {
        ':pk': 'USER',
        ':id': userId,
      },
    });

    if (result.items.length === 0) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.mapToResponse(result.items[0]);
  }

  /**
   * Update user role
   */
  async updateUserRole(
    userId: string,
    dto: UpdateUserRoleDto,
    currentUserRole: string,
  ): Promise<AdminUserResponseDto> {
    // Only super admins can change roles
    if (currentUserRole !== 'super_admin') {
      throw new ForbiddenException('Only Super Admins can change user roles');
    }

    // Find the user
    const result = await this.databaseService.query<UserRecord>('USER', {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      filterExpression: 'id = :id',
      expressionAttributeValues: {
        ':pk': 'USER',
        ':id': userId,
      },
    });

    if (result.items.length === 0) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const user = result.items[0];

    // Prevent changing super_admin role
    if (user.role === 'super_admin') {
      throw new ForbiddenException('Cannot change the role of a Super Admin');
    }

    // Update the role
    await this.databaseService.update('USER', {
      key: { PK: user.PK, SK: user.SK },
      update: {
        role: dto.role,
        updatedAt: new Date().toISOString(),
      },
    });

    this.logger.log(`User ${user.email} role changed from ${user.role} to ${dto.role}`);

    return {
      ...this.mapToResponse(user),
      role: dto.role,
    };
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string, currentUserRole: string): Promise<void> {
    // Only super admins can delete users
    if (currentUserRole !== 'super_admin') {
      throw new ForbiddenException('Only Super Admins can delete users');
    }

    // Find the user
    const result = await this.databaseService.query<UserRecord>('USER', {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      filterExpression: 'id = :id',
      expressionAttributeValues: {
        ':pk': 'USER',
        ':id': userId,
      },
    });

    if (result.items.length === 0) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const user = result.items[0];

    // Prevent deleting super_admin
    if (user.role === 'super_admin') {
      throw new ForbiddenException('Cannot delete a Super Admin');
    }

    await this.databaseService.delete(user.PK, user.SK);

    this.logger.log(`User ${user.email} deleted`);
  }

  private mapToResponse(user: UserRecord): AdminUserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name || '',
      role: user.role as UserRole,
      hasPassword: user.hasPassword,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
