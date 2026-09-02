#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Tier-0 skill manifest — the always-loadable entry point to the skill network.
 *
 * Measured 2026-08-09 across 1,607 tracked SKILL.md files:
 *
 *   full corpus             ~2,326k tokens   unloadable by any model
 *   all frontmatter         ~128k tokens     unloadable as a session preamble
 *   project-scoped only     ~47k tokens      still ~25% of a 200k window
 *   unique skill names      575 of 1,607     1,032 redundant copies (64%)
 *
 * So the corpus already had two tiers — frontmatter (128k) and full body (2.3M)
 * — with nothing between. Both are too large to load, which means in practice
 * neither gets loaded and the network is not discoverable at all.
 *
 * This emits the missing tier: a domain map small enough to sit in every
 * session, from which an agent can narrow to a domain, then to a skill, then
 * read one body. Discovery becomes three cheap hops instead of one impossible
 * load.
 *
 *   Tier 0  this manifest          always loaded
 *   Tier 1  skill-bank-query.cjs   descriptions within a domain, on demand
 *   Tier 2  the SKILL.md body      only when the skill is invoked
 *
 * Usage
 *   node scripts/skills/build-skill-manifest.cjs            # write manifest
 *   node scripts/skills/build-skill-manifest.cjs --check    # report only
 */

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
/**
 * Tracked on purpose. `.agent/skill-bank/` is gitignored as a generated cache,
 * but this file has to be readable at session start in a fresh clone, by any
 * harness, without running node first — that is the entire point of Tier 0. It
 * is a definition bank, which `.gitignore` explicitly allowlists.
 */
const OUT = path.join(ROOT, '.agent', 'SKILL_MANIFEST.md');

