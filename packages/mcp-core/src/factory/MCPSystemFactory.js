/**
 * MCP System Factory
 *
 * Unified factory for creating integrated MCP systems that work seamlessly
 * with relay-core, workflow-engine, and other platform components.
 */
import { MCPServer } from '../server/MCPServer';
import { LogLevel } from '../types/common';
/**
 * MCP System implementation
 */
class MCPSystemImpl {
    server;
    config;
    components;
    startTime = null;
    running = false;
    constructor(config) {
        this.config = config;
        this.server = new MCPServer();
        this.components = { server: this.server };
        this.initializeComponents();
    }
    /**
     * Initialize all system components
     */
    initializeComponents() {
        // Initialize database if configured
        if (this.config.database?.prisma) {
            this.components.database = this.config.database.prisma;
        }
        // Initialize relay components if configured
        if (this.config.relay?.enabled) {
            this.components.relay = {
                agentRegistry: this.config.relay.agentRegistry,
                heartbeatService: this.config.relay.heartbeatService,
                logger: this.config.relay.logger
            };
        }
        // Initialize workflow components if configured
        if (this.config.workflow?.enabled) {
            this.components.workflow = this.config.workflow.engineConfig;
        }
    }
    /**
     * Start the entire MCP system
     */
    async start() {
        if (this.running) {
            throw new Error('MCP System is already running');
        }
        try {
            this.log('info', 'Starting MCP System...');
            // Start core MCP server
            await this.server.start(this.config.server);
            // Initialize default resources and tools
            await this.registerDefaultResources();
            await this.registerDefaultTools();
            // Start additional components
            await this.startAdditionalComponents();
            this.running = true;
            this.startTime = new Date();
            this.log('info', `MCP System started successfully on ${this.config.server.host}:${this.config.server.port}`);
        }
        catch (error) {
            this.log('error', 'Failed to start MCP System', error);
            throw error;
        }
    }
    /**
     * Stop the entire MCP system
     */
    async stop() {
        if (!this.running) {
            return;
        }
        try {
            this.log('info', 'Stopping MCP System...');
            // Stop additional components first
            await this.stopAdditionalComponents();
            // Stop core MCP server
            await this.server.stop();
            this.running = false;
            this.startTime = null;
            this.log('info', 'MCP System stopped successfully');
        }
        catch (error) {
            this.log('error', 'Error stopping MCP System', error);
            throw error;
        }
    }
    /**
     * Get system health status
     */
    async getHealth() {
        const serverHealth = this.server.isRunning() ? 'up' : 'down';
        const components = {
            server: serverHealth
        };
        // Check database health
        if (this.components.database) {
            try {
                await this.components.database.$queryRaw `SELECT 1`;
                components.database = 'up';
            }
            catch {
                components.database = 'down';
            }
        }
        // Check relay health
        if (this.components.relay) {
            components.relay = 'up'; // Simplified for now
        }
        // Check workflow health
        if (this.components.workflow) {
            components.workflow = 'up'; // Simplified for now
        }
        // Determine overall status
        const allUp = Object.values(components).every(status => status === 'up');
        const anyDown = Object.values(components).some(status => status === 'down');
        const status = allUp ? 'healthy' : anyDown ? 'unhealthy' : 'degraded';
        return {
            status,
            components,
            timestamp: new Date(),
            uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0
        };
    }
    /**
     * Get system metrics
     */
    async getMetrics() {
        const serverInfo = this.server.getServerInfo();
        return {
            requests: {
                total: serverInfo.metadata?.requestCount || 0,
                successful: serverInfo.metadata?.successfulRequests || 0,
                failed: serverInfo.metadata?.failedRequests || 0,
                averageResponseTime: serverInfo.metadata?.averageResponseTime || 0
            },
            resources: {
                registered: this.server.getRegisteredResources().length,
                accessed: 0 // TODO: Track resource access
            },
            tools: {
                registered: this.server.getRegisteredTools().length,
                executed: 0 // TODO: Track tool executions
            },
            connections: {
                active: serverInfo.activeConnections,
                total: serverInfo.metadata?.totalConnections || 0
            },
            timestamp: new Date()
        };
    }
    /**
     * Register a new resource
     */
    async registerResource(resource) {
        this.server.registerResource(resource);
        this.log('debug', `Registered resource: ${resource.name}`);
    }
    /**
     * Register a new tool
     */
    async registerTool(tool) {
        this.server.registerTool(tool);
        this.log('debug', `Registered tool: ${tool.name}`);
    }
    /**
     * Get integrated components
     */
    getComponents() {
        return { ...this.components };
    }
    /**
     * Register default resources
     */
    async registerDefaultResources() {
        // Register system info resource
        const self = this;
        this.server.registerResource({
            uri: 'system://info',
            name: 'System Information',
            description: 'System health and metrics information',
            handler: {
                async read() {
                    const health = await self.getHealth();
                    const metrics = await self.getMetrics();
                    return {
                        uri: 'system://info',
                        mimeType: 'application/json',
                        content: JSON.stringify({ health, metrics }, null, 2),
                        metadata: {
                            generated: new Date().toISOString()
                        }
                    };
                }
            }
        });
        // Register configuration resource
        this.server.registerResource({
            uri: 'system://config',
            name: 'System Configuration',
            description: 'Current system configuration',
            handler: {
                read: () => Promise.resolve({
                    uri: 'system://config',
                    mimeType: 'application/json',
                    content: JSON.stringify(self.config, null, 2),
                    metadata: {
                        generated: new Date().toISOString()
                    }
                })
            }
        });
    }
    /**
     * Register default tools
     */
    async registerDefaultTools() {
        // Register system health check tool
        this.server.registerTool({
            name: 'system-health',
            description: 'Check system health status',
            inputSchema: {
                type: 'object',
                properties: {
                    detailed: { type: 'boolean', default: false }
                }
            },
            handler: {
                execute: async (params) => {
                    const health = await this.getHealth();
                    if (params.detailed) {
                        const metrics = await this.getMetrics();
                        return {
                            success: true,
                            result: { health, metrics }
                        };
                    }
                    return {
                        success: true,
                        result: health
                    };
                }
            }
        });
        // Register system restart tool
        this.server.registerTool({
            name: 'system-restart',
            description: 'Restart the MCP system',
            inputSchema: {
                type: 'object',
                properties: {
                    graceful: { type: 'boolean', default: true }
                }
            },
            handler: {
                execute: async (params) => {
                    try {
                        if (params.graceful) {
                            await this.stop();
                            await this.start();
                        }
                        else {
                            // Force restart - simplified for now
                            await this.stop();
                            await this.start();
                        }
                        return {
                            success: true,
                            result: 'System restarted successfully'
                        };
                    }
                    catch (error) {
                        return {
                            success: false,
                            error: error instanceof Error ? error.message : 'Restart failed'
                        };
                    }
                }
            }
        });
    }
    /**
     * Start additional components
     */
    async startAdditionalComponents() {
        // Start relay integration if enabled
        if (this.config.relay?.enabled && this.components.relay?.agentRegistry) {
            this.log('info', 'Starting relay integration...');
            // TODO: Initialize relay integration
        }
        // Start workflow integration if enabled
        if (this.config.workflow?.enabled) {
            this.log('info', 'Starting workflow integration...');
            // TODO: Initialize workflow integration
        }
        // Start Theia integration if enabled
        if (this.config.theia?.enabled) {
            this.log('info', 'Starting Theia integration...');
            // TODO: Initialize Theia integration
        }
    }
    /**
     * Stop additional components
     */
    async stopAdditionalComponents() {
        // Stop components in reverse order
        if (this.config.theia?.enabled) {
            this.log('info', 'Stopping Theia integration...');
            // TODO: Stop Theia integration
        }
        if (this.config.workflow?.enabled) {
            this.log('info', 'Stopping workflow integration...');
            // TODO: Stop workflow integration
        }
        if (this.config.relay?.enabled) {
            this.log('info', 'Stopping relay integration...');
            // TODO: Stop relay integration
        }
    }
    /**
     * Log message with appropriate level
     */
    log(level, message, meta) {
        if (this.components.relay?.logger) {
            this.components.relay.logger[level](message, meta);
        }
        else {
            // Fallback to console logging
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
            if (level === 'error') {
                console.error(logMessage, meta);
            }
            else if (level === 'warn') {
                console.warn(logMessage);
            }
            else if (level === 'info') {
                console.info(logMessage);
            }
            else if (level === 'debug' && this.config.development?.debugMode) {
                console.debug(logMessage);
            }
        }
    }
}
/**
 * MCP System Factory class
 */
