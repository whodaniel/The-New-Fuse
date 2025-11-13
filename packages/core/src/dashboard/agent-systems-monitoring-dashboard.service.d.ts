import { EventEmitter2 } from '@nestjs/event-emitter';
/**
 * System Component Types for Monitoring
 */
export declare enum SystemComponent {
    AGENT_FEDERATION = "agent-federation",
    TERMINAL_ORCHESTRATION = "terminal-orchestration",
    VSCODE_BRIDGE = "vscode-bridge",
    DACC_SYSTEM = "dacc-system",
    MULTI_PROTOCOL = "multi-protocol",
    TNF_CLI = "tnf-cli",
    API_GATEWAY = "api-gateway",
    DATABASE = "database",
    AUTHENTICATION = "authentication",
    FILE_SYSTEM = "file-system"
}
/**
 * Health Status Levels
 */
export declare enum HealthStatus {
    HEALTHY = "healthy",
    WARNING = "warning",
    CRITICAL = "critical",
    OFFLINE = "offline",
    UNKNOWN = "unknown"
}
/**
 * Metric Data Point
 */
export interface MetricDataPoint {
    timestamp: number;
    value: number;
    unit: string;
    metadata?: Record<string, any>;
}
/**
 * System Component Health
 */
export interface ComponentHealth {
    component: SystemComponent;
    status: HealthStatus;
    lastCheck: number;
    uptime: number;
    errorCount: number;
    warningCount: number;
    metrics: Record<string, MetricDataPoint[]>;
    dependencies: SystemComponent[];
    details: {
        version: string;
        environment: string;
        configuration: Record<string, any>;
        endpoints: string[];
        activeConnections: number;
        resourceUsage: {
            cpu: number;
            memory: number;
            disk: number;
            network: number;
        };
    };
}
/**
 * Agent Performance Metrics
 */
export interface AgentMetrics {
    agentId: string;
    agentType: string;
    systemComponent: SystemComponent;
    performance: {
        tasksCompleted: number;
        tasksActive: number;
        tasksFailed: number;
        averageResponseTime: number;
        successRate: number;
        throughput: number;
    };
    resources: {
        cpuUsage: number;
        memoryUsage: number;
        connectionCount: number;
    };
    status: HealthStatus;
    lastActive: number;
}
/**
 * System Event
 */
export interface SystemEvent {
    id: string;
    timestamp: number;
    component: SystemComponent;
    type: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    description: string;
    metadata: Record<string, any>;
    resolved: boolean;
    resolvedAt?: number;
}
/**
 * Dashboard Widget Configuration
 */
export interface DashboardWidget {
    id: string;
    type: 'chart' | 'status' | 'metrics' | 'logs' | 'network' | 'alerts';
    title: string;
    size: 'small' | 'medium' | 'large';
    position: {
        x: number;
        y: number;
    };
    configuration: Record<string, any>;
    dataSource: string;
    refreshInterval: number;
}
/**
 * Comprehensive Monitoring Dashboard Service
 *
 * Provides real-time monitoring and visualization for all agent systems:
 * - Agent Federation system health and performance
 * - Terminal Orchestration metrics and coordination status
 * - VSCode Bridge communication analytics
 * - DACC system orchestration metrics
 * - Multi-Protocol coordination statistics
 * - TNF CLI usage patterns and performance
 * - Real-time alerts and notifications
 * - Performance trending and analytics
 */
export declare class AgentSystemsMonitoringDashboardService {
    private readonly eventEmitter;
    private readonly logger;
    private server;
    private componentHealth;
    private agentMetrics;
    private systemEvents;
    private dashboardWidgets;
    private metricsHistory;
    private alertRules;
    private activeAlerts;
    private healthCheckInterval;
    private metricsCollectionInterval;
    private alertProcessingInterval;
    private readonly config;
    constructor(eventEmitter: EventEmitter2);
    /**
     * Initialize monitoring for all system components
     */
    private initializeSystemComponents;
    /**
     * Get component dependencies for dependency graph visualization
     */
    private getComponentDependencies;
    /**
     * Setup default alert rules
     */
    private setupDefaultAlertRules;
}
//# sourceMappingURL=agent-systems-monitoring-dashboard.service.d.ts.map