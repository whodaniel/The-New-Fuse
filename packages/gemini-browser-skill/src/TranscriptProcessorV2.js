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
    // Use the SAME clean profile as LoginHelper
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHJhbnNjcmlwdFByb2Nlc3NvclYyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiVHJhbnNjcmlwdFByb2Nlc3NvclYyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7Ozs7O0dBWUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsaURBQXlDO0FBQ3pDLHVDQUF5QjtBQUN6QiwyQ0FBNkI7QUFFN0IsMkNBQXNFO0FBZ0Z0RSw2Q0FBNkM7QUFDN0MsTUFBTSxZQUFZLEdBQUcsd0JBQXdCLENBQUM7QUFDOUMsTUFBTSxhQUFhLEdBQUcsMERBQTBELFlBQVksRUFBRSxDQUFDO0FBRS9GLE1BQU0sZUFBZSxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7O0NBZ0J2QixDQUFDO0FBRUYsTUFBTSxxQkFBcUI7SUFTekIsWUFBWSxjQUFzRCxVQUFVO1FBUnBFLFlBQU8sR0FBMEIsSUFBSSxDQUFDO1FBTXRDLGdCQUFXLEdBQTJDLFVBQVUsQ0FBQztRQUd2RSxJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztRQUMvQixvRUFBb0U7UUFDcEUsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDdkQsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFFMUQsZ0ZBQWdGO1FBQ2hGLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDO1FBRTFFLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztRQUNwRSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FB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Q29udGVudCI6WyIvKipcbiAqIFRyYW5zY3JpcHQgUHJvY2Vzc29yIHYyIC0gT3B0aW1pemVkIEVkaXRpb25cbiAqXG4gKiBJbXByb3ZlbWVudHMgb3ZlciB2MTpcbiAqIDEuIFVzZXMgbGF0ZXN0IEdlbWluaSAzIEZsYXNoIG1vZGVsIChnZW1pbmktMy1mbGFzaC1wcmV2aWV3KVxuICogMi4gRnJlc2ggYnJvd3NlciBwYWdlIGZvciBFQUNIIG9wZXJhdGlvblxuICogMy4gQmV0dGVyIEpTT04gZXh0cmFjdGlvbiBmcm9tIEFJIHJlc3BvbnNlc1xuICogNC4gTWF4aW1pemVkIEdvb2dsZSBTZWFyY2ggQUkgbW9kZSBxdWVyaWVzXG4gKiA1LiBEaXJlY3QgdHJhbnNjcmlwdCBleHRyYWN0aW9uIHZpYSBBUEkgKG5vIFlvdVR1YmUgcGFnZSB2aXNpdCB3aGVuIHBvc3NpYmxlKVxuICogNi4gQ2VudHJhbGl6ZWQga25vd2xlZGdlIGJhc2UgY29uc29saWRhdGlvblxuICogNy4gUHJvcGVyIHN0YXR1cyB0cmFja2luZyB0byBwcmV2ZW50IGxvb3BzXG4gKiA4LiBTdWNjZXNzIG1ldHJpY3MgYW5kIHF1YWxpdHkgZXZhbHVhdGlvblxuICovXG5cbmltcG9ydCB7IGV4ZWNTeW5jIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG5pbXBvcnQgeyBjaHJvbWl1bSwgdHlwZSBCcm93c2VyQ29udGV4dCwgdHlwZSBQYWdlIH0gZnJvbSAncGxheXdyaWdodCc7XG5cbmludGVyZmFjZSBWaWRlb0VudHJ5IHtcbiAgaW5kZXg6IG51bWJlcjtcbiAgdXJsOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHZpZGVvSWQ6IHN0cmluZztcbiAgbWV0YWRhdGE/OiBWaWRlb01ldGFkYXRhO1xuICB0cmFuc2NyaXB0PzogVHJhbnNjcmlwdFNlZ21lbnRbXTtcbiAgYW5hbHlzaXM/OiBBbmFseXNpc1Jlc3VsdDtcbiAgc3RhdHVzOlxuICAgIHwgJ3BlbmRpbmcnXG4gICAgfCAnbWV0YWRhdGEnXG4gICAgfCAndHJhbnNjcmlwdCdcbiAgICB8ICdhbmFseXplZCdcbiAgICB8ICduZWVkc192aXN1YWwnXG4gICAgfCAnY29tcGxldGVkJ1xuICAgIHwgJ3NraXBwZWQnXG4gICAgfCAnZXJyb3InO1xuICBwcm9jZXNzaW5nQXR0ZW1wdHM6IG51bWJlcjtcbiAgbGFzdFByb2Nlc3NlZD86IHN0cmluZztcbiAgZXJyb3I/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBWaWRlb01ldGFkYXRhIHtcbiAgZHVyYXRpb246IG51bWJlcjtcbiAgZHVyYXRpb25Gb3JtYXR0ZWQ6IHN0cmluZztcbiAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gIGNoYW5uZWw/OiBzdHJpbmc7XG4gIHB1Ymxpc2hEYXRlPzogc3RyaW5nO1xuICB2aWV3Q291bnQ/OiBzdHJpbmc7XG4gIGNhdGVnb3J5Pzogc3RyaW5nO1xuICB0YWdzPzogc3RyaW5nW107XG4gIHN1bW1hcnk/OiBzdHJpbmc7IC8vIEFJLWdlbmVyYXRlZCBzdW1tYXJ5IGZyb20gR29vZ2xlXG59XG5cbmludGVyZmFjZSBUcmFuc2NyaXB0U2VnbWVudCB7XG4gIHN0YXJ0OiBudW1iZXI7XG4gIGR1cmF0aW9uOiBudW1iZXI7XG4gIHRleHQ6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIEFuYWx5c2lzUmVzdWx0IHtcbiAga2V5UG9pbnRzOiBzdHJpbmdbXTtcbiAgYWlDb25jZXB0czogc3RyaW5nW107XG4gIHRlY2huaWNhbERldGFpbHM6IHN0cmluZ1tdO1xuICB2aXN1YWxDb250ZXh0RmxhZ3M6IFZpc3VhbENvbnRleHRGbGFnW107XG4gIHN1bW1hcnk6IHN0cmluZztcbiAgcXVhbGl0eVNjb3JlPzogbnVtYmVyO1xuICByYXdSZXNwb25zZT86IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFZpc3VhbENvbnRleHRGbGFnIHtcbiAgdGltZXN0YW1wOiBudW1iZXI7XG4gIHJlYXNvbjogc3RyaW5nO1xuICBjb250ZXh0OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBQcm9jZXNzaW5nU3RhdGUge1xuICB2ZXJzaW9uOiBzdHJpbmc7XG4gIHF1ZXVlOiBWaWRlb0VudHJ5W107XG4gIGN1cnJlbnRJbmRleDogbnVtYmVyO1xuICBzdGFydGVkQXQ6IHN0cmluZztcbiAgbGFzdFVwZGF0ZWQ6IHN0cmluZztcbiAgc3RhdHM6IFByb2Nlc3NpbmdTdGF0cztcbn1cblxuaW50ZXJmYWNlIFByb2Nlc3NpbmdTdGF0cyB7XG4gIHRvdGFsVmlkZW9zOiBudW1iZXI7XG4gIG1ldGFkYXRhQ29tcGxldGU6IG51bWJlcjtcbiAgdHJhbnNjcmlwdHNFeHRyYWN0ZWQ6IG51bWJlcjtcbiAgYW5hbHl6ZWQ6IG51bWJlcjtcbiAgbmVlZHNWaXN1YWxSZXZpZXc6IG51bWJlcjtcbiAgY29tcGxldGVkOiBudW1iZXI7XG4gIHNraXBwZWQ6IG51bWJlcjtcbiAgZXJyb3JzOiBudW1iZXI7XG4gIGFuYWx5c2lzU3VjY2Vzc1JhdGU6IG51bWJlcjtcbiAgYXZlcmFnZVRyYW5zY3JpcHRMZW5ndGg6IG51bWJlcjtcbn1cblxuLy8gTGF0ZXN0IGF2YWlsYWJsZSBtb2RlbCBhcyBvZiBKYW4gMjAyNS8yMDI2XG5jb25zdCBHRU1JTklfTU9ERUwgPSAnZ2VtaW5pLTMtZmxhc2gtcHJldmlldyc7XG5jb25zdCBBSV9TVFVESU9fVVJMID0gYGh0dHBzOi8vYWlzdHVkaW8uZ29vZ2xlLmNvbS9hcHAvcHJvbXB0cy9uZXdfY2hhdD9tb2RlbD0ke0dFTUlOSV9NT0RFTH1gO1xuXG5jb25zdCBBTkFMWVNJU19QUk9NUFQgPSBgWW91IGFyZSBhbmFseXppbmcgYSBZb3VUdWJlIHZpZGVvIHRyYW5zY3JpcHQuIEV4dHJhY3QgYW5kIHN0cnVjdHVyZSB0aGUgZm9sbG93aW5nIGluZm9ybWF0aW9uIGFzIHZhbGlkIEpTT04gb25seSAobm8gbWFya2Rvd24sIG5vIGV4dHJhIHRleHQpLlxuXG5SZXR1cm4gT05MWSB0aGlzIEpTT04gc3RydWN0dXJlOlxue1xuICBcInN1bW1hcnlcIjogXCIyLTMgc2VudGVuY2Ugc3VtbWFyeSBvZiB0aGUgdmlkZW8gY29udGVudFwiLFxuICBcImtleVBvaW50c1wiOiBbXCJwb2ludCAxXCIsIFwicG9pbnQgMlwiLCAuLi5dLFxuICBcImFpQ29uY2VwdHNcIjogW1wiQUkgY29uY2VwdCAxXCIsIFwiQUkgY29uY2VwdCAyXCIsIC4uLl0sXG4gIFwidGVjaG5pY2FsRGV0YWlsc1wiOiBbXCJ0b29sL2ZyYW1ld29yayAxXCIsIFwiaW1wbGVtZW50YXRpb24gZGV0YWlsXCIsIC4uLl0sXG4gIFwidmlzdWFsQ29udGV4dEZsYWdzXCI6IFtcbiAgICB7XCJ0aW1lc3RhbXBcIjogMTIwLCBcInJlYXNvblwiOiBcIkNvZGUgZGVtb1wiLCBcImNvbnRleHRcIjogXCJTaG93cyBQeXRob24gaW1wbGVtZW50YXRpb25cIn1cbiAgXVxufVxuXG5JZiB0aGUgdmlkZW8gaXMgbm90IGFib3V0IEFJL3RlY2gsIHNldCBhaUNvbmNlcHRzIGFuZCB0ZWNobmljYWxEZXRhaWxzIHRvIGVtcHR5IGFycmF5cyBidXQgc3RpbGwgZXh0cmFjdCBrZXlQb2ludHMuXG5cblRSQU5TQ1JJUFQ6XG5gO1xuXG5jbGFzcyBUcmFuc2NyaXB0UHJvY2Vzc29yVjIge1xuICBwcml2YXRlIGNvbnRleHQ6IEJyb3dzZXJDb250ZXh0IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc3RhdGU6IFByb2Nlc3NpbmdTdGF0ZTtcbiAgcHJpdmF0ZSBzdGF0ZUZpbGVQYXRoOiBzdHJpbmc7XG4gIHByaXZhdGUgcmVwb3J0c0Rpcjogc3RyaW5nO1xuICBwcml2YXRlIHRyYW5zY3JpcHRzRGlyOiBzdHJpbmc7XG4gIHByaXZhdGUga25vd2xlZGdlQmFzZUZpbGU6IHN0cmluZztcbiAgcHJpdmF0ZSB0YXJnZXRQaGFzZTogJ21ldGFkYXRhJyB8ICd0cmFuc2NyaXB0JyB8ICdhbmFseXNpcycgPSAnYW5hbHlzaXMnO1xuXG4gIGNvbnN0cnVjdG9yKHRhcmdldFBoYXNlOiAnbWV0YWRhdGEnIHwgJ3RyYW5zY3JpcHQnIHwgJ2FuYWx5c2lzJyA9ICdhbmFseXNpcycpIHtcbiAgICB0aGlzLnRhcmdldFBoYXNlID0gdGFyZ2V0UGhhc2U7XG4gICAgLy8gRGV0ZXJtaW5lIGRhdGEgZGlyZWN0b3J5IChoYW5kbGUgYm90aCBwYWNrYWdlIGFuZCByb290IHNjZW5hcmlvcylcbiAgICBjb25zdCBwYWNrYWdlRGF0YURpciA9IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9kYXRhJyk7XG4gICAgY29uc3Qgcm9vdERhdGFEaXIgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vZGF0YScpO1xuXG4gICAgLy8gUHJlZmVyIHJvb3QgZGF0YSBkaXIgaWYgaXQgZXhpc3RzIChwcmV2aW91cyBiZWhhdmlvciksIG90aGVyd2lzZSBwYWNrYWdlIGRhdGFcbiAgICBjb25zdCBkYXRhRGlyID0gZnMuZXhpc3RzU3luYyhyb290RGF0YURpcikgPyByb290RGF0YURpciA6IHBhY2thZ2VEYXRhRGlyO1xuXG4gICAgdGhpcy5zdGF0ZUZpbGVQYXRoID0gcGF0aC5qb2luKGRhdGFEaXIsICd0cmFuc2NyaXB0LXYyLXN0YXRlLmpzb24nKTtcbiAgICB0aGlzLnJlcG9ydHNEaXIgPSBwYXRoLmpvaW4oZGF0YURpciwgJ3ZpZGVvLXJlcG9ydHMnKTtcbiAgICB0aGlzLnRyYW5zY3JpcHRzRGlyID0gcGF0aC5qb2luKGRhdGFEaXIsICd2aWRlby10cmFuc2NyaXB0cycpO1xuICAgIHRoaXMua25vd2xlZGdlQmFzZUZpbGUgPSBwYXRoLmpvaW4oZGF0YURpciwgJ0FJX0tub3dsZWRnZV9CYXNlLm1kJyk7XG5cbiAgICBjb25zb2xlLmxvZyhgW3YyXSBVc2luZyBkYXRhIGRpcmVjdG9yeTogJHtkYXRhRGlyfWApO1xuXG4gICAgLy8gRW5zdXJlIGRpcmVjdG9yaWVzIGV4aXN0XG4gICAgZnMubWtkaXJTeW5jKHRoaXMucmVwb3J0c0RpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgZnMubWtkaXJTeW5jKHRoaXMudHJhbnNjcmlwdHNEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGZzLm1rZGlyU3luYyhwYXRoLmpvaW4oZGF0YURpciwgJ3RlbXBfc3VicycpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcblxuICAgIHRoaXMuc3RhdGUgPSB0aGlzLmxvYWRTdGF0ZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBsb2FkU3RhdGUoKTogUHJvY2Vzc2luZ1N0YXRlIHtcbiAgICB0cnkge1xuICAgICAgaWYgKGZzLmV4aXN0c1N5bmModGhpcy5zdGF0ZUZpbGVQYXRoKSkge1xuICAgICAgICBjb25zdCBzdGF0ZSA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHRoaXMuc3RhdGVGaWxlUGF0aCwgJ3V0Zi04JykpO1xuICAgICAgICAvLyBNaWdyYXRlIG9sZCBzdGF0ZSBpZiBuZWVkZWRcbiAgICAgICAgaWYgKHN0YXRlLnZlcnNpb24gIT09ICcyLjAnKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1t2Ml0gTWlncmF0aW5nIHN0YXRlIHRvIHYyIGZvcm1hdC4uLicpO1xuICAgICAgICAgIHN0YXRlLnZlcnNpb24gPSAnMi4wJztcbiAgICAgICAgICBzdGF0ZS5xdWV1ZSA9IHN0YXRlLnF1ZXVlLm1hcCgodjogYW55KSA9PiAoe1xuICAgICAgICAgICAgLi4udixcbiAgICAgICAgICAgIHByb2Nlc3NpbmdBdHRlbXB0czogdi5wcm9jZXNzaW5nQXR0ZW1wdHMgfHwgMCxcbiAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdbdjJdIENyZWF0aW5nIG5ldyBzdGF0ZSBmaWxlJyk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICB2ZXJzaW9uOiAnMi4wJyxcbiAgICAgIHF1ZXVlOiBbXSxcbiAgICAgIGN1cnJlbnRJbmRleDogMCxcbiAgICAgIHN0YXJ0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgbGFzdFVwZGF0ZWQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIHN0YXRzOiB7XG4gICAgICAgIHRvdGFsVmlkZW9zOiAwLFxuICAgICAgICBtZXRhZGF0YUNvbXBsZXRlOiAwLFxuICAgICAgICB0cmFuc2NyaXB0c0V4dHJhY3RlZDogMCxcbiAgICAgICAgYW5hbHl6ZWQ6IDAsXG4gICAgICAgIG5lZWRzVmlzdWFsUmV2aWV3OiAwLFxuICAgICAgICBjb21wbGV0ZWQ6IDAsXG4gICAgICAgIHNraXBwZWQ6IDAsXG4gICAgICAgIGVycm9yczogMCxcbiAgICAgICAgYW5hbHlzaXNTdWNjZXNzUmF0ZTogMCxcbiAgICAgICAgYXZlcmFnZVRyYW5zY3JpcHRMZW5ndGg6IDAsXG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIHNhdmVTdGF0ZSgpOiB2b2lkIHtcbiAgICB0aGlzLnN0YXRlLmxhc3RVcGRhdGVkID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgIHRoaXMudXBkYXRlU3RhdHMoKTtcbiAgICBmcy5ta2RpclN5bmMocGF0aC5kaXJuYW1lKHRoaXMuc3RhdGVGaWxlUGF0aCksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGZzLndyaXRlRmlsZVN5bmModGhpcy5zdGF0ZUZpbGVQYXRoLCBKU09OLnN0cmluZ2lmeSh0aGlzLnN0YXRlLCBudWxsLCAyKSk7XG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZVN0YXRzKCk6IHZvaWQge1xuICAgIGNvbnN0IHMgPSB0aGlzLnN0YXRlLnN0YXRzO1xuICAgIGNvbnN0IGFuYWx5emVkID0gdGhpcy5zdGF0ZS5xdWV1ZS5maWx0ZXIoKHYpID0+IHYuYW5hbHlzaXMpLmxlbmd0aDtcbiAgICBjb25zdCBhdHRlbXB0ZWQgPSB0aGlzLnN0YXRlLnF1ZXVlLmZpbHRlcigodikgPT4gdi5wcm9jZXNzaW5nQXR0ZW1wdHMgPiAwKS5sZW5ndGg7XG4gICAgcy5hbmFseXNpc1N1Y2Nlc3NSYXRlID0gYXR0ZW1wdGVkID4gMCA/IChhbmFseXplZCAvIGF0dGVtcHRlZCkgKiAxMDAgOiAwO1xuXG4gICAgY29uc3QgdHJhbnNjcmlwdHMgPSB0aGlzLnN0YXRlLnF1ZXVlLmZpbHRlcigodikgPT4gdi50cmFuc2NyaXB0KTtcbiAgICBzLmF2ZXJhZ2VUcmFuc2NyaXB0TGVuZ3RoID1cbiAgICAgIHRyYW5zY3JpcHRzLmxlbmd0aCA+IDBcbiAgICAgICAgPyB0cmFuc2NyaXB0cy5yZWR1Y2UoKHN1bSwgdikgPT4gc3VtICsgKHYudHJhbnNjcmlwdD8ubGVuZ3RoIHx8IDApLCAwKSAvIHRyYW5zY3JpcHRzLmxlbmd0aFxuICAgICAgICA6IDA7XG4gIH1cblxuICBwcml2YXRlIGV4dHJhY3RWaWRlb0lkKHVybDogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgY29uc3QgcGF0dGVybnMgPSBbXG4gICAgICAvKD86eW91dHViZVxcLmNvbVxcL3dhdGNoXFw/dj18eW91dHVcXC5iZVxcL3x5b3V0dWJlXFwuY29tXFwvZW1iZWRcXC8pKFteJlxccz9dKykvLFxuICAgICAgL3lvdXR1YmVcXC5jb21cXC92XFwvKFteJlxccz9dKykvLFxuICAgIF07XG4gICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIHBhdHRlcm5zKSB7XG4gICAgICBjb25zdCBtYXRjaCA9IHVybC5tYXRjaChwYXR0ZXJuKTtcbiAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXR1cm4gbWF0Y2hbMV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgZm9ybWF0RHVyYXRpb24oc2Vjb25kczogbnVtYmVyKTogc3RyaW5nIHtcbiAgICBjb25zdCBob3VycyA9IE1hdGguZmxvb3Ioc2Vjb25kcyAvIDM2MDApO1xuICAgIGNvbnN0IG1pbnV0ZXMgPSBNYXRoLmZsb29yKChzZWNvbmRzICUgMzYwMCkgLyA2MCk7XG4gICAgY29uc3Qgc2VjcyA9IE1hdGguZmxvb3Ioc2Vjb25kcyAlIDYwKTtcblxuICAgIGlmIChob3VycyA+IDApIHtcbiAgICAgIHJldHVybiBgJHtob3Vyc306JHttaW51dGVzLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKX06JHtzZWNzLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKX1gO1xuICAgIH1cbiAgICByZXR1cm4gYCR7bWludXRlc306JHtzZWNzLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKX1gO1xuICB9XG5cbiAgZGVjb2RlSHRtbEVudGl0aWVzKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRleHRcbiAgICAgIC5yZXBsYWNlKC8mYW1wOy9nLCAnJicpXG4gICAgICAucmVwbGFjZSgvJmx0Oy9nLCAnPCcpXG4gICAgICAucmVwbGFjZSgvJmd0Oy9nLCAnPicpXG4gICAgICAucmVwbGFjZSgvJnF1b3Q7L2csICdcIicpXG4gICAgICAucmVwbGFjZSgvJiMzOTsvZywgXCInXCIpXG4gICAgICAucmVwbGFjZSgvJiN4Mjc7L2csIFwiJ1wiKVxuICAgICAgLnJlcGxhY2UoLyYjeDJGOy9nLCAnLycpO1xuICB9XG5cbiAgYXN5bmMgaW5pdGlhbGl6ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyBVc2UgdGhlIFNBTUUgcHJvZmlsZSBhcyB0aGUgb3JpZ2luYWwgcHJvY2Vzc29yIHdoZXJlIHVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW5cbiAgICAvLyBVc2UgdGhlIFNBTUUgY2xlYW4gcHJvZmlsZSBhcyBMb2dpbkhlbHBlclxuICAgIGNvbnN0IHByb2ZpbGVEaXIgPSBwYXRoLmpvaW4ocHJvY2Vzcy5lbnYuSE9NRSB8fCAnL3RtcCcsICcudmlkZW8tcHJvY2Vzc29yLWNocm9tZS1jbGVhbicpO1xuXG4gICAgY29uc29sZS5sb2coJ1t2Ml0g8J+agCBMYXVuY2hpbmcgQ2hyb21lICh1c2luZyBjbGVhbiBsb2dpbiBzZXNzaW9uKS4uLicpO1xuICAgIGZzLm1rZGlyU3luYyhwcm9maWxlRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcblxuICAgIHRoaXMuY29udGV4dCA9IGF3YWl0IGNocm9taXVtLmxhdW5jaFBlcnNpc3RlbnRDb250ZXh0KHByb2ZpbGVEaXIsIHtcbiAgICAgIGhlYWRsZXNzOiBmYWxzZSxcbiAgICAgIGNoYW5uZWw6ICdjaHJvbWUnLFxuICAgICAgYXJnczogW1xuICAgICAgICAnLS1uby1maXJzdC1ydW4nLFxuICAgICAgICAnLS1uby1kZWZhdWx0LWJyb3dzZXItY2hlY2snLFxuICAgICAgICAnLS1kaXNhYmxlLWJsaW5rLWZlYXR1cmVzPUF1dG9tYXRpb25Db250cm9sbGVkJyxcbiAgICAgIF0sXG4gICAgICB2aWV3cG9ydDogeyB3aWR0aDogMTQwMCwgaGVpZ2h0OiA5MDAgfSxcbiAgICAgIGlnbm9yZURlZmF1bHRBcmdzOiBbJy0tZW5hYmxlLWF1dG9tYXRpb24nXSxcbiAgICAgIHVzZXJBZ2VudDpcbiAgICAgICAgJ01vemlsbGEvNS4wIChNYWNpbnRvc2g7IEludGVsIE1hYyBPUyBYIDEwXzE1XzcpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjAuMC4wLjAgU2FmYXJpLzUzNy4zNicsXG4gICAgfSk7XG5cbiAgICBjb25zb2xlLmxvZygnW3YyXSDinIUgQnJvd3NlciByZWFkeScpO1xuICB9XG5cbiAgLy8gSGVscGVyIGZvciBodW1hbi1saWtlIGRlbGF5c1xuICBwcml2YXRlIGFzeW5jIGh1bWFuRGVsYXkobWluOiBudW1iZXIsIG1heDogbnVtYmVyLCBwYWdlOiBQYWdlKSB7XG4gICAgY29uc3QgZGVsYXkgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKSArIG1pbik7XG4gICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dChkZWxheSk7XG4gIH1cblxuICAvLyBIZWxwZXIgZm9yIGh1bWFuLWxpa2UgbW91c2UgbW92ZW1lbnRcbiAgcHJpdmF0ZSBhc3luYyBodW1hbk1vdmUocGFnZTogUGFnZSwgc2VsZWN0b3I6IHN0cmluZykge1xuICAgIGNvbnN0IGVsZW1lbnQgPSBhd2FpdCBwYWdlLiQoc2VsZWN0b3IpO1xuICAgIGlmICghZWxlbWVudCkgcmV0dXJuO1xuXG4gICAgY29uc3QgYm94ID0gYXdhaXQgZWxlbWVudC5ib3VuZGluZ0JveCgpO1xuICAgIGlmICghYm94KSByZXR1cm47XG5cbiAgICAvLyBTdGFydCBmcm9tIHJhbmRvbSBwb3NpdGlvblxuICAgIGF3YWl0IHBhZ2UubW91c2UubW92ZShNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA1MDApLCBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA1MDApKTtcblxuICAgIC8vIE1vdmUgdG8gdGFyZ2V0IHdpdGggXCJvdmVyc2hvb3RcIiBlZmZlY3Qgc2ltdWxhdGlvbiAoc2ltcGxlIHN0ZXBzKVxuICAgIGNvbnN0IHRhcmdldFggPSBib3gueCArIGJveC53aWR0aCAvIDI7XG4gICAgY29uc3QgdGFyZ2V0WSA9IGJveC55ICsgYm94LmhlaWdodCAvIDI7XG4gICAgYXdhaXQgcGFnZS5tb3VzZS5tb3ZlKHRhcmdldFgsIHRhcmdldFksIHsgc3RlcHM6IDI1IH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzb2x2ZUdvb2dsZUNhcHRjaGEocGFnZTogUGFnZSkge1xuICAgIGNvbnNvbGUubG9nKCdbdjJdIOKaoO+4jyBEZXRlY3RlZCBHb29nbGUgUm9ib3QgQ2hlY2suIEF0dGVtcHRpbmcgdG8gc29sdmUuLi4nKTtcblxuICAgIC8vIDEuIExvb2sgZm9yIHRoZSBpZnJhbWVcbiAgICBjb25zdCBmcmFtZXMgPSBwYWdlLmZyYW1lcygpO1xuICAgIGNvbnN0IHJlY2FwdGNoYUZyYW1lID0gZnJhbWVzLmZpbmQoKGYpID0+IGYudXJsKCkuaW5jbHVkZXMoJ2dvb2dsZS5jb20vcmVjYXB0Y2hhJykpO1xuXG4gICAgaWYgKHJlY2FwdGNoYUZyYW1lKSB7XG4gICAgICBjb25zb2xlLmxvZygnW3YyXSBGb3VuZCByZUNBUFRDSEEgZnJhbWUuIENsaWNraW5nIGNoZWNrYm94Li4uJyk7XG5cbiAgICAgIGNvbnN0IGNoZWNrYm94ID0gYXdhaXQgcmVjYXB0Y2hhRnJhbWUuJCgnLnJlY2FwdGNoYS1jaGVja2JveC1ib3JkZXIsICNyZWNhcHRjaGEtYW5jaG9yJyk7XG4gICAgICBpZiAoY2hlY2tib3gpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5odW1hbkRlbGF5KDEwMDAsIDMwMDAsIHBhZ2UpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gVXNlIFBsYXl3cmlnaHQncyBuYXRpdmUgaGFuZGxpbmcgd2hpY2ggY29ycmVjdGx5IG1hcHMgaWZyYW1lIGNvb3JkaW5hdGVzXG4gICAgICAgICAgYXdhaXQgY2hlY2tib3guaG92ZXIoKTtcbiAgICAgICAgICBhd2FpdCB0aGlzLmh1bWFuRGVsYXkoMjAwLCA1MDAsIHBhZ2UpO1xuICAgICAgICAgIGF3YWl0IGNoZWNrYm94LmNsaWNrKHsgZGVsYXk6IE1hdGgucmFuZG9tKCkgKiAxMDAgKyA1MCB9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIENsaWNrIGZhaWxlZCwgdHJ5aW5nIGZvcmNlIGNsaWNrJywgZSk7XG4gICAgICAgICAgYXdhaXQgY2hlY2tib3guZGlzcGF0Y2hFdmVudCgnY2xpY2snKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIENsaWNrZWQgY2hlY2tib3guIFdhaXRpbmcgZm9yIG91dGNvbWUuLi4nKTtcbiAgICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCg1MDAwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIENvdWxkIG5vdCBmaW5kIGNoZWNrYm94IGluc2lkZSBmcmFtZS4nKTtcbiAgICAgICAgLy8gVGFrZSBhIHNjcmVlbnNob3QgZm9yIHZhbGlkIGRlYnVnZ2luZ1xuICAgICAgICBhd2FpdCBwYWdlLnNjcmVlbnNob3QoeyBwYXRoOiBwYXRoLmpvaW4odGhpcy5yZXBvcnRzRGlyLCAnY2FwdGNoYV9mYWlsLnBuZycpIH0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBGYWxsYmFjazogbG9va2luZyBmb3Igbm9ybWFsIGJ1dHRvbnMgaWYgaXQncyBub3QgYW4gaWZyYW1lIGNhcHRjaGFcbiAgICAgIGNvbnN0IGJ1dHRvbiA9IGF3YWl0IHBhZ2UuJCgnI0wyQUdMYiwgW2FyaWEtbGFiZWw9XCJJIGFncmVlXCJdLCBidXR0b246aGFzLXRleHQoXCJJIGFncmVlXCIpJyk7XG4gICAgICBpZiAoYnV0dG9uKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIEZvdW5kIHNpbXBsZSBjb25zZW50IGJ1dHRvbi4gQ2xpY2tpbmcuLi4nKTtcbiAgICAgICAgYXdhaXQgdGhpcy5odW1hbk1vdmUocGFnZSwgJyNMMkFHTGInKTsgLy8gbW92ZSB0byBjb25zZW50XG4gICAgICAgIGF3YWl0IGJ1dHRvbi5jbGljaygpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIHdlIGFyZSBzdGlsbCBzdHVja1xuICAgIGlmIChwYWdlLnVybCgpLmluY2x1ZGVzKCdnb29nbGUuY29tL3NvcnJ5LycpKSB7XG4gICAgICBjb25zb2xlLmxvZygnW3YyXSBTdGlsbCBvbiBzb3JyeSBwYWdlLiBXYWl0aW5nIGZvciB1c2VyIGludGVydmVudGlvbiBvciBJUCByb3RhdGlvbi4uLicpO1xuICAgICAgLy8gSW4gYSByZWFsIGhlYWRsZXNzIHNjZW5hcmlvLCB3ZSdkIG5lZWQgYSBjYXB0Y2hhIHNlcnZpY2UgaGVyZS5cbiAgICAgIC8vIEZvciBub3csIHdlIHdhaXQgYSBiaXQgdG8gc2VlIGlmIGl0IGNsZWFycyBvciBpZiB3ZSBjYW4gcHJvY2VlZC5cbiAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoNTAwMCk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZmV0Y2hFbnJpY2hlZE1ldGFkYXRhKHZpZGVvOiBWaWRlb0VudHJ5KTogUHJvbWlzZTxWaWRlb01ldGFkYXRhIHwgbnVsbD4ge1xuICAgIGlmICghdGhpcy5jb250ZXh0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Jyb3dzZXIgbm90IGluaXRpYWxpemVkJyk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coYFt2Ml0g8J+TiiBFbnJpY2hlZCBtZXRhZGF0YSBmZXRjaDogJHt2aWRlby50aXRsZX1gKTtcblxuICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCB0aGlzLmNvbnRleHQubmV3UGFnZSgpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHF1ZXJ5ID0gYFlvdVR1YmUgdmlkZW8gXCIke3ZpZGVvLnVybH1cIiBjb21wbGV0ZSBpbmZvcm1hdGlvbjogZHVyYXRpb24sIGNoYW5uZWwsIGRlc2NyaXB0aW9uLCB2aWV3cywgcHVibGlzaCBkYXRlLCB0b3BpY3MsIHN1bW1hcnlgO1xuICAgICAgY29uc3Qgc2VhcmNoVXJsID0gYGh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vc2VhcmNoP3E9JHtlbmNvZGVVUklDb21wb25lbnQocXVlcnkpfSZ1ZG09NTBgO1xuXG4gICAgICBhd2FpdCBwYWdlLmdvdG8oc2VhcmNoVXJsLCB7IHdhaXRVbnRpbDogJ2RvbWNvbnRlbnRsb2FkZWQnLCB0aW1lb3V0OiAzMDAwMCB9KTtcblxuICAgICAgLy8gQ2hlY2sgZm9yIEdvb2dsZSBSb2JvdCBDaGVja1xuICAgICAgaWYgKFxuICAgICAgICBwYWdlLnVybCgpLmluY2x1ZGVzKCdnb29nbGUuY29tL3NvcnJ5LycpIHx8XG4gICAgICAgIChhd2FpdCBwYWdlLiQoJ3RleHQ9XCJ1bnVzdWFsIHRyYWZmaWNcIicpKSB8fFxuICAgICAgICAoYXdhaXQgcGFnZS4kKCdpZnJhbWVbc3JjKj1cInJlY2FwdGNoYVwiXScpKVxuICAgICAgKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuc29sdmVHb29nbGVDYXB0Y2hhKHBhZ2UpO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDUwMDApOyAvLyBMZXQgQUkgbW9kZSBnZW5lcmF0ZSByZXNwb25zZVxuXG4gICAgICBjb25zdCBwYWdlVGV4dCA9IGF3YWl0IHBhZ2UuZXZhbHVhdGUoKCkgPT4gZG9jdW1lbnQuYm9keS5pbm5lclRleHQpO1xuXG4gICAgICBsZXQgZHVyYXRpb24gPSAwO1xuICAgICAgY29uc3QgZHVyYXRpb25QYXR0ZXJucyA9IFtcbiAgICAgICAgLyhcXGQrKVxccypob3Vycz9cXHMqLD9cXHMqKFxcZCspP1xccyptaW51dGVzP1xccyosP1xccyooXFxkKyk/XFxzKnNlY29uZHM/L2ksXG4gICAgICAgIC8oXFxkKylcXHMqbWludXRlcz9cXHMqLD9cXHMqKFxcZCspP1xccypzZWNvbmRzPy9pLFxuICAgICAgICAvKFxcZCspOihcXGQrKTooXFxkKykvLFxuICAgICAgICAvKFxcZCspOihcXGQrKS8sXG4gICAgICAgIC9kdXJhdGlvbls6XFxzXSooXFxkKyk6KFxcZCspL2ksXG4gICAgICBdO1xuXG4gICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgZHVyYXRpb25QYXR0ZXJucykge1xuICAgICAgICBjb25zdCBtYXRjaCA9IHBhZ2VUZXh0Lm1hdGNoKHBhdHRlcm4pO1xuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICBpZiAobWF0Y2hbMF0udG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnaG91cicpKSB7XG4gICAgICAgICAgICBkdXJhdGlvbiA9XG4gICAgICAgICAgICAgIHBhcnNlSW50KG1hdGNoWzFdKSAqIDM2MDAgK1xuICAgICAgICAgICAgICBwYXJzZUludChtYXRjaFsyXSB8fCAnMCcpICogNjAgK1xuICAgICAgICAgICAgICBwYXJzZUludChtYXRjaFszXSB8fCAnMCcpO1xuICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2hbMF0udG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnbWludXRlJykpIHtcbiAgICAgICAgICAgIGR1cmF0aW9uID0gcGFyc2VJbnQobWF0Y2hbMV0pICogNjAgKyBwYXJzZUludChtYXRjaFsyXSB8fCAnMCcpO1xuICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2gubGVuZ3RoID09PSA0KSB7XG4gICAgICAgICAgICBkdXJhdGlvbiA9IHBhcnNlSW50KG1hdGNoWzFdKSAqIDM2MDAgKyBwYXJzZUludChtYXRjaFsyXSkgKiA2MCArIHBhcnNlSW50KG1hdGNoWzNdKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAgICAgZHVyYXRpb24gPSBwYXJzZUludChtYXRjaFsxXSkgKiA2MCArIHBhcnNlSW50KG1hdGNoWzJdKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgY2hhbm5lbFBhdHRlcm5zID0gW1xuICAgICAgICAvKD86Ynl8Y2hhbm5lbHxmcm9tKVxccyooW0EtWmEtejAtOVxcc1xcLV9dKz8pKD86XFxzKlvCt+KAolxcLXxdfFxccypcXGR8dmlld3N8c3Vic2NyaWJlcnN8JCkvaSxcbiAgICAgICAgL3VwbG9hZGVkIGJ5XFxzKihbQS1aYS16MC05XFxzXFwtX10rKS9pLFxuICAgICAgXTtcbiAgICAgIGxldCBjaGFubmVsOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgY2hhbm5lbFBhdHRlcm5zKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gcGFnZVRleHQubWF0Y2gocGF0dGVybik7XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgIGNoYW5uZWwgPSBtYXRjaFsxXS50cmltKCkuc3Vic3RyaW5nKDAsIDUwKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCB2aWV3TWF0Y2ggPSBwYWdlVGV4dC5tYXRjaCgvKFxcZCsoPzosXFxkKykqKD86XFwuXFxkKyk/W0tNQl0/KVxccyp2aWV3cz8vaSk7XG5cbiAgICAgIGNvbnN0IGRhdGVQYXR0ZXJucyA9IFtcbiAgICAgICAgLyg/OnB1Ymxpc2hlZHx1cGxvYWRlZHxwb3N0ZWQpXFxzKig/Om9uXFxzKik/KFtBLVphLXpdK1xccytcXGQrLD9cXHMqXFxkezR9KS9pLFxuICAgICAgICAvKFxcZCtcXHMqKD86ZGF5cz98d2Vla3M/fG1vbnRocz98eWVhcnM/KVxccyphZ28pL2ksXG4gICAgICBdO1xuICAgICAgbGV0IHB1Ymxpc2hEYXRlOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgZGF0ZVBhdHRlcm5zKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gcGFnZVRleHQubWF0Y2gocGF0dGVybik7XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgIHB1Ymxpc2hEYXRlID0gbWF0Y2hbMV07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgZGVzY01hdGNoID0gcGFnZVRleHQubWF0Y2goLyg/OmRlc2NyaXB0aW9ufGFib3V0KVs6XFxzXSooW14uXStcXC5bXi5dK1xcLikvaSk7XG4gICAgICBjb25zdCBzdW1tYXJ5TWF0Y2ggPSBwYWdlVGV4dC5tYXRjaCgvKD86c3VtbWFyeXxvdmVydmlld3x0aGlzIHZpZGVvKVs6XFxzXSooW14uXStcXC5bXi5dK1xcLikvaSk7XG5cbiAgICAgIGNvbnN0IG1ldGFkYXRhOiBWaWRlb01ldGFkYXRhID0ge1xuICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgZHVyYXRpb25Gb3JtYXR0ZWQ6IHRoaXMuZm9ybWF0RHVyYXRpb24oZHVyYXRpb24pLFxuICAgICAgICBjaGFubmVsLFxuICAgICAgICB2aWV3Q291bnQ6IHZpZXdNYXRjaCA/IHZpZXdNYXRjaFsxXSA6IHVuZGVmaW5lZCxcbiAgICAgICAgcHVibGlzaERhdGUsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjTWF0Y2ggPyBkZXNjTWF0Y2hbMV0uc3Vic3RyaW5nKDAsIDUwMCkgOiB1bmRlZmluZWQsXG4gICAgICAgIHN1bW1hcnk6IHN1bW1hcnlNYXRjaCA/IHN1bW1hcnlNYXRjaFsxXS5zdWJzdHJpbmcoMCwgMzAwKSA6IHVuZGVmaW5lZCxcbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcbiAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBgW3YyXSDinIUgTWV0YWRhdGE6ICR7bWV0YWRhdGEuZHVyYXRpb25Gb3JtYXR0ZWR9IHwgJHttZXRhZGF0YS5jaGFubmVsIHx8ICdVbmtub3duIGNoYW5uZWwnfWBcbiAgICAgICk7XG4gICAgICByZXR1cm4gbWV0YWRhdGE7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihgW3YyXSBFcnJvciBpbiBtZXRhZGF0YSBmZXRjaDpgLCBlKTtcbiAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGV4dHJhY3RUcmFuc2NyaXB0RGlyZWN0KHZpZGVvOiBWaWRlb0VudHJ5KTogUHJvbWlzZTxUcmFuc2NyaXB0U2VnbWVudFtdIHwgbnVsbD4ge1xuICAgIGlmICghdGhpcy5jb250ZXh0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Jyb3dzZXIgbm90IGluaXRpYWxpemVkJyk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coYFt2Ml0g8J+TnSBUcmFuc2NyaXB0IGV4dHJhY3Rpb246ICR7dmlkZW8udmlkZW9JZH1gKTtcblxuICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCB0aGlzLmNvbnRleHQubmV3UGFnZSgpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHBhZ2UuZ290byh2aWRlby51cmwsIHsgd2FpdFVudGlsOiAnbG9hZCcsIHRpbWVvdXQ6IDQ1MDAwIH0pO1xuICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgzMDAwKTtcblxuICAgICAgY29uc3QgY2FwdGlvbkRhdGEgPSBhd2FpdCBwYWdlLmV2YWx1YXRlKCgpID0+IHtcbiAgICAgICAgY29uc3Qgd2luID0gd2luZG93IGFzIGFueTtcbiAgICAgICAgaWYgKHdpbi55dEluaXRpYWxQbGF5ZXJSZXNwb25zZT8uY2FwdGlvbnM/LnBsYXllckNhcHRpb25zVHJhY2tsaXN0UmVuZGVyZXI/LmNhcHRpb25UcmFja3MpIHtcbiAgICAgICAgICBjb25zdCB0cmFja3MgPVxuICAgICAgICAgICAgd2luLnl0SW5pdGlhbFBsYXllclJlc3BvbnNlLmNhcHRpb25zLnBsYXllckNhcHRpb25zVHJhY2tsaXN0UmVuZGVyZXIuY2FwdGlvblRyYWNrcztcbiAgICAgICAgICBjb25zdCB0cmFjayA9IHRyYWNrcy5maW5kKCh0OiBhbnkpID0+IHQubGFuZ3VhZ2VDb2RlID09PSAnZW4nKSB8fCB0cmFja3NbMF07XG4gICAgICAgICAgcmV0dXJuIHRyYWNrPy5iYXNlVXJsIHx8IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzY3JpcHRzID0gQXJyYXkuZnJvbShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdzY3JpcHQnKSk7XG4gICAgICAgIGZvciAoY29uc3Qgc2NyaXB0IG9mIHNjcmlwdHMpIHtcbiAgICAgICAgICBjb25zdCB0ZXh0ID0gc2NyaXB0LnRleHRDb250ZW50IHx8ICcnO1xuICAgICAgICAgIGlmICh0ZXh0LmluY2x1ZGVzKCdjYXB0aW9uVHJhY2tzJykpIHtcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gdGV4dC5tYXRjaCgvXCJjYXB0aW9uVHJhY2tzXCI6XFxzKlxcWyguKj8pXFxdLyk7XG4gICAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCB0cmFja3NTdHIgPSAnWycgKyBtYXRjaFsxXSArICddJztcbiAgICAgICAgICAgICAgICBjb25zdCB0cmFja3MgPSBKU09OLnBhcnNlKHRyYWNrc1N0cik7XG4gICAgICAgICAgICAgICAgaWYgKHRyYWNrcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCB0cmFjayA9IHRyYWNrcy5maW5kKCh0OiBhbnkpID0+IHQubGFuZ3VhZ2VDb2RlID09PSAnZW4nKSB8fCB0cmFja3NbMF07XG4gICAgICAgICAgICAgICAgICByZXR1cm4gdHJhY2s/LmJhc2VVcmwgfHwgbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSk7XG5cbiAgICAgIGlmIChjYXB0aW9uRGF0YSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgW3YyXSBGb3VuZCBjYXB0aW9uIFVSTCwgZmV0Y2hpbmcgdHJhbnNjcmlwdC4uLmApO1xuXG4gICAgICAgIGNvbnN0IGNhcHRpb25QYWdlID0gYXdhaXQgdGhpcy5jb250ZXh0IS5uZXdQYWdlKCk7XG4gICAgICAgIGF3YWl0IGNhcHRpb25QYWdlLmdvdG8oY2FwdGlvbkRhdGEsIHsgd2FpdFVudGlsOiAnbG9hZCcsIHRpbWVvdXQ6IDMwMDAwIH0pO1xuICAgICAgICBjb25zdCB4bWwgPSBhd2FpdCBjYXB0aW9uUGFnZS5jb250ZW50KCk7XG4gICAgICAgIGF3YWl0IGNhcHRpb25QYWdlLmNsb3NlKCk7XG5cbiAgICAgICAgY29uc3Qgc2VnbWVudHM6IFRyYW5zY3JpcHRTZWdtZW50W10gPSBbXTtcbiAgICAgICAgY29uc3QgdGV4dFJlZ2V4ID0gLzx0ZXh0IHN0YXJ0PVwiKFtcXGQuXSspXCIgZHVyPVwiKFtcXGQuXSspXCJbXj5dKj4oW148XSopPFxcL3RleHQ+L2c7XG4gICAgICAgIGxldCBtYXRjaDtcblxuICAgICAgICB3aGlsZSAoKG1hdGNoID0gdGV4dFJlZ2V4LmV4ZWMoeG1sKSkgIT09IG51bGwpIHtcbiAgICAgICAgICBzZWdtZW50cy5wdXNoKHtcbiAgICAgICAgICAgIHN0YXJ0OiBwYXJzZUZsb2F0KG1hdGNoWzFdKSxcbiAgICAgICAgICAgIGR1cmF0aW9uOiBwYXJzZUZsb2F0KG1hdGNoWzJdKSxcbiAgICAgICAgICAgIHRleHQ6IHRoaXMuZGVjb2RlSHRtbEVudGl0aWVzKG1hdGNoWzNdKSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZWdtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIOKchSBFeHRyYWN0ZWQgJHtzZWdtZW50cy5sZW5ndGh9IHRyYW5zY3JpcHQgc2VnbWVudHNgKTtcbiAgICAgICAgICByZXR1cm4gc2VnbWVudHM7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coJ1t2Ml0gVHJ5aW5nIFVJIHRyYW5zY3JpcHQgcGFuZWwuLi4nKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZXhwYW5kQnRuID0gcGFnZS5sb2NhdG9yKCcjZXhwYW5kLCB0cC15dC1wYXBlci1idXR0b24jZXhwYW5kJyk7XG4gICAgICAgIGlmICgoYXdhaXQgZXhwYW5kQnRuLmNvdW50KCkpID4gMCkge1xuICAgICAgICAgIGF3YWl0IGV4cGFuZEJ0bi5maXJzdCgpLmNsaWNrKCk7XG4gICAgICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgxMDAwKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkge31cblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdHJhbnNjcmlwdEJ0biA9IHBhZ2UubG9jYXRvcihcbiAgICAgICAgICAnW2FyaWEtbGFiZWwqPVwidHJhbnNjcmlwdFwiXSwgYnV0dG9uOmhhcy10ZXh0KFwidHJhbnNjcmlwdFwiKSdcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKChhd2FpdCB0cmFuc2NyaXB0QnRuLmNvdW50KCkpID4gMCkge1xuICAgICAgICAgIGF3YWl0IHRyYW5zY3JpcHRCdG4uZmlyc3QoKS5jbGljaygpO1xuICAgICAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMjAwMCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHt9XG5cbiAgICAgIGNvbnN0IHVpU2VnbWVudHMgPSBhd2FpdCBwYWdlLmV2YWx1YXRlKCgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0OiBBcnJheTx7IHN0YXJ0OiBudW1iZXI7IGR1cmF0aW9uOiBudW1iZXI7IHRleHQ6IHN0cmluZyB9PiA9IFtdO1xuICAgICAgICBjb25zdCBzZWdtZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3l0ZC10cmFuc2NyaXB0LXNlZ21lbnQtcmVuZGVyZXInKTtcbiAgICAgICAgc2VnbWVudHMuZm9yRWFjaCgoc2VnOiBFbGVtZW50KSA9PiB7XG4gICAgICAgICAgY29uc3QgdGltZUVsID0gc2VnLnF1ZXJ5U2VsZWN0b3IoJy5zZWdtZW50LXRpbWVzdGFtcCcpO1xuICAgICAgICAgIGNvbnN0IHRleHRFbCA9IHNlZy5xdWVyeVNlbGVjdG9yKCcuc2VnbWVudC10ZXh0Jyk7XG4gICAgICAgICAgaWYgKHRpbWVFbCAmJiB0ZXh0RWwpIHtcbiAgICAgICAgICAgIGNvbnN0IHRpbWUgPSB0aW1lRWwudGV4dENvbnRlbnQ/LnRyaW0oKSB8fCAnMDowMCc7XG4gICAgICAgICAgICBjb25zdCB0ZXh0ID0gdGV4dEVsLnRleHRDb250ZW50Py50cmltKCkgfHwgJyc7XG4gICAgICAgICAgICBjb25zdCBwYXJ0cyA9IHRpbWUuc3BsaXQoJzonKS5tYXAoKHA6IHN0cmluZykgPT4gcGFyc2VJbnQocCkgfHwgMCk7XG4gICAgICAgICAgICBjb25zdCBzZWNvbmRzID1cbiAgICAgICAgICAgICAgcGFydHMubGVuZ3RoID09PSAzXG4gICAgICAgICAgICAgICAgPyBwYXJ0c1swXSAqIDM2MDAgKyBwYXJ0c1sxXSAqIDYwICsgcGFydHNbMl1cbiAgICAgICAgICAgICAgICA6IHBhcnRzWzBdICogNjAgKyAocGFydHNbMV0gfHwgMCk7XG4gICAgICAgICAgICBpZiAodGV4dCkge1xuICAgICAgICAgICAgICByZXN1bHQucHVzaCh7IHN0YXJ0OiBzZWNvbmRzLCBkdXJhdGlvbjogMCwgdGV4dCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSk7XG5cbiAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcblxuICAgICAgaWYgKHVpU2VnbWVudHMgJiYgdWlTZWdtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdWlTZWdtZW50cy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgICB1aVNlZ21lbnRzW2ldLmR1cmF0aW9uID0gdWlTZWdtZW50c1tpICsgMV0uc3RhcnQgLSB1aVNlZ21lbnRzW2ldLnN0YXJ0O1xuICAgICAgICB9XG4gICAgICAgIGlmICh1aVNlZ21lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB1aVNlZ21lbnRzW3VpU2VnbWVudHMubGVuZ3RoIC0gMV0uZHVyYXRpb24gPSA1O1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIOKchSBFeHRyYWN0ZWQgJHt1aVNlZ21lbnRzLmxlbmd0aH0gc2VnbWVudHMgKFVJKWApO1xuICAgICAgICByZXR1cm4gdWlTZWdtZW50cztcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coJ1t2Ml0g4pqg77iPIE5vIHRyYW5zY3JpcHQgYXZhaWxhYmxlIHZpYSBVSS4gVHJ5aW5nIHl0LWRscC4uLicpO1xuICAgICAgY29uc3QgZmIgPSB0aGlzLmRvd25sb2FkVHJhbnNjcmlwdFdpdGhZdERscCh2aWRlby51cmwsIHZpZGVvLnZpZGVvSWQpO1xuICAgICAgaWYgKGZiKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIOKchSB5dC1kbHAgc3VjY2VzczogJHtmYi5sZW5ndGh9IHNlZ21lbnRzYCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICByZXR1cm4gZmI7XG4gICAgICB9XG5cbiAgICAgIGNvbnNvbGUubG9nKCdbdjJdIOKaoO+4jyBObyB0cmFuc2NyaXB0IGF2YWlsYWJsZScpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcignW3YyXSBUcmFuc2NyaXB0IGVycm9yOicsIGUpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgfSBjYXRjaCAoeCkge31cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8vIC0tLSBGSVhFRCBQQVJTSU5HIE1FVEhPRCAtLS1cbiAgYXN5bmMgYW5hbHl6ZVdpdGhBSSh2aWRlbzogVmlkZW9FbnRyeSk6IFByb21pc2U8QW5hbHlzaXNSZXN1bHQgfCBudWxsPiB7XG4gICAgaWYgKCF0aGlzLmNvbnRleHQgfHwgIXZpZGVvLnRyYW5zY3JpcHQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKGBbdjJdIPCfpJYgQUkgQW5hbHlzaXM6ICR7dmlkZW8udGl0bGV9YCk7XG5cbiAgICAvLyBGUkVTSCBwYWdlIGZvciBBSSBTdHVkaW9cbiAgICBjb25zdCBwYWdlID0gYXdhaXQgdGhpcy5jb250ZXh0Lm5ld1BhZ2UoKTtcblxuICAgIHRyeSB7XG4gICAgICAvLyBDb21iaW5lIHRyYW5zY3JpcHRcbiAgICAgIGNvbnN0IGZ1bGxUcmFuc2NyaXB0ID0gdmlkZW8udHJhbnNjcmlwdC5tYXAoKHMpID0+IHMudGV4dCkuam9pbignICcpO1xuICAgICAgY29uc3QgdHJ1bmNhdGVkVHJhbnNjcmlwdCA9IGZ1bGxUcmFuc2NyaXB0LnN1YnN0cmluZygwLCAyNTAwMCk7IC8vIFN0YXkgd2l0aGluIGxpbWl0c1xuXG4gICAgICAvLyBOYXZpZ2F0ZSB0byBBSSBTdHVkaW8gd2l0aCBsYXRlc3QgbW9kZWxcbiAgICAgIGF3YWl0IHBhZ2UuZ290byhBSV9TVFVESU9fVVJMLCB7IHdhaXRVbnRpbDogJ2RvbWNvbnRlbnRsb2FkZWQnLCB0aW1lb3V0OiA2MDAwMCB9KTtcbiAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoNTAwMCk7XG5cbiAgICAgIC8vIERpc21pc3MgYW55IGRpYWxvZ3NcbiAgICAgIGZvciAoY29uc3Qgc2VsZWN0b3Igb2YgW1xuICAgICAgICAnYnV0dG9uOmhhcy10ZXh0KFwiR290IGl0XCIpJyxcbiAgICAgICAgJ2J1dHRvbjpoYXMtdGV4dChcIkNvbnRpbnVlXCIpJyxcbiAgICAgICAgJ1thcmlhLWxhYmVsPVwiQ2xvc2VcIl0nLFxuICAgICAgXSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGVsID0gcGFnZS5sb2NhdG9yKHNlbGVjdG9yKTtcbiAgICAgICAgICBpZiAoKGF3YWl0IGVsLmNvdW50KCkpID4gMCAmJiAoYXdhaXQgZWwuZmlyc3QoKS5pc1Zpc2libGUoKSkpIHtcbiAgICAgICAgICAgIGF3YWl0IGVsLmZpcnN0KCkuY2xpY2soeyBmb3JjZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoNTAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAvKiBpZ25vcmUgKi9cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYXdhaXQgcGFnZS5rZXlib2FyZC5wcmVzcygnRXNjYXBlJyk7XG4gICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDUwMCk7XG5cbiAgICAgIC8vIEVudGVyIHByb21wdFxuICAgICAgY29uc3QgdGV4dGFyZWEgPSBwYWdlLmxvY2F0b3IoJ3RleHRhcmVhW2FyaWEtbGFiZWw9XCJFbnRlciBhIHByb21wdFwiXScpO1xuICAgICAgYXdhaXQgdGV4dGFyZWEud2FpdEZvcih7IHN0YXRlOiAndmlzaWJsZScsIHRpbWVvdXQ6IDE1MDAwIH0pO1xuICAgICAgYXdhaXQgdGV4dGFyZWEuY2xpY2soeyBmb3JjZTogdHJ1ZSB9KTtcblxuICAgICAgY29uc3QgZnVsbFByb21wdCA9IEFOQUxZU0lTX1BST01QVCArIHRydW5jYXRlZFRyYW5zY3JpcHQ7XG4gICAgICBhd2FpdCB0ZXh0YXJlYS5maWxsKGZ1bGxQcm9tcHQpO1xuICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgxMDAwKTtcblxuICAgICAgLy8gQ2xpY2sgUnVuXG4gICAgICBjb25zdCBydW5CdG4gPSBwYWdlLmxvY2F0b3IoJ2J1dHRvblthcmlhLWxhYmVsPVwiUnVuXCJdJyk7XG4gICAgICBhd2FpdCBydW5CdG4uY2xpY2soKTtcblxuICAgICAgY29uc29sZS5sb2coJ1t2Ml0gV2FpdGluZyBmb3IgQUkgcmVzcG9uc2UuLi4nKTtcblxuICAgICAgLy8gV2FpdCBmb3IgcmVzcG9uc2Ugd2l0aCBiZXR0ZXIgZXh0cmFjdGlvblxuICAgICAgY29uc3Qgc3RhcnRXYWl0ID0gRGF0ZS5ub3coKTtcbiAgICAgIGNvbnN0IHRpbWVvdXQgPSAyICogNjAgKiAxMDAwOyAvLyAyIG1pbnV0ZXNcblxuICAgICAgd2hpbGUgKERhdGUubm93KCkgLSBzdGFydFdhaXQgPCB0aW1lb3V0KSB7XG4gICAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMzAwMCk7XG5cbiAgICAgICAgLy8gQ2hlY2sgZm9yIGNvbXBsZXRpb24gYnkgbG9va2luZyBmb3IgdGhlIHJlc3BvbnNlIGNvbnRhaW5lclxuICAgICAgICBjb25zdCByZXNwb25zZUNvbnRhaW5lciA9IHBhZ2UubG9jYXRvcihcbiAgICAgICAgICAnbXMtY2hhdC10dXJuLm1vZGVsIC50dXJuLWNvbnRlbnQsIC5jaGF0LXR1cm4tY29udGFpbmVyLm1vZGVsIC50dXJuLWNvbnRlbnQnXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKChhd2FpdCByZXNwb25zZUNvbnRhaW5lci5jb3VudCgpKSA+IDApIHtcbiAgICAgICAgICAvLyBHZXQgdGhlIGlubmVyIHRleHQgZGlyZWN0bHksIG5vdCBpbmNsdWRpbmcgVUkgZWxlbWVudHNcbiAgICAgICAgICBjb25zdCByYXdUZXh0ID0gYXdhaXQgcGFnZS5ldmFsdWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAvLyBGaW5kIHRoZSBhY3R1YWwgcmVzcG9uc2UgdGV4dCwgZXhjbHVkaW5nIHRvb2xiYXIgYnV0dG9uc1xuICAgICAgICAgICAgY29uc3QgY29udGFpbmVycyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXG4gICAgICAgICAgICAgICdtcy1jaGF0LXR1cm4ubW9kZWwgLnR1cm4tY29udGVudCwgLmNoYXQtdHVybi1jb250YWluZXIubW9kZWwgLnR1cm4tY29udGVudCdcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZiAoY29udGFpbmVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGxhc3RDb250YWluZXIgPSBjb250YWluZXJzW2NvbnRhaW5lcnMubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgICAgIC8vIEdldCB0ZXh0IGZyb20gbWFya2Rvd24gY29udGVudCBpZiBhdmFpbGFibGVcbiAgICAgICAgICAgIGNvbnN0IG1hcmtkb3duID0gbGFzdENvbnRhaW5lci5xdWVyeVNlbGVjdG9yKFxuICAgICAgICAgICAgICAnLm1hcmtkb3duLWJvZHksIC5tYXJrZG93bi1jb250ZW50LCAucmVuZGVyZWQtbWFya2Rvd24nXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbGV0IGNvbnRlbnQgPSBtYXJrZG93biA/IG1hcmtkb3duLnRleHRDb250ZW50IHx8ICcnIDogbGFzdENvbnRhaW5lci50ZXh0Q29udGVudCB8fCAnJztcblxuICAgICAgICAgICAgLy8gQ0xFQU5JTkc6IFJlbW92ZSBcIk1vZGVsIFRoaW5raW5nXCIgYmxvY2tzIHdoaWNoIGNsdXR0ZXIgdGhlIG91dHB1dFxuICAgICAgICAgICAgLy8gR2VtaW5pIEZsYXNoIHNvbWV0aW1lcyBvdXRwdXRzIFwiTW9kZWwgVGhpbmtpbmcuLi5cIiBmb2xsb3dlZCBieSB0aG91Z2h0c1xuICAgICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShcbiAgICAgICAgICAgICAgL01vZGVsIFRoaW5raW5nW1xcc1xcU10qPyg/OkV4cGFuZCB0byB2aWV3IG1vZGVsIHRob3VnaHRzfGNoZXZyb25fcmlnaHQpL2csXG4gICAgICAgICAgICAgICcnXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgvTW9kZWwgVGhpbmtpbmdbXFxzXFxTXSo/anNvbi9pLCAnJyk7XG5cbiAgICAgICAgICAgIC8vIFJlbW92ZSBjb21tb24gVUkgdGV4dCBwYXR0ZXJuc1xuICAgICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShcbiAgICAgICAgICAgICAgL21vcmVfdmVydHxjb250ZW50X2NvcHl8ZG93bmxvYWR8ZXhwYW5kX2xlc3N8ZXhwYW5kX21vcmV8TW9kZWwgY29kZSBKU09OL2csXG4gICAgICAgICAgICAgICcnXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gY29udGVudC50cmltKCk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBpZiAocmF3VGV4dCAmJiByYXdUZXh0Lmxlbmd0aCA+IDUwKSB7XG4gICAgICAgICAgICAvLyBUcnkgdG8gZXh0cmFjdCBKU09OIGZyb20gdGhlIHJlc3BvbnNlXG4gICAgICAgICAgICBjb25zdCBqc29uUGF0dGVybnMgPSBbXG4gICAgICAgICAgICAgIC9gYGBqc29uXFxzKihcXHtbXFxzXFxTXSo/XFx9KVxccypgYGAvLCAvLyBTdGFuZGFyZCBtYXJrZG93biBqc29uIGJsb2NrXG4gICAgICAgICAgICAgIC9gYGBcXHMqKFxce1tcXHNcXFNdKj9cXH0pXFxzKmBgYC8sIC8vIEdlbmVyaWMgbWFya2Rvd24gYmxvY2tcbiAgICAgICAgICAgICAgL14oXFx7W1xcc1xcU10qXFx9KSQvLCAvLyBKdXN0IEpTT05cbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIGxldCBhbmFseXNpczogQW5hbHlzaXNSZXN1bHQgfCBudWxsID0gbnVsbDtcblxuICAgICAgICAgICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIGpzb25QYXR0ZXJucykge1xuICAgICAgICAgICAgICBjb25zdCBtYXRjaCA9IHJhd1RleHQubWF0Y2gocGF0dGVybik7XG4gICAgICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBqc29uU3RyID0gbWF0Y2hbMV07XG4gICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGpzb25TdHIpO1xuICAgICAgICAgICAgICAgICAgYW5hbHlzaXMgPSB7XG4gICAgICAgICAgICAgICAgICAgIGtleVBvaW50czogcGFyc2VkLmtleVBvaW50cyB8fCBbXSxcbiAgICAgICAgICAgICAgICAgICAgYWlDb25jZXB0czogcGFyc2VkLmFpQ29uY2VwdHMgfHwgW10sXG4gICAgICAgICAgICAgICAgICAgIHRlY2huaWNhbERldGFpbHM6IHBhcnNlZC50ZWNobmljYWxEZXRhaWxzIHx8IFtdLFxuICAgICAgICAgICAgICAgICAgICB2aXN1YWxDb250ZXh0RmxhZ3M6IHBhcnNlZC52aXN1YWxDb250ZXh0RmxhZ3MgfHwgW10sXG4gICAgICAgICAgICAgICAgICAgIHN1bW1hcnk6IHBhcnNlZC5zdW1tYXJ5IHx8ICcnLFxuICAgICAgICAgICAgICAgICAgICBxdWFsaXR5U2NvcmU6IHRoaXMuY2FsY3VsYXRlUXVhbGl0eVNjb3JlKHBhcnNlZCksXG4gICAgICAgICAgICAgICAgICAgIHJhd1Jlc3BvbnNlOiByYXdUZXh0LnN1YnN0cmluZygwLCAxMDAwKSxcbiAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAvKiB0cnkgbmV4dCBwYXR0ZXJuICovXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEpTT04gUGFyc2UgRmFsbGJhY2s6IFRyeSB0byBmaW5kIHN1YnN0cmluZyBiZXR3ZWVuIGZpcnN0IHsgYW5kIGxhc3QgfVxuICAgICAgICAgICAgaWYgKCFhbmFseXNpcyAmJiByYXdUZXh0LmluY2x1ZGVzKCd7JykgJiYgcmF3VGV4dC5pbmNsdWRlcygnfScpKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSByYXdUZXh0LmluZGV4T2YoJ3snKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbmQgPSByYXdUZXh0Lmxhc3RJbmRleE9mKCd9JykgKyAxO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBvdGVudGlhbEpzb24gPSByYXdUZXh0LnN1YnN0cmluZyhzdGFydCwgZW5kKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKHBvdGVudGlhbEpzb24pO1xuICAgICAgICAgICAgICAgIGFuYWx5c2lzID0ge1xuICAgICAgICAgICAgICAgICAga2V5UG9pbnRzOiBwYXJzZWQua2V5UG9pbnRzIHx8IFtdLFxuICAgICAgICAgICAgICAgICAgYWlDb25jZXB0czogcGFyc2VkLmFpQ29uY2VwdHMgfHwgW10sXG4gICAgICAgICAgICAgICAgICB0ZWNobmljYWxEZXRhaWxzOiBwYXJzZWQudGVjaG5pY2FsRGV0YWlscyB8fCBbXSxcbiAgICAgICAgICAgICAgICAgIHZpc3VhbENvbnRleHRGbGFnczogcGFyc2VkLnZpc3VhbENvbnRleHRGbGFncyB8fCBbXSxcbiAgICAgICAgICAgICAgICAgIHN1bW1hcnk6IHBhcnNlZC5zdW1tYXJ5IHx8ICcnLFxuICAgICAgICAgICAgICAgICAgcXVhbGl0eVNjb3JlOiB0aGlzLmNhbGN1bGF0ZVF1YWxpdHlTY29yZShwYXJzZWQpLFxuICAgICAgICAgICAgICAgICAgcmF3UmVzcG9uc2U6IHJhd1RleHQuc3Vic3RyaW5nKDAsIDEwMDApLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAvKiBpZ25vcmUgKi9cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUZXh0IEZhbGxiYWNrOiBDcmVhdGUgc3RydWN0dXJlZCBhbmFseXNpcyBmcm9tIHRleHQgaWYgSlNPTiBmYWlsc1xuICAgICAgICAgICAgaWYgKCFhbmFseXNpcykge1xuICAgICAgICAgICAgICBhbmFseXNpcyA9IHtcbiAgICAgICAgICAgICAgICBrZXlQb2ludHM6IHRoaXMuZXh0cmFjdEJ1bGxldFBvaW50cyhyYXdUZXh0KSxcbiAgICAgICAgICAgICAgICBhaUNvbmNlcHRzOiB0aGlzLmV4dHJhY3RBSUNvbmNlcHRzKHJhd1RleHQpLFxuICAgICAgICAgICAgICAgIHRlY2huaWNhbERldGFpbHM6IFtdLFxuICAgICAgICAgICAgICAgIHZpc3VhbENvbnRleHRGbGFnczogW10sXG4gICAgICAgICAgICAgICAgc3VtbWFyeTogcmF3VGV4dC5zdWJzdHJpbmcoMCwgMzAwKS5yZXBsYWNlKC9cXG4vZywgJyAnKSxcbiAgICAgICAgICAgICAgICBxdWFsaXR5U2NvcmU6IDUwLCAvLyBNZWRpdW0gcXVhbGl0eSBmb3IgZmFsbGJhY2tcbiAgICAgICAgICAgICAgICByYXdSZXNwb25zZTogcmF3VGV4dC5zdWJzdHJpbmcoMCwgMTAwMCksXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbdjJdIOKchSBBbmFseXNpcyBjb21wbGV0ZSAocXVhbGl0eTogJHthbmFseXNpcy5xdWFsaXR5U2NvcmV9JSlgKTtcbiAgICAgICAgICAgIHJldHVybiBhbmFseXNpcztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBmb3IgZXJyb3JzXG4gICAgICAgIGNvbnN0IGVycm9yVGV4dCA9IGF3YWl0IHBhZ2UuZXZhbHVhdGUoKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5ib2R5LmlubmVyVGV4dDtcbiAgICAgICAgICBpZiAoYm9keS5pbmNsdWRlcygnSW50ZXJuYWwgZXJyb3InKSB8fCBib2R5LmluY2x1ZGVzKCdTb21ldGhpbmcgd2VudCB3cm9uZycpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2Vycm9yJztcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChlcnJvclRleHQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FJIFN0dWRpbyByZXR1cm5lZCBhbiBlcnJvcicpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcbiAgICAgIGNvbnNvbGUubG9nKCdbdjJdIOKaoO+4jyBBbmFseXNpcyB0aW1lb3V0Jyk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbdjJdIEFuYWx5c2lzIGVycm9yOicsIGUpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgfSBjYXRjaCAoeCkge31cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlUXVhbGl0eVNjb3JlKHBhcnNlZDogYW55KTogbnVtYmVyIHtcbiAgICBsZXQgc2NvcmUgPSAwO1xuICAgIGlmIChwYXJzZWQuc3VtbWFyeSAmJiBwYXJzZWQuc3VtbWFyeS5sZW5ndGggPiA1MCkge1xuICAgICAgc2NvcmUgKz0gMjU7XG4gICAgfVxuICAgIGlmIChwYXJzZWQua2V5UG9pbnRzICYmIHBhcnNlZC5rZXlQb2ludHMubGVuZ3RoID49IDMpIHtcbiAgICAgIHNjb3JlICs9IDI1O1xuICAgIH1cbiAgICBpZiAocGFyc2VkLmFpQ29uY2VwdHMgJiYgcGFyc2VkLmFpQ29uY2VwdHMubGVuZ3RoID4gMCkge1xuICAgICAgc2NvcmUgKz0gMjU7XG4gICAgfVxuICAgIGlmIChwYXJzZWQudGVjaG5pY2FsRGV0YWlscyAmJiBwYXJzZWQudGVjaG5pY2FsRGV0YWlscy5sZW5ndGggPiAwKSB7XG4gICAgICBzY29yZSArPSAyNTtcbiAgICB9XG4gICAgcmV0dXJuIHNjb3JlO1xuICB9XG5cbiAgcHJpdmF0ZSBleHRyYWN0QnVsbGV0UG9pbnRzKHRleHQ6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBsaW5lcyA9IHRleHQuc3BsaXQoJ1xcbicpO1xuICAgIHJldHVybiBsaW5lc1xuICAgICAgLmZpbHRlcihcbiAgICAgICAgKGxpbmUpID0+XG4gICAgICAgICAgbGluZS50cmltKCkuc3RhcnRzV2l0aCgnLScpIHx8IGxpbmUudHJpbSgpLnN0YXJ0c1dpdGgoJ+KAoicpIHx8IGxpbmUudHJpbSgpLm1hdGNoKC9eXFxkK1xcLi8pXG4gICAgICApXG4gICAgICAubWFwKChsaW5lKSA9PiBsaW5lLnJlcGxhY2UoL15bLeKAolxcZC5dK1xccyovLCAnJykudHJpbSgpKVxuICAgICAgLmZpbHRlcigobGluZSkgPT4gbGluZS5sZW5ndGggPiAxMClcbiAgICAgIC5zbGljZSgwLCAxMCk7XG4gIH1cblxuICBwcml2YXRlIGV4dHJhY3RBSUNvbmNlcHRzKHRleHQ6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBhaVRlcm1zID0gW1xuICAgICAgJ21hY2hpbmUgbGVhcm5pbmcnLFxuICAgICAgJ25ldXJhbCBuZXR3b3JrJyxcbiAgICAgICdkZWVwIGxlYXJuaW5nJyxcbiAgICAgICd0cmFuc2Zvcm1lcicsXG4gICAgICAnR1BUJyxcbiAgICAgICdMTE0nLFxuICAgICAgJ2xhcmdlIGxhbmd1YWdlIG1vZGVsJyxcbiAgICAgICdBSSBhZ2VudCcsXG4gICAgICAnZW1iZWRkaW5nJyxcbiAgICAgICdmaW5lLXR1bmluZycsXG4gICAgICAnUkFHJyxcbiAgICAgICd2ZWN0b3IgZGF0YWJhc2UnLFxuICAgICAgJ3Byb21wdCBlbmdpbmVlcmluZycsXG4gICAgICAnZGlmZnVzaW9uJyxcbiAgICAgICdzdGFibGUgZGlmZnVzaW9uJyxcbiAgICAgICdEQUxMLUUnLFxuICAgICAgJ0NsYXVkZScsXG4gICAgICAnR2VtaW5pJyxcbiAgICAgICdPcGVuQUknLFxuICAgICAgJ0FudGhyb3BpYycsXG4gICAgICAnTGFuZ0NoYWluJyxcbiAgICAgICdBdXRvR1BUJyxcbiAgICAgICdpbmZlcmVuY2UnLFxuICAgICAgJ3RyYWluaW5nJyxcbiAgICAgICdtb2RlbCcsXG4gICAgXTtcblxuICAgIGNvbnN0IGZvdW5kOiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IGxvd2VyVGV4dCA9IHRleHQudG9Mb3dlckNhc2UoKTtcblxuICAgIGZvciAoY29uc3QgdGVybSBvZiBhaVRlcm1zKSB7XG4gICAgICBpZiAobG93ZXJUZXh0LmluY2x1ZGVzKHRlcm0udG9Mb3dlckNhc2UoKSkgJiYgIWZvdW5kLmluY2x1ZGVzKHRlcm0pKSB7XG4gICAgICAgIGZvdW5kLnB1c2godGVybSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZvdW5kO1xuICB9XG5cbiAgc2F2ZVJlcG9ydCh2aWRlbzogVmlkZW9FbnRyeSk6IHN0cmluZyB7XG4gICAgY29uc3Qgc2FmZVRpdGxlID0gdmlkZW8udGl0bGUucmVwbGFjZSgvW15hLXpBLVowLTldL2csICdfJykuc3Vic3RyaW5nKDAsIDUwKTtcbiAgICBjb25zdCByZXBvcnRGaWxlID0gcGF0aC5qb2luKFxuICAgICAgdGhpcy5yZXBvcnRzRGlyLFxuICAgICAgYHYyXyR7dmlkZW8uaW5kZXh9XyR7c2FmZVRpdGxlfV8ke0RhdGUubm93KCl9Lm1kYFxuICAgICk7XG5cbiAgICBsZXQgY29udGVudCA9IGAjIFZpZGVvIEFuYWx5c2lzIFJlcG9ydFxcblxcbiMjIE1ldGFkYXRhXFxuLSAqKlZpZGVvKio6ICR7dmlkZW8udGl0bGV9XFxuLSAqKkluZGV4Kio6ICMke3ZpZGVvLmluZGV4fVxcbi0gKipVUkwqKjogJHt2aWRlby51cmx9XFxuLSAqKkR1cmF0aW9uKio6ICR7dmlkZW8ubWV0YWRhdGE/LmR1cmF0aW9uRm9ybWF0dGVkIHx8ICdVbmtub3duJ31cXG4tICoqQ2hhbm5lbCoqOiAke3ZpZGVvLm1ldGFkYXRhPy5jaGFubmVsIHx8ICdVbmtub3duJ31cXG4tICoqVmlld3MqKjogJHt2aWRlby5tZXRhZGF0YT8udmlld0NvdW50IHx8ICdVbmtub3duJ31cXG4tICoqUHVibGlzaGVkKio6ICR7dmlkZW8ubWV0YWRhdGE/LnB1Ymxpc2hEYXRlIHx8ICdVbmtub3duJ31cXG4tICoqUHJvY2Vzc2VkKio6ICR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpfVxcbi0gKipRdWFsaXR5IFNjb3JlKio6ICR7dmlkZW8uYW5hbHlzaXM/LnF1YWxpdHlTY29yZSB8fCAwfSVcXG5cXG4tLS1cXG5cXG4jIyBTdW1tYXJ5XFxuJHt2aWRlby5hbmFseXNpcz8uc3VtbWFyeSB8fCB2aWRlby5tZXRhZGF0YT8uc3VtbWFyeSB8fCAnTm8gc3VtbWFyeSBhdmFpbGFibGUnfVxcblxcbiMjIEtleSBQb2ludHNcXG4keyh2aWRlby5hbmFseXNpcz8ua2V5UG9pbnRzIHx8IFtdKS5tYXAoKHApID0+IGAtICR7cH1gKS5qb2luKCdcXG4nKSB8fCAnLSBObyBrZXkgcG9pbnRzIGV4dHJhY3RlZCd9XFxuXFxuIyMgQUkgJiBUZWNobmljYWwgQ29uY2VwdHNcXG4keyh2aWRlby5hbmFseXNpcz8uYWlDb25jZXB0cyB8fCBbXSkubWFwKChjKSA9PiBgLSAke2N9YCkuam9pbignXFxuJykgfHwgJy0gTm9uZSBpZGVudGlmaWVkJ31cXG5cXG4jIyBUZWNobmljYWwgRGV0YWlsc1xcbiR7KHZpZGVvLmFuYWx5c2lzPy50ZWNobmljYWxEZXRhaWxzIHx8IFtdKS5tYXAoKGQpID0+IGAtICR7ZH1gKS5qb2luKCdcXG4nKSB8fCAnLSBOb25lIGlkZW50aWZpZWQnfVxcbmA7XG5cbiAgICBpZiAodmlkZW8uYW5hbHlzaXM/LnZpc3VhbENvbnRleHRGbGFncyAmJiB2aWRlby5hbmFseXNpcy52aXN1YWxDb250ZXh0RmxhZ3MubGVuZ3RoID4gMCkge1xuICAgICAgY29udGVudCArPSBgXFxuIyMg4pqg77iPIFNlY3Rpb25zIE5lZWRpbmcgVmlzdWFsIFJldmlld1xcbiR7dmlkZW8uYW5hbHlzaXMudmlzdWFsQ29udGV4dEZsYWdzXG4gICAgICAgIC5tYXAoKGYpID0+IGAtICoqJHt0aGlzLmZvcm1hdER1cmF0aW9uKGYudGltZXN0YW1wKX0qKjogJHtmLnJlYXNvbn0gLSAke2YuY29udGV4dH1gKVxuICAgICAgICAuam9pbignXFxuJyl9XFxuYDtcbiAgICB9XG5cbiAgICBmcy53cml0ZUZpbGVTeW5jKHJlcG9ydEZpbGUsIGNvbnRlbnQpO1xuXG4gICAgaWYgKHZpZGVvLnRyYW5zY3JpcHQgJiYgdmlkZW8udHJhbnNjcmlwdC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB0cmFuc2NyaXB0RmlsZSA9IHBhdGguam9pbih0aGlzLnRyYW5zY3JpcHRzRGlyLCBgJHt2aWRlby5pbmRleH1fJHtzYWZlVGl0bGV9LnR4dGApO1xuICAgICAgY29uc3QgdHJhbnNjcmlwdENvbnRlbnQgPSB2aWRlby50cmFuc2NyaXB0XG4gICAgICAgIC5tYXAoKHMpID0+IGBbJHt0aGlzLmZvcm1hdER1cmF0aW9uKHMuc3RhcnQpfV0gJHtzLnRleHR9YClcbiAgICAgICAgLmpvaW4oJ1xcbicpO1xuICAgICAgZnMud3JpdGVGaWxlU3luYyh0cmFuc2NyaXB0RmlsZSwgdHJhbnNjcmlwdENvbnRlbnQpO1xuICAgIH1cblxuICAgIHRoaXMuYXBwZW5kVG9Lbm93bGVkZ2VCYXNlKHZpZGVvKTtcblxuICAgIHJldHVybiByZXBvcnRGaWxlO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBlbmRUb0tub3dsZWRnZUJhc2UodmlkZW86IFZpZGVvRW50cnkpOiB2b2lkIHtcbiAgICBjb25zdCBlbnRyeSA9IGBcXG4tLS1cXG5cXG4jIyAjJHt2aWRlby5pbmRleH06ICR7dmlkZW8udGl0bGV9XFxuKipVUkwqKjogJHt2aWRlby51cmx9XFxuKipEdXJhdGlvbioqOiAke3ZpZGVvLm1ldGFkYXRhPy5kdXJhdGlvbkZvcm1hdHRlZCB8fCAnVW5rbm93bid9XFxuXFxuIyMjIFN1bW1hcnlcXG4ke3ZpZGVvLmFuYWx5c2lzPy5zdW1tYXJ5IHx8ICdObyBzdW1tYXJ5J31cXG5cXG4jIyMgS2V5IEluc2lnaHRzXFxuJHtcbiAgICAgICh2aWRlby5hbmFseXNpcz8ua2V5UG9pbnRzIHx8IFtdKVxuICAgICAgICAuc2xpY2UoMCwgNSlcbiAgICAgICAgLm1hcCgocCkgPT4gYC0gJHtwfWApXG4gICAgICAgIC5qb2luKCdcXG4nKSB8fCAnLSBOb25lJ1xuICAgIH1cXG5cXG4jIyMgQUkgQ29uY2VwdHMgQ292ZXJlZFxcbiR7KHZpZGVvLmFuYWx5c2lzPy5haUNvbmNlcHRzIHx8IFtdKS5qb2luKCcsICcpIHx8ICdOb25lJ31cXG5cXG5gO1xuXG4gICAgZnMuYXBwZW5kRmlsZVN5bmModGhpcy5rbm93bGVkZ2VCYXNlRmlsZSwgZW50cnkpO1xuICB9XG5cbiAgYXN5bmMgcHJvY2Vzc1ZpZGVvKHZpZGVvOiBWaWRlb0VudHJ5KTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHZpZGVvLnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcgfHwgdmlkZW8uc3RhdHVzID09PSAnc2tpcHBlZCcpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbdjJdIOKPre+4jyBTa2lwcGluZyAjJHt2aWRlby5pbmRleH0gKCR7dmlkZW8uc3RhdHVzfSlgKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmICh2aWRlby5wcm9jZXNzaW5nQXR0ZW1wdHMgPj0gMykge1xuICAgICAgY29uc29sZS5sb2coYFt2Ml0g4o+t77iPIFNraXBwaW5nICMke3ZpZGVvLmluZGV4fSAobWF4IGF0dGVtcHRzIHJlYWNoZWQpYCk7XG4gICAgICB2aWRlby5zdGF0dXMgPSAnc2tpcHBlZCc7XG4gICAgICB0aGlzLnN0YXRlLnN0YXRzLnNraXBwZWQrKztcbiAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coYFxcbiR7J+KVkCcucmVwZWF0KDcwKX1gKTtcbiAgICBjb25zb2xlLmxvZyhgVmlkZW8gIyR7dmlkZW8uaW5kZXh9OiAke3ZpZGVvLnRpdGxlfWApO1xuICAgIGNvbnNvbGUubG9nKGBBdHRlbXB0OiAke3ZpZGVvLnByb2Nlc3NpbmdBdHRlbXB0cyArIDF9LzNgKTtcbiAgICBjb25zb2xlLmxvZyhgJHsn4pWQJy5yZXBlYXQoNzApfVxcbmApO1xuXG4gICAgdmlkZW8ucHJvY2Vzc2luZ0F0dGVtcHRzKys7XG4gICAgdmlkZW8ubGFzdFByb2Nlc3NlZCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGlmICghdmlkZW8ubWV0YWRhdGEpIHtcbiAgICAgICAgdmlkZW8uc3RhdHVzID0gJ21ldGFkYXRhJztcbiAgICAgICAgdmlkZW8ubWV0YWRhdGEgPSAoYXdhaXQgdGhpcy5mZXRjaEVucmljaGVkTWV0YWRhdGEodmlkZW8pKSB8fCB1bmRlZmluZWQ7XG4gICAgICAgIGlmICh2aWRlby5tZXRhZGF0YSkge1xuICAgICAgICAgIHRoaXMuc3RhdGUuc3RhdHMubWV0YWRhdGFDb21wbGV0ZSsrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy50YXJnZXRQaGFzZSA9PT0gJ21ldGFkYXRhJykgcmV0dXJuIHRydWU7XG5cbiAgICAgIGlmICghdmlkZW8udHJhbnNjcmlwdCkge1xuICAgICAgICB2aWRlby5zdGF0dXMgPSAndHJhbnNjcmlwdCc7XG4gICAgICAgIHZpZGVvLnRyYW5zY3JpcHQgPSAoYXdhaXQgdGhpcy5leHRyYWN0VHJhbnNjcmlwdERpcmVjdCh2aWRlbykpIHx8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHZpZGVvLnRyYW5zY3JpcHQpIHtcbiAgICAgICAgICB0aGlzLnN0YXRlLnN0YXRzLnRyYW5zY3JpcHRzRXh0cmFjdGVkKys7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnRhcmdldFBoYXNlID09PSAndHJhbnNjcmlwdCcpIHJldHVybiB0cnVlO1xuXG4gICAgICBpZiAodmlkZW8udHJhbnNjcmlwdCAmJiAhdmlkZW8uYW5hbHlzaXMpIHtcbiAgICAgICAgdmlkZW8uc3RhdHVzID0gJ2FuYWx5emVkJztcbiAgICAgICAgdmlkZW8uYW5hbHlzaXMgPSAoYXdhaXQgdGhpcy5hbmFseXplV2l0aEFJKHZpZGVvKSkgfHwgdW5kZWZpbmVkO1xuICAgICAgICBpZiAodmlkZW8uYW5hbHlzaXMpIHtcbiAgICAgICAgICB0aGlzLnN0YXRlLnN0YXRzLmFuYWx5emVkKys7XG4gICAgICAgICAgaWYgKHZpZGVvLmFuYWx5c2lzLnZpc3VhbENvbnRleHRGbGFncy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLnN0YXRzLm5lZWRzVmlzdWFsUmV2aWV3Kys7XG4gICAgICAgICAgICB2aWRlby5zdGF0dXMgPSAnbmVlZHNfdmlzdWFsJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHZpZGVvLmFuYWx5c2lzKSB7XG4gICAgICAgIGNvbnN0IHJlcG9ydFBhdGggPSB0aGlzLnNhdmVSZXBvcnQodmlkZW8pO1xuICAgICAgICBjb25zb2xlLmxvZyhgW3YyXSDinIUgUmVwb3J0OiAke3BhdGguYmFzZW5hbWUocmVwb3J0UGF0aCl9YCk7XG4gICAgICAgIHZpZGVvLnN0YXR1cyA9ICdjb21wbGV0ZWQnO1xuICAgICAgICB0aGlzLnN0YXRlLnN0YXRzLmNvbXBsZXRlZCsrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmlkZW8uc3RhdHVzID0gJ2Vycm9yJztcbiAgICAgICAgdmlkZW8uZXJyb3IgPSAnQW5hbHlzaXMgZmFpbGVkJztcbiAgICAgICAgdGhpcy5zdGF0ZS5zdGF0cy5lcnJvcnMrKztcbiAgICAgIH1cblxuICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgIHRoaXMucHJpbnRQcm9ncmVzcygpO1xuICAgICAgcmV0dXJuIHZpZGVvLnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCc7XG4gICAgfSBjYXRjaCAoZTogdW5rbm93bikge1xuICAgICAgY29uc29sZS5lcnJvcihgW3YyXSBFcnJvciBwcm9jZXNzaW5nICMke3ZpZGVvLmluZGV4fTpgLCBlKTtcbiAgICAgIHZpZGVvLmVycm9yID0gKGUgYXMgRXJyb3IpLm1lc3NhZ2U7XG4gICAgICB2aWRlby5zdGF0dXMgPSAnZXJyb3InO1xuICAgICAgdGhpcy5zdGF0ZS5zdGF0cy5lcnJvcnMrKztcbiAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwcmludFByb2dyZXNzKCk6IHZvaWQge1xuICAgIGNvbnN0IHMgPSB0aGlzLnN0YXRlLnN0YXRzO1xuICAgIGNvbnNvbGUubG9nKGBcXG7wn5OKIFByb2dyZXNzOiAke3MuY29tcGxldGVkfS8ke3MudG90YWxWaWRlb3N9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIENvbXBsZXRlZDogJHtzLmNvbXBsZXRlZH0gfCBBbmFseXplZDogJHtzLmFuYWx5emVkfSB8IEVycm9yczogJHtzLmVycm9yc31gKTtcbiAgICBjb25zb2xlLmxvZyhgICAgU3VjY2VzcyBSYXRlOiAke3MuYW5hbHlzaXNTdWNjZXNzUmF0ZS50b0ZpeGVkKDEpfSVcXG5gKTtcbiAgfVxuXG4gIGFzeW5jIHJ1bihsaWJyYXJ5UGF0aDogc3RyaW5nLCBzdGFydEluZGV4OiBudW1iZXIgPSA2MzMsIGVuZEluZGV4OiBudW1iZXIgPSAxKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coYPCfmoAgVHJhbnNjcmlwdCBQcm9jZXNzb3IgdjIgLSBPcHRpbWl6ZWQgRWRpdGlvbmApO1xuICAgIGNvbnNvbGUubG9nKGBMaWJyYXJ5OiAke2xpYnJhcnlQYXRofWApO1xuICAgIGNvbnNvbGUubG9nKGBSYW5nZTogIyR7c3RhcnRJbmRleH0g4oaSICMke2VuZEluZGV4fWApO1xuICAgIGNvbnNvbGUubG9nKGBNb2RlbDogJHtHRU1JTklfTU9ERUx9YCk7XG5cbiAgICBhd2FpdCB0aGlzLmluaXRpYWxpemUoKTtcblxuICAgIC8vIExvYWQgbGlicmFyeVxuICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMobGlicmFyeVBhdGgsICd1dGYtOCcpO1xuICAgIGNvbnN0IHZpZGVvczogVmlkZW9FbnRyeVtdID0gW107XG4gICAgY29uc3Qgcm93UmVnZXggPVxuICAgICAgLzx0cj5cXHMqPHRkW14+XSo+XFxzKihcXGQrKVxccyo8XFwvdGQ+XFxzKjx0ZFtePl0qPlxccyo8YVxccytocmVmPVwiKFteXCJdKylcIltePl0qPihbXjxdKyk8XFwvYT5cXHMqPFxcL3RkPi9nO1xuICAgIGxldCBtYXRjaDtcblxuICAgIHdoaWxlICgobWF0Y2ggPSByb3dSZWdleC5leGVjKGNvbnRlbnQpKSAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgaW5kZXggPSBwYXJzZUludChtYXRjaFsxXSk7XG4gICAgICBpZiAoaW5kZXggPD0gc3RhcnRJbmRleCAmJiBpbmRleCA+PSBlbmRJbmRleCkge1xuICAgICAgICAvLyBDaGVjayBpZiBhbHJlYWR5IGluIHF1ZXVlXG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5zdGF0ZS5xdWV1ZS5maW5kKCh2KSA9PiB2LmluZGV4ID09PSBpbmRleCk7XG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgIHZpZGVvcy5wdXNoKGV4aXN0aW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2aWRlb3MucHVzaCh7XG4gICAgICAgICAgICBpbmRleCxcbiAgICAgICAgICAgIHVybDogbWF0Y2hbMl0sXG4gICAgICAgICAgICB0aXRsZTogbWF0Y2hbM10udHJpbSgpLFxuICAgICAgICAgICAgdmlkZW9JZDogdGhpcy5leHRyYWN0VmlkZW9JZChtYXRjaFsyXSkgfHwgJycsXG4gICAgICAgICAgICBzdGF0dXM6ICdwZW5kaW5nJyxcbiAgICAgICAgICAgIHByb2Nlc3NpbmdBdHRlbXB0czogMCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFNvcnQgZGVzY2VuZGluZ1xuICAgIHZpZGVvcy5zb3J0KChhLCBiKSA9PiBiLmluZGV4IC0gYS5pbmRleCk7XG5cbiAgICAvLyBVcGRhdGUgc3RhdGUgcXVldWUgcmVzcGVjdGluZyBleGlzdGluZyBlbnRyaWVzXG4gICAgdGhpcy5zdGF0ZS5xdWV1ZSA9IHZpZGVvcztcbiAgICB0aGlzLnN0YXRlLnN0YXRzLnRvdGFsVmlkZW9zID0gdmlkZW9zLmxlbmd0aDtcbiAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuXG4gICAgY29uc29sZS5sb2coYFt2Ml0gUHJvY2Vzc2luZyAke3ZpZGVvcy5sZW5ndGh9IHZpZGVvcy4uLmApO1xuXG4gICAgZm9yIChjb25zdCB2aWRlbyBvZiB2aWRlb3MpIHtcbiAgICAgIHRoaXMuc3RhdGUuY3VycmVudEluZGV4ID0gdmlkZW8uaW5kZXg7XG4gICAgICBhd2FpdCB0aGlzLnByb2Nlc3NWaWRlbyh2aWRlbyk7XG4gICAgICAvLyBTbWFsbCBjb29sZG93blxuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHIpID0+IHNldFRpbWVvdXQociwgMjAwMCkpO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCdbdjJdIPCfjokgQWxsIGRvbmUhJyk7XG4gICAgaWYgKHRoaXMuY29udGV4dCkge1xuICAgICAgYXdhaXQgdGhpcy5jb250ZXh0LmNsb3NlKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVuaXZlcnNhbCBGYWxsYmFjazogRG93bmxvYWQgdHJhbnNjcmlwdCB1c2luZyB5dC1kbHBcbiAgICovXG4gIHByaXZhdGUgZG93bmxvYWRUcmFuc2NyaXB0V2l0aFl0RGxwKHVybDogc3RyaW5nLCB2aWRlb0lkOiBzdHJpbmcpOiBUcmFuc2NyaXB0U2VnbWVudFtdIHwgbnVsbCB7XG4gICAgY29uc3QgdGVtcERpciA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUodGhpcy5yZXBvcnRzRGlyKSwgJ3RlbXBfc3VicycpO1xuXG4gICAgLy8gRW5zdXJlIHRlbXAgZGlyIGV4aXN0c1xuICAgIGlmICghZnMuZXhpc3RzU3luYyh0ZW1wRGlyKSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgZnMubWtkaXJTeW5jKHRlbXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgfSBjYXRjaCAoZSkge31cbiAgICB9XG5cbiAgICBjb25zdCBvdXRwdXRGaWxlQmFzZSA9IHBhdGguam9pbih0ZW1wRGlyLCB2aWRlb0lkKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zb2xlLmxvZyhgW3YyXSBSdW5uaW5nIHl0LWRscCBmb3IgJHt2aWRlb0lkfS4uLmApO1xuXG4gICAgICAvLyBDbGVhbiB1cCBwcmV2aW91cyBwb3RlbnRpYWwgZmlsZXNcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gZnMucmVhZGRpclN5bmModGVtcERpcikuZmlsdGVyKChmKSA9PiBmLnN0YXJ0c1dpdGgodmlkZW9JZCkpO1xuICAgICAgICBleGlzdGluZy5mb3JFYWNoKChmKSA9PiBmcy51bmxpbmtTeW5jKHBhdGguam9pbih0ZW1wRGlyLCBmKSkpO1xuICAgICAgfSBjYXRjaCAoZSkge31cblxuICAgICAgLy8gQ29tbWFuZCB0byBnZXQgVlRUXG4gICAgICBjb25zdCBjb21tYW5kID0gYHl0LWRscCAtLXdyaXRlLWF1dG8tc3ViIC0td3JpdGUtc3ViIC0tc3ViLWxhbmcgZW4gLS1za2lwLWRvd25sb2FkIC0tb3V0cHV0IFwiJHtvdXRwdXRGaWxlQmFzZX1cIiBcIiR7dXJsfVwiYDtcbiAgICAgIGV4ZWNTeW5jKGNvbW1hbmQsIHsgc3RkaW86ICdpZ25vcmUnIH0pO1xuXG4gICAgICAvLyBGaW5kIHRoZSBnZW5lcmF0ZWQgZmlsZSAoLmVuLnZ0dCBvciBzaW1pbGFyKVxuICAgICAgY29uc3QgZmlsZXMgPSBmcy5yZWFkZGlyU3luYyh0ZW1wRGlyKTtcbiAgICAgIGNvbnN0IHN1YkZpbGUgPSBmaWxlcy5maW5kKChmKSA9PiBmLnN0YXJ0c1dpdGgodmlkZW9JZCkgJiYgZi5lbmRzV2l0aCgnLnZ0dCcpKTtcblxuICAgICAgaWYgKCFzdWJGaWxlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbdjJdIE5vIC52dHQgZmlsZSBjcmVhdGVkIGJ5IHl0LWRscCcpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgLy8gUGFyc2UgVlRUXG4gICAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbih0ZW1wRGlyLCBzdWJGaWxlKSwgJ3V0Zi04Jyk7XG4gICAgICBjb25zdCBzZWdtZW50czogVHJhbnNjcmlwdFNlZ21lbnRbXSA9IFtdO1xuICAgICAgY29uc3QgYmxvY2tzID0gY29udGVudC5zcGxpdCgvXFxuXFxyP1xcbi8pO1xuXG4gICAgICBmb3IgKGNvbnN0IGJsb2NrIG9mIGJsb2Nrcykge1xuICAgICAgICBjb25zdCB0aW1lTWF0Y2ggPSBibG9jay5tYXRjaChcbiAgICAgICAgICAvKFxcZHsyfSk6KFxcZHsyfSk6KFxcZHsyfSlcXC4oXFxkezN9KVxccy0tPlxccyhcXGR7Mn0pOihcXGR7Mn0pOihcXGR7Mn0pXFwuKFxcZHszfSkvXG4gICAgICAgICk7XG4gICAgICAgIGlmICh0aW1lTWF0Y2gpIHtcbiAgICAgICAgICBjb25zdCBsaW5lcyA9IGJsb2NrLnNwbGl0KCdcXG4nKTtcbiAgICAgICAgICBjb25zdCB0aW1lTGluZUluZGV4ID0gbGluZXMuZmluZEluZGV4KChsKSA9PiBsLmluY2x1ZGVzKCctLT4nKSk7XG4gICAgICAgICAgaWYgKHRpbWVMaW5lSW5kZXggIT09IC0xICYmIHRpbWVMaW5lSW5kZXggPCBsaW5lcy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICBsZXQgdGV4dCA9IGxpbmVzXG4gICAgICAgICAgICAgIC5zbGljZSh0aW1lTGluZUluZGV4ICsgMSlcbiAgICAgICAgICAgICAgLmpvaW4oJyAnKVxuICAgICAgICAgICAgICAucmVwbGFjZSgvPFtePl0qPi9nLCAnJylcbiAgICAgICAgICAgICAgLnRyaW0oKTtcbiAgICAgICAgICAgIGlmICh0ZXh0ICYmIHRleHQgIT09ICdhbGlnbjpzdGFydCBwb3NpdGlvbjowJScpIHtcbiAgICAgICAgICAgICAgdGV4dCA9IHRleHRcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvJmFtcDsvZywgJyYnKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8mcXVvdDsvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvJiMzOTsvZywgXCInXCIpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoLyZsdDsvZywgJzwnKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8mZ3Q7L2csICc+Jyk7XG5cbiAgICAgICAgICAgICAgY29uc3Qgc3RhcnRTZWMgPVxuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFsxXSkgKiAzNjAwICtcbiAgICAgICAgICAgICAgICBwYXJzZUludCh0aW1lTWF0Y2hbMl0pICogNjAgK1xuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFszXSkgK1xuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFs0XSkgLyAxMDAwO1xuXG4gICAgICAgICAgICAgIGNvbnN0IGVuZFNlYyA9XG4gICAgICAgICAgICAgICAgcGFyc2VJbnQodGltZU1hdGNoWzVdKSAqIDM2MDAgK1xuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRpbWVNYXRjaFs2XSkgKiA2MCArXG4gICAgICAgICAgICAgICAgcGFyc2VJbnQodGltZU1hdGNoWzddKSArXG4gICAgICAgICAgICAgICAgcGFyc2VJbnQodGltZU1hdGNoWzhdKSAvIDEwMDA7XG5cbiAgICAgICAgICAgICAgc2VnbWVudHMucHVzaCh7XG4gICAgICAgICAgICAgICAgc3RhcnQ6IHN0YXJ0U2VjLFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiBlbmRTZWMgLSBzdGFydFNlYyxcbiAgICAgICAgICAgICAgICB0ZXh0OiB0ZXh0LFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQ2xlYW51cFxuICAgICAgdHJ5IHtcbiAgICAgICAgZnMudW5saW5rU3luYyhwYXRoLmpvaW4odGVtcERpciwgc3ViRmlsZSkpO1xuICAgICAgfSBjYXRjaCAoZSkge31cblxuICAgICAgaWYgKHNlZ21lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIHNlZ21lbnRzO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1t2Ml0geXQtZGxwIGV4ZWN1dGlvbiBlcnJvcjonLCBlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBtYWluKCkge1xuICBjb25zdCBhcmdzID0gcHJvY2Vzcy5hcmd2LnNsaWNlKDIpO1xuICBjb25zdCBzdGFydEFyZyA9IGFyZ3MuZmluZCgoYSkgPT4gYS5zdGFydHNXaXRoKCctLXN0YXJ0PScpKTtcbiAgY29uc3QgZW5kQXJnID0gYXJncy5maW5kKChhKSA9PiBhLnN0YXJ0c1dpdGgoJy0tZW5kPScpKTtcbiAgY29uc3QgcGhhc2VBcmcgPSBhcmdzLmZpbmQoKGEpID0+IGEuc3RhcnRzV2l0aCgnLS1waGFzZT0nKSk7XG5cbiAgY29uc3Qgc3RhcnQgPSBzdGFydEFyZyA/IHBhcnNlSW50KHN0YXJ0QXJnLnNwbGl0KCc9JylbMV0pIDogNjMzO1xuICBjb25zdCBlbmQgPSBlbmRBcmcgPyBwYXJzZUludChlbmRBcmcuc3BsaXQoJz0nKVsxXSkgOiAxO1xuICBjb25zdCBwaGFzZSA9IChwaGFzZUFyZyA/IHBoYXNlQXJnLnNwbGl0KCc9JylbMV0gOiAnYW5hbHlzaXMnKSBhc1xuICAgIHwgJ21ldGFkYXRhJ1xuICAgIHwgJ3RyYW5zY3JpcHQnXG4gICAgfCAnYW5hbHlzaXMnO1xuXG4gIGNvbnN0IGxpYnJhcnlQYXRoID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICcuLicsICcuLicsICdhaV92aWRlb19saWJyYXJ5Lmh0bWwnKTtcblxuICBjb25zdCBwcm9jZXNzb3IgPSBuZXcgVHJhbnNjcmlwdFByb2Nlc3NvclYyKHBoYXNlKTtcbiAgYXdhaXQgcHJvY2Vzc29yLnJ1bihsaWJyYXJ5UGF0aCwgc3RhcnQsIGVuZCk7XG59XG5cbm1haW4oKS5jYXRjaChjb25zb2xlLmVycm9yKTtcbiJdfQ==
