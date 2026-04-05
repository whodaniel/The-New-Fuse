import {
  createStandaloneRedisClient,
  createUpstashRestClient,
} from '@the-new-fuse/infrastructure';
import { Redis as UpstashRedis } from '@upstash/redis';
import { Redis, Cluster } from 'ioredis';
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
  type: 'message' | 'command' | 'response' | 'heartbeat' | 'status' | 'auction' | 'bid' | 'award';
  content: string;
  payload?: any;
  conversationId?: string;
  replyTo?: string;
  expectsResponse?: boolean;
  metadata?: any;
}

export const CONFIG = {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    url: process.env.REDIS_URL,
    keyPrefix: 'tnf:',
  },
  channels: {
    agents: 'tnf:agents',
    conversations: 'tnf:conversations',
    orchestrator: 'tnf:orchestrator',
    broker: 'tnf:broker',
    heartbeat: 'tnf:heartbeat',
    directPrefix: 'tnf:direct',
  },
  heartbeatInterval: 30000, // 30 seconds
};

export class RedisAgentClient {
  private publisher: any = null;
  private subscriber: any = null;
  private upstash: any = null;
  private agentInfo: AgentInfo | null = null;
  private messageHandlers: Map<string, Array<(message: AgentMessage, channel: string) => void>> =
    new Map();
  private heartbeatTimer: NodeJS.Timeout | null = null;
  public currentConversation: string | null = null;
  private redisErrorLogged = false;

  constructor() {}

