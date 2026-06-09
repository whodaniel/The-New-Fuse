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
        // SOFTWARE 3.0: Generate Federated ID# (Base58 encoded sequence)
        const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        let num = video.index;
        let idCode = '';
        while (num > 0) {
            idCode = alphabet[num % 58] + idCode;
            num = Math.floor(num / 58);
        }
        const idNumber = `ID#:${idCode || alphabet[0]}`;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHJhbnNjcmlwdFByb2Nlc3NvclYyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiVHJhbnNjcmlwdFByb2Nlc3NvclYyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7Ozs7O0dBWUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsaURBQXlDO0FBQ3pDLHVDQUF5QjtBQUN6QiwyQ0FBNkI7QUFFN0IsMkNBQXNFO0FBb0Z0RSw2Q0FBNkM7QUFDN0MsTUFBTSxZQUFZLEdBQUcsd0JBQXdCLENBQUM7QUFDOUMsTUFBTSxhQUFhLEdBQUcsMERBQTBELFlBQVksRUFBRSxDQUFDO0FBRS9GLE1BQU0sZUFBZSxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7O0NBZ0J2QixDQUFDO0FBRUYsTUFBTSxxQkFBcUI7SUFTekIsWUFBWSxjQUFzRCxVQUFVO1FBUnBFLFlBQU8sR0FBMEIsSUFBSSxDQUFDO1FBTXRDLGdCQUFXLEdBQTJDLFVBQVUsQ0FBQztRQUd2RSxJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztRQUMvQixvRUFBb0U7UUFDcEUsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDdkQsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFFMUQsZ0ZBQWdGO1FBQ2hGLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDO1FBRTFFLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztRQUNwRSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FB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QyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FHL0MsQ0FBQztJQUVmLE1BQU0sV0FBVyxHQUNmLGtHQUFrRyxDQUFDO0lBRXJHLE1BQU0sU0FBUyxHQUFHLElBQUkscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbkQsc0VBQXNFO0lBQ3RFLE1BQU0sU0FBUyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQzdDLENBQUM7QUFFRCxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBUcmFuc2NyaXB0IFByb2Nlc3NvciB2MiAtIE9wdGltaXplZCBFZGl0aW9uXG4gKlxuICogSW1wcm92ZW1lbnRzIG92ZXIgdjE6XG4gKiAxLiBVc2VzIGxhdGVzdCBHZW1pbmkgMyBGbGFzaCBtb2RlbCAoZ2VtaW5pLTMtZmxhc2gtcHJldmlldylcbiAqIDIuIEZyZXNoIGJyb3dzZXIgcGFnZSBmb3IgRUFDSCBvcGVyYXRpb25cbiAqIDMuIEJldHRlciBKU09OIGV4dHJhY3Rpb24gZnJvbSBBSSByZXNwb25zZXNcbiAqIDQuIE1heGltaXplZCBHb29nbGUgU2VhcmNoIEFJIG1vZGUgcXVlcmllc1xuICogNS4gRGlyZWN0IHRyYW5zY3JpcHQgZXh0cmFjdGlvbiB2aWEgQVBJIChubyBZb3VUdWJlIHBhZ2UgdmlzaXQgd2hlbiBwb3NzaWJsZSlcbiAqIDYuIENlbnRyYWxpemVkIGtub3dsZWRnZSBiYXNlIGNvbnNvbGlkYXRpb25cbiAqIDcuIFByb3BlciBzdGF0dXMgdHJhY2tpbmcgdG8gcHJldmVudCBsb29wc1xuICogOC4gU3VjY2VzcyBtZXRyaWNzIGFuZCBxdWFsaXR5IGV2YWx1YXRpb25cbiAqL1xuXG5pbXBvcnQgeyBleGVjU3luYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuaW1wb3J0IHsgY2hyb21pdW0sIHR5cGUgQnJvd3NlckNvbnRleHQsIHR5cGUgUGFnZSB9IGZyb20gJ3BsYXl3cmlnaHQnO1xuXG4vLyBUTkYgU292ZXJlaWduIFN0YXRlIEltcG9ydHNcbi8vIE5vdGU6IEluIHByb2R1Y3Rpb24sIHRoZXNlIHdvdWxkIGJlIHByb3BlciBpbXBvcnRzLCBmb3IgdGhpcyBzY3JpcHQgd2Ugc2ltdWxhdGUgdGhlIGRlcGVuZGVuY3kgaW5qZWN0aW9uXG4vLyBpbXBvcnQgeyBGZWRlcmF0ZWRJZGVudGl0eVNlcnZpY2UgfSBmcm9tICdAdGhlLW5ldy1mdXNlL2EyYS1jb3JlJztcblxuaW50ZXJmYWNlIFZpZGVvRW50cnkge1xuICBpbmRleDogbnVtYmVyO1xuICB1cmw6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgdmlkZW9JZDogc3RyaW5nO1xuICBtZXRhZGF0YT86IFZpZGVvTWV0YWRhdGE7XG4gIHRyYW5zY3JpcHQ/OiBUcmFuc2NyaXB0U2VnbWVudFtdO1xuICBhbmFseXNpcz86IEFuYWx5c2lzUmVzdWx0O1xuICBzdGF0dXM6XG4gICAgfCAncGVuZGluZydcbiAgICB8ICdtZXRhZGF0YSdcbiAgICB8ICd0cmFuc2NyaXB0J1xuICAgIHwgJ2FuYWx5emVkJ1xuICAgIHwgJ25lZWRzX3Zpc3VhbCdcbiAgICB8ICdjb21wbGV0ZWQnXG4gICAgfCAnc2tpcHBlZCdcbiAgICB8ICdlcnJvcic7XG4gIHByb2Nlc3NpbmdBdHRlbXB0czogbnVtYmVyO1xuICBsYXN0UHJvY2Vzc2VkPzogc3RyaW5nO1xuICBlcnJvcj86IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFZpZGVvTWV0YWRhdGEge1xuICBkdXJhdGlvbjogbnVtYmVyO1xuICBkdXJhdGlvbkZvcm1hdHRlZDogc3RyaW5nO1xuICBkZXNjcmlwdGlvbj86IHN0cmluZztcbiAgY2hhbm5lbD86IHN0cmluZztcbiAgcHVibGlzaERhdGU/OiBzdHJpbmc7XG4gIHZpZXdDb3VudD86IHN0cmluZztcbiAgY2F0ZWdvcnk/OiBzdHJpbmc7XG4gIHRhZ3M/OiBzdHJpbmdbXTtcbiAgc3VtbWFyeT86IHN0cmluZzsgLy8gQUktZ2VuZXJhdGVkIHN1bW1hcnkgZnJvbSBHb29nbGVcbn1cblxuaW50ZXJmYWNlIFRyYW5zY3JpcHRTZWdtZW50IHtcbiAgc3RhcnQ6IG51bWJlcjtcbiAgZHVyYXRpb246IG51bWJlcjtcbiAgdGV4dDogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgQW5hbHlzaXNSZXN1bHQge1xuICBrZXlQb2ludHM6IHN0cmluZ1tdO1xuICBhaUNvbmNlcHRzOiBzdHJpbmdbXTtcbiAgdGVjaG5pY2FsRGV0YWlsczogc3RyaW5nW107XG4gIHZpc3VhbENvbnRleHRGbGFnczogVmlzdWFsQ29udGV4dEZsYWdbXTtcbiAgc3VtbWFyeTogc3RyaW5nO1xuICBxdWFsaXR5U2NvcmU/OiBudW1iZXI7XG4gIHJhd1Jlc3BvbnNlPzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgVmlzdWFsQ29udGV4dEZsYWcge1xuICB0aW1lc3RhbXA6IG51bWJlcjtcbiAgcmVhc29uOiBzdHJpbmc7XG4gIGNvbnRleHQ6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFByb2Nlc3NpbmdTdGF0ZSB7XG4gIHZlcnNpb246IHN0cmluZztcbiAgcXVldWU6IFZpZGVvRW50cnlbXTtcbiAgY3VycmVudEluZGV4OiBudW1iZXI7XG4gIHN0YXJ0ZWRBdDogc3RyaW5nO1xuICBsYXN0VXBkYXRlZDogc3RyaW5nO1xuICBzdGF0czogUHJvY2Vzc2luZ1N0YXRzO1xufVxuXG5pbnRlcmZhY2UgUHJvY2Vzc2luZ1N0YXRzIHtcbiAgdG90YWxWaWRlb3M6IG51bWJlcjtcbiAgbWV0YWRhdGFDb21wbGV0ZTogbnVtYmVyO1xuICB0cmFuc2NyaXB0c0V4dHJhY3RlZDogbnVtYmVyO1xuICBhbmFseXplZDogbnVtYmVyO1xuICBuZWVkc1Zpc3VhbFJldmlldzogbnVtYmVyO1xuICBjb21wbGV0ZWQ6IG51bWJlcjtcbiAgc2tpcHBlZDogbnVtYmVyO1xuICBlcnJvcnM6IG51bWJlcjtcbiAgYW5hbHlzaXNTdWNjZXNzUmF0ZTogbnVtYmVyO1xuICBhdmVyYWdlVHJhbnNjcmlwdExlbmd0aDogbnVtYmVyO1xufVxuXG4vLyBMYXRlc3QgYXZhaWxhYmxlIG1vZGVsIGFzIG9mIEphbiAyMDI1LzIwMjZcbmNvbnN0IEdFTUlOSV9NT0RFTCA9ICdnZW1pbmktMy1mbGFzaC1wcmV2aWV3JztcbmNvbnN0IEFJX1NUVURJT19VUkwgPSBgaHR0cHM6Ly9haXN0dWRpby5nb29nbGUuY29tL2FwcC9wcm9tcHRzL25ld19jaGF0P21vZGVsPSR7R0VNSU5JX01PREVMfWA7XG5cbmNvbnN0IEFOQUxZU0lTX1BST01QVCA9IGBZb3UgYXJlIGFuYWx5emluZyBhIFlvdVR1YmUgdmlkZW8gdHJhbnNjcmlwdC4gRXh0cmFjdCBhbmQgc3RydWN0dXJlIHRoZSBmb2xsb3dpbmcgaW5mb3JtYXRpb24gYXMgdmFsaWQgSlNPTiBvbmx5IChubyBtYXJrZG93biwgbm8gZXh0cmEgdGV4dCkuXG5cblJldHVybiBPTkxZIHRoaXMgSlNPTiBzdHJ1Y3R1cmU6XG57XG4gIFwic3VtbWFyeVwiOiBcIjItMyBzZW50ZW5jZSBzdW1tYXJ5IG9mIHRoZSB2aWRlbyBjb250ZW50XCIsXG4gIFwia2V5UG9pbnRzXCI6IFtcInBvaW50IDFcIiwgXCJwb2ludCAyXCIsIC4uLl0sXG4gIFwiYWlDb25jZXB0c1wiOiBbXCJBSSBjb25jZXB0IDFcIiwgXCJBSSBjb25jZXB0IDJcIiwgLi4uXSxcbiAgXCJ0ZWNobmljYWxEZXRhaWxzXCI6IFtcInRvb2wvZnJhbWV3b3JrIDFcIiwgXCJpbXBsZW1lbnRhdGlvbiBkZXRhaWxcIiwgLi4uXSxcbiAgXCJ2aXN1YWxDb250ZXh0RmxhZ3NcIjogW1xuICAgIHtcInRpbWVzdGFtcFwiOiAxMjAsIFwicmVhc29uXCI6IFwiQ29kZSBkZW1vXCIsIFwiY29udGV4dFwiOiBcIlNob3dzIFB5dGhvbiBpbXBsZW1lbnRhdGlvblwifVxuICBdXG59XG5cbklmIHRoZSB2aWRlbyBpcyBub3QgYWJvdXQgQUkvdGVjaCwgc2V0IGFpQ29uY2VwdHMgYW5kIHRlY2huaWNhbERldGFpbHMgdG8gZW1wdHkgYXJyYXlzIGJ1dCBzdGlsbCBleHRyYWN0IGtleVBvaW50cy5cblxuVFJBTlNDUklQVDpcbmA7XG5cbmNsYXNzIFRyYW5zY3JpcHRQcm9jZXNzb3JWMiB7XG4gIHByaXZhdGUgY29udGV4dDogQnJvd3NlckNvbnRleHQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBzdGF0ZTogUHJvY2Vzc2luZ1N0YXRlO1xuICBwcml2YXRlIHN0YXRlRmlsZVBhdGg6IHN0cmluZztcbiAgcHJpdmF0ZSByZXBvcnRzRGlyOiBzdHJpbmc7XG4gIHByaXZhdGUgdHJhbnNjcmlwdHNEaXI6IHN0cmluZztcbiAgcHJpdmF0ZSBrbm93bGVkZ2VCYXNlRmlsZTogc3RyaW5nO1xuICBwcml2YXRlIHRhcmdldFBoYXNlOiAnbWV0YWRhdGEnIHwgJ3RyYW5zY3JpcHQnIHwgJ2FuYWx5c2lzJyA9ICdhbmFseXNpcyc7XG5cbiAgY29uc3RydWN0b3IodGFyZ2V0UGhhc2U6ICdtZXRhZGF0YScgfCAndHJhbnNjcmlwdCcgfCAnYW5hbHlzaXMnID0gJ2FuYWx5c2lzJykge1xuICAgIHRoaXMudGFyZ2V0UGhhc2UgPSB0YXJnZXRQaGFzZTtcbiAgICAvLyBEZXRlcm1pbmUgZGF0YSBkaXJlY3RvcnkgKGhhbmRsZSBib3RoIHBhY2thZ2UgYW5kIHJvb3Qgc2NlbmFyaW9zKVxuICAgIGNvbnN0IHBhY2thZ2VEYXRhRGlyID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL2RhdGEnKTtcbiAgICBjb25zdCByb290RGF0YURpciA9IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9kYXRhJyk7XG5cbiAgICAvLyBQcmVmZXIgcm9vdCBkYXRhIGRpciBpZiBpdCBleGlzdHMgKHByZXZpb3VzIGJlaGF2aW9yKSwgb3RoZXJ3aXNlIHBhY2thZ2UgZGF0YVxuICAgIGNvbnN0IGRhdGFEaXIgPSBmcy5leGlzdHNTeW5jKHJvb3REYXRhRGlyKSA/IHJvb3REYXRhRGlyIDogcGFja2FnZURhdGFEaXI7XG5cbiAgICB0aGlzLnN0YXRlRmlsZVBhdGggPSBwYXRoLmpvaW4oZGF0YURpciwgJ3RyYW5zY3JpcHQtdjItc3RhdGUuanNvbicpO1xuICAgIHRoaXMucmVwb3J0c0RpciA9IHBhdGguam9pbihkYXRhRGlyLCAndmlkZW8tcmVwb3J0cycpO1xuICAgIHRoaXMudHJhbnNjcmlwdHNEaXIgPSBwYXRoLmpvaW4oZGF0YURpciwgJ3ZpZGVvLXRyYW5zY3JpcHRzJyk7XG4gICAgdGhpcy5rbm93bGVkZ2VCYXNlRmlsZSA9IHBhdGguam9pbihkYXRhRGlyLCAnQUlfS25vd2xlZGdlX0Jhc2UubWQnKTtcblxuICAgIGNvbnNvbGUubG9nKGBbdjJdIFVzaW5nIGRhdGEgZGlyZWN0b3J5OiAke2RhdGFEaXJ9YCk7XG5cbiAgICAvLyBFbnN1cmUgZGlyZWN0b3JpZXMgZXhpc3RcbiAgICBmcy5ta2RpclN5bmModGhpcy5yZXBvcnRzRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBmcy5ta2RpclN5bmModGhpcy50cmFuc2NyaXB0c0RpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgZnMubWtkaXJTeW5jKHBhdGguam9pbihkYXRhRGlyLCAndGVtcF9zdWJzJyksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuXG4gICAgdGhpcy5zdGF0ZSA9IHRoaXMubG9hZFN0YXRlKCk7XG4gIH1cblxuICBwcml2YXRlIGxvYWRTdGF0ZSgpOiBQcm9jZXNzaW5nU3RhdGUge1xuICAgIHRyeSB7XG4gICAgICBpZiAoZnMuZXhpc3RzU3luYyh0aGlzLnN0YXRlRmlsZVBhdGgpKSB7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmModGhpcy5zdGF0ZUZpbGVQYXRoLCAndXRmLTgnKSk7XG4gICAgICAgIC8vIE1pZ3JhdGUgb2xkIHN0YXRlIGlmIG5lZWRlZFxuICAgICAgICBpZiAoc3RhdGUudmVyc2lvbiAhPT0gJzIuMCcpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnW3YyXSBNaWdyYXRpbmcgc3RhdGUgdG8gdjIgZm9ybWF0Li4uJyk7XG4gICAgICAgICAgc3RhdGUudmVyc2lvbiA9ICcyLjAnO1xuICAgICAgICAgIHN0YXRlLnF1ZXVlID0gc3RhdGUucXVldWUubWFwKCh2OiBhbnkpID0+ICh7XG4gICAgICAgICAgICAuLi52LFxuICAgICAgICAgICAgcHJvY2Vzc2luZ0F0dGVtcHRzOiB2LnByb2Nlc3NpbmdBdHRlbXB0cyB8fCAwLFxuICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5sb2coJ1t2Ml0gQ3JlYXRpbmcgbmV3IHN0YXRlIGZpbGUnKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHZlcnNpb246ICcyLjAnLFxuICAgICAgcXVldWU6IFtdLFxuICAgICAgY3VycmVudEluZGV4OiAwLFxuICAgICAgc3RhcnRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICBsYXN0VXBkYXRlZDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgc3RhdHM6IHtcbiAgICAgICAgdG90YWxWaWRlb3M6IDAsXG4gICAgICAgIG1ldGFkYXRhQ29tcGxldGU6IDAsXG4gICAgICAgIHRyYW5zY3JpcHRzRXh0cmFjdGVkOiAwLFxuICAgICAgICBhbmFseXplZDogMCxcbiAgICAgICAgbmVlZHNWaXN1YWxSZXZpZXc6IDAsXG4gICAgICAgIGNvbXBsZXRlZDogMCxcbiAgICAgICAgc2tpcHBlZDogMCxcbiAgICAgICAgZXJyb3JzOiAwLFxuICAgICAgICBhbmFseXNpc1N1Y2Nlc3NSYXRlOiAwLFxuICAgICAgICBhdmVyYWdlVHJhbnNjcmlwdExlbmd0aDogMCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgc2F2ZVN0YXRlKCk6IHZvaWQge1xuICAgIHRoaXMuc3RhdGUubGFzdFVwZGF0ZWQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgdGhpcy51cGRhdGVTdGF0cygpO1xuICAgIGZzLm1rZGlyU3luYyhwYXRoLmRpcm5hbWUodGhpcy5zdGF0ZUZpbGVQYXRoKSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgZnMud3JpdGVGaWxlU3luYyh0aGlzLnN0YXRlRmlsZVBhdGgsIEpTT04uc3RyaW5naWZ5KHRoaXMuc3RhdGUsIG51bGwsIDIpKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlU3RhdHMoKTogdm9pZCB7XG4gICAgY29uc3QgcyA9IHRoaXMuc3RhdGUuc3RhdHM7XG4gICAgY29uc3QgYW5hbHl6ZWQgPSB0aGlzLnN0YXRlLnF1ZXVlLmZpbHRlcigodikgPT4gdi5hbmFseXNpcykubGVuZ3RoO1xuICAgIGNvbnN0IGF0dGVtcHRlZCA9IHRoaXMuc3RhdGUucXVldWUuZmlsdGVyKCh2KSA9PiB2LnByb2Nlc3NpbmdBdHRlbXB0cyA+IDApLmxlbmd0aDtcbiAgICBzLmFuYWx5c2lzU3VjY2Vzc1JhdGUgPSBhdHRlbXB0ZWQgPiAwID8gKGFuYWx5emVkIC8gYXR0ZW1wdGVkKSAqIDEwMCA6IDA7XG5cbiAgICBjb25zdCB0cmFuc2NyaXB0cyA9IHRoaXMuc3RhdGUucXVldWUuZmlsdGVyKCh2KSA9PiB2LnRyYW5zY3JpcHQpO1xuICAgIHMuYXZlcmFnZVRyYW5zY3JpcHRMZW5ndGggPVxuICAgICAgdHJhbnNjcmlwdHMubGVuZ3RoID4gMFxuICAgICAgICA/IHRyYW5zY3JpcHRzLnJlZHVjZSgoc3VtLCB2KSA9PiBzdW0gKyAodi50cmFuc2NyaXB0Py5sZW5ndGggfHwgMCksIDApIC8gdHJhbnNjcmlwdHMubGVuZ3RoXG4gICAgICAgIDogMDtcbiAgfVxuXG4gIHByaXZhdGUgZXh0cmFjdFZpZGVvSWQodXJsOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBjb25zdCBwYXR0ZXJucyA9IFtcbiAgICAgIC8oPzp5b3V0dWJlXFwuY29tXFwvd2F0Y2hcXD92PXx5b3V0dVxcLmJlXFwvfHlvdXR1YmVcXC5jb21cXC9lbWJlZFxcLykoW14mXFxzP10rKS8sXG4gICAgICAveW91dHViZVxcLmNvbVxcL3ZcXC8oW14mXFxzP10rKS8sXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgcGF0dGVybnMpIHtcbiAgICAgIGNvbnN0IG1hdGNoID0gdXJsLm1hdGNoKHBhdHRlcm4pO1xuICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiBtYXRjaFsxXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBmb3JtYXREdXJhdGlvbihzZWNvbmRzOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIGNvbnN0IGhvdXJzID0gTWF0aC5mbG9vcihzZWNvbmRzIC8gMzYwMCk7XG4gICAgY29uc3QgbWludXRlcyA9IE1hdGguZmxvb3IoKHNlY29uZHMgJSAzNjAwKSAvIDYwKTtcbiAgICBjb25zdCBzZWNzID0gTWF0aC5mbG9vcihzZWNvbmRzICUgNjApO1xuXG4gICAgaWYgKGhvdXJzID4gMCkge1xuICAgICAgcmV0dXJuIGAke2hvdXJzfToke21pbnV0ZXMudG9TdHJpbmcoKS5wYWRTdGFydCgyLCAnMCcpfToke3NlY3MudG9TdHJpbmcoKS5wYWRTdGFydCgyLCAnMCcpfWA7XG4gICAgfVxuICAgIHJldHVybiBgJHttaW51dGVzfToke3NlY3MudG9TdHJpbmcoKS5wYWRTdGFydCgyLCAnMCcpfWA7XG4gIH1cblxuICBkZWNvZGVIdG1sRW50aXRpZXModGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGV4dFxuICAgICAgLnJlcGxhY2UoLyZhbXA7L2csICcmJylcbiAgICAgIC5yZXBsYWNlKC8mbHQ7L2csICc8JylcbiAgICAgIC5yZXBsYWNlKC8mZ3Q7L2csICc+JylcbiAgICAgIC5yZXBsYWNlKC8mcXVvdDsvZywgJ1wiJylcbiAgICAgIC5yZXBsYWNlKC8mIzM5Oy9nLCBcIidcIilcbiAgICAgIC5yZXBsYWNlKC8mI3gyNzsvZywgXCInXCIpXG4gICAgICAucmVwbGFjZSgvJiN4MkY7L2csICcvJyk7XG4gIH1cblxuICBhc3luYyBpbml0aWFsaXplKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIFVzZSBhIE5FVyBwcm9maWxlIHRvIGFsbG93IHRyeWluZyBhIGRpZmZlcmVudCBhY2NvdW50XG4gICAgY29uc3QgcHJvZmlsZURpciA9IHBhdGguam9pbihwcm9jZXNzLmVudi5IT01FIHx8ICcvdG1wJywgJy52aWRlby1wcm9jZXNzb3ItY2hyb21lLWNsZWFuJyk7XG5cbiAgICBjb25zb2xlLmxvZygnW3YyXSDwn5qAIExhdW5jaGluZyBDaHJvbWUgKHVzaW5nIGNsZWFuIGxvZ2luIHNlc3Npb24pLi4uJyk7XG4gICAgZnMubWtkaXJTeW5jKHByb2ZpbGVEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuXG4gICAgdGhpcy5jb250ZXh0ID0gYXdhaXQgY2hyb21pdW0ubGF1bmNoUGVyc2lzdGVudENvbnRleHQocHJvZmlsZURpciwge1xuICAgICAgaGVhZGxlc3M6IGZhbHNlLFxuICAgICAgY2hhbm5lbDogJ2Nocm9tZScsXG4gICAgICBhcmdzOiBbXG4gICAgICAgICctLW5vLWZpcnN0LXJ1bicsXG4gICAgICAgICctLW5vLWRlZmF1bHQtYnJvd3Nlci1jaGVjaycsXG4gICAgICAgICctLWRpc2FibGUtYmxpbmstZmVhdHVyZXM9QXV0b21hdGlvbkNvbnRyb2xsZWQnLFxuICAgICAgICAnLS13aW5kb3ctc2l6ZT0xMjgwLDgwMCcsXG4gICAgICBdLFxuICAgICAgdmlld3BvcnQ6IG51bGwsXG4gICAgICBpZ25vcmVEZWZhdWx0QXJnczogWyctLWVuYWJsZS1hdXRvbWF0aW9uJ10sXG4gICAgICB1c2VyQWdlbnQ6XG4gICAgICAgICdNb3ppbGxhLzUuMCAoTWFjaW50b3NoOyBJbnRlbCBNYWMgT1MgWCAxMF8xNV83KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIwLjAuMC4wIFNhZmFyaS81MzcuMzYnLFxuICAgIH0pO1xuXG4gICAgY29uc29sZS5sb2coJ1t2Ml0g4pyFIEJyb3dzZXIgcmVhZHknKTtcbiAgfVxuXG4gIC8vIEJyb3dzZXIgaGVhbHRoIGNoZWNrIC0gZW5zdXJlcyBicm93c2VyIGNvbnRleHQgaXMgYWxpdmVcbiAgcHJpdmF0ZSBhc3luYyBlbnN1cmVCcm93c2VySGVhbHRoKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICBpZiAoIXRoaXMuY29udGV4dCkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1t2Ml0g4pqg77iPIEJyb3dzZXIgY29udGV4dCBpcyBudWxsLCByZWluaXRpYWxpemluZy4uLicpO1xuICAgICAgICBhd2FpdCB0aGlzLmluaXRpYWxpemUoKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8vIFRyeSB0byBjaGVjayBpZiBjb250ZXh0IGlzIGFsaXZlIGJ5IGdldHRpbmcgcGFnZXNcbiAgICAgIGNvbnN0IHBhZ2VzID0gYXdhaXQgdGhpcy5jb250ZXh0LnBhZ2VzKCk7XG4gICAgICBjb25zb2xlLmxvZyhgW3YyXSDwn4+lIEJyb3dzZXIgaGVhbHRoIGNoZWNrOiAke3BhZ2VzLmxlbmd0aH0gcGFnZXMgb3BlbmApO1xuXG4gICAgICAvLyBJZiB0b28gbWFueSBwYWdlcyBhY2N1bXVsYXRlZCAoPjUwKSwgY2xvc2UgdGhlbVxuICAgICAgaWYgKHBhZ2VzLmxlbmd0aCA+IDUwKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihgW3YyXSDimqDvuI8gVG9vIG1hbnkgcGFnZXMgb3BlbiAoJHtwYWdlcy5sZW5ndGh9KSwgY2xlYW5pbmcgdXAuLi5gKTtcbiAgICAgICAgZm9yIChjb25zdCBwYWdlIG9mIHBhZ2VzKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyBJZ25vcmUgY2xvc2UgZXJyb3JzXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbdjJdIOKdjCBCcm93c2VyIGhlYWx0aCBjaGVjayBmYWlsZWQ6JywgZXJyb3IpO1xuICAgICAgY29uc29sZS5sb2coJ1t2Ml0g8J+UhCBSZWluaXRpYWxpemluZyBicm93c2VyLi4uJyk7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCB0aGlzLmNvbnRleHQ/LmNsb3NlKCk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8qIGlnbm9yZSAqL1xuICAgICAgfVxuICAgICAgYXdhaXQgdGhpcy5pbml0aWFsaXplKCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICAvLyBIZWxwZXIgZm9yIGh1bWFuLWxpa2UgZGVsYXlzXG4gIHByaXZhdGUgYXN5bmMgaHVtYW5EZWxheShtaW46IG51bWJlciwgbWF4OiBudW1iZXIsIHBhZ2U6IFBhZ2UpIHtcbiAgICBjb25zdCBkZWxheSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pICsgbWluKTtcbiAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KGRlbGF5KTtcbiAgfVxuXG4gIC8vIEhlbHBlciBmb3IgaHVtYW4tbGlrZSBtb3VzZSBtb3ZlbWVudFxuICBwcml2YXRlIGFzeW5jIGh1bWFuTW92ZShwYWdlOiBQYWdlLCBzZWxlY3Rvcjogc3RyaW5nKSB7XG4gICAgY29uc3QgZWxlbWVudCA9IGF3YWl0IHBhZ2UuJChzZWxlY3Rvcik7XG4gICAgaWYgKCFlbGVtZW50KSByZXR1cm47XG5cbiAgICBjb25zdCBib3ggPSBhd2FpdCBlbGVtZW50LmJvdW5kaW5nQm94KCk7XG4gICAgaWYgKCFib3gpIHJldHVybjtcblxuICAgIC8vIFN0YXJ0IGZyb20gcmFuZG9tIHBvc2l0aW9uXG4gICAgYXdhaXQgcGFnZS5tb3VzZS5tb3ZlKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDUwMCksIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDUwMCkpO1xuXG4gICAgLy8gTW92ZSB0byB0YXJnZXQgd2l0aCBcIm92ZXJzaG9vdFwiIGVmZmVjdCBzaW11bGF0aW9uIChzaW1wbGUgc3RlcHMpXG4gICAgY29uc3QgdGFyZ2V0WCA9IGJveC54ICsgYm94LndpZHRoIC8gMjtcbiAgICBjb25zdCB0YXJnZXRZID0gYm94LnkgKyBib3guaGVpZ2h0IC8gMjtcbiAgICBhd2FpdCBwYWdlLm1vdXNlLm1vdmUodGFyZ2V0WCwgdGFyZ2V0WSwgeyBzdGVwczogMjUgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNvbHZlR29vZ2xlQ2FwdGNoYShwYWdlOiBQYWdlKSB7XG4gICAgY29uc29sZS5sb2coJ1t2Ml0g4pqg77iPIERldGVjdGVkIEdvb2dsZSBSb2JvdCBDaGVjay4gQXR0ZW1wdGluZyB0byBzb2x2ZS4uLicpO1xuXG4gICAgLy8gMS4gTG9vayBmb3IgdGhlIGlmcmFtZVxuICAgIGNvbnN0IGZyYW1lcyA9IHBhZ2UuZnJhbWVzKCk7XG4gICAgY29uc3QgcmVjYXB0Y2hhRnJhbWUgPSBmcmFtZXMuZmluZCgoZikgPT4gZi51cmwoKS5pbmNsdWRlcygnZ29vZ2xlLmNvbS9yZWNhcHRjaGEnKSk7XG5cbiAgICBpZiAocmVjYXB0Y2hhRnJhbWUpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdbdjJdIEZvdW5kIHJlQ0FQVENIQSBmcmFtZS4gQ2xpY2tpbmcgY2hlY2tib3guLi4nKTtcblxuICAgICAgY29uc3QgY2hlY2tib3ggPSBhd2FpdCByZWNhcHRjaGFGcmFtZS4kKCcucmVjYXB0Y2hhLWNoZWNrYm94LWJvcmRlciwgI3JlY2FwdGNoYS1hbmNob3InKTtcbiAgICAgIGlmIChjaGVja2JveCkge1xuICAgICAgICBhd2FpdCB0aGlzLmh1bWFuRGVsYXkoMTAwMCwgMzAwMCwgcGFnZSk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvLyBVc2UgUGxheXdyaWdodCdzIG5hdGl2ZSBoYW5kbGluZyB3aGljaCBjb3JyZWN0bHkgbWFwcyBpZnJhbWUgY29vcmRpbmF0ZXNcbiAgICAgICAgICBhd2FpdCBjaGVja2JveC5ob3ZlcigpO1xuICAgICAgICAgIGF3YWl0IHRoaXMuaHVtYW5EZWxheSgyMDAsIDUwMCwgcGFnZSk7XG4gICAgICAgICAgYXdhaXQgY2hlY2tib3guY2xpY2soeyBkZWxheTogTWF0aC5yYW5kb20oKSAqIDEwMCArIDUwIH0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1t2Ml0gQ2xpY2sgZmFpbGVkLCB0cnlpbmcgZm9yY2UgY2xpY2snLCBlKTtcbiAgICAgICAgICBhd2FpdCBjaGVja2JveC5kaXNwYXRjaEV2ZW50KCdjbGljaycpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coJ1t2Ml0gQ2xpY2tlZCBjaGVja2JveC4gV2FpdGluZyBmb3Igb3V0Y29tZS4uLicpO1xuICAgICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDUwMDApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1t2Ml0gQ291bGQgbm90IGZpbmQgY2hlY2tib3ggaW5zaWRlIGZyYW1lLicpO1xuICAgICAgICAvLyBUYWtlIGEgc2NyZWVuc2hvdCBmb3IgdmFsaWQgZGVidWdnaW5nXG4gICAgICAgIGF3YWl0IHBhZ2Uuc2NyZWVuc2hvdCh7IHBhdGg6IHBhdGguam9pbih0aGlzLnJlcG9ydHNEaXIsICdjYXB0Y2hhX2ZhaWwucG5nJykgfSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEZhbGxiYWNrOiBsb29raW5nIGZvciBub3JtYWwgYnV0dG9ucyBpZiBpdCdzIG5vdCBhbiBpZnJhbWUgY2FwdGNoYVxuICAgICAgY29uc3QgYnV0dG9uID0gYXdhaXQgcGFnZS4kKCcjTDJBR0xiLCBbYXJpYS1sYWJlbD1cIkkgYWdyZWVcIl0sIGJ1dHRvbjpoYXMtdGV4dChcIkkgYWdyZWVcIiknKTtcbiAgICAgIGlmIChidXR0b24pIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1t2Ml0gRm91bmQgc2ltcGxlIGNvbnNlbnQgYnV0dG9uLiBDbGlja2luZy4uLicpO1xuICAgICAgICBhd2FpdCB0aGlzLmh1bWFuTW92ZShwYWdlLCAnI0wyQUdMYicpOyAvLyBtb3ZlIHRvIGNvbnNlbnRcbiAgICAgICAgYXdhaXQgYnV0dG9uLmNsaWNrKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgaWYgd2UgYXJlIHN0aWxsIHN0dWNrXG4gICAgaWYgKHBhZ2UudXJsKCkuaW5jbHVkZXMoJ2dvb2dsZS5jb20vc29ycnkvJykpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdbdjJdIFN0aWxsIG9uIHNvcnJ5IHBhZ2UuIFdhaXRpbmcgZm9yIHVzZXIgaW50ZXJ2ZW50aW9uIG9yIElQIHJvdGF0aW9uLi4uJyk7XG4gICAgICAvLyBJbiBhIHJlYWwgaGVhZGxlc3Mgc2NlbmFyaW8sIHdlJ2QgbmVlZCBhIGNhcHRjaGEgc2VydmljZSBoZXJlLlxuICAgICAgLy8gRm9yIG5vdywgd2Ugd2FpdCBhIGJpdCB0byBzZWUgaWYgaXQgY2xlYXJzIG9yIGlmIHdlIGNhbiBwcm9jZWVkLlxuICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCg1MDAwKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBmZXRjaEVucmljaGVkTWV0YWRhdGEodmlkZW86IFZpZGVvRW50cnkpOiBQcm9taXNlPFZpZGVvTWV0YWRhdGEgfCBudWxsPiB7XG4gICAgaWYgKCF0aGlzLmNvbnRleHQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQnJvd3NlciBub3QgaW5pdGlhbGl6ZWQnKTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhgW3YyXSDwn5OKIEVucmljaGVkIG1ldGFkYXRhIGZldGNoOiAke3ZpZGVvLnRpdGxlfWApO1xuXG4gICAgY29uc3QgcGFnZSA9IGF3YWl0IHRoaXMuY29udGV4dC5uZXdQYWdlKCk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcXVlcnkgPSBgWW91VHViZSB2aWRlbyBcIiR7dmlkZW8udXJsfVwiIGNvbXBsZXRlIGluZm9ybWF0aW9uOiBkdXJhdGlvbiwgY2hhbm5lbCwgZGVzY3JpcHRpb24sIHZpZXdzLCBwdWJsaXNoIGRhdGUsIHRvcGljcywgc3VtbWFyeWA7XG4gICAgICBjb25zdCBzZWFyY2hVcmwgPSBgaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9zZWFyY2g/cT0ke2VuY29kZVVSSUNvbXBvbmVudChxdWVyeSl9JnVkbT01MGA7XG5cbiAgICAgIGF3YWl0IHBhZ2UuZ290byhzZWFyY2hVcmwsIHsgd2FpdFVudGlsOiAnZG9tY29udGVudGxvYWRlZCcsIHRpbWVvdXQ6IDMwMDAwIH0pO1xuXG4gICAgICAvLyBDaGVjayBmb3IgR29vZ2xlIFJvYm90IENoZWNrXG4gICAgICBpZiAoXG4gICAgICAgIHBhZ2UudXJsKCkuaW5jbHVkZXMoJ2dvb2dsZS5jb20vc29ycnkvJykgfHxcbiAgICAgICAgKGF3YWl0IHBhZ2UuJCgndGV4dD1cInVudXN1YWwgdHJhZmZpY1wiJykpIHx8XG4gICAgICAgIChhd2FpdCBwYWdlLiQoJ2lmcmFtZVtzcmMqPVwicmVjYXB0Y2hhXCJdJykpXG4gICAgICApIHtcbiAgICAgICAgYXdhaXQgdGhpcy5zb2x2ZUdvb2dsZUNhcHRjaGEocGFnZSk7XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoNTAwMCk7IC8vIExldCBBSSBtb2RlIGdlbmVyYXRlIHJlc3BvbnNlXG5cbiAgICAgIGNvbnN0IHBhZ2VUZXh0ID0gYXdhaXQgcGFnZS5ldmFsdWF0ZSgoKSA9PiBkb2N1bWVudC5ib2R5LmlubmVyVGV4dCk7XG5cbiAgICAgIGxldCBkdXJhdGlvbiA9IDA7XG4gICAgICBjb25zdCBkdXJhdGlvblBhdHRlcm5zID0gW1xuICAgICAgICAvKFxcZCspXFxzKmhvdXJzP1xccyosP1xccyooXFxkKyk/XFxzKm1pbnV0ZXM/XFxzKiw/XFxzKihcXGQrKT9cXHMqc2Vjb25kcz8vaSxcbiAgICAgICAgLyhcXGQrKVxccyptaW51dGVzP1xccyosP1xccyooXFxkKyk/XFxzKnNlY29uZHM/L2ksXG4gICAgICAgIC8oXFxkKyk6KFxcZCspOihcXGQrKS8sXG4gICAgICAgIC8oXFxkKyk6KFxcZCspLyxcbiAgICAgICAgL2R1cmF0aW9uWzpcXHNdKihcXGQrKTooXFxkKykvaSxcbiAgICAgIF07XG5cbiAgICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBkdXJhdGlvblBhdHRlcm5zKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gcGFnZVRleHQubWF0Y2gocGF0dGVybik7XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgIGlmIChtYXRjaFswXS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdob3VyJykpIHtcbiAgICAgICAgICAgIGR1cmF0aW9uID1cbiAgICAgICAgICAgICAgcGFyc2VJbnQobWF0Y2hbMV0pICogMzYwMCArXG4gICAgICAgICAgICAgIHBhcnNlSW50KG1hdGNoWzJdIHx8ICcwJykgKiA2MCArXG4gICAgICAgICAgICAgIHBhcnNlSW50KG1hdGNoWzNdIHx8ICcwJyk7XG4gICAgICAgICAgfSBlbHNlIGlmIChtYXRjaFswXS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdtaW51dGUnKSkge1xuICAgICAgICAgICAgZHVyYXRpb24gPSBwYXJzZUludChtYXRjaFsxXSkgKiA2MCArIHBhcnNlSW50KG1hdGNoWzJdIHx8ICcwJyk7XG4gICAgICAgICAgfSBlbHNlIGlmIChtYXRjaC5sZW5ndGggPT09IDQpIHtcbiAgICAgICAgICAgIGR1cmF0aW9uID0gcGFyc2VJbnQobWF0Y2hbMV0pICogMzYwMCArIHBhcnNlSW50KG1hdGNoWzJdKSAqIDYwICsgcGFyc2VJbnQobWF0Y2hbM10pO1xuICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2gubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgICBkdXJhdGlvbiA9IHBhcnNlSW50KG1hdGNoWzFdKSAqIDYwICsgcGFyc2VJbnQobWF0Y2hbMl0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBjaGFubmVsUGF0dGVybnMgPSBbXG4gICAgICAgIC8oPzpieXxjaGFubmVsfGZyb20pXFxzKihbQS1aYS16MC05XFxzXFwtX10rPykoPzpcXHMqW8K34oCiXFwtfF18XFxzKlxcZHx2aWV3c3xzdWJzY3JpYmVyc3wkKS9pLFxuICAgICAgICAvdXBsb2FkZWQgYnlcXHMqKFtBLVphLXowLTlcXHNcXC1fXSspL2ksXG4gICAgICBdO1xuICAgICAgbGV0IGNoYW5uZWw6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBjaGFubmVsUGF0dGVybnMpIHtcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBwYWdlVGV4dC5tYXRjaChwYXR0ZXJuKTtcbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgY2hhbm5lbCA9IG1hdGNoWzFdLnRyaW0oKS5zdWJzdHJpbmcoMCwgNTApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHZpZXdNYXRjaCA9IHBhZ2VUZXh0Lm1hdGNoKC8oXFxkKyg/OixcXGQrKSooPzpcXC5cXGQrKT9bS01CXT8pXFxzKnZpZXdzPy9pKTtcblxuICAgICAgY29uc3QgZGF0ZVBhdHRlcm5zID0gW1xuICAgICAgICAvKD86cHVibGlzaGVkfHVwbG9hZGVkfHBvc3RlZClcXHMqKD86b25cXHMqKT8oW0EtWmEtel0rXFxzK1xcZCssP1xccypcXGR7NH0pL2ksXG4gICAgICAgIC8oXFxkK1xccyooPzpkYXlzP3x3ZWVrcz98bW9udGhzP3x5ZWFycz8pXFxzKmFnbykvaSxcbiAgICAgIF07XG4gICAgICBsZXQgcHVibGlzaERhdGU6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBkYXRlUGF0dGVybnMpIHtcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBwYWdlVGV4dC5tYXRjaChwYXR0ZXJuKTtcbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgcHVibGlzaERhdGUgPSBtYXRjaFsxXTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBkZXNjTWF0Y2ggPSBwYWdlVGV4dC5tYXRjaCgvKD86ZGVzY3JpcHRpb258YWJvdXQpWzpcXHNdKihbXi5dK1xcLlteLl0rXFwuKS9pKTtcbiAgICAgIGNvbnN0IHN1bW1hcnlNYXRjaCA9IHBhZ2VUZXh0Lm1hdGNoKC8oPzpzdW1tYXJ5fG92ZXJ2aWV3fHRoaXMgdmlkZW8pWzpcXHNdKihbXi5dK1xcLlteLl0rXFwuKS9pKTtcblxuICAgICAgY29uc3QgbWV0YWRhdGE6IFZpZGVvTWV0YWRhdGEgPSB7XG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgICBkdXJhdGlvbkZvcm1hdHRlZDogdGhpcy5mb3JtYXREdXJhdGlvbihkdXJhdGlvbiksXG4gICAgICAgIGNoYW5uZWwsXG4gICAgICAgIHZpZXdDb3VudDogdmlld01hdGNoID8gdmlld01hdGNoWzFdIDogdW5kZWZpbmVkLFxuICAgICAgICBwdWJsaXNoRGF0ZSxcbiAgICAgICAgZGVzY3JpcHRpb246IGRlc2NNYXRjaCA/IGRlc2NNYXRjaFsxXS5zdWJzdHJpbmcoMCwgNTAwKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgc3VtbWFyeTogc3VtbWFyeU1hdGNoID8gc3VtbWFyeU1hdGNoWzFdLnN1YnN0cmluZygwLCAzMDApIDogdW5kZWZpbmVkLFxuICAgICAgfTtcblxuICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgY29uc29sZS5sb2coXG4gICAgICAgIGBbdjJdIOKchSBNZXRhZGF0YTogJHttZXRhZGF0YS5kdXJhdGlvbkZvcm1hdHRlZH0gfCAke21ldGFkYXRhLmNoYW5uZWwgfHwgJ1Vua25vd24gY2hhbm5lbCd9YFxuICAgICAgKTtcbiAgICAgIHJldHVybiBtZXRhZGF0YTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBbdjJdIEVycm9yIGluIG1ldGFkYXRhIGZldGNoOmAsIGUpO1xuICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZXh0cmFjdFRyYW5zY3JpcHREaXJlY3QodmlkZW86IFZpZGVvRW50cnkpOiBQcm9taXNlPFRyYW5zY3JpcHRTZWdtZW50W10gfCBudWxsPiB7XG4gICAgY29uc3Qgc2FmZVRpdGxlID0gdmlkZW8udGl0bGUucmVwbGFjZSgvW15hLXpBLVowLTldL2csICdfJykuc3Vic3RyaW5nKDAsIDUwKTtcblxuICAgIC8vIENoZWNrIG11bHRpcGxlIHBvc3NpYmxlIHRyYW5zY3JpcHQgbG9jYXRpb25zXG4gICAgY29uc3QgY2FuZGlkYXRlUGF0aHMgPSBbXG4gICAgICBwYXRoLmpvaW4odGhpcy50cmFuc2NyaXB0c0RpciwgYCR7dmlkZW8uaW5kZXh9XyR7dmlkZW8udmlkZW9JZH0udHh0YCksXG4gICAgICBwYXRoLmpvaW4odGhpcy50cmFuc2NyaXB0c0RpciwgYCR7dmlkZW8uaW5kZXh9XyR7c2FmZVRpdGxlfS50eHRgKSxcbiAgICAgIHBhdGguam9pbihcbiAgICAgICAgJy9Vc2Vycy88b3duZXI+L0Rlc2t0b3AvQTEtSW50ZXItTExNLUNvbS9teS1haS1rbm93bGVkZ2UtYmFzZS92aWRlby10cmFuc2NyaXB0cycsXG4gICAgICAgIGB0cmFuc2NyaXB0XyR7dmlkZW8uaW5kZXh9XyR7c2FmZVRpdGxlfS50eHRgXG4gICAgICApLFxuICAgICAgcGF0aC5qb2luKFxuICAgICAgICAnL1VzZXJzLzxvd25lcj4vRGVza3RvcC9BMS1JbnRlci1MTE0tQ29tL215LWFpLWtub3dsZWRnZS1iYXNlL3ZpZGVvLXRyYW5zY3JpcHRzJyxcbiAgICAgICAgYCR7dmlkZW8uaW5kZXh9XyR7c2FmZVRpdGxlfS50eHRgXG4gICAgICApLFxuICAgICAgcGF0aC5qb2luKFxuICAgICAgICAnL1VzZXJzLzxvd25lcj4vRGVza3RvcC9BMS1JbnRlci1MTE0tQ29tL215LWFpLWtub3dsZWRnZS1iYXNlL3RyYW5zY3JpcHRzJyxcbiAgICAgICAgYCR7dmlkZW8uaW5kZXh9XyR7c2FmZVRpdGxlfS50eHRgXG4gICAgICApLFxuICAgICAgcGF0aC5qb2luKFxuICAgICAgICAnL1VzZXJzLzxvd25lcj4vRGVza3RvcC9BMS1JbnRlci1MTE0tQ29tL215LWFpLWtub3dsZWRnZS1iYXNlL3RyYW5zY3JpcHRzJyxcbiAgICAgICAgYCR7dmlkZW8uaW5kZXh9X01hbnVzX2lzX291dF9vZl9jb250cm9sLnR4dGBcbiAgICAgICksIC8vIFNwZWNpYWwgY2FzZSBoYW5kbGluZ1xuICAgIF07XG5cbiAgICBmb3IgKGNvbnN0IHRyYW5zY3JpcHRGaWxlIG9mIGNhbmRpZGF0ZVBhdGhzKSB7XG4gICAgICBpZiAoZnMuZXhpc3RzU3luYyh0cmFuc2NyaXB0RmlsZSkpIHtcbiAgICAgICAgY29uc29sZS5sb2coYFt2Ml0g4pyFIFVzaW5nIGV4aXN0aW5nIHRyYW5zY3JpcHQgZmlsZTogJHtwYXRoLmJhc2VuYW1lKHRyYW5zY3JpcHRGaWxlKX1gKTtcbiAgICAgICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyh0cmFuc2NyaXB0RmlsZSwgJ3V0ZjgnKTtcbiAgICAgICAgcmV0dXJuIGNvbnRlbnRcbiAgICAgICAgICAuc3BsaXQoJ1xcbicpXG4gICAgICAgICAgLmZpbHRlcigobGluZSkgPT4gbGluZS50cmltKCkpXG4gICAgICAgICAgLm1hcCgobGluZSwgaSkgPT4gKHtcbiAgICAgICAgICAgIHN0YXJ0OiBpICogNSxcbiAgICAgICAgICAgIGR1cmF0aW9uOiA1LFxuICAgICAgICAgICAgdGV4dDogbGluZS5yZXBsYWNlKC9eXFxbLio/XFxdXFxzKi8sICcnKS50cmltKCksXG4gICAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghdGhpcy5jb250ZXh0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Jyb3dzZXIgbm90IGluaXRpYWxpemVkJyk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coYFt2Ml0g8J+TnSBUcmFuc2NyaXB0IGV4dHJhY3Rpb246ICR7dmlkZW8udmlkZW9JZH1gKTtcblxuICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCB0aGlzLmNvbnRleHQubmV3UGFnZSgpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHBhZ2UuZ290byh2aWRlby51cmwsIHsgd2FpdFVudGlsOiAnbG9hZCcsIHRpbWVvdXQ6IDQ1MDAwIH0pO1xuICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgzMDAwKTtcblxuICAgICAgY29uc3QgY2FwdGlvbkRhdGEgPSBhd2FpdCBwYWdlLmV2YWx1YXRlKCgpID0+IHtcbiAgICAgICAgY29uc3Qgd2luID0gd2luZG93IGFzIGFueTtcbiAgICAgICAgaWYgKHdpbi55dEluaXRpYWxQbGF5ZXJSZXNwb25zZT8uY2FwdGlvbnM/LnBsYXllckNhcHRpb25zVHJhY2tsaXN0UmVuZGVyZXI/LmNhcHRpb25UcmFja3MpIHtcbiAgICAgICAgICBjb25zdCB0cmFja3MgPVxuICAgICAgICAgICAgd2luLnl0SW5pdGlhbFBsYXllclJlc3BvbnNlLmNhcHRpb25zLnBsYXllckNhcHRpb25zVHJhY2tsaXN0UmVuZGVyZXIuY2FwdGlvblRyYWNrcztcbiAgICAgICAgICBjb25zdCB0cmFjayA9IHRyYWNrcy5maW5kKCh0OiBhbnkpID0+IHQubGFuZ3VhZ2VDb2RlID09PSAnZW4nKSB8fCB0cmFja3NbMF07XG4gICAgICAgICAgcmV0dXJuIHRyYWNrPy5iYXNlVXJsIHx8IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzY3JpcHRzID0gQXJyYXkuZnJvbShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdzY3JpcHQnKSk7XG4gICAgICAgIGZvciAoY29uc3Qgc2NyaXB0IG9mIHNjcmlwdHMpIHtcbiAgICAgICAgICBjb25zdCB0ZXh0ID0gc2NyaXB0LnRleHRDb250ZW50IHx8ICcnO1xuICAgICAgICAgIGlmICh0ZXh0LmluY2x1ZGVzKCdjYXB0aW9uVHJhY2tzJykpIHtcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gdGV4dC5tYXRjaCgvXCJjYXB0aW9uVHJhY2tzXCI6XFxzKlxcWyguKj8pXFxdLyk7XG4gICAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCB0cmFja3NTdHIgPSAnWycgKyBtYXRjaFsxXSArICddJztcbiAgICAgICAgICAgICAgICBjb25zdCB0cmFja3MgPSBKU09OLnBhcnNlKHRyYWNrc1N0cik7XG4gICAgICAgICAgICAgICAgaWYgKHRyYWNrcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCB0cmFjayA9IHRyYWNrcy5maW5kKCh0OiBhbnkpID0+IHQubGFuZ3VhZ2VDb2RlID09PSAnZW4nKSB8fCB0cmFja3NbMF07XG4gICAgICAgICAgICAgICAgICByZXR1cm4gdHJhY2s/LmJhc2VVcmwgfHwgbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSk7XG5cbiAgICAgIGlmIChjYXB0aW9uRGF0YSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgW3YyXSBGb3VuZCBjYXB0aW9uIFVSTCwgZmV0Y2hpbmcgdHJhbnNjcmlwdC4uLmApO1xuXG4gICAgICAgIGNvbnN0IGNhcHRpb25QYWdlID0gYXdhaXQgdGhpcy5jb250ZXh0IS5uZXdQYWdlKCk7XG4gICAgICAgIGF3YWl0IGNhcHRpb25QYWdlLmdvdG8oY2FwdGlvbkRhdGEsIHsgd2FpdFVudGlsOiAnbG9hZCcsIHRpbWVvdXQ6IDMwMDAwIH0pO1xuICAgICAgICBjb25zdCB4bWwgPSBhd2FpdCBjYXB0aW9uUGFnZS5jb250ZW50KCk7XG4gICAgICAgIGF3YWl0IGNhcHRpb25QYWdlLmNsb3NlKCk7XG5cbiAgICAgICAgY29uc3Qgc2VnbWVudHM6IFRyYW5zY3JpcHRTZWdtZW50W10gPSBbXTtcbiAgICAgICAgY29uc3QgdGV4dFJlZ2V4ID0gLzx0ZXh0IHN0YXJ0PVwiKFtcXGQuXSspXCIgZHVyPVwiKFtcXGQuXSspXCJbXj5dKj4oW148XSopPFxcL3RleHQ+L2c7XG4gICAgICAgIGxldCBtYXRjaDtcblxuICAgICAgICB3aGlsZSAoKG1hdGNoID0gdGV4dFJlZ2V4LmV4ZWMoeG1sKSkgIT09IG51bGwpIHtcbiAgICAgICAgICBzZWdtZW50cy5wdXNoKHtcbiAgICAgICAgICAgIHN0YXJ0OiBwYXJzZUZsb2F0KG1hdGNoWzFdKSxcbiAgICAgICAgICAgIGR1cmF0aW9uOiBwYXJzZUZsb2F0KG1hdGNoWzJdKSxcbiAgICAgICAgICAgIHRleHQ6IHRoaXMuZGVjb2RlSHRtbEVudGl0aWVzKG1hdGNoWzNdKSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZWdtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIOKchSBFeHRyYWN0ZWQgJHtzZWdtZW50cy5sZW5ndGh9IHRyYW5zY3JpcHQgc2VnbWVudHNgKTtcbiAgICAgICAgICByZXR1cm4gc2VnbWVudHM7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coJ1t2Ml0gVHJ5aW5nIFVJIHRyYW5zY3JpcHQgcGFuZWwuLi4nKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZXhwYW5kQnRuID0gcGFnZS5sb2NhdG9yKCcjZXhwYW5kLCB0cC15dC1wYXBlci1idXR0b24jZXhwYW5kJyk7XG4gICAgICAgIGlmICgoYXdhaXQgZXhwYW5kQnRuLmNvdW50KCkpID4gMCkge1xuICAgICAgICAgIGF3YWl0IGV4cGFuZEJ0bi5maXJzdCgpLmNsaWNrKCk7XG4gICAgICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgxMDAwKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkge31cblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdHJhbnNjcmlwdEJ0biA9IHBhZ2UubG9jYXRvcihcbiAgICAgICAgICAnW2FyaWEtbGFiZWwqPVwidHJhbnNjcmlwdFwiXSwgYnV0dG9uOmhhcy10ZXh0KFwidHJhbnNjcmlwdFwiKSdcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKChhd2FpdCB0cmFuc2NyaXB0QnRuLmNvdW50KCkpID4gMCkge1xuICAgICAgICAgIGF3YWl0IHRyYW5zY3JpcHRCdG4uZmlyc3QoKS5jbGljaygpO1xuICAgICAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMjAwMCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHt9XG5cbiAgICAgIGNvbnN0IHVpU2VnbWVudHMgPSBhd2FpdCBwYWdlLmV2YWx1YXRlKCgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0OiBBcnJheTx7IHN0YXJ0OiBudW1iZXI7IGR1cmF0aW9uOiBudW1iZXI7IHRleHQ6IHN0cmluZyB9PiA9IFtdO1xuICAgICAgICBjb25zdCBzZWdtZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3l0ZC10cmFuc2NyaXB0LXNlZ21lbnQtcmVuZGVyZXInKTtcbiAgICAgICAgc2VnbWVudHMuZm9yRWFjaCgoc2VnOiBFbGVtZW50KSA9PiB7XG4gICAgICAgICAgY29uc3QgdGltZUVsID0gc2VnLnF1ZXJ5U2VsZWN0b3IoJy5zZWdtZW50LXRpbWVzdGFtcCcpO1xuICAgICAgICAgIGNvbnN0IHRleHRFbCA9IHNlZy5xdWVyeVNlbGVjdG9yKCcuc2VnbWVudC10ZXh0Jyk7XG4gICAgICAgICAgaWYgKHRpbWVFbCAmJiB0ZXh0RWwpIHtcbiAgICAgICAgICAgIGNvbnN0IHRpbWUgPSB0aW1lRWwudGV4dENvbnRlbnQ/LnRyaW0oKSB8fCAnMDowMCc7XG4gICAgICAgICAgICBjb25zdCB0ZXh0ID0gdGV4dEVsLnRleHRDb250ZW50Py50cmltKCkgfHwgJyc7XG4gICAgICAgICAgICBjb25zdCBwYXJ0cyA9IHRpbWUuc3BsaXQoJzonKS5tYXAoKHA6IHN0cmluZykgPT4gcGFyc2VJbnQocCkgfHwgMCk7XG4gICAgICAgICAgICBjb25zdCBzZWNvbmRzID1cbiAgICAgICAgICAgICAgcGFydHMubGVuZ3RoID09PSAzXG4gICAgICAgICAgICAgICAgPyBwYXJ0c1swXSAqIDM2MDAgKyBwYXJ0c1sxXSAqIDYwICsgcGFydHNbMl1cbiAgICAgICAgICAgICAgICA6IHBhcnRzWzBdICogNjAgKyAocGFydHNbMV0gfHwgMCk7XG4gICAgICAgICAgICBpZiAodGV4dCkge1xuICAgICAgICAgICAgICByZXN1bHQucHVzaCh7IHN0YXJ0OiBzZWNvbmRzLCBkdXJhdGlvbjogMCwgdGV4dCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSk7XG5cbiAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcblxuICAgICAgaWYgKHVpU2VnbWVudHMgJiYgdWlTZWdtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdWlTZWdtZW50cy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgICB1aVNlZ21lbnRzW2ldLmR1cmF0aW9uID0gdWlTZWdtZW50c1tpICsgMV0uc3RhcnQgLSB1aVNlZ21lbnRzW2ldLnN0YXJ0O1xuICAgICAgICB9XG4gICAgICAgIGlmICh1aVNlZ21lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB1aVNlZ21lbnRzW3VpU2VnbWVudHMubGVuZ3RoIC0gMV0uZHVyYXRpb24gPSA1O1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIOKchSBFeHRyYWN0ZWQgJHt1aVNlZ21lbnRzLmxlbmd0aH0gc2VnbWVudHMgKFVJKWApO1xuICAgICAgICByZXR1cm4gdWlTZWdtZW50cztcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coJ1t2Ml0g4pqg77iPIE5vIHRyYW5zY3JpcHQgYXZhaWxhYmxlIHZpYSBVSS4gVHJ5aW5nIHl0LWRscC4uLicpO1xuICAgICAgY29uc3QgZmIgPSB0aGlzLmRvd25sb2FkVHJhbnNjcmlwdFdpdGhZdERscCh2aWRlby51cmwsIHZpZGVvLnZpZGVvSWQpO1xuICAgICAgaWYgKGZiKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIOKchSB5dC1kbHAgc3VjY2VzczogJHtmYi5sZW5ndGh9IHNlZ21lbnRzYCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICByZXR1cm4gZmI7XG4gICAgICB9XG5cbiAgICAgIGNvbnNvbGUubG9nKCdbdjJdIOKaoO+4jyBObyB0cmFuc2NyaXB0IGF2YWlsYWJsZScpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcignW3YyXSBUcmFuc2NyaXB0IGVycm9yOicsIGUpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgfSBjYXRjaCAoeCkge31cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBdXRvbWF0ZXMgdGhlIHByb2Nlc3Mgb2YgbGlua2luZyBhIHBhaWQgQVBJIGtleSBpZiBkZXRlY3RlZCBhcyBtaXNzaW5nLlxuICAgKiBUaGlzIHByZXZlbnRzIFwiUXVvdGEgZXhjZWVkZWRcIiBlcnJvcnMgb24gdGhlIGZyZWUgdGllci5cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZW5zdXJlUGFpZEFwaUtleShwYWdlOiBQYWdlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coJ1t2Ml0g8J+SsyBDaGVja2luZyBBUEkgS2V5IGNvbm5lY3Rpb24uLi4nKTtcbiAgICB0cnkge1xuICAgICAgLy8gTG9vayBmb3IgdGhlIFwiTm8gQVBJIEtleVwiIGNhcmQgb3IgYnV0dG9uXG4gICAgICBjb25zdCBub0tleUJ0biA9IHBhZ2VcbiAgICAgICAgLmxvY2F0b3IoJy5wYWlkLWFwaS1rZXktY2FyZFthcmlhLWxhYmVsPVwiTm8gQVBJIEtleVwiXScpXG4gICAgICAgIC5vcihwYWdlLmxvY2F0b3IoJ2J1dHRvbicsIHsgaGFzVGV4dDogJ05vIEFQSSBLZXknIH0pKVxuICAgICAgICAuZmlyc3QoKTtcblxuICAgICAgaWYgKGF3YWl0IG5vS2V5QnRuLmlzVmlzaWJsZSgpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIOKaoO+4jyBObyBBUEkgS2V5IGRldGVjdGVkLiBBdHRlbXB0aW5nIHRvIGxpbmsgXCJUaGUgTmV3IEZ1c2VcIi4uLicpO1xuICAgICAgICBhd2FpdCBub0tleUJ0bi5jbGljaygpO1xuICAgICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDIwMDApO1xuXG4gICAgICAgIC8vIDEuIFNlbGVjdCBQcm9qZWN0XG4gICAgICAgIGNvbnN0IHByb2plY3RTZWxlY3QgPSBwYWdlXG4gICAgICAgICAgLmxvY2F0b3IoJ21hdC1zZWxlY3RbYXJpYS1sYWJlbD1cIlNlbGVjdCBhIHBhaWQgcHJvamVjdFwiXScpXG4gICAgICAgICAgLmZpcnN0KCk7XG4gICAgICAgIGlmIChhd2FpdCBwcm9qZWN0U2VsZWN0LmlzVmlzaWJsZSgpKSB7XG4gICAgICAgICAgYXdhaXQgcHJvamVjdFNlbGVjdC5jbGljaygpO1xuICAgICAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMTAwMCk7XG5cbiAgICAgICAgICAvLyBUcnkgdG8gY2xpY2sgXCJUaGUgTmV3IEZ1c2VcIlxuICAgICAgICAgIGNvbnN0IGZ1c2VPcHRpb24gPSBwYWdlLmxvY2F0b3IoJ21hdC1vcHRpb24nLCB7IGhhc1RleHQ6ICdUaGUgTmV3IEZ1c2UnIH0pLmZpcnN0KCk7XG4gICAgICAgICAgaWYgKGF3YWl0IGZ1c2VPcHRpb24uaXNWaXNpYmxlKCkpIHtcbiAgICAgICAgICAgIGF3YWl0IGZ1c2VPcHRpb24uY2xpY2soKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gRmFsbGJhY2s6IENsaWNrIHRoZSBmaXJzdCBvcHRpb25cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIFwiVGhlIE5ldyBGdXNlXCIgbm90IGZvdW5kLCBzZWxlY3RpbmcgZmlyc3QgYXZhaWxhYmxlIHByb2plY3QuJyk7XG4gICAgICAgICAgICBhd2FpdCBwYWdlLmxvY2F0b3IoJ21hdC1vcHRpb24nKS5maXJzdCgpLmNsaWNrKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMTAwMCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyAyLiBFbmFibGUgXCJTYXZlIHBhaWQgQVBJIGtleVwiIGlmIG5vdCBlbmFibGVkXG4gICAgICAgIGNvbnN0IHNhdmVUb2dnbGUgPSBwYWdlXG4gICAgICAgICAgLmxvY2F0b3IoJ2J1dHRvbltyb2xlPVwic3dpdGNoXCJdW2FyaWEtbGFiZWxsZWRieT1cInNhdmUtcGFpZC1hcGkta2V5LWxhYmVsXCJdJylcbiAgICAgICAgICAub3IocGFnZS5sb2NhdG9yKCdidXR0b25bcm9sZT1cInN3aXRjaFwiXScpKVxuICAgICAgICAgIC5maXJzdCgpO1xuXG4gICAgICAgIGlmIChhd2FpdCBzYXZlVG9nZ2xlLmlzVmlzaWJsZSgpKSB7XG4gICAgICAgICAgY29uc3QgaXNDaGVja2VkID0gYXdhaXQgc2F2ZVRvZ2dsZS5nZXRBdHRyaWJ1dGUoJ2FyaWEtY2hlY2tlZCcpO1xuICAgICAgICAgIGlmIChpc0NoZWNrZWQgIT09ICd0cnVlJykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1t2Ml0gVG9nZ2xpbmcgXCJTYXZlIHBhaWQgQVBJIGtleVwiLi4uJyk7XG4gICAgICAgICAgICBhd2FpdCBzYXZlVG9nZ2xlLmNsaWNrKCk7XG4gICAgICAgICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDUwMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gMy4gQ29uZmlybSAoU2VsZWN0IGtleSlcbiAgICAgICAgY29uc3QgY29uZmlybUJ0biA9IHBhZ2VcbiAgICAgICAgICAubG9jYXRvcignYnV0dG9uLm1zLWJ1dHRvbi1wcmltYXJ5JywgeyBoYXNUZXh0OiAnU2VsZWN0IGtleScgfSlcbiAgICAgICAgICAuZmlyc3QoKTtcbiAgICAgICAgaWYgKGF3YWl0IGNvbmZpcm1CdG4uaXNWaXNpYmxlKCkpIHtcbiAgICAgICAgICBhd2FpdCBjb25maXJtQnRuLmNsaWNrKCk7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1t2Ml0g4pyFIEFQSSBLZXkgbGlua2VkIHN1Y2Nlc3NmdWxseS4gUmVsb2FkaW5nIHRvIGFwcGx5IGNoYW5nZXMuLi4nKTtcbiAgICAgICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDMwMDApO1xuICAgICAgICAgIGF3YWl0IHBhZ2UucmVsb2FkKHsgd2FpdFVudGlsOiAnZG9tY29udGVudGxvYWRlZCcgfSk7XG4gICAgICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgyMDAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdbdjJdIOKdjCBDb3VsZCBub3QgZmluZCBcIlNlbGVjdCBrZXlcIiBidXR0b24uJyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIOKchSBBUEkgS2V5IGFwcGVhcnMgdG8gYmUgbGlua2VkLicpO1xuICAgICAgICAvLyBHaXZlIEFJIFN0dWRpbyBleHRyYSB0aW1lIHRvIGZ1bGx5IHRyYW5zaXRpb24gdG8gcGFpZCBtb2RlXG4gICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIOKPsyBXYWl0aW5nIGZvciBBUEkgdHJhbnNpdGlvbiB0byBjb21wbGV0ZS4uLicpO1xuICAgICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDMwMDApO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1t2Ml0gRXJyb3IgY2hlY2tpbmcvbGlua2luZyBBUEkgS2V5OicsIGUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEeW5hbWljYWxseSBzZWxlY3RzIHRoZSByZXF1ZXN0ZWQgbW9kZWwgZnJvbSB0aGUgVUkuXG4gICAqIElmIHRoZSBleGFjdCBtb2RlbCBpcyBub3QgZm91bmQsIHRyaWVzIHRvIGZpbmQgYSBjbG9zZSBtYXRjaCBvciBsb2dzIGF2YWlsYWJsZSBtb2RlbHMuXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHNlbGVjdEJlc3RNb2RlbChwYWdlOiBQYWdlLCB0YXJnZXRNb2RlbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coYFt2Ml0g8J+UjSBBdHRlbXB0aW5nIHRvIHNlbGVjdCBtb2RlbDogJHt0YXJnZXRNb2RlbH1gKTtcbiAgICB0cnkge1xuICAgICAgLy8gMS4gRmluZCBhbGwgcG90ZW50aWFsIGRyb3Bkb3duIHRyaWdnZXJzXG4gICAgICBjb25zdCBjYW5kaWRhdGVzID0gcGFnZS5sb2NhdG9yKCdidXR0b24sIG1zLXNlbGVjdCwgbWF0LXNlbGVjdCcpO1xuICAgICAgY29uc3QgY291bnQgPSBhd2FpdCBjYW5kaWRhdGVzLmNvdW50KCk7XG4gICAgICBsZXQgbW9kZWxTZWxlY3RvcjogYW55ID0gbnVsbDtcbiAgICAgIGNvbnNvbGUubG9nKGBbdjJdIERFQlVHOiBGb3VuZCAke2NvdW50fSBjYW5kaWRhdGVzLmApO1xuICAgICAgbGV0IGJlc3RNYXRjaDogYW55ID0gbnVsbDtcbiAgICAgIGxldCBkZWZhdWx0TWF0Y2g6IGFueSA9IG51bGw7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICBjb25zdCBlbCA9IGNhbmRpZGF0ZXMubnRoKGkpO1xuICAgICAgICBjb25zdCBpc1Zpc2libGUgPSBhd2FpdCBlbC5pc1Zpc2libGUoKTtcbiAgICAgICAgaWYgKCFpc1Zpc2libGUpIGNvbnRpbnVlO1xuXG4gICAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCBlbC5pbm5lclRleHQoKTtcbiAgICAgICAgY29uc3QgbGFiZWwgPSAoYXdhaXQgZWwuZ2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJykpIHx8ICcnO1xuICAgICAgICBjb25zdCBjbHMgPSAoYXdhaXQgZWwuZ2V0QXR0cmlidXRlKCdjbGFzcycpKSB8fCAnJztcblxuICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICBgW3YyXSBDYW5kaWRhdGUgIyR7aX06IFRleHQ9XCIke3RleHQucmVwbGFjZSgvXFxuL2csICdcXFxcbicpfVwiLCBMYWJlbD1cIiR7bGFiZWx9XCIsIENsYXNzPVwiJHtjbHN9XCJgXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gSGV1cmlzdGljcyB0byBpZGVudGlmeSB0aGUgbW9kZWwgc2VsZWN0b3I6XG4gICAgICAgIC8vIC0gVGV4dCBjb250YWlucyBcIkdlbWluaVwiXG4gICAgICAgIC8vIC0gbGFiZWwgY29udGFpbnMgXCJtb2RlbFwiIChjYXNlLWluc2Vuc2l0aXZlKVxuICAgICAgICAvLyAtIGNsYXNzIGNvbnRhaW5zIFwibW9kZWwtc2VsZWN0b3JcIlxuICAgICAgICAvLyAtIEVYQ0xVREUgZmlsdGVyIGNoaXBzXG4gICAgICAgIGlmIChcbiAgICAgICAgICAodGV4dC5pbmNsdWRlcygnR2VtaW5pJykgfHxcbiAgICAgICAgICAgIGxhYmVsLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ21vZGVsJykgfHxcbiAgICAgICAgICAgIGNscy5pbmNsdWRlcygnbW9kZWwtc2VsZWN0b3InKSkgJiZcbiAgICAgICAgICAhY2xzLmluY2x1ZGVzKCdmaWx0ZXItY2hpcCcpXG4gICAgICAgICkge1xuICAgICAgICAgIC8vIEV4Y2x1ZGUgY29tbW9ubHkgY29uZnVzZWQgdGhpbmdzIGlmIGNoZWNrcyBhcmUgd2Vha1xuICAgICAgICAgIGlmIChsYWJlbC50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdzZXR0aW5nJykpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgLy8gQ3JpdGljYWw6IElmIHdlIHdhbnQgRmxhc2gsIERPIE5PVCBhY2NlcHQgUHJvIGNhcmRcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICB0YXJnZXRNb2RlbC5pbmNsdWRlcygnZmxhc2gnKSAmJlxuICAgICAgICAgICAgdGV4dC50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdwcm8nKSAmJlxuICAgICAgICAgICAgIXRleHQudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnZmxhc2gnKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFt2Ml0gSWdub3JpbmcgUHJvIGNhbmRpZGF0ZSAjJHtpfSBiZWNhdXNlIHdlIHdhbnQgRmxhc2hgKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFByaW9yaXRpemUgZXhhY3QgbWF0Y2ggKGUuZy4gRmxhc2gpXG4gICAgICAgICAgaWYgKHRhcmdldE1vZGVsLmluY2x1ZGVzKCdmbGFzaCcpICYmIHRleHQudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnZmxhc2gnKSkge1xuICAgICAgICAgICAgYmVzdE1hdGNoID0gZWw7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW3YyXSBGbGFzaCBNQVRDSCBGT1VORCBhdCAjJHtpfWApO1xuICAgICAgICAgICAgYnJlYWs7IC8vIEZvdW5kIHRoZSBiZXN0IG9uZVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICB0YXJnZXRNb2RlbC5pbmNsdWRlcygncHJvJykgJiZcbiAgICAgICAgICAgIHRleHQudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygncHJvJykgJiZcbiAgICAgICAgICAgICF0YXJnZXRNb2RlbC5pbmNsdWRlcygnZmxhc2gnKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgYmVzdE1hdGNoID0gZWw7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW3YyXSBQcm8gTUFUQ0ggRk9VTkQgYXQgIyR7aX1gKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEtlZXAgZ2VuZXJpYyBtYXRjaFxuICAgICAgICAgIGlmICghZGVmYXVsdE1hdGNoKSB7XG4gICAgICAgICAgICBkZWZhdWx0TWF0Y2ggPSBlbDtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIEdlbmVyaWMgTUFUQ0ggRk9VTkQgYXQgIyR7aX0gKGtlZXBpbmcgYXMgYmFja3VwKWApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbW9kZWxTZWxlY3RvciA9IGJlc3RNYXRjaCB8fCBkZWZhdWx0TWF0Y2g7XG4gICAgICBpZiAobW9kZWxTZWxlY3RvcilcbiAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgYFt2Ml0gU2VsZWN0ZWQgY2FuZGlkYXRlOiAke21vZGVsU2VsZWN0b3IgPT09IGJlc3RNYXRjaCA/ICdCZXN0IE1hdGNoJyA6ICdEZWZhdWx0IE1hdGNoJ31gXG4gICAgICAgICk7XG5cbiAgICAgIC8vIEZBTExCQUNLOiBJZiBvbiBkYXNoYm9hcmQsIGNsaWNrIFwiTmV3IGNoYXRcIlxuICAgICAgaWYgKCFtb2RlbFNlbGVjdG9yKSB7XG4gICAgICAgIGNvbnN0IG5ld0NoYXRCdG4gPSBwYWdlLmxvY2F0b3IoJ2J1dHRvblthcmlhLWxhYmVsPVwiTmV3IGNoYXRcIl0nKS5maXJzdCgpO1xuICAgICAgICBpZiAoYXdhaXQgbmV3Q2hhdEJ0bi5pc1Zpc2libGUoKSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIE1vZGVsIHNlbGVjdG9yIG5vdCBmb3VuZC4gQ2xpY2tpbmcgXCJOZXcgY2hhdFwiIHRvIGVudGVyIGVkaXRvci4uLicpO1xuICAgICAgICAgIGF3YWl0IG5ld0NoYXRCdG4uY2xpY2soKTtcbiAgICAgICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDMwMDApO1xuXG4gICAgICAgICAgLy8gUmV0cnkgZmluZGluZyBzZWxlY3RvciBPTkUgdGltZSAoc2ltcGxlIHJlY3Vyc2lvbiB3aXRoIGZsYWcgY291bGQgd29yaywgYnV0IGhlcmUgSSdsbCBqdXN0IGNvcHkgbG9naWMgb3IgcmVseSBvbiBuZXh0IHN0ZXBzKVxuICAgICAgICAgIC8vIEJldHRlcjogUmV0dXJuIGFuZCBsZXQgY2FsbGVyIGhhbmRsZT8gTm8uXG4gICAgICAgICAgLy8gTGV0J3MganVzdCB0cnkgdG8gZmluZCBpdCBhZ2Fpbi5cbiAgICAgICAgICBjb25zdCByZXRyeUNhbmRpZGF0ZXMgPSBwYWdlLmxvY2F0b3IoJ2J1dHRvbiwgbXMtc2VsZWN0LCBtYXQtc2VsZWN0Jyk7XG4gICAgICAgICAgY29uc3QgcmV0cnlDb3VudCA9IGF3YWl0IHJldHJ5Q2FuZGlkYXRlcy5jb3VudCgpO1xuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmV0cnlDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBlbCA9IHJldHJ5Q2FuZGlkYXRlcy5udGgoaSk7XG4gICAgICAgICAgICBpZiAoIShhd2FpdCBlbC5pc1Zpc2libGUoKSkpIGNvbnRpbnVlO1xuICAgICAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IGVsLmlubmVyVGV4dCgpO1xuICAgICAgICAgICAgY29uc3QgbGFiZWwgPSAoYXdhaXQgZWwuZ2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJykpIHx8ICcnO1xuICAgICAgICAgICAgY29uc3QgY2xzID0gKGF3YWl0IGVsLmdldEF0dHJpYnV0ZSgnY2xhc3MnKSkgfHwgJyc7XG5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgKHRleHQuaW5jbHVkZXMoJ0dlbWluaScpIHx8XG4gICAgICAgICAgICAgICAgbGFiZWwudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnbW9kZWwnKSB8fFxuICAgICAgICAgICAgICAgIGNscy5pbmNsdWRlcygnbW9kZWwtc2VsZWN0b3InKSkgJiZcbiAgICAgICAgICAgICAgIWNscy5pbmNsdWRlcygnZmlsdGVyLWNoaXAnKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGlmICghbGFiZWwudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnc2V0dGluZycpKSB7XG4gICAgICAgICAgICAgICAgbW9kZWxTZWxlY3RvciA9IGVsO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIE1BVENIIEZPVU5EIG9uIHJldHJ5IWApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChtb2RlbFNlbGVjdG9yKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRNb2RlbCA9IGF3YWl0IG1vZGVsU2VsZWN0b3IuaW5uZXJUZXh0KCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIEN1cnJlbnQgbW9kZWwgc2VsZWN0ZWQ6ICR7Y3VycmVudE1vZGVsfWApO1xuXG4gICAgICAgIC8vIElmIHdlIGFyZSBhbHJlYWR5IG9uIHRoZSB0YXJnZXQgKGZ1enp5IG1hdGNoKSwgc2tpcFxuICAgICAgICBpZiAodGFyZ2V0TW9kZWwuaW5jbHVkZXMoJ2ZsYXNoJykgJiYgY3VycmVudE1vZGVsLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2ZsYXNoJykpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnW3YyXSDinIUgXCJGbGFzaFwiIG1vZGVsIGFscmVhZHkgYWN0aXZlLicpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IG1vZGVsU2VsZWN0b3IuY2xpY2soKTtcbiAgICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgxMDAwKTtcblxuICAgICAgICAvLyAyLiBTY3JhcGUgYXZhaWxhYmxlIG1vZGVsc1xuICAgICAgICAvLyBUcnkgbXVsdGlwbGUgc2VsZWN0b3JzIGZvciBvcHRpb25zIGxpc3RcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHBhZ2UubG9jYXRvcignbWF0LW9wdGlvbiwgW3JvbGU9XCJvcHRpb25cIl0sIC5tb2RlbC1vcHRpb24nKTtcbiAgICAgICAgY29uc3Qgb3B0Q291bnQgPSBhd2FpdCBvcHRpb25zLmNvdW50KCk7XG4gICAgICAgIGNvbnN0IGF2YWlsYWJsZU1vZGVsczogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICAvLyBVc2UgYSBTZXQgdG8gYXZvaWQgZHVwbGljYXRlcyBpZiBzZWxlY3RvcnMgb3ZlcmxhcFxuICAgICAgICBjb25zdCBtb2RlbFNldCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb3B0Q291bnQ7IGkrKykge1xuICAgICAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCBvcHRpb25zLm50aChpKS5pbm5lclRleHQoKTtcbiAgICAgICAgICAvLyBDbGVhbiB1cCB0ZXh0IChyZW1vdmUgbmV3bGluZXMvZGVzY3JpcHRpb25zKVxuICAgICAgICAgIGNvbnN0IGNsZWFuVGV4dCA9IHRleHQuc3BsaXQoJ1xcbicpWzBdLnRyaW0oKTtcbiAgICAgICAgICBhdmFpbGFibGVNb2RlbHMucHVzaChjbGVhblRleHQpO1xuICAgICAgICAgIG1vZGVsU2V0LmFkZChjbGVhblRleHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coYFt2Ml0g8J+TiyBBdmFpbGFibGUgTW9kZWxzOiAke0FycmF5LmZyb20obW9kZWxTZXQpLmpvaW4oJywgJyl9YCk7XG5cbiAgICAgICAgLy8gMy4gU2VsZWN0IGJlc3QgbWF0Y2hcbiAgICAgICAgbGV0IGJlc3RNYXRjaEluZGV4ID0gLTE7XG5cbiAgICAgICAgLy8gRXhhY3QtaXNoIG1hdGNoXG4gICAgICAgIGJlc3RNYXRjaEluZGV4ID0gYXZhaWxhYmxlTW9kZWxzLmZpbmRJbmRleCgobSkgPT5cbiAgICAgICAgICBtLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXModGFyZ2V0TW9kZWwudG9Mb3dlckNhc2UoKSlcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoYmVzdE1hdGNoSW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgLy8gRmFsbGJhY2sgZm9yIGtub3duIGFsaWFzZXNcbiAgICAgICAgICBpZiAodGFyZ2V0TW9kZWwuaW5jbHVkZXMoJ2ZsYXNoJykpIHtcbiAgICAgICAgICAgIGJlc3RNYXRjaEluZGV4ID0gYXZhaWxhYmxlTW9kZWxzLmZpbmRJbmRleChcbiAgICAgICAgICAgICAgKG0pID0+IG0udG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnZmxhc2gnKSAmJiAhbS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdsZWdhY3knKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHRhcmdldE1vZGVsLmluY2x1ZGVzKCdwcm8nKSkge1xuICAgICAgICAgICAgYmVzdE1hdGNoSW5kZXggPSBhdmFpbGFibGVNb2RlbHMuZmluZEluZGV4KFxuICAgICAgICAgICAgICAobSkgPT4gbS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdwcm8nKSAmJiAhbS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCd2aXNpb24nKVxuICAgICAgICAgICAgKTsgLy8gJ3Zpc2lvbicgaXMgb2Z0ZW4gb2xkZXJcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYmVzdE1hdGNoSW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYFt2Ml0g8J+RiSBTZWxlY3Rpbmc6ICR7YXZhaWxhYmxlTW9kZWxzW2Jlc3RNYXRjaEluZGV4XX1gKTtcbiAgICAgICAgICBhd2FpdCBvcHRpb25zLm50aChiZXN0TWF0Y2hJbmRleCkuY2xpY2soKTtcbiAgICAgICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDIwMDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgIGBbdjJdIOKaoO+4jyBDb3VsZCBub3QgZmluZCB0YXJnZXQgbW9kZWwgJHt0YXJnZXRNb2RlbH0uIEtlZXBpbmcgY3VycmVudCBzZWxlY3Rpb24uYFxuICAgICAgICAgICk7XG4gICAgICAgICAgYXdhaXQgcGFnZS5rZXlib2FyZC5wcmVzcygnRXNjYXBlJyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICdbdjJdIOKaoO+4jyBNb2RlbCBzZWxlY3RvciBub3QgZm91bmQgKGNoZWNrZWQgYWxsIGJ1dHRvbnMpLiBhc3N1bWluZyBzdHJpY3QgVVJMIHBhcmFtIHdvcmtlZC4nXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBwYWdlLmNvbnRlbnQoKTtcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYygnYWlfc3R1ZGlvX2R1bXAuaHRtbCcsIGNvbnRlbnQpO1xuICAgICAgICBjb25zb2xlLmxvZygnW3YyXSBEdW1wZWQgQUkgU3R1ZGlvIEhUTUwgdG8gYWlfc3R1ZGlvX2R1bXAuaHRtbCcpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1t2Ml0g4pqg77iPIEVycm9yIHNlbGVjdGluZyBtb2RlbDonLCBlKTtcbiAgICB9XG4gIH1cblxuICAvLyAtLS0gRklYRUQgUEFSU0lORyBNRVRIT0QgLS0tXG4gIGFzeW5jIGFuYWx5emVXaXRoQUkodmlkZW86IFZpZGVvRW50cnkpOiBQcm9taXNlPEFuYWx5c2lzUmVzdWx0IHwgbnVsbD4ge1xuICAgIGlmICghdGhpcy5jb250ZXh0IHx8ICF2aWRlby50cmFuc2NyaXB0KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhgW3YyXSDwn6SWIEFJIEFuYWx5c2lzOiAke3ZpZGVvLnRpdGxlfWApO1xuXG4gICAgbGV0IHBhZ2U6IFBhZ2UgfCBudWxsID0gbnVsbDtcblxuICAgIHRyeSB7XG4gICAgICAvLyBGUkVTSCBwYWdlIGZvciBBSSBTdHVkaW8gLSBDaGVjayBjb250ZXh0IGhlYWx0aCBmaXJzdFxuICAgICAgdHJ5IHtcbiAgICAgICAgcGFnZSA9IGF3YWl0IHRoaXMuY29udGV4dC5uZXdQYWdlKCk7XG4gICAgICB9IGNhdGNoIChjb250ZXh0RXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignW3YyXSDinYwgQnJvd3NlciBjb250ZXh0IGlzIGRlYWQsIGNhbm5vdCBjcmVhdGUgcGFnZTonLCBjb250ZXh0RXJyb3IpO1xuICAgICAgICAvLyBUcnkgdG8gcmVpbml0aWFsaXplXG4gICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIEF0dGVtcHRpbmcgdG8gcmVzdGFydCBicm93c2VyLi4uJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0Py5jbG9zZSgpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgLyogaWdub3JlICovXG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5pbml0aWFsaXplKCk7XG4gICAgICAgIHBhZ2UgPSBhd2FpdCB0aGlzLmNvbnRleHQhLm5ld1BhZ2UoKTtcbiAgICAgIH1cbiAgICAgIC8vIENvbWJpbmUgdHJhbnNjcmlwdFxuICAgICAgY29uc3QgZnVsbFRyYW5zY3JpcHQgPSB2aWRlby50cmFuc2NyaXB0Lm1hcCgocykgPT4gcy50ZXh0KS5qb2luKCcgJyk7XG4gICAgICBjb25zdCB0cnVuY2F0ZWRUcmFuc2NyaXB0ID0gZnVsbFRyYW5zY3JpcHQuc3Vic3RyaW5nKDAsIDI1MDAwKTsgLy8gU3RheSB3aXRoaW4gbGltaXRzXG5cbiAgICAgIC8vIE5hdmlnYXRlIHRvIEFJIFN0dWRpbyB3aXRoIGxhdGVzdCBtb2RlbFxuICAgICAgYXdhaXQgcGFnZS5nb3RvKEFJX1NUVURJT19VUkwsIHsgd2FpdFVudGlsOiAnZG9tY29udGVudGxvYWRlZCcsIHRpbWVvdXQ6IDYwMDAwIH0pO1xuICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCg1MDAwKTtcblxuICAgICAgLy8gRGlzbWlzcyBhbnkgZGlhbG9nc1xuICAgICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBbXG4gICAgICAgICdidXR0b246aGFzLXRleHQoXCJHb3QgaXRcIiknLFxuICAgICAgICAnYnV0dG9uOmhhcy10ZXh0KFwiQ29udGludWVcIiknLFxuICAgICAgICAnW2FyaWEtbGFiZWw9XCJDbG9zZVwiXScsXG4gICAgICBdKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgZWwgPSBwYWdlLmxvY2F0b3Ioc2VsZWN0b3IpO1xuICAgICAgICAgIGlmICgoYXdhaXQgZWwuY291bnQoKSkgPiAwICYmIChhd2FpdCBlbC5maXJzdCgpLmlzVmlzaWJsZSgpKSkge1xuICAgICAgICAgICAgYXdhaXQgZWwuZmlyc3QoKS5jbGljayh7IGZvcmNlOiB0cnVlIH0pO1xuICAgICAgICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCg1MDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIC8qIGlnbm9yZSAqL1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBhd2FpdCBwYWdlLmtleWJvYXJkLnByZXNzKCdFc2NhcGUnKTtcbiAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoNTAwKTtcblxuICAgICAgLy8gU2tpcCBBUEkgS2V5IGNoZWNrIC0gdXNlIGJyb3dzZXIgc2Vzc2lvbiBkaXJlY3RseVxuICAgICAgLy8gYXdhaXQgdGhpcy5lbnN1cmVQYWlkQXBpS2V5KHBhZ2UpO1xuICAgICAgY29uc29sZS5sb2coJ1t2Ml0g8J+SsyBVc2luZyBicm93c2VyIHNlc3Npb24gKHNraXBwaW5nIEFQSSBrZXkgY2hlY2spJyk7XG5cbiAgICAgIC8vIEVuc3VyZSBjb3JyZWN0IG1vZGVsIGlzIHNlbGVjdGVkXG4gICAgICBhd2FpdCB0aGlzLnNlbGVjdEJlc3RNb2RlbChwYWdlLCBHRU1JTklfTU9ERUwpO1xuXG4gICAgICAvLyBFbnRlciBwcm9tcHRcbiAgICAgIGNvbnN0IHRleHRhcmVhID0gcGFnZS5sb2NhdG9yKCd0ZXh0YXJlYVthcmlhLWxhYmVsPVwiRW50ZXIgYSBwcm9tcHRcIl0nKTtcbiAgICAgIGF3YWl0IHRleHRhcmVhLndhaXRGb3IoeyBzdGF0ZTogJ3Zpc2libGUnLCB0aW1lb3V0OiAxNTAwMCB9KTtcbiAgICAgIGF3YWl0IHRleHRhcmVhLmNsaWNrKHsgZm9yY2U6IHRydWUgfSk7XG5cbiAgICAgIGNvbnN0IGZ1bGxQcm9tcHQgPSBBTkFMWVNJU19QUk9NUFQgKyB0cnVuY2F0ZWRUcmFuc2NyaXB0O1xuICAgICAgYXdhaXQgdGV4dGFyZWEuZmlsbChmdWxsUHJvbXB0KTtcbiAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMTAwMCk7XG5cbiAgICAgIC8vIENsaWNrIFJ1blxuICAgICAgY29uc3QgcnVuQnRuID0gcGFnZS5sb2NhdG9yKCdidXR0b25bYXJpYS1sYWJlbD1cIlJ1blwiXScpO1xuICAgICAgYXdhaXQgcnVuQnRuLmNsaWNrKCk7XG5cbiAgICAgIGNvbnNvbGUubG9nKCdbdjJdIFdhaXRpbmcgZm9yIEFJIHJlc3BvbnNlLi4uJyk7XG5cbiAgICAgIC8vIFdhaXQgZm9yIHJlc3BvbnNlIHdpdGggYmV0dGVyIGV4dHJhY3Rpb25cbiAgICAgIGNvbnN0IHN0YXJ0V2FpdCA9IERhdGUubm93KCk7XG4gICAgICBjb25zdCB0aW1lb3V0ID0gMiAqIDYwICogMTAwMDsgLy8gMiBtaW51dGVzXG5cbiAgICAgIC8vIEluaXRpYWwgbG9uZ2VyIHdhaXQgZm9yIGZpcnN0IHJlcXVlc3QgYWZ0ZXIgQVBJIGtleSBzZXR1cFxuICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCg1MDAwKTtcblxuICAgICAgd2hpbGUgKERhdGUubm93KCkgLSBzdGFydFdhaXQgPCB0aW1lb3V0KSB7XG4gICAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMzAwMCk7XG5cbiAgICAgICAgLy8gQ2hlY2sgZm9yIGVycm9yIG1lc3NhZ2VzIChQZXJtaXNzaW9uIGRlbmllZCwgZXRjLilcbiAgICAgICAgY29uc3QgZXJyb3JUb2FzdCA9IHBhZ2VcbiAgICAgICAgICAubG9jYXRvcignbWF0LXNuYWNrLWJhci1jb250YWluZXInKVxuICAgICAgICAgIC5vcihwYWdlLmxvY2F0b3IoJy5lcnJvci1tZXNzYWdlJykpXG4gICAgICAgICAgLm9yKHBhZ2UuZ2V0QnlUZXh0KCdQZXJtaXNzaW9uIGRlbmllZCcpKVxuICAgICAgICAgIC5vcihwYWdlLmdldEJ5VGV4dCgnRmFpbGVkIHRvIGdlbmVyYXRlJykpO1xuXG4gICAgICAgIGlmICgoYXdhaXQgZXJyb3JUb2FzdC5jb3VudCgpKSA+IDAgJiYgKGF3YWl0IGVycm9yVG9hc3QuZmlyc3QoKS5pc1Zpc2libGUoKSkpIHtcbiAgICAgICAgICBjb25zdCBlcnJvclRleHQgPSBhd2FpdCBlcnJvclRvYXN0LmZpcnN0KCkuaW5uZXJUZXh0KCk7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgW3YyXSDinYwgQUkgU3R1ZGlvIEVycm9yIGRldGVjdGVkOiAke2Vycm9yVGV4dH1gKTtcbiAgICAgICAgICBpZiAoZXJyb3JUZXh0LnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ3Blcm1pc3Npb24gZGVuaWVkJykpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICAgIGBbdjJdIPCfm5EgRkFUQUwgRVJST1I6IEFjY291bnQgcGVybWlzc2lvbnMgaXNzdWUuIFN0b3BwaW5nIGVudGlyZSBwcm9jZXNzLmBcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICAvLyBXZSBuZWVkIHRvIGV4aXQgdGhlIGVudGlyZSBwcm9jZXNzIHNvIHRoZSB1c2VyIGNhbiBmaXggdGhlIGFjY291bnRcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBSSBTdHVkaW8gRXJyb3I6ICR7ZXJyb3JUZXh0fWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgZm9yIGNvbXBsZXRpb24gYnkgbG9va2luZyBmb3IgdGhlIHJlc3BvbnNlIGNvbnRhaW5lclxuICAgICAgICBjb25zdCByZXNwb25zZUNvbnRhaW5lciA9IHBhZ2UubG9jYXRvcihcbiAgICAgICAgICAnbXMtY2hhdC10dXJuLm1vZGVsIC50dXJuLWNvbnRlbnQsIC5jaGF0LXR1cm4tY29udGFpbmVyLm1vZGVsIC50dXJuLWNvbnRlbnQnXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKChhd2FpdCByZXNwb25zZUNvbnRhaW5lci5jb3VudCgpKSA+IDApIHtcbiAgICAgICAgICAvLyBHZXQgdGhlIGlubmVyIHRleHQgZGlyZWN0bHksIG5vdCBpbmNsdWRpbmcgVUkgZWxlbWVudHNcbiAgICAgICAgICBjb25zdCByYXdUZXh0ID0gYXdhaXQgcGFnZS5ldmFsdWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAvLyBGaW5kIHRoZSBhY3R1YWwgcmVzcG9uc2UgdGV4dCwgZXhjbHVkaW5nIHRvb2xiYXIgYnV0dG9uc1xuICAgICAgICAgICAgY29uc3QgY29udGFpbmVycyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXG4gICAgICAgICAgICAgICdtcy1jaGF0LXR1cm4ubW9kZWwgLnR1cm4tY29udGVudCwgLmNoYXQtdHVybi1jb250YWluZXIubW9kZWwgLnR1cm4tY29udGVudCdcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZiAoY29udGFpbmVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGxhc3RDb250YWluZXIgPSBjb250YWluZXJzW2NvbnRhaW5lcnMubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgICAgIC8vIEdldCB0ZXh0IGZyb20gbWFya2Rvd24gY29udGVudCBpZiBhdmFpbGFibGVcbiAgICAgICAgICAgIGNvbnN0IG1hcmtkb3duID0gbGFzdENvbnRhaW5lci5xdWVyeVNlbGVjdG9yKFxuICAgICAgICAgICAgICAnLm1hcmtkb3duLWJvZHksIC5tYXJrZG93bi1jb250ZW50LCAucmVuZGVyZWQtbWFya2Rvd24nXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbGV0IGNvbnRlbnQgPSBtYXJrZG93biA/IG1hcmtkb3duLnRleHRDb250ZW50IHx8ICcnIDogbGFzdENvbnRhaW5lci50ZXh0Q29udGVudCB8fCAnJztcblxuICAgICAgICAgICAgLy8gQ0xFQU5JTkc6IFJlbW92ZSBcIk1vZGVsIFRoaW5raW5nXCIgYmxvY2tzIHdoaWNoIGNsdXR0ZXIgdGhlIG91dHB1dFxuICAgICAgICAgICAgLy8gR2VtaW5pIEZsYXNoIHNvbWV0aW1lcyBvdXRwdXRzIFwiTW9kZWwgVGhpbmtpbmcuLi5cIiBmb2xsb3dlZCBieSB0aG91Z2h0c1xuICAgICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShcbiAgICAgICAgICAgICAgL01vZGVsIFRoaW5raW5nW1xcc1xcU10qPyg/OkV4cGFuZCB0byB2aWV3IG1vZGVsIHRob3VnaHRzfGNoZXZyb25fcmlnaHQpL2csXG4gICAgICAgICAgICAgICcnXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgvTW9kZWwgVGhpbmtpbmdbXFxzXFxTXSo/anNvbi9pLCAnJyk7XG5cbiAgICAgICAgICAgIC8vIFJlbW92ZSBjb21tb24gVUkgdGV4dCBwYXR0ZXJuc1xuICAgICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShcbiAgICAgICAgICAgICAgL21vcmVfdmVydHxjb250ZW50X2NvcHl8ZG93bmxvYWR8ZXhwYW5kX2xlc3N8ZXhwYW5kX21vcmV8TW9kZWwgY29kZSBKU09OL2csXG4gICAgICAgICAgICAgICcnXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gY29udGVudC50cmltKCk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBpZiAocmF3VGV4dCAmJiByYXdUZXh0Lmxlbmd0aCA+IDUwKSB7XG4gICAgICAgICAgICAvLyBUcnkgdG8gZXh0cmFjdCBKU09OIGZyb20gdGhlIHJlc3BvbnNlXG4gICAgICAgICAgICBjb25zdCBqc29uUGF0dGVybnMgPSBbXG4gICAgICAgICAgICAgIC9gYGBqc29uXFxzKihcXHtbXFxzXFxTXSo/XFx9KVxccypgYGAvLCAvLyBTdGFuZGFyZCBtYXJrZG93biBqc29uIGJsb2NrXG4gICAgICAgICAgICAgIC9gYGBcXHMqKFxce1tcXHNcXFNdKj9cXH0pXFxzKmBgYC8sIC8vIEdlbmVyaWMgbWFya2Rvd24gYmxvY2tcbiAgICAgICAgICAgICAgL14oXFx7W1xcc1xcU10qXFx9KSQvLCAvLyBKdXN0IEpTT05cbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIGxldCBhbmFseXNpczogQW5hbHlzaXNSZXN1bHQgfCBudWxsID0gbnVsbDtcblxuICAgICAgICAgICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIGpzb25QYXR0ZXJucykge1xuICAgICAgICAgICAgICBjb25zdCBtYXRjaCA9IHJhd1RleHQubWF0Y2gocGF0dGVybik7XG4gICAgICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBqc29uU3RyID0gbWF0Y2hbMV07XG4gICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGpzb25TdHIpO1xuICAgICAgICAgICAgICAgICAgYW5hbHlzaXMgPSB7XG4gICAgICAgICAgICAgICAgICAgIGtleVBvaW50czogcGFyc2VkLmtleVBvaW50cyB8fCBbXSxcbiAgICAgICAgICAgICAgICAgICAgYWlDb25jZXB0czogcGFyc2VkLmFpQ29uY2VwdHMgfHwgW10sXG4gICAgICAgICAgICAgICAgICAgIHRlY2huaWNhbERldGFpbHM6IHBhcnNlZC50ZWNobmljYWxEZXRhaWxzIHx8IFtdLFxuICAgICAgICAgICAgICAgICAgICB2aXN1YWxDb250ZXh0RmxhZ3M6IHBhcnNlZC52aXN1YWxDb250ZXh0RmxhZ3MgfHwgW10sXG4gICAgICAgICAgICAgICAgICAgIHN1bW1hcnk6IHBhcnNlZC5zdW1tYXJ5IHx8ICcnLFxuICAgICAgICAgICAgICAgICAgICBxdWFsaXR5U2NvcmU6IHRoaXMuY2FsY3VsYXRlUXVhbGl0eVNjb3JlKHBhcnNlZCksXG4gICAgICAgICAgICAgICAgICAgIHJhd1Jlc3BvbnNlOiByYXdUZXh0LnN1YnN0cmluZygwLCAxMDAwKSxcbiAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAvKiB0cnkgbmV4dCBwYXR0ZXJuICovXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEpTT04gUGFyc2UgRmFsbGJhY2s6IFRyeSB0byBmaW5kIHN1YnN0cmluZyBiZXR3ZWVuIGZpcnN0IHsgYW5kIGxhc3QgfVxuICAgICAgICAgICAgaWYgKCFhbmFseXNpcyAmJiByYXdUZXh0LmluY2x1ZGVzKCd7JykgJiYgcmF3VGV4dC5pbmNsdWRlcygnfScpKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSByYXdUZXh0LmluZGV4T2YoJ3snKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbmQgPSByYXdUZXh0Lmxhc3RJbmRleE9mKCd9JykgKyAxO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBvdGVudGlhbEpzb24gPSByYXdUZXh0LnN1YnN0cmluZyhzdGFydCwgZW5kKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKHBvdGVudGlhbEpzb24pO1xuICAgICAgICAgICAgICAgIGFuYWx5c2lzID0ge1xuICAgICAgICAgICAgICAgICAga2V5UG9pbnRzOiBwYXJzZWQua2V5UG9pbnRzIHx8IFtdLFxuICAgICAgICAgICAgICAgICAgYWlDb25jZXB0czogcGFyc2VkLmFpQ29uY2VwdHMgfHwgW10sXG4gICAgICAgICAgICAgICAgICB0ZWNobmljYWxEZXRhaWxzOiBwYXJzZWQudGVjaG5pY2FsRGV0YWlscyB8fCBbXSxcbiAgICAgICAgICAgICAgICAgIHZpc3VhbENvbnRleHRGbGFnczogcGFyc2VkLnZpc3VhbENvbnRleHRGbGFncyB8fCBbXSxcbiAgICAgICAgICAgICAgICAgIHN1bW1hcnk6IHBhcnNlZC5zdW1tYXJ5IHx8ICcnLFxuICAgICAgICAgICAgICAgICAgcXVhbGl0eVNjb3JlOiB0aGlzLmNhbGN1bGF0ZVF1YWxpdHlTY29yZShwYXJzZWQpLFxuICAgICAgICAgICAgICAgICAgcmF3UmVzcG9uc2U6IHJhd1RleHQuc3Vic3RyaW5nKDAsIDEwMDApLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAvKiBpZ25vcmUgKi9cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUZXh0IEZhbGxiYWNrOiBDcmVhdGUgc3RydWN0dXJlZCBhbmFseXNpcyBmcm9tIHRleHQgaWYgSlNPTiBmYWlsc1xuICAgICAgICAgICAgaWYgKCFhbmFseXNpcykge1xuICAgICAgICAgICAgICBhbmFseXNpcyA9IHtcbiAgICAgICAgICAgICAgICBrZXlQb2ludHM6IHRoaXMuZXh0cmFjdEJ1bGxldFBvaW50cyhyYXdUZXh0KSxcbiAgICAgICAgICAgICAgICBhaUNvbmNlcHRzOiB0aGlzLmV4dHJhY3RBSUNvbmNlcHRzKHJhd1RleHQpLFxuICAgICAgICAgICAgICAgIHRlY2huaWNhbERldGFpbHM6IFtdLFxuICAgICAgICAgICAgICAgIHZpc3VhbENvbnRleHRGbGFnczogW10sXG4gICAgICAgICAgICAgICAgc3VtbWFyeTogcmF3VGV4dC5zdWJzdHJpbmcoMCwgMzAwKS5yZXBsYWNlKC9cXG4vZywgJyAnKSxcbiAgICAgICAgICAgICAgICBxdWFsaXR5U2NvcmU6IDUwLCAvLyBNZWRpdW0gcXVhbGl0eSBmb3IgZmFsbGJhY2tcbiAgICAgICAgICAgICAgICByYXdSZXNwb25zZTogcmF3VGV4dC5zdWJzdHJpbmcoMCwgMTAwMCksXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIOKchSBBbmFseXNpcyBjb21wbGV0ZSAocXVhbGl0eTogJHthbmFseXNpcy5xdWFsaXR5U2NvcmV9JSlgKTtcbiAgICAgICAgICAgIHJldHVybiBhbmFseXNpcztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBmb3IgZXJyb3JzXG4gICAgICAgIGNvbnN0IGVycm9yVGV4dCA9IGF3YWl0IHBhZ2UuZXZhbHVhdGUoKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5ib2R5LmlubmVyVGV4dDtcbiAgICAgICAgICBpZiAoYm9keS5pbmNsdWRlcygnSW50ZXJuYWwgZXJyb3InKSB8fCBib2R5LmluY2x1ZGVzKCdTb21ldGhpbmcgd2VudCB3cm9uZycpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2Vycm9yJztcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChlcnJvclRleHQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FJIFN0dWRpbyByZXR1cm5lZCBhbiBlcnJvcicpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnNvbGUubG9nKCdbdjJdIOKaoO+4jyBBbmFseXNpcyB0aW1lb3V0Jyk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbdjJdIEFuYWx5c2lzIGVycm9yOicsIGUpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIC8vIEdVQVJBTlRFRUQgQ0xFQU5VUCAtIEFsd2F5cyBjbG9zZSBwYWdlLCBldmVuIGlmIGVycm9ycyBvY2N1clxuICAgICAgaWYgKHBhZ2UpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCBwYWdlLmNsb3NlKCk7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1t2Ml0g8J+nuSBQYWdlIGNsZWFuZWQgdXAnKTtcbiAgICAgICAgfSBjYXRjaCAoY2xlYW51cEVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKCdbdjJdIOKaoO+4jyBGYWlsZWQgdG8gY2xvc2UgcGFnZSBkdXJpbmcgY2xlYW51cDonLCBjbGVhbnVwRXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVRdWFsaXR5U2NvcmUocGFyc2VkOiBhbnkpOiBudW1iZXIge1xuICAgIGxldCBzY29yZSA9IDA7XG4gICAgaWYgKHBhcnNlZC5zdW1tYXJ5ICYmIHBhcnNlZC5zdW1tYXJ5Lmxlbmd0aCA+IDUwKSB7XG4gICAgICBzY29yZSArPSAyNTtcbiAgICB9XG4gICAgaWYgKHBhcnNlZC5rZXlQb2ludHMgJiYgcGFyc2VkLmtleVBvaW50cy5sZW5ndGggPj0gMykge1xuICAgICAgc2NvcmUgKz0gMjU7XG4gICAgfVxuICAgIGlmIChwYXJzZWQuYWlDb25jZXB0cyAmJiBwYXJzZWQuYWlDb25jZXB0cy5sZW5ndGggPiAwKSB7XG4gICAgICBzY29yZSArPSAyNTtcbiAgICB9XG4gICAgaWYgKHBhcnNlZC50ZWNobmljYWxEZXRhaWxzICYmIHBhcnNlZC50ZWNobmljYWxEZXRhaWxzLmxlbmd0aCA+IDApIHtcbiAgICAgIHNjb3JlICs9IDI1O1xuICAgIH1cbiAgICByZXR1cm4gc2NvcmU7XG4gIH1cblxuICBwcml2YXRlIGV4dHJhY3RCdWxsZXRQb2ludHModGV4dDogc3RyaW5nKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGxpbmVzID0gdGV4dC5zcGxpdCgnXFxuJyk7XG4gICAgcmV0dXJuIGxpbmVzXG4gICAgICAuZmlsdGVyKFxuICAgICAgICAobGluZSkgPT5cbiAgICAgICAgICBsaW5lLnRyaW0oKS5zdGFydHNXaXRoKCctJykgfHwgbGluZS50cmltKCkuc3RhcnRzV2l0aCgn4oCiJykgfHwgbGluZS50cmltKCkubWF0Y2goL15cXGQrXFwuLylcbiAgICAgIClcbiAgICAgIC5tYXAoKGxpbmUpID0+IGxpbmUucmVwbGFjZSgvXlst4oCiXFxkLl0rXFxzKi8sICcnKS50cmltKCkpXG4gICAgICAuZmlsdGVyKChsaW5lKSA9PiBsaW5lLmxlbmd0aCA+IDEwKVxuICAgICAgLnNsaWNlKDAsIDEwKTtcbiAgfVxuXG4gIHByaXZhdGUgZXh0cmFjdEFJQ29uY2VwdHModGV4dDogc3RyaW5nKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGFpVGVybXMgPSBbXG4gICAgICAnbWFjaGluZSBsZWFybmluZycsXG4gICAgICAnbmV1cmFsIG5ldHdvcmsnLFxuICAgICAgJ2RlZXAgbGVhcm5pbmcnLFxuICAgICAgJ3RyYW5zZm9ybWVyJyxcbiAgICAgICdHUFQnLFxuICAgICAgJ0xMTScsXG4gICAgICAnbGFyZ2UgbGFuZ3VhZ2UgbW9kZWwnLFxuICAgICAgJ0FJIGFnZW50JyxcbiAgICAgICdlbWJlZGRpbmcnLFxuICAgICAgJ2ZpbmUtdHVuaW5nJyxcbiAgICAgICdSQUcnLFxuICAgICAgJ3ZlY3RvciBkYXRhYmFzZScsXG4gICAgICAncHJvbXB0IGVuZ2luZWVyaW5nJyxcbiAgICAgICdkaWZmdXNpb24nLFxuICAgICAgJ3N0YWJsZSBkaWZmdXNpb24nLFxuICAgICAgJ0RBTEwtRScsXG4gICAgICAnQ2xhdWRlJyxcbiAgICAgICdHZW1pbmknLFxuICAgICAgJ09wZW5BSScsXG4gICAgICAnQW50aHJvcGljJyxcbiAgICAgICdMYW5nQ2hhaW4nLFxuICAgICAgJ0F1dG9HUFQnLFxuICAgICAgJ2luZmVyZW5jZScsXG4gICAgICAndHJhaW5pbmcnLFxuICAgICAgJ21vZGVsJyxcbiAgICBdO1xuXG4gICAgY29uc3QgZm91bmQ6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3QgbG93ZXJUZXh0ID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuXG4gICAgZm9yIChjb25zdCB0ZXJtIG9mIGFpVGVybXMpIHtcbiAgICAgIGlmIChsb3dlclRleHQuaW5jbHVkZXModGVybS50b0xvd2VyQ2FzZSgpKSAmJiAhZm91bmQuaW5jbHVkZXModGVybSkpIHtcbiAgICAgICAgZm91bmQucHVzaCh0ZXJtKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZm91bmQ7XG4gIH1cblxuICBzYXZlUmVwb3J0KHZpZGVvOiBWaWRlb0VudHJ5KTogc3RyaW5nIHtcbiAgICBjb25zdCBzYWZlVGl0bGUgPSB2aWRlby50aXRsZS5yZXBsYWNlKC9bXmEtekEtWjAtOV0vZywgJ18nKS5zdWJzdHJpbmcoMCwgNTApO1xuICAgIGNvbnN0IHJlcG9ydEZpbGUgPSBwYXRoLmpvaW4oXG4gICAgICB0aGlzLnJlcG9ydHNEaXIsXG4gICAgICBgdjJfJHt2aWRlby5pbmRleH1fJHtzYWZlVGl0bGV9XyR7RGF0ZS5ub3coKX0ubWRgXG4gICAgKTtcblxuICAgIGxldCBjb250ZW50ID0gYCMgVmlkZW8gQW5hbHlzaXMgUmVwb3J0XFxuXFxuIyMgTWV0YWRhdGFcXG4tICoqVmlkZW8qKjogJHt2aWRlby50aXRsZX1cXG4tICoqSW5kZXgqKjogIyR7dmlkZW8uaW5kZXh9XFxuLSAqKlVSTCoqOiAke3ZpZGVvLnVybH1cXG4tICoqRHVyYXRpb24qKjogJHt2aWRlby5tZXRhZGF0YT8uZHVyYXRpb25Gb3JtYXR0ZWQgfHwgJ1Vua25vd24nfVxcbi0gKipDaGFubmVsKio6ICR7dmlkZW8ubWV0YWRhdGE/LmNoYW5uZWwgfHwgJ1Vua25vd24nfVxcbi0gKipWaWV3cyoqOiAke3ZpZGVvLm1ldGFkYXRhPy52aWV3Q291bnQgfHwgJ1Vua25vd24nfVxcbi0gKipQdWJsaXNoZWQqKjogJHt2aWRlby5tZXRhZGF0YT8ucHVibGlzaERhdGUgfHwgJ1Vua25vd24nfVxcbi0gKipQcm9jZXNzZWQqKjogJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCl9XFxuLSAqKlF1YWxpdHkgU2NvcmUqKjogJHt2aWRlby5hbmFseXNpcz8ucXVhbGl0eVNjb3JlIHx8IDB9JVxcblxcbi0tLVxcblxcbiMjIFN1bW1hcnlcXG4ke3ZpZGVvLmFuYWx5c2lzPy5zdW1tYXJ5IHx8IHZpZGVvLm1ldGFkYXRhPy5zdW1tYXJ5IHx8ICdObyBzdW1tYXJ5IGF2YWlsYWJsZSd9XFxuXFxuIyMgS2V5IFBvaW50c1xcbiR7KHZpZGVvLmFuYWx5c2lzPy5rZXlQb2ludHMgfHwgW10pLm1hcCgocCkgPT4gYC0gJHtwfWApLmpvaW4oJ1xcbicpIHx8ICctIE5vIGtleSBwb2ludHMgZXh0cmFjdGVkJ31cXG5cXG4jIyBBSSAmIFRlY2huaWNhbCBDb25jZXB0c1xcbiR7KHZpZGVvLmFuYWx5c2lzPy5haUNvbmNlcHRzIHx8IFtdKS5tYXAoKGMpID0+IGAtICR7Y31gKS5qb2luKCdcXG4nKSB8fCAnLSBOb25lIGlkZW50aWZpZWQnfVxcblxcbiMjIFRlY2huaWNhbCBEZXRhaWxzXFxuJHsodmlkZW8uYW5hbHlzaXM/LnRlY2huaWNhbERldGFpbHMgfHwgW10pLm1hcCgoZCkgPT4gYC0gJHtkfWApLmpvaW4oJ1xcbicpIHx8ICctIE5vbmUgaWRlbnRpZmllZCd9XFxuYDtcblxuICAgIGlmICh2aWRlby5hbmFseXNpcz8udmlzdWFsQ29udGV4dEZsYWdzICYmIHZpZGVvLmFuYWx5c2lzLnZpc3VhbENvbnRleHRGbGFncy5sZW5ndGggPiAwKSB7XG4gICAgICBjb250ZW50ICs9IGBcXG4jIyDimqDvuI8gU2VjdGlvbnMgTmVlZGluZyBWaXN1YWwgUmV2aWV3XFxuJHt2aWRlby5hbmFseXNpcy52aXN1YWxDb250ZXh0RmxhZ3NcbiAgICAgICAgLm1hcCgoZikgPT4gYC0gKioke3RoaXMuZm9ybWF0RHVyYXRpb24oZi50aW1lc3RhbXApfSoqOiAke2YucmVhc29ufSAtICR7Zi5jb250ZXh0fWApXG4gICAgICAgIC5qb2luKCdcXG4nKX1cXG5gO1xuICAgIH1cblxuICAgIGZzLndyaXRlRmlsZVN5bmMocmVwb3J0RmlsZSwgY29udGVudCk7XG5cbiAgICBpZiAodmlkZW8udHJhbnNjcmlwdCAmJiB2aWRlby50cmFuc2NyaXB0Lmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHRyYW5zY3JpcHRGaWxlID0gcGF0aC5qb2luKHRoaXMudHJhbnNjcmlwdHNEaXIsIGAke3ZpZGVvLmluZGV4fV8ke3NhZmVUaXRsZX0udHh0YCk7XG4gICAgICBjb25zdCB0cmFuc2NyaXB0Q29udGVudCA9IHZpZGVvLnRyYW5zY3JpcHRcbiAgICAgICAgLm1hcCgocykgPT4gYFske3RoaXMuZm9ybWF0RHVyYXRpb24ocy5zdGFydCl9XSAke3MudGV4dH1gKVxuICAgICAgICAuam9pbignXFxuJyk7XG4gICAgICBmcy53cml0ZUZpbGVTeW5jKHRyYW5zY3JpcHRGaWxlLCB0cmFuc2NyaXB0Q29udGVudCk7XG4gICAgfVxuXG4gICAgdGhpcy5hcHBlbmRUb0tub3dsZWRnZUJhc2UodmlkZW8pO1xuXG4gICAgcmV0dXJuIHJlcG9ydEZpbGU7XG4gIH1cblxuICBwcml2YXRlIGFwcGVuZFRvS25vd2xlZGdlQmFzZSh2aWRlbzogVmlkZW9FbnRyeSk6IHZvaWQge1xuICAgIGNvbnN0IGVudHJ5SWQgPSBgdmlkZW8tYW5hbHlzaXMtJHt2aWRlby52aWRlb0lkfWA7XG4gICAgY29uc3Qgc2FmZVRpdGxlID0gdmlkZW8udGl0bGUucmVwbGFjZSgvW15hLXpBLVowLTldL2csICdfJykuc3Vic3RyaW5nKDAsIDUwKTtcblxuICAgIC8vIFNPRlRXQVJFIDMuMDogR2VuZXJhdGUgRmVkZXJhdGVkIElEIyAoQmFzZTU4IGVuY29kZWQgc2VxdWVuY2UpXG4gICAgY29uc3QgYWxwaGFiZXQgPSAnMTIzNDU2Nzg5QUJDREVGR0hKS0xNTlBRUlNUVVZXWFlaYWJjZGVmZ2hpamttbm9wcXJzdHV2d3h5eic7XG4gICAgbGV0IG51bSA9IHZpZGVvLmluZGV4O1xuICAgIGxldCBpZENvZGUgPSAnJztcbiAgICB3aGlsZSAobnVtID4gMCkge1xuICAgICAgaWRDb2RlID0gYWxwaGFiZXRbbnVtICUgNThdICsgaWRDb2RlO1xuICAgICAgbnVtID0gTWF0aC5mbG9vcihudW0gLyA1OCk7XG4gICAgfVxuICAgIGNvbnN0IGlkTnVtYmVyID0gYElEIzoke2lkQ29kZSB8fCBhbHBoYWJldFswXX1gO1xuXG4gICAgLy8gMS4gQ3JlYXRlIGEgQ29tcG91bmRpbmdMb2dFbnRyeSBzdHJ1Y3R1cmVcbiAgICBjb25zdCBjb21wb3VuZGluZ0VudHJ5ID0ge1xuICAgICAgaWQ6IGVudHJ5SWQsXG4gICAgICB0aXRsZTogdmlkZW8udGl0bGUsXG4gICAgICBjYXRlZ29yeTogJ3ZpZGVvLWFuYWx5c2lzJyxcbiAgICAgIGNvbnRlbnQ6IHZpZGVvLmFuYWx5c2lzPy5zdW1tYXJ5IHx8ICdObyBzdW1tYXJ5JyxcbiAgICAgIGJhY2tsaW5rczogdmlkZW8uYW5hbHlzaXM/LmFpQ29uY2VwdHMgfHwgW10sXG4gICAgICBtZXRhZGF0YToge1xuICAgICAgICBhZ2VudElkOiAndHJhbnNjcmlwdC1wcm9jZXNzb3ItdjInLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgdmlkZW9JZDogdmlkZW8udmlkZW9JZCxcbiAgICAgICAgdXJsOiB2aWRlby51cmwsXG4gICAgICAgIHF1YWxpdHlTY29yZTogdmlkZW8uYW5hbHlzaXM/LnF1YWxpdHlTY29yZSB8fCAwLFxuICAgICAgICBpZE51bWJlcjogaWROdW1iZXIsIC8vIFZlcmlmaWVkIEZlZGVyYXRlZCBJRCNcbiAgICAgICAgcmVzb3VyY2VQb2ludGVyczoge1xuICAgICAgICAgIHRyYW5zY3JpcHQ6IHtcbiAgICAgICAgICAgIHVyaTogYGZpbGU6Ly8ke3BhdGguam9pbih0aGlzLnRyYW5zY3JpcHRzRGlyLCBgJHt2aWRlby5pbmRleH1fJHtzYWZlVGl0bGV9LnR4dGApfWAsXG4gICAgICAgICAgICBtaW1lVHlwZTogJ3RleHQvcGxhaW4nLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVwb3J0OiB7XG4gICAgICAgICAgICB1cmk6IGBmaWxlOi8vJHtwYXRoLmpvaW4odGhpcy5yZXBvcnRzRGlyLCBgdjJfJHt2aWRlby5pbmRleH1fJHtzYWZlVGl0bGV9Lm1kYCl9YCxcbiAgICAgICAgICAgIG1pbWVUeXBlOiAndGV4dC9tYXJrZG93bicsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIC8vIDIuIFNhdmUgdGhlIENvbXBvdW5kaW5nIEVudHJ5IEpTT04gZm9yIHRoZSBXaWtpIENvbXBpbGVyIChUaGUgUmF0Y2hldCBMb29wKVxuICAgIGNvbnN0IHdpa2lJbmJveERpciA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUodGhpcy5zdGF0ZUZpbGVQYXRoKSwgJ3dpa2ktaW5ib3gnKTtcbiAgICBmcy5ta2RpclN5bmMod2lraUluYm94RGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBmcy53cml0ZUZpbGVTeW5jKFxuICAgICAgcGF0aC5qb2luKHdpa2lJbmJveERpciwgYCR7ZW50cnlJZH0uanNvbmApLFxuICAgICAgSlNPTi5zdHJpbmdpZnkoY29tcG91bmRpbmdFbnRyeSwgbnVsbCwgMilcbiAgICApO1xuXG4gICAgLy8gMy4gS2VlcCBsZWdhY3kgYXBwZW5kIGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5IGJ1dCB0YWcgaXQgYXMgYSBwb2ludGVyXG4gICAgY29uc3QgbGVnYWN5RW50cnkgPSBgXFxuLS0tXFxuXFxuIyMgIyR7dmlkZW8uaW5kZXh9OiAke3ZpZGVvLnRpdGxlfVxcbioqVVJMKio6ICR7dmlkZW8udXJsfVxcbioqUmVzb3VyY2UgUG9pbnRlcioqOiB0cnA6Ly93aWtpLWluYm94LyR7ZW50cnlJZH0uanNvblxcblxcbiMjIyBTdW1tYXJ5XFxuJHt2aWRlby5hbmFseXNpcz8uc3VtbWFyeSB8fCAnTm8gc3VtbWFyeSd9XFxuXFxuIyMjIEtleSBJbnNpZ2h0c1xcbiR7XG4gICAgICAodmlkZW8uYW5hbHlzaXM/LmtleVBvaW50cyB8fCBbXSlcbiAgICAgICAgLnNsaWNlKDAsIDUpXG4gICAgICAgIC5tYXAoKHApID0+IGAtICR7cH1gKVxuICAgICAgICAuam9pbignXFxuJykgfHwgJy0gTm9uZSdcbiAgICB9XFxuXFxuIyMjIEFJIENvbmNlcHRzIENvdmVyZWRcXG4keyh2aWRlby5hbmFseXNpcz8uYWlDb25jZXB0cyB8fCBbXSkuam9pbignLCAnKSB8fCAnTm9uZSd9XFxuXFxuYDtcblxuICAgIGZzLmFwcGVuZEZpbGVTeW5jKHRoaXMua25vd2xlZGdlQmFzZUZpbGUsIGxlZ2FjeUVudHJ5KTtcbiAgICBjb25zb2xlLmxvZyhgW3YyXSDwn6a+IEdlbmVyYXRlZCBTb3ZlcmVpZ24gRW50cnk6ICR7ZW50cnlJZH0uanNvbiAoUG9pbnRlci1iYXNlZClgKTtcbiAgfVxuXG4gIGFzeW5jIHByb2Nlc3NWaWRlbyh2aWRlbzogVmlkZW9FbnRyeSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmIChcbiAgICAgIHZpZGVvLnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcgfHxcbiAgICAgIHZpZGVvLnN0YXR1cyA9PT0gJ3NraXBwZWQnIHx8XG4gICAgICB2aWRlby5zdGF0dXMgPT09ICduZWVkc192aXN1YWwnXG4gICAgKSB7XG4gICAgICBjb25zb2xlLmxvZyhgW3YyXSDij63vuI8gU2tpcHBpbmcgIyR7dmlkZW8uaW5kZXh9ICgke3ZpZGVvLnN0YXR1c30pYCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAodmlkZW8ucHJvY2Vzc2luZ0F0dGVtcHRzID49IDMpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbdjJdIOKPre+4jyBTa2lwcGluZyAjJHt2aWRlby5pbmRleH0gKG1heCBhdHRlbXB0cyByZWFjaGVkKWApO1xuICAgICAgdmlkZW8uc3RhdHVzID0gJ3NraXBwZWQnO1xuICAgICAgdGhpcy5zdGF0ZS5zdGF0cy5za2lwcGVkKys7XG4gICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIEhFQUxUSCBDSEVDSyAtIEVuc3VyZSBicm93c2VyIGlzIGFsaXZlIGJlZm9yZSBwcm9jZXNzaW5nXG4gICAgYXdhaXQgdGhpcy5lbnN1cmVCcm93c2VySGVhbHRoKCk7XG5cbiAgICBjb25zb2xlLmxvZyhgXFxuJHsn4pWQJy5yZXBlYXQoNzApfWApO1xuICAgIGNvbnNvbGUubG9nKGBWaWRlbyAjJHt2aWRlby5pbmRleH06ICR7dmlkZW8udGl0bGV9YCk7XG4gICAgY29uc29sZS5sb2coYEF0dGVtcHQ6ICR7dmlkZW8ucHJvY2Vzc2luZ0F0dGVtcHRzICsgMX0vM2ApO1xuICAgIGNvbnNvbGUubG9nKGAkeyfilZAnLnJlcGVhdCg3MCl9XFxuYCk7XG5cbiAgICB2aWRlby5wcm9jZXNzaW5nQXR0ZW1wdHMrKztcbiAgICB2aWRlby5sYXN0UHJvY2Vzc2VkID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG5cbiAgICB0cnkge1xuICAgICAgaWYgKCF2aWRlby5tZXRhZGF0YSkge1xuICAgICAgICB2aWRlby5zdGF0dXMgPSAnbWV0YWRhdGEnO1xuICAgICAgICB2aWRlby5tZXRhZGF0YSA9IChhd2FpdCB0aGlzLmZldGNoRW5yaWNoZWRNZXRhZGF0YSh2aWRlbykpIHx8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHZpZGVvLm1ldGFkYXRhKSB7XG4gICAgICAgICAgdGhpcy5zdGF0ZS5zdGF0cy5tZXRhZGF0YUNvbXBsZXRlKys7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnRhcmdldFBoYXNlID09PSAnbWV0YWRhdGEnKSByZXR1cm4gdHJ1ZTtcblxuICAgICAgaWYgKCF2aWRlby50cmFuc2NyaXB0KSB7XG4gICAgICAgIHZpZGVvLnN0YXR1cyA9ICd0cmFuc2NyaXB0JztcbiAgICAgICAgdmlkZW8udHJhbnNjcmlwdCA9IChhd2FpdCB0aGlzLmV4dHJhY3RUcmFuc2NyaXB0RGlyZWN0KHZpZGVvKSkgfHwgdW5kZWZpbmVkO1xuICAgICAgICBpZiAodmlkZW8udHJhbnNjcmlwdCkge1xuICAgICAgICAgIHRoaXMuc3RhdGUuc3RhdHMudHJhbnNjcmlwdHNFeHRyYWN0ZWQrKztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMudGFyZ2V0UGhhc2UgPT09ICd0cmFuc2NyaXB0JykgcmV0dXJuIHRydWU7XG5cbiAgICAgIGlmICh2aWRlby50cmFuc2NyaXB0ICYmICF2aWRlby5hbmFseXNpcykge1xuICAgICAgICB2aWRlby5zdGF0dXMgPSAnYW5hbHl6ZWQnO1xuICAgICAgICB2aWRlby5hbmFseXNpcyA9IChhd2FpdCB0aGlzLmFuYWx5emVXaXRoQUkodmlkZW8pKSB8fCB1bmRlZmluZWQ7XG4gICAgICAgIGlmICh2aWRlby5hbmFseXNpcykge1xuICAgICAgICAgIHRoaXMuc3RhdGUuc3RhdHMuYW5hbHl6ZWQrKztcbiAgICAgICAgICBpZiAodmlkZW8uYW5hbHlzaXMudmlzdWFsQ29udGV4dEZsYWdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuc3RhdHMubmVlZHNWaXN1YWxSZXZpZXcrKztcbiAgICAgICAgICAgIHZpZGVvLnN0YXR1cyA9ICduZWVkc192aXN1YWwnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgfVxuXG4gICAgICBpZiAodmlkZW8uYW5hbHlzaXMpIHtcbiAgICAgICAgY29uc3QgcmVwb3J0UGF0aCA9IHRoaXMuc2F2ZVJlcG9ydCh2aWRlbyk7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIOKchSBSZXBvcnQ6ICR7cGF0aC5iYXNlbmFtZShyZXBvcnRQYXRoKX1gKTtcbiAgICAgICAgdmlkZW8uc3RhdHVzID0gJ2NvbXBsZXRlZCc7XG4gICAgICAgIHRoaXMuc3RhdGUuc3RhdHMuY29tcGxldGVkKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2aWRlby5zdGF0dXMgPSAnZXJyb3InO1xuICAgICAgICB2aWRlby5lcnJvciA9ICdBbmFseXNpcyBmYWlsZWQnO1xuICAgICAgICB0aGlzLnN0YXRlLnN0YXRzLmVycm9ycysrO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgdGhpcy5wcmludFByb2dyZXNzKCk7XG4gICAgICByZXR1cm4gdmlkZW8uc3RhdHVzID09PSAnY29tcGxldGVkJztcbiAgICB9IGNhdGNoIChlOiB1bmtub3duKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBbdjJdIEVycm9yIHByb2Nlc3NpbmcgIyR7dmlkZW8uaW5kZXh9OmAsIGUpO1xuICAgICAgdmlkZW8uZXJyb3IgPSAoZSBhcyBFcnJvcikubWVzc2FnZTtcbiAgICAgIHZpZGVvLnN0YXR1cyA9ICdlcnJvcic7XG4gICAgICB0aGlzLnN0YXRlLnN0YXRzLmVycm9ycysrO1xuICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHByaW50UHJvZ3Jlc3MoKTogdm9pZCB7XG4gICAgY29uc3QgcyA9IHRoaXMuc3RhdGUuc3RhdHM7XG4gICAgY29uc29sZS5sb2coYFxcbvCfk4ogUHJvZ3Jlc3M6ICR7cy5jb21wbGV0ZWR9LyR7cy50b3RhbFZpZGVvc31gKTtcbiAgICBjb25zb2xlLmxvZyhgICAgQ29tcGxldGVkOiAke3MuY29tcGxldGVkfSB8IEFuYWx5emVkOiAke3MuYW5hbHl6ZWR9IHwgRXJyb3JzOiAke3MuZXJyb3JzfWApO1xuICAgIGNvbnNvbGUubG9nKGAgICBTdWNjZXNzIFJhdGU6ICR7cy5hbmFseXNpc1N1Y2Nlc3NSYXRlLnRvRml4ZWQoMSl9JVxcbmApO1xuICB9XG5cbiAgYXN5bmMgcnVuKGxpYnJhcnlQYXRoOiBzdHJpbmcsIHN0YXJ0SW5kZXg6IG51bWJlciA9IDYzMywgZW5kSW5kZXg6IG51bWJlciA9IDEpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zb2xlLmxvZyhg8J+agCBUcmFuc2NyaXB0IFByb2Nlc3NvciB2MiAtIE9wdGltaXplZCBFZGl0aW9uYCk7XG4gICAgY29uc29sZS5sb2coYExpYnJhcnk6ICR7bGlicmFyeVBhdGh9YCk7XG4gICAgY29uc29sZS5sb2coYFJhbmdlOiAjJHtzdGFydEluZGV4fSDihpIgIyR7ZW5kSW5kZXh9YCk7XG4gICAgY29uc29sZS5sb2coYE1vZGVsOiAke0dFTUlOSV9NT0RFTH1gKTtcblxuICAgIGF3YWl0IHRoaXMuaW5pdGlhbGl6ZSgpO1xuXG4gICAgLy8gTG9hZCBsaWJyYXJ5XG4gICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhsaWJyYXJ5UGF0aCwgJ3V0Zi04Jyk7XG4gICAgY29uc3QgdmlkZW9zOiBWaWRlb0VudHJ5W10gPSBbXTtcbiAgICBjb25zdCByb3dSZWdleCA9XG4gICAgICAvPHRyPlxccyo8dGRbXj5dKj5cXHMqKFxcZCspXFxzKjxcXC90ZD5cXHMqPHRkW14+XSo+XFxzKjxhXFxzK2hyZWY9XCIoW15cIl0rKVwiW14+XSo+KFtePF0rKTxcXC9hPlxccyo8XFwvdGQ+L2c7XG4gICAgbGV0IG1hdGNoO1xuXG4gICAgd2hpbGUgKChtYXRjaCA9IHJvd1JlZ2V4LmV4ZWMoY29udGVudCkpICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBpbmRleCA9IHBhcnNlSW50KG1hdGNoWzFdKTtcbiAgICAgIGlmIChpbmRleCA8PSBzdGFydEluZGV4ICYmIGluZGV4ID49IGVuZEluZGV4KSB7XG4gICAgICAgIC8vIENoZWNrIGlmIGFscmVhZHkgaW4gcXVldWVcbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLnN0YXRlLnF1ZXVlLmZpbmQoKHYpID0+IHYuaW5kZXggPT09IGluZGV4KTtcbiAgICAgICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICAgICAgdmlkZW9zLnB1c2goZXhpc3RpbmcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZpZGVvcy5wdXNoKHtcbiAgICAgICAgICAgIGluZGV4LFxuICAgICAgICAgICAgdXJsOiBtYXRjaFsyXSxcbiAgICAgICAgICAgIHRpdGxlOiBtYXRjaFszXS50cmltKCksXG4gICAgICAgICAgICB2aWRlb0lkOiB0aGlzLmV4dHJhY3RWaWRlb0lkKG1hdGNoWzJdKSB8fCAnJyxcbiAgICAgICAgICAgIHN0YXR1czogJ3BlbmRpbmcnLFxuICAgICAgICAgICAgcHJvY2Vzc2luZ0F0dGVtcHRzOiAwLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gU29ydCBkZXNjZW5kaW5nXG4gICAgdmlkZW9zLnNvcnQoKGEsIGIpID0+IGIuaW5kZXggLSBhLmluZGV4KTtcblxuICAgIC8vIFVwZGF0ZSBzdGF0ZSBxdWV1ZSByZXNwZWN0aW5nIGV4aXN0aW5nIGVudHJpZXNcbiAgICB0aGlzLnN0YXRlLnF1ZXVlID0gdmlkZW9zO1xuICAgIHRoaXMuc3RhdGUuc3RhdHMudG90YWxWaWRlb3MgPSB2aWRlb3MubGVuZ3RoO1xuICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG5cbiAgICBjb25zb2xlLmxvZyhgW3YyXSBQcm9jZXNzaW5nICR7dmlkZW9zLmxlbmd0aH0gdmlkZW9zLi4uYCk7XG5cbiAgICBmb3IgKGNvbnN0IHZpZGVvIG9mIHZpZGVvcykge1xuICAgICAgdGhpcy5zdGF0ZS5jdXJyZW50SW5kZXggPSB2aWRlby5pbmRleDtcbiAgICAgIGF3YWl0IHRoaXMucHJvY2Vzc1ZpZGVvKHZpZGVvKTtcbiAgICAgIC8vIFNtYWxsIGNvb2xkb3duXG4gICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocikgPT4gc2V0VGltZW91dChyLCAyMDAwKSk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coJ1t2Ml0g8J+OiSBBbGwgZG9uZSEnKTtcbiAgICBpZiAodGhpcy5jb250ZXh0KSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbnRleHQuY2xvc2UoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVW5pdmVyc2FsIEZhbGxiYWNrOiBEb3dubG9hZCB0cmFuc2NyaXB0IHVzaW5nIHl0LWRscFxuICAgKi9cbiAgcHJpdmF0ZSBkb3dubG9hZFRyYW5zY3JpcHRXaXRoWXREbHAodXJsOiBzdHJpbmcsIHZpZGVvSWQ6IHN0cmluZyk6IFRyYW5zY3JpcHRTZWdtZW50W10gfCBudWxsIHtcbiAgICBjb25zdCB0ZW1wRGlyID0gcGF0aC5qb2luKHBhdGguZGlybmFtZSh0aGlzLnJlcG9ydHNEaXIpLCAndGVtcF9zdWJzJyk7XG5cbiAgICAvLyBFbnN1cmUgdGVtcCBkaXIgZXhpc3RzXG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKHRlbXBEaXIpKSB7XG4gICAgICB0cnkge1xuICAgICAgICBmcy5ta2RpclN5bmModGVtcERpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICB9IGNhdGNoIChlKSB7fVxuICAgIH1cblxuICAgIGNvbnN0IG91dHB1dEZpbGVCYXNlID0gcGF0aC5qb2luKHRlbXBEaXIsIHZpZGVvSWQpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnNvbGUubG9nKGBbdjJdIFJ1bm5pbmcgeXQtZGxwIGZvciAke3ZpZGVvSWR9Li4uYCk7XG5cbiAgICAgIC8vIENsZWFuIHVwIHByZXZpb3VzIHBvdGVudGlhbCBmaWxlc1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSBmcy5yZWFkZGlyU3luYyh0ZW1wRGlyKS5maWx0ZXIoKGYpID0+IGYuc3RhcnRzV2l0aCh2aWRlb0lkKSk7XG4gICAgICAgIGV4aXN0aW5nLmZvckVhY2goKGYpID0+IGZzLnVubGlua1N5bmMocGF0aC5qb2luKHRlbXBEaXIsIGYpKSk7XG4gICAgICB9IGNhdGNoIChlKSB7fVxuXG4gICAgICAvLyBDb21tYW5kIHRvIGdldCBWVFRcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBgeXQtZGxwIC0td3JpdGUtYXV0by1zdWIgLS13cml0ZS1zdWIgLS1zdWItbGFuZyBlbiAtLXNraXAtZG93bmxvYWQgLS1vdXRwdXQgXCIke291dHB1dEZpbGVCYXNlfVwiIFwiJHt1cmx9XCJgO1xuICAgICAgZXhlY1N5bmMoY29tbWFuZCwgeyBzdGRpbzogJ2lnbm9yZScgfSk7XG5cbiAgICAgIC8vIEZpbmQgdGhlIGdlbmVyYXRlZCBmaWxlICguZW4udnR0IG9yIHNpbWlsYXIpXG4gICAgICBjb25zdCBmaWxlcyA9IGZzLnJlYWRkaXJTeW5jKHRlbXBEaXIpO1xuICAgICAgY29uc3Qgc3ViRmlsZSA9IGZpbGVzLmZpbmQoKGYpID0+IGYuc3RhcnRzV2l0aCh2aWRlb0lkKSAmJiBmLmVuZHNXaXRoKCcudnR0JykpO1xuXG4gICAgICBpZiAoIXN1YkZpbGUpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1t2Ml0gTm8gLnZ0dCBmaWxlIGNyZWF0ZWQgYnkgeXQtZGxwJyk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICAvLyBQYXJzZSBWVFRcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKHRlbXBEaXIsIHN1YkZpbGUpLCAndXRmLTgnKTtcbiAgICAgIGNvbnN0IHNlZ21lbnRzOiBUcmFuc2NyaXB0U2VnbWVudFtdID0gW107XG4gICAgICBjb25zdCBibG9ja3MgPSBjb250ZW50LnNwbGl0KC9cXG5cXHI/XFxuLyk7XG5cbiAgICAgIGZvciAoY29uc3QgYmxvY2sgb2YgYmxvY2tzKSB7XG4gICAgICAgIGNvbnN0IHRpbWVNYXRjaCA9IGJsb2NrLm1hdGNoKFxuICAgICAgICAgIC8oXFxkezJ9KTooXFxkezJ9KTooXFxkezJ9KVxcLihcXGR7M30pXFxzLS0+XFxzKFxcZHsyfSk6KFxcZHsyfSk6KFxcZHsyfSlcXC4oXFxkezN9KS9cbiAgICAgICAgKTtcbiAgICAgICAgaWYgKHRpbWVNYXRjaCkge1xuICAgICAgICAgIGNvbnN0IGxpbmVzID0gYmxvY2suc3BsaXQoJ1xcbicpO1xuICAgICAgICAgIGNvbnN0IHRpbWVMaW5lSW5kZXggPSBsaW5lcy5maW5kSW5kZXgoKGwpID0+IGwuaW5jbHVkZXMoJy0tPicpKTtcbiAgICAgICAgICBpZiAodGltZUxpbmVJbmRleCAhPT0gLTEgJiYgdGltZUxpbmVJbmRleCA8IGxpbmVzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIGxldCB0ZXh0ID0gbGluZXNcbiAgICAgICAgICAgICAgLnNsaWNlKHRpbWVMaW5lSW5kZXggKyAxKVxuICAgICAgICAgICAgICAuam9pbignICcpXG4gICAgICAgICAgICAgIC5yZXBsYWNlKC88W14+XSo+L2csICcnKVxuICAgICAgICAgICAgICAudHJpbSgpO1xuICAgICAgICAgICAgaWYgKHRleHQgJiYgdGV4dCAhPT0gJ2FsaWduOnN0YXJ0IHBvc2l0aW9uOjAlJykge1xuICAgICAgICAgICAgICB0ZXh0ID0gdGV4dFxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8mYW1wOy9nLCAnJicpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoLyZxdW90Oy9nLCAnXCInKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8mIzM5Oy9nLCBcIidcIilcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvJmx0Oy9nLCAnPCcpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoLyZndDsvZywgJz4nKTtcblxuICAgICAgICAgICAgICBjb25zdCBzdGFydFNlYyA9XG4gICAgICAgICAgICAgICAgcGFyc2VJbnQodGltZU1hdGNoWzFdKSAqIDM2MDAgK1xuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFsyXSkgKiA2MCArXG4gICAgICAgICAgICAgICAgcGFyc2VJbnQodGltZU1hdGNoWzNdKSArXG4gICAgICAgICAgICAgICAgcGFyc2VJbnQodGltZU1hdGNoWzRdKSAvIDEwMDA7XG5cbiAgICAgICAgICAgICAgY29uc3QgZW5kU2VjID1cbiAgICAgICAgICAgICAgICBwYXJzZUludCh0aW1lTWF0Y2hbNV0pICogMzYwMCArXG4gICAgICAgICAgICAgICAgcGFyc2VJbnQodGltZU1hdGNoWzZdKSAqIDYwICtcbiAgICAgICAgICAgICAgICBwYXJzZUludCh0aW1lTWF0Y2hbN10pICtcbiAgICAgICAgICAgICAgICBwYXJzZUludCh0aW1lTWF0Y2hbOF0pIC8gMTAwMDtcblxuICAgICAgICAgICAgICBzZWdtZW50cy5wdXNoKHtcbiAgICAgICAgICAgICAgICBzdGFydDogc3RhcnRTZWMsXG4gICAgICAgICAgICAgICAgZHVyYXRpb246IGVuZFNlYyAtIHN0YXJ0U2VjLFxuICAgICAgICAgICAgICAgIHRleHQ6IHRleHQsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBDbGVhbnVwXG4gICAgICB0cnkge1xuICAgICAgICBmcy51bmxpbmtTeW5jKHBhdGguam9pbih0ZW1wRGlyLCBzdWJGaWxlKSk7XG4gICAgICB9IGNhdGNoIChlKSB7fVxuXG4gICAgICBpZiAoc2VnbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gc2VnbWVudHM7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcignW3YyXSB5dC1kbHAgZXhlY3V0aW9uIGVycm9yOicsIGUpO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG1haW4oKSB7XG4gIGNvbnN0IGFyZ3MgPSBwcm9jZXNzLmFyZ3Yuc2xpY2UoMik7XG4gIGNvbnN0IHN0YXJ0QXJnID0gYXJncy5maW5kKChhKSA9PiBhLnN0YXJ0c1dpdGgoJy0tc3RhcnQ9JykpO1xuICBjb25zdCBlbmRBcmcgPSBhcmdzLmZpbmQoKGEpID0+IGEuc3RhcnRzV2l0aCgnLS1lbmQ9JykpO1xuICBjb25zdCBwaGFzZUFyZyA9IGFyZ3MuZmluZCgoYSkgPT4gYS5zdGFydHNXaXRoKCctLXBoYXNlPScpKTtcblxuICBjb25zdCBzdGFydCA9IHN0YXJ0QXJnID8gcGFyc2VJbnQoc3RhcnRBcmcuc3BsaXQoJz0nKVsxXSkgOiA2MzM7XG4gIGNvbnN0IGVuZCA9IGVuZEFyZyA/IHBhcnNlSW50KGVuZEFyZy5zcGxpdCgnPScpWzFdKSA6IDE7XG4gIGNvbnN0IHBoYXNlID0gKHBoYXNlQXJnID8gcGhhc2VBcmcuc3BsaXQoJz0nKVsxXSA6ICdhbmFseXNpcycpIGFzXG4gICAgfCAnbWV0YWRhdGEnXG4gICAgfCAndHJhbnNjcmlwdCdcbiAgICB8ICdhbmFseXNpcyc7XG5cbiAgY29uc3QgbGlicmFyeVBhdGggPVxuICAgICcvVXNlcnMvPG93bmVyPi9EZXNrdG9wL0ExLUludGVyLUxMTS1Db20vbXktYWkta25vd2xlZGdlLWJhc2UvdmlkZW8tbGlicmFyeS9haV92aWRlb19saWJyYXJ5Lmh0bWwnO1xuXG4gIGNvbnN0IHByb2Nlc3NvciA9IG5ldyBUcmFuc2NyaXB0UHJvY2Vzc29yVjIocGhhc2UpO1xuICAvLyBQcm9jZXNzIHRoZSBrbm93biBiYWNrbG9nIChpbmRpY2VzIHdoZXJlIHRyYW5zY3JpcHRzIGFscmVhZHkgZXhpc3QpXG4gIGF3YWl0IHByb2Nlc3Nvci5ydW4obGlicmFyeVBhdGgsIDY0NywgNDA1KTtcbn1cblxubWFpbigpLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xuIl19