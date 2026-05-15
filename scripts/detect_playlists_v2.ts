import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

async function main() {
  const outputPath = process.env.TNF_DETECTED_PLAYLISTS_V2_PATH
    ? path.resolve(process.env.TNF_DETECTED_PLAYLISTS_V2_PATH)
    : path.join(process.env.HOME || '/tmp', 'data', 'detected_playlists_v2.json');
  const screenshotPath = process.env.TNF_DETECTED_PLAYLISTS_V2_SCREENSHOT
    ? path.resolve(process.env.TNF_DETECTED_PLAYLISTS_V2_SCREENSHOT)
    : path.join(process.env.HOME || '/tmp', 'data', 'playlist_diag.png');

  const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-clean');
  console.log(`🚀 Launching Chrome with authenticated profile: ${profileDir}`);

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    channel: 'chrome',
    args: ['--no-first-run', '--disable-blink-features=AutomationControlled'],
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  console.log('Navigating to View All Playlists...');
  // This is the old URL but often redirects correctly or works better
  await page.goto('https://www.youtube.com/view_all_playlists');
  await page.waitForTimeout(5000);

  // If redirected to a different page, handle it
  console.log('Current URL:', page.url());

  // Search for our specific playlists
  const targetPlaylists = ['AI 3 DONE', 'AI 3', 'For AI 2', 'Liked videos'];

  const foundPlaylists = await page.evaluate((targets) => {
    const results: any[] = [];
    const items = Array.from(
      document.querySelectorAll('ytd-grid-playlist-renderer, ytd-playlist-renderer')
    );

    items.forEach((item) => {
      const titleEl = item.querySelector('#video-title, #playlist-title');
      const title = titleEl?.textContent?.trim() || '';
      const href = (item.querySelector('a#thumbnail, a#video-title') as HTMLAnchorElement)?.href;

      if (targets.some((t) => title.includes(t))) {
        results.push({ title, href });
      }
    });

    return results;
  }, targetPlaylists);

  console.log('Found targeted playlists:', JSON.stringify(foundPlaylists, null, 2));

  if (foundPlaylists.length === 0) {
    console.log('No playlists found with simple selectors. Taking diagnostic screenshot...');
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath });
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(foundPlaylists, null, 2));

  await context.close();
}

main().catch(console.error);
