#!/usr/bin/env node
/**
 * tnf-cli-sync.mjs — Keep TNF CLI surface in sync with Hermes Agent capabilities
 *
 * PURPOSE
 *   Compare TNF CLI top-level commands with Hermes Agent top-level commands,
 *   and report missing capabilities. Agent spec files (.agent/agents/*.md) are
 *   surfaced separately as 'agentRegistry' (informational, not a 1:1 command gap).
 *
 * USAGE
 *   node scripts/agents/sync-tnf-cli-with-agents.mjs [--auto-fix]
 *
 * OUTPUT
 *   - Console: human-readable summary
 *   - ~/.tnf/cli-sync/latest-report.json (machine-readable)
 *
 * DESIGN NOTES
 *   - Top-level commands are parsed from real CLI source:
 *       Hermes: `hermes --help` (preferred) or fallback to `pi-coding-agent` CLI surface
 *       TNF:    `packages/tnf-cli/src/cli.ts` — both `program.command('x')` and `registerXCommand(...)`
 *   - Agent specs are listed (count) but NOT counted as missing commands.
 *   - Uses __dirname-based relative path resolution (portable, no hardcoded paths).
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..', '..');

const CONFIG = {
  outputPath: join(os.homedir(), '.tnf', 'cli-sync', 'latest-report.json'),
  hermesBin: process.env.HERMES_BIN || 'hermes',
  tnfCliSrc: join(repoRoot, 'packages', 'tnf-cli', 'src', 'cli.ts'),
  tnfCliPkg: join(repoRoot, 'packages', 'tnf-cli', 'package.json'),
  agentSpecsDir: join(repoRoot, '.agent', 'agents'),
};

// ---------------------------------------------------------------------------
// Hermes top-level commands — parsed from `hermes --help`
// ---------------------------------------------------------------------------
function getHermesCommands() {
  // Try live CLI first
  try {
    const help = execSync(`${CONFIG.hermesBin} --help`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    return parsePositionalCommands(help);
  } catch {
    // Fall through to extraction from dist
  }
  // Fallback: scrape pi-coding-agent dist
  try {
    const hermesHome = join(os.homedir(), '.hermes', 'node', 'lib', 'node_modules', '@earendil-works', 'pi-coding-agent', 'dist');
    const candidates = ['cli.js', 'main.js'];
    for (const f of candidates) {
      const p = join(hermesHome, f);
      if (existsSync(p)) {
        const content = readFileSync(p, 'utf-8');
        // Pi-coding-agent uses `.command('x')` chained on a `program` variable
        const matches = [...content.matchAll(/\.command\(\s*['"]([a-z][a-z0-9-]*)['"]/g)];
        if (matches.length > 0) {
          return [...new Set(matches.map(m => m[1]))].sort();
        }
      }
    }
  } catch { /* ignore */ }
  return [];
}

function parsePositionalCommands(helpText) {
  // Hermes `--help` lists subcommands in the positional-args block like:
  //   {chat,model,moa,...}   and individual "  name   description" lines below.
  // We extract names from "  <name>" lines that align to subcommand descriptions.
  const names = new Set();
  for (const line of helpText.split('\n')) {
    // match indented "  name   description" where name is a single short word
    const m = line.match(/^\s{4}([a-z][a-z0-9-]*)\s{2,}\S/);
    if (m) names.add(m[1]);
  }
  return [...names].sort();
}

