#!/usr/bin/env node

/**
 * Check Processing Status
 *
 * Displays current processing state, statistics, and next steps
 *
 * Usage:
 *   node cli/status.js
 */

const fs = require('fs');
const path = require('path');

const config = require('../lib/config');

const LIBRARY_FILE = config.libraryFile;
const REPORTS_DIR = config.reportsDir;
const PROGRESS_FILE = path.join(__dirname, '..', 'processing-progress.json');

function loadVideoLibrary() {
  const libContent = fs.readFileSync(LIBRARY_FILE, 'utf-8');
  const videos = [];
  const rowRegex =
    /<tr>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>\s*<\/td>/g;

  let match;
  while ((match = rowRegex.exec(libContent)) !== null) {
    const url = match[2];
    const videoId = (url.match(/v=([^&]+)/) || [])[1] || url.split('/').pop() || '';
    videos.push({ index: parseInt(match[1]), videoId, url, title: match[3].trim() });
  }
  return videos;
}

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return null;
}

function getProcessedVideos() {
  try {
    const files = fs.readdirSync(REPORTS_DIR);
    const processed = new Set();
    for (const file of files) {
      const match = file.match(/(?:api|transcript)_(\d+)_/);
      if (match) processed.add(parseInt(match[1]));
    }
    return processed;
  } catch {
    return new Set();
  }
}

function calculateStats(videos, processedIndices, progress) {
  const total = videos.length;
  const completed = processedIndices.size;
  const remaining = total - completed;
  const percentage = ((completed / total) * 100).toFixed(1);
  const estimatedHours = ((remaining * 2.5) / 60 / 60).toFixed(1);
  const costPerVideo = 0.0008;

  return {
    total,
    completed,
    remaining,
    percentage,
    estimatedHours,
    totalCost: (completed * costPerVideo).toFixed(2),
    remainingCost: (remaining * costPerVideo).toFixed(2),
    failed: progress?.failed?.length || 0,
    skipped: progress?.skipped?.length || 0,
  };
}

function displayStatus() {
  console.log('\n' + '═'.repeat(70));
  console.log('📊 VIDEO PROCESSING STATUS');
  console.log('═'.repeat(70) + '\n');

  const apiKey = process.env.GEMINI_API_KEY;
  console.log(apiKey ? '✅ GEMINI_API_KEY configured\n' : '❌ GEMINI_API_KEY not set!\n');

  const videos = loadVideoLibrary();
  const progress = loadProgress();
  const processedIndices = getProcessedVideos();
  const stats = calculateStats(videos, processedIndices, progress);
  const unprocessed = videos.filter((v) => !processedIndices.has(v.index));

  console.log('📈 STATISTICS');
  console.log('─'.repeat(70));
  console.log(`   Total Videos:      ${stats.total}`);
  console.log(`   ✅ Completed:       ${stats.completed} (${stats.percentage}%)`);
  console.log(`   ⏳ Remaining:       ${stats.remaining}`);
  console.log(`   ❌ Failed:          ${stats.failed}`);
  console.log(`   ⏭️ Skipped:         ${stats.skipped}`);
  console.log('─'.repeat(70));
  console.log(`   💰 Cost So Far:     $${stats.totalCost}`);
  console.log(`   💰 Remaining Cost:  $${stats.remainingCost}`);
  console.log(`   ⏱️  Est. Time Left:  ${stats.estimatedHours} hours`);
  console.log('─'.repeat(70) + '\n');

  const barWidth = 50;
  const filled = Math.round((stats.completed / stats.total) * barWidth);
  console.log(
    `Progress: [${'█'.repeat(filled)}${'░'.repeat(barWidth - filled)}] ${stats.percentage}%\n`
  );

  console.log('🚀 NEXT ACTIONS');
  console.log('─'.repeat(70));
  console.log('\n1️⃣  Resume processing:');
  console.log('   node cli/batch-processor.js --resume\n');
  console.log('2️⃣  Process range:');
  console.log('   node cli/batch-processor.js --start=200 --end=300\n');
  console.log('3️⃣  Generate knowledge base:');
  console.log('   node cli/generate-kb.js\n');

  if (unprocessed.length > 0) {
    console.log('📋 NEXT 5 VIDEOS TO PROCESS');
    console.log('─'.repeat(70));
    unprocessed
      .slice(0, 5)
      .forEach((v) => console.log(`   #${v.index}: ${v.title.substring(0, 50)}...`));
    console.log();
  }

  console.log('═'.repeat(70) + '\n');
}

displayStatus();
