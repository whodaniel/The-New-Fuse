#!/usr/bin/env node
/**
 * scripts/agents/onboard-cli-platform.cjs
 *
 * Automates steps 3-4 of the TNF CLI agent onboarding contract
 * (~/.agents/skills/tnf-cli-agent-onboarding/SKILL.md): platform taxonomy
 * registration and passthrough dispatch wiring in packages/tnf-cli/src/cli.ts.
 *
 * Previously these were hand-edits at four regular sites. This script patches
 * them idempotently so onboarding a new agent CLI is a single command:
 *
 *   1. PLATFORM_TAXONOMY array          -> `tnf register <id>` is canonical
 *   2. passthroughTargets array         -> implicit dispatch in
 *                                          resolveImplicitPassthroughArgs()
 *   3. is<X>PassthroughArgv() helper    -> explicit argv dispatch
 *   4. main() dispatch block            -> runPassthrough('<id>', ...)
 *
 * With sites 3+4 present, `tnf <id> --help` dispatches straight to the target
 * CLI with TNF harness MCP routing injected (buildPassthroughEnv).
 *
 * Usage:
 *   node scripts/agents/onboard-cli-platform.cjs <id>            # wire it up
 *   node scripts/agents/onboard-cli-platform.cjs <id> --check    # exit 0 iff fully wired
 *   node scripts/agents/onboard-cli-platform.cjs <id> --json     # machine-readable
 *   node scripts/agents/onboard-cli-platform.cjs <id> --file <path>  # override target
 *
 * Exit codes: 0 = wired (or already wired) / all sites present on --check;
 *             1 = missing sites (on --check) or patch failure.
 * After patching, rebuild the CLI (pnpm --filter <tnf-cli-pkg> build) so the
 * dist surface picks up the change, then run the skill's verification gate.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_TARGET = path.join(REPO_ROOT, 'packages', 'tnf-cli', 'src', 'cli.ts');

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const args = { id: null, check: false, json: false, file: DEFAULT_TARGET };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--check') args.check = true;
    else if (a === '--json') args.json = true;
    else if (a === '--file') args.file = path.resolve(argv[++i] || '');
    else if (a === '--help' || a === '-h') args.help = true;
    else if (!a.startsWith('-') && args.id === null) args.id = a;
    else {
      console.error(`Unknown or misplaced argument: ${a}`);
      process.exit(2);
    }
  }
  return args;
}

function pascalCase(id) {
  return id
    .split('-')
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join('');
}

// ---------------------------------------------------------------------------
// Patch primitives
// ---------------------------------------------------------------------------

/**
 * Insert `quotedEntry` (e.g. `'my-cli'`) into the array opened by
 * `headerMarker` (a unique literal) as a new line before its closing `];`.
 * The entry indentation is derived from the array's own last entry so both
 * column-0 and indented arrays keep their style. Returns { status } where
 * status is one of 'present' | 'inserted' | 'not_found'.
 */
function insertIntoArray(source, headerMarker, quotedEntry) {
  const headerIdx = source.indexOf(headerMarker);
  if (headerIdx === -1) return { source, status: 'not_found' };

  const closeIdx = source.indexOf('];', headerIdx);
  if (closeIdx === -1) return { source, status: 'not_found' };

  const block = source.slice(headerIdx, closeIdx);
  if (block.includes(quotedEntry)) return { source, status: 'present' };

  // Match the indentation of the last existing entry line.
  let entryIndent = '  ';
  for (const line of block.split('\n').reverse()) {
    const m = line.match(/^(\s*)'[^']*',\s*$/);
    if (m) {
      entryIndent = m[1];
      break;
    }
  }

  // Insert at the start of the closing-bracket line, preserving that line's
  // own leading whitespace untouched.
  const lineStart = source.lastIndexOf('\n', closeIdx - 1) + 1;
  const patched =
    source.slice(0, lineStart) + `${entryIndent}${quotedEntry},\n` + source.slice(lineStart);
  return { source: patched, status: 'inserted' };
}

/**
 * Append a generated block after the LAST match of `pattern`. Returns
 * { status: 'present' | 'inserted' | 'not_found' }.
 */
function appendAfterLastMatch(source, pattern, generatedBlock, presenceNeedle) {
  const regex = new RegExp(pattern, 'g');
  let last = null;
  let m;
  while ((m = regex.exec(source)) !== null) last = m;
  if (!last) return { source, status: 'not_found' };

  if (presenceNeedle && source.includes(presenceNeedle)) {
    return { source, status: 'present' };
  }

  const insertAt = last.index + last[0].length;
  const before = source.slice(0, insertAt);
  let after = source.slice(insertAt);
  // Normalize the seam: exactly one blank line between the matched block and
  // the inserted block, and one between the inserted block and what follows.
  if (!after.startsWith('\n')) after = '\n' + after;
  after = after.replace(/^\n+/, '');
  const patched =
    before + '\n\n' + generatedBlock.trimEnd() + '\n\n' + after;
  return { source: patched, status: 'inserted' };
}

