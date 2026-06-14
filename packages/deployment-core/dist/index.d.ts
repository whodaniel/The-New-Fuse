export { CICDPipeline } from './core/CICDPipeline.js';
export { PipelineExecutor } from './core/PipelineExecutor.js';
export { PipelineValidator } from './core/PipelineValidator.js';
export { PipelineStorage } from './core/PipelineStorage.js';
export { NotificationService } from './core/NotificationService.js';
export { MetricsCollector } from './core/MetricsCollector.js';
export type { ICICDPipeline } from './interfaces/ICICDPipeline.js';
export type { IInfrastructureManager } from './interfaces/IInfrastructureManager.js';
export { TestRunner, TestType, TestFramework, TestStatus } from './testing/TestRunner.js';
export { TestOrchestrator, TestPlanStatus, TestStageStatus } from './testing/TestOrchestrator.js';
export { QualityGateEvaluator } from './testing/QualityGateEvaluator.js';
export { DeploymentOrchestrator, ApprovalStatus } from './deployment/DeploymentOrchestrator.js';
export { BaseDeploymentStrategy, DeploymentPhase, ServiceDeploymentStatus } from './deployment/DeploymentStrategy.js';
export { RollingUpdateStrategy } from './deployment/RollingUpdateStrategy.js';
export { BlueGreenStrategy } from './deployment/BlueGreenStrategy.js';
export { CanaryStrategy } from './deployment/CanaryStrategy.js';
import { CICDPipeline } from './core/CICDPipeline.js';
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
export declare const PipelineUtils: {
    /**
     * Generate a unique pipeline execution ID
     */
    generateExecutionId(): string;
    /**
     * Generate a unique build ID
     */
    generateBuildId(): string;
    /**
     * Generate a unique deployment ID
     */
    generateDeploymentId(): string;
    /**
     * Format duration in human-readable format
     */
    formatDuration(milliseconds: number): string;
    /**
     * Parse duration string to milliseconds
     */
    parseDuration(duration: string): number;
    /**
     * Validate pipeline name format
     */
    validatePipelineName(name: string): boolean;
    /**
     * Validate environment name format
     */
    validateEnvironmentName(name: string): boolean;
    /**
     * Generate pipeline configuration template
     */
    generatePipelineTemplate(name: string, type?: "web" | "api" | "library"): any;
};
//# sourceMappingURL=index.d.ts.map