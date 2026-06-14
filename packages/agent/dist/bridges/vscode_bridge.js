"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VSCodeBridge = void 0;
const index_js_1 = require("./index.js");
/**
 * VSCode Bridge Implementation
 */
class VSCodeBridge extends index_js_1.BaseBridge {
    constructor(config = {}) {
        super('vscode-bridge');
        this.currentContext = null;
        this.workspaceContext = null;
        this.commandHandlers = new Map();
        this.contextUpdateInterval = null;
        this.vscodeApi = null;
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
    async connect() {
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
        }
        catch (error) {
            this.emit('error', error);
            // Continue without VS Code - may be running in different environment
            this.isConnected = true;
            this.emit('connected');
        }
    }
    /**
     * Disconnect from VS Code
     */
    async disconnect() {
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
    async sendMessage(message, messageType = index_js_1.MessageType.COMMAND, priority = index_js_1.Priority.MEDIUM) {
        const command = this.messageToCommand(message, messageType);
        await this.executeCommand(command);
    }
    /**
     * Execute an IDE command
     */
    async executeCommand(command) {
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
        }
        catch (error) {
            const result = {
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
    getEditorContext() {
        return this.currentContext;
    }
    /**
     * Get workspace context
     */
    getWorkspaceContext() {
        return this.workspaceContext;
    }
    /**
     * Update editor context manually
     */
    updateContext(context) {
        this.currentContext = {
            ...this.currentContext,
            ...context,
        };
        this.emit('context:updated', this.currentContext);
    }
    /**
     * Register a command handler
     */
    registerCommandHandler(type, handler) {
        this.commandHandlers.set(type, handler);
    }
    /**
     * Create an edit command
     */
    createEditCommand(file, edits) {
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
    createNavigationCommand(file, line, character) {
        return {
            id: `nav-${Date.now()}-${globalThis.crypto.randomUUID().split('-')[0]}`,
            type: 'navigate',
            payload: { file, line, character },
        };
    }
    /**
     * Create a terminal command
     */
    createTerminalCommand(command, cwd) {
        return {
            id: `term-${Date.now()}-${globalThis.crypto.randomUUID().split('-')[0]}`,
            type: 'terminal',
            payload: { command, cwd },
        };
    }
    /**
     * Create a search command
     */
    createSearchCommand(query, options) {
        return {
            id: `search-${Date.now()}-${globalThis.crypto.randomUUID().split('-')[0]}`,
            type: 'search',
            payload: { query, ...options },
        };
    }
    /**
     * Register default command handlers
     */
    registerDefaultHandlers() {
        // Edit handler
        this.commandHandlers.set('edit', async (cmd) => {
            const { file, edits } = cmd.payload;
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
            const { file, line, character } = cmd.payload;
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
            const { command, cwd } = cmd.payload;
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
            const { query, ...options } = cmd.payload;
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
    async acquireVSCodeApi() {
        // In webview context
        if (typeof window !== 'undefined' && 'acquireVsCodeApi' in window) {
            return window.acquireVsCodeApi();
        }
        // In extension context - would need to be passed in
        return null;
    }
    /**
     * Setup message listener for VS Code extension messages
     */
    setupMessageListener() {
        if (typeof window !== 'undefined') {
            window.addEventListener('message', (event) => {
                const message = event.data;
                if (message && message.type === 'tnf-context-update') {
                    this.handleContextUpdate(message.payload);
                }
                else if (message && message.type === 'tnf-command-result') {
                    this.emit('command:result', message.payload);
                }
            });
        }
    }
    /**
     * Start automatic context updates
     */
    startContextUpdates() {
        this.contextUpdateInterval = setInterval(() => {
            this.requestContextUpdate();
        }, this.config.contextUpdateInterval);
    }
    /**
     * Request context update from extension
     */
    requestContextUpdate() {
        if (this.vscodeApi &&
            typeof this.vscodeApi.postMessage === 'function') {
            this.vscodeApi.postMessage({
                type: 'tnf-request-context',
            });
        }
    }
    /**
     * Handle context update from extension
     */
    handleContextUpdate(payload) {
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
    async sendToExtension(command) {
        return new Promise((resolve, reject) => {
            if (!this.vscodeApi ||
                typeof this.vscodeApi.postMessage !== 'function') {
                reject(new Error('VS Code API not available'));
                return;
            }
            const timeout = setTimeout(() => {
                reject(new Error('Command timeout'));
            }, 30000);
            const handler = (event) => {
                const message = event.data;
                if (message && message.type === 'tnf-command-result' && message.commandId === command.id) {
                    clearTimeout(timeout);
                    window.removeEventListener('message', handler);
                    if (message.success) {
                        resolve(message.result);
                    }
                    else {
                        reject(new Error(message.error));
                    }
                }
            };
            window.addEventListener('message', handler);
            this.vscodeApi.postMessage({
                type: 'tnf-command',
                command,
            });
        });
    }
    /**
     * Convert generic message to IDE command
     */
    messageToCommand(message, messageType) {
        return {
            id: message.id || `cmd-${Date.now()}`,
            type: message.commandType || 'execute',
            payload: message.payload || message,
            context: this.currentContext ?? undefined,
        };
    }
    /**
     * Get bridge statistics
     */
    getStats() {
        return {
            connected: this.isConnected,
            hasContext: this.currentContext !== null,
            hasWorkspaceContext: this.workspaceContext !== null,
            handlerCount: this.commandHandlers.size,
        };
    }
}
exports.VSCodeBridge = VSCodeBridge;
exports.default = VSCodeBridge;
//# sourceMappingURL=vscode_bridge.js.map