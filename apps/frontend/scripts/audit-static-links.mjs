#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const AUDIT_JSON_PATH = join(ROOT, 'docs/audits/navigation-route-audit.json');
const OUTPUT_JSON = join(ROOT, 'docs/audits/static-link-audit.json');
const OUTPUT_MD = join(ROOT, 'docs/audits/static-link-audit.md');

const SOURCES = [
  { label: 'public/index.html', path: join(ROOT, 'public/index.html') },
  { label: 'public/sitemap.html', path: join(ROOT, 'public/sitemap.html') },
  { label: 'src/pages/Home.tsx', path: join(ROOT, 'src/pages/Home.tsx') },
];

const read = (path) => readFileSync(path, 'utf8');

const extractLinks = (text) => {
  const links = [];
  const patterns = [
    /href="(\/[^"]+)"/g,
    /to="(\/[^"]+)"/g,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      links.push(match[1]);
    }
  }
  return links;
};

const normalize = (path) => {
  if (!path) return '/';
  const clean = path.split('?')[0]?.split('#')[0] || '/';
  if (!clean.startsWith('/')) return `/${clean}`;
  return clean;
};

const isDynamicMatch = (routePath, linkPath) => {
  if (routePath.endsWith('/*')) {
    const prefix = routePath.slice(0, -2);
    return linkPath === prefix || linkPath.startsWith(`${prefix}/`);
  }
  const routeParts = routePath.split('/').filter(Boolean);
  const linkParts = linkPath.split('/').filter(Boolean);
  if (routeParts.length !== linkParts.length) return false;
  for (let i = 0; i < routeParts.length; i++) {
    if (routeParts[i].startsWith(':')) continue;
    if (routeParts[i] !== linkParts[i]) return false;
  }
  return true;
};

const isRoutable = (linkPath, routeSet, routePatterns) => {
  if (routeSet.has(linkPath)) return true;
  for (const pattern of routePatterns) {
    if (isDynamicMatch(pattern, linkPath)) return true;
  }
  return false;
};

const main = () => {
  if (!existsSync(AUDIT_JSON_PATH)) {
    throw new Error(`Missing route audit file: ${AUDIT_JSON_PATH}`);
  }

  const routeAudit = JSON.parse(read(AUDIT_JSON_PATH));
  const effectiveRoutes = new Set(routeAudit?.paths?.effectiveRouterPaths || []);
  const routePatterns = Array.from(effectiveRoutes).filter((p) => p.includes(':') || p.endsWith('/*'));

  const allRows = [];
  for (const source of SOURCES) {
    if (!existsSync(source.path)) continue;
    const content = read(source.path);
    const links = Array.from(new Set(extractLinks(content).map(normalize))).sort();
    for (const link of links) {
      const internal = link.startsWith('/');
      const hasFileExtension = /\.[a-z0-9]+$/i.test(link);
      const allowedSpecial =
        link.startsWith('/api/') ||
        link.startsWith('/visualizations/') ||
        hasFileExtension;
      const status = !internal || allowedSpecial || isRoutable(link, effectiveRoutes, routePatterns);
      allRows.push({
        source: source.label,
        link,
        status: status ? 'ok' : 'missing',
      });
    }
  }

  const missing = allRows.filter((r) => r.status === 'missing');
  const summary = {
    generatedAt: new Date().toISOString(),
    totalLinks: allRows.length,
    missingLinks: missing.length,
    missingBySource: SOURCES.map((s) => ({
      source: s.label,
      missing: missing.filter((m) => m.source === s.label).length,
    })),
  };

  mkdirSync(join(ROOT, 'docs/audits'), { recursive: true });
  writeFileSync(OUTPUT_JSON, JSON.stringify({ summary, rows: allRows, missing }, null, 2));

  const md = [
    '# Static Link Audit',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    '## Summary',
    `- total links: ${summary.totalLinks}`,
    `- missing links: ${summary.missingLinks}`,
    '',
    '## Missing By Source',
    ...summary.missingBySource.map((m) => `- ${m.source}: ${m.missing}`),
    '',
    '## Missing Links',
    ...(missing.length
      ? missing.map((m) => `- ${m.source}: \`${m.link}\``)
      : ['- none']),
    '',
  ].join('\n');

  writeFileSync(OUTPUT_MD, md);

  console.log(`Wrote ${OUTPUT_JSON}`);
  console.log(`Wrote ${OUTPUT_MD}`);
  console.log(JSON.stringify(summary, null, 2));
};

main();
