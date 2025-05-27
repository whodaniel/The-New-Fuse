/**
 * LLM Orchestrator for VS Code Extensions
 *
 * This module coordinates multiple AI LLM extensions in VS Code
 * to enable collaborative AI coding capabilities.
 */
import * as vscode from 'vscode';
import * as React from 'react';
export interface LLMAgent {
    id: string;
    name: string;
    description: string;
    capabilities: string[];
    version: string;
    extensionId: string;
    commandId: string;
}
export interface AgentTask {
    id: string;
    agentId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    action: string;
    input: any;
    result?: any;
    startTime: number;
    endTime?: number;
    error?: string;
}
export declare class LLMOrchestrator {
    private context;
    private agentClient;
    private registeredAgents;
    private activeTasks;
    private statusBarItem;
    private outputChannel;
    private logger;
    constructor(context: vscode.ExtensionContext);
    private initialize;
    private registerCommands;
    private handleMessage;
    private discoverLLMAgents;
    private registerAgent;
    private executeAgentAction;
    private updateTaskStatus;
    private handleAssistanceRequest;
    private showAgentsMenu;
    private showAgentActions;
    private executeCodeGeneration;
    private executeCodeExplanation;
    private executeCodeRefactoring;
    private executeAskQuestion;
    private unregisterAgent;
    private startCollaborativeTask;
    private log;
    dispose(): void;
    private executeStep;
}
export declare const OrchestratorUI: React.FC<{
    orchestrator: LLMOrchestrator;
}>;
export declare function createLLMOrchestrator(context: vscode.ExtensionContext): LLMOrchestrator;
//# sourceMappingURL=llm-orchestrator.d.ts.map