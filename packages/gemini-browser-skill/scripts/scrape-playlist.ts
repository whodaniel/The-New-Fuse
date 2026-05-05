import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

const PLAYLIST_URL = 'https://www.youtube.com/playlist?list=PLSdNsZjFbYrVOWZZlWtKvQ4YgshmswLsQ';

async function scrapePlaylist() {
  const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-alt');
  console.log('Using profile:', profileDir);

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: true, // Run headless for extraction
    channel: 'chrome',
  });

  const page = await context.newPage();
  console.log('Navigating to playlist:', PLAYLIST_URL);
  
  await page.goto(PLAYLIST_URL, { waitUntil: 'networkidle' });

  // Scroll to load all videos (YouTube playlists lazy load)
  console.log('Scrolling to load all items...');
  let previousCount = 0;
  let currentCount = 0;
  
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => window.scrollBy(0, 5000));
    await page.waitForTimeout(2000);
    currentCount = await page.locator('ytd-playlist-video-renderer').count();
    if (currentCount === previousCount && currentCount > 0) break;
    previousCount = currentCount;
    console.log(`Found ${currentCount} videos so far...`);
  }

  const videos = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('ytd-playlist-video-renderer'));
    return items.map((item, index) => {
      const titleLink = item.querySelector('#video-title') as HTMLAnchorElement;
      const url = titleLink?.href || '';
      const videoId = url.match(/v=([^&]+)/)?.[1] || '';
      return {
        index: index + 1,
        title: titleLink?.innerText.trim() || 'Unknown',
        url: url.split('&list=')[0], // Clean URL
        videoId
      };
    });
  });

  console.log(`\nSuccessfully scraped ${videos.length} videos.`);
  
  const outputPath = path.join(process.cwd(), 'data', 'ai-4-playlist.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(videos, null, 2));
  
  console.log('Data saved to:', outputPath);

  await context.close();
}

scrapePlaylist().catch(console.error);
