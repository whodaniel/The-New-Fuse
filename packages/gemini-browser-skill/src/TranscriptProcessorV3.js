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
const node_os_1 = require('node:os');
const node_path_1 = require('node:path');
const TranscriptProcessorV2_js_1 = require('./TranscriptProcessorV2.js');
// Resolved at runtime so this package works in any checkout.
const TNF_ROOT = process.env.TNF_ROOT || (0, node_path_1.resolve)(__dirname, '..', '..', '..');
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
      const envPath = (0, node_path_1.join)((0, node_os_1.homedir)(), '.hermes', '.env');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHJhbnNjcmlwdFByb2Nlc3NvclYzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiVHJhbnNjcmlwdFByb2Nlc3NvclYzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7O0dBU0c7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsMkRBQThDO0FBQzlDLDRDQUE4QjtBQUM5QixnREFBa0M7QUFDbEMsc0RBQXdDO0FBRXhDLDJDQUFzRTtBQUV0RSxxQ0FBa0M7QUFDbEMseUNBQTBDO0FBQzFDLHlFQUF1RTtBQUN2RSw2REFBNkQ7QUFDN0QsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLElBQUksSUFBQSxtQkFBTyxFQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBa0Y5RSxxQkFBcUI7QUFDckIsTUFBTSxnQkFBZ0IsR0FBRyxzQkFBc0IsQ0FBQztBQUNoRCxNQUFNLGNBQWMsR0FBRyxzREFBc0QsQ0FBQztBQUU5RSxNQUFNLGVBQWUsR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXlCdkIsQ0FBQztBQUVGLE1BQU0scUJBQXFCO0lBV3pCLFlBQVksY0FBc0QsVUFBVTtRQVZwRSxZQUFPLEdBQTBCLElBQUksQ0FBQztRQU90QyxnQkFBVyxHQUEyQyxVQUFVLENBQUM7UUFDakUsaUJBQVksR0FBVyxFQUFFLENBQUM7UUFHaEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7UUFDL0IsTUFBTSxPQUFPLEdBQUcsUUFBUSxHQUFHLE9BQU8sQ0FBQztRQUVuQyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLDBCQUEwQixDQUFDLENBQUM7UUFDcEUsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxlQUFlLENBQUMsQ0FBQztRQUN0RCxJQUFJLENB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QyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQzVELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUN4RCxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztJQUNoRSxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztJQUMxRCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixJQUFJLEVBQUUsQ0FBQztJQUN4RCxNQUFNLGVBQWUsR0FBRyxJQUFJLHFCQUFxQixFQUFFLENBQUM7SUFDcEQsTUFBTSxlQUFlLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDckQsQ0FBQztBQUVELElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRyYW5zY3JpcHQgUHJvY2Vzc29yIHYzIC0gT21uaS1WaXNpb24gRWRpdGlvblxuICpcbiAqIEltcHJvdmVtZW50cyBvdmVyIHYyOlxuICogMS4gVXNlcyBtb29uc2hvdGFpL2tpbWktazIuNiB2aWEgTlZJRElBIE5HQyBBUEkgKE11bHRpbW9kYWwpXG4gKiAyLiBJbnRlZ3JhdGVkIE5hdGl2ZSBWaXNpb24gQnJpZGdlIHZpYSBUTkYgRm9yZ2UgKHNjcmVlbmNhcC5zbylcbiAqIDMuIEludGVsbGlnZW50IEhpZ2gtRmlkZWxpdHkgSG90c3BvdCBTZWxlY3Rpb24gKENhcHBlZCBhdCA4IGltYWdlcylcbiAqIDQuIEF1dGhvcml0YXRpdmUgeXQtZGxwIGR1cmF0aW9uIHZlcmlmaWNhdGlvblxuICogNS4gUm9idXN0IHN0YXRlIHByb3RlY3Rpb24gdG8gcHJldmVudCBmaWxlIGNvcnJ1cHRpb25cbiAqL1xuXG5pbXBvcnQgeyBleGVjU3luYyB9IGZyb20gJ25vZGU6Y2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdub2RlOmZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCAqIGFzIHByb2Nlc3MgZnJvbSAnbm9kZTpwcm9jZXNzJztcblxuaW1wb3J0IHsgY2hyb21pdW0sIHR5cGUgQnJvd3NlckNvbnRleHQsIHR5cGUgUGFnZSB9IGZyb20gJ3BsYXl3cmlnaHQnO1xuXG5pbXBvcnQgeyBob21lZGlyIH0gZnJvbSAnbm9kZTpvcyc7XG5pbXBvcnQgeyBqb2luLCByZXNvbHZlIH0gZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IGdlbmVyYXRlRmVkZXJhdGVkSWROdW1iZXIgfSBmcm9tICcuL1RyYW5zY3JpcHRQcm9jZXNzb3JWMi5qcyc7XG4vLyBSZXNvbHZlZCBhdCBydW50aW1lIHNvIHRoaXMgcGFja2FnZSB3b3JrcyBpbiBhbnkgY2hlY2tvdXQuXG5jb25zdCBUTkZfUk9PVCA9IHByb2Nlc3MuZW52LlRORl9ST09UIHx8IHJlc29sdmUoX19kaXJuYW1lLCAnLi4nLCAnLi4nLCAnLi4nKTtcblxuaW50ZXJmYWNlIFZpZGVvRW50cnkge1xuICBpbmRleDogbnVtYmVyO1xuICB1cmw6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgdmlkZW9JZDogc3RyaW5nO1xuICBtZXRhZGF0YT86IFZpZGVvTWV0YWRhdGE7XG4gIHRyYW5zY3JpcHQ/OiBUcmFuc2NyaXB0U2VnbWVudFtdO1xuICBhbmFseXNpcz86IEFuYWx5c2lzUmVzdWx0O1xuICBmcmFtZXM/OiBzdHJpbmdbXTsgLy8gQmFzZTY0IGVuY29kZWQgSlBFRyBmcmFtZXNcbiAgc3RhdHVzOlxuICAgIHwgJ3BlbmRpbmcnXG4gICAgfCAnbWV0YWRhdGEnXG4gICAgfCAndHJhbnNjcmlwdCdcbiAgICB8ICdhbmFseXplZCdcbiAgICB8ICduZWVkc192aXN1YWwnXG4gICAgfCAnY29tcGxldGVkJ1xuICAgIHwgJ3NraXBwZWQnXG4gICAgfCAnZXJyb3InO1xuICBwcm9jZXNzaW5nQXR0ZW1wdHM6IG51bWJlcjtcbiAgbGFzdFByb2Nlc3NlZD86IHN0cmluZztcbiAgZXJyb3I/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBWaWRlb01ldGFkYXRhIHtcbiAgZHVyYXRpb246IG51bWJlcjtcbiAgZHVyYXRpb25Gb3JtYXR0ZWQ6IHN0cmluZztcbiAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gIGNoYW5uZWw/OiBzdHJpbmc7XG4gIHB1Ymxpc2hEYXRlPzogc3RyaW5nO1xuICB2aWV3Q291bnQ/OiBzdHJpbmc7XG4gIGNhdGVnb3J5Pzogc3RyaW5nO1xuICB0YWdzPzogc3RyaW5nW107XG4gIHN1bW1hcnk/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBUcmFuc2NyaXB0U2VnbWVudCB7XG4gIHN0YXJ0OiBudW1iZXI7XG4gIGR1cmF0aW9uOiBudW1iZXI7XG4gIHRleHQ6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIEFuYWx5c2lzUmVzdWx0IHtcbiAga2V5UG9pbnRzOiBzdHJpbmdbXTtcbiAgYWlDb25jZXB0czogc3RyaW5nW107XG4gIHRlY2huaWNhbERldGFpbHM6IHN0cmluZ1tdO1xuICB2aXN1YWxDb250ZXh0RmxhZ3M6IFZpc3VhbENvbnRleHRGbGFnW107XG4gIHN1bW1hcnk6IHN0cmluZztcbiAgdmlzdWFsVXRpbGl0eVNjb3JlOiBudW1iZXI7XG4gIHF1YWxpdHlTY29yZT86IG51bWJlcjtcbiAgcmF3UmVzcG9uc2U/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBWaXN1YWxDb250ZXh0RmxhZyB7XG4gIHRpbWVzdGFtcDogbnVtYmVyO1xuICByZWFzb246IHN0cmluZztcbiAgY29udGV4dDogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgUHJvY2Vzc2luZ1N0YXRlIHtcbiAgdmVyc2lvbjogc3RyaW5nO1xuICBxdWV1ZTogVmlkZW9FbnRyeVtdO1xuICBjdXJyZW50SW5kZXg6IG51bWJlcjtcbiAgc3RhcnRlZEF0OiBzdHJpbmc7XG4gIGxhc3RVcGRhdGVkOiBzdHJpbmc7XG4gIHN0YXRzOiBQcm9jZXNzaW5nU3RhdHM7XG59XG5cbmludGVyZmFjZSBQcm9jZXNzaW5nU3RhdHMge1xuICB0b3RhbFZpZGVvczogbnVtYmVyO1xuICBtZXRhZGF0YUNvbXBsZXRlOiBudW1iZXI7XG4gIHRyYW5zY3JpcHRzRXh0cmFjdGVkOiBudW1iZXI7XG4gIGFuYWx5emVkOiBudW1iZXI7XG4gIG5lZWRzVmlzdWFsUmV2aWV3OiBudW1iZXI7XG4gIGNvbXBsZXRlZDogbnVtYmVyO1xuICBza2lwcGVkOiBudW1iZXI7XG4gIGVycm9yczogbnVtYmVyO1xuICBhbmFseXNpc1N1Y2Nlc3NSYXRlOiBudW1iZXI7XG4gIGF2ZXJhZ2VUcmFuc2NyaXB0TGVuZ3RoOiBudW1iZXI7XG59XG5cbi8vIE1vZGVsICYgQVBJIENvbmZpZ1xuY29uc3QgTVVMVElNT0RBTF9NT0RFTCA9ICdtb29uc2hvdGFpL2tpbWktazIuNic7XG5jb25zdCBOVklESUFfQVBJX1VSTCA9ICdodHRwczovL2ludGVncmF0ZS5hcGkubnZpZGlhLmNvbS92MS9jaGF0L2NvbXBsZXRpb25zJztcblxuY29uc3QgQU5BTFlTSVNfUFJPTVBUID0gYFlvdSBhcmUgYSBoaWdoLWZpZGVsaXR5IGludGVsbGlnZW5jZSBleHRyYWN0b3IuIFlvdSBhcmUgYW5hbHl6aW5nIGEgdGVjaG5pY2FsIFlvdVR1YmUgdmlkZW8gdXNpbmcgYm90aCBpdHMgdHJhbnNjcmlwdCBhbmQga2V5IHZpc3VhbCBmcmFtZXMuIFxuXG5Zb3VyIGdvYWwgaXMgdG8gZXh0cmFjdCBtYWNoaW5lLWFjdGlvbmFibGUgaW50ZWxsaWdlbmNlIGFuZCBzdHJ1Y3R1cmVkIHRlY2huaWNhbCBpbnNpZ2h0cy4gUGF5IHNwZWNpYWwgYXR0ZW50aW9uIHRvOlxuMS4gQ29kZSBzbmlwcGV0cyBvciBDTEkgY29tbWFuZHMgc2hvd24gaW4gZnJhbWVzLlxuMi4gQXJjaGl0ZWN0dXJhbCBkaWFncmFtcyBhbmQgZGF0YSBmbG93LlxuMy4gU3BlY2lmaWMgdmVyc2lvbnMgb2YgdG9vbHMgYW5kIGZyYW1ld29ya3MgbWVudGlvbmVkIG9yIHNob3duLlxuXG5JTVBPUlRBTlQ6IEFzc2VzcyB0aGUgXCJ2aXN1YWxVdGlsaXR5U2NvcmVcIiAoMC0xMCkgb2YgdGhlIHByb3ZpZGVkIGltYWdlcy4gXG4tIDAtMzogT25seSBzcGVha2VyIGZhY2UsIGxvZ28sIG9yIGdlbmVyaWMgaW50cm8gc2xpZGVzLlxuLSA0LTc6IFNvbWUgZGlhZ3JhbXMgb3IgVUkgYnV0IGhhcmQgdG8gcmVhZCBvciBtb3N0bHkgY292ZXJlZC5cbi0gOC0xMDogSGlnaC1maWRlbGl0eSBjb2RlLCBhcmNoaXRlY3R1cmUsIG9yIGNsZWFyIGRhdGEgdGFibGVzLlxuXG5SZXR1cm4gT05MWSBhIHZhbGlkIEpTT04gb2JqZWN0IHdpdGggdGhpcyBzdHJ1Y3R1cmU6XG57XG4gIFwic3VtbWFyeVwiOiBcIkNvbmNpc2UgdGVjaG5pY2FsIHN1bW1hcnlcIixcbiAgXCJ2aXN1YWxVdGlsaXR5U2NvcmVcIjogOCxcbiAgXCJrZXlQb2ludHNcIjogW1wiUG9pbnQgMVwiLCBcIlBvaW50IDJcIiwgLi4uXSxcbiAgXCJhaUNvbmNlcHRzXCI6IFtcIkNvbmNlcHQgMVwiLCBcIkNvbmNlcHQgMlwiLCAuLi5dLFxuICBcInRlY2huaWNhbERldGFpbHNcIjogW1wiRGV0YWlsZWQgaW1wbGVtZW50YXRpb24gb3IgdG9vbCBpbmZvXCIsIC4uLl0sXG4gIFwidmlzdWFsQ29udGV4dEZsYWdzXCI6IFtcbiAgICB7XCJ0aW1lc3RhbXBcIjogMTIwLCBcInJlYXNvblwiOiBcIlJlYXNvbiBmb3IgZmxhZ2dpbmdcIiwgXCJjb250ZXh0XCI6IFwiVmlzaWJsZSBkZXRhaWxzIGZyb20gZnJhbWVcIn1cbiAgXVxufVxuXG5UUkFOU0NSSVBUIFNFR01FTlQ6XG5gO1xuXG5jbGFzcyBUcmFuc2NyaXB0UHJvY2Vzc29yVjMge1xuICBwcml2YXRlIGNvbnRleHQ6IEJyb3dzZXJDb250ZXh0IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc3RhdGU6IFByb2Nlc3NpbmdTdGF0ZTtcbiAgcHJpdmF0ZSBzdGF0ZUZpbGVQYXRoOiBzdHJpbmc7XG4gIHByaXZhdGUgcmVwb3J0c0Rpcjogc3RyaW5nO1xuICBwcml2YXRlIHRyYW5zY3JpcHRzRGlyOiBzdHJpbmc7XG4gIHByaXZhdGUgZnJhbWVzRGlyOiBzdHJpbmc7XG4gIHByaXZhdGUga25vd2xlZGdlQmFzZUZpbGU6IHN0cmluZztcbiAgcHJpdmF0ZSB0YXJnZXRQaGFzZTogJ21ldGFkYXRhJyB8ICd0cmFuc2NyaXB0JyB8ICdhbmFseXNpcycgPSAnYW5hbHlzaXMnO1xuICBwcml2YXRlIG52aWRpYUFwaUtleTogc3RyaW5nID0gJyc7XG5cbiAgY29uc3RydWN0b3IodGFyZ2V0UGhhc2U6ICdtZXRhZGF0YScgfCAndHJhbnNjcmlwdCcgfCAnYW5hbHlzaXMnID0gJ2FuYWx5c2lzJykge1xuICAgIHRoaXMudGFyZ2V0UGhhc2UgPSB0YXJnZXRQaGFzZTtcbiAgICBjb25zdCBkYXRhRGlyID0gVE5GX1JPT1QgKyAnL2RhdGEnO1xuXG4gICAgdGhpcy5zdGF0ZUZpbGVQYXRoID0gcGF0aC5qb2luKGRhdGFEaXIsICd0cmFuc2NyaXB0LXYyLXN0YXRlLmpzb24nKTtcbiAgICB0aGlzLnJlcG9ydHNEaXIgPSBwYXRoLmpvaW4oZGF0YURpciwgJ3ZpZGVvLXJlcG9ydHMnKTtcbiAgICB0aGlzLnRyYW5zY3JpcHRzRGlyID0gcGF0aC5qb2luKGRhdGFEaXIsICd2aWRlby10cmFuc2NyaXB0cycpO1xuICAgIHRoaXMuZnJhbWVzRGlyID0gcGF0aC5qb2luKGRhdGFEaXIsICd2aWRlby1mcmFtZXMnKTtcbiAgICB0aGlzLmtub3dsZWRnZUJhc2VGaWxlID0gcGF0aC5qb2luKGRhdGFEaXIsICdBSV9Lbm93bGVkZ2VfQmFzZS5tZCcpO1xuXG4gICAgY29uc29sZS5sb2coYFt2M10gVXNpbmcgZGF0YSBkaXJlY3Rvcnk6ICR7ZGF0YURpcn1gKTtcblxuICAgIGZzLm1rZGlyU3luYyh0aGlzLnJlcG9ydHNEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGZzLm1rZGlyU3luYyh0aGlzLnRyYW5zY3JpcHRzRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBmcy5ta2RpclN5bmModGhpcy5mcmFtZXNEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGZzLm1rZGlyU3luYyhwYXRoLmpvaW4oZGF0YURpciwgJ3RlbXBfc3VicycpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcblxuICAgIHRoaXMuc3RhdGUgPSB0aGlzLmxvYWRTdGF0ZSgpO1xuICAgIHRoaXMubG9hZE52aWRpYUtleSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBsb2FkTnZpZGlhS2V5KCk6IHZvaWQge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBlbnZQYXRoID0gam9pbihob21lZGlyKCksICcuaGVybWVzJywgJy5lbnYnKTtcbiAgICAgIGNvbnN0IGVudkNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoZW52UGF0aCwgJ3V0ZjgnKTtcbiAgICAgIGNvbnN0IG1hdGNoID0gZW52Q29udGVudC5tYXRjaCgvTlZJRElBX0FQSV9LRVk9KG52YXBpLVtBLVphLXowLTlcXC1fXSspLyk7XG4gICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgdGhpcy5udmlkaWFBcGlLZXkgPSBtYXRjaFsxXTtcbiAgICAgICAgY29uc29sZS5sb2coJ1t2M10g4pyFIE5WSURJQSBBUEkgS2V5IGxvYWRlZCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignW3YzXSDinYwgTlZJRElBIEFQSSBLZXkgbm90IGZvdW5kIGluIC5oZXJtZXMvLmVudicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1t2M10g4p2MIEZhaWxlZCB0byByZWFkIC5oZXJtZXMvLmVudicpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgbG9hZFN0YXRlKCk6IFByb2Nlc3NpbmdTdGF0ZSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChmcy5leGlzdHNTeW5jKHRoaXMuc3RhdGVGaWxlUGF0aCkpIHtcbiAgICAgICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyh0aGlzLnN0YXRlRmlsZVBhdGgsICd1dGYtOCcpO1xuICAgICAgICBpZiAoY29udGVudC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgY29uc3Qgc3RhdGUgPSBKU09OLnBhcnNlKGNvbnRlbnQpO1xuICAgICAgICAgIGlmIChzdGF0ZS52ZXJzaW9uICE9PSAnMy4wJykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1t2M10gTWlncmF0aW5nIHN0YXRlIHRvIHYzIGZvcm1hdC4uLicpO1xuICAgICAgICAgICAgc3RhdGUudmVyc2lvbiA9ICczLjAnO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmxvZygnW3YzXSDimqDvuI8gU3RhdGUgbG9hZCBlcnJvciwgY3JlYXRpbmcgZnJlc2ggc3RhdGUnKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHZlcnNpb246ICczLjAnLFxuICAgICAgcXVldWU6IFtdLFxuICAgICAgY3VycmVudEluZGV4OiAwLFxuICAgICAgc3RhcnRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICBsYXN0VXBkYXRlZDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgc3RhdHM6IHtcbiAgICAgICAgdG90YWxWaWRlb3M6IDAsXG4gICAgICAgIG1ldGFkYXRhQ29tcGxldGU6IDAsXG4gICAgICAgIHRyYW5zY3JpcHRzRXh0cmFjdGVkOiAwLFxuICAgICAgICBhbmFseXplZDogMCxcbiAgICAgICAgbmVlZHNWaXN1YWxSZXZpZXc6IDAsXG4gICAgICAgIGNvbXBsZXRlZDogMCxcbiAgICAgICAgc2tpcHBlZDogMCxcbiAgICAgICAgZXJyb3JzOiAwLFxuICAgICAgICBhbmFseXNpc1N1Y2Nlc3NSYXRlOiAwLFxuICAgICAgICBhdmVyYWdlVHJhbnNjcmlwdExlbmd0aDogMCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgc2F2ZVN0YXRlKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5zdGF0ZSB8fCAhdGhpcy5zdGF0ZS5xdWV1ZSB8fCB0aGlzLnN0YXRlLnF1ZXVlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc29sZS5lcnJvcignW3YzXSDinYwgUmVmdXNpbmcgdG8gc2F2ZSBlbXB0eSBvciBpbnZhbGlkIHN0YXRlJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc3RhdGUubGFzdFVwZGF0ZWQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgdGhpcy51cGRhdGVTdGF0cygpO1xuICAgIGZzLm1rZGlyU3luYyhwYXRoLmRpcm5hbWUodGhpcy5zdGF0ZUZpbGVQYXRoKSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgZnMud3JpdGVGaWxlU3luYyh0aGlzLnN0YXRlRmlsZVBhdGgsIEpTT04uc3RyaW5naWZ5KHRoaXMuc3RhdGUsIG51bGwsIDIpKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlU3RhdHMoKTogdm9pZCB7XG4gICAgY29uc3QgcyA9IHRoaXMuc3RhdGUuc3RhdHM7XG4gICAgY29uc3QgYW5hbHl6ZWQgPSB0aGlzLnN0YXRlLnF1ZXVlLmZpbHRlcigodikgPT4gdi5hbmFseXNpcykubGVuZ3RoO1xuICAgIGNvbnN0IGF0dGVtcHRlZCA9IHRoaXMuc3RhdGUucXVldWUuZmlsdGVyKCh2KSA9PiB2LnByb2Nlc3NpbmdBdHRlbXB0cyA+IDApLmxlbmd0aDtcbiAgICBzLmFuYWx5c2lzU3VjY2Vzc1JhdGUgPSBhdHRlbXB0ZWQgPiAwID8gKGFuYWx5emVkIC8gYXR0ZW1wdGVkKSAqIDEwMCA6IDA7XG4gICAgY29uc3QgdHJhbnNjcmlwdHMgPSB0aGlzLnN0YXRlLnF1ZXVlLmZpbHRlcigodikgPT4gdi50cmFuc2NyaXB0KTtcbiAgICBzLmF2ZXJhZ2VUcmFuc2NyaXB0TGVuZ3RoID1cbiAgICAgIHRyYW5zY3JpcHRzLmxlbmd0aCA+IDBcbiAgICAgICAgPyB0cmFuc2NyaXB0cy5yZWR1Y2UoKHN1bSwgdikgPT4gc3VtICsgKHYudHJhbnNjcmlwdD8ubGVuZ3RoIHx8IDApLCAwKSAvIHRyYW5zY3JpcHRzLmxlbmd0aFxuICAgICAgICA6IDA7XG4gIH1cblxuICBwcml2YXRlIGV4dHJhY3RWaWRlb0lkKHVybDogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgY29uc3QgbWF0Y2ggPSB1cmwubWF0Y2goXG4gICAgICAvKD86eW91dHViZVxcLmNvbVxcL3dhdGNoXFw/dj18eW91dHVcXC5iZVxcL3x5b3V0dWJlXFwuY29tXFwvZW1iZWRcXC8pKFteJlxccz9dKykvXG4gICAgKTtcbiAgICByZXR1cm4gbWF0Y2ggPyBtYXRjaFsxXSA6IG51bGw7XG4gIH1cblxuICBmb3JtYXREdXJhdGlvbihzZWNvbmRzOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIGNvbnN0IGhvdXJzID0gTWF0aC5mbG9vcihzZWNvbmRzIC8gMzYwMCk7XG4gICAgY29uc3QgbWludXRlcyA9IE1hdGguZmxvb3IoKHNlY29uZHMgJSAzNjAwKSAvIDYwKTtcbiAgICBjb25zdCBzZWNzID0gTWF0aC5mbG9vcihzZWNvbmRzICUgNjApO1xuICAgIHJldHVybiBob3VycyA+IDBcbiAgICAgID8gYCR7aG91cnN9OiR7bWludXRlcy50b1N0cmluZygpLnBhZFN0YXJ0KDIsICcwJyl9OiR7c2Vjcy50b1N0cmluZygpLnBhZFN0YXJ0KDIsICcwJyl9YFxuICAgICAgOiBgJHttaW51dGVzfToke3NlY3MudG9TdHJpbmcoKS5wYWRTdGFydCgyLCAnMCcpfWA7XG4gIH1cblxuICBkZWNvZGVIdG1sRW50aXRpZXModGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGV4dFxuICAgICAgLnJlcGxhY2UoLyZhbXA7L2csICcmJylcbiAgICAgIC5yZXBsYWNlKC8mbHQ7L2csICc8JylcbiAgICAgIC5yZXBsYWNlKC8mZ3Q7L2csICc+JylcbiAgICAgIC5yZXBsYWNlKC8mcXVvdDsvZywgJ1wiJylcbiAgICAgIC5yZXBsYWNlKC8mIzM5Oy9nLCBcIidcIik7XG4gIH1cblxuICBhc3luYyBpbml0aWFsaXplKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHByb2ZpbGVEaXIgPSBwYXRoLmpvaW4ocHJvY2Vzcy5lbnYuSE9NRSB8fCAnL3RtcCcsICcudmlkZW8tcHJvY2Vzc29yLWNocm9tZS1jbGVhbicpO1xuICAgIGNvbnNvbGUubG9nKCdbdjNdIPCfmoAgTGF1bmNoaW5nIEhlYWRsZXNzIEludGVsbGlnZW5jZSBCcmlkZ2UuLi4nKTtcbiAgICBmcy5ta2RpclN5bmMocHJvZmlsZURpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgdGhpcy5jb250ZXh0ID0gYXdhaXQgY2hyb21pdW0ubGF1bmNoUGVyc2lzdGVudENvbnRleHQocHJvZmlsZURpciwge1xuICAgICAgaGVhZGxlc3M6IHRydWUsIC8vIFYzIFVwZ3JhZGU6IFRydWx5IGhlYWRsZXNzIHRvIHByZXZlbnQgZm9jdXMgc3RlYWxpbmdcbiAgICAgIGFyZ3M6IFtcbiAgICAgICAgJy0tbm8tZmlyc3QtcnVuJyxcbiAgICAgICAgJy0tbm8tZGVmYXVsdC1icm93c2VyLWNoZWNrJyxcbiAgICAgICAgJy0tZGlzYWJsZS1ibGluay1mZWF0dXJlcz1BdXRvbWF0aW9uQ29udHJvbGxlZCcsXG4gICAgICAgICctLXdpbmRvdy1zaXplPTEyODAsODAwJyxcbiAgICAgICAgJy0tbXV0ZS1hdWRpbycsXG4gICAgICAgICctLWF1dG9wbGF5LXBvbGljeT1uby11c2VyLWdlc3R1cmUtcmVxdWlyZWQnLFxuICAgICAgXSxcbiAgICAgIHVzZXJBZ2VudDpcbiAgICAgICAgJ01vemlsbGEvNS4wIChNYWNpbnRvc2g7IEludGVsIE1hYyBPUyBYIDEwXzE1XzcpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjIuMC4wLjAgU2FmYXJpLzUzNy4zNicsXG4gICAgICB2aWV3cG9ydDogeyB3aWR0aDogMTI4MCwgaGVpZ2h0OiA4MDAgfSxcbiAgICAgIGlnbm9yZURlZmF1bHRBcmdzOiBbJy0tZW5hYmxlLWF1dG9tYXRpb24nXSxcbiAgICB9KTtcbiAgICBjb25zb2xlLmxvZygnW3YzXSDinIUgSGVhZGxlc3MgQnJpZGdlIHJlYWR5Jyk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGVuc3VyZUJyb3dzZXJIZWFsdGgoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghdGhpcy5jb250ZXh0KSB7XG4gICAgICAgIGF3YWl0IHRoaXMuaW5pdGlhbGl6ZSgpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBhZ2VzID0gYXdhaXQgdGhpcy5jb250ZXh0LnBhZ2VzKCk7XG4gICAgICBpZiAocGFnZXMubGVuZ3RoID4gMzApIHtcbiAgICAgICAgZm9yIChjb25zdCBwYWdlIG9mIHBhZ2VzKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgYXdhaXQgdGhpcy5pbml0aWFsaXplKCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBmZXRjaEVucmljaGVkTWV0YWRhdGEodmlkZW86IFZpZGVvRW50cnkpOiBQcm9taXNlPFZpZGVvTWV0YWRhdGEgfCBudWxsPiB7XG4gICAgaWYgKCF0aGlzLmNvbnRleHQpIHRocm93IG5ldyBFcnJvcignQnJvd3NlciBub3QgaW5pdGlhbGl6ZWQnKTtcbiAgICBjb25zb2xlLmxvZyhgW3YyXSDwn5OKIEVucmljaGVkIG1ldGFkYXRhIGZldGNoOiAke3ZpZGVvLnRpdGxlfWApO1xuICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCB0aGlzLmNvbnRleHQubmV3UGFnZSgpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBxdWVyeSA9IGBZb3VUdWJlIHZpZGVvIFwiJHt2aWRlby51cmx9XCIgY29tcGxldGUgaW5mb3JtYXRpb246IGR1cmF0aW9uLCBjaGFubmVsLCBkZXNjcmlwdGlvbiwgdmlld3MsIHB1Ymxpc2ggZGF0ZSwgdG9waWNzLCBzdW1tYXJ5YDtcbiAgICAgIGNvbnN0IHNlYXJjaFVybCA9IGBodHRwczovL3d3dy5nb29nbGUuY29tL3NlYXJjaD9xPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5KX0mdWRtPTUwYDtcbiAgICAgIGF3YWl0IHBhZ2UuZ290byhzZWFyY2hVcmwsIHsgd2FpdFVudGlsOiAnZG9tY29udGVudGxvYWRlZCcsIHRpbWVvdXQ6IDMwMDAwIH0pO1xuICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCg0MDAwKTtcbiAgICAgIGNvbnN0IHBhZ2VUZXh0ID0gYXdhaXQgcGFnZS5ldmFsdWF0ZSgoKSA9PiBkb2N1bWVudC5ib2R5LmlubmVyVGV4dCk7XG5cbiAgICAgIGxldCBkdXJhdGlvbiA9IDA7XG4gICAgICBjb25zdCBkdXJhdGlvbk1hdGNoID0gcGFnZVRleHQubWF0Y2goLyhcXGQrKVxccyptaW51dGVzP1xccyosP1xccyooXFxkKyk/XFxzKnNlY29uZHM/L2kpO1xuICAgICAgaWYgKGR1cmF0aW9uTWF0Y2gpXG4gICAgICAgIGR1cmF0aW9uID0gcGFyc2VJbnQoZHVyYXRpb25NYXRjaFsxXSkgKiA2MCArIHBhcnNlSW50KGR1cmF0aW9uTWF0Y2hbMl0gfHwgJzAnKTtcblxuICAgICAgY29uc3QgbWV0YWRhdGE6IFZpZGVvTWV0YWRhdGEgPSB7XG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgICBkdXJhdGlvbkZvcm1hdHRlZDogdGhpcy5mb3JtYXREdXJhdGlvbihkdXJhdGlvbiksXG4gICAgICAgIGNoYW5uZWw6ICdVbmtub3duJyxcbiAgICAgICAgdmlld0NvdW50OiAnVW5rbm93bicsXG4gICAgICAgIHB1Ymxpc2hEYXRlOiAnVW5rbm93bicsXG4gICAgICB9O1xuICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgcmV0dXJuIG1ldGFkYXRhO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGV4dHJhY3RUcmFuc2NyaXB0RGlyZWN0KHZpZGVvOiBWaWRlb0VudHJ5KTogUHJvbWlzZTxUcmFuc2NyaXB0U2VnbWVudFtdIHwgbnVsbD4ge1xuICAgIGNvbnN0IHNhZmVUaXRsZSA9IHZpZGVvLnRpdGxlLnJlcGxhY2UoL1teYS16QS1aMC05XS9nLCAnXycpLnN1YnN0cmluZygwLCA1MCk7XG4gICAgY29uc3QgdHJhbnNjcmlwdEZpbGUgPSBwYXRoLmpvaW4odGhpcy50cmFuc2NyaXB0c0RpciwgYCR7dmlkZW8uaW5kZXh9XyR7c2FmZVRpdGxlfS50eHRgKTtcblxuICAgIGlmIChmcy5leGlzdHNTeW5jKHRyYW5zY3JpcHRGaWxlKSkge1xuICAgICAgY29uc29sZS5sb2coYFt2Ml0g4pyFIFVzaW5nIGV4aXN0aW5nIHRyYW5zY3JpcHQgZmlsZTogJHtwYXRoLmJhc2VuYW1lKHRyYW5zY3JpcHRGaWxlKX1gKTtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmModHJhbnNjcmlwdEZpbGUsICd1dGY4Jyk7XG4gICAgICByZXR1cm4gY29udGVudFxuICAgICAgICAuc3BsaXQoJ1xcbicpXG4gICAgICAgIC5maWx0ZXIoKGwpID0+IGwudHJpbSgpKVxuICAgICAgICAubWFwKChsaW5lLCBpKSA9PiAoe1xuICAgICAgICAgIHN0YXJ0OiBpICogNSxcbiAgICAgICAgICBkdXJhdGlvbjogNSxcbiAgICAgICAgICB0ZXh0OiBsaW5lLnJlcGxhY2UoL15cXFsuKj9cXF1cXHMqLywgJycpLnRyaW0oKSxcbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIGNvbnN0IGZiID0gdGhpcy5kb3dubG9hZFRyYW5zY3JpcHRXaXRoWXREbHAodmlkZW8udXJsLCB2aWRlby52aWRlb0lkKTtcbiAgICBpZiAoZmIpIHJldHVybiBmYjtcblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRWaXN1YWxIb3RzcG90cyh2aWRlbzogVmlkZW9FbnRyeSk6IG51bWJlcltdIHtcbiAgICBjb25zdCBwcmlvcml0eUtleXdvcmRzID0gW1xuICAgICAgJ2RpYWdyYW0nLFxuICAgICAgJ2FyY2hpdGVjdHVyZScsXG4gICAgICAnZ3JhcGgnLFxuICAgICAgJ2Zsb3cnLFxuICAgICAgJ2RlbW8nLFxuICAgICAgJ2NvZGUnLFxuICAgICAgJ3NuaXBwZXQnLFxuICAgICAgJ3N0cnVjdHVyZScsXG4gICAgICAnZGFzaGJvYXJkJyxcbiAgICAgICdpbnRlcmZhY2UnLFxuICAgIF07XG4gICAgY29uc3Qgc3VwcG9ydEtleXdvcmRzID0gW1xuICAgICAgJ2xvb2sgYXQnLFxuICAgICAgJ3Nob3dpbmcnLFxuICAgICAgJ3NjcmVlbicsXG4gICAgICAnc2xpZGUnLFxuICAgICAgJ2ZpZ3VyZScsXG4gICAgICAnZnJhbWV3b3JrJyxcbiAgICAgICdjaGFydCcsXG4gICAgICAncGlwZWxpbmUnLFxuICAgICAgJ2NvbnRleHQnLFxuICAgIF07XG5cbiAgICBjb25zdCB3ZWlnaHRlZEhvdHNwb3RzOiB7IHRzOiBudW1iZXI7IHdlaWdodDogbnVtYmVyIH1bXSA9IFtdO1xuICAgIGxldCBkdXJhdGlvbiA9IHZpZGVvLm1ldGFkYXRhPy5kdXJhdGlvbiB8fCAwO1xuXG4gICAgaWYgKHZpZGVvLnRyYW5zY3JpcHQgJiYgdmlkZW8udHJhbnNjcmlwdC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBsYXN0VHMgPSB2aWRlby50cmFuc2NyaXB0W3ZpZGVvLnRyYW5zY3JpcHQubGVuZ3RoIC0gMV0uc3RhcnQ7XG4gICAgICBpZiAoZHVyYXRpb24gPCAxMCB8fCBkdXJhdGlvbiA8IGxhc3RUcykgZHVyYXRpb24gPSBNYXRoLmZsb29yKGxhc3RUcyArIDEwKTtcbiAgICB9XG5cbiAgICBpZiAodmlkZW8udHJhbnNjcmlwdCkge1xuICAgICAgdmlkZW8udHJhbnNjcmlwdC5mb3JFYWNoKChzZWdtZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IHRleHQgPSBzZWdtZW50LnRleHQudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgbGV0IHdlaWdodCA9IDA7XG4gICAgICAgIGlmIChwcmlvcml0eUtleXdvcmRzLnNvbWUoKGspID0+IHRleHQuaW5jbHVkZXMoaykpKSB3ZWlnaHQgPSAyO1xuICAgICAgICBlbHNlIGlmIChzdXBwb3J0S2V5d29yZHMuc29tZSgoaykgPT4gdGV4dC5pbmNsdWRlcyhrKSkpIHdlaWdodCA9IDE7XG4gICAgICAgIGlmICh3ZWlnaHQgPiAwKSB7XG4gICAgICAgICAgY29uc3QgdHMgPSBNYXRoLm1pbihkdXJhdGlvbiwgTWF0aC5mbG9vcihzZWdtZW50LnN0YXJ0ICsgMykpO1xuICAgICAgICAgIGNvbnN0IGlzQ2x1c3RlciA9IHdlaWdodGVkSG90c3BvdHMuc29tZSgoaCkgPT4gTWF0aC5hYnMoaC50cyAtIHRzKSA8IDQ1KTtcbiAgICAgICAgICBpZiAoIWlzQ2x1c3Rlcikgd2VpZ2h0ZWRIb3RzcG90cy5wdXNoKHsgdHMsIHdlaWdodCB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgd2VpZ2h0ZWRIb3RzcG90cy5zb3J0KChhLCBiKSA9PiBiLndlaWdodCAtIGEud2VpZ2h0IHx8IGEudHMgLSBiLnRzKTtcbiAgICBjb25zdCBzZWxlY3RlZCA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuICAgIHdlaWdodGVkSG90c3BvdHMuc2xpY2UoMCwgNikuZm9yRWFjaCgoaCkgPT4gc2VsZWN0ZWQuYWRkKGgudHMpKTtcbiAgICBzZWxlY3RlZC5hZGQoMTApO1xuICAgIGlmIChkdXJhdGlvbiA+IDYwKSBzZWxlY3RlZC5hZGQoTWF0aC5mbG9vcihkdXJhdGlvbiAvIDIpKTtcbiAgICBpZiAoZHVyYXRpb24gPiAyMCkgc2VsZWN0ZWQuYWRkKGR1cmF0aW9uIC0gMTApO1xuICAgIHJldHVybiBBcnJheS5mcm9tKHNlbGVjdGVkKVxuICAgICAgLnNvcnQoKGEsIGIpID0+IGEgLSBiKVxuICAgICAgLnNsaWNlKDAsIDgpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjYXB0dXJlRnJhbWVzKFxuICAgIHBhZ2U6IFBhZ2UsXG4gICAgdmlkZW86IFZpZGVvRW50cnksXG4gICAgb2Zmc2V0U2Vjb25kczogbnVtYmVyID0gMFxuICApOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc29sZS5sb2coXG4gICAgICBgW3YzXSDwn5O4IEludGVycnVwdC1GcmVlIEZyYW1lIENhcHR1cmUgZm9yOiAke3ZpZGVvLnRpdGxlfSAoT2Zmc2V0OiAke29mZnNldFNlY29uZHN9cylgXG4gICAgKTtcbiAgICBjb25zdCBmcmFtZXM6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3QgdGltZXN0YW1wcyA9IHRoaXMuZ2V0VmlzdWFsSG90c3BvdHModmlkZW8pLm1hcCgodHMpID0+IE1hdGgubWF4KDAsIHRzICsgb2Zmc2V0U2Vjb25kcykpO1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYFt2M10g8J+OryBUYXJnZXQgdGltZXN0YW1wczogJHt0aW1lc3RhbXBzLm1hcCgodCkgPT4gdGhpcy5mb3JtYXREdXJhdGlvbih0KSkuam9pbignLCAnKX1gXG4gICAgKTtcblxuICAgIGZvciAoY29uc3QgdHMgb2YgdGltZXN0YW1wcykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc29sZS5sb2coYFt2M10gU2Vla2luZyB0byAke3RoaXMuZm9ybWF0RHVyYXRpb24odHMpfS4uLmApO1xuICAgICAgICBhd2FpdCBwYWdlLmV2YWx1YXRlKCh0KSA9PiB7XG4gICAgICAgICAgY29uc3QgdiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ3ZpZGVvJyk7XG4gICAgICAgICAgaWYgKHYpIHYuY3VycmVudFRpbWUgPSB0O1xuICAgICAgICB9LCB0cyk7XG5cbiAgICAgICAgLy8gRW5zdXJlIHBsYXliYWNrIGlzIHBhdXNlZCBzbyBmcmFtZSBpcyBzdGFibGVcbiAgICAgICAgYXdhaXQgcGFnZS5ldmFsdWF0ZSgoKSA9PiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCd2aWRlbycpPy5wYXVzZSgpKTtcbiAgICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgyMDAwKTtcblxuICAgICAgICBjb25zdCBmcmFtZVBhdGggPSBwYXRoLmpvaW4odGhpcy5mcmFtZXNEaXIsIGAke3ZpZGVvLnZpZGVvSWR9XyR7dHN9LmpwZ2ApO1xuXG4gICAgICAgIC8vIFYzIFVwZ3JhZGU6IEJhY2tncm91bmQtU2FmZSBDYXB0dXJlXG4gICAgICAgIC8vIFRhcmdldCB0aGUgdmlkZW8gZWxlbWVudCBkaXJlY3RseSBmb3IgaGlnaC1maWRlbGl0eSBjb250ZW50IG9ubHlcbiAgICAgICAgY29uc3QgdmlkZW9FbGVtZW50ID0gcGFnZS5sb2NhdG9yKCd2aWRlbycpLmZpcnN0KCk7XG4gICAgICAgIGlmIChhd2FpdCB2aWRlb0VsZW1lbnQuaXNWaXNpYmxlKCkpIHtcbiAgICAgICAgICBhd2FpdCB2aWRlb0VsZW1lbnQuc2NyZWVuc2hvdCh7XG4gICAgICAgICAgICBwYXRoOiBmcmFtZVBhdGgsXG4gICAgICAgICAgICB0eXBlOiAnanBlZycsXG4gICAgICAgICAgICBxdWFsaXR5OiA5MCxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGZyYW1lUGF0aCkpIHtcbiAgICAgICAgICAgIGZyYW1lcy5wdXNoKGZzLnJlYWRGaWxlU3luYyhmcmFtZVBhdGgsICdiYXNlNjQnKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFt2M10gRmFpbGVkIHRvIGNhcHR1cmUgZnJhbWUgYXQgJHt0c306YCwgZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmcmFtZXM7XG4gIH1cblxuICBwcml2YXRlIHBydW5lRnJhbWVzKHZpZGVvOiBWaWRlb0VudHJ5KTogdm9pZCB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZpbGVzID0gZnMucmVhZGRpclN5bmModGhpcy5mcmFtZXNEaXIpLmZpbHRlcigoZikgPT4gZi5zdGFydHNXaXRoKHZpZGVvLnZpZGVvSWQpKTtcbiAgICAgIGZpbGVzLmZvckVhY2goKGYpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBmcy51bmxpbmtTeW5jKHBhdGguam9pbih0aGlzLmZyYW1lc0RpciwgZikpO1xuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgfSk7XG4gICAgICBjb25zb2xlLmxvZyhgW3YzXSDwn6e5IFBydW5lZCAke2ZpbGVzLmxlbmd0aH0gZnJhbWVzIGZvciAke3ZpZGVvLnZpZGVvSWR9YCk7XG4gICAgfSBjYXRjaCAoZSkge31cbiAgfVxuXG4gIGFzeW5jIGFuYWx5emVXaXRoQUkodmlkZW86IFZpZGVvRW50cnkpOiBQcm9taXNlPEFuYWx5c2lzUmVzdWx0IHwgbnVsbD4ge1xuICAgIGlmICghdGhpcy5udmlkaWFBcGlLZXkgfHwgIXZpZGVvLnRyYW5zY3JpcHQpIHJldHVybiBudWxsO1xuICAgIGxldCByZXRyaWVzID0gMjtcbiAgICB3aGlsZSAocmV0cmllcyA+PSAwKSB7XG4gICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgYFt2M10g8J+noCBNdWx0aW1vZGFsIEFuYWx5c2lzIHZpYSAke01VTFRJTU9EQUxfTU9ERUx9OiAke3ZpZGVvLnRpdGxlfSAoUmV0cmllczogJHtyZXRyaWVzfSlgXG4gICAgICApO1xuICAgICAgY29uc3QgdHJhbnNjcmlwdFRleHQgPSB2aWRlby50cmFuc2NyaXB0XG4gICAgICAgIC5tYXAoKHMpID0+IGBbJHt0aGlzLmZvcm1hdER1cmF0aW9uKHMuc3RhcnQpfV0gJHtzLnRleHR9YClcbiAgICAgICAgLmpvaW4oJ1xcbicpO1xuICAgICAgY29uc3QgbWVzc2FnZXMgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgY29udGVudDogW1xuICAgICAgICAgICAgeyB0eXBlOiAndGV4dCcsIHRleHQ6IEFOQUxZU0lTX1BST01QVCArIHRyYW5zY3JpcHRUZXh0LnN1YnN0cmluZygwLCAxMjAwMCkgfSxcbiAgICAgICAgICAgIC4uLih2aWRlby5mcmFtZXMgfHwgW10pLm1hcCgoZikgPT4gKHtcbiAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlX3VybCcsXG4gICAgICAgICAgICAgIGltYWdlX3VybDogeyB1cmw6IGBkYXRhOmltYWdlL2pwZWc7YmFzZTY0LCR7Zn1gIH0sXG4gICAgICAgICAgICB9KSksXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIF07XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goTlZJRElBX0FQSV9VUkwsIHtcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7dGhpcy5udmlkaWFBcGlLZXl9YCxcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBtb2RlbDogTVVMVElNT0RBTF9NT0RFTCxcbiAgICAgICAgICAgIG1lc3NhZ2VzLFxuICAgICAgICAgICAgbWF4X3Rva2VuczogMjA0OCxcbiAgICAgICAgICAgIHRlbXBlcmF0dXJlOiAwLjEsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgc2lnbmFsOiAoQWJvcnRTaWduYWwgYXMgYW55KS50aW1lb3V0KDkwMDAwKSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgIHJldHJpZXMtLTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgICAgIGxldCByYXdSZXNwb25zZSA9IGRhdGEuY2hvaWNlc1swXS5tZXNzYWdlLmNvbnRlbnQ7XG4gICAgICAgIHJhd1Jlc3BvbnNlID0gcmF3UmVzcG9uc2UucmVwbGFjZSgvPHRoaW5raW5nPltcXHNcXFNdKj88XFwvdGhpbmtpbmc+L2csICcnKS50cmltKCk7XG4gICAgICAgIHJhd1Jlc3BvbnNlID0gcmF3UmVzcG9uc2UucmVwbGFjZSgvYGBganNvblxcbj98XFxuP2BgYC9nLCAnJykudHJpbSgpO1xuICAgICAgICBpZiAoIXJhd1Jlc3BvbnNlLnN0YXJ0c1dpdGgoJ3snKSkge1xuICAgICAgICAgIGNvbnN0IG1hdGNoID0gcmF3UmVzcG9uc2UubWF0Y2goL1xce1tcXHNcXFNdKlxcfS8pO1xuICAgICAgICAgIGlmIChtYXRjaCkgcmF3UmVzcG9uc2UgPSBtYXRjaFswXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UocmF3UmVzcG9uc2UpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGtleVBvaW50czogcGFyc2VkLmtleVBvaW50cyB8fCBbXSxcbiAgICAgICAgICBhaUNvbmNlcHRzOiBwYXJzZWQuYWlDb25jZXB0cyB8fCBbXSxcbiAgICAgICAgICB0ZWNobmljYWxEZXRhaWxzOiBwYXJzZWQudGVjaG5pY2FsRGV0YWlscyB8fCBbXSxcbiAgICAgICAgICB2aXN1YWxDb250ZXh0RmxhZ3M6IHBhcnNlZC52aXN1YWxDb250ZXh0RmxhZ3MgfHwgW10sXG4gICAgICAgICAgc3VtbWFyeTogcGFyc2VkLnN1bW1hcnkgfHwgJycsXG4gICAgICAgICAgdmlzdWFsVXRpbGl0eVNjb3JlOiBwYXJzZWQudmlzdWFsVXRpbGl0eVNjb3JlIHx8IDAsXG4gICAgICAgICAgcXVhbGl0eVNjb3JlOiB0aGlzLmNhbGN1bGF0ZVF1YWxpdHlTY29yZShwYXJzZWQpLFxuICAgICAgICAgIHJhd1Jlc3BvbnNlOiByYXdSZXNwb25zZS5zdWJzdHJpbmcoMCwgMTAwMCksXG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHJpZXMtLTtcbiAgICAgICAgaWYgKHJldHJpZXMgPj0gMCkgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgNTAwMCkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlUXVhbGl0eVNjb3JlKHBhcnNlZDogYW55KTogbnVtYmVyIHtcbiAgICBsZXQgc2NvcmUgPSAwO1xuICAgIGlmIChwYXJzZWQuc3VtbWFyeSAmJiBwYXJzZWQuc3VtbWFyeS5sZW5ndGggPiA1MCkgc2NvcmUgKz0gMjU7XG4gICAgaWYgKHBhcnNlZC5rZXlQb2ludHMgJiYgcGFyc2VkLmtleVBvaW50cy5sZW5ndGggPj0gMykgc2NvcmUgKz0gMjU7XG4gICAgaWYgKHBhcnNlZC5haUNvbmNlcHRzICYmIHBhcnNlZC5haUNvbmNlcHRzLmxlbmd0aCA+IDApIHNjb3JlICs9IDI1O1xuICAgIGlmIChwYXJzZWQudGVjaG5pY2FsRGV0YWlscyAmJiBwYXJzZWQudGVjaG5pY2FsRGV0YWlscy5sZW5ndGggPiAwKSBzY29yZSArPSAyNTtcbiAgICByZXR1cm4gc2NvcmU7XG4gIH1cblxuICBzYXZlUmVwb3J0KHZpZGVvOiBWaWRlb0VudHJ5KTogc3RyaW5nIHtcbiAgICBjb25zdCBzYWZlVGl0bGUgPSB2aWRlby50aXRsZS5yZXBsYWNlKC9bXmEtekEtWjAtOV0vZywgJ18nKS5zdWJzdHJpbmcoMCwgNTApO1xuICAgIGNvbnN0IHJlcG9ydEZpbGUgPSBwYXRoLmpvaW4oXG4gICAgICB0aGlzLnJlcG9ydHNEaXIsXG4gICAgICBgdjJfJHt2aWRlby5pbmRleH1fJHtzYWZlVGl0bGV9XyR7RGF0ZS5ub3coKX0ubWRgXG4gICAgKTtcbiAgICBsZXQgY29udGVudCA9IGAjIFZpZGVvIEFuYWx5c2lzIFJlcG9ydFxcblxcbiMjIE1ldGFkYXRhXFxuLSAqKlZpZGVvKio6ICR7dmlkZW8udGl0bGV9XFxuLSAqKkluZGV4Kio6ICMke3ZpZGVvLmluZGV4fVxcbi0gKipVUkwqKjogJHt2aWRlby51cmx9XFxuLSAqKkR1cmF0aW9uKio6ICR7dmlkZW8ubWV0YWRhdGE/LmR1cmF0aW9uRm9ybWF0dGVkIHx8ICdVbmtub3duJ31cXG4tICoqUHJvY2Vzc2VkKio6ICR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpfVxcblxcbi0tLVxcblxcbiMjIFN1bW1hcnlcXG4ke3ZpZGVvLmFuYWx5c2lzPy5zdW1tYXJ5IHx8ICdObyBzdW1tYXJ5IGF2YWlsYWJsZSd9XFxuYDtcblxuICAgIGlmICh2aWRlby5hbmFseXNpcz8udmlzdWFsQ29udGV4dEZsYWdzICYmIHZpZGVvLmFuYWx5c2lzLnZpc3VhbENvbnRleHRGbGFncy5sZW5ndGggPiAwKSB7XG4gICAgICBjb250ZW50ICs9IGBcXG4jIyDwn6a+IFZpc3VhbCBJbnRlbGxpZ2VuY2VcXG4ke3ZpZGVvLmFuYWx5c2lzLnZpc3VhbENvbnRleHRGbGFnc1xuICAgICAgICAubWFwKChmKSA9PiBgLSAqKiR7dGhpcy5mb3JtYXREdXJhdGlvbihmLnRpbWVzdGFtcCl9Kio6ICR7Zi5yZWFzb259IC0gJHtmLmNvbnRleHR9YClcbiAgICAgICAgLmpvaW4oJ1xcbicpfVxcbmA7XG4gICAgfVxuXG4gICAgZnMud3JpdGVGaWxlU3luYyhyZXBvcnRGaWxlLCBjb250ZW50KTtcbiAgICB0aGlzLmFwcGVuZFRvS25vd2xlZGdlQmFzZSh2aWRlbyk7XG4gICAgcmV0dXJuIHJlcG9ydEZpbGU7XG4gIH1cblxuICBwcml2YXRlIGFwcGVuZFRvS25vd2xlZGdlQmFzZSh2aWRlbzogVmlkZW9FbnRyeSk6IHZvaWQge1xuICAgIGNvbnN0IGVudHJ5SWQgPSBgdmlkZW8tYW5hbHlzaXMtJHt2aWRlby52aWRlb0lkfWA7XG4gICAgY29uc3Qgc2FmZVRpdGxlID0gdmlkZW8udGl0bGUucmVwbGFjZSgvW15hLXpBLVowLTldL2csICdfJykuc3Vic3RyaW5nKDAsIDUwKTtcbiAgICAvLyBQaGFzZSA5OiBzaGFyZWQgRmVkZXJhdGVkIElEIyBoZWxwZXIuIENhbm9uaWNhbCBlbmNvZGVyIHN0aWxsIGxpdmVzIGluXG4gICAgLy8gcGFja2FnZXMvYTJhLWNvcmUvc3JjL2ZlZGVyYXRlZC1pZGVudGl0eS5zZXJ2aWNlLnRzOyByZS1pbXBvcnRlZCBoZXJlXG4gICAgLy8gZnJvbSB0aGUgVjIgc2libGluZywgd2hpY2gga2VlcHMgdGhlIGFscGhhYmV0IGluIHN5bmMuXG4gICAgY29uc3QgaWROdW1iZXIgPSBnZW5lcmF0ZUZlZGVyYXRlZElkTnVtYmVyKHZpZGVvLmluZGV4KTtcblxuICAgIGNvbnN0IGNvbXBvdW5kaW5nRW50cnkgPSB7XG4gICAgICBpZDogZW50cnlJZCxcbiAgICAgIHRpdGxlOiB2aWRlby50aXRsZSxcbiAgICAgIGNhdGVnb3J5OiAndmlkZW8tYW5hbHlzaXMnLFxuICAgICAgY29udGVudDogdmlkZW8uYW5hbHlzaXM/LnN1bW1hcnkgfHwgJ05vIHN1bW1hcnknLFxuICAgICAgdmlzdWFsX2ludGVsbGlnZW5jZTogdmlkZW8uYW5hbHlzaXM/LnZpc3VhbENvbnRleHRGbGFncyB8fCBbXSxcbiAgICAgIGJhY2tsaW5rczogW1xuICAgICAgICAuLi4odmlkZW8uYW5hbHlzaXM/LmFpQ29uY2VwdHMgfHwgW10pLFxuICAgICAgICAuLi4odmlkZW8uYW5hbHlzaXM/LnRlY2huaWNhbERldGFpbHMgfHwgW10pLFxuICAgICAgXSxcbiAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgIGFnZW50SWQ6ICd0cmFuc2NyaXB0LXByb2Nlc3Nvci12MycsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICB2aWRlb0lkOiB2aWRlby52aWRlb0lkLFxuICAgICAgICB1cmw6IHZpZGVvLnVybCxcbiAgICAgICAgcXVhbGl0eVNjb3JlOiB2aWRlby5hbmFseXNpcz8ucXVhbGl0eVNjb3JlIHx8IDAsXG4gICAgICAgIGlkTnVtYmVyOiBpZE51bWJlcixcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIGNvbnN0IHdpa2lJbmJveERpciA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUodGhpcy5zdGF0ZUZpbGVQYXRoKSwgJ3dpa2ktaW5ib3gnKTtcbiAgICBmcy5ta2RpclN5bmMod2lraUluYm94RGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBmcy53cml0ZUZpbGVTeW5jKFxuICAgICAgcGF0aC5qb2luKHdpa2lJbmJveERpciwgYCR7ZW50cnlJZH0uanNvbmApLFxuICAgICAgSlNPTi5zdHJpbmdpZnkoY29tcG91bmRpbmdFbnRyeSwgbnVsbCwgMilcbiAgICApO1xuXG4gICAgY29uc3QgbGVnYWN5RW50cnkgPSBgXFxuLS0tXFxuXFxuIyMgIyR7dmlkZW8uaW5kZXh9OiAke3ZpZGVvLnRpdGxlfVxcbioqVVJMKio6ICR7dmlkZW8udXJsfVxcbioqUmVzb3VyY2UgUG9pbnRlcioqOiB0cnA6Ly93aWtpLWluYm94LyR7ZW50cnlJZH0uanNvblxcblxcbiMjIyBTdW1tYXJ5XFxuJHt2aWRlby5hbmFseXNpcz8uc3VtbWFyeSB8fCAnTm8gc3VtbWFyeSd9XFxuXFxuIyMjIFZpc3VhbCBGaW5kaW5nc1xcbiR7KHZpZGVvLmFuYWx5c2lzPy52aXN1YWxDb250ZXh0RmxhZ3MgfHwgW10pLm1hcCgoZikgPT4gYC0gWyR7dGhpcy5mb3JtYXREdXJhdGlvbihmLnRpbWVzdGFtcCl9XSAke2YuY29udGV4dH1gKS5qb2luKCdcXG4nKSB8fCAnLSBOb25lJ31cXG5cXG5gO1xuICAgIGZzLmFwcGVuZEZpbGVTeW5jKHRoaXMua25vd2xlZGdlQmFzZUZpbGUsIGxlZ2FjeUVudHJ5KTtcbiAgfVxuXG4gIGFzeW5jIHByb2Nlc3NWaWRlbyh2aWRlbzogVmlkZW9FbnRyeSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh2aWRlby5zdGF0dXMgPT09ICdjb21wbGV0ZWQnIHx8IHZpZGVvLnN0YXR1cyA9PT0gJ3NraXBwZWQnKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAodmlkZW8ucHJvY2Vzc2luZ0F0dGVtcHRzID49IDMpIHtcbiAgICAgIHZpZGVvLnN0YXR1cyA9ICdza2lwcGVkJztcbiAgICAgIHRoaXMuc3RhdGUuc3RhdHMuc2tpcHBlZCsrO1xuICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5lbnN1cmVCcm93c2VySGVhbHRoKCk7XG4gICAgY29uc29sZS5sb2coYFxcbuKVkOKVkOKVkOKVkCBWaWRlbyAjJHt2aWRlby5pbmRleH06ICR7dmlkZW8udGl0bGV9IOKVkOKVkOKVkOKVkFxcbmApO1xuICAgIHZpZGVvLnByb2Nlc3NpbmdBdHRlbXB0cysrO1xuICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG5cbiAgICB0cnkge1xuICAgICAgaWYgKCF2aWRlby5tZXRhZGF0YSkge1xuICAgICAgICBsZXQgZHVyYXRpb24gPSAwO1xuICAgICAgICBsZXQgZHVyYXRpb25Gb3JtYXR0ZWQgPSAnMDowMCc7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgZHVyU3RyID0gZXhlY1N5bmMoYHl0LWRscCAtLWdldC1kdXJhdGlvbiAke3ZpZGVvLnVybH1gKS50b1N0cmluZygpLnRyaW0oKTtcbiAgICAgICAgICBjb25zdCBwYXJ0cyA9IGR1clN0ci5zcGxpdCgnOicpLm1hcChOdW1iZXIpO1xuICAgICAgICAgIGlmIChwYXJ0cy5sZW5ndGggPT09IDIpIGR1cmF0aW9uID0gcGFydHNbMF0gKiA2MCArIHBhcnRzWzFdO1xuICAgICAgICAgIGVsc2UgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMykgZHVyYXRpb24gPSBwYXJ0c1swXSAqIDM2MDAgKyBwYXJ0c1sxXSAqIDYwICsgcGFydHNbMl07XG4gICAgICAgICAgaWYgKGR1cmF0aW9uID4gMCkgZHVyYXRpb25Gb3JtYXR0ZWQgPSBkdXJTdHI7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHt9XG5cbiAgICAgICAgdmlkZW8ubWV0YWRhdGEgPSAoYXdhaXQgdGhpcy5mZXRjaEVucmljaGVkTWV0YWRhdGEodmlkZW8pKSB8fCB1bmRlZmluZWQ7XG4gICAgICAgIGlmICh2aWRlby5tZXRhZGF0YSkge1xuICAgICAgICAgIGlmIChkdXJhdGlvbiA+IDApIHtcbiAgICAgICAgICAgIHZpZGVvLm1ldGFkYXRhLmR1cmF0aW9uID0gZHVyYXRpb247XG4gICAgICAgICAgICB2aWRlby5tZXRhZGF0YS5kdXJhdGlvbkZvcm1hdHRlZCA9IGR1cmF0aW9uRm9ybWF0dGVkO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnN0YXRlLnN0YXRzLm1ldGFkYXRhQ29tcGxldGUrKztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXZpZGVvLnRyYW5zY3JpcHQpIHtcbiAgICAgICAgdmlkZW8udHJhbnNjcmlwdCA9IChhd2FpdCB0aGlzLmV4dHJhY3RUcmFuc2NyaXB0RGlyZWN0KHZpZGVvKSkgfHwgdW5kZWZpbmVkO1xuICAgICAgICBpZiAodmlkZW8udHJhbnNjcmlwdCkgdGhpcy5zdGF0ZS5zdGF0cy50cmFuc2NyaXB0c0V4dHJhY3RlZCsrO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgfVxuXG4gICAgICBpZiAodmlkZW8udHJhbnNjcmlwdCkge1xuICAgICAgICAvLyBWMzogVmlzdWFsIEZyYW1lIENhcHR1cmUgd2l0aCBWZXJpZmljYXRpb24gTG9vcFxuICAgICAgICBsZXQgYXR0ZW1wdHMgPSAwO1xuICAgICAgICBsZXQgdmlzdWFsVXRpbGl0eSA9IDA7XG5cbiAgICAgICAgd2hpbGUgKGF0dGVtcHRzIDwgMiAmJiB2aXN1YWxVdGlsaXR5IDwgNSkge1xuICAgICAgICAgIGlmICghdmlkZW8uZnJhbWVzIHx8IGF0dGVtcHRzID4gMCkge1xuICAgICAgICAgICAgY29uc3QgcGFnZSA9IGF3YWl0IHRoaXMuY29udGV4dCEubmV3UGFnZSgpO1xuICAgICAgICAgICAgYXdhaXQgcGFnZS5nb3RvKHZpZGVvLnVybCwgeyB3YWl0VW50aWw6ICdsb2FkJywgdGltZW91dDogNDUwMDAgfSk7XG4gICAgICAgICAgICAvLyBTaGlmdCBvZmZzZXQgb24gc2Vjb25kIGF0dGVtcHRcbiAgICAgICAgICAgIHZpZGVvLmZyYW1lcyA9IGF3YWl0IHRoaXMuY2FwdHVyZUZyYW1lcyhwYWdlLCB2aWRlbywgYXR0ZW1wdHMgKiA1KTtcbiAgICAgICAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcbiAgICAgICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHZpZGVvLmZyYW1lcyAmJiAhdmlkZW8uYW5hbHlzaXMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbdjNdIPCflI0gVmVyaWZ5aW5nIHZpc3VhbCB1dGlsaXR5IChBdHRlbXB0ICR7YXR0ZW1wdHMgKyAxfSkuLi5gKTtcbiAgICAgICAgICAgIHZpZGVvLmFuYWx5c2lzID0gKGF3YWl0IHRoaXMuYW5hbHl6ZVdpdGhBSSh2aWRlbykpIHx8IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgdmlzdWFsVXRpbGl0eSA9IHZpZGVvLmFuYWx5c2lzPy52aXN1YWxVdGlsaXR5U2NvcmUgfHwgMDtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbdjNdIPCfk4ogVmlzdWFsIFV0aWxpdHkgU2NvcmU6ICR7dmlzdWFsVXRpbGl0eX0vMTBgKTtcblxuICAgICAgICAgICAgaWYgKHZpc3VhbFV0aWxpdHkgPCA1ICYmIGF0dGVtcHRzIDwgMSkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW3YzXSDwn5SEIExvdyB2aXN1YWwgdXRpbGl0eSBkZXRlY3RlZC4gUmV0cnlpbmcgd2l0aCB0ZW1wb3JhbCBzaGlmdC4uLmApO1xuICAgICAgICAgICAgICBhdHRlbXB0cysrO1xuICAgICAgICAgICAgICB2aWRlby5hbmFseXNpcyA9IHVuZGVmaW5lZDsgLy8gUmVzZXQgZm9yIHJldHJ5XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2aWRlby5hbmFseXNpcykgdGhpcy5zdGF0ZS5zdGF0cy5hbmFseXplZCsrO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgfVxuXG4gICAgICBpZiAodmlkZW8uYW5hbHlzaXMpIHtcbiAgICAgICAgdGhpcy5zYXZlUmVwb3J0KHZpZGVvKTtcbiAgICAgICAgdmlkZW8uc3RhdHVzID0gJ2NvbXBsZXRlZCc7XG4gICAgICAgIHRoaXMuc3RhdGUuc3RhdHMuY29tcGxldGVkKys7XG4gICAgICAgIC8vIFYzOiBQcnVuZSBmcmFtZXMgaW1tZWRpYXRlbHkgYWZ0ZXIgc3VjY2Vzc2Z1bCBhbmFseXNpc1xuICAgICAgICB0aGlzLnBydW5lRnJhbWVzKHZpZGVvKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZpZGVvLnN0YXR1cyA9ICdlcnJvcic7XG4gICAgICAgIHRoaXMuc3RhdGUuc3RhdHMuZXJyb3JzKys7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICByZXR1cm4gdmlkZW8uc3RhdHVzID09PSAnY29tcGxldGVkJztcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFt2M10gRXJyb3I6YCwgZS5tZXNzYWdlKTtcbiAgICAgIHZpZGVvLnN0YXR1cyA9ICdlcnJvcic7XG4gICAgICB0aGlzLnN0YXRlLnN0YXRzLmVycm9ycysrO1xuICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBydW4obGlicmFyeVBhdGg6IHN0cmluZywgc3RhcnRJbmRleDogbnVtYmVyID0gNjkyLCBlbmRJbmRleDogbnVtYmVyID0gNjQ4KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coYPCfmoAgVjMgUGlwZWxpbmU6ICMke3N0YXJ0SW5kZXh9IOKGkiAjJHtlbmRJbmRleH0gfCBNb2RlbDogJHtNVUxUSU1PREFMX01PREVMfWApO1xuICAgIGF3YWl0IHRoaXMuaW5pdGlhbGl6ZSgpO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMobGlicmFyeVBhdGgsICd1dGYtOCcpO1xuICAgIGNvbnN0IHZpZGVvczogVmlkZW9FbnRyeVtdID0gW107XG4gICAgY29uc3Qgcm93UmVnZXggPVxuICAgICAgLzx0cj5cXHMqPHRkW14+XSo+XFxzKihcXGQrKVxccyo8XFwvdGQ+XFxzKjx0ZFtePl0qPlxccyo8YVxccytocmVmPVwiKFteXCJdKylcIltePl0qPihbXjxdKyk8XFwvYT5cXHMqPFxcL3RkPi9nO1xuICAgIGxldCBtYXRjaDtcbiAgICB3aGlsZSAoKG1hdGNoID0gcm93UmVnZXguZXhlYyhjb250ZW50KSkgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gcGFyc2VJbnQobWF0Y2hbMV0pO1xuICAgICAgaWYgKGluZGV4IDw9IHN0YXJ0SW5kZXggJiYgaW5kZXggPj0gZW5kSW5kZXgpIHtcbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLnN0YXRlLnF1ZXVlLmZpbmQoKHYpID0+IHYuaW5kZXggPT09IGluZGV4KTtcbiAgICAgICAgaWYgKGV4aXN0aW5nKSB2aWRlb3MucHVzaChleGlzdGluZyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICB2aWRlb3MucHVzaCh7XG4gICAgICAgICAgICBpbmRleCxcbiAgICAgICAgICAgIHVybDogbWF0Y2hbMl0sXG4gICAgICAgICAgICB0aXRsZTogbWF0Y2hbM10udHJpbSgpLFxuICAgICAgICAgICAgdmlkZW9JZDogdGhpcy5leHRyYWN0VmlkZW9JZChtYXRjaFsyXSkgfHwgJycsXG4gICAgICAgICAgICBzdGF0dXM6ICdwZW5kaW5nJyxcbiAgICAgICAgICAgIHByb2Nlc3NpbmdBdHRlbXB0czogMCxcbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmlkZW9zLnNvcnQoKGEsIGIpID0+IGIuaW5kZXggLSBhLmluZGV4KTtcbiAgICB0aGlzLnN0YXRlLnF1ZXVlID0gdmlkZW9zO1xuICAgIHRoaXMuc3RhdGUuc3RhdHMudG90YWxWaWRlb3MgPSB2aWRlb3MubGVuZ3RoO1xuICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG5cbiAgICBmb3IgKGNvbnN0IHZpZGVvIG9mIHZpZGVvcykge1xuICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50SW5kZXggPSB2aWRlby5pbmRleDtcbiAgICAgIGF3YWl0IHRoaXMucHJvY2Vzc1ZpZGVvKHZpZGVvKTtcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyKSA9PiBzZXRUaW1lb3V0KHIsIDMwMDApKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuY29udGV4dCkgYXdhaXQgdGhpcy5jb250ZXh0LmNsb3NlKCk7XG4gIH1cblxuICBwcml2YXRlIGRvd25sb2FkVHJhbnNjcmlwdFdpdGhZdERscCh1cmw6IHN0cmluZywgdmlkZW9JZDogc3RyaW5nKTogVHJhbnNjcmlwdFNlZ21lbnRbXSB8IG51bGwge1xuICAgIGNvbnN0IHRlbXBEaXIgPSBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKHRoaXMucmVwb3J0c0RpciksICd0ZW1wX3N1YnMnKTtcbiAgICBmcy5ta2RpclN5bmModGVtcERpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgY29uc3Qgb3V0cHV0RmlsZUJhc2UgPSBwYXRoLmpvaW4odGVtcERpciwgdmlkZW9JZCk7XG4gICAgdHJ5IHtcbiAgICAgIGV4ZWNTeW5jKFxuICAgICAgICBgeXQtZGxwIC0td3JpdGUtYXV0by1zdWIgLS13cml0ZS1zdWIgLS1zdWItbGFuZyBlbiAtLXNraXAtZG93bmxvYWQgLS1vdXRwdXQgXCIke291dHB1dEZpbGVCYXNlfVwiIFwiJHt1cmx9XCJgLFxuICAgICAgICB7IHN0ZGlvOiAnaWdub3JlJyB9XG4gICAgICApO1xuICAgICAgY29uc3QgZmlsZXMgPSBmcy5yZWFkZGlyU3luYyh0ZW1wRGlyKTtcbiAgICAgIGNvbnN0IHN1YkZpbGUgPSBmaWxlcy5maW5kKChmKSA9PiBmLnN0YXJ0c1dpdGgodmlkZW9JZCkgJiYgZi5lbmRzV2l0aCgnLnZ0dCcpKTtcbiAgICAgIGlmICghc3ViRmlsZSkgcmV0dXJuIG51bGw7XG4gICAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbih0ZW1wRGlyLCBzdWJGaWxlKSwgJ3V0Zi04Jyk7XG4gICAgICBjb25zdCBzZWdtZW50czogVHJhbnNjcmlwdFNlZ21lbnRbXSA9IFtdO1xuICAgICAgY29uc3QgYmxvY2tzID0gY29udGVudC5zcGxpdCgvXFxuXFxyP1xcbi8pO1xuICAgICAgZm9yIChjb25zdCBibG9jayBvZiBibG9ja3MpIHtcbiAgICAgICAgY29uc3QgdGltZU1hdGNoID0gYmxvY2subWF0Y2goXG4gICAgICAgICAgLyhcXGR7Mn0pOihcXGR7Mn0pOihcXGR7Mn0pXFwuKFxcZHszfSlcXHMtLT5cXHMoXFxkezJ9KTooXFxkezJ9KTooXFxkezJ9KVxcLihcXGR7M30pL1xuICAgICAgICApO1xuICAgICAgICBpZiAodGltZU1hdGNoKSB7XG4gICAgICAgICAgY29uc3QgbGluZXMgPSBibG9jay5zcGxpdCgnXFxuJyk7XG4gICAgICAgICAgY29uc3QgdElkeCA9IGxpbmVzLmZpbmRJbmRleCgobCkgPT4gbC5pbmNsdWRlcygnLS0+JykpO1xuICAgICAgICAgIGlmICh0SWR4ICE9PSAtMSAmJiB0SWR4IDwgbGluZXMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgY29uc3QgdGV4dCA9IGxpbmVzXG4gICAgICAgICAgICAgIC5zbGljZSh0SWR4ICsgMSlcbiAgICAgICAgICAgICAgLmpvaW4oJyAnKVxuICAgICAgICAgICAgICAucmVwbGFjZSgvPFtePl0qPi9nLCAnJylcbiAgICAgICAgICAgICAgLnRyaW0oKTtcbiAgICAgICAgICAgIGlmICh0ZXh0ICYmIHRleHQgIT09ICdhbGlnbjpzdGFydCBwb3NpdGlvbjowJScpIHtcbiAgICAgICAgICAgICAgY29uc3Qgc3RhcnRTZWMgPVxuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFsxXSkgKiAzNjAwICtcbiAgICAgICAgICAgICAgICBwYXJzZUludCh0aW1lTWF0Y2hbMl0pICogNjAgK1xuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFszXSkgK1xuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFs0XSkgLyAxMDAwO1xuICAgICAgICAgICAgICBjb25zdCBlbmRTZWMgPVxuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFs1XSkgKiAzNjAwICtcbiAgICAgICAgICAgICAgICBwYXJzZUludCh0aW1lTWF0Y2hbNl0pICogNjAgK1xuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFs3XSkgK1xuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFs4XSkgLyAxMDAwO1xuICAgICAgICAgICAgICBzZWdtZW50cy5wdXNoKHsgc3RhcnQ6IHN0YXJ0U2VjLCBkdXJhdGlvbjogZW5kU2VjIC0gc3RhcnRTZWMsIHRleHQgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmcy51bmxpbmtTeW5jKHBhdGguam9pbih0ZW1wRGlyLCBzdWJGaWxlKSk7XG4gICAgICByZXR1cm4gc2VnbWVudHM7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG1haW4oKSB7XG4gIGNvbnN0IGFyZ3MgPSBwcm9jZXNzLmFyZ3Yuc2xpY2UoMik7XG4gIGNvbnN0IHN0YXJ0QXJnID0gYXJncy5maW5kKChhKSA9PiBhLnN0YXJ0c1dpdGgoJy0tc3RhcnQ9JykpO1xuICBjb25zdCBlbmRBcmcgPSBhcmdzLmZpbmQoKGEpID0+IGEuc3RhcnRzV2l0aCgnLS1lbmQ9JykpO1xuICBjb25zdCBzdGFydCA9IHN0YXJ0QXJnID8gcGFyc2VJbnQoc3RhcnRBcmcuc3BsaXQoJz0nKVsxXSkgOiA2OTI7XG4gIGNvbnN0IGVuZCA9IGVuZEFyZyA/IHBhcnNlSW50KGVuZEFyZy5zcGxpdCgnPScpWzFdKSA6IDY0ODtcbiAgY29uc3QgbGlicmFyeVBhdGggPSBwcm9jZXNzLmVudi5UTkZfVklERU9fTElCUkFSWSB8fCAnJztcbiAgY29uc3QgaW5nZXN0UHJvY2Vzc29yID0gbmV3IFRyYW5zY3JpcHRQcm9jZXNzb3JWMygpO1xuICBhd2FpdCBpbmdlc3RQcm9jZXNzb3IucnVuKGxpYnJhcnlQYXRoLCBzdGFydCwgZW5kKTtcbn1cblxubWFpbigpLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xuIl19
