/**
 * Workflow Execution Monitor
 *
 * Provides comprehensive monitoring and tracking capabilities for MCP workflow executions.
 * Handles execution status tracking, performance metrics, and error recovery.
 */
import { EventEmitter } from 'events';
import { TaskExecutionStatus } from '../interfaces/IMCPWorkflowIntegration';
import { MCPErrorClass } from '../types/error';
/**
 * Workflow Execution Monitor implementation
 */
export class WorkflowExecutionMonitor extends EventEmitter {
    config;
    errorRecovery;
    executions = new Map();
    executionHistory = [];
    executionEvents = [];
    alerts = new Map();
    metrics;
    metricsUpdateInterval;
    historyCleanupInterval;
    isStarted = false;
    constructor(config, errorRecovery) {
        super();
        this.config = config;
        this.errorRecovery = errorRecovery;
        this.metrics = {
            totalExecutions: 0,
            activeExecutions: 0,
            completedExecutions: 0,
            failedExecutions: 0,
            cancelledExecutions: 0,
            averageExecutionTime: 0,
            successRate: 0,
            errorRate: 0,
            executionsPerMinute: 0,
            lastUpdated: new Date()
        };
        this.setupDefaultAlerts();
    }
    /**
     * Start the execution monitor
     */
    start() {
        if (this.isStarted) {
            return;
        }
        if (this.config.enableMetrics) {
            this.metricsUpdateInterval = setInterval(() => {
                this.updateMetrics();
            }, this.config.metricsInterval);
        }
        // Clean up old history entries every hour
        this.historyCleanupInterval = setInterval(() => {
            this.cleanupHistory();
        }, 60 * 60 * 1000);
        this.isStarted = true;
        this.emit('started');
    }
    /**
     * Stop the execution monitor
     */
    stop() {
        if (!this.isStarted) {
            return;
        }
        if (this.metricsUpdateInterval) {
            clearInterval(this.metricsUpdateInterval);
            this.metricsUpdateInterval = undefined;
        }
        if (this.historyCleanupInterval) {
            clearInterval(this.historyCleanupInterval);
            this.historyCleanupInterval = undefined;
        }
        this.isStarted = false;
        this.emit('stopped');
    }
    /**
     * Track a new execution
     */
    trackExecution(executionId, initialStatus) {
        this.executions.set(executionId, { ...initialStatus });
        const event = {
            type: 'started',
            executionId,
            timestamp: new Date(),
            payload: { status: initialStatus.status }
        };
        this.addExecutionEvent(event);
        // Add to history
        this.executionHistory.push({
            executionId,
            status: initialStatus.status,
            startedAt: new Date(),
            metadata: initialStatus.metadata
        });
        this.metrics.totalExecutions++;
        this.emit('executionStarted', { executionId, status: initialStatus });
    }
    /**
     * Update execution status
     */
    updateExecutionStatus(executionId, status, progress, message, result) {
        const execution = this.executions.get(executionId);
        if (!execution) {
            throw new MCPErrorClass(-32001, `Execution not found: ${executionId}`);
        }
        const previousStatus = execution.status;
        execution.status = status;
        execution.lastUpdated = new Date();
        if (progress !== undefined) {
            execution.progress = progress;
        }
        if (message !== undefined) {
            execution.message = message;
        }
        // Add to intermediate results if provided
        if (result !== undefined) {
            execution.intermediateResults = execution.intermediateResults || [];
            execution.intermediateResults.push(result);
        }
        // Update history entry
        const historyEntry = this.executionHistory.find(h => h.executionId === executionId);
        if (historyEntry) {
            historyEntry.status = status;
            if (status === TaskExecutionStatus.COMPLETED || status === TaskExecutionStatus.FAILED || status === TaskExecutionStatus.CANCELLED) {
                historyEntry.completedAt = new Date();
                historyEntry.duration = historyEntry.completedAt.getTime() - historyEntry.startedAt.getTime();
                if (status === TaskExecutionStatus.FAILED && message) {
                    historyEntry.error = message;
                }
                if (result !== undefined) {
                    historyEntry.result = result;
                }
            }
        }
        // Create execution event
        const eventType = this.getEventTypeFromStatus(status, previousStatus);
        const event = {
            type: eventType,
            executionId,
            timestamp: new Date(),
            payload: { status, progress, message, result }
        };
        this.addExecutionEvent(event);
        // Check for alerts
        this.checkAlerts(executionId, status, execution);
        this.emit('executionUpdated', { executionId, status: execution, previousStatus });
    }
    /**
     * Handle MCP callback and update execution accordingly
     */
    handleCallback(callback) {
        const execution = this.executions.get(callback.executionId);
        if (!execution) {
            // Create a new execution if it doesn't exist (for external callbacks)
            this.trackExecution(callback.executionId, {
                executionId: callback.executionId,
                status: TaskExecutionStatus.RUNNING,
                lastUpdated: new Date(),
                metadata: { source: callback.source }
            });
        }
        switch (callback.type) {
            case 'progress':
                this.updateExecutionStatus(callback.executionId, TaskExecutionStatus.RUNNING, callback.payload.progress, callback.payload.message);
                break;
            case 'result':
                this.updateExecutionStatus(callback.executionId, TaskExecutionStatus.COMPLETED, 100, 'Execution completed successfully', callback.payload);
                break;
            case 'error':
                this.updateExecutionStatus(callback.executionId, TaskExecutionStatus.FAILED, undefined, callback.payload.error || 'Execution failed');
                break;
            case 'status':
                const status = this.mapCallbackStatusToExecutionStatus(callback.payload.status);
                this.updateExecutionStatus(callback.executionId, status, callback.payload.progress, callback.payload.message);
                break;
        }
        this.emit('callbackProcessed', callback);
    }
    /**
     * Get execution status
     */
    getExecutionStatus(executionId) {
        const execution = this.executions.get(executionId);
        return execution ? { ...execution } : null;
    }
    /**
     * Get all active executions
     */
    getActiveExecutions() {
        return Array.from(this.executions.values())
            .filter(e => e.status === TaskExecutionStatus.RUNNING || e.status === TaskExecutionStatus.PENDING)
            .map(e => ({ ...e }));
    }
    /**
     * Get execution history
     */
    getExecutionHistory(limit, offset) {
        const sorted = [...this.executionHistory].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
        if (limit !== undefined) {
            const start = offset || 0;
            return sorted.slice(start, start + limit);
        }
        return sorted;
    }
    /**
     * Get execution events
     */
    getExecutionEvents(executionId, limit) {
        let events = executionId
            ? this.executionEvents.filter(e => e.executionId === executionId)
            : [...this.executionEvents];
        events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        if (limit !== undefined) {
            events = events.slice(0, limit);
        }
        return events;
    }
    /**
     * Get current metrics
     */
    getMetrics() {
        this.updateMetrics();
        return { ...this.metrics };
    }
    /**
     * Configure alert
     */
    configureAlert(id, config) {
        this.alerts.set(id, config);
        this.emit('alertConfigured', { id, config });
    }
    /**
     * Remove alert configuration
     */
    removeAlert(id) {
        this.alerts.delete(id);
        this.emit('alertRemoved', { id });
    }
    /**
     * Get alert configurations
     */
    getAlerts() {
        return new Map(this.alerts);
    }
    /**
     * Cancel execution
     */
    cancelExecution(executionId, reason) {
        const execution = this.executions.get(executionId);
        if (!execution) {
            throw new MCPErrorClass(-32001, `Execution not found: ${executionId}`);
        }
        if (execution.status === TaskExecutionStatus.COMPLETED ||
            execution.status === TaskExecutionStatus.FAILED ||
            execution.status === TaskExecutionStatus.CANCELLED) {
            throw new MCPErrorClass(-32602, `Cannot cancel execution in status: ${execution.status}`);
        }
        this.updateExecutionStatus(executionId, TaskExecutionStatus.CANCELLED, undefined, reason || 'Execution cancelled');
        this.emit('executionCancelled', { executionId, reason });
    }
    /**
     * Clean up completed executions
     */
    cleanupExecutions(olderThanMs = 24 * 60 * 60 * 1000) {
        const cutoffTime = new Date(Date.now() - olderThanMs);
        let cleanedCount = 0;
        for (const [executionId, status] of this.executions.entries()) {
            if (status.lastUpdated < cutoffTime &&
                (status.status === TaskExecutionStatus.COMPLETED ||
                    status.status === TaskExecutionStatus.FAILED ||
                    status.status === TaskExecutionStatus.CANCELLED)) {
                this.executions.delete(executionId);
                cleanedCount++;
            }
        }
        return cleanedCount;
    }
    // Private helper methods
    setupDefaultAlerts() {
        // High error rate alert
        this.configureAlert('high_error_rate', {
            type: 'error_rate',
            threshold: 20, // 20% error rate
            timeWindow: 5 * 60 * 1000, // 5 minutes
            enabled: true,
            callback: (alert) => this.emit('alert', alert)
        });
        // Long execution time alert
        this.configureAlert('long_execution_time', {
            type: 'execution_time',
            threshold: 30 * 1000, // 30 seconds
            timeWindow: 10 * 60 * 1000, // 10 minutes
            enabled: true,
            callback: (alert) => this.emit('alert', alert)
        });
        // High failure count alert
        this.configureAlert('high_failure_count', {
            type: 'failure_count',
            threshold: 10, // 10 failures
            timeWindow: 5 * 60 * 1000, // 5 minutes
            enabled: true,
            callback: (alert) => this.emit('alert', alert)
        });
    }
    addExecutionEvent(event) {
        this.executionEvents.push(event);
        // Keep only last 1000 events to prevent memory issues
        if (this.executionEvents.length > 1000) {
            this.executionEvents.splice(0, this.executionEvents.length - 1000);
        }
        if (this.config.enableDetailedLogging) {
            console.log(`[WorkflowExecutionMonitor] Event: ${event.type} for execution: ${event.executionId}`);
        }
    }
    updateMetrics() {
        const executions = Array.from(this.executions.values());
        const history = this.executionHistory;
        this.metrics.activeExecutions = executions.filter(e => e.status === TaskExecutionStatus.RUNNING || e.status === TaskExecutionStatus.PENDING).length;
        this.metrics.completedExecutions = history.filter(h => h.status === TaskExecutionStatus.COMPLETED).length;
        this.metrics.failedExecutions = history.filter(h => h.status === TaskExecutionStatus.FAILED).length;
        this.metrics.cancelledExecutions = history.filter(h => h.status === TaskExecutionStatus.CANCELLED).length;
        // Calculate success and error rates
        const totalCompleted = this.metrics.completedExecutions + this.metrics.failedExecutions + this.metrics.cancelledExecutions;
        if (totalCompleted > 0) {
            this.metrics.successRate = (this.metrics.completedExecutions / totalCompleted) * 100;
            this.metrics.errorRate = (this.metrics.failedExecutions / totalCompleted) * 100;
        }
        // Calculate average execution time
        const completedWithDuration = history.filter(h => h.duration !== undefined);
        if (completedWithDuration.length > 0) {
            const totalDuration = completedWithDuration.reduce((sum, h) => sum + (h.duration || 0), 0);
            this.metrics.averageExecutionTime = totalDuration / completedWithDuration.length;
        }
        // Calculate executions per minute (last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentExecutions = history.filter(h => h.startedAt > fiveMinutesAgo);
        this.metrics.executionsPerMinute = (recentExecutions.length / 5);
        this.metrics.lastUpdated = new Date();
        this.emit('metricsUpdated', this.metrics);
    }
    checkAlerts(executionId, status, execution) {
        for (const [alertId, alertConfig] of this.alerts.entries()) {
            if (!alertConfig.enabled) {
                continue;
            }
            try {
                const shouldAlert = this.evaluateAlert(alertConfig, executionId, status, execution);
                if (shouldAlert) {
                    const alert = this.createAlert(alertId, alertConfig, executionId);
                    if (alertConfig.callback) {
                        alertConfig.callback(alert);
                    }
                    this.emit('alert', alert);
                }
            }
            catch (error) {
                console.error(`[WorkflowExecutionMonitor] Error evaluating alert ${alertId}:`, error);
            }
        }
    }
    evaluateAlert(config, executionId, status, execution) {
        const timeWindow = new Date(Date.now() - config.timeWindow);
        const recentHistory = this.executionHistory.filter(h => h.startedAt > timeWindow);
        const totalRecent = recentHistory.length;
        switch (config.type) {
            case 'error_rate':
                const failedRecent = recentHistory.filter(h => h.status === TaskExecutionStatus.FAILED).length;
                const errorRate = totalRecent > 0 ? (failedRecent / totalRecent) * 100 : 0;
                return errorRate > config.threshold;
            case 'execution_time':
                const historyEntry = this.executionHistory.find(h => h.executionId === executionId);
                if (historyEntry && historyEntry.duration) {
                    return historyEntry.duration > config.threshold;
                }
                return false;
            case 'failure_count':
                const failureCount = recentHistory.filter(h => h.status === TaskExecutionStatus.FAILED).length;
                return failureCount > config.threshold;
            case 'timeout_rate':
                const timeoutCount = recentHistory.filter(h => h.status === TaskExecutionStatus.TIMEOUT).length;
                const timeoutRate = totalRecent > 0 ? (timeoutCount / totalRecent) * 100 : 0;
                return timeoutRate > config.threshold;
            default:
                return false;
        }
    }
    createAlert(alertId, config, executionId) {
        const severity = this.determineAlertSeverity(config);
        return {
            type: config.type,
            severity,
            message: this.generateAlertMessage(config, executionId),
            currentValue: this.getCurrentAlertValue(config),
            threshold: config.threshold,
            timestamp: new Date(),
            executionIds: [executionId],
            metadata: { alertId }
        };
    }
    determineAlertSeverity(config) {
        switch (config.type) {
            case 'error_rate':
                return config.threshold > 50 ? 'critical' : config.threshold > 20 ? 'high' : 'medium';
            case 'execution_time':
                return config.threshold > 60000 ? 'critical' : config.threshold > 30000 ? 'high' : 'medium';
            case 'failure_count':
                return config.threshold > 20 ? 'critical' : config.threshold > 10 ? 'high' : 'medium';
            default:
                return 'medium';
        }
    }
    generateAlertMessage(config, executionId) {
        switch (config.type) {
            case 'error_rate':
                return `High error rate detected: ${this.getCurrentAlertValue(config).toFixed(1)}% (threshold: ${config.threshold}%)`;
            case 'execution_time':
                return `Long execution time detected for ${executionId}: ${this.getCurrentAlertValue(config)}ms (threshold: ${config.threshold}ms)`;
            case 'failure_count':
                return `High failure count detected: ${this.getCurrentAlertValue(config)} failures (threshold: ${config.threshold})`;
            default:
                return `Alert triggered for ${config.type}`;
        }
    }
    getCurrentAlertValue(config) {
        const timeWindow = new Date(Date.now() - config.timeWindow);
        const recentHistory = this.executionHistory.filter(h => h.startedAt > timeWindow);
        switch (config.type) {
            case 'error_rate':
                const totalRecent = recentHistory.length;
                const failedRecent = recentHistory.filter(h => h.status === TaskExecutionStatus.FAILED).length;
                return totalRecent > 0 ? (failedRecent / totalRecent) * 100 : 0;
            case 'execution_time':
                const durations = recentHistory.filter(h => h.duration).map(h => h.duration);
                return durations.length > 0 ? Math.max(...durations) : 0;
            case 'failure_count':
                return recentHistory.filter(h => h.status === TaskExecutionStatus.FAILED).length;
            default:
                return 0;
        }
    }
    getEventTypeFromStatus(status, previousStatus) {
        if (status === TaskExecutionStatus.COMPLETED)
            return 'completed';
        if (status === TaskExecutionStatus.FAILED)
            return 'failed';
        if (status === TaskExecutionStatus.CANCELLED)
            return 'cancelled';
        if (status === TaskExecutionStatus.TIMEOUT)
            return 'timeout';
        if (status === TaskExecutionStatus.RUNNING && previousStatus !== TaskExecutionStatus.RUNNING)
            return 'started';
        return 'progress';
    }
    mapCallbackStatusToExecutionStatus(callbackStatus) {
        switch (callbackStatus.toLowerCase()) {
            case 'pending': return TaskExecutionStatus.PENDING;
            case 'running': return TaskExecutionStatus.RUNNING;
            case 'completed': return TaskExecutionStatus.COMPLETED;
            case 'failed': return TaskExecutionStatus.FAILED;
            case 'cancelled': return TaskExecutionStatus.CANCELLED;
            case 'timeout': return TaskExecutionStatus.TIMEOUT;
            default: return TaskExecutionStatus.RUNNING;
        }
    }
    cleanupHistory() {
        // Keep only last 1000 history entries
        if (this.executionHistory.length > 1000) {
            this.executionHistory.splice(0, this.executionHistory.length - 1000);
        }
        // Clean up old events
        if (this.executionEvents.length > 1000) {
            this.executionEvents.splice(0, this.executionEvents.length - 1000);
        }
    }
}
//# sourceMappingURL=WorkflowExecutionMonitor.js.map