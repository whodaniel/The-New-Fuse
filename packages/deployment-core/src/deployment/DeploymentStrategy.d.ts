import { Logger } from 'winston';
import { EventEmitter } from 'events';
import { DeploymentConfig, DeploymentResult, DeploymentStrategy as StrategyType, HealthCheckResult } from '../types/pipeline';
/**
 * Base deployment strategy interface
 */
export interface IDeploymentStrategy {
    /**
     * Execute the deployment strategy
     */
    deploy(config: DeploymentConfig): Promise<DeploymentResult>;
    /**
     * Validate deployment configuration for this strategy
     */
    validate(config: DeploymentConfig): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    /**
     * Get strategy-specific health checks
     */
    getHealthChecks(config: DeploymentConfig): Promise<HealthCheckConfig[]>;
    /**
     * Handle rollback for this strategy
     */
    rollback(deploymentId: string, reason: string): Promise<RollbackResult>;
    /**
     * Get deployment progress
     */
    getProgress(deploymentId: string): Promise<DeploymentProgress>;
}
export interface HealthCheckConfig {
    name: string;
    type: 'http' | 'tcp' | 'exec' | 'grpc';
    endpoint?: string;
    port?: number;
    path?: string;
    command?: string[];
    timeout: number;
    interval: number;
    retries: number;
    expectedStatus?: number;
    expectedResponse?: string;
}
export interface RollbackResult {
    success: boolean;
    previousVersion: string;
    currentVersion: string;
    duration: number;
    logs: string[];
    error?: string;
}
export interface DeploymentProgress {
    deploymentId: string;
    strategy: StrategyType;
    phase: DeploymentPhase;
    progress: number;
    currentStep: string;
    totalSteps: number;
    completedSteps: number;
    estimatedTimeRemaining: number;
    services: ServiceProgress[];
    healthChecks: HealthCheckProgress[];
    logs: string[];
}
export interface ServiceProgress {
    name: string;
    status: ServiceDeploymentStatus;
    progress: number;
    replicas: {
        desired: number;
        ready: number;
        available: number;
        unavailable: number;
    };
    version: {
        current: string;
        target: string;
    };
    lastUpdated: Date;
}
export interface HealthCheckProgress {
    name: string;
    status: 'pending' | 'running' | 'passed' | 'failed';
    attempts: number;
    maxAttempts: number;
    lastCheck: Date;
    nextCheck: Date;
    message: string;
}
export declare enum DeploymentPhase {
    PREPARING = "preparing",
    DEPLOYING = "deploying",
    VALIDATING = "validating",
    PROMOTING = "promoting",
    COMPLETING = "completing",
    ROLLING_BACK = "rolling_back",
    COMPLETED = "completed",
    FAILED = "failed"
}
export declare enum ServiceDeploymentStatus {
    PENDING = "pending",
    DEPLOYING = "deploying",
    READY = "ready",
    FAILED = "failed",
    ROLLING_BACK = "rolling_back"
}
/**
 * Abstract base class for deployment strategies
 */
export declare abstract class BaseDeploymentStrategy extends EventEmitter implements IDeploymentStrategy {
    protected logger: Logger;
    protected deployments: Map<string, DeploymentProgress>;
    constructor(logger: Logger);
    abstract deploy(config: DeploymentConfig): Promise<DeploymentResult>;
    abstract validate(config: DeploymentConfig): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    abstract rollback(deploymentId: string, reason: string): Promise<RollbackResult>;
    getHealthChecks(config: DeploymentConfig): Promise<HealthCheckConfig[]>;
    protected executeHealthChecks(healthChecks: HealthCheckConfig[], deploymentId: string): Promise<HealthCheckResult[]>;
    protected executeHealthCheck(check: HealthCheckConfig, _deploymentId: string): Promise<HealthCheckResult>;
    private executeHttpHealthCheck;
    catch(error: any): any;
}
//# sourceMappingURL=DeploymentStrategy.d.ts.map