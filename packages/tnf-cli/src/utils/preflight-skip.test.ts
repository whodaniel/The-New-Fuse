/**
 * Regression guard for the TNF_SKIP_TURN_ZERO_ONBOARD / TNF_SKIP_PREFLIGHT
 * contract.
 *
 * Until 2026-08-04 the unconditional preflight in `main()` (cli.ts) ran on
 * every `tnf` invocation regardless of `TNF_SKIP_TURN_ZERO_ONBOARD`. Scripts
 * in scripts/agents/*.sh exported the env var expecting silence and still got
 * the full Turn Zero Mandate dump — the env var was documentation theater.
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
interface CliRun {
  output: string;
  timedOut: boolean;
}

function runCli(args: string[], envOverlay: Record<string, string | undefined>): CliRun {
  const env: NodeJS.ProcessEnv = { ...process.env, ...envOverlay };
  // Drop undefined overlays so callers can clear inherited skip flags
  // (suite/parent shells often export TNF_SKIP_* and would poison the default case).
  for (const [key, value] of Object.entries(envOverlay)) {
    if (value === undefined) delete env[key];
  }
  const result = spawnSync('node', [CLI, ...args], {
    cwd: path.resolve(here, '..', '..', '..', '..'),
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 30_000,
  });
  // A killed process produces no further output, which can silently satisfy an
  // "output absent" assertion. Always make completion part of the contract.
  const timedOut = Boolean(
    (result as { error?: NodeJS.ErrnoException }).error?.code === 'ETIMEDOUT' ||
    result.signal === 'SIGTERM'
  );
  return {
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
    timedOut,
  };
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

  // Use a real, fast read-only command to test the global preflight contract.
  // The heavyweight operational doctor performs network and environment
  // diagnostics and is not a bounded test probe (34s locally on 2026-09-01).
  const skipOnboard = runCli(['status'], {
    TNF_SKIP_TURN_ZERO_ONBOARD: '1',
    TNF_SILENT_PREFLIGHT: '0',
  });
  const skipOnboardHits = preflightOutputCount(skipOnboard.output);
  check(
    'TNF_SKIP_TURN_ZERO_ONBOARD=1 suppresses preflight output',
    !skipOnboard.timedOut && skipOnboardHits === 0,
    skipOnboard.timedOut
      ? 'status probe exceeded the 30s budget'
      : `got ${skipOnboardHits} preflight markers (env var ignored)`
  );

  // 2. The narrow opt-out flag works independently of the onboarding surface.
  const skipPreflight = runCli(['status'], {
    TNF_SKIP_PREFLIGHT: '1',
    TNF_SILENT_PREFLIGHT: '0',
  });
  const skipPreflightHits = preflightOutputCount(skipPreflight.output);
  check(
    'TNF_SKIP_PREFLIGHT=1 suppresses preflight output',
    !skipPreflight.timedOut && skipPreflightHits === 0,
    skipPreflight.timedOut
      ? 'status probe exceeded the 30s budget'
      : `got ${skipPreflightHits} preflight markers`
  );

  // 3. The default (no env var) behaviour is preserved — preflight still
  //    runs when the operator has not opted out. Without this assertion it
  //    would be trivial to "fix" the bug by deleting the preflight entirely.
  //    Explicitly clear skip flags so an inherited suite/shell export cannot
  //    masquerade as a behavioural regression (measured 2026-08-20).
  const defaultRun = runCli(['status'], {
    TNF_SKIP_TURN_ZERO_ONBOARD: undefined,
    TNF_SKIP_PREFLIGHT: undefined,
    TNF_SILENT_PREFLIGHT: '0',
  });
  const defaultHits = preflightOutputCount(defaultRun.output);
  check(
    'default (no env) still runs preflight',
    !defaultRun.timedOut && defaultHits > 0,
    defaultRun.timedOut
      ? '`tnf status` exceeded the 30s preflight budget'
      : 'preflight output missing — default behaviour regressed'
  );

  // 4. Explicit user-invoked `tnf protocol gate` is NOT suppressed — it is the
  //    "run the checks now" verb and must keep working regardless of env vars.
  const explicitGate = runCli(['protocol', 'gate'], { TNF_SKIP_TURN_ZERO_ONBOARD: '1' });
  const explicitGateHits = preflightOutputCount(explicitGate.output);
  check(
    'tnf protocol gate (explicit) still runs with skip env',
    !explicitGate.timedOut && explicitGateHits > 0,
    explicitGate.timedOut
      ? 'explicit gate exceeded the 30s budget'
      : 'explicit gate suppressed — user-invoked gate should never be skipped'
  );

  console.log(`\n  ${pass} passed, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
