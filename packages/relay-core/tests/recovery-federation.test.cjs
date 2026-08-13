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
