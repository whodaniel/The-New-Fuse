"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityMonitor = void 0;
const events_1 = require("events");
/**
 * Activity monitor for real-time coordination tracking
 */
class ActivityMonitor extends events_1.EventEmitter {
    constructor(coordinator, agentPool, taskQueue, metricsCollector, maxLogSize = 1000) {
        super();
        this.activityLog = [];
        this.isMonitoring = false;
        this.alerts = new Map();
        this.coordinator = coordinator;
        this.agentPool = agentPool;
        this.taskQueue = taskQueue;
        this.metricsCollector = metricsCollector;
        this.maxLogSize = maxLogSize;
        this.setupEventListeners();
    }
    /**
     * Setup event listeners for activity tracking
     */
    setupEventListeners() {
        // Coordinator events
        this.coordinator.on('task:submitted', (task) => {
            this.logActivity({
                type: 'task',
                action: 'submitted',
                timestamp: new Date(),
                data: { taskId: task.id, type: task.type, priority: task.priority },
            });
        });
        this.coordinator.on('task:assigned', (task, assignment) => {
            this.logActivity({
                type: 'task',
                action: 'assigned',
                timestamp: new Date(),
                data: {
                    taskId: task.id,
                    agentId: assignment.agentId,
                },
            });
        });
        this.coordinator.on('task:completed', (task) => {
            this.logActivity({
                type: 'task',
                action: 'completed',
                timestamp: new Date(),
                data: {
                    taskId: task.id,
                    duration: (task.completedAt && task.startedAt)
                        ? task.completedAt.getTime() - task.startedAt.getTime()
                        : 0
                },
            });
        });
        this.coordinator.on('task:failed', (task, error) => {
            this.logActivity({
                type: 'task',
                action: 'failed',
                timestamp: new Date(),
                data: { taskId: task.id, error: error.message },
                severity: 'error',
            });
        });
        // Agent pool events
        this.agentPool.on('agent:registered', (agent) => {
            this.logActivity({
                type: 'agent',
                action: 'registered',
                timestamp: new Date(),
                data: { agentId: agent.id, name: agent.name, capabilities: agent.capabilities },
            });
        });
        this.agentPool.on('agent:unregistered', (agent) => {
            this.logActivity({
                type: 'agent',
                action: 'unregistered',
                timestamp: new Date(),
                data: { agentId: agent.id, name: agent.name },
                severity: 'warning',
            });
        });
        this.agentPool.on('agent:heartbeat:timeout', (agent) => {
            this.logActivity({
                type: 'agent',
                action: 'heartbeat-timeout',
                timestamp: new Date(),
                data: { agentId: agent.id, name: agent.name },
                severity: 'error',
            });
            this.raiseAlert(`Agent ${agent.id} heartbeat timeout`);
        });
        // System events
        this.coordinator.on('coordinator:started', () => {
            this.logActivity({
                type: 'system',
                action: 'coordinator-started',
                timestamp: new Date(),
                data: {},
            });
        });
        this.coordinator.on('coordinator:stopped', () => {
            this.logActivity({
                type: 'system',
                action: 'coordinator-stopped',
                timestamp: new Date(),
                data: {},
                severity: 'warning',
            });
        });
    }
    /**
     * Start monitoring
     */
    start(intervalMs = 5000) {
        if (this.isMonitoring) {
            return;
        }
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            void this.checkSystemHealth().catch((error) => {
                console.error('System health check failed:', error);
            });
        }, intervalMs);
        this.emit('monitoring:started');
    }
    /**
     * Stop monitoring
     */
    stop() {
        if (!this.isMonitoring) {
            return;
        }
        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }
        this.emit('monitoring:stopped');
    }
    /**
     * Log activity event
     */
    logActivity(event) {
        this.activityLog.push(event);
        // Trim log if it exceeds max size
        if (this.activityLog.length > this.maxLogSize) {
            this.activityLog.shift();
        }
        this.emit('activity:logged', event);
        // Emit specific event types
        if (event.severity === 'error' || event.severity === 'critical') {
            this.emit('activity:error', event);
        }
    }
    /**
     * Check system health
     */
    async checkSystemHealth() {
        const health = await this.getSystemHealth();
        this.emit('health:checked', health);
        // Raise alerts for degraded or critical states
        if (health.status === 'degraded') {
            this.raiseAlert('System health degraded');
        }
        else if (health.status === 'critical') {
            this.raiseAlert('System health critical', 'critical');
        }
    }
    /**
     * Get current system health
     */
    async getSystemHealth() {
        const agents = this.agentPool.getAllAgents();
        const poolStats = this.agentPool.getStatistics();
        const queueStats = await this.taskQueue.getStatistics();
        const metrics = this.metricsCollector.getCurrentMetrics(agents, await this.taskQueue.getQueueDepth());
        const totalQueued = queueStats.reduce((sum, stat) => sum + stat.waiting, 0);
        const totalActive = queueStats.reduce((sum, stat) => sum + stat.active, 0);
        // Determine health status
        let status = 'healthy';
        if (poolStats.offlineAgents > poolStats.totalAgents * 0.5) {
            status = 'critical'; // More than 50% agents offline
        }
        else if (metrics.successRate < 0.7) {
            status = 'degraded'; // Success rate below 70%
        }
        else if (totalQueued > 1000) {
            status = 'degraded'; // Large backlog
        }
        else if (poolStats.offlineAgents > 0) {
            status = 'degraded'; // Some agents offline
        }
        const alerts = Array.from(this.alerts.keys());
        return {
            status,
            coordinator: this.isMonitoring ? 'running' : 'stopped',
            agentPool: {
                total: poolStats.totalAgents,
                healthy: poolStats.idleAgents + poolStats.busyAgents,
                unhealthy: poolStats.offlineAgents,
            },
            taskQueue: {
                depth: totalQueued,
                processing: totalActive,
                backlog: totalQueued > 100 ? totalQueued - 100 : 0,
            },
            performance: {
                successRate: metrics.successRate,
                throughput: metrics.tasksPerSecond,
                averageLatency: metrics.averageExecutionTime,
            },
            alerts,
            timestamp: new Date(),
        };
    }
    /**
     * Raise an alert
     */
    raiseAlert(message, severity = 'warning') {
        this.alerts.set(message, new Date());
        this.logActivity({
            type: 'system',
            action: 'alert',
            timestamp: new Date(),
            data: { message, severity },
            severity,
        });
        this.emit('alert:raised', { message, severity });
    }
    /**
     * Clear an alert
     */
    clearAlert(message) {
        this.alerts.delete(message);
        this.emit('alert:cleared', message);
    }
    /**
     * Clear all alerts
     */
    clearAllAlerts() {
        this.alerts.clear();
        this.emit('alerts:cleared');
    }
    /**
     * Get recent activity
     */
    getRecentActivity(count = 50) {
        return this.activityLog.slice(-count);
    }
    /**
     * Get activity by type
     */
    getActivityByType(type, count = 50) {
        return this.activityLog.filter((event) => event.type === type).slice(-count);
    }
    /**
     * Get activity by severity
     */
    getActivityBySeverity(severity, count = 50) {
        return this.activityLog.filter((event) => event.severity === severity).slice(-count);
    }
    /**
     * Get activity in time range
     */
    getActivityInRange(startDate, endDate) {
        return this.activityLog.filter((event) => event.timestamp >= startDate && event.timestamp <= endDate);
    }
    /**
     * Get all alerts
     */
    getActiveAlerts() {
        return Array.from(this.alerts.entries()).map(([message, timestamp]) => ({
            message,
            timestamp,
        }));
    }
    /**
     * Get dashboard data
     */
    async getDashboardData() {
        const health = await this.getSystemHealth();
        const recentActivity = this.getRecentActivity(20);
        const agents = this.agentPool.getAllAgents();
        const queueDepth = await this.taskQueue.getQueueDepth();
        const metrics = this.metricsCollector.getCurrentMetrics(agents, queueDepth);
        const alerts = this.getActiveAlerts();
        return {
            health,
            recentActivity,
            metrics,
            alerts,
        };
    }
    /**
     * Export activity log
     */
    exportActivityLog() {
        return [...this.activityLog];
    }
    /**
     * Clear activity log
     */
    clearActivityLog() {
        this.activityLog = [];
        this.emit('activity:log:cleared');
    }
}
exports.ActivityMonitor = ActivityMonitor;
//# sourceMappingURL=ActivityMonitor.js.map