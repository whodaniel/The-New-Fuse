/**
 * Service Mesh Monitor
 *
 * Provides comprehensive monitoring capabilities for MCP services in a service mesh,
 * including health monitoring, metrics collection, and performance tracking.
 */
import { EventEmitter } from 'events';
/**
 * Service Mesh Monitor implementation
 */
export class ServiceMeshMonitor extends EventEmitter {
    provider;
    config;
    monitoredServices = new Map();
    healthCheckInterval;
    metricsCollectionInterval;
    isRunning = false;
    statistics;
    constructor(provider, config) {
        super();
        this.provider = provider;
        this.config = config;
        this.statistics = this.initializeStatistics();
    }
    /**
     * Initialize monitoring statistics
     */
    initializeStatistics() {
        return {
            totalServices: 0,
            healthyServices: 0,
            unhealthyServices: 0,
            servicesInAlert: 0,
            totalHealthChecks: 0,
            failedHealthChecks: 0,
            averageResponseTime: 0,
            totalMetricsCollected: 0,
            monitoringUptime: 0,
            lastUpdate: new Date()
        };
    }
    /**
     * Start monitoring services
     */
    async startMonitoring() {
        try {
            if (this.isRunning) {
                return {
                    success: false,
                    message: 'Monitoring is already running'
                };
            }
            // Start health check monitoring
            this.healthCheckInterval = setInterval(() => this.performHealthChecks(), this.config.healthCheckInterval * 1000);
            // Start metrics collection
            this.metricsCollectionInterval = setInterval(() => this.collectMetrics(), this.config.metricsInterval * 1000);
            this.isRunning = true;
            this.emit('monitoring-started');
            return {
                success: true,
                message: 'Service mesh monitoring started successfully',
                metadata: {
                    healthCheckInterval: this.config.healthCheckInterval,
                    metricsInterval: this.config.metricsInterval,
                    startTime: new Date().toISOString()
                }
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to start service mesh monitoring',
                error: {
                    code: 'MONITORING_START_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    details: error
                }
            };
        }
    }
    /**
     * Stop monitoring services
     */
    async stopMonitoring() {
        try {
            if (!this.isRunning) {
                return {
                    success: false,
                    message: 'Monitoring is not running'
                };
            }
            // Clear intervals
            if (this.healthCheckInterval) {
                clearInterval(this.healthCheckInterval);
                this.healthCheckInterval = undefined;
            }
            if (this.metricsCollectionInterval) {
                clearInterval(this.metricsCollectionInterval);
                this.metricsCollectionInterval = undefined;
            }
            this.isRunning = false;
            this.emit('monitoring-stopped');
            return {
                success: true,
                message: 'Service mesh monitoring stopped successfully',
                metadata: {
                    stopTime: new Date().toISOString(),
                    totalUptime: Date.now() - this.statistics.lastUpdate.getTime()
                }
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to stop service mesh monitoring',
                error: {
                    code: 'MONITORING_STOP_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    details: error
                }
            };
        }
    }
    /**
     * Add service to monitoring
     */
    async addService(serviceId) {
        try {
            if (this.monitoredServices.has(serviceId)) {
                return {
                    success: false,
                    message: `Service ${serviceId} is already being monitored`
                };
            }
            // Get initial health and metrics
            const health = await this.provider.getServiceHealth(serviceId);
            const metrics = await this.provider.getServiceMetrics(serviceId);
            // Create monitoring data
            const monitoringData = {
                serviceId,
                health,
                metrics,
                metricsHistory: [metrics],
                consecutiveFailures: 0,
                lastSuccessfulCheck: new Date(),
                monitoringStarted: new Date(),
                alertStatus: {
                    inAlert: false,
                    activeAlerts: []
                }
            };
            this.monitoredServices.set(serviceId, monitoringData);
            this.updateStatistics();
            this.emit('service-added', serviceId);
            return {
                success: true,
                message: `Service ${serviceId} added to monitoring`,
                metadata: {
                    serviceId,
                    initialHealth: health.status,
                    initialHealthScore: health.score
                }
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to add service ${serviceId} to monitoring`,
                error: {
                    code: 'SERVICE_ADD_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    details: error
                }
            };
        }
    }
    /**
     * Remove service from monitoring
     */
    async removeService(serviceId) {
        try {
            if (!this.monitoredServices.has(serviceId)) {
                return {
                    success: false,
                    message: `Service ${serviceId} is not being monitored`
                };
            }
            this.monitoredServices.delete(serviceId);
            this.updateStatistics();
            this.emit('service-removed', serviceId);
            return {
                success: true,
                message: `Service ${serviceId} removed from monitoring`,
                metadata: {
                    serviceId,
                    removedAt: new Date().toISOString()
                }
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to remove service ${serviceId} from monitoring`,
                error: {
                    code: 'SERVICE_REMOVE_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    details: error
                }
            };
        }
    }
    /**
     * Get service monitoring data
     */
    getServiceMonitoringData(serviceId) {
        return this.monitoredServices.get(serviceId);
    }
    /**
     * Get all monitored services
     */
    getMonitoredServices() {
        return Array.from(this.monitoredServices.keys());
    }
    /**
     * Get monitoring statistics
     */
    getStatistics() {
        this.updateStatistics();
        return { ...this.statistics };
    }
    /**
     * Get services by health status
     */
    getServicesByHealthStatus(status) {
        return Array.from(this.monitoredServices.entries())
            .filter(([_, data]) => data.health.status === status)
            .map(([serviceId]) => serviceId);
    }
    /**
     * Get services in alert state
     */
    getServicesInAlert() {
        return Array.from(this.monitoredServices.entries())
            .filter(([_, data]) => data.alertStatus.inAlert)
            .map(([serviceId, data]) => ({
            serviceId,
            alerts: data.alertStatus.activeAlerts
        }));
    }
    /**
     * Perform health checks for all monitored services
     */
    async performHealthChecks() {
        const healthCheckPromises = Array.from(this.monitoredServices.keys()).map(serviceId => this.performHealthCheck(serviceId));
        await Promise.allSettled(healthCheckPromises);
        this.updateStatistics();
    }
    /**
     * Perform health check for a specific service
     */
    async performHealthCheck(serviceId) {
        try {
            const monitoringData = this.monitoredServices.get(serviceId);
            if (!monitoringData)
                return;
            this.statistics.totalHealthChecks++;
            const health = await this.provider.getServiceHealth(serviceId);
            // Update monitoring data
            monitoringData.health = health;
            if (health.status === 'online') {
                monitoringData.consecutiveFailures = 0;
                monitoringData.lastSuccessfulCheck = new Date();
            }
            else {
                monitoringData.consecutiveFailures++;
                this.statistics.failedHealthChecks++;
            }
            // Check for alerts
            await this.checkHealthAlerts(serviceId, monitoringData);
            this.emit('health-check-completed', serviceId, health);
        }
        catch (error) {
            const monitoringData = this.monitoredServices.get(serviceId);
            if (monitoringData) {
                monitoringData.consecutiveFailures++;
                this.statistics.failedHealthChecks++;
            }
            this.emit('health-check-failed', serviceId, error);
        }
    }
    /**
     * Collect metrics for all monitored services
     */
    async collectMetrics() {
        const metricsPromises = Array.from(this.monitoredServices.keys()).map(serviceId => this.collectServiceMetrics(serviceId));
        await Promise.allSettled(metricsPromises);
        this.updateStatistics();
    }
    /**
     * Collect metrics for a specific service
     */
    async collectServiceMetrics(serviceId) {
        try {
            const monitoringData = this.monitoredServices.get(serviceId);
            if (!monitoringData)
                return;
            const metrics = await this.provider.getServiceMetrics(serviceId);
            // Update monitoring data
            monitoringData.metrics = metrics;
            monitoringData.metricsHistory.push(metrics);
            // Trim history to retention period
            const retentionCutoff = Date.now() - (this.config.metricsRetention * 1000);
            monitoringData.metricsHistory = monitoringData.metricsHistory.filter(m => m.timestamp.getTime() > retentionCutoff);
            this.statistics.totalMetricsCollected++;
            // Check for performance alerts
            await this.checkPerformanceAlerts(serviceId, monitoringData);
            this.emit('metrics-collected', serviceId, metrics);
        }
        catch (error) {
            this.emit('metrics-collection-failed', serviceId, error);
        }
    }
    /**
     * Check for health-related alerts
     */
    async checkHealthAlerts(serviceId, monitoringData) {
        const alerts = [];
        // Check consecutive failures
        if (monitoringData.consecutiveFailures >= this.config.maxConsecutiveFailures) {
            alerts.push({
                id: `health-${serviceId}-${Date.now()}`,
                type: 'health',
                severity: 'critical',
                message: `Service ${serviceId} has failed ${monitoringData.consecutiveFailures} consecutive health checks`,
                details: {
                    consecutiveFailures: monitoringData.consecutiveFailures,
                    lastSuccessfulCheck: monitoringData.lastSuccessfulCheck,
                    currentStatus: monitoringData.health.status
                },
                timestamp: new Date()
            });
        }
        // Check health score
        if (monitoringData.health.score < this.config.alertThresholds.healthScoreThreshold) {
            alerts.push({
                id: `health-score-${serviceId}-${Date.now()}`,
                type: 'health',
                severity: 'high',
                message: `Service ${serviceId} health score is below threshold`,
                details: {
                    currentScore: monitoringData.health.score,
                    threshold: this.config.alertThresholds.healthScoreThreshold
                },
                timestamp: new Date(),
                triggerMetric: {
                    name: 'health_score',
                    value: monitoringData.health.score,
                    threshold: this.config.alertThresholds.healthScoreThreshold
                }
            });
        }
        if (alerts.length > 0) {
            this.processAlerts(serviceId, alerts);
        }
    }
    /**
     * Check for performance-related alerts
     */
    async checkPerformanceAlerts(serviceId, monitoringData) {
        if (!this.config.enablePerformanceMonitoring)
            return;
        const alerts = [];
        const metrics = monitoringData.metrics;
        // Check CPU utilization
        if (metrics.resources.cpu > this.config.alertThresholds.cpuThreshold) {
            alerts.push({
                id: `cpu-${serviceId}-${Date.now()}`,
                type: 'resource',
                severity: 'medium',
                message: `Service ${serviceId} CPU utilization is above threshold`,
                details: {
                    currentCPU: metrics.resources.cpu,
                    threshold: this.config.alertThresholds.cpuThreshold
                },
                timestamp: new Date(),
                triggerMetric: {
                    name: 'cpu_utilization',
                    value: metrics.resources.cpu,
                    threshold: this.config.alertThresholds.cpuThreshold
                }
            });
        }
        // Check memory utilization
        if (metrics.resources.memory > this.config.alertThresholds.memoryThreshold) {
            alerts.push({
                id: `memory-${serviceId}-${Date.now()}`,
                type: 'resource',
                severity: 'medium',
                message: `Service ${serviceId} memory utilization is above threshold`,
                details: {
                    currentMemory: metrics.resources.memory,
                    threshold: this.config.alertThresholds.memoryThreshold
                },
                timestamp: new Date(),
                triggerMetric: {
                    name: 'memory_utilization',
                    value: metrics.resources.memory,
                    threshold: this.config.alertThresholds.memoryThreshold
                }
            });
        }
        // Check error rate
        const errorRate = metrics.requests.failed / metrics.requests.total;
        if (errorRate > this.config.alertThresholds.errorRateThreshold) {
            alerts.push({
                id: `error-rate-${serviceId}-${Date.now()}`,
                type: 'performance',
                severity: 'high',
                message: `Service ${serviceId} error rate is above threshold`,
                details: {
                    currentErrorRate: errorRate,
                    threshold: this.config.alertThresholds.errorRateThreshold,
                    totalRequests: metrics.requests.total,
                    failedRequests: metrics.requests.failed
                },
                timestamp: new Date(),
                triggerMetric: {
                    name: 'error_rate',
                    value: errorRate,
                    threshold: this.config.alertThresholds.errorRateThreshold
                }
            });
        }
        // Check response time
        if (metrics.responseTime.average > this.config.alertThresholds.responseTimeThreshold) {
            alerts.push({
                id: `response-time-${serviceId}-${Date.now()}`,
                type: 'performance',
                severity: 'medium',
                message: `Service ${serviceId} response time is above threshold`,
                details: {
                    currentResponseTime: metrics.responseTime.average,
                    threshold: this.config.alertThresholds.responseTimeThreshold
                },
                timestamp: new Date(),
                triggerMetric: {
                    name: 'response_time',
                    value: metrics.responseTime.average,
                    threshold: this.config.alertThresholds.responseTimeThreshold
                }
            });
        }
        if (alerts.length > 0) {
            this.processAlerts(serviceId, alerts);
        }
    }
    /**
     * Process alerts for a service
     */
    processAlerts(serviceId, alerts) {
        const monitoringData = this.monitoredServices.get(serviceId);
        if (!monitoringData)
            return;
        // Update alert status
        monitoringData.alertStatus.inAlert = true;
        monitoringData.alertStatus.activeAlerts.push(...alerts);
        monitoringData.alertStatus.lastAlertTime = new Date();
        // Emit alert events
        alerts.forEach(alert => {
            this.emit('alert', serviceId, alert);
        });
        this.emit('service-alert-status-changed', serviceId, monitoringData.alertStatus);
    }
    /**
     * Update monitoring statistics
     */
    updateStatistics() {
        this.statistics.totalServices = this.monitoredServices.size;
        this.statistics.healthyServices = this.getServicesByHealthStatus('online').length;
        this.statistics.unhealthyServices = this.getServicesByHealthStatus('offline').length +
            this.getServicesByHealthStatus('degraded').length;
        this.statistics.servicesInAlert = this.getServicesInAlert().length;
        // Calculate average response time
        const responseTimes = Array.from(this.monitoredServices.values())
            .map(data => data.metrics.responseTime.average)
            .filter(time => time > 0);
        this.statistics.averageResponseTime = responseTimes.length > 0
            ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
            : 0;
        this.statistics.monitoringUptime = Date.now() - this.statistics.lastUpdate.getTime();
        this.statistics.lastUpdate = new Date();
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        await this.stopMonitoring();
        this.monitoredServices.clear();
        this.removeAllListeners();
    }
}
//# sourceMappingURL=ServiceMeshMonitor.js.map