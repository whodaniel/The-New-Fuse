/**
 * Automatic Failover and Recovery Manager
 * Manages service failover and automatic recovery mechanisms
 */
import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger.js';
import { GracefulDegradationManager } from './GracefulDegradation.js';
export interface ServiceEndpoint {
    /** Endpoint ID */
    id: string;
    /** Endpoint URL or identifier */
    url: string;
    /** Endpoint priority (lower = higher priority) */
    priority: number;
    /** Whether endpoint is healthy */
    healthy: boolean;
    /** Last health check timestamp */
    lastHealthCheck: Date;
    /** Response time in milliseconds */
    responseTime: number;
    /** Error count */
    errorCount: number;
    /** Last error */
    lastError?: Error;
    /** Endpoint metadata */
    metadata?: Record<string, any>;
}
export interface FailoverConfig {
    /** Service name */
    serviceName: string;
    /** Health check interval (ms) */
    healthCheckInterval: number;
    /** Health check timeout (ms) */
    healthCheckTimeout: number;
    /** Maximum retry attempts */
    maxRetryAttempts: number;
    /** Retry delay (ms) */
    retryDelay: number;
    /** Enable automatic failback */
    enableAutoFailback: boolean;
    /** Failback delay (ms) */
    failbackDelay: number;
    /** Load balancing strategy */
    loadBalancingStrategy: 'priority' | 'round_robin' | 'least_connections' | 'response_time';
}
export interface FailoverStats {
    /** Service name */
    serviceName: string;
    /** Current active endpoint */
    activeEndpoint?: ServiceEndpoint;
    /** Total endpoints */
    totalEndpoints: number;
    /** Healthy endpoints */
    healthyEndpoints: number;
    /** Failed endpoints */
    failedEndpoints: number;
    /** Total failovers */
    totalFailovers: number;
    /** Last failover timestamp */
    lastFailover?: Date;
    /** Total requests */
    totalRequests: number;
    /** Successful requests */
    successfulRequests: number;
    /** Failed requests */
    failedRequests: number;
    /** Average response time */
    averageResponseTime: number;
}
/**
 * Failover Manager for handling service endpoint failover
 */
export declare class FailoverManager extends EventEmitter {
    private readonly config;
    private readonly logger;
    private readonly endpoints;
    private readonly circuitBreakers;
    private readonly degradationManager?;
    private currentEndpointIndex;
    private healthCheckTimer?;
    private stats;
    constructor(config: FailoverConfig, degradationManager?: GracefulDegradationManager, logger?: Logger);
    /**
     * Add service endpoint
     */
    addEndpoint(endpoint: Omit<ServiceEndpoint, 'healthy' | 'lastHealthCheck' | 'responseTime' | 'errorCount'>): void;
    /**
     * Remove service endpoint
     */
    removeEndpoint(endpointId: string): boolean;
    /**
     * Execute request with failover support
     */
    executeWithFailover<T>(operation: (endpoint: ServiceEndpoint) => Promise<T>): Promise<T>;
    /**
     * Get current service statistics
     */
    getStats(): FailoverStats;
    /**
     * Get all endpoints
     */
    getEndpoints(): ServiceEndpoint[];
    /**
     * Get healthy endpoints
     */
    getHealthyEndpoints(): ServiceEndpoint[];
    /**
     * Get endpoint by ID
     */
    getEndpoint(endpointId: string): ServiceEndpoint | undefined;
    /**
     * Manually mark endpoint as healthy
     */
    markEndpointHealthy(endpointId: string): void;
    /**
     * Manually mark endpoint as unhealthy
     */
    markEndpointUnhealthy(endpointId: string, error?: Error): void;
    /**
     * Force failover to specific endpoint
     */
    forceFailover(targetEndpointId: string): boolean;
    /**
     * Shutdown the failover manager
     */
    shutdown(): void;
    /**
     * Get available endpoints in priority order
     */
    private getAvailableEndpoints;
    /**
     * Handle endpoint error
     */
    private handleEndpointError;
    /**
     * Trigger failover
     */
    private triggerFailover;
    /**
     * Perform health check on endpoint
     */
    private performHealthCheck;
    /**
     * Start health checking
     */
    private startHealthChecking;
    /**
     * Consider failback to recovered endpoint
     */
    private considerFailback;
    /**
     * Update statistics
     */
    private updateStats;
    /**
     * Update average response time
     */
    private updateAverageResponseTime;
    /**
     * Utility delay function
     */
    private delay;
}
//# sourceMappingURL=FailoverManager.d.ts.map