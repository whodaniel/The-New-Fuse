#!/usr/bin/env node
/**
 * TNF Notation Reconciliation Auditor
 *
 * Why this exists (2026-09-02):
 *   While investigating a live task, an agent read
 *   `.agent/skills/browser-automation/SKILL.md` and concluded from it that
 *   Fuse Connect (apps/chrome-extension) was the only browser-automation
 *   surface, and separately that a "legacy" label on one CLI file's old
 *   navigation backend meant the whole extension was superseded. Neither
 *   was true: `agent-browser` had become the primary stateful-navigation
 *   tool with zero mention in that skill file, and the "legacy" comment was
 *   scoped to one command's backend choice, not a verdict on the extension's
 *   still-live, still-checked cross-tab federation capability. The doc
 *   hadn't been touched since the underlying system changed under it.
 *
 *   This is a *notation* drift, distinct from STATE_FRESHNESS_MANDATE.md's
 *   concern (a live external fact decaying between observation and use).
 *   Notation drift is static: a doc asserted something about the codebase's
 *   shape — a path, a command, a "this is legacy/deprecated/current" claim —
 *   and the codebase moved without the doc moving with it. Nothing catches
 *   this class of defect today; this script is a first, deliberately
 *   pragmatic pass at catching the machine-checkable half of it.
 *
 * What it does (three checks, ordered cheapest/most-certain first):
 *   1. PATH REFERENCES — every backtick- or code-block-quoted path that
 *      looks like a repo-relative file/dir reference is checked for
 *      existence. High confidence: a dangling path is either a rename that
 *      wasn't propagated to the doc, or a doc describing something that
 *      never landed.
 *   2. COMMAND REFERENCES — `pnpm run <script>` / `pnpm --filter X run Y`
 *      references are checked against that package.json's (or the root's)
 *      `scripts` map. `tnf <subcommand>` references are checked with a
 *      grep-based heuristic against packages/tnf-cli/src (best-effort: a
 *      miss is a signal to check by hand, not proof the command is gone).
 *   3. STALENESS LANGUAGE — lines containing legacy/deprecated/archived/
 *      "no longer"/superseded/outdated are surfaced, NOT judged. A script
 *      cannot tell "this really is dead" from "this doc is wrong about it
 *      being dead" (the Fuse Connect case was the latter). These are for a
 *      human or an agent's semantic read, the same kind of check that
 *      caught the original bug — grep the claim, then go verify it against
 *      the actual code before trusting either the doc or your own assumption.
 *
 * What it deliberately does NOT do:
 *   Judge whether a documented *behavior* still matches actual behavior
 *   (that needs running code, or a human/agent read, not a static scan).
 *   Treat this script's output as a worklist, not a verdict — see "STALENESS
 *   LANGUAGE" above for why.
 *
 * Modes:
 *   --scan [globs...]   Which corpora to audit. Default: .agent/skills,
 *                        docs/protocols, AGENTS.md, CLAUDE.md, .agent/*.md
 *   --only <file>       Audit a single file (still runs full checks)
 *   --json               Machine-readable report on stdout
 *   --strict              Exit 1 if any dangling path/command was found
 *                        (staleness-language hits never fail the run — they
 *                        are prompts to look, not confirmed defects)
 *
 * Output (default, --json): JSON with { generatedAt, filesScanned,
 *   danglingPaths[], danglingCommands[], stalenessFlags[], summary }.
 *
 * Follow-up for a real defect: fix the doc (or the code, if the doc was
 * right and the code drifted), then re-run this file with --only.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');

// Deliberately excludes docs/protocols/reports/**, _archive/**, schemas/**,
// bridges/**, and other generated/transient/historical subtrees — those are
// session output, not durable notation agents navigate by, and auditing them
// mostly surfaces noise from one-off paths that were only ever meant to be
// true for the session that wrote them.
const DEFAULT_SCAN_GLOBS = [
  '.agent/skills/**/*.md',
  'docs/protocols/*.md',
  'AGENTS.md',
  'CLAUDE.md',
];

