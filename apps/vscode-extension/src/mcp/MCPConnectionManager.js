const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { SSEClientTransport } = require('@modelcontextprotocol/sdk/client/sse.js');
const { WebSocketClientTransport } = require('@modelcontextprotocol/sdk/client/websocket.js');
const WebSocket = require('ws');
const SecureConnectionManager = require('../security/SecureConnectionManager');
const SecureConfigManager = require('../security/SecureConfigManager');

/**
 * MCP Connection Manager
 * Manages MCP server connections with lifecycle management, pooling, and health monitoring
 */
class MCPConnectionManager {
    constructor(context, securityOrchestrator) {
        this.context = context;
        this.securityOrchestrator = securityOrchestrator;
        this.secureConfigManager = null;
        this.secureConnectionManager = new SecureConnectionManager();

        // Connection pools and registries
        this.connections = new Map(); // serverId -> MCPClient
        this.connectionPool = new Map(); // serverId -> pooled connections
        this.toolRegistry = new Map(); // toolName -> serverId
        this.resourceRegistry = new Map(); // resourceUri -> serverId
        this.promptRegistry = new Map(); // promptName -> serverId

        // Health monitoring
        this.healthChecks = new Map(); // serverId -> health status
        this.heartbeatIntervals = new Map(); // serverId -> interval ID

        // Circuit breaker state
        this.circuitBreakers = new Map(); // serverId -> { failures, lastFailure, state }

        // Retry configuration
        this.retryConfig = {
            maxRetries: 3,
            initialDelay: 1000,
            backoffMultiplier: 2,
            maxDelay: 30000
        };

        // Protocol versions
        this.supportedVersions = ['2024-11-05', '2025-01-01'];

        this.initialized = false;
    }

    /**
     * Initialize the MCP Connection Manager
     */
    async initialize() {
        if (this.initialized) return;

        try {
            this.secureConfigManager = new SecureConfigManager(this.context);
            await this.secureConfigManager.initialize();

            // Load persisted connections
            await this.loadPersistedConnections();

            // Start health monitoring
            this.startHealthMonitoring();

            this.initialized = true;
            console.log('🔗 MCP Connection Manager initialized');
        } catch (error) {
            console.error('Failed to initialize MCP Connection Manager:', error);
            throw error;
        }
    }

    /**
     * Load persisted MCP server configurations
     */
    async loadPersistedConnections() {
        try {
            const endpoints = await this.secureConfigManager.getMcpEndpoints();

            for (const endpoint of endpoints) {
                if (endpoint.autoConnect) {
                    await this.connectToServer(endpoint);
                }
            }
        } catch (error) {
            console.warn('Failed to load persisted connections:', error);
        }
    }

    /**
     * Connect to an MCP server
     */
    async connectToServer(serverConfig) {
        const serverId = serverConfig.id || this.generateServerId(serverConfig.url);

        // Check circuit breaker
        if (this.isCircuitBreakerOpen(serverId)) {
            throw new Error(`Circuit breaker open for server ${serverId}`);
        }

        try {
            // Create MCP client with appropriate transport
            const client = await this.createMCPClient(serverConfig);

            // Perform protocol handshake and version negotiation
            await this.performHandshake(client, serverConfig);

            // Register server capabilities
            await this.registerServerCapabilities(client, serverId);

            // Add to connection pool
            this.connections.set(serverId, client);
            this.connectionPool.set(serverId, { client, config: serverConfig, connectedAt: Date.now() });

            // Start heartbeat monitoring
            this.startHeartbeat(serverId);

            // Update health status
            this.updateHealthStatus(serverId, 'healthy');

            // Persist connection
            await this.persistConnection(serverConfig);

            console.log(`✅ Connected to MCP server: ${serverConfig.url}`);
            return serverId;

        } catch (error) {
            console.error(`Failed to connect to MCP server ${serverConfig.url}:`, error);
            this.recordFailure(serverId);
            throw error;
        }
    }

