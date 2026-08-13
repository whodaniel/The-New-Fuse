#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const ROOT = resolve(process.cwd());
const INPUT_AUDIT = join(ROOT, 'docs/audits/navigation-route-audit.json');
const OUTPUT_JSON = join(ROOT, 'docs/audits/all-routes-semantic-audit.json');
const OUTPUT_MD = join(ROOT, 'docs/audits/all-routes-semantic-audit.md');

const BASE_URL = (process.env.SEMANTIC_AUDIT_BASE_URL || 'https://thenewfuse.com').replace(/\/$/, '');
const TIMEOUT_MS = Number.parseInt(process.env.SEMANTIC_AUDIT_TIMEOUT_MS || '15000', 10);
const FAIL_ON_ISSUES = String(process.env.FAIL_ON_SEMANTIC_ISSUES || '1') !== '0';
const CHROMIUM_EXECUTABLE_CANDIDATES = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  process.env.CHROME_EXECUTABLE_PATH,
  process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : null,
  process.platform === 'linux' ? '/usr/bin/google-chrome' : null,
  process.platform === 'linux' ? '/usr/bin/chromium-browser' : null,
  process.platform === 'linux' ? '/usr/bin/chromium' : null,
  process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : null,
  process.platform === 'win32' ? 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' : null,
].filter(Boolean);

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
const hashText = (value) => createHash('sha1').update(normalizeText(value)).digest('hex');

const isTestableRoute = (path) => {
  if (!path || !path.startsWith('/')) return false;
  if (path.includes(':') || path.includes('*')) return false;
  if (path === '/api' || path.startsWith('/api/') || path === '/v1' || path.startsWith('/v1/')) return false;
  if (path === '/ws' || path.startsWith('/ws/')) return false;
  if (path.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|css|js|map|json|txt|xml)$/i)) return false;
  return true;
};

const resolveChromiumLaunchOptions = () => {
  const executablePath = CHROMIUM_EXECUTABLE_CANDIDATES.find((candidate) => existsSync(candidate));
  const channel = (process.env.PLAYWRIGHT_CHROMIUM_CHANNEL || process.env.PLAYWRIGHT_CHROME_CHANNEL || '').trim();
  if (executablePath) {
    console.log(`[semantic-audit] using local Chromium executable: ${executablePath}`);
    return { headless: true, executablePath };
  }
  if (channel) {
    console.log(`[semantic-audit] using Chromium channel: ${channel}`);
    return { headless: true, channel };
  }
  return { headless: true };
};

const extractFingerprint = async (page) =>
  page.evaluate(() => {
    const title = document.title || '';
    const h1 = document.querySelector('h1')?.textContent || '';
    const main = document.querySelector('main') || document.body;
    const text = (main?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24000);
    const hasAppRoot = Boolean(document.getElementById('root'));
    return { title, h1, text, hasAppRoot };
  });

const visitRoute = async (page, route) => {
  const url = `${BASE_URL}${route}`;
  let status = null;
  let error = null;
  let finalUrl = url;
  let fp = { title: '', h1: '', text: '', hasAppRoot: false };

  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_MS });
    status = response?.status() ?? null;
    try {
      await page.waitForLoadState('networkidle', { timeout: 2500 });
    } catch {
      // ignore noisy persistent connections
    }
    await page.waitForTimeout(250);
    finalUrl = page.url();
    fp = await extractFingerprint(page);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const path = (() => {
    try {
      return new URL(finalUrl).pathname;
    } catch {
      return route;
    }
  })();

  return {
    route,
    url,
    finalUrl,
    finalPath: path,
    status,
    error,
    title: fp.title,
    h1: fp.h1,
    hasAppRoot: Boolean(fp.hasAppRoot),
    fingerprint: hashText(`${fp.title}|${fp.h1}|${fp.text}`),
    textPreview: normalizeText(fp.text).slice(0, 220),
  };
};

