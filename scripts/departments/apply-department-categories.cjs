#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Additive department + missing-category tagging.
 *
 * Safety:
 *   - Never rewrite an existing `category` value (skill-chain / progressive
 *     disclosure domains stay authoritative).
 *   - Never rewrite name, description, skills, tools, depends_on, requires,
 *     or file bodies.
 *   - Mutate only TNF-owned agent definitions and TNF-owned skills.
 *     imported / anthropic / antigravity / .system packs are indexed only.
 *   - Department listings are names only. Do not dump SKILL.md bodies.
 *
 * Usage:
 *   node scripts/departments/apply-department-categories.cjs --dry-run
 *   node scripts/departments/apply-department-categories.cjs --apply
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const INDEX_OUT = path.join(ROOT, 'data/departments/staffing-index.json');

const AGENT_DIR = path.join(ROOT, '.agent/agents');
const SKILL_ROOTS = [path.join(ROOT, '.agent/skills'), path.join(ROOT, '.skills')];

const VENDOR_RE = /(?:^|\/)(?:imported-[^/]+|anthropic|antigravity|\.system)(?:\/|$)/;

/** Same ordered domains as scripts/skills/build-skill-manifest.cjs */
const DOMAINS = [
  ['tnf-platform', /^tnf|^hermes|openclaw|picoclaw|clawhub|\bufte\b|thenewfuse|new-?fuse|harness/i],
  ['skill-authoring', /skill-|_skill|meta-agent|context-frontloader|skill$/i],
  ['tnf-fleet', /fleet|swarm|director|orchestrat|delegat|handoff|dispatch|sub-?agent|agent-(registry|discovery|tagger|search|manager|relationship|tool|memory|evaluation)/i],
  ['protocol-governance', /protocol|governance|authority|directive|turn-?zero|compliance|policy|audit|ledger/i],
  ['security-offensive', /pentest|bug-?bounty|fuzz|exploit|recon|payload|xss|sqli|owasp|attack|redteam|ctf/i],
  ['security-privacy', /security|secret|privacy|auth|credential|rotate|vuln|sanitiz|encrypt|compliance/i],
  ['browser-automation', /browser|chrome|playwright|puppeteer|webpilot|scrape|crawl|selenium/i],
  ['llm-ai', /\bllm\b|model|openai|anthropic|claude|gemini|prompt|embedding|\brag\b|inference|fine-?tun|\bai-/i],
  ['games-graphics', /game|3d|2d|webgl|shader|unity|godot|canvas|physics|sprite/i],
  ['frontend-design', /frontend|design|\bui\b|\bux\b|css|react|vue|svelte|component|figma|tailwind|animation|landing/i],
  ['backend-api', /backend|api|graphql|rest|endpoint|gateway|microservice|webhook|grpc/i],
  ['data-storage', /database|\bsql\b|drizzle|prisma|schema|migration|storage|supabase|postgres|redis|vector|search/i],
  ['cloud-infra', /aws|azure|gcp|docker|kubernetes|terraform|serverless|lambda|cdn|nginx|infra/i],
  ['build-release', /build|release|package|deploy|publish|\bdmg\b|vsix|bundle|\bci\b|pipeline|version/i],
  ['repo-git', /\bgit\b|branch|merge|commit|worktree|monorepo|changelog|refactor/i],
  ['testing-qa', /\btest|\bqa\b|smoke|e2e|lint|typecheck|verify|probe|coverage|debug/i],
  ['knowledge-intake', /ingest|transcript|archaeolog|knowledge|memory|note|research|summar|index/i],
  ['media-content', /video|audio|image|podcast|youtube|thumbnail|\bpdf\b|voice|music|photo/i],
  ['business-growth', /market|\bseo\b|monetiz|revenue|brand|audience|campaign|sponsor|affiliate|funnel|\bsales\b|customer|lead|ecommerce|\bproducts?\b|strategy|influencer|social|instagram|tiktok|youtube|linkedin|advertis|ad-network|talent|niche|launch|paywall|pricing|growth/i],
  ['docs-writing', /\bdocs?\b|readme|writ|markdown|report|content|blog|copy|script|transcri|note/i],
  ['engineering-practice', /architect|review|plan|reasoning|workflow|process|improvement|guideline|convention|pattern|principle|estimat/i],
  ['tooling-integration', /notion|obsidian|slack|linear|jira|figma|shopify|stripe|airtable|spreadsheet|calendar|\bgh\b|github|cli\b|sdk|installer|manager|bridge|connector|integration/i],
  ['infra-runtime', /relay|server|daemon|launchd|cron|heartbeat|runtime|service|\bport\b|queue|stream|env|config|secret/i],
];

