#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const APP_PREFIX = fs.existsSync(path.join(ROOT, 'src/ComprehensiveRouter.tsx')) ? '' : 'apps/frontend/';
const SRC = path.join(ROOT, `${APP_PREFIX}src`);
const ROUTER_FILE = path.join(ROOT, `${APP_PREFIX}src/ComprehensiveRouter.tsx`);
const SIDEBAR_FILE = path.join(ROOT, `${APP_PREFIX}src/config/sidebarNavigation.ts`);
const REDIRECTS_FILE = path.join(ROOT, `${APP_PREFIX}src/config/legacyRedirects.ts`);
const OUT_DIR = path.join(ROOT, `${APP_PREFIX}docs/audits`);

const checks = [
  { id: 'mock_data', re: /\bMOCK_[A-Z0-9_]*\b|\bmock[A-Za-z0-9_]*\b|dummyData|sampleData/g, weight: 3 },
  { id: 'fallback_demo', re: /fallback|for now|coming soon|not implemented|demo response/gi, weight: 2 },
  { id: 'randomized_behavior', re: /Math\.random\(/g, weight: 2 },
  { id: 'timeout_simulation', re: /setTimeout\(/g, weight: 1 },
  { id: 'raw_fetch', re: /fetch\(/g, weight: 1 },
];

function readFile(rel) {
  const abs = path.join(SRC, rel);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, 'utf8');
}

function extractSidebarItems(src) {
  const out = [];
  const re = /\{[^{}]*\}/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const block = m[0];
    const name = block.match(/name:\s*'([^']+)'/)?.[1];
    const href = block.match(/href:\s*'([^']+)'/)?.[1];
    if (!name || !href) continue;
    out.push({ name, href });
  }
  const dedup = new Map();
  for (const item of out) dedup.set(item.href, item);
  return [...dedup.values()].sort((a, b) => a.href.localeCompare(b.href));
}

function extractRedirectMap(src) {
  const out = new Map();
  const re = /from:\s*'([^']+)'\s*,\s*to:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src)) !== null) out.set(m[1], m[2]);
  return out;
}

function extractImportMap(src) {
  const importMap = new Map();
  const directImportRe = /^import\s+([A-Za-z0-9_]+)\s+from\s+'([^']+)'/gm;
  let m;
  while ((m = directImportRe.exec(src)) !== null) importMap.set(m[1], m[2]);

  const lazyImportRe = /^const\s+([A-Za-z0-9_]+)\s*=\s*lazy\(\(\)\s*=>\s*import\('([^']+)'/gm;
  while ((m = lazyImportRe.exec(src)) !== null) importMap.set(m[1], m[2]);

  return importMap;
}

function extractRouteMap(src, importMap) {
  const out = new Map();
  const wrappers = new Set(['Route', 'RequireAuth', 'RequirePermission', 'Navigate', 'LoadingFallback']);
  const routeBlocks = [];
  const lines = src.split('\n');
  let collecting = false;
  let blockLines = [];

  for (const line of lines) {
    if (!collecting && line.includes('<Route')) {
      collecting = true;
      blockLines = [line];
      if (line.trim().endsWith('/>')) {
        routeBlocks.push(blockLines.join('\n'));
        collecting = false;
      }
      continue;
    }

    if (!collecting) continue;
    blockLines.push(line);
    if (line.trim() === '/>') {
      routeBlocks.push(blockLines.join('\n'));
      collecting = false;
      blockLines = [];
    }
  }

  for (const block of routeBlocks) {
    const routePath = block.match(/path="([^"]+)"/)?.[1];
    if (!routePath) continue;

    const tagMatches = [...block.matchAll(/<([A-Z][A-Za-z0-9_]*)\b/g)].map((x) => x[1]);
    const componentName = tagMatches.find((name) => !wrappers.has(name));
    if (!componentName) continue;

    const importPath = importMap.get(componentName);
    if (!importPath) continue;
    out.set(routePath, {
      componentName,
      importPath,
    });
  }
  return out;
}

