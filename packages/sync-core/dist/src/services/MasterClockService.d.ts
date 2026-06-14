import { EventEmitter } from 'events';
import { ClockSyncData } from '../types';
export interface IRedisService {
    subscribe(channel: string, callback: (message: any) => void): Promise<void>;
    unsubscribe(channel: string): Promise<void>;
    publish(channel: string, message: string): Promise<number>;
    hset(key: string, field: string, value: string): Promise<void>;
}
export interface IHeartbeatMonitoringService {
    on(event: string, callback: (...args: any[]) => void): void;
    emit(event: string, ...args: any[]): boolean;
}
export interface IMetricsService {
    collectMetric(...args: any[]): Promise<any>;
    getMetrics(): Promise<any>;
}
export interface MasterClockConfig {
    syncIntervalMs: number;
    driftThresholdMs: number;
    maxDriftMs: number;
    correctionIntervalMs: number;
    instanceId: string;
    redisChannels: {
        clockSync: string;
        driftAlert: string;
        correction: string;
    };
}
export interface ClockDriftReport {
    instances: Array<{
        instanceId: string;
        drift: number;
        lastSync: Date;
    }>;
    maxDrift: number;
    requiresCorrection: boolean;
    timestamp: Date;
}
export interface ClockMetrics {
    syncOperations: number;
    driftCorrections: number;
    avgDrift: number;
    maxDrift: number;
    instanceCount: number;
    lastSyncTime: Date;
    healthStatus: 'healthy' | 'drift' | 'critical';
}
/**
 * MasterClockService provides centralized time synchronization across all system components
 * Integrates with existing Redis pub/sub infrastructure and HeartbeatMonitoringService
 */
export declare class MasterClockService extends EventEmitter {
    private config;
    private redisService;
    private heartbeatService;
    private metricsService;
    private syncInterval?;
    private correctionInterval?;
    private instanceClocks;
    private masterTime;
    private isInitialized;
    private metrics;
    constructor(config: MasterClockConfig, redisService: IRedisService, heartbeatService: IHeartbeatMonitoringService, metricsService: IMetricsService);
    /**
     * Initialize the master clock service with existing infrastructure integration
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the master clock service
     */
    shutdown(): Promise<void>;
    /**
     * Get synchronized timestamp with microsecond precision
     */
    now(): Promise<Date>;
    /**
     * Synchronize time with a specific instance
     */
    syncTime(instanceId: string): Promise<void>;
    /**
     * Detect clock drift across all instances
     */
    detectDrift(): Promise<ClockDriftReport>;
    /**
     * Correct clock drift for specified instances
     */
    correctDrift(instanceIds: string[]): Promise<void>;
    /**
     * Get current clock metrics
     */
    getClockMetrics(): ClockMetrics;
    /**
     * Set up Redis pub/sub subscriptions for clock synchronization
     */
    private setupRedisSubscriptions;
    /**
     * Integrate with existing HeartbeatMonitoringService
     */
    private setupHeartbeatIntegration;
    /**
     * Start periodic synchronization operations
     */
    private startSyncOperations;
    /**
     * Register this instance as the master clock
     */
    private registerMasterClock;
    /**
     * Broadcast time synchronization to all instances
     */
    private broadcastTimeSync;
    /**
     * Handle incoming clock sync messages
     */
    private handleClockSyncMessage;
    /**
     * Handle drift alert messages
     */
    private handleDriftAlert;
    /**
     * Handle correction acknowledgment messages
     */
    private handleCorrectionAck;
    /**
     * Update instance clock data
     */
    private updateInstanceClock;
    /**
     * Remove instance clock data
     */
    private removeInstanceClock;
    /**
     * Update health status based on drift metrics
     */
    private updateHealthStatus;
    /**
     * Get instance count for monitoring
     */
    getInstanceCount(): number;
    /**
     * Get all tracked instances
     */
    getTrackedInstances(): ClockSyncData[];
    /**
     * Force immediate synchronization of all instances
     */
    forceSync(): Promise<void>;
}
//# sourceMappingURL=MasterClockService.d.ts.map