const DEPTS = ['hr', 'marketing', 'design', 'legal', 'tech', 'finance', 'product', 'ops'];

const NAME_DEPT = [
  ['finance', /finance|financial|tax-|cfo|bookkeep|funnel-economics|pricing-strategy/i],
  ['legal', /legal-compliance|\blegal\b|contract-manager|copyright|privacy-policy|\bftc\b|ip-boundary|ethical-bias/i],
  ['hr', /staffing|talent|burnout|people-ops|human-resource|\bhr\b/i],
  ['design', /visual-asset|storyboard|frontend-design|frontend-debug|canvas-design|theme-factory|brand-guidelines|\bux\b|\bui\b|figma/i],
  ['marketing', /marketing|seo|instagram|tiktok|facebook|x-strategy|yt-|youtube|podcast|influencer|brand-|sponsor|affiliate|ad-network|audience|campaign|traffic-generation|content-writer|content-calendar|content-refresh|content-repurposing|email-marketing|lead-capture|lead-magnet|community-engagement|community-manager|reputation|personal-brand|growth|social-selling|platform-selection/i],
  ['product', /product-manager|digital-product|value-ladder|oto-sequence|cro-process|sales-funnel|customer-journey|ecom-platform|print-on-demand|niche-analyst|personalized-content/i],
  ['ops', /customer-support|state-governor|fleet-health|slotmanager|snapshot-dispatcher|continuity|handoff|ops-|support-agent/i],
];

const DOMAIN_DEPT = {
  'business-growth': 'marketing',
  'media-content': 'marketing',
  'frontend-design': 'design',
  'docs-writing': 'product',
  'tnf-platform': 'tech',
  'tnf-fleet': 'ops',
  'protocol-governance': 'ops',
  'security-offensive': 'tech',
  'security-privacy': 'tech',
  'browser-automation': 'tech',
  'llm-ai': 'tech',
  'games-graphics': 'design',
  'backend-api': 'tech',
  'data-storage': 'tech',
  'cloud-infra': 'tech',
  'build-release': 'tech',
  'repo-git': 'tech',
  'testing-qa': 'tech',
  'knowledge-intake': 'ops',
  'engineering-practice': 'tech',
  'tooling-integration': 'tech',
  'infra-runtime': 'ops',
  'skill-authoring': 'tech',
  Engineering: 'tech',
  Scouting: 'marketing',
  Governance: 'ops',
  'Unified Orchestration': 'ops',
  Library: 'product',
  Journaling: 'marketing',
};

function walk(dir, pred, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === '.DS_Store' || ent.name === 'node_modules' || ent.name === 'dist') continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, pred, acc);
    else if (pred(ent.name, full)) acc.push(full);
  }
  return acc;
}

function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  return { raw: m[1], start: 0, end: m[0].length };
}

