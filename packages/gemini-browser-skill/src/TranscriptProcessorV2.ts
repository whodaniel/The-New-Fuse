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

import { chromium, type BrowserContext, type Page } from 'playwright';

interface VideoEntry {
  index: number;
  url: string;
  title: string;
  videoId: string;
  metadata?: VideoMetadata;
  transcript?: TranscriptSegment[];
  analysis?: AnalysisResult;
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
  summary?: string; // AI-generated summary from Google
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
  private context: BrowserContext | null = null;
  private state: ProcessingState;
  private stateFilePath: string;
  private reportsDir: string;
  private transcriptsDir: string;
  private knowledgeBaseFile: string;
  private targetPhase: 'metadata' | 'transcript' | 'analysis' = 'analysis';

  constructor(targetPhase: 'metadata' | 'transcript' | 'analysis' = 'analysis') {
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

  private loadState(): ProcessingState {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        const state = JSON.parse(fs.readFileSync(this.stateFilePath, 'utf-8'));
        // Migrate old state if needed
        if (state.version !== '2.0') {
          console.log('[v2] Migrating state to v2 format...');
          state.version = '2.0';
          state.queue = state.queue.map((v: any) => ({
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

  private saveState(): void {
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

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  decodeHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/');
  }

  async initialize(): Promise<void> {
    // Use the SAME profile as the original processor where user is already logged in
    const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome');

    console.log('[v2] 🚀 Launching Chrome (using existing login session)...');
    fs.mkdirSync(profileDir, { recursive: true });

    this.context = await chromium.launchPersistentContext(profileDir, {
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
  private async humanDelay(min: number, max: number, page: Page) {
    const delay = Math.floor(Math.random() * (max - min) + min);
    await page.waitForTimeout(delay);
  }

  // Helper for human-like mouse movement
  private async humanMove(page: Page, selector: string) {
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

  private async solveGoogleCaptcha(page: Page) {
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

  async fetchEnrichedMetadata(video: VideoEntry): Promise<VideoMetadata | null> {
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
      let channel: string | undefined;
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
      let publishDate: string | undefined;
      for (const pattern of datePatterns) {
        const match = pageText.match(pattern);
        if (match) {
          publishDate = match[1];
          break;
        }
      }

      const descMatch = pageText.match(/(?:description|about)[:\s]*([^.]+\.[^.]+\.)/i);
      const summaryMatch = pageText.match(/(?:summary|overview|this video)[:\s]*([^.]+\.[^.]+\.)/i);

      const metadata: VideoMetadata = {
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

  async extractTranscriptDirect(video: VideoEntry): Promise<TranscriptSegment[] | null> {
    if (!this.context) {
      throw new Error('Browser not initialized');
    }

    console.log(`[v2] 📝 Transcript extraction: ${video.videoId}`);

    const page = await this.context.newPage();

    try {
      await page.goto(video.url, { waitUntil: 'load', timeout: 45000 });
      await page.waitForTimeout(3000);

      const captionData = await page.evaluate(() => {
        const win = window as any;
        if (win.ytInitialPlayerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks) {
          const tracks =
            win.ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer.captionTracks;
          const track = tracks.find((t: any) => t.languageCode === 'en') || tracks[0];
          return track?.baseUrl || null;
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
                  const track = tracks.find((t: any) => t.languageCode === 'en') || tracks[0];
                  return track?.baseUrl || null;
                }
              } catch (e) {}
            }
          }
        }
        return null;
      });

      if (captionData) {
        console.log(`[v2] Found caption URL, fetching transcript...`);

        const captionPage = await this.context!.newPage();
        await captionPage.goto(captionData, { waitUntil: 'load', timeout: 30000 });
        const xml = await captionPage.content();
        await captionPage.close();

        const segments: TranscriptSegment[] = [];
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
        const result: Array<{ start: number; duration: number; text: string }> = [];
        const segments = document.querySelectorAll('ytd-transcript-segment-renderer');
        segments.forEach((seg: Element) => {
          const timeEl = seg.querySelector('.segment-timestamp');
          const textEl = seg.querySelector('.segment-text');
          if (timeEl && textEl) {
            const time = timeEl.textContent?.trim() || '0:00';
            const text = textEl.textContent?.trim() || '';
            const parts = time.split(':').map((p: string) => parseInt(p) || 0);
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
  async analyzeWithAI(video: VideoEntry): Promise<AnalysisResult | null> {
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

            let analysis: AnalysisResult | null = null;

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

  private calculateQualityScore(parsed: any): number {
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

  private extractBulletPoints(text: string): string[] {
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

  private extractAIConcepts(text: string): string[] {
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

    const found: string[] = [];
    const lowerText = text.toLowerCase();

    for (const term of aiTerms) {
      if (lowerText.includes(term.toLowerCase()) && !found.includes(term)) {
        found.push(term);
      }
    }

    return found;
  }

  saveReport(video: VideoEntry): string {
    const safeTitle = video.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const reportFile = path.join(
      this.reportsDir,
      `v2_${video.index}_${safeTitle}_${Date.now()}.md`
    );

    let content = `# Video Analysis Report\n\n## Metadata\n- **Video**: ${video.title}\n- **Index**: #${video.index}\n- **URL**: ${video.url}\n- **Duration**: ${video.metadata?.durationFormatted || 'Unknown'}\n- **Channel**: ${video.metadata?.channel || 'Unknown'}\n- **Views**: ${video.metadata?.viewCount || 'Unknown'}\n- **Published**: ${video.metadata?.publishDate || 'Unknown'}\n- **Processed**: ${new Date().toISOString()}\n- **Quality Score**: ${video.analysis?.qualityScore || 0}%\n\n---\n\n## Summary\n${video.analysis?.summary || video.metadata?.summary || 'No summary available'}\n\n## Key Points\n${(video.analysis?.keyPoints || []).map((p) => `- ${p}`).join('\n') || '- No key points extracted'}\n\n## AI & Technical Concepts\n${(video.analysis?.aiConcepts || []).map((c) => `- ${c}`).join('\n') || '- None identified'}\n\n## Technical Details\n${(video.analysis?.technicalDetails || []).map((d) => `- ${d}`).join('\n') || '- None identified'}\n`;

    if (video.analysis?.visualContextFlags && video.analysis.visualContextFlags.length > 0) {
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

  private appendToKnowledgeBase(video: VideoEntry): void {
    const entry = `\n---\n\n## #${video.index}: ${video.title}\n**URL**: ${video.url}\n**Duration**: ${video.metadata?.durationFormatted || 'Unknown'}\n\n### Summary\n${video.analysis?.summary || 'No summary'}\n\n### Key Insights\n${
      (video.analysis?.keyPoints || [])
        .slice(0, 5)
        .map((p) => `- ${p}`)
        .join('\n') || '- None'
    }\n\n### AI Concepts Covered\n${(video.analysis?.aiConcepts || []).join(', ') || 'None'}\n\n`;

    fs.appendFileSync(this.knowledgeBaseFile, entry);
  }

  async processVideo(video: VideoEntry): Promise<boolean> {
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
    } catch (e: unknown) {
      console.error(`[v2] Error processing #${video.index}:`, e);
      video.error = (e as Error).message;
      video.status = 'error';
      this.state.stats.errors++;
      this.saveState();
      return false;
    }
  }

  private printProgress(): void {
    const s = this.state.stats;
    console.log(`\n📊 Progress: ${s.completed}/${s.totalVideos}`);
    console.log(`   Completed: ${s.completed} | Analyzed: ${s.analyzed} | Errors: ${s.errors}`);
    console.log(`   Success Rate: ${s.analysisSuccessRate.toFixed(1)}%\n`);
  }

  async run(libraryPath: string, startIndex: number = 633, endIndex: number = 1): Promise<void> {
    console.log(`🚀 Transcript Processor v2 - Optimized Edition`);
    console.log(`Library: ${libraryPath}`);
    console.log(`Range: #${startIndex} → #${endIndex}`);
    console.log(`Model: ${GEMINI_MODEL}`);

    await this.initialize();

    // Load library
    const content = fs.readFileSync(libraryPath, 'utf-8');
    const videos: VideoEntry[] = [];
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
  private downloadTranscriptWithYtDlp(url: string, videoId: string): TranscriptSegment[] | null {
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
      const segments: TranscriptSegment[] = [];
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
  const phase = (phaseArg ? phaseArg.split('=')[1] : 'analysis') as
    | 'metadata'
    | 'transcript'
    | 'analysis';

  const libraryPath = path.join(process.cwd(), '..', '..', 'ai_video_library.html');

  const processor = new TranscriptProcessorV2(phase);
  await processor.run(libraryPath, start, end);
}

main().catch(console.error);
