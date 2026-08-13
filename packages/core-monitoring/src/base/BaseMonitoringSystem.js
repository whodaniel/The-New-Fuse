"use strict";
/**
 * Base monitoring system implementation
 * Provides common functionality that can be extended by specific monitoring systems
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseMonitoringSystem = void 0;
const events_1 = require("events");
const Logger_js_1 = require("../utils/Logger.js");
/**
 * Base monitoring system that can be extended
 */
class BaseMonitoringSystem extends events_1.EventEmitter {
    logger;
    config;
    running = false;
    startTime;
    // Component instances
    metricsCollector;
    alertManager;
    performanceMonitor;
    dashboardManager;
    systemHealthMonitor;
    constructor(logger) {
        super();
        this.logger = logger || new Logger_js_1.Logger('BaseMonitoringSystem');
    }
    /**
     * Initialize monitoring system
     */
    async initialize(config) {
        try {
            this.config = config;
            this.logger.info('Initializing monitoring system', { config });
            if (!config.enabled) {
                this.logger.info('Monitoring is disabled');
                return;
            }
            // Initialize components
            await this.initializeComponents();
            // Start components
            await this.startComponents();
            this.running = true;
            this.startTime = new Date();
            this.logger.info('Monitoring system initialized successfully');
            this.emit('initialized');
        }
        catch (error) {
            this.logger.error('Failed to initialize monitoring system:', error);
            throw error;
        }
    }
    /**
     * Shutdown monitoring system
     */
    async shutdown() {
        try {
            this.logger.info('Shutting down monitoring system');
            if (!this.running) {
                this.logger.warn('Monitoring system is not running');
                return;
            }
            // Stop components
            await this.stopComponents();
            this.running = false;
            this.startTime = undefined;
            this.logger.info('Monitoring system shutdown complete');
            this.emit('shutdown');
        }
        catch (error) {
            this.logger.error('Error during monitoring system shutdown:', error);
            throw error;
        }
    }
    /**
     * Get metrics collector
     */
    getMetricsCollector() {
        if (!this.metricsCollector) {
            throw new Error('Monitoring system not initialized');
        }
        return this.metricsCollector;
    }
    /**
     * Export metrics in specified format
     */
    async exportMetrics(format) {
        if (!this.metricsCollector) {
            throw new Error('Monitoring system not initialized');
        }
        const metrics = this.metricsCollector.getCurrentMetrics();
        if (format === 'json') {
            return JSON.stringify(metrics, null, 2);
        }
        if (format === 'prometheus') {
            return this.formatPrometheusMetrics(metrics);
        }
        throw new Error(`Unsupported export format: ${format}`);
    }
    /**
     * Get monitoring status
     */
    async getStatus() {
        const uptime = this.startTime ? Date.now() - this.startTime.getTime() : 0;
        const components = {
            metricsCollector: !!this.metricsCollector,
            alertManager: !!this.alertManager,
            performanceMonitor: !!this.performanceMonitor,
            dashboardManager: !!this.dashboardManager,
            systemHealthMonitor: !!this.systemHealthMonitor
        };
        return {
            running: this.running,
            uptime,
            components
        };
    }
    /**
     * Initialize all components
     */
    async initializeComponents() {
        if (!this.config) {
            throw new Error('Configuration not set');
        }
        // Initialize metrics collector (required)
        this.metricsCollector = this.createMetricsCollector();
        // Initialize optional components
        if (this.config.enableAlerting) {
            this.alertManager = this.createAlertManager();
        }
        if (this.config.enableDashboards) {
            this.dashboardManager = this.createDashboardManager();
        }
        // Initialize performance monitor
        this.performanceMonitor = this.createPerformanceMonitor();
        // Initialize system health monitor
        this.systemHealthMonitor = this.createSystemHealthMonitor();
        this.logger.debug('All monitoring components initialized');
    }
    /**
     * Start all components
     */
    async startComponents() {
        const startPromises = [];
        if (this.metricsCollector) {
            startPromises.push(this.metricsCollector.start());
        }
        if (this.performanceMonitor) {
            startPromises.push(this.performanceMonitor.start());
        }
        await Promise.all(startPromises);
        // Set up component event forwarding
        this.setupEventForwarding();
        this.logger.debug('All monitoring components started');
    }
    /**
     * Stop all components
     */
    async stopComponents() {
        const stopPromises = [];
        if (this.metricsCollector) {
            stopPromises.push(this.metricsCollector.stop());
        }
        if (this.performanceMonitor) {
            stopPromises.push(this.performanceMonitor.stop());
        }
        await Promise.all(stopPromises);
        this.logger.debug('All monitoring components stopped');
    }
    /**
     * Set up event forwarding from components
     */
    setupEventForwarding() {
        // Forward metrics events
        if (this.metricsCollector) {
            this.metricsCollector.on('metricsCollected', (metrics) => {
                this.emit('metricsCollected', metrics);
            });
        }
        // Forward alert events
        if (this.alertManager) {
            this.alertManager.on('alertTriggered', (alert) => {
                this.emit('alertTriggered', alert);
            });
            this.alertManager.on('alertResolved', (alert) => {
                this.emit('alertResolved', alert);
            });
        }
        // Forward performance events
        if (this.performanceMonitor) {
            this.performanceMonitor.on('performanceUpdate', (metrics) => {
                this.emit('performanceUpdate', metrics);
            });
        }
        // Forward health events
        if (this.systemHealthMonitor) {
            this.systemHealthMonitor.on('healthStatusChanged', (status) => {
                this.emit('healthStatusChanged', status);
            });
        }
    }
    /**
     * Create alert manager - can be overridden by subclasses
     */
    createAlertManager() {
        // Default implementation - subclasses can override
        return undefined;
    }
    /**
     * Create dashboard manager - can be overridden by subclasses
     */
    createDashboardManager() {
        // Default implementation - subclasses can override
        return undefined;
    }
    /**
     * Create performance monitor - can be overridden by subclasses
     */
    createPerformanceMonitor() {
        // Default implementation - subclasses can override
        return undefined;
    }
    /**
     * Create system health monitor - can be overridden by subclasses
     */
    createSystemHealthMonitor() {
        // Default implementation - subclasses can override
        return undefined;
    }
}
exports.BaseMonitoringSystem = BaseMonitoringSystem;
//# sourceMappingURL=BaseMonitoringSystem.js.map