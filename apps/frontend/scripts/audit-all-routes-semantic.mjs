#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium, firefox } from 'playwright';

const ROOT = resolve(process.cwd());
const INPUT_AUDIT = join(ROOT, 'docs/audits/navigation-route-audit.json');
const OUTPUT_JSON = join(ROOT, 'docs/audits/all-routes-semantic-audit.json');
const OUTPUT_MD = join(ROOT, 'docs/audits/all-routes-semantic-audit.md');

const BASE_URL = (process.env.SEMANTIC_AUDIT_BASE_URL || 'https://thenewfuse.com').replace(/\/$/, '');
const TIMEOUT_MS = Number.parseInt(process.env.SEMANTIC_AUDIT_TIMEOUT_MS || '15000', 10);
const FAIL_ON_ISSUES = String(process.env.FAIL_ON_SEMANTIC_ISSUES || '1') !== '0';
const PLAYWRIGHT_HEADLESS = String(process.env.PLAYWRIGHT_HEADLESS || '1') !== '0';
const PLAYWRIGHT_BROWSER_CHANNEL = (process.env.PLAYWRIGHT_BROWSER_CHANNEL || '').trim();
const PLAYWRIGHT_ENABLE_FIREFOX_FALLBACK = String(process.env.PLAYWRIGHT_ENABLE_FIREFOX_FALLBACK || '1') !== '0';
const PLAYWRIGHT_LAUNCH_RETRIES = Math.max(1, Number.parseInt(process.env.PLAYWRIGHT_LAUNCH_RETRIES || '4', 10));
const PLAYWRIGHT_LAUNCH_DELAY_MS = Math.max(0, Number.parseInt(process.env.PLAYWRIGHT_LAUNCH_DELAY_MS || '900', 10));

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
const hashText = (value) => createHash('sha1').update(normalizeText(value)).digest('hex');

const parseExtraHeaders = () => {
  if (!PLAYWRIGHT_EXTRA_HEADERS_JSON) return null;
  try {
    const parsed = JSON.parse(PLAYWRIGHT_EXTRA_HEADERS_JSON);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('must be a JSON object');
    }
    const entries = Object.entries(parsed).map(([key, value]) => [String(key), String(value)]);
    return Object.fromEntries(entries);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`PLAYWRIGHT_EXTRA_HEADERS_JSON parse failed: ${message}`);
  }
};

const buildContextOptions = () => {
  const options = {};
  if (PLAYWRIGHT_STORAGE_STATE) {
    if (!existsSync(PLAYWRIGHT_STORAGE_STATE)) {
      throw new Error(`PLAYWRIGHT_STORAGE_STATE file not found: ${PLAYWRIGHT_STORAGE_STATE}`);
    }
    options.storageState = PLAYWRIGHT_STORAGE_STATE;
  }
  const extraHTTPHeaders = parseExtraHeaders();
  if (extraHTTPHeaders) {
    options.extraHTTPHeaders = extraHTTPHeaders;
  }
  return options;
};

const isTestableRoute = (path) => {
  if (!path || !path.startsWith('/')) return false;
  if (path.includes(':') || path.includes('*')) return false;
  if (path === '/api' || path.startsWith('/api/') || path === '/v1' || path.startsWith('/v1/')) return false;
  if (path === '/ws' || path.startsWith('/ws/')) return false;
  if (path.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|css|js|map|json|txt|xml)$/i)) return false;
  return true;
};

const extractFingerprint = async (page) =>
  page.evaluate(() => {
    const title = document.title || '';
    const h1 = document.querySelector('h1')?.textContent || '';
    const main = document.querySelector('main') || document.body;
    const text = (main?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24000);
    return { title, h1, text };
  });

const stripHtml = (value) =>
  String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const extractFingerprintFromHtml = (html) => {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const text = stripHtml(html).slice(0, 24000);
  return {
    title: stripHtml(titleMatch?.[1] || ''),
    h1: stripHtml(h1Match?.[1] || ''),
    text,
  };
};

