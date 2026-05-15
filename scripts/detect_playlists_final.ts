import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

async function main() {
  const outputPath = process.env.TNF_DETECTED_PLAYLISTS_FINAL_PATH
    ? path.resolve(process.env.TNF_DETECTED_PLAYLISTS_FINAL_PATH)
    : path.join(process.env.HOME || '/tmp', 'data', 'final_detected_playlists.json');

  const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-clean');
  console.log(`🚀 Launching Chrome with authenticated profile: ${profileDir}`);

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    channel: 'chrome',
    args: ['--no-first-run', '--disable-blink-features=AutomationControlled'],
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  console.log('Navigating to YouTube Library...');
  await page.goto('https://www.youtube.com/feed/library');
  await page.waitForTimeout(7000); // Give it time to load dynamic sections

  const libraryData = await page.evaluate(() => {
    const sections = Array.from(
      document.querySelectorAll('ytd-item-section-renderer, ytd-grid-renderer')
    );
    const results: any[] = [];

    const allLinks = Array.from(document.querySelectorAll('a'));
    allLinks.forEach((a) => {
      const title = a.textContent?.trim() || '';
      const href = a.href;
      if (href.includes('list=')) {
        results.push({ title, href });
      }
    });

    return results;
  });

  console.log('All detected list links in Library:', JSON.stringify(libraryData, null, 2));

  // Find our specific targets
  const targetNames = ['AI 3 DONE', 'AI 3', 'For AI 2', 'Liked videos'];
  const found = libraryData.filter((l) => targetNames.some((t) => l.title.includes(t)));

  console.log('Filtered Matches:', JSON.stringify(found, null, 2));
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(found, null, 2));

  await context.close();
}

main().catch(console.error);
