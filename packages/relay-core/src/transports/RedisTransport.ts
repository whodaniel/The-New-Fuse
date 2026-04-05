
/**
 * Redis Transport for The New Fuse Relay System
 * 
 * Provides pub/sub messaging and distributed coordination
 * Based on existing Redis infrastructure in src/redis/
 */

import { EventEmitter } from 'events';
import { Transport, RelayMessage } from '../types/index.js';
import { Logger } from '../utils/Logger.js';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';

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
  private redisService: UnifiedRedisService;
  private logger: Logger;
  private _isConnected: boolean = false;
  private messageHandlers: ((message: RelayMessage) => void)[] = [];
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(config: RedisTransportConfig, redisService: UnifiedRedisService) {
    super();
    this.config = config;
    this.logger = config.logger;
    this.redisService = redisService;
    
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Subscriptions are handled in start()
  }

  private async setupChannelSubscriptions(): Promise<void> {
    try {
      const channels = Object.values(this.config.channels);
      for (const channel of channels) {
        await this.redisService.subscribe(channel, (message) => {
          const payload = typeof message.message === 'string' ? message.message : JSON.stringify(message.message);
          this.handleRedisMessage(message.channel, payload);
        });
      }
      this.logger.info(`Subscribed to Redis channels: ${channels.join(', ')}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to channels: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private handleRedisMessage(channel: string, messageString: string): void {
    try {
      const message: RelayMessage = JSON.parse(messageString);
      
      this.logger.debug(`Received Redis message on ${channel}: ${message.type} from ${message.source}`);
      
      // Add Redis-specific metadata
      message.metadata = {
        ...message.metadata,
        transport: 'redis',
        channel,
        receivedAt: new Date().toISOString()
      };

      // Notify message handlers
      this.messageHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          this.logger.error(`Error in message handler: ${error instanceof Error ? error.message : String(error)}`);
        }
      });

    } catch (error) {
      this.logger.error(`Failed to parse Redis message: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async start(): Promise<boolean> {
    try {
      this.logger.info('Starting Redis transport');
      
      // Setup channel subscriptions
      await this.setupChannelSubscriptions();

      // Start heartbeat
      this.startHeartbeat();
      
      this._isConnected = true;
      this.emit('connected');

      this.logger.info('Redis transport started successfully');
      return true;
    } catch (error) {
      this.logger.error(`Failed to start Redis transport: ${error instanceof Error ? error.message : String(error)}`);
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

      this._isConnected = false;
      this.emit('disconnected');
      this.logger.info('Redis transport stopped');
    } catch (error) {
      this.logger.error(`Error stopping Redis transport: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async send(message: RelayMessage): Promise<boolean> {
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
          sentAt: new Date().toISOString()
        }
      };

      await this.redisService.publish(channel, JSON.stringify(enrichedMessage));
      
      this.logger.debug(`Sent message to Redis channel ${channel}: ${message.type}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send Redis message: ${error instanceof Error ? error.message : String(error)}`);
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
          status: 'online'
        },
        timestamp: new Date().toISOString()
      };

      await this.send(heartbeatMessage);
    }, 30000); // Every 30 seconds
  }

  // Redis-specific methods for distributed coordination

  async setDistributedLock(key: string, value: string, ttlMs: number): Promise<boolean> {
    try {
      const result = await this.redisService.set(key, value, ttlMs, 'NX', 'PX');
      return result === 'OK';
    } catch (error) {
      this.logger.error(`Failed to set distributed lock: ${error instanceof Error ? error.message : String(error)}`);
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
      const result = await this.redisService.eval(script, [key], [value]);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to release distributed lock: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  async storeAgentState(agentId: string, state: any, ttlMs?: number): Promise<boolean> {
    try {
      const key = `agent:state:${agentId}`;
      const stateString = JSON.stringify(state);
      
      if (ttlMs) {
        await this.redisService.set(key, stateString, ttlMs, undefined, 'PX');
      } else {
        await this.redisService.set(key, stateString);
      }
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to store agent state: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  async getAgentState(agentId: string): Promise<any | null> {
    try {
      const key = `agent:state:${agentId}`;
      const stateString = await this.redisService.get(key);
      return stateString ? JSON.parse(stateString) : null;
    } catch (error) {
      this.logger.error(`Failed to get agent state: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  async addToWorkflowQueue(workflowId: string, task: any): Promise<boolean> {
    try {
      const queueKey = `workflow:queue:${workflowId}`;
      await this.redisService.lpush(queueKey, JSON.stringify(task));
      return true;
    } catch (error) {
      this.logger.error(`Failed to add to workflow queue: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  async getFromWorkflowQueue(workflowId: string): Promise<any | null> {
    try {
      const queueKey = `workflow:queue:${workflowId}`;
      const taskString = await this.redisService.rpop(queueKey);
      return taskString ? JSON.parse(taskString) : null;
    } catch (error) {
      this.logger.error(`Failed to get from workflow queue: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
}
