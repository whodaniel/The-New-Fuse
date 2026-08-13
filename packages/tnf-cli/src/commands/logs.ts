/**
 * packages/tnf-cli/src/commands/logs.ts
 *
 * `tnf logs` — view recent log lines (Hermes parity: `hermes logs`).
 *
 *   tnf logs                   Tail last 50 lines from default sources
 *   tnf logs --n <count>       Number of lines (default 50)
 *   tnf logs --source <name>   Restrict to one source (sync, hermes, cron, ...)
 *
 * Sources are discovered from well-known locations:
 *   - ~/.tnf/cli-sync/cron.log
 *   - ~/.tnf/hermes.log
 *   - ~/.tnf/*.log
 *
 * Read-only.
 */

import { Command } from 'commander';
import fs from 'fs';
import os from 'os';
import path from 'path';

function discoverLogFiles(): { source: string; path: string }[] {
  const dir = path.join(os.homedir(), '.tnf');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.log') && fs.statSync(path.join(dir, f)).isFile())
    .map((f) => ({
      source: f.replace(/\.log$/, ''),
      path: path.join(dir, f),
    }));
}

function tail(filePath: string, n: number): string[] {
  if (!fs.existsSync(filePath)) return [`(missing: ${filePath})`];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  return lines.slice(Math.max(0, lines.length - n));
}

export function registerLogsCommand(program: Command, _repoRoot: string): void {
  program
    .command('logs')
    .description('Tail recent log lines (Hermes parity)')
    .option('--n <count>', 'Number of lines to show', '50')
    .option('--source <name>', 'Restrict to a single log source (filename without .log)')
    .option('--json', 'Emit JSON {source, lines: []} per source')
    .action((opts: { n?: string; source?: string; json?: boolean } = {}) => {
      const n = Math.max(1, parseInt(opts.n ?? '50', 10) || 50);
      let sources = discoverLogFiles();
      if (opts.source) {
        sources = sources.filter((s) => s.source === opts.source);
        if (sources.length === 0) {
          console.error(
            `No log source named "${opts.source}". Available: ${discoverLogFiles()
              .map((s) => s.source)
              .join(', ')}`
          );
          process.exit(1);
        }
      }
      if (opts.json) {
        const out = sources.map((s) => ({ source: s.source, lines: tail(s.path, n) }));
        console.log(JSON.stringify(out, null, 2));
      } else {
        for (const s of sources) {
          console.log(`\n--- ${s.source} (${s.path}) ---`);
          for (const line of tail(s.path, n)) console.log(line);
        }
      }
    });
}
