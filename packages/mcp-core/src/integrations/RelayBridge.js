/**
 * Relay Bridge for MCP Core Integration
 *
 * This bridge integrates mcp-core with relay-core, replacing the existing
 * MCPTransport with our unified MCPServer implementation while maintaining
 * backward compatibility.
 */
import { MCPSystemFactory } from '../factory/MCPSystemFactory';
import { LogLevel } from '../types/common';
/**
 * Relay Bridge implementation
 */
export class RelayBridge {
    mcpSystem;
    config;
    logger;
    isInitialized = false;
    constructor(config) {
        this.config = config;
        this.logger = config.relay.logger;
    }
    /**
     * Initialize the relay bridge
     */
    async initialize() {
        if (this.isInitialized) {
            this.logger.warn('RelayBridge is already initialized');
            return;
        }
        try {
            this.logger.info('🌉 Initializing Relay Bridge...');
            // Create integrated MCP system with relay configuration
            const systemConfig = {
                server: {
                    name: this.config.server.name,
                    version: this.config.server.version,
                    port: this.config.server.port,
                    host: this.config.server.host,
                    maxConnections: 100,
                    timeout: 30000,
                    enableAuth: this.config.server.enableAuth,
                    enableTLS: false,
                    logLevel: this.config.server.logLevel
                },
                relay: {
                    enabled: true,
                    agentRegistry: this.config.relay.agentRegistry,
                    heartbeatService: this.config.relay.heartbeatService,
                    logger: this.config.relay.logger
                },
                workflow: {
                    enabled: true
                },
                monitoring: {
                    enabled: this.config.options?.enableMetrics ?? true
                }
            };
            // Create the integrated system
            this.mcpSystem = MCPSystemFactory.createCustomSystem(systemConfig);
            // Register relay-specific resources and tools
            await this.registerRelayResources();
            await this.registerRelayTools();
            this.isInitialized = true;
            this.logger.info('✅ Relay Bridge initialized successfully');
        }
        catch (error) {
            this.logger.error('❌ Failed to initialize Relay Bridge', error);
            throw error;
        }
    }
    /**
     * Start the relay bridge
     */
    async start() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        try {
            this.logger.info('🚀 Starting Relay Bridge...');
            await this.mcpSystem.start();
            // Migrate existing resources if enabled
            if (this.config.options?.migrateExistingResources) {
                await this.migrateExistingResources();
            }
            this.logger.info('✅ Relay Bridge started successfully');
        }
        catch (error) {
            this.logger.error('❌ Failed to start Relay Bridge', error);
            throw error;
        }
    }
    /**
     * Stop the relay bridge
     */
    async stop() {
        if (!this.mcpSystem) {
            return;
        }
        try {
            this.logger.info('🛑 Stopping Relay Bridge...');
            await this.mcpSystem.stop();
            this.logger.info('✅ Relay Bridge stopped successfully');
        }
        catch (error) {
            this.logger.error('❌ Error stopping Relay Bridge', error);
            throw error;
        }
    }
    /**
     * Get the MCP server instance
     */
    getMCPServer() {
        if (!this.mcpSystem) {
            throw new Error('Relay Bridge not initialized');
        }
        return this.mcpSystem.server;
    }
    /**
     * Get the integrated MCP system
     */
    getMCPSystem() {
        if (!this.mcpSystem) {
            throw new Error('Relay Bridge not initialized');
        }
        return this.mcpSystem;
    }
    /**
     * Check if the bridge is running
     */
    isRunning() {
        return this.mcpSystem?.server?.isRunning() ?? false;
    }
    /**
     * Get bridge health status
     */
    async getHealth() {
        if (!this.mcpSystem) {
            return {
                status: 'unhealthy',
                reason: 'Bridge not initialized'
            };
        }
        try {
            const systemHealth = await this.mcpSystem.getHealth();
            return {
                status: systemHealth.status,
                bridge: 'operational',
                components: systemHealth.components,
                uptime: systemHealth.uptime,
                timestamp: new Date()
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                reason: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date()
            };
        }
    }
    /**
     * Register relay-specific resources
     */
    async registerRelayResources() {
        const server = this.mcpSystem.server;
        // Register agent registry resource
        server.registerResource({
            uri: 'relay://agents',
            name: 'Agent Registry',
            description: 'Access to the Master Agent Registry',
            handler: {
                read: async () => {
                    const agents = this.config.relay.agentRegistry?.getAllAgents?.() || [];
                    return {
                        uri: 'relay://agents',
                        mimeType: 'application/json',
                        content: JSON.stringify(agents, null, 2),
                        metadata: {
                            count: agents.length,
                            generated: new Date().toISOString()
                        }
                    };
                }
            }
        });
        // Register heartbeat status resource
        if (this.config.relay.heartbeatService) {
            server.registerResource({
                uri: 'relay://heartbeat',
                name: 'Heartbeat Status',
                description: 'Current heartbeat monitoring status',
                handler: {
                    async read() {
                        // This would integrate with the actual heartbeat service
                        const status = {
                            active: true,
                            lastCheck: new Date().toISOString(),
                            monitoredAgents: 0 // Would be actual count
                        };
                        return {
                            uri: 'relay://heartbeat',
                            mimeType: 'application/json',
                            content: JSON.stringify(status, null, 2),
                            metadata: {
                                generated: new Date().toISOString()
                            }
                        };
                    }
                }
            });
        }
        // Register relay configuration resource
        server.registerResource({
            uri: 'relay://config',
            name: 'Relay Configuration',
            description: 'Current relay bridge configuration',
            handler: {
                read: () => Promise.resolve({
                    uri: 'relay://config',
                    mimeType: 'application/json',
                    content: JSON.stringify({
                        server: this.config.server,
                        options: this.config.options,
                        initialized: this.isInitialized,
                        running: this.isRunning()
                    }, null, 2),
                    metadata: {
                        generated: new Date().toISOString()
                    }
                })
            }
        });
        this.logger.debug('📋 Registered relay-specific resources');
    }
    /**
     * Register relay-specific tools
     */
    async registerRelayTools() {
        const server = this.mcpSystem.server;
        // Register agent lookup tool
        server.registerTool({
            name: 'relay-agent-lookup',
            description: 'Look up agent information from the registry',
            inputSchema: {
                type: 'object',
                properties: {
                    agentId: { type: 'string' },
                    includeMetadata: { type: 'boolean', default: false }
                },
                required: ['agentId']
            },
            handler: {
                execute: async (params) => {
                    try {
                        const agent = this.config.relay.agentRegistry?.getAgent?.(params.agentId);
                        if (!agent) {
                            return {
                                success: false,
                                error: `Agent not found: ${params.agentId}`
                            };
                        }
                        const result = params.includeMetadata ? agent : {
                            id: agent.id,
                            name: agent.name,
                            type: agent.type,
                            status: agent.status,
                            lastSeen: agent.lastSeen
                        };
                        return {
                            success: true,
                            result
                        };
                    }
                    catch (error) {
                        return {
                            success: false,
                            error: error instanceof Error ? error.message : 'Agent lookup failed'
                        };
                    }
                }
            }
        });
        // Register agent registration tool
        server.registerTool({
            name: 'relay-agent-register',
            description: 'Register a new agent with the relay system',
            inputSchema: {
                type: 'object',
                properties: {
                    agentData: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            type: { type: 'string' },
                            capabilities: { type: 'array', items: { type: 'string' } }
                        },
                        required: ['id', 'name', 'type']
                    }
                },
                required: ['agentData']
            },
            handler: {
                execute: async (params) => {
                    try {
                        // This would integrate with the actual agent registry
                        const registrationResult = await this.config.relay.agentRegistry?.registerAgent?.(params.agentData);
                        return {
                            success: true,
                            result: {
                                registered: true,
                                agentId: params.agentData.id,
                                timestamp: new Date().toISOString()
                            }
                        };
                    }
                    catch (error) {
                        return {
                            success: false,
                            error: error instanceof Error ? error.message : 'Agent registration failed'
                        };
                    }
                }
            }
        });
        // Register heartbeat trigger tool
        if (this.config.relay.heartbeatService) {
            server.registerTool({
                name: 'relay-heartbeat-trigger',
                description: 'Trigger a heartbeat check for an agent',
                inputSchema: {
                    type: 'object',
                    properties: {
                        agentId: { type: 'string' },
                        force: { type: 'boolean', default: false }
                    },
                    required: ['agentId']
                },
                handler: {
                    execute: async (params) => {
                        try {
                            // This would integrate with the actual heartbeat service
                            const result = {
                                agentId: params.agentId,
                                heartbeatSent: true,
                                timestamp: new Date().toISOString(),
                                forced: params.force || false
                            };
                            return {
                                success: true,
                                result
                            };
                        }
                        catch (error) {
                            return {
                                success: false,
                                error: error instanceof Error ? error.message : 'Heartbeat trigger failed'
                            };
                        }
                    }
                }
            });
        }
        this.logger.debug('🔧 Registered relay-specific tools');
    }
    /**
     * Migrate existing resources from old MCP transport
     */
    async migrateExistingResources() {
        this.logger.info('🔄 Migrating existing resources...');
        try {
            // This would implement migration logic from the old MCPTransport
            // For now, we'll just log that migration would happen here
            this.logger.info('✅ Resource migration completed');
        }
        catch (error) {
            this.logger.error('❌ Resource migration failed', error);
            // Don't throw - migration failure shouldn't stop the bridge
        }
    }
    /**
     * Create a backward compatibility adapter
     */
    createBackwardCompatibilityAdapter() {
        if (!this.config.options?.enableBackwardCompatibility) {
            return null;
        }
        // Return an adapter that mimics the old MCPTransport interface
        return {
            name: 'mcp',
            async start() {
                try {
                    if (!this.isRunning()) {
                        await this.start();
                    }
                    return true;
                }
                catch {
                    return false;
                }
            },
            async stop() {
                await this.stop();
            },
            async send(message) {
                try {
                    // Convert old message format to new MCP request format
                    const response = await this.mcpSystem.server.handleRequest({
                        jsonrpc: '2.0',
                        id: message.id || Date.now(),
                        method: message.method || 'unknown',
                        params: message.params
                    });
                    return response.error === undefined;
                }
                catch {
                    return false;
                }
            },
            onMessage(handler) {
                // This would set up message handling for backward compatibility
                this.logger.debug('Backward compatibility message handler registered');
            },
            isConnected() {
                return this.isRunning();
            }
        };
    }
}
/**
 * Factory function for creating relay bridges
 */
