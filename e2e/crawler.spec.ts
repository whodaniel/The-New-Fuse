
import { test, expect } from '@playwright/test';

// Set a long timeout for the entire crawling process
test.setTimeout(5 * 60 * 1000);

const VISITED_URLS = new Set<string>();
const ERRORS: { url: string; error: string }[] = [];

test.describe('Crawler', () => {
  test('should visit all buttons and links systematically', async ({ page, baseURL }) => {
    // Start at the homepage
    const startUrl = baseURL || 'http://localhost:3000';
    console.log(`Starting crawl at: ${startUrl}`);

    // We will use a queue for BFS/DFS traversal
    const queue: string[] = [startUrl];
    VISITED_URLS.add(startUrl);

    // Limit depth or count to avoid infinite loops if needed, but for now we try to be comprehensive
    let count = 0;
    const MAX_PAGES = 100;

    // Helper to log errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`CONSOLE ERROR on ${page.url()}: ${msg.text()}`);
        ERRORS.push({ url: page.url(), error: `CONSOLE ERROR: ${msg.text()}` });
      }
    });

    page.on('pageerror', exception => {
      console.error(`PAGE ERROR on ${page.url()}: ${exception.message}`);
      ERRORS.push({ url: page.url(), error: `PAGE ERROR: ${exception.message}` });
    });

    page.on('response', response => {
      if (response.status() >= 400) {
        console.error(`NETWORK ERROR on ${page.url()}: ${response.status()} ${response.url()}`);
        ERRORS.push({ url: page.url(), error: `NETWORK ERROR: ${response.status()} ${response.url()}` });
      }
    });

    while (queue.length > 0 && count < MAX_PAGES) {
      const currentUrl = queue.shift()!;
      console.log(`Visiting: ${currentUrl} (${count + 1}/${MAX_PAGES})`);
      count++;

      try {
        await page.goto(currentUrl, { waitUntil: 'networkidle' });
      } catch (e: any) {
        console.error(`Failed to navigate to ${currentUrl}: ${e.message}`);
        ERRORS.push({ url: currentUrl, error: `NAVIGATION FAILED: ${e.message}` });
        continue;
      }

      // 1. Identify all links
      const links = await page.locator('a').all();
      for (const link of links) {
        try {
          const href = await link.getAttribute('href');
          if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) continue;

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
        ERRORS.forEach(e => console.log(`${e.url} -> ${e.error}`));
        // We fail the test if there are errors so we can see the report
        expect(ERRORS.length).toBe(0);
    }
  });
});
