"use strict";
/**
 * Transcript Processor v2 - Optimized Edition
 *
 * Improvements over v1:
 * 1. Uses latest Gemini 3 Flash model (gemini-3-flash-preview)
 * 2. Fresh browser page for EACH operation
 * 3. Better JSON extraction from AI responses
 * 4. Maximized Google Search AI mode queries
 * 5. Direct transcript extraction via API (no YouTube page visit when possible)
 * 6. Centralized knowledge base consolidation
 * 7. Proper status tracking to prevent loops
 * 8. Success metrics and quality evaluation
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
exports.FEDERATED_BASE58_ALPHABET = void 0;
exports.generateFederatedIdNumber = generateFederatedIdNumber;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const playwright_1 = require("playwright");
// Latest available model as of Jan 2025/2026
const GEMINI_MODEL = 'gemini-3-flash-preview';
const AI_STUDIO_URL = `https://aistudio.google.com/app/prompts/new_chat?model=${GEMINI_MODEL}`;
const ANALYSIS_PROMPT = `You are analyzing a YouTube video transcript. Extract and structure the following information as valid JSON only (no markdown, no extra text).

Return ONLY this JSON structure:
{
  "summary": "2-3 sentence summary of the video content",
  "keyPoints": ["point 1", "point 2", ...],
  "aiConcepts": ["AI concept 1", "AI concept 2", ...],
  "technicalDetails": ["tool/framework 1", "implementation detail", ...],
  "visualContextFlags": [
    {"timestamp": 120, "reason": "Code demo", "context": "Shows Python implementation"}
  ]
}

If the video is not about AI/tech, set aiConcepts and technicalDetails to empty arrays but still extract keyPoints.

TRANSCRIPT:
`;
class TranscriptProcessorV2 {
    constructor(targetPhase = 'analysis') {
        this.context = null;
        this.targetPhase = 'analysis';
        this.targetPhase = targetPhase;
        // Determine data directory (handle both package and root scenarios)
        const packageDataDir = path.join(__dirname, '../data');
        const rootDataDir = path.join(__dirname, '../../../data');
        // Prefer root data dir if it exists (previous behavior), otherwise package data
        const dataDir = fs.existsSync(rootDataDir) ? rootDataDir : packageDataDir;
        this.stateFilePath = path.join(dataDir, 'transcript-v2-state.json');
        this.reportsDir = path.join(dataDir, 'video-reports');
        this.transcriptsDir = path.join(dataDir, 'video-transcripts');
        this.knowledgeBaseFile = path.join(dataDir, 'AI_Knowledge_Base.md');
        console.log(`[v2] Using data directory: ${dataDir}`);
        // Ensure directories exist
        fs.mkdirSync(this.reportsDir, { recursive: true });
        fs.mkdirSync(this.transcriptsDir, { recursive: true });
        fs.mkdirSync(path.join(dataDir, 'temp_subs'), { recursive: true });
        this.state = this.loadState();
    }
    loadState() {
        try {
            if (fs.existsSync(this.stateFilePath)) {
                const state = JSON.parse(fs.readFileSync(this.stateFilePath, 'utf-8'));
                // Migrate old state if needed
                if (state.version !== '2.0') {
                    console.log('[v2] Migrating state to v2 format...');
                    state.version = '2.0';
                    state.queue = state.queue.map((v) => ({
                        ...v,
                        processingAttempts: v.processingAttempts || 0,
                    }));
                }
                return state;
            }
        }
        catch (e) {
            console.log('[v2] Creating new state file');
        }
        return {
            version: '2.0',
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
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
            /youtube\.com\/v\/([^&\s?]+)/,
        ];
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }
        return null;
    }
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    decodeHtmlEntities(text) {
        return text
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&#x27;/g, "'")
            .replace(/&#x2F;/g, '/');
    }
    async initialize() {
        // Use a NEW profile to allow trying a different account
        const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-clean');
        console.log('[v2] 🚀 Launching Chrome (using clean login session)...');
        fs.mkdirSync(profileDir, { recursive: true });
        this.context = await playwright_1.chromium.launchPersistentContext(profileDir, {
            headless: false,
            channel: 'chrome',
            args: [
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-blink-features=AutomationControlled',
                '--window-size=1280,800',
            ],
            viewport: null,
            ignoreDefaultArgs: ['--enable-automation'],
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        });
        console.log('[v2] ✅ Browser ready');
    }
    // Browser health check - ensures browser context is alive
    async ensureBrowserHealth() {
        var _a;
        try {
            if (!this.context) {
                console.warn('[v2] ⚠️ Browser context is null, reinitializing...');
                await this.initialize();
                return true;
            }
            // Try to check if context is alive by getting pages
            const pages = await this.context.pages();
            console.log(`[v2] 🏥 Browser health check: ${pages.length} pages open`);
            // If too many pages accumulated (>50), close them
            if (pages.length > 50) {
                console.warn(`[v2] ⚠️ Too many pages open (${pages.length}), cleaning up...`);
                for (const page of pages) {
                    try {
                        await page.close();
                    }
                    catch (e) {
                        // Ignore close errors
                    }
                }
            }
            return true;
        }
        catch (error) {
            console.error('[v2] ❌ Browser health check failed:', error);
            console.log('[v2] 🔄 Reinitializing browser...');
            try {
                await ((_a = this.context) === null || _a === void 0 ? void 0 : _a.close());
            }
            catch (e) {
                /* ignore */
            }
            await this.initialize();
            return true;
        }
    }
    // Helper for human-like delays
    async humanDelay(min, max, page) {
        const delay = Math.floor(Math.random() * (max - min) + min);
        await page.waitForTimeout(delay);
    }
    // Helper for human-like mouse movement
    async humanMove(page, selector) {
        const element = await page.$(selector);
        if (!element)
            return;
        const box = await element.boundingBox();
        if (!box)
            return;
        // Start from random position
        await page.mouse.move(Math.floor(Math.random() * 500), Math.floor(Math.random() * 500));
        // Move to target with "overshoot" effect simulation (simple steps)
        const targetX = box.x + box.width / 2;
        const targetY = box.y + box.height / 2;
        await page.mouse.move(targetX, targetY, { steps: 25 });
    }
    async solveGoogleCaptcha(page) {
        console.log('[v2] ⚠️ Detected Google Robot Check. Attempting to solve...');
        // 1. Look for the iframe
        const frames = page.frames();
        const recaptchaFrame = frames.find((f) => f.url().includes('google.com/recaptcha'));
        if (recaptchaFrame) {
            console.log('[v2] Found reCAPTCHA frame. Clicking checkbox...');
            const checkbox = await recaptchaFrame.$('.recaptcha-checkbox-border, #recaptcha-anchor');
            if (checkbox) {
                await this.humanDelay(1000, 3000, page);
                try {
                    // Use Playwright's native handling which correctly maps iframe coordinates
                    await checkbox.hover();
                    await this.humanDelay(200, 500, page);
                    await checkbox.click({ delay: Math.random() * 100 + 50 });
                }
                catch (e) {
                    console.log('[v2] Click failed, trying force click', e);
                    await checkbox.dispatchEvent('click');
                }
                console.log('[v2] Clicked checkbox. Waiting for outcome...');
                await page.waitForTimeout(5000);
            }
            else {
                console.log('[v2] Could not find checkbox inside frame.');
                // Take a screenshot for valid debugging
                await page.screenshot({ path: path.join(this.reportsDir, 'captcha_fail.png') });
            }
        }
        else {
            // Fallback: looking for normal buttons if it's not an iframe captcha
            const button = await page.$('#L2AGLb, [aria-label="I agree"], button:has-text("I agree")');
            if (button) {
                console.log('[v2] Found simple consent button. Clicking...');
                await this.humanMove(page, '#L2AGLb'); // move to consent
                await button.click();
            }
        }
        // Check if we are still stuck
        if (page.url().includes('google.com/sorry/')) {
            console.log('[v2] Still on sorry page. Waiting for user intervention or IP rotation...');
            // In a real headless scenario, we'd need a captcha service here.
            // For now, we wait a bit to see if it clears or if we can proceed.
            await page.waitForTimeout(5000);
        }
    }
    async fetchEnrichedMetadata(video) {
        if (!this.context) {
            throw new Error('Browser not initialized');
        }
        console.log(`[v2] 📊 Enriched metadata fetch: ${video.title}`);
        const page = await this.context.newPage();
        try {
            const query = `YouTube video "${video.url}" complete information: duration, channel, description, views, publish date, topics, summary`;
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&udm=50`;
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            // Check for Google Robot Check
            if (page.url().includes('google.com/sorry/') ||
                (await page.$('text="unusual traffic"')) ||
                (await page.$('iframe[src*="recaptcha"]'))) {
                await this.solveGoogleCaptcha(page);
            }
            await page.waitForTimeout(5000); // Let AI mode generate response
            const pageText = await page.evaluate(() => document.body.innerText);
            let duration = 0;
            const durationPatterns = [
                /(\d+)\s*hours?\s*,?\s*(\d+)?\s*minutes?\s*,?\s*(\d+)?\s*seconds?/i,
                /(\d+)\s*minutes?\s*,?\s*(\d+)?\s*seconds?/i,
                /(\d+):(\d+):(\d+)/,
                /(\d+):(\d+)/,
                /duration[:\s]*(\d+):(\d+)/i,
            ];
            for (const pattern of durationPatterns) {
                const match = pageText.match(pattern);
                if (match) {
                    if (match[0].toLowerCase().includes('hour')) {
                        duration =
                            parseInt(match[1]) * 3600 +
                                parseInt(match[2] || '0') * 60 +
                                parseInt(match[3] || '0');
                    }
                    else if (match[0].toLowerCase().includes('minute')) {
                        duration = parseInt(match[1]) * 60 + parseInt(match[2] || '0');
                    }
                    else if (match.length === 4) {
                        duration = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]);
                    }
                    else if (match.length === 3) {
                        duration = parseInt(match[1]) * 60 + parseInt(match[2]);
                    }
                    break;
                }
            }
            const channelPatterns = [
                /(?:by|channel|from)\s*([A-Za-z0-9\s\-_]+?)(?:\s*[·•\-|]|\s*\d|views|subscribers|$)/i,
                /uploaded by\s*([A-Za-z0-9\s\-_]+)/i,
            ];
            let channel;
            for (const pattern of channelPatterns) {
                const match = pageText.match(pattern);
                if (match) {
                    channel = match[1].trim().substring(0, 50);
                    break;
                }
            }
            const viewMatch = pageText.match(/(\d+(?:,\d+)*(?:\.\d+)?[KMB]?)\s*views?/i);
            const datePatterns = [
                /(?:published|uploaded|posted)\s*(?:on\s*)?([A-Za-z]+\s+\d+,?\s*\d{4})/i,
                /(\d+\s*(?:days?|weeks?|months?|years?)\s*ago)/i,
            ];
            let publishDate;
            for (const pattern of datePatterns) {
                const match = pageText.match(pattern);
                if (match) {
                    publishDate = match[1];
                    break;
                }
            }
            const descMatch = pageText.match(/(?:description|about)[:\s]*([^.]+\.[^.]+\.)/i);
            const summaryMatch = pageText.match(/(?:summary|overview|this video)[:\s]*([^.]+\.[^.]+\.)/i);
            const metadata = {
                duration,
                durationFormatted: this.formatDuration(duration),
                channel,
                viewCount: viewMatch ? viewMatch[1] : undefined,
                publishDate,
                description: descMatch ? descMatch[1].substring(0, 500) : undefined,
                summary: summaryMatch ? summaryMatch[1].substring(0, 300) : undefined,
            };
            await page.close();
            console.log(`[v2] ✅ Metadata: ${metadata.durationFormatted} | ${metadata.channel || 'Unknown channel'}`);
            return metadata;
        }
        catch (e) {
            console.error(`[v2] Error in metadata fetch:`, e);
            await page.close();
            return null;
        }
    }
    async extractTranscriptDirect(video) {
        const safeTitle = video.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
        // Check multiple possible transcript locations
        const candidatePaths = [
            path.join(this.transcriptsDir, `${video.index}_${video.videoId}.txt`),
            path.join(this.transcriptsDir, `${video.index}_${safeTitle}.txt`),
            path.join('/Users/<owner>/Desktop/A1-Inter-LLM-Com/my-ai-knowledge-base/video-transcripts', `transcript_${video.index}_${safeTitle}.txt`),
            path.join('/Users/<owner>/Desktop/A1-Inter-LLM-Com/my-ai-knowledge-base/video-transcripts', `${video.index}_${safeTitle}.txt`),
            path.join('/Users/<owner>/Desktop/A1-Inter-LLM-Com/my-ai-knowledge-base/transcripts', `${video.index}_${safeTitle}.txt`),
            path.join('/Users/<owner>/Desktop/A1-Inter-LLM-Com/my-ai-knowledge-base/transcripts', `${video.index}_Manus_is_out_of_control.txt`), // Special case handling
        ];
        for (const transcriptFile of candidatePaths) {
            if (fs.existsSync(transcriptFile)) {
                console.log(`[v2] ✅ Using existing transcript file: ${path.basename(transcriptFile)}`);
                const content = fs.readFileSync(transcriptFile, 'utf8');
                return content
                    .split('\n')
                    .filter((line) => line.trim())
                    .map((line, i) => ({
                    start: i * 5,
                    duration: 5,
                    text: line.replace(/^\[.*?\]\s*/, '').trim(),
                }));
            }
        }
        if (!this.context) {
            throw new Error('Browser not initialized');
        }
        console.log(`[v2] 📝 Transcript extraction: ${video.videoId}`);
        const page = await this.context.newPage();
        try {
            await page.goto(video.url, { waitUntil: 'load', timeout: 45000 });
            await page.waitForTimeout(3000);
            const captionData = await page.evaluate(() => {
                var _a, _b, _c;
                const win = window;
                if ((_c = (_b = (_a = win.ytInitialPlayerResponse) === null || _a === void 0 ? void 0 : _a.captions) === null || _b === void 0 ? void 0 : _b.playerCaptionsTracklistRenderer) === null || _c === void 0 ? void 0 : _c.captionTracks) {
                    const tracks = win.ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer.captionTracks;
                    const track = tracks.find((t) => t.languageCode === 'en') || tracks[0];
                    return (track === null || track === void 0 ? void 0 : track.baseUrl) || null;
                }
                const scripts = Array.from(document.querySelectorAll('script'));
                for (const script of scripts) {
                    const text = script.textContent || '';
                    if (text.includes('captionTracks')) {
                        const match = text.match(/"captionTracks":\s*\[(.*?)\]/);
                        if (match) {
                            try {
                                const tracksStr = '[' + match[1] + ']';
                                const tracks = JSON.parse(tracksStr);
                                if (tracks.length > 0) {
                                    const track = tracks.find((t) => t.languageCode === 'en') || tracks[0];
                                    return (track === null || track === void 0 ? void 0 : track.baseUrl) || null;
                                }
                            }
                            catch (e) { }
                        }
                    }
                }
                return null;
            });
            if (captionData) {
                console.log(`[v2] Found caption URL, fetching transcript...`);
                const captionPage = await this.context.newPage();
                await captionPage.goto(captionData, { waitUntil: 'load', timeout: 30000 });
                const xml = await captionPage.content();
                await captionPage.close();
                const segments = [];
                const textRegex = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([^<]*)<\/text>/g;
                let match;
                while ((match = textRegex.exec(xml)) !== null) {
                    segments.push({
                        start: parseFloat(match[1]),
                        duration: parseFloat(match[2]),
                        text: this.decodeHtmlEntities(match[3]),
                    });
                }
                if (segments.length > 0) {
                    await page.close();
                    console.log(`[v2] ✅ Extracted ${segments.length} transcript segments`);
                    return segments;
                }
            }
            console.log('[v2] Trying UI transcript panel...');
            try {
                const expandBtn = page.locator('#expand, tp-yt-paper-button#expand');
                if ((await expandBtn.count()) > 0) {
                    await expandBtn.first().click();
                    await page.waitForTimeout(1000);
                }
            }
            catch (e) { }
            try {
                const transcriptBtn = page.locator('[aria-label*="transcript"], button:has-text("transcript")');
                if ((await transcriptBtn.count()) > 0) {
                    await transcriptBtn.first().click();
                    await page.waitForTimeout(2000);
                }
            }
            catch (e) { }
            const uiSegments = await page.evaluate(() => {
                const result = [];
                const segments = document.querySelectorAll('ytd-transcript-segment-renderer');
                segments.forEach((seg) => {
                    var _a, _b;
                    const timeEl = seg.querySelector('.segment-timestamp');
                    const textEl = seg.querySelector('.segment-text');
                    if (timeEl && textEl) {
                        const time = ((_a = timeEl.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '0:00';
                        const text = ((_b = textEl.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || '';
                        const parts = time.split(':').map((p) => parseInt(p) || 0);
                        const seconds = parts.length === 3
                            ? parts[0] * 3600 + parts[1] * 60 + parts[2]
                            : parts[0] * 60 + (parts[1] || 0);
                        if (text) {
                            result.push({ start: seconds, duration: 0, text });
                        }
                    }
                });
                return result;
            });
            await page.close();
            if (uiSegments && uiSegments.length > 0) {
                for (let i = 0; i < uiSegments.length - 1; i++) {
                    uiSegments[i].duration = uiSegments[i + 1].start - uiSegments[i].start;
                }
                if (uiSegments.length > 0) {
                    uiSegments[uiSegments.length - 1].duration = 5;
                }
                console.log(`[v2] ✅ Extracted ${uiSegments.length} segments (UI)`);
                return uiSegments;
            }
            console.log('[v2] ⚠️ No transcript available via UI. Trying yt-dlp...');
            const fb = this.downloadTranscriptWithYtDlp(video.url, video.videoId);
            if (fb) {
                console.log(`[v2] ✅ yt-dlp success: ${fb.length} segments`);
                try {
                    await page.close();
                }
                catch (e) { }
                return fb;
            }
            console.log('[v2] ⚠️ No transcript available');
            return null;
        }
        catch (e) {
            console.error('[v2] Transcript error:', e);
            try {
                await page.close();
            }
            catch (x) { }
            return null;
        }
    }
    /**
     * Automates the process of linking a paid API key if detected as missing.
     * This prevents "Quota exceeded" errors on the free tier.
     */
    async ensurePaidApiKey(page) {
        console.log('[v2] 💳 Checking API Key connection...');
        try {
            // Look for the "No API Key" card or button
            const noKeyBtn = page
                .locator('.paid-api-key-card[aria-label="No API Key"]')
                .or(page.locator('button', { hasText: 'No API Key' }))
                .first();
            if (await noKeyBtn.isVisible()) {
                console.log('[v2] ⚠️ No API Key detected. Attempting to link "The New Fuse"...');
                await noKeyBtn.click();
                await page.waitForTimeout(2000);
                // 1. Select Project
                const projectSelect = page
                    .locator('mat-select[aria-label="Select a paid project"]')
                    .first();
                if (await projectSelect.isVisible()) {
                    await projectSelect.click();
                    await page.waitForTimeout(1000);
                    // Try to click "The New Fuse"
                    const fuseOption = page.locator('mat-option', { hasText: 'The New Fuse' }).first();
                    if (await fuseOption.isVisible()) {
                        await fuseOption.click();
                    }
                    else {
                        // Fallback: Click the first option
                        console.log('[v2] "The New Fuse" not found, selecting first available project.');
                        await page.locator('mat-option').first().click();
                    }
                    await page.waitForTimeout(1000);
                }
                // 2. Enable "Save paid API key" if not enabled
                const saveToggle = page
                    .locator('button[role="switch"][aria-labelledby="save-paid-api-key-label"]')
                    .or(page.locator('button[role="switch"]'))
                    .first();
                if (await saveToggle.isVisible()) {
                    const isChecked = await saveToggle.getAttribute('aria-checked');
                    if (isChecked !== 'true') {
                        console.log('[v2] Toggling "Save paid API key"...');
                        await saveToggle.click();
                        await page.waitForTimeout(500);
                    }
                }
                // 3. Confirm (Select key)
                const confirmBtn = page
                    .locator('button.ms-button-primary', { hasText: 'Select key' })
                    .first();
                if (await confirmBtn.isVisible()) {
                    await confirmBtn.click();
                    console.log('[v2] ✅ API Key linked successfully. Reloading to apply changes...');
                    await page.waitForTimeout(3000);
                    await page.reload({ waitUntil: 'domcontentloaded' });
                    await page.waitForTimeout(2000);
                }
                else {
                    console.error('[v2] ❌ Could not find "Select key" button.');
                }
            }
            else {
                console.log('[v2] ✅ API Key appears to be linked.');
                // Give AI Studio extra time to fully transition to paid mode
                console.log('[v2] ⏳ Waiting for API transition to complete...');
                await page.waitForTimeout(3000);
            }
        }
        catch (e) {
            console.error('[v2] Error checking/linking API Key:', e);
        }
    }
    /**
     * Dynamically selects the requested model from the UI.
     * If the exact model is not found, tries to find a close match or logs available models.
     */
    async selectBestModel(page, targetModel) {
        console.log(`[v2] 🔍 Attempting to select model: ${targetModel}`);
        try {
            // 1. Find all potential dropdown triggers
            const candidates = page.locator('button, ms-select, mat-select');
            const count = await candidates.count();
            let modelSelector = null;
            console.log(`[v2] DEBUG: Found ${count} candidates.`);
            let bestMatch = null;
            let defaultMatch = null;
            for (let i = 0; i < count; i++) {
                const el = candidates.nth(i);
                const isVisible = await el.isVisible();
                if (!isVisible)
                    continue;
                const text = await el.innerText();
                const label = (await el.getAttribute('aria-label')) || '';
                const cls = (await el.getAttribute('class')) || '';
                console.log(`[v2] Candidate #${i}: Text="${text.replace(/\n/g, '\\n')}", Label="${label}", Class="${cls}"`);
                // Heuristics to identify the model selector:
                // - Text contains "Gemini"
                // - label contains "model" (case-insensitive)
                // - class contains "model-selector"
                // - EXCLUDE filter chips
                if ((text.includes('Gemini') ||
                    label.toLowerCase().includes('model') ||
                    cls.includes('model-selector')) &&
                    !cls.includes('filter-chip')) {
                    // Exclude commonly confused things if checks are weak
                    if (label.toLowerCase().includes('setting'))
                        continue;
                    // Critical: If we want Flash, DO NOT accept Pro card
                    if (targetModel.includes('flash') &&
                        text.toLowerCase().includes('pro') &&
                        !text.toLowerCase().includes('flash')) {
                        console.log(`[v2] Ignoring Pro candidate #${i} because we want Flash`);
                        continue;
                    }
                    // Prioritize exact match (e.g. Flash)
                    if (targetModel.includes('flash') && text.toLowerCase().includes('flash')) {
                        bestMatch = el;
                        console.log(`[v2] Flash MATCH FOUND at #${i}`);
                        break; // Found the best one
                    }
                    if (targetModel.includes('pro') &&
                        text.toLowerCase().includes('pro') &&
                        !targetModel.includes('flash')) {
                        bestMatch = el;
                        console.log(`[v2] Pro MATCH FOUND at #${i}`);
                        break;
                    }
                    // Keep generic match
                    if (!defaultMatch) {
                        defaultMatch = el;
                        console.log(`[v2] Generic MATCH FOUND at #${i} (keeping as backup)`);
                    }
                }
            }
            modelSelector = bestMatch || defaultMatch;
            if (modelSelector)
                console.log(`[v2] Selected candidate: ${modelSelector === bestMatch ? 'Best Match' : 'Default Match'}`);
            // FALLBACK: If on dashboard, click "New chat"
            if (!modelSelector) {
                const newChatBtn = page.locator('button[aria-label="New chat"]').first();
                if (await newChatBtn.isVisible()) {
                    console.log('[v2] Model selector not found. Clicking "New chat" to enter editor...');
                    await newChatBtn.click();
                    await page.waitForTimeout(3000);
                    // Retry finding selector ONE time (simple recursion with flag could work, but here I'll just copy logic or rely on next steps)
                    // Better: Return and let caller handle? No.
                    // Let's just try to find it again.
                    const retryCandidates = page.locator('button, ms-select, mat-select');
                    const retryCount = await retryCandidates.count();
                    for (let i = 0; i < retryCount; i++) {
                        const el = retryCandidates.nth(i);
                        if (!(await el.isVisible()))
                            continue;
                        const text = await el.innerText();
                        const label = (await el.getAttribute('aria-label')) || '';
                        const cls = (await el.getAttribute('class')) || '';
                        if ((text.includes('Gemini') ||
                            label.toLowerCase().includes('model') ||
                            cls.includes('model-selector')) &&
                            !cls.includes('filter-chip')) {
                            if (!label.toLowerCase().includes('setting')) {
                                modelSelector = el;
                                console.log(`[v2] MATCH FOUND on retry!`);
                                break;
                            }
                        }
                    }
                }
            }
            if (modelSelector) {
                const currentModel = await modelSelector.innerText();
                console.log(`[v2] Current model selected: ${currentModel}`);
                // If we are already on the target (fuzzy match), skip
                if (targetModel.includes('flash') && currentModel.toLowerCase().includes('flash')) {
                    console.log('[v2] ✅ "Flash" model already active.');
                    return;
                }
                await modelSelector.click();
                await page.waitForTimeout(1000);
                // 2. Scrape available models
                // Try multiple selectors for options list
                const options = page.locator('mat-option, [role="option"], .model-option');
                const optCount = await options.count();
                const availableModels = [];
                // Use a Set to avoid duplicates if selectors overlap
                const modelSet = new Set();
                for (let i = 0; i < optCount; i++) {
                    const text = await options.nth(i).innerText();
                    // Clean up text (remove newlines/descriptions)
                    const cleanText = text.split('\n')[0].trim();
                    availableModels.push(cleanText);
                    modelSet.add(cleanText);
                }
                console.log(`[v2] 📋 Available Models: ${Array.from(modelSet).join(', ')}`);
                // 3. Select best match
                let bestMatchIndex = -1;
                // Exact-ish match
                bestMatchIndex = availableModels.findIndex((m) => m.toLowerCase().includes(targetModel.toLowerCase()));
                if (bestMatchIndex === -1) {
                    // Fallback for known aliases
                    if (targetModel.includes('flash')) {
                        bestMatchIndex = availableModels.findIndex((m) => m.toLowerCase().includes('flash') && !m.toLowerCase().includes('legacy'));
                    }
                    else if (targetModel.includes('pro')) {
                        bestMatchIndex = availableModels.findIndex((m) => m.toLowerCase().includes('pro') && !m.toLowerCase().includes('vision')); // 'vision' is often older
                    }
                }
                if (bestMatchIndex !== -1) {
                    console.log(`[v2] 👉 Selecting: ${availableModels[bestMatchIndex]}`);
                    await options.nth(bestMatchIndex).click();
                    await page.waitForTimeout(2000);
                }
                else {
                    console.warn(`[v2] ⚠️ Could not find target model ${targetModel}. Keeping current selection.`);
                    await page.keyboard.press('Escape');
                }
            }
            else {
                console.log('[v2] ⚠️ Model selector not found (checked all buttons). assuming strict URL param worked.');
                const content = await page.content();
                fs.writeFileSync('ai_studio_dump.html', content);
                console.log('[v2] Dumped AI Studio HTML to ai_studio_dump.html');
            }
        }
        catch (e) {
            console.error('[v2] ⚠️ Error selecting model:', e);
        }
    }
    // --- FIXED PARSING METHOD ---
    async analyzeWithAI(video) {
        var _a;
        if (!this.context || !video.transcript) {
            return null;
        }
        console.log(`[v2] 🤖 AI Analysis: ${video.title}`);
        let page = null;
        try {
            // FRESH page for AI Studio - Check context health first
            try {
                page = await this.context.newPage();
            }
            catch (contextError) {
                console.error('[v2] ❌ Browser context is dead, cannot create page:', contextError);
                // Try to reinitialize
                console.log('[v2] Attempting to restart browser...');
                try {
                    await ((_a = this.context) === null || _a === void 0 ? void 0 : _a.close());
                }
                catch (e) {
                    /* ignore */
                }
                await this.initialize();
                page = await this.context.newPage();
            }
            // Combine transcript
            const fullTranscript = video.transcript.map((s) => s.text).join(' ');
            const truncatedTranscript = fullTranscript.substring(0, 25000); // Stay within limits
            // Navigate to AI Studio with latest model
            await page.goto(AI_STUDIO_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForTimeout(5000);
            // Dismiss any dialogs
            for (const selector of [
                'button:has-text("Got it")',
                'button:has-text("Continue")',
                '[aria-label="Close"]',
            ]) {
                try {
                    const el = page.locator(selector);
                    if ((await el.count()) > 0 && (await el.first().isVisible())) {
                        await el.first().click({ force: true });
                        await page.waitForTimeout(500);
                    }
                }
                catch (e) {
                    /* ignore */
                }
            }
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
            // Skip API Key check - use browser session directly
            // await this.ensurePaidApiKey(page);
            console.log('[v2] 💳 Using browser session (skipping API key check)');
            // Ensure correct model is selected
            await this.selectBestModel(page, GEMINI_MODEL);
            // Enter prompt
            const textarea = page.locator('textarea[aria-label="Enter a prompt"]');
            await textarea.waitFor({ state: 'visible', timeout: 15000 });
            await textarea.click({ force: true });
            const fullPrompt = ANALYSIS_PROMPT + truncatedTranscript;
            await textarea.fill(fullPrompt);
            await page.waitForTimeout(1000);
            // Click Run
            const runBtn = page.locator('button[aria-label="Run"]');
            await runBtn.click();
            console.log('[v2] Waiting for AI response...');
            // Wait for response with better extraction
            const startWait = Date.now();
            const timeout = 2 * 60 * 1000; // 2 minutes
            // Initial longer wait for first request after API key setup
            await page.waitForTimeout(5000);
            while (Date.now() - startWait < timeout) {
                await page.waitForTimeout(3000);
                // Check for error messages (Permission denied, etc.)
                const errorToast = page
                    .locator('mat-snack-bar-container')
                    .or(page.locator('.error-message'))
                    .or(page.getByText('Permission denied'))
                    .or(page.getByText('Failed to generate'));
                if ((await errorToast.count()) > 0 && (await errorToast.first().isVisible())) {
                    const errorText = await errorToast.first().innerText();
                    console.error(`[v2] ❌ AI Studio Error detected: ${errorText}`);
                    if (errorText.toLowerCase().includes('permission denied')) {
                        console.error(`[v2] 🛑 FATAL ERROR: Account permissions issue. Stopping entire process.`);
                        // We need to exit the entire process so the user can fix the account
                        process.exit(1);
                    }
                    throw new Error(`AI Studio Error: ${errorText}`);
                }
                // Check for completion by looking for the response container
                const responseContainer = page.locator('ms-chat-turn.model .turn-content, .chat-turn-container.model .turn-content');
                if ((await responseContainer.count()) > 0) {
                    // Get the inner text directly, not including UI elements
                    const rawText = await page.evaluate(() => {
                        // Find the actual response text, excluding toolbar buttons
                        const containers = document.querySelectorAll('ms-chat-turn.model .turn-content, .chat-turn-container.model .turn-content');
                        if (containers.length === 0) {
                            return null;
                        }
                        const lastContainer = containers[containers.length - 1];
                        // Get text from markdown content if available
                        const markdown = lastContainer.querySelector('.markdown-body, .markdown-content, .rendered-markdown');
                        let content = markdown ? markdown.textContent || '' : lastContainer.textContent || '';
                        // CLEANING: Remove "Model Thinking" blocks which clutter the output
                        // Gemini Flash sometimes outputs "Model Thinking..." followed by thoughts
                        content = content.replace(/Model Thinking[\s\S]*?(?:Expand to view model thoughts|chevron_right)/g, '');
                        content = content.replace(/Model Thinking[\s\S]*?json/i, '');
                        // Remove common UI text patterns
                        content = content.replace(/more_vert|content_copy|download|expand_less|expand_more|Model code JSON/g, '');
                        return content.trim();
                    });
                    if (rawText && rawText.length > 50) {
                        // Try to extract JSON from the response
                        const jsonPatterns = [
                            /```json\s*(\{[\s\S]*?\})\s*```/, // Standard markdown json block
                            /```\s*(\{[\s\S]*?\})\s*```/, // Generic markdown block
                            /^(\{[\s\S]*\})$/, // Just JSON
                        ];
                        let analysis = null;
                        for (const pattern of jsonPatterns) {
                            const match = rawText.match(pattern);
                            if (match) {
                                try {
                                    const jsonStr = match[1];
                                    const parsed = JSON.parse(jsonStr);
                                    analysis = {
                                        keyPoints: parsed.keyPoints || [],
                                        aiConcepts: parsed.aiConcepts || [],
                                        technicalDetails: parsed.technicalDetails || [],
                                        visualContextFlags: parsed.visualContextFlags || [],
                                        summary: parsed.summary || '',
                                        qualityScore: this.calculateQualityScore(parsed),
                                        rawResponse: rawText.substring(0, 1000),
                                    };
                                    break;
                                }
                                catch (e) {
                                    /* try next pattern */
                                }
                            }
                        }
                        // JSON Parse Fallback: Try to find substring between first { and last }
                        if (!analysis && rawText.includes('{') && rawText.includes('}')) {
                            try {
                                const start = rawText.indexOf('{');
                                const end = rawText.lastIndexOf('}') + 1;
                                const potentialJson = rawText.substring(start, end);
                                const parsed = JSON.parse(potentialJson);
                                analysis = {
                                    keyPoints: parsed.keyPoints || [],
                                    aiConcepts: parsed.aiConcepts || [],
                                    technicalDetails: parsed.technicalDetails || [],
                                    visualContextFlags: parsed.visualContextFlags || [],
                                    summary: parsed.summary || '',
                                    qualityScore: this.calculateQualityScore(parsed),
                                    rawResponse: rawText.substring(0, 1000),
                                };
                            }
                            catch (e) {
                                /* ignore */
                            }
                        }
                        // Text Fallback: Create structured analysis from text if JSON fails
                        if (!analysis) {
                            analysis = {
                                keyPoints: this.extractBulletPoints(rawText),
                                aiConcepts: this.extractAIConcepts(rawText),
                                technicalDetails: [],
                                visualContextFlags: [],
                                summary: rawText.substring(0, 300).replace(/\n/g, ' '),
                                qualityScore: 50, // Medium quality for fallback
                                rawResponse: rawText.substring(0, 1000),
                            };
                        }
                        console.log(`[v2] ✅ Analysis complete (quality: ${analysis.qualityScore}%)`);
                        return analysis;
                    }
                }
                // Check for errors
                const errorText = await page.evaluate(() => {
                    const body = document.body.innerText;
                    if (body.includes('Internal error') || body.includes('Something went wrong')) {
                        return 'error';
                    }
                    return null;
                });
                if (errorText) {
                    throw new Error('AI Studio returned an error');
                }
            }
            console.log('[v2] ⚠️ Analysis timeout');
            return null;
        }
        catch (e) {
            console.error('[v2] Analysis error:', e);
            return null;
        }
        finally {
            // GUARANTEED CLEANUP - Always close page, even if errors occur
            if (page) {
                try {
                    await page.close();
                    console.log('[v2] 🧹 Page cleaned up');
                }
                catch (cleanupError) {
                    console.warn('[v2] ⚠️ Failed to close page during cleanup:', cleanupError);
                }
            }
        }
    }
    calculateQualityScore(parsed) {
        let score = 0;
        if (parsed.summary && parsed.summary.length > 50) {
            score += 25;
        }
        if (parsed.keyPoints && parsed.keyPoints.length >= 3) {
            score += 25;
        }
        if (parsed.aiConcepts && parsed.aiConcepts.length > 0) {
            score += 25;
        }
        if (parsed.technicalDetails && parsed.technicalDetails.length > 0) {
            score += 25;
        }
        return score;
    }
    extractBulletPoints(text) {
        const lines = text.split('\n');
        return lines
            .filter((line) => line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().match(/^\d+\./))
            .map((line) => line.replace(/^[-•\d.]+\s*/, '').trim())
            .filter((line) => line.length > 10)
            .slice(0, 10);
    }
    extractAIConcepts(text) {
        const aiTerms = [
            'machine learning',
            'neural network',
            'deep learning',
            'transformer',
            'GPT',
            'LLM',
            'large language model',
            'AI agent',
            'embedding',
            'fine-tuning',
            'RAG',
            'vector database',
            'prompt engineering',
            'diffusion',
            'stable diffusion',
            'DALL-E',
            'Claude',
            'Gemini',
            'OpenAI',
            'Anthropic',
            'LangChain',
            'AutoGPT',
            'inference',
            'training',
            'model',
        ];
        const found = [];
        const lowerText = text.toLowerCase();
        for (const term of aiTerms) {
            if (lowerText.includes(term.toLowerCase()) && !found.includes(term)) {
                found.push(term);
            }
        }
        return found;
    }
    saveReport(video) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        const safeTitle = video.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
        const reportFile = path.join(this.reportsDir, `v2_${video.index}_${safeTitle}_${Date.now()}.md`);
        let content = `# Video Analysis Report\n\n## Metadata\n- **Video**: ${video.title}\n- **Index**: #${video.index}\n- **URL**: ${video.url}\n- **Duration**: ${((_a = video.metadata) === null || _a === void 0 ? void 0 : _a.durationFormatted) || 'Unknown'}\n- **Channel**: ${((_b = video.metadata) === null || _b === void 0 ? void 0 : _b.channel) || 'Unknown'}\n- **Views**: ${((_c = video.metadata) === null || _c === void 0 ? void 0 : _c.viewCount) || 'Unknown'}\n- **Published**: ${((_d = video.metadata) === null || _d === void 0 ? void 0 : _d.publishDate) || 'Unknown'}\n- **Processed**: ${new Date().toISOString()}\n- **Quality Score**: ${((_e = video.analysis) === null || _e === void 0 ? void 0 : _e.qualityScore) || 0}%\n\n---\n\n## Summary\n${((_f = video.analysis) === null || _f === void 0 ? void 0 : _f.summary) || ((_g = video.metadata) === null || _g === void 0 ? void 0 : _g.summary) || 'No summary available'}\n\n## Key Points\n${(((_h = video.analysis) === null || _h === void 0 ? void 0 : _h.keyPoints) || []).map((p) => `- ${p}`).join('\n') || '- No key points extracted'}\n\n## AI & Technical Concepts\n${(((_j = video.analysis) === null || _j === void 0 ? void 0 : _j.aiConcepts) || []).map((c) => `- ${c}`).join('\n') || '- None identified'}\n\n## Technical Details\n${(((_k = video.analysis) === null || _k === void 0 ? void 0 : _k.technicalDetails) || []).map((d) => `- ${d}`).join('\n') || '- None identified'}\n`;
        if (((_l = video.analysis) === null || _l === void 0 ? void 0 : _l.visualContextFlags) && video.analysis.visualContextFlags.length > 0) {
            content += `\n## ⚠️ Sections Needing Visual Review\n${video.analysis.visualContextFlags
                .map((f) => `- **${this.formatDuration(f.timestamp)}**: ${f.reason} - ${f.context}`)
                .join('\n')}\n`;
        }
        fs.writeFileSync(reportFile, content);
        if (video.transcript && video.transcript.length > 0) {
            const transcriptFile = path.join(this.transcriptsDir, `${video.index}_${safeTitle}.txt`);
            const transcriptContent = video.transcript
                .map((s) => `[${this.formatDuration(s.start)}] ${s.text}`)
                .join('\n');
            fs.writeFileSync(transcriptFile, transcriptContent);
        }
        this.appendToKnowledgeBase(video);
        return reportFile;
    }
    appendToKnowledgeBase(video) {
        var _a, _b, _c, _d, _e, _f;
        const entryId = `video-analysis-${video.videoId}`;
        const safeTitle = video.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
        // SOFTWARE 3.0: Generate Federated ID# via the shared helper.
        // The canonical encoder lives in
        // packages/a2a-core/src/federated-identity.service.ts (FederatedIdentityService);
        // this local mirror keeps the alphabet in sync so transcript stovepipes
        // can run without pulling in @the-new-fuse/a2a-core's NestJS DI runtime.
        const idNumber = generateFederatedIdNumber(video.index);
        // 1. Create a CompoundingLogEntry structure
        const compoundingEntry = {
            id: entryId,
            title: video.title,
            category: 'video-analysis',
            content: ((_a = video.analysis) === null || _a === void 0 ? void 0 : _a.summary) || 'No summary',
            backlinks: ((_b = video.analysis) === null || _b === void 0 ? void 0 : _b.aiConcepts) || [],
            metadata: {
                agentId: 'transcript-processor-v2',
                timestamp: new Date().toISOString(),
                videoId: video.videoId,
                url: video.url,
                qualityScore: ((_c = video.analysis) === null || _c === void 0 ? void 0 : _c.qualityScore) || 0,
                idNumber: idNumber, // Verified Federated ID#
                resourcePointers: {
                    transcript: {
                        uri: `file://${path.join(this.transcriptsDir, `${video.index}_${safeTitle}.txt`)}`,
                        mimeType: 'text/plain',
                    },
                    report: {
                        uri: `file://${path.join(this.reportsDir, `v2_${video.index}_${safeTitle}.md`)}`,
                        mimeType: 'text/markdown',
                    },
                },
            },
        };
        // 2. Save the Compounding Entry JSON for the Wiki Compiler (The Ratchet Loop)
        const wikiInboxDir = path.join(path.dirname(this.stateFilePath), 'wiki-inbox');
        fs.mkdirSync(wikiInboxDir, { recursive: true });
        fs.writeFileSync(path.join(wikiInboxDir, `${entryId}.json`), JSON.stringify(compoundingEntry, null, 2));
        // 3. Keep legacy append for backward compatibility but tag it as a pointer
        const legacyEntry = `\n---\n\n## #${video.index}: ${video.title}\n**URL**: ${video.url}\n**Resource Pointer**: trp://wiki-inbox/${entryId}.json\n\n### Summary\n${((_d = video.analysis) === null || _d === void 0 ? void 0 : _d.summary) || 'No summary'}\n\n### Key Insights\n${(((_e = video.analysis) === null || _e === void 0 ? void 0 : _e.keyPoints) || [])
            .slice(0, 5)
            .map((p) => `- ${p}`)
            .join('\n') || '- None'}\n\n### AI Concepts Covered\n${(((_f = video.analysis) === null || _f === void 0 ? void 0 : _f.aiConcepts) || []).join(', ') || 'None'}\n\n`;
        fs.appendFileSync(this.knowledgeBaseFile, legacyEntry);
        console.log(`[v2] 🦾 Generated Sovereign Entry: ${entryId}.json (Pointer-based)`);
    }
    async processVideo(video) {
        if (video.status === 'completed' ||
            video.status === 'skipped' ||
            video.status === 'needs_visual') {
            console.log(`[v2] ⏭️ Skipping #${video.index} (${video.status})`);
            return true;
        }
        if (video.processingAttempts >= 3) {
            console.log(`[v2] ⏭️ Skipping #${video.index} (max attempts reached)`);
            video.status = 'skipped';
            this.state.stats.skipped++;
            this.saveState();
            return false;
        }
        // HEALTH CHECK - Ensure browser is alive before processing
        await this.ensureBrowserHealth();
        console.log(`\n${'═'.repeat(70)}`);
        console.log(`Video #${video.index}: ${video.title}`);
        console.log(`Attempt: ${video.processingAttempts + 1}/3`);
        console.log(`${'═'.repeat(70)}\n`);
        video.processingAttempts++;
        video.lastProcessed = new Date().toISOString();
        this.saveState();
        try {
            if (!video.metadata) {
                video.status = 'metadata';
                video.metadata = (await this.fetchEnrichedMetadata(video)) || undefined;
                if (video.metadata) {
                    this.state.stats.metadataComplete++;
                }
                this.saveState();
            }
            if (this.targetPhase === 'metadata')
                return true;
            if (!video.transcript) {
                video.status = 'transcript';
                video.transcript = (await this.extractTranscriptDirect(video)) || undefined;
                if (video.transcript) {
                    this.state.stats.transcriptsExtracted++;
                }
                this.saveState();
            }
            if (this.targetPhase === 'transcript')
                return true;
            if (video.transcript && !video.analysis) {
                video.status = 'analyzed';
                video.analysis = (await this.analyzeWithAI(video)) || undefined;
                if (video.analysis) {
                    this.state.stats.analyzed++;
                    if (video.analysis.visualContextFlags.length > 0) {
                        this.state.stats.needsVisualReview++;
                        video.status = 'needs_visual';
                    }
                }
                this.saveState();
            }
            if (video.analysis) {
                const reportPath = this.saveReport(video);
                console.log(`[v2] ✅ Report: ${path.basename(reportPath)}`);
                video.status = 'completed';
                this.state.stats.completed++;
            }
            else {
                video.status = 'error';
                video.error = 'Analysis failed';
                this.state.stats.errors++;
            }
            this.saveState();
            this.printProgress();
            return video.status === 'completed';
        }
        catch (e) {
            console.error(`[v2] Error processing #${video.index}:`, e);
            video.error = e.message;
            video.status = 'error';
            this.state.stats.errors++;
            this.saveState();
            return false;
        }
    }
    printProgress() {
        const s = this.state.stats;
        console.log(`\n📊 Progress: ${s.completed}/${s.totalVideos}`);
        console.log(`   Completed: ${s.completed} | Analyzed: ${s.analyzed} | Errors: ${s.errors}`);
        console.log(`   Success Rate: ${s.analysisSuccessRate.toFixed(1)}%\n`);
    }
    async run(libraryPath, startIndex = 633, endIndex = 1) {
        console.log(`🚀 Transcript Processor v2 - Optimized Edition`);
        console.log(`Library: ${libraryPath}`);
        console.log(`Range: #${startIndex} → #${endIndex}`);
        console.log(`Model: ${GEMINI_MODEL}`);
        await this.initialize();
        // Load library
        const content = fs.readFileSync(libraryPath, 'utf-8');
        const videos = [];
        const rowRegex = /<tr>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>\s*<\/td>/g;
        let match;
        while ((match = rowRegex.exec(content)) !== null) {
            const index = parseInt(match[1]);
            if (index <= startIndex && index >= endIndex) {
                // Check if already in queue
                const existing = this.state.queue.find((v) => v.index === index);
                if (existing) {
                    videos.push(existing);
                }
                else {
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
        }
        // Sort descending
        videos.sort((a, b) => b.index - a.index);
        // Update state queue respecting existing entries
        this.state.queue = videos;
        this.state.stats.totalVideos = videos.length;
        this.saveState();
        console.log(`[v2] Processing ${videos.length} videos...`);
        for (const video of videos) {
            this.state.currentIndex = video.index;
            await this.processVideo(video);
            // Small cooldown
            await new Promise((r) => setTimeout(r, 2000));
        }
        console.log('[v2] 🎉 All done!');
        if (this.context) {
            await this.context.close();
        }
    }
    /**
     * Universal Fallback: Download transcript using yt-dlp
     */
    downloadTranscriptWithYtDlp(url, videoId) {
        const tempDir = path.join(path.dirname(this.reportsDir), 'temp_subs');
        // Ensure temp dir exists
        if (!fs.existsSync(tempDir)) {
            try {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            catch (e) { }
        }
        const outputFileBase = path.join(tempDir, videoId);
        try {
            console.log(`[v2] Running yt-dlp for ${videoId}...`);
            // Clean up previous potential files
            try {
                const existing = fs.readdirSync(tempDir).filter((f) => f.startsWith(videoId));
                existing.forEach((f) => fs.unlinkSync(path.join(tempDir, f)));
            }
            catch (e) { }
            // Command to get VTT
            const command = `yt-dlp --write-auto-sub --write-sub --sub-lang en --skip-download --output "${outputFileBase}" "${url}"`;
            (0, child_process_1.execSync)(command, { stdio: 'ignore' });
            // Find the generated file (.en.vtt or similar)
            const files = fs.readdirSync(tempDir);
            const subFile = files.find((f) => f.startsWith(videoId) && f.endsWith('.vtt'));
            if (!subFile) {
                console.log('[v2] No .vtt file created by yt-dlp');
                return null;
            }
            // Parse VTT
            const content = fs.readFileSync(path.join(tempDir, subFile), 'utf-8');
            const segments = [];
            const blocks = content.split(/\n\r?\n/);
            for (const block of blocks) {
                const timeMatch = block.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s-->\s(\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
                if (timeMatch) {
                    const lines = block.split('\n');
                    const timeLineIndex = lines.findIndex((l) => l.includes('-->'));
                    if (timeLineIndex !== -1 && timeLineIndex < lines.length - 1) {
                        let text = lines
                            .slice(timeLineIndex + 1)
                            .join(' ')
                            .replace(/<[^>]*>/g, '')
                            .trim();
                        if (text && text !== 'align:start position:0%') {
                            text = text
                                .replace(/&amp;/g, '&')
                                .replace(/&quot;/g, '"')
                                .replace(/&#39;/g, "'")
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>');
                            const startSec = parseInt(timeMatch[1]) * 3600 +
                                parseInt(timeMatch[2]) * 60 +
                                parseInt(timeMatch[3]) +
                                parseInt(timeMatch[4]) / 1000;
                            const endSec = parseInt(timeMatch[5]) * 3600 +
                                parseInt(timeMatch[6]) * 60 +
                                parseInt(timeMatch[7]) +
                                parseInt(timeMatch[8]) / 1000;
                            segments.push({
                                start: startSec,
                                duration: endSec - startSec,
                                text: text,
                            });
                        }
                    }
                }
            }
            // Cleanup
            try {
                fs.unlinkSync(path.join(tempDir, subFile));
            }
            catch (e) { }
            if (segments.length > 0) {
                return segments;
            }
        }
        catch (e) {
            console.error('[v2] yt-dlp execution error:', e);
        }
        return null;
    }
}
async function main() {
    const args = process.argv.slice(2);
    const startArg = args.find((a) => a.startsWith('--start='));
    const endArg = args.find((a) => a.startsWith('--end='));
    const phaseArg = args.find((a) => a.startsWith('--phase='));
    const start = startArg ? parseInt(startArg.split('=')[1]) : 633;
    const end = endArg ? parseInt(endArg.split('=')[1]) : 1;
    const phase = (phaseArg ? phaseArg.split('=')[1] : 'analysis');
    const libraryPath = '/Users/<owner>/Desktop/A1-Inter-LLM-Com/my-ai-knowledge-base/video-library/ai_video_library.html';
    const processor = new TranscriptProcessorV2(phase);
    // Process the known backlog (indices where transcripts already exist)
    await processor.run(libraryPath, 647, 405);
}
main().catch(console.error);
// -----------------------------------------------------------------------------
// Shared Federated ID# helper (Phase 9, audit 2026-06-14).
//
// Canonical encoder: packages/a2a-core/src/federated-identity.service.ts
//   (FederatedIdentityService). This copy is kept verbatim so transcript
//   stovepipes can produce `ID#:<Base58>` values without pulling in
//   @the-new-fuse/a2a-core's NestJS DI runtime. If the alphabet ever changes,
//   update BOTH copies.
// -----------------------------------------------------------------------------
exports.FEDERATED_BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function generateFederatedIdNumber(seq) {
    if (!Number.isFinite(seq) || seq <= 0)
        return `ID#:${exports.FEDERATED_BASE58_ALPHABET[0]}`;
    let remaining = Math.trunc(seq);
    let encoded = '';
    while (remaining > 0) {
        encoded = exports.FEDERATED_BASE58_ALPHABET[remaining % 58] + encoded;
        remaining = Math.floor(remaining / 58);
    }
    return `ID#:${encoded}`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHJhbnNjcmlwdFByb2Nlc3NvclYyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiVHJhbnNjcmlwdFByb2Nlc3NvclYyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7Ozs7O0dBWUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXFtREgsOERBU0M7QUE1bURELGlEQUF5QztBQUN6Qyx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBRTdCLDJDQUFzRTtBQW9GdEUsNkNBQTZDO0FBQzdDLE1BQU0sWUFBWSxHQUFHLHdCQUF3QixDQUFDO0FBQzlDLE1BQU0sYUFBYSxHQUFHLDBEQUEwRCxZQUFZLEVBQUUsQ0FBQztBQUUvRixNQUFNLGVBQWUsR0FBRzs7Ozs7Ozs7Ozs7Ozs7OztDQWdCdkIsQ0FBQztBQUVGLE1BQU0scUJBQXFCO0lBU3pCLFlBQVksY0FBc0QsVUFBVTtRQVJwRSxZQUFPLEdBQTBCLElBQUksQ0FBQztRQU10QyxnQkFBVyxHQUEyQyxVQUFVLENBQUM7UUFHdkUsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7UUFDL0Isb0VBQW9FO1FBQ3BFLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3ZELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBRTFELGdGQUFnRjtRQUNoRixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQztRQUUxRSxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLDBCQUEwQixDQUFDLENBQUM7UUFDcEUsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxl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RUFBRSxHQUFHLENBQUMsQ0FBQztBQUM3QyxDQUFDO0FBRUQsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUU1QixnRkFBZ0Y7QUFDaEYsMkRBQTJEO0FBQzNELEVBQUU7QUFDRix5RUFBeUU7QUFDekUseUVBQXlFO0FBQ3pFLG9FQUFvRTtBQUNwRSw4RUFBOEU7QUFDOUUsd0JBQXdCO0FBQ3hCLGdGQUFnRjtBQUVuRSxRQUFBLHlCQUF5QixHQUNwQyw0REFBNEQsQ0FBQztBQUUvRCxTQUFnQix5QkFBeUIsQ0FBQyxHQUFXO0lBQ25ELElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQUUsT0FBTyxPQUFPLGlDQUF5QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDcEYsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNoQyxJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7SUFDakIsT0FBTyxTQUFTLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDckIsT0FBTyxHQUFHLGlDQUF5QixDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUM7UUFDOUQsU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQ3pDLENBQUM7SUFDRCxPQUFPLE9BQU8sT0FBTyxFQUFFLENBQUM7QUFDMUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVHJhbnNjcmlwdCBQcm9jZXNzb3IgdjIgLSBPcHRpbWl6ZWQgRWRpdGlvblxuICpcbiAqIEltcHJvdmVtZW50cyBvdmVyIHYxOlxuICogMS4gVXNlcyBsYXRlc3QgR2VtaW5pIDMgRmxhc2ggbW9kZWwgKGdlbWluaS0zLWZsYXNoLXByZXZpZXcpXG4gKiAyLiBGcmVzaCBicm93c2VyIHBhZ2UgZm9yIEVBQ0ggb3BlcmF0aW9uXG4gKiAzLiBCZXR0ZXIgSlNPTiBleHRyYWN0aW9uIGZyb20gQUkgcmVzcG9uc2VzXG4gKiA0LiBNYXhpbWl6ZWQgR29vZ2xlIFNlYXJjaCBBSSBtb2RlIHF1ZXJpZXNcbiAqIDUuIERpcmVjdCB0cmFuc2NyaXB0IGV4dHJhY3Rpb24gdmlhIEFQSSAobm8gWW91VHViZSBwYWdlIHZpc2l0IHdoZW4gcG9zc2libGUpXG4gKiA2LiBDZW50cmFsaXplZCBrbm93bGVkZ2UgYmFzZSBjb25zb2xpZGF0aW9uXG4gKiA3LiBQcm9wZXIgc3RhdHVzIHRyYWNraW5nIHRvIHByZXZlbnQgbG9vcHNcbiAqIDguIFN1Y2Nlc3MgbWV0cmljcyBhbmQgcXVhbGl0eSBldmFsdWF0aW9uXG4gKi9cblxuaW1wb3J0IHsgZXhlY1N5bmMgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbmltcG9ydCB7IGNocm9taXVtLCB0eXBlIEJyb3dzZXJDb250ZXh0LCB0eXBlIFBhZ2UgfSBmcm9tICdwbGF5d3JpZ2h0JztcblxuLy8gVE5GIFNvdmVyZWlnbiBTdGF0ZSBJbXBvcnRzXG4vLyBOb3RlOiBJbiBwcm9kdWN0aW9uLCB0aGVzZSB3b3VsZCBiZSBwcm9wZXIgaW1wb3J0cywgZm9yIHRoaXMgc2NyaXB0IHdlIHNpbXVsYXRlIHRoZSBkZXBlbmRlbmN5IGluamVjdGlvblxuLy8gaW1wb3J0IHsgRmVkZXJhdGVkSWRlbnRpdHlTZXJ2aWNlIH0gZnJvbSAnQHRoZS1uZXctZnVzZS9hMmEtY29yZSc7XG5cbmludGVyZmFjZSBWaWRlb0VudHJ5IHtcbiAgaW5kZXg6IG51bWJlcjtcbiAgdXJsOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHZpZGVvSWQ6IHN0cmluZztcbiAgbWV0YWRhdGE/OiBWaWRlb01ldGFkYXRhO1xuICB0cmFuc2NyaXB0PzogVHJhbnNjcmlwdFNlZ21lbnRbXTtcbiAgYW5hbHlzaXM/OiBBbmFseXNpc1Jlc3VsdDtcbiAgc3RhdHVzOlxuICAgIHwgJ3BlbmRpbmcnXG4gICAgfCAnbWV0YWRhdGEnXG4gICAgfCAndHJhbnNjcmlwdCdcbiAgICB8ICdhbmFseXplZCdcbiAgICB8ICduZWVkc192aXN1YWwnXG4gICAgfCAnY29tcGxldGVkJ1xuICAgIHwgJ3NraXBwZWQnXG4gICAgfCAnZXJyb3InO1xuICBwcm9jZXNzaW5nQXR0ZW1wdHM6IG51bWJlcjtcbiAgbGFzdFByb2Nlc3NlZD86IHN0cmluZztcbiAgZXJyb3I/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBWaWRlb01ldGFkYXRhIHtcbiAgZHVyYXRpb246IG51bWJlcjtcbiAgZHVyYXRpb25Gb3JtYXR0ZWQ6IHN0cmluZztcbiAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gIGNoYW5uZWw/OiBzdHJpbmc7XG4gIHB1Ymxpc2hEYXRlPzogc3RyaW5nO1xuICB2aWV3Q291bnQ/OiBzdHJpbmc7XG4gIGNhdGVnb3J5Pzogc3RyaW5nO1xuICB0YWdzPzogc3RyaW5nW107XG4gIHN1bW1hcnk/OiBzdHJpbmc7IC8vIEFJLWdlbmVyYXRlZCBzdW1tYXJ5IGZyb20gR29vZ2xlXG59XG5cbmludGVyZmFjZSBUcmFuc2NyaXB0U2VnbWVudCB7XG4gIHN0YXJ0OiBudW1iZXI7XG4gIGR1cmF0aW9uOiBudW1iZXI7XG4gIHRleHQ6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIEFuYWx5c2lzUmVzdWx0IHtcbiAga2V5UG9pbnRzOiBzdHJpbmdbXTtcbiAgYWlDb25jZXB0czogc3RyaW5nW107XG4gIHRlY2huaWNhbERldGFpbHM6IHN0cmluZ1tdO1xuICB2aXN1YWxDb250ZXh0RmxhZ3M6IFZpc3VhbENvbnRleHRGbGFnW107XG4gIHN1bW1hcnk6IHN0cmluZztcbiAgcXVhbGl0eVNjb3JlPzogbnVtYmVyO1xuICByYXdSZXNwb25zZT86IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFZpc3VhbENvbnRleHRGbGFnIHtcbiAgdGltZXN0YW1wOiBudW1iZXI7XG4gIHJlYXNvbjogc3RyaW5nO1xuICBjb250ZXh0OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBQcm9jZXNzaW5nU3RhdGUge1xuICB2ZXJzaW9uOiBzdHJpbmc7XG4gIHF1ZXVlOiBWaWRlb0VudHJ5W107XG4gIGN1cnJlbnRJbmRleDogbnVtYmVyO1xuICBzdGFydGVkQXQ6IHN0cmluZztcbiAgbGFzdFVwZGF0ZWQ6IHN0cmluZztcbiAgc3RhdHM6IFByb2Nlc3NpbmdTdGF0cztcbn1cblxuaW50ZXJmYWNlIFByb2Nlc3NpbmdTdGF0cyB7XG4gIHRvdGFsVmlkZW9zOiBudW1iZXI7XG4gIG1ldGFkYXRhQ29tcGxldGU6IG51bWJlcjtcbiAgdHJhbnNjcmlwdHNFeHRyYWN0ZWQ6IG51bWJlcjtcbiAgYW5hbHl6ZWQ6IG51bWJlcjtcbiAgbmVlZHNWaXN1YWxSZXZpZXc6IG51bWJlcjtcbiAgY29tcGxldGVkOiBudW1iZXI7XG4gIHNraXBwZWQ6IG51bWJlcjtcbiAgZXJyb3JzOiBudW1iZXI7XG4gIGFuYWx5c2lzU3VjY2Vzc1JhdGU6IG51bWJlcjtcbiAgYXZlcmFnZVRyYW5zY3JpcHRMZW5ndGg6IG51bWJlcjtcbn1cblxuLy8gTGF0ZXN0IGF2YWlsYWJsZSBtb2RlbCBhcyBvZiBKYW4gMjAyNS8yMDI2XG5jb25zdCBHRU1JTklfTU9ERUwgPSAnZ2VtaW5pLTMtZmxhc2gtcHJldmlldyc7XG5jb25zdCBBSV9TVFVESU9fVVJMID0gYGh0dHBzOi8vYWlzdHVkaW8uZ29vZ2xlLmNvbS9hcHAvcHJvbXB0cy9uZXdfY2hhdD9tb2RlbD0ke0dFTUlOSV9NT0RFTH1gO1xuXG5jb25zdCBBTkFMWVNJU19QUk9NUFQgPSBgWW91IGFyZSBhbmFseXppbmcgYSBZb3VUdWJlIHZpZGVvIHRyYW5zY3JpcHQuIEV4dHJhY3QgYW5kIHN0cnVjdHVyZSB0aGUgZm9sbG93aW5nIGluZm9ybWF0aW9uIGFzIHZhbGlkIEpTT04gb25seSAobm8gbWFya2Rvd24sIG5vIGV4dHJhIHRleHQpLlxuXG5SZXR1cm4gT05MWSB0aGlzIEpTT04gc3RydWN0dXJlOlxue1xuICBcInN1bW1hcnlcIjogXCIyLTMgc2VudGVuY2Ugc3VtbWFyeSBvZiB0aGUgdmlkZW8gY29udGVudFwiLFxuICBcImtleVBvaW50c1wiOiBbXCJwb2ludCAxXCIsIFwicG9pbnQgMlwiLCAuLi5dLFxuICBcImFpQ29uY2VwdHNcIjogW1wiQUkgY29uY2VwdCAxXCIsIFwiQUkgY29uY2VwdCAyXCIsIC4uLl0sXG4gIFwidGVjaG5pY2FsRGV0YWlsc1wiOiBbXCJ0b29sL2ZyYW1ld29yayAxXCIsIFwiaW1wbGVtZW50YXRpb24gZGV0YWlsXCIsIC4uLl0sXG4gIFwidmlzdWFsQ29udGV4dEZsYWdzXCI6IFtcbiAgICB7XCJ0aW1lc3RhbXBcIjogMTIwLCBcInJlYXNvblwiOiBcIkNvZGUgZGVtb1wiLCBcImNvbnRleHRcIjogXCJTaG93cyBQeXRob24gaW1wbGVtZW50YXRpb25cIn1cbiAgXVxufVxuXG5JZiB0aGUgdmlkZW8gaXMgbm90IGFib3V0IEFJL3RlY2gsIHNldCBhaUNvbmNlcHRzIGFuZCB0ZWNobmljYWxEZXRhaWxzIHRvIGVtcHR5IGFycmF5cyBidXQgc3RpbGwgZXh0cmFjdCBrZXlQb2ludHMuXG5cblRSQU5TQ1JJUFQ6XG5gO1xuXG5jbGFzcyBUcmFuc2NyaXB0UHJvY2Vzc29yVjIge1xuICBwcml2YXRlIGNvbnRleHQ6IEJyb3dzZXJDb250ZXh0IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc3RhdGU6IFByb2Nlc3NpbmdTdGF0ZTtcbiAgcHJpdmF0ZSBzdGF0ZUZpbGVQYXRoOiBzdHJpbmc7XG4gIHByaXZhdGUgcmVwb3J0c0Rpcjogc3RyaW5nO1xuICBwcml2YXRlIHRyYW5zY3JpcHRzRGlyOiBzdHJpbmc7XG4gIHByaXZhdGUga25vd2xlZGdlQmFzZUZpbGU6IHN0cmluZztcbiAgcHJpdmF0ZSB0YXJnZXRQaGFzZTogJ21ldGFkYXRhJyB8ICd0cmFuc2NyaXB0JyB8ICdhbmFseXNpcycgPSAnYW5hbHlzaXMnO1xuXG4gIGNvbnN0cnVjdG9yKHRhcmdldFBoYXNlOiAnbWV0YWRhdGEnIHwgJ3RyYW5zY3JpcHQnIHwgJ2FuYWx5c2lzJyA9ICdhbmFseXNpcycpIHtcbiAgICB0aGlzLnRhcmdldFBoYXNlID0gdGFyZ2V0UGhhc2U7XG4gICAgLy8gRGV0ZXJtaW5lIGRhdGEgZGlyZWN0b3J5IChoYW5kbGUgYm90aCBwYWNrYWdlIGFuZCByb290IHNjZW5hcmlvcylcbiAgICBjb25zdCBwYWNrYWdlRGF0YURpciA9IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9kYXRhJyk7XG4gICAgY29uc3Qgcm9vdERhdGFEaXIgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vZGF0YScpO1xuXG4gICAgLy8gUHJlZmVyIHJvb3QgZGF0YSBkaXIgaWYgaXQgZXhpc3RzIChwcmV2aW91cyBiZWhhdmlvciksIG90aGVyd2lzZSBwYWNrYWdlIGRhdGFcbiAgICBjb25zdCBkYXRhRGlyID0gZnMuZXhpc3RzU3luYyhyb290RGF0YURpcikgPyByb290RGF0YURpciA6IHBhY2thZ2VEYXRhRGlyO1xuXG4gICAgdGhpcy5zdGF0ZUZpbGVQYXRoID0gcGF0aC5qb2luKGRhdGFEaXIsICd0cmFuc2NyaXB0LXYyLXN0YXRlLmpzb24nKTtcbiAgICB0aGlzLnJlcG9ydHNEaXIgPSBwYXRoLmpvaW4oZGF0YURpciwgJ3ZpZGVvLXJlcG9ydHMnKTtcbiAgICB0aGlzLnRyYW5zY3JpcHRzRGlyID0gcGF0aC5qb2luKGRhdGFEaXIsICd2aWRlby10cmFuc2NyaXB0cycpO1xuICAgIHRoaXMua25vd2xlZGdlQmFzZUZpbGUgPSBwYXRoLmpvaW4oZGF0YURpciwgJ0FJX0tub3dsZWRnZV9CYXNlLm1kJyk7XG5cbiAgICBjb25zb2xlLmxvZyhgW3YyXSBVc2luZyBkYXRhIGRpcmVjdG9yeTogJHtkYXRhRGlyfWApO1xuXG4gICAgLy8gRW5zdXJlIGRpcmVjdG9yaWVzIGV4aXN0XG4gICAgZnMubWtkaXJTeW5jKHRoaXMucmVwb3J0c0RpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgZnMubWtkaXJTeW5jKHRoaXMudHJhbnNjcmlwdHNEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGZzLm1rZGlyU3luYyhwYXRoLmpvaW4oZGF0YURpciwgJ3RlbXBfc3VicycpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcblxuICAgIHRoaXMuc3RhdGUgPSB0aGlzLmxvYWRTdGF0ZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBsb2FkU3RhdGUoKTogUHJvY2Vzc2luZ1N0YXRlIHtcbiAgICB0cnkge1xuICAgICAgaWYgKGZzLmV4aXN0c1N5bmModGhpcy5zdGF0ZUZpbGVQYXRoKSkge1xuICAgICAgICBjb25zdCBzdGF0ZSA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHRoaXMuc3RhdGVGaWxlUGF0aCwgJ3V0Zi04JykpO1xuICAgICAgICAvLyBNaWdyYXRlIG9sZCBzdGF0ZSBpZiBuZWVkZWRcbiAgICAgICAgaWYgKHN0YXRlLnZlcnNpb24gIT09ICcyLjAnKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1t2Ml0gTWlncmF0aW5nIHN0YXRlIHRvIHYyIGZvcm1hdC4uLicpO1xuICAgICAgICAgIHN0YXRlLnZlcnNpb24gPSAnMi4wJztcbiAgICAgICAgICBzdGF0ZS5xdWV1ZSA9IHN0YXRlLnF1ZXVlLm1hcCgodjogYW55KSA9PiAoe1xuICAgICAgICAgICAgLi4udixcbiAgICAgICAgICAgIHByb2Nlc3NpbmdBdHRlbXB0czogdi5wcm9jZXNzaW5nQXR0ZW1wdHMgfHwgMCxcbiAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdbdjJdIENyZWF0aW5nIG5ldyBzdGF0ZSBmaWxlJyk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICB2ZXJzaW9uOiAnMi4wJyxcbiAgICAgIHF1ZXVlOiBbXSxcbiAgICAgIGN1cnJlbnRJbmRleDogMCxcbiAgICAgIHN0YXJ0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgbGFzdFVwZGF0ZWQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIHN0YXRzOiB7XG4gICAgICAgIHRvdGFsVmlkZW9zOiAwLFxuICAgICAgICBtZXRhZGF0YUNvbXBsZXRlOiAwLFxuICAgICAgICB0cmFuc2NyaXB0c0V4dHJhY3RlZDogMCxcbiAgICAgICAgYW5hbHl6ZWQ6IDAsXG4gICAgICAgIG5lZWRzVmlzdWFsUmV2aWV3OiAwLFxuICAgICAgICBjb21wbGV0ZWQ6IDAsXG4gICAgICAgIHNraXBwZWQ6IDAsXG4gICAgICAgIGVycm9yczogMCxcbiAgICAgICAgYW5hbHlzaXNTdWNjZXNzUmF0ZTogMCxcbiAgICAgICAgYXZlcmFnZVRyYW5zY3JpcHRMZW5ndGg6IDAsXG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIHNhdmVTdGF0ZSgpOiB2b2lkIHtcbiAgICB0aGlzLnN0YXRlLmxhc3RVcGRhdGVkID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgIHRoaXMudXBkYXRlU3RhdHMoKTtcbiAgICBmcy5ta2RpclN5bmMocGF0aC5kaXJuYW1lKHRoaXMuc3RhdGVGaWxlUGF0aCksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGZzLndyaXRlRmlsZVN5bmModGhpcy5zdGF0ZUZpbGVQYXRoLCBKU09OLnN0cmluZ2lmeSh0aGlzLnN0YXRlLCBudWxsLCAyKSk7XG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZVN0YXRzKCk6IHZvaWQge1xuICAgIGNvbnN0IHMgPSB0aGlzLnN0YXRlLnN0YXRzO1xuICAgIGNvbnN0IGFuYWx5emVkID0gdGhpcy5zdGF0ZS5xdWV1ZS5maWx0ZXIoKHYpID0+IHYuYW5hbHlzaXMpLmxlbmd0aDtcbiAgICBjb25zdCBhdHRlbXB0ZWQgPSB0aGlzLnN0YXRlLnF1ZXVlLmZpbHRlcigodikgPT4gdi5wcm9jZXNzaW5nQXR0ZW1wdHMgPiAwKS5sZW5ndGg7XG4gICAgcy5hbmFseXNpc1N1Y2Nlc3NSYXRlID0gYXR0ZW1wdGVkID4gMCA/IChhbmFseXplZCAvIGF0dGVtcHRlZCkgKiAxMDAgOiAwO1xuXG4gICAgY29uc3QgdHJhbnNjcmlwdHMgPSB0aGlzLnN0YXRlLnF1ZXVlLmZpbHRlcigodikgPT4gdi50cmFuc2NyaXB0KTtcbiAgICBzLmF2ZXJhZ2VUcmFuc2NyaXB0TGVuZ3RoID1cbiAgICAgIHRyYW5zY3JpcHRzLmxlbmd0aCA+IDBcbiAgICAgICAgPyB0cmFuc2NyaXB0cy5yZWR1Y2UoKHN1bSwgdikgPT4gc3VtICsgKHYudHJhbnNjcmlwdD8ubGVuZ3RoIHx8IDApLCAwKSAvIHRyYW5zY3JpcHRzLmxlbmd0aFxuICAgICAgICA6IDA7XG4gIH1cblxuICBwcml2YXRlIGV4dHJhY3RWaWRlb0lkKHVybDogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgY29uc3QgcGF0dGVybnMgPSBbXG4gICAgICAvKD86eW91dHViZVxcLmNvbVxcL3dhdGNoXFw/dj18eW91dHVcXC5iZVxcL3x5b3V0dWJlXFwuY29tXFwvZW1iZWRcXC8pKFteJlxccz9dKykvLFxuICAgICAgL3lvdXR1YmVcXC5jb21cXC92XFwvKFteJlxccz9dKykvLFxuICAgIF07XG4gICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIHBhdHRlcm5zKSB7XG4gICAgICBjb25zdCBtYXRjaCA9IHVybC5tYXRjaChwYXR0ZXJuKTtcbiAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXR1cm4gbWF0Y2hbMV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgZm9ybWF0RHVyYXRpb24oc2Vjb25kczogbnVtYmVyKTogc3RyaW5nIHtcbiAgICBjb25zdCBob3VycyA9IE1hdGguZmxvb3Ioc2Vjb25kcyAvIDM2MDApO1xuICAgIGNvbnN0IG1pbnV0ZXMgPSBNYXRoLmZsb29yKChzZWNvbmRzICUgMzYwMCkgLyA2MCk7XG4gICAgY29uc3Qgc2VjcyA9IE1hdGguZmxvb3Ioc2Vjb25kcyAlIDYwKTtcblxuICAgIGlmIChob3VycyA+IDApIHtcbiAgICAgIHJldHVybiBgJHtob3Vyc306JHttaW51dGVzLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKX06JHtzZWNzLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKX1gO1xuICAgIH1cbiAgICByZXR1cm4gYCR7bWludXRlc306JHtzZWNzLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKX1gO1xuICB9XG5cbiAgZGVjb2RlSHRtbEVudGl0aWVzKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRleHRcbiAgICAgIC5yZXBsYWNlKC8mYW1wOy9nLCAnJicpXG4gICAgICAucmVwbGFjZSgvJmx0Oy9nLCAnPCcpXG4gICAgICAucmVwbGFjZSgvJmd0Oy9nLCAnPicpXG4gICAgICAucmVwbGFjZSgvJnF1b3Q7L2csICdcIicpXG4gICAgICAucmVwbGFjZSgvJiMzOTsvZywgXCInXCIpXG4gICAgICAucmVwbGFjZSgvJiN4Mjc7L2csIFwiJ1wiKVxuICAgICAgLnJlcGxhY2UoLyYjeDJGOy9nLCAnLycpO1xuICB9XG5cbiAgYXN5bmMgaW5pdGlhbGl6ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyBVc2UgYSBORVcgcHJvZmlsZSB0byBhbGxvdyB0cnlpbmcgYSBkaWZmZXJlbnQgYWNjb3VudFxuICAgIGNvbnN0IHByb2ZpbGVEaXIgPSBwYXRoLmpvaW4ocHJvY2Vzcy5lbnYuSE9NRSB8fCAnL3RtcCcsICcudmlkZW8tcHJvY2Vzc29yLWNocm9tZS1jbGVhbicpO1xuXG4gICAgY29uc29sZS5sb2coJ1t2Ml0g8J+agCBMYXVuY2hpbmcgQ2hyb21lICh1c2luZyBjbGVhbiBsb2dpbiBzZXNzaW9uKS4uLicpO1xuICAgIGZzLm1rZGlyU3luYyhwcm9maWxlRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcblxuICAgIHRoaXMuY29udGV4dCA9IGF3YWl0IGNocm9taXVtLmxhdW5jaFBlcnNpc3RlbnRDb250ZXh0KHByb2ZpbGVEaXIsIHtcbiAgICAgIGhlYWRsZXNzOiBmYWxzZSxcbiAgICAgIGNoYW5uZWw6ICdjaHJvbWUnLFxuICAgICAgYXJnczogW1xuICAgICAgICAnLS1uby1maXJzdC1ydW4nLFxuICAgICAgICAnLS1uby1kZWZhdWx0LWJyb3dzZXItY2hlY2snLFxuICAgICAgICAnLS1kaXNhYmxlLWJsaW5rLWZlYXR1cmVzPUF1dG9tYXRpb25Db250cm9sbGVkJyxcbiAgICAgICAgJy0td2luZG93LXNpemU9MTI4MCw4MDAnLFxuICAgICAgXSxcbiAgICAgIHZpZXdwb3J0OiBudWxsLFxuICAgICAgaWdub3JlRGVmYXVsdEFyZ3M6IFsnLS1lbmFibGUtYXV0b21hdGlvbiddLFxuICAgICAgdXNlckFnZW50OlxuICAgICAgICAnTW96aWxsYS81LjAgKE1hY2ludG9zaDsgSW50ZWwgTWFjIE9TIFggMTBfMTVfNykgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyMC4wLjAuMCBTYWZhcmkvNTM3LjM2JyxcbiAgICB9KTtcblxuICAgIGNvbnNvbGUubG9nKCdbdjJdIOKchSBCcm93c2VyIHJlYWR5Jyk7XG4gIH1cblxuICAvLyBCcm93c2VyIGhlYWx0aCBjaGVjayAtIGVuc3VyZXMgYnJvd3NlciBjb250ZXh0IGlzIGFsaXZlXG4gIHByaXZhdGUgYXN5bmMgZW5zdXJlQnJvd3NlckhlYWx0aCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgaWYgKCF0aGlzLmNvbnRleHQpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbdjJdIOKaoO+4jyBCcm93c2VyIGNvbnRleHQgaXMgbnVsbCwgcmVpbml0aWFsaXppbmcuLi4nKTtcbiAgICAgICAgYXdhaXQgdGhpcy5pbml0aWFsaXplKCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBUcnkgdG8gY2hlY2sgaWYgY29udGV4dCBpcyBhbGl2ZSBieSBnZXR0aW5nIHBhZ2VzXG4gICAgICBjb25zdCBwYWdlcyA9IGF3YWl0IHRoaXMuY29udGV4dC5wYWdlcygpO1xuICAgICAgY29uc29sZS5sb2coYFt2Ml0g8J+PpSBCcm93c2VyIGhlYWx0aCBjaGVjazogJHtwYWdlcy5sZW5ndGh9IHBhZ2VzIG9wZW5gKTtcblxuICAgICAgLy8gSWYgdG9vIG1hbnkgcGFnZXMgYWNjdW11bGF0ZWQgKD41MCksIGNsb3NlIHRoZW1cbiAgICAgIGlmIChwYWdlcy5sZW5ndGggPiA1MCkge1xuICAgICAgICBjb25zb2xlLndhcm4oYFt2Ml0g4pqg77iPIFRvbyBtYW55IHBhZ2VzIG9wZW4gKCR7cGFnZXMubGVuZ3RofSksIGNsZWFuaW5nIHVwLi4uYCk7XG4gICAgICAgIGZvciAoY29uc3QgcGFnZSBvZiBwYWdlcykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBwYWdlLmNsb3NlKCk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gSWdub3JlIGNsb3NlIGVycm9yc1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignW3YyXSDinYwgQnJvd3NlciBoZWFsdGggY2hlY2sgZmFpbGVkOicsIGVycm9yKTtcbiAgICAgIGNvbnNvbGUubG9nKCdbdjJdIPCflIQgUmVpbml0aWFsaXppbmcgYnJvd3Nlci4uLicpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0Py5jbG9zZSgpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvKiBpZ25vcmUgKi9cbiAgICAgIH1cbiAgICAgIGF3YWl0IHRoaXMuaW5pdGlhbGl6ZSgpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgLy8gSGVscGVyIGZvciBodW1hbi1saWtlIGRlbGF5c1xuICBwcml2YXRlIGFzeW5jIGh1bWFuRGVsYXkobWluOiBudW1iZXIsIG1heDogbnVtYmVyLCBwYWdlOiBQYWdlKSB7XG4gICAgY29uc3QgZGVsYXkgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKSArIG1pbik7XG4gICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dChkZWxheSk7XG4gIH1cblxuICAvLyBIZWxwZXIgZm9yIGh1bWFuLWxpa2UgbW91c2UgbW92ZW1lbnRcbiAgcHJpdmF0ZSBhc3luYyBodW1hbk1vdmUocGFnZTogUGFnZSwgc2VsZWN0b3I6IHN0cmluZykge1xuICAgIGNvbnN0IGVsZW1lbnQgPSBhd2FpdCBwYWdlLiQoc2VsZWN0b3IpO1xuICAgIGlmICghZWxlbWVudCkgcmV0dXJuO1xuXG4gICAgY29uc3QgYm94ID0gYXdhaXQgZWxlbWVudC5ib3VuZGluZ0JveCgpO1xuICAgIGlmICghYm94KSByZXR1cm47XG5cbiAgICAvLyBTdGFydCBmcm9tIHJhbmRvbSBwb3NpdGlvblxuICAgIGF3YWl0IHBhZ2UubW91c2UubW92ZShNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA1MDApLCBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA1MDApKTtcblxuICAgIC8vIE1vdmUgdG8gdGFyZ2V0IHdpdGggXCJvdmVyc2hvb3RcIiBlZmZlY3Qgc2ltdWxhdGlvbiAoc2ltcGxlIHN0ZXBzKVxuICAgIGNvbnN0IHRhcmdldFggPSBib3gueCArIGJveC53aWR0aCAvIDI7XG4gICAgY29uc3QgdGFyZ2V0WSA9IGJveC55ICsgYm94LmhlaWdodCAvIDI7XG4gICAgYXdhaXQgcGFnZS5tb3VzZS5tb3ZlKHRhcmdldFgsIHRhcmdldFksIHsgc3RlcHM6IDI1IH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzb2x2ZUdvb2dsZUNhcHRjaGEocGFnZTogUGFnZSkge1xuICAgIGNvbnNvbGUubG9nKCdbdjJdIOKaoO+4jyBEZXRlY3RlZCBHb29nbGUgUm9ib3QgQ2hlY2suIEF0dGVtcHRpbmcgdG8gc29sdmUuLi4nKTtcblxuICAgIC8vIDEuIExvb2sgZm9yIHRoZSBpZnJhbWVcbiAgICBjb25zdCBmcmFtZXMgPSBwYWdlLmZyYW1lcygpO1xuICAgIGNvbnN0IHJlY2FwdGNoYUZyYW1lID0gZnJhbWVzLmZpbmQoKGYpID0+IGYudXJsKCkuaW5jbHVkZXMoJ2dvb2dsZS5jb20vcmVjYXB0Y2hhJykpO1xuXG4gICAgaWYgKHJlY2FwdGNoYUZyYW1lKSB7XG4gICAgICBjb25zb2xlLmxvZygnW3YyXSBGb3VuZCByZUNBUFRDSEEgZnJhbWUuIENsaWNraW5nIGNoZWNrYm94Li4uJyk7XG5cbiAgICAgIGNvbnN0IGNoZWNrYm94ID0gYXdhaXQgcmVjYXB0Y2hhRnJhbWUuJCgnLnJlY2FwdGNoYS1jaGVja2JveC1ib3JkZXIsICNyZWNhcHRjaGEtYW5jaG9yJyk7XG4gICAgICBpZiAoY2hlY2tib3gpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5odW1hbkRlbGF5KDEwMDAsIDMwMDAsIHBhZ2UpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gVXNlIFBsYXl3cmlnaHQncyBuYXRpdmUgaGFuZGxpbmcgd2hpY2ggY29ycmVjdGx5IG1hcHMgaWZyYW1lIGNvb3JkaW5hdGVzXG4gICAgICAgICAgYXdhaXQgY2hlY2tib3guaG92ZXIoKTtcbiAgICAgICAgICBhd2FpdCB0aGlzLmh1bWFuRGVsYXkoMjAwLCA1MDAsIHBhZ2UpO1xuICAgICAgICAgIGF3YWl0IGNoZWNrYm94LmNsaWNrKHsgZGVsYXk6IE1hdGgucmFuZG9tKCkgKiAxMDAgKyA1MCB9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIENsaWNrIGZhaWxlZCwgdHJ5aW5nIGZvcmNlIGNsaWNrJywgZSk7XG4gICAgICAgICAgYXdhaXQgY2hlY2tib3guZGlzcGF0Y2hFdmVudCgnY2xpY2snKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIENsaWNrZWQgY2hlY2tib3guIFdhaXRpbmcgZm9yIG91dGNvbWUuLi4nKTtcbiAgICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCg1MDAwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIENvdWxkIG5vdCBmaW5kIGNoZWNrYm94IGluc2lkZSBmcmFtZS4nKTtcbiAgICAgICAgLy8gVGFrZSBhIHNjcmVlbnNob3QgZm9yIHZhbGlkIGRlYnVnZ2luZ1xuICAgICAgICBhd2FpdCBwYWdlLnNjcmVlbnNob3QoeyBwYXRoOiBwYXRoLmpvaW4odGhpcy5yZXBvcnRzRGlyLCAnY2FwdGNoYV9mYWlsLnBuZycpIH0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBGYWxsYmFjazogbG9va2luZyBmb3Igbm9ybWFsIGJ1dHRvbnMgaWYgaXQncyBub3QgYW4gaWZyYW1lIGNhcHRjaGFcbiAgICAgIGNvbnN0IGJ1dHRvbiA9IGF3YWl0IHBhZ2UuJCgnI0wyQUdMYiwgW2FyaWEtbGFiZWw9XCJJIGFncmVlXCJdLCBidXR0b246aGFzLXRleHQoXCJJIGFncmVlXCIpJyk7XG4gICAgICBpZiAoYnV0dG9uKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIEZvdW5kIHNpbXBsZSBjb25zZW50IGJ1dHRvbi4gQ2xpY2tpbmcuLi4nKTtcbiAgICAgICAgYXdhaXQgdGhpcy5odW1hbk1vdmUocGFnZSwgJyNMMkFHTGInKTsgLy8gbW92ZSB0byBjb25zZW50XG4gICAgICAgIGF3YWl0IGJ1dHRvbi5jbGljaygpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIHdlIGFyZSBzdGlsbCBzdHVja1xuICAgIGlmIChwYWdlLnVybCgpLmluY2x1ZGVzKCdnb29nbGUuY29tL3NvcnJ5LycpKSB7XG4gICAgICBjb25zb2xlLmxvZygnW3YyXSBTdGlsbCBvbiBzb3JyeSBwYWdlLiBXYWl0aW5nIGZvciB1c2VyIGludGVydmVudGlvbiBvciBJUCByb3RhdGlvbi4uLicpO1xuICAgICAgLy8gSW4gYSByZWFsIGhlYWRsZXNzIHNjZW5hcmlvLCB3ZSdkIG5lZWQgYSBjYXB0Y2hhIHNlcnZpY2UgaGVyZS5cbiAgICAgIC8vIEZvciBub3csIHdlIHdhaXQgYSBiaXQgdG8gc2VlIGlmIGl0IGNsZWFycyBvciBpZiB3ZSBjYW4gcHJvY2VlZC5cbiAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoNTAwMCk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZmV0Y2hFbnJpY2hlZE1ldGFkYXRhKHZpZGVvOiBWaWRlb0VudHJ5KTogUHJvbWlzZTxWaWRlb01ldGFkYXRhIHwgbnVsbD4ge1xuICAgIGlmICghdGhpcy5jb250ZXh0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Jyb3dzZXIgbm90IGluaXRpYWxpemVkJyk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coYFt2Ml0g8J+TiiBFbnJpY2hlZCBtZXRhZGF0YSBmZXRjaDogJHt2aWRlby50aXRsZX1gKTtcblxuICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCB0aGlzLmNvbnRleHQubmV3UGFnZSgpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHF1ZXJ5ID0gYFlvdVR1YmUgdmlkZW8gXCIke3ZpZGVvLnVybH1cIiBjb21wbGV0ZSBpbmZvcm1hdGlvbjogZHVyYXRpb24sIGNoYW5uZWwsIGRlc2NyaXB0aW9uLCB2aWV3cywgcHVibGlzaCBkYXRlLCB0b3BpY3MsIHN1bW1hcnlgO1xuICAgICAgY29uc3Qgc2VhcmNoVXJsID0gYGh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vc2VhcmNoP3E9JHtlbmNvZGVVUklDb21wb25lbnQocXVlcnkpfSZ1ZG09NTBgO1xuXG4gICAgICBhd2FpdCBwYWdlLmdvdG8oc2VhcmNoVXJsLCB7IHdhaXRVbnRpbDogJ2RvbWNvbnRlbnRsb2FkZWQnLCB0aW1lb3V0OiAzMDAwMCB9KTtcblxuICAgICAgLy8gQ2hlY2sgZm9yIEdvb2dsZSBSb2JvdCBDaGVja1xuICAgICAgaWYgKFxuICAgICAgICBwYWdlLnVybCgpLmluY2x1ZGVzKCdnb29nbGUuY29tL3NvcnJ5LycpIHx8XG4gICAgICAgIChhd2FpdCBwYWdlLiQoJ3RleHQ9XCJ1bnVzdWFsIHRyYWZmaWNcIicpKSB8fFxuICAgICAgICAoYXdhaXQgcGFnZS4kKCdpZnJhbWVbc3JjKj1cInJlY2FwdGNoYVwiXScpKVxuICAgICAgKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuc29sdmVHb29nbGVDYXB0Y2hhKHBhZ2UpO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDUwMDApOyAvLyBMZXQgQUkgbW9kZSBnZW5lcmF0ZSByZXNwb25zZVxuXG4gICAgICBjb25zdCBwYWdlVGV4dCA9IGF3YWl0IHBhZ2UuZXZhbHVhdGUoKCkgPT4gZG9jdW1lbnQuYm9keS5pbm5lclRleHQpO1xuXG4gICAgICBsZXQgZHVyYXRpb24gPSAwO1xuICAgICAgY29uc3QgZHVyYXRpb25QYXR0ZXJucyA9IFtcbiAgICAgICAgLyhcXGQrKVxccypob3Vycz9cXHMqLD9cXHMqKFxcZCspP1xccyptaW51dGVzP1xccyosP1xccyooXFxkKyk/XFxzKnNlY29uZHM/L2ksXG4gICAgICAgIC8oXFxkKylcXHMqbWludXRlcz9cXHMqLD9cXHMqKFxcZCspP1xccypzZWNvbmRzPy9pLFxuICAgICAgICAvKFxcZCspOihcXGQrKTooXFxkKykvLFxuICAgICAgICAvKFxcZCspOihcXGQrKS8sXG4gICAgICAgIC9kdXJhdGlvbls6XFxzXSooXFxkKyk6KFxcZCspL2ksXG4gICAgICBdO1xuXG4gICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgZHVyYXRpb25QYXR0ZXJucykge1xuICAgICAgICBjb25zdCBtYXRjaCA9IHBhZ2VUZXh0Lm1hdGNoKHBhdHRlcm4pO1xuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICBpZiAobWF0Y2hbMF0udG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnaG91cicpKSB7XG4gICAgICAgICAgICBkdXJhdGlvbiA9XG4gICAgICAgICAgICAgIHBhcnNlSW50KG1hdGNoWzFdKSAqIDM2MDAgK1xuICAgICAgICAgICAgICBwYXJzZUludChtYXRjaFsyXSB8fCAnMCcpICogNjAgK1xuICAgICAgICAgICAgICBwYXJzZUludChtYXRjaFszXSB8fCAnMCcpO1xuICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2hbMF0udG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnbWludXRlJykpIHtcbiAgICAgICAgICAgIGR1cmF0aW9uID0gcGFyc2VJbnQobWF0Y2hbMV0pICogNjAgKyBwYXJzZUludChtYXRjaFsyXSB8fCAnMCcpO1xuICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2gubGVuZ3RoID09PSA0KSB7XG4gICAgICAgICAgICBkdXJhdGlvbiA9IHBhcnNlSW50KG1hdGNoWzFdKSAqIDM2MDAgKyBwYXJzZUludChtYXRjaFsyXSkgKiA2MCArIHBhcnNlSW50KG1hdGNoWzNdKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAgICAgZHVyYXRpb24gPSBwYXJzZUludChtYXRjaFsxXSkgKiA2MCArIHBhcnNlSW50KG1hdGNoWzJdKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgY2hhbm5lbFBhdHRlcm5zID0gW1xuICAgICAgICAvKD86Ynl8Y2hhbm5lbHxmcm9tKVxccyooW0EtWmEtejAtOVxcc1xcLV9dKz8pKD86XFxzKlvCt+KAolxcLXxdfFxccypcXGR8dmlld3N8c3Vic2NyaWJlcnN8JCkvaSxcbiAgICAgICAgL3VwbG9hZGVkIGJ5XFxzKihbQS1aYS16MC05XFxzXFwtX10rKS9pLFxuICAgICAgXTtcbiAgICAgIGxldCBjaGFubmVsOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgY2hhbm5lbFBhdHRlcm5zKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gcGFnZVRleHQubWF0Y2gocGF0dGVybik7XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgIGNoYW5uZWwgPSBtYXRjaFsxXS50cmltKCkuc3Vic3RyaW5nKDAsIDUwKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCB2aWV3TWF0Y2ggPSBwYWdlVGV4dC5tYXRjaCgvKFxcZCsoPzosXFxkKykqKD86XFwuXFxkKyk/W0tNQl0/KVxccyp2aWV3cz8vaSk7XG5cbiAgICAgIGNvbnN0IGRhdGVQYXR0ZXJucyA9IFtcbiAgICAgICAgLyg/OnB1Ymxpc2hlZHx1cGxvYWRlZHxwb3N0ZWQpXFxzKig/Om9uXFxzKik/KFtBLVphLXpdK1xccytcXGQrLD9cXHMqXFxkezR9KS9pLFxuICAgICAgICAvKFxcZCtcXHMqKD86ZGF5cz98d2Vla3M/fG1vbnRocz98eWVhcnM/KVxccyphZ28pL2ksXG4gICAgICBdO1xuICAgICAgbGV0IHB1Ymxpc2hEYXRlOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgZGF0ZVBhdHRlcm5zKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gcGFnZVRleHQubWF0Y2gocGF0dGVybik7XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgIHB1Ymxpc2hEYXRlID0gbWF0Y2hbMV07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgZGVzY01hdGNoID0gcGFnZVRleHQubWF0Y2goLyg/OmRlc2NyaXB0aW9ufGFib3V0KVs6XFxzXSooW14uXStcXC5bXi5dK1xcLikvaSk7XG4gICAgICBjb25zdCBzdW1tYXJ5TWF0Y2ggPSBwYWdlVGV4dC5tYXRjaCgvKD86c3VtbWFyeXxvdmVydmlld3x0aGlzIHZpZGVvKVs6XFxzXSooW14uXStcXC5bXi5dK1xcLikvaSk7XG5cbiAgICAgIGNvbnN0IG1ldGFkYXRhOiBWaWRlb01ldGFkYXRhID0ge1xuICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgZHVyYXRpb25Gb3JtYXR0ZWQ6IHRoaXMuZm9ybWF0RHVyYXRpb24oZHVyYXRpb24pLFxuICAgICAgICBjaGFubmVsLFxuICAgICAgICB2aWV3Q291bnQ6IHZpZXdNYXRjaCA/IHZpZXdNYXRjaFsxXSA6IHVuZGVmaW5lZCxcbiAgICAgICAgcHVibGlzaERhdGUsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjTWF0Y2ggPyBkZXNjTWF0Y2hbMV0uc3Vic3RyaW5nKDAsIDUwMCkgOiB1bmRlZmluZWQsXG4gICAgICAgIHN1bW1hcnk6IHN1bW1hcnlNYXRjaCA/IHN1bW1hcnlNYXRjaFsxXS5zdWJzdHJpbmcoMCwgMzAwKSA6IHVuZGVmaW5lZCxcbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcbiAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBgW3YyXSDinIUgTWV0YWRhdGE6ICR7bWV0YWRhdGEuZHVyYXRpb25Gb3JtYXR0ZWR9IHwgJHttZXRhZGF0YS5jaGFubmVsIHx8ICdVbmtub3duIGNoYW5uZWwnfWBcbiAgICAgICk7XG4gICAgICByZXR1cm4gbWV0YWRhdGE7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihgW3YyXSBFcnJvciBpbiBtZXRhZGF0YSBmZXRjaDpgLCBlKTtcbiAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGV4dHJhY3RUcmFuc2NyaXB0RGlyZWN0KHZpZGVvOiBWaWRlb0VudHJ5KTogUHJvbWlzZTxUcmFuc2NyaXB0U2VnbWVudFtdIHwgbnVsbD4ge1xuICAgIGNvbnN0IHNhZmVUaXRsZSA9IHZpZGVvLnRpdGxlLnJlcGxhY2UoL1teYS16QS1aMC05XS9nLCAnXycpLnN1YnN0cmluZygwLCA1MCk7XG5cbiAgICAvLyBDaGVjayBtdWx0aXBsZSBwb3NzaWJsZSB0cmFuc2NyaXB0IGxvY2F0aW9uc1xuICAgIGNvbnN0IGNhbmRpZGF0ZVBhdGhzID0gW1xuICAgICAgcGF0aC5qb2luKHRoaXMudHJhbnNjcmlwdHNEaXIsIGAke3ZpZGVvLmluZGV4fV8ke3ZpZGVvLnZpZGVvSWR9LnR4dGApLFxuICAgICAgcGF0aC5qb2luKHRoaXMudHJhbnNjcmlwdHNEaXIsIGAke3ZpZGVvLmluZGV4fV8ke3NhZmVUaXRsZX0udHh0YCksXG4gICAgICBwYXRoLmpvaW4oXG4gICAgICAgICcvVXNlcnMvPG93bmVyPi9EZXNrdG9wL0ExLUludGVyLUxMTS1Db20vbXktYWkta25vd2xlZGdlLWJhc2UvdmlkZW8tdHJhbnNjcmlwdHMnLFxuICAgICAgICBgdHJhbnNjcmlwdF8ke3ZpZGVvLmluZGV4fV8ke3NhZmVUaXRsZX0udHh0YFxuICAgICAgKSxcbiAgICAgIHBhdGguam9pbihcbiAgICAgICAgJy9Vc2Vycy88b3duZXI+L0Rlc2t0b3AvQTEtSW50ZXItTExNLUNvbS9teS1haS1rbm93bGVkZ2UtYmFzZS92aWRlby10cmFuc2NyaXB0cycsXG4gICAgICAgIGAke3ZpZGVvLmluZGV4fV8ke3NhZmVUaXRsZX0udHh0YFxuICAgICAgKSxcbiAgICAgIHBhdGguam9pbihcbiAgICAgICAgJy9Vc2Vycy88b3duZXI+L0Rlc2t0b3AvQTEtSW50ZXItTExNLUNvbS9teS1haS1rbm93bGVkZ2UtYmFzZS90cmFuc2NyaXB0cycsXG4gICAgICAgIGAke3ZpZGVvLmluZGV4fV8ke3NhZmVUaXRsZX0udHh0YFxuICAgICAgKSxcbiAgICAgIHBhdGguam9pbihcbiAgICAgICAgJy9Vc2Vycy88b3duZXI+L0Rlc2t0b3AvQTEtSW50ZXItTExNLUNvbS9teS1haS1rbm93bGVkZ2UtYmFzZS90cmFuc2NyaXB0cycsXG4gICAgICAgIGAke3ZpZGVvLmluZGV4fV9NYW51c19pc19vdXRfb2ZfY29udHJvbC50eHRgXG4gICAgICApLCAvLyBTcGVjaWFsIGNhc2UgaGFuZGxpbmdcbiAgICBdO1xuXG4gICAgZm9yIChjb25zdCB0cmFuc2NyaXB0RmlsZSBvZiBjYW5kaWRhdGVQYXRocykge1xuICAgICAgaWYgKGZzLmV4aXN0c1N5bmModHJhbnNjcmlwdEZpbGUpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIOKchSBVc2luZyBleGlzdGluZyB0cmFuc2NyaXB0IGZpbGU6ICR7cGF0aC5iYXNlbmFtZSh0cmFuc2NyaXB0RmlsZSl9YCk7XG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmModHJhbnNjcmlwdEZpbGUsICd1dGY4Jyk7XG4gICAgICAgIHJldHVybiBjb250ZW50XG4gICAgICAgICAgLnNwbGl0KCdcXG4nKVxuICAgICAgICAgIC5maWx0ZXIoKGxpbmUpID0+IGxpbmUudHJpbSgpKVxuICAgICAgICAgIC5tYXAoKGxpbmUsIGkpID0+ICh7XG4gICAgICAgICAgICBzdGFydDogaSAqIDUsXG4gICAgICAgICAgICBkdXJhdGlvbjogNSxcbiAgICAgICAgICAgIHRleHQ6IGxpbmUucmVwbGFjZSgvXlxcWy4qP1xcXVxccyovLCAnJykudHJpbSgpLFxuICAgICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuY29udGV4dCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdCcm93c2VyIG5vdCBpbml0aWFsaXplZCcpO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKGBbdjJdIPCfk50gVHJhbnNjcmlwdCBleHRyYWN0aW9uOiAke3ZpZGVvLnZpZGVvSWR9YCk7XG5cbiAgICBjb25zdCBwYWdlID0gYXdhaXQgdGhpcy5jb250ZXh0Lm5ld1BhZ2UoKTtcblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBwYWdlLmdvdG8odmlkZW8udXJsLCB7IHdhaXRVbnRpbDogJ2xvYWQnLCB0aW1lb3V0OiA0NTAwMCB9KTtcbiAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMzAwMCk7XG5cbiAgICAgIGNvbnN0IGNhcHRpb25EYXRhID0gYXdhaXQgcGFnZS5ldmFsdWF0ZSgoKSA9PiB7XG4gICAgICAgIGNvbnN0IHdpbiA9IHdpbmRvdyBhcyBhbnk7XG4gICAgICAgIGlmICh3aW4ueXRJbml0aWFsUGxheWVyUmVzcG9uc2U/LmNhcHRpb25zPy5wbGF5ZXJDYXB0aW9uc1RyYWNrbGlzdFJlbmRlcmVyPy5jYXB0aW9uVHJhY2tzKSB7XG4gICAgICAgICAgY29uc3QgdHJhY2tzID1cbiAgICAgICAgICAgIHdpbi55dEluaXRpYWxQbGF5ZXJSZXNwb25zZS5jYXB0aW9ucy5wbGF5ZXJDYXB0aW9uc1RyYWNrbGlzdFJlbmRlcmVyLmNhcHRpb25UcmFja3M7XG4gICAgICAgICAgY29uc3QgdHJhY2sgPSB0cmFja3MuZmluZCgodDogYW55KSA9PiB0Lmxhbmd1YWdlQ29kZSA9PT0gJ2VuJykgfHwgdHJhY2tzWzBdO1xuICAgICAgICAgIHJldHVybiB0cmFjaz8uYmFzZVVybCB8fCBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2NyaXB0cyA9IEFycmF5LmZyb20oZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnc2NyaXB0JykpO1xuICAgICAgICBmb3IgKGNvbnN0IHNjcmlwdCBvZiBzY3JpcHRzKSB7XG4gICAgICAgICAgY29uc3QgdGV4dCA9IHNjcmlwdC50ZXh0Q29udGVudCB8fCAnJztcbiAgICAgICAgICBpZiAodGV4dC5pbmNsdWRlcygnY2FwdGlvblRyYWNrcycpKSB7XG4gICAgICAgICAgICBjb25zdCBtYXRjaCA9IHRleHQubWF0Y2goL1wiY2FwdGlvblRyYWNrc1wiOlxccypcXFsoLio/KVxcXS8pO1xuICAgICAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdHJhY2tzU3RyID0gJ1snICsgbWF0Y2hbMV0gKyAnXSc7XG4gICAgICAgICAgICAgICAgY29uc3QgdHJhY2tzID0gSlNPTi5wYXJzZSh0cmFja3NTdHIpO1xuICAgICAgICAgICAgICAgIGlmICh0cmFja3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgY29uc3QgdHJhY2sgPSB0cmFja3MuZmluZCgodDogYW55KSA9PiB0Lmxhbmd1YWdlQ29kZSA9PT0gJ2VuJykgfHwgdHJhY2tzWzBdO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHRyYWNrPy5iYXNlVXJsIHx8IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoY2FwdGlvbkRhdGEpIHtcbiAgICAgICAgY29uc29sZS5sb2coYFt2Ml0gRm91bmQgY2FwdGlvbiBVUkwsIGZldGNoaW5nIHRyYW5zY3JpcHQuLi5gKTtcblxuICAgICAgICBjb25zdCBjYXB0aW9uUGFnZSA9IGF3YWl0IHRoaXMuY29udGV4dCEubmV3UGFnZSgpO1xuICAgICAgICBhd2FpdCBjYXB0aW9uUGFnZS5nb3RvKGNhcHRpb25EYXRhLCB7IHdhaXRVbnRpbDogJ2xvYWQnLCB0aW1lb3V0OiAzMDAwMCB9KTtcbiAgICAgICAgY29uc3QgeG1sID0gYXdhaXQgY2FwdGlvblBhZ2UuY29udGVudCgpO1xuICAgICAgICBhd2FpdCBjYXB0aW9uUGFnZS5jbG9zZSgpO1xuXG4gICAgICAgIGNvbnN0IHNlZ21lbnRzOiBUcmFuc2NyaXB0U2VnbWVudFtdID0gW107XG4gICAgICAgIGNvbnN0IHRleHRSZWdleCA9IC88dGV4dCBzdGFydD1cIihbXFxkLl0rKVwiIGR1cj1cIihbXFxkLl0rKVwiW14+XSo+KFtePF0qKTxcXC90ZXh0Pi9nO1xuICAgICAgICBsZXQgbWF0Y2g7XG5cbiAgICAgICAgd2hpbGUgKChtYXRjaCA9IHRleHRSZWdleC5leGVjKHhtbCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgc2VnbWVudHMucHVzaCh7XG4gICAgICAgICAgICBzdGFydDogcGFyc2VGbG9hdChtYXRjaFsxXSksXG4gICAgICAgICAgICBkdXJhdGlvbjogcGFyc2VGbG9hdChtYXRjaFsyXSksXG4gICAgICAgICAgICB0ZXh0OiB0aGlzLmRlY29kZUh0bWxFbnRpdGllcyhtYXRjaFszXSksXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2VnbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgW3YyXSDinIUgRXh0cmFjdGVkICR7c2VnbWVudHMubGVuZ3RofSB0cmFuc2NyaXB0IHNlZ21lbnRzYCk7XG4gICAgICAgICAgcmV0dXJuIHNlZ21lbnRzO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnNvbGUubG9nKCdbdjJdIFRyeWluZyBVSSB0cmFuc2NyaXB0IHBhbmVsLi4uJyk7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGV4cGFuZEJ0biA9IHBhZ2UubG9jYXRvcignI2V4cGFuZCwgdHAteXQtcGFwZXItYnV0dG9uI2V4cGFuZCcpO1xuICAgICAgICBpZiAoKGF3YWl0IGV4cGFuZEJ0bi5jb3VudCgpKSA+IDApIHtcbiAgICAgICAgICBhd2FpdCBleHBhbmRCdG4uZmlyc3QoKS5jbGljaygpO1xuICAgICAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMTAwMCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHt9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHRyYW5zY3JpcHRCdG4gPSBwYWdlLmxvY2F0b3IoXG4gICAgICAgICAgJ1thcmlhLWxhYmVsKj1cInRyYW5zY3JpcHRcIl0sIGJ1dHRvbjpoYXMtdGV4dChcInRyYW5zY3JpcHRcIiknXG4gICAgICAgICk7XG4gICAgICAgIGlmICgoYXdhaXQgdHJhbnNjcmlwdEJ0bi5jb3VudCgpKSA+IDApIHtcbiAgICAgICAgICBhd2FpdCB0cmFuc2NyaXB0QnRuLmZpcnN0KCkuY2xpY2soKTtcbiAgICAgICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDIwMDApO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlKSB7fVxuXG4gICAgICBjb25zdCB1aVNlZ21lbnRzID0gYXdhaXQgcGFnZS5ldmFsdWF0ZSgoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdDogQXJyYXk8eyBzdGFydDogbnVtYmVyOyBkdXJhdGlvbjogbnVtYmVyOyB0ZXh0OiBzdHJpbmcgfT4gPSBbXTtcbiAgICAgICAgY29uc3Qgc2VnbWVudHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCd5dGQtdHJhbnNjcmlwdC1zZWdtZW50LXJlbmRlcmVyJyk7XG4gICAgICAgIHNlZ21lbnRzLmZvckVhY2goKHNlZzogRWxlbWVudCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHRpbWVFbCA9IHNlZy5xdWVyeVNlbGVjdG9yKCcuc2VnbWVudC10aW1lc3RhbXAnKTtcbiAgICAgICAgICBjb25zdCB0ZXh0RWwgPSBzZWcucXVlcnlTZWxlY3RvcignLnNlZ21lbnQtdGV4dCcpO1xuICAgICAgICAgIGlmICh0aW1lRWwgJiYgdGV4dEVsKSB7XG4gICAgICAgICAgICBjb25zdCB0aW1lID0gdGltZUVsLnRleHRDb250ZW50Py50cmltKCkgfHwgJzA6MDAnO1xuICAgICAgICAgICAgY29uc3QgdGV4dCA9IHRleHRFbC50ZXh0Q29udGVudD8udHJpbSgpIHx8ICcnO1xuICAgICAgICAgICAgY29uc3QgcGFydHMgPSB0aW1lLnNwbGl0KCc6JykubWFwKChwOiBzdHJpbmcpID0+IHBhcnNlSW50KHApIHx8IDApO1xuICAgICAgICAgICAgY29uc3Qgc2Vjb25kcyA9XG4gICAgICAgICAgICAgIHBhcnRzLmxlbmd0aCA9PT0gM1xuICAgICAgICAgICAgICAgID8gcGFydHNbMF0gKiAzNjAwICsgcGFydHNbMV0gKiA2MCArIHBhcnRzWzJdXG4gICAgICAgICAgICAgICAgOiBwYXJ0c1swXSAqIDYwICsgKHBhcnRzWzFdIHx8IDApO1xuICAgICAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICAgICAgcmVzdWx0LnB1c2goeyBzdGFydDogc2Vjb25kcywgZHVyYXRpb246IDAsIHRleHQgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH0pO1xuXG4gICAgICBhd2FpdCBwYWdlLmNsb3NlKCk7XG5cbiAgICAgIGlmICh1aVNlZ21lbnRzICYmIHVpU2VnbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHVpU2VnbWVudHMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgICAgdWlTZWdtZW50c1tpXS5kdXJhdGlvbiA9IHVpU2VnbWVudHNbaSArIDFdLnN0YXJ0IC0gdWlTZWdtZW50c1tpXS5zdGFydDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodWlTZWdtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdWlTZWdtZW50c1t1aVNlZ21lbnRzLmxlbmd0aCAtIDFdLmR1cmF0aW9uID0gNTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhgW3YyXSDinIUgRXh0cmFjdGVkICR7dWlTZWdtZW50cy5sZW5ndGh9IHNlZ21lbnRzIChVSSlgKTtcbiAgICAgICAgcmV0dXJuIHVpU2VnbWVudHM7XG4gICAgICB9XG5cbiAgICAgIGNvbnNvbGUubG9nKCdbdjJdIOKaoO+4jyBObyB0cmFuc2NyaXB0IGF2YWlsYWJsZSB2aWEgVUkuIFRyeWluZyB5dC1kbHAuLi4nKTtcbiAgICAgIGNvbnN0IGZiID0gdGhpcy5kb3dubG9hZFRyYW5zY3JpcHRXaXRoWXREbHAodmlkZW8udXJsLCB2aWRlby52aWRlb0lkKTtcbiAgICAgIGlmIChmYikge1xuICAgICAgICBjb25zb2xlLmxvZyhgW3YyXSDinIUgeXQtZGxwIHN1Y2Nlc3M6ICR7ZmIubGVuZ3RofSBzZWdtZW50c2ApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgcmV0dXJuIGZiO1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZygnW3YyXSDimqDvuI8gTm8gdHJhbnNjcmlwdCBhdmFpbGFibGUnKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1t2Ml0gVHJhbnNjcmlwdCBlcnJvcjonLCBlKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcbiAgICAgIH0gY2F0Y2ggKHgpIHt9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXV0b21hdGVzIHRoZSBwcm9jZXNzIG9mIGxpbmtpbmcgYSBwYWlkIEFQSSBrZXkgaWYgZGV0ZWN0ZWQgYXMgbWlzc2luZy5cbiAgICogVGhpcyBwcmV2ZW50cyBcIlF1b3RhIGV4Y2VlZGVkXCIgZXJyb3JzIG9uIHRoZSBmcmVlIHRpZXIuXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGVuc3VyZVBhaWRBcGlLZXkocGFnZTogUGFnZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnNvbGUubG9nKCdbdjJdIPCfkrMgQ2hlY2tpbmcgQVBJIEtleSBjb25uZWN0aW9uLi4uJyk7XG4gICAgdHJ5IHtcbiAgICAgIC8vIExvb2sgZm9yIHRoZSBcIk5vIEFQSSBLZXlcIiBjYXJkIG9yIGJ1dHRvblxuICAgICAgY29uc3Qgbm9LZXlCdG4gPSBwYWdlXG4gICAgICAgIC5sb2NhdG9yKCcucGFpZC1hcGkta2V5LWNhcmRbYXJpYS1sYWJlbD1cIk5vIEFQSSBLZXlcIl0nKVxuICAgICAgICAub3IocGFnZS5sb2NhdG9yKCdidXR0b24nLCB7IGhhc1RleHQ6ICdObyBBUEkgS2V5JyB9KSlcbiAgICAgICAgLmZpcnN0KCk7XG5cbiAgICAgIGlmIChhd2FpdCBub0tleUJ0bi5pc1Zpc2libGUoKSkge1xuICAgICAgICBjb25zb2xlLmxvZygnW3YyXSDimqDvuI8gTm8gQVBJIEtleSBkZXRlY3RlZC4gQXR0ZW1wdGluZyB0byBsaW5rIFwiVGhlIE5ldyBGdXNlXCIuLi4nKTtcbiAgICAgICAgYXdhaXQgbm9LZXlCdG4uY2xpY2soKTtcbiAgICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgyMDAwKTtcblxuICAgICAgICAvLyAxLiBTZWxlY3QgUHJvamVjdFxuICAgICAgICBjb25zdCBwcm9qZWN0U2VsZWN0ID0gcGFnZVxuICAgICAgICAgIC5sb2NhdG9yKCdtYXQtc2VsZWN0W2FyaWEtbGFiZWw9XCJTZWxlY3QgYSBwYWlkIHByb2plY3RcIl0nKVxuICAgICAgICAgIC5maXJzdCgpO1xuICAgICAgICBpZiAoYXdhaXQgcHJvamVjdFNlbGVjdC5pc1Zpc2libGUoKSkge1xuICAgICAgICAgIGF3YWl0IHByb2plY3RTZWxlY3QuY2xpY2soKTtcbiAgICAgICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDEwMDApO1xuXG4gICAgICAgICAgLy8gVHJ5IHRvIGNsaWNrIFwiVGhlIE5ldyBGdXNlXCJcbiAgICAgICAgICBjb25zdCBmdXNlT3B0aW9uID0gcGFnZS5sb2NhdG9yKCdtYXQtb3B0aW9uJywgeyBoYXNUZXh0OiAnVGhlIE5ldyBGdXNlJyB9KS5maXJzdCgpO1xuICAgICAgICAgIGlmIChhd2FpdCBmdXNlT3B0aW9uLmlzVmlzaWJsZSgpKSB7XG4gICAgICAgICAgICBhd2FpdCBmdXNlT3B0aW9uLmNsaWNrKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEZhbGxiYWNrOiBDbGljayB0aGUgZmlyc3Qgb3B0aW9uXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW3YyXSBcIlRoZSBOZXcgRnVzZVwiIG5vdCBmb3VuZCwgc2VsZWN0aW5nIGZpcnN0IGF2YWlsYWJsZSBwcm9qZWN0LicpO1xuICAgICAgICAgICAgYXdhaXQgcGFnZS5sb2NhdG9yKCdtYXQtb3B0aW9uJykuZmlyc3QoKS5jbGljaygpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDEwMDApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gMi4gRW5hYmxlIFwiU2F2ZSBwYWlkIEFQSSBrZXlcIiBpZiBub3QgZW5hYmxlZFxuICAgICAgICBjb25zdCBzYXZlVG9nZ2xlID0gcGFnZVxuICAgICAgICAgIC5sb2NhdG9yKCdidXR0b25bcm9sZT1cInN3aXRjaFwiXVthcmlhLWxhYmVsbGVkYnk9XCJzYXZlLXBhaWQtYXBpLWtleS1sYWJlbFwiXScpXG4gICAgICAgICAgLm9yKHBhZ2UubG9jYXRvcignYnV0dG9uW3JvbGU9XCJzd2l0Y2hcIl0nKSlcbiAgICAgICAgICAuZmlyc3QoKTtcblxuICAgICAgICBpZiAoYXdhaXQgc2F2ZVRvZ2dsZS5pc1Zpc2libGUoKSkge1xuICAgICAgICAgIGNvbnN0IGlzQ2hlY2tlZCA9IGF3YWl0IHNhdmVUb2dnbGUuZ2V0QXR0cmlidXRlKCdhcmlhLWNoZWNrZWQnKTtcbiAgICAgICAgICBpZiAoaXNDaGVja2VkICE9PSAndHJ1ZScpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIFRvZ2dsaW5nIFwiU2F2ZSBwYWlkIEFQSSBrZXlcIi4uLicpO1xuICAgICAgICAgICAgYXdhaXQgc2F2ZVRvZ2dsZS5jbGljaygpO1xuICAgICAgICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCg1MDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDMuIENvbmZpcm0gKFNlbGVjdCBrZXkpXG4gICAgICAgIGNvbnN0IGNvbmZpcm1CdG4gPSBwYWdlXG4gICAgICAgICAgLmxvY2F0b3IoJ2J1dHRvbi5tcy1idXR0b24tcHJpbWFyeScsIHsgaGFzVGV4dDogJ1NlbGVjdCBrZXknIH0pXG4gICAgICAgICAgLmZpcnN0KCk7XG4gICAgICAgIGlmIChhd2FpdCBjb25maXJtQnRuLmlzVmlzaWJsZSgpKSB7XG4gICAgICAgICAgYXdhaXQgY29uZmlybUJ0bi5jbGljaygpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIOKchSBBUEkgS2V5IGxpbmtlZCBzdWNjZXNzZnVsbHkuIFJlbG9hZGluZyB0byBhcHBseSBjaGFuZ2VzLi4uJyk7XG4gICAgICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgzMDAwKTtcbiAgICAgICAgICBhd2FpdCBwYWdlLnJlbG9hZCh7IHdhaXRVbnRpbDogJ2RvbWNvbnRlbnRsb2FkZWQnIH0pO1xuICAgICAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMjAwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignW3YyXSDinYwgQ291bGQgbm90IGZpbmQgXCJTZWxlY3Qga2V5XCIgYnV0dG9uLicpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZygnW3YyXSDinIUgQVBJIEtleSBhcHBlYXJzIHRvIGJlIGxpbmtlZC4nKTtcbiAgICAgICAgLy8gR2l2ZSBBSSBTdHVkaW8gZXh0cmEgdGltZSB0byBmdWxseSB0cmFuc2l0aW9uIHRvIHBhaWQgbW9kZVxuICAgICAgICBjb25zb2xlLmxvZygnW3YyXSDij7MgV2FpdGluZyBmb3IgQVBJIHRyYW5zaXRpb24gdG8gY29tcGxldGUuLi4nKTtcbiAgICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgzMDAwKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbdjJdIEVycm9yIGNoZWNraW5nL2xpbmtpbmcgQVBJIEtleTonLCBlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRHluYW1pY2FsbHkgc2VsZWN0cyB0aGUgcmVxdWVzdGVkIG1vZGVsIGZyb20gdGhlIFVJLlxuICAgKiBJZiB0aGUgZXhhY3QgbW9kZWwgaXMgbm90IGZvdW5kLCB0cmllcyB0byBmaW5kIGEgY2xvc2UgbWF0Y2ggb3IgbG9ncyBhdmFpbGFibGUgbW9kZWxzLlxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBzZWxlY3RCZXN0TW9kZWwocGFnZTogUGFnZSwgdGFyZ2V0TW9kZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnNvbGUubG9nKGBbdjJdIPCflI0gQXR0ZW1wdGluZyB0byBzZWxlY3QgbW9kZWw6ICR7dGFyZ2V0TW9kZWx9YCk7XG4gICAgdHJ5IHtcbiAgICAgIC8vIDEuIEZpbmQgYWxsIHBvdGVudGlhbCBkcm9wZG93biB0cmlnZ2Vyc1xuICAgICAgY29uc3QgY2FuZGlkYXRlcyA9IHBhZ2UubG9jYXRvcignYnV0dG9uLCBtcy1zZWxlY3QsIG1hdC1zZWxlY3QnKTtcbiAgICAgIGNvbnN0IGNvdW50ID0gYXdhaXQgY2FuZGlkYXRlcy5jb3VudCgpO1xuICAgICAgbGV0IG1vZGVsU2VsZWN0b3I6IGFueSA9IG51bGw7XG4gICAgICBjb25zb2xlLmxvZyhgW3YyXSBERUJVRzogRm91bmQgJHtjb3VudH0gY2FuZGlkYXRlcy5gKTtcbiAgICAgIGxldCBiZXN0TWF0Y2g6IGFueSA9IG51bGw7XG4gICAgICBsZXQgZGVmYXVsdE1hdGNoOiBhbnkgPSBudWxsO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgY29uc3QgZWwgPSBjYW5kaWRhdGVzLm50aChpKTtcbiAgICAgICAgY29uc3QgaXNWaXNpYmxlID0gYXdhaXQgZWwuaXNWaXNpYmxlKCk7XG4gICAgICAgIGlmICghaXNWaXNpYmxlKSBjb250aW51ZTtcblxuICAgICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgZWwuaW5uZXJUZXh0KCk7XG4gICAgICAgIGNvbnN0IGxhYmVsID0gKGF3YWl0IGVsLmdldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcpKSB8fCAnJztcbiAgICAgICAgY29uc3QgY2xzID0gKGF3YWl0IGVsLmdldEF0dHJpYnV0ZSgnY2xhc3MnKSkgfHwgJyc7XG5cbiAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgYFt2Ml0gQ2FuZGlkYXRlICMke2l9OiBUZXh0PVwiJHt0ZXh0LnJlcGxhY2UoL1xcbi9nLCAnXFxcXG4nKX1cIiwgTGFiZWw9XCIke2xhYmVsfVwiLCBDbGFzcz1cIiR7Y2xzfVwiYFxuICAgICAgICApO1xuXG4gICAgICAgIC8vIEhldXJpc3RpY3MgdG8gaWRlbnRpZnkgdGhlIG1vZGVsIHNlbGVjdG9yOlxuICAgICAgICAvLyAtIFRleHQgY29udGFpbnMgXCJHZW1pbmlcIlxuICAgICAgICAvLyAtIGxhYmVsIGNvbnRhaW5zIFwibW9kZWxcIiAoY2FzZS1pbnNlbnNpdGl2ZSlcbiAgICAgICAgLy8gLSBjbGFzcyBjb250YWlucyBcIm1vZGVsLXNlbGVjdG9yXCJcbiAgICAgICAgLy8gLSBFWENMVURFIGZpbHRlciBjaGlwc1xuICAgICAgICBpZiAoXG4gICAgICAgICAgKHRleHQuaW5jbHVkZXMoJ0dlbWluaScpIHx8XG4gICAgICAgICAgICBsYWJlbC50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdtb2RlbCcpIHx8XG4gICAgICAgICAgICBjbHMuaW5jbHVkZXMoJ21vZGVsLXNlbGVjdG9yJykpICYmXG4gICAgICAgICAgIWNscy5pbmNsdWRlcygnZmlsdGVyLWNoaXAnKVxuICAgICAgICApIHtcbiAgICAgICAgICAvLyBFeGNsdWRlIGNvbW1vbmx5IGNvbmZ1c2VkIHRoaW5ncyBpZiBjaGVja3MgYXJlIHdlYWtcbiAgICAgICAgICBpZiAobGFiZWwudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnc2V0dGluZycpKSBjb250aW51ZTtcblxuICAgICAgICAgIC8vIENyaXRpY2FsOiBJZiB3ZSB3YW50IEZsYXNoLCBETyBOT1QgYWNjZXB0IFBybyBjYXJkXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgdGFyZ2V0TW9kZWwuaW5jbHVkZXMoJ2ZsYXNoJykgJiZcbiAgICAgICAgICAgIHRleHQudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygncHJvJykgJiZcbiAgICAgICAgICAgICF0ZXh0LnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2ZsYXNoJylcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIElnbm9yaW5nIFBybyBjYW5kaWRhdGUgIyR7aX0gYmVjYXVzZSB3ZSB3YW50IEZsYXNoYCk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBQcmlvcml0aXplIGV4YWN0IG1hdGNoIChlLmcuIEZsYXNoKVxuICAgICAgICAgIGlmICh0YXJnZXRNb2RlbC5pbmNsdWRlcygnZmxhc2gnKSAmJiB0ZXh0LnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2ZsYXNoJykpIHtcbiAgICAgICAgICAgIGJlc3RNYXRjaCA9IGVsO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFt2Ml0gRmxhc2ggTUFUQ0ggRk9VTkQgYXQgIyR7aX1gKTtcbiAgICAgICAgICAgIGJyZWFrOyAvLyBGb3VuZCB0aGUgYmVzdCBvbmVcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgdGFyZ2V0TW9kZWwuaW5jbHVkZXMoJ3BybycpICYmXG4gICAgICAgICAgICB0ZXh0LnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ3BybycpICYmXG4gICAgICAgICAgICAhdGFyZ2V0TW9kZWwuaW5jbHVkZXMoJ2ZsYXNoJylcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGJlc3RNYXRjaCA9IGVsO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFt2Ml0gUHJvIE1BVENIIEZPVU5EIGF0ICMke2l9YCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBLZWVwIGdlbmVyaWMgbWF0Y2hcbiAgICAgICAgICBpZiAoIWRlZmF1bHRNYXRjaCkge1xuICAgICAgICAgICAgZGVmYXVsdE1hdGNoID0gZWw7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW3YyXSBHZW5lcmljIE1BVENIIEZPVU5EIGF0ICMke2l9IChrZWVwaW5nIGFzIGJhY2t1cClgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIG1vZGVsU2VsZWN0b3IgPSBiZXN0TWF0Y2ggfHwgZGVmYXVsdE1hdGNoO1xuICAgICAgaWYgKG1vZGVsU2VsZWN0b3IpXG4gICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgIGBbdjJdIFNlbGVjdGVkIGNhbmRpZGF0ZTogJHttb2RlbFNlbGVjdG9yID09PSBiZXN0TWF0Y2ggPyAnQmVzdCBNYXRjaCcgOiAnRGVmYXVsdCBNYXRjaCd9YFxuICAgICAgICApO1xuXG4gICAgICAvLyBGQUxMQkFDSzogSWYgb24gZGFzaGJvYXJkLCBjbGljayBcIk5ldyBjaGF0XCJcbiAgICAgIGlmICghbW9kZWxTZWxlY3Rvcikge1xuICAgICAgICBjb25zdCBuZXdDaGF0QnRuID0gcGFnZS5sb2NhdG9yKCdidXR0b25bYXJpYS1sYWJlbD1cIk5ldyBjaGF0XCJdJykuZmlyc3QoKTtcbiAgICAgICAgaWYgKGF3YWl0IG5ld0NoYXRCdG4uaXNWaXNpYmxlKCkpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnW3YyXSBNb2RlbCBzZWxlY3RvciBub3QgZm91bmQuIENsaWNraW5nIFwiTmV3IGNoYXRcIiB0byBlbnRlciBlZGl0b3IuLi4nKTtcbiAgICAgICAgICBhd2FpdCBuZXdDaGF0QnRuLmNsaWNrKCk7XG4gICAgICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgzMDAwKTtcblxuICAgICAgICAgIC8vIFJldHJ5IGZpbmRpbmcgc2VsZWN0b3IgT05FIHRpbWUgKHNpbXBsZSByZWN1cnNpb24gd2l0aCBmbGFnIGNvdWxkIHdvcmssIGJ1dCBoZXJlIEknbGwganVzdCBjb3B5IGxvZ2ljIG9yIHJlbHkgb24gbmV4dCBzdGVwcylcbiAgICAgICAgICAvLyBCZXR0ZXI6IFJldHVybiBhbmQgbGV0IGNhbGxlciBoYW5kbGU/IE5vLlxuICAgICAgICAgIC8vIExldCdzIGp1c3QgdHJ5IHRvIGZpbmQgaXQgYWdhaW4uXG4gICAgICAgICAgY29uc3QgcmV0cnlDYW5kaWRhdGVzID0gcGFnZS5sb2NhdG9yKCdidXR0b24sIG1zLXNlbGVjdCwgbWF0LXNlbGVjdCcpO1xuICAgICAgICAgIGNvbnN0IHJldHJ5Q291bnQgPSBhd2FpdCByZXRyeUNhbmRpZGF0ZXMuY291bnQoKTtcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJldHJ5Q291bnQ7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgZWwgPSByZXRyeUNhbmRpZGF0ZXMubnRoKGkpO1xuICAgICAgICAgICAgaWYgKCEoYXdhaXQgZWwuaXNWaXNpYmxlKCkpKSBjb250aW51ZTtcbiAgICAgICAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCBlbC5pbm5lclRleHQoKTtcbiAgICAgICAgICAgIGNvbnN0IGxhYmVsID0gKGF3YWl0IGVsLmdldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcpKSB8fCAnJztcbiAgICAgICAgICAgIGNvbnN0IGNscyA9IChhd2FpdCBlbC5nZXRBdHRyaWJ1dGUoJ2NsYXNzJykpIHx8ICcnO1xuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICh0ZXh0LmluY2x1ZGVzKCdHZW1pbmknKSB8fFxuICAgICAgICAgICAgICAgIGxhYmVsLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ21vZGVsJykgfHxcbiAgICAgICAgICAgICAgICBjbHMuaW5jbHVkZXMoJ21vZGVsLXNlbGVjdG9yJykpICYmXG4gICAgICAgICAgICAgICFjbHMuaW5jbHVkZXMoJ2ZpbHRlci1jaGlwJylcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBpZiAoIWxhYmVsLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ3NldHRpbmcnKSkge1xuICAgICAgICAgICAgICAgIG1vZGVsU2VsZWN0b3IgPSBlbDtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW3YyXSBNQVRDSCBGT1VORCBvbiByZXRyeSFgKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAobW9kZWxTZWxlY3Rvcikge1xuICAgICAgICBjb25zdCBjdXJyZW50TW9kZWwgPSBhd2FpdCBtb2RlbFNlbGVjdG9yLmlubmVyVGV4dCgpO1xuICAgICAgICBjb25zb2xlLmxvZyhgW3YyXSBDdXJyZW50IG1vZGVsIHNlbGVjdGVkOiAke2N1cnJlbnRNb2RlbH1gKTtcblxuICAgICAgICAvLyBJZiB3ZSBhcmUgYWxyZWFkeSBvbiB0aGUgdGFyZ2V0IChmdXp6eSBtYXRjaCksIHNraXBcbiAgICAgICAgaWYgKHRhcmdldE1vZGVsLmluY2x1ZGVzKCdmbGFzaCcpICYmIGN1cnJlbnRNb2RlbC50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdmbGFzaCcpKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1t2Ml0g4pyFIFwiRmxhc2hcIiBtb2RlbCBhbHJlYWR5IGFjdGl2ZS4nKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCBtb2RlbFNlbGVjdG9yLmNsaWNrKCk7XG4gICAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMTAwMCk7XG5cbiAgICAgICAgLy8gMi4gU2NyYXBlIGF2YWlsYWJsZSBtb2RlbHNcbiAgICAgICAgLy8gVHJ5IG11bHRpcGxlIHNlbGVjdG9ycyBmb3Igb3B0aW9ucyBsaXN0XG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSBwYWdlLmxvY2F0b3IoJ21hdC1vcHRpb24sIFtyb2xlPVwib3B0aW9uXCJdLCAubW9kZWwtb3B0aW9uJyk7XG4gICAgICAgIGNvbnN0IG9wdENvdW50ID0gYXdhaXQgb3B0aW9ucy5jb3VudCgpO1xuICAgICAgICBjb25zdCBhdmFpbGFibGVNb2RlbHM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgLy8gVXNlIGEgU2V0IHRvIGF2b2lkIGR1cGxpY2F0ZXMgaWYgc2VsZWN0b3JzIG92ZXJsYXBcbiAgICAgICAgY29uc3QgbW9kZWxTZXQgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9wdENvdW50OyBpKyspIHtcbiAgICAgICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgb3B0aW9ucy5udGgoaSkuaW5uZXJUZXh0KCk7XG4gICAgICAgICAgLy8gQ2xlYW4gdXAgdGV4dCAocmVtb3ZlIG5ld2xpbmVzL2Rlc2NyaXB0aW9ucylcbiAgICAgICAgICBjb25zdCBjbGVhblRleHQgPSB0ZXh0LnNwbGl0KCdcXG4nKVswXS50cmltKCk7XG4gICAgICAgICAgYXZhaWxhYmxlTW9kZWxzLnB1c2goY2xlYW5UZXh0KTtcbiAgICAgICAgICBtb2RlbFNldC5hZGQoY2xlYW5UZXh0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIPCfk4sgQXZhaWxhYmxlIE1vZGVsczogJHtBcnJheS5mcm9tKG1vZGVsU2V0KS5qb2luKCcsICcpfWApO1xuXG4gICAgICAgIC8vIDMuIFNlbGVjdCBiZXN0IG1hdGNoXG4gICAgICAgIGxldCBiZXN0TWF0Y2hJbmRleCA9IC0xO1xuXG4gICAgICAgIC8vIEV4YWN0LWlzaCBtYXRjaFxuICAgICAgICBiZXN0TWF0Y2hJbmRleCA9IGF2YWlsYWJsZU1vZGVscy5maW5kSW5kZXgoKG0pID0+XG4gICAgICAgICAgbS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHRhcmdldE1vZGVsLnRvTG93ZXJDYXNlKCkpXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKGJlc3RNYXRjaEluZGV4ID09PSAtMSkge1xuICAgICAgICAgIC8vIEZhbGxiYWNrIGZvciBrbm93biBhbGlhc2VzXG4gICAgICAgICAgaWYgKHRhcmdldE1vZGVsLmluY2x1ZGVzKCdmbGFzaCcpKSB7XG4gICAgICAgICAgICBiZXN0TWF0Y2hJbmRleCA9IGF2YWlsYWJsZU1vZGVscy5maW5kSW5kZXgoXG4gICAgICAgICAgICAgIChtKSA9PiBtLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2ZsYXNoJykgJiYgIW0udG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnbGVnYWN5JylcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSBlbHNlIGlmICh0YXJnZXRNb2RlbC5pbmNsdWRlcygncHJvJykpIHtcbiAgICAgICAgICAgIGJlc3RNYXRjaEluZGV4ID0gYXZhaWxhYmxlTW9kZWxzLmZpbmRJbmRleChcbiAgICAgICAgICAgICAgKG0pID0+IG0udG9Mb3dlckNhc2UoKS5pbmNsdWRlcygncHJvJykgJiYgIW0udG9Mb3dlckNhc2UoKS5pbmNsdWRlcygndmlzaW9uJylcbiAgICAgICAgICAgICk7IC8vICd2aXNpb24nIGlzIG9mdGVuIG9sZGVyXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGJlc3RNYXRjaEluZGV4ICE9PSAtMSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIPCfkYkgU2VsZWN0aW5nOiAke2F2YWlsYWJsZU1vZGVsc1tiZXN0TWF0Y2hJbmRleF19YCk7XG4gICAgICAgICAgYXdhaXQgb3B0aW9ucy5udGgoYmVzdE1hdGNoSW5kZXgpLmNsaWNrKCk7XG4gICAgICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgyMDAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICBgW3YyXSDimqDvuI8gQ291bGQgbm90IGZpbmQgdGFyZ2V0IG1vZGVsICR7dGFyZ2V0TW9kZWx9LiBLZWVwaW5nIGN1cnJlbnQgc2VsZWN0aW9uLmBcbiAgICAgICAgICApO1xuICAgICAgICAgIGF3YWl0IHBhZ2Uua2V5Ym9hcmQucHJlc3MoJ0VzY2FwZScpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAnW3YyXSDimqDvuI8gTW9kZWwgc2VsZWN0b3Igbm90IGZvdW5kIChjaGVja2VkIGFsbCBidXR0b25zKS4gYXNzdW1pbmcgc3RyaWN0IFVSTCBwYXJhbSB3b3JrZWQuJ1xuICAgICAgICApO1xuICAgICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgcGFnZS5jb250ZW50KCk7XG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoJ2FpX3N0dWRpb19kdW1wLmh0bWwnLCBjb250ZW50KTtcbiAgICAgICAgY29uc29sZS5sb2coJ1t2Ml0gRHVtcGVkIEFJIFN0dWRpbyBIVE1MIHRvIGFpX3N0dWRpb19kdW1wLmh0bWwnKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbdjJdIOKaoO+4jyBFcnJvciBzZWxlY3RpbmcgbW9kZWw6JywgZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gLS0tIEZJWEVEIFBBUlNJTkcgTUVUSE9EIC0tLVxuICBhc3luYyBhbmFseXplV2l0aEFJKHZpZGVvOiBWaWRlb0VudHJ5KTogUHJvbWlzZTxBbmFseXNpc1Jlc3VsdCB8IG51bGw+IHtcbiAgICBpZiAoIXRoaXMuY29udGV4dCB8fCAhdmlkZW8udHJhbnNjcmlwdCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coYFt2Ml0g8J+kliBBSSBBbmFseXNpczogJHt2aWRlby50aXRsZX1gKTtcblxuICAgIGxldCBwYWdlOiBQYWdlIHwgbnVsbCA9IG51bGw7XG5cbiAgICB0cnkge1xuICAgICAgLy8gRlJFU0ggcGFnZSBmb3IgQUkgU3R1ZGlvIC0gQ2hlY2sgY29udGV4dCBoZWFsdGggZmlyc3RcbiAgICAgIHRyeSB7XG4gICAgICAgIHBhZ2UgPSBhd2FpdCB0aGlzLmNvbnRleHQubmV3UGFnZSgpO1xuICAgICAgfSBjYXRjaCAoY29udGV4dEVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1t2Ml0g4p2MIEJyb3dzZXIgY29udGV4dCBpcyBkZWFkLCBjYW5ub3QgY3JlYXRlIHBhZ2U6JywgY29udGV4dEVycm9yKTtcbiAgICAgICAgLy8gVHJ5IHRvIHJlaW5pdGlhbGl6ZVxuICAgICAgICBjb25zb2xlLmxvZygnW3YyXSBBdHRlbXB0aW5nIHRvIHJlc3RhcnQgYnJvd3Nlci4uLicpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGF3YWl0IHRoaXMuY29udGV4dD8uY2xvc2UoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIC8qIGlnbm9yZSAqL1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMuaW5pdGlhbGl6ZSgpO1xuICAgICAgICBwYWdlID0gYXdhaXQgdGhpcy5jb250ZXh0IS5uZXdQYWdlKCk7XG4gICAgICB9XG4gICAgICAvLyBDb21iaW5lIHRyYW5zY3JpcHRcbiAgICAgIGNvbnN0IGZ1bGxUcmFuc2NyaXB0ID0gdmlkZW8udHJhbnNjcmlwdC5tYXAoKHMpID0+IHMudGV4dCkuam9pbignICcpO1xuICAgICAgY29uc3QgdHJ1bmNhdGVkVHJhbnNjcmlwdCA9IGZ1bGxUcmFuc2NyaXB0LnN1YnN0cmluZygwLCAyNTAwMCk7IC8vIFN0YXkgd2l0aGluIGxpbWl0c1xuXG4gICAgICAvLyBOYXZpZ2F0ZSB0byBBSSBTdHVkaW8gd2l0aCBsYXRlc3QgbW9kZWxcbiAgICAgIGF3YWl0IHBhZ2UuZ290byhBSV9TVFVESU9fVVJMLCB7IHdhaXRVbnRpbDogJ2RvbWNvbnRlbnRsb2FkZWQnLCB0aW1lb3V0OiA2MDAwMCB9KTtcbiAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoNTAwMCk7XG5cbiAgICAgIC8vIERpc21pc3MgYW55IGRpYWxvZ3NcbiAgICAgIGZvciAoY29uc3Qgc2VsZWN0b3Igb2YgW1xuICAgICAgICAnYnV0dG9uOmhhcy10ZXh0KFwiR290IGl0XCIpJyxcbiAgICAgICAgJ2J1dHRvbjpoYXMtdGV4dChcIkNvbnRpbnVlXCIpJyxcbiAgICAgICAgJ1thcmlhLWxhYmVsPVwiQ2xvc2VcIl0nLFxuICAgICAgXSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGVsID0gcGFnZS5sb2NhdG9yKHNlbGVjdG9yKTtcbiAgICAgICAgICBpZiAoKGF3YWl0IGVsLmNvdW50KCkpID4gMCAmJiAoYXdhaXQgZWwuZmlyc3QoKS5pc1Zpc2libGUoKSkpIHtcbiAgICAgICAgICAgIGF3YWl0IGVsLmZpcnN0KCkuY2xpY2soeyBmb3JjZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoNTAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAvKiBpZ25vcmUgKi9cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYXdhaXQgcGFnZS5rZXlib2FyZC5wcmVzcygnRXNjYXBlJyk7XG4gICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDUwMCk7XG5cbiAgICAgIC8vIFNraXAgQVBJIEtleSBjaGVjayAtIHVzZSBicm93c2VyIHNlc3Npb24gZGlyZWN0bHlcbiAgICAgIC8vIGF3YWl0IHRoaXMuZW5zdXJlUGFpZEFwaUtleShwYWdlKTtcbiAgICAgIGNvbnNvbGUubG9nKCdbdjJdIPCfkrMgVXNpbmcgYnJvd3NlciBzZXNzaW9uIChza2lwcGluZyBBUEkga2V5IGNoZWNrKScpO1xuXG4gICAgICAvLyBFbnN1cmUgY29ycmVjdCBtb2RlbCBpcyBzZWxlY3RlZFxuICAgICAgYXdhaXQgdGhpcy5zZWxlY3RCZXN0TW9kZWwocGFnZSwgR0VNSU5JX01PREVMKTtcblxuICAgICAgLy8gRW50ZXIgcHJvbXB0XG4gICAgICBjb25zdCB0ZXh0YXJlYSA9IHBhZ2UubG9jYXRvcigndGV4dGFyZWFbYXJpYS1sYWJlbD1cIkVudGVyIGEgcHJvbXB0XCJdJyk7XG4gICAgICBhd2FpdCB0ZXh0YXJlYS53YWl0Rm9yKHsgc3RhdGU6ICd2aXNpYmxlJywgdGltZW91dDogMTUwMDAgfSk7XG4gICAgICBhd2FpdCB0ZXh0YXJlYS5jbGljayh7IGZvcmNlOiB0cnVlIH0pO1xuXG4gICAgICBjb25zdCBmdWxsUHJvbXB0ID0gQU5BTFlTSVNfUFJPTVBUICsgdHJ1bmNhdGVkVHJhbnNjcmlwdDtcbiAgICAgIGF3YWl0IHRleHRhcmVhLmZpbGwoZnVsbFByb21wdCk7XG4gICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDEwMDApO1xuXG4gICAgICAvLyBDbGljayBSdW5cbiAgICAgIGNvbnN0IHJ1bkJ0biA9IHBhZ2UubG9jYXRvcignYnV0dG9uW2FyaWEtbGFiZWw9XCJSdW5cIl0nKTtcbiAgICAgIGF3YWl0IHJ1bkJ0bi5jbGljaygpO1xuXG4gICAgICBjb25zb2xlLmxvZygnW3YyXSBXYWl0aW5nIGZvciBBSSByZXNwb25zZS4uLicpO1xuXG4gICAgICAvLyBXYWl0IGZvciByZXNwb25zZSB3aXRoIGJldHRlciBleHRyYWN0aW9uXG4gICAgICBjb25zdCBzdGFydFdhaXQgPSBEYXRlLm5vdygpO1xuICAgICAgY29uc3QgdGltZW91dCA9IDIgKiA2MCAqIDEwMDA7IC8vIDIgbWludXRlc1xuXG4gICAgICAvLyBJbml0aWFsIGxvbmdlciB3YWl0IGZvciBmaXJzdCByZXF1ZXN0IGFmdGVyIEFQSSBrZXkgc2V0dXBcbiAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoNTAwMCk7XG5cbiAgICAgIHdoaWxlIChEYXRlLm5vdygpIC0gc3RhcnRXYWl0IDwgdGltZW91dCkge1xuICAgICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDMwMDApO1xuXG4gICAgICAgIC8vIENoZWNrIGZvciBlcnJvciBtZXNzYWdlcyAoUGVybWlzc2lvbiBkZW5pZWQsIGV0Yy4pXG4gICAgICAgIGNvbnN0IGVycm9yVG9hc3QgPSBwYWdlXG4gICAgICAgICAgLmxvY2F0b3IoJ21hdC1zbmFjay1iYXItY29udGFpbmVyJylcbiAgICAgICAgICAub3IocGFnZS5sb2NhdG9yKCcuZXJyb3ItbWVzc2FnZScpKVxuICAgICAgICAgIC5vcihwYWdlLmdldEJ5VGV4dCgnUGVybWlzc2lvbiBkZW5pZWQnKSlcbiAgICAgICAgICAub3IocGFnZS5nZXRCeVRleHQoJ0ZhaWxlZCB0byBnZW5lcmF0ZScpKTtcblxuICAgICAgICBpZiAoKGF3YWl0IGVycm9yVG9hc3QuY291bnQoKSkgPiAwICYmIChhd2FpdCBlcnJvclRvYXN0LmZpcnN0KCkuaXNWaXNpYmxlKCkpKSB7XG4gICAgICAgICAgY29uc3QgZXJyb3JUZXh0ID0gYXdhaXQgZXJyb3JUb2FzdC5maXJzdCgpLmlubmVyVGV4dCgpO1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFt2Ml0g4p2MIEFJIFN0dWRpbyBFcnJvciBkZXRlY3RlZDogJHtlcnJvclRleHR9YCk7XG4gICAgICAgICAgaWYgKGVycm9yVGV4dC50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdwZXJtaXNzaW9uIGRlbmllZCcpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICAgICBgW3YyXSDwn5uRIEZBVEFMIEVSUk9SOiBBY2NvdW50IHBlcm1pc3Npb25zIGlzc3VlLiBTdG9wcGluZyBlbnRpcmUgcHJvY2Vzcy5gXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgLy8gV2UgbmVlZCB0byBleGl0IHRoZSBlbnRpcmUgcHJvY2VzcyBzbyB0aGUgdXNlciBjYW4gZml4IHRoZSBhY2NvdW50XG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQUkgU3R1ZGlvIEVycm9yOiAke2Vycm9yVGV4dH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIGZvciBjb21wbGV0aW9uIGJ5IGxvb2tpbmcgZm9yIHRoZSByZXNwb25zZSBjb250YWluZXJcbiAgICAgICAgY29uc3QgcmVzcG9uc2VDb250YWluZXIgPSBwYWdlLmxvY2F0b3IoXG4gICAgICAgICAgJ21zLWNoYXQtdHVybi5tb2RlbCAudHVybi1jb250ZW50LCAuY2hhdC10dXJuLWNvbnRhaW5lci5tb2RlbCAudHVybi1jb250ZW50J1xuICAgICAgICApO1xuXG4gICAgICAgIGlmICgoYXdhaXQgcmVzcG9uc2VDb250YWluZXIuY291bnQoKSkgPiAwKSB7XG4gICAgICAgICAgLy8gR2V0IHRoZSBpbm5lciB0ZXh0IGRpcmVjdGx5LCBub3QgaW5jbHVkaW5nIFVJIGVsZW1lbnRzXG4gICAgICAgICAgY29uc3QgcmF3VGV4dCA9IGF3YWl0IHBhZ2UuZXZhbHVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgLy8gRmluZCB0aGUgYWN0dWFsIHJlc3BvbnNlIHRleHQsIGV4Y2x1ZGluZyB0b29sYmFyIGJ1dHRvbnNcbiAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lcnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFxuICAgICAgICAgICAgICAnbXMtY2hhdC10dXJuLm1vZGVsIC50dXJuLWNvbnRlbnQsIC5jaGF0LXR1cm4tY29udGFpbmVyLm1vZGVsIC50dXJuLWNvbnRlbnQnXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKGNvbnRhaW5lcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBsYXN0Q29udGFpbmVyID0gY29udGFpbmVyc1tjb250YWluZXJzLmxlbmd0aCAtIDFdO1xuXG4gICAgICAgICAgICAvLyBHZXQgdGV4dCBmcm9tIG1hcmtkb3duIGNvbnRlbnQgaWYgYXZhaWxhYmxlXG4gICAgICAgICAgICBjb25zdCBtYXJrZG93biA9IGxhc3RDb250YWluZXIucXVlcnlTZWxlY3RvcihcbiAgICAgICAgICAgICAgJy5tYXJrZG93bi1ib2R5LCAubWFya2Rvd24tY29udGVudCwgLnJlbmRlcmVkLW1hcmtkb3duJ1xuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGxldCBjb250ZW50ID0gbWFya2Rvd24gPyBtYXJrZG93bi50ZXh0Q29udGVudCB8fCAnJyA6IGxhc3RDb250YWluZXIudGV4dENvbnRlbnQgfHwgJyc7XG5cbiAgICAgICAgICAgIC8vIENMRUFOSU5HOiBSZW1vdmUgXCJNb2RlbCBUaGlua2luZ1wiIGJsb2NrcyB3aGljaCBjbHV0dGVyIHRoZSBvdXRwdXRcbiAgICAgICAgICAgIC8vIEdlbWluaSBGbGFzaCBzb21ldGltZXMgb3V0cHV0cyBcIk1vZGVsIFRoaW5raW5nLi4uXCIgZm9sbG93ZWQgYnkgdGhvdWdodHNcbiAgICAgICAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoXG4gICAgICAgICAgICAgIC9Nb2RlbCBUaGlua2luZ1tcXHNcXFNdKj8oPzpFeHBhbmQgdG8gdmlldyBtb2RlbCB0aG91Z2h0c3xjaGV2cm9uX3JpZ2h0KS9nLFxuICAgICAgICAgICAgICAnJ1xuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoL01vZGVsIFRoaW5raW5nW1xcc1xcU10qP2pzb24vaSwgJycpO1xuXG4gICAgICAgICAgICAvLyBSZW1vdmUgY29tbW9uIFVJIHRleHQgcGF0dGVybnNcbiAgICAgICAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoXG4gICAgICAgICAgICAgIC9tb3JlX3ZlcnR8Y29udGVudF9jb3B5fGRvd25sb2FkfGV4cGFuZF9sZXNzfGV4cGFuZF9tb3JlfE1vZGVsIGNvZGUgSlNPTi9nLFxuICAgICAgICAgICAgICAnJ1xuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQudHJpbSgpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgaWYgKHJhd1RleHQgJiYgcmF3VGV4dC5sZW5ndGggPiA1MCkge1xuICAgICAgICAgICAgLy8gVHJ5IHRvIGV4dHJhY3QgSlNPTiBmcm9tIHRoZSByZXNwb25zZVxuICAgICAgICAgICAgY29uc3QganNvblBhdHRlcm5zID0gW1xuICAgICAgICAgICAgICAvYGBganNvblxccyooXFx7W1xcc1xcU10qP1xcfSlcXHMqYGBgLywgLy8gU3RhbmRhcmQgbWFya2Rvd24ganNvbiBibG9ja1xuICAgICAgICAgICAgICAvYGBgXFxzKihcXHtbXFxzXFxTXSo/XFx9KVxccypgYGAvLCAvLyBHZW5lcmljIG1hcmtkb3duIGJsb2NrXG4gICAgICAgICAgICAgIC9eKFxce1tcXHNcXFNdKlxcfSkkLywgLy8gSnVzdCBKU09OXG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBsZXQgYW5hbHlzaXM6IEFuYWx5c2lzUmVzdWx0IHwgbnVsbCA9IG51bGw7XG5cbiAgICAgICAgICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBqc29uUGF0dGVybnMpIHtcbiAgICAgICAgICAgICAgY29uc3QgbWF0Y2ggPSByYXdUZXh0Lm1hdGNoKHBhdHRlcm4pO1xuICAgICAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgY29uc3QganNvblN0ciA9IG1hdGNoWzFdO1xuICAgICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShqc29uU3RyKTtcbiAgICAgICAgICAgICAgICAgIGFuYWx5c2lzID0ge1xuICAgICAgICAgICAgICAgICAgICBrZXlQb2ludHM6IHBhcnNlZC5rZXlQb2ludHMgfHwgW10sXG4gICAgICAgICAgICAgICAgICAgIGFpQ29uY2VwdHM6IHBhcnNlZC5haUNvbmNlcHRzIHx8IFtdLFxuICAgICAgICAgICAgICAgICAgICB0ZWNobmljYWxEZXRhaWxzOiBwYXJzZWQudGVjaG5pY2FsRGV0YWlscyB8fCBbXSxcbiAgICAgICAgICAgICAgICAgICAgdmlzdWFsQ29udGV4dEZsYWdzOiBwYXJzZWQudmlzdWFsQ29udGV4dEZsYWdzIHx8IFtdLFxuICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5OiBwYXJzZWQuc3VtbWFyeSB8fCAnJyxcbiAgICAgICAgICAgICAgICAgICAgcXVhbGl0eVNjb3JlOiB0aGlzLmNhbGN1bGF0ZVF1YWxpdHlTY29yZShwYXJzZWQpLFxuICAgICAgICAgICAgICAgICAgICByYXdSZXNwb25zZTogcmF3VGV4dC5zdWJzdHJpbmcoMCwgMTAwMCksXG4gICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgLyogdHJ5IG5leHQgcGF0dGVybiAqL1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBKU09OIFBhcnNlIEZhbGxiYWNrOiBUcnkgdG8gZmluZCBzdWJzdHJpbmcgYmV0d2VlbiBmaXJzdCB7IGFuZCBsYXN0IH1cbiAgICAgICAgICAgIGlmICghYW5hbHlzaXMgJiYgcmF3VGV4dC5pbmNsdWRlcygneycpICYmIHJhd1RleHQuaW5jbHVkZXMoJ30nKSkge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gcmF3VGV4dC5pbmRleE9mKCd7Jyk7XG4gICAgICAgICAgICAgICAgY29uc3QgZW5kID0gcmF3VGV4dC5sYXN0SW5kZXhPZignfScpICsgMTtcbiAgICAgICAgICAgICAgICBjb25zdCBwb3RlbnRpYWxKc29uID0gcmF3VGV4dC5zdWJzdHJpbmcoc3RhcnQsIGVuZCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShwb3RlbnRpYWxKc29uKTtcbiAgICAgICAgICAgICAgICBhbmFseXNpcyA9IHtcbiAgICAgICAgICAgICAgICAgIGtleVBvaW50czogcGFyc2VkLmtleVBvaW50cyB8fCBbXSxcbiAgICAgICAgICAgICAgICAgIGFpQ29uY2VwdHM6IHBhcnNlZC5haUNvbmNlcHRzIHx8IFtdLFxuICAgICAgICAgICAgICAgICAgdGVjaG5pY2FsRGV0YWlsczogcGFyc2VkLnRlY2huaWNhbERldGFpbHMgfHwgW10sXG4gICAgICAgICAgICAgICAgICB2aXN1YWxDb250ZXh0RmxhZ3M6IHBhcnNlZC52aXN1YWxDb250ZXh0RmxhZ3MgfHwgW10sXG4gICAgICAgICAgICAgICAgICBzdW1tYXJ5OiBwYXJzZWQuc3VtbWFyeSB8fCAnJyxcbiAgICAgICAgICAgICAgICAgIHF1YWxpdHlTY29yZTogdGhpcy5jYWxjdWxhdGVRdWFsaXR5U2NvcmUocGFyc2VkKSxcbiAgICAgICAgICAgICAgICAgIHJhd1Jlc3BvbnNlOiByYXdUZXh0LnN1YnN0cmluZygwLCAxMDAwKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgLyogaWdub3JlICovXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVGV4dCBGYWxsYmFjazogQ3JlYXRlIHN0cnVjdHVyZWQgYW5hbHlzaXMgZnJvbSB0ZXh0IGlmIEpTT04gZmFpbHNcbiAgICAgICAgICAgIGlmICghYW5hbHlzaXMpIHtcbiAgICAgICAgICAgICAgYW5hbHlzaXMgPSB7XG4gICAgICAgICAgICAgICAga2V5UG9pbnRzOiB0aGlzLmV4dHJhY3RCdWxsZXRQb2ludHMocmF3VGV4dCksXG4gICAgICAgICAgICAgICAgYWlDb25jZXB0czogdGhpcy5leHRyYWN0QUlDb25jZXB0cyhyYXdUZXh0KSxcbiAgICAgICAgICAgICAgICB0ZWNobmljYWxEZXRhaWxzOiBbXSxcbiAgICAgICAgICAgICAgICB2aXN1YWxDb250ZXh0RmxhZ3M6IFtdLFxuICAgICAgICAgICAgICAgIHN1bW1hcnk6IHJhd1RleHQuc3Vic3RyaW5nKDAsIDMwMCkucmVwbGFjZSgvXFxuL2csICcgJyksXG4gICAgICAgICAgICAgICAgcXVhbGl0eVNjb3JlOiA1MCwgLy8gTWVkaXVtIHF1YWxpdHkgZm9yIGZhbGxiYWNrXG4gICAgICAgICAgICAgICAgcmF3UmVzcG9uc2U6IHJhd1RleHQuc3Vic3RyaW5nKDAsIDEwMDApLFxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW3YyXSDinIUgQW5hbHlzaXMgY29tcGxldGUgKHF1YWxpdHk6ICR7YW5hbHlzaXMucXVhbGl0eVNjb3JlfSUpYCk7XG4gICAgICAgICAgICByZXR1cm4gYW5hbHlzaXM7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgZm9yIGVycm9yc1xuICAgICAgICBjb25zdCBlcnJvclRleHQgPSBhd2FpdCBwYWdlLmV2YWx1YXRlKCgpID0+IHtcbiAgICAgICAgICBjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keS5pbm5lclRleHQ7XG4gICAgICAgICAgaWYgKGJvZHkuaW5jbHVkZXMoJ0ludGVybmFsIGVycm9yJykgfHwgYm9keS5pbmNsdWRlcygnU29tZXRoaW5nIHdlbnQgd3JvbmcnKSkge1xuICAgICAgICAgICAgcmV0dXJuICdlcnJvcic7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoZXJyb3JUZXh0KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBSSBTdHVkaW8gcmV0dXJuZWQgYW4gZXJyb3InKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZygnW3YyXSDimqDvuI8gQW5hbHlzaXMgdGltZW91dCcpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcignW3YyXSBBbmFseXNpcyBlcnJvcjonLCBlKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0gZmluYWxseSB7XG4gICAgICAvLyBHVUFSQU5URUVEIENMRUFOVVAgLSBBbHdheXMgY2xvc2UgcGFnZSwgZXZlbiBpZiBlcnJvcnMgb2NjdXJcbiAgICAgIGlmIChwYWdlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIPCfp7kgUGFnZSBjbGVhbmVkIHVwJyk7XG4gICAgICAgIH0gY2F0Y2ggKGNsZWFudXBFcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUud2FybignW3YyXSDimqDvuI8gRmFpbGVkIHRvIGNsb3NlIHBhZ2UgZHVyaW5nIGNsZWFudXA6JywgY2xlYW51cEVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlUXVhbGl0eVNjb3JlKHBhcnNlZDogYW55KTogbnVtYmVyIHtcbiAgICBsZXQgc2NvcmUgPSAwO1xuICAgIGlmIChwYXJzZWQuc3VtbWFyeSAmJiBwYXJzZWQuc3VtbWFyeS5sZW5ndGggPiA1MCkge1xuICAgICAgc2NvcmUgKz0gMjU7XG4gICAgfVxuICAgIGlmIChwYXJzZWQua2V5UG9pbnRzICYmIHBhcnNlZC5rZXlQb2ludHMubGVuZ3RoID49IDMpIHtcbiAgICAgIHNjb3JlICs9IDI1O1xuICAgIH1cbiAgICBpZiAocGFyc2VkLmFpQ29uY2VwdHMgJiYgcGFyc2VkLmFpQ29uY2VwdHMubGVuZ3RoID4gMCkge1xuICAgICAgc2NvcmUgKz0gMjU7XG4gICAgfVxuICAgIGlmIChwYXJzZWQudGVjaG5pY2FsRGV0YWlscyAmJiBwYXJzZWQudGVjaG5pY2FsRGV0YWlscy5sZW5ndGggPiAwKSB7XG4gICAgICBzY29yZSArPSAyNTtcbiAgICB9XG4gICAgcmV0dXJuIHNjb3JlO1xuICB9XG5cbiAgcHJpdmF0ZSBleHRyYWN0QnVsbGV0UG9pbnRzKHRleHQ6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBsaW5lcyA9IHRleHQuc3BsaXQoJ1xcbicpO1xuICAgIHJldHVybiBsaW5lc1xuICAgICAgLmZpbHRlcihcbiAgICAgICAgKGxpbmUpID0+XG4gICAgICAgICAgbGluZS50cmltKCkuc3RhcnRzV2l0aCgnLScpIHx8IGxpbmUudHJpbSgpLnN0YXJ0c1dpdGgoJ+KAoicpIHx8IGxpbmUudHJpbSgpLm1hdGNoKC9eXFxkK1xcLi8pXG4gICAgICApXG4gICAgICAubWFwKChsaW5lKSA9PiBsaW5lLnJlcGxhY2UoL15bLeKAolxcZC5dK1xccyovLCAnJykudHJpbSgpKVxuICAgICAgLmZpbHRlcigobGluZSkgPT4gbGluZS5sZW5ndGggPiAxMClcbiAgICAgIC5zbGljZSgwLCAxMCk7XG4gIH1cblxuICBwcml2YXRlIGV4dHJhY3RBSUNvbmNlcHRzKHRleHQ6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBhaVRlcm1zID0gW1xuICAgICAgJ21hY2hpbmUgbGVhcm5pbmcnLFxuICAgICAgJ25ldXJhbCBuZXR3b3JrJyxcbiAgICAgICdkZWVwIGxlYXJuaW5nJyxcbiAgICAgICd0cmFuc2Zvcm1lcicsXG4gICAgICAnR1BUJyxcbiAgICAgICdMTE0nLFxuICAgICAgJ2xhcmdlIGxhbmd1YWdlIG1vZGVsJyxcbiAgICAgICdBSSBhZ2VudCcsXG4gICAgICAnZW1iZWRkaW5nJyxcbiAgICAgICdmaW5lLXR1bmluZycsXG4gICAgICAnUkFHJyxcbiAgICAgICd2ZWN0b3IgZGF0YWJhc2UnLFxuICAgICAgJ3Byb21wdCBlbmdpbmVlcmluZycsXG4gICAgICAnZGlmZnVzaW9uJyxcbiAgICAgICdzdGFibGUgZGlmZnVzaW9uJyxcbiAgICAgICdEQUxMLUUnLFxuICAgICAgJ0NsYXVkZScsXG4gICAgICAnR2VtaW5pJyxcbiAgICAgICdPcGVuQUknLFxuICAgICAgJ0FudGhyb3BpYycsXG4gICAgICAnTGFuZ0NoYWluJyxcbiAgICAgICdBdXRvR1BUJyxcbiAgICAgICdpbmZlcmVuY2UnLFxuICAgICAgJ3RyYWluaW5nJyxcbiAgICAgICdtb2RlbCcsXG4gICAgXTtcblxuICAgIGNvbnN0IGZvdW5kOiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IGxvd2VyVGV4dCA9IHRleHQudG9Mb3dlckNhc2UoKTtcblxuICAgIGZvciAoY29uc3QgdGVybSBvZiBhaVRlcm1zKSB7XG4gICAgICBpZiAobG93ZXJUZXh0LmluY2x1ZGVzKHRlcm0udG9Mb3dlckNhc2UoKSkgJiYgIWZvdW5kLmluY2x1ZGVzKHRlcm0pKSB7XG4gICAgICAgIGZvdW5kLnB1c2godGVybSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZvdW5kO1xuICB9XG5cbiAgc2F2ZVJlcG9ydCh2aWRlbzogVmlkZW9FbnRyeSk6IHN0cmluZyB7XG4gICAgY29uc3Qgc2FmZVRpdGxlID0gdmlkZW8udGl0bGUucmVwbGFjZSgvW15hLXpBLVowLTldL2csICdfJykuc3Vic3RyaW5nKDAsIDUwKTtcbiAgICBjb25zdCByZXBvcnRGaWxlID0gcGF0aC5qb2luKFxuICAgICAgdGhpcy5yZXBvcnRzRGlyLFxuICAgICAgYHYyXyR7dmlkZW8uaW5kZXh9XyR7c2FmZVRpdGxlfV8ke0RhdGUubm93KCl9Lm1kYFxuICAgICk7XG5cbiAgICBsZXQgY29udGVudCA9IGAjIFZpZGVvIEFuYWx5c2lzIFJlcG9ydFxcblxcbiMjIE1ldGFkYXRhXFxuLSAqKlZpZGVvKio6ICR7dmlkZW8udGl0bGV9XFxuLSAqKkluZGV4Kio6ICMke3ZpZGVvLmluZGV4fVxcbi0gKipVUkwqKjogJHt2aWRlby51cmx9XFxuLSAqKkR1cmF0aW9uKio6ICR7dmlkZW8ubWV0YWRhdGE/LmR1cmF0aW9uRm9ybWF0dGVkIHx8ICdVbmtub3duJ31cXG4tICoqQ2hhbm5lbCoqOiAke3ZpZGVvLm1ldGFkYXRhPy5jaGFubmVsIHx8ICdVbmtub3duJ31cXG4tICoqVmlld3MqKjogJHt2aWRlby5tZXRhZGF0YT8udmlld0NvdW50IHx8ICdVbmtub3duJ31cXG4tICoqUHVibGlzaGVkKio6ICR7dmlkZW8ubWV0YWRhdGE/LnB1Ymxpc2hEYXRlIHx8ICdVbmtub3duJ31cXG4tICoqUHJvY2Vzc2VkKio6ICR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpfVxcbi0gKipRdWFsaXR5IFNjb3JlKio6ICR7dmlkZW8uYW5hbHlzaXM/LnF1YWxpdHlTY29yZSB8fCAwfSVcXG5cXG4tLS1cXG5cXG4jIyBTdW1tYXJ5XFxuJHt2aWRlby5hbmFseXNpcz8uc3VtbWFyeSB8fCB2aWRlby5tZXRhZGF0YT8uc3VtbWFyeSB8fCAnTm8gc3VtbWFyeSBhdmFpbGFibGUnfVxcblxcbiMjIEtleSBQb2ludHNcXG4keyh2aWRlby5hbmFseXNpcz8ua2V5UG9pbnRzIHx8IFtdKS5tYXAoKHApID0+IGAtICR7cH1gKS5qb2luKCdcXG4nKSB8fCAnLSBObyBrZXkgcG9pbnRzIGV4dHJhY3RlZCd9XFxuXFxuIyMgQUkgJiBUZWNobmljYWwgQ29uY2VwdHNcXG4keyh2aWRlby5hbmFseXNpcz8uYWlDb25jZXB0cyB8fCBbXSkubWFwKChjKSA9PiBgLSAke2N9YCkuam9pbignXFxuJykgfHwgJy0gTm9uZSBpZGVudGlmaWVkJ31cXG5cXG4jIyBUZWNobmljYWwgRGV0YWlsc1xcbiR7KHZpZGVvLmFuYWx5c2lzPy50ZWNobmljYWxEZXRhaWxzIHx8IFtdKS5tYXAoKGQpID0+IGAtICR7ZH1gKS5qb2luKCdcXG4nKSB8fCAnLSBOb25lIGlkZW50aWZpZWQnfVxcbmA7XG5cbiAgICBpZiAodmlkZW8uYW5hbHlzaXM/LnZpc3VhbENvbnRleHRGbGFncyAmJiB2aWRlby5hbmFseXNpcy52aXN1YWxDb250ZXh0RmxhZ3MubGVuZ3RoID4gMCkge1xuICAgICAgY29udGVudCArPSBgXFxuIyMg4pqg77iPIFNlY3Rpb25zIE5lZWRpbmcgVmlzdWFsIFJldmlld1xcbiR7dmlkZW8uYW5hbHlzaXMudmlzdWFsQ29udGV4dEZsYWdzXG4gICAgICAgIC5tYXAoKGYpID0+IGAtICoqJHt0aGlzLmZvcm1hdER1cmF0aW9uKGYudGltZXN0YW1wKX0qKjogJHtmLnJlYXNvbn0gLSAke2YuY29udGV4dH1gKVxuICAgICAgICAuam9pbignXFxuJyl9XFxuYDtcbiAgICB9XG5cbiAgICBmcy53cml0ZUZpbGVTeW5jKHJlcG9ydEZpbGUsIGNvbnRlbnQpO1xuXG4gICAgaWYgKHZpZGVvLnRyYW5zY3JpcHQgJiYgdmlkZW8udHJhbnNjcmlwdC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB0cmFuc2NyaXB0RmlsZSA9IHBhdGguam9pbih0aGlzLnRyYW5zY3JpcHRzRGlyLCBgJHt2aWRlby5pbmRleH1fJHtzYWZlVGl0bGV9LnR4dGApO1xuICAgICAgY29uc3QgdHJhbnNjcmlwdENvbnRlbnQgPSB2aWRlby50cmFuc2NyaXB0XG4gICAgICAgIC5tYXAoKHMpID0+IGBbJHt0aGlzLmZvcm1hdER1cmF0aW9uKHMuc3RhcnQpfV0gJHtzLnRleHR9YClcbiAgICAgICAgLmpvaW4oJ1xcbicpO1xuICAgICAgZnMud3JpdGVGaWxlU3luYyh0cmFuc2NyaXB0RmlsZSwgdHJhbnNjcmlwdENvbnRlbnQpO1xuICAgIH1cblxuICAgIHRoaXMuYXBwZW5kVG9Lbm93bGVkZ2VCYXNlKHZpZGVvKTtcblxuICAgIHJldHVybiByZXBvcnRGaWxlO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBlbmRUb0tub3dsZWRnZUJhc2UodmlkZW86IFZpZGVvRW50cnkpOiB2b2lkIHtcbiAgICBjb25zdCBlbnRyeUlkID0gYHZpZGVvLWFuYWx5c2lzLSR7dmlkZW8udmlkZW9JZH1gO1xuICAgIGNvbnN0IHNhZmVUaXRsZSA9IHZpZGVvLnRpdGxlLnJlcGxhY2UoL1teYS16QS1aMC05XS9nLCAnXycpLnN1YnN0cmluZygwLCA1MCk7XG5cbiAgICAvLyBTT0ZUV0FSRSAzLjA6IEdlbmVyYXRlIEZlZGVyYXRlZCBJRCMgdmlhIHRoZSBzaGFyZWQgaGVscGVyLlxuICAgIC8vIFRoZSBjYW5vbmljYWwgZW5jb2RlciBsaXZlcyBpblxuICAgIC8vIHBhY2thZ2VzL2EyYS1jb3JlL3NyYy9mZWRlcmF0ZWQtaWRlbnRpdHkuc2VydmljZS50cyAoRmVkZXJhdGVkSWRlbnRpdHlTZXJ2aWNlKTtcbiAgICAvLyB0aGlzIGxvY2FsIG1pcnJvciBrZWVwcyB0aGUgYWxwaGFiZXQgaW4gc3luYyBzbyB0cmFuc2NyaXB0IHN0b3ZlcGlwZXNcbiAgICAvLyBjYW4gcnVuIHdpdGhvdXQgcHVsbGluZyBpbiBAdGhlLW5ldy1mdXNlL2EyYS1jb3JlJ3MgTmVzdEpTIERJIHJ1bnRpbWUuXG4gICAgY29uc3QgaWROdW1iZXIgPSBnZW5lcmF0ZUZlZGVyYXRlZElkTnVtYmVyKHZpZGVvLmluZGV4KTtcblxuICAgIC8vIDEuIENyZWF0ZSBhIENvbXBvdW5kaW5nTG9nRW50cnkgc3RydWN0dXJlXG4gICAgY29uc3QgY29tcG91bmRpbmdFbnRyeSA9IHtcbiAgICAgIGlkOiBlbnRyeUlkLFxuICAgICAgdGl0bGU6IHZpZGVvLnRpdGxlLFxuICAgICAgY2F0ZWdvcnk6ICd2aWRlby1hbmFseXNpcycsXG4gICAgICBjb250ZW50OiB2aWRlby5hbmFseXNpcz8uc3VtbWFyeSB8fCAnTm8gc3VtbWFyeScsXG4gICAgICBiYWNrbGlua3M6IHZpZGVvLmFuYWx5c2lzPy5haUNvbmNlcHRzIHx8IFtdLFxuICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgYWdlbnRJZDogJ3RyYW5zY3JpcHQtcHJvY2Vzc29yLXYyJyxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIHZpZGVvSWQ6IHZpZGVvLnZpZGVvSWQsXG4gICAgICAgIHVybDogdmlkZW8udXJsLFxuICAgICAgICBxdWFsaXR5U2NvcmU6IHZpZGVvLmFuYWx5c2lzPy5xdWFsaXR5U2NvcmUgfHwgMCxcbiAgICAgICAgaWROdW1iZXI6IGlkTnVtYmVyLCAvLyBWZXJpZmllZCBGZWRlcmF0ZWQgSUQjXG4gICAgICAgIHJlc291cmNlUG9pbnRlcnM6IHtcbiAgICAgICAgICB0cmFuc2NyaXB0OiB7XG4gICAgICAgICAgICB1cmk6IGBmaWxlOi8vJHtwYXRoLmpvaW4odGhpcy50cmFuc2NyaXB0c0RpciwgYCR7dmlkZW8uaW5kZXh9XyR7c2FmZVRpdGxlfS50eHRgKX1gLFxuICAgICAgICAgICAgbWltZVR5cGU6ICd0ZXh0L3BsYWluJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlcG9ydDoge1xuICAgICAgICAgICAgdXJpOiBgZmlsZTovLyR7cGF0aC5qb2luKHRoaXMucmVwb3J0c0RpciwgYHYyXyR7dmlkZW8uaW5kZXh9XyR7c2FmZVRpdGxlfS5tZGApfWAsXG4gICAgICAgICAgICBtaW1lVHlwZTogJ3RleHQvbWFya2Rvd24nLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH07XG5cbiAgICAvLyAyLiBTYXZlIHRoZSBDb21wb3VuZGluZyBFbnRyeSBKU09OIGZvciB0aGUgV2lraSBDb21waWxlciAoVGhlIFJhdGNoZXQgTG9vcClcbiAgICBjb25zdCB3aWtpSW5ib3hEaXIgPSBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKHRoaXMuc3RhdGVGaWxlUGF0aCksICd3aWtpLWluYm94Jyk7XG4gICAgZnMubWtkaXJTeW5jKHdpa2lJbmJveERpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgZnMud3JpdGVGaWxlU3luYyhcbiAgICAgIHBhdGguam9pbih3aWtpSW5ib3hEaXIsIGAke2VudHJ5SWR9Lmpzb25gKSxcbiAgICAgIEpTT04uc3RyaW5naWZ5KGNvbXBvdW5kaW5nRW50cnksIG51bGwsIDIpXG4gICAgKTtcblxuICAgIC8vIDMuIEtlZXAgbGVnYWN5IGFwcGVuZCBmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eSBidXQgdGFnIGl0IGFzIGEgcG9pbnRlclxuICAgIGNvbnN0IGxlZ2FjeUVudHJ5ID0gYFxcbi0tLVxcblxcbiMjICMke3ZpZGVvLmluZGV4fTogJHt2aWRlby50aXRsZX1cXG4qKlVSTCoqOiAke3ZpZGVvLnVybH1cXG4qKlJlc291cmNlIFBvaW50ZXIqKjogdHJwOi8vd2lraS1pbmJveC8ke2VudHJ5SWR9Lmpzb25cXG5cXG4jIyMgU3VtbWFyeVxcbiR7dmlkZW8uYW5hbHlzaXM/LnN1bW1hcnkgfHwgJ05vIHN1bW1hcnknfVxcblxcbiMjIyBLZXkgSW5zaWdodHNcXG4ke1xuICAgICAgKHZpZGVvLmFuYWx5c2lzPy5rZXlQb2ludHMgfHwgW10pXG4gICAgICAgIC5zbGljZSgwLCA1KVxuICAgICAgICAubWFwKChwKSA9PiBgLSAke3B9YClcbiAgICAgICAgLmpvaW4oJ1xcbicpIHx8ICctIE5vbmUnXG4gICAgfVxcblxcbiMjIyBBSSBDb25jZXB0cyBDb3ZlcmVkXFxuJHsodmlkZW8uYW5hbHlzaXM/LmFpQ29uY2VwdHMgfHwgW10pLmpvaW4oJywgJykgfHwgJ05vbmUnfVxcblxcbmA7XG5cbiAgICBmcy5hcHBlbmRGaWxlU3luYyh0aGlzLmtub3dsZWRnZUJhc2VGaWxlLCBsZWdhY3lFbnRyeSk7XG4gICAgY29uc29sZS5sb2coYFt2Ml0g8J+mviBHZW5lcmF0ZWQgU292ZXJlaWduIEVudHJ5OiAke2VudHJ5SWR9Lmpzb24gKFBvaW50ZXItYmFzZWQpYCk7XG4gIH1cblxuICBhc3luYyBwcm9jZXNzVmlkZW8odmlkZW86IFZpZGVvRW50cnkpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAoXG4gICAgICB2aWRlby5zdGF0dXMgPT09ICdjb21wbGV0ZWQnIHx8XG4gICAgICB2aWRlby5zdGF0dXMgPT09ICdza2lwcGVkJyB8fFxuICAgICAgdmlkZW8uc3RhdHVzID09PSAnbmVlZHNfdmlzdWFsJ1xuICAgICkge1xuICAgICAgY29uc29sZS5sb2coYFt2Ml0g4o+t77iPIFNraXBwaW5nICMke3ZpZGVvLmluZGV4fSAoJHt2aWRlby5zdGF0dXN9KWApO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHZpZGVvLnByb2Nlc3NpbmdBdHRlbXB0cyA+PSAzKSB7XG4gICAgICBjb25zb2xlLmxvZyhgW3YyXSDij63vuI8gU2tpcHBpbmcgIyR7dmlkZW8uaW5kZXh9IChtYXggYXR0ZW1wdHMgcmVhY2hlZClgKTtcbiAgICAgIHZpZGVvLnN0YXR1cyA9ICdza2lwcGVkJztcbiAgICAgIHRoaXMuc3RhdGUuc3RhdHMuc2tpcHBlZCsrO1xuICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBIRUFMVEggQ0hFQ0sgLSBFbnN1cmUgYnJvd3NlciBpcyBhbGl2ZSBiZWZvcmUgcHJvY2Vzc2luZ1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlQnJvd3NlckhlYWx0aCgpO1xuXG4gICAgY29uc29sZS5sb2coYFxcbiR7J+KVkCcucmVwZWF0KDcwKX1gKTtcbiAgICBjb25zb2xlLmxvZyhgVmlkZW8gIyR7dmlkZW8uaW5kZXh9OiAke3ZpZGVvLnRpdGxlfWApO1xuICAgIGNvbnNvbGUubG9nKGBBdHRlbXB0OiAke3ZpZGVvLnByb2Nlc3NpbmdBdHRlbXB0cyArIDF9LzNgKTtcbiAgICBjb25zb2xlLmxvZyhgJHsn4pWQJy5yZXBlYXQoNzApfVxcbmApO1xuXG4gICAgdmlkZW8ucHJvY2Vzc2luZ0F0dGVtcHRzKys7XG4gICAgdmlkZW8ubGFzdFByb2Nlc3NlZCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGlmICghdmlkZW8ubWV0YWRhdGEpIHtcbiAgICAgICAgdmlkZW8uc3RhdHVzID0gJ21ldGFkYXRhJztcbiAgICAgICAgdmlkZW8ubWV0YWRhdGEgPSAoYXdhaXQgdGhpcy5mZXRjaEVucmljaGVkTWV0YWRhdGEodmlkZW8pKSB8fCB1bmRlZmluZWQ7XG4gICAgICAgIGlmICh2aWRlby5tZXRhZGF0YSkge1xuICAgICAgICAgIHRoaXMuc3RhdGUuc3RhdHMubWV0YWRhdGFDb21wbGV0ZSsrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy50YXJnZXRQaGFzZSA9PT0gJ21ldGFkYXRhJykgcmV0dXJuIHRydWU7XG5cbiAgICAgIGlmICghdmlkZW8udHJhbnNjcmlwdCkge1xuICAgICAgICB2aWRlby5zdGF0dXMgPSAndHJhbnNjcmlwdCc7XG4gICAgICAgIHZpZGVvLnRyYW5zY3JpcHQgPSAoYXdhaXQgdGhpcy5leHRyYWN0VHJhbnNjcmlwdERpcmVjdCh2aWRlbykpIHx8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHZpZGVvLnRyYW5zY3JpcHQpIHtcbiAgICAgICAgICB0aGlzLnN0YXRlLnN0YXRzLnRyYW5zY3JpcHRzRXh0cmFjdGVkKys7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnRhcmdldFBoYXNlID09PSAndHJhbnNjcmlwdCcpIHJldHVybiB0cnVlO1xuXG4gICAgICBpZiAodmlkZW8udHJhbnNjcmlwdCAmJiAhdmlkZW8uYW5hbHlzaXMpIHtcbiAgICAgICAgdmlkZW8uc3RhdHVzID0gJ2FuYWx5emVkJztcbiAgICAgICAgdmlkZW8uYW5hbHlzaXMgPSAoYXdhaXQgdGhpcy5hbmFseXplV2l0aEFJKHZpZGVvKSkgfHwgdW5kZWZpbmVkO1xuICAgICAgICBpZiAodmlkZW8uYW5hbHlzaXMpIHtcbiAgICAgICAgICB0aGlzLnN0YXRlLnN0YXRzLmFuYWx5emVkKys7XG4gICAgICAgICAgaWYgKHZpZGVvLmFuYWx5c2lzLnZpc3VhbENvbnRleHRGbGFncy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLnN0YXRzLm5lZWRzVmlzdWFsUmV2aWV3Kys7XG4gICAgICAgICAgICB2aWRlby5zdGF0dXMgPSAnbmVlZHNfdmlzdWFsJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHZpZGVvLmFuYWx5c2lzKSB7XG4gICAgICAgIGNvbnN0IHJlcG9ydFBhdGggPSB0aGlzLnNhdmVSZXBvcnQodmlkZW8pO1xuICAgICAgICBjb25zb2xlLmxvZyhgW3YyXSDinIUgUmVwb3J0OiAke3BhdGguYmFzZW5hbWUocmVwb3J0UGF0aCl9YCk7XG4gICAgICAgIHZpZGVvLnN0YXR1cyA9ICdjb21wbGV0ZWQnO1xuICAgICAgICB0aGlzLnN0YXRlLnN0YXRzLmNvbXBsZXRlZCsrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmlkZW8uc3RhdHVzID0gJ2Vycm9yJztcbiAgICAgICAgdmlkZW8uZXJyb3IgPSAnQW5hbHlzaXMgZmFpbGVkJztcbiAgICAgICAgdGhpcy5zdGF0ZS5zdGF0cy5lcnJvcnMrKztcbiAgICAgIH1cblxuICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgIHRoaXMucHJpbnRQcm9ncmVzcygpO1xuICAgICAgcmV0dXJuIHZpZGVvLnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCc7XG4gICAgfSBjYXRjaCAoZTogdW5rbm93bikge1xuICAgICAgY29uc29sZS5lcnJvcihgW3YyXSBFcnJvciBwcm9jZXNzaW5nICMke3ZpZGVvLmluZGV4fTpgLCBlKTtcbiAgICAgIHZpZGVvLmVycm9yID0gKGUgYXMgRXJyb3IpLm1lc3NhZ2U7XG4gICAgICB2aWRlby5zdGF0dXMgPSAnZXJyb3InO1xuICAgICAgdGhpcy5zdGF0ZS5zdGF0cy5lcnJvcnMrKztcbiAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwcmludFByb2dyZXNzKCk6IHZvaWQge1xuICAgIGNvbnN0IHMgPSB0aGlzLnN0YXRlLnN0YXRzO1xuICAgIGNvbnNvbGUubG9nKGBcXG7wn5OKIFByb2dyZXNzOiAke3MuY29tcGxldGVkfS8ke3MudG90YWxWaWRlb3N9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIENvbXBsZXRlZDogJHtzLmNvbXBsZXRlZH0gfCBBbmFseXplZDogJHtzLmFuYWx5emVkfSB8IEVycm9yczogJHtzLmVycm9yc31gKTtcbiAgICBjb25zb2xlLmxvZyhgICAgU3VjY2VzcyBSYXRlOiAke3MuYW5hbHlzaXNTdWNjZXNzUmF0ZS50b0ZpeGVkKDEpfSVcXG5gKTtcbiAgfVxuXG4gIGFzeW5jIHJ1bihsaWJyYXJ5UGF0aDogc3RyaW5nLCBzdGFydEluZGV4OiBudW1iZXIgPSA2MzMsIGVuZEluZGV4OiBudW1iZXIgPSAxKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coYPCfmoAgVHJhbnNjcmlwdCBQcm9jZXNzb3IgdjIgLSBPcHRpbWl6ZWQgRWRpdGlvbmApO1xuICAgIGNvbnNvbGUubG9nKGBMaWJyYXJ5OiAke2xpYnJhcnlQYXRofWApO1xuICAgIGNvbnNvbGUubG9nKGBSYW5nZTogIyR7c3RhcnRJbmRleH0g4oaSICMke2VuZEluZGV4fWApO1xuICAgIGNvbnNvbGUubG9nKGBNb2RlbDogJHtHRU1JTklfTU9ERUx9YCk7XG5cbiAgICBhd2FpdCB0aGlzLmluaXRpYWxpemUoKTtcblxuICAgIC8vIExvYWQgbGlicmFyeVxuICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMobGlicmFyeVBhdGgsICd1dGYtOCcpO1xuICAgIGNvbnN0IHZpZGVvczogVmlkZW9FbnRyeVtdID0gW107XG4gICAgY29uc3Qgcm93UmVnZXggPVxuICAgICAgLzx0cj5cXHMqPHRkW14+XSo+XFxzKihcXGQrKVxccyo8XFwvdGQ+XFxzKjx0ZFtePl0qPlxccyo8YVxccytocmVmPVwiKFteXCJdKylcIltePl0qPihbXjxdKyk8XFwvYT5cXHMqPFxcL3RkPi9nO1xuICAgIGxldCBtYXRjaDtcblxuICAgIHdoaWxlICgobWF0Y2ggPSByb3dSZWdleC5leGVjKGNvbnRlbnQpKSAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgaW5kZXggPSBwYXJzZUludChtYXRjaFsxXSk7XG4gICAgICBpZiAoaW5kZXggPD0gc3RhcnRJbmRleCAmJiBpbmRleCA+PSBlbmRJbmRleCkge1xuICAgICAgICAvLyBDaGVjayBpZiBhbHJlYWR5IGluIHF1ZXVlXG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5zdGF0ZS5xdWV1ZS5maW5kKCh2KSA9PiB2LmluZGV4ID09PSBpbmRleCk7XG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgIHZpZGVvcy5wdXNoKGV4aXN0aW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2aWRlb3MucHVzaCh7XG4gICAgICAgICAgICBpbmRleCxcbiAgICAgICAgICAgIHVybDogbWF0Y2hbMl0sXG4gICAgICAgICAgICB0aXRsZTogbWF0Y2hbM10udHJpbSgpLFxuICAgICAgICAgICAgdmlkZW9JZDogdGhpcy5leHRyYWN0VmlkZW9JZChtYXRjaFsyXSkgfHwgJycsXG4gICAgICAgICAgICBzdGF0dXM6ICdwZW5kaW5nJyxcbiAgICAgICAgICAgIHByb2Nlc3NpbmdBdHRlbXB0czogMCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFNvcnQgZGVzY2VuZGluZ1xuICAgIHZpZGVvcy5zb3J0KChhLCBiKSA9PiBiLmluZGV4IC0gYS5pbmRleCk7XG5cbiAgICAvLyBVcGRhdGUgc3RhdGUgcXVldWUgcmVzcGVjdGluZyBleGlzdGluZyBlbnRyaWVzXG4gICAgdGhpcy5zdGF0ZS5xdWV1ZSA9IHZpZGVvcztcbiAgICB0aGlzLnN0YXRlLnN0YXRzLnRvdGFsVmlkZW9zID0gdmlkZW9zLmxlbmd0aDtcbiAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuXG4gICAgY29uc29sZS5sb2coYFt2Ml0gUHJvY2Vzc2luZyAke3ZpZGVvcy5sZW5ndGh9IHZpZGVvcy4uLmApO1xuXG4gICAgZm9yIChjb25zdCB2aWRlbyBvZiB2aWRlb3MpIHtcbiAgICAgIHRoaXMuc3RhdGUuY3VycmVudEluZGV4ID0gdmlkZW8uaW5kZXg7XG4gICAgICBhd2FpdCB0aGlzLnByb2Nlc3NWaWRlbyh2aWRlbyk7XG4gICAgICAvLyBTbWFsbCBjb29sZG93blxuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHIpID0+IHNldFRpbWVvdXQociwgMjAwMCkpO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCdbdjJdIPCfjokgQWxsIGRvbmUhJyk7XG4gICAgaWYgKHRoaXMuY29udGV4dCkge1xuICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmNsb3NlKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVuaXZlcnNhbCBGYWxsYmFjazogRG93bmxvYWQgdHJhbnNjcmlwdCB1c2luZyB5dC1kbHBcbiAgICovXG4gIHByaXZhdGUgZG93bmxvYWRUcmFuc2NyaXB0V2l0aFl0RGxwKHVybDogc3RyaW5nLCB2aWRlb0lkOiBzdHJpbmcpOiBUcmFuc2NyaXB0U2VnbWVudFtdIHwgbnVsbCB7XG4gICAgY29uc3QgdGVtcERpciA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUodGhpcy5yZXBvcnRzRGlyKSwgJ3RlbXBfc3VicycpO1xuXG4gICAgLy8gRW5zdXJlIHRlbXAgZGlyIGV4aXN0c1xuICAgIGlmICghZnMuZXhpc3RzU3luYyh0ZW1wRGlyKSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgZnMubWtkaXJTeW5jKHRlbXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgfSBjYXRjaCAoZSkge31cbiAgICB9XG5cbiAgICBjb25zdCBvdXRwdXRGaWxlQmFzZSA9IHBhdGguam9pbih0ZW1wRGlyLCB2aWRlb0lkKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zb2xlLmxvZyhgW3YyXSBSdW5uaW5nIHl0LWRscCBmb3IgJHt2aWRlb0lkfS4uLmApO1xuXG4gICAgICAvLyBDbGVhbiB1cCBwcmV2aW91cyBwb3RlbnRpYWwgZmlsZXNcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gZnMucmVhZGRpclN5bmModGVtcERpcikuZmlsdGVyKChmKSA9PiBmLnN0YXJ0c1dpdGgodmlkZW9JZCkpO1xuICAgICAgICBleGlzdGluZy5mb3JFYWNoKChmKSA9PiBmcy51bmxpbmtTeW5jKHBhdGguam9pbih0ZW1wRGlyLCBmKSkpO1xuICAgICAgfSBjYXRjaCAoZSkge31cblxuICAgICAgLy8gQ29tbWFuZCB0byBnZXQgVlRUXG4gICAgICBjb25zdCBjb21tYW5kID0gYHl0LWRscCAtLXdyaXRlLWF1dG8tc3ViIC0td3JpdGUtc3ViIC0tc3ViLWxhbmcgZW4gLS1za2lwLWRvd25sb2FkIC0tb3V0cHV0IFwiJHtvdXRwdXRGaWxlQmFzZX1cIiBcIiR7dXJsfVwiYDtcbiAgICAgIGV4ZWNTeW5jKGNvbW1hbmQsIHsgc3RkaW86ICdpZ25vcmUnIH0pO1xuXG4gICAgICAvLyBGaW5kIHRoZSBnZW5lcmF0ZWQgZmlsZSAoLmVuLnZ0dCBvciBzaW1pbGFyKVxuICAgICAgY29uc3QgZmlsZXMgPSBmcy5yZWFkZGlyU3luYyh0ZW1wRGlyKTtcbiAgICAgIGNvbnN0IHN1YkZpbGUgPSBmaWxlcy5maW5kKChmKSA9PiBmLnN0YXJ0c1dpdGgodmlkZW9JZCkgJiYgZi5lbmRzV2l0aCgnLnZ0dCcpKTtcblxuICAgICAgaWYgKCFzdWJGaWxlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIE5vIC52dHQgZmlsZSBjcmVhdGVkIGJ5IHl0LWRscCcpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgLy8gUGFyc2UgVlRUXG4gICAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbih0ZW1wRGlyLCBzdWJGaWxlKSwgJ3V0Zi04Jyk7XG4gICAgICBjb25zdCBzZWdtZW50czogVHJhbnNjcmlwdFNlZ21lbnRbXSA9IFtdO1xuICAgICAgY29uc3QgYmxvY2tzID0gY29udGVudC5zcGxpdCgvXFxuXFxyP1xcbi8pO1xuXG4gICAgICBmb3IgKGNvbnN0IGJsb2NrIG9mIGJsb2Nrcykge1xuICAgICAgICBjb25zdCB0aW1lTWF0Y2ggPSBibG9jay5tYXRjaChcbiAgICAgICAgICAvKFxcZHsyfSk6KFxcZHsyfSk6KFxcZHsyfSlcXC4oXFxkezN9KVxccy0tPlxccyhcXGR7Mn0pOihcXGR7Mn0pOihcXGR7Mn0pXFwuKFxcZHszfSkvXG4gICAgICAgICk7XG4gICAgICAgIGlmICh0aW1lTWF0Y2gpIHtcbiAgICAgICAgICBjb25zdCBsaW5lcyA9IGJsb2NrLnNwbGl0KCdcXG4nKTtcbiAgICAgICAgICBjb25zdCB0aW1lTGluZUluZGV4ID0gbGluZXMuZmluZEluZGV4KChsKSA9PiBsLmluY2x1ZGVzKCctLT4nKSk7XG4gICAgICAgICAgaWYgKHRpbWVMaW5lSW5kZXggIT09IC0xICYmIHRpbWVMaW5lSW5kZXggPCBsaW5lcy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICBsZXQgdGV4dCA9IGxpbmVzXG4gICAgICAgICAgICAgIC5zbGljZSh0aW1lTGluZUluZGV4ICsgMSlcbiAgICAgICAgICAgICAgLmpvaW4oJyAnKVxuICAgICAgICAgICAgICAucmVwbGFjZSgvPFtePl0qPi9nLCAnJylcbiAgICAgICAgICAgICAgLnRyaW0oKTtcbiAgICAgICAgICAgIGlmICh0ZXh0ICYmIHRleHQgIT09ICdhbGlnbjpzdGFydCBwb3NpdGlvbjowJScpIHtcbiAgICAgICAgICAgICAgdGV4dCA9IHRleHRcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvJmFtcDsvZywgJyYnKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8mcXVvdDsvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvJiMzOTsvZywgXCInXCIpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoLyZsdDsvZywgJzwnKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8mZ3Q7L2csICc+Jyk7XG5cbiAgICAgICAgICAgICAgY29uc3Qgc3RhcnRTZWMgPVxuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFsxXSkgKiAzNjAwICtcbiAgICAgICAgICAgICAgICBwYXJzZUludCh0aW1lTWF0Y2hbMl0pICogNjAgK1xuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFszXSkgK1xuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFs0XSkgLyAxMDAwO1xuXG4gICAgICAgICAgICAgIGNvbnN0IGVuZFNlYyA9XG4gICAgICAgICAgICAgICAgcGFyc2VJbnQodGltZU1hdGNoWzVdKSAqIDM2MDAgK1xuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFs2XSkgKiA2MCArXG4gICAgICAgICAgICAgICAgcGFyc2VJbnQodGltZU1hdGNoWzddKSArXG4gICAgICAgICAgICAgICAgcGFyc2VJbnQodGltZU1hdGNoWzhdKSAvIDEwMDA7XG5cbiAgICAgICAgICAgICAgc2VnbWVudHMucHVzaCh7XG4gICAgICAgICAgICAgICAgc3RhcnQ6IHN0YXJ0U2VjLFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiBlbmRTZWMgLSBzdGFydFNlYyxcbiAgICAgICAgICAgICAgICB0ZXh0OiB0ZXh0LFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQ2xlYW51cFxuICAgICAgdHJ5IHtcbiAgICAgICAgZnMudW5saW5rU3luYyhwYXRoLmpvaW4odGVtcERpciwgc3ViRmlsZSkpO1xuICAgICAgfSBjYXRjaCAoZSkge31cblxuICAgICAgaWYgKHNlZ21lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIHNlZ21lbnRzO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1t2Ml0geXQtZGxwIGV4ZWN1dGlvbiBlcnJvcjonLCBlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBtYWluKCkge1xuICBjb25zdCBhcmdzID0gcHJvY2Vzcy5hcmd2LnNsaWNlKDIpO1xuICBjb25zdCBzdGFydEFyZyA9IGFyZ3MuZmluZCgoYSkgPT4gYS5zdGFydHNXaXRoKCctLXN0YXJ0PScpKTtcbiAgY29uc3QgZW5kQXJnID0gYXJncy5maW5kKChhKSA9PiBhLnN0YXJ0c1dpdGgoJy0tZW5kPScpKTtcbiAgY29uc3QgcGhhc2VBcmcgPSBhcmdzLmZpbmQoKGEpID0+IGEuc3RhcnRzV2l0aCgnLS1waGFzZT0nKSk7XG5cbiAgY29uc3Qgc3RhcnQgPSBzdGFydEFyZyA/IHBhcnNlSW50KHN0YXJ0QXJnLnNwbGl0KCc9JylbMV0pIDogNjMzO1xuICBjb25zdCBlbmQgPSBlbmRBcmcgPyBwYXJzZUludChlbmRBcmcuc3BsaXQoJz0nKVsxXSkgOiAxO1xuICBjb25zdCBwaGFzZSA9IChwaGFzZUFyZyA/IHBoYXNlQXJnLnNwbGl0KCc9JylbMV0gOiAnYW5hbHlzaXMnKSBhc1xuICAgIHwgJ21ldGFkYXRhJ1xuICAgIHwgJ3RyYW5zY3JpcHQnXG4gICAgfCAnYW5hbHlzaXMnO1xuXG4gIGNvbnN0IGxpYnJhcnlQYXRoID1cbiAgICAnL1VzZXJzLzxvd25lcj4vRGVza3RvcC9BMS1JbnRlci1MTE0tQ29tL215LWFpLWtub3dsZWRnZS1iYXNlL3ZpZGVvLWxpYnJhcnkvYWlfdmlkZW9fbGlicmFyeS5odG1sJztcblxuICBjb25zdCBwcm9jZXNzb3IgPSBuZXcgVHJhbnNjcmlwdFByb2Nlc3NvclYyKHBoYXNlKTtcbiAgLy8gUHJvY2VzcyB0aGUga25vd24gYmFja2xvZyAoaW5kaWNlcyB3aGVyZSB0cmFuc2NyaXB0cyBhbHJlYWR5IGV4aXN0KVxuICBhd2FpdCBwcm9jZXNzb3IucnVuKGxpYnJhcnlQYXRoLCA2NDcsIDQwNSk7XG59XG5cbm1haW4oKS5jYXRjaChjb25zb2xlLmVycm9yKTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFNoYXJlZCBGZWRlcmF0ZWQgSUQjIGhlbHBlciAoUGhhc2UgOSwgYXVkaXQgMjAyNi0wNi0xNCkuXG4vL1xuLy8gQ2Fub25pY2FsIGVuY29kZXI6IHBhY2thZ2VzL2EyYS1jb3JlL3NyYy9mZWRlcmF0ZWQtaWRlbnRpdHkuc2VydmljZS50c1xuLy8gICAoRmVkZXJhdGVkSWRlbnRpdHlTZXJ2aWNlKS4gVGhpcyBjb3B5IGlzIGtlcHQgdmVyYmF0aW0gc28gdHJhbnNjcmlwdFxuLy8gICBzdG92ZXBpcGVzIGNhbiBwcm9kdWNlIGBJRCM6PEJhc2U1OD5gIHZhbHVlcyB3aXRob3V0IHB1bGxpbmcgaW5cbi8vICAgQHRoZS1uZXctZnVzZS9hMmEtY29yZSdzIE5lc3RKUyBESSBydW50aW1lLiBJZiB0aGUgYWxwaGFiZXQgZXZlciBjaGFuZ2VzLFxuLy8gICB1cGRhdGUgQk9USCBjb3BpZXMuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5leHBvcnQgY29uc3QgRkVERVJBVEVEX0JBU0U1OF9BTFBIQUJFVCA9XG4gICcxMjM0NTY3ODlBQkNERUZHSEpLTE1OUFFSU1RVVldYWVphYmNkZWZnaGlqa21ub3BxcnN0dXZ3eHl6JztcblxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlRmVkZXJhdGVkSWROdW1iZXIoc2VxOiBudW1iZXIpOiBzdHJpbmcge1xuICBpZiAoIU51bWJlci5pc0Zpbml0ZShzZXEpIHx8IHNlcSA8PSAwKSByZXR1cm4gYElEIzoke0ZFREVSQVRFRF9CQVNFNThfQUxQSEFCRVRbMF19YDtcbiAgbGV0IHJlbWFpbmluZyA9IE1hdGgudHJ1bmMoc2VxKTtcbiAgbGV0IGVuY29kZWQgPSAnJztcbiAgd2hpbGUgKHJlbWFpbmluZyA+IDApIHtcbiAgICBlbmNvZGVkID0gRkVERVJBVEVEX0JBU0U1OF9BTFBIQUJFVFtyZW1haW5pbmcgJSA1OF0gKyBlbmNvZGVkO1xuICAgIHJlbWFpbmluZyA9IE1hdGguZmxvb3IocmVtYWluaW5nIC8gNTgpO1xuICB9XG4gIHJldHVybiBgSUQjOiR7ZW5jb2RlZH1gO1xufVxuIl19