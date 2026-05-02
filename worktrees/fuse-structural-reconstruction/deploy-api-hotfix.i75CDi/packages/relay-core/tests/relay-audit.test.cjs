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
