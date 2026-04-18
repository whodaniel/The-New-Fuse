/**
 * The New Fuse VSCode Extension - A2A Protocol Service
 * Version 9.1.0
 *
 * Agent-to-Agent Protocol integration for multi-agent communication
 */

import * as vscode from 'vscode';
import { ConfigManager } from '../../core/config.js';
import { log } from '../../utils/logger.js';

interface A2AAgent {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy';
  capabilities: string[];
  endpoint?: string;
}

interface A2AMessage {
  id: string;
  from: string;
  to: string;
  type: 'request' | 'response' | 'notification';
  action: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export class A2AProtocolService {
  private static instance: A2AProtocolService | null = null;
  private context: vscode.ExtensionContext;
  private agents: Map<string, A2AAgent> = new Map();
  private messageQueue: A2AMessage[] = [];
  private statusBarItem: vscode.StatusBarItem | undefined;
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  static getInstance(context?: vscode.ExtensionContext): A2AProtocolService {
    if (!A2AProtocolService.instance && context) {
      A2AProtocolService.instance = new A2AProtocolService(context);
    }
    return A2AProtocolService.instance!;
  }

  static getA2AProtocolService(): A2AProtocolService {
    return A2AProtocolService.getInstance()!;
  }

  /**
   * Initialize the A2A Protocol service
   */
  async initialize(): Promise<void> {
    log.info('Initializing A2A Protocol Service');

    // Create status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
    this.statusBarItem.text = '$(broadcast) A2A';
    this.statusBarItem.tooltip = 'A2A Protocol: Disconnected';
    this.statusBarItem.command = 'theNewFuse.a2aProtocol';
    this.statusBarItem.show();
    this.context.subscriptions.push(this.statusBarItem);

    // Load cached agents
    await this.loadAgents();

    log.info('A2A Protocol Service initialized');
  }

  /**
   * Connect to the A2A network
   */
  async connect(endpoint?: string): Promise<boolean> {
    const config = ConfigManager.getInstance();
    const relayEndpoint = endpoint || 'ws://localhost:3000';

    try {
      this.updateConnectionStatus('connecting');
      log.info(`Connecting to A2A network at ${relayEndpoint}`);

      // Simulate connection delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      this.updateConnectionStatus('connected');
      this.updateStatusBar();
      await this.discoverAgents();

      vscode.window.showInformationMessage('Connected to A2A network');
      return true;
    } catch (error) {
      log.error('Failed to connect to A2A network', error);
      this.updateConnectionStatus('disconnected');
      return false;
    }
  }

  /**
   * Disconnect from the A2A network
   */
  async disconnect(): Promise<void> {
    this.updateConnectionStatus('disconnected');
    this.updateStatusBar();
    log.info('Disconnected from A2A network');
  }

  /**
   * Discover available agents on the network
   */
  async discoverAgents(): Promise<A2AAgent[]> {
    log.info('Discovering A2A agents...');

    const discoveredAgents: A2AAgent[] = [
      {
        id: 'composer-agent',
        name: 'Composer Agent',
        status: 'online',
        capabilities: ['code-generation', 'refactoring', 'documentation'],
      },
      {
        id: 'roo-coder-agent',
        name: 'Roo Coder Agent',
        status: 'online',
        capabilities: ['code-completion', 'debugging', 'testing'],
      },
    ];

    for (const agent of discoveredAgents) {
      this.agents.set(agent.id, agent);
    }

    await this.saveAgents();
    log.info(`Discovered ${discoveredAgents.length} agents`);
    return discoveredAgents;
  }

  /**
   * Send a message to another agent
   */
  async sendMessage(message: Partial<A2AMessage>): Promise<A2AMessage> {
    const fullMessage: A2AMessage = {
      id: this.generateId(),
      from: 'vscode-extension',
      to: message.to || '',
      type: message.type || 'request',
      action: message.action || '',
      payload: message.payload || {},
      timestamp: new Date().toISOString(),
    };

    log.info(`Sending A2A message to ${fullMessage.to}: ${fullMessage.action}`);
    this.messageQueue.push(fullMessage);

    return fullMessage;
  }

  /**
   * Register this extension as an agent
   */
  async registerAgent(agentInfo: Partial<A2AAgent>): Promise<A2AAgent> {
    const agent: A2AAgent = {
      id: agentInfo.id || 'vscode-extension',
      name: agentInfo.name || 'VS Code Extension',
      status: 'online',
      capabilities: agentInfo.capabilities || ['chat', 'code-actions', 'file-operations'],
      endpoint: agentInfo.endpoint,
    };

    this.agents.set(agent.id, agent);
    await this.saveAgents();
    log.info(`Registered agent: ${agent.name}`);
    return agent;
  }

  /**
   * Get all known agents
   */
  getAgents(): A2AAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by capability
   */
  getAgentsByCapability(capability: string): A2AAgent[] {
    return Array.from(this.agents.values()).filter((agent) =>
      agent.capabilities.includes(capability)
    );
  }

  /**
   * Show the A2A Protocol Manager webview
   */
  async showProtocolManager(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'a2aProtocolManager',
      'A2A Protocol Manager',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = this.generateWebviewContent();
  }

  private generateWebviewContent(): string {
    const agentsHtml = Array.from(this.agents.values())
      .map(
        (agent) => `
        <div class="agent-card ${agent.status}">
          <div class="agent-header">
            <span class="agent-name">${agent.name}</span>
            <span class="agent-status ${agent.status}">${agent.status}</span>
          </div>
          <div class="agent-capabilities">
            ${agent.capabilities.map((c) => `<span class="capability">${c}</span>`).join('')}
          </div>
        </div>
      `
      )
      .join('');

    return `<!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: var(--vscode-font-family); padding: 20px; }
          h1 { color: var(--vscode-foreground); }
          .agent-card {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-editor-lineHighlightBorder);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 12px;
          }
          .agent-header { display: flex; justify-content: space-between; }
          .agent-status.online { color: #4caf50; }
          .agent-status.offline { color: #9e9e9e; }
          .agent-status.busy { color: #ff9800; }
          .agent-capabilities { margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap; }
          .capability {
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <h1>A2A Protocol Manager</h1>
        <div>Status: ${this.connectionStatus.toUpperCase()}</div>
        <h2>Connected Agents (${this.agents.size})</h2>
        ${agentsHtml}
      </body>
      </html>`;
  }

  private updateConnectionStatus(status: 'connected' | 'disconnected' | 'connecting'): void {
    this.connectionStatus = status;
  }

  private updateStatusBar(): void {
    if (this.statusBarItem) {
      const tooltip = `A2A Protocol: ${this.connectionStatus.charAt(0).toUpperCase() + this.connectionStatus.slice(1)}`;
      this.statusBarItem.tooltip = tooltip;
    }
  }

  private async loadAgents(): Promise<void> {
    const cached = this.context.workspaceState.get<A2AAgent[]>('a2a.agents');
    if (cached) {
      for (const agent of cached) {
        this.agents.set(agent.id, agent);
      }
    }
  }

  private async saveAgents(): Promise<void> {
    await this.context.workspaceState.update('a2a.agents', Array.from(this.agents.values()));
  }

  private generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  dispose(): void {
    this.statusBarItem?.dispose();
  }
}

export function getA2AProtocolService(): A2AProtocolService {
  return A2AProtocolService.getA2AProtocolService();
}
