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

import { EventEmitter } from 'events';
import { createClient, RedisClientType } from 'redis';
import { TNFEnvelope, validateTNFEnvelope, createTNFEnvelope } from './protocol/tnf-envelope';

export interface RedisRelayBridgeConfig {
  redisUrl: string;
  ingressChannel: string;
  egressChannelPrefix: string;
  enableLegacyShim: boolean;
}

export class RedisRelayBridge extends EventEmitter {
  private redisClient: RedisClientType;
  private redisSubscriber: RedisClientType;
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

    // Create Redis clients
    this.redisClient = createClient({ url: this.config.redisUrl });
    this.redisSubscriber = createClient({ url: this.config.redisUrl });

    this.setupErrorHandlers();
  }

  private setupErrorHandlers(): void {
    this.redisClient.on('error', (err) => {
      console.error('[Redis-Bridge] Client error:', err);
      this.emit('error', err);
    });

    this.redisSubscriber.on('error', (err) => {
      console.error('[Redis-Bridge] Subscriber error:', err);
      this.emit('error', err);
    });
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    try {
      await this.redisClient.connect();
      await this.redisSubscriber.connect();
      this.connected = true;
      console.log('[Redis-Bridge] Connected to Redis');
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
      } else {
        console.error('[Redis-Bridge] Invalid envelope, dropping:', error);
        return;
      }
    }

    // Publish to ingress
    try {
      await this.redisClient.publish(
        this.config.ingressChannel,
        JSON.stringify(envelope)
      );
      console.log(`[Redis-Bridge] Published to ${this.config.ingressChannel}:`, envelope.id);
      this.emit('ingress', envelope);
    } catch (error) {
      console.error('[Redis-Bridge] Failed to publish:', error);
      this.emit('error', error);
    }
  }

  /**
   * Subscribe to egress channel for a specific agent
   */
  async subscribeToAgent(agentId: string, callback: (envelope: TNFEnvelope) => void): Promise<void> {
    const channel = `${this.config.egressChannelPrefix}:${agentId}`;
    
    await this.redisSubscriber.subscribe(channel, (message) => {
      try {
        const envelope = validateTNFEnvelope(JSON.parse(message));
        console.log(`[Redis-Bridge] Received from ${channel}:`, envelope.id);
        callback(envelope);
        this.emit('egress', envelope);
      } catch (error) {
        console.error('[Redis-Bridge] Invalid egress message:', error);
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
    return createTNFEnvelope(
      'event',
      { agentId, role: 'worker' },
      { broadcast: true },
      {
        legacy: true,
        originalMessage: rawMessage,
      },
      {
        channelId: rawMessage.channel,
      }
    );
  }

  /**
   * Publish message to ingress (for direct use)
   */
  async publishToIngress(envelope: TNFEnvelope): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to Redis');
    }

    await this.redisClient.publish(
      this.config.ingressChannel,
      JSON.stringify(envelope)
    );
    console.log(`[Redis-Bridge] Published to ingress:`, envelope.id);
  }

  /**
   * Publish message to specific agent's egress
   */
  async publishToAgent(agentId: string, envelope: TNFEnvelope): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to Redis');
    }

    const channel = `${this.config.egressChannelPrefix}:${agentId}`;
    await this.redisClient.publish(channel, JSON.stringify(envelope));
    console.log(`[Redis-Bridge] Published to ${channel}:`, envelope.id);
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
