import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminService } from '../admin.service';
import { DatabaseService, DATABASE_SERVICE } from '@/common/database';
import { EmailService } from '@/common/email';
import { UserRole } from '@/modules/users/dto';

describe('AdminService', () => {
  let service: AdminService;
  let databaseService: jest.Mocked<DatabaseService>;
  let emailService: jest.Mocked<EmailService>;
  let configService: jest.Mocked<ConfigService>;

  const mockDatabaseService = {
    get: jest.fn(),
    put: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    query: jest.fn(),
  };

  const mockEmailService = {
    sendAdminInviteEmail: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: string) => defaultValue),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: DATABASE_SERVICE,
          useValue: mockDatabaseService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    databaseService = module.get(DATABASE_SERVICE);
    emailService = module.get(EmailService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('inviteUser', () => {
    const inviteDto = {
      email: 'newuser@example.com',
      name: 'New User',
      role: UserRole.CONTENT_EDITOR as UserRole.ADMIN | UserRole.CONTENT_EDITOR,
    };

    it('should successfully invite a content editor', async () => {
      mockDatabaseService.get.mockResolvedValue(null); // No existing user
      mockDatabaseService.put.mockResolvedValue(undefined);
      mockEmailService.sendAdminInviteEmail.mockResolvedValue(true);

      const result = await service.inviteUser(inviteDto, 'admin@example.com', 'admin');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Invitation sent successfully');
      expect(result.user.email).toBe('newuser@example.com');
      expect(result.user.name).toBe('New User');
      expect(result.user.role).toBe(UserRole.CONTENT_EDITOR);
      expect(mockDatabaseService.put).toHaveBeenCalled();
      expect(mockEmailService.sendAdminInviteEmail).toHaveBeenCalled();
    });

    it('should allow super_admin to invite admin', async () => {
      const adminInvite = {
        email: 'newadmin@example.com',
        name: 'New Admin',
        role: UserRole.ADMIN as UserRole.ADMIN | UserRole.CONTENT_EDITOR,
      };

      mockDatabaseService.get.mockResolvedValue(null);
      mockDatabaseService.put.mockResolvedValue(undefined);
      mockEmailService.sendAdminInviteEmail.mockResolvedValue(true);

      const result = await service.inviteUser(adminInvite, 'superadmin@example.com', 'super_admin');

      expect(result.success).toBe(true);
      expect(result.user.role).toBe(UserRole.ADMIN);
    });

    it('should throw ForbiddenException when admin tries to invite admin', async () => {
      const adminInvite = {
        email: 'newadmin@example.com',
        name: 'New Admin',
        role: UserRole.ADMIN as UserRole.ADMIN | UserRole.CONTENT_EDITOR,
      };

      await expect(
        service.inviteUser(adminInvite, 'admin@example.com', 'admin'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when user already exists', async () => {
      mockDatabaseService.get.mockResolvedValue({
        id: 'existing-user',
        email: 'newuser@example.com',
      });

      await expect(
        service.inviteUser(inviteDto, 'admin@example.com', 'admin'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should normalize email to lowercase', async () => {
      const uppercaseEmailInvite = {
        email: 'UPPERCASE@EXAMPLE.COM',
        name: 'Test User',
        role: UserRole.CONTENT_EDITOR as UserRole.ADMIN | UserRole.CONTENT_EDITOR,
      };

      mockDatabaseService.get.mockResolvedValue(null);
      mockDatabaseService.put.mockResolvedValue(undefined);
      mockEmailService.sendAdminInviteEmail.mockResolvedValue(true);

      const result = await service.inviteUser(uppercaseEmailInvite, 'admin@example.com', 'admin');

      expect(result.user.email).toBe('uppercase@example.com');
      expect(mockDatabaseService.get).toHaveBeenCalledWith(
        'USER#uppercase@example.com',
        'PROFILE',
      );
    });

    it('should send invitation email with correct parameters', async () => {
      mockDatabaseService.get.mockResolvedValue(null);
      mockDatabaseService.put.mockResolvedValue(undefined);
      mockEmailService.sendAdminInviteEmail.mockResolvedValue(true);

      await service.inviteUser(inviteDto, 'admin@example.com', 'admin');

      expect(mockEmailService.sendAdminInviteEmail).toHaveBeenCalledWith(
        'newuser@example.com',
        'New User',
        UserRole.CONTENT_EDITOR,
        expect.any(String), // temporary password
        expect.stringContaining('/en/auth/login'), // login URL
      );
    });
  });

  describe('getAllUsers', () => {
    it('should return all users from database', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User One',
          role: 'user',
          hasPassword: true,
          isVerified: true,
          createdAt: '2026-02-04T12:00:00.000Z',
        },
        {
          id: 'user-2',
          email: 'admin@example.com',
          name: 'Admin',
          role: 'admin',
          hasPassword: true,
          isVerified: true,
          createdAt: '2026-02-03T12:00:00.000Z',
        },
      ];

      mockDatabaseService.query.mockResolvedValue({ items: mockUsers });

      const result = await service.getAllUsers();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('user-1');
      expect(result[1].id).toBe('user-2');
      expect(mockDatabaseService.query).toHaveBeenCalledWith('USER', {
        indexName: 'GSI1',
        keyConditionExpression: 'GSI1PK = :pk',
        expressionAttributeValues: {
          ':pk': 'USER',
        },
      });
    });

    it('should return empty array when no users exist', async () => {
      mockDatabaseService.query.mockResolvedValue({ items: [] });

      const result = await service.getAllUsers();

      expect(result).toEqual([]);
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        role: 'user',
        hasPassword: true,
        isVerified: true,
        createdAt: '2026-02-04T12:00:00.000Z',
      };

      mockDatabaseService.query.mockResolvedValue({ items: [mockUser] });

      const result = await service.getUserById('user-123');

      expect(result.id).toBe('user-123');
      expect(result.email).toBe('user@example.com');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockDatabaseService.query.mockResolvedValue({ items: [] });

      await expect(service.getUserById('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUserRole', () => {
    const mockUser = {
      PK: 'USER#user@example.com',
      SK: 'PROFILE',
      id: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
      role: 'user',
      hasPassword: true,
      isVerified: true,
      createdAt: '2026-02-04T12:00:00.000Z',
    };

    it('should update user role when called by super_admin', async () => {
      mockDatabaseService.query.mockResolvedValue({ items: [mockUser] });
      mockDatabaseService.update.mockResolvedValue(undefined);

      const result = await service.updateUserRole(
        'user-123',
        { role: UserRole.ADMIN },
        'super_admin',
      );

      expect(result.role).toBe(UserRole.ADMIN);
      expect(mockDatabaseService.update).toHaveBeenCalledWith('USER', {
        key: { PK: 'USER#user@example.com', SK: 'PROFILE' },
        update: {
          role: UserRole.ADMIN,
          updatedAt: expect.any(String),
        },
      });
    });

    it('should throw ForbiddenException when non-super_admin tries to change role', async () => {
      await expect(
        service.updateUserRole('user-123', { role: UserRole.ADMIN }, 'admin'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when trying to change super_admin role', async () => {
      const superAdminUser = { ...mockUser, role: 'super_admin' };
      mockDatabaseService.query.mockResolvedValue({ items: [superAdminUser] });

      await expect(
        service.updateUserRole('user-123', { role: UserRole.USER }, 'super_admin'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockDatabaseService.query.mockResolvedValue({ items: [] });

      await expect(
        service.updateUserRole('nonexistent-id', { role: UserRole.ADMIN }, 'super_admin'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteUser', () => {
    const mockUser = {
      PK: 'USER#user@example.com',
      SK: 'PROFILE',
      id: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
      role: 'user',
    };

    it('should delete user when called by super_admin', async () => {
      mockDatabaseService.query.mockResolvedValue({ items: [mockUser] });
      mockDatabaseService.delete.mockResolvedValue(undefined);

      await service.deleteUser('user-123', 'super_admin');

      expect(mockDatabaseService.delete).toHaveBeenCalledWith(
        'USER#user@example.com',
        'PROFILE',
      );
    });

    it('should throw ForbiddenException when non-super_admin tries to delete', async () => {
      await expect(service.deleteUser('user-123', 'admin')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when trying to delete super_admin', async () => {
      const superAdminUser = { ...mockUser, role: 'super_admin' };
      mockDatabaseService.query.mockResolvedValue({ items: [superAdminUser] });

      await expect(
        service.deleteUser('user-123', 'super_admin'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockDatabaseService.query.mockResolvedValue({ items: [] });

      await expect(
        service.deleteUser('nonexistent-id', 'super_admin'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
