import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

export interface AgentInfo {
  id: string;
  name: string;
  role: 'orchestrator' | 'broker' | 'worker' | 'participant';
  platform: 'antigravity' | 'gemini' | 'claude' | 'jules' | 'vscode' | 'browser' | string;
  status: 'active' | 'idle' | 'offline';
  capabilities: string[];
  registeredAt: string;
  lastSeen: string;
  isOnline?: boolean;
}

export interface AgentMessage {
  id: string;
  timestamp: string;
  from: {
    agentId: string;
    agentName: string;
    role: string;
    platform: string;
  };
  to?: {
    agentId?: string;
    channel?: string;
    role?: string;
    broadcast?: boolean;
  };
  type: 'message' | 'command' | 'response' | 'heartbeat' | 'status';
  content: string;
  conversationId?: string;
  replyTo?: string;
  expectsResponse?: boolean;
  metadata?: any;
}

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
  },
  heartbeatInterval: 30000, // 30 seconds
};

export class RedisAgentClient {
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;
  private agentInfo: AgentInfo | null = null;
  private messageHandlers: Map<string, Array<(message: AgentMessage, channel: string) => void>> =
    new Map();
  private heartbeatTimer: NodeJS.Timeout | null = null;
  public currentConversation: string | null = null;
  private redisErrorLogged = false;

  constructor() {}

  async initialize() {
    const redisConfig = {
      host: CONFIG.redis.host,
      port: CONFIG.redis.port,
      password: CONFIG.redis.password,
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
    };

    this.publisher = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);

    this.subscriber.on('message', (channel: string, message: string) => {
      this.handleIncomingMessage(channel, message);
    });

    this.subscriber.on('error', (error: Error) => this.logRedisClientError('subscriber', error));

    this.publisher.on('error', (error: Error) => this.logRedisClientError('publisher', error));

    // Use ping to check connection
    try {
      await this.publisher.ping();
    } catch (err) {
      console.warn(`⚠️ Could not connect to Redis at ${CONFIG.redis.host}:${CONFIG.redis.port}`);
      throw err;
    }
  }

  private logRedisClientError(kind: 'publisher' | 'subscriber', error: Error) {
    if (this.redisErrorLogged) return;
    this.redisErrorLogged = true;
    const details = error?.message || error?.name || 'unknown';
    console.error(`Redis ${kind} error:`, details);
  }

  async register(name: string, role: any, platform: string, capabilities: string[] = []) {
    this.agentInfo = {
      id: `agent_${name}_${Date.now()}`,
      name,
      role,
      platform,
      status: 'active',
      capabilities: capabilities.length > 0 ? capabilities : this.getDefaultCapabilities(platform),
      registeredAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    };

    if (!this.publisher || !this.subscriber) throw new Error('Client not initialized');

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
      `tnf:direct:*:${this.agentInfo.id}`
    );

    // Announce registration
    await this.broadcast({
      type: 'status',
      content: `Agent ${name} (${role}) is now online`,
      metadata: { event: 'agent_registered', agentInfo: this.agentInfo },
    });

    // Start heartbeat
    this.startHeartbeat();

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

  async send(content: string, options: any = {}) {
    if (!this.agentInfo || !this.publisher) {
      throw new Error('Agent not registered or publisher not initialized');
    }

    const message: AgentMessage = {
      id: uuidv4(),
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
      conversationId: options.conversationId || this.currentConversation || undefined,
      replyTo: options.replyTo,
      expectsResponse: options.expectsResponse,
      metadata: options.metadata,
    };

    const channel = options.channel || CONFIG.channels.conversations;
    await this.publisher.publish(channel, JSON.stringify(message));

    return message;
  }

  async broadcast(options: any) {
    return this.send(options.content, {
      ...options,
      channel: CONFIG.channels.agents,
      to: { broadcast: true },
    });
  }

  async startConversation(topic: string) {
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

    return this.currentConversation;
  }

  joinConversation(conversationId: string) {
    this.currentConversation = conversationId;
  }

  private handleIncomingMessage(channel: string, messageStr: string) {
    try {
      const message: AgentMessage = JSON.parse(messageStr);

      if (message.from?.agentId === this.agentInfo?.id) {
        return;
      }

      const handlers = this.messageHandlers.get(message.type) || [];
      handlers.forEach((handler) => handler(message, channel));

      const allHandlers = this.messageHandlers.get('*') || [];
      allHandlers.forEach((handler) => handler(message, channel));
    } catch (error: any) {
      console.error('Error parsing message:', error.message);
    }
  }

  onMessage(type: string, handler: (message: AgentMessage, channel: string) => void) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(async () => {
      if (this.agentInfo && this.publisher) {
        this.agentInfo.lastSeen = new Date().toISOString();

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
          })
        );
      }
    }, CONFIG.heartbeatInterval);
  }

  async listAgents(): Promise<AgentInfo[]> {
    if (!this.publisher) return [];
    const agents = await this.publisher.hgetall('tnf:agent-registry');
    const agentList: AgentInfo[] = [];

    for (const [id, jsonStr] of Object.entries(agents)) {
      try {
        const agent = JSON.parse(jsonStr as string);
        const lastSeen = new Date(agent.lastSeen);
        const isOnline = Date.now() - lastSeen.getTime() < CONFIG.heartbeatInterval * 2;

        agentList.push({
          ...agent,
          isOnline,
        });
      } catch (e) {
        // Skip invalid
      }
    }

    return agentList;
  }

  async createChannel(channelName: string) {
    if (!this.publisher) throw new Error('Client not initialized');

    // We send a message to the orchestrator channel requesting creation
    // But since MasterClock listens to ingress (or checks types), we can publish a structured message
    // Actually, MasterClock listens to redis ingress 'tnf:bus:ingress'

    await this.publisher.publish(
      'tnf:bus:ingress',
      JSON.stringify({
        type: 'CHANNEL_CREATE',
        source: this.agentInfo?.id || 'unknown',
        channel: channelName,
        timestamp: Date.now(),
        payload: { name: channelName },
      })
    );

    return channelName;
  }

  async getChannels(): Promise<string[]> {
    if (!this.publisher) return [];

    // Query Redis directly for channels
    const channels = await this.publisher.smembers('tnf:master:channels');

    // Also merge with static config if needed, but MasterClock persists static to Redis on startup?
    // Wait, MasterClock::joinAllChannels adds them to Redis if persistent logic was fully correct,
    // but in my previous edit I only read from Redis.
    // I should probably just return what's in Redis + maybe hardcoded defaults if Redis is empty.

    const defaultChannels = ['Green', 'Blue', 'Red', 'Yellow', 'Purple', 'General'];
    const allChannels = new Set([...defaultChannels, ...channels]);

    return Array.from(allChannels);
  }

  async cleanup() {
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
  }
}
