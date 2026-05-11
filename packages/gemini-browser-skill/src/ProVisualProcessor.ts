/**
 * Pro Visual Intelligence Processor
 *
 * Implements the "Pro" workflow for technical video ingestion:
 * 1. Initial Triage: Gemini 3 Flash (1 FPS scan) to map key events/timestamps.
 * 2. Deep Analysis: Gemini 3.1 Pro Preview (Thinking: High) for architectural deep-dives.
 * 3. AI Studio Integration: Leverages the native YouTube plugin for high-fidelity stream access.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as process from 'node:process';
import { chromium, type BrowserContext, type Locator, type Page } from 'playwright';

interface VideoEntry {
  index: number;
  url: string;
  title: string;
  videoId: string;
  status: 'pending' | 'triaged' | 'completed' | 'error';
  hotspots?: { timestamp: string; reason: string }[];
  analysis?: string;
}

const AI_STUDIO_URL = 'https://aistudio.google.com/app/prompts/new_chat';
const TRIAGE_MODEL = 'Gemini 3 Flash Preview';
const DEEP_MODEL = 'Gemini 3.1 Pro Preview';

class ProVisualProcessor {
  private context: BrowserContext | null = null;
  private stateFilePath: string;
  private reportsDir: string;
  private data: any;

  constructor() {
    const dataDir = '/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data';
    this.stateFilePath = path.join(dataDir, 'pro-ingestion-state.json');
    this.reportsDir = path.join(dataDir, 'pro-video-reports');

    fs.mkdirSync(this.reportsDir, { recursive: true });
    this.data = this.loadState();
  }

  private loadState() {
    if (fs.existsSync(this.stateFilePath)) {
      return JSON.parse(fs.readFileSync(this.stateFilePath, 'utf8'));
    }
    return { queue: [], currentIndex: 0 };
  }

  private saveState() {
    fs.writeFileSync(this.stateFilePath, JSON.stringify(this.data, null, 2));
  }

  async initialize() {
    const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-alt');
    const extensionPath =
      '/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/chrome-extension/aivi';

    console.log(`[Pro] Launching Authenticated Chrome with AIVI Extension: ${profileDir}`);

    this.context = await chromium.launchPersistentContext(profileDir, {
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

  private async dismissDialogs(page: Page) {
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

  private async selectModel(page: Page, modelName: string) {
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
    } catch (e: any) {
      console.error(`[Pro] ❌ Model selection failed: ${e.message}`);
    }
  }

  private async insertYouTubeVideo(page: Page, url: string) {
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
    let urlInput: Locator | null = null;

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

  private async setThinkingLevel(page: Page, level: 'Low' | 'Medium' | 'High') {
    console.log(`[Pro] Setting Thinking Level to: ${level}`);
    const toggle = page.locator('ms-thinking-level-setting mat-slide-toggle');
    if (!(await toggle.getAttribute('class'))?.includes('mat-checked')) {
      await toggle.click();
      await page.waitForTimeout(500);
    }

    await page.locator('ms-thinking-level-setting mat-select').click();
    await page.waitForTimeout(500);
    await page.locator(`mat-option:has-text("${level}")`).click();
    await page.waitForTimeout(1000);
  }

  private async ensurePaidProject(page: Page) {
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
    } catch (e: any) {
      console.warn(`[Pro] Project selection check failed: ${e.message}. (May already be set)`);
      await page.keyboard.press('Escape');
    }
  }

  private async getAIResponse(page: Page, prompt: string): Promise<string> {
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

  async processVideo(video: VideoEntry) {
    if (video.status === 'completed') return;

    let retries = 2;
    while (retries >= 0) {
      const page = await this.context!.newPage();
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
      } catch (e: any) {
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

  async run(startIndex: number, endIndex: number) {
    await this.initialize();

    const libraryPath =
      '/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/my-ai-knowledge-base/video-library/ai_video_library.html';
    const content = fs.readFileSync(libraryPath, 'utf-8');
    const queue: VideoEntry[] = [];

    const rowRegex =
      /<tr>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>\s*<\/td>/g;
    let match;
    while ((match = rowRegex.exec(content)) !== null) {
      const index = parseInt(match[1]);
      if (index <= startIndex && index >= endIndex) {
        const url = match[2];
        const videoId = url.match(/v=([^&]+)/)?.[1] || url.split('/').pop() || '';
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
