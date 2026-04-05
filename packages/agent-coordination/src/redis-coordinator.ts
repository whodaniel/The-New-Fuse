import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { A2APriority, AgentStatus } from '@the-new-fuse/a2a-core';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';

import { BroadcastManager } from './broadcast/broadcast-manager';
import { SharedStateManager } from './coordination/shared-state-manager';
import { PresenceTracker } from './presence/presence-tracker';
import { TaskQueueManager } from './queues/task-queue-manager';
import { MessageSerializer } from './serializers/message-serializer';
import { PersistentMetricsCollector, SystemMetrics } from './monitoring/PersistentMetricsCollector';
import { RecoveryManager } from './coordination/RecoveryManager';
import {
  AgentTask,
  CoordinationChannel,
  CoordinationEvent,
  CoordinationMetrics,
  DirectMessage,
  EventListener,
  MessageHandler,
  QueueConfig,
  RedisCoordinatorConfig,
  SerializationFormat,
  SharedState,
  TaskProcessor,
} from './types/coordination.types';

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
@Injectable()
export class RedisCoordinator implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCoordinator.name);
  private readonly keyPrefix: string;
  private readonly serializer: MessageSerializer;
  private readonly presenceTracker: PresenceTracker;
  private taskQueueManager!: TaskQueueManager;
  private readonly broadcastManager: BroadcastManager;
  private readonly sharedStateManager: SharedStateManager;
  private metricsCollector!: PersistentMetricsCollector;
  private recoveryManager!: RecoveryManager;
  private readonly eventListeners: Map<string, Set<EventListener>> = new Map();

  // Legacy in-memory metrics for backward compatibility
  private metrics: CoordinationMetrics = {
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

  constructor(
    private readonly redisService: UnifiedRedisService,
    private readonly config: RedisCoordinatorConfig = {}
  ) {
    this.keyPrefix = config.keyPrefix || 'agent-coord:';
    this.serializer = new MessageSerializer(config.serializationFormat || SerializationFormat.JSON);

    this.presenceTracker = new PresenceTracker(
      redisService,
      {
        keyPrefix: this.keyPrefix,
        heartbeatInterval: config.heartbeatInterval,
        heartbeatTimeout: config.heartbeatTimeout,
      },
      this.serializer
    );

    this.broadcastManager = new BroadcastManager(redisService, this.keyPrefix, this.serializer);

    this.sharedStateManager = new SharedStateManager(redisService, this.keyPrefix, this.serializer);
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing Redis Coordinator...');

    const redisConnection = this.redisService.getClient();

    // Initialize metrics collector
    this.metricsCollector = new PersistentMetricsCollector(
      redisConnection,
      this.keyPrefix + 'metrics:'
    );

    // Initialize task queue manager
    const taskQueueManager = new TaskQueueManager(
      this.redisService,
      this.serializer,
      this.config.queueConfig,
      this.metricsCollector
    );
    (this as any).taskQueueManager = taskQueueManager;

    // Listen for stalled tasks
    taskQueueManager.onTaskStalled((jobId, queueName) => {
      this.logger.warn(`Task ${jobId} stalled in ${queueName}`);
      // Additional stall handling logic can be added here
    });

    // Initialize recovery manager
    this.recoveryManager = new RecoveryManager(
      this.redisService,
      this.presenceTracker,
      this.sharedStateManager,
      this.taskQueueManager,
      this.serializer,
      this.keyPrefix
    );

    this.presenceTracker.startMonitoring();
    this.recoveryManager.startMonitoring();
    await this.setupEventChannels();
    await this.setupPresenceChannels();

    this.logger.log('Redis Coordinator initialized successfully');
  }

  async onModuleDestroy(): Promise<void> {
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
  async registerAgent(agentId: string, metadata?: Record<string, any>): Promise<void> {
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
  async unregisterAgent(agentId: string): Promise<void> {
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
  async updateAgentStatus(agentId: string, status: AgentStatus): Promise<void> {
    await this.presenceTracker.updateStatus(agentId, status);
  }

  /**
   * Check if agent is online
   */
  async isAgentOnline(agentId: string): Promise<boolean> {
    return await this.presenceTracker.isOnline(agentId);
  }

  /**
   * Get all active agents
   */
  async getActiveAgents(): Promise<string[]> {
    const presences = await this.presenceTracker.getActiveAgents();
    return presences.map((p) => p.agentId);
  }

  /**
   * Send direct message to agent
   */
  async sendDirectMessage(
    fromAgent: string,
    toAgent: string,
    payload: any,
    options?: {
      priority?: A2APriority;
      timeout?: number;
      requiresResponse?: boolean;
    }
  ): Promise<void> {
    const message: DirectMessage = {
      id: uuidv4(),
      fromAgent,
      toAgent,
      type: 'DATA_REQUEST' as any,
      payload,
      priority: options?.priority || A2APriority.MEDIUM,
      timestamp: Date.now(),
      requiresResponse: options?.requiresResponse,
    };

    const channel = this.keyPrefix + CoordinationChannel.DIRECT_MESSAGE + ':' + toAgent;
    await this.redisService.publish(channel, this.serializer.serialize(message));

    this.metrics.messagesPublished++;
    this.logger.debug('Direct message sent from ' + fromAgent + ' to ' + toAgent);
  }

  /**
   * Subscribe to direct messages
   */
  async subscribeToDirectMessages(agentId: string, handler: MessageHandler): Promise<void> {
    const channel = CoordinationChannel.DIRECT_MESSAGE;
    await this.broadcastManager.subscribe(channel, handler, agentId);
  }

  /**
   * Broadcast message to all agents
   */
  async broadcast(
    fromAgent: string,
    payload: any,
    options?: {
      topic?: string;
      priority?: A2APriority;
      ttl?: number;
    }
  ): Promise<void> {
    await this.broadcastManager.broadcast(fromAgent, payload, {
      channel: CoordinationChannel.BROADCAST,
      ...options,
    });

    this.metrics.messagesPublished++;
  }

  /**
   * Subscribe to broadcast messages
   */
  async subscribeToBroadcast(handler: MessageHandler, topic?: string): Promise<void> {
    await this.broadcastManager.subscribe(CoordinationChannel.BROADCAST, handler, topic);
  }

  /**
   * Create and assign task to agent
   */
  async createTask(
    task: Omit<AgentTask, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'retryCount'>
  ): Promise<AgentTask> {
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
  async registerTaskProcessor(
    taskType: string,
    processor: TaskProcessor,
    config?: Partial<QueueConfig>
  ): Promise<void> {
    const queueName = 'agent-tasks';
    await this.taskQueueManager.registerProcessor(queueName, processor, config);
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId: string): Promise<AgentTask | null> {
    return await this.taskQueueManager.getTaskStatus('agent-tasks', taskId);
  }

  /**
   * Cancel task
   */
  async cancelTask(taskId: string): Promise<boolean> {
    return await this.taskQueueManager.cancelTask('agent-tasks', taskId);
  }

  /**
   * Set shared state
   */
  async setSharedState(
    key: string,
    value: any,
    ownerId: string,
    ttl?: number
  ): Promise<SharedState> {
    return await this.sharedStateManager.setState(key, value, ownerId, { ttl });
  }

  /**
   * Get shared state
   */
  async getSharedState(key: string): Promise<SharedState | null> {
    return await this.sharedStateManager.getState(key);
  }

  /**
   * Update shared state with locking
   */
  async updateSharedState(
    key: string,
    updater: (currentValue: any) => any,
    ownerId: string
  ): Promise<SharedState | null> {
    return await this.sharedStateManager.updateState(key, updater, ownerId);
  }

  /**
   * Acquire lock on shared state
   */
  async acquireStateLock(key: string, agentId: string, ttl?: number) {
    return await this.sharedStateManager.acquireLock(key, agentId, ttl);
  }

  /**
   * Release lock on shared state
   */
  async releaseStateLock(key: string, lockId: string): Promise<boolean> {
    return await this.sharedStateManager.releaseLock(key, lockId);
  }

  /**
   * Subscribe to coordination events
   */
  async subscribeToEvents(eventType: string, listener: EventListener): Promise<void> {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener);
  }

  /**
   * Publish coordination event
   */
  async publishEvent(event: CoordinationEvent): Promise<void> {
    const channel = this.keyPrefix + CoordinationChannel.EVENTS;
    await this.redisService.publish(channel, this.serializer.serialize(event));

    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          await listener(event);
        } catch (error) {
          this.logger.error('Event listener error:', error);
        }
      }
    }
  }

  /**
   * Get coordination metrics (legacy)
   */
  getMetrics(): CoordinationMetrics {
    return { ...this.metrics };
  }

  /**
   * Get detailed persistent metrics
   */
  async getDetailedMetrics(): Promise<SystemMetrics> {
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
      tasksPerMinute: 0
    };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: string = 'agent-tasks'): Promise<any> {
    return await this.taskQueueManager.getQueueStats(queueName);
  }

  /**
   * Setup event channels
   */
  private async setupEventChannels(): Promise<void> {
    const channel = CoordinationChannel.EVENTS;

    await this.broadcastManager.subscribe(channel, async (message: any) => {
      this.metrics.messagesReceived++;

      const event = message as CoordinationEvent;
      const listeners = this.eventListeners.get(event.type);

      if (listeners) {
        for (const listener of listeners) {
          try {
            await listener(event);
          } catch (error) {
            this.logger.error('Event listener error:', error);
          }
        }
      }
    });
  }

  /**
   * Setup presence channels
   */
  private async setupPresenceChannels(): Promise<void> {
    const channel = CoordinationChannel.PRESENCE;

    await this.broadcastManager.subscribe(channel, async (message: any) => {
      const event = message as CoordinationEvent;

      if (event.type === 'presence:changed' && (event as any).status === AgentStatus.OFFLINE) {
        await this.handleAgentOffline(event.agentId);
      }
    });
  }

  /**
   * Handle agent offline event
   */
  private async handleAgentOffline(agentId: string): Promise<void> {
    this.logger.warn(`Agent ${agentId} is offline. Initiating recovery...`);

    try {
      // Fail tasks assigned to this agent
      const failedCount = await this.taskQueueManager.failTasksForAgent('agent-tasks', agentId, 'Agent went offline');

      if (failedCount > 0) {
        this.logger.log(`Failed ${failedCount} tasks for offline agent ${agentId}`);
      }
    } catch (error) {
      this.logger.error(`Error during offline recovery for agent ${agentId}:`, error);
    }
  }

  /**
   * Access to metrics collector for internal use
   */
  getMetricsCollector(): PersistentMetricsCollector {
    return this.metricsCollector;
  }
}
