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
import { Injectable } from '@nestjs/common';
import { SystemMonitor } from './SystemMonitor';
import { MetricsCollector } from './MetricsCollector';
import { PerformanceMonitor } from './PerformanceMonitor';
import { AlertSeverity, AlertStatus } from '../types/monitoring';
import { ServiceState } from '../constants/types';
import { logger } from '../utils/logger';
import { BaseError } from '../utils/errors';
let UnifiedMonitoringService = class UnifiedMonitoringService {
    systemMonitor;
    metricsCollector;
    performanceMonitor;
    state = ServiceState.UNINITIALIZED;
    alerts = new Map();
    alertCallbacks = [];
    constructor(systemMonitor, metricsCollector, performanceMonitor) {
        this.systemMonitor = systemMonitor;
        this.metricsCollector = metricsCollector;
        this.performanceMonitor = performanceMonitor;
        logger.setContext('UnifiedMonitoringService');
    }
    async onModuleInit() {
        await this.start();
    }
    async onModuleDestroy() {
        await this.stop();
    }
    async start() {
        if (this.state === ServiceState.RUNNING) {
            logger.warn('UnifiedMonitoringService is already running');
            return;
        }
        try {
            this.state = ServiceState.INITIALIZING;
            logger.info('Starting UnifiedMonitoringService');
            // Start all monitoring services
            await this.metricsCollector.start();
            await this.systemMonitor.start();
            await this.performanceMonitor.start();
            // Register system services for health monitoring
            this.systemMonitor.registerService('MetricsCollector');
            this.systemMonitor.registerService('PerformanceMonitor');
            this.state = ServiceState.RUNNING;
            logger.info('UnifiedMonitoringService started successfully');
        }
        catch (error) {
            this.state = ServiceState.ERROR;
            logger.error('Failed to start UnifiedMonitoringService', error);
            throw error;
        }
    }
    async stop() {
        if (this.state === ServiceState.STOPPED) {
            logger.warn('UnifiedMonitoringService is already stopped');
            return;
        }
        try {
            this.state = ServiceState.STOPPING;
            logger.info('Stopping UnifiedMonitoringService');
            // Stop all monitoring services
            await this.performanceMonitor.stop();
            await this.systemMonitor.stop();
            await this.metricsCollector.stop();
            this.state = ServiceState.STOPPED;
            logger.info('UnifiedMonitoringService stopped successfully');
        }
        catch (error) {
            this.state = ServiceState.ERROR;
            logger.error('Failed to stop UnifiedMonitoringService', error);
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
        logger.error('Captured error', error, context);
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
            status: AlertStatus.ACTIVE,
            condition,
            actions: [],
            createdAt: new Date(),
            metadata: {},
        };
        this.alerts.set(alertId, alert);
        logger.info('Created alert', { alertId, name, severity });
        return alertId;
    }
    resolveAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (!alert) {
            return false;
        }
        alert.status = AlertStatus.RESOLVED;
        alert.resolvedAt = new Date();
        logger.info('Resolved alert', { alertId, name: alert.name });
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
        if (this.state !== ServiceState.RUNNING) {
            throw new BaseError('UnifiedMonitoringService is not running', 'SERVICE_NOT_RUNNING', { state: this.state });
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
            const alertId = this.createAlert('High Error Rate', `High error rate detected: ${recentErrors.length} errors in the last 5 minutes`, AlertSeverity.WARNING, {
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
                logger.error('Error in alert callback', error, { alertId: alert.id });
            }
        });
    }
};
UnifiedMonitoringService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [SystemMonitor,
        MetricsCollector,
        PerformanceMonitor])
], UnifiedMonitoringService);
export { UnifiedMonitoringService };
//# sourceMappingURL=UnifiedMonitoringService.js.map