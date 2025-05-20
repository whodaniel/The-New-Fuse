import { getLogger, ExtensionLogger } from '../core/logging.js';
import { MCPServer, MCPTool, MCPServerConfig, MCPMarketplaceService } from '../types/mcp.js';

export class MCPMarketplace implements MCPMarketplaceService {
    private readonly logger: ExtensionLogger;
    private readonly registeredTools: Map<string, MCPTool & { serverId: string }> = new Map();
    private readonly serverConfigs: Map<string, MCPServer> = new Map();

    constructor() {
        this.logger = getLogger();
    }

    public get servers(): MCPServer[] {
        return [...this.serverConfigs.values()];
    }

    public get tools(): MCPTool[] {
        return [...this.registeredTools.values()].map(({ serverId: _serverId, ...tool }) => tool);
    }

    public async initialize(): Promise<void> {
        this.logger.info('Initializing MCP marketplace service');
    }

    public async registerServer(server: MCPServer): Promise<void> {
        this.serverConfigs.set(server.id, server);

        if (server.config?.tools) {
            server.config.tools.forEach(tool => {
                this.registeredTools.set(tool.id, {
                    ...tool,
                    serverId: server.id
                });
            });
        }

        this.logger.info(`Registered MCP server: ${server.name} (${server.id})`);
    }

    public async unregisterServer(serverId: string): Promise<void> {
        const server = this.serverConfigs.get(serverId);
        if (server) {
            this.serverConfigs.delete(serverId);
            
            // Remove all tools associated with this server
            for (const [toolId, tool] of this.registeredTools) {
                if (tool.serverId === serverId) {
                    this.registeredTools.delete(toolId);
                }
            }
            
            this.logger.info(`Unregistered MCP server: ${server.name} (${server.id})`);
        }
    }

    public async updateServerConfig(serverId: string, config: MCPServerConfig): Promise<void> {
        const server = this.serverConfigs.get(serverId);
        if (!server) {
            throw new Error(`Server ${serverId} not found`);
        }

        // Remove old tools for this server
        for (const [toolId, tool] of this.registeredTools) {
            if (tool.serverId === serverId) {
                this.registeredTools.delete(toolId);
            }
        }

        // Add new tools
        if (config.tools) {
            config.tools.forEach(tool => {
                this.registeredTools.set(tool.id, {
                    ...tool,
                    serverId: server.id
                });
            });
        }

        // Update server config
        server.config = config;
        server.capabilities = config.capabilities;

        this.logger.info(`Updated configuration for server: ${server.name}`);
    }

    public getServer(serverId: string): MCPServer | undefined {
        return this.serverConfigs.get(serverId);
    }

    public getServers(): MCPServer[] {
        return this.servers;
    }

    public getTools(): MCPTool[] {
        return [...this.registeredTools.values()];
    }

    public findToolById(toolId: string): MCPTool | undefined {
        return [...this.registeredTools.values()].find(tool => tool.id === toolId);
    }
}
