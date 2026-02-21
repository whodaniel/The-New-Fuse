import { ConfigService } from '../config/ConfigService.js';
import { ICommunicationProtocol, ProtocolOptions } from './ICommunicationProtocol.js';
import { FileCommunicationProtocol } from './FileCommunicationProtocol.js';
import { RedisCommunicationProtocol } from './RedisCommunicationProtocol.js';
import { WebSocketCommunicationProtocol } from './WebSocketCommunicationProtocol.js';

/**
 * Protocol type enum
 */
export enum ProtocolType {
  FILE = 'file',
  REDIS = 'redis',
  WEBSOCKET = 'websocket'
}

/**
 * Extended protocol options for factory
 */
export interface ProtocolFactoryOptions extends ProtocolOptions {
  type?: ProtocolType;
  config?: ConfigService;
  // Protocol-specific options
  communicationDir?: string; // For file protocol
  redisUrl?: string; // For Redis protocol
  redisPrefix?: string; // For Redis protocol
  serverUrl?: string; // For WebSocket protocol
  // Generic options
  retryOptions?: {
    maxRetries: number;
    initialDelay: number;
    backoffMultiplier: number;
  };
}

/**
 * Protocol factory for creating protocol instances
 * 
 * This factory simplifies the creation of protocol implementations
 * by providing a unified interface and handling configuration.
 */
export class ProtocolFactory {
  private configService: ConfigService | null;
  
  constructor(configService?: ConfigService) {
    this.configService = configService || null;
  }
  
  /**
   * Create a protocol implementation based on options
   */
  createProtocol(options: ProtocolFactoryOptions): ICommunicationProtocol {
    // Determine protocol type
    const protocolType = options.type || this.getDefaultProtocolType();
    
    // Create protocol instance
    switch (protocolType) {
      case ProtocolType.FILE:
        return this.createFileProtocol(options);
      
      case ProtocolType.REDIS:
        return this.createRedisProtocol(options);
      
      case ProtocolType.WEBSOCKET:
        return this.createWebSocketProtocol(options);
      
      default:
        throw new Error(`Unsupported protocol type: ${protocolType}`);
    }
  }
  
  /**
   * Create a file-based protocol implementation
   */
  private createFileProtocol(options: ProtocolFactoryOptions): FileCommunicationProtocol {
    const communicationDir = options.communicationDir || 
      this.getConfigValue('communication.file.directory', './agent-communication');
    
    return new FileCommunicationProtocol({
      agentId: options.agentId,
      communicationDir,
      debug: options.debug || false,
      retryOptions: options.retryOptions || this.getDefaultRetryOptions()
    });
  }
  
  /**
   * Create a Redis-based protocol implementation
   */
  private createRedisProtocol(options: ProtocolFactoryOptions): RedisCommunicationProtocol {
    const redisUrl = options.redisUrl || 
      this.getConfigValue('communication.redis.url', 'redis://localhost:6379');
    
    const redisPrefix = options.redisPrefix || 
      this.getConfigValue('communication.redis.prefix', 'the-new-fuse:');
    
    return new RedisCommunicationProtocol({
      agentId: options.agentId,
      redisUrl,
      channelPrefix: redisPrefix,
      debug: options.debug || false,
      retryOptions: options.retryOptions || this.getDefaultRetryOptions()
    });
  }
  
  /**
   * Create a WebSocket-based protocol implementation
   */
  private createWebSocketProtocol(options: ProtocolFactoryOptions): WebSocketCommunicationProtocol {
    const serverUrl = options.serverUrl || 
      this.getConfigValue('communication.websocket.url', 'ws://localhost:8080');
    
    return new WebSocketCommunicationProtocol({
      agentId: options.agentId,
      serverUrl,
      debug: options.debug || false,
      retryOptions: options.retryOptions || this.getDefaultRetryOptions(),
      autoReconnect: true
    });
  }
  
  /**
   * Get default protocol type from configuration
   */
  private getDefaultProtocolType(): ProtocolType {
    const defaultType = this.getConfigValue('communication.defaultProtocol', 'file');
    
    // Convert string to enum
    switch (defaultType.toLowerCase()) {
      case 'file':
        return ProtocolType.FILE;
      case 'redis':
        return ProtocolType.REDIS;
      case 'websocket':
        return ProtocolType.WEBSOCKET;
      default:
        return ProtocolType.FILE; // Default fallback
    }
  }
  
  /**
   * Get default retry options from configuration
   */
  private getDefaultRetryOptions(): { maxRetries: number; initialDelay: number; backoffMultiplier: number } {
    return {
      maxRetries: this.getConfigValue('a2a.retryOptions.maxRetries', 3),
      initialDelay: this.getConfigValue('a2a.retryOptions.initialDelayMs', 1000),
      backoffMultiplier: this.getConfigValue('a2a.retryOptions.backoffMultiplier', 1.5)
    };
  }
  
  /**
   * Get a value from configuration or return default
   */
  private getConfigValue<T>(key: string, defaultValue: T): T {
    if (!this.configService) {
      return defaultValue;
    }
    
    return this.configService.get<T>(key, defaultValue);
  }
}