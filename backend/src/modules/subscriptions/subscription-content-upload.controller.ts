import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SubscriptionContentService } from './subscription-content.service';
import {
  RequestPresignedUploadUrlDto,
  PresignedUploadUrlResponseDto,
  RequestPresignedDownloadUrlDto,
  PresignedDownloadUrlResponseDto,
  CreateSubscriptionContentWithFileDto,
  BulkContentUploadDto,
  BulkContentUploadResponseDto,
  SecureDownloadRequestDto,
  SecureDownloadResponseDto,
  ContentAccessResponseDto,
  FileCategory,
  FileListResponseDto,
  SubscriptionContentResponseDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Public, AdminOnly, EditorOnly, CurrentUser, CurrentUserData } from '@/common/decorators';

@ApiTags('Subscription Content & Uploads')
@Controller('subscriptions/content-upload')
export class SubscriptionContentUploadController {
  constructor(private readonly contentService: SubscriptionContentService) {}

  // ============================================
  // Admin File Upload Endpoints
  // ============================================

  @Post('presigned-upload-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @EditorOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get presigned URL for file upload (Content Editor+)',
    description:
      'Returns a presigned URL for direct file upload to S3. Use this before creating content.',
  })
  @ApiResponse({
    status: 201,
    description: 'Presigned URL generated',
    type: PresignedUploadUrlResponseDto,
  })
  async getPresignedUploadUrl(
    @Body() dto: RequestPresignedUploadUrlDto,
  ): Promise<PresignedUploadUrlResponseDto> {
    return this.contentService.getPresignedUploadUrl(dto);
  }

  @Post('presigned-download-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get presigned URL for file download (Admin only)',
    description: 'Returns a presigned URL for downloading any file from S3.',
  })
  @ApiResponse({
    status: 201,
    description: 'Presigned download URL generated',
    type: PresignedDownloadUrlResponseDto,
  })
  async getPresignedDownloadUrl(
    @Body() dto: RequestPresignedDownloadUrlDto,
  ): Promise<PresignedDownloadUrlResponseDto> {
    return this.contentService.getPresignedDownloadUrl(dto);
  }

  @Post('create-with-file')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @EditorOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create subscription content with uploaded file (Content Editor+)',
    description: 'Creates content record after file has been uploaded using presigned URL.',
  })
  @ApiResponse({
    status: 201,
    description: 'Content created successfully',
    type: SubscriptionContentResponseDto,
  })
  async createContentWithFile(
    @Body() dto: CreateSubscriptionContentWithFileDto,
  ): Promise<SubscriptionContentResponseDto> {
    return this.contentService.createContentWithFile(dto);
  }

  @Post('bulk-create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Bulk create subscription content (Admin only)',
    description: 'Create multiple content items at once for a subscription plan.',
  })
  @ApiResponse({
    status: 201,
    description: 'Bulk creation result',
    type: BulkContentUploadResponseDto,
  })
  async bulkCreateContent(
    @Body() dto: BulkContentUploadDto,
  ): Promise<BulkContentUploadResponseDto> {
    return this.contentService.bulkCreateContent(dto);
  }

  @Put(':contentId/update-file')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @EditorOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update content file (Content Editor+)',
    description: 'Replace the file for an existing content item.',
  })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiQuery({ name: 'locale', required: false })
  @ApiResponse({
    status: 200,
    description: 'Content file updated',
    type: SubscriptionContentResponseDto,
  })
  async updateContentFile(
    @Param('contentId') contentId: string,
    @Body('fileKey') fileKey: string,
    @Query('locale') locale?: string,
  ): Promise<SubscriptionContentResponseDto> {
    return this.contentService.updateContentFile(contentId, fileKey, locale);
  }

  @Put(':contentId/update-thumbnail')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @EditorOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update content thumbnail (Content Editor+)',
    description: 'Replace the thumbnail for an existing content item.',
  })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiQuery({ name: 'locale', required: false })
  @ApiResponse({
    status: 200,
    description: 'Thumbnail updated',
    type: SubscriptionContentResponseDto,
  })
  async updateContentThumbnail(
    @Param('contentId') contentId: string,
    @Body('thumbnailKey') thumbnailKey: string,
    @Query('locale') locale?: string,
  ): Promise<SubscriptionContentResponseDto> {
    return this.contentService.updateContentThumbnail(contentId, thumbnailKey, locale);
  }

  @Delete(':contentId/with-files')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete content and associated files (Admin only)',
    description: 'Deletes the content record and its S3 files.',
  })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiQuery({ name: 'locale', required: false })
  @ApiResponse({ status: 200, description: 'Content and files deleted' })
  async deleteContentWithFiles(
    @Param('contentId') contentId: string,
    @Query('locale') locale?: string,
  ): Promise<void> {
    return this.contentService.deleteContentWithFiles(contentId, locale);
  }

  // ============================================
  // File Management Endpoints
  // ============================================

  @Get('files/:category')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List files by category (Admin only)',
    description: 'List all files in a specific category folder in S3.',
  })
  @ApiParam({ name: 'category', enum: FileCategory })
  @ApiResponse({
    status: 200,
    description: 'File list',
    type: FileListResponseDto,
  })
  async listFilesByCategory(
    @Param('category') category: FileCategory,
  ): Promise<FileListResponseDto> {
    return this.contentService.listFilesByCategory(category);
  }

  @Post('cleanup-orphaned')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Find orphaned files (Admin only)',
    description: 'Find files not linked to any content. Use dryRun=false to delete them.',
  })
  @ApiQuery({ name: 'category', enum: FileCategory })
  @ApiQuery({
    name: 'dryRun',
    required: false,
    type: Boolean,
    description: 'If true, only list files without deleting',
  })
  @ApiResponse({
    status: 200,
    description: 'List of orphaned file keys',
    type: [String],
  })
  async cleanupOrphanedFiles(
    @Query('category') category: FileCategory,
    @Query('dryRun') dryRun?: boolean,
  ): Promise<string[]> {
    return this.contentService.cleanupOrphanedFiles(category, dryRun !== false);
  }

  // ============================================
  // User Content Access Endpoints
  // ============================================

  @Get('access/:contentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Check content access',
    description: 'Check if the current user has access to specific content.',
  })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiQuery({ name: 'locale', required: false })
  @ApiResponse({
    status: 200,
    description: 'Access check result',
    type: ContentAccessResponseDto,
  })
  async checkContentAccess(
    @Param('contentId') contentId: string,
    @Query('locale') locale: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ContentAccessResponseDto> {
    return this.contentService.checkContentAccess(user.sub, contentId, locale);
  }

  @Post('secure-download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get secure download URL',
    description:
      'Get a time-limited download URL for subscribed content. Only available if user has active subscription.',
  })
  @ApiResponse({
    status: 200,
    description: 'Secure download URL',
    type: SecureDownloadResponseDto,
  })
  @ApiResponse({ status: 403, description: 'No access to this content' })
  async getSecureDownloadUrl(
    @Body() dto: SecureDownloadRequestDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<SecureDownloadResponseDto> {
    return this.contentService.getSecureDownloadUrl(user.sub, dto);
  }

  // ============================================
  // Public Content Access (Free Tier)
  // ============================================

  @Get('public/free-content')
  @Public()
  @ApiOperation({
    summary: 'Get free tier content list',
    description:
      'Get content available in the free subscription tier (no authentication required).',
  })
  async getFreeTierContent(): Promise<any> {
    // This would be implemented to return free tier content
    // Using the subscriptions service to get free plan content
    return { message: 'Use /subscriptions/plans to see available plans and their content' };
  }
}
