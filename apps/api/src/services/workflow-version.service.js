var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WorkflowVersionService_1;
var _a, _b;
import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import { VersionChangeType } from '@the-new-fuse/database';
import { AuditService } from '../security/audit.service';
let WorkflowVersionService = WorkflowVersionService_1 = class WorkflowVersionService {
    prisma;
    auditService;
    logger = new Logger(WorkflowVersionService_1.name);
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    /**
     * Create a new version of a workflow
     */
    async createVersion(dto) {
        const { workflowId, changeLog, changeType = VersionChangeType.MINOR, semanticVersion, userId, userEmail } = dto;
        // Get the current workflow
        const workflow = await this.prisma.workflow.findUnique({
            where: { id: workflowId },
            include: { versions: true }
        }); // Cast to any since Prisma types are outdated
        if (!workflow) {
            throw new NotFoundException(`Workflow with ID ${workflowId} not found`);
        }
        // Calculate next version number
        const latestVersion = workflow.versions.length > 0
            ? Math.max(...workflow.versions.map((v) => v.version))
            : 0;
        const nextVersion = latestVersion + 1;
        return await this.prisma.$transaction(async (prisma) => {
            // Deactivate all previous versions
            await prisma.workflowVersion.updateMany({
                where: { workflowId, isActive: true },
                data: { isActive: false }
            });
            // Create new version with current workflow state
            const newVersion = await prisma.workflowVersion.create({
                data: {
                    workflowId,
                    version: nextVersion,
                    semanticVersion,
                    name: workflow.name,
                    description: workflow.description,
                    definition: workflow.definition,
                    metadata: workflow.metadata,
                    variables: workflow.variables,
                    triggers: workflow.triggers,
                    status: workflow.status,
                    isActive: true,
                    changeLog,
                    changeType,
                    createdById: userId,
                },
                include: {
                    createdBy: {
                        select: { id: true, name: true, email: true }
                    }
                }
            });
            // Log the version creation
            await this.auditService.logWorkflowVersioning('create', workflowId, nextVersion.toString(), userId, undefined, {
                semanticVersion,
                changeType,
                changeLog,
                previousVersion: latestVersion,
                userEmail: userEmail || 'unknown'
            });
            this.logger.log(`Created version ${nextVersion} for workflow ${workflowId}`);
            return newVersion;
        });
    }
    /**
     * Get all versions of a workflow with optional diff information
     */
    async getWorkflowVersions(workflowId, includeDiff = false) {
        const versions = await this.prisma.workflowVersion.findMany({
            where: { workflowId },
            include: {
                createdBy: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { version: 'desc' }
        });
        if (!includeDiff) {
            return versions.map((version) => ({
                id: version.id,
                version: version.version,
                semanticVersion: version.semanticVersion ?? undefined,
                changeLog: version.changeLog ?? undefined,
                changeType: version.changeType,
                isActive: version.isActive,
                createdAt: version.createdAt,
                createdBy: version.createdBy ? {
                    id: version.createdBy.id,
                    name: version.createdBy.name ?? undefined,
                    email: version.createdBy.email
                } : undefined
            }));
        }
        // Calculate diffs between consecutive versions
        const versionsWithDiff = [];
        for (let i = 0; i < versions.length; i++) {
            const currentVersion = versions[i];
            const previousVersion = versions[i + 1]; // Next in array (older version)
            let diff = undefined;
            if (previousVersion) {
                diff = this.calculateDiff(previousVersion.definition, currentVersion.definition);
            }
            versionsWithDiff.push({
                id: currentVersion.id,
                version: currentVersion.version,
                semanticVersion: currentVersion.semanticVersion ?? undefined,
                changeLog: currentVersion.changeLog ?? undefined,
                changeType: currentVersion.changeType,
                isActive: currentVersion.isActive,
                createdAt: currentVersion.createdAt,
                createdBy: currentVersion.createdBy ? {
                    id: currentVersion.createdBy.id,
                    name: currentVersion.createdBy.name ?? undefined,
                    email: currentVersion.createdBy.email
                } : undefined,
                diff
            });
        }
        return versionsWithDiff;
    }
    /**
     * Rollback to a specific version
     */
    async rollbackToVersion(dto) {
        const { workflowId, targetVersion, reason, userId, userEmail } = dto;
        // Get the target version
        const targetVersionRecord = await this.prisma.workflowVersion.findFirst({
            where: { workflowId, version: targetVersion }
        });
        if (!targetVersionRecord) {
            throw new NotFoundException(`Version ${targetVersion} not found for workflow ${workflowId}`);
        }
        // Get current active version for audit trail
        const currentActiveVersion = await this.prisma.workflowVersion.findFirst({
            where: { workflowId, isActive: true }
        });
        return await this.prisma.$transaction(async (prisma) => {
            // Update the workflow with the target version's data
            await prisma.workflow.update({
                where: { id: workflowId },
                data: {
                    name: targetVersionRecord.name,
                    description: targetVersionRecord.description,
                    definition: targetVersionRecord.definition,
                    metadata: targetVersionRecord.metadata,
                    variables: targetVersionRecord.variables,
                    triggers: targetVersionRecord.triggers,
                    status: targetVersionRecord.status,
                    updatedAt: new Date()
                }
            });
            // Deactivate all versions
            await prisma.workflowVersion.updateMany({
                where: { workflowId, isActive: true },
                data: { isActive: false }
            });
            // Create a new version entry for the rollback
            const latestVersion = await prisma.workflowVersion.findFirst({
                where: { workflowId },
                orderBy: { version: 'desc' }
            });
            const rollbackVersion = await prisma.workflowVersion.create({
                data: {
                    workflowId,
                    version: (latestVersion?.version || 0) + 1,
                    name: targetVersionRecord.name,
                    description: targetVersionRecord.description,
                    definition: targetVersionRecord.definition,
                    metadata: targetVersionRecord.metadata,
                    variables: targetVersionRecord.variables,
                    triggers: targetVersionRecord.triggers,
                    status: targetVersionRecord.status,
                    isActive: true,
                    changeLog: `Rolled back to version ${targetVersion}${reason ? `: ${reason}` : ''}`,
                    changeType: VersionChangeType.HOTFIX,
                    createdById: userId,
                    rolledBackFromId: currentActiveVersion?.id,
                    rollbackReason: reason
                },
                include: {
                    createdBy: {
                        select: { id: true, name: true, email: true }
                    }
                }
            });
            // Log the rollback
            await this.auditService.logWorkflowVersioning('rollback', workflowId, rollbackVersion.version.toString(), userId, undefined, {
                targetVersion,
                fromVersion: currentActiveVersion?.version,
                reason,
                rolledBackFromId: currentActiveVersion?.id,
                userEmail: userEmail || 'unknown'
            });
            this.logger.log(`Rolled back workflow ${workflowId} to version ${targetVersion}, created new version ${rollbackVersion.version}`);
            return rollbackVersion;
        });
    }
    /**
     * Get a specific version
     */
    async getVersion(workflowId, version) {
        const versionRecord = await this.prisma.workflowVersion.findFirst({
            where: { workflowId, version },
            include: {
                createdBy: {
                    select: { id: true, name: true, email: true }
                },
                rolledBackFrom: {
                    select: { id: true, version: true }
                }
            }
        });
        if (!versionRecord) {
            throw new NotFoundException(`Version ${version} not found for workflow ${workflowId}`);
        }
        return versionRecord;
    }
    /**
     * Compare two versions
     */
    async compareVersions(workflowId, version1, version2) {
        const [v1, v2] = await Promise.all([
            this.prisma.workflowVersion.findFirst({
                where: { workflowId, version: version1 }
            }),
            this.prisma.workflowVersion.findFirst({
                where: { workflowId, version: version2 }
            })
        ]);
        if (!v1 || !v2) {
            throw new NotFoundException('One or both versions not found');
        }
        const diff = this.calculateDiff(v1.definition, v2.definition);
        return {
            version1: { version: version1, definition: v1.definition },
            version2: { version: version2, definition: v2.definition },
            diff
        };
    }
    /**
     * Delete a version (soft delete for safety)
     */
    async deleteVersion(workflowId, version, userId, userEmail) {
        const versionRecord = await this.prisma.workflowVersion.findFirst({
            where: { workflowId, version }
        });
        if (!versionRecord) {
            throw new NotFoundException(`Version ${version} not found for workflow ${workflowId}`);
        }
        if (versionRecord.isActive) {
            throw new ConflictException('Cannot delete the active version');
        }
        // For safety, we don't actually delete - we could add a deletedAt field
        // Instead, we'll just log the deletion attempt
        await this.auditService.logWorkflowVersioning('delete', workflowId, version.toString(), userId, undefined, {
            versionId: versionRecord.id,
            userEmail: userEmail || 'unknown'
        });
        this.logger.warn(`Version deletion attempted for workflow ${workflowId} version ${version} by user ${userId}`);
        throw new BadRequestException('Version deletion is not currently supported for safety reasons');
    }
    /**
     * Get version statistics
     */
    async getVersionStats(workflowId) {
        const stats = await this.prisma.workflowVersion.aggregate({
            where: { workflowId },
            _count: { id: true },
            _sum: { version: true }
        });
        const changeTypeBreakdown = await this.prisma.workflowVersion.groupBy({
            by: ['changeType'],
            where: { workflowId },
            _count: { changeType: true }
        });
        const activeVersion = await this.prisma.workflowVersion.findFirst({
            where: { workflowId, isActive: true },
            select: { version: true, createdAt: true }
        });
        return {
            totalVersions: stats._count.id,
            totalVersionSum: stats._sum.version || 0,
            activeVersion: activeVersion?.version,
            activeVersionCreatedAt: activeVersion?.createdAt,
            changeTypeBreakdown: changeTypeBreakdown.reduce((acc, item) => {
                acc[item.changeType] = item._count.changeType;
                return acc;
            }, {})
        };
    }
    /**
     * Calculate diff between two workflow definitions
     */
    calculateDiff(oldDef, newDef) {
        const diff = { added: [], removed: [], modified: [] };
        if (!oldDef || !newDef) {
            return diff;
        }
        // Simple diff for workflow steps (this could be enhanced)
        const oldSteps = oldDef.steps || {};
        const newSteps = newDef.steps || {};
        // Find added steps
        for (const stepId in newSteps) {
            if (!(stepId in oldSteps)) {
                diff.added.push({ type: 'step', id: stepId, step: newSteps[stepId] });
            }
        }
        // Find removed steps
        for (const stepId in oldSteps) {
            if (!(stepId in newSteps)) {
                diff.removed.push({ type: 'step', id: stepId, step: oldSteps[stepId] });
            }
        }
        // Find modified steps (basic comparison)
        for (const stepId in newSteps) {
            if (stepId in oldSteps) {
                if (JSON.stringify(oldSteps[stepId]) !== JSON.stringify(newSteps[stepId])) {
                    diff.modified.push({
                        type: 'step',
                        id: stepId,
                        oldStep: oldSteps[stepId],
                        newStep: newSteps[stepId]
                    });
                }
            }
        }
        return diff;
    }
};
WorkflowVersionService = WorkflowVersionService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object, typeof (_b = typeof AuditService !== "undefined" && AuditService) === "function" ? _b : Object])
], WorkflowVersionService);
export { WorkflowVersionService };
//# sourceMappingURL=workflow-version.service.js.map