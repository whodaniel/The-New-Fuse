/**
 * Orphaned ORCHESTRATOR inbox migration unit tests.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  isOrchestratorSessionId,
  parseOrchestratorInboxKey,
  parseActiveOrchestratorSessionId,
  orchestratorInboxKeys,
  migrateOrphanedOrchestratorInboxes,
} = require('../dist/services/orchestrator-inbox-migration.service.js');

test('isOrchestratorSessionId accepts baton session ids only', () => {
  assert.equal(isOrchestratorSessionId('ORCHESTRATOR-1784988462853'), true);
  assert.equal(isOrchestratorSessionId('agent_antigravity_1'), false);
  assert.equal(isOrchestratorSessionId('Local-Director'), false);
});

test('parseOrchestratorInboxKey handles legacy and store key shapes', () => {
  assert.equal(
    parseOrchestratorInboxKey('tnf:handoff:v1:inbox:ORCHESTRATOR-100'),
    'ORCHESTRATOR-100'
  );
  assert.equal(
    parseOrchestratorInboxKey('tnf:handoff:v1:inbox:agent:ORCHESTRATOR-100'),
    'ORCHESTRATOR-100'
  );
  assert.equal(parseOrchestratorInboxKey('tnf:handoff:v1:inbox:Local-Director'), null);
});

test('parseActiveOrchestratorSessionId reads master state JSON', () => {
  assert.equal(
    parseActiveOrchestratorSessionId(
      JSON.stringify({ sessionId: 'ORCHESTRATOR-99', isActive: true })
    ),
    'ORCHESTRATOR-99'
  );
  assert.equal(parseActiveOrchestratorSessionId({ sessionId: 'nope' }), null);
});

test('migrateOrphanedOrchestratorInboxes moves packets to active baton', async () => {
  const lists = new Map([
    ['tnf:handoff:v1:inbox:ORCHESTRATOR-100', ['p1', 'p2']],
    ['tnf:handoff:v1:inbox:agent:ORCHESTRATOR-200', ['p3']],
    ['tnf:handoff:v1:inbox:ORCHESTRATOR-999', []],
  ]);

  const redis = {
    async keys(pattern) {
      const prefix = pattern.replace(/\*$/, '');
      return [...lists.keys()].filter((k) => k.startsWith(prefix));
    },
    async llen(key) {
      return (lists.get(key) || []).length;
    },
    async rpop(key) {
      const arr = lists.get(key) || [];
      return arr.pop() || null;
    },
    async lpush(key, value) {
      const arr = lists.get(key) || [];
      arr.unshift(value);
      lists.set(key, arr);
      return arr.length;
    },
  };

  const result = await migrateOrphanedOrchestratorInboxes(redis, 'ORCHESTRATOR-999');
  assert.equal(result.migrated, 3);
  assert.equal(lists.get('tnf:handoff:v1:inbox:ORCHESTRATOR-100').length, 0);
  assert.equal(lists.get('tnf:handoff:v1:inbox:agent:ORCHESTRATOR-200').length, 0);
  assert.equal(lists.get('tnf:handoff:v1:inbox:ORCHESTRATOR-999').length, 2);
  assert.equal(lists.get(orchestratorInboxKeys('ORCHESTRATOR-999').store).length, 1);
});

test('migrateOrphanedOrchestratorInboxes no-ops for invalid active session', async () => {
  const redis = {
    async keys() {
      return ['tnf:handoff:v1:inbox:ORCHESTRATOR-1'];
    },
    async llen() {
      return 1;
    },
    async rpop() {
      return 'x';
    },
    async lpush() {
      return 1;
    },
  };
  const result = await migrateOrphanedOrchestratorInboxes(redis, 'antigravity');
  assert.equal(result.migrated, 0);
});
