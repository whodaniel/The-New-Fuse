/**
 * Base Bridge - Abstract base class for all bridges
 *
 * Provides common functionality and interface for all bridge implementations.
 * All bridges should extend this class for consistent behavior.
 */

import { EventEmitter } from 'events';

import { MessageType, Priority } from './index';

// ============================================================
// BASE TYPES
// ============================================================

export interface BridgeMessage {
  id: string;
  type: MessageType;
  priority: Priority;
  payload: unknown;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface BridgeConfig {
  name: string;
  autoConnect?: boolean;
  reconnectOnFailure?: boolean;
  reconnectDelayMs?: number;
  maxReconnectAttempts?: number;
  heartbeatIntervalMs?: number;
}

export interface BridgeStats {
  connected: boolean;
  messagesSent: number;
  messagesReceived: number;
  errors: number;
  uptime: number;
  lastActivity: Date | null;
}

// ============================================================
// BASE BRIDGE CLASS
// ============================================================

export abstract class Bridge extends EventEmitter {
  protected name: string;
  protected config: BridgeConfig;
  protected isConnected: boolean = false;
  protected stats: BridgeStats;
  protected startTime: Date | null = null;
  protected heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  protected reconnectAttempts = 0;

  constructor(config: BridgeConfig) {
    super();
    this.name = config.name;
    this.config = {
      autoConnect: true,
      reconnectOnFailure: true,
      reconnectDelayMs: 5000,
      maxReconnectAttempts: 5,
      heartbeatIntervalMs: 30000,
      ...config,
    };
    this.stats = {
      connected: false,
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      uptime: 0,
      lastActivity: null,
    };

    if (this.config.autoConnect) {
      this.connect().catch((err) => this.emit('error', err));
    }
  }

  // ============================================================
  // ABSTRACT METHODS (must be implemented by subclasses)
  // ============================================================

  /**
   * Connect to the bridge endpoint
   */
  abstract connect(): Promise<void>;

  /**
   * Disconnect from the bridge endpoint
   */
  abstract disconnect(): Promise<void>;

  /**
   * Send a message through the bridge
   */
  abstract send(message: BridgeMessage): Promise<void>;

  /**
   * Handle an incoming message
   */
  abstract handleMessage(message: BridgeMessage): Promise<void>;

  // ============================================================
  // COMMON METHODS
  // ============================================================

  /**
   * Get bridge name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Check if connected
   */
  getConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get bridge statistics
   */
  getStats(): BridgeStats {
    return {
      ...this.stats,
      connected: this.isConnected,
      uptime: this.startTime ? (Date.now() - this.startTime.getTime()) / 1000 : 0,
    };
  }

  /**
   * Create a message with standard fields
   */
  createMessage(
    type: MessageType,
    payload: unknown,
    priority: Priority = Priority.MEDIUM
  ): BridgeMessage {
    return {
      id: `${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      priority,
      payload,
      timestamp: new Date(),
    };
  }

  /**
   * Send a message with tracking
   */
  async sendMessage(
    message: Record<string, unknown>,
    type: MessageType = MessageType.COMMAND,
    priority: Priority = Priority.MEDIUM
  ): Promise<void> {
    const bridgeMessage = this.createMessage(type, message, priority);
    await this.send(bridgeMessage);
    this.stats.messagesSent++;
    this.stats.lastActivity = new Date();
  }

  /**
   * Process received message
   */
  protected async processMessage(message: BridgeMessage): Promise<void> {
    this.stats.messagesReceived++;
    this.stats.lastActivity = new Date();
    this.emit('message', message);
    await this.handleMessage(message);
  }

  /**
   * Start heartbeat
   */
  protected startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.sendHeartbeat();
      } catch (error) {
        this.emit('error', error);
      }
    }, this.config.heartbeatIntervalMs);
  }

  /**
   * Stop heartbeat
   */
  protected stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Send heartbeat
   */
  protected async sendHeartbeat(): Promise<void> {
    const heartbeatMessage = this.createMessage(
      MessageType.HEARTBEAT,
      { bridgeName: this.name, timestamp: new Date() },
      Priority.LOW
    );
    await this.send(heartbeatMessage);
    this.emit('heartbeat', heartbeatMessage);
  }

  /**
   * Handle connection established
   */
  protected onConnected(): void {
    this.isConnected = true;
    this.stats.connected = true;
    this.startTime = new Date();
    this.reconnectAttempts = 0;
    this.startHeartbeat();
    this.emit('connected');
  }

  /**
   * Handle disconnection
   */
  protected onDisconnected(): void {
    this.isConnected = false;
    this.stats.connected = false;
    this.stopHeartbeat();
    this.emit('disconnected');

    if (this.config.reconnectOnFailure) {
      this.attemptReconnect();
    }
  }

  /**
   * Attempt reconnection
   */
  protected async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 5)) {
      this.emit('reconnect:failed', { attempts: this.reconnectAttempts });
      return;
    }

    this.reconnectAttempts++;
    this.emit('reconnecting', { attempt: this.reconnectAttempts });

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        this.emit('error', error);
        await this.attemptReconnect();
      }
    }, this.config.reconnectDelayMs);
  }

  /**
   * Handle error
   */
  protected onError(error: Error): void {
    this.stats.errors++;
    this.emit('error', error);
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.stopHeartbeat();
    await this.disconnect();
    this.removeAllListeners();
  }
}

export default Bridge;
