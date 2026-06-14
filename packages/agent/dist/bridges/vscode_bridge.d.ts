/**
 * VSCode Bridge - IDE Integration for Agent Communication
 *
 * Enables communication between TNF agents and VS Code/Cursor/Antigravity IDE.
 * Uses the Language Model API and extension messaging.
 *
 * BMAD HIERARCHY POSITION:
 * - Skills Composition: Uses ClaudeSkillsManager for skill execution
 * - Tool Creation: Exposes IDE tools to agents
 * - Context Engineering: Manages editor context for prompts
 * - Prompt Engineering: Templates for IDE-specific actions
 *
 * CONNECTS TO:
 * - UniversalBridge: For transport
 * - ClaudeSkillsManager: For skill execution
 * - PromptTemplateService: For prompt management
 */
import { BaseBridge, MessageType, Priority } from './index.js';
export interface EditorContext {
    file: string;
    language: string;
    selection?: {
        start: {
            line: number;
            character: number;
        };
        end: {
            line: number;
            character: number;
        };
        text: string;
    };
    visibleRange?: {
        start: number;
        end: number;
    };
    cursorPosition?: {
        line: number;
        character: number;
    };
    diagnostics?: Array<{
        severity: 'error' | 'warning' | 'info' | 'hint';
        message: string;
        range: {
            start: number;
            end: number;
        };
    }>;
}
export interface WorkspaceContext {
    rootPath: string;
    openFiles: string[];
    activeFile?: string;
    gitBranch?: string;
    gitStatus?: {
        modified: string[];
        staged: string[];
        untracked: string[];
    };
}
export interface IDECommand {
    id: string;
    type: 'edit' | 'navigate' | 'execute' | 'search' | 'terminal' | 'debug';
    payload: Record<string, unknown>;
    context?: EditorContext;
}
export interface IDECommandResult {
    commandId: string;
    success: boolean;
    result?: unknown;
    error?: string;
    duration: number;
}
export interface VSCodeBridgeConfig {
    extensionId?: string;
    enableAutoContext?: boolean;
    contextUpdateInterval?: number;
    enableDiagnostics?: boolean;
}
/**
 * VSCode Bridge Implementation
 */
export declare class VSCodeBridge extends BaseBridge {
    private config;
    private currentContext;
    private workspaceContext;
    private commandHandlers;
    private contextUpdateInterval;
    private vscodeApi;
    constructor(config?: VSCodeBridgeConfig);
    /**
     * Connect to VS Code extension
     */
    connect(): Promise<void>;
    /**
     * Disconnect from VS Code
     */
    disconnect(): Promise<void>;
    /**
     * Send a message (implements BaseBridge)
     */
    sendMessage(message: Record<string, unknown>, messageType?: MessageType, priority?: Priority): Promise<void>;
    /**
     * Execute an IDE command
     */
    executeCommand(command: IDECommand): Promise<IDECommandResult>;
    /**
     * Get current editor context
     */
    getEditorContext(): EditorContext | null;
    /**
     * Get workspace context
     */
    getWorkspaceContext(): WorkspaceContext | null;
    /**
     * Update editor context manually
     */
    updateContext(context: Partial<EditorContext>): void;
    /**
     * Register a command handler
     */
    registerCommandHandler(type: string, handler: (cmd: IDECommand) => Promise<IDECommandResult>): void;
    /**
     * Create an edit command
     */
    createEditCommand(file: string, edits: Array<{
        range: {
            start: number;
            end: number;
        };
        text: string;
    }>): IDECommand;
    /**
     * Create a navigation command
     */
    createNavigationCommand(file: string, line?: number, character?: number): IDECommand;
    /**
     * Create a terminal command
     */
    createTerminalCommand(command: string, cwd?: string): IDECommand;
    /**
     * Create a search command
     */
    createSearchCommand(query: string, options?: {
        regex?: boolean;
        caseSensitive?: boolean;
        wholeWord?: boolean;
        includePattern?: string;
        excludePattern?: string;
    }): IDECommand;
    /**
     * Register default command handlers
     */
    private registerDefaultHandlers;
    /**
     * Try to acquire VS Code API
     */
    private acquireVSCodeApi;
    /**
     * Setup message listener for VS Code extension messages
     */
    private setupMessageListener;
    /**
     * Start automatic context updates
     */
    private startContextUpdates;
    /**
     * Request context update from extension
     */
    private requestContextUpdate;
    /**
     * Handle context update from extension
     */
    private handleContextUpdate;
    /**
     * Send command to VS Code extension
     */
    private sendToExtension;
    /**
     * Convert generic message to IDE command
     */
    private messageToCommand;
    /**
     * Get bridge statistics
     */
    getStats(): {
        connected: boolean;
        hasContext: boolean;
        hasWorkspaceContext: boolean;
        handlerCount: number;
    };
}
export default VSCodeBridge;
//# sourceMappingURL=vscode_bridge.d.ts.map