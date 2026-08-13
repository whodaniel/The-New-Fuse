#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const APP_PREFIX = fs.existsSync(path.join(ROOT, 'src/ComprehensiveRouter.tsx'))
  ? ''
  : 'apps/frontend/';

const FILES = {
  router: `${APP_PREFIX}src/ComprehensiveRouter.tsx`,
  sidebar: `${APP_PREFIX}src/config/sidebarNavigation.ts`,
  routeCatalog: `${APP_PREFIX}src/config/routeCatalog.ts`,
  redirects: `${APP_PREFIX}src/config/legacyRedirects.ts`,
  openapiCandidates: APP_PREFIX
    ? ['openapi.yaml', '../../openapi.yaml']
    : ['openapi.yaml', '../../openapi.yaml'],
};
const STRICT_MODE = process.argv.includes('--strict') || process.env.PARITY_STRICT === '1';

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function resolveExistingPath(candidates) {
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(ROOT, candidate))) {
      return candidate;
    }
  }
  return null;
}

function unique(values) {
  return [...new Set(values)];
}

function uniqueSorted(values) {
  return unique(values).sort((a, b) => a.localeCompare(b));
}

function extractRoutePaths(source) {
  const values = [];
  const routeRegex = /<Route\s+path=(["'])([^"']+)\1/g;
  let match;
  while ((match = routeRegex.exec(source)) !== null) {
    values.push(match[2]);
  }
  return uniqueSorted(values);
}

function extractConfigPaths(source, fieldName) {
  const values = [];
  const regex = new RegExp(`${fieldName}\\s*:\\s*(['"])([^'"]+)\\1`, 'g');
  let match;
  while ((match = regex.exec(source)) !== null) {
    values.push(match[2]);
  }
  return uniqueSorted(values);
}

function extractLegacyRedirectPairs(source) {
  const fromValues = extractConfigPaths(source, 'from');
  const toValues = extractConfigPaths(source, 'to');
  const pairRegex = /\{\s*from:\s*(['"])([^'"]+)\1\s*,\s*to:\s*(['"])([^'"]+)\3\s*\}/g;
  const pairs = [];
  let match;
  while ((match = pairRegex.exec(source)) !== null) {
    pairs.push({ from: match[2], to: match[4] });
  }
  return {
    fromValues,
    toValues,
    pairs,
  };
}

function isDynamicPath(value) {
  return value.includes(':') || value.includes('*');
}

function isStaticPath(value) {
  return !isDynamicPath(value);
}

function extractOpenApiPaths(source) {
  const values = [];
  const lines = source.split('\n');
  let inPaths = false;

  for (const line of lines) {
    if (!inPaths) {
      if (/^paths:\s*$/.test(line)) {
        inPaths = true;
      }
      continue;
    }

    if (/^[A-Za-z0-9_-]+:\s*$/.test(line)) {
      break;
    }

    const pathMatch = line.match(/^ {2}(\/[^:]*):\s*$/);
    if (pathMatch) {
      values.push(pathMatch[1]);
    }
  }

  return uniqueSorted(values);
}

function classifyExposure(pathValue, ctx) {
  if (ctx.sidebarSet.has(pathValue)) return 'primary-nav';
  if (ctx.redirectFromSet.has(pathValue)) return 'legacy-alias';
  if (ctx.redirectToSet.has(pathValue)) return 'redirect-target-only';
  if (ctx.routerAllSet.has(pathValue)) return 'hidden-route';
  if (ctx.catalogSet.has(pathValue)) return 'catalog-only';
  return 'unknown';
}

function classifyRisk(pathValue, exposure, ctx) {
  const dynamic = isDynamicPath(pathValue);
  const prefix = `/${(pathValue.split('/')[1] || '').toLowerCase()}`;

  if (exposure === 'primary-nav') return 'low';
  if (exposure === 'legacy-alias') return 'low';
  if (exposure === 'redirect-target-only') return 'medium';

  // Dynamic detail routes are often intentionally contextual entry points.
  if (dynamic && (exposure === 'hidden-route' || exposure === 'catalog-only')) {
    return 'medium';
  }

  // Auth surfaces are intentionally excluded from primary app navigation.
  if (prefix === '/auth') {
    return 'medium';
  }

  if (exposure === 'catalog-only') return 'high';
  if (exposure === 'hidden-route') {
    if (['/admin', '/auth', '/agents', '/dashboard', '/workflows'].includes(prefix)) {
      return 'high';
    }
    return 'medium';
  }
  return ctx.routerAllSet.has(pathValue) ? 'medium' : 'high';
}

function toSection(title, rows, render) {
  const header = [`## ${title}`];
  if (!rows.length) return header.concat(['- none']).join('\n');
  return header.concat(rows.map(render)).join('\n');
}

function groupByPrefix(paths) {
  const counters = new Map();
  for (const pathValue of paths) {
    const prefix = `/${pathValue.split('/')[1] || ''}`;
    counters.set(prefix, (counters.get(prefix) || 0) + 1);
  }
  return [...counters.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([prefix, count]) => ({ prefix, count }));
}

function main() {
  const routerSource = read(FILES.router);
  const sidebarSource = read(FILES.sidebar);
  const routeCatalogSource = read(FILES.routeCatalog);
  const redirectsSource = read(FILES.redirects);
  const openApiPath = resolveExistingPath(FILES.openapiCandidates);
  const openApiSource = openApiPath ? read(openApiPath) : '';

  const routerPaths = extractRoutePaths(routerSource);
  const sidebarPaths = extractConfigPaths(sidebarSource, 'href');
  const catalogPaths = extractConfigPaths(routeCatalogSource, 'path');
  const redirectData = extractLegacyRedirectPairs(redirectsSource);
  const openApiPaths = openApiSource ? extractOpenApiPaths(openApiSource) : [];

  const staticRouterPaths = routerPaths.filter(isStaticPath);
  const dynamicRouterPaths = routerPaths.filter(isDynamicPath);

  const routerSet = new Set(staticRouterPaths);
  const routerAllSet = new Set(routerPaths);
  const sidebarSet = new Set(sidebarPaths);
  const catalogSet = new Set(catalogPaths);
  const redirectFromSet = new Set(redirectData.fromValues);
  const redirectToSet = new Set(redirectData.toValues);

  const effectiveAccessibleSet = new Set([
    ...sidebarPaths,
    ...redirectData.fromValues,
    ...redirectData.toValues,
  ]);

  const allKnownPaths = uniqueSorted([
    ...staticRouterPaths,
    ...sidebarPaths,
    ...catalogPaths,
    ...redirectData.fromValues,
    ...redirectData.toValues,
  ]);

  const hiddenRoutes = staticRouterPaths.filter((route) => !effectiveAccessibleSet.has(route));
  const sidebarWithoutRouter = sidebarPaths.filter((route) => !routerSet.has(route));
  const catalogOnlyRoutes = catalogPaths.filter(
    (route) => !routerAllSet.has(route) && !redirectFromSet.has(route)
  );

  const routeLedger = allKnownPaths.map((pathValue) => {
    const exposure = classifyExposure(pathValue, {
      sidebarSet,
      redirectFromSet,
      redirectToSet,
      routerAllSet,
      catalogSet,
    });
    const risk = classifyRisk(pathValue, exposure, { routerAllSet });
    const legacyRedirectTarget =
      redirectData.pairs.find((pair) => pair.from === pathValue)?.to || null;

    return {
      path: pathValue,
      inRouter: routerSet.has(pathValue),
      inSidebar: sidebarSet.has(pathValue),
      inRouteCatalog: catalogSet.has(pathValue),
      isLegacyAlias: redirectFromSet.has(pathValue),
      isLegacyTarget: redirectToSet.has(pathValue),
      legacyRedirectTarget,
      exposure,
      risk,
    };
  });

  const highRiskRows = routeLedger.filter((row) => row.risk === 'high');
  const hiddenByPrefix = groupByPrefix(hiddenRoutes);
  const highRiskByPrefix = groupByPrefix(highRiskRows.map((row) => row.path));

  const summary = {
    routerStaticRoutes: staticRouterPaths.length,
    routerDynamicRoutes: dynamicRouterPaths.length,
    sidebarRoutes: sidebarPaths.length,
    legacyAliasRoutes: redirectData.fromValues.length,
    legacyTargetRoutes: redirectData.toValues.length,
    hiddenRoutes: hiddenRoutes.length,
    sidebarWithoutRouter: sidebarWithoutRouter.length,
    catalogOnlyRoutes: catalogOnlyRoutes.length,
    openApiPaths: openApiPaths.length,
    highRiskRoutes: highRiskRows.length,
  };

  const payload = {
    generatedAt: new Date().toISOString(),
    summary,
    hiddenByPrefix,
    highRiskByPrefix,
    checks: {
      noSidebarOrphans: sidebarWithoutRouter.length === 0,
      noCatalogOrphans: catalogOnlyRoutes.length === 0,
      hiddenRoutesCount: hiddenRoutes.length,
      catalogOnlyRoutesCount: catalogOnlyRoutes.length,
      highRiskRoutesCount: highRiskRows.length,
    },
    paths: {
      routerStatic: staticRouterPaths,
      routerDynamic: dynamicRouterPaths,
      sidebar: sidebarPaths,
      legacyRedirectFrom: redirectData.fromValues,
      legacyRedirectTo: redirectData.toValues,
      catalog: catalogPaths,
      hiddenRoutes,
      sidebarWithoutRouter,
      catalogOnlyRoutes,
      openApi: openApiPaths,
      openApiPath: openApiPath || null,
    },
    routeLedger,
  };

  const outputPrefix = APP_PREFIX || '';
  const outDir = path.join(ROOT, `${outputPrefix}docs/audits`);
  fs.mkdirSync(outDir, { recursive: true });

  const jsonOut = path.join(outDir, 'feature-parity-ledger.json');
  fs.writeFileSync(jsonOut, JSON.stringify(payload, null, 2));

  const md = [
    '# Feature Parity Ledger',
    '',
    `Generated: ${payload.generatedAt}`,
    '',
    '## Summary',
    `- Router static routes: ${summary.routerStaticRoutes}`,
    `- Router dynamic routes: ${summary.routerDynamicRoutes}`,
    `- Sidebar routes: ${summary.sidebarRoutes}`,
    `- Legacy alias routes: ${summary.legacyAliasRoutes}`,
    `- Hidden routes: ${summary.hiddenRoutes}`,
    `- High risk routes: ${summary.highRiskRoutes}`,
    `- Sidebar routes without router target: ${summary.sidebarWithoutRouter}`,
    `- Catalog-only routes (not in router): ${summary.catalogOnlyRoutes}`,
    `- OpenAPI paths (global): ${summary.openApiPaths}`,
    '',
    '## Gates',
    `- noSidebarOrphans: ${payload.checks.noSidebarOrphans}`,
    `- noCatalogOrphans: ${payload.checks.noCatalogOrphans}`,
    `- hiddenRoutesCount: ${payload.checks.hiddenRoutesCount}`,
    `- catalogOnlyRoutesCount: ${payload.checks.catalogOnlyRoutesCount}`,
    `- highRiskRoutesCount: ${payload.checks.highRiskRoutesCount}`,
    '',
    toSection('High Risk Routes (Top 100)', highRiskRows.slice(0, 100), (row) => {
      return `- \`${row.path}\` | exposure=\`${row.exposure}\` | legacyTarget=\`${row.legacyRedirectTarget || '-'}\``;
    }),
    '',
    toSection('Hidden Routes By Prefix', hiddenByPrefix, (entry) => {
      return `- \`${entry.prefix}\`: ${entry.count}`;
    }),
    '',
    toSection('High Risk Routes By Prefix', highRiskByPrefix, (entry) => {
      return `- \`${entry.prefix}\`: ${entry.count}`;
    }),
    '',
    toSection('Sidebar Routes Without Router Target', sidebarWithoutRouter, (value) => {
      return `- \`${value}\``;
    }),
    '',
    toSection('Catalog-only Routes (Not In Router)', catalogOnlyRoutes, (value) => {
      return `- \`${value}\``;
    }),
    '',
  ].join('\n');

  const mdOut = path.join(outDir, 'feature-parity-ledger.md');
  fs.writeFileSync(mdOut, md);

  console.log(`Wrote ${jsonOut}`);
  console.log(`Wrote ${mdOut}`);
  console.log(JSON.stringify(summary, null, 2));

  if (STRICT_MODE) {
    const failures = [];
    if (!payload.checks.noSidebarOrphans) {
      failures.push(
        `sidebarWithoutRouter=${payload.summary.sidebarWithoutRouter} (must be 0 in strict mode)`
      );
    }
    if (!payload.checks.noCatalogOrphans) {
      failures.push(
        `catalogOnlyRoutes=${payload.summary.catalogOnlyRoutes} (must be 0 in strict mode)`
      );
    }
    if (payload.checks.highRiskRoutesCount > 0) {
      failures.push(
        `highRiskRoutes=${payload.checks.highRiskRoutesCount} (must be 0 in strict mode)`
      );
    }

    if (failures.length > 0) {
      console.error('Strict parity gate failed.');
      failures.forEach((failure) => console.error(`- ${failure}`));
      process.exit(1);
    }

    console.log('Strict parity gate passed.');
  }
}

main();
