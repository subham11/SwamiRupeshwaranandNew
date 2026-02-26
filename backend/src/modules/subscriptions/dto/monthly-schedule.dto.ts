import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContentType } from './subscriptions.dto';

// ============================================
// Monthly Schedule Content Item
// ============================================
export class ScheduleContentItemDto {
  @ApiProperty({ description: 'Content ID reference' })
  @IsString()
  contentId!: string;

  @ApiPropertyOptional({ description: 'Display order within the month' })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

// ============================================
// Create / Update Monthly Schedule
// ============================================
export class CreateMonthlyScheduleDto {
  @ApiProperty({ description: 'Plan ID this schedule belongs to' })
  @IsString()
  planId!: string;

  @ApiProperty({ description: 'Year (e.g. 2026)', example: 2026 })
  @IsNumber()
  @Min(2024)
  @Max(2100)
  year!: number;

  @ApiProperty({ description: 'Month (1-12)', example: 1 })
  @IsNumber()
  @Min(1)
  @Max(12)
  month!: number;

  @ApiPropertyOptional({ description: 'Schedule title (e.g. "January Collection")', example: 'January 2026 Collection' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Schedule title in Hindi' })
  @IsOptional()
  @IsString()
  titleHi?: string;

  @ApiPropertyOptional({ description: 'Description of this month\'s content' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Description in Hindi' })
  @IsOptional()
  @IsString()
  descriptionHi?: string;

  @ApiProperty({ description: 'Content items assigned to this month', type: [ScheduleContentItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleContentItemDto)
  contentItems!: ScheduleContentItemDto[];

  @ApiPropertyOptional({ description: 'Whether this schedule is published', default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateMonthlyScheduleDto extends PartialType(CreateMonthlyScheduleDto) {}

// ============================================
// Monthly Schedule Response
// ============================================
export class MonthlyScheduleContentItemResponseDto {
  @ApiProperty({ description: 'Content ID' })
  contentId!: string;

  @ApiProperty({ description: 'Content title' })
  title!: string;

  @ApiPropertyOptional({ description: 'Content title in Hindi' })
  titleHi?: string;

  @ApiProperty({ description: 'Content type (stotra, kavach, etc.)' })
  contentType!: ContentType;

  @ApiPropertyOptional({ description: 'File URL' })
  fileUrl?: string;

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  thumbnailUrl?: string;

  @ApiProperty({ description: 'Display order' })
  displayOrder!: number;
}

export class MonthlyScheduleResponseDto {
  @ApiProperty({ description: 'Schedule ID' })
  id!: string;

  @ApiProperty({ description: 'Plan ID' })
  planId!: string;

  @ApiProperty({ description: 'Plan name' })
  planName!: string;

  @ApiProperty({ description: 'Year' })
  year!: number;

  @ApiProperty({ description: 'Month (1-12)' })
  month!: number;

  @ApiPropertyOptional({ description: 'Month name (e.g. "January")' })
  monthName?: string;

  @ApiPropertyOptional({ description: 'Title' })
  title?: string;

  @ApiPropertyOptional({ description: 'Title in Hindi' })
  titleHi?: string;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Description in Hindi' })
  descriptionHi?: string;

  @ApiProperty({ description: 'Content items in this schedule', type: [MonthlyScheduleContentItemResponseDto] })
  contentItems!: MonthlyScheduleContentItemResponseDto[];

  @ApiProperty({ description: 'Total content items count' })
  contentCount!: number;

  @ApiProperty({ description: 'Whether this schedule is published' })
  isPublished!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class MonthlyScheduleListResponseDto {
  @ApiProperty({ type: [MonthlyScheduleResponseDto] })
  items!: MonthlyScheduleResponseDto[];

  @ApiProperty()
  count!: number;
}

// ============================================
// User Monthly Content Access
// ============================================
export class UserMonthlyContentResponseDto {
  @ApiProperty({ description: 'Year' })
  year!: number;

  @ApiProperty({ description: 'Month (1-12)' })
  month!: number;

  @ApiProperty({ description: 'Month name' })
  monthName!: string;

  @ApiPropertyOptional({ description: 'Schedule title' })
  title?: string;

  @ApiPropertyOptional({ description: 'Schedule description' })
  description?: string;

  @ApiProperty({ description: 'Content items available this month', type: [MonthlyScheduleContentItemResponseDto] })
  contentItems!: MonthlyScheduleContentItemResponseDto[];

  @ApiProperty({ description: 'Total items' })
  contentCount!: number;

  @ApiProperty({ description: 'Whether content is accessible (subscription active)' })
  isAccessible!: boolean;
}

export class UserMonthlyOverviewResponseDto {
  @ApiProperty({ description: 'Subscription plan name' })
  planName!: string;

  @ApiProperty({ description: 'Plan ID' })
  planId!: string;

  @ApiProperty({ description: 'Monthly schedules available', type: [UserMonthlyContentResponseDto] })
  months!: UserMonthlyContentResponseDto[];

  @ApiProperty({ description: 'Total months available' })
  totalMonths!: number;
}
