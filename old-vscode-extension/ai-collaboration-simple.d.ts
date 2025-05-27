/**
 * Simplified AI Collaboration Module
 */
import * as vscode from 'vscode';
import { AgentClient } from './agent-communication-simple.js';
import { LMAPIBridge } from './lm-api-bridge-simple.js';
export declare class AICollaborationManager {
    private context;
    private agentClient;
    private lmBridge;
    constructor(context: vscode.ExtensionContext, agentClient: AgentClient, lmBridge: LMAPIBridge);
    startWorkflow(workflow: any, initialContext?: any): Promise<any>;
    getPredefinedWorkflows(): any[];
}
export declare function createAICollaborationManager(context: vscode.ExtensionContext, agentClient: AgentClient, lmBridge: LMAPIBridge): AICollaborationManager;
//# sourceMappingURL=ai-collaboration-simple.d.ts.map