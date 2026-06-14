"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Coordinator = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
const AgentPool_js_1 = require("../core/AgentPool.js");
const TaskAssigner_js_1 = require("../core/TaskAssigner.js");
const TaskQueue_js_1 = require("../core/TaskQueue.js");
const types_js_1 = require("../core/types.js");
/**
 * Master coordinator for multi-agent task execution
 */
class Coordinator extends events_1.EventEmitter {
    constructor(redisUrl, agentPoolConfig, coordinationConfig) {
        super();
        this.activeTasks = new Map();
        this.taskResults = new Map();
        this.isRunning = false;
        this.taskQueue = new TaskQueue_js_1.TaskQueue(redisUrl);
        this.taskAssigner = new TaskAssigner_js_1.TaskAssigner(coordinationConfig);
        this.agentPool = new AgentPool_js_1.AgentPool(agentPoolConfig);
        this.setupEventHandlers();
    }
    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Task queue events
        this.taskQueue.on('task:completed', (task) => {
            this.handleTaskCompleted(task);
        });
        this.taskQueue.on('task:failed', (task, error) => {
            this.handleTaskFailed(task, error);
        });
        // Agent pool events
        this.agentPool.on('agent:registered', (agent) => {
            this.emit('agent:registered', agent);
        });
        this.agentPool.on('agent:heartbeat:timeout', (agent) => {
            this.handleAgentTimeout(agent);
        });
        // Task assigner events
        this.taskAssigner.on('assignment:created', (assignment) => {
            this.emit('assignment:created', assignment);
        });
    }
    /**
     * Start the coordinator
     */
    async start() {
        if (this.isRunning) {
            throw new Error('Coordinator is already running');
        }
        this.isRunning = true;
        this.emit('coordinator:started');
        // Start processing loop
        this.processingInterval = setInterval(() => this.processNextTask(), 1000);
    }
    /**
     * Stop the coordinator
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }
        this.isRunning = false;
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = undefined;
        }
        await this.taskQueue.pauseAll();
        this.emit('coordinator:stopped');
    }
    /**
     * Submit a task for execution
     */
    async submitTask(type, payload, options = {}) {
        const task = {
            id: (0, uuid_1.v4)(),
            type,
            priority: options.priority || types_js_1.TaskPriority.NORMAL,
            status: types_js_1.TaskStatus.PENDING,
            payload,
            requiredCapabilities: options.requiredCapabilities,
            dependencies: options.dependencies,
            timeout: options.timeout,
            maxRetries: options.maxRetries || 3,
            retryCount: 0,
            metadata: options.metadata,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        // Check dependencies
        if (task.dependencies && task.dependencies.length > 0) {
            const dependenciesMet = await this.checkDependencies(task);
            if (!dependenciesMet) {
                task.status = types_js_1.TaskStatus.PENDING;
                this.emit('task:dependencies:pending', task);
                // Store task but don't queue yet
                this.activeTasks.set(task.id, task);
                return task;
            }
        }
        // Add to activeTasks first to prevent race condition before queue execution
        task.status = types_js_1.TaskStatus.QUEUED;
        this.activeTasks.set(task.id, task);
        // Add to queue
        await this.taskQueue.addTask(task);
        this.emit('task:submitted', task);
        return task;
    }
    /**
     * Submit multiple tasks (batch submission)
     */
    async submitTasks(tasks) {
        const submittedTasks = await Promise.all(tasks.map((t) => this.submitTask(t.type, t.payload, t.options)));
        this.emit('tasks:batch:submitted', submittedTasks);
        return submittedTasks;
    }
    /**
     * Process next available task
     */
    async processNextTask() {
        if (!this.isRunning)
            return;
        const availableAgents = this.agentPool.getAvailableAgents();
        if (availableAgents.length === 0) {
            return; // No agents available
        }
        const task = await this.taskQueue.getNextTask();
        if (!task) {
            return; // No tasks in queue
        }
        // Ensure task is tracked in activeTasks to handle races or legacy tasks gracefully
        if (!this.activeTasks.has(task.id)) {
            this.activeTasks.set(task.id, task);
        }
        // Assign task to agent
        const assignment = this.taskAssigner.assignTask(task, availableAgents);
        if (!assignment) {
            // Put task back in queue
            await this.taskQueue.addTask(task);
            return;
        }
        // Update task status
        task.status = types_js_1.TaskStatus.ASSIGNED;
        task.assignedAgentId = assignment.agentId;
        task.updatedAt = new Date();
        task.startedAt = new Date();
        // Update agent load
        this.agentPool.incrementAgentLoad(assignment.agentId);
        this.emit('task:assigned', task, assignment);
        // Execute task (this would typically send to the agent via message queue)
        this.executeTask(task, assignment.agentId);
    }
    /**
     * Execute a task on an agent
     */
    async executeTask(task, agentId) {
        task.status = types_js_1.TaskStatus.IN_PROGRESS;
        task.updatedAt = new Date();
        this.emit('task:started', task, agentId);
        // In a real implementation, this would send the task to the agent
        // For now, we'll simulate task execution
        // The actual execution would be handled by the agent
    }
    /**
     * Handle task completion
     */
    handleTaskCompleted(task) {
        task.status = types_js_1.TaskStatus.COMPLETED;
        task.completedAt = new Date();
        task.updatedAt = new Date();
        if (task.assignedAgentId) {
            this.agentPool.decrementAgentLoad(task.assignedAgentId);
            this.taskAssigner.removeAssignment(task.id);
        }
        this.emit('task:completed', task);
        // Check if any pending tasks were waiting for this task
        this.checkPendingDependencies(task.id);
    }
    /**
     * Handle task failure
     */
    handleTaskFailed(task, error) {
        task.retryCount = (task.retryCount || 0) + 1;
        if (task.retryCount < (task.maxRetries || 3)) {
            // Retry the task
            task.status = types_js_1.TaskStatus.QUEUED;
            task.updatedAt = new Date();
            this.taskQueue.addTask(task);
            this.emit('task:retrying', task, error);
        }
        else {
            // Max retries exceeded
            task.status = types_js_1.TaskStatus.FAILED;
            task.completedAt = new Date();
            task.updatedAt = new Date();
            if (task.assignedAgentId) {
                this.agentPool.decrementAgentLoad(task.assignedAgentId);
                this.taskAssigner.removeAssignment(task.id);
            }
            this.emit('task:failed', task, error);
        }
    }
    /**
     * Handle agent timeout
     */
    handleAgentTimeout(agent) {
        // Reassign tasks from timed-out agent
        const assignments = this.taskAssigner.getAgentAssignments(agent.id);
        for (const assignment of assignments) {
            const task = this.activeTasks.get(assignment.taskId);
            if (task) {
                // Reset task and requeue
                task.status = types_js_1.TaskStatus.QUEUED;
                task.assignedAgentId = undefined;
                task.updatedAt = new Date();
                this.taskQueue.addTask(task);
                this.taskAssigner.removeAssignment(task.id);
                this.emit('task:reassigned', task);
            }
        }
        this.emit('agent:timeout', agent);
    }
    /**
     * Check if task dependencies are met
     */
    async checkDependencies(task) {
        if (!task.dependencies || task.dependencies.length === 0) {
            return true;
        }
        for (const dep of task.dependencies) {
            const depTask = this.activeTasks.get(dep.taskId);
            if (!depTask || depTask.status !== types_js_1.TaskStatus.COMPLETED) {
                return false;
            }
            // Check conditional dependencies
            if (dep.type === 'conditional' && dep.condition) {
                const depResult = this.taskResults.get(dep.taskId);
                if (!depResult || !dep.condition(depResult.result)) {
                    return false;
                }
            }
        }
        return true;
    }
    /**
     * Check pending tasks that may now have dependencies met
     */
    async checkPendingDependencies(completedTaskId) {
        const pendingTasks = Array.from(this.activeTasks.values()).filter((t) => t.status === types_js_1.TaskStatus.PENDING);
        for (const task of pendingTasks) {
            const dependenciesMet = await this.checkDependencies(task);
            if (dependenciesMet) {
                await this.taskQueue.addTask(task);
                task.status = types_js_1.TaskStatus.QUEUED;
                this.emit('task:dependencies:met', task);
            }
        }
    }
    /**
     * Report task result (called by agents)
     */
    async reportTaskResult(result) {
        const task = this.activeTasks.get(result.taskId);
        if (!task) {
            throw new Error(`Task ${result.taskId} not found`);
        }
        this.taskResults.set(result.taskId, result);
        if (result.success) {
            this.handleTaskCompleted(task);
        }
        else {
            this.handleTaskFailed(task, result.error || new Error('Task failed'));
        }
    }
    /**
     * Get task by ID
     */
    getTask(taskId) {
        return this.activeTasks.get(taskId);
    }
    /**
     * Get all active tasks
     */
    getActiveTasks() {
        return Array.from(this.activeTasks.values());
    }
    /**
     * Get coordinator statistics
     */
    async getStatistics() {
        const queueStats = await this.taskQueue.getStatistics();
        const poolStats = this.agentPool.getStatistics();
        const assignmentStats = this.taskAssigner.getStatistics();
        return {
            queue: queueStats,
            pool: poolStats,
            assignments: assignmentStats,
            activeTasks: this.activeTasks.size,
            completedTasks: Array.from(this.activeTasks.values()).filter((t) => t.status === types_js_1.TaskStatus.COMPLETED).length,
        };
    }
    /**
     * Emergency stop all tasks
     */
    async emergencyStop() {
        await this.stop();
        await this.taskQueue.pauseAll();
        this.emit('coordinator:emergency:stop');
    }
    /**
     * Cleanup
     */
    async close() {
        await this.stop();
        await this.taskQueue.close();
        this.agentPool.close();
        this.activeTasks.clear();
        this.taskResults.clear();
        this.removeAllListeners();
    }
}
exports.Coordinator = Coordinator;
//# sourceMappingURL=Coordinator.js.map