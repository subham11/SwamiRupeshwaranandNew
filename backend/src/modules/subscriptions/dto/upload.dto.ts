import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { ContentType } from './subscriptions.dto';

// ============================================
// File Upload Types
// ============================================
export enum FileCategory {
  STOTRA = 'stotra',
  KAVACH = 'kavach',
  PDF = 'pdf',
  VIDEO = 'video',
  IMAGE = 'image',
  THUMBNAIL = 'thumbnail',
  GUIDANCE = 'guidance',
}

export const FileCategoryToContentType: Record<FileCategory, ContentType> = {
  [FileCategory.STOTRA]: ContentType.STOTRA,
  [FileCategory.KAVACH]: ContentType.KAVACH,
  [FileCategory.PDF]: ContentType.PDF,
  [FileCategory.VIDEO]: ContentType.VIDEO,
  [FileCategory.IMAGE]: ContentType.IMAGE,
  [FileCategory.THUMBNAIL]: ContentType.IMAGE,
  [FileCategory.GUIDANCE]: ContentType.GUIDANCE,
};

// ============================================
// Presigned URL DTOs
// ============================================
export class RequestPresignedUploadUrlDto {
  @ApiProperty({ description: 'Original filename', example: 'hanuman_chalisa.pdf' })
  @IsString()
  fileName!: string;

  @ApiProperty({ description: 'File MIME type', example: 'application/pdf' })
  @IsString()
  contentType!: string;

  @ApiProperty({ enum: FileCategory, description: 'Category of the file' })
  @IsEnum(FileCategory)
  category!: FileCategory;

  @ApiPropertyOptional({ description: 'Plan ID this file belongs to' })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional({ description: 'Expiration time in seconds', default: 3600 })
  @IsOptional()
  @IsNumber()
  @Min(300)
  @Max(86400)
  expiresIn?: number;
}

export class PresignedUploadUrlResponseDto {
  @ApiProperty({ description: 'Presigned URL for uploading file' })
  uploadUrl!: string;

  @ApiProperty({ description: 'Public URL to access file after upload' })
  downloadUrl!: string;

  @ApiProperty({ description: 'Storage key for the file' })
  key!: string;

  @ApiProperty({ description: 'URL expiration time in seconds' })
  expiresIn!: number;

  @ApiProperty({ description: 'Content type of the file' })
  contentType!: string;
}

export class RequestPresignedDownloadUrlDto {
  @ApiProperty({ description: 'Storage key or file URL' })
  @IsString()
  key!: string;

  @ApiPropertyOptional({ description: 'Expiration time in seconds', default: 3600 })
  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(86400)
  expiresIn?: number;
}

export class PresignedDownloadUrlResponseDto {
  @ApiProperty({ description: 'Presigned URL for downloading file' })
  downloadUrl!: string;

  @ApiProperty({ description: 'URL expiration time in seconds' })
  expiresIn!: number;
}

// ============================================
// Content with File DTOs
// ============================================
export class CreateSubscriptionContentWithFileDto {
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

  @ApiProperty({ description: 'Storage key from presigned upload' })
  @IsString()
  fileKey!: string;

  @ApiPropertyOptional({ description: 'Thumbnail storage key' })
  @IsOptional()
  @IsString()
  thumbnailKey?: string;

  @ApiPropertyOptional({ description: 'Duration in seconds (for video/audio)' })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({ description: 'Display order' })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Locale for the content', default: 'en' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional({ description: 'Hindi title' })
  @IsOptional()
  @IsString()
  titleHi?: string;

  @ApiPropertyOptional({ description: 'Hindi description' })
  @IsOptional()
  @IsString()
  descriptionHi?: string;
}

export class BulkContentUploadDto {
  @ApiProperty({ description: 'Plan ID for all content items' })
  @IsString()
  planId!: string;

  @ApiProperty({
    type: [CreateSubscriptionContentWithFileDto],
    description: 'Array of content items to create',
  })
  items!: CreateSubscriptionContentWithFileDto[];
}

export class BulkContentUploadResponseDto {
  @ApiProperty({ description: 'Number of successfully created items' })
  successCount!: number;

  @ApiProperty({ description: 'Number of failed items' })
  failedCount!: number;

  @ApiProperty({ type: [String], description: 'IDs of successfully created content' })
  createdIds!: string[];

  @ApiProperty({ type: [String], description: 'Error messages for failed items' })
  errors!: string[];
}

// ============================================
// File Metadata DTOs
// ============================================
export class FileMetadataResponseDto {
  @ApiProperty({ description: 'Storage key' })
  key!: string;

  @ApiProperty({ description: 'File size in bytes' })
  size!: number;

  @ApiProperty({ description: 'Content type' })
  contentType!: string;

  @ApiProperty({ description: 'Last modified date' })
  lastModified!: string;

  @ApiProperty({ description: 'Public URL' })
  url!: string;
}

export class FileListResponseDto {
  @ApiProperty({ type: [FileMetadataResponseDto], description: 'List of files' })
  items!: FileMetadataResponseDto[];

  @ApiProperty({ description: 'Total count' })
  count!: number;
}

// ============================================
// Content Access DTOs
// ============================================
export class ContentAccessRequestDto {
  @ApiProperty({ description: 'Content ID to access' })
  @IsString()
  contentId!: string;

  @ApiPropertyOptional({ description: 'Locale', default: 'en' })
  @IsOptional()
  @IsString()
  locale?: string;
}

export class ContentAccessResponseDto {
  @ApiProperty({ description: 'Whether user has access' })
  hasAccess!: boolean;

  @ApiPropertyOptional({ description: 'Content details if access granted' })
  content?: {
    id: string;
    title: string;
    description?: string;
    contentType: ContentType;
    fileUrl: string;
    thumbnailUrl?: string;
    duration?: number;
  };

  @ApiPropertyOptional({ description: 'Reason for denied access' })
  reason?: string;

  @ApiPropertyOptional({ description: 'Required plan for access' })
  requiredPlan?: string;
}

// ============================================
// Secure Download DTOs
// ============================================
export class SecureDownloadRequestDto {
  @ApiProperty({ description: 'Content ID to download' })
  @IsString()
  contentId!: string;

  @ApiPropertyOptional({ description: 'Locale', default: 'en' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional({
    description: 'Get thumbnail instead of main file',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  thumbnail?: boolean;
}

export class SecureDownloadResponseDto {
  @ApiProperty({ description: 'Temporary download URL' })
  downloadUrl!: string;

  @ApiProperty({ description: 'URL expiration time in seconds' })
  expiresIn!: number;

  @ApiProperty({ description: 'Content ID' })
  contentId!: string;

  @ApiProperty({ description: 'Content title' })
  title!: string;

  @ApiProperty({ description: 'Content type' })
  contentType!: ContentType;
}
