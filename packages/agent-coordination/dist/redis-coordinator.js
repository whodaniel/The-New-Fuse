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
var RedisCoordinator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCoordinator = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const a2a_core_1 = require("@the-new-fuse/a2a-core");
const infrastructure_1 = require("@the-new-fuse/infrastructure");
const broadcast_manager_js_1 = require("./broadcast/broadcast-manager.js");
const RecoveryManager_js_1 = require("./coordination/RecoveryManager.js");
const shared_state_manager_js_1 = require("./coordination/shared-state-manager.js");
const PersistentMetricsCollector_js_1 = require("./monitoring/PersistentMetricsCollector.js");
const presence_tracker_js_1 = require("./presence/presence-tracker.js");
const task_queue_manager_js_1 = require("./queues/task-queue-manager.js");
const message_serializer_js_1 = require("./serializers/message-serializer.js");
const coordination_types_1 = require("./types/coordination.types");
/**
 * Redis-based agent coordination system
 *
 * Provides comprehensive agent-to-agent communication and coordination:
 * - Pub/sub channels for real-time messaging
 * - Task distribution with BullMQ
 * - Agent presence tracking with heartbeat system
 * - Shared state management with optimistic locking
 * - Broadcast messaging for multi-agent coordination
 * - Persistent metrics and failure recovery
 */
