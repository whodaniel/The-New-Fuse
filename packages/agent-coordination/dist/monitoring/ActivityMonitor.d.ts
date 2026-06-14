import { EventEmitter } from 'events';
import type { AgentPool } from '../core/AgentPool.js';
import type { TaskQueue } from '../core/TaskQueue.js';
import type { Coordinator } from '../orchestration/Coordinator.js';
import type { MetricsCollector } from './MetricsCollector.js';
/**
 * Agent activity event
 */
export interface ActivityEvent {
    type: 'task' | 'agent' | 'system';
    action: string;
    timestamp: Date;
    data: any;
    severity?: 'info' | 'warning' | 'error' | 'critical';
}
/**
 * System health status
 */
export interface SystemHealth {
    status: 'healthy' | 'degraded' | 'critical' | 'offline';
    coordinator: 'running' | 'stopped' | 'error';
    agentPool: {
        total: number;
        healthy: number;
        unhealthy: number;
    };
    taskQueue: {
        depth: number;
        processing: number;
        backlog: number;
    };
    performance: {
        successRate: number;
        throughput: number;
        averageLatency: number;
    };
    alerts: string[];
    timestamp: Date;
}
/**
 * Activity monitor for real-time coordination tracking
 */
export declare class ActivityMonitor extends EventEmitter {
    private coordinator;
    private agentPool;
    private taskQueue;
    private metricsCollector;
    private activityLog;
    private maxLogSize;
    private monitoringInterval?;
    private isMonitoring;
    private alerts;
    constructor(coordinator: Coordinator, agentPool: AgentPool, taskQueue: TaskQueue, metricsCollector: MetricsCollector, maxLogSize?: number);
    /**
     * Setup event listeners for activity tracking
     */
    private setupEventListeners;
    /**
     * Start monitoring
     */
    start(intervalMs?: number): void;
    /**
     * Stop monitoring
     */
    stop(): void;
    /**
     * Log activity event
     */
    private logActivity;
    /**
     * Check system health
     */
    private checkSystemHealth;
    /**
     * Get current system health
     */
    getSystemHealth(): Promise<SystemHealth>;
    /**
     * Raise an alert
     */
    private raiseAlert;
    /**
     * Clear an alert
     */
    clearAlert(message: string): void;
    /**
     * Clear all alerts
     */
    clearAllAlerts(): void;
    /**
     * Get recent activity
     */
    getRecentActivity(count?: number): ActivityEvent[];
    /**
     * Get activity by type
     */
    getActivityByType(type: ActivityEvent['type'], count?: number): ActivityEvent[];
    /**
     * Get activity by severity
     */
    getActivityBySeverity(severity: ActivityEvent['severity'], count?: number): ActivityEvent[];
    /**
     * Get activity in time range
     */
    getActivityInRange(startDate: Date, endDate: Date): ActivityEvent[];
    /**
     * Get all alerts
     */
    getActiveAlerts(): Array<{
        message: string;
        timestamp: Date;
    }>;
    /**
     * Get dashboard data
     */
    getDashboardData(): Promise<{
        health: SystemHealth;
        recentActivity: ActivityEvent[];
        metrics: any;
        alerts: Array<{
            message: string;
            timestamp: Date;
        }>;
    }>;
    /**
     * Export activity log
     */
    exportActivityLog(): ActivityEvent[];
    /**
     * Clear activity log
     */
    clearActivityLog(): void;
}
//# sourceMappingURL=ActivityMonitor.d.ts.map