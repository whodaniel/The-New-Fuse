"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
class HealthService {
    services = new Map();
    async getHealthStatus() {
        const system = await this.getSystemHealth();
        const services = this.getAllServiceHealth();
        const overallStatus = this.calculateOverallStatus(services, system);
        return {
            status: overallStatus,
            timestamp: new Date(),
            services,
            system,
            uptime: process.uptime()
        };
    }
    async checkService(name, healthCheckFn) {
        const startTime = Date.now();
        try {
            const isHealthy = await healthCheckFn();
            const responseTime = Date.now() - startTime;
            const health = {
                status: isHealthy ? 'up' : 'down',
                responseTime,
                lastCheck: new Date()
            };
            this.services.set(name, health);
            return health;
        }
        catch (error) {
            const health = {
                status: 'down',
                responseTime: Date.now() - startTime,
                lastCheck: new Date(),
                error: error.message
            };
            this.services.set(name, health);
            return health;
        }
    }
    getAllServiceHealth() {
        const result = {};
        this.services.forEach((health, name) => {
            result[name] = health;
        });
        return result;
    }
    async getSystemHealth() {
        const memUsage = process.memoryUsage();
        return {
            memory: {
                used: memUsage.heapUsed,
                total: memUsage.heapTotal,
                percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
            },
            cpu: {
                usage: 0 // Mock value - in real implementation would calculate CPU usage
            },
            disk: {
                used: 0, // Mock value
                total: 0, // Mock value
                percentage: 0 // Mock value
            }
        };
    }
    calculateOverallStatus(services, system) {
        const serviceStatuses = Object.values(services);
        // If any critical service is down, overall status is unhealthy
        const downServices = serviceStatuses.filter(s => s.status === 'down');
        if (downServices.length > 0) {
            return 'unhealthy';
        }
        // If any service is degraded or system metrics are concerning, status is degraded
        const degradedServices = serviceStatuses.filter(s => s.status === 'degraded');
        if (degradedServices.length > 0 || system.memory.percentage > 90) {
            return 'degraded';
        }
        return 'healthy';
    }
}
exports.HealthService = HealthService;
//# sourceMappingURL=healthService.js.map