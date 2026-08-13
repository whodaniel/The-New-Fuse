import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { drizzleUserRepository } from '@the-new-fuse/database';

const MASTER_SUPER_ADMIN_EMAILS = (process.env.MASTER_SUPER_ADMIN_EMAILS || 'owner@example.com')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

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

    // Master Admin Bypass - owner@example.com has access to EVERYTHING
    if (user.email && MASTER_SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return true;
    }

    // Get user with roles from database
    const dbUser = await drizzleUserRepository.findById(user.id);

    if (!dbUser) {
      return false;
    }

    // SUPER_ADMIN Bypass
    if (
      dbUser.role === 'SUPER_ADMIN' ||
      (dbUser.roles && Array.isArray(dbUser.roles) && dbUser.roles.includes('SUPER_ADMIN'))
    ) {
      return true;
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
