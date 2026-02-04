import { SetMetadata } from '@nestjs/common';
import { UserRole, Permission } from '@/modules/users/dto';
import { ROLES_KEY, PERMISSIONS_KEY, MINIMUM_ROLE_KEY } from '@/common/guards/roles.guard';

// ============================================
// Role-Based Access Control Decorators
// ============================================

/**
 * Requires user to have one of the specified roles
 * @example @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Requires user to have all specified permissions
 * @example @RequirePermissions('users:read', 'users:update')
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Requires user role to be at least the specified level
 * @example @MinimumRole(UserRole.CONTENT_EDITOR)
 */
export const MinimumRole = (role: UserRole) => SetMetadata(MINIMUM_ROLE_KEY, role);

/**
 * Shorthand for SUPER_ADMIN only endpoints
 */
export const SuperAdminOnly = () => Roles(UserRole.SUPER_ADMIN);

/**
 * Shorthand for ADMIN or higher endpoints
 */
export const AdminOnly = () => Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN);

/**
 * Shorthand for CONTENT_EDITOR or higher endpoints
 */
export const EditorOnly = () =>
  Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_EDITOR);
