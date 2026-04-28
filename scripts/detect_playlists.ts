import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

const PLAYLISTS = [
  {
    name: 'AI 3 DONE',
    url: 'https://www.youtube.com/playlist?list=PL_Xv_6oA-pD-0v6S6R7S5Y1B8-Z_o7G-s',
  }, // I need to find the actual IDs or navigate to the library
  { name: 'AI 3', url: '' },
  { name: 'For AI 2', url: '' },
];

async function main() {
  const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-clean');
  console.log(`🚀 Launching Chrome with authenticated profile: ${profileDir}`);

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    channel: 'chrome',
    args: ['--no-first-run', '--disable-blink-features=AutomationControlled'],
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  console.log('Navigating to YouTube Playlists...');
  await page.goto('https://www.youtube.com/feed/library');
  await page.waitForTimeout(5000);

  // Take a screenshot to verify login state and see the playlist links
  const screenshotPath = path.join(process.cwd(), 'data', 'youtube_library_check.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`Screenshot saved to ${screenshotPath}`);

  // Attempt to find the specific playlists
  const playlistLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a#video-title, a#view-all'));
    return links
      .map((a) => ({
        title: a.textContent?.trim(),
        href: (a as HTMLAnchorElement).href,
      }))
      .filter((l) => l.title && l.title.includes('AI'));
  });

  console.log('Found AI-related playlists:', JSON.stringify(playlistLinks, null, 2));

  // Save for the next step
  fs.writeFileSync(
    path.join(process.cwd(), 'data', 'detected_playlists.json'),
    JSON.stringify(playlistLinks, null, 2)
  );

  await context.close();
}

main().catch(console.error);
