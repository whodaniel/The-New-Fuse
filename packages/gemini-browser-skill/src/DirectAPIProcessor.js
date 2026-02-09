#!/usr/bin/env node

/**
 * Direct API Video Processor
 *
 * Uses Gemini REST API directly instead of browser automation
 * Bypasses AI Studio permission issues
 * Fully automated processing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LIBRARY_FILE = path.join(process.cwd(), '..', '..', 'ai_video_library.html');
const DATA_DIR = path.join(process.cwd(), '..', '..', 'data');
const REPORTS_DIR = path.join(DATA_DIR, 'video-reports');

// Get API key from environment
const API_KEY = process.env.GEMINI_API_KEY || '';

if (!API_KEY) {
  console.error('❌ Error: GEMINI_API_KEY environment variable not set');
  console.error('Set it with: export GEMINI_API_KEY="your-api-key-here"');
  process.exit(1);
}

const ANALYSIS_PROMPT = `Analyze this YouTube video transcript and extract:

Key Points: Main takeaways and important information
AI Concepts: Any AI, machine learning, or technical AI-related concepts mentioned
Technical Details: Implementation details, tools, frameworks, or technical specifics
Visual Context Flags: Identify sections where the speaker likely shows something on screen (code demos, diagrams, UI walkthroughs) that would require watching the video to fully understand. Include approximate timestamps.

Format your response as structured JSON:

{
  "keyPoints": ["point1", "point2", ...],
  "aiConcepts": ["concept1", "concept2", ...],
  "technicalDetails": ["detail1", "detail2", ...],
  "visualContextFlags": [
    {"timestamp": 123, "reason": "Code demonstration", "context": "Shows implementation of..."},
    ...
  ],
  "summary": "Brief 2-3 sentence summary"
}

TRANSCRIPT:
`;

async function callGeminiAPI(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const body = JSON.stringify({
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function fetchTranscript(videoId) {
  try {
    // Use yt-dlp to get transcript
    const cmd = `yt-dlp --skip-download --write-auto-sub --sub-lang en --sub-format json3 --output "temp_%(id)s" "https://www.youtube.com/watch?v=${videoId}"`;
    execSync(cmd, { cwd: DATA_DIR, stdio: 'pipe' });

    // Read the subtitle file
    const subFile = path.join(DATA_DIR, `temp_${videoId}.en.json3`);
    if (fs.existsSync(subFile)) {
      const data = JSON.parse(fs.readFileSync(subFile, 'utf-8'));
      const transcript = data.events
        .filter((e) => e.segs)
        .map((e) => e.segs.map((s) => s.utf8).join(''))
        .join(' ');

      // Cleanup
      fs.unlinkSync(subFile);

      return transcript;
    }
  } catch (e) {
    console.error(`Failed to fetch transcript for ${videoId}:`, e.message);
  }

  return '';
}

async function processVideo(video) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`Processing #${video.index}: ${video.title}`);
  console.log(`${'═'.repeat(70)}\n`);

  try {
    // 1. Fetch transcript
    console.log('[API] 📝 Fetching transcript...');
    const transcript = await fetchTranscript(video.videoId);

    if (!transcript) {
      console.log('[API] ⚠️ No transcript available, skipping');
      return false;
    }

    console.log(`[API] ✅ Transcript: ${transcript.length} characters`);

    // 2. Send to Gemini API
    console.log('[API] 🤖 Sending to Gemini API...');
    const fullPrompt = ANALYSIS_PROMPT + transcript.substring(0, 25000);

    const response = await callGeminiAPI(fullPrompt);
    console.log('[API] ✅ Analysis received');

    // 3. Save report
    const reportPath = path.join(REPORTS_DIR, `api_${video.index}_${video.videoId}.md`);
    const report = `# ${video.title}

**Video ID:** ${video.videoId}
**URL:** ${video.url}
**Processed:** ${new Date().toISOString()}

## AI Analysis

${response}

---

*Generated via Gemini API*
`;

    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`[API] ✅ Report saved: ${path.basename(reportPath)}\n`);

    return true;
  } catch (error) {
    console.error(`[API] ❌ Error processing video:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Direct API Video Processor');
  console.log('Using Gemini REST API (bypassing browser automation)\n');

  // Ensure directories exist
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  // Load video library
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

  console.log(`📚 Loaded ${videos.length} videos from library\n`);

  // Process videos
  let completed = 0;
  let skipped = 0;
  let errors = 0;

  for (const video of videos) {
    // Check if already processed (check for both naming patterns)
    const apiReport = path.join(REPORTS_DIR, `api_${video.index}_${video.videoId}.md`);
    const transcriptPattern = new RegExp(`transcript_${video.index}_.*\\.md`);
    const existingReports = fs
      .readdirSync(REPORTS_DIR)
      .filter((f) => f === path.basename(apiReport) || transcriptPattern.test(f));

    if (existingReports.length > 0) {
      console.log(`⏭️ Skipping #${video.index} (already processed: ${existingReports[0]})`);
      skipped++;
      continue;
    }

    const success = await processVideo(video);

    if (success) {
      completed++;
    } else {
      errors++;
    }

    // Progress update
    console.log(
      `📊 Progress: ${completed + skipped}/${videos.length} total (${completed} new, ${skipped} skipped, ${errors} errors)\n`
    );

    // Rate limiting - wait 1 second between requests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('\n🎉 Processing complete!');
  console.log(`✅ Newly Completed: ${completed}`);
  console.log(`⏭️ Skipped (already done): ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
}

main().catch(console.error);
