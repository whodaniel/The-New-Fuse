import { createStandaloneRedisClient, createUpstashRestClient } from '@the-new-fuse/infrastructure';
import chalk from 'chalk';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

import { buildWorkerTaskEnvelope, workerQueueKey } from './services/WorkerEnvelope.js';

export interface AgentInfo {
  id: string;
  name: string;
  role:
    | 'director'
    | 'orchestrator'
    | 'broker'
    | 'worker'
    | 'participant'
    | 'coordinator'
    | 'bridge'
    | string;
  platform: 'antigravity' | 'gemini' | 'claude' | 'jules' | 'vscode' | 'browser' | string;
  status: 'active' | 'busy' | 'idle' | 'offline';
  capabilities: string[];
  registeredAt: string;
  lastSeen: string;
  isOnline?: boolean;
  daccRole?: string;
  directorTier?: 'super' | 'sub' | 'local';
  /**
   * Bus contract v1 capacity fields. `busy` = at capacity. Set via
   * markBusy() or automatically when a directly-addressed task frame arrives.
   */
  currentLoad?: number;
  maxLoad?: number;
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
  type:
    | 'message'
    | 'command'
    | 'response'
    | 'heartbeat'
    | 'status'
    | 'auction'
    | 'bid'
    | 'award'
    | 'task'
    | 'event'
    | 'query'
    /** Bus contract v1: delivery acknowledgement (tnf:ack channel). */
    | 'ack';
  content: string;
  payload?: any;
  conversationId?: string;
  replyTo?: string;
  expectsResponse?: boolean;
  metadata?: any;
  /**
   * Bus contract v1 (docs/protocols/AGENT_BUS_CONTRACT.md):
   * correlationId links a frame to its ack on `tnf:ack`;
   * idempotencyKey makes receiving agents skip duplicate deliveries
   * (24h receipt window, one receipt set per agent).
   */
  correlationId?: string;
  idempotencyKey?: string;
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
    /** Bus contract v1: delivery acknowledgements and dead-letter frames. */
    ack: 'tnf:ack',
    dlq: 'tnf:dlq',
  },
  heartbeatInterval: 30000, // 30 seconds
  /** Bus contract v1: how long a receiving agent remembers a frame id. */
  dedupTtlSec: 86400,
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
  private lastRedisErrorLoggedAt = 0;
  private static readonly REDIS_ERROR_LOG_COOLDOWN_MS = 30000;

  constructor() {}

  async initialize() {
    try {
      // Use unified standalone utilities
      this.publisher = createStandaloneRedisClient({ lazyConnect: true } as any);
      this.subscriber = createStandaloneRedisClient({ lazyConnect: true } as any);
      this.upstash = createUpstashRestClient();

      if (this.publisher instanceof Redis) {
        this.publisher.on('error', async (error: Error) => {
          this.logRedisClientError('publisher', error);
          if (error?.message?.includes('ECONNREFUSED') || error?.message?.includes('Connection')) {
            await this.reconnectWithBackoff(this.publisher, 'publisher');
          }
        });
        await this.publisher.connect().catch(() => {});
      }

      if (this.subscriber instanceof Redis) {
        this.subscriber.on('error', async (error: Error) => {
          this.logRedisClientError('subscriber', error);
          if (error?.message?.includes('ECONNREFUSED') || error?.message?.includes('Connection')) {
            await this.reconnectWithBackoff(this.subscriber, 'subscriber');
          }
        });
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
    const now = Date.now();
    if (now - this.lastRedisErrorLoggedAt < RedisAgentClient.REDIS_ERROR_LOG_COOLDOWN_MS) return;
    this.lastRedisErrorLoggedAt = now;
    const details = error?.message || error?.name || 'unknown';
    console.error(`Redis ${kind} error:`, details);
  }

  private async reconnectWithBackoff(
    client: any,
    kind: 'publisher' | 'subscriber',
    maxRetries = 3
  ): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(
        chalk.dim(
          `  Redis ${kind}: reconnecting in ${delay}ms (attempt ${attempt}/${maxRetries})...`
        )
      );
      await new Promise((resolve) => setTimeout(resolve, delay));

      try {
        if (client instanceof Redis) {
          await client.connect();
          await client.ping();
          console.log(chalk.green(`  ✅ Redis ${kind}: reconnected successfully`));
          return true;
        }
      } catch {
        // Try again
      }
    }
    console.warn(
      chalk.yellow(`  ⚠️  Redis ${kind}: reconnection failed after ${maxRetries} attempts`)
    );
    return false;
  }

  async register(
    name: string,
    role: any,
    platform: string,
    capabilities: string[] = [],
    extra: Partial<AgentInfo> = {}
  ) {
    this.agentInfo = {
      id: `agent_${name}_${Date.now()}`,
      name,
      role,
      platform,
      status: 'active',
      capabilities:
        capabilities.length > 0 ? capabilities : this.getDefaultCapabilities(role, platform),
      registeredAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      ...extra,
    };

    if (!this.publisher && !this.upstash) throw new Error('Client not initialized');

    // Store in Redis
    if (this.upstash) {
      await this.upstash.hset('tnf:agent-registry', {
        [this.agentInfo.id]: JSON.stringify(this.agentInfo),
      });
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
    if (!this.agentInfo || (!this.publisher && !this.upstash))
      throw new Error('Client not initialized');

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

  /**
   * Defaults are role ∪ platform. Role and platform are orthogonal axes —
   * orchestration capabilities come from an orchestrator/coordinator *role*
   * assignment (or explicit capabilities), never from platform alone.
   */
  private getDefaultCapabilities(role: string, platform: string): string[] {
    const roleCapabilities: Record<string, string[]> = {
      director: ['strategy', 'escalation', 'override'],
      orchestrator: [
        'orchestration',
        'workflow_management',
        'task_routing',
        'result_aggregation',
        'agent_coordination',
      ],
      broker: ['routing', 'mediation', 'channel_management'],
      coordinator: ['coordinate', 'plan', 'delegate'],
      bridge: ['bridge', 'translate', 'relay'],
      worker: ['task_execution', 'report', 'collaborate'],
      participant: ['message', 'observe', 'respond'],
    };
    const platformCapabilities: Record<string, string[]> = {
      antigravity: ['code_assistance', 'planning', 'analysis'],
      gemini: ['code_analysis', 'research', 'implementation', 'review'],
      claude: ['reasoning', 'review', 'synthesis', 'documentation'],
      grok: ['agent_client_protocol', 'external_cli', 'reasoning', 'coding'],
      jules: ['parallel_execution', 'github_commits', 'refactoring', 'batch_processing'],
      vscode: ['code_editing', 'terminal', 'debugging', 'extensions'],
      browser: ['web_scraping', 'research', 'automation'],
      pi: [
        'autonomous_code_editing',
        'multi_provider_inference',
        'validation_pipeline',
        'handoff_export',
      ],
    };
    const roleCaps = roleCapabilities[String(role || '').toLowerCase()] || [];
    const platformCaps = platformCapabilities[String(platform || '').toLowerCase()] || ['general'];
    return Array.from(new Set([...roleCaps, ...platformCaps]));
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
      correlationId: options.correlationId,
      idempotencyKey: options.idempotencyKey,
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

  /**
   * LPUSH a task envelope onto a sub-director worker inbox so cron drainers
   * (run_one_envelope.py) can process it. Redis PUBLISH used by send() does not
   * reach these LIST-backed queues.
   */
  async enqueueWorkerTask(
    recipientAgentId: string,
    content: string,
    options: { title?: string; metadata?: Record<string, unknown> } = {}
  ): Promise<{ queueKey: string; envelopeId: string }> {
    if (!this.agentInfo || !this.publisher) {
      throw new Error('Agent not registered or Redis publisher not initialized');
    }

    const envelope = buildWorkerTaskEnvelope({
      recipientAgentId,
      content,
      senderAgentId: this.agentInfo.id,
      title: options.title,
      metadata: options.metadata,
    });
    const queueKey = workerQueueKey(recipientAgentId);
    const payload = JSON.stringify(envelope);

    if (this.publisher instanceof Redis) {
      await this.publisher.lpush(queueKey, payload);
    } else if (typeof this.publisher.lpush === 'function') {
      await this.publisher.lpush(queueKey, payload);
    } else {
      throw new Error('Redis client does not support LPUSH for worker queue delivery');
    }

    return { queueKey, envelopeId: envelope.payload.id };
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

  private async handleIncomingMessage(channel: string, messageStr: string) {
    try {
      const rawMessage = JSON.parse(messageStr);
      const message = this.normalizeIncomingMessage(rawMessage);
      if (!message) return;

      if (message.from && message.from.agentId === this.agentInfo?.id) {
        return;
      }

      // ---- Bus contract v1: dedup → ack → capacity → dispatch ----
      const duplicate = await this.registerFrameReceipt(message);
      if (duplicate) {
        // Re-ack so a retrying sender still gets its confirmation, but never
        // re-dispatch a duplicate payload to handlers.
        await this.autoAck(message, true);
        return;
      }
      await this.autoAck(message, false);
      this.applyCapacityOnTask(message);

      const handlers = this.messageHandlers.get(message.type) || [];
      handlers.forEach((handler) => handler(message, channel));

      const allHandlers = this.messageHandlers.get('*') || [];
      allHandlers.forEach((handler) => handler(message, channel));
    } catch (error: any) {
      console.error('Error parsing message:', error.message);
    }
  }

  /**
   * Bus contract v1: idempotent frame receipt.
   *
   * Records this agent's receipt of ONE frame (keyed by idempotencyKey, else
   * correlationId, else the frame id) with a 24h TTL, one Redis key per frame
   * (`tnf:seen:<agentId>:<frameKey>`). Returns true when the frame was
   * ALREADY processed — a duplicate delivery (sender retry, or the same id
   * re-delivered). Never throws: dedup must not break delivery.
   */
  private async registerFrameReceipt(message: AgentMessage): Promise<boolean> {
    const frameKey = message.idempotencyKey || message.correlationId || message.id;
    if (!frameKey || !this.agentInfo || !(this.publisher instanceof Redis)) return false;
    try {
      const res = await this.publisher.set(
        `tnf:seen:${this.agentInfo.id}:${frameKey}`,
        '1',
        'EX',
        CONFIG.dedupTtlSec,
        'NX'
      );
      return res === null; // NX failed → we have seen this frame before
    } catch {
      return false;
    }
  }

  /**
   * Bus contract v1: acknowledge any frame that asked for one.
   *
   * Frames carrying a correlationId are acked on `tnf:ack` the moment they
   * are received (and re-acked when a duplicate arrives), so senders using
   * `sendWithAck` / `tnf send --await-ack` can distinguish "published into
   * the void" from "received by a live subscriber".
   */
  private async autoAck(message: AgentMessage, duplicate: boolean): Promise<void> {
    if (!message.correlationId || message.type === 'ack') return;
    if (!this.agentInfo || !this.publisher) return;
    try {
      // The duplicate flag is only meaningful when the sender declared an
      // idempotencyKey — bare frame-id dedup (same frame id seen twice) is an
      // internal safety net and must not read as "your retry was deduped".
      await this.publishAck(message.correlationId, message.from?.agentId, {
        duplicate: duplicate && Boolean(message.idempotencyKey),
        ackFor: message.id,
      });
    } catch {
      // Acking is best-effort; never break the receive path.
    }
  }

  /**
   * Publish a delivery acknowledgement onto `tnf:ack`.
   */
  async publishAck(
    correlationId: string,
    toAgentId?: string,
    extra: Record<string, unknown> = {}
  ): Promise<void> {
    if (!this.agentInfo || !this.publisher) return;
    const ack = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: 'ack',
      from: {
        agentId: this.agentInfo.id,
        agentName: this.agentInfo.name,
        role: this.agentInfo.role,
        platform: this.agentInfo.platform,
      },
      to: toAgentId ? { agentId: toAgentId } : undefined,
      correlationId,
      content: `ack ${correlationId}`,
      ...extra,
    };
    const payload = JSON.stringify(ack);
    if (this.upstash) {
      await this.upstash.publish(CONFIG.channels.ack, payload);
    } else if (this.publisher) {
      await this.publisher.publish(CONFIG.channels.ack, payload);
    }
  }

  /**
   * Bus contract v1: a directly-addressed task frame marks this agent busy.
   * Broadcast tasks do not (every subscriber would saturate). Lifecycle-aware
   * daemons release with markBusy(false); the next heartbeat publishes the
   * transition either way.
   */
  private applyCapacityOnTask(message: AgentMessage): void {
    if (!this.agentInfo || message.type !== 'task') return;
    if (message.to?.agentId !== this.agentInfo.id) return;
    const maxLoad = this.agentInfo.maxLoad ?? 1;
    const currentLoad = this.agentInfo.currentLoad ?? 0;
    if (currentLoad >= maxLoad) return; // already saturated; handlers decide
    this.agentInfo.currentLoad = currentLoad + 1;
    void this.persistAgentInfo();
  }

  /**
   * Explicit capacity control for lifecycle-aware daemons: declare busy (or
   * release), optionally setting the load counters. Persists immediately so
   * the roster and `--require-capacity` gates see it without waiting for the
   * next heartbeat tick.
   */
  async markBusy(busy: boolean, load?: { current?: number; max?: number }): Promise<void> {
    if (!this.agentInfo) return;
    if (load?.max !== undefined) this.agentInfo.maxLoad = load.max;
    if (load?.current !== undefined) this.agentInfo.currentLoad = load.current;
    if (busy && this.agentInfo.maxLoad === undefined) this.agentInfo.maxLoad = 1;
    if (busy && this.agentInfo.currentLoad === undefined) this.agentInfo.currentLoad = 1;
    const currentLoad = this.agentInfo.currentLoad ?? 0;
    const maxLoad = this.agentInfo.maxLoad ?? 1;
    this.agentInfo.status = busy || currentLoad >= maxLoad ? 'busy' : 'active';
    await this.persistAgentInfo();
  }

  /** Write the current AgentInfo to the registry and publish one heartbeat. */
  private async persistAgentInfo(): Promise<void> {
    if (!this.agentInfo || (!this.publisher && !this.upstash)) return;
    this.agentInfo.lastSeen = new Date().toISOString();
    const agentData = JSON.stringify(this.agentInfo);
    const heartbeatData = JSON.stringify({
      agentId: this.agentInfo.id,
      agentName: this.agentInfo.name,
      status: this.agentInfo.status,
      currentLoad: this.agentInfo.currentLoad,
      maxLoad: this.agentInfo.maxLoad,
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

  /**
   * Bus contract v1: send with end-to-end delivery acknowledgement.
   *
   * Publishes the frame with a correlationId, then waits up to ackTimeoutMs
   * for a matching ack on `tnf:ack` from a live subscriber. Unconfirmed
   * frames are dead-lettered (tnf:dlq pub/sub + durable `tnf:dlq` LIST) so
   * the failure is observable instead of silent — but NOTE: a worker-role
   * recipient also has a durable LPUSH inbox; callers must report that lane
   * as queued-durable, not lost.
   */
  async sendWithAck(
    content: string,
    options: any = {},
    ackTimeoutMs = 10000
  ): Promise<{
    correlationId: string;
    delivered: boolean;
    ackFrom?: string;
    duplicateAck?: boolean;
  }> {
    if (!this.agentInfo || (!this.publisher && !this.upstash)) {
      throw new Error('Agent not registered or publisher not initialized');
    }
    const correlationId =
      options.correlationId || `corr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Subscribe before publishing so a fast ack cannot slip past us.
    if (this.subscriber instanceof Redis) {
      await this.subscriber.subscribe(CONFIG.channels.ack);
    }

    let ackFrom: string | undefined;
    let duplicateAck = false;
    let timer: NodeJS.Timeout;
    const ackPromise = new Promise<void>((resolve) => {
      const handler = (message: AgentMessage) => {
        if (message.correlationId !== correlationId) return;
        ackFrom = message.from?.agentId;
        duplicateAck = Boolean((message as any).duplicate);
        clearTimeout(timer);
        resolve();
      };
      this.onMessage('ack', handler);
      timer = setTimeout(() => {
        const list = this.messageHandlers.get('ack');
        if (list) {
          const idx = list.indexOf(handler);
          if (idx >= 0) list.splice(idx, 1);
        }
        resolve();
      }, ackTimeoutMs);
    });

    await this.send(content, { ...options, correlationId });
    await ackPromise;

    const delivered = ackFrom !== undefined;
    if (!delivered) {
      await this.deadLetter(options, content, 'ack-timeout', ackTimeoutMs);
    }
    return { correlationId, delivered, ackFrom, duplicateAck };
  }

  /**
   * Bus contract v1: dead-letter an unconfirmed frame. Written BOTH to the
   * `tnf:dlq` pub/sub channel (live notice) and the `tnf:dlq` LIST (durable
   * store that `tnf dlq list` drains). Never throws — dead-lettering must not
   * be able to break the caller that just failed to deliver.
   */
  async deadLetter(
    sendOptions: any,
    content: string,
    reason: string,
    timeoutMs?: number
  ): Promise<void> {
    try {
      const entry = {
        id: `dlq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        deadAt: new Date().toISOString(),
        reason,
        timeoutMs,
        channel: sendOptions?.to?.agentId
          ? `${CONFIG.channels.directPrefix}:${this.agentInfo?.id ?? 'unknown'}:${sendOptions.to.agentId}`
          : sendOptions?.channel || CONFIG.channels.conversations,
        to: sendOptions?.to ?? null,
        frame: {
          type: sendOptions?.type || 'message',
          content,
          correlationId: sendOptions?.correlationId,
          idempotencyKey: sendOptions?.idempotencyKey,
        },
      };
      const payload = JSON.stringify(entry);
      if (this.upstash) {
        await this.upstash.lpush(CONFIG.channels.dlq, payload);
        await this.upstash.publish(CONFIG.channels.dlq, payload);
      } else if (this.publisher) {
        await this.publisher.lpush(CONFIG.channels.dlq, payload);
        await this.publisher.publish(CONFIG.channels.dlq, payload);
      }
    } catch {
      // Never throw from dead-lettering.
    }
  }

  /** Read the durable dead-letter list (newest first). */
  async listDlq(limit = 20): Promise<any[]> {
    let entries: string[] = [];
    if (this.upstash) {
      entries = (await this.upstash.lrange(CONFIG.channels.dlq, 0, limit - 1)) || [];
    } else if (this.publisher) {
      entries = await this.publisher.lrange(CONFIG.channels.dlq, 0, limit - 1);
    }
    return entries.map((e) => {
      try {
        return JSON.parse(e);
      } catch {
        return { raw: e };
      }
    });
  }

  /** Drop the entire dead-letter list; returns how many entries were removed. */
  async clearDlq(): Promise<number> {
    let len = 0;
    if (this.upstash) {
      len = (await this.upstash.llen(CONFIG.channels.dlq)) || 0;
      await this.upstash.del(CONFIG.channels.dlq);
    } else if (this.publisher) {
      len = await this.publisher.llen(CONFIG.channels.dlq);
      await this.publisher.del(CONFIG.channels.dlq);
    }
    return len;
  }

  /** Re-publish one dead-lettered frame to its original channel, then remove it. */
  async replayDlqEntry(id: string): Promise<boolean> {
    let rawEntries: string[] = [];
    if (this.upstash) {
      rawEntries = (await this.upstash.lrange(CONFIG.channels.dlq, 0, -1)) || [];
    } else if (this.publisher) {
      rawEntries = await this.publisher.lrange(CONFIG.channels.dlq, 0, -1);
    }
    for (const raw of rawEntries) {
      let entry: any;
      try {
        entry = JSON.parse(raw);
      } catch {
        continue;
      }
      if (entry?.id !== id) continue;
      const channel = entry.channel || CONFIG.channels.conversations;
      const frame = JSON.stringify({
        ...(entry.frame || {}),
        replayedFrom: entry.id,
        replayedAt: new Date().toISOString(),
      });
      if (this.upstash) {
        await this.upstash.publish(channel, frame);
        await this.upstash.lrem(CONFIG.channels.dlq, 1, raw);
      } else if (this.publisher) {
        await this.publisher.publish(channel, frame);
        await this.publisher.lrem(CONFIG.channels.dlq, 1, raw);
      }
      return true;
    }
    return false;
  }

  private normalizeIncomingMessage(rawMessage: any): AgentMessage | null {
    if (!rawMessage || typeof rawMessage !== 'object') {
      return null;
    }

    const hasEnvelopeShape =
      typeof rawMessage.id === 'string' &&
      typeof rawMessage.type === 'string' &&
      rawMessage.from &&
      typeof rawMessage.from === 'object' &&
      rawMessage.payload &&
      typeof rawMessage.payload === 'object' &&
      (typeof rawMessage.traceId === 'string' ||
        rawMessage.version === '1.0' ||
        rawMessage.type === 'task' ||
        rawMessage.type === 'event' ||
        rawMessage.type === 'query');

    if (!hasEnvelopeShape) {
      return rawMessage as AgentMessage;
    }

    const payload = rawMessage.payload || {};
    const task = payload.task && typeof payload.task === 'object' ? payload.task : null;
    const taskContent =
      payload.message ||
      payload.prompt ||
      this.formatTaskForWorker(task) ||
      task?.description ||
      task?.title ||
      task?.content ||
      payload.action ||
      null;

    let content = '';
    if (typeof taskContent === 'string' && taskContent.trim()) {
      content = taskContent.trim();
    } else {
      content = JSON.stringify(payload);
    }

    return {
      id: rawMessage.id || uuidv4(),
      timestamp: rawMessage.timestamp || new Date().toISOString(),
      from: {
        agentId: rawMessage.from.agentId || rawMessage.from.id || 'unknown',
        agentName:
          rawMessage.from.agentName ||
          rawMessage.from.operationalHandle ||
          rawMessage.from.agentId ||
          'unknown',
        role: rawMessage.from.role || 'worker',
        platform: rawMessage.from.platform || 'relay-core',
      },
      to: rawMessage.to,
      type: rawMessage.type,
      content,
      payload,
      conversationId:
        rawMessage.context?.sessionId ||
        rawMessage.context?.workflowId ||
        rawMessage.conversationId,
      replyTo: rawMessage.context?.parentMessageId || rawMessage.replyTo,
      correlationId: rawMessage.correlationId,
      idempotencyKey: rawMessage.idempotencyKey,
      expectsResponse:
        rawMessage.type === 'task' ||
        rawMessage.type === 'query' ||
        Boolean(rawMessage.expectsResponse),
      metadata: {
        ...(typeof rawMessage.metadata === 'object' ? rawMessage.metadata : {}),
        payload,
        tnfEnvelope: true,
      },
    } as AgentMessage;
  }

  private formatTaskForWorker(task: any): string | null {
    if (!task || typeof task !== 'object') {
      return null;
    }

    const lines: string[] = [];
    const title = typeof task.title === 'string' ? task.title.trim() : '';
    const description = typeof task.description === 'string' ? task.description.trim() : '';
    const content = typeof task.content === 'string' ? task.content.trim() : '';

    if (title) lines.push(`Task: ${title}`);
    if (description && description !== title) lines.push(`Description: ${description}`);
    if (content && content !== description && content !== title) lines.push(content);

    const acceptanceCriteria = Array.isArray(task.acceptanceCriteria)
      ? task.acceptanceCriteria
      : Array.isArray(task.acceptance_criteria)
        ? task.acceptance_criteria
        : [];

    const cleanCriteria = acceptanceCriteria
      .map((item: unknown) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);

    if (cleanCriteria.length > 0) {
      lines.push(
        `Acceptance criteria:\n${cleanCriteria.map((item: string) => `- ${item}`).join('\n')}`
      );
    }

    if (typeof task.priority === 'string' && task.priority.trim()) {
      lines.push(`Priority: ${task.priority.trim()}`);
    }

    if (Array.isArray(task.requiredCapabilities) && task.requiredCapabilities.length > 0) {
      const capabilities = task.requiredCapabilities
        .map((item: unknown) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean);
      if (capabilities.length > 0) {
        lines.push(`Required capabilities: ${capabilities.join(', ')}`);
      }
    }

    return lines.length > 0 ? lines.join('\n\n') : null;
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
        // Bus contract v1: heartbeats now carry status + capacity so the
        // roster and --require-capacity gates see transitions without having
        // to re-read the registry.
        await this.persistAgentInfo();
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

        // Liveness must be relative to how often the agent actually beats.
        //
        // The flat `heartbeatInterval * 2` (60s) rule assumes an in-process
        // agent beating every 30s. The sub-director workers are cron-driven at
        // */5 and */15, so a perfectly healthy codegen worker read offline for
        // 240 of every 300 seconds (80%) and the infra worker for 840 of 900
        // (93%). `tnf agents list` therefore flickered green/red for precisely
        // the agents an operator would delegate to, and dispatch inherited the
        // same noise.
        //
        // Agents may now declare `expectedCadenceSec` at registration; they are
        // allowed two missed beats before being called stale. Agents that
        // declare nothing keep the original rule, so this is backwards
        // compatible with every existing registry row.
        const cadenceSec = Number(agent.expectedCadenceSec);
        const windowMs =
          Number.isFinite(cadenceSec) && cadenceSec > 0
            ? cadenceSec * 1000 * 2
            : CONFIG.heartbeatInterval * 2;
        const isOnline = Date.now() - lastSeen.getTime() < windowMs;

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

  /**
   * Remove this agent's row from the registry entirely.
   *
   * `cleanup()` marks an agent `offline` but keeps its row, which is right for
   * a long-lived agent whose history is worth seeing. It is wrong for a
   * one-shot CLI invocation: every `tnf send` registered a `cli-sender`
   * participant and left a permanent tombstone behind. Measured 2026-08-12 —
   * 16 registry rows for roughly 7 real agents, the surplus being throwaway
   * senders plus restarted agents that re-register under a new timestamped id
   * and orphan the old row. A roster that is mostly ghosts is a roster nobody
   * reads, and DispatchGuard's "did you mean" suggestions start pointing at
   * ids that can never receive anything.
   *
   * Ephemeral clients should call this instead of relying on `cleanup()`.
   */
  async deregister(): Promise<boolean> {
    if (!this.agentInfo) return false;
    const id = this.agentInfo.id;
    try {
      if (this.upstash) {
        await this.upstash.hdel('tnf:agent-registry', id);
      } else if (this.publisher) {
        await this.publisher.hdel('tnf:agent-registry', id);
      } else {
        return false;
      }
      return true;
    } catch {
      // Never let registry hygiene fail the operation the caller actually
      // wanted; a leftover row is a nuisance, a thrown error is a broken send.
      return false;
    }
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
