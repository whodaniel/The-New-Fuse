# The New Fuse VS Code Extension

## Table of Contents
1. [Core Files](#core-files)
2. [Types and Interfaces](#types-and-interfaces)
3. [UI Components](#ui-components)
4. [Utils and Helpers](#utils-and-helpers)
5. [Documentation](#documentation)
6. [Build and Setup Scripts](#build-and-setup-scripts)

## Core Files

### extension.ts
Core activation and deactivation logic for the VS Code extension.

```typescript
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('The New Fuse extension is active!');
  
  // Register commands for AI collaboration
  const aiCollabCommand = vscode.commands.registerCommand('thefuse.startAICollab', () => {
    vscode.window.showInformationMessage('AI Collaboration initiated!');
  });
  
  // Status bar items
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  statusBarItem.text = "$(rocket) The New Fuse";
  statusBarItem.tooltip = "The New Fuse AI Tools";
  statusBarItem.command = 'thefuse.startAICollab';
  statusBarItem.show();
  
  // Register all disposables
  context.subscriptions.push(aiCollabCommand, statusBarItem);
}

function deactivate() {}

module.exports = { activate, deactivate };
```

### agent-adapter.tsx
Core adapter for managing communication between the extension and various AI agents.

```typescript
/**
 * Agent Adapter Module
 * 
 * This module provides adapters for integrating with specific VS Code AI extensions,
 * allowing them to participate in The New Fuse's inter-extension communication system.
 */

import * as vscode from 'vscode';
import { AgentClient, AgentMessage } from './agent-communication';

// Interface for extension-specific adapters
export interface ExtensionAdapter {
  id: string;
  name: string;
  extensionId: string;
  capabilities: string[];
  isActive: boolean;
  sendMessage: (action: string, payload: any) => Promise<any>;
}

/**
 * Adapter for GitHub Copilot
 */
export class CopilotAdapter implements ExtensionAdapter {
  id = 'github.copilot';
  name = 'GitHub Copilot';
  extensionId = 'GitHub.copilot';
  capabilities = ['code-generation', 'code-completion'];
  isActive: boolean;

  async sendMessage(action: string, payload: any): Promise<any> {
    // Implementation
  }
}

/**
 * Adapter for Claude extension
 */
export class ClaudeAdapter implements ExtensionAdapter {
  id = 'anthropic.claude';
  name = 'Claude';
  extensionId = 'anthropic.claude';
  capabilities = ['text-generation', 'code-explanation'];
  isActive: boolean;

  async sendMessage(action: string, payload: any): Promise<any> {
    // Implementation
  }
}

/**
 * AgentAdapterManager manages all the extension adapters
 */
export class AgentAdapterManager {
  private adapters: Map<string, ExtensionAdapter>;
  private outputChannel: vscode.OutputChannel;
  
  constructor(
    context: vscode.ExtensionContext,
    agentClient: AgentClient,
    outputChannel: vscode.OutputChannel
  ) {
    this.adapters = new Map();
    this.outputChannel = outputChannel;
  }

  async initialize(): Promise<void> {
    await this.detectExtensions();
  }

  getAvailableAdapters(): ExtensionAdapter[] {
    return Array.from(this.adapters.values());
  }

  private async detectExtensions(): Promise<void> {
    const knownExtensions = [
      {
        extensionId: 'GitHub.copilot',
        adapterId: 'github.copilot',
        name: 'GitHub Copilot',
        capabilities: ['code-generation', 'code-completion']
      },
      {
        extensionId: 'anthropic.claude',
        adapterId: 'anthropic.claude',
        name: 'Claude',
        capabilities: ['text-generation', 'code-explanation']
      }
    ];

    let detectedCount = 0;
    
    for (const extConfig of knownExtensions) {
      const extension = vscode.extensions.getExtension(extConfig.extensionId);
      
      if (extension) {
        if (!this.adapters.has(extConfig.adapterId)) {
          const adapter: ExtensionAdapter = {
            id: extConfig.adapterId,
            name: extConfig.name,
            extensionId: extConfig.extensionId,
            capabilities: extConfig.capabilities,
            isActive: extension.isActive,
            sendMessage: async (action: string, payload: any): Promise<any> => {
              if (extension.isActive && extension.exports?.receiveMessage) {
                return extension.exports.receiveMessage(action, payload);
              }
              try {
                return await vscode.commands.executeCommand(
                  `${extConfig.adapterId}.receiveMessage`, 
                  action, 
                  payload
                );
              } catch (error) {
                this.log(`Error sending message to ${extConfig.name}: ${error.message}`);
                return null;
              }
            }
          };
          
          this.adapters.set(extConfig.adapterId, adapter);
          detectedCount++;
          this.log(`Detected AI extension: ${extConfig.name}`);
        }
      }
    }
    
    if (detectedCount > 0) {
      this.log(`Detected ${detectedCount} AI extensions`);
    }
  }

  private log(message: string): void {
    this.outputChannel.appendLine(message);
  }

  dispose(): void {
    this.adapters.clear();
  }
}

/**
 * Factory function to create an agent adapter manager
 */
export function createAgentAdapterManager(
  context: vscode.ExtensionContext,
  agentClient: AgentClient,
  outputChannel: vscode.OutputChannel
): AgentAdapterManager {
  return new AgentAdapterManager(context, agentClient, outputChannel);
}
```

### workflow-engine.tsx
Manages the execution and coordination of AI agent workflows.

```typescript
import { 
  WorkflowDefinition, 
  WorkflowInstance, 
  WorkflowStep, 
  WorkflowContext, 
  ExecutionResult 
} from '../types';

export class WorkflowEngine {
  private static instance: WorkflowEngine;
  private workflowDefinitions: Map<string, WorkflowDefinition>;
  private workflowInstances: Map<string, WorkflowInstance>;
  private executor: WorkflowExecutor;
  private taskQueue: WorkflowTaskQueue;

  private constructor() {
    this.workflowDefinitions = new Map();
    this.workflowInstances = new Map();
    this.executor = new WorkflowExecutor(new WorkflowMetricsTracker());
    this.taskQueue = WorkflowTaskQueue.getInstance();
  }

  public static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }

  public registerWorkflow(definition: WorkflowDefinition): void {
    this.workflowDefinitions.set(definition.id, definition);
  }

  public getWorkflowDefinition(id: string): WorkflowDefinition | undefined {
    return this.workflowDefinitions.get(id);
  }

  public async startWorkflow(
    workflowId: string,
    initialContext: WorkflowContext = {}
  ): Promise<string> {
    const definition = this.getWorkflowDefinition(workflowId);
    if (!definition) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const instance: WorkflowInstance = {
      id: `instance-${Date.now()}`,
      definitionId: workflowId,
      status: 'running',
      context: initialContext,
      currentStep: 0
    };

    this.workflowInstances.set(instance.id, instance);
    this.executeWorkflow(instance.id);
    return instance.id;
  }

  private async executeWorkflow(instanceId: string): Promise<void> {
    const instance = this.workflowInstances.get(instanceId);
    if (!instance) return;

    const definition = this.getWorkflowDefinition(instance.definitionId);
    if (!definition) return;

    try {
      while (instance.currentStep < definition.steps.length) {
        const step = definition.steps[instance.currentStep];
        const result = await this.executor.executeStep(step, instance.context);
        
        instance.context = { ...instance.context, ...result };
        instance.currentStep++;
        
        this.workflowInstances.set(instanceId, instance);
      }
      
      this.updateInstanceStatus(instanceId, 'completed');
    } catch (error) {
      this.updateInstanceStatus(instanceId, 'failed', error);
    }
  }

  private updateInstanceStatus(
    instanceId: string, 
    status: 'running' | 'completed' | 'failed',
    error?: Error
  ): void {
    const instance = this.workflowInstances.get(instanceId);
    if (instance) {
      instance.status = status;
      if (error) {
        instance.error = error;
      }
      this.workflowInstances.set(instanceId, instance);
    }
  }
}
```

### extensibility-system.tsx
Manages dynamic extension point registration and capability detection.

```typescript
interface ExtensionPoint {
  id: string;
  name: string;
  version: string;
  capabilities: Capability[];
}

interface Capability {
  id: string;
  name: string;
  description: string;
}

interface Requirement {
  id: string;
  capabilities: string[];
}

interface ExtensionContext {
  environment: string;
  constraints: Record<string, unknown>;
}

interface Extension {
  id: string;
  point: ExtensionPoint;
  implementation: unknown;
}

interface UsagePattern {
  frequency: number;
  context: string;
  capabilities: string[];
}

export class ExtensibilitySystem {
  async registerExtensionPoint(
    point: ExtensionPoint,
    capabilities: Capability[]
  ): Promise<void> {
    // Extension point registration
    // Capability mapping
    // Integration validation
  }

  async createDynamicExtension(
    requirement: Requirement,
    context: ExtensionContext
  ): Promise<Extension> {
    // Dynamic extension creation
    // Capability matching
    // Integration testing
    return {
      id: 'dynamic-extension-' + Date.now(),
      point: {
        id: 'dynamic-point',
        name: 'Dynamic Extension Point',
        version: '1.0.0',
        capabilities: []
      },
      implementation: {}
    };
  }

  async evolveExtensionPoint(
    point: ExtensionPoint,
    usage: UsagePattern[]
  ): Promise<ExtensionPoint> {
    // Extension point evolution
    // Interface adaptation
    // Capability expansion
    return {
      ...point,
      version: this.incrementVersion(point.version)
    };
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const last = parseInt(parts[parts.length - 1]) + 1;
    parts[parts.length - 1] = last.toString();
    return parts.join('.');
  }
}
```

### llm-orchestrator-simple.ts
Simplified orchestration of LLM interactions.

```typescript
/**
 * Simplified LLM Orchestrator
 */

import * as vscode from 'vscode';

export class LLMOrchestrator {
  private context: vscode.ExtensionContext;
  private statusBarItem: vscode.StatusBarItem;
  private registeredAgents: any[] = [];
  
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right
    );
    this.setupStatusBar();
  }

  private setupStatusBar(): void {
    this.statusBarItem.text = "$(brain) LLM";
    this.statusBarItem.tooltip = "Active LLM Agents";
    this.statusBarItem.command = 'thefuse.showLLMStatus';
    this.statusBarItem.show();
  }

  public registerAgent(agent: any): void {
    this.registeredAgents.push(agent);
    this.updateStatusBar();
  }

  private updateStatusBar(): void {
    const count = this.registeredAgents.length;
    this.statusBarItem.text = `$(brain) LLM (${count})`;
  }

  public getRegisteredAgents(): any[] {
    return this.registeredAgents;
  }

  public dispose(): void {
    this.statusBarItem.dispose();
    this.registeredAgents = [];
  }
}
```

### extension-scanner.tsx
Scans and detects AI-capable extensions in the VS Code environment.

```typescript
import * as vscode from 'vscode';
import { ExtensionCapability } from './types';

/**
 * Responsible for scanning and detecting AI-capable extensions in the VS Code environment
 */
export class ExtensionScanner {
  private knownAIExtensionIds = [
    'GitHub.copilot',
    'GitHub.copilot-chat',
    'anthropic.claude',
    'codeium.codeium',
    'sourcegraph.cody-ai'
  ];

  public async scanForAIExtensions(): Promise<vscode.Extension<any>[]> {
    const allExtensions = vscode.extensions.all;
    
    return allExtensions.filter(extension => {
      // Check if it's in our known list
      if (this.knownAIExtensionIds.includes(extension.id)) {
        return true;
      }
      
      // Check package.json for AI-related keywords
      const packageJson = extension.packageJSON;
      if (!packageJson) {
        return false;
      }
      
      // Check keywords
      const keywords = packageJson.keywords || [];
      return keywords.some((keyword: string) => 
        ['ai', 'artificial intelligence', 'machine learning', 'copilot', 'code generation', 'llm']
          .includes(keyword.toLowerCase())
      );
    });
  }

  public detectCapabilities(extension: vscode.Extension<any>): ExtensionCapability[] {
    const capabilities: ExtensionCapability[] = [];
    const packageJson = extension.packageJSON;
    
    // Check commands to infer capabilities
    const commands = packageJson.contributes?.commands || [];
    for (const command of commands) {
      if (command.title.toLowerCase().includes('generate')) {
        capabilities.push('code-generation');
      }
      if (command.title.toLowerCase().includes('explain')) {
        capabilities.push('code-explanation');
      }
      if (command.title.toLowerCase().includes('test')) {
        capabilities.push('test-generation');
      }
    }
    
    return [...new Set(capabilities)]; // Remove duplicates
  }

  public registerExtensionWatcher(
    onActivation: (extension: vscode.Extension<any>) => void,
    onDeactivation: (extensionId: string) => void
  ): vscode.Disposable {
    // Watch for extension changes
    return vscode.extensions.onDidChange(() => {
      // Handle extension changes
      const activeExtensions = vscode.extensions.all;
      // Implementation details
    });
  }
}
```

## Types and Interfaces

### agent-communication.d.ts
Type definitions for agent communication.

```typescript
export interface AgentMessage {
  id: string;
  type: string;
  source: string;
  target: string;
  content: any;
  timestamp: number;
}

export interface AgentRegistration {
  id: string;
  name: string;
  capabilities: string[];
  version: string;
  apiVersion: string;
}
```

### ai-collaboration.d.ts
Type definitions for AI collaboration features.

```typescript
export interface AITask {
  id: string;
  type: string;
  description: string;
  assignedTo: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  result?: any;
}

export interface AICollaborationWorkflow {
  id: string;
  name: string;
  description: string;
  tasks: AITask[];
  status: 'idle' | 'running' | 'completed' | 'failed';
}
```

### mcp.d.ts
Model Context Protocol related types.

```typescript
export interface MCPTool {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute(params: any): Promise<any>;
}

export interface MCPServer {
  id: string;
  url: string;
  status: 'connected' | 'disconnected';
  tools: MCPTool[];
}

export interface MCPManager {
  registerTool(tool: MCPTool): void;
  getTool(id: string): MCPTool | undefined;
  listTools(): MCPTool[];
  executeTool(id: string, params: any): Promise<any>;
}
```

### shared.d.ts
Shared type definitions used across the extension.

```typescript
export enum MessageType {
  COMMAND = 'command',
  RESPONSE = 'response',
  ERROR = 'error',
  NOTIFICATION = 'notification'
}

export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

export interface AIMessage {
  type: MessageType;
  content: any;
  timestamp: number;
  metadata?: Record<string, any>;
}
```

### error-handling.d.ts
Error handling related interfaces.

```typescript
export interface ErrorWithMessage {
  message: string;
  stack?: string;
  cause?: Error;
}
```

## UI Components

### ai-coder-view.tsx
Main AI coding interface component.

```typescript
export class AICoderView implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  
  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _llmManager: LLMProviderManager
  ) {}
  
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    this._setWebviewMessageListener(webviewView.webview);
  }
  
  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'web-ui', 'ai-coder.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'web-ui', 'style.css')
    );
    
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>AI Coder</title>
          <link href="${styleUri}" rel="stylesheet">
        </head>
        <body>
          <div id="app">
            <div class="header">
              <h2>AI Coder</h2>
            </div>
            <div class="content">
              <div id="code-suggestions"></div>
              <div class="input-area">
                <textarea id="prompt-input" placeholder="Ask for code suggestions..."></textarea>
                <button id="submit-btn">Generate</button>
              </div>
            </div>
          </div>
          <script src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }
  
  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'generateCode':
          const result = await this._llmManager.generateCode(message.prompt);
          webview.postMessage({ 
            type: 'result', 
            content: result 
          });
          break;
      }
    });
  }
}
```

### communication-panel.tsx
Panel for displaying agent-to-agent communication.

```typescript
export class CommunicationPanel {
  public static readonly viewType = 'thefuse.communicationPanel';
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  public static show(extensionUri: vscode.Uri) {
    const panel = vscode.window.createWebviewPanel(
      CommunicationPanel.viewType,
      'Agent Communication',
      vscode.ViewColumn.Two,
      {
        enableScripts: true
      }
    );

    return new CommunicationPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._panel.webview.html = this._getWebviewContent(
      this._panel.webview,
      extensionUri
    );
    this._setWebviewMessageListener();
    this._panel.onDidDispose(() => this.dispose());
  }

  private _getWebviewContent(
    webview: vscode.Webview,
    extensionUri: vscode.Uri
  ): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'web-ui', 'communication.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'web-ui', 'style.css')
    );

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Agent Communication</title>
          <link href="${styleUri}" rel="stylesheet">
        </head>
        <body>
          <div id="app">
            <div class="communication-log"></div>
            <div class="message-input">
              <input type="text" id="message" placeholder="Send message...">
              <button id="send">Send</button>
            </div>
          </div>
          <script src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }

  public updateCommunication(messages: any[]) {
    this._panel.webview.postMessage({ 
      type: 'update',
      messages 
    });
  }

  private _setWebviewMessageListener() {
    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.type) {
          case 'send':
            // Handle sending messages
            break;
        }
      },
      null,
      this._disposables
    );
  }

  public dispose() {
    this._panel.dispose();
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
```

### model-selector.tsx
Component for selecting and configuring AI models.

```typescript
export class ModelSelector extends BaseWebView {
  private _view?: vscode.WebviewView;
  
  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _modelManager: ModelManager
  ) {
    super();
  }
  
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    this._setWebviewMessageListener(webviewView.webview);
  }
  
  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'web-ui', 'model-selector.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'web-ui', 'style.css')
    );
    
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Model Selector</title>
          <link href="${styleUri}" rel="stylesheet">
        </head>
        <body>
          <div id="app">
            <h2>Available Models</h2>
            <div class="model-list"></div>
            <div class="model-config"></div>
          </div>
          <script src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }
  
  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'selectModel':
          await this._modelManager.setActiveModel(message.modelId);
          break;
        case 'updateConfig':
          await this._modelManager.updateModelConfig(
            message.modelId,
            message.config
          );
          break;
      }
    });
  }
}
```

### settings-view.ts
View for managing extension settings.

```typescript
export class SettingsView extends BaseWebView {
  private _view?: vscode.WebviewView;
  private readonly _settingsManager: SettingsManager;
  
  constructor(
    private readonly _extensionUri: vscode.Uri
  ) {
    super();
    this._settingsManager = new SettingsManager();
  }
  
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    this._setWebviewMessageListener(webviewView.webview);
  }
  
  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'web-ui', 'settings.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'web-ui', 'style.css')
    );
    
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Settings</title>
          <link href="${styleUri}" rel="stylesheet">
        </head>
        <body>
          <div id="app">
            <h2>Extension Settings</h2>
            <div class="settings-container"></div>
          </div>
          <script src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }
  
  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'updateSetting':
          await this._settingsManager.updateSetting(
            message.key,
            message.value
          );
          break;
        case 'resetSettings':
          await this._settingsManager.resetToDefaults();
          break;
      }
    });
  }
}
```

## Utils and Helpers

### utilities.ts
General utility functions.

```typescript
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
```

### code-analyzer.ts
Code analysis utilities.

```typescript
export class CodeAnalyzer {
  private parser: any;
  private cache: Map<string, any>;

  constructor() {
    this.cache = new Map();
  }

  public async initialize(): Promise<void> {
    // Initialize parser
  }

  public analyze(code: string): any {
    // Code analysis implementation
  }

  public getCachedAnalysis(key: string): any {
    return this.cache.get(key);
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

export function getCodeAnalyzer(): CodeAnalyzer {
  return new CodeAnalyzer();
}
```

### performance-utils.ts
Performance optimization utilities.

```typescript
export function debounce(func: Function, wait?: number, immediate?: boolean): Function {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: any[]) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    
    const callNow = immediate && !timeout;
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait || 300);
    if (callNow) {
      func.apply(this, args);
    }
  };
}
```

### webview-message-router.ts
Message routing between webviews.

```typescript
interface WebViewMessage {
  type: string;
  command: string;
  payload?: any;
}

export class WebViewMessageRouter {
  private _messageHandlers: Map<string, Function[]>;
  
  constructor() {
    this._messageHandlers = new Map();
  }
  
  public registerHandler(messageType: string, handler: Function): void {
    if (!this._messageHandlers.has(messageType)) {
      this._messageHandlers.set(messageType, []);
    }
    this._messageHandlers.get(messageType)?.push(handler);
  }
  
  public async routeMessage(message: WebViewMessage): Promise<void> {
    const handlers = this._messageHandlers.get(message.type) || [];
    for (const handler of handlers) {
      await handler(message);
    }
  }
  
  public removeHandler(messageType: string, handler: Function): void {
    const handlers = this._messageHandlers.get(messageType) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
    if (handlers.length === 0) {
      this._messageHandlers.delete(messageType);
    }
  }
  
  public clearHandlers(): void {
    this._messageHandlers.clear();
  }
}
```

## Documentation

### TROUBLESHOOTING.md
```markdown
# Troubleshooting Guide - The New Fuse Extension

## Common Network Errors

1. WebSocket Connection Issues
   - Check port 3711 is available
   - Verify firewall settings
   - Check network connectivity

2. Agent Communication Failures
   - Verify all required agents are installed
   - Check agent registration status
   - Validate message formats

## Extension Activation Issues

1. Missing Dependencies
   - Run `npm install` in extension directory
   - Verify node_modules is present
   - Check package.json dependencies

2. Compilation Errors
   - Run `npm run compile`
   - Check TypeScript configuration
   - Verify source files
```

### TROUBLESHOOTING-COMMANDS.md
```markdown
# Troubleshooting Missing Commands

## 1. Verify Extension Activation

The extension must be properly activated before commands appear:

1. Open VS Code's **Output panel** (View > Output)
2. Select "The New Fuse" from the dropdown menu
3. Check for "Extension activated" message
4. If you don't see this, the extension hasn't loaded correctly

## 2. Force Extension Activation

Run these steps to ensure the extension activates:

1. Close VS Code completely
2. Open terminal and navigate to your extension directory:
   ```bash
   cd path/to/extension
   ```
3. Run the direct launch script:
   ```bash
   ./quick-launch.sh
   ```
   Or manually launch:
   ```bash
   code --extensionDevelopmentPath="$(pwd)"
   ```
```

## Build and Setup Scripts

### launch-extension.js
```javascript
import cp from 'child_process';
import path from 'path';
import fs from 'fs';

// Get the current directory
const extensionPath = __dirname;

// Ensure we have a compiled extension (placeholder for tests)
if (!fs.existsSync(path.join(extensionPath, 'out'))) {
  fs.mkdirSync(path.join(extensionPath, 'out'), { recursive: true });
  
  // Create a minimal extension.js in the out directory
  const minimalExtension = `
    import vscode from 'vscode';
    
    function activate(context) {
      // Command registration moved to main extension.ts
    }
    
    function deactivate() {}
    
    module.exports = { activate, deactivate };
  `;
  
  fs.writeFileSync(path.join(extensionPath, 'out', 'extension.js'), minimalExtension);
}

// Determine VS Code path based on platform
let vscodePath;
if (process.platform === 'darwin') {
  vscodePath = '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code';
  if (!fs.existsSync(vscodePath)) {
    vscodePath = 'code'; // Fallback to PATH
  }
} else if (process.platform === 'win32') {
  vscodePath = 'code.cmd';
} else {
  vscodePath = 'code';
}

// Launch VS Code with the extension
const proc = cp.spawn(vscodePath, [
  '--new-window',
  '--extensionDevelopmentPath=' + extensionPath
], {
  stdio: 'inherit'
});

proc.on('error', (err) => {
  console.error('Failed to start VS Code:', err);
});

proc.on('close', (code) => {
  // Handle close
});
```

### launch-integrated-extension.sh
```bash
#!/bin/bash

# Launch script for the integrated VS Code extension
# This script ensures proper environment setup before launching VS Code

EXTENSION_DIR=$(pwd)
WORKSPACE_DIR="${EXTENSION_DIR}/test-workspace"

# Ensure we're in the extension directory
if [[ ! -f "${EXTENSION_DIR}/package.json" ]]; then
  echo "Error: Not in extension directory. Please run this script from the extension directory."
  exit 1
fi

# Create a test workspace if it doesn't exist
mkdir -p "${WORKSPACE_DIR}"

# Create a test file if the workspace is empty
if [ ! "$(ls -A ${WORKSPACE_DIR})" ]; then
  echo "Creating test files in workspace..."
  cat > "${WORKSPACE_DIR}/test-file.js" << EOF
// This is a test file for The New Fuse Extension integrated features

function testFunction() {
  console.log('Testing The New Fuse Extension');
  console.log('With AI Coder and Roo Integration');
  return true;
}

testFunction();
EOF
fi

# Build the extension first
echo "Building extension..."
./build.sh

if [ $? -ne 0 ]; then
  echo "Build failed. Check the errors above."
  exit 1
fi

echo "Launching VS Code with extension..."
```

### minimal-launch.sh
```bash
#!/bin/bash

echo "===================================================="
echo "  The New Fuse - Minimal Launch Script"
echo "===================================================="
echo ""

# Create necessary directories
mkdir -p out
mkdir -p ai-communication

# Compile TypeScript to JavaScript if needed
if [ -f "extension.ts" ]; then
  echo "TypeScript source found, compiling..."
  if command -v tsc &> /dev/null; then
    tsc -p . || echo "TypeScript compilation failed, using existing out/extension.js"
  else
    echo "TypeScript compiler not found, using existing out/extension.js"
  fi
else
  echo "No TypeScript source found, using existing out/extension.js"
fi

# Launch VS Code with the extension
echo "Launching VS Code with the extension..."
code --extensionDevelopmentPath="$(pwd)"

echo ""
echo "The New Fuse should now be running in VS Code."
echo "Look for the rocket icon ($(rocket)) in the status bar."
echo ""
```

### test-integrated-extension.sh
```bash
#!/bin/bash

echo "====================================================="
echo "  Testing The New Fuse Extension Integrated Features  "
echo "====================================================="

# Step 1: Build the extension
echo "Step 1: Building the extension..."
./build.sh

# Check if build was successful
if [ $? -ne 0 ]; then
  echo "❌ Build failed. Please fix the errors and try again."
  exit 1
fi

echo "✅ Build completed successfully!"

# Step 2: Set up environment for testing
echo "Step 2: Setting up test environment..."
mkdir -p ./test-workspace
cat > ./test-workspace/test-file.js << EOF
// This is a test file for The New Fuse Extension integrated features

function testFunction() {
  console.log('Testing The New Fuse Extension');
  console.log('With AI Coder and Roo Integration');
  return true;
}

testFunction();
EOF

echo "✅ Test workspace created!"

# Step 3: Launch VS Code with the extension
echo "Step 3: Launching VS Code with the extension..."

echo "This will open a new VS Code window with the extension loaded."
echo "You can test the integrated features in this window."

# Launch VS Code with the extension
code --extensionDevelopmentPath="$(pwd)" ./test-workspace

# Print test instructions
echo ""
echo "======= TEST INSTRUCTIONS ======="
echo "1. Check the extension sidebar for the AI Coder view"
echo "2. Try the 'Start Roo AI Code Monitoring' command"
echo "3. Check the status bar for the AI Coder status indicator"
echo "4. Use the 'Show AI Coder Status' command to verify integration"
echo ""
echo "When finished testing, close the VS Code window and press Enter to continue..."

read -p "Press Enter when finished testing..."

# Step 4: Clean up
echo "Step 4: Cleaning up..."
rm -rf ./test-workspace

echo "✅ Test completed!"
echo "====================================================="
```
