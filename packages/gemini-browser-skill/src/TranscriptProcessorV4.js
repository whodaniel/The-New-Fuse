"use strict";
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
const node_child_process_1 = require("node:child_process");
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const process = __importStar(require("node:process"));
const playwright_1 = require("playwright");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const TranscriptProcessorV2_js_1 = require("./TranscriptProcessorV2.js");
// Resolved at runtime so this package works in any checkout.
const TNF_ROOT = process.env.TNF_ROOT || (0, node_path_1.resolve)(__dirname, '..', '..', '..');
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
    constructor(targetPhase = 'analysis') {
        this.context = null;
        this.targetPhase = 'analysis';
        this.googleApiKey = '';
        this.targetPhase = targetPhase;
        const dataDir = TNF_ROOT + '/data';
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
    loadGoogleKey() {
        try {
            // 1. Try process.env first
            if (process.env.GEMINI_API_KEY) {
                this.googleApiKey = process.env.GEMINI_API_KEY;
                console.log('[v4-pro] ✅ Google AI API Key loaded from process environment');
                return;
            }
            // 2. Try ~/.hermes/.env
            const envPath = (0, node_path_1.join)((0, node_os_1.homedir)(), '.hermes', '.env');
            if (fs.existsSync(envPath)) {
                const envContent = fs.readFileSync(envPath, 'utf8');
                const match = envContent.match(/GEMINI_API_KEY=(AIza[A-Za-z0-9\-_]+)/);
                if (match) {
                    this.googleApiKey = match[1];
                    console.log('[v4-pro] ✅ Google AI API Key loaded from ~/.hermes/.env');
                    return;
                }
            }
            // 3. Fallback to project root .env
            const localEnvPath = TNF_ROOT + '/.env';
            if (fs.existsSync(localEnvPath)) {
                const envContent = fs.readFileSync(localEnvPath, 'utf8');
                const match = envContent.match(/GEMINI_API_KEY=(AIza[A-Za-z0-9\-_]+)/);
                if (match) {
                    this.googleApiKey = match[1];
                    console.log('[v4-pro] ✅ Google AI API Key loaded from project .env');
                    return;
                }
            }
        }
        catch (e) { }
    }
    loadState() {
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
        }
        catch (e) {
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
    saveState() {
        if (!this.state || !this.state.queue || this.state.queue.length === 0) {
            console.error('[v4-pro] ❌ Refusing to save empty or invalid state');
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
                ? transcripts.reduce((sum, v) => { var _a; return sum + (((_a = v.transcript) === null || _a === void 0 ? void 0 : _a.length) || 0); }, 0) / transcripts.length
                : 0;
    }
    extractVideoId(url) {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
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
        console.log('[v4-pro] 🚀 Launching Headless Intelligence Bridge...');
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
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 800 },
            ignoreDefaultArgs: ['--enable-automation'],
        });
        console.log('[v4-pro] ✅ Headless Bridge ready');
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
                    }
                    catch (e) { }
                }
            }
            return true;
        }
        catch (error) {
            await this.initialize();
            return true;
        }
    }
    async fetchEnrichedMetadata(video) {
        if (!this.context)
            throw new Error('Browser not initialized');
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
        }
        catch (e) {
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
        if (fb)
            return fb;
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
            if (duration < 10 || duration < lastTs)
                duration = Math.floor(lastTs + 10);
        }
        if (video.transcript) {
            video.transcript.forEach((segment) => {
                const text = segment.text.toLowerCase();
                let weight = 0;
                if (priorityKeywords.some((k) => text.includes(k)))
                    weight = 2;
                else if (supportKeywords.some((k) => text.includes(k)))
                    weight = 1;
                if (weight > 0) {
                    const ts = Math.min(duration, Math.floor(segment.start + 3));
                    const isCluster = weightedHotspots.some((h) => Math.abs(h.ts - ts) < 45);
                    if (!isCluster)
                        weightedHotspots.push({ ts, weight });
                }
            });
        }
        weightedHotspots.sort((a, b) => b.weight - a.weight || a.ts - b.ts);
        const selected = new Set();
        weightedHotspots.slice(0, 6).forEach((h) => selected.add(h.ts));
        selected.add(10);
        if (duration > 60)
            selected.add(Math.floor(duration / 2));
        if (duration > 20)
            selected.add(duration - 10);
        return Array.from(selected)
            .sort((a, b) => a - b)
            .slice(0, 8);
    }
    async captureFrames(page, video, offsetSeconds = 0) {
        console.log(`[v4-pro] 📸 Interrupt-Free Frame Capture for: ${video.title} (Offset: ${offsetSeconds}s)`);
        const frames = [];
        const timestamps = this.getVisualHotspots(video).map((ts) => Math.max(0, ts + offsetSeconds));
        console.log(`[v4-pro] 🎯 Target timestamps: ${timestamps.map((t) => this.formatDuration(t)).join(', ')}`);
        for (const ts of timestamps) {
            try {
                console.log(`[v4-pro] Seeking to ${this.formatDuration(ts)}...`);
                await page.evaluate((t) => {
                    const v = document.querySelector('video');
                    if (v)
                        v.currentTime = t;
                }, ts);
                // Ensure playback is paused so frame is stable
                await page.evaluate(() => { var _a; return (_a = document.querySelector('video')) === null || _a === void 0 ? void 0 : _a.pause(); });
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
            }
            catch (e) {
                console.error(`[v4-pro] Failed to capture frame at ${ts}:`, e);
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
                }
                catch (e) { }
            });
            console.log(`[v4-pro] 🧹 Pruned ${files.length} frames for ${video.videoId}`);
        }
        catch (e) { }
    }
    async analyzeWithAI(video) {
        if (!this.googleApiKey || !video.transcript)
            return null;
        let retries = 2;
        while (retries >= 0) {
            console.log(`[v4-pro] 🧠 Pro Multimodal Thinking (${PRO_MODEL}): ${video.title} (Retries: ${retries})`);
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
                    signal: AbortSignal.timeout(120000),
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
                const jsonMatch = rawResponse.match(/```json\n?([\s\S]*?)\n?```/) || rawResponse.match(/(\{[\s\S]*\})/);
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
                }
                catch (parseError) {
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
            }
            catch (e) {
                console.error(`[v4-pro] ❌ API Failure: ${e.message}`);
                retries--;
                if (retries >= 0)
                    await new Promise((r) => setTimeout(r, 5000));
            }
        }
        return null;
    }
    calculateQualityScore(parsed) {
        let score = 0;
        if (parsed.summary && parsed.summary.length > 50)
            score += 25;
        if (parsed.keyPoints && parsed.keyPoints.length >= 3)
            score += 25;
        if (parsed.aiConcepts && parsed.aiConcepts.length > 0)
            score += 25;
        if (parsed.technicalDetails && parsed.technicalDetails.length > 0)
            score += 25;
        return score;
    }
    saveReport(video) {
        var _a, _b, _c;
        const safeTitle = video.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
        const reportFile = path.join(this.reportsDir, `v2_${video.index}_${safeTitle}_${Date.now()}.md`);
        let content = `# Video Analysis Report\n\n## Metadata\n- **Video**: ${video.title}\n- **Index**: #${video.index}\n- **URL**: ${video.url}\n- **Duration**: ${((_a = video.metadata) === null || _a === void 0 ? void 0 : _a.durationFormatted) || 'Unknown'}\n- **Processed**: ${new Date().toISOString()}\n\n---\n\n## Summary\n${((_b = video.analysis) === null || _b === void 0 ? void 0 : _b.summary) || 'No summary available'}\n`;
        if (((_c = video.analysis) === null || _c === void 0 ? void 0 : _c.visualContextFlags) && video.analysis.visualContextFlags.length > 0) {
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
        // Phase 9: shared Federated ID# helper (see TranscriptProcessorV2).
        const idNumber = (0, TranscriptProcessorV2_js_1.generateFederatedIdNumber)(video.index);
        const compoundingEntry = {
            id: entryId,
            title: video.title,
            category: 'video-analysis',
            content: ((_a = video.analysis) === null || _a === void 0 ? void 0 : _a.summary) || 'No summary',
            visual_intelligence: ((_b = video.analysis) === null || _b === void 0 ? void 0 : _b.visualContextFlags) || [],
            backlinks: [
                ...(((_c = video.analysis) === null || _c === void 0 ? void 0 : _c.aiConcepts) || []),
                ...(((_d = video.analysis) === null || _d === void 0 ? void 0 : _d.technicalDetails) || []),
            ],
            metadata: {
                agentId: 'transcript-processor-v4',
                timestamp: new Date().toISOString(),
                videoId: video.videoId,
                url: video.url,
                qualityScore: ((_e = video.analysis) === null || _e === void 0 ? void 0 : _e.qualityScore) || 0,
                idNumber: idNumber,
            },
        };
        const wikiInboxDir = path.join(path.dirname(this.stateFilePath), 'wiki-inbox');
        fs.mkdirSync(wikiInboxDir, { recursive: true });
        fs.writeFileSync(path.join(wikiInboxDir, `${entryId}.json`), JSON.stringify(compoundingEntry, null, 2));
        const legacyEntry = `\n---\n\n## #${video.index}: ${video.title}\n**URL**: ${video.url}\n**Resource Pointer**: trp://wiki-inbox/${entryId}.json\n\n### Summary\n${((_f = video.analysis) === null || _f === void 0 ? void 0 : _f.summary) || 'No summary'}\n\n### Visual Findings\n${(((_g = video.analysis) === null || _g === void 0 ? void 0 : _g.visualContextFlags) || []).map((f) => `- [${this.formatDuration(f.timestamp)}] ${f.context}`).join('\n') || '- None'}\n\n`;
        fs.appendFileSync(this.knowledgeBaseFile, legacyEntry);
    }
    async processVideo(video) {
        var _a;
        if (video.status === 'completed' || video.status === 'skipped')
            return true;
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
                    const durStr = (0, node_child_process_1.execSync)(`yt-dlp --get-duration ${video.url}`).toString().trim();
                    const parts = durStr.split(':').map(Number);
                    if (parts.length === 2)
                        duration = parts[0] * 60 + parts[1];
                    else if (parts.length === 3)
                        duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
                    if (duration > 0)
                        durationFormatted = durStr;
                }
                catch (e) { }
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
                if (video.transcript)
                    this.state.stats.transcriptsExtracted++;
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
                        console.log(`[v4-pro] 🔍 Verifying visual utility (Attempt ${attempts + 1})...`);
                        video.analysis = (await this.analyzeWithAI(video)) || undefined;
                        visualUtility = ((_a = video.analysis) === null || _a === void 0 ? void 0 : _a.visualUtilityScore) || 0;
                        console.log(`[v4-pro] 📊 Visual Utility Score: ${visualUtility}/10`);
                        if (visualUtility < 5 && attempts < 1) {
                            console.log(`[v4-pro] 🔄 Low visual utility detected. Retrying with temporal shift...`);
                            attempts++;
                            video.analysis = undefined; // Reset for retry
                            continue;
                        }
                    }
                    break;
                }
                if (video.analysis)
                    this.state.stats.analyzed++;
                this.saveState();
            }
            if (video.analysis) {
                this.saveReport(video);
                video.status = 'completed';
                this.state.stats.completed++;
                // V3: Prune frames immediately after successful analysis
                this.pruneFrames(video);
            }
            else {
                video.status = 'error';
                this.state.stats.errors++;
            }
            this.saveState();
            return video.status === 'completed';
        }
        catch (e) {
            console.error(`[v4-pro] Error:`, e.message);
            video.status = 'error';
            this.state.stats.errors++;
            this.saveState();
            return false;
        }
    }
    async run(libraryPath, startIndex = 692, endIndex = 648) {
        console.log(`🚀 V3 Pipeline: #${startIndex} → #${endIndex} | Model: ${PRO_MODEL}`);
        await this.initialize();
        const content = fs.readFileSync(libraryPath, 'utf-8');
        const videos = [];
        const rowRegex = /<tr>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>\s*<\/td>/g;
        let match;
        while ((match = rowRegex.exec(content)) !== null) {
            const index = parseInt(match[1]);
            if (index <= startIndex && index >= endIndex) {
                const existing = this.state.queue.find((v) => v.index === index);
                if (existing)
                    videos.push(existing);
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
        if (this.context)
            await this.context.close();
    }
    downloadTranscriptWithYtDlp(url, videoId) {
        const tempDir = path.join(path.dirname(this.reportsDir), 'temp_subs');
        fs.mkdirSync(tempDir, { recursive: true });
        const outputFileBase = path.join(tempDir, videoId);
        try {
            (0, node_child_process_1.execSync)(`yt-dlp --write-auto-sub --write-sub --sub-lang en --skip-download --output "${outputFileBase}" "${url}"`, { stdio: 'ignore' });
            const files = fs.readdirSync(tempDir);
            const subFile = files.find((f) => f.startsWith(videoId) && f.endsWith('.vtt'));
            if (!subFile)
                return null;
            const content = fs.readFileSync(path.join(tempDir, subFile), 'utf-8');
            const segments = [];
            const blocks = content.split(/\n\r?\n/);
            for (const block of blocks) {
                const timeMatch = block.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s-->\s(\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
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
                            const startSec = parseInt(timeMatch[1]) * 3600 +
                                parseInt(timeMatch[2]) * 60 +
                                parseInt(timeMatch[3]) +
                                parseInt(timeMatch[4]) / 1000;
                            const endSec = parseInt(timeMatch[5]) * 3600 +
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
        }
        catch (e) {
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
    const ingestProcessor = new TranscriptProcessorV4();
    await ingestProcessor.run(libraryPath, start, end);
}
main().catch(console.error);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHJhbnNjcmlwdFByb2Nlc3NvclY0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiVHJhbnNjcmlwdFByb2Nlc3NvclY0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7O0dBU0c7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsMkRBQThDO0FBQzlDLDRDQUE4QjtBQUM5QixnREFBa0M7QUFDbEMsc0RBQXdDO0FBRXhDLDJDQUFzRTtBQUV0RSxxQ0FBa0M7QUFDbEMseUNBQTBDO0FBQzFDLHlFQUF1RTtBQUN2RSw2REFBNkQ7QUFDN0QsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLElBQUksSUFBQSxtQkFBTyxFQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBa0Y5RSxxQkFBcUI7QUFDckIsTUFBTSxTQUFTLEdBQUcsZ0JBQWdCLENBQUM7QUFDbkMsTUFBTSxXQUFXLEdBQUcsa0JBQWtCLENBQUM7QUFDdkMsTUFBTSxjQUFjLEdBQUcseURBQXlELENBQUM7QUFFakYsTUFBTSxlQUFlLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBb0J2QixDQUFDO0FBRUYsTUFBTSxxQkFBcUI7SUFXekIsWUFBWSxjQUFzRCxVQUFVO1FBVnBFLFlBQU8sR0FBMEIsSUFBSSxDQUFDO1FBT3RDLGdCQUFXLEdBQTJDLFVBQVUsQ0FBQztRQUNqRSxpQkFBWSxHQUFXLEVBQUUsQ0FBQztRQUdoQyxJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztRQUMvQixNQUFNLE9BQU8sR0FBRyxRQUFRLEdBQUcsT0FBTyxDQUFDO1FBRW5DLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztRQUNwRSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLGVB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QUFxQixFQUFFLENBQUM7SUFDcEQsTUFBTSxlQUFlLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDckQsQ0FBQztBQUVELElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRyYW5zY3JpcHQgUHJvY2Vzc29yIHY0LXBybyAtIE9tbmktVmlzaW9uIEVkaXRpb25cbiAqXG4gKiBJbXByb3ZlbWVudHMgb3ZlciB2MjpcbiAqIDEuIFVzZXMgbW9vbnNob3RhaS9raW1pLWsyLjYgdmlhIE5WSURJQSBOR0MgQVBJIChNdWx0aW1vZGFsKVxuICogMi4gSW50ZWdyYXRlZCBOYXRpdmUgVmlzaW9uIEJyaWRnZSB2aWEgVE5GIEZvcmdlIChzY3JlZW5jYXAuc28pXG4gKiAzLiBJbnRlbGxpZ2VudCBIaWdoLUZpZGVsaXR5IEhvdHNwb3QgU2VsZWN0aW9uIChDYXBwZWQgYXQgOCBpbWFnZXMpXG4gKiA0LiBBdXRob3JpdGF0aXZlIHl0LWRscCBkdXJhdGlvbiB2ZXJpZmljYXRpb25cbiAqIDUuIFJvYnVzdCBzdGF0ZSBwcm90ZWN0aW9uIHRvIHByZXZlbnQgZmlsZSBjb3JydXB0aW9uXG4gKi9cblxuaW1wb3J0IHsgZXhlY1N5bmMgfSBmcm9tICdub2RlOmNoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgKiBhcyBwcm9jZXNzIGZyb20gJ25vZGU6cHJvY2Vzcyc7XG5cbmltcG9ydCB7IGNocm9taXVtLCB0eXBlIEJyb3dzZXJDb250ZXh0LCB0eXBlIFBhZ2UgfSBmcm9tICdwbGF5d3JpZ2h0JztcblxuaW1wb3J0IHsgaG9tZWRpciB9IGZyb20gJ25vZGU6b3MnO1xuaW1wb3J0IHsgam9pbiwgcmVzb2x2ZSB9IGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBnZW5lcmF0ZUZlZGVyYXRlZElkTnVtYmVyIH0gZnJvbSAnLi9UcmFuc2NyaXB0UHJvY2Vzc29yVjIuanMnO1xuLy8gUmVzb2x2ZWQgYXQgcnVudGltZSBzbyB0aGlzIHBhY2thZ2Ugd29ya3MgaW4gYW55IGNoZWNrb3V0LlxuY29uc3QgVE5GX1JPT1QgPSBwcm9jZXNzLmVudi5UTkZfUk9PVCB8fCByZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJy4uJywgJy4uJyk7XG5cbmludGVyZmFjZSBWaWRlb0VudHJ5IHtcbiAgaW5kZXg6IG51bWJlcjtcbiAgdXJsOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHZpZGVvSWQ6IHN0cmluZztcbiAgbWV0YWRhdGE/OiBWaWRlb01ldGFkYXRhO1xuICB0cmFuc2NyaXB0PzogVHJhbnNjcmlwdFNlZ21lbnRbXTtcbiAgYW5hbHlzaXM/OiBBbmFseXNpc1Jlc3VsdDtcbiAgZnJhbWVzPzogc3RyaW5nW107IC8vIEJhc2U2NCBlbmNvZGVkIEpQRUcgZnJhbWVzXG4gIHN0YXR1czpcbiAgICB8ICdwZW5kaW5nJ1xuICAgIHwgJ21ldGFkYXRhJ1xuICAgIHwgJ3RyYW5zY3JpcHQnXG4gICAgfCAnYW5hbHl6ZWQnXG4gICAgfCAnbmVlZHNfdmlzdWFsJ1xuICAgIHwgJ2NvbXBsZXRlZCdcbiAgICB8ICdza2lwcGVkJ1xuICAgIHwgJ2Vycm9yJztcbiAgcHJvY2Vzc2luZ0F0dGVtcHRzOiBudW1iZXI7XG4gIGxhc3RQcm9jZXNzZWQ/OiBzdHJpbmc7XG4gIGVycm9yPzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgVmlkZW9NZXRhZGF0YSB7XG4gIGR1cmF0aW9uOiBudW1iZXI7XG4gIGR1cmF0aW9uRm9ybWF0dGVkOiBzdHJpbmc7XG4gIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICBjaGFubmVsPzogc3RyaW5nO1xuICBwdWJsaXNoRGF0ZT86IHN0cmluZztcbiAgdmlld0NvdW50Pzogc3RyaW5nO1xuICBjYXRlZ29yeT86IHN0cmluZztcbiAgdGFncz86IHN0cmluZ1tdO1xuICBzdW1tYXJ5Pzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgVHJhbnNjcmlwdFNlZ21lbnQge1xuICBzdGFydDogbnVtYmVyO1xuICBkdXJhdGlvbjogbnVtYmVyO1xuICB0ZXh0OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBBbmFseXNpc1Jlc3VsdCB7XG4gIGtleVBvaW50czogc3RyaW5nW107XG4gIGFpQ29uY2VwdHM6IHN0cmluZ1tdO1xuICB0ZWNobmljYWxEZXRhaWxzOiBzdHJpbmdbXTtcbiAgdmlzdWFsQ29udGV4dEZsYWdzOiBWaXN1YWxDb250ZXh0RmxhZ1tdO1xuICBzdW1tYXJ5OiBzdHJpbmc7XG4gIHZpc3VhbFV0aWxpdHlTY29yZTogbnVtYmVyO1xuICBxdWFsaXR5U2NvcmU/OiBudW1iZXI7XG4gIHJhd1Jlc3BvbnNlPzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgVmlzdWFsQ29udGV4dEZsYWcge1xuICB0aW1lc3RhbXA6IG51bWJlcjtcbiAgcmVhc29uOiBzdHJpbmc7XG4gIGNvbnRleHQ6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFByb2Nlc3NpbmdTdGF0ZSB7XG4gIHZlcnNpb246IHN0cmluZztcbiAgcXVldWU6IFZpZGVvRW50cnlbXTtcbiAgY3VycmVudEluZGV4OiBudW1iZXI7XG4gIHN0YXJ0ZWRBdDogc3RyaW5nO1xuICBsYXN0VXBkYXRlZDogc3RyaW5nO1xuICBzdGF0czogUHJvY2Vzc2luZ1N0YXRzO1xufVxuXG5pbnRlcmZhY2UgUHJvY2Vzc2luZ1N0YXRzIHtcbiAgdG90YWxWaWRlb3M6IG51bWJlcjtcbiAgbWV0YWRhdGFDb21wbGV0ZTogbnVtYmVyO1xuICB0cmFuc2NyaXB0c0V4dHJhY3RlZDogbnVtYmVyO1xuICBhbmFseXplZDogbnVtYmVyO1xuICBuZWVkc1Zpc3VhbFJldmlldzogbnVtYmVyO1xuICBjb21wbGV0ZWQ6IG51bWJlcjtcbiAgc2tpcHBlZDogbnVtYmVyO1xuICBlcnJvcnM6IG51bWJlcjtcbiAgYW5hbHlzaXNTdWNjZXNzUmF0ZTogbnVtYmVyO1xuICBhdmVyYWdlVHJhbnNjcmlwdExlbmd0aDogbnVtYmVyO1xufVxuXG4vLyBNb2RlbCAmIEFQSSBDb25maWdcbmNvbnN0IFBST19NT0RFTCA9ICdnZW1pbmktMi41LXBybyc7XG5jb25zdCBGTEFTSF9NT0RFTCA9ICdnZW1pbmktMi41LWZsYXNoJztcbmNvbnN0IEdFTUlOSV9BUElfVVJMID0gJ2h0dHBzOi8vZ2VuZXJhdGl2ZWxhbmd1YWdlLmdvb2dsZWFwaXMuY29tL3YxYmV0YS9tb2RlbHMnO1xuXG5jb25zdCBBTkFMWVNJU19QUk9NUFQgPSBgWW91IGFyZSBhIHRlY2huaWNhbCBkYXRhIGV4dHJhY3Rpb24gbWVjaGFuaXNtLiBZb3UgYXJlIGFuYWx5emluZyBhINGC0LXRhdC90LjRh9C10YHQutC40LkgWW91VHViZSB2aWRlbyB1c2luZyBpdHMgdHJhbnNjcmlwdCBhbmQga2V5IHZpc3VhbCBmcmFtZXMuXG5cbllvdXIgZ29hbCBpcyB0byBleHRyYWN0IG1hY2hpbmUtYWN0aW9uYWJsZSBpbnRlbGxpZ2VuY2UuIFxuXG5SRVFVSVJFRCBPVVRQVVQgRk9STUFUOlxuWW91IE1VU1QgcmV0dXJuIE9OTFkgYSB2YWxpZCBKU09OIG9iamVjdC4gRG8gbm90IGluY2x1ZGUgYW55IGNvbnZlcnNhdGlvbmFsIGZpbGxlciBvciBib2xkIHRleHQgb3V0c2lkZSB0aGUgSlNPTi5cblxue1xuICBcInJlYXNvbmluZ0NoYWluXCI6IFwiRGV0YWlsZWQgdGVjaG5pY2FsIHJlYXNvbmluZyBhYm91dCB0aGUgdmlzdWFsIGRpYWdyYW1zIGFuZCB0cmFuc2NyaXB0Li4uXCIsXG4gIFwic3VtbWFyeVwiOiBcIkNvbmNpc2UgdGVjaG5pY2FsIHN1bW1hcnlcIixcbiAgXCJ2aXN1YWxVdGlsaXR5U2NvcmVcIjogOCxcbiAgXCJrZXlQb2ludHNcIjogW1wiUG9pbnQgMVwiLCBcIlBvaW50IDJcIiwgLi4uXSxcbiAgXCJhaUNvbmNlcHRzXCI6IFtcIkNvbmNlcHQgMVwiLCBcIkNvbmNlcHQgMlwiLCAuLi5dLFxuICBcInRlY2huaWNhbERldGFpbHNcIjogW1wiRGV0YWlsZWQgaW1wbGVtZW50YXRpb24gb3IgdG9vbCBpbmZvXCIsIC4uLl0sXG4gIFwidmlzdWFsQ29udGV4dEZsYWdzXCI6IFtcbiAgICB7XCJ0aW1lc3RhbXBcIjogMTIwLCBcInJlYXNvblwiOiBcIlJlYXNvbiBmb3IgZmxhZ2dpbmdcIiwgXCJjb250ZXh0XCI6IFwiVmlzaWJsZSBkZXRhaWxzIGZyb20gZnJhbWVcIn1cbiAgXVxufVxuXG5UUkFOU0NSSVBUIFNFR01FTlQ6XG5gO1xuXG5jbGFzcyBUcmFuc2NyaXB0UHJvY2Vzc29yVjQge1xuICBwcml2YXRlIGNvbnRleHQ6IEJyb3dzZXJDb250ZXh0IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc3RhdGU6IFByb2Nlc3NpbmdTdGF0ZTtcbiAgcHJpdmF0ZSBzdGF0ZUZpbGVQYXRoOiBzdHJpbmc7XG4gIHByaXZhdGUgcmVwb3J0c0Rpcjogc3RyaW5nO1xuICBwcml2YXRlIHRyYW5zY3JpcHRzRGlyOiBzdHJpbmc7XG4gIHByaXZhdGUgZnJhbWVzRGlyOiBzdHJpbmc7XG4gIHByaXZhdGUga25vd2xlZGdlQmFzZUZpbGU6IHN0cmluZztcbiAgcHJpdmF0ZSB0YXJnZXRQaGFzZTogJ21ldGFkYXRhJyB8ICd0cmFuc2NyaXB0JyB8ICdhbmFseXNpcycgPSAnYW5hbHlzaXMnO1xuICBwcml2YXRlIGdvb2dsZUFwaUtleTogc3RyaW5nID0gJyc7XG5cbiAgY29uc3RydWN0b3IodGFyZ2V0UGhhc2U6ICdtZXRhZGF0YScgfCAndHJhbnNjcmlwdCcgfCAnYW5hbHlzaXMnID0gJ2FuYWx5c2lzJykge1xuICAgIHRoaXMudGFyZ2V0UGhhc2UgPSB0YXJnZXRQaGFzZTtcbiAgICBjb25zdCBkYXRhRGlyID0gVE5GX1JPT1QgKyAnL2RhdGEnO1xuXG4gICAgdGhpcy5zdGF0ZUZpbGVQYXRoID0gcGF0aC5qb2luKGRhdGFEaXIsICd0cmFuc2NyaXB0LXYyLXN0YXRlLmpzb24nKTtcbiAgICB0aGlzLnJlcG9ydHNEaXIgPSBwYXRoLmpvaW4oZGF0YURpciwgJ3ZpZGVvLXJlcG9ydHMnKTtcbiAgICB0aGlzLnRyYW5zY3JpcHRzRGlyID0gcGF0aC5qb2luKGRhdGFEaXIsICd2aWRlby10cmFuc2NyaXB0cycpO1xuICAgIHRoaXMuZnJhbWVzRGlyID0gcGF0aC5qb2luKGRhdGFEaXIsICd2aWRlby1mcmFtZXMnKTtcbiAgICB0aGlzLmtub3dsZWRnZUJhc2VGaWxlID0gcGF0aC5qb2luKGRhdGFEaXIsICdBSV9Lbm93bGVkZ2VfQmFzZS5tZCcpO1xuXG4gICAgY29uc29sZS5sb2coYFt2NC1wcm9dIFVzaW5nIGRhdGEgZGlyZWN0b3J5OiAke2RhdGFEaXJ9YCk7XG5cbiAgICBmcy5ta2RpclN5bmModGhpcy5yZXBvcnRzRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBmcy5ta2RpclN5bmModGhpcy50cmFuc2NyaXB0c0RpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgZnMubWtkaXJTeW5jKHRoaXMuZnJhbWVzRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBmcy5ta2RpclN5bmMocGF0aC5qb2luKGRhdGFEaXIsICd0ZW1wX3N1YnMnKSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG5cbiAgICB0aGlzLnN0YXRlID0gdGhpcy5sb2FkU3RhdGUoKTtcbiAgICB0aGlzLmxvYWRHb29nbGVLZXkoKTtcbiAgfVxuXG4gIHByaXZhdGUgbG9hZEdvb2dsZUtleSgpOiB2b2lkIHtcbiAgICB0cnkge1xuICAgICAgLy8gMS4gVHJ5IHByb2Nlc3MuZW52IGZpcnN0XG4gICAgICBpZiAocHJvY2Vzcy5lbnYuR0VNSU5JX0FQSV9LRVkpIHtcbiAgICAgICAgdGhpcy5nb29nbGVBcGlLZXkgPSBwcm9jZXNzLmVudi5HRU1JTklfQVBJX0tFWTtcbiAgICAgICAgY29uc29sZS5sb2coJ1t2NC1wcm9dIOKchSBHb29nbGUgQUkgQVBJIEtleSBsb2FkZWQgZnJvbSBwcm9jZXNzIGVudmlyb25tZW50Jyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gMi4gVHJ5IH4vLmhlcm1lcy8uZW52XG4gICAgICBjb25zdCBlbnZQYXRoID0gam9pbihob21lZGlyKCksICcuaGVybWVzJywgJy5lbnYnKTtcbiAgICAgIGlmIChmcy5leGlzdHNTeW5jKGVudlBhdGgpKSB7XG4gICAgICAgIGNvbnN0IGVudkNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoZW52UGF0aCwgJ3V0ZjgnKTtcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBlbnZDb250ZW50Lm1hdGNoKC9HRU1JTklfQVBJX0tFWT0oQUl6YVtBLVphLXowLTlcXC1fXSspLyk7XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgIHRoaXMuZ29vZ2xlQXBpS2V5ID0gbWF0Y2hbMV07XG4gICAgICAgICAgY29uc29sZS5sb2coJ1t2NC1wcm9dIOKchSBHb29nbGUgQUkgQVBJIEtleSBsb2FkZWQgZnJvbSB+Ly5oZXJtZXMvLmVudicpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyAzLiBGYWxsYmFjayB0byBwcm9qZWN0IHJvb3QgLmVudlxuICAgICAgY29uc3QgbG9jYWxFbnZQYXRoID0gVE5GX1JPT1QgKyAnLy5lbnYnO1xuICAgICAgaWYgKGZzLmV4aXN0c1N5bmMobG9jYWxFbnZQYXRoKSkge1xuICAgICAgICBjb25zdCBlbnZDb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGxvY2FsRW52UGF0aCwgJ3V0ZjgnKTtcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBlbnZDb250ZW50Lm1hdGNoKC9HRU1JTklfQVBJX0tFWT0oQUl6YVtBLVphLXowLTlcXC1fXSspLyk7XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgIHRoaXMuZ29vZ2xlQXBpS2V5ID0gbWF0Y2hbMV07XG4gICAgICAgICAgY29uc29sZS5sb2coJ1t2NC1wcm9dIOKchSBHb29nbGUgQUkgQVBJIEtleSBsb2FkZWQgZnJvbSBwcm9qZWN0IC5lbnYnKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7fVxuICB9XG5cbiAgcHJpdmF0ZSBsb2FkU3RhdGUoKTogUHJvY2Vzc2luZ1N0YXRlIHtcbiAgICB0cnkge1xuICAgICAgaWYgKGZzLmV4aXN0c1N5bmModGhpcy5zdGF0ZUZpbGVQYXRoKSkge1xuICAgICAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHRoaXMuc3RhdGVGaWxlUGF0aCwgJ3V0Zi04Jyk7XG4gICAgICAgIGlmIChjb250ZW50Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBjb25zdCBzdGF0ZSA9IEpTT04ucGFyc2UoY29udGVudCk7XG4gICAgICAgICAgaWYgKHN0YXRlLnZlcnNpb24gIT09ICczLjAnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW3Y0LXByb10gTWlncmF0aW5nIHN0YXRlIHRvIHY0LXBybyBmb3JtYXQuLi4nKTtcbiAgICAgICAgICAgIHN0YXRlLnZlcnNpb24gPSAnMy4wJztcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5sb2coJ1t2NC1wcm9dIOKaoO+4jyBTdGF0ZSBsb2FkIGVycm9yLCBjcmVhdGluZyBmcmVzaCBzdGF0ZScpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgdmVyc2lvbjogJzMuMCcsXG4gICAgICBxdWV1ZTogW10sXG4gICAgICBjdXJyZW50SW5kZXg6IDAsXG4gICAgICBzdGFydGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIGxhc3RVcGRhdGVkOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICBzdGF0czoge1xuICAgICAgICB0b3RhbFZpZGVvczogMCxcbiAgICAgICAgbWV0YWRhdGFDb21wbGV0ZTogMCxcbiAgICAgICAgdHJhbnNjcmlwdHNFeHRyYWN0ZWQ6IDAsXG4gICAgICAgIGFuYWx5emVkOiAwLFxuICAgICAgICBuZWVkc1Zpc3VhbFJldmlldzogMCxcbiAgICAgICAgY29tcGxldGVkOiAwLFxuICAgICAgICBza2lwcGVkOiAwLFxuICAgICAgICBlcnJvcnM6IDAsXG4gICAgICAgIGFuYWx5c2lzU3VjY2Vzc1JhdGU6IDAsXG4gICAgICAgIGF2ZXJhZ2VUcmFuc2NyaXB0TGVuZ3RoOiAwLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBzYXZlU3RhdGUoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnN0YXRlIHx8ICF0aGlzLnN0YXRlLnF1ZXVlIHx8IHRoaXMuc3RhdGUucXVldWUubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbdjQtcHJvXSDinYwgUmVmdXNpbmcgdG8gc2F2ZSBlbXB0eSBvciBpbnZhbGlkIHN0YXRlJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc3RhdGUubGFzdFVwZGF0ZWQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgdGhpcy51cGRhdGVTdGF0cygpO1xuICAgIGZzLm1rZGlyU3luYyhwYXRoLmRpcm5hbWUodGhpcy5zdGF0ZUZpbGVQYXRoKSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgZnMud3JpdGVGaWxlU3luYyh0aGlzLnN0YXRlRmlsZVBhdGgsIEpTT04uc3RyaW5naWZ5KHRoaXMuc3RhdGUsIG51bGwsIDIpKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlU3RhdHMoKTogdm9pZCB7XG4gICAgY29uc3QgcyA9IHRoaXMuc3RhdGUuc3RhdHM7XG4gICAgY29uc3QgYW5hbHl6ZWQgPSB0aGlzLnN0YXRlLnF1ZXVlLmZpbHRlcigodikgPT4gdi5hbmFseXNpcykubGVuZ3RoO1xuICAgIGNvbnN0IGF0dGVtcHRlZCA9IHRoaXMuc3RhdGUucXVldWUuZmlsdGVyKCh2KSA9PiB2LnByb2Nlc3NpbmdBdHRlbXB0cyA+IDApLmxlbmd0aDtcbiAgICBzLmFuYWx5c2lzU3VjY2Vzc1JhdGUgPSBhdHRlbXB0ZWQgPiAwID8gKGFuYWx5emVkIC8gYXR0ZW1wdGVkKSAqIDEwMCA6IDA7XG4gICAgY29uc3QgdHJhbnNjcmlwdHMgPSB0aGlzLnN0YXRlLnF1ZXVlLmZpbHRlcigodikgPT4gdi50cmFuc2NyaXB0KTtcbiAgICBzLmF2ZXJhZ2VUcmFuc2NyaXB0TGVuZ3RoID1cbiAgICAgIHRyYW5zY3JpcHRzLmxlbmd0aCA+IDBcbiAgICAgICAgPyB0cmFuc2NyaXB0cy5yZWR1Y2UoKHN1bSwgdikgPT4gc3VtICsgKHYudHJhbnNjcmlwdD8ubGVuZ3RoIHx8IDApLCAwKSAvIHRyYW5zY3JpcHRzLmxlbmd0aFxuICAgICAgICA6IDA7XG4gIH1cblxuICBwcml2YXRlIGV4dHJhY3RWaWRlb0lkKHVybDogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgY29uc3QgbWF0Y2ggPSB1cmwubWF0Y2goXG4gICAgICAvKD86eW91dHViZVxcLmNvbVxcL3dhdGNoXFw/dj18eW91dHVcXC5iZVxcL3x5b3V0dWJlXFwuY29tXFwvZW1iZWRcXC8pKFteJlxccz9dKykvXG4gICAgKTtcbiAgICByZXR1cm4gbWF0Y2ggPyBtYXRjaFsxXSA6IG51bGw7XG4gIH1cblxuICBmb3JtYXREdXJhdGlvbihzZWNvbmRzOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIGNvbnN0IGhvdXJzID0gTWF0aC5mbG9vcihzZWNvbmRzIC8gMzYwMCk7XG4gICAgY29uc3QgbWludXRlcyA9IE1hdGguZmxvb3IoKHNlY29uZHMgJSAzNjAwKSAvIDYwKTtcbiAgICBjb25zdCBzZWNzID0gTWF0aC5mbG9vcihzZWNvbmRzICUgNjApO1xuICAgIHJldHVybiBob3VycyA+IDBcbiAgICAgID8gYCR7aG91cnN9OiR7bWludXRlcy50b1N0cmluZygpLnBhZFN0YXJ0KDIsICcwJyl9OiR7c2Vjcy50b1N0cmluZygpLnBhZFN0YXJ0KDIsICcwJyl9YFxuICAgICAgOiBgJHttaW51dGVzfToke3NlY3MudG9TdHJpbmcoKS5wYWRTdGFydCgyLCAnMCcpfWA7XG4gIH1cblxuICBkZWNvZGVIdG1sRW50aXRpZXModGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGV4dFxuICAgICAgLnJlcGxhY2UoLyZhbXA7L2csICcmJylcbiAgICAgIC5yZXBsYWNlKC8mbHQ7L2csICc8JylcbiAgICAgIC5yZXBsYWNlKC8mZ3Q7L2csICc+JylcbiAgICAgIC5yZXBsYWNlKC8mcXVvdDsvZywgJ1wiJylcbiAgICAgIC5yZXBsYWNlKC8mIzM5Oy9nLCBcIidcIik7XG4gIH1cblxuICBhc3luYyBpbml0aWFsaXplKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHByb2ZpbGVEaXIgPSBwYXRoLmpvaW4ocHJvY2Vzcy5lbnYuSE9NRSB8fCAnL3RtcCcsICcudmlkZW8tcHJvY2Vzc29yLWNocm9tZS1jbGVhbicpO1xuICAgIGNvbnNvbGUubG9nKCdbdjQtcHJvXSDwn5qAIExhdW5jaGluZyBIZWFkbGVzcyBJbnRlbGxpZ2VuY2UgQnJpZGdlLi4uJyk7XG4gICAgZnMubWtkaXJTeW5jKHByb2ZpbGVEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIHRoaXMuY29udGV4dCA9IGF3YWl0IGNocm9taXVtLmxhdW5jaFBlcnNpc3RlbnRDb250ZXh0KHByb2ZpbGVEaXIsIHtcbiAgICAgIGhlYWRsZXNzOiB0cnVlLCAvLyBWMyBVcGdyYWRlOiBUcnVseSBoZWFkbGVzcyB0byBwcmV2ZW50IGZvY3VzIHN0ZWFsaW5nXG4gICAgICBhcmdzOiBbXG4gICAgICAgICctLW5vLWZpcnN0LXJ1bicsXG4gICAgICAgICctLW5vLWRlZmF1bHQtYnJvd3Nlci1jaGVjaycsXG4gICAgICAgICctLWRpc2FibGUtYmxpbmstZmVhdHVyZXM9QXV0b21hdGlvbkNvbnRyb2xsZWQnLFxuICAgICAgICAnLS13aW5kb3ctc2l6ZT0xMjgwLDgwMCcsXG4gICAgICAgICctLW11dGUtYXVkaW8nLFxuICAgICAgICAnLS1hdXRvcGxheS1wb2xpY3k9bm8tdXNlci1nZXN0dXJlLXJlcXVpcmVkJyxcbiAgICAgIF0sXG4gICAgICB1c2VyQWdlbnQ6XG4gICAgICAgICdNb3ppbGxhLzUuMCAoTWFjaW50b3NoOyBJbnRlbCBNYWMgT1MgWCAxMF8xNV83KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIyLjAuMC4wIFNhZmFyaS81MzcuMzYnLFxuICAgICAgdmlld3BvcnQ6IHsgd2lkdGg6IDEyODAsIGhlaWdodDogODAwIH0sXG4gICAgICBpZ25vcmVEZWZhdWx0QXJnczogWyctLWVuYWJsZS1hdXRvbWF0aW9uJ10sXG4gICAgfSk7XG4gICAgY29uc29sZS5sb2coJ1t2NC1wcm9dIOKchSBIZWFkbGVzcyBCcmlkZ2UgcmVhZHknKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZW5zdXJlQnJvd3NlckhlYWx0aCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgaWYgKCF0aGlzLmNvbnRleHQpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5pbml0aWFsaXplKCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgcGFnZXMgPSBhd2FpdCB0aGlzLmNvbnRleHQucGFnZXMoKTtcbiAgICAgIGlmIChwYWdlcy5sZW5ndGggPiAzMCkge1xuICAgICAgICBmb3IgKGNvbnN0IHBhZ2Ugb2YgcGFnZXMpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBhd2FpdCB0aGlzLmluaXRpYWxpemUoKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGZldGNoRW5yaWNoZWRNZXRhZGF0YSh2aWRlbzogVmlkZW9FbnRyeSk6IFByb21pc2U8VmlkZW9NZXRhZGF0YSB8IG51bGw+IHtcbiAgICBpZiAoIXRoaXMuY29udGV4dCkgdGhyb3cgbmV3IEVycm9yKCdCcm93c2VyIG5vdCBpbml0aWFsaXplZCcpO1xuICAgIGNvbnNvbGUubG9nKGBbdjJdIPCfk4ogRW5yaWNoZWQgbWV0YWRhdGEgZmV0Y2g6ICR7dmlkZW8udGl0bGV9YCk7XG4gICAgY29uc3QgcGFnZSA9IGF3YWl0IHRoaXMuY29udGV4dC5uZXdQYWdlKCk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHF1ZXJ5ID0gYFlvdVR1YmUgdmlkZW8gXCIke3ZpZGVvLnVybH1cIiBjb21wbGV0ZSBpbmZvcm1hdGlvbjogZHVyYXRpb24sIGNoYW5uZWwsIGRlc2NyaXB0aW9uLCB2aWV3cywgcHVibGlzaCBkYXRlLCB0b3BpY3MsIHN1bW1hcnlgO1xuICAgICAgY29uc3Qgc2VhcmNoVXJsID0gYGh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vc2VhcmNoP3E9JHtlbmNvZGVVUklDb21wb25lbnQocXVlcnkpfSZ1ZG09NTBgO1xuICAgICAgYXdhaXQgcGFnZS5nb3RvKHNlYXJjaFVybCwgeyB3YWl0VW50aWw6ICdkb21jb250ZW50bG9hZGVkJywgdGltZW91dDogMzAwMDAgfSk7XG4gICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDQwMDApO1xuICAgICAgY29uc3QgcGFnZVRleHQgPSBhd2FpdCBwYWdlLmV2YWx1YXRlKCgpID0+IGRvY3VtZW50LmJvZHkuaW5uZXJUZXh0KTtcblxuICAgICAgbGV0IGR1cmF0aW9uID0gMDtcbiAgICAgIGNvbnN0IGR1cmF0aW9uTWF0Y2ggPSBwYWdlVGV4dC5tYXRjaCgvKFxcZCspXFxzKm1pbnV0ZXM/XFxzKiw/XFxzKihcXGQrKT9cXHMqc2Vjb25kcz8vaSk7XG4gICAgICBpZiAoZHVyYXRpb25NYXRjaClcbiAgICAgICAgZHVyYXRpb24gPSBwYXJzZUludChkdXJhdGlvbk1hdGNoWzFdKSAqIDYwICsgcGFyc2VJbnQoZHVyYXRpb25NYXRjaFsyXSB8fCAnMCcpO1xuXG4gICAgICBjb25zdCBtZXRhZGF0YTogVmlkZW9NZXRhZGF0YSA9IHtcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICAgIGR1cmF0aW9uRm9ybWF0dGVkOiB0aGlzLmZvcm1hdER1cmF0aW9uKGR1cmF0aW9uKSxcbiAgICAgICAgY2hhbm5lbDogJ1Vua25vd24nLFxuICAgICAgICB2aWV3Q291bnQ6ICdVbmtub3duJyxcbiAgICAgICAgcHVibGlzaERhdGU6ICdVbmtub3duJyxcbiAgICAgIH07XG4gICAgICBhd2FpdCBwYWdlLmNsb3NlKCk7XG4gICAgICByZXR1cm4gbWV0YWRhdGE7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZXh0cmFjdFRyYW5zY3JpcHREaXJlY3QodmlkZW86IFZpZGVvRW50cnkpOiBQcm9taXNlPFRyYW5zY3JpcHRTZWdtZW50W10gfCBudWxsPiB7XG4gICAgY29uc3Qgc2FmZVRpdGxlID0gdmlkZW8udGl0bGUucmVwbGFjZSgvW15hLXpBLVowLTldL2csICdfJykuc3Vic3RyaW5nKDAsIDUwKTtcbiAgICBjb25zdCB0cmFuc2NyaXB0RmlsZSA9IHBhdGguam9pbih0aGlzLnRyYW5zY3JpcHRzRGlyLCBgJHt2aWRlby5pbmRleH1fJHtzYWZlVGl0bGV9LnR4dGApO1xuXG4gICAgaWYgKGZzLmV4aXN0c1N5bmModHJhbnNjcmlwdEZpbGUpKSB7XG4gICAgICBjb25zb2xlLmxvZyhgW3YyXSDinIUgVXNpbmcgZXhpc3RpbmcgdHJhbnNjcmlwdCBmaWxlOiAke3BhdGguYmFzZW5hbWUodHJhbnNjcmlwdEZpbGUpfWApO1xuICAgICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyh0cmFuc2NyaXB0RmlsZSwgJ3V0ZjgnKTtcbiAgICAgIHJldHVybiBjb250ZW50XG4gICAgICAgIC5zcGxpdCgnXFxuJylcbiAgICAgICAgLmZpbHRlcigobCkgPT4gbC50cmltKCkpXG4gICAgICAgIC5tYXAoKGxpbmUsIGkpID0+ICh7XG4gICAgICAgICAgc3RhcnQ6IGkgKiA1LFxuICAgICAgICAgIGR1cmF0aW9uOiA1LFxuICAgICAgICAgIHRleHQ6IGxpbmUucmVwbGFjZSgvXlxcWy4qP1xcXVxccyovLCAnJykudHJpbSgpLFxuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgY29uc3QgZmIgPSB0aGlzLmRvd25sb2FkVHJhbnNjcmlwdFdpdGhZdERscCh2aWRlby51cmwsIHZpZGVvLnZpZGVvSWQpO1xuICAgIGlmIChmYikgcmV0dXJuIGZiO1xuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcml2YXRlIGdldFZpc3VhbEhvdHNwb3RzKHZpZGVvOiBWaWRlb0VudHJ5KTogbnVtYmVyW10ge1xuICAgIGNvbnN0IHByaW9yaXR5S2V5d29yZHMgPSBbXG4gICAgICAnZGlhZ3JhbScsXG4gICAgICAnYXJjaGl0ZWN0dXJlJyxcbiAgICAgICdncmFwaCcsXG4gICAgICAnZmxvdycsXG4gICAgICAnZGVtbycsXG4gICAgICAnY29kZScsXG4gICAgICAnc25pcHBldCcsXG4gICAgICAnc3RydWN0dXJlJyxcbiAgICAgICdkYXNoYm9hcmQnLFxuICAgICAgJ2ludGVyZmFjZScsXG4gICAgXTtcbiAgICBjb25zdCBzdXBwb3J0S2V5d29yZHMgPSBbXG4gICAgICAnbG9vayBhdCcsXG4gICAgICAnc2hvd2luZycsXG4gICAgICAnc2NyZWVuJyxcbiAgICAgICdzbGlkZScsXG4gICAgICAnZmlndXJlJyxcbiAgICAgICdmcmFtZXdvcmsnLFxuICAgICAgJ2NoYXJ0JyxcbiAgICAgICdwaXBlbGluZScsXG4gICAgICAnY29udGV4dCcsXG4gICAgXTtcblxuICAgIGNvbnN0IHdlaWdodGVkSG90c3BvdHM6IHsgdHM6IG51bWJlcjsgd2VpZ2h0OiBudW1iZXIgfVtdID0gW107XG4gICAgbGV0IGR1cmF0aW9uID0gdmlkZW8ubWV0YWRhdGE/LmR1cmF0aW9uIHx8IDA7XG5cbiAgICBpZiAodmlkZW8udHJhbnNjcmlwdCAmJiB2aWRlby50cmFuc2NyaXB0Lmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGxhc3RUcyA9IHZpZGVvLnRyYW5zY3JpcHRbdmlkZW8udHJhbnNjcmlwdC5sZW5ndGggLSAxXS5zdGFydDtcbiAgICAgIGlmIChkdXJhdGlvbiA8IDEwIHx8IGR1cmF0aW9uIDwgbGFzdFRzKSBkdXJhdGlvbiA9IE1hdGguZmxvb3IobGFzdFRzICsgMTApO1xuICAgIH1cblxuICAgIGlmICh2aWRlby50cmFuc2NyaXB0KSB7XG4gICAgICB2aWRlby50cmFuc2NyaXB0LmZvckVhY2goKHNlZ21lbnQpID0+IHtcbiAgICAgICAgY29uc3QgdGV4dCA9IHNlZ21lbnQudGV4dC50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBsZXQgd2VpZ2h0ID0gMDtcbiAgICAgICAgaWYgKHByaW9yaXR5S2V5d29yZHMuc29tZSgoaykgPT4gdGV4dC5pbmNsdWRlcyhrKSkpIHdlaWdodCA9IDI7XG4gICAgICAgIGVsc2UgaWYgKHN1cHBvcnRLZXl3b3Jkcy5zb21lKChrKSA9PiB0ZXh0LmluY2x1ZGVzKGspKSkgd2VpZ2h0ID0gMTtcbiAgICAgICAgaWYgKHdlaWdodCA+IDApIHtcbiAgICAgICAgICBjb25zdCB0cyA9IE1hdGgubWluKGR1cmF0aW9uLCBNYXRoLmZsb29yKHNlZ21lbnQuc3RhcnQgKyAzKSk7XG4gICAgICAgICAgY29uc3QgaXNDbHVzdGVyID0gd2VpZ2h0ZWRIb3RzcG90cy5zb21lKChoKSA9PiBNYXRoLmFicyhoLnRzIC0gdHMpIDwgNDUpO1xuICAgICAgICAgIGlmICghaXNDbHVzdGVyKSB3ZWlnaHRlZEhvdHNwb3RzLnB1c2goeyB0cywgd2VpZ2h0IH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB3ZWlnaHRlZEhvdHNwb3RzLnNvcnQoKGEsIGIpID0+IGIud2VpZ2h0IC0gYS53ZWlnaHQgfHwgYS50cyAtIGIudHMpO1xuICAgIGNvbnN0IHNlbGVjdGVkID0gbmV3IFNldDxudW1iZXI+KCk7XG4gICAgd2VpZ2h0ZWRIb3RzcG90cy5zbGljZSgwLCA2KS5mb3JFYWNoKChoKSA9PiBzZWxlY3RlZC5hZGQoaC50cykpO1xuICAgIHNlbGVjdGVkLmFkZCgxMCk7XG4gICAgaWYgKGR1cmF0aW9uID4gNjApIHNlbGVjdGVkLmFkZChNYXRoLmZsb29yKGR1cmF0aW9uIC8gMikpO1xuICAgIGlmIChkdXJhdGlvbiA+IDIwKSBzZWxlY3RlZC5hZGQoZHVyYXRpb24gLSAxMCk7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oc2VsZWN0ZWQpXG4gICAgICAuc29ydCgoYSwgYikgPT4gYSAtIGIpXG4gICAgICAuc2xpY2UoMCwgOCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNhcHR1cmVGcmFtZXMoXG4gICAgcGFnZTogUGFnZSxcbiAgICB2aWRlbzogVmlkZW9FbnRyeSxcbiAgICBvZmZzZXRTZWNvbmRzOiBudW1iZXIgPSAwXG4gICk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgIGBbdjQtcHJvXSDwn5O4IEludGVycnVwdC1GcmVlIEZyYW1lIENhcHR1cmUgZm9yOiAke3ZpZGVvLnRpdGxlfSAoT2Zmc2V0OiAke29mZnNldFNlY29uZHN9cylgXG4gICAgKTtcbiAgICBjb25zdCBmcmFtZXM6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3QgdGltZXN0YW1wcyA9IHRoaXMuZ2V0VmlzdWFsSG90c3BvdHModmlkZW8pLm1hcCgodHMpID0+IE1hdGgubWF4KDAsIHRzICsgb2Zmc2V0U2Vjb25kcykpO1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYFt2NC1wcm9dIPCfjq8gVGFyZ2V0IHRpbWVzdGFtcHM6ICR7dGltZXN0YW1wcy5tYXAoKHQpID0+IHRoaXMuZm9ybWF0RHVyYXRpb24odCkpLmpvaW4oJywgJyl9YFxuICAgICk7XG5cbiAgICBmb3IgKGNvbnN0IHRzIG9mIHRpbWVzdGFtcHMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbdjQtcHJvXSBTZWVraW5nIHRvICR7dGhpcy5mb3JtYXREdXJhdGlvbih0cyl9Li4uYCk7XG4gICAgICAgIGF3YWl0IHBhZ2UuZXZhbHVhdGUoKHQpID0+IHtcbiAgICAgICAgICBjb25zdCB2ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcigndmlkZW8nKTtcbiAgICAgICAgICBpZiAodikgdi5jdXJyZW50VGltZSA9IHQ7XG4gICAgICAgIH0sIHRzKTtcblxuICAgICAgICAvLyBFbnN1cmUgcGxheWJhY2sgaXMgcGF1c2VkIHNvIGZyYW1lIGlzIHN0YWJsZVxuICAgICAgICBhd2FpdCBwYWdlLmV2YWx1YXRlKCgpID0+IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ3ZpZGVvJyk/LnBhdXNlKCkpO1xuICAgICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDIwMDApO1xuXG4gICAgICAgIGNvbnN0IGZyYW1lUGF0aCA9IHBhdGguam9pbih0aGlzLmZyYW1lc0RpciwgYCR7dmlkZW8udmlkZW9JZH1fJHt0c30uanBnYCk7XG5cbiAgICAgICAgLy8gVjMgVXBncmFkZTogQmFja2dyb3VuZC1TYWZlIENhcHR1cmVcbiAgICAgICAgLy8gVGFyZ2V0IHRoZSB2aWRlbyBlbGVtZW50IGRpcmVjdGx5IGZvciBoaWdoLWZpZGVsaXR5IGNvbnRlbnQgb25seVxuICAgICAgICBjb25zdCB2aWRlb0VsZW1lbnQgPSBwYWdlLmxvY2F0b3IoJ3ZpZGVvJykuZmlyc3QoKTtcbiAgICAgICAgaWYgKGF3YWl0IHZpZGVvRWxlbWVudC5pc1Zpc2libGUoKSkge1xuICAgICAgICAgIGF3YWl0IHZpZGVvRWxlbWVudC5zY3JlZW5zaG90KHtcbiAgICAgICAgICAgIHBhdGg6IGZyYW1lUGF0aCxcbiAgICAgICAgICAgIHR5cGU6ICdqcGVnJyxcbiAgICAgICAgICAgIHF1YWxpdHk6IDkwLFxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoZnJhbWVQYXRoKSkge1xuICAgICAgICAgICAgZnJhbWVzLnB1c2goZnMucmVhZEZpbGVTeW5jKGZyYW1lUGF0aCwgJ2Jhc2U2NCcpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgW3Y0LXByb10gRmFpbGVkIHRvIGNhcHR1cmUgZnJhbWUgYXQgJHt0c306YCwgZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmcmFtZXM7XG4gIH1cblxuICBwcml2YXRlIHBydW5lRnJhbWVzKHZpZGVvOiBWaWRlb0VudHJ5KTogdm9pZCB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZpbGVzID0gZnMucmVhZGRpclN5bmModGhpcy5mcmFtZXNEaXIpLmZpbHRlcigoZikgPT4gZi5zdGFydHNXaXRoKHZpZGVvLnZpZGVvSWQpKTtcbiAgICAgIGZpbGVzLmZvckVhY2goKGYpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBmcy51bmxpbmtTeW5jKHBhdGguam9pbih0aGlzLmZyYW1lc0RpciwgZikpO1xuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgfSk7XG4gICAgICBjb25zb2xlLmxvZyhgW3Y0LXByb10g8J+nuSBQcnVuZWQgJHtmaWxlcy5sZW5ndGh9IGZyYW1lcyBmb3IgJHt2aWRlby52aWRlb0lkfWApO1xuICAgIH0gY2F0Y2ggKGUpIHt9XG4gIH1cblxuICBhc3luYyBhbmFseXplV2l0aEFJKHZpZGVvOiBWaWRlb0VudHJ5KTogUHJvbWlzZTxBbmFseXNpc1Jlc3VsdCB8IG51bGw+IHtcbiAgICBpZiAoIXRoaXMuZ29vZ2xlQXBpS2V5IHx8ICF2aWRlby50cmFuc2NyaXB0KSByZXR1cm4gbnVsbDtcblxuICAgIGxldCByZXRyaWVzID0gMjtcbiAgICB3aGlsZSAocmV0cmllcyA+PSAwKSB7XG4gICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgYFt2NC1wcm9dIPCfp6AgUHJvIE11bHRpbW9kYWwgVGhpbmtpbmcgKCR7UFJPX01PREVMfSk6ICR7dmlkZW8udGl0bGV9IChSZXRyaWVzOiAke3JldHJpZXN9KWBcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IHRyYW5zY3JpcHRUZXh0ID0gdmlkZW8udHJhbnNjcmlwdFxuICAgICAgICAubWFwKChzKSA9PiBgWyR7dGhpcy5mb3JtYXREdXJhdGlvbihzLnN0YXJ0KX1dICR7cy50ZXh0fWApXG4gICAgICAgIC5qb2luKCdcXG4nKTtcblxuICAgICAgLy8gQ29uc3RydWN0IEdlbWluaSBQYXJ0c1xuICAgICAgY29uc3QgcGFydHMgPSBbXG4gICAgICAgIHsgdGV4dDogQU5BTFlTSVNfUFJPTVBUICsgdHJhbnNjcmlwdFRleHQuc3Vic3RyaW5nKDAsIDMwMDAwKSB9LFxuICAgICAgICAuLi4odmlkZW8uZnJhbWVzIHx8IFtdKS5tYXAoKGYpID0+ICh7XG4gICAgICAgICAgaW5saW5lX2RhdGE6IHsgbWltZV90eXBlOiAnaW1hZ2UvanBlZycsIGRhdGE6IGYgfSxcbiAgICAgICAgfSkpLFxuICAgICAgXTtcblxuICAgICAgY29uc3QgdXJsID0gYGh0dHBzOi8vZ2VuZXJhdGl2ZWxhbmd1YWdlLmdvb2dsZWFwaXMuY29tL3YxYmV0YS9tb2RlbHMvJHtQUk9fTU9ERUx9OmdlbmVyYXRlQ29udGVudD9rZXk9JHt0aGlzLmdvb2dsZUFwaUtleX1gO1xuXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIGNvbnRlbnRzOiBbeyBwYXJ0cyB9XSxcbiAgICAgICAgICAgIGdlbmVyYXRpb25Db25maWc6IHtcbiAgICAgICAgICAgICAgdGVtcGVyYXR1cmU6IDAuMSxcbiAgICAgICAgICAgICAgbWF4T3V0cHV0VG9rZW5zOiA4MTkyLFxuICAgICAgICAgICAgICByZXNwb25zZV9taW1lX3R5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgdGhpbmtpbmdfY29uZmlnOiB7XG4gICAgICAgICAgICAgICAgaW5jbHVkZV90aG91Z2h0czogdHJ1ZSxcbiAgICAgICAgICAgICAgICB0aGlua2luZ19idWRnZXQ6IDQwOTYsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIHNpZ25hbDogKEFib3J0U2lnbmFsIGFzIGFueSkudGltZW91dCgxMjAwMDApLFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgY29uc3QgZXJyVGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGBbdjQtcHJvXSDinYwgQVBJIEVycm9yICgke3Jlc3BvbnNlLnN0YXR1c30pOiAke2VyclRleHQuc3Vic3RyaW5nKDAsIDIwMCl9YCk7XG4gICAgICAgICAgcmV0cmllcy0tO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgY29uc3QgY2FuZGlkYXRlID0gZGF0YS5jYW5kaWRhdGVzWzBdO1xuICAgICAgICBsZXQgcmF3UmVzcG9uc2UgPSBjYW5kaWRhdGUuY29udGVudC5wYXJ0c1swXS50ZXh0O1xuXG4gICAgICAgIGNvbnNvbGUubG9nKGBbdjQtcHJvXSDwn5OlIFJlY2VpdmVkIHJhdyByZXNwb25zZSAoJHtyYXdSZXNwb25zZS5sZW5ndGh9IGNoYXJzKWApO1xuXG4gICAgICAgIC8vIFJvYnVzdCBKU09OIGV4dHJhY3Rpb25cbiAgICAgICAgbGV0IGpzb25TdHIgPSByYXdSZXNwb25zZTtcbiAgICAgICAgY29uc3QganNvbk1hdGNoID1cbiAgICAgICAgICByYXdSZXNwb25zZS5tYXRjaCgvYGBganNvblxcbj8oW1xcc1xcU10qPylcXG4/YGBgLykgfHwgcmF3UmVzcG9uc2UubWF0Y2goLyhcXHtbXFxzXFxTXSpcXH0pLyk7XG4gICAgICAgIGlmIChqc29uTWF0Y2gpIHtcbiAgICAgICAgICBqc29uU3RyID0ganNvbk1hdGNoWzFdO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGpzb25TdHIpO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBrZXlQb2ludHM6IHBhcnNlZC5rZXlQb2ludHMgfHwgW10sXG4gICAgICAgICAgICBhaUNvbmNlcHRzOiBwYXJzZWQuYWlDb25jZXB0cyB8fCBbXSxcbiAgICAgICAgICAgIHRlY2huaWNhbERldGFpbHM6IHBhcnNlZC50ZWNobmljYWxEZXRhaWxzIHx8IFtdLFxuICAgICAgICAgICAgdmlzdWFsQ29udGV4dEZsYWdzOiBwYXJzZWQudmlzdWFsQ29udGV4dEZsYWdzIHx8IFtdLFxuICAgICAgICAgICAgc3VtbWFyeTogcGFyc2VkLnN1bW1hcnkgfHwgJycsXG4gICAgICAgICAgICB2aXN1YWxVdGlsaXR5U2NvcmU6IHBhcnNlZC52aXN1YWxVdGlsaXR5U2NvcmUgfHwgMCxcbiAgICAgICAgICAgIHF1YWxpdHlTY29yZTogdGhpcy5jYWxjdWxhdGVRdWFsaXR5U2NvcmUocGFyc2VkKSxcbiAgICAgICAgICAgIHJhd1Jlc3BvbnNlOiByYXdSZXNwb25zZS5zdWJzdHJpbmcoMCwgMTAwMCksXG4gICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAocGFyc2VFcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFt2NC1wcm9dIOKdjCBKU09OIFBhcnNlIGZhaWxlZC4gQXR0ZW1wdGluZyBmYWxsYmFjayBleHRyYWN0aW9uLi4uYCk7XG4gICAgICAgICAgLy8gTWluaW1hbCBmYWxsYmFja1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBrZXlQb2ludHM6IFtdLFxuICAgICAgICAgICAgYWlDb25jZXB0czogW10sXG4gICAgICAgICAgICB0ZWNobmljYWxEZXRhaWxzOiBbXSxcbiAgICAgICAgICAgIHZpc3VhbENvbnRleHRGbGFnczogW10sXG4gICAgICAgICAgICBzdW1tYXJ5OiByYXdSZXNwb25zZS5zdWJzdHJpbmcoMCwgNTAwKS5yZXBsYWNlKC9cXG4vZywgJyAnKSxcbiAgICAgICAgICAgIHZpc3VhbFV0aWxpdHlTY29yZTogMywgLy8gTG93IHNjb3JlIGZvciBmYWlsZWQgcGFyc2VcbiAgICAgICAgICAgIHF1YWxpdHlTY29yZTogMTAsXG4gICAgICAgICAgICByYXdSZXNwb25zZTogcmF3UmVzcG9uc2Uuc3Vic3RyaW5nKDAsIDEwMDApLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBbdjQtcHJvXSDinYwgQVBJIEZhaWx1cmU6ICR7ZS5tZXNzYWdlfWApO1xuICAgICAgICByZXRyaWVzLS07XG4gICAgICAgIGlmIChyZXRyaWVzID49IDApIGF3YWl0IG5ldyBQcm9taXNlKChyKSA9PiBzZXRUaW1lb3V0KHIsIDUwMDApKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZVF1YWxpdHlTY29yZShwYXJzZWQ6IGFueSk6IG51bWJlciB7XG4gICAgbGV0IHNjb3JlID0gMDtcbiAgICBpZiAocGFyc2VkLnN1bW1hcnkgJiYgcGFyc2VkLnN1bW1hcnkubGVuZ3RoID4gNTApIHNjb3JlICs9IDI1O1xuICAgIGlmIChwYXJzZWQua2V5UG9pbnRzICYmIHBhcnNlZC5rZXlQb2ludHMubGVuZ3RoID49IDMpIHNjb3JlICs9IDI1O1xuICAgIGlmIChwYXJzZWQuYWlDb25jZXB0cyAmJiBwYXJzZWQuYWlDb25jZXB0cy5sZW5ndGggPiAwKSBzY29yZSArPSAyNTtcbiAgICBpZiAocGFyc2VkLnRlY2huaWNhbERldGFpbHMgJiYgcGFyc2VkLnRlY2huaWNhbERldGFpbHMubGVuZ3RoID4gMCkgc2NvcmUgKz0gMjU7XG4gICAgcmV0dXJuIHNjb3JlO1xuICB9XG5cbiAgc2F2ZVJlcG9ydCh2aWRlbzogVmlkZW9FbnRyeSk6IHN0cmluZyB7XG4gICAgY29uc3Qgc2FmZVRpdGxlID0gdmlkZW8udGl0bGUucmVwbGFjZSgvW15hLXpBLVowLTldL2csICdfJykuc3Vic3RyaW5nKDAsIDUwKTtcbiAgICBjb25zdCByZXBvcnRGaWxlID0gcGF0aC5qb2luKFxuICAgICAgdGhpcy5yZXBvcnRzRGlyLFxuICAgICAgYHYyXyR7dmlkZW8uaW5kZXh9XyR7c2FmZVRpdGxlfV8ke0RhdGUubm93KCl9Lm1kYFxuICAgICk7XG4gICAgbGV0IGNvbnRlbnQgPSBgIyBWaWRlbyBBbmFseXNpcyBSZXBvcnRcXG5cXG4jIyBNZXRhZGF0YVxcbi0gKipWaWRlbyoqOiAke3ZpZGVvLnRpdGxlfVxcbi0gKipJbmRleCoqOiAjJHt2aWRlby5pbmRleH1cXG4tICoqVVJMKio6ICR7dmlkZW8udXJsfVxcbi0gKipEdXJhdGlvbioqOiAke3ZpZGVvLm1ldGFkYXRhPy5kdXJhdGlvbkZvcm1hdHRlZCB8fCAnVW5rbm93bid9XFxuLSAqKlByb2Nlc3NlZCoqOiAke25ldyBEYXRlKCkudG9JU09TdHJpbmcoKX1cXG5cXG4tLS1cXG5cXG4jIyBTdW1tYXJ5XFxuJHt2aWRlby5hbmFseXNpcz8uc3VtbWFyeSB8fCAnTm8gc3VtbWFyeSBhdmFpbGFibGUnfVxcbmA7XG5cbiAgICBpZiAodmlkZW8uYW5hbHlzaXM/LnZpc3VhbENvbnRleHRGbGFncyAmJiB2aWRlby5hbmFseXNpcy52aXN1YWxDb250ZXh0RmxhZ3MubGVuZ3RoID4gMCkge1xuICAgICAgY29udGVudCArPSBgXFxuIyMg8J+mviBWaXN1YWwgSW50ZWxsaWdlbmNlXFxuJHt2aWRlby5hbmFseXNpcy52aXN1YWxDb250ZXh0RmxhZ3NcbiAgICAgICAgLm1hcCgoZikgPT4gYC0gKioke3RoaXMuZm9ybWF0RHVyYXRpb24oZi50aW1lc3RhbXApfSoqOiAke2YucmVhc29ufSAtICR7Zi5jb250ZXh0fWApXG4gICAgICAgIC5qb2luKCdcXG4nKX1cXG5gO1xuICAgIH1cblxuICAgIGZzLndyaXRlRmlsZVN5bmMocmVwb3J0RmlsZSwgY29udGVudCk7XG4gICAgdGhpcy5hcHBlbmRUb0tub3dsZWRnZUJhc2UodmlkZW8pO1xuICAgIHJldHVybiByZXBvcnRGaWxlO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBlbmRUb0tub3dsZWRnZUJhc2UodmlkZW86IFZpZGVvRW50cnkpOiB2b2lkIHtcbiAgICBjb25zdCBlbnRyeUlkID0gYHZpZGVvLWFuYWx5c2lzLSR7dmlkZW8udmlkZW9JZH1gO1xuICAgIGNvbnN0IHNhZmVUaXRsZSA9IHZpZGVvLnRpdGxlLnJlcGxhY2UoL1teYS16QS1aMC05XS9nLCAnXycpLnN1YnN0cmluZygwLCA1MCk7XG4gICAgLy8gUGhhc2UgOTogc2hhcmVkIEZlZGVyYXRlZCBJRCMgaGVscGVyIChzZWUgVHJhbnNjcmlwdFByb2Nlc3NvclYyKS5cbiAgICBjb25zdCBpZE51bWJlciA9IGdlbmVyYXRlRmVkZXJhdGVkSWROdW1iZXIodmlkZW8uaW5kZXgpO1xuXG4gICAgY29uc3QgY29tcG91bmRpbmdFbnRyeSA9IHtcbiAgICAgIGlkOiBlbnRyeUlkLFxuICAgICAgdGl0bGU6IHZpZGVvLnRpdGxlLFxuICAgICAgY2F0ZWdvcnk6ICd2aWRlby1hbmFseXNpcycsXG4gICAgICBjb250ZW50OiB2aWRlby5hbmFseXNpcz8uc3VtbWFyeSB8fCAnTm8gc3VtbWFyeScsXG4gICAgICB2aXN1YWxfaW50ZWxsaWdlbmNlOiB2aWRlby5hbmFseXNpcz8udmlzdWFsQ29udGV4dEZsYWdzIHx8IFtdLFxuICAgICAgYmFja2xpbmtzOiBbXG4gICAgICAgIC4uLih2aWRlby5hbmFseXNpcz8uYWlDb25jZXB0cyB8fCBbXSksXG4gICAgICAgIC4uLih2aWRlby5hbmFseXNpcz8udGVjaG5pY2FsRGV0YWlscyB8fCBbXSksXG4gICAgICBdLFxuICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgYWdlbnRJZDogJ3RyYW5zY3JpcHQtcHJvY2Vzc29yLXY0JyxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIHZpZGVvSWQ6IHZpZGVvLnZpZGVvSWQsXG4gICAgICAgIHVybDogdmlkZW8udXJsLFxuICAgICAgICBxdWFsaXR5U2NvcmU6IHZpZGVvLmFuYWx5c2lzPy5xdWFsaXR5U2NvcmUgfHwgMCxcbiAgICAgICAgaWROdW1iZXI6IGlkTnVtYmVyLFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgY29uc3Qgd2lraUluYm94RGlyID0gcGF0aC5qb2luKHBhdGguZGlybmFtZSh0aGlzLnN0YXRlRmlsZVBhdGgpLCAnd2lraS1pbmJveCcpO1xuICAgIGZzLm1rZGlyU3luYyh3aWtpSW5ib3hEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGZzLndyaXRlRmlsZVN5bmMoXG4gICAgICBwYXRoLmpvaW4od2lraUluYm94RGlyLCBgJHtlbnRyeUlkfS5qc29uYCksXG4gICAgICBKU09OLnN0cmluZ2lmeShjb21wb3VuZGluZ0VudHJ5LCBudWxsLCAyKVxuICAgICk7XG5cbiAgICBjb25zdCBsZWdhY3lFbnRyeSA9IGBcXG4tLS1cXG5cXG4jIyAjJHt2aWRlby5pbmRleH06ICR7dmlkZW8udGl0bGV9XFxuKipVUkwqKjogJHt2aWRlby51cmx9XFxuKipSZXNvdXJjZSBQb2ludGVyKio6IHRycDovL3dpa2ktaW5ib3gvJHtlbnRyeUlkfS5qc29uXFxuXFxuIyMjIFN1bW1hcnlcXG4ke3ZpZGVvLmFuYWx5c2lzPy5zdW1tYXJ5IHx8ICdObyBzdW1tYXJ5J31cXG5cXG4jIyMgVmlzdWFsIEZpbmRpbmdzXFxuJHsodmlkZW8uYW5hbHlzaXM/LnZpc3VhbENvbnRleHRGbGFncyB8fCBbXSkubWFwKChmKSA9PiBgLSBbJHt0aGlzLmZvcm1hdER1cmF0aW9uKGYudGltZXN0YW1wKX1dICR7Zi5jb250ZXh0fWApLmpvaW4oJ1xcbicpIHx8ICctIE5vbmUnfVxcblxcbmA7XG4gICAgZnMuYXBwZW5kRmlsZVN5bmModGhpcy5rbm93bGVkZ2VCYXNlRmlsZSwgbGVnYWN5RW50cnkpO1xuICB9XG5cbiAgYXN5bmMgcHJvY2Vzc1ZpZGVvKHZpZGVvOiBWaWRlb0VudHJ5KTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHZpZGVvLnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcgfHwgdmlkZW8uc3RhdHVzID09PSAnc2tpcHBlZCcpIHJldHVybiB0cnVlO1xuICAgIGlmICh2aWRlby5wcm9jZXNzaW5nQXR0ZW1wdHMgPj0gMykge1xuICAgICAgdmlkZW8uc3RhdHVzID0gJ3NraXBwZWQnO1xuICAgICAgdGhpcy5zdGF0ZS5zdGF0cy5za2lwcGVkKys7XG4gICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLmVuc3VyZUJyb3dzZXJIZWFsdGgoKTtcbiAgICBjb25zb2xlLmxvZyhgXFxu4pWQ4pWQ4pWQ4pWQIFZpZGVvICMke3ZpZGVvLmluZGV4fTogJHt2aWRlby50aXRsZX0g4pWQ4pWQ4pWQ4pWQXFxuYCk7XG4gICAgdmlkZW8ucHJvY2Vzc2luZ0F0dGVtcHRzKys7XG4gICAgdGhpcy5zYXZlU3RhdGUoKTtcblxuICAgIHRyeSB7XG4gICAgICBpZiAoIXZpZGVvLm1ldGFkYXRhKSB7XG4gICAgICAgIGxldCBkdXJhdGlvbiA9IDA7XG4gICAgICAgIGxldCBkdXJhdGlvbkZvcm1hdHRlZCA9ICcwOjAwJztcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBkdXJTdHIgPSBleGVjU3luYyhgeXQtZGxwIC0tZ2V0LWR1cmF0aW9uICR7dmlkZW8udXJsfWApLnRvU3RyaW5nKCkudHJpbSgpO1xuICAgICAgICAgIGNvbnN0IHBhcnRzID0gZHVyU3RyLnNwbGl0KCc6JykubWFwKE51bWJlcik7XG4gICAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMikgZHVyYXRpb24gPSBwYXJ0c1swXSAqIDYwICsgcGFydHNbMV07XG4gICAgICAgICAgZWxzZSBpZiAocGFydHMubGVuZ3RoID09PSAzKSBkdXJhdGlvbiA9IHBhcnRzWzBdICogMzYwMCArIHBhcnRzWzFdICogNjAgKyBwYXJ0c1syXTtcbiAgICAgICAgICBpZiAoZHVyYXRpb24gPiAwKSBkdXJhdGlvbkZvcm1hdHRlZCA9IGR1clN0cjtcbiAgICAgICAgfSBjYXRjaCAoZSkge31cblxuICAgICAgICB2aWRlby5tZXRhZGF0YSA9IChhd2FpdCB0aGlzLmZldGNoRW5yaWNoZWRNZXRhZGF0YSh2aWRlbykpIHx8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHZpZGVvLm1ldGFkYXRhKSB7XG4gICAgICAgICAgaWYgKGR1cmF0aW9uID4gMCkge1xuICAgICAgICAgICAgdmlkZW8ubWV0YWRhdGEuZHVyYXRpb24gPSBkdXJhdGlvbjtcbiAgICAgICAgICAgIHZpZGVvLm1ldGFkYXRhLmR1cmF0aW9uRm9ybWF0dGVkID0gZHVyYXRpb25Gb3JtYXR0ZWQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuc3RhdGUuc3RhdHMubWV0YWRhdGFDb21wbGV0ZSsrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghdmlkZW8udHJhbnNjcmlwdCkge1xuICAgICAgICB2aWRlby50cmFuc2NyaXB0ID0gKGF3YWl0IHRoaXMuZXh0cmFjdFRyYW5zY3JpcHREaXJlY3QodmlkZW8pKSB8fCB1bmRlZmluZWQ7XG4gICAgICAgIGlmICh2aWRlby50cmFuc2NyaXB0KSB0aGlzLnN0YXRlLnN0YXRzLnRyYW5zY3JpcHRzRXh0cmFjdGVkKys7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh2aWRlby50cmFuc2NyaXB0KSB7XG4gICAgICAgIC8vIFYzOiBWaXN1YWwgRnJhbWUgQ2FwdHVyZSB3aXRoIFZlcmlmaWNhdGlvbiBMb29wXG4gICAgICAgIGxldCBhdHRlbXB0cyA9IDA7XG4gICAgICAgIGxldCB2aXN1YWxVdGlsaXR5ID0gMDtcblxuICAgICAgICB3aGlsZSAoYXR0ZW1wdHMgPCAyICYmIHZpc3VhbFV0aWxpdHkgPCA1KSB7XG4gICAgICAgICAgaWYgKCF2aWRlby5mcmFtZXMgfHwgYXR0ZW1wdHMgPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBwYWdlID0gYXdhaXQgdGhpcy5jb250ZXh0IS5uZXdQYWdlKCk7XG4gICAgICAgICAgICBhd2FpdCBwYWdlLmdvdG8odmlkZW8udXJsLCB7IHdhaXRVbnRpbDogJ2xvYWQnLCB0aW1lb3V0OiA0NTAwMCB9KTtcbiAgICAgICAgICAgIC8vIFNoaWZ0IG9mZnNldCBvbiBzZWNvbmQgYXR0ZW1wdFxuICAgICAgICAgICAgdmlkZW8uZnJhbWVzID0gYXdhaXQgdGhpcy5jYXB0dXJlRnJhbWVzKHBhZ2UsIHZpZGVvLCBhdHRlbXB0cyAqIDUpO1xuICAgICAgICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodmlkZW8uZnJhbWVzICYmICF2aWRlby5hbmFseXNpcykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFt2NC1wcm9dIPCflI0gVmVyaWZ5aW5nIHZpc3VhbCB1dGlsaXR5IChBdHRlbXB0ICR7YXR0ZW1wdHMgKyAxfSkuLi5gKTtcbiAgICAgICAgICAgIHZpZGVvLmFuYWx5c2lzID0gKGF3YWl0IHRoaXMuYW5hbHl6ZVdpdGhBSSh2aWRlbykpIHx8IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgdmlzdWFsVXRpbGl0eSA9IHZpZGVvLmFuYWx5c2lzPy52aXN1YWxVdGlsaXR5U2NvcmUgfHwgMDtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbdjQtcHJvXSDwn5OKIFZpc3VhbCBVdGlsaXR5IFNjb3JlOiAke3Zpc3VhbFV0aWxpdHl9LzEwYCk7XG5cbiAgICAgICAgICAgIGlmICh2aXN1YWxVdGlsaXR5IDwgNSAmJiBhdHRlbXB0cyA8IDEpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICAgICAgYFt2NC1wcm9dIPCflIQgTG93IHZpc3VhbCB1dGlsaXR5IGRldGVjdGVkLiBSZXRyeWluZyB3aXRoIHRlbXBvcmFsIHNoaWZ0Li4uYFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBhdHRlbXB0cysrO1xuICAgICAgICAgICAgICB2aWRlby5hbmFseXNpcyA9IHVuZGVmaW5lZDsgLy8gUmVzZXQgZm9yIHJldHJ5XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2aWRlby5hbmFseXNpcykgdGhpcy5zdGF0ZS5zdGF0cy5hbmFseXplZCsrO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgfVxuXG4gICAgICBpZiAodmlkZW8uYW5hbHlzaXMpIHtcbiAgICAgICAgdGhpcy5zYXZlUmVwb3J0KHZpZGVvKTtcbiAgICAgICAgdmlkZW8uc3RhdHVzID0gJ2NvbXBsZXRlZCc7XG4gICAgICAgIHRoaXMuc3RhdGUuc3RhdHMuY29tcGxldGVkKys7XG4gICAgICAgIC8vIFYzOiBQcnVuZSBmcmFtZXMgaW1tZWRpYXRlbHkgYWZ0ZXIgc3VjY2Vzc2Z1bCBhbmFseXNpc1xuICAgICAgICB0aGlzLnBydW5lRnJhbWVzKHZpZGVvKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZpZGVvLnN0YXR1cyA9ICdlcnJvcic7XG4gICAgICAgIHRoaXMuc3RhdGUuc3RhdHMuZXJyb3JzKys7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICByZXR1cm4gdmlkZW8uc3RhdHVzID09PSAnY29tcGxldGVkJztcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFt2NC1wcm9dIEVycm9yOmAsIGUubWVzc2FnZSk7XG4gICAgICB2aWRlby5zdGF0dXMgPSAnZXJyb3InO1xuICAgICAgdGhpcy5zdGF0ZS5zdGF0cy5lcnJvcnMrKztcbiAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgcnVuKGxpYnJhcnlQYXRoOiBzdHJpbmcsIHN0YXJ0SW5kZXg6IG51bWJlciA9IDY5MiwgZW5kSW5kZXg6IG51bWJlciA9IDY0OCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnNvbGUubG9nKGDwn5qAIFYzIFBpcGVsaW5lOiAjJHtzdGFydEluZGV4fSDihpIgIyR7ZW5kSW5kZXh9IHwgTW9kZWw6ICR7UFJPX01PREVMfWApO1xuICAgIGF3YWl0IHRoaXMuaW5pdGlhbGl6ZSgpO1xuICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMobGlicmFyeVBhdGgsICd1dGYtOCcpO1xuICAgIGNvbnN0IHZpZGVvczogVmlkZW9FbnRyeVtdID0gW107XG4gICAgY29uc3Qgcm93UmVnZXggPVxuICAgICAgLzx0cj5cXHMqPHRkW14+XSo+XFxzKihcXGQrKVxccyo8XFwvdGQ+XFxzKjx0ZFtePl0qPlxccyo8YVxccytocmVmPVwiKFteXCJdKylcIltePl0qPihbXjxdKyk8XFwvYT5cXHMqPFxcL3RkPi9nO1xuICAgIGxldCBtYXRjaDtcbiAgICB3aGlsZSAoKG1hdGNoID0gcm93UmVnZXguZXhlYyhjb250ZW50KSkgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gcGFyc2VJbnQobWF0Y2hbMV0pO1xuICAgICAgaWYgKGluZGV4IDw9IHN0YXJ0SW5kZXggJiYgaW5kZXggPj0gZW5kSW5kZXgpIHtcbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLnN0YXRlLnF1ZXVlLmZpbmQoKHYpID0+IHYuaW5kZXggPT09IGluZGV4KTtcbiAgICAgICAgaWYgKGV4aXN0aW5nKSB2aWRlb3MucHVzaChleGlzdGluZyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICB2aWRlb3MucHVzaCh7XG4gICAgICAgICAgICBpbmRleCxcbiAgICAgICAgICAgIHVybDogbWF0Y2hbMl0sXG4gICAgICAgICAgICB0aXRsZTogbWF0Y2hbM10udHJpbSgpLFxuICAgICAgICAgICAgdmlkZW9JZDogdGhpcy5leHRyYWN0VmlkZW9JZChtYXRjaFsyXSkgfHwgJycsXG4gICAgICAgICAgICBzdGF0dXM6ICdwZW5kaW5nJyxcbiAgICAgICAgICAgIHByb2Nlc3NpbmdBdHRlbXB0czogMCxcbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmlkZW9zLnNvcnQoKGEsIGIpID0+IGIuaW5kZXggLSBhLmluZGV4KTtcbiAgICB0aGlzLnN0YXRlLnF1ZXVlID0gdmlkZW9zO1xuICAgIHRoaXMuc3RhdGUuc3RhdHMudG90YWxWaWRlb3MgPSB2aWRlb3MubGVuZ3RoO1xuICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG5cbiAgICBmb3IgKGNvbnN0IHZpZGVvIG9mIHZpZGVvcykge1xuICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50SW5kZXggPSB2aWRlby5pbmRleDtcbiAgICAgIGF3YWl0IHRoaXMucHJvY2Vzc1ZpZGVvKHZpZGVvKTtcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyKSA9PiBzZXRUaW1lb3V0KHIsIDMwMDApKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuY29udGV4dCkgYXdhaXQgdGhpcy5jb250ZXh0LmNsb3NlKCk7XG4gIH1cblxuICBwcml2YXRlIGRvd25sb2FkVHJhbnNjcmlwdFdpdGhZdERscCh1cmw6IHN0cmluZywgdmlkZW9JZDogc3RyaW5nKTogVHJhbnNjcmlwdFNlZ21lbnRbXSB8IG51bGwge1xuICAgIGNvbnN0IHRlbXBEaXIgPSBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKHRoaXMucmVwb3J0c0RpciksICd0ZW1wX3N1YnMnKTtcbiAgICBmcy5ta2RpclN5bmModGVtcERpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgY29uc3Qgb3V0cHV0RmlsZUJhc2UgPSBwYXRoLmpvaW4odGVtcERpciwgdmlkZW9JZCk7XG4gICAgdHJ5IHtcbiAgICAgIGV4ZWNTeW5jKFxuICAgICAgICBgeXQtZGxwIC0td3JpdGUtYXV0by1zdWIgLS13cml0ZS1zdWIgLS1zdWItbGFuZyBlbiAtLXNraXAtZG93bmxvYWQgLS1vdXRwdXQgXCIke291dHB1dEZpbGVCYXNlfVwiIFwiJHt1cmx9XCJgLFxuICAgICAgICB7IHN0ZGlvOiAnaWdub3JlJyB9XG4gICAgICApO1xuICAgICAgY29uc3QgZmlsZXMgPSBmcy5yZWFkZGlyU3luYyh0ZW1wRGlyKTtcbiAgICAgIGNvbnN0IHN1YkZpbGUgPSBmaWxlcy5maW5kKChmKSA9PiBmLnN0YXJ0c1dpdGgodmlkZW9JZCkgJiYgZi5lbmRzV2l0aCgnLnZ0dCcpKTtcbiAgICAgIGlmICghc3ViRmlsZSkgcmV0dXJuIG51bGw7XG4gICAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbih0ZW1wRGlyLCBzdWJGaWxlKSwgJ3V0Zi04Jyk7XG4gICAgICBjb25zdCBzZWdtZW50czogVHJhbnNjcmlwdFNlZ21lbnRbXSA9IFtdO1xuICAgICAgY29uc3QgYmxvY2tzID0gY29udGVudC5zcGxpdCgvXFxuXFxyP1xcbi8pO1xuICAgICAgZm9yIChjb25zdCBibG9jayBvZiBibG9ja3MpIHtcbiAgICAgICAgY29uc3QgdGltZU1hdGNoID0gYmxvY2subWF0Y2goXG4gICAgICAgICAgLyhcXGR7Mn0pOihcXGR7Mn0pOihcXGR7Mn0pXFwuKFxcZHszfSlcXHMtLT5cXHMoXFxkezJ9KTooXFxkezJ9KTooXFxkezJ9KVxcLihcXGR7M30pL1xuICAgICAgICApO1xuICAgICAgICBpZiAodGltZU1hdGNoKSB7XG4gICAgICAgICAgY29uc3QgbGluZXMgPSBibG9jay5zcGxpdCgnXFxuJyk7XG4gICAgICAgICAgY29uc3QgdElkeCA9IGxpbmVzLmZpbmRJbmRleCgobCkgPT4gbC5pbmNsdWRlcygnLS0+JykpO1xuICAgICAgICAgIGlmICh0SWR4ICE9PSAtMSAmJiB0SWR4IDwgbGluZXMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgY29uc3QgdGV4dCA9IGxpbmVzXG4gICAgICAgICAgICAgIC5zbGljZSh0SWR4ICsgMSlcbiAgICAgICAgICAgICAgLmpvaW4oJyAnKVxuICAgICAgICAgICAgICAucmVwbGFjZSgvPFtePl0qPi9nLCAnJylcbiAgICAgICAgICAgICAgLnRyaW0oKTtcbiAgICAgICAgICAgIGlmICh0ZXh0ICYmIHRleHQgIT09ICdhbGlnbjpzdGFydCBwb3NpdGlvbjowJScpIHtcbiAgICAgICAgICAgICAgY29uc3Qgc3RhcnRTZWMgPVxuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFsxXSkgKiAzNjAwICtcbiAgICAgICAgICAgICAgICBwYXJzZUludCh0aW1lTWF0Y2hbMl0pICogNjAgK1xuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFszXSkgK1xuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFs0XSkgLyAxMDAwO1xuICAgICAgICAgICAgICBjb25zdCBlbmRTZWMgPVxuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFs1XSkgKiAzNjAwICtcbiAgICAgICAgICAgICAgICBwYXJzZUludCh0aW1lTWF0Y2hbNl0pICogNjAgK1xuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFs3XSkgK1xuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFs4XSkgLyAxMDAwO1xuICAgICAgICAgICAgICBzZWdtZW50cy5wdXNoKHsgc3RhcnQ6IHN0YXJ0U2VjLCBkdXJhdGlvbjogZW5kU2VjIC0gc3RhcnRTZWMsIHRleHQgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmcy51bmxpbmtTeW5jKHBhdGguam9pbih0ZW1wRGlyLCBzdWJGaWxlKSk7XG4gICAgICByZXR1cm4gc2VnbWVudHM7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG1haW4oKSB7XG4gIGNvbnN0IGFyZ3MgPSBwcm9jZXNzLmFyZ3Yuc2xpY2UoMik7XG4gIGNvbnN0IHN0YXJ0QXJnID0gYXJncy5maW5kKChhKSA9PiBhLnN0YXJ0c1dpdGgoJy0tc3RhcnQ9JykpO1xuICBjb25zdCBlbmRBcmcgPSBhcmdzLmZpbmQoKGEpID0+IGEuc3RhcnRzV2l0aCgnLS1lbmQ9JykpO1xuICBjb25zdCBzdGFydCA9IHN0YXJ0QXJnID8gcGFyc2VJbnQoc3RhcnRBcmcuc3BsaXQoJz0nKVsxXSkgOiA2OTI7XG4gIGNvbnN0IGVuZCA9IGVuZEFyZyA/IHBhcnNlSW50KGVuZEFyZy5zcGxpdCgnPScpWzFdKSA6IDY0ODtcbiAgY29uc3QgbGlicmFyeVBhdGggPSBwcm9jZXNzLmVudi5UTkZfVklERU9fTElCUkFSWSB8fCAnJztcbiAgY29uc3QgaW5nZXN0UHJvY2Vzc29yID0gbmV3IFRyYW5zY3JpcHRQcm9jZXNzb3JWNCgpO1xuICBhd2FpdCBpbmdlc3RQcm9jZXNzb3IucnVuKGxpYnJhcnlQYXRoLCBzdGFydCwgZW5kKTtcbn1cblxubWFpbigpLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xuIl19