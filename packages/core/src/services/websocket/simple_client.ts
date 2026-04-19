import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { Logger } from 'winston';

enum ClientState {
  INITIALIZING = 'INITIALIZING',
  BROADCASTING = 'BROADCASTING',
  LISTENING = 'LISTENING',
}

interface ClientConfig {
  redis: {
    host: string;
    port: number;
    db: number;
  };
}

export class SimpleWebSocketClient {
  private state: ClientState = ClientState.INITIALIZING;
  private redisService: UnifiedRedisService;
  private logger: Logger;
  private config: any;

  constructor(config: any, logger: Logger, redisService: UnifiedRedisService) {
    this.config = config;
    this.logger = logger;
    this.redisService = redisService;
  }

  async initialize(): Promise<void> {
    try {
      this.state = ClientState.LISTENING;
      this.logger.info('WebSocket client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize WebSocket client', { error });
      throw error;
    }
  }

  async sendMessage(channel: string, message: any): Promise<void> {
    try {
      await this.redisService.publish(channel, JSON.stringify(message));
      this.logger.info('Message sent successfully', { channel });
    } catch (error) {
      this.logger.error('Failed to send message', { error, channel });
      throw error;
    }
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      await this.redisService.subscribe(channel, (message) => {
        try {
        const messageStr = typeof message.message === 'string' ? message.message : JSON.stringify(message.message);
        const parsedMessage = JSON.parse(messageStr);
          callback(parsedMessage);
        } catch (error) {
          this.logger.error('Failed to parse message', { error, message: message.message });
        }
      });
      this.logger.info('Subscribed to channel', { channel });
    } catch (error) {
      this.logger.error('Failed to subscribe to channel', { error, channel });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      this.logger.info('WebSocket client disconnected');
    } catch (error) {
      this.logger.error('Error during disconnect', { error });
    }
  }
}
