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
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class AgencyRoleGuard implements CanActivate {
  private readonly logger = new Logger(AgencyRoleGuard.name);

  constructor(
    private reflector: Reflector,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No role requirement specified
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantContext = request.tenantContext;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!tenantContext) {
      throw new ForbiddenException('Tenant context not available');
    }

    try {
      // Get user's role within the agency context
      const userRole = await this.getUserAgencyRole(user.id, tenantContext.agencyId);
      
      if (!userRole) {
        throw new ForbiddenException('User not associated with this agency');
      }

      // Check if user has any of the required roles
      const hasPermission = this.checkRolePermission(userRole, requiredRoles);
      
      if (!hasPermission) {
        this.logger.warn(
          `Access denied. User ${user.id} with role ${userRole} attempted to access resource requiring roles: ${requiredRoles.join(', ')}`
        );
        throw new ForbiddenException('Insufficient permissions for this operation');
      }

      this.logger.debug(`Access granted. User ${user.id} with role ${userRole}`);
      
      // Add user role to request for further use
      request.userRole = userRole;
      
      return true;
    } catch (error) {
      this.logger.error(`Role guard error: ${error.message}`);
      throw error;
    }
  }

  private async getUserAgencyRole(userId: string, agencyId: string): Promise<string | null> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: userId,
          agencyId: agencyId
        },
        select: {
          role: true,
          permissions: true
        }
      });

      return user?.role || null;
    } catch (error) {
      this.logger.error(`Error fetching user agency role: ${error.message}`);
      return null;
    }
  }

  private checkRolePermission(userRole: string, requiredRoles: string[]): boolean {
    // Define role hierarchy (higher roles inherit lower role permissions)
    const roleHierarchy = {
      MASTER_ADMIN: 100,
      AGENCY_ADMIN: 80,
      AGENCY_MANAGER: 60,
      AGENCY_USER: 40,
      AGENCY_VIEWER: 20
    };

    const userRoleLevel = roleHierarchy[userRole] || 0;

    // Check if user has any of the required roles or higher
    return requiredRoles.some(requiredRole => {
      const requiredLevel = roleHierarchy[requiredRole] || 0;
      return userRoleLevel >= requiredLevel;
    });
  }

  /**
   * Additional permission checking methods
   */

  private hasSpecificPermission(userPermissions: any, permission: string): boolean {
    if (!userPermissions || typeof userPermissions !== 'object') {
      return false;
    }

    return userPermissions[permission] === true;
  }

  private canAccessResource(userRole: string, resourceType: string, operation: string): boolean {
    // Define resource-specific permissions
    const resourcePermissions = {
      agency: {
        read: ['MASTER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'AGENCY_USER'],
        write: ['MASTER_ADMIN', 'AGENCY_ADMIN'],
        delete: ['MASTER_ADMIN']
      },
      users: {
        read: ['MASTER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER'],
        write: ['MASTER_ADMIN', 'AGENCY_ADMIN'],
        delete: ['MASTER_ADMIN', 'AGENCY_ADMIN']
      },
      agents: {
        read: ['MASTER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'AGENCY_USER'],
        write: ['MASTER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER'],
        delete: ['MASTER_ADMIN', 'AGENCY_ADMIN']
      },
      swarm: {
        read: ['MASTER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'AGENCY_USER'],
        write: ['MASTER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER'],
        execute: ['MASTER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'AGENCY_USER'],
        delete: ['MASTER_ADMIN', 'AGENCY_ADMIN']
      },
      services: {
        read: ['MASTER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'AGENCY_USER'],
        write: ['MASTER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER'],
        request: ['MASTER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'AGENCY_USER'],
        delete: ['MASTER_ADMIN', 'AGENCY_ADMIN']
      }
    };

    const allowedRoles = resourcePermissions[resourceType]?.[operation] || [];
    return allowedRoles.includes(userRole);
  }
}
