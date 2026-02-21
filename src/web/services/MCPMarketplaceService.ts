import axios from 'axios';

/**
 * MCP marketplace server interface
 */
export interface MCPMarketplaceServer {
    id: string;
    name: string;
    description: string;
    version: string;
    publisher: string;
    category: string;
    rating: number;
    downloads: number;
    lastUpdated: string;
    installCommand: string;
    args: string[];
    capabilities: string[];
    requiresConfiguration: boolean;
    configurationSchema?: {
        type: string;
        required?: string[];
        properties: Record<string, any>;
    };
    env?: Record<string, string>;
}

/**
 * Service for interacting with the MCP marketplace API
 */
export class MCPMarketplaceService {
    private apiBaseUrl: string;
    
    constructor() {
        // Set the API base URL (could be configured elsewhere)
        this.apiBaseUrl = process.env.REACT_APP_MCP_MARKETPLACE_URL || '/api/mcp-marketplace';
    }
    
    /**
     * Fetches all MCP servers from the marketplace
     */
    async getAllServers(): Promise<MCPMarketplaceServer[]> {
        try {
            // In a real implementation, this would fetch from the API
            // const response = await axios.get(`${this.apiBaseUrl}/servers`);
            // return response.data;
            
            // For demonstration, use mock data
            return this.getMockServers();
        } catch (error) {
            console.error('Error fetching MCP marketplace servers:', error);
            throw error;
        }
    }
    
    /**
     * Searches for MCP servers in the marketplace
     */
    async searchServers(query: string): Promise<MCPMarketplaceServer[]> {
        try {
            if (!query) {
                return this.getAllServers();
            }
            
            // In a real implementation, this would fetch from the API
            // const response = await axios.get(`${this.apiBaseUrl}/servers/search?q=${encodeURIComponent(query)}`);
            // return response.data;
            
            // For demonstration, filter mock data
            const allServers = await this.getAllServers();
            const lowerQuery = query.toLowerCase();
            
            return allServers.filter(server => 
                server.name.toLowerCase().includes(lowerQuery) ||
                server.description.toLowerCase().includes(lowerQuery) ||
                server.publisher.toLowerCase().includes(lowerQuery) ||
                server.category.toLowerCase().includes(lowerQuery) ||
                server.capabilities.some(cap => cap.toLowerCase().includes(lowerQuery))
            );
        } catch (error) {
            console.error('Error searching MCP marketplace servers:', error);
            return [];
        }
    }
    
    /**
     * Fetches a specific MCP server from the marketplace
     */
    async getServerDetails(id: string): Promise<MCPMarketplaceServer | null> {
        try {
            // In a real implementation, this would fetch from the API
            // const response = await axios.get(`${this.apiBaseUrl}/servers/${id}`);
            // return response.data;
            
            // For demonstration, find in mock data
            const allServers = await this.getAllServers();
            return allServers.find(server => server.id === id) || null;
        } catch (error) {
            console.error(`Error fetching MCP marketplace server ${id}:`, error);
            return null;
        }
    }
    
    /**
     * Installs a server from the marketplace
     */
    async installServer(server: MCPMarketplaceServer): Promise<boolean> {
        try {
            // In a real implementation, this would call the API to install the server
            // const response = await axios.post(`${this.apiBaseUrl}/install`, server);
            // return response.data.success;
            
            // For demonstration, just simulate success
            console.log(`Installing server: ${server.name}`);
            return true;
        } catch (error) {
            console.error('Error installing MCP server:', error);
            throw error;
        }
    }
    
    /**
     * Gets the list of installed MCP servers
     */
    async getInstalledServers(): Promise<string[]> {
        try {
            // In a real implementation, this would fetch from the API
            // const response = await axios.get(`${this.apiBaseUrl}/installed`);
            // return response.data.serverIds;
            
            // For demonstration, return mock data
            return ['vscode-mcp-server'];
        } catch (error) {
            console.error('Error fetching installed MCP servers:', error);
            return [];
        }
    }
    
