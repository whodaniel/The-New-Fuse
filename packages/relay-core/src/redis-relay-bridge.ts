/**
 * Redis-Relay Bridge
 *
 * Bridges the WebSocket Relay to Redis for orchestration
 * Implements the "Data Plane → Control Plane" pattern
 *
 * Flow:
 * 1. Relay receives WS message
 * 2. Emits 'message' event
 * 3. Bridge publishes to Redis 'tnf:bus:ingress'
 * 4. Orchestrator processes via Redis
 * 5. Orchestrator publishes to 'tnf:bus:egress:{agentId}'
 * 6. Bridge subscribes and forwards back to Relay
 */

import {
  connectStandaloneRedisClient,
  createStandaloneRedisClient,
  createUpstashRestClient,
  describeStandaloneRedisClient,
  parseRedisUrl,
} from '@the-new-fuse/infrastructure';
import { Redis as UpstashRedis } from '@upstash/redis';
import { EventEmitter } from 'events';
import type { Cluster, Redis } from 'ioredis';
import { createAgentIdentityRecord } from './contracts/identity.js';
import { getNativeEnvelopeValidatorStatus } from './protocol/native-envelope-validator.js';
import { createTNFEnvelope, TNFEnvelope, validateTNFEnvelope } from './protocol/tnf-envelope.js';

export interface RedisRelayBridgeConfig {
  redisUrl: string;
  ingressChannel: string;
  egressChannelPrefix: string;
  enableLegacyShim: boolean;
}

export class RedisRelayBridge extends EventEmitter {
  private redisClient: Redis | Cluster;
  private redisSubscriber: Redis | Cluster;
  private upstashClient: UpstashRedis | null = null;
  private config: RedisRelayBridgeConfig;
  private connected: boolean = false;

  constructor(config: Partial<RedisRelayBridgeConfig> = {}) {
    super();

    this.config = {
      redisUrl: config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
      ingressChannel: config.ingressChannel || 'tnf:bus:ingress',
      egressChannelPrefix: config.egressChannelPrefix || 'tnf:bus:egress',
      enableLegacyShim: config.enableLegacyShim ?? true,
    };

    // Create Redis clients using unified standalone utility
    const parsedRedisConfig = parseRedisUrl(this.config.redisUrl);
    this.redisClient = createStandaloneRedisClient({
      ...parsedRedisConfig,
      lazyConnect: true,
    });

    this.redisSubscriber = createStandaloneRedisClient({
      ...parsedRedisConfig,
      lazyConnect: true,
    });

    // Create Upstash REST client if available
    this.upstashClient = createUpstashRestClient();

    const validatorStatus = getNativeEnvelopeValidatorStatus();
    console.log(
      `[Redis-Bridge] Envelope validator: ${validatorStatus.mode}` +
        (validatorStatus.available && validatorStatus.libraryPath
          ? ` (${validatorStatus.libraryPath})`
          : validatorStatus.reason
            ? ` (${validatorStatus.reason})`
            : '')
    );

    this.setupErrorHandlers();
  }

