/**
 * Fuse Connect v7 - Background Service Worker
 * Multi-node connection, federation channels, notifications
 *
 * This version handles connection failures gracefully and allows
 * starting the relay from the extension's Services tab.
 */

import youtubeService from '../services/ai-studio/youtube-service';
import { filterBookmarks } from '../services/bookmarks/bookmark-privacy-service';
import bookmarkRealtimeService from '../services/bookmarks/bookmark-realtime-service';
import {
  BookmarkRelayBroker,
  type BookmarkRequestOptions,
} from '../services/bookmarks/bookmark-relay-broker';
import bookmarkSettingsService from '../services/bookmarks/bookmark-settings-service';
import bookmarkStoreService, {
  computeDuplicates,
} from '../services/bookmarks/bookmark-store-service';
import bookmarkTaggingService from '../services/bookmarks/bookmark-tagging-service';
import {
  classifyAll,
  generateTaxonomy,
  zeroFolderPlanItems,
} from '../services/bookmarks/bookmark-taxonomy-service';
import {
  ACTIVITY_CHANNEL,
  AI_MODELS,
  API_URLS,
  DEFAULT_NODES as DEFAULT_NODES_CONST,
  isStandardChannel,
  NATIVE_HOST_NAME as NATIVE_HOST_NAME_CONST,
  RELAY_WS_CANDIDATES,
  relayWsUrlForPort,
  STORAGE_KEYS as STORAGE_KEYS_CONST,
  TIMINGS,
} from '../shared/constants';
import {
  a2aChannelIdForTab,
  buildBrowserAgentIdentity,
  buildPageAgentIdentity,
  buildSidePanelAgentIdentity,
  enrichOutboundMetadata,
  mergeRegistrationPayload,
  resolveMessageTarget,
  type FederationIdentityRecord,
} from '../shared/federation-identity';
import type {
  Agent,
  AgentMessage,
  AIVideoProcessingState,
  AIVideoQueueItem,
  BookmarkOrganizerSettings,
  BookmarkPlan,
  ConnectionStatus,
  ExtensionLogEntry,
  ExtensionLogLevel,
  FederationChannel,
  NodeType,
  Notification,
  NotificationType,
  ProtocolMessage,
  TNFNode,
  TranscriptEntry,
  TranscriptRole,
} from '../shared/types';
import { simpleHash } from '../shared/utils';
import { browserAutomation } from './browser-automation';

const STORAGE_KEYS = {
  ...STORAGE_KEYS_CONST,
  tabActiveChannels: 'fuse_tab_active_channels',
  tabPausedChannels: 'fuse_tab_paused_channels',
  autoConnect: 'fuse_auto_connect',
  autoMonitor: 'fuse_auto_monitor',
  autoMasterClock: 'fuse_auto_master_clock',
  autoWakePing: 'fuse_auto_wake_ping',
  eventLog: 'fuse_event_log',
};

const DEFAULT_NODES = DEFAULT_NODES_CONST;
const NATIVE_HOST_NAME = NATIVE_HOST_NAME_CONST;
const AI_VIDEO_PROCESS_ALARM = 'ai_video_process_tick';

/**
 * MV3 suspends this worker after ~30s idle, which kills every setInterval/
 * setTimeout below AND the relay WebSocket. Only an event can revive it, so a
 * periodic alarm is the one thing that keeps the extension reachable while the
 * browser sits idle. 0.5 min is the shortest period Chrome honours.
 */
const KEEPALIVE_ALARM = 'fuse_keepalive_tick';
const KEEPALIVE_PERIOD_MINUTES = 0.5;
const KEEPALIVE_DIAG_KEY = 'fuse_keepalive_diag';
/**
 * Backup boot alarm. Chrome status 14 (kErrorTimeout) fires when a service
 * worker's first task — script evaluation plus any I/O started from it — does
 * not finish in time. Native-host launch and localhost relay probes used to
 * run in that first task and could hang the registration. This alarm re-runs
 * boot if the setTimeout(0) path is delayed until after install.
 */
const BOOT_CONNECT_ALARM = 'fuse_boot_connect';
const NATIVE_MESSAGE_TIMEOUT_MS = 8000;
const RELAY_DISCOVERY_BUDGET_MS = 2500;

