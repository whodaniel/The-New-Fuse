import { PrismaService } from '@the-new-fuse/database';
import { AuditService } from '../../services/audit.service';
import { MetricsService } from '../../services/metrics.service';
export declare enum DependencyType {
    WORKFLOW = "workflow",
    DATA = "data",
    API = "api",
    SERVICE = "service",
    RESOURCE = "resource"
}
export declare enum DependencyStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    ERROR = "error",
    PENDING = "pending"
}
export interface WorkflowDependency {
    id: string;
    workflowId: string;
    dependencyId: string;
    dependencyType: DependencyType;
    dependencyName: string;
    status: DependencyStatus;
    config: Record<string, any>;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}
export interface CreateDependencyDto {
    workflowId: string;
    dependencyId: string;
    dependencyType: DependencyType;
    dependencyName: string;
    config?: Record<string, any>;
    metadata?: Record<string, any>;
}
export interface DependencyGraph {
    nodes: Array<{
        id: string;
        name: string;
        type: 'workflow' | 'dependency';
        status: DependencyStatus;
    }>;
    edges: Array<{
        from: string;
        to: string;
        type: DependencyType;
        status: DependencyStatus;
    }>;
    cycles: string[][];
}
export declare class WorkflowDependencyService {
    private readonly prismaService;
    private readonly auditService;
    private readonly metricsService;
    private readonly logger;
    constructor(prismaService: PrismaService, auditService: AuditService, metricsService: MetricsService);
    addDependency(createDependencyDto: CreateDependencyDto, userId: string): Promise<WorkflowDependency>;
    getDependencies(workflowId: string, userId: string): Promise<WorkflowDependency[]>;
    getDependencyGraph(workflowId: string, userId: string): Promise<DependencyGraph>;
    private wouldCreateCircularDependency;
    private validateDependency;
    private validateSingleDependency;
}
//# sourceMappingURL=workflow-dependency.service.d.ts.map