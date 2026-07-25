'use strict';
/**
 * Transcript Processor v3 - Omni-Vision Edition
 *
 * Improvements over v2:
 * 1. Uses moonshotai/kimi-k2.6 via NVIDIA NGC API (Multimodal)
 * 2. Integrated Native Vision Bridge via TNF Forge (screencap.so)
 * 3. Intelligent High-Fidelity Hotspot Selection (Capped at 8 images)
 * 4. Authoritative yt-dlp duration verification
 * 5. Robust state protection to prevent file corruption
 */
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
const node_child_process_1 = require('node:child_process');
const fs = __importStar(require('node:fs'));
const path = __importStar(require('node:path'));
const process = __importStar(require('node:process'));
const playwright_1 = require('playwright');
const TranscriptProcessorV2_js_1 = require('./TranscriptProcessorV2.js');
const { homedir } = require('node:os');
const { join, resolve } = require('node:path');
// Resolved at runtime so this package works in any checkout.
const TNF_ROOT = process.env.TNF_ROOT || resolve(__dirname, '..', '..', '..');

// Model & API Config
const MULTIMODAL_MODEL = 'moonshotai/kimi-k2.6';
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const ANALYSIS_PROMPT = `You are a high-fidelity intelligence extractor. You are analyzing a technical YouTube video using both its transcript and key visual frames. 

Your goal is to extract machine-actionable intelligence and structured technical insights. Pay special attention to:
1. Code snippets or CLI commands shown in frames.
2. Architectural diagrams and data flow.
3. Specific versions of tools and frameworks mentioned or shown.

IMPORTANT: Assess the "visualUtilityScore" (0-10) of the provided images. 
- 0-3: Only speaker face, logo, or generic intro slides.
- 4-7: Some diagrams or UI but hard to read or mostly covered.
- 8-10: High-fidelity code, architecture, or clear data tables.

Return ONLY a valid JSON object with this structure:
{
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
class TranscriptProcessorV3 {
  constructor(targetPhase = 'analysis') {
    this.context = null;
    this.targetPhase = 'analysis';
    this.nvidiaApiKey = '';
    this.targetPhase = targetPhase;
    const dataDir = TNF_ROOT + '/data';
    this.stateFilePath = path.join(dataDir, 'transcript-v2-state.json');
    this.reportsDir = path.join(dataDir, 'video-reports');
    this.transcriptsDir = path.join(dataDir, 'video-transcripts');
    this.framesDir = path.join(dataDir, 'video-frames');
    this.knowledgeBaseFile = path.join(dataDir, 'AI_Knowledge_Base.md');
    console.log(`[v3] Using data directory: ${dataDir}`);
    fs.mkdirSync(this.reportsDir, { recursive: true });
    fs.mkdirSync(this.transcriptsDir, { recursive: true });
    fs.mkdirSync(this.framesDir, { recursive: true });
    fs.mkdirSync(path.join(dataDir, 'temp_subs'), { recursive: true });
    this.state = this.loadState();
    this.loadNvidiaKey();
  }
  loadNvidiaKey() {
    try {
      const envPath = join(homedir(), '.hermes', '.env');
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/NVIDIA_API_KEY=(nvapi-[A-Za-z0-9\-_]+)/);
      if (match) {
        this.nvidiaApiKey = match[1];
        console.log('[v3] ✅ NVIDIA API Key loaded');
      } else {
        console.error('[v3] ❌ NVIDIA API Key not found in .hermes/.env');
      }
    } catch (e) {
      console.error('[v3] ❌ Failed to read .hermes/.env');
    }
  }
  loadState() {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        const content = fs.readFileSync(this.stateFilePath, 'utf-8');
        if (content.length > 0) {
          const state = JSON.parse(content);
          if (state.version !== '3.0') {
            console.log('[v3] Migrating state to v3 format...');
            state.version = '3.0';
          }
          return state;
        }
      }
    } catch (e) {
      console.log('[v3] ⚠️ State load error, creating fresh state');
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
  saveState() {
    if (!this.state || !this.state.queue || this.state.queue.length === 0) {
      console.error('[v3] ❌ Refusing to save empty or invalid state');
      return;
    }
    this.state.lastUpdated = new Date().toISOString();
    this.updateStats();
    fs.mkdirSync(path.dirname(this.stateFilePath), { recursive: true });
    fs.writeFileSync(this.stateFilePath, JSON.stringify(this.state, null, 2));
  }
  updateStats() {
    const s = this.state.stats;
    const analyzed = this.state.queue.filter((v) => v.analysis).length;
    const attempted = this.state.queue.filter((v) => v.processingAttempts > 0).length;
    s.analysisSuccessRate = attempted > 0 ? (analyzed / attempted) * 100 : 0;
    const transcripts = this.state.queue.filter((v) => v.transcript);
    s.averageTranscriptLength =
      transcripts.length > 0
        ? transcripts.reduce((sum, v) => {
            var _a;
            return (
              sum + (((_a = v.transcript) === null || _a === void 0 ? void 0 : _a.length) || 0)
            );
          }, 0) / transcripts.length
        : 0;
  }
  extractVideoId(url) {
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/
    );
    return match ? match[1] : null;
  }
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
  decodeHtmlEntities(text) {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }
  async initialize() {
    const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-clean');
    console.log('[v3] 🚀 Launching Headless Intelligence Bridge...');
    fs.mkdirSync(profileDir, { recursive: true });
    this.context = await playwright_1.chromium.launchPersistentContext(profileDir, {
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
    console.log('[v3] ✅ Headless Bridge ready');
  }
  async ensureBrowserHealth() {
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
  async fetchEnrichedMetadata(video) {
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
      const metadata = {
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
  async extractTranscriptDirect(video) {
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
  getVisualHotspots(video) {
    var _a;
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
    const weightedHotspots = [];
    let duration = ((_a = video.metadata) === null || _a === void 0 ? void 0 : _a.duration) || 0;
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
    const selected = new Set();
    weightedHotspots.slice(0, 6).forEach((h) => selected.add(h.ts));
    selected.add(10);
    if (duration > 60) selected.add(Math.floor(duration / 2));
    if (duration > 20) selected.add(duration - 10);
    return Array.from(selected)
      .sort((a, b) => a - b)
      .slice(0, 8);
  }
  async captureFrames(page, video, offsetSeconds = 0) {
    console.log(
      `[v3] 📸 Interrupt-Free Frame Capture for: ${video.title} (Offset: ${offsetSeconds}s)`
    );
    const frames = [];
    const timestamps = this.getVisualHotspots(video).map((ts) => Math.max(0, ts + offsetSeconds));
    console.log(
      `[v3] 🎯 Target timestamps: ${timestamps.map((t) => this.formatDuration(t)).join(', ')}`
    );
    for (const ts of timestamps) {
      try {
        console.log(`[v3] Seeking to ${this.formatDuration(ts)}...`);
        await page.evaluate((t) => {
          const v = document.querySelector('video');
          if (v) v.currentTime = t;
        }, ts);
        // Ensure playback is paused so frame is stable
        await page.evaluate(() => {
          var _a;
          return (_a = document.querySelector('video')) === null || _a === void 0
            ? void 0
            : _a.pause();
        });
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
        console.error(`[v3] Failed to capture frame at ${ts}:`, e);
      }
    }
    return frames;
  }
  pruneFrames(video) {
    try {
      const files = fs.readdirSync(this.framesDir).filter((f) => f.startsWith(video.videoId));
      files.forEach((f) => {
        try {
          fs.unlinkSync(path.join(this.framesDir, f));
        } catch (e) {}
      });
      console.log(`[v3] 🧹 Pruned ${files.length} frames for ${video.videoId}`);
    } catch (e) {}
  }
  async analyzeWithAI(video) {
    if (!this.nvidiaApiKey || !video.transcript) return null;
    let retries = 2;
    while (retries >= 0) {
      console.log(
        `[v3] 🧠 Multimodal Analysis via ${MULTIMODAL_MODEL}: ${video.title} (Retries: ${retries})`
      );
      const transcriptText = video.transcript
        .map((s) => `[${this.formatDuration(s.start)}] ${s.text}`)
        .join('\n');
      const messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: ANALYSIS_PROMPT + transcriptText.substring(0, 12000) },
            ...(video.frames || []).map((f) => ({
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${f}` },
            })),
          ],
        },
      ];
      try {
        const response = await fetch(NVIDIA_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.nvidiaApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: MULTIMODAL_MODEL,
            messages,
            max_tokens: 2048,
            temperature: 0.1,
          }),
          signal: AbortSignal.timeout(90000),
        });
        if (!response.ok) {
          retries--;
          continue;
        }
        const data = await response.json();
        let rawResponse = data.choices[0].message.content;
        rawResponse = rawResponse.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
        rawResponse = rawResponse.replace(/```json\n?|\n?```/g, '').trim();
        if (!rawResponse.startsWith('{')) {
          const match = rawResponse.match(/\{[\s\S]*\}/);
          if (match) rawResponse = match[0];
        }
        const parsed = JSON.parse(rawResponse);
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
      } catch (e) {
        retries--;
        if (retries >= 0) await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
    return null;
  }
  calculateQualityScore(parsed) {
    let score = 0;
    if (parsed.summary && parsed.summary.length > 50) score += 25;
    if (parsed.keyPoints && parsed.keyPoints.length >= 3) score += 25;
    if (parsed.aiConcepts && parsed.aiConcepts.length > 0) score += 25;
    if (parsed.technicalDetails && parsed.technicalDetails.length > 0) score += 25;
    return score;
  }
  saveReport(video) {
    var _a, _b, _c;
    const safeTitle = video.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const reportFile = path.join(
      this.reportsDir,
      `v2_${video.index}_${safeTitle}_${Date.now()}.md`
    );
    let content = `# Video Analysis Report\n\n## Metadata\n- **Video**: ${video.title}\n- **Index**: #${video.index}\n- **URL**: ${video.url}\n- **Duration**: ${((_a = video.metadata) === null || _a === void 0 ? void 0 : _a.durationFormatted) || 'Unknown'}\n- **Processed**: ${new Date().toISOString()}\n\n---\n\n## Summary\n${((_b = video.analysis) === null || _b === void 0 ? void 0 : _b.summary) || 'No summary available'}\n`;
    if (
      ((_c = video.analysis) === null || _c === void 0 ? void 0 : _c.visualContextFlags) &&
      video.analysis.visualContextFlags.length > 0
    ) {
      content += `\n## 🦾 Visual Intelligence\n${video.analysis.visualContextFlags
        .map((f) => `- **${this.formatDuration(f.timestamp)}**: ${f.reason} - ${f.context}`)
        .join('\n')}\n`;
    }
    fs.writeFileSync(reportFile, content);
    this.appendToKnowledgeBase(video);
    return reportFile;
  }
  appendToKnowledgeBase(video) {
    var _a, _b, _c, _d, _e, _f, _g;
    const entryId = `video-analysis-${video.videoId}`;
    const safeTitle = video.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    // Phase 9: shared Federated ID# helper. Canonical encoder still lives in
    // packages/a2a-core/src/federated-identity.service.ts; re-imported here
    // from the V2 sibling, which keeps the alphabet in sync.
    const idNumber = (0, TranscriptProcessorV2_js_1.generateFederatedIdNumber)(video.index);
    const compoundingEntry = {
      id: entryId,
      title: video.title,
      category: 'video-analysis',
      content:
        ((_a = video.analysis) === null || _a === void 0 ? void 0 : _a.summary) || 'No summary',
      visual_intelligence:
        ((_b = video.analysis) === null || _b === void 0 ? void 0 : _b.visualContextFlags) || [],
      backlinks: [
        ...(((_c = video.analysis) === null || _c === void 0 ? void 0 : _c.aiConcepts) || []),
        ...(((_d = video.analysis) === null || _d === void 0 ? void 0 : _d.technicalDetails) || []),
      ],
      metadata: {
        agentId: 'transcript-processor-v3',
        timestamp: new Date().toISOString(),
        videoId: video.videoId,
        url: video.url,
        qualityScore:
          ((_e = video.analysis) === null || _e === void 0 ? void 0 : _e.qualityScore) || 0,
        idNumber: idNumber,
      },
    };
    const wikiInboxDir = path.join(path.dirname(this.stateFilePath), 'wiki-inbox');
    fs.mkdirSync(wikiInboxDir, { recursive: true });
    fs.writeFileSync(
      path.join(wikiInboxDir, `${entryId}.json`),
      JSON.stringify(compoundingEntry, null, 2)
    );
    const legacyEntry = `\n---\n\n## #${video.index}: ${video.title}\n**URL**: ${video.url}\n**Resource Pointer**: trp://wiki-inbox/${entryId}.json\n\n### Summary\n${((_f = video.analysis) === null || _f === void 0 ? void 0 : _f.summary) || 'No summary'}\n\n### Visual Findings\n${(((_g = video.analysis) === null || _g === void 0 ? void 0 : _g.visualContextFlags) || []).map((f) => `- [${this.formatDuration(f.timestamp)}] ${f.context}`).join('\n') || '- None'}\n\n`;
    fs.appendFileSync(this.knowledgeBaseFile, legacyEntry);
  }
  async processVideo(video) {
    var _a;
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
          const durStr = (0, node_child_process_1.execSync)(`yt-dlp --get-duration ${video.url}`)
            .toString()
            .trim();
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
            const page = await this.context.newPage();
            await page.goto(video.url, { waitUntil: 'load', timeout: 45000 });
            // Shift offset on second attempt
            video.frames = await this.captureFrames(page, video, attempts * 5);
            await page.close();
            this.saveState();
          }
          if (video.frames && !video.analysis) {
            console.log(`[v3] 🔍 Verifying visual utility (Attempt ${attempts + 1})...`);
            video.analysis = (await this.analyzeWithAI(video)) || undefined;
            visualUtility =
              ((_a = video.analysis) === null || _a === void 0 ? void 0 : _a.visualUtilityScore) ||
              0;
            console.log(`[v3] 📊 Visual Utility Score: ${visualUtility}/10`);
            if (visualUtility < 5 && attempts < 1) {
              console.log(`[v3] 🔄 Low visual utility detected. Retrying with temporal shift...`);
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
    } catch (e) {
      console.error(`[v3] Error:`, e.message);
      video.status = 'error';
      this.state.stats.errors++;
      this.saveState();
      return false;
    }
  }
  async run(libraryPath, startIndex = 692, endIndex = 648) {
    console.log(`🚀 V3 Pipeline: #${startIndex} → #${endIndex} | Model: ${MULTIMODAL_MODEL}`);
    await this.initialize();
    const content = fs.readFileSync(libraryPath, 'utf-8');
    const videos = [];
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
  downloadTranscriptWithYtDlp(url, videoId) {
    const tempDir = path.join(path.dirname(this.reportsDir), 'temp_subs');
    fs.mkdirSync(tempDir, { recursive: true });
    const outputFileBase = path.join(tempDir, videoId);
    try {
      (0, node_child_process_1.execSync)(
        `yt-dlp --write-auto-sub --write-sub --sub-lang en --skip-download --output "${outputFileBase}" "${url}"`,
        { stdio: 'ignore' }
      );
      const files = fs.readdirSync(tempDir);
      const subFile = files.find((f) => f.startsWith(videoId) && f.endsWith('.vtt'));
      if (!subFile) return null;
      const content = fs.readFileSync(path.join(tempDir, subFile), 'utf-8');
      const segments = [];
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
  const libraryPath = process.env.TNF_VIDEO_LIBRARY || '';
  const ingestProcessor = new TranscriptProcessorV3();
  await ingestProcessor.run(libraryPath, start, end);
}
main().catch(console.error);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHJhbnNjcmlwdFByb2Nlc3NvclYzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiVHJhbnNjcmlwdFByb2Nlc3NvclYzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7O0dBU0c7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsMkRBQThDO0FBQzlDLDRDQUE4QjtBQUM5QixnREFBa0M7QUFDbEMsc0RBQXdDO0FBRXhDLDJDQUFzRTtBQUV0RSx5RUFBdUU7QUFrRnZFLHFCQUFxQjtBQUNyQixNQUFNLGdCQUFnQixHQUFHLHNCQUFzQixDQUFDO0FBQ2hELE1BQU0sY0FBYyxHQUFHLHNEQUFzRCxDQUFDO0FBRTlFLE1BQU0sZUFBZSxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBeUJ2QixDQUFDO0FBRUYsTUFBTSxxQkFBcUI7SUFXekIsWUFBWSxjQUFzRCxVQUFVO1FBVnBFLFlBQU8sR0FBMEIsSUFBSSxDQUFDO1FBT3RDLGdCQUFXLEdBQTJDLFVBQVUsQ0FBQztRQUNqRSxpQkFBWSxHQUFXLEVBQUUsQ0FBQztRQUdoQyxJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztRQUMvQixNQUFNLE9BQU8sR0FBRyxrRUFBa0UsQ0FBQztRQUVuRixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLDBCQUEwQixDQUFDLENBQUM7UUFDcEUsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxlQUFlLENBQUMsQ0FBQztRQUN0RCxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLG1CQUFtQixDQUFDLENBQUM7UUFDOUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxjQUFjLENBQUMsQ0FBQztRQUNwRCxJQUFJLENBQUMsaUJBQWlCLEdBQUcs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Q0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7SUFDaEUsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7SUFDMUQsTUFBTSxXQUFXLEdBQ2YseUdBQXlHLENBQUM7SUFDNUcsTUFBTSxlQUFlLEdBQUcsSUFBSSxxQkFBcUIsRUFBRSxDQUFDO0lBQ3BELE1BQU0sZUFBZSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ3JELENBQUM7QUFFRCxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBUcmFuc2NyaXB0IFByb2Nlc3NvciB2MyAtIE9tbmktVmlzaW9uIEVkaXRpb25cbiAqXG4gKiBJbXByb3ZlbWVudHMgb3ZlciB2MjpcbiAqIDEuIFVzZXMgbW9vbnNob3RhaS9raW1pLWsyLjYgdmlhIE5WSURJQSBOR0MgQVBJIChNdWx0aW1vZGFsKVxuICogMi4gSW50ZWdyYXRlZCBOYXRpdmUgVmlzaW9uIEJyaWRnZSB2aWEgVE5GIEZvcmdlIChzY3JlZW5jYXAuc28pXG4gKiAzLiBJbnRlbGxpZ2VudCBIaWdoLUZpZGVsaXR5IEhvdHNwb3QgU2VsZWN0aW9uIChDYXBwZWQgYXQgOCBpbWFnZXMpXG4gKiA0LiBBdXRob3JpdGF0aXZlIHl0LWRscCBkdXJhdGlvbiB2ZXJpZmljYXRpb25cbiAqIDUuIFJvYnVzdCBzdGF0ZSBwcm90ZWN0aW9uIHRvIHByZXZlbnQgZmlsZSBjb3JydXB0aW9uXG4gKi9cblxuaW1wb3J0IHsgZXhlY1N5bmMgfSBmcm9tICdub2RlOmNoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgKiBhcyBwcm9jZXNzIGZyb20gJ25vZGU6cHJvY2Vzcyc7XG5cbmltcG9ydCB7IGNocm9taXVtLCB0eXBlIEJyb3dzZXJDb250ZXh0LCB0eXBlIFBhZ2UgfSBmcm9tICdwbGF5d3JpZ2h0JztcblxuaW1wb3J0IHsgZ2VuZXJhdGVGZWRlcmF0ZWRJZE51bWJlciB9IGZyb20gJy4vVHJhbnNjcmlwdFByb2Nlc3NvclYyLmpzJztcblxuaW50ZXJmYWNlIFZpZGVvRW50cnkge1xuICBpbmRleDogbnVtYmVyO1xuICB1cmw6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgdmlkZW9JZDogc3RyaW5nO1xuICBtZXRhZGF0YT86IFZpZGVvTWV0YWRhdGE7XG4gIHRyYW5zY3JpcHQ/OiBUcmFuc2NyaXB0U2VnbWVudFtdO1xuICBhbmFseXNpcz86IEFuYWx5c2lzUmVzdWx0O1xuICBmcmFtZXM/OiBzdHJpbmdbXTsgLy8gQmFzZTY0IGVuY29kZWQgSlBFRyBmcmFtZXNcbiAgc3RhdHVzOlxuICAgIHwgJ3BlbmRpbmcnXG4gICAgfCAnbWV0YWRhdGEnXG4gICAgfCAndHJhbnNjcmlwdCdcbiAgICB8ICdhbmFseXplZCdcbiAgICB8ICduZWVkc192aXN1YWwnXG4gICAgfCAnY29tcGxldGVkJ1xuICAgIHwgJ3NraXBwZWQnXG4gICAgfCAnZXJyb3InO1xuICBwcm9jZXNzaW5nQXR0ZW1wdHM6IG51bWJlcjtcbiAgbGFzdFByb2Nlc3NlZD86IHN0cmluZztcbiAgZXJyb3I/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBWaWRlb01ldGFkYXRhIHtcbiAgZHVyYXRpb246IG51bWJlcjtcbiAgZHVyYXRpb25Gb3JtYXR0ZWQ6IHN0cmluZztcbiAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gIGNoYW5uZWw/OiBzdHJpbmc7XG4gIHB1Ymxpc2hEYXRlPzogc3RyaW5nO1xuICB2aWV3Q291bnQ/OiBzdHJpbmc7XG4gIGNhdGVnb3J5Pzogc3RyaW5nO1xuICB0YWdzPzogc3RyaW5nW107XG4gIHN1bW1hcnk/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBUcmFuc2NyaXB0U2VnbWVudCB7XG4gIHN0YXJ0OiBudW1iZXI7XG4gIGR1cmF0aW9uOiBudW1iZXI7XG4gIHRleHQ6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIEFuYWx5c2lzUmVzdWx0IHtcbiAga2V5UG9pbnRzOiBzdHJpbmdbXTtcbiAgYWlDb25jZXB0czogc3RyaW5nW107XG4gIHRlY2huaWNhbERldGFpbHM6IHN0cmluZ1tdO1xuICB2aXN1YWxDb250ZXh0RmxhZ3M6IFZpc3VhbENvbnRleHRGbGFnW107XG4gIHN1bW1hcnk6IHN0cmluZztcbiAgdmlzdWFsVXRpbGl0eVNjb3JlOiBudW1iZXI7XG4gIHF1YWxpdHlTY29yZT86IG51bWJlcjtcbiAgcmF3UmVzcG9uc2U/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBWaXN1YWxDb250ZXh0RmxhZyB7XG4gIHRpbWVzdGFtcDogbnVtYmVyO1xuICByZWFzb246IHN0cmluZztcbiAgY29udGV4dDogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgUHJvY2Vzc2luZ1N0YXRlIHtcbiAgdmVyc2lvbjogc3RyaW5nO1xuICBxdWV1ZTogVmlkZW9FbnRyeVtdO1xuICBjdXJyZW50SW5kZXg6IG51bWJlcjtcbiAgc3RhcnRlZEF0OiBzdHJpbmc7XG4gIGxhc3RVcGRhdGVkOiBzdHJpbmc7XG4gIHN0YXRzOiBQcm9jZXNzaW5nU3RhdHM7XG59XG5cbmludGVyZmFjZSBQcm9jZXNzaW5nU3RhdHMge1xuICB0b3RhbFZpZGVvczogbnVtYmVyO1xuICBtZXRhZGF0YUNvbXBsZXRlOiBudW1iZXI7XG4gIHRyYW5zY3JpcHRzRXh0cmFjdGVkOiBudW1iZXI7XG4gIGFuYWx5emVkOiBudW1iZXI7XG4gIG5lZWRzVmlzdWFsUmV2aWV3OiBudW1iZXI7XG4gIGNvbXBsZXRlZDogbnVtYmVyO1xuICBza2lwcGVkOiBudW1iZXI7XG4gIGVycm9yczogbnVtYmVyO1xuICBhbmFseXNpc1N1Y2Nlc3NSYXRlOiBudW1iZXI7XG4gIGF2ZXJhZ2VUcmFuc2NyaXB0TGVuZ3RoOiBudW1iZXI7XG59XG5cbi8vIE1vZGVsICYgQVBJIENvbmZpZ1xuY29uc3QgTVVMVElNT0RBTF9NT0RFTCA9ICdtb29uc2hvdGFpL2tpbWktazIuNic7XG5jb25zdCBOVklESUFfQVBJX1VSTCA9ICdodHRwczovL2ludGVncmF0ZS5hcGkubnZpZGlhLmNvbS92MS9jaGF0L2NvbXBsZXRpb25zJztcblxuY29uc3QgQU5BTFlTSVNfUFJPTVBUID0gYFlvdSBhcmUgYSBoaWdoLWZpZGVsaXR5IGludGVsbGlnZW5jZSBleHRyYWN0b3IuIFlvdSBhcmUgYW5hbHl6aW5nIGEgdGVjaG5pY2FsIFlvdVR1YmUgdmlkZW8gdXNpbmcgYm90aCBpdHMgdHJhbnNjcmlwdCBhbmQga2V5IHZpc3VhbCBmcmFtZXMuIFxuXG5Zb3VyIGdvYWwgaXMgdG8gZXh0cmFjdCBtYWNoaW5lLWFjdGlvbmFibGUgaW50ZWxsaWdlbmNlIGFuZCBzdHJ1Y3R1cmVkIHRlY2huaWNhbCBpbnNpZ2h0cy4gUGF5IHNwZWNpYWwgYXR0ZW50aW9uIHRvOlxuMS4gQ29kZSBzbmlwcGV0cyBvciBDTEkgY29tbWFuZHMgc2hvd24gaW4gZnJhbWVzLlxuMi4gQXJjaGl0ZWN0dXJhbCBkaWFncmFtcyBhbmQgZGF0YSBmbG93LlxuMy4gU3BlY2lmaWMgdmVyc2lvbnMgb2YgdG9vbHMgYW5kIGZyYW1ld29ya3MgbWVudGlvbmVkIG9yIHNob3duLlxuXG5JTVBPUlRBTlQ6IEFzc2VzcyB0aGUgXCJ2aXN1YWxVdGlsaXR5U2NvcmVcIiAoMC0xMCkgb2YgdGhlIHByb3ZpZGVkIGltYWdlcy4gXG4tIDAtMzogT25seSBzcGVha2VyIGZhY2UsIGxvZ28sIG9yIGdlbmVyaWMgaW50cm8gc2xpZGVzLlxuLSA0LTc6IFNvbWUgZGlhZ3JhbXMgb3IgVUkgYnV0IGhhcmQgdG8gcmVhZCBvciBtb3N0bHkgY292ZXJlZC5cbi0gOC0xMDogSGlnaC1maWRlbGl0eSBjb2RlLCBhcmNoaXRlY3R1cmUsIG9yIGNsZWFyIGRhdGEgdGFibGVzLlxuXG5SZXR1cm4gT05MWSBhIHZhbGlkIEpTT04gb2JqZWN0IHdpdGggdGhpcyBzdHJ1Y3R1cmU6XG57XG4gIFwic3VtbWFyeVwiOiBcIkNvbmNpc2UgdGVjaG5pY2FsIHN1bW1hcnlcIixcbiAgXCJ2aXN1YWxVdGlsaXR5U2NvcmVcIjogOCxcbiAgXCJrZXlQb2ludHNcIjogW1wiUG9pbnQgMVwiLCBcIlBvaW50IDJcIiwgLi4uXSxcbiAgXCJhaUNvbmNlcHRzXCI6IFtcIkNvbmNlcHQgMVwiLCBcIkNvbmNlcHQgMlwiLCAuLi5dLFxuICBcInRlY2huaWNhbERldGFpbHNcIjogW1wiRGV0YWlsZWQgaW1wbGVtZW50YXRpb24gb3IgdG9vbCBpbmZvXCIsIC4uLl0sXG4gIFwidmlzdWFsQ29udGV4dEZsYWdzXCI6IFtcbiAgICB7XCJ0aW1lc3RhbXBcIjogMTIwLCBcInJlYXNvblwiOiBcIlJlYXNvbiBmb3IgZmxhZ2dpbmdcIiwgXCJjb250ZXh0XCI6IFwiVmlzaWJsZSBkZXRhaWxzIGZyb20gZnJhbWVcIn1cbiAgXVxufVxuXG5UUkFOU0NSSVBUIFNFR01FTlQ6XG5gO1xuXG5jbGFzcyBUcmFuc2NyaXB0UHJvY2Vzc29yVjMge1xuICBwcml2YXRlIGNvbnRleHQ6IEJyb3dzZXJDb250ZXh0IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc3RhdGU6IFByb2Nlc3NpbmdTdGF0ZTtcbiAgcHJpdmF0ZSBzdGF0ZUZpbGVQYXRoOiBzdHJpbmc7XG4gIHByaXZhdGUgcmVwb3J0c0Rpcjogc3RyaW5nO1xuICBwcml2YXRlIHRyYW5zY3JpcHRzRGlyOiBzdHJpbmc7XG4gIHByaXZhdGUgZnJhbWVzRGlyOiBzdHJpbmc7XG4gIHByaXZhdGUga25vd2xlZGdlQmFzZUZpbGU6IHN0cmluZztcbiAgcHJpdmF0ZSB0YXJnZXRQaGFzZTogJ21ldGFkYXRhJyB8ICd0cmFuc2NyaXB0JyB8ICdhbmFseXNpcycgPSAnYW5hbHlzaXMnO1xuICBwcml2YXRlIG52aWRpYUFwaUtleTogc3RyaW5nID0gJyc7XG5cbiAgY29uc3RydWN0b3IodGFyZ2V0UGhhc2U6ICdtZXRhZGF0YScgfCAndHJhbnNjcmlwdCcgfCAnYW5hbHlzaXMnID0gJ2FuYWx5c2lzJykge1xuICAgIHRoaXMudGFyZ2V0UGhhc2UgPSB0YXJnZXRQaGFzZTtcbiAgICBjb25zdCBkYXRhRGlyID0gJy9Vc2Vycy9kYW5pZWxnb2xkYmVyZy9EZXNrdG9wL0ExLUludGVyLUxMTS1Db20vVGhlLU5ldy1GdXNlL2RhdGEnO1xuXG4gICAgdGhpcy5zdGF0ZUZpbGVQYXRoID0gcGF0aC5qb2luKGRhdGFEaXIsICd0cmFuc2NyaXB0LXYyLXN0YXRlLmpzb24nKTtcbiAgICB0aGlzLnJlcG9ydHNEaXIgPSBwYXRoLmpvaW4oZGF0YURpciwgJ3ZpZGVvLXJlcG9ydHMnKTtcbiAgICB0aGlzLnRyYW5zY3JpcHRzRGlyID0gcGF0aC5qb2luKGRhdGFEaXIsICd2aWRlby10cmFuc2NyaXB0cycpO1xuICAgIHRoaXMuZnJhbWVzRGlyID0gcGF0aC5qb2luKGRhdGFEaXIsICd2aWRlby1mcmFtZXMnKTtcbiAgICB0aGlzLmtub3dsZWRnZUJhc2VGaWxlID0gcGF0aC5qb2luKGRhdGFEaXIsICdBSV9Lbm93bGVkZ2VfQmFzZS5tZCcpO1xuXG4gICAgY29uc29sZS5sb2coYFt2M10gVXNpbmcgZGF0YSBkaXJlY3Rvcnk6ICR7ZGF0YURpcn1gKTtcblxuICAgIGZzLm1rZGlyU3luYyh0aGlzLnJlcG9ydHNEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGZzLm1rZGlyU3luYyh0aGlzLnRyYW5zY3JpcHRzRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBmcy5ta2RpclN5bmModGhpcy5mcmFtZXNEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGZzLm1rZGlyU3luYyhwYXRoLmpvaW4oZGF0YURpciwgJ3RlbXBfc3VicycpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcblxuICAgIHRoaXMuc3RhdGUgPSB0aGlzLmxvYWRTdGF0ZSgpO1xuICAgIHRoaXMubG9hZE52aWRpYUtleSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBsb2FkTnZpZGlhS2V5KCk6IHZvaWQge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBlbnZQYXRoID0gJy9Vc2Vycy9kYW5pZWxnb2xkYmVyZy8uaGVybWVzLy5lbnYnO1xuICAgICAgY29uc3QgZW52Q29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhlbnZQYXRoLCAndXRmOCcpO1xuICAgICAgY29uc3QgbWF0Y2ggPSBlbnZDb250ZW50Lm1hdGNoKC9OVklESUFfQVBJX0tFWT0obnZhcGktW0EtWmEtejAtOVxcLV9dKykvKTtcbiAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICB0aGlzLm52aWRpYUFwaUtleSA9IG1hdGNoWzFdO1xuICAgICAgICBjb25zb2xlLmxvZygnW3YzXSDinIUgTlZJRElBIEFQSSBLZXkgbG9hZGVkJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdbdjNdIOKdjCBOVklESUEgQVBJIEtleSBub3QgZm91bmQgaW4gLmhlcm1lcy8uZW52Jyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcignW3YzXSDinYwgRmFpbGVkIHRvIHJlYWQgLmhlcm1lcy8uZW52Jyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBsb2FkU3RhdGUoKTogUHJvY2Vzc2luZ1N0YXRlIHtcbiAgICB0cnkge1xuICAgICAgaWYgKGZzLmV4aXN0c1N5bmModGhpcy5zdGF0ZUZpbGVQYXRoKSkge1xuICAgICAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHRoaXMuc3RhdGVGaWxlUGF0aCwgJ3V0Zi04Jyk7XG4gICAgICAgIGlmIChjb250ZW50Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBjb25zdCBzdGF0ZSA9IEpTT04ucGFyc2UoY29udGVudCk7XG4gICAgICAgICAgaWYgKHN0YXRlLnZlcnNpb24gIT09ICczLjAnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW3YzXSBNaWdyYXRpbmcgc3RhdGUgdG8gdjMgZm9ybWF0Li4uJyk7XG4gICAgICAgICAgICBzdGF0ZS52ZXJzaW9uID0gJzMuMCc7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdbdjNdIOKaoO+4jyBTdGF0ZSBsb2FkIGVycm9yLCBjcmVhdGluZyBmcmVzaCBzdGF0ZScpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgdmVyc2lvbjogJzMuMCcsXG4gICAgICBxdWV1ZTogW10sXG4gICAgICBjdXJyZW50SW5kZXg6IDAsXG4gICAgICBzdGFydGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIGxhc3RVcGRhdGVkOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICBzdGF0czoge1xuICAgICAgICB0b3RhbFZpZGVvczogMCxcbiAgICAgICAgbWV0YWRhdGFDb21wbGV0ZTogMCxcbiAgICAgICAgdHJhbnNjcmlwdHNFeHRyYWN0ZWQ6IDAsXG4gICAgICAgIGFuYWx5emVkOiAwLFxuICAgICAgICBuZWVkc1Zpc3VhbFJldmlldzogMCxcbiAgICAgICAgY29tcGxldGVkOiAwLFxuICAgICAgICBza2lwcGVkOiAwLFxuICAgICAgICBlcnJvcnM6IDAsXG4gICAgICAgIGFuYWx5c2lzU3VjY2Vzc1JhdGU6IDAsXG4gICAgICAgIGF2ZXJhZ2VUcmFuc2NyaXB0TGVuZ3RoOiAwLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBzYXZlU3RhdGUoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnN0YXRlIHx8ICF0aGlzLnN0YXRlLnF1ZXVlIHx8IHRoaXMuc3RhdGUucXVldWUubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbdjNdIOKdjCBSZWZ1c2luZyB0byBzYXZlIGVtcHR5IG9yIGludmFsaWQgc3RhdGUnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zdGF0ZS5sYXN0VXBkYXRlZCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICB0aGlzLnVwZGF0ZVN0YXRzKCk7XG4gICAgZnMubWtkaXJTeW5jKHBhdGguZGlybmFtZSh0aGlzLnN0YXRlRmlsZVBhdGgpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBmcy53cml0ZUZpbGVTeW5jKHRoaXMuc3RhdGVGaWxlUGF0aCwgSlNPTi5zdHJpbmdpZnkodGhpcy5zdGF0ZSwgbnVsbCwgMikpO1xuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVTdGF0cygpOiB2b2lkIHtcbiAgICBjb25zdCBzID0gdGhpcy5zdGF0ZS5zdGF0cztcbiAgICBjb25zdCBhbmFseXplZCA9IHRoaXMuc3RhdGUucXVldWUuZmlsdGVyKCh2KSA9PiB2LmFuYWx5c2lzKS5sZW5ndGg7XG4gICAgY29uc3QgYXR0ZW1wdGVkID0gdGhpcy5zdGF0ZS5xdWV1ZS5maWx0ZXIoKHYpID0+IHYucHJvY2Vzc2luZ0F0dGVtcHRzID4gMCkubGVuZ3RoO1xuICAgIHMuYW5hbHlzaXNTdWNjZXNzUmF0ZSA9IGF0dGVtcHRlZCA+IDAgPyAoYW5hbHl6ZWQgLyBhdHRlbXB0ZWQpICogMTAwIDogMDtcbiAgICBjb25zdCB0cmFuc2NyaXB0cyA9IHRoaXMuc3RhdGUucXVldWUuZmlsdGVyKCh2KSA9PiB2LnRyYW5zY3JpcHQpO1xuICAgIHMuYXZlcmFnZVRyYW5zY3JpcHRMZW5ndGggPVxuICAgICAgdHJhbnNjcmlwdHMubGVuZ3RoID4gMFxuICAgICAgICA/IHRyYW5zY3JpcHRzLnJlZHVjZSgoc3VtLCB2KSA9PiBzdW0gKyAodi50cmFuc2NyaXB0Py5sZW5ndGggfHwgMCksIDApIC8gdHJhbnNjcmlwdHMubGVuZ3RoXG4gICAgICAgIDogMDtcbiAgfVxuXG4gIHByaXZhdGUgZXh0cmFjdFZpZGVvSWQodXJsOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBjb25zdCBtYXRjaCA9IHVybC5tYXRjaChcbiAgICAgIC8oPzp5b3V0dWJlXFwuY29tXFwvd2F0Y2hcXD92PXx5b3V0dVxcLmJlXFwvfHlvdXR1YmVcXC5jb21cXC9lbWJlZFxcLykoW14mXFxzP10rKS9cbiAgICApO1xuICAgIHJldHVybiBtYXRjaCA/IG1hdGNoWzFdIDogbnVsbDtcbiAgfVxuXG4gIGZvcm1hdER1cmF0aW9uKHNlY29uZHM6IG51bWJlcik6IHN0cmluZyB7XG4gICAgY29uc3QgaG91cnMgPSBNYXRoLmZsb29yKHNlY29uZHMgLyAzNjAwKTtcbiAgICBjb25zdCBtaW51dGVzID0gTWF0aC5mbG9vcigoc2Vjb25kcyAlIDM2MDApIC8gNjApO1xuICAgIGNvbnN0IHNlY3MgPSBNYXRoLmZsb29yKHNlY29uZHMgJSA2MCk7XG4gICAgcmV0dXJuIGhvdXJzID4gMFxuICAgICAgPyBgJHtob3Vyc306JHttaW51dGVzLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKX06JHtzZWNzLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKX1gXG4gICAgICA6IGAke21pbnV0ZXN9OiR7c2Vjcy50b1N0cmluZygpLnBhZFN0YXJ0KDIsICcwJyl9YDtcbiAgfVxuXG4gIGRlY29kZUh0bWxFbnRpdGllcyh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiB0ZXh0XG4gICAgICAucmVwbGFjZSgvJmFtcDsvZywgJyYnKVxuICAgICAgLnJlcGxhY2UoLyZsdDsvZywgJzwnKVxuICAgICAgLnJlcGxhY2UoLyZndDsvZywgJz4nKVxuICAgICAgLnJlcGxhY2UoLyZxdW90Oy9nLCAnXCInKVxuICAgICAgLnJlcGxhY2UoLyYjMzk7L2csIFwiJ1wiKTtcbiAgfVxuXG4gIGFzeW5jIGluaXRpYWxpemUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgcHJvZmlsZURpciA9IHBhdGguam9pbihwcm9jZXNzLmVudi5IT01FIHx8ICcvdG1wJywgJy52aWRlby1wcm9jZXNzb3ItY2hyb21lLWNsZWFuJyk7XG4gICAgY29uc29sZS5sb2coJ1t2M10g8J+agCBMYXVuY2hpbmcgSGVhZGxlc3MgSW50ZWxsaWdlbmNlIEJyaWRnZS4uLicpO1xuICAgIGZzLm1rZGlyU3luYyhwcm9maWxlRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICB0aGlzLmNvbnRleHQgPSBhd2FpdCBjaHJvbWl1bS5sYXVuY2hQZXJzaXN0ZW50Q29udGV4dChwcm9maWxlRGlyLCB7XG4gICAgICBoZWFkbGVzczogdHJ1ZSwgLy8gVjMgVXBncmFkZTogVHJ1bHkgaGVhZGxlc3MgdG8gcHJldmVudCBmb2N1cyBzdGVhbGluZ1xuICAgICAgYXJnczogW1xuICAgICAgICAnLS1uby1maXJzdC1ydW4nLFxuICAgICAgICAnLS1uby1kZWZhdWx0LWJyb3dzZXItY2hlY2snLFxuICAgICAgICAnLS1kaXNhYmxlLWJsaW5rLWZlYXR1cmVzPUF1dG9tYXRpb25Db250cm9sbGVkJyxcbiAgICAgICAgJy0td2luZG93LXNpemU9MTI4MCw4MDAnLFxuICAgICAgICAnLS1tdXRlLWF1ZGlvJyxcbiAgICAgICAgJy0tYXV0b3BsYXktcG9saWN5PW5vLXVzZXItZ2VzdHVyZS1yZXF1aXJlZCcsXG4gICAgICBdLFxuICAgICAgdXNlckFnZW50OlxuICAgICAgICAnTW96aWxsYS81LjAgKE1hY2ludG9zaDsgSW50ZWwgTWFjIE9TIFggMTBfMTVfNykgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyMi4wLjAuMCBTYWZhcmkvNTM3LjM2JyxcbiAgICAgIHZpZXdwb3J0OiB7IHdpZHRoOiAxMjgwLCBoZWlnaHQ6IDgwMCB9LFxuICAgICAgaWdub3JlRGVmYXVsdEFyZ3M6IFsnLS1lbmFibGUtYXV0b21hdGlvbiddLFxuICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKCdbdjNdIOKchSBIZWFkbGVzcyBCcmlkZ2UgcmVhZHknKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZW5zdXJlQnJvd3NlckhlYWx0aCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgaWYgKCF0aGlzLmNvbnRleHQpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5pbml0aWFsaXplKCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgcGFnZXMgPSBhd2FpdCB0aGlzLmNvbnRleHQucGFnZXMoKTtcbiAgICAgIGlmIChwYWdlcy5sZW5ndGggPiAzMCkge1xuICAgICAgICBmb3IgKGNvbnN0IHBhZ2Ugb2YgcGFnZXMpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBhd2FpdCB0aGlzLmluaXRpYWxpemUoKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGZldGNoRW5yaWNoZWRNZXRhZGF0YSh2aWRlbzogVmlkZW9FbnRyeSk6IFByb21pc2U8VmlkZW9NZXRhZGF0YSB8IG51bGw+IHtcbiAgICBpZiAoIXRoaXMuY29udGV4dCkgdGhyb3cgbmV3IEVycm9yKCdCcm93c2VyIG5vdCBpbml0aWFsaXplZCcpO1xuICAgIGNvbnNvbGUubG9nKGBbdjJdIPCfk4ogRW5yaWNoZWQgbWV0YWRhdGEgZmV0Y2g6ICR7dmlkZW8udGl0bGV9YCk7XG4gICAgY29uc3QgcGFnZSA9IGF3YWl0IHRoaXMuY29udGV4dC5uZXdQYWdlKCk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHF1ZXJ5ID0gYFlvdVR1YmUgdmlkZW8gXCIke3ZpZGVvLnVybH1cIiBjb21wbGV0ZSBpbmZvcm1hdGlvbjogZHVyYXRpb24sIGNoYW5uZWwsIGRlc2NyaXB0aW9uLCB2aWV3cywgcHVibGlzaCBkYXRlLCB0b3BpY3MsIHN1bW1hcnlgO1xuICAgICAgY29uc3Qgc2VhcmNoVXJsID0gYGh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vc2VhcmNoP3E9JHtlbmNvZGVVUklDb21wb25lbnQocXVlcnkpfSZ1ZG09NTBgO1xuICAgICAgYXdhaXQgcGFnZS5nb3RvKHNlYXJjaFVybCwgeyB3YWl0VW50aWw6ICdkb21jb250ZW50bG9hZGVkJywgdGltZW91dDogMzAwMDAgfSk7XG4gICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDQwMDApO1xuICAgICAgY29uc3QgcGFnZVRleHQgPSBhd2FpdCBwYWdlLmV2YWx1YXRlKCgpID0+IGRvY3VtZW50LmJvZHkuaW5uZXJUZXh0KTtcblxuICAgICAgbGV0IGR1cmF0aW9uID0gMDtcbiAgICAgIGNvbnN0IGR1cmF0aW9uTWF0Y2ggPSBwYWdlVGV4dC5tYXRjaCgvKFxcZCspXFxzKm1pbnV0ZXM/XFxzKiw/XFxzKihcXGQrKT9cXHMqc2Vjb25kcz8vaSk7XG4gICAgICBpZiAoZHVyYXRpb25NYXRjaClcbiAgICAgICAgZHVyYXRpb24gPSBwYXJzZUludChkdXJhdGlvbk1hdGNoWzFdKSAqIDYwICsgcGFyc2VJbnQoZHVyYXRpb25NYXRjaFsyXSB8fCAnMCcpO1xuXG4gICAgICBjb25zdCBtZXRhZGF0YTogVmlkZW9NZXRhZGF0YSA9IHtcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICAgIGR1cmF0aW9uRm9ybWF0dGVkOiB0aGlzLmZvcm1hdER1cmF0aW9uKGR1cmF0aW9uKSxcbiAgICAgICAgY2hhbm5lbDogJ1Vua25vd24nLFxuICAgICAgICB2aWV3Q291bnQ6ICdVbmtub3duJyxcbiAgICAgICAgcHVibGlzaERhdGU6ICdVbmtub3duJyxcbiAgICAgIH07XG4gICAgICBhd2FpdCBwYWdlLmNsb3NlKCk7XG4gICAgICByZXR1cm4gbWV0YWRhdGE7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZXh0cmFjdFRyYW5zY3JpcHREaXJlY3QodmlkZW86IFZpZGVvRW50cnkpOiBQcm9taXNlPFRyYW5zY3JpcHRTZWdtZW50W10gfCBudWxsPiB7XG4gICAgY29uc3Qgc2FmZVRpdGxlID0gdmlkZW8udGl0bGUucmVwbGFjZSgvW15hLXpBLVowLTldL2csICdfJykuc3Vic3RyaW5nKDAsIDUwKTtcbiAgICBjb25zdCB0cmFuc2NyaXB0RmlsZSA9IHBhdGguam9pbih0aGlzLnRyYW5zY3JpcHRzRGlyLCBgJHt2aWRlby5pbmRleH1fJHtzYWZlVGl0bGV9LnR4dGApO1xuXG4gICAgaWYgKGZzLmV4aXN0c1N5bmModHJhbnNjcmlwdEZpbGUpKSB7XG4gICAgICBjb25zb2xlLmxvZyhgW3YyXSDinIUgVXNpbmcgZXhpc3RpbmcgdHJhbnNjcmlwdCBmaWxlOiAke3BhdGguYmFzZW5hbWUodHJhbnNjcmlwdEZpbGUpfWApO1xuICAgICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyh0cmFuc2NyaXB0RmlsZSwgJ3V0ZjgnKTtcbiAgICAgIHJldHVybiBjb250ZW50XG4gICAgICAgIC5zcGxpdCgnXFxuJylcbiAgICAgICAgLmZpbHRlcigobCkgPT4gbC50cmltKCkpXG4gICAgICAgIC5tYXAoKGxpbmUsIGkpID0+ICh7XG4gICAgICAgICAgc3RhcnQ6IGkgKiA1LFxuICAgICAgICAgIGR1cmF0aW9uOiA1LFxuICAgICAgICAgIHRleHQ6IGxpbmUucmVwbGFjZSgvXlxcWy4qP1xcXVxccyovLCAnJykudHJpbSgpLFxuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgY29uc3QgZmIgPSB0aGlzLmRvd25sb2FkVHJhbnNjcmlwdFdpdGhZdERscCh2aWRlby51cmwsIHZpZGVvLnZpZGVvSWQpO1xuICAgIGlmIChmYikgcmV0dXJuIGZiO1xuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcml2YXRlIGdldFZpc3VhbEhvdHNwb3RzKHZpZGVvOiBWaWRlb0VudHJ5KTogbnVtYmVyW10ge1xuICAgIGNvbnN0IHByaW9yaXR5S2V5d29yZHMgPSBbXG4gICAgICAnZGlhZ3JhbScsXG4gICAgICAnYXJjaGl0ZWN0dXJlJyxcbiAgICAgICdncmFwaCcsXG4gICAgICAnZmxvdycsXG4gICAgICAnZGVtbycsXG4gICAgICAnY29kZScsXG4gICAgICAnc25pcHBldCcsXG4gICAgICAnc3RydWN0dXJlJyxcbiAgICAgICdkYXNoYm9hcmQnLFxuICAgICAgJ2ludGVyZmFjZScsXG4gICAgXTtcbiAgICBjb25zdCBzdXBwb3J0S2V5d29yZHMgPSBbXG4gICAgICAnbG9vayBhdCcsXG4gICAgICAnc2hvd2luZycsXG4gICAgICAnc2NyZWVuJyxcbiAgICAgICdzbGlkZScsXG4gICAgICAnZmlndXJlJyxcbiAgICAgICdmcmFtZXdvcmsnLFxuICAgICAgJ2NoYXJ0JyxcbiAgICAgICdwaXBlbGluZScsXG4gICAgICAnY29udGV4dCcsXG4gICAgXTtcblxuICAgIGNvbnN0IHdlaWdodGVkSG90c3BvdHM6IHsgdHM6IG51bWJlcjsgd2VpZ2h0OiBudW1iZXIgfVtdID0gW107XG4gICAgbGV0IGR1cmF0aW9uID0gdmlkZW8ubWV0YWRhdGE/LmR1cmF0aW9uIHx8IDA7XG5cbiAgICBpZiAodmlkZW8udHJhbnNjcmlwdCAmJiB2aWRlby50cmFuc2NyaXB0Lmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGxhc3RUcyA9IHZpZGVvLnRyYW5zY3JpcHRbdmlkZW8udHJhbnNjcmlwdC5sZW5ndGggLSAxXS5zdGFydDtcbiAgICAgIGlmIChkdXJhdGlvbiA8IDEwIHx8IGR1cmF0aW9uIDwgbGFzdFRzKSBkdXJhdGlvbiA9IE1hdGguZmxvb3IobGFzdFRzICsgMTApO1xuICAgIH1cblxuICAgIGlmICh2aWRlby50cmFuc2NyaXB0KSB7XG4gICAgICB2aWRlby50cmFuc2NyaXB0LmZvckVhY2goKHNlZ21lbnQpID0+IHtcbiAgICAgICAgY29uc3QgdGV4dCA9IHNlZ21lbnQudGV4dC50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBsZXQgd2VpZ2h0ID0gMDtcbiAgICAgICAgaWYgKHByaW9yaXR5S2V5d29yZHMuc29tZSgoaykgPT4gdGV4dC5pbmNsdWRlcyhrKSkpIHdlaWdodCA9IDI7XG4gICAgICAgIGVsc2UgaWYgKHN1cHBvcnRLZXl3b3Jkcy5zb21lKChrKSA9PiB0ZXh0LmluY2x1ZGVzKGspKSkgd2VpZ2h0ID0gMTtcbiAgICAgICAgaWYgKHdlaWdodCA+IDApIHtcbiAgICAgICAgICBjb25zdCB0cyA9IE1hdGgubWluKGR1cmF0aW9uLCBNYXRoLmZsb29yKHNlZ21lbnQuc3RhcnQgKyAzKSk7XG4gICAgICAgICAgY29uc3QgaXNDbHVzdGVyID0gd2VpZ2h0ZWRIb3RzcG90cy5zb21lKChoKSA9PiBNYXRoLmFicyhoLnRzIC0gdHMpIDwgNDUpO1xuICAgICAgICAgIGlmICghaXNDbHVzdGVyKSB3ZWlnaHRlZEhvdHNwb3RzLnB1c2goeyB0cywgd2VpZ2h0IH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB3ZWlnaHRlZEhvdHNwb3RzLnNvcnQoKGEsIGIpID0+IGIud2VpZ2h0IC0gYS53ZWlnaHQgfHwgYS50cyAtIGIudHMpO1xuICAgIGNvbnN0IHNlbGVjdGVkID0gbmV3IFNldDxudW1iZXI+KCk7XG4gICAgd2VpZ2h0ZWRIb3RzcG90cy5zbGljZSgwLCA2KS5mb3JFYWNoKChoKSA9PiBzZWxlY3RlZC5hZGQoaC50cykpO1xuICAgIHNlbGVjdGVkLmFkZCgxMCk7XG4gICAgaWYgKGR1cmF0aW9uID4gNjApIHNlbGVjdGVkLmFkZChNYXRoLmZsb29yKGR1cmF0aW9uIC8gMikpO1xuICAgIGlmIChkdXJhdGlvbiA+IDIwKSBzZWxlY3RlZC5hZGQoZHVyYXRpb24gLSAxMCk7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oc2VsZWN0ZWQpXG4gICAgICAuc29ydCgoYSwgYikgPT4gYSAtIGIpXG4gICAgICAuc2xpY2UoMCwgOCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNhcHR1cmVGcmFtZXMoXG4gICAgcGFnZTogUGFnZSxcbiAgICB2aWRlbzogVmlkZW9FbnRyeSxcbiAgICBvZmZzZXRTZWNvbmRzOiBudW1iZXIgPSAwXG4gICk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgIGBbdjNdIPCfk7ggSW50ZXJydXB0LUZyZWUgRnJhbWUgQ2FwdHVyZSBmb3I6ICR7dmlkZW8udGl0bGV9IChPZmZzZXQ6ICR7b2Zmc2V0U2Vjb25kc31zKWBcbiAgICApO1xuICAgIGNvbnN0IGZyYW1lczogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCB0aW1lc3RhbXBzID0gdGhpcy5nZXRWaXN1YWxIb3RzcG90cyh2aWRlbykubWFwKCh0cykgPT4gTWF0aC5tYXgoMCwgdHMgKyBvZmZzZXRTZWNvbmRzKSk7XG4gICAgY29uc29sZS5sb2coXG4gICAgICBgW3YzXSDwn46vIFRhcmdldCB0aW1lc3RhbXBzOiAke3RpbWVzdGFtcHMubWFwKCh0KSA9PiB0aGlzLmZvcm1hdER1cmF0aW9uKHQpKS5qb2luKCcsICcpfWBcbiAgICApO1xuXG4gICAgZm9yIChjb25zdCB0cyBvZiB0aW1lc3RhbXBzKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zb2xlLmxvZyhgW3YzXSBTZWVraW5nIHRvICR7dGhpcy5mb3JtYXREdXJhdGlvbih0cyl9Li4uYCk7XG4gICAgICAgIGF3YWl0IHBhZ2UuZXZhbHVhdGUoKHQpID0+IHtcbiAgICAgICAgICBjb25zdCB2ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcigndmlkZW8nKTtcbiAgICAgICAgICBpZiAodikgdi5jdXJyZW50VGltZSA9IHQ7XG4gICAgICAgIH0sIHRzKTtcblxuICAgICAgICAvLyBFbnN1cmUgcGxheWJhY2sgaXMgcGF1c2VkIHNvIGZyYW1lIGlzIHN0YWJsZVxuICAgICAgICBhd2FpdCBwYWdlLmV2YWx1YXRlKCgpID0+IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ3ZpZGVvJyk/LnBhdXNlKCkpO1xuICAgICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDIwMDApO1xuXG4gICAgICAgIGNvbnN0IGZyYW1lUGF0aCA9IHBhdGguam9pbih0aGlzLmZyYW1lc0RpciwgYCR7dmlkZW8udmlkZW9JZH1fJHt0c30uanBnYCk7XG5cbiAgICAgICAgLy8gVjMgVXBncmFkZTogQmFja2dyb3VuZC1TYWZlIENhcHR1cmVcbiAgICAgICAgLy8gVGFyZ2V0IHRoZSB2aWRlbyBlbGVtZW50IGRpcmVjdGx5IGZvciBoaWdoLWZpZGVsaXR5IGNvbnRlbnQgb25seVxuICAgICAgICBjb25zdCB2aWRlb0VsZW1lbnQgPSBwYWdlLmxvY2F0b3IoJ3ZpZGVvJykuZmlyc3QoKTtcbiAgICAgICAgaWYgKGF3YWl0IHZpZGVvRWxlbWVudC5pc1Zpc2libGUoKSkge1xuICAgICAgICAgIGF3YWl0IHZpZGVvRWxlbWVudC5zY3JlZW5zaG90KHtcbiAgICAgICAgICAgIHBhdGg6IGZyYW1lUGF0aCxcbiAgICAgICAgICAgIHR5cGU6ICdqcGVnJyxcbiAgICAgICAgICAgIHF1YWxpdHk6IDkwLFxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoZnJhbWVQYXRoKSkge1xuICAgICAgICAgICAgZnJhbWVzLnB1c2goZnMucmVhZEZpbGVTeW5jKGZyYW1lUGF0aCwgJ2Jhc2U2NCcpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgW3YzXSBGYWlsZWQgdG8gY2FwdHVyZSBmcmFtZSBhdCAke3RzfTpgLCBlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZyYW1lcztcbiAgfVxuXG4gIHByaXZhdGUgcHJ1bmVGcmFtZXModmlkZW86IFZpZGVvRW50cnkpOiB2b2lkIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZmlsZXMgPSBmcy5yZWFkZGlyU3luYyh0aGlzLmZyYW1lc0RpcikuZmlsdGVyKChmKSA9PiBmLnN0YXJ0c1dpdGgodmlkZW8udmlkZW9JZCkpO1xuICAgICAgZmlsZXMuZm9yRWFjaCgoZikgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGZzLnVubGlua1N5bmMocGF0aC5qb2luKHRoaXMuZnJhbWVzRGlyLCBmKSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICB9KTtcbiAgICAgIGNvbnNvbGUubG9nKGBbdjNdIPCfp7kgUHJ1bmVkICR7ZmlsZXMubGVuZ3RofSBmcmFtZXMgZm9yICR7dmlkZW8udmlkZW9JZH1gKTtcbiAgICB9IGNhdGNoIChlKSB7fVxuICB9XG5cbiAgYXN5bmMgYW5hbHl6ZVdpdGhBSSh2aWRlbzogVmlkZW9FbnRyeSk6IFByb21pc2U8QW5hbHlzaXNSZXN1bHQgfCBudWxsPiB7XG4gICAgaWYgKCF0aGlzLm52aWRpYUFwaUtleSB8fCAhdmlkZW8udHJhbnNjcmlwdCkgcmV0dXJuIG51bGw7XG4gICAgbGV0IHJldHJpZXMgPSAyO1xuICAgIHdoaWxlIChyZXRyaWVzID49IDApIHtcbiAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBgW3YzXSDwn6egIE11bHRpbW9kYWwgQW5hbHlzaXMgdmlhICR7TVVMVElNT0RBTF9NT0RFTH06ICR7dmlkZW8udGl0bGV9IChSZXRyaWVzOiAke3JldHJpZXN9KWBcbiAgICAgICk7XG4gICAgICBjb25zdCB0cmFuc2NyaXB0VGV4dCA9IHZpZGVvLnRyYW5zY3JpcHRcbiAgICAgICAgLm1hcCgocykgPT4gYFske3RoaXMuZm9ybWF0RHVyYXRpb24ocy5zdGFydCl9XSAke3MudGV4dH1gKVxuICAgICAgICAuam9pbignXFxuJyk7XG4gICAgICBjb25zdCBtZXNzYWdlcyA9IFtcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgICB7IHR5cGU6ICd0ZXh0JywgdGV4dDogQU5BTFlTSVNfUFJPTVBUICsgdHJhbnNjcmlwdFRleHQuc3Vic3RyaW5nKDAsIDEyMDAwKSB9LFxuICAgICAgICAgICAgLi4uKHZpZGVvLmZyYW1lcyB8fCBbXSkubWFwKChmKSA9PiAoe1xuICAgICAgICAgICAgICB0eXBlOiAnaW1hZ2VfdXJsJyxcbiAgICAgICAgICAgICAgaW1hZ2VfdXJsOiB7IHVybDogYGRhdGE6aW1hZ2UvanBlZztiYXNlNjQsJHtmfWAgfSxcbiAgICAgICAgICAgIH0pKSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgXTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChOVklESUFfQVBJX1VSTCwge1xuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0aGlzLm52aWRpYUFwaUtleX1gLFxuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIG1vZGVsOiBNVUxUSU1PREFMX01PREVMLFxuICAgICAgICAgICAgbWVzc2FnZXMsXG4gICAgICAgICAgICBtYXhfdG9rZW5zOiAyMDQ4LFxuICAgICAgICAgICAgdGVtcGVyYXR1cmU6IDAuMSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBzaWduYWw6IChBYm9ydFNpZ25hbCBhcyBhbnkpLnRpbWVvdXQoOTAwMDApLFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgcmV0cmllcy0tO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgbGV0IHJhd1Jlc3BvbnNlID0gZGF0YS5jaG9pY2VzWzBdLm1lc3NhZ2UuY29udGVudDtcbiAgICAgICAgcmF3UmVzcG9uc2UgPSByYXdSZXNwb25zZS5yZXBsYWNlKC88dGhpbmtpbmc+W1xcc1xcU10qPzxcXC90aGlua2luZz4vZywgJycpLnRyaW0oKTtcbiAgICAgICAgcmF3UmVzcG9uc2UgPSByYXdSZXNwb25zZS5yZXBsYWNlKC9gYGBqc29uXFxuP3xcXG4/YGBgL2csICcnKS50cmltKCk7XG4gICAgICAgIGlmICghcmF3UmVzcG9uc2Uuc3RhcnRzV2l0aCgneycpKSB7XG4gICAgICAgICAgY29uc3QgbWF0Y2ggPSByYXdSZXNwb25zZS5tYXRjaCgvXFx7W1xcc1xcU10qXFx9Lyk7XG4gICAgICAgICAgaWYgKG1hdGNoKSByYXdSZXNwb25zZSA9IG1hdGNoWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShyYXdSZXNwb25zZSk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAga2V5UG9pbnRzOiBwYXJzZWQua2V5UG9pbnRzIHx8IFtdLFxuICAgICAgICAgIGFpQ29uY2VwdHM6IHBhcnNlZC5haUNvbmNlcHRzIHx8IFtdLFxuICAgICAgICAgIHRlY2huaWNhbERldGFpbHM6IHBhcnNlZC50ZWNobmljYWxEZXRhaWxzIHx8IFtdLFxuICAgICAgICAgIHZpc3VhbENvbnRleHRGbGFnczogcGFyc2VkLnZpc3VhbENvbnRleHRGbGFncyB8fCBbXSxcbiAgICAgICAgICBzdW1tYXJ5OiBwYXJzZWQuc3VtbWFyeSB8fCAnJyxcbiAgICAgICAgICB2aXN1YWxVdGlsaXR5U2NvcmU6IHBhcnNlZC52aXN1YWxVdGlsaXR5U2NvcmUgfHwgMCxcbiAgICAgICAgICBxdWFsaXR5U2NvcmU6IHRoaXMuY2FsY3VsYXRlUXVhbGl0eVNjb3JlKHBhcnNlZCksXG4gICAgICAgICAgcmF3UmVzcG9uc2U6IHJhd1Jlc3BvbnNlLnN1YnN0cmluZygwLCAxMDAwKSxcbiAgICAgICAgfTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0cmllcy0tO1xuICAgICAgICBpZiAocmV0cmllcyA+PSAwKSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCA1MDAwKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVRdWFsaXR5U2NvcmUocGFyc2VkOiBhbnkpOiBudW1iZXIge1xuICAgIGxldCBzY29yZSA9IDA7XG4gICAgaWYgKHBhcnNlZC5zdW1tYXJ5ICYmIHBhcnNlZC5zdW1tYXJ5Lmxlbmd0aCA+IDUwKSBzY29yZSArPSAyNTtcbiAgICBpZiAocGFyc2VkLmtleVBvaW50cyAmJiBwYXJzZWQua2V5UG9pbnRzLmxlbmd0aCA+PSAzKSBzY29yZSArPSAyNTtcbiAgICBpZiAocGFyc2VkLmFpQ29uY2VwdHMgJiYgcGFyc2VkLmFpQ29uY2VwdHMubGVuZ3RoID4gMCkgc2NvcmUgKz0gMjU7XG4gICAgaWYgKHBhcnNlZC50ZWNobmljYWxEZXRhaWxzICYmIHBhcnNlZC50ZWNobmljYWxEZXRhaWxzLmxlbmd0aCA+IDApIHNjb3JlICs9IDI1O1xuICAgIHJldHVybiBzY29yZTtcbiAgfVxuXG4gIHNhdmVSZXBvcnQodmlkZW86IFZpZGVvRW50cnkpOiBzdHJpbmcge1xuICAgIGNvbnN0IHNhZmVUaXRsZSA9IHZpZGVvLnRpdGxlLnJlcGxhY2UoL1teYS16QS1aMC05XS9nLCAnXycpLnN1YnN0cmluZygwLCA1MCk7XG4gICAgY29uc3QgcmVwb3J0RmlsZSA9IHBhdGguam9pbihcbiAgICAgIHRoaXMucmVwb3J0c0RpcixcbiAgICAgIGB2Ml8ke3ZpZGVvLmluZGV4fV8ke3NhZmVUaXRsZX1fJHtEYXRlLm5vdygpfS5tZGBcbiAgICApO1xuICAgIGxldCBjb250ZW50ID0gYCMgVmlkZW8gQW5hbHlzaXMgUmVwb3J0XFxuXFxuIyMgTWV0YWRhdGFcXG4tICoqVmlkZW8qKjogJHt2aWRlby50aXRsZX1cXG4tICoqSW5kZXgqKjogIyR7dmlkZW8uaW5kZXh9XFxuLSAqKlVSTCoqOiAke3ZpZGVvLnVybH1cXG4tICoqRHVyYXRpb24qKjogJHt2aWRlby5tZXRhZGF0YT8uZHVyYXRpb25Gb3JtYXR0ZWQgfHwgJ1Vua25vd24nfVxcbi0gKipQcm9jZXNzZWQqKjogJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCl9XFxuXFxuLS0tXFxuXFxuIyMgU3VtbWFyeVxcbiR7dmlkZW8uYW5hbHlzaXM/LnN1bW1hcnkgfHwgJ05vIHN1bW1hcnkgYXZhaWxhYmxlJ31cXG5gO1xuXG4gICAgaWYgKHZpZGVvLmFuYWx5c2lzPy52aXN1YWxDb250ZXh0RmxhZ3MgJiYgdmlkZW8uYW5hbHlzaXMudmlzdWFsQ29udGV4dEZsYWdzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnRlbnQgKz0gYFxcbiMjIPCfpr4gVmlzdWFsIEludGVsbGlnZW5jZVxcbiR7dmlkZW8uYW5hbHlzaXMudmlzdWFsQ29udGV4dEZsYWdzXG4gICAgICAgIC5tYXAoKGYpID0+IGAtICoqJHt0aGlzLmZvcm1hdER1cmF0aW9uKGYudGltZXN0YW1wKX0qKjogJHtmLnJlYXNvbn0gLSAke2YuY29udGV4dH1gKVxuICAgICAgICAuam9pbignXFxuJyl9XFxuYDtcbiAgICB9XG5cbiAgICBmcy53cml0ZUZpbGVTeW5jKHJlcG9ydEZpbGUsIGNvbnRlbnQpO1xuICAgIHRoaXMuYXBwZW5kVG9Lbm93bGVkZ2VCYXNlKHZpZGVvKTtcbiAgICByZXR1cm4gcmVwb3J0RmlsZTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwZW5kVG9Lbm93bGVkZ2VCYXNlKHZpZGVvOiBWaWRlb0VudHJ5KTogdm9pZCB7XG4gICAgY29uc3QgZW50cnlJZCA9IGB2aWRlby1hbmFseXNpcy0ke3ZpZGVvLnZpZGVvSWR9YDtcbiAgICBjb25zdCBzYWZlVGl0bGUgPSB2aWRlby50aXRsZS5yZXBsYWNlKC9bXmEtekEtWjAtOV0vZywgJ18nKS5zdWJzdHJpbmcoMCwgNTApO1xuICAgIC8vIFBoYXNlIDk6IHNoYXJlZCBGZWRlcmF0ZWQgSUQjIGhlbHBlci4gQ2Fub25pY2FsIGVuY29kZXIgc3RpbGwgbGl2ZXMgaW5cbiAgICAvLyBwYWNrYWdlcy9hMmEtY29yZS9zcmMvZmVkZXJhdGVkLWlkZW50aXR5LnNlcnZpY2UudHM7IHJlLWltcG9ydGVkIGhlcmVcbiAgICAvLyBmcm9tIHRoZSBWMiBzaWJsaW5nLCB3aGljaCBrZWVwcyB0aGUgYWxwaGFiZXQgaW4gc3luYy5cbiAgICBjb25zdCBpZE51bWJlciA9IGdlbmVyYXRlRmVkZXJhdGVkSWROdW1iZXIodmlkZW8uaW5kZXgpO1xuXG4gICAgY29uc3QgY29tcG91bmRpbmdFbnRyeSA9IHtcbiAgICAgIGlkOiBlbnRyeUlkLFxuICAgICAgdGl0bGU6IHZpZGVvLnRpdGxlLFxuICAgICAgY2F0ZWdvcnk6ICd2aWRlby1hbmFseXNpcycsXG4gICAgICBjb250ZW50OiB2aWRlby5hbmFseXNpcz8uc3VtbWFyeSB8fCAnTm8gc3VtbWFyeScsXG4gICAgICB2aXN1YWxfaW50ZWxsaWdlbmNlOiB2aWRlby5hbmFseXNpcz8udmlzdWFsQ29udGV4dEZsYWdzIHx8IFtdLFxuICAgICAgYmFja2xpbmtzOiBbXG4gICAgICAgIC4uLih2aWRlby5hbmFseXNpcz8uYWlDb25jZXB0cyB8fCBbXSksXG4gICAgICAgIC4uLih2aWRlby5hbmFseXNpcz8udGVjaG5pY2FsRGV0YWlscyB8fCBbXSksXG4gICAgICBdLFxuICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgYWdlbnRJZDogJ3RyYW5zY3JpcHQtcHJvY2Vzc29yLXYzJyxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIHZpZGVvSWQ6IHZpZGVvLnZpZGVvSWQsXG4gICAgICAgIHVybDogdmlkZW8udXJsLFxuICAgICAgICBxdWFsaXR5U2NvcmU6IHZpZGVvLmFuYWx5c2lzPy5xdWFsaXR5U2NvcmUgfHwgMCxcbiAgICAgICAgaWROdW1iZXI6IGlkTnVtYmVyLFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgY29uc3Qgd2lraUluYm94RGlyID0gcGF0aC5qb2luKHBhdGguZGlybmFtZSh0aGlzLnN0YXRlRmlsZVBhdGgpLCAnd2lraS1pbmJveCcpO1xuICAgIGZzLm1rZGlyU3luYyh3aWtpSW5ib3hEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGZzLndyaXRlRmlsZVN5bmMoXG4gICAgICBwYXRoLmpvaW4od2lraUluYm94RGlyLCBgJHtlbnRyeUlkfS5qc29uYCksXG4gICAgICBKU09OLnN0cmluZ2lmeShjb21wb3VuZGluZ0VudHJ5LCBudWxsLCAyKVxuICAgICk7XG5cbiAgICBjb25zdCBsZWdhY3lFbnRyeSA9IGBcXG4tLS1cXG5cXG4jIyAjJHt2aWRlby5pbmRleH06ICR7dmlkZW8udGl0bGV9XFxuKipVUkwqKjogJHt2aWRlby51cmx9XFxuKipSZXNvdXJjZSBQb2ludGVyKio6IHRycDovL3dpa2ktaW5ib3gvJHtlbnRyeUlkfS5qc29uXFxuXFxuIyMjIFN1bW1hcnlcXG4ke3ZpZGVvLmFuYWx5c2lzPy5zdW1tYXJ5IHx8ICdObyBzdW1tYXJ5J31cXG5cXG4jIyMgVmlzdWFsIEZpbmRpbmdzXFxuJHsodmlkZW8uYW5hbHlzaXM/LnZpc3VhbENvbnRleHRGbGFncyB8fCBbXSkubWFwKChmKSA9PiBgLSBbJHt0aGlzLmZvcm1hdER1cmF0aW9uKGYudGltZXN0YW1wKX1dICR7Zi5jb250ZXh0fWApLmpvaW4oJ1xcbicpIHx8ICctIE5vbmUnfVxcblxcbmA7XG4gICAgZnMuYXBwZW5kRmlsZVN5bmModGhpcy5rbm93bGVkZ2VCYXNlRmlsZSwgbGVnYWN5RW50cnkpO1xuICB9XG5cbiAgYXN5bmMgcHJvY2Vzc1ZpZGVvKHZpZGVvOiBWaWRlb0VudHJ5KTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHZpZGVvLnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcgfHwgdmlkZW8uc3RhdHVzID09PSAnc2tpcHBlZCcpIHJldHVybiB0cnVlO1xuICAgIGlmICh2aWRlby5wcm9jZXNzaW5nQXR0ZW1wdHMgPj0gMykge1xuICAgICAgdmlkZW8uc3RhdHVzID0gJ3NraXBwZWQnO1xuICAgICAgdGhpcy5zdGF0ZS5zdGF0cy5za2lwcGVkKys7XG4gICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLmVuc3VyZUJyb3dzZXJIZWFsdGgoKTtcbiAgICBjb25zb2xlLmxvZyhgXFxu4pWQ4pWQ4pWQ4pWQIFZpZGVvICMke3ZpZGVvLmluZGV4fTogJHt2aWRlby50aXRsZX0g4pWQ4pWQ4pWQ4pWQXFxuYCk7XG4gICAgdmlkZW8ucHJvY2Vzc2luZ0F0dGVtcHRzKys7XG4gICAgdGhpcy5zYXZlU3RhdGUoKTtcblxuICAgIHRyeSB7XG4gICAgICBpZiAoIXZpZGVvLm1ldGFkYXRhKSB7XG4gICAgICAgIGxldCBkdXJhdGlvbiA9IDA7XG4gICAgICAgIGxldCBkdXJhdGlvbkZvcm1hdHRlZCA9ICcwOjAwJztcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBkdXJTdHIgPSBleGVjU3luYyhgeXQtZGxwIC0tZ2V0LWR1cmF0aW9uICR7dmlkZW8udXJsfWApLnRvU3RyaW5nKCkudHJpbSgpO1xuICAgICAgICAgIGNvbnN0IHBhcnRzID0gZHVyU3RyLnNwbGl0KCc6JykubWFwKE51bWJlcik7XG4gICAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMikgZHVyYXRpb24gPSBwYXJ0c1swXSAqIDYwICsgcGFydHNbMV07XG4gICAgICAgICAgZWxzZSBpZiAocGFydHMubGVuZ3RoID09PSAzKSBkdXJhdGlvbiA9IHBhcnRzWzBdICogMzYwMCArIHBhcnRzWzFdICogNjAgKyBwYXJ0c1syXTtcbiAgICAgICAgICBpZiAoZHVyYXRpb24gPiAwKSBkdXJhdGlvbkZvcm1hdHRlZCA9IGR1clN0cjtcbiAgICAgICAgfSBjYXRjaCAoZSkge31cblxuICAgICAgICB2aWRlby5tZXRhZGF0YSA9IChhd2FpdCB0aGlzLmZldGNoRW5yaWNoZWRNZXRhZGF0YSh2aWRlbykpIHx8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHZpZGVvLm1ldGFkYXRhKSB7XG4gICAgICAgICAgaWYgKGR1cmF0aW9uID4gMCkge1xuICAgICAgICAgICAgdmlkZW8ubWV0YWRhdGEuZHVyYXRpb24gPSBkdXJhdGlvbjtcbiAgICAgICAgICAgIHZpZGVvLm1ldGFkYXRhLmR1cmF0aW9uRm9ybWF0dGVkID0gZHVyYXRpb25Gb3JtYXR0ZWQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuc3RhdGUuc3RhdHMubWV0YWRhdGFDb21wbGV0ZSsrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghdmlkZW8udHJhbnNjcmlwdCkge1xuICAgICAgICB2aWRlby50cmFuc2NyaXB0ID0gKGF3YWl0IHRoaXMuZXh0cmFjdFRyYW5zY3JpcHREaXJlY3QodmlkZW8pKSB8fCB1bmRlZmluZWQ7XG4gICAgICAgIGlmICh2aWRlby50cmFuc2NyaXB0KSB0aGlzLnN0YXRlLnN0YXRzLnRyYW5zY3JpcHRzRXh0cmFjdGVkKys7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh2aWRlby50cmFuc2NyaXB0KSB7XG4gICAgICAgIC8vIFYzOiBWaXN1YWwgRnJhbWUgQ2FwdHVyZSB3aXRoIFZlcmlmaWNhdGlvbiBMb29wXG4gICAgICAgIGxldCBhdHRlbXB0cyA9IDA7XG4gICAgICAgIGxldCB2aXN1YWxVdGlsaXR5ID0gMDtcblxuICAgICAgICB3aGlsZSAoYXR0ZW1wdHMgPCAyICYmIHZpc3VhbFV0aWxpdHkgPCA1KSB7XG4gICAgICAgICAgaWYgKCF2aWRlby5mcmFtZXMgfHwgYXR0ZW1wdHMgPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBwYWdlID0gYXdhaXQgdGhpcy5jb250ZXh0IS5uZXdQYWdlKCk7XG4gICAgICAgICAgICBhd2FpdCBwYWdlLmdvdG8odmlkZW8udXJsLCB7IHdhaXRVbnRpbDogJ2xvYWQnLCB0aW1lb3V0OiA0NTAwMCB9KTtcbiAgICAgICAgICAgIC8vIFNoaWZ0IG9mZnNldCBvbiBzZWNvbmQgYXR0ZW1wdFxuICAgICAgICAgICAgdmlkZW8uZnJhbWVzID0gYXdhaXQgdGhpcy5jYXB0dXJlRnJhbWVzKHBhZ2UsIHZpZGVvLCBhdHRlbXB0cyAqIDUpO1xuICAgICAgICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodmlkZW8uZnJhbWVzICYmICF2aWRlby5hbmFseXNpcykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFt2M10g8J+UjSBWZXJpZnlpbmcgdmlzdWFsIHV0aWxpdHkgKEF0dGVtcHQgJHthdHRlbXB0cyArIDF9KS4uLmApO1xuICAgICAgICAgICAgdmlkZW8uYW5hbHlzaXMgPSAoYXdhaXQgdGhpcy5hbmFseXplV2l0aEFJKHZpZGVvKSkgfHwgdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICB2aXN1YWxVdGlsaXR5ID0gdmlkZW8uYW5hbHlzaXM/LnZpc3VhbFV0aWxpdHlTY29yZSB8fCAwO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFt2M10g8J+TiiBWaXN1YWwgVXRpbGl0eSBTY29yZTogJHt2aXN1YWxVdGlsaXR5fS8xMGApO1xuXG4gICAgICAgICAgICBpZiAodmlzdWFsVXRpbGl0eSA8IDUgJiYgYXR0ZW1wdHMgPCAxKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbdjNdIPCflIQgTG93IHZpc3VhbCB1dGlsaXR5IGRldGVjdGVkLiBSZXRyeWluZyB3aXRoIHRlbXBvcmFsIHNoaWZ0Li4uYCk7XG4gICAgICAgICAgICAgIGF0dGVtcHRzKys7XG4gICAgICAgICAgICAgIHZpZGVvLmFuYWx5c2lzID0gdW5kZWZpbmVkOyAvLyBSZXNldCBmb3IgcmV0cnlcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZpZGVvLmFuYWx5c2lzKSB0aGlzLnN0YXRlLnN0YXRzLmFuYWx5emVkKys7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh2aWRlby5hbmFseXNpcykge1xuICAgICAgICB0aGlzLnNhdmVSZXBvcnQodmlkZW8pO1xuICAgICAgICB2aWRlby5zdGF0dXMgPSAnY29tcGxldGVkJztcbiAgICAgICAgdGhpcy5zdGF0ZS5zdGF0cy5jb21wbGV0ZWQrKztcbiAgICAgICAgLy8gVjM6IFBydW5lIGZyYW1lcyBpbW1lZGlhdGVseSBhZnRlciBzdWNjZXNzZnVsIGFuYWx5c2lzXG4gICAgICAgIHRoaXMucHJ1bmVGcmFtZXModmlkZW8pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmlkZW8uc3RhdHVzID0gJ2Vycm9yJztcbiAgICAgICAgdGhpcy5zdGF0ZS5zdGF0cy5lcnJvcnMrKztcbiAgICAgIH1cblxuICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgIHJldHVybiB2aWRlby5zdGF0dXMgPT09ICdjb21wbGV0ZWQnO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgY29uc29sZS5lcnJvcihgW3YzXSBFcnJvcjpgLCBlLm1lc3NhZ2UpO1xuICAgICAgdmlkZW8uc3RhdHVzID0gJ2Vycm9yJztcbiAgICAgIHRoaXMuc3RhdGUuc3RhdHMuZXJyb3JzKys7XG4gICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHJ1bihsaWJyYXJ5UGF0aDogc3RyaW5nLCBzdGFydEluZGV4OiBudW1iZXIgPSA2OTIsIGVuZEluZGV4OiBudW1iZXIgPSA2NDgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zb2xlLmxvZyhg8J+agCBWMyBQaXBlbGluZTogIyR7c3RhcnRJbmRleH0g4oaSICMke2VuZEluZGV4fSB8IE1vZGVsOiAke01VTFRJTU9EQUxfTU9ERUx9YCk7XG4gICAgYXdhaXQgdGhpcy5pbml0aWFsaXplKCk7XG4gICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhsaWJyYXJ5UGF0aCwgJ3V0Zi04Jyk7XG4gICAgY29uc3QgdmlkZW9zOiBWaWRlb0VudHJ5W10gPSBbXTtcbiAgICBjb25zdCByb3dSZWdleCA9XG4gICAgICAvPHRyPlxccyo8dGRbXj5dKj5cXHMqKFxcZCspXFxzKjxcXC90ZD5cXHMqPHRkW14+XSo+XFxzKjxhXFxzK2hyZWY9XCIoW15cIl0rKVwiW14+XSo+KFtePF0rKTxcXC9hPlxccyo8XFwvdGQ+L2c7XG4gICAgbGV0IG1hdGNoO1xuICAgIHdoaWxlICgobWF0Y2ggPSByb3dSZWdleC5leGVjKGNvbnRlbnQpKSAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgaW5kZXggPSBwYXJzZUludChtYXRjaFsxXSk7XG4gICAgICBpZiAoaW5kZXggPD0gc3RhcnRJbmRleCAmJiBpbmRleCA+PSBlbmRJbmRleCkge1xuICAgICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuc3RhdGUucXVldWUuZmluZCgodikgPT4gdi5pbmRleCA9PT0gaW5kZXgpO1xuICAgICAgICBpZiAoZXhpc3RpbmcpIHZpZGVvcy5wdXNoKGV4aXN0aW5nKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHZpZGVvcy5wdXNoKHtcbiAgICAgICAgICAgIGluZGV4LFxuICAgICAgICAgICAgdXJsOiBtYXRjaFsyXSxcbiAgICAgICAgICAgIHRpdGxlOiBtYXRjaFszXS50cmltKCksXG4gICAgICAgICAgICB2aWRlb0lkOiB0aGlzLmV4dHJhY3RWaWRlb0lkKG1hdGNoWzJdKSB8fCAnJyxcbiAgICAgICAgICAgIHN0YXR1czogJ3BlbmRpbmcnLFxuICAgICAgICAgICAgcHJvY2Vzc2luZ0F0dGVtcHRzOiAwLFxuICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICB2aWRlb3Muc29ydCgoYSwgYikgPT4gYi5pbmRleCAtIGEuaW5kZXgpO1xuICAgIHRoaXMuc3RhdGUucXVldWUgPSB2aWRlb3M7XG4gICAgdGhpcy5zdGF0ZS5zdGF0cy50b3RhbFZpZGVvcyA9IHZpZGVvcy5sZW5ndGg7XG4gICAgdGhpcy5zYXZlU3RhdGUoKTtcblxuICAgIGZvciAoY29uc3QgdmlkZW8gb2YgdmlkZW9zKSB7XG4gICAgICB0aGlzLnN0YXRlLmN1cnJlbnRJbmRleCA9IHZpZGVvLmluZGV4O1xuICAgICAgYXdhaXQgdGhpcy5wcm9jZXNzVmlkZW8odmlkZW8pO1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHIpID0+IHNldFRpbWVvdXQociwgMzAwMCkpO1xuICAgIH1cbiAgICBpZiAodGhpcy5jb250ZXh0KSBhd2FpdCB0aGlzLmNvbnRleHQuY2xvc2UoKTtcbiAgfVxuXG4gIHByaXZhdGUgZG93bmxvYWRUcmFuc2NyaXB0V2l0aFl0RGxwKHVybDogc3RyaW5nLCB2aWRlb0lkOiBzdHJpbmcpOiBUcmFuc2NyaXB0U2VnbWVudFtdIHwgbnVsbCB7XG4gICAgY29uc3QgdGVtcERpciA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUodGhpcy5yZXBvcnRzRGlyKSwgJ3RlbXBfc3VicycpO1xuICAgIGZzLm1rZGlyU3luYyh0ZW1wRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBjb25zdCBvdXRwdXRGaWxlQmFzZSA9IHBhdGguam9pbih0ZW1wRGlyLCB2aWRlb0lkKTtcbiAgICB0cnkge1xuICAgICAgZXhlY1N5bmMoXG4gICAgICAgIGB5dC1kbHAgLS13cml0ZS1hdXRvLXN1YiAtLXdyaXRlLXN1YiAtLXN1Yi1sYW5nIGVuIC0tc2tpcC1kb3dubG9hZCAtLW91dHB1dCBcIiR7b3V0cHV0RmlsZUJhc2V9XCIgXCIke3VybH1cImAsXG4gICAgICAgIHsgc3RkaW86ICdpZ25vcmUnIH1cbiAgICAgICk7XG4gICAgICBjb25zdCBmaWxlcyA9IGZzLnJlYWRkaXJTeW5jKHRlbXBEaXIpO1xuICAgICAgY29uc3Qgc3ViRmlsZSA9IGZpbGVzLmZpbmQoKGYpID0+IGYuc3RhcnRzV2l0aCh2aWRlb0lkKSAmJiBmLmVuZHNXaXRoKCcudnR0JykpO1xuICAgICAgaWYgKCFzdWJGaWxlKSByZXR1cm4gbnVsbDtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKHRlbXBEaXIsIHN1YkZpbGUpLCAndXRmLTgnKTtcbiAgICAgIGNvbnN0IHNlZ21lbnRzOiBUcmFuc2NyaXB0U2VnbWVudFtdID0gW107XG4gICAgICBjb25zdCBibG9ja3MgPSBjb250ZW50LnNwbGl0KC9cXG5cXHI/XFxuLyk7XG4gICAgICBmb3IgKGNvbnN0IGJsb2NrIG9mIGJsb2Nrcykge1xuICAgICAgICBjb25zdCB0aW1lTWF0Y2ggPSBibG9jay5tYXRjaChcbiAgICAgICAgICAvKFxcZHsyfSk6KFxcZHsyfSk6KFxcZHsyfSlcXC4oXFxkezN9KVxccy0tPlxccyhcXGR7Mn0pOihcXGR7Mn0pOihcXGR7Mn0pXFwuKFxcZHszfSkvXG4gICAgICAgICk7XG4gICAgICAgIGlmICh0aW1lTWF0Y2gpIHtcbiAgICAgICAgICBjb25zdCBsaW5lcyA9IGJsb2NrLnNwbGl0KCdcXG4nKTtcbiAgICAgICAgICBjb25zdCB0SWR4ID0gbGluZXMuZmluZEluZGV4KChsKSA9PiBsLmluY2x1ZGVzKCctLT4nKSk7XG4gICAgICAgICAgaWYgKHRJZHggIT09IC0xICYmIHRJZHggPCBsaW5lcy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICBjb25zdCB0ZXh0ID0gbGluZXNcbiAgICAgICAgICAgICAgLnNsaWNlKHRJZHggKyAxKVxuICAgICAgICAgICAgICAuam9pbignICcpXG4gICAgICAgICAgICAgIC5yZXBsYWNlKC88W14+XSo+L2csICcnKVxuICAgICAgICAgICAgICAudHJpbSgpO1xuICAgICAgICAgICAgaWYgKHRleHQgJiYgdGV4dCAhPT0gJ2FsaWduOnN0YXJ0IHBvc2l0aW9uOjAlJykge1xuICAgICAgICAgICAgICBjb25zdCBzdGFydFNlYyA9XG4gICAgICAgICAgICAgICAgcGFyc2VJbnQodGltZU1hdGNoWzFdKSAqIDM2MDAgK1xuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFsyXSkgKiA2MCArXG4gICAgICAgICAgICAgICAgcGFyc2VJbnQodGltZU1hdGNoWzNdKSArXG4gICAgICAgICAgICAgICAgcGFyc2VJbnQodGltZU1hdGNoWzRdKSAvIDEwMDA7XG4gICAgICAgICAgICAgIGNvbnN0IGVuZFNlYyA9XG4gICAgICAgICAgICAgICAgcGFyc2VJbnQodGltZU1hdGNoWzVdKSAqIDM2MDAgK1xuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFs2XSkgKiA2MCArXG4gICAgICAgICAgICAgICAgcGFyc2VJbnQodGltZU1hdGNoWzddKSArXG4gICAgICAgICAgICAgICAgcGFyc2VJbnQodGltZU1hdGNoWzhdKSAvIDEwMDA7XG4gICAgICAgICAgICAgIHNlZ21lbnRzLnB1c2goeyBzdGFydDogc3RhcnRTZWMsIGR1cmF0aW9uOiBlbmRTZWMgLSBzdGFydFNlYywgdGV4dCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZzLnVubGlua1N5bmMocGF0aC5qb2luKHRlbXBEaXIsIHN1YkZpbGUpKTtcbiAgICAgIHJldHVybiBzZWdtZW50cztcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gbWFpbigpIHtcbiAgY29uc3QgYXJncyA9IHByb2Nlc3MuYXJndi5zbGljZSgyKTtcbiAgY29uc3Qgc3RhcnRBcmcgPSBhcmdzLmZpbmQoKGEpID0+IGEuc3RhcnRzV2l0aCgnLS1zdGFydD0nKSk7XG4gIGNvbnN0IGVuZEFyZyA9IGFyZ3MuZmluZCgoYSkgPT4gYS5zdGFydHNXaXRoKCctLWVuZD0nKSk7XG4gIGNvbnN0IHN0YXJ0ID0gc3RhcnRBcmcgPyBwYXJzZUludChzdGFydEFyZy5zcGxpdCgnPScpWzFdKSA6IDY5MjtcbiAgY29uc3QgZW5kID0gZW5kQXJnID8gcGFyc2VJbnQoZW5kQXJnLnNwbGl0KCc9JylbMV0pIDogNjQ4O1xuICBjb25zdCBsaWJyYXJ5UGF0aCA9XG4gICAgJy9Vc2Vycy9kYW5pZWxnb2xkYmVyZy9EZXNrdG9wL0ExLUludGVyLUxMTS1Db20vbXktYWkta25vd2xlZGdlLWJhc2UvdmlkZW8tbGlicmFyeS9haV92aWRlb19saWJyYXJ5Lmh0bWwnO1xuICBjb25zdCBpbmdlc3RQcm9jZXNzb3IgPSBuZXcgVHJhbnNjcmlwdFByb2Nlc3NvclYzKCk7XG4gIGF3YWl0IGluZ2VzdFByb2Nlc3Nvci5ydW4obGlicmFyeVBhdGgsIHN0YXJ0LCBlbmQpO1xufVxuXG5tYWluKCkuY2F0Y2goY29uc29sZS5lcnJvcik7XG4iXX0=
