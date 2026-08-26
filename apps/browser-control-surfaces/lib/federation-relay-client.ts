/**
 * federation-relay-client.ts
 *
 * TNF Federation Relay WebSocket client — canonical TNFEnvelope protocol.
 * Implements the wire format expected by packages/relay-core (RelayMessage / TNFEnvelope).
 *
 * Wire protocol (matches relay-core's RelayMessage interface in types/index.ts):
 * - Outbound: { id, type: 'REGISTER' | 'HEARTBEAT' | 'CHANNEL_MESSAGE' | 'CREATE_CHANNEL' | 'JOIN_CHANNEL', source, target?, payload, timestamp, metadata? }
 * - Inbound:  { id, type: 'REGISTRATION_CONFIRMED' | 'REGISTRATION_ERROR' | 'AGENTS_UPDATED' | 'CHANNELS_UPDATED' | 'CHANNEL_MESSAGE' | 'AGENT_LEFT' | 'HEARTBEAT_ACK', source, target, payload, timestamp, metadata? }
 *
 * Registration flow:
 *   1. Client sends REGISTER with JWT token in payload.token or metadata.token
 *   2. Relay verifies JWT via JWTAuthService
 *   3. Relay responds with REGISTRATION_CONFIRMED (includes relayInfo, authenticated flag)
 *   4. On auth failure: REGISTRATION_ERROR with code AUTH_FAILED
 */
import { EventEmitter } from 'events';
import { createHash } from 'crypto';

export interface FederationRelayClientConfig {
  relayUrl: string;
  agentId: string;
  platform: string;
  provider: string;
  capabilities: string[];
  daccRole: string;
  /** Optional JWT token for authenticated registration */
  authToken?: string;
}

export interface RelayMessage {
  id: string;
  type: string;
  source: string;
  target?: string;
  payload: any;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

const DEFAULT_RECONNECT_ATTEMPTS = 5;
const DEFAULT_RECONNECT_BASE_MS = 1000;
const REQUEST_TIMEOUT_MS = 10000;
const HEARTBEAT_INTERVAL_MS = 30000;

export class FederationRelayClient extends EventEmitter {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private explicitlyClosed = false;
  private readonly config: FederationRelayClientConfig;
  private pendingRequests = new Map<string, PendingRequest>();
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageIdCounter = 0;

  constructor(config: FederationRelayClientConfig) {
    super();
    this.config = config;
  }

  get connected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  get authenticated(): boolean {
    return this._authenticated;
  }

  private _authenticated = false;

  private generateMessageId(): string {
    return `${this.config.agentId}-${Date.now()}-${++this.messageIdCounter}`;
  }

  async connect(url?: string): Promise<void> {
    const target = url ?? this.config.relayUrl;
    this.explicitlyClosed = false;

    return new Promise((resolve, reject) => {
      let settled = false;
      try {
        this.socket = new WebSocket(target);
      } catch (error) {
        reject(error);
        return;
      }

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.emit('connected');
        // Send REGISTER with auth token if available
        this.sendRegister()
          .then(() => {
            if (!settled) {
              settled = true;
              resolve();
            }
          })
          .catch((err) => {
            if (!settled) {
              settled = true;
              reject(err);
            }
          });
      };

      this.socket.onmessage = (event: MessageEvent) => {
        this.handleMessage(event);
      };

      this.socket.onclose = (event: CloseEvent) => {
        this.stopHeartbeat();
        this.emit('disconnected', event);
        if (!this.explicitlyClosed && !event.wasClean) {
          this.attemptReconnect(target);
        }
      };

      this.socket.onerror = (error: Event) => {
        this.emit('error', error);
        if (!settled) {
          settled = true;
          reject(error instanceof Error ? error : new Error('WebSocket connection error'));
        }
      };
    });
  }

  private async sendRegister(): Promise<void> {
    const payload: any = {
      id: this.config.agentId,
      type: 'browser-control-surface',
      platform: this.config.platform,
      capabilities: this.config.capabilities,
      metadata: {
        provider: this.config.provider,
        daccRole: this.config.daccRole,
      },
      channels: [],
    };

    // Include JWT token for authenticated registration
    if (this.config.authToken) {
      payload.token = this.config.authToken;
    }

    const message: RelayMessage = {
      id: this.generateMessageId(),
      type: 'REGISTER',
      source: this.config.agentId,
      payload,
      timestamp: new Date().toISOString(),
      metadata: this.config.authToken ? { token: this.config.authToken } : undefined,
    };

    this.sendRaw(message);
  }

