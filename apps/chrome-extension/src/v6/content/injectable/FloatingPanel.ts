/**
 * Fuse Connect v6 - Enhanced Floating Panel
 * Fully draggable, resizable, with federation channels and notifications
 */

import type {
  Agent,
  AgentMessage,
  ConnectionStatus,
  DetectedChatElements,
  FederationChannel,
  Notification,
  OrchestrationTask,
  PanelMode,
  PanelState,
  PanelTab,
  StreamingState,
} from '../../shared/types';

const PANEL_MIN_WIDTH = 300;
const PANEL_MIN_HEIGHT = 200;
const PANEL_MAX_WIDTH = 600;
const PANEL_MAX_HEIGHT = 800;
const COLLAPSED_HEIGHT = 48;

interface FloatingPanelOptions {
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  mode?: PanelMode;
}

export class EnhancedFloatingPanel {
  private container: HTMLDivElement | null = null;
  private state: PanelState;
  private dragState = { isDragging: false, startX: 0, startY: 0, startPosX: 0, startPosY: 0 };
  private resizeState = {
    isResizing: false,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    edge: '',
  };

  // Unique panel identifier
  private readonly panelId: string;
  private readonly hostName: string;
  private myAgentId: string | null = null;

  // Data
  private connectionStatus: ConnectionStatus = 'disconnected';
  private chatElements: DetectedChatElements | null = null;
  private streamingState: StreamingState | null = null;
  private agents: Agent[] = [];
  private channels: FederationChannel[] = [];
  private currentChannel: string | null = null;
  private messages: AgentMessage[] = [];
  private notifications: Notification[] = [];
  private tasks: OrchestrationTask[] = [];
  private unreadCount = 0;

  // Track recently broadcast messages to prevent duplicates
  private recentBroadcasts: Map<string, number> = new Map();

  // Service health tracking
  private serviceStatuses: Map<string, 'online' | 'offline' | 'unknown'> = new Map([
    ['relay', 'unknown'],
    ['api', 'unknown'],
    ['frontend', 'unknown'],
  ]);
  private healthPollInterval: ReturnType<typeof setInterval> | null = null;

