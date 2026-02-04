import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, hasMinimumRole, hasPermission, Permission } from '@/modules/users/dto';

// ============================================
// Roles Decorator Keys
// ============================================
export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const MINIMUM_ROLE_KEY = 'minimumRole';

// ============================================
// Roles Guard
// ============================================
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Get required permissions from decorator
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Get minimum role from decorator
    const minimumRole = this.reflector.getAllAndOverride<UserRole>(MINIMUM_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no role/permission requirements, allow access
    if (!requiredRoles && !requiredPermissions && !minimumRole) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('Access denied: No role assigned');
    }

    const userRole = user.role as UserRole;

    // Check required roles (user must have one of the specified roles)
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.includes(userRole);
      if (!hasRole) {
        throw new ForbiddenException(
          `Access denied: Requires one of these roles: ${requiredRoles.join(', ')}`,
        );
      }
    }

    // Check minimum role (user role must be >= required role in hierarchy)
    if (minimumRole) {
      if (!hasMinimumRole(userRole, minimumRole)) {
        throw new ForbiddenException(`Access denied: Requires at least ${minimumRole} role`);
      }
    }

    // Check required permissions (user must have all specified permissions)
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every((permission) =>
        hasPermission(userRole, permission),
      );
      if (!hasAllPermissions) {
        throw new ForbiddenException(
          `Access denied: Missing required permissions: ${requiredPermissions.join(', ')}`,
        );
      }
    }

    return true;
  }
}
