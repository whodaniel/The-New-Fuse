"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemQueueService = exports.SystemQueueName = void 0;
const bull_1 = __importDefault(require("bull"));
// Enum from backend (mirrored)
var SystemQueueName;
(function (SystemQueueName) {
    SystemQueueName["EMAIL"] = "email";
    SystemQueueName["AGENT_EXECUTION"] = "agent-execution";
    SystemQueueName["REPORT_GENERATION"] = "report-generation";
    SystemQueueName["DATA_SYNC"] = "data-sync";
    SystemQueueName["CLEANUP"] = "cleanup";
})(SystemQueueName || (exports.SystemQueueName = SystemQueueName = {}));
class SystemQueueService {
    constructor(redisUrl) {
        this.queues = new Map();
        this.redisUrl =
            redisUrl ||
                process.env.REDIS_URL ||
                process.env.CLOUD_RUNTIME_REDIS_URL ||
                process.env.LIVE_REDIS_URL ||
                process.env.REDIS_PRIVATE_URL ||
                process.env.REDIS_TLS_URL ||
                'redis://localhost:6379';
        this.initializeQueues();
    }
    initializeQueues() {
        Object.values(SystemQueueName).forEach((queueName) => {
            this.queues.set(queueName, new bull_1.default(queueName, this.redisUrl, {
                defaultJobOptions: {
                    removeOnComplete: true,
                    removeOnFail: false,
                },
            }));
        });
    }
    /**
     * Dispatches a system task to the backend via Redis/Bull
     */
    async dispatchTask(queueName, type, payload) {
        const queue = this.queues.get(queueName);
        if (!queue) {
            throw new Error(`Queue ${queueName} not found`);
        }
        const job = await queue.add(type, payload);
        return job.id?.toString() || 'unknown';
    }
    /**
     * Helper for Agent Execution
     */
    async scheduleAgentExecution(agentId, task, context) {
        return this.dispatchTask(SystemQueueName.AGENT_EXECUTION, 'execute', {
            agentId,
            task,
            context,
            timestamp: Date.now(),
        });
    }
    async close() {
        await Promise.all(parse(this.queues.values()).map((q) => q.close()));
    }
}
exports.SystemQueueService = SystemQueueService;
// Helper to iterate values if target is ES5... but we are in modern node.
function parse(iterator) {
    return Array.from(iterator);
}
//# sourceMappingURL=system-queue.service.js.map