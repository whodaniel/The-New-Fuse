/**
 * packages/tnf-cli/src/commands/health.ts
 *
 * `tnf status` / `tnf doctor` — read-only health diagnostics for the TNF stack.
 *
 *   tnf status           Quick summary: process, redis, agent count, last sync
 *   tnf status --json    Machine-readable
 *   tnf doctor           Deeper diagnostics: env, paths, registered commands
 *   tnf doctor --json    Machine-readable
 *
 * Hermes parity: matches `hermes status` and `hermes doctor` semantics.
 */

import { execSync } from 'child_process';
import { Command } from 'commander';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { registerOrNest } from './_registry.js';

interface HealthSummary {
  pid: number;
  uptimeSec: number;
  platform: string;
  nodeVersion: string;
  repoRoot: string;
  agentSpecCount: number;
  cronJobs: number;
  lastSync: string | null;
  redisReachable: boolean;
}

function countAgentSpecs(repoRoot: string): number {
  const dir = path.join(repoRoot, '.agent', 'agents');
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).length;
}

function countCronJobs(): number {
  try {
    // Prefer live crontab; /tmp/current_crontab is a stale dump some ops scripts write.
    const out = execSync('crontab -l 2>/dev/null || true', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.split('\n').filter((l: string) => l.trim() && !l.startsWith('#')).length;
  } catch {
    try {
      const out = fs.readFileSync('/tmp/current_crontab', 'utf-8');
      return out.split('\n').filter((l) => l.trim() && !l.startsWith('#')).length;
    } catch {
      return 0;
    }
  }
}

function lastSyncTimestamp(): string | null {
  const p = path.join(os.homedir(), '.tnf', 'cli-sync', 'latest-report.json');
  if (!fs.existsSync(p)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
    return data.timestamp ?? null;
  } catch {
    return null;
  }
}

function probeRedis(): boolean {
  try {
    const out = execSync('redis-cli PING', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 1000,
    });
    return out.trim() === 'PONG';
  } catch {
    return false;
  }
}

function gather(repoRoot: string): HealthSummary {
  return {
    pid: process.pid,
    uptimeSec: Math.round(process.uptime()),
    platform: `${os.platform()} ${os.release()}`,
    nodeVersion: process.version,
    repoRoot,
    agentSpecCount: countAgentSpecs(repoRoot),
    cronJobs: countCronJobs(),
    lastSync: lastSyncTimestamp(),
    redisReachable: probeRedis(),
  };
}

function renderText(s: HealthSummary): void {
  console.log('=== TNF Status ===');
  console.log(`PID             : ${s.pid}`);
  console.log(`Uptime          : ${s.uptimeSec}s`);
  console.log(`Platform        : ${s.platform}`);
  console.log(`Node            : ${s.nodeVersion}`);
  console.log(`Repo root       : ${s.repoRoot}`);
  console.log(`Agent specs     : ${s.agentSpecCount}`);
  console.log(`Cron jobs       : ${s.cronJobs}`);
  console.log(`Last CLI sync   : ${s.lastSync ?? 'never'}`);
  console.log(`Redis reachable : ${s.redisReachable ? 'yes' : 'no (no socket/pidfile detected)'}`);
}

function renderDoctorText(s: HealthSummary): void {
  console.log('=== TNF Doctor ===');
  renderText(s);
  console.log('\nDiagnostics:');
  const issues: string[] = [];
  if (s.agentSpecCount === 0) issues.push('No agent specs found in .agent/agents/');
  if (!s.lastSync)
    issues.push('CLI sync has never run — see scripts/agents/sync-tnf-cli-with-agents.mjs');
  if (issues.length === 0) console.log('  ✓ No issues detected');
  else for (const i of issues) console.log(`  ! ${i}`);
}

export function registerStatusCommand(program: Command, repoRoot: string): void {
  program
    .command('status')
    .description('Show a quick health summary of the TNF stack (Hermes parity)')
    .option('--json', 'Emit machine-readable JSON')
    .action((opts: { json?: boolean } = {}) => {
      const s = gather(repoRoot);
      if (opts.json) console.log(JSON.stringify(s, null, 2));
      else renderText(s);
    });
}

export function registerDoctorCommand(program: Command, repoRoot: string): void {
  // cli.ts already owns top-level `doctor` (the full scripts/tnf-doctor.cjs
  // path). Nest this lightweight, dependency-free check as `tnf doctor health`
  // so it stays usable when the heavyweight doctor cannot run.
  const { command } = registerOrNest(program, 'doctor', 'health');
  command
    .description('Run deeper diagnostics on the TNF stack (Hermes parity)')
    .option('--json', 'Emit machine-readable JSON')
    .action((opts: { json?: boolean } = {}) => {
      const s = gather(repoRoot);
      if (opts.json) {
        const issues: string[] = [];
        if (s.agentSpecCount === 0) issues.push('no-agent-specs');
        if (!s.lastSync) issues.push('cli-sync-never-run');
        console.log(JSON.stringify({ ...s, issues }, null, 2));
      } else {
        renderDoctorText(s);
      }
    });
}
