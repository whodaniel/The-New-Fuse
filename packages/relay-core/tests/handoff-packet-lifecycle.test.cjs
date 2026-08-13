/**
 * Handoff packet lifecycle unit tests.
 * Protocol: docs/protocols/HANDOFF_PACKET_LIFECYCLE.md
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  classifyPacketLifecycle,
  hasTerminalCoverage,
  parseInboxAgentId,
  softRetirePacketFromLiveIndexes,
  sweepHandoffPacketLifecycle,
  writeVerificationReceipt,
  agentInboxKeys,
  packetKey,
  ackKey,
  verifyKey,
  archivePacketKey,
} = require('../dist/services/handoff-packet-lifecycle.service.js');

function createMemoryRedis() {
  const strings = new Map();
  const lists = new Map();
  const hashes = new Map();

  return {
    strings,
    lists,
    hashes,
    async keys(pattern) {
      const prefix = pattern.replace(/\*$/, '');
      const all = [
        ...strings.keys(),
        ...lists.keys(),
        ...hashes.keys(),
      ];
      return [...new Set(all)].filter((k) => k.startsWith(prefix));
    },
    async get(key) {
      return strings.get(key) ?? null;
    },
    async set(key, value) {
      strings.set(key, String(value));
      return 'OK';
    },
    async del(...keys) {
      let n = 0;
      for (const key of keys) {
        if (strings.delete(key)) n += 1;
        if (lists.delete(key)) n += 1;
        if (hashes.delete(key)) n += 1;
      }
      return n;
    },
    async lrange(key, start, stop) {
      const arr = lists.get(key) || [];
      if (stop === -1) return arr.slice(start);
      return arr.slice(start, stop + 1);
    },
    async lrem(key, _count, value) {
      const arr = lists.get(key) || [];
      const next = arr.filter((v) => v !== value);
      const removed = arr.length - next.length;
      lists.set(key, next);
      return removed;
    },
    async lpush(key, ...values) {
      const arr = lists.get(key) || [];
      arr.unshift(...values);
      lists.set(key, arr);
      return arr.length;
    },
    async ltrim(key, start, stop) {
      const arr = lists.get(key) || [];
      lists.set(key, arr.slice(start, stop + 1));
      return 'OK';
    },
    async expire() {
      return 1;
    },
    async hgetall(key) {
      return { ...(hashes.get(key) || {}) };
    },
    hset(key, field, value) {
      const hash = hashes.get(key) || {};
      hash[field] = value;
      hashes.set(key, hash);
    },
  };
}

test('hasTerminalCoverage requires completed/rejected for every target', () => {
  const packet = { targets: { agentIds: ['a', 'b'] } };
  assert.equal(hasTerminalCoverage(packet, { a: { status: 'completed' } }), false);
  assert.equal(
    hasTerminalCoverage(packet, {
      a: { status: 'completed' },
      b: { status: 'rejected' },
    }),
    true
  );
  assert.equal(
    hasTerminalCoverage(packet, {
      a: { status: 'claimed' },
      b: { status: 'completed' },
    }),
    false
  );
});

test('classifyPacketLifecycle distinguishes dangling verified grace and archive', () => {
  const now = new Date('2026-07-25T12:00:00.000Z');
  assert.equal(
    classifyPacketLifecycle({
      packet: null,
      acksByAgent: {},
      verification: null,
      now,
      archiveGraceMs: 1000,
    }),
    'dangling'
  );

  const packet = {
    targets: { agentIds: ['w1'] },
    expiresAt: '2026-08-01T00:00:00.000Z',
  };
  assert.equal(
    classifyPacketLifecycle({
      packet,
      acksByAgent: { w1: { status: 'completed' } },
      verification: null,
      now,
      archiveGraceMs: 3600000,
    }),
    'incomplete_terminal'
  );

  assert.equal(
    classifyPacketLifecycle({
      packet,
      acksByAgent: { w1: { status: 'completed' } },
      verification: {
        packetId: 'p',
        verifiedAt: '2026-07-25T11:30:00.000Z',
        verifiedBy: 'op',
        result: 'pass',
        evidenceRefs: ['t'],
      },
      now,
      archiveGraceMs: 3600000,
    }),
    'verified_in_grace'
  );

  assert.equal(
    classifyPacketLifecycle({
      packet,
      acksByAgent: { w1: { status: 'completed' } },
      verification: {
        packetId: 'p',
        verifiedAt: '2026-07-24T11:00:00.000Z',
        verifiedBy: 'op',
        result: 'pass',
        evidenceRefs: ['t'],
      },
      now,
      archiveGraceMs: 3600000,
    }),
    'archive_ready'
  );
});

test('parseInboxAgentId handles legacy and store shapes', () => {
  assert.equal(parseInboxAgentId('tnf:handoff:v1:inbox:ORCHESTRATOR-1'), 'ORCHESTRATOR-1');
  assert.equal(parseInboxAgentId('tnf:handoff:v1:inbox:agent:worker-1'), 'worker-1');
});

test('writeVerificationReceipt soft-retires on pass', async () => {
  const redis = createMemoryRedis();
  const packetId = '11111111-1111-4111-8111-111111111111';
  const packet = {
    id: packetId,
    targets: { agentIds: ['worker-1'] },
    scope: { sessionKey: 's1' },
    expiresAt: '2026-08-01T00:00:00.000Z',
  };
  await redis.set(packetKey(packetId), JSON.stringify(packet));
  redis.hset(ackKey(packetId), 'worker-1', JSON.stringify({ status: 'completed' }));
  for (const inbox of agentInboxKeys('worker-1')) {
    await redis.lpush(inbox, packetId);
  }

  const receipt = await writeVerificationReceipt(redis, {
    packetId,
    verifiedAt: '2026-07-25T12:00:00.000Z',
    verifiedBy: 'operator',
    result: 'pass',
    evidenceRefs: ['tests/lifecycle'],
  });

  assert.equal(receipt.result, 'pass');
  assert.equal((await redis.lrange(agentInboxKeys('worker-1')[0], 0, -1)).length, 0);
  assert.equal((await redis.lrange(agentInboxKeys('worker-1')[1], 0, -1)).length, 0);
  assert.ok(await redis.get(verifyKey(packetId)));
});

test('sweep removes dangling and archives past grace', async () => {
  const redis = createMemoryRedis();
  const danglingId = 'dead';
  const readyId = '22222222-2222-4222-8222-222222222222';
  const inbox = agentInboxKeys('ORCHESTRATOR-9')[0];
  await redis.lpush(inbox, danglingId, readyId);

  const packet = {
    id: readyId,
    targets: { agentIds: ['ORCHESTRATOR-9'] },
    expiresAt: '2026-08-01T00:00:00.000Z',
  };
  await redis.set(packetKey(readyId), JSON.stringify(packet));
  redis.hset(ackKey(readyId), 'ORCHESTRATOR-9', JSON.stringify({ status: 'completed' }));
  await redis.set(
    verifyKey(readyId),
    JSON.stringify({
      packetId: readyId,
      verifiedAt: '2026-07-20T00:00:00.000Z',
      verifiedBy: 'op',
      result: 'pass',
      evidenceRefs: ['e1'],
    })
  );

  const result = await sweepHandoffPacketLifecycle(redis, {
    archiveGraceMs: 1000,
    now: () => new Date('2026-07-25T12:00:00.000Z'),
  });

  assert.equal(result.danglingRemoved >= 1, true);
  assert.equal(result.archived, 1);
  assert.equal(await redis.get(packetKey(readyId)), null);
  assert.ok(await redis.get(archivePacketKey(readyId)));
  assert.equal((await redis.lrange(inbox, 0, -1)).includes(readyId), false);
});

test('softRetirePacketFromLiveIndexes is idempotent', async () => {
  const redis = createMemoryRedis();
  const packet = { id: 'p1', targets: { agentIds: ['a1'] } };
  await redis.lpush(agentInboxKeys('a1')[0], 'p1');
  const first = await softRetirePacketFromLiveIndexes(redis, packet);
  const second = await softRetirePacketFromLiveIndexes(redis, packet);
  assert.equal(first, 1);
  assert.equal(second, 0);
});
