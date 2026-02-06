/**
 * Redis Transport for The New Fuse Relay System
 *
 * Provides pub/sub messaging and distributed coordination
 * Based on existing Redis infrastructure in src/redis/
 */

import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { RelayMessage, Transport } from '../types/index.js';
import { Logger } from '../utils/Logger.js';

export interface RedisTransportConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  channels: {
    agentCommunication: string;
    workflowExecution: string;
    systemEvents: string;
    heartbeat: string;
  };
  logger: Logger;
}

export class RedisTransport extends EventEmitter implements Transport {
  public readonly name = 'redis';
  private config: RedisTransportConfig;
  private publisher: Redis;
  private subscriber: Redis;
  private logger: Logger;
  private _isConnected: boolean = false;
  private messageHandlers: ((message: RelayMessage) => void)[] = [];
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(config: RedisTransportConfig) {
    super();
    this.config = config;
    this.logger = config.logger;

    // Create Redis clients
    const redisOptions = {
      host: config.host || 'localhost',
      port: config.port || 6380, // Using TNF's configured port
      password: config.password,
      db: config.db || 0,
      keyPrefix: config.keyPrefix || 'tnf:',
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    };

    this.publisher = new Redis(redisOptions);
    this.subscriber = new Redis(redisOptions);

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Publisher events
    this.publisher.on('connect', () => {
      this.logger.info('Redis publisher connected');
    });

    this.publisher.on('error', (error) => {
      this.logger.error(
        `Redis publisher error: ${error instanceof Error ? error.message : String(error)}`
      );
      this.emit('error', error);
    });

    // Subscriber events
    this.subscriber.on('connect', () => {
      this.logger.info('Redis subscriber connected');
      this.setupChannelSubscriptions();
    });

    this.subscriber.on('error', (error) => {
      this.logger.error(
        `Redis subscriber error: ${error instanceof Error ? error.message : String(error)}`
      );
      this.emit('error', error);
    });

    this.subscriber.on('message', (channel: string, message: string) => {
      this.handleRedisMessage(channel, message);
    });

    // Connection status tracking
    this.publisher.on('ready', () => {
      if (this.subscriber.status === 'ready') {
        this._isConnected = true;
        this.emit('connected');
      }
    });

    this.subscriber.on('ready', () => {
      if (this.publisher.status === 'ready') {
        this._isConnected = true;
        this.emit('connected');
      }
    });

    this.publisher.on('close', () => {
      this._isConnected = false;
      this.emit('disconnected');
    });

    this.subscriber.on('close', () => {
      this._isConnected = false;
      this.emit('disconnected');
    });
  }

