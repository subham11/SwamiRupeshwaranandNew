import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UploadsController } from '../uploads.controller';
import { StorageService, StorageFolder } from '../storage.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

describe('UploadsController', () => {
  let controller: UploadsController;

  const mockStorageService = {
    getPresignedUploadUrl: jest.fn(),
    uploadFile: jest.fn(),
    listFiles: jest.fn(),
    getFileMetadata: jest.fn(),
    deleteFile: jest.fn(),
  };

  const mockJwtAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };
  const mockRolesGuard = { canActivate: jest.fn().mockReturnValue(true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<UploadsController>(UploadsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns presigned URL', async () => {
    mockStorageService.getPresignedUploadUrl.mockResolvedValue({
      uploadUrl: 'https://example.com/upload',
      fileUrl: 'https://example.com/file',
      key: 'images/test.png',
      fields: {},
    });

    const result = await controller.getPresignedUploadUrl({
      folder: StorageFolder.IMAGES,
      fileName: 'test.png',
      contentType: 'image/png',
    });

    expect(result.key).toBe('images/test.png');
    expect(mockStorageService.getPresignedUploadUrl).toHaveBeenCalledWith(
      StorageFolder.IMAGES,
      'test.png',
      'image/png',
    );
  });

  it('throws when upload has no file', async () => {
    await expect(controller.uploadFile(undefined as any, StorageFolder.IMAGES)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('lists files', async () => {
    mockStorageService.listFiles.mockResolvedValue([{ key: 'images/a.png' }]);

    const result = await controller.listFiles(StorageFolder.IMAGES, 10);

    expect(result).toHaveLength(1);
    expect(mockStorageService.listFiles).toHaveBeenCalledWith(StorageFolder.IMAGES, 10);
  });

  it('gets metadata', async () => {
    mockStorageService.getFileMetadata.mockResolvedValue({ key: 'images/a.png' });

    const result = await controller.getFileMetadata('images/a.png');

    expect(result?.key).toBe('images/a.png');
  });

  it('deletes a file', async () => {
    mockStorageService.deleteFile.mockResolvedValue(undefined);

    const result = await controller.deleteFile('images/a.png');

    expect(result.message).toBe('File deleted successfully');
    expect(mockStorageService.deleteFile).toHaveBeenCalledWith('images/a.png');
  });
});
