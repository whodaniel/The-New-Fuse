import { WorkflowVersionService } from '../services/workflow-version.service';
import { VersionChangeType } from '@prisma/client';
import { AuthenticatedRequest } from '../types/request.types';
declare class CreateVersionRequest {
    changeLog?: string;
    changeType?: VersionChangeType;
    semanticVersion?: string;
}
declare class RollbackVersionRequest {
    targetVersion: number;
    reason?: string;
}
export declare class WorkflowVersionController {
    private readonly workflowVersionService;
    constructor(workflowVersionService: WorkflowVersionService);
    createVersion(workflowId: string, body: CreateVersionRequest, req: AuthenticatedRequest): Promise<any>;
    getWorkflowVersions(workflowId: string, includeDiff: boolean): Promise<any>;
    getVersionStats(workflowId: string): Promise<any>;
    getVersion(workflowId: string, version: number): Promise<any>;
    compareVersions(workflowId: string, version1: number, version2: number): Promise<any>;
    rollbackToVersion(workflowId: string, body: RollbackVersionRequest, req: AuthenticatedRequest): Promise<any>;
    deleteVersion(workflowId: string, version: number, req: AuthenticatedRequest): Promise<any>;
}
export {};
//# sourceMappingURL=workflow-version.controller.d.ts.map