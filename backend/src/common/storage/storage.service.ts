import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  contentType: string;
  size: number;
}

export interface PresignedUrlResult {
  uploadUrl: string;
  downloadUrl: string;
  key: string;
  expiresIn: number;
}

export interface FileMetadata {
  key: string;
  size: number;
  contentType: string;
  lastModified: Date;
}

export enum StorageFolder {
  SUBSCRIPTION_CONTENT = 'subscription-content',
  STOTRAS = 'stotras',
  KAVACH = 'kavach',
  PDFS = 'pdfs',
  VIDEOS = 'videos',
  IMAGES = 'images',
  THUMBNAILS = 'thumbnails',
  GUIDANCE = 'guidance',
  TEMP = 'temp',
}

export enum AllowedMimeType {
  // Images
  JPEG = 'image/jpeg',
  JPG = 'image/jpg',
  PNG = 'image/png',
  WEBP = 'image/webp',
  GIF = 'image/gif',
  // Documents
  PDF = 'application/pdf',
  // Videos
  MP4 = 'video/mp4',
  WEBM = 'video/webm',
  MOV = 'video/quicktime',
  // Audio
  MP3 = 'audio/mpeg',
  WAV = 'audio/wav',
  AAC = 'audio/aac',
}

const MIME_TYPE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/aac': 'aac',
};

