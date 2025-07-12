// Optimized WebSocket Service - Connection pooling, message batching, and performance optimization
// Handles real-time communication for multi-agent systems with intelligent load balancing
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OptimizedWebSocketService_1;
import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { RedisCacheService } from '../../cache/src/redis-cache.service';
export var MessagePriority;
(function (MessagePriority) {
    MessagePriority[MessagePriority["CRITICAL"] = 1] = "CRITICAL";
    MessagePriority[MessagePriority["HIGH"] = 2] = "HIGH";
    MessagePriority[MessagePriority["MEDIUM"] = 3] = "MEDIUM";
    MessagePriority[MessagePriority["LOW"] = 4] = "LOW";
    MessagePriority[MessagePriority["BATCH"] = 5] = "BATCH";
})(MessagePriority || (MessagePriority = {}));
export var MessageType;
(function (MessageType) {
    MessageType["AGENT_STATUS"] = "agent_status";
    MessageType["WORKFLOW_UPDATE"] = "workflow_update";
    MessageType["TASK_PROGRESS"] = "task_progress";
    MessageType["NOTIFICATION"] = "notification";
    MessageType["SYSTEM_ALERT"] = "system_alert";
    MessageType["CHAT_MESSAGE"] = "chat_message";
    MessageType["ANALYTICS_DATA"] = "analytics_data";
    MessageType["HEARTBEAT"] = "heartbeat";
    MessageType["BATCH_DATA"] = "batch_data";
})(MessageType || (MessageType = {}));
let OptimizedWebSocketService = OptimizedWebSocketService_1 = class OptimizedWebSocketService {
    constructor(configService, cacheService) {
        this.configService = configService;
        this.cacheService = cacheService;
        this.logger = new Logger(OptimizedWebSocketService_1.name);
        this.connectionPools = new Map();
        this.messageBatches = new Map();
        this.metrics = {
            totalConnections: 0,
            activeConnections: 0,
            messagesPerSecond: 0,
            averageLatency: 0,
            errorRate: 0,
            bandwidthUsage: 0,
        };
        // Configuration for message batching and optimization
        this.config = {
            batchSize: 50, // Maximum messages per batch
            batchTimeout: 100, // Batch timeout in milliseconds
            maxMessageQueueSize: 1000, // Max queued messages per user
            connectionPoolTimeout: 300000, // 5 minutes idle timeout
            heartbeatInterval: 30000, // 30 seconds
            maxConnectionsPerUser: 5, // Connection limit per user
            compressionThreshold: 1024, // Compress messages larger than 1KB
            rateLimitWindow: 60000, // 1 minute rate limit window
            rateLimitMax: 100, // Max messages per window
        };
        this.batchTimers = new Map();
    }
    async onModuleInit() {
        this.startHeartbeat();
        this.startMetricsCollection();
        this.startConnectionPoolCleanup();
        this.logger.log('Optimized WebSocket Service initialized');
    }
    async handleConnection(client) {
        try {
            const userId = await this.authenticateConnection(client);
            if (!userId) {
                client.disconnect();
                return;
            }
            // Add to connection pool
            await this.addToConnectionPool(userId, client);
            // Set up client event handlers
            this.setupClientHandlers(client, userId);
            this.metrics.totalConnections++;
            this.metrics.activeConnections++;
            this.logger.log(`Client connected: ${client.id} for user: ${userId}`);
            // Send connection acknowledgment
            await this.sendMessage(client, {
                id: this.generateMessageId(),
                type: MessageType.SYSTEM_ALERT,
                payload: { status: 'connected', userId },
                timestamp: Date.now(),
                priority: MessagePriority.HIGH,
            });
        }
        catch (error) {
            this.logger.error('Connection error:', error);
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        const userId = client.data.userId;
        if (userId) {
            await this.removeFromConnectionPool(userId, client);
            this.logger.log(`Client disconnected: ${client.id} for user: ${userId}`);
        }
        this.metrics.activeConnections--;
    }
    async authenticateConnection(client) {
        try {
            const token = client.handshake.auth.token || client.handshake.headers.authorization;
            if (!token) {
                this.logger.warn(`Connection attempt without token: ${client.id}`);
                return null;
            }
            // Implement your JWT verification logic here
            // For now, we'll extract userId from token (implement proper JWT verification)
            const userId = this.extractUserIdFromToken(token);
            if (!userId) {
                this.logger.warn(`Invalid token for connection: ${client.id}`);
                return null;
            }
            client.data.userId = userId;
            return userId;
        }
        catch (error) {
            this.logger.error('Authentication error:', error);
            return null;
        }
    }
    async addToConnectionPool(userId, client) {
        let pool = this.connectionPools.get(userId);
        if (!pool) {
            pool = {
                userId,
                connections: new Set(),
                lastActivity: Date.now(),
                messageQueue: [],
                isActive: true,
            };
            this.connectionPools.set(userId, pool);
        }
        // Enforce connection limit per user
        if (pool.connections.size >= this.config.maxConnectionsPerUser) {
            const oldestConnection = Array.from(pool.connections)[0];
            oldestConnection.disconnect();
            pool.connections.delete(oldestConnection);
        }
        pool.connections.add(client);
        pool.lastActivity = Date.now();
        pool.isActive = true;
        // Process any queued messages
        if (pool.messageQueue.length > 0) {
            await this.flushMessageQueue(userId);
        }
    }
    async removeFromConnectionPool(userId, client) {
        const pool = this.connectionPools.get(userId);
        if (pool) {
            pool.connections.delete(client);
            if (pool.connections.size === 0) {
                pool.isActive = false;
                pool.lastActivity = Date.now();
            }
        }
    }
    setupClientHandlers(client, userId) {
        // Handle incoming messages from client
        client.on('message', async (data) => {
            try {
                await this.handleClientMessage(client, userId, data);
            }
            catch (error) {
                this.logger.error('Error handling client message:', error);
            }
        });
        // Handle ping/pong for connection health
        client.on('ping', () => {
            client.emit('pong');
            this.updateConnectionActivity(userId);
        });
        // Handle client errors
        client.on('error', (error) => {
            this.logger.error(`Client error for user ${userId}:`, error);
        });
    }
    async handleClientMessage(client, userId, data) {
        this.updateConnectionActivity(userId);
        // Implement rate limiting
        const rateLimit = await this.checkRateLimit(userId);
        if (!rateLimit.allowed) {
            client.emit('error', { message: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter });
            return;
        }
        // Process the message based on type
        switch (data.type) {
            case 'agent_command':
                await this.handleAgentCommand(userId, data.payload);
                break;
            case 'workflow_action':
                await this.handleWorkflowAction(userId, data.payload);
                break;
            case 'chat_message':
                await this.handleChatMessage(userId, data.payload);
                break;
            default:
                this.logger.warn(`Unknown message type from client: ${data.type}`);
        }
    }
    // Send message with intelligent batching and optimization
    async sendMessage(target, message) {
        try {
            if (typeof target === 'string') {
                // Send to user ID
                return await this.sendToUser(target, message);
            }
            else {
                // Send to specific socket
                return await this.sendToSocket(target, message);
            }
        }
        catch (error) {
            this.logger.error('Error sending message:', error);
            return false;
        }
    }
    async sendToUser(userId, message) {
        const pool = this.connectionPools.get(userId);
        if (!pool || pool.connections.size === 0) {
            // Queue message if user is offline
            await this.queueMessage(userId, message);
            return false;
        }
        // Determine if message should be batched
        if (this.shouldBatchMessage(message)) {
            await this.addToBatch(userId, message);
            return true;
        }
        // Send immediately for high-priority messages
        let sent = false;
        for (const connection of pool.connections) {
            if (connection.connected) {
                await this.sendToSocket(connection, message);
                sent = true;
            }
        }
        return sent;
    }
    async sendToSocket(socket, message) {
        try {
            if (!socket.connected) {
                return false;
            }
            // Compress large messages
            let payload = message;
            if (JSON.stringify(message).length > this.config.compressionThreshold) {
                payload = await this.compressMessage(message);
            }
            socket.emit('message', payload);
            this.updateMetrics('messageSent');
            return true;
        }
        catch (error) {
            this.logger.error('Error sending to socket:', error);
            return false;
        }
    }
    // Message batching logic
    shouldBatchMessage(message) {
        return message.priority >= MessagePriority.MEDIUM && !message.requiresAck;
    }
    async addToBatch(userId, message) {
        const batchKey = `${userId}_batch`;
        let batch = this.messageBatches.get(batchKey);
        if (!batch) {
            batch = {
                messages: [],
                totalSize: 0,
                batchId: this.generateMessageId(),
                timestamp: Date.now(),
            };
            this.messageBatches.set(batchKey, batch);
        }
        batch.messages.push(message);
        batch.totalSize += JSON.stringify(message).length;
        // Send batch if it reaches size limit or timeout
        if (batch.messages.length >= this.config.batchSize ||
            batch.totalSize > this.config.compressionThreshold) {
            await this.flushBatch(userId);
        }
        else {
            // Set or reset batch timer
            this.setBatchTimer(userId);
        }
    }
    setBatchTimer(userId) {
        const batchKey = `${userId}_batch`;
        const existingTimer = this.batchTimers.get(batchKey);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        const timer = setTimeout(async () => {
            await this.flushBatch(userId);
        }, this.config.batchTimeout);
        this.batchTimers.set(batchKey, timer);
    }
    async flushBatch(userId) {
        const batchKey = `${userId}_batch`;
        const batch = this.messageBatches.get(batchKey);
        if (!batch || batch.messages.length === 0) {
            return;
        }
        const batchMessage = {
            id: batch.batchId,
            type: MessageType.BATCH_DATA,
            payload: {
                messages: batch.messages,
                batchId: batch.batchId,
                count: batch.messages.length,
            },
            timestamp: Date.now(),
            priority: MessagePriority.MEDIUM,
        };
        await this.sendToUser(userId, batchMessage);
        // Clean up
        this.messageBatches.delete(batchKey);
        const timer = this.batchTimers.get(batchKey);
        if (timer) {
            clearTimeout(timer);
            this.batchTimers.delete(batchKey);
        }
        this.logger.debug(`Flushed batch of ${batch.messages.length} messages for user: ${userId}`);
    }
    // Broadcast methods
    async broadcastToAllUsers(message) {
        let sentCount = 0;
        for (const [userId] of this.connectionPools) {
            const sent = await this.sendToUser(userId, message);
            if (sent)
                sentCount++;
        }
        return sentCount;
    }
    async broadcastToAgents(agentIds, message) {
        // Implementation for broadcasting to specific agents
        // This would lookup users associated with agents and send messages
        return 0; // Placeholder
    }
    // Message queue management
    async queueMessage(userId, message) {
        let pool = this.connectionPools.get(userId);
        if (!pool) {
            pool = {
                userId,
                connections: new Set(),
                lastActivity: Date.now(),
                messageQueue: [],
                isActive: false,
            };
            this.connectionPools.set(userId, pool);
        }
        // Enforce queue size limit
        if (pool.messageQueue.length >= this.config.maxMessageQueueSize) {
            pool.messageQueue.shift(); // Remove oldest message
        }
        pool.messageQueue.push(message);
        // Cache important messages
        if (message.priority <= MessagePriority.HIGH) {
            await this.cacheService.set(`queued_message:${userId}:${message.id}`, message, { ttl: 3600 });
        }
    }
    async flushMessageQueue(userId) {
        const pool = this.connectionPools.get(userId);
        if (!pool || pool.messageQueue.length === 0) {
            return;
        }
        const messages = [...pool.messageQueue];
        pool.messageQueue = [];
        for (const message of messages) {
            await this.sendToUser(userId, message);
        }
        this.logger.debug(`Flushed ${messages.length} queued messages for user: ${userId}`);
    }
    // Utility methods
    async checkRateLimit(userId) {
        const key = `rate_limit:${userId}`;
        const current = await this.cacheService.get(key) || 0;
        if (current >= this.config.rateLimitMax) {
            return { allowed: false, retryAfter: this.config.rateLimitWindow };
        }
        await this.cacheService.set(key, current + 1, { ttl: this.config.rateLimitWindow / 1000 });
        return { allowed: true };
    }
    async compressMessage(message) {
        // Simple compression placeholder - implement actual compression if needed
        return {
            ...message,
            payload: {
                compressed: true,
                data: JSON.stringify(message.payload),
            },
        };
    }
    updateConnectionActivity(userId) {
        const pool = this.connectionPools.get(userId);
        if (pool) {
            pool.lastActivity = Date.now();
        }
    }
    updateMetrics(event) {
        // Update internal metrics based on events
        switch (event) {
            case 'messageSent':
                // Increment message counter
                break;
            case 'messageReceived':
                // Increment received counter
                break;
        }
    }
    startHeartbeat() {
        this.heartbeatInterval = setInterval(async () => {
            const heartbeatMessage = {
                id: this.generateMessageId(),
                type: MessageType.HEARTBEAT,
                payload: { timestamp: Date.now() },
                timestamp: Date.now(),
                priority: MessagePriority.LOW,
            };
            for (const [userId, pool] of this.connectionPools) {
                if (pool.isActive && pool.connections.size > 0) {
                    await this.sendToUser(userId, heartbeatMessage);
                }
            }
        }, this.config.heartbeatInterval);
    }
    startMetricsCollection() {
        this.metricsInterval = setInterval(() => {
            this.collectMetrics();
        }, 60000); // Collect metrics every minute
    }
    startConnectionPoolCleanup() {
        setInterval(() => {
            this.cleanupInactivePools();
        }, this.config.connectionPoolTimeout);
    }
    collectMetrics() {
        this.metrics.totalConnections = Array.from(this.connectionPools.values())
            .reduce((sum, pool) => sum + pool.connections.size, 0);
        this.metrics.activeConnections = Array.from(this.connectionPools.values())
            .filter(pool => pool.isActive)
            .reduce((sum, pool) => sum + pool.connections.size, 0);
    }
    cleanupInactivePools() {
        const now = Date.now();
        const toRemove = [];
        for (const [userId, pool] of this.connectionPools) {
            if (!pool.isActive &&
                (now - pool.lastActivity) > this.config.connectionPoolTimeout) {
                toRemove.push(userId);
            }
        }
        toRemove.forEach(userId => {
            this.connectionPools.delete(userId);
            this.logger.debug(`Cleaned up inactive pool for user: ${userId}`);
        });
    }
    // Handler implementations
    async handleAgentCommand(userId, payload) {
        // Implement agent command handling
    }
    async handleWorkflowAction(userId, payload) {
        // Implement workflow action handling
    }
    async handleChatMessage(userId, payload) {
        // Implement chat message handling
    }
    extractUserIdFromToken(token) {
        // Implement JWT token extraction
        // This is a placeholder - implement proper JWT verification
        return 'user_123';
    }
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async getConnectionMetrics() {
        return this.metrics;
    }
    async onModuleDestroy() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
        }
        // Clear all batch timers
        for (const timer of this.batchTimers.values()) {
            clearTimeout(timer);
        }
        this.logger.log('WebSocket service shutdown complete');
    }
};
__decorate([
    WebSocketServer(),
    __metadata("design:type", Server)
], OptimizedWebSocketService.prototype, "server", void 0);
OptimizedWebSocketService = OptimizedWebSocketService_1 = __decorate([
    Injectable(),
    WebSocketGateway({
        cors: {
            origin: '*',
            credentials: true,
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000,
    }),
    __metadata("design:paramtypes", [ConfigService,
        RedisCacheService])
], OptimizedWebSocketService);
export { OptimizedWebSocketService };
//# sourceMappingURL=optimized-websocket.service.js.map