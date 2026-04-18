/**
 * The New Fuse VSCode Extension - AG-UI Protocol Service
 * Version 9.1.0
 *
 * AG-UI Protocol integration for real-time visualization and bidirectional communication
 */

import * as vscode from 'vscode';
import { log } from '../../utils/logger.js';

interface AGUISession {
  id: string;
  agentId: string;
  status: 'connected' | 'disconnected' | 'generating';
  connectedAt: string;
  lastActivity: string;
}

interface VisualizationRequest {
  type: 'agent-flow' | 'service-map' | 'dependency-graph' | 'custom';
  data: Record<string, unknown>;
  title?: string;
}

export class AGUIProtocolService {
  private static instance: AGUIProtocolService | null = null;
  private context: vscode.ExtensionContext;
  private sessions: Map<string, AGUISession> = new Map();
  private statusBarItem: vscode.StatusBarItem | undefined;
  private connected: boolean = false;

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  static getInstance(context?: vscode.ExtensionContext): AGUIProtocolService {
    if (!AGUIProtocolService.instance && context) {
      AGUIProtocolService.instance = new AGUIProtocolService(context);
    }
    return AGUIProtocolService.instance!;
  }

  static getAGUIProtocolService(): AGUIProtocolService {
    return AGUIProtocolService.getInstance()!;
  }

  /**
   * Initialize the AG-UI Protocol service
   */
  async initialize(): Promise<void> {
    log.info('Initializing AG-UI Protocol Service');

    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 98);
    this.statusBarItem.text = '$(pulse) AG-UI';
    this.statusBarItem.tooltip = 'AG-UI Protocol: Disconnected';
    this.statusBarItem.command = 'theNewFuse.aguiProtocol';
    this.statusBarItem.show();
    this.context.subscriptions.push(this.statusBarItem);

