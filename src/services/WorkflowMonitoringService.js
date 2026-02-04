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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowMonitoringService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_tsx_1 = require("../redis/redis.service.tsx");
const metrics_service_js_1 = require("../metrics/metrics.service.js");
const logger_service_js_1 = require("../common/logger.service.js");
let WorkflowMonitoringService = class WorkflowMonitoringService {
    redis;
    metrics;
    logger;
    metricsPrefix = 'workflow:metrics:';
    statusPrefix = 'workflow:status:';
    constructor(redis, metrics, logger) {
        this.redis = redis;
        this.metrics = metrics;
        this.logger = logger;
    }
    async trackWorkflowExecution(workflowId, event) {
        try {
            const key = `${this.statusPrefix}${workflowId}`;
            await this.redis.hset(key, {
                lastEvent: JSON.stringify(event),
                timestamp: Date.now().toString(),
                status: event.type
            });
            await this.updateMetrics(workflowId, event);
            await this.notifySubscribers(workflowId, event);
        }
        catch (error) {
            this.logger.error('Error tracking workflow execution:', error);
        }
    }
    async getWorkflowMetrics(workflowId) {
        const key = `${this.metricsPrefix}${workflowId}`;
        const rawMetrics = await this.redis.hgetall(key);
        return {
            totalTasks: parseInt(rawMetrics.totalTasks || '0'),
            completedTasks: parseInt(rawMetrics.completedTasks || '0'),
            failedTasks: parseInt(rawMetrics.failedTasks || '0'),
            avgTaskDuration: parseFloat(rawMetrics.avgTaskDuration || '0'),
            resourceUtilization: new Map(JSON.parse(rawMetrics.resourceUtilization || '[]'))
        };
    }
    async updateMetrics(workflowId, event) {
        const key = `${this.metricsPrefix}${workflowId}`;
        const currentMetrics = await this.getWorkflowMetrics(workflowId);
        switch (event.type) {
            case 'TASK_COMPLETED':
                currentMetrics.completedTasks++;
                break;
            case 'TASK_FAILED':
                currentMetrics.failedTasks++;
                break;
            case 'RESOURCE_USAGE':
                currentMetrics.resourceUtilization.set(event.resource, event.utilization);
                break;
        }
        await this.redis.hmset(key, {
            ...currentMetrics,
            resourceUtilization: JSON.stringify(Array.from(currentMetrics.resourceUtilization.entries()))
        });
        await this.metrics.recordMetrics(workflowId, currentMetrics);
    }
    async notifySubscribers(workflowId, event) {
        const channel = `workflow:events:${workflowId}`;
        await this.redis.publish(channel, JSON.stringify(event));
    }
    async subscribeToWorkflow(workflowId, callback) {
        const channel = `workflow:events:${workflowId}`;
        await this.redis.subscribe(channel, callback);
    }
    async unsubscribeFromWorkflow(workflowId) {
        const channel = `workflow:events:${workflowId}`;
        await this.redis.unsubscribe(channel);
    }
};
exports.WorkflowMonitoringService = WorkflowMonitoringService;
exports.WorkflowMonitoringService = WorkflowMonitoringService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof redis_service_tsx_1.RedisService !== "undefined" && redis_service_tsx_1.RedisService) === "function" ? _a : Object, typeof (_b = typeof metrics_service_js_1.MetricsService !== "undefined" && metrics_service_js_1.MetricsService) === "function" ? _b : Object, logger_service_js_1.Logger])
], WorkflowMonitoringService);
//# sourceMappingURL=WorkflowMonitoringService.js.map