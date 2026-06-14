"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskQueue = void 0;
const bull_1 = __importDefault(require("bull"));
const events_1 = require("events");
const types_js_1 = require("./types.js");
/**
 * Priority-based task queue using Bull
 */
class TaskQueue extends events_1.EventEmitter {
    constructor(redisUrl = 'redis://localhost:6379') {
        super();
        this.redisConfig = {
            redis: redisUrl,
        };
        this.queues = new Map();
        this.initializeQueues();
    }
    /**
     * Initialize priority queues
     */
    initializeQueues() {
        Object.values(types_js_1.TaskPriority)
            .filter((value) => typeof value === 'number')
            .forEach((priority) => {
            const queue = new bull_1.default(`tasks:priority:${priority}`, this.redisConfig);
            queue.on('completed', (job) => {
                this.emit('task:completed', job.data);
            });
            queue.on('failed', (job, err) => {
                this.emit('task:failed', job.data, err);
            });
            queue.on('progress', (job, progress) => {
                this.emit('task:progress', job.data, progress);
            });
            this.queues.set(priority, queue);
        });
    }
    /**
     * Add a task to the queue
     */
    async addTask(task, options) {
        const queue = this.queues.get(task.priority);
        if (!queue) {
            throw new Error(`Invalid priority: ${task.priority}`);
        }
        const jobOptions = {
            priority: task.priority,
            attempts: task.maxRetries || 3,
            timeout: task.timeout || 60000,
            removeOnComplete: false,
            removeOnFail: false,
            ...options,
        };
        const job = await queue.add(task, jobOptions);
        this.emit('task:queued', task);
        return job;
    }
    /**
     * Get next available task based on priority
     */
    async getNextTask() {
        // Check queues in priority order
        const priorities = [
            types_js_1.TaskPriority.CRITICAL,
            types_js_1.TaskPriority.HIGH,
            types_js_1.TaskPriority.NORMAL,
            types_js_1.TaskPriority.LOW,
            types_js_1.TaskPriority.BACKGROUND,
        ];
        for (const priority of priorities) {
            const queue = this.queues.get(priority);
            if (!queue)
                continue;
            const waiting = await queue.getWaitingCount();
            if (waiting > 0) {
                const job = await queue.getNextJob();
                if (job) {
                    return job.data;
                }
            }
        }
        return null;
    }
    /**
     * Get task by ID
     */
    async getTask(taskId) {
        for (const queue of this.queues.values()) {
            const job = await queue.getJob(taskId);
            if (job) {
                return job.data;
            }
        }
        return null;
    }
    /**
     * Update task status
     */
    async updateTaskStatus(taskId, status) {
        for (const queue of this.queues.values()) {
            const job = await queue.getJob(taskId);
            if (job) {
                await job.update({
                    ...job.data,
                    status,
                    updatedAt: new Date(),
                });
                this.emit('task:updated', job.data);
                return;
            }
        }
    }
    /**
     * Cancel a task
     */
    async cancelTask(taskId) {
        for (const queue of this.queues.values()) {
            const job = await queue.getJob(taskId);
            if (job) {
                await job.remove();
                this.emit('task:cancelled', job.data);
                return true;
            }
        }
        return false;
    }
    /**
     * Get queue statistics
     */
    async getStatistics() {
        const stats = [];
        for (const [priority, queue] of this.queues.entries()) {
            const [waiting, active, completed, failed] = await Promise.all([
                queue.getWaitingCount(),
                queue.getActiveCount(),
                queue.getCompletedCount(),
                queue.getFailedCount(),
            ]);
            stats.push({
                priority,
                waiting,
                active,
                completed,
                failed,
            });
        }
        return stats;
    }
    /**
     * Get total queue depth
     */
    async getQueueDepth() {
        let total = 0;
        for (const queue of this.queues.values()) {
            total += await queue.getWaitingCount();
        }
        return total;
    }
    /**
     * Pause all queues
     */
    async pauseAll() {
        await Promise.all(Array.from(this.queues.values()).map((queue) => queue.pause()));
        this.emit('queues:paused');
    }
    /**
     * Resume all queues
     */
    async resumeAll() {
        await Promise.all(Array.from(this.queues.values()).map((queue) => queue.resume()));
        this.emit('queues:resumed');
    }
    /**
     * Clean completed/failed jobs
     */
    async clean(grace = 5000) {
        for (const queue of this.queues.values()) {
            await queue.clean(grace, 'completed');
            await queue.clean(grace, 'failed');
        }
    }
    /**
     * Close all queues
     */
    async close() {
        await Promise.all(Array.from(this.queues.values()).map((queue) => queue.close()));
        this.removeAllListeners();
    }
}
exports.TaskQueue = TaskQueue;
//# sourceMappingURL=TaskQueue.js.map