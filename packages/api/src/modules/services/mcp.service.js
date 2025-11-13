var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
let MCPService = class MCPService {
    mcpBroker;
    servers = [];
    constructor() {
        // The MCPBrokerService will be initialized in onModuleInit
    }
    async onModuleInit() {
        // Initialize MCP Broker Service
        try {
            // Import dynamically to avoid circular dependencies
            const { MCPBrokerService } = await import('../../../src/mcp/services/mcp-broker.service.js');
            this.mcpBroker = new MCPBrokerService();
            // Check if initialize method exists before calling it
            if (typeof this.mcpBroker.initialize === 'function') {
                await this.mcpBroker.initialize();
            }
            // Load initial server information
            await this.refreshServers();
            // Set up periodic refresh of server information
            setInterval(() => this.refreshServers(), 60000); // Refresh every minute
        }
        catch (error) {
            console.error('Failed to initialize MCP Service:', error);
        }
    }
    async onModuleDestroy() {
        // Clean up resources
        if (this.mcpBroker) {
            // Check if cleanup method exists before calling it
            if (typeof this.mcpBroker.cleanup === 'function') {
                await this.mcpBroker.cleanup();
            }
        }
    }
    registerServer(name, server) {
        if (!this.mcpBroker) {
            throw new Error('MCP Service not initialized');
        }
        this.mcpBroker.registerServer(name, server);
        this.refreshServers();
    }
    async refreshServers() {
        try {
            if (!this.mcpBroker) {
                return;
            }
            const mcpServers = this.mcpBroker.getServers();
            const serverStatus = await this.mcpBroker.getServerStatus();
            this.servers = Object.entries(mcpServers).map(([name, serverInfo]) => {
                const status = serverStatus[name] || 'offline';
                // Ensure serverInfo is treated as an object with properties
                const serverInfoObj = typeof serverInfo === 'string'
                    ? { name: serverInfo }
                    : serverInfo;
                const tools = serverInfoObj.tools
                    ? Object.entries(serverInfoObj.tools).map(([toolName, toolInfo]) => {
                        const toolInfoObj = toolInfo;
                        return {
                            name: toolName,
                            description: toolInfoObj.description || '',
                            parameters: toolInfoObj.parameters || {}
                        };
                    })
                    : [];
                return {
                    id: serverInfoObj.id || name,
                    name,
                    description: serverInfoObj.description || '',
                    status: status,
                    tools
                };
            });
        }
        catch (error) {
            console.error('Error refreshing MCP servers:', error);
        }
    }
    getServers() {
        return this.servers;
    }
    async getServerStatus() {
        if (!this.mcpBroker) {
            return {};
        }
        try {
            return await this.mcpBroker.getServerStatus();
        }
        catch (error) {
            console.error('Error getting MCP server status:', error);
            return {};
        }
    }
    getAllCapabilities() {
        if (!this.mcpBroker) {
            return {};
        }
        try {
            // Convert array to Record type if needed
            const capabilities = this.mcpBroker.getAllCapabilities();
            if (Array.isArray(capabilities)) {
                return capabilities.reduce((acc, capability) => {
                    if (typeof capability === 'string') {
                        acc[capability] = {};
                    }
                    return acc;
                }, {});
            }
            return capabilities;
        }
        catch (error) {
            console.error('Error getting MCP capabilities:', error);
            return {};
        }
    }
    getAllTools() {
        if (!this.mcpBroker) {
            return {};
        }
        try {
            // Convert array to Record type if needed
            const tools = this.mcpBroker.getAllTools();
            if (Array.isArray(tools)) {
                return tools.reduce((acc, tool) => {
                    if (typeof tool === 'string') {
                        acc[tool] = {};
                    }
                    return acc;
                }, {});
            }
            return tools;
        }
        catch (error) {
            console.error('Error getting MCP tools:', error);
            return {};
        }
    }
    async executeDirective(serverName, action, params, options) {
        if (!this.mcpBroker) {
            throw new Error('MCP Service not initialized');
        }
        try {
            // Ensure sender is always provided
            const enhancedOptions = {
                ...options,
                sender: options?.sender || 'system'
            };
            return await this.mcpBroker.executeDirective(serverName, action, params, enhancedOptions);
        }
        catch (error) {
            console.error(`Error executing MCP directive ${serverName}.${action}:`, error);
            throw error;
        }
    }
};
MCPService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], MCPService);
export { MCPService };
//# sourceMappingURL=mcp.service.js.map