/**
 * Copilot Instance Coordination System
 * 
 * This system enables coordination between multiple Copilot instances running
 * in VS Code (sidebar chat vs editor inline suggestions) using The New Fuse
 * inter-AI communication framework.
 */

import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { AgentCommunicationService } from '../services/AgentCommunicationService';
import { FileProtocolService } from '../services/FileProtocolService';
import { WebviewMessageRouter } from '../services/communication/WebviewMessageRouter';
import { AgentMessageType } from '../types/agent-communication';

export interface CopilotInstance {
  id: string;
  type: 'sidebar_chat' | 'editor_inline' | 'notebook' | 'terminal';
  capabilities: string[];
  status: 'active' | 'idle' | 'busy';
  context: CopilotContext;
}

export interface CopilotContext {
  activeDocument?: vscode.TextDocument;
  cursorPosition?: vscode.Position;
  selection?: vscode.Selection;
  workspaceContext?: string;
  recentActivity?: string[];
  currentTask?: string;
}

export interface CoordinationMessage {
  id: string;
  fromInstance: string;
  toInstance: string | 'broadcast';
  type: 'context_share' | 'suggestion_request' | 'completion_sync' | 'task_handoff';
  payload: any;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Main coordinator for Copilot instances
 */
export class CopilotInstanceCoordinator extends EventEmitter {
  private instances: Map<string, CopilotInstance> = new Map();
  private agentCommunicationService: AgentCommunicationService;
  private fileProtocolService: FileProtocolService;
  private context: vscode.ExtensionContext;
  private isInitialized = false;
  private messageCount = 0;

  constructor(
    context: vscode.ExtensionContext,
    agentCommunicationService?: AgentCommunicationService,
    messageRouter?: WebviewMessageRouter
  ) {
    super();
    this.context = context;
    this.agentCommunicationService = agentCommunicationService || new AgentCommunicationService(context);
    
    // Initialize the existing file protocol service for inter-agent communication
    this.fileProtocolService = FileProtocolService.getInstance(context);
    
    // Optional message router for webview integration
    if (messageRouter) {
      this.setupWebviewIntegration(messageRouter);
    }
  }

  /**
   * Initialize the coordination system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {return;}

    try {
      // Initialize the file protocol service for communication
      await this.fileProtocolService.initialize();
      
      // Setup message handlers for Copilot coordination
      this.setupFileProtocolHandlers();

      // Register built-in Copilot instances
      await this.registerBuiltInInstances();

      // Setup VS Code event listeners
      this.setupVSCodeListeners();

      // Start context synchronization
      this.startContextSync();

      this.isInitialized = true;
      console.log('[CopilotCoordinator] Initialization complete');

    } catch (error) {
      console.error('[CopilotCoordinator] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Register a Copilot instance
   */
  async registerInstance(instance: CopilotInstance): Promise<void> {
    this.instances.set(instance.id, instance);
    
    // Notify other instances
    await this.broadcastMessage({
      type: 'instance_registered',
      payload: { instance: instance.id, capabilities: instance.capabilities }
    });

    this.emit('instanceRegistered', instance);
    console.log(`[CopilotCoordinator] Registered instance: ${instance.id}`);
  }

  /**
   * Coordinate between instances for enhanced suggestions
   */
  async coordinateSuggestions(
    requestingInstance: string,
    context: CopilotContext
  ): Promise<any[]> {
    const message: CoordinationMessage = {
      id: this.generateMessageId(),
      fromInstance: requestingInstance,
      toInstance: 'broadcast',
      type: 'suggestion_request',
      payload: { context, requester: requestingInstance },
      timestamp: Date.now(),
      priority: 'high'
    };

    // Send coordination message
    await this.sendMessage(message);

    // Collect responses from other instances
    return new Promise((resolve) => {
      const responses: any[] = [];
      const timeout = setTimeout(() => resolve(responses), 2000);

      this.once(`suggestion_responses_${message.id}`, (data) => {
        clearTimeout(timeout);
        resolve(data.responses);
      });
    });
  }

  /**
   * Request a suggestion from coordinated Copilot instances
   */
  async requestSuggestion(request: any): Promise<any> {
    const requestingInstance = 'main-coordinator';
    
    // Create context from the request
    const context: CopilotContext = {
      currentFile: request.file || '',
      cursorPosition: request.position || 0,
      selectedText: request.selectedText || '',
      recentEdits: request.recentEdits || [],
      projectContext: request.projectContext || {},
      activeInstances: this.getActiveInstances().map(i => i.id)
    };

    // Coordinate with all instances for suggestions
    const suggestions = await this.coordinateSuggestions(requestingInstance, context);
    
    return {
      suggestions,
      metadata: {
        instancesQueried: this.instances.size,
        timestamp: Date.now(),
        requestId: this.generateMessageId()
      }
    };
  }

