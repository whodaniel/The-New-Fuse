/**
 * MCP Client Implementation
 *
 * Main MCP client class that provides a complete implementation of the IMCPClient
 * interface with connection management, request handling, and resource access.
 */
import { EventEmitter } from 'events';
import { ConnectionStatus } from '../interfaces/IMCPConnection';
import { MCPErrorClass, MCPErrorCode } from '../types/error';
import { ConnectionManager } from './ConnectionManager';
import { RequestManager } from './RequestManager';
import { EventManager } from './EventManager';
import { ClientCache } from './ClientCache';
/**
 * MCP Client implementation
 */
export class MCPClient extends EventEmitter {
    config;
    connectionManager;
    requestManager;
    eventManager;
    cache;
    currentEndpoint = null;
    isInitialized = false;
    startTime = new Date();
    statistics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        totalConnections: 0,
        activeConnections: 0,
        connectionFailures: 0,
        dataSent: 0,
        dataReceived: 0,
        startTime: this.startTime
    };
    constructor(config) {
        super();
        this.config = config;
        this.connectionManager = new ConnectionManager();
        this.requestManager = new RequestManager(config.timeout, config.retryPolicy, config.options?.maxQueueSize);
        this.eventManager = new EventManager();
        this.cache = new ClientCache({
            maxSize: 1000,
            defaultTTL: config.options?.cacheTTL || 300000,
            cleanupInterval: 60000,
            enableStatistics: true
        });
        this.setupEventHandlers();
        this.isInitialized = true;
    }
    /**
     * Setup internal event handlers
     */
    setupEventHandlers() {
        // Connection manager events
        this.connectionManager.on('connectionCreated', (endpoint) => {
            this.statistics.totalConnections++;
            this.emit('connectionCreated', endpoint);
        });
        this.connectionManager.on('connectionClosed', (endpoint) => {
            this.statistics.activeConnections = Math.max(0, this.statistics.activeConnections - 1);
            this.emit('connectionClosed', endpoint);
        });
        this.connectionManager.on('connectionError', (endpoint, error) => {
            this.statistics.connectionFailures++;
            this.emit('connectionError', endpoint, error);
        });
        // Request manager events
        this.requestManager.on('requestSent', (requestId, retryCount) => {
            this.statistics.totalRequests++;
            this.emit('requestSent', requestId, retryCount);
        });
        this.requestManager.on('requestCompleted', (requestId) => {
            this.statistics.successfulRequests++;
            this.emit('requestCompleted', requestId);
        });
        this.requestManager.on('requestFailed', (requestId, error) => {
            this.statistics.failedRequests++;
            this.emit('requestFailed', requestId, error);
        });
        this.requestManager.on('notification', (notification) => {
            this.eventManager.handleNotification(notification);
        });
        // Event manager events
        this.eventManager.on('notification', (notification) => {
            this.emit('notification', notification);
        });
    }
    /**
     * Connect to an MCP server endpoint
     */
    async connect(endpoint, options) {
        if (!this.isInitialized) {
            throw new MCPErrorClass(MCPErrorCode.INTERNAL_ERROR, 'Client not initialized');
        }
        const connectionOptions = {
            timeout: this.config.timeout,
            retryAttempts: this.config.retryPolicy.maxAttempts,
            retryDelay: this.config.retryPolicy.baseDelay,
            keepAlive: true,
            ...options
        };
        try {
            const connection = await this.connectionManager.createConnection(endpoint, connectionOptions);
            this.requestManager.setConnection(connection);
            this.currentEndpoint = endpoint;
            this.statistics.activeConnections++;
            // Cache server capabilities
            try {
                const capabilities = await this.getServerCapabilities();
                this.cache.cacheCapabilities(endpoint, capabilities);
            }
            catch (error) {
                // Non-fatal error, continue with connection
                this.emit('warning', 'Failed to cache server capabilities', error);
            }
            this.emit('connected', endpoint);
        }
        catch (error) {
            this.statistics.connectionFailures++;
            throw error;
        }
    }
    /**
     * Disconnect from the MCP server
     */
    async disconnect() {
        if (this.currentEndpoint) {
            await this.connectionManager.closeConnection(this.currentEndpoint);
            this.requestManager.setConnection(null);
            this.currentEndpoint = null;
            this.statistics.activeConnections = 0;
            this.emit('disconnected');
        }
    }
    /**
     * Send a request to the connected MCP server
     */
    async sendRequest(request) {
        if (!this.isConnected()) {
            throw new MCPErrorClass(MCPErrorCode.SERVICE_UNAVAILABLE, 'Client not connected');
        }
        const startTime = Date.now();
        try {
            const response = await this.requestManager.sendRequest(request);
            // Update response time statistics
            const responseTime = Date.now() - startTime;
            this.updateAverageResponseTime(responseTime);
            return response;
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Subscribe to notifications from the MCP server
     */
    subscribeToNotifications(callback) {
        this.eventManager.subscribeToAll(callback);
    }
    /**
     * List available resources from the MCP server
     */
    async listResources(pattern) {
        const request = {
            jsonrpc: '2.0',
            id: this.generateRequestId(),
            method: 'resources/list',
            params: pattern ? { pattern } : {}
        };
        const response = await this.sendRequest(request);
        if (response.error) {
            throw new MCPErrorClass(response.error.code, response.error.message, response.error.data);
        }
        return response.result?.resources || [];
    }
    /**
     * Read content from a specific resource
     */
    async readResource(uri) {
        // Check cache first
        if (this.config.options?.enableCaching) {
            const cached = this.cache.getResource(uri);
            if (cached) {
                return cached;
            }
        }
        const request = {
            jsonrpc: '2.0',
            id: this.generateRequestId(),
            method: 'resources/read',
            params: { uri }
        };
        const response = await this.sendRequest(request);
        if (response.error) {
            throw new MCPErrorClass(response.error.code, response.error.message, response.error.data);
        }
        const content = response.result;
        // Cache the result
        if (this.config.options?.enableCaching) {
            this.cache.cacheResource(uri, content);
        }
        return content;
    }
    /**
     * Call a tool on the MCP server
     */
    async callTool(name, params) {
        // Check cache first for deterministic tools
        if (this.config.options?.enableCaching) {
            const cached = this.cache.getToolResult(name, params);
            if (cached) {
                return cached;
            }
        }
        const request = {
            jsonrpc: '2.0',
            id: this.generateRequestId(),
            method: 'tools/call',
            params: { name, arguments: params }
        };
        const response = await this.sendRequest(request);
        if (response.error) {
            throw new MCPErrorClass(response.error.code, response.error.message, response.error.data);
        }
        const result = response.result;
        // Cache successful results for deterministic tools
        if (this.config.options?.enableCaching && result.success) {
            this.cache.cacheToolResult(name, params, result);
        }
        return result;
    }
    /**
     * Get server capabilities
     */
    async getServerCapabilities() {
        if (!this.currentEndpoint) {
            throw new MCPErrorClass(MCPErrorCode.SERVICE_UNAVAILABLE, 'Not connected to any server');
        }
        // Check cache first
        if (this.config.options?.enableCaching) {
            const cached = this.cache.getCapabilities(this.currentEndpoint);
            if (cached) {
                return cached;
            }
        }
        const request = {
            jsonrpc: '2.0',
            id: this.generateRequestId(),
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: {
                    name: this.config.name,
                    version: this.config.version
                }
            }
        };
        const response = await this.sendRequest(request);
        if (response.error) {
            throw new MCPErrorClass(response.error.code, response.error.message, response.error.data);
        }
        const capabilities = response.result?.capabilities || [];
        // Cache the capabilities
        if (this.config.options?.enableCaching) {
            this.cache.cacheCapabilities(this.currentEndpoint, capabilities);
        }
        return capabilities;
    }
    /**
     * Check if the client is currently connected
     */
    isConnected() {
        return this.currentEndpoint !== null &&
            this.connectionManager.getConnectionStatus(this.currentEndpoint) === ConnectionStatus.CONNECTED;
    }
    /**
     * Get the current connection endpoint
     */
    getEndpoint() {
        return this.currentEndpoint;
    }
    /**
     * Send a notification to the server (fire-and-forget)
     */
    async sendNotification(notification) {
        if (!this.isConnected()) {
            throw new MCPErrorClass(MCPErrorCode.SERVICE_UNAVAILABLE, 'Client not connected');
        }
        await this.requestManager.sendNotification(notification);
    }
    /**
     * Subscribe to specific notification methods
     */
    subscribeToMethod(method, callback) {
        return this.eventManager.subscribeToMethod(method, callback);
    }
    /**
     * Subscribe to notifications matching a pattern
     */
    subscribeToPattern(pattern, callback) {
        return this.eventManager.subscribeToPattern(pattern, callback);
    }
    /**
     * Unsubscribe from notifications
     */
    unsubscribe(subscriptionId) {
        return this.eventManager.unsubscribe(subscriptionId);
    }
    /**
     * Wait for a specific notification
     */
    waitForNotification(pattern, timeout) {
        return this.eventManager.waitForNotification(pattern, timeout);
    }
    /**
     * Get client statistics
     */
    getStatistics() {
        return {
            ...this.statistics,
            lastRequestTime: this.statistics.totalRequests > 0 ? new Date() : undefined
        };
    }
    /**
     * Get client status
     */
    getStatus() {
        return {
            name: this.config.name,
            connectionStatus: this.currentEndpoint ?
                this.connectionManager.getConnectionStatus(this.currentEndpoint) :
                ConnectionStatus.DISCONNECTED,
            endpoint: this.currentEndpoint || undefined,
            lastActivity: this.statistics.lastRequestTime,
            statistics: this.getStatistics()
        };
    }
    /**
     * Get cache statistics
     */
    getCacheStatistics() {
        return this.cache.getStatistics();
    }
    /**
     * Clear client cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Ping the server
     */
    async ping() {
        if (!this.currentEndpoint) {
            throw new MCPErrorClass(MCPErrorCode.SERVICE_UNAVAILABLE, 'Not connected');
        }
        const connection = this.connectionManager.getConnection(this.currentEndpoint);
        if (!connection) {
            throw new MCPErrorClass(MCPErrorCode.SERVICE_UNAVAILABLE, 'Connection not available');
        }
        return await connection.ping();
    }
    /**
     * Generate a unique request ID
     */
    generateRequestId() {
        return `${this.config.name}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    /**
     * Update average response time
     */
    updateAverageResponseTime(responseTime) {
        const totalRequests = this.statistics.successfulRequests;
        if (totalRequests === 1) {
            this.statistics.averageResponseTime = responseTime;
        }
        else {
            this.statistics.averageResponseTime =
                (this.statistics.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
        }
    }
    /**
     * Cleanup and shutdown the client
     */
    async cleanup() {
        try {
            // Disconnect from server
            await this.disconnect();
            // Close all connections
            await this.connectionManager.closeAllConnections();
            // Cleanup managers
            this.requestManager.cleanup();
            this.eventManager.cleanup();
            this.cache.destroy();
            // Remove all listeners
            this.removeAllListeners();
            this.isInitialized = false;
            this.emit('cleanup');
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    /**
     * Reconnect to the current endpoint
     */
    async reconnect() {
        if (!this.currentEndpoint) {
            throw new MCPErrorClass(MCPErrorCode.INTERNAL_ERROR, 'No endpoint to reconnect to');
        }
        const endpoint = this.currentEndpoint;
        await this.disconnect();
        await this.connect(endpoint);
    }
    /**
     * Enable automatic reconnection
     */
    enableAutoReconnect() {
        if (!this.config.options?.autoReconnect) {
            return;
        }
        this.on('connectionClosed', async (endpoint) => {
            if (endpoint === this.currentEndpoint && this.config.options?.autoReconnect) {
                const maxAttempts = this.config.options.maxReconnectAttempts || 5;
                const interval = this.config.options.reconnectInterval || 5000;
                for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                    try {
                        await new Promise(resolve => setTimeout(resolve, interval));
                        await this.reconnect();
                        this.emit('reconnected', endpoint, attempt);
                        break;
                    }
                    catch (error) {
                        this.emit('reconnectFailed', endpoint, attempt, error);
                        if (attempt === maxAttempts) {
                            this.emit('reconnectGiveUp', endpoint, maxAttempts);
                        }
                    }
                }
            }
        });
    }
}
//# sourceMappingURL=MCPClient.js.map