#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PROJECT_ROOT = process.cwd();
const REPORT_PATH = path.join(PROJECT_ROOT, '.documentation-system/analysis/evolution-report.json');

const args = new Set(process.argv.slice(2));
const onlyP1 = args.has('--p1-only');
const includeP2 = args.has('--include-p2');
const write = !args.has('--dry-run');

if (!fs.existsSync(REPORT_PATH)) {
  throw new Error(`Missing report: ${REPORT_PATH}`);
}

const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8')) as {
  tasks: Array<{
    id: string;
    type: string;
    priority: 'P1' | 'P2' | 'P3' | 'P4';
    paths: string[];
  }>;
};

const fileList = execSync('rg --files', {
  cwd: PROJECT_ROOT,
  stdio: ['ignore', 'pipe', 'pipe'],
  maxBuffer: 64 * 1024 * 1024,
})
  .toString('utf8')
  .split('\n')
  .filter(Boolean)
  .map((p) => p.replace(/\\/g, '/'));

const basenameIndex = new Map<string, Set<string>>();
for (const p of fileList) {
  if (!/\.(md|mdx|txt)$/i.test(p)) continue;
  if (/(^|\/)docs\/_archive\//.test(p)) continue;
  const name = normalizeName(path.posix.basename(p, path.posix.extname(p)));
  if (!name) continue;
  if (!basenameIndex.has(name)) basenameIndex.set(name, new Set());
  basenameIndex.get(name)!.add(p);
}

function isExternalLink(raw: string): boolean {
  return /^(https?:\/\/|mailto:|tel:|#)/i.test(raw.trim());
}

function normalizeName(input: string): string {
  return input
    .toLowerCase()
    .replace(/\b(v\d+|final|latest|summary|complete|report|notes|draft)\b/g, '')
    .replace(/[_\-.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTarget(raw: string): string {
  return raw.trim().replace(/^<|>$/g, '').replace(/^`|`$/g, '');
}

function splitSuffix(target: string): { base: string; suffix: string } {
  const m = target.match(/^([^?#]+)([?#].*)$/);
  if (!m) return { base: target, suffix: '' };
  return { base: m[1], suffix: m[2] };
}

function removeLineSuffix(base: string): string {
  return base.replace(/:(\d+)(:\d+)?$/, '');
}

function expandCandidates(rootRel: string): string[] {
  const norm = path.posix.normalize(rootRel.replace(/^\.\//, '').replace(/^\//, ''));
  const out = new Set<string>([norm]);
  if (!path.posix.extname(norm)) {
    out.add(`${norm}.md`);
    out.add(`${norm}.mdx`);
    out.add(path.posix.join(norm, 'README.md'));
    out.add(path.posix.join(norm, 'index.md'));
  }
  return Array.from(out);
}

function existingResolvedPath(rootRel: string): string | null {
  for (const c of expandCandidates(rootRel)) {
    const abs = path.join(PROJECT_ROOT, c);
    if (fs.existsSync(abs)) return c;
  }
  return null;
}

function isArchivePath(p: string): boolean {
  return /(^|\/)_archive\//.test(p) || /(^|\/)_archives\//.test(p) || /(^|\/)archive\//.test(p);
}

function asWrittenRoots(base: string, sourcePath: string): string[] {
  const sourceDir = path.posix.dirname(sourcePath);
  const stripped = removeLineSuffix(base);
  if (!stripped) return [];
  if (stripped.startsWith('/')) return [stripped.slice(1)];
  return [path.posix.normalize(path.posix.join(sourceDir, stripped))];
}

function repoMarkerToRoot(base: string): string | null {
  const stripped = removeLineSuffix(base);
  if (!stripped) return null;

  if (/^<repo-root>\//i.test(stripped) || /^<repo_root>\//i.test(stripped)) {
    return stripped.replace(/^<repo-root>\//i, '').replace(/^<repo_root>\//i, '');
  }

  if (/^file:\/\//i.test(stripped)) {
    const noScheme = stripped.replace(/^file:\/\/+/, '/').replace(/\\/g, '/');
    const repoMatch = noScheme.match(/\/The-New-Fuse\/(.+)$/);
    if (repoMatch && repoMatch[1]) {
      return repoMatch[1];
    } else {
      const rootPosix = PROJECT_ROOT.replace(/\\/g, '/');
      if (noScheme.startsWith(rootPosix + '/')) {
        return noScheme.slice(rootPosix.length + 1);
      }
    }
  }

  return null;
}

function basenameFallback(base: string): string | null {
  const stripped = removeLineSuffix(base).replace(/^\.\//, '');
  const withoutRel = stripped.replace(/^(\.\.\/)+/, '');
  if (withoutRel.includes('/')) return null;
  if (!/\.(md|mdx|txt)$/i.test(withoutRel)) return null;

  const key = normalizeName(path.posix.basename(withoutRel, path.posix.extname(withoutRel)));
  const hits = Array.from(basenameIndex.get(key) || []).filter((p) => !isArchivePath(p));
  if (hits.length === 1) return hits[0];
  return null;
}

function scoreCandidate(candidate: string, sourcePath: string): number {
  let score = 0;
  if (!isArchivePath(candidate)) score += 6;
  if (candidate.startsWith('docs/')) score += 4;
  if (candidate.startsWith(path.posix.dirname(sourcePath) + '/')) score += 2;
  score -= candidate.length / 1000;
  return score;
}

function chooseUniqueBest(candidates: string[], sourcePath: string): string | null {
  if (candidates.length === 0) return null;
  const unique = Array.from(new Set(candidates));
  if (unique.length === 1) return unique[0];

  const scored = unique
    .map((c) => ({ c, score: scoreCandidate(c, sourcePath) }))
    .sort((a, b) => b.score - a.score);

  if (scored.length < 2) return scored[0]?.c || null;
  if (Math.abs(scored[0].score - scored[1].score) < 0.25) return null;
  return scored[0].c;
}

function rewriteTarget(rawTarget: string, sourcePath: string): string | null {
  const cleaned = cleanTarget(rawTarget);
  if (!cleaned || isExternalLink(cleaned)) return null;

  const { base, suffix } = splitSuffix(cleaned);
  if (!base) return null;

  // Keep links that already resolve exactly as-written.
  for (const r of asWrittenRoots(base, sourcePath)) {
    if (existingResolvedPath(r)) return null;
  }

  const transformedMatches: string[] = [];

  // Convert explicit repo placeholders to real repo-relative links.
  const repoMapped = repoMarkerToRoot(base);
  if (repoMapped) {
    const exists = existingResolvedPath(repoMapped);
    if (exists) transformedMatches.push(exists);
  }

  // Retry after stripping line suffixes like :123 or :12:3.
  const strippedLine = removeLineSuffix(base);
  if (strippedLine !== base) {
    for (const r of asWrittenRoots(strippedLine, sourcePath)) {
      const exists = existingResolvedPath(r);
      if (exists) transformedMatches.push(exists);
    }
  }

  // Conservative fallback: only for plain filename targets when unique.
  const fallback = basenameFallback(base);
  if (fallback) {
    transformedMatches.push(fallback);
  }

  const unique = Array.from(new Set(transformedMatches)).filter((c) => {
    if (c.startsWith('pull-create/')) return false;
    // Do not redirect into archive unless the source link explicitly mentions archive.
    if (!/archive/i.test(base) && isArchivePath(c)) return false;
    return true;
  });
  if (unique.length === 0) return null;

  const best = chooseUniqueBest(unique, sourcePath);
  if (!best) return null;

  const sourceDir = path.posix.dirname(sourcePath);
  let rel = path.posix.relative(sourceDir, best);
  if (!rel || rel.length === 0) rel = '.';
  if (!rel.startsWith('.') && !rel.startsWith('/')) rel = `./${rel}`;

  // If the rewrite does not actually resolve, do not apply.
  const sanity = existingResolvedPath(path.posix.normalize(path.posix.join(sourceDir, rel)));
  if (!sanity) {
    for (const r of asWrittenRoots(rel, sourcePath)) {
      if (existingResolvedPath(r)) return `${rel}${suffix}`;
    }
    return null;
  }

  return `${rel}${suffix}`;
}

const tasks = report.tasks.filter((t) => t.type === 'fix_broken_links');
const selected = tasks.filter((t) => {
  if (onlyP1) return t.priority === 'P1';
  if (includeP2) return t.priority === 'P1' || t.priority === 'P2';
  return true;
});

const targetDocs = Array.from(new Set(selected.map((t) => t.paths[0]).filter(Boolean)));

const linkPattern = /\[([^\]]*)\]\(([^)]+)\)/g;

let filesChanged = 0;
let linksRewritten = 0;
const changeLog: Array<{ file: string; from: string; to: string }> = [];

for (const relPath of targetDocs) {
  const abs = path.join(PROJECT_ROOT, relPath);
  if (!fs.existsSync(abs)) continue;
  const original = fs.readFileSync(abs, 'utf8');
  let changed = false;

  const updated = original.replace(linkPattern, (full, text, target) => {
    const rewritten = rewriteTarget(target, relPath);
    if (!rewritten || rewritten === target) return full;
    changed = true;
    linksRewritten += 1;
    changeLog.push({ file: relPath, from: String(target), to: rewritten });
    return `[${text}](${rewritten})`;
  });

  if (changed && write) {
    fs.writeFileSync(abs, updated);
    filesChanged += 1;
  }
}

const output = {
  mode: write ? 'write' : 'dry-run',
  selectedTasks: selected.length,
  targetDocs: targetDocs.length,
  filesChanged,
  linksRewritten,
  sampleChanges: changeLog.slice(0, 100),
};

const outPath = path.join(PROJECT_ROOT, '.documentation-system/analysis/link-fix-report.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');

console.log(JSON.stringify(output, null, 2));