    /**
     * Gets mock servers for development
     */
    private getMockServers(): MCPMarketplaceServer[] {
        return [
            {
                id: 'vscode-mcp-server',
                name: 'VS Code MCP Server',
                description: 'Enables AI agents to interact with Visual Studio Code through the Model Context Protocol',
                version: '1.2.0',
                publisher: 'MCP Foundation',
                category: 'Development Tools',
                rating: 4.8,
                downloads: 12503,
                lastUpdated: '2025-04-01',
                installCommand: 'npx',
                args: ['@modelcontextprotocol/vscode-mcp-server'],
                capabilities: ['Code editing', 'File operations', 'Terminal commands', 'Diagnostics'],
                requiresConfiguration: false
            },
            {
                id: 'filesystem-mcp-server',
                name: 'Filesystem MCP Server',
                description: 'Provides secure filesystem access for AI agents through the Model Context Protocol',
                version: '0.9.5',
                publisher: 'MCP Foundation',
                category: 'File Management',
                rating: 4.6,
                downloads: 8921,
                lastUpdated: '2025-03-15',
                installCommand: 'npx',
                args: ['@modelcontextprotocol/server-filesystem', '--allow-dir', './data'],
                capabilities: ['File read', 'File write', 'Directory listing', 'File search'],
                requiresConfiguration: true,
                configurationSchema: {
                    type: 'object',
                    required: ['allowedDirectories'],
                    properties: {
                        allowedDirectories: {
                            type: 'string',
                            description: 'Comma-separated list of directories to allow access to'
                        },
                        readOnly: {
                            type: 'boolean',
                            description: 'Whether to allow only read operations'
                        }
                    }
                }
            },
            {
                id: 'shell-mcp-server',
                name: 'Shell MCP Server',
                description: 'Provides secure shell command execution for AI agents through MCP',
                version: '0.8.2',
                publisher: 'MCP Community',
                category: 'System Tools',
                rating: 4.3,
                downloads: 6254,
                lastUpdated: '2025-03-10',
                installCommand: 'npx',
                args: ['@modelcontextprotocol/server-shell', '--allow-commands', 'ls,cat,echo'],
                capabilities: ['Command execution', 'Process management'],
                requiresConfiguration: true,
                configurationSchema: {
                    type: 'object',
                    required: ['allowedCommands'],
                    properties: {
                        allowedCommands: {
                            type: 'string',
                            description: 'Comma-separated list of allowed commands'
                        },
                        timeoutSeconds: {
                            type: 'number',
                            description: 'Maximum execution time for commands (in seconds)'
                        }
                    }
                }
            },
            {
                id: 'browser-mcp-server',
                name: 'Browser MCP Server',
                description: 'Allows AI agents to browse and interact with web content through MCP',
                version: '1.0.0',
                publisher: 'Web Agents Inc.',
                category: 'Web',
                rating: 4.5,
                downloads: 7829,
                lastUpdated: '2025-04-10',
                installCommand: 'npx',
                args: ['@modelcontextprotocol/server-browser'],
                capabilities: ['Web browsing', 'HTML parsing', 'Form filling', 'Screenshot capture'],
                requiresConfiguration: false
            },
            {
                id: 'database-mcp-server',
                name: 'Database MCP Server',
                description: 'Provides database access for AI agents through the Model Context Protocol',
                version: '0.7.1',
                publisher: 'Data Solutions',
                category: 'Databases',
                rating: 4.2,
                downloads: 3845,
                lastUpdated: '2025-02-28',
                installCommand: 'npx',
                args: ['@modelcontextprotocol/server-database'],
                capabilities: ['SQL query execution', 'Schema inspection', 'Result formatting'],
                requiresConfiguration: true,
                configurationSchema: {
                    type: 'object',
                    required: ['connectionString', 'databaseType'],
                    properties: {
                        connectionString: {
                            type: 'string',
                            description: 'Database connection string'
                        },
                        databaseType: {
                            type: 'string',
                            description: 'Type of database (mysql, postgres, sqlite)'
                        },
                        maxRows: {
                            type: 'number',
                            description: 'Maximum number of rows to return'
                        }
                    }
                }
            },
            {
                id: 'code-as-mcp-server',
                name: 'VSCode as MCP Server',
                description: 'Turns your VSCode into an MCP server, enabling advanced coding assistance from MCP clients',
                version: '1.0.2',
                publisher: 'acomagu',
                category: 'Development Tools',
                rating: 4.9,
                downloads: 322,
                lastUpdated: '2025-04-15',
                installCommand: 'npx',
                args: ['vscode-as-mcp-server'],
                capabilities: ['Code editing', 'Terminal operations', 'Preview tools', 'Multi-instance switching'],
                requiresConfiguration: false
            }
        ];
    }
}