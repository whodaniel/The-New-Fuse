#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const OUTPUT_DIR = join(ROOT, 'docs/audits');
const OUTPUT_JSON = join(OUTPUT_DIR, 'all-links-audit.json');
const OUTPUT_MD = join(OUTPUT_DIR, 'all-links-audit.md');
const ROUTE_AUDIT_PATH = join(ROOT, 'docs/audits/navigation-route-audit.json');
const PUBLIC_DIR = join(ROOT, 'public');

const SOURCE_DIRS = [join(ROOT, 'src'), join(ROOT, 'public')];
const ALLOWED_SOURCE_EXT = new Set(['.tsx', '.ts', '.jsx', '.js', '.html', '.md']);

const read = (path) => readFileSync(path, 'utf8');

const walk = (dir) => {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walk(full));
      continue;
    }
    if (ALLOWED_SOURCE_EXT.has(extname(full))) out.push(full);
  }
  return out;
};

const toPosix = (path) => path.replaceAll('\\', '/');
const relToRoot = (path) => toPosix(path.replace(`${ROOT}/`, ''));

const LINK_PATTERNS = [
  /href\s*=\s*"([^"]+)"/g,
  /href\s*=\s*'([^']+)'/g,
  /to\s*=\s*"([^"]+)"/g,
  /to\s*=\s*'([^']+)'/g,
  /navigate\(\s*"([^"]+)"/g,
  /navigate\(\s*'([^']+)'/g,
  /window\.location(?:\.href)?\s*=\s*"([^"]+)"/g,
  /window\.location(?:\.href)?\s*=\s*'([^']+)'/g,
];

const extractLinks = (text) => {
  const links = [];
  for (const pattern of LINK_PATTERNS) {
    let m;
    while ((m = pattern.exec(text)) !== null) {
      links.push(m[1]);
    }
  }
  return links;
};

const normalizeLink = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (trimmed.includes('${')) return '';
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('#')
  ) {
    return trimmed;
  }
  const base = trimmed.split('?')[0]?.split('#')[0] || '';
  if (!base) return trimmed;
  return base;
};

const loadRoutes = () => {
  if (!existsSync(ROUTE_AUDIT_PATH)) {
    return { routeSet: new Set(), patterns: [] };
  }
  const audit = JSON.parse(read(ROUTE_AUDIT_PATH));
  const effective = audit?.paths?.effectiveRouterPaths || [];
  const routeSet = new Set(effective);
  const patterns = effective.filter((p) => p.includes(':') || p.endsWith('/*'));
  return { routeSet, patterns };
};

const isDynamicMatch = (routePath, linkPath) => {
  if (routePath.endsWith('/*')) {
    const prefix = routePath.slice(0, -2);
    return linkPath === prefix || linkPath.startsWith(`${prefix}/`);
  }
  const rp = routePath.split('/').filter(Boolean);
  const lp = linkPath.split('/').filter(Boolean);
  if (rp.length !== lp.length) return false;
  for (let i = 0; i < rp.length; i++) {
    if (rp[i].startsWith(':')) continue;
    if (rp[i] !== lp[i]) return false;
  }
  return true;
};

const isStaticPublicFile = (linkPath) => {
  if (!linkPath.startsWith('/')) return false;
  const full = join(PUBLIC_DIR, linkPath.slice(1));
  return existsSync(full) && statSync(full).isFile();
};

const isResolvedInternal = (linkPath, routeSet, patterns) => {
  if (routeSet.has(linkPath)) return true;
  if (isStaticPublicFile(linkPath)) return true;
  for (const pattern of patterns) {
    if (isDynamicMatch(pattern, linkPath)) return true;
  }
  return false;
};

const classify = (link, sourceFile, routeSet, patterns) => {
  if (!link) return { status: 'ignored', reason: 'empty' };
  if (
    link.startsWith('http://') ||
    link.startsWith('https://') ||
    link.startsWith('mailto:') ||
    link.startsWith('tel:')
  ) {
    return { status: 'external', reason: 'external' };
  }
  if (link.startsWith('#')) return { status: 'anchor', reason: 'anchor' };
  if (link.startsWith('/')) {
    return isResolvedInternal(link, routeSet, patterns)
      ? { status: 'ok', reason: 'internal' }
      : { status: 'broken', reason: 'missing-internal-path' };
  }

  // Relative route segments in source code (e.g. Navigate to="overview") are valid in React Router context.
  if (sourceFile.includes('/src/')) {
    return { status: 'ok', reason: 'relative-route-segment' };
  }

  // Relative links: resolve in /public for html/docs assets.
  const sourceDir = sourceFile.includes('/public/')
    ? sourceFile.slice(0, sourceFile.lastIndexOf('/'))
    : PUBLIC_DIR;
  const full = resolve(sourceDir, link);
  if (existsSync(full)) {
    const st = statSync(full);
    if (st.isFile()) {
      return { status: 'ok', reason: 'relative-file' };
    }
    if (st.isDirectory() && existsSync(join(full, 'index.html'))) {
      return { status: 'ok', reason: 'relative-directory-index' };
    }
  }
  return { status: 'broken', reason: 'missing-relative-file' };
};

const main = () => {
  const { routeSet, patterns } = loadRoutes();
  const files = SOURCE_DIRS.flatMap((dir) => walk(dir));

  const rows = [];
  for (const file of files) {
    const text = read(file);
    const links = Array.from(new Set(extractLinks(text).map(normalizeLink))).filter(Boolean);
    for (const link of links) {
      const result = classify(link, file, routeSet, patterns);
      rows.push({
        source: relToRoot(file),
        link,
        ...result,
      });
    }
  }

  const broken = rows.filter((r) => r.status === 'broken');
  const summary = {
    generatedAt: new Date().toISOString(),
    scannedFiles: files.length,
    totalLinks: rows.length,
    brokenLinks: broken.length,
    byReason: broken.reduce((acc, row) => {
      acc[row.reason] = (acc[row.reason] || 0) + 1;
      return acc;
    }, {}),
  };

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_JSON, JSON.stringify({ summary, rows, broken }, null, 2));

  const lines = [
    '# All Links Audit',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    '## Summary',
    `- scanned files: ${summary.scannedFiles}`,
    `- total links: ${summary.totalLinks}`,
    `- broken links: ${summary.brokenLinks}`,
    '',
    '## Broken Links',
    ...(broken.length
      ? broken.map((r) => `- ${r.source}: \`${r.link}\` (${r.reason})`)
      : ['- none']),
    '',
  ];
  writeFileSync(OUTPUT_MD, lines.join('\n'));

  console.log(`Wrote ${OUTPUT_JSON}`);
  console.log(`Wrote ${OUTPUT_MD}`);
  console.log(JSON.stringify(summary, null, 2));
}

main();
