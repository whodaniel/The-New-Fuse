import * as vscode from 'vscode';
import { AgentClient } from './agent-communication.js';
import { LMAPIBridge } from './lm-api-bridge.js';
export interface AICollaborationWorkflow {
    id: string;
    type: string;
    steps: WorkflowStep[];
}
interface WorkflowStep {
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
    private workflows;
    constructor(context: vscode.ExtensionContext, agentClient: AgentClient, lmBridge: LMAPIBridge);
    startWorkflow(workflow: AICollaborationWorkflow, initialContext?: Record<string, any>): Promise<{
        workflowId: string;
        success: boolean;
    }>;
    private executeWorkflowStep;
    private executeAgentTask;
    private executeLLMGeneration;
}
export {};
//# sourceMappingURL=ai-collaboration.d.ts.map