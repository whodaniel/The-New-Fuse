import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// --- CONFIGURATION ---
const TNF_ROOT = process.env.TNF_ROOT_DIR
  ? path.resolve(process.env.TNF_ROOT_DIR)
  : path.resolve(__dirname, '..');
const WORKSPACE_ROOT = process.env.TNF_WORKSPACE_DIR
  ? path.resolve(process.env.TNF_WORKSPACE_DIR)
  : path.resolve(TNF_ROOT, '..');
const BASE_DIR = process.env.TNF_KB_DIR
  ? path.resolve(process.env.TNF_KB_DIR)
  : path.join(WORKSPACE_ROOT, 'my-ai-knowledge-base');
const LIBRARY_FILE = path.join(BASE_DIR, 'video-library/ai_video_library.html');
const REPORTS_DIR = process.env.TNF_VIDEO_ARCHIVE_DIR
  ? path.resolve(process.env.TNF_VIDEO_ARCHIVE_DIR)
  : path.join(process.env.HOME || '/tmp', 'Documents', 'Video-Intelligence-Archive');
const TRANSCRIPTS_DIR = path.join(BASE_DIR, 'video-transcripts');
const MASTER_INDEX_FILE = path.join(REPORTS_DIR, 'MASTER_CHRONOLOGICAL_INDEX.md');

const API_KEY = process.env.GEMINI_API_KEY;

// Refined Prompt for Cherry-Picking & Condensing
const ANALYSIS_PROMPT = `Analyze this YouTube video transcript and convert it into an EXECUTABLE INTELLIGENCE ARTIFACT for The New Fuse (TNF).

CRITICAL INSTRUCTION: Do not summarize. CHERRY-PICK high-value information only. If a section is filler, ignore it. Focus on data that can be used for execution, strategic planning, or system governance.

Categorize findings into three distinct action planes:
1. Procedural: Extract literal CLI commands, code snippets, script names, JSON payloads, or technical playbooks.
2. Strategic: Note architectural shifts, industry trends (e.g. MCP integration), and visual design standards.
3. Governance: Map failure modes (Anti-Patterns), troubleshooting mental models, and performance claims.

Assign Utility Metrics:
- Freshness Decay: (High|Medium|Low)
- Implementation Density: (0.0 to 1.0)
- Verification Difficulty: (Easy|Hard)

Format your response as structured JSON:

{
  "taxonomy": {
    "procedural": ["Literal code/command 1", "Playbook step 2"],
    "strategic": ["Trend/Shift 1", "Pattern 2"],
    "governance": ["Failure mode 1", "Guardrail 2"]
  },
  "utilityMetrics": {
    "freshnessDecay": "High|Medium|Low",
    "implementationDensity": 0.8,
    "verificationDifficulty": "Easy|Hard"
  },
  "visualContextFlags": [
    {"timestamp": 123, "reason": "Specific UI demonstration", "context": "Visible config setup"}
  ],
  "synthesis": "A high-impact 2-sentence statement on how TNF can use this data."
}

TRANSCRIPT:
`;

interface Video {
  index: number;
  videoId: string;
  url: string;
  title: string;
}

function run(cmd: string) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (e) {
    return '';
  }
}

async function callGemini(prompt: string) {
  if (!API_KEY) throw new Error('GEMINI_API_KEY missing');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  if (!response.ok) throw new Error(`API Error: ${response.status} - ${await response.text()}`);
  const data: any = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function getExistingVideos(): Video[] {
  const content = fs.readFileSync(LIBRARY_FILE, 'utf-8');
  const videos: Video[] = [];
  const rowRegex = /<tr>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>\s*<\/td>/g;
  let match;
  while ((match = rowRegex.exec(content)) !== null) {
    const url = match[2];
    const videoId = (url.match(/v=([^&]+)/) || [])[1] || url.split('/').pop() || '';
    videos.push({
      index: parseInt(match[1]),
      videoId,
      url,
      title: match[3].trim()
    });
  }
  return videos;
}

async function processAndPurge() {
  console.log('🔄 Starting Distill-and-Purge Intelligence Pipeline...');
  const videos = getExistingVideos();
  
  for (const video of videos) {
    const reportPath = path.join(REPORTS_DIR, `api_${video.index}_${video.videoId}.md`);
    if (fs.existsSync(reportPath)) continue; // Already processed

    console.log(`\n[${video.index}] ${video.title}`);
    
    // 1. Fetch Transcript
    console.log('   📝 Fetching raw transcript...');
    const outBase = path.join(TRANSCRIPTS_DIR, `${video.index}`);
    run(`yt-dlp --write-auto-subs --skip-download --sub-langs "en.*" --sub-format json3 --output "${outBase}" "https://www.youtube.com/watch?v=${video.videoId}"`);
    
    const transcriptFile = path.join(TRANSCRIPTS_DIR, `${video.index}.en.json3`);
    let transcript = '';
    if (fs.existsSync(transcriptFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(transcriptFile, 'utf-8'));
        transcript = data.events?.filter((e: any) => e.segs).map((e: any) => e.segs.map((s: any) => s.utf8).join('')).join(' ') || '';
      } catch(e) {}
    }

    if (!transcript) {
        console.log('   ⚠️ No transcript found. Skipping purge logic for this entry.');
        continue;
    }

    // 2. Distill (Cherry-Picking)
    console.log('   🤖 Cherry-picking high-value intelligence...');
    try {
      const analysis = await callGemini(ANALYSIS_PROMPT + transcript.substring(0, 30000));
      
      const report = `# ${video.title}\n\n**Video ID:** ${video.videoId}\n**URL:** ${video.url}\n**Processed:** ${new Date().toISOString()}\n\n## AI Analysis\n\n${analysis}\n\n---\n*Generated via Gemini API (Distill-and-Purge Protocol)*\n`;
      fs.writeFileSync(reportPath, report);
      
      // 3. Purge (DELETE original transcript)
      console.log('   🔥 Distillation complete. Purging raw transcript to eliminate bloat.');
      fs.unlinkSync(transcriptFile);
      
      console.log('   ✅ Entry archived as Executable Intelligence.');
    } catch (e: any) {
      console.error(`   ❌ Distillation failed: ${e.message}`);
    }
  }
}

processAndPurge().catch(console.error);