// Bulk-imported third-party skill packs living under .agent/skills/. These
// document THEIR product (Cloudflare, Antigravity, imported Claude agents),
// not this codebase — their example paths were never meant to resolve here,
// so auditing them for dangling repo-paths is pure noise, not a finding.
// Excluded from the default corpus; pass --scan explicitly to include one.
const VENDOR_SKILL_PACK_PREFIXES = [
  '.agent/skills/antigravity/',
  '.agent/skills/cloudflare-deploy/',
  '.agent/skills/imported-claude-agents/',
  '.agent/skills/api-gateway/',
];
// Root-level .agent/*.md files (not recursing into skills/, which is covered above)
const AGENT_ROOT_MD = () =>
  fs
    .readdirSync(path.join(ROOT, '.agent'), { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => path.join('.agent', e.name));

const STALENESS_TERMS = [
  'legacy',
  'deprecated',
  'archived',
  'no longer',
  'superseded',
  'outdated',
  'obsolete',
  'sunset',
];

function parseArgs(argv) {
  const args = { scan: [], only: '', json: false, strict: false, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === '--json') args.json = true;
    else if (t === '--strict') args.strict = true;
    else if (t === '--only') args.only = argv[++i] || '';
    else if (t === '--scan') {
      while (argv[i + 1] && !argv[i + 1].startsWith('--')) {
        args.scan.push(argv[++i]);
      }
    } else if (t === '-h' || t === '--help') args.help = true;
  }
  return args;
}

function printHelp() {
  console.log(`TNF Notation Reconciliation Auditor

Usage:
  node scripts/protocols/notation-reconciliation-audit.cjs [--scan <globs...>] [--only <file>] [--json] [--strict]

Default corpus: .agent/skills/**/*.md, docs/protocols/**/*.md, AGENTS.md,
CLAUDE.md, .agent/*.md

See the file header for what the three checks do and don't cover.`);
}

// --- minimal glob (supports **, *, and plain paths — enough for this corpus) ---
function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i += 1) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') {
      re += '.*';
      i += 1;
      if (glob[i + 1] === '/') i += 1;
    } else if (c === '*') {
      re += '[^/]*';
    } else if ('.+^$()[]{}|\\'.includes(c)) {
      re += `\\${c}`;
    } else {
      re += c;
    }
  }
  return new RegExp(`^${re}$`);
}

function walk(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist') continue;
      walk(full, out);
    } else if (e.isFile()) {
      out.push(full);
    }
  }
}

function expandGlob(glob) {
  const absRoot = ROOT;
  if (!glob.includes('*')) {
    const abs = path.join(absRoot, glob);
    return fs.existsSync(abs) ? [abs] : [];
  }
  const starIdx = glob.indexOf('*');
  const lastSlashBeforeStar = glob.lastIndexOf('/', starIdx);
  const baseDir = lastSlashBeforeStar === -1 ? '' : glob.slice(0, lastSlashBeforeStar);
  const allFiles = [];
  walk(path.join(absRoot, baseDir), allFiles);
  const re = globToRegExp(glob);
  return allFiles.filter((f) => re.test(path.relative(absRoot, f)));
}

function collectFiles(scanGlobs) {
  const usingDefault = scanGlobs.length === 0;
  const globs = usingDefault ? [...DEFAULT_SCAN_GLOBS, ...AGENT_ROOT_MD()] : scanGlobs;
  const files = new Set();
  for (const g of globs) {
    for (const f of expandGlob(g)) files.add(f);
  }
  let list = [...files];
  if (usingDefault) {
    list = list.filter((f) => {
      const rel = path.relative(ROOT, f);
      return !VENDOR_SKILL_PACK_PREFIXES.some((p) => rel.startsWith(p));
    });
  }
  return list.sort();
}

// --- path-reference extraction ---
// Matches backtick-quoted or bare tokens that look like repo-relative paths:
// at least one "/" or a recognizable extension, no spaces, not a URL.
const PATH_TOKEN_RE =
  /`([a-zA-Z0-9_.\-]+(?:\/[a-zA-Z0-9_.\-]+)+\.[a-zA-Z0-9]+)`|`((?:apps|packages|scripts|docs|\.agent|\.claude)\/[a-zA-Z0-9_.\-/]+)`/g;

