#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const INPUT_DIR = join(ROOT, 'reports/keyword-mentions');
const OUTPUT_JSON = join(INPUT_DIR, 'mentions-map.json');
const OUTPUT_MD = join(INPUT_DIR, 'mentions-map.md');
const OUTPUT_DELTA_JSON = join(INPUT_DIR, 'mentions-map.delta.json');
const OUTPUT_DELTA_MD = join(INPUT_DIR, 'mentions-map.delta.md');

const INPUT_FILES = [
  { scope: 'frontend-api', keyword: 'pages', file: 'frontend-api-pages.txt' },
  { scope: 'frontend-api', keyword: 'all pages', file: 'frontend-api-all-pages.txt' },
  { scope: 'frontend-api', keyword: 'sitemap', file: 'frontend-api-sitemap.txt' },
  { scope: 'frontend-api', keyword: 'mermaid', file: 'frontend-api-mermaid.txt' },
  { scope: 'frontend-api-src', keyword: 'pages', file: 'frontend-api-src-pages.txt' },
  { scope: 'frontend-api-src', keyword: 'all pages', file: 'frontend-api-src-all-pages.txt' },
  { scope: 'frontend-api-src', keyword: 'sitemap', file: 'frontend-api-src-sitemap.txt' },
  { scope: 'frontend-api-src', keyword: 'mermaid', file: 'frontend-api-src-mermaid.txt' },
];

const parseLine = (line) => {
  // format: path:line:content
  const m = line.match(/^(.+?):(\d+):(.*)$/);
  if (!m) return null;
  return { path: m[1], line: Number(m[2]), excerpt: m[3]?.trim() || '' };
};

const classifyPath = (path) => {
  if (path.includes('/src/')) return 'source';
  if (path.includes('/public/observatory/')) return 'indexed-content';
  if (path.includes('/docs/')) return 'docs';
  if (path.includes('/scripts/')) return 'scripts';
  if (path.includes('/reports/')) return 'reports';
  return 'other';
};

const relPath = (absoluteOrRel) =>
  absoluteOrRel.startsWith(ROOT) ? absoluteOrRel.slice(ROOT.length + 1) : absoluteOrRel;

const hitId = (hit) =>
  createHash('sha256')
    .update(`${hit.scope}|${hit.keyword}|${hit.path}|${hit.line}|${hit.excerpt}`)
    .digest('hex');

const loadHits = () => {
  const hits = [];
  for (const spec of INPUT_FILES) {
    const full = join(INPUT_DIR, spec.file);
    if (!existsSync(full)) continue;
    const lines = readFileSync(full, 'utf8')
      .split('\n')
      .map((line) => line.trimEnd())
      .filter(Boolean);
    for (const line of lines) {
      const parsed = parseLine(line);
      if (!parsed) continue;
      const hit = {
        scope: spec.scope,
        keyword: spec.keyword,
        path: relPath(parsed.path),
        line: parsed.line,
        excerpt: parsed.excerpt,
        classification: classifyPath(parsed.path),
      };
      hit.id = hitId(hit);
      hits.push(hit);
    }
  }
  // dedupe
  const dedup = new Map();
  for (const hit of hits) dedup.set(hit.id, hit);
  return [...dedup.values()].sort((a, b) => {
    if (a.path !== b.path) return a.path.localeCompare(b.path);
    if (a.line !== b.line) return a.line - b.line;
    return a.keyword.localeCompare(b.keyword);
  });
};

const summarize = (hits) => {
  const summary = {
    generatedAt: new Date().toISOString(),
    totalHits: hits.length,
    byScope: {},
    byKeyword: {},
    byClassification: {},
    byFile: {},
  };
  for (const hit of hits) {
    summary.byScope[hit.scope] = (summary.byScope[hit.scope] || 0) + 1;
    summary.byKeyword[hit.keyword] = (summary.byKeyword[hit.keyword] || 0) + 1;
    summary.byClassification[hit.classification] =
      (summary.byClassification[hit.classification] || 0) + 1;
    summary.byFile[hit.path] = (summary.byFile[hit.path] || 0) + 1;
  }
  return summary;
};

