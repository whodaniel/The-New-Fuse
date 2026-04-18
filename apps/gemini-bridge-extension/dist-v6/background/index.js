/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./src/v6/services/ai-studio/youtube-service.js
// YouTube API Service
// Handles all YouTube API interactions including OAuth2, playlists, and video management

class YouTubeService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
  }

  // OAuth2 Authentication
  async authenticate() {
    try {
      console.log('Starting YouTube OAuth2 authentication...');

      const token = await chrome.identity.getAuthToken({ interactive: true });

      if (token) {
        this.accessToken = token;
        this.tokenExpiry = Date.now() + 3600 * 1000; // 1 hour

        // Store token
        await chrome.storage.local.set({
          youtubeToken: token,
          youtubeTokenExpiry: this.tokenExpiry,
        });

        console.log('YouTube authentication successful');
        return true;
      }

      return false;
    } catch (error) {
      console.error('YouTube authentication failed:', error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  // Check if token is valid
  async isAuthenticated() {
    if (!this.accessToken || !this.tokenExpiry) {
      // Try to load from storage
      const data = await chrome.storage.local.get(['youtubeToken', 'youtubeTokenExpiry']);

      if (data.youtubeToken && data.youtubeTokenExpiry > Date.now()) {
        this.accessToken = data.youtubeToken;
        this.tokenExpiry = data.youtubeTokenExpiry;
        return true;
      }

      return false;
    }

    return this.tokenExpiry > Date.now();
  }

  // Ensure we have a valid token
  async ensureAuthenticated() {
    if (!(await this.isAuthenticated())) {
      await this.authenticate();
    }
  }

  // Make authenticated API request
  async makeRequest(endpoint, params = {}) {
    // Check if we have an OAuth token
    const isOAuth = await this.isAuthenticated();

    // If NOT authenticated via OAuth, check for API key
    let apiKey = this.apiKey;
    if (!apiKey) {
      const stored = await chrome.storage.local.get('youtubeApiKey');
      apiKey = stored.youtubeApiKey;
      this.apiKey = apiKey;
    }

    // specific operations like insert/delete ALWAYS require OAuth
    const isWriteOperation = ['POST', 'PUT', 'DELETE'].includes(params.method || 'GET');

    // STRICT QUOTA PROTECTION:
    // We do NOT allow using the extension's default project quota implicitly.
    // The user MUST either:
    // 1. Sign In (using their own quota via OAuth, effectively)
    //    *Note: OAuth actually shares project quota for read ops in some APIs,
    //     but allows us to track per-user. To be 100% safe, we prefer API Key.*
    // 2. Provide their own API Key.

    // If not signed in AND no API key, we must fail.
    // We do NOT attempt to auto-authenticate here to avoid annoying popups.
    if (!isOAuth && !apiKey) {
      throw new Error(
        'Quota Protection: You must specific a YouTube API Key in settings OR Sign In.'
      );
    }

    // If still no OAuth and writing, fail
    if (isWriteOperation && !this.accessToken) {
      throw new Error('Write operations require Google Sign-In (OAuth)');
    }

    const url = new URL(`${this.baseUrl}/${endpoint}`);

    // Use user's API key if available, otherwise fallback/nothing
    if (apiKey) {
      url.searchParams.append('key', apiKey);
    }

    Object.keys(params).forEach((key) => {
      if (key !== 'method' && key !== 'body') {
        url.searchParams.append(key, params[key]);
      }
    });

    const headers = {
      Accept: 'application/json',
    };

    // Only add Bearer token if we have one
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const fetchOptions = {
      method: params.method || 'GET',
      headers,
    };

    if (params.body) {
      fetchOptions.body =
        typeof params.body === 'string' ? params.body : JSON.stringify(params.body);
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url.toString(), fetchOptions);

    if (!response.ok) {
      // If 403/401 and we were using API key, might be quota or invalid key
      if (!this.accessToken && response.status === 403) {
        throw new Error('API Key Quota Exceeded or Invalid. Please sign in with Google.');
      }
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  // Get user's playlists
  async getPlaylists() {
    try {
      const data = await this.makeRequest('playlists', {
        part: 'snippet,contentDetails',
        mine: 'true',
        maxResults: 50,
      });

      return data.items.map((item) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        videoCount: item.contentDetails.itemCount,
        thumbnail: item.snippet.thumbnails?.default?.url,
      }));
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
      throw error;
    }
  }

  // Get videos from a playlist
  async getPlaylistVideos(playlistId, maxResults = 50) {
    try {
      let allVideos = [];
      let nextPageToken = null;

      do {
        const params = {
          part: 'snippet,contentDetails',
          playlistId: playlistId,
          maxResults: maxResults,
        };

        if (nextPageToken) {
          params.pageToken = nextPageToken;
        }

        const data = await this.makeRequest('playlistItems', params);

        const videos = data.items.map((item) => ({
          id: item.snippet.resourceId.videoId,
          playlistItemId: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails?.default?.url,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          position: item.snippet.position,
        }));

        allVideos = allVideos.concat(videos);
        nextPageToken = data.nextPageToken;
      } while (nextPageToken);

      return allVideos;
    } catch (error) {
      console.error('Failed to fetch playlist videos:', error);
      throw error;
    }
  }

  // Get video details including duration
  async getVideoDetails(videoIds) {
    try {
      // YouTube API allows up to 50 video IDs per request
      const chunks = [];
      for (let i = 0; i < videoIds.length; i += 50) {
        chunks.push(videoIds.slice(i, i + 50));
      }

      let allVideos = [];

      for (const chunk of chunks) {
        const data = await this.makeRequest('videos', {
          part: 'contentDetails,snippet,statistics',
          id: chunk.join(','),
        });

        const videos = data.items.map((item) => ({
          id: item.id,
          duration: this.parseDuration(item.contentDetails.duration),
          durationISO: item.contentDetails.duration,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          viewCount: item.statistics?.viewCount,
          likeCount: item.statistics?.likeCount,
        }));

        allVideos = allVideos.concat(videos);
      }

      return allVideos;
    } catch (error) {
      console.error('Failed to fetch video details:', error);
      throw error;
    }
  }

  // Parse ISO 8601 duration to seconds
  parseDuration(isoDuration) {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

    if (!match) return 0;

    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);

    return hours * 3600 + minutes * 60 + seconds;
  }

  // Format seconds to readable duration
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  // Add video to playlist
  async addToPlaylist(playlistId, videoId) {
    try {
      const response = await fetch(`${this.baseUrl}/playlistItems?part=snippet`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            playlistId: playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId: videoId,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add video to playlist: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to add video to playlist:', error);
      throw error;
    }
  }

  // Remove video from playlist
  async removeFromPlaylist(playlistItemId) {
    try {
      const response = await fetch(`${this.baseUrl}/playlistItems?id=${playlistItemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to remove video from playlist: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to remove video from playlist:', error);
      throw error;
    }
  }

  // Move video to another playlist
  async moveVideo(videoId, fromPlaylistItemId, toPlaylistId) {
    try {
      // Add to new playlist
      await this.addToPlaylist(toPlaylistId, videoId);

      // Remove from old playlist
      await this.removeFromPlaylist(fromPlaylistItemId);

      return true;
    } catch (error) {
      console.error('Failed to move video:', error);
      throw error;
    }
  }

  // Create new playlist
  async createPlaylist(title, description = '', privacy = 'private') {
    try {
      const response = await fetch(`${this.baseUrl}/playlists?part=snippet,status`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            title: title,
            description: description,
          },
          status: {
            privacyStatus: privacy,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create playlist: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        title: data.snippet.title,
        description: data.snippet.description,
      };
    } catch (error) {
      console.error('Failed to create playlist:', error);
      throw error;
    }
  }

  // Get Watch Later playlist ID
  async getWatchLaterPlaylistId() {
    try {
      const data = await this.makeRequest('channels', {
        part: 'contentDetails',
        mine: 'true',
      });

      if (data.items && data.items.length > 0) {
        return data.items[0].contentDetails.relatedPlaylists.watchLater;
      }

      return null;
    } catch (error) {
      console.error('Failed to get Watch Later playlist:', error);
      throw error;
    }
  }

  // Get Liked Videos (as proxy for watch history)
  async getLikedVideos(maxResults = 50) {
    try {
      const data = await this.makeRequest('videos', {
        part: 'snippet,contentDetails',
        myRating: 'like',
        maxResults: maxResults,
      });

      return data.items.map((item) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.default?.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${item.id}`,
      }));
    } catch (error) {
      console.error('Failed to fetch liked videos:', error);
      throw error;
    }
  }

  // Generate prompt for Gemini Personal Intelligence
  generateWatchHistoryPrompt(videoCount = 50) {
    return `Using your Personal Intelligence access to my YouTube watch history,
provide my last ${videoCount} watched videos.

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
  }
}

// Export singleton instance
const youtubeService = new YouTubeService();
/* harmony default export */ const youtube_service = (youtubeService);

;// ./src/v6/shared/utils.ts
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
}

;// ./src/v6/background/index.ts
/**
 * Gemini Bridge v7 - Background Service Worker
 * Multi-node connection, federation channels, notifications
 *
 * This version handles connection failures gracefully and allows
 * starting the relay from the extension's Services tab.
 */


// Storage keys
const STORAGE_KEYS = {
    settings: 'gemini_bridge_settings',
    agentId: 'gemini_bridge_agent_id',
    channels: 'gemini_bridge_channels',
    joinedChannels: 'gemini_bridge_joined_channels',
    tabActiveChannels: 'gemini_bridge_tab_active_channels',
    tabPausedChannels: 'gemini_bridge_tab_paused_channels',
    knownNodes: 'gemini_bridge_known_nodes',
    autoConnect: 'gemini_bridge_auto_connect',
    autoMonitor: 'gemini_bridge_auto_monitor',
    autoMasterClock: 'gemini_bridge_auto_master_clock',
    autoWakePing: 'gemini_bridge_auto_wake_ping',
    eventLog: 'gemini_bridge_event_log',
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
        this.tabPausedChannels = new Map();
        this.messageQueue = [];
        this.pendingPageAgents = []; // Queue for page agents waiting for connection
        this.autoConnect = true; // Default to TRUE for agent operation
        this.autoMonitor = true;
        this.autoMasterClock = true;
        this.autoWakePing = false;
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
        this.nativeHostUnavailable = false;
        this.nativeHostMissingLogged = false;
        this.extensionEventLog = [];
        this.EVENT_LOG_LIMIT = 4000;
        this.eventLogFlushTimer = null;
        this.eventLoggingEnabled = true;
        // Automation orchestrator state
        this.automationRunning = false;
        this.automationPaused = false;
        this.pendingTaskResolve = null;
        this.init();
    }
    async init() {
        console.log('[GeminiBridge v7] Background service initializing...');
        // CRITICAL: Setup handlers SYNCHRONOUSLY before any awaits
        // This prevents "Receiving end does not exist" errors in the popup
        this.setupMessageHandlers();
        this.setupCommands();
        this.setupTabLifecycleHandlers();
        this.setupAlarmHandlers();
        // Register with 2026 WebMCP standard (Chrome built-in AI tools)
        this.registerWebMCPTools();
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
        }
        else {
            // Set initial status to disconnected without error
            this.updateNodeStatus('relay', DEFAULT_NODES.relay, 'disconnected');
        }
        console.log('[GeminiBridge v7] Background service ready');
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
                console.log(`[GeminiBridge v7] Cleaned up ${cleaned} stale message hashes`);
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
        }
        else {
            console.log('[GeminiBridge v7] Relay not available - attempting autonomous startup');
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
    async checkRelayHealth() {
        try {
            const response = await fetch('http://localhost:3000/health', {
                method: 'GET',
                signal: AbortSignal.timeout(2000),
            });
            const data = await response.json();
            return data.status === 'ok';
        }
        catch (e) {
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
            STORAGE_KEYS.tabPausedChannels,
            STORAGE_KEYS.eventLog,
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
        if (result[STORAGE_KEYS.tabPausedChannels]) {
            const paused = result[STORAGE_KEYS.tabPausedChannels];
            for (const [tabIdRaw, channelIds] of Object.entries(paused)) {
                const tabId = Number(tabIdRaw);
                if (!Number.isFinite(tabId) || !Array.isArray(channelIds))
                    continue;
                const set = new Set(channelIds.map((c) => String(c || '').trim()).filter((c) => c.length > 0));
                if (set.size > 0) {
                    this.tabPausedChannels.set(tabId, set);
                }
            }
        }
        if (Array.isArray(result[STORAGE_KEYS.eventLog])) {
            const existing = result[STORAGE_KEYS.eventLog];
            this.extensionEventLog = existing.slice(-this.EVENT_LOG_LIMIT);
        }
        // Auto-join Green channel
        this.joinedChannels.add('green');
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
    connectToNode(nodeType, url) {
        if (this.connections.has(nodeType)) {
            const existing = this.connections.get(nodeType);
            if (existing?.readyState === WebSocket.OPEN) {
                console.log(`[GeminiBridge v7] Already connected to ${nodeType}`);
                return;
            }
            // Close stale connection
            existing?.close();
            this.connections.delete(nodeType);
        }
        console.log(`[GeminiBridge v7] Connecting to ${nodeType} at ${url}...`);
        this.updateNodeStatus(nodeType, url, 'connecting');
        try {
            const ws = new WebSocket(url);
            ws.onopen = () => {
                console.log(`[GeminiBridge v7] Connected to ${nodeType}`);
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
                }
                catch (e) {
                    console.error('[GeminiBridge v7] Failed to parse message:', e);
                }
            };
            ws.onclose = () => {
                console.log(`[GeminiBridge v7] Disconnected from ${nodeType}`);
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
        }
        catch (error) {
            console.log(`[GeminiBridge v7] Unable to connect to ${nodeType} - relay may not be running`);
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
            lastConnected: status === 'connected' ? Date.now() : this.nodeStatus.get(nodeType)?.lastConnected || null,
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
        console.log(`[GeminiBridge v7] Will retry ${nodeType} in ${delay}ms...`);
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
            console.log(`[GeminiBridge v7] Registered Page Agent: ${name} (${id})`);
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
                console.log(`[GeminiBridge v7] Auto-joined Page Agent ${id} to channel ${channelId}`);
                // Update local agent object
                agent.channels.push(channelId);
            }
        }
        else {
            // NOT CONNECTED: Queue for registration when connection is established
            console.log(`[GeminiBridge v7] Queued Page Agent for later registration: ${name} (${id})`);
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
        }
        else {
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
            console.log('[GeminiBridge v7] Sent to relay:', message.type, message.channel);
        }
        else {
            this.messageQueue.push(message);
            console.log('[GeminiBridge v7] Queued message (not connected):', message.type);
        }
    }
    /**
     * Flush message queue
     */
    flushMessageQueue() {
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
    flushPendingPageAgents() {
        if (this.primaryConnection?.readyState !== WebSocket.OPEN)
            return;
        console.log(`[GeminiBridge v7] Flushing ${this.pendingPageAgents.length} pending page agent registrations`);
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
                console.log(`[GeminiBridge v7] Registered queued Page Agent: ${agent.name} (${agent.id})`);
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
        if (ws.readyState !== WebSocket.OPEN)
            return;
        console.log(`[GeminiBridge v7] Re-registering ${this.agents.size} existing agents on new connection`);
        for (const [agentId, agent] of this.agents) {
            // Don't re-register the main browser agent (it's already done in registerAgent)
            if (agentId === this.agentId)
                continue;
            // Register the page agent
            const regMessage = {
                id: crypto.randomUUID(),
                type: 'AGENT_REGISTER',
                timestamp: Date.now(),
                source: this.agentId, // Sent BY browser agent
                payload: { agent },
            };
            ws.send(JSON.stringify(regMessage));
            console.log(`[GeminiBridge v7] Re-announced Page Agent: ${agent.name} (${agentId})`);
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
        if (this.heartbeatTimer)
            return;
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
                                console.log(`[GeminiBridge v7] Tab ${tabId} for agent ${agentId} is gone. Removing.`);
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
        console.log(`[GeminiBridge v7] Received from ${nodeType}:`, message.type);
        this.logEvent('relay', 'message_in', {
            nodeType,
            type: message.type,
            source: message.source || null,
            channel: message.channel || null,
        });
        switch (message.type) {
            case 'WELCOME':
                console.log('[GeminiBridge v7] Welcome received');
                break;
            case 'AGENT_LIST': {
                const agents = message.payload.agents || [];
                this.agents.clear();
                agents.forEach((a) => this.agents.set(a.id, a));
                this.broadcastToTabs({ type: 'AGENTS_UPDATE', agents });
                this.notifyPopup({ type: 'AGENTS_UPDATE', agents });
                break;
            }
            case 'AGENT_STATUS': {
                const agent = message.payload.agent;
                if (agent) {
                    // If agent is offline or unregistered, remove it
                    if (agent.status === 'offline' ||
                        agent.status === 'disconnected' ||
                        agent.status === 'unregistered') {
                        console.log(`[GeminiBridge v7] Agent ${agent.id} went offline/removed`);
                        this.agents.delete(agent.id);
                    }
                    else {
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
                        this.createNotification('agent_joined', 'Agent Connected', `${agent.name} is now online`);
                    }
                }
                break;
            }
            case 'AGENT_UNREGISTER': {
                const unregId = message.payload.agentId;
                if (unregId) {
                    console.log(`[GeminiBridge v7] UNREGISTER received for ${unregId}`);
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
                const channels = message.payload.channels || [];
                // Only update with new channels, do not clear locally saved ones if relay sends empty list
                if (channels.length > 0) {
                    channels.forEach((ch) => {
                        const existingByName = this.findChannelByName(ch.name);
                        if (existingByName && existingByName.id !== ch.id) {
                            if (this.shouldPreferIncomingChannel(existingByName, ch)) {
                                this.channels.delete(existingByName.id);
                                this.remapChannelReferences(existingByName.id, ch.id);
                            }
                            else {
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
                const agentMessage = message.payload;
                if (agentMessage?.channel) {
                    this.channelLastActivityAt.set(agentMessage.channel, Date.now());
                }
                // best-effort transcript persistence at the edge
                this.appendTranscriptFromRelay(agentMessage);
                this.handleAgentMessage(agentMessage);
                // FORWARD GREEN CHANNEL MESSAGES TO TABS
                if (agentMessage && agentMessage.content) {
                    const channelName = this.channels.get(agentMessage.channel || '')?.name || '';
                    if (agentMessage.channel === 'green' || channelName.toLowerCase() === 'green') {
                        this.broadcastToTabs({
                            type: 'INJECT_MESSAGE',
                            content: agentMessage.content,
                            metadata: agentMessage.metadata,
                        });
                    }
                }
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
                console.error('[GeminiBridge v7] Relay error:', message.payload);
                this.createNotification('error', 'Error', message.payload.message || 'Unknown error');
                break;
            case 'TASK_ASSIGN':
                this.broadcastToTabs({
                    type: 'TASK_ASSIGN',
                    task: message.payload.task,
                    channel: message.channel,
                    timestamp: message.timestamp,
                });
                this.createNotification('info', 'New Task Assigned', `Task: ${message.payload.task.title}`);
                break;
        }
    }
    async appendTranscriptFromRelay(message) {
        // Only persist messages from the NFT Alpha 1 channel (your requested test channel)
        // IMPORTANT: Relay uses channel ids (e.g. "channel-1770...") while UI shows channel names.
        const channelId = message.channel || '';
        const channelName = this.channels.get(channelId)?.name || '';
        const label = (channelName || channelId).toString();
        const isNftAlpha1 = label === 'NFT Alpha 1' ||
            label.toLowerCase() === 'nft-alpha-1' ||
            (label.toLowerCase().includes('nft') && label.toLowerCase().includes('alpha'));
        if (!isNftAlpha1)
            return;
        const role = message.type === 'system'
            ? 'system'
            : message.type === 'response'
                ? 'assistant'
                : message.type === 'command'
                    ? 'tool'
                    : 'user';
        const sessionKey = `relay:NFT Alpha 1`;
        const entry = {
            id: simpleHash(`${sessionKey}|${message.id}|${message.from}|${message.to}|${message.timestamp}|${channelId}`),
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
        if (!entry.content)
            return;
        try {
            const url = `${DEFAULT_NODES.tnfWorker}/transcript/append?sessionKey=${encodeURIComponent(sessionKey)}`;
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Session-Key': sessionKey },
                body: JSON.stringify({ entries: [entry] }),
            });
        }
        catch (e) {
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
                console.debug('[GeminiBridge v7] Loop guard muted source for 60s:', from);
                return;
            }
        }
        catch {
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
                console.log('[GeminiBridge v7] Skipping direct self-message echo');
                return;
            }
            // Check for duplication even for self-messages to prevent echo loops
            const msgHash = simpleHash(`${message.from}:${message.content}:${Math.floor(message.timestamp / 1000)}`);
            if (this.recentMessageHashes.has(msgHash)) {
                console.log('[GeminiBridge v7] Skipping duplicate self-message on channel');
                return;
            }
            // If it IS a channel message and NOT a duplicate, we process it
            // so we can broadcastToTabs.
        }
        // Deduplication: Create a hash of the message content and check if we've seen it recently
        const msgHash = simpleHash(`${message.from}:${message.content}:${Math.floor(message.timestamp / 1000)}`);
        const now = Date.now();
        if (this.recentMessageHashes.has(msgHash)) {
            console.log('[GeminiBridge v7] Skipping duplicate message');
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
            this.createNotification('message', `Message from ${message.from}`, message.content.substring(0, 100));
        }
        // Handle commands
        if ((message.to === this.agentId || message.to === 'broadcast') && message.type === 'command') {
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
        }
        else if (content === '/get-response') {
            const response = await this.getLastResponseFromActiveTab();
            this.send({
                type: 'MESSAGE_SEND',
                to: message.from,
                content: response || 'No response available',
                messageType: 'response',
            });
        }
        else if (content === '/get-status') {
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
            this.logEvent('chat', 'inject_active_tab', {
                tabId: tabs[0].id,
                preview: String(text || '').slice(0, 120),
            });
            this.safeSendMessage(tabs[0].id, {
                type: 'INJECT_MESSAGE',
                content: text,
            });
        }
    }
    /**
     * Helper to send messages to tabs without throwing "Receiving end does not exist"
     */
    safeSendMessage(tabId, message, callback) {
        try {
            chrome.tabs.sendMessage(tabId, message, (response) => {
                const err = chrome.runtime.lastError;
                if (callback) {
                    callback(response);
                }
            });
        }
        catch (e) {
            // Catch synchronous errors
        }
    }
    /**
     * Inject message to a specific tab
     */
    async injectMessageToTab(tabId, text) {
        this.logEvent('chat', 'inject_specific_tab', {
            tabId,
            preview: String(text || '').slice(0, 120),
        });
        this.safeSendMessage(tabId, {
            type: 'INJECT_MESSAGE',
            content: text,
        });
    }
    /**
     * Get last response from active tab
     */
    async getLastResponseFromActiveTab() {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]?.id) {
            return new Promise((resolve) => {
                this.safeSendMessage(tabs[0].id, { type: 'GET_LAST_RESPONSE' }, (response) => {
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
                this.safeSendMessage(tabs[0].id, { type: 'GET_CHAT_STATUS' }, (response) => {
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
                    this.safeSendMessage(tab.id, message, () => {
                        // Checking lastError inside the callback suppresses the "Unchecked runtime.lastError"
                        const err = chrome.runtime.lastError;
                        if (err &&
                            !err.message?.includes('Receiving end does not exist') &&
                            !err.message?.includes('Could not establish connection')) {
                            console.debug(`[GeminiBridge v7] Failed to broadcast to tab ${tab.id}:`, err);
                        }
                    });
                }
                catch (e) {
                    // This catch block might not be reached for async sendMessage errors,
                    // but good for synchronous ones.
                }
            }
        }
    }
    notifyPopup(message) {
        try {
            chrome.runtime.sendMessage(message, () => {
                void chrome.runtime.lastError;
            });
        }
        catch {
            // ignore when popup is closed
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
    async saveTabPausedChannels() {
        const serialized = {};
        for (const [tabId, channels] of this.tabPausedChannels.entries()) {
            if (channels.size > 0) {
                serialized[String(tabId)] = Array.from(channels);
            }
        }
        await chrome.storage.local.set({
            [STORAGE_KEYS.tabPausedChannels]: serialized,
        });
    }
    setChannelPaused(tabId, channelId, paused) {
        if (!channelId)
            return;
        let set = this.tabPausedChannels.get(tabId);
        if (!set) {
            set = new Set();
            this.tabPausedChannels.set(tabId, set);
        }
        if (paused)
            set.add(channelId);
        else
            set.delete(channelId);
        if (set.size === 0) {
            this.tabPausedChannels.delete(tabId);
        }
        void this.saveTabPausedChannels();
    }
    getTabPausedChannels(tabId) {
        if (!tabId)
            return [];
        return Array.from(this.tabPausedChannels.get(tabId) || []);
    }
    isChannelPausedOnTab(tabId, channelId) {
        if (!channelId)
            return false;
        return this.tabPausedChannels.get(tabId)?.has(channelId) || false;
    }
    /**
     * Track active channel selection per tab
     */
    setTabActiveChannel(tabId, channelId) {
        if (channelId) {
            this.tabActiveChannels.set(tabId, channelId);
        }
        else {
            this.tabActiveChannels.delete(tabId);
        }
        void this.saveTabActiveChannels();
    }
    getTabActiveChannel(tabId) {
        if (!tabId)
            return null;
        return this.tabActiveChannels.get(tabId) || null;
    }
    normalizeChannelName(name) {
        return String(name || '')
            .trim()
            .replace(/\s+/g, ' ')
            .toLowerCase();
    }
    extractYouTubeUrls(text) {
        const value = String(text || '');
        const matches = value.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=[\w-]{11}[\w=&-]*|youtu\.be\/[\w-]{11}[\w?=&-]*)/gi) || [];
        const unique = Array.from(new Set(matches.map((m) => m.trim())));
        return unique;
    }
    toQueueItems(urls) {
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
    getDefaultProcessingState() {
        return {
            isProcessing: false,
            isPaused: false,
            currentIndex: 0,
            totalCount: 0,
            currentVideo: null,
            lastUpdated: Date.now(),
        };
    }
    setupAlarmHandlers() {
        chrome.alarms.onAlarm.addListener((alarm) => {
            if (alarm.name === AI_VIDEO_PROCESS_ALARM) {
                void this.processAIVideoTick();
            }
        });
    }
    async getYouTubeAuthToken() {
        const now = Date.now();
        const stored = await chrome.storage.local.get([
            'ai_studio_token',
            'youtubeToken',
            'youtubeTokenExpiry',
        ]);
        const storedYoutubeToken = String(stored.youtubeToken || '').trim();
        const storedAiStudioToken = String(stored.ai_studio_token || '').trim();
        const expiry = Number(stored.youtubeTokenExpiry || 0);
        if (storedYoutubeToken && expiry > now)
            return storedYoutubeToken;
        if (storedAiStudioToken && (!expiry || expiry > now))
            return storedAiStudioToken;
        return null;
    }
    async validateYouTubeToken(token) {
        if (!token)
            return false;
        try {
            await this.youtubeApiGet('channels?part=id&mine=true&maxResults=1', token);
            return true;
        }
        catch {
            return false;
        }
    }
    async youtubeApiGet(path, token) {
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
    async fetchYouTubeChannels() {
        const token = await this.getYouTubeAuthToken();
        if (!token)
            throw new Error('Not authenticated');
        const data = await this.youtubeApiGet('channels?part=snippet,contentDetails&mine=true&maxResults=50', token);
        const items = Array.isArray(data?.items) ? data.items : [];
        return items.map((item) => ({
            id: String(item?.id || ''),
            title: String(item?.snippet?.title || 'Untitled Channel'),
            description: String(item?.snippet?.description || ''),
            thumbnail: String(item?.snippet?.thumbnails?.default?.url || ''),
            uploadsPlaylistId: String(item?.contentDetails?.relatedPlaylists?.uploads || ''),
        }));
    }
    async fetchYouTubePlaylistsForChannel(token, channelId) {
        const data = await this.youtubeApiGet(`playlists?part=snippet,contentDetails&channelId=${encodeURIComponent(channelId)}&maxResults=50`, token);
        const items = Array.isArray(data?.items) ? data.items : [];
        return items.map((item) => ({
            id: String(item?.id || ''),
            title: String(item?.snippet?.title || 'Untitled Playlist'),
            description: String(item?.snippet?.description || ''),
            videoCount: Number(item?.contentDetails?.itemCount || 0),
            thumbnail: String(item?.snippet?.thumbnails?.medium?.url || ''),
            channelId: String(channelId || ''),
        }));
    }
    async fetchYouTubePlaylists() {
        const token = await this.getYouTubeAuthToken();
        if (!token)
            throw new Error('Not authenticated');
        const playlists = await youtube_service.getPlaylists();
        return playlists.map((playlist) => ({
            id: String(playlist?.id || ''),
            title: String(playlist?.title || 'Untitled Playlist'),
            description: String(playlist?.description || ''),
            videoCount: Number(playlist?.videoCount || 0),
            thumbnail: String(playlist?.thumbnail || ''),
        }));
    }
    async readSelectedYouTubeChannelId() {
        const stored = await chrome.storage.local.get(['ai_studio_channel_id']);
        return String(stored.ai_studio_channel_id || '').trim();
    }
    async fetchYouTubePlaylistsBundle() {
        const playlists = await this.fetchYouTubePlaylists();
        return {
            playlists,
            channels: [],
            selectedChannelId: '',
            requiresChannelSelection: false,
        };
    }
    getOAuthDiagnostics() {
        const manifest = chrome.runtime.getManifest();
        const clientId = String(manifest.oauth2?.client_id || '').trim();
        const scopes = Array.isArray(manifest.oauth2?.scopes) ? manifest.oauth2.scopes : [];
        const redirectUri = chrome.identity.getRedirectURL();
        return {
            extensionId: chrome.runtime.id,
            clientId,
            redirectUri,
            scopes,
        };
    }
    async getAuthTokenInteractive(scopes) {
        const diagnostics = this.getOAuthDiagnostics();
        const scopeParam = encodeURIComponent(scopes.join(' '));
        const authUrl = `https://accounts.google.com/o/oauth2/auth?` +
            `client_id=${encodeURIComponent(diagnostics.clientId)}` +
            `&response_type=token` +
            `&redirect_uri=${encodeURIComponent(diagnostics.redirectUri)}` +
            `&scope=${scopeParam}` +
            `&prompt=select_account` +
            `&include_granted_scopes=true`;
        return new Promise((resolve, reject) => {
            chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (redirectUrl) => {
                if (chrome.runtime.lastError || !redirectUrl) {
                    reject(chrome.runtime.lastError || new Error('OAuth account chooser failed'));
                    return;
                }
                try {
                    const parsed = new URL(redirectUrl);
                    const hash = parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash;
                    const params = new URLSearchParams(hash);
                    const token = String(params.get('access_token') || '').trim();
                    if (!token) {
                        const error = String(params.get('error') || 'oauth_error').trim();
                        reject(new Error(`OAuth failed: ${error}`));
                        return;
                    }
                    resolve(token);
                }
                catch (err) {
                    reject(new Error(err?.message || 'OAuth redirect parse failed'));
                }
            });
        });
    }
    async fetchGoogleUserProfile(token) {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch Google profile (${response.status})`);
        }
        const data = await response.json();
        return {
            email: String(data?.email || ''),
            name: String(data?.name || ''),
            picture: String(data?.picture || ''),
        };
    }
    async authenticateYouTube() {
        const { scopes: youtubeScopes } = this.getOAuthDiagnostics();
        // Use Chrome extension native OAuth flow for extension client IDs.
        // launchWebAuthFlow can trigger redirect_uri_mismatch for extension-only OAuth clients.
        const youtubeToken = await this.getAuthTokenInteractive(youtubeScopes);
        const valid = await this.validateYouTubeToken(youtubeToken);
        if (!valid) {
            throw new Error('YouTube token validation failed after OAuth');
        }
        const primaryProfile = await this.fetchGoogleUserProfile(youtubeToken);
        const stored = await chrome.storage.local.get(['lastAuthAccount']);
        const priorAccount = String(stored.lastAuthAccount || '')
            .trim()
            .toLowerCase();
        const nextAccount = String(primaryProfile.email || '')
            .trim()
            .toLowerCase();
        const accountSwitched = !!priorAccount && !!nextAccount && priorAccount !== nextAccount;
        if (accountSwitched) {
            await chrome.storage.local.remove([
                'ai_studio_channel_id',
                'cachedPlaylists',
                'cachedVideos',
            ]);
        }
        return { token: youtubeToken, primaryProfile, accountSwitched };
    }
    normalizeOAuthError(err) {
        const msg = String(err?.message || err || 'Authentication failed');
        if (msg.includes('redirect_uri_mismatch') ||
            msg.includes('invalid_request') ||
            msg.includes('OAuth2 not granted or revoked')) {
            const diagnostics = this.getOAuthDiagnostics();
            return new Error(`OAuth setup mismatch for extension identity. Ensure OAuth client is Chrome Extension type bound to extension ID ${diagnostics.extensionId} and client_id ${diagnostics.clientId}. Redirect URI should be ${diagnostics.redirectUri}`);
        }
        return new Error(msg);
    }
    async authenticateYouTubeSafe() {
        try {
            const stored = await chrome.storage.local.get(['youtubeToken', 'ai_studio_token']);
            const tokens = [stored.youtubeToken, stored.ai_studio_token]
                .map((t) => String(t || '').trim())
                .filter(Boolean);
            for (const token of tokens) {
                await new Promise((resolve) => {
                    chrome.identity.removeCachedAuthToken({ token }, () => resolve());
                });
            }
            await new Promise((resolve) => chrome.identity.clearAllCachedAuthTokens(() => resolve()));
            await chrome.storage.local.remove(['ai_studio_token', 'youtubeToken', 'youtubeTokenExpiry']);
            return await this.authenticateYouTube();
        }
        catch (err) {
            throw this.normalizeOAuthError(err);
        }
    }
    async signOutYouTube() {
        const result = await chrome.storage.local.get(['ai_studio_token', 'youtubeToken']);
        const tokens = [result.ai_studio_token, result.youtubeToken]
            .map((t) => String(t || '').trim())
            .filter(Boolean);
        await new Promise((resolve) => {
            chrome.storage.local.remove([
                'ai_studio_token',
                'youtubeToken',
                'youtubeTokenExpiry',
                'ai_studio_channel_id',
                'userProfile',
                'lastAuthAccount',
                'isAuthenticated',
            ], () => resolve());
        });
        for (const token of Array.from(new Set(tokens))) {
            await new Promise((resolve) => {
                chrome.identity.removeCachedAuthToken({ token }, () => resolve());
            });
        }
        await new Promise((resolve) => {
            chrome.identity.clearAllCachedAuthTokens(() => resolve());
        });
    }
    async fetchPlaylistVideos(playlistId) {
        const token = await this.getYouTubeAuthToken();
        if (!token)
            throw new Error('Not authenticated');
        if (!playlistId)
            throw new Error('Missing playlist id');
        const videos = await youtube_service.getPlaylistVideos(playlistId);
        return videos
            .map((video) => {
            const videoId = String(video?.id || '').trim();
            if (!videoId)
                return null;
            return {
                id: videoId,
                title: String(video?.title || `YouTube Video ${videoId}`),
                url: `https://www.youtube.com/watch?v=${videoId}`,
                channelTitle: String(video?.channelTitle || ''),
                thumbnail: String(video?.thumbnail ||
                    `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/mqdefault.jpg`),
                addedAt: Date.now(),
            };
        })
            .filter(Boolean);
    }
    async fetchVideoDetails(videoIds) {
        const token = await this.getYouTubeAuthToken();
        if (!token)
            throw new Error('Not authenticated');
        const ids = videoIds.map((id) => String(id || '').trim()).filter(Boolean);
        if (ids.length === 0)
            return [];
        const details = await youtube_service.getVideoDetails(ids);
        return details.map((item) => ({
            id: String(item?.id || ''),
            title: String(item?.title || ''),
            channelTitle: String(item?.channelTitle || ''),
            durationISO: String(item?.durationISO || ''),
            viewCount: Number(item?.viewCount || 0),
            likeCount: Number(item?.likeCount || 0),
        }));
    }
    async createYouTubePlaylist(title, description) {
        await youtube_service.ensureAuthenticated();
        const data = await youtube_service.createPlaylist(title, description || 'Created by Fuse Connect AIVI', 'private');
        return {
            id: String(data?.id || ''),
            title: String(data?.snippet?.title || title),
            description: String(data?.snippet?.description || data?.description || ''),
        };
    }
    async processAIVideoTick() {
        // Keep this stub for compatibility or clear the alarm if it still triggers
        chrome.alarms.clear(AI_VIDEO_PROCESS_ALARM);
    }
    // --- AI STUDIO ORCHESTRATOR START ---
    async createNewAIStudioTab() {
        console.log('🆕 Creating new AI Studio tab...');
        const tab = await chrome.tabs.create({
            url: 'https://aistudio.google.com/app/prompts/new_chat?model=gemini-3-flash-preview',
            active: true,
        });
        // Wait for tab to load
        await new Promise((resolve) => {
            const checkReady = setInterval(async () => {
                try {
                    if (tab.id) {
                        const response = await this.safeSendMessage(tab.id, { action: 'PING' });
                        if (response?.alive) {
                            clearInterval(checkReady);
                            resolve();
                        }
                    }
                }
                catch (e) {
                    // Content script not ready yet
                }
            }, 1000);
            // Timeout after 30 seconds
            setTimeout(() => {
                clearInterval(checkReady);
                resolve();
            }, 30000);
        });
        // Extra wait for UI to be fully ready
        await new Promise((r) => setTimeout(r, 2000));
        return tab;
    }
    async sendTaskAndWait(tabId, task, timeout = 700000) {
        return new Promise((resolve, reject) => {
            this.pendingTaskResolve = resolve;
            this.safeSendMessage(tabId, { action: 'EXECUTE_TASK', task }).catch((err) => {
                console.error('Failed to send task:', err);
                resolve({ error: err.message });
            });
            // Timeout
            setTimeout(() => {
                if (this.pendingTaskResolve) {
                    this.pendingTaskResolve = null;
                    resolve({ timeout: true });
                }
            }, timeout);
        });
    }
    async closeTab(tabId) {
        try {
            await chrome.tabs.remove(tabId);
        }
        catch (e) {
            console.log('Tab already closed');
        }
    }
    async startAutomationOrchestrator(queue, nextState, segmentDuration = 45, processingLevel = 'ai_studio') {
        this.automationRunning = true;
        this.automationPaused = false;
        const segmentDurationSecs = segmentDuration * 60;
        for (let videoIndex = 0; videoIndex < queue.length; videoIndex++) {
            if (!this.automationRunning)
                break;
            while (this.automationPaused)
                await new Promise((r) => setTimeout(r, 1000));
            const video = queue[videoIndex];
            const videoId = String(video.id || '');
            const videoTitle = String(video.title || 'Untitled');
            const videoUrl = String(video.url || '');
            const currentState = {
                ...nextState,
                currentIndex: videoIndex,
                currentVideo: video,
                lastUpdated: Date.now(),
            };
            await chrome.storage.local.set({ processingState: currentState });
            this.broadcastToTabs({ type: 'AI_VIDEO_PROCESSING_UPDATE', state: currentState });
            try {
                if (processingLevel !== 'ai_studio') {
                    const reportContent = await this.buildLightweightReport(video, processingLevel);
                    const report = {
                        id: `report-${Date.now()}-${videoId}`,
                        videoId,
                        title: videoTitle,
                        url: videoUrl,
                        processedAt: Date.now(),
                        processingLevel,
                        summary: String(reportContent).slice(0, 1200),
                        content: reportContent,
                        segmentIndex: 0,
                    };
                    const result = await chrome.storage.local.get('ai_video_reports');
                    const reports = Array.isArray(result.ai_video_reports) ? result.ai_video_reports : [];
                    await chrome.storage.local.set({
                        ai_video_reports: [report, ...reports].slice(0, 500),
                    });
                    const pCountResult = await chrome.storage.local.get('ai_video_processed_count');
                    await chrome.storage.local.set({
                        ai_video_processed_count: (pCountResult.ai_video_processed_count || 0) + 1,
                    });
                    await new Promise((r) => setTimeout(r, 400));
                    continue;
                }
                let duration = video.duration || 0;
                if (!duration && video.url) {
                    const durationTab = await this.createNewAIStudioTab();
                    if (durationTab.id) {
                        const durationResult = await this.sendTaskAndWait(durationTab.id, {
                            type: 'GET_DURATION',
                            url: video.url,
                        }, 60000);
                        await this.closeTab(durationTab.id);
                        if (durationResult.duration) {
                            duration = durationResult.duration;
                        }
                    }
                }
                const segments = [];
                if (duration > segmentDurationSecs) {
                    let currentStart = 0;
                    let segIndex = 0;
                    while (currentStart < duration) {
                        const segEnd = Math.min(currentStart + segmentDurationSecs, duration);
                        segments.push({ index: segIndex++, startTime: currentStart, endTime: segEnd });
                        currentStart = segEnd;
                    }
                }
                else {
                    segments.push({ index: 0, startTime: 0, endTime: null });
                }
                for (const segment of segments) {
                    if (!this.automationRunning)
                        break;
                    while (this.automationPaused)
                        await new Promise((r) => setTimeout(r, 1000));
                    const processTab = await this.createNewAIStudioTab();
                    if (processTab.id) {
                        const processResult = await this.sendTaskAndWait(processTab.id, {
                            type: 'PROCESS_SEGMENT',
                            url: video.url,
                            title: video.title,
                            videoId: video.id,
                            startTime: segment.startTime,
                            endTime: segment.endTime,
                            segmentIndex: segment.index,
                        });
                        await this.closeTab(processTab.id);
                        // Handle report content
                        if (processResult.success && processResult.reportContent) {
                            const report = {
                                id: `report-${Date.now()}-${videoId}`,
                                videoId,
                                title: videoTitle,
                                url: videoUrl,
                                processedAt: Date.now(),
                                processingLevel,
                                summary: String(processResult.reportContent || '').slice(0, 1200),
                                content: processResult.reportContent,
                                segmentIndex: segment.index,
                            };
                            const result = await chrome.storage.local.get('ai_video_reports');
                            const reports = Array.isArray(result.ai_video_reports) ? result.ai_video_reports : [];
                            await chrome.storage.local.set({
                                ai_video_reports: [report, ...reports].slice(0, 500),
                            });
                            const pCountResult = await chrome.storage.local.get('ai_video_processed_count');
                            await chrome.storage.local.set({
                                ai_video_processed_count: (pCountResult.ai_video_processed_count || 0) + 1,
                            });
                        }
                    }
                    await new Promise((r) => setTimeout(r, 2000));
                }
            }
            catch (err) {
                console.error('Error processing video:', err.message);
            }
            await new Promise((r) => setTimeout(r, 3000));
        }
        this.automationRunning = false;
        const finalState = {
            isProcessing: false,
            isPaused: false,
            currentIndex: queue.length,
            totalCount: queue.length,
            currentVideo: null,
            lastUpdated: Date.now(),
        };
        await chrome.storage.local.set({ processingState: finalState });
        this.broadcastToTabs({ type: 'AI_VIDEO_PROCESSING_UPDATE', state: finalState });
        this.logEvent('ai-video', 'processing_completed', { totalCount: queue.length });
    }
    extractYouTubeVideoId(urlOrId) {
        const raw = String(urlOrId || '').trim();
        if (/^[\w-]{11}$/.test(raw))
            return raw;
        const match = raw.match(/(?:v=|youtu\.be\/)([\w-]{11})/i);
        return String(match?.[1] || '').trim();
    }
    parseTranscriptXml(xml) {
        const segments = Array.from(String(xml || '').matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)).map((m) => m[1] || '');
        const decode = (s) => s
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"');
        return segments
            .map((s) => decode(String(s)
            .replace(/<[^>]+>/g, '')
            .trim()))
            .filter(Boolean)
            .join(' ')
            .trim();
    }
    async fetchVideoTranscript(videoId) {
        if (!videoId)
            return '';
        try {
            const response = await fetch(`https://www.youtube.com/api/timedtext?lang=en&v=${encodeURIComponent(videoId)}`);
            if (!response.ok)
                return '';
            const xml = await response.text();
            return this.parseTranscriptXml(xml);
        }
        catch {
            return '';
        }
    }
    buildSentenceSummary(text, maxSentences) {
        const sentences = String(text || '')
            .split(/(?<=[.!?])\s+/)
            .map((s) => s.trim())
            .filter(Boolean);
        return sentences.slice(0, maxSentences).join(' ');
    }
    async buildLightweightReport(video, processingLevel) {
        const videoId = this.extractYouTubeVideoId(String(video?.id || video?.url || ''));
        const details = videoId ? await this.fetchVideoDetails([videoId]).catch(() => []) : [];
        const metadata = Array.isArray(details) && details.length > 0 ? details[0] : null;
        const transcript = await this.fetchVideoTranscript(videoId);
        const base = [
            `# ${String(video?.title || metadata?.title || 'Untitled Video')}`,
            '',
            `- URL: ${String(video?.url || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : ''))}`,
            `- Channel: ${String(video?.channelTitle || metadata?.channelTitle || 'Unknown')}`,
            `- Processing Level: ${processingLevel}`,
            '',
        ];
        if (processingLevel === 'transcript') {
            return `${base.join('\n')}## Transcript\n\n${transcript || 'Transcript unavailable.'}\n`;
        }
        if (processingLevel === 'flash') {
            const summary = this.buildSentenceSummary(transcript, 6);
            return `${base.join('\n')}## Quick Summary\n\n${summary || 'Transcript unavailable for summary.'}\n\n## Transcript Excerpt\n\n${String(transcript || '').slice(0, 4000)}\n`;
        }
        const summary = this.buildSentenceSummary(transcript, 14);
        return `${base.join('\n')}## Extended Summary\n\n${summary || 'Transcript unavailable for summary.'}\n\n## Key Details\n\n- Duration ISO: ${String(metadata?.durationISO || 'Unknown')}\n- Views: ${Number(metadata?.viewCount || 0).toLocaleString()}\n\n## Transcript Excerpt\n\n${String(transcript || '').slice(0, 8000)}\n`;
    }
    // --- AI STUDIO ORCHESTRATOR END ---
    findChannelByName(name) {
        const target = this.normalizeChannelName(name);
        if (!target)
            return null;
        for (const channel of this.channels.values()) {
            if (this.normalizeChannelName(channel.name) === target) {
                return channel;
            }
        }
        return null;
    }
    remapChannelReferences(oldId, newId) {
        if (!oldId || !newId || oldId === newId)
            return;
        if (this.joinedChannels.delete(oldId)) {
            this.joinedChannels.add(newId);
        }
        for (const [tabId, channelId] of this.tabActiveChannels.entries()) {
            if (channelId === oldId) {
                this.tabActiveChannels.set(tabId, newId);
                this.safeSendMessage(tabId, { type: 'CHANNEL_SELECTED', channelId: newId });
            }
        }
        void this.saveTabActiveChannels();
    }
    shouldPreferIncomingChannel(existingChannel, incomingChannel) {
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
    setupTabLifecycleHandlers() {
        chrome.tabs.onCreated.addListener((tab) => {
            this.logEvent('browser.tabs', 'created', {
                tabId: tab.id || null,
                url: tab.url || null,
                active: !!tab.active,
            });
        });
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (!changeInfo.status && !changeInfo.url)
                return;
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
    logEvent(category, event, details = {}, level = 'info') {
        if (!this.eventLoggingEnabled)
            return;
        const entry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            ts: Date.now(),
            level,
            category,
            event,
            details,
        };
        this.extensionEventLog.push(entry);
        if (this.extensionEventLog.length > this.EVENT_LOG_LIMIT) {
            this.extensionEventLog = this.extensionEventLog.slice(this.extensionEventLog.length - this.EVENT_LOG_LIMIT);
        }
        if (this.eventLogFlushTimer) {
            clearTimeout(this.eventLogFlushTimer);
        }
        this.eventLogFlushTimer = setTimeout(() => {
            chrome.storage.local.set({ [STORAGE_KEYS.eventLog]: this.extensionEventLog });
            this.eventLogFlushTimer = null;
        }, 750);
    }
    /**
     * Send native message to control services
     */
    async sendNativeMessage(message) {
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
                        const hostMissing = errMsg.includes('Specified native messaging host not found') ||
                            errMsg.includes('No such native application');
                        if (hostMissing) {
                            this.nativeHostUnavailable = true;
                            if (!this.nativeHostMissingLogged) {
                                this.nativeHostMissingLogged = true;
                                console.debug('[NativeMessaging] Native host not installed; native service controls disabled');
                            }
                        }
                        else {
                            // Silent - native messaging not available in dev mode
                        }
                        resolve({ error: errMsg, unavailable: hostMissing });
                    }
                    else {
                        resolve(response || {});
                    }
                });
            }
            catch (e) {
                console.error('[NativeMessaging] Exception:', e);
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
        this.safeSendMessage(agent.metadata.tabId, {
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
                    console.log('[GeminiBridge v7] Received TEST_PING');
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
                        connectionStatus: this.primaryConnection?.readyState === WebSocket.OPEN ? 'connected' : 'disconnected',
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
                        if (category && item.category !== category)
                            return false;
                        if (level && item.level !== level)
                            return false;
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
                    }
                    else {
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
                case 'YOUTUBE_AUTHENTICATE':
                    // Handle AI Studio OAuth2 authentication.
                    console.log('[GeminiBridge v7] Starting YouTube auth flow', this.getOAuthDiagnostics());
                    this.authenticateYouTubeSafe()
                        .then(({ token, primaryProfile, accountSwitched }) => {
                        const tokenExpiry = Date.now() + 50 * 60 * 1000;
                        chrome.storage.local.set({
                            ai_studio_token: token,
                            youtubeToken: token,
                            youtubeTokenExpiry: tokenExpiry,
                            userProfile: primaryProfile,
                            lastAuthAccount: primaryProfile?.email || '',
                            ai_studio_channel_id: '',
                            isAuthenticated: true,
                        }, () => {
                            chrome.storage.local.get(['firstAuthAt'], (existing) => {
                                if (!existing.firstAuthAt) {
                                    chrome.storage.local.set({ firstAuthAt: Date.now() });
                                }
                            });
                            sendResponse({
                                success: true,
                                token,
                                data: { authenticated: true, primaryProfile },
                                oauth: this.getOAuthDiagnostics(),
                                channels: [],
                                selectedChannelId: '',
                                requiresChannelSelection: false,
                                accountSwitched,
                            });
                        });
                    })
                        .catch((err) => {
                        sendResponse({
                            success: false,
                            error: err.message || 'Authentication failed',
                            oauth: this.getOAuthDiagnostics(),
                        });
                    });
                    return true; // Async response
                    // removed by dead control flow

                case 'YOUTUBE_SIGN_OUT':
                    this.signOutYouTube()
                        .then(() => sendResponse({ success: true }))
                        .catch((error) => sendResponse({ success: false, error: String(error?.message || error) }));
                    return true;
                case 'YOUTUBE_CHECK_AUTH':
                    this.getYouTubeAuthToken()
                        .then(async (token) => {
                        const authenticated = token ? await this.validateYouTubeToken(token) : false;
                        if (!authenticated) {
                            await chrome.storage.local.remove(['ai_studio_token', 'youtubeToken']);
                        }
                        sendResponse({
                            success: true,
                            data: { authenticated },
                        });
                    })
                        .catch(() => {
                        sendResponse({ success: true, data: { authenticated: false } });
                    });
                    return true;
                case 'AI_STUDIO_GET_CHANNELS':
                    sendResponse({ success: true, channels: [], selectedChannelId: '' });
                    return true;
                case 'AI_STUDIO_SET_CHANNEL': {
                    sendResponse({ success: true, channelId: '' });
                    return true;
                }
                case 'AI_STUDIO_GET_PLAYLISTS':
                    this.fetchYouTubePlaylistsBundle()
                        .then((bundle) => {
                        sendResponse({ success: true, ...bundle });
                    })
                        .catch((error) => {
                        const err = String(error?.message || error || '');
                        const normalized = err.includes('Quota Protection') ? 'Not authenticated' : err;
                        sendResponse({ success: false, error: normalized });
                    });
                    return true;
                case 'YOUTUBE_GET_PLAYLISTS':
                    this.fetchYouTubePlaylistsBundle()
                        .then((bundle) => {
                        sendResponse({ success: true, data: bundle.playlists, ...bundle });
                    })
                        .catch((error) => {
                        const err = String(error?.message || error || '');
                        const normalized = err.includes('Quota Protection') ? 'Not authenticated' : err;
                        sendResponse({ success: false, error: normalized });
                    });
                    return true;
                case 'QUEUE_ADD':
                case 'QUEUE_ADD_SINGLE': {
                    const videos = message.type === 'QUEUE_ADD_SINGLE' ? [message.data?.video] : message.data?.videos;
                    chrome.storage.local.get(['videoQueue'], (result) => {
                        const existing = Array.isArray(result.videoQueue) ? result.videoQueue : [];
                        const incoming = Array.isArray(videos) ? videos : [];
                        const next = [
                            ...existing,
                            ...incoming
                                .filter((v) => v && (v.url || v.id))
                                .map((v, idx) => {
                                const url = String(v.url || (v.id ? `https://www.youtube.com/watch?v=${v.id}` : '')).trim();
                                const id = String(v.id || '').trim() || `vid-${Date.now()}-${idx}`;
                                return {
                                    id,
                                    title: String(v.title || `YouTube Video ${id}`),
                                    url,
                                    addedAt: Number(v.addedAt || Date.now()),
                                };
                            }),
                        ];
                        chrome.storage.local.set({ videoQueue: next, syncTimestamp: Date.now() }, () => {
                            sendResponse({ success: true, data: next });
                        });
                    });
                    return true;
                }
                case 'QUEUE_REMOVE': {
                    const ids = Array.isArray(message.data?.videoIds)
                        ? message.data.videoIds.map((id) => String(id))
                        : [];
                    chrome.storage.local.get(['videoQueue'], (result) => {
                        const existing = Array.isArray(result.videoQueue) ? result.videoQueue : [];
                        const next = existing.filter((item) => !ids.includes(String(item?.id || '')));
                        chrome.storage.local.set({ videoQueue: next, syncTimestamp: Date.now() }, () => {
                            sendResponse({ success: true, data: next });
                        });
                    });
                    return true;
                }
                case 'QUEUE_CLEAR':
                    chrome.storage.local.set({ videoQueue: [], syncTimestamp: Date.now() }, () => {
                        sendResponse({ success: true, data: [] });
                    });
                    return true;
                case 'QUEUE_GET':
                    chrome.storage.local.get(['videoQueue'], (result) => {
                        const queue = Array.isArray(result.videoQueue) ? result.videoQueue : [];
                        sendResponse({ success: true, data: queue });
                    });
                    return true;
                case 'STORAGE_GET':
                    chrome.storage.local.get(message.data?.keys || null, (result) => {
                        sendResponse({ success: true, data: result });
                    });
                    return true;
                case 'STORAGE_SET':
                    chrome.storage.local.set(message.data?.items || {}, () => {
                        sendResponse({ success: true, data: true });
                    });
                    return true;
                case 'AI_STUDIO_READY':
                    sendResponse({ success: true, data: { ready: true } });
                    return false;
                case 'AI_STUDIO_PROGRESS': {
                    const data = message.data || {};
                    chrome.storage.local.get(['processingState'], (result) => {
                        const current = (result.processingState ||
                            this.getDefaultProcessingState());
                        const next = {
                            ...current,
                            isProcessing: true,
                            isPaused: false,
                            currentIndex: Number(data.currentIndex || current.currentIndex || 0),
                            currentVideo: (data.currentVideo ||
                                current.currentVideo ||
                                null),
                            lastUpdated: Date.now(),
                        };
                        chrome.storage.local.set({ processingState: next }, () => {
                            this.broadcastToTabs({ type: 'AI_VIDEO_PROCESSING_UPDATE', state: next });
                            sendResponse({ success: true, data: { updated: true } });
                        });
                    });
                    return true;
                }
                case 'AI_STUDIO_COMPLETE':
                    chrome.storage.local.get(['processingState', 'ai_video_processed_count'], (result) => {
                        const current = (result.processingState ||
                            this.getDefaultProcessingState());
                        const increment = Math.max(1, Number(message.data?.processedCount || 1));
                        const next = {
                            ...current,
                            isProcessing: false,
                            isPaused: false,
                            currentVideo: null,
                            currentIndex: Math.max(current.totalCount || 0, current.currentIndex || 0),
                            lastUpdated: Date.now(),
                        };
                        chrome.storage.local.set({
                            processingState: next,
                            ai_video_processed_count: Number(result.ai_video_processed_count || 0) + increment,
                        }, () => {
                            this.broadcastToTabs({ type: 'AI_VIDEO_PROCESSING_UPDATE', state: next });
                            sendResponse({ success: true, data: { completed: true } });
                        });
                    });
                    return true;
                case 'AI_STUDIO_ERROR':
                    this.logEvent('ai-video', 'automation_error', {
                        error: String(message.data?.error || message.error || 'Unknown error'),
                    }, 'error');
                    sendResponse({ success: true, data: { error: true } });
                    return false;
                case 'REPORTS_GET':
                    chrome.storage.local.get(['ai_video_reports'], (result) => {
                        const reports = Array.isArray(result.ai_video_reports) ? result.ai_video_reports : [];
                        sendResponse({ success: true, data: reports });
                    });
                    return true;
                case 'SUBSCRIPTION_CHECK':
                    sendResponse({
                        success: true,
                        data: {
                            tier: 'free',
                            canProcess: true,
                            notebooklmIntegration: true,
                        },
                    });
                    return false;
                case 'SUBSCRIPTION_CAN_PROCESS':
                    sendResponse({
                        success: true,
                        data: {
                            allowed: true,
                            remaining: 9999,
                        },
                    });
                    return false;
                case 'SUBSCRIPTION_UPGRADE':
                    sendResponse({ success: true, data: { redirected: false } });
                    return false;
                case 'AUTOMATION_START':
                    chrome.storage.local.set({
                        processingLevel: String(message.data?.processingLevel || 'ai_studio'),
                        segmentDuration: Math.max(5, Math.min(300, Number(message.data?.segmentDuration || 45))),
                        reverseOrder: !!message.data?.reverseOrder,
                        videoQueue: Array.isArray(message.data?.queue) ? message.data.queue : [],
                    }, () => {
                        chrome.storage.local.get(['videoQueue'], (result) => {
                            const queue = Array.isArray(result.videoQueue) ? result.videoQueue : [];
                            if (queue.length === 0) {
                                sendResponse({ success: false, error: 'Queue is empty' });
                                return;
                            }
                            const nextState = {
                                isProcessing: true,
                                isPaused: false,
                                currentIndex: 0,
                                totalCount: queue.length,
                                currentVideo: null,
                                lastUpdated: Date.now(),
                            };
                            chrome.storage.local.set({ processingState: nextState, ai_video_total_count: queue.length }, () => {
                                chrome.alarms.create(AI_VIDEO_PROCESS_ALARM, { periodInMinutes: 0.1 });
                                this.broadcastToTabs({ type: 'AI_VIDEO_PROCESSING_UPDATE', state: nextState });
                                sendResponse({ success: true, data: { started: true }, state: nextState });
                            });
                        });
                    });
                    return true;
                case 'AUTOMATION_PAUSE':
                    chrome.storage.local.get(['processingState'], (result) => {
                        const current = (result.processingState ||
                            this.getDefaultProcessingState());
                        const next = {
                            ...current,
                            isPaused: true,
                            lastUpdated: Date.now(),
                        };
                        chrome.storage.local.set({ processingState: next }, () => {
                            chrome.alarms.clear(AI_VIDEO_PROCESS_ALARM);
                            this.broadcastToTabs({ type: 'AI_VIDEO_PROCESSING_UPDATE', state: next });
                            sendResponse({ success: true, data: { paused: true }, state: next });
                        });
                    });
                    return true;
                case 'AUTOMATION_RESUME':
                    chrome.storage.local.get(['processingState'], (result) => {
                        const current = (result.processingState ||
                            this.getDefaultProcessingState());
                        const next = {
                            ...current,
                            isProcessing: true,
                            isPaused: false,
                            lastUpdated: Date.now(),
                        };
                        chrome.storage.local.set({ processingState: next }, () => {
                            chrome.alarms.create(AI_VIDEO_PROCESS_ALARM, { periodInMinutes: 0.1 });
                            this.broadcastToTabs({ type: 'AI_VIDEO_PROCESSING_UPDATE', state: next });
                            sendResponse({ success: true, data: { resumed: true }, state: next });
                        });
                    });
                    return true;
                case 'AUTOMATION_STOP':
                    chrome.storage.local.get(['processingState'], (result) => {
                        const current = (result.processingState ||
                            this.getDefaultProcessingState());
                        const next = {
                            ...current,
                            isProcessing: false,
                            isPaused: false,
                            currentVideo: null,
                            lastUpdated: Date.now(),
                        };
                        chrome.storage.local.set({ processingState: next }, () => {
                            chrome.alarms.clear(AI_VIDEO_PROCESS_ALARM);
                            this.broadcastToTabs({ type: 'AI_VIDEO_PROCESSING_UPDATE', state: next });
                            sendResponse({ success: true, data: { stopped: true }, state: next });
                        });
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
                        const err = String(error?.message || error || '');
                        const normalized = err.includes('Quota Protection') ? 'Not authenticated' : err;
                        sendResponse({ success: false, error: normalized });
                    });
                    return true;
                }
                case 'YOUTUBE_GET_PLAYLIST_VIDEOS': {
                    const playlistId = String(message.playlistId || '') || String(message.data?.playlistId || '');
                    this.fetchPlaylistVideos(playlistId)
                        .then((videos) => {
                        sendResponse({ success: true, data: videos });
                    })
                        .catch((error) => {
                        const err = String(error?.message || error || '');
                        const normalized = err.includes('Quota Protection') ? 'Not authenticated' : err;
                        sendResponse({ success: false, error: normalized });
                    });
                    return true;
                }
                case 'YOUTUBE_GET_VIDEO_DETAILS': {
                    const ids = Array.isArray(message.videoIds)
                        ? message.videoIds
                        : Array.isArray(message.data?.videoIds)
                            ? message.data.videoIds
                            : [];
                    this.fetchVideoDetails(ids)
                        .then((videos) => {
                        sendResponse({ success: true, data: videos });
                    })
                        .catch((error) => {
                        const err = String(error?.message || error || '');
                        const normalized = err.includes('Quota Protection') ? 'Not authenticated' : err;
                        sendResponse({ success: false, error: normalized });
                    });
                    return true;
                }
                case 'YOUTUBE_CREATE_PLAYLIST': {
                    const title = String(message.title || message.data?.title || '').trim();
                    const description = String(message.description || message.data?.description || '').trim();
                    if (!title) {
                        sendResponse({ success: false, error: 'Missing playlist title' });
                        return false;
                    }
                    this.createYouTubePlaylist(title, description)
                        .then((playlist) => {
                        sendResponse({ success: true, data: playlist });
                    })
                        .catch((error) => {
                        sendResponse({ success: false, error: String(error?.message || error) });
                    });
                    return true;
                }
                case 'AI_VIDEO_GET_STATS':
                    chrome.storage.local.get([
                        'ai_video_processed_count',
                        'ai_video_total_count',
                        'ai_video_estimated_cost',
                        'ai_studio_token',
                        'userProfile',
                        'videoQueue',
                    ], (result) => {
                        const profileEmail = String(result.userProfile?.email || '').trim();
                        sendResponse({
                            processed: result.ai_video_processed_count || 0,
                            total: result.ai_video_total_count || result.videoQueue?.length || 0,
                            cost: result.ai_video_estimated_cost || 0,
                            account: result.ai_studio_token ? profileEmail || 'Authenticated' : 'None',
                        });
                    });
                    return true;
                case 'AI_VIDEO_GET_QUEUE':
                    chrome.storage.local.get(['videoQueue', 'reverseOrder', 'segmentDuration', 'processingState', 'syncTimestamp'], (result) => {
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
                    });
                    return true;
                case 'AI_VIDEO_SET_QUEUE': {
                    const rawText = String(message.text || '');
                    const urls = Array.isArray(message.urls) && message.urls.length > 0
                        ? message.urls.map((u) => String(u))
                        : this.extractYouTubeUrls(rawText);
                    const queue = this.toQueueItems(urls);
                    chrome.storage.local.set({
                        videoQueue: queue,
                        syncTimestamp: Date.now(),
                    }, () => {
                        this.logEvent('ai-video', 'queue_set', {
                            count: queue.length,
                        });
                        sendResponse({
                            success: true,
                            queueCount: queue.length,
                        });
                    });
                    return true;
                }
                case 'AI_VIDEO_CLEAR_QUEUE':
                    chrome.storage.local.set({
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
                    }, () => {
                        this.logEvent('ai-video', 'queue_cleared');
                        sendResponse({ success: true });
                    });
                    return true;
                case 'AI_VIDEO_SET_PREFERENCES': {
                    const reverseOrder = !!message.reverseOrder;
                    const segmentDuration = Math.max(5, Math.min(300, Number(message.segmentDuration || 45)));
                    const processingLevel = String(message.processingLevel || 'ai_studio');
                    chrome.storage.local.set({
                        reverseOrder,
                        segmentDuration,
                        processingLevel,
                    }, () => {
                        this.logEvent('ai-video', 'preferences_set', {
                            reverseOrder,
                            segmentDuration,
                            processingLevel,
                        });
                        sendResponse({ success: true });
                    });
                    return true;
                }
                case 'AI_VIDEO_PROCESS_CONTROL': {
                    const action = String(message.action || '').toLowerCase();
                    chrome.storage.local.get(['videoQueue', 'processingState'], (result) => {
                        const queue = Array.isArray(result.videoQueue) ? result.videoQueue : [];
                        const currentState = result.processingState || this.getDefaultProcessingState();
                        if (action === 'start') {
                            if (queue.length === 0) {
                                sendResponse({ success: false, error: 'Queue is empty' });
                                return;
                            }
                            const nextState = {
                                isProcessing: true,
                                isPaused: false,
                                currentIndex: 0,
                                totalCount: queue.length,
                                currentVideo: null,
                                lastUpdated: Date.now(),
                            };
                            chrome.storage.local.set({
                                processingState: nextState,
                                ai_video_total_count: queue.length,
                            }, () => {
                                this.logEvent('ai-video', 'processing_started', { totalCount: queue.length });
                                chrome.storage.local.get(['segmentDuration', 'processingLevel'], (opts) => {
                                    this.startAutomationOrchestrator(queue, nextState, opts.segmentDuration || 45, String(opts.processingLevel || 'ai_studio'));
                                });
                                this.broadcastToTabs({ type: 'AI_VIDEO_PROCESSING_UPDATE', state: nextState });
                                sendResponse({ success: true, state: nextState });
                            });
                            return;
                        }
                        if (action === 'pause') {
                            this.automationPaused = true;
                            const nextState = {
                                ...currentState,
                                isProcessing: currentState.isProcessing,
                                isPaused: true,
                                lastUpdated: Date.now(),
                            };
                            chrome.storage.local.set({ processingState: nextState }, () => {
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
                            this.automationPaused = false;
                            const nextState = {
                                ...currentState,
                                isPaused: false,
                                lastUpdated: Date.now(),
                            };
                            chrome.storage.local.set({ processingState: nextState }, () => {
                                this.logEvent('ai-video', 'processing_resumed', {
                                    currentIndex: nextState.currentIndex,
                                });
                                this.broadcastToTabs({ type: 'AI_VIDEO_PROCESSING_UPDATE', state: nextState });
                                sendResponse({ success: true, state: nextState });
                            });
                            return;
                        }
                        if (action === 'stop' || action === 'clear') {
                            this.automationRunning = false;
                            const nextState = {
                                ...currentState,
                                isProcessing: false,
                                isPaused: false,
                                currentVideo: null,
                                lastUpdated: Date.now(),
                            };
                            chrome.storage.local.set({ processingState: nextState }, () => {
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
                    const pageUrl = page === 'notebooklm'
                        ? 'https://notebooklm.google.com/'
                        : page === 'dashboard'
                            ? 'https://connect.thenewfuse.com/'
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
                    chrome.storage.local.get(['videoQueue', 'ai_studio_queue', 'ai_video_reports'], (result) => {
                        let content = '';
                        const format = String(message.format || 'urls');
                        if (format === 'reports-md') {
                            const reports = Array.isArray(result.ai_video_reports)
                                ? result.ai_video_reports
                                : [];
                            content = reports
                                .map((r) => `## ${String(r.title || 'Untitled')}\n\n- URL: ${String(r.url || '')}\n- Processed: ${new Date(Number(r.processedAt || Date.now())).toISOString()}\n- Level: ${String(r.processingLevel || 'ai_studio')}\n\n${String(r.summary || '')}\n`)
                                .join('\n');
                        }
                        else if (format === 'urls') {
                            content = (result.videoQueue || []).map((v) => v.url).join('\n');
                        }
                        else {
                            content = JSON.stringify(result.videoQueue || [], null, 2);
                        }
                        sendResponse({ content });
                    });
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
                case 'TASK_ERROR':
                    if (this.pendingTaskResolve) {
                        this.pendingTaskResolve(message);
                        this.pendingTaskResolve = null;
                    }
                    this.broadcastToTabs(message);
                    sendResponse({ success: true });
                    break;
                case 'CONTENT_SCRIPT_READY':
                    console.log('📢 Content script ready on:', message.url);
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
                    const newChannel = {
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
                        this.safeSendMessage(sender.tab.id, {
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
                        this.safeSendMessage(sender.tab.id, {
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
                    this.safeSendMessage(sender.tab.id, {
                        type: 'CHANNEL_PAUSE_UPDATE',
                        channelId,
                        paused: true,
                        pausedChannels: this.getTabPausedChannels(sender.tab.id),
                    }, () => {
                        const err = chrome.runtime.lastError;
                        if (err) {
                            this.logEvent('channel', 'pause_update_delivery_error', {
                                tabId: sender.tab?.id ?? null,
                                channelId,
                                error: err.message,
                            });
                        }
                        sendResponse({ success: true, delivered: !err });
                    });
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
                    this.safeSendMessage(sender.tab.id, {
                        type: 'CHANNEL_PAUSE_UPDATE',
                        channelId,
                        paused: false,
                        pausedChannels: this.getTabPausedChannels(sender.tab.id),
                    }, () => {
                        const err = chrome.runtime.lastError;
                        if (err) {
                            this.logEvent('channel', 'resume_update_delivery_error', {
                                tabId: sender.tab?.id ?? null,
                                channelId,
                                error: err.message,
                            });
                        }
                        sendResponse({ success: true, delivered: !err });
                    });
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
                        const status = this.primaryConnection?.readyState === WebSocket.OPEN ? 'connected' : 'disconnected';
                        // Send connection status
                        this.safeSendMessage(sender.tab.id, { type: 'CONNECTION_STATUS', status });
                        // Send Agents
                        this.safeSendMessage(sender.tab.id, {
                            type: 'AGENTS_UPDATE',
                            agents: Array.from(this.agents.values()),
                        });
                        // Send Channels
                        this.safeSendMessage(sender.tab.id, {
                            type: 'CHANNELS_UPDATE',
                            channels: Array.from(this.channels.values()),
                        });
                        // Send Joined Channels
                        this.safeSendMessage(sender.tab.id, {
                            type: 'JOINED_CHANNELS_UPDATE',
                            joinedChannels: Array.from(this.joinedChannels),
                        });
                        this.safeSendMessage(sender.tab.id, {
                            type: 'CHANNEL_SELECTED',
                            channelId: this.getTabActiveChannel(sender.tab.id),
                        });
                        this.safeSendMessage(sender.tab.id, {
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
                                const checkResult = await this.safeSendMessage(tabs[0].id, { type: 'PING' });
                                if (checkResult) {
                                    // Already injected, just show the panel
                                    this.safeSendMessage(tabs[0].id, { type: 'SHOW_PANEL' });
                                    sendResponse({ success: true, alreadyActive: true });
                                }
                                else {
                                    // Inject content script
                                    await chrome.scripting.executeScript({
                                        target: { tabId: tabs[0].id },
                                        files: ['content/index.js'],
                                    });
                                    console.log(`[GeminiBridge v7] Content script injected into tab ${tabs[0].id}`);
                                    // Wait a moment for initialization, then show panel
                                    setTimeout(() => {
                                        if (tabs[0]?.id) {
                                            this.safeSendMessage(tabs[0].id, { type: 'SHOW_PANEL' });
                                        }
                                    }, 500);
                                    sendResponse({ success: true, injected: true });
                                }
                            }
                            catch (error) {
                                console.error('[GeminiBridge v7] Failed to activate on tab:', error);
                                sendResponse({ success: false, error: error.message });
                            }
                        }
                        else {
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
                        : this.injectMessageToActiveTab(message.content))
                        .then(() => {
                        this.logEvent('chat', 'inject_message', {
                            tabId: sender.tab?.id ?? null,
                            preview: String(message.content || '').slice(0, 120),
                        });
                        sendResponse({ success: true });
                    })
                        .catch((error) => {
                        console.error('[GeminiBridge v7] Error injecting message:', error);
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
                        if (hostname.includes('gemini.google'))
                            platformName = 'Gemini';
                        else if (hostname.includes('openai.com'))
                            platformName = 'ChatGPT';
                        else if (hostname.includes('claude.ai'))
                            platformName = 'Claude';
                        else if (hostname.includes('perplexity.ai'))
                            platformName = 'Perplexity';
                        this.registerPageAgent(pageAgentId, `AI Chat (${platformName})`, hostname, sender.tab.id);
                        // 2. Broadcast availability
                        const message = {
                            type: 'AGENT_STATUS',
                            agent: this.agents.get(pageAgentId),
                        };
                        this.broadcastToTabs(message);
                        // 3. Return the assigned Agent ID to the tab so it knows who it is
                        sendResponse({ success: true, agentId: pageAgentId });
                    }
                    else {
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
                            const normalizeId = (id) => id ? id.replace(/^(page-agent-|browser-|agent-)/, '') : '';
                            // Fallback: construct from tab ID if not provided
                            if (!senderId && sender.tab?.id) {
                                senderId = `page-agent-${sender.tab.id}`;
                                console.log('[GeminiBridge v7] Using tab-based senderId:', senderId);
                            }
                            // FIXED: Don't drop messages without senderId - use a safe fallback instead
                            if (!senderId) {
                                senderId = `ai-response-${Date.now()}`;
                            }
                            const normalizedSenderId = normalizeId(senderId);
                            const normalizedMyId = normalizeId(this.agentId);
                            console.log('[GeminiBridge v7] AI Response from agent:', {
                                senderId,
                                normalizedSenderId,
                                normalizedMyId,
                            });
                            // Get channel from message metadata (set by the content script when the user selected it)
                            // This supports per-tab channel selection where each tab maintains its own channel
                            let channel = message.channel || message.metadata?.channel;
                            if (!channel) {
                                if (this.joinedChannels.has('green')) {
                                    channel = 'green';
                                }
                                else if (this.joinedChannels.size > 0) {
                                    // Fallback to first joined channel if no specific channel provided
                                    channel = Array.from(this.joinedChannels)[0];
                                    console.log('[GeminiBridge v7] Using fallback channel:', channel);
                                }
                            }
                            if (channel) {
                                // Get platform name for context (inline detection)
                                const tabUrl = sender.tab?.url || '';
                                let platformName = message.platform || 'unknown';
                                if (!message.platform) {
                                    if (tabUrl.includes('gemini.google'))
                                        platformName = 'Gemini';
                                    else if (tabUrl.includes('chat.openai') || tabUrl.includes('chatgpt'))
                                        platformName = 'ChatGPT';
                                    else if (tabUrl.includes('claude.ai'))
                                        platformName = 'Claude';
                                    else if (tabUrl.includes('copilot'))
                                        platformName = 'Copilot';
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
                                    console.log('[GeminiBridge v7] 🔗 Including correlation in broadcast:', message.metadata.correlationId);
                                }
                                this.send({
                                    type: 'MESSAGE_SEND',
                                    to: message.metadata?.inResponseTo || 'broadcast',
                                    channel: channel,
                                    content: message.content,
                                    messageType: 'ai-response',
                                    metadata: responseMetadata,
                                });
                                console.log('[GeminiBridge v7] AI response broadcast to channel:', {
                                    channel,
                                    senderId,
                                    platform: platformName,
                                    contentLength: message.content.length,
                                    hasCorrelation: !!message.metadata?.correlationId,
                                });
                            }
                        }
                        else {
                            console.log('[GeminiBridge v7] Skipping duplicate AI response broadcast');
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
     * Register tools with the Chrome built-in AI (2026 WebMCP standard)
     */
    async registerWebMCPTools() {
        if (typeof chrome.ai !== 'undefined' && chrome.ai.registerTools) {
            console.log('[GeminiBridge] Registering WebMCP tools for Tactical Autonomy...');
            const tnfTools = [
                {
                    name: 'tnf_mouse_click',
                    description: 'Clicks at a specific X,Y coordinate on the local screen (Tactical Autonomy)',
                    parameters: {
                        type: 'object',
                        properties: {
                            x: { type: 'number' },
                            y: { type: 'number' },
                        },
                        required: ['x', 'y'],
                    },
                },
                {
                    name: 'tnf_type_text',
                    description: 'Types text into the focused field on the local computer',
                    parameters: {
                        type: 'object',
                        properties: {
                            text: { type: 'string' },
                        },
                        required: ['text'],
                    },
                },
                {
                    name: 'tnf_press_key',
                    description: 'Presses a specific key code on the local computer',
                    parameters: {
                        type: 'object',
                        properties: {
                            keyCode: { type: 'number', description: 'AppleScript key code' },
                        },
                        required: ['keyCode'],
                    },
                },
                {
                    name: 'tnf_green_broadcast',
                    description: 'Broadcasts a message to the TNF Green federation channel',
                    parameters: {
                        type: 'object',
                        properties: {
                            message: { type: 'string' },
                        },
                        required: ['message'],
                    },
                },
                {
                    name: 'tnf_execute_workflow',
                    description: 'Executes a named TNF workflow across the federation',
                    parameters: {
                        type: 'object',
                        properties: {
                            workflowId: { type: 'string' },
                            input: { type: 'object' },
                        },
                        required: ['workflowId'],
                    },
                },
            ];
            try {
                await chrome.ai.registerTools(tnfTools, (toolName, params) => {
                    return this.handleToolInvocation(toolName, params);
                });
                console.log('[GeminiBridge] Successfully registered 5 WebMCP tools');
            }
            catch (e) {
                console.debug('[GeminiBridge] WebMCP registration failed (feature may be disabled)', e);
            }
        }
    }
    /**
     * Handle tool invocations from the Gemini Sidebar
     */
    async handleToolInvocation(toolName, params) {
        console.log(`[GeminiBridge] Tool invocation from Gemini Sidebar: ${toolName}`, params);
        switch (toolName) {
            case 'tnf_mouse_click':
                return await this.sendNativeMessage({ action: 'mouse-click', x: params.x, y: params.y });
            case 'tnf_type_text':
                return await this.sendNativeMessage({ action: 'type-text', text: params.text });
            case 'tnf_press_key':
                return await this.sendNativeMessage({ action: 'press-key', keyCode: params.keyCode });
            case 'tnf_green_broadcast':
                this.send({
                    type: 'MESSAGE_SEND',
                    to: 'broadcast',
                    channel: 'green',
                    content: params.message,
                    messageType: 'text',
                    metadata: { source: 'gemini-sidebar-webmcp' },
                });
                return { success: true, status: 'broadcast_sent' };
            case 'tnf_execute_workflow':
                this.send({
                    type: 'WORKFLOW_EXECUTE',
                    payload: { workflowId: params.workflowId, input: params.input },
                });
                return { success: true, status: 'workflow_queued' };
            default:
                return { error: 'Unknown tool' };
        }
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

/******/ })()
;
//# sourceMappingURL=index.js.map