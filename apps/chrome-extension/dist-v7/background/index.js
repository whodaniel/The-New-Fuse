(() => {
  'use strict';
  function e(e) {
    let t = 0;
    for (let s = 0; s < e.length; s++) ((t = (t << 5) - t + e.charCodeAt(s)), (t &= t));
    return t.toString(36);
  }
  const t = 'fuse_settings',
    s = 'fuse_agent_id',
    n = 'fuse_channels',
    a = 'fuse_joined_channels',
    o = 'fuse_auto_connect',
    c = 'ws://localhost:3000/ws';
  new (class {
    constructor() {
      ((this.connections = new Map()),
        (this.nodeStatus = new Map()),
        (this.primaryConnection = null),
        (this.agentId = ''),
        (this.agents = new Map()),
        (this.pageAgents = new Map()),
        (this.channels = new Map()),
        (this.joinedChannels = new Set()),
        (this.messageQueue = []),
        (this.autoConnect = !0),
        (this.connectionAttempts = 0),
        (this.maxInitialAttempts = 1),
        (this.recentMessageHashes = new Map()),
        (this.MESSAGE_DEDUP_WINDOW_MS = 1e4),
        (this.reconnectTimers = new Map()),
        (this.heartbeatTimer = null),
        (this.healthCheckTimer = null),
        (this.cleanupTimer = null),
        this.init());
    }
    async init() {
      (console.log('[FuseConnect v6] Background service initializing...'),
        (this.agentId = await this.getOrCreateAgentId()),
        await this.loadSavedState(),
        this.setupMessageHandlers(),
        this.setupCommands(),
        this.startHealthChecks(),
        this.startCleanupTimer(),
        this.autoConnect
          ? this.tryInitialConnection()
          : this.updateNodeStatus('relay', c, 'disconnected'),
        console.log('[FuseConnect v6] Background service ready'));
    }
    startCleanupTimer() {
      this.cleanupTimer = setInterval(() => {
        const e = Date.now();
        let t = 0;
        for (const [s, n] of this.recentMessageHashes.entries())
          e - n > this.MESSAGE_DEDUP_WINDOW_MS && (this.recentMessageHashes.delete(s), t++);
        t > 0 && console.log(`[FuseConnect v6] Cleaned up ${t} stale message hashes`);
      }, 3e4);
    }
    async tryInitialConnection() {
      (await this.checkRelayHealth())
        ? this.connectToNode('relay', c)
        : (console.log('[FuseConnect v6] Relay not available - attempting autonomous startup'),
          this.updateNodeStatus('relay', c, 'disconnected'),
          this.sendNativeMessage({ action: 'start', service: 'relay' }).then(() => {
            setTimeout(() => {
              ((this.connectionAttempts = 0),
                this.connectToNode('relay', c),
                this.sendNativeMessage({ action: 'start', service: 'monitor' }),
                this.sendNativeMessage({ action: 'start', service: 'masterClock' }));
            }, 3e3);
          }));
    }
    async checkRelayHealth() {
      try {
        const e = await fetch('http://localhost:3000/health', {
          method: 'GET',
          signal: AbortSignal.timeout(2e3),
        });
        return 'ok' === (await e.json()).status;
      } catch (e) {
        return !1;
      }
    }
    async getOrCreateAgentId() {
      let e = (await chrome.storage.local.get([s]))[s];
      return (
        e ||
          ((e = `browser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`),
          await chrome.storage.local.set({ [s]: e })),
        e
      );
    }
    async loadSavedState() {
      const e = await chrome.storage.local.get([n, a, 'fuse_known_nodes', o, t]);
      (e[n] &&
        e[n].forEach((e) => {
          this.channels.set(e.id, e);
        }),
        e[a] && (this.joinedChannels = new Set(e[a])),
        (this.autoConnect = e[o] ?? !0),
        void 0 !== e[t]?.autoReconnect && (this.autoConnect = e[t].autoReconnect));
    }
    connectToNode(e, t) {
      if (this.connections.has(e)) {
        const t = this.connections.get(e);
        if (t?.readyState === WebSocket.OPEN)
          return void console.log(`[FuseConnect v6] Already connected to ${e}`);
        (t?.close(), this.connections.delete(e));
      }
      (console.log(`[FuseConnect v6] Connecting to ${e} at ${t}...`),
        this.updateNodeStatus(e, t, 'connecting'));
      try {
        const s = new WebSocket(t);
        ((s.onopen = () => {
          (console.log(`[FuseConnect v6] Connected to ${e}`),
            this.connections.set(e, s),
            this.updateNodeStatus(e, t, 'connected'),
            (this.connectionAttempts = 0),
            this.primaryConnection || (this.primaryConnection = s),
            this.registerAgent(s),
            this.startHeartbeat(),
            this.sendNativeMessage({ action: 'start', service: 'monitor' }),
            this.sendNativeMessage({ action: 'start', service: 'masterClock' }),
            this.flushMessageQueue(),
            this.requestSync(s));
        }),
          (s.onmessage = (t) => {
            try {
              const s = JSON.parse(t.data);
              this.handleRelayMessage(s, e);
            } catch (e) {
              console.error('[FuseConnect v6] Failed to parse message:', e);
            }
          }),
          (s.onclose = () => {
            if (
              (console.log(`[FuseConnect v6] Disconnected from ${e}`),
              this.connections.delete(e),
              this.updateNodeStatus(e, t, 'disconnected'),
              this.primaryConnection === s)
            ) {
              this.primaryConnection = null;
              for (const [, e] of this.connections)
                if (e.readyState === WebSocket.OPEN) {
                  this.primaryConnection = e;
                  break;
                }
            }
            this.autoConnect && 0 === this.connectionAttempts && this.scheduleReconnect(e, t);
          }),
          (s.onerror = () => {
            (this.connectionAttempts++,
              this.updateNodeStatus(e, t, 'disconnected'),
              this.autoConnect && this.connectionAttempts < 3 && this.scheduleReconnect(e, t));
          }));
      } catch (s) {
        (console.log(`[FuseConnect v6] Unable to connect to ${e} - relay may not be running`),
          this.updateNodeStatus(e, t, 'disconnected'));
      }
    }
    updateNodeStatus(e, t, s) {
      const n = {
        id: e,
        type: e,
        url: t,
        status: s,
        lastConnected:
          'connected' === s ? Date.now() : this.nodeStatus.get(e)?.lastConnected || null,
        latency: null,
        features: this.getNodeFeatures(e),
      };
      (this.nodeStatus.set(e, n),
        this.broadcastToTabs({ type: 'CONNECTION_STATUS', status: s, node: n }));
    }
    getNodeFeatures(e) {
      return (
        {
          relay: ['websocket', 'agents', 'messages', 'channels'],
          'api-gateway': ['rest', 'auth', 'workflows'],
          backend: ['agents', 'persistence', 'workflows'],
          saas: ['cloud', 'auth', 'multi-tenant'],
          redis: ['pubsub', 'cache'],
          websocket: ['realtime'],
        }[e] || []
      );
    }
    scheduleReconnect(e, t) {
      const s = this.reconnectTimers.get(e);
      s && clearTimeout(s);
      const n = Math.min(5e3 * Math.pow(2, this.connectionAttempts), 3e4);
      console.log(`[FuseConnect v6] Will retry ${e} in ${n}ms...`);
      const a = setTimeout(() => {
        this.connectToNode(e, t);
      }, n);
      this.reconnectTimers.set(e, a);
    }
    registerAgent(e) {
      const t = {
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
      e.send(JSON.stringify(t));
    }
    requestSync(e) {
      (this.send({ type: 'AGENT_LIST' }, e), this.send({ type: 'CHANNEL_LIST' }, e));
    }
    send(e, t) {
      const s = t || this.primaryConnection;
      let n;
      ((n =
        'MESSAGE_SEND' === e.type
          ? {
              id: crypto.randomUUID(),
              type: 'MESSAGE_SEND',
              timestamp: Date.now(),
              source: this.agentId,
              channel: e.channel,
              payload: {
                messageId: e.messageId || crypto.randomUUID(),
                to: e.to,
                content: e.content,
                messageType: e.messageType || 'text',
                metadata: e.metadata || void 0,
              },
            }
          : {
              id: crypto.randomUUID(),
              type: e.type,
              timestamp: Date.now(),
              source: this.agentId,
              channel: e.channel,
              payload: e,
            }),
        s?.readyState === WebSocket.OPEN
          ? (s.send(JSON.stringify(n)),
            console.log('[FuseConnect v6] Sent to relay:', n.type, n.channel))
          : (this.messageQueue.push(n),
            console.log('[FuseConnect v6] Queued message (not connected):', n.type)));
    }
    flushMessageQueue() {
      for (
        ;
        this.messageQueue.length > 0 && this.primaryConnection?.readyState === WebSocket.OPEN;
      ) {
        const e = this.messageQueue.shift();
        e && this.primaryConnection.send(JSON.stringify(e));
      }
    }
    startHeartbeat() {
      this.heartbeatTimer ||
        (this.heartbeatTimer = setInterval(() => {
          this.send({ type: 'HEARTBEAT' });
        }, 3e4));
    }
    startHealthChecks() {
      this.healthCheckTimer = setInterval(() => {
        for (const [e, t] of this.nodeStatus) {
          const s = this.connections.get(e);
          s &&
            s.readyState !== WebSocket.OPEN &&
            'connected' === t.status &&
            this.updateNodeStatus(e, t.url, 'disconnected');
        }
      }, 1e4);
    }
    handleRelayMessage(e, t) {
      switch ((console.log(`[FuseConnect v6] Received from ${t}:`, e.type), e.type)) {
        case 'WELCOME':
          console.log('[FuseConnect v6] Welcome received');
          break;
        case 'AGENT_LIST':
          const t = e.payload.agents || [];
          (this.agents.clear(),
            t.forEach((e) => this.agents.set(e.id, e)),
            this.broadcastToTabs({
              type: 'AGENTS_UPDATE',
              agents: Array.from(this.agents.values()).concat(Array.from(this.pageAgents.values())),
            }));
          break;
        case 'AGENT_STATUS':
          const s = e.payload.agent;
          s &&
            (this.agents.set(s.id, s),
            this.broadcastToTabs({
              type: 'AGENTS_UPDATE',
              agents: Array.from(this.agents.values()).concat(Array.from(this.pageAgents.values())),
            }),
            'active' === s.status &&
              this.createNotification(
                'agent_joined',
                'Agent Connected',
                `${s.name} is now online`
              ));
          break;
        case 'CHANNEL_LIST':
          const n = e.payload.channels || [];
          (this.channels.clear(),
            n.forEach((e) => this.channels.set(e.id, e)),
            this.broadcastToTabs({ type: 'CHANNELS_UPDATE', channels: n }),
            this.saveChannels());
          break;
        case 'CHANNEL_MESSAGE':
        case 'MESSAGE_RECEIVE':
          const a = e.payload;
          this.handleAgentMessage(a);
          break;
        case 'MESSAGE_STREAM_START':
          this.broadcastToTabs({ type: 'STREAMING_START', messageId: e.payload.messageId });
          break;
        case 'MESSAGE_STREAM_CHUNK':
          this.broadcastToTabs({
            type: 'STREAMING_CHUNK',
            messageId: e.payload.messageId,
            chunk: e.payload.chunk,
          });
          break;
        case 'MESSAGE_STREAM_END':
          this.broadcastToTabs({ type: 'STREAMING_END', messageId: e.payload.messageId });
          break;
        case 'ERROR':
          (console.error('[FuseConnect v6] Relay error:', e.payload),
            this.createNotification('error', 'Error', e.payload.message || 'Unknown error'));
      }
    }
    handleAgentMessage(t) {
      const s = t.metadata?.senderId || t.senderId || null;
      if ((t.from === this.agentId || 'Browser Agent' === t.from) && ('broadcast' !== t.to || !s))
        return void console.log('[FuseConnect v6] Skipping own message echo from relay');
      const n = t.messageId
          ? `msg:${t.messageId}`
          : e(
              `${t.channel || ''}:${t.from}:${t.content}:${Math.floor(t.timestamp / 1e3)}:${s || ''}`
            ),
        a = Date.now();
      if (this.recentMessageHashes.has(n))
        console.log('[FuseConnect v6] Skipping duplicate message');
      else {
        this.recentMessageHashes.set(n, a);
        for (const [e, t] of this.recentMessageHashes.entries())
          a - t > this.MESSAGE_DEDUP_WINDOW_MS && this.recentMessageHashes.delete(e);
        const o = {
          ...t,
          messageId: t.messageId || t.id || null,
          metadata: { ...(t.metadata || {}), senderId: s || t.metadata?.senderId || null },
        };
        (this.broadcastToTabs({ type: 'NEW_MESSAGE', message: o, messageId: o.messageId || null }),
          (t.to !== this.agentId && 'broadcast' !== t.to) ||
            this.createNotification(
              'message',
              `Message from ${t.from}`,
              t.content.substring(0, 100)
            ),
          t.to === this.agentId && 'command' === t.type && this.executeCommand(t));
      }
    }
    async executeCommand(e) {
      const t = e.content;
      if (t.startsWith('/inject ')) {
        const e = t.slice(8);
        await this.injectMessageToActiveTab(e);
      } else if ('/get-response' === t) {
        const t = await this.getLastResponseFromActiveTab();
        this.send({
          type: 'MESSAGE_SEND',
          to: e.from,
          content: t || 'No response available',
          messageType: 'response',
        });
      } else if ('/get-status' === t) {
        const t = await this.getTabChatStatus();
        this.send({
          type: 'MESSAGE_SEND',
          to: e.from,
          content: JSON.stringify(t),
          messageType: 'response',
        });
      }
    }
    createNotification(e, t, s) {
      const n = {
        id: crypto.randomUUID(),
        type: e,
        title: t,
        message: s,
        priority: 'error' === e ? 'high' : 'normal',
        timestamp: Date.now(),
        read: !1,
      };
      this.broadcastToTabs({ type: 'NOTIFICATION', notification: n });
    }
    async injectMessageToActiveTab(e) {
      const t = await chrome.tabs.query({ active: !0, currentWindow: !0 });
      t[0]?.id && chrome.tabs.sendMessage(t[0].id, { type: 'INJECT_MESSAGE', content: e });
    }
    async getLastResponseFromActiveTab() {
      const e = await chrome.tabs.query({ active: !0, currentWindow: !0 });
      return e[0]?.id
        ? new Promise((t) => {
            chrome.tabs.sendMessage(e[0].id, { type: 'GET_LAST_RESPONSE' }, (e) => {
              t(e?.response || null);
            });
          })
        : null;
    }
    async getTabChatStatus() {
      const e = await chrome.tabs.query({ active: !0, currentWindow: !0 });
      return e[0]?.id
        ? new Promise((t) => {
            chrome.tabs.sendMessage(e[0].id, { type: 'GET_CHAT_STATUS' }, (e) => {
              t(e || {});
            });
          })
        : {};
    }
    async broadcastToTabs(e) {
      const t = await chrome.tabs.query({});
      for (const s of t)
        s.id &&
          chrome.tabs.sendMessage(s.id, e).catch((e) => {
            e.message &&
              !e.message.includes('Receiving end does not exist') &&
              console.warn(`[FuseConnect v6] Failed to broadcast to tab ${s.id}:`, e);
          });
    }
    async saveChannels() {
      await chrome.storage.local.set({
        [n]: Array.from(this.channels.values()),
        [a]: Array.from(this.joinedChannels),
      });
    }
    async sendNativeMessage(e) {
      return new Promise((t) => {
        try {
          chrome.runtime.sendNativeMessage('com.thenewfuse.native_host', e, (e) => {
            chrome.runtime.lastError ? t({ error: chrome.runtime.lastError.message }) : t(e || {});
          });
        } catch (e) {
          t({ error: 'Native messaging not available' });
        }
      });
    }
    setupMessageHandlers() {
      chrome.runtime.onMessage.addListener((t, s, n) => {
        switch (t.type) {
          case 'CONNECT':
            ((this.connectionAttempts = 0),
              this.connectToNode('relay', t.url || c),
              n({ success: !0 }));
            break;
          case 'DISCONNECT':
            (this.disconnectAll(), n({ success: !0 }));
            break;
          case 'GET_STATE':
            n({
              connectionStatus:
                this.primaryConnection?.readyState === WebSocket.OPEN
                  ? 'connected'
                  : 'disconnected',
              agents: Array.from(this.agents.values()).concat(Array.from(this.pageAgents.values())),
              channels: Array.from(this.channels.values()),
              joinedChannels: Array.from(this.joinedChannels),
              nodes: Object.fromEntries(this.nodeStatus),
              agentId: this.agentId,
              autoConnect: this.autoConnect,
            });
            break;
          case 'SET_AUTO_CONNECT':
            ((this.autoConnect = t.enabled),
              chrome.storage.local.set({ [o]: t.enabled }),
              n({ success: !0 }));
            break;
          case 'START_RELAY':
            return (
              this.sendNativeMessage({ action: 'start', service: 'relay' }).then((e) => {
                (n(e),
                  (!e.result?.success && e.error) ||
                    setTimeout(() => {
                      ((this.connectionAttempts = 0),
                        this.connectToNode('relay', c),
                        this.sendNativeMessage({ action: 'start', service: 'monitor' }),
                        this.sendNativeMessage({ action: 'start', service: 'masterClock' }));
                    }, 3e3));
              }),
              !0
            );
          case 'STOP_RELAY':
            return (
              this.sendNativeMessage({ action: 'stop', service: 'relay' }).then((e) => {
                (this.disconnectAll(), n(e));
              }),
              !0
            );
          case 'CHECK_RELAY_HEALTH':
            return (
              this.checkRelayHealth().then((e) => {
                n({ healthy: e });
              }),
              !0
            );
          case 'BROADCAST_MESSAGE':
            (this.send({
              type: 'MESSAGE_SEND',
              messageId: t.messageId || crypto.randomUUID(),
              to: 'broadcast',
              channel: t.channel,
              content: t.content,
              messageType: 'text',
              metadata: {
                ...(t.metadata || {}),
                senderId: t.senderId || t.metadata?.senderId || null,
                senderTabId: s.tab?.id || t.metadata?.senderTabId || null,
              },
            }),
              n({ success: !0 }));
            break;
          case 'SEND_TO_AGENT':
            (this.send({
              type: 'MESSAGE_SEND',
              to: t.agentId,
              content: t.content,
              messageType: t.messageType || 'text',
            }),
              n({ success: !0 }));
            break;
          case 'CHANNEL_CREATE':
            (this.send({
              type: 'CHANNEL_CREATE',
              name: t.name,
              description: t.description,
              isPrivate: t.isPrivate || !1,
            }),
              n({ success: !0 }));
            break;
          case 'CHANNEL_JOIN':
            (this.joinedChannels.add(t.channelId),
              this.send({ type: 'CHANNEL_JOIN', channelId: t.channelId }),
              this.saveChannels(),
              n({ success: !0 }));
            break;
          case 'CHANNEL_LEAVE':
            (this.joinedChannels.delete(t.channelId),
              this.send({ type: 'CHANNEL_LEAVE', channelId: t.channelId }),
              this.saveChannels(),
              n({ success: !0 }));
            break;
          case 'CHANNEL_PAUSE': {
            const e = t.channelId,
              s = !0 === t.paused;
            (this.send({ type: 'CHANNEL_PAUSE', channelId: e, paused: s }),
              chrome.storage.local.get(['fuse_paused_channels'], (t) => {
                const a = Array.isArray(t.fuse_paused_channels) ? t.fuse_paused_channels : [],
                  o = new Set(a);
                (s ? o.add(e) : o.delete(e),
                  chrome.storage.local.set({ fuse_paused_channels: Array.from(o) }),
                  this.broadcastToTabs({ type: 'CHANNEL_PAUSE_UPDATE', channelId: e, paused: s }),
                  n({ success: !0 }));
              }));
            return !0;
          }
          case 'CHANNEL_DELETE': {
            const e = t.channelId;
            (this.channels.delete(e),
              this.joinedChannels.delete(e),
              this.send({ type: 'CHANNEL_DELETE', channelId: e }),
              this.saveChannels(),
              chrome.storage.local.get(['fuse_paused_channels', 'fuse_current_channel'], (t) => {
                const s = Array.isArray(t.fuse_paused_channels) ? t.fuse_paused_channels : [],
                  a = s.filter((t) => t !== e),
                  o = t.fuse_current_channel === e ? null : t.fuse_current_channel;
                (chrome.storage.local.set({ fuse_paused_channels: a, fuse_current_channel: o }),
                  this.broadcastToTabs({
                    type: 'CHANNELS_UPDATE',
                    channels: Array.from(this.channels.values()),
                  }),
                  n({ success: !0 }));
              }));
            return !0;
          }
          case 'PAGE_AGENT_REGISTER': {
            const e = t.pageAgentId || `page-agent-${s.tab?.id || 'unknown'}`,
              a = {
                id: e,
                name: t.hostname ? `AI Chat (${t.hostname})` : 'Page Agent',
                platform: t.platform || 'browser-tab',
                status: 'active',
                tabId: t.tabId || s.tab?.id || null,
                url: t.url || null,
                metadata: {
                  source: 'content-script',
                  senderId: e,
                  senderTabId: t.tabId || s.tab?.id || null,
                  senderHost: t.hostname || null,
                  senderUrl: t.url || null,
                },
              };
            (this.pageAgents.set(e, a),
              this.broadcastToTabs({
                type: 'AGENTS_UPDATE',
                agents: Array.from(this.agents.values()).concat(
                  Array.from(this.pageAgents.values())
                ),
              }),
              n({ success: !0 }));
            break;
          }
          case 'CONTENT_SCRIPT_READY':
            if (s.tab?.id) {
              const e =
                this.primaryConnection?.readyState === WebSocket.OPEN
                  ? 'connected'
                  : 'disconnected';
              (chrome.tabs.sendMessage(s.tab.id, { type: 'CONNECTION_STATUS', status: e }),
                chrome.tabs.sendMessage(s.tab.id, {
                  type: 'AGENTS_UPDATE',
                  agents: Array.from(this.agents.values()).concat(
                    Array.from(this.pageAgents.values())
                  ),
                }),
                chrome.tabs.sendMessage(s.tab.id, {
                  type: 'CHANNELS_UPDATE',
                  channels: Array.from(this.channels.values()),
                }));
            }
            n({ success: !0, tabId: s.tab?.id || null });
            break;
          case 'TOGGLE_PANEL': {
            const e = s.tab?.id;
            e
              ? chrome.tabs.sendMessage(e, { type: 'TOGGLE_PANEL' })
              : chrome.tabs.query({ active: !0, currentWindow: !0 }).then((e) => {
                  e[0]?.id && chrome.tabs.sendMessage(e[0].id, { type: 'TOGGLE_PANEL' });
                });
            n({ success: !0 });
            break;
          }
          case 'REQUEST_SYNC':
            (this.primaryConnection && this.requestSync(this.primaryConnection),
              n({ success: !0 }));
            break;
          case 'INJECT_MESSAGE':
            return (
              this.injectMessageToActiveTab(t.content)
                .then(() => {
                  n({ success: !0 });
                })
                .catch((e) => {
                  (console.error('[FuseConnect v6] Error injecting message:', e),
                    n({ success: !1, error: e.message }));
                }),
              !0
            );
          case 'GET_LAST_RESPONSE':
            return (
              this.getLastResponseFromActiveTab().then((e) => {
                n({ response: e });
              }),
              !0
            );
          case 'ACTIVITY_EVENT': {
            const e = t.eventType || 'unknown',
              s = t.channel || null;
            (this.send({
              type: 'MESSAGE_SEND',
              messageId: t.messageId || crypto.randomUUID(),
              to: 'broadcast',
              channel: 'fuse-activity-log',
              content: `[ACTIVITY] ${e}`,
              messageType: 'event',
              metadata: {
                ...(t.metadata || {}),
                senderId: t.senderId || t.metadata?.senderId || null,
                eventType: e,
                activityChannel: s,
              },
            }),
              n({ success: !0 }));
            break;
          }
          case 'CHAT_DETECTED':
          case 'STREAMING_UPDATE':
            (this.broadcastToTabs(t), n({ success: !0 }));
            break;
          case 'RESPONSE_COMPLETE': {
            const a = t.senderId || t.metadata?.senderId || null,
              o = s.tab?.id || t.metadata?.senderTabId || null,
              i = {
                ...t,
                senderId: a,
                senderTabId: o,
                metadata: { ...(t.metadata || {}), senderId: a, senderTabId: o },
              };
            if (
              (this.broadcastToTabs(i),
              this.primaryConnection?.readyState === WebSocket.OPEN && t.content)
            ) {
              const s = t.messageId
                  ? `msg:${t.messageId}`
                  : e(`ai:${t.channel || ''}:${t.content.substring(0, 500)}:${a || ''}`),
                n = Date.now();
              this.recentMessageHashes.has(s)
                ? console.log('[FuseConnect v6] Skipping duplicate AI response broadcast')
                : (this.recentMessageHashes.set(s, n),
                  (() => {
                    const e = t.channel || t.metadata?.channel || null;
                    e &&
                      (this.send({
                        type: 'MESSAGE_SEND',
                        messageId: t.messageId || crypto.randomUUID(),
                        to: 'broadcast',
                        channel: e,
                        content: `[AI → User] ${t.content}`,
                        messageType: 'ai-response',
                        metadata: { ...(t.metadata || {}), senderId: a, senderTabId: o },
                      }),
                      console.log('[FuseConnect v6] AI response forwarded to relay', {
                        channel: e,
                        length: t.content.length,
                        senderId: a,
                        senderTabId: o,
                      }));
                  })());
            }
            n({ success: !0 });
          }
        }
        return !0;
      });
    }
    disconnectAll() {
      for (const [e, t] of this.connections) t.close();
      (this.connections.clear(), (this.primaryConnection = null));
      for (const e of this.reconnectTimers.values()) clearTimeout(e);
      (this.reconnectTimers.clear(),
        this.heartbeatTimer && (clearInterval(this.heartbeatTimer), (this.heartbeatTimer = null)),
        this.updateNodeStatus('relay', c, 'disconnected'));
    }
    setupCommands() {
      chrome.commands.onCommand.addListener((e) => {
        'toggle-panel' === e &&
          chrome.tabs.query({ active: !0, currentWindow: !0 }).then((e) => {
            e[0]?.id && chrome.tabs.sendMessage(e[0].id, { type: 'TOGGLE_PANEL' });
          });
      });
    }
  })();
})();
//# sourceMappingURL=index.js.map
