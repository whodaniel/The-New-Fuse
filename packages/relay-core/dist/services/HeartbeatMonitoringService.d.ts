/**
 * Heartbeat Monitoring and Anti-Stagnation Service
 *
 * Implements robust monitoring of agent communications and workflow progress
 * Provides fallback mechanisms for stalled communications and automatic recovery
 */
import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
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
     * Perform comprehensive health check
     */
    private performHealthCheck;
    /**
     * Handle heartbeat timeout
     */
    private handleHeartbeatTimeout;
    /**
     * Handle activity stagnation
     */
    private handleActivityStagnation;
    /**
     * Create stagnation alert
     */
    private createStagnationAlert;
    /**
     * Clear stagnation alert
     */
    private clearStagnationAlert;
    /**
     * Trigger fallback mechanism based on severity
     */
    private triggerFallbackMechanism;
    /**
     * Execute specific fallback action
     */
    private executeFallbackAction;
    /**
     * Execute retry action
     */
    private executeRetryAction;
    /**
     * Execute escalation action
     */
    private executeEscalationAction;
    /**
     * Execute reassign action
     */
    private executeReassignAction;
    /**
     * Execute human notification action
     */
    private executeHumanNotificationAction;
    /**
     * Execute emergency stop action
     */
    private executeEmergencyStopAction;
    /**
     * Process queued human notifications
     */
    private processHumanNotifications;
    /**
     * Create consolidated notification message
     */
    private createConsolidatedNotification;
    /**
     * Update agent status based on timing thresholds
     */
    private updateAgentStatus;
    /**
     * Calculate severity based on duration and failure count
     */
    private calculateSeverity;
    /**
     * Get monitoring status
     */
    getMonitoringStatus(): {
        activeAgents: number;
        stalledAgents: number;
        failedAgents: number;
        activeAlerts: number;
        humanNotificationsPending: number;
    };
    /**
     * Get agent heartbeat details
     */
    getAgentHeartbeat(agentId: string): AgentHeartbeat | undefined;
    /**
     * Get all stagnation alerts
     */
    getStagnationAlerts(): StagnationAlert[];
    /**
     * Get agent health status
     */
    getAgentHealth(agentId: string): Promise<{
        agentId: string;
        status: string;
        lastHeartbeat: Date;
        lastActivity: Date;
        consecutiveFailures: number;
        isHealthy: boolean;
        timeSinceLastHeartbeat: number;
        timeSinceLastActivity: number;
    } | null>;
    /**
     * Get overall stagnation status
     */
    getStagnationStatus(): Promise<{
        totalAgents: number;
        activeAgents: number;
        stalledAgents: number;
        failedAgents: number;
        activeAlerts: StagnationAlert[];
        criticalAlerts: number;
        emergencyAlerts: number;
        averageResponseTime: number;
    }>;
}
//# sourceMappingURL=HeartbeatMonitoringService.d.ts.map