let RedisCoordinator = RedisCoordinator_1 = class RedisCoordinator {
    constructor(redisService, config = {}) {
        this.redisService = redisService;
        this.config = config;
        this.logger = new common_1.Logger(RedisCoordinator_1.name);
        this.eventListeners = new Map();
        // Legacy in-memory metrics for backward compatibility
        this.metrics = {
            messagesPublished: 0,
            messagesReceived: 0,
            tasksCreated: 0,
            tasksCompleted: 0,
            tasksFailed: 0,
            activeAgents: 0,
            totalAgents: 0,
            averageTaskDuration: 0,
            averageMessageLatency: 0,
        };
        this.keyPrefix = config.keyPrefix || 'agent-coord:';
        this.serializer = new message_serializer_js_1.MessageSerializer(config.serializationFormat || coordination_types_1.SerializationFormat.JSON);
        this.presenceTracker = new presence_tracker_js_1.PresenceTracker(redisService, {
            keyPrefix: this.keyPrefix,
            heartbeatInterval: config.heartbeatInterval,
            heartbeatTimeout: config.heartbeatTimeout,
        }, this.serializer);
        this.broadcastManager = new broadcast_manager_js_1.BroadcastManager(redisService, this.keyPrefix, this.serializer);
        this.sharedStateManager = new shared_state_manager_js_1.SharedStateManager(redisService, this.keyPrefix, this.serializer);
    }
    async onModuleInit() {
        this.logger.log('Initializing Redis Coordinator...');
        // Initialize metrics collector
        this.metricsCollector = new PersistentMetricsCollector_js_1.PersistentMetricsCollector(this.redisService, this.keyPrefix + 'metrics:');
        // Initialize task queue manager
        const taskQueueManager = new task_queue_manager_js_1.TaskQueueManager(this.redisService, this.serializer, this.config.queueConfig, this.metricsCollector);
        this.taskQueueManager = taskQueueManager;
        // Listen for stalled tasks
        taskQueueManager.onTaskStalled((jobId, queueName) => {
            this.logger.warn(`Task ${jobId} stalled in ${queueName}`);
            // Additional stall handling logic can be added here
        });
        // Initialize recovery manager
        this.recoveryManager = new RecoveryManager_js_1.RecoveryManager(this.redisService, this.presenceTracker, this.sharedStateManager, this.taskQueueManager, this.serializer, this.keyPrefix);
        this.presenceTracker.startMonitoring();
        this.recoveryManager.startMonitoring();
        await this.setupEventChannels();
        await this.setupPresenceChannels();
        this.logger.log('Redis Coordinator initialized successfully');
    }
    async onModuleDestroy() {
        this.logger.log('Shutting down Redis Coordinator...');
        this.presenceTracker.stopMonitoring();
        this.recoveryManager.stopMonitoring();
        await this.broadcastManager.clearAll();
        await this.taskQueueManager.close();
        this.logger.log('Redis Coordinator shut down complete');
    }
    /**
     * Register agent with coordination system
     */
    async registerAgent(agentId, metadata) {
        await this.presenceTracker.registerAgent(agentId, metadata);
        this.metrics.totalAgents++;
        this.metrics.activeAgents++;
        await this.publishEvent({
            type: 'agent:registered',
            agentId,
            data: { metadata },
            timestamp: Date.now(),
        });
    }
    /**
     * Unregister agent from coordination system
     */
    async unregisterAgent(agentId) {
        await this.presenceTracker.unregisterAgent(agentId);
        this.metrics.activeAgents = Math.max(0, this.metrics.activeAgents - 1);
        await this.publishEvent({
            type: 'agent:unregistered',
            agentId,
            data: {},
            timestamp: Date.now(),
        });
        // Trigger immediate recovery for this agent
        await this.recoveryManager.recoverAgent(agentId);
    }
    /**
     * Update agent status
     */
    async updateAgentStatus(agentId, status) {
        await this.presenceTracker.updateStatus(agentId, status);
    }
    /**
     * Check if agent is online
     */
    async isAgentOnline(agentId) {
        return await this.presenceTracker.isOnline(agentId);
    }
    /**
     * Get all active agents
     */
    async getActiveAgents() {
        const presences = await this.presenceTracker.getActiveAgents();
        return presences.map((p) => p.agentId);
    }
    /**
     * Send direct message to agent
     */
    async sendDirectMessage(fromAgent, toAgent, payload, options) {
        const message = {
            id: (0, uuid_1.v4)(),
            fromAgent,
            toAgent,
            type: 'DATA_REQUEST',
            payload,
            priority: options?.priority || a2a_core_1.A2APriority.MEDIUM,
            timestamp: Date.now(),
            requiresResponse: options?.requiresResponse,
        };
        const channel = this.keyPrefix + coordination_types_1.CoordinationChannel.DIRECT_MESSAGE + ':' + toAgent;
        await this.redisService.publish(channel, this.serializer.serialize(message));
        this.metrics.messagesPublished++;
        this.logger.debug('Direct message sent from ' + fromAgent + ' to ' + toAgent);
    }
    /**
     * Subscribe to direct messages
     */
    async subscribeToDirectMessages(agentId, handler) {
        const channel = coordination_types_1.CoordinationChannel.DIRECT_MESSAGE;
        await this.broadcastManager.subscribe(channel, handler, agentId);
    }
    /**
     * Broadcast message to all agents
     */
    async broadcast(fromAgent, payload, options) {
        await this.broadcastManager.broadcast(fromAgent, payload, {
            channel: coordination_types_1.CoordinationChannel.BROADCAST,
            ...options,
        });
        this.metrics.messagesPublished++;
    }
    /**
     * Subscribe to broadcast messages
     */
    async subscribeToBroadcast(handler, topic) {
        await this.broadcastManager.subscribe(coordination_types_1.CoordinationChannel.BROADCAST, handler, topic);
    }
    /**
     * Create and assign task to agent
     */
    async createTask(task) {
        const queueName = 'agent-tasks';
        const createdTask = await this.taskQueueManager.addTask(queueName, task);
        this.metrics.tasksCreated++;
        // Record to persistent metrics
        if (this.metricsCollector) {
            await this.metricsCollector.recordTaskCreated(createdTask);
        }
        await this.publishEvent({
            type: 'task:created',
            agentId: task.assignedBy,
            data: createdTask,
            timestamp: Date.now(),
        });
        return createdTask;
    }
    /**
     * Register task processor
     */
    async registerTaskProcessor(taskType, processor, config) {
        const queueName = 'agent-tasks';
        await this.taskQueueManager.registerProcessor(queueName, processor, config);
    }
    /**
     * Get task status
     */
    async getTaskStatus(taskId) {
        return await this.taskQueueManager.getTaskStatus('agent-tasks', taskId);
    }
    /**
     * Cancel task
     */
    async cancelTask(taskId) {
        return await this.taskQueueManager.cancelTask('agent-tasks', taskId);
    }
    /**
     * Set shared state
     */
    async setSharedState(key, value, ownerId, ttl) {
        return await this.sharedStateManager.setState(key, value, ownerId, { ttl });
    }
    /**
     * Get shared state
     */
    async getSharedState(key) {
        return await this.sharedStateManager.getState(key);
    }
    /**
     * Update shared state with locking
     */
    async updateSharedState(key, updater, ownerId) {
        return await this.sharedStateManager.updateState(key, updater, ownerId);
    }
    /**
     * Acquire lock on shared state
     */
    async acquireStateLock(key, agentId, ttl) {
        return await this.sharedStateManager.acquireLock(key, agentId, ttl);
    }
    /**
     * Release lock on shared state
     */
    async releaseStateLock(key, lockId) {
        return await this.sharedStateManager.releaseLock(key, lockId);
    }
    /**
     * Subscribe to coordination events
     */
    async subscribeToEvents(eventType, listener) {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, new Set());
        }
        this.eventListeners.get(eventType).add(listener);
    }
    /**
     * Publish coordination event
     */
    async publishEvent(event) {
        const channel = this.keyPrefix + coordination_types_1.CoordinationChannel.EVENTS;
        await this.redisService.publish(channel, this.serializer.serialize(event));
        const listeners = this.eventListeners.get(event.type);
        if (listeners) {
            for (const listener of listeners) {
                try {
                    await listener(event);
                }
                catch (error) {
                    this.logger.error('Event listener error:', error);
                }
            }
        }
    }
    /**
     * Get coordination metrics (legacy)
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Get detailed persistent metrics
     */
    async getDetailedMetrics() {
        if (this.metricsCollector) {
            const metrics = await this.metricsCollector.getSystemMetrics();
            // Supplement with active agents from PresenceTracker
            const activeAgents = await this.getActiveAgents();
            metrics.activeAgents = activeAgents.length;
            return metrics;
        }
        return {
            totalTasksCreated: 0,
            totalTasksCompleted: 0,
            totalTasksFailed: 0,
            activeAgents: 0,
            averageExecutionTime: 0,
            tasksPerMinute: 0,
        };
    }
    /**
     * Get queue statistics
     */
    async getQueueStats(queueName = 'agent-tasks') {
        return await this.taskQueueManager.getQueueStats(queueName);
    }
    /**
     * Setup event channels
     */
    async setupEventChannels() {
        const channel = coordination_types_1.CoordinationChannel.EVENTS;
        await this.broadcastManager.subscribe(channel, async (message) => {
            this.metrics.messagesReceived++;
            const event = message;
            const listeners = this.eventListeners.get(event.type);
            if (listeners) {
                for (const listener of listeners) {
                    try {
                        await listener(event);
                    }
                    catch (error) {
                        this.logger.error('Event listener error:', error);
                    }
                }
            }
        });
    }
    /**
     * Setup presence channels
     */
    async setupPresenceChannels() {
        const channel = coordination_types_1.CoordinationChannel.PRESENCE;
        await this.broadcastManager.subscribe(channel, async (message) => {
            const event = message;
            if (event.type === 'presence:changed' && event.status === a2a_core_1.AgentStatus.OFFLINE) {
                await this.handleAgentOffline(event.agentId);
            }
        });
    }
    /**
     * Handle agent offline event
     */
    async handleAgentOffline(agentId) {
        this.logger.warn(`Agent ${agentId} is offline. Initiating recovery...`);
        try {
            // Fail tasks assigned to this agent
            const failedCount = await this.taskQueueManager.failTasksForAgent('agent-tasks', agentId, 'Agent went offline');
            if (failedCount > 0) {
                this.logger.log(`Failed ${failedCount} tasks for offline agent ${agentId}`);
            }
        }
        catch (error) {
            this.logger.error(`Error during offline recovery for agent ${agentId}:`, error);
        }
    }
    /**
     * Access to metrics collector for internal use
     */
    getMetricsCollector() {
        return this.metricsCollector;
    }
};
exports.RedisCoordinator = RedisCoordinator;
exports.RedisCoordinator = RedisCoordinator = RedisCoordinator_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [infrastructure_1.UnifiedRedisService, Object])
], RedisCoordinator);
//# sourceMappingURL=redis-coordinator.js.map