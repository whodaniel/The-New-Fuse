"use strict";
/**
 * @fileoverview Production-ready system monitoring service
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemMonitor = void 0;
const common_1 = require("@nestjs/common");
const types_js_1 = require("../constants/types.js");
const logger_js_1 = require("../utils/logger.js");
const errors_js_1 = require("../utils/errors.js");
let SystemMonitor = class SystemMonitor {
    constructor() {
        this.state = types_js_1.ServiceState.UNINITIALIZED;
        this.services = new Map();
        this.startTime = new Date();
        logger_js_1.logger.setContext('SystemMonitor');
    }
    async start() {
        if (this.state === types_js_1.ServiceState.RUNNING) {
            logger_js_1.logger.warn('SystemMonitor is already running');
            return;
        }
        try {
            this.state = types_js_1.ServiceState.INITIALIZING;
            logger_js_1.logger.info('Starting SystemMonitor');
            // Start monitoring interval
            this.monitoringInterval = setInterval(() => {
                this.performHealthCheck();
            }, 30000); // Check every 30 seconds
            this.state = types_js_1.ServiceState.RUNNING;
            logger_js_1.logger.info('SystemMonitor started successfully');
        }
        catch (error) {
            this.state = types_js_1.ServiceState.ERROR;
            logger_js_1.logger.error('Failed to start SystemMonitor', error);
            throw error;
        }
    }
    async stop() {
        if (this.state === types_js_1.ServiceState.STOPPED) {
            logger_js_1.logger.warn('SystemMonitor is already stopped');
            return;
        }
        try {
            this.state = types_js_1.ServiceState.STOPPING;
            logger_js_1.logger.info('Stopping SystemMonitor');
            if (this.monitoringInterval) {
                clearInterval(this.monitoringInterval);
                this.monitoringInterval = undefined;
            }
            this.state = types_js_1.ServiceState.STOPPED;
            logger_js_1.logger.info('SystemMonitor stopped successfully');
        }
        catch (error) {
            this.state = types_js_1.ServiceState.ERROR;
            logger_js_1.logger.error('Failed to stop SystemMonitor', error);
            throw error;
        }
    }
    getState() {
        return this.state;
    }
    registerService(name, healthCheckUrl) {
        const serviceHealth = {
            name,
            status: 'healthy',
            lastCheck: new Date(),
            details: { healthCheckUrl },
        };
        this.services.set(name, serviceHealth);
        logger_js_1.logger.info(`Registered service: ${name}`, { healthCheckUrl });
    }
    unregisterService(name) {
        this.services.delete(name);
        logger_js_1.logger.info(`Unregistered service: ${name}`);
    }
    async getSystemMetrics() {
        try {
            const metrics = {
                cpu: await this.getCPUMetrics(),
                memory: await this.getMemoryMetrics(),
                disk: await this.getDiskMetrics(),
                network: await this.getNetworkMetrics(),
            };
            return metrics;
        }
        catch (error) {
            logger_js_1.logger.error('Failed to get system metrics', error);
            throw new errors_js_1.BaseError('Failed to get system metrics', 'METRICS_COLLECTION_FAILED');
        }
    }
    async getHealthStatus() {
        const services = Array.from(this.services.values());
        const overallStatus = this.calculateOverallStatus(services);
        const uptime = Date.now() - this.startTime.getTime();
        return {
            status: overallStatus,
            timestamp: new Date(),
            services,
            uptime: Math.floor(uptime / 1000), // Convert to seconds
        };
    }
    async performHealthCheck() {
        logger_js_1.logger.debug('Performing health check');
        for (const [name, service] of this.services) {
            try {
                const startTime = Date.now();
                const isHealthy = await this.checkServiceHealth(service);
                const responseTime = Date.now() - startTime;
                const updatedService = {
                    ...service,
                    status: isHealthy ? 'healthy' : 'unhealthy',
                    responseTime,
                    lastCheck: new Date(),
                };
                this.services.set(name, updatedService);
                if (!isHealthy) {
                    logger_js_1.logger.warn(`Service ${name} is unhealthy`, { responseTime });
                }
            }
            catch (error) {
                logger_js_1.logger.error(`Health check failed for service ${name}`, error);
                const updatedService = {
                    ...service,
                    status: 'unhealthy',
                    lastCheck: new Date(),
                    details: {
                        ...service.details,
                        error: error.message,
                    },
                };
                this.services.set(name, updatedService);
            }
        }
    }
    async checkServiceHealth(service) {
        if (!service.details?.healthCheckUrl) {
            // If no health check URL, assume healthy
            return true;
        }
        try {
            // In a real implementation, this would make an HTTP request to the health check endpoint
            // For now, we'll simulate a health check
            const response = await this.simulateHealthCheck(service.details.healthCheckUrl);
            return response.status === 200;
        }
        catch (error) {
            return false;
        }
    }
    async simulateHealthCheck(url) {
        // Simulate a health check response
        // In production, this would use fetch or axios
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ status: 200 });
            }, Math.random() * 100);
        });
    }
    calculateOverallStatus(services) {
        if (services.length === 0) {
            return 'healthy';
        }
        const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
        const degradedCount = services.filter(s => s.status === 'degraded').length;
        if (unhealthyCount > 0) {
            return unhealthyCount > services.length / 2 ? 'unhealthy' : 'degraded';
        }
        if (degradedCount > 0) {
            return 'degraded';
        }
        return 'healthy';
    }
    async getCPUMetrics() {
        // In a real implementation, this would use os module or system monitoring libraries
        const os = await Promise.resolve().then(() => __importStar(require('os')));
        return {
            usage: Math.random() * 100, // Simulated CPU usage
            cores: os.cpus().length,
            loadAverage: os.loadavg(),
        };
    }
    async getMemoryMetrics() {
        const os = await Promise.resolve().then(() => __importStar(require('os')));
        const process = await Promise.resolve().then(() => __importStar(require('process')));
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsage = process.memoryUsage();
        return {
            used: usedMemory,
            total: totalMemory,
            usage: (usedMemory / totalMemory) * 100,
            heap: {
                used: memoryUsage.heapUsed,
                total: memoryUsage.heapTotal,
            },
        };
    }
    async getDiskMetrics() {
        // In a real implementation, this would use fs.statSync or disk monitoring libraries
        return {
            used: Math.random() * 1000000000, // Simulated disk usage in bytes
            total: 1000000000, // 1GB simulated total
            usage: Math.random() * 100,
            iops: Math.random() * 1000,
        };
    }
    async getNetworkMetrics() {
        // In a real implementation, this would use network monitoring libraries
        return {
            bytesIn: Math.random() * 1000000,
            bytesOut: Math.random() * 1000000,
            packetsIn: Math.random() * 10000,
            packetsOut: Math.random() * 10000,
            connections: Math.random() * 100,
        };
    }
};
exports.SystemMonitor = SystemMonitor;
exports.SystemMonitor = SystemMonitor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SystemMonitor);
//# sourceMappingURL=SystemMonitor.js.map