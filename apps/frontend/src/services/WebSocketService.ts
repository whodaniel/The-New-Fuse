/**
 * WebSocket Service Module
 *
 * @description
 * Provides a comprehensive WebSocket service for real-time communication
 * between the frontend and backend services. Manages connection lifecycle,
 * event handling, reconnection logic, and agent-to-agent messaging.
 *
 * This service implements the singleton pattern to ensure consistent
 * WebSocket connections across the application and provides methods
 * for sending messages, handling events, and managing connection state.
 *
 * @since 1.0.0
 * @author Frontend Team
 * @example
 * ```typescript
 * const wsService = WebSocketService.getInstance();
 *
 * // Connect to WebSocket
 * await wsService.connect();
 *
 * // Send a message
 * await wsService.send('agent:chat', { message: 'Hello agent!' });
 *
 * // Listen for responses
 * wsService.on('agent:response', (data) => {
 *   console.log('Received response:', data);
 * });
 * ```
 */

import { EventEmitter } from 'events';
import { io, Socket } from 'socket.io-client';
import { logger } from '../utils/logger';

function resolveDefaultSocketUrl(): string {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  if (typeof window === 'undefined') return 'ws://localhost:3001';

  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${window.location.host}`;
}

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Configuration for WebSocket connection
 */
export interface WebSocketConfig {
  /** Server URL */
  url: string;
  /** Number of reconnection attempts */
  reconnectionAttempts?: number;
  /** Delay between reconnection attempts in milliseconds */
  reconnectionDelay?: number;
  /** Whether to auto-connect on instantiation */
  autoConnect?: boolean;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Authentication token for secured connections */
  authToken?: string;
  /** Additional Socket.IO options */
  socketOptions?: Record<string, any>;
}

/**
 * WebSocket event handlers
 */
export interface WebSocketEventHandlers {
  /** Connection established */
  onConnect?: () => void;
  /** Connection lost */
  onDisconnect?: (reason: string) => void;
  /** Connection error */
  onError?: (error: Error) => void;
  /** Reconnection attempt */
  onReconnectAttempt?: (attemptNumber: number) => void;
  /** Reconnection successful */
  onReconnect?: (attemptNumber: number) => void;
  /** Maximum reconnection attempts reached */
  onReconnectFailed?: () => void;
}

/**
 * Agent communication message types
 */
export interface AgentMessage {
  /** Unique message identifier */
  id: string;
  /** Sender agent ID */
  senderId: string;
  /** Receiver agent ID (optional for broadcast) */
  receiverId?: string;
  /** Message content */
  content: string;
  /** Message type */
  type: 'chat' | 'command' | 'status' | 'error';
  /** Timestamp */
  timestamp: Date;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * WebSocket service events
 */
export interface WebSocketServiceEvents {
  /** Connection state changed */
  connectionStateChanged: (connected: boolean) => void;
  /** Agent message received */
  agentMessageReceived: (message: AgentMessage) => void;
  /** System notification received */
  systemNotification: (notification: any) => void;
  /** Error occurred */
  error: (error: Error) => void;
}

// ============================================================================
// WebSocket Service Class
// ============================================================================

/**
 * Comprehensive WebSocket service for real-time communication
 *
 * @description
 * Manages WebSocket connections, event handling, message sending,
 * and reconnection logic. Provides a singleton service that can be
 * used across the entire application for consistent communication.
 *
 * @features
 * - Singleton pattern for consistent connections
 * - Automatic reconnection with exponential backoff
 * - Event-driven architecture
 * - Agent-to-agent messaging support
 * - Connection state monitoring
 * - Error handling and recovery
 * - Authentication support
 *
 * @example
 * ```typescript
 * // Basic usage
 * const wsService = WebSocketService.getInstance();
 * await wsService.connect();
 *
 * // Listen for events
 * wsService.on('agent:message', (data) => {
 *   console.log('Agent message:', data);
 * });
 *
 * // Send message
 * await wsService.send('agent:chat', {
 *   senderId: 'user-agent',
 *   content: 'Hello World!'
 * });
 * ```
 */
export class WebSocketService {
  /** Singleton instance */
  private static instance: WebSocketService;

  /** Socket.IO client instance */
  private socket: Socket;

  /** Event emitter for service-level events */
  private eventEmitter: EventEmitter;

  /** Connection configuration */
  private config: WebSocketConfig;

  /** Whether service is connecting */
  private isConnecting: boolean = false;

  /** Connection attempt counter */
  private reconnectionAttempts: number = 0;

  /** Maximum reconnection attempts */
  private maxReconnectionAttempts: number = 5;

  /** Event handler registry */
  private eventHandlers: Map<string, Set<Function>> = new Map();

  /**
   * Private constructor for singleton pattern
   *
   * @param config - WebSocket configuration options
   */
  private constructor(config: Partial<WebSocketConfig> = {}) {
    // Default configuration
    this.config = {
      url: resolveDefaultSocketUrl(),
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: false,
      timeout: 10000,
      ...config,
    };

    // Initialize event emitter
    this.eventEmitter = new EventEmitter();

    // Initialize socket with configuration
    this.socket = io(this.config.url, {
      reconnectionAttempts: this.config.reconnectionAttempts,
      reconnectionDelay: this.config.reconnectionDelay,
      autoConnect: this.config.autoConnect,
      timeout: this.config.timeout,
      auth: this.config.authToken ? { token: this.config.authToken } : undefined,
      ...this.config.socketOptions,
    });

    // Setup core event handlers
    this.setupCoreEventHandlers();
  }

  /**
   * Get the singleton instance of WebSocketService
   *
   * @description
   * Returns the existing instance or creates a new one if none exists.
   * This ensures consistent WebSocket connections across the application.
   *
   * @param config - Optional configuration for new instance
   * @returns WebSocketService singleton instance
   *
   * @example
   * ```typescript
   * const wsService = WebSocketService.getInstance();
   * // Use the service...
   * ```
   */
  static getInstance(config?: Partial<WebSocketConfig>): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService(config);
    }
    return WebSocketService.instance;
  }

  /**
   * Connect to the WebSocket server
   *
   * @description
   * Establishes connection to the WebSocket server with the configured
   * settings. Handles connection state management and error handling.
   *
   * @param eventHandlers - Optional event handlers for connection events
   * @returns Promise that resolves when connected or rejects on error
   *
   * @throws {Error} If connection fails or times out
   *
   * @example
   * ```typescript
   * await wsService.connect({
   *   onConnect: () => console.log('Connected!'),
   *   onError: (error) => console.error('Connection error:', error),
   * });
   * ```
   */
  async connect(eventHandlers: WebSocketEventHandlers = {}): Promise<void> {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting || this.socket.connected) {
      logger.warn('WebSocket connection already in progress or established');
      return Promise.resolve();
    }

    this.isConnecting = true;
    this.reconnectionAttempts = 0;

    logger.info('Connecting to WebSocket server...', {
      url: this.config.url,
      attempt: this.reconnectionAttempts + 1,
    });

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.socket.off('connect', onConnect);
        this.socket.off('connect_error', onError);
        this.isConnecting = false;
        reject(new Error('Connection timeout'));
      }, this.config.timeout!);

      const onConnect = () => {
        clearTimeout(timeoutId);
        this.isConnecting = false;
        this.reconnectionAttempts = 0;

        logger.info('WebSocket connected successfully');
        this.eventEmitter.emit('connectionStateChanged', true);

        // Call provided event handler
        eventHandlers.onConnect?.();

        resolve();
      };

      const onError = (error: Error) => {
        clearTimeout(timeoutId);
        this.isConnecting = false;

        logger.error('WebSocket connection error', error, { error: error.message });

        // Call provided event handler
        eventHandlers.onError?.(error);

        reject(error);
      };

      this.socket.once('connect', onConnect);
      this.socket.once('connect_error', onError);

      // Register provided event handlers
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        if (handler && event !== 'onConnect' && event !== 'onError') {
          this.socket.on(event.replace('on', ''), handler as any);
        }
      });

      this.socket.connect();
    });
  }

  /**
   * Disconnect from the WebSocket server
   *
   * @description
   * Gracefully disconnects from the WebSocket server and cleans up
   * event handlers and connection state.
   *
   * @param reason - Optional reason for disconnection
   *
   * @example
   * ```typescript
   * await wsService.disconnect('User logged out');
   * ```
   */
  async disconnect(reason: string = 'Manual disconnect'): Promise<void> {
    if (!this.socket.connected) {
      logger.warn('WebSocket not connected, cannot disconnect');
      return;
    }

    logger.info('Disconnecting from WebSocket server', { reason });

    // Clear all custom event handlers
    this.clearEventHandlers();

    // Disconnect socket
    this.socket.disconnect();

    // Reset state
    this.isConnecting = false;
    this.reconnectionAttempts = 0;

    // Emit connection state change
    this.eventEmitter.emit('connectionStateChanged', false);
  }

  /**
   * Send a message through the WebSocket
   *
   * @description
   * Sends a message to the server with the specified event and data.
   * Returns a promise that resolves when the message is sent successfully.
   *
   * @param event - Event name to emit
   * @param data - Data to send with the event
   * @param callback - Optional callback when server acknowledges receipt
   * @returns Promise that resolves when message is sent
   *
   * @throws {Error} If not connected or message sending fails
   *
   * @example
   * ```typescript
   * // Send agent message
   * await wsService.send('agent:message', {
   *   id: generateMessageId(),
   *   senderId: 'user-agent',
   *   content: 'Hello!',
   *   type: 'chat'
   * });
   * ```
   */
  async send(event: string, data: any, callback?: (response?: any) => void): Promise<void> {
    if (!this.socket.connected) {
      throw new Error('WebSocket not connected. Call connect() first.');
    }

    try {
      logger.debug('Sending WebSocket message', { event, data });

      return new Promise((resolve, reject) => {
        this.socket.emit(event, data, (response?: any) => {
          if (callback) {
            callback(response);
          }

          if (response && response.error) {
            reject(new Error(response.error));
          } else {
            resolve();
          }
        });
      });
    } catch (error: any) {
      logger.error(
        'Failed to send WebSocket message',
        error instanceof Error ? error : new Error(String(error)),
        { event }
      );
      throw error;
    }
  }

  /**
   * Register an event listener
   *
   * @description
   * Registers a callback function to handle messages from the server
   * with the specified event name.
   *
   * @param event - Event name to listen for
   * @param callback - Callback function to execute when event is received
   * @returns Function to remove the event listener
   *
   * @example
   * ```typescript
   * const removeListener = wsService.on('agent:message', (data) => {
   *   console.log('Received agent message:', data);
   * });
   *
   * // Remove listener when done
   * removeListener();
   * ```
   */
  on(event: string, callback: Function): () => void {
    // Register with Socket.IO
    this.socket.on(event, callback as any);

    // Register with service event emitter
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(callback);

    // Return remover function
    return () => {
      this.socket.off(event, callback as any);
      this.eventHandlers.get(event)?.delete(callback);
    };
  }

  /**
   * Remove an event listener
   *
   * @description
   * Removes a previously registered event listener.
   *
   * @param event - Event name
   * @param callback - Callback function to remove
   */
  off(event: string, callback: Function): void {
    this.socket.off(event, callback as any);
    this.eventHandlers.get(event)?.delete(callback);
  }

  /**
   * Send agent-to-agent message
   *
   * @description
   * Specialized method for sending messages between agents with
   * proper message structure and validation.
   *
   * @param message - Agent message data
   * @returns Promise that resolves when message is sent
   *
   * @example
   * ```typescript
   * await wsService.sendAgentMessage({
   *   id: generateMessageId(),
   *   senderId: 'agent-1',
   *   receiverId: 'agent-2',
   *   content: 'Hello agent 2!',
   *   type: 'chat'
   * });
   * ```
   */
  async sendAgentMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>): Promise<void> {
    const agentMessage: AgentMessage = {
      ...message,
      id: generateMessageId(),
      timestamp: new Date(),
    };

    logger.debug('Sending agent message', {
      from: agentMessage.senderId,
      to: agentMessage.receiverId || 'broadcast',
      type: agentMessage.type,
    });

    await this.send('agent:message', agentMessage);
  }

  /**
   * Get current connection status
   *
   * @description
   * Returns information about the current WebSocket connection state.
   *
   * @returns Connection status information
   *
   * @example
   * ```typescript
   * const status = wsService.getStatus();
   * console.log('Connected:', status.connected);
   * console.log('Reconnection attempts:', status.reconnectionAttempts);
   * ```
   */
  getStatus(): {
    connected: boolean;
    connecting: boolean;
    reconnectionAttempts: number;
    maxReconnectionAttempts: number;
  } {
    return {
      connected: this.socket.connected,
      connecting: this.isConnecting,
      reconnectionAttempts: this.reconnectionAttempts,
      maxReconnectionAttempts: this.maxReconnectionAttempts,
    };
  }

  /**
   * Setup core event handlers for the WebSocket connection
   *
   * @private
   */
  private setupCoreEventHandlers(): void {
    // Connection established
    this.socket.on('connect', () => {
      this.reconnectionAttempts = 0;
      logger.info('WebSocket connected');
      this.eventEmitter.emit('connectionStateChanged', true);
    });

    // Connection lost
    this.socket.on('disconnect', (reason: string) => {
      logger.warn('WebSocket disconnected', { reason });
      this.eventEmitter.emit('connectionStateChanged', false);
    });

    // Connection error
    this.socket.on('connect_error', (error: Error) => {
      this.reconnectionAttempts++;
      logger.error('WebSocket connection error', error, {
        error: error.message,
        attempt: this.reconnectionAttempts,
      });

      this.eventEmitter.emit('error', error);
    });

    // Reconnection attempt
    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      logger.info('WebSocket reconnection attempt', { attempt: attemptNumber });
      this.eventEmitter.emit('connectionStateChanged', false);
    });

    // Reconnection successful
    this.socket.on('reconnect', (attemptNumber: number) => {
      logger.info('WebSocket reconnected successfully', { attempt: attemptNumber });
      this.reconnectionAttempts = 0;
      this.eventEmitter.emit('connectionStateChanged', true);
    });

    // Reconnection failed
    this.socket.on('reconnect_failed', () => {
      logger.error('WebSocket reconnection failed after maximum attempts');
      this.eventEmitter.emit('error', new Error('Reconnection failed'));
    });

    // Core application events
    this.socket.on('agent:message', (data: AgentMessage) => {
      logger.debug('Agent message received', {
        from: data.senderId,
        to: data.receiverId,
        type: data.type,
      });
      this.eventEmitter.emit('agentMessageReceived', data);
    });

    this.socket.on('system:notification', (notification: any) => {
      logger.debug('System notification received', notification);
      this.eventEmitter.emit('systemNotification', notification);
    });

    this.socket.on('agent:status', (status: any) => {
      logger.debug('Agent status update received', status);
      // Handle agent status updates
    });
  }

  /**
   * Clear all registered event handlers
   *
   * @private
   */
  private clearEventHandlers(): void {
    this.eventHandlers.forEach((callbacks) => {
      callbacks.forEach((callback) => {
        this.socket.offAny(callback as any);
      });
    });
    this.eventHandlers.clear();
  }

  /**
   * Service-level event emitter access
   *
   * @description
   * Allows listening to service-level events like connection state changes.
   *
   * @param event - Event name
   * @param callback - Event handler
   * @returns Function to remove the listener
   */
  onServiceEvent<K extends keyof WebSocketServiceEvents>(
    event: K,
    callback: WebSocketServiceEvents[K]
  ): () => void {
    this.eventEmitter.on(event, callback as any);
    return () => this.eventEmitter.off(event, callback as any);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique message ID
 *
 * @private
 * @returns Unique message identifier string
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Export
// ============================================================================

export default WebSocketService;
