#!/usr/bin/env node

/**
 * Process Recent Videos from Gemini Personal Intelligence
 *
 * Reads recent-videos.json and processes new videos
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RECENT_VIDEOS_FILE = 'recent-videos.json';
const config = require('./lib/config');

const LIBRARY_FILE = config.libraryFile;
const REPORTS_DIR = config.reportsDir;

function extractVideoId(url) {
  const match = url.match(/v=([^&]+)/);
  return match ? match[1] : url.split('/').pop();
}

function isAlreadyInLibrary(videoId) {
  const libContent = fs.readFileSync(LIBRARY_FILE, 'utf-8');
  return libContent.includes(videoId);
}

function isAlreadyProcessed(videoId) {
  const allReports = fs.readdirSync(REPORTS_DIR);
  return allReports.some((file) => file.includes(videoId));
}

function main() {
  console.log('📺 Processing Recent Watch History\n');
  console.log('═'.repeat(70));
  console.log('\n');

  // Check if recent-videos.json exists
  if (!fs.existsSync(RECENT_VIDEOS_FILE)) {
    console.log('❌ Error: recent-videos.json not found\n');
    console.log('Please run: node fetch-recent-videos.js');
    console.log('Then follow the instructions to create recent-videos.json\n');
    process.exit(1);
  }

  // Load recent videos
  const recentVideos = JSON.parse(fs.readFileSync(RECENT_VIDEOS_FILE, 'utf-8'));
  console.log(`📚 Loaded ${recentVideos.length} recent videos\n`);

  // Analyze each video
  const newVideos = [];
  const alreadyProcessed = [];
  const inLibraryNotProcessed = [];

  for (const video of recentVideos) {
    const videoId = extractVideoId(video.url);
    const inLibrary = isAlreadyInLibrary(videoId);
    const processed = isAlreadyProcessed(videoId);

    if (processed) {
      alreadyProcessed.push(video);
    } else if (inLibrary) {
      inLibraryNotProcessed.push(video);
    } else {
      newVideos.push({ ...video, videoId });
    }
  }

  // Display results
  console.log('📊 Analysis Results:\n');
  console.log(`   ✅ Already processed: ${alreadyProcessed.length}`);
  console.log(`   📚 In library, not processed: ${inLibraryNotProcessed.length}`);
  console.log(`   🆕 New videos to add: ${newVideos.length}\n`);

  // Show new videos
  if (newVideos.length > 0) {
    console.log('═'.repeat(70));
    console.log(`\n🆕 NEW VIDEOS TO ADD TO LIBRARY:\n`);
    console.log('═'.repeat(70));
    console.log('\n');

    newVideos.forEach((video, idx) => {
      console.log(`${idx + 1}. ${video.title}`);
      console.log(`   Channel: ${video.channel}`);
      console.log(`   URL: ${video.url}`);
      console.log(`   ${video.description}\n`);
    });

    // Generate HTML rows for adding to library
    console.log('─'.repeat(70));
    console.log('\n📝 HTML ROWS TO ADD TO LIBRARY:\n');
    console.log('─'.repeat(70));
    console.log('\n');

    // Get current max index
    const libContent = fs.readFileSync(LIBRARY_FILE, 'utf-8');
    const indices = [...libContent.matchAll(/<td[^>]*>\s*(\d+)\s*<\/td>/g)].map((m) =>
      parseInt(m[1])
    );
    let nextIndex = Math.max(...indices) + 1;

    newVideos.forEach((video) => {
      console.log(`    <tr>`);
      console.log(`      <td style="text-align: center; padding: 12px;">${nextIndex}</td>`);
      console.log(
        `      <td style="padding: 12px;"><a href="${video.url}" target="_blank" style="color: #1a73e8; text-decoration: none;">${video.title}</a></td>`
      );
      console.log(`    </tr>`);
      nextIndex++;
    });

    console.log('\n');
  }

  // Show videos in library but not processed
  if (inLibraryNotProcessed.length > 0) {
    console.log('═'.repeat(70));
    console.log(`\n📚 VIDEOS IN LIBRARY NOT YET PROCESSED:\n`);
    console.log('═'.repeat(70));
    console.log('\n');

    inLibraryNotProcessed.forEach((video, idx) => {
      console.log(`${idx + 1}. ${video.title}`);
      console.log(`   ${video.url}\n`);
    });

    console.log('🚀 To process these videos:');
    console.log('   Run: node src/DirectAPIProcessor.js');
    console.log('   node src/DirectAPIProcessor.js\n');
  }

  console.log('═'.repeat(70));
  console.log('\n✅ Analysis complete!\n');
}

main().catch(console.error);
