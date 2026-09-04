#!/usr/bin/env node
/**
 * turn-end-reflection.cjs — the two questions a session must ask itself before
 * it ends.
 *
 *   1. Did this session learn something a future session would otherwise
 *      rediscover the hard way?
 *   2. Did this session build a reusable capability that does not already exist
 *      in the skill library?
 *
 * Why this is a Turn End step and not a nicety
 * --------------------------------------------
 * `TNF_BOOK_OF_AXIOMS` Axiom 8 (= D3, Non-Temporal Proliferation) is explicit:
 * "if an agent improves itself but fails to implement that improvement into the
 * shared TNF framework, **the action is void**." Axiom 5 (Persistence) says the
 * same for understanding: "Fruitful understandings shall never be left as
 * transactional transients."
 *
 * TNF has paid for this repeatedly. The 2026-08-30 lexicon purge improved 25
 * documents and never reached an executable, so `turn-zero-v2-gate.cjs` went on
 * requiring a term the operator had retired. Lessons themselves show the same
 * shape: four `*_LESSONS_*.md` files sit in `docs/protocols/reports/` with no
 * index, so nothing finds them and each session rediscovers the ground.
 *
 * What this does NOT do
 * ---------------------
 * It does not decide that a lesson or a skill exists. It surfaces candidates
 * with evidence and makes the author answer. An automated "no lessons today" is
 * exactly the fabricated pass `TURN_END_MANDATE` forbids ("`na` is preferable to
 * inventing a pass"), and an auto-written lesson would be a confident guess
 * about what mattered.
 *
 * Usage
 * -----
 *   node scripts/protocols/turn-end-reflection.cjs                # report
 *   node scripts/protocols/turn-end-reflection.cjs --json
 *   node scripts/protocols/turn-end-reflection.cjs --since <ref>  # default origin/main
 *   node scripts/protocols/turn-end-reflection.cjs --record-lesson <slug> --title "..."
 *   node scripts/protocols/turn-end-reflection.cjs --propose-skill <slug> --title "..."
 */

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const SKILLS_DIR = path.join(ROOT, '.agent', 'skills');
const LESSONS_DIR = path.join(ROOT, 'docs', 'protocols', 'lessons');
const LESSONS_INDEX = path.join(LESSONS_DIR, 'INDEX.md');

function git(args, fallback = '') {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return fallback;
  }
}

/** Every skill in the library, with the words that describe it. */
function loadSkills() {
  const out = [];
  let entries = [];
  try {
    entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const file = path.join(SKILLS_DIR, e.name, 'SKILL.md');
    let text = '';
    try {
      text = fs.readFileSync(file, 'utf8').slice(0, 2000);
    } catch {
      continue;
    }
    const name = (text.match(/^name:\s*(.+)$/m) || [])[1] || e.name;
    const desc = (text.match(/^description:\s*([\s\S]*?)(?:\n[a-z_]+:|\n---)/m) || [])[1] || '';
    out.push({ slug: e.name, name: String(name).trim(), text: `${name} ${desc}`.toLowerCase() });
  }
  return out;
}

const STOP = new Set([
  'the','and','for','with','that','this','from','into','when','what','how','a','an','of','to','in','is','it','on',
  'tnf','agent','agents','skill','skills','use','using','used','not','are','be','by','as','or','its','can',
]);
function tokens(s) {
  return new Set(
    String(s).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w))
  );
}

