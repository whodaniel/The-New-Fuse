/**
 * Regression guard for the full-auto hang.
 *
 * A cycle that never returned used to leave the loop awaiting forever while
 * tnf-full-auto-state.json still read `mode: "running"` — the autopilot was
 * dead for 63h and nothing surfaced it. These assertions pin the contract that
 * makes that impossible: a bounded child is always killed, always reaped, and
 * always rejects distinguishably.
 *
 * Run: pnpm --filter @the-new-fuse/tnf-cli test
 */
import { execSync } from 'node:child_process';
import { CommandTimeoutError, spawnWithTimeout } from './run-command.js';

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

const opts = { cwd: '/tmp', stdio: 'ignore' as const };

async function main(): Promise<void> {
  console.log('\nrun-command: timeout + reaping contract\n');

  // Success path is unchanged by the timeout plumbing.
  await spawnWithTimeout('sh', ['-c', 'exit 0'], { ...opts, timeoutMs: 5000 });
  check('exit 0 resolves', true);

  // A real failure must stay distinguishable from a timeout, otherwise the
  // loop cannot tell "the cycle broke" from "the cycle never finished".
  try {
    await spawnWithTimeout('sh', ['-c', 'exit 3'], { ...opts, timeoutMs: 5000 });
    check('exit 3 rejects', false, '(resolved instead)');
  } catch (err: any) {
    check('exit 3 rejects with its code', /exited with code 3/.test(err.message), err.message);
    check('exit 3 is not classed as a timeout', !(err instanceof CommandTimeoutError));
  }

  // The fix itself: a child that never exits is bounded.
  const startedAt = Date.now();
  try {
    await spawnWithTimeout('sh', ['-c', 'sleep 30'], { ...opts, timeoutMs: 1200 });
    check('hanging child times out', false, '(resolved instead)');
  } catch (err: any) {
    const elapsed = Date.now() - startedAt;
    check(
      'hanging child rejects as CommandTimeoutError',
      err instanceof CommandTimeoutError,
      err.name
    );
    check(`timed out promptly (${elapsed}ms)`, elapsed >= 1100 && elapsed < 4000);
    check('timeoutMs is surfaced on the error', err.timeoutMs === 1200, String(err?.timeoutMs));
  }

  // Killing must actually reap: a rejected promise with a surviving child would
  // leak a process per cycle, forever.
  const marker = `tnf-timeout-probe-${Date.now()}`;
  try {
    await spawnWithTimeout('sh', ['-c', `sleep 30 # ${marker}`], { ...opts, timeoutMs: 800 });
  } catch {
    /* expected */
  }
  await new Promise((resolve) => setTimeout(resolve, 600));
  const survivors = execSync(`pgrep -fl "${marker}" || true`, { encoding: 'utf8' }).trim();
  check('child process is actually reaped', survivors === '', `leftover: ${survivors}`);

  // Callers that pass no timeout keep the historical unbounded behaviour.
  await spawnWithTimeout('sh', ['-c', 'sleep 0.3'], opts);
  check('no timeoutMs => runs to completion', true);

  console.log(`\n  ${pass} passed, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
