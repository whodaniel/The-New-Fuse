(function () {
  const CAPABILITIES = [
    'federation-channels',
    'channel-broadcast',
    'agent-orchestration',
    'relay-operator',
    'standalone-node',
  ];

  function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function relayHealthUrl(relayUrl) {
    return relayUrl.replace(/^ws:/, 'http:').replace(/^wss:/, 'https:').replace(/\/ws$/, '/health');
  }

  class FederationNodeClient {
    constructor(options = {}) {
      this.relayUrl = options.relayUrl || 'ws://127.0.0.1:3000/ws';
      this.platform = options.platform || 'cli-html';
      this.agentName = options.agentName || 'TNF CLI Federation Node';
      this.agentId = options.agentId || generateId('cli-node');
      this.ws = null;
      this.connected = false;
      this.registered = false;
      this.channels = new Map();
      this.agents = new Map();
      this.joinedChannels = new Set();
      this.listeners = new Map();
      this.queue = [];
      this.heartbeatTimer = null;
    }

    on(event, handler) {
      if (!this.listeners.has(event)) this.listeners.set(event, new Set());
      this.listeners.get(event).add(handler);
    }

    emit(event, ...args) {
      for (const handler of this.listeners.get(event) || []) handler(...args);
    }

    getState() {
      return {
        relayUrl: this.relayUrl,
        agentId: this.agentId,
        connected: this.connected,
        registered: this.registered,
        channels: Array.from(this.channels.values()),
        agents: Array.from(this.agents.values()),
        joinedChannels: Array.from(this.joinedChannels),
      };
    }

    async discoverRelayUrl(preferred) {
      const candidates = [
        preferred,
        this.relayUrl,
        'ws://127.0.0.1:3000/ws',
        'ws://127.0.0.1:3001/ws',
      ].filter(Boolean);
      for (const candidate of [...new Set(candidates)]) {
        try {
          const response = await fetch(relayHealthUrl(candidate), { signal: AbortSignal.timeout(2000) });
          if (!response.ok) continue;
          const data = await response.json();
          if (data?.status === 'ok' && data?.relay === 'running') return candidate;
        } catch (_) {}
      }
      return null;
    }

    async connect(relayUrl) {
      if (relayUrl) this.relayUrl = relayUrl;
      const discovered = await this.discoverRelayUrl(this.relayUrl);
      if (discovered) this.relayUrl = discovered;

      return new Promise((resolve) => {
        this.ws = new WebSocket(this.relayUrl);
        this.ws.onopen = () => {
          this.connected = true;
          this.emit('connected');
          this.registerAgent();
          this.flushQueue();
          this.startHeartbeat();
          resolve(true);
        };
        this.ws.onmessage = (event) => {
          try {
            this.handleMessage(JSON.parse(String(event.data)));
          } catch (error) {
            this.emit('error', error);
          }
        };
        this.ws.onclose = () => {
          this.connected = false;
          this.registered = false;
          this.stopHeartbeat();
          this.emit('disconnected');
          resolve(false);
        };
        this.ws.onerror = (error) => {
          this.emit('error', error);
          resolve(false);
        };
      });
    }

    registerAgent() {
      this.sendRaw({
        id: generateId('msg'),
        type: 'AGENT_REGISTER',
        timestamp: Date.now(),
        source: this.agentId,
        payload: {
          agent: {
            id: this.agentId,
            name: this.agentName,
            platform: this.platform,
            status: 'active',
            capabilities: CAPABILITIES,
            channels: Array.from(this.joinedChannels),
            metadata: { node: { type: 'standalone-federation-node', client: this.platform } },
          },
        },
      });
    }

    requestChannelList() { this.sendEnvelope('CHANNEL_LIST', {}); }
    requestAgentList() { this.sendEnvelope('AGENT_LIST', {}); }
    createChannel(name, description = '', isPrivate = false) {
      this.sendEnvelope('CHANNEL_CREATE', { name, description, isPrivate });
    }
    joinChannel(channelId) {
      this.joinedChannels.add(channelId);
      this.sendEnvelope('CHANNEL_JOIN', { channelId });
    }
    leaveChannel(channelId) {
      this.joinedChannels.delete(channelId);
      this.sendEnvelope('CHANNEL_LEAVE', { channelId });
    }
    sendChannelMessage(channelId, content, metadata = {}) {
      this.sendRaw({
        id: generateId('msg'),
        type: 'MESSAGE_SEND',
        timestamp: Date.now(),
        source: this.agentId,
        channel: channelId,
        payload: {
          to: 'broadcast',
          content,
          messageType: 'text',
          metadata: { sourceNode: this.platform, standaloneNode: true, ...metadata },
        },
      });
    }
    pauseChannel(channelId) { this.sendEnvelope('CHANNEL_PAUSE', { channelId }); }
    resumeChannel(channelId) { this.sendEnvelope('CHANNEL_RESUME', { channelId }); }

    sendEnvelope(type, payload) {
      this.sendRaw({
        id: generateId('msg'),
        type,
        timestamp: Date.now(),
        source: this.agentId,
        payload,
      });
    }

    sendRaw(message) {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
        return;
      }
      this.queue.push(message);
    }

    flushQueue() {
      while (this.queue.length && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(this.queue.shift()));
      }
    }

    startHeartbeat() {
      this.stopHeartbeat();
      this.heartbeatTimer = setInterval(() => {
        this.sendEnvelope('HEARTBEAT', { agentId: this.agentId, timestamp: Date.now() });
      }, 30000);
    }

    stopHeartbeat() {
      if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    handleMessage(message) {
      switch (message.type) {
        case 'WELCOME':
          this.requestAgentList();
          this.requestChannelList();
          break;
        case 'REGISTRATION_CONFIRMED':
          this.registered = true;
          this.emit('registered', message.payload);
          this.requestAgentList();
          this.requestChannelList();
          break;
        case 'REGISTRATION_ERROR':
          this.registered = false;
          this.emit('registration_error', message.payload);
          break;
        case 'AGENT_LIST': {
          const agents = message.payload?.agents || [];
          this.agents = new Map(agents.map((agent) => [agent.id, agent]));
          this.emit('agents_updated', agents);
          break;
        }
        case 'AGENT_STATUS': {
          const agent = message.payload?.agent;
          if (!agent) break;
          if (agent.status === 'offline' || agent.status === 'disconnected') this.agents.delete(agent.id);
          else this.agents.set(agent.id, agent);
          this.emit('agents_updated', Array.from(this.agents.values()));
          break;
        }
        case 'CHANNEL_LIST': {
          const channels = message.payload?.channels || [];
          if (channels.length) {
            this.channels = new Map(channels.map((channel) => [channel.id, channel]));
            this.emit('channels_updated', channels);
          }
          break;
        }
        case 'CHANNEL_CREATED':
        case 'CHANNEL_JOINED': {
          const channel = message.payload?.channel;
          if (channel) {
            this.channels.set(channel.id, channel);
            this.joinedChannels.add(channel.id);
            this.emit('channels_updated', Array.from(this.channels.values()));
          }
          break;
        }
        case 'CHANNEL_MESSAGE':
        case 'MESSAGE_RECEIVE':
          this.emit('channel_message', message.payload);
          break;
        default:
          break;
      }
    }
  }

  window.TNFFederationNodeClient = FederationNodeClient;
})();
