#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const ROOT = resolve(process.cwd());
const OUTPUT_DIR = join(ROOT, 'docs/audits');
const OUTPUT_JSON = join(OUTPUT_DIR, 'live-link-crawl.json');
const OUTPUT_MD = join(OUTPUT_DIR, 'live-link-crawl.md');

const SEEDS = (
  process.env.LIVE_AUDIT_SEEDS ||
  'https://ai-arcade.xyz/,https://poker.ai-arcade.xyz/,https://ai-arcade-poker.pages.dev/,https://thenewfuse.com/'
)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const MAX_DEPTH = Number.parseInt(process.env.LIVE_AUDIT_MAX_DEPTH || '5', 10);
const MAX_PAGES_PER_DOMAIN = Number.parseInt(process.env.LIVE_AUDIT_MAX_PAGES || '350', 10);
const MAX_EXTERNAL_CHECKS_PER_DOMAIN = Number.parseInt(
  process.env.LIVE_AUDIT_MAX_EXTERNAL || '300',
  10
);
const NAV_TIMEOUT_MS = Number.parseInt(process.env.LIVE_AUDIT_NAV_TIMEOUT_MS || '35000', 10);
const FETCH_TIMEOUT_MS = Number.parseInt(process.env.LIVE_AUDIT_FETCH_TIMEOUT_MS || '20000', 10);
const FAIL_ON_BROKEN = String(process.env.FAIL_ON_BROKEN || '1') !== '0';
const CHROMIUM_EXECUTABLE_CANDIDATES = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  process.env.CHROME_EXECUTABLE_PATH,
  process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : null,
  process.platform === 'linux' ? '/usr/bin/google-chrome' : null,
  process.platform === 'linux' ? '/usr/bin/chromium-browser' : null,
  process.platform === 'linux' ? '/usr/bin/chromium' : null,
  process.platform === 'win32'
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : null,
  process.platform === 'win32'
    ? 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    : null,
].filter(Boolean);

const skipHref = (href) => {
  if (!href) return true;
  const trimmed = href.trim();
  return (
    !trimmed ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('javascript:')
  );
};

const resolveChromiumLaunchOptions = () => {
  const executablePath = CHROMIUM_EXECUTABLE_CANDIDATES.find((candidate) => existsSync(candidate));
  const channel = (
    process.env.PLAYWRIGHT_CHROMIUM_CHANNEL ||
    process.env.PLAYWRIGHT_CHROME_CHANNEL ||
    ''
  ).trim();
  if (executablePath) {
    console.log(`[live-link-audit] using local Chromium executable: ${executablePath}`);
    return { headless: true, executablePath };
  }
  if (channel) {
    console.log(`[live-link-audit] using Chromium channel: ${channel}`);
    return { headless: true, channel };
  }
  return { headless: true };
};

