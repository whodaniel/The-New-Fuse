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

  // Data
  private connectionStatus: ConnectionStatus = 'disconnected';
  private chatElements: DetectedChatElements | null = null;
  private streamingState: StreamingState | null = null;
  private agents: Agent[] = [];
  private channels: FederationChannel[] = [];
  private currentChannel: string | null = null;
  private messages: AgentMessage[] = [];
  private notifications: Notification[] = [];
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
      mode: options.mode || 'collapsed',
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
      if (response) {
        console.log('[FuseConnect] Received state from background:', response);
        this.connectionStatus = response.connectionStatus || 'disconnected';
        this.agents = response.agents || [];
        this.channels = response.channels || [];

        // Restore current channel if we have one stored
        chrome.storage.local.get(['fuse_current_channel'], (result) => {
          if (result.fuse_current_channel) {
            this.currentChannel = result.fuse_current_channel;
          }
          this.update();
        });
      }
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
            .map(
              (msg) => `
          <div class="fcp6-chat-card" data-msg-id="${msg.id}">
            <div class="fcp6-chat-header">
              <span class="fcp6-chat-from">${this.escapeHtml(msg.from)}</span>
              <span class="fcp6-chat-time">${this.formatTime(msg.timestamp)}</span>
            </div>
            <div class="fcp6-chat-content" style="user-select: text; -webkit-user-select: text; cursor: text;">${this.escapeHtml(msg.content)}</div>
          </div>
        `
            )
            .join('')
        : `<div class="fcp6-empty"><div class="fcp6-empty-icon">💬</div><p>No messages yet</p><p style="font-size: 11px; opacity: 0.6;">Send a message to start chatting</p></div>`;

    return `
      ${detectionHtml}
      <div class="fcp6-chat-scroll" id="fuse-chat-scroll" style="flex: 1; overflow-y: auto; max-height: 300px; padding-right: 4px;">
        ${messagesHtml}
      </div>
    `;
  }

  /**
   * Render channels tab
   */
  private renderChannelsTab(): string {
    // Channel creation form
    const createFormHtml = `
      <div class="fcp6-create-channel-form" style="margin-bottom: 12px; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 8px;">
        <div style="font-size: 11px; color: rgba(255,255,255,0.6); margin-bottom: 6px;">Create New Channel</div>
        <div style="display: flex; gap: 8px;">
          <input type="text"
            id="fuse-new-channel-name"
            placeholder="Channel name..."
            style="flex: 1; padding: 8px; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; background: rgba(0,0,0,0.3); color: white; font-size: 12px;"
          />
          <button class="fcp6-send-btn" data-action="submit-create-channel" style="padding: 8px 12px;">
            Create
          </button>
        </div>
      </div>
    `;

    if (this.channels.length === 0) {
      return `
        ${createFormHtml}
        <div class="fcp6-empty">
          <div class="fcp6-empty-icon">📢</div>
          <p>No channels yet</p>
          <p style="font-size: 11px; opacity: 0.6;">Create a channel to sync messages to relay</p>
        </div>
      `;
    }

    return `
      ${createFormHtml}
      <div class="fcp6-section-title">Your Channels</div>
      ${this.channels
        .map(
          (ch) => `
        <div class="fcp6-channel ${this.currentChannel === ch.id ? 'active' : ''}" data-channel="${ch.id}" data-action="join-channel">
          <span class="fcp6-channel-icon">${ch.isPrivate ? '🔒' : '#'}</span>
          <div class="fcp6-channel-info">
            <div class="fcp6-channel-name">${this.escapeHtml(ch.name)}</div>
            <div class="fcp6-channel-members">${ch.members.length} members</div>
          </div>
          ${this.currentChannel === ch.id ? '<span style="color: #0f8;">✓ Active</span>' : ''}
        </div>
      `
        )
        .join('')}
    `;
  }

  /**
   * Render agents tab
   */
  private renderAgentsTab(): string {
    if (this.agents.length === 0) {
      return `
        <div class="fcp6-empty">
          <div class="fcp6-empty-icon">🤖</div>
          <p>No agents connected</p>
          <p style="font-size: 11px; margin-top: 4px;">Connect to the relay to see agents</p>
        </div>
      `;
    }

    return `
      <div class="fcp6-section-title">Connected Agents (${this.agents.length})</div>
      ${this.agents
        .map(
          (agent) => `
        <div class="fcp6-agent" data-agent="${agent.id}">
          <div class="fcp6-agent-avatar">${this.getAgentIcon(agent.platform)}</div>
          <div style="flex: 1;">
            <div class="fcp6-agent-name">${agent.name}</div>
            <div class="fcp6-agent-platform">${agent.platform}</div>
          </div>
          <span class="fcp6-status-dot ${agent.status}"></span>
        </div>
      `
        )
        .join('')}
    `;
  }

  /**
   * Render notifications tab
   */
  private renderNotificationsTab(): string {
    if (this.notifications.length === 0) {
      return `
        <div class="fcp6-empty">
          <div class="fcp6-empty-icon">🔔</div>
          <p>No notifications</p>
        </div>
      `;
    }

    return this.notifications
      .map(
        (n) => `
      <div class="fcp6-notification ${n.read ? '' : 'unread'}" data-notification="${n.id}">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <strong>${n.title}</strong>
          <span style="font-size: 10px; color: rgba(255,255,255,0.4);">${this.formatTime(n.timestamp)}</span>
        </div>
        <div style="font-size: 12px; color: rgba(255,255,255,0.7);">${n.message}</div>
      </div>
    `
      )
      .join('');
  }

  /**
   * Render services tab
   */
  private renderServicesTab(): string {
    const services = [
      {
        id: 'relay',
        name: 'TNF Relay',
        icon: '🔌',
        status: this.serviceStatuses.get('relay') || 'unknown',
        port: 3001,
      },
      {
        id: 'api',
        name: 'API Server',
        icon: '🌐',
        status: this.serviceStatuses.get('api') || 'unknown',
        port: 3001,
      },
      {
        id: 'frontend',
        name: 'Frontend',
        icon: '🖥️',
        status: this.serviceStatuses.get('frontend') || 'unknown',
        port: 3000,
      },
    ];

    return `
      <div class="fcp6-services-header">
        <h4 style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.6); text-transform: uppercase;">Service Management</h4>
      </div>
      ${services
        .map(
          (svc) => `
        <div class="fcp6-service-card" data-service="${svc.id}">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">${svc.icon}</span>
            <div style="flex: 1;">
              <div style="font-weight: 600;">${svc.name}</div>
              <div style="font-size: 11px; color: rgba(255,255,255,0.5);">Port ${svc.port}</div>
            </div>
            <span class="fcp6-status-dot ${svc.status}"></span>
          </div>
          <div class="fcp6-service-actions">
            <button class="fcp6-service-btn" data-action="start-service" data-service="${svc.id}" title="Start">▶️</button>
            <button class="fcp6-service-btn" data-action="stop-service" data-service="${svc.id}" title="Stop">⏹️</button>
            <button class="fcp6-service-btn" data-action="restart-service" data-service="${svc.id}" title="Restart">🔄</button>
          </div>
        </div>
      `
        )
        .join('')}
      <div style="margin-top: 12px;">
        <button class="fcp6-btn fcp6-btn-primary" data-action="start-all-services" style="width: 100%;">
          🚀 Start All Services
        </button>
      </div>
      <div style="margin-top: 8px;">
        <button class="fcp6-btn fcp6-btn-secondary" data-action="open-terminal" style="width: 100%;">
          💻 Open Terminal
        </button>
      </div>
      <div style="margin-top: 8px;">
        <button class="fcp6-btn fcp6-btn-secondary" data-action="check-health" style="width: 100%;">
          🩺 Check Health
        </button>
      </div>
    `;
  }

  /**
   * Render settings tab
   */
  private renderSettingsTab(): string {
    return `
      <div class="fcp6-settings-section">
        <h4 style="margin: 0 0 10px 0; font-size: 12px; color: rgba(255,255,255,0.6); text-transform: uppercase;">Connection</h4>
        <div class="fcp6-setting-row">
          <label>Relay URL</label>
          <input type="text" class="fcp6-setting-input" data-setting="relayUrl" value="ws://localhost:3001/ws" />
        </div>
        <div class="fcp6-setting-row">
          <label>Auto-Reconnect</label>
          <input type="checkbox" class="fcp6-setting-checkbox" data-setting="autoReconnect" checked />
        </div>
      </div>

      <div class="fcp6-settings-section">
        <h4 style="margin: 0 0 10px 0; font-size: 12px; color: rgba(255,255,255,0.6); text-transform: uppercase;">Panel</h4>
        <div class="fcp6-setting-row">
          <label>Opacity</label>
          <input type="range" class="fcp6-setting-range" data-setting="opacity" min="0.5" max="1" step="0.1" value="${this.state.opacity}" />
        </div>
        <div class="fcp6-setting-row">
          <label>Always on Top</label>
          <input type="checkbox" class="fcp6-setting-checkbox" data-setting="alwaysOnTop" ${this.state.isPinned ? 'checked' : ''} />
        </div>
      </div>

      <div class="fcp6-settings-section">
        <h4 style="margin: 0 0 10px 0; font-size: 12px; color: rgba(255,255,255,0.6); text-transform: uppercase;">Debug</h4>
        <div class="fcp6-setting-row">
          <label>Debug Mode</label>
          <input type="checkbox" class="fcp6-setting-checkbox" data-setting="debugMode" />
        </div>
        <div class="fcp6-setting-row">
          <label>Show Element Refs</label>
          <input type="checkbox" class="fcp6-setting-checkbox" data-setting="showRefs" />
        </div>
      </div>

      <div style="margin-top: 12px;">
        <button class="fcp6-btn fcp6-btn-secondary" data-action="save-settings" style="width: 100%;">
          💾 Save Settings
        </button>
      </div>
      <div style="margin-top: 8px;">
        <button class="fcp6-btn fcp6-btn-danger" data-action="reset-settings" style="width: 100%;">
          🗑️ Reset to Defaults
        </button>
      </div>
    `;
  }

  /**
   * Render input area
   */
  private renderInputArea(): string {
    const hasChat = !!this.chatElements;
    const isConnected = this.connectionStatus === 'connected';

    return `
      <div class="fcp6-input-area" id="fuse-input-area" data-testid="fuse-input-area">
        <div class="fcp6-input-row">
          <textarea class="fcp6-input" id="fuse-message-input" data-testid="fuse-message-input" placeholder="${hasChat ? 'Type message to send...' : 'No chat detected on this page'}" rows="1" data-input="message" aria-label="Message input" ${!hasChat ? 'disabled' : ''}></textarea>
          <button class="fcp6-send-btn" id="fuse-btn-send" data-testid="fuse-btn-send" data-action="send-message" title="Send message" aria-label="Send message" ${!hasChat ? 'disabled' : ''}>
            ${hasChat ? '➤' : '⚠️'}
          </button>
        </div>
        <div class="fcp6-input-hint">
          ${
            hasChat
              ? `<span style="color: rgba(0,255,136,0.7);">●</span> Chat detected ${isConnected ? '• Will sync to relay' : ''}`
              : `<span style="color: rgba(255,100,100,0.7);">●</span> No chat interface detected on this page`
          }
        </div>
      </div>
    `;
  }

  /**
   * Apply position and size
   */
  private applyPositionAndSize(): void {
    if (!this.container) return;

    this.container.style.right = `${this.state.position.x}px`;
    this.container.style.top = `${this.state.position.y}px`;
    this.container.style.width = `${this.state.size.width}px`;
    this.container.style.height =
      this.state.mode === 'collapsed' ? `${COLLAPSED_HEIGHT}px` : `${this.state.size.height}px`;
  }

  /**
   * Setup event listeners
   */
  private setupListeners(): void {
    if (!this.container) return;

    // Click handlers
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // Action buttons
      const action = target.closest('[data-action]')?.getAttribute('data-action');
      if (action) this.handleAction(action);

      // Tab clicks
      const tab = target.closest('[data-tab]')?.getAttribute('data-tab') as PanelTab;
      if (tab) this.switchTab(tab);

      // Channel clicks
      const channel = target.closest('[data-channel]')?.getAttribute('data-channel');
      if (channel) this.joinChannel(channel);
    });

    // Channel selector change handler
    this.container.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      if (target.id === 'fuse-channel-select') {
        const selectedChannel = target.value || null;
        this.selectChannel(selectedChannel);
      }
    });

    // Drag handling
    this.container.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;

      // Check for drag handle
      if (target.closest('[data-drag-handle]') && !target.closest('[data-action]')) {
        this.startDrag(e);
      }

      // Check for resize handle
      const resize = target.getAttribute('data-resize');
      if (resize) {
        this.startResize(e, resize);
      }
    });

    // Message input - Enter to send
    this.container.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement;
      if (target.getAttribute('data-input') === 'message' && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleAction('send-message');
      }
    });

    // Chrome message listener - store reference for cleanup
    this.chromeMessageListener = (message, sender, sendResponse) => {
      this.handleChromeMessage(message);
      sendResponse({ received: true });
      return true;
    };
    chrome.runtime.onMessage.addListener(this.chromeMessageListener);
  }

  /**
   * Start dragging
   */
  private startDrag(e: MouseEvent): void {
    if (this.state.isPinned) return;

    this.dragState = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startPosX: this.state.position.x,
      startPosY: this.state.position.y,
    };

    let rafId: number | null = null;
    const onMove = (e: MouseEvent) => {
      if (!this.dragState.isDragging || !this.container) return;

      const clientX = e.clientX;
      const clientY = e.clientY;

      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        const deltaX = this.dragState.startX - clientX;
        const deltaY = clientY - this.dragState.startY;

        this.state.position = {
          x: Math.max(0, this.dragState.startPosX + deltaX),
          y: Math.max(0, this.dragState.startPosY + deltaY),
        };

        this.container!.style.right = `${this.state.position.x}px`;
        this.container!.style.top = `${this.state.position.y}px`;
        rafId = null;
      });
    };

    const onUp = () => {
      this.dragState.isDragging = false;
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
   * Handle action buttons
   */
  private handleAction(action: string): void {
    switch (action) {
      case 'toggle':
        this.state.mode = this.state.mode === 'collapsed' ? 'expanded' : 'collapsed';
        this.update();
        this.saveState();
        break;
      case 'minimize':
        this.state.mode = 'minimized';
        this.update();
        this.saveState();
        break;
      case 'expand':
        this.state.mode = 'expanded';
        this.update();
        this.saveState();
        break;
      case 'pin':
        this.state.isPinned = !this.state.isPinned;
        this.update();
        break;
      case 'send':
        this.sendMessage();
        break;
      case 'send-message':
        this.sendUnifiedMessage();
        break;
      case 'inject-to-chat':
        this.injectToPageChat();
        break;
      case 'create-channel':
        this.createChannel();
        break;
      case 'submit-create-channel':
        this.submitCreateChannel();
        break;
      // Service actions
      case 'start-service':
      case 'stop-service':
      case 'restart-service':
        this.handleServiceAction(action);
        break;
      case 'start-all-services':
        this.startAllServices();
        break;
      case 'open-terminal':
        this.openTerminal();
        break;
      case 'check-health':
        this.checkServiceHealth();
        break;
      // Settings actions
      case 'save-settings':
        this.saveSettings();
        break;
      case 'reset-settings':
        this.resetSettings();
        break;
    }
  }

  /**
   * Switch active tab
   */
  private switchTab(tab: PanelTab): void {
    this.state.activeTab = tab;
    if (tab === 'notifications') {
      this.markNotificationsRead();
    }
    this.update();
  }

  /**
   * Send message
   */
  private sendMessage(): void {
    const input = this.container?.querySelector('[data-input="message"]') as HTMLTextAreaElement;
    if (!input || !input.value.trim()) return;

    const content = input.value.trim();
    input.value = '';

    // Send via relay to agents
    chrome.runtime.sendMessage({
      type: 'BROADCAST_MESSAGE',
      content,
      channel: this.currentChannel,
    });

    // Add to local messages
    this.messages.push({
      id: Date.now().toString(),
      from: 'You',
      to: 'relay',
      content,
      timestamp: Date.now(),
      type: 'text',
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

    // Send to content script to inject into page chat
    chrome.runtime.sendMessage(
      {
        type: 'INJECT_MESSAGE',
        content,
      },
      (response) => {
        if (response?.success) {
          // Add to local messages
          this.messages.push({
            id: Date.now().toString(),
            from: 'You (Fuse)',
            to: 'page',
            content,
            timestamp: Date.now(),
            type: 'text',
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

    console.log('[FuseConnect] Sending unified message:', content.substring(0, 50));

    // Add user message to local display immediately with unique ID
    const msgId = `user-${Date.now()}`;
    this.messages.push({
      id: msgId,
      from: 'You',
      to: 'AI',
      content,
      timestamp: Date.now(),
      type: 'text',
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

        chrome.runtime.sendMessage({
          type: 'BROADCAST_MESSAGE',
          content: `[User → AI] ${content}`,
          channel: this.currentChannel,
        });
      } else {
        console.log('[FuseConnect] Skipping duplicate user message broadcast');
      }
    }

    // Inject message into page chat
    chrome.runtime.sendMessage(
      {
        type: 'INJECT_MESSAGE',
        content,
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
    // Persist channel selection for background script access
    chrome.storage.local.set({ fuse_current_channel: channelId });
    chrome.runtime.sendMessage({
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

    // Persist channel selection for background script access
    chrome.storage.local.set({ fuse_current_channel: channelId });

    if (channelId) {
      chrome.runtime.sendMessage({
        type: 'CHANNEL_JOIN',
        channelId,
        panelId: this.panelId,
      });
    } else {
      chrome.runtime.sendMessage({
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
      chrome.runtime.sendMessage({
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

    chrome.runtime.sendMessage(
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
    chrome.runtime.sendMessage(
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
    chrome.runtime.sendMessage({
      type: 'OPEN_TERMINAL',
      command: 'pnpm relay:start',
    });
  }

  /**
   * Check health of all services
   */
  private checkServiceHealth(): void {
    // Request health check from background script
    chrome.runtime.sendMessage(
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
      relayUrl: relayUrl?.value || 'ws://localhost:3001/ws',
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
    chrome.runtime.sendMessage({
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
      relayUrl: 'ws://localhost:3001/ws',
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

    chrome.runtime.sendMessage({
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
        // Add to local messages display WITH DEDUPLICATION
        if (message.message) {
          const msg = message.message;

          // CRITICAL: Skip messages that are echoes from our own agent
          // This prevents the feedback loop where we receive our own broadcasts
          const isOwnMessage =
            msg.from === 'You' ||
            msg.from === 'Browser Agent' ||
            msg.from?.includes('Browser Agent');

          // Also check for duplicate content within last 5 seconds
          const isDuplicate = this.messages.some(
            (m) => m.content === msg.content && Date.now() - m.timestamp < 5000
          );

          // Skip if it's our own echo OR if it's a duplicate
          if (isOwnMessage || isDuplicate) {
            console.log('[FuseConnect] Skipping message echo/duplicate:', {
              from: msg.from,
              isOwn: isOwnMessage,
              isDup: isDuplicate,
            });
            break;
          }

          this.messages.push(msg);
          if (this.messages.length > 50) this.messages.shift();
          this.update();

          // Auto-inject into page chat if message is from an external agent (not from this panel)
          // IMPORTANT: Skip injection for messages that originated from AI responses to prevent feedback loops
          const isFromExternalAgent =
            msg.from && !msg.from.includes('You') && !msg.from.includes('AI (Page)');

          // Check if this is an AI response echo (would cause feedback loop)
          const isAIResponseEcho =
            msg.content?.startsWith('[AI Response]') ||
            msg.content?.startsWith('[AI → User]') ||
            msg.content?.startsWith('[User → AI]') ||
            msg.from?.includes('Browser Agent') ||
            msg.messageType === 'ai-response';

          console.log('[FuseConnect] NEW_MESSAGE auto-inject check:', {
            from: msg.from,
            isFromExternalAgent,
            isAIResponseEcho,
            hasContent: !!msg.content,
            contentPreview: msg.content?.substring(0, 50),
          });

          if (isFromExternalAgent && msg.content && !isAIResponseEcho) {
            console.log('[FuseConnect] Auto-injecting external message into page chat:', msg.from);

            // Inject the message content into the page's AI chat
            chrome.runtime.sendMessage(
              {
                type: 'INJECT_MESSAGE',
                content: msg.content,
                autoForward: true, // Flag to indicate this came from relay
              },
              (response) => {
                if (response?.success) {
                  console.log('[FuseConnect] External message injected successfully');
                } else {
                  console.warn('[FuseConnect] Failed to inject external message:', response?.error);
                  // Update the message to show it failed
                  const idx = this.messages.findIndex((m) => m.id === msg.id);
                  if (idx >= 0) {
                    this.messages[idx].content = `❌ ${msg.content} (failed to inject)`;
                    this.update();
                  }
                }
              }
            );
          }
        }
        break;
      case 'CHANNELS_UPDATE':
        this.channels = message.channels || [];
        this.update();
        break;
      case 'NOTIFICATION':
        this.addNotification(message.notification);
        break;
      case 'CHAT_DETECTED':
        this.chatElements = message.elements;
        this.update();
        break;
      case 'STREAMING_UPDATE':
        this.streamingState = message.state;
        this.update();
        break;
      case 'RESPONSE_COMPLETE':
        // AI response received - add to messages so it shows in chat
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
          // (prevents echoing back prefixed messages that were displayed on the page)
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

          // Deduplicate - check if we already have this response (within last 5 seconds)
          const recentDuplicate = this.messages.find(
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

            // NOTE: We do NOT broadcast to relay here anymore!
            // The background script's RESPONSE_COMPLETE handler already
            // forwards AI responses to the relay. Doing it here again
            // would cause duplicate messages.
          } else {
            console.log('[FuseConnect] Skipping duplicate response');
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
  private update(): void {
    if (!this.container) return;
    this.container.innerHTML = this.render();
    this.applyPositionAndSize();

    // Auto-scroll chat to show latest messages (scroll to bottom since newest are at bottom)
    const chatScroll = this.container.querySelector('#fuse-chat-scroll');
    if (chatScroll) {
      chatScroll.scrollTop = chatScroll.scrollHeight;
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
      this.state.mode = this.state.mode === 'hidden' ? 'collapsed' : this.state.mode;
      this.applyPositionAndSize();
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
   * Handle messages from background/popup
   */
  handleMessage(message: Record<string, unknown>): void {
    switch (message.type) {
      case 'CONNECTION_STATUS':
        this.connectionStatus = message.status as ConnectionStatus;
        this.update();
        break;

      case 'AGENTS_UPDATE':
        this.agents = (message.agents as Agent[]) || [];
        this.update();
        break;

      case 'CHANNELS_UPDATE':
        this.channels = (message.channels as FederationChannel[]) || [];
        this.update();
        break;

      case 'NEW_MESSAGE':
        const newMsg = message.message as AgentMessage;
        if (newMsg) {
          this.messages.push(newMsg);
          if (this.messages.length > 50) {
            this.messages.shift();
          }
          this.update();
        }
        break;

      case 'NOTIFICATION':
        const notif = message.notification as Notification;
        if (notif) {
          this.notifications.unshift(notif);
          if (!notif.read) {
            this.unreadCount++;
          }
          this.update();
        }
        break;

      case 'RESPONSE_COMPLETE':
        // Handled in handleChromeMessage - delegating there to avoid duplicates
        this.handleChromeMessage(message as any);
        break;
    }
  }

  /**
   * Destroy panel
   */
  destroy(): void {
    // Remove Chrome message listener to prevent memory leaks and duplicate handlers
    if (this.chromeMessageListener) {
      chrome.runtime.onMessage.removeListener(this.chromeMessageListener);
      this.chromeMessageListener = null;
    }

    // Clear health poll interval
    if (this.healthPollInterval) {
      clearInterval(this.healthPollInterval);
      this.healthPollInterval = null;
    }

    this.container?.remove();
    document.getElementById('fuse-connect-styles-v6')?.remove();
  }
}

export function createEnhancedFloatingPanel(options?: FloatingPanelOptions): EnhancedFloatingPanel {
  return new EnhancedFloatingPanel(options);
}