  async initialize() {
    try {
      // Use unified standalone utilities
      this.publisher = createStandaloneRedisClient({ lazyConnect: true } as any);
      this.subscriber = createStandaloneRedisClient({ lazyConnect: true } as any);
      this.upstash = createUpstashRestClient();

      if (this.publisher instanceof Redis) {
        this.publisher.on('error', (error: Error) => this.logRedisClientError('publisher', error));
        await this.publisher.connect().catch(() => {});
      }

      if (this.subscriber instanceof Redis) {
        this.subscriber.on('error', (error: Error) => this.logRedisClientError('subscriber', error));
        await this.subscriber.connect().catch(() => {});

        this.subscriber.on('message', (channel: string, message: string) => {
          this.handleIncomingMessage(channel, message);
        });
        this.subscriber.on('pmessage', (_pattern: string, channel: string, message: string) => {
          this.handleIncomingMessage(channel, message);
        });
      }

      // Check connection
      if (this.upstash) {
        await this.upstash.ping();
      } else if (this.publisher) {
        await this.publisher.ping();
      }
    } catch (err: any) {
      console.warn(`⚠️ Could not connect to Redis: ${err.message}`);
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

    if (!this.publisher && !this.upstash) throw new Error('Client not initialized');

    // Store in Redis
    if (this.upstash) {
      await this.upstash.hset('tnf:agent-registry', { [this.agentInfo.id]: JSON.stringify(this.agentInfo) });
    } else if (this.publisher) {
      await this.publisher.hset(
        'tnf:agent-registry',
        this.agentInfo.id,
        JSON.stringify(this.agentInfo)
      );
    }

    // Subscribe to channels
    if (this.subscriber instanceof Redis) {
      await this.subscriber.subscribe(
        CONFIG.channels.agents,
        CONFIG.channels.conversations,
        CONFIG.channels.orchestrator,
        CONFIG.channels.broker,
        'tnf:bus:ingress' // Listen to global ingress for auctions
      );
      await this.subscriber.psubscribe(`${CONFIG.channels.directPrefix}:*:${this.agentInfo.id}`);
    }

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

  /**
   * Listen for task auctions
   */
  onAuction(callback: (auction: any) => void) {
    this.onMessage('auction', (envelope: any) => {
      callback(envelope.payload);
    });
  }

  /**
   * Submit a bid for an auction
   */
  async submitBid(taskId: string, suitability: number, metadata: any = {}) {
    if (!this.agentInfo || (!this.publisher && !this.upstash)) throw new Error('Client not initialized');

    const bid: AgentMessage = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: 'bid',
      from: {
        agentId: this.agentInfo.id,
        agentName: this.agentInfo.name,
        role: this.agentInfo.role,
        platform: this.agentInfo.platform,
      },
      content: `Bid for task ${taskId}`,
      payload: {
        taskId,
        suitability,
        agentId: this.agentInfo.id,
        agentName: this.agentInfo.name,
        capabilities: this.agentInfo.capabilities,
        ...metadata,
      },
    };

    // Publish bid to broker channel
    const payload = JSON.stringify(bid);
    if (this.upstash) {
      await this.upstash.publish(CONFIG.channels.broker, payload);
    } else if (this.publisher) {
      await this.publisher.publish(CONFIG.channels.broker, payload);
    }
    console.log(`[Agent] Submitted bid for task ${taskId} (Suitability: ${suitability})`);
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
    if (!this.agentInfo || (!this.publisher && !this.upstash)) {
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

    const directAgentId = options.to?.agentId;
    const channel = directAgentId
      ? `${CONFIG.channels.directPrefix}:${this.agentInfo.id}:${directAgentId}`
      : options.channel || CONFIG.channels.conversations;
    
    const payload = JSON.stringify(message);
    if (this.upstash) {
      await this.upstash.publish(channel, payload);
    } else if (this.publisher) {
      await this.publisher.publish(channel, payload);
    }

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

      if (message.from && message.from.agentId === this.agentInfo?.id) {
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
      if (this.agentInfo && (this.publisher || this.upstash)) {
        this.agentInfo.lastSeen = new Date().toISOString();

        const agentData = JSON.stringify(this.agentInfo);
        const heartbeatData = JSON.stringify({
          agentId: this.agentInfo.id,
          agentName: this.agentInfo.name,
          timestamp: this.agentInfo.lastSeen,
        });

        if (this.upstash) {
          await this.upstash.hset('tnf:agent-registry', { [this.agentInfo.id]: agentData });
          await this.upstash.publish(CONFIG.channels.heartbeat, heartbeatData);
        } else if (this.publisher) {
          await this.publisher.hset('tnf:agent-registry', this.agentInfo.id, agentData);
          await this.publisher.publish(CONFIG.channels.heartbeat, heartbeatData);
        }
      }
    }, CONFIG.heartbeatInterval);
  }

  async listAgents(): Promise<AgentInfo[]> {
    let agents: Record<string, string> = {};
    if (this.upstash) {
      agents = (await this.upstash.hgetall('tnf:agent-registry')) || {};
    } else if (this.publisher) {
      agents = await this.publisher.hgetall('tnf:agent-registry');
    }

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
    const payload = JSON.stringify({
      type: 'CHANNEL_CREATE',
      source: this.agentInfo?.id || 'unknown',
      channel: channelName,
      timestamp: Date.now(),
      payload: { name: channelName },
    });

    if (this.upstash) {
      await this.upstash.publish('tnf:bus:ingress', payload);
    } else if (this.publisher) {
      await this.publisher.publish('tnf:bus:ingress', payload);
    }

    return channelName;
  }

  /**
   * Log real-time activity to the swarm log
   */
  async logActivity(eventType: string, content: string, metadata: any = {}) {
    const logEntry = JSON.stringify({
      timestamp: new Date().toISOString(),
      eventType,
      content,
      metadata: {
        source: this.agentInfo?.name || 'System',
        agentId: this.agentInfo?.id,
        ...metadata,
      },
    });

    if (this.upstash) {
      await this.upstash.lpush('tnf:master:logs', logEntry);
      await this.upstash.ltrim('tnf:master:logs', 0, 99);
    } else if (this.publisher) {
      await this.publisher.lpush('tnf:master:logs', logEntry);
      await this.publisher.ltrim('tnf:master:logs', 0, 99);
    }
  }

  async getChannels(): Promise<string[]> {
    let channels: string[] = [];
    if (this.upstash) {
      channels = await this.upstash.smembers('tnf:master:channels');
    } else if (this.publisher) {
      channels = await this.publisher.smembers('tnf:master:channels');
    }

    const defaultChannels = ['Green', 'Blue', 'Red', 'Yellow', 'Purple', 'General'];
    const allChannels = new Set([...defaultChannels, ...channels]);

    return Array.from(allChannels);
  }

  async cleanup() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    if (this.agentInfo && (this.publisher || this.upstash)) {
      this.agentInfo.status = 'offline';
      const agentData = JSON.stringify(this.agentInfo);
      
      if (this.upstash) {
        await this.upstash.hset('tnf:agent-registry', { [this.agentInfo.id]: agentData });
      } else if (this.publisher) {
        await this.publisher.hset('tnf:agent-registry', this.agentInfo.id, agentData);
      }

      await this.broadcast({
        type: 'status',
        content: `Agent ${this.agentInfo.name} is going offline`,
        metadata: { event: 'agent_offline' },
      });
    }

    if (this.subscriber) await this.subscriber.quit();
    if (this.publisher) await this.publisher.quit();
    this.upstash = null;
  }
}
