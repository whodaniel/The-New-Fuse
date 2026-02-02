/**
 * Enhanced Redis Agent Client for TNF CLI
 *
 * Features:
 * - A2A Protocol compliance
 * - Message reliability (ACK/NACK, retry logic)
 * - Circuit breaker pattern
 * - Structured logging with trace IDs
 * - Task management integration
 */

import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { CircuitBreaker, getCircuitBreakerRegistry } from './circuit-breaker.js';
import { ConfigManager } from './config.js';
import { Logger, createLogger } from './logger.js';
import { TaskManager } from './task-manager.js';
import {
  AgentCard,
  AgentInfo,
  AgentMessage,
  AgentPlatform,
  AgentRole,
  CLIConfig,
  MessageAck,
  Task,
  TaskCreateRequest,
} from './types.js';

export { AgentInfo, AgentMessage };

export const CONFIG = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    keyPrefix: 'tnf:',
  },
  channels: {
    agents: 'tnf:agents',
    conversations: 'tnf:conversations',
    orchestrator: 'tnf:orchestrator',
    broker: 'tnf:broker',
    heartbeat: 'tnf:heartbeat',
    acks: 'tnf:acks',
    deadLetter: 'tnf:deadletter',
  },
  heartbeatInterval: 30000, // 30 seconds
};

interface PendingMessage {
  message: AgentMessage;
  resolve: (value: MessageAck) => void;
  reject: (reason: any) => void;
  retries: number;
  timeout: NodeJS.Timeout;
}

export class RedisAgentClient {
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;
  private agentInfo: AgentInfo | null = null;
  private config: CLIConfig;
  private logger: Logger;
  private messageHandlers: Map<string, Array<(message: AgentMessage, channel: string) => void>> =
    new Map();
  private heartbeatTimer: NodeJS.Timeout | null = null;
  public currentConversation: string | null = null;

  // Reliability features
  private pendingMessages: Map<string, PendingMessage> = new Map();
  private circuitBreaker: CircuitBreaker;

  // Task management
  public taskManager: TaskManager;

  // Agent Card
  private agentCard?: AgentCard;

  constructor(config?: CLIConfig) {
    this.config = config || new ConfigManager().getConfig();
    this.logger = createLogger(this.config.logging);
    this.circuitBreaker = getCircuitBreakerRegistry().create('redis-client', {
      failureThreshold: 5,
      successThreshold: 3,
      timeoutMs: 60000,
      halfOpenMaxCalls: 3,
    });
    this.taskManager = new TaskManager(this.logger);
  }

