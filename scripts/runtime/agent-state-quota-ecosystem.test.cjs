#!/usr/bin/env node
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  writeAgentStateSnapshot,
  pruneHistory,
  refreshQuota,
  markFreshness,
  rankAgentsForDelegation,
  loginProfile,
  readSession,
  logoutProfile,
  readJson,
} = require('./agent-state-quota-ecosystem-lib.cjs');
const { hydrate, orient } = require('./tnf-ecosystem-hydrate.cjs');

function tempHome() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-ase-cjs-'));
  fs.mkdirSync(path.join(root, 'profiles'), { recursive: true, mode: 0o700 });
  fs.mkdirSync(path.join(root, 'metrics'), { recursive: true, mode: 0o700 });
  fs.mkdirSync(path.join(root, 'authority'), { recursive: true, mode: 0o700 });
  fs.writeFileSync(
    path.join(root, 'authority', 'roles.json'),
    JSON.stringify({
      version: 1,
      agents: { 'tnf-local-subdirector': { role: 'sub-director' } },
    })
  );
  return root;
}

test('retention caps + latest recovery after truncated history', () => {
  const tnfHome = tempHome();
  const now = new Date('2026-08-24T16:00:00.000Z');
  const agents = [
    { agentId: 'a1', name: 'alpha', platform: 'claude', isOnline: true, source: 'test' },
  ];
  for (let i = 0; i < 5; i += 1) {
    writeAgentStateSnapshot(tnfHome, 'tester', agents, {
      historyCap: 3,
      now: new Date(now.getTime() + i * 1000),
      writer: `t-${i}`,
    });
  }
  const historyDir = path.join(tnfHome, 'agent-state', 'tester', 'history');
  assert.equal(fs.readdirSync(historyDir).filter((n) => n.endsWith('.json')).length, 3);
  // Simulate truncated latest
  fs.unlinkSync(path.join(tnfHome, 'agent-state', 'tester', 'latest.json'));
  const newest = fs
    .readdirSync(historyDir)
    .filter((n) => n.endsWith('.json'))
    .map((n) => path.join(historyDir, n))
    .sort()
    .at(-1);
  const recovered = readJson(newest);
  fs.writeFileSync(
    path.join(tnfHome, 'agent-state', 'tester', 'latest.json'),
    JSON.stringify(recovered, null, 2)
  );
  assert.equal(recovered.authority, 'not-authoritative');
  assert.equal(recovered.kind, 'observation-history');
  pruneHistory(tnfHome, 'tester', { historyCap: 3, jsonlLines: 5 });
  fs.rmSync(tnfHome, { recursive: true, force: true });
});

test('stale quota + unknown quota semantics', () => {
  const tnfHome = tempHome();
  const now = new Date('2026-08-24T16:00:00.000Z');
  const unknown = refreshQuota(
    tnfHome,
    { agentId: 'x', name: 'x', platform: 'no-such-provider' },
    now
  );
  assert.equal(unknown.confidence, 'unknown');
  assert.equal(unknown.remaining, null);
  assert.equal(unknown.limit, null);

  fs.writeFileSync(
    path.join(tnfHome, 'provider-config.json'),
    JSON.stringify({ providers: { claude: { quotaLimit: 1000, quotaUnit: 'tokens' } } })
  );
  fs.writeFileSync(
    path.join(tnfHome, 'metrics', 'health-latest.json'),
    JSON.stringify({ usage: { a1: 100 } })
  );
  const q1 = refreshQuota(tnfHome, { agentId: 'a1', name: 'alpha', platform: 'claude' }, now);
  assert.equal(q1.remaining, 900);
  const stale = markFreshness(
    { ...q1, observedAt: new Date(now.getTime() - 600_000).toISOString(), refreshedAt: new Date(now.getTime() - 600_000).toISOString() },
    now.getTime()
  );
  assert.equal(stale.degraded, true);

  const ranked = rankAgentsForDelegation(
    [
      {
        agentId: 'a1',
        name: 'alpha',
        isOnline: true,
        authorityRole: 'sub-director',
        capabilities: ['code'],
        quota: q1,
      },
      {
        agentId: 'a2',
        name: 'beta',
        isOnline: true,
        authorityRole: 'worker',
        capabilities: ['code'],
        quota: { ...q1, remaining: 999, remainingFraction: 0.999, agentId: 'a2' },
      },
    ],
    { requiredAuthorityRoles: ['sub-director'], capabilities: ['code'], now: now.getTime() }
  );
  // High quota on worker must NOT beat authority gate.
  assert.equal(ranked[0].agent.agentId, 'a1');
  assert.equal(ranked[0].authorityEligible, true);
  assert.equal(ranked[1].authorityEligible, false);
  fs.rmSync(tnfHome, { recursive: true, force: true });
});

test('logged-in without authority cannot imply mutation; unavailable provider stays unknown', () => {
  const tnfHome = tempHome();
  const now = new Date('2026-08-24T16:00:00.000Z');
  loginProfile(tnfHome, 'alice', { passphrase: 'secret', now });
  assert.ok(readSession(tnfHome, 'alice', now.getTime()));
  // Session exists but authority roles are separate — roles.json present with only subdirector.
  const roles = readJson(path.join(tnfHome, 'authority', 'roles.json'));
  assert.ok(roles.agents['tnf-local-subdirector']);
  assert.equal(roles.agents['alice'], undefined);

  const offlineProvider = refreshQuota(
    tnfHome,
    { agentId: 'missing', name: 'missing', platform: 'offline-provider' },
    now
  );
  assert.equal(offlineProvider.confidence, 'unknown');

  logoutProfile(tnfHome, 'alice');
  assert.throws(() => hydrate({ tnfHome, profile: 'alice', requireAuth: true }), /Authentication required/);
  fs.rmSync(tnfHome, { recursive: true, force: true });
});

test('ecosystem source unavailable + hosted absent degrade cleanly', () => {
  const tnfHome = tempHome();
  const now = new Date('2026-08-24T16:00:00.000Z');
  loginProfile(tnfHome, 'alice', { now });
  writeAgentStateSnapshot(
    tnfHome,
    'alice',
    [{ agentId: 'a1', name: 'alpha', platform: 'claude', isOnline: false, source: 'test' }],
    { now }
  );
  const orientation = orient({ tnfHome, profile: 'alice', requireAuth: true });
  assert.equal(orientation.kind, 'boot-orientation');
  assert.ok(orientation.receipts.some((r) => r.slice === 'hosted' && r.status === 'missing'));

  // No sources dir — hydrate should still succeed fail-soft.
  const snap = hydrate({ tnfHome, profile: 'alice', requireAuth: true });
  assert.equal(snap.authenticated, true);
  assert.ok(Array.isArray(snap.slices.sources));
  fs.rmSync(tnfHome, { recursive: true, force: true });
});