const IGNORED_PATH_PREFIXES = ['http://', 'https://', 'ws://', 'wss://'];
const IGNORE_PATH_EXACT = new Set(['e.g.', 'i.e.']);

function extractPathRefs(content) {
  const refs = [];
  let m;
  const re = new RegExp(PATH_TOKEN_RE);
  while ((m = re.exec(content))) {
    const candidate = m[1] || m[2];
    if (!candidate) continue;
    if (IGNORED_PATH_PREFIXES.some((p) => candidate.startsWith(p))) continue;
    if (IGNORE_PATH_EXACT.has(candidate)) continue;
    if (candidate.includes(' ')) continue;
    refs.push({ raw: candidate, index: m.index });
  }
  return refs;
}

function lineNumberAt(content, index) {
  return content.slice(0, index).split('\n').length;
}

function checkPathExists(rawPath) {
  // Strip a trailing glob suffix like "/**" or "/*" for existence checking —
  // we only verify the concrete directory prefix exists.
  const concrete = rawPath.replace(/\/\*\*.*$/, '').replace(/\/\*[^/]*$/, '');
  const abs = path.join(ROOT, concrete);
  return fs.existsSync(abs);
}

// --- command-reference extraction ---
// Skips CLI flags (-s, --silent, ...) between "run" and the script name.
// A trailing "*" (a documented prefix-match convention, e.g.
// "tnf:live:agents:*") is captured separately and checked as a prefix
// rather than an exact script name.
const PNPM_RUN_RE =
  /pnpm\s+(?:--filter\s+\S+\s+)?run\s+(?:-{1,2}\S+\s+)*([a-zA-Z0-9:_-]+)(\*)?/g;
