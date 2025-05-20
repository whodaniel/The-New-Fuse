import { EventEmitter } from 'events';
import { ICommunicationProtocol, Message, ProtocolOptions } from './ICommunicationProtocol.js';

/**
 * WebSocket-based communication protocol implementation
 * Uses WebSockets for real-time bidirectional communication between agents
 */
export class WebSocketCommunicationProtocol extends EventEmitter implements ICommunicationProtocol {
  private agentId: string;
  private messageHandlers: Map<string, (message: Message) => void>;
  private isListening: boolean;
  private debug: boolean;
  private socket: WebSocket | null;
  private serverUrl: string;
  private reconnectAttempts: number;
  private maxReconnectAttempts: number;
  private reconnectDelay: number;
  private reconnectTimeoutId: NodeJS.Timeout | null;
  private autoReconnect: boolean;
  private pingInterval: NodeJS.Timeout | null;
  private retryOptions: {
    maxRetries: number;
    initialDelay: number;
    backoffMultiplier: number;
  };

  constructor(options: ProtocolOptions & { 
    serverUrl: string;
    autoReconnect?: boolean;
    maxReconnectAttempts?: number;
    reconnectDelay?: number;
    pingIntervalMs?: number;
  }) {
    super();
    this.agentId = options.agentId;
    this.messageHandlers = new Map();
    this.isListening = false;
    this.debug = options.debug || false;
    this.socket = null;
    this.serverUrl = options.serverUrl;
    this.autoReconnect = options.autoReconnect !== false; // Default to true
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.reconnectAttempts = 0;
    this.reconnectTimeoutId = null;
    this.pingInterval = null;
    this.retryOptions = options.retryOptions || {
      maxRetries: 3,
      initialDelay: 1000,
      backoffMultiplier: 1.5,
    };
  }

  /**
   * Initialize the protocol
   */
  async initialize(): Promise<void> {
    this.log('Initializing WebSocket communication protocol');
    
    // Register default message handler
    this.onMessageType('default', this.defaultMessageHandler.bind(this));
    
    this.log('WebSocket communication protocol initialized');
    
    return Promise.resolve();
  }

  /**
   * Start listening for messages
   */
  startListening(): void {
    if (this.isListening) {
      this.log('Already listening for messages');
      return;
    }
    
    this.log('Starting to listen for messages...');
    this.connectWebSocket();
    this.isListening = true;
  }

  /**
   * Stop listening for messages
   */
  stopListening(): void {
    if (!this.isListening) {
      return;
    }
    
    this.log('Stopping message listener');
    
    // Clear any reconnection attempts
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    
    // Clear ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    // Close WebSocket connection
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      this.socket.close();
    }
    
