#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

function parseArgs(argv) {
  const args = { out: '.agent/skill-bank', snapshots: true };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--out' && argv[i + 1]) {
      args.out = argv[i + 1];
      i += 1;
    } else if (a === '--no-snapshots') {
      args.snapshots = false;
    }
  }
  return args;
}

function safeRead(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function sanitize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const block = m[1];
  const out = {};
  for (const line of block.split('\n')) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)\s*$/);
    if (!kv) continue;
    out[kv[1]] = kv[2].replace(/^['"]|['"]$/g, '');
  }
  return out;
}

function detectOriginLabel(skillDir, repoRoot, home) {
  const p = skillDir.replace(/\\/g, '/');
  const rr = repoRoot.replace(/\\/g, '/');
  const hm = home.replace(/\\/g, '/');
  if (p.startsWith(`${hm}/.codex/`)) return { llm: 'codex', scope: 'global' };
  if (p.startsWith(`${hm}/.claude/`)) return { llm: 'claude', scope: 'global' };
  if (p.startsWith(`${hm}/.gemini/`)) return { llm: 'gemini', scope: 'global' };
  if (p.startsWith(`${hm}/.opencode/`)) return { llm: 'opencode', scope: 'global' };
  if (p.startsWith(`${hm}/.cursor/`)) return { llm: 'cursor', scope: 'global' };
  if (p.startsWith(`${hm}/.kilo/`)) return { llm: 'kilo', scope: 'global' };
  if (p.startsWith(`${hm}/.augment/`)) return { llm: 'augment', scope: 'global' };
  if (p.startsWith(`${hm}/.tnf/`)) return { llm: 'tnf', scope: 'global' };
  if (p.startsWith(`${hm}/.hermes/`)) return { llm: 'hermes', scope: 'global' };
  if (p.startsWith(`${rr}/.agent/`)) return { llm: 'project-agent', scope: 'project' };
  if (p.startsWith(`${rr}/.claude/`)) return { llm: 'claude', scope: 'project' };
  if (p.startsWith(`${rr}/.gemini/`)) return { llm: 'gemini', scope: 'project' };
  if (p.startsWith(`${rr}/.opencode/`)) return { llm: 'opencode', scope: 'project' };
  if (p.startsWith(`${rr}/.kilo/`)) return { llm: 'kilo', scope: 'project' };
  if (p.startsWith(`${rr}/.augment/`)) return { llm: 'augment', scope: 'project' };
  if (p.startsWith(`${rr}/.tnf/`)) return { llm: 'tnf', scope: 'project' };
  if (p.startsWith(`${rr}/.hermes/`)) return { llm: 'hermes', scope: 'project' };
  if (p.startsWith(`${rr}/apps/openclaw/skills/`)) return { llm: 'openclaw', scope: 'project' };
  if (p.startsWith(`${rr}/apps/picoclaw-overseer/`)) return { llm: 'picoclaw', scope: 'project' };
  return { llm: 'unknown', scope: 'other' };
}

function walkForSkillFiles(root, acc) {
  if (!fs.existsSync(root)) return;
  let entries = [];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      walkForSkillFiles(full, acc);
    } else if (entry.isFile() && entry.name === 'SKILL.md') {
      acc.push({ file: full, format: 'folder' });
    }
  }
}

function collectFlatSkillFiles(root, acc) {
  if (!fs.existsSync(root)) return;
  let entries = [];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const lower = entry.name.toLowerCase();
    if (!lower.endsWith('.md') && !lower.endsWith('.skill')) continue;
    acc.push({ file: path.join(root, entry.name), format: 'flat' });
  }
}

function copyFolderSkillSnapshot(destRoot, sourceSkillDir) {
  ensureDir(destRoot);
  const items = ['SKILL.md', 'agents', 'references', 'scripts', 'assets'];
  for (const item of items) {
    const src = path.join(sourceSkillDir, item);
    if (!fs.existsSync(src)) continue;
    const dst = path.join(destRoot, item);
    if (fs.lstatSync(src).isDirectory()) {
      ensureDir(dst);
      fs.cpSync(src, dst, { recursive: true });
    } else {
      ensureDir(path.dirname(dst));
      fs.copyFileSync(src, dst);
    }
  }
}

function copyFlatSkillSnapshot(destRoot, sourceFile) {
  ensureDir(destRoot);
  const dst = path.join(destRoot, path.basename(sourceFile));
  fs.copyFileSync(sourceFile, dst);
}