// ---------------------------------------------------------------------------
// Site definitions
// ---------------------------------------------------------------------------
function buildSites(id) {
  const fnName = `is${pascalCase(id)}PassthroughArgv`;
  // Alternative dispatch path: a dedicated commander command (e.g. `tnf agy`)
  // satisfies the dispatch contract without the generic argv-helper pattern.
  const hasDedicatedCommand = (src) => src.includes(`.command('${id}')`);

  const helperFn = [
    `function ${fnName}(argv: string[]): boolean {`,
    `  const subcommand = argv[2];`,
    `  return subcommand === '${id}';`,
    `}`,
  ].join('\n');

  const dispatchBlock = [
    `  if (${fnName}(argv)) {`,
    `    await runPassthrough('${id}', argv.slice(3));`,
    `    return;`,
    `  }`,
  ].join('\n');

  const helperFnPattern =
    "function \\w+PassthroughArgv\\(argv: string\\[\\]\\): boolean \\{\\n  const subcommand = argv\\[2\\];\\n  return subcommand === '[^']+';\\n\\}";
  const dispatchPattern =
    "  if \\(is\\w+PassthroughArgv\\(argv\\)\\) \\{\\n    await runPassthrough\\('[^']+', argv\\.slice\\(3\\)\\);\\n    return;\\n  \\}";

  return [
    {
      name: 'platform_taxonomy',
      description: 'PLATFORM_TAXONOMY array (canonical runtime platform)',
      apply: (src) => insertIntoArray(src, 'export const PLATFORM_TAXONOMY: string[] = [', `'${id}'`),
    },
    {
      name: 'passthrough_targets',
      description: 'passthroughTargets array (implicit dispatch resolution)',
      apply: (src) => insertIntoArray(src, 'const passthroughTargets = [', `'${id}'`),
    },
    {
      name: 'argv_helper',
      description: `isXxxPassthroughArgv helper (${fnName})`,
      alternativeSatisfied: hasDedicatedCommand,
      apply: (src) =>
        appendAfterLastMatch(
          src,
          helperFnPattern,
          helperFn,
          `function ${fnName}(argv: string[])`
        ),
    },
    {
      name: 'main_dispatch',
      description: 'main() explicit dispatch block (runPassthrough)',
      alternativeSatisfied: hasDedicatedCommand,
      apply: (src) =>
        appendAfterLastMatch(
          src,
          dispatchPattern,
          dispatchBlock,
          `if (${fnName}(argv)) {`
        ),
    },
  ];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.id) {
    console.error('Usage: node scripts/agents/onboard-cli-platform.cjs <id> [--check] [--json] [--file <path>]');
    process.exit(args.help ? 0 : 2);
  }

  const id = args.id;
  if (!/^[a-z][a-z0-9-]*$/.test(id)) {
    console.error(`Invalid platform id '${id}': must match /^[a-z][a-z0-9-]*$/ (e.g. 'command-code')`);
    process.exit(2);
  }

  let source;
  try {
    source = fs.readFileSync(args.file, 'utf8');
  } catch (err) {
    console.error(`Cannot read target file ${args.file}: ${err.message}`);
    process.exit(2);
  }

  const sites = buildSites(id);
  const results = [];
  let working = source;
  let fatal = null;

  for (const site of sites) {
    try {
      if (site.alternativeSatisfied && site.alternativeSatisfied(working)) {
        results.push({ site: site.name, description: site.description, status: 'present', via: 'dedicated-command' });
        continue;
      }
      const { source: patched, status } = site.apply(working);
      if (status === 'not_found') {
        results.push({ site: site.name, description: site.description, status });
        fatal = site.name;
        break;
      }
      working = patched;
      results.push({ site: site.name, description: site.description, status });
    } catch (err) {
      results.push({ site: site.name, description: site.description, status: 'error', error: err.message });
      fatal = site.name;
      break;
    }
  }

  const allPresent = results.length === sites.length && results.every((r) => r.status === 'present');
  // Patch mode succeeds on present|inserted; check mode requires already-present.
  const allWired = args.check ? allPresent : allPresent || results.every((r) => r.status === 'inserted');

  if (!args.check && !fatal && working !== source) {
    fs.writeFileSync(args.file, working, 'utf8');
  }

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          id,
          target: args.file,
          mode: args.check ? 'check' : 'patch',
          wired: allWired,
          changed: !args.check && !fatal && working !== source,
          sites: results,
        },
        null,
        2
      )
    );
  } else {
    console.log(`TNF CLI platform onboarding: '${id}'`);
    console.log(`Target: ${args.file}`);
    for (const r of results) {
      const missing = r.status === 'inserted' && args.check;
      const mark =
        r.status === 'present' ? '✓ already wired' :
        missing ? '✗ missing (would be inserted)' :
        r.status === 'inserted' ? '✚ wired' :
        r.status === 'error' ? `✗ error: ${r.error}` : '✗ anchor not found';
      console.log(`  [${r.site}] ${mark} — ${r.description}`);
    }
    if (fatal) {
      console.error(`\nFAILED at '${fatal}'. cli.ts anchors drifted; update script patterns.`);
    } else if (args.check) {
      console.log(allWired ? '\nAll sites wired.' : '\nSome sites are missing.');
    } else if (allWired) {
      console.log('\nNext: rebuild the tnf-cli package, then run the onboarding verification gate:');
      console.log('  pnpm --filter <tnf-cli-package> build');
      console.log('  tnf traits list --json | grep ' + id);
      console.log(`  tnf ${id} --help   # must dispatch to the target CLI`);
    }
  }

  if (fatal) process.exit(1);
  if (args.check && !allWired) process.exit(1);
  process.exit(0);
}

main();
