/// <reference lib="dom" />
import * as fs from 'fs';
import * as path from 'path';
import { chromium, type BrowserContext } from 'playwright';

// Reuse config from V2
const PROFILE_DIR = path.join(process.env.HOME || '/tmp', '.video-processor-chrome');
const LIBRARY_URL = 'https://aistudio.google.com/app/library';
const OUT_DIR = path.join(process.cwd(), 'data', 'library_import');

async function main() {
  console.log('🚀 Starting Library Importer...');
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    channel: 'chrome',
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled',
    ],
    viewport: { width: 1400, height: 900 },
  });

  const page = await context.newPage();

  try {
    console.log(`Navigating to ${LIBRARY_URL}...`);
    await page.goto(LIBRARY_URL, { waitUntil: 'domcontentloaded' });

    // Allow manual login/loading time if needed, but usually persistent profile handles it.
    await page.waitForTimeout(5000);

    // Try to find the list of prompts/chats.
    // We'll look for generic row elements or text.
    // Common selectors in AI Studio (might change, so we'll be dynamic)
    // We'll dump a screenshot if we can't find anything.

    console.log('Scanning for conversations...');

    // Wait for something that looks like a list
    try {
      await page.waitForSelector('ms-file-list-item, .file-row, a[href*="/app/prompts/"]', {
        timeout: 10000,
      });
    } catch (e) {
      console.log('⚠️ Could not find obvious list items. Dumping page structure...');
      const html = await page.content();
      fs.writeFileSync(path.join(OUT_DIR, 'library_dump.html'), html);
      console.log('Saved library_dump.html. Please verify selectors.');

      // Fallback: Try to find ANY links to prompts
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a'))
          .map((a) => ({ href: a.href, text: a.innerText }))
          .filter((l) => l.href.includes('/app/prompts/') || l.href.includes('/app/chat/'));
      });

      console.log(`Found ${links.length} potential chat links.`);

      if (links.length === 0) {
        throw new Error('No chats found.');
      }

      // Process these links
      for (const link of links) {
        await processChatLink(context, link.href);
      }
      return;
    }

    // If we have a robust list selector:
    const rows = page.locator('ms-file-list-item, .file-row, a[href*="/app/prompts/"]');
    const count = await rows.count();
    console.log(`Found ${count} items in library.`);

    // Iterate
    // Note: Doing this via new tabs is safer to assume list doesn't refresh
    const hrefs = [];
    for (let i = 0; i < count; i++) {
      const href = await rows.nth(i).getAttribute('href');
      if (href) hrefs.push(href);
    }

    // Uniq
    const uniqueHrefs = [...new Set(hrefs)].filter(
      (h) => h.includes('/app/prompts/') || h.includes('/app/chat/')
    );

    console.log(`Processing ${uniqueHrefs.length} unique conversations...`);

    for (const href of uniqueHrefs) {
      const fullUrl = href.startsWith('http') ? href : `https://aistudio.google.com${href}`;
      await processChatLink(context, fullUrl);
    }
  } catch (e) {
    console.error('Fatal error:', e);
  } finally {
    await context.close();
  }
}

async function processChatLink(context: BrowserContext, url: string) {
  const id = url.split('/').pop()?.split('?')[0] || 'unknown_' + Date.now();
  const outFile = path.join(OUT_DIR, `chat_${id}.json`);

  if (fs.existsSync(outFile)) {
    console.log(`Skipping ${id} (already imported)`);
    return;
  }

  console.log(`Opening ${id}...`);
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000); // Let chat load

    // Extract content
    const data = await page.evaluate(() => {
      // Try to find user prompts and model responses
      // Selectors are tricky, we'll try to grab all text organized by structure

      const history = [];
      const turns = document.querySelectorAll('ms-chat-turn');

      if (turns.length > 0) {
        turns.forEach((turn) => {
          const role = turn.classList.contains('user') ? 'user' : 'model';
          const text = turn.textContent || '';
          history.push({ role, text });
        });
      } else {
        // Fallback for different UI version
        const container = document.querySelector('main') || document.body;
        history.push({ role: 'unknown', text: container.innerText });
      }
      return history;
    });

    const chatData = {
      id,
      url,
      importedAt: new Date().toISOString(),
      turns: data,
    };

    fs.writeFileSync(outFile, JSON.stringify(chatData, null, 2));
    console.log(`✅ Saved ${data.length} turns from ${id}`);
  } catch (e) {
    console.error(`Error processing ${url}:`, e);
  } finally {
    await page.close();
  }
}

main();
