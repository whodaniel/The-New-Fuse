"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsCollector = void 0;
const events_1 = require("events");
const types_js_1 = require("../core/types.js");
/**
 * Metrics collector for monitoring coordination system
 */
class MetricsCollector extends events_1.EventEmitter {
    constructor(maxHistorySize = 10000) {
        super();
        this.taskExecutions = new Map();
        this.completedExecutions = [];
        this.startTime = new Date();
        this.maxHistorySize = maxHistorySize;
    }
    /**
     * Record task started
     */
    recordTaskStarted(task, agentId) {
        const execution = {
            taskId: task.id,
            startTime: new Date(),
            status: types_js_1.TaskStatus.IN_PROGRESS,
            agentId,
        };
        this.taskExecutions.set(task.id, execution);
        this.emit('metrics:task:started', execution);
    }
    /**
     * Record task completed
     */
    recordTaskCompleted(taskId) {
        const execution = this.taskExecutions.get(taskId);
        if (!execution)
            return;
        execution.endTime = new Date();
        execution.duration =
            execution.endTime.getTime() - execution.startTime.getTime();
        execution.status = types_js_1.TaskStatus.COMPLETED;
        this.taskExecutions.delete(taskId);
        this.addToHistory(execution);
        this.emit('metrics:task:completed', execution);
    }
    /**
     * Record task failed
     */
    recordTaskFailed(taskId) {
        const execution = this.taskExecutions.get(taskId);
        if (!execution)
            return;
        execution.endTime = new Date();
        execution.duration =
            execution.endTime.getTime() - execution.startTime.getTime();
        execution.status = types_js_1.TaskStatus.FAILED;
        this.taskExecutions.delete(taskId);
        this.addToHistory(execution);
        this.emit('metrics:task:failed', execution);
    }
    /**
     * Add execution to history (with size limit)
     */
    addToHistory(execution) {
        this.completedExecutions.push(execution);
        // Trim history if it exceeds max size
        if (this.completedExecutions.length > this.maxHistorySize) {
            this.completedExecutions.shift();
        }
    }
    /**
     * Get current performance metrics
     */
    getCurrentMetrics(activeAgents, queueDepth) {
        const now = new Date();
        const totalTasks = this.completedExecutions.length;
        const successfulTasks = this.completedExecutions.filter((e) => e.status === types_js_1.TaskStatus.COMPLETED).length;
        const successRate = totalTasks > 0 ? successfulTasks / totalTasks : 0;
        const executionTimes = this.completedExecutions
            .filter((e) => e.duration !== undefined)
            .map((e) => e.duration);
        const averageExecutionTime = executionTimes.length > 0
            ? executionTimes.reduce((sum, time) => sum + time, 0) /
                executionTimes.length
            : 0;
        // Calculate tasks per second (last minute)
        const oneMinuteAgo = new Date(now.getTime() - 60000);
        const recentTasks = this.completedExecutions.filter((e) => e.endTime && e.endTime >= oneMinuteAgo);
        const tasksPerSecond = recentTasks.length / 60;
        return {
            totalTasksProcessed: totalTasks,
            successRate,
            averageExecutionTime,
            tasksPerSecond,
            activeAgents: activeAgents.length,
            queueDepth,
            timestamp: now,
        };
    }
    /**
     * Get detailed metrics for a time period
     */
    getDetailedMetrics(startDate, endDate, agents) {
        const periodExecutions = this.completedExecutions.filter((e) => e.endTime &&
            e.endTime >= startDate &&
            e.endTime <= endDate);
        const completed = periodExecutions.filter((e) => e.status === types_js_1.TaskStatus.COMPLETED).length;
        const failed = periodExecutions.filter((e) => e.status === types_js_1.TaskStatus.FAILED).length;
        const executionTimes = periodExecutions
            .filter((e) => e.duration !== undefined)
            .map((e) => e.duration)
            .sort((a, b) => a - b);
        const avgExecTime = executionTimes.length > 0
            ? executionTimes.reduce((sum, t) => sum + t, 0) / executionTimes.length
            : 0;
        const periodDuration = (endDate.getTime() - startDate.getTime()) / 1000; // seconds
        const totalLoad = agents.reduce((sum, agent) => sum + agent.currentLoad, 0);
        const totalCapacity = agents.reduce((sum, agent) => sum + agent.maxConcurrentTasks, 0);
        return {
            period: {
                start: startDate,
                end: endDate,
            },
            tasks: {
                total: periodExecutions.length,
                completed,
                failed,
                pending: 0, // Would need access to task queue
                inProgress: this.taskExecutions.size,
                cancelled: 0,
            },
            performance: {
                successRate: periodExecutions.length > 0 ? completed / periodExecutions.length : 0,
                failureRate: periodExecutions.length > 0 ? failed / periodExecutions.length : 0,
                averageExecutionTime: avgExecTime,
                minExecutionTime: executionTimes.length > 0 ? executionTimes[0] : 0,
                maxExecutionTime: executionTimes.length > 0
                    ? executionTimes[executionTimes.length - 1]
                    : 0,
                p50ExecutionTime: this.percentile(executionTimes, 0.5),
                p95ExecutionTime: this.percentile(executionTimes, 0.95),
                p99ExecutionTime: this.percentile(executionTimes, 0.99),
            },
            throughput: {
                tasksPerSecond: periodDuration > 0 ? periodExecutions.length / periodDuration : 0,
                tasksPerMinute: periodDuration > 0 ? (periodExecutions.length / periodDuration) * 60 : 0,
                tasksPerHour: periodDuration > 0 ? (periodExecutions.length / periodDuration) * 3600 : 0,
            },
            agents: {
                total: agents.length,
                active: agents.filter((a) => a.status === 'busy').length,
                idle: agents.filter((a) => a.status === 'idle').length,
                offline: agents.filter((a) => a.status === 'offline').length,
                averageLoad: agents.length > 0 ? totalLoad / agents.length : 0,
                utilizationRate: totalCapacity > 0 ? totalLoad / totalCapacity : 0,
            },
            queue: {
                depth: 0, // Would need access to task queue
                averageWaitTime: 0, // Would need to track wait times
            },
        };
    }
    /**
     * Calculate percentile of execution times
     */
    percentile(sortedValues, p) {
        if (sortedValues.length === 0)
            return 0;
        const index = Math.ceil(sortedValues.length * p) - 1;
        return sortedValues[Math.max(0, index)];
    }
    /**
     * Get metrics by agent
     */
    getAgentMetrics(agentId) {
        const agentExecutions = this.completedExecutions.filter((e) => e.agentId === agentId);
        const completed = agentExecutions.filter((e) => e.status === types_js_1.TaskStatus.COMPLETED).length;
        const failed = agentExecutions.filter((e) => e.status === types_js_1.TaskStatus.FAILED).length;
        const executionTimes = agentExecutions
            .filter((e) => e.duration !== undefined)
            .map((e) => e.duration);
        const avgExecTime = executionTimes.length > 0
            ? executionTimes.reduce((sum, t) => sum + t, 0) / executionTimes.length
            : 0;
        return {
            tasksCompleted: completed,
            tasksFailed: failed,
            averageExecutionTime: avgExecTime,
            successRate: agentExecutions.length > 0 ? completed / agentExecutions.length : 0,
        };
    }
    /**
     * Get metrics summary
     */
    getSummary() {
        const now = new Date();
        const uptime = now.getTime() - this.startTime.getTime();
        const completed = this.completedExecutions.filter((e) => e.status === types_js_1.TaskStatus.COMPLETED).length;
        return {
            uptime,
            totalTasksProcessed: this.completedExecutions.length,
            currentlyProcessing: this.taskExecutions.size,
            overallSuccessRate: this.completedExecutions.length > 0
                ? completed / this.completedExecutions.length
                : 0,
        };
    }
    /**
     * Export metrics to JSON
     */
    exportMetrics() {
        return {
            startTime: this.startTime,
            completedExecutions: this.completedExecutions,
            activeExecutions: Array.from(this.taskExecutions.values()),
            summary: this.getSummary(),
        };
    }
    /**
     * Clear all metrics
     */
    clear() {
        this.taskExecutions.clear();
        this.completedExecutions = [];
        this.startTime = new Date();
        this.emit('metrics:cleared');
    }
    /**
     * Get recent execution history
     */
    getRecentHistory(count = 100) {
        return this.completedExecutions.slice(-count);
    }
}
exports.MetricsCollector = MetricsCollector;
//# sourceMappingURL=MetricsCollector.js.map