function resolveImportFile(importPath) {
  const base = importPath.replace(/^\.\//, '');
  const hasKnownExtension = /\.(tsx|ts|jsx|js)$/.test(base);
  const candidates = [
    base,
    `${base}.tsx`,
    `${base}.ts`,
    `${base}/index.tsx`,
    `${base}/index.ts`,
    `${base}.jsx`,
    `${base}/index.jsx`,
  ];
  if (hasKnownExtension) candidates.unshift(base);
  for (const rel of candidates) {
    const abs = path.join(SRC, rel);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return rel;
  }
  return null;
}

function score(content) {
  let risk = 0;
  const hits = [];
  for (const check of checks) {
    const matches = content.match(check.re);
    const count = matches ? matches.length : 0;
    if (count > 0) {
      risk += count * check.weight;
      hits.push({ id: check.id, count });
    }
  }

  let status = 'working';
  if (risk >= 12) status = 'partial-high-risk';
  else if (risk >= 5) status = 'partial-medium-risk';

  return { risk, status, hits };
}

function main() {
  const routerSrc = fs.readFileSync(ROUTER_FILE, 'utf8');
  const sidebarSrc = fs.readFileSync(SIDEBAR_FILE, 'utf8');
  const redirectsSrc = fs.readFileSync(REDIRECTS_FILE, 'utf8');

  const sidebarItems = extractSidebarItems(sidebarSrc);
  const redirectMap = extractRedirectMap(redirectsSrc);
  const importMap = extractImportMap(routerSrc);
  const routeMap = extractRouteMap(routerSrc, importMap);

  const pages = sidebarItems.map((item) => {
    const targetRoute = redirectMap.get(item.href) || item.href;
    const routeTarget = routeMap.get(targetRoute);
    const file = routeTarget ? resolveImportFile(routeTarget.importPath) : null;
    return {
      name: item.name,
      route: item.href,
      targetRoute,
      component: routeTarget?.componentName || null,
      file,
      surface: targetRoute.startsWith('/admin') ? 'admin' : 'app',
    };
  });

  const results = pages.map((page) => {
    if (!page.file) {
      return {
        ...page,
        status: 'broken-missing-route-or-file',
        risk: 999,
        hits: [{ id: 'missing_route_or_file', count: 1 }],
      };
    }
    const content = readFile(page.file);
    if (!content) {
      return { ...page, status: 'broken-missing-file', risk: 999, hits: [{ id: 'missing_file', count: 1 }] };
    }
    const s = score(content);
    return { ...page, ...s };
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    counts: {
      total: results.length,
      working: results.filter((r) => r.status === 'working').length,
      partialMedium: results.filter((r) => r.status === 'partial-medium-risk').length,
      partialHigh: results.filter((r) => r.status === 'partial-high-risk').length,
      broken: results.filter((r) => r.status.startsWith('broken-')).length,
    },
    results,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'sidebar-page-health-audit.json'), JSON.stringify(summary, null, 2));

  const lines = [
    '# Sidebar Page Health Audit',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    '## Counts',
    `- total: ${summary.counts.total}`,
    `- working: ${summary.counts.working}`,
    `- partial-medium-risk: ${summary.counts.partialMedium}`,
    `- partial-high-risk: ${summary.counts.partialHigh}`,
    `- broken: ${summary.counts.broken}`,
    '',
    '## Page Results',
  ];

  for (const r of results.sort((a, b) => b.risk - a.risk)) {
    const hitText = r.hits.map((h) => `${h.id}:${h.count}`).join(', ') || 'none';
    lines.push(
      `- \`${r.route}\` -> target \`${r.targetRoute}\` -> \`${r.file ?? '<missing>'}\` | status: \`${r.status}\` | risk: ${r.risk} | hits: ${hitText}`
    );
  }

  fs.writeFileSync(path.join(OUT_DIR, 'sidebar-page-health-audit.md'), `${lines.join('\n')}\n`);

  console.log(JSON.stringify(summary.counts, null, 2));
  console.log(`Wrote ${path.join(OUT_DIR, 'sidebar-page-health-audit.json')}`);
  console.log(`Wrote ${path.join(OUT_DIR, 'sidebar-page-health-audit.md')}`);
}

main();
