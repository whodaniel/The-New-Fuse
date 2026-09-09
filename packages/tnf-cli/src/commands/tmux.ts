/**
 * `tnf tmux` — thin dispatcher onto scripts/runtime/tnf-tmux.cjs
 *
 * Policy lives in the helper, not here. See
 * docs/operations/TNF_TMUX_MULTIPLEXER_CONVENTION_PLAN.md
 */

import type { Command } from 'commander';
import { spawnSync } from 'node:child_process';
import * as path from 'node:path';
import { getOrCreateCommand } from './_registry.js';

function runHelper(repoRoot: string, args: string[]): void {
  const script = path.join(repoRoot, 'scripts/runtime/tnf-tmux.cjs');
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  });
  process.exit(result.status ?? 1);
}

export function registerTmuxCommands(program: Command, repoRoot: string): Command {
  const tmux = getOrCreateCommand(
    program,
    'tmux',
    'TNF tmux multiplexer convention (dedicated socket, wrap, reap)'
  );

  tmux
    .command('status')
    .description('Show TNF tmux socket, session counts, and whether this process is inside it')
    .option('--json', 'Machine-readable JSON')
    .action((opts: { json?: boolean }) => {
      runHelper(repoRoot, opts.json ? ['status', '--json'] : ['status']);
    });

  tmux
    .command('list')
    .description('List panes on the TNF tmux socket')
    .option('--json', 'Machine-readable JSON')
    .action((opts: { json?: boolean }) => {
      runHelper(repoRoot, opts.json ? ['list', '--json'] : ['list']);
    });

  tmux
    .command('attach')
    .description('Attach to a TNF tmux session (prints the command when not a TTY)')
    .argument('<session>', 'Session name (tnf-a-… or tnf-o-…)')
    .action((session: string) => {
      runHelper(repoRoot, ['attach', session]);
    });

  tmux
    .command('reap')
    .description('Reap idle unattached tnf-a-* sessions; never tnf-o-*')
    .option('--dry-run', 'Report only; do not kill sessions')
    .option('--idle-seconds <n>', 'Idle threshold (default 21600)')
    .option('--json', 'Machine-readable JSON')
    .action((opts: { dryRun?: boolean; idleSeconds?: string; json?: boolean }) => {
      const args = ['reap'];
      if (opts.dryRun) args.push('--dry-run');
      if (opts.idleSeconds) args.push('--idle-seconds', String(opts.idleSeconds));
      if (opts.json) args.push('--json');
      runHelper(repoRoot, args);
    });

  tmux
    .command('wrap')
    .description('Start a command inside a classed TNF tmux session')
    .requiredOption('--class <class>', 'agent | operator')
    .option('--agent-id <id>', 'Agent id (agent class)')
    .option('--slug <slug>', 'Operator session slug')
    .option('--session <name>', 'Override session name')
    .option('--cwd <dir>', 'Working directory')
    .option('--detach', 'Do not attach after create')
    .option('--json', 'Machine-readable JSON')
    .argument('[command...]', 'Command to run (or pass after --)')
    .allowUnknownOption()
    .action(
      (
        command: string[],
        opts: {
          class?: string;
          agentId?: string;
          slug?: string;
          session?: string;
          cwd?: string;
          detach?: boolean;
          json?: boolean;
        }
      ) => {
        const raw = process.argv;
        const dash = raw.indexOf('--');
        const cmd = dash >= 0 ? raw.slice(dash + 1) : command;
        const args = ['wrap', '--class', String(opts.class || '')];
        if (opts.agentId) args.push('--agent-id', opts.agentId);
        if (opts.slug) args.push('--slug', opts.slug);
        if (opts.session) args.push('--session', opts.session);
        if (opts.cwd) args.push('--cwd', opts.cwd);
        if (opts.detach) args.push('--detach');
        if (opts.json) args.push('--json');
        args.push('--', ...cmd);
        runHelper(repoRoot, args);
      }
    );

  tmux.action(() => {
    tmux.help();
  });

  return tmux;
}
