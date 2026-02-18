import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { drizzleUserRepository } from '@the-new-fuse/database';

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
    if (user.email && user.email.toLowerCase() === 'owner@example.com') {
      return true;
    }

    // Get user with roles from database
    const dbUser = await drizzleUserRepository.findById(user.id);

    if (!dbUser) {
      return false;
    }

    // Normalize required roles to uppercase for comparison
    const requiredRoles = roles.map(role => role.toUpperCase());
    
    // Normalize user roles
    const userRole = dbUser.role ? dbUser.role.toUpperCase() : '';
    const userRoles = dbUser.roles && Array.isArray(dbUser.roles) 
      ? dbUser.roles.map((r: string) => r.toUpperCase()) 
      : [];

    // SUPER_ADMIN Bypass
    if (userRole === 'SUPER_ADMIN' || userRoles.includes('SUPER_ADMIN')) {
      return true;
    }

    // Check primary role
    if (requiredRoles.includes(userRole)) {
      return true;
    }

    // Check roles array
    if (userRoles.some((r: string) => requiredRoles.includes(r))) {
      return true;
    }

    return false;
  }
}
