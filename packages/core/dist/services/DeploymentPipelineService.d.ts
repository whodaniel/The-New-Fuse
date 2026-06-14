export interface DeploymentConfig {
    environment: string;
    version: string;
    services: string[];
    healthChecks: string[];
}
export interface DeploymentResult {
    success: boolean;
    deploymentId: string;
    timestamp: Date;
    errors?: string[];
}
export declare class DeploymentPipelineService {
    private readonly logger;
    deployServices(config: DeploymentConfig): Promise<DeploymentResult>;
    private validateConfig;
    private deployService;
    private runHealthChecks;
    private generateDeploymentId;
}
//# sourceMappingURL=DeploymentPipelineService.d.ts.map