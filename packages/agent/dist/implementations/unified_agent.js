"use strict";
/**
 * Unified Agent - Single agent that unifies all capabilities
 *
 * A unified agent that combines:
 * - Enhanced agent capabilities
 * - Bridge integration
 * - BMAD method support
 * - Swarm participation
 * - Protocol compliance (A2A, MCP)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedAgent = void 0;
exports.createUnifiedAgent = createUnifiedAgent;
const events_1 = require("events");
class UnifiedAgent extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.taskQueue = [];
        this.processing = false;
        this.heartbeatInterval = null;
        this.config = config;
        this.startTime = new Date();
        this.state = {
            status: 'idle',
            queueLength: 0,
            lastActivity: new Date(),
            uptime: 0,
        };
        this.metrics = {
            tasksCompleted: 0,
            tasksFailed: 0,
            totalDuration: 0,
            averageDuration: 0,
        };
    }
    // ============================================================
    // LIFECYCLE
    // ============================================================
    /**
     * Start the agent
     */
    async start() {
        this.startTime = new Date();
        this.state.status = 'idle';
        // Start heartbeat
        this.startHeartbeat();
        // Start task processing
        this.startProcessing();
        this.emit('started', { id: this.config.id });
    }
    /**
     * Stop the agent
     */
    async stop() {
        this.state.status = 'offline';
        this.stopHeartbeat();
        this.processing = false;
        this.emit('stopped', { id: this.config.id });
    }
    /**
     * Get agent info
     */
    getInfo() {
        return {
            id: this.config.id,
            name: this.config.name,
            role: this.config.role,
            capabilities: this.config.capabilities,
            protocols: this.config.protocols,
            state: this.getState(),
            metrics: { ...this.metrics },
        };
    }
    /**
     * Get current state
     */
    getState() {
        return {
            ...this.state,
            queueLength: this.taskQueue.length,
            uptime: (Date.now() - this.startTime.getTime()) / 1000,
        };
    }
    // ============================================================
    // TASK MANAGEMENT
    // ============================================================
    /**
     * Submit a task
     */
    async submitTask(task) {
        this.taskQueue.push(task);
        this.state.lastActivity = new Date();
        this.emit('task:submitted', task);
        // Sort by priority
        this.taskQueue.sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }
    /**
     * Execute a task directly
     */
    async executeTask(task) {
        const startTime = Date.now();
        this.state.status = 'busy';
        this.state.currentTask = task.id;
        try {
            this.emit('task:started', task);
            // Execute based on task type
            const result = await this.processTask(task);
            const duration = Date.now() - startTime;
            // Update metrics
            this.metrics.tasksCompleted++;
            this.metrics.totalDuration += duration;
            this.metrics.averageDuration = this.metrics.totalDuration / this.metrics.tasksCompleted;
            const taskResult = {
                taskId: task.id,
                success: true,
                result,
                duration,
                metadata: { agentId: this.config.id },
            };
            this.emit('task:completed', taskResult);
            return taskResult;
        }
        catch (error) {
            this.metrics.tasksFailed++;
            const taskResult = {
                taskId: task.id,
                success: false,
                error: error instanceof Error ? error.message : String(error),
                duration: Date.now() - startTime,
                metadata: { agentId: this.config.id },
            };
            this.emit('task:failed', taskResult);
            return taskResult;
        }
        finally {
            this.state.status = 'idle';
            this.state.currentTask = undefined;
            this.state.lastActivity = new Date();
        }
    }
    /**
     * Process task based on type
     */
    async processTask(task) {
        switch (task.type) {
            case 'analyze':
                return this.handleAnalyze(task);
            case 'generate':
                return this.handleGenerate(task);
            case 'transform':
                return this.handleTransform(task);
            case 'search':
                return this.handleSearch(task);
            case 'execute':
                return this.handleExecute(task);
            default:
                return this.handleCustom(task);
        }
    }
    // Task handlers
    async handleAnalyze(task) {
        // Simulate analysis
        await this.delay(100);
        return { analysis: 'completed', input: task.payload };
    }
    async handleGenerate(task) {
        await this.delay(150);
        return { generated: true, content: 'Generated content' };
    }
    async handleTransform(task) {
        await this.delay(50);
        return { transformed: true, data: task.payload };
    }
    async handleSearch(task) {
        await this.delay(100);
        return { results: [], query: task.payload };
    }
    async handleExecute(task) {
        await this.delay(200);
        return { executed: true };
    }
    async handleCustom(task) {
        await this.delay(100);
        return { handled: true, type: task.type };
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Start processing queue
     */
    startProcessing() {
        this.processing = true;
        const processLoop = async () => {
            while (this.processing) {
                if (this.taskQueue.length > 0 && this.state.status === 'idle') {
                    const task = this.taskQueue.shift();
                    if (task) {
                        await this.executeTask(task);
                    }
                }
                await this.delay(100);
            }
        };
        processLoop().catch((err) => this.emit('error', err));
    }
    // ============================================================
    // COMMUNICATION
    // ============================================================
    /**
     * Send message to another agent
     */
    async sendMessage(targetAgent, message, options = {}) {
        this.emit('message:sending', { target: targetAgent, message });
        // In production, route through bridges
        if (options.waitForResponse) {
            // Wait for response with timeout
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Response timeout'));
                }, options.timeout || 30000);
                this.once(`response:${targetAgent}`, (response) => {
                    clearTimeout(timeout);
                    resolve(response);
                });
            });
        }
        return { sent: true, target: targetAgent };
    }
    /**
     * Handle incoming message
     */
    handleMessage(from, message) {
        this.emit('message:received', { from, message });
        this.state.lastActivity = new Date();
        // Process based on message type
        if (typeof message === 'object' && message !== null) {
            const msg = message;
            if (msg.type === 'task') {
                this.submitTask(msg.payload);
            }
        }
    }
    // ============================================================
    // SWARM
    // ============================================================
    /**
     * Join a swarm
     */
    async joinSwarm(groupId) {
        if (!this.config.swarmConfig) {
            this.config.swarmConfig = {
                enabled: true,
                role: 'peer',
                groupId,
            };
        }
        else {
            this.config.swarmConfig.enabled = true;
            this.config.swarmConfig.groupId = groupId;
        }
        this.emit('swarm:joined', { groupId });
    }
    /**
     * Leave swarm
     */
    async leaveSwarm() {
        if (this.config.swarmConfig) {
            const groupId = this.config.swarmConfig.groupId;
            this.config.swarmConfig.enabled = false;
            this.config.swarmConfig.groupId = undefined;
            this.emit('swarm:left', { groupId });
        }
    }
    /**
     * Get swarm status
     */
    getSwarmStatus() {
        return this.config.swarmConfig || null;
    }
    // ============================================================
    // HEARTBEAT
    // ============================================================
    /**
     * Start heartbeat
     */
    startHeartbeat() {
        if (this.heartbeatInterval)
            return;
        this.heartbeatInterval = setInterval(() => {
            this.emit('heartbeat', {
                agentId: this.config.id,
                timestamp: new Date(),
                state: this.getState(),
            });
        }, 30000);
    }
    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    // ============================================================
    // CAPABILITIES
    // ============================================================
    /**
     * Check capability
     */
    hasCapability(capability) {
        return this.config.capabilities.includes(capability);
    }
    /**
     * Add capability
     */
    addCapability(capability) {
        if (!this.config.capabilities.includes(capability)) {
            this.config.capabilities.push(capability);
            this.emit('capability:added', { capability });
        }
    }
    /**
     * Remove capability
     */
    removeCapability(capability) {
        const index = this.config.capabilities.indexOf(capability);
        if (index !== -1) {
            this.config.capabilities.splice(index, 1);
            this.emit('capability:removed', { capability });
        }
    }
}
exports.UnifiedAgent = UnifiedAgent;
// ============================================================
// FACTORY
// ============================================================
function createUnifiedAgent(id, name, role, options = {}) {
    const config = {
        id,
        name,
        role,
        capabilities: options.capabilities || ['chat', 'analyze', 'generate', 'transform', 'search'],
        bridges: options.bridges || [{ type: 'universal' }],
        protocols: options.protocols || [
            { name: 'a2a', version: '0.3.0' },
            { name: 'tnf', version: '1.0.0' },
        ],
        swarmConfig: options.swarmConfig,
    };
    return new UnifiedAgent(config);
}
exports.default = UnifiedAgent;
//# sourceMappingURL=unified_agent.js.map