  // Track Chrome message listener for cleanup
  private chromeMessageListener:
    | ((
        message: any,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: any) => void
      ) => void)
    | null = null;

  private storageListener:
    | ((changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => void)
    | null = null;

  // Flag to track if extension context is valid
  private isContextValid = true;

  // Cleanup timer to prevent memory leaks
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private readonly CLEANUP_INTERVAL_MS = 30000; // 30 seconds
  private readonly BROADCAST_DEDUP_WINDOW_MS = 10000; // 10 seconds

  constructor(options: FloatingPanelOptions = {}) {
    // Generate unique panel ID based on hostname and random suffix
    this.hostName = window.location.hostname.replace(/\./g, '-');
    this.panelId = `${this.hostName}-${Math.random().toString(36).substring(2, 8)}`;

    this.state = {
      mode: options.mode || 'expanded', // UPDATED: Default to expanded
      position: options.position || { x: 20, y: 20 },
      size: options.size || { width: 360, height: 480 },
      activeTab: 'chat',
      isDragging: false,
      isResizing: false,
      isPinned: false,
      opacity: 1,
    };

    console.log(`[FuseConnect] Panel initialized with ID: ${this.panelId}`);

    this.loadState();
    this.inject();
    this.setupListeners();

    // Request current connection state from background script
    this.requestConnectionState();

    // Start periodic cleanup to prevent memory leaks
    this.startCleanupInterval();
  }

  /**
   * Start periodic cleanup of stale data
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      // Clean up old broadcast entries
      for (const [key, time] of this.recentBroadcasts.entries()) {
        if (now - time > this.BROADCAST_DEDUP_WINDOW_MS) {
          this.recentBroadcasts.delete(key);
          cleaned++;
        }
      }

      // Trim messages array if it gets too long
      if (this.messages.length > 100) {
        this.messages = this.messages.slice(-50);
      }

      // Trim notifications array
      if (this.notifications.length > 50) {
        this.notifications = this.notifications.slice(-25);
      }
    }, this.CLEANUP_INTERVAL_MS);
  }

  /**
   * Request connection state from background script
   * This ensures the panel gets the correct state when created
   */
  private requestConnectionState(): void {
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
      this.connectionStatus = response.connectionStatus || 'disconnected';
      this.agents = response.agents || [];
      this.channels = response.channels || [];

      // Save Browser Agent ID for loop prevention
      if (response.browserAgentId) {
        (this as any).browserAgentId = response.browserAgentId;
      }

      if (response.agentId) {
        this.myAgentId = response.agentId;
      }
      this.update();
    });
  }

  /**
   * Load saved state
   */
  private async loadState(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['fuse_panel_state']);
      if (result.fuse_panel_state) {
        this.state = { ...this.state, ...result.fuse_panel_state };
      }
    } catch (e) {
      // Storage not available
    }
  }

  /**
   * Save state
   */
  private async saveState(): Promise<void> {
    try {
      await chrome.storage.local.set({ fuse_panel_state: this.state });
    } catch (e) {
      // Storage not available
    }
  }

  /**
   * Inject panel into page
   */
  private inject(): void {
    // Remove existing
    document.getElementById('fuse-connect-panel-v6')?.remove();

    // Create container
    this.container = document.createElement('div');
    this.container.id = 'fuse-connect-panel-v6';
    this.container.innerHTML = this.render();

    // Inject styles
    this.injectStyles();

    // Add to page
    document.body.appendChild(this.container);

    // Apply position and size
    this.applyPositionAndSize();
  }

  /**
   * Inject CSS
   */
  private injectStyles(): void {
    if (document.getElementById('fuse-connect-styles-v6')) return;

    const style = document.createElement('style');
    style.id = 'fuse-connect-styles-v6';
    style.textContent = this.getStyles();
    document.head.appendChild(style);
  }

  /**
   * Get CSS styles
   */
  private getStyles(): string {
    return `
      /* Fuse Connect v6 - Enhanced Panel Styles */

      #fuse-connect-panel-v6 {
        position: fixed !important;
        z-index: 2147483647 !important;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        font-size: 13px !important;
        line-height: 1.4 !important;
        color: #fff !important;
        pointer-events: auto !important;
        user-select: none !important;
      }

      #fuse-connect-panel-v6 * {
        box-sizing: border-box !important;
      }

      .fcp6-panel {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(10,10,15,0.98) 0%, rgba(18,18,26,0.98) 100%) !important;
        border: 1px solid rgba(0,217,255,0.3) !important;
        border-radius: 16px !important;
        box-shadow:
          0 0 40px rgba(0,217,255,0.2),
          0 20px 60px rgba(0,0,0,0.6),
          inset 0 1px 0 rgba(255,255,255,0.1) !important;
        backdrop-filter: blur(20px) !important;
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
      }

      .fcp6-panel.collapsed {
        height: ${COLLAPSED_HEIGHT}px !important;
      }

      .fcp6-panel.minimized {
        width: 48px !important;
        height: 48px !important;
        border-radius: 50% !important;
      }

      /* Header */
      .fcp6-header {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        padding: 10px 14px !important;
        background: linear-gradient(90deg, rgba(0,217,255,0.15) 0%, rgba(157,78,221,0.15) 100%) !important;
        border-bottom: 1px solid rgba(0,217,255,0.2) !important;
        cursor: move !important;
        min-height: 46px !important;
      }

      .fcp6-logo {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
      }

      .fcp6-icon {
        width: 26px !important;
        height: 26px !important;
        background: linear-gradient(135deg, #00D9FF 0%, #9D4EDD 100%) !important;
        border-radius: 6px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 14px !important;
        box-shadow: 0 0 15px rgba(0,217,255,0.4) !important;
      }

      .fcp6-title {
        font-size: 13px !important;
        font-weight: 600 !important;
        background: linear-gradient(90deg, #00D9FF, #9D4EDD) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        background-clip: text !important;
      }

      .fcp6-status-dot {
        width: 8px !important;
        height: 8px !important;
        border-radius: 50% !important;
        margin-left: 8px !important;
      }

      .fcp6-status-dot.connected { background: #00FF88 !important; box-shadow: 0 0 8px rgba(0,255,136,0.6) !important; }
      .fcp6-status-dot.disconnected { background: #FF3366 !important; }
      .fcp6-status-dot.connecting { background: #FFB800 !important; animation: fcp6-pulse 1s infinite !important; }

      @keyframes fcp6-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }

      .fcp6-controls {
        display: flex !important;
        gap: 4px !important;
      }

      .fcp6-btn {
        width: 26px !important;
        height: 26px !important;
        border: none !important;
        border-radius: 6px !important;
        background: rgba(255,255,255,0.08) !important;
        color: rgba(255,255,255,0.7) !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 12px !important;
        transition: all 0.2s ease !important;
      }

      .fcp6-btn:hover {
        background: rgba(0,217,255,0.3) !important;
        color: #00D9FF !important;
      }

      .fcp6-badge {
        position: absolute !important;
        top: -4px !important;
        right: -4px !important;
        min-width: 16px !important;
        height: 16px !important;
        background: #FF006E !important;
        border-radius: 8px !important;
        font-size: 10px !important;
        font-weight: 600 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 0 4px !important;
      }

      /* Tabs */
      .fcp6-tabs {
        display: flex !important;
        padding: 4px !important;
        gap: 2px !important;
        background: rgba(0,0,0,0.2) !important;
        border-bottom: 1px solid rgba(255,255,255,0.05) !important;
      }

      .fcp6-tab {
        flex: 1 !important;
        padding: 8px 4px !important;
        border: none !important;
        border-radius: 6px !important;
        background: transparent !important;
        color: rgba(255,255,255,0.5) !important;
        font-size: 11px !important;
        font-weight: 500 !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 2px !important;
      }

      .fcp6-tab:hover {
        background: rgba(255,255,255,0.05) !important;
        color: rgba(255,255,255,0.8) !important;
      }

      .fcp6-tab.active {
        background: linear-gradient(135deg, rgba(0,217,255,0.2) 0%, rgba(157,78,221,0.2) 100%) !important;
        color: #00D9FF !important;
        border: 1px solid rgba(0,217,255,0.3) !important;
      }

      .fcp6-tab-icon {
        font-size: 14px !important;
      }

      /* Content */
      .fcp6-content {
        flex: 1 !important;
        overflow-y: auto !important;
        padding: 12px !important;
      }

      .fcp6-content::-webkit-scrollbar {
        width: 5px !important;
      }

      .fcp6-content::-webkit-scrollbar-thumb {
        background: rgba(0,217,255,0.3) !important;
        border-radius: 3px !important;
      }

      /* Input area */
      .fcp6-input-area {
        padding: 10px !important;
        border-top: 1px solid rgba(255,255,255,0.05) !important;
        background: rgba(0,0,0,0.2) !important;
      }

      .fcp6-input-row {
        display: flex !important;
        gap: 8px !important;
      }

      .fcp6-input {
        flex: 1 !important;
        padding: 10px 12px !important;
        border: 1px solid rgba(0,217,255,0.2) !important;
        border-radius: 8px !important;
        background: rgba(0,0,0,0.3) !important;
        color: #fff !important;
        font-size: 13px !important;
        outline: none !important;
        resize: none !important;
      }

      .fcp6-input:focus {
        border-color: #00D9FF !important;
        box-shadow: 0 0 0 2px rgba(0,217,255,0.2) !important;
      }

      .fcp6-send-btn {
        padding: 10px 16px !important;
        border: none !important;
        border-radius: 8px !important;
        background: linear-gradient(135deg, #00D9FF 0%, #9D4EDD 100%) !important;
        color: #fff !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
      }

      .fcp6-send-btn:hover {
        box-shadow: 0 0 20px rgba(0,217,255,0.5) !important;
        transform: translateY(-1px) !important;
      }

      .fcp6-inject-btn {
        padding: 10px !important;
        border: none !important;
        border-radius: 8px !important;
        background: linear-gradient(135deg, #00FF88 0%, #00D9FF 100%) !important;
        color: #fff !important;
        font-size: 16px !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
      }

      .fcp6-inject-btn:hover {
        box-shadow: 0 0 20px rgba(0,255,136,0.5) !important;
        transform: translateY(-1px) !important;
      }

      .fcp6-input-hint {
        margin-top: 6px !important;
        font-size: 10px !important;
        color: rgba(255,255,255,0.5) !important;
        display: flex !important;
        align-items: center !important;
        gap: 4px !important;
      }

      /* Chat card */
      .fcp6-chat-card {
        padding: 10px !important;
        background: rgba(255,255,255,0.03) !important;
        border-radius: 8px !important;
        margin-bottom: 8px !important;
        border: 1px solid rgba(255,255,255,0.05) !important;
      }

      .fcp6-chat-header {
        display: flex !important;
        justify-content: space-between !important;
        margin-bottom: 4px !important;
        font-size: 11px !important;
      }

      .fcp6-chat-from {
        color: #00D9FF !important;
        font-weight: 500 !important;
      }

      .fcp6-chat-time {
        color: rgba(255,255,255,0.3) !important;
      }

      .fcp6-chat-content {
        color: rgba(255,255,255,0.8) !important;
        word-break: break-word !important;
      }

      /* Channel list */
      .fcp6-channel {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        padding: 10px !important;
        background: rgba(255,255,255,0.03) !important;
        border-radius: 8px !important;
        margin-bottom: 6px !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
      }

      .fcp6-channel:hover, .fcp6-channel.active {
        background: rgba(0,217,255,0.1) !important;
        border: 1px solid rgba(0,217,255,0.3) !important;
      }

      .fcp6-channel-icon {
        font-size: 18px !important;
      }

      .fcp6-channel-info {
        flex: 1 !important;
      }

      .fcp6-channel-name {
        font-weight: 500 !important;
      }

      .fcp6-channel-members {
        font-size: 11px !important;
        color: rgba(255,255,255,0.4) !important;
      }

      /* Agent card */
      .fcp6-agent {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        padding: 10px !important;
        background: rgba(255,255,255,0.03) !important;
        border-radius: 8px !important;
        margin-bottom: 6px !important;
      }

      .fcp6-agent-avatar {
        width: 36px !important;
        height: 36px !important;
        border-radius: 8px !important;
        background: linear-gradient(135deg, #9D4EDD 0%, #00D9FF 100%) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 16px !important;
      }

      .fcp6-agent-name {
        font-weight: 500 !important;
      }

      .fcp6-agent-platform {
        font-size: 11px !important;
        color: rgba(255,255,255,0.4) !important;
      }

      /* Notification */
      .fcp6-notification {
        padding: 10px !important;
        background: rgba(255,255,255,0.03) !important;
        border-radius: 8px !important;
        margin-bottom: 8px !important;
        border-left: 3px solid #00D9FF !important;
      }

      .fcp6-notification.unread {
        background: rgba(0,217,255,0.1) !important;
      }

      /* Task card */
      .fcp6-task {
        padding: 12px !important;
        background: rgba(255,255,255,0.03) !important;
        border-radius: 8px !important;
        margin-bottom: 8px !important;
        border-left: 3px solid #9D4EDD !important;
      }

      .fcp6-task.high { border-left-color: #FF3366 !important; }
      .fcp6-task.medium { border-left-color: #FFB800 !important; }
      .fcp6-task.completed { border-left-color: #00FF88 !important; opacity: 0.7 !important; }

      .fcp6-task-header {
        display: flex !important;
        justify-content: space-between !important;
        margin-bottom: 6px !important;
      }

      .fcp6-task-title {
        font-weight: 600 !important;
        font-size: 12px !important;
      }

      .fcp6-task-meta {
        font-size: 10px !important;
        color: rgba(255,255,255,0.5) !important;
        display: flex !important;
        gap: 8px !important;
      }

      /* Detection status */
      .fcp6-detection {
        padding: 10px !important;
        background: rgba(0,255,136,0.1) !important;
        border: 1px solid rgba(0,255,136,0.3) !important;
        border-radius: 8px !important;
        margin-bottom: 12px !important;
      }

      .fcp6-detection.streaming {
        border-color: #FFB800 !important;
        background: rgba(255,184,0,0.1) !important;
      }

      /* Resize handles */
      .fcp6-resize-handle {
        position: absolute !important;
        background: transparent !important;
      }

      .fcp6-resize-handle.left {
        left: 0 !important;
        top: 10% !important;
        width: 6px !important;
        height: 80% !important;
        cursor: ew-resize !important;
      }

      .fcp6-resize-handle.bottom {
        bottom: 0 !important;
        left: 10% !important;
        width: 80% !important;
        height: 6px !important;
        cursor: ns-resize !important;
      }

      .fcp6-resize-handle.corner {
        left: 0 !important;
        bottom: 0 !important;
        width: 16px !important;
        height: 16px !important;
        cursor: nwse-resize !important;
      }
    `;
  }

  /**
   * Apply position and size from state
   */
  private applyPositionAndSize(): void {
    if (!this.container) return;

    const { position, size, mode } = this.state;
    const isCollapsed = mode === 'collapsed';
    const isMinimized = mode === 'minimized';

    if (isMinimized) {
      // Minimized size is fixed in CSS
      this.container.style.width = '';
      this.container.style.height = '';

      // Keep position but clamp to screen
      const maxX = window.innerWidth - 48; // 48 is width
      const maxY = window.innerHeight - 48; // 48 is height

      const x = Math.min(Math.max(0, position.x), maxX);
      const y = Math.min(Math.max(0, position.y), maxY);

      this.container.style.left = `${x}px`;
      this.container.style.top = `${y}px`;
      return;
    }

    if (isCollapsed) {
      this.container.style.height = `${COLLAPSED_HEIGHT}px`;
      this.container.style.width = `${size.width}px`;
    } else {
      this.container.style.height = `${size.height}px`;
      this.container.style.width = `${size.width}px`;
    }

    // Clamp position
    const maxX = window.innerWidth - size.width;
    const maxY = window.innerHeight - (isCollapsed ? COLLAPSED_HEIGHT : size.height);

    const x = Math.min(Math.max(0, position.x), maxX);
    const y = Math.min(Math.max(0, position.y), maxY);

    this.container.style.left = `${x}px`;
    this.container.style.top = `${y}px`;
  }

  /**
   * Setup event listeners
   */
  private setupListeners(): void {
    if (!this.container) return;

    // Drag handling
    const header = this.container.querySelector('[data-drag-handle]');
    if (header) {
      header.addEventListener('mousedown', (e: Event) => {
        this.startDrag(e as MouseEvent);
      });
    }

    // Resize handling
    const resizeHandles = this.container.querySelectorAll('[data-resize]');
    resizeHandles.forEach((handle) => {
      handle.addEventListener('mousedown', (e: Event) => {
        const edge = (e.currentTarget as HTMLElement).dataset.resize || '';
        this.startResize(e as MouseEvent, edge);
      });
    });

    // Content clicks (delegation)
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // Handle action buttons
      const actionBtn = target.closest('[data-action]');
      if (actionBtn) {
        const action = (actionBtn as HTMLElement).dataset.action || '';
        this.handleAction(action, actionBtn as HTMLElement);
        return;
      }

      // Handle tabs
      const tabBtn = target.closest('[data-tab]');
      if (tabBtn) {
        const tab = (tabBtn as HTMLElement).dataset.tab as PanelTab;
        this.switchTab(tab);
        return;
      }

      // Handle channel selection
      if (target.matches('.fcp6-channel')) {
        const channelId = target.dataset.channel;
        if (channelId) {
          // If clicking generic channel row, select it
          this.selectChannel(channelId);
        }
      }
    });

    // Input handling
    this.container.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement;

      // Send message on Enter (without Shift)
      if (target.dataset.input === 'message' && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }

      // Create channel on Enter
      if (target.id === 'fuse-new-channel-name' && e.key === 'Enter') {
        e.preventDefault();
        this.submitCreateChannel();
      }
    });

    // Channel selector change
    const channelSelect = this.container.querySelector('#fuse-channel-select');
    if (channelSelect) {
      channelSelect.addEventListener('change', (e) => {
        const select = e.target as HTMLSelectElement;
        this.selectChannel(select.value || null);
      });
    }

    // NOTE: Channel selection is now tab-specific (per-panel), so we do NOT sync across tabs.
    // Each panel maintains its own independent channel selection.
    // Listen for storage changes for OTHER settings that should sync (like channels list, agents, etc.)
    this.storageListener = (changes, areaName) => {
      if (areaName === 'local') {
        // Sync channels list changes (not channel SELECTION, but the list of available channels)
        if (changes.fuse_channels) {
          const newChannels = changes.fuse_channels.newValue;
          if (newChannels && Array.isArray(newChannels)) {
            console.log('[FuseConnect] Syncing channels list from storage:', newChannels.length);
            this.channels = newChannels;
            this.update();
          }
        }
      }
    };
    chrome.storage.onChanged.addListener(this.storageListener);
  }

  /**
   * Start dragging
   */
  private startDrag(e: MouseEvent): void {
    if ((e.target as HTMLElement).closest('button')) return; // Don't drag if clicking buttons

    this.dragState = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startPosX: this.state.position.x,
      startPosY: this.state.position.y,
    };

    const onMove = (e: MouseEvent) => {
      if (!this.dragState.isDragging || !this.container) return;

      const deltaX = e.clientX - this.dragState.startX;
      const deltaY = e.clientY - this.dragState.startY;

      this.state.position.x = this.dragState.startPosX + deltaX;
      this.state.position.y = this.dragState.startPosY + deltaY;

      // Update actual element
      this.applyPositionAndSize();
    };

    const onUp = () => {
      this.dragState.isDragging = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      this.saveState();
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  /**
   * Render panel HTML
   */
  private render(): string {
    const { mode, activeTab } = this.state;
    const isCollapsed = mode === 'collapsed';
    const isMinimized = mode === 'minimized';

    if (isMinimized) {
      return this.renderMinimized();
    }

    return `
      <div class="fcp6-panel ${isCollapsed ? 'collapsed' : ''}" id="fuse-connect-panel" data-testid="fuse-connect-panel" aria-label="Fuse Connect Panel">
        ${this.renderHeader()}
        ${
          !isCollapsed
            ? `
          ${this.renderTabs()}
          <div class="fcp6-content" id="fuse-panel-content" data-testid="fuse-panel-content">
            ${this.renderTabContent(activeTab)}
          </div>
          ${activeTab === 'chat' ? this.renderInputArea() : ''}
        `
            : ''
        }
        ${!isCollapsed ? this.renderResizeHandles() : ''}
      </div>
    `;
  }

  // ... (keeping other methods as is, assuming they are not in the ReplaceContent unless needed)
  // Wait, I need to replace renderResizeHandles and startResize too.
  // I will just replace the specific blocks.

  /**
   * Render resize handles
   */
  private renderResizeHandles(): string {
    return `
      <div class="fcp6-resize-handle left" data-resize="left"></div>
      <div class="fcp6-resize-handle bottom" data-resize="bottom"></div>
      <div class="fcp6-resize-handle corner" data-resize="corner"></div>
    `;
  }

  // ...

  /**
   * Start resizing
   */
  private startResize(e: MouseEvent, edge: string): void {
    this.resizeState = {
      isResizing: true,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: this.state.size.width,
      startHeight: this.state.size.height,
      edge,
    };

    let rafId: number | null = null;
    const onMove = (e: MouseEvent) => {
      if (!this.resizeState.isResizing || !this.container) return;

      const clientX = e.clientX;
      const clientY = e.clientY;

      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        const deltaX = this.resizeState.startX - clientX;
        const deltaY = clientY - this.resizeState.startY;

        if (edge.includes('left') || edge === 'corner') {
          const newWidth = Math.min(
            PANEL_MAX_WIDTH,
            Math.max(PANEL_MIN_WIDTH, this.resizeState.startWidth + deltaX)
          );
          this.state.size.width = newWidth;
          this.container!.style.width = `${newWidth}px`;
        }

        if (edge.includes('bottom') || edge === 'corner') {
          const newHeight = Math.min(
            PANEL_MAX_HEIGHT,
            Math.max(PANEL_MIN_HEIGHT, this.resizeState.startHeight + deltaY)
          );
          this.state.size.height = newHeight;
          this.container!.style.height = `${newHeight}px`;
        }
        rafId = null;
      });
    };

    const onUp = () => {
      this.resizeState.isResizing = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      this.saveState();
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }
  /**
   * Render input area
   */
  private renderInputArea(): string {
    return `
      <div class="fcp6-input-area">
        <div class="fcp6-input-row">
          <textarea
            class="fcp6-input"
            data-input="message"
            placeholder="Type a message..."
            rows="1"
            style="min-height: 42px;"
          ></textarea>
          <button class="fcp6-send-btn" data-action="send" title="Send">
            ➤
          </button>
        </div>
        <div class="fcp6-input-hint">
          <button class="fcp6-btn" data-action="inject-to-chat" style="padding: 2px 6px; height: auto; font-size: 10px;">
            Inject to Page
          </button>
          <span style="flex: 1;"></span>
          <span>Press Enter to send</span>
        </div>
      </div>
    `;
  }

  /**
   * Render minimized state
   */
  private renderMinimized(): string {
    return `
      <div class="fcp6-panel minimized" id="fuse-panel-minimized" data-testid="fuse-panel-minimized" data-action="expand" aria-label="Expand Fuse Connect Panel">
        <div class="fcp6-icon">⚡</div>
        ${this.unreadCount > 0 ? `<span class="fcp6-badge">${this.unreadCount}</span>` : ''}
      </div>
    `;
  }

  /**
   * Render header
   */
  private renderHeader(): string {
    const shortId = this.panelId.split('-').pop() || this.panelId;

    return `
      <div class="fcp6-header" data-drag-handle>
        <div class="fcp6-logo">
          <div class="fcp6-icon">⚡</div>
          <span class="fcp6-title">FUSE CONNECT</span>
          <span class="fcp6-status-dot ${this.connectionStatus}"></span>
        </div>
        <div class="fcp6-controls">
          <span style="font-size: 9px; color: rgba(255,255,255,0.4); margin-right: 8px;" title="Panel ID: ${this.panelId}">
            #${shortId}
          </span>
          <button class="fcp6-btn" id="fuse-btn-pin" data-testid="fuse-btn-pin" data-action="pin" title="Pin panel" aria-label="Pin panel">${this.state.isPinned ? '📌' : '📍'}</button>
          <button class="fcp6-btn" id="fuse-btn-minimize" data-testid="fuse-btn-minimize" data-action="minimize" title="Minimize" aria-label="Minimize panel">−</button>
          <button class="fcp6-btn" id="fuse-btn-toggle" data-testid="fuse-btn-toggle" data-action="toggle" title="${this.state.mode === 'collapsed' ? 'Expand' : 'Collapse'}" aria-label="${this.state.mode === 'collapsed' ? 'Expand panel' : 'Collapse panel'}">
            ${this.state.mode === 'collapsed' ? '▼' : '▲'}
          </button>
        </div>
      </div>
      ${this.state.mode !== 'collapsed' ? this.renderChannelSelector() : ''}
    `;
  }

  /**
   * Render channel selector bar
   */
  private renderChannelSelector(): string {
    const currentChannelName =
      this.channels.find((c) => c.id === this.currentChannel)?.name || 'No channel';

    return `
      <div class="fcp6-channel-selector" style="
        padding: 6px 12px;
        background: rgba(0,0,0,0.3);
        border-bottom: 1px solid rgba(255,255,255,0.1);
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
      ">
        <span style="color: rgba(255,255,255,0.5);">Sync to:</span>
        <select id="fuse-channel-select" data-action="select-channel" style="
          flex: 1;
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(0,0,0,0.4);
          color: white;
          font-size: 11px;
          cursor: pointer;
        ">
          <option value="" ${!this.currentChannel ? 'selected' : ''}>-- None (local only) --</option>
          ${this.channels
            .map(
              (ch) => `
            <option value="${ch.id}" ${this.currentChannel === ch.id ? 'selected' : ''}>
              ${ch.isPrivate ? '🔒' : '#'} ${this.escapeHtml(ch.name)}
            </option>
          `
            )
            .join('')}
        </select>
        <span style="color: ${this.currentChannel ? '#0f8' : 'rgba(255,255,255,0.3)'}; font-size: 10px;">
          ${this.currentChannel ? '● Syncing' : '○ Local'}
        </span>
      </div>
    `;
  }

  /**
   * Render tabs
   */
  private renderTabs(): string {
    const tabs: { id: PanelTab; icon: string; label: string }[] = [
      { id: 'chat', icon: '💬', label: 'Chat' },
      { id: 'agents', icon: '🤖', label: 'Agents' },
      { id: 'channels', icon: '📢', label: 'Channels' },
      { id: 'tasks', icon: '📋', label: 'Tasks' },
      { id: 'services', icon: '⚙️', label: 'Services' },
      { id: 'notifications', icon: '🔔', label: 'Alerts' },
      { id: 'settings', icon: '🔧', label: 'Settings' },
    ];

    return `
      <div class="fcp6-tabs">
        ${tabs
          .map(
            (tab) => `
          <button class="fcp6-tab ${this.state.activeTab === tab.id ? 'active' : ''}" data-tab="${tab.id}">
            <span class="fcp6-tab-icon">${tab.icon}</span>
            <span>${tab.label}</span>
            ${tab.id === 'notifications' && this.unreadCount > 0 ? `<span class="fcp6-badge">${this.unreadCount}</span>` : ''}
          </button>
        `
          )
          .join('')}
      </div>
    `;
  }

  /**
   * Render tab content
   */
  private renderTabContent(tab: PanelTab): string {
    switch (tab) {
      case 'chat':
        return this.renderChatTab();
      case 'channels':
        return this.renderChannelsTab();
      case 'agents':
        return this.renderAgentsTab();
      case 'tasks':
        return this.renderTasksTab();
      case 'notifications':
        return this.renderNotificationsTab();
      case 'services':
        return this.renderServicesTab();
      case 'settings':
        return this.renderSettingsTab();
      default:
        return '';
    }
  }

  /**
   * Render chat tab
   */
  private renderChatTab(): string {
    // Detection status
    let detectionHtml = '';
    if (this.chatElements) {
      const isStreaming = this.streamingState?.isStreaming;
      detectionHtml = `
        <div class="fcp6-detection ${isStreaming ? 'streaming' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>${isStreaming ? '🔄 AI is responding...' : '✅ Chat detected'}</span>
            <span style="font-size: 11px; color: rgba(255,255,255,0.5);">
              ${Math.round(this.chatElements.confidence * 100)}% confidence
            </span>
          </div>
        </div>
      `;
    }

    // Messages - render in a scrollable container (oldest first, newest at bottom)
    const messagesHtml =
      this.messages.length > 0
        ? this.messages
            .slice(-50) // Get last 50 messages
            .map((msg) => {
              // Resolve Sender Name and ID
              let senderName = msg.from;
              let senderId = msg.from;
              let isMe = false;

              if (
                msg.from === 'You' ||
                msg.from === 'You (Fuse)' ||
                (this.myAgentId && msg.from === this.myAgentId)
              ) {
                senderName = 'You';
                senderId = this.myAgentId || 'unknown-id';
                isMe = true;
              } else {
                // Try to resolve name from agents list
                const agent = this.agents.find((a) => a.id === msg.from);
                if (agent) {
                  senderName = agent.name;
                  senderId = agent.id;
                }
              }

              // Handler for System Messages
              if (msg.metadata?.isSystemMessage) {
                return `
                  <div class="fcp6-system-message" style="text-align: center; margin: 8px 0; font-size: 11px; color: rgba(255, 255, 255, 0.5); font-style: italic;">
                    <span style="background: rgba(255, 255, 255, 0.05); padding: 2px 8px; border-radius: 10px;">
                      ${this.escapeHtml(msg.content)}
                    </span>
                  </div>
                 `;
              }

              // Metadata ID check (if present)
              if (msg.metadata && typeof msg.metadata.senderId === 'string') {
                senderId = msg.metadata.senderId;
              }

              // Shorten ID for display
              const shortId = senderId.length > 8 ? senderId.substring(0, 6) + '...' : senderId;

              return `
            <div class="fcp6-chat-card" data-msg-id="${msg.id}">
            <div class="fcp6-chat-header">
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span class="fcp6-chat-from" title="Agent ID: ${this.escapeHtml(senderId)}">
                  ${this.escapeHtml(senderName)}
                </span>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span style="font-size: 9px; font-family: monospace; background: rgba(255,255,255,0.1); padding: 1px 6px; border-radius: 4px; color: rgba(255,255,255,0.6); user-select: text; -webkit-user-select: text;" title="Click copy to get full ID: ${this.escapeHtml(senderId)}">
                    #${this.escapeHtml(shortId)}
                  </span>
                  <button class="fcp6-btn" data-action="copy-to-clipboard" data-value="${this.escapeHtml(senderId)}" title="Copy Agent ID" style="width: 18px; height: 18px; font-size: 8px; padding: 0; background: rgba(0,217,255,0.1); color: #00D9FF; border: 1px solid rgba(0,217,255,0.2);">
                    📋
                  </button>
                </div>
              </div>
              <span class="fcp6-chat-time">${this.formatTime(msg.timestamp)}</span>
            </div>
            <div class="fcp6-chat-content" style="user-select: text; -webkit-user-select: text; cursor: text;">${this.escapeHtml(msg.content)}</div>
          </div>
        `;
            })
            .join('')
        : `<div class="fcp6-empty"><div class="fcp6-empty-icon">💬</div><p>No messages yet</p><p style="font-size: 11px; opacity: 0.6;">Send a message to start chatting</p></div>`;

    return `
      ${detectionHtml}
      <div class="fcp6-chat-scroll" id="fuse-chat-scroll" style="flex: 1; overflow-y: auto; max-height: 300px; padding-right: 4px;">
        ${messagesHtml}
      </div>
      </div>
    `;
  }

  /**
   * Render channels tab
   */
  private renderChannelsTab(): string {
    return `
      <div class="fcp6-section-title">Active Channels</div>
      <div class="fcp6-list">
        ${
          this.channels.length > 0
            ? this.channels
                .map(
                  (ch) => `
          <div class="fcp6-channel ${this.currentChannel === ch.id ? 'active' : ''}" data-channel="${ch.id}">
            <div class="fcp6-channel-icon">${ch.isPrivate ? '🔒' : '#'}</div>
            <div class="fcp6-channel-info">
              <div class="fcp6-channel-name">${this.escapeHtml(ch.name)}</div>
              <div class="fcp6-channel-members">${ch.members.length} active agents</div>
            </div>
            <div style="display:flex; gap:4px; align-items:center;">
              ${this.currentChannel === ch.id ? '<div class="fcp6-badge" style="position:static; margin:0;">✓</div>' : ''}
              ${ch.id !== 'general' ? `<button class="fcp6-btn" data-action="delete-channel" data-channel-id="${ch.id}" title="Delete Channel" style="background:rgba(255,51,102,0.1); color:#ff3366; width:22px; height:22px;">×</button>` : ''}
            </div>
          </div>
        `
                )
                .join('')
            : '<div class="fcp6-empty">No active channels</div>'
        }
      </div>

      <div class="fcp6-section-title" style="margin-top: 16px;">Create Channel</div>
      <div class="fcp6-input-row">
        <input type="text" id="fuse-new-channel-name" class="fcp6-input" placeholder="New channel name..." style="min-height: 36px;">
        <button class="fcp6-btn" style="width: auto; padding: 0 12px; background: rgba(0,217,255,0.2); color: #00D9FF;" data-action="submit-create-channel">Create</button>
      </div>
    `;
  }

  /**
   * Render agents tab
   */
  private renderAgentsTab(): string {
    return `
      <div class="fcp6-section-title">Connected Agents (${this.agents.length})</div>
      <div class="fcp6-list">
        ${
          this.agents.length > 0
            ? this.agents
                .map(
                  (agent) => `
          <div class="fcp6-agent">
            <div class="fcp6-agent-avatar">${this.getAgentIcon(agent.platform || 'unknown')}</div>
            <div class="fcp6-channel-info">
              <div class="fcp6-agent-name">
                ${this.escapeHtml(agent.name)}
                ${agent.id === this.myAgentId ? '<span class="fcp6-badge" style="position:static; display:inline-block; margin-left:6px; background:rgba(0,217,255,0.2); color:#00D9FF;">YOU</span>' : ''}
              </div>
              <div class="fcp6-agent-platform">${agent.platform} • ${agent.status}</div>
            </div>
          </div>
        `
                )
                .join('')
            : '<div class="fcp6-empty">No other agents connected</div>'
        }
      </div>
    `;
  }

  /**
   * Render services tab
   */
  private renderServicesTab(): string {
    const services = [
      { id: 'relay', name: 'Relay Server', icon: '📡' },
      { id: 'vector-db', name: 'Vector DB', icon: '🧠' },
      { id: 'fs-server', name: 'File System', icon: '📂' },
    ];

    // Get AI Studio state from storage or defaults
    const aiStudioAuth = false; // TODO: Load from storage
    const videoQueueCount = 0; // TODO: Load from storage
    const processingStatus = 'idle'; // TODO: Load from storage

    return `
      <div class="fcp6-section-title">Core Services</div>
      <div class="fcp6-list">
        ${services
          .map((svc) => {
            const status = this.serviceStatuses.get(svc.id) || 'unknown';
            return `
          <div class="fcp6-agent">
            <div class="fcp6-agent-avatar" style="background: rgba(255,255,255,0.1);">${svc.icon}</div>
            <div class="fcp6-channel-info">
              <div class="fcp6-agent-name">${svc.name}</div>
              <div class="fcp6-agent-platform">
                <span class="fcp6-status-dot ${status === 'online' ? 'connected' : 'disconnected'}"></span>
                ${status.toUpperCase()}
              </div>
            </div>
            <div style="display:flex; gap:4px;">
               <button class="fcp6-btn" data-action="restart-${svc.id}-service" title="Restart">↺</button>
            </div>
          </div>
        `;
          })
          .join('')}
      </div>
      <div style="margin-top:12px; display:flex; gap:8px;">
        <button class="fcp6-btn" data-action="check-health" style="flex:1; width:auto;">Check Health</button>
        <button class="fcp6-btn" data-action="start-all-services" style="flex:1; width:auto;">Start All</button>
      </div>
       <div style="margin-top:12px;">
        <button class="fcp6-btn" data-action="open-terminal" style="width:100%;">Open Terminal</button>
      </div>

      <!-- AI Video Intelligence Section -->
      <div style="margin-top:20px; padding-top:16px; border-top: 1px solid rgba(255,255,255,0.1);">
        <div class="fcp6-section-title">🎬 AI Video Intelligence</div>

        ${
          !aiStudioAuth
            ? `
          <div style="padding:12px; background:rgba(0,217,255,0.05); border-radius:8px; margin-top:8px;">
            <div style="font-size:12px; color:rgba(255,255,255,0.7); margin-bottom:8px;">
              Process YouTube videos through AI Studio
            </div>
            <button class="fcp6-btn" data-action="ai-studio-auth" style="width:100%;">
              🔐 Sign in with Google
            </button>
          </div>
        `
            : `
          <!-- Authenticated View -->
          <div style="margin-top:8px;">
            <!-- Playlist Selector -->
            <div style="margin-bottom:8px;">
              <label style="font-size:11px; color:rgba(255,255,255,0.6); display:block; margin-bottom:4px;">
                📺 Playlist
              </label>
              <select class="fcp6-input" data-action="ai-studio-select-playlist" style="width:100%; padding:6px;">
                <option value="">Select playlist...</option>
              </select>
            </div>

            <!-- Video Queue -->
            <div style="margin-bottom:8px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <label style="font-size:11px; color:rgba(255,255,255,0.6);">
                  📋 Queue (${videoQueueCount})
                </label>
                <button class="fcp6-btn" data-action="ai-studio-load-videos" style="padding:4px 8px; font-size:11px;">
                  Load
                </button>
              </div>
              <div style="max-height:120px; overflow-y:auto; background:rgba(0,0,0,0.3); border-radius:6px; padding:6px;">
                ${
                  videoQueueCount === 0
                    ? `
                  <div style="font-size:11px; color:rgba(255,255,255,0.4); text-align:center; padding:12px;">
                    No videos in queue
                  </div>
                `
                    : `
                  <!-- Video items will be rendered here -->
                  <div class="fcp6-video-item">Video 1</div>
                `
                }
              </div>
            </div>

            <!-- Processing Tier -->
            <div style="margin-bottom:8px;">
              <label style="font-size:11px; color:rgba(255,255,255,0.6); display:block; margin-bottom:4px;">
                🎯 Processing
              </label>
              <select class="fcp6-input" data-action="ai-studio-select-tier" style="width:100%; padding:6px; font-size:11px;">
                <option value="metadata">Metadata (FREE)</option>
                <option value="transcript">Transcript (FREE)</option>
                <option value="flash" selected>Gemini Flash ($0.01)</option>
                <option value="pro">Gemini Pro ($0.15)</option>
                <option value="vision">Gemini Vision ($0.30)</option>
                <option value="ai-studio">AI Studio (FREE*)</option>
              </select>
            </div>

            <!-- Controls -->
            <div style="display:flex; gap:6px; margin-bottom:8px;">
              ${
                processingStatus === 'idle'
                  ? `
                <button class="fcp6-btn" data-action="ai-studio-start" style="flex:1; background:rgba(0,255,136,0.2); border:1px solid rgba(0,255,136,0.4);">
                  ▶ Start
                </button>
              `
                  : `
                <button class="fcp6-btn" data-action="ai-studio-pause" style="flex:1; background:rgba(255,187,0,0.2);">
                  ⏸ Pause
                </button>
                <button class="fcp6-btn" data-action="ai-studio-stop" style="flex:1; background:rgba(255,51,102,0.2);">
                  ⏹ Stop
                </button>
              `
              }
            </div>

            <!-- Progress -->
            ${
              processingStatus !== 'idle'
                ? `
              <div style="margin-bottom:8px;">
                <div style="height:4px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden;">
                  <div style="height:100%; width:75%; background:linear-gradient(90deg,#00D9FF,#9D4EDD); transition:width 0.3s;"></div>
                </div>
                <div style="font-size:10px; color:rgba(255,255,255,0.5); margin-top:4px; text-align:center;">
                  Processing: "How to Build Apps..." (8/10)
                </div>
              </div>
            `
                : ''
            }

            <!-- Knowledge Base -->
            <div style="padding:10px; background:rgba(157,78,221,0.1); border-radius:6px; margin-bottom:8px;">
              <div style="font-size:11px; color:rgba(255,255,255,0.6); margin-bottom:6px;">
                🧠 Knowledge Base
              </div>
              <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:6px;">
                <span style="color:rgba(255,255,255,0.7);">Concepts: <strong>0</strong></span>
                <span style="color:rgba(255,255,255,0.7);">Videos: <strong>0</strong></span>
              </div>
              <div style="display:flex; gap:4px;">
                <button class="fcp6-btn" data-action="ai-studio-export-kb" style="flex:1; font-size:10px; padding:4px;">
                  📄 Export
                </button>
                <button class="fcp6-btn" data-action="ai-studio-sync-notebook" style="flex:1; font-size:10px; padding:4px;">
                  🎙️ Podcast
                </button>
              </div>
            </div>

            <!-- Cost Tracking -->
            <div style="padding:8px; background:rgba(0,0,0,0.3); border-radius:6px; font-size:10px;">
              <div style="display:flex; justify-content:space-between; color:rgba(255,255,255,0.6);">
                <span>Session:</span>
                <span style="color:#00ff88;">$0.00</span>
              </div>
              <div style="display:flex; justify-content:space-between; color:rgba(255,255,255,0.6); margin-top:2px;">
                <span>Total:</span>
                <span style="color:#00D9FF;">$0.00</span>
              </div>
            </div>
          </div>
        `
        }
      </div>
    `;
  }

  /**
   * Render tasks tab
   */
  private renderTasksTab(): string {
    return `
      <div class="fcp6-section-title">Assigned Tasks (${this.tasks.length})</div>
      <div class="fcp6-list">
        ${
          this.tasks.length > 0
            ? this.tasks
                .map(
                  (task) => `
          <div class="fcp6-task ${task.priority}" data-task-id="${task.id}">
            <div class="fcp6-task-header">
              <span class="fcp6-task-title">#${task.id.split('-').pop()} - ${this.escapeHtml(task.title)}</span>
              <span class="fcp6-badge" style="background:rgba(255,255,255,0.1);">${task.type}</span>
            </div>
            <div class="fcp6-task-meta" style="margin-bottom:6px;">
              <span>Created ${this.formatTime(task.createdAt)}</span>
              <span>•</span>
              <span>By ${task.createdBy || 'Orchestrator'}</span>
            </div>
            <div style="font-size:11px; opacity:0.8; margin-bottom:8px;">
              ${this.escapeHtml(task.description)}
            </div>
            ${
              task.instructions.length > 0
                ? `<div style="font-size:10px; background:rgba(0,0,0,0.2); padding:6px; border-radius:4px;">
                  <div style="opacity:0.6; margin-bottom:2px;">INSTRUCTIONS:</div>
                  <ul style="margin:0; padding-left:16px;">
                    ${task.instructions.map((i) => `<li>${this.escapeHtml(i)}</li>`).join('')}
                  </ul>
                </div>`
                : ''
            }
            <div style="display:flex; gap:6px; margin-top:8px;">
               <button class="fcp6-btn" data-action="accept-task" data-task-id="${task.id}" style="flex:1; background:rgba(0,217,255,0.2); color:#00D9FF;">Accept</button>
               <button class="fcp6-btn" data-action="reject-task" data-task-id="${task.id}" style="flex:1;">Reject</button>
            </div>
          </div>
        `
                )
                .join('')
            : '<div class="fcp6-empty"><div class="fcp6-empty-icon">✓</div><p>No active tasks</p></div>'
        }
      </div>
    `;
  }

  /**
   * Render notifications tab
   */
  private renderNotificationsTab(): string {
    // Mark as read when viewing
    setTimeout(() => this.markNotificationsRead(), 1000);

    return `
      <div class="fcp6-section-title">Notifications</div>
      <div class="fcp6-list">
        ${
          this.notifications.length > 0
            ? this.notifications
                .map(
                  (n) => `
          <div class="fcp6-notification ${!n.read ? 'unread' : ''}">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span style="font-weight:600; font-size:11px;">${this.escapeHtml(n.title)}</span>
              <span style="font-size:9px; opacity:0.5;">${this.formatTime(n.timestamp)}</span>
            </div>
            <div style="font-size:11px; opacity:0.8;">${this.escapeHtml(n.message)}</div>
          </div>
        `
                )
                .join('')
            : '<div class="fcp6-empty">No notifications</div>'
        }
      </div>
    `;
  }

  /**
   * Render settings tab
   */
  private renderSettingsTab(): string {
    return `
      <div class="fcp6-section-title">Panel Settings</div>
      <div style="padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px;">

        <div style="margin-bottom: 12px;">
          <label style="display:block; font-size:11px; margin-bottom:4px; opacity:0.7;">Opacity</label>
          <input type="range" data-setting="opacity" min="0.2" max="1" step="0.1" value="${this.state.opacity || 1}" style="width:100%;">
        </div>

        <div style="margin-bottom: 12px; display:flex; align-items:center;">
          <input type="checkbox" data-setting="alwaysOnTop" ${this.state.isPinned ? 'checked' : ''} style="margin-right:8px;">
          <label style="font-size:11px;">Always on Top (Pin)</label>
        </div>

         <div style="margin-bottom: 12px; display:flex; align-items:center;">
          <input type="checkbox" data-setting="autoReconnect" checked style="margin-right:8px;">
          <label style="font-size:11px;">Auto-Reconnect Relay</label>
        </div>

         <div style="margin-bottom: 12px; display:flex; align-items:center;">
          <input type="checkbox" data-setting="debugMode" style="margin-right:8px;">
          <label style="font-size:11px;">Debug Mode</label>
        </div>

        <div style="display:flex; gap:8px; margin-top:16px;">
           <button class="fcp6-btn" data-action="save-settings" style="flex:1; width:auto; background:rgba(0,217,255,0.2); color:#00D9FF;">Save</button>
           <button class="fcp6-btn" data-action="reset-settings" style="flex:1; width:auto;">Reset</button>
        </div>
      </div>

      <div class="fcp6-section-title" style="margin-top:16px;">Connection</div>
       <div style="padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px;">
          <label style="display:block; font-size:11px; margin-bottom:4px; opacity:0.7;">Relay Server URL</label>
          <input type="text" data-setting="relayUrl" value="ws://localhost:3000/ws" class="fcp6-input" style="width:100%; margin-bottom:8px;">
       </div>
    `;
  }
  private sendMessage(): void {
    const input = this.container?.querySelector('[data-input="message"]') as HTMLTextAreaElement;
    if (!input || !input.value.trim()) return;

    const content = input.value.trim();
    input.value = '';

    const metadata = {
      senderId: this.myAgentId || 'unknown',
      source: 'floating-panel',
    };

    // 1. Send via relay to agents (Broadcast)
    this.safeSendMessage({
      type: 'BROADCAST_MESSAGE',
      content,
      channel: this.currentChannel,
      metadata,
    });

    // 2. Inject into page chat (Submit to Page)
    this.safeSendMessage(
      {
        type: 'INJECT_MESSAGE',
        content,
        metadata,
      },
      (response) => {
        if (!response?.success) {
          console.warn('[FuseConnect] Failed to inject message to page:', response?.error);
        }
      }
    );

    // 3. Add to local messages
    this.messages.push({
      id: Date.now().toString(),
      from: this.myAgentId || 'You',
      to: 'AI',
      content,
      timestamp: Date.now(),
      type: 'text',
      metadata,
    });
    this.update();
  }

  /**
   * Inject message into page chat (sends to detected AI chat input)
   */
  private injectToPageChat(): void {
    const input = this.container?.querySelector('[data-input="message"]') as HTMLTextAreaElement;
    if (!input || !input.value.trim()) return;

    const content = input.value.trim();
    input.value = '';

    const metadata = {
      senderId: this.myAgentId || 'unknown',
      source: 'floating-panel-inject-only',
    };

    // Send to content script to inject into page chat
    this.safeSendMessage(
      {
        type: 'INJECT_MESSAGE',
        content,
        metadata,
      },
      (response) => {
        if (response?.success) {
          // Add to local messages
          this.messages.push({
            id: Date.now().toString(),
            from: this.myAgentId || 'You (Fuse)',
            to: 'page',
            content,
            timestamp: Date.now(),
            type: 'text',
            metadata,
          });
          this.update();
        } else {
          console.warn('[FuseConnect] Failed to inject message:', response?.error);
        }
      }
    );
  }

  /**
   * Send unified message - injects to page chat AND syncs to relay if connected
   */
  private sendUnifiedMessage(): void {
    const input = this.container?.querySelector('[data-input="message"]') as HTMLTextAreaElement;
    if (!input || !input.value.trim()) return;

    const content = input.value.trim();
    input.value = '';

    // CRITICAL: Ensure we have a valid page agent ID before sending
    // Without this, the message will have wrong senderId and cause self-injection loops
    if (!this.myAgentId || !this.myAgentId.startsWith('page-agent-')) {
      console.error('[FuseConnect] Cannot send message: myAgentId is not set correctly!', {
        myAgentId: this.myAgentId,
        expected: 'page-agent-XXXXX',
      });
      // Try to recover by requesting page agent ID again
      alert('Connection not ready. Please wait a moment and try again.');
      input.value = content; // Put the content back
      return;
    }

    console.log('[FuseConnect] Sending unified message:', {
      content: content.substring(0, 50),
      myAgentId: this.myAgentId,
    });

    const metadata = {
      senderId: this.myAgentId, // Guaranteed to be a valid page-agent ID now
      source: 'floating-panel-unified',
    };

    // Add user message to local display immediately with unique ID
    const msgId = `user-${Date.now()}`;
    this.messages.push({
      id: msgId,
      from: this.myAgentId,
      to: 'AI',
      content,
      timestamp: Date.now(),
      type: 'text',
      metadata,
    });
    this.update();

    // If connected to relay and has a channel, sync the user message
    if (this.connectionStatus === 'connected' && this.currentChannel) {
      const broadcastKey = `user:${content}`;
      const lastSent = this.recentBroadcasts.get(broadcastKey);

      // Only broadcast if we haven't sent this exact message in the last 3 seconds
      if (!lastSent || Date.now() - lastSent > 3000) {
        this.recentBroadcasts.set(broadcastKey, Date.now());

        // Clean up old entries
        for (const [key, time] of this.recentBroadcasts.entries()) {
          if (Date.now() - time > 10000) {
            this.recentBroadcasts.delete(key);
          }
        }

        this.safeSendMessage({
          type: 'BROADCAST_MESSAGE',
          content: `[User → AI] ${content}`,
          channel: this.currentChannel,
          metadata,
        });
      } else {
        console.log('[FuseConnect] Skipping duplicate user message broadcast');
      }
    }

    // Inject message into page chat
    this.safeSendMessage(
      {
        type: 'INJECT_MESSAGE',
        content,
        metadata,
      },
      (response) => {
        if (!response?.success) {
          console.warn('[FuseConnect] Failed to inject message:', response?.error);
          // Update message to show error
          const msg = this.messages.find((m) => m.content === content);
          if (msg) {
            msg.content = `❌ ${content} (failed to send)`;
            this.update();
          }
        }
        // Note: AI response will be captured by the content script's response polling
        // and forwarded via RESPONSE_COMPLETE message to handleChromeMessage
      }
    );
  }

  /**
   * Join channel
   */
  private joinChannel(channelId: string): void {
    this.currentChannel = channelId;
    // Persist channel selection for background script access (tab-specific)
    const channelKey = `fuse_channel_${this.panelId}`;
    chrome.storage.local.set({ [channelKey]: channelId });
    this.safeSendMessage({
      type: 'CHANNEL_JOIN',
      channelId,
    });
    this.update();
  }

  /**
   * Select channel from dropdown (can be null to disconnect)
   */
  private selectChannel(channelId: string | null): void {
    const previousChannel = this.currentChannel;
    this.currentChannel = channelId;

    console.log(
      `[FuseConnect] Panel ${this.panelId} switching channel: ${previousChannel} → ${channelId}`
    );

    // Persist channel selection for background script access (tab-specific)
    // Each tab maintains its own channel selection independently
    const channelKey = `fuse_channel_${this.panelId}`;
    chrome.storage.local.set({ [channelKey]: channelId });

    if (channelId) {
      this.safeSendMessage({
        type: 'CHANNEL_JOIN',
        channelId,
        panelId: this.panelId,
      });
    } else {
      this.safeSendMessage({
        type: 'CHANNEL_LEAVE',
        channelId: previousChannel,
        panelId: this.panelId,
      });
    }

    this.update();
  }

  /**
   * Create channel (legacy - using prompt)
   */
  private createChannel(): void {
    const name = prompt('Enter channel name:');
    if (name) {
      this.safeSendMessage({
        type: 'CHANNEL_CREATE',
        name,
      });
    }
  }

  /**
   * Submit create channel from inline form
   */
  private submitCreateChannel(): void {
    const input = this.container?.querySelector('#fuse-new-channel-name') as HTMLInputElement;
    console.log(
      '[FuseConnect] submitCreateChannel called. Input found:',
      !!input,
      'Value:',
      input?.value
    );

    if (!input || !input.value.trim()) {
      console.warn('[FuseConnect] No channel name entered');
      return;
    }

    const name = input.value.trim();
    input.value = ''; // Clear input

    console.log('[FuseConnect] Creating channel:', name);

    // Use safe send with error handling
    this.safeSendMessage(
      {
        type: 'CHANNEL_CREATE',
        name,
      },
      (response) => {
        if (response?.success || response?.channelId) {
          console.log('[FuseConnect] Channel created successfully:', response.channelId);
          // The channels will be updated via CHANNELS_UPDATE message
        }
      }
    );

    // Optimistically add the channel to local state for immediate feedback
    const newChannel = {
      id: `local-${Date.now()}`,
      name,
      members: [],
      isPrivate: false,
      createdAt: Date.now(),
    };
    this.channels.push(newChannel);
    this.currentChannel = newChannel.id;
    this.update();
  }

  /**
   * Delete a channel (Admin only or creator - enforced by relay)
   */
  private deleteChannel(channelId: string): void {
    if (channelId === 'general') {
      alert('The General channel cannot be deleted.');
      return;
    }

    const ch = this.channels.find((c) => c.id === channelId);
    const name = ch ? ch.name : channelId;

    if (!confirm(`Are you sure you want to delete the channel "${name}"?`)) {
      return;
    }

    console.log('[FuseConnect] Deleting channel:', channelId);

    this.safeSendMessage(
      {
        type: 'CHANNEL_DELETE',
        channelId,
      },
      (response) => {
        if (response?.success) {
          console.log('[FuseConnect] Channel delete request sent');
          // Optimistically remove from local list
          this.channels = this.channels.filter((c) => c.id !== channelId);
          if (this.currentChannel === channelId) {
            this.currentChannel = null;
          }
          this.update();
        }
      }
    );
  }

  /**
   * Copy text to clipboard
   */
  private copyToClipboard(text: string, element?: HTMLElement): void {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        if (element) {
          const originalText = element.innerHTML;
          element.innerHTML = '✅';
          setTimeout(() => {
            element.innerHTML = originalText;
          }, 1500);
        }
      })
      .catch((err) => {
        console.error('[FuseConnect] Failed to copy:', err);
      });
  }

  /**
   * Safely send a message to Chrome runtime, handling context invalidation
   */
  private safeSendMessage(message: any, callback?: (response: any) => void): void {
    if (!this.isContextValid) {
      console.warn('[FuseConnect] Extension context is invalid, cannot send message');
      this.showContextInvalidatedWarning();
      return;
    }

    try {
      chrome.runtime.sendMessage(message, (response) => {
        // Check for runtime.lastError which indicates context invalidation
        if (chrome.runtime.lastError) {
          const errorMessage = chrome.runtime.lastError.message || '';
          if (
            errorMessage.includes('Extension context invalidated') ||
            errorMessage.includes('Receiving end does not exist')
          ) {
            console.error('[FuseConnect] Extension context invalidated:', errorMessage);
            this.isContextValid = false;
            this.showContextInvalidatedWarning();
            return;
          }
          console.warn('[FuseConnect] Chrome runtime error:', errorMessage);
        }
        if (callback) {
          callback(response);
        }
      });
    } catch (error) {
      console.error('[FuseConnect] Failed to send message:', error);
      this.isContextValid = false;
      this.showContextInvalidatedWarning();
    }
  }

  /**
   * Show warning that extension context is invalidated and page needs refresh
   */
  private showContextInvalidatedWarning(): void {
    // Only show once
    if (this.container?.querySelector('.fcp6-context-warning')) return;

    const warning = document.createElement('div');
    warning.className = 'fcp6-context-warning';
    warning.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, rgba(255,50,50,0.95) 0%, rgba(180,30,30,0.95) 100%);
        color: white;
        padding: 24px 32px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        z-index: 2147483647;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        max-width: 400px;
      ">
        <div style="font-size: 32px; margin-bottom: 12px;">⚠️</div>
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">Extension Reloaded</div>
        <div style="font-size: 13px; opacity: 0.9; margin-bottom: 16px;">
          The Fuse Connect extension was updated. Please refresh this page to continue using it.
        </div>
        <button onclick="location.reload()" style="
          background: white;
          color: #c00;
          border: none;
          padding: 10px 24px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        ">Refresh Page</button>
      </div>
    `;
    document.body.appendChild(warning);
  }

  /**
   * Handle service action (start/stop/restart)
   */
  private handleServiceAction(action: string): void {
    const target = this.container?.querySelector(`[data-action="${action}"]`) as HTMLElement;
    const serviceId = target?.getAttribute('data-service');

    if (!serviceId) return;

    const actionType = action.replace('-service', '').toUpperCase();

    this.safeSendMessage(
      {
        type: 'SERVICE_CONTROL',
        action: actionType,
        serviceId,
      },
      (response) => {
        if (response?.success) {
          this.addNotification({
            id: Date.now().toString(),
            title: 'Service ' + actionType.toLowerCase() + 'ed',
            message: `${serviceId} service ${actionType.toLowerCase()}ed successfully`,
            type: 'success',
            priority: 'normal',
            timestamp: Date.now(),
            read: false,
          });
        }
        this.update();
      }
    );
  }

  /**
   * Start all services
   */
  private startAllServices(): void {
    this.safeSendMessage(
      {
        type: 'SERVICE_CONTROL',
        action: 'START_ALL',
      },
      (response) => {
        if (response?.success) {
          this.addNotification({
            id: Date.now().toString(),
            title: 'All Services Started',
            message: 'All TNF services have been started',
            type: 'success',
            priority: 'normal',
            timestamp: Date.now(),
            read: false,
          });
        }
        this.update();
      }
    );
  }

  /**
   * Open terminal with relay command
   */
  private openTerminal(): void {
    this.safeSendMessage({
      type: 'OPEN_TERMINAL',
      command: 'pnpm relay:start',
    });
  }

  /**
   * Check health of all services
   */
  private checkServiceHealth(): void {
    // Request health check from background script
    this.safeSendMessage(
      {
        type: 'CHECK_SERVICE_HEALTH',
      },
      (response) => {
        if (response?.services) {
          // Update service statuses
          for (const [serviceId, status] of Object.entries(response.services)) {
            this.serviceStatuses.set(serviceId, status as 'online' | 'offline' | 'unknown');
          }
          this.update();
        }
      }
    );

    // Also update relay status based on connection
    if (this.connectionStatus === 'connected') {
      this.serviceStatuses.set('relay', 'online');
    } else {
      this.serviceStatuses.set('relay', 'offline');
    }
    this.update();
  }

  /**
   * Save settings from the settings tab
   */
  private saveSettings(): void {
    const relayUrl = this.container?.querySelector('[data-setting="relayUrl"]') as HTMLInputElement;
    const autoReconnect = this.container?.querySelector(
      '[data-setting="autoReconnect"]'
    ) as HTMLInputElement;
    const opacity = this.container?.querySelector('[data-setting="opacity"]') as HTMLInputElement;
    const alwaysOnTop = this.container?.querySelector(
      '[data-setting="alwaysOnTop"]'
    ) as HTMLInputElement;
    const debugMode = this.container?.querySelector(
      '[data-setting="debugMode"]'
    ) as HTMLInputElement;

    const settings = {
      relayUrl: relayUrl?.value || 'ws://localhost:3000/ws',
      autoReconnect: autoReconnect?.checked ?? true,
      opacity: parseFloat(opacity?.value || '1'),
      alwaysOnTop: alwaysOnTop?.checked ?? false,
      debugMode: debugMode?.checked ?? false,
    };

    // Update state
    this.state.opacity = settings.opacity;
    this.state.isPinned = settings.alwaysOnTop;

    // Apply opacity
    if (this.container) {
      this.container.style.opacity = String(settings.opacity);
    }

    // Save to storage
    chrome.storage.local.set({ fuse_settings: settings }, () => {
      this.addNotification({
        id: Date.now().toString(),
        title: 'Settings Saved',
        message: 'Your settings have been saved successfully',
        type: 'success',
        priority: 'normal',
        timestamp: Date.now(),
        read: false,
      });
      this.update();
    });

    // Send to background for relay URL update
    this.safeSendMessage({
      type: 'UPDATE_SETTINGS',
      settings,
    });

    this.saveState();
  }

  /**
   * Reset settings to defaults
   */
  private resetSettings(): void {
    if (!confirm('Are you sure you want to reset all settings to defaults?')) return;

    const defaults = {
      relayUrl: 'ws://localhost:3000/ws',
      autoReconnect: true,
      opacity: 1,
      alwaysOnTop: false,
      debugMode: false,
    };

    this.state.opacity = 1;
    this.state.isPinned = false;

    if (this.container) {
      this.container.style.opacity = '1';
    }

    chrome.storage.local.set({ fuse_settings: defaults }, () => {
      this.addNotification({
        id: Date.now().toString(),
        title: 'Settings Reset',
        message: 'All settings have been reset to defaults',
        type: 'info',
        priority: 'normal',
        timestamp: Date.now(),
        read: false,
      });
      this.update();
    });

    this.safeSendMessage({
      type: 'UPDATE_SETTINGS',
      settings: defaults,
    });
  }

  /**
   * Mark notifications as read
   */
  private markNotificationsRead(): void {
    this.notifications.forEach((n) => (n.read = true));
    this.unreadCount = 0;
    this.update();
  }

  /**
   * Handle Chrome messages
   */
  private handleChromeMessage(message: any): void {
    switch (message.type) {
      case 'CONNECTION_STATUS':
        this.connectionStatus = message.status;
        this.update();
        break;
      case 'AGENTS_UPDATE':
        this.agents = message.agents || [];
        this.update();
        break;
      case 'NEW_MESSAGE':
        // MULTI-AGENT COLLABORATION:
        // This is a chatroom model. Every participant (human + AI agents) should see all messages.
        // Messages from OTHER agents should be injected into our local chat so our AI can respond.
        // Messages from OURSELVES should NOT be re-injected (prevents loops).

        if (message.message) {
          const msg = message.message;

          // PRIMARY SELF-DETECTION: Use metadata.senderId (most reliable)
          const senderIdFromMeta = msg.metadata?.senderId;
          const isFromSelf =
            senderIdFromMeta === this.myAgentId ||
            msg.from === this.myAgentId ||
            senderIdFromMeta === (this as any).browserAgentId ||
            msg.from === (this as any).browserAgentId;

          // FALLBACK SELF-DETECTION: Check common self-identifiers
          const isFromSelfFallback = msg.from === 'You' || msg.from === 'You (Fuse)';

          const isOwnMessage = isFromSelf || isFromSelfFallback;
          if (isOwnMessage) {
            console.log('[FuseConnect] Identified self-message');
          }

          // DEDUPE LOCK: Prevent doubled Human input.
          // Check if we already have a message with this content from ourselves in a short window.
          // This stops the "Optimistic UI" local push from colliding with the "Relay Roundtrip" back-broadcast.
          const isDuplicate = this.messages.some((m) => {
            // Match by ID if both have one
            if (msg.id && m.id === msg.id) return true;
            // Match by content + sender + time window (fallback for optimistic local IDs)
            const sameContent = m.content === msg.content;
            const sameSender = m.from === msg.from || (isOwnMessage && m.from === 'You');
            const withinWindow = Math.abs((m.timestamp || 0) - (msg.timestamp || 0)) < 10000;
            return sameContent && sameSender && withinWindow;
          });

          if (isDuplicate) {
            console.log('[FuseConnect] Deduped message (already shown):', msg.id || 'local');
            break;
          }

          // Add ALL messages to chat display (this is a chatroom - everyone sees everything)
          this.messages.push(msg);
          if (this.messages.length > 50) this.messages.shift();
          this.update();

          // INJECTION LOGIC for multi-agent collaboration:
          // - If message is from SELF: Don't inject (we already sent it or it's our AI's response)
          // - If message is from ANOTHER agent: INJECT so our AI can see and respond
          //
          // The key distinction: isOwnMessage means this message originated from THIS tab.
          // If it's from another tab/agent, we want our AI to see it and potentially respond.

          console.log('[FuseConnect] NEW_MESSAGE processing:', {
            from: msg.from,
            isOwnMessage,
            senderId: msg.metadata?.senderId,
            myAgentId: this.myAgentId,
            messageType: msg.messageType,
            contentPreview: msg.content?.substring(0, 50),
          });

          if (!isOwnMessage && msg.content) {
            // This message is from ANOTHER participant.
            // NOTE: We do NOT need to request injection here because `content/index.ts`
            // already handles injection for all tabs (active and background) via its own
            // NEW_MESSAGE handler.
            //
            // Requesting injection here causes DOUBLE INJECTION on the active tab:
            // 1. content/index.ts injects it directly
            // 2. FloatingPanel adds it here -> sends INJECT_MESSAGE to background -> background sends to active tab -> content/index.ts injects it AGAIN
            //
            // This double injection causes race conditions where messages get cleared/overwritten
            // and often results in the message getting "stuck" in the input field.

            console.log(
              '[FuseConnect] External message received (display only):',
              msg.from,
              msg.metadata?.platform
            );
          } else if (isOwnMessage) {
            console.log('[FuseConnect] Not injecting own message (self-detection)');
          }
        }
        break;
      case 'CHANNELS_UPDATE':
        this.channels = message.channels || [];
        this.update();
        break;
      case 'JOINED_CHANNELS_UPDATE':
        // Update any local state tracking joined channels if necessary
        // For now, we mainly rely on currentChannel, but this ensures we have the data
        console.log('[FuseConnect] Joined channels updated:', message.joinedChannels);
        this.update();
        break;
      case 'NOTIFICATION':
        this.addNotification(message.notification);
        break;
      case 'CHAT_DETECTED':
        this.chatElements = message.elements;
        this.update();
        break;
      case 'TRANSCRIPT_UPDATE':
        if (message.entry) {
          const entry = message.entry;
          // Add to local messages if not already present (dedupe by id)
          const id = entry.id || `transcript-${entry.ts}-${entry.seq}`;
          if (!this.messages.some((m) => m.id === id)) {
            this.messages.push({
              id,
              from:
                entry.role === 'user'
                  ? this.myAgentId || 'You'
                  : entry.role === 'assistant'
                    ? 'AI (Edge)'
                    : entry.role,
              to: entry.role === 'user' ? 'AI' : 'User',
              content: entry.content,
              timestamp: entry.ts,
              type: 'text',
              metadata: entry.meta,
            });
            this.update();
          }
        }
        break;
      case 'STREAMING_UPDATE':
        this.streamingState = message.state;
        this.update();
        break;
      case 'RESPONSE_COMPLETE':
        // RESTORED FROM BACKUP: Only add to local UI, do NOT broadcast
        console.log('[FuseConnect] RESPONSE_COMPLETE received:', {
          hasContent: !!message.content,
          connectionStatus: this.connectionStatus,
          currentChannel: this.currentChannel,
        });

        if (message.content) {
          let responseContent =
            typeof message.content === 'string'
              ? message.content
              : (message as any).content?.substring(0, 500) || 'Response received';

          // Strip any relay prefixes from the response content
          responseContent = responseContent
            .replace(/^\[User → AI\]\s*/g, '')
            .replace(/^\[AI → User\]\s*/g, '')
            .replace(/^\[AI Response\]\s*/g, '')
            .trim();

          // Skip if content is empty after stripping or if it still contains embedded prefixes
          if (
            !responseContent ||
            responseContent.includes('[User → AI]') ||
            responseContent.includes('[AI → User]') ||
            responseContent.includes('[AI Response]')
          ) {
            console.log('[FuseConnect] Skipping response with embedded prefixes');
            break;
          }

          // Check for duplicate
          const recentDuplicate = this.messages.some(
            (m) =>
              m.from === 'AI (Page)' &&
              m.content === responseContent &&
              Date.now() - m.timestamp < 5000
          );

          if (!recentDuplicate) {
            this.messages.push({
              id: `ai-${Date.now()}`,
              from: 'AI (Page)',
              to: 'You',
              content: responseContent,
              timestamp: Date.now(),
              type: 'text',
            });
            this.update();
          } else {
            console.log('[FuseConnect] Skipping duplicate response');
          }

          // NOTE: We do NOT broadcast AI responses automatically.
          // This was causing the self-injection loop.
          // Users can manually share AI responses if desired.
        }
        break;
      case 'TASK_ASSIGN':
        const task = (message as any).task;
        if (task) {
          // Check for duplicate
          if (!this.tasks.some((t) => t.id === task.id)) {
            this.tasks.unshift(task);
            this.unreadCount++;
            this.addNotification({
              id: Date.now().toString(),
              type: 'info',
              title: 'New Task Assigned',
              message: task.title,
              priority: 'normal',
              timestamp: Date.now(),
              read: false,
            });
            this.update();
          }
        }
        break;
    }
  }

  /**
   * Add notification
   */
  private addNotification(notification: Notification): void {
    this.notifications.unshift(notification);
    if (this.notifications.length > 50) this.notifications.pop();
    this.unreadCount++;
    this.update();

    // Show desktop notification if enabled
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: chrome.runtime.getURL('icons/icon48.png'),
      });
    }
  }

  /**
   * Update UI
   */
  /**
   * Update UI
   */
  private update(): void {
    if (!this.container) return;

    // Save scroll position if chat is open
    let scrollTop = 0;
    const chatScroll = this.container.querySelector('#fuse-chat-scroll');
    if (chatScroll) {
      scrollTop = chatScroll.scrollTop;
    }

    // Save input value
    const input = this.container.querySelector('[data-input="message"]') as HTMLTextAreaElement;
    const inputValue = input ? input.value : '';

    // Save channel name input value
    const channelInput = this.container.querySelector('#fuse-new-channel-name') as HTMLInputElement;
    const channelInputValue = channelInput ? channelInput.value : '';

    // Re-render
    this.container.innerHTML = this.render();

    // Restore input value
    const newInput = this.container.querySelector('[data-input="message"]') as HTMLTextAreaElement;
    if (newInput && inputValue) {
      newInput.value = inputValue;
    }

    // Restore channel name input value
    const newChannelInput = this.container.querySelector(
      '#fuse-new-channel-name'
    ) as HTMLInputElement;
    if (newChannelInput && channelInputValue) {
      newChannelInput.value = channelInputValue;
      // If it had focus, we should try to restore focus too, but simple value restore helps most
    }

    // Apply styles/position
    this.applyPositionAndSize();

    // Re-attach listeners
    this.setupListeners();

    // Restore scroll position or scroll to bottom if it was at bottom
    const newChatScroll = this.container.querySelector('#fuse-chat-scroll');
    if (newChatScroll) {
      // If was near bottom, scroll to bottom (auto-scroll)
      // Otherwise restore position
      const wasNearBottom =
        chatScroll && chatScroll.scrollHeight - chatScroll.scrollTop - chatScroll.clientHeight < 50;

      if (wasNearBottom) {
        newChatScroll.scrollTop = newChatScroll.scrollHeight;
      } else {
        newChatScroll.scrollTop = scrollTop;
      }
    }
  }

  // Utility methods
  private formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private truncate(text: string, len: number): string {
    return text.length > len ? text.slice(0, len) + '...' : text;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private getAgentIcon(platform: string): string {
    const icons: Record<string, string> = {
      'chrome-extension': '🌐',
      vscode: '🔷',
      antigravity: '🌌',
      'electron-desktop': '🖥️',
      'theia-ide': '💻',
      'api-gateway': '🚀',
      'backend-service': '⚙️',
      saas: '☁️',
    };
    return icons[platform] || '🤖';
  }

  /**
   * Update chat detection state
   */
  updateChatElements(elements: DetectedChatElements): void {
    this.chatElements = elements;
    this.update();
  }

  /**
   * Set the Page Agent ID for this panel
   */
  setAgentId(id: string): void {
    console.log('[FuseConnect] Panel assigned Agent ID:', id);
    this.myAgentId = id;
    this.update(); // Update UI if needed (e.g. to show ID)
  }

  /**
   * Get the current channel this panel is connected to
   */
  getCurrentChannel(): string | null {
    return this.currentChannel;
  }

  /**
   * Update streaming state
   */
  updateStreamingState(state: StreamingState): void {
    this.streamingState = state;
    this.update();
  }

  /**
   * Show the panel
   */
  show(): void {
    if (!this.container) {
      this.inject();
    }
    if (this.container) {
      this.container.style.display = 'block';
      this.state.mode = 'expanded'; // FORCE expanded on show
      this.applyPositionAndSize();
      this.update(); // Add update to ensure render state matches
    }
  }

  /**
   * Hide the panel
   */
  hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  /**
   * Check if panel is visible
   */
  isVisible(): boolean {
    return this.container?.style.display !== 'none';
  }

  /**
   * Handle messages from background/popup/content script
   */
  handleMessage(message: Record<string, unknown>): void {
    this.handleChromeMessage(message as any);
  }

  /**
  /**
   * Destroy panel
   */
  destroy(): void {
    // Remove Chrome message listener to prevent memory leaks and duplicate handlers
    if (this.chromeMessageListener) {
      chrome.runtime.onMessage.removeListener(this.chromeMessageListener);
      this.chromeMessageListener = null;
    }

    // Remove storage listener
    if (this.storageListener) {
      chrome.storage.onChanged.removeListener(this.storageListener);
      this.storageListener = null;
    }

    // Clear health poll interval
    if (this.healthPollInterval) {
      clearInterval(this.healthPollInterval);
      this.healthPollInterval = null;
    }

    this.container?.remove();
    document.getElementById('fuse-connect-styles-v6')?.remove();
  }

  /**
  /**
   * Handle generic actions from data-action attributes
   */
  private handleAction(action: string, element?: HTMLElement): void {
    switch (action) {
      case 'send':
        this.sendMessage();
        break;
      case 'pin':
        this.togglePin();
        break;
      case 'minimize':
        this.minimize();
        break;
      case 'toggle':
        this.toggleCollapse();
        break;
      case 'expand':
        this.expand();
        break;
      case 'copy-to-clipboard':
        if (element && element.dataset.value) {
          this.copyToClipboard(element.dataset.value, element);
        }
        break;
      case 'select-channel':
        // Handled by change listener, but good to have case
        break;
      case 'delete-channel':
        if (element && element.dataset.channelId) {
          this.deleteChannel(element.dataset.channelId);
        }
        break;
      case 'inject-to-chat':
        this.injectToPageChat();
        break;
      case 'accept-task':
        if (element && element.dataset.taskId) {
          const taskId = element.dataset.taskId;
          const task = this.tasks.find((t) => t.id === taskId);
          if (task) {
            // Construct prompt
            const prompt = `[SYSTEM TASK ASSIGNMENT]\nTitle: ${task.title}\nDescription: ${task.description}\nInstructions:\n${task.instructions.map((i) => `- ${i}`).join('\n')}\n\nPlease execute this task.`;

            // Inject
            this.safeSendMessage(
              {
                type: 'INJECT_MESSAGE',
                content: prompt,
                metadata: { isTask: true, taskId: task.id },
              },
              (response) => {
                if (response?.success) {
                  // Add system message indicating start
                  this.messages.push({
                    id: `sys-${Date.now()}`,
                    from: 'System',
                    to: 'You',
                    content: `Task "${task.title}" started.`,
                    timestamp: Date.now(),
                    type: 'text',
                    metadata: { isSystemMessage: true },
                  });
                  this.update();
                }
              }
            );

            // Remove from local list (mark as in progress basically)
            this.tasks = this.tasks.filter((t) => t.id !== taskId);
            this.update();
          }
        }
        break;
      case 'reject-task':
        if (element && element.dataset.taskId) {
          this.tasks = this.tasks.filter((t) => t.id !== element.dataset.taskId);
          this.update();
        }
        break;
      default:
        // Check if it's a service action
        if (action.endsWith('-service')) {
          this.handleServiceAction(action);
        } else if (action === 'start-all-services') {
          this.startAllServices();
        } else if (action === 'open-terminal') {
          this.openTerminal();
        } else if (action === 'check-health') {
          this.checkServiceHealth();
        } else if (action === 'save-settings') {
          this.saveSettings();
        } else if (action === 'reset-settings') {
          this.resetSettings();
        } else if (action === 'submit-create-channel') {
          this.submitCreateChannel();
        }
    }
  }

  /**
   * Switch tab
   */
  private switchTab(tab: PanelTab): void {
    this.state.activeTab = tab;
    // Persist active tab
    this.saveState();
    this.update();
  }

  /**
   * Toggle pin state
   */
  private togglePin(): void {
    this.state.isPinned = !this.state.isPinned;
    const btn = this.container?.querySelector('#fuse-btn-pin');
    if (btn) {
      btn.innerHTML = this.state.isPinned ? '📌' : '📍';
    }
    this.saveState();
  }

  /**
   * Minimize panel
   */
  private minimize(): void {
    this.state.mode = 'minimized';
    this.saveState();
    this.update();
  }

  /**
   * Expand panel
   */
  private expand(): void {
    this.state.mode = 'expanded';
    this.saveState();
    this.update();
  }

  /**
   * Toggle collapse state
   */
  private toggleCollapse(): void {
    if (this.state.mode === 'collapsed') {
      this.state.mode = 'expanded';
    } else {
      this.state.mode = 'collapsed';
    }
    this.saveState();
    this.update();
  }
}

export function createEnhancedFloatingPanel(options?: FloatingPanelOptions): EnhancedFloatingPanel {
  return new EnhancedFloatingPanel(options);
}
