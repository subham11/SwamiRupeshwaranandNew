import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';

// ============================================
// Payment DTOs
// ============================================

export enum PaymentType {
  SUBSCRIPTION = 'subscription',
  DONATION = 'donation',
  YAGYA = 'yagya',
}

export enum YagyaCategory {
  SPONSOR = 'sponsor',
  YAJAMAN = 'yajaman',
  SHIVIRARTHI = 'shivirarthi',
}

/**
 * Initiate a payment for a subscription plan.
 * For autopay plans (<=2100): Creates a Razorpay Subscription
 * For manual plans (5100/21000): Creates a Razorpay Order (one-time)
 */
export class InitiateSubscriptionPaymentDto {
  @ApiProperty({ description: 'Subscription plan ID to subscribe to' })
  @IsString()
  planId!: string;
}

/**
 * Verify a one-time payment (Razorpay Order flow)
 */
export class VerifyOrderPaymentDto {
  @ApiProperty({ description: 'Razorpay order ID returned from initiate' })
  @IsString()
  razorpayOrderId!: string;

  @ApiProperty({ description: 'Razorpay payment ID from checkout callback' })
  @IsString()
  razorpayPaymentId!: string;

  @ApiProperty({ description: 'Razorpay signature from checkout callback' })
  @IsString()
  razorpaySignature!: string;

  @ApiProperty({ description: 'Internal subscription ID' })
  @IsString()
  subscriptionId!: string;
}

/**
 * Verify an autopay subscription authentication
 */
export class VerifySubscriptionPaymentDto {
  @ApiProperty({ description: 'Razorpay subscription ID' })
  @IsString()
  razorpaySubscriptionId!: string;

  @ApiProperty({ description: 'Razorpay payment ID from first charge' })
  @IsString()
  razorpayPaymentId!: string;

  @ApiProperty({ description: 'Razorpay signature' })
  @IsString()
  razorpaySignature!: string;

  @ApiProperty({ description: 'Internal subscription ID' })
  @IsString()
  subscriptionId!: string;
}

/**
 * Initiate a donation payment
 */
export class InitiateDonationPaymentDto {
  @ApiProperty({ description: 'Amount in INR' })
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({ description: 'Donation purpose' })
  @IsString()
  purpose!: string;

  @ApiPropertyOptional({ description: 'Donor name' })
  @IsOptional()
  @IsString()
  donorName?: string;

  @ApiPropertyOptional({ description: 'Donor email' })
  @IsOptional()
  @IsString()
  donorEmail?: string;

  @ApiPropertyOptional({ description: 'Donor phone' })
  @IsOptional()
  @IsString()
  donorPhone?: string;
}

/**
 * Verify a donation payment
 */
export class VerifyDonationPaymentDto {
  @ApiProperty({ description: 'Razorpay order ID' })
  @IsString()
  razorpayOrderId!: string;

  @ApiProperty({ description: 'Razorpay payment ID' })
  @IsString()
  razorpayPaymentId!: string;

  @ApiProperty({ description: 'Razorpay signature' })
  @IsString()
  razorpaySignature!: string;

  @ApiProperty({ description: 'Internal donation ID' })
  @IsString()
  donationId!: string;
}

/**
 * Initiate a Yagya payment (Sponsor/Yajaman/Shivirarthi)
 * Routes to different Razorpay accounts based on category.
 */
export class InitiateYagyaPaymentDto {
  @ApiProperty({ description: 'Amount in INR' })
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({ enum: YagyaCategory, description: 'Participation category' })
  @IsEnum(YagyaCategory)
  category!: YagyaCategory;

  @ApiProperty({ description: 'Selected tier ID (e.g., title-partner, vishisht-yajaman)' })
  @IsString()
  tierId!: string;

  @ApiProperty({ description: 'Participant name' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Company/Organization name' })
  @IsOptional()
  @IsString()
  company?: string;
}

/**
 * Verify a Yagya payment
 */
export class VerifyYagyaPaymentDto {
  @ApiProperty({ description: 'Razorpay order ID' })
  @IsString()
  razorpayOrderId!: string;

  @ApiProperty({ description: 'Razorpay payment ID' })
  @IsString()
  razorpayPaymentId!: string;

  @ApiProperty({ description: 'Razorpay signature' })
  @IsString()
  razorpaySignature!: string;

  @ApiProperty({ description: 'Internal yagya booking ID' })
  @IsString()
  bookingId!: string;

  @ApiProperty({ enum: YagyaCategory, description: 'Category (needed for key selection)' })
  @IsEnum(YagyaCategory)
  category!: YagyaCategory;
}

/**
 * Yagya payment response
 */
export class YagyaPaymentResponseDto {
  @ApiProperty({ description: 'Internal booking ID' })
  bookingId!: string;

  @ApiProperty({ description: 'Razorpay order ID' })
  razorpayOrderId!: string;

  @ApiProperty({ description: 'Amount in paise' })
  amount!: number;

  @ApiProperty({ description: 'Currency' })
  currency!: string;

  @ApiProperty({ description: 'Razorpay publishable key ID (account-specific)' })
  razorpayKeyId!: string;

  @ApiPropertyOptional({ description: 'Notes' })
  notes?: Record<string, string>;
}

// ============================================
// Response DTOs
// ============================================

export class SubscriptionPaymentResponseDto {
  @ApiProperty({ description: 'Internal subscription ID' })
  subscriptionId!: string;

  @ApiPropertyOptional({ description: 'Razorpay order ID (for one-time payments)' })
  razorpayOrderId?: string;

  @ApiPropertyOptional({ description: 'Razorpay subscription ID (for autopay)' })
  razorpaySubscriptionId?: string;

  @ApiProperty({ description: 'Amount in paise' })
  amount!: number;

  @ApiProperty({ description: 'Currency' })
  currency!: string;

  @ApiProperty({ description: 'Razorpay publishable key ID' })
  razorpayKeyId!: string;

  @ApiProperty({ description: 'Plan name for display' })
  planName!: string;

  @ApiProperty({ description: 'Plan description' })
  planDescription!: string;

  @ApiProperty({ description: 'Whether this is autopay or one-time' })
  isAutopay!: boolean;

  @ApiPropertyOptional({ description: 'Additional notes/metadata' })
  notes?: Record<string, string>;
}

export class DonationPaymentResponseDto {
  @ApiProperty({ description: 'Internal donation ID' })
  donationId!: string;

  @ApiProperty({ description: 'Razorpay order ID' })
  razorpayOrderId!: string;

  @ApiProperty({ description: 'Amount in paise' })
  amount!: number;

  @ApiProperty({ description: 'Currency' })
  currency!: string;

  @ApiProperty({ description: 'Razorpay publishable key ID' })
  razorpayKeyId!: string;

  @ApiPropertyOptional({ description: 'Notes' })
  notes?: Record<string, string>;
}

export class PaymentVerificationResponseDto {
  @ApiProperty({ description: 'Whether verification was successful' })
  success!: boolean;

  @ApiProperty({ description: 'Message' })
  message!: string;

  @ApiPropertyOptional({ description: 'Related entity ID (subscription or donation)' })
  entityId?: string;

  @ApiPropertyOptional({ description: 'Payment status' })
  status?: string;
}
