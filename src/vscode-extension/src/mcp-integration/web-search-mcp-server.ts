import { MCPServer } from '../types/mcp.js';
import { Logger, getLogger } from '../core/logging.js';
import { WebSocket } from 'ws';

interface WebSearchMCPClientConfig {
    serverUrl: string;
    serverName: string;
    autoReconnect: boolean;
    onConnected: () => void;
    onDisconnected: () => void;
    onError: (error: any) => void;
}

class WebSearchMCPClient {
    private ws: WebSocket | undefined;
    private config: WebSearchMCPClientConfig;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectInterval: number = 5000;

    constructor(config: WebSearchMCPClientConfig) {
        this.config = config;
    }

    public async connect(): Promise<void> {
        if (this.ws) {
            return;
        }

        try {
            this.ws = new WebSocket(this.config.serverUrl);

            this.ws.on('open', () => {
                this.reconnectAttempts = 0;
                this.config.onConnected();
            });

            this.ws.on('close', () => {
                this.ws = undefined;
                this.config.onDisconnected();

                if (this.config.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                    setTimeout(() => this.connect(), this.reconnectInterval);
                    this.reconnectAttempts++;
                }
            });

            this.ws.on('error', (error) => {
                this.config.onError(error);
            });

        } catch (error) {
            this.config.onError(error);
            throw error;
        }
    }

    public disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = undefined;
        }
    }

    public async sendMessage(message: any): Promise<any> {
        if (!this.ws) {
            throw new Error('Not connected to web search MCP server');
        }

        return new Promise((resolve, reject) => {
            try {
                this.ws!.send(JSON.stringify(message), (error) => {
                    if (error) {
                        reject(error);
                    }
                });

                this.ws!.once('message', (data) => {
                    try {
                        const response = JSON.parse(data.toString());
                        resolve(response);
                    } catch (error) {
                        reject(error);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }
}

export class WebSearchMCPServerManager {
    private webSearchClient: WebSearchMCPClient | undefined;
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    public async createServer(): Promise<MCPServer> {
        this.logger.info('Creating WebSearch MCP server configuration');

        const serverId = 'web-search-mcp';
        const server: MCPServer = {
            id: serverId,
            name: 'Web Search MCP',
            url: 'ws://localhost:3772', // Main MCP server port
            status: 'offline',
            isBuiltIn: true,
            config: {
                version: "1.0",
                tools: [
                    {
                        name: 'web_search',
                        description: 'Perform a web search query',
                        parameters: [
                            {
                                name: 'query',
                                description: 'The search query string',
                                type: 'string',
                                required: true
                            },
                            {
                                name: 'limit',
                                description: 'Maximum number of results to return',
                                type: 'number',
                                required: false,
                                default: 10
                            }
                        ]
                    }
                ]
            }
        };

        try {
            // Initialize web search MCP client
            this.webSearchClient = new WebSearchMCPClient({
                serverUrl: server.url,
                serverName: server.name,
                autoReconnect: true,
                onConnected: () => {
                    this.logger.info('WebSearch MCP client connected');
                    server.status = 'online';
                },
                onDisconnected: () => {
                    this.logger.info('WebSearch MCP client disconnected');
                    server.status = 'offline';
                },
                onError: (error) => {
                    this.logger.error(`WebSearch MCP client error: ${error}`);
                    server.status = 'error';
                }
            });

            return server;
        } catch (error) {
            this.logger.error(`Failed to create WebSearch MCP server: ${error}`);
            throw error;
        }
    }

    public async connect(): Promise<void> {
        if (!this.webSearchClient) {
            throw new Error('WebSearch MCP client not initialized');
        }

        try {
            await this.webSearchClient.connect();
        } catch (error) {
            this.logger.error(`Failed to connect WebSearch MCP client: ${error}`);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        if (!this.webSearchClient) {
            return;
        }

        try {
            this.webSearchClient.disconnect();
        } catch (error) {
            this.logger.error(`Failed to disconnect WebSearch MCP client: ${error}`);
            throw error;
        }
    }

    public dispose(): void {
        this.disconnect().catch(error => {
            this.logger.error(`Error during WebSearch MCP disposal: ${error}`);
        });
        this.webSearchClient = undefined;
    }
}