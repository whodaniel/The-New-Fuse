/**
 * Universal Bridge - Unified Agent Communication Layer
 *
 * Provides a single interface for agent-to-agent communication regardless
 * of the underlying transport (WebSocket, HTTP, Redis, MCP).
 *
 * CONNECTS TO:
 * - BaseBridge: Base class for bridges (from index.ts)
 * - EventEmitter: For pub/sub communication
 * - Relay transports: WebSocket, HTTP, Redis (from relay-core)
 */

import { EventEmitter } from 'events';

import { RedisTransportAdapter } from './adapters/RedisTransportAdapter';
import { BaseBridge, MessageType, Priority } from './index';

// Universal Message Format
export interface UniversalMessage {
  id: string;
  type: MessageType;
  priority: Priority;
  source: {
    agentId: string;
    bridgeType: string;
  };
  target: {
    agentId: string;
    broadcastGroup?: string;
  };
  payload: any;
  metadata: {
    timestamp: Date;
    correlationId?: string;
    replyTo?: string;
    ttl?: number;
    encrypted?: boolean;
  };
}

// Transport adapters
export type TransportType = 'websocket' | 'http' | 'redis' | 'memory' | 'mcp';

export interface TransportAdapter {
  type: TransportType;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(message: UniversalMessage): Promise<void>;
  subscribe(pattern: string, handler: (message: UniversalMessage) => void): void;
  unsubscribe(pattern: string): void;
  isConnected(): boolean;
}

// Transport configuration
export interface TransportConfig {
  type: TransportType;
  options: Record<string, any>;
}

// Bridge configuration
export interface UniversalBridgeConfig {
  agentId: string;
  agentName?: string;
  transports: TransportConfig[];
  defaultTransport?: TransportType;
  retryAttempts?: number;
  retryDelayMs?: number;
  messageTimeout?: number;
}

/**
 * In-memory transport adapter for local/testing scenarios
 */
class MemoryTransportAdapter extends EventEmitter implements TransportAdapter {
  type: TransportType = 'memory';
  private static messageBuffer: Map<string, UniversalMessage[]> = new Map();
  private subscriptions: Map<string, (message: UniversalMessage) => void> = new Map();
  private connected = false;

  async connect(): Promise<void> {
    this.connected = true;
    this.emit('connected');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.subscriptions.clear();
    this.emit('disconnected');
  }