const withTimeout = async (promiseFactory, ms, label) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  try {
    return await promiseFactory(controller.signal);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${label}: ${message}`);
  } finally {
    clearTimeout(timeoutId);
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const launchAuditBrowser = async () => {
  const attempts = [];
  const strategies = [];

  if (PLAYWRIGHT_BROWSER_CHANNEL) {
    strategies.push({
      name: `channel:${PLAYWRIGHT_BROWSER_CHANNEL}`,
      launch: () =>
        chromium.launch({
          headless: PLAYWRIGHT_HEADLESS,
          channel: PLAYWRIGHT_BROWSER_CHANNEL,
        }),
    });
  }

  strategies.push({
    name: 'bundled-chromium',
    launch: () =>
      chromium.launch({
        headless: PLAYWRIGHT_HEADLESS,
      }),
  });

  if (PLAYWRIGHT_ENABLE_FIREFOX_FALLBACK) {
    strategies.push({
      name: 'bundled-firefox',
      launch: () =>
        firefox.launch({
          headless: PLAYWRIGHT_HEADLESS,
        }),
    });
  }

  for (const strategy of strategies) {
    for (let attempt = 1; attempt <= PLAYWRIGHT_LAUNCH_RETRIES; attempt += 1) {
      try {
        const browser = await strategy.launch();
        console.log(`[semantic-audit] browser strategy: ${strategy.name} (attempt ${attempt}/${PLAYWRIGHT_LAUNCH_RETRIES})`);
        return browser;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        attempts.push(`- ${strategy.name} attempt ${attempt}/${PLAYWRIGHT_LAUNCH_RETRIES}: ${message}`);
        if (attempt < PLAYWRIGHT_LAUNCH_RETRIES) {
          await sleep(PLAYWRIGHT_LAUNCH_DELAY_MS);
        }
      }
    }
  }

  throw new Error(`Unable to launch Playwright browser\n${attempts.join('\n')}`);
};

const visitRoute = async (page, route) => {
  const url = `${BASE_URL}${route}`;
  let status = null;
  let error = null;
  let finalUrl = url;
  let fp = { title: '', h1: '', text: '' };

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
    fingerprint: hashText(`${fp.title}|${fp.h1}|${fp.text}`),
    textPreview: normalizeText(fp.text).slice(0, 220),
  };
};

const visitRouteWithHttpFallback = async (route) => {
  const url = `${BASE_URL}${route}`;
  let status = null;
  let error = null;
  let finalUrl = url;
  let fp = { title: '', h1: '', text: '' };

  try {
    const response = await withTimeout(
      (signal) =>
        fetch(url, {
          method: 'GET',
          redirect: 'follow',
          signal,
          headers: { 'user-agent': 'TNF-Semantic-Audit/2.0' },
        }),
      TIMEOUT_MS,
      'semantic-fetch-timeout'
    );
    status = response.status;
    finalUrl = response.url || url;
    fp = extractFingerprintFromHtml(await response.text());
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
    fingerprint: hashText(`${fp.title}|${fp.h1}|${fp.text}`),
    textPreview: normalizeText(fp.text).slice(0, 220),
  };
};

const main = async () => {
  const startedAt = new Date().toISOString();
  const audit = readJson(INPUT_AUDIT);
  const effectiveRoutes = [...new Set(audit?.paths?.effectiveRouterPaths || [])].filter(isTestableRoute).sort();

  let browser = null;
  let context = null;
  let page = null;
  let visit = null;

  try {
    browser = await launchAuditBrowser();
    context = await browser.newContext();
    page = await context.newPage();
    visit = (route) => visitRoute(page, route);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[semantic-audit] falling back to HTTP checker: ${message}`);
    visit = (route) => visitRouteWithHttpFallback(route);
  }

  const rows = [];
  try {
    for (let i = 0; i < effectiveRoutes.length; i += 1) {
      const route = effectiveRoutes[i];
      rows.push(await visit(route));
      if ((i + 1) % 10 === 0 || i === effectiveRoutes.length - 1) {
        console.log(`[semantic-audit] ${i + 1}/${effectiveRoutes.length} routes processed`);
      }
    }
  } finally {
    if (context) {
      await context.close();
    }
    if (browser) {
      await browser.close();
    }
  }

  const root = rows.find((r) => r.route === '/');
  const rootFingerprint = root?.fingerprint || null;

  const duplicateGroups = new Map();
  for (const row of rows) {
    if (!row.fingerprint) continue;
    if (!duplicateGroups.has(row.fingerprint)) duplicateGroups.set(row.fingerprint, []);
    duplicateGroups.get(row.fingerprint).push(row.route);
  }

  const sameAsRoot = rows.filter(
    (row) => row.route !== '/' && rootFingerprint && row.fingerprint === rootFingerprint && row.finalPath !== '/'
  );
  const hardBroken = rows.filter((row) => !row.error && typeof row.status === 'number' && row.status >= 400);
  const networkBroken = rows.filter((row) => !!row.error);

  const summary = {
    startedAt,
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    crawlAuth: {
      storageStateEnabled: Boolean(PLAYWRIGHT_STORAGE_STATE),
      extraHeadersEnabled: Boolean(PLAYWRIGHT_EXTRA_HEADERS_JSON),
    },
    totalRoutes: rows.length,
    hardBroken: hardBroken.length,
    networkBroken: networkBroken.length,
    sameAsRoot: sameAsRoot.length,
    duplicateFingerprintGroups: [...duplicateGroups.values()].filter((routes) => routes.length > 1).length,
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
    `- routes with same content fingerprint as /: ${summary.sameAsRoot}`,
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
