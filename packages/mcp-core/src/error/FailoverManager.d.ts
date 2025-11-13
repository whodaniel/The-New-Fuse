/**
 * Automatic Failover and Recovery Manager
 * Manages service failover and automatic recovery mechanisms
 */
import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
import { GracefulDegradationManager } from './GracefulDegradation';
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
    for(: any, endpoint: any, of: any, availableEndpoints: any): void;
    /**
     * Manually mark endpoint as unhealthy
     */
    markEndpointUnhealthy(endpointId: string, error?: Error): void;
    /**
     * Force failover to specific endpoint
     */
    forceFailover(targetEndpointId: string): boolean;
    to: any;
    $: any;
}
//# sourceMappingURL=FailoverManager.d.ts.map