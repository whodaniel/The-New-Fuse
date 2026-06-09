import { chromium } from 'playwright';

const START_URL = 'https://app.thenewfuse.com/';
const VISITED = new Set<string>();
const ERRORS: { url: string; error: string }[] = [];

const IGNORED_ERRORS = [
  'violates the following Content Security Policy',
  'forwardRef render functions accept',
  'favicon.ico',
];

function shouldIgnore(msg: string) {
  return IGNORED_ERRORS.some(pattern => msg.includes(pattern));
}

async function crawl() {
  console.log(`Starting crawl at ${START_URL}`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error' && !shouldIgnore(msg.text())) {
      ERRORS.push({ url: page.url(), error: `Console Error: ${msg.text()}` });
    }
  });

  page.on('pageerror', err => {
    if (!shouldIgnore(err.message)) {
      ERRORS.push({ url: page.url(), error: `Page Exception: ${err.message}` });
    }
  });

  page.on('response', resp => {
    if (resp.status() >= 400 && !shouldIgnore(resp.url())) {
      ERRORS.push({ url: page.url(), error: `HTTP ${resp.status()} on resource: ${resp.url()}` });
    }
  });

  const queue = [START_URL];
  VISITED.add(START_URL);

  let count = 0;
  const MAX_PAGES = 150;

  while (queue.length > 0 && count < MAX_PAGES) {
    const url = queue.shift()!;
    console.log(`[${count + 1}/${MAX_PAGES}] Visiting: ${url}`);
    count++;

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // Wait a bit for React to hydrate
      await page.waitForTimeout(2000);
    } catch (e: any) {
      ERRORS.push({ url, error: `Navigation Failed: ${e.message}` });
      continue;
    }

    // Grab links
    const hrefs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a'))
        .map(a => a.href)
        .filter(h => h && h.startsWith('http') && !h.includes('#'));
    });

    for (const href of hrefs) {
      try {
        const parsed = new URL(href);
        // Only crawl same domain
        if (parsed.hostname === new URL(START_URL).hostname) {
          const cleanUrl = parsed.origin + parsed.pathname;
          if (!VISITED.has(cleanUrl)) {
            VISITED.add(cleanUrl);
            queue.push(cleanUrl);
          }
        }
      } catch (e) {
        // invalid URL
      }
    }
  }

  await browser.close();

  console.log('\n--- CRAWL COMPLETE ---');
  console.log(`Visited ${count} pages.`);
  console.log(`Found ${ERRORS.length} errors.\n`);

  if (ERRORS.length > 0) {
    console.log('--- ERRORS DETECTED ---');
    for (const e of ERRORS) {
      console.log(`[${e.url}]\n -> ${e.error}\n`);
    }
    process.exit(1);
  }
}

crawl().catch(console.error);
