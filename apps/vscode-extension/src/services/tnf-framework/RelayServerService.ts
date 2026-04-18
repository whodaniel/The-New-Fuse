/**
 * The New Fuse VSCode Extension - Relay Server Service
 * Version 9.1.0
 *
 * Relay server connection and monitoring
 */

import * as vscode from 'vscode';
import { RedisAgentClient } from '../../../../../packages/tnf-cli/src/RedisAgentClient.js';
import { log } from '../../utils/logger.js';

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
  private redisClient: RedisAgentClient | null = null;
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
      log.info(`Connecting to Relay via RedisAgentClient`);

      if (!this.redisClient) {
        this.redisClient = new RedisAgentClient();
      }

      await this.redisClient.initialize();
      await this.redisClient.register('VSCode-Extension', 'participant', 'vscode', [
        'ide_integration',
        'chat',
      ]);

      this.connected = true;
      this.updateStatusBar();

      // Start periodic agent list refresh
      this.statusCheckInterval = setInterval(() => this.loadAgents(), 10000);
      await this.loadAgents();

      vscode.window.showInformationMessage('Connected to TNF Relay Swarm');
      return true;
    } catch (error) {
      log.error('Failed to connect to TNF Relay', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.cleanup();
      this.redisClient = null;
    }
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
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
    if (!this.redisClient || !this.connected) return;

    try {
      const liveAgents = await this.redisClient.listAgents();

      // Update local map
      const currentIds = new Set(liveAgents.map((a) => a.id));

      // Clear agents no longer online
      for (const id of this.agents.keys()) {
        if (!currentIds.has(id)) this.agents.delete(id);
      }

      // Add or update online agents
      for (const agent of liveAgents) {
        this.agents.set(agent.id, {
          id: agent.id,
          name: agent.name,
          status: agent.isOnline ? 'online' : 'offline',
          role: agent.role,
          lastSeen: agent.lastSeen,
        });
      }
    } catch (error) {
      log.error('Failed to load live agents from Redis', error);
    }
  }

  dispose(): void {
    this.statusBarItem?.dispose();
  }
}

export function getRelayServerService(): RelayServerService {
  return RelayServerService.getRelayServerService();
}
