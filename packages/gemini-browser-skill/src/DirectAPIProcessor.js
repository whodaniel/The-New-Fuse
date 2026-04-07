#!/usr/bin/env ts-node
"use strict";
/**
 * Direct API Video Processor
 *
 * Uses Gemini REST API directly instead of browser automation
 * Bypasses AI Studio permission issues
 * Fully automated processing
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const LIBRARY_FILE = path.join(process.cwd(), '..', '..', 'ai_video_library.html');
const DATA_DIR = path.join(process.cwd(), '..', '..', 'data');
const REPORTS_DIR = path.join(DATA_DIR, 'video-reports');
const STATE_FILE = path.join(process.cwd(), 'data', 'processing_state.json');
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
    var _a, _b, _c, _d, _e;
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
    return ((_e = (_d = (_c = (_b = (_a = data.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) || '';
}
async function fetchTranscript(videoId) {
    try {
        // Use yt-dlp to get transcript
        const cmd = `yt-dlp --skip-download --write-auto-sub --sub-lang en --sub-format json3 --output "temp_%(id)s" "https://www.youtube.com/watch?v=${videoId}"`;
        (0, child_process_1.execSync)(cmd, { cwd: DATA_DIR });
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
    }
    catch (e) {
        console.error(`Failed to fetch transcript for ${videoId}:`, e);
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
    }
    catch (error) {
        console.error(`[API] ❌ Error processing video:`, error);
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
    const rowRegex = /<tr>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>\s*<\/td>/g;
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
        // Check if already processed
        const reportExists = fs.existsSync(path.join(REPORTS_DIR, `api_${video.index}_${video.videoId}.md`));
        if (reportExists) {
            console.log(`⏭️ Skipping #${video.index} (already processed)`);
            completed++;
            continue;
        }
        const success = await processVideo(video);
        if (success) {
            completed++;
        }
        else {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGlyZWN0QVBJUHJvY2Vzc29yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiRGlyZWN0QVBJUHJvY2Vzc29yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILGlEQUF5QztBQUN6Qyx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBRTdCLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztBQUNuRixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzlELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLGVBQWUsQ0FBQyxDQUFDO0FBQ3pELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLE1BQU0sRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO0FBRTdFLCtCQUErQjtBQUMvQixNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsSUFBSSxFQUFFLENBQUM7QUFFakQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyxzREFBc0QsQ0FBQyxDQUFDO0lBQ3RFLE9BQU8sQ0FBQyxLQUFLLENBQUMsd0RBQXdELENBQUMsQ0FBQztJQUN4RSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xCLENBQUM7QUFFRCxNQUFNLGVBQWUsR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBcUJ2QixDQUFDO0FBV0YsS0FBSyxVQUFVLGFBQWEsQ0FBQyxNQUFjOztJQUN6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RUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO0lBQ3pDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLFNBQVMsRUFBRSxDQUFDLENBQUM7SUFDekMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLE1BQU0sRUFBRSxDQUFDLENBQUM7QUFDckMsQ0FBQztBQUVELElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiB0cy1ub2RlXG5cbi8qKlxuICogRGlyZWN0IEFQSSBWaWRlbyBQcm9jZXNzb3JcbiAqXG4gKiBVc2VzIEdlbWluaSBSRVNUIEFQSSBkaXJlY3RseSBpbnN0ZWFkIG9mIGJyb3dzZXIgYXV0b21hdGlvblxuICogQnlwYXNzZXMgQUkgU3R1ZGlvIHBlcm1pc3Npb24gaXNzdWVzXG4gKiBGdWxseSBhdXRvbWF0ZWQgcHJvY2Vzc2luZ1xuICovXG5cbmltcG9ydCB7IGV4ZWNTeW5jIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG5jb25zdCBMSUJSQVJZX0ZJTEUgPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJy4uJywgJy4uJywgJ2FpX3ZpZGVvX2xpYnJhcnkuaHRtbCcpO1xuY29uc3QgREFUQV9ESVIgPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJy4uJywgJy4uJywgJ2RhdGEnKTtcbmNvbnN0IFJFUE9SVFNfRElSID0gcGF0aC5qb2luKERBVEFfRElSLCAndmlkZW8tcmVwb3J0cycpO1xuY29uc3QgU1RBVEVfRklMRSA9IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAnZGF0YScsICdwcm9jZXNzaW5nX3N0YXRlLmpzb24nKTtcblxuLy8gR2V0IEFQSSBrZXkgZnJvbSBlbnZpcm9ubWVudFxuY29uc3QgQVBJX0tFWSA9IHByb2Nlc3MuZW52LkdFTUlOSV9BUElfS0VZIHx8ICcnO1xuXG5pZiAoIUFQSV9LRVkpIHtcbiAgY29uc29sZS5lcnJvcign4p2MIEVycm9yOiBHRU1JTklfQVBJX0tFWSBlbnZpcm9ubWVudCB2YXJpYWJsZSBub3Qgc2V0Jyk7XG4gIGNvbnNvbGUuZXJyb3IoJ1NldCBpdCB3aXRoOiBleHBvcnQgR0VNSU5JX0FQSV9LRVk9XCJ5b3VyLWFwaS1rZXktaGVyZVwiJyk7XG4gIHByb2Nlc3MuZXhpdCgxKTtcbn1cblxuY29uc3QgQU5BTFlTSVNfUFJPTVBUID0gYEFuYWx5emUgdGhpcyBZb3VUdWJlIHZpZGVvIHRyYW5zY3JpcHQgYW5kIGV4dHJhY3Q6XG5cbktleSBQb2ludHM6IE1haW4gdGFrZWF3YXlzIGFuZCBpbXBvcnRhbnQgaW5mb3JtYXRpb25cbkFJIENvbmNlcHRzOiBBbnkgQUksIG1hY2hpbmUgbGVhcm5pbmcsIG9yIHRlY2huaWNhbCBBSS1yZWxhdGVkIGNvbmNlcHRzIG1lbnRpb25lZFxuVGVjaG5pY2FsIERldGFpbHM6IEltcGxlbWVudGF0aW9uIGRldGFpbHMsIHRvb2xzLCBmcmFtZXdvcmtzLCBvciB0ZWNobmljYWwgc3BlY2lmaWNzXG5WaXN1YWwgQ29udGV4dCBGbGFnczogSWRlbnRpZnkgc2VjdGlvbnMgd2hlcmUgdGhlIHNwZWFrZXIgbGlrZWx5IHNob3dzIHNvbWV0aGluZyBvbiBzY3JlZW4gKGNvZGUgZGVtb3MsIGRpYWdyYW1zLCBVSSB3YWxrdGhyb3VnaHMpIHRoYXQgd291bGQgcmVxdWlyZSB3YXRjaGluZyB0aGUgdmlkZW8gdG8gZnVsbHkgdW5kZXJzdGFuZC4gSW5jbHVkZSBhcHByb3hpbWF0ZSB0aW1lc3RhbXBzLlxuXG5Gb3JtYXQgeW91ciByZXNwb25zZSBhcyBzdHJ1Y3R1cmVkIEpTT046XG5cbntcbiAgXCJrZXlQb2ludHNcIjogW1wicG9pbnQxXCIsIFwicG9pbnQyXCIsIC4uLl0sXG4gIFwiYWlDb25jZXB0c1wiOiBbXCJjb25jZXB0MVwiLCBcImNvbmNlcHQyXCIsIC4uLl0sXG4gIFwidGVjaG5pY2FsRGV0YWlsc1wiOiBbXCJkZXRhaWwxXCIsIFwiZGV0YWlsMlwiLCAuLi5dLFxuICBcInZpc3VhbENvbnRleHRGbGFnc1wiOiBbXG4gICAge1widGltZXN0YW1wXCI6IDEyMywgXCJyZWFzb25cIjogXCJDb2RlIGRlbW9uc3RyYXRpb25cIiwgXCJjb250ZXh0XCI6IFwiU2hvd3MgaW1wbGVtZW50YXRpb24gb2YuLi5cIn0sXG4gICAgLi4uXG4gIF0sXG4gIFwic3VtbWFyeVwiOiBcIkJyaWVmIDItMyBzZW50ZW5jZSBzdW1tYXJ5XCJcbn1cblxuVFJBTlNDUklQVDpcbmA7XG5cbmludGVyZmFjZSBWaWRlb0VudHJ5IHtcbiAgaW5kZXg6IG51bWJlcjtcbiAgdmlkZW9JZDogc3RyaW5nO1xuICB1cmw6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgdHJhbnNjcmlwdD86IHN0cmluZztcbiAgc3RhdHVzOiBzdHJpbmc7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNhbGxHZW1pbmlBUEkocHJvbXB0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCB1cmwgPSBgaHR0cHM6Ly9nZW5lcmF0aXZlbGFuZ3VhZ2UuZ29vZ2xlYXBpcy5jb20vdjFiZXRhL21vZGVscy9nZW1pbmktMS41LWZsYXNoOmdlbmVyYXRlQ29udGVudD9rZXk9JHtBUElfS0VZfWA7XG5cbiAgY29uc3QgYm9keSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICBjb250ZW50czogW1xuICAgICAge1xuICAgICAgICBwYXJ0czogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRleHQ6IHByb21wdCxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICBdLFxuICB9KTtcblxuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgfSxcbiAgICBib2R5LFxuICB9KTtcblxuICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgY29uc3QgZXJyb3IgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBBUEkgRXJyb3I6ICR7cmVzcG9uc2Uuc3RhdHVzfSAtICR7ZXJyb3J9YCk7XG4gIH1cblxuICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICByZXR1cm4gZGF0YS5jYW5kaWRhdGVzPy5bMF0/LmNvbnRlbnQ/LnBhcnRzPy5bMF0/LnRleHQgfHwgJyc7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoVHJhbnNjcmlwdCh2aWRlb0lkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICB0cnkge1xuICAgIC8vIFVzZSB5dC1kbHAgdG8gZ2V0IHRyYW5zY3JpcHRcbiAgICBjb25zdCBjbWQgPSBgeXQtZGxwIC0tc2tpcC1kb3dubG9hZCAtLXdyaXRlLWF1dG8tc3ViIC0tc3ViLWxhbmcgZW4gLS1zdWItZm9ybWF0IGpzb24zIC0tb3V0cHV0IFwidGVtcF8lKGlkKXNcIiBcImh0dHBzOi8vd3d3LnlvdXR1YmUuY29tL3dhdGNoP3Y9JHt2aWRlb0lkfVwiYDtcbiAgICBleGVjU3luYyhjbWQsIHsgY3dkOiBEQVRBX0RJUiB9KTtcblxuICAgIC8vIFJlYWQgdGhlIHN1YnRpdGxlIGZpbGVcbiAgICBjb25zdCBzdWJGaWxlID0gcGF0aC5qb2luKERBVEFfRElSLCBgdGVtcF8ke3ZpZGVvSWR9LmVuLmpzb24zYCk7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoc3ViRmlsZSkpIHtcbiAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhzdWJGaWxlLCAndXRmLTgnKSk7XG4gICAgICBjb25zdCB0cmFuc2NyaXB0ID0gZGF0YS5ldmVudHNcbiAgICAgICAgLmZpbHRlcigoZTogYW55KSA9PiBlLnNlZ3MpXG4gICAgICAgIC5tYXAoKGU6IGFueSkgPT4gZS5zZWdzLm1hcCgoczogYW55KSA9PiBzLnV0ZjgpLmpvaW4oJycpKVxuICAgICAgICAuam9pbignICcpO1xuXG4gICAgICAvLyBDbGVhbnVwXG4gICAgICBmcy51bmxpbmtTeW5jKHN1YkZpbGUpO1xuXG4gICAgICByZXR1cm4gdHJhbnNjcmlwdDtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLmVycm9yKGBGYWlsZWQgdG8gZmV0Y2ggdHJhbnNjcmlwdCBmb3IgJHt2aWRlb0lkfTpgLCBlKTtcbiAgfVxuXG4gIHJldHVybiAnJztcbn1cblxuYXN5bmMgZnVuY3Rpb24gcHJvY2Vzc1ZpZGVvKHZpZGVvOiBWaWRlb0VudHJ5KTogUHJvbWlzZTxib29sZWFuPiB7XG4gIGNvbnNvbGUubG9nKGBcXG4keyfilZAnLnJlcGVhdCg3MCl9YCk7XG4gIGNvbnNvbGUubG9nKGBQcm9jZXNzaW5nICMke3ZpZGVvLmluZGV4fTogJHt2aWRlby50aXRsZX1gKTtcbiAgY29uc29sZS5sb2coYCR7J+KVkCcucmVwZWF0KDcwKX1cXG5gKTtcblxuICB0cnkge1xuICAgIC8vIDEuIEZldGNoIHRyYW5zY3JpcHRcbiAgICBjb25zb2xlLmxvZygnW0FQSV0g8J+TnSBGZXRjaGluZyB0cmFuc2NyaXB0Li4uJyk7XG4gICAgY29uc3QgdHJhbnNjcmlwdCA9IGF3YWl0IGZldGNoVHJhbnNjcmlwdCh2aWRlby52aWRlb0lkKTtcblxuICAgIGlmICghdHJhbnNjcmlwdCkge1xuICAgICAgY29uc29sZS5sb2coJ1tBUEldIOKaoO+4jyBObyB0cmFuc2NyaXB0IGF2YWlsYWJsZSwgc2tpcHBpbmcnKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhgW0FQSV0g4pyFIFRyYW5zY3JpcHQ6ICR7dHJhbnNjcmlwdC5sZW5ndGh9IGNoYXJhY3RlcnNgKTtcblxuICAgIC8vIDIuIFNlbmQgdG8gR2VtaW5pIEFQSVxuICAgIGNvbnNvbGUubG9nKCdbQVBJXSDwn6SWIFNlbmRpbmcgdG8gR2VtaW5pIEFQSS4uLicpO1xuICAgIGNvbnN0IGZ1bGxQcm9tcHQgPSBBTkFMWVNJU19QUk9NUFQgKyB0cmFuc2NyaXB0LnN1YnN0cmluZygwLCAyNTAwMCk7XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNhbGxHZW1pbmlBUEkoZnVsbFByb21wdCk7XG4gICAgY29uc29sZS5sb2coJ1tBUEldIOKchSBBbmFseXNpcyByZWNlaXZlZCcpO1xuXG4gICAgLy8gMy4gU2F2ZSByZXBvcnRcbiAgICBjb25zdCByZXBvcnRQYXRoID0gcGF0aC5qb2luKFJFUE9SVFNfRElSLCBgYXBpXyR7dmlkZW8uaW5kZXh9XyR7dmlkZW8udmlkZW9JZH0ubWRgKTtcbiAgICBjb25zdCByZXBvcnQgPSBgIyAke3ZpZGVvLnRpdGxlfVxuXG4qKlZpZGVvIElEOioqICR7dmlkZW8udmlkZW9JZH1cbioqVVJMOioqICR7dmlkZW8udXJsfVxuKipQcm9jZXNzZWQ6KiogJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCl9XG5cbiMjIEFJIEFuYWx5c2lzXG5cbiR7cmVzcG9uc2V9XG5cbi0tLVxuXG4qR2VuZXJhdGVkIHZpYSBHZW1pbmkgQVBJKlxuYDtcblxuICAgIGZzLndyaXRlRmlsZVN5bmMocmVwb3J0UGF0aCwgcmVwb3J0LCAndXRmLTgnKTtcbiAgICBjb25zb2xlLmxvZyhgW0FQSV0g4pyFIFJlcG9ydCBzYXZlZDogJHtwYXRoLmJhc2VuYW1lKHJlcG9ydFBhdGgpfVxcbmApO1xuXG4gICAgcmV0dXJuIHRydWU7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihgW0FQSV0g4p2MIEVycm9yIHByb2Nlc3NpbmcgdmlkZW86YCwgZXJyb3IpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBtYWluKCkge1xuICBjb25zb2xlLmxvZygn8J+agCBEaXJlY3QgQVBJIFZpZGVvIFByb2Nlc3NvcicpO1xuICBjb25zb2xlLmxvZygnVXNpbmcgR2VtaW5pIFJFU1QgQVBJIChieXBhc3NpbmcgYnJvd3NlciBhdXRvbWF0aW9uKVxcbicpO1xuXG4gIC8vIEVuc3VyZSBkaXJlY3RvcmllcyBleGlzdFxuICBmcy5ta2RpclN5bmMoUkVQT1JUU19ESVIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuXG4gIC8vIExvYWQgdmlkZW8gbGlicmFyeVxuICBjb25zdCBsaWJDb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKExJQlJBUllfRklMRSwgJ3V0Zi04Jyk7XG4gIGNvbnN0IHZpZGVvczogVmlkZW9FbnRyeVtdID0gW107XG4gIGNvbnN0IHJvd1JlZ2V4ID1cbiAgICAvPHRyPlxccyo8dGRbXj5dKj5cXHMqKFxcZCspXFxzKjxcXC90ZD5cXHMqPHRkW14+XSo+XFxzKjxhXFxzK2hyZWY9XCIoW15cIl0rKVwiW14+XSo+KFtePF0rKTxcXC9hPlxccyo8XFwvdGQ+L2c7XG5cbiAgbGV0IG1hdGNoO1xuICB3aGlsZSAoKG1hdGNoID0gcm93UmVnZXguZXhlYyhsaWJDb250ZW50KSkgIT09IG51bGwpIHtcbiAgICBjb25zdCB1cmwgPSBtYXRjaFsyXTtcbiAgICBjb25zdCB2aWRlb0lkID0gKHVybC5tYXRjaCgvdj0oW14mXSspLykgfHwgW10pWzFdIHx8IHVybC5zcGxpdCgnLycpLnBvcCgpIHx8ICcnO1xuXG4gICAgdmlkZW9zLnB1c2goe1xuICAgICAgaW5kZXg6IHBhcnNlSW50KG1hdGNoWzFdKSxcbiAgICAgIHZpZGVvSWQsXG4gICAgICB1cmwsXG4gICAgICB0aXRsZTogbWF0Y2hbM10udHJpbSgpLFxuICAgICAgc3RhdHVzOiAncGVuZGluZycsXG4gICAgfSk7XG4gIH1cblxuICBjb25zb2xlLmxvZyhg8J+TmiBMb2FkZWQgJHt2aWRlb3MubGVuZ3RofSB2aWRlb3MgZnJvbSBsaWJyYXJ5XFxuYCk7XG5cbiAgLy8gUHJvY2VzcyB2aWRlb3NcbiAgbGV0IGNvbXBsZXRlZCA9IDA7XG4gIGxldCBlcnJvcnMgPSAwO1xuXG4gIGZvciAoY29uc3QgdmlkZW8gb2YgdmlkZW9zKSB7XG4gICAgLy8gQ2hlY2sgaWYgYWxyZWFkeSBwcm9jZXNzZWRcbiAgICBjb25zdCByZXBvcnRFeGlzdHMgPSBmcy5leGlzdHNTeW5jKFxuICAgICAgcGF0aC5qb2luKFJFUE9SVFNfRElSLCBgYXBpXyR7dmlkZW8uaW5kZXh9XyR7dmlkZW8udmlkZW9JZH0ubWRgKVxuICAgICk7XG4gICAgaWYgKHJlcG9ydEV4aXN0cykge1xuICAgICAgY29uc29sZS5sb2coYOKPre+4jyBTa2lwcGluZyAjJHt2aWRlby5pbmRleH0gKGFscmVhZHkgcHJvY2Vzc2VkKWApO1xuICAgICAgY29tcGxldGVkKys7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBzdWNjZXNzID0gYXdhaXQgcHJvY2Vzc1ZpZGVvKHZpZGVvKTtcblxuICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICBjb21wbGV0ZWQrKztcbiAgICB9IGVsc2Uge1xuICAgICAgZXJyb3JzKys7XG4gICAgfVxuXG4gICAgLy8gUHJvZ3Jlc3MgdXBkYXRlXG4gICAgY29uc29sZS5sb2coYPCfk4ogUHJvZ3Jlc3M6ICR7Y29tcGxldGVkfS8ke3ZpZGVvcy5sZW5ndGh9IGNvbXBsZXRlZCwgJHtlcnJvcnN9IGVycm9yc1xcbmApO1xuXG4gICAgLy8gUmF0ZSBsaW1pdGluZyAtIHdhaXQgMSBzZWNvbmQgYmV0d2VlbiByZXF1ZXN0c1xuICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDEwMDApKTtcbiAgfVxuXG4gIGNvbnNvbGUubG9nKCdcXG7wn46JIFByb2Nlc3NpbmcgY29tcGxldGUhJyk7XG4gIGNvbnNvbGUubG9nKGDinIUgQ29tcGxldGVkOiAke2NvbXBsZXRlZH1gKTtcbiAgY29uc29sZS5sb2coYOKdjCBFcnJvcnM6ICR7ZXJyb3JzfWApO1xufVxuXG5tYWluKCkuY2F0Y2goY29uc29sZS5lcnJvcik7XG4iXX0=