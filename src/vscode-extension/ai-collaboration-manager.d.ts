import * as vscode from 'vscode';
import { LMAPIBridge } from './lm-api-bridge.js';
import { AgentClient } from './agent-communication.js';
export interface AICollaborationWorkflow {
    id: string;
    type: string;
    tasks: WorkflowTask[];
    context?: Record<string, any>;
}
interface WorkflowTask {
    id: string;
    type: string;
    agentId?: string;
    input?: any;
    output?: any;
}
export declare class AICollaborationManager {
    private context;
    private agentClient;
    private lmBridge;
    private logger;
    private workflows;
    constructor(context: vscode.ExtensionContext, agentClient: AgentClient, lmBridge: LMAPIBridge);
    startWorkflow(workflow: AICollaborationWorkflow, initialContext?: Record<string, any>): Promise<{
        workflowId: string;
        success: boolean;
    }>;
    private executeWorkflowTask;
    private executeAgentTask;
    private executeLLMGeneration;
}
export {};
//# sourceMappingURL=ai-collaboration-manager.d.ts.map