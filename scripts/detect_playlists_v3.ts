import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

async function main() {
  const outputPath = process.env.TNF_DETECTED_PLAYLISTS_V3_PATH
    ? path.resolve(process.env.TNF_DETECTED_PLAYLISTS_V3_PATH)
    : path.join(process.env.HOME || '/tmp', 'data', 'detected_playlists_v3.json');

  const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-clean');
  console.log(`🚀 Launching Chrome with authenticated profile: ${profileDir}`);

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    channel: 'chrome',
    args: ['--no-first-run', '--disable-blink-features=AutomationControlled'],
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  console.log('Navigating to YouTube Home...');
  await page.goto('https://www.youtube.com');
  await page.waitForTimeout(5000);

  // Look for the "Playlists" section in the sidebar
  console.log('Extracting sidebar playlists...');
  const playlists = await page.evaluate(() => {
    const results: any[] = [];
    // Expand playlists if possible
    const expandButton = document.querySelector(
      'ytd-guide-section-renderer[section-identifier="FEplaylist_aggregation"] #expander-item'
    );
    if (expandButton) (expandButton as HTMLElement).click();

    // Wait a bit for expansion
    return new Promise((resolve) => {
      setTimeout(() => {
        const links = Array.from(document.querySelectorAll('ytd-guide-entry-renderer a'));
        links.forEach((a) => {
          const title = a.textContent?.trim() || '';
          const href = (a as HTMLAnchorElement).href;
          if (href.includes('list=')) {
            results.push({ title, href });
          }
        });
        resolve(results);
      }, 2000);
    });
  });

  console.log('Detected Playlists:', JSON.stringify(playlists, null, 2));
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(playlists, null, 2));

  await context.close();
}

main().catch(console.error);
