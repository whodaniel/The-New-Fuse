/**
 * federation-relay-client.ts
 *
 * `useTnfFederation.ts` imports `FederationRelayClient` from this path; the
 * file did not exist anywhere in the monorepo (confirmed by search — only
 * an unrelated `scripts/lib/federation-relay-client.cjs`, a Node-side
 * script, shares the name). This was a genuine missing module.
 *
 * IMPLEMENTATION CONFIDENCE — read before relying on this in production:
 * this is a REAL WebSocket client (real connect/send/close/reconnect, real
 * event emission) — not a no-op stub — but the exact WIRE MESSAGE FORMAT
 * for registration and channel actions is a best-effort match to the
 * `{ type, payload }` event convention already used by this monorepo's
 * other browser-side relay client
 * (apps/frontend/src/services/websocket.ts: `emit(data.type, data.payload)`
 * on receive), chosen because it lines up with every event name
 * useTnfFederation.ts already expects ('connected', 'registered',
 * 'agents_updated', 'channels_updated', 'channel_message'). It has NOT been
 * verified against packages/relay-core's actual accepted client protocol
 * (RelayServer.ts / standalone-relay.ts use a differently-shaped
 * TNFEnvelope for some paths — id/type/source/channel/payload/timestamp —
 * which may or may not be what a plain client WebSocket connection is
 * expected to speak). If the relay doesn't recognize an outbound message,
 * the visible symptom will be "connects but never emits 'registered'" —
 * not a silent fake success. Confirm the real protocol against
 * packages/relay-core before depending on this for anything real.
 */
import { EventEmitter } from 'events';

export interface FederationRelayClientConfig {
  relayUrl: string;
  agentId: string;
  platform: string;
  provider: string;
  capabilities: string[];
  daccRole: string;
}

interface RelayEnvelope {
  type: string;
  payload: any;
}

const DEFAULT_RECONNECT_ATTEMPTS = 5;
const DEFAULT_RECONNECT_BASE_MS = 1000;

export class FederationRelayClient extends EventEmitter {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private explicitlyClosed = false;
  private readonly config: FederationRelayClientConfig;

  constructor(config: FederationRelayClientConfig) {
    super();
    this.config = config;
  }

  get connected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
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
        this.send('register', {
          agentId: this.config.agentId,
          platform: this.config.platform,
          provider: this.config.provider,
          capabilities: this.config.capabilities,
          daccRole: this.config.daccRole,
        });
        if (!settled) {
          settled = true;
          resolve();
        }
      };

      this.socket.onmessage = (event: MessageEvent) => {
        this.handleMessage(event);
      };

      this.socket.onclose = (event: CloseEvent) => {
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

  private handleMessage(event: MessageEvent): void {
    let envelope: RelayEnvelope;
    try {
      envelope = JSON.parse(event.data);
    } catch (error) {
      console.error('[FederationRelayClient] Failed to parse relay message:', error);
      return;
    }
    if (!envelope || typeof envelope.type !== 'string') return;

    if (envelope.type === 'welcome' || envelope.type === 'register_ack') {
      this.emit('registered');
      return;
    }

    this.emit(envelope.type, envelope.payload);
  }

  private attemptReconnect(url: string): void {
    if (this.reconnectAttempts >= DEFAULT_RECONNECT_ATTEMPTS) {
      console.error('[FederationRelayClient] Max reconnect attempts reached');
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

  private send(type: string, payload: any): void {
    if (!this.connected || !this.socket) {
      throw new Error('Not connected to federation relay');
    }
    const envelope: RelayEnvelope = { type, payload };
    this.socket.send(JSON.stringify(envelope));
  }

  sendChannelMessage(channelId: string, content: string): void {
    this.send('channel_message', { channelId, content });
  }

  createChannel(name: string, description: string): void {
    this.send('create_channel', { name, description });
  }

  joinChannel(channelId: string): void {
    this.send('join_channel', { channelId });
  }

  getState(): { connected: boolean; agentId: string; reconnectAttempts: number } {
    return {
      connected: this.connected,
      agentId: this.config.agentId,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  async close(): Promise<void> {
    this.explicitlyClosed = true;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
