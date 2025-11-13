/**
 * AgentHubMonitor
 * Comprehensive monitoring service for AgentHub and TRAYCER functionality
 */
import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
/**
 * Comprehensive monitoring service for the AgentHub and TRAYCER functionality
 *
 * Features:
 * - Performance metrics tracking (response times, throughput, success rates)
 * - Health monitoring for agents, connections, and services
 * - Usage analytics and pattern tracking
 * - Error tracking and analysis
 * - Resource monitoring (CPU, memory, network, disk)
 * - Real-time dashboards and alerting
 * - Historical data analysis and trending
 * - Integration monitoring between services
 * - Export capabilities for external analysis
 * - Automatic alerting on performance degradation
 */
export declare class AgentHubMonitor implements OnModuleInit, OnModuleDestroy {
    private readonly eventEmitter;
    private readonly logger;
    private performanceMetrics;
    private healthMetrics;
    private usageMetrics;
    private errorMetrics;
    private resourceMetrics;
    private activeTaskTimers;
    private alertCooldowns;
    private historicalData;
    private maxHistorySize;
    private monitoringEnabled;
    private alertDefinitions;
    constructor(eventEmitter: EventEmitter2);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    /**
     * Setup event listeners for monitoring various events
     */
    private setupEventListeners;
    /**
     * Start monitoring processes
     */
    private startMonitoring;
    /**
     * Stop monitoring processes
     */
    private stopMonitoring;
    /**
     * Task monitoring methods
     */
    private onTaskStarted;
    private onTaskCompleted;
    private onTaskFailed;
    /**
     * Agent monitoring methods
     */
    private onAgentRegistered;
    private onAgentStatusUpdated;
    /**
     * Service monitoring methods
     */
    private onServiceHealthCheck;
    /**
     * API usage monitoring
     */
    private onApiRequest;
    /**
     * Error monitoring
     */
    private onError;
    /**
     * Update performance metrics calculations
     */
    private updatePerformanceMetrics;
    /**
     * Update agent status counts
     */
    private updateAgentStatusCounts;
    /**
     * Collect resource metrics
     */
    private collectResourceMetrics;
    /**
     * Check alerts and notifications
     */
    private checkAlerts;
    /**
     * Trigger an alert
     */
    private triggerAlert;
}
//# sourceMappingURL=AgentHubMonitor.d.ts.map