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
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';
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
    } catch (e) {
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
        ? transcripts.reduce((sum, v) => {
            var _a;
            return (
              sum + (((_a = v.transcript) === null || _a === void 0 ? void 0 : _a.length) || 0)
            );
          }, 0) / transcripts.length
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
    this.context = await chromium.launchPersistentContext(profileDir, {
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
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
          } catch (e) {
            // Ignore close errors
          }
        }
      }
      return true;
    } catch (error) {
      console.error('[v2] ❌ Browser health check failed:', error);
      console.log('[v2] 🔄 Reinitializing browser...');
      try {
        await ((_a = this.context) === null || _a === void 0 ? void 0 : _a.close());
      } catch (e) {
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
    if (!element) return;
    const box = await element.boundingBox();
    if (!box) return;
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
        } catch (e) {
          console.log('[v2] Click failed, trying force click', e);
          await checkbox.dispatchEvent('click');
        }
        console.log('[v2] Clicked checkbox. Waiting for outcome...');
        await page.waitForTimeout(5000);
      } else {
        console.log('[v2] Could not find checkbox inside frame.');
        // Take a screenshot for valid debugging
        await page.screenshot({ path: path.join(this.reportsDir, 'captcha_fail.png') });
      }
    } else {
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
      if (
        page.url().includes('google.com/sorry/') ||
        (await page.$('text="unusual traffic"')) ||
        (await page.$('iframe[src*="recaptcha"]'))
      ) {
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
          } else if (match[0].toLowerCase().includes('minute')) {
            duration = parseInt(match[1]) * 60 + parseInt(match[2] || '0');
          } else if (match.length === 4) {
            duration = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]);
          } else if (match.length === 3) {
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
      console.log(
        `[v2] ✅ Metadata: ${metadata.durationFormatted} | ${metadata.channel || 'Unknown channel'}`
      );
      return metadata;
    } catch (e) {
      console.error(`[v2] Error in metadata fetch:`, e);
      await page.close();
      return null;
    }
  }
  async extractTranscriptDirect(video) {
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
        if (
          (_c =
            (_b =
              (_a = win.ytInitialPlayerResponse) === null || _a === void 0
                ? void 0
                : _a.captions) === null || _b === void 0
              ? void 0
              : _b.playerCaptionsTracklistRenderer) === null || _c === void 0
            ? void 0
            : _c.captionTracks
        ) {
          const tracks =
            win.ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer.captionTracks;
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
              } catch (e) {}
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
      } catch (e) {}
      try {
        const transcriptBtn = page.locator(
          '[aria-label*="transcript"], button:has-text("transcript")'
        );
        if ((await transcriptBtn.count()) > 0) {
          await transcriptBtn.first().click();
          await page.waitForTimeout(2000);
        }
      } catch (e) {}
      const uiSegments = await page.evaluate(() => {
        const result = [];
        const segments = document.querySelectorAll('ytd-transcript-segment-renderer');
        segments.forEach((seg) => {
          var _a, _b;
          const timeEl = seg.querySelector('.segment-timestamp');
          const textEl = seg.querySelector('.segment-text');
          if (timeEl && textEl) {
            const time =
              ((_a = timeEl.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '0:00';
            const text =
              ((_b = textEl.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || '';
            const parts = time.split(':').map((p) => parseInt(p) || 0);
            const seconds =
              parts.length === 3
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
        } catch (e) {}
        return fb;
      }
      console.log('[v2] ⚠️ No transcript available');
      return null;
    } catch (e) {
      console.error('[v2] Transcript error:', e);
      try {
        await page.close();
      } catch (x) {}
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
          } else {
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
        } else {
          console.error('[v2] ❌ Could not find "Select key" button.');
        }
      } else {
        console.log('[v2] ✅ API Key appears to be linked.');
        // Give AI Studio extra time to fully transition to paid mode
        console.log('[v2] ⏳ Waiting for API transition to complete...');
        await page.waitForTimeout(3000);
      }
    } catch (e) {
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
        if (!isVisible) continue;
        const text = await el.innerText();
        const label = (await el.getAttribute('aria-label')) || '';
        const cls = (await el.getAttribute('class')) || '';
        console.log(
          `[v2] Candidate #${i}: Text="${text.replace(/\n/g, '\\n')}", Label="${label}", Class="${cls}"`
        );
        // Heuristics to identify the model selector:
        // - Text contains "Gemini"
        // - label contains "model" (case-insensitive)
        // - class contains "model-selector"
        // - EXCLUDE filter chips
        if (
          (text.includes('Gemini') ||
            label.toLowerCase().includes('model') ||
            cls.includes('model-selector')) &&
          !cls.includes('filter-chip')
        ) {
          // Exclude commonly confused things if checks are weak
          if (label.toLowerCase().includes('setting')) continue;
          // Critical: If we want Flash, DO NOT accept Pro card
          if (
            targetModel.includes('flash') &&
            text.toLowerCase().includes('pro') &&
            !text.toLowerCase().includes('flash')
          ) {
            console.log(`[v2] Ignoring Pro candidate #${i} because we want Flash`);
            continue;
          }
          // Prioritize exact match (e.g. Flash)
          if (targetModel.includes('flash') && text.toLowerCase().includes('flash')) {
            bestMatch = el;
            console.log(`[v2] Flash MATCH FOUND at #${i}`);
            break; // Found the best one
          }
          if (
            targetModel.includes('pro') &&
            text.toLowerCase().includes('pro') &&
            !targetModel.includes('flash')
          ) {
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
        console.log(
          `[v2] Selected candidate: ${modelSelector === bestMatch ? 'Best Match' : 'Default Match'}`
        );
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
            if (!(await el.isVisible())) continue;
            const text = await el.innerText();
            const label = (await el.getAttribute('aria-label')) || '';
            const cls = (await el.getAttribute('class')) || '';
            if (
              (text.includes('Gemini') ||
                label.toLowerCase().includes('model') ||
                cls.includes('model-selector')) &&
              !cls.includes('filter-chip')
            ) {
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
        bestMatchIndex = availableModels.findIndex((m) =>
          m.toLowerCase().includes(targetModel.toLowerCase())
        );
        if (bestMatchIndex === -1) {
          // Fallback for known aliases
          if (targetModel.includes('flash')) {
            bestMatchIndex = availableModels.findIndex(
              (m) => m.toLowerCase().includes('flash') && !m.toLowerCase().includes('legacy')
            );
          } else if (targetModel.includes('pro')) {
            bestMatchIndex = availableModels.findIndex(
              (m) => m.toLowerCase().includes('pro') && !m.toLowerCase().includes('vision')
            ); // 'vision' is often older
          }
        }
        if (bestMatchIndex !== -1) {
          console.log(`[v2] 👉 Selecting: ${availableModels[bestMatchIndex]}`);
          await options.nth(bestMatchIndex).click();
          await page.waitForTimeout(2000);
        } else {
          console.warn(
            `[v2] ⚠️ Could not find target model ${targetModel}. Keeping current selection.`
          );
          await page.keyboard.press('Escape');
        }
      } else {
        console.log(
          '[v2] ⚠️ Model selector not found (checked all buttons). assuming strict URL param worked.'
        );
        const content = await page.content();
        fs.writeFileSync('ai_studio_dump.html', content);
        console.log('[v2] Dumped AI Studio HTML to ai_studio_dump.html');
      }
    } catch (e) {
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
      } catch (contextError) {
        console.error('[v2] ❌ Browser context is dead, cannot create page:', contextError);
        // Try to reinitialize
        console.log('[v2] Attempting to restart browser...');
        try {
          await ((_a = this.context) === null || _a === void 0 ? void 0 : _a.close());
        } catch (e) {
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
        } catch (e) {
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
            console.error(
              `[v2] 🛑 FATAL ERROR: Account permissions issue. Stopping entire process.`
            );
            // We need to exit the entire process so the user can fix the account
            process.exit(1);
          }
          throw new Error(`AI Studio Error: ${errorText}`);
        }
        // Check for completion by looking for the response container
        const responseContainer = page.locator(
          'ms-chat-turn.model .turn-content, .chat-turn-container.model .turn-content'
        );
        if ((await responseContainer.count()) > 0) {
          // Get the inner text directly, not including UI elements
          const rawText = await page.evaluate(() => {
            // Find the actual response text, excluding toolbar buttons
            const containers = document.querySelectorAll(
              'ms-chat-turn.model .turn-content, .chat-turn-container.model .turn-content'
            );
            if (containers.length === 0) {
              return null;
            }
            const lastContainer = containers[containers.length - 1];
            // Get text from markdown content if available
            const markdown = lastContainer.querySelector(
              '.markdown-body, .markdown-content, .rendered-markdown'
            );
            let content = markdown ? markdown.textContent || '' : lastContainer.textContent || '';
            // CLEANING: Remove "Model Thinking" blocks which clutter the output
            // Gemini Flash sometimes outputs "Model Thinking..." followed by thoughts
            content = content.replace(
              /Model Thinking[\s\S]*?(?:Expand to view model thoughts|chevron_right)/g,
              ''
            );
            content = content.replace(/Model Thinking[\s\S]*?json/i, '');
            // Remove common UI text patterns
            content = content.replace(
              /more_vert|content_copy|download|expand_less|expand_more|Model code JSON/g,
              ''
            );
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
                } catch (e) {
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
              } catch (e) {
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
    } catch (e) {
      console.error('[v2] Analysis error:', e);
      return null;
    } finally {
      // GUARANTEED CLEANUP - Always close page, even if errors occur
      if (page) {
        try {
          await page.close();
          console.log('[v2] 🧹 Page cleaned up');
        } catch (cleanupError) {
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
      .filter(
        (line) =>
          line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().match(/^\d+\./)
      )
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
    const reportFile = path.join(
      this.reportsDir,
      `v2_${video.index}_${safeTitle}_${Date.now()}.md`
    );
    let content = `# Video Analysis Report\n\n## Metadata\n- **Video**: ${video.title}\n- **Index**: #${video.index}\n- **URL**: ${video.url}\n- **Duration**: ${((_a = video.metadata) === null || _a === void 0 ? void 0 : _a.durationFormatted) || 'Unknown'}\n- **Channel**: ${((_b = video.metadata) === null || _b === void 0 ? void 0 : _b.channel) || 'Unknown'}\n- **Views**: ${((_c = video.metadata) === null || _c === void 0 ? void 0 : _c.viewCount) || 'Unknown'}\n- **Published**: ${((_d = video.metadata) === null || _d === void 0 ? void 0 : _d.publishDate) || 'Unknown'}\n- **Processed**: ${new Date().toISOString()}\n- **Quality Score**: ${((_e = video.analysis) === null || _e === void 0 ? void 0 : _e.qualityScore) || 0}%\n\n---\n\n## Summary\n${((_f = video.analysis) === null || _f === void 0 ? void 0 : _f.summary) || ((_g = video.metadata) === null || _g === void 0 ? void 0 : _g.summary) || 'No summary available'}\n\n## Key Points\n${(((_h = video.analysis) === null || _h === void 0 ? void 0 : _h.keyPoints) || []).map((p) => `- ${p}`).join('\n') || '- No key points extracted'}\n\n## AI & Technical Concepts\n${(((_j = video.analysis) === null || _j === void 0 ? void 0 : _j.aiConcepts) || []).map((c) => `- ${c}`).join('\n') || '- None identified'}\n\n## Technical Details\n${(((_k = video.analysis) === null || _k === void 0 ? void 0 : _k.technicalDetails) || []).map((d) => `- ${d}`).join('\n') || '- None identified'}\n`;
    if (
      ((_l = video.analysis) === null || _l === void 0 ? void 0 : _l.visualContextFlags) &&
      video.analysis.visualContextFlags.length > 0
    ) {
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
    var _a, _b, _c, _d;
    const entry = `\n---\n\n## #${video.index}: ${video.title}\n**URL**: ${video.url}\n**Duration**: ${((_a = video.metadata) === null || _a === void 0 ? void 0 : _a.durationFormatted) || 'Unknown'}\n\n### Summary\n${((_b = video.analysis) === null || _b === void 0 ? void 0 : _b.summary) || 'No summary'}\n\n### Key Insights\n${
      (((_c = video.analysis) === null || _c === void 0 ? void 0 : _c.keyPoints) || [])
        .slice(0, 5)
        .map((p) => `- ${p}`)
        .join('\n') || '- None'
    }\n\n### AI Concepts Covered\n${(((_d = video.analysis) === null || _d === void 0 ? void 0 : _d.aiConcepts) || []).join(', ') || 'None'}\n\n`;
    fs.appendFileSync(this.knowledgeBaseFile, entry);
  }
  async processVideo(video) {
    if (
      video.status === 'completed' ||
      video.status === 'skipped' ||
      video.status === 'needs_visual'
    ) {
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
      if (this.targetPhase === 'metadata') return true;
      if (!video.transcript) {
        video.status = 'transcript';
        video.transcript = (await this.extractTranscriptDirect(video)) || undefined;
        if (video.transcript) {
          this.state.stats.transcriptsExtracted++;
        }
        this.saveState();
      }
      if (this.targetPhase === 'transcript') return true;
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
      } else {
        video.status = 'error';
        video.error = 'Analysis failed';
        this.state.stats.errors++;
      }
      this.saveState();
      this.printProgress();
      return video.status === 'completed';
    } catch (e) {
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
    const rowRegex =
      /<tr>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>\s*<\/td>/g;
    let match;
    while ((match = rowRegex.exec(content)) !== null) {
      const index = parseInt(match[1]);
      if (index <= startIndex && index >= endIndex) {
        // Check if already in queue
        const existing = this.state.queue.find((v) => v.index === index);
        if (existing) {
          videos.push(existing);
        } else {
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
      } catch (e) {}
    }
    const outputFileBase = path.join(tempDir, videoId);
    try {
      console.log(`[v2] Running yt-dlp for ${videoId}...`);
      // Clean up previous potential files
      try {
        const existing = fs.readdirSync(tempDir).filter((f) => f.startsWith(videoId));
        existing.forEach((f) => fs.unlinkSync(path.join(tempDir, f)));
      } catch (e) {}
      // Command to get VTT
      const command = `yt-dlp --write-auto-sub --write-sub --sub-lang en --skip-download --output "${outputFileBase}" "${url}"`;
      execSync(command, { stdio: 'ignore' });
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
        const timeMatch = block.match(
          /(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s-->\s(\d{2}):(\d{2}):(\d{2})\.(\d{3})/
        );
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
      } catch (e) {}
      if (segments.length > 0) {
        return segments;
      }
    } catch (e) {
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
  const phase = phaseArg ? phaseArg.split('=')[1] : 'analysis';
  const libraryPath = path.join(process.cwd(), '..', '..', 'ai_video_library.html');
  const processor = new TranscriptProcessorV2(phase);
  await processor.run(libraryPath, start, end);
}
main().catch(console.error);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHJhbnNjcmlwdFByb2Nlc3NvclYyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiVHJhbnNjcmlwdFByb2Nlc3NvclYyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7R0FZRztBQUVILE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDekMsT0FBTyxLQUFLLEVBQUUsTUFBTSxJQUFJLENBQUM7QUFDekIsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUM7QUFFN0IsT0FBTyxFQUFFLFFBQVEsRUFBa0MsTUFBTSxZQUFZLENBQUM7QUFnRnRFLDZDQUE2QztBQUM3QyxNQUFNLFlBQVksR0FBRyx3QkFBd0IsQ0FBQztBQUM5QyxNQUFNLGFBQWEsR0FBRywwREFBMEQsWUFBWSxFQUFFLENBQUM7QUFFL0YsTUFBTSxlQUFlLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FnQnZCLENBQUM7QUFFRixNQUFNLHFCQUFxQjtJQVN6QixZQUFZLGNBQXNELFVBQVU7UUFScEUsWUFBTyxHQUEwQixJQUFJLENBQUM7UUFNdEMsZ0JBQVcsR0FBMkMsVUFBVSxDQUFDO1FBR3ZFLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1FBQy9CLG9FQUFvRTtRQUNwRSxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN2RCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUUxRCxnRkFBZ0Y7UUFDaEYsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUM7UUFFMUUsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO1FBQ3BF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dUIsQ0FBQyxDQUFDO0lBRWxGLE1BQU0sU0FBUyxHQUFHLElBQUkscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbkQsTUFBTSxTQUFTLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDL0MsQ0FBQztBQUVELElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRyYW5zY3JpcHQgUHJvY2Vzc29yIHYyIC0gT3B0aW1pemVkIEVkaXRpb25cbiAqXG4gKiBJbXByb3ZlbWVudHMgb3ZlciB2MTpcbiAqIDEuIFVzZXMgbGF0ZXN0IEdlbWluaSAzIEZsYXNoIG1vZGVsIChnZW1pbmktMy1mbGFzaC1wcmV2aWV3KVxuICogMi4gRnJlc2ggYnJvd3NlciBwYWdlIGZvciBFQUNIIG9wZXJhdGlvblxuICogMy4gQmV0dGVyIEpTT04gZXh0cmFjdGlvbiBmcm9tIEFJIHJlc3BvbnNlc1xuICogNC4gTWF4aW1pemVkIEdvb2dsZSBTZWFyY2ggQUkgbW9kZSBxdWVyaWVzXG4gKiA1LiBEaXJlY3QgdHJhbnNjcmlwdCBleHRyYWN0aW9uIHZpYSBBUEkgKG5vIFlvdVR1YmUgcGFnZSB2aXNpdCB3aGVuIHBvc3NpYmxlKVxuICogNi4gQ2VudHJhbGl6ZWQga25vd2xlZGdlIGJhc2UgY29uc29saWRhdGlvblxuICogNy4gUHJvcGVyIHN0YXR1cyB0cmFja2luZyB0byBwcmV2ZW50IGxvb3BzXG4gKiA4LiBTdWNjZXNzIG1ldHJpY3MgYW5kIHF1YWxpdHkgZXZhbHVhdGlvblxuICovXG5cbmltcG9ydCB7IGV4ZWNTeW5jIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG5pbXBvcnQgeyBjaHJvbWl1bSwgdHlwZSBCcm93c2VyQ29udGV4dCwgdHlwZSBQYWdlIH0gZnJvbSAncGxheXdyaWdodCc7XG5cbmludGVyZmFjZSBWaWRlb0VudHJ5IHtcbiAgaW5kZXg6IG51bWJlcjtcbiAgdXJsOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHZpZGVvSWQ6IHN0cmluZztcbiAgbWV0YWRhdGE/OiBWaWRlb01ldGFkYXRhO1xuICB0cmFuc2NyaXB0PzogVHJhbnNjcmlwdFNlZ21lbnRbXTtcbiAgYW5hbHlzaXM/OiBBbmFseXNpc1Jlc3VsdDtcbiAgc3RhdHVzOlxuICAgIHwgJ3BlbmRpbmcnXG4gICAgfCAnbWV0YWRhdGEnXG4gICAgfCAndHJhbnNjcmlwdCdcbiAgICB8ICdhbmFseXplZCdcbiAgICB8ICduZWVkc192aXN1YWwnXG4gICAgfCAnY29tcGxldGVkJ1xuICAgIHwgJ3NraXBwZWQnXG4gICAgfCAnZXJyb3InO1xuICBwcm9jZXNzaW5nQXR0ZW1wdHM6IG51bWJlcjtcbiAgbGFzdFByb2Nlc3NlZD86IHN0cmluZztcbiAgZXJyb3I/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBWaWRlb01ldGFkYXRhIHtcbiAgZHVyYXRpb246IG51bWJlcjtcbiAgZHVyYXRpb25Gb3JtYXR0ZWQ6IHN0cmluZztcbiAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gIGNoYW5uZWw/OiBzdHJpbmc7XG4gIHB1Ymxpc2hEYXRlPzogc3RyaW5nO1xuICB2aWV3Q291bnQ/OiBzdHJpbmc7XG4gIGNhdGVnb3J5Pzogc3RyaW5nO1xuICB0YWdzPzogc3RyaW5nW107XG4gIHN1bW1hcnk/OiBzdHJpbmc7IC8vIEFJLWdlbmVyYXRlZCBzdW1tYXJ5IGZyb20gR29vZ2xlXG59XG5cbmludGVyZmFjZSBUcmFuc2NyaXB0U2VnbWVudCB7XG4gIHN0YXJ0OiBudW1iZXI7XG4gIGR1cmF0aW9uOiBudW1iZXI7XG4gIHRleHQ6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIEFuYWx5c2lzUmVzdWx0IHtcbiAga2V5UG9pbnRzOiBzdHJpbmdbXTtcbiAgYWlDb25jZXB0czogc3RyaW5nW107XG4gIHRlY2huaWNhbERldGFpbHM6IHN0cmluZ1tdO1xuICB2aXN1YWxDb250ZXh0RmxhZ3M6IFZpc3VhbENvbnRleHRGbGFnW107XG4gIHN1bW1hcnk6IHN0cmluZztcbiAgcXVhbGl0eVNjb3JlPzogbnVtYmVyO1xuICByYXdSZXNwb25zZT86IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFZpc3VhbENvbnRleHRGbGFnIHtcbiAgdGltZXN0YW1wOiBudW1iZXI7XG4gIHJlYXNvbjogc3RyaW5nO1xuICBjb250ZXh0OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBQcm9jZXNzaW5nU3RhdGUge1xuICB2ZXJzaW9uOiBzdHJpbmc7XG4gIHF1ZXVlOiBWaWRlb0VudHJ5W107XG4gIGN1cnJlbnRJbmRleDogbnVtYmVyO1xuICBzdGFydGVkQXQ6IHN0cmluZztcbiAgbGFzdFVwZGF0ZWQ6IHN0cmluZztcbiAgc3RhdHM6IFByb2Nlc3NpbmdTdGF0cztcbn1cblxuaW50ZXJmYWNlIFByb2Nlc3NpbmdTdGF0cyB7XG4gIHRvdGFsVmlkZW9zOiBudW1iZXI7XG4gIG1ldGFkYXRhQ29tcGxldGU6IG51bWJlcjtcbiAgdHJhbnNjcmlwdHNFeHRyYWN0ZWQ6IG51bWJlcjtcbiAgYW5hbHl6ZWQ6IG51bWJlcjtcbiAgbmVlZHNWaXN1YWxSZXZpZXc6IG51bWJlcjtcbiAgY29tcGxldGVkOiBudW1iZXI7XG4gIHNraXBwZWQ6IG51bWJlcjtcbiAgZXJyb3JzOiBudW1iZXI7XG4gIGFuYWx5c2lzU3VjY2Vzc1JhdGU6IG51bWJlcjtcbiAgYXZlcmFnZVRyYW5zY3JpcHRMZW5ndGg6IG51bWJlcjtcbn1cblxuLy8gTGF0ZXN0IGF2YWlsYWJsZSBtb2RlbCBhcyBvZiBKYW4gMjAyNS8yMDI2XG5jb25zdCBHRU1JTklfTU9ERUwgPSAnZ2VtaW5pLTMtZmxhc2gtcHJldmlldyc7XG5jb25zdCBBSV9TVFVESU9fVVJMID0gYGh0dHBzOi8vYWlzdHVkaW8uZ29vZ2xlLmNvbS9hcHAvcHJvbXB0cy9uZXdfY2hhdD9tb2RlbD0ke0dFTUlOSV9NT0RFTH1gO1xuXG5jb25zdCBBTkFMWVNJU19QUk9NUFQgPSBgWW91IGFyZSBhbmFseXppbmcgYSBZb3VUdWJlIHZpZGVvIHRyYW5zY3JpcHQuIEV4dHJhY3QgYW5kIHN0cnVjdHVyZSB0aGUgZm9sbG93aW5nIGluZm9ybWF0aW9uIGFzIHZhbGlkIEpTT04gb25seSAobm8gbWFya2Rvd24sIG5vIGV4dHJhIHRleHQpLlxuXG5SZXR1cm4gT05MWSB0aGlzIEpTT04gc3RydWN0dXJlOlxue1xuICBcInN1bW1hcnlcIjogXCIyLTMgc2VudGVuY2Ugc3VtbWFyeSBvZiB0aGUgdmlkZW8gY29udGVudFwiLFxuICBcImtleVBvaW50c1wiOiBbXCJwb2ludCAxXCIsIFwicG9pbnQgMlwiLCAuLi5dLFxuICBcImFpQ29uY2VwdHNcIjogW1wiQUkgY29uY2VwdCAxXCIsIFwiQUkgY29uY2VwdCAyXCIsIC4uLl0sXG4gIFwidGVjaG5pY2FsRGV0YWlsc1wiOiBbXCJ0b29sL2ZyYW1ld29yayAxXCIsIFwiaW1wbGVtZW50YXRpb24gZGV0YWlsXCIsIC4uLl0sXG4gIFwidmlzdWFsQ29udGV4dEZsYWdzXCI6IFtcbiAgICB7XCJ0aW1lc3RhbXBcIjogMTIwLCBcInJlYXNvblwiOiBcIkNvZGUgZGVtb1wiLCBcImNvbnRleHRcIjogXCJTaG93cyBQeXRob24gaW1wbGVtZW50YXRpb25cIn1cbiAgXVxufVxuXG5JZiB0aGUgdmlkZW8gaXMgbm90IGFib3V0IEFJL3RlY2gsIHNldCBhaUNvbmNlcHRzIGFuZCB0ZWNobmljYWxEZXRhaWxzIHRvIGVtcHR5IGFycmF5cyBidXQgc3RpbGwgZXh0cmFjdCBrZXlQb2ludHMuXG5cblRSQU5TQ1JJUFQ6XG5gO1xuXG5jbGFzcyBUcmFuc2NyaXB0UHJvY2Vzc29yVjIge1xuICBwcml2YXRlIGNvbnRleHQ6IEJyb3dzZXJDb250ZXh0IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc3RhdGU6IFByb2Nlc3NpbmdTdGF0ZTtcbiAgcHJpdmF0ZSBzdGF0ZUZpbGVQYXRoOiBzdHJpbmc7XG4gIHByaXZhdGUgcmVwb3J0c0Rpcjogc3RyaW5nO1xuICBwcml2YXRlIHRyYW5zY3JpcHRzRGlyOiBzdHJpbmc7XG4gIHByaXZhdGUga25vd2xlZGdlQmFzZUZpbGU6IHN0cmluZztcbiAgcHJpdmF0ZSB0YXJnZXRQaGFzZTogJ21ldGFkYXRhJyB8ICd0cmFuc2NyaXB0JyB8ICdhbmFseXNpcycgPSAnYW5hbHlzaXMnO1xuXG4gIGNvbnN0cnVjdG9yKHRhcmdldFBoYXNlOiAnbWV0YWRhdGEnIHwgJ3RyYW5zY3JpcHQnIHwgJ2FuYWx5c2lzJyA9ICdhbmFseXNpcycpIHtcbiAgICB0aGlzLnRhcmdldFBoYXNlID0gdGFyZ2V0UGhhc2U7XG4gICAgLy8gRGV0ZXJtaW5lIGRhdGEgZGlyZWN0b3J5IChoYW5kbGUgYm90aCBwYWNrYWdlIGFuZCByb290IHNjZW5hcmlvcylcbiAgICBjb25zdCBwYWNrYWdlRGF0YURpciA9IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9kYXRhJyk7XG4gICAgY29uc3Qgcm9vdERhdGFEaXIgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vZGF0YScpO1xuXG4gICAgLy8gUHJlZmVyIHJvb3QgZGF0YSBkaXIgaWYgaXQgZXhpc3RzIChwcmV2aW91cyBiZWhhdmlvciksIG90aGVyd2lzZSBwYWNrYWdlIGRhdGFcbiAgICBjb25zdCBkYXRhRGlyID0gZnMuZXhpc3RzU3luYyhyb290RGF0YURpcikgPyByb290RGF0YURpciA6IHBhY2thZ2VEYXRhRGlyO1xuXG4gICAgdGhpcy5zdGF0ZUZpbGVQYXRoID0gcGF0aC5qb2luKGRhdGFEaXIsICd0cmFuc2NyaXB0LXYyLXN0YXRlLmpzb24nKTtcbiAgICB0aGlzLnJlcG9ydHNEaXIgPSBwYXRoLmpvaW4oZGF0YURpciwgJ3ZpZGVvLXJlcG9ydHMnKTtcbiAgICB0aGlzLnRyYW5zY3JpcHRzRGlyID0gcGF0aC5qb2luKGRhdGFEaXIsICd2aWRlby10cmFuc2NyaXB0cycpO1xuICAgIHRoaXMua25vd2xlZGdlQmFzZUZpbGUgPSBwYXRoLmpvaW4oZGF0YURpciwgJ0FJX0tub3dsZWRnZV9CYXNlLm1kJyk7XG5cbiAgICBjb25zb2xlLmxvZyhgW3YyXSBVc2luZyBkYXRhIGRpcmVjdG9yeTogJHtkYXRhRGlyfWApO1xuXG4gICAgLy8gRW5zdXJlIGRpcmVjdG9yaWVzIGV4aXN0XG4gICAgZnMubWtkaXJTeW5jKHRoaXMucmVwb3J0c0RpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgZnMubWtkaXJTeW5jKHRoaXMudHJhbnNjcmlwdHNEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGZzLm1rZGlyU3luYyhwYXRoLmpvaW4oZGF0YURpciwgJ3RlbXBfc3VicycpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcblxuICAgIHRoaXMuc3RhdGUgPSB0aGlzLmxvYWRTdGF0ZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBsb2FkU3RhdGUoKTogUHJvY2Vzc2luZ1N0YXRlIHtcbiAgICB0cnkge1xuICAgICAgaWYgKGZzLmV4aXN0c1N5bmModGhpcy5zdGF0ZUZpbGVQYXRoKSkge1xuICAgICAgICBjb25zdCBzdGF0ZSA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHRoaXMuc3RhdGVGaWxlUGF0aCwgJ3V0Zi04JykpO1xuICAgICAgICAvLyBNaWdyYXRlIG9sZCBzdGF0ZSBpZiBuZWVkZWRcbiAgICAgICAgaWYgKHN0YXRlLnZlcnNpb24gIT09ICcyLjAnKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1t2Ml0gTWlncmF0aW5nIHN0YXRlIHRvIHYyIGZvcm1hdC4uLicpO1xuICAgICAgICAgIHN0YXRlLnZlcnNpb24gPSAnMi4wJztcbiAgICAgICAgICBzdGF0ZS5xdWV1ZSA9IHN0YXRlLnF1ZXVlLm1hcCgodjogYW55KSA9PiAoe1xuICAgICAgICAgICAgLi4udixcbiAgICAgICAgICAgIHByb2Nlc3NpbmdBdHRlbXB0czogdi5wcm9jZXNzaW5nQXR0ZW1wdHMgfHwgMCxcbiAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdbdjJdIENyZWF0aW5nIG5ldyBzdGF0ZSBmaWxlJyk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICB2ZXJzaW9uOiAnMi4wJyxcbiAgICAgIHF1ZXVlOiBbXSxcbiAgICAgIGN1cnJlbnRJbmRleDogMCxcbiAgICAgIHN0YXJ0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgbGFzdFVwZGF0ZWQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIHN0YXRzOiB7XG4gICAgICAgIHRvdGFsVmlkZW9zOiAwLFxuICAgICAgICBtZXRhZGF0YUNvbXBsZXRlOiAwLFxuICAgICAgICB0cmFuc2NyaXB0c0V4dHJhY3RlZDogMCxcbiAgICAgICAgYW5hbHl6ZWQ6IDAsXG4gICAgICAgIG5lZWRzVmlzdWFsUmV2aWV3OiAwLFxuICAgICAgICBjb21wbGV0ZWQ6IDAsXG4gICAgICAgIHNraXBwZWQ6IDAsXG4gICAgICAgIGVycm9yczogMCxcbiAgICAgICAgYW5hbHlzaXNTdWNjZXNzUmF0ZTogMCxcbiAgICAgICAgYXZlcmFnZVRyYW5zY3JpcHRMZW5ndGg6IDAsXG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIHNhdmVTdGF0ZSgpOiB2b2lkIHtcbiAgICB0aGlzLnN0YXRlLmxhc3RVcGRhdGVkID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgIHRoaXMudXBkYXRlU3RhdHMoKTtcbiAgICBmcy5ta2RpclN5bmMocGF0aC5kaXJuYW1lKHRoaXMuc3RhdGVGaWxlUGF0aCksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGZzLndyaXRlRmlsZVN5bmModGhpcy5zdGF0ZUZpbGVQYXRoLCBKU09OLnN0cmluZ2lmeSh0aGlzLnN0YXRlLCBudWxsLCAyKSk7XG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZVN0YXRzKCk6IHZvaWQge1xuICAgIGNvbnN0IHMgPSB0aGlzLnN0YXRlLnN0YXRzO1xuICAgIGNvbnN0IGFuYWx5emVkID0gdGhpcy5zdGF0ZS5xdWV1ZS5maWx0ZXIoKHYpID0+IHYuYW5hbHlzaXMpLmxlbmd0aDtcbiAgICBjb25zdCBhdHRlbXB0ZWQgPSB0aGlzLnN0YXRlLnF1ZXVlLmZpbHRlcigodikgPT4gdi5wcm9jZXNzaW5nQXR0ZW1wdHMgPiAwKS5sZW5ndGg7XG4gICAgcy5hbmFseXNpc1N1Y2Nlc3NSYXRlID0gYXR0ZW1wdGVkID4gMCA/IChhbmFseXplZCAvIGF0dGVtcHRlZCkgKiAxMDAgOiAwO1xuXG4gICAgY29uc3QgdHJhbnNjcmlwdHMgPSB0aGlzLnN0YXRlLnF1ZXVlLmZpbHRlcigodikgPT4gdi50cmFuc2NyaXB0KTtcbiAgICBzLmF2ZXJhZ2VUcmFuc2NyaXB0TGVuZ3RoID1cbiAgICAgIHRyYW5zY3JpcHRzLmxlbmd0aCA+IDBcbiAgICAgICAgPyB0cmFuc2NyaXB0cy5yZWR1Y2UoKHN1bSwgdikgPT4gc3VtICsgKHYudHJhbnNjcmlwdD8ubGVuZ3RoIHx8IDApLCAwKSAvIHRyYW5zY3JpcHRzLmxlbmd0aFxuICAgICAgICA6IDA7XG4gIH1cblxuICBwcml2YXRlIGV4dHJhY3RWaWRlb0lkKHVybDogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgY29uc3QgcGF0dGVybnMgPSBbXG4gICAgICAvKD86eW91dHViZVxcLmNvbVxcL3dhdGNoXFw/dj18eW91dHVcXC5iZVxcL3x5b3V0dWJlXFwuY29tXFwvZW1iZWRcXC8pKFteJlxccz9dKykvLFxuICAgICAgL3lvdXR1YmVcXC5jb21cXC92XFwvKFteJlxccz9dKykvLFxuICAgIF07XG4gICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIHBhdHRlcm5zKSB7XG4gICAgICBjb25zdCBtYXRjaCA9IHVybC5tYXRjaChwYXR0ZXJuKTtcbiAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXR1cm4gbWF0Y2hbMV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgZm9ybWF0RHVyYXRpb24oc2Vjb25kczogbnVtYmVyKTogc3RyaW5nIHtcbiAgICBjb25zdCBob3VycyA9IE1hdGguZmxvb3Ioc2Vjb25kcyAvIDM2MDApO1xuICAgIGNvbnN0IG1pbnV0ZXMgPSBNYXRoLmZsb29yKChzZWNvbmRzICUgMzYwMCkgLyA2MCk7XG4gICAgY29uc3Qgc2VjcyA9IE1hdGguZmxvb3Ioc2Vjb25kcyAlIDYwKTtcblxuICAgIGlmIChob3VycyA+IDApIHtcbiAgICAgIHJldHVybiBgJHtob3Vyc306JHttaW51dGVzLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKX06JHtzZWNzLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKX1gO1xuICAgIH1cbiAgICByZXR1cm4gYCR7bWludXRlc306JHtzZWNzLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKX1gO1xuICB9XG5cbiAgZGVjb2RlSHRtbEVudGl0aWVzKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRleHRcbiAgICAgIC5yZXBsYWNlKC8mYW1wOy9nLCAnJicpXG4gICAgICAucmVwbGFjZSgvJmx0Oy9nLCAnPCcpXG4gICAgICAucmVwbGFjZSgvJmd0Oy9nLCAnPicpXG4gICAgICAucmVwbGFjZSgvJnF1b3Q7L2csICdcIicpXG4gICAgICAucmVwbGFjZSgvJiMzOTsvZywgXCInXCIpXG4gICAgICAucmVwbGFjZSgvJiN4Mjc7L2csIFwiJ1wiKVxuICAgICAgLnJlcGxhY2UoLyYjeDJGOy9nLCAnLycpO1xuICB9XG5cbiAgYXN5bmMgaW5pdGlhbGl6ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyBVc2UgYSBORVcgcHJvZmlsZSB0byBhbGxvdyB0cnlpbmcgYSBkaWZmZXJlbnQgYWNjb3VudFxuICAgIGNvbnN0IHByb2ZpbGVEaXIgPSBwYXRoLmpvaW4ocHJvY2Vzcy5lbnYuSE9NRSB8fCAnL3RtcCcsICcudmlkZW8tcHJvY2Vzc29yLWNocm9tZS1jbGVhbicpO1xuXG4gICAgY29uc29sZS5sb2coJ1t2Ml0g8J+agCBMYXVuY2hpbmcgQ2hyb21lICh1c2luZyBjbGVhbiBsb2dpbiBzZXNzaW9uKS4uLicpO1xuICAgIGZzLm1rZGlyU3luYyhwcm9maWxlRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcblxuICAgIHRoaXMuY29udGV4dCA9IGF3YWl0IGNocm9taXVtLmxhdW5jaFBlcnNpc3RlbnRDb250ZXh0KHByb2ZpbGVEaXIsIHtcbiAgICAgIGhlYWRsZXNzOiBmYWxzZSxcbiAgICAgIGNoYW5uZWw6ICdjaHJvbWUnLFxuICAgICAgYXJnczogW1xuICAgICAgICAnLS1uby1maXJzdC1ydW4nLFxuICAgICAgICAnLS1uby1kZWZhdWx0LWJyb3dzZXItY2hlY2snLFxuICAgICAgICAnLS1kaXNhYmxlLWJsaW5rLWZlYXR1cmVzPUF1dG9tYXRpb25Db250cm9sbGVkJyxcbiAgICAgICAgJy0td2luZG93LXNpemU9MTI4MCw4MDAnLFxuICAgICAgXSxcbiAgICAgIHZpZXdwb3J0OiBudWxsLFxuICAgICAgaWdub3JlRGVmYXVsdEFyZ3M6IFsnLS1lbmFibGUtYXV0b21hdGlvbiddLFxuICAgICAgdXNlckFnZW50OlxuICAgICAgICAnTW96aWxsYS81LjAgKE1hY2ludG9zaDsgSW50ZWwgTWFjIE9TIFggMTBfMTVfNykgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyMC4wLjAuMCBTYWZhcmkvNTM3LjM2JyxcbiAgICB9KTtcblxuICAgIGNvbnNvbGUubG9nKCdbdjJdIOKchSBCcm93c2VyIHJlYWR5Jyk7XG4gIH1cblxuICAvLyBCcm93c2VyIGhlYWx0aCBjaGVjayAtIGVuc3VyZXMgYnJvd3NlciBjb250ZXh0IGlzIGFsaXZlXG4gIHByaXZhdGUgYXN5bmMgZW5zdXJlQnJvd3NlckhlYWx0aCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgaWYgKCF0aGlzLmNvbnRleHQpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbdjJdIOKaoO+4jyBCcm93c2VyIGNvbnRleHQgaXMgbnVsbCwgcmVpbml0aWFsaXppbmcuLi4nKTtcbiAgICAgICAgYXdhaXQgdGhpcy5pbml0aWFsaXplKCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBUcnkgdG8gY2hlY2sgaWYgY29udGV4dCBpcyBhbGl2ZSBieSBnZXR0aW5nIHBhZ2VzXG4gICAgICBjb25zdCBwYWdlcyA9IGF3YWl0IHRoaXMuY29udGV4dC5wYWdlcygpO1xuICAgICAgY29uc29sZS5sb2coYFt2Ml0g8J+PpSBCcm93c2VyIGhlYWx0aCBjaGVjazogJHtwYWdlcy5sZW5ndGh9IHBhZ2VzIG9wZW5gKTtcblxuICAgICAgLy8gSWYgdG9vIG1hbnkgcGFnZXMgYWNjdW11bGF0ZWQgKD41MCksIGNsb3NlIHRoZW1cbiAgICAgIGlmIChwYWdlcy5sZW5ndGggPiA1MCkge1xuICAgICAgICBjb25zb2xlLndhcm4oYFt2Ml0g4pqg77iPIFRvbyBtYW55IHBhZ2VzIG9wZW4gKCR7cGFnZXMubGVuZ3RofSksIGNsZWFuaW5nIHVwLi4uYCk7XG4gICAgICAgIGZvciAoY29uc3QgcGFnZSBvZiBwYWdlcykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBwYWdlLmNsb3NlKCk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gSWdub3JlIGNsb3NlIGVycm9yc1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignW3YyXSDinYwgQnJvd3NlciBoZWFsdGggY2hlY2sgZmFpbGVkOicsIGVycm9yKTtcbiAgICAgIGNvbnNvbGUubG9nKCdbdjJdIPCflIQgUmVpbml0aWFsaXppbmcgYnJvd3Nlci4uLicpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0Py5jbG9zZSgpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvKiBpZ25vcmUgKi9cbiAgICAgIH1cbiAgICAgIGF3YWl0IHRoaXMuaW5pdGlhbGl6ZSgpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgLy8gSGVscGVyIGZvciBodW1hbi1saWtlIGRlbGF5c1xuICBwcml2YXRlIGFzeW5jIGh1bWFuRGVsYXkobWluOiBudW1iZXIsIG1heDogbnVtYmVyLCBwYWdlOiBQYWdlKSB7XG4gICAgY29uc3QgZGVsYXkgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKSArIG1pbik7XG4gICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dChkZWxheSk7XG4gIH1cblxuICAvLyBIZWxwZXIgZm9yIGh1bWFuLWxpa2UgbW91c2UgbW92ZW1lbnRcbiAgcHJpdmF0ZSBhc3luYyBodW1hbk1vdmUocGFnZTogUGFnZSwgc2VsZWN0b3I6IHN0cmluZykge1xuICAgIGNvbnN0IGVsZW1lbnQgPSBhd2FpdCBwYWdlLiQoc2VsZWN0b3IpO1xuICAgIGlmICghZWxlbWVudCkgcmV0dXJuO1xuXG4gICAgY29uc3QgYm94ID0gYXdhaXQgZWxlbWVudC5ib3VuZGluZ0JveCgpO1xuICAgIGlmICghYm94KSByZXR1cm47XG5cbiAgICAvLyBTdGFydCBmcm9tIHJhbmRvbSBwb3NpdGlvblxuICAgIGF3YWl0IHBhZ2UubW91c2UubW92ZShNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA1MDApLCBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA1MDApKTtcblxuICAgIC8vIE1vdmUgdG8gdGFyZ2V0IHdpdGggXCJvdmVyc2hvb3RcIiBlZmZlY3Qgc2ltdWxhdGlvbiAoc2ltcGxlIHN0ZXBzKVxuICAgIGNvbnN0IHRhcmdldFggPSBib3gueCArIGJveC53aWR0aCAvIDI7XG4gICAgY29uc3QgdGFyZ2V0WSA9IGJveC55ICsgYm94LmhlaWdodCAvIDI7XG4gICAgYXdhaXQgcGFnZS5tb3VzZS5tb3ZlKHRhcmdldFgsIHRhcmdldFksIHsgc3RlcHM6IDI1IH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzb2x2ZUdvb2dsZUNhcHRjaGEocGFnZTogUGFnZSkge1xuICAgIGNvbnNvbGUubG9nKCdbdjJdIOKaoO+4jyBEZXRlY3RlZCBHb29nbGUgUm9ib3QgQ2hlY2suIEF0dGVtcHRpbmcgdG8gc29sdmUuLi4nKTtcblxuICAgIC8vIDEuIExvb2sgZm9yIHRoZSBpZnJhbWVcbiAgICBjb25zdCBmcmFtZXMgPSBwYWdlLmZyYW1lcygpO1xuICAgIGNvbnN0IHJlY2FwdGNoYUZyYW1lID0gZnJhbWVzLmZpbmQoKGYpID0+IGYudXJsKCkuaW5jbHVkZXMoJ2dvb2dsZS5jb20vcmVjYXB0Y2hhJykpO1xuXG4gICAgaWYgKHJlY2FwdGNoYUZyYW1lKSB7XG4gICAgICBjb25zb2xlLmxvZygnW3YyXSBGb3VuZCByZUNBUFRDSEEgZnJhbWUuIENsaWNraW5nIGNoZWNrYm94Li4uJyk7XG5cbiAgICAgIGNvbnN0IGNoZWNrYm94ID0gYXdhaXQgcmVjYXB0Y2hhRnJhbWUuJCgnLnJlY2FwdGNoYS1jaGVja2JveC1ib3JkZXIsICNyZWNhcHRjaGEtYW5jaG9yJyk7XG4gICAgICBpZiAoY2hlY2tib3gpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5odW1hbkRlbGF5KDEwMDAsIDMwMDAsIHBhZ2UpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gVXNlIFBsYXl3cmlnaHQncyBuYXRpdmUgaGFuZGxpbmcgd2hpY2ggY29ycmVjdGx5IG1hcHMgaWZyYW1lIGNvb3JkaW5hdGVzXG4gICAgICAgICAgYXdhaXQgY2hlY2tib3guaG92ZXIoKTtcbiAgICAgICAgICBhd2FpdCB0aGlzLmh1bWFuRGVsYXkoMjAwLCA1MDAsIHBhZ2UpO1xuICAgICAgICAgIGF3YWl0IGNoZWNrYm94LmNsaWNrKHsgZGVsYXk6IE1hdGgucmFuZG9tKCkgKiAxMDAgKyA1MCB9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIENsaWNrIGZhaWxlZCwgdHJ5aW5nIGZvcmNlIGNsaWNrJywgZSk7XG4gICAgICAgICAgYXdhaXQgY2hlY2tib3guZGlzcGF0Y2hFdmVudCgnY2xpY2snKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIENsaWNrZWQgY2hlY2tib3guIFdhaXRpbmcgZm9yIG91dGNvbWUuLi4nKTtcbiAgICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCg1MDAwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIENvdWxkIG5vdCBmaW5kIGNoZWNrYm94IGluc2lkZSBmcmFtZS4nKTtcbiAgICAgICAgLy8gVGFrZSBhIHNjcmVlbnNob3QgZm9yIHZhbGlkIGRlYnVnZ2luZ1xuICAgICAgICBhd2FpdCBwYWdlLnNjcmVlbnNob3QoeyBwYXRoOiBwYXRoLmpvaW4odGhpcy5yZXBvcnRzRGlyLCAnY2FwdGNoYV9mYWlsLnBuZycpIH0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBGYWxsYmFjazogbG9va2luZyBmb3Igbm9ybWFsIGJ1dHRvbnMgaWYgaXQncyBub3QgYW4gaWZyYW1lIGNhcHRjaGFcbiAgICAgIGNvbnN0IGJ1dHRvbiA9IGF3YWl0IHBhZ2UuJCgnI0wyQUdMYiwgW2FyaWEtbGFiZWw9XCJJIGFncmVlXCJdLCBidXR0b246aGFzLXRleHQoXCJJIGFncmVlXCIpJyk7XG4gICAgICBpZiAoYnV0dG9uKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIEZvdW5kIHNpbXBsZSBjb25zZW50IGJ1dHRvbi4gQ2xpY2tpbmcuLi4nKTtcbiAgICAgICAgYXdhaXQgdGhpcy5odW1hbk1vdmUocGFnZSwgJyNMMkFHTGInKTsgLy8gbW92ZSB0byBjb25zZW50XG4gICAgICAgIGF3YWl0IGJ1dHRvbi5jbGljaygpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIHdlIGFyZSBzdGlsbCBzdHVja1xuICAgIGlmIChwYWdlLnVybCgpLmluY2x1ZGVzKCdnb29nbGUuY29tL3NvcnJ5LycpKSB7XG4gICAgICBjb25zb2xlLmxvZygnW3YyXSBTdGlsbCBvbiBzb3JyeSBwYWdlLiBXYWl0aW5nIGZvciB1c2VyIGludGVydmVudGlvbiBvciBJUCByb3RhdGlvbi4uLicpO1xuICAgICAgLy8gSW4gYSByZWFsIGhlYWRsZXNzIHNjZW5hcmlvLCB3ZSdkIG5lZWQgYSBjYXB0Y2hhIHNlcnZpY2UgaGVyZS5cbiAgICAgIC8vIEZvciBub3csIHdlIHdhaXQgYSBiaXQgdG8gc2VlIGlmIGl0IGNsZWFycyBvciBpZiB3ZSBjYW4gcHJvY2VlZC5cbiAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoNTAwMCk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZmV0Y2hFbnJpY2hlZE1ldGFkYXRhKHZpZGVvOiBWaWRlb0VudHJ5KTogUHJvbWlzZTxWaWRlb01ldGFkYXRhIHwgbnVsbD4ge1xuICAgIGlmICghdGhpcy5jb250ZXh0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Jyb3dzZXIgbm90IGluaXRpYWxpemVkJyk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coYFt2Ml0g8J+TiiBFbnJpY2hlZCBtZXRhZGF0YSBmZXRjaDogJHt2aWRlby50aXRsZX1gKTtcblxuICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCB0aGlzLmNvbnRleHQubmV3UGFnZSgpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHF1ZXJ5ID0gYFlvdVR1YmUgdmlkZW8gXCIke3ZpZGVvLnVybH1cIiBjb21wbGV0ZSBpbmZvcm1hdGlvbjogZHVyYXRpb24sIGNoYW5uZWwsIGRlc2NyaXB0aW9uLCB2aWV3cywgcHVibGlzaCBkYXRlLCB0b3BpY3MsIHN1bW1hcnlgO1xuICAgICAgY29uc3Qgc2VhcmNoVXJsID0gYGh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vc2VhcmNoP3E9JHtlbmNvZGVVUklDb21wb25lbnQocXVlcnkpfSZ1ZG09NTBgO1xuXG4gICAgICBhd2FpdCBwYWdlLmdvdG8oc2VhcmNoVXJsLCB7IHdhaXRVbnRpbDogJ2RvbWNvbnRlbnRsb2FkZWQnLCB0aW1lb3V0OiAzMDAwMCB9KTtcblxuICAgICAgLy8gQ2hlY2sgZm9yIEdvb2dsZSBSb2JvdCBDaGVja1xuICAgICAgaWYgKFxuICAgICAgICBwYWdlLnVybCgpLmluY2x1ZGVzKCdnb29nbGUuY29tL3NvcnJ5LycpIHx8XG4gICAgICAgIChhd2FpdCBwYWdlLiQoJ3RleHQ9XCJ1bnVzdWFsIHRyYWZmaWNcIicpKSB8fFxuICAgICAgICAoYXdhaXQgcGFnZS4kKCdpZnJhbWVbc3JjKj1cInJlY2FwdGNoYVwiXScpKVxuICAgICAgKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuc29sdmVHb29nbGVDYXB0Y2hhKHBhZ2UpO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDUwMDApOyAvLyBMZXQgQUkgbW9kZSBnZW5lcmF0ZSByZXNwb25zZVxuXG4gICAgICBjb25zdCBwYWdlVGV4dCA9IGF3YWl0IHBhZ2UuZXZhbHVhdGUoKCkgPT4gZG9jdW1lbnQuYm9keS5pbm5lclRleHQpO1xuXG4gICAgICBsZXQgZHVyYXRpb24gPSAwO1xuICAgICAgY29uc3QgZHVyYXRpb25QYXR0ZXJucyA9IFtcbiAgICAgICAgLyhcXGQrKVxccypob3Vycz9cXHMqLD9cXHMqKFxcZCspP1xccyptaW51dGVzP1xccyosP1xccyooXFxkKyk/XFxzKnNlY29uZHM/L2ksXG4gICAgICAgIC8oXFxkKylcXHMqbWludXRlcz9cXHMqLD9cXHMqKFxcZCspP1xccypzZWNvbmRzPy9pLFxuICAgICAgICAvKFxcZCspOihcXGQrKTooXFxkKykvLFxuICAgICAgICAvKFxcZCspOihcXGQrKS8sXG4gICAgICAgIC9kdXJhdGlvbls6XFxzXSooXFxkKyk6KFxcZCspL2ksXG4gICAgICBdO1xuXG4gICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgZHVyYXRpb25QYXR0ZXJucykge1xuICAgICAgICBjb25zdCBtYXRjaCA9IHBhZ2VUZXh0Lm1hdGNoKHBhdHRlcm4pO1xuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICBpZiAobWF0Y2hbMF0udG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnaG91cicpKSB7XG4gICAgICAgICAgICBkdXJhdGlvbiA9XG4gICAgICAgICAgICAgIHBhcnNlSW50KG1hdGNoWzFdKSAqIDM2MDAgK1xuICAgICAgICAgICAgICBwYXJzZUludChtYXRjaFsyXSB8fCAnMCcpICogNjAgK1xuICAgICAgICAgICAgICBwYXJzZUludChtYXRjaFszXSB8fCAnMCcpO1xuICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2hbMF0udG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnbWludXRlJykpIHtcbiAgICAgICAgICAgIGR1cmF0aW9uID0gcGFyc2VJbnQobWF0Y2hbMV0pICogNjAgKyBwYXJzZUludChtYXRjaFsyXSB8fCAnMCcpO1xuICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2gubGVuZ3RoID09PSA0KSB7XG4gICAgICAgICAgICBkdXJhdGlvbiA9IHBhcnNlSW50KG1hdGNoWzFdKSAqIDM2MDAgKyBwYXJzZUludChtYXRjaFsyXSkgKiA2MCArIHBhcnNlSW50KG1hdGNoWzNdKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAgICAgZHVyYXRpb24gPSBwYXJzZUludChtYXRjaFsxXSkgKiA2MCArIHBhcnNlSW50KG1hdGNoWzJdKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgY2hhbm5lbFBhdHRlcm5zID0gW1xuICAgICAgICAvKD86Ynl8Y2hhbm5lbHxmcm9tKVxccyooW0EtWmEtejAtOVxcc1xcLV9dKz8pKD86XFxzKlvCt+KAolxcLXxdfFxccypcXGR8dmlld3N8c3Vic2NyaWJlcnN8JCkvaSxcbiAgICAgICAgL3VwbG9hZGVkIGJ5XFxzKihbQS1aYS16MC05XFxzXFwtX10rKS9pLFxuICAgICAgXTtcbiAgICAgIGxldCBjaGFubmVsOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgY2hhbm5lbFBhdHRlcm5zKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gcGFnZVRleHQubWF0Y2gocGF0dGVybik7XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgIGNoYW5uZWwgPSBtYXRjaFsxXS50cmltKCkuc3Vic3RyaW5nKDAsIDUwKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCB2aWV3TWF0Y2ggPSBwYWdlVGV4dC5tYXRjaCgvKFxcZCsoPzosXFxkKykqKD86XFwuXFxkKyk/W0tNQl0/KVxccyp2aWV3cz8vaSk7XG5cbiAgICAgIGNvbnN0IGRhdGVQYXR0ZXJucyA9IFtcbiAgICAgICAgLyg/OnB1Ymxpc2hlZHx1cGxvYWRlZHxwb3N0ZWQpXFxzKig/Om9uXFxzKik/KFtBLVphLXpdK1xccytcXGQrLD9cXHMqXFxkezR9KS9pLFxuICAgICAgICAvKFxcZCtcXHMqKD86ZGF5cz98d2Vla3M/fG1vbnRocz98eWVhcnM/KVxccyphZ28pL2ksXG4gICAgICBdO1xuICAgICAgbGV0IHB1Ymxpc2hEYXRlOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgZGF0ZVBhdHRlcm5zKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gcGFnZVRleHQubWF0Y2gocGF0dGVybik7XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgIHB1Ymxpc2hEYXRlID0gbWF0Y2hbMV07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgZGVzY01hdGNoID0gcGFnZVRleHQubWF0Y2goLyg/OmRlc2NyaXB0aW9ufGFib3V0KVs6XFxzXSooW14uXStcXC5bXi5dK1xcLikvaSk7XG4gICAgICBjb25zdCBzdW1tYXJ5TWF0Y2ggPSBwYWdlVGV4dC5tYXRjaCgvKD86c3VtbWFyeXxvdmVydmlld3x0aGlzIHZpZGVvKVs6XFxzXSooW14uXStcXC5bXi5dK1xcLikvaSk7XG5cbiAgICAgIGNvbnN0IG1ldGFkYXRhOiBWaWRlb01ldGFkYXRhID0ge1xuICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgZHVyYXRpb25Gb3JtYXR0ZWQ6IHRoaXMuZm9ybWF0RHVyYXRpb24oZHVyYXRpb24pLFxuICAgICAgICBjaGFubmVsLFxuICAgICAgICB2aWV3Q291bnQ6IHZpZXdNYXRjaCA/IHZpZXdNYXRjaFsxXSA6IHVuZGVmaW5lZCxcbiAgICAgICAgcHVibGlzaERhdGUsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjTWF0Y2ggPyBkZXNjTWF0Y2hbMV0uc3Vic3RyaW5nKDAsIDUwMCkgOiB1bmRlZmluZWQsXG4gICAgICAgIHN1bW1hcnk6IHN1bW1hcnlNYXRjaCA/IHN1bW1hcnlNYXRjaFsxXS5zdWJzdHJpbmcoMCwgMzAwKSA6IHVuZGVmaW5lZCxcbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcbiAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBgW3YyXSDinIUgTWV0YWRhdGE6ICR7bWV0YWRhdGEuZHVyYXRpb25Gb3JtYXR0ZWR9IHwgJHttZXRhZGF0YS5jaGFubmVsIHx8ICdVbmtub3duIGNoYW5uZWwnfWBcbiAgICAgICk7XG4gICAgICByZXR1cm4gbWV0YWRhdGE7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihgW3YyXSBFcnJvciBpbiBtZXRhZGF0YSBmZXRjaDpgLCBlKTtcbiAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGV4dHJhY3RUcmFuc2NyaXB0RGlyZWN0KHZpZGVvOiBWaWRlb0VudHJ5KTogUHJvbWlzZTxUcmFuc2NyaXB0U2VnbWVudFtdIHwgbnVsbD4ge1xuICAgIGlmICghdGhpcy5jb250ZXh0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Jyb3dzZXIgbm90IGluaXRpYWxpemVkJyk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coYFt2Ml0g8J+TnSBUcmFuc2NyaXB0IGV4dHJhY3Rpb246ICR7dmlkZW8udmlkZW9JZH1gKTtcblxuICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCB0aGlzLmNvbnRleHQubmV3UGFnZSgpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHBhZ2UuZ290byh2aWRlby51cmwsIHsgd2FpdFVudGlsOiAnbG9hZCcsIHRpbWVvdXQ6IDQ1MDAwIH0pO1xuICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgzMDAwKTtcblxuICAgICAgY29uc3QgY2FwdGlvbkRhdGEgPSBhd2FpdCBwYWdlLmV2YWx1YXRlKCgpID0+IHtcbiAgICAgICAgY29uc3Qgd2luID0gd2luZG93IGFzIGFueTtcbiAgICAgICAgaWYgKHdpbi55dEluaXRpYWxQbGF5ZXJSZXNwb25zZT8uY2FwdGlvbnM/LnBsYXllckNhcHRpb25zVHJhY2tsaXN0UmVuZGVyZXI/LmNhcHRpb25UcmFja3MpIHtcbiAgICAgICAgICBjb25zdCB0cmFja3MgPVxuICAgICAgICAgICAgd2luLnl0SW5pdGlhbFBsYXllclJlc3BvbnNlLmNhcHRpb25zLnBsYXllckNhcHRpb25zVHJhY2tsaXN0UmVuZGVyZXIuY2FwdGlvblRyYWNrcztcbiAgICAgICAgICBjb25zdCB0cmFjayA9IHRyYWNrcy5maW5kKCh0OiBhbnkpID0+IHQubGFuZ3VhZ2VDb2RlID09PSAnZW4nKSB8fCB0cmFja3NbMF07XG4gICAgICAgICAgcmV0dXJuIHRyYWNrPy5iYXNlVXJsIHx8IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzY3JpcHRzID0gQXJyYXkuZnJvbShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdzY3JpcHQnKSk7XG4gICAgICAgIGZvciAoY29uc3Qgc2NyaXB0IG9mIHNjcmlwdHMpIHtcbiAgICAgICAgICBjb25zdCB0ZXh0ID0gc2NyaXB0LnRleHRDb250ZW50IHx8ICcnO1xuICAgICAgICAgIGlmICh0ZXh0LmluY2x1ZGVzKCdjYXB0aW9uVHJhY2tzJykpIHtcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gdGV4dC5tYXRjaCgvXCJjYXB0aW9uVHJhY2tzXCI6XFxzKlxcWyguKj8pXFxdLyk7XG4gICAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCB0cmFja3NTdHIgPSAnWycgKyBtYXRjaFsxXSArICddJztcbiAgICAgICAgICAgICAgICBjb25zdCB0cmFja3MgPSBKU09OLnBhcnNlKHRyYWNrc1N0cik7XG4gICAgICAgICAgICAgICAgaWYgKHRyYWNrcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCB0cmFjayA9IHRyYWNrcy5maW5kKCh0OiBhbnkpID0+IHQubGFuZ3VhZ2VDb2RlID09PSAnZW4nKSB8fCB0cmFja3NbMF07XG4gICAgICAgICAgICAgICAgICByZXR1cm4gdHJhY2s/LmJhc2VVcmwgfHwgbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSk7XG5cbiAgICAgIGlmIChjYXB0aW9uRGF0YSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgW3YyXSBGb3VuZCBjYXB0aW9uIFVSTCwgZmV0Y2hpbmcgdHJhbnNjcmlwdC4uLmApO1xuXG4gICAgICAgIGNvbnN0IGNhcHRpb25QYWdlID0gYXdhaXQgdGhpcy5jb250ZXh0IS5uZXdQYWdlKCk7XG4gICAgICAgIGF3YWl0IGNhcHRpb25QYWdlLmdvdG8oY2FwdGlvbkRhdGEsIHsgd2FpdFVudGlsOiAnbG9hZCcsIHRpbWVvdXQ6IDMwMDAwIH0pO1xuICAgICAgICBjb25zdCB4bWwgPSBhd2FpdCBjYXB0aW9uUGFnZS5jb250ZW50KCk7XG4gICAgICAgIGF3YWl0IGNhcHRpb25QYWdlLmNsb3NlKCk7XG5cbiAgICAgICAgY29uc3Qgc2VnbWVudHM6IFRyYW5zY3JpcHRTZWdtZW50W10gPSBbXTtcbiAgICAgICAgY29uc3QgdGV4dFJlZ2V4ID0gLzx0ZXh0IHN0YXJ0PVwiKFtcXGQuXSspXCIgZHVyPVwiKFtcXGQuXSspXCJbXj5dKj4oW148XSopPFxcL3RleHQ+L2c7XG4gICAgICAgIGxldCBtYXRjaDtcblxuICAgICAgICB3aGlsZSAoKG1hdGNoID0gdGV4dFJlZ2V4LmV4ZWMoeG1sKSkgIT09IG51bGwpIHtcbiAgICAgICAgICBzZWdtZW50cy5wdXNoKHtcbiAgICAgICAgICAgIHN0YXJ0OiBwYXJzZUZsb2F0KG1hdGNoWzFdKSxcbiAgICAgICAgICAgIGR1cmF0aW9uOiBwYXJzZUZsb2F0KG1hdGNoWzJdKSxcbiAgICAgICAgICAgIHRleHQ6IHRoaXMuZGVjb2RlSHRtbEVudGl0aWVzKG1hdGNoWzNdKSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZWdtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIOKchSBFeHRyYWN0ZWQgJHtzZWdtZW50cy5sZW5ndGh9IHRyYW5zY3JpcHQgc2VnbWVudHNgKTtcbiAgICAgICAgICByZXR1cm4gc2VnbWVudHM7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coJ1t2Ml0gVHJ5aW5nIFVJIHRyYW5zY3JpcHQgcGFuZWwuLi4nKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZXhwYW5kQnRuID0gcGFnZS5sb2NhdG9yKCcjZXhwYW5kLCB0cC15dC1wYXBlci1idXR0b24jZXhwYW5kJyk7XG4gICAgICAgIGlmICgoYXdhaXQgZXhwYW5kQnRuLmNvdW50KCkpID4gMCkge1xuICAgICAgICAgIGF3YWl0IGV4cGFuZEJ0bi5maXJzdCgpLmNsaWNrKCk7XG4gICAgICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgxMDAwKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkge31cblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdHJhbnNjcmlwdEJ0biA9IHBhZ2UubG9jYXRvcihcbiAgICAgICAgICAnW2FyaWEtbGFiZWwqPVwidHJhbnNjcmlwdFwiXSwgYnV0dG9uOmhhcy10ZXh0KFwidHJhbnNjcmlwdFwiKSdcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKChhd2FpdCB0cmFuc2NyaXB0QnRuLmNvdW50KCkpID4gMCkge1xuICAgICAgICAgIGF3YWl0IHRyYW5zY3JpcHRCdG4uZmlyc3QoKS5jbGljaygpO1xuICAgICAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMjAwMCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHt9XG5cbiAgICAgIGNvbnN0IHVpU2VnbWVudHMgPSBhd2FpdCBwYWdlLmV2YWx1YXRlKCgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0OiBBcnJheTx7IHN0YXJ0OiBudW1iZXI7IGR1cmF0aW9uOiBudW1iZXI7IHRleHQ6IHN0cmluZyB9PiA9IFtdO1xuICAgICAgICBjb25zdCBzZWdtZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3l0ZC10cmFuc2NyaXB0LXNlZ21lbnQtcmVuZGVyZXInKTtcbiAgICAgICAgc2VnbWVudHMuZm9yRWFjaCgoc2VnOiBFbGVtZW50KSA9PiB7XG4gICAgICAgICAgY29uc3QgdGltZUVsID0gc2VnLnF1ZXJ5U2VsZWN0b3IoJy5zZWdtZW50LXRpbWVzdGFtcCcpO1xuICAgICAgICAgIGNvbnN0IHRleHRFbCA9IHNlZy5xdWVyeVNlbGVjdG9yKCcuc2VnbWVudC10ZXh0Jyk7XG4gICAgICAgICAgaWYgKHRpbWVFbCAmJiB0ZXh0RWwpIHtcbiAgICAgICAgICAgIGNvbnN0IHRpbWUgPSB0aW1lRWwudGV4dENvbnRlbnQ/LnRyaW0oKSB8fCAnMDowMCc7XG4gICAgICAgICAgICBjb25zdCB0ZXh0ID0gdGV4dEVsLnRleHRDb250ZW50Py50cmltKCkgfHwgJyc7XG4gICAgICAgICAgICBjb25zdCBwYXJ0cyA9IHRpbWUuc3BsaXQoJzonKS5tYXAoKHA6IHN0cmluZykgPT4gcGFyc2VJbnQocCkgfHwgMCk7XG4gICAgICAgICAgICBjb25zdCBzZWNvbmRzID1cbiAgICAgICAgICAgICAgcGFydHMubGVuZ3RoID09PSAzXG4gICAgICAgICAgICAgICAgPyBwYXJ0c1swXSAqIDM2MDAgKyBwYXJ0c1sxXSAqIDYwICsgcGFydHNbMl1cbiAgICAgICAgICAgICAgICA6IHBhcnRzWzBdICogNjAgKyAocGFydHNbMV0gfHwgMCk7XG4gICAgICAgICAgICBpZiAodGV4dCkge1xuICAgICAgICAgICAgICByZXN1bHQucHVzaCh7IHN0YXJ0OiBzZWNvbmRzLCBkdXJhdGlvbjogMCwgdGV4dCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSk7XG5cbiAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcblxuICAgICAgaWYgKHVpU2VnbWVudHMgJiYgdWlTZWdtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdWlTZWdtZW50cy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgICB1aVNlZ21lbnRzW2ldLmR1cmF0aW9uID0gdWlTZWdtZW50c1tpICsgMV0uc3RhcnQgLSB1aVNlZ21lbnRzW2ldLnN0YXJ0O1xuICAgICAgICB9XG4gICAgICAgIGlmICh1aVNlZ21lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB1aVNlZ21lbnRzW3VpU2VnbWVudHMubGVuZ3RoIC0gMV0uZHVyYXRpb24gPSA1O1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIOKchSBFeHRyYWN0ZWQgJHt1aVNlZ21lbnRzLmxlbmd0aH0gc2VnbWVudHMgKFVJKWApO1xuICAgICAgICByZXR1cm4gdWlTZWdtZW50cztcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coJ1t2Ml0g4pqg77iPIE5vIHRyYW5zY3JpcHQgYXZhaWxhYmxlIHZpYSBVSS4gVHJ5aW5nIHl0LWRscC4uLicpO1xuICAgICAgY29uc3QgZmIgPSB0aGlzLmRvd25sb2FkVHJhbnNjcmlwdFdpdGhZdERscCh2aWRlby51cmwsIHZpZGVvLnZpZGVvSWQpO1xuICAgICAgaWYgKGZiKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIOKchSB5dC1kbHAgc3VjY2VzczogJHtmYi5sZW5ndGh9IHNlZ21lbnRzYCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICByZXR1cm4gZmI7XG4gICAgICB9XG5cbiAgICAgIGNvbnNvbGUubG9nKCdbdjJdIOKaoO+4jyBObyB0cmFuc2NyaXB0IGF2YWlsYWJsZScpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcignW3YyXSBUcmFuc2NyaXB0IGVycm9yOicsIGUpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgfSBjYXRjaCAoeCkge31cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBdXRvbWF0ZXMgdGhlIHByb2Nlc3Mgb2YgbGlua2luZyBhIHBhaWQgQVBJIGtleSBpZiBkZXRlY3RlZCBhcyBtaXNzaW5nLlxuICAgKiBUaGlzIHByZXZlbnRzIFwiUXVvdGEgZXhjZWVkZWRcIiBlcnJvcnMgb24gdGhlIGZyZWUgdGllci5cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZW5zdXJlUGFpZEFwaUtleShwYWdlOiBQYWdlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coJ1t2Ml0g8J+SsyBDaGVja2luZyBBUEkgS2V5IGNvbm5lY3Rpb24uLi4nKTtcbiAgICB0cnkge1xuICAgICAgLy8gTG9vayBmb3IgdGhlIFwiTm8gQVBJIEtleVwiIGNhcmQgb3IgYnV0dG9uXG4gICAgICBjb25zdCBub0tleUJ0biA9IHBhZ2VcbiAgICAgICAgLmxvY2F0b3IoJy5wYWlkLWFwaS1rZXktY2FyZFthcmlhLWxhYmVsPVwiTm8gQVBJIEtleVwiXScpXG4gICAgICAgIC5vcihwYWdlLmxvY2F0b3IoJ2J1dHRvbicsIHsgaGFzVGV4dDogJ05vIEFQSSBLZXknIH0pKVxuICAgICAgICAuZmlyc3QoKTtcblxuICAgICAgaWYgKGF3YWl0IG5vS2V5QnRuLmlzVmlzaWJsZSgpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIOKaoO+4jyBObyBBUEkgS2V5IGRldGVjdGVkLiBBdHRlbXB0aW5nIHRvIGxpbmsgXCJUaGUgTmV3IEZ1c2VcIi4uLicpO1xuICAgICAgICBhd2FpdCBub0tleUJ0bi5jbGljaygpO1xuICAgICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDIwMDApO1xuXG4gICAgICAgIC8vIDEuIFNlbGVjdCBQcm9qZWN0XG4gICAgICAgIGNvbnN0IHByb2plY3RTZWxlY3QgPSBwYWdlXG4gICAgICAgICAgLmxvY2F0b3IoJ21hdC1zZWxlY3RbYXJpYS1sYWJlbD1cIlNlbGVjdCBhIHBhaWQgcHJvamVjdFwiXScpXG4gICAgICAgICAgLmZpcnN0KCk7XG4gICAgICAgIGlmIChhd2FpdCBwcm9qZWN0U2VsZWN0LmlzVmlzaWJsZSgpKSB7XG4gICAgICAgICAgYXdhaXQgcHJvamVjdFNlbGVjdC5jbGljaygpO1xuICAgICAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMTAwMCk7XG5cbiAgICAgICAgICAvLyBUcnkgdG8gY2xpY2sgXCJUaGUgTmV3IEZ1c2VcIlxuICAgICAgICAgIGNvbnN0IGZ1c2VPcHRpb24gPSBwYWdlLmxvY2F0b3IoJ21hdC1vcHRpb24nLCB7IGhhc1RleHQ6ICdUaGUgTmV3IEZ1c2UnIH0pLmZpcnN0KCk7XG4gICAgICAgICAgaWYgKGF3YWl0IGZ1c2VPcHRpb24uaXNWaXNpYmxlKCkpIHtcbiAgICAgICAgICAgIGF3YWl0IGZ1c2VPcHRpb24uY2xpY2soKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gRmFsbGJhY2s6IENsaWNrIHRoZSBmaXJzdCBvcHRpb25cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIFwiVGhlIE5ldyBGdXNlXCIgbm90IGZvdW5kLCBzZWxlY3RpbmcgZmlyc3QgYXZhaWxhYmxlIHByb2plY3QuJyk7XG4gICAgICAgICAgICBhd2FpdCBwYWdlLmxvY2F0b3IoJ21hdC1vcHRpb24nKS5maXJzdCgpLmNsaWNrKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMTAwMCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyAyLiBFbmFibGUgXCJTYXZlIHBhaWQgQVBJIGtleVwiIGlmIG5vdCBlbmFibGVkXG4gICAgICAgIGNvbnN0IHNhdmVUb2dnbGUgPSBwYWdlXG4gICAgICAgICAgLmxvY2F0b3IoJ2J1dHRvbltyb2xlPVwic3dpdGNoXCJdW2FyaWEtbGFiZWxsZWRieT1cInNhdmUtcGFpZC1hcGkta2V5LWxhYmVsXCJdJylcbiAgICAgICAgICAub3IocGFnZS5sb2NhdG9yKCdidXR0b25bcm9sZT1cInN3aXRjaFwiXScpKVxuICAgICAgICAgIC5maXJzdCgpO1xuXG4gICAgICAgIGlmIChhd2FpdCBzYXZlVG9nZ2xlLmlzVmlzaWJsZSgpKSB7XG4gICAgICAgICAgY29uc3QgaXNDaGVja2VkID0gYXdhaXQgc2F2ZVRvZ2dsZS5nZXRBdHRyaWJ1dGUoJ2FyaWEtY2hlY2tlZCcpO1xuICAgICAgICAgIGlmIChpc0NoZWNrZWQgIT09ICd0cnVlJykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1t2Ml0gVG9nZ2xpbmcgXCJTYXZlIHBhaWQgQVBJIGtleVwiLi4uJyk7XG4gICAgICAgICAgICBhd2FpdCBzYXZlVG9nZ2xlLmNsaWNrKCk7XG4gICAgICAgICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDUwMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gMy4gQ29uZmlybSAoU2VsZWN0IGtleSlcbiAgICAgICAgY29uc3QgY29uZmlybUJ0biA9IHBhZ2VcbiAgICAgICAgICAubG9jYXRvcignYnV0dG9uLm1zLWJ1dHRvbi1wcmltYXJ5JywgeyBoYXNUZXh0OiAnU2VsZWN0IGtleScgfSlcbiAgICAgICAgICAuZmlyc3QoKTtcbiAgICAgICAgaWYgKGF3YWl0IGNvbmZpcm1CdG4uaXNWaXNpYmxlKCkpIHtcbiAgICAgICAgICBhd2FpdCBjb25maXJtQnRuLmNsaWNrKCk7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1t2Ml0g4pyFIEFQSSBLZXkgbGlua2VkIHN1Y2Nlc3NmdWxseS4gUmVsb2FkaW5nIHRvIGFwcGx5IGNoYW5nZXMuLi4nKTtcbiAgICAgICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDMwMDApO1xuICAgICAgICAgIGF3YWl0IHBhZ2UucmVsb2FkKHsgd2FpdFVudGlsOiAnZG9tY29udGVudGxvYWRlZCcgfSk7XG4gICAgICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgyMDAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdbdjJdIOKdjCBDb3VsZCBub3QgZmluZCBcIlNlbGVjdCBrZXlcIiBidXR0b24uJyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIOKchSBBUEkgS2V5IGFwcGVhcnMgdG8gYmUgbGlua2VkLicpO1xuICAgICAgICAvLyBHaXZlIEFJIFN0dWRpbyBleHRyYSB0aW1lIHRvIGZ1bGx5IHRyYW5zaXRpb24gdG8gcGFpZCBtb2RlXG4gICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIOKPsyBXYWl0aW5nIGZvciBBUEkgdHJhbnNpdGlvbiB0byBjb21wbGV0ZS4uLicpO1xuICAgICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDMwMDApO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1t2Ml0gRXJyb3IgY2hlY2tpbmcvbGlua2luZyBBUEkgS2V5OicsIGUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEeW5hbWljYWxseSBzZWxlY3RzIHRoZSByZXF1ZXN0ZWQgbW9kZWwgZnJvbSB0aGUgVUkuXG4gICAqIElmIHRoZSBleGFjdCBtb2RlbCBpcyBub3QgZm91bmQsIHRyaWVzIHRvIGZpbmQgYSBjbG9zZSBtYXRjaCBvciBsb2dzIGF2YWlsYWJsZSBtb2RlbHMuXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHNlbGVjdEJlc3RNb2RlbChwYWdlOiBQYWdlLCB0YXJnZXRNb2RlbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coYFt2Ml0g8J+UjSBBdHRlbXB0aW5nIHRvIHNlbGVjdCBtb2RlbDogJHt0YXJnZXRNb2RlbH1gKTtcbiAgICB0cnkge1xuICAgICAgLy8gMS4gRmluZCBhbGwgcG90ZW50aWFsIGRyb3Bkb3duIHRyaWdnZXJzXG4gICAgICBjb25zdCBjYW5kaWRhdGVzID0gcGFnZS5sb2NhdG9yKCdidXR0b24sIG1zLXNlbGVjdCwgbWF0LXNlbGVjdCcpO1xuICAgICAgY29uc3QgY291bnQgPSBhd2FpdCBjYW5kaWRhdGVzLmNvdW50KCk7XG4gICAgICBsZXQgbW9kZWxTZWxlY3RvcjogYW55ID0gbnVsbDtcbiAgICAgIGNvbnNvbGUubG9nKGBbdjJdIERFQlVHOiBGb3VuZCAke2NvdW50fSBjYW5kaWRhdGVzLmApO1xuICAgICAgbGV0IGJlc3RNYXRjaDogYW55ID0gbnVsbDtcbiAgICAgIGxldCBkZWZhdWx0TWF0Y2g6IGFueSA9IG51bGw7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICBjb25zdCBlbCA9IGNhbmRpZGF0ZXMubnRoKGkpO1xuICAgICAgICBjb25zdCBpc1Zpc2libGUgPSBhd2FpdCBlbC5pc1Zpc2libGUoKTtcbiAgICAgICAgaWYgKCFpc1Zpc2libGUpIGNvbnRpbnVlO1xuXG4gICAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCBlbC5pbm5lclRleHQoKTtcbiAgICAgICAgY29uc3QgbGFiZWwgPSAoYXdhaXQgZWwuZ2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJykpIHx8ICcnO1xuICAgICAgICBjb25zdCBjbHMgPSAoYXdhaXQgZWwuZ2V0QXR0cmlidXRlKCdjbGFzcycpKSB8fCAnJztcblxuICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICBgW3YyXSBDYW5kaWRhdGUgIyR7aX06IFRleHQ9XCIke3RleHQucmVwbGFjZSgvXFxuL2csICdcXFxcbicpfVwiLCBMYWJlbD1cIiR7bGFiZWx9XCIsIENsYXNzPVwiJHtjbHN9XCJgXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gSGV1cmlzdGljcyB0byBpZGVudGlmeSB0aGUgbW9kZWwgc2VsZWN0b3I6XG4gICAgICAgIC8vIC0gVGV4dCBjb250YWlucyBcIkdlbWluaVwiXG4gICAgICAgIC8vIC0gbGFiZWwgY29udGFpbnMgXCJtb2RlbFwiIChjYXNlLWluc2Vuc2l0aXZlKVxuICAgICAgICAvLyAtIGNsYXNzIGNvbnRhaW5zIFwibW9kZWwtc2VsZWN0b3JcIlxuICAgICAgICAvLyAtIEVYQ0xVREUgZmlsdGVyIGNoaXBzXG4gICAgICAgIGlmIChcbiAgICAgICAgICAodGV4dC5pbmNsdWRlcygnR2VtaW5pJykgfHxcbiAgICAgICAgICAgIGxhYmVsLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ21vZGVsJykgfHxcbiAgICAgICAgICAgIGNscy5pbmNsdWRlcygnbW9kZWwtc2VsZWN0b3InKSkgJiZcbiAgICAgICAgICAhY2xzLmluY2x1ZGVzKCdmaWx0ZXItY2hpcCcpXG4gICAgICAgICkge1xuICAgICAgICAgIC8vIEV4Y2x1ZGUgY29tbW9ubHkgY29uZnVzZWQgdGhpbmdzIGlmIGNoZWNrcyBhcmUgd2Vha1xuICAgICAgICAgIGlmIChsYWJlbC50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdzZXR0aW5nJykpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgLy8gQ3JpdGljYWw6IElmIHdlIHdhbnQgRmxhc2gsIERPIE5PVCBhY2NlcHQgUHJvIGNhcmRcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICB0YXJnZXRNb2RlbC5pbmNsdWRlcygnZmxhc2gnKSAmJlxuICAgICAgICAgICAgdGV4dC50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdwcm8nKSAmJlxuICAgICAgICAgICAgIXRleHQudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnZmxhc2gnKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFt2Ml0gSWdub3JpbmcgUHJvIGNhbmRpZGF0ZSAjJHtpfSBiZWNhdXNlIHdlIHdhbnQgRmxhc2hgKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFByaW9yaXRpemUgZXhhY3QgbWF0Y2ggKGUuZy4gRmxhc2gpXG4gICAgICAgICAgaWYgKHRhcmdldE1vZGVsLmluY2x1ZGVzKCdmbGFzaCcpICYmIHRleHQudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnZmxhc2gnKSkge1xuICAgICAgICAgICAgYmVzdE1hdGNoID0gZWw7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW3YyXSBGbGFzaCBNQVRDSCBGT1VORCBhdCAjJHtpfWApO1xuICAgICAgICAgICAgYnJlYWs7IC8vIEZvdW5kIHRoZSBiZXN0IG9uZVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICB0YXJnZXRNb2RlbC5pbmNsdWRlcygncHJvJykgJiZcbiAgICAgICAgICAgIHRleHQudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygncHJvJykgJiZcbiAgICAgICAgICAgICF0YXJnZXRNb2RlbC5pbmNsdWRlcygnZmxhc2gnKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgYmVzdE1hdGNoID0gZWw7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW3YyXSBQcm8gTUFUQ0ggRk9VTkQgYXQgIyR7aX1gKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEtlZXAgZ2VuZXJpYyBtYXRjaFxuICAgICAgICAgIGlmICghZGVmYXVsdE1hdGNoKSB7XG4gICAgICAgICAgICBkZWZhdWx0TWF0Y2ggPSBlbDtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIEdlbmVyaWMgTUFUQ0ggRk9VTkQgYXQgIyR7aX0gKGtlZXBpbmcgYXMgYmFja3VwKWApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbW9kZWxTZWxlY3RvciA9IGJlc3RNYXRjaCB8fCBkZWZhdWx0TWF0Y2g7XG4gICAgICBpZiAobW9kZWxTZWxlY3RvcilcbiAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgYFt2Ml0gU2VsZWN0ZWQgY2FuZGlkYXRlOiAke21vZGVsU2VsZWN0b3IgPT09IGJlc3RNYXRjaCA/ICdCZXN0IE1hdGNoJyA6ICdEZWZhdWx0IE1hdGNoJ31gXG4gICAgICAgICk7XG5cbiAgICAgIC8vIEZBTExCQUNLOiBJZiBvbiBkYXNoYm9hcmQsIGNsaWNrIFwiTmV3IGNoYXRcIlxuICAgICAgaWYgKCFtb2RlbFNlbGVjdG9yKSB7XG4gICAgICAgIGNvbnN0IG5ld0NoYXRCdG4gPSBwYWdlLmxvY2F0b3IoJ2J1dHRvblthcmlhLWxhYmVsPVwiTmV3IGNoYXRcIl0nKS5maXJzdCgpO1xuICAgICAgICBpZiAoYXdhaXQgbmV3Q2hhdEJ0bi5pc1Zpc2libGUoKSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIE1vZGVsIHNlbGVjdG9yIG5vdCBmb3VuZC4gQ2xpY2tpbmcgXCJOZXcgY2hhdFwiIHRvIGVudGVyIGVkaXRvci4uLicpO1xuICAgICAgICAgIGF3YWl0IG5ld0NoYXRCdG4uY2xpY2soKTtcbiAgICAgICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDMwMDApO1xuXG4gICAgICAgICAgLy8gUmV0cnkgZmluZGluZyBzZWxlY3RvciBPTkUgdGltZSAoc2ltcGxlIHJlY3Vyc2lvbiB3aXRoIGZsYWcgY291bGQgd29yaywgYnV0IGhlcmUgSSdsbCBqdXN0IGNvcHkgbG9naWMgb3IgcmVseSBvbiBuZXh0IHN0ZXBzKVxuICAgICAgICAgIC8vIEJldHRlcjogUmV0dXJuIGFuZCBsZXQgY2FsbGVyIGhhbmRsZT8gTm8uXG4gICAgICAgICAgLy8gTGV0J3MganVzdCB0cnkgdG8gZmluZCBpdCBhZ2Fpbi5cbiAgICAgICAgICBjb25zdCByZXRyeUNhbmRpZGF0ZXMgPSBwYWdlLmxvY2F0b3IoJ2J1dHRvbiwgbXMtc2VsZWN0LCBtYXQtc2VsZWN0Jyk7XG4gICAgICAgICAgY29uc3QgcmV0cnlDb3VudCA9IGF3YWl0IHJldHJ5Q2FuZGlkYXRlcy5jb3VudCgpO1xuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmV0cnlDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBlbCA9IHJldHJ5Q2FuZGlkYXRlcy5udGgoaSk7XG4gICAgICAgICAgICBpZiAoIShhd2FpdCBlbC5pc1Zpc2libGUoKSkpIGNvbnRpbnVlO1xuICAgICAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IGVsLmlubmVyVGV4dCgpO1xuICAgICAgICAgICAgY29uc3QgbGFiZWwgPSAoYXdhaXQgZWwuZ2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJykpIHx8ICcnO1xuICAgICAgICAgICAgY29uc3QgY2xzID0gKGF3YWl0IGVsLmdldEF0dHJpYnV0ZSgnY2xhc3MnKSkgfHwgJyc7XG5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgKHRleHQuaW5jbHVkZXMoJ0dlbWluaScpIHx8XG4gICAgICAgICAgICAgICAgbGFiZWwudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnbW9kZWwnKSB8fFxuICAgICAgICAgICAgICAgIGNscy5pbmNsdWRlcygnbW9kZWwtc2VsZWN0b3InKSkgJiZcbiAgICAgICAgICAgICAgIWNscy5pbmNsdWRlcygnZmlsdGVyLWNoaXAnKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGlmICghbGFiZWwudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnc2V0dGluZycpKSB7XG4gICAgICAgICAgICAgICAgbW9kZWxTZWxlY3RvciA9IGVsO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIE1BVENIIEZPVU5EIG9uIHJldHJ5IWApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChtb2RlbFNlbGVjdG9yKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRNb2RlbCA9IGF3YWl0IG1vZGVsU2VsZWN0b3IuaW5uZXJUZXh0KCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIEN1cnJlbnQgbW9kZWwgc2VsZWN0ZWQ6ICR7Y3VycmVudE1vZGVsfWApO1xuXG4gICAgICAgIC8vIElmIHdlIGFyZSBhbHJlYWR5IG9uIHRoZSB0YXJnZXQgKGZ1enp5IG1hdGNoKSwgc2tpcFxuICAgICAgICBpZiAodGFyZ2V0TW9kZWwuaW5jbHVkZXMoJ2ZsYXNoJykgJiYgY3VycmVudE1vZGVsLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2ZsYXNoJykpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnW3YyXSDinIUgXCJGbGFzaFwiIG1vZGVsIGFscmVhZHkgYWN0aXZlLicpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IG1vZGVsU2VsZWN0b3IuY2xpY2soKTtcbiAgICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgxMDAwKTtcblxuICAgICAgICAvLyAyLiBTY3JhcGUgYXZhaWxhYmxlIG1vZGVsc1xuICAgICAgICAvLyBUcnkgbXVsdGlwbGUgc2VsZWN0b3JzIGZvciBvcHRpb25zIGxpc3RcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHBhZ2UubG9jYXRvcignbWF0LW9wdGlvbiwgW3JvbGU9XCJvcHRpb25cIl0sIC5tb2RlbC1vcHRpb24nKTtcbiAgICAgICAgY29uc3Qgb3B0Q291bnQgPSBhd2FpdCBvcHRpb25zLmNvdW50KCk7XG4gICAgICAgIGNvbnN0IGF2YWlsYWJsZU1vZGVsczogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICAvLyBVc2UgYSBTZXQgdG8gYXZvaWQgZHVwbGljYXRlcyBpZiBzZWxlY3RvcnMgb3ZlcmxhcFxuICAgICAgICBjb25zdCBtb2RlbFNldCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb3B0Q291bnQ7IGkrKykge1xuICAgICAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCBvcHRpb25zLm50aChpKS5pbm5lclRleHQoKTtcbiAgICAgICAgICAvLyBDbGVhbiB1cCB0ZXh0IChyZW1vdmUgbmV3bGluZXMvZGVzY3JpcHRpb25zKVxuICAgICAgICAgIGNvbnN0IGNsZWFuVGV4dCA9IHRleHQuc3BsaXQoJ1xcbicpWzBdLnRyaW0oKTtcbiAgICAgICAgICBhdmFpbGFibGVNb2RlbHMucHVzaChjbGVhblRleHQpO1xuICAgICAgICAgIG1vZGVsU2V0LmFkZChjbGVhblRleHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coYFt2Ml0g8J+TiyBBdmFpbGFibGUgTW9kZWxzOiAke0FycmF5LmZyb20obW9kZWxTZXQpLmpvaW4oJywgJyl9YCk7XG5cbiAgICAgICAgLy8gMy4gU2VsZWN0IGJlc3QgbWF0Y2hcbiAgICAgICAgbGV0IGJlc3RNYXRjaEluZGV4ID0gLTE7XG5cbiAgICAgICAgLy8gRXhhY3QtaXNoIG1hdGNoXG4gICAgICAgIGJlc3RNYXRjaEluZGV4ID0gYXZhaWxhYmxlTW9kZWxzLmZpbmRJbmRleCgobSkgPT5cbiAgICAgICAgICBtLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXModGFyZ2V0TW9kZWwudG9Mb3dlckNhc2UoKSlcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoYmVzdE1hdGNoSW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgLy8gRmFsbGJhY2sgZm9yIGtub3duIGFsaWFzZXNcbiAgICAgICAgICBpZiAodGFyZ2V0TW9kZWwuaW5jbHVkZXMoJ2ZsYXNoJykpIHtcbiAgICAgICAgICAgIGJlc3RNYXRjaEluZGV4ID0gYXZhaWxhYmxlTW9kZWxzLmZpbmRJbmRleChcbiAgICAgICAgICAgICAgKG0pID0+IG0udG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnZmxhc2gnKSAmJiAhbS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdsZWdhY3knKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHRhcmdldE1vZGVsLmluY2x1ZGVzKCdwcm8nKSkge1xuICAgICAgICAgICAgYmVzdE1hdGNoSW5kZXggPSBhdmFpbGFibGVNb2RlbHMuZmluZEluZGV4KFxuICAgICAgICAgICAgICAobSkgPT4gbS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdwcm8nKSAmJiAhbS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCd2aXNpb24nKVxuICAgICAgICAgICAgKTsgLy8gJ3Zpc2lvbicgaXMgb2Z0ZW4gb2xkZXJcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYmVzdE1hdGNoSW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYFt2Ml0g8J+RiSBTZWxlY3Rpbmc6ICR7YXZhaWxhYmxlTW9kZWxzW2Jlc3RNYXRjaEluZGV4XX1gKTtcbiAgICAgICAgICBhd2FpdCBvcHRpb25zLm50aChiZXN0TWF0Y2hJbmRleCkuY2xpY2soKTtcbiAgICAgICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDIwMDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgIGBbdjJdIOKaoO+4jyBDb3VsZCBub3QgZmluZCB0YXJnZXQgbW9kZWwgJHt0YXJnZXRNb2RlbH0uIEtlZXBpbmcgY3VycmVudCBzZWxlY3Rpb24uYFxuICAgICAgICAgICk7XG4gICAgICAgICAgYXdhaXQgcGFnZS5rZXlib2FyZC5wcmVzcygnRXNjYXBlJyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICdbdjJdIOKaoO+4jyBNb2RlbCBzZWxlY3RvciBub3QgZm91bmQgKGNoZWNrZWQgYWxsIGJ1dHRvbnMpLiBhc3N1bWluZyBzdHJpY3QgVVJMIHBhcmFtIHdvcmtlZC4nXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBwYWdlLmNvbnRlbnQoKTtcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYygnYWlfc3R1ZGlvX2R1bXAuaHRtbCcsIGNvbnRlbnQpO1xuICAgICAgICBjb25zb2xlLmxvZygnW3YyXSBEdW1wZWQgQUkgU3R1ZGlvIEhUTUwgdG8gYWlfc3R1ZGlvX2R1bXAuaHRtbCcpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1t2Ml0g4pqg77iPIEVycm9yIHNlbGVjdGluZyBtb2RlbDonLCBlKTtcbiAgICB9XG4gIH1cblxuICAvLyAtLS0gRklYRUQgUEFSU0lORyBNRVRIT0QgLS0tXG4gIGFzeW5jIGFuYWx5emVXaXRoQUkodmlkZW86IFZpZGVvRW50cnkpOiBQcm9taXNlPEFuYWx5c2lzUmVzdWx0IHwgbnVsbD4ge1xuICAgIGlmICghdGhpcy5jb250ZXh0IHx8ICF2aWRlby50cmFuc2NyaXB0KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhgW3YyXSDwn6SWIEFJIEFuYWx5c2lzOiAke3ZpZGVvLnRpdGxlfWApO1xuXG4gICAgbGV0IHBhZ2U6IFBhZ2UgfCBudWxsID0gbnVsbDtcblxuICAgIHRyeSB7XG4gICAgICAvLyBGUkVTSCBwYWdlIGZvciBBSSBTdHVkaW8gLSBDaGVjayBjb250ZXh0IGhlYWx0aCBmaXJzdFxuICAgICAgdHJ5IHtcbiAgICAgICAgcGFnZSA9IGF3YWl0IHRoaXMuY29udGV4dC5uZXdQYWdlKCk7XG4gICAgICB9IGNhdGNoIChjb250ZXh0RXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignW3YyXSDinYwgQnJvd3NlciBjb250ZXh0IGlzIGRlYWQsIGNhbm5vdCBjcmVhdGUgcGFnZTonLCBjb250ZXh0RXJyb3IpO1xuICAgICAgICAvLyBUcnkgdG8gcmVpbml0aWFsaXplXG4gICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIEF0dGVtcHRpbmcgdG8gcmVzdGFydCBicm93c2VyLi4uJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5jb250ZXh0Py5jbG9zZSgpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgLyogaWdub3JlICovXG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5pbml0aWFsaXplKCk7XG4gICAgICAgIHBhZ2UgPSBhd2FpdCB0aGlzLmNvbnRleHQhLm5ld1BhZ2UoKTtcbiAgICAgIH1cbiAgICAgIC8vIENvbWJpbmUgdHJhbnNjcmlwdFxuICAgICAgY29uc3QgZnVsbFRyYW5zY3JpcHQgPSB2aWRlby50cmFuc2NyaXB0Lm1hcCgocykgPT4gcy50ZXh0KS5qb2luKCcgJyk7XG4gICAgICBjb25zdCB0cnVuY2F0ZWRUcmFuc2NyaXB0ID0gZnVsbFRyYW5zY3JpcHQuc3Vic3RyaW5nKDAsIDI1MDAwKTsgLy8gU3RheSB3aXRoaW4gbGltaXRzXG5cbiAgICAgIC8vIE5hdmlnYXRlIHRvIEFJIFN0dWRpbyB3aXRoIGxhdGVzdCBtb2RlbFxuICAgICAgYXdhaXQgcGFnZS5nb3RvKEFJX1NUVURJT19VUkwsIHsgd2FpdFVudGlsOiAnZG9tY29udGVudGxvYWRlZCcsIHRpbWVvdXQ6IDYwMDAwIH0pO1xuICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCg1MDAwKTtcblxuICAgICAgLy8gRGlzbWlzcyBhbnkgZGlhbG9nc1xuICAgICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBbXG4gICAgICAgICdidXR0b246aGFzLXRleHQoXCJHb3QgaXRcIiknLFxuICAgICAgICAnYnV0dG9uOmhhcy10ZXh0KFwiQ29udGludWVcIiknLFxuICAgICAgICAnW2FyaWEtbGFiZWw9XCJDbG9zZVwiXScsXG4gICAgICBdKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgZWwgPSBwYWdlLmxvY2F0b3Ioc2VsZWN0b3IpO1xuICAgICAgICAgIGlmICgoYXdhaXQgZWwuY291bnQoKSkgPiAwICYmIChhd2FpdCBlbC5maXJzdCgpLmlzVmlzaWJsZSgpKSkge1xuICAgICAgICAgICAgYXdhaXQgZWwuZmlyc3QoKS5jbGljayh7IGZvcmNlOiB0cnVlIH0pO1xuICAgICAgICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCg1MDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIC8qIGlnbm9yZSAqL1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBhd2FpdCBwYWdlLmtleWJvYXJkLnByZXNzKCdFc2NhcGUnKTtcbiAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoNTAwKTtcblxuICAgICAgLy8gU2tpcCBBUEkgS2V5IGNoZWNrIC0gdXNlIGJyb3dzZXIgc2Vzc2lvbiBkaXJlY3RseVxuICAgICAgLy8gYXdhaXQgdGhpcy5lbnN1cmVQYWlkQXBpS2V5KHBhZ2UpO1xuICAgICAgY29uc29sZS5sb2coJ1t2Ml0g8J+SsyBVc2luZyBicm93c2VyIHNlc3Npb24gKHNraXBwaW5nIEFQSSBrZXkgY2hlY2spJyk7XG5cbiAgICAgIC8vIEVuc3VyZSBjb3JyZWN0IG1vZGVsIGlzIHNlbGVjdGVkXG4gICAgICBhd2FpdCB0aGlzLnNlbGVjdEJlc3RNb2RlbChwYWdlLCBHRU1JTklfTU9ERUwpO1xuXG4gICAgICAvLyBFbnRlciBwcm9tcHRcbiAgICAgIGNvbnN0IHRleHRhcmVhID0gcGFnZS5sb2NhdG9yKCd0ZXh0YXJlYVthcmlhLWxhYmVsPVwiRW50ZXIgYSBwcm9tcHRcIl0nKTtcbiAgICAgIGF3YWl0IHRleHRhcmVhLndhaXRGb3IoeyBzdGF0ZTogJ3Zpc2libGUnLCB0aW1lb3V0OiAxNTAwMCB9KTtcbiAgICAgIGF3YWl0IHRleHRhcmVhLmNsaWNrKHsgZm9yY2U6IHRydWUgfSk7XG5cbiAgICAgIGNvbnN0IGZ1bGxQcm9tcHQgPSBBTkFMWVNJU19QUk9NUFQgKyB0cnVuY2F0ZWRUcmFuc2NyaXB0O1xuICAgICAgYXdhaXQgdGV4dGFyZWEuZmlsbChmdWxsUHJvbXB0KTtcbiAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMTAwMCk7XG5cbiAgICAgIC8vIENsaWNrIFJ1blxuICAgICAgY29uc3QgcnVuQnRuID0gcGFnZS5sb2NhdG9yKCdidXR0b25bYXJpYS1sYWJlbD1cIlJ1blwiXScpO1xuICAgICAgYXdhaXQgcnVuQnRuLmNsaWNrKCk7XG5cbiAgICAgIGNvbnNvbGUubG9nKCdbdjJdIFdhaXRpbmcgZm9yIEFJIHJlc3BvbnNlLi4uJyk7XG5cbiAgICAgIC8vIFdhaXQgZm9yIHJlc3BvbnNlIHdpdGggYmV0dGVyIGV4dHJhY3Rpb25cbiAgICAgIGNvbnN0IHN0YXJ0V2FpdCA9IERhdGUubm93KCk7XG4gICAgICBjb25zdCB0aW1lb3V0ID0gMiAqIDYwICogMTAwMDsgLy8gMiBtaW51dGVzXG5cbiAgICAgIC8vIEluaXRpYWwgbG9uZ2VyIHdhaXQgZm9yIGZpcnN0IHJlcXVlc3QgYWZ0ZXIgQVBJIGtleSBzZXR1cFxuICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCg1MDAwKTtcblxuICAgICAgd2hpbGUgKERhdGUubm93KCkgLSBzdGFydFdhaXQgPCB0aW1lb3V0KSB7XG4gICAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMzAwMCk7XG5cbiAgICAgICAgLy8gQ2hlY2sgZm9yIGVycm9yIG1lc3NhZ2VzIChQZXJtaXNzaW9uIGRlbmllZCwgZXRjLilcbiAgICAgICAgY29uc3QgZXJyb3JUb2FzdCA9IHBhZ2VcbiAgICAgICAgICAubG9jYXRvcignbWF0LXNuYWNrLWJhci1jb250YWluZXInKVxuICAgICAgICAgIC5vcihwYWdlLmxvY2F0b3IoJy5lcnJvci1tZXNzYWdlJykpXG4gICAgICAgICAgLm9yKHBhZ2UuZ2V0QnlUZXh0KCdQZXJtaXNzaW9uIGRlbmllZCcpKVxuICAgICAgICAgIC5vcihwYWdlLmdldEJ5VGV4dCgnRmFpbGVkIHRvIGdlbmVyYXRlJykpO1xuXG4gICAgICAgIGlmICgoYXdhaXQgZXJyb3JUb2FzdC5jb3VudCgpKSA+IDAgJiYgKGF3YWl0IGVycm9yVG9hc3QuZmlyc3QoKS5pc1Zpc2libGUoKSkpIHtcbiAgICAgICAgICBjb25zdCBlcnJvclRleHQgPSBhd2FpdCBlcnJvclRvYXN0LmZpcnN0KCkuaW5uZXJUZXh0KCk7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgW3YyXSDinYwgQUkgU3R1ZGlvIEVycm9yIGRldGVjdGVkOiAke2Vycm9yVGV4dH1gKTtcbiAgICAgICAgICBpZiAoZXJyb3JUZXh0LnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ3Blcm1pc3Npb24gZGVuaWVkJykpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICAgIGBbdjJdIPCfm5EgRkFUQUwgRVJST1I6IEFjY291bnQgcGVybWlzc2lvbnMgaXNzdWUuIFN0b3BwaW5nIGVudGlyZSBwcm9jZXNzLmBcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICAvLyBXZSBuZWVkIHRvIGV4aXQgdGhlIGVudGlyZSBwcm9jZXNzIHNvIHRoZSB1c2VyIGNhbiBmaXggdGhlIGFjY291bnRcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBSSBTdHVkaW8gRXJyb3I6ICR7ZXJyb3JUZXh0fWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgZm9yIGNvbXBsZXRpb24gYnkgbG9va2luZyBmb3IgdGhlIHJlc3BvbnNlIGNvbnRhaW5lclxuICAgICAgICBjb25zdCByZXNwb25zZUNvbnRhaW5lciA9IHBhZ2UubG9jYXRvcihcbiAgICAgICAgICAnbXMtY2hhdC10dXJuLm1vZGVsIC50dXJuLWNvbnRlbnQsIC5jaGF0LXR1cm4tY29udGFpbmVyLm1vZGVsIC50dXJuLWNvbnRlbnQnXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKChhd2FpdCByZXNwb25zZUNvbnRhaW5lci5jb3VudCgpKSA+IDApIHtcbiAgICAgICAgICAvLyBHZXQgdGhlIGlubmVyIHRleHQgZGlyZWN0bHksIG5vdCBpbmNsdWRpbmcgVUkgZWxlbWVudHNcbiAgICAgICAgICBjb25zdCByYXdUZXh0ID0gYXdhaXQgcGFnZS5ldmFsdWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAvLyBGaW5kIHRoZSBhY3R1YWwgcmVzcG9uc2UgdGV4dCwgZXhjbHVkaW5nIHRvb2xiYXIgYnV0dG9uc1xuICAgICAgICAgICAgY29uc3QgY29udGFpbmVycyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXG4gICAgICAgICAgICAgICdtcy1jaGF0LXR1cm4ubW9kZWwgLnR1cm4tY29udGVudCwgLmNoYXQtdHVybi1jb250YWluZXIubW9kZWwgLnR1cm4tY29udGVudCdcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZiAoY29udGFpbmVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGxhc3RDb250YWluZXIgPSBjb250YWluZXJzW2NvbnRhaW5lcnMubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgICAgIC8vIEdldCB0ZXh0IGZyb20gbWFya2Rvd24gY29udGVudCBpZiBhdmFpbGFibGVcbiAgICAgICAgICAgIGNvbnN0IG1hcmtkb3duID0gbGFzdENvbnRhaW5lci5xdWVyeVNlbGVjdG9yKFxuICAgICAgICAgICAgICAnLm1hcmtkb3duLWJvZHksIC5tYXJrZG93bi1jb250ZW50LCAucmVuZGVyZWQtbWFya2Rvd24nXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbGV0IGNvbnRlbnQgPSBtYXJrZG93biA/IG1hcmtkb3duLnRleHRDb250ZW50IHx8ICcnIDogbGFzdENvbnRhaW5lci50ZXh0Q29udGVudCB8fCAnJztcblxuICAgICAgICAgICAgLy8gQ0xFQU5JTkc6IFJlbW92ZSBcIk1vZGVsIFRoaW5raW5nXCIgYmxvY2tzIHdoaWNoIGNsdXR0ZXIgdGhlIG91dHB1dFxuICAgICAgICAgICAgLy8gR2VtaW5pIEZsYXNoIHNvbWV0aW1lcyBvdXRwdXRzIFwiTW9kZWwgVGhpbmtpbmcuLi5cIiBmb2xsb3dlZCBieSB0aG91Z2h0c1xuICAgICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShcbiAgICAgICAgICAgICAgL01vZGVsIFRoaW5raW5nW1xcc1xcU10qPyg/OkV4cGFuZCB0byB2aWV3IG1vZGVsIHRob3VnaHRzfGNoZXZyb25fcmlnaHQpL2csXG4gICAgICAgICAgICAgICcnXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgvTW9kZWwgVGhpbmtpbmdbXFxzXFxTXSo/anNvbi9pLCAnJyk7XG5cbiAgICAgICAgICAgIC8vIFJlbW92ZSBjb21tb24gVUkgdGV4dCBwYXR0ZXJuc1xuICAgICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShcbiAgICAgICAgICAgICAgL21vcmVfdmVydHxjb250ZW50X2NvcHl8ZG93bmxvYWR8ZXhwYW5kX2xlc3N8ZXhwYW5kX21vcmV8TW9kZWwgY29kZSBKU09OL2csXG4gICAgICAgICAgICAgICcnXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gY29udGVudC50cmltKCk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBpZiAocmF3VGV4dCAmJiByYXdUZXh0Lmxlbmd0aCA+IDUwKSB7XG4gICAgICAgICAgICAvLyBUcnkgdG8gZXh0cmFjdCBKU09OIGZyb20gdGhlIHJlc3BvbnNlXG4gICAgICAgICAgICBjb25zdCBqc29uUGF0dGVybnMgPSBbXG4gICAgICAgICAgICAgIC9gYGBqc29uXFxzKihcXHtbXFxzXFxTXSo/XFx9KVxccypgYGAvLCAvLyBTdGFuZGFyZCBtYXJrZG93biBqc29uIGJsb2NrXG4gICAgICAgICAgICAgIC9gYGBcXHMqKFxce1tcXHNcXFNdKj9cXH0pXFxzKmBgYC8sIC8vIEdlbmVyaWMgbWFya2Rvd24gYmxvY2tcbiAgICAgICAgICAgICAgL14oXFx7W1xcc1xcU10qXFx9KSQvLCAvLyBKdXN0IEpTT05cbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIGxldCBhbmFseXNpczogQW5hbHlzaXNSZXN1bHQgfCBudWxsID0gbnVsbDtcblxuICAgICAgICAgICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIGpzb25QYXR0ZXJucykge1xuICAgICAgICAgICAgICBjb25zdCBtYXRjaCA9IHJhd1RleHQubWF0Y2gocGF0dGVybik7XG4gICAgICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBqc29uU3RyID0gbWF0Y2hbMV07XG4gICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGpzb25TdHIpO1xuICAgICAgICAgICAgICAgICAgYW5hbHlzaXMgPSB7XG4gICAgICAgICAgICAgICAgICAgIGtleVBvaW50czogcGFyc2VkLmtleVBvaW50cyB8fCBbXSxcbiAgICAgICAgICAgICAgICAgICAgYWlDb25jZXB0czogcGFyc2VkLmFpQ29uY2VwdHMgfHwgW10sXG4gICAgICAgICAgICAgICAgICAgIHRlY2huaWNhbERldGFpbHM6IHBhcnNlZC50ZWNobmljYWxEZXRhaWxzIHx8IFtdLFxuICAgICAgICAgICAgICAgICAgICB2aXN1YWxDb250ZXh0RmxhZ3M6IHBhcnNlZC52aXN1YWxDb250ZXh0RmxhZ3MgfHwgW10sXG4gICAgICAgICAgICAgICAgICAgIHN1bW1hcnk6IHBhcnNlZC5zdW1tYXJ5IHx8ICcnLFxuICAgICAgICAgICAgICAgICAgICBxdWFsaXR5U2NvcmU6IHRoaXMuY2FsY3VsYXRlUXVhbGl0eVNjb3JlKHBhcnNlZCksXG4gICAgICAgICAgICAgICAgICAgIHJhd1Jlc3BvbnNlOiByYXdUZXh0LnN1YnN0cmluZygwLCAxMDAwKSxcbiAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAvKiB0cnkgbmV4dCBwYXR0ZXJuICovXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEpTT04gUGFyc2UgRmFsbGJhY2s6IFRyeSB0byBmaW5kIHN1YnN0cmluZyBiZXR3ZWVuIGZpcnN0IHsgYW5kIGxhc3QgfVxuICAgICAgICAgICAgaWYgKCFhbmFseXNpcyAmJiByYXdUZXh0LmluY2x1ZGVzKCd7JykgJiYgcmF3VGV4dC5pbmNsdWRlcygnfScpKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSByYXdUZXh0LmluZGV4T2YoJ3snKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbmQgPSByYXdUZXh0Lmxhc3RJbmRleE9mKCd9JykgKyAxO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBvdGVudGlhbEpzb24gPSByYXdUZXh0LnN1YnN0cmluZyhzdGFydCwgZW5kKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKHBvdGVudGlhbEpzb24pO1xuICAgICAgICAgICAgICAgIGFuYWx5c2lzID0ge1xuICAgICAgICAgICAgICAgICAga2V5UG9pbnRzOiBwYXJzZWQua2V5UG9pbnRzIHx8IFtdLFxuICAgICAgICAgICAgICAgICAgYWlDb25jZXB0czogcGFyc2VkLmFpQ29uY2VwdHMgfHwgW10sXG4gICAgICAgICAgICAgICAgICB0ZWNobmljYWxEZXRhaWxzOiBwYXJzZWQudGVjaG5pY2FsRGV0YWlscyB8fCBbXSxcbiAgICAgICAgICAgICAgICAgIHZpc3VhbENvbnRleHRGbGFnczogcGFyc2VkLnZpc3VhbENvbnRleHRGbGFncyB8fCBbXSxcbiAgICAgICAgICAgICAgICAgIHN1bW1hcnk6IHBhcnNlZC5zdW1tYXJ5IHx8ICcnLFxuICAgICAgICAgICAgICAgICAgcXVhbGl0eVNjb3JlOiB0aGlzLmNhbGN1bGF0ZVF1YWxpdHlTY29yZShwYXJzZWQpLFxuICAgICAgICAgICAgICAgICAgcmF3UmVzcG9uc2U6IHJhd1RleHQuc3Vic3RyaW5nKDAsIDEwMDApLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAvKiBpZ25vcmUgKi9cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUZXh0IEZhbGxiYWNrOiBDcmVhdGUgc3RydWN0dXJlZCBhbmFseXNpcyBmcm9tIHRleHQgaWYgSlNPTiBmYWlsc1xuICAgICAgICAgICAgaWYgKCFhbmFseXNpcykge1xuICAgICAgICAgICAgICBhbmFseXNpcyA9IHtcbiAgICAgICAgICAgICAgICBrZXlQb2ludHM6IHRoaXMuZXh0cmFjdEJ1bGxldFBvaW50cyhyYXdUZXh0KSxcbiAgICAgICAgICAgICAgICBhaUNvbmNlcHRzOiB0aGlzLmV4dHJhY3RBSUNvbmNlcHRzKHJhd1RleHQpLFxuICAgICAgICAgICAgICAgIHRlY2huaWNhbERldGFpbHM6IFtdLFxuICAgICAgICAgICAgICAgIHZpc3VhbENvbnRleHRGbGFnczogW10sXG4gICAgICAgICAgICAgICAgc3VtbWFyeTogcmF3VGV4dC5zdWJzdHJpbmcoMCwgMzAwKS5yZXBsYWNlKC9cXG4vZywgJyAnKSxcbiAgICAgICAgICAgICAgICBxdWFsaXR5U2NvcmU6IDUwLCAvLyBNZWRpdW0gcXVhbGl0eSBmb3IgZmFsbGJhY2tcbiAgICAgICAgICAgICAgICByYXdSZXNwb25zZTogcmF3VGV4dC5zdWJzdHJpbmcoMCwgMTAwMCksXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIOKchSBBbmFseXNpcyBjb21wbGV0ZSAocXVhbGl0eTogJHthbmFseXNpcy5xdWFsaXR5U2NvcmV9JSlgKTtcbiAgICAgICAgICAgIHJldHVybiBhbmFseXNpcztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBmb3IgZXJyb3JzXG4gICAgICAgIGNvbnN0IGVycm9yVGV4dCA9IGF3YWl0IHBhZ2UuZXZhbHVhdGUoKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5ib2R5LmlubmVyVGV4dDtcbiAgICAgICAgICBpZiAoYm9keS5pbmNsdWRlcygnSW50ZXJuYWwgZXJyb3InKSB8fCBib2R5LmluY2x1ZGVzKCdTb21ldGhpbmcgd2VudCB3cm9uZycpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2Vycm9yJztcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChlcnJvclRleHQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FJIFN0dWRpbyByZXR1cm5lZCBhbiBlcnJvcicpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnNvbGUubG9nKCdbdjJdIOKaoO+4jyBBbmFseXNpcyB0aW1lb3V0Jyk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbdjJdIEFuYWx5c2lzIGVycm9yOicsIGUpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIC8vIEdVQVJBTlRFRUQgQ0xFQU5VUCAtIEFsd2F5cyBjbG9zZSBwYWdlLCBldmVuIGlmIGVycm9ycyBvY2N1clxuICAgICAgaWYgKHBhZ2UpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCBwYWdlLmNsb3NlKCk7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1t2Ml0g8J+nuSBQYWdlIGNsZWFuZWQgdXAnKTtcbiAgICAgICAgfSBjYXRjaCAoY2xlYW51cEVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKCdbdjJdIOKaoO+4jyBGYWlsZWQgdG8gY2xvc2UgcGFnZSBkdXJpbmcgY2xlYW51cDonLCBjbGVhbnVwRXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVRdWFsaXR5U2NvcmUocGFyc2VkOiBhbnkpOiBudW1iZXIge1xuICAgIGxldCBzY29yZSA9IDA7XG4gICAgaWYgKHBhcnNlZC5zdW1tYXJ5ICYmIHBhcnNlZC5zdW1tYXJ5Lmxlbmd0aCA+IDUwKSB7XG4gICAgICBzY29yZSArPSAyNTtcbiAgICB9XG4gICAgaWYgKHBhcnNlZC5rZXlQb2ludHMgJiYgcGFyc2VkLmtleVBvaW50cy5sZW5ndGggPj0gMykge1xuICAgICAgc2NvcmUgKz0gMjU7XG4gICAgfVxuICAgIGlmIChwYXJzZWQuYWlDb25jZXB0cyAmJiBwYXJzZWQuYWlDb25jZXB0cy5sZW5ndGggPiAwKSB7XG4gICAgICBzY29yZSArPSAyNTtcbiAgICB9XG4gICAgaWYgKHBhcnNlZC50ZWNobmljYWxEZXRhaWxzICYmIHBhcnNlZC50ZWNobmljYWxEZXRhaWxzLmxlbmd0aCA+IDApIHtcbiAgICAgIHNjb3JlICs9IDI1O1xuICAgIH1cbiAgICByZXR1cm4gc2NvcmU7XG4gIH1cblxuICBwcml2YXRlIGV4dHJhY3RCdWxsZXRQb2ludHModGV4dDogc3RyaW5nKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGxpbmVzID0gdGV4dC5zcGxpdCgnXFxuJyk7XG4gICAgcmV0dXJuIGxpbmVzXG4gICAgICAuZmlsdGVyKFxuICAgICAgICAobGluZSkgPT5cbiAgICAgICAgICBsaW5lLnRyaW0oKS5zdGFydHNXaXRoKCctJykgfHwgbGluZS50cmltKCkuc3RhcnRzV2l0aCgn4oCiJykgfHwgbGluZS50cmltKCkubWF0Y2goL15cXGQrXFwuLylcbiAgICAgIClcbiAgICAgIC5tYXAoKGxpbmUpID0+IGxpbmUucmVwbGFjZSgvXlst4oCiXFxkLl0rXFxzKi8sICcnKS50cmltKCkpXG4gICAgICAuZmlsdGVyKChsaW5lKSA9PiBsaW5lLmxlbmd0aCA+IDEwKVxuICAgICAgLnNsaWNlKDAsIDEwKTtcbiAgfVxuXG4gIHByaXZhdGUgZXh0cmFjdEFJQ29uY2VwdHModGV4dDogc3RyaW5nKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGFpVGVybXMgPSBbXG4gICAgICAnbWFjaGluZSBsZWFybmluZycsXG4gICAgICAnbmV1cmFsIG5ldHdvcmsnLFxuICAgICAgJ2RlZXAgbGVhcm5pbmcnLFxuICAgICAgJ3RyYW5zZm9ybWVyJyxcbiAgICAgICdHUFQnLFxuICAgICAgJ0xMTScsXG4gICAgICAnbGFyZ2UgbGFuZ3VhZ2UgbW9kZWwnLFxuICAgICAgJ0FJIGFnZW50JyxcbiAgICAgICdlbWJlZGRpbmcnLFxuICAgICAgJ2ZpbmUtdHVuaW5nJyxcbiAgICAgICdSQUcnLFxuICAgICAgJ3ZlY3RvciBkYXRhYmFzZScsXG4gICAgICAncHJvbXB0IGVuZ2luZWVyaW5nJyxcbiAgICAgICdkaWZmdXNpb24nLFxuICAgICAgJ3N0YWJsZSBkaWZmdXNpb24nLFxuICAgICAgJ0RBTEwtRScsXG4gICAgICAnQ2xhdWRlJyxcbiAgICAgICdHZW1pbmknLFxuICAgICAgJ09wZW5BSScsXG4gICAgICAnQW50aHJvcGljJyxcbiAgICAgICdMYW5nQ2hhaW4nLFxuICAgICAgJ0F1dG9HUFQnLFxuICAgICAgJ2luZmVyZW5jZScsXG4gICAgICAndHJhaW5pbmcnLFxuICAgICAgJ21vZGVsJyxcbiAgICBdO1xuXG4gICAgY29uc3QgZm91bmQ6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3QgbG93ZXJUZXh0ID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuXG4gICAgZm9yIChjb25zdCB0ZXJtIG9mIGFpVGVybXMpIHtcbiAgICAgIGlmIChsb3dlclRleHQuaW5jbHVkZXModGVybS50b0xvd2VyQ2FzZSgpKSAmJiAhZm91bmQuaW5jbHVkZXModGVybSkpIHtcbiAgICAgICAgZm91bmQucHVzaCh0ZXJtKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZm91bmQ7XG4gIH1cblxuICBzYXZlUmVwb3J0KHZpZGVvOiBWaWRlb0VudHJ5KTogc3RyaW5nIHtcbiAgICBjb25zdCBzYWZlVGl0bGUgPSB2aWRlby50aXRsZS5yZXBsYWNlKC9bXmEtekEtWjAtOV0vZywgJ18nKS5zdWJzdHJpbmcoMCwgNTApO1xuICAgIGNvbnN0IHJlcG9ydEZpbGUgPSBwYXRoLmpvaW4oXG4gICAgICB0aGlzLnJlcG9ydHNEaXIsXG4gICAgICBgdjJfJHt2aWRlby5pbmRleH1fJHtzYWZlVGl0bGV9XyR7RGF0ZS5ub3coKX0ubWRgXG4gICAgKTtcblxuICAgIGxldCBjb250ZW50ID0gYCMgVmlkZW8gQW5hbHlzaXMgUmVwb3J0XFxuXFxuIyMgTWV0YWRhdGFcXG4tICoqVmlkZW8qKjogJHt2aWRlby50aXRsZX1cXG4tICoqSW5kZXgqKjogIyR7dmlkZW8uaW5kZXh9XFxuLSAqKlVSTCoqOiAke3ZpZGVvLnVybH1cXG4tICoqRHVyYXRpb24qKjogJHt2aWRlby5tZXRhZGF0YT8uZHVyYXRpb25Gb3JtYXR0ZWQgfHwgJ1Vua25vd24nfVxcbi0gKipDaGFubmVsKio6ICR7dmlkZW8ubWV0YWRhdGE/LmNoYW5uZWwgfHwgJ1Vua25vd24nfVxcbi0gKipWaWV3cyoqOiAke3ZpZGVvLm1ldGFkYXRhPy52aWV3Q291bnQgfHwgJ1Vua25vd24nfVxcbi0gKipQdWJsaXNoZWQqKjogJHt2aWRlby5tZXRhZGF0YT8ucHVibGlzaERhdGUgfHwgJ1Vua25vd24nfVxcbi0gKipQcm9jZXNzZWQqKjogJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCl9XFxuLSAqKlF1YWxpdHkgU2NvcmUqKjogJHt2aWRlby5hbmFseXNpcz8ucXVhbGl0eVNjb3JlIHx8IDB9JVxcblxcbi0tLVxcblxcbiMjIFN1bW1hcnlcXG4ke3ZpZGVvLmFuYWx5c2lzPy5zdW1tYXJ5IHx8IHZpZGVvLm1ldGFkYXRhPy5zdW1tYXJ5IHx8ICdObyBzdW1tYXJ5IGF2YWlsYWJsZSd9XFxuXFxuIyMgS2V5IFBvaW50c1xcbiR7KHZpZGVvLmFuYWx5c2lzPy5rZXlQb2ludHMgfHwgW10pLm1hcCgocCkgPT4gYC0gJHtwfWApLmpvaW4oJ1xcbicpIHx8ICctIE5vIGtleSBwb2ludHMgZXh0cmFjdGVkJ31cXG5cXG4jIyBBSSAmIFRlY2huaWNhbCBDb25jZXB0c1xcbiR7KHZpZGVvLmFuYWx5c2lzPy5haUNvbmNlcHRzIHx8IFtdKS5tYXAoKGMpID0+IGAtICR7Y31gKS5qb2luKCdcXG4nKSB8fCAnLSBOb25lIGlkZW50aWZpZWQnfVxcblxcbiMjIFRlY2huaWNhbCBEZXRhaWxzXFxuJHsodmlkZW8uYW5hbHlzaXM/LnRlY2huaWNhbERldGFpbHMgfHwgW10pLm1hcCgoZCkgPT4gYC0gJHtkfWApLmpvaW4oJ1xcbicpIHx8ICctIE5vbmUgaWRlbnRpZmllZCd9XFxuYDtcblxuICAgIGlmICh2aWRlby5hbmFseXNpcz8udmlzdWFsQ29udGV4dEZsYWdzICYmIHZpZGVvLmFuYWx5c2lzLnZpc3VhbENvbnRleHRGbGFncy5sZW5ndGggPiAwKSB7XG4gICAgICBjb250ZW50ICs9IGBcXG4jIyDimqDvuI8gU2VjdGlvbnMgTmVlZGluZyBWaXN1YWwgUmV2aWV3XFxuJHt2aWRlby5hbmFseXNpcy52aXN1YWxDb250ZXh0RmxhZ3NcbiAgICAgICAgLm1hcCgoZikgPT4gYC0gKioke3RoaXMuZm9ybWF0RHVyYXRpb24oZi50aW1lc3RhbXApfSoqOiAke2YucmVhc29ufSAtICR7Zi5jb250ZXh0fWApXG4gICAgICAgIC5qb2luKCdcXG4nKX1cXG5gO1xuICAgIH1cblxuICAgIGZzLndyaXRlRmlsZVN5bmMocmVwb3J0RmlsZSwgY29udGVudCk7XG5cbiAgICBpZiAodmlkZW8udHJhbnNjcmlwdCAmJiB2aWRlby50cmFuc2NyaXB0Lmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHRyYW5zY3JpcHRGaWxlID0gcGF0aC5qb2luKHRoaXMudHJhbnNjcmlwdHNEaXIsIGAke3ZpZGVvLmluZGV4fV8ke3NhZmVUaXRsZX0udHh0YCk7XG4gICAgICBjb25zdCB0cmFuc2NyaXB0Q29udGVudCA9IHZpZGVvLnRyYW5zY3JpcHRcbiAgICAgICAgLm1hcCgocykgPT4gYFske3RoaXMuZm9ybWF0RHVyYXRpb24ocy5zdGFydCl9XSAke3MudGV4dH1gKVxuICAgICAgICAuam9pbignXFxuJyk7XG4gICAgICBmcy53cml0ZUZpbGVTeW5jKHRyYW5zY3JpcHRGaWxlLCB0cmFuc2NyaXB0Q29udGVudCk7XG4gICAgfVxuXG4gICAgdGhpcy5hcHBlbmRUb0tub3dsZWRnZUJhc2UodmlkZW8pO1xuXG4gICAgcmV0dXJuIHJlcG9ydEZpbGU7XG4gIH1cblxuICBwcml2YXRlIGFwcGVuZFRvS25vd2xlZGdlQmFzZSh2aWRlbzogVmlkZW9FbnRyeSk6IHZvaWQge1xuICAgIGNvbnN0IGVudHJ5ID0gYFxcbi0tLVxcblxcbiMjICMke3ZpZGVvLmluZGV4fTogJHt2aWRlby50aXRsZX1cXG4qKlVSTCoqOiAke3ZpZGVvLnVybH1cXG4qKkR1cmF0aW9uKio6ICR7dmlkZW8ubWV0YWRhdGE/LmR1cmF0aW9uRm9ybWF0dGVkIHx8ICdVbmtub3duJ31cXG5cXG4jIyMgU3VtbWFyeVxcbiR7dmlkZW8uYW5hbHlzaXM/LnN1bW1hcnkgfHwgJ05vIHN1bW1hcnknfVxcblxcbiMjIyBLZXkgSW5zaWdodHNcXG4ke1xuICAgICAgKHZpZGVvLmFuYWx5c2lzPy5rZXlQb2ludHMgfHwgW10pXG4gICAgICAgIC5zbGljZSgwLCA1KVxuICAgICAgICAubWFwKChwKSA9PiBgLSAke3B9YClcbiAgICAgICAgLmpvaW4oJ1xcbicpIHx8ICctIE5vbmUnXG4gICAgfVxcblxcbiMjIyBBSSBDb25jZXB0cyBDb3ZlcmVkXFxuJHsodmlkZW8uYW5hbHlzaXM/LmFpQ29uY2VwdHMgfHwgW10pLmpvaW4oJywgJykgfHwgJ05vbmUnfVxcblxcbmA7XG5cbiAgICBmcy5hcHBlbmRGaWxlU3luYyh0aGlzLmtub3dsZWRnZUJhc2VGaWxlLCBlbnRyeSk7XG4gIH1cblxuICBhc3luYyBwcm9jZXNzVmlkZW8odmlkZW86IFZpZGVvRW50cnkpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAoXG4gICAgICB2aWRlby5zdGF0dXMgPT09ICdjb21wbGV0ZWQnIHx8XG4gICAgICB2aWRlby5zdGF0dXMgPT09ICdza2lwcGVkJyB8fFxuICAgICAgdmlkZW8uc3RhdHVzID09PSAnbmVlZHNfdmlzdWFsJ1xuICAgICkge1xuICAgICAgY29uc29sZS5sb2coYFt2Ml0g4o+t77iPIFNraXBwaW5nICMke3ZpZGVvLmluZGV4fSAoJHt2aWRlby5zdGF0dXN9KWApO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHZpZGVvLnByb2Nlc3NpbmdBdHRlbXB0cyA+PSAzKSB7XG4gICAgICBjb25zb2xlLmxvZyhgW3YyXSDij63vuI8gU2tpcHBpbmcgIyR7dmlkZW8uaW5kZXh9IChtYXggYXR0ZW1wdHMgcmVhY2hlZClgKTtcbiAgICAgIHZpZGVvLnN0YXR1cyA9ICdza2lwcGVkJztcbiAgICAgIHRoaXMuc3RhdGUuc3RhdHMuc2tpcHBlZCsrO1xuICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBIRUFMVEggQ0hFQ0sgLSBFbnN1cmUgYnJvd3NlciBpcyBhbGl2ZSBiZWZvcmUgcHJvY2Vzc2luZ1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlQnJvd3NlckhlYWx0aCgpO1xuXG4gICAgY29uc29sZS5sb2coYFxcbiR7J+KVkCcucmVwZWF0KDcwKX1gKTtcbiAgICBjb25zb2xlLmxvZyhgVmlkZW8gIyR7dmlkZW8uaW5kZXh9OiAke3ZpZGVvLnRpdGxlfWApO1xuICAgIGNvbnNvbGUubG9nKGBBdHRlbXB0OiAke3ZpZGVvLnByb2Nlc3NpbmdBdHRlbXB0cyArIDF9LzNgKTtcbiAgICBjb25zb2xlLmxvZyhgJHsn4pWQJy5yZXBlYXQoNzApfVxcbmApO1xuXG4gICAgdmlkZW8ucHJvY2Vzc2luZ0F0dGVtcHRzKys7XG4gICAgdmlkZW8ubGFzdFByb2Nlc3NlZCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGlmICghdmlkZW8ubWV0YWRhdGEpIHtcbiAgICAgICAgdmlkZW8uc3RhdHVzID0gJ21ldGFkYXRhJztcbiAgICAgICAgdmlkZW8ubWV0YWRhdGEgPSAoYXdhaXQgdGhpcy5mZXRjaEVucmljaGVkTWV0YWRhdGEodmlkZW8pKSB8fCB1bmRlZmluZWQ7XG4gICAgICAgIGlmICh2aWRlby5tZXRhZGF0YSkge1xuICAgICAgICAgIHRoaXMuc3RhdGUuc3RhdHMubWV0YWRhdGFDb21wbGV0ZSsrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy50YXJnZXRQaGFzZSA9PT0gJ21ldGFkYXRhJykgcmV0dXJuIHRydWU7XG5cbiAgICAgIGlmICghdmlkZW8udHJhbnNjcmlwdCkge1xuICAgICAgICB2aWRlby5zdGF0dXMgPSAndHJhbnNjcmlwdCc7XG4gICAgICAgIHZpZGVvLnRyYW5zY3JpcHQgPSAoYXdhaXQgdGhpcy5leHRyYWN0VHJhbnNjcmlwdERpcmVjdCh2aWRlbykpIHx8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHZpZGVvLnRyYW5zY3JpcHQpIHtcbiAgICAgICAgICB0aGlzLnN0YXRlLnN0YXRzLnRyYW5zY3JpcHRzRXh0cmFjdGVkKys7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnRhcmdldFBoYXNlID09PSAndHJhbnNjcmlwdCcpIHJldHVybiB0cnVlO1xuXG4gICAgICBpZiAodmlkZW8udHJhbnNjcmlwdCAmJiAhdmlkZW8uYW5hbHlzaXMpIHtcbiAgICAgICAgdmlkZW8uc3RhdHVzID0gJ2FuYWx5emVkJztcbiAgICAgICAgdmlkZW8uYW5hbHlzaXMgPSAoYXdhaXQgdGhpcy5hbmFseXplV2l0aEFJKHZpZGVvKSkgfHwgdW5kZWZpbmVkO1xuICAgICAgICBpZiAodmlkZW8uYW5hbHlzaXMpIHtcbiAgICAgICAgICB0aGlzLnN0YXRlLnN0YXRzLmFuYWx5emVkKys7XG4gICAgICAgICAgaWYgKHZpZGVvLmFuYWx5c2lzLnZpc3VhbENvbnRleHRGbGFncy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLnN0YXRzLm5lZWRzVmlzdWFsUmV2aWV3Kys7XG4gICAgICAgICAgICB2aWRlby5zdGF0dXMgPSAnbmVlZHNfdmlzdWFsJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHZpZGVvLmFuYWx5c2lzKSB7XG4gICAgICAgIGNvbnN0IHJlcG9ydFBhdGggPSB0aGlzLnNhdmVSZXBvcnQodmlkZW8pO1xuICAgICAgICBjb25zb2xlLmxvZyhgW3YyXSDinIUgUmVwb3J0OiAke3BhdGguYmFzZW5hbWUocmVwb3J0UGF0aCl9YCk7XG4gICAgICAgIHZpZGVvLnN0YXR1cyA9ICdjb21wbGV0ZWQnO1xuICAgICAgICB0aGlzLnN0YXRlLnN0YXRzLmNvbXBsZXRlZCsrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmlkZW8uc3RhdHVzID0gJ2Vycm9yJztcbiAgICAgICAgdmlkZW8uZXJyb3IgPSAnQW5hbHlzaXMgZmFpbGVkJztcbiAgICAgICAgdGhpcy5zdGF0ZS5zdGF0cy5lcnJvcnMrKztcbiAgICAgIH1cblxuICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgIHRoaXMucHJpbnRQcm9ncmVzcygpO1xuICAgICAgcmV0dXJuIHZpZGVvLnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCc7XG4gICAgfSBjYXRjaCAoZTogdW5rbm93bikge1xuICAgICAgY29uc29sZS5lcnJvcihgW3YyXSBFcnJvciBwcm9jZXNzaW5nICMke3ZpZGVvLmluZGV4fTpgLCBlKTtcbiAgICAgIHZpZGVvLmVycm9yID0gKGUgYXMgRXJyb3IpLm1lc3NhZ2U7XG4gICAgICB2aWRlby5zdGF0dXMgPSAnZXJyb3InO1xuICAgICAgdGhpcy5zdGF0ZS5zdGF0cy5lcnJvcnMrKztcbiAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwcmludFByb2dyZXNzKCk6IHZvaWQge1xuICAgIGNvbnN0IHMgPSB0aGlzLnN0YXRlLnN0YXRzO1xuICAgIGNvbnNvbGUubG9nKGBcXG7wn5OKIFByb2dyZXNzOiAke3MuY29tcGxldGVkfS8ke3MudG90YWxWaWRlb3N9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIENvbXBsZXRlZDogJHtzLmNvbXBsZXRlZH0gfCBBbmFseXplZDogJHtzLmFuYWx5emVkfSB8IEVycm9yczogJHtzLmVycm9yc31gKTtcbiAgICBjb25zb2xlLmxvZyhgICAgU3VjY2VzcyBSYXRlOiAke3MuYW5hbHlzaXNTdWNjZXNzUmF0ZS50b0ZpeGVkKDEpfSVcXG5gKTtcbiAgfVxuXG4gIGFzeW5jIHJ1bihsaWJyYXJ5UGF0aDogc3RyaW5nLCBzdGFydEluZGV4OiBudW1iZXIgPSA2MzMsIGVuZEluZGV4OiBudW1iZXIgPSAxKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coYPCfmoAgVHJhbnNjcmlwdCBQcm9jZXNzb3IgdjIgLSBPcHRpbWl6ZWQgRWRpdGlvbmApO1xuICAgIGNvbnNvbGUubG9nKGBMaWJyYXJ5OiAke2xpYnJhcnlQYXRofWApO1xuICAgIGNvbnNvbGUubG9nKGBSYW5nZTogIyR7c3RhcnRJbmRleH0g4oaSICMke2VuZEluZGV4fWApO1xuICAgIGNvbnNvbGUubG9nKGBNb2RlbDogJHtHRU1JTklfTU9ERUx9YCk7XG5cbiAgICBhd2FpdCB0aGlzLmluaXRpYWxpemUoKTtcblxuICAgIC8vIExvYWQgbGlicmFyeVxuICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMobGlicmFyeVBhdGgsICd1dGYtOCcpO1xuICAgIGNvbnN0IHZpZGVvczogVmlkZW9FbnRyeVtdID0gW107XG4gICAgY29uc3Qgcm93UmVnZXggPVxuICAgICAgLzx0cj5cXHMqPHRkW14+XSo+XFxzKihcXGQrKVxccyo8XFwvdGQ+XFxzKjx0ZFtePl0qPlxccyo8YVxccytocmVmPVwiKFteXCJdKylcIltePl0qPihbXjxdKyk8XFwvYT5cXHMqPFxcL3RkPi9nO1xuICAgIGxldCBtYXRjaDtcblxuICAgIHdoaWxlICgobWF0Y2ggPSByb3dSZWdleC5leGVjKGNvbnRlbnQpKSAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgaW5kZXggPSBwYXJzZUludChtYXRjaFsxXSk7XG4gICAgICBpZiAoaW5kZXggPD0gc3RhcnRJbmRleCAmJiBpbmRleCA+PSBlbmRJbmRleCkge1xuICAgICAgICAvLyBDaGVjayBpZiBhbHJlYWR5IGluIHF1ZXVlXG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5zdGF0ZS5xdWV1ZS5maW5kKCh2KSA9PiB2LmluZGV4ID09PSBpbmRleCk7XG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgIHZpZGVvcy5wdXNoKGV4aXN0aW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2aWRlb3MucHVzaCh7XG4gICAgICAgICAgICBpbmRleCxcbiAgICAgICAgICAgIHVybDogbWF0Y2hbMl0sXG4gICAgICAgICAgICB0aXRsZTogbWF0Y2hbM10udHJpbSgpLFxuICAgICAgICAgICAgdmlkZW9JZDogdGhpcy5leHRyYWN0VmlkZW9JZChtYXRjaFsyXSkgfHwgJycsXG4gICAgICAgICAgICBzdGF0dXM6ICdwZW5kaW5nJyxcbiAgICAgICAgICAgIHByb2Nlc3NpbmdBdHRlbXB0czogMCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFNvcnQgZGVzY2VuZGluZ1xuICAgIHZpZGVvcy5zb3J0KChhLCBiKSA9PiBiLmluZGV4IC0gYS5pbmRleCk7XG5cbiAgICAvLyBVcGRhdGUgc3RhdGUgcXVldWUgcmVzcGVjdGluZyBleGlzdGluZyBlbnRyaWVzXG4gICAgdGhpcy5zdGF0ZS5xdWV1ZSA9IHZpZGVvcztcbiAgICB0aGlzLnN0YXRlLnN0YXRzLnRvdGFsVmlkZW9zID0gdmlkZW9zLmxlbmd0aDtcbiAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuXG4gICAgY29uc29sZS5sb2coYFt2Ml0gUHJvY2Vzc2luZyAke3ZpZGVvcy5sZW5ndGh9IHZpZGVvcy4uLmApO1xuXG4gICAgZm9yIChjb25zdCB2aWRlbyBvZiB2aWRlb3MpIHtcbiAgICAgIHRoaXMuc3RhdGUuY3VycmVudEluZGV4ID0gdmlkZW8uaW5kZXg7XG4gICAgICBhd2FpdCB0aGlzLnByb2Nlc3NWaWRlbyh2aWRlbyk7XG4gICAgICAvLyBTbWFsbCBjb29sZG93blxuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHIpID0+IHNldFRpbWVvdXQociwgMjAwMCkpO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCdbdjJdIPCfjokgQWxsIGRvbmUhJyk7XG4gICAgaWYgKHRoaXMuY29udGV4dCkge1xuICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmNsb3NlKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVuaXZlcnNhbCBGYWxsYmFjazogRG93bmxvYWQgdHJhbnNjcmlwdCB1c2luZyB5dC1kbHBcbiAgICovXG4gIHByaXZhdGUgZG93bmxvYWRUcmFuc2NyaXB0V2l0aFl0RGxwKHVybDogc3RyaW5nLCB2aWRlb0lkOiBzdHJpbmcpOiBUcmFuc2NyaXB0U2VnbWVudFtdIHwgbnVsbCB7XG4gICAgY29uc3QgdGVtcERpciA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUodGhpcy5yZXBvcnRzRGlyKSwgJ3RlbXBfc3VicycpO1xuXG4gICAgLy8gRW5zdXJlIHRlbXAgZGlyIGV4aXN0c1xuICAgIGlmICghZnMuZXhpc3RzU3luYyh0ZW1wRGlyKSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgZnMubWtkaXJTeW5jKHRlbXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgfSBjYXRjaCAoZSkge31cbiAgICB9XG5cbiAgICBjb25zdCBvdXRwdXRGaWxlQmFzZSA9IHBhdGguam9pbih0ZW1wRGlyLCB2aWRlb0lkKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zb2xlLmxvZyhgW3YyXSBSdW5uaW5nIHl0LWRscCBmb3IgJHt2aWRlb0lkfS4uLmApO1xuXG4gICAgICAvLyBDbGVhbiB1cCBwcmV2aW91cyBwb3RlbnRpYWwgZmlsZXNcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gZnMucmVhZGRpclN5bmModGVtcERpcikuZmlsdGVyKChmKSA9PiBmLnN0YXJ0c1dpdGgodmlkZW9JZCkpO1xuICAgICAgICBleGlzdGluZy5mb3JFYWNoKChmKSA9PiBmcy51bmxpbmtTeW5jKHBhdGguam9pbih0ZW1wRGlyLCBmKSkpO1xuICAgICAgfSBjYXRjaCAoZSkge31cblxuICAgICAgLy8gQ29tbWFuZCB0byBnZXQgVlRUXG4gICAgICBjb25zdCBjb21tYW5kID0gYHl0LWRscCAtLXdyaXRlLWF1dG8tc3ViIC0td3JpdGUtc3ViIC0tc3ViLWxhbmcgZW4gLS1za2lwLWRvd25sb2FkIC0tb3V0cHV0IFwiJHtvdXRwdXRGaWxlQmFzZX1cIiBcIiR7dXJsfVwiYDtcbiAgICAgIGV4ZWNTeW5jKGNvbW1hbmQsIHsgc3RkaW86ICdpZ25vcmUnIH0pO1xuXG4gICAgICAvLyBGaW5kIHRoZSBnZW5lcmF0ZWQgZmlsZSAoLmVuLnZ0dCBvciBzaW1pbGFyKVxuICAgICAgY29uc3QgZmlsZXMgPSBmcy5yZWFkZGlyU3luYyh0ZW1wRGlyKTtcbiAgICAgIGNvbnN0IHN1YkZpbGUgPSBmaWxlcy5maW5kKChmKSA9PiBmLnN0YXJ0c1dpdGgodmlkZW9JZCkgJiYgZi5lbmRzV2l0aCgnLnZ0dCcpKTtcblxuICAgICAgaWYgKCFzdWJGaWxlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIE5vIC52dHQgZmlsZSBjcmVhdGVkIGJ5IHl0LWRscCcpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgLy8gUGFyc2UgVlRUXG4gICAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbih0ZW1wRGlyLCBzdWJGaWxlKSwgJ3V0Zi04Jyk7XG4gICAgICBjb25zdCBzZWdtZW50czogVHJhbnNjcmlwdFNlZ21lbnRbXSA9IFtdO1xuICAgICAgY29uc3QgYmxvY2tzID0gY29udGVudC5zcGxpdCgvXFxuXFxyP1xcbi8pO1xuXG4gICAgICBmb3IgKGNvbnN0IGJsb2NrIG9mIGJsb2Nrcykge1xuICAgICAgICBjb25zdCB0aW1lTWF0Y2ggPSBibG9jay5tYXRjaChcbiAgICAgICAgICAvKFxcZHsyfSk6KFxcZHsyfSk6KFxcZHsyfSlcXC4oXFxkezN9KVxccy0tPlxccyhcXGR7Mn0pOihcXGR7Mn0pOihcXGR7Mn0pXFwuKFxcZHszfSkvXG4gICAgICAgICk7XG4gICAgICAgIGlmICh0aW1lTWF0Y2gpIHtcbiAgICAgICAgICBjb25zdCBsaW5lcyA9IGJsb2NrLnNwbGl0KCdcXG4nKTtcbiAgICAgICAgICBjb25zdCB0aW1lTGluZUluZGV4ID0gbGluZXMuZmluZEluZGV4KChsKSA9PiBsLmluY2x1ZGVzKCctLT4nKSk7XG4gICAgICAgICAgaWYgKHRpbWVMaW5lSW5kZXggIT09IC0xICYmIHRpbWVMaW5lSW5kZXggPCBsaW5lcy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICBsZXQgdGV4dCA9IGxpbmVzXG4gICAgICAgICAgICAgIC5zbGljZSh0aW1lTGluZUluZGV4ICsgMSlcbiAgICAgICAgICAgICAgLmpvaW4oJyAnKVxuICAgICAgICAgICAgICAucmVwbGFjZSgvPFtePl0qPi9nLCAnJylcbiAgICAgICAgICAgICAgLnRyaW0oKTtcbiAgICAgICAgICAgIGlmICh0ZXh0ICYmIHRleHQgIT09ICdhbGlnbjpzdGFydCBwb3NpdGlvbjowJScpIHtcbiAgICAgICAgICAgICAgdGV4dCA9IHRleHRcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvJmFtcDsvZywgJyYnKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8mcXVvdDsvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvJiMzOTsvZywgXCInXCIpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoLyZsdDsvZywgJzwnKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8mZ3Q7L2csICc+Jyk7XG5cbiAgICAgICAgICAgICAgY29uc3Qgc3RhcnRTZWMgPVxuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFsxXSkgKiAzNjAwICtcbiAgICAgICAgICAgICAgICBwYXJzZUludCh0aW1lTWF0Y2hbMl0pICogNjAgK1xuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFszXSkgK1xuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFs0XSkgLyAxMDAwO1xuXG4gICAgICAgICAgICAgIGNvbnN0IGVuZFNlYyA9XG4gICAgICAgICAgICAgICAgcGFyc2VJbnQodGltZU1hdGNoWzVdKSAqIDM2MDAgK1xuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFs2XSkgKiA2MCArXG4gICAgICAgICAgICAgICAgcGFyc2VJbnQodGltZU1hdGNoWzddKSArXG4gICAgICAgICAgICAgICAgcGFyc2VJbnQodGltZU1hdGNoWzhdKSAvIDEwMDA7XG5cbiAgICAgICAgICAgICAgc2VnbWVudHMucHVzaCh7XG4gICAgICAgICAgICAgICAgc3RhcnQ6IHN0YXJ0U2VjLFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiBlbmRTZWMgLSBzdGFydFNlYyxcbiAgICAgICAgICAgICAgICB0ZXh0OiB0ZXh0LFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQ2xlYW51cFxuICAgICAgdHJ5IHtcbiAgICAgICAgZnMudW5saW5rU3luYyhwYXRoLmpvaW4odGVtcERpciwgc3ViRmlsZSkpO1xuICAgICAgfSBjYXRjaCAoZSkge31cblxuICAgICAgaWYgKHNlZ21lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIHNlZ21lbnRzO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1t2Ml0geXQtZGxwIGV4ZWN1dGlvbiBlcnJvcjonLCBlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBtYWluKCkge1xuICBjb25zdCBhcmdzID0gcHJvY2Vzcy5hcmd2LnNsaWNlKDIpO1xuICBjb25zdCBzdGFydEFyZyA9IGFyZ3MuZmluZCgoYSkgPT4gYS5zdGFydHNXaXRoKCctLXN0YXJ0PScpKTtcbiAgY29uc3QgZW5kQXJnID0gYXJncy5maW5kKChhKSA9PiBhLnN0YXJ0c1dpdGgoJy0tZW5kPScpKTtcbiAgY29uc3QgcGhhc2VBcmcgPSBhcmdzLmZpbmQoKGEpID0+IGEuc3RhcnRzV2l0aCgnLS1waGFzZT0nKSk7XG5cbiAgY29uc3Qgc3RhcnQgPSBzdGFydEFyZyA/IHBhcnNlSW50KHN0YXJ0QXJnLnNwbGl0KCc9JylbMV0pIDogNjMzO1xuICBjb25zdCBlbmQgPSBlbmRBcmcgPyBwYXJzZUludChlbmRBcmcuc3BsaXQoJz0nKVsxXSkgOiAxO1xuICBjb25zdCBwaGFzZSA9IChwaGFzZUFyZyA/IHBoYXNlQXJnLnNwbGl0KCc9JylbMV0gOiAnYW5hbHlzaXMnKSBhc1xuICAgIHwgJ21ldGFkYXRhJ1xuICAgIHwgJ3RyYW5zY3JpcHQnXG4gICAgfCAnYW5hbHlzaXMnO1xuXG4gIGNvbnN0IGxpYnJhcnlQYXRoID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICcuLicsICcuLicsICdhaV92aWRlb19saWJyYXJ5Lmh0bWwnKTtcblxuICBjb25zdCBwcm9jZXNzb3IgPSBuZXcgVHJhbnNjcmlwdFByb2Nlc3NvclYyKHBoYXNlKTtcbiAgYXdhaXQgcHJvY2Vzc29yLnJ1bihsaWJyYXJ5UGF0aCwgc3RhcnQsIGVuZCk7XG59XG5cbm1haW4oKS5jYXRjaChjb25zb2xlLmVycm9yKTtcbiJdfQ==