const loadPrevious = () => {
  if (!existsSync(OUTPUT_JSON)) return null;
  try {
    return JSON.parse(readFileSync(OUTPUT_JSON, 'utf8'));
  } catch {
    return null;
  }
};

const computeDelta = (prevHits, currHits) => {
  const prevSet = new Set(prevHits.map((hit) => hit.id));
  const currSet = new Set(currHits.map((hit) => hit.id));
  const added = currHits.filter((hit) => !prevSet.has(hit.id));
  const removed = prevHits.filter((hit) => !currSet.has(hit.id));
  return {
    generatedAt: new Date().toISOString(),
    previousCount: prevHits.length,
    currentCount: currHits.length,
    addedCount: added.length,
    removedCount: removed.length,
    added,
    removed,
  };
};

const toMd = (summary, hits) => {
  const topFiles = Object.entries(summary.byFile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25);
  return [
    '# Keyword Mentions Map',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    '## Summary',
    `- Total hits: ${summary.totalHits}`,
    ...Object.entries(summary.byScope).map(([k, v]) => `- Scope ${k}: ${v}`),
    ...Object.entries(summary.byKeyword).map(([k, v]) => `- Keyword "${k}": ${v}`),
    ...Object.entries(summary.byClassification).map(([k, v]) => `- Class ${k}: ${v}`),
    '',
    '## Top Files',
    ...topFiles.map(([file, count]) => `- ${file}: ${count}`),
    '',
    '## Sample (first 100)',
    ...hits.slice(0, 100).map((hit) => `- ${hit.path}:${hit.line} [${hit.keyword}] ${hit.excerpt}`),
    '',
  ].join('\n');
};

const deltaToMd = (delta) =>
  [
    '# Keyword Mentions Delta',
    '',
    `Generated: ${delta.generatedAt}`,
    '',
    '## Counts',
    `- Previous: ${delta.previousCount}`,
    `- Current: ${delta.currentCount}`,
    `- Added: ${delta.addedCount}`,
    `- Removed: ${delta.removedCount}`,
    '',
    '## Added (first 100)',
    ...(delta.added.length
      ? delta.added.slice(0, 100).map((hit) => `- ${hit.path}:${hit.line} [${hit.keyword}] ${hit.excerpt}`)
      : ['- none']),
    '',
    '## Removed (first 100)',
    ...(delta.removed.length
      ? delta.removed
          .slice(0, 100)
          .map((hit) => `- ${hit.path}:${hit.line} [${hit.keyword}] ${hit.excerpt}`)
      : ['- none']),
    '',
  ].join('\n');

const main = () => {
  if (!existsSync(INPUT_DIR)) {
    console.error(`Missing input directory: ${INPUT_DIR}`);
    process.exit(1);
  }
  mkdirSync(INPUT_DIR, { recursive: true });

  const prev = loadPrevious();
  const currHits = loadHits();
  const summary = summarize(currHits);

  writeFileSync(
    OUTPUT_JSON,
    JSON.stringify(
      {
        summary,
        hits: currHits,
      },
      null,
      2
    )
  );
  writeFileSync(OUTPUT_MD, toMd(summary, currHits));

  const prevHits = prev?.hits || [];
  const delta = computeDelta(prevHits, currHits);
  writeFileSync(OUTPUT_DELTA_JSON, JSON.stringify(delta, null, 2));
  writeFileSync(OUTPUT_DELTA_MD, deltaToMd(delta));

  console.log(`Wrote ${OUTPUT_JSON}`);
  console.log(`Wrote ${OUTPUT_MD}`);
  console.log(`Wrote ${OUTPUT_DELTA_JSON}`);
  console.log(`Wrote ${OUTPUT_DELTA_MD}`);
  console.log(JSON.stringify(summary, null, 2));
};

main();
