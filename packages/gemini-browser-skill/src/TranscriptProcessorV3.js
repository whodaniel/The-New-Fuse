"use strict";
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
        const dataDir = '/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data';
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
            const envPath = '/Users/danielgoldberg/.hermes/.env';
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/NVIDIA_API_KEY=(nvapi-[A-Za-z0-9\-_]+)/);
            if (match) {
                this.nvidiaApiKey = match[1];
                console.log('[v3] ✅ NVIDIA API Key loaded');
            }
            else {
                console.error('[v3] ❌ NVIDIA API Key not found in .hermes/.env');
            }
        }
        catch (e) {
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
        }
        catch (e) {
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
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
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
        console.log(`[v3] 📸 Interrupt-Free Frame Capture for: ${video.title} (Offset: ${offsetSeconds}s)`);
        const frames = [];
        const timestamps = this.getVisualHotspots(video).map((ts) => Math.max(0, ts + offsetSeconds));
        console.log(`[v3] 🎯 Target timestamps: ${timestamps.map((t) => this.formatDuration(t)).join(', ')}`);
        for (const ts of timestamps) {
            try {
                console.log(`[v3] Seeking to ${this.formatDuration(ts)}...`);
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
                }
                catch (e) { }
            });
            console.log(`[v3] 🧹 Pruned ${files.length} frames for ${video.videoId}`);
        }
        catch (e) { }
    }
    async analyzeWithAI(video) {
        if (!this.nvidiaApiKey || !video.transcript)
            return null;
        let retries = 2;
        while (retries >= 0) {
            console.log(`[v3] 🧠 Multimodal Analysis via ${MULTIMODAL_MODEL}: ${video.title} (Retries: ${retries})`);
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
                    if (match)
                        rawResponse = match[0];
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
            }
            catch (e) {
                retries--;
                if (retries >= 0)
                    await new Promise((resolve) => setTimeout(resolve, 5000));
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
        const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        let num = video.index;
        let idCode = '';
        while (num > 0) {
            idCode = alphabet[num % 58] + idCode;
            num = Math.floor(num / 58);
        }
        const idNumber = `ID#:${idCode || alphabet[0]}`;
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
                agentId: 'transcript-processor-v3',
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
                        console.log(`[v3] 🔍 Verifying visual utility (Attempt ${attempts + 1})...`);
                        video.analysis = (await this.analyzeWithAI(video)) || undefined;
                        visualUtility = ((_a = video.analysis) === null || _a === void 0 ? void 0 : _a.visualUtilityScore) || 0;
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
    const libraryPath = '/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/my-ai-knowledge-base/video-library/ai_video_library.html';
    const ingestProcessor = new TranscriptProcessorV3();
    await ingestProcessor.run(libraryPath, start, end);
}
main().catch(console.error);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHJhbnNjcmlwdFByb2Nlc3NvclYzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiVHJhbnNjcmlwdFByb2Nlc3NvclYzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7O0dBU0c7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsMkRBQThDO0FBQzlDLDRDQUE4QjtBQUM5QixnREFBa0M7QUFDbEMsc0RBQXdDO0FBRXhDLDJDQUFzRTtBQWtGdEUscUJBQXFCO0FBQ3JCLE1BQU0sZ0JBQWdCLEdBQUcsc0JBQXNCLENBQUM7QUFDaEQsTUFBTSxjQUFjLEdBQUcsc0RBQXNELENBQUM7QUFFOUUsTUFBTSxlQUFlLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F5QnZCLENBQUM7QUFFRixNQUFNLHFCQUFxQjtJQVd6QixZQUFZLGNBQXNELFVBQVU7UUFWcEUsWUFBTyxHQUEwQixJQUFJLENBQUM7UUFPdEMsZ0JBQVcsR0FBMkMsVUFBVSxDQUFDO1FBQ2pFLGlCQUFZLEdBQVcsRUFBRSxDQUFDO1FBR2hDLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1FBQy9CLE1BQU0sT0FBTyxHQUFHLGtFQUFrRSxDQUFDO1FBRW5GLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztRQUNwRSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ3RELElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztRQUM5RCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ3BELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsSUFB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LENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFDNUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ3hELE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO0lBQ2hFLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO0lBQzFELE1BQU0sV0FBVyxHQUNmLHlHQUF5RyxDQUFDO0lBQzVHLE1BQU0sZUFBZSxHQUFHLElBQUkscUJBQXFCLEVBQUUsQ0FBQztJQUNwRCxNQUFNLGVBQWUsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNyRCxDQUFDO0FBRUQsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVHJhbnNjcmlwdCBQcm9jZXNzb3IgdjMgLSBPbW5pLVZpc2lvbiBFZGl0aW9uXG4gKlxuICogSW1wcm92ZW1lbnRzIG92ZXIgdjI6XG4gKiAxLiBVc2VzIG1vb25zaG90YWkva2ltaS1rMi42IHZpYSBOVklESUEgTkdDIEFQSSAoTXVsdGltb2RhbClcbiAqIDIuIEludGVncmF0ZWQgTmF0aXZlIFZpc2lvbiBCcmlkZ2UgdmlhIFRORiBGb3JnZSAoc2NyZWVuY2FwLnNvKVxuICogMy4gSW50ZWxsaWdlbnQgSGlnaC1GaWRlbGl0eSBIb3RzcG90IFNlbGVjdGlvbiAoQ2FwcGVkIGF0IDggaW1hZ2VzKVxuICogNC4gQXV0aG9yaXRhdGl2ZSB5dC1kbHAgZHVyYXRpb24gdmVyaWZpY2F0aW9uXG4gKiA1LiBSb2J1c3Qgc3RhdGUgcHJvdGVjdGlvbiB0byBwcmV2ZW50IGZpbGUgY29ycnVwdGlvblxuICovXG5cbmltcG9ydCB7IGV4ZWNTeW5jIH0gZnJvbSAnbm9kZTpjaGlsZF9wcm9jZXNzJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0ICogYXMgcHJvY2VzcyBmcm9tICdub2RlOnByb2Nlc3MnO1xuXG5pbXBvcnQgeyBjaHJvbWl1bSwgdHlwZSBCcm93c2VyQ29udGV4dCwgdHlwZSBQYWdlIH0gZnJvbSAncGxheXdyaWdodCc7XG5cbmludGVyZmFjZSBWaWRlb0VudHJ5IHtcbiAgaW5kZXg6IG51bWJlcjtcbiAgdXJsOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHZpZGVvSWQ6IHN0cmluZztcbiAgbWV0YWRhdGE/OiBWaWRlb01ldGFkYXRhO1xuICB0cmFuc2NyaXB0PzogVHJhbnNjcmlwdFNlZ21lbnRbXTtcbiAgYW5hbHlzaXM/OiBBbmFseXNpc1Jlc3VsdDtcbiAgZnJhbWVzPzogc3RyaW5nW107IC8vIEJhc2U2NCBlbmNvZGVkIEpQRUcgZnJhbWVzXG4gIHN0YXR1czpcbiAgICB8ICdwZW5kaW5nJ1xuICAgIHwgJ21ldGFkYXRhJ1xuICAgIHwgJ3RyYW5zY3JpcHQnXG4gICAgfCAnYW5hbHl6ZWQnXG4gICAgfCAnbmVlZHNfdmlzdWFsJ1xuICAgIHwgJ2NvbXBsZXRlZCdcbiAgICB8ICdza2lwcGVkJ1xuICAgIHwgJ2Vycm9yJztcbiAgcHJvY2Vzc2luZ0F0dGVtcHRzOiBudW1iZXI7XG4gIGxhc3RQcm9jZXNzZWQ/OiBzdHJpbmc7XG4gIGVycm9yPzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgVmlkZW9NZXRhZGF0YSB7XG4gIGR1cmF0aW9uOiBudW1iZXI7XG4gIGR1cmF0aW9uRm9ybWF0dGVkOiBzdHJpbmc7XG4gIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICBjaGFubmVsPzogc3RyaW5nO1xuICBwdWJsaXNoRGF0ZT86IHN0cmluZztcbiAgdmlld0NvdW50Pzogc3RyaW5nO1xuICBjYXRlZ29yeT86IHN0cmluZztcbiAgdGFncz86IHN0cmluZ1tdO1xuICBzdW1tYXJ5Pzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgVHJhbnNjcmlwdFNlZ21lbnQge1xuICBzdGFydDogbnVtYmVyO1xuICBkdXJhdGlvbjogbnVtYmVyO1xuICB0ZXh0OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBBbmFseXNpc1Jlc3VsdCB7XG4gIGtleVBvaW50czogc3RyaW5nW107XG4gIGFpQ29uY2VwdHM6IHN0cmluZ1tdO1xuICB0ZWNobmljYWxEZXRhaWxzOiBzdHJpbmdbXTtcbiAgdmlzdWFsQ29udGV4dEZsYWdzOiBWaXN1YWxDb250ZXh0RmxhZ1tdO1xuICBzdW1tYXJ5OiBzdHJpbmc7XG4gIHZpc3VhbFV0aWxpdHlTY29yZTogbnVtYmVyO1xuICBxdWFsaXR5U2NvcmU/OiBudW1iZXI7XG4gIHJhd1Jlc3BvbnNlPzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgVmlzdWFsQ29udGV4dEZsYWcge1xuICB0aW1lc3RhbXA6IG51bWJlcjtcbiAgcmVhc29uOiBzdHJpbmc7XG4gIGNvbnRleHQ6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFByb2Nlc3NpbmdTdGF0ZSB7XG4gIHZlcnNpb246IHN0cmluZztcbiAgcXVldWU6IFZpZGVvRW50cnlbXTtcbiAgY3VycmVudEluZGV4OiBudW1iZXI7XG4gIHN0YXJ0ZWRBdDogc3RyaW5nO1xuICBsYXN0VXBkYXRlZDogc3RyaW5nO1xuICBzdGF0czogUHJvY2Vzc2luZ1N0YXRzO1xufVxuXG5pbnRlcmZhY2UgUHJvY2Vzc2luZ1N0YXRzIHtcbiAgdG90YWxWaWRlb3M6IG51bWJlcjtcbiAgbWV0YWRhdGFDb21wbGV0ZTogbnVtYmVyO1xuICB0cmFuc2NyaXB0c0V4dHJhY3RlZDogbnVtYmVyO1xuICBhbmFseXplZDogbnVtYmVyO1xuICBuZWVkc1Zpc3VhbFJldmlldzogbnVtYmVyO1xuICBjb21wbGV0ZWQ6IG51bWJlcjtcbiAgc2tpcHBlZDogbnVtYmVyO1xuICBlcnJvcnM6IG51bWJlcjtcbiAgYW5hbHlzaXNTdWNjZXNzUmF0ZTogbnVtYmVyO1xuICBhdmVyYWdlVHJhbnNjcmlwdExlbmd0aDogbnVtYmVyO1xufVxuXG4vLyBNb2RlbCAmIEFQSSBDb25maWdcbmNvbnN0IE1VTFRJTU9EQUxfTU9ERUwgPSAnbW9vbnNob3RhaS9raW1pLWsyLjYnO1xuY29uc3QgTlZJRElBX0FQSV9VUkwgPSAnaHR0cHM6Ly9pbnRlZ3JhdGUuYXBpLm52aWRpYS5jb20vdjEvY2hhdC9jb21wbGV0aW9ucyc7XG5cbmNvbnN0IEFOQUxZU0lTX1BST01QVCA9IGBZb3UgYXJlIGEgaGlnaC1maWRlbGl0eSBpbnRlbGxpZ2VuY2UgZXh0cmFjdG9yLiBZb3UgYXJlIGFuYWx5emluZyBhIHRlY2huaWNhbCBZb3VUdWJlIHZpZGVvIHVzaW5nIGJvdGggaXRzIHRyYW5zY3JpcHQgYW5kIGtleSB2aXN1YWwgZnJhbWVzLiBcblxuWW91ciBnb2FsIGlzIHRvIGV4dHJhY3QgbWFjaGluZS1hY3Rpb25hYmxlIGludGVsbGlnZW5jZSBhbmQgc3RydWN0dXJlZCB0ZWNobmljYWwgaW5zaWdodHMuIFBheSBzcGVjaWFsIGF0dGVudGlvbiB0bzpcbjEuIENvZGUgc25pcHBldHMgb3IgQ0xJIGNvbW1hbmRzIHNob3duIGluIGZyYW1lcy5cbjIuIEFyY2hpdGVjdHVyYWwgZGlhZ3JhbXMgYW5kIGRhdGEgZmxvdy5cbjMuIFNwZWNpZmljIHZlcnNpb25zIG9mIHRvb2xzIGFuZCBmcmFtZXdvcmtzIG1lbnRpb25lZCBvciBzaG93bi5cblxuSU1QT1JUQU5UOiBBc3Nlc3MgdGhlIFwidmlzdWFsVXRpbGl0eVNjb3JlXCIgKDAtMTApIG9mIHRoZSBwcm92aWRlZCBpbWFnZXMuIFxuLSAwLTM6IE9ubHkgc3BlYWtlciBmYWNlLCBsb2dvLCBvciBnZW5lcmljIGludHJvIHNsaWRlcy5cbi0gNC03OiBTb21lIGRpYWdyYW1zIG9yIFVJIGJ1dCBoYXJkIHRvIHJlYWQgb3IgbW9zdGx5IGNvdmVyZWQuXG4tIDgtMTA6IEhpZ2gtZmlkZWxpdHkgY29kZSwgYXJjaGl0ZWN0dXJlLCBvciBjbGVhciBkYXRhIHRhYmxlcy5cblxuUmV0dXJuIE9OTFkgYSB2YWxpZCBKU09OIG9iamVjdCB3aXRoIHRoaXMgc3RydWN0dXJlOlxue1xuICBcInN1bW1hcnlcIjogXCJDb25jaXNlIHRlY2huaWNhbCBzdW1tYXJ5XCIsXG4gIFwidmlzdWFsVXRpbGl0eVNjb3JlXCI6IDgsXG4gIFwia2V5UG9pbnRzXCI6IFtcIlBvaW50IDFcIiwgXCJQb2ludCAyXCIsIC4uLl0sXG4gIFwiYWlDb25jZXB0c1wiOiBbXCJDb25jZXB0IDFcIiwgXCJDb25jZXB0IDJcIiwgLi4uXSxcbiAgXCJ0ZWNobmljYWxEZXRhaWxzXCI6IFtcIkRldGFpbGVkIGltcGxlbWVudGF0aW9uIG9yIHRvb2wgaW5mb1wiLCAuLi5dLFxuICBcInZpc3VhbENvbnRleHRGbGFnc1wiOiBbXG4gICAge1widGltZXN0YW1wXCI6IDEyMCwgXCJyZWFzb25cIjogXCJSZWFzb24gZm9yIGZsYWdnaW5nXCIsIFwiY29udGV4dFwiOiBcIlZpc2libGUgZGV0YWlscyBmcm9tIGZyYW1lXCJ9XG4gIF1cbn1cblxuVFJBTlNDUklQVCBTRUdNRU5UOlxuYDtcblxuY2xhc3MgVHJhbnNjcmlwdFByb2Nlc3NvclYzIHtcbiAgcHJpdmF0ZSBjb250ZXh0OiBCcm93c2VyQ29udGV4dCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHN0YXRlOiBQcm9jZXNzaW5nU3RhdGU7XG4gIHByaXZhdGUgc3RhdGVGaWxlUGF0aDogc3RyaW5nO1xuICBwcml2YXRlIHJlcG9ydHNEaXI6IHN0cmluZztcbiAgcHJpdmF0ZSB0cmFuc2NyaXB0c0Rpcjogc3RyaW5nO1xuICBwcml2YXRlIGZyYW1lc0Rpcjogc3RyaW5nO1xuICBwcml2YXRlIGtub3dsZWRnZUJhc2VGaWxlOiBzdHJpbmc7XG4gIHByaXZhdGUgdGFyZ2V0UGhhc2U6ICdtZXRhZGF0YScgfCAndHJhbnNjcmlwdCcgfCAnYW5hbHlzaXMnID0gJ2FuYWx5c2lzJztcbiAgcHJpdmF0ZSBudmlkaWFBcGlLZXk6IHN0cmluZyA9ICcnO1xuXG4gIGNvbnN0cnVjdG9yKHRhcmdldFBoYXNlOiAnbWV0YWRhdGEnIHwgJ3RyYW5zY3JpcHQnIHwgJ2FuYWx5c2lzJyA9ICdhbmFseXNpcycpIHtcbiAgICB0aGlzLnRhcmdldFBoYXNlID0gdGFyZ2V0UGhhc2U7XG4gICAgY29uc3QgZGF0YURpciA9ICcvVXNlcnMvZGFuaWVsZ29sZGJlcmcvRGVza3RvcC9BMS1JbnRlci1MTE0tQ29tL1RoZS1OZXctRnVzZS9kYXRhJztcblxuICAgIHRoaXMuc3RhdGVGaWxlUGF0aCA9IHBhdGguam9pbihkYXRhRGlyLCAndHJhbnNjcmlwdC12Mi1zdGF0ZS5qc29uJyk7XG4gICAgdGhpcy5yZXBvcnRzRGlyID0gcGF0aC5qb2luKGRhdGFEaXIsICd2aWRlby1yZXBvcnRzJyk7XG4gICAgdGhpcy50cmFuc2NyaXB0c0RpciA9IHBhdGguam9pbihkYXRhRGlyLCAndmlkZW8tdHJhbnNjcmlwdHMnKTtcbiAgICB0aGlzLmZyYW1lc0RpciA9IHBhdGguam9pbihkYXRhRGlyLCAndmlkZW8tZnJhbWVzJyk7XG4gICAgdGhpcy5rbm93bGVkZ2VCYXNlRmlsZSA9IHBhdGguam9pbihkYXRhRGlyLCAnQUlfS25vd2xlZGdlX0Jhc2UubWQnKTtcblxuICAgIGNvbnNvbGUubG9nKGBbdjNdIFVzaW5nIGRhdGEgZGlyZWN0b3J5OiAke2RhdGFEaXJ9YCk7XG5cbiAgICBmcy5ta2RpclN5bmModGhpcy5yZXBvcnRzRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBmcy5ta2RpclN5bmModGhpcy50cmFuc2NyaXB0c0RpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgZnMubWtkaXJTeW5jKHRoaXMuZnJhbWVzRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBmcy5ta2RpclN5bmMocGF0aC5qb2luKGRhdGFEaXIsICd0ZW1wX3N1YnMnKSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG5cbiAgICB0aGlzLnN0YXRlID0gdGhpcy5sb2FkU3RhdGUoKTtcbiAgICB0aGlzLmxvYWROdmlkaWFLZXkoKTtcbiAgfVxuXG4gIHByaXZhdGUgbG9hZE52aWRpYUtleSgpOiB2b2lkIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZW52UGF0aCA9ICcvVXNlcnMvZGFuaWVsZ29sZGJlcmcvLmhlcm1lcy8uZW52JztcbiAgICAgIGNvbnN0IGVudkNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoZW52UGF0aCwgJ3V0ZjgnKTtcbiAgICAgIGNvbnN0IG1hdGNoID0gZW52Q29udGVudC5tYXRjaCgvTlZJRElBX0FQSV9LRVk9KG52YXBpLVtBLVphLXowLTlcXC1fXSspLyk7XG4gICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgdGhpcy5udmlkaWFBcGlLZXkgPSBtYXRjaFsxXTtcbiAgICAgICAgY29uc29sZS5sb2coJ1t2M10g4pyFIE5WSURJQSBBUEkgS2V5IGxvYWRlZCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignW3YzXSDinYwgTlZJRElBIEFQSSBLZXkgbm90IGZvdW5kIGluIC5oZXJtZXMvLmVudicpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1t2M10g4p2MIEZhaWxlZCB0byByZWFkIC5oZXJtZXMvLmVudicpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgbG9hZFN0YXRlKCk6IFByb2Nlc3NpbmdTdGF0ZSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChmcy5leGlzdHNTeW5jKHRoaXMuc3RhdGVGaWxlUGF0aCkpIHtcbiAgICAgICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyh0aGlzLnN0YXRlRmlsZVBhdGgsICd1dGYtOCcpO1xuICAgICAgICBpZiAoY29udGVudC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgY29uc3Qgc3RhdGUgPSBKU09OLnBhcnNlKGNvbnRlbnQpO1xuICAgICAgICAgIGlmIChzdGF0ZS52ZXJzaW9uICE9PSAnMy4wJykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1t2M10gTWlncmF0aW5nIHN0YXRlIHRvIHYzIGZvcm1hdC4uLicpO1xuICAgICAgICAgICAgc3RhdGUudmVyc2lvbiA9ICczLjAnO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmxvZygnW3YzXSDimqDvuI8gU3RhdGUgbG9hZCBlcnJvciwgY3JlYXRpbmcgZnJlc2ggc3RhdGUnKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHZlcnNpb246ICczLjAnLFxuICAgICAgcXVldWU6IFtdLFxuICAgICAgY3VycmVudEluZGV4OiAwLFxuICAgICAgc3RhcnRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICBsYXN0VXBkYXRlZDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgc3RhdHM6IHtcbiAgICAgICAgdG90YWxWaWRlb3M6IDAsXG4gICAgICAgIG1ldGFkYXRhQ29tcGxldGU6IDAsXG4gICAgICAgIHRyYW5zY3JpcHRzRXh0cmFjdGVkOiAwLFxuICAgICAgICBhbmFseXplZDogMCxcbiAgICAgICAgbmVlZHNWaXN1YWxSZXZpZXc6IDAsXG4gICAgICAgIGNvbXBsZXRlZDogMCxcbiAgICAgICAgc2tpcHBlZDogMCxcbiAgICAgICAgZXJyb3JzOiAwLFxuICAgICAgICBhbmFseXNpc1N1Y2Nlc3NSYXRlOiAwLFxuICAgICAgICBhdmVyYWdlVHJhbnNjcmlwdExlbmd0aDogMCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgc2F2ZVN0YXRlKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5zdGF0ZSB8fCAhdGhpcy5zdGF0ZS5xdWV1ZSB8fCB0aGlzLnN0YXRlLnF1ZXVlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc29sZS5lcnJvcignW3YzXSDinYwgUmVmdXNpbmcgdG8gc2F2ZSBlbXB0eSBvciBpbnZhbGlkIHN0YXRlJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc3RhdGUubGFzdFVwZGF0ZWQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgdGhpcy51cGRhdGVTdGF0cygpO1xuICAgIGZzLm1rZGlyU3luYyhwYXRoLmRpcm5hbWUodGhpcy5zdGF0ZUZpbGVQYXRoKSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgZnMud3JpdGVGaWxlU3luYyh0aGlzLnN0YXRlRmlsZVBhdGgsIEpTT04uc3RyaW5naWZ5KHRoaXMuc3RhdGUsIG51bGwsIDIpKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlU3RhdHMoKTogdm9pZCB7XG4gICAgY29uc3QgcyA9IHRoaXMuc3RhdGUuc3RhdHM7XG4gICAgY29uc3QgYW5hbHl6ZWQgPSB0aGlzLnN0YXRlLnF1ZXVlLmZpbHRlcigodikgPT4gdi5hbmFseXNpcykubGVuZ3RoO1xuICAgIGNvbnN0IGF0dGVtcHRlZCA9IHRoaXMuc3RhdGUucXVldWUuZmlsdGVyKCh2KSA9PiB2LnByb2Nlc3NpbmdBdHRlbXB0cyA+IDApLmxlbmd0aDtcbiAgICBzLmFuYWx5c2lzU3VjY2Vzc1JhdGUgPSBhdHRlbXB0ZWQgPiAwID8gKGFuYWx5emVkIC8gYXR0ZW1wdGVkKSAqIDEwMCA6IDA7XG4gICAgY29uc3QgdHJhbnNjcmlwdHMgPSB0aGlzLnN0YXRlLnF1ZXVlLmZpbHRlcigodikgPT4gdi50cmFuc2NyaXB0KTtcbiAgICBzLmF2ZXJhZ2VUcmFuc2NyaXB0TGVuZ3RoID1cbiAgICAgIHRyYW5zY3JpcHRzLmxlbmd0aCA+IDBcbiAgICAgICAgPyB0cmFuc2NyaXB0cy5yZWR1Y2UoKHN1bSwgdikgPT4gc3VtICsgKHYudHJhbnNjcmlwdD8ubGVuZ3RoIHx8IDApLCAwKSAvIHRyYW5zY3JpcHRzLmxlbmd0aFxuICAgICAgICA6IDA7XG4gIH1cblxuICBwcml2YXRlIGV4dHJhY3RWaWRlb0lkKHVybDogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgY29uc3QgbWF0Y2ggPSB1cmwubWF0Y2goXG4gICAgICAvKD86eW91dHViZVxcLmNvbVxcL3dhdGNoXFw/dj18eW91dHVcXC5iZVxcL3x5b3V0dWJlXFwuY29tXFwvZW1iZWRcXC8pKFteJlxccz9dKykvXG4gICAgKTtcbiAgICByZXR1cm4gbWF0Y2ggPyBtYXRjaFsxXSA6IG51bGw7XG4gIH1cblxuICBmb3JtYXREdXJhdGlvbihzZWNvbmRzOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIGNvbnN0IGhvdXJzID0gTWF0aC5mbG9vcihzZWNvbmRzIC8gMzYwMCk7XG4gICAgY29uc3QgbWludXRlcyA9IE1hdGguZmxvb3IoKHNlY29uZHMgJSAzNjAwKSAvIDYwKTtcbiAgICBjb25zdCBzZWNzID0gTWF0aC5mbG9vcihzZWNvbmRzICUgNjApO1xuICAgIHJldHVybiBob3VycyA+IDBcbiAgICAgID8gYCR7aG91cnN9OiR7bWludXRlcy50b1N0cmluZygpLnBhZFN0YXJ0KDIsICcwJyl9OiR7c2Vjcy50b1N0cmluZygpLnBhZFN0YXJ0KDIsICcwJyl9YFxuICAgICAgOiBgJHttaW51dGVzfToke3NlY3MudG9TdHJpbmcoKS5wYWRTdGFydCgyLCAnMCcpfWA7XG4gIH1cblxuICBkZWNvZGVIdG1sRW50aXRpZXModGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGV4dFxuICAgICAgLnJlcGxhY2UoLyZhbXA7L2csICcmJylcbiAgICAgIC5yZXBsYWNlKC8mbHQ7L2csICc8JylcbiAgICAgIC5yZXBsYWNlKC8mZ3Q7L2csICc+JylcbiAgICAgIC5yZXBsYWNlKC8mcXVvdDsvZywgJ1wiJylcbiAgICAgIC5yZXBsYWNlKC8mIzM5Oy9nLCBcIidcIik7XG4gIH1cblxuICBhc3luYyBpbml0aWFsaXplKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHByb2ZpbGVEaXIgPSBwYXRoLmpvaW4ocHJvY2Vzcy5lbnYuSE9NRSB8fCAnL3RtcCcsICcudmlkZW8tcHJvY2Vzc29yLWNocm9tZS1jbGVhbicpO1xuICAgIGNvbnNvbGUubG9nKCdbdjNdIPCfmoAgTGF1bmNoaW5nIEhlYWRsZXNzIEludGVsbGlnZW5jZSBCcmlkZ2UuLi4nKTtcbiAgICBmcy5ta2RpclN5bmMocHJvZmlsZURpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgdGhpcy5jb250ZXh0ID0gYXdhaXQgY2hyb21pdW0ubGF1bmNoUGVyc2lzdGVudENvbnRleHQocHJvZmlsZURpciwge1xuICAgICAgaGVhZGxlc3M6IHRydWUsIC8vIFYzIFVwZ3JhZGU6IFRydWx5IGhlYWRsZXNzIHRvIHByZXZlbnQgZm9jdXMgc3RlYWxpbmdcbiAgICAgIGFyZ3M6IFtcbiAgICAgICAgJy0tbm8tZmlyc3QtcnVuJyxcbiAgICAgICAgJy0tbm8tZGVmYXVsdC1icm93c2VyLWNoZWNrJyxcbiAgICAgICAgJy0tZGlzYWJsZS1ibGluay1mZWF0dXJlcz1BdXRvbWF0aW9uQ29udHJvbGxlZCcsXG4gICAgICAgICctLXdpbmRvdy1zaXplPTEyODAsODAwJyxcbiAgICAgICAgJy0tbXV0ZS1hdWRpbycsXG4gICAgICAgICctLWF1dG9wbGF5LXBvbGljeT1uby11c2VyLWdlc3R1cmUtcmVxdWlyZWQnLFxuICAgICAgXSxcbiAgICAgIHVzZXJBZ2VudDpcbiAgICAgICAgJ01vemlsbGEvNS4wIChNYWNpbnRvc2g7IEludGVsIE1hYyBPUyBYIDEwXzE1XzcpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjIuMC4wLjAgU2FmYXJpLzUzNy4zNicsXG4gICAgICB2aWV3cG9ydDogeyB3aWR0aDogMTI4MCwgaGVpZ2h0OiA4MDAgfSxcbiAgICAgIGlnbm9yZURlZmF1bHRBcmdzOiBbJy0tZW5hYmxlLWF1dG9tYXRpb24nXSxcbiAgICB9KTtcbiAgICBjb25zb2xlLmxvZygnW3YzXSDinIUgSGVhZGxlc3MgQnJpZGdlIHJlYWR5Jyk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGVuc3VyZUJyb3dzZXJIZWFsdGgoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghdGhpcy5jb250ZXh0KSB7XG4gICAgICAgIGF3YWl0IHRoaXMuaW5pdGlhbGl6ZSgpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBhZ2VzID0gYXdhaXQgdGhpcy5jb250ZXh0LnBhZ2VzKCk7XG4gICAgICBpZiAocGFnZXMubGVuZ3RoID4gMzApIHtcbiAgICAgICAgZm9yIChjb25zdCBwYWdlIG9mIHBhZ2VzKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgYXdhaXQgdGhpcy5pbml0aWFsaXplKCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBmZXRjaEVucmljaGVkTWV0YWRhdGEodmlkZW86IFZpZGVvRW50cnkpOiBQcm9taXNlPFZpZGVvTWV0YWRhdGEgfCBudWxsPiB7XG4gICAgaWYgKCF0aGlzLmNvbnRleHQpIHRocm93IG5ldyBFcnJvcignQnJvd3NlciBub3QgaW5pdGlhbGl6ZWQnKTtcbiAgICBjb25zb2xlLmxvZyhgW3YyXSDwn5OKIEVucmljaGVkIG1ldGFkYXRhIGZldGNoOiAke3ZpZGVvLnRpdGxlfWApO1xuICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCB0aGlzLmNvbnRleHQubmV3UGFnZSgpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBxdWVyeSA9IGBZb3VUdWJlIHZpZGVvIFwiJHt2aWRlby51cmx9XCIgY29tcGxldGUgaW5mb3JtYXRpb246IGR1cmF0aW9uLCBjaGFubmVsLCBkZXNjcmlwdGlvbiwgdmlld3MsIHB1Ymxpc2ggZGF0ZSwgdG9waWNzLCBzdW1tYXJ5YDtcbiAgICAgIGNvbnN0IHNlYXJjaFVybCA9IGBodHRwczovL3d3dy5nb29nbGUuY29tL3NlYXJjaD9xPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5KX0mdWRtPTUwYDtcbiAgICAgIGF3YWl0IHBhZ2UuZ290byhzZWFyY2hVcmwsIHsgd2FpdFVudGlsOiAnZG9tY29udGVudGxvYWRlZCcsIHRpbWVvdXQ6IDMwMDAwIH0pO1xuICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCg0MDAwKTtcbiAgICAgIGNvbnN0IHBhZ2VUZXh0ID0gYXdhaXQgcGFnZS5ldmFsdWF0ZSgoKSA9PiBkb2N1bWVudC5ib2R5LmlubmVyVGV4dCk7XG5cbiAgICAgIGxldCBkdXJhdGlvbiA9IDA7XG4gICAgICBjb25zdCBkdXJhdGlvbk1hdGNoID0gcGFnZVRleHQubWF0Y2goLyhcXGQrKVxccyptaW51dGVzP1xccyosP1xccyooXFxkKyk/XFxzKnNlY29uZHM/L2kpO1xuICAgICAgaWYgKGR1cmF0aW9uTWF0Y2gpXG4gICAgICAgIGR1cmF0aW9uID0gcGFyc2VJbnQoZHVyYXRpb25NYXRjaFsxXSkgKiA2MCArIHBhcnNlSW50KGR1cmF0aW9uTWF0Y2hbMl0gfHwgJzAnKTtcblxuICAgICAgY29uc3QgbWV0YWRhdGE6IFZpZGVvTWV0YWRhdGEgPSB7XG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgICBkdXJhdGlvbkZvcm1hdHRlZDogdGhpcy5mb3JtYXREdXJhdGlvbihkdXJhdGlvbiksXG4gICAgICAgIGNoYW5uZWw6ICdVbmtub3duJyxcbiAgICAgICAgdmlld0NvdW50OiAnVW5rbm93bicsXG4gICAgICAgIHB1Ymxpc2hEYXRlOiAnVW5rbm93bicsXG4gICAgICB9O1xuICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgcmV0dXJuIG1ldGFkYXRhO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGV4dHJhY3RUcmFuc2NyaXB0RGlyZWN0KHZpZGVvOiBWaWRlb0VudHJ5KTogUHJvbWlzZTxUcmFuc2NyaXB0U2VnbWVudFtdIHwgbnVsbD4ge1xuICAgIGNvbnN0IHNhZmVUaXRsZSA9IHZpZGVvLnRpdGxlLnJlcGxhY2UoL1teYS16QS1aMC05XS9nLCAnXycpLnN1YnN0cmluZygwLCA1MCk7XG4gICAgY29uc3QgdHJhbnNjcmlwdEZpbGUgPSBwYXRoLmpvaW4odGhpcy50cmFuc2NyaXB0c0RpciwgYCR7dmlkZW8uaW5kZXh9XyR7c2FmZVRpdGxlfS50eHRgKTtcblxuICAgIGlmIChmcy5leGlzdHNTeW5jKHRyYW5zY3JpcHRGaWxlKSkge1xuICAgICAgY29uc29sZS5sb2coYFt2Ml0g4pyFIFVzaW5nIGV4aXN0aW5nIHRyYW5zY3JpcHQgZmlsZTogJHtwYXRoLmJhc2VuYW1lKHRyYW5zY3JpcHRGaWxlKX1gKTtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmModHJhbnNjcmlwdEZpbGUsICd1dGY4Jyk7XG4gICAgICByZXR1cm4gY29udGVudFxuICAgICAgICAuc3BsaXQoJ1xcbicpXG4gICAgICAgIC5maWx0ZXIoKGwpID0+IGwudHJpbSgpKVxuICAgICAgICAubWFwKChsaW5lLCBpKSA9PiAoe1xuICAgICAgICAgIHN0YXJ0OiBpICogNSxcbiAgICAgICAgICBkdXJhdGlvbjogNSxcbiAgICAgICAgICB0ZXh0OiBsaW5lLnJlcGxhY2UoL15cXFsuKj9cXF1cXHMqLywgJycpLnRyaW0oKSxcbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIGNvbnN0IGZiID0gdGhpcy5kb3dubG9hZFRyYW5zY3JpcHRXaXRoWXREbHAodmlkZW8udXJsLCB2aWRlby52aWRlb0lkKTtcbiAgICBpZiAoZmIpIHJldHVybiBmYjtcblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRWaXN1YWxIb3RzcG90cyh2aWRlbzogVmlkZW9FbnRyeSk6IG51bWJlcltdIHtcbiAgICBjb25zdCBwcmlvcml0eUtleXdvcmRzID0gW1xuICAgICAgJ2RpYWdyYW0nLFxuICAgICAgJ2FyY2hpdGVjdHVyZScsXG4gICAgICAnZ3JhcGgnLFxuICAgICAgJ2Zsb3cnLFxuICAgICAgJ2RlbW8nLFxuICAgICAgJ2NvZGUnLFxuICAgICAgJ3NuaXBwZXQnLFxuICAgICAgJ3N0cnVjdHVyZScsXG4gICAgICAnZGFzaGJvYXJkJyxcbiAgICAgICdpbnRlcmZhY2UnLFxuICAgIF07XG4gICAgY29uc3Qgc3VwcG9ydEtleXdvcmRzID0gW1xuICAgICAgJ2xvb2sgYXQnLFxuICAgICAgJ3Nob3dpbmcnLFxuICAgICAgJ3NjcmVlbicsXG4gICAgICAnc2xpZGUnLFxuICAgICAgJ2ZpZ3VyZScsXG4gICAgICAnZnJhbWV3b3JrJyxcbiAgICAgICdjaGFydCcsXG4gICAgICAncGlwZWxpbmUnLFxuICAgICAgJ2NvbnRleHQnLFxuICAgIF07XG5cbiAgICBjb25zdCB3ZWlnaHRlZEhvdHNwb3RzOiB7IHRzOiBudW1iZXI7IHdlaWdodDogbnVtYmVyIH1bXSA9IFtdO1xuICAgIGxldCBkdXJhdGlvbiA9IHZpZGVvLm1ldGFkYXRhPy5kdXJhdGlvbiB8fCAwO1xuXG4gICAgaWYgKHZpZGVvLnRyYW5zY3JpcHQgJiYgdmlkZW8udHJhbnNjcmlwdC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBsYXN0VHMgPSB2aWRlby50cmFuc2NyaXB0W3ZpZGVvLnRyYW5zY3JpcHQubGVuZ3RoIC0gMV0uc3RhcnQ7XG4gICAgICBpZiAoZHVyYXRpb24gPCAxMCB8fCBkdXJhdGlvbiA8IGxhc3RUcykgZHVyYXRpb24gPSBNYXRoLmZsb29yKGxhc3RUcyArIDEwKTtcbiAgICB9XG5cbiAgICBpZiAodmlkZW8udHJhbnNjcmlwdCkge1xuICAgICAgdmlkZW8udHJhbnNjcmlwdC5mb3JFYWNoKChzZWdtZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IHRleHQgPSBzZWdtZW50LnRleHQudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgbGV0IHdlaWdodCA9IDA7XG4gICAgICAgIGlmIChwcmlvcml0eUtleXdvcmRzLnNvbWUoKGspID0+IHRleHQuaW5jbHVkZXMoaykpKSB3ZWlnaHQgPSAyO1xuICAgICAgICBlbHNlIGlmIChzdXBwb3J0S2V5d29yZHMuc29tZSgoaykgPT4gdGV4dC5pbmNsdWRlcyhrKSkpIHdlaWdodCA9IDE7XG4gICAgICAgIGlmICh3ZWlnaHQgPiAwKSB7XG4gICAgICAgICAgY29uc3QgdHMgPSBNYXRoLm1pbihkdXJhdGlvbiwgTWF0aC5mbG9vcihzZWdtZW50LnN0YXJ0ICsgMykpO1xuICAgICAgICAgIGNvbnN0IGlzQ2x1c3RlciA9IHdlaWdodGVkSG90c3BvdHMuc29tZSgoaCkgPT4gTWF0aC5hYnMoaC50cyAtIHRzKSA8IDQ1KTtcbiAgICAgICAgICBpZiAoIWlzQ2x1c3Rlcikgd2VpZ2h0ZWRIb3RzcG90cy5wdXNoKHsgdHMsIHdlaWdodCB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgd2VpZ2h0ZWRIb3RzcG90cy5zb3J0KChhLCBiKSA9PiBiLndlaWdodCAtIGEud2VpZ2h0IHx8IGEudHMgLSBiLnRzKTtcbiAgICBjb25zdCBzZWxlY3RlZCA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuICAgIHdlaWdodGVkSG90c3BvdHMuc2xpY2UoMCwgNikuZm9yRWFjaCgoaCkgPT4gc2VsZWN0ZWQuYWRkKGgudHMpKTtcbiAgICBzZWxlY3RlZC5hZGQoMTApO1xuICAgIGlmIChkdXJhdGlvbiA+IDYwKSBzZWxlY3RlZC5hZGQoTWF0aC5mbG9vcihkdXJhdGlvbiAvIDIpKTtcbiAgICBpZiAoZHVyYXRpb24gPiAyMCkgc2VsZWN0ZWQuYWRkKGR1cmF0aW9uIC0gMTApO1xuICAgIHJldHVybiBBcnJheS5mcm9tKHNlbGVjdGVkKVxuICAgICAgLnNvcnQoKGEsIGIpID0+IGEgLSBiKVxuICAgICAgLnNsaWNlKDAsIDgpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjYXB0dXJlRnJhbWVzKFxuICAgIHBhZ2U6IFBhZ2UsXG4gICAgdmlkZW86IFZpZGVvRW50cnksXG4gICAgb2Zmc2V0U2Vjb25kczogbnVtYmVyID0gMFxuICApOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc29sZS5sb2coXG4gICAgICBgW3YzXSDwn5O4IEludGVycnVwdC1GcmVlIEZyYW1lIENhcHR1cmUgZm9yOiAke3ZpZGVvLnRpdGxlfSAoT2Zmc2V0OiAke29mZnNldFNlY29uZHN9cylgXG4gICAgKTtcbiAgICBjb25zdCBmcmFtZXM6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3QgdGltZXN0YW1wcyA9IHRoaXMuZ2V0VmlzdWFsSG90c3BvdHModmlkZW8pLm1hcCgodHMpID0+IE1hdGgubWF4KDAsIHRzICsgb2Zmc2V0U2Vjb25kcykpO1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYFt2M10g8J+OryBUYXJnZXQgdGltZXN0YW1wczogJHt0aW1lc3RhbXBzLm1hcCgodCkgPT4gdGhpcy5mb3JtYXREdXJhdGlvbih0KSkuam9pbignLCAnKX1gXG4gICAgKTtcblxuICAgIGZvciAoY29uc3QgdHMgb2YgdGltZXN0YW1wcykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc29sZS5sb2coYFt2M10gU2Vla2luZyB0byAke3RoaXMuZm9ybWF0RHVyYXRpb24odHMpfS4uLmApO1xuICAgICAgICBhd2FpdCBwYWdlLmV2YWx1YXRlKCh0KSA9PiB7XG4gICAgICAgICAgY29uc3QgdiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ3ZpZGVvJyk7XG4gICAgICAgICAgaWYgKHYpIHYuY3VycmVudFRpbWUgPSB0O1xuICAgICAgICB9LCB0cyk7XG5cbiAgICAgICAgLy8gRW5zdXJlIHBsYXliYWNrIGlzIHBhdXNlZCBzbyBmcmFtZSBpcyBzdGFibGVcbiAgICAgICAgYXdhaXQgcGFnZS5ldmFsdWF0ZSgoKSA9PiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCd2aWRlbycpPy5wYXVzZSgpKTtcbiAgICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgyMDAwKTtcblxuICAgICAgICBjb25zdCBmcmFtZVBhdGggPSBwYXRoLmpvaW4odGhpcy5mcmFtZXNEaXIsIGAke3ZpZGVvLnZpZGVvSWR9XyR7dHN9LmpwZ2ApO1xuXG4gICAgICAgIC8vIFYzIFVwZ3JhZGU6IEJhY2tncm91bmQtU2FmZSBDYXB0dXJlXG4gICAgICAgIC8vIFRhcmdldCB0aGUgdmlkZW8gZWxlbWVudCBkaXJlY3RseSBmb3IgaGlnaC1maWRlbGl0eSBjb250ZW50IG9ubHlcbiAgICAgICAgY29uc3QgdmlkZW9FbGVtZW50ID0gcGFnZS5sb2NhdG9yKCd2aWRlbycpLmZpcnN0KCk7XG4gICAgICAgIGlmIChhd2FpdCB2aWRlb0VsZW1lbnQuaXNWaXNpYmxlKCkpIHtcbiAgICAgICAgICBhd2FpdCB2aWRlb0VsZW1lbnQuc2NyZWVuc2hvdCh7XG4gICAgICAgICAgICBwYXRoOiBmcmFtZVBhdGgsXG4gICAgICAgICAgICB0eXBlOiAnanBlZycsXG4gICAgICAgICAgICBxdWFsaXR5OiA5MCxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGZyYW1lUGF0aCkpIHtcbiAgICAgICAgICAgIGZyYW1lcy5wdXNoKGZzLnJlYWRGaWxlU3luYyhmcmFtZVBhdGgsICdiYXNlNjQnKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFt2M10gRmFpbGVkIHRvIGNhcHR1cmUgZnJhbWUgYXQgJHt0c306YCwgZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmcmFtZXM7XG4gIH1cblxuICBwcml2YXRlIHBydW5lRnJhbWVzKHZpZGVvOiBWaWRlb0VudHJ5KTogdm9pZCB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZpbGVzID0gZnMucmVhZGRpclN5bmModGhpcy5mcmFtZXNEaXIpLmZpbHRlcigoZikgPT4gZi5zdGFydHNXaXRoKHZpZGVvLnZpZGVvSWQpKTtcbiAgICAgIGZpbGVzLmZvckVhY2goKGYpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBmcy51bmxpbmtTeW5jKHBhdGguam9pbih0aGlzLmZyYW1lc0RpciwgZikpO1xuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgfSk7XG4gICAgICBjb25zb2xlLmxvZyhgW3YzXSDwn6e5IFBydW5lZCAke2ZpbGVzLmxlbmd0aH0gZnJhbWVzIGZvciAke3ZpZGVvLnZpZGVvSWR9YCk7XG4gICAgfSBjYXRjaCAoZSkge31cbiAgfVxuXG4gIGFzeW5jIGFuYWx5emVXaXRoQUkodmlkZW86IFZpZGVvRW50cnkpOiBQcm9taXNlPEFuYWx5c2lzUmVzdWx0IHwgbnVsbD4ge1xuICAgIGlmICghdGhpcy5udmlkaWFBcGlLZXkgfHwgIXZpZGVvLnRyYW5zY3JpcHQpIHJldHVybiBudWxsO1xuICAgIGxldCByZXRyaWVzID0gMjtcbiAgICB3aGlsZSAocmV0cmllcyA+PSAwKSB7XG4gICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgYFt2M10g8J+noCBNdWx0aW1vZGFsIEFuYWx5c2lzIHZpYSAke01VTFRJTU9EQUxfTU9ERUx9OiAke3ZpZGVvLnRpdGxlfSAoUmV0cmllczogJHtyZXRyaWVzfSlgXG4gICAgICApO1xuICAgICAgY29uc3QgdHJhbnNjcmlwdFRleHQgPSB2aWRlby50cmFuc2NyaXB0XG4gICAgICAgIC5tYXAoKHMpID0+IGBbJHt0aGlzLmZvcm1hdER1cmF0aW9uKHMuc3RhcnQpfV0gJHtzLnRleHR9YClcbiAgICAgICAgLmpvaW4oJ1xcbicpO1xuICAgICAgY29uc3QgbWVzc2FnZXMgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiAndXNlcicsXG4gICAgICAgICAgY29udGVudDogW1xuICAgICAgICAgICAgeyB0eXBlOiAndGV4dCcsIHRleHQ6IEFOQUxZU0lTX1BST01QVCArIHRyYW5zY3JpcHRUZXh0LnN1YnN0cmluZygwLCAxMjAwMCkgfSxcbiAgICAgICAgICAgIC4uLih2aWRlby5mcmFtZXMgfHwgW10pLm1hcCgoZikgPT4gKHtcbiAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlX3VybCcsXG4gICAgICAgICAgICAgIGltYWdlX3VybDogeyB1cmw6IGBkYXRhOmltYWdlL2pwZWc7YmFzZTY0LCR7Zn1gIH0sXG4gICAgICAgICAgICB9KSksXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIF07XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goTlZJRElBX0FQSV9VUkwsIHtcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7dGhpcy5udmlkaWFBcGlLZXl9YCxcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBtb2RlbDogTVVMVElNT0RBTF9NT0RFTCxcbiAgICAgICAgICAgIG1lc3NhZ2VzLFxuICAgICAgICAgICAgbWF4X3Rva2VuczogMjA0OCxcbiAgICAgICAgICAgIHRlbXBlcmF0dXJlOiAwLjEsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgc2lnbmFsOiAoQWJvcnRTaWduYWwgYXMgYW55KS50aW1lb3V0KDkwMDAwKSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgIHJldHJpZXMtLTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgICAgIGxldCByYXdSZXNwb25zZSA9IGRhdGEuY2hvaWNlc1swXS5tZXNzYWdlLmNvbnRlbnQ7XG4gICAgICAgIHJhd1Jlc3BvbnNlID0gcmF3UmVzcG9uc2UucmVwbGFjZSgvPHRoaW5raW5nPltcXHNcXFNdKj88XFwvdGhpbmtpbmc+L2csICcnKS50cmltKCk7XG4gICAgICAgIHJhd1Jlc3BvbnNlID0gcmF3UmVzcG9uc2UucmVwbGFjZSgvYGBganNvblxcbj98XFxuP2BgYC9nLCAnJykudHJpbSgpO1xuICAgICAgICBpZiAoIXJhd1Jlc3BvbnNlLnN0YXJ0c1dpdGgoJ3snKSkge1xuICAgICAgICAgIGNvbnN0IG1hdGNoID0gcmF3UmVzcG9uc2UubWF0Y2goL1xce1tcXHNcXFNdKlxcfS8pO1xuICAgICAgICAgIGlmIChtYXRjaCkgcmF3UmVzcG9uc2UgPSBtYXRjaFswXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UocmF3UmVzcG9uc2UpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGtleVBvaW50czogcGFyc2VkLmtleVBvaW50cyB8fCBbXSxcbiAgICAgICAgICBhaUNvbmNlcHRzOiBwYXJzZWQuYWlDb25jZXB0cyB8fCBbXSxcbiAgICAgICAgICB0ZWNobmljYWxEZXRhaWxzOiBwYXJzZWQudGVjaG5pY2FsRGV0YWlscyB8fCBbXSxcbiAgICAgICAgICB2aXN1YWxDb250ZXh0RmxhZ3M6IHBhcnNlZC52aXN1YWxDb250ZXh0RmxhZ3MgfHwgW10sXG4gICAgICAgICAgc3VtbWFyeTogcGFyc2VkLnN1bW1hcnkgfHwgJycsXG4gICAgICAgICAgdmlzdWFsVXRpbGl0eVNjb3JlOiBwYXJzZWQudmlzdWFsVXRpbGl0eVNjb3JlIHx8IDAsXG4gICAgICAgICAgcXVhbGl0eVNjb3JlOiB0aGlzLmNhbGN1bGF0ZVF1YWxpdHlTY29yZShwYXJzZWQpLFxuICAgICAgICAgIHJhd1Jlc3BvbnNlOiByYXdSZXNwb25zZS5zdWJzdHJpbmcoMCwgMTAwMCksXG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHJpZXMtLTtcbiAgICAgICAgaWYgKHJldHJpZXMgPj0gMCkgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgNTAwMCkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlUXVhbGl0eVNjb3JlKHBhcnNlZDogYW55KTogbnVtYmVyIHtcbiAgICBsZXQgc2NvcmUgPSAwO1xuICAgIGlmIChwYXJzZWQuc3VtbWFyeSAmJiBwYXJzZWQuc3VtbWFyeS5sZW5ndGggPiA1MCkgc2NvcmUgKz0gMjU7XG4gICAgaWYgKHBhcnNlZC5rZXlQb2ludHMgJiYgcGFyc2VkLmtleVBvaW50cy5sZW5ndGggPj0gMykgc2NvcmUgKz0gMjU7XG4gICAgaWYgKHBhcnNlZC5haUNvbmNlcHRzICYmIHBhcnNlZC5haUNvbmNlcHRzLmxlbmd0aCA+IDApIHNjb3JlICs9IDI1O1xuICAgIGlmIChwYXJzZWQudGVjaG5pY2FsRGV0YWlscyAmJiBwYXJzZWQudGVjaG5pY2FsRGV0YWlscy5sZW5ndGggPiAwKSBzY29yZSArPSAyNTtcbiAgICByZXR1cm4gc2NvcmU7XG4gIH1cblxuICBzYXZlUmVwb3J0KHZpZGVvOiBWaWRlb0VudHJ5KTogc3RyaW5nIHtcbiAgICBjb25zdCBzYWZlVGl0bGUgPSB2aWRlby50aXRsZS5yZXBsYWNlKC9bXmEtekEtWjAtOV0vZywgJ18nKS5zdWJzdHJpbmcoMCwgNTApO1xuICAgIGNvbnN0IHJlcG9ydEZpbGUgPSBwYXRoLmpvaW4oXG4gICAgICB0aGlzLnJlcG9ydHNEaXIsXG4gICAgICBgdjJfJHt2aWRlby5pbmRleH1fJHtzYWZlVGl0bGV9XyR7RGF0ZS5ub3coKX0ubWRgXG4gICAgKTtcbiAgICBsZXQgY29udGVudCA9IGAjIFZpZGVvIEFuYWx5c2lzIFJlcG9ydFxcblxcbiMjIE1ldGFkYXRhXFxuLSAqKlZpZGVvKio6ICR7dmlkZW8udGl0bGV9XFxuLSAqKkluZGV4Kio6ICMke3ZpZGVvLmluZGV4fVxcbi0gKipVUkwqKjogJHt2aWRlby51cmx9XFxuLSAqKkR1cmF0aW9uKio6ICR7dmlkZW8ubWV0YWRhdGE/LmR1cmF0aW9uRm9ybWF0dGVkIHx8ICdVbmtub3duJ31cXG4tICoqUHJvY2Vzc2VkKio6ICR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpfVxcblxcbi0tLVxcblxcbiMjIFN1bW1hcnlcXG4ke3ZpZGVvLmFuYWx5c2lzPy5zdW1tYXJ5IHx8ICdObyBzdW1tYXJ5IGF2YWlsYWJsZSd9XFxuYDtcblxuICAgIGlmICh2aWRlby5hbmFseXNpcz8udmlzdWFsQ29udGV4dEZsYWdzICYmIHZpZGVvLmFuYWx5c2lzLnZpc3VhbENvbnRleHRGbGFncy5sZW5ndGggPiAwKSB7XG4gICAgICBjb250ZW50ICs9IGBcXG4jIyDwn6a+IFZpc3VhbCBJbnRlbGxpZ2VuY2VcXG4ke3ZpZGVvLmFuYWx5c2lzLnZpc3VhbENvbnRleHRGbGFnc1xuICAgICAgICAubWFwKChmKSA9PiBgLSAqKiR7dGhpcy5mb3JtYXREdXJhdGlvbihmLnRpbWVzdGFtcCl9Kio6ICR7Zi5yZWFzb259IC0gJHtmLmNvbnRleHR9YClcbiAgICAgICAgLmpvaW4oJ1xcbicpfVxcbmA7XG4gICAgfVxuXG4gICAgZnMud3JpdGVGaWxlU3luYyhyZXBvcnRGaWxlLCBjb250ZW50KTtcbiAgICB0aGlzLmFwcGVuZFRvS25vd2xlZGdlQmFzZSh2aWRlbyk7XG4gICAgcmV0dXJuIHJlcG9ydEZpbGU7XG4gIH1cblxuICBwcml2YXRlIGFwcGVuZFRvS25vd2xlZGdlQmFzZSh2aWRlbzogVmlkZW9FbnRyeSk6IHZvaWQge1xuICAgIGNvbnN0IGVudHJ5SWQgPSBgdmlkZW8tYW5hbHlzaXMtJHt2aWRlby52aWRlb0lkfWA7XG4gICAgY29uc3Qgc2FmZVRpdGxlID0gdmlkZW8udGl0bGUucmVwbGFjZSgvW15hLXpBLVowLTldL2csICdfJykuc3Vic3RyaW5nKDAsIDUwKTtcbiAgICBjb25zdCBhbHBoYWJldCA9ICcxMjM0NTY3ODlBQkNERUZHSEpLTE1OUFFSU1RVVldYWVphYmNkZWZnaGlqa21ub3BxcnN0dXZ3eHl6JztcbiAgICBsZXQgbnVtID0gdmlkZW8uaW5kZXg7XG4gICAgbGV0IGlkQ29kZSA9ICcnO1xuICAgIHdoaWxlIChudW0gPiAwKSB7XG4gICAgICBpZENvZGUgPSBhbHBoYWJldFtudW0gJSA1OF0gKyBpZENvZGU7XG4gICAgICBudW0gPSBNYXRoLmZsb29yKG51bSAvIDU4KTtcbiAgICB9XG4gICAgY29uc3QgaWROdW1iZXIgPSBgSUQjOiR7aWRDb2RlIHx8IGFscGhhYmV0WzBdfWA7XG5cbiAgICBjb25zdCBjb21wb3VuZGluZ0VudHJ5ID0ge1xuICAgICAgaWQ6IGVudHJ5SWQsXG4gICAgICB0aXRsZTogdmlkZW8udGl0bGUsXG4gICAgICBjYXRlZ29yeTogJ3ZpZGVvLWFuYWx5c2lzJyxcbiAgICAgIGNvbnRlbnQ6IHZpZGVvLmFuYWx5c2lzPy5zdW1tYXJ5IHx8ICdObyBzdW1tYXJ5JyxcbiAgICAgIHZpc3VhbF9pbnRlbGxpZ2VuY2U6IHZpZGVvLmFuYWx5c2lzPy52aXN1YWxDb250ZXh0RmxhZ3MgfHwgW10sXG4gICAgICBiYWNrbGlua3M6IFtcbiAgICAgICAgLi4uKHZpZGVvLmFuYWx5c2lzPy5haUNvbmNlcHRzIHx8IFtdKSxcbiAgICAgICAgLi4uKHZpZGVvLmFuYWx5c2lzPy50ZWNobmljYWxEZXRhaWxzIHx8IFtdKSxcbiAgICAgIF0sXG4gICAgICBtZXRhZGF0YToge1xuICAgICAgICBhZ2VudElkOiAndHJhbnNjcmlwdC1wcm9jZXNzb3ItdjMnLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgdmlkZW9JZDogdmlkZW8udmlkZW9JZCxcbiAgICAgICAgdXJsOiB2aWRlby51cmwsXG4gICAgICAgIHF1YWxpdHlTY29yZTogdmlkZW8uYW5hbHlzaXM/LnF1YWxpdHlTY29yZSB8fCAwLFxuICAgICAgICBpZE51bWJlcjogaWROdW1iZXIsXG4gICAgICB9LFxuICAgIH07XG5cbiAgICBjb25zdCB3aWtpSW5ib3hEaXIgPSBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKHRoaXMuc3RhdGVGaWxlUGF0aCksICd3aWtpLWluYm94Jyk7XG4gICAgZnMubWtkaXJTeW5jKHdpa2lJbmJveERpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgZnMud3JpdGVGaWxlU3luYyhcbiAgICAgIHBhdGguam9pbih3aWtpSW5ib3hEaXIsIGAke2VudHJ5SWR9Lmpzb25gKSxcbiAgICAgIEpTT04uc3RyaW5naWZ5KGNvbXBvdW5kaW5nRW50cnksIG51bGwsIDIpXG4gICAgKTtcblxuICAgIGNvbnN0IGxlZ2FjeUVudHJ5ID0gYFxcbi0tLVxcblxcbiMjICMke3ZpZGVvLmluZGV4fTogJHt2aWRlby50aXRsZX1cXG4qKlVSTCoqOiAke3ZpZGVvLnVybH1cXG4qKlJlc291cmNlIFBvaW50ZXIqKjogdHJwOi8vd2lraS1pbmJveC8ke2VudHJ5SWR9Lmpzb25cXG5cXG4jIyMgU3VtbWFyeVxcbiR7dmlkZW8uYW5hbHlzaXM/LnN1bW1hcnkgfHwgJ05vIHN1bW1hcnknfVxcblxcbiMjIyBWaXN1YWwgRmluZGluZ3NcXG4keyh2aWRlby5hbmFseXNpcz8udmlzdWFsQ29udGV4dEZsYWdzIHx8IFtdKS5tYXAoKGYpID0+IGAtIFske3RoaXMuZm9ybWF0RHVyYXRpb24oZi50aW1lc3RhbXApfV0gJHtmLmNvbnRleHR9YCkuam9pbignXFxuJykgfHwgJy0gTm9uZSd9XFxuXFxuYDtcbiAgICBmcy5hcHBlbmRGaWxlU3luYyh0aGlzLmtub3dsZWRnZUJhc2VGaWxlLCBsZWdhY3lFbnRyeSk7XG4gIH1cblxuICBhc3luYyBwcm9jZXNzVmlkZW8odmlkZW86IFZpZGVvRW50cnkpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodmlkZW8uc3RhdHVzID09PSAnY29tcGxldGVkJyB8fCB2aWRlby5zdGF0dXMgPT09ICdza2lwcGVkJykgcmV0dXJuIHRydWU7XG4gICAgaWYgKHZpZGVvLnByb2Nlc3NpbmdBdHRlbXB0cyA+PSAzKSB7XG4gICAgICB2aWRlby5zdGF0dXMgPSAnc2tpcHBlZCc7XG4gICAgICB0aGlzLnN0YXRlLnN0YXRzLnNraXBwZWQrKztcbiAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMuZW5zdXJlQnJvd3NlckhlYWx0aCgpO1xuICAgIGNvbnNvbGUubG9nKGBcXG7ilZDilZDilZDilZAgVmlkZW8gIyR7dmlkZW8uaW5kZXh9OiAke3ZpZGVvLnRpdGxlfSDilZDilZDilZDilZBcXG5gKTtcbiAgICB2aWRlby5wcm9jZXNzaW5nQXR0ZW1wdHMrKztcbiAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGlmICghdmlkZW8ubWV0YWRhdGEpIHtcbiAgICAgICAgbGV0IGR1cmF0aW9uID0gMDtcbiAgICAgICAgbGV0IGR1cmF0aW9uRm9ybWF0dGVkID0gJzA6MDAnO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGR1clN0ciA9IGV4ZWNTeW5jKGB5dC1kbHAgLS1nZXQtZHVyYXRpb24gJHt2aWRlby51cmx9YCkudG9TdHJpbmcoKS50cmltKCk7XG4gICAgICAgICAgY29uc3QgcGFydHMgPSBkdXJTdHIuc3BsaXQoJzonKS5tYXAoTnVtYmVyKTtcbiAgICAgICAgICBpZiAocGFydHMubGVuZ3RoID09PSAyKSBkdXJhdGlvbiA9IHBhcnRzWzBdICogNjAgKyBwYXJ0c1sxXTtcbiAgICAgICAgICBlbHNlIGlmIChwYXJ0cy5sZW5ndGggPT09IDMpIGR1cmF0aW9uID0gcGFydHNbMF0gKiAzNjAwICsgcGFydHNbMV0gKiA2MCArIHBhcnRzWzJdO1xuICAgICAgICAgIGlmIChkdXJhdGlvbiA+IDApIGR1cmF0aW9uRm9ybWF0dGVkID0gZHVyU3RyO1xuICAgICAgICB9IGNhdGNoIChlKSB7fVxuXG4gICAgICAgIHZpZGVvLm1ldGFkYXRhID0gKGF3YWl0IHRoaXMuZmV0Y2hFbnJpY2hlZE1ldGFkYXRhKHZpZGVvKSkgfHwgdW5kZWZpbmVkO1xuICAgICAgICBpZiAodmlkZW8ubWV0YWRhdGEpIHtcbiAgICAgICAgICBpZiAoZHVyYXRpb24gPiAwKSB7XG4gICAgICAgICAgICB2aWRlby5tZXRhZGF0YS5kdXJhdGlvbiA9IGR1cmF0aW9uO1xuICAgICAgICAgICAgdmlkZW8ubWV0YWRhdGEuZHVyYXRpb25Gb3JtYXR0ZWQgPSBkdXJhdGlvbkZvcm1hdHRlZDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5zdGF0ZS5zdGF0cy5tZXRhZGF0YUNvbXBsZXRlKys7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF2aWRlby50cmFuc2NyaXB0KSB7XG4gICAgICAgIHZpZGVvLnRyYW5zY3JpcHQgPSAoYXdhaXQgdGhpcy5leHRyYWN0VHJhbnNjcmlwdERpcmVjdCh2aWRlbykpIHx8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHZpZGVvLnRyYW5zY3JpcHQpIHRoaXMuc3RhdGUuc3RhdHMudHJhbnNjcmlwdHNFeHRyYWN0ZWQrKztcbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHZpZGVvLnRyYW5zY3JpcHQpIHtcbiAgICAgICAgLy8gVjM6IFZpc3VhbCBGcmFtZSBDYXB0dXJlIHdpdGggVmVyaWZpY2F0aW9uIExvb3BcbiAgICAgICAgbGV0IGF0dGVtcHRzID0gMDtcbiAgICAgICAgbGV0IHZpc3VhbFV0aWxpdHkgPSAwO1xuXG4gICAgICAgIHdoaWxlIChhdHRlbXB0cyA8IDIgJiYgdmlzdWFsVXRpbGl0eSA8IDUpIHtcbiAgICAgICAgICBpZiAoIXZpZGVvLmZyYW1lcyB8fCBhdHRlbXB0cyA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCB0aGlzLmNvbnRleHQhLm5ld1BhZ2UoKTtcbiAgICAgICAgICAgIGF3YWl0IHBhZ2UuZ290byh2aWRlby51cmwsIHsgd2FpdFVudGlsOiAnbG9hZCcsIHRpbWVvdXQ6IDQ1MDAwIH0pO1xuICAgICAgICAgICAgLy8gU2hpZnQgb2Zmc2V0IG9uIHNlY29uZCBhdHRlbXB0XG4gICAgICAgICAgICB2aWRlby5mcmFtZXMgPSBhd2FpdCB0aGlzLmNhcHR1cmVGcmFtZXMocGFnZSwgdmlkZW8sIGF0dGVtcHRzICogNSk7XG4gICAgICAgICAgICBhd2FpdCBwYWdlLmNsb3NlKCk7XG4gICAgICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh2aWRlby5mcmFtZXMgJiYgIXZpZGVvLmFuYWx5c2lzKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW3YzXSDwn5SNIFZlcmlmeWluZyB2aXN1YWwgdXRpbGl0eSAoQXR0ZW1wdCAke2F0dGVtcHRzICsgMX0pLi4uYCk7XG4gICAgICAgICAgICB2aWRlby5hbmFseXNpcyA9IChhd2FpdCB0aGlzLmFuYWx5emVXaXRoQUkodmlkZW8pKSB8fCB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgIHZpc3VhbFV0aWxpdHkgPSB2aWRlby5hbmFseXNpcz8udmlzdWFsVXRpbGl0eVNjb3JlIHx8IDA7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW3YzXSDwn5OKIFZpc3VhbCBVdGlsaXR5IFNjb3JlOiAke3Zpc3VhbFV0aWxpdHl9LzEwYCk7XG5cbiAgICAgICAgICAgIGlmICh2aXN1YWxVdGlsaXR5IDwgNSAmJiBhdHRlbXB0cyA8IDEpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coYFt2M10g8J+UhCBMb3cgdmlzdWFsIHV0aWxpdHkgZGV0ZWN0ZWQuIFJldHJ5aW5nIHdpdGggdGVtcG9yYWwgc2hpZnQuLi5gKTtcbiAgICAgICAgICAgICAgYXR0ZW1wdHMrKztcbiAgICAgICAgICAgICAgdmlkZW8uYW5hbHlzaXMgPSB1bmRlZmluZWQ7IC8vIFJlc2V0IGZvciByZXRyeVxuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmlkZW8uYW5hbHlzaXMpIHRoaXMuc3RhdGUuc3RhdHMuYW5hbHl6ZWQrKztcbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHZpZGVvLmFuYWx5c2lzKSB7XG4gICAgICAgIHRoaXMuc2F2ZVJlcG9ydCh2aWRlbyk7XG4gICAgICAgIHZpZGVvLnN0YXR1cyA9ICdjb21wbGV0ZWQnO1xuICAgICAgICB0aGlzLnN0YXRlLnN0YXRzLmNvbXBsZXRlZCsrO1xuICAgICAgICAvLyBWMzogUHJ1bmUgZnJhbWVzIGltbWVkaWF0ZWx5IGFmdGVyIHN1Y2Nlc3NmdWwgYW5hbHlzaXNcbiAgICAgICAgdGhpcy5wcnVuZUZyYW1lcyh2aWRlbyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2aWRlby5zdGF0dXMgPSAnZXJyb3InO1xuICAgICAgICB0aGlzLnN0YXRlLnN0YXRzLmVycm9ycysrO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgcmV0dXJuIHZpZGVvLnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCc7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBbdjNdIEVycm9yOmAsIGUubWVzc2FnZSk7XG4gICAgICB2aWRlby5zdGF0dXMgPSAnZXJyb3InO1xuICAgICAgdGhpcy5zdGF0ZS5zdGF0cy5lcnJvcnMrKztcbiAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgcnVuKGxpYnJhcnlQYXRoOiBzdHJpbmcsIHN0YXJ0SW5kZXg6IG51bWJlciA9IDY5MiwgZW5kSW5kZXg6IG51bWJlciA9IDY0OCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnNvbGUubG9nKGDwn5qAIFYzIFBpcGVsaW5lOiAjJHtzdGFydEluZGV4fSDihpIgIyR7ZW5kSW5kZXh9IHwgTW9kZWw6ICR7TVVMVElNT0RBTF9NT0RFTH1gKTtcbiAgICBhd2FpdCB0aGlzLmluaXRpYWxpemUoKTtcbiAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGxpYnJhcnlQYXRoLCAndXRmLTgnKTtcbiAgICBjb25zdCB2aWRlb3M6IFZpZGVvRW50cnlbXSA9IFtdO1xuICAgIGNvbnN0IHJvd1JlZ2V4ID1cbiAgICAgIC88dHI+XFxzKjx0ZFtePl0qPlxccyooXFxkKylcXHMqPFxcL3RkPlxccyo8dGRbXj5dKj5cXHMqPGFcXHMraHJlZj1cIihbXlwiXSspXCJbXj5dKj4oW148XSspPFxcL2E+XFxzKjxcXC90ZD4vZztcbiAgICBsZXQgbWF0Y2g7XG4gICAgd2hpbGUgKChtYXRjaCA9IHJvd1JlZ2V4LmV4ZWMoY29udGVudCkpICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBpbmRleCA9IHBhcnNlSW50KG1hdGNoWzFdKTtcbiAgICAgIGlmIChpbmRleCA8PSBzdGFydEluZGV4ICYmIGluZGV4ID49IGVuZEluZGV4KSB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5zdGF0ZS5xdWV1ZS5maW5kKCh2KSA9PiB2LmluZGV4ID09PSBpbmRleCk7XG4gICAgICAgIGlmIChleGlzdGluZykgdmlkZW9zLnB1c2goZXhpc3RpbmcpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgdmlkZW9zLnB1c2goe1xuICAgICAgICAgICAgaW5kZXgsXG4gICAgICAgICAgICB1cmw6IG1hdGNoWzJdLFxuICAgICAgICAgICAgdGl0bGU6IG1hdGNoWzNdLnRyaW0oKSxcbiAgICAgICAgICAgIHZpZGVvSWQ6IHRoaXMuZXh0cmFjdFZpZGVvSWQobWF0Y2hbMl0pIHx8ICcnLFxuICAgICAgICAgICAgc3RhdHVzOiAncGVuZGluZycsXG4gICAgICAgICAgICBwcm9jZXNzaW5nQXR0ZW1wdHM6IDAsXG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHZpZGVvcy5zb3J0KChhLCBiKSA9PiBiLmluZGV4IC0gYS5pbmRleCk7XG4gICAgdGhpcy5zdGF0ZS5xdWV1ZSA9IHZpZGVvcztcbiAgICB0aGlzLnN0YXRlLnN0YXRzLnRvdGFsVmlkZW9zID0gdmlkZW9zLmxlbmd0aDtcbiAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuXG4gICAgZm9yIChjb25zdCB2aWRlbyBvZiB2aWRlb3MpIHtcbiAgICAgIHRoaXMuc3RhdGUuY3VycmVudEluZGV4ID0gdmlkZW8uaW5kZXg7XG4gICAgICBhd2FpdCB0aGlzLnByb2Nlc3NWaWRlbyh2aWRlbyk7XG4gICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocikgPT4gc2V0VGltZW91dChyLCAzMDAwKSk7XG4gICAgfVxuICAgIGlmICh0aGlzLmNvbnRleHQpIGF3YWl0IHRoaXMuY29udGV4dC5jbG9zZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBkb3dubG9hZFRyYW5zY3JpcHRXaXRoWXREbHAodXJsOiBzdHJpbmcsIHZpZGVvSWQ6IHN0cmluZyk6IFRyYW5zY3JpcHRTZWdtZW50W10gfCBudWxsIHtcbiAgICBjb25zdCB0ZW1wRGlyID0gcGF0aC5qb2luKHBhdGguZGlybmFtZSh0aGlzLnJlcG9ydHNEaXIpLCAndGVtcF9zdWJzJyk7XG4gICAgZnMubWtkaXJTeW5jKHRlbXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGNvbnN0IG91dHB1dEZpbGVCYXNlID0gcGF0aC5qb2luKHRlbXBEaXIsIHZpZGVvSWQpO1xuICAgIHRyeSB7XG4gICAgICBleGVjU3luYyhcbiAgICAgICAgYHl0LWRscCAtLXdyaXRlLWF1dG8tc3ViIC0td3JpdGUtc3ViIC0tc3ViLWxhbmcgZW4gLS1za2lwLWRvd25sb2FkIC0tb3V0cHV0IFwiJHtvdXRwdXRGaWxlQmFzZX1cIiBcIiR7dXJsfVwiYCxcbiAgICAgICAgeyBzdGRpbzogJ2lnbm9yZScgfVxuICAgICAgKTtcbiAgICAgIGNvbnN0IGZpbGVzID0gZnMucmVhZGRpclN5bmModGVtcERpcik7XG4gICAgICBjb25zdCBzdWJGaWxlID0gZmlsZXMuZmluZCgoZikgPT4gZi5zdGFydHNXaXRoKHZpZGVvSWQpICYmIGYuZW5kc1dpdGgoJy52dHQnKSk7XG4gICAgICBpZiAoIXN1YkZpbGUpIHJldHVybiBudWxsO1xuICAgICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4odGVtcERpciwgc3ViRmlsZSksICd1dGYtOCcpO1xuICAgICAgY29uc3Qgc2VnbWVudHM6IFRyYW5zY3JpcHRTZWdtZW50W10gPSBbXTtcbiAgICAgIGNvbnN0IGJsb2NrcyA9IGNvbnRlbnQuc3BsaXQoL1xcblxccj9cXG4vKTtcbiAgICAgIGZvciAoY29uc3QgYmxvY2sgb2YgYmxvY2tzKSB7XG4gICAgICAgIGNvbnN0IHRpbWVNYXRjaCA9IGJsb2NrLm1hdGNoKFxuICAgICAgICAgIC8oXFxkezJ9KTooXFxkezJ9KTooXFxkezJ9KVxcLihcXGR7M30pXFxzLS0+XFxzKFxcZHsyfSk6KFxcZHsyfSk6KFxcZHsyfSlcXC4oXFxkezN9KS9cbiAgICAgICAgKTtcbiAgICAgICAgaWYgKHRpbWVNYXRjaCkge1xuICAgICAgICAgIGNvbnN0IGxpbmVzID0gYmxvY2suc3BsaXQoJ1xcbicpO1xuICAgICAgICAgIGNvbnN0IHRJZHggPSBsaW5lcy5maW5kSW5kZXgoKGwpID0+IGwuaW5jbHVkZXMoJy0tPicpKTtcbiAgICAgICAgICBpZiAodElkeCAhPT0gLTEgJiYgdElkeCA8IGxpbmVzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIGNvbnN0IHRleHQgPSBsaW5lc1xuICAgICAgICAgICAgICAuc2xpY2UodElkeCArIDEpXG4gICAgICAgICAgICAgIC5qb2luKCcgJylcbiAgICAgICAgICAgICAgLnJlcGxhY2UoLzxbXj5dKj4vZywgJycpXG4gICAgICAgICAgICAgIC50cmltKCk7XG4gICAgICAgICAgICBpZiAodGV4dCAmJiB0ZXh0ICE9PSAnYWxpZ246c3RhcnQgcG9zaXRpb246MCUnKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHN0YXJ0U2VjID1cbiAgICAgICAgICAgICAgICBwYXJzZUludCh0aW1lTWF0Y2hbMV0pICogMzYwMCArXG4gICAgICAgICAgICAgICAgcGFyc2VJbnQodGltZU1hdGNoWzJdKSAqIDYwICtcbiAgICAgICAgICAgICAgICBwYXJzZUludCh0aW1lTWF0Y2hbM10pICtcbiAgICAgICAgICAgICAgICBwYXJzZUludCh0aW1lTWF0Y2hbNF0pIC8gMTAwMDtcbiAgICAgICAgICAgICAgY29uc3QgZW5kU2VjID1cbiAgICAgICAgICAgICAgICBwYXJzZUludCh0aW1lTWF0Y2hbNV0pICogMzYwMCArXG4gICAgICAgICAgICAgICAgcGFyc2VJbnQodGltZU1hdGNoWzZdKSAqIDYwICtcbiAgICAgICAgICAgICAgICBwYXJzZUludCh0aW1lTWF0Y2hbN10pICtcbiAgICAgICAgICAgICAgICBwYXJzZUludCh0aW1lTWF0Y2hbOF0pIC8gMTAwMDtcbiAgICAgICAgICAgICAgc2VnbWVudHMucHVzaCh7IHN0YXJ0OiBzdGFydFNlYywgZHVyYXRpb246IGVuZFNlYyAtIHN0YXJ0U2VjLCB0ZXh0IH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZnMudW5saW5rU3luYyhwYXRoLmpvaW4odGVtcERpciwgc3ViRmlsZSkpO1xuICAgICAgcmV0dXJuIHNlZ21lbnRzO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBtYWluKCkge1xuICBjb25zdCBhcmdzID0gcHJvY2Vzcy5hcmd2LnNsaWNlKDIpO1xuICBjb25zdCBzdGFydEFyZyA9IGFyZ3MuZmluZCgoYSkgPT4gYS5zdGFydHNXaXRoKCctLXN0YXJ0PScpKTtcbiAgY29uc3QgZW5kQXJnID0gYXJncy5maW5kKChhKSA9PiBhLnN0YXJ0c1dpdGgoJy0tZW5kPScpKTtcbiAgY29uc3Qgc3RhcnQgPSBzdGFydEFyZyA/IHBhcnNlSW50KHN0YXJ0QXJnLnNwbGl0KCc9JylbMV0pIDogNjkyO1xuICBjb25zdCBlbmQgPSBlbmRBcmcgPyBwYXJzZUludChlbmRBcmcuc3BsaXQoJz0nKVsxXSkgOiA2NDg7XG4gIGNvbnN0IGxpYnJhcnlQYXRoID1cbiAgICAnL1VzZXJzL2RhbmllbGdvbGRiZXJnL0Rlc2t0b3AvQTEtSW50ZXItTExNLUNvbS9teS1haS1rbm93bGVkZ2UtYmFzZS92aWRlby1saWJyYXJ5L2FpX3ZpZGVvX2xpYnJhcnkuaHRtbCc7XG4gIGNvbnN0IGluZ2VzdFByb2Nlc3NvciA9IG5ldyBUcmFuc2NyaXB0UHJvY2Vzc29yVjMoKTtcbiAgYXdhaXQgaW5nZXN0UHJvY2Vzc29yLnJ1bihsaWJyYXJ5UGF0aCwgc3RhcnQsIGVuZCk7XG59XG5cbm1haW4oKS5jYXRjaChjb25zb2xlLmVycm9yKTtcbiJdfQ==