import chalk from 'chalk';
import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface PreflightOptions {
  repoRoot: string;
  skipPreflight?: boolean;
  requireDoctor?: boolean;
  /** Admit one protected recovery cycle; never admit the continuous loop. */
  recoveryAttempt?: boolean;
}

function isTruthy(value: string | undefined): boolean {
  if (value == null) return false;
  const v = String(value).trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function checkArtifactPresence(repoRoot: string): void {
  const criticalFiles = [
    'packages/infrastructure/dist/index.js',
    'packages/shared/dist/index.js',
    'packages/tnf-core/dist/index.js',
    'packages/tnf-note-taking/dist/index.js',
    'packages/tnf-browser/index.js',
  ];
  const missing = criticalFiles.filter((rel) => !fs.existsSync(path.join(repoRoot, rel)));
  if (missing.length > 0) {
    console.error(chalk.red('\n[Preflight Error] Missing critical build artifacts.'));
    missing.forEach((d) => console.error(chalk.dim(`  - ${d}`)));
    console.error(
      chalk.white(
        '\nRebuild CLI packages (infrastructure, shared, tnf-core, tnf-note-taking) before full-auto.\n'
      )
    );
    throw new Error('Full-auto preflight failed');
  }
}

async function pingRedis(): Promise<void> {
  try {
    execSync('redis-cli ping', { stdio: 'ignore', timeout: 2000 });
  } catch {
    console.error(chalk.red('\n[Preflight Error] Redis is not reachable.\n'));
    throw new Error('Full-auto preflight failed');
  }
}

function assertNotQuarantined(repoRoot: string, recoveryAttempt = false): void {
  const statePath = path.join(repoRoot, 'docs/operations/tnf-full-auto-state.json');
  if (!fs.existsSync(statePath)) return;
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  if (state.mode === 'quarantined' && !recoveryAttempt) {
    throw new Error('full-auto is quarantined; run tnf full-auto once to verify recovery before starting the loop');
  }
}

function runSubstrateRequire(repoRoot: string, recoveryAttempt = false): void {
  const script = path.join(repoRoot, 'scripts/protocols/validate-substrate-attestation.cjs');
  const result = spawnSync(process.execPath, [script, '--mode=require', ...(recoveryAttempt ? ['--recovery-check'] : [])], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: process.env,
    timeout: 60_000,
  });
  if ((result.status ?? 1) !== 0) {
    console.error(chalk.red('\n[Preflight Error] Substrate attestation failed (require mode).'));
    console.error((result.stdout || result.stderr || '').slice(0, 1200));
    throw new Error('Full-auto preflight failed');
  }
}

function runDoctorGate(repoRoot: string): void {
  if (isTruthy(process.env.TNF_SKIP_DOCTOR_GATE)) {
    console.log(chalk.yellow('[Preflight] Skipping doctor gate (TNF_SKIP_DOCTOR_GATE=1).'));
    return;
  }
  const script = path.join(repoRoot, 'scripts/tnf-doctor.cjs');
  if (!fs.existsSync(script)) {
    console.error(chalk.red('[Preflight Error] scripts/tnf-doctor.cjs missing'));
    throw new Error('Full-auto preflight failed');
  }
  // Run the full doctor, live checks included. Preflight exists to confirm the
  // system is actually usable before we act; passing --skip-live-checks
  // suppressed panel [7] Live Web/API Checks, which is precisely the part that
  // verifies the live API surface — the gate was clearing the system on the
  // strength of the checks it had not run. It also saved no time (measured
  // 31.5s vs 31.8s); the flag only silences that panel.
  const result = spawnSync(process.execPath, [script], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: process.env,
    // Doctor takes ~30s unloaded and the live panel adds network calls, so 60s
    // left little headroom on a busy machine.
    timeout: 180_000,
  });
  // A timeout is not a verdict. Both still block — fail-closed is right for a
  // preflight gate — but the operator must be able to tell "doctor said no"
  // from "doctor never finished".
  if (result.error && (result.error as NodeJS.ErrnoException).code === 'ETIMEDOUT') {
    console.error(chalk.red('\n[Preflight Error] tnf doctor gate did not complete in time.'));
    console.error(
      chalk.dim('The gate did not fail; it never returned a verdict. Re-run, or check machine load.')
    );
    console.error((result.stdout || result.stderr || '').slice(-4000));
    throw new Error('Full-auto preflight failed');
  }
  if ((result.status ?? 1) !== 0) {
    console.error(chalk.red('\n[Preflight Error] tnf doctor gate failed.'));
    console.error((result.stdout || result.stderr || '').slice(-4000));
    throw new Error('Full-auto preflight failed');
  }
}

function acquirePidLock(repoRoot: string): () => void {
  const operationsDir = path.join(repoRoot, 'docs', 'operations');
  fs.mkdirSync(operationsDir, { recursive: true });
  const pidFile = path.join(operationsDir, 'tnf-full-auto.pid');
  if (fs.existsSync(pidFile)) {
    const existingPid = Number(fs.readFileSync(pidFile, 'utf8').trim());
    if (!Number.isInteger(existingPid) || existingPid <= 0) {
      throw new Error('Invalid full-auto PID lock; reconcile ownership before recovery');
    }
    let alive = true;
    try { process.kill(existingPid, 0); } catch (error: any) {
      if (error.code === 'ESRCH') alive = false;
      else throw error;
    }
    if (alive) throw new Error(`Full-auto already owns the runtime (PID ${existingPid})`);
    // Recheck before removing the stale PID; exclusive creation arbitrates racers.
    if (fs.readFileSync(pidFile, 'utf8').trim() !== String(existingPid)) {
      throw new Error('Full-auto lock changed during admission');
    }
    fs.unlinkSync(pidFile);
  }
  fs.writeFileSync(pidFile, String(process.pid), { flag: 'wx' });
  const cleanup = () => {
    if (fs.existsSync(pidFile) && fs.readFileSync(pidFile, 'utf8').trim() === String(process.pid)) {
      fs.unlinkSync(pidFile);
    }
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(130); });
  process.on('SIGTERM', () => { cleanup(); process.exit(143); });
  return cleanup;
}

export async function runFullAutoPreflight(options: PreflightOptions): Promise<void> {
  if (options.skipPreflight) {
    console.log(chalk.yellow('[Preflight] Skipping safety checks due to --skip-preflight flag.'));
    return;
  }
  console.log(chalk.blue('[Preflight] Running system integrity checks...'));
  const release = acquirePidLock(options.repoRoot);
  try {
    assertNotQuarantined(options.repoRoot, options.recoveryAttempt);
    checkArtifactPresence(options.repoRoot);
    await pingRedis();
    runSubstrateRequire(options.repoRoot, options.recoveryAttempt);
    if (options.requireDoctor || isTruthy(process.env.TNF_REQUIRE_DOCTOR)) runDoctorGate(options.repoRoot);
  } catch (error) {
    release();
    throw error;
  }
  console.log(chalk.green('[Preflight] All checks passed. Proceeding with full-auto cycle.'));
}
