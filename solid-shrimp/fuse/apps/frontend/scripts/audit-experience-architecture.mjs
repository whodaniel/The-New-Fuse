#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const APP_PREFIX = fs.existsSync(path.join(ROOT, 'src/ComprehensiveRouter.tsx'))
  ? ''
  : 'apps/frontend/';

const FILES = {
  experience: `${APP_PREFIX}src/config/experienceArchitecture.ts`,
  routeCatalog: `${APP_PREFIX}src/config/routeCatalog.ts`,
  sidebar: `${APP_PREFIX}src/config/sidebarNavigation.ts`,
};

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function extractPathsFromField(src, field) {
  const out = [];
  const re = new RegExp(`${field}:\\s*'([^']+)'`, 'g');
  let m;
  while ((m = re.exec(src)) !== null) out.push(m[1]);
  return [...new Set(out)].sort();
}

function extractProductionCanonicalExperiencePaths(src) {
  const entryRe = /{[\s\S]*?path:\s*'([^']+)'[\s\S]*?}/g;
  const out = [];
  let m;
  while ((m = entryRe.exec(src)) !== null) {
    const entry = m[0];
    const p = m[1];
    const isProduction = /lifecycle:\s*'production'/.test(entry);
    const isCanonical = /canonical:\s*true/.test(entry);
    if (isProduction && isCanonical) out.push(p);
  }
  return [...new Set(out)].sort();
}

function diff(a, b) {
  const setB = new Set(b);
  return a.filter((item) => !setB.has(item));
}

function main() {
  const experienceSrc = read(FILES.experience);
  const routeCatalogSrc = read(FILES.routeCatalog);
  const sidebarSrc = read(FILES.sidebar);

  const canonicalProduction = extractProductionCanonicalExperiencePaths(experienceSrc);
  const routeCatalogPaths = extractPathsFromField(routeCatalogSrc, 'path');
  const sidebarPaths = extractPathsFromField(sidebarSrc, 'href');

  const missingFromRouteCatalog = diff(canonicalProduction, routeCatalogPaths);
  const missingFromSidebar = diff(canonicalProduction, sidebarPaths);

  const payload = {
    generatedAt: new Date().toISOString(),
    counts: {
      canonicalProduction: canonicalProduction.length,
      routeCatalogPaths: routeCatalogPaths.length,
      sidebarPaths: sidebarPaths.length,
      missingFromRouteCatalog: missingFromRouteCatalog.length,
      missingFromSidebar: missingFromSidebar.length,
    },
    paths: {
      canonicalProduction,
      missingFromRouteCatalog,
      missingFromSidebar,
    },
  };

  const outputPrefix = APP_PREFIX || '';
  const jsonOut = path.join(ROOT, `${outputPrefix}docs/audits/experience-architecture-audit.json`);
  fs.writeFileSync(jsonOut, JSON.stringify(payload, null, 2));

  const md = [
    '# Experience Architecture Audit',
    '',
    `Generated: ${payload.generatedAt}`,
    '',
    '## Counts',
    `- canonical production surfaces: ${payload.counts.canonicalProduction}`,
    `- route catalog paths: ${payload.counts.routeCatalogPaths}`,
    `- sidebar paths: ${payload.counts.sidebarPaths}`,
    `- canonical surfaces missing from route catalog: ${payload.counts.missingFromRouteCatalog}`,
    `- canonical surfaces missing from sidebar: ${payload.counts.missingFromSidebar}`,
    '',
    '## Missing From Route Catalog',
    ...(missingFromRouteCatalog.length
      ? missingFromRouteCatalog.map((item) => `- \`${item}\``)
      : ['- none']),
    '',
    '## Missing From Sidebar',
    ...(missingFromSidebar.length ? missingFromSidebar.map((item) => `- \`${item}\``) : ['- none']),
    '',
  ].join('\n');

  const mdOut = path.join(ROOT, `${outputPrefix}docs/audits/experience-architecture-audit.md`);
  fs.writeFileSync(mdOut, md);

  console.log(`Wrote ${jsonOut}`);
  console.log(`Wrote ${mdOut}`);
  console.log(JSON.stringify(payload.counts, null, 2));

  if (missingFromRouteCatalog.length || missingFromSidebar.length) {
    process.exitCode = 1;
  }
}

main();