const main = async () => {
  const startedAt = new Date().toISOString();
  const audit = readJson(INPUT_AUDIT);
  const effectiveRoutes = [...new Set(audit?.paths?.effectiveRouterPaths || [])].filter(isTestableRoute).sort();

  const browser = await chromium.launch(resolveChromiumLaunchOptions());
  const context = await browser.newContext();
  const page = await context.newPage();

  const rows = [];
  try {
    for (let i = 0; i < effectiveRoutes.length; i += 1) {
      const route = effectiveRoutes[i];
      rows.push(await visitRoute(page, route));
      if ((i + 1) % 10 === 0 || i === effectiveRoutes.length - 1) {
        console.log(`[semantic-audit] ${i + 1}/${effectiveRoutes.length} routes processed`);
      }
    }
  } finally {
    await context.close();
    await browser.close();
  }

  const root = rows.find((r) => r.route === '/');
  const rootFingerprint = root?.fingerprint || null;

  const duplicateGroups = new Map();
  for (const row of rows) {
    if (!row.fingerprint) continue;
    if (!duplicateGroups.has(row.fingerprint)) duplicateGroups.set(row.fingerprint, []);
    duplicateGroups.get(row.fingerprint).push(row.route);
  }

  const rootHasAppRoot = Boolean(root?.hasAppRoot);
  const sameAsRoot = rows.filter((row) => {
    if (row.route === '/' || !rootFingerprint || row.fingerprint !== rootFingerprint || row.finalPath === '/') {
      return false;
    }
    // When both pages mount the SPA app shell, matching fingerprints are expected.
    if (rootHasAppRoot && row.hasAppRoot) {
      return false;
    }
    return true;
  });
  const hardBroken = rows.filter((row) => !row.error && typeof row.status === 'number' && row.status >= 400);
  const networkBroken = rows.filter((row) => !!row.error);

  const summary = {
    startedAt,
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalRoutes: rows.length,
    hardBroken: hardBroken.length,
    networkBroken: networkBroken.length,
    sameAsRoot: sameAsRoot.length,
    duplicateFingerprintGroups: [...duplicateGroups.values()].filter((routes) => routes.length > 1).length,
    rootHasAppRoot,
  };

  const payload = {
    summary,
    rows,
    hardBroken,
    networkBroken,
    sameAsRoot,
    duplicateFingerprintGroups: [...duplicateGroups.entries()]
      .filter(([, routes]) => routes.length > 1)
      .map(([fingerprint, routes]) => ({ fingerprint, routes })),
  };

  mkdirSync(join(ROOT, 'docs/audits'), { recursive: true });
  writeFileSync(OUTPUT_JSON, JSON.stringify(payload, null, 2));

  const md = [
    '# All Routes Semantic Audit',
    '',
    `Generated: ${summary.generatedAt}`,
    `Base URL: ${summary.baseUrl}`,
    '',
    '## Summary',
    `- total routes tested: ${summary.totalRoutes}`,
    `- hard broken (HTTP >= 400): ${summary.hardBroken}`,
    `- network broken: ${summary.networkBroken}`,
    `- routes with same fingerprint as / (excluding SPA-shell duplicates): ${summary.sameAsRoot}`,
    `- duplicate fingerprint groups: ${summary.duplicateFingerprintGroups}`,
    '',
    '## Hard Broken',
    ...(hardBroken.length
      ? hardBroken.map((r) => `- ${r.route} -> status=${r.status} final=${r.finalUrl}`)
      : ['- none']),
    '',
    '## Network Broken',
    ...(networkBroken.length
      ? networkBroken.map((r) => `- ${r.route} -> error=${r.error}`)
      : ['- none']),
    '',
    '## Same As Root (Potential Soft-Failure)',
    ...(sameAsRoot.length
      ? sameAsRoot.map((r) => `- ${r.route} -> final=${r.finalUrl} | title=${r.title || 'n/a'} | h1=${r.h1 || 'n/a'}`)
      : ['- none']),
    '',
    '## Duplicate Fingerprint Groups',
    ...([...(payload.duplicateFingerprintGroups || [])].length
      ? payload.duplicateFingerprintGroups.map((g) => `- ${g.fingerprint}: ${g.routes.join(', ')}`)
      : ['- none']),
    '',
  ].join('\n');

  writeFileSync(OUTPUT_MD, md);
  console.log(`Wrote ${OUTPUT_JSON}`);
  console.log(`Wrote ${OUTPUT_MD}`);
  console.log(JSON.stringify(summary, null, 2));

  if (FAIL_ON_ISSUES && (hardBroken.length > 0 || networkBroken.length > 0 || sameAsRoot.length > 0)) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
