import type { Command } from 'commander';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { getOrCreateCommand } from './_registry.js';

export interface MemoryRetainResult {
  ok: boolean;
  engine: string;
  text: string;
  tags: string[];
  scope: string;
  notesPath: string;
  harness?: Record<string, unknown>;
  error?: string;
}

function notesPath(): string {
  return path.join(os.homedir(), '.tnf', 'memory', 'notes.jsonl');
}

function runHarnessMemory(
  repoRoot: string,
  args: string[]
): { ok: boolean; stdout: string; stderr: string; status: number } {
  const script = path.join(repoRoot, 'scripts/harness/memory-layer.cjs');
  const result = spawnSync(process.execPath, [script, ...args], {
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

export function retainOperatorMemory(
  repoRoot: string,
  text: string,
  options: { tags?: string[]; scope?: string } = {}
): MemoryRetainResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      ok: false,
      engine: 'none',
      text: '',
      tags: [],
      scope: options.scope || 'project',
      notesPath: notesPath(),
      error: 'remember requires non-empty text',
    };
  }

  const tags = options.tags?.length ? options.tags : ['operator', 'remember'];
  const scope = options.scope || 'project';
  const dest = notesPath();
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.appendFileSync(
    dest,
    `${JSON.stringify({ at: new Date().toISOString(), text: trimmed, tags, scope, source: 'tnf remember' })}\n`
  );

  const harness = runHarnessMemory(repoRoot, [
    'retain',
    '--text',
    trimmed,
    '--tags',
    tags.join(','),
    '--scope',
    scope,
    '--json',
  ]);

  let parsed: Record<string, unknown> | undefined;
  try {
    parsed = harness.stdout ? (JSON.parse(harness.stdout) as Record<string, unknown>) : undefined;
  } catch {
    parsed = { raw: harness.stdout, stderr: harness.stderr };
  }

  return {
    ok: true,
    engine: harness.ok ? 'harness+file' : 'file',
    text: trimmed,
    tags,
    scope,
    notesPath: dest,
    harness: parsed,
    error: harness.ok
      ? undefined
      : harness.stderr || 'harness retain failed; file note still saved',
  };
}

export function registerRememberCommands(program: Command, repoRoot: string): Command {
  const remember = getOrCreateCommand(
    program,
    'remember',
    'Retain or recall operator memory (harness layer + ~/.tnf/memory/notes.jsonl)'
  );

  remember
    .command('retain')
    .description('Save a durable fact the operator asked TNF to remember')
    .argument('<text...>', 'Fact or preference to retain')
    .option('--tags <list>', 'Comma-separated tags', 'operator,remember')
    .option('--scope <scope>', 'global | project | session', 'project')
    .option('--json', 'Machine-readable JSON')
    .action((parts: string[], opts: { tags?: string; scope?: string; json?: boolean }) => {
      const result = retainOperatorMemory(repoRoot, parts.join(' '), {
        tags: String(opts.tags || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        scope: opts.scope,
      });
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }
      if (!result.ok) {
        console.error(result.error || 'remember failed');
        process.exitCode = 1;
        return;
      }
      console.log(`Remembered (${result.engine}): ${result.text}`);
      console.log(`  file: ${result.notesPath}`);
      if (result.error) console.log(`  note: ${result.error}`);
    });

  remember
    .command('recall')
    .description('Recall retained memory matching a query')
    .argument('[query...]', 'Search text')
    .option('--limit <n>', 'Max results', '5')
    .option('--json', 'Machine-readable JSON')
    .action((parts: string[], opts: { limit?: string; json?: boolean }) => {
      const query = parts.join(' ');
      const harness = runHarnessMemory(repoRoot, [
        'recall',
        '--query',
        query,
        '--limit',
        String(opts.limit || '5'),
        '--json',
      ]);
      if (opts.json) {
        console.log(harness.stdout || JSON.stringify({ ok: harness.ok, stderr: harness.stderr }));
        process.exitCode = harness.ok ? 0 : 1;
        return;
      }
      if (harness.stdout.trim()) console.log(harness.stdout.trim());
      if (!harness.ok) {
        if (harness.stderr.trim()) console.error(harness.stderr.trim());
        process.exitCode = 1;
      }
    });

  remember
    .command('status')
    .description('Show harness memory status')
    .option('--json', 'Machine-readable JSON')
    .action((opts: { json?: boolean }) => {
      const args = ['status'];
      if (opts.json) args.push('--json');
      const harness = runHarnessMemory(repoRoot, args);
      if (harness.stdout.trim()) console.log(harness.stdout.trim());
      if (!harness.ok) {
        if (harness.stderr.trim()) console.error(harness.stderr.trim());
        process.exitCode = 1;
      }
    });

  remember.action(() => {
    remember.help();
  });

  return remember;
}
