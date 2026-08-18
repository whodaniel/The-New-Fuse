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
    activeRoot: path.join(os.homedir(), '.codex', 'skills'),
    inactiveRoot: path.join(os.homedir(), '.codex', 'skills_inactive'),
    activeLimit: DEFAULT_ACTIVE_LIMIT,
    apply: false,
    check: false,
    json: false,
    writeReport: true,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--apply') out.apply = true;
    else if (arg === '--check') out.check = true;
    else if (arg === '--json') out.json = true;
    else if (arg === '--no-report') out.writeReport = false;
    else if (arg === '--active-root' && argv[i + 1]) {
      out.activeRoot = path.resolve(argv[++i]);
    } else if (arg === '--inactive-root' && argv[i + 1]) {
      out.inactiveRoot = path.resolve(argv[++i]);
    } else if (arg === '--active-limit' && argv[i + 1]) {
      out.activeLimit = Number(argv[++i]);
      if (!Number.isFinite(out.activeLimit) || out.activeLimit < 1) {
        throw new Error('--active-limit must be a positive number');
      }
    } else if (arg === '-h' || arg === '--help') {
      console.log(`Usage: node scripts/skills/codex-skill-disclosure-guard.cjs [options]

Audits Codex's active global skill surface and, with --apply, contains imported
specialized skills by moving them to ~/.codex/skills_inactive.

Options:
  --apply                 Move known overflow candidates to the inactive vault
  --check                 Exit non-zero when the active surface is over budget
  --json                  Print JSON only
  --active-limit <n>      Target active SKILL.md count (default: ${DEFAULT_ACTIVE_LIMIT})
  --active-root <path>    Codex active skills root (default: ~/.codex/skills)
  --inactive-root <path>  Codex inactive vault (default: ~/.codex/skills_inactive)
  --no-report             Do not write .agent/skill-bank/codex-skill-disclosure-report.json`);
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${arg}`);
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
  return out.sort();
}

function readName(skillFile) {
  let raw = '';
  try {
    raw = fs.readFileSync(skillFile, 'utf8');
  } catch {
    return path.basename(path.dirname(skillFile));
  }
  const match = raw.match(/^name:\s*["']?([^"'\n]+)/m);
  return (match ? match[1] : path.basename(path.dirname(skillFile))).trim();
}

function firstSegment(relativePath) {
  return relativePath.split(path.sep)[0];
}

function classifySkill(activeRoot, skillFile) {
  const relativePath = path.relative(activeRoot, skillFile);
  const top = firstSegment(relativePath);
  const name = readName(skillFile);
  const activeKey = top === '.system' ? top : path.basename(path.dirname(skillFile));
  const imported = top === 'imported-claude-agents';
  const core = CORE_ACTIVE.has(top) || CORE_ACTIVE.has(activeKey) || CORE_ACTIVE.has(name);
  return { skillFile, relativePath, top, activeKey, name, imported, core };
}

function listFlatSkillFiles(activeRoot) {
  if (!fs.existsSync(activeRoot)) return [];
  return fs
    .readdirSync(activeRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.skill'))
    .map((entry) => path.join(activeRoot, entry.name))
    .sort();
}

function containmentMoves(activeRoot, inactiveRoot) {
  const importedRoot = path.join(activeRoot, 'imported-claude-agents');
  if (!fs.existsSync(importedRoot)) return [];
  if (walkSkillFiles(importedRoot).length === 0) return [];
  return [
    {
      type: 'merge-directory',
      reason: 'imported specialized Claude-agent skills are available through the TNF skill bank and should not be active in every Codex session',
      source: importedRoot,
      target: path.join(inactiveRoot, 'imported-claude-agents'),
      conflictRoot: path.join(
        inactiveRoot,
        'imported-claude-agents-conflicts',
        new Date().toISOString().replace(/[:.]/g, '-')
      ),
    },
  ];
}

function applyMoves(moves) {
  const applied = [];
  const skipped = [];
  for (const move of moves) {
    if (!fs.existsSync(move.source)) {
      skipped.push({ ...move, status: 'source-missing' });
      continue;
    }
    if (!fs.existsSync(move.target)) {
      fs.mkdirSync(path.dirname(move.target), { recursive: true });
      fs.renameSync(move.source, move.target);
      applied.push({ ...move, status: 'moved', movedChildren: null, conflictChildren: 0 });
      continue;
    }

    const children = fs.readdirSync(move.source, { withFileTypes: true });
    let movedChildren = 0;
    let conflictChildren = 0;
    for (const child of children) {
      if (child.name === '.DS_Store') continue;
      const sourceChild = path.join(move.source, child.name);
      const targetChild = path.join(move.target, child.name);
      if (!fs.existsSync(targetChild)) {
        fs.renameSync(sourceChild, targetChild);
        movedChildren += 1;
      } else {
        fs.mkdirSync(move.conflictRoot, { recursive: true });
        fs.renameSync(sourceChild, path.join(move.conflictRoot, child.name));
        conflictChildren += 1;
      }
    }

    try {
      fs.rmdirSync(move.source);
    } catch (error) {
      skipped.push({ ...move, status: `source-not-empty: ${error.message}` });
    }
    applied.push({ ...move, status: 'merged', movedChildren, conflictChildren });
  }
  return { applied, skipped };
}

function writeReport(report) {
  const outFile = path.join(process.cwd(), '.agent', 'skill-bank', 'codex-skill-disclosure-report.json');
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return outFile;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const activeRoot = path.resolve(options.activeRoot);
  const inactiveRoot = path.resolve(options.inactiveRoot);
  const skills = walkSkillFiles(activeRoot).map((file) => classifySkill(activeRoot, file));
  const flatSkills = listFlatSkillFiles(activeRoot);
  const imported = skills.filter((skill) => skill.imported);
  const core = skills.filter((skill) => skill.core);
  const otherActive = skills.filter((skill) => !skill.imported && !skill.core);
  const moves = containmentMoves(activeRoot, inactiveRoot);
  const moveResult = options.apply ? applyMoves(moves) : { applied: [], skipped: [] };
  const activeSkillsAfter = options.apply
    ? walkSkillFiles(activeRoot).map((file) => classifySkill(activeRoot, file))
    : skills;
  const activeCountAfterEstimate = moves.length > 0 ? skills.length - imported.length : skills.length;
  const ready =
    activeSkillsAfter.length <= options.activeLimit &&
    activeSkillsAfter.filter((skill) => skill.imported).length === 0;

  const report = {
    generatedAt: new Date().toISOString(),
    activeRoot,
    inactiveRoot,
    activeLimit: options.activeLimit,
    mode: options.apply ? 'apply' : 'audit',
    ready,
    counts: {
      activeSkillFilesBefore: skills.length,
      activeSkillFilesAfterEstimate: options.apply ? activeSkillsAfter.length : activeCountAfterEstimate,
      coreActive: core.length,
      importedClaudeAgentsActive: imported.length,
      importedClaudeAgentsActiveAfter: activeSkillsAfter.filter((skill) => skill.imported).length,
      otherActive: otherActive.length,
      flatSkillFilesAtRoot: flatSkills.length,
    },
    containmentCandidates: moves,
    applied: moveResult.applied,
    skipped: moveResult.skipped,
    otherActive: otherActive.map((skill) => ({
      name: skill.name,
      relativePath: skill.relativePath,
    })),
    traversal: {
      manifest: '.agent/SKILL_MANIFEST.md',
      query: 'node scripts/skills/skill-bank-query.cjs <term>',
      load: 'Read exactly one candidate SKILL.md body when invoking it.',
    },
  };

  let reportFile = null;
  if (options.writeReport) reportFile = writeReport(report);

  if (options.json) {
    console.log(JSON.stringify({ ...report, reportFile }, null, 2));
  } else {
    console.log('Codex skill disclosure guard');
    console.log(`active root : ${activeRoot}`);
    console.log(`inactive    : ${inactiveRoot}`);
    console.log(`mode        : ${report.mode}`);
    console.log(`active      : ${skills.length} SKILL.md before, ${report.counts.activeSkillFilesAfterEstimate} after estimate`);
    console.log(`imported    : ${imported.length} active under imported-claude-agents`);
    console.log(`other active: ${otherActive.length}`);
    console.log(`status      : ${ready ? 'READY' : 'OVER BUDGET / CONTAINMENT NEEDED'}`);
    if (moves.length && !options.apply && !ready) {
      console.log('\nRecommended containment:');
      console.log('  node scripts/skills/codex-skill-disclosure-guard.cjs --apply');
    }
    if (moveResult.applied.length) {
      console.log(`\nApplied ${moveResult.applied.length} containment move(s).`);
      for (const move of moveResult.applied) {
        if (move.status === 'merged') {
          console.log(
            `  ${move.status}: ${move.movedChildren} moved, ${move.conflictChildren} preserved in conflict vault`
          );
        }
      }
    }
    if (moveResult.skipped.length) {
      console.log(`\nSkipped ${moveResult.skipped.length} move(s); inspect report for conflicts.`);
    }
    if (reportFile) console.log(`\nreport: ${path.relative(process.cwd(), reportFile)}`);
  }

  if (options.check && !ready) process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(`codex-skill-disclosure-guard: ${error.message}`);
  process.exit(1);
}
