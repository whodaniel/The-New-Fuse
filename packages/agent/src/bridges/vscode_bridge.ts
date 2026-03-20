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

import { BaseBridge, MessageType, Priority } from './index';

// IDE Context Types
export interface EditorContext {
  file: string;
  language: string;
  selection?: {
    start: { line: number; character: number };
    end: { line: number; character: number };
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
    range: { start: number; end: number };
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

// IDE Command Types
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

// Bridge Configuration
export interface VSCodeBridgeConfig {
  extensionId?: string;
  enableAutoContext?: boolean;
  contextUpdateInterval?: number;
  enableDiagnostics?: boolean;
}

/**
 * VSCode Bridge Implementation
 */
export class VSCodeBridge extends BaseBridge {
  private config: VSCodeBridgeConfig;
  private currentContext: EditorContext | null = null;
  private workspaceContext: WorkspaceContext | null = null;
  private commandHandlers: Map<string, (cmd: IDECommand) => Promise<IDECommandResult>> = new Map();
  private contextUpdateInterval: ReturnType<typeof setInterval> | null = null;
  private vscodeApi: unknown = null;

  constructor(config: VSCodeBridgeConfig = {}) {
    super('vscode-bridge');
    this.config = {
      extensionId: config.extensionId || 'the-new-fuse.vscode-extension',
      enableAutoContext: config.enableAutoContext ?? true,
      contextUpdateInterval: config.contextUpdateInterval || 1000,
      enableDiagnostics: config.enableDiagnostics ?? true,
    };

    // Register default command handlers
    this.registerDefaultHandlers();
  }

  /**
   * Connect to VS Code extension
   */
  async connect(): Promise<void> {
    this.emit('connecting');

    try {
      // Try to acquire VS Code API
      this.vscodeApi = await this.acquireVSCodeApi();

      if (this.vscodeApi) {
        // Start context updates if enabled
        if (this.config.enableAutoContext) {
          this.startContextUpdates();
        }

        // Listen for messages from extension
        this.setupMessageListener();
      }

      this.isConnected = true;
      this.emit('connected');
    } catch (error) {
      this.emit('error', error);
      // Continue without VS Code - may be running in different environment
      this.isConnected = true;
      this.emit('connected');
    }
  }

  /**
   * Disconnect from VS Code
   */
  async disconnect(): Promise<void> {
    if (this.contextUpdateInterval) {
      clearInterval(this.contextUpdateInterval);
      this.contextUpdateInterval = null;
    }

    this.currentContext = null;
    this.workspaceContext = null;
    this.isConnected = false;
    this.emit('disconnected');
  }

  /**
   * Send a message (implements BaseBridge)
   */
  async sendMessage(
    message: Record<string, unknown>,
    messageType: MessageType = MessageType.COMMAND,
    priority: Priority = Priority.MEDIUM
  ): Promise<void> {
    const command = this.messageToCommand(message, messageType);
    await this.executeCommand(command);
  }

  /**
   * Execute an IDE command
   */
  async executeCommand(command: IDECommand): Promise<IDECommandResult> {
    const startTime = Date.now();

    this.emit('command:executing', command);

    try {
      // Check for registered handler
      const handler = this.commandHandlers.get(command.type);
      if (handler) {
        const result = await handler(command);
        this.emit('command:completed', result);
        return result;
      }

      // Fallback: try to send to VS Code extension
      if (this.vscodeApi) {
        const result = await this.sendToExtension(command);
        return {
          commandId: command.id,
          success: true,
          result,
          duration: Date.now() - startTime,
        };
      }

      // No handler available
      return {
        commandId: command.id,
        success: false,
        error: `No handler for command type: ${command.type}`,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const result: IDECommandResult = {
        commandId: command.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
      this.emit('command:failed', result);
      return result;
    }
  }

  /**
   * Get current editor context
   */
  getEditorContext(): EditorContext | null {
    return this.currentContext;
  }

  /**
   * Get workspace context
   */
  getWorkspaceContext(): WorkspaceContext | null {
    return this.workspaceContext;
  }

  /**
   * Update editor context manually
   */
  updateContext(context: Partial<EditorContext>): void {
    this.currentContext = {
      ...this.currentContext,
      ...context,
    } as EditorContext;
    this.emit('context:updated', this.currentContext);
  }

  /**
   * Register a command handler
   */
  registerCommandHandler(
    type: string,
    handler: (cmd: IDECommand) => Promise<IDECommandResult>
  ): void {
    this.commandHandlers.set(type, handler);
  }

  /**
   * Create an edit command
   */
  createEditCommand(
    file: string,
    edits: Array<{ range: { start: number; end: number }; text: string }>
  ): IDECommand {
    return {
      id: `edit-${Date.now()}-${globalThis.crypto.randomUUID().split('-')[0]}`,
      type: 'edit',
      payload: { file, edits },
      context: this.currentContext ?? undefined,
    };
  }

  /**
   * Create a navigation command
   */
  createNavigationCommand(file: string, line?: number, character?: number): IDECommand {
    return {
      id: `nav-${Date.now()}-${globalThis.crypto.randomUUID().split('-')[0]}`,
      type: 'navigate',
      payload: { file, line, character },
    };
  }

  /**
   * Create a terminal command
   */
  createTerminalCommand(command: string, cwd?: string): IDECommand {
    return {
      id: `term-${Date.now()}-${globalThis.crypto.randomUUID().split('-')[0]}`,
      type: 'terminal',
      payload: { command, cwd },
    };
  }

  /**
   * Create a search command
   */
  createSearchCommand(
    query: string,
    options?: {
      regex?: boolean;
      caseSensitive?: boolean;
      wholeWord?: boolean;
      includePattern?: string;
      excludePattern?: string;
    }
  ): IDECommand {
    return {
      id: `search-${Date.now()}-${globalThis.crypto.randomUUID().split('-')[0]}`,
      type: 'search',
      payload: { query, ...options },
    };
  }

  /**
   * Register default command handlers
   */
  private registerDefaultHandlers(): void {
    // Edit handler
    this.commandHandlers.set('edit', async (cmd) => {
      const { file, edits } = cmd.payload as {
        file: string;
        edits: Array<{ range: { start: number; end: number }; text: string }>;
      };

      // In a real implementation, this would apply edits via VS Code API
      this.emit('ide:edit', { file, edits });

      return {
        commandId: cmd.id,
        success: true,
        result: { file, editCount: edits.length },
        duration: 0,
      };
    });

    // Navigate handler
    this.commandHandlers.set('navigate', async (cmd) => {
      const { file, line, character } = cmd.payload as {
        file: string;
        line?: number;
        character?: number;
      };

      this.emit('ide:navigate', { file, line, character });

      return {
        commandId: cmd.id,
        success: true,
        result: { file, line, character },
        duration: 0,
      };
    });

    // Terminal handler
    this.commandHandlers.set('terminal', async (cmd) => {
      const { command, cwd } = cmd.payload as { command: string; cwd?: string };

      this.emit('ide:terminal', { command, cwd });

      return {
        commandId: cmd.id,
        success: true,
        result: { command, queued: true },
        duration: 0,
      };
    });

    // Search handler
    this.commandHandlers.set('search', async (cmd) => {
      const { query, ...options } = cmd.payload as { query: string; [key: string]: unknown };

      this.emit('ide:search', { query, options });

      return {
        commandId: cmd.id,
        success: true,
        result: { query, searching: true },
        duration: 0,
      };
    });
  }

  /**
   * Try to acquire VS Code API
   */
  private async acquireVSCodeApi(): Promise<unknown> {
    // In webview context
    if (typeof window !== 'undefined' && 'acquireVsCodeApi' in window) {
      return (window as unknown as { acquireVsCodeApi: () => unknown }).acquireVsCodeApi();
    }

    // In extension context - would need to be passed in
    return null;
  }

  /**
   * Setup message listener for VS Code extension messages
   */
  private setupMessageListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('message', (event) => {
        const message = event.data;
        if (message && message.type === 'tnf-context-update') {
          this.handleContextUpdate(message.payload);
        } else if (message && message.type === 'tnf-command-result') {
          this.emit('command:result', message.payload);
        }
      });
    }
  }

  /**
   * Start automatic context updates
   */
  private startContextUpdates(): void {
    this.contextUpdateInterval = setInterval(() => {
      this.requestContextUpdate();
    }, this.config.contextUpdateInterval);
  }

  /**
   * Request context update from extension
   */
  private requestContextUpdate(): void {
    if (
      this.vscodeApi &&
      typeof (this.vscodeApi as { postMessage?: unknown }).postMessage === 'function'
    ) {
      (this.vscodeApi as { postMessage: (msg: unknown) => void }).postMessage({
        type: 'tnf-request-context',
      });
    }
  }

  /**
   * Handle context update from extension
   */
  private handleContextUpdate(payload: {
    editor?: EditorContext;
    workspace?: WorkspaceContext;
  }): void {
    if (payload.editor) {
      this.currentContext = payload.editor;
      this.emit('context:editor', payload.editor);
    }
    if (payload.workspace) {
      this.workspaceContext = payload.workspace;
      this.emit('context:workspace', payload.workspace);
    }
  }

  /**
   * Send command to VS Code extension
   */
  private async sendToExtension(command: IDECommand): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (
        !this.vscodeApi ||
        typeof (this.vscodeApi as { postMessage?: unknown }).postMessage !== 'function'
      ) {
        reject(new Error('VS Code API not available'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Command timeout'));
      }, 30000);

      const handler = (event: MessageEvent) => {
        const message = event.data;
        if (message && message.type === 'tnf-command-result' && message.commandId === command.id) {
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
          if (message.success) {
            resolve(message.result);
          } else {
            reject(new Error(message.error));
          }
        }
      };

      window.addEventListener('message', handler);

      (this.vscodeApi as { postMessage: (msg: unknown) => void }).postMessage({
        type: 'tnf-command',
        command,
      });
    });
  }

  /**
   * Convert generic message to IDE command
   */
  private messageToCommand(message: Record<string, unknown>, messageType: MessageType): IDECommand {
    return {
      id: (message.id as string) || `cmd-${Date.now()}`,
      type: (message.commandType as IDECommand['type']) || 'execute',
      payload: (message.payload as Record<string, unknown>) || message,
      context: this.currentContext ?? undefined,
    };
  }

  /**
   * Get bridge statistics
   */
  getStats(): {
    connected: boolean;
    hasContext: boolean;
    hasWorkspaceContext: boolean;
    handlerCount: number;
  } {
    return {
      connected: this.isConnected,
      hasContext: this.currentContext !== null,
      hasWorkspaceContext: this.workspaceContext !== null,
      handlerCount: this.commandHandlers.size,
    };
  }
}

export default VSCodeBridge;
