import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from '../admin.controller';
import { AdminService } from '../admin.service';
import { CurrentUserData } from '@/common/decorators';
import { UserRole } from '@/modules/users/dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: jest.Mocked<AdminService>;

  const mockAdminService = {
    inviteUser: jest.fn(),
    getAllUsers: jest.fn(),
    getUserById: jest.fn(),
    updateUserRole: jest.fn(),
    deleteUser: jest.fn(),
  };

  // Mock guards
  const mockJwtAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };
  const mockRolesGuard = { canActivate: jest.fn().mockReturnValue(true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<AdminController>(AdminController);
    adminService = module.get(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('inviteUser', () => {
    const superAdminUser: CurrentUserData = {
      sub: 'admin-123',
      email: 'superadmin@example.com',
      role: 'super_admin',
    };

    const inviteDto = {
      email: 'newadmin@example.com',
      name: 'New Admin',
      role: UserRole.ADMIN as UserRole.ADMIN | UserRole.CONTENT_EDITOR,
    };

    it('should successfully invite a new admin', async () => {
      const expectedResponse = {
        success: true,
        message: 'Invitation sent successfully',
        user: {
          id: 'user-123',
          email: 'newadmin@example.com',
          name: 'New Admin',
          role: UserRole.ADMIN,
          hasPassword: true,
          isVerified: true,
          createdAt: '2026-02-04T12:00:00.000Z',
        },
      };

      mockAdminService.inviteUser.mockResolvedValue(expectedResponse);

      const result = await controller.inviteUser(inviteDto, superAdminUser);

      expect(result).toEqual(expectedResponse);
      expect(mockAdminService.inviteUser).toHaveBeenCalledWith(
        inviteDto,
        superAdminUser.email,
        superAdminUser.role,
      );
    });

    it('should pass correct parameters to service', async () => {
      const adminUser: CurrentUserData = {
        sub: 'admin-456',
        email: 'admin@example.com',
        role: 'admin',
      };

      const contentEditorInvite = {
        email: 'editor@example.com',
        name: 'Content Editor',
        role: UserRole.CONTENT_EDITOR as UserRole.ADMIN | UserRole.CONTENT_EDITOR,
      };

      mockAdminService.inviteUser.mockResolvedValue({
        success: true,
        message: 'Invitation sent successfully',
        user: {} as any,
      });

      await controller.inviteUser(contentEditorInvite, adminUser);

      expect(mockAdminService.inviteUser).toHaveBeenCalledWith(
        contentEditorInvite,
        'admin@example.com',
        'admin',
      );
    });
  });

  describe('getAllUsers', () => {
    it('should return list of all users', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User One',
          role: UserRole.USER,
          hasPassword: true,
          isVerified: true,
          createdAt: '2026-02-04T12:00:00.000Z',
        },
        {
          id: 'user-2',
          email: 'admin@example.com',
          name: 'Admin User',
          role: UserRole.ADMIN,
          hasPassword: true,
          isVerified: true,
          createdAt: '2026-02-03T12:00:00.000Z',
        },
      ];

      mockAdminService.getAllUsers.mockResolvedValue(mockUsers);

      const result = await controller.getAllUsers();

      expect(result).toEqual(mockUsers);
      expect(mockAdminService.getAllUsers).toHaveBeenCalled();
    });

    it('should return empty array when no users exist', async () => {
      mockAdminService.getAllUsers.mockResolvedValue([]);

      const result = await controller.getAllUsers();

      expect(result).toEqual([]);
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        role: UserRole.USER,
        hasPassword: true,
        isVerified: true,
        createdAt: '2026-02-04T12:00:00.000Z',
      };

      mockAdminService.getUserById.mockResolvedValue(mockUser);

      const result = await controller.getUserById('user-123');

      expect(result).toEqual(mockUser);
      expect(mockAdminService.getUserById).toHaveBeenCalledWith('user-123');
    });
  });

  describe('updateUserRole', () => {
    const superAdminUser: CurrentUserData = {
      sub: 'superadmin-123',
      email: 'superadmin@example.com',
      role: 'super_admin',
    };

    it('should update user role successfully', async () => {
      const updateDto = { role: UserRole.ADMIN };
      const expectedResponse = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Promoted User',
        role: UserRole.ADMIN,
        hasPassword: true,
        isVerified: true,
        createdAt: '2026-02-04T12:00:00.000Z',
      };

      mockAdminService.updateUserRole.mockResolvedValue(expectedResponse);

      const result = await controller.updateUserRole('user-123', updateDto, superAdminUser);

      expect(result).toEqual(expectedResponse);
      expect(mockAdminService.updateUserRole).toHaveBeenCalledWith(
        'user-123',
        updateDto,
        'super_admin',
      );
    });

    it('should pass correct role to service', async () => {
      const updateDto = { role: UserRole.CONTENT_EDITOR };

      mockAdminService.updateUserRole.mockResolvedValue({} as any);

      await controller.updateUserRole('user-456', updateDto, superAdminUser);

      expect(mockAdminService.updateUserRole).toHaveBeenCalledWith(
        'user-456',
        { role: UserRole.CONTENT_EDITOR },
        'super_admin',
      );
    });
  });

  describe('deleteUser', () => {
    const superAdminUser: CurrentUserData = {
      sub: 'superadmin-123',
      email: 'superadmin@example.com',
      role: 'super_admin',
    };

    it('should delete user successfully', async () => {
      mockAdminService.deleteUser.mockResolvedValue(undefined);

      const result = await controller.deleteUser('user-123', superAdminUser);

      expect(result).toEqual({
        success: true,
        message: 'User deleted successfully',
      });
      expect(mockAdminService.deleteUser).toHaveBeenCalledWith('user-123', 'super_admin');
    });

    it('should pass user role to service for validation', async () => {
      mockAdminService.deleteUser.mockResolvedValue(undefined);

      await controller.deleteUser('user-456', superAdminUser);

      expect(mockAdminService.deleteUser).toHaveBeenCalledWith('user-456', 'super_admin');
    });
  });
});
