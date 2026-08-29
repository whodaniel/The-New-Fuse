/**
 * Integration tests for FederationRelayClient against the canonical
 * relay-core wire protocol (RelayMessage / TNFEnvelope).
 */
import {
  FederationRelayClient,
  FederationRelayClientConfig,
} from './federation-relay-client';

type Handler = (event: any) => void;

class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;
  static instances: MockWebSocket[] = [];

  readyState = 0;
  onopen: Handler | null = null;
  onmessage: Handler | null = null;
  onclose: Handler | null = null;
  onerror: Handler | null = null;
  sent: string[] = [];

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose({ wasClean: true });
    }
  }

  // Test helpers
  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    if (this.onopen) this.onopen({});
  }

  simulateMessage(message: unknown): void {
    if (this.onmessage) this.onmessage({ data: JSON.stringify(message) });
  }

  lastSent(): any {
    return JSON.parse(this.sent[this.sent.length - 1]);
  }
}

const baseConfig = {
  relayUrl: 'ws://localhost:9999',
  agentId: 'test-agent-1',
  platform: 'worker/test',
  provider: 'test-provider',
  capabilities: ['testing'],
  daccRole: 'participant',
};

function makeClient(overrides: Partial<FederationRelayClientConfig> = {}) {
  const config = { ...baseConfig, ...overrides };
  const client = new FederationRelayClient(config);
  return { client, config };
}

function connectAndRegister(client: FederationRelayClient): Promise<MockWebSocket> {
  const p = client.connect();
  const ws = MockWebSocket.instances[MockWebSocket.instances.length - 1];
  ws.simulateOpen();
  ws.simulateMessage({
    id: 'relay-1',
    type: 'REGISTRATION_CONFIRMED',
    source: 'relay',
    target: baseConfig.agentId,
    payload: { authenticated: true, relayInfo: { url: baseConfig.relayUrl } },
    timestamp: new Date().toISOString(),
  });
  return p.then(() => ws);
}

beforeEach(() => {
  jest.useFakeTimers();
  MockWebSocket.instances = [];
  (global as any).WebSocket = MockWebSocket;
});

afterEach(() => {
  jest.useRealTimers();
});

