import { Logger } from 'winston';
import { EventEmitter } from 'events';
import { DeploymentConfig, DeploymentResult, RollbackResult } from '../types/pipeline';
import { DeploymentProgress } from './DeploymentStrategy';
/**
 * Deployment approval interface
 */
export interface DeploymentApproval {
    id: string;
    deploymentId: string;
    requiredApprovers: string[];
    approvers: string[];
    status: ApprovalStatus;
    createdAt: Date;
    expiresAt: Date;
    reason?: string;
    metadata: Record<string, any>;
}
export declare enum ApprovalStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    EXPIRED = "expired"
}
/**
 * Deployment gate interface
 */
export interface DeploymentGate {
    id: string;
    name: string;
    type: 'manual' | 'automated' | 'time_based' | 'metric_based';
    conditions: GateCondition[];
    timeout: number;
    required: boolean;
    failureBehavior: 'fail' | 'warn' | 'continue';
}
export interface GateCondition {
    type: 'approval' | 'health_check' | 'metric' | 'time_window' | 'custom';
    parameters: Record<string, any>;
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
    value: any;
}
/**
 * DeploymentOrchestrator manages the complete deployment lifecycle with approvals and gates
 */
export declare class DeploymentOrchestrator extends EventEmitter {
    private logger;
    private strategies;
    private activeDeployments;
    private approvals;
    private deploymentHistory;
    constructor(logger: Logger);
    /**
     * Execute a deployment with full orchestration
     */
    executeDeployment(config: DeploymentConfig): Promise<DeploymentResult>;
    catch(error: any): any;
    /**
     * Approve a deployment
     */
    approveDeployment(approvalId: string, approver: string, comment?: string): Promise<boolean>;
    /**
     * Reject a deployment
     */
    rejectDeployment(approvalId: string, approver: string, reason: string): Promise<void>;
    /**
     * Get deployment progress
     */
    getDeploymentProgress(deploymentId: string): Promise<DeploymentProgress | null>;
    /**
     * Cancel a deployment
     */
    cancelDeployment(deploymentId: string, reason: string): Promise<boolean>;
    /**
     * Rollback a deployment
     */
    rollbackDeployment(deploymentId: string, reason: string): Promise<RollbackResult>;
    execution: any;
    logs: any;
    push(: any): any;
}
//# sourceMappingURL=DeploymentOrchestrator.d.ts.map