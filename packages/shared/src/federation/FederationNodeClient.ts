import {
  type FederationAgent,
  type FederationChannel,
  type FederationChannelMessage,
  type FederationNodePlatform,
  type FederationNodeRegistration,
  type FederationProtocolMessage,
  FEDERATION_NODE_CAPABILITIES,
  createFederationMessage,
  generateFederationId,
  relayHealthUrl,
} from './protocol.js';

export type FederationNodeEvent =
  | 'connected'
  | 'disconnected'
  | 'registered'
  | 'registration_error'
  | 'agents_updated'
  | 'channels_updated'
  | 'channel_joined'
  | 'channel_message'
  | 'direct_message'
  | 'error'
  | 'activity';

type FederationListener = (...args: unknown[]) => void;

export interface FederationNodeClientOptions {
  relayUrl?: string;
  platform?: FederationNodePlatform;
  agentName?: string;
  agentId?: string;
  capabilities?: string[];
  autoRegister?: boolean;
  autoHeartbeatMs?: number;
}

export class FederationNodeClient {
  private ws: WebSocket | null = null;
  private relayUrl = 'ws://127.0.0.1:3000/ws';
  private platform: FederationNodePlatform = 'federation-node';
  private agentName = 'TNF Federation Node';
  private agentId = generateFederationId('node');
  private capabilities: string[] = [...FEDERATION_NODE_CAPABILITIES];
  private autoRegister = true;
  private autoHeartbeatMs = 30000;

  private connected = false;
  private registered = false;
  private connecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 8;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private messageQueue: FederationProtocolMessage[] = [];

  private agents = new Map<string, FederationAgent>();
  private channels = new Map<string, FederationChannel>();
  private joinedChannels = new Set<string>();
  private activityLog: string[] = [];
  private listeners = new Map<FederationNodeEvent, Set<FederationListener>>();

  constructor(options: FederationNodeClientOptions = {}) {
    if (options.relayUrl) this.relayUrl = options.relayUrl;
    if (options.platform) this.platform = options.platform;
    if (options.agentName) this.agentName = options.agentName;
    if (options.agentId) this.agentId = options.agentId;
    if (options.capabilities) this.capabilities = options.capabilities;
    if (typeof options.autoRegister === 'boolean') this.autoRegister = options.autoRegister;
    if (options.autoHeartbeatMs) this.autoHeartbeatMs = options.autoHeartbeatMs;
  }

