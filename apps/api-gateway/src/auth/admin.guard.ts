import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * AdminGuard restricts access to admin-only endpoints.
 * Must run after GatewayAuthGuard, which populates request.user.
 * Allows users whose role (or roles array) includes 'SUPER_ADMIN' or 'ADMIN'.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const userRoles = Array.isArray(user.roles) ? user.roles : user.role ? [user.role] : [];
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];

    const hasAdminAccess = userRoles.some(
      (role: unknown) => typeof role === 'string' && adminRoles.includes(role.toUpperCase())
    );

    if (!hasAdminAccess) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