/** Skills whose description overlaps a proposed capability. */
function overlappingSkills(candidate, skills, limit = 5) {
  const want = tokens(candidate);
  if (!want.size) return [];
  return skills
    .map((s) => {
      const have = tokens(s.text);
      let hits = 0;
      for (const w of want) if (have.has(w)) hits += 1;
      return { slug: s.slug, name: s.name, score: hits / want.size };
    })
    .filter((s) => s.score > 0.25)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Capability candidates: executable things this session added.
 *
 * A new script or protocol module is the strongest signal that a session
 * actualized something reusable — it is a capability that did not exist before
 * and now does.
 */
function capabilityCandidates(since) {
  const raw = git(['diff', '--name-status', `${since}...HEAD`]);
  if (!raw) return [];
  return raw
    .split('\n')
    .map((l) => l.split('\t'))
    .filter(([status, file]) => status === 'A' && file)
    .map(([, file]) => file)
    .filter((f) => /^(scripts|packages\/[^/]+\/src)\/.*\.(cjs|mjs|js|ts)$/.test(f))
    .filter((f) => !/\.test\.|\.spec\./.test(f));
}

/** Lesson-shaped artifacts already written, wherever they landed. */
function existingLessons() {
  const found = [];
  const scan = (dir, rel, { requireLessonInName }) => {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (!e.isFile() || !e.name.endsWith('.md')) continue;
      if (e.name === 'INDEX.md') continue;
      // Outside the lessons directory a lesson is only identifiable by name.
      // Inside it, every file is one — matching on the name there would miss
      // any lesson whose title does not happen to contain the word.
      if (requireLessonInName && !/lesson/i.test(e.name)) continue;
      found.push(path.join(rel, e.name));
    }
  };
  scan(path.join(ROOT, 'docs', 'protocols', 'reports'), 'docs/protocols/reports', {
    requireLessonInName: true,
  });
  scan(LESSONS_DIR, 'docs/protocols/lessons', { requireLessonInName: false });
  return found;
}

function slugToday() {
  return new Date().toISOString().slice(0, 10);
}

function recordLesson(slug, title) {
  fs.mkdirSync(LESSONS_DIR, { recursive: true });
  const file = path.join(LESSONS_DIR, `${slugToday()}-${slug}.md`);
  if (fs.existsSync(file)) throw new Error(`lesson already exists: ${file}`);
  fs.writeFileSync(
    file,
    `# ${title || slug} — ${slugToday()}

\`[CLASS:INTEL] [STATUS:PROPOSED] [DOC_TYPE:LESSON] [VISIBILITY:COLLECTIVE]\`

## What happened

<!-- The observable facts, with file:line or command evidence. No inference yet. -->

## Why it happened

<!-- The mechanism. Not "someone forgot" — what made forgetting possible. -->

## What a future session should do differently

<!-- Actionable. If it cannot be acted on, it is a story, not a lesson. -->

## Evidence

<!-- Commands, paths, commit shas, measured numbers. -->
`,
    'utf8'
  );
  // Index it, or nothing will ever find it — the failure the existing four have.
  const rel = path.relative(ROOT, file);
  let index = '';
  try {
    index = fs.readFileSync(LESSONS_INDEX, 'utf8');
  } catch {
    index = `# TNF Lessons Learned — Index

\`[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:PROTOCOL_INDEX] [VISIBILITY:COLLECTIVE]\`

Every lesson is indexed here at write time. Four earlier lessons sat unindexed in
\`docs/protocols/reports/\` and nothing ever found them, which is the failure this
index exists to prevent.

`;
  }
  fs.writeFileSync(LESSONS_INDEX, `${index.trimEnd()}\n- [${title || slug}](${path.basename(file)}) — recorded ${slugToday()}\n`, 'utf8');
  return rel;
}

function proposeSkill(slug, title, skills) {
  const dir = path.join(SKILLS_DIR, slug);
  if (fs.existsSync(dir)) throw new Error(`skill already exists: .agent/skills/${slug}`);
  const overlap = overlappingSkills(`${slug} ${title || ''}`, skills);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'SKILL.md');
  fs.writeFileSync(
    file,
    `---
name: ${slug}
description: ${title || 'TODO — what this teaches, and when an agent should reach for it.'}
primary_type: procedural
category: engineering/patterns
status: PROPOSED
---

# ${title || slug}

## When to use this

<!-- The trigger. An agent should be able to recognise the situation. -->

## The method

<!-- Steps that work. Cite the real files/commands this was derived from. -->

## Why the obvious approach fails

<!-- What was tried first and why it did not hold. This is the reusable part. -->

${overlap.length ? `## Overlap reviewed\n\n${overlap.map((o) => `- \`${o.slug}\` (${Math.round(o.score * 100)}% descriptor overlap)`).join('\n')}\n\nState here why this is distinct rather than an extension of the above.\n` : ''}`,
    'utf8'
  );
  return { path: path.relative(ROOT, file), overlap };
}

