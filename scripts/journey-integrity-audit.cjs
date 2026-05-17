#!/usr/bin/env node

/**
 * Journey Integrity Audit
 *
 * Deterministic smoke audit for TNF SaaS:
 * 1) Route-surface consistency (router vs catalog vs sidebar)
 * 2) HTTP sweep of all non-dynamic catalog routes
 * 3) API contract probes for endpoints that block core journeys
 *
 * Outputs:
 * - output/playwright/journey-integrity-audit.json
 * - output/playwright/journey-integrity-audit.md
 */

const fs = require('node:fs');
const path = require('node:path');

const APP_BASE_URL = process.env.JOURNEY_APP_BASE_URL || 'https://app.thenewfuse.com';
const API_BASE_URL = process.env.JOURNEY_API_BASE_URL || 'https://api.thenewfuse.com';
const MAX_HTTP_CONCURRENCY = Number(process.env.JOURNEY_HTTP_CONCURRENCY || 8);
const STRICT_MODE =
  process.argv.includes('--strict') ||
  String(process.env.JOURNEY_STRICT || '')
    .trim()
    .toLowerCase() === '1' ||
  String(process.env.JOURNEY_STRICT || '')
    .trim()
    .toLowerCase() === 'true';

const ROOT = process.cwd();
const FRONTEND_ROOT = fs.existsSync(path.join(ROOT, 'apps/frontend'))
  ? path.join(ROOT, 'apps/frontend')
  : ROOT;

const FILES = {
  router: path.join(FRONTEND_ROOT, 'src/ComprehensiveRouter.tsx'),
  routeCatalog: path.join(FRONTEND_ROOT, 'src/config/routeCatalog.ts'),
  sidebarNav: path.join(FRONTEND_ROOT, 'src/config/sidebarNavigation.ts'),
  frontendSrc: path.join(FRONTEND_ROOT, 'src'),
};

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function uniq(arr) {
  return [...new Set(arr)];
}

function extractRegex(text, re) {
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) out.push(m[1]);
  return out;
}

function normalizePath(p) {
  return p.trim();
}

function normalizeRouteKey(p) {
  const trimmed = normalizePath(p);
  const withoutQuery = trimmed.split('?')[0].split('#')[0];
  if (withoutQuery.length > 1 && withoutQuery.endsWith('/')) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery;
}

function isComparableRoutePath(p) {
  const key = normalizeRouteKey(p);
  if (!key || key === '*') return false;
  // API contract paths are audited separately; route parity compares navigation surfaces.
  if (key.startsWith('/api/')) return false;
  return true;
}

function nonDynamic(pathname) {
  return !pathname.includes(':') && !pathname.includes('*');
}

function markdownSection(title, lines) {
  return [`## ${title}`, ...lines, ''].join('\n');
}

function walkFiles(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build') {
        continue;
      }
      walkFiles(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

function extractRouteSurfaces() {
  const routerText = readText(FILES.router);
  const catalogText = readText(FILES.routeCatalog);
  const sidebarText = readText(FILES.sidebarNav);

  const routerPaths = uniq(
    extractRegex(routerText, /<Route\s+path="([^"]+)"/g).map(normalizePath).filter(Boolean)
  );
  const catalogPaths = uniq(
    extractRegex(catalogText, /path:\s*'([^']+)'/g).map(normalizePath).filter(Boolean)
  );
  const sidebarPaths = uniq(
    extractRegex(sidebarText, /href:\s*'([^']+)'/g).map(normalizePath).filter(Boolean)
  );

  const comparableRouterPaths = routerPaths.filter(isComparableRoutePath);
  const comparableCatalogPaths = catalogPaths.filter(isComparableRoutePath);
  const comparableSidebarPaths = sidebarPaths.filter(isComparableRoutePath);

  const routerKeySet = new Set(comparableRouterPaths.map(normalizeRouteKey));
  const catalogKeySet = new Set(comparableCatalogPaths.map(normalizeRouteKey));

  const catalogNotInRouter = comparableCatalogPaths
    .filter((p) => !routerKeySet.has(normalizeRouteKey(p)))
    .sort();
  const routerNotInCatalog = comparableRouterPaths
    .filter((p) => !catalogKeySet.has(normalizeRouteKey(p)))
    .sort();
  const sidebarNotInRouter = comparableSidebarPaths
    .filter((p) => !routerKeySet.has(normalizeRouteKey(p)))
    .sort();

  return {
    routerPaths,
    catalogPaths,
    sidebarPaths,
    catalogNotInRouter,
    routerNotInCatalog,
    sidebarNotInRouter,
  };
}

