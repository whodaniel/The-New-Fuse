import { WorkflowTemplate } from '../types/types.js';
interface BackupResult {
    workflow: WorkflowTemplate;
    timestamp: Date;
    size: number;
    checksum: string;
}
interface RecoveryResult {
    success: boolean;
    workflowId: string;
    restoredAt: Date;
    backupTimestamp: Date;
}
interface BackupManager {
    findBackup(workflowId: string, pointInTime?: Date): Promise<any>;
}
interface RecoveryOrchestrator {
    executeRecovery(recoveryPlan: any): Promise<RecoveryResult>;
}
export declare class WorkflowRecoverySystem {
    private readonly backupManager;
    private readonly recoveryOrchestrator;
    constructor(backupManager: BackupManager, recoveryOrchestrator: RecoveryOrchestrator);
    createWorkflowBackup(workflow: WorkflowTemplate): Promise<BackupResult>;
    recoverWorkflow(workflowId: string, pointInTime?: Date): Promise<RecoveryResult>;
    private generateChecksum;
    private findNearestBackup;
    private generateRecoveryPlan;
}
export {};
//# sourceMappingURL=recovery.d.ts.map