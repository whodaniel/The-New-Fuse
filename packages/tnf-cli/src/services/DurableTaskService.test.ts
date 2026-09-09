/**
 * DurableTaskService — Phase 1 unit tests (tsx style, no mocks).
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { DurableTaskService } from './DurableTaskService.js';

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean, detail = ''): void {
  if (cond) {
    console.log(`  PASS  ${name}`);
    pass += 1;
  } else {
    console.log(`  FAIL  ${name} ${detail}`);
    fail += 1;
  }
}

async function main(): Promise<void> {
  console.log('\ndurable task service');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-durable-test-'));
  const svc = new DurableTaskService(dir);
  svc.resetForTests();

  const def = svc.defineTask({
    id: 'unit-echo',
    handler: 'echo',
    retry: { maxAttempts: 2 },
  });
  check('define creates v1', def.version === 1);
  const def2 = svc.defineTask({ id: 'unit-echo', handler: 'echo' });
  check('redefine bumps version', def2.version === 2);

  const triggered = svc.trigger('unit-echo', { a: 1 }, { userId: 'u1', projectId: 'p1' });
  check('trigger returns run id', triggered.run.id.startsWith('run_'));
  check('trigger returns public token', triggered.publicRunToken.startsWith('prt_'));
  check('run starts QUEUED', triggered.run.status === 'QUEUED');
  check('ownership user set', triggered.run.ownership.userId === 'u1');

  await svc.tick(1);
  const done = svc.getRun(triggered.run.id)!;
  check('echo completes', done.status === 'COMPLETED');
  check(
    'echo output',
    JSON.stringify((done.output as any)?.echo) === JSON.stringify({ a: 1 })
  );

  const viaToken = svc.resolvePublicRunToken(triggered.publicRunToken);
  check('public token resolves run', viaToken?.id === triggered.run.id);

  // retries
  svc.defineTask({ id: 'unit-retry', handler: 'fail-once', retry: { maxAttempts: 3, minTimeoutInMs: 1, maxTimeoutInMs: 5, factor: 1 } });
  const r = svc.trigger('unit-retry', {});
  await svc.runWorker({ idleStopAfter: 30, pollMs: 5 });
  const rr = svc.getRun(r.run.id)!;
  check('fail-once eventually completes', rr.status === 'COMPLETED', `status=${rr.status} err=${rr.error}`);
  check('fail-once used >1 attempt', rr.attempt >= 2, `attempt=${rr.attempt}`);

  // wait token + resume
  svc.defineTask({ id: 'unit-wait', handler: 'wait-token' });
  const w = svc.trigger('unit-wait', { timeoutMs: 60_000 });
  await svc.tick(1);
  const waiting = svc.getRun(w.run.id)!;
  check('wait-token suspends', waiting.status === 'WAITING', `status=${waiting.status}`);
  check('wait token id set', Boolean(waiting.waitTokenId));
  const tokenId = waiting.waitTokenId!;
  svc.completeWaitToken(tokenId, { status: 'approved' });
  const requeued = svc.getRun(w.run.id)!;
  check('complete wait requeues', requeued.status === 'QUEUED', `status=${requeued.status}`);
  await svc.tick(1);
  const resumed = svc.getRun(w.run.id)!;
  check('resume completes', resumed.status === 'COMPLETED', `status=${resumed.status}`);
  check(
    'wait result attached',
    (resumed.output as any)?.waitResult?.status === 'approved' ||
      (resumed.output as any)?.resumed === true
  );

  // idempotency
  svc.defineTask({ id: 'unit-idem', handler: 'idempotent:demo-key' });
  const i1 = svc.trigger('unit-idem', { idempotencyKey: 'demo-key' });
  await svc.tick(1);
  const i2 = svc.trigger('unit-idem', { idempotencyKey: 'demo-key' });
  await svc.tick(1);
  const o1 = svc.getRun(i1.run.id)!.output as any;
  const o2 = svc.getRun(i2.run.id)!.output as any;
  check('first idempotent computes', o1.cached === false);
  check('second idempotent hits cache', o2.cached === true);

  // concurrency limit
  svc.defineTask({
    id: 'unit-sleep',
    handler: 'sleep:30',
    concurrencyLimit: 1,
    queueName: 'solo',
  });
  const s1 = svc.trigger('unit-sleep', {});
  const s2 = svc.trigger('unit-sleep', {});
  // start first without awaiting finish — tickOne sets EXECUTING then awaits sleep
  const p1 = svc.tick(1);
  await new Promise((r) => setTimeout(r, 5));
  const mid = svc.listRuns({ taskId: 'unit-sleep' });
  const executing = mid.filter((x) => x.status === 'EXECUTING').length;
  const stillQueued = mid.filter((x) => x.status === 'QUEUED').length;
  check('concurrency holds second', executing === 1 && stillQueued === 1, `exec=${executing} queued=${stillQueued}`);
  await p1;
  await svc.tick(1);
  check(
    'both sleeps eventually complete',
    svc.getRun(s1.run.id)?.status === 'COMPLETED' && svc.getRun(s2.run.id)?.status === 'COMPLETED'
  );

  console.log(`\ndurable task service: ${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