// Register lifecycle handlers before constructing BackgroundService so Chrome
// can finish install/activate even if later init I/O is slow.
try {
  console.warn('[FuseConnect v7] service worker script evaluating');
  // Structural types instead of ServiceWorkerGlobalScope/ExtendableEvent so the
  // DOM-lib tsconfig (no "webworker" lib) still type-checks the SW entry.
  const swScope = self as unknown as {
    skipWaiting(): Promise<void>;
    clients: { claim(): Promise<void> };
  };
  self.addEventListener('install', () => {
    void swScope.skipWaiting();
  });
  self.addEventListener('activate', (event) => {
    const claim = swScope.clients.claim();
    (event as unknown as { waitUntil(promise: Promise<unknown>): void }).waitUntil(claim);
  });
} catch {
  // ignore — classic-script workers still expose skipWaiting on self in Chrome
}

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
  private relayUrl: string = DEFAULT_NODES.relay;
  private readonly relayFallbackUrls: string[] = [...RELAY_WS_CANDIDATES];
  private sidePanelPairs: Map<
    number,
    {
      tabId: number;
      pageAgentId: string | null;
      sidePanelAgentId: string | null;
      a2aEnabled: boolean;
      channelId: string;
    }
  > = new Map();
  private pendingSidePanelOpen: Map<
    number,
    { tabId: number; pairWithPageChat: boolean; openedAt: number }
  > = new Map();
  private lastAutonomyStartAt: number = 0;
  private lastWakePingAt: Map<string, number> = new Map();
  private channelLastActivityAt: Map<string, number> = new Map();
  private connectionAttempts: number = 0;
  private maxInitialAttempts: number = 1; // Only try once on startup
  private browserIdentity: FederationIdentityRecord | null = null;

  // Message deduplication - track recently sent/received message hashes
  private recentMessageHashes: Map<string, number> = new Map();
  private readonly MESSAGE_DEDUP_WINDOW_MS = TIMINGS.messageDedupWindow;

  // Timers
  private reconnectTimers: Map<string, number> = new Map();
  private heartbeatTimer: number | null = null;
  private healthCheckTimer: number | null = null;
  private cleanupTimer: number | null = null; // Periodic cleanup to prevent memory leaks
  private stallWatchdogTimer: number | null = null;
  private nativeHostUnavailable: boolean = false;
  private nativeHostMissingLogged: boolean = false;
  private nativeHostBackoffUntil: number = 0;
  /**
   * Starting a relay is not idempotent — a second instance takes port 3000 from
   * the first, which kills it. The existing nativeHostBackoffUntil only covers
   * the native host *failing*, so a succeeding start could be re-issued on every
   * reconnect attempt and spawn relays in a loop. This throttles the action.
   */
  private relayBootstrapCooldownUntil: number = 0;
  private readonly RELAY_BOOTSTRAP_COOLDOWN_MS = 120000;
  private keepAliveTicks = 0;
  /**
   * Deadline for an in-flight relay connect. `connections` is only populated in
   * ws.onopen, so a socket that is still CONNECTING is invisible there and
   * repeated connect attempts silently stacked up new sockets.
   */
  private relayConnectInFlightUntil = 0;
  private readonly RELAY_CONNECT_INFLIGHT_MS = 15000;
  private readyContentTabs: Set<number> = new Set();
  private unreachableTabs: Map<number, number> = new Map();
  private readonly TAB_UNREACHABLE_COOLDOWN_MS = 30000;
  private broadcastFailLogAt: Map<number, number> = new Map();
  private extensionEventLog: ExtensionLogEntry[] = [];
  private readonly EVENT_LOG_LIMIT = TIMINGS.eventLogLimit;
  private eventLogFlushTimer: number | null = null;
  private eventLoggingEnabled = true;

  // Automation orchestrator state
  private automationRunning = false;
  private automationPaused = false;
  private pendingTaskResolve: ((value: any) => void) | null = null;

  // AI Bookmark Organizer
  private bookmarkBroker: BookmarkRelayBroker = new BookmarkRelayBroker({
    send: (data) => this.send(data),
    getAgents: () => Array.from(this.agents.values()),
    getAgentId: () => this.agentId,
  });
  private bookmarkAnalyzeJob: { cancelled: boolean } | null = null;

  constructor() {
    this.init().catch((err) => {
      console.error('[FuseConnect v7] Background init failed:', err);
      try {
        this.setupMessageHandlers();
        this.setupCommands();
        this.setupTabLifecycleHandlers();
        this.setupAlarmHandlers();
        this.ensureKeepAliveAlarm();
        const sidePanelApi = (chrome as { sidePanel?: { setPanelBehavior: Function } }).sidePanel;
        if (sidePanelApi?.setPanelBehavior) {
          void sidePanelApi.setPanelBehavior({ openPanelOnActionClick: false });
        }
      } catch (setupErr) {
        console.error('[FuseConnect v7] Emergency handler setup failed:', setupErr);
      }
    });
  }

  private async init(): Promise<void> {
    console.log('[FuseConnect v7] Background service initializing...');

    // CRITICAL: Setup handlers SYNCHRONOUSLY before any awaits
    // This prevents "Receiving end does not exist" errors in the popup
    this.setupMessageHandlers();
    this.setupCommands();
    this.setupTabLifecycleHandlers();
    this.setupAlarmHandlers();
    this.ensureKeepAliveAlarm();
    browserAutomation.installNetworkListeners();
    const sidePanelApi = (chrome as { sidePanel?: { setPanelBehavior: Function } }).sidePanel;
    if (sidePanelApi?.setPanelBehavior) {
      void sidePanelApi.setPanelBehavior({ openPanelOnActionClick: false });
    }

    // Get or create agent ID
    this.agentId = await this.getOrCreateAgentId();
    this.browserIdentity = buildBrowserAgentIdentity(this.agentId);

    // Load saved state
    await this.loadSavedState();

    // Bootstrap bookmark real-time auto-file listener (off unless the user opted in).
    bookmarkSettingsService
      .getSettings()
      .then((settings) => this.syncBookmarkRealtimeListener(settings))
      .catch((err) => console.warn('[FuseConnect v7] Failed to load bookmark settings:', err));
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
      void this.tryInitialConnection().catch((err) => {
        console.warn('[FuseConnect v7] Initial connection failed:', err);
      });
    } else {
      // Set initial status to disconnected without error
      this.updateNodeStatus('relay', this.relayUrl, 'disconnected');
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
    const discoveredRelayUrl = await this.discoverRelayUrl(this.relayUrl);

    if (discoveredRelayUrl) {
      this.persistDiscoveredRelayUrl(discoveredRelayUrl);
      this.connectToNode('relay', this.relayUrl);
      return;
    }

    // The health probe is HTTP; the link we actually need is the WebSocket. A
    // relay whose HTTP handler is wedged still serves WS fine, and treating that
    // as "relay down" made us spawn a duplicate relay process over native
    // messaging — which then fights the running one for port 3000. Probe the
    // socket itself before concluding anything needs starting.
    if (await this.probeRelaySocket(this.relayUrl)) {
      console.warn(
        '[FuseConnect v7] Relay health endpoint unreachable but WebSocket accepted - connecting anyway'
      );
      this.connectToNode('relay', this.relayUrl);
      return;
    }

    console.log('[FuseConnect v7] Relay not available - attempting autonomous startup');
    this.updateNodeStatus('relay', this.relayUrl, 'disconnected');

    const now = Date.now();
    if (now < this.relayBootstrapCooldownUntil) {
      console.warn(
        `[FuseConnect v7] Relay bootstrap on cooldown for another ${Math.round(
          (this.relayBootstrapCooldownUntil - now) / 1000
        )}s - not spawning another relay`
      );
      return;
    }
    this.relayBootstrapCooldownUntil = now + this.RELAY_BOOTSTRAP_COOLDOWN_MS;

    this.sendNativeMessage({ action: 'start', service: 'relay' }).then((nativeResp) => {
      if (nativeResp?.error) {
        return;
      }
      setTimeout(async () => {
        this.connectionAttempts = 0;
        const preferredUrl =
          typeof nativeResp?.result?.port === 'number' && nativeResp.result.port > 0
            ? `ws://localhost:${nativeResp.result.port}/ws`
            : this.relayUrl;
        const discoveredAfterStart = await this.discoverRelayUrl(preferredUrl);
        if (discoveredAfterStart) {
          this.persistDiscoveredRelayUrl(discoveredAfterStart);
        }
        this.connectToNode('relay', this.relayUrl);
        this.ensureAutonomousServices('relay_auto_bootstrap');
      }, 3000);
    });
  }

  /**
   * Check if relay is available via HTTP health endpoint
   */
  /**
   * Open-and-close probe of the relay WebSocket. Used as a second opinion when
   * the HTTP health endpoint does not answer, so a wedged HTTP handler cannot
   * make us believe the relay is down.
   */
  private probeRelaySocket(relayUrl: string = this.relayUrl, timeoutMs = 2500): Promise<boolean> {
    return new Promise((resolve) => {
      let settled = false;
      let socket: WebSocket | null = null;

      const finish = (result: boolean) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try {
          socket?.close();
        } catch {
          // already closing
        }
        resolve(result);
      };

      const timer = setTimeout(() => finish(false), timeoutMs);

      try {
        socket = new WebSocket(relayUrl);
        socket.onopen = () => finish(true);
        socket.onerror = () => finish(false);
        socket.onclose = () => finish(false);
      } catch {
        finish(false);
      }
    });
  }

  private async checkRelayHealth(relayUrl: string = this.relayUrl): Promise<boolean> {
    try {
      const response = await fetch(this.relayHealthUrl(relayUrl), {
        method: 'GET',
        signal: AbortSignal.timeout(800),
      });
      if (!response.ok) {
        return false;
      }
      const data = await response.json();
      return data?.status === 'ok' && data?.relay === 'running';
    } catch (e) {
      return false;
    }
  }

  private normalizeRelayUrl(candidate: unknown): string | null {
    if (typeof candidate !== 'string') {
      return null;
    }
    const trimmed = candidate.trim();
    if (!trimmed) {
      return null;
    }
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'ws:' && parsed.protocol !== 'wss:') {
        return null;
      }
      const pathname = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '/ws';
      parsed.pathname = pathname;
      return parsed.toString().replace(/\/$/, '');
    } catch (_error) {
      return null;
    }
  }

  private relayHealthUrl(relayUrl: string): string {
    return relayUrl.replace(/^ws:/, 'http:').replace(/^wss:/, 'https:').replace(/\/ws$/, '/health');
  }

  private persistDiscoveredRelayUrl(url: string): void {
    const normalized = this.normalizeRelayUrl(url);
    if (!normalized) return;
    this.relayUrl = normalized;
    chrome.storage.local.get([STORAGE_KEYS.settings], (result) => {
      const settings = { ...(result[STORAGE_KEYS.settings] || {}) };
      if (settings.relayUrl === normalized) return;
      settings.relayUrl = normalized;
      chrome.storage.local.set({ [STORAGE_KEYS.settings]: settings });
    });
  }

  private async queryNativeRelayPorts(): Promise<number[]> {
    if (this.nativeHostUnavailable) return [];
    try {
      const response = await this.sendNativeMessage({ action: 'ports' });
      const running = Array.isArray(response?.running) ? response.running : [];
      const discovery = Array.isArray(response?.discoveryPorts) ? response.discoveryPorts : [];
      const inspectedReady = Array.isArray(response?.inspected)
        ? response.inspected
            .filter((entry: { ready?: boolean; port?: number }) => entry?.ready)
            .map((entry: { port?: number }) => entry.port)
        : [];
      return [...running, ...inspectedReady, ...discovery]
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0);
    } catch {
      return [];
    }
  }

  private buildRelayCandidates(preferred?: string, extraPorts: number[] = []): string[] {
    const extraUrls = extraPorts.map((port) => relayWsUrlForPort(port));
    const candidates = [
      preferred,
      this.relayUrl,
      DEFAULT_NODES.relay,
      ...extraUrls,
      ...this.relayFallbackUrls,
    ];
    const normalized: string[] = [];
    for (const candidate of candidates) {
      const resolved = this.normalizeRelayUrl(candidate);
      if (!resolved || normalized.includes(resolved)) continue;
      normalized.push(resolved);
    }
    return normalized;
  }

  private async discoverRelayUrl(preferred?: string): Promise<string | null> {
    const nativePortsPromise = this.queryNativeRelayPorts();
    const localCandidates = this.buildRelayCandidates(preferred);
    const deadline = Date.now() + RELAY_DISCOVERY_BUDGET_MS;
    for (const candidate of localCandidates) {
      if (Date.now() > deadline) break;
      if (!(await this.checkRelayHealth(candidate))) continue;
      const remaining = Math.max(250, deadline - Date.now());
      if (await this.probeRelaySocket(candidate, remaining)) {
        return candidate;
      }
    }
    const nativePorts = await nativePortsPromise;
    const extraCandidates = this.buildRelayCandidates(preferred, nativePorts).filter(
      (url) => !localCandidates.includes(url)
    );
    for (const candidate of extraCandidates) {
      if (!(await this.checkRelayHealth(candidate))) continue;
      if (await this.probeRelaySocket(candidate, 1000)) {
        return candidate;
      }
    }
    return null;
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

    // No channel is auto-joined by name. Membership is driven entirely by saved
    // state and explicit CHANNEL_JOIN/CHANNEL_CREATE, so every channel — the ones
    // restored above and any created later — is treated identically.

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

    const settingsRelayUrl = this.normalizeRelayUrl(result[STORAGE_KEYS.settings]?.relayUrl);
    const structuredRelayUrl = this.normalizeRelayUrl(
      result[STORAGE_KEYS.settings]?.nodes?.endpoints?.relay
    );
    if (settingsRelayUrl) {
      this.relayUrl = settingsRelayUrl;
    } else if (structuredRelayUrl) {
      this.relayUrl = structuredRelayUrl;
    }
  }

  /**
   * Connect to a specific node
   */
  private connectToNode(nodeType: NodeType, url: string): void {
    if (nodeType === 'relay') {
      const normalizedRelayUrl = this.normalizeRelayUrl(url);
      if (normalizedRelayUrl) {
        url = normalizedRelayUrl;
        this.relayUrl = normalizedRelayUrl;
      }
    }

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

    if (nodeType === 'relay') {
      this.relayConnectInFlightUntil = Date.now() + this.RELAY_CONNECT_INFLIGHT_MS;
    }

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log(`[FuseConnect v7] Connected to ${nodeType}`);
        if (nodeType === 'relay') this.relayConnectInFlightUntil = 0;
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
        if (nodeType === 'relay') this.relayConnectInFlightUntil = 0;
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
        if (nodeType === 'relay') this.relayConnectInFlightUntil = 0;
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
    const identity = this.browserIdentity || buildBrowserAgentIdentity(this.agentId);
    const agent: Agent = {
      id: this.agentId,
      name: 'Browser Agent',
      platform: 'chrome-extension',
      status: 'active',
      operationalHandle: identity.operationalHandle,
      runtimeSessionId: identity.runtimeSessionId,
      canonicalEntityId: identity.canonicalEntityId,
      idNumber: identity.idNumber,
      aliases: identity.aliases,
      daccRole: identity.daccRole,
      correlationId: identity.correlationId,
      mcid: identity.mcid,
      capabilities: [
        'chat-injection',
        'dom-reading',
        'universal-detection',
        'streaming-detection',
        'notifications',
      ],
      channels: Array.from(this.joinedChannels),
      metadata: {
        ...enrichOutboundMetadata(identity, {
          senderId: this.agentId,
          extra: {
            eventType: 'agent_registered',
          },
        }),
        node: {
          type: 'browser',
          platform: navigator.platform,
          userAgent: navigator.userAgent,
          language: navigator.language,
        },
      },
      lastSeen: Date.now(),
    };
    this.agents.set(this.agentId, agent);

    const message: ProtocolMessage = {
      id: crypto.randomUUID(),
      type: 'AGENT_REGISTER',
      timestamp: Date.now(),
      source: this.agentId,
      payload: {
        agent,
      },
    };

    ws.send(JSON.stringify(message));
  }

  private getCompleteAgentIdentity(agentId: string): FederationIdentityRecord | null {
    const agent = this.agents.get(agentId);
    if (!agent) return null;
    if (
      !agent.operationalHandle ||
      !agent.runtimeSessionId ||
      !agent.idNumber ||
      !agent.correlationId ||
      !agent.mcid
    ) {
      return null;
    }
    return {
      id: agent.id,
      operationalHandle: agent.operationalHandle,
      runtimeSessionId: agent.runtimeSessionId,
      canonicalEntityId: agent.canonicalEntityId || null,
      idNumber: agent.idNumber,
      aliases: agent.aliases || [],
      daccRole: agent.daccRole || 'participant',
      correlationId: agent.correlationId,
      mcid: agent.mcid as unknown as FederationIdentityRecord['mcid'],
    };
  }

  private agentEdgeKind(agent: Agent): 'page' | 'side-panel' | 'other' {
    const metaKind = String(agent.metadata?.edgeKind || '');
    if (metaKind === 'side-panel' || String(agent.id).startsWith('side-panel-agent-')) {
      return 'side-panel';
    }
    if (metaKind === 'page' || String(agent.id).startsWith('page-agent-')) {
      return 'page';
    }
    return 'other';
  }

  private findTabAgent(tabId: number, kind: 'page' | 'side-panel'): Agent | null {
    for (const agent of this.agents.values()) {
      if (Number(agent.metadata?.tabId) !== tabId) continue;
      if (this.agentEdgeKind(agent) === kind) return agent;
    }
    return null;
  }

  private findA2APairForAgent(agentId: string) {
    for (const pair of this.sidePanelPairs.values()) {
      if (pair.pageAgentId === agentId || pair.sidePanelAgentId === agentId) return pair;
    }
    return null;
  }

  private a2aPeerId(agentId: string): string | null {
    const pair = this.findA2APairForAgent(agentId);
    if (!pair?.a2aEnabled) return null;
    if (pair.pageAgentId === agentId) return pair.sidePanelAgentId;
    if (pair.sidePanelAgentId === agentId) return pair.pageAgentId;
    return null;
  }

  private joinAgentToChannel(agentId: string, channelId: string): void {
    const id = String(channelId || '').trim();
    if (!id) return;
    const agent = this.agents.get(agentId);
    if (!agent) return;
    if (!Array.isArray(agent.channels)) agent.channels = [];
    if (!agent.channels.includes(id)) agent.channels.push(id);
    if (this.primaryConnection?.readyState !== WebSocket.OPEN) return;
    const joinMessage: ProtocolMessage = {
      id: crypto.randomUUID(),
      type: 'CHANNEL_JOIN',
      timestamp: Date.now(),
      source: agentId,
      payload: { channelId: id },
    };
    this.primaryConnection.send(JSON.stringify(joinMessage));
  }

  private upsertSidePanelPair(
    tabId: number,
    patch: Partial<{
      pageAgentId: string | null;
      sidePanelAgentId: string | null;
      a2aEnabled: boolean;
    }>
  ) {
    const existing = this.sidePanelPairs.get(tabId);
    const next = {
      tabId,
      pageAgentId:
        patch.pageAgentId !== undefined ? patch.pageAgentId : existing?.pageAgentId || null,
      sidePanelAgentId:
        patch.sidePanelAgentId !== undefined
          ? patch.sidePanelAgentId
          : existing?.sidePanelAgentId || null,
      a2aEnabled:
        patch.a2aEnabled !== undefined ? patch.a2aEnabled : (existing?.a2aEnabled ?? true),
      channelId: a2aChannelIdForTab(tabId),
    };
    this.sidePanelPairs.set(tabId, next);
    if (next.a2aEnabled && next.pageAgentId && next.sidePanelAgentId) {
      if (!this.channels.has(next.channelId)) {
        this.channels.set(next.channelId, {
          id: next.channelId,
          name: `A2A Tab ${tabId}`,
          description: 'Direct side-panel ↔ page-chat WebSocket route',
          isPrivate: true,
          createdAt: Date.now(),
          createdBy: this.agentId,
          members: [next.pageAgentId, next.sidePanelAgentId],
        });
      }
      this.joinAgentToChannel(next.pageAgentId, next.channelId);
      this.joinAgentToChannel(next.sidePanelAgentId, next.channelId);
    }
    return next;
  }

  private unregisterTabEdgeAgents(tabId: number): void {
    const toRemove: string[] = [];
    for (const [id, agent] of this.agents) {
      if (Number(agent.metadata?.tabId) === tabId && this.agentEdgeKind(agent) !== 'other') {
        toRemove.push(id);
      }
    }
    for (const id of toRemove) {
      this.agents.delete(id);
      if (this.primaryConnection?.readyState === WebSocket.OPEN) {
        this.primaryConnection.send(
          JSON.stringify({
            id: crypto.randomUUID(),
            type: 'AGENT_UNREGISTER',
            timestamp: Date.now(),
            source: this.agentId,
            payload: { agentId: id },
          })
        );
      }
    }
    this.sidePanelPairs.delete(tabId);
    this.pendingSidePanelOpen.delete(tabId);
    if (toRemove.length > 0) {
      this.broadcastToTabs({
        type: 'AGENTS_UPDATE',
        agents: Array.from(this.agents.values()),
      });
    }
  }

  private registerSidePanelAgent(id: string, name: string, platform: string, tabId: number): Agent {
    const identity = buildSidePanelAgentIdentity(id, platform, tabId);
    const agent: Agent = {
      id,
      name,
      platform: 'browser-side-panel',
      status: 'active',
      operationalHandle: identity.operationalHandle,
      runtimeSessionId: identity.runtimeSessionId,
      canonicalEntityId: identity.canonicalEntityId,
      idNumber: identity.idNumber,
      aliases: identity.aliases,
      daccRole: identity.daccRole,
      correlationId: identity.correlationId,
      mcid: identity.mcid,
      capabilities: ['side-panel-chat', 'a2a-ws'],
      channels: [],
      metadata: {
        ...enrichOutboundMetadata(identity, {
          senderId: id,
          platform,
          extra: {
            eventType: 'side_panel_agent_registered',
            edgeKind: 'side-panel',
          },
        }),
        node: {
          type: 'browser-side-panel',
          platform,
        },
        aliases: identity.aliases,
        tabId,
        edgeKind: 'side-panel',
      },
      lastSeen: Date.now(),
    };

    this.agents.set(id, agent);

    if (this.primaryConnection?.readyState === WebSocket.OPEN) {
      const regMessage: ProtocolMessage = {
        id: crypto.randomUUID(),
        type: 'AGENT_REGISTER',
        timestamp: Date.now(),
        source: this.agentId,
        payload: { agent },
      };
      this.primaryConnection.send(JSON.stringify(regMessage));
      for (const channelId of this.joinedChannels) {
        this.joinAgentToChannel(id, channelId);
      }
    } else {
      this.pendingPageAgents.push(agent);
    }

    this.broadcastToTabs({
      type: 'AGENTS_UPDATE',
      agents: Array.from(this.agents.values()),
    });
    this.notifyPopup({
      type: 'AGENTS_UPDATE',
      agents: Array.from(this.agents.values()),
    });
    this.sendActivityEvent('side_panel_agent_registered', {
      sidePanelAgentId: id,
      tabId,
      platform,
      idNumber: identity.idNumber,
    });
    return agent;
  }

  private platformLabelFromHostname(hostname: string): string {
    if (hostname.includes('gemini.google')) return 'Gemini';
    if (hostname.includes('cursor.com') || hostname.includes('cursor.sh')) return 'Cursor';
    if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) return 'ChatGPT';
    if (hostname.includes('claude.ai')) return 'Claude';
    if (hostname.includes('perplexity.ai')) return 'Perplexity';
    if (hostname.includes('kimi.com') || hostname.includes('moonshot.cn')) return 'Kimi';
    if (hostname.includes('qwen.ai')) return 'Qwen';
    if (hostname.includes('z.ai') || hostname.includes('chatglm')) return 'GLM';
    return hostname;
  }

  private async resolveRequestTabId(
    sender: chrome.runtime.MessageSender,
    message: { tabId?: unknown }
  ): Promise<number | null> {
    if (sender.tab?.id) return sender.tab.id;
    const requested = Number(message.tabId);
    if (Number.isInteger(requested) && requested > 0) return requested;
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    return tab?.id ?? null;
  }

  private async buildGetStatePayload(
    sender: chrome.runtime.MessageSender,
    message: { tabId?: unknown; surface?: unknown }
  ): Promise<Record<string, unknown>> {
    const tabId = await this.resolveRequestTabId(sender, message);
    const tabPageAgent = tabId ? this.findTabAgent(tabId, 'page') : null;
    const tabSidePanelAgent = tabId ? this.findTabAgent(tabId, 'side-panel') : null;
    const sidePanelPair = tabId ? this.sidePanelPairs.get(tabId) || null : null;
    const surface = String(message.surface || '');
    const defaultAgentId =
      surface === 'side-panel'
        ? tabSidePanelAgent?.id || this.agentId
        : tabPageAgent?.id || this.agentId;

    return {
      connectionStatus:
        this.primaryConnection?.readyState === WebSocket.OPEN ? 'connected' : 'disconnected',
      agents: Array.from(this.agents.values()),
      channels: Array.from(this.channels.values()),
      joinedChannels: Array.from(this.joinedChannels),
      selectedChannel: this.getTabActiveChannel(tabId ?? undefined),
      tabId,
      nodes: Object.fromEntries(this.nodeStatus),
      agentId: defaultAgentId,
      browserAgentId: this.agentId,
      pageAgentId: tabPageAgent?.id || null,
      pageAgent: tabPageAgent,
      sidePanelAgentId: tabSidePanelAgent?.id || null,
      sidePanelAgent: tabSidePanelAgent,
      sidePanelPair,
      browserIdentity: this.browserIdentity,
      relayUrl: this.relayUrl,
      autoConnect: this.autoConnect,
      autoMonitor: this.autoMonitor,
      autoMasterClock: this.autoMasterClock,
      autoWakePing: this.autoWakePing,
      pausedChannels: this.getTabPausedChannels(tabId ?? undefined),
    };
  }

  private async handleSidePanelOpened(message: {
    tabId?: unknown;
    pairWithPageChat?: unknown;
  }): Promise<Record<string, unknown>> {
    let tabId = Number(message.tabId);
    if (!Number.isInteger(tabId) || tabId <= 0) {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      tabId = tab?.id || 0;
    }
    if (!tabId) return { success: false, error: 'No active tab' };
    this.pendingSidePanelOpen.set(tabId, {
      tabId,
      pairWithPageChat: message.pairWithPageChat !== false,
      openedAt: Date.now(),
    });
    return { success: true, tabId };
  }

  private async handleSidePanelReady(message: {
    tabId?: unknown;
    pairWithPageChat?: unknown;
  }): Promise<Record<string, unknown>> {
    let tabId = Number(message.tabId);
    if (!Number.isInteger(tabId) || tabId <= 0) {
      let latest: { tabId: number; pairWithPageChat: boolean; openedAt: number } | null = null;
      for (const pending of this.pendingSidePanelOpen.values()) {
        if (!latest || pending.openedAt > latest.openedAt) latest = pending;
      }
      tabId = latest?.tabId || 0;
    }
    if (!tabId) {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      tabId = tab?.id || 0;
    }
    if (!tabId) return { success: false, error: 'Cannot resolve tab for side panel' };

    const pending = this.pendingSidePanelOpen.get(tabId);
    const pairWithPageChat =
      message.pairWithPageChat !== undefined
        ? !!message.pairWithPageChat
        : pending?.pairWithPageChat !== false;

    let hostname = 'page';
    try {
      const tab = await chrome.tabs.get(tabId);
      hostname = tab.url ? new URL(tab.url).hostname : 'page';
    } catch {
      hostname = 'page';
    }
    const platformName = this.platformLabelFromHostname(hostname);

    let sidePanelAgent = this.findTabAgent(tabId, 'side-panel');
    if (!sidePanelAgent) {
      const id = `side-panel-agent-${tabId}-${Math.random().toString(36).substr(2, 5)}`;
      sidePanelAgent = this.registerSidePanelAgent(
        id,
        `Side Panel (${platformName})`,
        hostname,
        tabId
      );
    }

    const pageAgent = this.findTabAgent(tabId, 'page');
    const pair = this.upsertSidePanelPair(tabId, {
      pageAgentId: pageAgent?.id || null,
      sidePanelAgentId: sidePanelAgent.id,
      a2aEnabled: pairWithPageChat,
    });
    this.pendingSidePanelOpen.delete(tabId);
    this.notifyPopup({ type: 'SIDE_PANEL_PAIR_UPDATE', pair, sidePanelAgent, pageAgent });

    return {
      success: true,
      tabId,
      agent: sidePanelAgent,
      agentId: sidePanelAgent.id,
      pageAgent,
      pair,
      connectionStatus:
        this.primaryConnection?.readyState === WebSocket.OPEN ? 'connected' : 'disconnected',
      agents: Array.from(this.agents.values()),
      channels: Array.from(this.channels.values()),
      joinedChannels: Array.from(this.joinedChannels),
      selectedChannel: this.getTabActiveChannel(tabId),
      relayUrl: this.relayUrl,
      browserAgentId: this.agentId,
    };
  }

  /**
   * Register a new page agent (for AI chat tabs)
   */
  private registerPageAgent(id: string, name: string, platform: string, tabId?: number): void {
    const identity = buildPageAgentIdentity(id, platform, tabId);
    // 1. Create agent object
    const agent: Agent = {
      id: id,
      name: name,
      platform: 'browser-page',
      status: 'active',
      operationalHandle: identity.operationalHandle,
      runtimeSessionId: identity.runtimeSessionId,
      canonicalEntityId: identity.canonicalEntityId,
      idNumber: identity.idNumber,
      aliases: identity.aliases,
      daccRole: identity.daccRole,
      correlationId: identity.correlationId,
      mcid: identity.mcid,
      capabilities: ['chat-injection', 'dom-reading'], // Basic capabilities for a page agent
      channels: [], // Initially no channels
      metadata: {
        ...enrichOutboundMetadata(identity, {
          senderId: id,
          platform,
          extra: {
            eventType: 'page_agent_registered',
          },
        }),
        node: {
          type: 'browser-tab',
          platform: platform,
        },
        aliases: identity.aliases,
        tabId: tabId, // TRACK TAB ID
        edgeKind: 'page',
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
    if (tabId) {
      this.upsertSidePanelPair(tabId, { pageAgentId: id });
    }
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
    const senderId = String((data.metadata as any)?.senderId || data.source || this.agentId);
    const senderIdentity =
      this.getCompleteAgentIdentity(senderId) || this.getCompleteAgentIdentity(this.agentId);
    const enrichedMetadata = senderIdentity
      ? enrichOutboundMetadata(senderIdentity, {
          channel: (data.channel as string) || 'general',
          senderId,
          extra: (data.metadata as Record<string, unknown>) || {},
        })
      : data.metadata;

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
          metadata: enrichedMetadata, // <-- INCLUDE SENDER METADATA
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
   * Join every registered page agent to a channel.
   *
   * Channel membership has to be symmetric in both directions:
   *   - registerPageAgent() joins a NEW page agent to the channels that already exist
   *   - this joins the page agents that ALREADY exist to a NEW channel
   *
   * Only the first half used to be implemented, so a channel created (or joined)
   * after a tab had registered never delivered to that tab — the tab was in the
   * channel locally but was never a member on the relay. That made older channels
   * look healthy while newly created ones appeared half-broken.
   *
   * `agent.channels` is updated whether or not the socket is currently open, so
   * reRegisterAllAgents() replays the membership after a reconnect.
   */
  private joinPageAgentsToChannel(channelId: string): void {
    const id = String(channelId || '').trim();
    if (!id) return;

    const isOpen = this.primaryConnection?.readyState === WebSocket.OPEN;

    for (const [agentId, agent] of this.agents) {
      // The browser agent joins through this.send() on the caller's behalf.
      if (agentId === this.agentId) continue;

      if (!Array.isArray(agent.channels)) agent.channels = [];
      const alreadyMember = agent.channels.includes(id);
      if (!alreadyMember) agent.channels.push(id);

      if (!isOpen) continue;

      const joinMessage: ProtocolMessage = {
        id: crypto.randomUUID(),
        type: 'CHANNEL_JOIN',
        timestamp: Date.now(),
        source: agentId,
        payload: { channelId: id },
      };
      this.primaryConnection!.send(JSON.stringify(joinMessage));
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

    this.heartbeatTimer = setInterval(() => this.sendHeartbeatTick(), 30000) as unknown as number;
  }

  /**
   * One heartbeat round. Called by the 30s interval while the worker is alive,
   * and by the keepalive alarm after the worker has been suspended and revived
   * (which is when the interval no longer exists).
   */
  private sendHeartbeatTick(): void {
    {
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
    }
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

      // Browser-automation parity: lets a TNF backend/agent joined to this
      // relay as a node drive the user's real Chrome session the same way
      // claude-in-chrome drives Claude's — navigate, click/type, screenshot,
      // read console/network/DOM, resize, manage tabs. See
      // background/browser-automation.ts for the full action list; this
      // case is pure dispatch, same shape as the BROWSER_ACTION handler in
      // setupMessageHandlers() below (that one's reachable from the popup/
      // sidepanel without a relay connection, for direct testing).
      case 'BROWSER_ACTION': {
        const payload = (message.payload || {}) as {
          action: string;
          tabId?: number;
          params?: Record<string, unknown>;
          requestId?: string;
        };
        void browserAutomation
          .executeBrowserAction({
            action: payload.action,
            tabId: payload.tabId,
            params: payload.params,
          })
          .then((result) => {
            this.send({
              type: 'BROWSER_ACTION_RESULT',
              requestId: payload.requestId ?? (message as any).id,
              action: payload.action,
              ...result,
            });
          });
        break;
      }

      case 'AGENT_LIST': {
        const incoming = ((message.payload as any).agents || []) as Agent[];

        // The relay is authoritative for WHICH agents exist and for their volatile
        // state, but it does not carry this browser's local bookkeeping (tabId), and
        // it may echo an agent back before it has re-broadcast the federated identity
        // this edge minted. Clearing and overwriting therefore dropped `metadata.tabId`
        // — breaking tab reuse in CHAT_DETECTED — and dropped idNumber/handle, which
        // is what made `@ID#:` and `/to` addressing stop resolving after any sync.
        const next = new Map<string, Agent>();
        for (const agent of incoming) {
          const existing = this.agents.get(agent.id);
          if (!existing) {
            next.set(agent.id, agent);
            continue;
          }
          const base: Agent = {
            ...agent,
            metadata: { ...(agent.metadata || {}), ...(existing.metadata || {}) },
          };
          next.set(
            agent.id,
            mergeRegistrationPayload(base, agent as unknown as Record<string, unknown>)
          );
        }

        // Page agents this browser owns can be missing from the relay's snapshot while
        // their registration is still in flight. Dropping them would orphan the tab.
        for (const [id, agent] of this.agents) {
          if (next.has(id)) continue;
          if (agent.metadata?.tabId != null) next.set(id, agent);
        }

        this.agents = next;
        const agents = Array.from(this.agents.values());
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
            // Keep local bookkeeping (tabId) AND the federated identity fields when
            // the relay sends a status-only update that omits them.
            const existing = this.agents.get(agent.id);
            if (existing) {
              const base: Agent = {
                ...agent,
                metadata: { ...(agent.metadata || {}), ...(existing.metadata || {}) },
              };
              this.agents.set(
                agent.id,
                mergeRegistrationPayload(base, agent as unknown as Record<string, unknown>)
              );
            } else {
              this.agents.set(agent.id, agent);
            }
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

      // The relay answers CHANNEL_CREATE directly with one of these, carrying
      // the authoritative channel (and its real id). These were previously
      // unhandled, so a newly created channel stayed pinned to its throwaway
      // `local-` id until some later CHANNEL_LIST broadcast happened to fix it.
      case 'CHANNEL_CREATED':
      case 'CHANNEL_JOINED': {
        const channel = (message.payload as any)?.channel as FederationChannel | undefined;
        if (!channel?.id) break;

        const existingByName = this.findChannelByName(channel.name);
        if (existingByName && existingByName.id !== channel.id) {
          this.channels.delete(existingByName.id);
          this.remapChannelReferences(existingByName.id, channel.id);
        }

        this.channels.set(channel.id, channel);
        this.joinedChannels.add(channel.id);
        this.joinPageAgentsToChannel(channel.id);
        this.broadcastToTabs({
          type: 'CHANNELS_UPDATE',
          channels: Array.from(this.channels.values()),
        });
        this.notifyPopup({
          type: 'CHANNELS_UPDATE',
          channels: Array.from(this.channels.values()),
        });
        this.saveChannels();
        console.log(`[FuseConnect v7] Relay confirmed channel: ${channel.name} (${channel.id})`);
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

      case 'ERROR': {
        const relayError = message.payload as { message?: string; error?: unknown } | null;
        const relayErrorDetail =
          relayError?.message ||
          (relayError ? JSON.stringify(relayError).slice(0, 500) : 'Unknown error');
        console.error('[FuseConnect v7] Relay error:', relayErrorDetail, relayError ?? '');
        this.createNotification(
          'error',
          'Error',
          (message.payload as any).message || 'Unknown error'
        );
        break;
      }

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
    // Bookmark-classify replies are request/response, not pub/sub chatter — resolve
    // any pending BookmarkRelayBroker promise first, before dedup/loop-guard logic
    // (below) gets a chance to suppress a legitimate reply. We deliberately still
    // fall through afterwards so broadcastToTabs lets the full-tab manager page
    // show live progress too.
    this.bookmarkBroker.resolve(message);

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
  private async injectMessageToActiveTab(text: string): Promise<any> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      this.logEvent('chat', 'inject_active_tab', {
        tabId: tabs[0].id,
        preview: String(text || '').slice(0, 120),
      });
      return await chrome.tabs.sendMessage(tabs[0].id, {
        type: 'INJECT_MESSAGE',
        content: text,
      });
    }
    return { success: false, error: 'No active tab available for injection' };
  }

  /**
   * Inject message to a specific tab
   */
  private async injectMessageToTab(tabId: number, text: string): Promise<any> {
    this.logEvent('chat', 'inject_specific_tab', {
      tabId,
      preview: String(text || '').slice(0, 120),
    });
    return await chrome.tabs.sendMessage(tabId, {
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
   * Broadcast to tabs that actually host Fuse content scripts.
   * Fire-and-forget: never wait for a reply (avoids "message port closed" spam).
   */
  private async broadcastToTabs(message: Record<string, unknown>): Promise<void> {
    const now = Date.now();
    const tabs = await chrome.tabs.query({});
    const targets = tabs.filter((tab) => this.shouldBroadcastToTab(tab, now));

    await Promise.all(
      targets.map(async (tab) => {
        const tabId = tab.id!;
        try {
          // No response callback — content scripts may not reply to every event type.
          await chrome.tabs.sendMessage(tabId, message);
          this.unreachableTabs.delete(tabId);
        } catch (err) {
          const errMsg = String((err as Error)?.message || err || '');
          if (this.isBenignTabMessageError(errMsg)) {
            this.markTabUnreachable(tabId, now);
            return;
          }

          const lastLog = this.broadcastFailLogAt.get(tabId) || 0;
          if (now - lastLog > 15000) {
            this.broadcastFailLogAt.set(tabId, now);
            console.warn(`[FuseConnect v7] Failed to broadcast to tab ${tabId}:`, errMsg);
          }
          this.markTabUnreachable(tabId, now);
        }
      })
    );
  }

  private shouldBroadcastToTab(tab: chrome.tabs.Tab, now: number): boolean {
    if (!tab.id || tab.id < 0) return false;
    const url = String(tab.url || tab.pendingUrl || '');
    if (!url || /^(chrome|chrome-extension|devtools|edge|about|brave):/i.test(url)) {
      return false;
    }

    const unreachableUntil = this.unreachableTabs.get(tab.id) || 0;
    if (unreachableUntil > now) {
      return false;
    }

    // Prefer tabs that announced CONTENT_SCRIPT_READY or host a registered page agent.
    if (this.readyContentTabs.has(tab.id)) return true;
    for (const agent of this.agents.values()) {
      if (agent.metadata?.tabId === tab.id) return true;
    }

    // Fallback: http(s) pages that may still have the content script injected.
    return /^https?:/i.test(url);
  }

  private markTabUnreachable(tabId: number, now = Date.now()): void {
    this.unreachableTabs.set(tabId, now + this.TAB_UNREACHABLE_COOLDOWN_MS);
    this.readyContentTabs.delete(tabId);
  }

  private isBenignTabMessageError(message: string): boolean {
    const msg = String(message || '').toLowerCase();
    return (
      msg.includes('receiving end does not exist') ||
      msg.includes('could not establish connection') ||
      msg.includes('message port closed') ||
      msg.includes('the message port closed before a response was received') ||
      msg.includes('extension context invalidated') ||
      msg.includes('no tab with id') ||
      msg.includes('the tab was closed')
    );
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
      } else if (alarm.name === KEEPALIVE_ALARM) {
        this.onKeepAliveTick();
      } else if (alarm.name === BOOT_CONNECT_ALARM) {
        void this.init().catch((err) => {
          console.error('[FuseConnect v7] Boot alarm init failed:', err);
        });
      }
    });
  }

  /**
   * Register the worker-revival alarm. `create` replaces an existing alarm of
   * the same name, so calling this on every worker boot is safe and idempotent.
   */
  private ensureKeepAliveAlarm(): void {
    try {
      chrome.alarms.create(KEEPALIVE_ALARM, {
        periodInMinutes: KEEPALIVE_PERIOD_MINUTES,
      });
      // Chrome silently clamps or rejects short periods depending on version and
      // packed/unpacked state, so record what it ACTUALLY scheduled. Without
      // this there is no way to tell "alarm never fired" from "alarm never
      // existed" — the worker is asleep exactly when you would want to look.
      void chrome.alarms.get(KEEPALIVE_ALARM).then((alarm) => {
        void this.recordKeepAliveDiag({
          requestedPeriodMinutes: KEEPALIVE_PERIOD_MINUTES,
          scheduledPeriodMinutes: alarm?.periodInMinutes ?? null,
          nextFireAt: alarm?.scheduledTime ?? null,
          alarmExists: !!alarm,
          workerBootedAt: Date.now(),
        });
        if (!alarm) {
          console.error('[FuseConnect v7] Keepalive alarm was not registered by Chrome');
        } else if (alarm.periodInMinutes !== KEEPALIVE_PERIOD_MINUTES) {
          console.warn(
            `[FuseConnect v7] Keepalive period clamped by Chrome: requested ${KEEPALIVE_PERIOD_MINUTES}m, scheduled ${alarm.periodInMinutes}m`
          );
        }
      });
    } catch (err) {
      console.error('[FuseConnect v7] Failed to create keepalive alarm:', err);
    }
  }

  /**
   * Persist keepalive telemetry. Storage, not memory: the whole point is to
   * survive the worker being torn down between ticks.
   */
  private async recordKeepAliveDiag(patch: Record<string, unknown>): Promise<void> {
    try {
      const stored = await chrome.storage.local.get(KEEPALIVE_DIAG_KEY);
      const current = (stored?.[KEEPALIVE_DIAG_KEY] as Record<string, unknown>) || {};
      await chrome.storage.local.set({
        [KEEPALIVE_DIAG_KEY]: { ...current, ...patch, updatedAt: Date.now() },
      });
    } catch {
      // Diagnostics must never break the keepalive path.
    }
  }

  /**
   * Runs on every keepalive alarm. The alarm firing has already woken the
   * worker (re-running init() if it had been torn down); this decides whether
   * the relay link needs re-establishing and refreshes agent liveness so the
   * relay does not time our agents out.
   */
  private onKeepAliveTick(): void {
    this.keepAliveTicks += 1;
    const relayState = this.connections.get('relay')?.readyState ?? null;
    void this.recordKeepAliveDiag({
      lastTickAt: Date.now(),
      ticksThisWorker: this.keepAliveTicks,
      lastTickAutoConnect: this.autoConnect,
      lastTickRelayReadyState: relayState,
    });

    if (!this.autoConnect) {
      console.warn('[FuseConnect v7] Keepalive tick ignored: autoConnect is off');
      return;
    }

    const relay = this.connections.get('relay');
    if (relay?.readyState === WebSocket.OPEN) {
      // Traffic on the socket also resets the worker's idle timer.
      this.sendHeartbeatTick();
      return;
    }

    // A socket that never opens stays in CONNECTING forever, so this must be a
    // bounded in-flight guard rather than a readyState check — otherwise one
    // half-open attempt would block every future reconnect.
    if (this.relayConnectInFlightUntil > Date.now()) {
      console.warn('[FuseConnect v7] Keepalive: relay connect already in flight');
      return;
    }

    console.warn('[FuseConnect v7] Keepalive: relay link down, reconnecting...');
    this.connectionAttempts = 0;
    void this.tryInitialConnection().catch((err) => {
      console.warn('[FuseConnect v7] Keepalive reconnect failed:', err);
    });
  }

  private async getYouTubeAuthToken(): Promise<string | null> {
    const now = Date.now();
    const stored = await chrome.storage.local.get([
      'ai_studio_token',
      'youtubeToken',
      'youtubeTokenExpiry',
    ]);

    const storedYoutubeToken = String(stored.youtubeToken || '').trim();
    const storedAiStudioToken = String(stored.ai_studio_token || '').trim();
    const expiry = Number(stored.youtubeTokenExpiry || 0);

    if (storedYoutubeToken && expiry > now) return storedYoutubeToken;
    if (storedAiStudioToken && (!expiry || expiry > now)) return storedAiStudioToken;
    return null;
  }

  private async validateYouTubeToken(token: string): Promise<boolean> {
    if (!token) return false;
    try {
      await this.youtubeApiGet('channels?part=id&mine=true&maxResults=1', token);
      return true;
    } catch {
      return false;
    }
  }

  private async youtubeApiGet(path: string, token: string): Promise<any> {
    const response = await fetch(`${API_URLS.youtube}/${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`YouTube API ${response.status}`);
    }
    return response.json();
  }

  private async fetchYouTubeChannels(): Promise<Array<Record<string, unknown>>> {
    const token = await this.getYouTubeAuthToken();
    if (!token) throw new Error('Not authenticated');

    const data = await this.youtubeApiGet(
      'channels?part=snippet,contentDetails&mine=true&maxResults=50',
      token
    );
    const items = Array.isArray(data?.items) ? data.items : [];
    return items.map((item: any) => ({
      id: String(item?.id || ''),
      title: String(item?.snippet?.title || 'Untitled Channel'),
      name: String(item?.snippet?.title || 'Untitled Channel'),
      description: String(item?.snippet?.description || ''),
      thumbnail: String(item?.snippet?.thumbnails?.default?.url || ''),
      uploadsPlaylistId: String(item?.contentDetails?.relatedPlaylists?.uploads || ''),
    }));
  }

  private async fetchYouTubePlaylistsForChannel(
    token: string,
    channelId: string
  ): Promise<Array<Record<string, unknown>>> {
    const data = await this.youtubeApiGet(
      `playlists?part=snippet,contentDetails&channelId=${encodeURIComponent(channelId)}&maxResults=50`,
      token
    );
    const items = Array.isArray(data?.items) ? data.items : [];
    return items.map((item: any) => ({
      id: String(item?.id || ''),
      title: String(item?.snippet?.title || 'Untitled Playlist'),
      description: String(item?.snippet?.description || ''),
      videoCount: Number(item?.contentDetails?.itemCount || 0),
      thumbnail: String(item?.snippet?.thumbnails?.medium?.url || ''),
      channelId: String(channelId || ''),
    }));
  }

  private async fetchYouTubePlaylists(): Promise<Array<Record<string, unknown>>> {
    const token = await this.getYouTubeAuthToken();
    if (!token) throw new Error('Not authenticated');
    const playlists = await youtubeService.getPlaylists();
    return playlists.map((playlist: any) => ({
      id: String(playlist?.id || ''),
      title: String(playlist?.title || 'Untitled Playlist'),
      description: String(playlist?.description || ''),
      videoCount: Number(playlist?.videoCount || 0),
      thumbnail: String(playlist?.thumbnail || ''),
    }));
  }

  private async readSelectedYouTubeChannelId(): Promise<string> {
    const stored = await chrome.storage.local.get(['ai_studio_channel_id']);
    return String(stored.ai_studio_channel_id || '').trim();
  }

  private async resolveSelectedYouTubeChannelId(
    channels: Array<Record<string, unknown>>
  ): Promise<string> {
    const knownIds = new Set(
      channels
        .map((channel) => String(channel?.id || '').trim())
        .filter((channelId) => channelId.length > 0)
    );

    const selectedChannelId = await this.readSelectedYouTubeChannelId();
    if (selectedChannelId && knownIds.has(selectedChannelId)) {
      return selectedChannelId;
    }

    if (selectedChannelId && !knownIds.has(selectedChannelId)) {
      await chrome.storage.local.remove(['ai_studio_channel_id']);
    }

    if (channels.length === 1) {
      const autoSelectedChannelId = String(channels[0]?.id || '').trim();
      if (autoSelectedChannelId) {
        await chrome.storage.local.set({ ai_studio_channel_id: autoSelectedChannelId });
      }
      return autoSelectedChannelId;
    }

    return '';
  }

  private async fetchYouTubePlaylistsBundle(): Promise<{
    playlists: Array<Record<string, unknown>>;
    channels: Array<Record<string, unknown>>;
    selectedChannelId: string;
    requiresChannelSelection: boolean;
  }> {
    const token = await this.getYouTubeAuthToken();
    if (!token) throw new Error('Not authenticated');

    let channels: Array<Record<string, unknown>> = [];
    let channelLookupReliable = true;
    try {
      channels = await this.fetchYouTubeChannels();
    } catch (error) {
      channelLookupReliable = false;
      console.warn(
        '[FuseConnect v7] Unable to enumerate YouTube channels. Falling back to mine=true playlists.',
        error
      );
    }
    const selectedChannelId = channelLookupReliable
      ? await this.resolveSelectedYouTubeChannelId(channels)
      : await this.readSelectedYouTubeChannelId();

    let playlists: Array<Record<string, unknown>> = [];
    if (selectedChannelId) {
      try {
        playlists = await this.fetchYouTubePlaylistsForChannel(token, selectedChannelId);
      } catch (error) {
        console.warn(
          '[FuseConnect v7] Failed to fetch playlists for selected channel, using fallback mine=true',
          error
        );
        playlists = await this.fetchYouTubePlaylists();
      }
    } else {
      playlists = await this.fetchYouTubePlaylists();
    }

    return {
      playlists,
      channels,
      selectedChannelId,
      requiresChannelSelection: channels.length > 1 && !selectedChannelId,
    };
  }

  private getOAuthDiagnostics(): {
    extensionId: string;
    clientId: string;
    redirectUri: string;
    scopes: string[];
  } {
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

  private async getAuthTokenInteractive(scopes: string[]): Promise<string> {
    const diagnostics = this.getOAuthDiagnostics();
    const scopeParam = encodeURIComponent(scopes.join(' '));
    const authUrl =
      `${API_URLS.googleOAuth}?` +
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
        } catch (err: any) {
          reject(new Error(err?.message || 'OAuth redirect parse failed'));
        }
      });
    });
  }

  private async fetchGoogleUserProfile(token: string): Promise<{
    email: string;
    name: string;
    picture: string;
  }> {
    const response = await fetch(API_URLS.googleUserInfo, {
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

  private async authenticateYouTube(): Promise<{
    token: string;
    primaryProfile: { email: string; name: string; picture: string };
    accountSwitched: boolean;
  }> {
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

  private normalizeOAuthError(err: any): Error {
    const msg = String(err?.message || err || 'Authentication failed');
    if (
      msg.includes('redirect_uri_mismatch') ||
      msg.includes('invalid_request') ||
      msg.includes('OAuth2 not granted or revoked')
    ) {
      const diagnostics = this.getOAuthDiagnostics();
      return new Error(
        `OAuth setup mismatch for extension identity. Ensure OAuth client is Chrome Extension type bound to extension ID ${diagnostics.extensionId} and client_id ${diagnostics.clientId}. Redirect URI should be ${diagnostics.redirectUri}`
      );
    }
    return new Error(msg);
  }

  private async authenticateYouTubeSafe(): Promise<{
    token: string;
    primaryProfile: { email: string; name: string; picture: string };
    accountSwitched: boolean;
  }> {
    try {
      const stored = await chrome.storage.local.get(['youtubeToken', 'ai_studio_token']);
      const tokens = [stored.youtubeToken, stored.ai_studio_token]
        .map((t) => String(t || '').trim())
        .filter(Boolean);
      for (const token of tokens) {
        await new Promise<void>((resolve) => {
          chrome.identity.removeCachedAuthToken({ token }, () => resolve());
        });
      }
      await new Promise<void>((resolve) =>
        chrome.identity.clearAllCachedAuthTokens(() => resolve())
      );
      await chrome.storage.local.remove(['ai_studio_token', 'youtubeToken', 'youtubeTokenExpiry']);
      return await this.authenticateYouTube();
    } catch (err: any) {
      throw this.normalizeOAuthError(err);
    }
  }

  private async signOutYouTube(): Promise<void> {
    const result = await chrome.storage.local.get(['ai_studio_token', 'youtubeToken']);
    const tokens = [result.ai_studio_token, result.youtubeToken]
      .map((t) => String(t || '').trim())
      .filter(Boolean);

    await new Promise<void>((resolve) => {
      chrome.storage.local.remove(
        [
          'ai_studio_token',
          'youtubeToken',
          'youtubeTokenExpiry',
          'ai_studio_channel_id',
          'userProfile',
          'lastAuthAccount',
          'isAuthenticated',
        ],
        () => resolve()
      );
    });

    for (const token of Array.from(new Set(tokens))) {
      await new Promise<void>((resolve) => {
        chrome.identity.removeCachedAuthToken({ token }, () => resolve());
      });
    }

    await new Promise<void>((resolve) => {
      chrome.identity.clearAllCachedAuthTokens(() => resolve());
    });
  }

  private async fetchPlaylistVideos(playlistId: string): Promise<Array<Record<string, unknown>>> {
    const token = await this.getYouTubeAuthToken();
    if (!token) throw new Error('Not authenticated');
    if (!playlistId) throw new Error('Missing playlist id');
    const videos = await youtubeService.getPlaylistVideos(playlistId);
    return videos
      .map((video: any) => {
        const videoId = String(video?.id || '').trim();
        if (!videoId) return null;
        return {
          id: videoId,
          title: String(video?.title || `YouTube Video ${videoId}`),
          url: `https://www.youtube.com/watch?v=${videoId}`,
          channelTitle: String(video?.channelTitle || ''),
          thumbnail: String(
            video?.thumbnail ||
              `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/mqdefault.jpg`
          ),
          addedAt: Date.now(),
        };
      })
      .filter(Boolean) as Array<Record<string, unknown>>;
  }

  private async fetchVideoDetails(videoIds: string[]): Promise<Array<Record<string, unknown>>> {
    const token = await this.getYouTubeAuthToken();
    if (!token) throw new Error('Not authenticated');
    const ids = videoIds.map((id) => String(id || '').trim()).filter(Boolean);
    if (ids.length === 0) return [];
    const details = await youtubeService.getVideoDetails(ids);
    return details.map((item: any) => ({
      id: String(item?.id || ''),
      title: String(item?.title || ''),
      channelTitle: String(item?.channelTitle || ''),
      durationISO: String(item?.durationISO || ''),
      viewCount: Number(item?.viewCount || 0),
      likeCount: Number(item?.likeCount || 0),
    }));
  }

  private async createYouTubePlaylist(
    title: string,
    description: string
  ): Promise<Record<string, unknown>> {
    await youtubeService.ensureAuthenticated();
    const data = await youtubeService.createPlaylist(
      title,
      description || 'Created by Fuse Connect AIVI',
      'private'
    );
    return {
      id: String(data?.id || ''),
      title: String(data?.title || title),
      description: String(data?.description || ''),
    };
  }

  private async processAIVideoTick(): Promise<void> {
    // Keep this stub for compatibility or clear the alarm if it still triggers
    chrome.alarms.clear(AI_VIDEO_PROCESS_ALARM);
  }

  // --- AI STUDIO ORCHESTRATOR START ---

  private async createNewAIStudioTab(): Promise<chrome.tabs.Tab> {
    console.log('🆕 Creating new AI Studio tab...');
    const tab = await chrome.tabs.create({
      url: `${API_URLS.aiStudio}/app/prompts/new_chat?model=${AI_MODELS.aiStudioDefault}`,
      active: true,
    });

    // Wait for tab to load
    await new Promise<void>((resolve) => {
      const checkReady = setInterval(async () => {
        try {
          if (tab.id) {
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'PING' });
            if (response?.alive) {
              clearInterval(checkReady);
              resolve();
            }
          }
        } catch (e) {
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

  private async sendTaskAndWait(tabId: number, task: any, timeout = 700000): Promise<any> {
    return new Promise((resolve, reject) => {
      this.pendingTaskResolve = resolve;

      chrome.tabs.sendMessage(tabId, { action: 'EXECUTE_TASK', task }).catch((err) => {
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

  private async closeTab(tabId: number): Promise<void> {
    try {
      await chrome.tabs.remove(tabId);
    } catch (e) {
      console.log('Tab already closed');
    }
  }

  private async startAutomationOrchestrator(
    queue: any[],
    nextState: any,
    segmentDuration = 45,
    processingLevel = 'ai_studio'
  ): Promise<void> {
    this.automationRunning = true;
    this.automationPaused = false;
    const segmentDurationSecs = segmentDuration * 60;

    for (let videoIndex = 0; videoIndex < queue.length; videoIndex++) {
      if (!this.automationRunning) break;
      while (this.automationPaused) await new Promise((r) => setTimeout(r, 1000));

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
            const durationResult: any = await this.sendTaskAndWait(
              durationTab.id,
              {
                type: 'GET_DURATION',
                url: video.url,
              },
              60000
            );
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
        } else {
          segments.push({ index: 0, startTime: 0, endTime: null });
        }

        for (const segment of segments) {
          if (!this.automationRunning) break;
          while (this.automationPaused) await new Promise((r) => setTimeout(r, 1000));

          const processTab = await this.createNewAIStudioTab();
          if (processTab.id) {
            const processResult: any = await this.sendTaskAndWait(processTab.id, {
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
      } catch (err: any) {
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

  private extractYouTubeVideoId(urlOrId: string): string {
    const raw = String(urlOrId || '').trim();
    if (/^[\w-]{11}$/.test(raw)) return raw;
    const match = raw.match(/(?:v=|youtu\.be\/)([\w-]{11})/i);
    return String(match?.[1] || '').trim();
  }

  private parseTranscriptXml(xml: string): string {
    const segments = Array.from(String(xml || '').matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)).map(
      (m) => m[1] || ''
    );
    const decode = (s: string) =>
      s
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"');
    return segments
      .map((s) =>
        decode(
          String(s)
            .replace(/<[^>]+>/g, '')
            .trim()
        )
      )
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  private async fetchVideoTranscript(videoId: string): Promise<string> {
    if (!videoId) return '';
    try {
      const response = await fetch(
        `https://www.youtube.com/api/timedtext?lang=en&v=${encodeURIComponent(videoId)}`
      );
      if (!response.ok) return '';
      const xml = await response.text();
      return this.parseTranscriptXml(xml);
    } catch {
      return '';
    }
  }

  private buildSentenceSummary(text: string, maxSentences: number): string {
    const sentences = String(text || '')
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return sentences.slice(0, maxSentences).join(' ');
  }

  private async buildLightweightReport(video: any, processingLevel: string): Promise<string> {
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
      this.readyContentTabs.delete(tabId);
      this.unreachableTabs.delete(tabId);
      this.broadcastFailLogAt.delete(tabId);
      this.unregisterTabEdgeAgents(tabId);
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
    const now = Date.now();
    if (this.nativeHostUnavailable || now < this.nativeHostBackoffUntil) {
      return {
        error:
          now < this.nativeHostBackoffUntil
            ? 'Native host temporarily unavailable'
            : 'Specified native messaging host not found',
        unavailable: true,
      };
    }

    console.debug('[NativeMessaging] Sending:', message.action, message.service || '');
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value: Record<string, unknown>) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      };
      const timer = setTimeout(() => {
        this.nativeHostBackoffUntil = Date.now() + 60000;
        console.warn('[NativeMessaging] Timed out waiting for native host');
        finish({ error: 'Native host timed out', unavailable: true });
      }, NATIVE_MESSAGE_TIMEOUT_MS);

      try {
        chrome.runtime.sendNativeMessage(NATIVE_HOST_NAME, message, (response) => {
          if (chrome.runtime.lastError) {
            const errMsg = chrome.runtime.lastError.message || 'Native messaging error';
            const hostMissing =
              errMsg.includes('Specified native messaging host not found') ||
              errMsg.includes('No such native application');
            const hostExited =
              /native host has exited/i.test(errMsg) ||
              /host .+ has exited/i.test(errMsg) ||
              /disconnected port/i.test(errMsg);

            if (hostMissing) {
              this.nativeHostUnavailable = true;
              if (!this.nativeHostMissingLogged) {
                this.nativeHostMissingLogged = true;
                console.warn(
                  '[NativeMessaging] Native host not installed; native service controls disabled'
                );
              }
            } else if (hostExited) {
              // Host binary exists but crashed/exited — back off instead of spamming errors.
              this.nativeHostBackoffUntil = Date.now() + 60000;
              if (!this.nativeHostMissingLogged) {
                this.nativeHostMissingLogged = true;
                console.warn(
                  '[NativeMessaging] Native host exited; retrying after cooldown. Re-run apps/chrome-extension/install.sh if this persists.'
                );
              }
            } else {
              console.warn('[NativeMessaging] Error:', errMsg);
            }

            finish({ error: errMsg, unavailable: hostMissing || hostExited });
          } else {
            // Successful response clears the one-shot warning latch for future sessions.
            this.nativeHostMissingLogged = false;
            finish((response as Record<string, unknown>) || {});
          }
        });
      } catch (e) {
        console.warn('[NativeMessaging] Exception:', e);
        finish({ error: 'Native messaging not available' });
      }
    });
  }

  private async sendActivityEvent(
    eventType: string,
    metadata: Record<string, unknown> = {},
    channel = ACTIVITY_CHANNEL
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
        relayUrl: this.relayUrl,
        policy: {
          heartbeat: true,
          wakePing: this.autoWakePing,
          autonomous: true,
        },
      },
    });
  }

  // ============================================
  // AI Bookmark Organizer
  // ============================================

  private bookmarkBrokerOpts(settings: BookmarkOrganizerSettings): BookmarkRequestOptions {
    return {
      targetAgentId: settings.targetAgentId || undefined,
      channel: settings.targetChannel || undefined,
    };
  }

  /**
   * Two-phase analyze: generate a unified folder taxonomy, then classify every
   * non-private bookmark into it in resumable batches, persisting progress after
   * each batch so a mid-run interruption leaves a usable partial plan rather than
   * a hung UI. Zero-folder mode skips straight to "leave everything in place".
   */
  private async runBookmarkAnalyze(
    options: { granularity?: BookmarkPlan['granularity'] } = {}
  ): Promise<BookmarkPlan> {
    this.bookmarkAnalyzeJob = { cancelled: false };
    const job = this.bookmarkAnalyzeJob;

    try {
      const settings = await bookmarkSettingsService.getSettings();
      const granularity = options.granularity || settings.granularity;
      const brokerOpts = this.bookmarkBrokerOpts(settings);

      const allBookmarks = await bookmarkStoreService.readAllBookmarks();
      const { included, excluded } = filterBookmarks(allBookmarks, settings.privateDomains);
      const duplicates = computeDuplicates(allBookmarks);

      let taxonomy;
      let items;

      if (settings.zeroFolderMode) {
        taxonomy = { id: `tax-${Date.now()}`, generatedAt: Date.now(), granularity, folders: [] };
        items = zeroFolderPlanItems(included);
      } else {
        taxonomy = await generateTaxonomy(included, granularity, this.bookmarkBroker, brokerOpts);
        items = await classifyAll({
          bookmarks: included,
          taxonomy,
          broker: this.bookmarkBroker,
          brokerOpts,
          batchDelayMs: TIMINGS.bookmarkBatchDelay,
          shouldCancel: () => job.cancelled,
          onProgress: ({ items: partialItems, cursor, totalWithOffset }) => {
            this.notifyPopup({
              type: 'BOOKMARKS_ANALYZE_PROGRESS',
              data: { cursor, total: totalWithOffset },
            });
            void bookmarkStoreService.savePlan({
              id: taxonomy!.id,
              generatedAt: taxonomy!.generatedAt,
              granularity,
              taxonomy: taxonomy!,
              items: partialItems,
              duplicates,
              complete: false,
              cursor,
            });
          },
        });
      }

      // Private-domain bookmarks are always left exactly where they are — they're
      // never sent to the relay in the first place, and never proposed a move.
      for (const ex of excluded) {
        items.push({
          bookmarkId: ex.id,
          title: ex.title,
          url: ex.url,
          currentPath: ex.path,
          selected: false,
        });
      }

      const plan: BookmarkPlan = {
        id: taxonomy.id,
        generatedAt: taxonomy.generatedAt,
        granularity,
        taxonomy,
        items,
        duplicates,
        complete: !job.cancelled,
        cursor: items.length,
      };

      await bookmarkStoreService.savePlan(plan);

      const tagRecords = items
        .filter((i) => (i.tags && i.tags.length) || i.summary)
        .map((i) => ({
          bookmarkId: i.bookmarkId,
          tags: i.tags ?? [],
          summary: i.summary,
          updatedAt: Date.now(),
        }));
      if (tagRecords.length) await bookmarkTaggingService.saveRecords(tagRecords);

      return plan;
    } finally {
      if (this.bookmarkAnalyzeJob === job) this.bookmarkAnalyzeJob = null;
    }
  }

  private async applyBookmarkPlan(
    planFromRequest?: BookmarkPlan
  ): Promise<{ moved: number; skipped: number }> {
    const plan = planFromRequest || (await bookmarkStoreService.getStoredPlan());
    if (!plan) throw new Error('No bookmark plan to apply — run Analyze first.');
    await bookmarkStoreService.snapshotBeforeApply(plan);
    return bookmarkStoreService.applyPlan(plan);
  }

  private async runBookmarkSearch(query: string) {
    const settings = await bookmarkSettingsService.getSettings();
    const allBookmarks = await bookmarkStoreService.readAllBookmarks();
    const { included } = filterBookmarks(allBookmarks, settings.privateDomains);
    return bookmarkTaggingService.search(query, included);
  }

  /**
   * Always detach-then-reattach so a settings change (new target agent/channel,
   * updated private-domains list) is picked up immediately rather than only on the
   * next full toggle — attach() alone is a no-op while a listener is already live.
   */
  private syncBookmarkRealtimeListener(settings: BookmarkOrganizerSettings): void {
    bookmarkRealtimeService.detach();
    if (!settings.realtimeEnabled) return;

    bookmarkRealtimeService.attach({
      broker: this.bookmarkBroker,
      getBrokerOpts: () => this.bookmarkBrokerOpts(settings),
      getPrivateDomains: () => settings.privateDomains,
      onFiled: (bookmarkId, path) => {
        this.notifyPopup({ type: 'BOOKMARKS_REALTIME_FILED', data: { bookmarkId, path } });
      },
      onError: (err) => {
        console.warn('[FuseConnect v7] Bookmark realtime classify failed:', err);
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
          this.relayUrl = this.normalizeRelayUrl(message.url) || this.relayUrl;
          this.connectToNode('relay', this.relayUrl);
          sendResponse({ success: true });
          break;

        case 'DISCONNECT':
          this.disconnectAll();
          sendResponse({ success: true });
          break;

        case 'NATIVE_COMMAND':
          this.sendNativeMessage({
            command: message.command,
            port: message.port,
            cmd: message.cmd,
          })
            .then((response) => {
              sendResponse(response);
            })
            .catch((error) => {
              sendResponse({ success: false, error: error.message });
            });
          return true; // Async response

        case 'GET_STATE': {
          void this.buildGetStatePayload(sender, message)
            .then(sendResponse)
            .catch((error) => {
              sendResponse({ success: false, error: String(error?.message || error) });
            });
          return true;
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
              setTimeout(async () => {
                this.connectionAttempts = 0;
                const preferredUrl =
                  typeof response?.result?.port === 'number' && response.result.port > 0
                    ? `ws://localhost:${response.result.port}/ws`
                    : this.relayUrl;
                const discoveredAfterStart = await this.discoverRelayUrl(preferredUrl);
                if (discoveredAfterStart) {
                  this.persistDiscoveredRelayUrl(discoveredAfterStart);
                }
                this.connectToNode('relay', this.relayUrl);
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
          this.checkRelayHealth(this.normalizeRelayUrl(message.url) || this.relayUrl).then(
            (isHealthy) => {
              sendResponse({ healthy: isHealthy, url: this.relayUrl });
            }
          );
          return true;

        case 'SETTINGS_CHANGE':
          if (message.settings) {
            const nextRelayUrl =
              this.normalizeRelayUrl(message.settings.relayUrl) ||
              this.normalizeRelayUrl(message.settings?.nodes?.endpoints?.relay);
            if (nextRelayUrl) {
              this.relayUrl = nextRelayUrl;
            }
          }
          sendResponse({ success: true, relayUrl: this.relayUrl });
          break;

        case 'AI_STUDIO_AUTH':
        case 'YOUTUBE_AUTHENTICATE':
          // Handle AI Studio OAuth2 authentication.
          console.log('[FuseConnect v7] Starting YouTube auth flow', this.getOAuthDiagnostics());
          this.authenticateYouTubeSafe()
            .then(({ token, primaryProfile, accountSwitched }) => {
              const tokenExpiry = Date.now() + 50 * 60 * 1000;
              chrome.storage.local.set(
                {
                  ai_studio_token: token,
                  youtubeToken: token,
                  youtubeTokenExpiry: tokenExpiry,
                  userProfile: primaryProfile,
                  lastAuthAccount: primaryProfile?.email || '',
                  ai_studio_channel_id: '',
                  isAuthenticated: true,
                },
                async () => {
                  chrome.storage.local.get(['firstAuthAt'], (existing) => {
                    if (!existing.firstAuthAt) {
                      chrome.storage.local.set({ firstAuthAt: Date.now() });
                    }
                  });

                  let bundle: {
                    playlists: Array<Record<string, unknown>>;
                    channels: Array<Record<string, unknown>>;
                    selectedChannelId: string;
                    requiresChannelSelection: boolean;
                  } = {
                    playlists: [],
                    channels: [],
                    selectedChannelId: '',
                    requiresChannelSelection: false,
                  };
                  try {
                    bundle = await this.fetchYouTubePlaylistsBundle();
                  } catch (error) {
                    console.warn(
                      '[FuseConnect v7] Auth succeeded but initial playlist bundle failed:',
                      error
                    );
                  }

                  sendResponse({
                    success: true,
                    token,
                    data: { authenticated: true, primaryProfile },
                    oauth: this.getOAuthDiagnostics(),
                    ...bundle,
                    accountSwitched,
                  });
                }
              );
            })
            .catch((err) => {
              sendResponse({
                success: false,
                error: err.message || 'Authentication failed',
                oauth: this.getOAuthDiagnostics(),
              });
            });
          return true; // Async response

        case 'YOUTUBE_SIGN_OUT':
          this.signOutYouTube()
            .then(() => sendResponse({ success: true }))
            .catch((error) =>
              sendResponse({ success: false, error: String(error?.message || error) })
            );
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
          this.fetchYouTubePlaylistsBundle()
            .then((bundle) => {
              sendResponse({
                success: true,
                channels: bundle.channels,
                selectedChannelId: bundle.selectedChannelId,
                requiresChannelSelection: bundle.requiresChannelSelection,
              });
            })
            .catch((error) => {
              const err = String(error?.message || error || '');
              const normalized = err.includes('Quota Protection') ? 'Not authenticated' : err;
              sendResponse({ success: false, error: normalized });
            });
          return true;

        case 'AI_STUDIO_SET_CHANNEL': {
          const requestedChannelId = String(
            message.channelId || message.data?.channelId || ''
          ).trim();
          this.fetchYouTubePlaylistsBundle()
            .then(async (bundle) => {
              const allowedChannelIds = new Set(
                (bundle.channels || [])
                  .map((channel) => String(channel?.id || '').trim())
                  .filter((channelId) => channelId.length > 0)
              );
              const nextChannelId =
                requestedChannelId &&
                (allowedChannelIds.size === 0 || allowedChannelIds.has(requestedChannelId))
                  ? requestedChannelId
                  : '';

              if (nextChannelId) {
                await chrome.storage.local.set({ ai_studio_channel_id: nextChannelId });
              } else {
                await chrome.storage.local.remove(['ai_studio_channel_id']);
              }

              const refreshedBundle = await this.fetchYouTubePlaylistsBundle();
              sendResponse({
                success: true,
                channelId: nextChannelId,
                ...refreshedBundle,
              });
            })
            .catch((error) => {
              const err = String(error?.message || error || '');
              const normalized = err.includes('Quota Protection') ? 'Not authenticated' : err;
              sendResponse({ success: false, error: normalized });
            });
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
          const videos =
            message.type === 'QUEUE_ADD_SINGLE' ? [message.data?.video] : message.data?.videos;
          chrome.storage.local.get(['videoQueue'], (result) => {
            const existing = Array.isArray(result.videoQueue) ? result.videoQueue : [];
            const incoming = Array.isArray(videos) ? videos : [];
            const next = [
              ...existing,
              ...incoming
                .filter((v: any) => v && (v.url || v.id))
                .map((v: any, idx: number) => {
                  const url = String(
                    v.url || (v.id ? `https://www.youtube.com/watch?v=${v.id}` : '')
                  ).trim();
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
            ? message.data.videoIds.map((id: unknown) => String(id))
            : [];
          chrome.storage.local.get(['videoQueue'], (result) => {
            const existing = Array.isArray(result.videoQueue) ? result.videoQueue : [];
            const next = existing.filter((item: any) => !ids.includes(String(item?.id || '')));
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

        // ---- AI Bookmark Organizer ----

        case 'BOOKMARKS_GET_SUMMARY':
          bookmarkStoreService
            .getSummary()
            .then((data) => sendResponse({ success: true, data }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;

        case 'BOOKMARKS_FIND_DUPLICATES':
          bookmarkStoreService
            .findDuplicates()
            .then((data) => sendResponse({ success: true, data }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;

        case 'BOOKMARKS_GET_SETTINGS':
          bookmarkSettingsService
            .getSettings()
            .then((data) => sendResponse({ success: true, data }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;

        case 'BOOKMARKS_SET_SETTINGS':
          bookmarkSettingsService
            .setSettings(message.data?.settings || {})
            .then((data) => {
              sendResponse({ success: true, data });
              this.syncBookmarkRealtimeListener(data);
            })
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;

        case 'BOOKMARKS_SET_REALTIME':
          bookmarkSettingsService
            .setSettings({ realtimeEnabled: !!message.data?.enabled })
            .then((data) => {
              sendResponse({ success: true, data });
              this.syncBookmarkRealtimeListener(data);
            })
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;

        case 'BOOKMARKS_ANALYZE':
          this.runBookmarkAnalyze(message.data || {})
            .then((data) => sendResponse({ success: true, data }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;

        case 'BOOKMARKS_CANCEL_ANALYZE':
          if (this.bookmarkAnalyzeJob) this.bookmarkAnalyzeJob.cancelled = true;
          sendResponse({ success: true });
          break;

        case 'BOOKMARKS_GET_PLAN':
          bookmarkStoreService
            .getStoredPlan()
            .then((data) => sendResponse({ success: true, data }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;

        case 'BOOKMARKS_APPLY_PLAN':
          this.applyBookmarkPlan(message.data?.plan)
            .then((data) => sendResponse({ success: true, data }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;

        case 'BOOKMARKS_UNDO_LAST':
          bookmarkStoreService
            .undoLast()
            .then((data) => sendResponse({ success: true, data }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;

        case 'BOOKMARKS_SEARCH':
          this.runBookmarkSearch(String(message.data?.query || ''))
            .then((data) => sendResponse({ success: true, data }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true;

        case 'AI_STUDIO_READY':
          sendResponse({ success: true, data: { ready: true } });
          return false;

        case 'AI_STUDIO_PROGRESS': {
          const data = message.data || {};
          chrome.storage.local.get(['processingState'], (result) => {
            const current = (result.processingState ||
              this.getDefaultProcessingState()) as AIVideoProcessingState;
            const next: AIVideoProcessingState = {
              ...current,
              isProcessing: true,
              isPaused: false,
              currentIndex: Number(data.currentIndex || current.currentIndex || 0),
              currentVideo: (data.currentVideo ||
                current.currentVideo ||
                null) as AIVideoQueueItem | null,
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
              this.getDefaultProcessingState()) as AIVideoProcessingState;
            const increment = Math.max(1, Number(message.data?.processedCount || 1));
            const next: AIVideoProcessingState = {
              ...current,
              isProcessing: false,
              isPaused: false,
              currentVideo: null,
              currentIndex: Math.max(current.totalCount || 0, current.currentIndex || 0),
              lastUpdated: Date.now(),
            };
            chrome.storage.local.set(
              {
                processingState: next,
                ai_video_processed_count: Number(result.ai_video_processed_count || 0) + increment,
              },
              () => {
                this.broadcastToTabs({ type: 'AI_VIDEO_PROCESSING_UPDATE', state: next });
                sendResponse({ success: true, data: { completed: true } });
              }
            );
          });
          return true;

        case 'AI_STUDIO_ERROR':
          this.logEvent(
            'ai-video',
            'automation_error',
            {
              error: String(message.data?.error || message.error || 'Unknown error'),
            },
            'error'
          );
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
          chrome.storage.local.set(
            {
              processingLevel: String(message.data?.processingLevel || 'ai_studio'),
              segmentDuration: Math.max(
                5,
                Math.min(300, Number(message.data?.segmentDuration || 45))
              ),
              reverseOrder: !!message.data?.reverseOrder,
              videoQueue: Array.isArray(message.data?.queue) ? message.data.queue : [],
            },
            () => {
              chrome.storage.local.get(['videoQueue'], (result) => {
                const queue = Array.isArray(result.videoQueue) ? result.videoQueue : [];
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
                  { processingState: nextState, ai_video_total_count: queue.length },
                  () => {
                    chrome.alarms.create(AI_VIDEO_PROCESS_ALARM, { periodInMinutes: 1 });
                    this.broadcastToTabs({ type: 'AI_VIDEO_PROCESSING_UPDATE', state: nextState });
                    sendResponse({ success: true, data: { started: true }, state: nextState });
                  }
                );
              });
            }
          );
          return true;

        case 'AUTOMATION_PAUSE':
          chrome.storage.local.get(['processingState'], (result) => {
            const current = (result.processingState ||
              this.getDefaultProcessingState()) as AIVideoProcessingState;
            const next: AIVideoProcessingState = {
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
              this.getDefaultProcessingState()) as AIVideoProcessingState;
            const next: AIVideoProcessingState = {
              ...current,
              isProcessing: true,
              isPaused: false,
              lastUpdated: Date.now(),
            };
            chrome.storage.local.set({ processingState: next }, () => {
              chrome.alarms.create(AI_VIDEO_PROCESS_ALARM, { periodInMinutes: 1 });
              this.broadcastToTabs({ type: 'AI_VIDEO_PROCESSING_UPDATE', state: next });
              sendResponse({ success: true, data: { resumed: true }, state: next });
            });
          });
          return true;

        case 'AUTOMATION_STOP':
          chrome.storage.local.get(['processingState'], (result) => {
            const current = (result.processingState ||
              this.getDefaultProcessingState()) as AIVideoProcessingState;
            const next: AIVideoProcessingState = {
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
          const playlistId =
            String(message.playlistId || '') || String(message.data?.playlistId || '');
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
          chrome.storage.local.get(
            [
              'ai_video_processed_count',
              'ai_video_total_count',
              'ai_video_estimated_cost',
              'ai_studio_token',
              'userProfile',
              'videoQueue',
            ],
            (result) => {
              const profileEmail = String(result.userProfile?.email || '').trim();
              sendResponse({
                processed: result.ai_video_processed_count || 0,
                total: result.ai_video_total_count || result.videoQueue?.length || 0,
                cost: result.ai_video_estimated_cost || 0,
                account: result.ai_studio_token ? profileEmail || 'Authenticated' : 'None',
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
                  this.logEvent('ai-video', 'processing_started', { totalCount: queue.length });
                  chrome.storage.local.get(['segmentDuration', 'processingLevel'], (opts) => {
                    this.startAutomationOrchestrator(
                      queue,
                      nextState,
                      opts.segmentDuration || 45,
                      String(opts.processingLevel || 'ai_studio')
                    );
                  });
                  this.broadcastToTabs({ type: 'AI_VIDEO_PROCESSING_UPDATE', state: nextState });
                  sendResponse({ success: true, state: nextState });
                }
              );
              return;
            }

            if (action === 'pause') {
              this.automationPaused = true;
              const nextState: AIVideoProcessingState = {
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
              const nextState: AIVideoProcessingState = {
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
              const nextState: AIVideoProcessingState = {
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
          const pageUrl =
            page === 'notebooklm'
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
        case 'TASK_ERROR':
          if (this.pendingTaskResolve) {
            this.pendingTaskResolve(message);
            this.pendingTaskResolve = null;
          }
          this.broadcastToTabs(message);
          sendResponse({ success: true });
          break;

        case 'CONTENT_SCRIPT_READY':
          if (sender.tab?.id) {
            this.readyContentTabs.add(sender.tab.id);
            this.unreachableTabs.delete(sender.tab.id);
          }
          console.debug('📢 Content script ready on:', message.url);
          sendResponse({ success: true });
          break;

        case 'SIDE_PANEL_OPENED':
          void this.handleSidePanelOpened(message)
            .then(sendResponse)
            .catch((error) =>
              sendResponse({ success: false, error: String(error?.message || error) })
            );
          return true;

        case 'SIDE_PANEL_READY':
          void this.handleSidePanelReady(message)
            .then(sendResponse)
            .catch((error) =>
              sendResponse({ success: false, error: String(error?.message || error) })
            );
          return true;

        case 'SET_SIDE_PANEL_PAIRING': {
          const tabId = Number(message.tabId);
          if (!Number.isInteger(tabId) || tabId <= 0) {
            sendResponse({ success: false, error: 'tabId required' });
            break;
          }
          const pair = this.upsertSidePanelPair(tabId, {
            a2aEnabled: message.a2aEnabled !== false,
          });
          this.notifyPopup({ type: 'SIDE_PANEL_PAIR_UPDATE', pair });
          sendResponse({ success: true, pair });
          break;
        }

        case 'BROADCAST_MESSAGE':
          // CRITICAL FIX: Preserve the `metadata` including `senderId` so receiving tabs
          // can identify messages that originated from themselves and avoid self-injection loops.
          {
            const senderId = String(message.senderId || message.metadata?.senderId || '');
            const senderIdentity = senderId ? this.getCompleteAgentIdentity(senderId) : null;

            // Federated addressing: `/to <handle>`, `@ID#:<base58>`, `@page-agent-...`
            // and `@<Platform>` resolve to a concrete recipient and are stripped from
            // the content. Anything unaddressed stays a broadcast. Mirrors
            // scripts/lib/federation-relay-client.cjs#sendChannelMessage so the browser
            // edge and standalone relay clients address each other identically.
            const resolved = resolveMessageTarget(
              String(message.content ?? ''),
              Array.from(this.agents.values())
            );

            let to = resolved.to;
            let addressedAgentId = resolved.addressedAgentId;
            let addressedHandle = resolved.addressedHandle;
            let channel = message.channel || null;
            if (to === 'broadcast') {
              const peerId = this.a2aPeerId(senderId);
              if (peerId) {
                to = peerId;
                addressedAgentId = peerId;
                const peer = this.agents.get(peerId);
                addressedHandle = peer?.operationalHandle || peer?.name || null;
                const pair = this.findA2APairForAgent(senderId);
                channel = channel || pair?.channelId || null;
              }
            }

            const metadata = senderIdentity
              ? enrichOutboundMetadata(senderIdentity, {
                  channel,
                  senderId,
                  extra: {
                    ...(message.metadata || {}),
                    addressedAgentId,
                    addressedHandle,
                    a2a: to !== 'broadcast' && !!this.findA2APairForAgent(senderId),
                  },
                })
              : {
                  ...(message.metadata || {}),
                  addressedAgentId,
                  addressedHandle,
                };

            if (addressedAgentId) {
              console.log('[FuseConnect v7] Addressed message ->', {
                to,
                handle: addressedHandle,
                channel,
              });
            }

            this.send({
              type: 'MESSAGE_SEND',
              to,
              channel,
              content: resolved.content,
              messageType: 'text',
              metadata, // <-- PRESERVE SENDER INFO
            });
            this.sendActivityEvent('broadcast_message', {
              channel: channel || null,
              senderId: senderId || null,
              contentPreview: String(message.content || '').substring(0, 120),
            });
            sendResponse({ success: true, to, channel });
          }
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
          // A brand-new channel must reach the tabs that are already open.
          this.joinPageAgentsToChannel(newChannel.id);
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

          // The local `local-` channel is a placeholder that only becomes real
          // when the relay echoes CHANNEL_CREATED/CHANNEL_LIST back and we remap
          // onto its id. Reporting a flat success while the relay link is down
          // told the user the channel existed federation-wide when it did not.
          const relayConnected = this.primaryConnection?.readyState === WebSocket.OPEN;
          sendResponse({
            success: true,
            pending: !relayConnected,
            channel: newChannel,
            ...(relayConnected
              ? {}
              : {
                  warning: `Created locally only — relay is not connected, "${trimmedName}" will be published when the link is restored`,
                }),
          });
          break;
        }

        case 'CHANNEL_JOIN':
          this.joinedChannels.add(message.channelId);
          // Existing page agents must become members too, not just this tab.
          this.joinPageAgentsToChannel(message.channelId);
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
          // Guard the whole seeded set, not just general. These are federation
          // infrastructure; deleting one propagates to the relay and every peer.
          if (isStandardChannel(channelIdToDelete)) {
            sendResponse({
              success: false,
              error: `"${channelIdToDelete}" is a standard federation channel and cannot be deleted`,
            });
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

        case 'GET_KEEPALIVE_STATUS': {
          void (async () => {
            const stored = await chrome.storage.local.get(KEEPALIVE_DIAG_KEY);
            const alarm = await chrome.alarms.get(KEEPALIVE_ALARM).catch(() => undefined);
            sendResponse({
              success: true,
              diag: stored?.[KEEPALIVE_DIAG_KEY] || null,
              alarm: alarm
                ? { periodInMinutes: alarm.periodInMinutes, scheduledTime: alarm.scheduledTime }
                : null,
              autoConnect: this.autoConnect,
              relayUrl: this.relayUrl,
              relayReadyState: this.connections.get('relay')?.readyState ?? null,
              connectionStatus:
                this.primaryConnection?.readyState === WebSocket.OPEN
                  ? 'connected'
                  : 'disconnected',
              ticksThisWorker: this.keepAliveTicks,
              now: Date.now(),
            });
          })();
          return true;
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

        case 'BROWSER_ACTION':
          // Same entry point the relay's BROWSER_ACTION case below calls —
          // exposed here too so it's directly testable from the popup/
          // sidepanel without a live relay connection. See
          // background/browser-automation.ts for the full action list.
          browserAutomation
            .executeBrowserAction({
              action: message.browserAction,
              tabId: message.tabId,
              params: message.params,
            })
            .then((result) => sendResponse(result));
          return true; // Async response

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
            .then((result) => {
              const success = result?.success !== false;
              this.logEvent('chat', 'inject_message', {
                tabId: sender.tab?.id ?? null,
                preview: String(message.content || '').slice(0, 120),
                success,
                error: result?.error || result?.result?.error || null,
              });
              sendResponse({
                success,
                result: result?.result || result,
                error: result?.error || result?.result?.error,
              });
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
            let pageAgentId = this.findTabAgent(sender.tab.id, 'page')?.id || null;

            if (!pageAgentId) {
              pageAgentId = `page-agent-${sender.tab.id}-${Math.random().toString(36).substr(2, 5)}`;
            }

            const hostname = sender.tab.url ? new URL(sender.tab.url).hostname : 'page';
            // Clean hostname for better display (e.g. "gemini.google.com" -> "Gemini")
            let platformName = hostname;
            if (hostname.includes('gemini.google')) platformName = 'Gemini';
            else if (hostname.includes('cursor.com') || hostname.includes('cursor.sh'))
              platformName = 'Cursor';
            else if (hostname.includes('openai.com')) platformName = 'ChatGPT';
            else if (hostname.includes('claude.ai')) platformName = 'Claude';
            else if (hostname.includes('perplexity.ai')) platformName = 'Perplexity';
            else if (hostname.includes('kimi.com') || hostname.includes('moonshot.cn'))
              platformName = 'Kimi';
            else if (hostname.includes('qwen.ai')) platformName = 'Qwen';

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
            const agent = this.agents.get(pageAgentId);
            sendResponse({ success: true, agentId: pageAgentId, pageAgentId, agent });
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

              if (!channel && sender.tab?.id) {
                // Authoritative per-tab binding, set on CHANNEL_JOIN and persisted.
                channel = this.tabActiveChannels.get(sender.tab.id);
                if (channel) {
                  console.log('[FuseConnect v7] Using tab-bound channel:', channel);
                }
              }

              if (!channel && this.joinedChannels.size === 1) {
                // Only safe to infer when exactly one channel is joined. Picking the
                // first of several would publish this response into whichever channel
                // happened to be enumerated first — a cross-channel leak that looks
                // like one channel "stealing" another channel's traffic.
                channel = Array.from(this.joinedChannels)[0];
                console.log('[FuseConnect v7] Using sole joined channel:', channel);
              }

              if (!channel && this.joinedChannels.size > 1) {
                console.warn(
                  '[FuseConnect v7] Response has no channel and tab has no binding; ' +
                    'not broadcasting rather than guessing among',
                  Array.from(this.joinedChannels)
                );
              }

              if (channel) {
                // Get platform name for context (inline detection)
                const tabUrl = sender.tab?.url || '';
                let platformName = message.platform || 'unknown';
                if (!message.platform) {
                  if (tabUrl.includes('gemini.google')) platformName = 'Gemini';
                  else if (tabUrl.includes('cursor.com') || tabUrl.includes('cursor.sh'))
                    platformName = 'Cursor';
                  else if (tabUrl.includes('/codex') || tabUrl.includes('codex.openai'))
                    platformName = 'Codex';
                  else if (tabUrl.includes('chat.openai') || tabUrl.includes('chatgpt'))
                    platformName = 'ChatGPT';
                  else if (tabUrl.includes('claude.ai')) platformName = 'Claude';
                  else if (tabUrl.includes('copilot')) platformName = 'Copilot';
                  else if (tabUrl.includes('kimi.com') || tabUrl.includes('moonshot.cn'))
                    platformName = 'Kimi';
                  else if (tabUrl.includes('qwen.ai')) platformName = 'Qwen';
                }

                // FEDERATION IMPROVEMENT: Include correlation metadata for response matching
                const senderIdentity = this.getCompleteAgentIdentity(senderId);
                const responseMetadata: any = senderIdentity
                  ? enrichOutboundMetadata(senderIdentity, {
                      channel,
                      senderId,
                      extra: {
                        senderType: 'ai-agent',
                        platform: platformName,
                        isAIResponse: true,
                        timestamp: Date.now(),
                      },
                    })
                  : {
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
    this.updateNodeStatus('relay', this.relayUrl, 'disconnected');
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

// Global SW guards — uncaught errors put MV3 workers into "bad state".
try {
  self.addEventListener('error', (event) => {
    console.error(
      '[FuseConnect v7] Service worker error:',
      event?.error || event?.message || event
    );
  });
  self.addEventListener('unhandledrejection', (event) => {
    console.error('[FuseConnect v7] Service worker unhandled rejection:', event?.reason);
    try {
      event.preventDefault();
    } catch (_e) {
      // ignore
    }
  });
} catch (_e) {
  // Older runtimes may not expose self event APIs the same way.
}

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[FuseConnect v7] onInstalled:', details.reason);
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[FuseConnect v7] onStartup');
});

// Initialize once per worker boot.
const __fuseBackground = new BackgroundService();
void __fuseBackground;
