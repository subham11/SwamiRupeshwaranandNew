import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  Min,
  IsDateString,
} from 'class-validator';

// ============================================
// Coupon Enums
// ============================================

export enum CouponType {
  PERCENTAGE = 'percentage',
  FLAT = 'flat',
}

// ============================================
// Create / Update DTOs
// ============================================

export class CreateCouponDto {
  @ApiProperty({ description: 'Coupon code (will be uppercased)', example: 'SAVE20' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Discount type', enum: CouponType, example: CouponType.PERCENTAGE })
  @IsEnum(CouponType)
  type: CouponType;

  @ApiProperty({ description: 'Discount value (percentage or flat amount)', example: 20 })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ description: 'Minimum order amount required', example: 500 })
  @IsNumber()
  @Min(0)
  minOrderAmount: number;

  @ApiPropertyOptional({
    description: 'Maximum discount amount (for percentage type)',
    example: 200,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @ApiProperty({ description: 'Expiration date (ISO 8601)', example: '2026-12-31T23:59:59.000Z' })
  @IsDateString()
  expiresAt: string;

  @ApiPropertyOptional({ description: 'Whether coupon is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum number of total uses (0 = unlimited)',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  usageLimit?: number;

  @ApiPropertyOptional({ description: 'Applicable product category IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableCategories?: string[];
}

export class UpdateCouponDto {
  @ApiPropertyOptional({ description: 'Coupon code (will be uppercased)' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Discount type', enum: CouponType })
  @IsOptional()
  @IsEnum(CouponType)
  type?: CouponType;

  @ApiPropertyOptional({ description: 'Discount value' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiPropertyOptional({ description: 'Minimum order amount required' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum discount amount (for percentage type)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @ApiPropertyOptional({ description: 'Expiration date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Whether coupon is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Maximum number of total uses (0 = unlimited)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  usageLimit?: number;

  @ApiPropertyOptional({ description: 'Applicable product category IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableCategories?: string[];
}

// ============================================
// Validate / Apply DTOs
// ============================================

export class ValidateCouponDto {
  @ApiProperty({ description: 'Coupon code to validate', example: 'SAVE20' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Current cart total in INR', example: 1500 })
  @IsNumber()
  @Min(0)
  cartTotal: number;
}

export class ValidateCouponResponseDto {
  @ApiProperty({ description: 'Whether the coupon is valid' })
  valid: boolean;

  @ApiPropertyOptional({ description: 'Discount amount if valid' })
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Coupon code' })
  code?: string;

  @ApiPropertyOptional({ description: 'Coupon type' })
  type?: CouponType;

  @ApiPropertyOptional({ description: 'Coupon value' })
  value?: number;

  @ApiPropertyOptional({ description: 'Error message if not valid' })
  message?: string;
}

export class ApplyCouponDto {
  @ApiProperty({ description: 'Coupon code to apply', example: 'SAVE20' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Order ID to associate with coupon usage' })
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'Cart total in INR', example: 1500 })
  @IsNumber()
  @Min(0)
  cartTotal: number;
}

// ============================================
// Response DTOs
// ============================================

export class CouponResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() code: string;
  @ApiProperty({ enum: CouponType }) type: CouponType;
  @ApiProperty() value: number;
  @ApiProperty() minOrderAmount: number;
  @ApiPropertyOptional() maxDiscount?: number;
  @ApiProperty() expiresAt: string;
  @ApiProperty() isActive: boolean;
  @ApiProperty() usageLimit: number;
  @ApiProperty() usageCount: number;
  @ApiPropertyOptional({ type: [String] }) applicableCategories?: string[];
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}

export class CouponUsageRecordDto {
  @ApiProperty() userId: string;
  @ApiProperty() orderId: string;
  @ApiProperty() discountAmount: number;
  @ApiProperty() usedAt: string;
}

export class CouponStatsDto {
  @ApiProperty() couponId: string;
  @ApiProperty() code: string;
  @ApiProperty() totalUses: number;
  @ApiProperty() usageLimit: number;
  @ApiProperty() totalDiscountGiven: number;
  @ApiProperty({ type: [CouponUsageRecordDto] }) recentUsage: CouponUsageRecordDto[];
}
