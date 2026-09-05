/**
 * `tnf reflect` — Session transcript analysis for the TNF self-improvement loop.
 *
 * Invokes the skill script at ~/.agents/skills/tnf-self-improvement-loop/scripts/reflect.sh
 * (with fallback to the Claude skills tree). Produces a reflection report under
 * ~/.tnf/reports/self-improvement/ and may append lessons-learned.md.
 *
 * Usage:
 *   tnf reflect
 */

import chalk from 'chalk';
import type { Command } from 'commander';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getOrCreateCommand } from './_registry.js';

const REFLECT_CANDIDATES = [
  path.join(os.homedir(), '.agents/skills/tnf-self-improvement-loop/scripts/reflect.sh'),
  path.join(os.homedir(), '.claude/skills/skills/tnf-self-improvement-loop/scripts/reflect.sh'),
];

export function resolveReflectScript(
  candidates: string[] = REFLECT_CANDIDATES
): string | undefined {
  return candidates.find((candidate) => fs.existsSync(candidate));
}

export function registerReflectCommand(program: Command): void {
  const reflect = getOrCreateCommand(
    program,
    'reflect',
    'Run TNF self-improvement reflect (handoff diff + lessons + report)'
  );

  reflect.action(() => {
    const scriptPath = resolveReflectScript();
    if (!scriptPath) {
      console.error(
        chalk.red(
          'Reflect script not found. Expected one of:\n' +
            REFLECT_CANDIDATES.map((p) => `  - ${p}`).join('\n') +
            '\nRestore ~/.agents/skills/tnf-self-improvement-loop → ~/.claude/skills/skills/tnf-self-improvement-loop'
        )
      );
      process.exit(1);
    }

    const child = spawn('bash', [scriptPath], {
      stdio: 'inherit',
      env: process.env,
    });

    child.on('exit', (code, signal) => {
      if (signal) {
        console.error(chalk.red(`reflect terminated by signal ${signal}`));
        process.exit(1);
      }
      process.exit(code ?? 1);
    });

    child.on('error', (err) => {
      console.error(chalk.red(`Failed to start reflect script: ${err.message}`));
      process.exit(1);
    });
  });
}