  /**
   * Share context between instances
   */
  async shareContext(
    fromInstance: string,
    context: CopilotContext,
    targetInstance?: string
  ): Promise<void> {
    const message: CoordinationMessage = {
      id: this.generateMessageId(),
      fromInstance,
      toInstance: targetInstance || 'broadcast',
      type: 'context_share',
      payload: { context, sharedAt: Date.now() },
      timestamp: Date.now(),
      priority: 'medium'
    };

    await this.sendMessage(message);
  }

  /**
   * Handoff task between instances
   */
  async handoffTask(
    fromInstance: string,
    toInstance: string,
    task: any
  ): Promise<void> {
    const message: CoordinationMessage = {
      id: this.generateMessageId(),
      fromInstance,
      toInstance,
      type: 'task_handoff',
      payload: { task, handoffReason: 'capability_match' },
      timestamp: Date.now(),
      priority: 'high'
    };

    await this.sendMessage(message);

    // Update instance status
    const targetInstanceData = this.instances.get(toInstance);
    if (targetInstanceData) {
      targetInstanceData.status = 'busy';
      targetInstanceData.context.currentTask = task.description;
    }
  }

  /**
   * Get coordination statistics
   */
  getCoordinationStats(): any {
    return {
      activeInstances: this.instances.size,
      instances: Array.from(this.instances.values()).map(instance => ({
        id: instance.id,
        type: instance.type,
        status: instance.status,
        capabilities: instance.capabilities.length
      })),
      messagesSent: this.getMessageCount(),
      lastActivity: Date.now()
    };
  }

  /**
   * Get all active Copilot instances
   */
  getActiveInstances(): CopilotInstance[] {
    return Array.from(this.instances.values()).filter(instance => 
      instance.status === 'active' || instance.status === 'busy'
    );
  }

  /**
   * Register built-in Copilot instances
   */
  private async registerBuiltInInstances(): Promise<void> {
    // Sidebar Chat Instance
    await this.registerInstance({
      id: 'copilot-sidebar-chat',
      type: 'sidebar_chat',
      capabilities: [
        'conversational_ai',
        'code_explanation',
        'debugging_assistance',
        'project_analysis',
        'documentation_generation'
      ],
      status: 'active',
      context: {
        workspaceContext: 'chat_interface',
        recentActivity: [],
        currentTask: 'standby'
      }
    });

    // Editor Inline Instance
    await this.registerInstance({
      id: 'copilot-editor-inline',
      type: 'editor_inline',
      capabilities: [
        'code_completion',
        'syntax_suggestions',
        'refactoring_hints',
        'import_suggestions',
        'quick_fixes'
      ],
      status: 'active',
      context: {
        recentActivity: [],
        currentTask: 'code_assistance'
      }
    });

    // Notebook Instance (if available)
    if (vscode.workspace.workspaceFolders?.some(folder => 
      vscode.workspace.findFiles('**/*.ipynb', null, 1))) {
      await this.registerInstance({
        id: 'copilot-notebook',
        type: 'notebook',
        capabilities: [
          'data_analysis',
          'jupyter_completion',
          'markdown_assistance',
          'visualization_suggestions'
        ],
        status: 'active',
        context: {
          currentTask: 'notebook_assistance'
        }
      });
    }
  }

  /**
   * Handle coordination messages
   */
  private async handleCoordinationMessage(message: CoordinationMessage): Promise<void> {
    switch (message.type) {
      case 'context_share':
        await this.handleContextShare(message);
        break;
      case 'suggestion_request':
        await this.handleSuggestionRequest(message);
        break;
      case 'completion_sync':
        await this.handleCompletionSync(message);
        break;
      case 'task_handoff':
        await this.handleTaskHandoff(message);
        break;
    }

    this.emit('messageProcessed', message);
  }

  /**
   * Handle context sharing
   */
  private async handleContextShare(message: CoordinationMessage): Promise<void> {
    const { context } = message.payload;
    
    // Update context for target instance
    if (message.toInstance !== 'broadcast') {
      const instance = this.instances.get(message.toInstance);
      if (instance) {
        instance.context = { ...instance.context, ...context };
      }
    } else {
      // Broadcast to all instances
      for (const [instanceId, instance] of this.instances) {
        if (instanceId !== message.fromInstance) {
          instance.context = { ...instance.context, ...context };
        }
      }
    }

    this.emit('contextShared', {
      from: message.fromInstance,
      to: message.toInstance,
      context
    });
  }

