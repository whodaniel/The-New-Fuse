import { MCPCapability, MCPAgent } from './types.js';
export declare class MCPAgentServer implements MCPAgent {
    private static instance;
    readonly id: string;
    capabilities: Map<string, MCPCapability>;
    private messageHandlers;
    private constructor();
    static getInstance(id: string): MCPAgentServer;
    private initializeCapabilities;
}
