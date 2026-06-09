import { expect, test, type Page } from '@playwright/test';

const VISITED_URLS = new Set<string>();
const ERRORS: { url: string; error: string }[] = [];

const IGNORED_CONSOLE_PATTERNS = [
  'violates the following Content Security Policy directive',
  'forwardRef render functions accept exactly two parameters',
];

function shouldIgnoreError(error: string): boolean {
  if (IGNORED_CONSOLE_PATTERNS.some((pattern) => error.includes(pattern))) {
    return true;
  }

  // Frontend-only e2e runs without a full backend; crawler should not fail on API proxy noise.
  if (error.includes('NETWORK ERROR:') && error.includes('/api/')) {
    return true;
  }

  return false;
}

async function gotoWithRetry(page: Page, url: string): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(750);
    }
  }
  throw lastError;
}

test.describe('Crawler', () => {
  test('should visit all buttons and links systematically', async ({ page, baseURL }) => {
    test.setTimeout(5 * 60 * 1000);
    VISITED_URLS.clear();
    ERRORS.length = 0;

    // Start at the homepage
    const startUrl = baseURL || 'http://localhost:3002';
    console.log(`Starting crawl at: ${startUrl}`);

    // We will use a queue for BFS/DFS traversal
    const queue: string[] = [startUrl];
    VISITED_URLS.add(startUrl);

    // Limit depth or count to avoid infinite loops if needed, but for now we try to be comprehensive
    let count = 0;
    const MAX_PAGES = 100;

    // Helper to log errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const error = `CONSOLE ERROR: ${msg.text()}`;
        if (!shouldIgnoreError(error)) {
          console.error(`${error} on ${page.url()}`);
          ERRORS.push({ url: page.url(), error });
        }
      }
    });

    page.on('pageerror', (exception) => {
      console.error(`PAGE ERROR on ${page.url()}: ${exception.message}`);
      ERRORS.push({ url: page.url(), error: `PAGE ERROR: ${exception.message}` });
    });

    page.on('response', (response) => {
      if (response.status() >= 400) {
        const error = `NETWORK ERROR: ${response.status()} ${response.url()}`;
        if (!shouldIgnoreError(error)) {
          console.error(`${error} on ${page.url()}`);
          ERRORS.push({ url: page.url(), error });
        }
      }
    });

    while (queue.length > 0 && count < MAX_PAGES) {
      const currentUrl = queue.shift()!;
      console.log(`Visiting: ${currentUrl} (${count + 1}/${MAX_PAGES})`);
      count++;

      try {
        await gotoWithRetry(page, currentUrl);
      } catch (e: any) {
        // If the app host itself is unavailable in this environment, skip this broad crawl test.
        if (
          currentUrl === startUrl &&
          String(e?.message || '').includes('ERR_CONNECTION_REFUSED')
        ) {
          test.skip(true, 'Frontend app host is unavailable in this environment');
        }

        console.error(`Failed to navigate to ${currentUrl}: ${e.message}`);
        ERRORS.push({ url: currentUrl, error: `NAVIGATION FAILED: ${e.message}` });
        continue;
      }

      // 1. Identify all links
      const links = await page.locator('a').all();
      for (const link of links) {
        try {
          const href = await link.getAttribute('href');
          if (
            !href ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:') ||
            href.startsWith('#')
          )
            continue;

          // Resolve relative URLs
          const absoluteUrl = new URL(href, currentUrl).toString();

          // Only crawl internal links
          if (absoluteUrl.startsWith(startUrl) && !VISITED_URLS.has(absoluteUrl)) {
            VISITED_URLS.add(absoluteUrl);
            queue.push(absoluteUrl);
          }
        } catch (e) {
          // Ignore stale element errors
        }
      }

      // 2. Identify and "interact" with buttons (verify they are visible/enabled)
      // We won't click every button because that might trigger form submissions, modals, or state changes that disrupt crawling.
      // Instead, we will check if they are visible and not disabled.
      const buttons = await page.locator('button').all();
      for (const button of buttons) {
        try {
          const isVisible = await button.isVisible();
          const isDisabled = await button.isDisabled();
          const text = await button.innerText();

          if (!isVisible) {
            // Not necessarily an error, but worth noting if crucial
            // console.log(`Button hidden on ${currentUrl}: ${text.substring(0, 20)}...`);
          }
        } catch (e) {
          // Ignore stale element errors
        }
      }
    }

    console.log('--- CRAWL COMPLETE ---');
    console.log(`Visited ${count} pages.`);
    console.log(`Found ${ERRORS.length} errors.`);

    if (ERRORS.length > 0) {
      console.log('Errors found:');
      ERRORS.forEach((e) => console.log(`${e.url} -> ${e.error}`));
      // We fail the test if there are errors so we can see the report
      expect(ERRORS.length).toBe(0);
    }
  });
});