const NAME_RE = /^name:\s*["']?([^"'\n]+)/m;
const DESC_RE = /^description:\s*["']?([^\n]+)/m;
const CATEGORY_RE = /^category:\s*["']?([^"'\n]+)/m;

/**
 * Some SKILL.md files have malformed frontmatter — `name:` and `description:`
 * run together on one line, so the name capture swallows the description and
 * the manifest shows entries like
 * "clawhub-skill-scout description: Discover and rank ClawHub skills using".
 * Cut at the first embedded key and cap the length.
 */
function cleanName(raw) {
  return raw.split(/\s+(?:description|allowed-tools|version|license):/i)[0].trim().slice(0, 80);
}

/**
 * Dedup key. The corpus mixes naming conventions, so
 * "Burp Suite Web Application Testing" and "burp-suite-web-application-testing"
 * are the same skill counted twice. Fold case and separators for identity;
 * the kebab-case spelling is preferred for display since it is what an agent
 * types.
 */
function dedupKey(name) {
  return name.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/**
 * Domain buckets, matched in order — SPECIFIC BEFORE GENERAL, because the first
 * match wins and a broad pattern placed early swallows everything after it.
 *
 * Derived from the actual 575 names, not from what a TNF taxonomy "should" look
 * like. Two findings forced the shape:
 *
 *  - A bare `agent` token captured 322 of 589 names (55%), including
 *    `2d-games`, `algolia-search`, and `azure-functions`. A bucket that large
 *    conveys nothing, so `agent` alone is not a signal; only fleet/orchestration
 *    vocabulary is.
 *  - Most of the corpus is vendored general-purpose skill packs (games, cloud,
 *    growth marketing, offensive security) rather than TNF-native skills. The
 *    taxonomy has to name those honestly or they all land in one lying bucket.
 *
 * The `*-agent` marketing skills (ad-network-manager-agent, audience-growth-
 * agent, …) are a large cohort of their own and classify by their SUBJECT, not
 * by the `-agent` suffix.
 */
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

/**
 * Root precedence — which copy wins when one name exists in several roots.
 *
 * Triage (`triage-skill-divergence.cjs`) showed the 50 permanent-root conflicts
 * are not accidental duplicates: 48 of them are the SAME skill vendored into
 * several roots (`.agent/skills/anthropic/x`, `.agent/skills/antigravity/x`,
 * `.skills/x`). They are already namespaced by DIRECTORY, but `name:` carries no
 * namespace, so they collide at resolution time and nothing decides the winner.
 *
 * Precedence makes that deterministic without editing 50 files or renaming
 * anything. Lower index wins.
 *
 * TNF-authored beats curated, curated beats vendored, vendored beats foreign
 * runtimes, and snapshots never win — they are point-in-time captures that the
 * governance promotion sweep turns into permanent copies.
 */
const ROOT_PRECEDENCE = [
  /^\.agent\/skills\/[^/]+\/SKILL\.md$/, // TNF-native, flat: .agent/skills/<name>/
  /^\.agent\/skills\/(security|engineering|data|common)\//, // TNF-curated domain packs
  /^\.skills\//, // flattened distribution root
  /^\.agent\/skills\/anthropic\//, // vendor: upstream Anthropic
  /^\.agent\/skills\/antigravity\//, // vendor: Antigravity
  /^\.agent\/skills\//, // any other TNF skill dir
  /^packages\/claw-skills\//, // external runtime (openclaw/picoclaw symlink target)
  /^\.antigravity\/skills\//,
  /^\.jules\//,
];

const SNAPSHOT_RE = /(^|\/)skill-bank\/snapshots\//;

/**
 * Divergence is a property of the BODY, not the file.
 *
 * This previously compared `file.length`, which both over- and under-counts:
 * frontmatter legitimately differs per root (a promoted copy gains `category`,
 * `risk_tier`), so identical skills read as diverged, while two genuinely
 * different bodies of equal length read as identical. It disagreed with
 * `triage-skill-divergence.cjs` by one name. Same hash, same answer.
 */
function bodyHash(text) {
  const body = text.replace(/^---\n[\s\S]*?\n---\n?/, '');
  return require('node:crypto').createHash('sha256').update(body.trim()).digest('hex').slice(0, 12);
}

function rootRank(file) {
  if (SNAPSHOT_RE.test(file)) return ROOT_PRECEDENCE.length + 1; // never authoritative
  const i = ROOT_PRECEDENCE.findIndex((re) => re.test(file));
  return i === -1 ? ROOT_PRECEDENCE.length : i;
}

/**
 * Tracked files alone are the wrong input set.
 *
 * A skill authored during a work cycle is a real, valid skill the moment its
 * SKILL.md lands on disk, but `git ls-files` only sees it after staging. That
 * made every newly created skill invisible to the manifest — the single entry
 * surface agents read — until someone committed it, so the author's own session
 * could never discover the skill it had just written.
 *
 * `--cached --others --exclude-standard` adds untracked files while still
 * honouring .gitignore, which keeps node_modules, vendored packs, and build
 * caches out. Duplicates are possible in principle, so dedupe.
 */
function tracked(pattern) {
  const out = execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', pattern],
    {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
    }
  );
  return [...new Set(out.split('\n').filter(Boolean))];
}

/**
 * The declared `category` frontmatter field is AUTHORITATIVE when present.
 *
 * TNF already has a taxonomy: `skill-governance-check.cjs` requires `category`
 * alongside `primary_type` / `risk_tier` / `harmful_pattern_detection`, and
 * `.skills/skill-catalog/promoted-snapshot-skills.json` carries hierarchical
 * values like `security/pentest`. It is the right design; it is simply
 * unpopulated — 24 catalogued skills, and 2 of 162 in `.agent/skills` declare
 * `category` at all.
 *
 * So inference below is a BACKFILL, not a competing scheme. A declared category
 * always wins, its top-level segment becomes the domain, and `--gaps` lists the
 * skills still relying on inference so the real field can be filled in. As
 * `category` adoption rises, inference falls out of use on its own.
 */
/**
 * Declared categories and inferred domains must land in ONE vocabulary.
 *
 * Taking the declared category's top-level segment verbatim produced parallel
 * buckets for the same subject — `security` (13) beside `security-privacy` (10)
 * and `security-offensive` (2), `engineering` (8) beside
 * `engineering-practice` (28), `data` beside `data-storage`. An agent scanning
 * the map would have to know both schemes to find anything, which defeats the
 * point of a single entry surface.
 *
 * The declared category still decides WHERE a skill goes; this table only
 * normalises what that destination is CALLED. Full path wins over segment, so
 * `security/pentest` separates from the rest of `security/`.
 */
const CATEGORY_ALIASES = new Map([
  ['security/pentest', 'security-offensive'],
  ['security/network-analysis', 'security-offensive'],
  ['engineering/governance', 'protocol-governance'],
  ['engineering/patterns', 'engineering-practice'],
  ['engineering/deployment', 'build-release'],
  ['meta/templates', 'skill-authoring'],
  ['security', 'security-privacy'],
  ['engineering', 'engineering-practice'],
  ['data', 'data-storage'],
  ['ops', 'infra-runtime'],
  ['devops', 'build-release'],
  ['meta', 'skill-authoring'],
  ['framework', 'tnf-platform'],
  ['tnf', 'tnf-platform'],
]);

function declaredDomain(category) {
  if (!category) return null;
  const full = category.trim().toLowerCase();
  if (!full) return null;
  if (CATEGORY_ALIASES.has(full)) return CATEGORY_ALIASES.get(full);
  const top = full.split('/')[0].trim();
  return CATEGORY_ALIASES.get(top) || top || null;
}

/**
 * Classify on the skill NAME only — fallback when `category` is absent.
 *
 * Falling back to the file path was tried and removed: every skill lives under
 * some `.agent/skills/` or `claw-skills/skills/` container, so the path matched
 * a container token for any name that matched nothing, and the fallback quietly
 * became a catch-all. It sorted `2d-games` into agent-fleet, then `multiplayer`
 * and `yeet` into skill-authoring — buckets that look populated and are wrong.
 *
 * A skill's directory is its own slug, so the path carries no information the
 * name doesn't already have. Names that match nothing are reported as
 * `uncategorised`, which is honest and doubles as the taxonomy's coverage
 * metric: if that bucket grows, the taxonomy needs a term, not a fallback.
 */
function classify(name) {
  for (const [domain, re] of DOMAINS) if (re.test(name)) return domain;
  return 'uncategorised';
}

function main(argv) {
  const checkOnly = argv.includes('--check');
  const files = tracked('*SKILL.md').filter((f) => fs.existsSync(path.join(ROOT, f)));

  const byName = new Map();
  for (const f of files) {
    let t;
    try {
      t = fs.readFileSync(path.join(ROOT, f), 'utf8');
    } catch {
      continue;
    }
    const raw = (NAME_RE.exec(t) || [])[1]?.trim() || path.basename(path.dirname(f));
    const n = cleanName(raw);
    const d = (DESC_RE.exec(t) || [])[1]?.trim() || '';
    const cat = (CATEGORY_RE.exec(t) || [])[1]?.trim() || '';
    const key = dedupKey(n);
    if (!key) continue;
    if (!byName.has(key)) {
      byName.set(key, { name: n, desc: d, category: cat, files: [], bodies: new Set() });
    }
    const e = byName.get(key);
    if (cat && !e.category) e.category = cat;
    // Prefer the kebab-case spelling for display — that is what an agent types.
    if (/^[a-z0-9-]+$/.test(n) && !/^[a-z0-9-]+$/.test(e.name)) e.name = n;
    e.files.push(f);
    e.bodies.add(bodyHash(t));
    if (d.length > e.desc.length) e.desc = d;
    // Track the highest-precedence copy so the manifest can name ONE
    // authoritative path per skill instead of leaving the choice undefined.
    const rank = rootRank(f);
    if (e.rank === undefined || rank < e.rank) {
      e.rank = rank;
      e.canonicalFile = f;
    }
  }

  const domains = new Map();
  let diverged = 0;
  let declared = 0;
  for (const e of byName.values()) {
    if (e.files.length > 1 && e.bodies.size > 1) diverged += 1;
    const fromField = declaredDomain(e.category);
    if (fromField) declared += 1;
    e.inferred = !fromField;
    const dom = fromField || classify(e.name);
    if (!domains.has(dom)) domains.set(dom, []);
    domains.get(dom).push(e);
  }

  // Largest domain first, but `uncategorised` always last — it is a coverage
  // gap, not a category, and it should not head the map an agent reads first.
  const sorted = [...domains.entries()].sort((a, b) => {
    if (a[0] === 'uncategorised') return 1;
    if (b[0] === 'uncategorised') return -1;
    return b[1].length - a[1].length;
  });
  const lines = [];
  lines.push('# TNF Skill Manifest — Tier 0');
  lines.push('');
  lines.push(`<!-- generated by scripts/skills/build-skill-manifest.cjs — do not edit by hand -->`);
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push(
    `**Corpus:** ${files.length} SKILL.md files · ${byName.size} unique skills · ${files.length - byName.size} redundant copies`
  );
  lines.push('');
  lines.push(
    'This is the entry point to the skill network, sized to be loaded every session. ' +
      'It intentionally lists **domains and skill names only** — no descriptions, no bodies. ' +
      'Loading every description costs ~128k tokens; every body ~2.3M.'
  );
  lines.push('');
  lines.push(
    `**Domain source:** ${declared} of ${byName.size} skills declare a \`category:\` ` +
      `field (authoritative); the remaining ${byName.size - declared} are grouped by ` +
      'name inference as a backfill. `category` is required by ' +
      '`scripts/skills/skill-governance-check.cjs` — filling it in retires the guesswork.'
  );
  lines.push('');
  lines.push('**How to traverse:**');
  lines.push('');
  lines.push('1. Find the domain below that matches the task.');
  lines.push('2. `node scripts/skills/skill-bank-query.cjs <term>` — descriptions for candidates.');
  lines.push('3. Read that one `SKILL.md` body only when you invoke it.');
  lines.push('');
  if (diverged) {
    lines.push(
      `> ⚠️ **${diverged} skill names have diverged copies** — same name, different content, ` +
        'across roots. Which one an agent gets is currently undefined. See §Divergence.'
    );
    lines.push('');
  }
  lines.push('---');
  lines.push('');

  for (const [dom, entries] of sorted) {
    entries.sort((a, b) => a.name.localeCompare(b.name));
    lines.push(`## ${dom} (${entries.length})`);
    lines.push('');
    lines.push(entries.map((e) => `\`${e.name}\``).join(' · '));
    lines.push('');
  }

  if (diverged) {
    lines.push('---');
    lines.push('');
    lines.push('## Divergence');
    lines.push('');
    lines.push(
      'Same name, different content across roots. These are mostly **vendor ' +
        'variants** (`anthropic/`, `antigravity/`, flattened `.skills/`), not ' +
        'accidental duplicates — already namespaced by directory, but `name:` ' +
        'carries no namespace, so they collide at resolution time.'
    );
    lines.push('');
    lines.push(
      'Resolution is by declared root precedence (`ROOT_PRECEDENCE` in ' +
        '`scripts/skills/build-skill-manifest.cjs`): TNF-authored > curated > ' +
        'vendored > foreign runtime, and snapshots never win. The **resolves to** ' +
        'path below is what an agent gets.'
    );
    lines.push('');
    lines.push('Triage with `node scripts/skills/triage-skill-divergence.cjs`.');
    lines.push('');
    for (const e of byName.values()) {
      if (e.files.length > 1 && e.bodies.size > 1) {
        lines.push(
          `- \`${e.name}\` — ${e.files.length} copies, ${e.bodies.size} distinct bodies` +
            ` → resolves to \`${e.canonicalFile}\``
        );
      }
    }
    lines.push('');
  }

  const out = lines.join('\n');
  const tokens = Math.round(out.length / 4);

  console.log(`[skill-manifest] ${files.length} files -> ${byName.size} unique skills`);
  console.log(`  domains          : ${sorted.length}`);
  console.log(`  declared category: ${declared}  (authoritative)`);
  console.log(`  inferred         : ${byName.size - declared}  (backfill — fill in \`category:\`)`);
  console.log(`  diverged names   : ${diverged}`);
  console.log(`  manifest size    : ${(out.length / 1024).toFixed(1)} KB  (~${tokens} tokens)`);
  console.log(`  vs full index    : ~128,000 tokens  (${Math.round(128000 / Math.max(tokens, 1))}x smaller)`);

  if (checkOnly) return 0;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${out}\n`);
  console.log(`  written          : ${path.relative(ROOT, OUT)}`);
  return 0;
}

try {
  process.exit(main(process.argv.slice(2)));
} catch (error) {
  console.error(`[skill-manifest] ${error.message}`);
  process.exit(1);
}