const normalizeUrl = (value) => {
  const url = new URL(value);
  url.hash = '';
  return url.toString();
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

const normalizeText = (value) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
const textHash = (value) => createHash('sha1').update(normalizeText(value)).digest('hex');

const checkHttp = async (url) => {
  try {
    const response = await withTimeout(
      (signal) =>
        fetch(url, {
          method: 'GET',
          redirect: 'follow',
          signal,
          headers: { 'user-agent': 'TNF-Link-Auditor/2.0' },
        }),
      FETCH_TIMEOUT_MS,
      'fetch-timeout'
    );
    return {
      status: response.status,
      ok: response.ok,
      finalUrl: response.url,
      error: null,
    };
  } catch (error) {
    return {
      status: null,
      ok: false,
      finalUrl: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

const extractLinksFromPage = async (page, pageUrl) => {
  const anchors = await page.$$eval('a[href]', (nodes) =>
    nodes.map((node) => ({
      href: node.getAttribute('href') || '',
      text: (node.textContent || '').trim().slice(0, 160),
    }))
  );

  const out = [];
  for (const anchor of anchors) {
    const raw = anchor.href.trim();
    if (skipHref(raw)) continue;
    let absoluteUrl;
    try {
      absoluteUrl = normalizeUrl(new URL(raw, pageUrl).toString());
    } catch {
      continue;
    }
    out.push({ url: absoluteUrl, text: anchor.text || '' });
  }
  return out;
};

const extractPageFingerprint = async (page) =>
  page.evaluate(() => {
    const title = document.title || '';
    const h1 = document.querySelector('h1')?.textContent || '';
    const main = document.querySelector('main') || document.body;
    const bodyText = (main?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 20000);
    return {
      title,
      h1,
      bodyText,
    };
  });

const crawlDomain = async (browser, seed) => {
  const domain = new URL(seed).host;
  const normalizedSeed = normalizeUrl(seed);
  const queue = [{ url: normalizeUrl(seed), depth: 0, from: null }];
  const queued = new Set([normalizeUrl(seed)]);
  const visited = new Map();
  const externalSeen = new Map();
  const pageErrors = [];
  let seedInternalLinks = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    if (current.depth > MAX_DEPTH) continue;
    if (visited.size >= MAX_PAGES_PER_DOMAIN) break;
    if (visited.has(current.url)) continue;

    const page = await browser.newPage();
    let pageStatus = null;
    let pageError = null;
    let links = [];
    let fingerprint = {
      title: '',
      h1: '',
      bodyText: '',
    };
    try {
      const response = await page.goto(current.url, {
        waitUntil: 'domcontentloaded',
        timeout: NAV_TIMEOUT_MS,
      });
      pageStatus = response?.status() ?? null;
      try {
        await page.waitForLoadState('networkidle', { timeout: 6000 });
      } catch {
        // Some apps keep open network activity; fallback to fixed settle delay.
      }
      await page.waitForTimeout(1100);
      links = await extractLinksFromPage(page, current.url);
      fingerprint = await extractPageFingerprint(page);
      if (current.url === normalizedSeed) {
        seedInternalLinks = links.filter((link) => {
          try {
            return new URL(link.url).host === domain;
          } catch {
            return false;
          }
        });
      }
    } catch (error) {
      pageError = error instanceof Error ? error.message : String(error);
      pageErrors.push({ url: current.url, depth: current.depth, error: pageError });
    } finally {
      await page.close();
    }

    visited.set(current.url, {
      url: current.url,
      depth: current.depth,
      from: current.from,
      pageStatus,
      pageError,
      discoveredLinks: links.length,
      title: fingerprint.title,
      h1: fingerprint.h1,
      fingerprintHash: textHash(`${fingerprint.title}|${fingerprint.h1}|${fingerprint.bodyText}`),
    });

    for (const link of links) {
      const host = new URL(link.url).host;
      if (host === domain) {
        if (
          current.depth + 1 <= MAX_DEPTH &&
          !visited.has(link.url) &&
          !queued.has(link.url) &&
          queued.size < MAX_PAGES_PER_DOMAIN * 3
        ) {
          queue.push({ url: link.url, depth: current.depth + 1, from: current.url });
          queued.add(link.url);
        }
      } else if (
        !externalSeen.has(link.url) &&
        externalSeen.size < MAX_EXTERNAL_CHECKS_PER_DOMAIN
      ) {
        externalSeen.set(link.url, {
          url: link.url,
          from: current.url,
          text: link.text,
        });
      }
    }
  }

  const internalChecks = [];
  for (const item of visited.values()) {
    const http = await checkHttp(item.url);
    internalChecks.push({
      type: 'internal',
      domain,
      from: item.from,
      depth: item.depth,
      url: item.url,
      pageStatus: item.pageStatus,
      pageError: item.pageError,
      title: item.title,
      h1: item.h1,
      fingerprintHash: item.fingerprintHash,
      ...http,
      broken: !http.ok || (typeof http.status === 'number' && http.status >= 400),
      semanticIssue: null,
    });
  }

  const byUrl = new Map(internalChecks.map((check) => [normalizeUrl(check.url), check]));
  const seedCheck = byUrl.get(normalizedSeed);
  const semanticBroken = [];
  const semanticTargetSeen = new Set();
  if (seedCheck?.fingerprintHash) {
    for (const link of seedInternalLinks) {
      const target = byUrl.get(normalizeUrl(link.url));
      if (!target) continue;

      const seedPath = new URL(seedCheck.url).pathname;
      const targetPath = new URL(target.url).pathname;
      if (seedPath === targetPath) continue;

      if (target.fingerprintHash === seedCheck.fingerprintHash) {
        if (semanticTargetSeen.has(target.url)) continue;
        semanticTargetSeen.add(target.url);
        target.semanticIssue = 'same_content_as_seed';
        target.semanticLinkText = link.text || '';
        target.broken = true;
        semanticBroken.push({
          from: seedCheck.url,
          to: target.url,
          text: link.text || '',
          issue: 'same_content_as_seed',
        });
      }
    }
  }

  const externalChecks = [];
  for (const external of externalSeen.values()) {
    const http = await checkHttp(external.url);
    externalChecks.push({
      type: 'external',
      domain,
      from: external.from,
      depth: null,
      url: external.url,
      pageStatus: null,
      pageError: null,
      ...http,
      broken: !http.ok || (typeof http.status === 'number' && http.status >= 400),
    });
  }

  const checks = [...internalChecks, ...externalChecks];
  return {
    seed,
    domain,
    crawledPages: visited.size,
    queuedRemaining: queue.length,
    maxDepthReached: Math.max(0, ...[...visited.values()].map((item) => item.depth)),
    pageErrors,
    semanticBroken,
    checks,
  };
};

const main = async () => {
  const startedAt = new Date().toISOString();
  const browser = await chromium.launch(resolveChromiumLaunchOptions());
  const results = [];

  try {
    for (const seed of [...new Set(SEEDS)]) {
      results.push(await crawlDomain(browser, seed));
    }
  } finally {
    await browser.close();
  }

  const rows = results.flatMap((result) =>
    result.checks.map((check) => ({
      seed: result.seed,
      ...check,
    }))
  );
  const broken = rows.filter((row) => row.broken);

  const summary = {
    startedAt,
    generatedAt: new Date().toISOString(),
    settings: {
      maxDepth: MAX_DEPTH,
      maxPagesPerDomain: MAX_PAGES_PER_DOMAIN,
      maxExternalChecksPerDomain: MAX_EXTERNAL_CHECKS_PER_DOMAIN,
      navTimeoutMs: NAV_TIMEOUT_MS,
      fetchTimeoutMs: FETCH_TIMEOUT_MS,
      failOnBroken: FAIL_ON_BROKEN,
    },
    seeds: results.length,
    totalChecked: rows.length,
    totalBroken: broken.length,
    internalBroken: broken.filter((item) => item.type === 'internal').length,
    externalBroken: broken.filter((item) => item.type === 'external').length,
    semanticBroken: broken.filter((item) => item.semanticIssue).length,
    perSeed: results.map((result) => {
      const seedRows = rows.filter((row) => row.seed === result.seed);
      return {
        seed: result.seed,
        domain: result.domain,
        crawledPages: result.crawledPages,
        maxDepthReached: result.maxDepthReached,
        checked: seedRows.length,
        broken: seedRows.filter((row) => row.broken).length,
        semanticBroken: seedRows.filter((row) => row.semanticIssue).length,
        pageErrors: result.pageErrors.length,
      };
    }),
  };

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(
    OUTPUT_JSON,
    JSON.stringify(
      {
        summary,
        results,
        broken,
      },
      null,
      2
    )
  );

  const md = [
    '# Live Link Crawl',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    '## Settings',
    `- max depth: ${summary.settings.maxDepth}`,
    `- max pages/domain: ${summary.settings.maxPagesPerDomain}`,
    `- max external checks/domain: ${summary.settings.maxExternalChecksPerDomain}`,
    '',
    '## Summary',
    `- seeds: ${summary.seeds}`,
    `- total checked links: ${summary.totalChecked}`,
    `- broken links: ${summary.totalBroken}`,
    `- internal broken: ${summary.internalBroken}`,
    `- external broken: ${summary.externalBroken}`,
    `- semantic broken: ${summary.semanticBroken}`,
    '',
    '## Per Seed',
    ...summary.perSeed.map(
      (seed) =>
        `- ${seed.seed} | pages=${seed.crawledPages} | maxDepth=${seed.maxDepthReached} | checked=${seed.checked} | broken=${seed.broken} | semanticBroken=${seed.semanticBroken} | pageErrors=${seed.pageErrors}`
    ),
    '',
    '## Semantic Broken Links',
    ...results.flatMap((result) =>
      (result.semanticBroken || []).map(
        (item) =>
          `- seed=${result.seed} | from=${item.from} | to=${item.to} | text=${item.text || 'n/a'} | issue=${item.issue}`
      )
    ),
    ...(results.every((result) => !result.semanticBroken?.length) ? ['- none'] : []),
    '',
    '## Broken Links',
    ...(broken.length
      ? broken.map(
          (item) =>
            `- seed=${item.seed} | type=${item.type} | url=${item.url} | status=${item.status ?? 'n/a'} | error=${item.error ?? 'none'} | final=${item.finalUrl ?? 'n/a'}`
        )
      : ['- none']),
    '',
  ].join('\n');

  writeFileSync(OUTPUT_MD, md);
  console.log(`Wrote ${OUTPUT_JSON}`);
  console.log(`Wrote ${OUTPUT_MD}`);
  console.log(JSON.stringify(summary, null, 2));

  if (FAIL_ON_BROKEN && broken.length > 0) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
