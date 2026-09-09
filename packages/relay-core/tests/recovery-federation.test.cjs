const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildStallRecoveryFrame,
  buildStallRecoveryContent,
  buildStallRecoveryFederationMetadata,
} = require('../dist/contracts/recovery-federation.js');

test('buildStallRecoveryFrame emits federation-aware content', () => {
  const frame = buildStallRecoveryFrame({
    channelId: 'Green',
    relaySessionId: 'relay-session-001',
    conversationId: 'conv-green-123',
    attemptNumber: 1,
    maxAttempts: 3,
    idleTimeMs: 47000,
    messageCount: 12,
    participants: [
      'page-agent-791365559-iq04u',
      'page-agent-791365552-6jgnr',
      'browser-1779090727740-k3tkyx34b',
    ],
  });

  assert.match(frame.content, /^\[TNF:STALL_RECOVERY\]/);
  assert.match(frame.content, /channel=Green attempt=1\/3 idle=47s msgs=12/);
  assert.match(frame.content, /from=BROKER-Green ID#:/);
  assert.match(frame.content, /page-iq04\(page-agent/);
  assert.match(frame.content, /page-6jgn\(page-agent/);
  assert.match(frame.content, /@Browser\(/);
  assert.match(frame.content, /lineage: mcid=/);
  assert.match(frame.content, /gates: STALL_RECOVERY_GATE=allow CHANNEL_MEMBERSHIP_GATE=allow/);
  assert.equal(frame.metadata.eventType, 'stall_recovery');
  assert.equal(frame.metadata.daccRole, 'broker');
  assert.ok(frame.metadata.mcid);
});

test('recovery content escalates by attempt number', () => {
  const metadata = buildStallRecoveryFederationMetadata({
    channelId: 'Green',
    relaySessionId: 'relay-session-001',
    conversationId: 'conv-green-123',
    attemptNumber: 3,
  });

  const finalContent = buildStallRecoveryContent(
    {
      channelId: 'Green',
      relaySessionId: 'relay-session-001',
      conversationId: 'conv-green-123',
      attemptNumber: 3,
      maxAttempts: 3,
      idleTimeMs: 120000,
      messageCount: 4,
      participants: ['page-agent-glm'],
    },
    metadata
  );

  assert.match(finalContent, /Final recovery \(3\/3\)/);
  assert.match(finalContent, /COMPLETE to end monitoring/);
});

const Ajv2020 = require('ajv/dist/2020').default;
const addFormats = require('ajv-formats');
const { normalizeCanonicalEntityId } = require('../dist/contracts/identity.js');
const schema = require('../../../docs/protocols/schemas/tnf-master-cumulative-id.schema.json');
const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
const validateMcid = ajv.compile(schema);

function validateEmittedIdentities(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    if (key === 'canonicalEntityId' && item != null) {
      assert.equal(normalizeCanonicalEntityId(item), item);
    }
    if (key === 'idNumber' && item != null) assert.match(item, /^ID#:[1-9A-HJ-NP-Za-km-z]+$/);
    if (key === 'mcid') assert.ok(validateMcid(item), JSON.stringify(validateMcid.errors));
    validateEmittedIdentities(item);
  }
}

test('recovery builder identities round-trip canonical validators', () => {
  for (const conversationId of [
    undefined,
    'conv-green-123',
    '52d65588-d49d-49aa-8e87-806e2b88640c',
  ]) {
    const frame = buildStallRecoveryFrame({
      channelId: 'Green',
      relaySessionId: 'relay-test',
      conversationId,
      attemptNumber: 1,
      idleTimeMs: 47000,
      messageCount: 12,
    });
    validateEmittedIdentities(frame);
    assert.equal(
      frame.metadata.mcid.lineage.causation_id,
      conversationId?.length === 36 ? conversationId : null
    );
  }
});

test('missing or invalid recovery display IDs are omitted', () => {
  for (const idNumber of [undefined, null, '', 'ID#:???', 'ID#:STALL_RECOVERY']) {
    const content = buildStallRecoveryContent(
      {
        channelId: 'Green',
        relaySessionId: 'relay-test',
        attemptNumber: 1,
        idleTimeMs: 1,
        messageCount: 0,
      },
      { idNumber }
    );
    assert.match(content, /from=BROKER dacc=broker/);
    assert.doesNotMatch(content, /ID#:/);
  }
});

test(
  'standalone recovery emits valid identities over a real WebSocket',
  // Spins a real WebSocket server and does two round trips. 10s was enough
  // in isolation but node:test runs files in parallel, so on a loaded box
  // this was cancelled rather than failed. The assertions are unchanged.
  { timeout: 30000 },
  async () => {
    const { once } = require('node:events');
    const WebSocket = require('ws');
    const TNFRelayServer = require('../dist/standalone-relay.js').default;
    const wss = new WebSocket.WebSocketServer({ host: '127.0.0.1', port: 0 });
    await once(wss, 'listening');
    const connection = once(wss, 'connection');
    const client = new WebSocket(`ws://127.0.0.1:${wss.address().port}`);
    const [socket] = await connection;
    await once(client, 'open');
    try {
      // Exercise the production emitter and serializer with actual sockets,
      // independently of unrelated Redis registration and persistence services.
      const relay = Object.create(TNFRelayServer.prototype);
      relay.sessionId = 'relay-emit-test';
      relay.channels = new Map([['Green', { members: new Set(['observer']) }]]);
      relay.sockets = new Map([['observer', socket]]);
      relay.maxBufferedAmount = 1048576;
      const idNumbers = [];
      const mcids = [];
      for (let attempt = 1; attempt <= 2; attempt++) {
        const received = once(client, 'message');
        relay.sendRecoveryMessage('Green', 'Continue the conversation', { attemptNumber: attempt });
        const [raw] = await received;
        const frame = JSON.parse(raw.toString());
        assert.equal(frame.type, 'CHANNEL_MESSAGE');
        validateEmittedIdentities(frame);
        const payload = frame.payload;
        assert.deepEqual(payload.mcid, payload.federation.mcid);
        assert.deepEqual(payload.mcid, payload.metadata.mcid);
        assert.equal(payload.mcid.scope.channel_id, 'Green');
        assert.equal(payload.mcid.scope.session_key, 'relay-emit-test');
        assert.equal(payload.mcid.lineage.causation_id, null);
        assert.equal(payload.metadata.idNumber, payload.idNumber);
        idNumbers.push(payload.idNumber);
        mcids.push(payload.mcid.id);
      }
      assert.equal(idNumbers[0], idNumbers[1]);
      assert.notEqual(mcids[0], mcids[1]);
    } finally {
      client.terminate();
      socket.terminate();
      await new Promise((resolve) => wss.close(resolve));
    }
  }
);
