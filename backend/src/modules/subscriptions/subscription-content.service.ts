import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService, DATABASE_SERVICE } from '@/common/database';
import { StorageService, StorageFolder } from '@/common/storage';
import {
  ContentType,
  SubscriptionContentResponseDto,
  SubscriptionContentListResponseDto,
  CreateSubscriptionContentWithFileDto,
  BulkContentUploadDto,
  BulkContentUploadResponseDto,
  RequestPresignedUploadUrlDto,
  PresignedUploadUrlResponseDto,
  RequestPresignedDownloadUrlDto,
  PresignedDownloadUrlResponseDto,
  SecureDownloadRequestDto,
  SecureDownloadResponseDto,
  FileCategory,
  ContentAccessResponseDto,
  FileMetadataResponseDto,
  FileListResponseDto,
} from './dto';
import { SubscriptionsService } from './subscriptions.service';

interface SubscriptionContentEntity {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  id: string;
  planId: string;
  contentType: ContentType;
  title: string;
  titleHi?: string;
  description?: string;
  descriptionHi?: string;
  fileUrl?: string;
  fileKey?: string;
  thumbnailUrl?: string;
  thumbnailKey?: string;
  duration?: number;
  displayOrder: number;
  locale: string;
  isActive: boolean;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class SubscriptionContentService {
  private readonly contentEntityType = 'SUBSCRIPTION_CONTENT';

  constructor(
    @Inject(DATABASE_SERVICE)
    private readonly databaseService: DatabaseService,
    private readonly storageService: StorageService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  // ============================================
  // Presigned URL Methods
  // ============================================

  /**
   * Generate presigned URL for uploading a file
   */
  async getPresignedUploadUrl(dto: RequestPresignedUploadUrlDto): Promise<PresignedUploadUrlResponseDto> {
    const folder = this.getCategoryFolder(dto.category);
    const expiresIn = dto.expiresIn || 3600;

    const result = await this.storageService.getPresignedUploadUrl(
      folder,
      dto.fileName,
      dto.contentType,
      expiresIn,
    );

    return {
      uploadUrl: result.uploadUrl,
      downloadUrl: result.downloadUrl,
      key: result.key,
      expiresIn: result.expiresIn,
      contentType: dto.contentType,
    };
  }

  /**
   * Generate presigned URL for downloading a file (admin)
   */
  async getPresignedDownloadUrl(dto: RequestPresignedDownloadUrlDto): Promise<PresignedDownloadUrlResponseDto> {
    const key = dto.key.startsWith('http') 
      ? this.storageService.extractKeyFromUrl(dto.key) || dto.key 
      : dto.key;
    
    const expiresIn = dto.expiresIn || 3600;
    const downloadUrl = await this.storageService.getPresignedDownloadUrl(key, expiresIn);

    return {
      downloadUrl,
      expiresIn,
    };
  }

  // ============================================
  // Content with File Methods
  // ============================================

  /**
   * Create content with uploaded file
   */
  async createContentWithFile(dto: CreateSubscriptionContentWithFileDto): Promise<SubscriptionContentResponseDto> {
    // Verify plan exists
    await this.subscriptionsService.findPlanById(dto.planId);

    // Verify the file exists in S3
    const fileExists = await this.storageService.fileExists(dto.fileKey);
    if (!fileExists) {
      throw new BadRequestException('File not found. Please upload the file first.');
    }

    const id = uuidv4();
    const locale = dto.locale || 'en';
    const fileUrl = this.storageService.getPublicUrl(dto.fileKey);
    const thumbnailUrl = dto.thumbnailKey 
      ? this.storageService.getPublicUrl(dto.thumbnailKey) 
      : undefined;

    const content: SubscriptionContentEntity = {
      PK: `${this.contentEntityType}#${id}`,
      SK: `${this.contentEntityType}#${locale}`,
      GSI1PK: `PLAN#${dto.planId}`,
      GSI1SK: `${this.contentEntityType}#${dto.contentType}#${String(dto.displayOrder || 0).padStart(3, '0')}`,
      id,
      planId: dto.planId,
      contentType: dto.contentType,
      title: dto.title,
      titleHi: dto.titleHi,
      description: dto.description,
      descriptionHi: dto.descriptionHi,
      fileUrl,
      fileKey: dto.fileKey,
      thumbnailUrl,
      thumbnailKey: dto.thumbnailKey,
      duration: dto.duration,
      displayOrder: dto.displayOrder || 0,
      locale,
      isActive: true,
      downloadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.databaseService.put(content);
    return this.mapContentToResponse(content);
  }

  /**
   * Bulk create content items
   */
  async bulkCreateContent(dto: BulkContentUploadDto): Promise<BulkContentUploadResponseDto> {
    // Verify plan exists
    await this.subscriptionsService.findPlanById(dto.planId);

    const createdIds: string[] = [];
    const errors: string[] = [];

    for (const item of dto.items) {
      try {
        const content = await this.createContentWithFile({
          ...item,
          planId: dto.planId,
        });
        createdIds.push(content.id);
      } catch (error) {
        errors.push(`Failed to create "${item.title}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      successCount: createdIds.length,
      failedCount: errors.length,
      createdIds,
      errors,
    };
  }

  /**
   * Update content file
   */
  async updateContentFile(
    contentId: string,
    newFileKey: string,
    locale = 'en',
  ): Promise<SubscriptionContentResponseDto> {
    const existing = await this.findContentById(contentId, locale);
    if (!existing) {
      throw new NotFoundException(`Content with ID ${contentId} not found`);
    }

    // Verify new file exists
    const fileExists = await this.storageService.fileExists(newFileKey);
    if (!fileExists) {
      throw new BadRequestException('New file not found. Please upload the file first.');
    }

    const newFileUrl = this.storageService.getPublicUrl(newFileKey);

    // Update in database
    const updated = await this.databaseService.update<SubscriptionContentEntity>(this.contentEntityType, {
      key: {
        PK: `${this.contentEntityType}#${contentId}`,
        SK: `${this.contentEntityType}#${locale}`,
      },
      updateExpression: 'SET fileUrl = :fileUrl, fileKey = :fileKey, updatedAt = :updatedAt',
      expressionAttributeValues: {
        ':fileUrl': newFileUrl,
        ':fileKey': newFileKey,
        ':updatedAt': new Date().toISOString(),
      },
    });

    // Delete old file if it exists
    if (existing.fileUrl) {
      const oldKey = this.storageService.extractKeyFromUrl(existing.fileUrl);
      if (oldKey) {
        try {
          await this.storageService.deleteFile(oldKey);
        } catch {
          // Log but don't fail if old file deletion fails
        }
      }
    }

    return this.mapContentToResponse(updated);
  }

  /**
   * Update content thumbnail
   */
  async updateContentThumbnail(
    contentId: string,
    newThumbnailKey: string,
    locale = 'en',
  ): Promise<SubscriptionContentResponseDto> {
    const existing = await this.findContentById(contentId, locale);
    if (!existing) {
      throw new NotFoundException(`Content with ID ${contentId} not found`);
    }

    const thumbnailUrl = this.storageService.getPublicUrl(newThumbnailKey);

    const updated = await this.databaseService.update<SubscriptionContentEntity>(this.contentEntityType, {
      key: {
        PK: `${this.contentEntityType}#${contentId}`,
        SK: `${this.contentEntityType}#${locale}`,
      },
      updateExpression: 'SET thumbnailUrl = :thumbnailUrl, thumbnailKey = :thumbnailKey, updatedAt = :updatedAt',
      expressionAttributeValues: {
        ':thumbnailUrl': thumbnailUrl,
        ':thumbnailKey': newThumbnailKey,
        ':updatedAt': new Date().toISOString(),
      },
    });

    return this.mapContentToResponse(updated);
  }

  /**
   * Delete content and associated files
   */
  async deleteContentWithFiles(contentId: string, locale = 'en'): Promise<void> {
    const content = await this.findContentById(contentId, locale);
    if (!content) {
      throw new NotFoundException(`Content with ID ${contentId} not found`);
    }

    // Delete files from S3
    const keysToDelete: string[] = [];
    
    if (content.fileUrl) {
      const fileKey = this.storageService.extractKeyFromUrl(content.fileUrl);
      if (fileKey) keysToDelete.push(fileKey);
    }
    
    if (content.thumbnailUrl) {
      const thumbnailKey = this.storageService.extractKeyFromUrl(content.thumbnailUrl);
      if (thumbnailKey) keysToDelete.push(thumbnailKey);
    }

    if (keysToDelete.length > 0) {
      await this.storageService.deleteFiles(keysToDelete);
    }

    // Delete from database
    await this.databaseService.delete(
      `${this.contentEntityType}#${contentId}`,
      `${this.contentEntityType}#${locale}`,
    );
  }

  // ============================================
  // Secure Content Access Methods
  // ============================================

  /**
   * Check if user can access content and return access details
   */
  async checkContentAccess(userId: string, contentId: string, locale = 'en'): Promise<ContentAccessResponseDto> {
    const content = await this.findContentById(contentId, locale);
    if (!content) {
      throw new NotFoundException(`Content with ID ${contentId} not found`);
    }

    // Check user's subscription
    const hasAccess = await this.subscriptionsService.canUserAccessContent(userId, content.planId);
    
    if (!hasAccess) {
      const plan = await this.subscriptionsService.findPlanById(content.planId);
      return {
        hasAccess: false,
        reason: 'Subscription required to access this content',
        requiredPlan: plan.name,
      };
    }

    return {
      hasAccess: true,
      content: {
        id: content.id,
        title: content.title,
        description: content.description,
        contentType: content.contentType,
        fileUrl: content.fileUrl || '',
        thumbnailUrl: content.thumbnailUrl,
        duration: content.duration,
      },
    };
  }

  /**
   * Generate secure download URL for subscribed user
   */
  async getSecureDownloadUrl(
    userId: string,
    dto: SecureDownloadRequestDto,
  ): Promise<SecureDownloadResponseDto> {
    const locale = dto.locale || 'en';
    const content = await this.findContentById(dto.contentId, locale);
    
    if (!content) {
      throw new NotFoundException(`Content with ID ${dto.contentId} not found`);
    }

    // Verify user has access
    const hasAccess = await this.subscriptionsService.canUserAccessContent(userId, content.planId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this content. Please subscribe to the required plan.');
    }

    // Get the appropriate key
    const urlToUse = dto.thumbnail && content.thumbnailUrl 
      ? content.thumbnailUrl 
      : content.fileUrl;
    
    if (!urlToUse) {
      throw new NotFoundException('File not found for this content');
    }

    const key = this.storageService.extractKeyFromUrl(urlToUse);
    if (!key) {
      throw new NotFoundException('Invalid file reference');
    }

    const expiresIn = 3600; // 1 hour
    const downloadUrl = await this.storageService.getPresignedDownloadUrl(key, expiresIn);

    // Increment download count
    await this.incrementDownloadCount(dto.contentId, locale);

    return {
      downloadUrl,
      expiresIn,
      contentId: content.id,
      title: content.title,
      contentType: content.contentType,
    };
  }

  // ============================================
  // File Management Methods
  // ============================================

  /**
   * List files in a category
   */
  async listFilesByCategory(category: FileCategory): Promise<FileListResponseDto> {
    const folder = this.getCategoryFolder(category);
    const files = await this.storageService.listFiles(folder);

    const items: FileMetadataResponseDto[] = files.map((file) => ({
      key: file.key,
      size: file.size,
      contentType: file.contentType,
      lastModified: file.lastModified.toISOString(),
      url: this.storageService.getPublicUrl(file.key),
    }));

    return {
      items,
      count: items.length,
    };
  }

  /**
   * Delete orphaned files (files not linked to any content)
   */
  async cleanupOrphanedFiles(category: FileCategory, dryRun = true): Promise<string[]> {
    const folder = this.getCategoryFolder(category);
    const files = await this.storageService.listFiles(folder);
    const orphanedKeys: string[] = [];

    for (const file of files) {
      // Check if this file is referenced in any content
      const isReferenced = await this.isFileReferencedInContent(file.key);
      if (!isReferenced) {
        orphanedKeys.push(file.key);
        if (!dryRun) {
          await this.storageService.deleteFile(file.key);
        }
      }
    }

    return orphanedKeys;
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private async findContentById(id: string, locale: string): Promise<SubscriptionContentResponseDto | null> {
    try {
      const content = await this.databaseService.get<SubscriptionContentEntity>(
        `${this.contentEntityType}#${id}`,
        `${this.contentEntityType}#${locale}`,
      );
      return content ? this.mapContentToResponse(content) : null;
    } catch {
      return null;
    }
  }

  private async incrementDownloadCount(contentId: string, locale: string): Promise<void> {
    try {
      await this.databaseService.update(this.contentEntityType, {
        key: {
          PK: `${this.contentEntityType}#${contentId}`,
          SK: `${this.contentEntityType}#${locale}`,
        },
        updateExpression: 'SET downloadCount = if_not_exists(downloadCount, :zero) + :inc',
        expressionAttributeValues: {
          ':zero': 0,
          ':inc': 1,
        },
      });
    } catch {
      // Don't fail the download if counter update fails
    }
  }

  private async isFileReferencedInContent(key: string): Promise<boolean> {
    // This is a simplified check - in production you might want a more comprehensive scan
    const url = this.storageService.getPublicUrl(key);
    
    // Query all content and check if the URL is referenced
    // For efficiency, this could be improved with a reverse index
    const result = await this.databaseService.scan<SubscriptionContentEntity>(
      this.contentEntityType,
      { fileUrl: url },
    );

    // Also check by key
    if (result.length === 0) {
      const resultByKey = await this.databaseService.scan<SubscriptionContentEntity>(
        this.contentEntityType,
        { fileKey: key },
      );
      return resultByKey.length > 0;
    }

    return result.length > 0;
  }

  private getCategoryFolder(category: FileCategory): StorageFolder {
    const folderMap: Record<FileCategory, StorageFolder> = {
      [FileCategory.STOTRA]: StorageFolder.STOTRAS,
      [FileCategory.KAVACH]: StorageFolder.KAVACH,
      [FileCategory.PDF]: StorageFolder.PDFS,
      [FileCategory.VIDEO]: StorageFolder.VIDEOS,
      [FileCategory.IMAGE]: StorageFolder.IMAGES,
      [FileCategory.THUMBNAIL]: StorageFolder.THUMBNAILS,
      [FileCategory.GUIDANCE]: StorageFolder.GUIDANCE,
    };
    return folderMap[category] || StorageFolder.SUBSCRIPTION_CONTENT;
  }

  private mapContentToResponse(content: SubscriptionContentEntity): SubscriptionContentResponseDto {
    return {
      id: content.id,
      planId: content.planId,
      contentType: content.contentType,
      title: content.title,
      description: content.description,
      fileUrl: content.fileUrl,
      thumbnailUrl: content.thumbnailUrl,
      duration: content.duration,
      displayOrder: content.displayOrder,
      locale: content.locale,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
    };
  }
}
