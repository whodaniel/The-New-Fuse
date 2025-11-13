"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAgent = void 0;
const events_1 = require("events");
const common_1 = require("@nestjs/common");
const bridges_1 = require("./bridges");
const manager_1 = require("../context/manager");
const recovery_1 = require("../error/recovery");
const metrics_1 = require("../monitoring/metrics");
const agent_interface_1 = require("../interfaces/agent.interface");
// Create logger
const logger = new common_1.Logger('BaseAgent');
class BaseAgent extends events_1.EventEmitter {
    config;
    bridge;
    contextManager;
    metrics;
    monitor;
    errorRecovery;
    state = agent_interface_1.AgentState.INITIALIZING;
    tasks = new Map();
    context = new Map();
    shouldRun = false;
    taskProcessor;
    constructor(config, bridge, redisClient) {
        super();
        this.config = {
            modelName: 'gpt-4',
            maxConcurrentTasks: 5,
            taskTimeout: 300,
            retryLimit: 3,
            memoryLimit: 1000,
            ...config
        };
        this.bridge = bridge;
        // Initialize context manager
        this.contextManager = new manager_1.ContextManager(manager_1.ContextType.AGENT, config.agentId, redisClient);
        // Initialize monitoring
        this.monitor = new metrics_1.PerformanceMonitor(config.agentId, redisClient);
        // Initialize remaining state
        this.metrics = new metrics_1.MetricsRegistry(config.agentId);
        this.errorRecovery = new recovery_1.ErrorRecovery();
    }
    async sendMessage(message, messageType, priority = bridges_1.Priority.MEDIUM) {
        if (!this.bridge) {
            throw new Error('Bridge not initialized');
        }
        await this.bridge.sendMessage(message, messageType, priority);
    }
    async handleError(error, category, severity) {
        logger.error(`Agent ${this.config.agentId} encountered error: ${error.message} [${category}/${severity}]`);
        await this.errorRecovery.handleError(error, category, severity);
        if (severity === recovery_1.ErrorSeverity.FATAL) {
            this.terminate();
        }
    }
    async start() {
        if (this.shouldRun) {
            return;
        }
        this.shouldRun = true;
        await this.processNextTask();
    }
    async stop() {
        this.shouldRun = false;
    }
    async terminate() {
        await this.stop();
        this.state = agent_interface_1.AgentState.TERMINATED;
        this.emit('terminated');
    }
    async processNextTask() {
        if (!this.shouldRun || this.tasks.size === 0) {
            return;
        }
        // Find next task to process
        const [taskId, task] = Array.from(this.tasks.entries())
            .find(([_, t]) => t.status === 'pending') || [null, null];
        if (!taskId || !task) {
            return;
        }
        task.status = 'running';
        task.startTime = Date.now();
        try {
            const result = await this.executeTask(task);
            task.status = 'completed';
            task.result = result;
        }
        catch (error) {
            task.status = 'failed';
            task.error = error instanceof Error ? error : new Error(String(error));
        }
    }
}
exports.BaseAgent = BaseAgent;
//# sourceMappingURL=BaseAgent.js.map