'use strict';
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
const child_process_1 = require('child_process');
const fs = __importStar(require('fs'));
const path = __importStar(require('path'));
const playwright_1 = require('playwright');
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
    // Use the SAME profile as the original processor where user is already logged in
    const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome');
    console.log('[v2] 🚀 Launching Chrome (using existing login session)...');
    fs.mkdirSync(profileDir, { recursive: true });
    this.context = await playwright_1.chromium.launchPersistentContext(profileDir, {
      headless: false,
      channel: 'chrome',
      args: [
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--exclude-switches=enable-automation',
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--disable-background-networking',
        '--enable-features=NetworkService,NetworkServiceInProcess',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-component-extensions-with-background-pages',
        '--disable-default-apps',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-features=Translate',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-sync',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--no-service-autorun',
        '--export-tagged-pdf',
        '--generate-pdf-document-outline',
        '--window-position=0,0',
        '--ignore-certificate-errors',
        '--allow-running-insecure-content',
        '--disable-web-security',
      ],
      viewport: { width: 1400, height: 900 },
      ignoreDefaultArgs: ['--enable-automation'],
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    console.log('[v2] ✅ Browser ready');
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
  // --- FIXED PARSING METHOD ---
  async analyzeWithAI(video) {
    if (!this.context || !video.transcript) {
      return null;
    }
    console.log(`[v2] 🤖 AI Analysis: ${video.title}`);
    // FRESH page for AI Studio
    const page = await this.context.newPage();
    try {
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
      while (Date.now() - startWait < timeout) {
        await page.waitForTimeout(3000);
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
            await page.close();
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
      await page.close();
      console.log('[v2] ⚠️ Analysis timeout');
      return null;
    } catch (e) {
      console.error('[v2] Analysis error:', e);
      try {
        await page.close();
      } catch (x) {}
      return null;
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
    if (video.status === 'completed' || video.status === 'skipped') {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHJhbnNjcmlwdFByb2Nlc3NvclYyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiVHJhbnNjcmlwdFByb2Nlc3NvclYyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7Ozs7O0dBWUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsaURBQXlDO0FBQ3pDLHVDQUF5QjtBQUN6QiwyQ0FBNkI7QUFFN0IsMkNBQXNFO0FBZ0Z0RSw2Q0FBNkM7QUFDN0MsTUFBTSxZQUFZLEdBQUcsd0JBQXdCLENBQUM7QUFDOUMsTUFBTSxhQUFhLEdBQUcsMERBQTBELFlBQVksRUFBRSxDQUFDO0FBRS9GLE1BQU0sZUFBZSxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7O0NBZ0J2QixDQUFDO0FBRUYsTUFBTSxxQkFBcUI7SUFTekIsWUFBWSxjQUFzRCxVQUFVO1FBUnBFLFlBQU8sR0FBMEIsSUFBSSxDQUFDO1FBTXRDLGdCQUFXLEdBQTJDLFVBQVUsQ0FBQztRQUd2RSxJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztRQUMvQixvRUFBb0U7UUFDcEUsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDdkQsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFFMUQsZ0ZBQWdGO1FBQ2hGLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDO1FBRTFFLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztRQUNwRSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FB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S0FBSyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBRy9DLENBQUM7SUFFZixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLHVCQUF1QixDQUFDLENBQUM7SUFFbEYsTUFBTSxTQUFTLEdBQUcsSUFBSSxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNuRCxNQUFNLFNBQVMsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztBQUMvQyxDQUFDO0FBRUQsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVHJhbnNjcmlwdCBQcm9jZXNzb3IgdjIgLSBPcHRpbWl6ZWQgRWRpdGlvblxuICpcbiAqIEltcHJvdmVtZW50cyBvdmVyIHYxOlxuICogMS4gVXNlcyBsYXRlc3QgR2VtaW5pIDMgRmxhc2ggbW9kZWwgKGdlbWluaS0zLWZsYXNoLXByZXZpZXcpXG4gKiAyLiBGcmVzaCBicm93c2VyIHBhZ2UgZm9yIEVBQ0ggb3BlcmF0aW9uXG4gKiAzLiBCZXR0ZXIgSlNPTiBleHRyYWN0aW9uIGZyb20gQUkgcmVzcG9uc2VzXG4gKiA0LiBNYXhpbWl6ZWQgR29vZ2xlIFNlYXJjaCBBSSBtb2RlIHF1ZXJpZXNcbiAqIDUuIERpcmVjdCB0cmFuc2NyaXB0IGV4dHJhY3Rpb24gdmlhIEFQSSAobm8gWW91VHViZSBwYWdlIHZpc2l0IHdoZW4gcG9zc2libGUpXG4gKiA2LiBDZW50cmFsaXplZCBrbm93bGVkZ2UgYmFzZSBjb25zb2xpZGF0aW9uXG4gKiA3LiBQcm9wZXIgc3RhdHVzIHRyYWNraW5nIHRvIHByZXZlbnQgbG9vcHNcbiAqIDguIFN1Y2Nlc3MgbWV0cmljcyBhbmQgcXVhbGl0eSBldmFsdWF0aW9uXG4gKi9cblxuaW1wb3J0IHsgZXhlY1N5bmMgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbmltcG9ydCB7IGNocm9taXVtLCB0eXBlIEJyb3dzZXJDb250ZXh0LCB0eXBlIFBhZ2UgfSBmcm9tICdwbGF5d3JpZ2h0JztcblxuaW50ZXJmYWNlIFZpZGVvRW50cnkge1xuICBpbmRleDogbnVtYmVyO1xuICB1cmw6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgdmlkZW9JZDogc3RyaW5nO1xuICBtZXRhZGF0YT86IFZpZGVvTWV0YWRhdGE7XG4gIHRyYW5zY3JpcHQ/OiBUcmFuc2NyaXB0U2VnbWVudFtdO1xuICBhbmFseXNpcz86IEFuYWx5c2lzUmVzdWx0O1xuICBzdGF0dXM6XG4gICAgfCAncGVuZGluZydcbiAgICB8ICdtZXRhZGF0YSdcbiAgICB8ICd0cmFuc2NyaXB0J1xuICAgIHwgJ2FuYWx5emVkJ1xuICAgIHwgJ25lZWRzX3Zpc3VhbCdcbiAgICB8ICdjb21wbGV0ZWQnXG4gICAgfCAnc2tpcHBlZCdcbiAgICB8ICdlcnJvcic7XG4gIHByb2Nlc3NpbmdBdHRlbXB0czogbnVtYmVyO1xuICBsYXN0UHJvY2Vzc2VkPzogc3RyaW5nO1xuICBlcnJvcj86IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFZpZGVvTWV0YWRhdGEge1xuICBkdXJhdGlvbjogbnVtYmVyO1xuICBkdXJhdGlvbkZvcm1hdHRlZDogc3RyaW5nO1xuICBkZXNjcmlwdGlvbj86IHN0cmluZztcbiAgY2hhbm5lbD86IHN0cmluZztcbiAgcHVibGlzaERhdGU/OiBzdHJpbmc7XG4gIHZpZXdDb3VudD86IHN0cmluZztcbiAgY2F0ZWdvcnk/OiBzdHJpbmc7XG4gIHRhZ3M/OiBzdHJpbmdbXTtcbiAgc3VtbWFyeT86IHN0cmluZzsgLy8gQUktZ2VuZXJhdGVkIHN1bW1hcnkgZnJvbSBHb29nbGVcbn1cblxuaW50ZXJmYWNlIFRyYW5zY3JpcHRTZWdtZW50IHtcbiAgc3RhcnQ6IG51bWJlcjtcbiAgZHVyYXRpb246IG51bWJlcjtcbiAgdGV4dDogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgQW5hbHlzaXNSZXN1bHQge1xuICBrZXlQb2ludHM6IHN0cmluZ1tdO1xuICBhaUNvbmNlcHRzOiBzdHJpbmdbXTtcbiAgdGVjaG5pY2FsRGV0YWlsczogc3RyaW5nW107XG4gIHZpc3VhbENvbnRleHRGbGFnczogVmlzdWFsQ29udGV4dEZsYWdbXTtcbiAgc3VtbWFyeTogc3RyaW5nO1xuICBxdWFsaXR5U2NvcmU/OiBudW1iZXI7XG4gIHJhd1Jlc3BvbnNlPzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgVmlzdWFsQ29udGV4dEZsYWcge1xuICB0aW1lc3RhbXA6IG51bWJlcjtcbiAgcmVhc29uOiBzdHJpbmc7XG4gIGNvbnRleHQ6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFByb2Nlc3NpbmdTdGF0ZSB7XG4gIHZlcnNpb246IHN0cmluZztcbiAgcXVldWU6IFZpZGVvRW50cnlbXTtcbiAgY3VycmVudEluZGV4OiBudW1iZXI7XG4gIHN0YXJ0ZWRBdDogc3RyaW5nO1xuICBsYXN0VXBkYXRlZDogc3RyaW5nO1xuICBzdGF0czogUHJvY2Vzc2luZ1N0YXRzO1xufVxuXG5pbnRlcmZhY2UgUHJvY2Vzc2luZ1N0YXRzIHtcbiAgdG90YWxWaWRlb3M6IG51bWJlcjtcbiAgbWV0YWRhdGFDb21wbGV0ZTogbnVtYmVyO1xuICB0cmFuc2NyaXB0c0V4dHJhY3RlZDogbnVtYmVyO1xuICBhbmFseXplZDogbnVtYmVyO1xuICBuZWVkc1Zpc3VhbFJldmlldzogbnVtYmVyO1xuICBjb21wbGV0ZWQ6IG51bWJlcjtcbiAgc2tpcHBlZDogbnVtYmVyO1xuICBlcnJvcnM6IG51bWJlcjtcbiAgYW5hbHlzaXNTdWNjZXNzUmF0ZTogbnVtYmVyO1xuICBhdmVyYWdlVHJhbnNjcmlwdExlbmd0aDogbnVtYmVyO1xufVxuXG4vLyBMYXRlc3QgYXZhaWxhYmxlIG1vZGVsIGFzIG9mIEphbiAyMDI1LzIwMjZcbmNvbnN0IEdFTUlOSV9NT0RFTCA9ICdnZW1pbmktMy1mbGFzaC1wcmV2aWV3JztcbmNvbnN0IEFJX1NUVURJT19VUkwgPSBgaHR0cHM6Ly9haXN0dWRpby5nb29nbGUuY29tL2FwcC9wcm9tcHRzL25ld19jaGF0P21vZGVsPSR7R0VNSU5JX01PREVMfWA7XG5cbmNvbnN0IEFOQUxZU0lTX1BST01QVCA9IGBZb3UgYXJlIGFuYWx5emluZyBhIFlvdVR1YmUgdmlkZW8gdHJhbnNjcmlwdC4gRXh0cmFjdCBhbmQgc3RydWN0dXJlIHRoZSBmb2xsb3dpbmcgaW5mb3JtYXRpb24gYXMgdmFsaWQgSlNPTiBvbmx5IChubyBtYXJrZG93biwgbm8gZXh0cmEgdGV4dCkuXG5cblJldHVybiBPTkxZIHRoaXMgSlNPTiBzdHJ1Y3R1cmU6XG57XG4gIFwic3VtbWFyeVwiOiBcIjItMyBzZW50ZW5jZSBzdW1tYXJ5IG9mIHRoZSB2aWRlbyBjb250ZW50XCIsXG4gIFwia2V5UG9pbnRzXCI6IFtcInBvaW50IDFcIiwgXCJwb2ludCAyXCIsIC4uLl0sXG4gIFwiYWlDb25jZXB0c1wiOiBbXCJBSSBjb25jZXB0IDFcIiwgXCJBSSBjb25jZXB0IDJcIiwgLi4uXSxcbiAgXCJ0ZWNobmljYWxEZXRhaWxzXCI6IFtcInRvb2wvZnJhbWV3b3JrIDFcIiwgXCJpbXBsZW1lbnRhdGlvbiBkZXRhaWxcIiwgLi4uXSxcbiAgXCJ2aXN1YWxDb250ZXh0RmxhZ3NcIjogW1xuICAgIHtcInRpbWVzdGFtcFwiOiAxMjAsIFwicmVhc29uXCI6IFwiQ29kZSBkZW1vXCIsIFwiY29udGV4dFwiOiBcIlNob3dzIFB5dGhvbiBpbXBsZW1lbnRhdGlvblwifVxuICBdXG59XG5cbklmIHRoZSB2aWRlbyBpcyBub3QgYWJvdXQgQUkvdGVjaCwgc2V0IGFpQ29uY2VwdHMgYW5kIHRlY2huaWNhbERldGFpbHMgdG8gZW1wdHkgYXJyYXlzIGJ1dCBzdGlsbCBleHRyYWN0IGtleVBvaW50cy5cblxuVFJBTlNDUklQVDpcbmA7XG5cbmNsYXNzIFRyYW5zY3JpcHRQcm9jZXNzb3JWMiB7XG4gIHByaXZhdGUgY29udGV4dDogQnJvd3NlckNvbnRleHQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBzdGF0ZTogUHJvY2Vzc2luZ1N0YXRlO1xuICBwcml2YXRlIHN0YXRlRmlsZVBhdGg6IHN0cmluZztcbiAgcHJpdmF0ZSByZXBvcnRzRGlyOiBzdHJpbmc7XG4gIHByaXZhdGUgdHJhbnNjcmlwdHNEaXI6IHN0cmluZztcbiAgcHJpdmF0ZSBrbm93bGVkZ2VCYXNlRmlsZTogc3RyaW5nO1xuICBwcml2YXRlIHRhcmdldFBoYXNlOiAnbWV0YWRhdGEnIHwgJ3RyYW5zY3JpcHQnIHwgJ2FuYWx5c2lzJyA9ICdhbmFseXNpcyc7XG5cbiAgY29uc3RydWN0b3IodGFyZ2V0UGhhc2U6ICdtZXRhZGF0YScgfCAndHJhbnNjcmlwdCcgfCAnYW5hbHlzaXMnID0gJ2FuYWx5c2lzJykge1xuICAgIHRoaXMudGFyZ2V0UGhhc2UgPSB0YXJnZXRQaGFzZTtcbiAgICAvLyBEZXRlcm1pbmUgZGF0YSBkaXJlY3RvcnkgKGhhbmRsZSBib3RoIHBhY2thZ2UgYW5kIHJvb3Qgc2NlbmFyaW9zKVxuICAgIGNvbnN0IHBhY2thZ2VEYXRhRGlyID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL2RhdGEnKTtcbiAgICBjb25zdCByb290RGF0YURpciA9IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9kYXRhJyk7XG5cbiAgICAvLyBQcmVmZXIgcm9vdCBkYXRhIGRpciBpZiBpdCBleGlzdHMgKHByZXZpb3VzIGJlaGF2aW9yKSwgb3RoZXJ3aXNlIHBhY2thZ2UgZGF0YVxuICAgIGNvbnN0IGRhdGFEaXIgPSBmcy5leGlzdHNTeW5jKHJvb3REYXRhRGlyKSA/IHJvb3REYXRhRGlyIDogcGFja2FnZURhdGFEaXI7XG5cbiAgICB0aGlzLnN0YXRlRmlsZVBhdGggPSBwYXRoLmpvaW4oZGF0YURpciwgJ3RyYW5zY3JpcHQtdjItc3RhdGUuanNvbicpO1xuICAgIHRoaXMucmVwb3J0c0RpciA9IHBhdGguam9pbihkYXRhRGlyLCAndmlkZW8tcmVwb3J0cycpO1xuICAgIHRoaXMudHJhbnNjcmlwdHNEaXIgPSBwYXRoLmpvaW4oZGF0YURpciwgJ3ZpZGVvLXRyYW5zY3JpcHRzJyk7XG4gICAgdGhpcy5rbm93bGVkZ2VCYXNlRmlsZSA9IHBhdGguam9pbihkYXRhRGlyLCAnQUlfS25vd2xlZGdlX0Jhc2UubWQnKTtcblxuICAgIGNvbnNvbGUubG9nKGBbdjJdIFVzaW5nIGRhdGEgZGlyZWN0b3J5OiAke2RhdGFEaXJ9YCk7XG5cbiAgICAvLyBFbnN1cmUgZGlyZWN0b3JpZXMgZXhpc3RcbiAgICBmcy5ta2RpclN5bmModGhpcy5yZXBvcnRzRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBmcy5ta2RpclN5bmModGhpcy50cmFuc2NyaXB0c0RpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgZnMubWtkaXJTeW5jKHBhdGguam9pbihkYXRhRGlyLCAndGVtcF9zdWJzJyksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuXG4gICAgdGhpcy5zdGF0ZSA9IHRoaXMubG9hZFN0YXRlKCk7XG4gIH1cblxuICBwcml2YXRlIGxvYWRTdGF0ZSgpOiBQcm9jZXNzaW5nU3RhdGUge1xuICAgIHRyeSB7XG4gICAgICBpZiAoZnMuZXhpc3RzU3luYyh0aGlzLnN0YXRlRmlsZVBhdGgpKSB7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmModGhpcy5zdGF0ZUZpbGVQYXRoLCAndXRmLTgnKSk7XG4gICAgICAgIC8vIE1pZ3JhdGUgb2xkIHN0YXRlIGlmIG5lZWRlZFxuICAgICAgICBpZiAoc3RhdGUudmVyc2lvbiAhPT0gJzIuMCcpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnW3YyXSBNaWdyYXRpbmcgc3RhdGUgdG8gdjIgZm9ybWF0Li4uJyk7XG4gICAgICAgICAgc3RhdGUudmVyc2lvbiA9ICcyLjAnO1xuICAgICAgICAgIHN0YXRlLnF1ZXVlID0gc3RhdGUucXVldWUubWFwKCh2OiBhbnkpID0+ICh7XG4gICAgICAgICAgICAuLi52LFxuICAgICAgICAgICAgcHJvY2Vzc2luZ0F0dGVtcHRzOiB2LnByb2Nlc3NpbmdBdHRlbXB0cyB8fCAwLFxuICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5sb2coJ1t2Ml0gQ3JlYXRpbmcgbmV3IHN0YXRlIGZpbGUnKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHZlcnNpb246ICcyLjAnLFxuICAgICAgcXVldWU6IFtdLFxuICAgICAgY3VycmVudEluZGV4OiAwLFxuICAgICAgc3RhcnRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICBsYXN0VXBkYXRlZDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgc3RhdHM6IHtcbiAgICAgICAgdG90YWxWaWRlb3M6IDAsXG4gICAgICAgIG1ldGFkYXRhQ29tcGxldGU6IDAsXG4gICAgICAgIHRyYW5zY3JpcHRzRXh0cmFjdGVkOiAwLFxuICAgICAgICBhbmFseXplZDogMCxcbiAgICAgICAgbmVlZHNWaXN1YWxSZXZpZXc6IDAsXG4gICAgICAgIGNvbXBsZXRlZDogMCxcbiAgICAgICAgc2tpcHBlZDogMCxcbiAgICAgICAgZXJyb3JzOiAwLFxuICAgICAgICBhbmFseXNpc1N1Y2Nlc3NSYXRlOiAwLFxuICAgICAgICBhdmVyYWdlVHJhbnNjcmlwdExlbmd0aDogMCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgc2F2ZVN0YXRlKCk6IHZvaWQge1xuICAgIHRoaXMuc3RhdGUubGFzdFVwZGF0ZWQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgdGhpcy51cGRhdGVTdGF0cygpO1xuICAgIGZzLm1rZGlyU3luYyhwYXRoLmRpcm5hbWUodGhpcy5zdGF0ZUZpbGVQYXRoKSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgZnMud3JpdGVGaWxlU3luYyh0aGlzLnN0YXRlRmlsZVBhdGgsIEpTT04uc3RyaW5naWZ5KHRoaXMuc3RhdGUsIG51bGwsIDIpKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlU3RhdHMoKTogdm9pZCB7XG4gICAgY29uc3QgcyA9IHRoaXMuc3RhdGUuc3RhdHM7XG4gICAgY29uc3QgYW5hbHl6ZWQgPSB0aGlzLnN0YXRlLnF1ZXVlLmZpbHRlcigodikgPT4gdi5hbmFseXNpcykubGVuZ3RoO1xuICAgIGNvbnN0IGF0dGVtcHRlZCA9IHRoaXMuc3RhdGUucXVldWUuZmlsdGVyKCh2KSA9PiB2LnByb2Nlc3NpbmdBdHRlbXB0cyA+IDApLmxlbmd0aDtcbiAgICBzLmFuYWx5c2lzU3VjY2Vzc1JhdGUgPSBhdHRlbXB0ZWQgPiAwID8gKGFuYWx5emVkIC8gYXR0ZW1wdGVkKSAqIDEwMCA6IDA7XG5cbiAgICBjb25zdCB0cmFuc2NyaXB0cyA9IHRoaXMuc3RhdGUucXVldWUuZmlsdGVyKCh2KSA9PiB2LnRyYW5zY3JpcHQpO1xuICAgIHMuYXZlcmFnZVRyYW5zY3JpcHRMZW5ndGggPVxuICAgICAgdHJhbnNjcmlwdHMubGVuZ3RoID4gMFxuICAgICAgICA/IHRyYW5zY3JpcHRzLnJlZHVjZSgoc3VtLCB2KSA9PiBzdW0gKyAodi50cmFuc2NyaXB0Py5sZW5ndGggfHwgMCksIDApIC8gdHJhbnNjcmlwdHMubGVuZ3RoXG4gICAgICAgIDogMDtcbiAgfVxuXG4gIHByaXZhdGUgZXh0cmFjdFZpZGVvSWQodXJsOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBjb25zdCBwYXR0ZXJucyA9IFtcbiAgICAgIC8oPzp5b3V0dWJlXFwuY29tXFwvd2F0Y2hcXD92PXx5b3V0dVxcLmJlXFwvfHlvdXR1YmVcXC5jb21cXC9lbWJlZFxcLykoW14mXFxzP10rKS8sXG4gICAgICAveW91dHViZVxcLmNvbVxcL3ZcXC8oW14mXFxzP10rKS8sXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgcGF0dGVybnMpIHtcbiAgICAgIGNvbnN0IG1hdGNoID0gdXJsLm1hdGNoKHBhdHRlcm4pO1xuICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiBtYXRjaFsxXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBmb3JtYXREdXJhdGlvbihzZWNvbmRzOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIGNvbnN0IGhvdXJzID0gTWF0aC5mbG9vcihzZWNvbmRzIC8gMzYwMCk7XG4gICAgY29uc3QgbWludXRlcyA9IE1hdGguZmxvb3IoKHNlY29uZHMgJSAzNjAwKSAvIDYwKTtcbiAgICBjb25zdCBzZWNzID0gTWF0aC5mbG9vcihzZWNvbmRzICUgNjApO1xuXG4gICAgaWYgKGhvdXJzID4gMCkge1xuICAgICAgcmV0dXJuIGAke2hvdXJzfToke21pbnV0ZXMudG9TdHJpbmcoKS5wYWRTdGFydCgyLCAnMCcpfToke3NlY3MudG9TdHJpbmcoKS5wYWRTdGFydCgyLCAnMCcpfWA7XG4gICAgfVxuICAgIHJldHVybiBgJHttaW51dGVzfToke3NlY3MudG9TdHJpbmcoKS5wYWRTdGFydCgyLCAnMCcpfWA7XG4gIH1cblxuICBkZWNvZGVIdG1sRW50aXRpZXModGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGV4dFxuICAgICAgLnJlcGxhY2UoLyZhbXA7L2csICcmJylcbiAgICAgIC5yZXBsYWNlKC8mbHQ7L2csICc8JylcbiAgICAgIC5yZXBsYWNlKC8mZ3Q7L2csICc+JylcbiAgICAgIC5yZXBsYWNlKC8mcXVvdDsvZywgJ1wiJylcbiAgICAgIC5yZXBsYWNlKC8mIzM5Oy9nLCBcIidcIilcbiAgICAgIC5yZXBsYWNlKC8mI3gyNzsvZywgXCInXCIpXG4gICAgICAucmVwbGFjZSgvJiN4MkY7L2csICcvJyk7XG4gIH1cblxuICBhc3luYyBpbml0aWFsaXplKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIFVzZSB0aGUgU0FNRSBwcm9maWxlIGFzIHRoZSBvcmlnaW5hbCBwcm9jZXNzb3Igd2hlcmUgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpblxuICAgIGNvbnN0IHByb2ZpbGVEaXIgPSBwYXRoLmpvaW4ocHJvY2Vzcy5lbnYuSE9NRSB8fCAnL3RtcCcsICcudmlkZW8tcHJvY2Vzc29yLWNocm9tZScpO1xuXG4gICAgY29uc29sZS5sb2coJ1t2Ml0g8J+agCBMYXVuY2hpbmcgQ2hyb21lICh1c2luZyBleGlzdGluZyBsb2dpbiBzZXNzaW9uKS4uLicpO1xuICAgIGZzLm1rZGlyU3luYyhwcm9maWxlRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcblxuICAgIHRoaXMuY29udGV4dCA9IGF3YWl0IGNocm9taXVtLmxhdW5jaFBlcnNpc3RlbnRDb250ZXh0KHByb2ZpbGVEaXIsIHtcbiAgICAgIGhlYWRsZXNzOiBmYWxzZSxcbiAgICAgIGNoYW5uZWw6ICdjaHJvbWUnLFxuICAgICAgYXJnczogW1xuICAgICAgICAnLS1uby1maXJzdC1ydW4nLFxuICAgICAgICAnLS1uby1kZWZhdWx0LWJyb3dzZXItY2hlY2snLFxuICAgICAgICAnLS1kaXNhYmxlLWJsaW5rLWZlYXR1cmVzPUF1dG9tYXRpb25Db250cm9sbGVkJyxcbiAgICAgICAgJy0tZGlzYWJsZS1pbmZvYmFycycsXG4gICAgICAgICctLWV4Y2x1ZGUtc3dpdGNoZXM9ZW5hYmxlLWF1dG9tYXRpb24nLFxuICAgICAgICAnLS11c2UtZmFrZS11aS1mb3ItbWVkaWEtc3RyZWFtJyxcbiAgICAgICAgJy0tdXNlLWZha2UtZGV2aWNlLWZvci1tZWRpYS1zdHJlYW0nLFxuICAgICAgICAnLS1kaXNhYmxlLWJhY2tncm91bmQtbmV0d29ya2luZycsXG4gICAgICAgICctLWVuYWJsZS1mZWF0dXJlcz1OZXR3b3JrU2VydmljZSxOZXR3b3JrU2VydmljZUluUHJvY2VzcycsXG4gICAgICAgICctLWRpc2FibGUtYmFja2dyb3VuZC10aW1lci10aHJvdHRsaW5nJyxcbiAgICAgICAgJy0tZGlzYWJsZS1iYWNrZ3JvdW5kaW5nLW9jY2x1ZGVkLXdpbmRvd3MnLFxuICAgICAgICAnLS1kaXNhYmxlLWJyZWFrcGFkJyxcbiAgICAgICAgJy0tZGlzYWJsZS1jbGllbnQtc2lkZS1waGlzaGluZy1kZXRlY3Rpb24nLFxuICAgICAgICAnLS1kaXNhYmxlLWNvbXBvbmVudC1leHRlbnNpb25zLXdpdGgtYmFja2dyb3VuZC1wYWdlcycsXG4gICAgICAgICctLWRpc2FibGUtZGVmYXVsdC1hcHBzJyxcbiAgICAgICAgJy0tZGlzYWJsZS1kZXYtc2htLXVzYWdlJyxcbiAgICAgICAgJy0tZGlzYWJsZS1leHRlbnNpb25zJyxcbiAgICAgICAgJy0tZGlzYWJsZS1mZWF0dXJlcz1UcmFuc2xhdGUnLFxuICAgICAgICAnLS1kaXNhYmxlLWhhbmctbW9uaXRvcicsXG4gICAgICAgICctLWRpc2FibGUtaXBjLWZsb29kaW5nLXByb3RlY3Rpb24nLFxuICAgICAgICAnLS1kaXNhYmxlLXBvcHVwLWJsb2NraW5nJyxcbiAgICAgICAgJy0tZGlzYWJsZS1wcm9tcHQtb24tcmVwb3N0JyxcbiAgICAgICAgJy0tZGlzYWJsZS1yZW5kZXJlci1iYWNrZ3JvdW5kaW5nJyxcbiAgICAgICAgJy0tZGlzYWJsZS1zeW5jJyxcbiAgICAgICAgJy0tZm9yY2UtY29sb3ItcHJvZmlsZT1zcmdiJyxcbiAgICAgICAgJy0tbWV0cmljcy1yZWNvcmRpbmctb25seScsXG4gICAgICAgICctLW5vLXNlcnZpY2UtYXV0b3J1bicsXG4gICAgICAgICctLWV4cG9ydC10YWdnZWQtcGRmJyxcbiAgICAgICAgJy0tZ2VuZXJhdGUtcGRmLWRvY3VtZW50LW91dGxpbmUnLFxuICAgICAgICAnLS13aW5kb3ctcG9zaXRpb249MCwwJyxcbiAgICAgICAgJy0taWdub3JlLWNlcnRpZmljYXRlLWVycm9ycycsXG4gICAgICAgICctLWFsbG93LXJ1bm5pbmctaW5zZWN1cmUtY29udGVudCcsXG4gICAgICAgICctLWRpc2FibGUtd2ViLXNlY3VyaXR5JyxcbiAgICAgIF0sXG4gICAgICB2aWV3cG9ydDogeyB3aWR0aDogMTQwMCwgaGVpZ2h0OiA5MDAgfSxcbiAgICAgIGlnbm9yZURlZmF1bHRBcmdzOiBbJy0tZW5hYmxlLWF1dG9tYXRpb24nXSxcbiAgICAgIHVzZXJBZ2VudDpcbiAgICAgICAgJ01vemlsbGEvNS4wIChNYWNpbnRvc2g7IEludGVsIE1hYyBPUyBYIDEwXzE1XzcpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjAuMC4wLjAgU2FmYXJpLzUzNy4zNicsXG4gICAgfSk7XG5cbiAgICBjb25zb2xlLmxvZygnW3YyXSDinIUgQnJvd3NlciByZWFkeScpO1xuICB9XG5cbiAgLy8gSGVscGVyIGZvciBodW1hbi1saWtlIGRlbGF5c1xuICBwcml2YXRlIGFzeW5jIGh1bWFuRGVsYXkobWluOiBudW1iZXIsIG1heDogbnVtYmVyLCBwYWdlOiBQYWdlKSB7XG4gICAgY29uc3QgZGVsYXkgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKSArIG1pbik7XG4gICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dChkZWxheSk7XG4gIH1cblxuICAvLyBIZWxwZXIgZm9yIGh1bWFuLWxpa2UgbW91c2UgbW92ZW1lbnRcbiAgcHJpdmF0ZSBhc3luYyBodW1hbk1vdmUocGFnZTogUGFnZSwgc2VsZWN0b3I6IHN0cmluZykge1xuICAgIGNvbnN0IGVsZW1lbnQgPSBhd2FpdCBwYWdlLiQoc2VsZWN0b3IpO1xuICAgIGlmICghZWxlbWVudCkgcmV0dXJuO1xuXG4gICAgY29uc3QgYm94ID0gYXdhaXQgZWxlbWVudC5ib3VuZGluZ0JveCgpO1xuICAgIGlmICghYm94KSByZXR1cm47XG5cbiAgICAvLyBTdGFydCBmcm9tIHJhbmRvbSBwb3NpdGlvblxuICAgIGF3YWl0IHBhZ2UubW91c2UubW92ZShNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA1MDApLCBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA1MDApKTtcblxuICAgIC8vIE1vdmUgdG8gdGFyZ2V0IHdpdGggXCJvdmVyc2hvb3RcIiBlZmZlY3Qgc2ltdWxhdGlvbiAoc2ltcGxlIHN0ZXBzKVxuICAgIGNvbnN0IHRhcmdldFggPSBib3gueCArIGJveC53aWR0aCAvIDI7XG4gICAgY29uc3QgdGFyZ2V0WSA9IGJveC55ICsgYm94LmhlaWdodCAvIDI7XG4gICAgYXdhaXQgcGFnZS5tb3VzZS5tb3ZlKHRhcmdldFgsIHRhcmdldFksIHsgc3RlcHM6IDI1IH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzb2x2ZUdvb2dsZUNhcHRjaGEocGFnZTogUGFnZSkge1xuICAgIGNvbnNvbGUubG9nKCdbdjJdIOKaoO+4jyBEZXRlY3RlZCBHb29nbGUgUm9ib3QgQ2hlY2suIEF0dGVtcHRpbmcgdG8gc29sdmUuLi4nKTtcblxuICAgIC8vIDEuIExvb2sgZm9yIHRoZSBpZnJhbWVcbiAgICBjb25zdCBmcmFtZXMgPSBwYWdlLmZyYW1lcygpO1xuICAgIGNvbnN0IHJlY2FwdGNoYUZyYW1lID0gZnJhbWVzLmZpbmQoKGYpID0+IGYudXJsKCkuaW5jbHVkZXMoJ2dvb2dsZS5jb20vcmVjYXB0Y2hhJykpO1xuXG4gICAgaWYgKHJlY2FwdGNoYUZyYW1lKSB7XG4gICAgICBjb25zb2xlLmxvZygnW3YyXSBGb3VuZCByZUNBUFRDSEEgZnJhbWUuIENsaWNraW5nIGNoZWNrYm94Li4uJyk7XG5cbiAgICAgIGNvbnN0IGNoZWNrYm94ID0gYXdhaXQgcmVjYXB0Y2hhRnJhbWUuJCgnLnJlY2FwdGNoYS1jaGVja2JveC1ib3JkZXIsICNyZWNhcHRjaGEtYW5jaG9yJyk7XG4gICAgICBpZiAoY2hlY2tib3gpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5odW1hbkRlbGF5KDEwMDAsIDMwMDAsIHBhZ2UpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gVXNlIFBsYXl3cmlnaHQncyBuYXRpdmUgaGFuZGxpbmcgd2hpY2ggY29ycmVjdGx5IG1hcHMgaWZyYW1lIGNvb3JkaW5hdGVzXG4gICAgICAgICAgYXdhaXQgY2hlY2tib3guaG92ZXIoKTtcbiAgICAgICAgICBhd2FpdCB0aGlzLmh1bWFuRGVsYXkoMjAwLCA1MDAsIHBhZ2UpO1xuICAgICAgICAgIGF3YWl0IGNoZWNrYm94LmNsaWNrKHsgZGVsYXk6IE1hdGgucmFuZG9tKCkgKiAxMDAgKyA1MCB9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIENsaWNrIGZhaWxlZCwgdHJ5aW5nIGZvcmNlIGNsaWNrJywgZSk7XG4gICAgICAgICAgYXdhaXQgY2hlY2tib3guZGlzcGF0Y2hFdmVudCgnY2xpY2snKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIENsaWNrZWQgY2hlY2tib3guIFdhaXRpbmcgZm9yIG91dGNvbWUuLi4nKTtcbiAgICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCg1MDAwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIENvdWxkIG5vdCBmaW5kIGNoZWNrYm94IGluc2lkZSBmcmFtZS4nKTtcbiAgICAgICAgLy8gVGFrZSBhIHNjcmVlbnNob3QgZm9yIHZhbGlkIGRlYnVnZ2luZ1xuICAgICAgICBhd2FpdCBwYWdlLnNjcmVlbnNob3QoeyBwYXRoOiBwYXRoLmpvaW4odGhpcy5yZXBvcnRzRGlyLCAnY2FwdGNoYV9mYWlsLnBuZycpIH0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBGYWxsYmFjazogbG9va2luZyBmb3Igbm9ybWFsIGJ1dHRvbnMgaWYgaXQncyBub3QgYW4gaWZyYW1lIGNhcHRjaGFcbiAgICAgIGNvbnN0IGJ1dHRvbiA9IGF3YWl0IHBhZ2UuJCgnI0wyQUdMYiwgW2FyaWEtbGFiZWw9XCJJIGFncmVlXCJdLCBidXR0b246aGFzLXRleHQoXCJJIGFncmVlXCIpJyk7XG4gICAgICBpZiAoYnV0dG9uKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIEZvdW5kIHNpbXBsZSBjb25zZW50IGJ1dHRvbi4gQ2xpY2tpbmcuLi4nKTtcbiAgICAgICAgYXdhaXQgdGhpcy5odW1hbk1vdmUocGFnZSwgJyNMMkFHTGInKTsgLy8gbW92ZSB0byBjb25zZW50XG4gICAgICAgIGF3YWl0IGJ1dHRvbi5jbGljaygpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIHdlIGFyZSBzdGlsbCBzdHVja1xuICAgIGlmIChwYWdlLnVybCgpLmluY2x1ZGVzKCdnb29nbGUuY29tL3NvcnJ5LycpKSB7XG4gICAgICBjb25zb2xlLmxvZygnW3YyXSBTdGlsbCBvbiBzb3JyeSBwYWdlLiBXYWl0aW5nIGZvciB1c2VyIGludGVydmVudGlvbiBvciBJUCByb3RhdGlvbi4uLicpO1xuICAgICAgLy8gSW4gYSByZWFsIGhlYWRsZXNzIHNjZW5hcmlvLCB3ZSdkIG5lZWQgYSBjYXB0Y2hhIHNlcnZpY2UgaGVyZS5cbiAgICAgIC8vIEZvciBub3csIHdlIHdhaXQgYSBiaXQgdG8gc2VlIGlmIGl0IGNsZWFycyBvciBpZiB3ZSBjYW4gcHJvY2VlZC5cbiAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoNTAwMCk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZmV0Y2hFbnJpY2hlZE1ldGFkYXRhKHZpZGVvOiBWaWRlb0VudHJ5KTogUHJvbWlzZTxWaWRlb01ldGFkYXRhIHwgbnVsbD4ge1xuICAgIGlmICghdGhpcy5jb250ZXh0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Jyb3dzZXIgbm90IGluaXRpYWxpemVkJyk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coYFt2Ml0g8J+TiiBFbnJpY2hlZCBtZXRhZGF0YSBmZXRjaDogJHt2aWRlby50aXRsZX1gKTtcblxuICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCB0aGlzLmNvbnRleHQubmV3UGFnZSgpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHF1ZXJ5ID0gYFlvdVR1YmUgdmlkZW8gXCIke3ZpZGVvLnVybH1cIiBjb21wbGV0ZSBpbmZvcm1hdGlvbjogZHVyYXRpb24sIGNoYW5uZWwsIGRlc2NyaXB0aW9uLCB2aWV3cywgcHVibGlzaCBkYXRlLCB0b3BpY3MsIHN1bW1hcnlgO1xuICAgICAgY29uc3Qgc2VhcmNoVXJsID0gYGh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vc2VhcmNoP3E9JHtlbmNvZGVVUklDb21wb25lbnQocXVlcnkpfSZ1ZG09NTBgO1xuXG4gICAgICBhd2FpdCBwYWdlLmdvdG8oc2VhcmNoVXJsLCB7IHdhaXRVbnRpbDogJ2RvbWNvbnRlbnRsb2FkZWQnLCB0aW1lb3V0OiAzMDAwMCB9KTtcblxuICAgICAgLy8gQ2hlY2sgZm9yIEdvb2dsZSBSb2JvdCBDaGVja1xuICAgICAgaWYgKFxuICAgICAgICBwYWdlLnVybCgpLmluY2x1ZGVzKCdnb29nbGUuY29tL3NvcnJ5LycpIHx8XG4gICAgICAgIChhd2FpdCBwYWdlLiQoJ3RleHQ9XCJ1bnVzdWFsIHRyYWZmaWNcIicpKSB8fFxuICAgICAgICAoYXdhaXQgcGFnZS4kKCdpZnJhbWVbc3JjKj1cInJlY2FwdGNoYVwiXScpKVxuICAgICAgKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuc29sdmVHb29nbGVDYXB0Y2hhKHBhZ2UpO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDUwMDApOyAvLyBMZXQgQUkgbW9kZSBnZW5lcmF0ZSByZXNwb25zZVxuXG4gICAgICBjb25zdCBwYWdlVGV4dCA9IGF3YWl0IHBhZ2UuZXZhbHVhdGUoKCkgPT4gZG9jdW1lbnQuYm9keS5pbm5lclRleHQpO1xuXG4gICAgICBsZXQgZHVyYXRpb24gPSAwO1xuICAgICAgY29uc3QgZHVyYXRpb25QYXR0ZXJucyA9IFtcbiAgICAgICAgLyhcXGQrKVxccypob3Vycz9cXHMqLD9cXHMqKFxcZCspP1xccyptaW51dGVzP1xccyosP1xccyooXFxkKyk/XFxzKnNlY29uZHM/L2ksXG4gICAgICAgIC8oXFxkKylcXHMqbWludXRlcz9cXHMqLD9cXHMqKFxcZCspP1xccypzZWNvbmRzPy9pLFxuICAgICAgICAvKFxcZCspOihcXGQrKTooXFxkKykvLFxuICAgICAgICAvKFxcZCspOihcXGQrKS8sXG4gICAgICAgIC9kdXJhdGlvbls6XFxzXSooXFxkKyk6KFxcZCspL2ksXG4gICAgICBdO1xuXG4gICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgZHVyYXRpb25QYXR0ZXJucykge1xuICAgICAgICBjb25zdCBtYXRjaCA9IHBhZ2VUZXh0Lm1hdGNoKHBhdHRlcm4pO1xuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICBpZiAobWF0Y2hbMF0udG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnaG91cicpKSB7XG4gICAgICAgICAgICBkdXJhdGlvbiA9XG4gICAgICAgICAgICAgIHBhcnNlSW50KG1hdGNoWzFdKSAqIDM2MDAgK1xuICAgICAgICAgICAgICBwYXJzZUludChtYXRjaFsyXSB8fCAnMCcpICogNjAgK1xuICAgICAgICAgICAgICBwYXJzZUludChtYXRjaFszXSB8fCAnMCcpO1xuICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2hbMF0udG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnbWludXRlJykpIHtcbiAgICAgICAgICAgIGR1cmF0aW9uID0gcGFyc2VJbnQobWF0Y2hbMV0pICogNjAgKyBwYXJzZUludChtYXRjaFsyXSB8fCAnMCcpO1xuICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2gubGVuZ3RoID09PSA0KSB7XG4gICAgICAgICAgICBkdXJhdGlvbiA9IHBhcnNlSW50KG1hdGNoWzFdKSAqIDM2MDAgKyBwYXJzZUludChtYXRjaFsyXSkgKiA2MCArIHBhcnNlSW50KG1hdGNoWzNdKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAgICAgZHVyYXRpb24gPSBwYXJzZUludChtYXRjaFsxXSkgKiA2MCArIHBhcnNlSW50KG1hdGNoWzJdKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgY2hhbm5lbFBhdHRlcm5zID0gW1xuICAgICAgICAvKD86Ynl8Y2hhbm5lbHxmcm9tKVxccyooW0EtWmEtejAtOVxcc1xcLV9dKz8pKD86XFxzKlvCt+KAolxcLXxdfFxccypcXGR8dmlld3N8c3Vic2NyaWJlcnN8JCkvaSxcbiAgICAgICAgL3VwbG9hZGVkIGJ5XFxzKihbQS1aYS16MC05XFxzXFwtX10rKS9pLFxuICAgICAgXTtcbiAgICAgIGxldCBjaGFubmVsOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgY2hhbm5lbFBhdHRlcm5zKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gcGFnZVRleHQubWF0Y2gocGF0dGVybik7XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgIGNoYW5uZWwgPSBtYXRjaFsxXS50cmltKCkuc3Vic3RyaW5nKDAsIDUwKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCB2aWV3TWF0Y2ggPSBwYWdlVGV4dC5tYXRjaCgvKFxcZCsoPzosXFxkKykqKD86XFwuXFxkKyk/W0tNQl0/KVxccyp2aWV3cz8vaSk7XG5cbiAgICAgIGNvbnN0IGRhdGVQYXR0ZXJucyA9IFtcbiAgICAgICAgLyg/OnB1Ymxpc2hlZHx1cGxvYWRlZHxwb3N0ZWQpXFxzKig/Om9uXFxzKik/KFtBLVphLXpdK1xccytcXGQrLD9cXHMqXFxkezR9KS9pLFxuICAgICAgICAvKFxcZCtcXHMqKD86ZGF5cz98d2Vla3M/fG1vbnRocz98eWVhcnM/KVxccyphZ28pL2ksXG4gICAgICBdO1xuICAgICAgbGV0IHB1Ymxpc2hEYXRlOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgZGF0ZVBhdHRlcm5zKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gcGFnZVRleHQubWF0Y2gocGF0dGVybik7XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgIHB1Ymxpc2hEYXRlID0gbWF0Y2hbMV07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgZGVzY01hdGNoID0gcGFnZVRleHQubWF0Y2goLyg/OmRlc2NyaXB0aW9ufGFib3V0KVs6XFxzXSooW14uXStcXC5bXi5dK1xcLikvaSk7XG4gICAgICBjb25zdCBzdW1tYXJ5TWF0Y2ggPSBwYWdlVGV4dC5tYXRjaCgvKD86c3VtbWFyeXxvdmVydmlld3x0aGlzIHZpZGVvKVs6XFxzXSooW14uXStcXC5bXi5dK1xcLikvaSk7XG5cbiAgICAgIGNvbnN0IG1ldGFkYXRhOiBWaWRlb01ldGFkYXRhID0ge1xuICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgZHVyYXRpb25Gb3JtYXR0ZWQ6IHRoaXMuZm9ybWF0RHVyYXRpb24oZHVyYXRpb24pLFxuICAgICAgICBjaGFubmVsLFxuICAgICAgICB2aWV3Q291bnQ6IHZpZXdNYXRjaCA/IHZpZXdNYXRjaFsxXSA6IHVuZGVmaW5lZCxcbiAgICAgICAgcHVibGlzaERhdGUsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjTWF0Y2ggPyBkZXNjTWF0Y2hbMV0uc3Vic3RyaW5nKDAsIDUwMCkgOiB1bmRlZmluZWQsXG4gICAgICAgIHN1bW1hcnk6IHN1bW1hcnlNYXRjaCA/IHN1bW1hcnlNYXRjaFsxXS5zdWJzdHJpbmcoMCwgMzAwKSA6IHVuZGVmaW5lZCxcbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcbiAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBgW3YyXSDinIUgTWV0YWRhdGE6ICR7bWV0YWRhdGEuZHVyYXRpb25Gb3JtYXR0ZWR9IHwgJHttZXRhZGF0YS5jaGFubmVsIHx8ICdVbmtub3duIGNoYW5uZWwnfWBcbiAgICAgICk7XG4gICAgICByZXR1cm4gbWV0YWRhdGE7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihgW3YyXSBFcnJvciBpbiBtZXRhZGF0YSBmZXRjaDpgLCBlKTtcbiAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGV4dHJhY3RUcmFuc2NyaXB0RGlyZWN0KHZpZGVvOiBWaWRlb0VudHJ5KTogUHJvbWlzZTxUcmFuc2NyaXB0U2VnbWVudFtdIHwgbnVsbD4ge1xuICAgIGlmICghdGhpcy5jb250ZXh0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Jyb3dzZXIgbm90IGluaXRpYWxpemVkJyk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coYFt2Ml0g8J+TnSBUcmFuc2NyaXB0IGV4dHJhY3Rpb246ICR7dmlkZW8udmlkZW9JZH1gKTtcblxuICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCB0aGlzLmNvbnRleHQubmV3UGFnZSgpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHBhZ2UuZ290byh2aWRlby51cmwsIHsgd2FpdFVudGlsOiAnbG9hZCcsIHRpbWVvdXQ6IDQ1MDAwIH0pO1xuICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgzMDAwKTtcblxuICAgICAgY29uc3QgY2FwdGlvbkRhdGEgPSBhd2FpdCBwYWdlLmV2YWx1YXRlKCgpID0+IHtcbiAgICAgICAgY29uc3Qgd2luID0gd2luZG93IGFzIGFueTtcbiAgICAgICAgaWYgKHdpbi55dEluaXRpYWxQbGF5ZXJSZXNwb25zZT8uY2FwdGlvbnM/LnBsYXllckNhcHRpb25zVHJhY2tsaXN0UmVuZGVyZXI/LmNhcHRpb25UcmFja3MpIHtcbiAgICAgICAgICBjb25zdCB0cmFja3MgPVxuICAgICAgICAgICAgd2luLnl0SW5pdGlhbFBsYXllclJlc3BvbnNlLmNhcHRpb25zLnBsYXllckNhcHRpb25zVHJhY2tsaXN0UmVuZGVyZXIuY2FwdGlvblRyYWNrcztcbiAgICAgICAgICBjb25zdCB0cmFjayA9IHRyYWNrcy5maW5kKCh0OiBhbnkpID0+IHQubGFuZ3VhZ2VDb2RlID09PSAnZW4nKSB8fCB0cmFja3NbMF07XG4gICAgICAgICAgcmV0dXJuIHRyYWNrPy5iYXNlVXJsIHx8IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzY3JpcHRzID0gQXJyYXkuZnJvbShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdzY3JpcHQnKSk7XG4gICAgICAgIGZvciAoY29uc3Qgc2NyaXB0IG9mIHNjcmlwdHMpIHtcbiAgICAgICAgICBjb25zdCB0ZXh0ID0gc2NyaXB0LnRleHRDb250ZW50IHx8ICcnO1xuICAgICAgICAgIGlmICh0ZXh0LmluY2x1ZGVzKCdjYXB0aW9uVHJhY2tzJykpIHtcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gdGV4dC5tYXRjaCgvXCJjYXB0aW9uVHJhY2tzXCI6XFxzKlxcWyguKj8pXFxdLyk7XG4gICAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCB0cmFja3NTdHIgPSAnWycgKyBtYXRjaFsxXSArICddJztcbiAgICAgICAgICAgICAgICBjb25zdCB0cmFja3MgPSBKU09OLnBhcnNlKHRyYWNrc1N0cik7XG4gICAgICAgICAgICAgICAgaWYgKHRyYWNrcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCB0cmFjayA9IHRyYWNrcy5maW5kKCh0OiBhbnkpID0+IHQubGFuZ3VhZ2VDb2RlID09PSAnZW4nKSB8fCB0cmFja3NbMF07XG4gICAgICAgICAgICAgICAgICByZXR1cm4gdHJhY2s/LmJhc2VVcmwgfHwgbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSk7XG5cbiAgICAgIGlmIChjYXB0aW9uRGF0YSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgW3YyXSBGb3VuZCBjYXB0aW9uIFVSTCwgZmV0Y2hpbmcgdHJhbnNjcmlwdC4uLmApO1xuXG4gICAgICAgIGNvbnN0IGNhcHRpb25QYWdlID0gYXdhaXQgdGhpcy5jb250ZXh0IS5uZXdQYWdlKCk7XG4gICAgICAgIGF3YWl0IGNhcHRpb25QYWdlLmdvdG8oY2FwdGlvbkRhdGEsIHsgd2FpdFVudGlsOiAnbG9hZCcsIHRpbWVvdXQ6IDMwMDAwIH0pO1xuICAgICAgICBjb25zdCB4bWwgPSBhd2FpdCBjYXB0aW9uUGFnZS5jb250ZW50KCk7XG4gICAgICAgIGF3YWl0IGNhcHRpb25QYWdlLmNsb3NlKCk7XG5cbiAgICAgICAgY29uc3Qgc2VnbWVudHM6IFRyYW5zY3JpcHRTZWdtZW50W10gPSBbXTtcbiAgICAgICAgY29uc3QgdGV4dFJlZ2V4ID0gLzx0ZXh0IHN0YXJ0PVwiKFtcXGQuXSspXCIgZHVyPVwiKFtcXGQuXSspXCJbXj5dKj4oW148XSopPFxcL3RleHQ+L2c7XG4gICAgICAgIGxldCBtYXRjaDtcblxuICAgICAgICB3aGlsZSAoKG1hdGNoID0gdGV4dFJlZ2V4LmV4ZWMoeG1sKSkgIT09IG51bGwpIHtcbiAgICAgICAgICBzZWdtZW50cy5wdXNoKHtcbiAgICAgICAgICAgIHN0YXJ0OiBwYXJzZUZsb2F0KG1hdGNoWzFdKSxcbiAgICAgICAgICAgIGR1cmF0aW9uOiBwYXJzZUZsb2F0KG1hdGNoWzJdKSxcbiAgICAgICAgICAgIHRleHQ6IHRoaXMuZGVjb2RlSHRtbEVudGl0aWVzKG1hdGNoWzNdKSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZWdtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIOKchSBFeHRyYWN0ZWQgJHtzZWdtZW50cy5sZW5ndGh9IHRyYW5zY3JpcHQgc2VnbWVudHNgKTtcbiAgICAgICAgICByZXR1cm4gc2VnbWVudHM7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coJ1t2Ml0gVHJ5aW5nIFVJIHRyYW5zY3JpcHQgcGFuZWwuLi4nKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZXhwYW5kQnRuID0gcGFnZS5sb2NhdG9yKCcjZXhwYW5kLCB0cC15dC1wYXBlci1idXR0b24jZXhwYW5kJyk7XG4gICAgICAgIGlmICgoYXdhaXQgZXhwYW5kQnRuLmNvdW50KCkpID4gMCkge1xuICAgICAgICAgIGF3YWl0IGV4cGFuZEJ0bi5maXJzdCgpLmNsaWNrKCk7XG4gICAgICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgxMDAwKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkge31cblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdHJhbnNjcmlwdEJ0biA9IHBhZ2UubG9jYXRvcihcbiAgICAgICAgICAnW2FyaWEtbGFiZWwqPVwidHJhbnNjcmlwdFwiXSwgYnV0dG9uOmhhcy10ZXh0KFwidHJhbnNjcmlwdFwiKSdcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKChhd2FpdCB0cmFuc2NyaXB0QnRuLmNvdW50KCkpID4gMCkge1xuICAgICAgICAgIGF3YWl0IHRyYW5zY3JpcHRCdG4uZmlyc3QoKS5jbGljaygpO1xuICAgICAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMjAwMCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHt9XG5cbiAgICAgIGNvbnN0IHVpU2VnbWVudHMgPSBhd2FpdCBwYWdlLmV2YWx1YXRlKCgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0OiBBcnJheTx7IHN0YXJ0OiBudW1iZXI7IGR1cmF0aW9uOiBudW1iZXI7IHRleHQ6IHN0cmluZyB9PiA9IFtdO1xuICAgICAgICBjb25zdCBzZWdtZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3l0ZC10cmFuc2NyaXB0LXNlZ21lbnQtcmVuZGVyZXInKTtcbiAgICAgICAgc2VnbWVudHMuZm9yRWFjaCgoc2VnOiBFbGVtZW50KSA9PiB7XG4gICAgICAgICAgY29uc3QgdGltZUVsID0gc2VnLnF1ZXJ5U2VsZWN0b3IoJy5zZWdtZW50LXRpbWVzdGFtcCcpO1xuICAgICAgICAgIGNvbnN0IHRleHRFbCA9IHNlZy5xdWVyeVNlbGVjdG9yKCcuc2VnbWVudC10ZXh0Jyk7XG4gICAgICAgICAgaWYgKHRpbWVFbCAmJiB0ZXh0RWwpIHtcbiAgICAgICAgICAgIGNvbnN0IHRpbWUgPSB0aW1lRWwudGV4dENvbnRlbnQ/LnRyaW0oKSB8fCAnMDowMCc7XG4gICAgICAgICAgICBjb25zdCB0ZXh0ID0gdGV4dEVsLnRleHRDb250ZW50Py50cmltKCkgfHwgJyc7XG4gICAgICAgICAgICBjb25zdCBwYXJ0cyA9IHRpbWUuc3BsaXQoJzonKS5tYXAoKHA6IHN0cmluZykgPT4gcGFyc2VJbnQocCkgfHwgMCk7XG4gICAgICAgICAgICBjb25zdCBzZWNvbmRzID1cbiAgICAgICAgICAgICAgcGFydHMubGVuZ3RoID09PSAzXG4gICAgICAgICAgICAgICAgPyBwYXJ0c1swXSAqIDM2MDAgKyBwYXJ0c1sxXSAqIDYwICsgcGFydHNbMl1cbiAgICAgICAgICAgICAgICA6IHBhcnRzWzBdICogNjAgKyAocGFydHNbMV0gfHwgMCk7XG4gICAgICAgICAgICBpZiAodGV4dCkge1xuICAgICAgICAgICAgICByZXN1bHQucHVzaCh7IHN0YXJ0OiBzZWNvbmRzLCBkdXJhdGlvbjogMCwgdGV4dCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSk7XG5cbiAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcblxuICAgICAgaWYgKHVpU2VnbWVudHMgJiYgdWlTZWdtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdWlTZWdtZW50cy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgICB1aVNlZ21lbnRzW2ldLmR1cmF0aW9uID0gdWlTZWdtZW50c1tpICsgMV0uc3RhcnQgLSB1aVNlZ21lbnRzW2ldLnN0YXJ0O1xuICAgICAgICB9XG4gICAgICAgIGlmICh1aVNlZ21lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB1aVNlZ21lbnRzW3VpU2VnbWVudHMubGVuZ3RoIC0gMV0uZHVyYXRpb24gPSA1O1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIOKchSBFeHRyYWN0ZWQgJHt1aVNlZ21lbnRzLmxlbmd0aH0gc2VnbWVudHMgKFVJKWApO1xuICAgICAgICByZXR1cm4gdWlTZWdtZW50cztcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coJ1t2Ml0g4pqg77iPIE5vIHRyYW5zY3JpcHQgYXZhaWxhYmxlIHZpYSBVSS4gVHJ5aW5nIHl0LWRscC4uLicpO1xuICAgICAgY29uc3QgZmIgPSB0aGlzLmRvd25sb2FkVHJhbnNjcmlwdFdpdGhZdERscCh2aWRlby51cmwsIHZpZGVvLnZpZGVvSWQpO1xuICAgICAgaWYgKGZiKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIOKchSB5dC1kbHAgc3VjY2VzczogJHtmYi5sZW5ndGh9IHNlZ21lbnRzYCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICByZXR1cm4gZmI7XG4gICAgICB9XG5cbiAgICAgIGNvbnNvbGUubG9nKCdbdjJdIOKaoO+4jyBObyB0cmFuc2NyaXB0IGF2YWlsYWJsZScpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcignW3YyXSBUcmFuc2NyaXB0IGVycm9yOicsIGUpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgfSBjYXRjaCAoeCkge31cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8vIC0tLSBGSVhFRCBQQVJTSU5HIE1FVEhPRCAtLS1cbiAgYXN5bmMgYW5hbHl6ZVdpdGhBSSh2aWRlbzogVmlkZW9FbnRyeSk6IFByb21pc2U8QW5hbHlzaXNSZXN1bHQgfCBudWxsPiB7XG4gICAgaWYgKCF0aGlzLmNvbnRleHQgfHwgIXZpZGVvLnRyYW5zY3JpcHQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKGBbdjJdIPCfpJYgQUkgQW5hbHlzaXM6ICR7dmlkZW8udGl0bGV9YCk7XG5cbiAgICAvLyBGUkVTSCBwYWdlIGZvciBBSSBTdHVkaW9cbiAgICBjb25zdCBwYWdlID0gYXdhaXQgdGhpcy5jb250ZXh0Lm5ld1BhZ2UoKTtcblxuICAgIHRyeSB7XG4gICAgICAvLyBDb21iaW5lIHRyYW5zY3JpcHRcbiAgICAgIGNvbnN0IGZ1bGxUcmFuc2NyaXB0ID0gdmlkZW8udHJhbnNjcmlwdC5tYXAoKHMpID0+IHMudGV4dCkuam9pbignICcpO1xuICAgICAgY29uc3QgdHJ1bmNhdGVkVHJhbnNjcmlwdCA9IGZ1bGxUcmFuc2NyaXB0LnN1YnN0cmluZygwLCAyNTAwMCk7IC8vIFN0YXkgd2l0aGluIGxpbWl0c1xuXG4gICAgICAvLyBOYXZpZ2F0ZSB0byBBSSBTdHVkaW8gd2l0aCBsYXRlc3QgbW9kZWxcbiAgICAgIGF3YWl0IHBhZ2UuZ290byhBSV9TVFVESU9fVVJMLCB7IHdhaXRVbnRpbDogJ2RvbWNvbnRlbnRsb2FkZWQnLCB0aW1lb3V0OiA2MDAwMCB9KTtcbiAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoNTAwMCk7XG5cbiAgICAgIC8vIERpc21pc3MgYW55IGRpYWxvZ3NcbiAgICAgIGZvciAoY29uc3Qgc2VsZWN0b3Igb2YgW1xuICAgICAgICAnYnV0dG9uOmhhcy10ZXh0KFwiR290IGl0XCIpJyxcbiAgICAgICAgJ2J1dHRvbjpoYXMtdGV4dChcIkNvbnRpbnVlXCIpJyxcbiAgICAgICAgJ1thcmlhLWxhYmVsPVwiQ2xvc2VcIl0nLFxuICAgICAgXSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGVsID0gcGFnZS5sb2NhdG9yKHNlbGVjdG9yKTtcbiAgICAgICAgICBpZiAoKGF3YWl0IGVsLmNvdW50KCkpID4gMCAmJiAoYXdhaXQgZWwuZmlyc3QoKS5pc1Zpc2libGUoKSkpIHtcbiAgICAgICAgICAgIGF3YWl0IGVsLmZpcnN0KCkuY2xpY2soeyBmb3JjZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoNTAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAvKiBpZ25vcmUgKi9cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYXdhaXQgcGFnZS5rZXlib2FyZC5wcmVzcygnRXNjYXBlJyk7XG4gICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDUwMCk7XG5cbiAgICAgIC8vIEVudGVyIHByb21wdFxuICAgICAgY29uc3QgdGV4dGFyZWEgPSBwYWdlLmxvY2F0b3IoJ3RleHRhcmVhW2FyaWEtbGFiZWw9XCJFbnRlciBhIHByb21wdFwiXScpO1xuICAgICAgYXdhaXQgdGV4dGFyZWEud2FpdEZvcih7IHN0YXRlOiAndmlzaWJsZScsIHRpbWVvdXQ6IDE1MDAwIH0pO1xuICAgICAgYXdhaXQgdGV4dGFyZWEuY2xpY2soeyBmb3JjZTogdHJ1ZSB9KTtcblxuICAgICAgY29uc3QgZnVsbFByb21wdCA9IEFOQUxZU0lTX1BST01QVCArIHRydW5jYXRlZFRyYW5zY3JpcHQ7XG4gICAgICBhd2FpdCB0ZXh0YXJlYS5maWxsKGZ1bGxQcm9tcHQpO1xuICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgxMDAwKTtcblxuICAgICAgLy8gQ2xpY2sgUnVuXG4gICAgICBjb25zdCBydW5CdG4gPSBwYWdlLmxvY2F0b3IoJ2J1dHRvblthcmlhLWxhYmVsPVwiUnVuXCJdJyk7XG4gICAgICBhd2FpdCBydW5CdG4uY2xpY2soKTtcblxuICAgICAgY29uc29sZS5sb2coJ1t2Ml0gV2FpdGluZyBmb3IgQUkgcmVzcG9uc2UuLi4nKTtcblxuICAgICAgLy8gV2FpdCBmb3IgcmVzcG9uc2Ugd2l0aCBiZXR0ZXIgZXh0cmFjdGlvblxuICAgICAgY29uc3Qgc3RhcnRXYWl0ID0gRGF0ZS5ub3coKTtcbiAgICAgIGNvbnN0IHRpbWVvdXQgPSAyICogNjAgKiAxMDAwOyAvLyAyIG1pbnV0ZXNcblxuICAgICAgd2hpbGUgKERhdGUubm93KCkgLSBzdGFydFdhaXQgPCB0aW1lb3V0KSB7XG4gICAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMzAwMCk7XG5cbiAgICAgICAgLy8gQ2hlY2sgZm9yIGNvbXBsZXRpb24gYnkgbG9va2luZyBmb3IgdGhlIHJlc3BvbnNlIGNvbnRhaW5lclxuICAgICAgICBjb25zdCByZXNwb25zZUNvbnRhaW5lciA9IHBhZ2UubG9jYXRvcihcbiAgICAgICAgICAnbXMtY2hhdC10dXJuLm1vZGVsIC50dXJuLWNvbnRlbnQsIC5jaGF0LXR1cm4tY29udGFpbmVyLm1vZGVsIC50dXJuLWNvbnRlbnQnXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKChhd2FpdCByZXNwb25zZUNvbnRhaW5lci5jb3VudCgpKSA+IDApIHtcbiAgICAgICAgICAvLyBHZXQgdGhlIGlubmVyIHRleHQgZGlyZWN0bHksIG5vdCBpbmNsdWRpbmcgVUkgZWxlbWVudHNcbiAgICAgICAgICBjb25zdCByYXdUZXh0ID0gYXdhaXQgcGFnZS5ldmFsdWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAvLyBGaW5kIHRoZSBhY3R1YWwgcmVzcG9uc2UgdGV4dCwgZXhjbHVkaW5nIHRvb2xiYXIgYnV0dG9uc1xuICAgICAgICAgICAgY29uc3QgY29udGFpbmVycyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXG4gICAgICAgICAgICAgICdtcy1jaGF0LXR1cm4ubW9kZWwgLnR1cm4tY29udGVudCwgLmNoYXQtdHVybi1jb250YWluZXIubW9kZWwgLnR1cm4tY29udGVudCdcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZiAoY29udGFpbmVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGxhc3RDb250YWluZXIgPSBjb250YWluZXJzW2NvbnRhaW5lcnMubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgICAgIC8vIEdldCB0ZXh0IGZyb20gbWFya2Rvd24gY29udGVudCBpZiBhdmFpbGFibGVcbiAgICAgICAgICAgIGNvbnN0IG1hcmtkb3duID0gbGFzdENvbnRhaW5lci5xdWVyeVNlbGVjdG9yKFxuICAgICAgICAgICAgICAnLm1hcmtkb3duLWJvZHksIC5tYXJrZG93bi1jb250ZW50LCAucmVuZGVyZWQtbWFya2Rvd24nXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbGV0IGNvbnRlbnQgPSBtYXJrZG93biA/IG1hcmtkb3duLnRleHRDb250ZW50IHx8ICcnIDogbGFzdENvbnRhaW5lci50ZXh0Q29udGVudCB8fCAnJztcblxuICAgICAgICAgICAgLy8gQ0xFQU5JTkc6IFJlbW92ZSBcIk1vZGVsIFRoaW5raW5nXCIgYmxvY2tzIHdoaWNoIGNsdXR0ZXIgdGhlIG91dHB1dFxuICAgICAgICAgICAgLy8gR2VtaW5pIEZsYXNoIHNvbWV0aW1lcyBvdXRwdXRzIFwiTW9kZWwgVGhpbmtpbmcuLi5cIiBmb2xsb3dlZCBieSB0aG91Z2h0c1xuICAgICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShcbiAgICAgICAgICAgICAgL01vZGVsIFRoaW5raW5nW1xcc1xcU10qPyg/OkV4cGFuZCB0byB2aWV3IG1vZGVsIHRob3VnaHRzfGNoZXZyb25fcmlnaHQpL2csXG4gICAgICAgICAgICAgICcnXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgvTW9kZWwgVGhpbmtpbmdbXFxzXFxTXSo/anNvbi9pLCAnJyk7XG5cbiAgICAgICAgICAgIC8vIFJlbW92ZSBjb21tb24gVUkgdGV4dCBwYXR0ZXJuc1xuICAgICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShcbiAgICAgICAgICAgICAgL21vcmVfdmVydHxjb250ZW50X2NvcHl8ZG93bmxvYWR8ZXhwYW5kX2xlc3N8ZXhwYW5kX21vcmV8TW9kZWwgY29kZSBKU09OL2csXG4gICAgICAgICAgICAgICcnXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gY29udGVudC50cmltKCk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBpZiAocmF3VGV4dCAmJiByYXdUZXh0Lmxlbmd0aCA+IDUwKSB7XG4gICAgICAgICAgICAvLyBUcnkgdG8gZXh0cmFjdCBKU09OIGZyb20gdGhlIHJlc3BvbnNlXG4gICAgICAgICAgICBjb25zdCBqc29uUGF0dGVybnMgPSBbXG4gICAgICAgICAgICAgIC9gYGBqc29uXFxzKihcXHtbXFxzXFxTXSo/XFx9KVxccypgYGAvLCAvLyBTdGFuZGFyZCBtYXJrZG93biBqc29uIGJsb2NrXG4gICAgICAgICAgICAgIC9gYGBcXHMqKFxce1tcXHNcXFNdKj9cXH0pXFxzKmBgYC8sIC8vIEdlbmVyaWMgbWFya2Rvd24gYmxvY2tcbiAgICAgICAgICAgICAgL14oXFx7W1xcc1xcU10qXFx9KSQvLCAvLyBKdXN0IEpTT05cbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIGxldCBhbmFseXNpczogQW5hbHlzaXNSZXN1bHQgfCBudWxsID0gbnVsbDtcblxuICAgICAgICAgICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIGpzb25QYXR0ZXJucykge1xuICAgICAgICAgICAgICBjb25zdCBtYXRjaCA9IHJhd1RleHQubWF0Y2gocGF0dGVybik7XG4gICAgICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBqc29uU3RyID0gbWF0Y2hbMV07XG4gICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGpzb25TdHIpO1xuICAgICAgICAgICAgICAgICAgYW5hbHlzaXMgPSB7XG4gICAgICAgICAgICAgICAgICAgIGtleVBvaW50czogcGFyc2VkLmtleVBvaW50cyB8fCBbXSxcbiAgICAgICAgICAgICAgICAgICAgYWlDb25jZXB0czogcGFyc2VkLmFpQ29uY2VwdHMgfHwgW10sXG4gICAgICAgICAgICAgICAgICAgIHRlY2huaWNhbERldGFpbHM6IHBhcnNlZC50ZWNobmljYWxEZXRhaWxzIHx8IFtdLFxuICAgICAgICAgICAgICAgICAgICB2aXN1YWxDb250ZXh0RmxhZ3M6IHBhcnNlZC52aXN1YWxDb250ZXh0RmxhZ3MgfHwgW10sXG4gICAgICAgICAgICAgICAgICAgIHN1bW1hcnk6IHBhcnNlZC5zdW1tYXJ5IHx8ICcnLFxuICAgICAgICAgICAgICAgICAgICBxdWFsaXR5U2NvcmU6IHRoaXMuY2FsY3VsYXRlUXVhbGl0eVNjb3JlKHBhcnNlZCksXG4gICAgICAgICAgICAgICAgICAgIHJhd1Jlc3BvbnNlOiByYXdUZXh0LnN1YnN0cmluZygwLCAxMDAwKSxcbiAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAvKiB0cnkgbmV4dCBwYXR0ZXJuICovXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEpTT04gUGFyc2UgRmFsbGJhY2s6IFRyeSB0byBmaW5kIHN1YnN0cmluZyBiZXR3ZWVuIGZpcnN0IHsgYW5kIGxhc3QgfVxuICAgICAgICAgICAgaWYgKCFhbmFseXNpcyAmJiByYXdUZXh0LmluY2x1ZGVzKCd7JykgJiYgcmF3VGV4dC5pbmNsdWRlcygnfScpKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSByYXdUZXh0LmluZGV4T2YoJ3snKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbmQgPSByYXdUZXh0Lmxhc3RJbmRleE9mKCd9JykgKyAxO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBvdGVudGlhbEpzb24gPSByYXdUZXh0LnN1YnN0cmluZyhzdGFydCwgZW5kKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKHBvdGVudGlhbEpzb24pO1xuICAgICAgICAgICAgICAgIGFuYWx5c2lzID0ge1xuICAgICAgICAgICAgICAgICAga2V5UG9pbnRzOiBwYXJzZWQua2V5UG9pbnRzIHx8IFtdLFxuICAgICAgICAgICAgICAgICAgYWlDb25jZXB0czogcGFyc2VkLmFpQ29uY2VwdHMgfHwgW10sXG4gICAgICAgICAgICAgICAgICB0ZWNobmljYWxEZXRhaWxzOiBwYXJzZWQudGVjaG5pY2FsRGV0YWlscyB8fCBbXSxcbiAgICAgICAgICAgICAgICAgIHZpc3VhbENvbnRleHRGbGFnczogcGFyc2VkLnZpc3VhbENvbnRleHRGbGFncyB8fCBbXSxcbiAgICAgICAgICAgICAgICAgIHN1bW1hcnk6IHBhcnNlZC5zdW1tYXJ5IHx8ICcnLFxuICAgICAgICAgICAgICAgICAgcXVhbGl0eVNjb3JlOiB0aGlzLmNhbGN1bGF0ZVF1YWxpdHlTY29yZShwYXJzZWQpLFxuICAgICAgICAgICAgICAgICAgcmF3UmVzcG9uc2U6IHJhd1RleHQuc3Vic3RyaW5nKDAsIDEwMDApLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAvKiBpZ25vcmUgKi9cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUZXh0IEZhbGxiYWNrOiBDcmVhdGUgc3RydWN0dXJlZCBhbmFseXNpcyBmcm9tIHRleHQgaWYgSlNPTiBmYWlsc1xuICAgICAgICAgICAgaWYgKCFhbmFseXNpcykge1xuICAgICAgICAgICAgICBhbmFseXNpcyA9IHtcbiAgICAgICAgICAgICAgICBrZXlQb2ludHM6IHRoaXMuZXh0cmFjdEJ1bGxldFBvaW50cyhyYXdUZXh0KSxcbiAgICAgICAgICAgICAgICBhaUNvbmNlcHRzOiB0aGlzLmV4dHJhY3RBSUNvbmNlcHRzKHJhd1RleHQpLFxuICAgICAgICAgICAgICAgIHRlY2huaWNhbERldGFpbHM6IFtdLFxuICAgICAgICAgICAgICAgIHZpc3VhbENvbnRleHRGbGFnczogW10sXG4gICAgICAgICAgICAgICAgc3VtbWFyeTogcmF3VGV4dC5zdWJzdHJpbmcoMCwgMzAwKS5yZXBsYWNlKC9cXG4vZywgJyAnKSxcbiAgICAgICAgICAgICAgICBxdWFsaXR5U2NvcmU6IDUwLCAvLyBNZWRpdW0gcXVhbGl0eSBmb3IgZmFsbGJhY2tcbiAgICAgICAgICAgICAgICByYXdSZXNwb25zZTogcmF3VGV4dC5zdWJzdHJpbmcoMCwgMTAwMCksXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIOKchSBBbmFseXNpcyBjb21wbGV0ZSAocXVhbGl0eTogJHthbmFseXNpcy5xdWFsaXR5U2NvcmV9JSlgKTtcbiAgICAgICAgICAgIHJldHVybiBhbmFseXNpcztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBmb3IgZXJyb3JzXG4gICAgICAgIGNvbnN0IGVycm9yVGV4dCA9IGF3YWl0IHBhZ2UuZXZhbHVhdGUoKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5ib2R5LmlubmVyVGV4dDtcbiAgICAgICAgICBpZiAoYm9keS5pbmNsdWRlcygnSW50ZXJuYWwgZXJyb3InKSB8fCBib2R5LmluY2x1ZGVzKCdTb21ldGhpbmcgd2VudCB3cm9uZycpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2Vycm9yJztcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChlcnJvclRleHQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FJIFN0dWRpbyByZXR1cm5lZCBhbiBlcnJvcicpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcbiAgICAgIGNvbnNvbGUubG9nKCdbdjJdIOKaoO+4jyBBbmFseXNpcyB0aW1lb3V0Jyk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbdjJdIEFuYWx5c2lzIGVycm9yOicsIGUpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgfSBjYXRjaCAoeCkge31cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlUXVhbGl0eVNjb3JlKHBhcnNlZDogYW55KTogbnVtYmVyIHtcbiAgICBsZXQgc2NvcmUgPSAwO1xuICAgIGlmIChwYXJzZWQuc3VtbWFyeSAmJiBwYXJzZWQuc3VtbWFyeS5sZW5ndGggPiA1MCkge1xuICAgICAgc2NvcmUgKz0gMjU7XG4gICAgfVxuICAgIGlmIChwYXJzZWQua2V5UG9pbnRzICYmIHBhcnNlZC5rZXlQb2ludHMubGVuZ3RoID49IDMpIHtcbiAgICAgIHNjb3JlICs9IDI1O1xuICAgIH1cbiAgICBpZiAocGFyc2VkLmFpQ29uY2VwdHMgJiYgcGFyc2VkLmFpQ29uY2VwdHMubGVuZ3RoID4gMCkge1xuICAgICAgc2NvcmUgKz0gMjU7XG4gICAgfVxuICAgIGlmIChwYXJzZWQudGVjaG5pY2FsRGV0YWlscyAmJiBwYXJzZWQudGVjaG5pY2FsRGV0YWlscy5sZW5ndGggPiAwKSB7XG4gICAgICBzY29yZSArPSAyNTtcbiAgICB9XG4gICAgcmV0dXJuIHNjb3JlO1xuICB9XG5cbiAgcHJpdmF0ZSBleHRyYWN0QnVsbGV0UG9pbnRzKHRleHQ6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBsaW5lcyA9IHRleHQuc3BsaXQoJ1xcbicpO1xuICAgIHJldHVybiBsaW5lc1xuICAgICAgLmZpbHRlcihcbiAgICAgICAgKGxpbmUpID0+XG4gICAgICAgICAgbGluZS50cmltKCkuc3RhcnRzV2l0aCgnLScpIHx8IGxpbmUudHJpbSgpLnN0YXJ0c1dpdGgoJ+KAoicpIHx8IGxpbmUudHJpbSgpLm1hdGNoKC9eXFxkK1xcLi8pXG4gICAgICApXG4gICAgICAubWFwKChsaW5lKSA9PiBsaW5lLnJlcGxhY2UoL15bLeKAolxcZC5dK1xccyovLCAnJykudHJpbSgpKVxuICAgICAgLmZpbHRlcigobGluZSkgPT4gbGluZS5sZW5ndGggPiAxMClcbiAgICAgIC5zbGljZSgwLCAxMCk7XG4gIH1cblxuICBwcml2YXRlIGV4dHJhY3RBSUNvbmNlcHRzKHRleHQ6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBhaVRlcm1zID0gW1xuICAgICAgJ21hY2hpbmUgbGVhcm5pbmcnLFxuICAgICAgJ25ldXJhbCBuZXR3b3JrJyxcbiAgICAgICdkZWVwIGxlYXJuaW5nJyxcbiAgICAgICd0cmFuc2Zvcm1lcicsXG4gICAgICAnR1BUJyxcbiAgICAgICdMTE0nLFxuICAgICAgJ2xhcmdlIGxhbmd1YWdlIG1vZGVsJyxcbiAgICAgICdBSSBhZ2VudCcsXG4gICAgICAnZW1iZWRkaW5nJyxcbiAgICAgICdmaW5lLXR1bmluZycsXG4gICAgICAnUkFHJyxcbiAgICAgICd2ZWN0b3IgZGF0YWJhc2UnLFxuICAgICAgJ3Byb21wdCBlbmdpbmVlcmluZycsXG4gICAgICAnZGlmZnVzaW9uJyxcbiAgICAgICdzdGFibGUgZGlmZnVzaW9uJyxcbiAgICAgICdEQUxMLUUnLFxuICAgICAgJ0NsYXVkZScsXG4gICAgICAnR2VtaW5pJyxcbiAgICAgICdPcGVuQUknLFxuICAgICAgJ0FudGhyb3BpYycsXG4gICAgICAnTGFuZ0NoYWluJyxcbiAgICAgICdBdXRvR1BUJyxcbiAgICAgICdpbmZlcmVuY2UnLFxuICAgICAgJ3RyYWluaW5nJyxcbiAgICAgICdtb2RlbCcsXG4gICAgXTtcblxuICAgIGNvbnN0IGZvdW5kOiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IGxvd2VyVGV4dCA9IHRleHQudG9Mb3dlckNhc2UoKTtcblxuICAgIGZvciAoY29uc3QgdGVybSBvZiBhaVRlcm1zKSB7XG4gICAgICBpZiAobG93ZXJUZXh0LmluY2x1ZGVzKHRlcm0udG9Mb3dlckNhc2UoKSkgJiYgIWZvdW5kLmluY2x1ZGVzKHRlcm0pKSB7XG4gICAgICAgIGZvdW5kLnB1c2godGVybSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZvdW5kO1xuICB9XG5cbiAgc2F2ZVJlcG9ydCh2aWRlbzogVmlkZW9FbnRyeSk6IHN0cmluZyB7XG4gICAgY29uc3Qgc2FmZVRpdGxlID0gdmlkZW8udGl0bGUucmVwbGFjZSgvW15hLXpBLVowLTldL2csICdfJykuc3Vic3RyaW5nKDAsIDUwKTtcbiAgICBjb25zdCByZXBvcnRGaWxlID0gcGF0aC5qb2luKFxuICAgICAgdGhpcy5yZXBvcnRzRGlyLFxuICAgICAgYHYyXyR7dmlkZW8uaW5kZXh9XyR7c2FmZVRpdGxlfV8ke0RhdGUubm93KCl9Lm1kYFxuICAgICk7XG5cbiAgICBsZXQgY29udGVudCA9IGAjIFZpZGVvIEFuYWx5c2lzIFJlcG9ydFxcblxcbiMjIE1ldGFkYXRhXFxuLSAqKlZpZGVvKio6ICR7dmlkZW8udGl0bGV9XFxuLSAqKkluZGV4Kio6ICMke3ZpZGVvLmluZGV4fVxcbi0gKipVUkwqKjogJHt2aWRlby51cmx9XFxuLSAqKkR1cmF0aW9uKio6ICR7dmlkZW8ubWV0YWRhdGE/LmR1cmF0aW9uRm9ybWF0dGVkIHx8ICdVbmtub3duJ31cXG4tICoqQ2hhbm5lbCoqOiAke3ZpZGVvLm1ldGFkYXRhPy5jaGFubmVsIHx8ICdVbmtub3duJ31cXG4tICoqVmlld3MqKjogJHt2aWRlby5tZXRhZGF0YT8udmlld0NvdW50IHx8ICdVbmtub3duJ31cXG4tICoqUHVibGlzaGVkKio6ICR7dmlkZW8ubWV0YWRhdGE/LnB1Ymxpc2hEYXRlIHx8ICdVbmtub3duJ31cXG4tICoqUHJvY2Vzc2VkKio6ICR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpfVxcbi0gKipRdWFsaXR5IFNjb3JlKio6ICR7dmlkZW8uYW5hbHlzaXM/LnF1YWxpdHlTY29yZSB8fCAwfSVcXG5cXG4tLS1cXG5cXG4jIyBTdW1tYXJ5XFxuJHt2aWRlby5hbmFseXNpcz8uc3VtbWFyeSB8fCB2aWRlby5tZXRhZGF0YT8uc3VtbWFyeSB8fCAnTm8gc3VtbWFyeSBhdmFpbGFibGUnfVxcblxcbiMjIEtleSBQb2ludHNcXG4keyh2aWRlby5hbmFseXNpcz8ua2V5UG9pbnRzIHx8IFtdKS5tYXAoKHApID0+IGAtICR7cH1gKS5qb2luKCdcXG4nKSB8fCAnLSBObyBrZXkgcG9pbnRzIGV4dHJhY3RlZCd9XFxuXFxuIyMgQUkgJiBUZWNobmljYWwgQ29uY2VwdHNcXG4keyh2aWRlby5hbmFseXNpcz8uYWlDb25jZXB0cyB8fCBbXSkubWFwKChjKSA9PiBgLSAke2N9YCkuam9pbignXFxuJykgfHwgJy0gTm9uZSBpZGVudGlmaWVkJ31cXG5cXG4jIyBUZWNobmljYWwgRGV0YWlsc1xcbiR7KHZpZGVvLmFuYWx5c2lzPy50ZWNobmljYWxEZXRhaWxzIHx8IFtdKS5tYXAoKGQpID0+IGAtICR7ZH1gKS5qb2luKCdcXG4nKSB8fCAnLSBOb25lIGlkZW50aWZpZWQnfVxcbmA7XG5cbiAgICBpZiAodmlkZW8uYW5hbHlzaXM/LnZpc3VhbENvbnRleHRGbGFncyAmJiB2aWRlby5hbmFseXNpcy52aXN1YWxDb250ZXh0RmxhZ3MubGVuZ3RoID4gMCkge1xuICAgICAgY29udGVudCArPSBgXFxuIyMg4pqg77iPIFNlY3Rpb25zIE5lZWRpbmcgVmlzdWFsIFJldmlld1xcbiR7dmlkZW8uYW5hbHlzaXMudmlzdWFsQ29udGV4dEZsYWdzXG4gICAgICAgIC5tYXAoKGYpID0+IGAtICoqJHt0aGlzLmZvcm1hdER1cmF0aW9uKGYudGltZXN0YW1wKX0qKjogJHtmLnJlYXNvbn0gLSAke2YuY29udGV4dH1gKVxuICAgICAgICAuam9pbignXFxuJyl9XFxuYDtcbiAgICB9XG5cbiAgICBmcy53cml0ZUZpbGVTeW5jKHJlcG9ydEZpbGUsIGNvbnRlbnQpO1xuXG4gICAgaWYgKHZpZGVvLnRyYW5zY3JpcHQgJiYgdmlkZW8udHJhbnNjcmlwdC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB0cmFuc2NyaXB0RmlsZSA9IHBhdGguam9pbih0aGlzLnRyYW5zY3JpcHRzRGlyLCBgJHt2aWRlby5pbmRleH1fJHtzYWZlVGl0bGV9LnR4dGApO1xuICAgICAgY29uc3QgdHJhbnNjcmlwdENvbnRlbnQgPSB2aWRlby50cmFuc2NyaXB0XG4gICAgICAgIC5tYXAoKHMpID0+IGBbJHt0aGlzLmZvcm1hdER1cmF0aW9uKHMuc3RhcnQpfV0gJHtzLnRleHR9YClcbiAgICAgICAgLmpvaW4oJ1xcbicpO1xuICAgICAgZnMud3JpdGVGaWxlU3luYyh0cmFuc2NyaXB0RmlsZSwgdHJhbnNjcmlwdENvbnRlbnQpO1xuICAgIH1cblxuICAgIHRoaXMuYXBwZW5kVG9Lbm93bGVkZ2VCYXNlKHZpZGVvKTtcblxuICAgIHJldHVybiByZXBvcnRGaWxlO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBlbmRUb0tub3dsZWRnZUJhc2UodmlkZW86IFZpZGVvRW50cnkpOiB2b2lkIHtcbiAgICBjb25zdCBlbnRyeSA9IGBcXG4tLS1cXG5cXG4jIyAjJHt2aWRlby5pbmRleH06ICR7dmlkZW8udGl0bGV9XFxuKipVUkwqKjogJHt2aWRlby51cmx9XFxuKipEdXJhdGlvbioqOiAke3ZpZGVvLm1ldGFkYXRhPy5kdXJhdGlvbkZvcm1hdHRlZCB8fCAnVW5rbm93bid9XFxuXFxuIyMjIFN1bW1hcnlcXG4ke3ZpZGVvLmFuYWx5c2lzPy5zdW1tYXJ5IHx8ICdObyBzdW1tYXJ5J31cXG5cXG4jIyMgS2V5IEluc2lnaHRzXFxuJHtcbiAgICAgICh2aWRlby5hbmFseXNpcz8ua2V5UG9pbnRzIHx8IFtdKVxuICAgICAgICAuc2xpY2UoMCwgNSlcbiAgICAgICAgLm1hcCgocCkgPT4gYC0gJHtwfWApXG4gICAgICAgIC5qb2luKCdcXG4nKSB8fCAnLSBOb25lJ1xuICAgIH1cXG5cXG4jIyMgQUkgQ29uY2VwdHMgQ292ZXJlZFxcbiR7KHZpZGVvLmFuYWx5c2lzPy5haUNvbmNlcHRzIHx8IFtdKS5qb2luKCcsICcpIHx8ICdOb25lJ31cXG5cXG5gO1xuXG4gICAgZnMuYXBwZW5kRmlsZVN5bmModGhpcy5rbm93bGVkZ2VCYXNlRmlsZSwgZW50cnkpO1xuICB9XG5cbiAgYXN5bmMgcHJvY2Vzc1ZpZGVvKHZpZGVvOiBWaWRlb0VudHJ5KTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHZpZGVvLnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcgfHwgdmlkZW8uc3RhdHVzID09PSAnc2tpcHBlZCcpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbdjJdIOKPre+4jyBTa2lwcGluZyAjJHt2aWRlby5pbmRleH0gKCR7dmlkZW8uc3RhdHVzfSlgKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmICh2aWRlby5wcm9jZXNzaW5nQXR0ZW1wdHMgPj0gMykge1xuICAgICAgY29uc29sZS5sb2coYFt2Ml0g4o+t77iPIFNraXBwaW5nICMke3ZpZGVvLmluZGV4fSAobWF4IGF0dGVtcHRzIHJlYWNoZWQpYCk7XG4gICAgICB2aWRlby5zdGF0dXMgPSAnc2tpcHBlZCc7XG4gICAgICB0aGlzLnN0YXRlLnN0YXRzLnNraXBwZWQrKztcbiAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coYFxcbiR7J+KVkCcucmVwZWF0KDcwKX1gKTtcbiAgICBjb25zb2xlLmxvZyhgVmlkZW8gIyR7dmlkZW8uaW5kZXh9OiAke3ZpZGVvLnRpdGxlfWApO1xuICAgIGNvbnNvbGUubG9nKGBBdHRlbXB0OiAke3ZpZGVvLnByb2Nlc3NpbmdBdHRlbXB0cyArIDF9LzNgKTtcbiAgICBjb25zb2xlLmxvZyhgJHsn4pWQJy5yZXBlYXQoNzApfVxcbmApO1xuXG4gICAgdmlkZW8ucHJvY2Vzc2luZ0F0dGVtcHRzKys7XG4gICAgdmlkZW8ubGFzdFByb2Nlc3NlZCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGlmICghdmlkZW8ubWV0YWRhdGEpIHtcbiAgICAgICAgdmlkZW8uc3RhdHVzID0gJ21ldGFkYXRhJztcbiAgICAgICAgdmlkZW8ubWV0YWRhdGEgPSAoYXdhaXQgdGhpcy5mZXRjaEVucmljaGVkTWV0YWRhdGEodmlkZW8pKSB8fCB1bmRlZmluZWQ7XG4gICAgICAgIGlmICh2aWRlby5tZXRhZGF0YSkge1xuICAgICAgICAgIHRoaXMuc3RhdGUuc3RhdHMubWV0YWRhdGFDb21wbGV0ZSsrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy50YXJnZXRQaGFzZSA9PT0gJ21ldGFkYXRhJykgcmV0dXJuIHRydWU7XG5cbiAgICAgIGlmICghdmlkZW8udHJhbnNjcmlwdCkge1xuICAgICAgICB2aWRlby5zdGF0dXMgPSAndHJhbnNjcmlwdCc7XG4gICAgICAgIHZpZGVvLnRyYW5zY3JpcHQgPSAoYXdhaXQgdGhpcy5leHRyYWN0VHJhbnNjcmlwdERpcmVjdCh2aWRlbykpIHx8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHZpZGVvLnRyYW5zY3JpcHQpIHtcbiAgICAgICAgICB0aGlzLnN0YXRlLnN0YXRzLnRyYW5zY3JpcHRzRXh0cmFjdGVkKys7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnRhcmdldFBoYXNlID09PSAndHJhbnNjcmlwdCcpIHJldHVybiB0cnVlO1xuXG4gICAgICBpZiAodmlkZW8udHJhbnNjcmlwdCAmJiAhdmlkZW8uYW5hbHlzaXMpIHtcbiAgICAgICAgdmlkZW8uc3RhdHVzID0gJ2FuYWx5emVkJztcbiAgICAgICAgdmlkZW8uYW5hbHlzaXMgPSAoYXdhaXQgdGhpcy5hbmFseXplV2l0aEFJKHZpZGVvKSkgfHwgdW5kZWZpbmVkO1xuICAgICAgICBpZiAodmlkZW8uYW5hbHlzaXMpIHtcbiAgICAgICAgICB0aGlzLnN0YXRlLnN0YXRzLmFuYWx5emVkKys7XG4gICAgICAgICAgaWYgKHZpZGVvLmFuYWx5c2lzLnZpc3VhbENvbnRleHRGbGFncy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLnN0YXRzLm5lZWRzVmlzdWFsUmV2aWV3Kys7XG4gICAgICAgICAgICB2aWRlby5zdGF0dXMgPSAnbmVlZHNfdmlzdWFsJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHZpZGVvLmFuYWx5c2lzKSB7XG4gICAgICAgIGNvbnN0IHJlcG9ydFBhdGggPSB0aGlzLnNhdmVSZXBvcnQodmlkZW8pO1xuICAgICAgICBjb25zb2xlLmxvZyhgW3YyXSDinIUgUmVwb3J0OiAke3BhdGguYmFzZW5hbWUocmVwb3J0UGF0aCl9YCk7XG4gICAgICAgIHZpZGVvLnN0YXR1cyA9ICdjb21wbGV0ZWQnO1xuICAgICAgICB0aGlzLnN0YXRlLnN0YXRzLmNvbXBsZXRlZCsrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmlkZW8uc3RhdHVzID0gJ2Vycm9yJztcbiAgICAgICAgdmlkZW8uZXJyb3IgPSAnQW5hbHlzaXMgZmFpbGVkJztcbiAgICAgICAgdGhpcy5zdGF0ZS5zdGF0cy5lcnJvcnMrKztcbiAgICAgIH1cblxuICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgIHRoaXMucHJpbnRQcm9ncmVzcygpO1xuICAgICAgcmV0dXJuIHZpZGVvLnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCc7XG4gICAgfSBjYXRjaCAoZTogdW5rbm93bikge1xuICAgICAgY29uc29sZS5lcnJvcihgW3YyXSBFcnJvciBwcm9jZXNzaW5nICMke3ZpZGVvLmluZGV4fTpgLCBlKTtcbiAgICAgIHZpZGVvLmVycm9yID0gKGUgYXMgRXJyb3IpLm1lc3NhZ2U7XG4gICAgICB2aWRlby5zdGF0dXMgPSAnZXJyb3InO1xuICAgICAgdGhpcy5zdGF0ZS5zdGF0cy5lcnJvcnMrKztcbiAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwcmludFByb2dyZXNzKCk6IHZvaWQge1xuICAgIGNvbnN0IHMgPSB0aGlzLnN0YXRlLnN0YXRzO1xuICAgIGNvbnNvbGUubG9nKGBcXG7wn5OKIFByb2dyZXNzOiAke3MuY29tcGxldGVkfS8ke3MudG90YWxWaWRlb3N9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIENvbXBsZXRlZDogJHtzLmNvbXBsZXRlZH0gfCBBbmFseXplZDogJHtzLmFuYWx5emVkfSB8IEVycm9yczogJHtzLmVycm9yc31gKTtcbiAgICBjb25zb2xlLmxvZyhgICAgU3VjY2VzcyBSYXRlOiAke3MuYW5hbHlzaXNTdWNjZXNzUmF0ZS50b0ZpeGVkKDEpfSVcXG5gKTtcbiAgfVxuXG4gIGFzeW5jIHJ1bihsaWJyYXJ5UGF0aDogc3RyaW5nLCBzdGFydEluZGV4OiBudW1iZXIgPSA2MzMsIGVuZEluZGV4OiBudW1iZXIgPSAxKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coYPCfmoAgVHJhbnNjcmlwdCBQcm9jZXNzb3IgdjIgLSBPcHRpbWl6ZWQgRWRpdGlvbmApO1xuICAgIGNvbnNvbGUubG9nKGBMaWJyYXJ5OiAke2xpYnJhcnlQYXRofWApO1xuICAgIGNvbnNvbGUubG9nKGBSYW5nZTogIyR7c3RhcnRJbmRleH0g4oaSICMke2VuZEluZGV4fWApO1xuICAgIGNvbnNvbGUubG9nKGBNb2RlbDogJHtHRU1JTklfTU9ERUx9YCk7XG5cbiAgICBhd2FpdCB0aGlzLmluaXRpYWxpemUoKTtcblxuICAgIC8vIExvYWQgbGlicmFyeVxuICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMobGlicmFyeVBhdGgsICd1dGYtOCcpO1xuICAgIGNvbnN0IHZpZGVvczogVmlkZW9FbnRyeVtdID0gW107XG4gICAgY29uc3Qgcm93UmVnZXggPVxuICAgICAgLzx0cj5cXHMqPHRkW14+XSo+XFxzKihcXGQrKVxccyo8XFwvdGQ+XFxzKjx0ZFtePl0qPlxccyo8YVxccytocmVmPVwiKFteXCJdKylcIltePl0qPihbXjxdKyk8XFwvYT5cXHMqPFxcL3RkPi9nO1xuICAgIGxldCBtYXRjaDtcblxuICAgIHdoaWxlICgobWF0Y2ggPSByb3dSZWdleC5leGVjKGNvbnRlbnQpKSAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgaW5kZXggPSBwYXJzZUludChtYXRjaFsxXSk7XG4gICAgICBpZiAoaW5kZXggPD0gc3RhcnRJbmRleCAmJiBpbmRleCA+PSBlbmRJbmRleCkge1xuICAgICAgICAvLyBDaGVjayBpZiBhbHJlYWR5IGluIHF1ZXVlXG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5zdGF0ZS5xdWV1ZS5maW5kKCh2KSA9PiB2LmluZGV4ID09PSBpbmRleCk7XG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgIHZpZGVvcy5wdXNoKGV4aXN0aW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2aWRlb3MucHVzaCh7XG4gICAgICAgICAgICBpbmRleCxcbiAgICAgICAgICAgIHVybDogbWF0Y2hbMl0sXG4gICAgICAgICAgICB0aXRsZTogbWF0Y2hbM10udHJpbSgpLFxuICAgICAgICAgICAgdmlkZW9JZDogdGhpcy5leHRyYWN0VmlkZW9JZChtYXRjaFsyXSkgfHwgJycsXG4gICAgICAgICAgICBzdGF0dXM6ICdwZW5kaW5nJyxcbiAgICAgICAgICAgIHByb2Nlc3NpbmdBdHRlbXB0czogMCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFNvcnQgZGVzY2VuZGluZ1xuICAgIHZpZGVvcy5zb3J0KChhLCBiKSA9PiBiLmluZGV4IC0gYS5pbmRleCk7XG5cbiAgICAvLyBVcGRhdGUgc3RhdGUgcXVldWUgcmVzcGVjdGluZyBleGlzdGluZyBlbnRyaWVzXG4gICAgdGhpcy5zdGF0ZS5xdWV1ZSA9IHZpZGVvcztcbiAgICB0aGlzLnN0YXRlLnN0YXRzLnRvdGFsVmlkZW9zID0gdmlkZW9zLmxlbmd0aDtcbiAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuXG4gICAgY29uc29sZS5sb2coYFt2Ml0gUHJvY2Vzc2luZyAke3ZpZGVvcy5sZW5ndGh9IHZpZGVvcy4uLmApO1xuXG4gICAgZm9yIChjb25zdCB2aWRlbyBvZiB2aWRlb3MpIHtcbiAgICAgIHRoaXMuc3RhdGUuY3VycmVudEluZGV4ID0gdmlkZW8uaW5kZXg7XG4gICAgICBhd2FpdCB0aGlzLnByb2Nlc3NWaWRlbyh2aWRlbyk7XG4gICAgICAvLyBTbWFsbCBjb29sZG93blxuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHIpID0+IHNldFRpbWVvdXQociwgMjAwMCkpO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCdbdjJdIPCfjokgQWxsIGRvbmUhJyk7XG4gICAgaWYgKHRoaXMuY29udGV4dCkge1xuICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmNsb3NlKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVuaXZlcnNhbCBGYWxsYmFjazogRG93bmxvYWQgdHJhbnNjcmlwdCB1c2luZyB5dC1kbHBcbiAgICovXG4gIHByaXZhdGUgZG93bmxvYWRUcmFuc2NyaXB0V2l0aFl0RGxwKHVybDogc3RyaW5nLCB2aWRlb0lkOiBzdHJpbmcpOiBUcmFuc2NyaXB0U2VnbWVudFtdIHwgbnVsbCB7XG4gICAgY29uc3QgdGVtcERpciA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUodGhpcy5yZXBvcnRzRGlyKSwgJ3RlbXBfc3VicycpO1xuXG4gICAgLy8gRW5zdXJlIHRlbXAgZGlyIGV4aXN0c1xuICAgIGlmICghZnMuZXhpc3RzU3luYyh0ZW1wRGlyKSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgZnMubWtkaXJTeW5jKHRlbXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgfSBjYXRjaCAoZSkge31cbiAgICB9XG5cbiAgICBjb25zdCBvdXRwdXRGaWxlQmFzZSA9IHBhdGguam9pbih0ZW1wRGlyLCB2aWRlb0lkKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zb2xlLmxvZyhgW3YyXSBSdW5uaW5nIHl0LWRscCBmb3IgJHt2aWRlb0lkfS4uLmApO1xuXG4gICAgICAvLyBDbGVhbiB1cCBwcmV2aW91cyBwb3RlbnRpYWwgZmlsZXNcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gZnMucmVhZGRpclN5bmModGVtcERpcikuZmlsdGVyKChmKSA9PiBmLnN0YXJ0c1dpdGgodmlkZW9JZCkpO1xuICAgICAgICBleGlzdGluZy5mb3JFYWNoKChmKSA9PiBmcy51bmxpbmtTeW5jKHBhdGguam9pbih0ZW1wRGlyLCBmKSkpO1xuICAgICAgfSBjYXRjaCAoZSkge31cblxuICAgICAgLy8gQ29tbWFuZCB0byBnZXQgVlRUXG4gICAgICBjb25zdCBjb21tYW5kID0gYHl0LWRscCAtLXdyaXRlLWF1dG8tc3ViIC0td3JpdGUtc3ViIC0tc3ViLWxhbmcgZW4gLS1za2lwLWRvd25sb2FkIC0tb3V0cHV0IFwiJHtvdXRwdXRGaWxlQmFzZX1cIiBcIiR7dXJsfVwiYDtcbiAgICAgIGV4ZWNTeW5jKGNvbW1hbmQsIHsgc3RkaW86ICdpZ25vcmUnIH0pO1xuXG4gICAgICAvLyBGaW5kIHRoZSBnZW5lcmF0ZWQgZmlsZSAoLmVuLnZ0dCBvciBzaW1pbGFyKVxuICAgICAgY29uc3QgZmlsZXMgPSBmcy5yZWFkZGlyU3luYyh0ZW1wRGlyKTtcbiAgICAgIGNvbnN0IHN1YkZpbGUgPSBmaWxlcy5maW5kKChmKSA9PiBmLnN0YXJ0c1dpdGgodmlkZW9JZCkgJiYgZi5lbmRzV2l0aCgnLnZ0dCcpKTtcblxuICAgICAgaWYgKCFzdWJGaWxlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIE5vIC52dHQgZmlsZSBjcmVhdGVkIGJ5IHl0LWRscCcpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgLy8gUGFyc2UgVlRUXG4gICAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbih0ZW1wRGlyLCBzdWJGaWxlKSwgJ3V0Zi04Jyk7XG4gICAgICBjb25zdCBzZWdtZW50czogVHJhbnNjcmlwdFNlZ21lbnRbXSA9IFtdO1xuICAgICAgY29uc3QgYmxvY2tzID0gY29udGVudC5zcGxpdCgvXFxuXFxyP1xcbi8pO1xuXG4gICAgICBmb3IgKGNvbnN0IGJsb2NrIG9mIGJsb2Nrcykge1xuICAgICAgICBjb25zdCB0aW1lTWF0Y2ggPSBibG9jay5tYXRjaChcbiAgICAgICAgICAvKFxcZHsyfSk6KFxcZHsyfSk6KFxcZHsyfSlcXC4oXFxkezN9KVxccy0tPlxccyhcXGR7Mn0pOihcXGR7Mn0pOihcXGR7Mn0pXFwuKFxcZHszfSkvXG4gICAgICAgICk7XG4gICAgICAgIGlmICh0aW1lTWF0Y2gpIHtcbiAgICAgICAgICBjb25zdCBsaW5lcyA9IGJsb2NrLnNwbGl0KCdcXG4nKTtcbiAgICAgICAgICBjb25zdCB0aW1lTGluZUluZGV4ID0gbGluZXMuZmluZEluZGV4KChsKSA9PiBsLmluY2x1ZGVzKCctLT4nKSk7XG4gICAgICAgICAgaWYgKHRpbWVMaW5lSW5kZXggIT09IC0xICYmIHRpbWVMaW5lSW5kZXggPCBsaW5lcy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICBsZXQgdGV4dCA9IGxpbmVzXG4gICAgICAgICAgICAgIC5zbGljZSh0aW1lTGluZUluZGV4ICsgMSlcbiAgICAgICAgICAgICAgLmpvaW4oJyAnKVxuICAgICAgICAgICAgICAucmVwbGFjZSgvPFtePl0qPi9nLCAnJylcbiAgICAgICAgICAgICAgLnRyaW0oKTtcbiAgICAgICAgICAgIGlmICh0ZXh0ICYmIHRleHQgIT09ICdhbGlnbjpzdGFydCBwb3NpdGlvbjowJScpIHtcbiAgICAgICAgICAgICAgdGV4dCA9IHRleHRcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvJmFtcDsvZywgJyYnKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8mcXVvdDsvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvJiMzOTsvZywgXCInXCIpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoLyZsdDsvZywgJzwnKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8mZ3Q7L2csICc+Jyk7XG5cbiAgICAgICAgICAgICAgY29uc3Qgc3RhcnRTZWMgPVxuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFsxXSkgKiAzNjAwICtcbiAgICAgICAgICAgICAgICBwYXJzZUludCh0aW1lTWF0Y2hbMl0pICogNjAgK1xuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFszXSkgK1xuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFs0XSkgLyAxMDAwO1xuXG4gICAgICAgICAgICAgIGNvbnN0IGVuZFNlYyA9XG4gICAgICAgICAgICAgICAgcGFyc2VJbnQodGltZU1hdGNoWzVdKSAqIDM2MDAgK1xuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFs2XSkgKiA2MCArXG4gICAgICAgICAgICAgICAgcGFyc2VJbnQodGltZU1hdGNoWzddKSArXG4gICAgICAgICAgICAgICAgcGFyc2VJbnQodGltZU1hdGNoWzhdKSAvIDEwMDA7XG5cbiAgICAgICAgICAgICAgc2VnbWVudHMucHVzaCh7XG4gICAgICAgICAgICAgICAgc3RhcnQ6IHN0YXJ0U2VjLFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiBlbmRTZWMgLSBzdGFydFNlYyxcbiAgICAgICAgICAgICAgICB0ZXh0OiB0ZXh0LFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQ2xlYW51cFxuICAgICAgdHJ5IHtcbiAgICAgICAgZnMudW5saW5rU3luYyhwYXRoLmpvaW4odGVtcERpciwgc3ViRmlsZSkpO1xuICAgICAgfSBjYXRjaCAoZSkge31cblxuICAgICAgaWYgKHNlZ21lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIHNlZ21lbnRzO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1t2Ml0geXQtZGxwIGV4ZWN1dGlvbiBlcnJvcjonLCBlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBtYWluKCkge1xuICBjb25zdCBhcmdzID0gcHJvY2Vzcy5hcmd2LnNsaWNlKDIpO1xuICBjb25zdCBzdGFydEFyZyA9IGFyZ3MuZmluZCgoYSkgPT4gYS5zdGFydHNXaXRoKCctLXN0YXJ0PScpKTtcbiAgY29uc3QgZW5kQXJnID0gYXJncy5maW5kKChhKSA9PiBhLnN0YXJ0c1dpdGgoJy0tZW5kPScpKTtcbiAgY29uc3QgcGhhc2VBcmcgPSBhcmdzLmZpbmQoKGEpID0+IGEuc3RhcnRzV2l0aCgnLS1waGFzZT0nKSk7XG5cbiAgY29uc3Qgc3RhcnQgPSBzdGFydEFyZyA/IHBhcnNlSW50KHN0YXJ0QXJnLnNwbGl0KCc9JylbMV0pIDogNjMzO1xuICBjb25zdCBlbmQgPSBlbmRBcmcgPyBwYXJzZUludChlbmRBcmcuc3BsaXQoJz0nKVsxXSkgOiAxO1xuICBjb25zdCBwaGFzZSA9IChwaGFzZUFyZyA/IHBoYXNlQXJnLnNwbGl0KCc9JylbMV0gOiAnYW5hbHlzaXMnKSBhc1xuICAgIHwgJ21ldGFkYXRhJ1xuICAgIHwgJ3RyYW5zY3JpcHQnXG4gICAgfCAnYW5hbHlzaXMnO1xuXG4gIGNvbnN0IGxpYnJhcnlQYXRoID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICcuLicsICcuLicsICdhaV92aWRlb19saWJyYXJ5Lmh0bWwnKTtcblxuICBjb25zdCBwcm9jZXNzb3IgPSBuZXcgVHJhbnNjcmlwdFByb2Nlc3NvclYyKHBoYXNlKTtcbiAgYXdhaXQgcHJvY2Vzc29yLnJ1bihsaWJyYXJ5UGF0aCwgc3RhcnQsIGVuZCk7XG59XG5cbm1haW4oKS5jYXRjaChjb25zb2xlLmVycm9yKTtcbiJdfQ==