  /**
   * Handle suggestion requests
   */
  private async handleSuggestionRequest(message: CoordinationMessage): Promise<void> {
    const { context, requester } = message.payload;
    const responses: any[] = [];

    // Collect suggestions from available instances
    for (const [instanceId, instance] of this.instances) {
      if (instanceId !== requester && instance.status === 'active') {
        try {
          const suggestion = await this.generateInstanceSuggestion(instance, context);
          if (suggestion) {
            responses.push({
              instanceId,
              suggestion,
              confidence: this.calculateSuggestionConfidence(instance, context)
            });
          }
        } catch (error) {
          console.error(`[CopilotCoordinator] Error getting suggestion from ${instanceId}:`, error);
        }
      }
    }

    this.emit(`suggestion_responses_${message.id}`, { responses });
  }

  /**
   * Generate suggestion from instance
   */
  private async generateInstanceSuggestion(
    instance: CopilotInstance,
    context: CopilotContext
  ): Promise<any> {
    // This would integrate with actual Copilot APIs
    // For now, return mock suggestions based on instance capabilities
    
    switch (instance.type) {
      case 'sidebar_chat':
        return {
          type: 'explanation',
          content: 'Would provide contextual explanation based on current code',
          source: 'chat_analysis'
        };
      
      case 'editor_inline':
        return {
          type: 'completion',
          content: 'Would provide code completion suggestions',
          source: 'inline_suggestions'
        };
      
      case 'notebook':
        return {
          type: 'data_insight',
          content: 'Would provide data analysis suggestions',
          source: 'notebook_analysis'
        };
      
      default:
        return null;
    }
  }

  /**
   * Calculate suggestion confidence
   */
  private calculateSuggestionConfidence(
    instance: CopilotInstance,
    context: CopilotContext
  ): number {
    // Calculate confidence based on instance capabilities and context match
    let confidence = 0.5; // Base confidence

    if (context.activeDocument) {
      const language = context.activeDocument.languageId;
      
      // Boost confidence for language-specific capabilities
      if (instance.capabilities.includes(`${language}_expert`)) {
        confidence += 0.3;
      }
    }

    // Boost confidence for current task alignment
    if (context.currentTask && instance.context.currentTask) {
      if (context.currentTask.includes(instance.context.currentTask)) {
        confidence += 0.2;
      }
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Setup VS Code event listeners
   */
  private setupVSCodeListeners(): void {
    // Listen for document changes
    vscode.workspace.onDidChangeTextDocument((event) => {
      this.updateInstanceContext('copilot-editor-inline', {
        activeDocument: event.document,
        recentActivity: [`document_changed: ${event.document.fileName}`]
      });
    });

    // Listen for cursor position changes
    vscode.window.onDidChangeTextEditorSelection((event) => {
      this.updateInstanceContext('copilot-editor-inline', {
        cursorPosition: event.selections[0].start,
        selection: event.selections[0]
      });
    });

    // Listen for active editor changes
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        this.updateInstanceContext('copilot-editor-inline', {
          activeDocument: editor.document
        });
      }
    });
  }

  /**
   * Update instance context
   */
  private updateInstanceContext(instanceId: string, contextUpdate: Partial<CopilotContext>): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.context = { ...instance.context, ...contextUpdate };
      
