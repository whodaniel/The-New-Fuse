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
    o = 'fuse_tab_active_channels',
    i = 'fuse_auto_connect',
    c = 'fuse_auto_monitor',
    r = 'fuse_auto_master_clock',
    l = 'fuse_auto_wake_ping',
    h = 'ws://localhost:3000/ws';
  new (class {
    constructor() {
      ((this.connections = new Map()),
        (this.nodeStatus = new Map()),
        (this.primaryConnection = null),
        (this.agentId = ''),
        (this.agents = new Map()),
        (this.channels = new Map()),
        (this.joinedChannels = new Set()),
        (this.tabActiveChannels = new Map()),
        (this.messageQueue = []),
        (this.pendingPageAgents = []),
        (this.autoConnect = !0),
        (this.autoMonitor = !0),
        (this.autoMasterClock = !0),
        (this.autoWakePing = !0),
        (this.lastAutonomyStartAt = 0),
        (this.lastWakePingAt = new Map()),
        (this.channelLastActivityAt = new Map()),
        (this.connectionAttempts = 0),
        (this.maxInitialAttempts = 1),
        (this.recentMessageHashes = new Map()),
        (this.MESSAGE_DEDUP_WINDOW_MS = 1e4),
        (this.reconnectTimers = new Map()),
        (this.heartbeatTimer = null),
        (this.healthCheckTimer = null),
        (this.cleanupTimer = null),
        (this.stallWatchdogTimer = null),
        this.init());
    }
    async init() {
      (console.log('[FuseConnect v7] Background service initializing...'),
        this.setupMessageHandlers(),
        this.setupCommands(),
        this.setupTabLifecycleHandlers(),
        (this.agentId = await this.getOrCreateAgentId()),
        await this.loadSavedState(),
        this.startHealthChecks(),
        this.startCleanupTimer(),
        this.autoConnect
          ? this.tryInitialConnection()
          : this.updateNodeStatus('relay', h, 'disconnected'),
        console.log('[FuseConnect v7] Background service ready'));
    }
    startCleanupTimer() {
      this.cleanupTimer = setInterval(() => {
        const e = Date.now();
        let t = 0;
        for (const [s, n] of this.recentMessageHashes.entries())
          e - n > this.MESSAGE_DEDUP_WINDOW_MS && (this.recentMessageHashes.delete(s), t++);
        t > 0 && console.log(`[FuseConnect v7] Cleaned up ${t} stale message hashes`);
      }, 3e4);
    }
    async tryInitialConnection() {
      (await this.checkRelayHealth())
        ? this.connectToNode('relay', h)
        : (console.log('[FuseConnect v7] Relay not available - attempting autonomous startup'),
          this.updateNodeStatus('relay', h, 'disconnected'),
          this.sendNativeMessage({ action: 'start', service: 'relay' }).then(() => {
            setTimeout(() => {
              ((this.connectionAttempts = 0),
                this.connectToNode('relay', h),
                this.ensureAutonomousServices('relay_auto_bootstrap'));
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
      const e = await chrome.storage.local.get([n, a, o, 'fuse_known_nodes', i, c, r, l, t]);
      if (
        (e[n] &&
          e[n].forEach((e) => {
            this.channels.set(e.id, e);
          }),
        e[a] && (this.joinedChannels = new Set(e[a])),
        e[o])
      ) {
        const t = e[o];
        for (const [e, s] of Object.entries(t)) {
          const t = Number(e);
          Number.isFinite(t) && s && this.tabActiveChannels.set(t, s);
        }
      }
      (this.joinedChannels.add('red'),
        (this.autoConnect = e[i] ?? !0),
        (this.autoMonitor = e[c] ?? !0),
        (this.autoMasterClock = e[r] ?? !0),
        (this.autoWakePing = e[l] ?? !0),
        void 0 !== e[t]?.autoReconnect && (this.autoConnect = e[t].autoReconnect),
        void 0 !== e[t]?.autoMonitor && (this.autoMonitor = !!e[t].autoMonitor),
        void 0 !== e[t]?.autoMasterClock && (this.autoMasterClock = !!e[t].autoMasterClock),
        void 0 !== e[t]?.autoWakePing && (this.autoWakePing = !!e[t].autoWakePing));
    }
    connectToNode(e, t) {
      if (this.connections.has(e)) {
        const t = this.connections.get(e);
        if (t?.readyState === WebSocket.OPEN)
          return void console.log(`[FuseConnect v7] Already connected to ${e}`);
        (t?.close(), this.connections.delete(e));
      }
      (console.log(`[FuseConnect v7] Connecting to ${e} at ${t}...`),
        this.updateNodeStatus(e, t, 'connecting'));
      try {
        const s = new WebSocket(t);
        ((s.onopen = () => {
          (console.log(`[FuseConnect v7] Connected to ${e}`),
            this.connections.set(e, s),
            this.updateNodeStatus(e, t, 'connected'),
            (this.connectionAttempts = 0),
            this.primaryConnection || (this.primaryConnection = s),
            this.registerAgent(s),
            this.startHeartbeat(),
            this.ensureAutonomousServices('relay_connected'),
            this.flushMessageQueue(),
            this.flushPendingPageAgents(),
            this.reRegisterAllAgents(s),
            this.requestSync(s));
        }),
          (s.onmessage = (t) => {
            try {
              const s = JSON.parse(t.data);
              this.handleRelayMessage(s, e);
            } catch (e) {
              console.error('[FuseConnect v7] Failed to parse message:', e);
            }
          }),
          (s.onclose = () => {
            if (
              (console.log(`[FuseConnect v7] Disconnected from ${e}`),
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
            (this.autoConnect && 0 === this.connectionAttempts && this.scheduleReconnect(e, t),
              'relay' === e && this.stopStallWatchdog());
          }),
          (s.onerror = () => {
            (this.connectionAttempts++,
              this.updateNodeStatus(e, t, 'disconnected'),
              this.autoConnect && this.connectionAttempts < 3 && this.scheduleReconnect(e, t));
          }));
      } catch (s) {
        (console.log(`[FuseConnect v7] Unable to connect to ${e} - relay may not be running`),
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
      console.log(`[FuseConnect v7] Will retry ${e} in ${n}ms...`);
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
      e.send(JSON.stringify(t));
    }
    registerPageAgent(e, t, s, n) {
      const a = {
        id: e,
        name: t,
        platform: 'browser-page',
        status: 'active',
        capabilities: ['chat-injection', 'dom-reading'],
        channels: [],
        metadata: { node: { type: 'browser-tab', platform: s }, tabId: n },
        lastSeen: Date.now(),
      };
      if ((this.agents.set(e, a), this.primaryConnection?.readyState === WebSocket.OPEN)) {
        const s = {
          id: crypto.randomUUID(),
          type: 'AGENT_REGISTER',
          timestamp: Date.now(),
          source: this.agentId,
          payload: { agent: a },
        };
        (this.primaryConnection.send(JSON.stringify(s)),
          console.log(`[FuseConnect v7] Registered Page Agent: ${t} (${e})`));
        for (const t of this.joinedChannels) {
          const s = {
            id: crypto.randomUUID(),
            type: 'CHANNEL_JOIN',
            timestamp: Date.now(),
            source: e,
            payload: { channelId: t },
          };
          (this.primaryConnection.send(JSON.stringify(s)),
            console.log(`[FuseConnect v7] Auto-joined Page Agent ${e} to channel ${t}`),
            a.channels.push(t));
        }
      } else
        (console.log(`[FuseConnect v7] Queued Page Agent for later registration: ${t} (${e})`),
          this.pendingPageAgents.push(a));
      (this.broadcastToTabs({ type: 'AGENTS_UPDATE', agents: Array.from(this.agents.values()) }),
        this.frontloadPageAgentContext(a),
        this.sendActivityEvent('page_agent_registered', {
          pageAgentId: e,
          tabId: n || null,
          platform: s,
          channels: a.channels,
        }));
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
              channel: e.channel || 'general',
              payload: {
                to: e.to,
                content: e.content,
                messageType: e.messageType || 'text',
                metadata: e.metadata,
              },
            }
          : {
              id: crypto.randomUUID(),
              type: e.type,
              timestamp: Date.now(),
              source: this.agentId,
              channel: e.channel || 'general',
              payload: e,
            }),
        s?.readyState === WebSocket.OPEN
          ? (s.send(JSON.stringify(n)),
            console.log('[FuseConnect v7] Sent to relay:', n.type, n.channel))
          : (this.messageQueue.push(n),
            console.log('[FuseConnect v7] Queued message (not connected):', n.type)));
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
    flushPendingPageAgents() {
      if (this.primaryConnection?.readyState === WebSocket.OPEN)
        for (
          console.log(
            `[FuseConnect v7] Flushing ${this.pendingPageAgents.length} pending page agent registrations`
          );
          this.pendingPageAgents.length > 0;
        ) {
          const e = this.pendingPageAgents.shift();
          if (e) {
            const t = {
              id: crypto.randomUUID(),
              type: 'AGENT_REGISTER',
              timestamp: Date.now(),
              source: this.agentId,
              payload: { agent: e },
            };
            (this.primaryConnection.send(JSON.stringify(t)),
              console.log(`[FuseConnect v7] Registered queued Page Agent: ${e.name} (${e.id})`));
            for (const t of this.joinedChannels) {
              const s = {
                id: crypto.randomUUID(),
                type: 'CHANNEL_JOIN',
                timestamp: Date.now(),
                source: e.id,
                payload: { channelId: t },
              };
              (this.primaryConnection.send(JSON.stringify(s)), e.channels.push(t));
            }
          }
        }
    }
    reRegisterAllAgents(e) {
      if (e.readyState === WebSocket.OPEN) {
        console.log(
          `[FuseConnect v7] Re-registering ${this.agents.size} existing agents on new connection`
        );
        for (const [t, s] of this.agents) {
          if (t === this.agentId) continue;
          const n = {
            id: crypto.randomUUID(),
            type: 'AGENT_REGISTER',
            timestamp: Date.now(),
            source: this.agentId,
            payload: { agent: s },
          };
          if (
            (e.send(JSON.stringify(n)),
            console.log(`[FuseConnect v7] Re-announced Page Agent: ${s.name} (${t})`),
            s.channels && s.channels.length > 0)
          )
            for (const n of s.channels) {
              const s = {
                id: crypto.randomUUID(),
                type: 'CHANNEL_JOIN',
                timestamp: Date.now(),
                source: t,
                payload: { channelId: n },
              };
              e.send(JSON.stringify(s));
            }
        }
      }
    }
    startHeartbeat() {
      this.heartbeatTimer ||
        (this.heartbeatTimer = setInterval(() => {
          this.send({ type: 'HEARTBEAT' });
          for (const [e, t] of this.agents)
            if (e !== this.agentId && 'browser-page' === t.platform) {
              const s = t.metadata?.tabId;
              s &&
                chrome.tabs.get(s, (t) => {
                  if (chrome.runtime.lastError || !t)
                    return (
                      console.log(`[FuseConnect v7] Tab ${s} for agent ${e} is gone. Removing.`),
                      this.agents.delete(e),
                      this.send({ type: 'AGENT_UNREGISTER', agentId: e }),
                      void this.broadcastToTabs({
                        type: 'AGENTS_UPDATE',
                        agents: Array.from(this.agents.values()),
                      })
                    );
                  const n = {
                    id: crypto.randomUUID(),
                    type: 'HEARTBEAT',
                    timestamp: Date.now(),
                    source: e,
                    payload: {},
                  };
                  this.primaryConnection?.readyState === WebSocket.OPEN &&
                    this.primaryConnection.send(JSON.stringify(n));
                });
            }
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
      switch ((console.log(`[FuseConnect v7] Received from ${t}:`, e.type), e.type)) {
        case 'WELCOME':
          console.log('[FuseConnect v7] Welcome received');
          break;
        case 'AGENT_LIST': {
          const t = e.payload.agents || [];
          (this.agents.clear(),
            t.forEach((e) => this.agents.set(e.id, e)),
            this.broadcastToTabs({ type: 'AGENTS_UPDATE', agents: t }));
          break;
        }
        case 'AGENT_STATUS': {
          const t = e.payload.agent;
          if (t) {
            if (
              'offline' === t.status ||
              'disconnected' === t.status ||
              'unregistered' === t.status
            )
              (console.log(`[FuseConnect v7] Agent ${t.id} went offline/removed`),
                this.agents.delete(t.id));
            else {
              const e = this.agents.get(t.id);
              (e &&
                e.metadata?.tabId &&
                !t.metadata?.tabId &&
                (t.metadata = { ...t.metadata, tabId: e.metadata.tabId }),
                this.agents.set(t.id, t));
            }
            (this.broadcastToTabs({
              type: 'AGENTS_UPDATE',
              agents: Array.from(this.agents.values()),
            }),
              'active' === t.status &&
                this.createNotification(
                  'agent_joined',
                  'Agent Connected',
                  `${t.name} is now online`
                ));
          }
          break;
        }
        case 'AGENT_UNREGISTER': {
          const t = e.payload.agentId;
          t &&
            (console.log(`[FuseConnect v7] UNREGISTER received for ${t}`),
            this.agents.delete(t),
            this.broadcastToTabs({
              type: 'AGENTS_UPDATE',
              agents: Array.from(this.agents.values()),
            }));
          break;
        }
        case 'CHANNEL_LIST': {
          const t = e.payload.channels || [];
          t.length > 0 &&
            (t.forEach((e) => this.channels.set(e.id, e)),
            this.broadcastToTabs({
              type: 'CHANNELS_UPDATE',
              channels: Array.from(this.channels.values()),
            }),
            this.saveChannels());
          break;
        }
        case 'CHANNEL_MESSAGE':
        case 'MESSAGE_RECEIVE':
          const t = e.payload;
          (t?.channel && this.channelLastActivityAt.set(t.channel, Date.now()),
            this.appendTranscriptFromRelay(t),
            this.handleAgentMessage(t));
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
          (console.error('[FuseConnect v7] Relay error:', e.payload),
            this.createNotification('error', 'Error', e.payload.message || 'Unknown error'));
          break;
        case 'TASK_ASSIGN':
          (this.broadcastToTabs({
            type: 'TASK_ASSIGN',
            task: e.payload.task,
            channel: e.channel,
            timestamp: e.timestamp,
          }),
            this.createNotification('info', 'New Task Assigned', `Task: ${e.payload.task.title}`));
      }
    }
    async appendTranscriptFromRelay(t) {
      const s = t.channel || '',
        n = this.channels.get(s)?.name || '',
        a = (n || s).toString();
      if (
        !(
          'NFT Alpha 1' === a ||
          'nft-alpha-1' === a.toLowerCase() ||
          (a.toLowerCase().includes('nft') && a.toLowerCase().includes('alpha'))
        )
      )
        return;
      const o =
          'system' === t.type
            ? 'system'
            : 'response' === t.type
              ? 'assistant'
              : 'command' === t.type
                ? 'tool'
                : 'user',
        i = 'relay:NFT Alpha 1',
        c = {
          id: e(`${i}|${t.id}|${t.from}|${t.to}|${t.timestamp}|${s}`),
          ts: t.timestamp || Date.now(),
          role: o,
          content: t.content || '',
          meta: {
            source: 'tnf-relay',
            channelId: s,
            channelName: n,
            channel: a,
            from: t.from,
            to: t.to,
            msgType: t.type,
          },
        };
      if (c.content)
        try {
          const e = `https://tnf-agent-orchestration.bizsynth.workers.dev/transcript/append?sessionKey=${encodeURIComponent(i)}`;
          await fetch(e, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Session-Key': i },
            body: JSON.stringify({ entries: [c] }),
          });
        } catch (e) {}
    }
    handleAgentMessage(t) {
      try {
        const e = Date.now(),
          s = this.__loopGuard || { counts: new Map(), mutedUntil: new Map() };
        this.__loopGuard = s;
        const n = t.from || '',
          a = t.channel || '',
          o = t.content || '',
          i = s.mutedUntil.get(n) || 0;
        if (i && e < i) return;
        const c = `${n}:${a}:${o.slice(0, 280)}`,
          r = s.counts.get(c) || { firstTs: e, n: 0 };
        if (
          (e - r.firstTs > 1e4 && ((r.firstTs = e), (r.n = 0)),
          (r.n += 1),
          s.counts.set(c, r),
          r.n > 5)
        )
          return (
            s.mutedUntil.set(n, e + 6e4),
            void console.warn('[FuseConnect v7] Loop guard muted source for 60s:', n)
          );
      } catch {}
      if (t.from === this.agentId || 'Browser Agent' === t.from) {
        if (!t.channel)
          return void console.log('[FuseConnect v7] Skipping direct self-message echo');
        const s = e(`${t.from}:${t.content}:${Math.floor(t.timestamp / 1e3)}`);
        if (this.recentMessageHashes.has(s))
          return void console.log('[FuseConnect v7] Skipping duplicate self-message on channel');
      }
      const s = e(`${t.from}:${t.content}:${Math.floor(t.timestamp / 1e3)}`),
        n = Date.now();
      if (this.recentMessageHashes.has(s))
        console.log('[FuseConnect v7] Skipping duplicate message');
      else {
        this.recentMessageHashes.set(s, n);
        for (const [e, t] of this.recentMessageHashes.entries())
          n - t > this.MESSAGE_DEDUP_WINDOW_MS && this.recentMessageHashes.delete(e);
        (this.broadcastToTabs({ type: 'NEW_MESSAGE', message: t }),
          (t.to !== this.agentId && 'broadcast' !== t.to) ||
            this.createNotification(
              'message',
              `Message from ${t.from}`,
              t.content.substring(0, 100)
            ),
          (t.to !== this.agentId && 'broadcast' !== t.to) ||
            'command' !== t.type ||
            this.executeCommand(t));
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
        if (s.id)
          try {
            chrome.tabs.sendMessage(s.id, e, () => {
              const e = chrome.runtime.lastError;
              !e ||
                e.message?.includes('Receiving end does not exist') ||
                e.message?.includes('Could not establish connection') ||
                console.warn(`[FuseConnect v7] Failed to broadcast to tab ${s.id}:`, e);
            });
          } catch (e) {}
    }
    async saveChannels() {
      await chrome.storage.local.set({
        [n]: Array.from(this.channels.values()),
        [a]: Array.from(this.joinedChannels),
      });
    }
    async saveTabActiveChannels() {
      const e = {};
      for (const [t, s] of this.tabActiveChannels.entries()) s && (e[String(t)] = s);
      await chrome.storage.local.set({ [o]: e });
    }
    setTabActiveChannel(e, t) {
      (t ? this.tabActiveChannels.set(e, t) : this.tabActiveChannels.delete(e),
        this.saveTabActiveChannels());
    }
    getTabActiveChannel(e) {
      return (e && this.tabActiveChannels.get(e)) || null;
    }
    setupTabLifecycleHandlers() {
      chrome.tabs.onRemoved.addListener((e) => {
        this.tabActiveChannels.delete(e) && this.saveTabActiveChannels();
      });
    }
    async sendNativeMessage(e) {
      return (
        console.log('[NativeMessaging] Sending:', e.action, e.service || ''),
        new Promise((t) => {
          try {
            chrome.runtime.sendNativeMessage('com.thenewfuse.native_host', e, (e) => {
              chrome.runtime.lastError
                ? (console.error('[NativeMessaging] Error:', chrome.runtime.lastError.message),
                  t({ error: chrome.runtime.lastError.message }))
                : t(e || {});
            });
          } catch (e) {
            (console.error('[NativeMessaging] Exception:', e),
              t({ error: 'Native messaging not available' }));
          }
        })
      );
    }
    async sendActivityEvent(e, t = {}, s = 'fuse-activity-log') {
      this.send({
        type: 'MESSAGE_SEND',
        to: 'broadcast',
        channel: s,
        content: `[ACTIVITY] ${e}`,
        messageType: 'event',
        metadata: { senderId: this.agentId, eventType: e, ts: Date.now(), ...t },
      });
    }
    async ensureAutonomousServices(e) {
      Date.now() - this.lastAutonomyStartAt < 15e3 ||
        ((this.lastAutonomyStartAt = Date.now()),
        this.autoMonitor && (await this.sendNativeMessage({ action: 'start', service: 'monitor' })),
        this.autoMasterClock &&
          (await this.sendNativeMessage({ action: 'start', service: 'masterClock' })),
        this.startStallWatchdog(),
        this.sendActivityEvent('autonomy_services_ensured', {
          reason: e,
          autoMonitor: this.autoMonitor,
          autoMasterClock: this.autoMasterClock,
          autoWakePing: this.autoWakePing,
        }));
    }
    startStallWatchdog() {
      !this.stallWatchdogTimer &&
        this.autoWakePing &&
        (this.stallWatchdogTimer = setInterval(() => {
          if (!this.primaryConnection || this.primaryConnection.readyState !== WebSocket.OPEN)
            return;
          const e = Date.now();
          for (const [t] of this.channels) {
            if (!this.joinedChannels.has(t)) continue;
            const s = this.channelLastActivityAt.get(t) || 0;
            if (s && e - s < 9e4) continue;
            if (e - (this.lastWakePingAt.get(t) || 0) < 12e4) continue;
            const n = `wake-${t}-${e}`;
            (this.lastWakePingAt.set(t, e),
              this.send({
                type: 'MESSAGE_SEND',
                to: 'broadcast',
                channel: t,
                content: `[WAKE_PING ${n}] Stall check from browser orchestrator`,
                messageType: 'event',
                metadata: {
                  senderId: this.agentId,
                  eventType: 'wake_ping',
                  pingId: n,
                  reason: 'stall-watchdog',
                },
              }),
              this.sendActivityEvent('wake_ping_sent', {
                pingId: n,
                channelId: t,
                reason: 'stall-watchdog',
              }));
          }
        }, 3e4));
    }
    stopStallWatchdog() {
      this.stallWatchdogTimer &&
        (clearInterval(this.stallWatchdogTimer), (this.stallWatchdogTimer = null));
    }
    frontloadPageAgentContext(e) {
      if (!e.metadata?.tabId) return;
      const t = Array.from(this.joinedChannels);
      chrome.tabs.sendMessage(e.metadata.tabId, {
        type: 'FUSE_ONBOARDING_CONTEXT',
        payload: {
          browserAgentId: this.agentId,
          pageAgentId: e.id,
          channels: t,
          knownAgents: Array.from(this.agents.values()).map((e) => ({
            id: e.id,
            name: e.name,
            platform: e.platform,
            status: e.status,
          })),
          capabilities: e.capabilities || [],
          relayUrl: h,
          policy: { heartbeat: !0, wakePing: this.autoWakePing, autonomous: !0 },
        },
      });
    }
    setupMessageHandlers() {
      chrome.runtime.onMessage.addListener((t, s, n) => {
        switch (t.type) {
          case 'TEST_PING':
            (console.log('[FuseConnect v7] Received TEST_PING'),
              n({ success: !0, status: 'online', version: '7.0.0', timestamp: Date.now() }));
            break;
          case 'PING':
            n({ success: !0, pong: !0 });
            break;
          case 'CONNECT':
            ((this.connectionAttempts = 0),
              this.connectToNode('relay', t.url || h),
              n({ success: !0 }));
            break;
          case 'DISCONNECT':
            (this.disconnectAll(), n({ success: !0 }));
            break;
          case 'GET_STATE': {
            let e = null;
            if (s.tab?.id)
              for (const [t, n] of this.agents)
                if (n.metadata?.tabId === s.tab.id) {
                  e = t;
                  break;
                }
            n({
              connectionStatus:
                this.primaryConnection?.readyState === WebSocket.OPEN
                  ? 'connected'
                  : 'disconnected',
              agents: Array.from(this.agents.values()),
              channels: Array.from(this.channels.values()),
              joinedChannels: Array.from(this.joinedChannels),
              selectedChannel: this.getTabActiveChannel(s.tab?.id),
              tabId: s.tab?.id ?? null,
              nodes: Object.fromEntries(this.nodeStatus),
              agentId: e || this.agentId,
              browserAgentId: this.agentId,
              autoConnect: this.autoConnect,
              autoMonitor: this.autoMonitor,
              autoMasterClock: this.autoMasterClock,
              autoWakePing: this.autoWakePing,
            });
            break;
          }
          case 'SET_AUTO_CONNECT':
            ((this.autoConnect = t.enabled),
              chrome.storage.local.set({ [i]: t.enabled }),
              n({ success: !0 }));
            break;
          case 'SET_AUTONOMY_SETTINGS':
            (void 0 !== t.autoMonitor && (this.autoMonitor = !!t.autoMonitor),
              void 0 !== t.autoMasterClock && (this.autoMasterClock = !!t.autoMasterClock),
              void 0 !== t.autoWakePing && (this.autoWakePing = !!t.autoWakePing),
              chrome.storage.local.set({
                [c]: this.autoMonitor,
                [r]: this.autoMasterClock,
                [l]: this.autoWakePing,
              }),
              this.autoWakePing ? this.startStallWatchdog() : this.stopStallWatchdog(),
              n({ success: !0 }));
            break;
          case 'START_AUTONOMY':
            return (
              this.ensureAutonomousServices('manual_start').then(() => n({ success: !0 })),
              !0
            );
          case 'STOP_AUTONOMY':
            return (
              this.stopStallWatchdog(),
              Promise.all([
                this.sendNativeMessage({ action: 'stop', service: 'monitor' }),
                this.sendNativeMessage({ action: 'stop', service: 'masterClock' }),
              ]).then(() => n({ success: !0 })),
              !0
            );
          case 'GET_AUTONOMY_STATUS':
            return (
              this.sendNativeMessage({ action: 'status' }).then((e) => {
                n({
                  success: !0,
                  settings: {
                    autoMonitor: this.autoMonitor,
                    autoMasterClock: this.autoMasterClock,
                    autoWakePing: this.autoWakePing,
                  },
                  monitor: e?.services?.monitor || null,
                  masterClock: e?.services?.masterClock || null,
                  relay: e?.services?.relay || null,
                });
              }),
              !0
            );
          case 'START_RELAY':
            return (
              this.sendNativeMessage({ action: 'start', service: 'relay' }).then((e) => {
                (n(e),
                  (!e.result?.success && e.error) ||
                    setTimeout(() => {
                      ((this.connectionAttempts = 0),
                        this.connectToNode('relay', h),
                        this.ensureAutonomousServices('relay_started'));
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
          case 'AI_STUDIO_AUTH':
            return (
              chrome.identity.getAuthToken({ interactive: !0 }, (e) => {
                chrome.runtime.lastError
                  ? n({ success: !1, error: chrome.runtime.lastError.message })
                  : (chrome.storage.local.set({ ai_studio_token: e }),
                    n({ success: !0, token: e }));
              }),
              !0
            );
          case 'AI_STUDIO_GET_PLAYLISTS':
            return (
              chrome.storage.local.get(['ai_studio_token'], (e) => {
                e.ai_studio_token
                  ? n({ success: !0, playlists: [] })
                  : n({ success: !1, error: 'Not authenticated' });
              }),
              !0
            );
          case 'AI_STUDIO_PROCESS_VIDEO':
            return (
              chrome.storage.local.get(['ai_studio_queue'], (e) => {
                const s = e.ai_studio_queue || [];
                (s.push(t.video),
                  chrome.storage.local.set({ ai_studio_queue: s }),
                  n({ success: !0, queueLength: s.length }));
              }),
              !0
            );
          case 'AI_VIDEO_GET_STATS':
            return (
              chrome.storage.local.get(
                [
                  'ai_video_processed_count',
                  'ai_video_total_count',
                  'ai_video_estimated_cost',
                  'ai_studio_token',
                  'videoQueue',
                ],
                (e) => {
                  n({
                    processed: e.ai_video_processed_count || 0,
                    total: e.ai_video_total_count || e.videoQueue?.length || 0,
                    cost: e.ai_video_estimated_cost || 0,
                    account: e.ai_studio_token ? 'Authenticated' : 'None',
                  });
                }
              ),
              !0
            );
          case 'AI_VIDEO_GENERATE_HISTORY_PROMPT':
            n({
              prompt:
                'Using your Personal Intelligence access to my YouTube watch history,\nprovide my last 50 watched videos.\n\nFilter out political content.\n\nFormat as JSON array:\n[\n  {\n    "title": "Video Title",\n    "url": "https://www.youtube.com/watch?v=...",\n    "channel": "Channel Name",\n    "description": "Brief description"\n  }\n]',
            });
            break;
          case 'AI_VIDEO_EXPORT':
            return (
              chrome.storage.local.get(['videoQueue', 'ai_studio_queue'], (e) => {
                const s =
                  'urls' === t.format
                    ? (e.videoQueue || []).map((e) => e.url).join('\n')
                    : JSON.stringify(e.videoQueue || [], null, 2);
                n({ content: s });
              }),
              !0
            );
          case 'TASK_COMPLETE':
            ('PROCESS_SEGMENT' === t.taskType &&
              t.success &&
              chrome.storage.local.get(['ai_video_processed_count'], (e) => {
                const t = e.ai_video_processed_count || 0;
                chrome.storage.local.set({ ai_video_processed_count: t + 1 });
              }),
              this.broadcastToTabs(t),
              n({ success: !0 }));
            break;
          case 'BROADCAST_MESSAGE':
            (this.send({
              type: 'MESSAGE_SEND',
              to: 'broadcast',
              channel: t.channel,
              content: t.content,
              messageType: 'text',
              metadata: t.metadata,
            }),
              this.sendActivityEvent('broadcast_message', {
                channel: t.channel || null,
                senderId: t.senderId || t.metadata?.senderId || null,
                contentPreview: String(t.content || '').substring(0, 120),
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
          case 'CHANNEL_CREATE': {
            const e = {
              id: `local-${Date.now()}`,
              name: t.name,
              description: t.description || '',
              isPrivate: t.isPrivate || !1,
              createdAt: Date.now(),
              createdBy: this.agentId,
              members: [this.agentId],
            };
            (this.channels.set(e.id, e),
              this.joinedChannels.add(e.id),
              this.broadcastToTabs({
                type: 'CHANNELS_UPDATE',
                channels: Array.from(this.channels.values()),
              }),
              this.saveChannels(),
              this.send({
                type: 'CHANNEL_CREATE',
                name: t.name,
                description: t.description,
                isPrivate: t.isPrivate || !1,
              }),
              this.sendActivityEvent('channel_create', { channelId: e.id, name: t.name }),
              n({ success: !0, channel: e }));
            break;
          }
          case 'CHANNEL_JOIN':
            (this.joinedChannels.add(t.channelId),
              s.tab?.id &&
                (this.setTabActiveChannel(s.tab.id, t.channelId),
                chrome.tabs.sendMessage(s.tab.id, {
                  type: 'CHANNEL_SELECTED',
                  channelId: t.channelId,
                })),
              this.send({ type: 'CHANNEL_JOIN', channelId: t.channelId }),
              this.saveChannels(),
              this.broadcastToTabs({
                type: 'JOINED_CHANNELS_UPDATE',
                joinedChannels: Array.from(this.joinedChannels),
              }),
              this.sendActivityEvent('channel_join', { channelId: t.channelId }),
              n({ success: !0 }));
            break;
          case 'CHANNEL_LEAVE':
            (this.joinedChannels.delete(t.channelId),
              s.tab?.id &&
                (this.setTabActiveChannel(s.tab.id, null),
                chrome.tabs.sendMessage(s.tab.id, { type: 'CHANNEL_SELECTED', channelId: null })),
              this.send({ type: 'CHANNEL_LEAVE', channelId: t.channelId }),
              this.saveChannels(),
              this.broadcastToTabs({
                type: 'JOINED_CHANNELS_UPDATE',
                joinedChannels: Array.from(this.joinedChannels),
              }),
              this.sendActivityEvent('channel_leave', { channelId: t.channelId }),
              n({ success: !0 }));
            break;
          case 'CHANNEL_DELETE': {
            const e = t.channelId;
            if ('general' === e) {
              n({ success: !1, error: 'Cannot delete general channel' });
              break;
            }
            (this.channels.delete(e),
              this.joinedChannels.delete(e),
              this.broadcastToTabs({
                type: 'CHANNELS_UPDATE',
                channels: Array.from(this.channels.values()),
              }),
              this.saveChannels(),
              this.send({ type: 'CHANNEL_DELETE', channelId: e }),
              this.sendActivityEvent('channel_delete', { channelId: e }),
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
                  agents: Array.from(this.agents.values()),
                }),
                chrome.tabs.sendMessage(s.tab.id, {
                  type: 'CHANNELS_UPDATE',
                  channels: Array.from(this.channels.values()),
                }),
                chrome.tabs.sendMessage(s.tab.id, {
                  type: 'JOINED_CHANNELS_UPDATE',
                  joinedChannels: Array.from(this.joinedChannels),
                }),
                chrome.tabs.sendMessage(s.tab.id, {
                  type: 'CHANNEL_SELECTED',
                  channelId: this.getTabActiveChannel(s.tab.id),
                }));
            }
            n({ success: !0 });
            break;
          case 'TOGGLE_PANEL':
            (this.broadcastToTabs({ type: 'TOGGLE_PANEL' }), n({ success: !0 }));
            break;
          case 'ACTIVATE_ON_TAB':
            return (
              chrome.tabs.query({ active: !0, currentWindow: !0 }, async (e) => {
                if (e[0]?.id)
                  try {
                    (await chrome.tabs.sendMessage(e[0].id, { type: 'PING' }).catch(() => null))
                      ? (chrome.tabs.sendMessage(e[0].id, { type: 'SHOW_PANEL' }),
                        n({ success: !0, alreadyActive: !0 }))
                      : (await chrome.scripting.executeScript({
                          target: { tabId: e[0].id },
                          files: ['content/index.js'],
                        }),
                        console.log(`[FuseConnect v7] Content script injected into tab ${e[0].id}`),
                        setTimeout(() => {
                          e[0]?.id && chrome.tabs.sendMessage(e[0].id, { type: 'SHOW_PANEL' });
                        }, 500),
                        n({ success: !0, injected: !0 }));
                  } catch (e) {
                    (console.error('[FuseConnect v7] Failed to activate on tab:', e),
                      n({ success: !1, error: e.message }));
                  }
                else n({ success: !1, error: 'No active tab found' });
              }),
              !0
            );
          case 'REQUEST_SYNC':
            (this.primaryConnection && this.requestSync(this.primaryConnection),
              n({ success: !0 }));
            break;
          case 'DISCOVER_AGENTS':
            (this.primaryConnection &&
              (this.send({ type: 'AGENT_LIST' }), this.send({ type: 'CHANNEL_LIST' })),
              n({ success: !0 }));
            break;
          case 'ACTIVITY_EVENT':
            (this.sendActivityEvent(t.eventType || 'unknown', {
              channel: t.channel || null,
              senderId: t.senderId || null,
              ...(t.metadata || {}),
            }),
              n({ success: !0 }));
            break;
          case 'INJECT_MESSAGE':
            return (
              this.injectMessageToActiveTab(t.content)
                .then(() => {
                  n({ success: !0 });
                })
                .catch((e) => {
                  (console.error('[FuseConnect v7] Error injecting message:', e),
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
          case 'CHAT_DETECTED':
            if (s.tab?.id) {
              let e = null;
              for (const [t, n] of this.agents)
                if (n.metadata?.tabId === s.tab.id) {
                  e = t;
                  break;
                }
              e || (e = `page-agent-${s.tab.id}-${Math.random().toString(36).substr(2, 5)}`);
              const t = s.tab.url ? new URL(s.tab.url).hostname : 'page';
              let a = t;
              (t.includes('gemini.google')
                ? (a = 'Gemini')
                : t.includes('openai.com')
                  ? (a = 'ChatGPT')
                  : t.includes('claude.ai')
                    ? (a = 'Claude')
                    : t.includes('perplexity.ai') && (a = 'Perplexity'),
                this.registerPageAgent(e, `AI Chat (${a})`, t, s.tab.id));
              const o = { type: 'AGENT_STATUS', agent: this.agents.get(e) };
              (this.broadcastToTabs(o), n({ success: !0, agentId: e }));
            } else n({ success: !0 });
            break;
          case 'STREAMING_UPDATE':
            break;
          case 'RESPONSE_COMPLETE':
            if (
              (this.broadcastToTabs(t),
              this.primaryConnection?.readyState === WebSocket.OPEN && t.content)
            ) {
              const n = e(`ai:${t.content.substring(0, 500)}`),
                a = Date.now();
              if (this.recentMessageHashes.has(n))
                console.log('[FuseConnect v7] Skipping duplicate AI response broadcast');
              else {
                this.recentMessageHashes.set(n, a);
                let e = t.metadata?.senderId || t.senderId;
                const o = (e) => (e ? e.replace(/^(page-agent-|browser-|agent-)/, '') : '');
                (!e &&
                  s.tab?.id &&
                  ((e = `page-agent-${s.tab.id}`),
                  console.log('[FuseConnect v7] Using tab-based senderId:', e)),
                  e || (e = `ai-response-${Date.now()}`));
                const i = o(e),
                  c = o(this.agentId);
                console.log('[FuseConnect v7] AI Response from agent:', {
                  senderId: e,
                  normalizedSenderId: i,
                  normalizedMyId: c,
                });
                let r = t.channel || t.metadata?.channel;
                if (
                  (!r &&
                    this.joinedChannels.size > 0 &&
                    ((r = Array.from(this.joinedChannels)[0]),
                    console.log('[FuseConnect v7] Using fallback channel:', r)),
                  r)
                ) {
                  const n = s.tab?.url || '';
                  let a = t.platform || 'unknown';
                  t.platform ||
                    (n.includes('gemini.google')
                      ? (a = 'Gemini')
                      : n.includes('chat.openai') || n.includes('chatgpt')
                        ? (a = 'ChatGPT')
                        : n.includes('claude.ai')
                          ? (a = 'Claude')
                          : n.includes('copilot') && (a = 'Copilot'));
                  const o = {
                    senderId: e,
                    senderType: 'ai-agent',
                    platform: a,
                    isAIResponse: !0,
                    timestamp: Date.now(),
                  };
                  (t.metadata?.correlationId &&
                    ((o.correlationId = t.metadata.correlationId),
                    (o.taskId = t.metadata.taskId),
                    (o.inResponseTo = t.metadata.inResponseTo),
                    console.log(
                      '[FuseConnect v7] 🔗 Including correlation in broadcast:',
                      t.metadata.correlationId
                    )),
                    this.send({
                      type: 'MESSAGE_SEND',
                      to: t.metadata?.inResponseTo || 'broadcast',
                      channel: r,
                      content: t.content,
                      messageType: 'ai-response',
                      metadata: o,
                    }),
                    console.log('[FuseConnect v7] AI response broadcast to channel:', {
                      channel: r,
                      senderId: e,
                      platform: a,
                      contentLength: t.content.length,
                      hasCorrelation: !!t.metadata?.correlationId,
                    }));
                }
              }
            }
            n({ success: !0 });
        }
      });
    }
    disconnectAll() {
      for (const [e, t] of this.connections) t.close();
      (this.connections.clear(), (this.primaryConnection = null));
      for (const e of this.reconnectTimers.values()) clearTimeout(e);
      (this.reconnectTimers.clear(),
        this.heartbeatTimer && (clearInterval(this.heartbeatTimer), (this.heartbeatTimer = null)),
        this.stopStallWatchdog(),
        this.updateNodeStatus('relay', h, 'disconnected'));
    }
    setupCommands() {
      chrome.commands.onCommand.addListener((e) => {
        'toggle-panel' === e && this.broadcastToTabs({ type: 'TOGGLE_PANEL' });
      });
    }
  })();
})();
//# sourceMappingURL=index.js.map
