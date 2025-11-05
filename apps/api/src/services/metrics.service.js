var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let MetricsService = class MetricsService {
    async getMetrics() {
        return {
            totalUsers: 0,
            totalAgents: 0,
            totalWorkflows: 0,
            systemHealth: 'healthy'
        };
    }
    async getSystemMetrics() {
        return {
            totalUsers: 0,
            totalAgents: 0,
            totalWorkflows: 0,
            systemHealth: 'healthy',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: 0
        };
    }
    async recordMetric(name, value) {
        // Basic metrics recording implementation
        // In production, this would store to a metrics database
        // eslint-disable-next-line no-console
        console.log(`Metric: ${name} = ${value}`);
    }
    async getSystemStats() {
        return {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: 0
        };
    }
};
MetricsService = __decorate([
    Injectable()
], MetricsService);
export { MetricsService };
//# sourceMappingURL=metrics.service.js.map