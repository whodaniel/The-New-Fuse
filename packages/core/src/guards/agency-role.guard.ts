/**
 * Agency Role Guard - Validates user roles within agency context
 * Ensures users have appropriate permissions for agency operations
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@the-new-fuse/database';

@Injectable()
export class AgencyRoleGuard implements CanActivate {
  private readonly logger = new Logger(AgencyRoleGuard.name);

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!user.id) {
      throw new ForbiddenException('Access denied: No user found in request');
    }

    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const userRole = user.role;
    if (!userRole) {
      throw new ForbiddenException('Access denied: User role not found');
    }

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        `Access denied. User ${user.id} with role ${userRole} attempted to access resource requiring roles: ${requiredRoles.join(', ')}`
      );
    }

    const userPermissions = this.getPermissionsForRole(userRole);
    if (!userPermissions || typeof userPermissions !== 'object') {
      throw new ForbiddenException('Access denied: Invalid permissions configuration');
    }

    return true;
  }

  private getPermissionsForRole(role: string): any {
    const rolePermissions = {
      agents: {
        read: ['MASTER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'AGENCY_USER'],
        write: ['MASTER_ADMIN', 'AGENCY_ADMIN'],
        delete: ['MASTER_ADMIN'],
      },
      workspaces: {
        read: ['MASTER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER'],
        write: ['MASTER_ADMIN', 'AGENCY_ADMIN'],
        delete: ['MASTER_ADMIN', 'AGENCY_ADMIN'],
      },
      swarms: {
        read: ['MASTER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'AGENCY_USER'],
        write: ['MASTER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER'],
        delete: ['MASTER_ADMIN', 'AGENCY_ADMIN'],
      },
      services: {
        read: ['MASTER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'AGENCY_USER'],
        write: ['MASTER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER'],
        execute: ['MASTER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'AGENCY_USER'],
        delete: ['MASTER_ADMIN', 'AGENCY_ADMIN'],
      },
      providers: {
        read: ['MASTER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'AGENCY_USER'],
        write: ['MASTER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER'],
        request: ['MASTER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'AGENCY_USER'],
        delete: ['MASTER_ADMIN'],
      },
    };

    return rolePermissions;
  }
}