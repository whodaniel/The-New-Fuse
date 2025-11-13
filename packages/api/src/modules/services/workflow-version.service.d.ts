import { PrismaService } from '@the-new-fuse/database';
import { AuditService } from '../../services/audit.service';
import { MetricsService } from '../../services/metrics.service';
export interface WorkflowVersion {
    id: string;
    workflowId: string;
    version: string;
    definition: any;
    metadata: Record<string, any>;
    changelog: string;
    createdBy: string;
    createdAt: Date;
    isActive: boolean;
    isPublished: boolean;
    parentVersionId?: string;
}
export interface CreateVersionDto {
    workflowId: string;
    definition: any;
    changelog: string;
    metadata?: Record<string, any>;
    isPublished?: boolean;
}
export interface RollbackOptions {
    versionId: string;
    reason: string;
    createBackup?: boolean;
}
export declare class WorkflowVersionService {
    private readonly prismaService;
    private readonly auditService;
    private readonly metricsService;
    private readonly logger;
    private readonly maxVersionsPerWorkflow;
    constructor(prismaService: PrismaService, auditService: AuditService, metricsService: MetricsService);
    createVersion(createVersionDto: CreateVersionDto, userId: string): Promise<WorkflowVersion>;
    catch(error: any): void;
}
//# sourceMappingURL=workflow-version.service.d.ts.map