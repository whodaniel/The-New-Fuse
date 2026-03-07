/**
 * The New Fuse VSCode Extension - Relay Server Service
 * Version 9.1.0
 *
 * Relay server connection and monitoring
 */

import * as vscode from 'vscode';
import { log } from '../../utils/logger';

interface ConnectedAgent {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy';
  role: string;
  lastSeen: string;
}

interface RelayConfig {
  endpoint: string;
  autoConnect: boolean;
}

export class RelayServerService {
  private static instance: RelayServerService | null = null;
  private context: vscode.ExtensionContext;
  private agents: Map<string, ConnectedAgent> = new Map();
  private statusBarItem: vscode.StatusBarItem | undefined;
  private connected: boolean = false;
  private statusCheckInterval: NodeJS.Timeout | undefined;

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  static getInstance(context?: vscode.ExtensionContext): RelayServerService {
    if (!RelayServerService.instance && context) {
      RelayServerService.instance = new RelayServerService(context);
    }
    return RelayServerService.instance!;
  }

  static getRelayServerService(): RelayServerService {
    return RelayServerService.getInstance()!;
  }

  async initialize(): Promise<void> {
    log.info('Initializing Relay Server Service');

    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 97);
    this.statusBarItem.text = '$(server) Relay';
    this.statusBarItem.tooltip = 'Relay Server: Disconnected';
    this.statusBarItem.command = 'theNewFuse.relayServer';
    this.statusBarItem.show();
    this.context.subscriptions.push(this.statusBarItem);

    await this.loadAgents();
    log.info('Relay Server Service initialized');
  }

  async connect(endpoint?: string): Promise<boolean> {
    const relayEndpoint = endpoint || 'ws://localhost:3000';

    try {
      log.info(`Connecting to Relay server at ${relayEndpoint}`);

      // Simulate connection
      await new Promise((resolve) => setTimeout(resolve, 500));

      this.connected = true;
      this.updateStatusBar();

      // Add demo agents
      this.agents.set('agent-1', {
        id: 'agent-1',
        name: 'Composer',
        status: 'online',
        role: 'orchestrator',
        lastSeen: new Date().toISOString(),
      });
      this.agents.set('agent-2', {
        id: 'agent-2',
        name: 'Roo Coder',
        status: 'online',
        role: 'coder',
        lastSeen: new Date().toISOString(),
      });

      vscode.window.showInformationMessage('Connected to Relay server');
      return true;
    } catch (error) {
      log.error('Failed to connect to Relay server', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.updateStatusBar();
    log.info('Disconnected from Relay server');
  }

  async showMonitoringPanel(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'relayMonitor',
      'Relay Monitor',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = this.generateMonitoringHtml();
  }

  async showRelayPanel(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'relayServer',
      'Relay Server',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = this.generateRelayHtml();
  }

  getConnectedAgents(): ConnectedAgent[] {
    return Array.from(this.agents.values());
  }

  private generateMonitoringHtml(): string {
    const agentsHtml = Array.from(this.agents.values())
      .map(
        (agent) => `
        <div class="agent-card ${agent.status}">
          <div class="agent-header">
            <span class="agent-name">${agent.name}</span>
            <span class="agent-status ${agent.status}">${agent.status}</span>
          </div>
          <div class="agent-meta">
            <span>Role: ${agent.role}</span>
            <span>Last seen: ${new Date(agent.lastSeen).toLocaleTimeString()}</span>
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
            padding: 16px;
            margin-bottom: 12px;
          }
          .agent-header { display: flex; justify-content: space-between; }
          .agent-status.online { color: #4caf50; }
          .agent-status.offline { color: #f44336; }
          .agent-status.busy { color: #ff9800; }
          .agent-meta { font-size: 12px; color: var(--vscode-disabledForeground); margin-top: 8px; display: flex; gap: 16px; }
        </style>
      </head>
      <body>
        <h1>Relay Monitor</h1>
        <p>Connected: ${this.connected ? '● Yes' : '○ No'}</p>
        <h2>Connected Agents (${this.agents.size})</h2>
        ${agentsHtml}
      </body>
      </html>`;
  }

  private generateRelayHtml(): string {
    return `<!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: var(--vscode-font-family); padding: 20px; }
          h1 { color: var(--vscode-foreground); }
          .feature {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-editor-lineHighlightBorder);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
          }
          .feature-title { font-weight: bold; font-size: 16px; }
          .feature-desc { color: var(--vscode-descriptionForeground); margin-top: 8px; }
        </style>
      </head>
      <body>
        <h1>Relay Server</h1>
        <p>Real-time message routing between agents.</p>

        <div class="feature">
          <div class="feature-title">Real-time Monitoring</div>
          <div class="feature-desc">Live view of intercepted requests and agent communications</div>
        </div>

        <div class="feature">
          <div class="feature-title">Agent Management</div>
          <div class="feature-desc">Connect and manage AI agents through the relay</div>
        </div>

        <div class="feature">
          <div class="feature-title">Intercept Rules</div>
          <div class="feature-desc">Configure which APIs and messages to intercept</div>
        </div>
      </body>
      </html>`;
  }

  private updateStatusBar(): void {
    if (this.statusBarItem) {
      const status = this.connected ? 'Connected' : 'Disconnected';
      this.statusBarItem.tooltip = `Relay Server: ${status}`;
    }
  }

  private async loadAgents(): Promise<void> {
    const cached = this.context.workspaceState.get<ConnectedAgent[]>('relay.agents');
    if (cached) {
      for (const agent of cached) {
        this.agents.set(agent.id, agent);
      }
    }
  }

  dispose(): void {
    this.statusBarItem?.dispose();
  }
}

export function getRelayServerService(): RelayServerService {
  return RelayServerService.getRelayServerService();
}
