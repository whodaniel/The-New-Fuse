'use strict';
/**
 * Pro Visual Intelligence Processor
 *
 * Implements the "Pro" workflow for technical video ingestion:
 * 1. Initial Triage: Gemini 3 Flash (1 FPS scan) to map key events/timestamps.
 * 2. Deep Analysis: Gemini 3.1 Pro Preview (Thinking: High) for architectural deep-dives.
 * 3. AI Studio Integration: Leverages the native YouTube plugin for high-fidelity stream access.
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
const fs = __importStar(require('node:fs'));
const path = __importStar(require('node:path'));
const node_path_1 = require('node:path');
const process = __importStar(require('node:process'));
const playwright_1 = require('playwright');
// Resolved at runtime so this package works in any checkout.
const TNF_ROOT = process.env.TNF_ROOT || (0, node_path_1.resolve)(__dirname, '..', '..', '..');
const AI_STUDIO_URL = 'https://aistudio.google.com/app/prompts/new_chat';
const TRIAGE_MODEL = 'Gemini 3 Flash Preview';
const DEEP_MODEL = 'Gemini 3.1 Pro Preview';
class ProVisualProcessor {
  constructor() {
    this.context = null;
    const dataDir = TNF_ROOT + '/data';
    this.stateFilePath = path.join(dataDir, 'pro-ingestion-state.json');
    this.reportsDir = path.join(dataDir, 'pro-video-reports');
    fs.mkdirSync(this.reportsDir, { recursive: true });
    this.data = this.loadState();
  }
  loadState() {
    if (fs.existsSync(this.stateFilePath)) {
      return JSON.parse(fs.readFileSync(this.stateFilePath, 'utf8'));
    }
    return { queue: [], currentIndex: 0 };
  }
  saveState() {
    fs.writeFileSync(this.stateFilePath, JSON.stringify(this.data, null, 2));
  }
  async initialize() {
    const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-alt');
    const extensionPath = TNF_ROOT + '/apps/chrome-extension/aivi';
    console.log(`[Pro] Launching Authenticated Chrome with AIVI Extension: ${profileDir}`);
    this.context = await playwright_1.chromium.launchPersistentContext(profileDir, {
      headless: false,
      channel: 'chrome',
      viewport: { width: 1440, height: 900 },
      args: [
        '--no-first-run',
        '--no-default-browser-check',
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
  }
  async dismissDialogs(page) {
    const selectors = [
      'button:has-text("Got it")',
      'button:has-text("Continue")',
      '[aria-label="Close"]',
      'button:has-text("Dismiss")',
    ];
    for (const s of selectors) {
      try {
        const btn = page.locator(s).first();
        if (await btn.isVisible()) await btn.click();
      } catch (e) {}
    }
    await page.keyboard.press('Escape');
  }
  async selectModel(page, modelName) {
    console.log(`[Pro] Ensuring model: ${modelName}`);
    try {
      const modelBtn = page
        .locator(
          '.settings-item.settings-model-selector, button:has-text("Gemini"), button[aria-label*="model" i]'
        )
        .first();
      await modelBtn.waitFor({ state: 'visible', timeout: 15000 });
      const currentText = await modelBtn.innerText();
      if (currentText.includes(modelName)) {
        console.log(`[Pro] ✅ Model ${modelName} already selected.`);
        return;
      }
      await modelBtn.click();
      await page.waitForTimeout(1500);
      // Search for the model in the menu
      const options = page.locator(
        '[role="menuitem"], [role="option"], .mat-mdc-menu-item, mat-option'
      );
      const target = options.filter({ hasText: modelName }).first();
      if ((await target.count()) > 0) {
        await target.click();
        console.log(`[Pro] ✅ Switched to ${modelName}`);
      } else {
        // Broad search fallback
        const broadTarget = options.filter({ hasText: '3.1' }).filter({ hasText: 'Pro' }).first();
        if ((await broadTarget.count()) > 0) {
          await broadTarget.click();
          console.log('[Pro] ✅ Selected 3.1 Pro via broad match');
        } else {
          console.warn(`[Pro] ⚠️ Could not find exact model ${modelName}, keeping current.`);
          await page.keyboard.press('Escape');
        }
      }
      await page.waitForTimeout(1000);
    } catch (e) {
      console.error(`[Pro] ❌ Model selection failed: ${e.message}`);
    }
  }
  async insertYouTubeVideo(page, url) {
    console.log(`[Pro] Inserting YouTube Video: ${url}`);
    // 1. Find and click the Add Content (+) button (Phoenix Strategy)
    let addBtn = page
      .locator('[data-test-id="add-media-button"], [data-test="selectMediaMenu"]')
      .first();
    if (!(await addBtn.isVisible())) {
      addBtn = page.locator('button:has-text("add"), button[aria-label*="Add content" i]').first();
    }
    await addBtn.waitFor({ state: 'visible', timeout: 15000 });
    await addBtn.click();
    await page.waitForTimeout(2000);
    // 2. Find the YouTube option in the menu (Phoenix Strategy)
    const menuItems = page.locator('button, [role="menuitem"], .mat-mdc-menu-item, .mat-menu-item');
    const allItems = await menuItems.allInnerTexts();
    console.log(`[Pro] Menu items found: ${allItems.join(', ')}`);
    let ytBtn = menuItems.filter({ hasText: /YouTube Video/i }).first();
    if (!(await ytBtn.count())) {
      ytBtn = menuItems.filter({ hasText: /YouTube/i }).first();
    }
    if ((await ytBtn.count()) === 0) {
      console.error('[Pro] ❌ YouTube option not found in menu. Checking plugin state...');
      await page.screenshot({ path: '/tmp/pro_menu_error.jpg' });
      await page.keyboard.press('Escape');
      throw new Error('YOUTUBE_PLUGIN_MISSING');
    }
    await ytBtn.click();
    await page.waitForTimeout(3000);
    // 3. Find and fill the URL input in the dialog (Phoenix Strategy)
    const dialog = page.locator('mat-dialog-container, [role="dialog"]').first();
    await dialog.waitFor({ state: 'visible', timeout: 10000 });
    const inputs = dialog.locator('input');
    const inputCount = await inputs.count();
    let urlInput = null;
    for (let i = 0; i < inputCount; i++) {
      const ph = ((await inputs.nth(i).getAttribute('placeholder')) || '').toLowerCase();
      const type = ((await inputs.nth(i).getAttribute('type')) || '').toLowerCase();
      if (ph.includes('url') || ph.includes('link') || ph.includes('youtube') || type === 'url') {
        urlInput = inputs.nth(i);
        break;
      }
    }
    if (!urlInput) urlInput = inputs.first();
    if (urlInput) {
      await urlInput.click();
      await urlInput.fill(''); // Clear first
      await urlInput.type(url, { delay: 10 });
      await page.waitForTimeout(1000);
      await urlInput.press('Enter');
      console.log('[Pro] ⏳ Waiting for video preview to load in dialog...');
      // Wait for the "YouTube Video" generic header in dialog to potentially change or for a preview to appear
      await page.waitForTimeout(5000);
    }
    // 4. Click Save/Insert (wait for it to be enabled)
    const saveBtn = dialog
      .locator('button:has-text("Save"), button:has-text("Insert"), [data-test-id="save-button"]')
      .first();
    await saveBtn.waitFor({ state: 'visible', timeout: 5000 });
    // Ensure button is stable
    await page.waitForTimeout(2000);
    await saveBtn.click({ force: true });
    console.log('[Pro] Clicked Save. Waiting for dialog to close...');
    await dialog.waitFor({ state: 'hidden', timeout: 15000 });
    // 5. VERIFY ATTACHMENT
    console.log('[Pro] Verifying video attachment...');
    const videoChip = page
      .locator(
        'ms-file-chip, ms-media-chip, .video-chip, [data-test-id="media-chip"], .chip-content'
      )
      .first();
    try {
      await videoChip.waitFor({ state: 'visible', timeout: 25000 });
      console.log('[Pro] ✅ Video successfully attached to prompt.');
    } catch (e) {
      console.warn('[Pro] ⚠️ Could not verify video chip visibility.');
      await page.screenshot({ path: '/tmp/pro_attachment_error.jpg' });
    }
    console.log('[Pro] Waiting for video indexing (25s)...');
    await page.waitForTimeout(25000);
  }
  async setThinkingLevel(page, level) {
    var _a;
    console.log(`[Pro] Setting Thinking Level to: ${level}`);
    const toggle = page.locator('ms-thinking-level-setting mat-slide-toggle');
    if (
      !((_a = await toggle.getAttribute('class')) === null || _a === void 0
        ? void 0
        : _a.includes('mat-checked'))
    ) {
      await toggle.click();
      await page.waitForTimeout(500);
    }
    await page.locator('ms-thinking-level-setting mat-select').click();
    await page.waitForTimeout(500);
    await page.locator(`mat-option:has-text("${level}")`).click();
    await page.waitForTimeout(1000);
  }
  async ensurePaidProject(page) {
    console.log('[Pro] Ensuring active project: The New Fuse');
    try {
      const projectBtn = page
        .locator(
          '.paid-api-key-card, button[aria-label*="project" i], button:has-text("No API Key"), .project-selector-button'
        )
        .first();
      await projectBtn.waitFor({ state: 'visible', timeout: 15000 });
      await projectBtn.click();
      await page.waitForTimeout(2500);
      const projectSelect = page
        .locator('mat-select[aria-label*="project" i], .mat-mdc-select, [role="combobox"]')
        .first();
      await projectSelect.click();
      await page.waitForTimeout(2000);
      const fuseOption = page
        .locator('mat-option:has-text("The New Fuse"), .mat-mdc-option:has-text("The New Fuse")')
        .first();
      if ((await fuseOption.count()) > 0) {
        await fuseOption.click();
        console.log('[Pro] ✅ Selected "The New Fuse" project');
      } else {
        const firstOpt = page.locator('mat-option, .mat-mdc-option').first();
        if ((await firstOpt.count()) > 0) await firstOpt.click();
      }
      await page.waitForTimeout(1500);
      const confirmBtn = page
        .locator('button:has-text("Select key"), button:has-text("Confirm"), .select-key-button')
        .first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        console.log('[Pro] ✅ Project selection confirmed');
      }
      await page.waitForTimeout(3000);
    } catch (e) {
      console.warn(`[Pro] Project selection check failed: ${e.message}. (May already be set)`);
      await page.keyboard.press('Escape');
    }
  }
  async getAIResponse(page, prompt) {
    const textarea = page
      .locator('textarea[aria-label*="prompt"], div[contenteditable="true"]')
      .first();
    await textarea.waitFor({ state: 'visible', timeout: 30000 });
    await textarea.click();
    await textarea.fill(prompt);
    await page.waitForTimeout(500);
    const runBtn = page
      .locator(
        'button[aria-label*="Run" i], button:has-text("Run"), button[data-test-id="run-button"]'
      )
      .first();
    await runBtn.waitFor({ state: 'visible', timeout: 10000 });
    // Explicitly press Enter AND click Run to be sure
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    if ((await runBtn.isVisible()) && !(await runBtn.isDisabled())) {
      await runBtn.click({ force: true });
    }
    console.log('[Pro] Waiting for AI completion...');
    // Detect errors during wait
    const errorToast = page
      .locator(
        'mat-snack-bar-container, .error-message, :text("Permission denied"), :text("Failed to generate")'
      )
      .first();
    const startTime = Date.now();
    while (Date.now() - startTime < 360000) {
      // 6 min timeout
      if (await errorToast.isVisible()) {
        const errText = await errorToast.innerText();
        console.error(`[Pro] ❌ Detected Error: ${errText}`);
        // If it is a permission error, we should try to switch project or notify
        throw new Error(`AI_STUDIO_ERROR: ${errText}`);
      }
      const copyBtn = page.locator('button[aria-label*="Copy" i]').last();
      if (await copyBtn.isVisible()) break;
      await page.waitForTimeout(3000);
    }
    const responseContainer = page
      .locator('ms-chat-turn.model .turn-content, .chat-turn-container.model .turn-content')
      .last();
    return await responseContainer.innerText();
  }
  async processVideo(video) {
    if (video.status === 'completed') return;
    let retries = 2;
    while (retries >= 0) {
      const page = await this.context.newPage();
      try {
        await page.goto(AI_STUDIO_URL, { waitUntil: 'networkidle' });
        await this.dismissDialogs(page);
        await this.ensurePaidProject(page);
        // --- STAGE 1: TRIAGE (FLASH) ---
        console.log(`\n--- STAGE 1: Triage #${video.index} ---`);
        await this.selectModel(page, TRIAGE_MODEL);
        await this.insertYouTubeVideo(page, video.url);
        const triagePrompt = `You are a video technical analyst. Perform a visual scan of this entire video at approximately 1 FPS. Identify every timestamp where a new architectural diagram, code snippet, or major technical UI shift occurs. Format your response as a list of timestamps (HH:MM:SS) followed by a short description: [TS] - [Description]. Focus only on the most technically dense moments.`;
        const triageResponse = await this.getAIResponse(page, triagePrompt);
        console.log(`[Pro] Triage Results:\n${triageResponse}`);
        const tsMatches = triageResponse.match(/(\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2})/g);
        video.hotspots = (tsMatches || []).map((ts) => ({
          timestamp: ts,
          reason: 'Technical Hotspot',
        }));
        video.status = 'triaged';
        this.saveState();
        console.log(`[Pro] Triage Complete. Found ${video.hotspots.length} hotspots.`);
        // --- STAGE 2: DEEP ANALYSIS (PRO) ---
        console.log(`\n--- STAGE 2: Deep Analysis #${video.index} ---`);
        await this.selectModel(page, DEEP_MODEL);
        await this.setThinkingLevel(page, 'High');
        let comprehensiveAnalysis = `# Pro Technical Analysis: ${video.title}\n\n`;
        for (const hotspot of (video.hotspots || []).slice(0, 5)) {
          console.log(`[Pro] Deeply reasoning over hotspot: ${hotspot.timestamp}`);
          const deepPrompt = `Perform an extensive internal reasoning chain to analyze the visual information at exactly ${hotspot.timestamp}. Identify the architectural diagrams, components, or code snippets shown. Describe them with high technical fidelity.`;
          const deepResult = await this.getAIResponse(page, deepPrompt);
          comprehensiveAnalysis += `### Analysis @ ${hotspot.timestamp}\n${deepResult}\n\n`;
        }
        const reportPath = path.join(this.reportsDir, `pro_${video.index}_${video.videoId}.md`);
        fs.writeFileSync(reportPath, comprehensiveAnalysis);
        console.log(`[Pro] ✅ Final Report Saved: ${reportPath}`);
        video.status = 'completed';
        this.saveState();
        await page.close();
        break;
      } catch (e) {
        console.error(`[Pro] ❌ Attempt failed: ${e.message}`);
        retries--;
        await page.close();
        if (retries >= 0) {
          console.log(`[Pro] 🔄 Retrying in 10s... (${retries} left)`);
          await new Promise((r) => setTimeout(r, 10000));
        }
      }
    }
  }
  async run(startIndex, endIndex) {
    var _a;
    await this.initialize();
    const libraryPath = process.env.TNF_VIDEO_LIBRARY || '';
    const content = fs.readFileSync(libraryPath, 'utf-8');
    const queue = [];
    const rowRegex =
      /<tr>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>\s*<\/td>/g;
    let match;
    while ((match = rowRegex.exec(content)) !== null) {
      const index = parseInt(match[1]);
      if (index <= startIndex && index >= endIndex) {
        const url = match[2];
        const videoId =
          ((_a = url.match(/v=([^&]+)/)) === null || _a === void 0 ? void 0 : _a[1]) ||
          url.split('/').pop() ||
          '';
        queue.push({
          index,
          url,
          title: match[3].trim(),
          videoId,
          status: 'pending',
        });
      }
    }
    queue.sort((a, b) => b.index - a.index);
    this.data.queue = queue;
    this.saveState();
    for (const video of queue) {
      console.log(`\n🚀 Starting Pro Processing for #${video.index}: ${video.title}`);
      await this.processVideo(video);
    }
    if (this.context) await this.context.close();
  }
}
// CLI Entrypoint
if (require.main === module) {
  const processor = new ProVisualProcessor();
  const start = parseInt(process.argv[2]) || 692;
  const end = parseInt(process.argv[3]) || 648;
  processor.run(start, end).catch(console.error);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJvVmlzdWFsUHJvY2Vzc29yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiUHJvVmlzdWFsUHJvY2Vzc29yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7OztHQU9HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILDRDQUE4QjtBQUM5QixnREFBa0M7QUFDbEMseUNBQW9DO0FBQ3BDLHNEQUF3QztBQUN4QywyQ0FBb0Y7QUFDcEYsNkRBQTZEO0FBQzdELE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxJQUFJLElBQUEsbUJBQU8sRUFBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztBQVk5RSxNQUFNLGFBQWEsR0FBRyxrREFBa0QsQ0FBQztBQUN6RSxNQUFNLFlBQVksR0FBRyx3QkFBd0IsQ0FBQztBQUM5QyxNQUFNLFVBQVUsR0FBRyx3QkFBd0IsQ0FBQztBQUU1QyxNQUFNLGtCQUFrQjtJQU10QjtRQUxRLFlBQU8sR0FBMEIsSUFBSSxDQUFDO1FBTTVDLE1BQU0sT0FBTyxHQUFHLFFBQVEsR0FBRyxPQUFPLENBQUM7UUFDbkMsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO1FBQ3BFLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztRQUUxRCxFQUFFLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNuRCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBRU8sU0FBUztRQUNmLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVB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QUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQ2hGLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBRUQsSUFBSSxJQUFJLENBQUMsT0FBTztZQUFFLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUMvQyxDQUFDO0NBQ0Y7QUFFRCxpQkFBaUI7QUFDakIsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRSxDQUFDO0lBQzVCLE1BQU0sU0FBUyxHQUFHLElBQUksa0JBQWtCLEVBQUUsQ0FBQztJQUMzQyxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQztJQUMvQyxNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQztJQUM3QyxTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2pELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFBybyBWaXN1YWwgSW50ZWxsaWdlbmNlIFByb2Nlc3NvclxuICpcbiAqIEltcGxlbWVudHMgdGhlIFwiUHJvXCIgd29ya2Zsb3cgZm9yIHRlY2huaWNhbCB2aWRlbyBpbmdlc3Rpb246XG4gKiAxLiBJbml0aWFsIFRyaWFnZTogR2VtaW5pIDMgRmxhc2ggKDEgRlBTIHNjYW4pIHRvIG1hcCBrZXkgZXZlbnRzL3RpbWVzdGFtcHMuXG4gKiAyLiBEZWVwIEFuYWx5c2lzOiBHZW1pbmkgMy4xIFBybyBQcmV2aWV3IChUaGlua2luZzogSGlnaCkgZm9yIGFyY2hpdGVjdHVyYWwgZGVlcC1kaXZlcy5cbiAqIDMuIEFJIFN0dWRpbyBJbnRlZ3JhdGlvbjogTGV2ZXJhZ2VzIHRoZSBuYXRpdmUgWW91VHViZSBwbHVnaW4gZm9yIGhpZ2gtZmlkZWxpdHkgc3RyZWFtIGFjY2Vzcy5cbiAqL1xuXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdub2RlOmZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0ICogYXMgcHJvY2VzcyBmcm9tICdub2RlOnByb2Nlc3MnO1xuaW1wb3J0IHsgY2hyb21pdW0sIHR5cGUgQnJvd3NlckNvbnRleHQsIHR5cGUgTG9jYXRvciwgdHlwZSBQYWdlIH0gZnJvbSAncGxheXdyaWdodCc7XG4vLyBSZXNvbHZlZCBhdCBydW50aW1lIHNvIHRoaXMgcGFja2FnZSB3b3JrcyBpbiBhbnkgY2hlY2tvdXQuXG5jb25zdCBUTkZfUk9PVCA9IHByb2Nlc3MuZW52LlRORl9ST09UIHx8IHJlc29sdmUoX19kaXJuYW1lLCAnLi4nLCAnLi4nLCAnLi4nKTtcblxuaW50ZXJmYWNlIFZpZGVvRW50cnkge1xuICBpbmRleDogbnVtYmVyO1xuICB1cmw6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgdmlkZW9JZDogc3RyaW5nO1xuICBzdGF0dXM6ICdwZW5kaW5nJyB8ICd0cmlhZ2VkJyB8ICdjb21wbGV0ZWQnIHwgJ2Vycm9yJztcbiAgaG90c3BvdHM/OiB7IHRpbWVzdGFtcDogc3RyaW5nOyByZWFzb246IHN0cmluZyB9W107XG4gIGFuYWx5c2lzPzogc3RyaW5nO1xufVxuXG5jb25zdCBBSV9TVFVESU9fVVJMID0gJ2h0dHBzOi8vYWlzdHVkaW8uZ29vZ2xlLmNvbS9hcHAvcHJvbXB0cy9uZXdfY2hhdCc7XG5jb25zdCBUUklBR0VfTU9ERUwgPSAnR2VtaW5pIDMgRmxhc2ggUHJldmlldyc7XG5jb25zdCBERUVQX01PREVMID0gJ0dlbWluaSAzLjEgUHJvIFByZXZpZXcnO1xuXG5jbGFzcyBQcm9WaXN1YWxQcm9jZXNzb3Ige1xuICBwcml2YXRlIGNvbnRleHQ6IEJyb3dzZXJDb250ZXh0IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc3RhdGVGaWxlUGF0aDogc3RyaW5nO1xuICBwcml2YXRlIHJlcG9ydHNEaXI6IHN0cmluZztcbiAgcHJpdmF0ZSBkYXRhOiBhbnk7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgY29uc3QgZGF0YURpciA9IFRORl9ST09UICsgJy9kYXRhJztcbiAgICB0aGlzLnN0YXRlRmlsZVBhdGggPSBwYXRoLmpvaW4oZGF0YURpciwgJ3Byby1pbmdlc3Rpb24tc3RhdGUuanNvbicpO1xuICAgIHRoaXMucmVwb3J0c0RpciA9IHBhdGguam9pbihkYXRhRGlyLCAncHJvLXZpZGVvLXJlcG9ydHMnKTtcblxuICAgIGZzLm1rZGlyU3luYyh0aGlzLnJlcG9ydHNEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIHRoaXMuZGF0YSA9IHRoaXMubG9hZFN0YXRlKCk7XG4gIH1cblxuICBwcml2YXRlIGxvYWRTdGF0ZSgpIHtcbiAgICBpZiAoZnMuZXhpc3RzU3luYyh0aGlzLnN0YXRlRmlsZVBhdGgpKSB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmModGhpcy5zdGF0ZUZpbGVQYXRoLCAndXRmOCcpKTtcbiAgICB9XG4gICAgcmV0dXJuIHsgcXVldWU6IFtdLCBjdXJyZW50SW5kZXg6IDAgfTtcbiAgfVxuXG4gIHByaXZhdGUgc2F2ZVN0YXRlKCkge1xuICAgIGZzLndyaXRlRmlsZVN5bmModGhpcy5zdGF0ZUZpbGVQYXRoLCBKU09OLnN0cmluZ2lmeSh0aGlzLmRhdGEsIG51bGwsIDIpKTtcbiAgfVxuXG4gIGFzeW5jIGluaXRpYWxpemUoKSB7XG4gICAgY29uc3QgcHJvZmlsZURpciA9IHBhdGguam9pbihwcm9jZXNzLmVudi5IT01FIHx8ICcvdG1wJywgJy52aWRlby1wcm9jZXNzb3ItY2hyb21lLWFsdCcpO1xuICAgIGNvbnN0IGV4dGVuc2lvblBhdGggPSBUTkZfUk9PVCArICcvYXBwcy9jaHJvbWUtZXh0ZW5zaW9uL2FpdmknO1xuXG4gICAgY29uc29sZS5sb2coYFtQcm9dIExhdW5jaGluZyBBdXRoZW50aWNhdGVkIENocm9tZSB3aXRoIEFJVkkgRXh0ZW5zaW9uOiAke3Byb2ZpbGVEaXJ9YCk7XG5cbiAgICB0aGlzLmNvbnRleHQgPSBhd2FpdCBjaHJvbWl1bS5sYXVuY2hQZXJzaXN0ZW50Q29udGV4dChwcm9maWxlRGlyLCB7XG4gICAgICBoZWFkbGVzczogZmFsc2UsXG4gICAgICBjaGFubmVsOiAnY2hyb21lJyxcbiAgICAgIHZpZXdwb3J0OiB7IHdpZHRoOiAxNDQwLCBoZWlnaHQ6IDkwMCB9LFxuICAgICAgYXJnczogW1xuICAgICAgICAnLS1uby1maXJzdC1ydW4nLFxuICAgICAgICAnLS1uby1kZWZhdWx0LWJyb3dzZXItY2hlY2snLFxuICAgICAgICBgLS1kaXNhYmxlLWV4dGVuc2lvbnMtZXhjZXB0PSR7ZXh0ZW5zaW9uUGF0aH1gLFxuICAgICAgICBgLS1sb2FkLWV4dGVuc2lvbj0ke2V4dGVuc2lvblBhdGh9YCxcbiAgICAgIF0sXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGRpc21pc3NEaWFsb2dzKHBhZ2U6IFBhZ2UpIHtcbiAgICBjb25zdCBzZWxlY3RvcnMgPSBbXG4gICAgICAnYnV0dG9uOmhhcy10ZXh0KFwiR290IGl0XCIpJyxcbiAgICAgICdidXR0b246aGFzLXRleHQoXCJDb250aW51ZVwiKScsXG4gICAgICAnW2FyaWEtbGFiZWw9XCJDbG9zZVwiXScsXG4gICAgICAnYnV0dG9uOmhhcy10ZXh0KFwiRGlzbWlzc1wiKScsXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IHMgb2Ygc2VsZWN0b3JzKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBidG4gPSBwYWdlLmxvY2F0b3IocykuZmlyc3QoKTtcbiAgICAgICAgaWYgKGF3YWl0IGJ0bi5pc1Zpc2libGUoKSkgYXdhaXQgYnRuLmNsaWNrKCk7XG4gICAgICB9IGNhdGNoIChlKSB7fVxuICAgIH1cbiAgICBhd2FpdCBwYWdlLmtleWJvYXJkLnByZXNzKCdFc2NhcGUnKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2VsZWN0TW9kZWwocGFnZTogUGFnZSwgbW9kZWxOYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zb2xlLmxvZyhgW1Byb10gRW5zdXJpbmcgbW9kZWw6ICR7bW9kZWxOYW1lfWApO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1vZGVsQnRuID0gcGFnZVxuICAgICAgICAubG9jYXRvcihcbiAgICAgICAgICAnLnNldHRpbmdzLWl0ZW0uc2V0dGluZ3MtbW9kZWwtc2VsZWN0b3IsIGJ1dHRvbjpoYXMtdGV4dChcIkdlbWluaVwiKSwgYnV0dG9uW2FyaWEtbGFiZWwqPVwibW9kZWxcIiBpXSdcbiAgICAgICAgKVxuICAgICAgICAuZmlyc3QoKTtcbiAgICAgIGF3YWl0IG1vZGVsQnRuLndhaXRGb3IoeyBzdGF0ZTogJ3Zpc2libGUnLCB0aW1lb3V0OiAxNTAwMCB9KTtcblxuICAgICAgY29uc3QgY3VycmVudFRleHQgPSBhd2FpdCBtb2RlbEJ0bi5pbm5lclRleHQoKTtcbiAgICAgIGlmIChjdXJyZW50VGV4dC5pbmNsdWRlcyhtb2RlbE5hbWUpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbUHJvXSDinIUgTW9kZWwgJHttb2RlbE5hbWV9IGFscmVhZHkgc2VsZWN0ZWQuYCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgYXdhaXQgbW9kZWxCdG4uY2xpY2soKTtcbiAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMTUwMCk7XG5cbiAgICAgIC8vIFNlYXJjaCBmb3IgdGhlIG1vZGVsIGluIHRoZSBtZW51XG4gICAgICBjb25zdCBvcHRpb25zID0gcGFnZS5sb2NhdG9yKFxuICAgICAgICAnW3JvbGU9XCJtZW51aXRlbVwiXSwgW3JvbGU9XCJvcHRpb25cIl0sIC5tYXQtbWRjLW1lbnUtaXRlbSwgbWF0LW9wdGlvbidcbiAgICAgICk7XG4gICAgICBjb25zdCB0YXJnZXQgPSBvcHRpb25zLmZpbHRlcih7IGhhc1RleHQ6IG1vZGVsTmFtZSB9KS5maXJzdCgpO1xuXG4gICAgICBpZiAoKGF3YWl0IHRhcmdldC5jb3VudCgpKSA+IDApIHtcbiAgICAgICAgYXdhaXQgdGFyZ2V0LmNsaWNrKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbUHJvXSDinIUgU3dpdGNoZWQgdG8gJHttb2RlbE5hbWV9YCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBCcm9hZCBzZWFyY2ggZmFsbGJhY2tcbiAgICAgICAgY29uc3QgYnJvYWRUYXJnZXQgPSBvcHRpb25zLmZpbHRlcih7IGhhc1RleHQ6ICczLjEnIH0pLmZpbHRlcih7IGhhc1RleHQ6ICdQcm8nIH0pLmZpcnN0KCk7XG4gICAgICAgIGlmICgoYXdhaXQgYnJvYWRUYXJnZXQuY291bnQoKSkgPiAwKSB7XG4gICAgICAgICAgYXdhaXQgYnJvYWRUYXJnZXQuY2xpY2soKTtcbiAgICAgICAgICBjb25zb2xlLmxvZygnW1Byb10g4pyFIFNlbGVjdGVkIDMuMSBQcm8gdmlhIGJyb2FkIG1hdGNoJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKGBbUHJvXSDimqDvuI8gQ291bGQgbm90IGZpbmQgZXhhY3QgbW9kZWwgJHttb2RlbE5hbWV9LCBrZWVwaW5nIGN1cnJlbnQuYCk7XG4gICAgICAgICAgYXdhaXQgcGFnZS5rZXlib2FyZC5wcmVzcygnRXNjYXBlJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMTAwMCk7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBbUHJvXSDinYwgTW9kZWwgc2VsZWN0aW9uIGZhaWxlZDogJHtlLm1lc3NhZ2V9YCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBpbnNlcnRZb3VUdWJlVmlkZW8ocGFnZTogUGFnZSwgdXJsOiBzdHJpbmcpIHtcbiAgICBjb25zb2xlLmxvZyhgW1Byb10gSW5zZXJ0aW5nIFlvdVR1YmUgVmlkZW86ICR7dXJsfWApO1xuXG4gICAgLy8gMS4gRmluZCBhbmQgY2xpY2sgdGhlIEFkZCBDb250ZW50ICgrKSBidXR0b24gKFBob2VuaXggU3RyYXRlZ3kpXG4gICAgbGV0IGFkZEJ0biA9IHBhZ2VcbiAgICAgIC5sb2NhdG9yKCdbZGF0YS10ZXN0LWlkPVwiYWRkLW1lZGlhLWJ1dHRvblwiXSwgW2RhdGEtdGVzdD1cInNlbGVjdE1lZGlhTWVudVwiXScpXG4gICAgICAuZmlyc3QoKTtcbiAgICBpZiAoIShhd2FpdCBhZGRCdG4uaXNWaXNpYmxlKCkpKSB7XG4gICAgICBhZGRCdG4gPSBwYWdlLmxvY2F0b3IoJ2J1dHRvbjpoYXMtdGV4dChcImFkZFwiKSwgYnV0dG9uW2FyaWEtbGFiZWwqPVwiQWRkIGNvbnRlbnRcIiBpXScpLmZpcnN0KCk7XG4gICAgfVxuICAgIGF3YWl0IGFkZEJ0bi53YWl0Rm9yKHsgc3RhdGU6ICd2aXNpYmxlJywgdGltZW91dDogMTUwMDAgfSk7XG4gICAgYXdhaXQgYWRkQnRuLmNsaWNrKCk7XG4gICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgyMDAwKTtcblxuICAgIC8vIDIuIEZpbmQgdGhlIFlvdVR1YmUgb3B0aW9uIGluIHRoZSBtZW51IChQaG9lbml4IFN0cmF0ZWd5KVxuICAgIGNvbnN0IG1lbnVJdGVtcyA9IHBhZ2UubG9jYXRvcignYnV0dG9uLCBbcm9sZT1cIm1lbnVpdGVtXCJdLCAubWF0LW1kYy1tZW51LWl0ZW0sIC5tYXQtbWVudS1pdGVtJyk7XG4gICAgY29uc3QgYWxsSXRlbXMgPSBhd2FpdCBtZW51SXRlbXMuYWxsSW5uZXJUZXh0cygpO1xuICAgIGNvbnNvbGUubG9nKGBbUHJvXSBNZW51IGl0ZW1zIGZvdW5kOiAke2FsbEl0ZW1zLmpvaW4oJywgJyl9YCk7XG5cbiAgICBsZXQgeXRCdG4gPSBtZW51SXRlbXMuZmlsdGVyKHsgaGFzVGV4dDogL1lvdVR1YmUgVmlkZW8vaSB9KS5maXJzdCgpO1xuICAgIGlmICghKGF3YWl0IHl0QnRuLmNvdW50KCkpKSB7XG4gICAgICB5dEJ0biA9IG1lbnVJdGVtcy5maWx0ZXIoeyBoYXNUZXh0OiAvWW91VHViZS9pIH0pLmZpcnN0KCk7XG4gICAgfVxuXG4gICAgaWYgKChhd2FpdCB5dEJ0bi5jb3VudCgpKSA9PT0gMCkge1xuICAgICAgY29uc29sZS5lcnJvcignW1Byb10g4p2MIFlvdVR1YmUgb3B0aW9uIG5vdCBmb3VuZCBpbiBtZW51LiBDaGVja2luZyBwbHVnaW4gc3RhdGUuLi4nKTtcbiAgICAgIGF3YWl0IHBhZ2Uuc2NyZWVuc2hvdCh7IHBhdGg6ICcvdG1wL3Byb19tZW51X2Vycm9yLmpwZycgfSk7XG4gICAgICBhd2FpdCBwYWdlLmtleWJvYXJkLnByZXNzKCdFc2NhcGUnKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignWU9VVFVCRV9QTFVHSU5fTUlTU0lORycpO1xuICAgIH1cblxuICAgIGF3YWl0IHl0QnRuLmNsaWNrKCk7XG4gICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgzMDAwKTtcblxuICAgIC8vIDMuIEZpbmQgYW5kIGZpbGwgdGhlIFVSTCBpbnB1dCBpbiB0aGUgZGlhbG9nIChQaG9lbml4IFN0cmF0ZWd5KVxuICAgIGNvbnN0IGRpYWxvZyA9IHBhZ2UubG9jYXRvcignbWF0LWRpYWxvZy1jb250YWluZXIsIFtyb2xlPVwiZGlhbG9nXCJdJykuZmlyc3QoKTtcbiAgICBhd2FpdCBkaWFsb2cud2FpdEZvcih7IHN0YXRlOiAndmlzaWJsZScsIHRpbWVvdXQ6IDEwMDAwIH0pO1xuXG4gICAgY29uc3QgaW5wdXRzID0gZGlhbG9nLmxvY2F0b3IoJ2lucHV0Jyk7XG4gICAgY29uc3QgaW5wdXRDb3VudCA9IGF3YWl0IGlucHV0cy5jb3VudCgpO1xuICAgIGxldCB1cmxJbnB1dDogTG9jYXRvciB8IG51bGwgPSBudWxsO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dENvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IHBoID0gKChhd2FpdCBpbnB1dHMubnRoKGkpLmdldEF0dHJpYnV0ZSgncGxhY2Vob2xkZXInKSkgfHwgJycpLnRvTG93ZXJDYXNlKCk7XG4gICAgICBjb25zdCB0eXBlID0gKChhd2FpdCBpbnB1dHMubnRoKGkpLmdldEF0dHJpYnV0ZSgndHlwZScpKSB8fCAnJykudG9Mb3dlckNhc2UoKTtcbiAgICAgIGlmIChwaC5pbmNsdWRlcygndXJsJykgfHwgcGguaW5jbHVkZXMoJ2xpbmsnKSB8fCBwaC5pbmNsdWRlcygneW91dHViZScpIHx8IHR5cGUgPT09ICd1cmwnKSB7XG4gICAgICAgIHVybElucHV0ID0gaW5wdXRzLm50aChpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCF1cmxJbnB1dCkgdXJsSW5wdXQgPSBpbnB1dHMuZmlyc3QoKTtcblxuICAgIGlmICh1cmxJbnB1dCkge1xuICAgICAgYXdhaXQgdXJsSW5wdXQuY2xpY2soKTtcbiAgICAgIGF3YWl0IHVybElucHV0LmZpbGwoJycpOyAvLyBDbGVhciBmaXJzdFxuICAgICAgYXdhaXQgdXJsSW5wdXQudHlwZSh1cmwsIHsgZGVsYXk6IDEwIH0pO1xuICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgxMDAwKTtcbiAgICAgIGF3YWl0IHVybElucHV0LnByZXNzKCdFbnRlcicpO1xuXG4gICAgICBjb25zb2xlLmxvZygnW1Byb10g4o+zIFdhaXRpbmcgZm9yIHZpZGVvIHByZXZpZXcgdG8gbG9hZCBpbiBkaWFsb2cuLi4nKTtcbiAgICAgIC8vIFdhaXQgZm9yIHRoZSBcIllvdVR1YmUgVmlkZW9cIiBnZW5lcmljIGhlYWRlciBpbiBkaWFsb2cgdG8gcG90ZW50aWFsbHkgY2hhbmdlIG9yIGZvciBhIHByZXZpZXcgdG8gYXBwZWFyXG4gICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDUwMDApO1xuICAgIH1cblxuICAgIC8vIDQuIENsaWNrIFNhdmUvSW5zZXJ0ICh3YWl0IGZvciBpdCB0byBiZSBlbmFibGVkKVxuICAgIGNvbnN0IHNhdmVCdG4gPSBkaWFsb2dcbiAgICAgIC5sb2NhdG9yKCdidXR0b246aGFzLXRleHQoXCJTYXZlXCIpLCBidXR0b246aGFzLXRleHQoXCJJbnNlcnRcIiksIFtkYXRhLXRlc3QtaWQ9XCJzYXZlLWJ1dHRvblwiXScpXG4gICAgICAuZmlyc3QoKTtcbiAgICBhd2FpdCBzYXZlQnRuLndhaXRGb3IoeyBzdGF0ZTogJ3Zpc2libGUnLCB0aW1lb3V0OiA1MDAwIH0pO1xuXG4gICAgLy8gRW5zdXJlIGJ1dHRvbiBpcyBzdGFibGVcbiAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDIwMDApO1xuXG4gICAgYXdhaXQgc2F2ZUJ0bi5jbGljayh7IGZvcmNlOiB0cnVlIH0pO1xuICAgIGNvbnNvbGUubG9nKCdbUHJvXSBDbGlja2VkIFNhdmUuIFdhaXRpbmcgZm9yIGRpYWxvZyB0byBjbG9zZS4uLicpO1xuXG4gICAgYXdhaXQgZGlhbG9nLndhaXRGb3IoeyBzdGF0ZTogJ2hpZGRlbicsIHRpbWVvdXQ6IDE1MDAwIH0pO1xuXG4gICAgLy8gNS4gVkVSSUZZIEFUVEFDSE1FTlRcbiAgICBjb25zb2xlLmxvZygnW1Byb10gVmVyaWZ5aW5nIHZpZGVvIGF0dGFjaG1lbnQuLi4nKTtcbiAgICBjb25zdCB2aWRlb0NoaXAgPSBwYWdlXG4gICAgICAubG9jYXRvcihcbiAgICAgICAgJ21zLWZpbGUtY2hpcCwgbXMtbWVkaWEtY2hpcCwgLnZpZGVvLWNoaXAsIFtkYXRhLXRlc3QtaWQ9XCJtZWRpYS1jaGlwXCJdLCAuY2hpcC1jb250ZW50J1xuICAgICAgKVxuICAgICAgLmZpcnN0KCk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHZpZGVvQ2hpcC53YWl0Rm9yKHsgc3RhdGU6ICd2aXNpYmxlJywgdGltZW91dDogMjUwMDAgfSk7XG4gICAgICBjb25zb2xlLmxvZygnW1Byb10g4pyFIFZpZGVvIHN1Y2Nlc3NmdWxseSBhdHRhY2hlZCB0byBwcm9tcHQuJyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS53YXJuKCdbUHJvXSDimqDvuI8gQ291bGQgbm90IHZlcmlmeSB2aWRlbyBjaGlwIHZpc2liaWxpdHkuJyk7XG4gICAgICBhd2FpdCBwYWdlLnNjcmVlbnNob3QoeyBwYXRoOiAnL3RtcC9wcm9fYXR0YWNobWVudF9lcnJvci5qcGcnIH0pO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCdbUHJvXSBXYWl0aW5nIGZvciB2aWRlbyBpbmRleGluZyAoMjVzKS4uLicpO1xuICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMjUwMDApO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzZXRUaGlua2luZ0xldmVsKHBhZ2U6IFBhZ2UsIGxldmVsOiAnTG93JyB8ICdNZWRpdW0nIHwgJ0hpZ2gnKSB7XG4gICAgY29uc29sZS5sb2coYFtQcm9dIFNldHRpbmcgVGhpbmtpbmcgTGV2ZWwgdG86ICR7bGV2ZWx9YCk7XG4gICAgY29uc3QgdG9nZ2xlID0gcGFnZS5sb2NhdG9yKCdtcy10aGlua2luZy1sZXZlbC1zZXR0aW5nIG1hdC1zbGlkZS10b2dnbGUnKTtcbiAgICBpZiAoIShhd2FpdCB0b2dnbGUuZ2V0QXR0cmlidXRlKCdjbGFzcycpKT8uaW5jbHVkZXMoJ21hdC1jaGVja2VkJykpIHtcbiAgICAgIGF3YWl0IHRvZ2dsZS5jbGljaygpO1xuICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCg1MDApO1xuICAgIH1cblxuICAgIGF3YWl0IHBhZ2UubG9jYXRvcignbXMtdGhpbmtpbmctbGV2ZWwtc2V0dGluZyBtYXQtc2VsZWN0JykuY2xpY2soKTtcbiAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDUwMCk7XG4gICAgYXdhaXQgcGFnZS5sb2NhdG9yKGBtYXQtb3B0aW9uOmhhcy10ZXh0KFwiJHtsZXZlbH1cIilgKS5jbGljaygpO1xuICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMTAwMCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGVuc3VyZVBhaWRQcm9qZWN0KHBhZ2U6IFBhZ2UpIHtcbiAgICBjb25zb2xlLmxvZygnW1Byb10gRW5zdXJpbmcgYWN0aXZlIHByb2plY3Q6IFRoZSBOZXcgRnVzZScpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwcm9qZWN0QnRuID0gcGFnZVxuICAgICAgICAubG9jYXRvcihcbiAgICAgICAgICAnLnBhaWQtYXBpLWtleS1jYXJkLCBidXR0b25bYXJpYS1sYWJlbCo9XCJwcm9qZWN0XCIgaV0sIGJ1dHRvbjpoYXMtdGV4dChcIk5vIEFQSSBLZXlcIiksIC5wcm9qZWN0LXNlbGVjdG9yLWJ1dHRvbidcbiAgICAgICAgKVxuICAgICAgICAuZmlyc3QoKTtcbiAgICAgIGF3YWl0IHByb2plY3RCdG4ud2FpdEZvcih7IHN0YXRlOiAndmlzaWJsZScsIHRpbWVvdXQ6IDE1MDAwIH0pO1xuICAgICAgYXdhaXQgcHJvamVjdEJ0bi5jbGljaygpO1xuICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgyNTAwKTtcblxuICAgICAgY29uc3QgcHJvamVjdFNlbGVjdCA9IHBhZ2VcbiAgICAgICAgLmxvY2F0b3IoJ21hdC1zZWxlY3RbYXJpYS1sYWJlbCo9XCJwcm9qZWN0XCIgaV0sIC5tYXQtbWRjLXNlbGVjdCwgW3JvbGU9XCJjb21ib2JveFwiXScpXG4gICAgICAgIC5maXJzdCgpO1xuICAgICAgYXdhaXQgcHJvamVjdFNlbGVjdC5jbGljaygpO1xuICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgyMDAwKTtcblxuICAgICAgY29uc3QgZnVzZU9wdGlvbiA9IHBhZ2VcbiAgICAgICAgLmxvY2F0b3IoJ21hdC1vcHRpb246aGFzLXRleHQoXCJUaGUgTmV3IEZ1c2VcIiksIC5tYXQtbWRjLW9wdGlvbjpoYXMtdGV4dChcIlRoZSBOZXcgRnVzZVwiKScpXG4gICAgICAgIC5maXJzdCgpO1xuICAgICAgaWYgKChhd2FpdCBmdXNlT3B0aW9uLmNvdW50KCkpID4gMCkge1xuICAgICAgICBhd2FpdCBmdXNlT3B0aW9uLmNsaWNrKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbUHJvXSDinIUgU2VsZWN0ZWQgXCJUaGUgTmV3IEZ1c2VcIiBwcm9qZWN0Jyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBmaXJzdE9wdCA9IHBhZ2UubG9jYXRvcignbWF0LW9wdGlvbiwgLm1hdC1tZGMtb3B0aW9uJykuZmlyc3QoKTtcbiAgICAgICAgaWYgKChhd2FpdCBmaXJzdE9wdC5jb3VudCgpKSA+IDApIGF3YWl0IGZpcnN0T3B0LmNsaWNrKCk7XG4gICAgICB9XG4gICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDE1MDApO1xuXG4gICAgICBjb25zdCBjb25maXJtQnRuID0gcGFnZVxuICAgICAgICAubG9jYXRvcignYnV0dG9uOmhhcy10ZXh0KFwiU2VsZWN0IGtleVwiKSwgYnV0dG9uOmhhcy10ZXh0KFwiQ29uZmlybVwiKSwgLnNlbGVjdC1rZXktYnV0dG9uJylcbiAgICAgICAgLmZpcnN0KCk7XG4gICAgICBpZiAoYXdhaXQgY29uZmlybUJ0bi5pc1Zpc2libGUoKSkge1xuICAgICAgICBhd2FpdCBjb25maXJtQnRuLmNsaWNrKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbUHJvXSDinIUgUHJvamVjdCBzZWxlY3Rpb24gY29uZmlybWVkJyk7XG4gICAgICB9XG4gICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDMwMDApO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgY29uc29sZS53YXJuKGBbUHJvXSBQcm9qZWN0IHNlbGVjdGlvbiBjaGVjayBmYWlsZWQ6ICR7ZS5tZXNzYWdlfS4gKE1heSBhbHJlYWR5IGJlIHNldClgKTtcbiAgICAgIGF3YWl0IHBhZ2Uua2V5Ym9hcmQucHJlc3MoJ0VzY2FwZScpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2V0QUlSZXNwb25zZShwYWdlOiBQYWdlLCBwcm9tcHQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgdGV4dGFyZWEgPSBwYWdlXG4gICAgICAubG9jYXRvcigndGV4dGFyZWFbYXJpYS1sYWJlbCo9XCJwcm9tcHRcIl0sIGRpdltjb250ZW50ZWRpdGFibGU9XCJ0cnVlXCJdJylcbiAgICAgIC5maXJzdCgpO1xuICAgIGF3YWl0IHRleHRhcmVhLndhaXRGb3IoeyBzdGF0ZTogJ3Zpc2libGUnLCB0aW1lb3V0OiAzMDAwMCB9KTtcbiAgICBhd2FpdCB0ZXh0YXJlYS5jbGljaygpO1xuICAgIGF3YWl0IHRleHRhcmVhLmZpbGwocHJvbXB0KTtcbiAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDUwMCk7XG5cbiAgICBjb25zdCBydW5CdG4gPSBwYWdlXG4gICAgICAubG9jYXRvcihcbiAgICAgICAgJ2J1dHRvblthcmlhLWxhYmVsKj1cIlJ1blwiIGldLCBidXR0b246aGFzLXRleHQoXCJSdW5cIiksIGJ1dHRvbltkYXRhLXRlc3QtaWQ9XCJydW4tYnV0dG9uXCJdJ1xuICAgICAgKVxuICAgICAgLmZpcnN0KCk7XG4gICAgYXdhaXQgcnVuQnRuLndhaXRGb3IoeyBzdGF0ZTogJ3Zpc2libGUnLCB0aW1lb3V0OiAxMDAwMCB9KTtcblxuICAgIC8vIEV4cGxpY2l0bHkgcHJlc3MgRW50ZXIgQU5EIGNsaWNrIFJ1biB0byBiZSBzdXJlXG4gICAgYXdhaXQgcGFnZS5rZXlib2FyZC5wcmVzcygnRW50ZXInKTtcbiAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDEwMDApO1xuXG4gICAgaWYgKChhd2FpdCBydW5CdG4uaXNWaXNpYmxlKCkpICYmICEoYXdhaXQgcnVuQnRuLmlzRGlzYWJsZWQoKSkpIHtcbiAgICAgIGF3YWl0IHJ1bkJ0bi5jbGljayh7IGZvcmNlOiB0cnVlIH0pO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCdbUHJvXSBXYWl0aW5nIGZvciBBSSBjb21wbGV0aW9uLi4uJyk7XG5cbiAgICAvLyBEZXRlY3QgZXJyb3JzIGR1cmluZyB3YWl0XG4gICAgY29uc3QgZXJyb3JUb2FzdCA9IHBhZ2VcbiAgICAgIC5sb2NhdG9yKFxuICAgICAgICAnbWF0LXNuYWNrLWJhci1jb250YWluZXIsIC5lcnJvci1tZXNzYWdlLCA6dGV4dChcIlBlcm1pc3Npb24gZGVuaWVkXCIpLCA6dGV4dChcIkZhaWxlZCB0byBnZW5lcmF0ZVwiKSdcbiAgICAgIClcbiAgICAgIC5maXJzdCgpO1xuXG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICB3aGlsZSAoRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSA8IDM2MDAwMCkge1xuICAgICAgLy8gNiBtaW4gdGltZW91dFxuICAgICAgaWYgKGF3YWl0IGVycm9yVG9hc3QuaXNWaXNpYmxlKCkpIHtcbiAgICAgICAgY29uc3QgZXJyVGV4dCA9IGF3YWl0IGVycm9yVG9hc3QuaW5uZXJUZXh0KCk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFtQcm9dIOKdjCBEZXRlY3RlZCBFcnJvcjogJHtlcnJUZXh0fWApO1xuICAgICAgICAvLyBJZiBpdCBpcyBhIHBlcm1pc3Npb24gZXJyb3IsIHdlIHNob3VsZCB0cnkgdG8gc3dpdGNoIHByb2plY3Qgb3Igbm90aWZ5XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQUlfU1RVRElPX0VSUk9SOiAke2VyclRleHR9YCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvcHlCdG4gPSBwYWdlLmxvY2F0b3IoJ2J1dHRvblthcmlhLWxhYmVsKj1cIkNvcHlcIiBpXScpLmxhc3QoKTtcbiAgICAgIGlmIChhd2FpdCBjb3B5QnRuLmlzVmlzaWJsZSgpKSBicmVhaztcblxuICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgzMDAwKTtcbiAgICB9XG5cbiAgICBjb25zdCByZXNwb25zZUNvbnRhaW5lciA9IHBhZ2VcbiAgICAgIC5sb2NhdG9yKCdtcy1jaGF0LXR1cm4ubW9kZWwgLnR1cm4tY29udGVudCwgLmNoYXQtdHVybi1jb250YWluZXIubW9kZWwgLnR1cm4tY29udGVudCcpXG4gICAgICAubGFzdCgpO1xuICAgIHJldHVybiBhd2FpdCByZXNwb25zZUNvbnRhaW5lci5pbm5lclRleHQoKTtcbiAgfVxuXG4gIGFzeW5jIHByb2Nlc3NWaWRlbyh2aWRlbzogVmlkZW9FbnRyeSkge1xuICAgIGlmICh2aWRlby5zdGF0dXMgPT09ICdjb21wbGV0ZWQnKSByZXR1cm47XG5cbiAgICBsZXQgcmV0cmllcyA9IDI7XG4gICAgd2hpbGUgKHJldHJpZXMgPj0gMCkge1xuICAgICAgY29uc3QgcGFnZSA9IGF3YWl0IHRoaXMuY29udGV4dCEubmV3UGFnZSgpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgcGFnZS5nb3RvKEFJX1NUVURJT19VUkwsIHsgd2FpdFVudGlsOiAnbmV0d29ya2lkbGUnIH0pO1xuICAgICAgICBhd2FpdCB0aGlzLmRpc21pc3NEaWFsb2dzKHBhZ2UpO1xuICAgICAgICBhd2FpdCB0aGlzLmVuc3VyZVBhaWRQcm9qZWN0KHBhZ2UpO1xuXG4gICAgICAgIC8vIC0tLSBTVEFHRSAxOiBUUklBR0UgKEZMQVNIKSAtLS1cbiAgICAgICAgY29uc29sZS5sb2coYFxcbi0tLSBTVEFHRSAxOiBUcmlhZ2UgIyR7dmlkZW8uaW5kZXh9IC0tLWApO1xuICAgICAgICBhd2FpdCB0aGlzLnNlbGVjdE1vZGVsKHBhZ2UsIFRSSUFHRV9NT0RFTCk7XG4gICAgICAgIGF3YWl0IHRoaXMuaW5zZXJ0WW91VHViZVZpZGVvKHBhZ2UsIHZpZGVvLnVybCk7XG5cbiAgICAgICAgY29uc3QgdHJpYWdlUHJvbXB0ID0gYFlvdSBhcmUgYSB2aWRlbyB0ZWNobmljYWwgYW5hbHlzdC4gUGVyZm9ybSBhIHZpc3VhbCBzY2FuIG9mIHRoaXMgZW50aXJlIHZpZGVvIGF0IGFwcHJveGltYXRlbHkgMSBGUFMuIElkZW50aWZ5IGV2ZXJ5IHRpbWVzdGFtcCB3aGVyZSBhIG5ldyBhcmNoaXRlY3R1cmFsIGRpYWdyYW0sIGNvZGUgc25pcHBldCwgb3IgbWFqb3IgdGVjaG5pY2FsIFVJIHNoaWZ0IG9jY3Vycy4gRm9ybWF0IHlvdXIgcmVzcG9uc2UgYXMgYSBsaXN0IG9mIHRpbWVzdGFtcHMgKEhIOk1NOlNTKSBmb2xsb3dlZCBieSBhIHNob3J0IGRlc2NyaXB0aW9uOiBbVFNdIC0gW0Rlc2NyaXB0aW9uXS4gRm9jdXMgb25seSBvbiB0aGUgbW9zdCB0ZWNobmljYWxseSBkZW5zZSBtb21lbnRzLmA7XG5cbiAgICAgICAgY29uc3QgdHJpYWdlUmVzcG9uc2UgPSBhd2FpdCB0aGlzLmdldEFJUmVzcG9uc2UocGFnZSwgdHJpYWdlUHJvbXB0KTtcbiAgICAgICAgY29uc29sZS5sb2coYFtQcm9dIFRyaWFnZSBSZXN1bHRzOlxcbiR7dHJpYWdlUmVzcG9uc2V9YCk7XG5cbiAgICAgICAgY29uc3QgdHNNYXRjaGVzID0gdHJpYWdlUmVzcG9uc2UubWF0Y2goLyhcXGR7MSwyfTpcXGR7Mn06XFxkezJ9fFxcZHsxLDJ9OlxcZHsyfSkvZyk7XG4gICAgICAgIHZpZGVvLmhvdHNwb3RzID0gKHRzTWF0Y2hlcyB8fCBbXSkubWFwKCh0cykgPT4gKHtcbiAgICAgICAgICB0aW1lc3RhbXA6IHRzLFxuICAgICAgICAgIHJlYXNvbjogJ1RlY2huaWNhbCBIb3RzcG90JyxcbiAgICAgICAgfSkpO1xuICAgICAgICB2aWRlby5zdGF0dXMgPSAndHJpYWdlZCc7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlKCk7XG5cbiAgICAgICAgY29uc29sZS5sb2coYFtQcm9dIFRyaWFnZSBDb21wbGV0ZS4gRm91bmQgJHt2aWRlby5ob3RzcG90cy5sZW5ndGh9IGhvdHNwb3RzLmApO1xuXG4gICAgICAgIC8vIC0tLSBTVEFHRSAyOiBERUVQIEFOQUxZU0lTIChQUk8pIC0tLVxuICAgICAgICBjb25zb2xlLmxvZyhgXFxuLS0tIFNUQUdFIDI6IERlZXAgQW5hbHlzaXMgIyR7dmlkZW8uaW5kZXh9IC0tLWApO1xuICAgICAgICBhd2FpdCB0aGlzLnNlbGVjdE1vZGVsKHBhZ2UsIERFRVBfTU9ERUwpO1xuICAgICAgICBhd2FpdCB0aGlzLnNldFRoaW5raW5nTGV2ZWwocGFnZSwgJ0hpZ2gnKTtcblxuICAgICAgICBsZXQgY29tcHJlaGVuc2l2ZUFuYWx5c2lzID0gYCMgUHJvIFRlY2huaWNhbCBBbmFseXNpczogJHt2aWRlby50aXRsZX1cXG5cXG5gO1xuXG4gICAgICAgIGZvciAoY29uc3QgaG90c3BvdCBvZiAodmlkZW8uaG90c3BvdHMgfHwgW10pLnNsaWNlKDAsIDUpKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYFtQcm9dIERlZXBseSByZWFzb25pbmcgb3ZlciBob3RzcG90OiAke2hvdHNwb3QudGltZXN0YW1wfWApO1xuICAgICAgICAgIGNvbnN0IGRlZXBQcm9tcHQgPSBgUGVyZm9ybSBhbiBleHRlbnNpdmUgaW50ZXJuYWwgcmVhc29uaW5nIGNoYWluIHRvIGFuYWx5emUgdGhlIHZpc3VhbCBpbmZvcm1hdGlvbiBhdCBleGFjdGx5ICR7aG90c3BvdC50aW1lc3RhbXB9LiBJZGVudGlmeSB0aGUgYXJjaGl0ZWN0dXJhbCBkaWFncmFtcywgY29tcG9uZW50cywgb3IgY29kZSBzbmlwcGV0cyBzaG93bi4gRGVzY3JpYmUgdGhlbSB3aXRoIGhpZ2ggdGVjaG5pY2FsIGZpZGVsaXR5LmA7XG5cbiAgICAgICAgICBjb25zdCBkZWVwUmVzdWx0ID0gYXdhaXQgdGhpcy5nZXRBSVJlc3BvbnNlKHBhZ2UsIGRlZXBQcm9tcHQpO1xuICAgICAgICAgIGNvbXByZWhlbnNpdmVBbmFseXNpcyArPSBgIyMjIEFuYWx5c2lzIEAgJHtob3RzcG90LnRpbWVzdGFtcH1cXG4ke2RlZXBSZXN1bHR9XFxuXFxuYDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlcG9ydFBhdGggPSBwYXRoLmpvaW4odGhpcy5yZXBvcnRzRGlyLCBgcHJvXyR7dmlkZW8uaW5kZXh9XyR7dmlkZW8udmlkZW9JZH0ubWRgKTtcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyhyZXBvcnRQYXRoLCBjb21wcmVoZW5zaXZlQW5hbHlzaXMpO1xuICAgICAgICBjb25zb2xlLmxvZyhgW1Byb10g4pyFIEZpbmFsIFJlcG9ydCBTYXZlZDogJHtyZXBvcnRQYXRofWApO1xuXG4gICAgICAgIHZpZGVvLnN0YXR1cyA9ICdjb21wbGV0ZWQnO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuICAgICAgICBhd2FpdCBwYWdlLmNsb3NlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFtQcm9dIOKdjCBBdHRlbXB0IGZhaWxlZDogJHtlLm1lc3NhZ2V9YCk7XG4gICAgICAgIHJldHJpZXMtLTtcbiAgICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgICBpZiAocmV0cmllcyA+PSAwKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYFtQcm9dIPCflIQgUmV0cnlpbmcgaW4gMTBzLi4uICgke3JldHJpZXN9IGxlZnQpYCk7XG4gICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHIpID0+IHNldFRpbWVvdXQociwgMTAwMDApKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHJ1bihzdGFydEluZGV4OiBudW1iZXIsIGVuZEluZGV4OiBudW1iZXIpIHtcbiAgICBhd2FpdCB0aGlzLmluaXRpYWxpemUoKTtcblxuICAgIGNvbnN0IGxpYnJhcnlQYXRoID0gcHJvY2Vzcy5lbnYuVE5GX1ZJREVPX0xJQlJBUlkgfHwgJyc7XG4gICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhsaWJyYXJ5UGF0aCwgJ3V0Zi04Jyk7XG4gICAgY29uc3QgcXVldWU6IFZpZGVvRW50cnlbXSA9IFtdO1xuXG4gICAgY29uc3Qgcm93UmVnZXggPVxuICAgICAgLzx0cj5cXHMqPHRkW14+XSo+XFxzKihcXGQrKVxccyo8XFwvdGQ+XFxzKjx0ZFtePl0qPlxccyo8YVxccytocmVmPVwiKFteXCJdKylcIltePl0qPihbXjxdKyk8XFwvYT5cXHMqPFxcL3RkPi9nO1xuICAgIGxldCBtYXRjaDtcbiAgICB3aGlsZSAoKG1hdGNoID0gcm93UmVnZXguZXhlYyhjb250ZW50KSkgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gcGFyc2VJbnQobWF0Y2hbMV0pO1xuICAgICAgaWYgKGluZGV4IDw9IHN0YXJ0SW5kZXggJiYgaW5kZXggPj0gZW5kSW5kZXgpIHtcbiAgICAgICAgY29uc3QgdXJsID0gbWF0Y2hbMl07XG4gICAgICAgIGNvbnN0IHZpZGVvSWQgPSB1cmwubWF0Y2goL3Y9KFteJl0rKS8pPy5bMV0gfHwgdXJsLnNwbGl0KCcvJykucG9wKCkgfHwgJyc7XG4gICAgICAgIHF1ZXVlLnB1c2goe1xuICAgICAgICAgIGluZGV4LFxuICAgICAgICAgIHVybCxcbiAgICAgICAgICB0aXRsZTogbWF0Y2hbM10udHJpbSgpLFxuICAgICAgICAgIHZpZGVvSWQsXG4gICAgICAgICAgc3RhdHVzOiAncGVuZGluZycsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHF1ZXVlLnNvcnQoKGEsIGIpID0+IGIuaW5kZXggLSBhLmluZGV4KTtcbiAgICB0aGlzLmRhdGEucXVldWUgPSBxdWV1ZTtcbiAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuXG4gICAgZm9yIChjb25zdCB2aWRlbyBvZiBxdWV1ZSkge1xuICAgICAgY29uc29sZS5sb2coYFxcbvCfmoAgU3RhcnRpbmcgUHJvIFByb2Nlc3NpbmcgZm9yICMke3ZpZGVvLmluZGV4fTogJHt2aWRlby50aXRsZX1gKTtcbiAgICAgIGF3YWl0IHRoaXMucHJvY2Vzc1ZpZGVvKHZpZGVvKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5jb250ZXh0KSBhd2FpdCB0aGlzLmNvbnRleHQuY2xvc2UoKTtcbiAgfVxufVxuXG4vLyBDTEkgRW50cnlwb2ludFxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIGNvbnN0IHByb2Nlc3NvciA9IG5ldyBQcm9WaXN1YWxQcm9jZXNzb3IoKTtcbiAgY29uc3Qgc3RhcnQgPSBwYXJzZUludChwcm9jZXNzLmFyZ3ZbMl0pIHx8IDY5MjtcbiAgY29uc3QgZW5kID0gcGFyc2VJbnQocHJvY2Vzcy5hcmd2WzNdKSB8fCA2NDg7XG4gIHByb2Nlc3Nvci5ydW4oc3RhcnQsIGVuZCkuY2F0Y2goY29uc29sZS5lcnJvcik7XG59XG4iXX0=
