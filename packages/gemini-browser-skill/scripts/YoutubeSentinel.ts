import * as fs from 'fs';
import * as path from 'path';
import { chromium, type Page } from 'playwright';

const STATE_FILE_PATH =
  '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/transcript-v2-state.json';
const POLL_INTERVAL = 30000; // 30 seconds

async function monitorActiveTab() {
  const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-alt');
  console.log('[Sentinel] Monitoring profile:', profileDir);

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false, // Must be non-headless to see what user is watching
    channel: 'chrome',
  });

  console.log('[Sentinel] Always-on detection active. Polling every 30s...');

  setInterval(async () => {
    try {
      const pages = context.pages();
      for (const page of pages) {
        const url = page.url();
        if (url.includes('youtube.com/watch?v=')) {
          const videoId = url.match(/v=([^&]+)/)?.[1];
          if (videoId && !isAlreadyInState(videoId)) {
            console.log(
              `[Sentinel] 🎯 New video detected: ${videoId}. Triggering shadow ingestion...`
            );
            await triggerIngestion(page, videoId);
          }
        }
      }
    } catch (e: any) {
      console.error('[Sentinel] Polling error:', e.message);
    }
  }, POLL_INTERVAL);
}

function isAlreadyInState(videoId: string): boolean {
  if (!fs.existsSync(STATE_FILE_PATH)) return false;
  const state = JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf-8'));
  return state.queue.some((v: any) => v.videoId === videoId);
}

async function triggerIngestion(page: Page, videoId: string) {
  const title = await page.title();
  console.log(`[Sentinel] Queueing "${title}" for processing.`);

  // In a real implementation, this would call the TranscriptProcessorV2 logic
  // or add to the state file and signal the processor.
  // For now, we update the state.
  const state = JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf-8'));
  const maxIndex = state.queue.reduce((max: number, v: any) => Math.max(max, v.index || 0), 0);

  state.queue.unshift({
    index: maxIndex + 1,
    url: page.url().split('&')[0],
    title: title.replace(' - YouTube', ''),
    videoId,
    status: 'pending',
    processingAttempts: 0,
    detectedBy: 'Sentinel',
  });

  fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2));
  console.log(`[Sentinel] Video #${maxIndex + 1} added to queue.`);
}

monitorActiveTab().catch(console.error);
