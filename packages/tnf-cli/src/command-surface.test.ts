/**
 * Command-surface oracle — Stage 0 of the cli.ts restructure.
 *
 * WHY THIS EXISTS FIRST
 *   docs/operations/tnf-cli-restructure-scope.md plans to move 296 action
 *   handlers out of a 19,214-line cli.ts. Before this test, **zero** tests
 *   exercised the command surface: 13 test files existed and none invoked a
 *   command. Moving that many handlers with no oracle is how a CLI silently
 *   loses commands while `--help` keeps advertising them.
 *
 *   This snapshots every command, alias, option and description at every depth
 *   (410 commands, 670 options) from the real registered commander tree, and
 *   fails when the surface changes. Restructuring is safe exactly to the degree
 *   this stays green.
 *
 * NOT A BEHAVIOUR TEST
 *   It proves the surface is unchanged, not that handlers still work. It cannot
 *   catch a moved command whose action broke. Claiming otherwise would be the
 *   false-confidence failure this repo keeps finding — a guard trusted for more
 *   than it checks.
 *
 * ON INTENTIONAL CHANGES
 *   Adding or removing a command SHOULD fail this. Re-run with --update, and
 *   review the snapshot diff as part of the change: the diff is the point.
 *
 * Run:    pnpm --filter @the-new-fuse/tnf-cli test
 * Update: npx tsx src/command-surface.test.ts --update
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(here, '..', 'dist', 'cli.js');
const SNAPSHOT = path.resolve(here, 'command-surface.snapshot.json');
const UPDATE = process.argv.includes('--update');

interface Node {
  name: string;
  aliases: string[];
  description: string;
  options: { flags: string; description: string }[];
  commands: Node[];
}

/** Flatten to `path -> signature` so a diff names the command that moved. */
function flatten(node: Node, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  const at = prefix ? `${prefix} ${node.name}` : node.name;
  out.set(
    at,
    JSON.stringify({
      aliases: node.aliases,
      description: node.description,
      options: node.options,
    })
  );
  for (const child of node.commands) for (const [k, v] of flatten(child, at)) out.set(k, v);
  return out;
}

function main(): void {
  console.log('\ncommand-surface: cli.ts registration oracle\n');

  // A missing build makes every comparison meaningless. Exit 2 so "cannot run"
  // is never mistaken for "surface unchanged" — dist/ is deleted hourly by
  // `pnpm run clean` via cron.
  if (!fs.existsSync(CLI)) {
    console.error(`  CANNOT RUN  ${CLI} does not exist.`);
    console.error('              Build first: pnpm --filter @the-new-fuse/tnf-cli build');
    process.exit(2);
  }

  const run = spawnSync('node', [CLI, '--dump-command-surface'], {
    cwd: path.resolve(here, '..', '..', '..'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 120_000,
  });

  if (run.status !== 0 || !run.stdout.trim()) {
    console.error('  CANNOT RUN  --dump-command-surface produced no usable output.');
    console.error(`              exit=${run.status} signal=${run.signal ?? 'none'}`);
    console.error(`              ${(run.stderr || '').slice(0, 300)}`);
    process.exit(2);
  }

  let current: Node;
  try {
    current = JSON.parse(run.stdout);
  } catch (err) {
    console.error(`  CANNOT RUN  surface output is not valid JSON: ${(err as Error).message}`);
    process.exit(2);
  }

  if (UPDATE) {
    fs.writeFileSync(SNAPSHOT, `${JSON.stringify(current, null, 2)}\n`, 'utf8');
    const n = flatten(current).size;
    console.log(`  UPDATED  snapshot rewritten with ${n} command path(s).`);
    console.log(
      '           Review the diff — an unintended removal looks identical to an intended one.\n'
    );
    return;
  }

  if (!fs.existsSync(SNAPSHOT)) {
    console.error(
      '  CANNOT RUN  no snapshot on disk. Create one: npx tsx src/command-surface.test.ts --update'
    );
    process.exit(2);
  }

  const expected = flatten(JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8')) as Node);
  const actual = flatten(current);

  const removed = [...expected.keys()].filter((k) => !actual.has(k));
  const added = [...actual.keys()].filter((k) => !expected.has(k));
  const changed = [...expected.keys()].filter(
    (k) => actual.has(k) && actual.get(k) !== expected.get(k)
  );

  const show = (label: string, items: string[]) => {
    if (!items.length) return;
    console.log(`  ${label} (${items.length}):`);
    for (const i of items.slice(0, 15)) console.log(`      ${i}`);
    if (items.length > 15) console.log(`      … and ${items.length - 15} more`);
  };

  if (!removed.length && !added.length && !changed.length) {
    console.log(`  PASS  surface matches snapshot (${actual.size} command paths, unchanged)\n`);
    process.exit(0);
  }

  console.log('  FAIL  command surface differs from snapshot\n');
  show('REMOVED — these commands no longer exist', removed);
  show('ADDED', added);
  show('CHANGED — aliases, description or options differ', changed);
  console.log(
    '\n  If intended: npx tsx src/command-surface.test.ts --update, and review the diff.\n'
  );
  process.exit(1);
}

main();
