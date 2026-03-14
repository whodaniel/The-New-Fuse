#!/usr/bin/env node

/**
 * Process Recent YouTube Watch History
 *
 * Fetches recent videos, adds them to library, and processes them
 *
 * Usage:
 *   export GEMINI_API_KEY="your-key"
 *   node cli/process-recent-watch-history.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const config = require('../lib/config');

const LIBRARY_FILE = config.libraryFile;
const REPORTS_DIR = config.reportsDir;
const DATA_DIR = config.transcriptsDir || path.join(path.dirname(REPORTS_DIR), 'transcripts');
const RECENT_VIDEOS_FILE = path.join(__dirname, '..', 'recent-videos.json');

const API_KEY = process.env.GEMINI_API_KEY || '';

if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY not set!');
  console.error('export GEMINI_API_KEY="your-key-here"');
  process.exit(1);
}

// Ensure directories exist
fs.mkdirSync(REPORTS_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

const ANALYSIS_PROMPT = `Analyze this YouTube video transcript about AI/technology and extract structured information:

KEY POINTS:
- Main takeaways and important insights

AI CONCEPTS:
- AI/ML concepts discussed
- Frameworks and tools mentioned

TECHNICAL DETAILS:
- Implementation specifics

VISUAL CONTEXT FLAGS:
- Sections where visual content is crucial

Format as valid JSON:
{
  "keyPoints": ["point1", "point2", ...],
  "aiConcepts": ["concept1", "concept2", ...],
  "technicalDetails": ["detail1", "detail2", ...],
  "visualContextFlags": [{"timestamp": "MM:SS", "description": "What is shown"}],
  "summary": "2-3 sentence summary"
}

TRANSCRIPT:
`;

function extractVideoId(url) {
  const match = url.match(/v=([^&]+)/);
  return match ? match[1] : url.split('/').pop();
}

function isAlreadyInLibrary(videoId) {
  const libContent = fs.readFileSync(LIBRARY_FILE, 'utf-8');
  return libContent.includes(videoId);
}

function isAlreadyProcessed(videoId) {
  try {
    const allReports = fs.readdirSync(REPORTS_DIR);
    return allReports.some((file) => file.includes(videoId));
  } catch {
    return false;
  }
}

function getNextIndex() {
  const libContent = fs.readFileSync(LIBRARY_FILE, 'utf-8');
  const indices = [...libContent.matchAll(/<td[^>]*>\s*(\d+)\s*<\/td>/g)].map((m) =>
    parseInt(m[1])
  );
  return Math.max(...indices) + 1;
}

function addToLibrary(video, index) {
  const libContent = fs.readFileSync(LIBRARY_FILE, 'utf-8');
  const newRow = `            <tr>
                <td class="index-col">${index}</td>
                <td class="title-col">
                    <a href="${video.url}" target="_blank">${video.title}</a>
                </td>
                <td class="duration-col">--:--</td>
            </tr>
`;

  // Insert before closing tbody
  const insertPoint = libContent.lastIndexOf('</tbody>');
  const newContent = libContent.slice(0, insertPoint) + newRow + libContent.slice(insertPoint);
  fs.writeFileSync(LIBRARY_FILE, newContent, 'utf-8');

  // Update counter
  const newCounter = libContent.replace(/Total entries: \d+/, `Total entries: ${index}`);
  fs.writeFileSync(LIBRARY_FILE, newCounter, 'utf-8');
}

async function callGeminiAPI(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function fetchTranscript(videoId) {
  try {
    const tempFilePrefix = `temp_recent_${videoId}`;
    const cmd = `yt-dlp --skip-download --write-auto-sub --sub-langs en --sub-format json3 --output "${tempFilePrefix}" "https://www.youtube.com/watch?v=${videoId}" 2>&1`;
    execSync(cmd, { cwd: DATA_DIR, stdio: 'pipe', timeout: 60000 });

    const possibleFiles = [
      path.join(DATA_DIR, `${tempFilePrefix}.en.json3`),
      path.join(DATA_DIR, `${tempFilePrefix}.en-US.json3`),
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

async function processVideo(video, index) {
  console.log(`\n🎬 Processing #${index}: ${video.title.substring(0, 60)}...`);

  try {
    const transcript = await fetchTranscript(video.videoId);
    if (!transcript || transcript.length < 100) {
      console.log('   ⚠️ No transcript, skipping');
      return { status: 'skipped', reason: 'no_transcript' };
    }
    console.log(`   ✅ Transcript: ${transcript.length.toLocaleString()} chars`);

    const response = await callGeminiAPI(ANALYSIS_PROMPT + transcript.substring(0, 30000));
    console.log('   ✅ Analysis complete');

    const reportPath = path.join(REPORTS_DIR, `api_${index}_${video.videoId}.md`);
    const report = `# ${video.title}\n\n**Video ID:** ${video.videoId}\n**URL:** ${video.url}\n**Channel:** ${video.channel}\n**Processed:** ${new Date().toISOString()}\n**Index:** ${index}\n\n---\n\n## AI Analysis\n\n${response}\n\n---\n\n*Generated by AI Video Intelligence Suite*\n`;
    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`   ✅ Report saved`);

    return { status: 'success' };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { status: 'error', error: error.message };
  }
}

async function main() {
  console.log('🚀 Process Recent Watch History\n' + '═'.repeat(70) + '\n');

  // Check for recent-videos.json
  if (!fs.existsSync(RECENT_VIDEOS_FILE)) {
    console.log('❌ recent-videos.json not found!\n');
    console.log('To create it:');
    console.log('1. Go to https://gemini.google.com');
    console.log('2. Ask: "Show me my last 50 YouTube watch history for tech/AI videos"');
    console.log('3. Save JSON response to: recent-videos.json\n');
    process.exit(1);
  }

  // Load recent videos
  const recentVideos = JSON.parse(fs.readFileSync(RECENT_VIDEOS_FILE, 'utf-8'));
  console.log(`📚 Loaded ${recentVideos.length} recent videos\n`);

  // Categorize videos
  const newVideos = [];
  const alreadyProcessed = [];
  const inLibraryNotProcessed = [];

  for (const video of recentVideos) {
    const videoId = extractVideoId(video.url);
    video.videoId = videoId;

    if (isAlreadyProcessed(videoId)) {
      alreadyProcessed.push(video);
    } else if (isAlreadyInLibrary(videoId)) {
      inLibraryNotProcessed.push(video);
    } else {
      newVideos.push(video);
    }
  }

  console.log('📊 Analysis:');
  console.log(`   ✅ Already processed: ${alreadyProcessed.length}`);
  console.log(`   📚 In library: ${inLibraryNotProcessed.length}`);
  console.log(`   🆕 New videos: ${newVideos.length}\n`);

  if (newVideos.length === 0 && inLibraryNotProcessed.length === 0) {
    console.log('✅ All recent videos already processed!\n');
    return;
  }

  // Process new videos
  if (newVideos.length > 0) {
    console.log('═'.repeat(70));
    console.log(`\n🆕 Adding ${newVideos.length} new videos to library...\n`);

    let nextIndex = getNextIndex();

    for (const video of newVideos) {
      console.log(`   Adding #${nextIndex}: ${video.title.substring(0, 50)}...`);
      addToLibrary(video, nextIndex);
      nextIndex++;
    }

    console.log(`\n✅ Added ${newVideos.length} videos to library\n`);

    // Process them
    console.log('═'.repeat(70));
    console.log('\n🔄 Processing new videos...\n');

    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;

    // Re-get next index after adding
    nextIndex = getNextIndex() - newVideos.length;

    for (const video of newVideos) {
      const result = await processVideo(video, nextIndex);
      if (result.status === 'success') successCount++;
      else if (result.status === 'error') errorCount++;
      else if (result.status === 'skipped') skipCount++;
      nextIndex++;

      // Rate limiting
      await new Promise((r) => setTimeout(r, 500));
    }

    console.log(
      `\n✅ Success: ${successCount} | ⏭️ Skipped: ${skipCount} | ❌ Failed: ${errorCount}\n`
    );
  }

  // Process videos that were in library but not processed
  if (inLibraryNotProcessed.length > 0) {
    console.log('═'.repeat(70));
    console.log(`\n📚 Processing ${inLibraryNotProcessed.length} videos from library...\n`);

    // Find their indices
    const libContent = fs.readFileSync(LIBRARY_FILE, 'utf-8');

    for (const video of inLibraryNotProcessed) {
      const indexMatch = libContent.match(
        new RegExp(
          `<td[^>]*>\\s*(\\d+)\\s*<\\/td>\\s*<td[^>]*>\\s*<a\\s+href="[^"]*${video.videoId}[^"]*"`
        )
      );
      const index = indexMatch ? parseInt(indexMatch[1]) : null;

      if (index) {
        const result = await processVideo(video, index);
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log('🎉 Recent videos processing complete!');
  console.log('═'.repeat(70) + '\n');
  console.log('Next steps:');
  console.log('   node cli/generate-kb.js    # Update knowledge base');
  console.log('   node cli/status.js         # Check status\n');
}

main().catch(console.error);
