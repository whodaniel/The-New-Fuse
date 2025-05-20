/**
 * Simplified Agent Communication Module
 *
 * This is a basic implementation to get started quickly.
 */
import * as vscode from 'vscode';
export interface AgentMessage {
    id: string;
    sender: string;
    recipient: string;
    action: string;
    payload: any;
    timestamp: number;
}
export declare class AgentClient {
    private context;
    private agentId;
    private messageCallbacks;
    constructor(context: vscode.ExtensionContext, agentId: string);
    register(name: string, capabilities: string[], version: string): Promise<boolean>;
    sendMessage(recipient: string, action: string, payload: any): Promise<boolean>;
    broadcast(action: string, payload: any): Promise<boolean>;
    subscribe(callback: (message: AgentMessage) => Promise<void>): Promise<boolean>;
    private checkForMessages;
}
export declare function initializeOrchestrator(context: vscode.ExtensionContext): any;
export declare function createAgentClient(context: vscode.ExtensionContext, agentId: string): AgentClient;
//# sourceMappingURL=agent-communication-simple.d.ts.map