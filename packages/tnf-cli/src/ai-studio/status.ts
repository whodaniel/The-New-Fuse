#!/usr/bin/env node

/**
 * The New Fuse - AI Studio Processing Status
 *
 * Displays current processing state, statistics, and next steps
 *
 * Usage:
 *   pnpm tnf-agent ai-studio:status
 */

import * as fs from 'fs';
import { config } from './config.js';

// Configuration from centralized config
const REPORTS_DIR = config.reportsDir;
const PROGRESS_FILE = config.progressFile;
const LIBRARY_FILE = config.libraryFile;

interface Video {
  index: number;
  videoId: string;
  url: string;
  title: string;
}

interface ProgressEntry {
  index: number;
  videoId: string;
  title?: string;
  reason?: string;
  error?: string;
  timestamp?: string;
}

interface Progress {
  completed: ProgressEntry[];
  failed: ProgressEntry[];
  skipped: ProgressEntry[];
  lastProcessedIndex: number | null;
  startTime: string | null;
  totalVideos: number;
}

function loadVideoLibrary(): Video[] {
  if (!fs.existsSync(LIBRARY_FILE)) {
    return [];
  }

  const libContent = fs.readFileSync(LIBRARY_FILE, 'utf-8');
  const videos: Video[] = [];
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

function loadProgress(): Progress | null {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return null;
}

function getProcessedVideos(): Set<number> {
  try {
    if (!fs.existsSync(REPORTS_DIR)) {
      return new Set();
    }
    const files = fs.readdirSync(REPORTS_DIR);
    const processed = new Set<number>();
    for (const file of files) {
      const match = file.match(/(?:tnf|api|transcript)_(\d+)_/);
      if (match) processed.add(parseInt(match[1]));
    }
    return processed;
  } catch {
    return new Set();
  }
}

interface Stats {
  total: number;
  completed: number;
  remaining: number;
  percentage: string;
  estimatedHours: string;
  totalCost: string;
  remainingCost: string;
  failed: number;
  skipped: number;
}

function calculateStats(
  videos: Video[],
  processedIndices: Set<number>,
  progress: Progress | null
): Stats {
  const total = videos.length;
  const completed = processedIndices.size;
  const remaining = total - completed;
  const percentage = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';
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

export function displayStatus(): void {
  console.log('\n' + '═'.repeat(70));
  console.log('[TNF] AI STUDIO - VIDEO PROCESSING STATUS');
  console.log('═'.repeat(70) + '\n');

  const apiKey = process.env.GEMINI_API_KEY;
  console.log(apiKey ? 'GEMINI_API_KEY: Configured\n' : 'GEMINI_API_KEY: Not set!\n');

  const videos = loadVideoLibrary();
  if (videos.length === 0) {
    console.log('[TNF] No video library found.');
    console.log(`Create a video-library.html file in: ${config.dataDir}\n`);
    return;
  }

  const progress = loadProgress();
  const processedIndices = getProcessedVideos();
  const stats = calculateStats(videos, processedIndices, progress);
  const unprocessed = videos.filter((v) => !processedIndices.has(v.index));

  console.log('STATISTICS');
  console.log('─'.repeat(70));
  console.log(`   Total Videos:      ${stats.total}`);
  console.log(`   Completed:         ${stats.completed} (${stats.percentage}%)`);
  console.log(`   Remaining:         ${stats.remaining}`);
  console.log(`   Failed:            ${stats.failed}`);
  console.log(`   Skipped:           ${stats.skipped}`);
  console.log('─'.repeat(70));
  console.log(`   Cost So Far:       $${stats.totalCost}`);
  console.log(`   Remaining Cost:    $${stats.remainingCost}`);
  console.log(`   Est. Time Left:    ${stats.estimatedHours} hours`);
  console.log('─'.repeat(70) + '\n');

  const barWidth = 50;
  const filled = Math.round((stats.completed / Math.max(stats.total, 1)) * barWidth);
  console.log(
    `Progress: [${'█'.repeat(filled)}${'░'.repeat(barWidth - filled)}] ${stats.percentage}%\n`
  );

  console.log('NEXT ACTIONS');
  console.log('─'.repeat(70));
  console.log('\n1. Resume processing:');
  console.log('   pnpm tnf-agent ai-studio:batch --resume\n');
  console.log('2. Process specific range:');
  console.log('   pnpm tnf-agent ai-studio:batch --start=200 --end=300\n');
  console.log('3. Generate knowledge base:');
  console.log('   pnpm tnf-agent ai-studio:generate-kb\n');

  if (unprocessed.length > 0) {
    console.log('NEXT 5 VIDEOS TO PROCESS');
    console.log('─'.repeat(70));
    unprocessed
      .slice(0, 5)
      .forEach((v) => console.log(`   #${v.index}: ${v.title.substring(0, 50)}...`));
    console.log();
  }

  console.log('═'.repeat(70) + '\n');
}

// Entry point is via CLI, not direct execution
