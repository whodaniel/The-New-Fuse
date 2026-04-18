/**
 * TNF Relay Connection Service for VS Code Extension
 *
 * Connects VS Code to the TNF Relay Server for unified communication
 * with Chrome Extension, Tauri App, and other TNF components.
 */

import * as vscode from 'vscode';
import { log } from '../utils/logger.js';

// ============================================================================
// TYPES
// ============================================================================

export interface RelayMessage {
  id: string;
  type: string;
  source: MessageSource;
  target?: MessageTarget;
  payload: any;
  timestamp: string;
  correlationId?: string;
}

export interface MessageSource {
  type: 'vscode' | 'chrome_extension' | 'tauri' | 'relay' | 'mcp_server';
  instanceId: string;
  metadata?: Record<string, any>;
}

export interface MessageTarget {
  type?: 'vscode' | 'chrome_extension' | 'tauri' | 'mcp_server' | 'all';
  instanceId?: string;
  channelId?: string;
}

export interface RelayConnectionConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// ============================================================================
// RELAY CONNECTION SERVICE
// ============================================================================

export class RelayConnectionService {
  private static instance: RelayConnectionService;

  private ws: WebSocket | null = null;
  private config: RelayConnectionConfig;
  private status: ConnectionStatus = 'disconnected';
  private instanceId: string;
  private reconnectAttempts: number = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, Set<(message: RelayMessage) => void>> = new Map();
  private pendingRequests: Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (reason: any) => void;
      timeout: NodeJS.Timeout;
    }
  > = new Map();

  private statusBarItem: vscode.StatusBarItem;

  private constructor() {
    this.instanceId = `vscode_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.config = {
      url: 'ws://localhost:3000',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
    };

    // Create status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarItem.command = 'theNewFuse.relayStatus';
    this.updateStatusBar();
    this.statusBarItem.show();
  }

  public static getInstance(): RelayConnectionService {
    if (!RelayConnectionService.instance) {
      RelayConnectionService.instance = new RelayConnectionService();
    }
    return RelayConnectionService.instance;
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  /**
   * Connect to the TNF Relay
   */
  public async connect(url?: string): Promise<boolean> {
    if (url) {
      this.config.url = url;
    }

    if (this.status === 'connected') {
      log.info('Already connected to relay');
      return true;
    }

    this.status = 'connecting';
    this.updateStatusBar();

    return new Promise((resolve) => {
      try {
        log.info(`Connecting to TNF Relay at ${this.config.url}...`);

        // Use dynamic import for WebSocket in Node.js environment
        this.createWebSocket()
          .then((ws) => {
            this.ws = ws;

            this.ws.onopen = () => {
              log.info('Connected to TNF Relay');
              this.status = 'connected';
              this.reconnectAttempts = 0;
              this.updateStatusBar();

              // Register with relay
              this.register();

              // Start heartbeat
              this.startHeartbeat();

              resolve(true);
            };

            this.ws.onmessage = (event: MessageEvent) => {
              this.handleMessage(JSON.parse(event.data));
            };

            this.ws.onclose = () => {
              log.info('Disconnected from TNF Relay');
              this.status = 'disconnected';
              this.updateStatusBar();
              this.stopHeartbeat();
              this.attemptReconnect();
            };

            this.ws.onerror = (error: Event) => {
              log.error('Relay connection error:', error);
              this.status = 'error';
              this.updateStatusBar();
              resolve(false);
            };
          })
          .catch((error) => {
            log.error('Failed to create WebSocket:', error);
            this.status = 'error';
            this.updateStatusBar();
            resolve(false);
          });
      } catch (error) {
        log.error('Failed to connect to relay:', error);
        this.status = 'error';
        this.updateStatusBar();
        resolve(false);
      }
    });
  }

  /**
   * Create WebSocket connection (handles both browser and Node.js environments)
   */
  private async createWebSocket(): Promise<WebSocket> {
    // In VS Code extension context, we need to use a Node.js WebSocket
    try {
      // Try to use the ws package if available
      const WebSocketModule = await import('ws');
      return new (WebSocketModule.default as any)(this.config.url) as unknown as WebSocket;
    } catch {
      // Fall back to global WebSocket if available
      if (typeof WebSocket !== 'undefined') {
        return new WebSocket(this.config.url);
      }
      throw new Error('No WebSocket implementation available');
    }
  }

  /**
   * Disconnect from the relay
   */
  public disconnect(): void {
    this.stopHeartbeat();
    this.stopReconnect();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.status = 'disconnected';
    this.updateStatusBar();
    log.info('Disconnected from TNF Relay');
  }

  /**
   * Register this VS Code instance with the relay
   */
  private register(): void {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    this.send({
      type: 'REGISTER',
      payload: {
        clientType: 'vscode_extension',
        instanceId: this.instanceId,
        version: '9.0.0',
        capabilities: ['chat', 'code_assistance', 'mcp_integration', 'federation', 'terminal'],
        metadata: {
          workspaceName: workspaceFolders?.[0]?.name,
          workspaceUri: workspaceFolders?.[0]?.uri.toString(),
          vscodeVersion: vscode.version,
        },
      },
    });
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      log.warn('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    log.info(
      `Attempting reconnection (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})...`
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.config.reconnectInterval);
  }

  /**
   * Stop reconnection attempts
   */
  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // ============================================================================
  // HEARTBEAT
  // ============================================================================

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send({
        type: 'HEARTBEAT',
        payload: {
          status: 'active',
          timestamp: new Date().toISOString(),
        },
      });
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // ============================================================================
  // MESSAGING
  // ============================================================================

  /**
   * Send a message through the relay
   */
  public send(message: Partial<RelayMessage>): void {
    if (!this.ws || this.status !== 'connected') {
      log.warn('Cannot send message - not connected to relay');
      return;
    }

    const fullMessage: RelayMessage = {
      id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: message.type || 'UNKNOWN',
      source: {
        type: 'vscode',
        instanceId: this.instanceId,
      },
      target: message.target,
      payload: message.payload,
      timestamp: new Date().toISOString(),
      correlationId: message.correlationId,
    };

    this.ws.send(JSON.stringify(fullMessage));
  }

  /**
   * Send a request and wait for response
   */
  public async request<T>(type: string, payload: any, timeout: number = 30000): Promise<T> {
    return new Promise((resolve, reject) => {
      const correlationId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(correlationId);
        reject(new Error(`Request ${type} timed out`));
      }, timeout);

      this.pendingRequests.set(correlationId, {
        resolve,
        reject,
        timeout: timeoutHandle,
      });

      this.send({
        type,
        payload,
        correlationId,
      });
    });
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: RelayMessage): void {
    log.debug(`Received relay message: ${message.type}`);

    // Handle response to pending request
    if (message.correlationId && this.pendingRequests.has(message.correlationId)) {
      const pending = this.pendingRequests.get(message.correlationId)!;
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(message.correlationId);

      if (message.type.includes('ERROR')) {
        pending.reject(new Error(message.payload?.error || 'Unknown error'));
      } else {
        pending.resolve(message.payload);
      }
      return;
    }

    // Notify registered handlers
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          log.error(`Error in message handler for ${message.type}:`, error);
        }
      });
    }

    // Also notify 'all' handlers
    const allHandlers = this.messageHandlers.get('*');
    if (allHandlers) {
      allHandlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          log.error('Error in catch-all message handler:', error);
        }
      });
    }
  }

  /**
   * Register a message handler
   */
  public on(type: string, handler: (message: RelayMessage) => void): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);
  }

  /**
   * Remove a message handler
   */
  public off(type: string, handler: (message: RelayMessage) => void): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  // ============================================================================
  // FEDERATION INTEGRATION
  // ============================================================================

  /**
   * Join a federation channel
   */
  public async joinChannel(channelId: string): Promise<void> {
    this.send({
      type: 'FEDERATION_MEMBER_JOIN',
      payload: {
        channelId,
        member: {
          id: this.instanceId,
          type: 'vscode',
          name: 'VS Code',
          capabilities: ['chat', 'code_assistance', 'mcp_integration'],
        },
      },
    });
  }

  /**
   * Leave a federation channel
   */
  public async leaveChannel(channelId: string): Promise<void> {
    this.send({
      type: 'FEDERATION_MEMBER_LEAVE',
      payload: {
        channelId,
        memberId: this.instanceId,
      },
    });
  }

  /**
   * Send message to a federation channel
   */
  public async sendToChannel(
    channelId: string,
    content: string,
    options?: {
      role?: 'user' | 'assistant' | 'system';
      requestResponse?: boolean;
    }
  ): Promise<void> {
    this.send({
      type: 'FEDERATION_CHANNEL_MESSAGE',
      payload: {
        channelId,
        content,
        role: options?.role || 'user',
        requestResponse: options?.requestResponse,
      },
    });
  }

  // ============================================================================
  // CHROME EXTENSION INTEGRATION
  // ============================================================================

  /**
   * Send browser control command
   */
  public async sendBrowserCommand(command: string, params: any): Promise<any> {
    return this.request(command, {
      ...params,
      target: { type: 'chrome_extension' },
    });
  }

  /**
   * Navigate browser to URL
   */
  public async navigateBrowser(url: string): Promise<void> {
    this.send({
      type: 'NAVIGATE',
      target: { type: 'chrome_extension' },
      payload: { url, waitForLoad: true },
    });
  }

  /**
   * Take browser screenshot
   */
  public async takeBrowserScreenshot(): Promise<string> {
    return this.request<string>('TAKE_SCREENSHOT', {
      target: { type: 'chrome_extension' },
    });
  }

  // ============================================================================
  // TAURI APP INTEGRATION
  // ============================================================================

  /**
   * Send message to Tauri app
   */
  public async sendToTauri(type: string, payload: any): Promise<any> {
    return this.request(type, {
      ...payload,
      target: { type: 'tauri' },
    });
  }

  // ============================================================================
  // STATUS
  // ============================================================================

  /**
   * Get connection status
   */
  public getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Get instance ID
   */
  public getInstanceId(): string {
    return this.instanceId;
  }

  /**
   * Update status bar
   */
  private updateStatusBar(): void {
    const icons: Record<ConnectionStatus, string> = {
      connected: '$(plug)',
      connecting: '$(sync~spin)',
      disconnected: '$(debug-disconnect)',
      error: '$(warning)',
    };

    const colors: Record<ConnectionStatus, string | undefined> = {
      connected: undefined,
      connecting: undefined,
      disconnected: 'statusBarItem.warningBackground',
      error: 'statusBarItem.errorBackground',
    };

    this.statusBarItem.text = `${icons[this.status]} TNF Relay`;
    this.statusBarItem.tooltip = `TNF Relay: ${this.status}`;
    this.statusBarItem.backgroundColor = colors[this.status]
      ? new vscode.ThemeColor(colors[this.status]!)
      : undefined;
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.disconnect();
    this.statusBarItem.dispose();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export function getRelayService(): RelayConnectionService {
  return RelayConnectionService.getInstance();
}

/**
 * Register relay commands
 */
export function registerRelayCommands(context: vscode.ExtensionContext): void {
  const relayService = getRelayService();

  // Connect command
  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.relayConnect', async () => {
      const url = await vscode.window.showInputBox({
        prompt: 'Enter TNF Relay URL',
        value: 'ws://localhost:3000',
        placeHolder: 'ws://localhost:3000',
      });

      if (url) {
        const connected = await relayService.connect(url);
        if (connected) {
          vscode.window.showInformationMessage('Connected to TNF Relay');
        } else {
          vscode.window.showErrorMessage('Failed to connect to TNF Relay');
        }
      }
    })
  );

  // Status command
  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.relayStatus', () => {
      const status = relayService.getStatus();
      vscode.window.showInformationMessage(`TNF Relay: ${status}`);
    })
  );

  // Disconnect command
  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.relayDisconnect', () => {
      relayService.disconnect();
      vscode.window.showInformationMessage('Disconnected from TNF Relay');
    })
  );

  // Auto-connect on startup
  const config = vscode.workspace.getConfiguration('theNewFuse');
  if (config.get('autoConnect', true)) {
    relayService.connect().catch((error) => {
      log.warn('Auto-connect to relay failed:', error);
    });
  }

  // Cleanup on deactivation
  context.subscriptions.push({
    dispose: () => relayService.dispose(),
  });
}
