/**
 * Regression guard for the TNF_SKIP_TURN_ZERO_ONBOARD / TNF_SKIP_PREFLIGHT
 * contract.
 *
 * Until 2026-08-04 the unconditional preflight in `main()` (cli.ts) ran on
 * every `tnf` invocation regardless of `TNF_SKIP_TURN_ZERO_ONBOARD`, and
 * `runFastHarnessProtocolGate` (invoked by `tnf doctor`) likewise ignored it.
 * Scripts in scripts/agents/*.sh exported the env var expecting silence and
 * still got the full Turn Zero Mandate dump — the env var was documentation
 * theater. Verified live with `TNF_SKIP_TURN_ZERO_ONBOARD=1 tnf doctor`.
 *
 * This test spawns the built CLI the same way those scripts do and asserts
 * that the gate output is absent when the env var is set, and present when
 * it is not. Run after `pnpm --filter @the-new-fuse/tnf-cli build`.
 *
 * Run: pnpm --filter @the-new-fuse/tnf-cli test
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(here, '..', '..', 'dist', 'cli.js');

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

/**
 * Run the built CLI with a given env overlay and capture combined output.
 * Mirrors how scripts/agents/*.sh invoke `tnf` — non-TTY stdin, inherited env.
 */
/** Set when the last runCli call was killed by the timeout rather than finishing. */
let lastRunTimedOut = false;

function runCli(args: string[], envOverlay: Record<string, string>): string {
  const result = spawnSync('node', [CLI, ...args], {
    cwd: path.resolve(here, '..', '..', '..'),
    env: { ...process.env, ...envOverlay },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 30_000,
  });
  // A killed process produces no further output, which silently satisfies every
  // "output absent" assertion and fails every "output present" one — so a
  // timeout masquerades as a behavioural regression. `tnf doctor` measured ~41
  // minutes on 2026-08-06, so this fires routinely. Record it so the assertions
  // can say what actually happened instead of guessing.
  lastRunTimedOut = Boolean(
    (result as { error?: NodeJS.ErrnoException }).error?.code === 'ETIMEDOUT' ||
    result.signal === 'SIGTERM'
  );
  return `${result.stdout ?? ''}${result.stderr ?? ''}`;
}

const PREFLIGHT_NEEDLES = [
  'TNF Protocol Pre-Flight Checks',
  'Turn Zero Mandate',
  'Protocol gate before',
];

function preflightOutputCount(output: string): number {
  return PREFLIGHT_NEEDLES.reduce((acc, needle) => acc + (output.includes(needle) ? 1 : 0), 0);
}

function main(): void {
  console.log('\npreflight-skip: TNF_SKIP_TURN_ZERO_ONBOARD / TNF_SKIP_PREFLIGHT contract\n');

  // This suite asserts on the OUTPUT of a spawned binary. If that binary is
  // absent, every "output present" assertion fails and every "output absent"
  // assertion passes — reporting "default behaviour regressed" when nothing
  // regressed at all and the build simply is not there.
  //
  // That is not hypothetical: `pnpm run clean` (hourly, via cron) removes
  // dist/, and on 2026-08-06 this suite reported two behavioural regressions
  // that were entirely a missing build. A missing precondition must be
  // distinguishable from a failed assertion.
  if (!fs.existsSync(CLI)) {
    console.error(`  CANNOT RUN  ${CLI} does not exist.`);
    console.error('              Build first: pnpm --filter @the-new-fuse/tnf-cli build');
    console.error('              (dist/ is removed by `pnpm run clean`, which cron runs hourly.)');
    process.exit(2);
  }

  // 1. The fix: with the env var set, neither the unconditional preflight in
  //    main() nor runFastHarnessProtocolGate (triggered by `tnf doctor`) emits
  //    preflight output.
  const skipOnboardOut = runCli(['doctor'], { TNF_SKIP_TURN_ZERO_ONBOARD: '1' });
  const skipOnboardHits = preflightOutputCount(skipOnboardOut);
  check(
    'TNF_SKIP_TURN_ZERO_ONBOARD=1 suppresses preflight output',
    skipOnboardHits === 0,
    `got ${skipOnboardHits} preflight markers (env var ignored)`
  );

  // 2. The narrow opt-out flag works independently of the onboarding surface.
  const skipPreflightOut = runCli(['doctor'], { TNF_SKIP_PREFLIGHT: '1' });
  const skipPreflightHits = preflightOutputCount(skipPreflightOut);
  check(
    'TNF_SKIP_PREFLIGHT=1 suppresses preflight output',
    skipPreflightHits === 0,
    `got ${skipPreflightHits} preflight markers`
  );

  // 3. The default (no env var) behaviour is preserved — preflight still
  //    runs when the operator has not opted out. Without this assertion it
  //    would be trivial to "fix" the bug by deleting the preflight entirely.
  const defaultOut = runCli(['doctor'], {});
  const defaultTimedOut = lastRunTimedOut;
  const defaultHits = preflightOutputCount(defaultOut);
  check(
    'default (no env) still runs preflight',
    defaultHits > 0,
    defaultTimedOut
      ? '`tnf doctor` exceeded the 30s budget and was killed before preflight printed — ' +
          'this is a CLI latency problem, NOT a preflight regression. See ' +
          'docs/operations/tnf-cli-restructure-scope.md'
      : 'preflight output missing — default behaviour regressed'
  );

  // 4. Explicit user-invoked `tnf protocol gate` is NOT suppressed — it is the
  //    "run the checks now" verb and must keep working regardless of env vars.
  const explicitGateOut = runCli(['protocol', 'gate'], { TNF_SKIP_TURN_ZERO_ONBOARD: '1' });
  const explicitGateHits = preflightOutputCount(explicitGateOut);
  check(
    'tnf protocol gate (explicit) still runs with skip env',
    explicitGateHits > 0,
    'explicit gate suppressed — user-invoked gate should never be skipped'
  );

  console.log(`\n  ${pass} passed, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
