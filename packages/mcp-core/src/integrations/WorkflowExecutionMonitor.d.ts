/**
 * Workflow Execution Monitor
 *
 * Provides comprehensive monitoring and tracking capabilities for MCP workflow executions.
 * Handles execution status tracking, performance metrics, and error recovery.
 */
import { EventEmitter } from 'events';
import { ExecutionStatus, TaskExecutionStatus, MCPCallback, ErrorRecoveryConfig, MonitoringConfig } from '../interfaces/IMCPWorkflowIntegration';
/**
 * Execution metrics for monitoring
 */
export interface ExecutionMetrics {
    /** Total number of executions */
    totalExecutions: number;
    /** Currently active executions */
    activeExecutions: number;
    /** Successfully completed executions */
    completedExecutions: number;
    /** Failed executions */
    failedExecutions: number;
    /** Cancelled executions */
    cancelledExecutions: number;
    /** Average execution duration in milliseconds */
    averageExecutionTime: number;
    /** Success rate as percentage */
    successRate: number;
    /** Error rate as percentage */
    errorRate: number;
    /** Executions per minute */
    executionsPerMinute: number;
    /** Last update timestamp */
    lastUpdated: Date;
}
/**
 * Execution event for monitoring
 */
export interface ExecutionEvent {
    /** Event type */
    type: 'started' | 'progress' | 'completed' | 'failed' | 'cancelled' | 'timeout';
    /** Execution ID */
    executionId: string;
    /** Event timestamp */
    timestamp: Date;
    /** Event payload */
    payload?: any;
    /** Event metadata */
    metadata?: Record<string, any>;
}
/**
 * Execution history entry
 */
export interface ExecutionHistoryEntry {
    /** Execution ID */
    executionId: string;
    /** Workflow ID */
    workflowId?: string;
    /** Step ID */
    stepId?: string;
    /** Execution status */
    status: TaskExecutionStatus;
    /** Start time */
    startedAt: Date;
    /** Completion time */
    completedAt?: Date;
    /** Execution duration in milliseconds */
    duration?: number;
    /** Error message if failed */
    error?: string;
    /** Execution result */
    result?: any;
    /** Execution metadata */
    metadata?: Record<string, any>;
}
/**
 * Alert configuration
 */
export interface AlertConfig {
    /** Alert type */
    type: 'error_rate' | 'execution_time' | 'failure_count' | 'timeout_rate';
    /** Alert threshold */
    threshold: number;
    /** Time window for evaluation in milliseconds */
    timeWindow: number;
    /** Whether alert is enabled */
    enabled: boolean;
    /** Alert callback function */
    callback?: (alert: AlertEvent) => void;
}
/**
 * Alert event
 */
export interface AlertEvent {
    /** Alert type */
    type: string;
    /** Alert severity */
    severity: 'low' | 'medium' | 'high' | 'critical';
    /** Alert message */
    message: string;
    /** Current value that triggered the alert */
    currentValue: number;
    /** Alert threshold */
    threshold: number;
    /** Alert timestamp */
    timestamp: Date;
    /** Related execution IDs */
    executionIds?: string[];
    /** Alert metadata */
    metadata?: Record<string, any>;
}
/**
 * Workflow Execution Monitor implementation
 */
export declare class WorkflowExecutionMonitor extends EventEmitter {
    private readonly config;
    private readonly errorRecovery;
    private readonly executions;
    private readonly executionHistory;
    private readonly executionEvents;
    private readonly alerts;
    private readonly metrics;
    private metricsUpdateInterval?;
    private historyCleanupInterval?;
    private isStarted;
    constructor(config: MonitoringConfig, errorRecovery: ErrorRecoveryConfig);
    /**
     * Start the execution monitor
     */
    start(): void;
    /**
     * Stop the execution monitor
     */
    stop(): void;
    /**
     * Track a new execution
     */
    trackExecution(executionId: string, initialStatus: ExecutionStatus): void;
    /**
     * Update execution status
     */
    updateExecutionStatus(executionId: string, status: TaskExecutionStatus, progress?: number, message?: string, result?: any): void;
    /**
     * Handle MCP callback and update execution accordingly
     */
    handleCallback(callback: MCPCallback): void;
    /**
     * Get execution status
     */
    getExecutionStatus(executionId: string): ExecutionStatus | null;
    /**
     * Get all active executions
     */
    getActiveExecutions(): ExecutionStatus[];
    /**
     * Get execution history
     */
    getExecutionHistory(limit?: number, offset?: number): ExecutionHistoryEntry[];
    /**
     * Get execution events
     */
    getExecutionEvents(executionId?: string, limit?: number): ExecutionEvent[];
    /**
     * Get current metrics
     */
    getMetrics(): ExecutionMetrics;
    /**
     * Configure alert
     */
    configureAlert(id: string, config: AlertConfig): void;
    /**
     * Remove alert configuration
     */
    removeAlert(id: string): void;
    /**
     * Get alert configurations
     */
    getAlerts(): Map<string, AlertConfig>;
    /**
     * Cancel execution
     */
    cancelExecution(executionId: string, reason?: string): void;
    /**
     * Clean up completed executions
     */
    cleanupExecutions(olderThanMs?: number): number;
    private setupDefaultAlerts;
    private addExecutionEvent;
    private updateMetrics;
    private checkAlerts;
    private evaluateAlert;
    private createAlert;
    private determineAlertSeverity;
    private generateAlertMessage;
    private getCurrentAlertValue;
    private getEventTypeFromStatus;
    private mapCallbackStatusToExecutionStatus;
    private cleanupHistory;
}
//# sourceMappingURL=WorkflowExecutionMonitor.d.ts.map