import * as fs from 'fs';
import * as path from 'path';

const PLAYLIST_DATA_PATH = path.join(__dirname, '../data/ai-4-playlist.json');
const STATE_FILE_PATH = path.join(__dirname, '../../../data/transcript-v2-state.json');

interface VideoEntry {
  index: number;
  url: string;
  title: string;
  videoId: string;
  status: string;
  processingAttempts: number;
  [key: string]: any;
}

interface ProcessingState {
  version: string;
  queue: VideoEntry[];
  currentIndex: number;
  startedAt: string;
  lastUpdated: string;
  stats: any;
}

function sync() {
  if (!fs.existsSync(PLAYLIST_DATA_PATH)) {
    console.error('Playlist data not found');
    return;
  }
  if (!fs.existsSync(STATE_FILE_PATH)) {
    console.error('State file not found');
    return;
  }

  const playlist: any[] = JSON.parse(fs.readFileSync(PLAYLIST_DATA_PATH, 'utf-8'));
  const state: ProcessingState = JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf-8'));

  console.log(`Current state has ${state.queue.length} videos.`);
  console.log(`Playlist has ${playlist.length} videos.`);

  const existingIds = new Set(state.queue.map(v => v.videoId));
  let maxIndex = Math.max(...state.queue.map(v => v.index), 0);
  
  const newEntries: VideoEntry[] = [];
  let updatedCount = 0;

  // Process in reverse to maintain playlist order (assuming playlist is newest first)
  for (const v of playlist) {
    if (!existingIds.has(v.videoId)) {
      maxIndex++;
      const newEntry: VideoEntry = {
        index: maxIndex,
        url: v.url,
        title: v.title,
        videoId: v.videoId,
        status: 'pending',
        processingAttempts: 0
      };
      newEntries.push(newEntry);
      console.log(`Adding new video: ${v.title} (#${maxIndex})`);
    } else {
      // Prioritize existing ones from the playlist
      const existing = state.queue.find(ev => ev.videoId === v.videoId);
      if (existing && (existing.status === 'error' || existing.status === 'skipped' || existing.status === 'pending')) {
        existing.status = 'pending';
        existing.processingAttempts = 0; // Reset to ensure it runs
        updatedCount++;
      }
    }
  }

  // Add new entries to the START of the queue to prioritize them
  state.queue = [...newEntries, ...state.queue];
  state.stats.totalVideos = state.queue.length;
  state.lastUpdated = new Date().toISOString();

  fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2));
  console.log(`\nSync complete.`);
  console.log(`Added: ${newEntries.length}`);
  console.log(`Reset for priority: ${updatedCount}`);
  console.log(`New total: ${state.queue.length}`);
}

sync();
