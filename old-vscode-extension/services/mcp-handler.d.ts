/// <reference types="node" />
import { EventEmitter } from 'events';
import { MCPRequest, MCPResponse, AgentCapability } from '../types/shared.js';
export declare class MCPHandler extends EventEmitter {
    private static instance;
    private logger;
    private config;
    private capabilities;
    private contextMap;
    private constructor();
    static getInstance(): MCPHandler;
    initialize(): Promise<void>;
    private registerCoreCapabilities;
    handleRequest(request: MCPRequest, sourceAgent: string): Promise<MCPResponse>;
    private validateRequest;
    private handleContextRequest;
    private handleCapabilityRequest;
    private handleCodeExecutionRequest;
    private hasExecutionPermission;
    private executeCode;
    getCapabilities(agentId: string): AgentCapability[];
    getContext(agentId: string, contextType: string): Record<string, any>;
}
//# sourceMappingURL=mcp-handler.d.ts.map