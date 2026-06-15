/**
 * Transcript Processor v4-pro - Omni-Vision Edition
 *
 * Improvements over v2:
 * 1. Uses moonshotai/kimi-k2.6 via NVIDIA NGC API (Multimodal)
 * 2. Integrated Native Vision Bridge via TNF Forge (screencap.so)
 * 3. Intelligent High-Fidelity Hotspot Selection (Capped at 8 images)
 * 4. Authoritative yt-dlp duration verification
 * 5. Robust state protection to prevent file corruption
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as process from 'node:process';

import { chromium, type BrowserContext, type Page } from 'playwright';

import { generateFederatedIdNumber } from './TranscriptProcessorV2.js';

interface VideoEntry {
  index: number;
  url: string;
  title: string;
  videoId: string;
  metadata?: VideoMetadata;
  transcript?: TranscriptSegment[];
  analysis?: AnalysisResult;
  frames?: string[]; // Base64 encoded JPEG frames
  status:
    | 'pending'
    | 'metadata'
    | 'transcript'
    | 'analyzed'
    | 'needs_visual'
    | 'completed'
    | 'skipped'
    | 'error';
  processingAttempts: number;
  lastProcessed?: string;
  error?: string;
}

interface VideoMetadata {
  duration: number;
  durationFormatted: string;
  description?: string;
  channel?: string;
  publishDate?: string;
  viewCount?: string;
  category?: string;
  tags?: string[];
  summary?: string;
}

interface TranscriptSegment {
  start: number;
  duration: number;
  text: string;
}

interface AnalysisResult {
  keyPoints: string[];
  aiConcepts: string[];
  technicalDetails: string[];
  visualContextFlags: VisualContextFlag[];
  summary: string;
  visualUtilityScore: number;
  qualityScore?: number;
  rawResponse?: string;
}

interface VisualContextFlag {
  timestamp: number;
  reason: string;
  context: string;
}

interface ProcessingState {
  version: string;
  queue: VideoEntry[];
  currentIndex: number;
  startedAt: string;
  lastUpdated: string;
  stats: ProcessingStats;
}

interface ProcessingStats {
  totalVideos: number;
  metadataComplete: number;
  transcriptsExtracted: number;
  analyzed: number;
  needsVisualReview: number;
  completed: number;
  skipped: number;
  errors: number;
  analysisSuccessRate: number;
  averageTranscriptLength: number;
}

// Model & API Config
const PRO_MODEL = 'gemini-2.5-pro';
const FLASH_MODEL = 'gemini-2.5-flash';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const ANALYSIS_PROMPT = `You are a technical data extraction mechanism. You are analyzing a технический YouTube video using its transcript and key visual frames.

Your goal is to extract machine-actionable intelligence. 

REQUIRED OUTPUT FORMAT:
You MUST return ONLY a valid JSON object. Do not include any conversational filler or bold text outside the JSON.

{
  "reasoningChain": "Detailed technical reasoning about the visual diagrams and transcript...",
  "summary": "Concise technical summary",
  "visualUtilityScore": 8,
  "keyPoints": ["Point 1", "Point 2", ...],
  "aiConcepts": ["Concept 1", "Concept 2", ...],
  "technicalDetails": ["Detailed implementation or tool info", ...],
  "visualContextFlags": [
    {"timestamp": 120, "reason": "Reason for flagging", "context": "Visible details from frame"}
  ]
}

TRANSCRIPT SEGMENT:
`;

class TranscriptProcessorV4 {
  private context: BrowserContext | null = null;
  private state: ProcessingState;
  private stateFilePath: string;
  private reportsDir: string;
  private transcriptsDir: string;
  private framesDir: string;
  private knowledgeBaseFile: string;
  private targetPhase: 'metadata' | 'transcript' | 'analysis' = 'analysis';
  private googleApiKey: string = '';

  constructor(targetPhase: 'metadata' | 'transcript' | 'analysis' = 'analysis') {
    this.targetPhase = targetPhase;
    const dataDir = '/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data';

    this.stateFilePath = path.join(dataDir, 'transcript-v2-state.json');
    this.reportsDir = path.join(dataDir, 'video-reports');
    this.transcriptsDir = path.join(dataDir, 'video-transcripts');
    this.framesDir = path.join(dataDir, 'video-frames');
    this.knowledgeBaseFile = path.join(dataDir, 'AI_Knowledge_Base.md');

    console.log(`[v4-pro] Using data directory: ${dataDir}`);

    fs.mkdirSync(this.reportsDir, { recursive: true });
    fs.mkdirSync(this.transcriptsDir, { recursive: true });
    fs.mkdirSync(this.framesDir, { recursive: true });
    fs.mkdirSync(path.join(dataDir, 'temp_subs'), { recursive: true });

    this.state = this.loadState();
    this.loadGoogleKey();
  }

  private loadGoogleKey(): void {
    try {
      const envPath = '/Users/danielgoldberg/.hermes/.env';
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/GEMINI_API_KEY=(AIza[A-Za-z0-9\-_]+)/);
      if (match) {
        this.googleApiKey = match[1];
        console.log('[v4-pro] ✅ Google AI API Key loaded');
      }
    } catch (e) {}
  }

  private loadState(): ProcessingState {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        const content = fs.readFileSync(this.stateFilePath, 'utf-8');
        if (content.length > 0) {
          const state = JSON.parse(content);
          if (state.version !== '3.0') {
            console.log('[v4-pro] Migrating state to v4-pro format...');
            state.version = '3.0';
          }
          return state;
        }
      }
    } catch (e) {
      console.log('[v4-pro] ⚠️ State load error, creating fresh state');
    }
    return {
      version: '3.0',
      queue: [],
      currentIndex: 0,
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      stats: {
        totalVideos: 0,
        metadataComplete: 0,
        transcriptsExtracted: 0,
        analyzed: 0,
        needsVisualReview: 0,
        completed: 0,
        skipped: 0,
        errors: 0,
        analysisSuccessRate: 0,
        averageTranscriptLength: 0,
      },
    };
  }

  private saveState(): void {
    if (!this.state || !this.state.queue || this.state.queue.length === 0) {
      console.error('[v4-pro] ❌ Refusing to save empty or invalid state');
      return;
    }
    this.state.lastUpdated = new Date().toISOString();
    this.updateStats();
    fs.mkdirSync(path.dirname(this.stateFilePath), { recursive: true });
    fs.writeFileSync(this.stateFilePath, JSON.stringify(this.state, null, 2));
  }

  private updateStats(): void {
    const s = this.state.stats;
    const analyzed = this.state.queue.filter((v) => v.analysis).length;
    const attempted = this.state.queue.filter((v) => v.processingAttempts > 0).length;
    s.analysisSuccessRate = attempted > 0 ? (analyzed / attempted) * 100 : 0;
    const transcripts = this.state.queue.filter((v) => v.transcript);
    s.averageTranscriptLength =
      transcripts.length > 0
        ? transcripts.reduce((sum, v) => sum + (v.transcript?.length || 0), 0) / transcripts.length
        : 0;
  }

  private extractVideoId(url: string): string | null {
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/
    );
    return match ? match[1] : null;
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  decodeHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  async initialize(): Promise<void> {
    const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-clean');
    console.log('[v4-pro] 🚀 Launching Headless Intelligence Bridge...');
    fs.mkdirSync(profileDir, { recursive: true });
    this.context = await chromium.launchPersistentContext(profileDir, {
      headless: true, // V3 Upgrade: Truly headless to prevent focus stealing
      args: [
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1280,800',
        '--mute-audio',
        '--autoplay-policy=no-user-gesture-required',
      ],
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      ignoreDefaultArgs: ['--enable-automation'],
    });
    console.log('[v4-pro] ✅ Headless Bridge ready');
  }

  private async ensureBrowserHealth(): Promise<boolean> {
    try {
      if (!this.context) {
        await this.initialize();
        return true;
      }
      const pages = await this.context.pages();
      if (pages.length > 30) {
        for (const page of pages) {
          try {
            await page.close();
          } catch (e) {}
        }
      }
      return true;
    } catch (error) {
      await this.initialize();
      return true;
    }
  }

  async fetchEnrichedMetadata(video: VideoEntry): Promise<VideoMetadata | null> {
    if (!this.context) throw new Error('Browser not initialized');
    console.log(`[v2] 📊 Enriched metadata fetch: ${video.title}`);
    const page = await this.context.newPage();
    try {
      const query = `YouTube video "${video.url}" complete information: duration, channel, description, views, publish date, topics, summary`;
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&udm=50`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(4000);
      const pageText = await page.evaluate(() => document.body.innerText);

      let duration = 0;
      const durationMatch = pageText.match(/(\d+)\s*minutes?\s*,?\s*(\d+)?\s*seconds?/i);
      if (durationMatch)
        duration = parseInt(durationMatch[1]) * 60 + parseInt(durationMatch[2] || '0');

      const metadata: VideoMetadata = {
        duration,
        durationFormatted: this.formatDuration(duration),
        channel: 'Unknown',
        viewCount: 'Unknown',
        publishDate: 'Unknown',
      };
      await page.close();
      return metadata;
    } catch (e) {
      await page.close();
      return null;
    }
  }

  async extractTranscriptDirect(video: VideoEntry): Promise<TranscriptSegment[] | null> {
    const safeTitle = video.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const transcriptFile = path.join(this.transcriptsDir, `${video.index}_${safeTitle}.txt`);

    if (fs.existsSync(transcriptFile)) {
      console.log(`[v2] ✅ Using existing transcript file: ${path.basename(transcriptFile)}`);
      const content = fs.readFileSync(transcriptFile, 'utf8');
      return content
        .split('\n')
        .filter((l) => l.trim())
        .map((line, i) => ({
          start: i * 5,
          duration: 5,
          text: line.replace(/^\[.*?\]\s*/, '').trim(),
        }));
    }

    const fb = this.downloadTranscriptWithYtDlp(video.url, video.videoId);
    if (fb) return fb;

    return null;
  }

  private getVisualHotspots(video: VideoEntry): number[] {
    const priorityKeywords = [
      'diagram',
      'architecture',
      'graph',
      'flow',
      'demo',
      'code',
      'snippet',
      'structure',
      'dashboard',
      'interface',
    ];
    const supportKeywords = [
      'look at',
      'showing',
      'screen',
      'slide',
      'figure',
      'framework',
      'chart',
      'pipeline',
      'context',
    ];

    const weightedHotspots: { ts: number; weight: number }[] = [];
    let duration = video.metadata?.duration || 0;

    if (video.transcript && video.transcript.length > 0) {
      const lastTs = video.transcript[video.transcript.length - 1].start;
      if (duration < 10 || duration < lastTs) duration = Math.floor(lastTs + 10);
    }

    if (video.transcript) {
      video.transcript.forEach((segment) => {
        const text = segment.text.toLowerCase();
        let weight = 0;
        if (priorityKeywords.some((k) => text.includes(k))) weight = 2;
        else if (supportKeywords.some((k) => text.includes(k))) weight = 1;
        if (weight > 0) {
          const ts = Math.min(duration, Math.floor(segment.start + 3));
          const isCluster = weightedHotspots.some((h) => Math.abs(h.ts - ts) < 45);
          if (!isCluster) weightedHotspots.push({ ts, weight });
        }
      });
    }

    weightedHotspots.sort((a, b) => b.weight - a.weight || a.ts - b.ts);
    const selected = new Set<number>();
    weightedHotspots.slice(0, 6).forEach((h) => selected.add(h.ts));
    selected.add(10);
    if (duration > 60) selected.add(Math.floor(duration / 2));
    if (duration > 20) selected.add(duration - 10);
    return Array.from(selected)
      .sort((a, b) => a - b)
      .slice(0, 8);
  }

  private async captureFrames(
    page: Page,
    video: VideoEntry,
    offsetSeconds: number = 0
  ): Promise<string[]> {
    console.log(
      `[v4-pro] 📸 Interrupt-Free Frame Capture for: ${video.title} (Offset: ${offsetSeconds}s)`
    );
    const frames: string[] = [];
    const timestamps = this.getVisualHotspots(video).map((ts) => Math.max(0, ts + offsetSeconds));
    console.log(
      `[v4-pro] 🎯 Target timestamps: ${timestamps.map((t) => this.formatDuration(t)).join(', ')}`
    );

    for (const ts of timestamps) {
      try {
        console.log(`[v4-pro] Seeking to ${this.formatDuration(ts)}...`);
        await page.evaluate((t) => {
          const v = document.querySelector('video');
          if (v) v.currentTime = t;
        }, ts);

        // Ensure playback is paused so frame is stable
        await page.evaluate(() => document.querySelector('video')?.pause());
        await page.waitForTimeout(2000);

        const framePath = path.join(this.framesDir, `${video.videoId}_${ts}.jpg`);

        // V3 Upgrade: Background-Safe Capture
        // Target the video element directly for high-fidelity content only
        const videoElement = page.locator('video').first();
        if (await videoElement.isVisible()) {
          await videoElement.screenshot({
            path: framePath,
            type: 'jpeg',
            quality: 90,
          });

          if (fs.existsSync(framePath)) {
            frames.push(fs.readFileSync(framePath, 'base64'));
          }
        }
      } catch (e) {
        console.error(`[v4-pro] Failed to capture frame at ${ts}:`, e);
      }
    }
    return frames;
  }

  private pruneFrames(video: VideoEntry): void {
    try {
      const files = fs.readdirSync(this.framesDir).filter((f) => f.startsWith(video.videoId));
      files.forEach((f) => {
        try {
          fs.unlinkSync(path.join(this.framesDir, f));
        } catch (e) {}
      });
      console.log(`[v4-pro] 🧹 Pruned ${files.length} frames for ${video.videoId}`);
    } catch (e) {}
  }

  async analyzeWithAI(video: VideoEntry): Promise<AnalysisResult | null> {
    if (!this.googleApiKey || !video.transcript) return null;

    let retries = 2;
    while (retries >= 0) {
      console.log(
        `[v4-pro] 🧠 Pro Multimodal Thinking (${PRO_MODEL}): ${video.title} (Retries: ${retries})`
      );

      const transcriptText = video.transcript
        .map((s) => `[${this.formatDuration(s.start)}] ${s.text}`)
        .join('\n');

      // Construct Gemini Parts
      const parts = [
        { text: ANALYSIS_PROMPT + transcriptText.substring(0, 30000) },
        ...(video.frames || []).map((f) => ({
          inline_data: { mime_type: 'image/jpeg', data: f },
        })),
      ];

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${PRO_MODEL}:generateContent?key=${this.googleApiKey}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 8192,
              response_mime_type: 'application/json',
              thinking_config: {
                include_thoughts: true,
                thinking_budget: 4096,
              },
            },
          }),
          signal: (AbortSignal as any).timeout(120000),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[v4-pro] ❌ API Error (${response.status}): ${errText.substring(0, 200)}`);
          retries--;
          continue;
        }

        const data = await response.json();
        const candidate = data.candidates[0];
        let rawResponse = candidate.content.parts[0].text;

        console.log(`[v4-pro] 📥 Received raw response (${rawResponse.length} chars)`);

        // Robust JSON extraction
        let jsonStr = rawResponse;
        const jsonMatch =
          rawResponse.match(/```json\n?([\s\S]*?)\n?```/) || rawResponse.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
        }

        try {
          const parsed = JSON.parse(jsonStr);
          return {
            keyPoints: parsed.keyPoints || [],
            aiConcepts: parsed.aiConcepts || [],
            technicalDetails: parsed.technicalDetails || [],
            visualContextFlags: parsed.visualContextFlags || [],
            summary: parsed.summary || '',
            visualUtilityScore: parsed.visualUtilityScore || 0,
            qualityScore: this.calculateQualityScore(parsed),
            rawResponse: rawResponse.substring(0, 1000),
          };
        } catch (parseError) {
          console.error(`[v4-pro] ❌ JSON Parse failed. Attempting fallback extraction...`);
          // Minimal fallback
          return {
            keyPoints: [],
            aiConcepts: [],
            technicalDetails: [],
            visualContextFlags: [],
            summary: rawResponse.substring(0, 500).replace(/\n/g, ' '),
            visualUtilityScore: 3, // Low score for failed parse
            qualityScore: 10,
            rawResponse: rawResponse.substring(0, 1000),
          };
        }
      } catch (e: any) {
        console.error(`[v4-pro] ❌ API Failure: ${e.message}`);
        retries--;
        if (retries >= 0) await new Promise((r) => setTimeout(r, 5000));
      }
    }
    return null;
  }

  private calculateQualityScore(parsed: any): number {
    let score = 0;
    if (parsed.summary && parsed.summary.length > 50) score += 25;
    if (parsed.keyPoints && parsed.keyPoints.length >= 3) score += 25;
    if (parsed.aiConcepts && parsed.aiConcepts.length > 0) score += 25;
    if (parsed.technicalDetails && parsed.technicalDetails.length > 0) score += 25;
    return score;
  }

  saveReport(video: VideoEntry): string {
    const safeTitle = video.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const reportFile = path.join(
      this.reportsDir,
      `v2_${video.index}_${safeTitle}_${Date.now()}.md`
    );
    let content = `# Video Analysis Report\n\n## Metadata\n- **Video**: ${video.title}\n- **Index**: #${video.index}\n- **URL**: ${video.url}\n- **Duration**: ${video.metadata?.durationFormatted || 'Unknown'}\n- **Processed**: ${new Date().toISOString()}\n\n---\n\n## Summary\n${video.analysis?.summary || 'No summary available'}\n`;

    if (video.analysis?.visualContextFlags && video.analysis.visualContextFlags.length > 0) {
      content += `\n## 🦾 Visual Intelligence\n${video.analysis.visualContextFlags
        .map((f) => `- **${this.formatDuration(f.timestamp)}**: ${f.reason} - ${f.context}`)
        .join('\n')}\n`;
    }

    fs.writeFileSync(reportFile, content);
    this.appendToKnowledgeBase(video);
    return reportFile;
  }

  private appendToKnowledgeBase(video: VideoEntry): void {
    const entryId = `video-analysis-${video.videoId}`;
    const safeTitle = video.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    // Phase 9: shared Federated ID# helper (see TranscriptProcessorV2).
    const idNumber = generateFederatedIdNumber(video.index);

    const compoundingEntry = {
      id: entryId,
      title: video.title,
      category: 'video-analysis',
      content: video.analysis?.summary || 'No summary',
      visual_intelligence: video.analysis?.visualContextFlags || [],
      backlinks: [
        ...(video.analysis?.aiConcepts || []),
        ...(video.analysis?.technicalDetails || []),
      ],
      metadata: {
        agentId: 'transcript-processor-v4',
        timestamp: new Date().toISOString(),
        videoId: video.videoId,
        url: video.url,
        qualityScore: video.analysis?.qualityScore || 0,
        idNumber: idNumber,
      },
    };

    const wikiInboxDir = path.join(path.dirname(this.stateFilePath), 'wiki-inbox');
    fs.mkdirSync(wikiInboxDir, { recursive: true });
    fs.writeFileSync(
      path.join(wikiInboxDir, `${entryId}.json`),
      JSON.stringify(compoundingEntry, null, 2)
    );

    const legacyEntry = `\n---\n\n## #${video.index}: ${video.title}\n**URL**: ${video.url}\n**Resource Pointer**: trp://wiki-inbox/${entryId}.json\n\n### Summary\n${video.analysis?.summary || 'No summary'}\n\n### Visual Findings\n${(video.analysis?.visualContextFlags || []).map((f) => `- [${this.formatDuration(f.timestamp)}] ${f.context}`).join('\n') || '- None'}\n\n`;
    fs.appendFileSync(this.knowledgeBaseFile, legacyEntry);
  }

  async processVideo(video: VideoEntry): Promise<boolean> {
    if (video.status === 'completed' || video.status === 'skipped') return true;
    if (video.processingAttempts >= 3) {
      video.status = 'skipped';
      this.state.stats.skipped++;
      this.saveState();
      return false;
    }
    await this.ensureBrowserHealth();
    console.log(`\n════ Video #${video.index}: ${video.title} ════\n`);
    video.processingAttempts++;
    this.saveState();

    try {
      if (!video.metadata) {
        let duration = 0;
        let durationFormatted = '0:00';
        try {
          const durStr = execSync(`yt-dlp --get-duration ${video.url}`).toString().trim();
          const parts = durStr.split(':').map(Number);
          if (parts.length === 2) duration = parts[0] * 60 + parts[1];
          else if (parts.length === 3) duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
          if (duration > 0) durationFormatted = durStr;
        } catch (e) {}

        video.metadata = (await this.fetchEnrichedMetadata(video)) || undefined;
        if (video.metadata) {
          if (duration > 0) {
            video.metadata.duration = duration;
            video.metadata.durationFormatted = durationFormatted;
          }
          this.state.stats.metadataComplete++;
        }
        this.saveState();
      }

      if (!video.transcript) {
        video.transcript = (await this.extractTranscriptDirect(video)) || undefined;
        if (video.transcript) this.state.stats.transcriptsExtracted++;
        this.saveState();
      }

      if (video.transcript) {
        // V3: Visual Frame Capture with Verification Loop
        let attempts = 0;
        let visualUtility = 0;

        while (attempts < 2 && visualUtility < 5) {
          if (!video.frames || attempts > 0) {
            const page = await this.context!.newPage();
            await page.goto(video.url, { waitUntil: 'load', timeout: 45000 });
            // Shift offset on second attempt
            video.frames = await this.captureFrames(page, video, attempts * 5);
            await page.close();
            this.saveState();
          }

          if (video.frames && !video.analysis) {
            console.log(`[v4-pro] 🔍 Verifying visual utility (Attempt ${attempts + 1})...`);
            video.analysis = (await this.analyzeWithAI(video)) || undefined;

            visualUtility = video.analysis?.visualUtilityScore || 0;
            console.log(`[v4-pro] 📊 Visual Utility Score: ${visualUtility}/10`);

            if (visualUtility < 5 && attempts < 1) {
              console.log(
                `[v4-pro] 🔄 Low visual utility detected. Retrying with temporal shift...`
              );
              attempts++;
              video.analysis = undefined; // Reset for retry
              continue;
            }
          }
          break;
        }

        if (video.analysis) this.state.stats.analyzed++;
        this.saveState();
      }

      if (video.analysis) {
        this.saveReport(video);
        video.status = 'completed';
        this.state.stats.completed++;
        // V3: Prune frames immediately after successful analysis
        this.pruneFrames(video);
      } else {
        video.status = 'error';
        this.state.stats.errors++;
      }

      this.saveState();
      return video.status === 'completed';
    } catch (e: any) {
      console.error(`[v4-pro] Error:`, e.message);
      video.status = 'error';
      this.state.stats.errors++;
      this.saveState();
      return false;
    }
  }

  async run(libraryPath: string, startIndex: number = 692, endIndex: number = 648): Promise<void> {
    console.log(`🚀 V3 Pipeline: #${startIndex} → #${endIndex} | Model: ${PRO_MODEL}`);
    await this.initialize();
    const content = fs.readFileSync(libraryPath, 'utf-8');
    const videos: VideoEntry[] = [];
    const rowRegex =
      /<tr>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>\s*<\/td>/g;
    let match;
    while ((match = rowRegex.exec(content)) !== null) {
      const index = parseInt(match[1]);
      if (index <= startIndex && index >= endIndex) {
        const existing = this.state.queue.find((v) => v.index === index);
        if (existing) videos.push(existing);
        else
          videos.push({
            index,
            url: match[2],
            title: match[3].trim(),
            videoId: this.extractVideoId(match[2]) || '',
            status: 'pending',
            processingAttempts: 0,
          });
      }
    }
    videos.sort((a, b) => b.index - a.index);
    this.state.queue = videos;
    this.state.stats.totalVideos = videos.length;
    this.saveState();

    for (const video of videos) {
      this.state.currentIndex = video.index;
      await this.processVideo(video);
      await new Promise((r) => setTimeout(r, 3000));
    }
    if (this.context) await this.context.close();
  }

  private downloadTranscriptWithYtDlp(url: string, videoId: string): TranscriptSegment[] | null {
    const tempDir = path.join(path.dirname(this.reportsDir), 'temp_subs');
    fs.mkdirSync(tempDir, { recursive: true });
    const outputFileBase = path.join(tempDir, videoId);
    try {
      execSync(
        `yt-dlp --write-auto-sub --write-sub --sub-lang en --skip-download --output "${outputFileBase}" "${url}"`,
        { stdio: 'ignore' }
      );
      const files = fs.readdirSync(tempDir);
      const subFile = files.find((f) => f.startsWith(videoId) && f.endsWith('.vtt'));
      if (!subFile) return null;
      const content = fs.readFileSync(path.join(tempDir, subFile), 'utf-8');
      const segments: TranscriptSegment[] = [];
      const blocks = content.split(/\n\r?\n/);
      for (const block of blocks) {
        const timeMatch = block.match(
          /(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s-->\s(\d{2}):(\d{2}):(\d{2})\.(\d{3})/
        );
        if (timeMatch) {
          const lines = block.split('\n');
          const tIdx = lines.findIndex((l) => l.includes('-->'));
          if (tIdx !== -1 && tIdx < lines.length - 1) {
            const text = lines
              .slice(tIdx + 1)
              .join(' ')
              .replace(/<[^>]*>/g, '')
              .trim();
            if (text && text !== 'align:start position:0%') {
              const startSec =
                parseInt(timeMatch[1]) * 3600 +
                parseInt(timeMatch[2]) * 60 +
                parseInt(timeMatch[3]) +
                parseInt(timeMatch[4]) / 1000;
              const endSec =
                parseInt(timeMatch[5]) * 3600 +
                parseInt(timeMatch[6]) * 60 +
                parseInt(timeMatch[7]) +
                parseInt(timeMatch[8]) / 1000;
              segments.push({ start: startSec, duration: endSec - startSec, text });
            }
          }
        }
      }
      fs.unlinkSync(path.join(tempDir, subFile));
      return segments;
    } catch (e) {
      return null;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const startArg = args.find((a) => a.startsWith('--start='));
  const endArg = args.find((a) => a.startsWith('--end='));
  const start = startArg ? parseInt(startArg.split('=')[1]) : 692;
  const end = endArg ? parseInt(endArg.split('=')[1]) : 648;
  const libraryPath =
    '/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/my-ai-knowledge-base/video-library/ai_video_library.html';
  const ingestProcessor = new TranscriptProcessorV4();
  await ingestProcessor.run(libraryPath, start, end);
}

main().catch(console.error);
