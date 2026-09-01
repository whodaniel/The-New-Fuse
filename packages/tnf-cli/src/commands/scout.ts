import type { Command } from 'commander';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getOrCreateCommand } from './_registry.js';

function runNode(
  repoRoot: string,
  rel: string,
  args: string[]
): {
  ok: boolean;
  stdout: string;
  stderr: string;
  status: number;
} {
  const result = spawnSync(process.execPath, [path.join(repoRoot, rel), ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return {
    ok: (result.status ?? 1) === 0,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.status ?? 1,
  };
}

export function registerScoutCommands(program: Command, repoRoot: string): Command {
  const scout = getOrCreateCommand(
    program,
    'scout',
    'Ecosystem scout queue and tnf-cli-agent mission staffing'
  );

  scout
    .command('queue')
    .description('Rebuild the local stale-aware scout queue (no paid inference)')
    .option('--json', 'Machine-readable JSON')
    .action((opts: { json?: boolean }) => {
      const result = runNode(repoRoot, 'scripts/scouting/build-scout-queue.cjs', []);
      if (opts.json) {
        const queuePath = path.join(repoRoot, 'reports/scouting/scout-queue.json');
        if (fs.existsSync(queuePath)) {
          console.log(fs.readFileSync(queuePath, 'utf8'));
        } else {
          console.log(JSON.stringify({ ok: result.ok, stderr: result.stderr }));
        }
        process.exitCode = result.ok ? 0 : 1;
        return;
      }
      if (result.stdout.trim()) console.log(result.stdout.trim());
      if (!result.ok) {
        if (result.stderr.trim()) console.error(result.stderr.trim());
        process.exitCode = 1;
      }
    });

  scout
    .command('staff')
    .description('Assign due scout tasks to tnf-cli-agent (brief by default)')
    .option('--json', 'Machine-readable JSON')
    .option('--limit <n>', 'Max tasks in the brief', '8')
    .action((opts: { json?: boolean; limit?: string }) => {
      const args = [`--limit=${opts.limit || '8'}`];
      if (opts.json) args.push('--json');
      const result = runNode(repoRoot, 'scripts/scouting/staff-scout-missions.cjs', args);
      if (result.stdout.trim()) console.log(result.stdout.trim());
      if (!result.ok) {
        if (result.stderr.trim()) console.error(result.stderr.trim());
        process.exitCode = 1;
      }
    });

  scout
    .command('status')
    .description('Show the current scout mission brief')
    .option('--json', 'Machine-readable JSON')
    .action((opts: { json?: boolean }) => {
      const jsonPath = path.join(repoRoot, 'reports/scouting/scout-mission-latest.json');
      if (!fs.existsSync(jsonPath)) {
        console.log('No scout mission brief. Run `tnf scout staff`.');
        process.exitCode = 1;
        return;
      }
      if (opts.json) {
        console.log(fs.readFileSync(jsonPath, 'utf8'));
        return;
      }
      const brief = path.join(repoRoot, 'reports/scouting/scout-mission-brief.md');
      console.log(fs.readFileSync(fs.existsSync(brief) ? brief : jsonPath, 'utf8'));
    });

  scout
    .command('host-profiles')
    .description('Show which prompt files each enlisted host is expected to inject')
    .option('--json', 'Machine-readable JSON')
    .action((opts: { json?: boolean }) => {
      const args = opts.json ? ['--json'] : ['--verify'];
      const result = runNode(repoRoot, 'scripts/harness/host-prompt-profiles.cjs', args);
      if (result.stdout.trim()) console.log(result.stdout.trim());
      if (!result.ok) {
        if (result.stderr.trim()) console.error(result.stderr.trim());
        process.exitCode = 1;
      }
    });

  scout.action(() => {
    scout.help();
  });

  return scout;
}
