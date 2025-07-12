/**
 * Agency Role Guard - Validates user roles within agency context
 * Ensures users have appropriate permissions for agency operations
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgencyRoleGuard_1;
import { Injectable, ForbiddenException, Logger, } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@the-new-fuse/database';
let AgencyRoleGuard = AgencyRoleGuard_1 = class AgencyRoleGuard {
    reflector;
    prisma;
    logger = new Logger(AgencyRoleGuard_1.name);
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }
        if (!user.id) {
            throw new ForbiddenException('Access denied: No user found in request');
        }
        const requiredRoles = this.reflector.get('roles', context.getHandler());
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }
        const userRole = user.role;
        if (!userRole) {
            throw new ForbiddenException('Access denied: User role not found');
        }
        if (!requiredRoles.includes(userRole)) {
            throw new ForbiddenException(`Access denied. User ${user.id} with role ${userRole} attempted to access resource requiring roles: ${requiredRoles.join(', ')}`);
        }
        const userPermissions = this.getPermissionsForRole(userRole);
        if (!userPermissions || typeof userPermissions !== 'object') {
            throw new ForbiddenException('Access denied: Invalid permissions configuration');
        }
        return true;
    }
    getPermissionsForRole(role) {
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
};
AgencyRoleGuard = AgencyRoleGuard_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Reflector,
        PrismaService])
], AgencyRoleGuard);
export { AgencyRoleGuard };
