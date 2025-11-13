import { Logger } from 'winston';
import { BaseDeploymentStrategy } from './DeploymentStrategy';
import { DeploymentConfig, DeploymentResult } from '../types/pipeline';
/**
 * Blue-Green Deployment Strategy
 * Deploys to a parallel environment (green) and switches traffic after validation
 */
export declare class BlueGreenStrategy extends BaseDeploymentStrategy {
    private activeEnvironments;
    constructor(logger: Logger);
    deploy(config: DeploymentConfig): Promise<DeploymentResult>;
    private deployServiceToEnvironment;
    deploymentId: any;
}
//# sourceMappingURL=BlueGreenStrategy.d.ts.map