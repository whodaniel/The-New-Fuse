#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const APP_PREFIX = fs.existsSync(path.join(ROOT, 'src/ComprehensiveRouter.tsx'))
  ? ''
  : 'apps/frontend/';

const FILES = {
  router: `${APP_PREFIX}src/ComprehensiveRouter.tsx`,
  allPages: `${APP_PREFIX}src/config/routeCatalog.ts`,
  canonicalSidebar: `${APP_PREFIX}src/config/sidebarNavigation.ts`,
  legacyRedirects: `${APP_PREFIX}src/config/legacyRedirects.ts`,
  legacySidebars: [
    `${APP_PREFIX}src/components/Sidebar/PremiumSidebar.tsx`,
    `${APP_PREFIX}src/components/layout/Sidebar.tsx`,
    `${APP_PREFIX}src/components/layout/Sidebar/index.tsx`,
  ],
};

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function uniqueSorted(arr) {
  return [...new Set(arr)].sort();
}

function extractRouterPaths(src) {
  const out = [];
  const re = /<Route\s+path="([^"]+)"/g;
  let m;
  while ((m = re.exec(src)) !== null) out.push(m[1]);
  return uniqueSorted(out);
}

function extractRedirectFromPaths(src) {
  const out = [];
  const re = /from:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src)) !== null) out.push(m[1]);
  return uniqueSorted(out);
}

function extractAllPagesPaths(src) {
  const out = [];
  const re = /path:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src)) !== null) out.push(m[1]);
  return uniqueSorted(out);
}

function extractSidebarPaths(src) {
  const out = [];
  const hrefRe = /href:\s*'([^']+)'/g;
  const pathRe = /path:\s*'([^']+)'/g;
  let m;
  while ((m = hrefRe.exec(src)) !== null) out.push(m[1]);
  while ((m = pathRe.exec(src)) !== null) out.push(m[1]);
  return out;
}

function diff(a, b) {
  const bSet = new Set(b);
  return a.filter((x) => !bSet.has(x));
}

function toSection(title, items) {
  const lines = [`## ${title}`];
  if (!items.length) {
    lines.push('- none');
    return lines.join('\n');
  }
  return lines.concat(items.map((i) => `- \`${i}\``)).join('\n');
}

function main() {
  const routerSrc = read(FILES.router);
  const allPagesSrc = read(FILES.allPages);

  const routerPaths = extractRouterPaths(routerSrc);
  const redirectFromPaths = extractRedirectFromPaths(read(FILES.legacyRedirects));
  const effectiveRouterPaths = uniqueSorted([...routerPaths, ...redirectFromPaths]);
  const allPagesPaths = extractAllPagesPaths(allPagesSrc);

  const sidebarByFile = {};
  for (const file of FILES.legacySidebars) {
    sidebarByFile[file] = uniqueSorted(extractSidebarPaths(read(file)));
  }
  const canonicalSidebarPaths = uniqueSorted(extractSidebarPaths(read(FILES.canonicalSidebar)));
  const legacySidebarPaths = uniqueSorted(Object.values(sidebarByFile).flat());
  const sidebarPaths = uniqueSorted([...canonicalSidebarPaths, ...legacySidebarPaths]);

  const canonicalSidebarNotInRouter = diff(canonicalSidebarPaths, effectiveRouterPaths);
  const sidebarNotInRouter = diff(sidebarPaths, effectiveRouterPaths);
  const allPagesNotInRouter = diff(allPagesPaths, effectiveRouterPaths);
  const routerNotInAllPages = diff(routerPaths.filter((p) => p !== '*'), allPagesPaths);

  const payload = {
    generatedAt: new Date().toISOString(),
    counts: {
      routerPaths: routerPaths.length,
      redirectFromPaths: redirectFromPaths.length,
      effectiveRouterPaths: effectiveRouterPaths.length,
      allPagesPaths: allPagesPaths.length,
      canonicalSidebarPaths: canonicalSidebarPaths.length,
      canonicalSidebarNotInRouter: canonicalSidebarNotInRouter.length,
      sidebarPaths: sidebarPaths.length,
      sidebarNotInRouter: sidebarNotInRouter.length,
      allPagesNotInRouter: allPagesNotInRouter.length,
      routerNotInAllPages: routerNotInAllPages.length,
    },
    paths: {
      routerPaths,
      redirectFromPaths,
      effectiveRouterPaths,
      allPagesPaths,
      canonicalSidebarPaths,
      canonicalSidebarNotInRouter,
      sidebarPaths,
      sidebarByFile,
      sidebarNotInRouter,
      allPagesNotInRouter,
      routerNotInAllPages,
    },
  };

  const outputPrefix = APP_PREFIX || '';
  const jsonOut = path.join(ROOT, `${outputPrefix}docs/audits/navigation-route-audit.json`);
  fs.writeFileSync(jsonOut, JSON.stringify(payload, null, 2));

  const md = [
    '# Navigation and Route Audit',
    '',
    `Generated: ${payload.generatedAt}`,
    '',
    '## Counts',
    `- router paths: ${payload.counts.routerPaths}`,
    `- legacy redirect from-paths: ${payload.counts.redirectFromPaths}`,
    `- effective router paths (router + redirects): ${payload.counts.effectiveRouterPaths}`,
    `- all-pages paths: ${payload.counts.allPagesPaths}`,
    `- canonical sidebar paths: ${payload.counts.canonicalSidebarPaths}`,
    `- canonical sidebar paths not in router: ${payload.counts.canonicalSidebarNotInRouter}`,
    `- sidebar paths: ${payload.counts.sidebarPaths}`,
    `- sidebar paths not in router: ${payload.counts.sidebarNotInRouter}`,
    `- all-pages paths not in router: ${payload.counts.allPagesNotInRouter}`,
    `- router paths not in all-pages: ${payload.counts.routerNotInAllPages}`,
    '',
    toSection('Canonical Sidebar Paths Not In Router', canonicalSidebarNotInRouter),
    '',
    toSection('Sidebar Paths Not In Router', sidebarNotInRouter),
    '',
    toSection('All Pages Paths Not In Router', allPagesNotInRouter),
    '',
    toSection('Router Paths Not In All Pages', routerNotInAllPages),
    '',
  ].join('\n');

  const mdOut = path.join(ROOT, `${outputPrefix}docs/audits/navigation-route-audit.md`);
  fs.writeFileSync(mdOut, md);

  console.log(`Wrote ${jsonOut}`);
  console.log(`Wrote ${mdOut}`);
  console.log(JSON.stringify(payload.counts, null, 2));
}

main();
