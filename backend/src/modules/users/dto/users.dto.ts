import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';

// ============================================
// User Roles Hierarchy (highest to lowest)
// ============================================
export enum UserRole {
  SUPER_ADMIN = 'super_admin',   // Full system access, can manage all admins
  ADMIN = 'admin',               // Can manage content editors and users
  CONTENT_EDITOR = 'content_editor', // Can manage content (teachings, events)
  USER = 'user',                 // Regular authenticated user
}

// Role hierarchy for permission checks
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 100,
  [UserRole.ADMIN]: 75,
  [UserRole.CONTENT_EDITOR]: 50,
  [UserRole.USER]: 10,
};

// Permissions matrix
export const PERMISSIONS = {
  // User Management
  'users:read': [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  'users:create': [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  'users:update': [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  'users:delete': [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  'users:manage-roles': [UserRole.SUPER_ADMIN],
  
  // Admin Management
  'admins:read': [UserRole.SUPER_ADMIN],
  'admins:create': [UserRole.SUPER_ADMIN],
  'admins:update': [UserRole.SUPER_ADMIN],
  'admins:delete': [UserRole.SUPER_ADMIN],
  
  // Content Management
  'content:read': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_EDITOR, UserRole.USER],
  'content:create': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_EDITOR],
  'content:update': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_EDITOR],
  'content:delete': [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_EDITOR],
  'content:publish': [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  
  // System Settings
  'settings:read': [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  'settings:update': [UserRole.SUPER_ADMIN],
} as const;

export type Permission = keyof typeof PERMISSIONS;

// Helper function to check if a role has a permission
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission] as readonly UserRole[];
  return allowedRoles?.includes(role) ?? false;
}

// Helper function to check if a role is at least a certain level
export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export enum UserStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe', description: 'User name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.USER })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe', description: 'User name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User name' })
  name: string;

  @ApiProperty({ description: 'User role' })
  role: string;

  @ApiProperty({ description: 'User status' })
  status: string;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: string;
}
