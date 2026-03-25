#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const DEFAULT_START_URL = 'https://whodaniel.zo.computer/?chat=new_ftjvdq';
const DEFAULT_MAX_PAGES = 160;
const DEFAULT_NAV_LABELS = [
  'Home',
  'Files',
  'Chats',
  'Automations',
  'Space',
  'Skills',
  'More',
  'Hosting',
  'Datasets',
  'System',
  'Terminal',
  'Billing',
  'Resources',
  'Bookmarks',
  'Settings',
];

function parseArgs(argv) {
  const options = {
    startUrl: DEFAULT_START_URL,
    outputDir: null,
    maxPages: DEFAULT_MAX_PAGES,
    headed: false,
    navLabels: DEFAULT_NAV_LABELS,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--start-url' && argv[i + 1]) {
      options.startUrl = argv[++i];
    } else if (arg === '--output-dir' && argv[i + 1]) {
      options.outputDir = argv[++i];
    } else if (arg === '--max-pages' && argv[i + 1]) {
      options.maxPages = Number(argv[++i]) || DEFAULT_MAX_PAGES;
    } else if (arg === '--headed') {
      options.headed = true;
    } else if (arg === '--nav-labels' && argv[i + 1]) {
      options.navLabels = argv[++i]
        .split(',')
        .map((label) => label.trim())
        .filter(Boolean);
    }
  }

  if (!options.outputDir) {
    throw new Error('--output-dir is required');
  }

  return options;
}

function normalizeUrl(input) {
  try {
    const parsed = new URL(input);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    parsed.hash = '';

    const canonical = new URL(parsed.toString());
    canonical.searchParams.sort();
    return canonical.toString();
  } catch {
    return null;
  }
}

function inScope(input) {
  try {
    const host = (new URL(input).hostname || '').toLowerCase();
    return (
      host.endsWith('.zo.computer') ||
      host.endsWith('.zo.space') ||
      host === 'zo.computer' ||
      host === 'www.zo.computer'
    );
  } catch {
    return false;
  }
}

function sanitize(input) {
  return (input || 'page')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 160);
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function extractPagePayload(page) {
  return page.evaluate(() => {
    const toText = (value) => (value || '').replace(/\s+/g, ' ').trim();
    const absolute = (href) => {
      try {
        return new URL(href, location.href).href;
      } catch {
        return null;
      }
    };

    const links = Array.from(document.querySelectorAll('a[href]'))
      .map((node) => ({
        text: toText(node.innerText || node.textContent),
        href: absolute(node.getAttribute('href') || node.href || ''),
        rel: node.getAttribute('rel') || '',
        target: node.getAttribute('target') || '',
      }))
      .filter((item) => item.href);

    const buttons = Array.from(
      document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]')
    ).map((node) => ({
      tag: (node.tagName || '').toLowerCase(),
      id: node.id || '',
      role: node.getAttribute('role') || '',
      ariaLabel: node.getAttribute('aria-label') || '',
      text: toText(node.innerText || node.textContent || node.value || ''),
      classes: node.className || '',
    }));

    const inputs = Array.from(document.querySelectorAll('input, textarea, select')).map((node) => ({
      tag: (node.tagName || '').toLowerCase(),
      id: node.id || '',
      name: node.getAttribute('name') || '',
      type: node.getAttribute('type') || '',
      placeholder: node.getAttribute('placeholder') || '',
      ariaLabel: node.getAttribute('aria-label') || '',
    }));

    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((node) => ({
      level: (node.tagName || '').toLowerCase(),
      text: toText(node.innerText || node.textContent),
    }));

    return {
      capturedAt: new Date().toISOString(),
      url: location.href,
      title: document.title,
      links,
      buttons,
      inputs,
      headings,
      bodyText: toText(document.body?.innerText || ''),
    };
  });
}

async function savePageArtifacts({ outputDir, index, action, payload, html, screenshotPath }) {
  const parsed = new URL(payload.url);
  const slug = sanitize(
    `${String(index).padStart(3, '0')}_${action}_${parsed.hostname}_${parsed.pathname || 'root'}_${parsed.search}`
  );
  const pageDir = path.join(outputDir, 'pages', slug);
  await ensureDir(pageDir);

  await fs.writeFile(path.join(pageDir, 'page.json'), JSON.stringify(payload, null, 2), 'utf8');
  await fs.writeFile(path.join(pageDir, 'page.html'), html, 'utf8');
  await fs.writeFile(path.join(pageDir, 'page.txt'), payload.bodyText || '', 'utf8');

  if (screenshotPath) {
    const screenshotName = path.basename(screenshotPath);
    await fs.copyFile(screenshotPath, path.join(pageDir, screenshotName));
  }

  return {
    slug,
    url: payload.url,
    title: payload.title,
    action,
    links: payload.links.length,
    buttons: payload.buttons.length,
    inputs: payload.inputs.length,
    headings: payload.headings.length,
  };
}

