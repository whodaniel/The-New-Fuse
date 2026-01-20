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
  apiGateway: 'http://localhost:3000',
  backend: 'http://localhost:3000',
  saas: 'http://localhost:3002',
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
  private pendingPageAgents: Agent[] = []; // Queue for page agents waiting for connection
  private autoConnect: boolean = true; // Default to TRUE for agent operation
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

    // Auto-join Red channel
    this.joinedChannels.add('red');

    // Load auto-connect preference (default true)
    this.autoConnect = result[STORAGE_KEYS.autoConnect] ?? true;

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

        // Flush pending page agent registrations
        this.flushPendingPageAgents();

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
          metadata: {
            node: {
              type: 'browser',
              platform: navigator.platform,
              userAgent: navigator.userAgent,
              language: navigator.language,
            },
          },
        },
      },
    };

    ws.send(JSON.stringify(message));
  }

  /**
   * Register a new page agent (for AI chat tabs)
   */
  private registerPageAgent(id: string, name: string, platform: string): void {
    // 1. Create agent object
    const agent: Agent = {
      id: id,
      name: name,
      platform: 'browser-page',
      status: 'active',
      capabilities: ['chat-injection', 'dom-reading'], // Basic capabilities for a page agent
      channels: [], // Initially no channels
      metadata: {
        node: {
          type: 'browser-tab',
          platform: platform,
        },
      },
      lastSeen: Date.now(),
    };

    // 2. Store locally so we know about it
    this.agents.set(id, agent);

    // 3. Register with Relay (if connected) OR QUEUE for later
    if (this.primaryConnection?.readyState === WebSocket.OPEN) {
      // Register the agent
      const regMessage: ProtocolMessage = {
        id: crypto.randomUUID(),
        type: 'AGENT_REGISTER',
        timestamp: Date.now(),
        source: this.agentId,
        payload: {
          agent: agent,
        },
      };
      this.primaryConnection.send(JSON.stringify(regMessage));
      console.log(`[FuseConnect v6] Registered Page Agent: ${name} (${id})`);

      // AUTO-JOIN: Join any channels the main browser agent is in
      // This ensures the new tab immediately is part of the conversation
      for (const channelId of this.joinedChannels) {
        const joinMessage: ProtocolMessage = {
          id: crypto.randomUUID(),
          type: 'CHANNEL_JOIN',
          timestamp: Date.now(),
          source: id, // Use the page agent ID as source for the join
          payload: {
            channelId: channelId,
          },
        };
        this.primaryConnection.send(JSON.stringify(joinMessage));
        console.log(`[FuseConnect v6] Auto-joined Page Agent ${id} to channel ${channelId}`);

        // Update local agent object
        agent.channels.push(channelId);
      }
    } else {
      // NOT CONNECTED: Queue for registration when connection is established
      console.log(`[FuseConnect v6] Queued Page Agent for later registration: ${name} (${id})`);
      this.pendingPageAgents.push(agent);
    }

    // 4. Notify all tabs about the new agent list
    this.broadcastToTabs({
      type: 'AGENTS_UPDATE',
      agents: Array.from(this.agents.values()),
    });
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
        channel: (data.channel as string) || 'general',
        payload: {
          to: data.to,
          content: data.content,
          messageType: data.messageType || 'text',
          metadata: data.metadata, // <-- INCLUDE SENDER METADATA
        },
      };
    } else {
      message = {
        id: crypto.randomUUID(),
        type: data.type as any,
        timestamp: Date.now(),
        source: this.agentId,
        channel: (data.channel as string) || 'general',
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
   * Flush pending page agent registrations
   * Called when WebSocket connection is established
   */
  private flushPendingPageAgents(): void {
    if (this.primaryConnection?.readyState !== WebSocket.OPEN) return;

    console.log(
      `[FuseConnect v6] Flushing ${this.pendingPageAgents.length} pending page agent registrations`
    );

    while (this.pendingPageAgents.length > 0) {
      const agent = this.pendingPageAgents.shift();
      if (agent) {
        // Register the agent
        const regMessage: ProtocolMessage = {
          id: crypto.randomUUID(),
          type: 'AGENT_REGISTER',
          timestamp: Date.now(),
          source: this.agentId,
          payload: { agent },
        };
        this.primaryConnection.send(JSON.stringify(regMessage));
        console.log(`[FuseConnect v6] Registered queued Page Agent: ${agent.name} (${agent.id})`);

        // Auto-join channels
        for (const channelId of this.joinedChannels) {
          const joinMessage: ProtocolMessage = {
            id: crypto.randomUUID(),
            type: 'CHANNEL_JOIN',
            timestamp: Date.now(),
            source: agent.id,
            payload: { channelId },
          };
          this.primaryConnection.send(JSON.stringify(joinMessage));
          agent.channels.push(channelId);
        }
      }
    }
  }

  /**
   * Start heartbeat
   * ORCHESTRATOR FIX: Send heartbeats for all page agents to prevent timeout
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) return;

    this.heartbeatTimer = setInterval(() => {
      // Send heartbeat for main browser agent
      this.send({ type: 'HEARTBEAT' });

      // Send heartbeats for all registered page agents (Gemini tabs, etc.)
      // This prevents the relay from timing out virtual agents
      for (const [agentId, agent] of this.agents) {
        if (agentId !== this.agentId && agent.platform === 'browser-page') {
          // Send heartbeat as if it came from the page agent
          const heartbeatMessage: ProtocolMessage = {
            id: crypto.randomUUID(),
            type: 'HEARTBEAT',
            timestamp: Date.now(),
            source: agentId, // Use page agent ID
            payload: {},
          };

          if (this.primaryConnection?.readyState === WebSocket.OPEN) {
            this.primaryConnection.send(JSON.stringify(heartbeatMessage));
          }
        }
      }
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

      case 'TASK_ASSIGN':
        this.broadcastToTabs({
          type: 'TASK_ASSIGN',
          task: (message.payload as any).task,
          channel: message.channel,
          timestamp: message.timestamp,
        });
        this.createNotification(
          'info',
          'New Task Assigned',
          `Task: ${(message.payload as any).task.title}`
        );
        break;
    }
  }

  /**
   * Handle incoming agent message
   */
  private handleAgentMessage(message: AgentMessage): void {
    // CRITICAL: We need to handle 'own' messages if they are on a channel
    // because "Browser Agent" represents ALL windows/tabs.
    // If Window A sends a message, it goes to Relay -> Relay broadcasts to Channel -> Browser Agent receives it.
    // Browser Agent MUST forward this to Window B.

    // Only skip if it's a direct message to self not on a channel (which shouldn't happen much)
    // or if we rely strictly on content deduplication.

    if (message.from === this.agentId || message.from === 'Browser Agent') {
      if (!message.channel) {
        console.log('[FuseConnect v6] Skipping direct self-message echo');
        return;
      }

      // Check for duplication even for self-messages to prevent echo loops
      const msgHash = simpleHash(
        `${message.from}:${message.content}:${Math.floor(message.timestamp / 1000)}`
      );
      if (this.recentMessageHashes.has(msgHash)) {
        console.log('[FuseConnect v6] Skipping duplicate self-message on channel');
        return;
      }

      // If it IS a channel message and NOT a duplicate, we process it
      // so we can broadcastToTabs.
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
    if ((message.to === this.agentId || message.to === 'broadcast') && message.type === 'command') {
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
        // Use a wrapper to catch the specific "Receiving end does not exist" error
        // which occurs when sending to tabs that don't have our content script loaded
        try {
          // WE MUST usage callback style or await the promise to catch the error
          chrome.tabs.sendMessage(tab.id, message, () => {
            // Checking lastError inside the callback suppresses the "Unchecked runtime.lastError"
            const err = chrome.runtime.lastError;
            if (
              err &&
              !err.message?.includes('Receiving end does not exist') &&
              !err.message?.includes('Could not establish connection')
            ) {
              console.warn(`[FuseConnect v6] Failed to broadcast to tab ${tab.id}:`, err);
            }
          });
        } catch (e) {
          // This catch block might not be reached for async sendMessage errors,
          // but good for synchronous ones.
        }
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

        case 'AI_STUDIO_AUTH':
          // Handle AI Studio OAuth2 authentication
          chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError) {
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
              // Store token and get user info
              chrome.storage.local.set({ ai_studio_token: token });
              sendResponse({ success: true, token });
            }
          });
          return true; // Async response

        case 'AI_STUDIO_GET_PLAYLISTS':
          // Fetch YouTube playlists using stored token
          chrome.storage.local.get(['ai_studio_token'], (result) => {
            if (!result.ai_studio_token) {
              sendResponse({ success: false, error: 'Not authenticated' });
              return;
            }
            // TODO: Implement YouTube API call
            sendResponse({ success: true, playlists: [] });
          });
          return true;

        case 'AI_STUDIO_PROCESS_VIDEO':
          // Queue video for processing
          chrome.storage.local.get(['ai_studio_queue'], (result) => {
            const queue = result.ai_studio_queue || [];
            queue.push(message.video);
            chrome.storage.local.set({ ai_studio_queue: queue });
            sendResponse({ success: true, queueLength: queue.length });
          });
          return true;

        case 'BROADCAST_MESSAGE':
          // CRITICAL FIX: Preserve the `metadata` including `senderId` so receiving tabs
          // can identify messages that originated from themselves and avoid self-injection loops.
          this.send({
            type: 'MESSAGE_SEND',
            to: 'broadcast',
            channel: message.channel,
            content: message.content,
            messageType: 'text',
            metadata: message.metadata, // <-- PRESERVE SENDER INFO
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
          // Optimistically create channel locally
          const newChannel: FederationChannel = {
            id: `local-${Date.now()}`,
            name: message.name,
            description: message.description || '',
            isPrivate: message.isPrivate || false,
            createdAt: Date.now(),
            createdBy: this.agentId,
            members: [this.agentId],
          };

          this.channels.set(newChannel.id, newChannel);
          this.joinedChannels.add(newChannel.id);
          this.broadcastToTabs({
            type: 'CHANNELS_UPDATE',
            channels: Array.from(this.channels.values()),
          });
          this.saveChannels();

          // Forward to Relay
          this.send({
            type: 'CHANNEL_CREATE',
            name: message.name,
            description: message.description,
            isPrivate: message.isPrivate || false,
          });
          sendResponse({ success: true, channel: newChannel });
          break;

        case 'CHANNEL_JOIN':
          this.joinedChannels.add(message.channelId);
          this.send({
            type: 'CHANNEL_JOIN',
            channelId: message.channelId,
          });
          this.saveChannels();
          // Broadcast to all tabs that we joined a channel
          this.broadcastToTabs({
            type: 'JOINED_CHANNELS_UPDATE',
            joinedChannels: Array.from(this.joinedChannels),
          });
          sendResponse({ success: true });
          break;

        case 'CHANNEL_LEAVE':
          this.joinedChannels.delete(message.channelId);
          this.send({
            type: 'CHANNEL_LEAVE',
            channelId: message.channelId,
          });
          this.saveChannels();
          // Broadcast update
          this.broadcastToTabs({
            type: 'JOINED_CHANNELS_UPDATE',
            joinedChannels: Array.from(this.joinedChannels),
          });
          sendResponse({ success: true });
          break;

        case 'CONTENT_SCRIPT_READY':
          // Send current state to new tab
          if (sender.tab?.id) {
            const status =
              this.primaryConnection?.readyState === WebSocket.OPEN ? 'connected' : 'disconnected';

            // Send connection status
            chrome.tabs.sendMessage(sender.tab.id, { type: 'CONNECTION_STATUS', status });

            // Send Agents
            chrome.tabs.sendMessage(sender.tab.id, {
              type: 'AGENTS_UPDATE',
              agents: Array.from(this.agents.values()),
            });

            // Send Channels
            chrome.tabs.sendMessage(sender.tab.id, {
              type: 'CHANNELS_UPDATE',
              channels: Array.from(this.channels.values()),
            });

            // Send Joined Channels
            chrome.tabs.sendMessage(sender.tab.id, {
              type: 'JOINED_CHANNELS_UPDATE',
              joinedChannels: Array.from(this.joinedChannels),
            });

            // Send currently selected channel per-tab if we track it,
            // but the UI currently pulls 'fuse_current_channel' from storage itself.
          }
          sendResponse({ success: true });
          break;

        case 'TOGGLE_PANEL':
          this.broadcastToTabs({ type: 'TOGGLE_PANEL' });
          sendResponse({ success: true });
          break;

        case 'ACTIVATE_ON_TAB':
          // Programmatically inject content script on unknown sites
          // This allows the extension to work on any AI chat site, not just preset ones
          chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs[0]?.id) {
              try {
                // First check if content script is already injected
                const checkResult = await chrome.tabs
                  .sendMessage(tabs[0].id, { type: 'PING' })
                  .catch(() => null);

                if (checkResult) {
                  // Already injected, just show the panel
                  chrome.tabs.sendMessage(tabs[0].id, { type: 'SHOW_PANEL' });
                  sendResponse({ success: true, alreadyActive: true });
                } else {
                  // Inject content script
                  await chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    files: ['content/index.js'],
                  });
                  console.log(`[FuseConnect v6] Content script injected into tab ${tabs[0].id}`);

                  // Wait a moment for initialization, then show panel
                  setTimeout(() => {
                    if (tabs[0]?.id) {
                      chrome.tabs.sendMessage(tabs[0].id, { type: 'SHOW_PANEL' });
                    }
                  }, 500);

                  sendResponse({ success: true, injected: true });
                }
              } catch (error: any) {
                console.error('[FuseConnect v6] Failed to activate on tab:', error);
                sendResponse({ success: false, error: error.message });
              }
            } else {
              sendResponse({ success: false, error: 'No active tab found' });
            }
          });
          return true; // Async response

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
          // 1. Register this tab as a distinct Agent
          if (sender.tab?.id) {
            const pageAgentId = `page-agent-${sender.tab.id}-${Math.random().toString(36).substr(2, 5)}`;
            const hostname = sender.tab.url ? new URL(sender.tab.url).hostname : 'page';
            // Clean hostname for better display (e.g. "gemini.google.com" -> "Gemini")
            let platformName = hostname;
            if (hostname.includes('google.com')) platformName = 'Gemini';
            else if (hostname.includes('openai.com')) platformName = 'ChatGPT';
            else if (hostname.includes('claude.ai')) platformName = 'Claude';

            this.registerPageAgent(pageAgentId, `AI Chat (${platformName})`, hostname);

            // 2. Broadcast availability
            this.broadcastToTabs(message);

            // 3. Return the assigned Agent ID to the tab so it knows who it is
            sendResponse({ success: true, agentId: pageAgentId });
          } else {
            this.broadcastToTabs(message);
            sendResponse({ success: true });
          }
          break;

        case 'STREAMING_UPDATE':

        case 'RESPONSE_COMPLETE':
          // MULTI-AGENT COLLABORATION:
          // AI responses MUST be broadcast to the channel so OTHER agents can see and respond.
          // This enables the "chatroom" model where all participants coordinate.
          //
          // Key: Include senderId so receiving tabs can identify if this is their OWN response
          // (which they should NOT re-inject) vs an EXTERNAL agent's response (which they SHOULD inject).

          // Forward to other tabs in this browser
          this.broadcastToTabs(message);

          // Broadcast to relay so OTHER agents (in other browsers/instances) can receive
          if (this.primaryConnection?.readyState === WebSocket.OPEN && message.content) {
            // Deduplication to prevent echo loops
            const responseHash = simpleHash(`ai:${message.content.substring(0, 500)}`);
            const now = Date.now();

            if (!this.recentMessageHashes.has(responseHash)) {
              this.recentMessageHashes.set(responseHash, now);

              // Get sender's agent ID from message metadata (set by content script)
              // The content script sets metadata.agentId = this.pageAgentId when it detects the AI response
              let senderId = message.metadata?.agentId || message.senderId;

              // Fallback: construct from tab ID if not provided
              if (!senderId && sender.tab?.id) {
                senderId = `page-agent-${sender.tab.id}`;
                console.log('[FuseConnect v6] Using tab-based senderId:', senderId);
              }

              // FIXED: Don't drop messages without senderId - use a safe fallback instead
              // This ensures CLI agents and other sources still work
              // The content script's isSelfMessage check will prevent loops
              if (!senderId) {
                senderId = `ai-response-${Date.now()}`;
                console.log(
                  '[FuseConnect v6] Using generated senderId for anonymous response:',
                  senderId
                );
              }

              console.log('[FuseConnect v6] AI Response from agent:', senderId);

              chrome.storage.local.get(['fuse_current_channel'], (result) => {
                let channel = result.fuse_current_channel;

                if (!channel && this.joinedChannels.size > 0) {
                  channel = Array.from(this.joinedChannels)[0];
                }

                if (channel) {
                  // Get platform name for context (inline detection)
                  const tabUrl = sender.tab?.url || '';
                  let platformName = message.platform || 'unknown';
                  if (!message.platform) {
                    if (tabUrl.includes('gemini.google')) platformName = 'Gemini';
                    else if (tabUrl.includes('chat.openai') || tabUrl.includes('chatgpt'))
                      platformName = 'ChatGPT';
                    else if (tabUrl.includes('claude.ai')) platformName = 'Claude';
                    else if (tabUrl.includes('copilot')) platformName = 'Copilot';
                  }

                  // FEDERATION IMPROVEMENT: Include correlation metadata for response matching
                  const responseMetadata: any = {
                    senderId: senderId, // KEY: Used to prevent self-injection
                    senderType: 'ai-agent',
                    platform: platformName,
                    isAIResponse: true,
                    timestamp: Date.now(),
                  };

                  // Include correlation info if present (from orchestrator requests)
                  if (message.metadata?.correlationId) {
                    responseMetadata.correlationId = message.metadata.correlationId;
                    responseMetadata.taskId = message.metadata.taskId;
                    responseMetadata.inResponseTo = message.metadata.inResponseTo;
                    console.log(
                      '[FuseConnect v6] 🔗 Including correlation in broadcast:',
                      message.metadata.correlationId
                    );
                  }

                  this.send({
                    type: 'MESSAGE_SEND',
                    to: 'broadcast',
                    channel: channel,
                    content: message.content,
                    messageType: 'ai-response',
                    metadata: responseMetadata,
                  });
                  console.log('[FuseConnect v6] AI response broadcast to channel:', {
                    channel,
                    senderId,
                    platform: platformName,
                    contentLength: message.content.length,
                    hasCorrelation: !!message.metadata?.correlationId,
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
