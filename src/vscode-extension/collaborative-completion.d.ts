import * as vscode from 'vscode';
import { AgentClient } from './agent-communication.js';
import { LMAPIBridge } from './lm-api-bridge.js';
/**
 * Collaborative Completion Provider
 *
 * Coordinate multiple AI agents to provide code completions together
 */
export declare class CollaborativeCompletionProvider implements vscode.CompletionItemProvider {
    private context;
    private agentClient;
    private lmBridge;
    private outputChannel;
    private activeAgents;
    private isCollaborativeModeEnabled;
    private combineMode;
    private onDidChangeModeListeners;
    constructor(context: vscode.ExtensionContext, agentClient: AgentClient, lmBridge: LMAPIBridge);
    /**
     * Register commands
     */
    private registerCommands;
    /**
     * Toggle collaborative completion mode
     */
    toggleCollaborativeMode(): void;
    /**
     * Select completion combine mode
     */
    private selectCompletionCombineMode;
    /**
     * Handler for agent messages
     */
    private handleAgentMessage;
    /**
     * VS Code completion provider implementation
     */
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): Promise<vscode.CompletionItem[] | vscode.CompletionList>;
    /**
     * Get completions from multiple AI agents
     */
    private getCompletionsFromAgents;
    /**
     * Request a completion from a specific agent
     */
    private requestCompletionFromAgent;
    /**
     * Get a fallback completion using the language model bridge
     */
    private getFallbackCompletion;
    /**
     * Process completions according to the selected combine mode
     */
    private processCompletions;
    /**
     * Register a listener for mode changes
     */
    onDidChangeMode(listener: (isEnabled: boolean) => void): vscode.Disposable;
    /**
     * Notify listeners of mode change
     */
    private notifyModeChange;
    /**
     * Log a message to the output channel
     */
    private log;
}
/**
 * Create a collaborative completion provider
 */
export declare function createCollaborativeCompletionProvider(context: vscode.ExtensionContext, agentClient: AgentClient, lmBridge: LMAPIBridge): CollaborativeCompletionProvider;
//# sourceMappingURL=collaborative-completion.d.ts.map