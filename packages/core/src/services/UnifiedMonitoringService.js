"use strict";
/**
 * @fileoverview Unified monitoring service that orchestrates all monitoring capabilities
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedMonitoringService = void 0;
const common_1 = require("@nestjs/common");
const SystemMonitor_js_1 = require("./SystemMonitor.js");
const MetricsCollector_js_1 = require("./MetricsCollector.js");
const PerformanceMonitor_js_1 = require("./PerformanceMonitor.js");
const monitoring_js_1 = require("../types/monitoring.js");
const types_js_1 = require("../constants/types.js");
const logger_js_1 = require("../utils/logger.js");
const errors_js_1 = require("../utils/errors.js");
let UnifiedMonitoringService = class UnifiedMonitoringService {
    constructor(systemMonitor, metricsCollector, performanceMonitor) {
        this.systemMonitor = systemMonitor;
        this.metricsCollector = metricsCollector;
        this.performanceMonitor = performanceMonitor;
        this.state = types_js_1.ServiceState.UNINITIALIZED;
        this.alerts = new Map();
        this.alertCallbacks = [];
        logger_js_1.logger.setContext('UnifiedMonitoringService');
    }
    async onModuleInit() {
        await this.start();
    }
    async onModuleDestroy() {
        await this.stop();
    }
    async start() {
        if (this.state === types_js_1.ServiceState.RUNNING) {
            logger_js_1.logger.warn('UnifiedMonitoringService is already running');
            return;
        }
        try {
            this.state = types_js_1.ServiceState.INITIALIZING;
            logger_js_1.logger.info('Starting UnifiedMonitoringService');
            // Start all monitoring services
            await this.metricsCollector.start();
            await this.systemMonitor.start();
            await this.performanceMonitor.start();
            // Register system services for health monitoring
            this.systemMonitor.registerService('MetricsCollector');
            this.systemMonitor.registerService('PerformanceMonitor');
            this.state = types_js_1.ServiceState.RUNNING;
            logger_js_1.logger.info('UnifiedMonitoringService started successfully');
        }
        catch (error) {
            this.state = types_js_1.ServiceState.ERROR;
            logger_js_1.logger.error('Failed to start UnifiedMonitoringService', error);
            throw error;
        }
    }
    async stop() {
        if (this.state === types_js_1.ServiceState.STOPPED) {
            logger_js_1.logger.warn('UnifiedMonitoringService is already stopped');
            return;
        }
        try {
            this.state = types_js_1.ServiceState.STOPPING;
            logger_js_1.logger.info('Stopping UnifiedMonitoringService');
            // Stop all monitoring services
            await this.performanceMonitor.stop();
            await this.systemMonitor.stop();
            await this.metricsCollector.stop();
            this.state = types_js_1.ServiceState.STOPPED;
            logger_js_1.logger.info('UnifiedMonitoringService stopped successfully');
        }
        catch (error) {
            this.state = types_js_1.ServiceState.ERROR;
            logger_js_1.logger.error('Failed to stop UnifiedMonitoringService', error);
            throw error;
        }
    }
    getState() {
        return this.state;
    }
    // Monitoring methods
    async monitor() {
        this.ensureRunning();
        return await this.performanceMonitor.monitor();
    }
    async getHealthStatus() {
        this.ensureRunning();
        return await this.systemMonitor.getHealthStatus();
    }
    // Metrics methods
    recordMetric(name, value, tags) {
        this.ensureRunning();
        this.metricsCollector.recordGauge(name, value, 'units', tags, 'unified-monitoring');
    }
    recordCounter(name, value = 1, tags) {
        this.ensureRunning();
        this.metricsCollector.recordCounter(name, value, tags, 'unified-monitoring');
    }
    recordTimer(name, duration, tags) {
        this.ensureRunning();
        this.metricsCollector.recordTimer(name, duration, tags, 'unified-monitoring');
    }
    // Error tracking
    captureError(error, context) {
        this.ensureRunning();
        logger_js_1.logger.error('Captured error', error, context);
        this.recordCounter('errors_total', 1, {
            error_type: error.name,
            error_message: error.message.substring(0, 100), // Truncate for tags
        });
        // Check if this error should trigger an alert
        this.checkErrorAlert(error, context);
    }
    // Service registration
    registerService(name, healthCheckUrl) {
        this.ensureRunning();
        this.systemMonitor.registerService(name, healthCheckUrl);
    }
    unregisterService(name) {
        this.ensureRunning();
        this.systemMonitor.unregisterService(name);
    }
    // Request tracking
    recordRequest(responseTime, isError = false) {
        this.ensureRunning();
        this.performanceMonitor.recordRequest(responseTime, isError);
    }
    recordConnectionChange(delta) {
        this.ensureRunning();
        this.performanceMonitor.recordConnectionChange(delta);
    }
    // Database monitoring
    recordDatabaseConnection(active, idle) {
        this.ensureRunning();
        this.performanceMonitor.recordDatabaseConnection(active, idle);
    }
    // Alert management
    createAlert(name, description, severity, condition) {
        const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const alert = {
            id: alertId,
            name,
            description,
            severity,
            status: monitoring_js_1.AlertStatus.ACTIVE,
            condition,
            actions: [],
            createdAt: new Date(),
            metadata: {},
        };
        this.alerts.set(alertId, alert);
        logger_js_1.logger.info('Created alert', { alertId, name, severity });
        return alertId;
    }
    resolveAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (!alert) {
            return false;
        }
        alert.status = monitoring_js_1.AlertStatus.RESOLVED;
        alert.resolvedAt = new Date();
        logger_js_1.logger.info('Resolved alert', { alertId, name: alert.name });
        this.notifyAlertCallbacks(alert);
        return true;
    }
    getAlerts() {
        return Array.from(this.alerts.values());
    }
    getActiveAlerts() {
        return Array.from(this.alerts.values()).filter(alert => alert.status === 'ACTIVE');
    }
    onAlert(callback) {
        this.alertCallbacks.push(callback);
    }
    // Performance tracking utilities
    async trackOperation(operationName, operation, tags) {
        this.ensureRunning();
        return await this.performanceMonitor.trackOperation(operationName, operation, tags);
    }
    trackOperationSync(operationName, operation, tags) {
        this.ensureRunning();
        return this.performanceMonitor.trackOperationSync(operationName, operation, tags);
    }
    // Metrics summary
    getMetricsSummary() {
        this.ensureRunning();
        return this.metricsCollector.getMetricsSummary();
    }
    // System status
    async getSystemStatus() {
        this.ensureRunning();
        const [health, performance, alerts, metrics] = await Promise.all([
            this.getHealthStatus(),
            this.monitor(),
            Promise.resolve(this.getActiveAlerts()),
            Promise.resolve(this.getMetricsSummary()),
        ]);
        return {
            health,
            performance,
            alerts,
            metrics,
        };
    }
    ensureRunning() {
        if (this.state !== types_js_1.ServiceState.RUNNING) {
            throw new errors_js_1.BaseError('UnifiedMonitoringService is not running', 'SERVICE_NOT_RUNNING', { state: this.state });
        }
    }
    checkErrorAlert(error, context) {
        // Simple error rate alerting
        const errorMetrics = this.metricsCollector.getMetricSeries('errors_total');
        if (!errorMetrics)
            return;
        const recentErrors = errorMetrics.dataPoints.filter(dp => dp.timestamp > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        );
        if (recentErrors.length > 10) { // More than 10 errors in 5 minutes
            const alertId = this.createAlert('High Error Rate', `High error rate detected: ${recentErrors.length} errors in the last 5 minutes`, monitoring_js_1.AlertSeverity.WARNING, {
                metric: 'errors_total',
                operator: 'greater',
                threshold: 10,
                duration: 300, // 5 minutes
            });
            const alert = this.alerts.get(alertId);
            if (alert) {
                this.notifyAlertCallbacks(alert);
            }
        }
    }
    notifyAlertCallbacks(alert) {
        this.alertCallbacks.forEach(callback => {
            try {
                callback(alert);
            }
            catch (error) {
                logger_js_1.logger.error('Error in alert callback', error, { alertId: alert.id });
            }
        });
    }
};
exports.UnifiedMonitoringService = UnifiedMonitoringService;
exports.UnifiedMonitoringService = UnifiedMonitoringService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [SystemMonitor_js_1.SystemMonitor,
        MetricsCollector_js_1.MetricsCollector,
        PerformanceMonitor_js_1.PerformanceMonitor])
], UnifiedMonitoringService);
//# sourceMappingURL=UnifiedMonitoringService.js.map