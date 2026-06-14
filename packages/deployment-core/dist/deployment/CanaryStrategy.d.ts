import { Logger } from 'winston';
import { BaseDeploymentStrategy, RollbackResult } from './DeploymentStrategy.js';
import { DeploymentConfig, DeploymentResult } from '../types/pipeline.js';
/**
 * Canary Deployment Strategy
 * Gradually shifts traffic to new version while monitoring metrics
 */
export declare class CanaryStrategy extends BaseDeploymentStrategy {
    constructor(logger: Logger);
    deploy(config: DeploymentConfig): Promise<DeploymentResult>;
    validate(config: DeploymentConfig): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    rollback(deploymentId: string, reason: string): Promise<RollbackResult>;
    private prepareCanaryDeployment;
    private deployCanaryService;
    private executeProgressiveRollout;
    private cleanupCanaryDeployment;
    private parseDuration;
    private validateStableDeployment;
    private setupTrafficSplitting;
    private setupCanaryMonitoring;
    private createCanaryInstances;
    private shiftTrafficToCanary;
    private runCanaryAnalysis;
    private waitForManualApproval;
    private promoteCanaryToStable;
    private shiftTrafficToStable;
    private removeCanaryInstances;
    private removeCanaryResources;
    private cleanupTrafficSplitting;
    private scaleCanaryToFull;
    private removeStableInstances;
    private promoteCanaryLabels;
}
//# sourceMappingURL=CanaryStrategy.d.ts.map