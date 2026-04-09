#!/usr/bin/env node

/**
 * Export Videos for NotebookLM Bulk Import
 *
 * NotebookLM now accepts bulk YouTube URLs (space or newline separated)
 * This script generates different export formats for various use cases
 */

const fs = require('fs');
const path = require('path');

const config = require('./lib/config');

const LIBRARY_FILE = config.libraryFile;
const REPORTS_DIR = config.reportsDir;
const OUTPUT_DIR = './notebooklm-exports';

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function loadVideoLibrary() {
  console.log('📚 Loading video library...\n');
  const content = fs.readFileSync(LIBRARY_FILE, 'utf-8');
  const videos = [];
  const rowRegex =
    /<tr>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>\s*<\/td>/g;

  let match;
  while ((match = rowRegex.exec(content)) !== null) {
    const url = match[2];
    const videoId = (url.match(/v=([^&]+)/) || [])[1] || url.split('/').pop() || '';

    videos.push({
      index: parseInt(match[1]),
      videoId,
      url,
      title: match[3].trim(),
    });
  }

  console.log(`   Found ${videos.length} videos\n`);
  return videos;
}

function isProcessed(videoId, index) {
  try {
    const files = fs.readdirSync(REPORTS_DIR);
    return files.some((f) => f.includes(videoId) || f.includes(`_${index}_`));
  } catch {
    return false;
  }
}

function exportAllVideos(videos) {
  const urls = videos.map((v) => v.url).join('\n');
  const filename = path.join(OUTPUT_DIR, 'all-videos-urls.txt');
  fs.writeFileSync(filename, urls);

  console.log('✅ All Videos');
  console.log(`   Count: ${videos.length}`);
  console.log(`   File: ${filename}\n`);

  return filename;
}

function exportUnprocessedVideos(videos) {
  const unprocessed = videos.filter((v) => !isProcessed(v.videoId, v.index));
  const urls = unprocessed.map((v) => v.url).join('\n');
  const filename = path.join(OUTPUT_DIR, 'unprocessed-videos-urls.txt');
  fs.writeFileSync(filename, urls);

  console.log('⏳ Unprocessed Videos');
  console.log(`   Count: ${unprocessed.length}`);
  console.log(`   File: ${filename}\n`);

  return filename;
}

function exportProcessedVideos(videos) {
  const processed = videos.filter((v) => isProcessed(v.videoId, v.index));
  const urls = processed.map((v) => v.url).join('\n');
  const filename = path.join(OUTPUT_DIR, 'processed-videos-urls.txt');
  fs.writeFileSync(filename, urls);

  console.log('✅ Processed Videos');
  console.log(`   Count: ${processed.length}`);
  console.log(`   File: ${filename}\n`);

  return filename;
}

function exportRecentVideos(videos, count = 50) {
  const recent = videos.slice(-count);
  const urls = recent.map((v) => v.url).join('\n');
  const filename = path.join(OUTPUT_DIR, `recent-${count}-videos-urls.txt`);
  fs.writeFileSync(filename, urls);

  console.log(`📅 Recent ${count} Videos`);
  console.log(`   Count: ${recent.length}`);
  console.log(`   File: ${filename}\n`);

  return filename;
}

function exportByBatch(videos, batchSize = 50) {
  const batches = [];
  for (let i = 0; i < videos.length; i += batchSize) {
    const batch = videos.slice(i, i + batchSize);
    const urls = batch.map((v) => v.url).join('\n');
    const batchNum = Math.floor(i / batchSize) + 1;
    const filename = path.join(OUTPUT_DIR, `batch-${batchNum}-urls.txt`);
    fs.writeFileSync(filename, urls);
    batches.push({ num: batchNum, count: batch.length, filename });
  }

  console.log(`📦 Batched Exports (${batchSize} per file)`);
  batches.forEach((b) => {
    console.log(`   Batch ${b.num}: ${b.count} videos → ${b.filename}`);
  });
  console.log();

  return batches;
}

function exportWithTitles(videos) {
  const lines = videos.map((v) => `${v.title}\n${v.url}`).join('\n\n');
  const filename = path.join(OUTPUT_DIR, 'videos-with-titles.txt');
  fs.writeFileSync(filename, lines);

  console.log('📝 Videos with Titles');
  console.log(`   Count: ${videos.length}`);
  console.log(`   File: ${filename}\n`);

  return filename;
}

