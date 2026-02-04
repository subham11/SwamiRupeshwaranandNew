import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../roles.guard';
import { UserRole } from '@/modules/users/dto';

describe('RolesGuard', () => {
  let guard: RolesGuard;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const createMockExecutionContext = (user: { role: string } | null): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('when no role requirements are set', () => {
    it('should allow access when no decorators are present', () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createMockExecutionContext({ role: 'user' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('when @Roles decorator is used', () => {
    it('should allow access when user has one of the required roles', () => {
      mockReflector.getAllAndOverride
        .mockReturnValueOnce([UserRole.SUPER_ADMIN, UserRole.ADMIN]) // requiredRoles
        .mockReturnValueOnce(undefined) // requiredPermissions
        .mockReturnValueOnce(undefined); // minimumRole

      const context = createMockExecutionContext({ role: 'admin' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow super_admin to access endpoints where super_admin is in roles list', () => {
      // When @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) is used
      mockReflector.getAllAndOverride
        .mockReturnValueOnce([UserRole.SUPER_ADMIN, UserRole.ADMIN]) // requiredRoles
        .mockReturnValueOnce(undefined) // requiredPermissions
        .mockReturnValueOnce(undefined); // minimumRole

      const context = createMockExecutionContext({ role: 'super_admin' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user does not have required role', () => {
      mockReflector.getAllAndOverride
        .mockReturnValueOnce([UserRole.SUPER_ADMIN, UserRole.ADMIN]) // requiredRoles
        .mockReturnValueOnce(undefined) // requiredPermissions
        .mockReturnValueOnce(undefined); // minimumRole

      const context = createMockExecutionContext({ role: 'user' });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny access when user has no role', () => {
      mockReflector.getAllAndOverride
        .mockReturnValueOnce([UserRole.ADMIN]) // requiredRoles
        .mockReturnValueOnce(undefined) // requiredPermissions
        .mockReturnValueOnce(undefined); // minimumRole

      const context = createMockExecutionContext(null);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny access when user object has no role property', () => {
      mockReflector.getAllAndOverride
        .mockReturnValueOnce([UserRole.ADMIN]) // requiredRoles
        .mockReturnValueOnce(undefined) // requiredPermissions
        .mockReturnValueOnce(undefined); // minimumRole

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { sub: 'user-123', email: 'test@example.com' } }),
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('when @MinimumRole decorator is used', () => {
    it('should allow access when user role is >= minimum role', () => {
      mockReflector.getAllAndOverride
        .mockReturnValueOnce(undefined) // requiredRoles
        .mockReturnValueOnce(undefined) // requiredPermissions
        .mockReturnValueOnce(UserRole.CONTENT_EDITOR); // minimumRole

      const context = createMockExecutionContext({ role: 'admin' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has exact minimum role', () => {
      mockReflector.getAllAndOverride
        .mockReturnValueOnce(undefined) // requiredRoles
        .mockReturnValueOnce(undefined) // requiredPermissions
        .mockReturnValueOnce(UserRole.CONTENT_EDITOR); // minimumRole

      const context = createMockExecutionContext({ role: 'content_editor' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user role is < minimum role', () => {
      mockReflector.getAllAndOverride
        .mockReturnValueOnce(undefined) // requiredRoles
        .mockReturnValueOnce(undefined) // requiredPermissions
        .mockReturnValueOnce(UserRole.ADMIN); // minimumRole

      const context = createMockExecutionContext({ role: 'user' });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('when @RequirePermissions decorator is used', () => {
    it('should allow access when user has all required permissions', () => {
      mockReflector.getAllAndOverride
        .mockReturnValueOnce(undefined) // requiredRoles
        .mockReturnValueOnce(['users:read'] as unknown as any[]) // requiredPermissions
        .mockReturnValueOnce(undefined); // minimumRole

      const context = createMockExecutionContext({ role: UserRole.ADMIN });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user lacks required permissions', () => {
      // Test with 'admins:create' permission which only super_admin has
      mockReflector.getAllAndOverride
        .mockReturnValueOnce(undefined) // requiredRoles
        .mockReturnValueOnce(['admins:create'] as unknown as any[]) // requiredPermissions - only super_admin has this
        .mockReturnValueOnce(undefined); // minimumRole

      const context = createMockExecutionContext({ role: UserRole.ADMIN });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow super_admin to access all permission-protected endpoints', () => {
      mockReflector.getAllAndOverride
        .mockReturnValueOnce(undefined) // requiredRoles
        .mockReturnValueOnce(['admins:create', 'admins:delete'] as any) // requiredPermissions
        .mockReturnValueOnce(undefined); // minimumRole

      const context = createMockExecutionContext({ role: 'super_admin' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('SuperAdminOnly decorator behavior', () => {
    it('should only allow super_admin access', () => {
      mockReflector.getAllAndOverride
        .mockReturnValueOnce([UserRole.SUPER_ADMIN]) // requiredRoles from @SuperAdminOnly()
        .mockReturnValueOnce(undefined) // requiredPermissions
        .mockReturnValueOnce(undefined); // minimumRole

      const superAdminContext = createMockExecutionContext({ role: 'super_admin' });
      expect(guard.canActivate(superAdminContext)).toBe(true);
    });

    it('should deny admin access to super_admin only endpoints', () => {
      mockReflector.getAllAndOverride
        .mockReturnValueOnce([UserRole.SUPER_ADMIN]) // requiredRoles from @SuperAdminOnly()
        .mockReturnValueOnce(undefined) // requiredPermissions
        .mockReturnValueOnce(undefined); // minimumRole

      const adminContext = createMockExecutionContext({ role: 'admin' });
      expect(() => guard.canActivate(adminContext)).toThrow(ForbiddenException);
    });
  });

  describe('AdminOnly decorator behavior', () => {
    it('should allow super_admin access', () => {
      mockReflector.getAllAndOverride
        .mockReturnValueOnce([UserRole.SUPER_ADMIN, UserRole.ADMIN]) // requiredRoles from @AdminOnly()
        .mockReturnValueOnce(undefined) // requiredPermissions
        .mockReturnValueOnce(undefined); // minimumRole

      const context = createMockExecutionContext({ role: 'super_admin' });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow admin access', () => {
      mockReflector.getAllAndOverride
        .mockReturnValueOnce([UserRole.SUPER_ADMIN, UserRole.ADMIN]) // requiredRoles from @AdminOnly()
        .mockReturnValueOnce(undefined) // requiredPermissions
        .mockReturnValueOnce(undefined); // minimumRole

      const context = createMockExecutionContext({ role: 'admin' });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny content_editor access', () => {
      mockReflector.getAllAndOverride
        .mockReturnValueOnce([UserRole.SUPER_ADMIN, UserRole.ADMIN]) // requiredRoles from @AdminOnly()
        .mockReturnValueOnce(undefined) // requiredPermissions
        .mockReturnValueOnce(undefined); // minimumRole

      const context = createMockExecutionContext({ role: 'content_editor' });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny user access', () => {
      mockReflector.getAllAndOverride
        .mockReturnValueOnce([UserRole.SUPER_ADMIN, UserRole.ADMIN]) // requiredRoles from @AdminOnly()
        .mockReturnValueOnce(undefined) // requiredPermissions
        .mockReturnValueOnce(undefined); // minimumRole

      const context = createMockExecutionContext({ role: 'user' });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
