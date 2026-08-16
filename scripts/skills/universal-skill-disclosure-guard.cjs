#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const DEFAULT_ACTIVE_LIMIT = 40;
const CORE_ACTIVE = new Set([
  '.system',
  'claude-slash-commands',
  'clawhub-skill-scout',
  'codex-slash-commands',
  'context-frontloader',
  'gemini-slash-commands',
  'hermes-slash-commands',
  'jules-slash-commands',
  'kilo-slash-commands',
  'openclaw-slash-commands',
  'opencode-slash-commands',
  'skill-builder',
  'skill-management',
  'tnf-cli-agent-interoperability',
  'tnf-cli-parity-upgrade',
  'tnf-cli-sdk-interoperability',
  'tnf-frontload-protocols',
  'tnf-full-auto-network-autopilot',
  'tnf-skill-bridging',
  'tnf-skill-types',
  'tnf-universal-slash-commands',
]);

function parseArgs(argv) {
  const out = {
    apply: false,
    check: false,
    json: false,
    cleanup: false,
    activeLimit: DEFAULT_ACTIVE_LIMIT,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--apply') out.apply = true;
    else if (arg === '--check') out.check = true;
    else if (arg === '--json') out.json = true;
    else if (arg === '--cleanup') out.cleanup = true;
    else if (arg === '--active-limit' && argv[i + 1]) {
      out.activeLimit = Number(argv[++i]);
    } else if (arg === '-h' || arg === '--help') {
      console.log(`Usage: node scripts/skills/universal-skill-disclosure-guard.cjs [options]

Audits and enforces progressive disclosure context limits across all agent runtimes.
Vaults overflow skills to skills_inactive to protect the LLM context window.

Options:
  --check                 Audit active skill count across all runtimes
  --apply                 Move overflow / non-core skills to runtime-specific inactive vaults
  --cleanup               Restore active directory back to clean baseline state
  --json                  Output report in JSON format
  --active-limit <n>      Target max active skill count (default: ${DEFAULT_ACTIVE_LIMIT})`);
      process.exit(0);
    }
  }

  return out;
}

function walkSkillFiles(root) {
  if (!fs.existsSync(root)) return [];
  const out = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.name === '.DS_Store') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && entry.name === 'SKILL.md') {
        out.push(full);
      }
    }
  }
  return out;
}

function auditRuntime(name, activeRoot, inactiveRoot, options) {
  const activeFiles = walkSkillFiles(activeRoot);
  const inactiveFiles = walkSkillFiles(inactiveRoot);

  const overflowCandidates = [];
  for (const skillFile of activeFiles) {
    const rel = path.relative(activeRoot, skillFile);
    const topDir = rel.split(path.sep)[0];
    if (!CORE_ACTIVE.has(topDir) && topDir !== 'SKILL.md') {
      overflowCandidates.push({ topDir, skillFile, rel });
    }
  }

  let actionsTaken = [];
  if (options.apply && overflowCandidates.length > 0) {
    fs.mkdirSync(inactiveRoot, { recursive: true });
    const movedDirs = new Set();

    for (const item of overflowCandidates) {
      if (movedDirs.has(item.topDir)) continue;
      const srcDir = path.join(activeRoot, item.topDir);
      const dstDir = path.join(inactiveRoot, item.topDir);

      if (fs.existsSync(srcDir)) {
        if (!fs.existsSync(dstDir)) {
          fs.renameSync(srcDir, dstDir);
          actionsTaken.push(`Moved ${item.topDir} -> ${inactiveRoot}`);
        }
        movedDirs.add(item.topDir);
      }
    }
  }

  return {
    runtime: name,
    activeRoot,
    inactiveRoot,
    activeCount: activeFiles.length,
    inactiveCount: inactiveFiles.length,
    overflowCount: overflowCandidates.length,
    withinBudget: activeFiles.length <= options.activeLimit,
    actionsTaken,
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const home = os.homedir();

  const runtimes = [
    {
      name: 'Codex',
      activeRoot: path.join(home, '.codex', 'skills'),
      inactiveRoot: path.join(home, '.codex', 'skills_inactive'),
    },
    {
      name: 'Claude',
      activeRoot: path.join(home, '.claude', 'skills'),
      inactiveRoot: path.join(home, '.claude', 'skills_inactive'),
    },
    {
      name: 'Agent Framework',
      activeRoot: path.join(home, '.agents', 'skills'),
      inactiveRoot: path.join(home, '.agents', 'skills_inactive'),
    },
  ];

  const results = runtimes.map((r) => auditRuntime(r.name, r.activeRoot, r.inactiveRoot, options));

  if (options.json) {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
    return;
  }

  console.log('\n🛡️  === Universal Skill Progressive Disclosure Audit ===');
  let allPass = true;
  for (const res of results) {
    const statusIcon = res.withinBudget ? '✅' : '⚠️';
    console.log(`\n${statusIcon} Runtime: ${res.runtime}`);
    console.log(`   Active Skills:   ${res.activeCount} (Limit: ${options.activeLimit})`);
    console.log(`   Inactive Vault:  ${res.inactiveCount}`);
    if (res.actionsTaken.length > 0) {
      console.log(`   Vaulted:         ${res.actionsTaken.length} overflow modules`);
    }
    if (!res.withinBudget) allPass = false;
  }

  console.log('\n----------------------------------------------------');
  if (allPass) {
    console.log('✅ Context Budget Status: HEALTHY (Tier-0 Progressive Disclosure Active)\n');
  } else {
    console.log('⚠️ Context Budget Status: OVER BUDGET. Run with --apply to vault overflow skills.\n');
    if (options.check) process.exit(1);
  }
}

main();
