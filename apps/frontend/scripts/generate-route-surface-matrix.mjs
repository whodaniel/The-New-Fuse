#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const APP_PREFIX = fs.existsSync(path.join(ROOT, 'src/config/sidebarNavigation.ts'))
  ? ''
  : 'apps/frontend/';

const FILES = {
  parityLedger: `${APP_PREFIX}docs/audits/feature-parity-ledger.json`,
  sidebar: `${APP_PREFIX}src/config/sidebarNavigation.ts`,
  routeCatalog: `${APP_PREFIX}src/config/routeCatalog.ts`,
  redirects: `${APP_PREFIX}src/config/legacyRedirects.ts`,
};

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function readJson(relPath) {
  return JSON.parse(read(relPath));
}

function addMultiValue(map, key, value) {
  if (!map.has(key)) {
    map.set(key, new Set());
  }
  map.get(key).add(value);
}

function toSortedArray(setOrValues) {
  return [...setOrValues].sort((a, b) => a.localeCompare(b));
}

function isDynamicPath(value) {
  return value.includes(':') || value.includes('*');
}

function extractSidebarLabels(source) {
  const labelsByPath = new Map();
  const pairRegex = /name\s*:\s*(['"])([^'"]+)\1\s*,\s*href\s*:\s*(['"])([^'"]+)\3/g;
  let match;
  while ((match = pairRegex.exec(source)) !== null) {
    const name = match[2];
    const href = match[4];
    addMultiValue(labelsByPath, href, name);
  }
  return labelsByPath;
}

function extractCatalogLabels(source) {
  const labelsByPath = new Map();
  const pairRegex = /name\s*:\s*(['"])([^'"]+)\1\s*,\s*path\s*:\s*(['"])([^'"]+)\3/g;
  let match;
  while ((match = pairRegex.exec(source)) !== null) {
    const name = match[2];
    const routePath = match[4];
    addMultiValue(labelsByPath, routePath, name);
  }
  return labelsByPath;
}

function extractLegacyRedirectMap(source) {
  const redirects = new Map();
  const pairRegex = /\{\s*from:\s*(['"])([^'"]+)\1\s*,\s*to:\s*(['"])([^'"]+)\3\s*\}/g;
  let match;
  while ((match = pairRegex.exec(source)) !== null) {
    redirects.set(match[2], match[4]);
  }
  return redirects;
}

function classifyExposure(row) {
  if (row.inSidebar) return 'primary-nav';
  if (row.isLegacyAlias) return 'legacy-alias';
  if (row.isLegacyTarget) return 'redirect-target-only';
  if (row.inRouter) return 'hidden-route';
  if (row.inRouteCatalog) return 'catalog-only';
  return 'unknown';
}

function classifyRisk(row) {
  const prefix = `/${(row.path.split('/')[1] || '').toLowerCase()}`;

  if (row.exposure === 'primary-nav') return 'low';
  if (row.exposure === 'legacy-alias') return 'low';
  if (row.exposure === 'redirect-target-only') return 'medium';

  if (row.isDynamic && (row.exposure === 'hidden-route' || row.exposure === 'catalog-only')) {
    return 'medium';
  }

  if (prefix === '/auth') return 'medium';
  if (row.exposure === 'catalog-only') return 'high';

  if (row.exposure === 'hidden-route') {
    if (['/admin', '/auth', '/agents', '/dashboard', '/workflows'].includes(prefix)) {
      return 'high';
    }
    return 'medium';
  }

  return row.inRouter ? 'medium' : 'high';
}

function bool(value) {
  return value ? 'yes' : 'no';
}

function mapCounts(rows, key) {
  const counts = new Map();
  for (const row of rows) {
    const value = row[key];
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function compactList(values) {
  if (values.length === 0) return '-';
  return values.join(', ');
}

function toMarkdownTable(rows) {
  const header = [
    '| Path | Exposure | Risk | Router | Sidebar | Catalog | Legacy | Sidebar Labels | Catalog Labels |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];

  const body = rows.map((row) => {
    const legacy = row.isLegacyAlias
      ? `alias -> ${row.legacyRedirectTarget || '-'}`
      : row.isLegacyTarget
        ? 'target'
        : '-';

    return [
      `| \`${row.path}\``,
      `\`${row.exposure}\``,
      `\`${row.risk}\``,
      bool(row.inRouter),
      bool(row.inSidebar),
      bool(row.inRouteCatalog),
      legacy,
      compactList(row.sidebarLabels),
      compactList(row.catalogLabels),
      '|',
    ].join(' ');
  });

  return header.concat(body).join('\n');
}

function main() {
  const parityPath = path.join(ROOT, FILES.parityLedger);
  if (!fs.existsSync(parityPath)) {
    throw new Error(
      `Missing parity ledger at ${FILES.parityLedger}. Run audit:parity-ledger first.`
    );
  }

  const parity = readJson(FILES.parityLedger);
  const sidebarSource = read(FILES.sidebar);
  const routeCatalogSource = read(FILES.routeCatalog);
  const redirectsSource = read(FILES.redirects);

  const sidebarLabelsByPath = extractSidebarLabels(sidebarSource);
  const catalogLabelsByPath = extractCatalogLabels(routeCatalogSource);
  const redirectMap = extractLegacyRedirectMap(redirectsSource);
  const legacyTargetSet = new Set(redirectMap.values());

  const routeLedger = Array.isArray(parity.routeLedger) ? parity.routeLedger : [];
  const dynamicRouterPaths = Array.isArray(parity.paths?.routerDynamic) ? parity.paths.routerDynamic : [];

  const ledgerByPath = new Map(routeLedger.map((row) => [row.path, row]));

  const allPaths = new Set(routeLedger.map((row) => row.path));
  dynamicRouterPaths.forEach((value) => allPaths.add(value));
  for (const value of sidebarLabelsByPath.keys()) allPaths.add(value);
  for (const value of catalogLabelsByPath.keys()) allPaths.add(value);
  for (const value of redirectMap.keys()) allPaths.add(value);
  for (const value of legacyTargetSet) allPaths.add(value);

  const rows = toSortedArray(allPaths).map((pathValue) => {
    const parityRow = ledgerByPath.get(pathValue);
    const isDynamic = isDynamicPath(pathValue);

    const row = {
      path: pathValue,
      inRouter: Boolean(parityRow?.inRouter || dynamicRouterPaths.includes(pathValue)),
      inSidebar: Boolean(parityRow?.inSidebar || sidebarLabelsByPath.has(pathValue)),
      inRouteCatalog: Boolean(parityRow?.inRouteCatalog || catalogLabelsByPath.has(pathValue)),
      isLegacyAlias: Boolean(parityRow?.isLegacyAlias || redirectMap.has(pathValue)),
      isLegacyTarget: Boolean(parityRow?.isLegacyTarget || legacyTargetSet.has(pathValue)),
      legacyRedirectTarget: parityRow?.legacyRedirectTarget || redirectMap.get(pathValue) || null,
      exposure: parityRow?.exposure || 'unknown',
      risk: parityRow?.risk || 'medium',
      isDynamic,
      sidebarLabels: sidebarLabelsByPath.has(pathValue)
        ? toSortedArray(sidebarLabelsByPath.get(pathValue))
        : [],
      catalogLabels: catalogLabelsByPath.has(pathValue)
        ? toSortedArray(catalogLabelsByPath.get(pathValue))
        : [],
    };

    if (!parityRow) {
      row.exposure = classifyExposure(row);
      row.risk = classifyRisk(row);
    }

    return row;
  });

  const exposureCounts = mapCounts(rows, 'exposure');
  const riskCounts = mapCounts(rows, 'risk');
  const highRiskRows = rows.filter((row) => row.risk === 'high');
  const unknownRows = rows.filter((row) => row.exposure === 'unknown');

  const summary = {
    totalPaths: rows.length,
    dynamicPaths: rows.filter((row) => row.isDynamic).length,
    primaryNavPaths: rows.filter((row) => row.exposure === 'primary-nav').length,
    hiddenPaths: rows.filter((row) => row.exposure === 'hidden-route').length,
    catalogOnlyPaths: rows.filter((row) => row.exposure === 'catalog-only').length,
    legacyAliasPaths: rows.filter((row) => row.isLegacyAlias).length,
    highRiskPaths: highRiskRows.length,
    unknownPaths: unknownRows.length,
  };

  const payload = {
    generatedAt: new Date().toISOString(),
    parityGeneratedAt: parity.generatedAt || null,
    parityChecks: parity.checks || null,
    summary,
    counts: {
      exposure: exposureCounts,
      risk: riskCounts,
    },
    highRiskPaths: highRiskRows.map((row) => row.path),
    unknownPaths: unknownRows.map((row) => row.path),
    rows,
  };

  const outputPrefix = APP_PREFIX || '';
  const outDir = path.join(ROOT, `${outputPrefix}docs/audits`);
  fs.mkdirSync(outDir, { recursive: true });

  const jsonOut = path.join(outDir, 'route-surface-matrix.json');
  fs.writeFileSync(jsonOut, JSON.stringify(payload, null, 2));

  const md = [
    '# Route Surface Matrix',
    '',
    `Generated: ${payload.generatedAt}`,
    `Parity snapshot: ${payload.parityGeneratedAt || 'n/a'}`,
    '',
    '## Summary',
    `- Total paths: ${summary.totalPaths}`,
    `- Dynamic paths: ${summary.dynamicPaths}`,
    `- Primary navigation paths: ${summary.primaryNavPaths}`,
    `- Hidden routed paths: ${summary.hiddenPaths}`,
    `- Catalog-only paths: ${summary.catalogOnlyPaths}`,
    `- Legacy aliases: ${summary.legacyAliasPaths}`,
    `- High risk paths: ${summary.highRiskPaths}`,
    `- Unknown exposure paths: ${summary.unknownPaths}`,
    '',
    '## Parity Gate Snapshot',
    `- noSidebarOrphans: ${payload.parityChecks?.noSidebarOrphans ?? 'n/a'}`,
    `- noCatalogOrphans: ${payload.parityChecks?.noCatalogOrphans ?? 'n/a'}`,
    `- highRiskRoutesCount: ${payload.parityChecks?.highRiskRoutesCount ?? 'n/a'}`,
    `- hiddenRoutesCount: ${payload.parityChecks?.hiddenRoutesCount ?? 'n/a'}`,
    '',
    '## Exposure Counts',
    ...exposureCounts.map((entry) => `- \`${entry.label}\`: ${entry.count}`),
    '',
    '## Risk Counts',
    ...riskCounts.map((entry) => `- \`${entry.label}\`: ${entry.count}`),
    '',
    '## High Risk Paths',
    ...(highRiskRows.length === 0
      ? ['- none']
      : highRiskRows.map((row) => `- \`${row.path}\` (exposure=\`${row.exposure}\`)`)),
    '',
    '## Matrix',
    toMarkdownTable(rows),
    '',
  ].join('\n');

  const mdOut = path.join(outDir, 'route-surface-matrix.md');
  fs.writeFileSync(mdOut, md);

  console.log(`Wrote ${jsonOut}`);
  console.log(`Wrote ${mdOut}`);
  console.log(JSON.stringify(summary, null, 2));
}

main();
