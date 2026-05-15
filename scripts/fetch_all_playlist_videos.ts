import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

const PLAYLISTS = [
  { name: 'AI 3 DONE', id: 'PLSdNsZjFbYrWxmGLlgbrliEz57iUgZ3J7' },
  { name: 'AI 3', id: 'PLSdNsZjFbYrUx71R3jrniO7ZpycUb89g7' },
  { name: 'For AI 2', id: 'PLSdNsZjFbYrUfbIOFL8APAqp4ubn1S9Ax' },
  { name: 'Liked videos', id: 'LL' },
];

async function fetchPlaylistVideos(context: any, playlist: any) {
  console.log(`📡 Fetching videos for playlist: ${playlist.name} (${playlist.id})...`);
  const page = await context.newPage();
  await page.goto(`https://www.youtube.com/playlist?list=${playlist.id}`);
  await page.waitForTimeout(5000);

  // Scroll to bottom to load all videos
  console.log('   Scrolling to load all videos...');
  let lastHeight = await page.evaluate('document.documentElement.scrollHeight');
  while (true) {
    await page.evaluate('window.scrollTo(0, document.documentElement.scrollHeight)');
    await page.waitForTimeout(3000);
    let newHeight = await page.evaluate('document.documentElement.scrollHeight');
    if (newHeight === lastHeight) break;
    lastHeight = newHeight;
    console.log(`   Loaded more videos... (height: ${newHeight})`);
  }

  const videos = await page.evaluate((pName) => {
    const items = Array.from(document.querySelectorAll('ytd-playlist-video-renderer'));
    return items.map((item, index) => {
      const titleEl = item.querySelector('#video-title');
      const url = (titleEl as HTMLAnchorElement)?.href;
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

  console.log(`   ✅ Extracted ${videos.length} videos from ${playlist.name}.`);
  await page.close();
  return videos;
}

async function main() {
  const outputPath = process.env.TNF_MASTER_PLAYLIST_BACKLOG_PATH
    ? path.resolve(process.env.TNF_MASTER_PLAYLIST_BACKLOG_PATH)
    : path.join(process.env.HOME || '/tmp', 'data', 'master_playlist_backlog.json');

  const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-clean');
  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    channel: 'chrome',
    args: ['--no-first-run', '--disable-blink-features=AutomationControlled'],
  });

  let allVideos: any[] = [];
  for (const p of PLAYLISTS) {
    try {
      const videos = await fetchPlaylistVideos(context, p);
      allVideos = allVideos.concat(videos);
    } catch (e) {
      console.error(`   ❌ Failed to fetch ${p.name}:`, e);
    }
  }

  console.log(`\n🎉 Total videos across all playlists: ${allVideos.length}`);

  // De-duplicate by videoId
  const uniqueVideos = Array.from(new Map(allVideos.map((v) => [v.videoId, v])).values());
  console.log(`✨ Unique videos: ${uniqueVideos.length}`);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(uniqueVideos, null, 2));
  console.log(`💾 Master backlog saved to ${outputPath}`);

  await context.close();
}

main().catch(console.error);
