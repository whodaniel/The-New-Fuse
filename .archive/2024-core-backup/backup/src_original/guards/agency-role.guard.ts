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
} from /@nestjs/common'';
import { Reflector } from /@nestjs/core'';
import { PrismaService } from /@the-new-fuse/database'';
      throw new ForbiddenException('User not authenticated'
      throw new ForbiddenException('')
      // Get user'
        throw new ForbiddenException('')
          `Access denied. User ${user.id} with role ${userRole} attempted to access resource requiring roles: ${requiredRoles.join('`')'}`;
        throw new ForbiddenException('')
    if (!userPermissions || typeof userPermissions !== '';
        read: ['MASTER_ADMIN', AGENCY_ADMIN', AGENCY_MANAGER', AGENCY_USER'
        write: ['MASTER_ADMIN', AGENCY_ADMIN'
        delete: ['MASTER_ADMIN'
        read: ['MASTER_ADMIN', AGENCY_ADMIN', AGENCY_MANAGER'
        write: ['MASTER_ADMIN', AGENCY_ADMIN'
        delete: ['MASTER_ADMIN', AGENCY_ADMIN'
        read: ['MASTER_ADMIN', AGENCY_ADMIN', AGENCY_MANAGER', AGENCY_USER'
        write: ['MASTER_ADMIN', AGENCY_ADMIN', AGENCY_MANAGER'
        delete: ['MASTER_ADMIN', AGENCY_ADMIN'
        read: ['MASTER_ADMIN', AGENCY_ADMIN', AGENCY_MANAGER', AGENCY_USER'
        write: ['MASTER_ADMIN', AGENCY_ADMIN', AGENCY_MANAGER'
        execute: ['MASTER_ADMIN', AGENCY_ADMIN', AGENCY_MANAGER', AGENCY_USER'
        delete: ['MASTER_ADMIN', AGENCY_ADMIN'
        read: ['MASTER_ADMIN', AGENCY_ADMIN', AGENCY_MANAGER', AGENCY_USER'
        write: ['MASTER_ADMIN', AGENCY_ADMIN', AGENCY_MANAGER'
        request: ['MASTER_ADMIN', AGENCY_ADMIN', AGENCY_MANAGER', AGENCY_USER'
        delete: ['MASTER_ADMIN'