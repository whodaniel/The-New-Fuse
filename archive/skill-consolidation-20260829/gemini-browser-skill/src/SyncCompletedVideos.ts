#!/usr/bin/env ts-node

/**
 * Sync Completed Videos from library_import to processing_state.json
 *
 * This script reads the library_import folder (videos already processed in AI Studio)
 * and marks them as completed in the CLI's processing_state.json so they won't be reprocessed.
 */

import * as fs from 'fs';
import * as path from 'path';

const LIBRARY_FILE = path.join(process.cwd(), '..', '..', 'ai_video_library.html');
const IMPORT_DIR = path.join(process.cwd(), 'data', 'library_import');
const STATE_FILE = path.join(process.cwd(), 'data', 'processing_state.json');

interface VideoEntry {
  index: number;
  videoId: string;
  url: string;
  title: string;
  duration?: string;
  status: string;
  error?: string;
  metadata?: any;
  transcript?: any;
  analysis?: any;
  processingAttempts: number;
  lastProcessed?: string;
}

interface ProcessingState {
  version: string;
  videos: VideoEntry[];
  stats: any;
}

console.log('🔄 Syncing completed videos from library_import to processing_state.json...\n');

// 1. Load the original library to get all video data
const libContent = fs.readFileSync(LIBRARY_FILE, 'utf-8');
const libraryVideos: any[] = [];
const rowRegex =
  /<tr>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>\s*<\/td>/g;
let match;
while ((match = rowRegex.exec(libContent)) !== null) {
  const url = match[2];
  const videoId = url.match(/v=([^&]+)/)?.[1] || url.split('/').pop() || '';
  libraryVideos.push({
    index: parseInt(match[1]),
    videoId,
    url,
    title: match[3].trim(),
  });
}

console.log(`📚 Loaded ${libraryVideos.length} videos from library`);

// 2. Read all library_import files to find completed videos
const importFiles = fs.readdirSync(IMPORT_DIR).filter((f) => f.endsWith('.json'));
console.log(`📥 Found ${importFiles.length} imported chat files`);

const completedTitles = new Set<string>();
let visualGapCount = 0;

for (const file of importFiles) {
  try {
    const content = fs.readFileSync(path.join(IMPORT_DIR, file), 'utf-8');
    const json = JSON.parse(content);
    const text = JSON.stringify(json.turns);

    // Find which video this matches
    for (const video of libraryVideos) {
      if (text.toLowerCase().includes(video.title.toLowerCase().substring(0, 20))) {
        completedTitles.add(video.title);

        // Check if it needs visual review
        const gapMatches = text.match(/Need to see:/g);
        if (gapMatches && gapMatches.length > 0) {
          visualGapCount++;
        }
        break;
      }
    }
  } catch (e) {
    // Skip invalid files
  }
}

console.log(`✅ Matched ${completedTitles.size} completed videos`);
console.log(`👁️  ${visualGapCount} videos need visual review\n`);

// 3. Load or create processing_state.json
let state: ProcessingState;

if (fs.existsSync(STATE_FILE)) {
  console.log('📂 Loading existing processing_state.json...');
  state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
} else {
  console.log('📝 Creating new processing_state.json...');
  state = {
    version: '2.0',
    videos: [],
    stats: {
      completed: 0,
      metadataComplete: 0,
      transcriptComplete: 0,
      analyzed: 0,
      errors: 0,
      skipped: 0,
    },
  };
}

// 4. Create video entries for all library videos if they don't exist
for (const libVideo of libraryVideos) {
  let videoEntry = state.videos.find((v) => v.index === libVideo.index);

  if (!videoEntry) {
    // Create new entry
    videoEntry = {
      index: libVideo.index,
      videoId: libVideo.videoId,
      url: libVideo.url,
      title: libVideo.title,
      status: 'pending',
      processingAttempts: 0,
    };
    state.videos.push(videoEntry);
  }

  // Mark as completed if in library_import
  if (completedTitles.has(libVideo.title) && videoEntry.status !== 'completed') {
    console.log(
      `✅ Marking #${libVideo.index} as completed: ${libVideo.title.substring(0, 50)}...`
    );
    videoEntry.status = 'completed';
    videoEntry.processingAttempts = 1;
    videoEntry.lastProcessed = new Date().toISOString();

    // Mark as having analysis (we don't have the actual data, but we know it exists)
    videoEntry.analysis = {
      imported: true,
      source: 'library_import',
    };
  }
}

// 5. Update stats
state.stats.completed = state.videos.filter((v) => v.status === 'completed').length;
state.stats.analyzed = state.stats.completed;

// 6. Sort videos by index
state.videos.sort((a, b) => a.index - b.index);

// 7. Save updated state
fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');

console.log(`\n💾 Saved updated processing_state.json`);
console.log(`📊 Total videos: ${state.videos.length}`);
console.log(`✅ Completed: ${state.stats.completed}`);
console.log(`⏸️  Pending: ${state.videos.length - state.stats.completed}`);
console.log(
  `\n✨ Sync complete! CLI will now skip the ${state.stats.completed} completed videos.\n`
);
