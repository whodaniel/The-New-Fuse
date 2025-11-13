/**
 * Service Mesh Scaler
 *
 * Provides automatic scaling capabilities for MCP services in a service mesh
 * based on metrics, load, and custom scaling policies.
 */
import { EventEmitter } from 'events';
import { ServiceMeshProvider, ServiceMeshMetrics, ServiceScalingConfig, ScalingEvent, ServiceMeshIntegrationResult } from './MCPServiceMesh';
/**
 * Scaler configuration
 */
export interface ServiceMeshScalerConfig {
    /** Scaling evaluation interval in seconds */
    evaluationInterval: number;
    /** Default scaling configuration */
    defaultScalingConfig: Partial<ServiceScalingConfig>;
    /** Enable predictive scaling */
    enablePredictiveScaling: boolean;
    /** Scaling decision history retention in seconds */
    historyRetention: number;
    /** Maximum scaling operations per service per hour */
    maxScalingOpsPerHour: number;
    /** Enable scaling notifications */
    enableNotifications: boolean;
}
/**
 * Scaling decision
 */
export interface ScalingDecision {
    /** Service ID */
    serviceId: string;
    /** Decision type */
    type: 'scale_up' | 'scale_down' | 'no_action';
    /** Current instances */
    currentInstances: number;
    /** Recommended instances */
    recommendedInstances: number;
    /** Reason for scaling decision */
    reason: string;
    /** Metrics that influenced the decision */
    influencingMetrics: Array<{
        name: string;
        value: number;
        threshold: number;
        weight: number;
    }>;
    /** Confidence score (0-1) */
    confidence: number;
    /** Decision timestamp */
    timestamp: Date;
}
/**
 * Scaling history entry
 */
export interface ScalingHistoryEntry {
    /** Service ID */
    serviceId: string;
    /** Scaling event (undefined for no-action decisions) */
    event?: ScalingEvent;
    /** Decision that led to this scaling */
    decision: ScalingDecision;
    /** Scaling result */
    result: 'success' | 'failed' | 'cancelled';
    /** Error message if failed */
    error?: string;
    /** Duration of scaling operation in milliseconds */
    duration: number;
}
/**
 * Service scaling state
 */
export interface ServiceScalingState {
    /** Service ID */
    serviceId: string;
    /** Scaling configuration */
    config: ServiceScalingConfig;
    /** Current scaling status */
    status: {
        currentInstances: number;
        desiredInstances: number;
        lastScalingEvent?: ScalingEvent;
        isScaling: boolean;
        cooldownUntil?: Date;
    };
    /** Scaling history */
    history: ScalingHistoryEntry[];
    /** Scaling operations count in current hour */
    operationsThisHour: number;
    /** Last evaluation timestamp */
    lastEvaluation: Date;
    /** Metrics history for predictive scaling */
    metricsHistory: ServiceMeshMetrics[];
}
/**
 * Scaling statistics
 */
export interface ScalingStatistics {
    /** Total services under scaling management */
    totalServices: number;
    /** Services currently scaling */
    servicesScaling: number;
    /** Services in cooldown */
    servicesInCooldown: number;
    /** Total scaling operations performed */
    totalScalingOperations: number;
    /** Successful scaling operations */
    successfulOperations: number;
    /** Failed scaling operations */
    failedOperations: number;
    /** Average scaling decision confidence */
    averageConfidence: number;
    /** Most common scaling reasons */
    commonScalingReasons: Array<{
        reason: string;
        count: number;
    }>;
    /** Last statistics update */
    lastUpdate: Date;
}
/**
 * Service Mesh Scaler implementation
 */
export declare class ServiceMeshScaler extends EventEmitter {
    private provider;
    private config;
    private scalingStates;
    private evaluationInterval?;
    private isRunning;
    private statistics;
    constructor(provider: ServiceMeshProvider, config: ServiceMeshScalerConfig);
    /**
     * Initialize scaling statistics
     */
    private initializeStatistics;
    /**
     * Start automatic scaling
     */
    startScaling(): Promise<ServiceMeshIntegrationResult>;
    /**
     * Stop automatic scaling
     */
    stopScaling(): Promise<ServiceMeshIntegrationResult>;
    /**
     * Add service to scaling management
     */
    addService(serviceId: string, scalingConfig?: ServiceScalingConfig): Promise<ServiceMeshIntegrationResult>;
    /**
     * Remove service from scaling management
     */
    removeService(serviceId: string): Promise<ServiceMeshIntegrationResult>;
    /**
     * Get service scaling state
     */
    getServiceScalingState(serviceId: string): ServiceScalingState | undefined;
    /**
     * Get all managed services
     */
    getManagedServices(): string[];
    /**
     * Get scaling statistics
     */
    getStatistics(): ScalingStatistics;
    /**
     * Get scaling history for a service
     */
    getScalingHistory(serviceId: string, limit?: number): ScalingHistoryEntry[];
    /**
     * Manually trigger scaling evaluation for a service
     */
    evaluateService(serviceId: string): Promise<ScalingDecision>;
    /**
     * Manually scale a service
     */
    scaleService(serviceId: string, targetInstances: number, reason: string): Promise<ServiceMeshIntegrationResult>;
    /**
     * Evaluate scaling for all managed services
     */
    private evaluateScaling;
    /**
     * Evaluate and execute scaling for a service
     */
    private evaluateAndExecuteScaling;
    /**
     * Evaluate scaling decision for a service
     */
    private evaluateServiceScaling;
    /**
     * Evaluate a scaling policy
     */
    private evaluateScalingPolicy;
    /**
     * Execute scaling decision
     */
    private executeScaling;
    /**
     * Check if service is in cooldown
     */
    private isInCooldown;
    /**
     * Build scaling reason from policy results
     */
    private buildScalingReason;
    /**
     * Update scaling statistics
     */
    private updateStatistics;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=ServiceMeshScaler.d.ts.map