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
        // Update master index
        appendVideoToIndex(video, path.basename(reportPath));
        return true;
    }
    catch (error) {
        console.error(`[API] ❌ Error processing video:`, error);
        return false;
    }
}
/**
 * Appends a video summary to the master chronological index
 */
function appendVideoToIndex(video, reportFilename) {
    if (!fs.existsSync(MASTER_INDEX_FILE)) {
        fs.writeFileSync(MASTER_INDEX_FILE, '# Master Chronological Video Intelligence Index\n\n', 'utf-8');
    }
    const content = fs.readFileSync(MASTER_INDEX_FILE, 'utf-8');
    const entryHeader = `## Video #${video.index}: ${video.title}`;
    if (content.includes(entryHeader))
        return;
    const reportPath = path.join(REPORTS_DIR, reportFilename);
    const reportContent = fs.readFileSync(reportPath, 'utf-8');
    // Extract key points from the report if available
    let keyPoints = '';
    const keyPointsMatch = reportContent.match(/## Key Points[\s\S]*?(?=\n##|$)/);
    if (keyPointsMatch) {
        keyPoints = keyPointsMatch[0].replace('## Key Points', '').trim();
    }
    else {
        // Try to find in JSON
        const jsonMatch = reportContent.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            try {
                const json = JSON.parse(jsonMatch[1]);
                if (json.keyPoints) {
                    keyPoints = json.keyPoints.map((p) => `- ${p}`).join('\n');
                }
            }
            catch (e) { }
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
        // Check if already processed (check for api_, transcript_, or v2_ prefixes)
        const existingReports = fs
            .readdirSync(REPORTS_DIR)
            .filter((f) => f.startsWith(`api_${video.index}_`) ||
            f.startsWith(`transcript_${video.index}_`) ||
            f.startsWith(`v2_${video.index}_`));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGlyZWN0QVBJUHJvY2Vzc29yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiRGlyZWN0QVBJUHJvY2Vzc29yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILGlEQUF5QztBQUN6Qyx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBRTdCLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztBQUNuRixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzlELE1BQU0sV0FBVyxHQUFHLHNEQUFzRCxDQUFDO0FBQzNFLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLE1BQU0sRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO0FBQzdFLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsK0JBQStCLENBQUMsQ0FBQztBQUVsRiwrQkFBK0I7QUFDL0IsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLElBQUksRUFBRSxDQUFDO0FBRWpELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsc0RBQXNELENBQUMsQ0FBQztJQUN0RSxPQUFPLENBQUMsS0FBSyxDQUFDLHdEQUF3RCxDQUFDLENBQUM7SUFDeEUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQixDQUFDO0FBRUQsTUFBTSxlQUFlLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXFCdkIsQ0FB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QUFDO0lBQ3pDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLFNBQVMsRUFBRSxDQUFDLENBQUM7SUFDekMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLE1BQU0sRUFBRSxDQUFDLENBQUM7QUFDckMsQ0FBQztBQUVELElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiB0cy1ub2RlXG5cbi8qKlxuICogRGlyZWN0IEFQSSBWaWRlbyBQcm9jZXNzb3JcbiAqXG4gKiBVc2VzIEdlbWluaSBSRVNUIEFQSSBkaXJlY3RseSBpbnN0ZWFkIG9mIGJyb3dzZXIgYXV0b21hdGlvblxuICogQnlwYXNzZXMgQUkgU3R1ZGlvIHBlcm1pc3Npb24gaXNzdWVzXG4gKiBGdWxseSBhdXRvbWF0ZWQgcHJvY2Vzc2luZ1xuICovXG5cbmltcG9ydCB7IGV4ZWNTeW5jIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG5jb25zdCBMSUJSQVJZX0ZJTEUgPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJy4uJywgJy4uJywgJ2FpX3ZpZGVvX2xpYnJhcnkuaHRtbCcpO1xuY29uc3QgREFUQV9ESVIgPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJy4uJywgJy4uJywgJ2RhdGEnKTtcbmNvbnN0IFJFUE9SVFNfRElSID0gJy9Vc2Vycy88b3duZXI+L0RvY3VtZW50cy9WaWRlby1JbnRlbGxpZ2VuY2UtQXJjaGl2ZS8nO1xuY29uc3QgU1RBVEVfRklMRSA9IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAnZGF0YScsICdwcm9jZXNzaW5nX3N0YXRlLmpzb24nKTtcbmNvbnN0IE1BU1RFUl9JTkRFWF9GSUxFID0gcGF0aC5qb2luKFJFUE9SVFNfRElSLCAnTUFTVEVSX0NIUk9OT0xPR0lDQUxfSU5ERVgubWQnKTtcblxuLy8gR2V0IEFQSSBrZXkgZnJvbSBlbnZpcm9ubWVudFxuY29uc3QgQVBJX0tFWSA9IHByb2Nlc3MuZW52LkdFTUlOSV9BUElfS0VZIHx8ICcnO1xuXG5pZiAoIUFQSV9LRVkpIHtcbiAgY29uc29sZS5lcnJvcign4p2MIEVycm9yOiBHRU1JTklfQVBJX0tFWSBlbnZpcm9ubWVudCB2YXJpYWJsZSBub3Qgc2V0Jyk7XG4gIGNvbnNvbGUuZXJyb3IoJ1NldCBpdCB3aXRoOiBleHBvcnQgR0VNSU5JX0FQSV9LRVk9XCJ5b3VyLWFwaS1rZXktaGVyZVwiJyk7XG4gIHByb2Nlc3MuZXhpdCgxKTtcbn1cblxuY29uc3QgQU5BTFlTSVNfUFJPTVBUID0gYEFuYWx5emUgdGhpcyBZb3VUdWJlIHZpZGVvIHRyYW5zY3JpcHQgYW5kIGV4dHJhY3Q6XG5cbktleSBQb2ludHM6IE1haW4gdGFrZWF3YXlzIGFuZCBpbXBvcnRhbnQgaW5mb3JtYXRpb25cbkFJIENvbmNlcHRzOiBBbnkgQUksIG1hY2hpbmUgbGVhcm5pbmcsIG9yIHRlY2huaWNhbCBBSS1yZWxhdGVkIGNvbmNlcHRzIG1lbnRpb25lZFxuVGVjaG5pY2FsIERldGFpbHM6IEltcGxlbWVudGF0aW9uIGRldGFpbHMsIHRvb2xzLCBmcmFtZXdvcmtzLCBvciB0ZWNobmljYWwgc3BlY2lmaWNzXG5WaXN1YWwgQ29udGV4dCBGbGFnczogSWRlbnRpZnkgc2VjdGlvbnMgd2hlcmUgdGhlIHNwZWFrZXIgbGlrZWx5IHNob3dzIHNvbWV0aGluZyBvbiBzY3JlZW4gKGNvZGUgZGVtb3MsIGRpYWdyYW1zLCBVSSB3YWxrdGhyb3VnaHMpIHRoYXQgd291bGQgcmVxdWlyZSB3YXRjaGluZyB0aGUgdmlkZW8gdG8gZnVsbHkgdW5kZXJzdGFuZC4gSW5jbHVkZSBhcHByb3hpbWF0ZSB0aW1lc3RhbXBzLlxuXG5Gb3JtYXQgeW91ciByZXNwb25zZSBhcyBzdHJ1Y3R1cmVkIEpTT046XG5cbntcbiAgXCJrZXlQb2ludHNcIjogW1wicG9pbnQxXCIsIFwicG9pbnQyXCIsIC4uLl0sXG4gIFwiYWlDb25jZXB0c1wiOiBbXCJjb25jZXB0MVwiLCBcImNvbmNlcHQyXCIsIC4uLl0sXG4gIFwidGVjaG5pY2FsRGV0YWlsc1wiOiBbXCJkZXRhaWwxXCIsIFwiZGV0YWlsMlwiLCAuLi5dLFxuICBcInZpc3VhbENvbnRleHRGbGFnc1wiOiBbXG4gICAge1widGltZXN0YW1wXCI6IDEyMywgXCJyZWFzb25cIjogXCJDb2RlIGRlbW9uc3RyYXRpb25cIiwgXCJjb250ZXh0XCI6IFwiU2hvd3MgaW1wbGVtZW50YXRpb24gb2YuLi5cIn0sXG4gICAgLi4uXG4gIF0sXG4gIFwic3VtbWFyeVwiOiBcIkJyaWVmIDItMyBzZW50ZW5jZSBzdW1tYXJ5XCJcbn1cblxuVFJBTlNDUklQVDpcbmA7XG5cbmludGVyZmFjZSBWaWRlb0VudHJ5IHtcbiAgaW5kZXg6IG51bWJlcjtcbiAgdmlkZW9JZDogc3RyaW5nO1xuICB1cmw6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgdHJhbnNjcmlwdD86IHN0cmluZztcbiAgc3RhdHVzOiBzdHJpbmc7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNhbGxHZW1pbmlBUEkocHJvbXB0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCB1cmwgPSBgaHR0cHM6Ly9nZW5lcmF0aXZlbGFuZ3VhZ2UuZ29vZ2xlYXBpcy5jb20vdjFiZXRhL21vZGVscy9nZW1pbmktMS41LWZsYXNoOmdlbmVyYXRlQ29udGVudD9rZXk9JHtBUElfS0VZfWA7XG5cbiAgY29uc3QgYm9keSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICBjb250ZW50czogW1xuICAgICAge1xuICAgICAgICBwYXJ0czogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRleHQ6IHByb21wdCxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICBdLFxuICB9KTtcblxuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgfSxcbiAgICBib2R5LFxuICB9KTtcblxuICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgY29uc3QgZXJyb3IgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBBUEkgRXJyb3I6ICR7cmVzcG9uc2Uuc3RhdHVzfSAtICR7ZXJyb3J9YCk7XG4gIH1cblxuICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICByZXR1cm4gZGF0YS5jYW5kaWRhdGVzPy5bMF0/LmNvbnRlbnQ/LnBhcnRzPy5bMF0/LnRleHQgfHwgJyc7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoVHJhbnNjcmlwdCh2aWRlb0lkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICB0cnkge1xuICAgIC8vIFVzZSB5dC1kbHAgdG8gZ2V0IHRyYW5zY3JpcHRcbiAgICBjb25zdCBjbWQgPSBgeXQtZGxwIC0tc2tpcC1kb3dubG9hZCAtLXdyaXRlLWF1dG8tc3ViIC0tc3ViLWxhbmcgZW4gLS1zdWItZm9ybWF0IGpzb24zIC0tb3V0cHV0IFwidGVtcF8lKGlkKXNcIiBcImh0dHBzOi8vd3d3LnlvdXR1YmUuY29tL3dhdGNoP3Y9JHt2aWRlb0lkfVwiYDtcbiAgICBleGVjU3luYyhjbWQsIHsgY3dkOiBEQVRBX0RJUiB9KTtcblxuICAgIC8vIFJlYWQgdGhlIHN1YnRpdGxlIGZpbGVcbiAgICBjb25zdCBzdWJGaWxlID0gcGF0aC5qb2luKERBVEFfRElSLCBgdGVtcF8ke3ZpZGVvSWR9LmVuLmpzb24zYCk7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoc3ViRmlsZSkpIHtcbiAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhzdWJGaWxlLCAndXRmLTgnKSk7XG4gICAgICBjb25zdCB0cmFuc2NyaXB0ID0gZGF0YS5ldmVudHNcbiAgICAgICAgLmZpbHRlcigoZTogYW55KSA9PiBlLnNlZ3MpXG4gICAgICAgIC5tYXAoKGU6IGFueSkgPT4gZS5zZWdzLm1hcCgoczogYW55KSA9PiBzLnV0ZjgpLmpvaW4oJycpKVxuICAgICAgICAuam9pbignICcpO1xuXG4gICAgICAvLyBDbGVhbnVwXG4gICAgICBmcy51bmxpbmtTeW5jKHN1YkZpbGUpO1xuXG4gICAgICByZXR1cm4gdHJhbnNjcmlwdDtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLmVycm9yKGBGYWlsZWQgdG8gZmV0Y2ggdHJhbnNjcmlwdCBmb3IgJHt2aWRlb0lkfTpgLCBlKTtcbiAgfVxuXG4gIHJldHVybiAnJztcbn1cblxuYXN5bmMgZnVuY3Rpb24gcHJvY2Vzc1ZpZGVvKHZpZGVvOiBWaWRlb0VudHJ5KTogUHJvbWlzZTxib29sZWFuPiB7XG4gIGNvbnNvbGUubG9nKGBcXG4keyfilZAnLnJlcGVhdCg3MCl9YCk7XG4gIGNvbnNvbGUubG9nKGBQcm9jZXNzaW5nICMke3ZpZGVvLmluZGV4fTogJHt2aWRlby50aXRsZX1gKTtcbiAgY29uc29sZS5sb2coYCR7J+KVkCcucmVwZWF0KDcwKX1cXG5gKTtcblxuICB0cnkge1xuICAgIC8vIDEuIEZldGNoIHRyYW5zY3JpcHRcbiAgICBjb25zb2xlLmxvZygnW0FQSV0g8J+TnSBGZXRjaGluZyB0cmFuc2NyaXB0Li4uJyk7XG4gICAgY29uc3QgdHJhbnNjcmlwdCA9IGF3YWl0IGZldGNoVHJhbnNjcmlwdCh2aWRlby52aWRlb0lkKTtcblxuICAgIGlmICghdHJhbnNjcmlwdCkge1xuICAgICAgY29uc29sZS5sb2coJ1tBUEldIOKaoO+4jyBObyB0cmFuc2NyaXB0IGF2YWlsYWJsZSwgc2tpcHBpbmcnKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhgW0FQSV0g4pyFIFRyYW5zY3JpcHQ6ICR7dHJhbnNjcmlwdC5sZW5ndGh9IGNoYXJhY3RlcnNgKTtcblxuICAgIC8vIDIuIFNlbmQgdG8gR2VtaW5pIEFQSVxuICAgIGNvbnNvbGUubG9nKCdbQVBJXSDwn6SWIFNlbmRpbmcgdG8gR2VtaW5pIEFQSS4uLicpO1xuICAgIGNvbnN0IGZ1bGxQcm9tcHQgPSBBTkFMWVNJU19QUk9NUFQgKyB0cmFuc2NyaXB0LnN1YnN0cmluZygwLCAyNTAwMCk7XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNhbGxHZW1pbmlBUEkoZnVsbFByb21wdCk7XG4gICAgY29uc29sZS5sb2coJ1tBUEldIOKchSBBbmFseXNpcyByZWNlaXZlZCcpO1xuXG4gICAgLy8gMy4gU2F2ZSByZXBvcnRcbiAgICBjb25zdCByZXBvcnRQYXRoID0gcGF0aC5qb2luKFJFUE9SVFNfRElSLCBgYXBpXyR7dmlkZW8uaW5kZXh9XyR7dmlkZW8udmlkZW9JZH0ubWRgKTtcbiAgICBjb25zdCByZXBvcnQgPSBgIyAke3ZpZGVvLnRpdGxlfVxuXG4qKlZpZGVvIElEOioqICR7dmlkZW8udmlkZW9JZH1cbioqVVJMOioqICR7dmlkZW8udXJsfVxuKipQcm9jZXNzZWQ6KiogJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCl9XG5cbiMjIEFJIEFuYWx5c2lzXG5cbiR7cmVzcG9uc2V9XG5cbi0tLVxuXG4qR2VuZXJhdGVkIHZpYSBHZW1pbmkgQVBJKlxuYDtcblxuICAgIGZzLndyaXRlRmlsZVN5bmMocmVwb3J0UGF0aCwgcmVwb3J0LCAndXRmLTgnKTtcbiAgICBjb25zb2xlLmxvZyhgW0FQSV0g4pyFIFJlcG9ydCBzYXZlZDogJHtwYXRoLmJhc2VuYW1lKHJlcG9ydFBhdGgpfVxcbmApO1xuXG4gICAgLy8gVXBkYXRlIG1hc3RlciBpbmRleFxuICAgIGFwcGVuZFZpZGVvVG9JbmRleCh2aWRlbywgcGF0aC5iYXNlbmFtZShyZXBvcnRQYXRoKSk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbQVBJXSDinYwgRXJyb3IgcHJvY2Vzc2luZyB2aWRlbzpgLCBlcnJvcik7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8qKlxuICogQXBwZW5kcyBhIHZpZGVvIHN1bW1hcnkgdG8gdGhlIG1hc3RlciBjaHJvbm9sb2dpY2FsIGluZGV4XG4gKi9cbmZ1bmN0aW9uIGFwcGVuZFZpZGVvVG9JbmRleCh2aWRlbzogVmlkZW9FbnRyeSwgcmVwb3J0RmlsZW5hbWU6IHN0cmluZykge1xuICBpZiAoIWZzLmV4aXN0c1N5bmMoTUFTVEVSX0lOREVYX0ZJTEUpKSB7XG4gICAgZnMud3JpdGVGaWxlU3luYyhcbiAgICAgIE1BU1RFUl9JTkRFWF9GSUxFLFxuICAgICAgJyMgTWFzdGVyIENocm9ub2xvZ2ljYWwgVmlkZW8gSW50ZWxsaWdlbmNlIEluZGV4XFxuXFxuJyxcbiAgICAgICd1dGYtOCdcbiAgICApO1xuICB9XG5cbiAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhNQVNURVJfSU5ERVhfRklMRSwgJ3V0Zi04Jyk7XG4gIGNvbnN0IGVudHJ5SGVhZGVyID0gYCMjIFZpZGVvICMke3ZpZGVvLmluZGV4fTogJHt2aWRlby50aXRsZX1gO1xuXG4gIGlmIChjb250ZW50LmluY2x1ZGVzKGVudHJ5SGVhZGVyKSkgcmV0dXJuO1xuXG4gIGNvbnN0IHJlcG9ydFBhdGggPSBwYXRoLmpvaW4oUkVQT1JUU19ESVIsIHJlcG9ydEZpbGVuYW1lKTtcbiAgY29uc3QgcmVwb3J0Q29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhyZXBvcnRQYXRoLCAndXRmLTgnKTtcblxuICAvLyBFeHRyYWN0IGtleSBwb2ludHMgZnJvbSB0aGUgcmVwb3J0IGlmIGF2YWlsYWJsZVxuICBsZXQga2V5UG9pbnRzID0gJyc7XG4gIGNvbnN0IGtleVBvaW50c01hdGNoID0gcmVwb3J0Q29udGVudC5tYXRjaCgvIyMgS2V5IFBvaW50c1tcXHNcXFNdKj8oPz1cXG4jI3wkKS8pO1xuICBpZiAoa2V5UG9pbnRzTWF0Y2gpIHtcbiAgICBrZXlQb2ludHMgPSBrZXlQb2ludHNNYXRjaFswXS5yZXBsYWNlKCcjIyBLZXkgUG9pbnRzJywgJycpLnRyaW0oKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBUcnkgdG8gZmluZCBpbiBKU09OXG4gICAgY29uc3QganNvbk1hdGNoID0gcmVwb3J0Q29udGVudC5tYXRjaCgvYGBganNvblxcbihbXFxzXFxTXSo/KVxcbmBgYC8pO1xuICAgIGlmIChqc29uTWF0Y2gpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGpzb24gPSBKU09OLnBhcnNlKGpzb25NYXRjaFsxXSk7XG4gICAgICAgIGlmIChqc29uLmtleVBvaW50cykge1xuICAgICAgICAgIGtleVBvaW50cyA9IGpzb24ua2V5UG9pbnRzLm1hcCgocDogc3RyaW5nKSA9PiBgLSAke3B9YCkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgfVxuICB9XG5cbiAgY29uc3QgZW50cnkgPSBgXG4ke2VudHJ5SGVhZGVyfVxuLSAqKlVSTCoqOiAke3ZpZGVvLnVybH1cbi0gKipSZXBvcnQqKjogW0xpbmtdKC4vJHtyZXBvcnRGaWxlbmFtZX0pXG4tICoqU3VtbWFyeSBQb2ludHMqKjpcbiR7a2V5UG9pbnRzIHx8ICctIE5vIGtleSBwb2ludHMgZXh0cmFjdGVkIHlldC4nfVxuXG4tLS1cbmA7XG5cbiAgZnMuYXBwZW5kRmlsZVN5bmMoTUFTVEVSX0lOREVYX0ZJTEUsIGVudHJ5LCAndXRmLTgnKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gbWFpbigpIHtcbiAgY29uc29sZS5sb2coJ/CfmoAgRGlyZWN0IEFQSSBWaWRlbyBQcm9jZXNzb3InKTtcbiAgY29uc29sZS5sb2coJ1VzaW5nIEdlbWluaSBSRVNUIEFQSSAoYnlwYXNzaW5nIGJyb3dzZXIgYXV0b21hdGlvbilcXG4nKTtcblxuICAvLyBFbnN1cmUgZGlyZWN0b3JpZXMgZXhpc3RcbiAgZnMubWtkaXJTeW5jKFJFUE9SVFNfRElSLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcblxuICAvLyBMb2FkIHZpZGVvIGxpYnJhcnlcbiAgY29uc3QgbGliQ29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhMSUJSQVJZX0ZJTEUsICd1dGYtOCcpO1xuICBjb25zdCB2aWRlb3M6IFZpZGVvRW50cnlbXSA9IFtdO1xuICBjb25zdCByb3dSZWdleCA9XG4gICAgLzx0cj5cXHMqPHRkW14+XSo+XFxzKihcXGQrKVxccyo8XFwvdGQ+XFxzKjx0ZFtePl0qPlxccyo8YVxccytocmVmPVwiKFteXCJdKylcIltePl0qPihbXjxdKyk8XFwvYT5cXHMqPFxcL3RkPi9nO1xuXG4gIGxldCBtYXRjaDtcbiAgd2hpbGUgKChtYXRjaCA9IHJvd1JlZ2V4LmV4ZWMobGliQ29udGVudCkpICE9PSBudWxsKSB7XG4gICAgY29uc3QgdXJsID0gbWF0Y2hbMl07XG4gICAgY29uc3QgdmlkZW9JZCA9ICh1cmwubWF0Y2goL3Y9KFteJl0rKS8pIHx8IFtdKVsxXSB8fCB1cmwuc3BsaXQoJy8nKS5wb3AoKSB8fCAnJztcblxuICAgIHZpZGVvcy5wdXNoKHtcbiAgICAgIGluZGV4OiBwYXJzZUludChtYXRjaFsxXSksXG4gICAgICB2aWRlb0lkLFxuICAgICAgdXJsLFxuICAgICAgdGl0bGU6IG1hdGNoWzNdLnRyaW0oKSxcbiAgICAgIHN0YXR1czogJ3BlbmRpbmcnLFxuICAgIH0pO1xuICB9XG5cbiAgY29uc29sZS5sb2coYPCfk5ogTG9hZGVkICR7dmlkZW9zLmxlbmd0aH0gdmlkZW9zIGZyb20gbGlicmFyeVxcbmApO1xuXG4gIC8vIFByb2Nlc3MgdmlkZW9zXG4gIGxldCBjb21wbGV0ZWQgPSAwO1xuICBsZXQgZXJyb3JzID0gMDtcblxuICBmb3IgKGNvbnN0IHZpZGVvIG9mIHZpZGVvcykge1xuICAgIC8vIENoZWNrIGlmIGFscmVhZHkgcHJvY2Vzc2VkIChjaGVjayBmb3IgYXBpXywgdHJhbnNjcmlwdF8sIG9yIHYyXyBwcmVmaXhlcylcbiAgICBjb25zdCBleGlzdGluZ1JlcG9ydHMgPSBmc1xuICAgICAgLnJlYWRkaXJTeW5jKFJFUE9SVFNfRElSKVxuICAgICAgLmZpbHRlcihcbiAgICAgICAgKGYpID0+XG4gICAgICAgICAgZi5zdGFydHNXaXRoKGBhcGlfJHt2aWRlby5pbmRleH1fYCkgfHxcbiAgICAgICAgICBmLnN0YXJ0c1dpdGgoYHRyYW5zY3JpcHRfJHt2aWRlby5pbmRleH1fYCkgfHxcbiAgICAgICAgICBmLnN0YXJ0c1dpdGgoYHYyXyR7dmlkZW8uaW5kZXh9X2ApXG4gICAgICApO1xuXG4gICAgaWYgKGV4aXN0aW5nUmVwb3J0cy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zb2xlLmxvZyhg4o+t77iPIFNraXBwaW5nICMke3ZpZGVvLmluZGV4fSAoRm91bmQ6ICR7ZXhpc3RpbmdSZXBvcnRzWzBdfSlgKTtcbiAgICAgIGNvbXBsZXRlZCsrO1xuXG4gICAgICAvLyBVcGRhdGUgbWFzdGVyIGluZGV4IGlmIG5lZWRlZFxuICAgICAgYXBwZW5kVmlkZW9Ub0luZGV4KHZpZGVvLCBleGlzdGluZ1JlcG9ydHNbMF0pO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3Qgc3VjY2VzcyA9IGF3YWl0IHByb2Nlc3NWaWRlbyh2aWRlbyk7XG5cbiAgICBpZiAoc3VjY2Vzcykge1xuICAgICAgY29tcGxldGVkKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVycm9ycysrO1xuICAgIH1cblxuICAgIC8vIFByb2dyZXNzIHVwZGF0ZVxuICAgIGNvbnNvbGUubG9nKGDwn5OKIFByb2dyZXNzOiAke2NvbXBsZXRlZH0vJHt2aWRlb3MubGVuZ3RofSBjb21wbGV0ZWQsICR7ZXJyb3JzfSBlcnJvcnNcXG5gKTtcblxuICAgIC8vIFJhdGUgbGltaXRpbmcgLSB3YWl0IDEgc2Vjb25kIGJldHdlZW4gcmVxdWVzdHNcbiAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMDAwKSk7XG4gIH1cblxuICBjb25zb2xlLmxvZygnXFxu8J+OiSBQcm9jZXNzaW5nIGNvbXBsZXRlIScpO1xuICBjb25zb2xlLmxvZyhg4pyFIENvbXBsZXRlZDogJHtjb21wbGV0ZWR9YCk7XG4gIGNvbnNvbGUubG9nKGDinYwgRXJyb3JzOiAke2Vycm9yc31gKTtcbn1cblxubWFpbigpLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xuIl19