    this.socket = null;
    this.isListening = false;
  }

  /**
   * Send a message to another agent
   */
  async sendMessage(
    target: string, 
    content: any, 
    type: string = 'text', 
    conversationId: string | null = null
  ): Promise<Message> {
    // Create message object
    const message: Message = this.createMessage(target, content, type, conversationId);
    
    // Check if WebSocket is connected
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      if (!this.isListening) {
        throw new Error('WebSocket is not connected. Call startListening() first.');
      }
      
      // Try to reconnect
      if (this.autoReconnect && !this.reconnectTimeoutId) {
        this.reconnect();
      }
      
      // Queue message to send later
      this.once('connected', () => {
        this.sendMessageToSocket(message);
      });
    } else {
      // Send message immediately
      this.sendMessageToSocket(message);
    }
    
    this.log(`Message sent to ${target}:`, content);
    
    // Emit event for internal tracking
    this.emit('messageSent', message);
    
    return message;
  }

  /**
   * Send a response to a received message
   */
  async sendResponse(originalMessage: Message, content: any): Promise<Message> {
    return this.sendMessage(
      originalMessage.source,
      content,
      'response',
      originalMessage.metadata?.conversationId
    );
  }

  /**
   * Register a handler for all messages
   */
  onMessageReceived(handler: (message: Message) => void): void {
    this.on('messageReceived', handler);
  }

  /**
   * Register a handler for a specific message type
   */
  onMessageType(type: string, handler: (message: Message) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Get transport information
   */
  getTransportInfo(): { type: string; details: any } {
    return {
      type: 'websocket',
      details: {
        serverUrl: this.serverUrl,
        connected: this.socket?.readyState === WebSocket.OPEN,
        reconnectAttempts: this.reconnectAttempts
      }
    };
  }

  /**
   * Create a message object
   */
  private createMessage(
    target: string, 
    content: any, 
    type: string = 'text', 
    conversationId: string | null = null
  ): Message {
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      source: this.agentId,
      target,
      content,
      metadata: {
        type,
        conversationId: conversationId || `conv_${Date.now()}`,
        protocol: 'a2a-v1'
      }
    };
  }

  /**
   * Connect to WebSocket server
   */
  private connectWebSocket(): void {
    try {
      this.log(`Connecting to WebSocket server: ${this.serverUrl}`);
      
      this.socket = new WebSocket(this.serverUrl);
      
      this.socket.onopen = this.handleSocketOpen.bind(this);
      this.socket.onmessage = this.handleSocketMessage.bind(this);
      this.socket.onclose = this.handleSocketClose.bind(this);
      this.socket.onerror = this.handleSocketError.bind(this);
    } catch (error) {
      this.log('Error connecting to WebSocket:', error);
      if (this.autoReconnect) {
        this.reconnect();
      }
    }
  }

  /**
   * Handle WebSocket open event
   */
  private handleSocketOpen(): void {
    this.log('WebSocket connected');
    this.reconnectAttempts = 0;
    
    // Start ping/pong to keep connection alive
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping', source: this.agentId, timestamp: Date.now() }));
      }
    }, 30000); // Send ping every 30 seconds
    
    // Emit connected event
    this.emit('connected');
    
    // Register agent with server
    this.socket?.send(JSON.stringify({
      type: 'register',
      source: this.agentId,
      timestamp: Date.now()
    }));
  }

  /**
   * Handle WebSocket message event
   */
  private handleSocketMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      // Handle special message types
      if (data.type === 'pong') {
        this.log('Received pong from server');
        return;
      }
      
      if (data.type === 'system') {
        this.handleSystemMessage(data);
        return;
      }
      
      // Handle regular message
      if (data.target === this.agentId || data.target === 'broadcast') {
        this.processMessage(data);
      }
    } catch (error) {
      this.log('Error processing message:', error);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleSocketClose(event: CloseEvent): void {
    this.log(`WebSocket closed: ${event.code} - ${event.reason}`);
    
    // Clear ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    // Auto reconnect if enabled
    if (this.isListening && this.autoReconnect) {
      this.reconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleSocketError(error: Event): void {
    this.log('WebSocket error:', error);
    
    // Error event is typically followed by close event, which will handle reconnection
  }

  /**
   * Handle system messages
   */
  private handleSystemMessage(message: any): void {
    this.log('Received system message:', message);
    
    switch (message.subtype) {
      case 'welcome':
        this.log('Connected to server:', message.content);
        break;
      
      case 'error':
        this.log('Server error:', message.content);
        break;
      
      case 'notification':
        this.emit('notification', message.content);
        break;
      
      default:
        this.log('Unknown system message type:', message);
    }
  }

  /**
   * Send a message through the WebSocket
   */
  private sendMessageToSocket(message: Message): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.log('Cannot send message, socket not connected');
      return;
    }
    
    try {
      this.socket.send(JSON.stringify(message));
    } catch (error) {
      this.log('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  private reconnect(): void {
    if (this.reconnectTimeoutId) {
      return; // Already attempting to reconnect
    }
    
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      this.log(`Max reconnect attempts (${this.maxReconnectAttempts}) reached, giving up`);
      this.emit('reconnectFailed');
      return;
    }
    
    const delay = this.calculateReconnectDelay();
    this.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeoutId = setTimeout(() => {
      this.reconnectTimeoutId = null;
      this.connectWebSocket();
    }, delay);
  }

  /**
   * Calculate reconnection delay with exponential backoff
   */
  private calculateReconnectDelay(): number {
    return Math.min(
      30000, // Max 30 seconds
      this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1)
    );
  }

  /**
   * Process a received message
   */
  private processMessage(message: Message): void {
    this.log(`Received message from ${message.source}:`, message.content);
    
    // Emit generic message event
    this.emit('messageReceived', message);
    
    // Find appropriate handler based on message type
    const type = message.metadata?.type || 'default';
    const handler = this.messageHandlers.get(type) || this.messageHandlers.get('default');
    
    if (handler) {
      try {
        handler(message);
      } catch (err) {
        console.error(`Error in message handler for type ${type}:`, err);
      }
    } else {
      this.log(`No handler found for message type: ${type}`);
    }
  }

  /**
   * Default message handler (can be overridden)
   */
  private defaultMessageHandler(message: Message): void {
    this.log('Default handler processing message:', message);
    // By default, we don't auto-respond
  }

  /**
   * Utility method for logging
   */
  private log(...args: any[]): void {
    if (this.debug) {
      console.log(`[${this.agentId} WebSocket]`, ...args);
    }
  }
}