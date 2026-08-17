/**
 * Google Gemini & Antigravity Personal Intelligence CLI Commands
 *
 * Provides native `tnf google-ai` commands to inspect, synchronize, and expose
 * Google AI ecosystem sessions, projects, conversations, and intelligence artifacts
 * directly inside the TNF CLI.
 */

import chalk from 'chalk';
import { spawnSync } from 'child_process';
import type { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getOrCreateCommand } from './_registry.js';

export interface GoogleAiEcosystemStatus {
  account: { active?: string; old?: string[]; error?: string };
  projects_count: number;
  projects: Record<string, string>;
  db_connected: boolean;
  db_path: string;
  conversation_count: number;
  latest_conversation_time?: string;
  brain_sessions_count: number;
  intel_dir: string;
}

function resolveBridgeScriptPath(repoRoot: string): string {
  const primary = path.join(repoRoot, 'scripts', 'google-ai', 'tnf_gemini_antigravity_bridge.py');
  if (fs.existsSync(primary)) return primary;
  return path.join(repoRoot, 'scripts', 'tnf_gemini_antigravity_bridge.py');
}

export function registerGoogleAiCommand(program: Command, repoRoot: string): void {
  const googleAi = getOrCreateCommand(
    program,
    'google-ai',
    'Google Gemini & Antigravity Personal Intelligence integration commands'
  );

  googleAi
    .command('status')
    .description(
      'Inspect connection to Google Gemini & Antigravity local database, brains, and projects'
    )
    .option('--json', 'Output ecosystem state as JSON')
    .action((options: { json?: boolean }) => {
      const scriptPath = resolveBridgeScriptPath(repoRoot);
      const args = [scriptPath, '--status'];
      if (options.json) args.push('--json');

      const result = spawnSync('python3', args, { stdio: 'inherit' });
      if (result.status !== 0) {
        console.error(
          chalk.red(`\nFailed to inspect Google AI ecosystem (exit code ${result.status})`)
        );
      }
    });

  googleAi
    .command('sync')
    .description(
      'Synchronize all Google Gemini / Antigravity conversations & brains into TNF session stores'
    )
    .option('--json', 'Output sync receipt as JSON')
    .action((options: { json?: boolean }) => {
      const scriptPath = resolveBridgeScriptPath(repoRoot);
      const args = [scriptPath, '--sync'];
      if (options.json) args.push('--json');

      console.log(
        chalk.cyan('\n[TNF] Initiating Google Gemini & Antigravity session synchronization...\n')
      );
      const result = spawnSync('python3', args, { stdio: 'inherit' });
      if (result.status === 0) {
        console.log(chalk.green('✓ Google AI session concordance updated successfully.'));
        console.log(
          chalk.dim(
            '  Run `tnf session list` or `tnf google-ai list` to inspect registered sessions.\n'
          )
        );
      } else {
        console.error(chalk.red(`\nSync process exited with code ${result.status}\n`));
      }
    });

  googleAi
    .command('list')
    .description('List recent Google Gemini & Antigravity sessions registered in TNF')
    .option('-n, --limit <count>', 'Number of sessions to show', '15')
    .action((options: { limit: string }) => {
      const limit = parseInt(options.limit, 10) || 15;
      const concordanceFile = path.join(
        os.homedir(),
        '.tnf',
        'personal-intelligence',
        'google_ai_session_concordance.json'
      );

      if (!fs.existsSync(concordanceFile)) {
        console.log(
          chalk.yellow('\nNo Google AI concordance index found. Run `tnf google-ai sync` first.\n')
        );
        return;
      }

      try {
        const raw = fs.readFileSync(concordanceFile, 'utf8');
        const data = JSON.parse(raw);
        const sessions: Array<{
          sessionId: string;
          title: string;
          stepCount: number;
          lastActive: string;
          workspace: string;
        }> = data.sessions || [];

        console.log(
          chalk.bold(
            `\nGoogle AI & Antigravity Sessions (${sessions.length} total indexed, showing top ${limit}):\n`
          )
        );
        console.log(
          `${'Session ID'.padEnd(24)} ${'Title'.padEnd(42)} ${'Steps'.padEnd(8)} ${'Last Active'.padEnd(22)}`
        );
        console.log('-'.repeat(100));

        sessions.slice(0, limit).forEach((s) => {
          const id = s.sessionId.padEnd(24);
          const title = (s.title.length > 40 ? s.title.slice(0, 37) + '...' : s.title).padEnd(42);
          const steps = String(s.stepCount).padEnd(8);
          const active = (s.lastActive || '').slice(0, 19).padEnd(22);
          console.log(`${chalk.cyan(id)} ${title} ${chalk.dim(steps)} ${chalk.dim(active)}`);
        });
        console.log('');
      } catch (err: any) {
        console.error(chalk.red(`Failed to read session index: ${err.message}`));
      }
    });

  googleAi
    .command('view <sessionId>')
    .description('Inspect detailed transcript, steps, and artifacts for a Google AI session')
    .option('--json', 'Output full session metadata as JSON')
    .action((sessionId: string, options: { json?: boolean }) => {
      const scriptPath = resolveBridgeScriptPath(repoRoot);
      const args = [scriptPath, '--view', sessionId];
      if (options.json) args.push('--json');

      const result = spawnSync('python3', args, { stdio: 'inherit' });
      if (result.status !== 0) {
        console.error(chalk.red(`\nFailed to load session details for: ${sessionId}`));
      }
    });

  googleAi
    .command('resume <sessionId>')
    .description(
      'Print resumption instructions or trigger agent resumption for a Google AI session'
    )
    .action((sessionId: string) => {
      const scriptPath = resolveBridgeScriptPath(repoRoot);
      const args = [scriptPath, '--resume', sessionId];

      const result = spawnSync('python3', args, { stdio: 'inherit' });
      if (result.status !== 0) {
        console.error(chalk.red(`\nFailed to generate resume command for: ${sessionId}`));
      }
    });
}