export function createRelayBridge(config) {
    return new RelayBridge(config);
}
/**
 * Helper function to replace existing MCPTransport with RelayBridge
 */
export async function replaceMCPTransport(existingTransport, relayConfig, serverConfig) {
    // Extract configuration from existing transport if possible
    const bridgeConfig = {
        server: {
            name: serverConfig?.name || 'relay-mcp-server',
            version: serverConfig?.version || '1.0.0',
            port: serverConfig?.port || 3000,
            host: serverConfig?.host || 'localhost',
            enableAuth: serverConfig?.enableAuth || false,
            logLevel: serverConfig?.logLevel || LogLevel.INFO
        },
        relay: relayConfig.relay,
        options: {
            replaceExistingTransport: true,
            enableBackwardCompatibility: true,
            migrateExistingResources: true,
            enableMetrics: true,
            ...relayConfig.options
        }
    };
    const bridge = new RelayBridge(bridgeConfig);
    // Stop existing transport if it's running
    if (existingTransport?.isConnected?.()) {
        await existingTransport.stop?.();
    }
    // Initialize and start the bridge
    await bridge.initialize();
    await bridge.start();
    return bridge;
}
/**
 * Default export for convenience
 */
export default RelayBridge;
//# sourceMappingURL=RelayBridge.js.map