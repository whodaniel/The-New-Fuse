var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
let AgentPermissionGuard = class AgentPermissionGuard {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id; // Assuming JWT guard attaches user to request
        let agentId = request.body?.agentId || request.params?.agentId;
        if (!userId) {
            // This should be handled by a preceding auth guard
            throw new ForbiddenException('User not authenticated.');
        }
        if (!agentId) {
            // If no agentId is specified, we can either deny or allow by default.
            // Denying is safer.
            return false;
        }
        const permission = await this.prisma.agentPermission.findUnique({
            where: {
                userId_agentId: {
                    userId,
                    agentId,
                },
            },
        });
        if (permission && permission.allowed) {
            return true;
        }
        throw new ForbiddenException('You do not have permission to use this agent.');
    }
};
AgentPermissionGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object])
], AgentPermissionGuard);
export { AgentPermissionGuard };
//# sourceMappingURL=agent-permission.guard.js.map