function scalar(fm, key) {
  const hit = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  if (!hit) return '';
  return hit[1].replace(/^['"]|['"]$/g, '').trim();
}

function classifyName(name) {
  for (const [domain, re] of DOMAINS) if (re.test(name)) return domain;
  return 'uncategorised';
}

function departmentFor({ name, category, kind }) {
  const hay = `${name} ${category}`;
  for (const [dept, re] of NAME_DEPT) if (re.test(hay)) return dept;
  if (category && DOMAIN_DEPT[category]) return DOMAIN_DEPT[category];
  const inferred = classifyName(name);
  if (DOMAIN_DEPT[inferred]) return DOMAIN_DEPT[inferred];
  return kind === 'agent' ? 'tech' : 'tech';
}

function insertScalar(fm, key, value) {
  if (new RegExp(`^${key}:`, 'm').test(fm)) return { fm, changed: false };
  const line = `${key}: ${value}`;
  if (/^category:/m.test(fm)) {
    return { fm: fm.replace(/^(category:.*)$/m, `$1\n${line}`), changed: true };
  }
  if (/^name:/m.test(fm)) {
    return { fm: fm.replace(/^(name:.*)$/m, `$1\n${line}`), changed: true };
  }
  return { fm: `${line}\n${fm}`, changed: true };
}

function isVendorSkill(relPath) {
  return VENDOR_RE.test(relPath);
}

function rel(abs) {
  return path.relative(ROOT, abs);
}

function apply() {
  const applyWrites = process.argv.includes('--apply');
  const dryRun = !applyWrites;

  const agents = walk(AGENT_DIR, (n) => n.endsWith('.md') && !n.startsWith('_'));
  const skills = SKILL_ROOTS.flatMap((root) => walk(root, (n) => n === 'SKILL.md'));

  const index = {
    schema: 'tnf.corporate.department-staffing.v1',
    updated_at: new Date().toISOString(),
    policy: {
      progressive_injection:
        'Department listings are names only. Do not dump SKILL.md or agent prompt bodies. Traverse: tnf department show → skill-bank-query → load one SKILL.md.',
      category_immutability: 'Existing category values are never rewritten.',
      vendor_skills: 'imported/anthropic/antigravity/.system files are indexed only, not mutated.',
    },
    departments: Object.fromEntries(DEPTS.map((id) => [id, { agents: [], skills: [] }])),
    stats: {
      agents: 0,
      skills: 0,
      agent_files_patched: 0,
      skill_files_patched: 0,
      skill_category_filled: 0,
      vendor_skills_indexed_only: 0,
      existing_category_preserved: 0,
    },
  };

  const patches = [];

  for (const file of agents) {
    const text = fs.readFileSync(file, 'utf8');
    const fm = parseFrontmatter(text);
    if (!fm) continue;
    const name = scalar(fm.raw, 'name') || path.basename(file, '.md');
    const category = scalar(fm.raw, 'category');
    if (category) index.stats.existing_category_preserved += 1;
    const department = departmentFor({ name, category, kind: 'agent' });
    index.departments[department].agents.push({
      name,
      category: category || null,
      path: rel(file),
    });
    index.stats.agents += 1;

    let nextFm = fm.raw;
    let changed = false;
    const deptIns = insertScalar(nextFm, 'department', department);
    nextFm = deptIns.fm;
    changed = changed || deptIns.changed;
    if (changed) {
      patches.push({ file, next: text.replace(fm.raw, nextFm), kind: 'agent' });
      index.stats.agent_files_patched += 1;
    }
  }

  for (const file of skills) {
    const relPath = rel(file);
    const text = fs.readFileSync(file, 'utf8');
    const fm = parseFrontmatter(text);
    const nameFromPath = path.basename(path.dirname(file));
    const name = fm ? scalar(fm.raw, 'name') || nameFromPath : nameFromPath;
    const existingCategory = fm ? scalar(fm.raw, 'category') : '';
    if (existingCategory) index.stats.existing_category_preserved += 1;
    const inferred = existingCategory || classifyName(name);
    const department = departmentFor({
      name,
      category: existingCategory || inferred,
      kind: 'skill',
    });
    index.departments[department].skills.push({
      name,
      category: existingCategory || (inferred !== 'uncategorised' ? inferred : null),
      path: relPath,
      vendor: isVendorSkill(relPath),
    });
    index.stats.skills += 1;

    if (isVendorSkill(relPath)) {
      index.stats.vendor_skills_indexed_only += 1;
      continue;
    }
    if (!fm) continue;

    let nextFm = fm.raw;
    let changed = false;
    if (!existingCategory && inferred !== 'uncategorised') {
      const catIns = insertScalar(nextFm, 'category', inferred);
      nextFm = catIns.fm;
      if (catIns.changed) {
        changed = true;
        index.stats.skill_category_filled += 1;
      }
    }
    const deptIns = insertScalar(nextFm, 'department', department);
    nextFm = deptIns.fm;
    changed = changed || deptIns.changed;
    if (changed) {
      patches.push({ file, next: text.replace(fm.raw, nextFm), kind: 'skill' });
      index.stats.skill_files_patched += 1;
    }
  }

  for (const id of DEPTS) {
    index.departments[id].agents.sort((a, b) => a.name.localeCompare(b.name));
    index.departments[id].skills.sort((a, b) => a.name.localeCompare(b.name));
  }

  fs.mkdirSync(path.dirname(INDEX_OUT), { recursive: true });
  fs.writeFileSync(INDEX_OUT, `${JSON.stringify(index, null, 2)}\n`);

  if (applyWrites) {
    for (const p of patches) fs.writeFileSync(p.file, p.next);
  }

  console.log(dryRun ? 'DRY RUN (index written, files not patched)' : 'APPLIED');
  console.log(JSON.stringify(index.stats, null, 2));
  console.log(
    'department counts',
    Object.fromEntries(
      DEPTS.map((id) => [
        id,
        {
          agents: index.departments[id].agents.length,
          skills: index.departments[id].skills.length,
        },
      ])
    )
  );
  console.log(`index: ${path.relative(ROOT, INDEX_OUT)}`);
  if (dryRun) console.log('Re-run with --apply to write department/category fields.');
}

apply();