  private async setupChannelSubscriptions(): Promise<void> {
    try {
      const channels = Object.values(this.config.channels);
      await this.subscriber.subscribe(...channels);
      this.logger.info(`Subscribed to Redis channels: ${channels.join(', ')}`);
    } catch (error) {
      this.logger.error(
        `Failed to subscribe to channels: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  private handleRedisMessage(channel: string, messageString: string): void {
    try {
      const message: RelayMessage = JSON.parse(messageString);

      this.logger.debug(
        `Received Redis message on ${channel}: ${message.type} from ${message.source}`
      );

      // Add Redis-specific metadata
      message.metadata = {
        ...message.metadata,
        transport: 'redis',
        channel,
        receivedAt: new Date().toISOString(),
      };

      // Notify message handlers
      this.messageHandlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          this.logger.error(
            `Error in message handler: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      });
    } catch (error) {
      this.logger.error(
        `Failed to parse Redis message: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async start(): Promise<boolean> {
    try {
      this.logger.info('Starting Redis transport');

      // Connect both clients
      await Promise.all([this.publisher.connect(), this.subscriber.connect()]);

      // Start heartbeat
      this.startHeartbeat();

      this.logger.info('Redis transport started successfully');
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to start Redis transport: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  async stop(): Promise<void> {
    try {
      this.logger.info('Stopping Redis transport');

      // Stop heartbeat
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }

      // Disconnect clients
      await Promise.all([this.publisher.quit(), this.subscriber.quit()]);

      this._isConnected = false;
      this.logger.info('Redis transport stopped');
    } catch (error) {
      this.logger.error(
        `Error stopping Redis transport: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async send(message: RelayMessage): Promise<boolean> {
    if (!this.isConnected) {
      this.logger.warn('Cannot send message - Redis not connected');
      return false;
    }

    try {
      // Determine channel based on message type
      const channel = this.getChannelForMessage(message);

      // Add transport metadata
      const enrichedMessage = {
        ...message,
        metadata: {
          ...message.metadata,
          transport: 'redis',
          channel,
          sentAt: new Date().toISOString(),
        },
      };

      await this.publisher.publish(channel, JSON.stringify(enrichedMessage));

      this.logger.debug(`Sent message to Redis channel ${channel}: ${message.type}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send Redis message: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  private getChannelForMessage(message: RelayMessage): string {
    switch (message.type) {
      case 'WORKFLOW_EXECUTION':
      case 'WORKFLOW_STATUS':
      case 'WORKFLOW_COMPLETE':
        return this.config.channels.workflowExecution;

      case 'HEARTBEAT':
        return this.config.channels.heartbeat;

      case 'SYSTEM_STATUS':
      case 'AGENT_REGISTERED':
      case 'AGENT_DISCONNECTED':
        return this.config.channels.systemEvents;

      default:
        return this.config.channels.agentCommunication;
    }
  }

  onMessage(handler: (message: RelayMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  isConnected(): boolean {
    return this._isConnected;
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      const heartbeatMessage: RelayMessage = {
        id: `heartbeat_${Date.now()}`,
        type: 'HEARTBEAT',
        source: 'redis_transport',
        payload: {
          timestamp: new Date().toISOString(),
          connections: {
            publisher: this.publisher.status,
            subscriber: this.subscriber.status,
          },
        },
        timestamp: new Date().toISOString(),
      };

      await this.send(heartbeatMessage);
    }, 30000); // Every 30 seconds
  }

  // Redis-specific methods for distributed coordination

  async setDistributedLock(key: string, value: string, ttlMs: number): Promise<boolean> {
    try {
      const result = await this.publisher.set(key, value, 'PX', ttlMs, 'NX');
      return result === 'OK';
    } catch (error) {
      this.logger.error(
        `Failed to set distributed lock: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  async releaseDistributedLock(key: string, value: string): Promise<boolean> {
    try {
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      const result = await this.publisher.eval(script, 1, key, value);
      return result === 1;
    } catch (error) {
      this.logger.error(
        `Failed to release distributed lock: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  async storeAgentState(agentId: string, state: any, ttlMs?: number): Promise<boolean> {
    try {
      const key = `agent:state:${agentId}`;
      const stateString = JSON.stringify(state);

      if (ttlMs) {
        await this.publisher.setex(key, Math.floor(ttlMs / 1000), stateString);
      } else {
        await this.publisher.set(key, stateString);
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to store agent state: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  async getAgentState(agentId: string): Promise<any | null> {
    try {
      const key = `agent:state:${agentId}`;
      const stateString = await this.publisher.get(key);
      return stateString ? JSON.parse(stateString) : null;
    } catch (error) {
      this.logger.error(
        `Failed to get agent state: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }

  async addToWorkflowQueue(workflowId: string, task: any): Promise<boolean> {
    try {
      const queueKey = `workflow:queue:${workflowId}`;
      await this.publisher.lpush(queueKey, JSON.stringify(task));
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to add to workflow queue: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  async getFromWorkflowQueue(workflowId: string): Promise<any | null> {
    try {
      const queueKey = `workflow:queue:${workflowId}`;
      const taskString = await this.publisher.rpop(queueKey);
      return taskString ? JSON.parse(taskString) : null;
    } catch (error) {
      this.logger.error(
        `Failed to get from workflow queue: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }
}
