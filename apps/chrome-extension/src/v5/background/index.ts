/**
 * Fuse Connect v6 - Background Service Worker
 * Multi-node connection, federation channels, notifications
 *
 * This version handles connection failures gracefully and allows
 * starting the relay from the extension's Services tab.
 */

import type {
  Agent,
  AgentMessage,
  ConnectionStatus,
  FederationChannel,
  NodeType,
  Notification,
  NotificationType,
  ProtocolMessage,
  TNFNode,
} from '../shared/types';
import { simpleHash } from '../shared/utils';

// Storage keys
const STORAGE_KEYS = {
  settings: 'fuse_settings',
  agentId: 'fuse_agent_id',
  channels: 'fuse_channels',
  joinedChannels: 'fuse_joined_channels',
  knownNodes: 'fuse_known_nodes',
  autoConnect: 'fuse_auto_connect',
};

// Default node configuration
const DEFAULT_NODES = {
  relay: 'ws://localhost:3001/ws',
  apiGateway: 'http://localhost:3001',
  backend: 'http://localhost:3000',
  saas: 'https://app.thenewfuse.com',
};

// Native messaging host name
const NATIVE_HOST_NAME = 'com.thenewfuse.native_host';

class BackgroundService {
  // Connections
  private connections: Map<string, WebSocket> = new Map();
  private nodeStatus: Map<string, TNFNode> = new Map();
  private primaryConnection: WebSocket | null = null;

  // State
  private agentId: string = '';
  private agents: Map<string, Agent> = new Map();
  private channels: Map<string, FederationChannel> = new Map();
  private joinedChannels: Set<string> = new Set();
  private messageQueue: ProtocolMessage[] = [];
  private autoConnect: boolean = false; // Default to NOT auto-connect
  private connectionAttempts: number = 0;
  private maxInitialAttempts: number = 1; // Only try once on startup

  // Message deduplication - track recently sent/received message hashes
  private recentMessageHashes: Map<string, number> = new Map();
  private readonly MESSAGE_DEDUP_WINDOW_MS = 10000; // 10 second dedup window

  // Timers
  private reconnectTimers: Map<string, number> = new Map();
  private heartbeatTimer: number | null = null;
  private healthCheckTimer: number | null = null;
  private cleanupTimer: number | null = null; // Periodic cleanup to prevent memory leaks

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    console.log('[FuseConnect v6] Background service initializing...');

    // Get or create agent ID
    this.agentId = await this.getOrCreateAgentId();

    // Load saved state
    await this.loadSavedState();

    // Setup handlers
    this.setupMessageHandlers();
    this.setupCommands();

    // Start health checks (but don't auto-connect immediately)
    this.startHealthChecks();

    // Start periodic cleanup to prevent memory leaks
    this.startCleanupTimer();

    // Only auto-connect if user has enabled it
    if (this.autoConnect) {
      this.tryInitialConnection();
    } else {
      // Set initial status to disconnected without error
      this.updateNodeStatus('relay', DEFAULT_NODES.relay, 'disconnected');
    }

