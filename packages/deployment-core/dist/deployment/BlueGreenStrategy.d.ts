import { Logger } from 'winston';
import { BaseDeploymentStrategy, RollbackResult } from './DeploymentStrategy.js';
import { DeploymentConfig, DeploymentResult } from '../types/pipeline.js';
/**
 * Blue-Green Deployment Strategy
 * Deploys to a parallel environment (green) and switches traffic after validation
 */
export declare class BlueGreenStrategy extends BaseDeploymentStrategy {
    private activeEnvironments;
    constructor(logger: Logger);
    deploy(config: DeploymentConfig): Promise<DeploymentResult>;
    validate(config: DeploymentConfig): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    rollback(deploymentId: string, reason: string): Promise<RollbackResult>;
    private getCurrentEnvironment;
    private prepareTargetEnvironment;
    private deployServiceToEnvironment;
    private validateTargetEnvironment;
    private switchTraffic;
    private cleanupOldEnvironment;
    private switchTrafficBack;
    private validateRollback;
    private parseDuration;
    private isValidDuration;
    private ensureEnvironmentResources;
    private setupEnvironmentNetworking;
    private setupEnvironmentMonitoring;
    private createServiceInEnvironment;
    private runAnalysis;
    private runSmokeTests;
    private updateLoadBalancer;
    private updateServiceMeshRouting;
    private updateDNSRecords;
    private scaleDownService;
    private cleanupEnvironmentResources;
}
//# sourceMappingURL=BlueGreenStrategy.d.ts.map