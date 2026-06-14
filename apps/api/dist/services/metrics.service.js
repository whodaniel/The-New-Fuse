"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
// @ts-nocheck
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
const os = __importStar(require("node:os"));
let MetricsService = class MetricsService {
    /**
     * Get basic platform metrics
     */
    async getMetrics() {
        const [totalUsers, totalAgents, totalWorkflows] = await Promise.all([
            database_1.drizzleUserRepository.count(),
            database_1.drizzleAgentRepository.count(),
            database_1.drizzleWorkflowRepository.count(),
        ]);
        return {
            totalUsers,
            totalAgents,
            totalWorkflows,
            systemHealth: this.getHealthStatus(),
        };
    }
    /**
     * Get comprehensive system metrics
     */
    async getSystemMetrics() {
        const [totalUsers, activeUsers, totalAgents, activeAgents, totalWorkflows] = await Promise.all([
            database_1.drizzleUserRepository.count(),
            this.getActiveUserCount(),
            database_1.drizzleAgentRepository.count(),
            this.getActiveAgentCount(),
            database_1.drizzleWorkflowRepository.count(),
        ]);
        // Get real system metrics
        const cpuUsage = this.getCPUUsage();
        const loadAverage = os.loadavg();
        return {
            // User metrics
            totalUsers,
            activeUsers,
            // Agent metrics
            totalAgents,
            activeAgents,
            // Workflow metrics
            totalWorkflows,
            // System health
            systemHealth: this.getHealthStatus(),
            uptime: process.uptime(),
            // Memory metrics
            memory: {
                used: process.memoryUsage().heapUsed,
                total: os.totalmem(),
                free: os.freemem(),
                percentage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
            },
            // CPU metrics
            cpu: {
                usage: cpuUsage,
                loadAverage: {
                    '1min': loadAverage[0],
                    '5min': loadAverage[1],
                    '15min': loadAverage[2],
                },
                cores: os.cpus().length,
            },
            // Platform info
            platform: {
                type: os.platform(),
                release: os.release(),
                arch: os.arch(),
                hostname: os.hostname(),
            },
            timestamp: new Date(),
        };
    }
    /**
     * Record a custom metric
     */
    async recordMetric(name, value, metadata) {
        // Log to audit trail
        await database_1.drizzleAuditLogsRepository.create({
            action: 'metric.recorded',
            details: { name, value, metadata },
            status: 'success',
        });
    }
    /**
     * Get system statistics
     */
    async getSystemStats() {
        const cpuUsage = this.getCPUUsage();
        const memoryUsage = this.getMemoryUsage();
        return {
            uptime: process.uptime(),
            memory: {
                heapUsed: process.memoryUsage().heapUsed,
                heapTotal: process.memoryUsage().heapTotal,
                rss: process.memoryUsage().rss,
                external: process.memoryUsage().external,
                percentage: memoryUsage,
            },
            cpu: {
                usage: cpuUsage,
                loadAverage: os.loadavg(),
            },
        };
    }
    /**
     * Get CPU usage percentage
     */
    getCPUUsage() {
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;
        cpus.forEach((cpu) => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });
        const idle = totalIdle / cpus.length;
        const total = totalTick / cpus.length;
        const usage = 100 - ~~((100 * idle) / total);
        return usage;
    }
    /**
     * Get memory usage percentage
     */
    getMemoryUsage() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        return ((totalMem - freeMem) / totalMem) * 100;
    }
    /**
     * Get system health status
     */
    getHealthStatus() {
        const memUsage = this.getMemoryUsage();
        const cpuUsage = this.getCPUUsage();
        if (memUsage > 90 || cpuUsage > 90) {
            return 'critical';
        }
        else if (memUsage > 75 || cpuUsage > 75) {
            return 'degraded';
        }
        return 'healthy';
    }
    /**
     * Get count of active users (logged in within last 24 hours)
     */
    async getActiveUserCount() {
        // This would require a more complex query - for now return approximate
        return Math.floor((await database_1.drizzleUserRepository.count()) * 0.3); // Estimate 30% active
    }
    /**
     * Get count of active agents
     */
    async getActiveAgentCount() {
        // This would require a more complex query - for now return approximate
        return Math.floor((await database_1.drizzleAgentRepository.count()) * 0.4); // Estimate 40% active
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)()
], MetricsService);
//# sourceMappingURL=metrics.service.js.map