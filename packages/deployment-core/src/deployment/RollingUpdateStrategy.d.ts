import { Logger } from 'winston';
import { BaseDeploymentStrategy } from './DeploymentStrategy';
import { DeploymentConfig, DeploymentResult } from '../types/pipeline';
/**
 * Rolling Update Deployment Strategy
 * Gradually replaces old instances with new ones to ensure zero downtime
 */
export declare class RollingUpdateStrategy extends BaseDeploymentStrategy {
    constructor(logger: Logger);
    deploy(config: DeploymentConfig): Promise<DeploymentResult>;
    catch(error: any): void;
    if(config: any, rollbackPolicy: any, enabled: any): any;
}
//# sourceMappingURL=RollingUpdateStrategy.d.ts.map