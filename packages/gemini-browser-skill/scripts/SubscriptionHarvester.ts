import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

const SUBSCRIPTIONS_URL = 'https://www.youtube.com/feed/subscriptions';
const OUTPUT_DIR = path.join(__dirname, '../data/harvested');

async function harvestSubscriptions() {
  const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-alt');
  console.log('[Harvester] Using profile:', profileDir);

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: true,
    channel: 'chrome',
  });

  const page = await context.newPage();
  console.log('[Harvester] Navigating to subscriptions...');
  
  await page.goto(SUBSCRIPTIONS_URL, { waitUntil: 'networkidle' });

  // Wait for the grid to load
  await page.waitForSelector('ytd-rich-item-renderer');

  const newVideos = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('ytd-rich-item-renderer'));
    return items.map((item) => {
      const titleLink = item.querySelector('#video-title-link') as HTMLAnchorElement;
      const channelLink = item.querySelector('#avatar-link') as HTMLAnchorElement;
      const url = titleLink?.href || '';
      const videoId = url.match(/v=([^&]+)/)?.[1] || '';
      
      return {
        title: titleLink?.innerText.trim() || 'Unknown',
        channel: channelLink?.title || 'Unknown',
        url: url.split('&list=')[0],
        videoId,
        harvestedAt: new Date().toISOString()
      };
    });
  });

  console.log(`[Harvester] Found ${newVideos.length} recent videos from subscriptions.`);
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(OUTPUT_DIR, `subs-harvest-${timestamp}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(newVideos, null, 2));
  
  console.log('[Harvester] Data saved to:', outputPath);

  await context.close();
  return newVideos;
}

harvestSubscriptions().catch(console.error);
