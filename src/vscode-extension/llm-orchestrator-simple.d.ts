/**
 * Simplified LLM Orchestrator
 */
import * as vscode from 'vscode';
export declare class LLMOrchestrator {
    private context;
    private statusBarItem;
    private registeredAgents;
    constructor(context: vscode.ExtensionContext);
    private registerCommands;
    private discoverLLMAgents;
    private showAgentsMenu;
    getRegisteredAgents(): any[];
    dispose(): void;
}
export declare function createLLMOrchestrator(context: vscode.ExtensionContext): LLMOrchestrator;
//# sourceMappingURL=llm-orchestrator-simple.d.ts.map