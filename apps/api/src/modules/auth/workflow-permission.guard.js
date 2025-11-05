var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WorkflowPermissionGuard_1;
var _a, _b;
import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import { AuditService } from '../../security/audit.service';
import { AuditAction } from '@prisma/client';
let WorkflowPermissionGuard = WorkflowPermissionGuard_1 = class WorkflowPermissionGuard {
    prisma;
    auditService;
    logger = new Logger(WorkflowPermissionGuard_1.name);
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id; // Assuming JWT guard attaches user
        if (!userId) {
            throw new ForbiddenException('User not authenticated.');
        }
        const workflowDefinition = request.body?.workflowDefinition || (await this.loadWorkflowByName(request.body?.workflowName));
        if (!workflowDefinition) {
            // If no workflow is defined, let the controller handle the bad request.
            return true;
        }
        // Extract all unique agent names (which are their IDs in this architecture)
        const agentIds = new Set();
        if (workflowDefinition.steps) {
            for (const step of Object.values(workflowDefinition.steps)) {
                if (step.agent_name) {
                    agentIds.add(step.agent_name);
                }
            }
        }
        if (agentIds.size === 0) {
            // No agents to check, so the workflow is allowed to proceed.
            return true;
        }
        const agentIdArray = Array.from(agentIds);
        // Check permissions for all required agents in a single query
        const permissions = await this.prisma.agentPermission.findMany({
            where: {
                userId: userId,
                agentId: { in: agentIdArray },
                allowed: true,
            },
        });
        const allowedAgentIds = new Set(permissions.map(p => p.agentId));
        // Check if the user has permission for every agent in the workflow
        for (const requiredAgentId of agentIdArray) {
            if (!allowedAgentIds.has(requiredAgentId)) {
                this.logger.warn(`User ${userId} denied access to workflow due to missing permission for agent: ${requiredAgentId}`);
                // Log unauthorized access attempt
                await this.auditService.logSecurityEvent(AuditAction.UNAUTHORIZED_ACCESS, userId, request.user?.email, request.ip || request.connection?.remoteAddress, request.get('user-agent'), {
                    resource: 'workflow',
                    workflowDefinition: workflowDefinition.workflow_name,
                    deniedAgent: requiredAgentId,
                    attemptedAgents: agentIdArray,
                });
                throw new ForbiddenException(`You do not have permission to use the agent '${requiredAgentId}' in this workflow.`);
            }
        }
        // Log successful workflow access
        await this.auditService.logWorkflowExecution(workflowDefinition.workflow_name || 'anonymous_workflow', userId, request.user?.email, AuditAction.WORKFLOW_EXECUTED, agentIdArray);
        return true;
    }
    async loadWorkflowByName(name) {
        if (!name)
            return null;
        const workflow = await this.prisma.workflow.findFirst({
            where: { name, status: 'ACTIVE' },
        });
        return workflow?.definition;
    }
};
WorkflowPermissionGuard = WorkflowPermissionGuard_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object, typeof (_b = typeof AuditService !== "undefined" && AuditService) === "function" ? _b : Object])
], WorkflowPermissionGuard);
export { WorkflowPermissionGuard };
//# sourceMappingURL=workflow-permission.guard.js.map