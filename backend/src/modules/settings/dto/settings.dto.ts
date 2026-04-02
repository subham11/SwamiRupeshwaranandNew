import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

// ============================================
// Settings DTOs
// ============================================

/**
 * Setting categories for grouping in the admin UI
 */
export enum SettingCategory {
  RAZORPAY = 'razorpay',
  SMTP = 'smtp',
  GENERAL = 'general',
}

/**
 * DTO for updating a single setting
 */
export class UpdateSettingDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  value: string;

  @IsString()
  @IsOptional()
  category?: SettingCategory;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isSecret?: boolean;
}

/**
 * DTO for bulk-updating settings (e.g., entire Razorpay config at once)
 */
export class BulkUpdateSettingsDto {
  @IsString()
  @IsNotEmpty()
  category: SettingCategory;

  settings: Array<{
    key: string;
    value: string;
    description?: string;
    isSecret?: boolean;
  }>;
}

/**
 * DTO for testing Razorpay connection
 */
export class TestRazorpayConnectionDto {
  @IsString()
  @IsNotEmpty()
  keyId: string;

  @IsString()
  @IsNotEmpty()
  keySecret: string;
}

/**
 * Response DTO for a setting (masks secret values)
 */
export class SettingResponseDto {
  key: string;
  value: string;
  category: string;
  description?: string;
  isSecret: boolean;
  updatedAt: string;
  updatedBy?: string;
}