async function waitForSettledUi(page, timeoutMs = 12000) {
  try {
    await page.waitForLoadState('domcontentloaded', { timeout: timeoutMs });
  } catch {
    // Best effort for pages with long-lived requests.
  }

  try {
    await page.waitForLoadState('networkidle', { timeout: 4000 });
  } catch {
    // Best effort.
  }

  await page.waitForTimeout(1200);
}

async function clickNavLabel(page, label) {
  return page.evaluate((targetLabel) => {
    const normalize = (text) => (text || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const wanted = normalize(targetLabel);
    const candidates = Array.from(document.querySelectorAll('a,button,[role="button"]'));
    const findCandidate = () =>
      candidates.find((el) => normalize(el.innerText || el.textContent) === wanted) ||
      candidates.find((el) => normalize(el.getAttribute('aria-label')) === wanted) ||
      candidates.find((el) => normalize(el.innerText || el.textContent).includes(wanted)) ||
      candidates.find((el) => normalize(el.getAttribute('aria-label')).includes(wanted));

    const target = findCandidate();
    if (!target) return { ok: false, label: targetLabel };
    target.click();
    return { ok: true, label: targetLabel };
  }, label);
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  const outputDir = path.resolve(options.outputDir);
  await ensureDir(outputDir);

  const summary = {
    startUrl: options.startUrl,
    startedAt: new Date().toISOString(),
    maxPages: options.maxPages,
    pages: [],
    navAttempts: [],
    errors: [],
  };

  const visited = new Set();
  const discovered = new Set();
  const screenshotTmpDir = path.join(outputDir, '.tmp-screens');
  await ensureDir(screenshotTmpDir);

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: !options.headed,
  });

  const context = await browser.newContext({
    viewport: { width: 1720, height: 980 },
  });
  const page = await context.newPage();

  const captureCurrentPage = async (action) => {
    await waitForSettledUi(page);
    const payload = await extractPagePayload(page);
    const html = await page.content();
    const screenshotPath = path.join(
      screenshotTmpDir,
      `${String(summary.pages.length).padStart(3, '0')}-${sanitize(action)}.png`
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const normalized = normalizeUrl(payload.url);
    if (normalized) visited.add(normalized);

    const saved = await savePageArtifacts({
      outputDir,
      index: summary.pages.length,
      action,
      payload,
      html,
      screenshotPath,
    });
    summary.pages.push(saved);

    for (const link of payload.links) {
      const normalizedLink = normalizeUrl(link.href);
      if (!normalizedLink || !inScope(normalizedLink)) continue;
      discovered.add(normalizedLink);
    }
  };

  try {
    await page.goto(options.startUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await captureCurrentPage('initial');

    for (const label of options.navLabels) {
      if (summary.pages.length >= options.maxPages) break;
      try {
        const result = await clickNavLabel(page, label);
        summary.navAttempts.push(result);
        if (result.ok) {
          await captureCurrentPage(`click_${sanitize(label)}`);
        }
      } catch (error) {
        summary.errors.push({
          stage: 'nav_click',
          label,
          error: String(error),
        });
      }
    }

    const queue = Array.from(discovered).filter((url) => !visited.has(url));
    while (queue.length > 0 && summary.pages.length < options.maxPages) {
      const targetUrl = queue.shift();
      if (!targetUrl || visited.has(targetUrl) || !inScope(targetUrl)) continue;

      try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await captureCurrentPage('link_crawl');

        for (const candidate of discovered) {
          if (!visited.has(candidate) && !queue.includes(candidate)) {
            queue.push(candidate);
          }
        }
      } catch (error) {
        summary.errors.push({
          stage: 'link_crawl',
          url: targetUrl,
          error: String(error),
        });
      }
    }
  } finally {
    await context.close();
    await browser.close();
  }

  summary.finishedAt = new Date().toISOString();
  summary.pageCount = summary.pages.length;
  summary.errorCount = summary.errors.length;

  await fs.writeFile(path.join(outputDir, 'crawl-summary.json'), JSON.stringify(summary, null, 2), 'utf8');
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

run().catch((error) => {
  process.stderr.write(`${String(error)}\n`);
  process.exitCode = 1;
});
