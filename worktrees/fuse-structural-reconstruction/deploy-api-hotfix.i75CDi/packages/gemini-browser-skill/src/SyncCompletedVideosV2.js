const fs = require('fs');
const path = require('path');

// Define paths - MATCHING TranscriptProcessorV2 LOGIC
const PROJ_ROOT = path.join(process.cwd(), '..', '..');
const LIBRARY_FILE = path.join(PROJ_ROOT, 'ai_video_library.html');
const IMPORT_DIR = path.join(process.cwd(), 'data', 'library_import');
// Use the root data dir if it exists, matching V2 logic
const rootDataDir = path.join(PROJ_ROOT, 'data');
const packageDataDir = path.join(process.cwd(), 'data');
const dataDir = fs.existsSync(rootDataDir) ? rootDataDir : packageDataDir;
const STATE_FILE = path.join(dataDir, 'transcript-v2-state.json');

console.log(`Using Data Dir: ${dataDir}`);
console.log(`State File: ${STATE_FILE}`);

function sync() {
  console.log('🔄 Syncing completed videos (V2 Logic -> transcript-v2-state.json)...');

  // 1. Load the original library
  if (!fs.existsSync(LIBRARY_FILE)) {
    console.error(`❌ Library file not found at: ${LIBRARY_FILE}`);
    process.exit(1);
  }

  const libContent = fs.readFileSync(LIBRARY_FILE, 'utf-8');
  const libraryVideos = [];
  const rowRegex =
    /<tr>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>\s*<\/td>/g;
  let match;

  while ((match = rowRegex.exec(libContent)) !== null) {
    libraryVideos.push({
      index: parseInt(match[1]),
      url: match[2],
      title: match[3].trim(),
      videoId: (match[2].match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/) || [null, ''])[1],
      status: 'pending',
      processingAttempts: 0,
    });
  }

  console.log(`📚 Loaded ${libraryVideos.length} videos from library`);

  // 2. Load Existing State or Initialize Fresh V2 State
  let state = {
    version: '2.0',
    queue: [],
    currentIndex: 0,
    startedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    stats: {
      totalVideos: libraryVideos.length,
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

  if (fs.existsSync(STATE_FILE)) {
    try {
      const existing = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      if (existing.version === '2.0' && Array.isArray(existing.queue)) {
        state = existing;
        console.log(`📂 Loaded existing V2 state with ${state.queue.length} entries`);
      } else {
        console.warn(
          '⚠️ Existing state is old version or invalid, merging into fresh 2.0 structure'
        );
        // Could migrate here, but for now we'll rebuild the queue from library
        state.queue = libraryVideos;
      }
    } catch (e) {
      console.warn('⚠️ Could not parse existing state, starting fresh');
      state.queue = libraryVideos;
    }
  } else {
    // Initialize queue with all videos
    state.queue = libraryVideos;
  }

  // Ensure queue has ALL library videos (merge if needed)
  if (state.queue.length < libraryVideos.length) {
    console.log('⚠️ State queue missing videos, merging...');
    for (const v of libraryVideos) {
      if (!state.queue.find((q) => q.index === v.index)) {
        state.queue.push(v);
      }
    }
  }

  // Sort queue descending (as V2 expects)
  state.queue.sort((a, b) => b.index - a.index);

  // 3. Map Imported Chats to Queue Items
  if (!fs.existsSync(IMPORT_DIR)) {
    console.error(`❌ Import directory not found at: ${IMPORT_DIR}`);
    return;
  }

  const files = fs.readdirSync(IMPORT_DIR).filter((f) => f.endsWith('.json'));
  console.log(`📥 Found ${files.length} imported chat files`);

  let matchCount = 0;
  let visualReviewCount = 0;

  for (const file of files) {
    const content = fs.readFileSync(path.join(IMPORT_DIR, file), 'utf-8');
    let json;
    try {
      json = JSON.parse(content);
    } catch (e) {
      continue;
    }
    const text = JSON.stringify(json.turns);

    // Find matching video in QUEUE
    const video = state.queue.find((v) => {
      return (
        typeof v?.title === 'string' &&
        typeof text === 'string' &&
        text.toLowerCase().includes(v.title.toLowerCase().substring(0, 20))
      );
    });

    if (video) {
      matchCount++;

      const gapMatches = text.match(/Need to see:/g);
      let newStatus = 'completed';

      if (gapMatches) {
        newStatus = 'needs_visual';
        visualReviewCount++;
      }

      // Only update if not already processed/completed
      // Or force update if we found it in imports
      video.status = newStatus;
      video.analysis = {
        summary: 'Imported from AI Studio chat',
        visualContextFlags: gapMatches ? new Array(gapMatches.length).fill({}) : [],
      };
      video.lastProcessed = new Date().toISOString();

      console.log(`✅ Method matched #${video.index}: ${newStatus}`);
    }
  }

  // Update stats
  state.stats.completed = matchCount;
  state.stats.needsVisualReview = visualReviewCount;

  // DEBUG: Check #633
  const v633 = state.queue.find((v) => v.index === 633);
  if (v633) {
    console.log(`DEBUG: #633 status BEFORE SAVE is: ${v633.status}`);
  } else {
    console.log('DEBUG: #633 NOT FOUND in queue');
  }

  // 4. Save State
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  console.log(`\n💾 Saved updated ${STATE_FILE}`);
  console.log(`📊 Total Queue: ${state.queue.length}`);
  console.log(`✅ Matched/Completed: ${matchCount}`);
  console.log(`👁️  Needs Visual Review: ${visualReviewCount}`);
}

sync();
