import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================
// Enums
// ============================================

export enum SubscriberStatus {
  ACTIVE = 'active',
  UNSUBSCRIBED = 'unsubscribed',
  BOUNCED = 'bounced',
}

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
}

// ============================================
// Subscriber DTOs
// ============================================

export class LocalizedStringDto {
  @IsString()
  en: string;

  @IsString()
  @IsOptional()
  hi?: string;
}

export class SubscribeNewsletterDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  source?: string; // 'website', 'event', 'donation', etc.
}

export class UpdateSubscriberDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(SubscriberStatus)
  @IsOptional()
  status?: SubscriberStatus;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class SubscriberResponseDto {
  id: string;
  email: string;
  name?: string;
  status: SubscriberStatus;
  source?: string;
  tags: string[];
  subscribedAt: string;
  unsubscribedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Campaign DTOs
// ============================================

export class CreateCampaignDto {
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  subject: LocalizedStringDto;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  content: LocalizedStringDto;

  @IsString()
  @IsOptional()
  previewText?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  targetTags?: string[]; // Send to subscribers with these tags

  @IsString()
  @IsOptional()
  scheduledAt?: string; // ISO date string for scheduled sends
}

export class UpdateCampaignDto {
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  @IsOptional()
  subject?: LocalizedStringDto;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  @IsOptional()
  content?: LocalizedStringDto;

  @IsString()
  @IsOptional()
  previewText?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  targetTags?: string[];

  @IsString()
  @IsOptional()
  scheduledAt?: string;

  @IsEnum(CampaignStatus)
  @IsOptional()
  status?: CampaignStatus;
}

export class CampaignResponseDto {
  id: string;
  subject: LocalizedStringDto;
  content: LocalizedStringDto;
  previewText?: string;
  targetTags: string[];
  status: CampaignStatus;
  scheduledAt?: string;
  sentAt?: string;
  stats: {
    totalRecipients: number;
    sent: number;
    failed: number;
    opened?: number;
    clicked?: number;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export class SendCampaignDto {
  @IsBoolean()
  @IsOptional()
  sendNow?: boolean; // Send immediately vs schedule

  @IsString()
  @IsOptional()
  locale?: 'en' | 'hi'; // Which version to send
}

// ============================================
// Analytics DTOs
// ============================================

export class NewsletterStatsDto {
  totalSubscribers: number;
  activeSubscribers: number;
  unsubscribed: number;
  thirtyDayGrowth: number;
  totalCampaignsSent: number;
}