export class MCPSystemFactory {
    /**
     * Create a production-ready MCP system
     */
    static createProductionSystem(config = {}) {
        const defaultConfig = {
            server: {
                name: 'the-new-fuse-mcp-server',
                version: '1.0.0',
                port: 3000,
                host: 'localhost',
                maxConnections: 1000,
                timeout: 30000,
                enableAuth: true,
                enableTLS: false,
                logLevel: LogLevel.INFO
            },
            relay: {
                enabled: true
            },
            workflow: {
                enabled: true
            },
            theia: {
                enabled: false
            },
            monitoring: {
                enabled: true,
                metricsPort: 9090,
                prometheusEnabled: true
            },
            development: {
                hotReload: false,
                debugMode: false,
                mockServices: false
            }
        };
        const mergedConfig = this.mergeConfigs(defaultConfig, config);
        return new MCPSystemImpl(mergedConfig);
    }
    /**
     * Create a development MCP system
     */
    static createDevelopmentSystem(config = {}) {
        const defaultConfig = {
            server: {
                name: 'the-new-fuse-mcp-dev-server',
                version: '1.0.0-dev',
                port: 3001,
                host: 'localhost',
                maxConnections: 100,
                timeout: 30000,
                enableAuth: false,
                enableTLS: false,
                logLevel: LogLevel.DEBUG
            },
            relay: {
                enabled: true
            },
            workflow: {
                enabled: true
            },
            theia: {
                enabled: true,
                port: 3006,
                aiFeatures: true
            },
            monitoring: {
                enabled: true,
                metricsPort: 9091,
                prometheusEnabled: false
            },
            development: {
                hotReload: true,
                debugMode: true,
                mockServices: true
            }
        };
        const mergedConfig = this.mergeConfigs(defaultConfig, config);
        return new MCPSystemImpl(mergedConfig);
    }
    /**
     * Create a testing MCP system
     */
    static createTestingSystem(config = {}) {
        const defaultConfig = {
            server: {
                name: 'the-new-fuse-mcp-test-server',
                version: '1.0.0-test',
                port: 3999, // Test port
                host: 'localhost',
                maxConnections: 10,
                timeout: 5000,
                enableAuth: false,
                enableTLS: false,
                logLevel: LogLevel.ERROR
            },
            relay: {
                enabled: false
            },
            workflow: {
                enabled: false
            },
            theia: {
                enabled: false
            },
            monitoring: {
                enabled: false
            },
            development: {
                hotReload: false,
                debugMode: false,
                mockServices: true
            }
        };
        const mergedConfig = this.mergeConfigs(defaultConfig, config);
        return new MCPSystemImpl(mergedConfig);
    }
    /**
     * Create a custom MCP system with full configuration
     */
    static createCustomSystem(config) {
        return new MCPSystemImpl(config);
    }
    /**
     * Create a simple MCP server for testing
     * @deprecated Use createTestingSystem() instead for full system functionality
     */
    static createServer(config) {
        const systemConfig = {
            server: config,
            development: {
                hotReload: false,
                debugMode: false,
                mockServices: true
            }
        };
        const system = new MCPSystemImpl(systemConfig);
        return system.server;
    }
    /**
     * Merge configuration objects deeply
     */
    static mergeConfigs(defaultConfig, userConfig) {
        const merged = { ...defaultConfig };
        for (const [key, value] of Object.entries(userConfig)) {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                merged[key] = {
                    ...merged[key],
                    ...value
                };
            }
            else {
                merged[key] = value;
            }
        }
        return merged;
    }
}
/**
 * Default export for convenience
 */
export default MCPSystemFactory;
//# sourceMappingURL=MCPSystemFactory.js.map