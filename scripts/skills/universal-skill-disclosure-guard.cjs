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
    doctor: false,
    json: false,
    cleanup: false,
    aggressive: false,
    activeLimit: DEFAULT_ACTIVE_LIMIT,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--apply') out.apply = true;
    else if (arg === '--check') out.check = true;
    else if (arg === '--doctor') out.doctor = true;
    else if (arg === '--json') out.json = true;
    else if (arg === '--cleanup') out.cleanup = true;
    else if (arg === '--aggressive') out.aggressive = true;
    else if (arg === '--active-limit' && argv[i + 1]) {
      out.activeLimit = Number(argv[++i]);
    } else if (arg === '-h' || arg === '--help') {
      console.log(`Usage: node scripts/skills/universal-skill-disclosure-guard.cjs [options]

Audits and enforces progressive disclosure context limits across all agent runtimes.
Vaults overflow skills to skills_inactive to protect the LLM context window.

Options:
  --check                 Audit active skill count across all runtimes
  --doctor                Run Anthropic /doctor token-bloat + Google multiplicative skill competence audit
  --apply                 Move imported skill packs to runtime-specific inactive vaults
  --aggressive            With --apply, also move every non-core top-level skill directory
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
  const activeLimit = name === 'Claude' ? Math.max(options.activeLimit, 64) : options.activeLimit;
  const activeFiles = walkSkillFiles(activeRoot);
  const inactiveFiles = walkSkillFiles(inactiveRoot);

  const overflowCandidates = [];
  for (const skillFile of activeFiles) {
    const rel = path.relative(activeRoot, skillFile);
    const topDir = rel.split(path.sep)[0];
    const importedPack = topDir === 'imported-claude-agents';
    if (importedPack || (options.aggressive && !CORE_ACTIVE.has(topDir) && topDir !== 'SKILL.md')) {
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
        } else {
          const conflictRoot = path.join(
            inactiveRoot,
            `${item.topDir}-conflicts`,
            new Date().toISOString().replace(/[:.]/g, '-')
          );
          let merged = 0;
          let preserved = 0;
          for (const child of fs.readdirSync(srcDir)) {
            if (child === '.DS_Store') continue;
            const sourceChild = path.join(srcDir, child);
            const targetChild = path.join(dstDir, child);
            if (!fs.existsSync(targetChild)) {
              fs.renameSync(sourceChild, targetChild);
              merged += 1;
            } else {
              fs.mkdirSync(conflictRoot, { recursive: true });
              fs.renameSync(sourceChild, path.join(conflictRoot, child));
              preserved += 1;
            }
          }
          fs.rmSync(srcDir, { recursive: true, force: true });
          actionsTaken.push(`Merged ${item.topDir} -> ${inactiveRoot} (${merged} moved, ${preserved} conflicts preserved)`);
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
    importedPackActive: overflowCandidates.some((item) => item.topDir === 'imported-claude-agents'),
    activeLimit,
    withinBudget: activeFiles.length <= activeLimit && !overflowCandidates.some((item) => item.topDir === 'imported-claude-agents'),
    actionsTaken,
  };
}

/**
 * Anthropic `/doctor` + `/context` Skill Token Audit (eW9sX2J5-y0) combined with
 * Google Agent Skills Multiplicative Competence Formula (kFpLzCVLA20):
 *   Competence(s) = Q_stored * Q_retrieval * R_execution * Q_verification
 */
function runSkillDoctor(repoRoot) {
  const canonicalSkillsRoot = path.join(repoRoot, '.agent', 'skills');
  const trajectoriesDir = path.join(repoRoot, 'data', 'harness', 'trajectories');
  const skillFiles = walkSkillFiles(canonicalSkillsRoot);

  // Load trajectory corpus once to count empirical skill invocations
  let trajectoryCorpus = '';
  if (fs.existsSync(trajectoriesDir)) {
    try {
      const tFiles = fs.readdirSync(trajectoriesDir).filter((f) => f.endsWith('.json') || f.endsWith('.jsonl'));
      trajectoryCorpus = tFiles
        .slice(0, 200)
        .map((f) => {
          try {
            return fs.readFileSync(path.join(trajectoriesDir, f), 'utf8');
          } catch {
            return '';
          }
        })
        .join('\n');
    } catch {
      trajectoryCorpus = '';
    }
  }

  const skills = [];
  let totalFrontmatterTokens = 0;
  let totalBodyTokens = 0;

  for (const file of skillFiles) {
    let raw = '';
    try {
      raw = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const rel = path.relative(canonicalSkillsRoot, file);
    const folderName = rel.split(path.sep)[0];
    const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const fmRaw = fmMatch ? fmMatch[1] : '';
    const bodyRaw = fmMatch ? raw.slice(fmMatch[0].length) : raw;

    const nameMatch = fmRaw.match(/^name:\s*(.+)$/m);
    const descMatch = fmRaw.match(/^description:\s*(.+)$/m);
    const skillName = (nameMatch ? nameMatch[1].trim() : folderName).replace(/^['"]|['"]$/g, '');
    const description = (descMatch ? descMatch[1].trim() : '').replace(/^['"]|['"]$/g, '');

    const frontmatterTokens = Math.ceil((fmRaw.length || 1) / 4);
    const bodyTokens = Math.ceil((bodyRaw.length || 1) / 4);
    totalFrontmatterTokens += frontmatterTokens;
    totalBodyTokens += bodyTokens;

    // Multiplicative factors in [0, 1]
    const qStored = fmMatch && bodyRaw.trim().length > 80 ? 1.0 : fmMatch ? 0.6 : 0.25;
    const qRetrieval =
      description.length >= 25 && frontmatterTokens <= 120
        ? 1.0
        : description.length > 0
          ? 0.65
          : 0.2;
    const hasExecutableSurface = /```(bash|sh|zsh|json|ts|js|python)|node\s+scripts\/|pnpm\s+run|tnf\s+/i.test(bodyRaw);
    const rExecution = hasExecutableSurface ? 1.0 : 0.7;
    const hasVerificationSurface = /verify|gate|test|assert|check|--json/i.test(bodyRaw);
    const qVerification = hasVerificationSurface ? 1.0 : 0.7;

    const competence = Number((qStored * qRetrieval * rExecution * qVerification).toFixed(3));
    const trajectoryMentions =
      trajectoryCorpus && skillName
        ? trajectoryCorpus.split(folderName).length - 1
        : 0;

    skills.push({
      skill: folderName,
      name: skillName,
      frontmatterTokens,
      bodyTokens,
      bloatedFrontmatter: frontmatterTokens > 120,
      missingDescription: description.length === 0,
      competence,
      factors: { qStored, qRetrieval, rExecution, qVerification },
      trajectoryMentions,
    });
  }

  skills.sort((a, b) => b.frontmatterTokens - a.frontmatterTokens);
  const bloated = skills.filter((s) => s.bloatedFrontmatter);
  const missingDescriptions = skills.filter((s) => s.missingDescription);
  const lowCompetence = skills.filter((s) => s.competence < 0.5);
  const avgCompetence =
    skills.length > 0
      ? Number((skills.reduce((acc, s) => acc + s.competence, 0) / skills.length).toFixed(3))
      : 0;

  return {
    totalCanonicalSkills: skills.length,
    totalFrontmatterTokens,
    totalBodyTokens,
    avgCompetence,
    bloatedFrontmatterCount: bloated.length,
    missingDescriptionCount: missingDescriptions.length,
    lowCompetenceCount: lowCompetence.length,
    topTokenHeaviest: skills.slice(0, 10),
    lowCompetenceSkills: lowCompetence.slice(0, 10),
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const home = os.homedir();
  const repoRoot = path.resolve(__dirname, '..', '..');

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
  const doctor = options.doctor ? runSkillDoctor(repoRoot) : undefined;

  if (options.json) {
    console.log(
      JSON.stringify(
        { timestamp: new Date().toISOString(), results, ...(doctor ? { doctor } : {}) },
        null,
        2
      )
    );
    return;
  }

  console.log('\n🛡️  === Universal Skill Progressive Disclosure Audit ===');
  let allPass = true;
  for (const res of results) {
    const statusIcon = res.withinBudget ? '✅' : '⚠️';
    console.log(`\n${statusIcon} Runtime: ${res.runtime}`);
    console.log(`   Active Skills:   ${res.activeCount} (Limit: ${res.activeLimit})`);
    console.log(`   Inactive Vault:  ${res.inactiveCount}`);
    if (res.actionsTaken.length > 0) {
      console.log(`   Vaulted:         ${res.actionsTaken.length} overflow modules`);
    }
    if (!res.withinBudget) allPass = false;
  }

  if (doctor) {
    console.log('\n🩺 === Skill /doctor Token & Multiplicative Competence Audit ===');
    console.log(`   Canonical Skills (.agent/skills): ${doctor.totalCanonicalSkills}`);
    console.log(`   Tier-0 Frontmatter Token Load:    ~${doctor.totalFrontmatterTokens} tokens`);
    console.log(`   Full Body Token Load (if eager):  ~${doctor.totalBodyTokens} tokens`);
    console.log(`   Mean Multiplicative Competence:   ${doctor.avgCompetence}`);
    console.log(`   Bloated Frontmatter (>120 tok):   ${doctor.bloatedFrontmatterCount}`);
    console.log(`   Missing YAML Description:         ${doctor.missingDescriptionCount}`);
    console.log(`   Low Competence (<0.50):           ${doctor.lowCompetenceCount}`);
  }

  console.log('\n----------------------------------------------------');
  if (allPass) {
    console.log('✅ Context Budget Status: HEALTHY (Tier-0 Progressive Disclosure Active)\n');
  } else {
    console.log('⚠️ Context Budget Status: OVER BUDGET. Run with --apply to vault overflow skills.\n');
    if (options.check) process.exit(1);
  }
}

module.exports = {
  auditRuntime,
  runSkillDoctor,
  walkSkillFiles,
};

if (require.main === module) {
  main();
}
