/**
 * Graceful Degradation System
 * Provides fallback mechanisms when MCP services are unavailable
 */
import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
import { MCPErrorClass } from '../types/error';
export declare enum ServiceLevel {
    FULL = "full",
    DEGRADED = "degraded",
    MINIMAL = "minimal",
    OFFLINE = "offline"
}
export interface DegradationConfig {
    /** Service name */
    serviceName: string;
    /** Degradation levels configuration */
    levels: {
        [ServiceLevel.FULL]: DegradationLevel;
        [ServiceLevel.DEGRADED]: DegradationLevel;
        [ServiceLevel.MINIMAL]: DegradationLevel;
        [ServiceLevel.OFFLINE]: DegradationLevel;
    };
    /** Health check interval (ms) */
    healthCheckInterval: number;
    /** Auto-recovery enabled */
    enableAutoRecovery: boolean;
    /** Recovery check interval (ms) */
    recoveryCheckInterval: number;
}
export interface DegradationLevel {
    /** Level name */
    name: ServiceLevel;
    /** Level description */
    description: string;
    /** Available features */
    availableFeatures: string[];
    /** Disabled features */
    disabledFeatures: string[];
    /** Fallback handlers */
    fallbackHandlers: Map<string, FallbackHandler>;
    /** Performance limits */
    performanceLimits?: {
        maxConcurrentRequests?: number;
        requestTimeout?: number;
        rateLimitPerSecond?: number;
    };
}
export interface FallbackHandler {
    /** Handler name */
    name: string;
    /** Handler description */
    description: string;
    /** Handler function */
    handler: (operation: string, params: any) => Promise<any>;
    /** Handler priority (lower = higher priority) */
    priority: number;
    /** Whether handler is available */
    available: boolean;
}
export interface ServiceStatus {
    /** Service name */
    serviceName: string;
    /** Current service level */
    currentLevel: ServiceLevel;
    /** Available features */
    availableFeatures: string[];
    /** Disabled features */
    disabledFeatures: string[];
    /** Last health check */
    lastHealthCheck: Date;
    /** Health check status */
    healthy: boolean;
    /** Error count */
    errorCount: number;
    /** Last error */
    lastError?: MCPErrorClass;
    /** Degradation reason */
    degradationReason?: string;
    /** Recovery attempts */
    recoveryAttempts: number;
    /** Last recovery attempt */
    lastRecoveryAttempt?: Date;
}
/**
 * Graceful Degradation Manager
 */
export declare class GracefulDegradationManager extends EventEmitter {
    private readonly config;
    private readonly logger;
    private currentLevel;
    private serviceStatus;
    private healthCheckTimer?;
    private recoveryTimer?;
    private readonly operationQueue;
    constructor(config: DegradationConfig, logger?: Logger);
    /**
     * Get current service status
     */
    getServiceStatus(): ServiceStatus;
    /**
     * Manually degrade service to specified level
     */
    degradeToLevel(level: ServiceLevel, reason: string): void;
}
//# sourceMappingURL=GracefulDegradation.d.ts.map