  private handleMessage(event: MessageEvent): void {
    let message: RelayMessage;
    try {
      message = JSON.parse(event.data);
    } catch (error) {
      console.error('[FederationRelayClient] Failed to parse relay message:', error);
      return;
    }

    if (!message || typeof message.type !== 'string') return;

    // Handle request-response correlation
    if (message.metadata?.correlationId && this.pendingRequests.has(message.metadata.correlationId)) {
      const pending = this.pendingRequests.get(message.metadata.correlationId)!;
      this.pendingRequests.delete(message.metadata.correlationId);
      clearTimeout(pending.timeout);

      if (message.type === 'REGISTRATION_ERROR' || message.type?.endsWith('_ERROR')) {
        pending.reject(new Error(message.payload?.error || message.type));
      } else {
        pending.resolve(message);
      }
      return;
    }

    // Handle relay response types
    switch (message.type) {
      case 'REGISTRATION_CONFIRMED': {
        this._authenticated = message.payload?.authenticated ?? false;
        this.emit('registered', message.payload);
        this.startHeartbeat();
        return;
      }
      case 'REGISTRATION_ERROR': {
        this._authenticated = false;
        this.emit('registration_error', message.payload);
        return;
      }
      case 'HEARTBEAT_ACK': {
        // Heartbeat acknowledged
        return;
      }
    }

    // Map relay event names to hook expectations
    const eventMap: Record<string, string> = {
      'AGENTS_UPDATED': 'agents_updated',
      'CHANNELS_UPDATED': 'channels_updated',
      'CHANNEL_MESSAGE': 'channel_message',
      'AGENT_LEFT': 'agent_left',
    };

    const mappedType = eventMap[message.type] ?? message.type.toLowerCase();
    this.emit(mappedType, message.payload, message);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.connected) {
        this.sendHeartbeat().catch((err) => {
          console.error('[FederationRelayClient] Heartbeat failed:', err);
        });
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private async sendHeartbeat(): Promise<void> {
    const message: RelayMessage = {
      id: this.generateMessageId(),
      type: 'HEARTBEAT',
      source: this.config.agentId,
      payload: { timestamp: Date.now() },
      timestamp: new Date().toISOString(),
    };
    this.sendRaw(message);
  }

  private attemptReconnect(url: string): void {
    if (this.reconnectAttempts >= DEFAULT_RECONNECT_ATTEMPTS) {
      console.error('[FederationRelayClient] Max reconnect attempts reached');
      this.emit('reconnect_failed');
      return;
    }
    this.reconnectAttempts += 1;
    const delay = DEFAULT_RECONNECT_BASE_MS * this.reconnectAttempts;
    setTimeout(() => {
      this.connect(url).catch((error) => {
        console.error('[FederationRelayClient] Reconnect failed:', error);
      });
    }, delay);
  }

  private sendRaw(message: RelayMessage): void {
    if (!this.connected || !this.socket) {
      throw new Error('Not connected to federation relay');
    }
    this.socket.send(JSON.stringify(message));
  }

  /**
   * Send a message and wait for a correlated response.
   * Used for request-response patterns.
   */
  private async sendAndWait(type: string, payload: any, timeoutMs = REQUEST_TIMEOUT_MS): Promise<RelayMessage> {
    const correlationId = createHash('sha256').update(`${type}-${Date.now()}-${Math.random()}`).digest('hex').slice(0, 16);
    const message: RelayMessage = {
      id: this.generateMessageId(),
      type,
      source: this.config.agentId,
      payload,
      timestamp: new Date().toISOString(),
      metadata: { correlationId },
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(correlationId);
        reject(new Error(`Request ${type} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(correlationId, { resolve, reject, timeout });
      this.sendRaw(message);
    });
  }

  /** Send a message to a channel (fire-and-forget) */
  sendChannelMessage(channelId: string, content: string): void {
    const message: RelayMessage = {
      id: this.generateMessageId(),
      type: 'CHANNEL_MESSAGE',
      source: this.config.agentId,
      payload: { channelId, content },
      timestamp: new Date().toISOString(),
    };
    this.sendRaw(message);
  }

  /** Create a new channel */
  async createChannel(name: string, description: string): Promise<RelayMessage> {
    return this.sendAndWait('CREATE_CHANNEL', { name, description });
  }

  /** Join an existing channel */
  async joinChannel(channelId: string): Promise<RelayMessage> {
    return this.sendAndWait('JOIN_CHANNEL', { channelId });
  }

  getState(): { connected: boolean; authenticated: boolean; agentId: string; reconnectAttempts: number } {
    return {
      connected: this.connected,
      authenticated: this._authenticated,
      agentId: this.config.agentId,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  async close(): Promise<void> {
    this.explicitlyClosed = true;
    this.stopHeartbeat();
    // Reject all pending requests
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Client closed'));
    }
    this.pendingRequests.clear();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}