import { PrismaService } from '@the-new-fuse/database';
import { AuditService } from '../../services/audit.service';
import { MetricsService } from '../../services/metrics.service';
export declare enum WorkflowStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    PAUSED = "paused",
    ARCHIVED = "archived",
    DELETED = "deleted",
    ERROR = "error"
}
export interface StatusTransition {
    from: WorkflowStatus;
    to: WorkflowStatus;
    condition?: (workflow: any, context?: any) => Promise<boolean>;
    action?: (workflow: any, context?: any) => Promise<void>;
}
export declare class WorkflowStatusService {
    private readonly prismaService;
    private readonly auditService;
    private readonly metricsService;
    private readonly logger;
    private readonly statusTransitions;
    constructor(prismaService: PrismaService, auditService: AuditService, metricsService: MetricsService);
    private initializeStatusTransitions;
}
//# sourceMappingURL=workflow-status.service.d.ts.map