const TNF_CMD_RE = /`tnf\s+([a-zA-Z0-9_-]+)(?:\s+([a-zA-Z0-9_-]+))?/g;

let rootPkgScriptsCache = null;
function rootPkgScripts() {
  if (rootPkgScriptsCache) return rootPkgScriptsCache;
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    rootPkgScriptsCache = new Set(Object.keys(pkg.scripts || {}));
  } catch {
    rootPkgScriptsCache = new Set();
  }
  return rootPkgScriptsCache;
}

let tnfCliSourceCache = null;
function tnfCliSourceContains(token) {
  if (tnfCliSourceCache === null) {
    try {
      tnfCliSourceCache = execSync(
        `grep -rl ${JSON.stringify(token)} ${JSON.stringify(path.join(ROOT, 'packages', 'tnf-cli', 'src'))} 2>/dev/null || true`,
        { encoding: 'utf8', maxBuffer: 1024 * 1024 * 16 }
      );
    } catch {
      tnfCliSourceCache = '';
    }
    return tnfCliSourceCache.trim().length > 0;
  }
  // Cache is per-token in practice tiny corpus size; re-grep each call is
  // cheap enough here and avoids a second cache dimension.
  try {
    const out = execSync(
      `grep -rl ${JSON.stringify(token)} ${JSON.stringify(path.join(ROOT, 'packages', 'tnf-cli', 'src'))} 2>/dev/null || true`,
      { encoding: 'utf8', maxBuffer: 1024 * 1024 * 16 }
    );
    return out.trim().length > 0;
  } catch {
    return false;
  }
}

function extractCommandRefs(content) {
  const refs = [];
  let m;
  const pnpmRe = new RegExp(PNPM_RUN_RE);
  while ((m = pnpmRe.exec(content))) {
    refs.push({ type: 'pnpm', script: m[1], isPrefix: Boolean(m[2]), index: m.index });
  }
  const tnfRe = new RegExp(TNF_CMD_RE);
  while ((m = tnfRe.exec(content))) {
    refs.push({ type: 'tnf', sub: m[1], index: m.index });
  }
  return refs;
}

function checkCommandExists(ref) {
  if (ref.type === 'pnpm') {
    if (ref.isPrefix) {
      for (const s of rootPkgScripts()) {
        if (s.startsWith(ref.script)) return true;
      }
      return false;
    }
    return rootPkgScripts().has(ref.script);
  }
  if (ref.type === 'tnf') {
    // Heuristic only — commander subcommand names appear as string literals
    // in cli.ts / commands/*.ts. A miss here is a prompt to check by hand,
    // not proof the subcommand is gone (dynamic registration exists).
    return tnfCliSourceContains(`'${ref.sub}'`) || tnfCliSourceContains(`"${ref.sub}"`);
  }
  return true;
}

// --- staleness language ---
function extractStalenessFlags(content) {
  const flags = [];
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    const lower = line.toLowerCase();
    for (const term of STALENESS_TERMS) {
      if (lower.includes(term)) {
        flags.push({ line: i + 1, term, text: line.trim().slice(0, 200) });
        break; // one flag per line is enough
      }
    }
  });
  return flags;
}

function auditFile(absPath) {
  const rel = path.relative(ROOT, absPath);
  const content = fs.readFileSync(absPath, 'utf8');

  const danglingPaths = [];
  for (const ref of extractPathRefs(content)) {
    if (!checkPathExists(ref.raw)) {
      danglingPaths.push({ file: rel, line: lineNumberAt(content, ref.index), path: ref.raw });
    }
  }

  const danglingCommands = [];
  for (const ref of extractCommandRefs(content)) {
    if (!checkCommandExists(ref)) {
      danglingCommands.push({
        file: rel,
        line: lineNumberAt(content, ref.index),
        command:
          ref.type === 'pnpm'
            ? `pnpm run ${ref.script}${ref.isPrefix ? '*' : ''}`
            : `tnf ${ref.sub}`,
        type: ref.type,
      });
    }
  }

  const stalenessFlags = extractStalenessFlags(content).map((f) => ({ file: rel, ...f }));

  return { danglingPaths, danglingCommands, stalenessFlags };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const files = args.only
    ? [path.join(ROOT, args.only)].filter((f) => fs.existsSync(f))
    : collectFiles(args.scan);

  if (args.only && files.length === 0) {
    console.error(`[notation-audit] --only file not found: ${args.only}`);
    process.exitCode = 2;
    return;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    filesScanned: files.length,
    danglingPaths: [],
    danglingCommands: [],
    stalenessFlags: [],
  };

  for (const f of files) {
    const result = auditFile(f);
    report.danglingPaths.push(...result.danglingPaths);
    report.danglingCommands.push(...result.danglingCommands);
    report.stalenessFlags.push(...result.stalenessFlags);
  }

  report.summary = {
    filesScanned: report.filesScanned,
    danglingPathCount: report.danglingPaths.length,
    danglingCommandCount: report.danglingCommands.length,
    stalenessFlagCount: report.stalenessFlags.length,
  };

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`[notation-audit] scanned ${report.filesScanned} file(s)`);
    console.log('');
    if (report.danglingPaths.length) {
      console.log(`DANGLING PATHS (${report.danglingPaths.length}) — referenced but do not exist:`);
      for (const d of report.danglingPaths) {
        console.log(`  ${d.file}:${d.line}  \`${d.path}\``);
      }
      console.log('');
    } else {
      console.log('DANGLING PATHS: none');
      console.log('');
    }

    if (report.danglingCommands.length) {
      console.log(
        `DANGLING COMMANDS (${report.danglingCommands.length}) — not found where expected (tnf hits are heuristic, verify by hand):`
      );
      for (const d of report.danglingCommands) {
        console.log(`  ${d.file}:${d.line}  ${d.command}`);
      }
      console.log('');
    } else {
      console.log('DANGLING COMMANDS: none');
      console.log('');
    }

    if (report.stalenessFlags.length) {
      console.log(
        `STALENESS LANGUAGE (${report.stalenessFlags.length}) — claims to verify by hand, not confirmed defects:`
      );
      for (const s of report.stalenessFlags) {
        console.log(`  ${s.file}:${s.line}  [${s.term}]  ${s.text}`);
      }
    } else {
      console.log('STALENESS LANGUAGE: none found');
    }
  }

  if (args.strict && (report.danglingPaths.length || report.danglingCommands.length)) {
    process.exitCode = 1;
  }
}

main();
