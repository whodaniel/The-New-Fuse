import { Logger } from 'winston';
import { BaseDeploymentStrategy } from './DeploymentStrategy';
import { DeploymentConfig, DeploymentResult } from '../types/pipeline';
/**
 * Canary Deployment Strategy
 * Gradually shifts traffic to new version while monitoring metrics
 */
export declare class CanaryStrategy extends BaseDeploymentStrategy {
    constructor(logger: Logger);
    deploy(config: DeploymentConfig): Promise<DeploymentResult>;
    const endTime: Date;
    const duration: number;
    const failedResult: DeploymentResult;
}
//# sourceMappingURL=CanaryStrategy.d.ts.map