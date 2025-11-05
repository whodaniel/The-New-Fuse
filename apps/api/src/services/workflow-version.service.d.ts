import { PrismaService } from '@the-new-fuse/database';
import { VersionChangeType } from '@the-new-fuse/database';
import { AuditService } from '../security/audit.service';
export interface CreateVersionDto {
    workflowId: string;
    changeLog?: string;
    changeType?: VersionChangeType;
    semanticVersion?: string;
    userId: string;
    userEmail?: string;
}
export interface RollbackVersionDto {
    workflowId: string;
    targetVersion: number;
    reason?: string;
    userId: string;
    userEmail?: string;
}
export interface WorkflowVersionWithDiff {
    id: string;
    version: number;
    semanticVersion?: string;
    changeLog?: string;
    changeType: VersionChangeType;
    isActive: boolean;
    createdAt: Date;
    createdBy?: {
        id: string;
        name?: string;
        email: string;
    };
    diff?: {
        added: any[];
        removed: any[];
        modified: any[];
    };
}
export declare class WorkflowVersionService {
    private prisma;
    private auditService;
    private readonly logger;
    constructor(prisma: PrismaService, auditService: AuditService);
    /**
     * Create a new version of a workflow
     */
    createVersion(dto: CreateVersionDto): Promise<any>;
    /**
     * Get all versions of a workflow with optional diff information
     */
    getWorkflowVersions(workflowId: string, includeDiff?: boolean): Promise<WorkflowVersionWithDiff[]>;
    /**
     * Rollback to a specific version
     */
    rollbackToVersion(dto: RollbackVersionDto): Promise<any>;
    /**
     * Get a specific version
     */
    getVersion(workflowId: string, version: number): Promise<any>;
    /**
     * Compare two versions
     */
    compareVersions(workflowId: string, version1: number, version2: number): Promise<any>;
    /**
     * Delete a version (soft delete for safety)
     */
    deleteVersion(workflowId: string, version: number, userId: string, userEmail?: string): Promise<void>;
    /**
     * Get version statistics
     */
    getVersionStats(workflowId: string): Promise<any>;
    /**
     * Calculate diff between two workflow definitions
     */
    private calculateDiff;
}
//# sourceMappingURL=workflow-version.service.d.ts.map