  on(event: FederationNodeEvent, handler: FederationListener): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
  }

  off(event: FederationNodeEvent, handler: FederationListener): void {
    this.listeners.get(event)?.delete(handler);
  }

  private emit(event: FederationNodeEvent, ...args: unknown[]): void {
    for (const handler of this.listeners.get(event) || []) {
      handler(...args);
    }
  }

  private log(line: string): void {
    const entry = `[${new Date().toLocaleTimeString()}] ${line}`;
    this.activityLog = [entry, ...this.activityLog].slice(0, 120);
    this.emit('activity', entry);
  }

  getState() {
    return {
      relayUrl: this.relayUrl,
      agentId: this.agentId,
      agentName: this.agentName,
      platform: this.platform,
      connected: this.connected,
      registered: this.registered,
      connecting: this.connecting,
      agents: Array.from(this.agents.values()),
      channels: Array.from(this.channels.values()),
      joinedChannels: Array.from(this.joinedChannels),
      activityLog: [...this.activityLog],
    };
  }

  getAgentId(): string {
    return this.agentId;
  }

  isConnected(): boolean {
    return this.connected;
  }

  isRegistered(): boolean {
    return this.registered;
  }

  setRelayUrl(url: string): void {
    this.relayUrl = url;
  }

  async discoverRelayUrl(preferred?: string): Promise<string | null> {
    const candidates = [preferred, this.relayUrl, ...DEFAULT_RELAY_FALLBACKS].filter(
      Boolean
    ) as string[];
    const unique = [...new Set(candidates)];
    for (const candidate of unique) {
      try {
        const response = await fetch(relayHealthUrl(candidate), {
          method: 'GET',
          signal: AbortSignal.timeout(2000),
        });
        if (!response.ok) continue;
        const data = await response.json();
        if (data?.status === 'ok' && data?.relay === 'running') return candidate;
      } catch {
        // try next
      }
    }
    return null;
  }

  async connect(relayUrl?: string): Promise<boolean> {
    if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
      return true;
    }
    if (this.connecting) return false;
    if (relayUrl) this.relayUrl = relayUrl;

    const discovered = await this.discoverRelayUrl(this.relayUrl);
    if (discovered) this.relayUrl = discovered;

    this.connecting = true;
    this.log(`Connecting to relay ${this.relayUrl}`);

    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(this.relayUrl);

        this.ws.onopen = () => {
          this.connected = true;
          this.connecting = false;
          this.reconnectAttempts = 0;
          this.log('Relay socket open');
          this.emit('connected');
          if (this.autoRegister) this.registerAgent();
          this.flushQueue();
          this.startHeartbeat();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            this.handleMessage(JSON.parse(String(event.data)) as FederationProtocolMessage);
          } catch (error) {
            this.emit('error', error);
          }
        };

        this.ws.onclose = () => {
          this.connected = false;
          this.registered = false;
          this.connecting = false;
          this.stopHeartbeat();
          this.log('Relay disconnected');
          this.emit('disconnected');
          this.scheduleReconnect();
          resolve(false);
        };

        this.ws.onerror = (error) => {
          this.connecting = false;
          this.emit('error', error);
          resolve(false);
        };
      } catch (error) {
        this.connecting = false;
        this.emit('error', error);
        resolve(false);
      }
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
    this.connected = false;
    this.registered = false;
    this.connecting = false;
  }

  registerAgent(registration?: Partial<FederationNodeRegistration>): void {
    if (registration?.agentId) this.agentId = registration.agentId;
    if (registration?.name) this.agentName = registration.name;
    if (registration?.platform) this.platform = registration.platform;
    if (registration?.capabilities) this.capabilities = registration.capabilities;

    const message = createFederationMessage('AGENT_REGISTER', this.agentId, {
      agent: {
        id: this.agentId,
        name: this.agentName,
        platform: this.platform,
        status: 'active',
        capabilities: this.capabilities,
        channels: Array.from(this.joinedChannels),
        metadata: {
          node: {
            type: 'standalone-federation-node',
            client: this.platform,
          },
          ...(registration?.metadata || {}),
        },
      },
    });

    this.sendRaw(message);
    this.log(`Registered federation node ${this.agentId}`);
  }

  requestAgentList(): void {
    this.sendEnvelope('AGENT_LIST', {});
  }

  requestChannelList(): void {
    this.sendEnvelope('CHANNEL_LIST', {});
  }

  createChannel(name: string, description = '', isPrivate = false): void {
    this.sendEnvelope('CHANNEL_CREATE', { name, description, isPrivate });
    this.log(`Create channel "${name}"`);
  }

  joinChannel(channelId: string): void {
    this.joinedChannels.add(channelId);
    this.sendEnvelope('CHANNEL_JOIN', { channelId });
    this.log(`Join channel ${channelId}`);
  }

  leaveChannel(channelId: string): void {
    this.joinedChannels.delete(channelId);
    this.sendEnvelope('CHANNEL_LEAVE', { channelId });
    this.log(`Leave channel ${channelId}`);
  }

  sendChannelMessage(channelId: string, content: string, metadata?: Record<string, unknown>): void {
    const message = createFederationMessage(
      'MESSAGE_SEND',
      this.agentId,
      {
        to: 'broadcast',
        content,
        messageType: 'text',
        metadata: {
          sourceNode: this.platform,
          standaloneNode: true,
          ...metadata,
        },
      },
      { channel: channelId }
    );
    this.sendRaw(message);
    this.log(`Sent to ${channelId}: ${content.slice(0, 80)}`);
  }

  pauseChannel(channelId: string): void {
    this.sendEnvelope('CHANNEL_PAUSE', { channelId });
  }

  resumeChannel(channelId: string): void {
    this.sendEnvelope('CHANNEL_RESUME', { channelId });
  }

  private sendEnvelope(type: string, payload: Record<string, unknown>): void {
    const message = createFederationMessage(type, this.agentId, payload);
    this.sendRaw(message);
  }

  private sendRaw(message: FederationProtocolMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return;
    }
    this.messageQueue.push(message);
  }

  private flushQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      if (message) this.ws.send(JSON.stringify(message));
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.sendEnvelope('HEARTBEAT', { agentId: this.agentId, timestamp: Date.now() });
    }, this.autoHeartbeatMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts += 1;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    this.reconnectTimer = setTimeout(() => {
      void this.connect();
    }, delay);
  }

  private ensureDefaultChannel(channels: FederationChannel[]): void {
    if (!this.registered) return;

    const general =
      channels.find((channel) => channel.id === 'general' || channel.name === 'general') ||
      channels[0];

    if (general) {
      if (!this.joinedChannels.has(general.id)) {
        this.joinChannel(general.id);
      }
      return;
    }

    if (channels.length === 0) {
      this.createChannel('general', 'Default operator channel');
    }
  }

  private handleMessage(message: FederationProtocolMessage): void {
    switch (message.type) {
      case 'WELCOME':
        this.log('Relay welcome received');
        this.requestAgentList();
        this.requestChannelList();
        break;

      case 'REGISTRATION_CONFIRMED':
        this.registered = true;
        this.emit('registered', message.payload);
        this.log('Registration confirmed');
        this.requestAgentList();
        this.requestChannelList();
        break;

      case 'REGISTRATION_ERROR':
        this.registered = false;
        this.emit('registration_error', message.payload);
        this.log(`Registration error: ${JSON.stringify(message.payload)}`);
        break;

      case 'AGENT_LIST': {
        const agents = ((message.payload as { agents?: FederationAgent[] })?.agents ||
          []) as FederationAgent[];
        this.agents = new Map(agents.map((agent) => [agent.id, agent]));
        this.emit('agents_updated', agents);
        break;
      }

      case 'AGENT_STATUS': {
        const agent = (message.payload as { agent?: FederationAgent })?.agent;
        if (!agent) break;
        if (agent.status === 'offline' || agent.status === 'disconnected') {
          this.agents.delete(agent.id);
        } else {
          this.agents.set(agent.id, agent);
        }
        this.emit('agents_updated', Array.from(this.agents.values()));
        break;
      }

      case 'CHANNEL_LIST': {
        const channels = ((message.payload as { channels?: FederationChannel[] })?.channels ||
          []) as FederationChannel[];
        this.channels = new Map(channels.map((channel) => [channel.id, channel]));
        this.emit('channels_updated', channels);
        this.ensureDefaultChannel(channels);
        break;
      }

      case 'CHANNEL_CREATED':
      case 'CHANNEL_JOINED': {
        const channel = (message.payload as { channel?: FederationChannel })?.channel;
        if (channel) {
          this.channels.set(channel.id, channel);
          this.joinedChannels.add(channel.id);
          this.emit('channel_joined', channel);
          this.emit('channels_updated', Array.from(this.channels.values()));
        }
        break;
      }

      case 'CHANNEL_MESSAGE':
      case 'MESSAGE_RECEIVE': {
        const payload = message.payload as FederationChannelMessage;
        if (payload?.channel) {
          this.emit('channel_message', payload);
        } else {
          this.emit('direct_message', payload);
        }
        this.log(
          `Message from ${payload?.from || 'unknown'}: ${String(payload?.content || '').slice(0, 80)}`
        );
        break;
      }

      case 'ERROR':
        this.emit('error', message.payload);
        break;

      default:
        break;
    }
  }
}

const DEFAULT_RELAY_FALLBACKS = [
  'ws://127.0.0.1:3000/ws',
  'ws://127.0.0.1:3001/ws',
  'ws://127.0.0.1:3010/ws',
];

export default FederationNodeClient;