  async send(message: UniversalMessage): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected');
    }

    const targetId = message.target.agentId;
    const messages = MemoryTransportAdapter.messageBuffer.get(targetId) || [];
    messages.push(message);
    MemoryTransportAdapter.messageBuffer.set(targetId, messages);

    // Emit for subscribers
    this.emit(`message:${targetId}`, message);
    if (message.target.broadcastGroup) {
      this.emit(`broadcast:${message.target.broadcastGroup}`, message);
    }
  }

  subscribe(pattern: string, handler: (message: UniversalMessage) => void): void {
    this.subscriptions.set(pattern, handler);
    this.on(`message:${pattern}`, handler);
    this.on(`broadcast:${pattern}`, handler);
  }

  unsubscribe(pattern: string): void {
    const handler = this.subscriptions.get(pattern);
    if (handler) {
      this.off(`message:${pattern}`, handler);
      this.off(`broadcast:${pattern}`, handler);
      this.subscriptions.delete(pattern);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Retrieve pending messages for an agent
  getPendingMessages(agentId: string): UniversalMessage[] {
    const messages = MemoryTransportAdapter.messageBuffer.get(agentId) || [];
    MemoryTransportAdapter.messageBuffer.set(agentId, []);
    return messages;
  }
}

/**
 * WebSocket transport adapter
 */
class WebSocketTransportAdapter extends EventEmitter implements TransportAdapter {
  type: TransportType = 'websocket';
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectAttempts: number;
  private subscriptions: Map<string, (message: UniversalMessage) => void> = new Map();

  constructor(options: { url: string; reconnectAttempts?: number }) {
    super();
    this.url = options.url;
    this.reconnectAttempts = options.reconnectAttempts || 3;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Check if we're in a browser environment
        if (typeof WebSocket !== 'undefined') {
          this.socket = new WebSocket(this.url);

          this.socket.onopen = () => {
            this.emit('connected');
            resolve();
          };

          this.socket.onmessage = (event) => {
            try {
              const message = JSON.parse(event.data) as UniversalMessage;
              this.handleMessage(message);
            } catch (_error) {
              this.emit('error', new Error('Failed to parse message'));
            }
          };

          this.socket.onerror = (error) => {
            this.emit('error', error);
          };

          this.socket.onclose = () => {
            this.emit('disconnected');
          };
        } else {
          // Node.js environment - use ws package if available
          this.emit('warning', 'WebSocket not available in this environment');
          resolve(); // Continue without WebSocket
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  async send(message: UniversalMessage): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }
    this.socket.send(JSON.stringify(message));
  }

  private handleMessage(message: UniversalMessage): void {
    const handler = this.subscriptions.get(message.target.agentId);
    if (handler) {
      handler(message);
    }
    this.emit('message', message);
  }

  subscribe(pattern: string, handler: (message: UniversalMessage) => void): void {
    this.subscriptions.set(pattern, handler);
  }

  unsubscribe(pattern: string): void {
    this.subscriptions.delete(pattern);
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}

/**
 * Universal Bridge - Main implementation
 */
export class UniversalBridge extends BaseBridge {
  private config: UniversalBridgeConfig;
  private transports: Map<TransportType, TransportAdapter> = new Map();
  private pendingReplies: Map<
    string,
    { resolve: Function; reject: Function; timeout: NodeJS.Timeout }
  > = new Map();
  private messageHandlers: Map<string, (message: UniversalMessage) => void | Promise<void>> =
    new Map();

  constructor(config: UniversalBridgeConfig) {
    super(`universal-bridge-${config.agentId}`);
    this.config = {
      ...config,
      defaultTransport: config.defaultTransport || 'memory',
      retryAttempts: config.retryAttempts || 3,
      retryDelayMs: config.retryDelayMs || 1000,
      messageTimeout: config.messageTimeout || 30000,
    };
  }

  /**
   * Connect all configured transports
   */
  async connect(): Promise<void> {
    this.emit('connecting');

    for (const transportConfig of this.config.transports) {
      const adapter = this.createTransportAdapter(transportConfig);

      try {
        await adapter.connect();
        this.transports.set(transportConfig.type, adapter);

        // Subscribe to messages for this agent
        adapter.subscribe(this.config.agentId, (message) => {
          this.handleIncomingMessage(message);
        });

        this.emit('transport:connected', transportConfig.type);
      } catch (error) {
        this.emit('transport:error', { type: transportConfig.type, error });
      }
    }

    // Ensure at least one transport connected
    if (this.transports.size === 0) {
      // Fall back to memory transport
      const memoryAdapter = new MemoryTransportAdapter();
      await memoryAdapter.connect();
      this.transports.set('memory', memoryAdapter);
      memoryAdapter.subscribe(this.config.agentId, (message) => {
        this.handleIncomingMessage(message);
      });
    }

    this.isConnected = true;
    this.emit('connected');
  }

  /**
   * Disconnect all transports
   */
  async disconnect(): Promise<void> {
    for (const [type, adapter] of this.transports) {
      try {
        await adapter.disconnect();
        this.emit('transport:disconnected', type);
      } catch (error) {
        this.emit('transport:error', { type, error });
      }
    }

    this.transports.clear();
    this.pendingReplies.clear();
    this.isConnected = false;
    this.emit('disconnected');
  }

  /**
   * Send a message (implements BaseBridge)
   */
  async sendMessage(
    message: Record<string, unknown>,
    messageType: MessageType = MessageType.REQUEST,
    priority: Priority = Priority.MEDIUM
  ): Promise<void> {
    const universalMessage: UniversalMessage = {
      id: this.generateMessageId(),
      type: messageType,
      priority,
      source: {
        agentId: this.config.agentId,
        bridgeType: 'universal',
      },
      target: {
        agentId: (message.targetAgentId as string) || 'broadcast',
        broadcastGroup: message.broadcastGroup as string | undefined,
      },
      payload: message.payload ?? message,
      metadata: {
        timestamp: new Date(),
        correlationId: message.correlationId as string | undefined,
        ttl: message.ttl as number | undefined,
      },
    };

    await this.send(universalMessage);
  }

  /**
   * Send a universal message with more control
   */
  async send(message: UniversalMessage, transportType?: TransportType): Promise<void> {
    const transport = this.getTransport(transportType);

    if (!transport) {
      throw new Error(`No transport available: ${transportType || 'default'}`);
    }

    await transport.send(message);
    this.emit('message:sent', message);
  }

  /**
   * Send and wait for a reply
   */
  async sendAndWaitForReply(
    targetAgentId: string,
    payload: any,
    options?: {
      timeout?: number;
      priority?: Priority;
      transportType?: TransportType;
    }
  ): Promise<UniversalMessage> {
    const messageId = this.generateMessageId();
    const timeout = options?.timeout || this.config.messageTimeout || 30000;

    const message: UniversalMessage = {
      id: messageId,
      type: MessageType.REQUEST,
      priority: options?.priority || Priority.MEDIUM,
      source: {
        agentId: this.config.agentId,
        bridgeType: 'universal',
      },
      target: {
        agentId: targetAgentId,
      },
      payload,
      metadata: {
        timestamp: new Date(),
        correlationId: messageId,
        ttl: timeout,
      },
    };

    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pendingReplies.delete(messageId);
        reject(new Error(`Reply timeout after ${timeout}ms`));
      }, timeout);

      this.pendingReplies.set(messageId, { resolve, reject, timeout: timeoutHandle });

      this.send(message, options?.transportType).catch(reject);
    });
  }

  /**
   * Broadcast a message to all agents in a group
   */
  async broadcast(
    groupId: string,
    payload: any,
    messageType: MessageType = MessageType.EVENT
  ): Promise<void> {
    const message: UniversalMessage = {
      id: this.generateMessageId(),
      type: messageType,
      priority: Priority.MEDIUM,
      source: {
        agentId: this.config.agentId,
        bridgeType: 'universal',
      },
      target: {
        agentId: 'broadcast',
        broadcastGroup: groupId,
      },
      payload,
      metadata: {
        timestamp: new Date(),
      },
    };

    // Send via all connected transports
    const sendPromises = Array.from(this.transports.values()).map((transport) =>
      transport.send(message).catch((err) => {
        this.emit('error', err);
      })
    );

    await Promise.all(sendPromises);
    this.emit('message:broadcast', { groupId, message });
  }

  /**
   * Register a message handler
   */
  onMessage(handler: (message: UniversalMessage) => void | Promise<void>): void {
    const handlerId = `handler-${Date.now()}`;
    this.messageHandlers.set(handlerId, handler);
  }

  /**
   * Register a handler for specific message types
   */
  onMessageType(
    type: MessageType,
    handler: (message: UniversalMessage) => void | Promise<void>
  ): void {
    this.onMessage((message) => {
      if (message.type === type) {
        handler(message);
      }
    });
  }

  /**
   * Reply to a message
   */
  async reply(originalMessage: UniversalMessage, payload: any): Promise<void> {
    const replyMessage: UniversalMessage = {
      id: this.generateMessageId(),
      type: MessageType.RESPONSE,
      priority: originalMessage.priority,
      source: {
        agentId: this.config.agentId,
        bridgeType: 'universal',
      },
      target: {
        agentId: originalMessage.source.agentId,
      },
      payload,
      metadata: {
        timestamp: new Date(),
        correlationId: originalMessage.id,
        replyTo: originalMessage.id,
      },
    };

    await this.send(replyMessage);
  }

  /**
   * Get a specific transport
   */
  private getTransport(type?: TransportType): TransportAdapter | undefined {
    if (type) {
      return this.transports.get(type);
    }
    return (
      this.transports.get(this.config.defaultTransport!) || this.transports.values().next().value
    );
  }

  /**
   * Create a transport adapter based on configuration
   */
  private createTransportAdapter(config: TransportConfig): TransportAdapter {
    switch (config.type) {
      case 'memory':
        return new MemoryTransportAdapter();

      case 'websocket':
        return new WebSocketTransportAdapter({
          url: config.options.url || 'ws://localhost:8080',
          reconnectAttempts: config.options.reconnectAttempts,
        });

      case 'http':
        // HTTP adapter would make REST calls
        return new MemoryTransportAdapter(); // Fallback for now

      case 'redis':
        return new RedisTransportAdapter({
          redisUrl: config.options.redisUrl,
          serialization: config.options.serialization,
        });

      case 'mcp':
        // MCP adapter would use Model Context Protocol
        return new MemoryTransportAdapter(); // Fallback for now

      default:
        return new MemoryTransportAdapter();
    }
  }

  /**
   * Handle incoming messages
   */
  private handleIncomingMessage(message: UniversalMessage): void {
    this.emit('message:received', message);

    // Check if this is a reply to a pending request
    if (message.metadata.replyTo) {
      const pending = this.pendingReplies.get(message.metadata.replyTo);
      if (pending) {
        clearTimeout(pending.timeout);
        pending.resolve(message);
        this.pendingReplies.delete(message.metadata.replyTo);
        return;
      }
    }

    // Invoke all registered handlers
    for (const handler of this.messageHandlers.values()) {
      try {
        const result = handler(message);
        if (result instanceof Promise) {
          result.catch((err) => this.emit('error', err));
        }
      } catch (error) {
        this.emit('error', error);
      }
    }
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    return `msg-${this.config.agentId}-${Date.now()}-${globalThis.crypto.randomUUID().split('-')[0]}`;
  }

  /**
   * Get bridge statistics
   */
  getStats(): {
    agentId: string;
    connectedTransports: TransportType[];
    pendingReplies: number;
    handlerCount: number;
  } {
    return {
      agentId: this.config.agentId,
      connectedTransports: Array.from(this.transports.keys()),
      pendingReplies: this.pendingReplies.size,
      handlerCount: this.messageHandlers.size,
    };
  }
}

export default UniversalBridge;