async function sweepRoutes(routes) {
  const queue = routes.slice();
  const rows = [];

  const worker = async () => {
    for (;;) {
      const route = queue.shift();
      if (!route) return;
      const url = `${APP_BASE_URL}${route}`;
      try {
        const res = await fetch(url, { redirect: 'follow' });
        const body = await res.text();
        const lower = body.toLowerCase();
        rows.push({
          route,
          url,
          status: res.status,
          finalUrl: res.url,
          bodyBytes: body.length,
          flags: {
            react185: lower.includes('minified react error #185'),
            somethingWentWrong: lower.includes('something went wrong'),
            signInShell:
              lower.includes('new cloudflare-ready auth flow') && lower.includes('sign in'),
            notFoundShell: lower.includes('404') && lower.includes('not found'),
          },
        });
      } catch (error) {
        rows.push({
          route,
          url,
          status: null,
          finalUrl: null,
          bodyBytes: 0,
          flags: {
            react185: false,
            somethingWentWrong: false,
            signInShell: false,
            notFoundShell: false,
          },
          error: String(error),
        });
      }
    }
  };

  const workerCount = Math.max(1, Math.min(MAX_HTTP_CONCURRENCY, routes.length));
  await Promise.all(Array.from({ length: workerCount }, worker));
  rows.sort((a, b) => a.route.localeCompare(b.route));
  return rows;
}

async function probeApiContracts() {
  const probes = [
    {
      name: 'App auth compat login',
      url: `${APP_BASE_URL}/api/auth/login`,
      method: 'POST',
      body: { email: 'invalid@example.com', password: 'invalid-password' },
      expectNot404: true,
    },
    {
      name: 'App auth canonical login',
      url: `${APP_BASE_URL}/api/v1/auth/login`,
      method: 'POST',
      body: { email: 'invalid@example.com', password: 'invalid-password' },
      expectNot404: true,
    },
    {
      name: 'Gateway auth canonical login',
      url: `${API_BASE_URL}/api/v1/auth/login`,
      method: 'POST',
      body: { email: 'invalid@example.com', password: 'invalid-password' },
      expectNot404: true,
    },
    { name: 'App agents list', url: `${APP_BASE_URL}/api/agents`, expectNot404: true },
    {
      name: 'App agent template bank',
      url: `${APP_BASE_URL}/api/agents/bank/templates`,
      expectNot404: true,
    },
    { name: 'API workspaces list', url: `${API_BASE_URL}/api/workspaces`, expectNot404: true },
    {
      name: 'API current workspace',
      url: `${API_BASE_URL}/api/workspaces/current`,
      expectNot404: true,
    },
    {
      name: 'API resources templates',
      url: `${API_BASE_URL}/api/resources/templates`,
      expectNot404: true,
    },
    {
      name: 'API marketplace catalog',
      url: `${API_BASE_URL}/api/marketplace/catalog?status=published`,
      expectNot404: true,
    },
  ];

  const out = [];
  for (const probe of probes) {
    const init = {
      method: probe.method || 'GET',
      headers: {
        accept: 'application/json',
      },
    };
    if (probe.body) {
      init.headers['content-type'] = 'application/json';
      init.body = JSON.stringify(probe.body);
    }

    try {
      const res = await fetch(probe.url, init);
      const text = await res.text();
      out.push({
        ...probe,
        status: res.status,
        ok: probe.expectNot404 ? res.status !== 404 : true,
        snippet: text.slice(0, 220).replace(/\n/g, ' '),
      });
    } catch (error) {
      out.push({
        ...probe,
        status: null,
        ok: false,
        snippet: String(error),
      });
    }
  }

  return out;
}

