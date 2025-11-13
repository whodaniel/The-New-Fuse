export { CICDPipeline } from './core/CICDPipeline';
export { PipelineExecutor } from './core/PipelineExecutor';
export { PipelineValidator } from './core/PipelineValidator';
export { PipelineStorage } from './core/PipelineStorage';
export { NotificationService } from './core/NotificationService';
export { MetricsCollector } from './core/MetricsCollector';
export type { ICICDPipeline } from './interfaces/ICICDPipeline';
export type { IInfrastructureManager } from './interfaces/IInfrastructureManager';
export { TestRunner, TestType, TestFramework, TestStatus } from './testing/TestRunner';
export { TestOrchestrator, TestPlanStatus, TestStageStatus } from './testing/TestOrchestrator';
export { QualityGateEvaluator } from './testing/QualityGateEvaluator';
export { DeploymentOrchestrator, ApprovalStatus } from './deployment/DeploymentOrchestrator';
export { BaseDeploymentStrategy, DeploymentPhase, ServiceDeploymentStatus } from './deployment/DeploymentStrategy';
export { RollingUpdateStrategy } from './deployment/RollingUpdateStrategy';
export { BlueGreenStrategy } from './deployment/BlueGreenStrategy';
export { CanaryStrategy } from './deployment/CanaryStrategy';
import { CICDPipeline } from './core/CICDPipeline';
import { Logger } from 'winston';
/**
 * Factory function to create a fully configured CI/CD Pipeline instance
 */
export declare function createCICDPipeline(logger: Logger): CICDPipeline;
/**
 * Configuration interface for CI/CD Pipeline setup
 */
export interface CICDPipelineConfig {
    logger: Logger;
    storage?: {
        type: 'memory' | 'database' | 'file';
        connectionString?: string;
        options?: Record<string, any>;
    };
    notifications?: {
        slack?: {
            webhookUrl: string;
            defaultChannel: string;
        };
        email?: {
            provider: string;
            apiKey: string;
            fromAddress: string;
        };
        webhook?: {
            defaultUrl: string;
            headers?: Record<string, string>;
        };
    };
    metrics?: {
        enabled: boolean;
        retentionDays: number;
        exportInterval: number;
    };
    security?: {
        allowDangerousCommands: boolean;
        requireApprovalForProduction: boolean;
        secretScanningEnabled: boolean;
    };
}
/**
 * Advanced factory function with configuration options
 */
export declare function createConfiguredCICDPipeline(config: CICDPipelineConfig): CICDPipeline;
/**
 * Utility functions for pipeline management
 */
export declare const PipelineUtils: any;
//# sourceMappingURL=index.d.ts.map