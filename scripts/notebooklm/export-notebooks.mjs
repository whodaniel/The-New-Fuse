#!/usr/bin/env node

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';

function readArg(name, fallback = undefined) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  if (!match) return fallback;
  return match.slice(prefix.length);
}

function readBool(name, fallback) {
  const raw = readArg(name);
  if (raw === undefined) return fallback;
  return ['1', 'true', 'yes', 'y'].includes(String(raw).toLowerCase());
}

function readNumber(name, fallback) {
  const raw = Number(readArg(name, fallback));
  return Number.isFinite(raw) ? raw : fallback;
}

function notebookIdFromUrl(url) {
  const match = url.match(/\/notebook\/([^/?#]+)/i);
  if (!match) return '';
  return decodeURIComponent(match[1]);
}

async function extractNotebookList(page) {
  return page.evaluate(() => {
    const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim();
    const entries = new Map();

    const maybeAdd = (id, url, title) => {
      const normalizedId = normalize(id);
      if (!normalizedId || normalizedId === 'new') return;
      if (!entries.has(normalizedId)) {
        entries.set(normalizedId, {
          id: normalizedId,
          url: normalize(url),
          title: normalize(title) || 'Untitled Notebook',
        });
      }
    };

    document.querySelectorAll('a[href*="/notebook/"]').forEach((anchor) => {
      const href = anchor.getAttribute('href') || '';
      if (!href.includes('/notebook/')) return;
      const match = href.match(/\/notebook\/([^/?#]+)/i);
      if (!match) return;
      const id = decodeURIComponent(match[1]);
      const titleCandidate =
        anchor.getAttribute('title') ||
        anchor.getAttribute('aria-label') ||
        anchor.textContent ||
        anchor.closest('[data-notebook-id]')?.querySelector('h1,h2,h3,[data-notebook-title]')?.textContent ||
        '';
      const url = href.startsWith('http') ? href : `${window.location.origin}${href}`;
      maybeAdd(id, url, titleCandidate);
    });

    document.querySelectorAll('[data-notebook-id]').forEach((node) => {
      const id = node.getAttribute('data-notebook-id');
      const href =
        node.getAttribute('href') ||
        node.querySelector('a[href*="/notebook/"]')?.getAttribute('href') ||
        '';
      const title =
        node.getAttribute('data-notebook-title') ||
        node.querySelector('[data-notebook-title],h1,h2,h3,strong,span')?.textContent ||
        '';
      const url = href
        ? href.startsWith('http')
          ? href
          : `${window.location.origin}${href}`
        : id
          ? `${window.location.origin}/notebook/${id}`
          : '';
      maybeAdd(id, url, title);
    });

    return Array.from(entries.values());
  });
}

async function extractNotebookSources(page) {
  return page.evaluate(() => {
    const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim();
    const seen = new Set();
    const sources = [];

    const sourceNodes = document.querySelectorAll(
      '[data-source-id], [data-testid*="source"], [aria-label*="Source"], [class*="source"]'
    );

    sourceNodes.forEach((node, index) => {
      const container =
        node.closest('[data-source-id]') ||
        node.closest('[data-testid*="source"]') ||
        node.closest('article,li,div');
      const sourceId =
        container?.getAttribute('data-source-id') ||
        node.getAttribute('data-source-id') ||
        '';
      const title =
        normalize(
          container?.querySelector(
            '[data-source-title], h1, h2, h3, h4, strong, button, [role="button"], span'
          )?.textContent
        ) || normalize(container?.textContent).slice(0, 120);
      const snippet = normalize(container?.textContent).slice(0, 420);
      const dedupeKey = `${sourceId}::${title}`;

      if (!title || seen.has(dedupeKey)) return;
      seen.add(dedupeKey);
      sources.push({
        index,
        sourceId: sourceId || null,
        title,
        snippet,
      });
    });

    return sources.slice(0, 300);
  });
}

async function main() {
  const defaultProfileDir = path.join(os.homedir(), '.notebooklm', 'browser_profile');
  const profileDir = readArg('profile-dir', defaultProfileDir);
  const headless = readBool('headless', false);
  const includeSources = readBool('include-sources', true);
  const maxNotebooks = Math.max(1, readNumber('limit', 25));
  const waitMs = Math.max(5_000, readNumber('wait-ms', 25_000));

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const defaultOutput = path.join(process.cwd(), 'data', 'notebooklm', `notebooks-${timestamp}.json`);
  const outputPath = readArg('output', defaultOutput);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const context = await chromium.launchPersistentContext(profileDir, {
    headless,
    viewport: { width: 1480, height: 960 },
  });

  try {
    const page = context.pages()[0] || (await context.newPage());
    await page.goto('https://notebooklm.google.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(waitMs);

    const currentUrl = page.url();
    if (/accounts\.google\.com|ServiceLogin|signin/i.test(currentUrl)) {
      throw new Error(
        `NotebookLM is not authenticated in this profile (${profileDir}). Current URL: ${currentUrl}`
      );
    }

    const notebooks = (await extractNotebookList(page)).slice(0, maxNotebooks);
    const enriched = [];

    for (const notebook of notebooks) {
      const entry = {
        ...notebook,
        sources: [],
      };

      if (includeSources && notebook.url) {
        const notebookPage = await context.newPage();
        try {
          await notebookPage.goto(notebook.url, { waitUntil: 'domcontentloaded' });
          await notebookPage.waitForTimeout(4_000);
          entry.sources = await extractNotebookSources(notebookPage);
        } catch (error) {
          entry.sources = [];
          entry.sourceError = error instanceof Error ? error.message : String(error);
        } finally {
          await notebookPage.close();
        }
      }

      enriched.push(entry);
    }

    const payload = {
      extractedAt: new Date().toISOString(),
      notebookLmUrl: 'https://notebooklm.google.com/',
      profileDir,
      includeSources,
      notebookCount: enriched.length,
      notebooks: enriched,
    };

    await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    console.log(`NotebookLM export complete: ${outputPath}`);
    console.log(`Notebooks exported: ${payload.notebookCount}`);
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  console.error(`NotebookLM export failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