function exportJSON(videos) {
  const data = videos.map((v) => ({
    index: v.index,
    title: v.title,
    url: v.url,
    videoId: v.videoId,
    processed: isProcessed(v.videoId, v.index),
  }));

  const filename = path.join(OUTPUT_DIR, 'videos-catalog.json');
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));

  console.log('📊 JSON Catalog');
  console.log(`   Count: ${videos.length}`);
  console.log(`   File: ${filename}\n`);

  return filename;
}

function generateReadme(exports) {
  const readme = `# NotebookLM Video Exports

Generated: ${new Date().toISOString()}

## Usage

1. Go to https://notebooklm.google.com
2. Create a new notebook
3. Click "Sources" → "+" → "YouTube URLs"
4. Copy contents from one of the files below
5. Paste into NotebookLM
6. Click "Add Sources"

## Files

${exports.map((e) => `- **${e.name}**: ${e.description} (${e.count} videos)\n  \`${e.filename}\``).join('\n\n')}

## Notes

- NotebookLM imports text transcripts only
- Public videos only (no private/unlisted)
- Recently uploaded may not be available
- Separate multiple URLs with space or newline
- Maximum URLs per batch: Recommend 50-100 for best results

## Alternatives

If NotebookLM bulk import doesn't work well:
1. Use our consolidated markdown (data/consolidated_ai_knowledge.md)
2. Use AI Video Intelligence Suite Chrome extension
3. Process via Direct API (DirectAPIProcessor.js)
`;

  const filename = path.join(OUTPUT_DIR, 'README.md');
  fs.writeFileSync(filename, readme);

  console.log('📖 README Generated');
  console.log(`   File: ${filename}\n`);
}

function main() {
  console.log('🎬 NotebookLM Export Generator\n');
  console.log('═'.repeat(70));
  console.log('\n');

  const videos = loadVideoLibrary();

  const exports = [];

  // Generate exports
  const allFile = exportAllVideos(videos);
  exports.push({
    name: 'All Videos',
    description: 'Complete video library',
    count: videos.length,
    filename: path.basename(allFile),
  });

  const processedFile = exportProcessedVideos(videos);
  const processedCount = videos.filter((v) => isProcessed(v.videoId, v.index)).length;
  exports.push({
    name: 'Processed Videos',
    description: 'Videos with AI analysis reports',
    count: processedCount,
    filename: path.basename(processedFile),
  });

  const unprocessedFile = exportUnprocessedVideos(videos);
  const unprocessedCount = videos.filter((v) => !isProcessed(v.videoId, v.index)).length;
  exports.push({
    name: 'Unprocessed Videos',
    description: 'Videos needing processing',
    count: unprocessedCount,
    filename: path.basename(unprocessedFile),
  });

  const recentFile = exportRecentVideos(videos, 50);
  exports.push({
    name: 'Recent 50 Videos',
    description: 'Latest additions to library',
    count: Math.min(50, videos.length),
    filename: path.basename(recentFile),
  });

  const titlesFile = exportWithTitles(videos);
  exports.push({
    name: 'Videos with Titles',
    description: 'URLs with readable titles',
    count: videos.length,
    filename: path.basename(titlesFile),
  });

  const jsonFile = exportJSON(videos);
  exports.push({
    name: 'JSON Catalog',
    description: 'Structured data for processing',
    count: videos.length,
    filename: path.basename(jsonFile),
  });

  console.log('📦 Batch Exports');
  exportByBatch(videos, 50);

  // Generate README
  generateReadme(exports);

  console.log('═'.repeat(70));
  console.log('\n✅ Export complete!\n');
  console.log(`📁 All files saved to: ${OUTPUT_DIR}/\n`);
  console.log('🚀 Next steps:\n');
  console.log('1. Choose an export file based on your needs');
  console.log('2. Go to https://notebooklm.google.com');
  console.log('3. Create notebook → Add sources → YouTube URLs');
  console.log('4. Paste contents from export file');
  console.log('5. Generate audio overview for podcast!\n');
}

main();
