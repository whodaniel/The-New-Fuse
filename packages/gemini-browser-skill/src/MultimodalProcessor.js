#!/usr/bin/env node

/**
 * Multimodal Video Processor
 *
 * Processes videos WITHOUT transcripts using Gemini's video understanding
 * Uses gemini-2.0-flash-thinking-exp for video + audio analysis
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
  process.exit(1);
}

const ANALYSIS_PROMPT = `Analyze this video comprehensively and extract:

Key Points: Main takeaways and important information shown or discussed
AI Concepts: Any AI, machine learning, or technical AI-related concepts mentioned or demonstrated
Technical Details: Implementation details, tools, frameworks, code shown, or technical specifics
Visual Elements: Important visual information (diagrams, code, UI demonstrations, charts, etc.)
Summary: Brief 2-3 sentence summary of the video content

Format your response as structured JSON:

{
  "keyPoints": ["point1", "point2", ...],
  "aiConcepts": ["concept1", "concept2", ...],
  "technicalDetails": ["detail1", "detail2", ...],
  "visualElements": ["element1", "element2", ...],
  "summary": "Brief overview..."
}`;

async function callGeminiVideoAPI(videoUrl) {
  // For now, use the thinking model with video file upload
  // This requires downloading the video first
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp-01-21:generateContent?key=${API_KEY}`;

  console.log('[MULTIMODAL] 🎥 Processing video URL:', videoUrl);
  console.log('[MULTIMODAL] ⚠️  Note: Full video upload not yet implemented');
  console.log('[MULTIMODAL] 💡 Recommendation: Use Gemini File API to upload video first');

  return null;
}

async function processVideo(video) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`Processing #${video.index}: ${video.title}`);
  console.log(`${'═'.repeat(70)}\n`);

  try {
    console.log('[MULTIMODAL] 📝 Video requires multimodal analysis (no transcript)');

    // TODO: Implement full multimodal processing
    // 1. Download video using yt-dlp
    // 2. Upload to Gemini File API
    // 3. Send to Gemini with video understanding
    // 4. Parse response
    // 5. Save report

    console.log('[MULTIMODAL] ⚠️  Multimodal processing not yet implemented');
    console.log('[MULTIMODAL] 💡 Manual review recommended for:', video.url);

    return false;
  } catch (error) {
    console.error(`[MULTIMODAL] ❌ Error processing video:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🎥 Multimodal Video Processor');
  console.log('Processing videos WITHOUT transcripts\n');

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
    });
  }

  console.log(`📚 Loaded ${videos.length} videos from library\n`);

  // Find videos without reports
  const missingVideos = [];
  for (const video of videos) {
    const apiReport = path.join(REPORTS_DIR, `api_${video.index}_${video.videoId}.md`);
    const transcriptPattern = new RegExp(`transcript_${video.index}_.*\\.md`);

    try {
      const existingReports = fs
        .readdirSync(REPORTS_DIR)
        .filter((f) => f === path.basename(apiReport) || transcriptPattern.test(f));

      if (existingReports.length === 0) {
        missingVideos.push(video);
      }
    } catch (e) {
      // Directory might not exist yet
    }
  }

  console.log(`🎯 Found ${missingVideos.length} videos without reports\n`);
  console.log('Videos requiring multimodal processing:');
  console.log('─'.repeat(70));

  missingVideos.forEach((video, idx) => {
    console.log(`${idx + 1}. #${video.index}: ${video.title}`);
    console.log(`   URL: ${video.url}`);
  });

  console.log('\n' + '─'.repeat(70));
  console.log('\n⚠️  MULTIMODAL PROCESSING NOT YET IMPLEMENTED');
  console.log('\n📋 Next Steps:');
  console.log('1. Implement Gemini File API integration');
  console.log('2. Download videos with yt-dlp');
  console.log('3. Upload to Gemini File API');
  console.log('4. Process with gemini-2.0-flash-thinking-exp');
  console.log('5. Save multimodal reports\n');
}

main().catch(console.error);
