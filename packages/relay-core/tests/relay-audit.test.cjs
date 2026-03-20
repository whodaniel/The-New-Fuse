const test = require('node:test');
const assert = require('node:assert/strict');

const { createTNFEnvelope } = require('../dist/protocol/tnf-envelope.js');
const { RedisRelayBridge } = require('../dist/redis-relay-bridge.js');
const TNFRelayServer = require('../dist/standalone-relay.js').default;

test('legacy relay messages are wrapped with normalized identity and audit metadata', () => {
  const bridge = Object.create(RedisRelayBridge.prototype);

  const envelope = bridge.wrapLegacyMessage(
    {
      channel: 'General',
      platform: 'browser-tab',
      payload: {
        metadata: {
          legacyMarker: true,
        },
      },
    },
    'agent-legacy-1'
  );

  assert.equal(envelope.from.agentId, 'agent-legacy-1');
  assert.equal(envelope.from.operationalHandle, 'agent-legacy-1');
  assert.equal(envelope.from.runtimeSessionId, 'agent-legacy-1');
  assert.equal(envelope.from.platform, 'browser-tab');
  assert.equal(envelope.metadata.legacyMarker, true);
  assert.equal(envelope.metadata.audit.source, 'redis-relay-bridge');
  assert.equal(envelope.metadata.audit.actor, 'agent-legacy-1');
  assert.equal(envelope.metadata.audit.channelId, 'General');
});

test('bridge egress preserves envelope metadata for websocket clients', () => {
  const relay = Object.create(TNFRelayServer.prototype);
  let delivered = null;

  relay.ensureChannelExists = () => ({ id: 'General', members: [] });
  relay.syncAgentChannelMembership = () => {};
  relay.broadcastToChannel = (channelId, message) => {
    delivered = { channelId, message };
  };
  relay.broadcast = () => {
    throw new Error('global broadcast should not be used in this test');
  };
  relay.sockets = new Map();

  const envelope = createTNFEnvelope(
    'event',
    {
      agentId: 'ORCHESTRATOR-1',
      operationalHandle: 'ORCHESTRATOR',
      runtimeSessionId: 'ORCHESTRATOR-1',
      role: 'orchestrator',
      platform: 'master-clock',
    },
    { broadcast: true },
    {
      content: 'Bridge event',
      channel: 'General',
      metadata: {
        payloadMarker: true,
      },
    },
    {
      channelId: 'General',
      sessionId: 'ORCHESTRATOR-1',
    },
    {
      metadata: {
        relayMarker: true,
      },
      audit: {
        source: 'master-clock',
        actor: 'ORCHESTRATOR',
      },
    }
  );

  relay.handleBridgeEgress(envelope);

  assert.ok(delivered);
  assert.equal(delivered.channelId, 'General');
  assert.equal(delivered.message.metadata.relayMarker, true);
  assert.equal(delivered.message.payload.metadata.payloadMarker, true);
  assert.equal(delivered.message.payload.metadata.relayMarker, true);
  assert.equal(delivered.message.payload.metadata.audit.source, 'master-clock');
  assert.equal(delivered.message.payload.metadata.audit.actor, 'ORCHESTRATOR');
});

test('bridge approval emits an audited activity event at the decision point', () => {
  const relay = Object.create(TNFRelayServer.prototype);
  let eventRecord = null;
  let subscriptionTarget = null;

  relay.pendingBridgeAgents = new Map([
    [
      'agent-bridge-1',
      {
        agent: {
          id: 'agent-bridge-1',
          name: 'Bridge Agent',
          platform: 'browser',
        },
        requestedAt: 123,
      },
    ],
  ]);
  relay.approvedBridgeAgents = new Set();
  relay.agents = new Map();
  relay.sockets = new Map();
  relay.bridgeGateEnabled = true;
  relay.ensureBridgeSubscription = (agentId) => {
    subscriptionTarget = agentId;
  };
  relay.send = () => {};
  relay.emitRelayActivityEvent = (eventType, content, metadata, operator) => {
    eventRecord = { eventType, content, metadata, operator };
  };

  const success = relay.approveBridgeAccess('agent-bridge-1', {
    actor: 'local-super-admin',
    remoteAddress: '127.0.0.1',
    userAgent: 'node-test',
  });

  assert.equal(success, true);
  assert.equal(subscriptionTarget, 'agent-bridge-1');
  assert.ok(eventRecord);
  assert.equal(eventRecord.eventType, 'bridge_access_approved');
  assert.equal(eventRecord.metadata.bridgeDecision, 'approve');
  assert.equal(eventRecord.metadata.agentId, 'agent-bridge-1');
  assert.equal(eventRecord.operator.actor, 'local-super-admin');
});

