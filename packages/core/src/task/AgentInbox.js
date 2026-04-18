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
var AgentInbox_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentInbox = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const infrastructure_1 = require("@the-new-fuse/infrastructure");
const uuid_1 = require("uuid");
/**
 * AgentInbox - Email-like inbox system for agents
 *
 * Each agent has:
 * - tasks/ (pending, in-progress, completed)
 * - messages/ (unread, read)
 * - notifications/
 * - delegations/
 *
 * Integrates with:
 * - Existing TaskQueue infrastructure
 * - Heartbeat monitoring
 * - TNFRouter for task routing
 */
let AgentInbox = AgentInbox_1 = class AgentInbox {
    constructor(agentId, redisService, eventEmitter, options) {
        this.logger = new common_1.Logger(AgentInbox_1.name);
        this.agentId = agentId;
        this.redisService = redisService;
        this.eventEmitter = eventEmitter;
        this.options = options || {};
        this.logger.log(`AgentInbox created for agent: ${agentId}`);
    }
    // ============ INBOX LIFECYCLE ============
    /**
     * Create inbox structure for agent
     */
    async create() {
        this.logger.log(`Creating inbox for agent: ${this.agentId}`);
        // Ensure Redis keys exist
        const keys = [
            `agent:${this.agentId}:inbox:tasks:pending`,
            `agent:${this.agentId}:inbox:tasks:in-progress`,
            `agent:${this.agentId}:inbox:tasks:completed`,
            `agent:${this.agentId}:inbox:tasks:failed`,
            `agent:${this.agentId}:inbox:messages:unread`,
            `agent:${this.agentId}:inbox:messages:read`,
            `agent:${this.agentId}:inbox:notifications`,
            `agent:${this.agentId}:outbox:delegated`,
            `agent:${this.agentId}:outbox:sent-messages`,
        ];
        // Initialize with empty lists if they don't exist
        for (const key of keys) {
            const exists = await this.redisService.exists(key);
            if (!exists) {
                await this.redisService.lpush(key, '__INIT__');
                await this.redisService.lrem(key, '__INIT__', 1);
            }
        }
        // Set metadata
        await this.redisService.hset(`agent:${this.agentId}:metadata`, {
            createdAt: new Date().toISOString(),
            status: 'active',
            version: '1.0',
        });
        this.eventEmitter.emit('agent.inbox_created', {
            agentId: this.agentId,
            timestamp: new Date(),
        });
    }
    // ============ TASK OPERATIONS ============
    /**
     * Get all pending tasks
     */
    async getPendingTasks() {
        const tasks = await this.redisService.lrange(`agent:${this.agentId}:inbox:tasks:pending`, 0, -1);
        return tasks.map((t) => JSON.parse(t));
    }
    /**
     * Get count of pending tasks
     */
    async getPendingCount() {
        return await this.redisService.llen(`agent:${this.agentId}:inbox:tasks:pending`);
    }
    /**
     * Get in-progress tasks
     */
    async getInProgressTasks() {
        const tasks = await this.redisService.lrange(`agent:${this.agentId}:inbox:tasks:in-progress`, 0, -1);
        return tasks.map((t) => JSON.parse(t));
    }
    /**
     * Receive a new task into inbox
     */
    async receiveTask(task) {
        const agentTask = {
            id: task.id || (0, uuid_1.v4)(),
            type: task.type || 'unknown',
            data: task.data || {},
            status: 'pending',
            priority: task.priority || 5,
            createdAt: task.createdAt || new Date(),
            agentId: this.agentId,
            requiresSkills: task.requiresSkills || [],
            delegatedFrom: task.delegatedFrom,
            metadata: {
                ...task.metadata,
                receivedAt: new Date(),
            },
        };
        this.logger.log(`Agent ${this.agentId} receiving task: ${agentTask.id} (type: ${agentTask.type})`);
        // Add to pending queue
        await this.redisService.lpush(`agent:${this.agentId}:inbox:tasks:pending`, JSON.stringify(agentTask));
        // Emit event
        this.eventEmitter.emit('agent.task_received', {
            agentId: this.agentId,
            taskId: agentTask.id,
            taskType: agentTask.type,
            priority: agentTask.priority,
            timestamp: new Date(),
        });
        // Record activity for heartbeat
        await this.recordActivity('task_received', { taskId: agentTask.id });
        return agentTask;
    }
    /**
     * Start working on a task (move from pending to in-progress)
     */
    async startTask(taskId) {
        const pending = await this.getPendingTasks();
        const task = pending.find((t) => t.id === taskId);
        if (!task) {
            throw new Error(`Task ${taskId} not found in pending queue for agent ${this.agentId}`);
        }
        // Remove from pending
        await this.redisService.lrem(`agent:${this.agentId}:inbox:tasks:pending`, JSON.stringify(task), 1);
        // Add to in-progress
        const inProgressTask = {
            ...task,
            status: 'running',
            startedAt: new Date(),
        };
        await this.redisService.lpush(`agent:${this.agentId}:inbox:tasks:in-progress`, JSON.stringify(inProgressTask));
        this.eventEmitter.emit('agent.task_started', {
            agentId: this.agentId,
            taskId,
            timestamp: new Date(),
        });
        await this.recordActivity('task_started', { taskId });
    }
    /**
     * Complete a task
     */
    async completeTask(taskId, result) {
        const inProgress = await this.getInProgressTasks();
        const task = inProgress.find((t) => t.id === taskId);
        if (!task) {
            throw new Error(`Task ${taskId} not found in in-progress queue for agent ${this.agentId}`);
        }
        // Remove from in-progress
        await this.redisService.lrem(`agent:${this.agentId}:inbox:tasks:in-progress`, JSON.stringify(task), 1);
        // Add to completed
        const completedTask = {
            ...task,
            status: 'completed',
            completedAt: new Date(),
            result,
        };
        await this.redisService.lpush(`agent:${this.agentId}:inbox:tasks:completed`, JSON.stringify(completedTask));
        this.eventEmitter.emit('agent.task_completed', {
            agentId: this.agentId,
            taskId,
            result,
            duration: new Date().getTime() - new Date(task.startedAt).getTime(),
            timestamp: new Date(),
        });
        await this.recordActivity('task_completed', { taskId, result });
        // Cleanup old completed tasks (keep last 100)
        const completedCount = await this.redisService.llen(`agent:${this.agentId}:inbox:tasks:completed`);
        if (completedCount > 100) {
            await this.redisService.ltrim(`agent:${this.agentId}:inbox:tasks:completed`, 0, 99);
        }
    }
    /**
     * Fail a task
     */
    async failTask(taskId, error) {
        const inProgress = await this.getInProgressTasks();
        const task = inProgress.find((t) => t.id === taskId);
        if (!task) {
            throw new Error(`Task ${taskId} not found in in-progress queue for agent ${this.agentId}`);
        }
        // Remove from in-progress
        await this.redisService.lrem(`agent:${this.agentId}:inbox:tasks:in-progress`, JSON.stringify(task), 1);
        // Add to failed
        const failedTask = {
            ...task,
            status: 'failed',
            completedAt: new Date(),
            error: error instanceof Error ? error.message : error,
        };
        await this.redisService.lpush(`agent:${this.agentId}:inbox:tasks:failed`, JSON.stringify(failedTask));
        this.eventEmitter.emit('agent.task_failed', {
            agentId: this.agentId,
            taskId,
            error: failedTask.error,
            timestamp: new Date(),
        });
        await this.recordActivity('task_failed', { taskId, error: failedTask.error });
    }
    // ============ DELEGATION ============
    /**
     * Delegate task to another agent
     */
    async delegateTask(taskId, targetAgentId) {
        this.logger.log(`Agent ${this.agentId} delegating task ${taskId} to ${targetAgentId}`);
        const pending = await this.getPendingTasks();
        const task = pending.find((t) => t.id === taskId);
        if (!task) {
            throw new Error(`Task ${taskId} not found in pending queue`);
        }
        // Mark as delegated
        const delegatedTask = {
            ...task,
            delegatedFrom: this.agentId,
            delegatedTo: targetAgentId,
            metadata: {
                ...task.metadata,
                delegatedAt: new Date(),
            },
        };
        // Remove from this agent's inbox
        await this.redisService.lrem(`agent:${this.agentId}:inbox:tasks:pending`, JSON.stringify(task), 1);
        // Add to outbox/delegations
        await this.redisService.lpush(`agent:${this.agentId}:outbox:delegated`, JSON.stringify(delegatedTask));
        // Send to target agent's inbox
        const targetInbox = new AgentInbox_1(targetAgentId, this.redisService, this.eventEmitter, this.options);
        await targetInbox.receiveTask(delegatedTask);
        this.eventEmitter.emit('agent.task_delegated', {
            from: this.agentId,
            to: targetAgentId,
            taskId,
            timestamp: new Date(),
        });
        await this.recordActivity('task_delegated', {
            taskId,
            targetAgentId,
        });
    }
    // ============ MESSAGES ============
    /**
     * Receive a message
     */
    async receiveMessage(message) {
        const agentMessage = {
            id: message.id || (0, uuid_1.v4)(),
            from: message.from || 'unknown',
            to: this.agentId,
            content: message.content || '',
            timestamp: message.timestamp || new Date(),
            read: false,
            channel: message.channel,
            metadata: message.metadata,
        };
        await this.redisService.lpush(`agent:${this.agentId}:inbox:messages:unread`, JSON.stringify(agentMessage));
        this.eventEmitter.emit('agent.message_received', {
            agentId: this.agentId,
            messageId: agentMessage.id,
            from: agentMessage.from,
            timestamp: new Date(),
        });
        await this.recordActivity('message_received', {
            messageId: agentMessage.id,
            from: agentMessage.from,
        });
        return agentMessage;
    }
    /**
     * Get unread messages
     */
    async getUnreadMessages() {
        const messages = await this.redisService.lrange(`agent:${this.agentId}:inbox:messages:unread`, 0, -1);
        return messages.map((m) => JSON.parse(m));
    }
    /**
     * Mark message as read
     */
    async markMessageAsRead(messageId) {
        const unread = await this.getUnreadMessages();
        const message = unread.find((m) => m.id === messageId);
        if (message) {
            // Remove from unread
            await this.redisService.lrem(`agent:${this.agentId}:inbox:messages:unread`, JSON.stringify(message), 1);
            // Add to read
            await this.redisService.lpush(`agent:${this.agentId}:inbox:messages:read`, JSON.stringify({ ...message, read: true, readAt: new Date() }));
            await this.recordActivity('message_read', { messageId });
        }
    }
    // ============ NOTIFICATIONS ============
    /**
     * Send notification to agent
     */
    async sendNotification(notification) {
        const agentNotification = {
            id: notification.id || (0, uuid_1.v4)(),
            type: notification.type || 'info',
            message: notification.message || '',
            priority: notification.priority || 5,
            timestamp: notification.timestamp || new Date(),
            metadata: notification.metadata,
        };
        await this.redisService.lpush(`agent:${this.agentId}:inbox:notifications`, JSON.stringify(agentNotification));
        this.eventEmitter.emit('agent.notification_sent', {
            agentId: this.agentId,
            type: agentNotification.type,
            priority: agentNotification.priority,
            timestamp: new Date(),
        });
        return agentNotification;
    }
    /**
     * Get all notifications
     */
    async getNotifications() {
        const notifications = await this.redisService.lrange(`agent:${this.agentId}:inbox:notifications`, 0, -1);
        return notifications.map((n) => JSON.parse(n));
    }
    // ============ HEARTBEAT INTEGRATION ============
    /**
     * Record activity (for heartbeat monitoring)
     */
    async recordActivity(activityType, metadata) {
        await this.redisService.publish('agent:activity', JSON.stringify({
            agentId: this.agentId,
            activityType,
            metadata,
            timestamp: new Date(),
        }));
    }
    /**
     * Get current task (for heartbeat reporting)
     */
    async getCurrentTask() {
        const inProgress = await this.redisService.lrange(`agent:${this.agentId}:inbox:tasks:in-progress`, 0, 0);
        if (inProgress.length > 0) {
            const task = JSON.parse(inProgress[0]);
            return task.id;
        }
        return undefined;
    }
    /**
     * Get inbox stats
     */
    async getStats() {
        const [pending, inProgress, completed, failed, unreadMessages, notifications] = await Promise.all([
            this.redisService.llen(`agent:${this.agentId}:inbox:tasks:pending`),
            this.redisService.llen(`agent:${this.agentId}:inbox:tasks:in-progress`),
            this.redisService.llen(`agent:${this.agentId}:inbox:tasks:completed`),
            this.redisService.llen(`agent:${this.agentId}:inbox:tasks:failed`),
            this.redisService.llen(`agent:${this.agentId}:inbox:messages:unread`),
            this.redisService.llen(`agent:${this.agentId}:inbox:notifications`),
        ]);
        return {
            pending,
            inProgress,
            completed,
            failed,
            unreadMessages,
            notifications,
        };
    }
    /**
     * Clear completed/failed tasks older than retentionDays
     */
    async cleanup(retentionDays = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        // For now, just trim to last 100 items
        // TODO: Implement date-based cleanup
        await this.redisService.ltrim(`agent:${this.agentId}:inbox:tasks:completed`, 0, 99);
        await this.redisService.ltrim(`agent:${this.agentId}:inbox:tasks:failed`, 0, 99);
        await this.redisService.ltrim(`agent:${this.agentId}:inbox:messages:read`, 0, 99);
    }
};
exports.AgentInbox = AgentInbox;
exports.AgentInbox = AgentInbox = AgentInbox_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [String, infrastructure_1.UnifiedRedisService,
        event_emitter_1.EventEmitter2, Object])
], AgentInbox);
//# sourceMappingURL=AgentInbox.js.map