  async initialize(): Promise<void> {
    await this.circuitBreaker.execute(async () => {
      const redisConfig = {
        host: this.config.redis.host,
        port: this.config.redis.port,
        password: this.config.redis.password,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          this.logger.debug(`Redis retry attempt ${times}, delay ${delay}ms`);
          return delay;
        },
        maxRetriesPerRequest: this.config.reliability.maxRetries,
        enableReadyCheck: true,
        enableOfflineQueue: true,
      };

      // Add TLS if configured
      if (this.config.redis.tls?.enabled) {
        (redisConfig as any).tls = {
          ca: this.config.redis.tls.ca,
          cert: this.config.redis.tls.cert,
          key: this.config.redis.tls.key,
        };
      }

      this.publisher = new Redis(redisConfig);
      this.subscriber = new Redis(redisConfig);

      this.subscriber.on('message', (channel: string, message: string) => {
        this.handleIncomingMessage(channel, message);
      });

      this.subscriber.on('error', (error: Error) => {
        this.logger.error('Redis subscriber error', {}, error);
      });

      this.publisher.on('error', (error: Error) => {
        this.logger.error('Redis publisher error', {}, error);
      });

      this.publisher.on('connect', () => {
        this.logger.info('Redis publisher connected');
      });

      this.subscriber.on('connect', () => {
        this.logger.info('Redis subscriber connected');
      });

      // Use ping to check connection
      try {
        await this.publisher.ping();
        this.logger.info('Redis connection established');
      } catch (err) {
        this.logger.error(
          `Could not connect to Redis at ${this.config.redis.host}:${this.config.redis.port}`,
          {},
          err as Error
        );
        throw err;
      }
    });
  }

  async register(
    name: string,
    role: AgentRole,
    platform: AgentPlatform,
    capabilities: string[] = [],
    agentCard?: AgentCard
  ): Promise<AgentInfo> {
    const id = `agent_${name}_${Date.now()}`;

    this.agentInfo = {
      id,
      name,
      role,
      platform,
      status: 'active',
      capabilities: capabilities.length > 0 ? capabilities : this.getDefaultCapabilities(platform),
      registeredAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      isOnline: true,
      agentCard,
    };

    if (!this.publisher || !this.subscriber) {
      throw new Error('Client not initialized');
    }

    // Update logger with agent ID
    this.logger.setAgentId(id);

    // Store in Redis
    await this.publisher.hset(
      'tnf:agent-registry',
      this.agentInfo.id,
      JSON.stringify(this.agentInfo)
    );

    // Subscribe to channels
    await this.subscriber.subscribe(
      CONFIG.channels.agents,
      CONFIG.channels.conversations,
      CONFIG.channels.orchestrator,
      CONFIG.channels.broker,
      CONFIG.channels.acks,
      `tnf:direct:*:${this.agentInfo.id}`,
      `tnf:agent:${this.agentInfo.id}`
    );

    // Announce registration
    await this.broadcast({
      type: 'status',
      content: `Agent ${name} (${role}) is now online`,
      metadata: {
        event: 'agent_registered',
        agentInfo: this.agentInfo,
        capabilities: this.agentInfo.capabilities,
      },
    });

    // Start heartbeat
    this.startHeartbeat();

    this.logger.info(`Agent registered: ${name} (${id})`, {
      agentId: id,
      name,
      role,
      platform,
    });

    return this.agentInfo;
  }

  private getDefaultCapabilities(platform: string): string[] {
    const capabilityMap: Record<string, string[]> = {
      antigravity: ['code_assistance', 'orchestration', 'planning', 'analysis'],
      gemini: ['code_analysis', 'research', 'implementation', 'review'],
      claude: ['reasoning', 'review', 'synthesis', 'documentation'],
      jules: ['parallel_execution', 'github_commits', 'refactoring', 'batch_processing'],
      vscode: ['code_editing', 'terminal', 'debugging', 'extensions'],
      browser: ['web_scraping', 'research', 'automation'],
    };
    return capabilityMap[platform] || ['general'];
  }

  async send(content: string, options: any = {}): Promise<AgentMessage> {
    return this.circuitBreaker.execute(async () => {
      if (!this.agentInfo || !this.publisher) {
        throw new Error('Agent not registered or publisher not initialized');
      }

      const traceId = options.traceId || uuidv4();
      const message: AgentMessage = {
        id: uuidv4(),
        traceId,
        timestamp: new Date().toISOString(),
        from: {
          agentId: this.agentInfo.id,
          agentName: this.agentInfo.name,
          role: this.agentInfo.role,
          platform: this.agentInfo.platform,
        },
        to: options.to,
        type: options.type || 'message',
        content,
        parts: options.parts,
        conversationId: options.conversationId || this.currentConversation || undefined,
        replyTo: options.replyTo,
        expectsResponse: options.expectsResponse || this.config.reliability.enableAcks,
        metadata: {
          priority: options.priority || 'normal',
          ttl: options.ttl,
          retryCount: 0,
          maxRetries: this.config.reliability.maxRetries,
          ...options.metadata,
        },
      };

      const channel = options.channel || CONFIG.channels.conversations;

      // If ACKs are enabled and message expects response, set up tracking
      if (this.config.reliability.enableAcks && message.expectsResponse) {
        return this.sendWithAck(message, channel);
      }

      await this.publisher.publish(channel, JSON.stringify(message));

      this.logger.debug(`Message sent: ${message.id}`, {
        messageId: message.id,
        traceId,
        channel,
        type: message.type,
      });

      return message;
    });
  }

  private async sendWithAck(message: AgentMessage, channel: string): Promise<AgentMessage> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingMessages.delete(message.id);

        // Retry logic
        const retryCount = message.metadata?.retryCount || 0;
        const maxRetries = message.metadata?.maxRetries || this.config.reliability.maxRetries;

        if (retryCount < maxRetries) {
          this.logger.warn(
            `Message ${message.id} timed out, retrying (${retryCount + 1}/${maxRetries})`,
            {
              messageId: message.id,
              retryCount: retryCount + 1,
            }
          );

          message.metadata = {
            ...message.metadata,
            retryCount: retryCount + 1,
          };

          this.sendWithAck(message, channel).then(resolve).catch(reject);
        } else {
          // Send to dead letter queue
          this.sendToDeadLetter(message, 'timeout');
          reject(new Error(`Message ${message.id} failed after ${maxRetries} retries`));
        }
      }, this.config.reliability.messageTimeoutMs);

      this.pendingMessages.set(message.id, {
        message,
        resolve: (ack) => {
          clearTimeout(timeout);
          this.pendingMessages.delete(message.id);
          this.logger.debug(`Message ${message.id} acknowledged`, {
            messageId: message.id,
            ack,
          });
          resolve(message);
        },
        reject: (error) => {
          clearTimeout(timeout);
          this.pendingMessages.delete(message.id);
          reject(error);
        },
        retries: 0,
        timeout,
      });

      this.publisher!.publish(channel, JSON.stringify(message)).catch((error) => {
        clearTimeout(timeout);
        this.pendingMessages.delete(message.id);
        reject(error);
      });
    });
  }

  private async sendToDeadLetter(message: AgentMessage, reason: string): Promise<void> {
    if (!this.config.reliability.deadLetterQueue || !this.publisher) return;

    const dlqEntry = {
      message,
      reason,
      timestamp: new Date().toISOString(),
    };

    await this.publisher.lpush(CONFIG.channels.deadLetter, JSON.stringify(dlqEntry));

    this.logger.warn(`Message sent to dead letter queue: ${message.id}`, {
      messageId: message.id,
      reason,
    });
  }

  private async handleAck(ack: MessageAck): Promise<void> {
    const pending = this.pendingMessages.get(ack.messageId);
    if (pending) {
      if (ack.status === 'acknowledged') {
        pending.resolve(ack);
      } else {
        pending.reject(new Error(`Message rejected: ${ack.reason}`));
      }
    }
  }

  async sendAck(
    messageId: string,
    status: 'acknowledged' | 'rejected',
    reason?: string
  ): Promise<void> {
    if (!this.publisher || !this.agentInfo) return;

    const ack: MessageAck = {
      messageId,
      traceId: uuidv4(),
      timestamp: new Date().toISOString(),
      status,
      reason,
      processedAt: new Date().toISOString(),
    };

    await this.publisher.publish(
      CONFIG.channels.acks,
      JSON.stringify({
        ...ack,
        from: this.agentInfo.id,
      })
    );
  }

  async broadcast(options: any): Promise<AgentMessage> {
    return this.send(options.content, {
      ...options,
      channel: CONFIG.channels.agents,
      to: { broadcast: true },
    });
  }

  async startConversation(topic: string): Promise<string> {
    this.currentConversation = `convo_${topic}_${Date.now()}`;

    await this.broadcast({
      type: 'status',
      content: `Started conversation: "${topic}"`,
      metadata: {
        event: 'conversation_started',
        conversationId: this.currentConversation,
        topic,
      },
    });

    this.logger.info(`Conversation started: ${this.currentConversation}`, {
      conversationId: this.currentConversation,
      topic,
    });

    return this.currentConversation;
  }

  joinConversation(conversationId: string): void {
    this.currentConversation = conversationId;
    this.logger.debug(`Joined conversation: ${conversationId}`);
  }

  private handleIncomingMessage(channel: string, messageStr: string): void {
    try {
      const message: AgentMessage = JSON.parse(messageStr);

      // Skip own messages
      if (message.from?.agentId === this.agentInfo?.id) {
        return;
      }

      // Handle ACKs
      if (message.type === 'ack') {
        this.handleAck(message as any);
        return;
      }

      // Send ACK if expected
      if (message.expectsResponse && this.config.reliability.enableAcks) {
        this.sendAck(message.id, 'acknowledged');
      }

      this.logger.debug(`Message received: ${message.id}`, {
        messageId: message.id,
        traceId: message.traceId,
        from: message.from?.agentId,
        type: message.type,
        channel,
      });

      // Notify type-specific handlers
      const handlers = this.messageHandlers.get(message.type) || [];
      handlers.forEach((handler) => {
        try {
          handler(message, channel);
        } catch (error) {
          this.logger.error('Error in message handler', { messageId: message.id }, error as Error);
        }
      });

      // Notify all handlers
      const allHandlers = this.messageHandlers.get('*') || [];
      allHandlers.forEach((handler) => {
        try {
          handler(message, channel);
        } catch (error) {
          this.logger.error('Error in message handler', { messageId: message.id }, error as Error);
        }
      });
    } catch (error: any) {
      this.logger.error('Error parsing message', {}, error);
    }
  }

  onMessage(type: string, handler: (message: AgentMessage, channel: string) => void): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  offMessage(type: string, handler: (message: AgentMessage, channel: string) => void): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(async () => {
      if (this.agentInfo && this.publisher) {
        this.agentInfo.lastSeen = new Date().toISOString();

        try {
          await this.publisher.hset(
            'tnf:agent-registry',
            this.agentInfo.id,
            JSON.stringify(this.agentInfo)
          );

          await this.publisher.publish(
            CONFIG.channels.heartbeat,
            JSON.stringify({
              agentId: this.agentInfo.id,
              agentName: this.agentInfo.name,
              timestamp: this.agentInfo.lastSeen,
              status: this.agentInfo.status,
            })
          );
        } catch (error) {
          this.logger.error('Heartbeat failed', {}, error as Error);
        }
      }
    }, this.config.heartbeat.intervalMs);
  }

  async listAgents(): Promise<AgentInfo[]> {
    if (!this.publisher) return [];

    return this.circuitBreaker.execute(async () => {
      const agents = await this.publisher!.hgetall('tnf:agent-registry');
      const agentList: AgentInfo[] = [];

      for (const [id, jsonStr] of Object.entries(agents)) {
        try {
          const agent = JSON.parse(jsonStr as string);
          const lastSeen = new Date(agent.lastSeen);
          const isOnline = Date.now() - lastSeen.getTime() < this.config.heartbeat.timeoutMs;

          agentList.push({
            ...agent,
            isOnline,
          });
        } catch (e) {
          // Skip invalid
        }
      }

      return agentList;
    });
  }

  async getAgent(agentId: string): Promise<AgentInfo | null> {
    if (!this.publisher) return null;

    const agentJson = await this.publisher.hget('tnf:agent-registry', agentId);
    if (!agentJson) return null;

    try {
      return JSON.parse(agentJson);
    } catch {
      return null;
    }
  }

  async updateAgentCard(agentCard: AgentCard): Promise<void> {
    if (!this.agentInfo) return;

    this.agentInfo.agentCard = agentCard;

    if (this.publisher) {
      await this.publisher.hset(
        'tnf:agent-registry',
        this.agentInfo.id,
        JSON.stringify(this.agentInfo)
      );
    }

    this.logger.info('AgentCard updated', {
      agentId: this.agentInfo.id,
      skills: agentCard.skills.map((s) => s.id),
    });
  }

  async discoverAgentsBySkill(skillId: string): Promise<AgentInfo[]> {
    const allAgents = await this.listAgents();
    return allAgents.filter((agent) =>
      agent.agentCard?.skills.some((skill) => skill.id === skillId || skill.tags.includes(skillId))
    );
  }

  // Task management helpers
  async createTask(request: TaskCreateRequest): Promise<Task> {
    const task = this.taskManager.createTask(request, this.agentInfo?.id || 'unknown');

    // Broadcast task creation
    await this.broadcast({
      type: 'status',
      content: `Task created: ${task.title}`,
      metadata: {
        event: 'task_created',
        taskId: task.id,
        task: task,
      },
    });

    return task;
  }

  async assignTask(taskId: string, agentId: string): Promise<Task> {
    const task = this.taskManager.assignTask(taskId, agentId);

    // Notify assigned agent
    await this.send(`You have been assigned task: ${task.title}`, {
      to: { agentId },
      type: 'command',
      metadata: {
        event: 'task_assigned',
        taskId: task.id,
        task: task,
      },
    });

    return task;
  }

  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up agent client...');

    // Clear pending messages
    for (const [id, pending] of this.pendingMessages) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Client shutting down'));
    }
    this.pendingMessages.clear();

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    if (this.agentInfo && this.publisher) {
      this.agentInfo.status = 'offline';
      await this.publisher.hset(
        'tnf:agent-registry',
        this.agentInfo.id,
        JSON.stringify(this.agentInfo)
      );

      await this.broadcast({
        type: 'status',
        content: `Agent ${this.agentInfo.name} is going offline`,
        metadata: { event: 'agent_offline' },
      });
    }

    if (this.subscriber) await this.subscriber.quit();
    if (this.publisher) await this.publisher.quit();

    this.logger.info('Agent client cleaned up');
  }

  getAgentInfo(): AgentInfo | null {
    return this.agentInfo;
  }

  getCircuitBreakerMetrics(): ReturnType<CircuitBreaker['getMetrics']> {
    return this.circuitBreaker.getMetrics();
  }
}
