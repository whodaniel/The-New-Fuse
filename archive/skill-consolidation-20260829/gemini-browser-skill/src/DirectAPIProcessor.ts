#!/usr/bin/env ts-node

/**
 * Direct API Video Processor
 *
 * Uses Gemini REST API directly instead of browser automation
 * Bypasses AI Studio permission issues
 * Fully automated processing
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const LIBRARY_FILE = path.join(process.cwd(), '..', '..', 'ai_video_library.html');
const DATA_DIR = path.join(process.cwd(), '..', '..', 'data');
const REPORTS_DIR = '/Users/<owner>/Documents/Video-Intelligence-Archive/';
const STATE_FILE = path.join(process.cwd(), 'data', 'processing_state.json');
const MASTER_INDEX_FILE = path.join(REPORTS_DIR, 'MASTER_CHRONOLOGICAL_INDEX.md');

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

interface VideoEntry {
  index: number;
  videoId: string;
  url: string;
  title: string;
  transcript?: string;
  status: string;
}

async function callGeminiAPI(prompt: string): Promise<string> {
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

async function fetchTranscript(videoId: string): Promise<string> {
  try {
    // Use yt-dlp to get transcript
    const cmd = `yt-dlp --skip-download --write-auto-sub --sub-lang en --sub-format json3 --output "temp_%(id)s" "https://www.youtube.com/watch?v=${videoId}"`;
    execSync(cmd, { cwd: DATA_DIR });

    // Read the subtitle file
    const subFile = path.join(DATA_DIR, `temp_${videoId}.en.json3`);
    if (fs.existsSync(subFile)) {
      const data = JSON.parse(fs.readFileSync(subFile, 'utf-8'));
      const transcript = data.events
        .filter((e: any) => e.segs)
        .map((e: any) => e.segs.map((s: any) => s.utf8).join(''))
        .join(' ');

      // Cleanup
      fs.unlinkSync(subFile);

      return transcript;
    }
  } catch (e) {
    console.error(`Failed to fetch transcript for ${videoId}:`, e);
  }

  return '';
}

async function processVideo(video: VideoEntry): Promise<boolean> {
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

    // Update master index
    appendVideoToIndex(video, path.basename(reportPath));

    return true;
  } catch (error) {
    console.error(`[API] ❌ Error processing video:`, error);
    return false;
  }
}

/**
 * Appends a video summary to the master chronological index
 */
function appendVideoToIndex(video: VideoEntry, reportFilename: string) {
  if (!fs.existsSync(MASTER_INDEX_FILE)) {
    fs.writeFileSync(
      MASTER_INDEX_FILE,
      '# Master Chronological Video Intelligence Index\n\n',
      'utf-8'
    );
  }

  const content = fs.readFileSync(MASTER_INDEX_FILE, 'utf-8');
  const entryHeader = `## Video #${video.index}: ${video.title}`;

  if (content.includes(entryHeader)) return;

  const reportPath = path.join(REPORTS_DIR, reportFilename);
  const reportContent = fs.readFileSync(reportPath, 'utf-8');

  // Extract key points from the report if available
  let keyPoints = '';
  const keyPointsMatch = reportContent.match(/## Key Points[\s\S]*?(?=\n##|$)/);
  if (keyPointsMatch) {
    keyPoints = keyPointsMatch[0].replace('## Key Points', '').trim();
  } else {
    // Try to find in JSON
    const jsonMatch = reportContent.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        const json = JSON.parse(jsonMatch[1]);
        if (json.keyPoints) {
          keyPoints = json.keyPoints.map((p: string) => `- ${p}`).join('\n');
        }
      } catch (e) {}
    }
  }

  const entry = `
${entryHeader}
- **URL**: ${video.url}
- **Report**: [Link](./${reportFilename})
- **Summary Points**:
${keyPoints || '- No key points extracted yet.'}

---
`;

  fs.appendFileSync(MASTER_INDEX_FILE, entry, 'utf-8');
}

async function main() {
  console.log('🚀 Direct API Video Processor');
  console.log('Using Gemini REST API (bypassing browser automation)\n');

  // Ensure directories exist
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  // Load video library
  const libContent = fs.readFileSync(LIBRARY_FILE, 'utf-8');
  const videos: VideoEntry[] = [];
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
  let errors = 0;

  for (const video of videos) {
    // Check if already processed (check for api_, transcript_, or v2_ prefixes)
    const existingReports = fs
      .readdirSync(REPORTS_DIR)
      .filter(
        (f) =>
          f.startsWith(`api_${video.index}_`) ||
          f.startsWith(`transcript_${video.index}_`) ||
          f.startsWith(`v2_${video.index}_`)
      );

    if (existingReports.length > 0) {
      console.log(`⏭️ Skipping #${video.index} (Found: ${existingReports[0]})`);
      completed++;

      // Update master index if needed
      appendVideoToIndex(video, existingReports[0]);
      continue;
    }

    const success = await processVideo(video);

    if (success) {
      completed++;
    } else {
      errors++;
    }

    // Progress update
    console.log(`📊 Progress: ${completed}/${videos.length} completed, ${errors} errors\n`);

    // Rate limiting - wait 1 second between requests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('\n🎉 Processing complete!');
  console.log(`✅ Completed: ${completed}`);
  console.log(`❌ Errors: ${errors}`);
}

main().catch(console.error);
