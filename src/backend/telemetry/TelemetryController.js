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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryController = void 0;
const common_1 = require("@nestjs/common");
const TelemetryWorker_js_1 = require("./TelemetryWorker.js");
/**
 * Controller for handling telemetry data from clients
 */
let TelemetryController = class TelemetryController {
    telemetryWorker;
    constructor() {
        // Initialize the telemetry worker with environment variables
        this.telemetryWorker = new TelemetryWorker_js_1.TelemetryWorker({
            redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
            enableLangfuse: process.env.ENABLE_LANGFUSE === 'true',
            langfusePublicKey: process.env.LANGFUSE_PUBLIC_KEY || '',
            langfuseSecretKey: process.env.LANGFUSE_SECRET_KEY || '',
            langfuseHost: process.env.LANGFUSE_HOST || 'https://langfuse.com',
        });
    }
    /**
     * Receive telemetry events from clients
     */
    async receiveEvents(payload) {
        try {
            const { events } = payload;
            if (!Array.isArray(events)) {
                throw new common_1.HttpException('Invalid payload: events must be an array', common_1.HttpStatus.BAD_REQUEST);
            }
            // Process each event
            const promises = events.map(event => this.telemetryWorker.process(event));
            await Promise.all(promises);
            return { success: true, processed: events.length };
        }
        catch (error) {
            throw new common_1.HttpException(`Failed to process telemetry events: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    /**
     * Get recent agent activity
     */
    async getAgentActivity() {
        try {
            const redisClient = this.telemetryWorker['redisClient'];
            if (!redisClient) {
                throw new Error('Redis client not available');
            }
            // Get all agent statuses
            const agentStatusMap = await redisClient.hGetAll('agents:status');
            // Convert to array
            const agents = Object.entries(agentStatusMap).map(([agentId, status]) => ({
                agentId,
                status
            }));
            // Get recent tools for each agent
            const recentTools = await Promise.all(agents.map(async (agent) => {
                const recentToolsJson = await redisClient.lRange(`metrics:agent:${agent.agentId}:recent_tools`, 0, 9);
                return recentToolsJson.map(json => JSON.parse(json));
            }));
            // Add recent tools to agents
            agents.forEach((agent, index) => {
                agent['recentTools'] = recentTools[index];
            });
            return { agents };
        }
        catch (error) {
            throw new common_1.HttpException(`Failed to get agent activity: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    /**
     * Get tool usage metrics
     */
    async getToolUsage(limitStr = '20') {
        try {
            const limit = parseInt(limitStr, 10);
            const redisClient = this.telemetryWorker['redisClient'];
            if (!redisClient) {
                throw new Error('Redis client not available');
            }
            // Get tool usage from Redis (sorted by count)
            const toolKeys = await redisClient.keys('metrics:tool:*:count');
            // Get counts for each tool
            const toolCounts = await Promise.all(toolKeys.map(async (key) => {
                const count = await redisClient.get(key);
                const toolId = key.split(':')[2];
                return { toolId, count: parseInt(count || '0', 10) };
            }));
            // Sort by count and limit
            const sortedTools = toolCounts
                .sort((a, b) => b.count - a.count)
                .slice(0, limit);
            return { tools: sortedTools };
        }
        catch (error) {
            throw new common_1.HttpException(`Failed to get tool usage: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    /**
     * Get recent traces
     */
    async getRecentTraces(limitStr = '20') {
        try {
            const limit = parseInt(limitStr, 10);
            const redisClient = this.telemetryWorker['redisClient'];
            if (!redisClient) {
                throw new Error('Redis client not available');
            }
            // Get recent traces from Redis sorted set
            const recentTraceIds = await redisClient.zRange('index:trace:by_time', 0, limit - 1, {
                REV: true
            });
            // Get trace details
            const traces = await Promise.all(recentTraceIds.map(async (id) => {
                const traceJson = await redisClient.get(`trace:${id}`);
                return traceJson ? JSON.parse(traceJson) : null;
            }));
            // Filter out nulls
            const validTraces = traces.filter(trace => trace !== null);
            return { traces: validTraces };
        }
        catch (error) {
            throw new common_1.HttpException(`Failed to get recent traces: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.TelemetryController = TelemetryController;
__decorate([
    (0, common_1.Post)('events'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelemetryController.prototype, "receiveEvents", null);
__decorate([
    (0, common_1.Get)('agents/activity'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TelemetryController.prototype, "getAgentActivity", null);
__decorate([
    (0, common_1.Get)('tools/usage'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelemetryController.prototype, "getToolUsage", null);
__decorate([
    (0, common_1.Get)('traces/recent'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelemetryController.prototype, "getRecentTraces", null);
exports.TelemetryController = TelemetryController = __decorate([
    (0, common_1.Controller)('api/telemetry'),
    __metadata("design:paramtypes", [])
], TelemetryController);
//# sourceMappingURL=TelemetryController.js.map