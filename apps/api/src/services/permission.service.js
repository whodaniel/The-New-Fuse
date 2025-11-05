var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import { AuditService } from '../security/audit.service';
let PermissionService = class PermissionService {
    prisma;
    auditService;
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async getUserPermissions(userId) {
        const permissions = await this.prisma.agentPermission.findMany({
            where: { userId },
            select: {
                agentId: true,
            },
        });
        return { allowedAgentIds: permissions.map(p => p.agentId) };
    }
    async updateUserPermissions(userId, agentIds, adminUserId, adminUserEmail, ipAddress) {
        // Get current permissions for audit logging
        const currentPermissions = await this.prisma.agentPermission.findMany({
            where: { userId },
            select: { agentId: true },
        });
        const currentAgentIds = currentPermissions.map(p => p.agentId);
        // Start a transaction to ensure atomicity
        const result = await this.prisma.$transaction(async (prisma) => {
            // First, delete all existing permissions for the user
            await prisma.agentPermission.deleteMany({
                where: { userId },
            });
            // Then, create the new permissions
            if (agentIds && agentIds.length > 0) {
                await prisma.agentPermission.createMany({
                    data: agentIds.map(agentId => ({
                        userId,
                        agentId,
                        allowed: true,
                    })),
                });
            }
        });
        // Log audit events for permission changes
        if (adminUserId && adminUserEmail) {
            // Log revoked permissions
            const revokedAgents = currentAgentIds.filter(id => !agentIds.includes(id));
            for (const agentId of revokedAgents) {
                await this.auditService.logPermissionChange('revoke', userId, agentId, `agent:${agentId}`, { adminUserId, adminUserEmail, ipAddress });
            }
            // Log granted permissions
            const grantedAgents = agentIds.filter(id => !currentAgentIds.includes(id));
            for (const agentId of grantedAgents) {
                await this.auditService.logPermissionChange('grant', userId, agentId, `agent:${agentId}`, { adminUserId, adminUserEmail, ipAddress });
            }
        }
        return result;
    }
    async getAllAgents() {
        return this.prisma.agent.findMany({
            select: {
                id: true,
                name: true,
                description: true,
            }
        });
    }
};
PermissionService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object, typeof (_b = typeof AuditService !== "undefined" && AuditService) === "function" ? _b : Object])
], PermissionService);
export { PermissionService };
//# sourceMappingURL=permission.service.js.map