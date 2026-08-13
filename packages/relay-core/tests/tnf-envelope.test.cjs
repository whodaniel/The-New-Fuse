/**
 * TNF Envelope helper tests.
 *
 * Covers the small but easy-to-regress helpers in tnf-envelope that produce
 * identity normalization, audit traces, message type predicates, and the
 * fluent builder. Together they form the contract every Relay/Redis bridge
 * caller relies on; tests run via `npm test` in this package.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createTNFEnvelope,
  isTaskMessage,
  isEventMessage,
  requiresResponse,
  TNFMessageBuilder,
  normalizeTNFEnvelope,
  // re-exported schemas
  TNFEnvelope,
} = require('../dist/protocol/tnf-envelope.js');

const AGENT_FROM = {
  agentId: 'agent-alpha',
  platform: 'browser-tab',
};

const AGENT_TO = {
  agentId: 'agent-bravo',
  platform: 'cursor-tab',
};

test('createTNFEnvelope attaches a stable audit trace when metadata provides one', () => {
  const envelope = createTNFEnvelope(
    'task',
    AGENT_FROM,
    AGENT_TO,
    { prompt: 'summarize the doc' },
    { channelId: 'Green', sessionId: 'sess-1' },
    { traceId: 'trace-fixed-001' }
  );

  assert.equal(envelope.traceId, 'trace-fixed-001');
  assert.equal(envelope.type, 'task');
  assert.equal(envelope.metadata.audit.traceId, 'trace-fixed-001');
  assert.equal(envelope.metadata.audit.channelId, 'Green');
  assert.equal(envelope.metadata.audit.actor, 'agent-alpha');
  assert.equal(envelope.metadata.audit.source, 'browser-tab');
});

test('createTNFEnvelope re-uses caller-supplied audit when partial', () => {
  const envelope = createTNFEnvelope(
    'event',
    AGENT_FROM,
    { broadcast: true },
    { kind: 'status' },
    { channelId: 'Yellow' },
    { audit: { actor: 'override-actor', traceId: 'preserve-me' } }
  );

  assert.equal(envelope.metadata.audit.actor, 'override-actor');
  assert.equal(envelope.metadata.audit.traceId, 'preserve-me');
  // broadcast recipient should be preserved untouched
  assert.equal(envelope.to.broadcast, true);
});

test('message type predicates classify task/event/query correctly', () => {
  const task = createTNFEnvelope('task', AGENT_FROM, AGENT_TO, {});
  const event = createTNFEnvelope('event', AGENT_FROM, AGENT_TO, {});
  const query = createTNFEnvelope('query', AGENT_FROM, AGENT_TO, {});
  const stateSync = createTNFEnvelope('state_sync', AGENT_FROM, AGENT_TO, {});

  assert.equal(isTaskMessage(task), true);
  assert.equal(isTaskMessage(event), false);
  assert.equal(isEventMessage(event), true);
  assert.equal(requiresResponse(task), true);
  assert.equal(requiresResponse(query), true);
  assert.equal(requiresResponse(stateSync), false);
});

test('normalizeTNFEnvelope fills in identity aliases and dedupes them', () => {
  const raw = createTNFEnvelope(
    'event',
    {
      agentId: 'agent-charlie',
      aliases: ['charlie', 'agent-charlie', 'charlie-handle'],
    },
    AGENT_TO,
    {}
  );

  const normalized = normalizeTNFEnvelope(raw);
  assert.ok(normalized.from.aliases.includes('agent-charlie'));
  assert.ok(normalized.from.aliases.includes('charlie'));
  // duplicates from input should collapse
  const counts = normalized.from.aliases.reduce((acc, alias) => {
    acc[alias] = (acc[alias] || 0) + 1;
    return acc;
  }, {});
  for (const alias of Object.keys(counts)) {
    assert.equal(counts[alias], 1, `${alias} should appear only once`);
  }
});

test('TNFMessageBuilder produces a schema-valid envelope end-to-end', () => {
  const envelope = new TNFMessageBuilder()
    .type('response')
    .from(AGENT_FROM)
    .to(AGENT_TO)
    .payload({ content: 'ack' })
    .context({ channelId: 'Blue', sessionId: 'sess-builder' })
    .traceId('builder-trace-42')
    .build();

  // validateJ equal-shape round-trip survives
  const reparsed = TNFEnvelope.parse(envelope);
  assert.equal(reparsed.type, 'response');
  assert.equal(reparsed.context.channelId, 'Blue');
  assert.equal(reparsed.traceId, 'builder-trace-42');
});
