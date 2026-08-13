#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const APP_PREFIX = fs.existsSync(path.join(ROOT, 'src/ComprehensiveRouter.tsx')) ? '' : 'apps/frontend/';

const ROUTER_FILE = path.join(ROOT, `${APP_PREFIX}src/ComprehensiveRouter.tsx`);
const SIDEBAR_FILE = path.join(ROOT, `${APP_PREFIX}src/config/sidebarNavigation.ts`);
const REDIRECTS_FILE = path.join(ROOT, `${APP_PREFIX}src/config/legacyRedirects.ts`);
const OUT_DIR = path.join(ROOT, `${APP_PREFIX}docs/audits`);

function extractRouteBlocks(src) {
  const blocks = [];
  const re = /<Route\b[\s\S]*?\/>/g;
  let m;
  while ((m = re.exec(src)) !== null) blocks.push(m[0]);
  return blocks;
}

function extractPath(block) {
  const m = block.match(/path="([^"]+)"/);
  return m ? m[1] : null;
}

function extractSidebarPaths(src) {
  const out = [];
  const re = /\{[^{}]*\}/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const block = m[0];
    const name = block.match(/name:\s*'([^']+)'/)?.[1];
    const href = block.match(/href:\s*'([^']+)'/)?.[1];
    if (!name || !href) continue;
    const access = block.match(/access:\s*'([^']+)'/)?.[1] || 'authenticated';
    out.push({
      name,
      href,
      access,
    });
  }
  const dedup = new Map();
  for (const item of out) dedup.set(item.href, item);
  return [...dedup.values()].sort((a, b) => a.href.localeCompare(b.href));
}

function extractRedirectFromPaths(src) {
  const out = [];
  const re = /from:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src)) !== null) out.push(m[1]);
  return [...new Set(out)].sort();
}

function routeGuardType(block) {
  if (block.includes('RequirePermission')) return 'RequirePermission';
  if (block.includes('RequireAuth')) return 'RequireAuth';
  return 'none';
}

function main() {
  const routerSrc = fs.readFileSync(ROUTER_FILE, 'utf8');
  const sidebarSrc = fs.readFileSync(SIDEBAR_FILE, 'utf8');
  const redirectsSrc = fs.readFileSync(REDIRECTS_FILE, 'utf8');

  const sidebarItems = extractSidebarPaths(sidebarSrc);
  const redirectFromPaths = extractRedirectFromPaths(redirectsSrc);
  const routeBlocks = extractRouteBlocks(routerSrc);

  const byPath = new Map();
  for (const block of routeBlocks) {
    const p = extractPath(block);
    if (!p) continue;
    byPath.set(p, {
      path: p,
      guard: routeGuardType(block),
      usesNavigateRedirect: block.includes('Navigate to='),
    });
  }
  for (const p of redirectFromPaths) {
    if (!byPath.has(p)) {
      byPath.set(p, { path: p, guard: 'redirect', usesNavigateRedirect: true });
    }
  }

  const sidebarGuardReport = sidebarItems.map((item) => {
    const p = item.href;
    const meta = byPath.get(p);
    if (!meta) return { path: p, status: 'missing-route', guard: 'none' };

    let status = 'ok';
    if (p === '/admin' && meta.guard !== 'RequirePermission') status = 'risk-admin-unguarded';
    if (item.access !== 'public' && p !== '/' && p !== '/home' && p !== '/admin' && meta.guard === 'none') {
      status = 'review-unguarded';
    }

    return {
      path: p,
      access: item.access,
      status,
      guard: meta.guard,
      redirect: meta.usesNavigateRedirect,
    };
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    counts: {
      sidebarPaths: sidebarItems.length,
      missingRoutes: sidebarGuardReport.filter((r) => r.status === 'missing-route').length,
      adminUnguarded: sidebarGuardReport.filter((r) => r.status === 'risk-admin-unguarded').length,
      unguardedReview: sidebarGuardReport.filter((r) => r.status === 'review-unguarded').length,
    },
    sidebarGuardReport,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'route-guard-audit.json'), JSON.stringify(summary, null, 2));

  const lines = [
    '# Route Guard Audit',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    '## Counts',
    `- sidebar paths: ${summary.counts.sidebarPaths}`,
    `- missing routes: ${summary.counts.missingRoutes}`,
    `- admin unguarded risk: ${summary.counts.adminUnguarded}`,
    `- other unguarded review routes: ${summary.counts.unguardedReview}`,
    '',
    '## Sidebar Guard Report',
    ...sidebarGuardReport.map((r) =>
      `- \`${r.path}\` | access: \`${r.access ?? 'authenticated'}\` | status: \`${r.status}\` | guard: \`${r.guard}\` | redirect: \`${r.redirect ?? false}\``
    ),
    '',
  ];

  fs.writeFileSync(path.join(OUT_DIR, 'route-guard-audit.md'), `${lines.join('\n')}\n`);

  console.log(JSON.stringify(summary.counts, null, 2));
  console.log(`Wrote ${path.join(OUT_DIR, 'route-guard-audit.json')}`);
  console.log(`Wrote ${path.join(OUT_DIR, 'route-guard-audit.md')}`);
}

main();
