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
var _a, _b, _c;
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import { AuditService } from '../../services/audit.service';
import { MetricsService } from '../../services/metrics.service';
import { v4 as uuidv4 } from 'uuid';
let WorkflowVersionService = WorkflowVersionService_1 = class WorkflowVersionService {
    prismaService;
    auditService;
    metricsService;
    logger = new Logger(WorkflowVersionService_1.name);
    maxVersionsPerWorkflow = 50;
    constructor(prismaService, auditService, metricsService) {
        this.prismaService = prismaService;
        this.auditService = auditService;
        this.metricsService = metricsService;
    }
    async createVersion(createVersionDto, userId) {
        const startTime = Date.now();
        try {
            // Validate workflow exists and user has access
            const workflow = await this.getWorkflowWithAccess(createVersionDto.workflowId, userId);
            // Get latest version number
            const latestVersion = await this.getLatestVersion(createVersionDto.workflowId);
            const newVersionNumber = this.incrementVersion(latestVersion?.version || '0.0.0');
            // Create new version
            const newVersion = {
                id: uuidv4(),
                workflowId: createVersionDto.workflowId,
                version: newVersionNumber,
                definition: createVersionDto.definition,
                metadata: createVersionDto.metadata || {},
                changelog: createVersionDto.changelog,
                createdBy: userId,
                createdAt: new Date(),
                isActive: false,
                isPublished: createVersionDto.isPublished || false,
                parentVersionId: latestVersion?.id
            };
            // Save version (mock implementation)
            const savedVersion = await this.saveVersion(newVersion);
            // Clean up old versions if needed
            await this.cleanupOldVersions(createVersionDto.workflowId);
            // Update workflow if this is the active version
            if (createVersionDto.isPublished) {
                await this.updateWorkflowActiveVersion(createVersionDto.workflowId, savedVersion.id);
                savedVersion.isActive = true;
            }
            // Record metrics
            this.metricsService.recordQuery('createWorkflowVersion', Date.now() - startTime);
            this.metricsService.recordUserAction(userId, 'CREATE_WORKFLOW_VERSION');
            // Log audit event
            await this.auditService.logEvent({
                action: 'CREATE_WORKFLOW_VERSION',
                userId,
                metadata: {
                    workflowId: createVersionDto.workflowId,
                    workflowName: workflow.name,
                    versionId: savedVersion.id,
                    version: newVersionNumber,
                    changelog: createVersionDto.changelog,
                    isPublished: createVersionDto.isPublished
                }
            });
            this.logger.log(`Created workflow version ${newVersionNumber} for workflow ${createVersionDto.workflowId});

      return savedVersion;

    } catch (error) {`, this.logger.error(Error, creating, workflow, version, `, error);
      this.metricsService.recordError('createWorkflowVersion', error);
      throw error;
    }
  }

  async getVersions(workflowId: string, userId: string): Promise<WorkflowVersion[]> {
    try {
      // Validate workflow access
      await this.getWorkflowWithAccess(workflowId, userId);

      // Get versions (mock implementation)
      const versions = await this.getWorkflowVersions(workflowId);

      return versions.sort((a, b) => {
        // Sort by version number (descending)
        const versionCompare = this.compareVersionStrings(b.version, a.version);
        if (versionCompare !== 0) return versionCompare;
        
        // If same version, sort by creation date (descending)
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

    } catch (error) {
      this.logger.error(Error getting workflow versions:, error);
      throw error;
    }
  }

  async getVersion(versionId: string, userId: string): Promise<WorkflowVersion> {
    try {
      const version = await this.getVersionById(versionId);
      
      if (!version) {
        throw new NotFoundException(Version with ID ${versionId}`, not, found));
        }
        // Validate workflow access
        finally {
        }
        // Validate workflow access
        await this.getWorkflowWithAccess(version.workflowId, userId);
        return version;
    }
    catch(error) {
        this.logger.error(Error, getting, workflow, version, error);
        throw error;
    }
};
WorkflowVersionService = WorkflowVersionService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object, typeof (_b = typeof AuditService !== "undefined" && AuditService) === "function" ? _b : Object, typeof (_c = typeof MetricsService !== "undefined" && MetricsService) === "function" ? _c : Object])
], WorkflowVersionService);
export { WorkflowVersionService };
async;
rollbackWorkflow(workflowId, string, options, RollbackOptions, userId, string);
Promise < { workflow: any, version: WorkflowVersion } > {
    const: startTime = Date.now(),
    try: {
        // Validate workflow access
        const: workflow = await this.getWorkflowWithAccess(workflowId, userId),
        // Get target version
        const: targetVersion = await this.getVersionById(options.versionId),
        if(, targetVersion) { }
    } || targetVersion.workflowId !== workflowId
};
{
    throw new NotFoundException(Version, $, { options, : .versionId }, not, found);
    for (workflow; $; { workflowId })
        ;
}
// Create backup if requested
let backupVersion = null;
if (options.createBackup) {
    backupVersion = await this.createVersion({} `
          workflowId,`, definition, workflow.definition, `
          changelog: Automatic backup before rollback to version ${targetVersion.version}: ${options.reason},
          metadata: { rollbackReason: options.reason, backupDate: new Date() },
          isPublished: false
        }, userId);
      }

      // Update workflow with rolled-back definition
      const updatedWorkflow = await this.updateWorkflowDefinition(workflowId, targetVersion.definition);

      // Update active version
      await this.updateWorkflowActiveVersion(workflowId, targetVersion.id);

      // Deactivate all other versions
      await this.deactivateAllVersions(workflowId, targetVersion.id);
      
      // Activate the rolled-back version
      await this.activateVersion(targetVersion.id);

      // Record metrics
      this.metricsService.recordQuery('rollbackWorkflow', Date.now() - startTime);
      this.metricsService.recordUserAction(userId, 'ROLLBACK_WORKFLOW');

      // Log audit event
      await this.auditService.logEvent({
        action: 'ROLLBACK_WORKFLOW',
        userId,
        metadata: {
          workflowId,
          workflowName: workflow.name,
          targetVersionId: options.versionId,
          targetVersion: targetVersion.version,
          reason: options.reason,
          backupVersionId: backupVersion?.id,
          backupCreated: !!backupVersion
        }`);
}
;
`
`;
this.logger.log(Rolled, back, workflow, $, { workflowId }, to, version, $, { targetVersion, : .version });
return {
    workflow: updatedWorkflow,
    version: targetVersion
};
`
`;
try { }
catch (error) {
    `
      this.logger.error(Error rolling back workflow:, error);
      this.metricsService.recordError('rollbackWorkflow', error);
      throw error;
    }
  }

  async compareVersions(versionId1: string, versionId2: string, userId: string): Promise<{
    version1: WorkflowVersion;
    version2: WorkflowVersion;
    differences: any;
  }> {
    try {
      const version1 = await this.getVersion(versionId1, userId);
      const version2 = await this.getVersion(versionId2, userId);

      const differences = this.compareDefinitions(version1.definition, version2.definition);

      return {
        version1,
        version2,
        differences
      };

    } catch (error) {
      this.logger.error(Error comparing workflow versions:, error);
      throw error;
    }
  }

  async deleteVersion(versionId: string, userId: string): Promise<void> {
    try {
      const version = await this.getVersion(versionId, userId);

      // Prevent deletion of active versions
      if (version.isActive) {
        throw new BadRequestException('Cannot delete active workflow version');
      }

      // Delete version (mock implementation)
      await this.deleteVersionById(versionId);

      // Log audit event
      await this.auditService.logEvent({
        action: 'DELETE_WORKFLOW_VERSION',
        userId,
        metadata: {
          workflowId: version.workflowId,
          versionId: version.id,
          version: version.version
        }
      });

      this.logger.log(Deleted workflow version ${version.version} (${versionId}`;
    ;
}
try { }
catch (error) {
    this.logger.error(Error, deleting, workflow, version, error);
    throw error;
}
async;
publishVersion(versionId, string, userId, string);
Promise < WorkflowVersion > {
    try: {
        const: version = await this.getVersion(versionId, userId),
        // Deactivate current active version
        await, this: .deactivateAllVersions(version.workflowId, versionId),
        // Activate this version
        await, this: .activateVersion(versionId),
        version, : .isActive = true,
        version, : .isPublished = true,
        // Update workflow
        await, this: .updateWorkflowDefinition(version.workflowId, version.definition),
        await, this: .updateWorkflowActiveVersion(version.workflowId, versionId),
        // Log audit event
        await, this: .auditService.logEvent({
            action: 'PUBLISH_WORKFLOW_VERSION',
            userId,
            metadata: {
                workflowId: version.workflowId,
                versionId: version.id,
                version: version.version
            }
        }),
        this: .logger.log(Published, workflow, version, $, { version, : .version }),
        return: version
    } `
    } catch (error) {`,
    this: .logger.error(Error, publishing, workflow, version, `, error);
      throw error;
    }
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
      return '1.0.0'; // Start fresh if invalid version
    }

    // Increment patch version
    parts[2]++;

    return parts.join('.');
  }

  private compareVersionStrings(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;

      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }

    return 0;
  }

  private compareDefinitions(def1: any, def2: any): any {
    // Simple comparison - in real implementation, this would be more sophisticated
    return {
      added: [],
      removed: [],
      modified: [],
      unchanged: []
    };
  }

  // Mock implementation methods - in real code these would use the database
  private async getWorkflowWithAccess(workflowId: string, userId: string): Promise<any> {
    return {
      id: workflowId,
      name: 'Mock Workflow',
      userId,
      definition: {}
    };
  }

  private async getLatestVersion(workflowId: string): Promise<WorkflowVersion | null> {
    return null; // Mock implementation
  }

  private async saveVersion(version: WorkflowVersion): Promise<WorkflowVersion> {
    return version; // Mock implementation
  }

  private async cleanupOldVersions(workflowId: string): Promise<void> {
    // Mock implementation - would delete old versions beyond limit
  }

  private async updateWorkflowActiveVersion(workflowId: string, versionId: string): Promise<void> {
    // Mock implementation
  }

  private async getWorkflowVersions(workflowId: string): Promise<WorkflowVersion[]> {
    return []; // Mock implementation
  }

  private async getVersionById(versionId: string): Promise<WorkflowVersion | null> {
    return null; // Mock implementation
  }

  private async updateWorkflowDefinition(workflowId: string, definition: any): Promise<any> {
    return { id: workflowId, definition }; // Mock implementation
  }

  private async deactivateAllVersions(workflowId: string, excludeVersionId?: string): Promise<void> {
    // Mock implementation
  }

  private async activateVersion(versionId: string): Promise<void> {
    // Mock implementation
  }

  private async deleteVersionById(versionId: string): Promise<void> {
    // Mock implementation
  }
})
};
//# sourceMappingURL=workflow-version.service.js.map