describe('FederationRelayClient', () => {
  it('sends a canonical REGISTER message on connect', async () => {
    const { client } = makeClient({ authToken: 'jwt-token-123' });
    await connectAndRegister(client);

    const ws = MockWebSocket.instances[0];
    expect(ws.sent.length).toBe(1);
    const msg = ws.lastSent();

    expect(msg.type).toBe('REGISTER');
    expect(msg.source).toBe(baseConfig.agentId);
    expect(msg.id).toContain(baseConfig.agentId);
    expect(typeof msg.timestamp).toBe('string');
    expect(msg.payload.id).toBe(baseConfig.agentId);
    expect(msg.payload.platform).toBe(baseConfig.platform);
    expect(msg.payload.capabilities).toEqual(baseConfig.capabilities);
    expect(msg.payload.metadata.provider).toBe(baseConfig.provider);
    expect(msg.payload.metadata.daccRole).toBe(baseConfig.daccRole);
    expect(msg.payload.token).toBe('jwt-token-123');
    expect(msg.metadata.token).toBe('jwt-token-123');

    await client.close();
  });

  it('marks itself authenticated and emits registered on REGISTRATION_CONFIRMED', async () => {
    const { client } = makeClient();
    const registeredPayloads: any[] = [];
    client.on('registered', (payload: any) => registeredPayloads.push(payload));

    await connectAndRegister(client);

    expect(client.authenticated).toBe(true);
    expect(registeredPayloads).toHaveLength(1);
    expect(registeredPayloads[0].authenticated).toBe(true);

    await client.close();
  });

  it('emits registration_error and stays unauthenticated on REGISTRATION_ERROR', async () => {
    const { client } = makeClient({ authToken: 'bad-token' });
    const errors: any[] = [];
    client.on('registration_error', (payload: any) => errors.push(payload));

    const p = client.connect();
    const ws = MockWebSocket.instances[MockWebSocket.instances.length - 1];
    ws.simulateOpen();
    ws.simulateMessage({
      id: 'relay-err',
      type: 'REGISTRATION_ERROR',
      source: 'relay',
      payload: { code: 'AUTH_FAILED', error: 'invalid token' },
      timestamp: new Date().toISOString(),
    });
    await p;

    expect(client.authenticated).toBe(false);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('AUTH_FAILED');

    await client.close();
  });

  it('resolves createChannel on CHANNEL_CREATED from relay', async () => {
    const { client } = makeClient();
    const ws = await connectAndRegister(client);

    const pending = client.createChannel('ops', 'Operations channel');
    await Promise.resolve();
    const request = ws.lastSent();
    expect(request.type).toBe('CHANNEL_CREATE');
    expect(request.payload).toEqual({ name: 'ops', description: 'Operations channel' });

    ws.simulateMessage({
      id: 'relay-ch',
      type: 'CHANNEL_CREATED',
      source: 'relay',
      payload: { channel: { id: 'ch-1', name: 'ops' } },
      timestamp: new Date().toISOString(),
    });

    const response = await pending;
    expect(response.type).toBe('CHANNEL_CREATED');
    expect(response.payload.channel.id).toBe('ch-1');

    await client.close();
  });

  it('resolves createChannel with CHANNEL_JOINED when channel already exists', async () => {
    const { client } = makeClient();
    const ws = await connectAndRegister(client);

    const pending = client.createChannel('dup', '');
    await Promise.resolve();

    ws.simulateMessage({
      id: 'relay-j',
      type: 'CHANNEL_JOINED',
      source: 'relay',
      payload: { channel: { id: 'ch-dup', name: 'dup' }, wasExisting: true },
      timestamp: new Date().toISOString(),
    });

    const response = await pending;
    expect(response.type).toBe('CHANNEL_JOINED');
    expect(response.payload.wasExisting).toBe(true);

    await client.close();
  });

  it('rejects pending requests when relay sends ERROR', async () => {
    const { client } = makeClient();
    await connectAndRegister(client);

    const pending = client.createChannel('bad', '');
    await Promise.resolve();

    MockWebSocket.instances[0].simulateMessage({
      id: 'relay-e',
      type: 'ERROR',
      source: 'relay',
      payload: { message: 'channel quota exceeded' },
      timestamp: new Date().toISOString(),
    });

    await expect(pending).rejects.toThrow('channel quota exceeded');

    await client.close();
  });

  it('sends CHANNEL_JOIN fire-and-forget', async () => {
    const { client } = makeClient();
    const ws = await connectAndRegister(client);

    client.joinChannel('ch-42');
    const msg = ws.lastSent();
    expect(msg.type).toBe('CHANNEL_JOIN');
    expect(msg.payload).toEqual({ channelId: 'ch-42' });

    await client.close();
  });

  it('times out correlated requests', async () => {
    const { client } = makeClient();
    await connectAndRegister(client);

    const pending = client.createChannel('slow', '');
    jest.advanceTimersByTime(10000);
    await expect(pending).rejects.toThrow(/timed out/);

    await client.close();
  });

  it('sends channel messages as MESSAGE_SEND with top-level channel', async () => {
    const { client } = makeClient();
    const ws = await connectAndRegister(client);

    client.sendChannelMessage('ch-9', 'hello relay');
    const msg = ws.lastSent();
    expect(msg.type).toBe('MESSAGE_SEND');
    expect(msg.source).toBe(baseConfig.agentId);
    expect(msg.channel).toBe('ch-9');
    expect(msg.target).toBe('broadcast');
    expect(msg.payload).toEqual({ to: 'broadcast', content: 'hello relay' });

    await client.close();
  });

  it('delivers inbound CHANNEL_MESSAGE payloads to listeners', async () => {
    const { client } = makeClient();
    const ws = await connectAndRegister(client);

    const received: any[] = [];
    client.on('channel_message', (payload: any) => received.push(payload));

    ws.simulateMessage({
      id: 'relay-m',
      type: 'CHANNEL_MESSAGE',
      source: 'relay',
      payload: {
        id: 'msg-1',
        type: 'text',
        from: 'other-agent',
        content: 'round trip!',
        channel: 'ch-9',
        timestamp: Date.now(),
      },
      timestamp: new Date().toISOString(),
    });

    expect(received).toHaveLength(1);
    expect(received[0].from).toBe('other-agent');
    expect(received[0].content).toBe('round trip!');

    await client.close();
  });

  it('throws when sending while disconnected', () => {
    const { client } = makeClient();
    expect(() => client.sendChannelMessage('ch', 'x')).toThrow(
      'Not connected to federation relay',
    );
  });

  it('maps inbound relay events to hook event names', async () => {
    const { client } = makeClient();
    const ws = await connectAndRegister(client);

    const seen: string[] = [];
    client.on('channel_message', () => seen.push('channel_message'));
    client.on('agents_updated', () => seen.push('agents_updated'));
    client.on('agent_left', () => seen.push('agent_left'));

    const envelope = (type: string) => ({
      id: 'x-' + type,
      type,
      source: 'relay',
      payload: {},
      timestamp: new Date().toISOString(),
    });
    ws.simulateMessage(envelope('CHANNEL_MESSAGE'));
    ws.simulateMessage(envelope('AGENTS_UPDATED'));
    ws.simulateMessage(envelope('AGENT_LEFT'));
    ws.simulateMessage(envelope('HEARTBEAT_ACK'));

    expect(seen).toEqual(['channel_message', 'agents_updated', 'agent_left']);

    await client.close();
  });

  it('maps live relay broadcast types AGENT_LIST/CHANNEL_LIST to hook events', async () => {
    const { client } = makeClient();
    const ws = await connectAndRegister(client);

    const agents: any[][] = [];
    const channels: any[][] = [];
    client.on('agents_updated', (p: any[]) => agents.push(p));
    client.on('channels_updated', (p: any[]) => channels.push(p));

    ws.simulateMessage({
      id: 'r-a',
      type: 'AGENT_LIST',
      source: 'relay',
      payload: { agents: [{ id: 'a1' }] },
      timestamp: new Date().toISOString(),
    });
    ws.simulateMessage({
      id: 'r-c',
      type: 'CHANNEL_LIST',
      source: 'relay',
      payload: { channels: [{ id: 'c1' }] },
      timestamp: new Date().toISOString(),
    });

    expect(agents).toHaveLength(1);
    expect(agents[0]).toEqual([{ id: 'a1' }]);
    expect(channels).toHaveLength(1);
    expect(channels[0]).toEqual([{ id: 'c1' }]);

    await client.close();
  });

  it('emits heartbeat_ack on HEARTBEAT_ACK', async () => {
    const { client } = makeClient();
    const ws = await connectAndRegister(client);

    const acks: any[] = [];
    client.on('heartbeat_ack', (p: any) => acks.push(p));

    ws.simulateMessage({
      id: 'r-h',
      type: 'HEARTBEAT_ACK',
      source: 'relay',
      payload: { ok: true },
      timestamp: new Date().toISOString(),
    });

    expect(acks).toHaveLength(1);
    expect(acks[0].ok).toBe(true);

    await client.close();
  });

  it('sends heartbeats after registration', async () => {
    const { client } = makeClient();
    const ws = await connectAndRegister(client);
    const countAfterRegister = ws.sent.length;

    jest.advanceTimersByTime(30000);
    expect(ws.sent.length).toBeGreaterThan(countAfterRegister);
    expect(ws.lastSent().type).toBe('HEARTBEAT');

    await client.close();
  });

  it('stops heartbeats and rejects pending work on close', async () => {
    const { client } = makeClient();
    const ws = await connectAndRegister(client);

    const pending = client.createChannel('ch-1', '');
    await Promise.resolve();

    await client.close();
    await expect(pending).rejects.toThrow('Client closed');
    expect(ws.readyState).toBe(MockWebSocket.CLOSED);
    expect(client.getState().connected).toBe(false);
  });

  it('reports state via getState()', async () => {
    const { client } = makeClient();
    expect(client.getState()).toEqual({
      connected: false,
      authenticated: false,
      agentId: baseConfig.agentId,
      reconnectAttempts: 0,
    });

    await connectAndRegister(client);
    const state = client.getState();
    expect(state.connected).toBe(true);
    expect(state.authenticated).toBe(true);

    await client.close();
  });
});
