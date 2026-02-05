import { IsString, IsEmail, IsOptional, IsBoolean, IsArray, IsEnum, IsNumber, Min, Max, ValidateNested, IsPhoneNumber } from 'class-validator';
import { Type } from 'class-transformer';

// ============================================
// Enums
// ============================================

export enum DonationStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum DonationType {
  ONE_TIME = 'one_time',
  RECURRING = 'recurring',
}

export enum DonationPurpose {
  GENERAL = 'general',
  TEMPLE = 'temple',
  ANNADAAN = 'annadaan',
  GOSHALA = 'goshala',
  EDUCATION = 'education',
  MEDICAL = 'medical',
  FESTIVAL = 'festival',
  OTHER = 'other',
}

export enum PaymentMethod {
  UPI = 'upi',
  CARD = 'card',
  NET_BANKING = 'net_banking',
  WALLET = 'wallet',
  RAZORPAY = 'razorpay',
  CASH = 'cash',
  CHEQUE = 'cheque',
  BANK_TRANSFER = 'bank_transfer',
}

// ============================================
// Donation Amount Config DTOs
// ============================================

export class LocalizedStringDto {
  @IsString()
  en: string;

  @IsString()
  @IsOptional()
  hi?: string;
}

export class DonationAmountOptionDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  @IsOptional()
  label?: LocalizedStringDto; // e.g., "Feed 10 people"

  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;
}

export class CreateDonationConfigDto {
  @IsEnum(DonationPurpose)
  purpose: DonationPurpose;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  title: LocalizedStringDto;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  @IsOptional()
  description?: LocalizedStringDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DonationAmountOptionDto)
  suggestedAmounts: DonationAmountOptionDto[];

  @IsNumber()
  @Min(1)
  @IsOptional()
  minimumAmount?: number;

  @IsNumber()
  @IsOptional()
  maximumAmount?: number;

  @IsBoolean()
  @IsOptional()
  allowCustomAmount?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @IsString()
  @IsOptional()
  iconUrl?: string;
}

export class UpdateDonationConfigDto {
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  @IsOptional()
  title?: LocalizedStringDto;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  @IsOptional()
  description?: LocalizedStringDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DonationAmountOptionDto)
  @IsOptional()
  suggestedAmounts?: DonationAmountOptionDto[];

  @IsNumber()
  @Min(1)
  @IsOptional()
  minimumAmount?: number;

  @IsNumber()
  @IsOptional()
  maximumAmount?: number;

  @IsBoolean()
  @IsOptional()
  allowCustomAmount?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @IsString()
  @IsOptional()
  iconUrl?: string;
}

export class DonationConfigResponseDto {
  id: string;
  purpose: DonationPurpose;
  title: LocalizedStringDto;
  description?: LocalizedStringDto;
  suggestedAmounts: DonationAmountOptionDto[];
  minimumAmount: number;
  maximumAmount?: number;
  allowCustomAmount: boolean;
  isActive: boolean;
  displayOrder: number;
  iconUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Donation DTOs
// ============================================

export class CreateDonationDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsEnum(DonationPurpose)
  purpose: DonationPurpose;

  @IsEnum(DonationType)
  @IsOptional()
  donationType?: DonationType;

  @IsString()
  @IsOptional()
  donorName?: string;

  @IsEmail()
  @IsOptional()
  donorEmail?: string;

  @IsString()
  @IsOptional()
  donorPhone?: string;

  @IsString()
  @IsOptional()
  panNumber?: string; // For 80G certificate

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  message?: string; // Special instructions or dedication

  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;

  @IsBoolean()
  @IsOptional()
  wants80GCertificate?: boolean;
}

export class UpdateDonationDto {
  @IsEnum(DonationStatus)
  @IsOptional()
  status?: DonationStatus;

  @IsString()
  @IsOptional()
  razorpayPaymentId?: string;

  @IsString()
  @IsOptional()
  razorpayOrderId?: string;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsOptional()
  adminNotes?: string;

  @IsBoolean()
  @IsOptional()
  receiptSent?: boolean;

  @IsString()
  @IsOptional()
  receiptUrl?: string;
}

export class DonationResponseDto {
  id: string;
  donationNumber: string; // e.g., "DON-2026-0001"
  amount: number;
  purpose: DonationPurpose;
  donationType: DonationType;
  status: DonationStatus;
  paymentMethod?: PaymentMethod;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  panNumber?: string;
  address?: string;
  message?: string;
  isAnonymous: boolean;
  wants80GCertificate: boolean;
  receiptSent: boolean;
  receiptUrl?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  transactionId?: string;
  userId?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Razorpay DTOs
// ============================================

export class CreateRazorpayOrderDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsEnum(DonationPurpose)
  purpose: DonationPurpose;

  @IsString()
  @IsOptional()
  donorName?: string;

  @IsEmail()
  @IsOptional()
  donorEmail?: string;

  @IsString()
  @IsOptional()
  donorPhone?: string;
}

export class VerifyPaymentDto {
  @IsString()
  razorpayOrderId: string;

  @IsString()
  razorpayPaymentId: string;

  @IsString()
  razorpaySignature: string;

  @IsString()
  donationId: string;
}

export class RazorpayOrderResponseDto {
  orderId: string;
  donationId: string;
  amount: number;
  currency: string;
  keyId: string;
}

// ============================================
// Analytics DTOs
// ============================================

export class DonationStatsDto {
  totalDonations: number;
  totalAmount: number;
  thisMonthAmount: number;
  lastMonthAmount: number;
  averageDonation: number;
  topPurpose: DonationPurpose;
  donorCount: number;
  recurringDonors: number;
}
