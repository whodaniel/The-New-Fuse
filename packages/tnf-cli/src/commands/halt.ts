/**
 * `tnf halt` — Graceful termination of TNF background services started by boot-tnf.sh.
 *
 * Usage:
 *   tnf halt           SIGTERM processes named in .tmp/*.pid
 *   tnf halt --force   SIGKILL instead
 */

import chalk from 'chalk';
import { spawn } from 'child_process';
import type { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { getOrCreateCommand } from './_registry.js';

export function registerHaltCommand(program: Command, repoRoot: string): void {
  const halt = getOrCreateCommand(program, 'halt', 'Gracefully stop TNF background services');

  halt
    .option('--force', 'Force kill stubborn processes (SIGKILL instead of SIGTERM)', false)
    .action((opts: { force?: boolean }) => {
      const scriptPath = path.join(repoRoot, 'scripts', 'stop-tnf.cjs');
      if (!fs.existsSync(scriptPath)) {
        console.error(chalk.red('Stop script not found: ' + scriptPath));
        process.exit(1);
      }

      const args = opts.force ? [scriptPath, '--force'] : [scriptPath];
      const stopProcess = spawn(process.execPath, args, {
        cwd: repoRoot,
        stdio: 'inherit',
        env: { ...process.env, FORCE_KILL: opts.force ? '1' : '0' },
      });

      stopProcess.on('exit', (code) => {
        process.exit(code ?? 1);
      });

      stopProcess.on('error', (err) => {
        console.error(chalk.red('Failed to start stop script: ' + err.message));
        process.exit(1);
      });
    });
}
