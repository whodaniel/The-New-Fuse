#!/usr/bin/env node

/**
 * Process New Videos from Playlist and Recent Watch History
 *
 * This script:
 * 1. Fetches the current playlist to find new videos
 * 2. Can integrate with YouTube Data API to get recent watch history
 * 3. Filters out political content
 * 4. Processes only videos not already in reports directory
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const config = require('./lib/config');

const LIBRARY_FILE = config.libraryFile;
const REPORTS_DIR = config.reportsDir;
// API key check removed - not needed for analysis-only mode

// Keywords that indicate political content (to filter out)
const POLITICAL_KEYWORDS = [
  'trump',
  'biden',
  'election',
  'politics',
  'political',
  'democrat',
  'republican',
  'congress',
  'senate',
  'president',
  'government',
  'policy',
  'legislation',
  'vote',
  'voting',
  'campaign',
  'liberal',
  'conservative',
];

function isPolitical(title) {
  const lowerTitle = title.toLowerCase();
  return POLITICAL_KEYWORDS.some((keyword) => lowerTitle.includes(keyword));
}

function isAlreadyProcessed(videoId, index) {
  const apiReport = path.join(REPORTS_DIR, `api_${index}_${videoId}.md`);

  // Check for exact match
  if (fs.existsSync(apiReport)) {
    return true;
  }

  // Check for any report with this video ID
  const allReports = fs.readdirSync(REPORTS_DIR);
  return allReports.some((file) => file.includes(videoId));
}

function loadExistingLibrary() {
  console.log('📚 Loading existing video library...');
  const libContent = fs.readFileSync(LIBRARY_FILE, 'utf-8');
  const videos = [];
  const rowRegex =
    /<tr>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>\s*<\/td>/g;

  let match;
  while ((match = rowRegex.exec(libContent)) !== null) {
    const url = match[2];
    const videoId = (url.match(/v=([^&]+)/) || [])[1] || url.split('/').pop() || '';

    videos.push({
      index: parseInt(match[1]),
      videoId,
      url,
      title: match[3].trim(),
    });
  }

  console.log(`   Found ${videos.length} videos in existing library\n`);
  return videos;
}

function findNewVideosInPlaylist() {
  console.log('🔍 Checking for new videos in playlist...');
  console.log('   Note: You need to update ai_video_library.html with latest playlist\n');

  // TODO: Add automatic playlist fetching via YouTube Data API
  // For now, user should manually update the HTML file

  return [];
}

async function fetchRecentWatchHistory() {
  console.log('📺 Fetching recent watch history...');
  console.log('   Note: This requires YouTube Data API access\n');

  // TODO: Implement YouTube Data API integration
  // This would fetch the last 50 watched videos from the authenticated user

  console.log('⚠️  YouTube Data API integration not yet implemented');
  console.log('   Manual workaround:');
  console.log('   1. Go to https://www.youtube.com/feed/history');
  console.log('   2. Copy video URLs from recent history');
  console.log('   3. Add them to a text file: recent-videos.txt');
  console.log('   4. Run: node process-from-urls.js recent-videos.txt\n');

  return [];
}

function analyzeLibraryStatus(videos) {
  console.log('📊 Analyzing library status...\n');

  let processed = 0;
  let unprocessed = 0;
  let political = 0;

  const unprocessedVideos = [];

  for (const video of videos) {
    if (isPolitical(video.title)) {
      political++;
      continue;
    }

    if (isAlreadyProcessed(video.videoId, video.index)) {
      processed++;
    } else {
      unprocessed++;
      unprocessedVideos.push(video);
    }
  }

  console.log(`   ✅ Already processed: ${processed}`);
  console.log(`   ⏳ Unprocessed: ${unprocessed}`);
  console.log(`   🚫 Filtered (political): ${political}`);
  console.log(`   📚 Total in library: ${videos.length}\n`);

  return { unprocessedVideos, stats: { processed, unprocessed, political } };
}

function generateProcessingInstructions(videos) {
  if (videos.length === 0) {
    console.log('✅ All videos in library are already processed!\n');
    return;
  }

  console.log('═'.repeat(70));
  console.log(`\n📋 FOUND ${videos.length} NEW VIDEOS TO PROCESS\n`);
  console.log('═'.repeat(70));
  console.log('\nVideos to process:\n');

  videos.slice(0, 20).forEach((video, idx) => {
    console.log(`${idx + 1}. #${video.index}: ${video.title}`);
    console.log(`   ${video.url}\n`);
  });

  if (videos.length > 20) {
    console.log(`   ... and ${videos.length - 20} more\n`);
  }

  console.log('─'.repeat(70));
  console.log('\n🚀 TO PROCESS THESE VIDEOS:\n');
  console.log('   Option 1: Use DirectAPIProcessor (recommended)');
  console.log('   Run: node src/DirectAPIProcessor.js\n');

  console.log('Option 2: Use Gemini Personal Intelligence (for videos without transcripts)');
  console.log('   See: MISSING-VIDEOS-FOR-GEMINI.md\n');

  console.log('─'.repeat(70));
  console.log('\n💡 TO ADD NEW VIDEOS TO LIBRARY:\n');
  console.log('1. Update your YouTube playlist');
  console.log('2. Extract playlist HTML');
  console.log('3. Replace ai_video_library.html');
  console.log('4. Run this script again\n');
}

async function main() {
  console.log('🎬 New Video Processor\n');
  console.log('═'.repeat(70));
  console.log('\n');

  // Load existing library
  const existingVideos = loadExistingLibrary();

  // Analyze current status
  const { unprocessedVideos, stats } = analyzeLibraryStatus(existingVideos);

  // Check for new videos in playlist (manual update required)
  findNewVideosInPlaylist();

  // Check recent watch history (API integration needed)
  await fetchRecentWatchHistory();

  // Generate processing instructions
  generateProcessingInstructions(unprocessedVideos);

  console.log('═'.repeat(70));
  console.log('\n✅ Analysis complete!\n');
}

main().catch(console.error);