function main() {
  const argv = process.argv.slice(2);
  const asJson = argv.includes('--json');
  const sinceIdx = argv.indexOf('--since');
  const since = sinceIdx !== -1 ? argv[sinceIdx + 1] : 'origin/main';

  const skills = loadSkills();

  const lessonIdx = argv.indexOf('--record-lesson');
  if (lessonIdx !== -1) {
    const titleIdx = argv.indexOf('--title');
    const rel = recordLesson(argv[lessonIdx + 1], titleIdx !== -1 ? argv[titleIdx + 1] : '');
    console.log(`lesson scaffolded and indexed: ${rel}`);
    return;
  }
  const skillIdx = argv.indexOf('--propose-skill');
  if (skillIdx !== -1) {
    const titleIdx = argv.indexOf('--title');
    const res = proposeSkill(argv[skillIdx + 1], titleIdx !== -1 ? argv[titleIdx + 1] : '', skills);
    console.log(`skill scaffolded: ${res.path}`);
    if (res.overlap.length) {
      console.log('review overlap before finishing it:');
      for (const o of res.overlap) console.log(`  ${o.slug} (${Math.round(o.score * 100)}%)`);
    }
    return;
  }

  const candidates = capabilityCandidates(since);
  const lessons = existingLessons();
  const indexed = fs.existsSync(LESSONS_INDEX);

  const report = {
    since,
    skillLibrarySize: skills.length,
    capabilityCandidates: candidates.map((file) => ({
      file,
      overlappingSkills: overlappingSkills(path.basename(file, path.extname(file)).replace(/[-_]/g, ' '), skills),
    })),
    existingLessons: lessons,
    lessonsIndexed: indexed,
  };

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log('=== Turn End Reflection ===');
  console.log(`- comparing against: ${since}`);
  console.log(`- skill library: ${skills.length} skills`);
  console.log('');
  console.log('Q1. Did this session learn something a future session would otherwise');
  console.log('    rediscover the hard way?');
  if (!indexed) {
    console.log(`  ▲ there is no lessons index at docs/protocols/lessons/INDEX.md`);
  }
  if (lessons.length) {
    console.log(`  ${lessons.length} lesson artifact(s) on disk:`);
    for (const l of lessons) console.log(`    ${l}`);
  }
  console.log('  Record one:  --record-lesson <slug> --title "..."');
  console.log('');
  console.log('Q2. Did this session actualize a reusable capability that does not');
  console.log('    already exist in the library?');
  if (!candidates.length) {
    console.log('  no new executable modules since ' + since + ' — likely nothing to extract.');
  } else {
    for (const c of report.capabilityCandidates) {
      console.log(`  + ${c.file}`);
      if (c.overlappingSkills.length) {
        console.log(
          `      overlaps: ${c.overlappingSkills.map((o) => `${o.slug} (${Math.round(o.score * 100)}%)`).join(', ')}`
        );
      } else {
        console.log('      no descriptor overlap with the existing library');
      }
    }
  }
  console.log('  Propose one: --propose-skill <slug> --title "..."');
  console.log('');
  console.log('Answer both in the handoff `reflection` field. Axiom 8: an improvement');
  console.log('that never reaches the shared framework is void.');
}

if (require.main === module) main();

module.exports = { loadSkills, overlappingSkills, capabilityCandidates, existingLessons };
