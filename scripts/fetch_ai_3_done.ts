import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

async function main() {
  const outputPath = process.env.TNF_AI3_DONE_LIST_PATH
    ? path.resolve(process.env.TNF_AI3_DONE_LIST_PATH)
    : path.join(process.env.HOME || '/tmp', 'data', 'ai_3_done_list.json');

  const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-clean');
  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false, // Keep it visible for monitoring
    channel: 'chrome',
    args: ['--no-first-run', '--disable-blink-features=AutomationControlled'],
  });

  const page = await context.newPage();
  const playlistId = 'PLSdNsZjFbYrWxmGLlgbrliEz57iUgZ3J7'; // AI 3 DONE
  console.log(`📡 Fetching "AI 3 DONE" (${playlistId})...`);

  await page.goto(`https://www.youtube.com/playlist?list=${playlistId}`);
  await page.waitForTimeout(5000);

  // Optimized fast scroll
  console.log('   Fast scrolling to load 1,800+ videos...');
  await page.evaluate(async () => {
    const scroll = () => {
      window.scrollTo(0, document.documentElement.scrollHeight);
    };
    for (let i = 0; i < 50; i++) {
      // Approx 50 scrolls for 1800 videos
      scroll();
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // Check if we hit the end (optional)
    }
  });

  const videos = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('ytd-playlist-video-renderer'));
    return items.map((item, index) => {
      const titleEl = item.querySelector('#video-title');
      const url = (titleEl as HTMLAnchorElement)?.href;
      const title = titleEl?.textContent?.trim() || '';
      const videoId = url ? new URL(url).searchParams.get('v') : '';
      return { index: index + 1, title, url, videoId };
    });
  });

  console.log(`   ✅ Extracted ${videos.length} videos.`);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(videos, null, 2));
  await context.close();
}

main().catch(console.error);
