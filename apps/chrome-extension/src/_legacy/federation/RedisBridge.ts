/**
 * Redis Bridge for TNF Chrome Extension
 *
 * Connects the Chrome Extension to the TNF Redis agent network.
 * This enables the browser to participate in multi-agent workflows.
 *
 * Note: Chrome extensions cannot directly connect to Redis.
 * This bridge uses a WebSocket relay to communicate with Redis.
 */

import { Logger } from '../utils/logger.js';

// ============================================================================
// TYPES
// ============================================================================

export interface RedisAgentMessage {
  id: string;
  type: 'message' | 'command' | 'response' | 'task' | 'acknowledgment' | 'status';
  content: string;
  from: {
    agentName: string;
    role: string;
    platform: string;
  };
  to?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface RedisAgentInfo {
  name: string;
  role: 'orchestrator' | 'broker' | 'worker' | 'participant';
  platform: string;
  capabilities: string[];
  status: 'online' | 'busy' | 'offline';
  lastSeen: string;
}

export interface RedisBridgeConfig {
  relayUrl: string;
  agentName: string;
  agentRole: 'participant' | 'worker';
  capabilities: string[];
  autoReconnect: boolean;
  reconnectInterval: number;
}

// ============================================================================
// REDIS BRIDGE CLASS
// ============================================================================

export class RedisBridge {
  private logger: Logger;
  private ws: WebSocket | null = null;
  private config: RedisBridgeConfig;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private messageHandlers: Map<string, (msg: RedisAgentMessage) => void> = new Map();
  private onAgentListUpdate?: (agents: RedisAgentInfo[]) => void;
  private heartbeatInterval?: number;

  constructor(config: Partial<RedisBridgeConfig> = {}) {
    this.logger = new Logger({
      name: 'RedisBridge',
      level: 'info',
      saveToStorage: true,
    });

    this.config = {
      relayUrl: config.relayUrl || 'ws://localhost:3000/redis-bridge',
      agentName: config.agentName || `chrome-${Date.now().toString(36)}`,
      agentRole: config.agentRole || 'participant',
      capabilities: config.capabilities || [
        'browser_automation',
        'chat_interaction',
        'tab_management',
        'screen_capture',
        'element_selection',
      ],
      autoReconnect: config.autoReconnect ?? true,
      reconnectInterval: config.reconnectInterval || 5000,
    };
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  /**
   * Connect to the Redis bridge relay
   */
  async connect(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        this.logger.info(`Connecting to Redis bridge at ${this.config.relayUrl}`);

        this.ws = new WebSocket(this.config.relayUrl);

        this.ws.onopen = () => {
          this.logger.info('Connected to Redis bridge');
          this.isConnected = true;
          this.reconnectAttempts = 0;

          // Register as an agent
          this.register();

          // Start heartbeat
          this.startHeartbeat();

          resolve(true);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onclose = () => {
          this.logger.warn('Disconnected from Redis bridge');
          this.isConnected = false;
          this.stopHeartbeat();

          if (this.config.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.logger.info(
              `Reconnecting in ${this.config.reconnectInterval}ms (attempt ${this.reconnectAttempts})`
            );
            setTimeout(() => this.connect(), this.config.reconnectInterval);
          }
        };

        this.ws.onerror = (error) => {
          this.logger.error('Redis bridge connection error:', error);
          resolve(false);
        };
      } catch (error) {
        this.logger.error('Failed to connect to Redis bridge:', error);
        resolve(false);
      }
    });
  }

  /**
   * Disconnect from the Redis bridge
   */
  disconnect(): void {
    this.config.autoReconnect = false;
    this.stopHeartbeat();

    if (this.ws) {
      // Notify departure
      this.send({
        type: 'AGENT_LEAVE',
        payload: {
          agentName: this.config.agentName,
        },
      });

      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.logger.info('Disconnected from Redis bridge');
  }

  /**
   * Check if connected
   */
  isConnectedToBridge(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  // ============================================================================
  // AGENT REGISTRATION
  // ============================================================================

  /**
   * Register this extension as an agent
   */
  private register(): void {
    this.send({
      type: 'AGENT_REGISTER',
      payload: {
        agentName: this.config.agentName,
        role: this.config.agentRole,
        platform: 'chrome-extension',
        capabilities: this.config.capabilities,
        version: '1.0.0',
      },
    });
  }

  /**
   * Start heartbeat to maintain agent registration
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.isConnected) {
        this.send({
          type: 'AGENT_HEARTBEAT',
          payload: {
            agentName: this.config.agentName,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================

  /**
   * Handle incoming messages from Redis bridge
   */
  private handleMessage(message: any): void {
    this.logger.debug('Received message:', message.type);

    switch (message.type) {
      case 'AGENT_MESSAGE':
        this.handleAgentMessage(message.payload);
        break;

      case 'AGENT_COMMAND':
        this.handleAgentCommand(message.payload);
        break;

      case 'AGENT_LIST':
        this.handleAgentList(message.payload);
        break;

      case 'TASK_ASSIGNMENT':
        this.handleTaskAssignment(message.payload);
        break;

      case 'WORKFLOW_STEP':
        this.handleWorkflowStep(message.payload);
        break;

      case 'CONTEXT_REQUEST':
        this.handleContextRequest(message.payload);
        break;

      case 'PING':
        this.send({ type: 'PONG', payload: { timestamp: Date.now() } });
        break;
    }

    // Notify registered handlers
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message.payload);
    }
  }

  /**
   * Handle agent message
   */
  private handleAgentMessage(payload: RedisAgentMessage): void {
    this.logger.info(
      `Message from ${payload.from.agentName}: ${payload.content.substring(0, 50)}...`
    );

    // Broadcast to all message handlers
    const handler = this.messageHandlers.get('message');
    if (handler) {
      handler(payload);
    }
  }

