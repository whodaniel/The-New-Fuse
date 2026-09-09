/**
 * Regression tests for the `/sessions` in-session jump helpers.
 * Pure logic: transcript replacement semantics and picker-item decoration.
 */
import { strict as assert } from 'node:assert';
import { applySessionJump, buildSessionJumpItems } from './session-jump.js';
import type { Session, SessionExport } from '../services/SessionManagerService.js';

let passed = 0;
let failed = 0;
function check(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(String((err as Error)?.message ?? err));
  }
}

function makeSession(over: Partial<Session> = {}): Session {
  return {
    id: 'sess-1',
    provider: 'aihubmix',
    model: 'coding-glm-5.3',
    createdAt: '2026-09-06T10:00:00.000Z',
    updatedAt: '2026-09-06T11:00:00.000Z',
    messageCount: 4,
    ...over,
  };
}

console.log('\n=== session-jump.test.ts ===');

check('applySessionJump keeps system prompt, replaces transcript, skips target system rows', () => {
  const messages = [
    { role: 'system' as const, content: 'SYS' },
    { role: 'user' as const, content: 'old q' },
    { role: 'assistant' as const, content: 'old a' },
  ];
  const target = {
    session: makeSession({ id: 'other', messageCount: 3 }),
    messages: [
      { role: 'system' as const, content: 'STALE SYS', timestamp: 't' },
      { role: 'user' as const, content: 'q1', timestamp: 't' },
      { role: 'assistant' as const, content: 'a1', timestamp: 't' },
    ],
  } as unknown as SessionExport;
  const count = applySessionJump(messages, 1, target);
  assert.equal(count, 2);
  assert.deepEqual(
    messages.map((m) => `${m.role}:${m.content}`),
    ['system:SYS', 'user:q1', 'assistant:a1']
  );
});

check('applySessionJump with empty target resets transcript to system prompt only', () => {
  const messages = [
    { role: 'system' as const, content: 'SYS' },
    { role: 'user' as const, content: 'x' },
  ];
  const count = applySessionJump(messages, 1, { session: makeSession(), messages: [] });
  assert.equal(count, 0);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].role, 'system');
});

check('applySessionJump tolerates multiple system prompt rows and blank content', () => {
  const messages = [
    { role: 'system' as const, content: 'S1' },
    { role: 'system' as const, content: 'S2' },
    { role: 'user' as const, content: 'x' },
  ];
  const target = {
    session: makeSession(),
    messages: [
      { role: 'user' as const, content: '', timestamp: 't' },
      { role: 'assistant' as const, content: 'kept', timestamp: 't' },
    ],
  } as unknown as SessionExport;
  const count = applySessionJump(messages, 2, target);
  assert.equal(count, 1);
  assert.equal(messages.length, 3);
  assert.equal(messages[2].content, 'kept');
});

check('buildSessionJumpItems labels by name, decorates description, marks current first', () => {
  const older = makeSession({ id: 'older', name: 'old work', messageCount: 9, model: 'm-old' });
  const current = makeSession({ id: 'current', name: undefined, messageCount: 2, model: 'm-new' });
  const items = buildSessionJumpItems([older, current], 'current');
  assert.equal(items[0].value.id, 'current');
  assert.equal(items[0].isCurrent, true);
  assert.ok(items[0].description.includes('current'));
  assert.ok(items[0].description.includes('2 msgs'));
  assert.ok(items[0].description.includes('m-new'));
  assert.equal(items[1].label, 'old work');
  assert.equal(items[1].isCurrent, false);
});

check('buildSessionJumpItems without a current id preserves recency order', () => {
  const a = makeSession({ id: 'a', updatedAt: '2026-09-06T09:00:00.000Z' });
  const b = makeSession({ id: 'b', updatedAt: '2026-09-06T10:00:00.000Z' });
  const items = buildSessionJumpItems([a, b], undefined);
  assert.deepEqual(
    items.map((i) => i.value.id),
    ['a', 'b']
  );
  assert.ok(items.every((i) => !i.isCurrent));
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
