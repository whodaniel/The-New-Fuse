import { Logger } from 'winston';
import { BaseDeploymentStrategy, RollbackResult } from './DeploymentStrategy.js';
import { DeploymentConfig, DeploymentResult } from '../types/pipeline.js';
/**
 * Rolling Update Deployment Strategy
 * Gradually replaces old instances with new ones to ensure zero downtime
 */
export declare class RollingUpdateStrategy extends BaseDeploymentStrategy {
    constructor(logger: Logger);
    deploy(config: DeploymentConfig): Promise<DeploymentResult>;
    validate(config: DeploymentConfig): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    rollback(deploymentId: string, reason: string): Promise<RollbackResult>;
    private prepareDeployment;
    private deployServiceRolling;
    private parsePercentage;
    private validateClusterResources;
    private prepareDeploymentManifests;
    private setupMonitoring;
    private deployReplicaBatch;
    private removeOldReplicas;
    private rollbackService;
    private waitForRollbackComplete;
}
//# sourceMappingURL=RollingUpdateStrategy.d.ts.map