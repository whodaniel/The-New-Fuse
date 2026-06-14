/**
 * Monitor Bridge - Agent and system monitoring
 *
 * Provides monitoring capabilities for agents:
 * - Performance tracking
 * - Error monitoring
 * - Resource usage
 * - Activity logging
 * - Alerting
 */
import { BaseBridge, MessageType, Priority } from './index.js';
export interface AgentMonitorData {
    agentId: string;
    name: string;
    status: 'active' | 'idle' | 'error' | 'offline';
    lastSeen: Date;
    metrics: {
        tasksCompleted: number;
        tasksFailed: number;
        averageLatency: number;
        memoryUsage: number;
        cpuUsage: number;
    };
    activeTask?: string;
}
export interface AlertConfig {
    id: string;
    name: string;
    condition: (data: AgentMonitorData) => boolean;
    severity: 'info' | 'warning' | 'critical';
    cooldownMs: number;
    actions: Array<(alert: Alert) => Promise<void>>;
}
export interface Alert {
    id: string;
    configId: string;
    severity: AlertConfig['severity'];
    agentId: string;
    message: string;
    timestamp: Date;
    data: Record<string, unknown>;
    acknowledged: boolean;
}
export interface PerformanceMetric {
    name: string;
    value: number;
    unit: string;
    timestamp: Date;
    tags: Record<string, string>;
}
export declare class MonitorBridge extends BaseBridge {
    private agents;
    private alerts;
    private alertConfigs;
    private alertCooldowns;
    private metrics;
    private maxMetricsSize;
    private monitorInterval;
    private monitorIntervalMs;
    constructor();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendMessage(message: Record<string, unknown>, messageType?: MessageType, priority?: Priority): Promise<void>;
    /**
     * Register an agent for monitoring
     */
    registerAgent(agent: Partial<AgentMonitorData>): void;
    /**
     * Update agent monitoring data
     */
    updateAgent(agentId: string, updates: Partial<AgentMonitorData>): void;
    /**
     * Record agent heartbeat
     */
    recordHeartbeat(agentId: string): void;
    /**
     * Get all monitored agents
     */
    getAllAgents(): AgentMonitorData[];
    /**
     * Get agent by ID
     */
    getAgent(agentId: string): AgentMonitorData | undefined;
    /**
     * Get agents by status
     */
    getAgentsByStatus(status: AgentMonitorData['status']): AgentMonitorData[];
    /**
     * Register an alert configuration
     */
    registerAlertConfig(config: AlertConfig): void;
    /**
     * Check alerts for an agent
     */
    private checkAlerts;
    /**
     * Trigger an alert
     */
    private triggerAlert;
    /**
     * Acknowledge an alert
     */
    acknowledgeAlert(alertId: string): void;
    /**
     * Get active (unacknowledged) alerts
     */
    getActiveAlerts(): Alert[];
    /**
     * Get all alerts
     */
    getAllAlerts(): Alert[];
    /**
     * Register default alert configurations
     */
    private registerDefaultAlerts;
    /**
     * Record a performance metric
     */
    recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void;
    /**
     * Get metrics by name
     */
    getMetrics(name: string, limit?: number): PerformanceMetric[];
    /**
     * Start monitoring
     */
    startMonitoring(): void;
    /**
     * Stop monitoring
     */
    stopMonitoring(): void;
    /**
     * Check health of all agents
     */
    private checkAgentHealth;
    getStatistics(): {
        connected: boolean;
        agents: number;
        activeAgents: number;
        offlineAgents: number;
        alerts: number;
        activeAlerts: number;
        metricsCount: number;
    };
}
export default MonitorBridge;
//# sourceMappingURL=monitor_bridge.d.ts.map