const MAX_FILE_SIZES: Record<string, number> = {
  image: 10 * 1024 * 1024, // 10MB for images
  pdf: 50 * 1024 * 1024, // 50MB for PDFs
  video: 500 * 1024 * 1024, // 500MB for videos
  audio: 100 * 1024 * 1024, // 100MB for audio
};

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly cdnDomain: string | undefined;
  private readonly logger = new Logger(StorageService.name);
  private readonly isLocal: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isLocal = this.configService.get<string>('IS_LOCAL') === 'true';
    this.bucketName =
      this.configService.get<string>('AWS_S3_BUCKET') || 'swami-rupeshwaranand-api-dev-content';
    this.cdnDomain = this.configService.get<string>('CDN_DOMAIN');

    if (this.isLocal) {
      // Local development with LocalStack or MinIO
      this.s3Client = new S3Client({
        region: 'us-east-1',
        endpoint: 'http://localhost:4566',
        forcePathStyle: true,
        credentials: {
          accessKeyId: 'test',
          secretAccessKey: 'test',
        },
      });
    } else {
      this.s3Client = new S3Client({
        region: this.configService.get<string>('AWS_REGION') || 'ap-south-1',
      });
    }
  }

  /**
   * Generate a presigned URL for direct client upload
   */
  async getPresignedUploadUrl(
    folder: StorageFolder,
    fileName: string,
    contentType: string,
    expiresIn = 3600,
  ): Promise<PresignedUrlResult> {
    this.validateMimeType(contentType);

    const extension = MIME_TYPE_EXTENSIONS[contentType] || this.getExtensionFromFileName(fileName);
    const key = this.generateKey(folder, extension);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await this.createSignedUrl(command, expiresIn);
    const downloadUrl = this.getPublicUrl(key);

    return {
      uploadUrl,
      downloadUrl,
      key,
      expiresIn,
    };
  }

  /**
   * Generate a presigned URL for secure download
   */
  async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return this.createSignedUrl(command, expiresIn);
  }

  /**
   * Upload a file buffer directly
   */
  async uploadFile(
    folder: StorageFolder,
    buffer: Buffer,
    fileName: string,
    contentType: string,
  ): Promise<UploadResult> {
    this.validateMimeType(contentType);
    this.validateFileSize(buffer.length, contentType);

    const extension = MIME_TYPE_EXTENSIONS[contentType] || this.getExtensionFromFileName(fileName);
    const key = this.generateKey(folder, extension);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // Add cache control for better performance
      CacheControl: this.getCacheControl(contentType),
    });

    await this.s3Client.send(command);

    return {
      key,
      url: this.getPublicUrl(key),
      bucket: this.bucketName,
      contentType,
      size: buffer.length,
    };
  }

  /**
   * Upload with a specific key (for replacing files)
   */
  async uploadFileWithKey(key: string, buffer: Buffer, contentType: string): Promise<UploadResult> {
    this.validateMimeType(contentType);
    this.validateFileSize(buffer.length, contentType);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: this.getCacheControl(contentType),
    });

    await this.s3Client.send(command);

    return {
      key,
      url: this.getPublicUrl(key),
      bucket: this.bucketName,
      contentType,
      size: buffer.length,
    };
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
    this.logger.log(`Deleted file: ${key}`);
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.deleteFile(key)));
  }

  /**
   * Check if a file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string): Promise<FileMetadata | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const response = await this.s3Client.send(command);

      return {
        key,
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
      };
    } catch {
      return null;
    }
  }

  /**
   * List files in a folder
   */
  async listFiles(folder: StorageFolder, maxKeys = 1000): Promise<FileMetadata[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: `${folder}/`,
      MaxKeys: maxKeys,
    });

    const response = await this.s3Client.send(command);

    return (response.Contents || []).map((item) => ({
      key: item.Key || '',
      size: item.Size || 0,
      contentType: 'application/octet-stream', // S3 list doesn't return content type
      lastModified: item.LastModified || new Date(),
    }));
  }

  /**
   * Copy a file to a new location
   */
  async copyFile(sourceKey: string, destinationFolder: StorageFolder): Promise<string> {
    const extension = sourceKey.split('.').pop() || '';
    const newKey = this.generateKey(destinationFolder, extension);

    // For S3 copy, we need CopyObject command
    const { CopyObjectCommand } = await import('@aws-sdk/client-s3');
    const command = new CopyObjectCommand({
      Bucket: this.bucketName,
      CopySource: `${this.bucketName}/${sourceKey}`,
      Key: newKey,
    });

    await this.s3Client.send(command);
    return newKey;
  }

  /**
   * Move file from temp to permanent location
   */
  async moveFromTemp(tempKey: string, targetFolder: StorageFolder): Promise<string> {
    const newKey = await this.copyFile(tempKey, targetFolder);
    await this.deleteFile(tempKey);
    return newKey;
  }

  /**
   * Get the public URL for a file
   */
  getPublicUrl(key: string): string {
    if (this.cdnDomain) {
      return `https://${this.cdnDomain}/${key}`;
    }

    if (this.isLocal) {
      return `http://localhost:4566/${this.bucketName}/${key}`;
    }

    return `https://${this.bucketName}.s3.${this.configService.get<string>('AWS_REGION') || 'ap-south-1'}.amazonaws.com/${key}`;
  }

  /**
   * Extract key from URL
   */
  extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);

      // Handle CDN URLs
      if (this.cdnDomain && urlObj.hostname === this.cdnDomain) {
        return urlObj.pathname.slice(1); // Remove leading slash
      }

      // Handle S3 URLs
      if (urlObj.hostname.includes('s3.')) {
        return urlObj.pathname.slice(1);
      }

      // Handle LocalStack URLs
      if (urlObj.hostname === 'localhost') {
        const parts = urlObj.pathname.split('/');
        return parts.slice(2).join('/'); // Remove bucket name
      }

      return null;
    } catch {
      return null;
    }
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private async createSignedUrl(
    command: PutObjectCommand | GetObjectCommand,
    expiresIn: number,
  ): Promise<string> {
    // Lazy-load to keep tests isolated from optional AWS presigner dependency
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  private generateKey(folder: StorageFolder, extension: string): string {
    const timestamp = Date.now();
    const uuid = uuidv4().slice(0, 8);
    return `${folder}/${timestamp}-${uuid}.${extension}`;
  }

  private validateMimeType(contentType: string): void {
    const allowedTypes = Object.values(AllowedMimeType) as string[];
    if (!allowedTypes.includes(contentType)) {
      throw new BadRequestException(
        `Invalid file type: ${contentType}. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }
  }

  private validateFileSize(size: number, contentType: string): void {
    let maxSize = MAX_FILE_SIZES.image;

    if (contentType.startsWith('video/')) {
      maxSize = MAX_FILE_SIZES.video;
    } else if (contentType.startsWith('audio/')) {
      maxSize = MAX_FILE_SIZES.audio;
    } else if (contentType === 'application/pdf') {
      maxSize = MAX_FILE_SIZES.pdf;
    }

    if (size > maxSize) {
      throw new BadRequestException(
        `File size ${(size / (1024 * 1024)).toFixed(2)}MB exceeds maximum allowed size of ${(maxSize / (1024 * 1024)).toFixed(2)}MB`,
      );
    }
  }

  private getExtensionFromFileName(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  }

  private getCacheControl(contentType: string): string {
    // Long cache for immutable content
    if (contentType.startsWith('image/') || contentType.startsWith('video/')) {
      return 'public, max-age=31536000, immutable';
    }
    // Shorter cache for documents
    return 'public, max-age=86400';
  }
}
