#!/usr/bin/env node

/**
 * Batch Video Processor
 *
 * Processes YouTube videos in batches with:
 * - Resume capability (tracks progress)
 * - Error handling and retry logic
 * - Progress tracking and reporting
 *
 * Usage:
 *   node cli/batch-processor.js --resume
 *   node cli/batch-processor.js --start=1 --end=100
 *   node cli/batch-processor.js --resume --batch-size=25
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load config from project root
const config = require('../lib/config');

// Configuration
const LIBRARY_FILE = config.libraryFile;
const REPORTS_DIR = config.reportsDir;
const DATA_DIR = config.transcriptsDir || path.join(path.dirname(REPORTS_DIR), 'transcripts');
const PROGRESS_FILE = path.join(__dirname, '..', 'processing-progress.json');

// Get API key from environment
const API_KEY = process.env.GEMINI_API_KEY || '';

if (!API_KEY) {
  console.error('❌ Error: GEMINI_API_KEY environment variable not set');
  console.error('Set it with: export GEMINI_API_KEY="your-api-key-here"');
  process.exit(1);
}

// Ensure directories exist
fs.mkdirSync(REPORTS_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

// Analysis prompt
const ANALYSIS_PROMPT = `Analyze this YouTube video transcript about AI/technology and extract structured information:

KEY POINTS:
- Main takeaways and important insights
- Actionable advice or recommendations

AI CONCEPTS:
- AI/ML concepts discussed (e.g., transformers, embeddings, RAG)
- Frameworks and tools mentioned (e.g., LangChain, LlamaIndex, PyTorch)
- Architecture patterns and methodologies

TECHNICAL DETAILS:
- Implementation specifics
- Code examples or configuration details
- Performance metrics or benchmarks

VISUAL CONTEXT FLAGS:
- Sections where visual content is crucial (code demos, diagrams, UI walkthroughs)
- Timestamps where watching would provide additional understanding

Format as valid JSON:
{
  "keyPoints": ["point1", "point2", ...],
  "aiConcepts": ["concept1", "concept2", ...],
  "technicalDetails": ["detail1", "detail2", ...],
  "visualContextFlags": [
    {"timestamp": "MM:SS", "description": "What is shown"}
  ],
  "summary": "2-3 sentence summary"
}

TRANSCRIPT:
`;

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return {
    completed: [],
    failed: [],
    skipped: [],
    lastProcessedIndex: null,
    startTime: null,
    totalVideos: 0,
  };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function loadVideoLibrary() {
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
      status: 'pending',
    });
  }
  return videos;
}

async function callGeminiAPI(prompt, maxRetries = 3) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

async function fetchTranscript(videoId) {
  try {
    const tempFilePrefix = `temp_${videoId}`;
    const cmd = `yt-dlp --skip-download --write-auto-sub --sub-langs en --sub-format json3 --output "${tempFilePrefix}" "https://www.youtube.com/watch?v=${videoId}" 2>&1`;
    execSync(cmd, { cwd: DATA_DIR, stdio: 'pipe', timeout: 60000 });

    const possibleFiles = [
      path.join(DATA_DIR, `${tempFilePrefix}.en.json3`),
      path.join(DATA_DIR, `${tempFilePrefix}.en-US.json3`),
      path.join(DATA_DIR, `${tempFilePrefix}.en-GB.json3`),
    ];

    for (const subFile of possibleFiles) {
      if (fs.existsSync(subFile)) {
        const data = JSON.parse(fs.readFileSync(subFile, 'utf-8'));
        const transcript = data.events
          .filter((e) => e.segs)
          .map((e) => e.segs.map((s) => s.utf8).join(''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        try {
          fs.unlinkSync(subFile);
        } catch {}
        return transcript;
      }
    }
  } catch {}
  return '';
}

async function processVideo(video, progress) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(
    `🎬 #${video.index}: ${video.title.substring(0, 60)}${video.title.length > 60 ? '...' : ''}`
  );
  console.log(`${'═'.repeat(70)}\n`);

  try {
    console.log('[1/3] 📝 Fetching transcript...');
    const transcript = await fetchTranscript(video.videoId);
    if (!transcript || transcript.length < 100) {
      console.log('   ⚠️ No transcript, skipping');
      progress.skipped.push({
        index: video.index,
        videoId: video.videoId,
        reason: 'no_transcript',
      });
      saveProgress(progress);
      return { status: 'skipped' };
    }
    console.log(`   ✅ ${transcript.length.toLocaleString()} chars`);

    console.log('[2/3] 🤖 Analyzing...');
    const response = await callGeminiAPI(ANALYSIS_PROMPT + transcript.substring(0, 30000));
    console.log('   ✅ Analysis complete');

    console.log('[3/3] 💾 Saving...');
    const reportPath = path.join(REPORTS_DIR, `api_${video.index}_${video.videoId}.md`);
    const report = `# ${video.title}\n\n**Video ID:** ${video.videoId}\n**URL:** ${video.url}\n**Processed:** ${new Date().toISOString()}\n**Index:** ${video.index}\n\n---\n\n## AI Analysis\n\n${response}\n\n---\n\n*Generated by AI Video Intelligence Suite*\n`;
    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`   ✅ Saved: ${path.basename(reportPath)}`);

    progress.completed.push({
      index: video.index,
      videoId: video.videoId,
      title: video.title,
      timestamp: new Date().toISOString(),
    });
    progress.lastProcessedIndex = video.index;
    saveProgress(progress);
    return { status: 'success' };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    progress.failed.push({
      index: video.index,
      videoId: video.videoId,
      title: video.title,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
    saveProgress(progress);
    return { status: 'error', error: error.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const resumeMode = args.includes('--resume');
  const startArg = args.find((a) => a.startsWith('--start='));
  const endArg = args.find((a) => a.startsWith('--end='));
  const batchSizeArg = args.find((a) => a.startsWith('--batch-size='));

  const startIndex = startArg ? parseInt(startArg.split('=')[1]) : null;
  const endIndex = endArg ? parseInt(endArg.split('=')[1]) : null;
  const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 50;

  console.log('🚀 Batch Video Processor\n' + '═'.repeat(70) + '\n');

  const progress = loadProgress();
  const allVideos = loadVideoLibrary();
  console.log(`📚 ${allVideos.length} videos in library\n`);

  let videosToProcess = allVideos;
  if (resumeMode) {
    const completedIndices = new Set(progress.completed.map((v) => v.index));
    videosToProcess = allVideos.filter((v) => !completedIndices.has(v.index));
    console.log(`▶️ Resume: ${videosToProcess.length} remaining\n`);
  } else if (startIndex && endIndex) {
    videosToProcess = allVideos.filter((v) => v.index >= startIndex && v.index <= endIndex);
    console.log(`🎯 Range #${startIndex}-#${endIndex}\n`);
  }

  if (!progress.startTime) {
    progress.startTime = new Date().toISOString();
    progress.totalVideos = allVideos.length;
  }
  saveProgress(progress);

  console.log(`📊 Processing ${videosToProcess.length} videos (batches of ${batchSize})\n`);

  let successCount = 0,
    errorCount = 0,
    skipCount = 0;

  for (let i = 0; i < videosToProcess.length; i += batchSize) {
    const batchNum = Math.floor(i / batchSize) + 1;
    const batch = videosToProcess.slice(i, i + batchSize);

    console.log(`\n${'━'.repeat(70)}`);
    console.log(
      `📦 Batch ${batchNum}: ${i + 1}-${Math.min(i + batchSize, videosToProcess.length)}`
    );
    console.log(`${'━'.repeat(70)}`);

    for (const video of batch) {
      const result = await processVideo(video, progress);
      if (result.status === 'success') successCount++;
      else if (result.status === 'error') errorCount++;
      else if (result.status === 'skipped') skipCount++;
      await new Promise((r) => setTimeout(r, 500));
    }

    saveProgress(progress);
    console.log(`\n📈 Progress: ${progress.completed.length}/${allVideos.length} total`);

    if (i + batchSize < videosToProcess.length) {
      console.log('⏸️ Pausing 3s...\n');
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.log(`\n${'═'.repeat(70)}`);
  console.log('🎉 COMPLETE!');
  console.log(`${'═'.repeat(70)}\n`);
  console.log(`✅ Success: ${successCount} | ⏭️ Skipped: ${skipCount} | ❌ Failed: ${errorCount}`);
  console.log(
    `📊 Total: ${progress.completed.length}/${allVideos.length} (${((progress.completed.length / allVideos.length) * 100).toFixed(1)}%)\n`
  );
}

main().catch(console.error);
