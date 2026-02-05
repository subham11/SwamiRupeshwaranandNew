import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================
// Subscription Plan Types
// ============================================
export enum SubscriptionPlanType {
  FREE = 'free',
  BASIC = 'basic', // ₹300
  STANDARD = 'standard', // ₹1100
  PREMIUM = 'premium', // ₹2100
  ELITE = 'elite', // ₹5100
  DIVINE = 'divine', // ₹21000
}

export enum BillingCycle {
  ONE_TIME = 'one_time',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  HALF_YEARLY = 'half_yearly',
  YEARLY = 'yearly',
}

export enum PaymentMethod {
  UPI_AUTOPAY = 'upi_autopay',
  MANUAL = 'manual',
  RAZORPAY = 'razorpay',
  FREE = 'free',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  PAYMENT_PENDING = 'payment_pending',
  PAYMENT_FAILED = 'payment_failed',
}

export enum ContentType {
  STOTRA = 'stotra',
  KAVACH = 'kavach',
  PDF = 'pdf',
  VIDEO = 'video',
  IMAGE = 'image',
  GUIDANCE = 'guidance',
}

// ============================================
// Subscription Plan Content DTO
// ============================================
export class PlanContentDto {
  @ApiProperty({ enum: ContentType, description: 'Type of content' })
  @IsEnum(ContentType)
  type!: ContentType;

  @ApiProperty({ description: 'Number of items included' })
  @IsNumber()
  @Min(0)
  count!: number;