    console.log('[FuseConnect v6] Background service ready');
  }

  /**
   * Start periodic cleanup timer to prevent memory leaks
   */
  private startCleanupTimer(): void {
    // Run every 30 seconds to clean up old dedup hashes
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      // Clean up old message hashes
      for (const [hash, time] of this.recentMessageHashes.entries()) {
        if (now - time > this.MESSAGE_DEDUP_WINDOW_MS) {
          this.recentMessageHashes.delete(hash);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`[FuseConnect v6] Cleaned up ${cleaned} stale message hashes`);
      }
    }, 30000) as unknown as number;
  }

  /**
   * Try initial connection with limited retries
   */
  private async tryInitialConnection(): Promise<void> {
    // First check if relay is available via health endpoint
    const isAvailable = await this.checkRelayHealth();

    if (isAvailable) {
      this.connectToNode('relay', DEFAULT_NODES.relay);
    } else {
      console.log('[FuseConnect v6] Relay not available - use Services tab to start it');
      this.updateNodeStatus('relay', DEFAULT_NODES.relay, 'disconnected');
    }
  }

  /**
   * Check if relay is available via HTTP health endpoint
   */
  private async checkRelayHealth(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3001/health', {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      const data = await response.json();
      return data.status === 'ok';
    } catch (e) {
      return false;
    }
  }

  /**
   * Get or create persistent agent ID
   */
  private async getOrCreateAgentId(): Promise<string> {
    const result = await chrome.storage.local.get([STORAGE_KEYS.agentId]);
    let id = result[STORAGE_KEYS.agentId];

    if (!id) {
      id = `browser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await chrome.storage.local.set({ [STORAGE_KEYS.agentId]: id });
    }

    return id;
  }

  /**
   * Load saved state from storage
   */
  private async loadSavedState(): Promise<void> {
    const result = await chrome.storage.local.get([
      STORAGE_KEYS.channels,
      STORAGE_KEYS.joinedChannels,
      STORAGE_KEYS.knownNodes,
      STORAGE_KEYS.autoConnect,
      STORAGE_KEYS.settings,
    ]);

    if (result[STORAGE_KEYS.channels]) {
      (result[STORAGE_KEYS.channels] as FederationChannel[]).forEach((ch) => {
        this.channels.set(ch.id, ch);
      });
    }

    if (result[STORAGE_KEYS.joinedChannels]) {
      this.joinedChannels = new Set(result[STORAGE_KEYS.joinedChannels]);
    }

    // Load auto-connect preference (default false)
    this.autoConnect = result[STORAGE_KEYS.autoConnect] ?? false;

    // Also check settings object
    if (result[STORAGE_KEYS.settings]?.autoReconnect !== undefined) {
      this.autoConnect = result[STORAGE_KEYS.settings].autoReconnect;
    }
  }

  /**
   * Connect to a specific node
   */
  private connectToNode(nodeType: NodeType, url: string): void {
    if (this.connections.has(nodeType)) {
      const existing = this.connections.get(nodeType);
      if (existing?.readyState === WebSocket.OPEN) {
        console.log(`[FuseConnect v6] Already connected to ${nodeType}`);
        return;
      }
      // Close stale connection
      existing?.close();
      this.connections.delete(nodeType);
    }

    console.log(`[FuseConnect v6] Connecting to ${nodeType} at ${url}...`);
    this.updateNodeStatus(nodeType, url, 'connecting');

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log(`[FuseConnect v6] Connected to ${nodeType}`);
        this.connections.set(nodeType, ws);
        this.updateNodeStatus(nodeType, url, 'connected');
        this.connectionAttempts = 0; // Reset on success

        // Set as primary if first connection
        if (!this.primaryConnection) {
          this.primaryConnection = ws;
        }

        // Register agent
        this.registerAgent(ws);

        // Start heartbeat
        this.startHeartbeat();

        // Flush queued messages
        this.flushMessageQueue();

        // Request initial state
        this.requestSync(ws);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleRelayMessage(message, nodeType);
        } catch (e) {
          console.error('[FuseConnect v6] Failed to parse message:', e);
        }
      };

      ws.onclose = () => {
        console.log(`[FuseConnect v6] Disconnected from ${nodeType}`);
        this.connections.delete(nodeType);
        this.updateNodeStatus(nodeType, url, 'disconnected');

        if (this.primaryConnection === ws) {
          this.primaryConnection = null;
          // Try to find another connection
          for (const [, conn] of this.connections) {
            if (conn.readyState === WebSocket.OPEN) {
              this.primaryConnection = conn;
              break;
            }
          }
        }

        // Only auto-reconnect if enabled and we've connected before
        if (this.autoConnect && this.connectionAttempts === 0) {
          this.scheduleReconnect(nodeType, url);
        }
      };

      ws.onerror = () => {
        // Don't log error details - they're not useful and clutter console
        this.connectionAttempts++;
        this.updateNodeStatus(nodeType, url, 'disconnected');

        // Only schedule reconnect if auto-connect is enabled
        if (this.autoConnect && this.connectionAttempts < 3) {
          this.scheduleReconnect(nodeType, url);
        }
      };
    } catch (error) {
      console.log(`[FuseConnect v6] Unable to connect to ${nodeType} - relay may not be running`);
      this.updateNodeStatus(nodeType, url, 'disconnected');
    }
  }

  /**
   * Update node status
   */
  private updateNodeStatus(nodeType: NodeType, url: string, status: ConnectionStatus): void {
    const node: TNFNode = {
      id: nodeType,
      type: nodeType,
      url,
      status,
      lastConnected:
        status === 'connected' ? Date.now() : this.nodeStatus.get(nodeType)?.lastConnected || null,
      latency: null,
      features: this.getNodeFeatures(nodeType),
    };

    this.nodeStatus.set(nodeType, node);
    this.broadcastToTabs({
      type: 'CONNECTION_STATUS',
      status,
      node,
    });
  }

  /**
   * Get features supported by node type
   */
  private getNodeFeatures(nodeType: NodeType): string[] {
    const features: Record<NodeType, string[]> = {
      relay: ['websocket', 'agents', 'messages', 'channels'],
      'api-gateway': ['rest', 'auth', 'workflows'],
      backend: ['agents', 'persistence', 'workflows'],
      saas: ['cloud', 'auth', 'multi-tenant'],
      redis: ['pubsub', 'cache'],
      websocket: ['realtime'],
    };
    return features[nodeType] || [];
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(nodeType: NodeType, url: string): void {
    // Clear existing timer
    const existingTimer = this.reconnectTimers.get(nodeType);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Exponential backoff
    const delay = Math.min(5000 * Math.pow(2, this.connectionAttempts), 30000);
    console.log(`[FuseConnect v6] Will retry ${nodeType} in ${delay}ms...`);

    const timer = setTimeout(() => {
      this.connectToNode(nodeType, url);
    }, delay) as unknown as number;

    this.reconnectTimers.set(nodeType, timer);
  }

  /**
   * Register agent with relay
   */
  private registerAgent(ws: WebSocket): void {
    const message: ProtocolMessage = {
      id: crypto.randomUUID(),
      type: 'AGENT_REGISTER',
      timestamp: Date.now(),
      source: this.agentId,
      payload: {
        agent: {
          id: this.agentId,
          name: 'Browser Agent',
          platform: 'chrome-extension',
          status: 'active',
          capabilities: [
            'chat-injection',
            'dom-reading',
            'universal-detection',
            'streaming-detection',
            'notifications',
          ],
          channels: Array.from(this.joinedChannels),
        },
      },
    };

    ws.send(JSON.stringify(message));
  }

  /**
   * Request sync from relay
   */
  private requestSync(ws: WebSocket): void {
    // Request agent list
    this.send({ type: 'AGENT_LIST' }, ws);

    // Request channel list
    this.send({ type: 'CHANNEL_LIST' }, ws);
  }

  /**
   * Send message via WebSocket
   */
  private send(data: Record<string, unknown>, ws?: WebSocket): void {
    const connection = ws || this.primaryConnection;

    let message: ProtocolMessage;

    // Special handling for MESSAGE_SEND to match relay's expected format
    if (data.type === 'MESSAGE_SEND') {
      message = {
        id: crypto.randomUUID(),
        type: 'MESSAGE_SEND',
        timestamp: Date.now(),
        source: this.agentId,
        channel: data.channel as string,
        payload: {
          to: data.to,
          content: data.content,
          messageType: data.messageType || 'text',
        },
      };
    } else {
      message = {
        id: crypto.randomUUID(),
        type: data.type as any,
        timestamp: Date.now(),
        source: this.agentId,
        channel: data.channel as string,
        payload: data,
      };
    }

    if (connection?.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify(message));
      console.log('[FuseConnect v6] Sent to relay:', message.type, message.channel);
    } else {
      this.messageQueue.push(message);
      console.log('[FuseConnect v6] Queued message (not connected):', message.type);
    }
  }

  /**
   * Flush message queue
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.primaryConnection?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      if (message) {
        this.primaryConnection.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) return;

    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'HEARTBEAT' });
    }, 30000) as unknown as number;
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(() => {
      // Check all nodes
      for (const [nodeType, node] of this.nodeStatus) {
        const ws = this.connections.get(nodeType);
        if (ws && ws.readyState !== WebSocket.OPEN && node.status === 'connected') {
          this.updateNodeStatus(nodeType as NodeType, node.url, 'disconnected');
        }
      }
    }, 10000) as unknown as number;
  }

  /**
   * Handle messages from relay
   */
  private handleRelayMessage(message: ProtocolMessage, nodeType: string): void {
    console.log(`[FuseConnect v6] Received from ${nodeType}:`, message.type);

    switch (message.type) {
      case 'WELCOME':
        console.log('[FuseConnect v6] Welcome received');
        break;

      case 'AGENT_LIST':
        const agents = (message.payload as any).agents || [];
        this.agents.clear();
        agents.forEach((a: Agent) => this.agents.set(a.id, a));
        this.broadcastToTabs({ type: 'AGENTS_UPDATE', agents });
        break;

      case 'AGENT_STATUS':
        const agent = (message.payload as any).agent;
        if (agent) {
          this.agents.set(agent.id, agent);
          this.broadcastToTabs({ type: 'AGENTS_UPDATE', agents: Array.from(this.agents.values()) });

          // Notification for new agents
          if (agent.status === 'active') {
            this.createNotification(
              'agent_joined',
              'Agent Connected',
              `${agent.name} is now online`
            );
          }
        }
        break;

      case 'CHANNEL_LIST':
        const channels = (message.payload as any).channels || [];
        this.channels.clear();
        channels.forEach((ch: FederationChannel) => this.channels.set(ch.id, ch));
        this.broadcastToTabs({ type: 'CHANNELS_UPDATE', channels });
        this.saveChannels();
        break;

      case 'CHANNEL_MESSAGE':
      case 'MESSAGE_RECEIVE':
        const agentMessage = message.payload as AgentMessage;
        this.handleAgentMessage(agentMessage);
        break;

      case 'MESSAGE_STREAM_START':
        this.broadcastToTabs({
          type: 'STREAMING_START',
          messageId: (message.payload as any).messageId,
        });
        break;

      case 'MESSAGE_STREAM_CHUNK':
        this.broadcastToTabs({
          type: 'STREAMING_CHUNK',
          messageId: (message.payload as any).messageId,
          chunk: (message.payload as any).chunk,
        });
        break;

      case 'MESSAGE_STREAM_END':
        this.broadcastToTabs({
          type: 'STREAMING_END',
          messageId: (message.payload as any).messageId,
        });
        break;

      case 'ERROR':
        console.error('[FuseConnect v6] Relay error:', message.payload);
        this.createNotification(
          'error',
          'Error',
          (message.payload as any).message || 'Unknown error'
        );
        break;
    }
  }

  /**
   * Handle incoming agent message
   */
  private handleAgentMessage(message: AgentMessage): void {
    // CRITICAL: Skip messages that originated from THIS agent to prevent feedback loops
    if (message.from === this.agentId || message.from === 'Browser Agent') {
      console.log('[FuseConnect v6] Skipping own message echo from relay');
      return;
    }

    // Deduplication: Create a hash of the message content and check if we've seen it recently
    const msgHash = simpleHash(
      `${message.from}:${message.content}:${Math.floor(message.timestamp / 1000)}`
    );
    const now = Date.now();

    if (this.recentMessageHashes.has(msgHash)) {
      console.log('[FuseConnect v6] Skipping duplicate message');
      return;
    }

    // Store hash with timestamp
    this.recentMessageHashes.set(msgHash, now);

    // Clean up old hashes
    for (const [hash, time] of this.recentMessageHashes.entries()) {
      if (now - time > this.MESSAGE_DEDUP_WINDOW_MS) {
        this.recentMessageHashes.delete(hash);
      }
    }

    // Broadcast to tabs
    this.broadcastToTabs({
      type: 'NEW_MESSAGE',
      message,
    });

    // Create notification
    if (message.to === this.agentId || message.to === 'broadcast') {
      this.createNotification(
        'message',
        `Message from ${message.from}`,
        message.content.substring(0, 100)
      );
    }

    // Handle commands
    if (message.to === this.agentId && message.type === 'command') {
      this.executeCommand(message);
    }
  }

  /**
   * Execute command from another agent
   */
  private async executeCommand(message: AgentMessage): Promise<void> {
    const content = message.content;

    if (content.startsWith('/inject ')) {
      const text = content.slice(8);
      await this.injectMessageToActiveTab(text);
    } else if (content === '/get-response') {
      const response = await this.getLastResponseFromActiveTab();
      this.send({
        type: 'MESSAGE_SEND',
        to: message.from,
        content: response || 'No response available',
        messageType: 'response',
      });
    } else if (content === '/get-status') {
      const status = await this.getTabChatStatus();
      this.send({
        type: 'MESSAGE_SEND',
        to: message.from,
        content: JSON.stringify(status),
        messageType: 'response',
      });
    }
  }

  /**
   * Create and broadcast notification
   */
  private createNotification(type: NotificationType, title: string, message: string): void {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type,
      title,
      message,
      priority: type === 'error' ? 'high' : 'normal',
      timestamp: Date.now(),
      read: false,
    };

    this.broadcastToTabs({
      type: 'NOTIFICATION',
      notification,
    });
  }

  /**
   * Inject message to active tab
   */
  private async injectMessageToActiveTab(text: string): Promise<void> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'INJECT_MESSAGE',
        content: text,
      });
    }
  }

  /**
   * Get last response from active tab
   */
  private async getLastResponseFromActiveTab(): Promise<string | null> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabs[0].id!, { type: 'GET_LAST_RESPONSE' }, (response) => {
          resolve(response?.response || null);
        });
      });
    }
    return null;
  }

  /**
   * Get chat status from active tab
   */
  private async getTabChatStatus(): Promise<any> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabs[0].id!, { type: 'GET_CHAT_STATUS' }, (response) => {
          resolve(response || {});
        });
      });
    }
    return {};
  }

  /**
   * Broadcast to all tabs
   */
  private async broadcastToTabs(message: Record<string, unknown>): Promise<void> {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, message).catch((err) => {
          // Ignore "Receiving end does not exist" which is normal for tabs without our content script
          if (err.message && !err.message.includes('Receiving end does not exist')) {
            console.warn(`[FuseConnect v6] Failed to broadcast to tab ${tab.id}:`, err);
          }
        });
      }
    }
  }

  /**
   * Save channels to storage
   */
  private async saveChannels(): Promise<void> {
    await chrome.storage.local.set({
      [STORAGE_KEYS.channels]: Array.from(this.channels.values()),
      [STORAGE_KEYS.joinedChannels]: Array.from(this.joinedChannels),
    });
  }

  /**
   * Send native message to control services
   */
  private async sendNativeMessage(message: Record<string, unknown>): Promise<any> {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendNativeMessage(NATIVE_HOST_NAME, message, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ error: chrome.runtime.lastError.message });
          } else {
            resolve(response || {});
          }
        });
      } catch (e) {
        resolve({ error: 'Native messaging not available' });
      }
    });
  }

  /**
   * Setup message handlers from popup/content
   */
  private setupMessageHandlers(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'CONNECT':
          this.connectionAttempts = 0;
          this.connectToNode('relay', message.url || DEFAULT_NODES.relay);
          sendResponse({ success: true });
          break;

        case 'DISCONNECT':
          this.disconnectAll();
          sendResponse({ success: true });
          break;

        case 'GET_STATE':
          sendResponse({
            connectionStatus:
              this.primaryConnection?.readyState === WebSocket.OPEN ? 'connected' : 'disconnected',
            agents: Array.from(this.agents.values()),
            channels: Array.from(this.channels.values()),
            joinedChannels: Array.from(this.joinedChannels),
            nodes: Object.fromEntries(this.nodeStatus),
            agentId: this.agentId,
            autoConnect: this.autoConnect,
          });
          break;

        case 'SET_AUTO_CONNECT':
          this.autoConnect = message.enabled;
          chrome.storage.local.set({ [STORAGE_KEYS.autoConnect]: message.enabled });
          sendResponse({ success: true });
          break;

        case 'START_RELAY':
          // Start relay via native messaging
          this.sendNativeMessage({ action: 'start', service: 'relay' }).then((response) => {
            sendResponse(response);
            // Try to connect after a short delay
            if (response.result?.success || !response.error) {
              setTimeout(() => {
                this.connectionAttempts = 0;
                this.connectToNode('relay', DEFAULT_NODES.relay);
              }, 3000);
            }
          });
          return true; // Async response

        case 'STOP_RELAY':
          this.sendNativeMessage({ action: 'stop', service: 'relay' }).then((response) => {
            this.disconnectAll();
            sendResponse(response);
          });
          return true;

        case 'CHECK_RELAY_HEALTH':
          this.checkRelayHealth().then((isHealthy) => {
            sendResponse({ healthy: isHealthy });
          });
          return true;

        case 'BROADCAST_MESSAGE':
          this.send({
            type: 'MESSAGE_SEND',
            to: 'broadcast',
            channel: message.channel,
            content: message.content,
            messageType: 'text',
          });
          sendResponse({ success: true });
          break;

        case 'SEND_TO_AGENT':
          this.send({
            type: 'MESSAGE_SEND',
            to: message.agentId,
            content: message.content,
            messageType: message.messageType || 'text',
          });
          sendResponse({ success: true });
          break;

        case 'CHANNEL_CREATE':
          this.send({
            type: 'CHANNEL_CREATE',
            name: message.name,
            description: message.description,
            isPrivate: message.isPrivate || false,
          });
          sendResponse({ success: true });
          break;

        case 'CHANNEL_JOIN':
          this.joinedChannels.add(message.channelId);
          this.send({
            type: 'CHANNEL_JOIN',
            channelId: message.channelId,
          });
          this.saveChannels();
          sendResponse({ success: true });
          break;

        case 'CHANNEL_LEAVE':
          this.joinedChannels.delete(message.channelId);
          this.send({
            type: 'CHANNEL_LEAVE',
            channelId: message.channelId,
          });
          this.saveChannels();
          sendResponse({ success: true });
          break;

        case 'CONTENT_SCRIPT_READY':
          // Send current state to new tab
          if (sender.tab?.id) {
            const status =
              this.primaryConnection?.readyState === WebSocket.OPEN ? 'connected' : 'disconnected';
            chrome.tabs.sendMessage(sender.tab.id, { type: 'CONNECTION_STATUS', status });
            chrome.tabs.sendMessage(sender.tab.id, {
              type: 'AGENTS_UPDATE',
              agents: Array.from(this.agents.values()),
            });
            chrome.tabs.sendMessage(sender.tab.id, {
              type: 'CHANNELS_UPDATE',
              channels: Array.from(this.channels.values()),
            });
          }
          sendResponse({ success: true });
          break;

        case 'TOGGLE_PANEL':
          this.broadcastToTabs({ type: 'TOGGLE_PANEL' });
          sendResponse({ success: true });
          break;

        case 'REQUEST_SYNC':
          if (this.primaryConnection) {
            this.requestSync(this.primaryConnection);
          }
          sendResponse({ success: true });
          break;

        case 'INJECT_MESSAGE':
          // Forward message injection request to active tab's content script
          // This handles messages from the FloatingPanel that need to be injected into the page's chat
          this.injectMessageToActiveTab(message.content)
            .then(() => {
              sendResponse({ success: true });
            })
            .catch((error) => {
              console.error('[FuseConnect v6] Error injecting message:', error);
              sendResponse({ success: false, error: error.message });
            });
          return true; // Async response

        case 'GET_LAST_RESPONSE':
          // Forward to active tab and return the response
          this.getLastResponseFromActiveTab().then((response) => {
            sendResponse({ response });
          });
          return true; // Async response

        case 'CHAT_DETECTED':
        case 'STREAMING_UPDATE':
          // Forward to other tabs for awareness
          this.broadcastToTabs(message);
          sendResponse({ success: true });
          break;

        case 'RESPONSE_COMPLETE':
          // Forward to other tabs for awareness
          this.broadcastToTabs(message);

          // ALSO send to relay so other agents can receive it
          // But use deduplication to prevent echo loops
          if (this.primaryConnection?.readyState === WebSocket.OPEN && message.content) {
            // Create a hash for this AI response to prevent re-sending
            // Use longer substring (500 chars) for better uniqueness
            const responseHash = simpleHash(`ai:${message.content.substring(0, 500)}`);
            const now = Date.now();

            if (!this.recentMessageHashes.has(responseHash)) {
              this.recentMessageHashes.set(responseHash, now);

              // Get the current channel from storage or use broadcast
              chrome.storage.local.get(['fuse_current_channel'], (result) => {
                const channel = result.fuse_current_channel || null;
                // Only send if we have a channel selected
                if (channel) {
                  this.send({
                    type: 'MESSAGE_SEND',
                    to: 'broadcast',
                    channel: channel,
                    content: `[AI → User] ${message.content}`, // Send FULL content
                    messageType: 'ai-response',
                  });
                  console.log('[FuseConnect v6] AI response forwarded to relay', {
                    channel,
                    length: message.content.length,
                  });
                }
              });
            } else {
              console.log('[FuseConnect v6] Skipping duplicate AI response broadcast');
            }
          }
          sendResponse({ success: true });
          break;
      }

      return true;
    });
  }

  /**
   * Disconnect all connections
   */
  private disconnectAll(): void {
    for (const [nodeType, ws] of this.connections) {
      ws.close();
    }
    this.connections.clear();
    this.primaryConnection = null;

    // Clear reconnect timers
    for (const timer of this.reconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.reconnectTimers.clear();

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Update status
    this.updateNodeStatus('relay', DEFAULT_NODES.relay, 'disconnected');
  }

  /**
   * Setup keyboard commands
   */
  private setupCommands(): void {
    chrome.commands.onCommand.addListener((command) => {
      if (command === 'toggle-panel') {
        this.broadcastToTabs({ type: 'TOGGLE_PANEL' });
      }
    });
  }
}

// Initialize
new BackgroundService();
