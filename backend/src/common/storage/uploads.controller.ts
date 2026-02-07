import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { StorageService, StorageFolder, PresignedUrlResult, FileMetadata } from './storage.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { AdminOnly, EditorOnly } from '@/common/decorators';

export class GetPresignedUploadDto {
  @IsEnum(StorageFolder)
  @IsNotEmpty()
  folder: StorageFolder;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  contentType: string;
}

export class UploadedFileDto {
  key: string;
  url: string;
  name: string;
  size: number;
  contentType: string;
  folder: string;
  uploadedAt: string;
}

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadsController {
  private readonly logger = new Logger(UploadsController.name);

  constructor(private readonly storageService: StorageService) {}

  /**
   * Get presigned URL for direct upload from client
   */
  @Post('presigned-url')
  @EditorOnly()
  async getPresignedUploadUrl(@Body() dto: GetPresignedUploadDto): Promise<PresignedUrlResult> {
    return this.storageService.getPresignedUploadUrl(dto.folder, dto.fileName, dto.contentType);
  }

  /**
   * Upload file directly through server
   * Falls back to parsing raw body in Lambda where multer may not work
   */
  @Post('upload')
  @EditorOnly()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: any,
    @Query('folder') folder: StorageFolder = StorageFolder.IMAGES,
    @Req() _req: any,
  ): Promise<UploadedFileDto> {
    // In Lambda, multer may not parse the file correctly
    if (!file) {
      this.logger.warn('Multer did not parse file; check if running in Lambda');
      throw new BadRequestException(
        'No file provided. Use presigned-url endpoint for direct S3 upload instead.',
      );
    }

    const result = await this.storageService.uploadFile(
      folder,
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    return {
      key: result.key,
      url: result.url,
      name: file.originalname,
      size: result.size,
      contentType: result.contentType,
      folder,
      uploadedAt: new Date().toISOString(),
    };
  }

  /**
   * List files in a folder
   */
  @Get('list')
  @EditorOnly()
  async listFiles(
    @Query('folder') folder: StorageFolder = StorageFolder.IMAGES,
    @Query('limit') limit?: number,
  ): Promise<FileMetadata[]> {
    return this.storageService.listFiles(folder, limit);
  }

  /**
   * Get file metadata
   */
  @Get('metadata/:key(*)')
  @EditorOnly()
  async getFileMetadata(@Param('key') key: string): Promise<FileMetadata | null> {
    return this.storageService.getFileMetadata(key);
  }

  /**
   * Delete a file
   */
  @Delete(':key(*)')
  @AdminOnly()
  async deleteFile(@Param('key') key: string): Promise<{ message: string }> {
    await this.storageService.deleteFile(key);
    return { message: 'File deleted successfully' };
  }

  /**
   * Get available folders
   */
  @Get('folders')
  @EditorOnly()
  getFolders(): { folders: { name: string; key: StorageFolder }[] } {
    return {
      folders: [
        { name: 'Images', key: StorageFolder.IMAGES },
        { name: 'PDFs', key: StorageFolder.PDFS },
        { name: 'Videos', key: StorageFolder.VIDEOS },
        { name: 'Thumbnails', key: StorageFolder.THUMBNAILS },
        { name: 'Subscription Content', key: StorageFolder.SUBSCRIPTION_CONTENT },
        { name: 'Stotras', key: StorageFolder.STOTRAS },
        { name: 'Kavach', key: StorageFolder.KAVACH },
        { name: 'Guidance', key: StorageFolder.GUIDANCE },
      ],
    };
  }
}
