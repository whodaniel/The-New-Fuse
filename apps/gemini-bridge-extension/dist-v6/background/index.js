/******/ (() => {
  // webpackBootstrap
  /******/ 'use strict'; // ./src/v6/shared/utils.ts

  /**
   * Shared utility functions
   */
  /**
   * Simple hash function for message deduplication
   */
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  } // ./src/v6/background/index.ts

  /**
   * Fuse Connect v7 - Background Service Worker
   * Multi-node connection, federation channels, notifications
   *
   * This version handles connection failures gracefully and allows
   * starting the relay from the extension's Services tab.
   */

  // Storage keys
  const STORAGE_KEYS = {
    settings: 'fuse_settings',
    agentId: 'fuse_agent_id',
    channels: 'fuse_channels',
    joinedChannels: 'fuse_joined_channels',
    tabActiveChannels: 'fuse_tab_active_channels',
    knownNodes: 'fuse_known_nodes',
    autoConnect: 'fuse_auto_connect',
    autoMonitor: 'fuse_auto_monitor',
    autoMasterClock: 'fuse_auto_master_clock',
    autoWakePing: 'fuse_auto_wake_ping',
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
  class BackgroundService {
    constructor() {
      // Connections
      this.connections = new Map();
      this.nodeStatus = new Map();
      this.primaryConnection = null;
      // State
      this.agentId = '';
      this.agents = new Map();
      this.channels = new Map();
      this.joinedChannels = new Set();
      this.tabActiveChannels = new Map();
      this.messageQueue = [];
      this.pendingPageAgents = []; // Queue for page agents waiting for connection
      this.autoConnect = true; // Default to TRUE for agent operation
      this.autoMonitor = true;
      this.autoMasterClock = true;
      this.autoWakePing = true;
      this.lastAutonomyStartAt = 0;
      this.lastWakePingAt = new Map();
      this.channelLastActivityAt = new Map();
      this.connectionAttempts = 0;
      this.maxInitialAttempts = 1; // Only try once on startup
      // Message deduplication - track recently sent/received message hashes
      this.recentMessageHashes = new Map();
      this.MESSAGE_DEDUP_WINDOW_MS = 10000; // 10 second dedup window
      // Timers
      this.reconnectTimers = new Map();
      this.heartbeatTimer = null;
      this.healthCheckTimer = null;
      this.cleanupTimer = null; // Periodic cleanup to prevent memory leaks
      this.stallWatchdogTimer = null;
      this.init();
    }
    async init() {
      console.log('[FuseConnect v7] Background service initializing...');
      // CRITICAL: Setup handlers SYNCHRONOUSLY before any awaits
      // This prevents "Receiving end does not exist" errors in the popup
      this.setupMessageHandlers();
      this.setupCommands();
      this.setupTabLifecycleHandlers();
      // Get or create agent ID
      this.agentId = await this.getOrCreateAgentId();
      // Load saved state
      await this.loadSavedState();
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
    }
    /**
     * Start periodic cleanup timer to prevent memory leaks
     */
    startCleanupTimer() {
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
      }, 30000);
    }
    /**
     * Try initial connection with limited retries
     */
    async tryInitialConnection() {
      // First check if relay is available via health endpoint
      const isAvailable = await this.checkRelayHealth();
      if (isAvailable) {
        this.connectToNode('relay', DEFAULT_NODES.relay);
      } else {
        console.log('[FuseConnect v7] Relay not available - attempting autonomous startup');
        this.updateNodeStatus('relay', DEFAULT_NODES.relay, 'disconnected');
        this.sendNativeMessage({ action: 'start', service: 'relay' }).then(() => {
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
    async checkRelayHealth() {
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
    async getOrCreateAgentId() {
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
    async loadSavedState() {
      const result = await chrome.storage.local.get([
        STORAGE_KEYS.channels,
        STORAGE_KEYS.joinedChannels,
        STORAGE_KEYS.tabActiveChannels,
        STORAGE_KEYS.knownNodes,
        STORAGE_KEYS.autoConnect,
        STORAGE_KEYS.autoMonitor,
        STORAGE_KEYS.autoMasterClock,
        STORAGE_KEYS.autoWakePing,
        STORAGE_KEYS.settings,
      ]);
      if (result[STORAGE_KEYS.channels]) {
        result[STORAGE_KEYS.channels].forEach((ch) => {
          this.channels.set(ch.id, ch);
        });
      }
      if (result[STORAGE_KEYS.joinedChannels]) {
        this.joinedChannels = new Set(result[STORAGE_KEYS.joinedChannels]);
      }
      if (result[STORAGE_KEYS.tabActiveChannels]) {
        const tabChannels = result[STORAGE_KEYS.tabActiveChannels];
        for (const [tabId, channelId] of Object.entries(tabChannels)) {
          const parsedTabId = Number(tabId);
          if (Number.isFinite(parsedTabId) && channelId) {
            this.tabActiveChannels.set(parsedTabId, channelId);
          }
        }
      }
      // Auto-join Red channel
      this.joinedChannels.add('red');
      // Load auto-connect preference (default true)
      this.autoConnect = result[STORAGE_KEYS.autoConnect] ?? true;
      this.autoMonitor = result[STORAGE_KEYS.autoMonitor] ?? true;
      this.autoMasterClock = result[STORAGE_KEYS.autoMasterClock] ?? true;
      this.autoWakePing = result[STORAGE_KEYS.autoWakePing] ?? true;
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
    connectToNode(nodeType, url) {
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
    updateNodeStatus(nodeType, url, status) {
      const node = {
        id: nodeType,
        type: nodeType,
        url,
        status,
        lastConnected:
          status === 'connected'
            ? Date.now()
            : this.nodeStatus.get(nodeType)?.lastConnected || null,
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
    getNodeFeatures(nodeType) {
      const features = {
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
    scheduleReconnect(nodeType, url) {
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
      }, delay);
      this.reconnectTimers.set(nodeType, timer);
    }
    /**
     * Register agent with relay
     */
    registerAgent(ws) {
      const message = {
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
    registerPageAgent(id, name, platform, tabId) {
      // 1. Create agent object
      const agent = {
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
        const regMessage = {
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
          const joinMessage = {
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
    requestSync(ws) {
      // Request agent list
      this.send({ type: 'AGENT_LIST' }, ws);
      // Request channel list
      this.send({ type: 'CHANNEL_LIST' }, ws);
    }
    /**
     * Send message via WebSocket
     */
    send(data, ws) {
      const connection = ws || this.primaryConnection;
      let message;
      // Special handling for MESSAGE_SEND to match relay's expected format
      if (data.type === 'MESSAGE_SEND') {
        message = {
          id: crypto.randomUUID(),
          type: 'MESSAGE_SEND',
          timestamp: Date.now(),
          source: this.agentId,
          channel: data.channel || 'general',
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
          type: data.type,
          timestamp: Date.now(),
          source: this.agentId,
          channel: data.channel || 'general',
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
    flushMessageQueue() {
      while (
        this.messageQueue.length > 0 &&
        this.primaryConnection?.readyState === WebSocket.OPEN
      ) {
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
    flushPendingPageAgents() {
      if (this.primaryConnection?.readyState !== WebSocket.OPEN) return;
      console.log(
        `[FuseConnect v7] Flushing ${this.pendingPageAgents.length} pending page agent registrations`
      );
      while (this.pendingPageAgents.length > 0) {
        const agent = this.pendingPageAgents.shift();
        if (agent) {
          // Register the agent
          const regMessage = {
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
            const joinMessage = {
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
    reRegisterAllAgents(ws) {
      if (ws.readyState !== WebSocket.OPEN) return;
      console.log(
        `[FuseConnect v7] Re-registering ${this.agents.size} existing agents on new connection`
      );
      for (const [agentId, agent] of this.agents) {
        // Don't re-register the main browser agent (it's already done in registerAgent)
        if (agentId === this.agentId) continue;
        // Register the page agent
        const regMessage = {
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
            const joinMessage = {
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
    startHeartbeat() {
      if (this.heartbeatTimer) return;
      this.heartbeatTimer = setInterval(() => {
        // Send heartbeat for main browser agent
        this.send({ type: 'HEARTBEAT' });
        // Send heartbeats for all registered page agents (Gemini tabs, etc.)
        // This prevents the relay from timing out virtual agents
        for (const [agentId, agent] of this.agents) {
          if (agentId !== this.agentId && agent.platform === 'browser-page') {
            const tabId = agent.metadata?.tabId;
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
                const heartbeatMessage = {
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
      }, 30000);
    }
    /**
     * Start health checks
     */
    startHealthChecks() {
      this.healthCheckTimer = setInterval(() => {
        // Check all nodes
        for (const [nodeType, node] of this.nodeStatus) {
          const ws = this.connections.get(nodeType);
          if (ws && ws.readyState !== WebSocket.OPEN && node.status === 'connected') {
            this.updateNodeStatus(nodeType, node.url, 'disconnected');
          }
        }
      }, 10000);
    }
    /**
     * Handle messages from relay
     */
    handleRelayMessage(message, nodeType) {
      console.log(`[FuseConnect v7] Received from ${nodeType}:`, message.type);
      switch (message.type) {
        case 'WELCOME':
          console.log('[FuseConnect v7] Welcome received');
          break;
        case 'AGENT_LIST':
          const agents = message.payload.agents || [];
          this.agents.clear();
          agents.forEach((a) => this.agents.set(a.id, a));
          this.broadcastToTabs({ type: 'AGENTS_UPDATE', agents });
          break;
        case 'AGENT_STATUS':
          const agent = message.payload.agent;
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
            this.broadcastToTabs({
              type: 'AGENTS_UPDATE',
              agents: Array.from(this.agents.values()),
            });
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
        case 'AGENT_UNREGISTER':
          const unregId = message.payload.agentId;
          if (unregId) {
            console.log(`[FuseConnect v7] UNREGISTER received for ${unregId}`);
            this.agents.delete(unregId);
            this.broadcastToTabs({
              type: 'AGENTS_UPDATE',
              agents: Array.from(this.agents.values()),
            });
          }
          break;
        case 'CHANNEL_LIST':
          const channels = message.payload.channels || [];
          // Only update with new channels, do not clear locally saved ones if relay sends empty list
          if (channels.length > 0) {
            channels.forEach((ch) => this.channels.set(ch.id, ch));
            this.broadcastToTabs({
              type: 'CHANNELS_UPDATE',
              channels: Array.from(this.channels.values()),
            });
            this.saveChannels();
          }
          break;
        case 'CHANNEL_MESSAGE':
        case 'MESSAGE_RECEIVE':
          const agentMessage = message.payload;
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
            messageId: message.payload.messageId,
          });
          break;
        case 'MESSAGE_STREAM_CHUNK':
          this.broadcastToTabs({
            type: 'STREAMING_CHUNK',
            messageId: message.payload.messageId,
            chunk: message.payload.chunk,
          });
          break;
        case 'MESSAGE_STREAM_END':
          this.broadcastToTabs({
            type: 'STREAMING_END',
            messageId: message.payload.messageId,
          });
          break;
        case 'ERROR':
          console.error('[FuseConnect v7] Relay error:', message.payload);
          this.createNotification('error', 'Error', message.payload.message || 'Unknown error');
          break;
        case 'TASK_ASSIGN':
          this.broadcastToTabs({
            type: 'TASK_ASSIGN',
            task: message.payload.task,
            channel: message.channel,
            timestamp: message.timestamp,
          });
          this.createNotification(
            'info',
            'New Task Assigned',
            `Task: ${message.payload.task.title}`
          );
          break;
      }
    }
    async appendTranscriptFromRelay(message) {
      // Only persist messages from the NFT Alpha 1 channel (your requested test channel)
      // IMPORTANT: Relay uses channel ids (e.g. "channel-1770...") while UI shows channel names.
      const channelId = message.channel || '';
      const channelName = this.channels.get(channelId)?.name || '';
      const label = (channelName || channelId).toString();
      const isNftAlpha1 =
        label === 'NFT Alpha 1' ||
        label.toLowerCase() === 'nft-alpha-1' ||
        (label.toLowerCase().includes('nft') && label.toLowerCase().includes('alpha'));
      if (!isNftAlpha1) return;
      const role =
        message.type === 'system'
          ? 'system'
          : message.type === 'response'
            ? 'assistant'
            : message.type === 'command'
              ? 'tool'
              : 'user';
      const sessionKey = `relay:NFT Alpha 1`;
      const entry = {
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
    handleAgentMessage(message) {
      // LOOP GUARD: burst-mute repeated identical payloads (prevents intro/handshake echo storms)
      // Keyed by (from, channel, prefix-of-content). If a source repeats >5 times in 10s, mute 60s.
      // This is defensive: even if an upstream agent loops, the browser bridge stays usable.
      try {
        const now = Date.now();
        const guard = this.__loopGuard || {
          counts: new Map(),
          mutedUntil: new Map(),
        };
        this.__loopGuard = guard;
        const from = message.from || '';
        const channel = message.channel || '';
        const content = message.content || '';
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
      // Create notification
      if (message.to === this.agentId || message.to === 'broadcast') {
        this.createNotification(
          'message',
          `Message from ${message.from}`,
          message.content.substring(0, 100)
        );
      }
      // Handle commands
      if (
        (message.to === this.agentId || message.to === 'broadcast') &&
        message.type === 'command'
      ) {
        this.executeCommand(message);
      }
    }
    /**
     * Execute command from another agent
     */
    async executeCommand(message) {
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
    createNotification(type, title, message) {
      const notification = {
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
    async injectMessageToActiveTab(text) {
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
    async getLastResponseFromActiveTab() {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        return new Promise((resolve) => {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_LAST_RESPONSE' }, (response) => {
            resolve(response?.response || null);
          });
        });
      }
      return null;
    }
    /**
     * Get chat status from active tab
     */
    async getTabChatStatus() {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        return new Promise((resolve) => {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_CHAT_STATUS' }, (response) => {
            resolve(response || {});
          });
        });
      }
      return {};
    }
    /**
     * Broadcast to all tabs
     */
    async broadcastToTabs(message) {
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
    /**
     * Save channels to storage
     */
    async saveChannels() {
      await chrome.storage.local.set({
        [STORAGE_KEYS.channels]: Array.from(this.channels.values()),
        [STORAGE_KEYS.joinedChannels]: Array.from(this.joinedChannels),
      });
    }
    /**
     * Save per-tab active channel selections
     */
    async saveTabActiveChannels() {
      const serialized = {};
      for (const [tabId, channelId] of this.tabActiveChannels.entries()) {
        if (channelId) {
          serialized[String(tabId)] = channelId;
        }
      }
      await chrome.storage.local.set({
        [STORAGE_KEYS.tabActiveChannels]: serialized,
      });
    }
    /**
     * Track active channel selection per tab
     */
    setTabActiveChannel(tabId, channelId) {
      if (channelId) {
        this.tabActiveChannels.set(tabId, channelId);
      } else {
        this.tabActiveChannels.delete(tabId);
      }
      void this.saveTabActiveChannels();
    }
    getTabActiveChannel(tabId) {
      if (!tabId) return null;
      return this.tabActiveChannels.get(tabId) || null;
    }
    /**
     * Clear tab-scoped state when tabs are closed
     */
    setupTabLifecycleHandlers() {
      chrome.tabs.onRemoved.addListener((tabId) => {
        if (this.tabActiveChannels.delete(tabId)) {
          void this.saveTabActiveChannels();
        }
      });
    }
    /**
     * Send native message to control services
     */
    async sendNativeMessage(message) {
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
    async sendActivityEvent(eventType, metadata = {}, channel = 'fuse-activity-log') {
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
    async ensureAutonomousServices(reason) {
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
    startStallWatchdog() {
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
      }, 30000);
    }
    stopStallWatchdog() {
      if (this.stallWatchdogTimer) {
        clearInterval(this.stallWatchdogTimer);
        this.stallWatchdogTimer = null;
      }
    }
    frontloadPageAgentContext(agent) {
      if (!agent.metadata?.tabId) {
        return;
      }
      const joinedChannels = Array.from(this.joinedChannels);
      chrome.tabs.sendMessage(agent.metadata.tabId, {
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
    setupMessageHandlers() {
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
                this.primaryConnection?.readyState === WebSocket.OPEN
                  ? 'connected'
                  : 'disconnected',
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
            });
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
            this.ensureAutonomousServices('manual_start').then(() =>
              sendResponse({ success: true })
            );
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
            chrome.storage.local.get(['videoQueue', 'ai_studio_queue'], (result) => {
              const queue =
                message.format === 'urls'
                  ? (result.videoQueue || []).map((v) => v.url).join('\n')
                  : JSON.stringify(result.videoQueue || [], null, 2);
              sendResponse({ content: queue });
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
          case 'CHANNEL_CREATE':
            // Optimistically create channel locally
            const newChannel = {
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
            this.sendActivityEvent('channel_create', {
              channelId: newChannel.id,
              name: message.name,
            });
            sendResponse({ success: true, channel: newChannel });
            break;
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
            this.sendActivityEvent('channel_join', { channelId: message.channelId });
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
            this.sendActivityEvent('channel_leave', { channelId: message.channelId });
            sendResponse({ success: true });
            break;
          case 'CHANNEL_DELETE':
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
            this.saveChannels();
            this.send({
              type: 'CHANNEL_DELETE',
              channelId: channelIdToDelete,
            });
            this.sendActivityEvent('channel_delete', { channelId: channelIdToDelete });
            sendResponse({ success: true });
            break;
          case 'CONTENT_SCRIPT_READY':
            // Send current state to new tab
            if (sender.tab?.id) {
              const status =
                this.primaryConnection?.readyState === WebSocket.OPEN
                  ? 'connected'
                  : 'disconnected';
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
                    console.log(`[FuseConnect v7] Content script injected into tab ${tabs[0].id}`);
                    // Wait a moment for initialization, then show panel
                    setTimeout(() => {
                      if (tabs[0]?.id) {
                        chrome.tabs.sendMessage(tabs[0].id, { type: 'SHOW_PANEL' });
                      }
                    }, 500);
                    sendResponse({ success: true, injected: true });
                  }
                } catch (error) {
                  console.error('[FuseConnect v7] Failed to activate on tab:', error);
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
            // Forward message injection request to active tab's content script
            // This handles messages from the FloatingPanel that need to be injected into the page's chat
            this.injectMessageToActiveTab(message.content)
              .then(() => {
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
          case 'CHAT_DETECTED':
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
                // PRIMARY SELF-DETECTION: Use metadata.senderId (most reliable)
                let senderId = message.metadata?.senderId || message.senderId;
                // Fallback: construct from tab ID if not provided
                if (!senderId && sender.tab?.id) {
                  senderId = `page-agent-${sender.tab.id}`;
                  console.log('[FuseConnect v7] Using tab-based senderId:', senderId);
                }
                // FIXED: Don't drop messages without senderId - use a safe fallback instead
                // This ensures CLI agents and other sources still work
                // The content script's isSelfMessage check will prevent loops
                if (!senderId) {
                  senderId = `ai-response-${Date.now()}`;
                  console.log(
                    '[FuseConnect v7] Using generated senderId for anonymous response:',
                    senderId
                  );
                }
                console.log('[FuseConnect v7] AI Response from agent:', senderId);
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
                  const responseMetadata = {
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
        // Explicit cases that need async response already return true themselves.
      });
    }
    /**
     * Disconnect all connections
     */
    disconnectAll() {
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
    setupCommands() {
      chrome.commands.onCommand.addListener((command) => {
        if (command === 'toggle-panel') {
          this.broadcastToTabs({ type: 'TOGGLE_PANEL' });
        }
      });
    }
  }
  // Initialize
  new BackgroundService();

  /******/
})();
//# sourceMappingURL=index.js.map
