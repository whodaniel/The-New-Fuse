/**
 * Agent Network Panel Component
 *
 * Shows status of connected agents in the TNF Redis network
 * and allows sending messages between agents.
 */

import { RedisAgentInfo, RedisAgentMessage, redisBridge } from '../../federation/index.js';

export class AgentNetworkPanel {
  private container: HTMLElement;
  private agents: RedisAgentInfo[] = [];
  private isConnected: boolean = false;
  private messages: RedisAgentMessage[] = [];
  private onStatusChange?: (connected: boolean) => void;

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container not found: ${containerId}`);
    }
    this.container = element;
    this.setupListeners();
    this.render();
  }

  /**
   * Set up event listeners for the Redis bridge
   */
  private setupListeners(): void {
    // Listen for agent list updates
    redisBridge.onAgentUpdate((agents) => {
      this.agents = agents;
      this.render();
    });

    // Listen for messages
    redisBridge.onMessage('message', (msg) => {
      this.messages.unshift(msg);
      if (this.messages.length > 50) {
        this.messages.pop();
      }
      this.renderMessages();
    });
  }

  /**
   * Connect to the agent network
   */
  async connect(): Promise<boolean> {
    const connected = await redisBridge.connect();
    this.isConnected = connected;

    if (connected) {
      redisBridge.requestAgentList();
    }

    this.render();

    if (this.onStatusChange) {
      this.onStatusChange(connected);
    }

    return connected;
  }

  /**
   * Disconnect from the network
   */
  disconnect(): void {
    redisBridge.disconnect();
    this.isConnected = false;
    this.agents = [];
    this.render();

    if (this.onStatusChange) {
      this.onStatusChange(false);
    }
  }

  /**
   * Send a message to the network
   */
  sendMessage(content: string, to?: string): void {
    redisBridge.sendMessage(content, { to });
  }

  /**
   * Set status change callback
   */
  onConnectionChange(callback: (connected: boolean) => void): void {
    this.onStatusChange = callback;
  }

  /**
   * Render the panel
   */
  private render(): void {
    this.container.innerHTML = `
      <div class="agent-network-panel">
        <div class="panel-header">
          <h3>🤖 Agent Network</h3>
          <span class="status-badge ${this.isConnected ? 'connected' : 'disconnected'}">
            ${this.isConnected ? '● Connected' : '○ Disconnected'}
          </span>
        </div>

        <div class="panel-actions">
          ${
            this.isConnected
              ? `<button id="disconnect-btn" class="btn btn-danger">Disconnect</button>`
              : `<button id="connect-btn" class="btn btn-primary">Connect to Network</button>`
          }
          ${
            this.isConnected
              ? `<button id="refresh-agents-btn" class="btn btn-secondary">Refresh</button>`
              : ''
          }
        </div>

        ${this.isConnected ? this.renderAgentsList() : this.renderDisconnectedState()}

        ${this.isConnected ? this.renderMessageInput() : ''}

        <div id="messages-container" class="messages-container">
          ${this.renderMessagesContent()}
        </div>
      </div>

