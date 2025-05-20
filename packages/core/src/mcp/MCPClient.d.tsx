import { MCPAgent, MCPCapability, MCPMessage } from './types.js';
export declare class MCPClient implements MCPAgent {
    private server;
    readonly id: string;
    capabilities: Map<string, MCPCapability>;
    constructor(id: string);
    sendMessage(message: MCPMessage): Promise<void>;
    onMessage(message: MCPMessage): Promise<void>;
    requestCapability(targetAgent: string, capability: string, params: unknown): Promise<any>;
}