test('task dispatch persistence uses internal ingest endpoint and shared secret header', async () => {
  const relay = Object.create(TNFRelayServer.prototype);
  const originalFetch = globalThis.fetch;
  const originalIngestUrl = process.env.LEDGER_INTERNAL_INGEST_URL;
  const originalSecret = process.env.TNF_INTERNAL_INGEST_SECRET;
  const calls = [];

  process.env.LEDGER_INTERNAL_INGEST_URL =
    'http://localhost:3001/api/unified-ledger/internal/ingest/orchestration';
  process.env.TNF_INTERNAL_INGEST_SECRET = 'relay-secret';
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true };
  };

  try {
    await relay.persistTaskDispatch(
      {
        id: 'task-1',
        title: 'Dispatch task',
        description: 'Validate internal ingest contract',
      },
      'General'
    );
  } finally {
    globalThis.fetch = originalFetch;
    process.env.LEDGER_INTERNAL_INGEST_URL = originalIngestUrl;
    process.env.TNF_INTERNAL_INGEST_SECRET = originalSecret;
  }

  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    'http://localhost:3001/api/unified-ledger/internal/ingest/orchestration'
  );
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers['x-tnf-internal-secret'], 'relay-secret');
  const payload = JSON.parse(calls[0].options.body);
  assert.equal(payload.type, 'TASK_DISPATCH');
  assert.equal(payload.action, 'relay_dispatch');
  assert.equal(payload.channelId, 'General');
  assert.equal(payload.task.id, 'task-1');
});

test('relay activity timeline persistence uses internal endpoint and shared secret header', async () => {
  const relay = Object.create(TNFRelayServer.prototype);
  const originalFetch = globalThis.fetch;
  const originalTimelineUrl = process.env.LEDGER_INTERNAL_TIMELINE_URL;
  const originalSecret = process.env.TNF_INTERNAL_INGEST_SECRET;
  const originalTimelineUser = process.env.TNF_INTERNAL_TIMELINE_USER_ID;
  const calls = [];

  process.env.LEDGER_INTERNAL_TIMELINE_URL = 'http://localhost:3001/api/timeline/internal/events';
  process.env.TNF_INTERNAL_INGEST_SECRET = 'relay-secret';
  process.env.TNF_INTERNAL_TIMELINE_USER_ID = 'tnf-relay-user';
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true };
  };

  try {
    await relay.persistRelayActivityTimelineEvent(
      'bridge_access_approved',
      'Approved bridge access for agent-bridge-1',
      1700000000000,
      {
        bridgeDecision: 'approve',
      },
      {
        actor: 'relay-admin-http',
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
    process.env.LEDGER_INTERNAL_TIMELINE_URL = originalTimelineUrl;
    process.env.TNF_INTERNAL_INGEST_SECRET = originalSecret;
    process.env.TNF_INTERNAL_TIMELINE_USER_ID = originalTimelineUser;
  }

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'http://localhost:3001/api/timeline/internal/events');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers['x-tnf-internal-secret'], 'relay-secret');
  const payload = JSON.parse(calls[0].options.body);
  assert.equal(payload.userId, 'tnf-relay-user');
  assert.equal(payload.eventType, 'historical_event');
  assert.equal(payload.actor, 'relay-admin-http');
  assert.equal(payload.payload.relayEventType, 'bridge_access_approved');
});