  @ApiPropertyOptional({ description: 'Specific items (IDs or names)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  items?: string[];

  @ApiPropertyOptional({ description: 'Additional description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class GuidanceDetailsDto {
  @ApiProperty({ description: 'Number of guidance sessions per month' })
  @IsNumber()
  @Min(0)
  sessionsPerMonth!: number;

  @ApiPropertyOptional({ description: 'Is guidance from Swami Ji directly?' })
  @IsOptional()
  @IsBoolean()
  fromSwamiJi?: boolean;

  @ApiPropertyOptional({ description: 'Type of guidance (online/in-person)' })
  @IsOptional()
  @IsString()
  guidanceType?: string;

  @ApiPropertyOptional({ description: 'Additional notes about guidance' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ============================================
// Subscription Plan DTOs
// ============================================
export class CreateSubscriptionPlanDto {
  @ApiProperty({ enum: SubscriptionPlanType, description: 'Plan type identifier' })
  @IsEnum(SubscriptionPlanType)
  planType!: SubscriptionPlanType;

  @ApiProperty({ example: 'Basic Plan', description: 'Plan display name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Plan description' })
  @IsString()
  description!: string;

  @ApiProperty({ example: 300, description: 'Price in INR' })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ enum: BillingCycle, description: 'Billing cycle' })
  @IsEnum(BillingCycle)
  billingCycle!: BillingCycle;

  @ApiProperty({ enum: PaymentMethod, description: 'Allowed payment method' })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiPropertyOptional({ description: 'Whether UPI autopay is enabled' })
  @IsOptional()
  @IsBoolean()
  autopayEnabled?: boolean;

  @ApiProperty({ type: [PlanContentDto], description: 'Content included in plan' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanContentDto)
  contents!: PlanContentDto[];

  @ApiPropertyOptional({ type: GuidanceDetailsDto, description: 'Guidance details' })
  @IsOptional()
  @ValidateNested()
  @Type(() => GuidanceDetailsDto)
  guidance?: GuidanceDetailsDto;

  @ApiPropertyOptional({ description: 'Special features or notes' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ description: 'Whether plan is currently active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Display order in UI' })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class UpdateSubscriptionPlanDto extends PartialType(CreateSubscriptionPlanDto) {}

export class SubscriptionPlanResponseDto {
  @ApiProperty({ description: 'Plan ID' })
  id!: string;

  @ApiProperty({ enum: SubscriptionPlanType })
  planType!: SubscriptionPlanType;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  price!: number;

  @ApiProperty({ enum: BillingCycle })
  billingCycle!: BillingCycle;

  @ApiProperty({ enum: PaymentMethod })
  paymentMethod!: PaymentMethod;

  @ApiProperty()
  autopayEnabled!: boolean;

  @ApiProperty({ type: [PlanContentDto] })
  contents!: PlanContentDto[];

  @ApiPropertyOptional({ type: GuidanceDetailsDto })
  guidance?: GuidanceDetailsDto;

  @ApiProperty({ type: [String] })
  features!: string[];

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

// ============================================
// User Subscription DTOs
// ============================================
export class CreateUserSubscriptionDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId!: string;

  @ApiProperty({ description: 'Subscription Plan ID' })
  @IsString()
  planId!: string;

  @ApiPropertyOptional({ enum: PaymentMethod, description: 'Payment method used' })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Razorpay subscription/order ID' })
  @IsOptional()
  @IsString()
  razorpaySubscriptionId?: string;

  @ApiPropertyOptional({ description: 'Razorpay payment ID' })
  @IsOptional()
  @IsString()
  razorpayPaymentId?: string;
}

export class UpdateUserSubscriptionDto {
  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ description: 'Razorpay subscription ID' })
  @IsOptional()
  @IsString()
  razorpaySubscriptionId?: string;

  @ApiPropertyOptional({ description: 'Razorpay payment ID' })
  @IsOptional()
  @IsString()
  razorpayPaymentId?: string;

  @ApiPropertyOptional({ description: 'Admin notes' })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}

export class UserSubscriptionResponseDto {
  @ApiProperty({ description: 'Subscription ID' })
  id!: string;

  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({ description: 'User email' })
  userEmail!: string;

  @ApiProperty({ description: 'Plan ID' })
  planId!: string;

  @ApiProperty({ description: 'Plan name' })
  planName!: string;

  @ApiProperty({ enum: SubscriptionPlanType })
  planType!: SubscriptionPlanType;

  @ApiProperty({ description: 'Price paid' })
  pricePaid!: number;

  @ApiProperty({ enum: SubscriptionStatus })
  status!: SubscriptionStatus;

  @ApiProperty({ enum: PaymentMethod })
  paymentMethod!: PaymentMethod;

  @ApiPropertyOptional()
  razorpaySubscriptionId?: string;

  @ApiPropertyOptional()
  razorpayPaymentId?: string;

  @ApiProperty({ description: 'Subscription start date' })
  startDate!: string;

  @ApiProperty({ description: 'Subscription end date' })
  endDate!: string;

  @ApiPropertyOptional({ description: 'Next billing date for autopay' })
  nextBillingDate?: string;

  @ApiPropertyOptional({ description: 'Admin notes' })
  adminNotes?: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class UserSubscriptionListResponseDto {
  @ApiProperty({ type: [UserSubscriptionResponseDto] })
  items!: UserSubscriptionResponseDto[];

  @ApiProperty()
  count!: number;

  @ApiPropertyOptional()
  nextToken?: string;
}

export class SubscriptionPlanListResponseDto {
  @ApiProperty({ type: [SubscriptionPlanResponseDto] })
  items!: SubscriptionPlanResponseDto[];

  @ApiProperty()
  count!: number;
}

// ============================================
// Subscription Content DTOs
// ============================================
export class CreateSubscriptionContentDto {
  @ApiProperty({ description: 'Plan ID this content belongs to' })
  @IsString()
  planId!: string;

  @ApiProperty({ enum: ContentType, description: 'Type of content' })
  @IsEnum(ContentType)
  contentType!: ContentType;

  @ApiProperty({ description: 'Content title' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Content description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'File URL (S3)' })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'Duration in seconds (for video/audio)' })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({ description: 'Display order' })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Locale for the content' })
  @IsOptional()
  @IsString()
  locale?: string;
}

export class UpdateSubscriptionContentDto extends PartialType(CreateSubscriptionContentDto) {}

export class SubscriptionContentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  planId!: string;

  @ApiProperty({ enum: ContentType })
  contentType!: ContentType;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  fileUrl?: string;

  @ApiPropertyOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  duration?: number;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty()
  locale!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class SubscriptionContentListResponseDto {
  @ApiProperty({ type: [SubscriptionContentResponseDto] })
  items!: SubscriptionContentResponseDto[];

  @ApiProperty()
  count!: number;
}

// ============================================
// Payment Related DTOs
// ============================================
export class InitiatePaymentDto {
  @ApiProperty({ description: 'Plan ID to subscribe to' })
  @IsString()
  planId!: string;

  @ApiProperty({ enum: PaymentMethod, description: 'Preferred payment method' })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;
}

export class PaymentResponseDto {
  @ApiProperty({ description: 'Razorpay order/subscription ID' })
  razorpayOrderId?: string;

  @ApiProperty({ description: 'Razorpay subscription ID (for autopay)' })
  razorpaySubscriptionId?: string;

  @ApiProperty({ description: 'Amount in paise' })
  amount!: number;

  @ApiProperty({ description: 'Currency' })
  currency!: string;

  @ApiProperty({ description: 'Razorpay key ID' })
  razorpayKeyId!: string;

  @ApiPropertyOptional({ description: 'Notes or additional info' })
  notes?: Record<string, string>;
}

export class VerifyPaymentDto {
  @ApiProperty({ description: 'Razorpay order ID' })
  @IsString()
  razorpayOrderId!: string;

  @ApiProperty({ description: 'Razorpay payment ID' })
  @IsString()
  razorpayPaymentId!: string;

  @ApiProperty({ description: 'Razorpay signature' })
  @IsString()
  razorpaySignature!: string;

  @ApiProperty({ description: 'Plan ID' })
  @IsString()
  planId!: string;
}

export class PaymentFailureDto {
  @ApiProperty({ description: 'User subscription ID' })
  @IsString()
  subscriptionId!: string;

  @ApiProperty({ description: 'Failure reason' })
  @IsString()
  reason!: string;

  @ApiPropertyOptional({ description: 'Razorpay error code' })
  @IsOptional()
  @IsString()
  errorCode?: string;

  @ApiPropertyOptional({ description: 'Additional error details' })
  @IsOptional()
  @IsString()
  errorDetails?: string;
}

export class PaymentFailureResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  subscriptionId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  userEmail!: string;

  @ApiProperty()
  planName!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  reason!: string;

  @ApiPropertyOptional()
  errorCode?: string;

  @ApiPropertyOptional()
  errorDetails?: string;

  @ApiProperty()
  status!: string; // pending, resolved, refunded

  @ApiPropertyOptional()
  resolvedAt?: string;

  @ApiPropertyOptional()
  resolvedBy?: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class PaymentFailureListResponseDto {
  @ApiProperty({ type: [PaymentFailureResponseDto] })
  items!: PaymentFailureResponseDto[];

  @ApiProperty()
  count!: number;
}
