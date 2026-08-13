import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

const PLAYLISTS = [
  { name: 'AI 6', id: 'PLSdNsZjFbYrWjIziXgBbWDJewYMtAv5Z4' },
];

async function fetchPlaylistVideos(context, playlist) {
  console.log(`Fetching videos for playlist: ${playlist.name} (${playlist.id})...`);
  const page = await context.newPage();
  await page.goto(`https://www.youtube.com/playlist?list=${playlist.id}`);
  await page.waitForTimeout(5000);

  let lastHeight = await page.evaluate('document.documentElement.scrollHeight');
  while (true) {
    await page.evaluate('window.scrollTo(0, document.documentElement.scrollHeight)');
    await page.waitForTimeout(3000);
    let newHeight = await page.evaluate('document.documentElement.scrollHeight');
    if (newHeight === lastHeight) break;
    lastHeight = newHeight;
  }

  const videos = await page.evaluate((pName) => {
    const items = Array.from(document.querySelectorAll('ytd-playlist-video-renderer'));
    return items.map((item, index) => {
      const titleEl = item.querySelector('#video-title');
      const url = titleEl?.href;
      const title = titleEl?.textContent?.trim() || '';
      const videoId = url ? new URL(url).searchParams.get('v') : '';
      return {
        playlistName: pName,
        playlistIndex: index + 1,
        title,
        url,
        videoId,
      };
    });
  }, playlist.name);

  console.log(`Extracted ${videos.length} videos from ${playlist.name}.`);
  await page.close();
  return videos;
}

async function main() {
  const outputPath = path.join(process.env.HOME || '/tmp', 'data', 'ai-6-playlist.json');
  const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-clean');
  
  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    channel: 'chrome',
    args: ['--no-first-run', '--disable-blink-features=AutomationControlled'],
  });

  let allVideos = [];
  for (const p of PLAYLISTS) {
    try {
      const videos = await fetchPlaylistVideos(context, p);
      allVideos = allVideos.concat(videos);
    } catch (e) {
      console.error(`Failed to fetch ${p.name}:`, e);
    }
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(allVideos, null, 2));
  console.log(`Saved ${allVideos.length} videos to ${outputPath}`);

  await context.close();
}

main().catch(console.error);