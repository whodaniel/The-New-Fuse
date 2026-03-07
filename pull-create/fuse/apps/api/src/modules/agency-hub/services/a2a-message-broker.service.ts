import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';

/**
 * A2A Message Types
 */
export enum A2AMessageType {
  // Agent Communication
  DIRECT_MESSAGE = 'DIRECT_MESSAGE',
  BROADCAST = 'BROADCAST',

  // Task Coordination
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_FAILED = 'TASK_FAILED',
  TASK_PROGRESS = 'TASK_PROGRESS',

  // System Events
  AGENT_ONLINE = 'AGENT_ONLINE',
  AGENT_OFFLINE = 'AGENT_OFFLINE',
  HEARTBEAT = 'HEARTBEAT',

  // Conversation
  CONVERSATION_START = 'CONVERSATION_START',
  CONVERSATION_MESSAGE = 'CONVERSATION_MESSAGE',
  CONVERSATION_END = 'CONVERSATION_END',

  // Self-Improvement
  PROMPT_UPDATE_REQUEST = 'PROMPT_UPDATE_REQUEST',
  PROMPT_UPDATED = 'PROMPT_UPDATED',
  CAPABILITY_ANNOUNCEMENT = 'CAPABILITY_ANNOUNCEMENT',
}

export enum A2APriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface A2AMessage {
  id: string;
  type: A2AMessageType;
  from: string;
  to: string | 'broadcast';
  payload: any;
  priority: A2APriority;
  timestamp: Date;
  correlationId?: string;
  replyTo?: string;
  ttl?: number;
  metadata?: Record<string, any>;
}

export interface A2AChannel {
  id: string;
  name: string;
  participants: string[];
  createdAt: Date;
  lastActivity: Date;
  messageCount: number;
}

export interface A2ASubscription {
  agentId: string;
  channel: string;
  handler: (message: A2AMessage) => Promise<void>;
  filters?: {
    types?: A2AMessageType[];
    fromAgents?: string[];
    priority?: A2APriority[];
  };
}

/**
 * A2A Message Broker Service
 *
 * The third pillar of the TNF Agent system:
 * 1. Orchestrator - Task management and swarm coordination
 * 2. Heartbeat - Chronological routines and health monitoring
 * 3. Message Broker - Inter-agent communication (THIS SERVICE)
 *
 * Provides:
 * - Direct agent-to-agent messaging
 * - Broadcast messaging
 * - Channel-based pub/sub
 * - Message routing and filtering
 * - Conversation management
 * - Event-driven communication
 */
