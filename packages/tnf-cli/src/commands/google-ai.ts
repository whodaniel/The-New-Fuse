/**
 * Google Gemini & Antigravity Personal Intelligence CLI Commands
 *
 * Provides native `tnf google-ai` (alias: `tnf agy`) commands
 * to inspect, synchronize, and expose Google AI ecosystem sessions, projects,
 * conversations, and intelligence artifacts directly inside the TNF CLI.
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import chalk from 'chalk';
import type { Command } from 'commander';

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
  const googleAi = program
    .command('google-ai')
    .alias('agy')
    .description('Google Gemini & Antigravity Personal Intelligence integration commands');

  googleAi
    .command('status')
    .description('Inspect connection to Google Gemini & Antigravity local database, brains, and projects')
    .option('--json', 'Output ecosystem state as JSON')
    .action(async (options: { json?: boolean }) => {
      const scriptPath = resolveBridgeScriptPath(repoRoot);
      const args = [scriptPath, '--status'];
      if (options.json) args.push('--json');

      const proc = spawn('python3', args, { stdio: 'inherit' });
      proc.on('exit', (code) => {
        if (code !== 0) {
          console.error(chalk.red(`\nFailed to inspect Google AI ecosystem (exit code ${code})`));
        }
      });
    });

  googleAi
    .command('sync')
    .description('Synchronize all Google Gemini / Antigravity conversations & brains into TNF session stores')
    .option('--json', 'Output sync receipt as JSON')
    .action(async (options: { json?: boolean }) => {
      const scriptPath = resolveBridgeScriptPath(repoRoot);
      const args = [scriptPath, '--sync'];
      if (options.json) args.push('--json');

      console.log(chalk.cyan('\n[TNF] Initiating Google Gemini & Antigravity session synchronization...\n'));
      const proc = spawn('python3', args, { stdio: 'inherit' });
      proc.on('exit', (code) => {
        if (code === 0) {
          console.log(chalk.green('✓ Google AI session concordance updated successfully.'));
          console.log(chalk.dim('  Run `tnf session list` to inspect registered sessions.'));
        } else {
          console.error(chalk.red(`\nSync process exited with code ${code}`));
        }
      });
    });

  googleAi
    .command('list')
    .description('List recent Google Gemini & Antigravity sessions registered in TNF')
    .option('-n, --limit <count>', 'Number of sessions to show', '15')
    .action(async (options: { limit: string }) => {
      const limit = parseInt(options.limit, 10) || 15;
      const concordanceFile = path.join(os.homedir(), '.tnf', 'personal-intelligence', 'google_ai_session_concordance.json');

      if (!fs.existsSync(concordanceFile)) {
        console.log(chalk.yellow('\nNo Google AI concordance index found. Run `tnf google-ai sync` first.\n'));
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

        console.log(chalk.bold(`\nGoogle AI & Antigravity Sessions (${sessions.length} total indexed, showing top ${limit}):\n`));
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
}
