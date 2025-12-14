import * as vscode from 'vscode';

/**
 * Interface for Agent Registration
 */
interface AgentRegistration {
  id: string;
  name: string;
  type: 'vscode-extension' | 'service' | 'cli';
  capabilities: string[];
  version: string;
  status: 'active' | 'idle' | 'offline';
}

/**
 * Interface for Heartbeat Response
 */
interface HeartbeatResponse {
  success: boolean;
  commands?: any[];
}

/**
 * Backend Connector
 * Handles communication with the main TNF Orchestrator API
 */
export class BackendConnector {
  private _apiUrl: string;
  private _agentId: string;
  private _heartbeatInterval: NodeJS.Timer | null = null;
  private _isConnected: boolean = false;
  private _pollingIntervalMs: number = 30000; // 30 seconds

  constructor(private _context: vscode.ExtensionContext) {
    // Default to local API, but allow configuration
    const config = vscode.workspace.getConfiguration('theNewFuse');
    this._apiUrl = config.get('orchestrator.url') || 'http://localhost:3001/api/orchestration';

    // Generate or retrieve persistent agent ID
    this._agentId = this._getOrCreateAgentId();
  }

  private _getOrCreateAgentId(): string {
    const storedId = this._context.globalState.get<string>('tnf.agentId');
    if (storedId) {
      return storedId;
    }

    // Generate new ID if not exists
    const newId = `vscode-ext-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this._context.globalState.update('tnf.agentId', newId);
    return newId;
  }

  public async initialize(): Promise<void> {
    console.log(`🔌 Backend Connector initializing for Agent ID: ${this._agentId}`);
    await this.register();
    this.startHeartbeat();
  }

  public async register(): Promise<void> {
    try {
      const registration: AgentRegistration = {
        id: this._agentId,
        name: 'VS Code Extension Host',
        type: 'vscode-extension',
        version: '8.0.0', // Retrieve from package.json in real implementation
        status: 'active',
        capabilities: ['code-editing', 'file-system', 'terminal', 'ui-interaction'],
      };

      const response = await fetch(`${this._apiUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registration),
      });

      if (response.ok) {
        this._isConnected = true;
        console.log('✅ Registered with Orchestrator API');

        // Show silent notification
        vscode.window.setStatusBarMessage('$(check) Connected to TNF Orchestrator', 5000);
      } else {
        console.warn(`⚠️ Failed to register: ${response.status} ${response.statusText}`);
        this._isConnected = false;
      }
    } catch (error) {
      console.error('❌ Error registering with Orchestrator:', error);
      this._isConnected = false;
    }
  }

  public startHeartbeat(): void {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
    }

    // Send initial heartbeat immediately
    this.sendHeartbeat();

    this._heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this._pollingIntervalMs);
  }

  public stopHeartbeat(): void {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
    }
  }

  private async sendHeartbeat(): Promise<void> {
    try {
      const response = await fetch(`${this._apiUrl}/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: this._agentId,
          status: 'active',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as HeartbeatResponse;
        this._handleHeartbeatResponse(data);
        this._isConnected = true;
      } else {
        // If 404, maybe we need to re-register
        if (response.status === 404) {
          console.log('Heartbeat 404, attempting re-registration...');
          await this.register();
        } else {
          console.warn(`Heartbeat failed: ${response.status}`);
          this._isConnected = false;
        }
      }
    } catch (error) {
      // SIlent failure for heartbeat is usually fine, connection might be down
      // console.debug('Heartbeat error:', error);
      this._isConnected = false;
    }
  }

  private _handleHeartbeatResponse(data: HeartbeatResponse): void {
    if (data.commands && data.commands.length > 0) {
      console.log(`📥 Received ${data.commands.length} commands from Orchestrator`);
      // Process commands here (e.g., execute code, show message, etc.)
      // This is where remote control logic would go
    }
  }

  public getStatus(): { connected: boolean; agentId: string } {
    return {
      connected: this._isConnected,
      agentId: this._agentId,
    };
  }

  public dispose(): void {
    this.stopHeartbeat();
  }
}
