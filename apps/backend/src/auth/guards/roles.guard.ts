import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { drizzleUserRepository } from '@the-new-fuse/database/drizzle';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Get user with roles from database
    const dbUser = await drizzleUserRepository.findById(user.id);

    if (!dbUser) {
      return false;
    }

    // Check primary role
    if (roles.includes(dbUser.role)) {
      return true;
    }

    // Check roles array if it exists (schema has both role and roles)
    if (dbUser.roles && Array.isArray(dbUser.roles)) {
      return dbUser.roles.some((r: string) => roles.includes(r));
    }

    return false;
  }
}