    /**
     * Create MCP client with appropriate transport
     */
    async createMCPClient(serverConfig) {
        const transport = await this.createTransport(serverConfig);
        const client = new Client(
            {
                name: 'the-new-fuse-vscode',
                version: '7.0.0'
            },
            {
                capabilities: {
                    tools: {},
                    resources: {},
                    prompts: {},
                    logging: {}
                }
            }
        );

        await client.connect(transport);
        return client;
    }

    /**
     * Create appropriate transport based on server config
     */
    async createTransport(serverConfig) {
        const url = serverConfig.url;

        if (url.startsWith('ws://') || url.startsWith('wss://')) {
            return new WebSocketClientTransport(new WebSocket(url));
        } else if (url.includes('/sse')) {
            return new SSEClientTransport(new URL(url));
        } else {
            // Default to HTTP transport with secure connection manager
            return {
                start: () => Promise.resolve(),
                send: async (message) => {
                    const response = await this.secureConnectionManager.makeSecureApiCall(
                        url,
                        'POST',
                        message,
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': serverConfig.authToken ? `Bearer ${serverConfig.authToken}` : undefined
                            }
                        }
                    );
                    return response.data;
                },
                close: () => Promise.resolve()
            };
        }
    }

    /**
     * Perform MCP protocol handshake and version negotiation
     */
    async performHandshake(client, serverConfig) {
        try {
            // Initialize connection
            const initResult = await client.request(
                { method: 'initialize', params: {
                    protocolVersion: this.supportedVersions[0],
                    capabilities: {
                        tools: { listChanged: true },
                        resources: { listChanged: true, subscribe: true },
                        prompts: { listChanged: true }
                    },
                    clientInfo: {
                        name: 'The New Fuse VSCode Extension',
                        version: '7.0.0'
                    }
                }},
                { timeout: 10000 }
            );

            // Negotiate protocol version
            const serverVersion = initResult.protocolVersion;
            if (!this.supportedVersions.includes(serverVersion)) {
                throw new Error(`Unsupported protocol version: ${serverVersion}`);
            }

            console.log(`🤝 MCP handshake successful. Protocol: ${serverVersion}`);
            return initResult;

        } catch (error) {
            throw new Error(`Handshake failed: ${error.message}`);
        }
    }

    /**
     * Register server capabilities in registries
     */
    async registerServerCapabilities(client, serverId) {
        try {
            // Register tools
            const toolsResult = await client.request({ method: 'tools/list' });
            for (const tool of toolsResult.tools || []) {
                this.toolRegistry.set(tool.name, serverId);
            }

            // Register resources
            const resourcesResult = await client.request({ method: 'resources/list' });
            for (const resource of resourcesResult.resources || []) {
                this.resourceRegistry.set(resource.uri, serverId);
            }

            // Register prompts
            const promptsResult = await client.request({ method: 'prompts/list' });
            for (const prompt of promptsResult.prompts || []) {
                this.promptRegistry.set(prompt.name, serverId);
            }

        } catch (error) {
            console.warn(`Failed to register capabilities for server ${serverId}:`, error);
        }
    }

    /**
     * Start heartbeat monitoring for a server
     */
    startHeartbeat(serverId) {
        const interval = setInterval(async () => {
            try {
                const client = this.connections.get(serverId);
                if (client) {
                    // Simple ping/pong or tools/list as heartbeat
                    await client.request({ method: 'tools/list' }, { timeout: 5000 });
                    this.updateHealthStatus(serverId, 'healthy');
                }
            } catch (error) {
                console.warn(`Heartbeat failed for server ${serverId}:`, error);
                this.updateHealthStatus(serverId, 'unhealthy');
                this.recordFailure(serverId);
            }
        }, 30000); // 30 second heartbeat

        this.heartbeatIntervals.set(serverId, interval);
    }

    /**
     * Update health status for a server
     */
    updateHealthStatus(serverId, status) {
        this.healthChecks.set(serverId, {
            status,
            lastCheck: Date.now(),
            responseTime: status === 'healthy' ? Math.random() * 1000 : null // Mock response time
        });
    }

    /**
     * Record a connection failure for circuit breaker
     */
    recordFailure(serverId) {
        const breaker = this.circuitBreakers.get(serverId) || { failures: 0, lastFailure: 0, state: 'closed' };

        breaker.failures++;
        breaker.lastFailure = Date.now();

        // Open circuit breaker after 3 failures
        if (breaker.failures >= 3) {
            breaker.state = 'open';
            console.warn(`Circuit breaker opened for server ${serverId}`);
        }

        this.circuitBreakers.set(serverId, breaker);
    }

    /**
     * Check if circuit breaker is open
     */
    isCircuitBreakerOpen(serverId) {
        const breaker = this.circuitBreakers.get(serverId);
        if (!breaker || breaker.state === 'closed') return false;

        // Allow retry after 60 seconds
        if (Date.now() - breaker.lastFailure > 60000) {
            breaker.state = 'half-open';
            this.circuitBreakers.set(serverId, breaker);
            return false;
        }

        return true;
    }

    /**
     * Retry connection with exponential backoff
     */
    async retryConnection(serverConfig, attempt = 1) {
        if (attempt > this.retryConfig.maxRetries) {
            throw new Error(`Max retries exceeded for server ${serverConfig.url}`);
        }

        const delay = Math.min(
            this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
            this.retryConfig.maxDelay
        );

        await new Promise(resolve => setTimeout(resolve, delay));

        try {
            return await this.connectToServer(serverConfig);
        } catch (error) {
            console.warn(`Retry ${attempt} failed for ${serverConfig.url}:`, error);
            return this.retryConnection(serverConfig, attempt + 1);
        }
    }

    /**
     * Call a tool on an MCP server
     */
    async callTool(toolName, args = {}) {
        const serverId = this.toolRegistry.get(toolName);
        if (!serverId) {
            throw new Error(`Tool ${toolName} not found in registry`);
        }

        const client = this.connections.get(serverId);
        if (!client) {
            throw new Error(`No connection to server ${serverId}`);
        }

        try {
            const result = await client.request({
                method: 'tools/call',
                params: {
                    name: toolName,
                    arguments: args
                }
            });

            return result;

        } catch (error) {
            this.recordFailure(serverId);
            throw new Error(`Tool call failed: ${error.message}`);
        }
    }

    /**
     * Get a resource from an MCP server
     */
    async getResource(uri) {
        const serverId = this.resourceRegistry.get(uri);
        if (!serverId) {
            throw new Error(`Resource ${uri} not found in registry`);
        }

        const client = this.connections.get(serverId);
        if (!client) {
            throw new Error(`No connection to server ${serverId}`);
        }

        try {
            const result = await client.request({
                method: 'resources/read',
                params: { uri }
            });

            return result;

        } catch (error) {
            this.recordFailure(serverId);
            throw new Error(`Resource read failed: ${error.message}`);
        }
    }

    /**
     * Get a prompt from an MCP server
     */
    async getPrompt(promptName, args = {}) {
        const serverId = this.promptRegistry.get(promptName);
        if (!serverId) {
            throw new Error(`Prompt ${promptName} not found in registry`);
        }

        const client = this.connections.get(serverId);
        if (!client) {
            throw new Error(`No connection to server ${serverId}`);
        }

        try {
            const result = await client.request({
                method: 'prompts/get',
                params: {
                    name: promptName,
                    arguments: args
                }
            });

            return result;

        } catch (error) {
            this.recordFailure(serverId);
            throw new Error(`Prompt get failed: ${error.message}`);
        }
    }

    /**
     * Get MCP server status dashboard data
     */
    getServerStatus() {
        const status = {
            totalServers: this.connections.size,
            healthyServers: 0,
            unhealthyServers: 0,
            servers: []
        };

        for (const [serverId, poolEntry] of this.connectionPool.entries()) {
            const health = this.healthChecks.get(serverId) || { status: 'unknown' };
            const breaker = this.circuitBreakers.get(serverId) || { state: 'closed', failures: 0 };

            const serverStatus = {
                id: serverId,
                url: poolEntry.config.url,
                status: health.status,
                connectedAt: poolEntry.connectedAt,
                lastHealthCheck: health.lastCheck,
                responseTime: health.responseTime,
                circuitBreaker: breaker.state,
                failures: breaker.failures,
                tools: Array.from(this.toolRegistry.entries())
                    .filter(([_, sid]) => sid === serverId)
                    .map(([name]) => name),
                resources: Array.from(this.resourceRegistry.entries())
                    .filter(([_, sid]) => sid === serverId)
                    .map(([uri]) => uri),
                prompts: Array.from(this.promptRegistry.entries())
                    .filter(([_, sid]) => sid === serverId)
                    .map(([name]) => name)
            };

            status.servers.push(serverStatus);

            if (health.status === 'healthy') {
                status.healthyServers++;
            } else {
                status.unhealthyServers++;
            }
        }

        return status;
    }

    /**
     * Persist connection configuration
     */
    async persistConnection(serverConfig) {
        try {
            await this.secureConfigManager.storeMcpEndpoint({
                ...serverConfig,
                autoConnect: true,
                lastConnected: new Date().toISOString()
            });
        } catch (error) {
            console.warn('Failed to persist connection:', error);
        }
    }

    /**
     * Disconnect from a server
     */
    async disconnectServer(serverId) {
        const client = this.connections.get(serverId);
        if (client) {
            try {
                await client.close();
            } catch (error) {
                console.warn(`Error closing connection to ${serverId}:`, error);
            }
        }

        // Clean up
        this.connections.delete(serverId);
        this.connectionPool.delete(serverId);
        this.healthChecks.delete(serverId);

        // Stop heartbeat
        const interval = this.heartbeatIntervals.get(serverId);
        if (interval) {
            clearInterval(interval);
            this.heartbeatIntervals.delete(serverId);
        }

        // Clean registries
        this.cleanRegistries(serverId);

        console.log(`🔌 Disconnected from MCP server: ${serverId}`);
    }

    /**
     * Clean registries for a disconnected server
     */
    cleanRegistries(serverId) {
        // Clean tool registry
        for (const [toolName, sid] of this.toolRegistry.entries()) {
            if (sid === serverId) {
                this.toolRegistry.delete(toolName);
            }
        }

        // Clean resource registry
        for (const [uri, sid] of this.resourceRegistry.entries()) {
            if (sid === serverId) {
                this.resourceRegistry.delete(uri);
            }
        }

        // Clean prompt registry
        for (const [promptName, sid] of this.promptRegistry.entries()) {
            if (sid === serverId) {
                this.promptRegistry.delete(promptName);
            }
        }
    }

    /**
     * Start health monitoring for all servers
     */
    startHealthMonitoring() {
        // Periodic health check for all servers
        setInterval(() => {
            for (const [serverId] of this.connections.entries()) {
                // Health checks are already done via heartbeats
                // This could be extended for additional monitoring
            }
        }, 60000); // Every minute
    }

    /**
     * Generate unique server ID
     */
    generateServerId(url) {
        return `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Auto-discover MCP servers (placeholder for future implementation)
     */
    async autoDiscoverServers() {
        // This would implement service discovery mechanisms
        // For now, return empty array
        return [];
    }

    /**
     * Clean up all connections
     */
    async cleanup() {
        // Stop all heartbeats
        for (const interval of this.heartbeatIntervals.values()) {
            clearInterval(interval);
        }
        this.heartbeatIntervals.clear();

        // Disconnect all servers
        for (const serverId of this.connections.keys()) {
            await this.disconnectServer(serverId);
        }

        console.log('🧹 MCP Connection Manager cleaned up');
    }
}

module.exports = MCPConnectionManager;