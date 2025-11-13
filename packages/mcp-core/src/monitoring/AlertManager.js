/**
 * Alert Management System
 */
import { EventEmitter } from 'events';
import { AlertSeverity, AlertStatus } from '../types/monitoring';
import { Logger } from '../utils/Logger';
/**
 * Alert manager implementation
 */
export class AlertManager extends EventEmitter {
    config;
    logger;
    alertRules = new Map();
    alerts = new Map();
    alertHistory = [];
    checkTimer;
    running = false;
    constructor(config, logger) {
        super();
        this.config = config;
        this.logger = logger || new Logger('AlertManager');
        this.initializeDefaultRules();
    }
    /**
     * Start alert checking
     */
    start() {
        if (this.running) {
            this.logger.warn('Alert manager is already running');
            return;
        }
        this.logger.info('Starting alert manager', {
            checkInterval: this.config.checkInterval
        });
        this.running = true;
        this.checkTimer = setInterval(() => {
            this.checkAlerts();
        }, this.config.checkInterval);
        this.logger.info('Alert manager started');
    }
    /**
     * Stop alert checking
     */
    stop() {
        if (!this.running) {
            this.logger.warn('Alert manager is not running');
            return;
        }
        this.logger.info('Stopping alert manager');
        this.running = false;
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
            this.checkTimer = undefined;
        }
        this.logger.info('Alert manager stopped');
    }
    /**
     * Register an alert rule
     */
    registerAlertRule(rule) {
        this.alertRules.set(rule.name, rule);
        this.logger.debug(`Registered alert rule: ${rule.name}`, {
            severity: rule.severity,
            enabled: rule.enabled
        });
    }
    /**
     * Remove an alert rule
     */
    removeAlertRule(name) {
        const removed = this.alertRules.delete(name);
        if (removed) {
            this.logger.debug(`Removed alert rule: ${name}`);
        }
        return removed;
    }
    /**
     * Get all alert rules
     */
    getAlertRules() {
        return Array.from(this.alertRules.values());
    }
    /**
     * Get active alerts
     */
    getActiveAlerts() {
        return Array.from(this.alerts.values()).filter(alert => alert.status === AlertStatus.ACTIVE);
    }
    /**
     * Get alert history
     */
    getAlertHistory(hours) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.alertHistory.filter(alert => alert.timestamp >= cutoff);
    }
    /**
     * Acknowledge an alert
     */
    async acknowledgeAlert(alertId, user) {
        const alert = this.alerts.get(alertId);
        if (!alert) {
            throw new Error(`Alert not found: ${alertId}`);
        }
        alert.status = AlertStatus.ACKNOWLEDGED;
        alert.acknowledgedAt = new Date();
        alert.acknowledgedBy = user;
        this.logger.info(`Alert acknowledged: ${alert.name}`, {
            alertId,
            user,
            severity: alert.severity
        });
        this.emit('alertAcknowledged', alert);
    }
    /**
     * Resolve an alert
     */
    async resolveAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (!alert) {
            throw new Error(`Alert not found: ${alertId}`);
        }
        alert.status = AlertStatus.RESOLVED;
        alert.resolvedAt = new Date();
        // Move to history
        this.alertHistory.push(alert);
        this.alerts.delete(alertId);
        this.logger.info(`Alert resolved: ${alert.name}`, {
            alertId,
            severity: alert.severity,
            duration: alert.resolvedAt.getTime() - alert.timestamp.getTime()
        });
        this.emit('alertResolved', alert);
    }
    /**
     * Suppress an alert
     */
    async suppressAlert(alertId, duration) {
        const alert = this.alerts.get(alertId);
        if (!alert) {
            throw new Error(`Alert not found: ${alertId}`);
        }
        alert.status = AlertStatus.SUPPRESSED;
        // Auto-resolve after suppression duration
        setTimeout(() => {
            if (this.alerts.has(alertId)) {
                this.resolveAlert(alertId);
            }
        }, duration);
        this.logger.info(`Alert suppressed: ${alert.name}`, {
            alertId,
            duration,
            severity: alert.severity
        });
        this.emit('alertSuppressed', alert);
    }
    /**
     * Trigger an alert
     */
    triggerAlert(ruleName, description, severity, data) {
        const alertId = `${ruleName}_${Date.now()}`;
        const alert = {
            id: alertId,
            name: ruleName,
            description,
            severity,
            status: AlertStatus.ACTIVE,
            category: 'system',
            source: 'AlertManager',
            timestamp: new Date(),
            data
        };
        this.alerts.set(alertId, alert);
        this.logger.warn(`Alert triggered: ${ruleName}`, {
            alertId,
            severity,
            description
        });
        this.emit('alertTriggered', alert);
        return alert;
    }
    /**
     * Check all alert rules
     */
    async checkAlerts() {
        if (!this.running)
            return;
        try {
            // Get current metrics and statistics (would be injected in real implementation)
            const metrics = this.getCurrentMetrics();
            const statistics = this.getErrorStatistics();
            for (const [name, rule] of this.alertRules) {
                if (!rule.enabled)
                    continue;
                try {
                    // Check cooldown
                    if (rule.lastTriggered &&
                        (Date.now() - rule.lastTriggered.getTime()) < rule.cooldown) {
                        continue;
                    }
                    // Check condition
                    if (rule.condition(metrics, statistics)) {
                        rule.lastTriggered = new Date();
                        const alert = this.triggerAlert(rule.name, rule.description, rule.severity, { metrics, statistics });
                        // Execute alert action
                        await rule.action(alert);
                    }
                }
                catch (error) {
                    this.logger.error(`Error checking alert rule ${name}:`, error);
                }
            }
            // Clean up old alerts
            this.cleanupAlerts();
        }
        catch (error) {
            this.logger.error('Error during alert check:', error);
        }
    }
    /**
     * Clean up old alerts
     */
    cleanupAlerts() {
        const cutoff = new Date(Date.now() - this.config.retentionPeriod);
        const initialLength = this.alertHistory.length;
        this.alertHistory.splice(0, this.alertHistory.findIndex(alert => alert.timestamp >= cutoff));
        if (this.alertHistory.length < initialLength) {
            this.logger.debug(`Cleaned up ${initialLength - this.alertHistory.length} old alerts`);
        }
    }
    /**
     * Initialize default alert rules
     */
    initializeDefaultRules() {
        // High error rate alert
        this.registerAlertRule({
            name: 'high-error-rate',
            description: 'Error rate exceeds 10%',
            severity: AlertSeverity.HIGH,
            cooldown: 5 * 60 * 1000, // 5 minutes
            enabled: true,
            condition: (metrics) => {
                const errorRate = metrics.requests.total > 0 ?
                    metrics.requests.failed / metrics.requests.total : 0;
                return errorRate > 0.1;
            },
            action: async (alert) => {
                this.logger.error(`HIGH ERROR RATE: ${alert.description}`, alert.data);
            }
        });
        // High response time alert
        this.registerAlertRule({
            name: 'high-response-time',
            description: 'Average response time exceeds 1000ms',
            severity: AlertSeverity.MEDIUM,
            cooldown: 10 * 60 * 1000, // 10 minutes
            enabled: true,
            condition: (metrics) => metrics.requests.avgResponseTime > 1000,
            action: async (alert) => {
                this.logger.warn(`HIGH RESPONSE TIME: ${alert.description}`, alert.data);
            }
        });
        // High memory usage alert
        this.registerAlertRule({
            name: 'high-memory-usage',
            description: 'Memory usage exceeds 80%',
            severity: AlertSeverity.MEDIUM,
            cooldown: 15 * 60 * 1000, // 15 minutes
            enabled: true,
            condition: (metrics) => {
                const memoryUsageGB = metrics.system.memoryUsage / (1024 * 1024 * 1024);
                return memoryUsageGB > 0.8; // Assuming 1GB limit
            },
            action: async (alert) => {
                this.logger.warn(`HIGH MEMORY USAGE: ${alert.description}`, alert.data);
            }
        });
        // Low health score alert
        this.registerAlertRule({
            name: 'low-health-score',
            description: 'System health score below 70',
            severity: AlertSeverity.MEDIUM,
            cooldown: 10 * 60 * 1000, // 10 minutes
            enabled: true,
            condition: (metrics) => metrics.system.healthScore < 70,
            action: async (alert) => {
                this.logger.warn(`LOW HEALTH SCORE: ${alert.description}`, alert.data);
            }
        });
        // No active connections alert
        this.registerAlertRule({
            name: 'no-active-connections',
            description: 'No active connections for extended period',
            severity: AlertSeverity.LOW,
            cooldown: 30 * 60 * 1000, // 30 minutes
            enabled: true,
            condition: (metrics) => metrics.connections.active === 0 && metrics.system.uptime > 60000,
            action: async (alert) => {
                this.logger.info(`NO ACTIVE CONNECTIONS: ${alert.description}`, alert.data);
            }
        });
        // Critical system alert
        this.registerAlertRule({
            name: 'system-critical',
            description: 'Critical system condition detected',
            severity: AlertSeverity.CRITICAL,
            cooldown: 2 * 60 * 1000, // 2 minutes
            enabled: true,
            condition: (metrics, statistics) => {
                return metrics.system.healthScore < 30 ||
                    (statistics.errorRate > 50 && metrics.requests.total > 100);
            },
            action: async (alert) => {
                this.logger.error(`CRITICAL SYSTEM ALERT: ${alert.description}`, alert.data);
                // In a real implementation, this might send notifications, page on-call, etc.
            }
        });
        this.logger.info(`Initialized ${this.alertRules.size} default alert rules`);
    }
    /**
     * Get current metrics (placeholder - would be injected from metrics collector)
     */
    getCurrentMetrics() {
        // This would be injected from the metrics collector in a real implementation
        return {
            requests: {
                total: 0,
                successful: 0,
                failed: 0,
                rps: 0,
                avgResponseTime: 0,
                p95ResponseTime: 0,
                p99ResponseTime: 0
            },
            connections: {
                active: 0,
                total: 0,
                failed: 0,
                avgConnectionTime: 0
            },
            resources: {
                total: 0,
                accessCount: 0,
                cacheHitRate: 0,
                avgReadTime: 0
            },
            tools: {
                total: 0,
                executionCount: 0,
                avgExecutionTime: 0,
                successRate: 0
            },
            system: {
                memoryUsage: process.memoryUsage().heapUsed,
                cpuUsage: 0,
                uptime: Date.now(),
                healthScore: 100
            }
        };
    }
    /**
     * Get error statistics (placeholder - would be injected from error monitor)
     */
    getErrorStatistics() {
        // This would be injected from the error monitor in a real implementation
        return {
            totalErrors: 0,
            errorsByCategory: {},
            errorsBySeverity: {},
            errorsByCode: {},
            errorRate: 0
        };
    }
}
//# sourceMappingURL=AlertManager.js.map