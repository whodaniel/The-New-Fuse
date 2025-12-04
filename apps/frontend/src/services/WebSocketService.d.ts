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
export declare class WebSocketService {
    /** Singleton instance */
    private static instance;
    /** Socket.IO client instance */
    private socket;
    /** Event emitter for service-level events */
    private eventEmitter;
    /** Connection configuration */
    private config;
    /** Whether service is connecting */
    private isConnecting;
    /** Connection attempt counter */
    private reconnectionAttempts;
    /** Maximum reconnection attempts */
    private maxReconnectionAttempts;
    /** Event handler registry */
    private eventHandlers;
    /**
     * Private constructor for singleton pattern
     *
     * @param config - WebSocket configuration options
     */
    private constructor();
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
    static getInstance(config?: Partial<WebSocketConfig>): WebSocketService;
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
    connect(eventHandlers?: WebSocketEventHandlers): Promise<void>;
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
    disconnect(reason?: string): Promise<void>;
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
    send(event: string, data: any, callback?: (response?: any) => void): Promise<void>;
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
    on(event: string, callback: Function): () => void;
    /**
     * Remove an event listener
     *
     * @description
     * Removes a previously registered event listener.
     *
     * @param event - Event name
     * @param callback - Callback function to remove
     */
    off(event: string, callback: Function): void;
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
    sendAgentMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>): Promise<void>;
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
    };
    /**
     * Setup core event handlers for the WebSocket connection
     *
     * @private
     */
    private setupCoreEventHandlers;
    /**
     * Clear all registered event handlers
     *
     * @private
     */
    private clearEventHandlers;
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
    onServiceEvent<K extends keyof WebSocketServiceEvents>(event: K, callback: WebSocketServiceEvents[K]): () => void;
}
export default WebSocketService;
export type { WebSocketConfig, WebSocketEventHandlers, AgentMessage, WebSocketServiceEvents, };
