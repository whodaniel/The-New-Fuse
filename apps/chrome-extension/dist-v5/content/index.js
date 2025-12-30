(() => {
  'use strict';
  const e = new (class {
    constructor() {
      ((this.lastResponseText = ''),
        (this.responseObserver = null),
        (this.callbacks = {}),
        (this.isWaitingForResponse = !1),
        (this.responseCheckInterval = null));
    }
    init(e) {
      ((this.callbacks = e), console.log('[SimpleChatBridge] Initialized'));
    }
    findElements() {
      const e = document.querySelector(
          'div.ql-editor.textarea, div[contenteditable="true"][role="textbox"], div[contenteditable="true"][data-placeholder]'
        ),
        t = document.querySelector(
          'button[aria-label*="Send" i], button[aria-label*="send" i], button[data-testid*="send" i], button.send-button'
        ),
        n = !(!e || !t);
      return (
        console.log('[SimpleChatBridge] Elements found:', {
          hasInput: !!e,
          hasSendButton: !!t,
          isReady: n,
        }),
        { input: e, sendButton: t, isReady: n }
      );
    }
    async sendMessage(e) {
      const { input: t, sendButton: n, isReady: s } = this.findElements();
      if (!s || !t || !n)
        return (
          console.error('[SimpleChatBridge] Chat elements not ready'),
          this.callbacks.onError?.('Chat elements not found'),
          !1
        );
      try {
        (t.focus(),
          await this.delay(100),
          'true' === t.getAttribute('contenteditable')
            ? ((t.innerHTML = ''),
              (t.textContent = e),
              t.dispatchEvent(
                new InputEvent('input', {
                  bubbles: !0,
                  cancelable: !0,
                  inputType: 'insertText',
                  data: e,
                })
              ))
            : ((t.value = e), t.dispatchEvent(new Event('input', { bubbles: !0 }))),
          await this.delay(200));
        const s = this.countModelResponses();
        return (
          console.log('[SimpleChatBridge] Responses before send:', s),
          n.click(),
          console.log('[SimpleChatBridge] Message sent:', e.substring(0, 50)),
          this.startWatchingForResponse(s),
          !0
        );
      } catch (e) {
        return (
          console.error('[SimpleChatBridge] Error sending message:', e),
          this.callbacks.onError?.(`Send failed: ${e}`),
          !1
        );
      }
    }
    countModelResponses() {
      return document.querySelectorAll('model-response').length;
    }
    getLatestResponse() {
      const e = document.querySelectorAll('model-response');
      if (0 === e.length) return null;
      const t = e[e.length - 1],
        n = t.querySelector('.markdown');
      if (!n) return (t.textContent || '').trim() || null;
      const s = n.cloneNode(!0);
      s.querySelectorAll('button, [role="button"], .chip, [class*="action"]').forEach((e) =>
        e.remove()
      );
      const a = (s.textContent || '').trim();
      return a.length > 0 ? a : null;
    }
    isStreaming() {
      const e = [
        'span[class*="cursor"][class*="blink"]',
        '[class*="thinking"]',
        '[class*="loading-spinner"]',
        '[class*="generating"]',
      ];
      for (const t of e) if (document.querySelector(t)) return !0;
      return !1;
    }
    startWatchingForResponse(e) {
      this.isWaitingForResponse = !0;
      let t = 0,
        n = '';
      ((this.responseCheckInterval = window.setInterval(() => {
        if (this.countModelResponses() > e) {
          const e = this.getLatestResponse(),
            s = this.isStreaming();
          (console.log('[SimpleChatBridge] Checking response...', {
            newContent: !!e,
            streaming: s,
            contentLength: e?.length || 0,
          }),
            e &&
              (e !== n || s
                ? ((t = 0), (n = e))
                : (t++,
                  t >= 2 &&
                    (this.stopWatching(),
                    e !== this.lastResponseText &&
                      ((this.lastResponseText = e),
                      console.log('[SimpleChatBridge] Response complete!', e.substring(0, 100)),
                      this.callbacks.onResponse?.(e))))));
        }
      }, 1e3)),
        setTimeout(() => {
          this.isWaitingForResponse &&
            (console.warn('[SimpleChatBridge] Response timeout'),
            this.stopWatching(),
            this.callbacks.onError?.('Response timeout'));
        }, 6e4));
    }
    stopWatching() {
      ((this.isWaitingForResponse = !1),
        this.responseCheckInterval &&
          (clearInterval(this.responseCheckInterval), (this.responseCheckInterval = null)));
    }
    getLastResponse() {
      return this.getLatestResponse();
    }
    destroy() {
      (this.stopWatching(),
        this.responseObserver &&
          (this.responseObserver.disconnect(), (this.responseObserver = null)));
    }
    delay(e) {
      return new Promise((t) => setTimeout(t, e));
    }
  })();
  try {
    const e = customElements.define;
    customElements.define.__isSafeGuarded ||
      ((customElements.define = function (t, n, s) {
        if (!customElements.get(t))
          try {
            e.call(this, t, n, s);
          } catch (e) {
            if (e.message && e.message.includes('already been defined'))
              return void console.warn(`[FuseConnect Guard] Collision caught for '${t}'.`);
            throw e;
          }
      }),
      (customElements.define.__isSafeGuarded = !0),
      console.log('[FuseConnect] Custom Element Guard activated'));
  } catch (e) {
    console.error('[FuseConnect] Failed to activate Custom Element Guard', e);
  }
  class t {
    constructor(e = {}) {
      ((this.container = null),
        (this.dragState = { isDragging: !1, startX: 0, startY: 0, startPosX: 0, startPosY: 0 }),
        (this.resizeState = {
          isResizing: !1,
          startX: 0,
          startY: 0,
          startWidth: 0,
          startHeight: 0,
          edge: '',
        }),
        (this.connectionStatus = 'disconnected'),
        (this.chatElements = null),
        (this.streamingState = null),
        (this.agents = []),
        (this.channels = []),
        (this.currentChannel = null),
        (this.messages = []),
        (this.notifications = []),
        (this.unreadCount = 0),
        (this.recentBroadcasts = new Map()),
        (this.serviceStatuses = new Map([
          ['relay', 'unknown'],
          ['api', 'unknown'],
          ['frontend', 'unknown'],
        ])),
        (this.healthPollInterval = null),
        (this.chromeMessageListener = null),
        (this.isContextValid = !0),
        (this.cleanupInterval = null),
        (this.CLEANUP_INTERVAL_MS = 3e4),
        (this.BROADCAST_DEDUP_WINDOW_MS = 1e4),
        (this.hostName = window.location.hostname.replace(/\./g, '-')),
        (this.panelId = `${this.hostName}-${Math.random().toString(36).substring(2, 8)}`),
        (this.state = {
          mode: e.mode || 'collapsed',
          position: e.position || { x: 20, y: 20 },
          size: e.size || { width: 360, height: 480 },
          activeTab: 'chat',
          isDragging: !1,
          isResizing: !1,
          isPinned: !1,
          opacity: 1,
        }),
        console.log(`[FuseConnect] Panel initialized with ID: ${this.panelId}`),
        this.loadState(),
        this.inject(),
        this.setupListeners(),
        this.requestConnectionState(),
        this.startCleanupInterval());
    }
    startCleanupInterval() {
      this.cleanupInterval = setInterval(() => {
        const e = Date.now();
        for (const [t, n] of this.recentBroadcasts.entries())
          e - n > this.BROADCAST_DEDUP_WINDOW_MS && this.recentBroadcasts.delete(t);
        (this.messages.length > 100 && (this.messages = this.messages.slice(-50)),
          this.notifications.length > 50 && (this.notifications = this.notifications.slice(-25)));
      }, this.CLEANUP_INTERVAL_MS);
    }
    requestConnectionState() {
      chrome.runtime.sendMessage({ type: 'GET_STATE' }, (e) => {
        e &&
          (console.log('[FuseConnect] Received state from background:', e),
          (this.connectionStatus = e.connectionStatus || 'disconnected'),
          (this.agents = e.agents || []),
          (this.channels = e.channels || []),
          chrome.storage.local.get(['fuse_current_channel'], (e) => {
            (e.fuse_current_channel && (this.currentChannel = e.fuse_current_channel),
              this.update());
          }));
      });
    }
    async loadState() {
      try {
        const e = await chrome.storage.local.get(['fuse_panel_state']);
        e.fuse_panel_state && (this.state = { ...this.state, ...e.fuse_panel_state });
      } catch (e) {}
    }
    async saveState() {
      try {
        await chrome.storage.local.set({ fuse_panel_state: this.state });
      } catch (e) {}
    }
    inject() {
      (document.getElementById('fuse-connect-panel-v6')?.remove(),
        (this.container = document.createElement('div')),
        (this.container.id = 'fuse-connect-panel-v6'),
        (this.container.innerHTML = this.render()),
        this.injectStyles(),
        document.body.appendChild(this.container),
        this.applyPositionAndSize());
    }
    injectStyles() {
      if (document.getElementById('fuse-connect-styles-v6')) return;
      const e = document.createElement('style');
      ((e.id = 'fuse-connect-styles-v6'),
        (e.textContent = this.getStyles()),
        document.head.appendChild(e));
    }
    getStyles() {
      return "\n      /* Fuse Connect v6 - Enhanced Panel Styles */\n\n      #fuse-connect-panel-v6 {\n        position: fixed !important;\n        z-index: 2147483647 !important;\n        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;\n        font-size: 13px !important;\n        line-height: 1.4 !important;\n        color: #fff !important;\n        pointer-events: auto !important;\n        user-select: none !important;\n      }\n\n      #fuse-connect-panel-v6 * {\n        box-sizing: border-box !important;\n      }\n\n      .fcp6-panel {\n        width: 100%;\n        height: 100%;\n        background: linear-gradient(135deg, rgba(10,10,15,0.98) 0%, rgba(18,18,26,0.98) 100%) !important;\n        border: 1px solid rgba(0,217,255,0.3) !important;\n        border-radius: 16px !important;\n        box-shadow:\n          0 0 40px rgba(0,217,255,0.2),\n          0 20px 60px rgba(0,0,0,0.6),\n          inset 0 1px 0 rgba(255,255,255,0.1) !important;\n        backdrop-filter: blur(20px) !important;\n        overflow: hidden !important;\n        display: flex !important;\n        flex-direction: column !important;\n      }\n\n      .fcp6-panel.collapsed {\n        height: 48px !important;\n      }\n\n      .fcp6-panel.minimized {\n        width: 48px !important;\n        height: 48px !important;\n        border-radius: 50% !important;\n      }\n\n      /* Header */\n      .fcp6-header {\n        display: flex !important;\n        align-items: center !important;\n        justify-content: space-between !important;\n        padding: 10px 14px !important;\n        background: linear-gradient(90deg, rgba(0,217,255,0.15) 0%, rgba(157,78,221,0.15) 100%) !important;\n        border-bottom: 1px solid rgba(0,217,255,0.2) !important;\n        cursor: move !important;\n        min-height: 46px !important;\n      }\n\n      .fcp6-logo {\n        display: flex !important;\n        align-items: center !important;\n        gap: 8px !important;\n      }\n\n      .fcp6-icon {\n        width: 26px !important;\n        height: 26px !important;\n        background: linear-gradient(135deg, #00D9FF 0%, #9D4EDD 100%) !important;\n        border-radius: 6px !important;\n        display: flex !important;\n        align-items: center !important;\n        justify-content: center !important;\n        font-size: 14px !important;\n        box-shadow: 0 0 15px rgba(0,217,255,0.4) !important;\n      }\n\n      .fcp6-title {\n        font-size: 13px !important;\n        font-weight: 600 !important;\n        background: linear-gradient(90deg, #00D9FF, #9D4EDD) !important;\n        -webkit-background-clip: text !important;\n        -webkit-text-fill-color: transparent !important;\n        background-clip: text !important;\n      }\n\n      .fcp6-status-dot {\n        width: 8px !important;\n        height: 8px !important;\n        border-radius: 50% !important;\n        margin-left: 8px !important;\n      }\n\n      .fcp6-status-dot.connected { background: #00FF88 !important; box-shadow: 0 0 8px rgba(0,255,136,0.6) !important; }\n      .fcp6-status-dot.disconnected { background: #FF3366 !important; }\n      .fcp6-status-dot.connecting { background: #FFB800 !important; animation: fcp6-pulse 1s infinite !important; }\n\n      @keyframes fcp6-pulse {\n        0%, 100% { opacity: 1; }\n        50% { opacity: 0.4; }\n      }\n\n      .fcp6-controls {\n        display: flex !important;\n        gap: 4px !important;\n      }\n\n      .fcp6-btn {\n        width: 26px !important;\n        height: 26px !important;\n        border: none !important;\n        border-radius: 6px !important;\n        background: rgba(255,255,255,0.08) !important;\n        color: rgba(255,255,255,0.7) !important;\n        cursor: pointer !important;\n        display: flex !important;\n        align-items: center !important;\n        justify-content: center !important;\n        font-size: 12px !important;\n        transition: all 0.2s ease !important;\n      }\n\n      .fcp6-btn:hover {\n        background: rgba(0,217,255,0.3) !important;\n        color: #00D9FF !important;\n      }\n\n      .fcp6-badge {\n        position: absolute !important;\n        top: -4px !important;\n        right: -4px !important;\n        min-width: 16px !important;\n        height: 16px !important;\n        background: #FF006E !important;\n        border-radius: 8px !important;\n        font-size: 10px !important;\n        font-weight: 600 !important;\n        display: flex !important;\n        align-items: center !important;\n        justify-content: center !important;\n        padding: 0 4px !important;\n      }\n\n      /* Tabs */\n      .fcp6-tabs {\n        display: flex !important;\n        padding: 4px !important;\n        gap: 2px !important;\n        background: rgba(0,0,0,0.2) !important;\n        border-bottom: 1px solid rgba(255,255,255,0.05) !important;\n      }\n\n      .fcp6-tab {\n        flex: 1 !important;\n        padding: 8px 4px !important;\n        border: none !important;\n        border-radius: 6px !important;\n        background: transparent !important;\n        color: rgba(255,255,255,0.5) !important;\n        font-size: 11px !important;\n        font-weight: 500 !important;\n        cursor: pointer !important;\n        transition: all 0.2s ease !important;\n        display: flex !important;\n        flex-direction: column !important;\n        align-items: center !important;\n        gap: 2px !important;\n      }\n\n      .fcp6-tab:hover {\n        background: rgba(255,255,255,0.05) !important;\n        color: rgba(255,255,255,0.8) !important;\n      }\n\n      .fcp6-tab.active {\n        background: linear-gradient(135deg, rgba(0,217,255,0.2) 0%, rgba(157,78,221,0.2) 100%) !important;\n        color: #00D9FF !important;\n        border: 1px solid rgba(0,217,255,0.3) !important;\n      }\n\n      .fcp6-tab-icon {\n        font-size: 14px !important;\n      }\n\n      /* Content */\n      .fcp6-content {\n        flex: 1 !important;\n        overflow-y: auto !important;\n        padding: 12px !important;\n      }\n\n      .fcp6-content::-webkit-scrollbar {\n        width: 5px !important;\n      }\n\n      .fcp6-content::-webkit-scrollbar-thumb {\n        background: rgba(0,217,255,0.3) !important;\n        border-radius: 3px !important;\n      }\n\n      /* Input area */\n      .fcp6-input-area {\n        padding: 10px !important;\n        border-top: 1px solid rgba(255,255,255,0.05) !important;\n        background: rgba(0,0,0,0.2) !important;\n      }\n\n      .fcp6-input-row {\n        display: flex !important;\n        gap: 8px !important;\n      }\n\n      .fcp6-input {\n        flex: 1 !important;\n        padding: 10px 12px !important;\n        border: 1px solid rgba(0,217,255,0.2) !important;\n        border-radius: 8px !important;\n        background: rgba(0,0,0,0.3) !important;\n        color: #fff !important;\n        font-size: 13px !important;\n        outline: none !important;\n        resize: none !important;\n      }\n\n      .fcp6-input:focus {\n        border-color: #00D9FF !important;\n        box-shadow: 0 0 0 2px rgba(0,217,255,0.2) !important;\n      }\n\n      .fcp6-send-btn {\n        padding: 10px 16px !important;\n        border: none !important;\n        border-radius: 8px !important;\n        background: linear-gradient(135deg, #00D9FF 0%, #9D4EDD 100%) !important;\n        color: #fff !important;\n        font-weight: 600 !important;\n        cursor: pointer !important;\n        transition: all 0.2s ease !important;\n      }\n\n      .fcp6-send-btn:hover {\n        box-shadow: 0 0 20px rgba(0,217,255,0.5) !important;\n        transform: translateY(-1px) !important;\n      }\n\n      .fcp6-inject-btn {\n        padding: 10px !important;\n        border: none !important;\n        border-radius: 8px !important;\n        background: linear-gradient(135deg, #00FF88 0%, #00D9FF 100%) !important;\n        color: #fff !important;\n        font-size: 16px !important;\n        cursor: pointer !important;\n        transition: all 0.2s ease !important;\n      }\n\n      .fcp6-inject-btn:hover {\n        box-shadow: 0 0 20px rgba(0,255,136,0.5) !important;\n        transform: translateY(-1px) !important;\n      }\n\n      .fcp6-input-hint {\n        margin-top: 6px !important;\n        font-size: 10px !important;\n        color: rgba(255,255,255,0.5) !important;\n        display: flex !important;\n        align-items: center !important;\n        gap: 4px !important;\n      }\n\n      /* Chat card */\n      .fcp6-chat-card {\n        padding: 10px !important;\n        background: rgba(255,255,255,0.03) !important;\n        border-radius: 8px !important;\n        margin-bottom: 8px !important;\n        border: 1px solid rgba(255,255,255,0.05) !important;\n      }\n\n      .fcp6-chat-header {\n        display: flex !important;\n        justify-content: space-between !important;\n        margin-bottom: 4px !important;\n        font-size: 11px !important;\n      }\n\n      .fcp6-chat-from {\n        color: #00D9FF !important;\n        font-weight: 500 !important;\n      }\n\n      .fcp6-chat-time {\n        color: rgba(255,255,255,0.3) !important;\n      }\n\n      .fcp6-chat-content {\n        color: rgba(255,255,255,0.8) !important;\n        word-break: break-word !important;\n      }\n\n      /* Channel list */\n      .fcp6-channel {\n        display: flex !important;\n        align-items: center !important;\n        gap: 10px !important;\n        padding: 10px !important;\n        background: rgba(255,255,255,0.03) !important;\n        border-radius: 8px !important;\n        margin-bottom: 6px !important;\n        cursor: pointer !important;\n        transition: all 0.2s ease !important;\n      }\n\n      .fcp6-channel:hover, .fcp6-channel.active {\n        background: rgba(0,217,255,0.1) !important;\n        border: 1px solid rgba(0,217,255,0.3) !important;\n      }\n\n      .fcp6-channel-icon {\n        font-size: 18px !important;\n      }\n\n      .fcp6-channel-info {\n        flex: 1 !important;\n      }\n\n      .fcp6-channel-name {\n        font-weight: 500 !important;\n      }\n\n      .fcp6-channel-members {\n        font-size: 11px !important;\n        color: rgba(255,255,255,0.4) !important;\n      }\n\n      /* Agent card */\n      .fcp6-agent {\n        display: flex !important;\n        align-items: center !important;\n        gap: 10px !important;\n        padding: 10px !important;\n        background: rgba(255,255,255,0.03) !important;\n        border-radius: 8px !important;\n        margin-bottom: 6px !important;\n      }\n\n      .fcp6-agent-avatar {\n        width: 36px !important;\n        height: 36px !important;\n        border-radius: 8px !important;\n        background: linear-gradient(135deg, #9D4EDD 0%, #00D9FF 100%) !important;\n        display: flex !important;\n        align-items: center !important;\n        justify-content: center !important;\n        font-size: 16px !important;\n      }\n\n      .fcp6-agent-name {\n        font-weight: 500 !important;\n      }\n\n      .fcp6-agent-platform {\n        font-size: 11px !important;\n        color: rgba(255,255,255,0.4) !important;\n      }\n\n      /* Notification */\n      .fcp6-notification {\n        padding: 10px !important;\n        background: rgba(255,255,255,0.03) !important;\n        border-radius: 8px !important;\n        margin-bottom: 8px !important;\n        border-left: 3px solid #00D9FF !important;\n      }\n\n      .fcp6-notification.unread {\n        background: rgba(0,217,255,0.1) !important;\n      }\n\n      /* Detection status */\n      .fcp6-detection {\n        padding: 10px !important;\n        background: rgba(0,255,136,0.1) !important;\n        border: 1px solid rgba(0,255,136,0.3) !important;\n        border-radius: 8px !important;\n        margin-bottom: 12px !important;\n      }\n\n      .fcp6-detection.streaming {\n        border-color: #FFB800 !important;\n        background: rgba(255,184,0,0.1) !important;\n      }\n\n      /* Resize handles */\n      .fcp6-resize-handle {\n        position: absolute !important;\n        background: transparent !important;\n      }\n\n      .fcp6-resize-handle.left {\n        left: 0 !important;\n        top: 10% !important;\n        width: 6px !important;\n        height: 80% !important;\n        cursor: ew-resize !important;\n      }\n\n      .fcp6-resize-handle.bottom {\n        bottom: 0 !important;\n        left: 10% !important;\n        width: 80% !important;\n        height: 6px !important;\n        cursor: ns-resize !important;\n      }\n\n      .fcp6-resize-handle.corner {\n        left: 0 !important;\n        bottom: 0 !important;\n        width: 16px !important;\n        height: 16px !important;\n        cursor: nwse-resize !important;\n      }\n    ";
    }
    render() {
      const { mode: e, activeTab: t } = this.state,
        n = 'collapsed' === e;
      return 'minimized' === e
        ? this.renderMinimized()
        : `\n      <div class="fcp6-panel ${n ? 'collapsed' : ''}" id="fuse-connect-panel" data-testid="fuse-connect-panel" aria-label="Fuse Connect Panel">\n        ${this.renderHeader()}\n        ${n ? '' : `\n          ${this.renderTabs()}\n          <div class="fcp6-content" id="fuse-panel-content" data-testid="fuse-panel-content">\n            ${this.renderTabContent(t)}\n          </div>\n          ${'chat' === t ? this.renderInputArea() : ''}\n        `}\n        ${n ? '' : this.renderResizeHandles()}\n      </div>\n    `;
    }
    renderResizeHandles() {
      return '\n      <div class="fcp6-resize-handle left" data-resize="left"></div>\n      <div class="fcp6-resize-handle bottom" data-resize="bottom"></div>\n      <div class="fcp6-resize-handle corner" data-resize="corner"></div>\n    ';
    }
    startResize(e, t) {
      this.resizeState = {
        isResizing: !0,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: this.state.size.width,
        startHeight: this.state.size.height,
        edge: t,
      };
      let n = null;
      const s = (e) => {
          if (!this.resizeState.isResizing || !this.container) return;
          const s = e.clientX,
            a = e.clientY;
          n ||
            (n = requestAnimationFrame(() => {
              const e = this.resizeState.startX - s,
                i = a - this.resizeState.startY;
              if (t.includes('left') || 'corner' === t) {
                const t = Math.min(600, Math.max(300, this.resizeState.startWidth + e));
                ((this.state.size.width = t), (this.container.style.width = `${t}px`));
              }
              if (t.includes('bottom') || 'corner' === t) {
                const e = Math.min(800, Math.max(200, this.resizeState.startHeight + i));
                ((this.state.size.height = e), (this.container.style.height = `${e}px`));
              }
              n = null;
            }));
        },
        a = () => {
          ((this.resizeState.isResizing = !1),
            n && (cancelAnimationFrame(n), (n = null)),
            document.removeEventListener('mousemove', s),
            document.removeEventListener('mouseup', a),
            this.saveState());
        };
      (document.addEventListener('mousemove', s), document.addEventListener('mouseup', a));
    }
    renderMinimized() {
      return `\n      <div class="fcp6-panel minimized" id="fuse-panel-minimized" data-testid="fuse-panel-minimized" data-action="expand" aria-label="Expand Fuse Connect Panel">\n        <div class="fcp6-icon">⚡</div>\n        ${this.unreadCount > 0 ? `<span class="fcp6-badge">${this.unreadCount}</span>` : ''}\n      </div>\n    `;
    }
    renderHeader() {
      const e = this.panelId.split('-').pop() || this.panelId;
      return `\n      <div class="fcp6-header" data-drag-handle>\n        <div class="fcp6-logo">\n          <div class="fcp6-icon">⚡</div>\n          <span class="fcp6-title">FUSE CONNECT</span>\n          <span class="fcp6-status-dot ${this.connectionStatus}"></span>\n        </div>\n        <div class="fcp6-controls">\n          <span style="font-size: 9px; color: rgba(255,255,255,0.4); margin-right: 8px;" title="Panel ID: ${this.panelId}">\n            #${e}\n          </span>\n          <button class="fcp6-btn" id="fuse-btn-pin" data-testid="fuse-btn-pin" data-action="pin" title="Pin panel" aria-label="Pin panel">${this.state.isPinned ? '📌' : '📍'}</button>\n          <button class="fcp6-btn" id="fuse-btn-minimize" data-testid="fuse-btn-minimize" data-action="minimize" title="Minimize" aria-label="Minimize panel">−</button>\n          <button class="fcp6-btn" id="fuse-btn-toggle" data-testid="fuse-btn-toggle" data-action="toggle" title="${'collapsed' === this.state.mode ? 'Expand' : 'Collapse'}" aria-label="${'collapsed' === this.state.mode ? 'Expand panel' : 'Collapse panel'}">\n            ${'collapsed' === this.state.mode ? '▼' : '▲'}\n          </button>\n        </div>\n      </div>\n      ${'collapsed' !== this.state.mode ? this.renderChannelSelector() : ''}\n    `;
    }
    renderChannelSelector() {
      return (
        this.channels.find((e) => e.id === this.currentChannel),
        `\n      <div class="fcp6-channel-selector" style="\n        padding: 6px 12px;\n        background: rgba(0,0,0,0.3);\n        border-bottom: 1px solid rgba(255,255,255,0.1);\n        display: flex;\n        align-items: center;\n        gap: 8px;\n        font-size: 11px;\n      ">\n        <span style="color: rgba(255,255,255,0.5);">Sync to:</span>\n        <select id="fuse-channel-select" data-action="select-channel" style="\n          flex: 1;\n          padding: 4px 8px;\n          border-radius: 4px;\n          border: 1px solid rgba(255,255,255,0.2);\n          background: rgba(0,0,0,0.4);\n          color: white;\n          font-size: 11px;\n          cursor: pointer;\n        ">\n          <option value="" ${this.currentChannel ? '' : 'selected'}>-- None (local only) --</option>\n          ${this.channels.map((e) => `\n            <option value="${e.id}" ${this.currentChannel === e.id ? 'selected' : ''}>\n              ${e.isPrivate ? '🔒' : '#'} ${this.escapeHtml(e.name)}\n            </option>\n          `).join('')}\n        </select>\n        <span style="color: ${this.currentChannel ? '#0f8' : 'rgba(255,255,255,0.3)'}; font-size: 10px;">\n          ${this.currentChannel ? '● Syncing' : '○ Local'}\n        </span>\n      </div>\n    `
      );
    }
    renderTabs() {
      return `\n      <div class="fcp6-tabs">\n        ${[
        { id: 'chat', icon: '💬', label: 'Chat' },
        { id: 'agents', icon: '🤖', label: 'Agents' },
        { id: 'channels', icon: '📢', label: 'Channels' },
        { id: 'services', icon: '⚙️', label: 'Services' },
        { id: 'notifications', icon: '🔔', label: 'Alerts' },
        { id: 'settings', icon: '🔧', label: 'Settings' },
      ]
        .map(
          (e) =>
            `\n          <button class="fcp6-tab ${this.state.activeTab === e.id ? 'active' : ''}" data-tab="${e.id}">\n            <span class="fcp6-tab-icon">${e.icon}</span>\n            <span>${e.label}</span>\n            ${'notifications' === e.id && this.unreadCount > 0 ? `<span class="fcp6-badge">${this.unreadCount}</span>` : ''}\n          </button>\n        `
        )
        .join('')}\n      </div>\n    `;
    }
    renderTabContent(e) {
      switch (e) {
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
    renderChatTab() {
      let e = '';
      if (this.chatElements) {
        const t = this.streamingState?.isStreaming;
        e = `\n        <div class="fcp6-detection ${t ? 'streaming' : ''}">\n          <div style="display: flex; justify-content: space-between; align-items: center;">\n            <span>${t ? '🔄 AI is responding...' : '✅ Chat detected'}</span>\n            <span style="font-size: 11px; color: rgba(255,255,255,0.5);">\n              ${Math.round(100 * this.chatElements.confidence)}% confidence\n            </span>\n          </div>\n        </div>\n      `;
      }
      return `\n      ${e}\n      <div class="fcp6-chat-scroll" id="fuse-chat-scroll" style="flex: 1; overflow-y: auto; max-height: 300px; padding-right: 4px;">\n        ${
        this.messages.length > 0
          ? this.messages
              .slice(-50)
              .map(
                (e) =>
                  `\n          <div class="fcp6-chat-card" data-msg-id="${e.id}">\n            <div class="fcp6-chat-header">\n              <span class="fcp6-chat-from">${this.escapeHtml(e.from)}</span>\n              <span class="fcp6-chat-time">${this.formatTime(e.timestamp)}</span>\n            </div>\n            <div class="fcp6-chat-content" style="user-select: text; -webkit-user-select: text; cursor: text;">${this.escapeHtml(e.content)}</div>\n          </div>\n        `
              )
              .join('')
          : '<div class="fcp6-empty"><div class="fcp6-empty-icon">💬</div><p>No messages yet</p><p style="font-size: 11px; opacity: 0.6;">Send a message to start chatting</p></div>'
      }\n      </div>\n    `;
    }
    renderChannelsTab() {
      const e =
        '\n      <div class="fcp6-create-channel-form" style="margin-bottom: 12px; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 8px;">\n        <div style="font-size: 11px; color: rgba(255,255,255,0.6); margin-bottom: 6px;">Create New Channel</div>\n        <div style="display: flex; gap: 8px;">\n          <input type="text"\n            id="fuse-new-channel-name"\n            placeholder="Channel name..."\n            style="flex: 1; padding: 8px; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; background: rgba(0,0,0,0.3); color: white; font-size: 12px;"\n          />\n          <button class="fcp6-send-btn" data-action="submit-create-channel" style="padding: 8px 12px;">\n            Create\n          </button>\n        </div>\n      </div>\n    ';
      return 0 === this.channels.length
        ? `\n        ${e}\n        <div class="fcp6-empty">\n          <div class="fcp6-empty-icon">📢</div>\n          <p>No channels yet</p>\n          <p style="font-size: 11px; opacity: 0.6;">Create a channel to sync messages to relay</p>\n        </div>\n      `
        : `\n      ${e}\n      <div class="fcp6-section-title">Your Channels</div>\n      ${this.channels.map((e) => `\n        <div class="fcp6-channel ${this.currentChannel === e.id ? 'active' : ''}" data-channel="${e.id}" data-action="join-channel">\n          <span class="fcp6-channel-icon">${e.isPrivate ? '🔒' : '#'}</span>\n          <div class="fcp6-channel-info">\n            <div class="fcp6-channel-name">${this.escapeHtml(e.name)}</div>\n            <div class="fcp6-channel-members">${e.members.length} members</div>\n          </div>\n          ${this.currentChannel === e.id ? '<span style="color: #0f8;">✓ Active</span>' : ''}\n        </div>\n      `).join('')}\n    `;
    }
    renderAgentsTab() {
      return 0 === this.agents.length
        ? '\n        <div class="fcp6-empty">\n          <div class="fcp6-empty-icon">🤖</div>\n          <p>No agents connected</p>\n          <p style="font-size: 11px; margin-top: 4px;">Connect to the relay to see agents</p>\n        </div>\n      '
        : `\n      <div class="fcp6-section-title">Connected Agents (${this.agents.length})</div>\n      ${this.agents.map((e) => `\n        <div class="fcp6-agent" data-agent="${e.id}">\n          <div class="fcp6-agent-avatar">${this.getAgentIcon(e.platform)}</div>\n          <div style="flex: 1;">\n            <div class="fcp6-agent-name">${e.name}</div>\n            <div class="fcp6-agent-platform">${e.platform}</div>\n          </div>\n          <span class="fcp6-status-dot ${e.status}"></span>\n        </div>\n      `).join('')}\n    `;
    }
    renderNotificationsTab() {
      return 0 === this.notifications.length
        ? '\n        <div class="fcp6-empty">\n          <div class="fcp6-empty-icon">🔔</div>\n          <p>No notifications</p>\n        </div>\n      '
        : this.notifications
            .map(
              (e) =>
                `\n      <div class="fcp6-notification ${e.read ? '' : 'unread'}" data-notification="${e.id}">\n        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">\n          <strong>${e.title}</strong>\n          <span style="font-size: 10px; color: rgba(255,255,255,0.4);">${this.formatTime(e.timestamp)}</span>\n        </div>\n        <div style="font-size: 12px; color: rgba(255,255,255,0.7);">${e.message}</div>\n      </div>\n    `
            )
            .join('');
    }
    renderServicesTab() {
      return `\n      <div class="fcp6-services-header">\n        <h4 style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.6); text-transform: uppercase;">Service Management</h4>\n      </div>\n      ${[
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
          port: 3e3,
        },
      ]
        .map(
          (e) =>
            `\n        <div class="fcp6-service-card" data-service="${e.id}">\n          <div style="display: flex; align-items: center; gap: 10px;">\n            <span style="font-size: 20px;">${e.icon}</span>\n            <div style="flex: 1;">\n              <div style="font-weight: 600;">${e.name}</div>\n              <div style="font-size: 11px; color: rgba(255,255,255,0.5);">Port ${e.port}</div>\n            </div>\n            <span class="fcp6-status-dot ${e.status}"></span>\n          </div>\n          <div class="fcp6-service-actions">\n            <button class="fcp6-service-btn" data-action="start-service" data-service="${e.id}" title="Start">▶️</button>\n            <button class="fcp6-service-btn" data-action="stop-service" data-service="${e.id}" title="Stop">⏹️</button>\n            <button class="fcp6-service-btn" data-action="restart-service" data-service="${e.id}" title="Restart">🔄</button>\n          </div>\n        </div>\n      `
        )
        .join(
          ''
        )}\n      <div style="margin-top: 12px;">\n        <button class="fcp6-btn fcp6-btn-primary" data-action="start-all-services" style="width: 100%;">\n          🚀 Start All Services\n        </button>\n      </div>\n      <div style="margin-top: 8px;">\n        <button class="fcp6-btn fcp6-btn-secondary" data-action="open-terminal" style="width: 100%;">\n          💻 Open Terminal\n        </button>\n      </div>\n      <div style="margin-top: 8px;">\n        <button class="fcp6-btn fcp6-btn-secondary" data-action="check-health" style="width: 100%;">\n          🩺 Check Health\n        </button>\n      </div>\n    `;
    }
    renderSettingsTab() {
      return `\n      <div class="fcp6-settings-section">\n        <h4 style="margin: 0 0 10px 0; font-size: 12px; color: rgba(255,255,255,0.6); text-transform: uppercase;">Connection</h4>\n        <div class="fcp6-setting-row">\n          <label>Relay URL</label>\n          <input type="text" class="fcp6-setting-input" data-setting="relayUrl" value="ws://localhost:3001/ws" />\n        </div>\n        <div class="fcp6-setting-row">\n          <label>Auto-Reconnect</label>\n          <input type="checkbox" class="fcp6-setting-checkbox" data-setting="autoReconnect" checked />\n        </div>\n      </div>\n\n      <div class="fcp6-settings-section">\n        <h4 style="margin: 0 0 10px 0; font-size: 12px; color: rgba(255,255,255,0.6); text-transform: uppercase;">Panel</h4>\n        <div class="fcp6-setting-row">\n          <label>Opacity</label>\n          <input type="range" class="fcp6-setting-range" data-setting="opacity" min="0.5" max="1" step="0.1" value="${this.state.opacity}" />\n        </div>\n        <div class="fcp6-setting-row">\n          <label>Always on Top</label>\n          <input type="checkbox" class="fcp6-setting-checkbox" data-setting="alwaysOnTop" ${this.state.isPinned ? 'checked' : ''} />\n        </div>\n      </div>\n\n      <div class="fcp6-settings-section">\n        <h4 style="margin: 0 0 10px 0; font-size: 12px; color: rgba(255,255,255,0.6); text-transform: uppercase;">Debug</h4>\n        <div class="fcp6-setting-row">\n          <label>Debug Mode</label>\n          <input type="checkbox" class="fcp6-setting-checkbox" data-setting="debugMode" />\n        </div>\n        <div class="fcp6-setting-row">\n          <label>Show Element Refs</label>\n          <input type="checkbox" class="fcp6-setting-checkbox" data-setting="showRefs" />\n        </div>\n      </div>\n\n      <div style="margin-top: 12px;">\n        <button class="fcp6-btn fcp6-btn-secondary" data-action="save-settings" style="width: 100%;">\n          💾 Save Settings\n        </button>\n      </div>\n      <div style="margin-top: 8px;">\n        <button class="fcp6-btn fcp6-btn-danger" data-action="reset-settings" style="width: 100%;">\n          🗑️ Reset to Defaults\n        </button>\n      </div>\n    `;
    }
    renderInputArea() {
      const e = !!this.chatElements,
        t = 'connected' === this.connectionStatus;
      return `\n      <div class="fcp6-input-area" id="fuse-input-area" data-testid="fuse-input-area">\n        <div class="fcp6-input-row">\n          <textarea class="fcp6-input" id="fuse-message-input" data-testid="fuse-message-input" placeholder="${e ? 'Type message to send...' : 'No chat detected on this page'}" rows="1" data-input="message" aria-label="Message input" ${e ? '' : 'disabled'}></textarea>\n          <button class="fcp6-send-btn" id="fuse-btn-send" data-testid="fuse-btn-send" data-action="send-message" title="Send message" aria-label="Send message" ${e ? '' : 'disabled'}>\n            ${e ? '➤' : '⚠️'}\n          </button>\n        </div>\n        <div class="fcp6-input-hint">\n          ${e ? '<span style="color: rgba(0,255,136,0.7);">●</span> Chat detected ' + (t ? '• Will sync to relay' : '') : '<span style="color: rgba(255,100,100,0.7);">●</span> No chat interface detected on this page'}\n        </div>\n      </div>\n    `;
    }
    applyPositionAndSize() {
      this.container &&
        ((this.container.style.right = `${this.state.position.x}px`),
        (this.container.style.top = `${this.state.position.y}px`),
        (this.container.style.width = `${this.state.size.width}px`),
        (this.container.style.height =
          'collapsed' === this.state.mode ? '48px' : `${this.state.size.height}px`));
    }
    setupListeners() {
      this.container &&
        (this.container.addEventListener('click', (e) => {
          const t = e.target,
            n = t.closest('[data-action]')?.getAttribute('data-action');
          n && this.handleAction(n);
          const s = t.closest('[data-tab]')?.getAttribute('data-tab');
          s && this.switchTab(s);
          const a = t.closest('[data-channel]')?.getAttribute('data-channel');
          a && this.joinChannel(a);
        }),
        this.container.addEventListener('change', (e) => {
          const t = e.target;
          if ('fuse-channel-select' === t.id) {
            const e = t.value || null;
            this.selectChannel(e);
          }
        }),
        this.container.addEventListener('mousedown', (e) => {
          const t = e.target;
          t.closest('[data-drag-handle]') && !t.closest('[data-action]') && this.startDrag(e);
          const n = t.getAttribute('data-resize');
          n && this.startResize(e, n);
        }),
        this.container.addEventListener('keydown', (e) => {
          'message' !== e.target.getAttribute('data-input') ||
            'Enter' !== e.key ||
            e.shiftKey ||
            (e.preventDefault(), this.handleAction('send-message'));
        }),
        (this.chromeMessageListener = (e, t, n) => (
          this.handleChromeMessage(e),
          n({ received: !0 }),
          !0
        )),
        chrome.runtime.onMessage.addListener(this.chromeMessageListener));
    }
    startDrag(e) {
      if (this.state.isPinned) return;
      this.dragState = {
        isDragging: !0,
        startX: e.clientX,
        startY: e.clientY,
        startPosX: this.state.position.x,
        startPosY: this.state.position.y,
      };
      let t = null;
      const n = (e) => {
          if (!this.dragState.isDragging || !this.container) return;
          const n = e.clientX,
            s = e.clientY;
          t ||
            (t = requestAnimationFrame(() => {
              const e = this.dragState.startX - n,
                a = s - this.dragState.startY;
              ((this.state.position = {
                x: Math.max(0, this.dragState.startPosX + e),
                y: Math.max(0, this.dragState.startPosY + a),
              }),
                (this.container.style.right = `${this.state.position.x}px`),
                (this.container.style.top = `${this.state.position.y}px`),
                (t = null));
            }));
        },
        s = () => {
          ((this.dragState.isDragging = !1),
            t && (cancelAnimationFrame(t), (t = null)),
            document.removeEventListener('mousemove', n),
            document.removeEventListener('mouseup', s),
            this.saveState());
        };
      (document.addEventListener('mousemove', n), document.addEventListener('mouseup', s));
    }
    handleAction(e) {
      switch (e) {
        case 'toggle':
          ((this.state.mode = 'collapsed' === this.state.mode ? 'expanded' : 'collapsed'),
            this.update(),
            this.saveState());
          break;
        case 'minimize':
          ((this.state.mode = 'minimized'), this.update(), this.saveState());
          break;
        case 'expand':
          ((this.state.mode = 'expanded'), this.update(), this.saveState());
          break;
        case 'pin':
          ((this.state.isPinned = !this.state.isPinned), this.update());
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
        case 'start-service':
        case 'stop-service':
        case 'restart-service':
          this.handleServiceAction(e);
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
        case 'save-settings':
          this.saveSettings();
          break;
        case 'reset-settings':
          this.resetSettings();
      }
    }
    switchTab(e) {
      ((this.state.activeTab = e),
        'notifications' === e && this.markNotificationsRead(),
        this.update());
    }
    sendMessage() {
      const e = this.container?.querySelector('[data-input="message"]');
      if (!e || !e.value.trim()) return;
      const t = e.value.trim();
      ((e.value = ''),
        chrome.runtime.sendMessage({
          type: 'BROADCAST_MESSAGE',
          content: t,
          channel: this.currentChannel,
        }),
        this.messages.push({
          id: Date.now().toString(),
          from: 'You',
          to: 'relay',
          content: t,
          timestamp: Date.now(),
          type: 'text',
        }),
        this.update());
    }
    injectToPageChat() {
      const e = this.container?.querySelector('[data-input="message"]');
      if (!e || !e.value.trim()) return;
      const t = e.value.trim();
      ((e.value = ''),
        chrome.runtime.sendMessage({ type: 'INJECT_MESSAGE', content: t }, (e) => {
          e?.success
            ? (this.messages.push({
                id: Date.now().toString(),
                from: 'You (Fuse)',
                to: 'page',
                content: t,
                timestamp: Date.now(),
                type: 'text',
              }),
              this.update())
            : console.warn('[FuseConnect] Failed to inject message:', e?.error);
        }));
    }
    sendUnifiedMessage() {
      const e = this.container?.querySelector('[data-input="message"]');
      if (!e || !e.value.trim()) return;
      const t = e.value.trim();
      ((e.value = ''), console.log('[FuseConnect] Sending unified message:', t.substring(0, 50)));
      const n = `user-${Date.now()}`;
      if (
        (this.messages.push({
          id: n,
          from: 'You',
          to: 'AI',
          content: t,
          timestamp: Date.now(),
          type: 'text',
        }),
        this.update(),
        'connected' === this.connectionStatus && this.currentChannel)
      ) {
        const e = `user:${t}`,
          n = this.recentBroadcasts.get(e);
        if (!n || Date.now() - n > 3e3) {
          this.recentBroadcasts.set(e, Date.now());
          for (const [e, t] of this.recentBroadcasts.entries())
            Date.now() - t > 1e4 && this.recentBroadcasts.delete(e);
          chrome.runtime.sendMessage({
            type: 'BROADCAST_MESSAGE',
            content: `[User → AI] ${t}`,
            channel: this.currentChannel,
          });
        } else console.log('[FuseConnect] Skipping duplicate user message broadcast');
      }
      chrome.runtime.sendMessage({ type: 'INJECT_MESSAGE', content: t }, (e) => {
        if (!e?.success) {
          console.warn('[FuseConnect] Failed to inject message:', e?.error);
          const n = this.messages.find((e) => e.content === t);
          n && ((n.content = `❌ ${t} (failed to send)`), this.update());
        }
      });
    }
    joinChannel(e) {
      ((this.currentChannel = e),
        chrome.storage.local.set({ fuse_current_channel: e }),
        chrome.runtime.sendMessage({ type: 'CHANNEL_JOIN', channelId: e }),
        this.update());
    }
    selectChannel(e) {
      const t = this.currentChannel;
      ((this.currentChannel = e),
        console.log(`[FuseConnect] Panel ${this.panelId} switching channel: ${t} → ${e}`),
        chrome.storage.local.set({ fuse_current_channel: e }),
        e
          ? chrome.runtime.sendMessage({
              type: 'CHANNEL_JOIN',
              channelId: e,
              panelId: this.panelId,
            })
          : chrome.runtime.sendMessage({
              type: 'CHANNEL_LEAVE',
              channelId: t,
              panelId: this.panelId,
            }),
        this.update());
    }
    createChannel() {
      const e = prompt('Enter channel name:');
      e && chrome.runtime.sendMessage({ type: 'CHANNEL_CREATE', name: e });
    }
    submitCreateChannel() {
      const e = this.container?.querySelector('#fuse-new-channel-name');
      if (!e || !e.value.trim()) return void console.warn('[FuseConnect] No channel name entered');
      const t = e.value.trim();
      ((e.value = ''),
        console.log('[FuseConnect] Creating channel:', t),
        this.safeSendMessage({ type: 'CHANNEL_CREATE', name: t }, (e) => {
          (e?.success || e?.channelId) &&
            console.log('[FuseConnect] Channel created successfully:', e.channelId);
        }));
      const n = {
        id: `local-${Date.now()}`,
        name: t,
        members: [],
        isPrivate: !1,
        createdAt: Date.now(),
      };
      (this.channels.push(n), (this.currentChannel = n.id), this.update());
    }
    safeSendMessage(e, t) {
      if (!this.isContextValid)
        return (
          console.warn('[FuseConnect] Extension context is invalid, cannot send message'),
          void this.showContextInvalidatedWarning()
        );
      try {
        chrome.runtime.sendMessage(e, (e) => {
          if (chrome.runtime.lastError) {
            const e = chrome.runtime.lastError.message || '';
            if (
              e.includes('Extension context invalidated') ||
              e.includes('Receiving end does not exist')
            )
              return (
                console.error('[FuseConnect] Extension context invalidated:', e),
                (this.isContextValid = !1),
                void this.showContextInvalidatedWarning()
              );
            console.warn('[FuseConnect] Chrome runtime error:', e);
          }
          t && t(e);
        });
      } catch (e) {
        (console.error('[FuseConnect] Failed to send message:', e),
          (this.isContextValid = !1),
          this.showContextInvalidatedWarning());
      }
    }
    showContextInvalidatedWarning() {
      if (this.container?.querySelector('.fcp6-context-warning')) return;
      const e = document.createElement('div');
      ((e.className = 'fcp6-context-warning'),
        (e.innerHTML =
          '\n      <div style="\n        position: fixed;\n        top: 50%;\n        left: 50%;\n        transform: translate(-50%, -50%);\n        background: linear-gradient(135deg, rgba(255,50,50,0.95) 0%, rgba(180,30,30,0.95) 100%);\n        color: white;\n        padding: 24px 32px;\n        border-radius: 12px;\n        box-shadow: 0 8px 32px rgba(0,0,0,0.4);\n        z-index: 2147483647;\n        text-align: center;\n        font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif;\n        max-width: 400px;\n      ">\n        <div style="font-size: 32px; margin-bottom: 12px;">⚠️</div>\n        <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">Extension Reloaded</div>\n        <div style="font-size: 13px; opacity: 0.9; margin-bottom: 16px;">\n          The Fuse Connect extension was updated. Please refresh this page to continue using it.\n        </div>\n        <button onclick="location.reload()" style="\n          background: white;\n          color: #c00;\n          border: none;\n          padding: 10px 24px;\n          border-radius: 6px;\n          font-weight: 600;\n          cursor: pointer;\n          font-size: 14px;\n        ">Refresh Page</button>\n      </div>\n    '),
        document.body.appendChild(e));
    }
    handleServiceAction(e) {
      const t = this.container?.querySelector(`[data-action="${e}"]`),
        n = t?.getAttribute('data-service');
      if (!n) return;
      const s = e.replace('-service', '').toUpperCase();
      chrome.runtime.sendMessage({ type: 'SERVICE_CONTROL', action: s, serviceId: n }, (e) => {
        (e?.success &&
          this.addNotification({
            id: Date.now().toString(),
            title: 'Service ' + s.toLowerCase() + 'ed',
            message: `${n} service ${s.toLowerCase()}ed successfully`,
            type: 'success',
            priority: 'normal',
            timestamp: Date.now(),
            read: !1,
          }),
          this.update());
      });
    }
    startAllServices() {
      chrome.runtime.sendMessage({ type: 'SERVICE_CONTROL', action: 'START_ALL' }, (e) => {
        (e?.success &&
          this.addNotification({
            id: Date.now().toString(),
            title: 'All Services Started',
            message: 'All TNF services have been started',
            type: 'success',
            priority: 'normal',
            timestamp: Date.now(),
            read: !1,
          }),
          this.update());
      });
    }
    openTerminal() {
      chrome.runtime.sendMessage({ type: 'OPEN_TERMINAL', command: 'pnpm relay:start' });
    }
    checkServiceHealth() {
      (chrome.runtime.sendMessage({ type: 'CHECK_SERVICE_HEALTH' }, (e) => {
        if (e?.services) {
          for (const [t, n] of Object.entries(e.services)) this.serviceStatuses.set(t, n);
          this.update();
        }
      }),
        'connected' === this.connectionStatus
          ? this.serviceStatuses.set('relay', 'online')
          : this.serviceStatuses.set('relay', 'offline'),
        this.update());
    }
    saveSettings() {
      const e = this.container?.querySelector('[data-setting="relayUrl"]'),
        t = this.container?.querySelector('[data-setting="autoReconnect"]'),
        n = this.container?.querySelector('[data-setting="opacity"]'),
        s = this.container?.querySelector('[data-setting="alwaysOnTop"]'),
        a = this.container?.querySelector('[data-setting="debugMode"]'),
        i = {
          relayUrl: e?.value || 'ws://localhost:3001/ws',
          autoReconnect: t?.checked ?? !0,
          opacity: parseFloat(n?.value || '1'),
          alwaysOnTop: s?.checked ?? !1,
          debugMode: a?.checked ?? !1,
        };
      ((this.state.opacity = i.opacity),
        (this.state.isPinned = i.alwaysOnTop),
        this.container && (this.container.style.opacity = String(i.opacity)),
        chrome.storage.local.set({ fuse_settings: i }, () => {
          (this.addNotification({
            id: Date.now().toString(),
            title: 'Settings Saved',
            message: 'Your settings have been saved successfully',
            type: 'success',
            priority: 'normal',
            timestamp: Date.now(),
            read: !1,
          }),
            this.update());
        }),
        chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', settings: i }),
        this.saveState());
    }
    resetSettings() {
      if (!confirm('Are you sure you want to reset all settings to defaults?')) return;
      const e = {
        relayUrl: 'ws://localhost:3001/ws',
        autoReconnect: !0,
        opacity: 1,
        alwaysOnTop: !1,
        debugMode: !1,
      };
      ((this.state.opacity = 1),
        (this.state.isPinned = !1),
        this.container && (this.container.style.opacity = '1'),
        chrome.storage.local.set({ fuse_settings: e }, () => {
          (this.addNotification({
            id: Date.now().toString(),
            title: 'Settings Reset',
            message: 'All settings have been reset to defaults',
            type: 'info',
            priority: 'normal',
            timestamp: Date.now(),
            read: !1,
          }),
            this.update());
        }),
        chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', settings: e }));
    }
    markNotificationsRead() {
      (this.notifications.forEach((e) => (e.read = !0)), (this.unreadCount = 0), this.update());
    }
    handleChromeMessage(e) {
      switch (e.type) {
        case 'CONNECTION_STATUS':
          ((this.connectionStatus = e.status), this.update());
          break;
        case 'AGENTS_UPDATE':
          ((this.agents = e.agents || []), this.update());
          break;
        case 'NEW_MESSAGE':
          if (e.message) {
            const t = e.message,
              n =
                'You' === t.from || 'Browser Agent' === t.from || t.from?.includes('Browser Agent'),
              s = this.messages.some(
                (e) => e.content === t.content && Date.now() - e.timestamp < 5e3
              );
            if (n || s) {
              console.log('[FuseConnect] Skipping message echo/duplicate:', {
                from: t.from,
                isOwn: n,
                isDup: s,
              });
              break;
            }
            (this.messages.push(t),
              this.messages.length > 50 && this.messages.shift(),
              this.update());
            const a = t.from && !t.from.includes('You') && !t.from.includes('AI (Page)'),
              i =
                t.content?.startsWith('[AI Response]') ||
                t.content?.startsWith('[AI → User]') ||
                t.content?.startsWith('[User → AI]') ||
                t.from?.includes('Browser Agent') ||
                'ai-response' === t.messageType;
            (console.log('[FuseConnect] NEW_MESSAGE auto-inject check:', {
              from: t.from,
              isFromExternalAgent: a,
              isAIResponseEcho: i,
              hasContent: !!t.content,
              contentPreview: t.content?.substring(0, 50),
            }),
              a &&
                t.content &&
                !i &&
                (console.log(
                  '[FuseConnect] Auto-injecting external message into page chat:',
                  t.from
                ),
                chrome.runtime.sendMessage(
                  { type: 'INJECT_MESSAGE', content: t.content, autoForward: !0 },
                  (e) => {
                    if (e?.success)
                      console.log('[FuseConnect] External message injected successfully');
                    else {
                      console.warn('[FuseConnect] Failed to inject external message:', e?.error);
                      const n = this.messages.findIndex((e) => e.id === t.id);
                      n >= 0 &&
                        ((this.messages[n].content = `❌ ${t.content} (failed to inject)`),
                        this.update());
                    }
                  }
                )));
          }
          break;
        case 'CHANNELS_UPDATE':
          ((this.channels = e.channels || []), this.update());
          break;
        case 'NOTIFICATION':
          this.addNotification(e.notification);
          break;
        case 'CHAT_DETECTED':
          ((this.chatElements = e.elements), this.update());
          break;
        case 'STREAMING_UPDATE':
          ((this.streamingState = e.state), this.update());
          break;
        case 'RESPONSE_COMPLETE':
          if (
            (console.log('[FuseConnect] RESPONSE_COMPLETE received:', {
              hasContent: !!e.content,
              connectionStatus: this.connectionStatus,
              currentChannel: this.currentChannel,
            }),
            e.content)
          ) {
            let t =
              'string' == typeof e.content
                ? e.content
                : e.content?.substring(0, 500) || 'Response received';
            if (
              ((t = t
                .replace(/^\[User → AI\]\s*/g, '')
                .replace(/^\[AI → User\]\s*/g, '')
                .replace(/^\[AI Response\]\s*/g, '')
                .trim()),
              !t ||
                t.includes('[User → AI]') ||
                t.includes('[AI → User]') ||
                t.includes('[AI Response]'))
            ) {
              console.log('[FuseConnect] Skipping response with embedded prefixes');
              break;
            }
            this.messages.find(
              (e) => 'AI (Page)' === e.from && e.content === t && Date.now() - e.timestamp < 5e3
            )
              ? console.log('[FuseConnect] Skipping duplicate response')
              : (this.messages.push({
                  id: `ai-${Date.now()}`,
                  from: 'AI (Page)',
                  to: 'You',
                  content: t,
                  timestamp: Date.now(),
                  type: 'text',
                }),
                this.update());
          }
      }
    }
    addNotification(e) {
      (this.notifications.unshift(e),
        this.notifications.length > 50 && this.notifications.pop(),
        this.unreadCount++,
        this.update(),
        'granted' === Notification.permission &&
          new Notification(e.title, {
            body: e.message,
            icon: chrome.runtime.getURL('icons/icon48.png'),
          }));
    }
    update() {
      if (!this.container) return;
      ((this.container.innerHTML = this.render()), this.applyPositionAndSize());
      const e = this.container.querySelector('#fuse-chat-scroll');
      e && (e.scrollTop = e.scrollHeight);
    }
    formatTime(e) {
      return new Date(e).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    truncate(e, t) {
      return e.length > t ? e.slice(0, t) + '...' : e;
    }
    escapeHtml(e) {
      const t = document.createElement('div');
      return ((t.textContent = e), t.innerHTML);
    }
    getAgentIcon(e) {
      return (
        {
          'chrome-extension': '🌐',
          vscode: '🔷',
          antigravity: '🌌',
          'electron-desktop': '🖥️',
          'theia-ide': '💻',
          'api-gateway': '🚀',
          'backend-service': '⚙️',
          saas: '☁️',
        }[e] || '🤖'
      );
    }
    updateChatElements(e) {
      ((this.chatElements = e), this.update());
    }
    updateStreamingState(e) {
      ((this.streamingState = e), this.update());
    }
    show() {
      (this.container || this.inject(),
        this.container &&
          ((this.container.style.display = 'block'),
          (this.state.mode = 'hidden' === this.state.mode ? 'collapsed' : this.state.mode),
          this.applyPositionAndSize()));
    }
    hide() {
      this.container && (this.container.style.display = 'none');
    }
    isVisible() {
      return 'none' !== this.container?.style.display;
    }
    handleMessage(e) {
      switch (e.type) {
        case 'CONNECTION_STATUS':
          ((this.connectionStatus = e.status), this.update());
          break;
        case 'AGENTS_UPDATE':
          ((this.agents = e.agents || []), this.update());
          break;
        case 'CHANNELS_UPDATE':
          ((this.channels = e.channels || []), this.update());
          break;
        case 'NEW_MESSAGE':
          const t = e.message;
          t &&
            (this.messages.push(t),
            this.messages.length > 50 && this.messages.shift(),
            this.update());
          break;
        case 'NOTIFICATION':
          const n = e.notification;
          n && (this.notifications.unshift(n), n.read || this.unreadCount++, this.update());
          break;
        case 'RESPONSE_COMPLETE':
          this.handleChromeMessage(e);
      }
    }
    destroy() {
      (this.chromeMessageListener &&
        (chrome.runtime.onMessage.removeListener(this.chromeMessageListener),
        (this.chromeMessageListener = null)),
        this.healthPollInterval &&
          (clearInterval(this.healthPollInterval), (this.healthPollInterval = null)),
        this.container?.remove(),
        document.getElementById('fuse-connect-styles-v6')?.remove());
    }
  }
  const n = {
      a: 'link',
      button: 'button',
      input: 'textbox',
      select: 'combobox',
      textarea: 'textbox',
      h1: 'heading',
      h2: 'heading',
      h3: 'heading',
      h4: 'heading',
      h5: 'heading',
      h6: 'heading',
      img: 'image',
      nav: 'navigation',
      main: 'main',
      header: 'banner',
      footer: 'contentinfo',
      section: 'region',
      article: 'article',
      aside: 'complementary',
      form: 'form',
      table: 'table',
      ul: 'list',
      ol: 'list',
      li: 'listitem',
      label: 'label',
    },
    s = ['script', 'style', 'meta', 'link', 'title', 'noscript'],
    a = ['a', 'button', 'input', 'select', 'textarea', 'details', 'summary'],
    i = [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'nav',
      'main',
      'header',
      'footer',
      'section',
      'article',
      'aside',
    ],
    o = new (class {
      constructor() {
        ((this.elementMap = new Map()),
          (this.refCounter = 0),
          window.__fuseElementMap || (window.__fuseElementMap = new Map()),
          window.__fuseRefCounter || (window.__fuseRefCounter = 0),
          (this.elementMap = window.__fuseElementMap),
          (this.refCounter = window.__fuseRefCounter));
      }
      generateTree(e = {}) {
        const { filter: t = 'all', maxDepth: n = 15, refId: s } = e,
          a = [],
          i = [];
        try {
          if (s) {
            const e = this.elementMap.get(s);
            if (!e)
              return {
                tree: '',
                nodes: [],
                viewport: this.getViewport(),
                error: `Element with ref_id '${s}' not found. It may have been removed from the page.`,
              };
            const o = e.ref.deref();
            if (!o)
              return (
                this.elementMap.delete(s),
                {
                  tree: '',
                  nodes: [],
                  viewport: this.getViewport(),
                  error: `Element with ref_id '${s}' no longer exists in the DOM.`,
                }
              );
            this.processElement(o, 0, n, t, void 0 !== s, a, i);
          } else document.body && this.processElement(document.body, 0, n, t, !1, a, i);
          (this.cleanupRefs(), (window.__fuseRefCounter = this.refCounter));
          const e = a.join('\n');
          return e.length > 5e4
            ? {
                tree: '',
                nodes: [],
                viewport: this.getViewport(),
                error: `Output exceeds 50000 character limit (${e.length} characters). Try using a smaller depth or focusing on a specific element.`,
              }
            : { tree: e, nodes: i, viewport: this.getViewport() };
        } catch (e) {
          return {
            tree: '',
            nodes: [],
            viewport: this.getViewport(),
            error: `Error generating accessibility tree: ${e instanceof Error ? e.message : 'Unknown error'}`,
          };
        }
      }
      processElement(e, t, n, a, i, o, r) {
        if (t > n) return;
        if (!e || !e.tagName) return;
        const c = e.tagName.toLowerCase();
        if (s.includes(c)) return;
        const l = this.shouldIncludeElement(e, a, i);
        if (l) {
          const n = this.getRole(e),
            s = this.getLabel(e),
            a = this.getOrCreateRefId(e);
          let i = '  '.repeat(t) + n;
          (s && (i += ` "${s.replace(/\s+/g, ' ').substring(0, 100).replace(/"/g, '\\"')}"`),
            (i += ` [${a}]`));
          const c = this.getImportantAttributes(e);
          for (const [e, t] of Object.entries(c)) i += ` ${e}="${t}"`;
          (o.push(i), r.push({ role: n, label: s, refId: a, depth: t, attributes: c }));
        }
        if (e.children && t < n)
          for (let s = 0; s < e.children.length; s++) {
            const c = e.children[s];
            this.processElement(c, l ? t + 1 : t, n, a, i, o, r);
          }
      }
      shouldIncludeElement(e, t, n) {
        if ((e.tagName.toLowerCase(), 'all' !== t && !n)) {
          if ('true' === e.getAttribute('aria-hidden')) return !1;
          if (!this.isVisible(e)) return !1;
          if (!this.isInViewport(e)) return !1;
        }
        if ('interactive' === t) return this.isInteractive(e);
        if (this.isInteractive(e)) return !0;
        if (this.isLandmark(e)) return !0;
        if (this.getLabel(e).length > 0) return !0;
        const s = this.getRole(e);
        return 'generic' !== s && 'image' !== s;
      }
      getRole(e) {
        const t = e.getAttribute('role');
        if (t) return t;
        const s = e.tagName.toLowerCase(),
          a = e.getAttribute('type');
        return 'input' === s
          ? 'submit' === a || 'button' === a
            ? 'button'
            : 'checkbox' === a
              ? 'checkbox'
              : 'radio' === a
                ? 'radio'
                : 'file' === a
                  ? 'button'
                  : 'textbox'
          : n[s] || 'generic';
      }
      getLabel(e) {
        const t = e.tagName.toLowerCase();
        if ('select' === t) {
          const t = e,
            n = t.querySelector('option[selected]') || t.options[t.selectedIndex];
          if (n?.textContent?.trim()) return n.textContent.trim();
        }
        const n = e.getAttribute('aria-label');
        if (n?.trim()) return n.trim();
        const s = e.getAttribute('placeholder');
        if (s?.trim()) return s.trim();
        const a = e.getAttribute('title');
        if (a?.trim()) return a.trim();
        const i = e.getAttribute('alt');
        if (i?.trim()) return i.trim();
        if (e.id) {
          const t = document.querySelector(`label[for="${e.id}"]`);
          if (t?.textContent?.trim()) return t.textContent.trim();
        }
        if ('input' === t) {
          const t = e,
            n = e.getAttribute('type') || '',
            s = e.getAttribute('value');
          if ('submit' === n && s?.trim()) return s.trim();
          if (t.value && t.value.length < 50 && t.value.trim()) return t.value.trim();
        }
        if (['button', 'a', 'summary'].includes(t)) {
          let t = '';
          for (let n = 0; n < e.childNodes.length; n++) {
            const s = e.childNodes[n];
            s.nodeType === Node.TEXT_NODE && (t += s.textContent || '');
          }
          if (t.trim()) return t.trim();
        }
        if (t.match(/^h[1-6]$/)) {
          const t = e.textContent;
          if (t?.trim()) return t.trim().substring(0, 100);
        }
        let o = '';
        for (let t = 0; t < e.childNodes.length; t++) {
          const n = e.childNodes[t];
          n.nodeType === Node.TEXT_NODE && (o += n.textContent || '');
        }
        if (o.trim() && o.trim().length >= 3) {
          const e = o.trim();
          return e.length > 100 ? e.substring(0, 100) + '...' : e;
        }
        return '';
      }
      getOrCreateRefId(e) {
        for (const [t, n] of this.elementMap.entries()) if (n.ref.deref() === e) return t;
        const t = 'fuse_ref_' + ++this.refCounter;
        return (
          this.elementMap.set(t, {
            ref: new WeakRef(e),
            role: this.getRole(e),
            label: this.getLabel(e),
          }),
          t
        );
      }
      getElementByRefId(e) {
        const t = this.elementMap.get(e);
        if (!t) return null;
        return t.ref.deref() || (this.elementMap.delete(e), null);
      }
      getImportantAttributes(e) {
        const t = {},
          n = e.getAttribute('href');
        n && (t.href = n);
        const s = e.getAttribute('type');
        s && (t.type = s);
        const a = e.getAttribute('placeholder');
        return (
          a && (t.placeholder = a),
          e.hasAttribute('disabled') && (t.disabled = 'true'),
          e.checked && (t.checked = 'true'),
          t
        );
      }
      isVisible(e) {
        const t = window.getComputedStyle(e);
        return (
          'none' !== t.display &&
          'hidden' !== t.visibility &&
          '0' !== t.opacity &&
          e.offsetWidth > 0 &&
          e.offsetHeight > 0
        );
      }
      isInViewport(e) {
        const t = e.getBoundingClientRect();
        return (
          t.top < window.innerHeight && t.bottom > 0 && t.left < window.innerWidth && t.right > 0
        );
      }
      isInteractive(e) {
        const t = e.tagName.toLowerCase();
        return (
          !!a.includes(t) ||
          !!e.getAttribute('onclick') ||
          null !== e.getAttribute('tabindex') ||
          'button' === e.getAttribute('role') ||
          'link' === e.getAttribute('role') ||
          'true' === e.getAttribute('contenteditable')
        );
      }
      isLandmark(e) {
        const t = e.tagName.toLowerCase();
        return i.includes(t) || null !== e.getAttribute('role');
      }
      getViewport() {
        return { width: window.innerWidth, height: window.innerHeight };
      }
      cleanupRefs() {
        for (const [e, t] of this.elementMap.entries()) t.ref.deref() || this.elementMap.delete(e);
      }
      async clickElement(e) {
        const t = this.getElementByRefId(e);
        if (!t) return !1;
        try {
          return (t.focus(), t.click(), !0);
        } catch {
          return !1;
        }
      }
      async typeIntoElement(e, t, n = {}) {
        const s = this.getElementByRefId(e);
        if (!s) return !1;
        try {
          return (
            s.focus(),
            s instanceof HTMLInputElement || s instanceof HTMLTextAreaElement
              ? (n.clear && (s.value = ''),
                (s.value += t),
                s.dispatchEvent(new InputEvent('input', { bubbles: !0, data: t })),
                s.dispatchEvent(new Event('change', { bubbles: !0 })))
              : 'true' === s.getAttribute('contenteditable') &&
                (n.clear && (s.innerHTML = ''),
                (s.textContent = (s.textContent || '') + t),
                s.dispatchEvent(new InputEvent('input', { bubbles: !0 }))),
            !0
          );
        } catch {
          return !1;
        }
      }
    })(),
    r = new (class {
      constructor() {
        ((this.lastMousePosition = { x: 0, y: 0 }),
          (this.isMoving = !1),
          document.addEventListener('mousemove', (e) => {
            this.isMoving || (this.lastMousePosition = { x: e.clientX, y: e.clientY });
          }));
      }
      async randomDelay(e, t) {
        const n = this.randomBetween(e, t);
        await this.sleep(n);
      }
      async humanDelay(e = 500) {
        const t = 0.4 * e,
          n = this.gaussianRandom(e, t);
        await this.sleep(Math.max(50, n));
      }
      async microPause() {
        await this.randomDelay(100, 500);
      }
      async thinkingPause() {
        await this.randomDelay(500, 2e3);
      }
      async moveMouse(e, t) {
        const n = t?.duration ?? this.randomBetween(200, 500),
          s = t?.steps ?? Math.max(10, Math.floor(n / 16)),
          a = { ...this.lastMousePosition },
          i = this.generateBezierControlPoints(a, e);
        this.isMoving = !0;
        for (let t = 0; t <= s; t++) {
          const o = t / s,
            r = this.bezierPoint(o, a, i[0], i[1], e),
            c = this.randomBetween(-2, 2),
            l = { x: r.x + c, y: r.y + c };
          (this.dispatchMouseEvent('mousemove', l),
            (this.lastMousePosition = l),
            await this.sleep(n / s));
        }
        this.isMoving = !1;
      }
      async moveToElement(e) {
        const t = e.getBoundingClientRect(),
          n = t.left + this.randomBetween(0.2 * t.width, 0.8 * t.width),
          s = t.top + this.randomBetween(0.2 * t.height, 0.8 * t.height);
        await this.moveMouse({ x: n, y: s });
      }
      async humanClick(e, t = {}) {
        const {
          moveFirst: n = !0,
          prePauseMin: s = 50,
          prePauseMax: a = 150,
          postPauseMin: i = 50,
          postPauseMax: o = 200,
        } = t;
        n && (await this.moveToElement(e), await this.randomDelay(s, a));
        const r = e.getBoundingClientRect(),
          c = r.left + r.width / 2,
          l = r.top + r.height / 2;
        (this.dispatchMouseEvent('mousedown', { x: c, y: l }, e),
          await this.sleep(this.randomBetween(50, 120)),
          this.dispatchMouseEvent('mouseup', { x: c, y: l }, e),
          this.dispatchMouseEvent('click', { x: c, y: l }, e),
          await this.randomDelay(i, o));
      }
      async humanDoubleClick(e) {
        (await this.humanClick(e, { postPauseMin: 50, postPauseMax: 150 }),
          await this.humanClick(e, { moveFirst: !1 }),
          this.dispatchMouseEvent('dblclick', this.lastMousePosition, e));
      }
      async humanType(e, t, n = {}) {
        const {
          minDelay: s = 50,
          maxDelay: a = 150,
          typoChance: i = 0.02,
          correctTypos: o = !0,
          pauseOnPunctuation: r = !0,
        } = n;
        (e.focus(), await this.microPause());
        const c = ['.', ',', '!', '?', ';', ':'];
        for (let n = 0; n < t.length; n++) {
          const l = t[n];
          if (i > 0 && Math.random() < i && o) {
            const t = this.getNearbyKeys(l);
            if (t.length > 0) {
              const n = t[Math.floor(Math.random() * t.length)];
              (await this.typeCharacter(e, n),
                await this.randomDelay(100, 300),
                await this.typeBackspace(e),
                await this.randomDelay(50, 150));
            }
          }
          await this.typeCharacter(e, l);
          let d = this.randomBetween(s, a);
          (r && c.includes(l) && (d += this.randomBetween(100, 400)),
            Math.random() < 0.05 && (d += this.randomBetween(200, 600)),
            await this.sleep(d));
        }
      }
      async typeCharacter(e, t) {
        const n = t.charCodeAt(0);
        (e.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: t,
            code: `Key${t.toUpperCase()}`,
            keyCode: n,
            which: n,
            bubbles: !0,
            cancelable: !0,
          })
        ),
          e.dispatchEvent(
            new KeyboardEvent('keypress', {
              key: t,
              code: `Key${t.toUpperCase()}`,
              keyCode: n,
              which: n,
              bubbles: !0,
              cancelable: !0,
            })
          ),
          e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement
            ? ((e.value += t), e.dispatchEvent(new Event('input', { bubbles: !0 })))
            : 'true' === e.getAttribute('contenteditable') &&
              document.execCommand('insertText', !1, t),
          e.dispatchEvent(
            new KeyboardEvent('keyup', {
              key: t,
              code: `Key${t.toUpperCase()}`,
              keyCode: n,
              which: n,
              bubbles: !0,
              cancelable: !0,
            })
          ));
      }
      async typeBackspace(e) {
        (e.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Backspace',
            code: 'Backspace',
            keyCode: 8,
            which: 8,
            bubbles: !0,
            cancelable: !0,
          })
        ),
          e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement
            ? ((e.value = e.value.slice(0, -1)),
              e.dispatchEvent(new Event('input', { bubbles: !0 })))
            : 'true' === e.getAttribute('contenteditable') && document.execCommand('delete', !1),
          e.dispatchEvent(
            new KeyboardEvent('keyup', {
              key: 'Backspace',
              code: 'Backspace',
              keyCode: 8,
              which: 8,
              bubbles: !0,
              cancelable: !0,
            })
          ));
      }
      async humanScroll(e, t = {}) {
        const { duration: n = 800, easing: s = 'human', addNoise: a = !0 } = t,
          i = window.scrollY;
        let o;
        if ('number' == typeof e) o = e;
        else {
          const t = e.getBoundingClientRect();
          o = i + t.top - window.innerHeight / 3;
        }
        const r = o - i,
          c = performance.now();
        return new Promise((e) => {
          const t = () => {
            const o = performance.now() - c,
              l = Math.min(o / n, 1);
            let d;
            switch (s) {
              case 'linear':
                d = l;
                break;
              case 'easeInOut':
                d = this.easeInOutCubic(l);
                break;
              default:
                d = this.humanEasing(l);
            }
            let p = i + r * d;
            (a && l < 1 && (p += this.randomBetween(-3, 3)),
              window.scrollTo(0, p),
              l < 1 ? requestAnimationFrame(t) : setTimeout(e, this.randomBetween(100, 300)));
          };
          requestAnimationFrame(t);
        });
      }
      async readingScroll(e = 300, t = 1e3) {
        const n = document.documentElement.scrollHeight,
          s = window.innerHeight;
        let a = window.scrollY;
        for (; a + s < n; ) {
          const n = e + this.randomBetween(-50, 100);
          (await this.humanScroll(a + n),
            (a = window.scrollY),
            await this.randomDelay(0.5 * t, 1.5 * t));
        }
      }
      maskWebdriverProperty() {
        try {
          Object.defineProperty(navigator, 'webdriver', { get: () => {}, configurable: !0 });
        } catch (e) {
          console.warn('[HumanSimulator] Could not mask webdriver property:', e);
        }
      }
      getRandomUserAgent() {
        const e = [
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        ];
        return e[Math.floor(Math.random() * e.length)];
      }
      getRealisticBrowserProfile() {
        return {
          screenWidth: [1920, 1680, 1440, 1366, 1280][Math.floor(5 * Math.random())],
          screenHeight: [1080, 1050, 900, 768][Math.floor(4 * Math.random())],
          colorDepth: 24,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          platform: navigator.platform,
          doNotTrack: Math.random() > 0.5 ? '1' : null,
          hardwareConcurrency: [4, 8, 12, 16][Math.floor(4 * Math.random())],
        };
      }
      sleep(e) {
        return new Promise((t) => setTimeout(t, e));
      }
      randomBetween(e, t) {
        return Math.random() * (t - e) + e;
      }
      gaussianRandom(e, t) {
        const n = Math.random(),
          s = Math.random();
        return Math.sqrt(-2 * Math.log(n)) * Math.cos(2 * Math.PI * s) * t + e;
      }
      generateBezierControlPoints(e, t) {
        const n = t.x - e.x,
          s = t.y - e.y;
        return [
          {
            x: e.x + 0.3 * n + this.randomBetween(-30, 30),
            y: e.y + 0.1 * s + this.randomBetween(-30, 30),
          },
          {
            x: e.x + 0.7 * n + this.randomBetween(-30, 30),
            y: e.y + 0.9 * s + this.randomBetween(-30, 30),
          },
        ];
      }
      bezierPoint(e, t, n, s, a) {
        const i = e * e,
          o = i * e,
          r = 1 - e,
          c = r * r,
          l = c * r;
        return {
          x: l * t.x + 3 * c * e * n.x + 3 * r * i * s.x + o * a.x,
          y: l * t.y + 3 * c * e * n.y + 3 * r * i * s.y + o * a.y,
        };
      }
      dispatchMouseEvent(e, t, n) {
        const s = new MouseEvent(e, {
          bubbles: !0,
          cancelable: !0,
          clientX: t.x,
          clientY: t.y,
          view: window,
        });
        (n || document.elementFromPoint(t.x, t.y) || document.body).dispatchEvent(s);
      }
      easeInOutCubic(e) {
        return e < 0.5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2;
      }
      humanEasing(e) {
        return 1 - Math.pow(1 - e, 3);
      }
      getNearbyKeys(e) {
        return (
          {
            q: ['w', 'a'],
            w: ['q', 'e', 's'],
            e: ['w', 'r', 'd'],
            r: ['e', 't', 'f'],
            t: ['r', 'y', 'g'],
            y: ['t', 'u', 'h'],
            u: ['y', 'i', 'j'],
            i: ['u', 'o', 'k'],
            o: ['i', 'p', 'l'],
            p: ['o', 'l'],
            a: ['q', 's', 'z'],
            s: ['a', 'w', 'd', 'x'],
            d: ['s', 'e', 'f', 'c'],
            f: ['d', 'r', 'g', 'v'],
            g: ['f', 't', 'h', 'b'],
            h: ['g', 'y', 'j', 'n'],
            j: ['h', 'u', 'k', 'm'],
            k: ['j', 'i', 'l'],
            l: ['k', 'o', 'p'],
            z: ['a', 'x'],
            x: ['z', 's', 'c'],
            c: ['x', 'd', 'v'],
            v: ['c', 'f', 'b'],
            b: ['v', 'g', 'n'],
            n: ['b', 'h', 'm'],
            m: ['n', 'j'],
          }[e.toLowerCase()] || []
        );
      }
    })(),
    c = new (class {
      constructor() {
        ((this.lastDetection = null), (this.bypassAttempts = 0), (this.maxAttempts = 3));
      }
      detectCaptcha() {
        console.log('[CaptchaHandler] Scanning for CAPTCHA challenges...');
        const e = this.detectRecaptchaV2();
        if (e.detected) return ((this.lastDetection = e), e);
        const t = this.detectRecaptchaV3();
        if (t.detected) return ((this.lastDetection = t), t);
        const n = this.detectHCaptcha();
        if (n.detected) return ((this.lastDetection = n), n);
        const s = this.detectCloudflareTurnstile();
        if (s.detected) return ((this.lastDetection = s), s);
        const a = this.detectCloudflareChallenge();
        if (a.detected) return ((this.lastDetection = a), a);
        const i = this.detectGenericVerification();
        return i.detected
          ? ((this.lastDetection = i), i)
          : { detected: !1, type: null, element: null, iframe: null, confidence: 0 };
      }
      async attemptBypass() {
        const e = this.lastDetection || this.detectCaptcha();
        if (!e.detected)
          return {
            success: !0,
            type: null,
            message: 'No CAPTCHA detected',
            requiresManualIntervention: !1,
          };
        if (this.bypassAttempts >= this.maxAttempts)
          return {
            success: !1,
            type: e.type,
            message: 'Max bypass attempts reached',
            requiresManualIntervention: !0,
          };
        (this.bypassAttempts++,
          console.log(
            `[CaptchaHandler] Attempting bypass for ${e.type} (attempt ${this.bypassAttempts}/${this.maxAttempts})`
          ));
        try {
          switch (e.type) {
            case 'recaptcha-v2':
              return await this.bypassRecaptchaV2(e);
            case 'hcaptcha':
              return await this.bypassHCaptcha(e);
            case 'cloudflare-turnstile':
              return await this.bypassTurnstile(e);
            case 'cloudflare-challenge':
              return await this.handleCloudflareChallenge(e);
            case 'generic-checkbox':
              return await this.bypassGenericCheckbox(e);
            default:
              return {
                success: !1,
                type: e.type,
                message: 'Unknown CAPTCHA type - manual intervention required',
                requiresManualIntervention: !0,
              };
          }
        } catch (t) {
          return (
            console.error('[CaptchaHandler] Bypass error:', t),
            {
              success: !1,
              type: e.type,
              message: `Bypass failed: ${t}`,
              requiresManualIntervention: !0,
            }
          );
        }
      }
      async waitForCaptchaSolved(e = 6e4) {
        const t = Date.now();
        for (; Date.now() - t < e; ) {
          if (!this.detectCaptcha().detected)
            return (
              console.log('[CaptchaHandler] CAPTCHA solved or no longer detected'),
              this.resetState(),
              !0
            );
          if (this.checkSuccessIndicators())
            return (
              console.log('[CaptchaHandler] Success indicator detected'),
              this.resetState(),
              !0
            );
          await this.sleep(1e3);
        }
        return (console.log('[CaptchaHandler] Timeout waiting for CAPTCHA solution'), !1);
      }
      detectRecaptchaV2() {
        const e = document.querySelectorAll(
          'iframe[src*="recaptcha"], iframe[src*="google.com/recaptcha"]'
        );
        for (const t of e)
          if (t.src.includes('anchor') || t.src.includes('bframe'))
            return {
              detected: !0,
              type: 'recaptcha-v2',
              element: document.querySelector('.g-recaptcha, .recaptcha-checkbox'),
              iframe: t,
              confidence: 0.95,
            };
        return window.grecaptcha
          ? {
              detected: !0,
              type: 'recaptcha-v2',
              element: document.querySelector('.g-recaptcha'),
              iframe: null,
              confidence: 0.8,
            }
          : { detected: !1, type: null, element: null, iframe: null, confidence: 0 };
      }
      detectRecaptchaV3() {
        const e = document.querySelector('.grecaptcha-badge');
        return e
          ? { detected: !0, type: 'recaptcha-v3', element: e, iframe: null, confidence: 0.7 }
          : { detected: !1, type: null, element: null, iframe: null, confidence: 0 };
      }
      detectHCaptcha() {
        const e = document.querySelector('iframe[src*="hcaptcha"], iframe[src*="hcaptcha.com"]');
        return e
          ? {
              detected: !0,
              type: 'hcaptcha',
              element: document.querySelector('.h-captcha'),
              iframe: e,
              confidence: 0.95,
            }
          : window.hcaptcha
            ? {
                detected: !0,
                type: 'hcaptcha',
                element: document.querySelector('.h-captcha'),
                iframe: null,
                confidence: 0.8,
              }
            : { detected: !1, type: null, element: null, iframe: null, confidence: 0 };
      }
      detectCloudflareTurnstile() {
        const e = document.querySelector('iframe[src*="challenges.cloudflare.com/turnstile"]');
        if (e)
          return {
            detected: !0,
            type: 'cloudflare-turnstile',
            element: e.parentElement,
            iframe: e,
            confidence: 0.95,
          };
        const t = document.querySelector('.cf-turnstile');
        return t
          ? {
              detected: !0,
              type: 'cloudflare-turnstile',
              element: t,
              iframe: null,
              confidence: 0.85,
            }
          : { detected: !1, type: null, element: null, iframe: null, confidence: 0 };
      }
      detectCloudflareChallenge() {
        return [
          document.querySelector('#cf-challenge-running'),
          document.querySelector('.cf-browser-verification'),
          document.querySelector('[data-ray]'),
          document.title.includes('Just a moment'),
          document.title.includes('Checking your browser'),
        ].filter(Boolean).length >= 2
          ? {
              detected: !0,
              type: 'cloudflare-challenge',
              element: document.body,
              iframe: null,
              confidence: 0.9,
            }
          : { detected: !1, type: null, element: null, iframe: null, confidence: 0 };
      }
      detectGenericVerification() {
        const e = document.body.innerText.toLowerCase();
        if (
          [
            'verify you are human',
            "i'm not a robot",
            'prove you are not a robot',
            'human verification',
            'security check',
            'bot detection',
          ].find((t) => e.includes(t))
        ) {
          const e = Array.from(document.querySelectorAll('button, input[type="submit"]')).find(
              (e) =>
                e.textContent?.toLowerCase().includes('verify') ||
                e.textContent?.toLowerCase().includes('continue') ||
                e.textContent?.toLowerCase().includes('confirm')
            ),
            t = document.querySelectorAll('input[type="checkbox"]');
          return {
            detected: !0,
            type: 'generic-checkbox',
            element: e || t[0],
            iframe: null,
            confidence: 0.6,
          };
        }
        return { detected: !1, type: null, element: null, iframe: null, confidence: 0 };
      }
      async bypassRecaptchaV2(e) {
        console.log('[CaptchaHandler] Attempting reCAPTCHA v2 bypass...');
        const t = document.querySelector('.recaptcha-checkbox-border');
        if (
          t &&
          this.isElementVisible(t) &&
          (await r.thinkingPause(),
          await r.humanClick(t),
          await this.sleep(2e3),
          !this.detectRecaptchaV2().detected)
        )
          return {
            success: !0,
            type: 'recaptcha-v2',
            message: 'reCAPTCHA checkbox clicked successfully',
            requiresManualIntervention: !1,
          };
        const n = document.querySelector(
          'iframe[src*="bframe"], iframe[title*="recaptcha challenge"]'
        );
        return n && this.isElementVisible(n)
          ? {
              success: !1,
              type: 'recaptcha-v2',
              message: 'Image challenge detected - manual intervention required',
              requiresManualIntervention: !0,
            }
          : {
              success: !1,
              type: 'recaptcha-v2',
              message: 'Could not interact with reCAPTCHA',
              requiresManualIntervention: !0,
            };
      }
      async bypassHCaptcha(e) {
        console.log('[CaptchaHandler] Attempting hCaptcha bypass...');
        const t = document.querySelector('.hcaptcha-checkbox, #checkbox');
        return t &&
          this.isElementVisible(t) &&
          (await r.thinkingPause(),
          await r.humanClick(t),
          await this.sleep(2e3),
          !this.detectHCaptcha().detected)
          ? {
              success: !0,
              type: 'hcaptcha',
              message: 'hCaptcha checkbox clicked successfully',
              requiresManualIntervention: !1,
            }
          : {
              success: !1,
              type: 'hcaptcha',
              message: 'hCaptcha requires manual intervention',
              requiresManualIntervention: !0,
            };
      }
      async bypassTurnstile(e) {
        return (
          console.log('[CaptchaHandler] Attempting Cloudflare Turnstile bypass...'),
          await this.sleep(3e3),
          this.detectCloudflareTurnstile().detected
            ? (e.element && (await r.humanClick(e.element), await this.sleep(2e3)),
              {
                success: !1,
                type: 'cloudflare-turnstile',
                message: 'Turnstile requires manual intervention',
                requiresManualIntervention: !0,
              })
            : {
                success: !0,
                type: 'cloudflare-turnstile',
                message: 'Turnstile auto-solved',
                requiresManualIntervention: !1,
              }
        );
      }
      async handleCloudflareChallenge(e) {
        return (
          console.log('[CaptchaHandler] Cloudflare challenge page detected, waiting...'),
          await this.sleep(5e3),
          document.title.includes('Just a moment') ||
          document.querySelector('#cf-challenge-running')
            ? {
                success: !1,
                type: 'cloudflare-challenge',
                message: 'Cloudflare challenge requires patience or manual intervention',
                requiresManualIntervention: !0,
              }
            : {
                success: !0,
                type: 'cloudflare-challenge',
                message: 'Cloudflare challenge passed',
                requiresManualIntervention: !1,
              }
        );
      }
      async bypassGenericCheckbox(e) {
        return (
          console.log('[CaptchaHandler] Attempting generic verification bypass...'),
          e.element
            ? (await r.thinkingPause(),
              await r.humanClick(e.element),
              await this.sleep(1500),
              {
                success: !0,
                type: 'generic-checkbox',
                message: 'Clicked verification element',
                requiresManualIntervention: !1,
              })
            : {
                success: !1,
                type: 'generic-checkbox',
                message: 'No clickable verification element found',
                requiresManualIntervention: !0,
              }
        );
      }
      checkSuccessIndicators() {
        return [
          document.querySelector('.recaptcha-checkbox-checked'),
          document.querySelector('[data-success="true"]'),
          document.querySelector('.success-icon'),
        ].some((e) => null !== e);
      }
      isElementVisible(e) {
        const t = e.getBoundingClientRect(),
          n = window.getComputedStyle(e);
        return (
          t.width > 0 &&
          t.height > 0 &&
          'none' !== n.display &&
          'hidden' !== n.visibility &&
          '0' !== n.opacity
        );
      }
      sleep(e) {
        return new Promise((t) => setTimeout(t, e));
      }
      resetState() {
        ((this.bypassAttempts = 0), (this.lastDetection = null));
      }
    })();
  window.__FUSE_CONNECT_INITIALIZED__
    ? console.log('[FuseConnect v6] Content script already initialized, skipping duplicate')
    : ((window.__FUSE_CONNECT_INITIALIZED__ = !0),
      new (class {
        constructor() {
          ((this.panel = null),
            (this.isInitialized = !1),
            (this.panelVisible = !1),
            (this.chatReady = !1),
            this.init());
        }
        async init() {
          'loading' === document.readyState
            ? document.addEventListener('DOMContentLoaded', () => this.setup())
            : this.setup();
        }
        setup() {
          this.isInitialized ||
            ((this.isInitialized = !0),
            console.log('[FuseConnect v6] Content script initialized (panel hidden by default)'),
            e.init({
              onResponse: (e) => {
                (console.log('[FuseConnect v6] AI Response received, length:', e.length),
                  this.panel && this.panel.handleMessage({ type: 'RESPONSE_COMPLETE', content: e }),
                  chrome.runtime.sendMessage({
                    type: 'RESPONSE_COMPLETE',
                    content: e.length > 5e4 ? e.substring(0, 5e4) : e,
                  }));
              },
              onError: (e) => {
                console.error('[FuseConnect v6] Chat bridge error:', e);
              },
            }),
            this.startChatDetection(),
            setTimeout(() => {
              this.checkForCaptcha();
            }, 2e3),
            this.setupDebugUtils(),
            this.setupMessageHandlers(),
            this.setupKeyboardShortcuts(),
            chrome.runtime.sendMessage({
              type: 'CONTENT_SCRIPT_READY',
              url: window.location.href,
              hostname: window.location.hostname,
            }));
        }
        startChatDetection() {
          const t = () => {
            const t = e.findElements();
            t.isReady &&
              !this.chatReady &&
              ((this.chatReady = !0),
              console.log('[FuseConnect v6] Chat is ready!'),
              chrome.runtime.sendMessage({
                type: 'CHAT_DETECTED',
                elements: {
                  hasInput: !!t.input,
                  hasSendButton: !!t.sendButton,
                  confidence: 1,
                  isStreaming: !1,
                },
              }),
              this.panel &&
                this.panel.updateChatElements({
                  input: t.input,
                  sendButton: t.sendButton,
                  messageContainer: null,
                  lastMessage: null,
                  isStreaming: !1,
                  confidence: 1,
                }));
          };
          (t(), setInterval(t, 2e3));
        }
        setupDebugUtils() {
          ((window.__FUSE_DEBUG = {
            getLastResponse: () => {
              const t = e.getLastResponse();
              return (console.log('[FuseConnect Debug] Last response:', t), t);
            },
            sendTestMessage: (t) => {
              (console.log('[FuseConnect Debug] Sending test message:', t), e.sendMessage(t));
            },
            checkExtensionContext: () => {
              try {
                const e = !!chrome.runtime?.id;
                return (console.log('[FuseConnect Debug] Extension context valid:', e), e);
              } catch (e) {
                return (
                  console.error('[FuseConnect Debug] Extension context check failed:', e),
                  !1
                );
              }
            },
            findElements: () => {
              const t = e.findElements();
              return (console.log('[FuseConnect Debug] Found elements:', t), t);
            },
          }),
            console.log('[FuseConnect v6] Debug utils available at window.__FUSE_DEBUG'));
        }
        showPanel() {
          if (!this.panel) {
            this.panel = new t(undefined);
            const n = e.findElements();
            n.isReady &&
              this.panel.updateChatElements({
                input: n.input,
                sendButton: n.sendButton,
                messageContainer: null,
                lastMessage: null,
                isStreaming: !1,
                confidence: 1,
              });
          }
          (this.panel.show(),
            (this.panelVisible = !0),
            console.log('[FuseConnect v6] Panel shown'));
        }
        hidePanel() {
          this.panel &&
            (this.panel.hide(),
            (this.panelVisible = !1),
            console.log('[FuseConnect v6] Panel hidden'));
        }
        togglePanel() {
          this.panelVisible ? this.hidePanel() : this.showPanel();
        }
        setupMessageHandlers() {
          chrome.runtime.onMessage.addListener((t, n, s) => {
            switch (t.type) {
              case 'TOGGLE_PANEL':
                return (this.togglePanel(), s({ success: !0, visible: this.panelVisible }), !0);
              case 'SHOW_PANEL':
                return (this.showPanel(), s({ success: !0 }), !0);
              case 'HIDE_PANEL':
                return (this.hidePanel(), s({ success: !0 }), !0);
              case 'GET_PANEL_STATUS':
                return (s({ visible: this.panelVisible, exists: !!this.panel }), !0);
              case 'INJECT_MESSAGE':
                return (
                  this.injectMessage(t.content).then((e) => {
                    s({ success: e });
                  }),
                  !0
                );
              case 'GET_LAST_RESPONSE':
                const n = e.getLastResponse();
                return (s({ response: n }), !0);
              case 'GET_CHAT_STATUS':
                const a = e.findElements();
                return (
                  s({ detected: a.isReady, confidence: a.isReady ? 1 : 0, isStreaming: !1 }),
                  !0
                );
              case 'GET_ACCESSIBILITY_TREE':
                const i = o.generateTree({
                  filter: t.filter,
                  maxDepth: t.maxDepth,
                  refId: t.refId,
                });
                return (s(i), !0);
              case 'CLICK_ELEMENT':
                return (
                  o.clickElement(t.refId).then((e) => {
                    s({ success: e });
                  }),
                  !0
                );
              case 'TYPE_INTO_ELEMENT':
                return (
                  o.typeIntoElement(t.refId, t.text, { clear: t.clear }).then((e) => {
                    s({ success: e });
                  }),
                  !0
                );
              case 'GET_ELEMENT_BY_REF':
                const l = o.getElementByRefId(t.refId);
                return (
                  s({
                    found: !!l,
                    tagName: l?.tagName,
                    textContent: l?.textContent?.substring(0, 200),
                  }),
                  !0
                );
              case 'HUMAN_TYPE':
                const d = e.findElements(),
                  p = t.refId ? o.getElementByRefId(t.refId) : d.input;
                return (
                  p
                    ? r
                        .humanType(p, t.text, {
                          minDelay: t.minDelay || 50,
                          maxDelay: t.maxDelay || 150,
                          typoChance: t.typoChance || 0.02,
                        })
                        .then(() => s({ success: !0 }))
                    : s({ success: !1, error: 'No target element' }),
                  !0
                );
              case 'HUMAN_CLICK':
                const h = t.refId ? o.getElementByRefId(t.refId) : null;
                return (
                  h
                    ? r.humanClick(h).then(() => s({ success: !0 }))
                    : s({ success: !1, error: 'No target element' }),
                  !0
                );
              case 'HUMAN_SCROLL':
                return (
                  r.humanScroll(t.target || t.y || 500).then(() => {
                    s({ success: !0 });
                  }),
                  !0
                );
              case 'DETECT_CAPTCHA':
                const u = c.detectCaptcha();
                return (s(u), !0);
              case 'BYPASS_CAPTCHA':
                return (
                  c.attemptBypass().then((e) => {
                    s(e);
                  }),
                  !0
                );
              case 'WAIT_FOR_CAPTCHA':
                return (
                  c.waitForCaptchaSolved(t.timeout || 6e4).then((e) => {
                    s({ solved: e });
                  }),
                  !0
                );
              case 'CONNECTION_STATUS':
              case 'AGENTS_UPDATE':
              case 'CHANNELS_UPDATE':
              case 'NOTIFICATION':
                return (this.panel && this.panel.handleMessage(t), s({ success: !0 }), !0);
              case 'NEW_MESSAGE':
                if ((this.panel && this.panel.handleMessage(t), t.message)) {
                  const e = t.message,
                    n =
                      e.from &&
                      !e.from.includes('You') &&
                      !e.from.includes('AI (Page)') &&
                      !e.from.includes('Browser Agent'),
                    s =
                      e.content?.startsWith('[AI Response]') ||
                      e.content?.startsWith('[AI → User]') ||
                      e.content?.startsWith('[User → AI]') ||
                      'ai-response' === e.messageType;
                  (console.log('[FuseConnect v6] NEW_MESSAGE auto-inject check:', {
                    from: e.from,
                    isFromExternalAgent: n,
                    isAIResponseEcho: s,
                    hasContent: !!e.content,
                  }),
                    n &&
                      e.content &&
                      !s &&
                      (console.log(
                        '[FuseConnect v6] Auto-injecting external message from:',
                        e.from
                      ),
                      this.injectMessage(e.content).then((e) => {
                        e
                          ? console.log('[FuseConnect v6] External message injected successfully')
                          : console.warn('[FuseConnect v6] Failed to inject external message');
                      })));
                }
                return (s({ success: !0 }), !0);
            }
          });
        }
        setupKeyboardShortcuts() {
          document.addEventListener('keydown', (e) => {
            ((e.ctrlKey || e.metaKey) &&
              e.shiftKey &&
              'F' === e.key &&
              (e.preventDefault(), this.togglePanel()),
              (e.ctrlKey || e.metaKey) &&
                e.shiftKey &&
                'I' === e.key &&
                (e.preventDefault(),
                navigator.clipboard.readText().then((e) => {
                  e && this.injectMessage(e);
                })));
          });
        }
        async injectMessage(t) {
          console.log('[FuseConnect v6] Injecting message:', t.substring(0, 50));
          const n = await e.sendMessage(t);
          return (
            n
              ? console.log('[FuseConnect v6] Message sent successfully')
              : console.error('[FuseConnect v6] Message send failed'),
            n
          );
        }
        checkForCaptcha() {
          const e = c.detectCaptcha();
          e.detected &&
            (console.log(
              `[FuseConnect v6] CAPTCHA detected: ${e.type} (confidence: ${e.confidence})`
            ),
            chrome.runtime.sendMessage({
              type: 'CAPTCHA_DETECTED',
              captcha: { type: e.type, confidence: e.confidence, url: window.location.href },
            }));
        }
      })());
})();
//# sourceMappingURL=index.js.map