  /**
   * Handle agent command
   */
  private handleAgentCommand(payload: RedisAgentMessage): void {
    this.logger.info(`Command from ${payload.from.agentName}: ${payload.content}`);

    const handler = this.messageHandlers.get('command');
    if (handler) {
      handler(payload);
    }
  }

  /**
   * Handle agent list update
   */
  private handleAgentList(payload: { agents: RedisAgentInfo[] }): void {
    if (this.onAgentListUpdate) {
      this.onAgentListUpdate(payload.agents);
    }
  }

  /**
   * Handle task assignment from orchestrator
   */
  private async handleTaskAssignment(payload: any): Promise<void> {
    this.logger.info('Received task assignment:', payload.task?.substring(0, 100));

    // Execute browser-specific task
    const result = await this.executeTask(payload);

    // Send result back
    this.sendMessage(result, {
      replyTo: payload.taskId,
      type: 'response',
    });
  }

  /**
   * Handle workflow step
   */
  private async handleWorkflowStep(payload: any): Promise<void> {
    this.logger.info('Executing workflow step:', payload.step);

    const handler = this.messageHandlers.get('workflow');
    if (handler) {
      handler(payload);
    }
  }

  /**
   * Handle context request
   */
  private handleContextRequest(payload: any): void {
    this.logger.debug('Context request:', payload);

    // Gather browser context
    this.gatherBrowserContext().then((context) => {
      this.send({
        type: 'CONTEXT_RESPONSE',
        payload: {
          requestId: payload.requestId,
          context,
        },
      });
    });
  }

  // ============================================================================
  // TASK EXECUTION
  // ============================================================================

  /**
   * Execute a browser automation task
   */
  private async executeTask(payload: any): Promise<string> {
    const { task, taskType } = payload;

    try {
      switch (taskType) {
        case 'navigate':
          return await this.navigateTask(task);

        case 'click':
          return await this.clickTask(task);

        case 'type':
          return await this.typeTask(task);

        case 'screenshot':
          return await this.screenshotTask();

        case 'extract':
          return await this.extractTask(task);

        case 'chat_input':
          return await this.chatInputTask(task);

        default:
          return `Unknown task type: ${taskType}`;
      }
    } catch (error) {
      return `Task failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  private async navigateTask(url: string): Promise<string> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.tabs.update(tab.id, { url });
      return `Navigated to ${url}`;
    }
    return 'No active tab';
  }

  private async clickTask(selector: string): Promise<string> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'CLICK_ELEMENT',
        selector,
      });
      return `Clicked element: ${selector}`;
    }
    return 'No active tab';
  }

  private async typeTask(data: { selector: string; text: string }): Promise<string> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'TYPE_TEXT',
        selector: data.selector,
        text: data.text,
      });
      return `Typed text into ${data.selector}`;
    }
    return 'No active tab';
  }

  private async screenshotTask(): Promise<string> {
    const dataUrl = await chrome.tabs.captureVisibleTab();
    return dataUrl;
  }

  private async extractTask(selector: string): Promise<string> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      const result = await chrome.tabs.sendMessage(tab.id, {
        type: 'EXTRACT_TEXT',
        selector,
      });
      return result || 'No content found';
    }
    return 'No active tab';
  }

  private async chatInputTask(message: string): Promise<string> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'CHAT_INPUT',
        message,
      });
      return `Sent message to chat: ${message.substring(0, 50)}...`;
    }
    return 'No active tab';
  }

  // ============================================================================
  // CONTEXT GATHERING
  // ============================================================================

  /**
   * Gather current browser context
   */
  private async gatherBrowserContext(): Promise<any> {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    return {
      activeTabs: tabs.map((t) => ({
        id: t.id,
        title: t.title,
        url: t.url,
        active: t.active,
      })),
      activeTab: activeTab
        ? {
            id: activeTab.id,
            title: activeTab.title,
            url: activeTab.url,
          }
        : null,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================================================
  // SENDING MESSAGES
  // ============================================================================

  /**
   * Send a message to the Redis network
   */
  sendMessage(
    content: string,
    options: {
      to?: string;
      replyTo?: string;
      type?: 'message' | 'response' | 'command';
      metadata?: Record<string, unknown>;
    } = {}
  ): void {
    this.send({
      type: 'AGENT_MESSAGE',
      payload: {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: options.type || 'message',
        content,
        from: {
          agentName: this.config.agentName,
          role: this.config.agentRole,
          platform: 'chrome-extension',
        },
        to: options.to,
        replyTo: options.replyTo,
        timestamp: new Date().toISOString(),
        metadata: options.metadata,
      },
    });
  }

  /**
   * Send raw message to WebSocket
   */
  private send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.logger.warn('Cannot send - not connected');
    }
  }

  /**
   * Request list of agents
   */
  requestAgentList(): void {
    this.send({
      type: 'GET_AGENTS',
      payload: {},
    });
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Register a message handler
   */
  onMessage(type: string, handler: (msg: RedisAgentMessage) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Register agent list update handler
   */
  onAgentUpdate(handler: (agents: RedisAgentInfo[]) => void): void {
    this.onAgentListUpdate = handler;
  }

  /**
   * Remove a message handler
   */
  offMessage(type: string): void {
    this.messageHandlers.delete(type);
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  /**
   * Get agent name
   */
  getAgentName(): string {
    return this.config.agentName;
  }

  /**
   * Update agent name
   */
  setAgentName(name: string): void {
    this.config.agentName = name;
    if (this.isConnected) {
      this.register(); // Re-register with new name
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const redisBridge = new RedisBridge();
