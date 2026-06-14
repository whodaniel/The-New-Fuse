"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistentMetricsCollector = void 0;
const common_1 = require("@nestjs/common");
class PersistentMetricsCollector {
    constructor(redisService, keyPrefix = 'agent-coord:metrics:') {
        this.redisService = redisService;
        this.logger = new common_1.Logger(PersistentMetricsCollector.name);
        this.keyPrefix = keyPrefix;
    }
    async recordTaskCreated(task) {
        const timestamp = Date.now();
        const taskData = JSON.stringify({
            id: task.id,
            type: task.type,
            priority: task.priority,
            timestamp,
            status: 'created'
        });
        const minuteBucket = Math.floor(timestamp / 60000);
        // Using pipeline for efficiency
        const pipe = await this.redisService.pipeline();
        // Increment total tasks created
        pipe.incr(`${this.keyPrefix}tasks:created`);
        // Add to recent tasks list (keep last 1000)
        pipe.lpush(`${this.keyPrefix}tasks:recent`, taskData);
        pipe.ltrim(`${this.keyPrefix}tasks:recent`, 0, 999);
        // Record throughput (tasks per minute bucket)
        pipe.incr(`${this.keyPrefix}throughput:${minuteBucket}`);
        pipe.expire(`${this.keyPrefix}throughput:${minuteBucket}`, 3600); // Keep for 1 hour
        await pipe.exec();
    }
    async recordTaskCompleted(task, duration) {
        const timestamp = Date.now();
        const pipe = await this.redisService.pipeline();
        // Increment total tasks completed
        pipe.incr(`${this.keyPrefix}tasks:completed`);
        // Update agent metrics if assigned
        if (task.assignedTo) {
            const agentKey = `${this.keyPrefix}agent:${task.assignedTo}`;
            pipe.hincrby(agentKey, 'completed', 1);
            // Update running average execution time for agent
            pipe.hincrby(agentKey, 'totalTime', Math.round(duration));
            pipe.hset(agentKey, { 'lastActive': timestamp.toString() });
        }
        // Update global average execution time
        pipe.incr(`${this.keyPrefix}execution:count`);
        pipe.incrby(`${this.keyPrefix}execution:totalTime`, Math.round(duration));
        await pipe.exec();
    }
    async recordTaskFailed(task, error) {
        const timestamp = Date.now();
        const pipe = await this.redisService.pipeline();
        // Increment total tasks failed
        pipe.incr(`${this.keyPrefix}tasks:failed`);
        // Update agent metrics if assigned
        if (task.assignedTo) {
            const agentKey = `${this.keyPrefix}agent:${task.assignedTo}`;
            pipe.hincrby(agentKey, 'failed', 1);
            pipe.hset(agentKey, { 'lastActive': timestamp.toString() });
        }
        await pipe.exec();
    }
    async getSystemMetrics() {
        const [created, completed, failed, execCount, execTotalTime] = await Promise.all([
            this.redisService.get(`${this.keyPrefix}tasks:created`),
            this.redisService.get(`${this.keyPrefix}tasks:completed`),
            this.redisService.get(`${this.keyPrefix}tasks:failed`),
            this.redisService.get(`${this.keyPrefix}execution:count`),
            this.redisService.get(`${this.keyPrefix}execution:totalTime`)
        ]);
        // Calculate tasks per minute (last 5 minutes average)
        const currentMinute = Math.floor(Date.now() / 60000);
        const tpmKeys = [];
        for (let i = 0; i < 5; i++) {
            tpmKeys.push(`${this.keyPrefix}throughput:${currentMinute - i}`);
        }
        const tpmValues = await this.redisService.mget(...tpmKeys);
        const totalTpm = tpmValues.reduce((sum, val) => sum + (parseInt(val || '0', 10)), 0);
        const avgTpm = totalTpm / 5;
        // Get active agents count (scan for agent keys updated recently)
        // This is an approximation or could be fetched from PresenceTracker
        const activeAgents = 0; // We will rely on PresenceTracker for this value in the coordinator
        const totalExecCount = parseInt(execCount || '0', 10);
        const totalExecTime = parseInt(execTotalTime || '0', 10);
        const avgExecTime = totalExecCount > 0 ? totalExecTime / totalExecCount : 0;
        return {
            totalTasksCreated: parseInt(created || '0', 10),
            totalTasksCompleted: parseInt(completed || '0', 10),
            totalTasksFailed: parseInt(failed || '0', 10),
            activeAgents, // Placeholder, should be filled by coordinator
            averageExecutionTime: avgExecTime,
            tasksPerMinute: avgTpm
        };
    }
    async getAgentMetrics(agentId) {
        const key = `${this.keyPrefix}agent:${agentId}`;
        const data = await this.redisService.hgetall(key);
        if (!data || Object.keys(data).length === 0) {
            return null;
        }
        const completed = parseInt(data.completed || '0', 10);
        const failed = parseInt(data.failed || '0', 10);
        const totalTime = parseInt(data.totalTime || '0', 10);
        const lastActive = parseInt(data.lastActive || '0', 10);
        const total = completed + failed;
        const successRate = total > 0 ? completed / total : 0;
        const avgTime = completed > 0 ? totalTime / completed : 0;
        return {
            tasksCompleted: completed,
            tasksFailed: failed,
            averageExecutionTime: avgTime,
            successRate,
            lastActive
        };
    }
    async clearMetrics() {
        const keys = await this.redisService.keys(`${this.keyPrefix}*`);
        if (keys.length > 0) {
            await Promise.all(keys.map(key => this.redisService.del(key)));
        }
    }
}
exports.PersistentMetricsCollector = PersistentMetricsCollector;
//# sourceMappingURL=PersistentMetricsCollector.js.map