/**
 * Communication Bridge - Inter-agent communication
 *
 * Provides communication capabilities between agents:
 * - Direct messaging
 * - Broadcast messaging
 * - Request/Response patterns
 * - Event streaming
 * - Channel subscriptions
 */

import { BaseBridge, MessageType, Priority } from './index.js';

// ============================================================
// COMMUNICATION TYPES
// ============================================================

export interface Message {
  id: string;
  from: string;
  to: string | 'broadcast';
  channel?: string;
  type: MessageType;
  priority: Priority;
  payload: unknown;
  timestamp: Date;
  correlationId?: string;
  replyTo?: string;
  ttl?: number;
}

export interface Channel {
  name: string;
  subscribers: Set<string>;
  messageCount: number;
  createdAt: Date;
}

export interface PendingRequest {
  messageId: string;
  resolve: (response: Message) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

// ============================================================
// COMMUNICATION BRIDGE
// ============================================================

export class CommunicationBridge extends BaseBridge {
  private channels: Map<string, Channel> = new Map();
  private subscribers: Map<string, (message: Message) => void> = new Map();
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private messageHistory: Message[] = [];
  private maxHistorySize = 1000;
  private defaultTimeout = 30000;

  constructor() {
    super('communication-bridge');
  }

  async connect(): Promise<void> {
    this.emit('connecting');
    this.isConnected = true;
    this.emit('connected');
  }

  async disconnect(): Promise<void> {
    // Cancel all pending requests
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Bridge disconnected'));
    }
    this.pendingRequests.clear();

    this.isConnected = false;
    this.emit('disconnected');
  }

  async sendMessage(
    message: Record<string, unknown>,
    messageType: MessageType = MessageType.COMMAND,
    priority: Priority = Priority.MEDIUM
  ): Promise<void> {
    const fullMessage = this.createMsg(
      message.from as string,
      message.to as string,
      message.payload as unknown,
      messageType,
      priority
    );

    if (message.channel) {
      fullMessage.channel = message.channel as string;
    }

    await this.send(fullMessage);
  }

  // ============================================================
  // MESSAGING
  // ============================================================

  /**
   * Create a message
   */
  createMsg(
    from: string,
    to: string | 'broadcast',
    payload: unknown,
    type: MessageType = MessageType.COMMAND,
    priority: Priority = Priority.MEDIUM
  ): Message {
    return {
      id: `msg-${Date.now()}-${globalThis.crypto.randomUUID().split('-')[0]}`,
      from,
      to,
      type,
      priority,
      payload,
      timestamp: new Date(),
    };
  }

  /**
   * Send a message
   */
  async send(message: Message): Promise<void> {
    // Add to history
    this.addToHistory(message);

    // Broadcast message
    if (message.to === 'broadcast') {
      this.broadcast(message);
      return;
    }

    // Channel message
    if (message.channel) {
      this.sendToChannel(message.channel, message);
      return;
    }

    // Direct message
    const handler = this.subscribers.get(message.to);
    if (handler) {
      handler(message);
    }

    this.emit('message:sent', message);
  }

  /**
   * Send and wait for response
   */
  async request(message: Message, timeout = this.defaultTimeout): Promise<Message> {
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(message.id);
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);

      this.pendingRequests.set(message.id, {
        messageId: message.id,
        resolve,
        reject,
        timeout: timeoutHandle,
      });

      message.replyTo = message.from;
      this.send(message).catch(reject);
    });
  }

  /**
   * Reply to a message
   */
  async reply(originalMessage: Message, payload: unknown): Promise<void> {
    const response = this.createMsg(
      originalMessage.to === 'broadcast' ? 'system' : (originalMessage.to as string),
      originalMessage.from,
      payload,
      MessageType.RESPONSE
    );
    response.correlationId = originalMessage.id;

    // Check for pending request
    const pending = this.pendingRequests.get(originalMessage.id);
    if (pending) {
      clearTimeout(pending.timeout);
      pending.resolve(response);
      this.pendingRequests.delete(originalMessage.id);
    } else {
      await this.send(response);
    }
  }

  /**
   * Broadcast a message to all subscribers
   */
  private broadcast(message: Message): void {
    for (const [id, handler] of this.subscribers) {
      if (id !== message.from) {
        handler(message);
      }
    }
    this.emit('message:broadcast', message);
  }

  // ============================================================
  // SUBSCRIPTIONS
  // ============================================================

  /**
   * Subscribe to messages
   */
  subscribe(agentId: string, handler: (message: Message) => void): void {
    this.subscribers.set(agentId, handler);
    this.emit('subscriber:added', { agentId });
  }

  /**
   * Unsubscribe from messages
   */
  unsubscribe(agentId: string): void {
    this.subscribers.delete(agentId);

    // Remove from all channels
    for (const channel of this.channels.values()) {
      channel.subscribers.delete(agentId);
    }

    this.emit('subscriber:removed', { agentId });
  }

  // ============================================================
  // CHANNELS
  // ============================================================

  /**
   * Create a channel
   */
  createChannel(name: string): Channel {
    if (this.channels.has(name)) {
      return this.channels.get(name)!;
    }

    const channel: Channel = {
      name,
      subscribers: new Set(),
      messageCount: 0,
      createdAt: new Date(),
    };

    this.channels.set(name, channel);
    this.emit('channel:created', channel);
    return channel;
  }

  /**
   * Delete a channel
   */
  deleteChannel(name: string): void {
    this.channels.delete(name);
    this.emit('channel:deleted', { name });
  }

  /**
   * Join a channel
   */
  joinChannel(channelName: string, agentId: string): void {
    let channel = this.channels.get(channelName);
    if (!channel) {
      channel = this.createChannel(channelName);
    }

    channel.subscribers.add(agentId);
    this.emit('channel:joined', { channelName, agentId });
  }

  /**
   * Leave a channel
   */
  leaveChannel(channelName: string, agentId: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.subscribers.delete(agentId);
      this.emit('channel:left', { channelName, agentId });
    }
  }

  /**
   * Send to a channel
   */
  private sendToChannel(channelName: string, message: Message): void {
    const channel = this.channels.get(channelName);
    if (!channel) return;

    channel.messageCount++;

    for (const subscriberId of channel.subscribers) {
      if (subscriberId !== message.from) {
        const handler = this.subscribers.get(subscriberId);
        if (handler) {
          handler(message);
        }
      }
    }

    this.emit('channel:message', { channelName, message });
  }

  /**
   * Get channel info
   */
  getChannel(name: string): Channel | undefined {
    return this.channels.get(name);
  }

  /**
   * List all channels
   */
  listChannels(): Channel[] {
    return Array.from(this.channels.values());
  }

  // ============================================================
  // HISTORY
  // ============================================================

  /**
   * Add message to history
   */
  private addToHistory(message: Message): void {
    this.messageHistory.push(message);

    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory = this.messageHistory.slice(-this.maxHistorySize / 2);
    }
  }

  /**
   * Get message history
   */
  getHistory(agentId?: string, limit = 100): Message[] {
    let messages = this.messageHistory;

    if (agentId) {
      messages = messages.filter((m) => m.from === agentId || m.to === agentId);
    }

    return messages.slice(-limit);
  }

  // ============================================================
  // STATISTICS
  // ============================================================

  getStatistics(): {
    connected: boolean;
    subscribers: number;
    channels: number;
    pendingRequests: number;
    historySize: number;
  } {
    return {
      connected: this.isConnected,
      subscribers: this.subscribers.size,
      channels: this.channels.size,
      pendingRequests: this.pendingRequests.size,
      historySize: this.messageHistory.length,
    };
  }
}

export default CommunicationBridge;