// ---------------------------------------------------------------------------
// TNF CLI top-level commands — parsed from packages/tnf-cli/src/cli.ts
// ---------------------------------------------------------------------------
function camelToKebab(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

function getTnfCliCommands() {
  const commands = new Set();
  if (!existsSync(CONFIG.tnfCliSrc)) return [];
  const src = readFileSync(CONFIG.tnfCliSrc, 'utf-8');

  // Top-level `program.command('name')`, including the common multiline form:
  //   program
  //     .command('gateway')
  // Do NOT match bare `.command('name')` on nested parents.
  for (const m of src.matchAll(
    /program(?:\s*\n\s*|\s*)\.command\(\s*['"]([a-z][a-z0-9-]*)['"]/g
  )) {
    commands.add(m[1]);
  }

  // Also: `const x = program.command('name')` / `const x = program\n  .command(...)`
  for (const m of src.matchAll(
    /=\s*program(?:\s*\n\s*|\s*)\.command\(\s*['"]([a-z][a-z0-9-]*)['"]/g
  )) {
    commands.add(m[1]);
  }

  // `registerXxxCommand(program, …)` modules — CamelCase → kebab.
  for (const m of src.matchAll(/register([A-Z]\w*)Command\s*\(/g)) {
    const kebab = camelToKebab(m[1]);
    if (kebab) commands.add(kebab);
  }

  // Known Hermes aliases that TNF implements under a near-name / Commander alias.
  const ALIASES = {
    skills: 'skill', // tnf skill (.alias('skills'))
    sessions: 'session',
    insights: 'growth-audit',
    'computer-use': 'browser-control',
    setup: 'onboard',
    console: 'tui',
    dashboard: 'local-ui',
    backup: 'export',
  };
  for (const [alias, existing] of Object.entries(ALIASES)) {
    if (commands.has(existing)) commands.add(alias);
  }

  // Commands registered inside registerHermesParityGapCommands (not via program.command in cli.ts).
  if (src.includes('registerHermesParityGapCommands')) {
    const gapFile = join(repoRoot, 'packages', 'tnf-cli', 'src', 'commands', 'hermes-parity-gaps.ts');
    if (existsSync(gapFile)) {
      const gapSrc = readFileSync(gapFile, 'utf8');
      const m = gapSrc.match(/HERMES_PARITY_GAP_COMMANDS\s*=\s*\[([\s\S]*?)\]\s*as\s*const/);
      if (m) {
        for (const name of m[1].matchAll(/['"]([a-z][a-z0-9-]*)['"]/g)) {
          commands.add(name[1]);
        }
      }
    }
  }

  return [...commands].sort();
}

// ---------------------------------------------------------------------------
// Agent specs — informational, NOT counted as missing commands
// ---------------------------------------------------------------------------
function getAgentSpecs() {
  if (!existsSync(CONFIG.agentSpecsDir)) return [];
  try {
    const files = execSync(`find ${CONFIG.agentSpecsDir} -maxdepth 1 -name '*.md' -type f`, { stdio: 'pipe' }).toString();
    return files.split('\n').filter(Boolean).map(f => f.split('/').pop().replace(/\.md$/, ''));
  } catch { return []; }
}

// ---------------------------------------------------------------------------
// Compare
// ---------------------------------------------------------------------------
async function compareCapabilities() {
  const hermesCmds = getHermesCommands();
  const tnfCmds = getTnfCliCommands();

  const hermesSet = new Set(hermesCmds);
  const tnfSet = new Set(tnfCmds);

  const missing = [...hermesSet].filter(c => !tnfSet.has(c)).sort();
  const extra = [...tnfSet].filter(c => !hermesSet.has(c)).sort();
  const covered = hermesCmds.filter(c => tnfSet.has(c)).length;

  return {
    hermesCommands: hermesCmds,
    tnfCliCommands: tnfCmds,
    missingCommands: missing,
    extraTnfCommands: extra,
    summary: {
      totalHermes: hermesCmds.length,
      totalTnf: tnfCmds.length,
      coveredCount: covered,
      missingCount: missing.length,
      extraCount: extra.length,
      // Overlap / Hermes — NOT TNF-size / Hermes-size (that overstated coverage).
      coverage:
        hermesCmds.length > 0 ? ((covered / hermesCmds.length) * 100).toFixed(1) : '0',
    }
  };
}

// ---------------------------------------------------------------------------
// Action plan — group missing commands by capability bucket
// ---------------------------------------------------------------------------
const CAPABILITY_BUCKETS = {
  memory:    ['memory', 'context', 'remember', 'recall', 'knowledge'],
  agents:    ['agent', 'agents', 'moa', 'acp'],
  tasks:     ['task', 'tasks', 'job', 'jobs', 'queue'],
  cron:      ['cron', 'schedule', 'scheduled'],
  tools:     ['tool', 'tools', 'mcp', 'plugins'],
  health:    ['health', 'status', 'doctor', 'security', 'monitor', 'monitoring', 'debug', 'diagnostic'],
  config:    ['config', 'setup', 'model', 'secrets', 'auth', 'login', 'logout', 'egress'],
  sessions:  ['session', 'sessions', 'chat', 'checkpoint', 'import'],
  hooks:     ['hook', 'hooks', 'webhook', 'approval', 'approvals'],
  ui:        ['dashboard', 'monitor', 'serve', 'desktop', 'gui', 'console', 'profile', 'skin'],
  channels:  ['gateway', 'send', 'whatsapp', 'slack', 'portal', 'proxy', 'kanban'],
  extension: ['lsp', 'skills', 'bundles', 'curator', 'plugins', 'claw', 'pets', 'journey', 'learning', 'pairing'],
  migration: ['migrate', 'import-agent', 'backup', 'uninstall', 'update', 'completion'],
  meta:      ['dump', 'logs', 'version', 'insights', 'prompt-size'],
};

function bucketize(missing) {
  const buckets = {};
  for (const cmd of missing) {
    let placed = false;
    for (const [bucket, keywords] of Object.entries(CAPABILITY_BUCKETS)) {
      if (keywords.some(k => cmd === k || cmd.startsWith(k + '-') || cmd.includes(k))) {
        (buckets[bucket] ||= []).push(cmd);
        placed = true;
        break;
      }
    }
    if (!placed) (buckets.other ||= []).push(cmd);
  }
  return buckets;
}

function generateActionPlan(diff) {
  const buckets = bucketize(diff.missingCommands);
  const priority = Object.entries(buckets)
    .map(([name, missing]) => ({ type: 'capability', name, missing, reason: 'feature gap' }))
    .sort((a, b) => b.missing.length - a.missing.length);
  return { priority, estimatedEffort: {}, implementation: [] };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const autoFix = args.includes('--auto-fix');

  console.log('[TNF CLI Agent Sync] Starting synchronization check...');

  const diff = await compareCapabilities();
  const plan = generateActionPlan(diff);
  const agentSpecs = getAgentSpecs();

  const report = {
    timestamp: new Date().toISOString(),
    hermesCommands: diff.hermesCommands,
    tnfCliCommands: diff.tnfCliCommands,
    missingCommands: diff.missingCommands,
    extraTnfCommands: diff.extraTnfCommands,
    actionPlan: plan,
    agentRegistry: { count: agentSpecs.length, note: 'Informational; not counted as missing CLI commands.' },
    summary: diff.summary,
  };

  mkdirSync(dirname(CONFIG.outputPath), { recursive: true });
  writeFileSync(CONFIG.outputPath, JSON.stringify(report, null, 2));
  console.log(`[TNF CLI Agent Sync] Report saved to ${CONFIG.outputPath}`);

  console.log('\n=== TNF CLI ↔ Hermes Agent Sync Report ===');
  console.log(`Hermes top-level commands : ${report.summary.totalHermes}`);
  console.log(`TNF CLI top-level commands: ${report.summary.totalTnf}`);
  console.log(`Covered (overlap)         : ${report.summary.coveredCount ?? '?'}`);
  console.log(`Coverage (overlap/Hermes) : ${report.summary.coverage}%`);
  console.log(`Missing in TNF CLI       : ${report.summary.missingCount}`);
  console.log(`Extra in TNF CLI         : ${report.summary.extraCount}`);
  console.log(`Agent specs (registry)   : ${report.agentRegistry.count} (informational)`);

  if (diff.missingCommands.length > 0) {
    console.log('\n=== Missing in TNF CLI ===');
    for (const cmd of diff.missingCommands) console.log(`  - ${cmd}`);
  }
  if (diff.extraTnfCommands.length > 0) {
    console.log('\n=== Extra in TNF CLI (no Hermes equivalent) ===');
    for (const cmd of diff.extraTnfCommands) console.log(`  + ${cmd}`);
  }

  console.log('\n=== Action Plan (by capability bucket) ===');
  for (const item of plan.priority) {
    console.log(`  [${item.name}] (${item.missing.length}) → ${item.missing.join(', ')}`);
  }

  if (autoFix) {
    console.log('\n[NOTE] Auto-fix is a no-op stub. Real auto-fix requires per-bucket implementation PRs.');
  }

  return report;
}

main().catch(err => { console.error('[TNF CLI Agent Sync] ERROR:', err); process.exit(1); });