      // Share context with other instances if significant
      if (this.isSignificantContextChange(contextUpdate)) {
        this.shareContext(instanceId, instance.context);
      }
    }
  }

  /**
   * Check if context change is significant enough to share
   */
  private isSignificantContextChange(contextUpdate: Partial<CopilotContext>): boolean {
    return !!(
      contextUpdate.activeDocument ||
      contextUpdate.currentTask ||
      contextUpdate.workspaceContext
    );
  }

  /**
   * Start context synchronization
   */
  private startContextSync(): void {
    setInterval(() => {
      this.syncAllInstanceContexts();
    }, 5000); // Sync every 5 seconds
  }

  /**
   * Sync contexts between all instances
   */
  private async syncAllInstanceContexts(): Promise<void> {
    const globalContext: CopilotContext = {
      activeDocument: vscode.window.activeTextEditor?.document,
      cursorPosition: vscode.window.activeTextEditor?.selection.start,
      selection: vscode.window.activeTextEditor?.selection,
      workspaceContext: vscode.workspace.name,
      recentActivity: []
    };

    await this.shareContext('copilot-coordinator', globalContext);
  }

  /**
   * Send coordination message
   */
  private async sendMessage(message: CoordinationMessage): Promise<void> {
    // Use the FileProtocolService for inter-agent communication
    await this.fileProtocolService.sendMessage({
      id: message.id,
      recipient: message.toInstance === 'broadcast' ? undefined : message.toInstance,
      type: AgentMessageType.COPILOT_COORDINATION,
      source: 'copilot-coordinator',
      timestamp: Date.now(),
      payload: message
    });
    
    this.messageCount++;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `coord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if coordination is currently active
   */
  isCoordinationActive(): boolean {
    return this.isInitialized && this.instances.size > 0;
  }

  /**
   * Start coordination between instances
   */
  async startCoordination(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    console.log('[CopilotCoordinator] Coordination started');
    this.emit('coordinationStarted');
  }

  /**
   * Stop coordination between instances
   */
  async stopCoordination(): Promise<void> {
    this.instances.clear();
    this.isInitialized = false;
    
    console.log('[CopilotCoordinator] Coordination stopped');
    this.emit('coordinationStopped');
  }

  /**
   * Synchronize completion across instances
   */
  async syncCompletion(completion: any, context: CopilotContext): Promise<void> {
    const message: CoordinationMessage = {
      id: this.generateMessageId(),
      fromInstance: 'main-coordinator',
      toInstance: 'broadcast',
      type: 'completion_sync',
      payload: { completion, context },
      timestamp: Date.now(),
      priority: 'medium'
    };

    await this.sendMessage(message);
    this.emit('completionSynced', { completion, context });
  }

  /**
   * Get message count for statistics
   */
  private getMessageCount(): number {
    return this.messageCount;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    // Clean up FileProtocolService listeners
    this.fileProtocolService.removeAllListeners();
    this.removeAllListeners();
  }

  /**
   * Setup webview integration for coordination UI
   */
  private setupWebviewIntegration(messageRouter: WebviewMessageRouter): void {
    // Register Copilot coordination commands with the message router
    messageRouter.registerHandler('copilot:getCoordinationStats', async () => {
      return this.getCoordinationStats();
    });

    messageRouter.registerHandler('copilot:shareContext', async (payload) => {
      const { fromInstance, context, targetInstance } = payload;
      await this.shareContext(fromInstance, context, targetInstance);
      return { success: true };
    });

    messageRouter.registerHandler('copilot:coordinateSuggestions', async (payload) => {
      const { requestingInstance, context } = payload;
      return await this.coordinateSuggestions(requestingInstance, context);
    });
  }

  /**
   * Setup file protocol handlers for coordination messaging
   */
  private setupFileProtocolHandlers(): void {
    // Listen for coordination messages using the existing FileProtocolService
    this.fileProtocolService.onMessage(AgentMessageType.COPILOT_COORDINATION, async (data) => {
      try {
        const message: CoordinationMessage = data.payload;
        await this.handleCoordinationMessage(message);
      } catch (error) {
        console.error('[CopilotCoordinator] Error processing coordination message:', error);
      }
    });
  }

  /**
   * Broadcast message to all instances using existing infrastructure
   */
  async broadcastMessage(message: { type: string; payload: any }): Promise<void> {
    const coordMessage: CoordinationMessage = {
      id: this.generateMessageId(),
      fromInstance: 'copilot-coordinator',
      toInstance: 'broadcast',
      type: message.type as any,
      payload: message.payload,
      timestamp: Date.now(),
      priority: 'medium'
    };

    await this.sendMessage(coordMessage);
  }

  /**
   * Event listener for when an instance is registered
   */
  onInstanceRegistered(callback: (instance: CopilotInstance) => void): void {
    this.on('instanceRegistered', callback);
  }

  /**
   * Event listener for when an instance is deregistered
   */
  onInstanceDeregistered(callback: (instanceId: string) => void): void {
    this.on('instanceDeregistered', callback);
  }

  /**
   * Event listener for when a coordination message is received
   */
  onMessageReceived(callback: (message: CoordinationMessage) => void): void {
    this.on('messageReceived', callback);
  }

  /**
   * Event listener for context sharing
   */
  onContextShared(callback: (data: { from: string; to: string; context: CopilotContext }) => void): void {
    this.on('contextShared', callback);
  }

  /**
   * Event listener for completion sync
   */
  onCompletionSync(callback: (data: { from: string; completion: any; context: CopilotContext }) => void): void {
    this.on('completionSynced', callback);
  }

  /**
   * Event listener for task updates
   */
  onTaskUpdate(callback: (taskId: string, update: any) => void): void {
    this.on('taskHandedOff', (data) => {
      callback(data.task.id || 'unknown', data);
    });
  }

  /**
   * Handle completion synchronization
   */
  private async handleCompletionSync(message: CoordinationMessage): Promise<void> {
    // Synchronize completions between instances
    const { completion, context } = message.payload;
    
    this.emit('completionSynced', {
      from: message.fromInstance,
      completion,
      context
    });
  }

  /**
   * Handle task handoff between instances
   */
  private async handleTaskHandoff(message: CoordinationMessage): Promise<void> {
    const { task } = message.payload;
    const targetInstance = this.instances.get(message.toInstance);
    
    if (targetInstance) {
      targetInstance.context.currentTask = task.description;
      targetInstance.status = 'busy';
      
      this.emit('taskHandedOff', {
        from: message.fromInstance,
        to: message.toInstance,
        task
      });
    }
  }
}
