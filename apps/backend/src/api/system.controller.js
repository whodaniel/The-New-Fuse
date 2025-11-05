"use strict";
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
exports.SystemController = void 0;
const common_1 = require("@nestjs/common");
let SystemController = class SystemController {
    async getServicesStatus() {
        const services = [
            {
                name: 'Frontend App',
                status: await this.checkPortStatus(3000) ? 'running' : 'stopped',
                port: 3000,
                type: 'web',
                health: await this.checkPortStatus(3000) ? 'healthy' : 'error'
            },
            {
                name: 'Backend API',
                status: 'running',
                port: 3004,
                type: 'api',
                health: 'healthy',
                uptime: process.uptime() * 1000
            },
            {
                name: 'Browser Hub HTTP Server',
                status: await this.checkPortStatus(8080) ? 'running' : 'stopped',
                port: 8080,
                type: 'http',
                health: await this.checkPortStatus(8080) ? 'healthy' : 'error'
            },
            {
                name: 'PostgreSQL Database',
                status: await this.checkDockerContainer('tnf-postgres-dev') || await this.checkPortStatus(5433) ? 'running' : 'stopped',
                port: 5433,
                type: 'database',
                health: await this.checkDockerContainer('tnf-postgres-dev') || await this.checkPortStatus(5433) ? 'healthy' : 'error'
            },
            {
                name: 'Redis Cache',
                status: await this.checkDockerContainer('tnf-redis-dev') || await this.checkPortStatus(6380) ? 'running' : 'stopped',
                port: 6380,
                type: 'cache',
                health: await this.checkDockerContainer('tnf-redis-dev') || await this.checkPortStatus(6380) ? 'healthy' : 'error'
            }
        ];
        return services;
    }
    async getSystemMetrics() {
        const memUsage = process.memoryUsage();
        return {
            uptime: process.uptime() * 1000,
            memory: {
                used: memUsage.heapUsed,
                total: memUsage.heapTotal,
                percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
            },
            cpu: {
                usage: process.cpuUsage().system / 1000000 // Convert to percentage
            },
            platform: process.platform,
            version: process.version
        };
    }
    async getSystemTools() {
        const tools = [
            {
                name: 'Chrome Browser',
                type: 'browser',
                status: 'active'
            },
            {
                name: 'Node.js Runtime',
                type: 'runtime',
                status: 'active',
                version: process.version
            },
            {
                name: 'Terminal Integration',
                type: 'shell',
                status: 'active'
            },
            {
                name: 'Workflow Builder',
                type: 'automation',
                status: 'active'
            }
        ];
        return tools;
    }
    async checkPortStatus(port) {
        try {
            const axios = require('axios');
            await axios.get(`http://localhost:${port}`, { timeout: 1000 });
            return true;
        }
        catch {
            return false;
        }
    }
    async checkDockerContainer(containerName) {
        try {
            const { execSync } = require('child_process');
            const result = execSync(`docker ps --filter "name=${containerName}" --format "table {{.Status}}"`, { encoding: 'utf8', timeout: 2000 });
            return result.includes('Up ');
        }
        catch {
            return false;
        }
    }
};
exports.SystemController = SystemController;
__decorate([
    (0, common_1.Get)('services/status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SystemController.prototype, "getServicesStatus", null);
__decorate([
    (0, common_1.Get)('system/metrics'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SystemController.prototype, "getSystemMetrics", null);
__decorate([
    (0, common_1.Get)('system/tools'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SystemController.prototype, "getSystemTools", null);
exports.SystemController = SystemController = __decorate([
    (0, common_1.Controller)('api')
], SystemController);
//# sourceMappingURL=system.controller.js.map