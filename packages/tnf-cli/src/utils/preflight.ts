import chalk from 'chalk';
import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface PreflightOptions {
  repoRoot: string;
  skipPreflight?: boolean;
  requireDoctor?: boolean;
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
    process.exit(1);
  }
}

async function pingRedis(): Promise<void> {
  try {
    execSync('redis-cli ping', { stdio: 'ignore', timeout: 2000 });
  } catch {
    console.error(chalk.red('\n[Preflight Error] Redis is not reachable.\n'));
    process.exit(1);
  }
}

function assertNotQuarantined(repoRoot: string): void {
  const statePath = path.join(repoRoot, 'docs/operations/tnf-full-auto-state.json');
  if (!fs.existsSync(statePath)) return;
  try {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    if (state.mode === 'quarantined') {
      console.error(chalk.red('\n[Preflight Error] full-auto is quarantined.'));
      console.error(
        chalk.yellow('Clear after remediation: tnf protocol substrate --clear-quarantine\n')
      );
      process.exit(1);
    }
  } catch {
    /* ignore */
  }
}

function runSubstrateRequire(repoRoot: string): void {
  const script = path.join(repoRoot, 'scripts/protocols/validate-substrate-attestation.cjs');
  const result = spawnSync(process.execPath, [script, '--mode=require'], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: process.env,
    timeout: 20_000,
  });
  if ((result.status ?? 1) !== 0) {
    console.error(chalk.red('\n[Preflight Error] Substrate attestation failed (require mode).'));
    console.error((result.stdout || result.stderr || '').slice(0, 1200));
    process.exit(1);
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
    process.exit(1);
  }
  const result = spawnSync(process.execPath, [script, '--skip-live-checks'], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: process.env,
    timeout: 60_000,
  });
  if ((result.status ?? 1) !== 0) {
    console.error(chalk.red('\n[Preflight Error] tnf doctor gate failed.'));
    console.error((result.stdout || result.stderr || '').slice(-1200));
    process.exit(1);
  }
}

function acquirePidLock(repoRoot: string): void {
  const operationsDir = path.join(repoRoot, 'docs', 'operations');
  fs.mkdirSync(operationsDir, { recursive: true });
  const pidFile = path.join(operationsDir, 'tnf-full-auto.pid');

  if (fs.existsSync(pidFile)) {
    const existingPid = fs.readFileSync(pidFile, 'utf8').trim();
    try {
      process.kill(parseInt(existingPid, 10), 0);
      console.error(chalk.red(`\n[Preflight Error] Collision averted (PID ${existingPid}).\n`));
      process.exit(1);
    } catch {
      fs.unlinkSync(pidFile);
    }
  }

  fs.writeFileSync(pidFile, process.pid.toString(), 'utf8');
  const cleanup = () => {
    if (fs.existsSync(pidFile)) {
      const currentPid = fs.readFileSync(pidFile, 'utf8').trim();
      if (currentPid === process.pid.toString()) fs.unlinkSync(pidFile);
    }
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => {
    cleanup();
    process.exit();
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit();
  });
}

export async function runFullAutoPreflight(options: PreflightOptions): Promise<void> {
  if (options.skipPreflight) {
    console.log(chalk.yellow('[Preflight] Skipping safety checks due to --skip-preflight flag.'));
    return;
  }

  console.log(chalk.blue('[Preflight] Running system integrity checks...'));
  assertNotQuarantined(options.repoRoot);
  checkArtifactPresence(options.repoRoot);
  await pingRedis();
  runSubstrateRequire(options.repoRoot);
  if (options.requireDoctor || isTruthy(process.env.TNF_REQUIRE_DOCTOR)) {
    runDoctorGate(options.repoRoot);
  }
  acquirePidLock(options.repoRoot);
  console.log(chalk.green('[Preflight] ✅ All systems nominal. Proceeding with full-auto loop.\n'));
}