function main() {
  const args = parseArgs(process.argv);
  const repoRoot = process.cwd();
  const home = os.homedir();
  const outRoot = path.resolve(repoRoot, args.out);
  const snapshotsRoot = path.join(outRoot, 'snapshots');

  const folderSkillRoots = [
    path.join(home, '.codex', 'skills'),
    path.join(home, '.claude', 'skills'),
    path.join(home, '.gemini', 'skills'),
    path.join(home, '.opencode', 'skills'),
    path.join(home, '.cursor', 'skills-cursor'),
    path.join(home, '.kilo', 'skills'),
    path.join(home, '.augment', 'skills'),
    path.join(home, '.tnf', 'skills'),
    path.join(home, '.hermes', 'skills'),
    path.join(home, '.hermes', 'hermes-agent', 'skills'),
    path.join(repoRoot, '.agent', 'skills'),
    path.join(repoRoot, 'apps', 'openclaw', 'skills'),
    path.join(repoRoot, 'apps', 'picoclaw-overseer', 'workspace', 'skills'),
  ];
  const flatSkillRoots = [
    path.join(home, '.claude', 'skills'),
    path.join(home, '.gemini', 'skills'),
    path.join(home, '.opencode', 'skills'),
    path.join(home, '.cursor', 'skills-cursor'),
    path.join(home, '.kilo', 'skills'),
    path.join(home, '.augment', 'skills'),
    path.join(home, '.tnf', 'skills'),
    path.join(home, '.hermes', 'skills'),
    path.join(home, '.hermes', 'hermes-agent', 'skills'),
    path.join(repoRoot, '.claude', 'skills'),
    path.join(repoRoot, '.gemini', 'skills'),
    path.join(repoRoot, '.opencode', 'skills'),
    path.join(repoRoot, '.kilo', 'skills'),
    path.join(repoRoot, '.augment', 'skills'),
    path.join(repoRoot, '.tnf', 'skills'),
    path.join(repoRoot, '.hermes', 'skills'),
  ];

  const skillFiles = [];
  for (const root of folderSkillRoots) walkForSkillFiles(root, skillFiles);
  for (const root of flatSkillRoots) collectFlatSkillFiles(root, skillFiles);
  const sourceRoots = [...folderSkillRoots, ...flatSkillRoots];

  const records = [];
  for (const entry of skillFiles) {
    const skillFile = entry.file;
    const content = safeRead(skillFile);
    if (!content) continue;
    const skillDir = entry.format === 'folder' ? path.dirname(skillFile) : skillFile;
    const meta = parseFrontmatter(content);
    const name = meta.name || path.basename(skillDir, path.extname(skillDir));
    const description = meta.description || '';
    const hash = sha256(content);
    const origin = detectOriginLabel(skillDir, repoRoot, home);
    const id = sanitize(name || path.basename(skillDir));
    const relToRepo = path.relative(repoRoot, skillDir);

    const record = {
      id,
      name,
      description,
      path: skillDir,
      pathFromRepo: relToRepo.startsWith('..') ? null : relToRepo,
      llm: origin.llm,
      scope: origin.scope,
      hash,
      hasAgents: fs.existsSync(path.join(skillDir, 'agents')),
      hasReferences: fs.existsSync(path.join(skillDir, 'references')),
      hasScripts: fs.existsSync(path.join(skillDir, 'scripts')),
      hasAssets: fs.existsSync(path.join(skillDir, 'assets')),
      format: entry.format,
      updatedAt: fs.statSync(skillFile).mtime.toISOString(),
    };
    records.push(record);

    if (args.snapshots) {
      const snapDir = path.join(snapshotsRoot, origin.llm, `${id}-${hash.slice(0, 8)}`);
      if (entry.format === 'folder') copyFolderSkillSnapshot(snapDir, skillDir);
      else copyFlatSkillSnapshot(snapDir, skillFile);
      record.snapshotPath = path.relative(repoRoot, snapDir);
    }
  }

  const byId = new Map();
  for (const r of records) {
    const bucket = byId.get(r.id) || {
      id: r.id,
      canonicalName: r.name,
      descriptions: [],
      variants: [],
      llms: {},
    };
    if (r.description && !bucket.descriptions.includes(r.description)) bucket.descriptions.push(r.description);
    bucket.variants.push(r);
    bucket.llms[r.llm] = (bucket.llms[r.llm] || 0) + 1;
    byId.set(r.id, bucket);
  }

  const skills = Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id));
  const totals = {
    scannedSources: sourceRoots.length,
    discoveredSkillFiles: records.length,
    uniqueSkills: skills.length,
    byLlm: records.reduce((acc, r) => {
      acc[r.llm] = (acc[r.llm] || 0) + 1;
      return acc;
    }, {}),
  };

  ensureDir(outRoot);
  fs.writeFileSync(
    path.join(outRoot, 'skills-index.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        repoRoot,
        sourceRoots,
        totals,
        skills,
      },
      null,
      2
    )
  );

  const summary = [
    '# Skill Bank Summary',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Discovered skill files: ${totals.discoveredSkillFiles}`,
    `Unique skills: ${totals.uniqueSkills}`,
    '',
    '## By LLM',
    ...Object.entries(totals.byLlm).map(([k, v]) => `- ${k}: ${v}`),
    '',
    '## Top Duplicated Skills',
    ...skills
      .filter((s) => s.variants.length > 1)
      .sort((a, b) => b.variants.length - a.variants.length)
      .slice(0, 20)
      .map((s) => `- ${s.id}: ${s.variants.length} variants`),
    '',
  ].join('\n');
  fs.writeFileSync(path.join(outRoot, 'skills-summary.md'), `${summary}\n`);

  const resourceRows = records.map((r) => ({
    name: r.name,
    description: r.description,
    category: 'CLAUDE_SKILL',
    type: 'MARKDOWN',
    visibility: 'AGENTS_ONLY',
    tags: [r.llm, r.scope, 'skill-bank'],
    source: r.path,
    metadata: {
      hash: r.hash,
      id: r.id,
      snapshotPath: r.snapshotPath || null,
    },
  }));
  fs.writeFileSync(
    path.join(outRoot, 'resource-registry-import.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        rows: resourceRows,
      },
      null,
      2
    )
  );

  console.log(`Skill bank synced to ${outRoot}`);
  console.log(`Discovered ${totals.discoveredSkillFiles} skill files across ${totals.uniqueSkills} unique skills.`);
}

main();
