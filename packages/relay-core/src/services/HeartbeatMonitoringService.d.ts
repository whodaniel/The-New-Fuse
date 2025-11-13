/**
 * Heartbeat Monitoring and Anti-Stagnation Service
 *
 * Implements robust monitoring of agent communications and workflow progress
 * Provides fallback mechanisms for stalled communications and automatic recovery
 */
import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger.js';
export interface HeartbeatConfig {
    intervalMs: number;
    timeoutMs: number;
    maxRetries: number;
    escalationDelay: number;
    stagnationThresholdMs: number;
}
export interface AgentHeartbeat {
    agentId: string;
    lastHeartbeat: Date;
    lastActivity: Date;
    status: 'active' | 'idle' | 'stalled' | 'failed';
    consecutiveFailures: number;
    currentTask?: string;
    expectedResponseTime?: number;
}
export interface StagnationAlert {
    agentId: string;
    taskId: string;
    stagnationType: 'no_heartbeat' | 'no_progress' | 'circular_communication' | 'timeout';
    detectedAt: Date;
    duration: number;
    severity: 'warning' | 'critical' | 'emergency';
}
export interface FallbackAction {
    type: 'retry' | 'escalate' | 'reassign' | 'notify_human' | 'emergency_stop';
    targetAgent?: string;
    retryCount: number;
    executedAt: Date;
}
export declare class HeartbeatMonitoringService extends EventEmitter {
    private logger;
    private config;
    private agentHeartbeats;
    private stagnationAlerts;
    private fallbackActions;
    private monitoringInterval?;
    private handoffTemplateService;
    private humanNotificationQueue;
    constructor(config: HeartbeatConfig, logger: Logger);
    /**
     * Start heartbeat monitoring
     */
    start(): void;
    /**
     * Stop heartbeat monitoring
     */
    stop(): void;
    /**
     * Register agent for monitoring
     */
    registerAgent(agentId: string, expectedResponseTime?: number): void;
    /**
     * Record heartbeat from agent
     */
    recordHeartbeat(agentId: string, taskId?: string): void;
    /**
     * Record agent activity (task progress)
     */
    recordActivity(agentId: string, activityType: string, metadata?: any): void;
    /**
     * Clear stagnation alert
     */
    private clearStagnationAlert;
}
//# sourceMappingURL=HeartbeatMonitoringService.d.ts.map