function countFrontendReferences(target) {
  const files = walkFiles(FILES.frontendSrc).filter((f) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(f));
  let count = 0;
  const matches = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const idx = text.indexOf(target);
    if (idx !== -1) {
      count += 1;
      matches.push(path.relative(ROOT, file));
    }
  }
  return { count, files: matches.slice(0, 20) };
}

async function main() {
  if (!fs.existsSync(FILES.router) || !fs.existsSync(FILES.routeCatalog)) {
    throw new Error('Cannot find frontend route files. Run from repo root.');
  }

  const surfaces = extractRouteSurfaces();
  const sweepTargets = surfaces.catalogPaths.filter(nonDynamic).sort();
  const routeRows = await sweepRoutes(sweepTargets);
  const apiRows = await probeApiContracts();

  const badRoutes = routeRows.filter((r) => r.status !== 200 || r.flags.somethingWentWrong || r.flags.react185);
  const api404 = apiRows.filter((r) => r.status === 404);
  const apiFail = apiRows.filter((r) => !r.ok);

  const dependencyRefs = {
    '/api/agents': countFrontendReferences('/api/agents'),
    '/api/agents/bank/templates': countFrontendReferences('/api/agents/bank/templates'),
    '/workspaces': countFrontendReferences('/workspaces'),
    '/resources/templates': countFrontendReferences('/resources/templates'),
    '/marketplace/catalog': countFrontendReferences('/marketplace/catalog'),
    '/api/auth/login': countFrontendReferences('/api/auth/login'),
  };

  const summary = {
    generatedAt: new Date().toISOString(),
    appBaseUrl: APP_BASE_URL,
    apiBaseUrl: API_BASE_URL,
    routeSurface: {
      routerCount: surfaces.routerPaths.length,
      catalogCount: surfaces.catalogPaths.length,
      sidebarCount: surfaces.sidebarPaths.length,
      catalogNotInRouter: surfaces.catalogNotInRouter.length,
      routerNotInCatalog: surfaces.routerNotInCatalog.length,
      sidebarNotInRouter: surfaces.sidebarNotInRouter.length,
    },
    httpSweep: {
      totalRoutes: routeRows.length,
      ok200: routeRows.filter((r) => r.status === 200).length,
      non200: routeRows.filter((r) => r.status !== 200).length,
      react185Pages: routeRows.filter((r) => r.flags.react185).length,
      somethingWentWrongPages: routeRows.filter((r) => r.flags.somethingWentWrong).length,
      signInShellPages: routeRows.filter((r) => r.flags.signInShell).length,
    },
    apiContracts: {
      total: apiRows.length,
      failed: apiFail.length,
      notFound: api404.length,
    },
  };

  const payload = {
    summary,
    routeSurface: surfaces,
    routeRows,
    badRoutes,
    apiRows,
    dependencyRefs,
  };

  const outDir = path.join(ROOT, 'output/playwright');
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'journey-integrity-audit.json');
  const mdPath = path.join(outDir, 'journey-integrity-audit.md');
  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2));

  const md = [
    '# Journey Integrity Audit',
    '',
    `Generated: ${summary.generatedAt}`,
    `App Base: ${APP_BASE_URL}`,
    `API Base: ${API_BASE_URL}`,
    '',
    markdownSection('Summary', [
      `- Route surface mismatch: catalog-not-in-router=${summary.routeSurface.catalogNotInRouter}, router-not-in-catalog=${summary.routeSurface.routerNotInCatalog}, sidebar-not-in-router=${summary.routeSurface.sidebarNotInRouter}`,
      `- Route HTTP sweep: total=${summary.httpSweep.totalRoutes}, 200=${summary.httpSweep.ok200}, non-200=${summary.httpSweep.non200}`,
      `- Fatal shell markers: react185=${summary.httpSweep.react185Pages}, something-went-wrong=${summary.httpSweep.somethingWentWrongPages}`,
      `- Auth gate shell pages detected=${summary.httpSweep.signInShellPages}`,
      `- API contract probes: total=${summary.apiContracts.total}, failed=${summary.apiContracts.failed}, 404=${summary.apiContracts.notFound}`,
    ]),
    markdownSection(
      'Route Surface Drift (Top)',
      [
        ...surfaces.sidebarNotInRouter.slice(0, 20).map((p) => `- Sidebar not in router: \`${p}\``),
        ...surfaces.catalogNotInRouter.slice(0, 20).map((p) => `- Catalog not in router: \`${p}\``),
        ...surfaces.routerNotInCatalog.slice(0, 20).map((p) => `- Router not in catalog: \`${p}\``),
      ].slice(0, 60)
    ),
    markdownSection(
      'API Contract Failures',
      apiFail.length
        ? apiFail.map(
            (p) => `- ${p.name}: status=${p.status ?? 'ERR'} url=\`${p.url}\` snippet=\`${p.snippet}\``
          )
        : ['- none']
    ),
    markdownSection(
      'Non-200 Routes',
      badRoutes.length
        ? badRoutes.slice(0, 60).map((r) => `- \`${r.route}\` status=${r.status} final=\`${r.finalUrl}\``)
        : ['- none']
    ),
    markdownSection(
      'Broken Endpoint Usage Footprint',
      Object.entries(dependencyRefs).map(
        ([endpoint, data]) =>
          `- \`${endpoint}\`: referenced in ${data.count} frontend files${
            data.files.length ? ` (e.g. ${data.files.slice(0, 5).map((f) => `\`${f}\``).join(', ')})` : ''
          }`
      )
    ),
  ].join('\n');

  fs.writeFileSync(mdPath, `${md}\n`);

  const gateFailures = [];
  if (summary.routeSurface.catalogNotInRouter > 0) {
    gateFailures.push(`catalog-not-in-router=${summary.routeSurface.catalogNotInRouter}`);
  }
  if (summary.routeSurface.routerNotInCatalog > 0) {
    gateFailures.push(`router-not-in-catalog=${summary.routeSurface.routerNotInCatalog}`);
  }
  if (summary.routeSurface.sidebarNotInRouter > 0) {
    gateFailures.push(`sidebar-not-in-router=${summary.routeSurface.sidebarNotInRouter}`);
  }
  if (summary.httpSweep.non200 > 0) {
    gateFailures.push(`non-200-routes=${summary.httpSweep.non200}`);
  }
  if (summary.httpSweep.react185Pages > 0) {
    gateFailures.push(`react185-pages=${summary.httpSweep.react185Pages}`);
  }
  if (summary.httpSweep.somethingWentWrongPages > 0) {
    gateFailures.push(`something-went-wrong-pages=${summary.httpSweep.somethingWentWrongPages}`);
  }
  if (summary.apiContracts.failed > 0) {
    gateFailures.push(`api-contract-failures=${summary.apiContracts.failed}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: gateFailures.length === 0,
        strictMode: STRICT_MODE,
        gateFailures,
        summary,
        jsonPath,
        mdPath,
      },
      null,
      2
    )
  );

  if (STRICT_MODE && gateFailures.length > 0) {
    process.exit(2);
  }
}

main().catch((error) => {
  console.error('Journey integrity audit failed:', error);
  process.exit(1);
});