  private setupErrorHandlers(): void {
    this.redisClient.on('error', (err: Error) => {
      console.error('[Redis-Bridge] Client error:', err);
      this.emit('error', err);
    });

    this.redisSubscriber.on('error', (err: Error) => {
      console.error('[Redis-Bridge] Subscriber error:', err);
      this.emit('error', err);
    });
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    try {
      await connectStandaloneRedisClient(this.redisClient);
      await connectStandaloneRedisClient(this.redisSubscriber);

      this.connected = true;
      const redisMode = describeStandaloneRedisClient(this.redisClient);
      if (this.upstashClient) {
        console.log(
          `[Redis-Bridge] Connected to Redis (Hybrid: Upstash REST + ioredis ${redisMode})`
        );
      } else {
        console.log(`[Redis-Bridge] Connected to Redis (ioredis ${redisMode})`);
      }
      this.emit('connected');
    } catch (error) {
      console.error('[Redis-Bridge] Connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    await this.redisClient.quit();
    await this.redisSubscriber.quit();
    this.connected = false;
    console.log('[Redis-Bridge] Disconnected from Redis');
    this.emit('disconnected');
  }

  /**
   * Handle incoming message from Relay
   * Publishes to Redis ingress channel
   */
  async handleRelayMessage(rawMessage: any, agentId: string): Promise<void> {
    if (!this.connected) {
      console.warn('[Redis-Bridge] Not connected, dropping message');
      return;
    }

    let envelope: TNFEnvelope;

    try {
      // Try to parse as TNF Envelope
      envelope = validateTNFEnvelope(rawMessage);
      console.log('[Redis-Bridge] Valid TNF Envelope received');
    } catch (error) {
      if (this.config.enableLegacyShim) {
        // Wrap legacy message in envelope
        console.log('[Redis-Bridge] Legacy message detected, wrapping in envelope');
        envelope = this.wrapLegacyMessage(rawMessage, agentId);
        // Ensure the wrapped legacy message is also fully normalized and validated
        envelope = validateTNFEnvelope(envelope);
      } else {
        console.error('[Redis-Bridge] Invalid envelope, dropping:', error);
        return;
      }
    }

    // Now 'envelope' is guaranteed to be a valid and normalized TNFEnvelope
    // No need for a second validateTNFEnvelope call here.
    const normalizedEnvelope = envelope;

    // Publish to ingress
    try {
      await this.redisClient.publish(
        this.config.ingressChannel,
        JSON.stringify(normalizedEnvelope)
      );
      console.log(
        `[Redis-Bridge] Published to ${this.config.ingressChannel}:`,
        normalizedEnvelope.id
      );
      this.emit('ingress', normalizedEnvelope);
    } catch (error) {
      console.error('[Redis-Bridge] Failed to publish:', error);
      this.emit('error', error);
    }
  }

  /**
   * Subscribe to egress channel for a specific agent
   */
  async subscribeToAgent(
    agentId: string,
    callback: (envelope: TNFEnvelope) => void
  ): Promise<void> {
    const channel = `${this.config.egressChannelPrefix}:${agentId}`;

    await this.redisSubscriber.subscribe(channel);

    this.redisSubscriber.on('message', (ch: string, message: string) => {
      if (ch === channel) {
        try {
          const envelope = validateTNFEnvelope(JSON.parse(message));
          console.log(`[Redis-Bridge] Received from ${channel}:`, envelope.id);
          callback(envelope);
          this.emit('egress', envelope);
        } catch (error) {
          console.error('[Redis-Bridge] Invalid egress message:', error);
        }
      }
    });

    console.log(`[Redis-Bridge] Subscribed to ${channel}`);
  }

  /**
   * Unsubscribe from agent's egress channel
   */
  async unsubscribeFromAgent(agentId: string): Promise<void> {
    const channel = `${this.config.egressChannelPrefix}:${agentId}`;
    await this.redisSubscriber.unsubscribe(channel);
    console.log(`[Redis-Bridge] Unsubscribed from ${channel}`);
  }

  /**
   * Wrap legacy message in TNF Envelope
   */
  private wrapLegacyMessage(rawMessage: any, agentId: string): TNFEnvelope {
    const identity = createAgentIdentityRecord({
      operationalHandle: agentId,
      runtimeSessionId: agentId,
      aliases: [agentId],
    });
    const payloadMetadata =
      rawMessage?.payload && typeof rawMessage.payload === 'object'
        ? ((rawMessage.payload as Record<string, unknown>).metadata as
            | Record<string, unknown>
            | undefined)
        : undefined;
    const metadata =
      (typeof rawMessage?.metadata === 'object' ? rawMessage.metadata : payloadMetadata) ||
      undefined;

    return createTNFEnvelope(
      'event',
      {
        agentId,
        operationalHandle: identity.operationalHandle,
        runtimeSessionId: identity.runtimeSessionId || undefined,
        aliases: identity.aliases,
        role: 'worker',
        platform: typeof rawMessage?.platform === 'string' ? rawMessage.platform : undefined,
      },
      { broadcast: true },
      {
        legacy: true,
        originalMessage: rawMessage,
      },
      {
        channelId: rawMessage.channel,
        sessionId: identity.runtimeSessionId || agentId,
      },
      {
        metadata,
        audit: {
          source: 'redis-relay-bridge',
          actor: identity.operationalHandle,
          channelId: rawMessage.channel,
          sessionId: identity.runtimeSessionId || agentId,
          operationalHandle: identity.operationalHandle,
          runtimeSessionId: identity.runtimeSessionId,
          canonicalEntityId: identity.canonicalEntityId,
        },
      }
    );
  }

  /**
   * Publish a raw message to a specific Redis channel
   */
  async publish(channel: string, message: string): Promise<number> {
    if (!this.connected) {
      throw new Error('Not connected to Redis');
    }
    return (this.redisClient as any).publish(channel, message);
  }

  /**
   * Publish message to ingress (for direct use)
   */
  async publishToIngress(envelope: TNFEnvelope): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to Redis');
    }

    const normalizedEnvelope = validateTNFEnvelope(envelope);
    await this.redisClient.publish(this.config.ingressChannel, JSON.stringify(normalizedEnvelope));
    console.log(`[Redis-Bridge] Published to ingress:`, normalizedEnvelope.id);
  }

  /**
   * Publish message to specific agent's egress
   */
  async publishToAgent(agentId: string, envelope: TNFEnvelope): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to Redis');
    }

    const channel = `${this.config.egressChannelPrefix}:${agentId}`;
    const normalizedEnvelope = validateTNFEnvelope(envelope);
    await this.redisClient.publish(channel, JSON.stringify(normalizedEnvelope));
    console.log(`[Redis-Bridge] Published to ${channel}:`, normalizedEnvelope.id);
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.connected;
  }
}

/**
 * Create and configure bridge
 */
export function createRedisRelayBridge(config?: Partial<RedisRelayBridgeConfig>): RedisRelayBridge {
  return new RedisRelayBridge(config);
}
