#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Notation Coherence at Point of Change.
 *
 * THE GAP THIS FILLS
 *   notation-reconciliation-audit.cjs finds notation that points at things which
 *   no longer exist — dangling paths, dangling commands. It cannot see the more
 *   dangerous case: notation that still resolves but now *misdescribes* the code
 *   it sits above, because the code changed and the comment did not.
 *
 *   That case is not hypothetical. On 2026-09-02/03, all four in one session:
 *     - isEntitled() gained operator-custody resolution; its doc comment kept
 *       saying the filter "is a server-side deployment switch" reachable only
 *       via an env var. Needed a follow-up PR (#294) to correct.
 *     - resolve-cloud-redis.sh carried "Legacy Railway discovery retired" above
 *       four CLOUD_RUNTIME_* branches that were still there.
 *     - scripts/deploy.js said "CloudRuntime uses cloud_runtime.toml" while
 *       invoking gcp-deploy.sh.
 *     - The railway -> cloud_runtime rename left ~447 files describing
 *       infrastructure that had moved.
 *
 *   A stale comment is worse than no comment: it is read as authority. TNF has
 *   already had an agent read stale notation and report a dead host as live
 *   infrastructure.
 *
 * WHAT IT DOES
 *   For each staged code file, finds changed line ranges and the doc comment
 *   block attached above the enclosing declaration. If the code changed and its
 *   attached comment did not, it surfaces the pair.
 *
 * WHAT IT DOES NOT DO
 *   It does not judge whether the comment is *actually* wrong — that needs
 *   reading, which is the point. It surfaces "you changed this; its description
 *   did not change; confirm the description is still true." Advisory by default
 *   (exit 0) precisely because it cannot know; --strict blocks for CI.
 *
 * Usage
 *   node scripts/protocols/notation-coherence-gate.cjs            # staged, advisory
 *   node scripts/protocols/notation-coherence-gate.cjs --strict   # exit 1 on findings
 *   node scripts/protocols/notation-coherence-gate.cjs --json
 */

const { execSync } = require('node:child_process');
const fs = require('node:fs');

const CODE_EXT = /\.(ts|tsx|js|jsx|cjs|mjs|py|sh|bash)$/;
// A doc block is a run of comment lines immediately above a declaration.
const COMMENT_LINE = /^\s*(\/\/|\/\*|\*|#)/;
const BLOCK_OPEN = /^\s*\/\*/;
const BLOCK_CLOSE = /\*\/\s*$/;
// Declarations worth having a description.
const DECL = /^\s*(export\s+)?(async\s+)?(function|class|const\s+\w+\s*=\s*(async\s*)?\(|def\s|[A-Za-z_][\w]*\s*\(\)\s*\{)/;

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });
}

/** Changed line numbers per staged file, from a zero-context diff. */
function stagedChanges() {
  const files = sh('git diff --cached --name-only --diff-filter=ACMR')
    .split('\n')
    .map((s) => s.trim())
    .filter((f) => f && CODE_EXT.test(f) && fs.existsSync(f));

  const out = new Map();
  for (const f of files) {
    let diff = '';
    try {
      diff = sh(`git diff --cached -U0 -- ${JSON.stringify(f)}`);
    } catch {
      continue;
    }
    const lines = new Set();
    for (const m of diff.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
      const start = Number(m[1]);
      const count = m[2] === undefined ? 1 : Number(m[2]);
      for (let i = 0; i < count; i += 1) lines.add(start + i);
    }
    if (lines.size) out.set(f, lines);
  }
  return out;
}

/**
 * Walk up from a changed line to the declaration that encloses it, then to the
 * comment block directly above that declaration. Returns null when there is no
 * attached documentation — undocumented code is a different problem.
 */
function attachedDocBlock(src, lineNo) {
  let i = lineNo - 1; // to 0-based
  // Find the nearest declaration at or above this line, within a sane window.
  let declIdx = -1;
  for (let k = i; k >= 0 && i - k < 400; k -= 1) {
    if (DECL.test(src[k])) {
      declIdx = k;
      break;
    }
  }
  if (declIdx < 0) return null;

  // Comment run immediately above the declaration (allow blank lines between).
  let j = declIdx - 1;
  while (j >= 0 && src[j].trim() === '') j -= 1;
  if (j < 0 || !COMMENT_LINE.test(src[j])) return null;

  const end = j;
  let start = j;
  while (start > 0) {
    const prev = src[start - 1];
    if (COMMENT_LINE.test(prev)) {
      start -= 1;
      if (BLOCK_OPEN.test(prev) && !BLOCK_CLOSE.test(prev)) break;
    } else break;
  }
  // Only meaningful for a real description, not a one-word marker.
  const text = src.slice(start, end + 1).join(' ');
  if (text.replace(/[^A-Za-z]/g, '').length < 40) return null;
  return { start: start + 1, end: end + 1, declLine: declIdx + 1 };
}

function main() {
  const argv = process.argv.slice(2);
  const strict = argv.includes('--strict');
  const asJson = argv.includes('--json');

  const changes = stagedChanges();
  const findings = [];

  for (const [file, changedLines] of changes) {
    const src = fs.readFileSync(file, 'utf8').split('\n');
    const seen = new Set();
    for (const ln of [...changedLines].sort((a, b) => a - b)) {
      const doc = attachedDocBlock(src, ln);
      if (!doc) continue;
      const key = `${file}:${doc.start}`;
      if (seen.has(key)) continue;
      // If any line of the doc block was itself changed, the author addressed it.
      let docTouched = false;
      for (let d = doc.start; d <= doc.end; d += 1) {
        if (changedLines.has(d)) {
          docTouched = true;
          break;
        }
      }
      if (docTouched) continue;
      seen.add(key);
      findings.push({
        file,
        docLines: `${doc.start}-${doc.end}`,
        declLine: doc.declLine,
        changedLine: ln,
        summary: src[doc.declLine - 1].trim().slice(0, 78),
      });
    }
  }

  if (asJson) {
    console.log(JSON.stringify({ ok: findings.length === 0, findings }, null, 2));
    if (strict && findings.length) process.exit(1);
    return;
  }

  if (!findings.length) {
    console.log('[notation-coherence] OK: every changed documented block had its description reviewed');
    return;
  }

  console.log(`[notation-coherence] ${findings.length} changed block(s) whose description did NOT change:`);
  console.log('');
  for (const f of findings) {
    console.log(`  ${f.file}`);
    console.log(`    code changed at line ${f.changedLine}  ->  ${f.summary}`);
    console.log(`    its description: lines ${f.docLines} (unchanged)`);
  }
  console.log('');
  console.log('  This is NOT an assertion that the description is wrong — only that you');
  console.log('  changed behaviour and left its description alone. Confirm it is still true.');
  console.log('  A stale comment is read as authority; TNF has already had an agent report a');
  console.log('  dead host as live infrastructure from one.');
  console.log('');
  console.log('  If the description is still accurate, nothing to do.');
  console.log('  See docs/protocols/TNF_NOTATION_COHERENCE_PROTOCOL.md');

  if (strict) process.exit(1);
}

try {
  main();
} catch (err) {
  // Advisory tooling must never be the reason a commit fails.
  console.log(`[notation-coherence] skipped: ${err.message}`);
}