      <style>
        .agent-network-panel {
          padding: 12px;
          background: var(--panel-bg, #1e1e1e);
          border-radius: 8px;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .panel-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        .status-badge.connected {
          background: rgba(76, 175, 80, 0.2);
          color: #4caf50;
        }

        .status-badge.disconnected {
          background: rgba(244, 67, 54, 0.2);
          color: #f44336;
        }

        .panel-actions {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .btn:hover {
          opacity: 0.9;
        }

        .btn-primary {
          background: #1976d2;
          color: white;
        }

        .btn-secondary {
          background: #424242;
          color: white;
        }

        .btn-danger {
          background: #d32f2f;
          color: white;
        }

        .agents-list {
          margin-bottom: 12px;
        }

        .agent-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          margin-bottom: 4px;
        }

        .agent-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--accent-color, #1976d2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }

        .agent-info {
          flex: 1;
        }

        .agent-name {
          font-weight: 500;
          font-size: 13px;
        }

        .agent-role {
          font-size: 11px;
          color: #888;
        }

        .agent-status {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4caf50;
        }

        .agent-status.busy { background: #ff9800; }
        .agent-status.offline { background: #f44336; }

        .disconnected-state {
          text-align: center;
          padding: 24px;
          color: #888;
        }

        .disconnected-state p {
          margin: 8px 0;
          font-size: 12px;
        }

        .message-input-container {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .message-input-container input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #333;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.05);
          color: inherit;
          font-size: 12px;
        }

        .messages-container {
          max-height: 150px;
          overflow-y: auto;
          border-top: 1px solid #333;
          padding-top: 8px;
        }

        .message-item {
          padding: 6px 8px;
          margin-bottom: 4px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 4px;
          font-size: 11px;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .message-from {
          font-weight: 500;
          color: #1976d2;
        }

        .message-time {
          color: #666;
        }

        .message-content {
          color: #ccc;
          word-break: break-word;
        }

        .no-messages {
          text-align: center;
          color: #666;
          padding: 16px;
          font-size: 12px;
        }
      </style>
    `;

    this.attachEventHandlers();
  }

  /**
   * Render agents list
   */
  private renderAgentsList(): string {
    if (this.agents.length === 0) {
      return `
        <div class="agents-list">
          <p style="color: #888; font-size: 12px; text-align: center;">
            No other agents connected
          </p>
        </div>
      `;
    }

    return `
      <div class="agents-list">
        ${this.agents
          .map(
            (agent) => `
          <div class="agent-item" data-agent="${agent.name}">
            <div class="agent-avatar">
              ${this.getAgentIcon(agent.platform)}
            </div>
            <div class="agent-info">
              <div class="agent-name">${agent.name}</div>
              <div class="agent-role">${agent.role} • ${agent.platform}</div>
            </div>
            <div class="agent-status ${agent.status}"></div>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  /**
   * Render disconnected state
   */
  private renderDisconnectedState(): string {
    return `
      <div class="disconnected-state">
        <p>🔌 Not connected to agent network</p>
        <p>Click "Connect" to join the TNF Redis agent network</p>
      </div>
    `;
  }

  /**
   * Render message input
   */
  private renderMessageInput(): string {
    return `
      <div class="message-input-container">
        <input
          type="text"
          id="message-input"
          placeholder="Send a message to all agents..."
        />
        <button id="send-message-btn" class="btn btn-primary">Send</button>
      </div>
    `;
  }

  /**
   * Render messages content
   */
  private renderMessagesContent(): string {
    if (this.messages.length === 0) {
      return `<p class="no-messages">No messages yet</p>`;
    }

    return this.messages
      .slice(0, 10)
      .map(
        (msg) => `
      <div class="message-item">
        <div class="message-header">
          <span class="message-from">${msg.from.agentName}</span>
          <span class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="message-content">${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}</div>
      </div>
    `
      )
      .join('');
  }

  /**
   * Just render messages section
   */
  private renderMessages(): void {
    const container = document.getElementById('messages-container');
    if (container) {
      container.innerHTML = this.renderMessagesContent();
    }
  }

  /**
   * Attach event handlers
   */
  private attachEventHandlers(): void {
    // Connect button
    const connectBtn = document.getElementById('connect-btn');
    if (connectBtn) {
      connectBtn.addEventListener('click', () => this.connect());
    }

    // Disconnect button
    const disconnectBtn = document.getElementById('disconnect-btn');
    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', () => this.disconnect());
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-agents-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        redisBridge.requestAgentList();
      });
    }

    // Send message
    const sendBtn = document.getElementById('send-message-btn');
    const messageInput = document.getElementById('message-input') as HTMLInputElement;

    if (sendBtn && messageInput) {
      sendBtn.addEventListener('click', () => {
        if (messageInput.value.trim()) {
          this.sendMessage(messageInput.value.trim());
          messageInput.value = '';
        }
      });

      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && messageInput.value.trim()) {
          this.sendMessage(messageInput.value.trim());
          messageInput.value = '';
        }
      });
    }

    // Agent item click (to send direct message)
    const agentItems = this.container.querySelectorAll('.agent-item[data-agent]');
    agentItems.forEach((item) => {
      item.addEventListener('click', () => {
        const agentName = item.getAttribute('data-agent');
        if (agentName && messageInput) {
          messageInput.placeholder = `Message to ${agentName}...`;
          messageInput.dataset.target = agentName;
          messageInput.focus();
        }
      });
    });
  }

  /**
   * Get icon for agent platform
   */
  private getAgentIcon(platform: string): string {
    const icons: Record<string, string> = {
      antigravity: '🌌',
      claude: '🤖',
      gemini: '✨',
      jules: '🔧',
      'chrome-extension': '🌐',
      tauri: '💻',
      vscode: '🔷',
    };
    return icons[platform] || '🤖';
  }
}
