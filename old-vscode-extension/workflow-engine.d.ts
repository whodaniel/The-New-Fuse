import * as vscode from 'vscode';
import { AgentClient } from './agent-communication.js';
import { Logger } from './core/logging.js';
export declare class WorkflowEngine {
    private readonly logger;
    private readonly context;
    private readonly agentClient;
    constructor(logger: Logger, context: vscode.ExtensionContext, agentClient: AgentClient);
    initializeWorkflow(): Promise<void>;
    private startWorkflow;
    dispose(): void;
}
//# sourceMappingURL=workflow-engine.d.ts.map