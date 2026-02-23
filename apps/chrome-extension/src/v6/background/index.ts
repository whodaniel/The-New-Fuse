/**
 * Fuse Connect v7 - Background Service Worker
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
  tabActiveChannels: 'fuse_tab_active_channels',
  tabPausedChannels: 'fuse_tab_paused_channels',
  knownNodes: 'fuse_known_nodes',
  autoConnect: 'fuse_auto_connect',
  autoMonitor: 'fuse_auto_monitor',
  autoMasterClock: 'fuse_auto_master_clock',
  autoWakePing: 'fuse_auto_wake_ping',
  eventLog: 'fuse_event_log',
};

// Default node configuration
const DEFAULT_NODES = {
  relay: 'ws://localhost:3000/ws',
  apiGateway: 'http://localhost:3000',
  backend: 'http://localhost:3000',
  saas: 'http://localhost:3002',

  // Canonical edge state (Cloudflare)
  tnfWorker: 'https://tnf-agent-orchestration.bizsynth.workers.dev',
};

// Native messaging host name
const NATIVE_HOST_NAME = 'com.thenewfuse.native_host';
const AI_VIDEO_PROCESS_ALARM = 'ai_video_process_tick';

type TranscriptRole = 'system' | 'user' | 'assistant' | 'tool';

type TranscriptEntry = {
  id: string;
  ts: number;
  role: TranscriptRole;
  content: string;
  meta?: Record<string, unknown>;
};

type AIVideoQueueItem = {
  id: string;
  title: string;
  url: string;
  addedAt: number;
};

type AIVideoProcessingState = {
  isProcessing: boolean;
  isPaused: boolean;
  currentIndex: number;
  totalCount: number;
  currentVideo: AIVideoQueueItem | null;
  lastUpdated: number;
};

type ExtensionLogLevel = 'debug' | 'info' | 'warn' | 'error';

type ExtensionLogEntry = {
  id: string;
  ts: number;
  level: ExtensionLogLevel;
  category: string;
  event: string;
  details?: Record<string, unknown>;
};

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
  private tabActiveChannels: Map<number, string> = new Map();
  private tabPausedChannels: Map<number, Set<string>> = new Map();
  private messageQueue: ProtocolMessage[] = [];
  private pendingPageAgents: Agent[] = []; // Queue for page agents waiting for connection
  private autoConnect: boolean = true; // Default to TRUE for agent operation
  private autoMonitor: boolean = true;
  private autoMasterClock: boolean = true;
  private autoWakePing: boolean = false;
  private lastAutonomyStartAt: number = 0;
  private lastWakePingAt: Map<string, number> = new Map();
  private channelLastActivityAt: Map<string, number> = new Map();
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
  private stallWatchdogTimer: number | null = null;
  private nativeHostUnavailable: boolean = false;
  private nativeHostMissingLogged: boolean = false;
  private extensionEventLog: ExtensionLogEntry[] = [];
  private readonly EVENT_LOG_LIMIT = 4000;
  private eventLogFlushTimer: number | null = null;
  private eventLoggingEnabled = true;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    console.log('[FuseConnect v7] Background service initializing...');

    // CRITICAL: Setup handlers SYNCHRONOUSLY before any awaits
    // This prevents "Receiving end does not exist" errors in the popup
    this.setupMessageHandlers();
    this.setupCommands();
    this.setupTabLifecycleHandlers();
    this.setupAlarmHandlers();

    // Get or create agent ID
    this.agentId = await this.getOrCreateAgentId();

    // Load saved state
    await this.loadSavedState();
    this.logEvent('extension', 'background_loaded_state', {
      channels: this.channels.size,
      joinedChannels: this.joinedChannels.size,
      tabChannelBindings: this.tabActiveChannels.size,
    });

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

    console.log('[FuseConnect v7] Background service ready');
    this.logEvent('extension', 'background_ready', {
      autoConnect: this.autoConnect,
      autoMonitor: this.autoMonitor,
      autoMasterClock: this.autoMasterClock,
      autoWakePing: this.autoWakePing,
    });
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
        console.log(`[FuseConnect v7] Cleaned up ${cleaned} stale message hashes`);
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
      console.log('[FuseConnect v7] Relay not available - attempting autonomous startup');
      this.updateNodeStatus('relay', DEFAULT_NODES.relay, 'disconnected');
      this.sendNativeMessage({ action: 'start', service: 'relay' }).then((nativeResp) => {
        if (nativeResp?.error) {
          return;
        }
        setTimeout(() => {
          this.connectionAttempts = 0;
          this.connectToNode('relay', DEFAULT_NODES.relay);
          this.ensureAutonomousServices('relay_auto_bootstrap');
        }, 3000);
      });
    }
  }

  /**
   * Check if relay is available via HTTP health endpoint
   */
  private async checkRelayHealth(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3000/health', {
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
      STORAGE_KEYS.tabActiveChannels,
      STORAGE_KEYS.knownNodes,
      STORAGE_KEYS.autoConnect,
      STORAGE_KEYS.autoMonitor,
      STORAGE_KEYS.autoMasterClock,
      STORAGE_KEYS.autoWakePing,
      STORAGE_KEYS.tabPausedChannels,
      STORAGE_KEYS.eventLog,
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
    if (result[STORAGE_KEYS.tabActiveChannels]) {
      const tabChannels = result[STORAGE_KEYS.tabActiveChannels] as Record<string, string>;
      for (const [tabId, channelId] of Object.entries(tabChannels)) {
        const parsedTabId = Number(tabId);
        if (Number.isFinite(parsedTabId) && channelId) {
          this.tabActiveChannels.set(parsedTabId, channelId);
        }
      }
    }
    if (result[STORAGE_KEYS.tabPausedChannels]) {
      const paused = result[STORAGE_KEYS.tabPausedChannels] as Record<string, string[]>;
      for (const [tabIdRaw, channelIds] of Object.entries(paused)) {
        const tabId = Number(tabIdRaw);
        if (!Number.isFinite(tabId) || !Array.isArray(channelIds)) continue;
        const set = new Set(
          channelIds.map((c) => String(c || '').trim()).filter((c) => c.length > 0)
        );
        if (set.size > 0) {
          this.tabPausedChannels.set(tabId, set);
        }
      }
    }
    if (Array.isArray(result[STORAGE_KEYS.eventLog])) {
      const existing = result[STORAGE_KEYS.eventLog] as ExtensionLogEntry[];
      this.extensionEventLog = existing.slice(-this.EVENT_LOG_LIMIT);
    }

    // Auto-join Red channel
    this.joinedChannels.add('red');

    // Load auto-connect preference (default true)
    this.autoConnect = result[STORAGE_KEYS.autoConnect] ?? true;
    this.autoMonitor = result[STORAGE_KEYS.autoMonitor] ?? true;
    this.autoMasterClock = result[STORAGE_KEYS.autoMasterClock] ?? true;
    this.autoWakePing = result[STORAGE_KEYS.autoWakePing] ?? false;

    // Also check settings object
    if (result[STORAGE_KEYS.settings]?.autoReconnect !== undefined) {
      this.autoConnect = result[STORAGE_KEYS.settings].autoReconnect;
    }
    if (result[STORAGE_KEYS.settings]?.autoMonitor !== undefined) {
      this.autoMonitor = !!result[STORAGE_KEYS.settings].autoMonitor;
    }
    if (result[STORAGE_KEYS.settings]?.autoMasterClock !== undefined) {
      this.autoMasterClock = !!result[STORAGE_KEYS.settings].autoMasterClock;
    }
    if (result[STORAGE_KEYS.settings]?.autoWakePing !== undefined) {
      this.autoWakePing = !!result[STORAGE_KEYS.settings].autoWakePing;
    }
  }

  /**
   * Connect to a specific node
   */
  private connectToNode(nodeType: NodeType, url: string): void {
    if (this.connections.has(nodeType)) {
      const existing = this.connections.get(nodeType);
      if (existing?.readyState === WebSocket.OPEN) {
        console.log(`[FuseConnect v7] Already connected to ${nodeType}`);
        return;
      }
      // Close stale connection
      existing?.close();
      this.connections.delete(nodeType);
    }

    console.log(`[FuseConnect v7] Connecting to ${nodeType} at ${url}...`);
    this.updateNodeStatus(nodeType, url, 'connecting');

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log(`[FuseConnect v7] Connected to ${nodeType}`);
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
        this.ensureAutonomousServices('relay_connected');

        // Flush queued messages
        this.flushMessageQueue();

        // Flush pending page agents
        this.flushPendingPageAgents();

        // RE-REGISTER ALL EXISTING AGENTS (Handles Relay Restart)
        this.reRegisterAllAgents(ws);

        // Request initial state
        this.requestSync(ws);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleRelayMessage(message, nodeType);
        } catch (e) {
          console.error('[FuseConnect v7] Failed to parse message:', e);
        }
      };

      ws.onclose = () => {
        console.log(`[FuseConnect v7] Disconnected from ${nodeType}`);
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
        if (nodeType === 'relay') {
          this.stopStallWatchdog();
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
      console.log(`[FuseConnect v7] Unable to connect to ${nodeType} - relay may not be running`);
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
    this.notifyPopup({
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
    console.log(`[FuseConnect v7] Will retry ${nodeType} in ${delay}ms...`);

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
  private registerPageAgent(id: string, name: string, platform: string, tabId?: number): void {
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
        tabId: tabId, // TRACK TAB ID
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
      console.log(`[FuseConnect v7] Registered Page Agent: ${name} (${id})`);

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
        console.log(`[FuseConnect v7] Auto-joined Page Agent ${id} to channel ${channelId}`);

        // Update local agent object
        agent.channels.push(channelId);
      }
    } else {
      // NOT CONNECTED: Queue for registration when connection is established
      console.log(`[FuseConnect v7] Queued Page Agent for later registration: ${name} (${id})`);
      this.pendingPageAgents.push(agent);
    }

    // 4. Notify all tabs about the new agent list
    this.broadcastToTabs({
      type: 'AGENTS_UPDATE',
      agents: Array.from(this.agents.values()),
    });
    this.frontloadPageAgentContext(agent);
    this.sendActivityEvent('page_agent_registered', {
      pageAgentId: id,
      tabId: tabId || null,
      platform,
      channels: agent.channels,
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
      console.log('[FuseConnect v7] Sent to relay:', message.type, message.channel);
    } else {
      this.messageQueue.push(message);
      console.log('[FuseConnect v7] Queued message (not connected):', message.type);
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
      `[FuseConnect v7] Flushing ${this.pendingPageAgents.length} pending page agent registrations`
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
        console.log(`[FuseConnect v7] Registered queued Page Agent: ${agent.name} (${agent.id})`);

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
   * Re-register all existing agents (called on reconnection)
   */
  private reRegisterAllAgents(ws: WebSocket): void {
    if (ws.readyState !== WebSocket.OPEN) return;

    console.log(
      `[FuseConnect v7] Re-registering ${this.agents.size} existing agents on new connection`
    );

    for (const [agentId, agent] of this.agents) {
      // Don't re-register the main browser agent (it's already done in registerAgent)
      if (agentId === this.agentId) continue;

      // Register the page agent
      const regMessage: ProtocolMessage = {
        id: crypto.randomUUID(),
        type: 'AGENT_REGISTER',
        timestamp: Date.now(),
        source: this.agentId, // Sent BY browser agent
        payload: { agent },
      };

      ws.send(JSON.stringify(regMessage));
      console.log(`[FuseConnect v7] Re-announced Page Agent: ${agent.name} (${agentId})`);

      // Re-join channels for this agent
      // Note: agent.channels should already contain the channels it was in
      if (agent.channels && agent.channels.length > 0) {
        for (const channelId of agent.channels) {
          const joinMessage: ProtocolMessage = {
            id: crypto.randomUUID(),
            type: 'CHANNEL_JOIN',
            timestamp: Date.now(),
            source: agentId,
            payload: { channelId },
          };
          ws.send(JSON.stringify(joinMessage));
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
          const tabId = agent.metadata?.tabId as number;

          if (tabId) {
            // VERIFY TAB STILL EXISTS
            chrome.tabs.get(tabId, (tab) => {
              if (chrome.runtime.lastError || !tab) {
                console.log(
                  `[FuseConnect v7] Tab ${tabId} for agent ${agentId} is gone. Removing.`
                );
                this.agents.delete(agentId);

                // Inform relay it's gone
                this.send({
                  type: 'AGENT_UNREGISTER',
                  agentId: agentId,
                });

                // Update everyone
                this.broadcastToTabs({
                  type: 'AGENTS_UPDATE',
                  agents: Array.from(this.agents.values()),
                });
                return;
              }

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
            });
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
    console.log(`[FuseConnect v7] Received from ${nodeType}:`, message.type);
    this.logEvent('relay', 'message_in', {
      nodeType,
      type: message.type,
      source: (message as any).source || null,
      channel: (message as any).channel || null,
    });

    switch (message.type) {
      case 'WELCOME':
        console.log('[FuseConnect v7] Welcome received');
        break;

      case 'AGENT_LIST': {
        const agents = (message.payload as any).agents || [];
        this.agents.clear();
        agents.forEach((a: Agent) => this.agents.set(a.id, a));
        this.broadcastToTabs({ type: 'AGENTS_UPDATE', agents });
        this.notifyPopup({ type: 'AGENTS_UPDATE', agents });
        break;
      }

      case 'AGENT_STATUS': {
        const agent = (message.payload as any).agent;
        if (agent) {
          // If agent is offline or unregistered, remove it
          if (
            agent.status === 'offline' ||
            agent.status === 'disconnected' ||
            agent.status === 'unregistered'
          ) {
            console.log(`[FuseConnect v7] Agent ${agent.id} went offline/removed`);
            this.agents.delete(agent.id);
          } else {
            // Keep local metadata (like tabId) if we're just updating status
            const existing = this.agents.get(agent.id);
            if (existing && existing.metadata?.tabId && !agent.metadata?.tabId) {
              agent.metadata = { ...agent.metadata, tabId: existing.metadata.tabId };
            }
            this.agents.set(agent.id, agent);
          }

          this.broadcastToTabs({ type: 'AGENTS_UPDATE', agents: Array.from(this.agents.values()) });
          this.notifyPopup({ type: 'AGENTS_UPDATE', agents: Array.from(this.agents.values()) });

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
      }

      case 'AGENT_UNREGISTER': {
        const unregId = (message.payload as any).agentId;
        if (unregId) {
          console.log(`[FuseConnect v7] UNREGISTER received for ${unregId}`);
          this.agents.delete(unregId);
          this.broadcastToTabs({
            type: 'AGENTS_UPDATE',
            agents: Array.from(this.agents.values()),
          });
          this.notifyPopup({
            type: 'AGENTS_UPDATE',
            agents: Array.from(this.agents.values()),
          });
        }
        break;
      }

      case 'CHANNEL_LIST': {
        const channels = (message.payload as any).channels || [];
        // Only update with new channels, do not clear locally saved ones if relay sends empty list
        if (channels.length > 0) {
          channels.forEach((ch: FederationChannel) => {
            const existingByName = this.findChannelByName(ch.name);
            if (existingByName && existingByName.id !== ch.id) {
              if (this.shouldPreferIncomingChannel(existingByName, ch)) {
                this.channels.delete(existingByName.id);
                this.remapChannelReferences(existingByName.id, ch.id);
              } else {
                return;
              }
            }

            this.channels.set(ch.id, ch);
          });
          this.broadcastToTabs({
            type: 'CHANNELS_UPDATE',
            channels: Array.from(this.channels.values()),
          });
          this.notifyPopup({
            type: 'CHANNELS_UPDATE',
            channels: Array.from(this.channels.values()),
          });
          this.saveChannels();
        }
        break;
      }

      case 'CHANNEL_MESSAGE':
      case 'MESSAGE_RECEIVE':
        const agentMessage = message.payload as AgentMessage;
        if (agentMessage?.channel) {
          this.channelLastActivityAt.set(agentMessage.channel, Date.now());
        }
        // best-effort transcript persistence at the edge
        this.appendTranscriptFromRelay(agentMessage);
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
        console.error('[FuseConnect v7] Relay error:', message.payload);
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

  private async appendTranscriptFromRelay(message: AgentMessage): Promise<void> {
    // Only persist messages from the NFT Alpha 1 channel (your requested test channel)
    // IMPORTANT: Relay uses channel ids (e.g. "channel-1770...") while UI shows channel names.
    const channelId = message.channel || '';
    const channelName = (this.channels.get(channelId) as any)?.name || '';

    const label = (channelName || channelId).toString();
    const isNftAlpha1 =
      label === 'NFT Alpha 1' ||
      label.toLowerCase() === 'nft-alpha-1' ||
      (label.toLowerCase().includes('nft') && label.toLowerCase().includes('alpha'));
    if (!isNftAlpha1) return;

    const role: TranscriptRole =
      message.type === 'system'
        ? 'system'
        : message.type === 'response'
          ? 'assistant'
          : message.type === 'command'
            ? 'tool'
            : 'user';

    const sessionKey = `relay:NFT Alpha 1`;

    const entry: TranscriptEntry = {
      id: simpleHash(
        `${sessionKey}|${message.id}|${message.from}|${message.to}|${message.timestamp}|${channelId}`
      ),
      ts: message.timestamp || Date.now(),
      role,
      content: message.content || '',
      meta: {
        source: 'tnf-relay',
        channelId,
        channelName,
        channel: label,
        from: message.from,
        to: message.to,
        msgType: message.type,
      },
    };

    if (!entry.content) return;

    try {
      const url = `${DEFAULT_NODES.tnfWorker}/transcript/append?sessionKey=${encodeURIComponent(sessionKey)}`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-Key': sessionKey },
        body: JSON.stringify({ entries: [entry] }),
      });
    } catch (e) {
      // best-effort; do not break UI
    }
  }

  /**
   * Handle incoming agent message
   */
  private handleAgentMessage(message: AgentMessage): void {
    // LOOP GUARD: burst-mute repeated identical payloads (prevents intro/handshake echo storms)
    // Keyed by (from, channel, prefix-of-content). If a source repeats >5 times in 10s, mute 60s.
    // This is defensive: even if an upstream agent loops, the browser bridge stays usable.
    try {
      const now = Date.now();
      const guard = (this as any).__loopGuard || {
        counts: new Map<string, { firstTs: number; n: number }>(),
        mutedUntil: new Map<string, number>(),
      };
      (this as any).__loopGuard = guard;

      const from = (message as any).from || '';
      const channel = (message as any).channel || '';
      const content = (message as any).content || '';
      const mutedUntil = guard.mutedUntil.get(from) || 0;
      if (mutedUntil && now < mutedUntil) {
        return;
      }

      const key = `${from}:${channel}:${content.slice(0, 280)}`;
      const rec = guard.counts.get(key) || { firstTs: now, n: 0 };
      if (now - rec.firstTs > 10000) {
        rec.firstTs = now;
        rec.n = 0;
      }
      rec.n += 1;
      guard.counts.set(key, rec);

      if (rec.n > 5) {
        guard.mutedUntil.set(from, now + 60000);
        console.warn('[FuseConnect v7] Loop guard muted source for 60s:', from);
        return;
      }
    } catch {
      // ignore
    }
    // CRITICAL: We need to handle 'own' messages if they are on a channel
    // because "Browser Agent" represents ALL windows/tabs.
    // If Window A sends a message, it goes to Relay -> Relay broadcasts to Channel -> Browser Agent receives it.
    // Browser Agent MUST forward this to Window B.

    // Only skip if it's a direct message to self not on a channel (which shouldn't happen much)
    // or if we rely strictly on content deduplication.

    if (message.from === this.agentId || message.from === 'Browser Agent') {
      if (!message.channel) {
        console.log('[FuseConnect v7] Skipping direct self-message echo');
        return;
      }

      // Check for duplication even for self-messages to prevent echo loops
      const msgHash = simpleHash(
        `${message.from}:${message.content}:${Math.floor(message.timestamp / 1000)}`
      );
      if (this.recentMessageHashes.has(msgHash)) {
        console.log('[FuseConnect v7] Skipping duplicate self-message on channel');
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
      console.log('[FuseConnect v7] Skipping duplicate message');
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
    this.notifyPopup({
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
      this.logEvent('chat', 'inject_active_tab', {
        tabId: tabs[0].id,
        preview: String(text || '').slice(0, 120),
      });
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'INJECT_MESSAGE',
        content: text,
      });
    }
  }

  /**
   * Inject message to a specific tab
   */
  private async injectMessageToTab(tabId: number, text: string): Promise<void> {
    this.logEvent('chat', 'inject_specific_tab', {
      tabId,
      preview: String(text || '').slice(0, 120),
    });
    chrome.tabs.sendMessage(tabId, {
      type: 'INJECT_MESSAGE',
      content: text,
    });
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
              console.warn(`[FuseConnect v7] Failed to broadcast to tab ${tab.id}:`, err);
            }
          });
        } catch (e) {
          // This catch block might not be reached for async sendMessage errors,
          // but good for synchronous ones.
        }
      }
    }
  }

  private notifyPopup(message: Record<string, unknown>): void {
    try {
      chrome.runtime.sendMessage(message, () => {
        void chrome.runtime.lastError;
      });
    } catch {
      // ignore when popup is closed
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
   * Save per-tab active channel selections
   */
  private async saveTabActiveChannels(): Promise<void> {
    const serialized: Record<string, string> = {};
    for (const [tabId, channelId] of this.tabActiveChannels.entries()) {
      if (channelId) {
        serialized[String(tabId)] = channelId;
      }
    }
    await chrome.storage.local.set({
      [STORAGE_KEYS.tabActiveChannels]: serialized,
    });
  }

  private async saveTabPausedChannels(): Promise<void> {
    const serialized: Record<string, string[]> = {};
    for (const [tabId, channels] of this.tabPausedChannels.entries()) {
      if (channels.size > 0) {
        serialized[String(tabId)] = Array.from(channels);
      }
    }
    await chrome.storage.local.set({
      [STORAGE_KEYS.tabPausedChannels]: serialized,
    });
  }

  private setChannelPaused(tabId: number, channelId: string, paused: boolean): void {
    if (!channelId) return;
    let set = this.tabPausedChannels.get(tabId);
    if (!set) {
      set = new Set<string>();
      this.tabPausedChannels.set(tabId, set);
    }
    if (paused) set.add(channelId);
    else set.delete(channelId);

    if (set.size === 0) {
      this.tabPausedChannels.delete(tabId);
    }

    void this.saveTabPausedChannels();
  }

  private getTabPausedChannels(tabId?: number): string[] {
    if (!tabId) return [];
    return Array.from(this.tabPausedChannels.get(tabId) || []);
  }

  private isChannelPausedOnTab(tabId: number, channelId?: string | null): boolean {
    if (!channelId) return false;
    return this.tabPausedChannels.get(tabId)?.has(channelId) || false;
  }

  /**
   * Track active channel selection per tab
   */
  private setTabActiveChannel(tabId: number, channelId: string | null): void {
    if (channelId) {
      this.tabActiveChannels.set(tabId, channelId);
    } else {
      this.tabActiveChannels.delete(tabId);
    }
    void this.saveTabActiveChannels();
  }

  private getTabActiveChannel(tabId?: number): string | null {
    if (!tabId) return null;
    return this.tabActiveChannels.get(tabId) || null;
  }

  private normalizeChannelName(name: string | undefined | null): string {
    return String(name || '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  private extractYouTubeUrls(text: string): string[] {
    const value = String(text || '');
    const matches =
      value.match(
        /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=[\w-]{11}[\w=&-]*|youtu\.be\/[\w-]{11}[\w?=&-]*)/gi
      ) || [];
    const unique = Array.from(new Set(matches.map((m) => m.trim())));
    return unique;
  }

  private toQueueItems(urls: string[]): AIVideoQueueItem[] {
    return urls.map((url, idx) => {
      const idMatch = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/i);
      const id = idMatch?.[1] || `vid-${Date.now()}-${idx}`;
      return {
        id,
        title: `YouTube Video ${id}`,
        url,
        addedAt: Date.now(),
      };
    });
  }

  private getDefaultProcessingState(): AIVideoProcessingState {
    return {
      isProcessing: false,
      isPaused: false,
      currentIndex: 0,
      totalCount: 0,
      currentVideo: null,
      lastUpdated: Date.now(),
    };
  }

  private setupAlarmHandlers(): void {
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === AI_VIDEO_PROCESS_ALARM) {
        void this.processAIVideoTick();
      }
    });
  }

  private async getYouTubeAuthToken(): Promise<string | null> {
    const stored = await chrome.storage.local.get(['ai_studio_token']);
    if (stored.ai_studio_token) return String(stored.ai_studio_token);

    return new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (chrome.runtime.lastError || !token) {
          resolve(null);
          return;
        }
        chrome.storage.local.set({ ai_studio_token: token });
        resolve(token);
      });
    });
  }

  private async youtubeApiGet(path: string, token: string): Promise<any> {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`YouTube API ${response.status}`);
    }
    return response.json();
  }

  private async fetchYouTubePlaylists(): Promise<Array<Record<string, unknown>>> {
    const token = await this.getYouTubeAuthToken();
    if (!token) throw new Error('Not authenticated');

    const data = await this.youtubeApiGet(
      'playlists?part=snippet,contentDetails&mine=true&maxResults=50',
      token
    );
    const items = Array.isArray(data?.items) ? data.items : [];
    return items.map((item: any) => ({
      id: String(item?.id || ''),
      title: String(item?.snippet?.title || 'Untitled Playlist'),
      description: String(item?.snippet?.description || ''),
      videoCount: Number(item?.contentDetails?.itemCount || 0),
      thumbnail: String(item?.snippet?.thumbnails?.medium?.url || ''),
    }));
  }

  private async fetchPlaylistVideos(playlistId: string): Promise<Array<Record<string, unknown>>> {
    const token = await this.getYouTubeAuthToken();
    if (!token) throw new Error('Not authenticated');
    if (!playlistId) throw new Error('Missing playlist id');

    const data = await this.youtubeApiGet(
      `playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(playlistId)}&maxResults=50`,
      token
    );
    const items = Array.isArray(data?.items) ? data.items : [];
    return items
      .map((item: any) => {
        const videoId = String(item?.contentDetails?.videoId || '').trim();
        if (!videoId) return null;
        return {
          id: videoId,
          title: String(item?.snippet?.title || `YouTube Video ${videoId}`),
          url: `https://www.youtube.com/watch?v=${videoId}`,
          channelTitle: String(item?.snippet?.videoOwnerChannelTitle || ''),
          thumbnail: String(item?.snippet?.thumbnails?.medium?.url || ''),
          addedAt: Date.now(),
        };
      })
      .filter(Boolean) as Array<Record<string, unknown>>;
  }

  private async processAIVideoTick(): Promise<void> {
    const result = await chrome.storage.local.get([
      'videoQueue',
      'processingState',
      'ai_video_processed_count',
      'ai_video_estimated_cost',
      'processingLevel',
    ]);

    const queue = Array.isArray(result.videoQueue) ? result.videoQueue : [];
    const processingState: AIVideoProcessingState =
      result.processingState || this.getDefaultProcessingState();

    if (!processingState.isProcessing || processingState.isPaused) return;

    if (processingState.currentIndex >= queue.length) {
      chrome.alarms.clear(AI_VIDEO_PROCESS_ALARM);
      const completedState: AIVideoProcessingState = {
        ...processingState,
        isProcessing: false,
        currentVideo: null,
        totalCount: queue.length,
        lastUpdated: Date.now(),
      };
      await chrome.storage.local.set({
        processingState: completedState,
      });
      this.broadcastToTabs({
        type: 'AI_VIDEO_PROCESSING_UPDATE',
        state: completedState,
      });
      this.logEvent('ai-video', 'processing_completed', { totalCount: queue.length });
      return;
    }

    const currentVideo = queue[processingState.currentIndex] || null;
    const nextIndex = processingState.currentIndex + 1;
    const level = String(result.processingLevel || 'ai_studio');
    const costByLevel: Record<string, number> = {
      metadata: 0,
      transcript: 0,
      flash: 0.001,
      pro: 0.01,
      vision: 0.03,
      ai_studio: 0,
    };
    const nextCost = Number(result.ai_video_estimated_cost || 0) + Number(costByLevel[level] || 0);
    const nextProcessed = Number(result.ai_video_processed_count || 0) + 1;
    const nextState: AIVideoProcessingState = {
      ...processingState,
      currentIndex: nextIndex,
      totalCount: queue.length,
      currentVideo: currentVideo as AIVideoQueueItem | null,
      lastUpdated: Date.now(),
    };

    await chrome.storage.local.set({
      processingState: nextState,
      ai_video_processed_count: nextProcessed,
      ai_video_total_count: queue.length,
      ai_video_estimated_cost: nextCost,
      ai_video_reports: [
        {
          id: `report-${Date.now()}-${currentVideo?.id || 'unknown'}`,
          videoId: String(currentVideo?.id || ''),
          title: String(currentVideo?.title || 'Processed Video'),
          url: String(currentVideo?.url || ''),
          processedAt: Date.now(),
          processingLevel: level,
          summary: `Processed via ${level}`,
        },
        ...((await chrome.storage.local.get(['ai_video_reports'])).ai_video_reports || []),
      ].slice(0, 500),
    });
    this.broadcastToTabs({
      type: 'AI_VIDEO_PROCESSING_UPDATE',
      state: nextState,
    });
  }

  private findChannelByName(name: string): FederationChannel | null {
    const target = this.normalizeChannelName(name);
    if (!target) return null;

    for (const channel of this.channels.values()) {
      if (this.normalizeChannelName(channel.name) === target) {
        return channel;
      }
    }
    return null;
  }

  private remapChannelReferences(oldId: string, newId: string): void {
    if (!oldId || !newId || oldId === newId) return;

    if (this.joinedChannels.delete(oldId)) {
      this.joinedChannels.add(newId);
    }

    for (const [tabId, channelId] of this.tabActiveChannels.entries()) {
      if (channelId === oldId) {
        this.tabActiveChannels.set(tabId, newId);
        chrome.tabs.sendMessage(tabId, { type: 'CHANNEL_SELECTED', channelId: newId });
      }
    }

    void this.saveTabActiveChannels();
  }

  private shouldPreferIncomingChannel(
    existingChannel: FederationChannel,
    incomingChannel: FederationChannel
  ): boolean {
    const existingIsLocal = existingChannel.id.startsWith('local-');
    const incomingIsLocal = incomingChannel.id.startsWith('local-');

    if (existingIsLocal !== incomingIsLocal) {
      return !incomingIsLocal;
    }

    const existingCreated = Number(existingChannel.createdAt || 0);
    const incomingCreated = Number(incomingChannel.createdAt || 0);
    return incomingCreated >= existingCreated;
  }

  /**
   * Clear tab-scoped state when tabs are closed
   */
  private setupTabLifecycleHandlers(): void {
    chrome.tabs.onCreated.addListener((tab) => {
      this.logEvent('browser.tabs', 'created', {
        tabId: tab.id || null,
        url: tab.url || null,
        active: !!tab.active,
      });
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (!changeInfo.status && !changeInfo.url) return;
      this.logEvent('browser.tabs', 'updated', {
        tabId,
        status: changeInfo.status || null,
        url: changeInfo.url || tab.url || null,
      });
    });

    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.logEvent('browser.tabs', 'activated', {
        tabId: activeInfo.tabId,
        windowId: activeInfo.windowId,
      });
    });

    chrome.tabs.onRemoved.addListener((tabId) => {
      if (this.tabActiveChannels.delete(tabId)) {
        void this.saveTabActiveChannels();
      }
      if (this.tabPausedChannels.delete(tabId)) {
        void this.saveTabPausedChannels();
      }
      this.logEvent('browser.tabs', 'removed', { tabId });
    });
  }

  private logEvent(
    category: string,
    event: string,
    details: Record<string, unknown> = {},
    level: ExtensionLogLevel = 'info'
  ): void {
    if (!this.eventLoggingEnabled) return;

    const entry: ExtensionLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ts: Date.now(),
      level,
      category,
      event,
      details,
    };

    this.extensionEventLog.push(entry);
    if (this.extensionEventLog.length > this.EVENT_LOG_LIMIT) {
      this.extensionEventLog = this.extensionEventLog.slice(
        this.extensionEventLog.length - this.EVENT_LOG_LIMIT
      );
    }

    if (this.eventLogFlushTimer) {
      clearTimeout(this.eventLogFlushTimer);
    }
    this.eventLogFlushTimer = setTimeout(() => {
      chrome.storage.local.set({ [STORAGE_KEYS.eventLog]: this.extensionEventLog });
      this.eventLogFlushTimer = null;
    }, 750) as unknown as number;
  }

  /**
   * Send native message to control services
   */
  private async sendNativeMessage(message: Record<string, unknown>): Promise<any> {
    if (this.nativeHostUnavailable) {
      return {
        error: 'Specified native messaging host not found',
        unavailable: true,
      };
    }

    console.log('[NativeMessaging] Sending:', message.action, message.service || '');
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendNativeMessage(NATIVE_HOST_NAME, message, (response) => {
          if (chrome.runtime.lastError) {
            const errMsg = chrome.runtime.lastError.message || 'Native messaging error';
            const hostMissing =
              errMsg.includes('Specified native messaging host not found') ||
              errMsg.includes('No such native application');

            if (hostMissing) {
              this.nativeHostUnavailable = true;
              if (!this.nativeHostMissingLogged) {
                this.nativeHostMissingLogged = true;
                console.warn(
                  '[NativeMessaging] Native host not installed; native service controls disabled'
                );
              }
            } else {
              console.error('[NativeMessaging] Error:', errMsg);
            }

            resolve({ error: errMsg, unavailable: hostMissing });
          } else {
            resolve(response || {});
          }
        });
      } catch (e) {
        console.error('[NativeMessaging] Exception:', e);
        resolve({ error: 'Native messaging not available' });
      }
    });
  }

  private async sendActivityEvent(
    eventType: string,
    metadata: Record<string, unknown> = {},
    channel = 'fuse-activity-log'
  ): Promise<void> {
    this.send({
      type: 'MESSAGE_SEND',
      to: 'broadcast',
      channel,
      content: `[ACTIVITY] ${eventType}`,
      messageType: 'event',
      metadata: {
        senderId: this.agentId,
        eventType,
        ts: Date.now(),
        ...metadata,
      },
    });
  }

  private async ensureAutonomousServices(reason: string): Promise<void> {
    const sinceLastStart = Date.now() - this.lastAutonomyStartAt;
    if (sinceLastStart < 15000) {
      return;
    }
    this.lastAutonomyStartAt = Date.now();

    if (this.autoMonitor) {
      await this.sendNativeMessage({ action: 'start', service: 'monitor' });
    }
    if (this.autoMasterClock) {
      await this.sendNativeMessage({ action: 'start', service: 'masterClock' });
    }

    this.startStallWatchdog();
    this.sendActivityEvent('autonomy_services_ensured', {
      reason,
      autoMonitor: this.autoMonitor,
      autoMasterClock: this.autoMasterClock,
      autoWakePing: this.autoWakePing,
    });
  }

  private startStallWatchdog(): void {
    if (this.stallWatchdogTimer || !this.autoWakePing) {
      return;
    }

    this.stallWatchdogTimer = setInterval(() => {
      if (!this.primaryConnection || this.primaryConnection.readyState !== WebSocket.OPEN) {
        return;
      }
      const now = Date.now();
      for (const [channelId] of this.channels) {
        if (!this.joinedChannels.has(channelId)) {
          continue;
        }
        const lastActivity = this.channelLastActivityAt.get(channelId) || 0;
        // Never originate a wake ping in a channel that has not had actual conversation activity yet.
        if (!lastActivity) {
          continue;
        }
        if (lastActivity && now - lastActivity < 90000) {
          continue;
        }
        const last = this.lastWakePingAt.get(channelId) || 0;
        if (now - last < 120000) {
          continue;
        }

        const pingId = `wake-${channelId}-${now}`;
        this.lastWakePingAt.set(channelId, now);
        this.send({
          type: 'MESSAGE_SEND',
          to: 'broadcast',
          channel: channelId,
          content: `[WAKE_PING ${pingId}] Stall check from browser orchestrator`,
          messageType: 'event',
          metadata: {
            senderId: this.agentId,
            eventType: 'wake_ping',
            pingId,
            reason: 'stall-watchdog',
          },
        });
        this.sendActivityEvent('wake_ping_sent', { pingId, channelId, reason: 'stall-watchdog' });
      }
    }, 30000) as unknown as number;
  }

  private stopStallWatchdog(): void {
    if (this.stallWatchdogTimer) {
      clearInterval(this.stallWatchdogTimer);
      this.stallWatchdogTimer = null;
    }
  }

  private frontloadPageAgentContext(agent: Agent): void {
    if (!agent.metadata?.tabId) {
      return;
    }
    const joinedChannels = Array.from(this.joinedChannels);
    chrome.tabs.sendMessage(agent.metadata.tabId as number, {
      type: 'FUSE_ONBOARDING_CONTEXT',
      payload: {
        browserAgentId: this.agentId,
        pageAgentId: agent.id,
        channels: joinedChannels,
        knownAgents: Array.from(this.agents.values()).map((a) => ({
          id: a.id,
          name: a.name,
          platform: a.platform,
          status: a.status,
        })),
        capabilities: agent.capabilities || [],
        relayUrl: DEFAULT_NODES.relay,
        policy: {
          heartbeat: true,
          wakePing: this.autoWakePing,
          autonomous: true,
        },
      },
    });
  }

  /**
   * Setup message handlers from popup/content
   */
  private setupMessageHandlers(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      const messageType = String(message?.type || 'unknown');
      if (!['GET_EVENT_LOGS', 'GET_STATE', 'PING'].includes(messageType)) {
        this.logEvent('extension.message', 'runtime_inbound', {
          type: messageType,
          tabId: sender.tab?.id ?? null,
          tabUrl: sender.tab?.url ?? null,
        });
      }

      switch (message.type) {
        case 'TEST_PING':
          console.log('[FuseConnect v7] Received TEST_PING');
          sendResponse({
            success: true,
            status: 'online',
            version: '7.0.0',
            timestamp: Date.now(),
          });
          break;

        case 'PING':
          sendResponse({ success: true, pong: true });
          break;

        case 'CONNECT':
          this.connectionAttempts = 0;
          this.connectToNode('relay', message.url || DEFAULT_NODES.relay);
          sendResponse({ success: true });
          break;

        case 'DISCONNECT':
          this.disconnectAll();
          sendResponse({ success: true });
          break;

        case 'GET_STATE': {
          // Find the page agent for this tab if it exists
          let tabPageAgentId = null;
          if (sender.tab?.id) {
            for (const [id, agent] of this.agents) {
              if (agent.metadata?.tabId === sender.tab.id) {
                tabPageAgentId = id;
                break;
              }
            }
          }

          sendResponse({
            connectionStatus:
              this.primaryConnection?.readyState === WebSocket.OPEN ? 'connected' : 'disconnected',
            agents: Array.from(this.agents.values()),
            channels: Array.from(this.channels.values()),
            joinedChannels: Array.from(this.joinedChannels),
            selectedChannel: this.getTabActiveChannel(sender.tab?.id),
            tabId: sender.tab?.id ?? null,
            nodes: Object.fromEntries(this.nodeStatus),
            agentId: tabPageAgentId || this.agentId, // Use page-specific ID if available
            browserAgentId: this.agentId,
            autoConnect: this.autoConnect,
            autoMonitor: this.autoMonitor,
            autoMasterClock: this.autoMasterClock,
            autoWakePing: this.autoWakePing,
            pausedChannels: this.getTabPausedChannels(sender.tab?.id),
          });
          break;
        }

        case 'GET_EVENT_LOGS': {
          const limit = Math.max(1, Math.min(5000, Number(message.limit || 500)));
          const category = message.category ? String(message.category) : null;
          const level = message.level ? String(message.level) : null;
          const items = this.extensionEventLog.filter((item) => {
            if (category && item.category !== category) return false;
            if (level && item.level !== level) return false;
            return true;
          });
          sendResponse({
            success: true,
            total: items.length,
            logs: items.slice(-limit),
          });
          break;
        }

        case 'CLEAR_EVENT_LOGS':
          this.extensionEventLog = [];
          chrome.storage.local.set({ [STORAGE_KEYS.eventLog]: [] });
          sendResponse({ success: true });
          break;

        case 'SET_EVENT_LOGGING':
          this.eventLoggingEnabled = !!message.enabled;
          this.logEvent('extension', 'event_logging_toggle', {
            enabled: this.eventLoggingEnabled,
          });
          sendResponse({ success: true, enabled: this.eventLoggingEnabled });
          break;

        case 'SET_AUTO_CONNECT':
          this.autoConnect = message.enabled;
          chrome.storage.local.set({ [STORAGE_KEYS.autoConnect]: message.enabled });
          sendResponse({ success: true });
          break;

        case 'SET_AUTONOMY_SETTINGS':
          if (message.autoMonitor !== undefined) {
            this.autoMonitor = !!message.autoMonitor;
          }
          if (message.autoMasterClock !== undefined) {
            this.autoMasterClock = !!message.autoMasterClock;
          }
          if (message.autoWakePing !== undefined) {
            this.autoWakePing = !!message.autoWakePing;
          }
          chrome.storage.local.set({
            [STORAGE_KEYS.autoMonitor]: this.autoMonitor,
            [STORAGE_KEYS.autoMasterClock]: this.autoMasterClock,
            [STORAGE_KEYS.autoWakePing]: this.autoWakePing,
          });
          if (this.autoWakePing) {
            this.startStallWatchdog();
          } else {
            this.stopStallWatchdog();
          }
          sendResponse({ success: true });
          break;

        case 'START_AUTONOMY':
          this.ensureAutonomousServices('manual_start').then(() => sendResponse({ success: true }));
          return true;

        case 'STOP_AUTONOMY':
          this.stopStallWatchdog();
          Promise.all([
            this.sendNativeMessage({ action: 'stop', service: 'monitor' }),
            this.sendNativeMessage({ action: 'stop', service: 'masterClock' }),
          ]).then(() => sendResponse({ success: true }));
          return true;

        case 'GET_AUTONOMY_STATUS':
          this.sendNativeMessage({ action: 'status' }).then((status) => {
            sendResponse({
              success: true,
              settings: {
                autoMonitor: this.autoMonitor,
                autoMasterClock: this.autoMasterClock,
                autoWakePing: this.autoWakePing,
              },
              monitor: status?.services?.monitor || null,
              masterClock: status?.services?.masterClock || null,
              relay: status?.services?.relay || null,
            });
          });
          return true;

        case 'START_RELAY':
          // Start relay via native messaging
          this.sendNativeMessage({ action: 'start', service: 'relay' }).then((response) => {
            sendResponse(response);
            // Try to connect after a short delay
            if (response.result?.success || !response.error) {
              setTimeout(() => {
                this.connectionAttempts = 0;
                this.connectToNode('relay', DEFAULT_NODES.relay);
                this.ensureAutonomousServices('relay_started');
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
          this.fetchYouTubePlaylists()
            .then((playlists) => {
              sendResponse({ success: true, playlists });
            })
            .catch((error) => {
              sendResponse({ success: false, error: String(error?.message || error) });
            });
          return true;

        case 'AI_STUDIO_PROCESS_VIDEO':
          // Queue video for processing
          chrome.storage.local.get(['videoQueue'], (result) => {
            const queue = Array.isArray(result.videoQueue) ? result.videoQueue : [];
            if (message.video?.url) {
              queue.push({
                id: message.video?.id || `vid-${Date.now()}`,
                title: message.video?.title || 'YouTube Video',
                url: message.video.url,
                addedAt: Date.now(),
              });
            }
            chrome.storage.local.set({ videoQueue: queue, syncTimestamp: Date.now() });
            sendResponse({ success: true, queueLength: queue.length });
          });
          return true;

        case 'AI_STUDIO_GET_PLAYLIST_VIDEOS': {
          const playlistId = String(message.playlistId || '');
          this.fetchPlaylistVideos(playlistId)
            .then((videos) => {
              sendResponse({ success: true, videos });
            })
            .catch((error) => {
              sendResponse({ success: false, error: String(error?.message || error) });
            });
          return true;
        }

        case 'AI_VIDEO_GET_STATS':
          chrome.storage.local.get(
            [
              'ai_video_processed_count',
              'ai_video_total_count',
              'ai_video_estimated_cost',
              'ai_studio_token',
              'videoQueue',
            ],
            (result) => {
              sendResponse({
                processed: result.ai_video_processed_count || 0,
                total: result.ai_video_total_count || result.videoQueue?.length || 0,
                cost: result.ai_video_estimated_cost || 0,
                account: result.ai_studio_token ? 'Authenticated' : 'None',
              });
            }
          );
          return true;

        case 'AI_VIDEO_GET_QUEUE':
          chrome.storage.local.get(
            ['videoQueue', 'reverseOrder', 'segmentDuration', 'processingState', 'syncTimestamp'],
            (result) => {
              const queue = Array.isArray(result.videoQueue) ? result.videoQueue : [];
              const processingState = result.processingState || null;
              sendResponse({
                success: true,
                queueCount: queue.length,
                queue,
                reverseOrder: !!result.reverseOrder,
                segmentDuration: Number(result.segmentDuration || 45),
                processingState,
                syncTimestamp: result.syncTimestamp || null,
              });
            }
          );
          return true;

        case 'AI_VIDEO_SET_QUEUE': {
          const rawText = String(message.text || '');
          const urls =
            Array.isArray(message.urls) && message.urls.length > 0
              ? message.urls.map((u: unknown) => String(u))
              : this.extractYouTubeUrls(rawText);
          const queue = this.toQueueItems(urls);
          chrome.storage.local.set(
            {
              videoQueue: queue,
              syncTimestamp: Date.now(),
            },
            () => {
              this.logEvent('ai-video', 'queue_set', {
                count: queue.length,
              });
              sendResponse({
                success: true,
                queueCount: queue.length,
              });
            }
          );
          return true;
        }

        case 'AI_VIDEO_CLEAR_QUEUE':
          chrome.storage.local.set(
            {
              videoQueue: [],
              processingState: {
                isProcessing: false,
                isPaused: false,
                currentIndex: 0,
                totalCount: 0,
                currentVideo: null,
                lastUpdated: Date.now(),
              },
              syncTimestamp: Date.now(),
            },
            () => {
              this.logEvent('ai-video', 'queue_cleared');
              sendResponse({ success: true });
            }
          );
          return true;

        case 'AI_VIDEO_SET_PREFERENCES': {
          const reverseOrder = !!message.reverseOrder;
          const segmentDuration = Math.max(5, Math.min(300, Number(message.segmentDuration || 45)));
          const processingLevel = String(message.processingLevel || 'ai_studio');
          chrome.storage.local.set(
            {
              reverseOrder,
              segmentDuration,
              processingLevel,
            },
            () => {
              this.logEvent('ai-video', 'preferences_set', {
                reverseOrder,
                segmentDuration,
                processingLevel,
              });
              sendResponse({ success: true });
            }
          );
          return true;
        }

        case 'AI_VIDEO_PROCESS_CONTROL': {
          const action = String(message.action || '').toLowerCase();
          chrome.storage.local.get(['videoQueue', 'processingState'], (result) => {
            const queue = Array.isArray(result.videoQueue) ? result.videoQueue : [];
            const currentState: AIVideoProcessingState =
              result.processingState || this.getDefaultProcessingState();

            if (action === 'start') {
              if (queue.length === 0) {
                sendResponse({ success: false, error: 'Queue is empty' });
                return;
              }
              const nextState: AIVideoProcessingState = {
                isProcessing: true,
                isPaused: false,
                currentIndex: 0,
                totalCount: queue.length,
                currentVideo: null,
                lastUpdated: Date.now(),
              };
              chrome.storage.local.set(
                {
                  processingState: nextState,
                  ai_video_total_count: queue.length,
                },
                () => {
                  chrome.alarms.create(AI_VIDEO_PROCESS_ALARM, {
                    periodInMinutes: 0.1,
                  });
                  this.logEvent('ai-video', 'processing_started', { totalCount: queue.length });
                  this.broadcastToTabs({ type: 'AI_VIDEO_PROCESSING_UPDATE', state: nextState });
                  sendResponse({ success: true, state: nextState });
                }
              );
              return;
            }

            if (action === 'pause') {
              const nextState: AIVideoProcessingState = {
                ...currentState,
                isProcessing: currentState.isProcessing,
                isPaused: true,
                lastUpdated: Date.now(),
              };
              chrome.storage.local.set({ processingState: nextState }, () => {
                chrome.alarms.clear(AI_VIDEO_PROCESS_ALARM);
                this.logEvent('ai-video', 'processing_paused', {
                  currentIndex: nextState.currentIndex,
                });
                this.broadcastToTabs({ type: 'AI_VIDEO_PROCESSING_UPDATE', state: nextState });
                sendResponse({ success: true, state: nextState });
              });
              return;
            }

            if (action === 'resume') {
              if (!currentState.isProcessing) {
                sendResponse({ success: false, error: 'Processing is not running' });
                return;
              }
              const nextState: AIVideoProcessingState = {
                ...currentState,
                isPaused: false,
                lastUpdated: Date.now(),
              };
              chrome.storage.local.set({ processingState: nextState }, () => {
                chrome.alarms.create(AI_VIDEO_PROCESS_ALARM, {
                  periodInMinutes: 0.1,
                });
                this.logEvent('ai-video', 'processing_resumed', {
                  currentIndex: nextState.currentIndex,
                });
                this.broadcastToTabs({ type: 'AI_VIDEO_PROCESSING_UPDATE', state: nextState });
                sendResponse({ success: true, state: nextState });
              });
              return;
            }

            if (action === 'stop') {
              const nextState: AIVideoProcessingState = {
                ...currentState,
                isProcessing: false,
                isPaused: false,
                currentVideo: null,
                lastUpdated: Date.now(),
              };
              chrome.storage.local.set({ processingState: nextState }, () => {
                chrome.alarms.clear(AI_VIDEO_PROCESS_ALARM);
                this.logEvent('ai-video', 'processing_stopped', {
                  currentIndex: nextState.currentIndex,
                });
                this.broadcastToTabs({ type: 'AI_VIDEO_PROCESSING_UPDATE', state: nextState });
                sendResponse({ success: true, state: nextState });
              });
              return;
            }

            sendResponse({ success: false, error: `Unknown processing action: ${action}` });
          });
          return true;
        }

        case 'AI_VIDEO_OPEN_PAGE': {
          const page = String(message.page || 'ai-studio');
          const pageUrl =
            page === 'notebooklm'
              ? 'https://notebooklm.google.com/'
              : page === 'dashboard'
                ? 'https://aivideointel.thenewfuse.com/'
                : 'https://aistudio.google.com/';
          chrome.tabs.create({ url: pageUrl }, () => {
            this.logEvent('ai-video', 'open_page', { page, pageUrl });
            sendResponse({ success: true, pageUrl });
          });
          return true;
        }

        case 'AI_VIDEO_GENERATE_HISTORY_PROMPT':
          const historyPrompt = `Using your Personal Intelligence access to my YouTube watch history,
provide my last 50 watched videos.

Filter out political content.

Format as JSON array:
[
  {
    "title": "Video Title",
    "url": "https://www.youtube.com/watch?v=...",
    "channel": "Channel Name",
    "description": "Brief description"
  }
]`;
          sendResponse({ prompt: historyPrompt });
          break;

        case 'AI_VIDEO_EXPORT':
          chrome.storage.local.get(
            ['videoQueue', 'ai_studio_queue', 'ai_video_reports'],
            (result) => {
              let content = '';
              const format = String(message.format || 'urls');
              if (format === 'reports-md') {
                const reports = Array.isArray(result.ai_video_reports)
                  ? result.ai_video_reports
                  : [];
                content = reports
                  .map(
                    (r: any) =>
                      `## ${String(r.title || 'Untitled')}\n\n- URL: ${String(r.url || '')}\n- Processed: ${new Date(Number(r.processedAt || Date.now())).toISOString()}\n- Level: ${String(r.processingLevel || 'ai_studio')}\n\n${String(r.summary || '')}\n`
                  )
                  .join('\n');
              } else if (format === 'urls') {
                content = (result.videoQueue || []).map((v: any) => v.url).join('\n');
              } else {
                content = JSON.stringify(result.videoQueue || [], null, 2);
              }
              sendResponse({ content });
            }
          );
          return true;

        case 'AI_VIDEO_GET_HISTORY':
          chrome.storage.local.get(['ai_video_reports'], (result) => {
            const reports = Array.isArray(result.ai_video_reports) ? result.ai_video_reports : [];
            sendResponse({ success: true, reports });
          });
          return true;

        case 'AI_VIDEO_CLEAR_HISTORY':
          chrome.storage.local.set({ ai_video_reports: [] }, () => {
            this.logEvent('ai-video', 'history_cleared');
            sendResponse({ success: true });
          });
          return true;

        case 'TASK_COMPLETE':
          if (message.taskType === 'PROCESS_SEGMENT' && message.success) {
            chrome.storage.local.get(['ai_video_processed_count'], (result) => {
              const current = result.ai_video_processed_count || 0;
              chrome.storage.local.set({ ai_video_processed_count: current + 1 });
            });
          }
          this.broadcastToTabs(message);
          sendResponse({ success: true });
          break;

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
          this.sendActivityEvent('broadcast_message', {
            channel: message.channel || null,
            senderId: message.senderId || message.metadata?.senderId || null,
            contentPreview: String(message.content || '').substring(0, 120),
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

        case 'CHANNEL_CREATE': {
          const trimmedName = String(message.name || '')
            .trim()
            .replace(/\s+/g, ' ');
          if (!trimmedName) {
            sendResponse({ success: false, error: 'Channel name is required' });
            break;
          }

          const existingChannel = this.findChannelByName(trimmedName);
          if (existingChannel) {
            sendResponse({
              success: false,
              alreadyExists: true,
              error: `Channel "${existingChannel.name}" already exists`,
              channel: existingChannel,
            });
            break;
          }

          // Optimistically create channel locally
          const newChannel: FederationChannel = {
            id: `local-${Date.now()}`,
            name: trimmedName,
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
          this.notifyPopup({
            type: 'CHANNELS_UPDATE',
            channels: Array.from(this.channels.values()),
          });
          this.saveChannels();

          // Forward to Relay
          this.send({
            type: 'CHANNEL_CREATE',
            name: trimmedName,
            description: message.description,
            isPrivate: message.isPrivate || false,
          });
          this.sendActivityEvent('channel_create', {
            channelId: newChannel.id,
            name: trimmedName,
          });
          sendResponse({ success: true, channel: newChannel });
          break;
        }

        case 'CHANNEL_JOIN':
          this.joinedChannels.add(message.channelId);
          if (sender.tab?.id) {
            this.setTabActiveChannel(sender.tab.id, message.channelId);
            chrome.tabs.sendMessage(sender.tab.id, {
              type: 'CHANNEL_SELECTED',
              channelId: message.channelId,
            });
          }
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
          this.notifyPopup({
            type: 'JOINED_CHANNELS_UPDATE',
            joinedChannels: Array.from(this.joinedChannels),
          });
          this.sendActivityEvent('channel_join', { channelId: message.channelId });
          this.logEvent('channel', 'join', {
            tabId: sender.tab?.id ?? null,
            channelId: message.channelId,
          });
          sendResponse({ success: true });
          break;

        case 'CHANNEL_LEAVE':
          this.joinedChannels.delete(message.channelId);
          if (sender.tab?.id) {
            this.setTabActiveChannel(sender.tab.id, null);
            chrome.tabs.sendMessage(sender.tab.id, {
              type: 'CHANNEL_SELECTED',
              channelId: null,
            });
          }
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
          this.notifyPopup({
            type: 'JOINED_CHANNELS_UPDATE',
            joinedChannels: Array.from(this.joinedChannels),
          });
          this.sendActivityEvent('channel_leave', { channelId: message.channelId });
          this.logEvent('channel', 'leave', {
            tabId: sender.tab?.id ?? null,
            channelId: message.channelId,
          });
          sendResponse({ success: true });
          break;

        case 'CHANNEL_PAUSE': {
          if (!sender.tab?.id) {
            sendResponse({ success: false, error: 'Missing sender tab' });
            break;
          }
          const channelId = String(message.channelId || '');
          this.setChannelPaused(sender.tab.id, channelId, true);
          this.logEvent('channel', 'pause', { tabId: sender.tab.id, channelId });
          chrome.tabs.sendMessage(
            sender.tab.id,
            {
              type: 'CHANNEL_PAUSE_UPDATE',
              channelId,
              paused: true,
              pausedChannels: this.getTabPausedChannels(sender.tab.id),
            },
            () => {
              const err = chrome.runtime.lastError;
              if (err) {
                this.logEvent('channel', 'pause_update_delivery_error', {
                  tabId: sender.tab?.id ?? null,
                  channelId,
                  error: err.message,
                });
              }
              sendResponse({ success: true, delivered: !err });
            }
          );
          return true;
        }

        case 'CHANNEL_RESUME': {
          if (!sender.tab?.id) {
            sendResponse({ success: false, error: 'Missing sender tab' });
            break;
          }
          const channelId = String(message.channelId || '');
          this.setChannelPaused(sender.tab.id, channelId, false);
          this.logEvent('channel', 'resume', { tabId: sender.tab.id, channelId });
          chrome.tabs.sendMessage(
            sender.tab.id,
            {
              type: 'CHANNEL_PAUSE_UPDATE',
              channelId,
              paused: false,
              pausedChannels: this.getTabPausedChannels(sender.tab.id),
            },
            () => {
              const err = chrome.runtime.lastError;
              if (err) {
                this.logEvent('channel', 'resume_update_delivery_error', {
                  tabId: sender.tab?.id ?? null,
                  channelId,
                  error: err.message,
                });
              }
              sendResponse({ success: true, delivered: !err });
            }
          );
          return true;
        }

        case 'CHANNEL_DELETE': {
          const channelIdToDelete = message.channelId;
          if (channelIdToDelete === 'general') {
            sendResponse({ success: false, error: 'Cannot delete general channel' });
            break;
          }
          this.channels.delete(channelIdToDelete);
          this.joinedChannels.delete(channelIdToDelete);
          this.broadcastToTabs({
            type: 'CHANNELS_UPDATE',
            channels: Array.from(this.channels.values()),
          });
          this.notifyPopup({
            type: 'CHANNELS_UPDATE',
            channels: Array.from(this.channels.values()),
          });
          this.saveChannels();
          this.send({
            type: 'CHANNEL_DELETE',
            channelId: channelIdToDelete,
          });
          this.sendActivityEvent('channel_delete', { channelId: channelIdToDelete });
          sendResponse({ success: true });
          break;
        }

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

            chrome.tabs.sendMessage(sender.tab.id, {
              type: 'CHANNEL_SELECTED',
              channelId: this.getTabActiveChannel(sender.tab.id),
            });
            chrome.tabs.sendMessage(sender.tab.id, {
              type: 'CHANNEL_PAUSE_UPDATE',
              pausedChannels: this.getTabPausedChannels(sender.tab.id),
            });
          }
          this.logEvent('extension', 'content_script_ready', {
            tabId: sender.tab?.id ?? null,
            url: sender.tab?.url ?? null,
          });
          sendResponse({ success: true });
          break;

        case 'TOGGLE_PANEL':
          this.broadcastToTabs({ type: 'TOGGLE_PANEL' });
          sendResponse({ success: true });
          break;

        case 'ACTIVATE_ON_TAB': {
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
                  console.log(`[FuseConnect v7] Content script injected into tab ${tabs[0].id}`);

                  // Wait a moment for initialization, then show panel
                  setTimeout(() => {
                    if (tabs[0]?.id) {
                      chrome.tabs.sendMessage(tabs[0].id, { type: 'SHOW_PANEL' });
                    }
                  }, 500);

                  sendResponse({ success: true, injected: true });
                }
              } catch (error: any) {
                console.error('[FuseConnect v7] Failed to activate on tab:', error);
                sendResponse({ success: false, error: error.message });
              }
            } else {
              sendResponse({ success: false, error: 'No active tab found' });
            }
          });
          return true; // Async response
        }

        case 'REQUEST_SYNC':
          if (this.primaryConnection) {
            this.requestSync(this.primaryConnection);
          }
          sendResponse({ success: true });
          break;

        case 'DISCOVER_AGENTS':
          if (this.primaryConnection) {
            this.send({ type: 'AGENT_LIST' });
            this.send({ type: 'CHANNEL_LIST' });
          }
          sendResponse({ success: true });
          break;

        case 'ACTIVITY_EVENT':
          this.sendActivityEvent(message.eventType || 'unknown', {
            channel: message.channel || null,
            senderId: message.senderId || null,
            ...(message.metadata || {}),
          });
          sendResponse({ success: true });
          break;

        case 'INJECT_MESSAGE':
          // Prefer sender tab (content-script originated requests) so we inject
          // into the exact page where the modal input was typed.
          // Fallback to active tab for popup-originated requests.
          (sender.tab?.id
            ? this.injectMessageToTab(sender.tab.id, message.content)
            : this.injectMessageToActiveTab(message.content)
          )
            .then(() => {
              this.logEvent('chat', 'inject_message', {
                tabId: sender.tab?.id ?? null,
                preview: String(message.content || '').slice(0, 120),
              });
              sendResponse({ success: true });
            })
            .catch((error) => {
              console.error('[FuseConnect v7] Error injecting message:', error);
              sendResponse({ success: false, error: error.message });
            });
          return true; // Async response

        case 'GET_LAST_RESPONSE':
          // Forward to active tab and return the response
          this.getLastResponseFromActiveTab().then((response) => {
            sendResponse({ response });
          });
          return true; // Async response

        case 'CHAT_DETECTED': {
          // 1. Register this tab as a distinct Agent
          if (sender.tab?.id) {
            // REUSE existing agent ID for this tab if it exists
            let pageAgentId = null;
            for (const [id, agent] of this.agents) {
              if (agent.metadata?.tabId === sender.tab.id) {
                pageAgentId = id;
                break;
              }
            }

            if (!pageAgentId) {
              pageAgentId = `page-agent-${sender.tab.id}-${Math.random().toString(36).substr(2, 5)}`;
            }

            const hostname = sender.tab.url ? new URL(sender.tab.url).hostname : 'page';
            // Clean hostname for better display (e.g. "gemini.google.com" -> "Gemini")
            let platformName = hostname;
            if (hostname.includes('gemini.google')) platformName = 'Gemini';
            else if (hostname.includes('openai.com')) platformName = 'ChatGPT';
            else if (hostname.includes('claude.ai')) platformName = 'Claude';
            else if (hostname.includes('perplexity.ai')) platformName = 'Perplexity';

            this.registerPageAgent(
              pageAgentId,
              `AI Chat (${platformName})`,
              hostname,
              sender.tab.id
            );

            // 2. Broadcast availability
            const message = {
              type: 'AGENT_STATUS',
              agent: this.agents.get(pageAgentId),
            };
            this.broadcastToTabs(message);

            // 3. Return the assigned Agent ID to the tab so it knows who it is
            sendResponse({ success: true, agentId: pageAgentId });
          } else {
            sendResponse({ success: true });
          }
          break;
        }

        case 'STREAMING_UPDATE':
          break;

        case 'RESPONSE_COMPLETE': {
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
              // PRIMARY SELF-DETECTION: Use metadata.senderId (most reliable)
              let senderId = message.metadata?.senderId || message.senderId;

              // NORMALIZE IDs for comparison and reliable routing
              const normalizeId = (id: string) =>
                id ? id.replace(/^(page-agent-|browser-|agent-)/, '') : '';

              // Fallback: construct from tab ID if not provided
              if (!senderId && sender.tab?.id) {
                senderId = `page-agent-${sender.tab.id}`;
                console.log('[FuseConnect v7] Using tab-based senderId:', senderId);
              }

              // FIXED: Don't drop messages without senderId - use a safe fallback instead
              if (!senderId) {
                senderId = `ai-response-${Date.now()}`;
              }

              const normalizedSenderId = normalizeId(senderId);
              const normalizedMyId = normalizeId(this.agentId);

              console.log('[FuseConnect v7] AI Response from agent:', {
                senderId,
                normalizedSenderId,
                normalizedMyId,
              });

              // Get channel from message metadata (set by the content script when the user selected it)
              // This supports per-tab channel selection where each tab maintains its own channel
              let channel = message.channel || message.metadata?.channel;

              if (!channel && this.joinedChannels.size > 0) {
                // Fallback to first joined channel if no specific channel provided
                channel = Array.from(this.joinedChannels)[0];
                console.log('[FuseConnect v7] Using fallback channel:', channel);
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
                    '[FuseConnect v7] 🔗 Including correlation in broadcast:',
                    message.metadata.correlationId
                  );
                }

                this.send({
                  type: 'MESSAGE_SEND',
                  to: message.metadata?.inResponseTo || 'broadcast',
                  channel: channel,
                  content: message.content,
                  messageType: 'ai-response',
                  metadata: responseMetadata,
                });
                console.log('[FuseConnect v7] AI response broadcast to channel:', {
                  channel,
                  senderId,
                  platform: platformName,
                  contentLength: message.content.length,
                  hasCorrelation: !!message.metadata?.correlationId,
                });
              }
            } else {
              console.log('[FuseConnect v7] Skipping duplicate AI response broadcast');
            }
          }
          sendResponse({ success: true });
          break;
        }
      }

      // Explicit cases that need async response already return true themselves.
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
    this.stopStallWatchdog();

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
