import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { UserRole } from '@/modules/users/dto';

// ============================================
// Admin Invitation DTOs
// ============================================

export class InviteUserDto {
  @ApiProperty({ example: 'admin@example.com', description: 'Email of the user to invite' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe', description: 'Name of the user' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ 
    enum: [UserRole.ADMIN, UserRole.CONTENT_EDITOR], 
    description: 'Role to assign to the invited user' 
  })
  @IsEnum(UserRole)
  role: UserRole.ADMIN | UserRole.CONTENT_EDITOR;
}

export class UpdateUserRoleDto {
  @ApiProperty({ 
    enum: UserRole, 
    description: 'New role to assign to the user' 
  })
  @IsEnum(UserRole)
  role: UserRole;
}

export class AdminUserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User name' })
  name: string;

  @ApiProperty({ enum: UserRole, description: 'User role' })
  role: UserRole;

  @ApiProperty({ description: 'Whether user has set a password' })
  hasPassword: boolean;

  @ApiProperty({ description: 'Whether user is verified' })
  isVerified: boolean;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last login timestamp' })
  lastLoginAt?: string;
}

export class InviteResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Invitation sent successfully' })
  message: string;

  @ApiProperty({ description: 'Created user data' })
  user: AdminUserResponseDto;
}
