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
exports.MonitoringService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@the-new-fuse/core");
const agent_service_1 = require("./agent.service");
let MonitoringService = class MonitoringService {
    systemMonitor;
    metricsCollector;
    performanceMonitor;
    agentService;
    constructor(systemMonitor, metricsCollector, performanceMonitor, agentService) {
        this.systemMonitor = systemMonitor;
        this.metricsCollector = metricsCollector;
        this.performanceMonitor = performanceMonitor;
        this.agentService = agentService;
    }
    async getHealth() {
        const [system, database] = await Promise.all([
            this.systemMonitor.getHealth(),
            this.checkDatabaseHealth(),
        ]);
        return {
            status: 'ok',
            timestamp: new Date(),
            services: {
                system,
                database,
            },
        };
    }
    async getMetrics() {
        return {
            system: await this.systemMonitor.getLatestStats(),
            performance: await this.performanceMonitor.getMetrics(),
            custom: await this.metricsCollector.getCustomMetrics(),
        };
    }
    async getAgentStatus() {
        const agents = await this.agentService.findAll();
        const statuses = await Promise.all(agents.map(async (agent) => ({
            id: agent.id,
            status: await this.systemMonitor.getAgentStatus(agent.id),
        })));
        return {
            timestamp: new Date(),
            agents: statuses,
        };
    }
    async getPerformance() {
        return {
            ...(await this.performanceMonitor.getDetailedMetrics()),
            timestamp: new Date(),
        };
    }
    async getErrors() {
        return {
            recent: await this.systemMonitor.getRecentErrors(),
            summary: await this.metricsCollector.getErrorMetrics(),
        };
    }
    async getResources() {
        return {
            ...(await this.systemMonitor.getResourceUsage()),
        };
    }
    async getMemoryItems() {
        // TODO: connect to real memory store
        return { items: [], stats: { totalItems: 0, hitRate: 0 } };
    }
    async getCustomMetrics() {
        const custom = await this.metricsCollector.getCustomMetrics();
        // Expect custom has stepMetrics and memoryMetrics
        return {
            stepMetrics: custom.stepMetrics || [],
            memoryMetrics: custom.memoryMetrics || { totalItems: 0, hitRate: 0 },
        };
    }
    async checkDatabaseHealth() {
        try {
            // Add database health check logic here
            return {
                status: 'ok',
                latency: 0,
            };
        }
        catch (error) { // Explicitly type error as unknown
            return {
                status: 'error',
                // Check if error is an instance of Error before accessing message
                error: error instanceof Error ? error.message : 'An unknown database error occurred',
            };
        }
    }
};
exports.MonitoringService = MonitoringService;
exports.MonitoringService = MonitoringService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.SystemMonitor,
        core_1.MetricsCollector,
        core_1.PerformanceMonitor,
        agent_service_1.AgentService])
], MonitoringService);
