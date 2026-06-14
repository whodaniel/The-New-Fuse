/**
 * System Bridge - System-level communication and monitoring
 *
 * Provides bridge functionality for system-level operations:
 * - Process management
 * - System metrics collection
 * - Resource monitoring
 * - Health checks
 * - Environment management
 */
import { BaseBridge, MessageType, Priority } from './index.js';
export interface SystemMetrics {
    cpu: {
        usage: number;
        cores: number;
    };
    memory: {
        total: number;
        used: number;
        free: number;
        percentage: number;
    };
    uptime: number;
    loadAverage: number[];
    processCount: number;
}
export interface ProcessInfo {
    pid: number;
    name: string;
    memory: number;
    cpu: number;
    status: 'running' | 'sleeping' | 'stopped' | 'zombie';
    startTime: Date;
}
export interface HealthCheck {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency?: number;
    message?: string;
    lastCheck: Date;
}
export interface SystemEvent {
    type: 'startup' | 'shutdown' | 'warning' | 'error' | 'info';
    source: string;
    message: string;
    timestamp: Date;
    data?: Record<string, unknown>;
}
export declare class SystemBridge extends BaseBridge {
    private healthChecks;
    private metricsInterval;
    private eventLog;
    private maxEventLogSize;
    private metricsCollectionInterval;
    constructor();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendMessage(message: Record<string, unknown>, messageType?: MessageType, priority?: Priority): Promise<void>;
    /**
     * Collect system metrics
     */
    collectMetrics(): Promise<SystemMetrics>;
    /**
     * Start periodic metrics collection
     */
    startMetricsCollection(): void;
    /**
     * Stop periodic metrics collection
     */
    stopMetricsCollection(): void;
    /**
     * Register a health check
     */
    registerHealthCheck(name: string, check: () => Promise<HealthCheck>): void;
    /**
     * Unregister a health check
     */
    unregisterHealthCheck(name: string): void;
    /**
     * Run all health checks
     */
    runHealthChecks(): Promise<Map<string, HealthCheck>>;
    /**
     * Register default health checks
     */
    private registerDefaultHealthChecks;
    /**
     * Log a system event
     */
    logEvent(event: SystemEvent): void;
    /**
     * Get recent events
     */
    getRecentEvents(count?: number): SystemEvent[];
    /**
     * Get events by type
     */
    getEventsByType(type: SystemEvent['type']): SystemEvent[];
    /**
     * Clear event log
     */
    clearEventLog(): void;
    /**
     * Get current process info
     */
    getProcessInfo(): ProcessInfo;
    /**
     * Get environment info
     */
    getEnvironmentInfo(): Record<string, string | undefined>;
    getStatistics(): {
        connected: boolean;
        healthChecks: number;
        eventLogSize: number;
        uptime: number;
        processInfo: ProcessInfo;
    };
}
export default SystemBridge;
//# sourceMappingURL=system_bridge.d.ts.map