/**
 * WebSocket Real-Time Communication Types
 *
 * Comprehensive type definitions for WebSocket-based real-time
 * communication with The New Fuse AI Agent framework.
 */
export interface WebSocketConnection {
    id: string;
    connectionId: string;
    userId?: string;
    agentId?: string;
    protocol?: string;
    origin?: string;
    userAgent?: string;
    ipAddress?: string;
    status: WebSocketStatus;
    connectedAt: Date;
    lastPingAt?: Date;
    lastPongAt?: Date;
    disconnectedAt?: Date;
    subscriptions: string[];
    permissions: string[];
    messagesSent: number;
    messagesReceived: number;
    bytesTransferred: bigint;
    socket?: any;
}
export interface WebSocketMessage {
    id: string;
    connectionId: string;
    type: string;
    data: Record<string, any>;
    direction: WebSocketDirection;
    timestamp: Date;
    processedAt?: Date;
    size?: number;
    compressed: boolean;
    binary: boolean;
    error?: string;
    errorCode?: string;
}
export interface WebSocketRoom {
    id: string;
    name: string;
    description?: string;
    isPrivate: boolean;
    requiresAuth: boolean;
    allowedUsers?: string[];
    allowedAgents?: string[];
    maxConnections?: number;
    messageHistory: boolean;
    historyLimit?: number;
    connections: Set<string>;
    createdAt: Date;
    lastActivity: Date;
    totalMessages: number;
    activeConnections: number;
}
export interface WebSocketChannel {
    id: string;
    name: string;
    pattern: string;
    persistent: boolean;
    broadcastToAll: boolean;
    requiresSubscription: boolean;
    permissions: string[];
    subscribers: Set<string>;
    messageQueue: WebSocketMessage[];
    createdAt: Date;
    lastMessageAt?: Date;
}
export declare enum WebSocketStatus {
    CONNECTING = "CONNECTING",
    CONNECTED = "CONNECTED",
    DISCONNECTED = "DISCONNECTED",
    ERROR = "ERROR"
}
export declare enum WebSocketDirection {
    INBOUND = "INBOUND",
    OUTBOUND = "OUTBOUND"
}
export declare enum WebSocketMessageType {
    CONNECT = "connect",
    DISCONNECT = "disconnect",
    PING = "ping",
    PONG = "pong",
    JOIN_ROOM = "join_room",
    LEAVE_ROOM = "leave_room",
    ROOM_MESSAGE = "room_message",
    SUBSCRIBE = "subscribe",
    UNSUBSCRIBE = "unsubscribe",
    CHANNEL_MESSAGE = "channel_message",
    AGENT_MESSAGE = "agent_message",
    AGENT_STATUS = "agent_status",
    AGENT_COMMAND = "agent_command",
    AGENT_RESPONSE = "agent_response",
    SYSTEM_NOTIFICATION = "system_notification",
    SYSTEM_ALERT = "system_alert",
    SYSTEM_BROADCAST = "system_broadcast",
    DATA_STREAM = "data_stream",
    FILE_TRANSFER = "file_transfer",
    CUSTOM = "custom"
}
export interface WebSocketManager {
    /**
     * Create new WebSocket connection
     */
    createConnection(socket: any, connectionId: string, options?: {
        userId?: string;
        agentId?: string;
        protocol?: string;
        permissions?: string[];
    }): Promise<WebSocketConnection>;
    /**
     * Close WebSocket connection
     */
    closeConnection(connectionId: string, reason?: string): Promise<boolean>;
    /**
     * Send message to specific connection
     */
    sendToConnection(connectionId: string, message: Omit<WebSocketMessage, 'id' | 'connectionId' | 'timestamp' | 'direction'>): Promise<boolean>;
    /**
     * Broadcast message to multiple connections
     */
    broadcast(message: Omit<WebSocketMessage, 'id' | 'connectionId' | 'timestamp' | 'direction'>, targets: {
        connectionIds?: string[];
        userIds?: string[];
        agentIds?: string[];
        rooms?: string[];
        channels?: string[];
        permissions?: string[];
    }): Promise<WebSocketBroadcastResult>;
    /**
     * Join room
     */
    joinRoom(connectionId: string, roomId: string, password?: string): Promise<boolean>;
    /**
     * Leave room
     */
    leaveRoom(connectionId: string, roomId: string): Promise<boolean>;
    /**
     * Subscribe to channel
     */
    subscribeToChannel(connectionId: string, channelId: string, filters?: Record<string, any>): Promise<boolean>;
    /**
     * Unsubscribe from channel
     */
    unsubscribeFromChannel(connectionId: string, channelId: string): Promise<boolean>;
    /**
     * Get active connections
     */
    getActiveConnections(filters?: {
        userId?: string;
        agentId?: string;
        room?: string;
        channel?: string;
    }): Promise<WebSocketConnection[]>;
    /**
     * Get connection metrics
     */
    getConnectionMetrics(): Promise<WebSocketMetrics>;
    /**
     * Cleanup dead connections
     */
    cleanupConnections(): Promise<number>;
}
export interface WebSocketBroadcastResult {
    totalTargeted: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    deliveredTo: string[];
    errors: Array<{
        connectionId: string;
        error: string;
    }>;
}
export interface WebSocketMetrics {
    totalConnections: number;
    activeConnections: number;
    totalMessages: number;
    messagesPerSecond: number;
    connectionsByType: {
        user: number;
        agent: number;
        system: number;
    };
    messagesByType: Record<string, number>;
    messagesByDirection: Record<WebSocketDirection, number>;
    activeRooms: number;
    activeChannels: number;
    totalSubscriptions: number;
    averageMessageSize: number;
    totalBytesTransferred: bigint;
    peakConcurrentConnections: number;
    connectionErrors: number;
    messageErrors: number;
    connectionsToday: number;
    messagesToday: number;
    disconnectionsToday: number;
}
export interface WebSocketRoomManager {
    /**
     * Create room
     */
    createRoom(options: {
        name: string;
        description?: string;
        isPrivate?: boolean;
        requiresAuth?: boolean;
        maxConnections?: number;
        messageHistory?: boolean;
        historyLimit?: number;
        allowedUsers?: string[];
        allowedAgents?: string[];
    }): Promise<WebSocketRoom>;
    /**
     * Delete room
     */
    deleteRoom(roomId: string): Promise<boolean>;
    /**
     * Get room info
     */
    getRoomInfo(roomId: string): Promise<WebSocketRoom | null>;
    /**
     * List available rooms
     */
    listRooms(filters?: {
        isPrivate?: boolean;
        requiresAuth?: boolean;
        hasConnections?: boolean;
    }): Promise<WebSocketRoom[]>;
    /**
     * Get room history
     */
    getRoomHistory(roomId: string, limit?: number, before?: Date): Promise<WebSocketMessage[]>;
    /**
     * Update room settings
     */
    updateRoom(roomId: string, updates: Partial<WebSocketRoom>): Promise<WebSocketRoom>;
}
export interface WebSocketChannelManager {
    /**
     * Create channel
     */
    createChannel(options: {
        name: string;
        pattern: string;
        persistent?: boolean;
        broadcastToAll?: boolean;
        requiresSubscription?: boolean;
        permissions?: string[];
    }): Promise<WebSocketChannel>;
    /**
     * Delete channel
     */
    deleteChannel(channelId: string): Promise<boolean>;
    /**
     * Get channel info
     */
    getChannelInfo(channelId: string): Promise<WebSocketChannel | null>;
    /**
     * List channels
     */
    listChannels(filters?: {
        persistent?: boolean;
        hasSubscribers?: boolean;
        pattern?: string;
    }): Promise<WebSocketChannel[]>;
    /**
     * Publish to channel
     */
    publishToChannel(channelId: string, message: Omit<WebSocketMessage, 'id' | 'connectionId' | 'timestamp' | 'direction'>): Promise<WebSocketBroadcastResult>;
}
export interface WebSocketAuth {
    /**
     * Authenticate connection
     */
    authenticate(socket: any, token?: string): Promise<{
        isAuthenticated: boolean;
        userId?: string;
        agentId?: string;
        permissions: string[];
        error?: string;
    }>;
    /**
     * Check permissions
     */
    hasPermission(connectionId: string, permission: string): Promise<boolean>;
    /**
     * Update permissions
     */
    updatePermissions(connectionId: string, permissions: string[]): Promise<boolean>;
}
export interface WebSocketMiddleware {
    /**
     * Authentication middleware
     */
    authenticate(socket: any, next: Function): Promise<void>;
    /**
     * Authorization middleware
     */
    authorize(requiredPermissions: string[]): (socket: any, next: Function) => Promise<void>;
    /**
     * Rate limiting middleware
     */
    rateLimit(options: {
        maxMessagesPerMinute?: number;
        maxConnectionsPerIP?: number;
        windowMs?: number;
    }): (socket: any, next: Function) => Promise<void>;
    /**
     * Message validation middleware
     */
    validateMessage(schema: Record<string, any>): (socket: any, message: any, next: Function) => Promise<void>;
}
export interface WebSocketEventHandlers {
    /**
     * Connection event handler
     */
    onConnection: (connection: WebSocketConnection) => Promise<void>;
    /**
     * Disconnection event handler
     */
    onDisconnection: (connection: WebSocketConnection, reason?: string) => Promise<void>;
    /**
     * Message event handler
     */
    onMessage: (connection: WebSocketConnection, message: WebSocketMessage) => Promise<void>;
    /**
     * Error event handler
     */
    onError: (connection: WebSocketConnection, error: Error) => Promise<void>;
    /**
     * Room join event handler
     */
    onRoomJoin: (connection: WebSocketConnection, roomId: string) => Promise<void>;
    /**
     * Room leave event handler
     */
    onRoomLeave: (connection: WebSocketConnection, roomId: string) => Promise<void>;
    /**
     * Channel subscribe event handler
     */
    onChannelSubscribe: (connection: WebSocketConnection, channelId: string) => Promise<void>;
    /**
     * Channel unsubscribe event handler
     */
    onChannelUnsubscribe: (connection: WebSocketConnection, channelId: string) => Promise<void>;
}
export interface WebSocketConfiguration {
    port: number;
    host: string;
    maxConnections: number;
    connectionTimeout: number;
    maxMessageSize: number;
    compressionEnabled: boolean;
    binaryMessagesEnabled: boolean;
    pingInterval: number;
    pongTimeout: number;
    requireAuthentication: boolean;
    allowedOrigins: string[];
    rateLimitEnabled: boolean;
    maxMessagesPerMinute: number;
    maxConnectionsPerIP: number;
    roomsEnabled: boolean;
    channelsEnabled: boolean;
    messageHistoryEnabled: boolean;
    defaultHistoryLimit: number;
    clusteringEnabled: boolean;
    redisAdapter?: {
        host: string;
        port: number;
        password?: string;
    };
}
//# sourceMappingURL=websocket-types.d.ts.map