@Injectable()
export class A2AMessageBrokerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(A2AMessageBrokerService.name);
  private redis: Redis | null = null;
  private redisReady = false;
  private readonly redisPrefix = 'tnf:a2a:broker:';
  private readonly defaultMessageTtlMs = 3600000; // 1 hour
  private readonly heartbeatTtlMs = 90000; // 90 seconds
  private readonly stallTimeoutMs = 120000; // 2 minutes
  private localGlobalSequence = 0;
  private localConversationSequences = new Map<string, number>();
  private agentStallState = new Map<string, { stalledSince: Date; lastEscalatedAt: Date }>();

  // In-memory queues remain as degraded-mode fallback if Redis is unavailable.
  private messageQueues = new Map<string, A2AMessage[]>();
  private channels = new Map<string, A2AChannel>();
  private subscriptions = new Map<string, A2ASubscription[]>();
  private agentPresence = new Map<string, { online: boolean; lastSeen: Date }>();

  // Metrics
  private metrics = {
    messagesSent: 0,
    messagesDelivered: 0,
    messagesFailed: 0,
    activeChannels: 0,
    activeSubscriptions: 0,
  };

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    this.logger.log('A2A Message Broker initializing...');
    await this.initializeRedis();

    // Create default system channels
    await this.createChannel('system', ['system']);
    await this.createChannel('broadcast', []);
    await this.createChannel('tasks', []);
    await this.createChannel('self-improvement', []);

    // Start cleanup interval
    this.startCleanupInterval();

    this.logger.log('A2A Message Broker initialized with default channels');
  }

  async onModuleDestroy() {
    this.logger.log('A2A Message Broker shutting down...');
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
    this.redisReady = false;
  }

  // ==================== CORE MESSAGING ====================

  /**
   * Send a direct message from one agent to another
   */
  async sendMessage(message: Omit<A2AMessage, 'id' | 'timestamp'>): Promise<string> {
    const fullMessage: A2AMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      priority: this.normalizePriority(message.priority),
      timestamp: new Date(),
    };
    await this.attachSequencingMetadata(fullMessage);
    await this.recordMessagePresence(fullMessage);

    this.logger.log(
      `Message ${fullMessage.id}: ${fullMessage.from} -> ${fullMessage.to} [${fullMessage.type}]`
    );

    if (fullMessage.to === 'broadcast') {
      await this.broadcastMessage(fullMessage);
    } else {
      await this.deliverDirectMessage(fullMessage);
    }

    this.metrics.messagesSent++;

    // Emit event for other services to react
    this.eventEmitter.emit('a2a.message.sent', fullMessage);

    return fullMessage.id;
  }

  /**
   * Deliver a direct message to a specific agent
   */
  private async deliverDirectMessage(message: A2AMessage): Promise<void> {
    const targetAgentId = String(message.to);
    await this.enqueueForAgent(targetAgentId, message);

    // Check if agent has active subscriptions
    const subs = this.subscriptions.get(targetAgentId) || [];
    for (const sub of subs) {
      if (this.matchesFilters(message, sub.filters)) {
        try {
          await sub.handler(message);
          this.metrics.messagesDelivered++;
        } catch (error) {
          this.logger.error(`Failed to deliver message ${message.id} to ${targetAgentId}`, error);
          this.metrics.messagesFailed++;
        }
      }
    }

    this.eventEmitter.emit('a2a.message.delivered', { message, target: targetAgentId });
  }

  /**
   * Broadcast a message to all subscribed agents
   */
  private async broadcastMessage(message: A2AMessage): Promise<void> {
    const channel = this.channels.get('broadcast');
    if (!channel) return;

    // Deliver to all agents with broadcast subscriptions
    for (const [agentId, subs] of this.subscriptions.entries()) {
      for (const sub of subs) {
        if (sub.channel === 'broadcast' && this.matchesFilters(message, sub.filters)) {
          await this.enqueueForAgent(agentId, message);

          try {
            await sub.handler(message);
            this.metrics.messagesDelivered++;
          } catch (error) {
            this.logger.error(`Failed to broadcast message ${message.id} to ${agentId}`, error);
            this.metrics.messagesFailed++;
          }
        }
      }
    }

    this.eventEmitter.emit('a2a.message.broadcast', message);
  }

  /**
   * Check if a message matches subscription filters
   */
  private matchesFilters(message: A2AMessage, filters?: A2ASubscription['filters']): boolean {
    if (!filters) return true;

    if (filters.types && !filters.types.includes(message.type)) return false;
    if (filters.fromAgents && !filters.fromAgents.includes(message.from)) return false;
    if (filters.priority && !filters.priority.includes(message.priority)) return false;

    return true;
  }

  // ==================== SUBSCRIPTIONS ====================

  /**
   * Subscribe an agent to receive messages
   */
  async subscribe(
    subscription: Omit<A2ASubscription, 'handler'> & {
      handler: (message: A2AMessage) => Promise<void>;
    }
  ): Promise<string> {
    const subId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const subs = this.subscriptions.get(subscription.agentId) || [];
    subs.push(subscription);
    this.subscriptions.set(subscription.agentId, subs);

    // Register agent presence
    await this.touchPresence(subscription.agentId, false);

    // Add to channel participants
    const channel = this.channels.get(subscription.channel);
    if (channel && !channel.participants.includes(subscription.agentId)) {
      channel.participants.push(subscription.agentId);
    }

    this.metrics.activeSubscriptions++;

    this.logger.log(`Agent ${subscription.agentId} subscribed to channel: ${subscription.channel}`);

    this.eventEmitter.emit('a2a.subscription.created', {
      agentId: subscription.agentId,
      channel: subscription.channel,
    });

    return subId;
  }

  /**
   * Unsubscribe an agent from a channel
   */
  async unsubscribe(agentId: string, channel: string): Promise<void> {
    const subs = this.subscriptions.get(agentId) || [];
    const filtered = subs.filter((s) => s.channel !== channel);

    if (filtered.length === 0) {
      this.subscriptions.delete(agentId);
    } else {
      this.subscriptions.set(agentId, filtered);
    }

    // Remove from channel participants
    const ch = this.channels.get(channel);
    if (ch) {
      ch.participants = ch.participants.filter((p) => p !== agentId);
    }

    this.metrics.activeSubscriptions--;

    this.logger.log(`Agent ${agentId} unsubscribed from channel: ${channel}`);

    this.eventEmitter.emit('a2a.subscription.removed', { agentId, channel });
  }

  // ==================== CHANNELS ====================

  /**
   * Create a new communication channel
   */
  async createChannel(name: string, initialParticipants: string[] = []): Promise<A2AChannel> {
    const channel: A2AChannel = {
      id: `channel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      participants: initialParticipants,
      createdAt: new Date(),
      lastActivity: new Date(),
      messageCount: 0,
    };

    this.channels.set(name, channel);
    this.metrics.activeChannels++;

    this.logger.log(`Channel created: ${name}`);

    this.eventEmitter.emit('a2a.channel.created', channel);

    return channel;
  }

  /**
   * Send a message to a specific channel
   */
  async sendToChannel(
    channelName: string,
    message: Omit<A2AMessage, 'id' | 'timestamp' | 'to'>
  ): Promise<string> {
    const channel = this.channels.get(channelName);
    if (!channel) {
      throw new Error(`Channel ${channelName} does not exist`);
    }

    const fullMessage: A2AMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      priority: this.normalizePriority(message.priority),
      to: `channel:${channelName}`,
      timestamp: new Date(),
    };
    await this.attachSequencingMetadata(fullMessage);
    await this.recordMessagePresence(fullMessage);

    // Deliver to all channel participants
    for (const participantId of channel.participants) {
      if (participantId !== message.from) {
        await this.enqueueForAgent(participantId, fullMessage);

        // Trigger handlers
        const subs = this.subscriptions.get(participantId) || [];
        for (const sub of subs) {
          if (sub.channel === channelName && this.matchesFilters(fullMessage, sub.filters)) {
            try {
              await sub.handler(fullMessage);
              this.metrics.messagesDelivered++;
            } catch (error) {
              this.logger.error(`Failed to deliver channel message to ${participantId}`, error);
              this.metrics.messagesFailed++;
            }
          }
        }
      }
    }

    channel.lastActivity = new Date();
    channel.messageCount++;
    this.metrics.messagesSent++;

    this.eventEmitter.emit('a2a.channel.message', { channel: channelName, message: fullMessage });

    return fullMessage.id;
  }

  /**
   * Join an existing channel
   */
  async joinChannel(agentId: string, channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    if (!channel) {
      throw new Error(`Channel ${channelName} does not exist`);
    }

    if (!channel.participants.includes(agentId)) {
      channel.participants.push(agentId);

      // Notify other participants
      await this.sendToChannel(channelName, {
        type: A2AMessageType.AGENT_ONLINE,
        from: 'system',
        payload: { agentId, action: 'joined' },
        priority: A2APriority.LOW,
      });

      this.logger.log(`Agent ${agentId} joined channel: ${channelName}`);
    }
  }

  /**
   * Leave a channel
   */
  async leaveChannel(agentId: string, channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    if (!channel) return;

    channel.participants = channel.participants.filter((p) => p !== agentId);

    // Notify other participants
    await this.sendToChannel(channelName, {
      type: A2AMessageType.AGENT_OFFLINE,
      from: 'system',
      payload: { agentId, action: 'left' },
      priority: A2APriority.LOW,
    });

    this.logger.log(`Agent ${agentId} left channel: ${channelName}`);
  }

  // ==================== MESSAGE RETRIEVAL ====================

  /**
   * Get pending messages for an agent
   */
  async getPendingMessages(agentId: string, limit: number = 50): Promise<A2AMessage[]> {
    if (this.redisReady && this.redis) {
      const queueKey = this.getQueueKey(agentId);
      const ids = await this.redis.zrange(queueKey, 0, Math.max(limit - 1, 0));
      if (ids.length === 0) {
        return [];
      }

      const messages: A2AMessage[] = [];
      const nowMs = Date.now();

      for (const id of ids) {
        const raw = await this.redis.get(this.getMessageKey(id));
        await this.redis.zrem(queueKey, id);
        if (!raw) {
          continue;
        }

        try {
          const message = this.deserializeMessage(raw);
          const ttlMs = message.ttl || this.defaultMessageTtlMs;
          if (nowMs - message.timestamp.getTime() <= ttlMs) {
            messages.push(message);
          }
        } catch {
          // ignore malformed records
        }
      }

      return messages;
    }

    const queue = this.messageQueues.get(agentId) || [];
    const messages = queue.splice(0, limit);
    this.messageQueues.set(agentId, queue);
    return messages;
  }

  /**
   * Peek at pending messages without removing them
   */
  async peekMessages(agentId: string, limit: number = 10): Promise<A2AMessage[]> {
    if (this.redisReady && this.redis) {
      const queueKey = this.getQueueKey(agentId);
      const ids = await this.redis.zrange(queueKey, 0, Math.max(limit - 1, 0));
      if (ids.length === 0) {
        return [];
      }

      const messages: A2AMessage[] = [];
      const nowMs = Date.now();

      for (const id of ids) {
        const raw = await this.redis.get(this.getMessageKey(id));
        if (!raw) {
          continue;
        }

        try {
          const message = this.deserializeMessage(raw);
          const ttlMs = message.ttl || this.defaultMessageTtlMs;
          if (nowMs - message.timestamp.getTime() <= ttlMs) {
            messages.push(message);
          }
        } catch {
          // ignore malformed records
        }
      }

      return messages;
    }

    const queue = this.messageQueues.get(agentId) || [];
    return queue.slice(0, limit);
  }

  // ==================== CONVERSATIONS ====================

  /**
   * Start a conversation between agents
   */
  async startConversation(
    initiatorId: string,
    participantIds: string[],
    topic?: string
  ): Promise<string> {
    const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const channelName = `conversation:${conversationId}`;

    // Create a private channel for the conversation
    await this.createChannel(channelName, [initiatorId, ...participantIds]);

    // Notify all participants
    for (const participantId of participantIds) {
      await this.sendMessage({
        type: A2AMessageType.CONVERSATION_START,
        from: initiatorId,
        to: participantId,
        payload: { conversationId, topic, participants: [initiatorId, ...participantIds] },
        priority: A2APriority.MEDIUM,
        correlationId: conversationId,
      });
    }

    this.logger.log(
      `Conversation started: ${conversationId} with ${participantIds.length + 1} participants`
    );

    return conversationId;
  }

  /**
   * Send a message in a conversation
   */
  async sendConversationMessage(
    conversationId: string,
    fromAgent: string,
    content: any
  ): Promise<string> {
    const channelName = `conversation:${conversationId}`;

    return this.sendToChannel(channelName, {
      type: A2AMessageType.CONVERSATION_MESSAGE,
      from: fromAgent,
      payload: { content },
      priority: A2APriority.MEDIUM,
      correlationId: conversationId,
    });
  }

  // ==================== PRESENCE ====================

  /**
   * Register agent as online
   */
  async registerPresence(agentId: string): Promise<void> {
    await this.touchPresence(agentId, true);

    // Broadcast presence to others
    await this.sendMessage({
      type: A2AMessageType.AGENT_ONLINE,
      from: agentId,
      to: 'broadcast',
      payload: { agentId },
      priority: A2APriority.LOW,
    });

    this.logger.log(`Agent ${agentId} is now online`);
  }

  /**
   * Unregister agent (mark as offline)
   */
  async unregisterPresence(agentId: string): Promise<void> {
    const presence = this.agentPresence.get(agentId);
    if (presence) {
      presence.online = false;
      presence.lastSeen = new Date();
    }

    // Broadcast offline status
    await this.sendMessage({
      type: A2AMessageType.AGENT_OFFLINE,
      from: agentId,
      to: 'broadcast',
      payload: { agentId },
      priority: A2APriority.LOW,
    });

    this.logger.log(`Agent ${agentId} is now offline`);
  }

  /**
   * Get list of online agents
   */
  getOnlineAgents(): string[] {
    const online: string[] = [];
    for (const [agentId, presence] of this.agentPresence.entries()) {
      if (presence.online) {
        online.push(agentId);
      }
    }
    return online;
  }

  // ==================== METRICS & STATUS ====================

  /**
   * Get broker metrics
   */
  getMetrics() {
    const inMemoryPending = Array.from(this.messageQueues.values()).reduce(
      (sum, q) => sum + q.length,
      0
    );
    return {
      ...this.metrics,
      onlineAgents: this.getOnlineAgents().length,
      pendingMessages: inMemoryPending,
      queueBackend: this.redisReady ? 'redis' : 'memory',
      channels: Array.from(this.channels.keys()),
    };
  }

  /**
   * Get broker status
   */
  getStatus() {
    return {
      status: 'online',
      metrics: this.getMetrics(),
      channels: Array.from(this.channels.values()).map((c) => ({
        name: c.name,
        participants: c.participants.length,
        messageCount: c.messageCount,
        lastActivity: c.lastActivity,
      })),
      onlineAgents: this.getOnlineAgents(),
    };
  }

  // ==================== CLEANUP ====================

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupStaleMessages();
      void this.cleanupInactiveAgents();
    }, 60000); // Every minute
  }

  private cleanupStaleMessages(): void {
    if (this.redisReady && this.redis) {
      return;
    }

    const now = Date.now();
    for (const [agentId, queue] of this.messageQueues.entries()) {
      const filtered = queue.filter((msg) => {
        const age = now - msg.timestamp.getTime();
        const ttl = msg.ttl || 3600000; // Default 1 hour
        return age < ttl;
      });

      if (filtered.length < queue.length) {
        this.messageQueues.set(agentId, filtered);
        this.logger.debug(
          `Cleaned ${queue.length - filtered.length} stale messages for ${agentId}`
        );
      }
    }
  }

  private async initializeRedis(): Promise<void> {
    const redisUrl =
      this.configService.get<string>('REDIS_URL') ||
      'redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570';
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: false,
    });

    this.redis.on('error', (error: Error) => {
      this.redisReady = false;
      this.logger.warn(`Redis broker degraded: ${error.message}`);
    });

    try {
      await this.redis.ping();
      this.redisReady = true;
      this.logger.log('A2A broker Redis backend enabled');
    } catch (error) {
      this.redisReady = false;
      this.logger.warn('A2A broker running in memory fallback mode');
    }
  }

  private getQueueKey(agentId: string): string {
    return `${this.redisPrefix}queue:${agentId}`;
  }

  private getMessageKey(messageId: string): string {
    return `${this.redisPrefix}msg:${messageId}`;
  }

  private getHeartbeatKey(agentId: string): string {
    return `${this.redisPrefix}heartbeat:${agentId}`;
  }

  private normalizePriority(priority: unknown): A2APriority {
    const value = String(priority ?? A2APriority.MEDIUM)
      .trim()
      .toLowerCase();
    switch (value) {
      // Legacy aliases observed across TNF packages
      case 'urgent':
      case 'p0':
      case 'critical':
        return A2APriority.CRITICAL;
      case 'high':
      case 'p1':
        return A2APriority.HIGH;
      case 'normal':
      case 'medium':
      case 'p2':
        return A2APriority.MEDIUM;
      case 'low':
      case 'p3':
      default:
        return A2APriority.LOW;
    }
  }

  private async recordMessagePresence(message: A2AMessage): Promise<void> {
    // Any message updates the sender's liveliness; explicit heartbeat also refreshes strongly.
    await this.touchPresence(message.from, message.type === A2AMessageType.HEARTBEAT);
  }

  private async touchPresence(agentId: string, isHeartbeat: boolean = false): Promise<void> {
    const now = new Date();
    this.agentPresence.set(agentId, { online: true, lastSeen: now });

    const previous = this.agentStallState.get(agentId);
    if (previous) {
      this.agentStallState.delete(agentId);
      this.eventEmitter.emit('a2a.agent.recovered', {
        agentId,
        stalledSince: previous.stalledSince,
        recoveredAt: now,
      });
    }

    if (this.redisReady && this.redis) {
      try {
        const ttl = isHeartbeat ? this.heartbeatTtlMs : Math.floor(this.heartbeatTtlMs * 0.75);
        await this.redis.set(this.getHeartbeatKey(agentId), String(now.getTime()), 'PX', ttl);
      } catch (error) {
        this.logger.debug(
          `Failed to persist heartbeat for ${agentId}: ${(error as Error).message}`
        );
      }
    }
  }

  private mapPriority(priority: A2APriority): number {
    switch (priority) {
      case A2APriority.CRITICAL:
        return 1;
      case A2APriority.HIGH:
        return 2;
      case A2APriority.MEDIUM:
        return 3;
      case A2APriority.LOW:
      default:
        return 4;
    }
  }

  private toScore(priority: A2APriority, sequence: number): number {
    // Lower score is higher dispatch priority. Sequence preserves FIFO within each priority tier.
    return this.mapPriority(priority) * 1_000_000_000_000 + sequence;
  }

  private deserializeMessage(raw: string): A2AMessage {
    const parsed = JSON.parse(raw) as A2AMessage;
    parsed.timestamp = new Date(parsed.timestamp);
    return parsed;
  }

  private async attachSequencingMetadata(message: A2AMessage): Promise<void> {
    if (!this.redisReady || !this.redis) {
      const correlationId = message.correlationId || 'none';
      this.localGlobalSequence += 1;
      const conversationSequence = (this.localConversationSequences.get(correlationId) || 0) + 1;
      this.localConversationSequences.set(correlationId, conversationSequence);
      const metadata = message.metadata || {};
      message.metadata = {
        ...metadata,
        broker: {
          globalSequence: this.localGlobalSequence,
          conversationSequence,
          queuedAt: Date.now(),
          clockSource: 'local',
        },
      };
      return;
    }

    const globalSeq = await this.redis.incr(`${this.redisPrefix}seq:global`);
    const correlationId = message.correlationId || 'none';
    const convSeq = await this.redis.incr(`${this.redisPrefix}seq:conversation:${correlationId}`);
    let clockMs = Date.now();
    try {
      const redisTime = await this.redis.time();
      if (Array.isArray(redisTime) && redisTime.length >= 2) {
        clockMs = Number(redisTime[0]) * 1000 + Math.floor(Number(redisTime[1]) / 1000);
      }
    } catch {
      // fall back to local clock when Redis TIME cannot be read
    }
    const metadata = message.metadata || {};
    message.metadata = {
      ...metadata,
      broker: {
        globalSequence: globalSeq,
        conversationSequence: convSeq,
        queuedAt: clockMs,
        clockSource: 'redis',
      },
    };
  }

  private async enqueueForAgent(agentId: string, message: A2AMessage): Promise<void> {
    if (this.redisReady && this.redis) {
      const queueKey = this.getQueueKey(agentId);
      const messageKey = this.getMessageKey(message.id);
      const sequence = Number(message.metadata?.broker?.globalSequence || Date.now());
      const score = this.toScore(message.priority, sequence);
      const ttlMs = message.ttl || this.defaultMessageTtlMs;

      const pipeline = this.redis.pipeline();
      pipeline.set(messageKey, JSON.stringify(message), 'PX', ttlMs);
      pipeline.zadd(queueKey, score, message.id);
      pipeline.pexpire(queueKey, ttlMs);
      await pipeline.exec();
      return;
    }

    const queue = this.messageQueues.get(agentId) || [];
    queue.push(message);
    this.messageQueues.set(agentId, queue);
  }

  private async cleanupInactiveAgents(): Promise<void> {
    const now = Date.now();
    const timeout = 300000; // 5 minutes hard-offline threshold

    for (const [agentId, presence] of this.agentPresence.entries()) {
      const elapsed = now - presence.lastSeen.getTime();
      let redisRecentlySeen = false;

      if (this.redisReady && this.redis) {
        try {
          const exists = await this.redis.exists(this.getHeartbeatKey(agentId));
          redisRecentlySeen = exists === 1;
        } catch {
          redisRecentlySeen = false;
        }
      }

      if (presence.online && !redisRecentlySeen && elapsed > this.stallTimeoutMs) {
        const state = this.agentStallState.get(agentId);
        const firstSeen = state?.stalledSince || new Date(now - elapsed);
        const shouldEscalate = !state || now - state.lastEscalatedAt.getTime() >= 60000;
        if (shouldEscalate) {
          this.agentStallState.set(agentId, {
            stalledSince: firstSeen,
            lastEscalatedAt: new Date(now),
          });
          this.eventEmitter.emit('a2a.agent.stalled', {
            agentId,
            stalledForMs: elapsed,
            stalledSince: firstSeen,
            priority: elapsed > timeout ? A2APriority.CRITICAL : A2APriority.HIGH,
            orchestrationHint: 'director_broker_escalation',
          });
        }
      }

      if (presence.online && !redisRecentlySeen && elapsed > timeout) {
        presence.online = false;
        this.eventEmitter.emit('a2a.agent.timeout', { agentId });
        this.logger.warn(`Agent ${agentId} marked as offline due to inactivity`);
      }
    }
  }
}