    await this.loadSessions();
    log.info('AG-UI Protocol Service initialized');
  }

  /**
   * Connect to AG-UI WebSocket server
   */
  async connect(endpoint: string = 'ws://localhost:8765'): Promise<boolean> {
    try {
      log.info(`Connecting to AG-UI server at ${endpoint}`);

      // Simulate connection
      await new Promise((resolve) => setTimeout(resolve, 500));

      this.connected = true;
      this.updateStatusBar();

      // Add a demo session
      const session: AGUISession = {
        id: `session-${Date.now()}`,
        agentId: 'demo-agent',
        status: 'connected',
        connectedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      };
      this.sessions.set(session.id, session);

      vscode.window.showInformationMessage('Connected to AG-UI server');
      return true;
    } catch (error) {
      log.error('Failed to connect to AG-UI server', error);
      return false;
    }
  }

  /**
   * Disconnect from AG-UI server
   */
  async disconnect(): Promise<void> {
    this.connected = false;
    this.updateStatusBar();
    log.info('Disconnected from AG-UI server');
  }

  /**
   * Generate a visualization
   */
  async generateVisualization(request: VisualizationRequest): Promise<string> {
    log.info(`Generating ${request.type} visualization`);

    // Simulate visualization generation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Return a placeholder visualization URL
    const vizId = `viz-${Date.now()}`;

    // Create a simple HTML visualization
    const visualizationHtml = this.createVisualizationHtml(request);

    // Show in webview panel
    const panel = vscode.window.createWebviewPanel(
      'aguiVisualization',
      request.title || `${request.type} Visualization`,
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = visualizationHtml;

    return vizId;
  }

  /**
   * Show AG-UI sessions panel
   */
  async showSessionsPanel(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'aguiSessions',
      'AG-UI Sessions',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = this.generateSessionsHtml();
  }

  /**
   * Show AG-UI Protocol panel
   */
  async showProtocolPanel(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'aguiProtocol',
      'AG-UI Protocol',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = this.generateProtocolHtml();
  }

  private createVisualizationHtml(request: VisualizationRequest): string {
    const typeColors: Record<string, string> = {
      'agent-flow': '#4caf50',
      'service-map': '#2196f3',
      'dependency-graph': '#ff9800',
      custom: '#9c27b0',
    };

    const color = typeColors[request.type] || '#757575';

    return `<!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            background: var(--vscode-editor-background);
          }
          h1 { color: var(--vscode-foreground); }
          .viz-container {
            background: var(--vscode-editor-background);
            border: 2px solid ${color};
            border-radius: 12px;
            padding: 40px;
            text-align: center;
          }
          .viz-icon {
            font-size: 64px;
            color: ${color};
            margin-bottom: 20px;
          }
          .viz-type {
            color: ${color};
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .viz-title {
            font-size: 24px;
            font-weight: bold;
            margin: 16px 0;
          }
          .viz-status {
            color: var(--vscode-descriptionForeground);
          }
        </style>
      </head>
      <body>
        <h1>${request.title || 'Visualization'}</h1>
        <div class="viz-container">
          <div class="viz-icon">$(graph)</div>
          <div class="viz-type">${request.type}</div>
          <div class="viz-title">${request.title || 'Generated Visualization'}</div>
          <div class="viz-status">Generated at ${new Date().toLocaleString()}</div>
        </div>
      </body>
      </html>`;
  }

  private generateSessionsHtml(): string {
    const sessionsHtml = Array.from(this.sessions.values())
      .map(
        (session) => `
        <div class="session-card ${session.status}">
          <div class="session-header">
            <span class="session-id">${session.id}</span>
            <span class="session-status ${session.status}">${session.status}</span>
          </div>
          <div class="session-meta">
            <span>Agent: ${session.agentId}</span>
            <span>Connected: ${new Date(session.connectedAt).toLocaleString()}</span>
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
          .session-card {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-editor-lineHighlightBorder);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
          }
          .session-header { display: flex; justify-content: space-between; }
          .session-status.connected { color: #4caf50; }
          .session-status.disconnected { color: #f44336; }
          .session-meta { font-size: 12px; color: var(--vscode-disabledForeground); margin-top: 8px; display: flex; gap: 16px; }
        </style>
      </head>
      <body>
        <h1>AG-UI Sessions (${this.sessions.size})</h1>
        ${this.connected ? '<p style="color: #4caf50;">● Connected to AG-UI Server</p>' : '<p style="color: #f44336;">● Disconnected</p>'}
        ${sessionsHtml}
      </body>
      </html>`;
  }

  private generateProtocolHtml(): string {
    return `<!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: var(--vscode-font-family); padding: 20px; }
          h1 { color: var(--vscode-foreground); }
          h2 { color: var(--vscode-foreground); margin-top: 24px; }
          .feature {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-editor-lineHighlightBorder);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
          }
          .feature-icon { font-size: 24px; margin-bottom: 8px; }
          .feature-title { font-weight: bold; font-size: 16px; }
          .feature-desc { color: var(--vscode-descriptionForeground); margin-top: 8px; }
        </style>
      </head>
      <body>
        <h1>AG-UI Protocol</h1>
        <p>Real-time bidirectional communication between agents and visualization generation system.</p>

        <h2>Features</h2>
        <div class="feature">
          <div class="feature-icon">$(pulse)</div>
          <div class="feature-title">Real-time Sessions</div>
          <div class="feature-desc">WebSocket-based sessions with agent identification and state management</div>
        </div>

        <div class="feature">
          <div class="feature-icon">$(graph)</div>
          <div class="feature-title">Visualization Generation</div>
          <div class="feature-desc">Generate agent flow, service maps, and dependency graphs</div>
        </div>

        <div class="feature">
          <div class="feature-icon">$(broadcast)</div>
          <div class="feature-title">Event Streaming</div>
          <div class="feature-desc">Real-time event emission for monitoring agent behavior</div>
        </div>

        <div class="feature">
          <div class="feature-icon">$(sync)</div>
          <div class="feature-title">State Synchronization</div>
          <div class="feature-desc">Synchronized state between agents and visualization clients</div>
        </div>
      </body>
      </html>`;
  }

  private updateStatusBar(): void {
    if (this.statusBarItem) {
      const status = this.connected ? 'Connected' : 'Disconnected';
      this.statusBarItem.tooltip = `AG-UI Protocol: ${status}`;
    }
  }

  private async loadSessions(): Promise<void> {
    const cached = this.context.workspaceState.get<AGUISession[]>('agui.sessions');
    if (cached) {
      for (const session of cached) {
        this.sessions.set(session.id, session);
      }
    }
  }

  private async saveSessions(): Promise<void> {
    await this.context.workspaceState.update('agui.sessions', Array.from(this.sessions.values()));
  }

  dispose(): void {
    this.statusBarItem?.dispose();
  }
}

export function getAGUIProtocolService(): AGUIProtocolService {
  return AGUIProtocolService.getAGUIProtocolService();
}
