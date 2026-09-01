/**
 * Live two-client channel round-trip test against the standalone relay.
 *
 * Opt-in (requires a running relay, default ws://127.0.0.1:3007/ws):
 *   TNF_LIVE_RELAY=1 node_modules/.bin/jest \
 *     --config apps/browser-control-surfaces/jest.config.js \
 *     --rootDir apps/browser-control-surfaces \
 *     --testPathPattern "federation-relay-client.live.test"
 */
import { FederationRelayClient } from './federation-relay-client';

const RELAY_URL = process.env.TNF_RELAY_URL ?? 'ws://127.0.0.1:3007/ws';
const RUN_LIVE = process.env.TNF_LIVE_RELAY === '1';

const d = (require as any).util ?? {};
const describeLive = RUN_LIVE ? describe : describe.skip;

function makeClient(agentId: string): FederationRelayClient {
  return new FederationRelayClient({
    relayUrl: RELAY_URL,
    agentId,
    platform: 'worker/test',
    provider: 'jest-live',
    capabilities: ['smoke-test'],
    daccRole: 'participant',
  });
}

async function connectAndAwaitRegistration(client: FederationRelayClient): Promise<void> {
  const registered = new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('registration timeout')), 10000);
    client.once('registered', () => {
      clearTimeout(t);
      resolve();
    });
    client.once('registration_error', (p) => {
      clearTimeout(t);
      reject(new Error(`registration_error: ${JSON.stringify(p)}`));
    });
  });
  await client.connect();
  await registered;
}

describeLive('FederationRelayClient — live two-client channel round-trip', () => {
  jest.setTimeout(45000);

  let alice: FederationRelayClient;
  let bob: FederationRelayClient;

  beforeAll(async () => {
    alice = makeClient(`roundtrip-alice-${Date.now()}`);
    bob = makeClient(`roundtrip-bob-${Date.now()}`);
    await connectAndAwaitRegistration(alice);
    await connectAndAwaitRegistration(bob);
  });

  afterAll(async () => {
    await alice?.close();
    await bob?.close();
  });

  it('alice creates a channel and receives CHANNEL_CREATED', async () => {
    const res = await alice.createChannel(
      `roundtrip-${Date.now()}`,
      'live round-trip test channel',
    );
    expect(['CHANNEL_CREATED', 'CHANNEL_JOINED']).toContain(res.type);
    expect(res.payload.channel.id).toBeDefined();
  });

  it('message from bob reaches alice on the shared channel', async () => {
    const channelName = `roundtrip-msg-${Date.now()}`;

    const created = await alice.createChannel(channelName, 'msg channel');
    const channelId = created.payload.channel.id;

    // Both join; CHANNEL_JOIN is silent — membership confirmed by delivery
    alice.joinChannel(channelId);
    bob.joinChannel(channelId);
    // Give the relay a beat to sync membership
    await new Promise((r) => setTimeout(r, 500));

    const received = new Promise<any>((resolve, reject) => {
      const t = setTimeout(
        () => reject(new Error('alice did not receive message within 10s')),
        10000,
      );
      alice.once('channel_message', (payload: any) => {
        clearTimeout(t);
        resolve(payload);
      });
    });

    bob.sendChannelMessage(channelId, 'hello from bob');

    const msg = await received;
    expect(msg.from).toBe(bob.getState().agentId);
    expect(msg.content).toBe('hello from bob');
    expect(msg.channel).toBe(channelId);
  });

  it('both clients stay connected with authenticated=false (no JWT)', () => {
    expect(alice.getState().connected).toBe(true);
    expect(bob.getState().connected).toBe(true);
    expect(alice.getState().authenticated).toBe(false);
  });
});
