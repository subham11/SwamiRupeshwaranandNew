import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray, IsNumber, IsUrl } from 'class-validator';

export enum TeachingCategory {
  DISCOURSE = 'discourse',
  MEDITATION = 'meditation',
  BHAJAN = 'bhajan',
  SATSANG = 'satsang',
  SCRIPTURE = 'scripture',
  GUIDANCE = 'guidance',
}

export enum TeachingStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export class CreateTeachingDto {
  @ApiPropertyOptional({ example: 'en', description: 'Locale' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional({ description: 'URL slug' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ description: 'Teaching title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Teaching content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Short excerpt' })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiProperty({ enum: TeachingCategory, description: 'Teaching category' })
  @IsEnum(TeachingCategory)
  category: TeachingCategory;

  @ApiPropertyOptional({ type: [String], description: 'Tags' })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Featured image URL' })
  @IsOptional()
  @IsString()
  featuredImage?: string;

  @ApiPropertyOptional({ description: 'Audio URL' })
  @IsOptional()
  @IsUrl()
  audioUrl?: string;

  @ApiPropertyOptional({ description: 'Video URL' })
  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'Duration in minutes' })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({ enum: TeachingStatus, default: TeachingStatus.DRAFT })
  @IsOptional()
  @IsEnum(TeachingStatus)
  status?: TeachingStatus;
}

export class UpdateTeachingDto {
  @ApiPropertyOptional({ example: 'en', description: 'Locale' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional({ description: 'URL slug' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: 'Teaching title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Teaching content' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Short excerpt' })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiPropertyOptional({ enum: TeachingCategory })
  @IsOptional()
  @IsEnum(TeachingCategory)
  category?: TeachingCategory;

  @ApiPropertyOptional({ type: [String], description: 'Tags' })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Featured image URL' })
  @IsOptional()
  @IsString()
  featuredImage?: string;

  @ApiPropertyOptional({ description: 'Audio URL' })
  @IsOptional()
  @IsUrl()
  audioUrl?: string;

  @ApiPropertyOptional({ description: 'Video URL' })
  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'Duration in minutes' })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({ enum: TeachingStatus })
  @IsOptional()
  @IsEnum(TeachingStatus)
  status?: TeachingStatus;
}

export class TeachingResponseDto {
  @ApiProperty({ description: 'Teaching ID' })
  id: string;

  @ApiProperty({ description: 'Locale' })
  locale: string;

  @ApiProperty({ description: 'URL slug' })
  slug: string;

  @ApiProperty({ description: 'Teaching title' })
  title: string;

  @ApiProperty({ description: 'Teaching content' })
  content: string;

  @ApiPropertyOptional({ description: 'Short excerpt' })
  excerpt?: string;

  @ApiProperty({ description: 'Teaching category' })
  category: string;

  @ApiPropertyOptional({ type: [String], description: 'Tags' })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Featured image URL' })
  featuredImage?: string;

  @ApiPropertyOptional({ description: 'Audio URL' })
  audioUrl?: string;

  @ApiPropertyOptional({ description: 'Video URL' })
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'Duration in minutes' })
  duration?: number;

  @ApiProperty({ description: 'Teaching status' })
  status: string;

  @ApiPropertyOptional({ description: 'Published timestamp' })
  publishedAt?: string;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: string;
}

export class TeachingListResponseDto {
  @ApiProperty({ type: [TeachingResponseDto], description: 'List of teachings' })
  items: TeachingResponseDto[];

  @ApiProperty({ description: 'Total count' })
  count: number;
}
