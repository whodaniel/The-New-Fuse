const fs = require('fs');
const path = require('path');

const PLAYLIST_DATA_PATH =
  '/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/gemini-browser-skill/data/ai-4-playlist.json';
const STATE_FILE_PATH =
  '/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/transcript-v2-state.json';

function sync() {
  const playlist = JSON.parse(fs.readFileSync(PLAYLIST_DATA_PATH, 'utf-8'));

  // Hardcode start index to follow existing library
  let nextIndex = 648;

  const newQueue = [];
  for (const v of playlist) {
    newQueue.push({
      index: nextIndex++,
      url: v.url,
      title: v.title,
      videoId: v.videoId,
      status: 'pending',
      processingAttempts: 0,
    });
    console.log(`Mapping: ${v.title} -> #${nextIndex - 1}`);
  }

  const state = {
    version: '2.0',
    queue: newQueue,
    currentIndex: 648,
    startedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    stats: {
      totalVideos: newQueue.length,
      metadataComplete: 0,
      transcriptsExtracted: 0,
      analyzed: 0,
      needsVisualReview: 0,
      completed: 0,
      skipped: 0,
      errors: 0,
      analysisSuccessRate: 0,
      averageTranscriptLength: 0,
    },
  };

  fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2));
  console.log(`\nState reset and synced with ${newQueue.length} videos starting from 648.`);
}

sync();
