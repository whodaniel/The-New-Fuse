import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

async function main() {
  const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-clean');
  console.log(`🚀 Launching Sovereign Retriever with profile: ${profileDir}`);

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: true, // Use headless for performance
    channel: 'chrome',
    args: ['--no-first-run', '--disable-blink-features=AutomationControlled'],
  });

  const page = await context.newPage();

  // AI 3 DONE: 1,868 videos
  const playlistId = 'PLSdNsZjFbYrWxmGLlgbrliEz57iUgZ3J7';
  console.log(`📡 Indexing master timeline for Software 3.0...`);

  await page.goto(`https://www.youtube.com/playlist?list=${playlistId}`);
  await page.waitForTimeout(5000);

  // Scroll loop
  console.log('   Loading 1,800+ video nodes...');
  let videoCount = 0;
  for (let i = 0; i < 60; i++) {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(1000);
    const count = await page.evaluate(
      () => document.querySelectorAll('ytd-playlist-video-renderer').length
    );
    if (count === videoCount && i > 10) break;
    videoCount = count;
    if (i % 5 === 0) console.log(`   Fetched ${videoCount} nodes...`);
  }

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

  console.log(`✅ Chronological timeline established: ${videos.length} videos.`);

  const timelinePath = '/Users/<owner>/data/sovereign_ai_timeline.json';
  fs.writeFileSync(timelinePath, JSON.stringify(videos, null, 2));
  console.log(`💾 Timeline saved to ${timelinePath}`);

  // Now start the retrieval loop
  console.log('🚀 Starting autonomous transcript retrieval loop...');
  for (const video of videos) {
    // Check if we already have it
    const safeTitle = video.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const transcriptPath = `/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/video-transcripts/${video.index}_${video.videoId}.txt`;

    if (fs.existsSync(transcriptPath)) {
      continue;
    }

    console.log(`📥 Fetching transcript for #${video.index}: ${video.title}`);
    try {
      await page.goto(video.url);
      await page.waitForTimeout(3000);

      // Trigger transcript button in UI
      await page.click('button[aria-label="More actions"]');
      await page.waitForTimeout(1000);
      await page.click('ytd-menu-service-item-renderer:has-text("Show transcript")');
      await page.waitForTimeout(2000);

      const transcript = await page.evaluate(() => {
        const lines = Array.from(document.querySelectorAll('ytd-transcript-segment-renderer'));
        return lines.map((l) => l.textContent?.trim()).join('\n');
      });

      if (transcript) {
        fs.mkdirSync(path.dirname(transcriptPath), { recursive: true });
        fs.writeFileSync(transcriptPath, transcript);
        console.log(`   ✅ Saved: ${path.basename(transcriptPath)}`);
      }
    } catch (e) {
      console.error(`   ❌ Failed: ${video.title}`);
    }
  }

  await context.close();
}

main().catch(console.error);
