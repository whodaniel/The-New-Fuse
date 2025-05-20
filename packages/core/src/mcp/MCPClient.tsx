import { MCPMessage, MCPAgent, MCPCapability } from './types.js';
import { MCPAgentServer } from './MCPAgentServer.js';

export class MCPClient implements MCPAgent {
    private server: MCPAgentServer;
    public readonly id: string;
    public capabilities: Map<string, MCPCapability>;

    constructor(id: string) {
        this.id = id;
        this.capabilities = new Map();
        this.server = MCPAgentServer.getInstance('mcp_server');
    }

    public async sendMessage(message: MCPMessage): Promise<void> {
        await this.server.onMessage(message);
    }

    public async onMessage(message: MCPMessage): Promise<void> {
        // Handle incoming messages
        console.log(`Received MCP message: ${message.messageId}`);
    }

    public async requestCapability(
        targetAgent: string,
        capability: string,
        params: unknown
    ): Promise<any> {
        const message: MCPMessage = {
            version: '1.0.0',
            messageId: crypto.randomUUID(),
            timestamp: Date.now(),
            source: {
                id: this.id,
                type: 'ai_agent',
                capabilities: Array.from(this.capabilities.keys())
            },
            target: {
                id: targetAgent,
                type: 'ai_agent'
            },
            content: {
                type: 'capability_request',
                action: capability,
                data: params,
                priority: 'medium'
            },
            metadata: {
                conversationId: crypto.randomUUID(),
                protocol: 'mcp',
                protocolVersion: '1.0.0'
            }
        };

        await this.sendMessage(message);
    }
}