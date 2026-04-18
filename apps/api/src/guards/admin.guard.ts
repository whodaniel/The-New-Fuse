import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Support both single role field and roles array
    const userRoles = Array.isArray(user.roles) ? user.roles : [user.role];
    const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'AGENCY_OWNER', 'AGENCY_ADMIN', 'AGENCY_MANAGER'];

    const hasAdminAccess = userRoles.some((role: string) =>
      adminRoles.includes(role?.toUpperCase())
    );

    if (!hasAdminAccess) {
      throw new UnauthorizedException('Admin access required');
    }

    return true;
  }
}
