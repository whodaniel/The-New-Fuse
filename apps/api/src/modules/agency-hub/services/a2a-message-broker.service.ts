import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { drizzleAuditLogsRepository } from '@the-new-fuse/database';

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
  tenantId?: string;
  organizationId?: string;
  agencyId?: string;
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

  // In-memory message queues (would be Redis in production)
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
    // Cleanup would happen here
  }

  // ==================== CORE MESSAGING ====================

  /**
   * Send a direct message from one agent to another
   */
  async sendMessage(message: Omit<A2AMessage, 'id' | 'timestamp'>): Promise<string> {
    const fullMessage: A2AMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

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

    drizzleAuditLogsRepository
      .create({
        action: 'a2a.message.sent',
        resourceType: 'a2a_message',
        resourceId: fullMessage.id,
        status: 'success',
        details: {
          type: fullMessage.type,
          from: fullMessage.from,
          to: fullMessage.to,
          priority: fullMessage.priority,
        },
        metadata: fullMessage.metadata || {},
      })
      .catch((error) => {
        this.logger.warn(`Failed to write audit log for a2a send: ${error}`);
      });

    return fullMessage.id;
  }

  /**
   * Deliver a direct message to a specific agent
   */
  private async deliverDirectMessage(message: A2AMessage): Promise<void> {
    const queue = this.messageQueues.get(message.to) || [];
    queue.push(message);
    this.messageQueues.set(message.to as string, queue);

    // Check if agent has active subscriptions
    const subs = this.subscriptions.get(message.to as string) || [];
    for (const sub of subs) {
        if (this.matchesFilters(message, sub)) {
          try {
          await sub.handler(message);
          this.metrics.messagesDelivered++;
          drizzleAuditLogsRepository
            .create({
              action: 'a2a.message.delivered',
              resourceType: 'a2a_message',
              resourceId: message.id,
              status: 'success',
              details: {
                type: message.type,
                from: message.from,
                to: message.to,
                channel: sub.channel,
              },
              metadata: message.metadata || {},
            })
            .catch((error) => {
              this.logger.warn(`Failed to write audit log for a2a delivery: ${error}`);
            });
        } catch (error) {
          this.logger.error(`Failed to deliver message ${message.id} to ${message.to}`, error);
          this.metrics.messagesFailed++;
          drizzleAuditLogsRepository
            .create({
              action: 'a2a.message.delivery_failed',
              resourceType: 'a2a_message',
              resourceId: message.id,
              status: 'failure',
              errorMessage: (error as Error).message,
              details: {
                type: message.type,
                from: message.from,
                to: message.to,
                channel: sub.channel,
              },
              metadata: message.metadata || {},
            })
            .catch((logError) => {
              this.logger.warn(`Failed to write audit log for a2a failure: ${logError}`);
            });
        }
      }
    }

    this.eventEmitter.emit('a2a.message.delivered', { message, target: message.to });
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
        if (sub.channel === 'broadcast' && this.matchesFilters(message, sub)) {
          const queue = this.messageQueues.get(agentId) || [];
          queue.push(message);
          this.messageQueues.set(agentId, queue);

          try {
            await sub.handler(message);
            this.metrics.messagesDelivered++;
            drizzleAuditLogsRepository
              .create({
                action: 'a2a.message.broadcast',
                resourceType: 'a2a_message',
                resourceId: message.id,
                status: 'success',
                details: {
                  type: message.type,
                  from: message.from,
                  to: 'broadcast',
                  channel: sub.channel,
                },
                metadata: message.metadata || {},
              })
              .catch((error) => {
                this.logger.warn(`Failed to write audit log for a2a broadcast: ${error}`);
              });
          } catch (error) {
            this.logger.error(`Failed to broadcast message ${message.id} to ${agentId}`, error);
            this.metrics.messagesFailed++;
            drizzleAuditLogsRepository
              .create({
                action: 'a2a.message.broadcast_failed',
                resourceType: 'a2a_message',
                resourceId: message.id,
                status: 'failure',
                errorMessage: (error as Error).message,
                details: {
                  type: message.type,
                  from: message.from,
                  to: agentId,
                  channel: sub.channel,
                },
                metadata: message.metadata || {},
              })
              .catch((logError) => {
                this.logger.warn(`Failed to write audit log for a2a broadcast failure: ${logError}`);
              });
          }
        }
      }
    }

    this.eventEmitter.emit('a2a.message.broadcast', message);
  }

  /**
   * Check if a message matches subscription filters
   */
  private matchesFilters(message: A2AMessage, subscription?: A2ASubscription): boolean {
    const filters = subscription?.filters;
    if (filters) {
      if (filters.types && !filters.types.includes(message.type)) return false;
      if (filters.fromAgents && !filters.fromAgents.includes(message.from)) return false;
      if (filters.priority && !filters.priority.includes(message.priority)) return false;
    }

    const tenantId = subscription?.tenantId;
    const organizationId = subscription?.organizationId;
    const agencyId = subscription?.agencyId;

    if (tenantId && !message.metadata?.tenantId) {
      return false;
    }
    if (tenantId && message.metadata?.tenantId !== tenantId) {
      return false;
    }
    if (organizationId && !message.metadata?.organizationId) {
      return false;
    }
    if (organizationId && message.metadata?.organizationId !== organizationId) {
      return false;
    }
    if (agencyId && !message.metadata?.agencyId) {
      return false;
    }
    if (agencyId && message.metadata?.agencyId !== agencyId) {
      return false;
    }

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

    const requireScope = this.configService.get('A2A_REQUIRE_TENANT_SCOPE') !== 'false';
    const isSystemChannel = ['system', 'broadcast'].includes(subscription.channel);
    if (requireScope && !isSystemChannel) {
      if (!subscription.tenantId && !subscription.organizationId && !subscription.agencyId) {
        const error = new Error(
          'Tenant, organization, or agency scope is required for A2A subscriptions'
        );
        drizzleAuditLogsRepository
          .create({
            action: 'a2a.subscription.rejected',
            resourceType: 'a2a_subscription',
            resourceId: subId,
            status: 'failure',
            errorMessage: error.message,
            details: {
              agentId: subscription.agentId,
              channel: subscription.channel,
            },
          })
          .catch((logError) => {
            this.logger.warn(`Failed to write audit log for a2a reject: ${logError}`);
          });
        throw error;
      }
    }

    const subs = this.subscriptions.get(subscription.agentId) || [];
    subs.push(subscription);
    this.subscriptions.set(subscription.agentId, subs);

    // Register agent presence
    this.agentPresence.set(subscription.agentId, { online: true, lastSeen: new Date() });

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

    drizzleAuditLogsRepository
      .create({
        action: 'a2a.subscription.created',
        resourceType: 'a2a_subscription',
        resourceId: subId,
        status: 'success',
        details: {
          agentId: subscription.agentId,
          channel: subscription.channel,
          tenantId: subscription.tenantId,
          organizationId: subscription.organizationId,
          agencyId: subscription.agencyId,
        },
      })
      .catch((error) => {
        this.logger.warn(`Failed to write audit log for a2a subscription: ${error}`);
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

    drizzleAuditLogsRepository
      .create({
        action: 'a2a.subscription.removed',
        resourceType: 'a2a_subscription',
        resourceId: `${agentId}:${channel}`,
        status: 'success',
        details: {
          agentId,
          channel,
        },
      })
      .catch((error) => {
        this.logger.warn(`Failed to write audit log for a2a unsubscribe: ${error}`);
      });
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
      to: `channel:${channelName}`,
      timestamp: new Date(),
    };

    // Deliver to all channel participants
    for (const participantId of channel.participants) {
      if (participantId !== message.from) {
        const queue = this.messageQueues.get(participantId) || [];
        queue.push(fullMessage);
        this.messageQueues.set(participantId, queue);

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
    const queue = this.messageQueues.get(agentId) || [];
    const messages = queue.splice(0, limit);
    this.messageQueues.set(agentId, queue);
    return messages;
  }

  /**
   * Peek at pending messages without removing them
   */
  async peekMessages(agentId: string, limit: number = 10): Promise<A2AMessage[]> {
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
    this.agentPresence.set(agentId, { online: true, lastSeen: new Date() });

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
    return {
      ...this.metrics,
      onlineAgents: this.getOnlineAgents().length,
      pendingMessages: Array.from(this.messageQueues.values()).reduce(
        (sum, q) => sum + q.length,
        0
      ),
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
      this.cleanupInactiveAgents();
    }, 60000); // Every minute
  }

  private cleanupStaleMessages(): void {
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

  private cleanupInactiveAgents(): void {
    const now = Date.now();
    const timeout = 300000; // 5 minutes

    for (const [agentId, presence] of this.agentPresence.entries()) {
      if (presence.online && now - presence.lastSeen.getTime() > timeout) {
        presence.online = false;
        this.eventEmitter.emit('a2a.agent.timeout', { agentId });
        this.logger.warn(`Agent ${agentId} marked as offline due to inactivity`);
      }
    }
  }
}
