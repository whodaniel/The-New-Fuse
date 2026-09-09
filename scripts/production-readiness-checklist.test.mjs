import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assess, assessClock, request, summarize } from './production-readiness-checklist.js';
const now = Date.parse('2026-09-09T02:00:00Z');
const clock = (time, projectionMode = 'live') => ({
  status: 'ok',
  superCycle: {
    lastUpdated: time,
    staleThresholdMs: 90000,
    projectionMode,
    processes: [{ lastHeartbeat: time }],
  },
});
test('reachable old, future, empty and projected clock records cannot pass operational readiness', () => {
  assert.equal(assessClock(clock('2026-08-06T00:00:00Z'), now).status, 'fail');
  assert.equal(assessClock(clock('2027-01-01T00:00:00Z'), now).status, 'fail');
  assert.equal(
    assessClock(clock(new Date(now).toISOString(), 'contract-fallback'), now).status,
    'fail'
  );
  assert.equal(assessClock({}, now).status, 'fail');
  assert.equal(assessClock(clock(new Date(now).toISOString()), now).status, 'pass');
});
test('passing public transport checks cannot approve unexecuted launch journeys', async () => {
  const fetcher = async (url) => {
    if (url.pathname === '/auth/login') return new Response('<div id="root"></div>');
    if (url.pathname === '/health') return Response.json({ status: 'ok' });
    if (url.pathname === '/api/orchestration/chat') return new Response(null, { status: 401 });
    return Response.json(clock(new Date(now).toISOString()));
  };
  const report = await assess({ fetcher, now, revision: 'test' });
  assert.equal(report.checks.filter((c) => c.status === 'pass').length, 4);
  assert.equal(report.decision, 'NO_GO');
  assert.equal(report.checks.filter((c) => c.status === 'unknown').length, 7);
  assert(!('readinessScore' in report));
});
test('HTML fallback, redirects and anonymous success fail their corresponding checks', async () => {
  const report = await assess({ fetcher: async () => new Response('<html>marketing</html>'), now });
  assert.equal(report.checks.find((c) => c.id === 'edge-health').status, 'fail');
  assert.equal(report.checks.find((c) => c.id === 'anonymous-execution-denied').status, 'fail');
  let redirect;
  const r = await request('https://example.com', '/', {}, async (_url, init) => {
    redirect = init.redirect;
    return new Response(null, { status: 302 });
  });
  assert.equal(r.status, 302);
  assert.equal(redirect, 'manual');
});
test('body reads remain bounded and timeout errors expose no credentials', async () => {
  const secret = 'not-a-real-secret';
  const report = await assess({
    fetcher: async () => {
      throw new Error(secret);
    },
    now,
  });
  assert(!JSON.stringify(report).includes(secret));
  await assert.rejects(
    request(
      'https://example.com',
      '/',
      {},
      async () => new Response(new Uint8Array(2 * 1024 * 1024 + 1))
    )
  );
  await assert.rejects(
    request(
      'https://example.com',
      '/',
      {},
      async (_url, init) =>
        new Response(
          new ReadableStream({
            start(controller) {
              init.signal.addEventListener('abort', () => controller.error(new Error('timeout')));
            },
          })
        ),
      20
    )
  );
});
test('unsafe targets, omitted checks and required unknowns fail closed', async () => {
  assert.equal(summarize([], 'rev', 'https://example.com', now).decision, 'NO_GO');
  for (const base of [
    'http://example.com',
    'https://user:password@example.com',
    'https://example.com/path',
  ])
    await assert.rejects(assess({ base }));
  assert.equal(
    summarize(
      [{ id: 'execution', required: true, status: 'unknown', detail: 'not run' }],
      'rev',
      'https://example.com',
      now
    ).decision,
    'NO_GO'
  );
});
