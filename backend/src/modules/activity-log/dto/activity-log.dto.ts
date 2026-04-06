import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject, IsNumber, Min } from 'class-validator';

// ============================================
// Entity Types
// ============================================

export enum ActivityEntityType {
  PRODUCT = 'product',
  ORDER = 'order',
  USER = 'user',
  CMS = 'cms',
  COUPON = 'coupon',
  SETTING = 'setting',
  EVENT = 'event',
  SUBSCRIPTION = 'subscription',
  NEWSLETTER = 'newsletter',
  DONATION = 'donation',
  SUPPORT = 'support',
}

// ============================================
// Internal DTO (used by other services)
// ============================================

export class LogActivityDto {
  @IsString()
  userId!: string;

  @IsString()
  userEmail!: string;

  @IsString()
  action!: string;

  @IsEnum(ActivityEntityType)
  entityType!: ActivityEntityType;

  @IsString()
  entityId!: string;

  @IsString()
  details!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  ipAddress?: string;
}

// ============================================
// Query DTOs
// ============================================

export class ActivityLogQueryDto {
  @ApiPropertyOptional({ description: 'Maximum number of items to return', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: 'Pagination cursor (base64-encoded last key)' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Filter by entity type', enum: ActivityEntityType })
  @IsOptional()
  @IsEnum(ActivityEntityType)
  entityType?: ActivityEntityType;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;
}

// ============================================
// Response DTOs
// ============================================

export class ActivityLogResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() userEmail!: string;
  @ApiProperty() action!: string;
  @ApiProperty({ enum: ActivityEntityType }) entityType!: ActivityEntityType;
  @ApiProperty() entityId!: string;
  @ApiProperty() details!: string;
  @ApiPropertyOptional() metadata?: Record<string, any>;
  @ApiPropertyOptional() ipAddress?: string;
  @ApiProperty() createdAt!: string;
}

export class ActivityLogListResponseDto {
  @ApiProperty({ type: [ActivityLogResponseDto] })
  items!: ActivityLogResponseDto[];

  @ApiPropertyOptional({ description: 'Cursor for next page' })
  cursor?: string;

  @ApiProperty() total!: number;
}

export class ActivityLogStatsDto {
  @ApiProperty() total!: number;
  @ApiProperty({ description: 'Count by entity type' }) byEntityType!: Record<string, number>;
  @ApiProperty({ description: 'Count by action' }) byAction!: Record<string, number>;
  @ApiProperty({ description: 'Number of unique active users today' }) activeUsersToday!: number;
}
