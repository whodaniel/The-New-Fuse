"use strict";
/**
 * Pro Visual Intelligence Processor
 *
 * Implements the "Pro" workflow for technical video ingestion:
 * 1. Initial Triage: Gemini 3 Flash (1 FPS scan) to map key events/timestamps.
 * 2. Deep Analysis: Gemini 3.1 Pro Preview (Thinking: High) for architectural deep-dives.
 * 3. AI Studio Integration: Leverages the native YouTube plugin for high-fidelity stream access.
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
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const process = __importStar(require("node:process"));
const playwright_1 = require("playwright");
const AI_STUDIO_URL = 'https://aistudio.google.com/app/prompts/new_chat';
const TRIAGE_MODEL = 'Gemini 3 Flash Preview';
const DEEP_MODEL = 'Gemini 3.1 Pro Preview';
class ProVisualProcessor {
    constructor() {
        this.context = null;
        const dataDir = '/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data';
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
        const extensionPath = '/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/chrome-extension/aivi';
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
                if (await btn.isVisible())
                    await btn.click();
            }
            catch (e) { }
        }
        await page.keyboard.press('Escape');
    }
    async selectModel(page, modelName) {
        console.log(`[Pro] Ensuring model: ${modelName}`);
        try {
            const modelBtn = page
                .locator('.settings-item.settings-model-selector, button:has-text("Gemini"), button[aria-label*="model" i]')
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
            const options = page.locator('[role="menuitem"], [role="option"], .mat-mdc-menu-item, mat-option');
            const target = options.filter({ hasText: modelName }).first();
            if ((await target.count()) > 0) {
                await target.click();
                console.log(`[Pro] ✅ Switched to ${modelName}`);
            }
            else {
                // Broad search fallback
                const broadTarget = options.filter({ hasText: '3.1' }).filter({ hasText: 'Pro' }).first();
                if ((await broadTarget.count()) > 0) {
                    await broadTarget.click();
                    console.log('[Pro] ✅ Selected 3.1 Pro via broad match');
                }
                else {
                    console.warn(`[Pro] ⚠️ Could not find exact model ${modelName}, keeping current.`);
                    await page.keyboard.press('Escape');
                }
            }
            await page.waitForTimeout(1000);
        }
        catch (e) {
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
        if (!urlInput)
            urlInput = inputs.first();
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
            .locator('ms-file-chip, ms-media-chip, .video-chip, [data-test-id="media-chip"], .chip-content')
            .first();
        try {
            await videoChip.waitFor({ state: 'visible', timeout: 25000 });
            console.log('[Pro] ✅ Video successfully attached to prompt.');
        }
        catch (e) {
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
        if (!((_a = (await toggle.getAttribute('class'))) === null || _a === void 0 ? void 0 : _a.includes('mat-checked'))) {
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
                .locator('.paid-api-key-card, button[aria-label*="project" i], button:has-text("No API Key"), .project-selector-button')
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
            }
            else {
                const firstOpt = page.locator('mat-option, .mat-mdc-option').first();
                if ((await firstOpt.count()) > 0)
                    await firstOpt.click();
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
        }
        catch (e) {
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
            .locator('button[aria-label*="Run" i], button:has-text("Run"), button[data-test-id="run-button"]')
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
            .locator('mat-snack-bar-container, .error-message, :text("Permission denied"), :text("Failed to generate")')
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
            if (await copyBtn.isVisible())
                break;
            await page.waitForTimeout(3000);
        }
        const responseContainer = page
            .locator('ms-chat-turn.model .turn-content, .chat-turn-container.model .turn-content')
            .last();
        return await responseContainer.innerText();
    }
    async processVideo(video) {
        if (video.status === 'completed')
            return;
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
            }
            catch (e) {
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
        const libraryPath = '/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/my-ai-knowledge-base/video-library/ai_video_library.html';
        const content = fs.readFileSync(libraryPath, 'utf-8');
        const queue = [];
        const rowRegex = /<tr>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>\s*<\/td>/g;
        let match;
        while ((match = rowRegex.exec(content)) !== null) {
            const index = parseInt(match[1]);
            if (index <= startIndex && index >= endIndex) {
                const url = match[2];
                const videoId = ((_a = url.match(/v=([^&]+)/)) === null || _a === void 0 ? void 0 : _a[1]) || url.split('/').pop() || '';
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
        if (this.context)
            await this.context.close();
    }
}
// CLI Entrypoint
if (require.main === module) {
    const processor = new ProVisualProcessor();
    const start = parseInt(process.argv[2]) || 692;
    const end = parseInt(process.argv[3]) || 648;
    processor.run(start, end).catch(console.error);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJvVmlzdWFsUHJvY2Vzc29yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiUHJvVmlzdWFsUHJvY2Vzc29yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7OztHQU9HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILDRDQUE4QjtBQUM5QixnREFBa0M7QUFDbEMsc0RBQXdDO0FBQ3hDLDJDQUFvRjtBQVlwRixNQUFNLGFBQWEsR0FBRyxrREFBa0QsQ0FBQztBQUN6RSxNQUFNLFlBQVksR0FBRyx3QkFBd0IsQ0FBQztBQUM5QyxNQUFNLFVBQVUsR0FBRyx3QkFBd0IsQ0FBQztBQUU1QyxNQUFNLGtCQUFrQjtJQU10QjtRQUxRLFlBQU8sR0FBMEIsSUFBSSxDQUFDO1FBTTVDLE1BQU0sT0FBTyxHQUFHLGtFQUFrRSxDQUFDO1FBQ25GLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztRQUNwRSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLG1CQUFtQixDQUFDLENBQUM7UUFFMUQsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDbkQsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDL0IsQ0FBQztJQUVPLFNBQVM7UUFDZixJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUM7WUFDdEMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7UUFDRCxPQUFPLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxZQUFZLEVBQUUsQ0FBQyxFQUFFLENBQUM7SUFDeEMsQ0FBQztJQUVPLFNBQVM7UUFDZixFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNFLENBQUM7SUFFRCxLQUFLLENBQUMsVUFBVTtRQUNkLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksTUFBTSxFQUFFLDZCQUE2QixDQUFDLENBQUM7UUFDeEYsTUFBTSxhQUFhLEdBQ2pCLHdGQUF3RixDQUFDO1FBRTNGLE9BQU8sQ0FBQyxHQUFHLENBQUMsNkRBQTZELFVBQVUsRUFBRSxDQUFDLENBQUM7UUFFdkYsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLHFCQUFRLENBQUMsdUJBQXVCLENBQUMsVUFBVSxFQUFFO1lBQ2hFLFFBQVEsRUFBRSxLQUFLO1lBQ2YsT0FBTyxFQUFFLFFBQVE7WUFDakIsUUFBUSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFO1lBQ3RDLElBQUksRUFBRTtnQkFDSixnQkFBZ0I7Z0JBQ2hCLDRCQUE0QjtnQkFDNUIsK0JBQStCLGFBQWEsRUFBRTtnQkFDOUMsb0JBQW9CLGFBQWEsRUFBRTthQUNwQztTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFTyxLQUFLLENBQUMsY0FBYyxDQUFDLElBQVU7UUFDckMsTUFBTSxTQUFTLEdBQUc7WUFDaEIsMkJBQTJCO1lBQzNCLDZCQUE2QjtZQUM3QixzQkFBc0I7WUFDdEIsNEJBQTRCO1NBQzdCLENBQUM7UUFDRixLQUFLLE1BQU0sQ0FBQyxJQUFJLFNBQVMsRUFBRSxDQUFDO1lBQzFCLElBQUksQ0FBQztnQkFDSCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNwQyxJQUFJLE1BQU0sR0FBRyxDQUFDLFNBQVMsRUFBRTtvQkFBRSxNQUFNLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUMvQyxDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFBLENBQUM7UUFDaEIsQ0FBQztRQUNELE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVPLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBVSxFQUFFLFNBQWlCO1FBQ3JELE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFFbEQsSUFBSSxDQUFDO1lBQ0gsTUFBTSxRQUFRLEdBQUcsSUFBSTtpQkFDbEIsT0FBTyxDQUNOLGtHQUFrRyxDQUNuRztpQkFDQSxLQUFLLEVBQUUsQ0FBQztZQUNYLE1BQU0sUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFFN0QsTUFBTSxXQUFXLEdBQUcsTUFBTSxRQUFRLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDL0MsSUFBSSxXQUFXLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3BDLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLFNBQVMsb0JBQW9CLENBQUMsQ0FBQztnQkFDNUQsT0FBTztZQUNULENBQUM7WUFFRCxNQUFNLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN2QixNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFaEMsbUNBQW1DO1lBQ25DLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQzFCLG9FQUFvRSxDQUNyRSxDQUFDO1lBQ0YsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBRTlELElBQUksQ0FBQyxNQUFNLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUMvQixNQUFNLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDckIsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsU0FBUyxFQUFFLENBQUMsQ0FBQztZQUNsRCxDQUFDO2lCQUFNLENBQUM7Z0JBQ04sd0JBQXdCO2dCQUN4QixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQzFGLElBQUksQ0FBQyxNQUFNLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUNwQyxNQUFNLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQ0FBMEMsQ0FBQyxDQUFDO2dCQUMxRCxDQUFDO3FCQUFNLENBQUM7b0JBQ04sT0FBTyxDQUFDLElBQUksQ0FBQyx1Q0FBdUMsU0FBUyxvQkFBb0IsQ0FBQyxDQUFDO29CQUNuRixNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN0QyxDQUFDO1lBQ0gsQ0FBQztZQUNELE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBQUMsT0FBTyxDQUFNLEVBQUUsQ0FBQztZQUNoQixPQUFPLENBQUMsS0FBSyxDQUFDLG1DQUFtQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUNoRSxDQUFDO0lBQ0gsQ0FBQztJQUVPLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxJQUFVLEVBQUUsR0FBVztRQUN0RCxPQUFPLENBQUMsR0FBRyxDQUFDLGtDQUFrQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBRXJELGtFQUFrRTtRQUNsRSxJQUFJLE1BQU0sR0FBRyxJQUFJO2FBQ2QsT0FBTyxDQUFDLGtFQUFrRSxDQUFDO2FBQzNFLEtBQUssRUFBRSxDQUFDO1FBQ1gsSUFBSSxDQUFDLENBQUMsTUFBTSxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQ2hDLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLDZEQUE2RCxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDL0YsQ0FBQztRQUNELE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDM0QsTUFBTSxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDckIsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWhDLDREQUE0RDtRQUM1RCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLCtEQUErRCxDQUFDLENBQUM7UUFDaEcsTUFBTSxRQUFRLEdBQUcsTUFBTSxTQUFTLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDakQsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFOUQsSUFBSSxLQUFLLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDcEUsSUFBSSxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQzNCLEtBQUssR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDNUQsQ0FBQztRQUVELElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ2hDLE9BQU8sQ0FBQyxLQUFLLENBQUMsb0VBQW9FLENBQUMsQ0FBQztZQUNwRixNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxJQUFJLEVBQUUseUJBQXlCLEVBQUUsQ0FBQyxDQUFDO1lBQzNELE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEMsTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFRCxNQUFNLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNwQixNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFaEMsa0VBQWtFO1FBQ2xFLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsdUNBQXVDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUM3RSxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBRTNELE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdkMsTUFBTSxVQUFVLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDeEMsSUFBSSxRQUFRLEdBQW1CLElBQUksQ0FBQztRQUVwQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDcEMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLE1BQU0sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNuRixNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsTUFBTSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzlFLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLElBQUksSUFBSSxLQUFLLEtBQUssRUFBRSxDQUFDO2dCQUMxRixRQUFRLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDekIsTUFBTTtZQUNSLENBQUM7UUFDSCxDQUFDO1FBRUQsSUFBSSxDQUFDLFFBQVE7WUFBRSxRQUFRLEdBQUcsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBRXpDLElBQUksUUFBUSxFQUFFLENBQUM7WUFDYixNQUFNLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN2QixNQUFNLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxjQUFjO1lBQ3ZDLE1BQU0sUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN4QyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDaEMsTUFBTSxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRTlCLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0RBQXdELENBQUMsQ0FBQztZQUN0RSx5R0FBeUc7WUFDekcsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFFRCxtREFBbUQ7UUFDbkQsTUFBTSxPQUFPLEdBQUcsTUFBTTthQUNuQixPQUFPLENBQUMsa0ZBQWtGLENBQUM7YUFDM0YsS0FBSyxFQUFFLENBQUM7UUFDWCxNQUFNLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRTNELDBCQUEwQjtRQUMxQixNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFaEMsTUFBTSxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDckMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvREFBb0QsQ0FBQyxDQUFDO1FBRWxFLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7UUFFMUQsdUJBQXVCO1FBQ3ZCLE9BQU8sQ0FBQyxHQUFHLENBQUMscUNBQXFDLENBQUMsQ0FBQztRQUNuRCxNQUFNLFNBQVMsR0FBRyxJQUFJO2FBQ25CLE9BQU8sQ0FDTixzRkFBc0YsQ0FDdkY7YUFDQSxLQUFLLEVBQUUsQ0FBQztRQUNYLElBQUksQ0FBQztZQUNILE1BQU0sU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDOUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnREFBZ0QsQ0FBQyxDQUFDO1FBQ2hFLENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1gsT0FBTyxDQUFDLElBQUksQ0FBQyxrREFBa0QsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLElBQUksRUFBRSwrQkFBK0IsRUFBRSxDQUFDLENBQUM7UUFDbkUsQ0FBQztRQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsMkNBQTJDLENBQUMsQ0FBQztRQUN6RCxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUVPLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFVLEVBQUUsS0FBZ0M7O1FBQ3pFLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0NBQW9DLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDekQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyw0Q0FBNEMsQ0FBQyxDQUFDO1FBQzFFLElBQUksQ0FBQyxDQUFBLE1BQUEsQ0FBQyxNQUFNLE1BQU0sQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsMENBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFBLEVBQUUsQ0FBQztZQUNuRSxNQUFNLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNyQixNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDakMsQ0FBQztRQUVELE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ25FLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMvQixNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsd0JBQXdCLEtBQUssSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDOUQsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFFTyxLQUFLLENBQUMsaUJBQWlCLENBQUMsSUFBVTtRQUN4QyxPQUFPLENBQUMsR0FBRyxDQUFDLDZDQUE2QyxDQUFDLENBQUM7UUFDM0QsSUFBSSxDQUFDO1lBQ0gsTUFBTSxVQUFVLEdBQUcsSUFBSTtpQkFDcEIsT0FBTyxDQUNOLDhHQUE4RyxDQUMvRztpQkFDQSxLQUFLLEVBQUUsQ0FBQztZQUNYLE1BQU0sVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDL0QsTUFBTSxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDekIsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRWhDLE1BQU0sYUFBYSxHQUFHLElBQUk7aUJBQ3ZCLE9BQU8sQ0FBQyx5RUFBeUUsQ0FBQztpQkFDbEYsS0FBSyxFQUFFLENBQUM7WUFDWCxNQUFNLGFBQWEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUM1QixNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFaEMsTUFBTSxVQUFVLEdBQUcsSUFBSTtpQkFDcEIsT0FBTyxDQUFDLCtFQUErRSxDQUFDO2lCQUN4RixLQUFLLEVBQUUsQ0FBQztZQUNYLElBQUksQ0FBQyxNQUFNLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNuQyxNQUFNLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDO1lBQ3pELENBQUM7aUJBQU0sQ0FBQztnQkFDTixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLDZCQUE2QixDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ3JFLElBQUksQ0FBQyxNQUFNLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUM7b0JBQUUsTUFBTSxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDM0QsQ0FBQztZQUNELE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVoQyxNQUFNLFVBQVUsR0FBRyxJQUFJO2lCQUNwQixPQUFPLENBQUMsK0VBQStFLENBQUM7aUJBQ3hGLEtBQUssRUFBRSxDQUFDO1lBQ1gsSUFBSSxNQUFNLFVBQVUsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDO2dCQUNqQyxNQUFNLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO1lBQ3JELENBQUM7WUFDRCxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUFDLE9BQU8sQ0FBTSxFQUFFLENBQUM7WUFDaEIsT0FBTyxDQUFDLElBQUksQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDLE9BQU8sd0JBQXdCLENBQUMsQ0FBQztZQUN6RixNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7SUFDSCxDQUFDO0lBRU8sS0FBSyxDQUFDLGFBQWEsQ0FBQyxJQUFVLEVBQUUsTUFBYztRQUNwRCxNQUFNLFFBQVEsR0FBRyxJQUFJO2FBQ2xCLE9BQU8sQ0FBQyw2REFBNkQsQ0FBQzthQUN0RSxLQUFLLEVBQUUsQ0FBQztRQUNYLE1BQU0sUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDN0QsTUFBTSxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDdkIsTUFBTSxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVCLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUUvQixNQUFNLE1BQU0sR0FBRyxJQUFJO2FBQ2hCLE9BQU8sQ0FDTix3RkFBd0YsQ0FDekY7YUFDQSxLQUFLLEVBQUUsQ0FBQztRQUNYLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7UUFFM0Qsa0RBQWtEO1FBQ2xELE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbkMsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWhDLElBQUksQ0FBQyxNQUFNLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDL0QsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsb0NBQW9DLENBQUMsQ0FBQztRQUVsRCw0QkFBNEI7UUFDNUIsTUFBTSxVQUFVLEdBQUcsSUFBSTthQUNwQixPQUFPLENBQ04sa0dBQWtHLENBQ25HO2FBQ0EsS0FBSyxFQUFFLENBQUM7UUFFWCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDN0IsT0FBTyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxHQUFHLE1BQU0sRUFBRSxDQUFDO1lBQ3ZDLGdCQUFnQjtZQUNoQixJQUFJLE1BQU0sVUFBVSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUM7Z0JBQ2pDLE1BQU0sT0FBTyxHQUFHLE1BQU0sVUFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUM3QyxPQUFPLENBQUMsS0FBSyxDQUFDLDJCQUEyQixPQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUNwRCx5RUFBeUU7Z0JBQ3pFLE1BQU0sSUFBSSxLQUFLLENBQUMsb0JBQW9CLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDakQsQ0FBQztZQUVELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsOEJBQThCLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNwRSxJQUFJLE1BQU0sT0FBTyxDQUFDLFNBQVMsRUFBRTtnQkFBRSxNQUFNO1lBRXJDLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBRUQsTUFBTSxpQkFBaUIsR0FBRyxJQUFJO2FBQzNCLE9BQU8sQ0FBQyw0RUFBNEUsQ0FBQzthQUNyRixJQUFJLEVBQUUsQ0FBQztRQUNWLE9BQU8sTUFBTSxpQkFBaUIsQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUM3QyxDQUFDO0lBRUQsS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFpQjtRQUNsQyxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssV0FBVztZQUFFLE9BQU87UUFFekMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDO1FBQ2hCLE9BQU8sT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ3BCLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUMzQyxJQUFJLENBQUM7Z0JBQ0gsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxFQUFFLFNBQVMsRUFBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDO2dCQUM3RCxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVuQyxrQ0FBa0M7Z0JBQ2xDLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLEtBQUssQ0FBQyxLQUFLLE1BQU0sQ0FBQyxDQUFDO2dCQUN6RCxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUMzQyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUUvQyxNQUFNLFlBQVksR0FBRyxzWEFBc1gsQ0FBQztnQkFFNVksTUFBTSxjQUFjLEdBQUcsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDcEUsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsY0FBYyxFQUFFLENBQUMsQ0FBQztnQkFFeEQsTUFBTSxTQUFTLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO2dCQUMvRSxLQUFLLENBQUMsUUFBUSxHQUFHLENBQUMsU0FBUyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztvQkFDOUMsU0FBUyxFQUFFLEVBQUU7b0JBQ2IsTUFBTSxFQUFFLG1CQUFtQjtpQkFDNUIsQ0FBQyxDQUFDLENBQUM7Z0JBQ0osS0FBSyxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFFakIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQ0FBZ0MsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLFlBQVksQ0FBQyxDQUFDO2dCQUUvRSx1Q0FBdUM7Z0JBQ3ZDLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUNBQWlDLEtBQUssQ0FBQyxLQUFLLE1BQU0sQ0FBQyxDQUFDO2dCQUNoRSxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUN6QyxNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBRTFDLElBQUkscUJBQXFCLEdBQUcsNkJBQTZCLEtBQUssQ0FBQyxLQUFLLE1BQU0sQ0FBQztnQkFFM0UsS0FBSyxNQUFNLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUN6RCxPQUFPLENBQUMsR0FBRyxDQUFDLHdDQUF3QyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztvQkFDekUsTUFBTSxVQUFVLEdBQUcsOEZBQThGLE9BQU8sQ0FBQyxTQUFTLHdIQUF3SCxDQUFDO29CQUUzUCxNQUFNLFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO29CQUM5RCxxQkFBcUIsSUFBSSxrQkFBa0IsT0FBTyxDQUFDLFNBQVMsS0FBSyxVQUFVLE1BQU0sQ0FBQztnQkFDcEYsQ0FBQztnQkFFRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsT0FBTyxLQUFLLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxPQUFPLEtBQUssQ0FBQyxDQUFDO2dCQUN4RixFQUFFLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO2dCQUNwRCxPQUFPLENBQUMsR0FBRyxDQUFDLCtCQUErQixVQUFVLEVBQUUsQ0FBQyxDQUFDO2dCQUV6RCxLQUFLLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNqQixNQUFNLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDbkIsTUFBTTtZQUNSLENBQUM7WUFBQyxPQUFPLENBQU0sRUFBRSxDQUFDO2dCQUNoQixPQUFPLENBQUMsS0FBSyxDQUFDLDJCQUEyQixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztnQkFDdEQsT0FBTyxFQUFFLENBQUM7Z0JBQ1YsTUFBTSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ25CLElBQUksT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUNqQixPQUFPLENBQUMsR0FBRyxDQUFDLGdDQUFnQyxPQUFPLFFBQVEsQ0FBQyxDQUFDO29CQUM3RCxNQUFNLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ2pELENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFFRCxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQWtCLEVBQUUsUUFBZ0I7O1FBQzVDLE1BQU0sSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBRXhCLE1BQU0sV0FBVyxHQUNmLHlHQUF5RyxDQUFDO1FBQzVHLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3RELE1BQU0sS0FBSyxHQUFpQixFQUFFLENBQUM7UUFFL0IsTUFBTSxRQUFRLEdBQ1osaUdBQWlHLENBQUM7UUFDcEcsSUFBSSxLQUFLLENBQUM7UUFDVixPQUFPLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUNqRCxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakMsSUFBSSxLQUFLLElBQUksVUFBVSxJQUFJLEtBQUssSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDN0MsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyQixNQUFNLE9BQU8sR0FBRyxDQUFBLE1BQUEsR0FBRyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsMENBQUcsQ0FBQyxDQUFDLEtBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUM7Z0JBQzFFLEtBQUssQ0FBQyxJQUFJLENBQUM7b0JBQ1QsS0FBSztvQkFDTCxHQUFHO29CQUNILEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFO29CQUN0QixPQUFPO29CQUNQLE1BQU0sRUFBRSxTQUFTO2lCQUNsQixDQUFDLENBQUM7WUFDTCxDQUFDO1FBQ0gsQ0FBQztRQUVELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN4QyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDeEIsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBRWpCLEtBQUssTUFBTSxLQUFLLElBQUksS0FBSyxFQUFFLENBQUM7WUFDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUMsS0FBSyxDQUFDLEtBQUssS0FBSyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUNoRixNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDakMsQ0FBQztRQUVELElBQUksSUFBSSxDQUFDLE9BQU87WUFBRSxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDL0MsQ0FBQztDQUNGO0FBRUQsaUJBQWlCO0FBQ2pCLElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUUsQ0FBQztJQUM1QixNQUFNLFNBQVMsR0FBRyxJQUFJLGtCQUFrQixFQUFFLENBQUM7SUFDM0MsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUM7SUFDL0MsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUM7SUFDN0MsU0FBUyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBQcm8gVmlzdWFsIEludGVsbGlnZW5jZSBQcm9jZXNzb3JcbiAqXG4gKiBJbXBsZW1lbnRzIHRoZSBcIlByb1wiIHdvcmtmbG93IGZvciB0ZWNobmljYWwgdmlkZW8gaW5nZXN0aW9uOlxuICogMS4gSW5pdGlhbCBUcmlhZ2U6IEdlbWluaSAzIEZsYXNoICgxIEZQUyBzY2FuKSB0byBtYXAga2V5IGV2ZW50cy90aW1lc3RhbXBzLlxuICogMi4gRGVlcCBBbmFseXNpczogR2VtaW5pIDMuMSBQcm8gUHJldmlldyAoVGhpbmtpbmc6IEhpZ2gpIGZvciBhcmNoaXRlY3R1cmFsIGRlZXAtZGl2ZXMuXG4gKiAzLiBBSSBTdHVkaW8gSW50ZWdyYXRpb246IExldmVyYWdlcyB0aGUgbmF0aXZlIFlvdVR1YmUgcGx1Z2luIGZvciBoaWdoLWZpZGVsaXR5IHN0cmVhbSBhY2Nlc3MuXG4gKi9cblxuaW1wb3J0ICogYXMgZnMgZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgKiBhcyBwcm9jZXNzIGZyb20gJ25vZGU6cHJvY2Vzcyc7XG5pbXBvcnQgeyBjaHJvbWl1bSwgdHlwZSBCcm93c2VyQ29udGV4dCwgdHlwZSBMb2NhdG9yLCB0eXBlIFBhZ2UgfSBmcm9tICdwbGF5d3JpZ2h0JztcblxuaW50ZXJmYWNlIFZpZGVvRW50cnkge1xuICBpbmRleDogbnVtYmVyO1xuICB1cmw6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgdmlkZW9JZDogc3RyaW5nO1xuICBzdGF0dXM6ICdwZW5kaW5nJyB8ICd0cmlhZ2VkJyB8ICdjb21wbGV0ZWQnIHwgJ2Vycm9yJztcbiAgaG90c3BvdHM/OiB7IHRpbWVzdGFtcDogc3RyaW5nOyByZWFzb246IHN0cmluZyB9W107XG4gIGFuYWx5c2lzPzogc3RyaW5nO1xufVxuXG5jb25zdCBBSV9TVFVESU9fVVJMID0gJ2h0dHBzOi8vYWlzdHVkaW8uZ29vZ2xlLmNvbS9hcHAvcHJvbXB0cy9uZXdfY2hhdCc7XG5jb25zdCBUUklBR0VfTU9ERUwgPSAnR2VtaW5pIDMgRmxhc2ggUHJldmlldyc7XG5jb25zdCBERUVQX01PREVMID0gJ0dlbWluaSAzLjEgUHJvIFByZXZpZXcnO1xuXG5jbGFzcyBQcm9WaXN1YWxQcm9jZXNzb3Ige1xuICBwcml2YXRlIGNvbnRleHQ6IEJyb3dzZXJDb250ZXh0IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc3RhdGVGaWxlUGF0aDogc3RyaW5nO1xuICBwcml2YXRlIHJlcG9ydHNEaXI6IHN0cmluZztcbiAgcHJpdmF0ZSBkYXRhOiBhbnk7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgY29uc3QgZGF0YURpciA9ICcvVXNlcnMvZGFuaWVsZ29sZGJlcmcvRGVza3RvcC9BMS1JbnRlci1MTE0tQ29tL1RoZS1OZXctRnVzZS9kYXRhJztcbiAgICB0aGlzLnN0YXRlRmlsZVBhdGggPSBwYXRoLmpvaW4oZGF0YURpciwgJ3Byby1pbmdlc3Rpb24tc3RhdGUuanNvbicpO1xuICAgIHRoaXMucmVwb3J0c0RpciA9IHBhdGguam9pbihkYXRhRGlyLCAncHJvLXZpZGVvLXJlcG9ydHMnKTtcblxuICAgIGZzLm1rZGlyU3luYyh0aGlzLnJlcG9ydHNEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIHRoaXMuZGF0YSA9IHRoaXMubG9hZFN0YXRlKCk7XG4gIH1cblxuICBwcml2YXRlIGxvYWRTdGF0ZSgpIHtcbiAgICBpZiAoZnMuZXhpc3RzU3luYyh0aGlzLnN0YXRlRmlsZVBhdGgpKSB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmModGhpcy5zdGF0ZUZpbGVQYXRoLCAndXRmOCcpKTtcbiAgICB9XG4gICAgcmV0dXJuIHsgcXVldWU6IFtdLCBjdXJyZW50SW5kZXg6IDAgfTtcbiAgfVxuXG4gIHByaXZhdGUgc2F2ZVN0YXRlKCkge1xuICAgIGZzLndyaXRlRmlsZVN5bmModGhpcy5zdGF0ZUZpbGVQYXRoLCBKU09OLnN0cmluZ2lmeSh0aGlzLmRhdGEsIG51bGwsIDIpKTtcbiAgfVxuXG4gIGFzeW5jIGluaXRpYWxpemUoKSB7XG4gICAgY29uc3QgcHJvZmlsZURpciA9IHBhdGguam9pbihwcm9jZXNzLmVudi5IT01FIHx8ICcvdG1wJywgJy52aWRlby1wcm9jZXNzb3ItY2hyb21lLWFsdCcpO1xuICAgIGNvbnN0IGV4dGVuc2lvblBhdGggPVxuICAgICAgJy9Vc2Vycy9kYW5pZWxnb2xkYmVyZy9EZXNrdG9wL0ExLUludGVyLUxMTS1Db20vVGhlLU5ldy1GdXNlL2FwcHMvY2hyb21lLWV4dGVuc2lvbi9haXZpJztcblxuICAgIGNvbnNvbGUubG9nKGBbUHJvXSBMYXVuY2hpbmcgQXV0aGVudGljYXRlZCBDaHJvbWUgd2l0aCBBSVZJIEV4dGVuc2lvbjogJHtwcm9maWxlRGlyfWApO1xuXG4gICAgdGhpcy5jb250ZXh0ID0gYXdhaXQgY2hyb21pdW0ubGF1bmNoUGVyc2lzdGVudENvbnRleHQocHJvZmlsZURpciwge1xuICAgICAgaGVhZGxlc3M6IGZhbHNlLFxuICAgICAgY2hhbm5lbDogJ2Nocm9tZScsXG4gICAgICB2aWV3cG9ydDogeyB3aWR0aDogMTQ0MCwgaGVpZ2h0OiA5MDAgfSxcbiAgICAgIGFyZ3M6IFtcbiAgICAgICAgJy0tbm8tZmlyc3QtcnVuJyxcbiAgICAgICAgJy0tbm8tZGVmYXVsdC1icm93c2VyLWNoZWNrJyxcbiAgICAgICAgYC0tZGlzYWJsZS1leHRlbnNpb25zLWV4Y2VwdD0ke2V4dGVuc2lvblBhdGh9YCxcbiAgICAgICAgYC0tbG9hZC1leHRlbnNpb249JHtleHRlbnNpb25QYXRofWAsXG4gICAgICBdLFxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBkaXNtaXNzRGlhbG9ncyhwYWdlOiBQYWdlKSB7XG4gICAgY29uc3Qgc2VsZWN0b3JzID0gW1xuICAgICAgJ2J1dHRvbjpoYXMtdGV4dChcIkdvdCBpdFwiKScsXG4gICAgICAnYnV0dG9uOmhhcy10ZXh0KFwiQ29udGludWVcIiknLFxuICAgICAgJ1thcmlhLWxhYmVsPVwiQ2xvc2VcIl0nLFxuICAgICAgJ2J1dHRvbjpoYXMtdGV4dChcIkRpc21pc3NcIiknLFxuICAgIF07XG4gICAgZm9yIChjb25zdCBzIG9mIHNlbGVjdG9ycykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgYnRuID0gcGFnZS5sb2NhdG9yKHMpLmZpcnN0KCk7XG4gICAgICAgIGlmIChhd2FpdCBidG4uaXNWaXNpYmxlKCkpIGF3YWl0IGJ0bi5jbGljaygpO1xuICAgICAgfSBjYXRjaCAoZSkge31cbiAgICB9XG4gICAgYXdhaXQgcGFnZS5rZXlib2FyZC5wcmVzcygnRXNjYXBlJyk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNlbGVjdE1vZGVsKHBhZ2U6IFBhZ2UsIG1vZGVsTmFtZTogc3RyaW5nKSB7XG4gICAgY29uc29sZS5sb2coYFtQcm9dIEVuc3VyaW5nIG1vZGVsOiAke21vZGVsTmFtZX1gKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBtb2RlbEJ0biA9IHBhZ2VcbiAgICAgICAgLmxvY2F0b3IoXG4gICAgICAgICAgJy5zZXR0aW5ncy1pdGVtLnNldHRpbmdzLW1vZGVsLXNlbGVjdG9yLCBidXR0b246aGFzLXRleHQoXCJHZW1pbmlcIiksIGJ1dHRvblthcmlhLWxhYmVsKj1cIm1vZGVsXCIgaV0nXG4gICAgICAgIClcbiAgICAgICAgLmZpcnN0KCk7XG4gICAgICBhd2FpdCBtb2RlbEJ0bi53YWl0Rm9yKHsgc3RhdGU6ICd2aXNpYmxlJywgdGltZW91dDogMTUwMDAgfSk7XG5cbiAgICAgIGNvbnN0IGN1cnJlbnRUZXh0ID0gYXdhaXQgbW9kZWxCdG4uaW5uZXJUZXh0KCk7XG4gICAgICBpZiAoY3VycmVudFRleHQuaW5jbHVkZXMobW9kZWxOYW1lKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgW1Byb10g4pyFIE1vZGVsICR7bW9kZWxOYW1lfSBhbHJlYWR5IHNlbGVjdGVkLmApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IG1vZGVsQnRuLmNsaWNrKCk7XG4gICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDE1MDApO1xuXG4gICAgICAvLyBTZWFyY2ggZm9yIHRoZSBtb2RlbCBpbiB0aGUgbWVudVxuICAgICAgY29uc3Qgb3B0aW9ucyA9IHBhZ2UubG9jYXRvcihcbiAgICAgICAgJ1tyb2xlPVwibWVudWl0ZW1cIl0sIFtyb2xlPVwib3B0aW9uXCJdLCAubWF0LW1kYy1tZW51LWl0ZW0sIG1hdC1vcHRpb24nXG4gICAgICApO1xuICAgICAgY29uc3QgdGFyZ2V0ID0gb3B0aW9ucy5maWx0ZXIoeyBoYXNUZXh0OiBtb2RlbE5hbWUgfSkuZmlyc3QoKTtcblxuICAgICAgaWYgKChhd2FpdCB0YXJnZXQuY291bnQoKSkgPiAwKSB7XG4gICAgICAgIGF3YWl0IHRhcmdldC5jbGljaygpO1xuICAgICAgICBjb25zb2xlLmxvZyhgW1Byb10g4pyFIFN3aXRjaGVkIHRvICR7bW9kZWxOYW1lfWApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQnJvYWQgc2VhcmNoIGZhbGxiYWNrXG4gICAgICAgIGNvbnN0IGJyb2FkVGFyZ2V0ID0gb3B0aW9ucy5maWx0ZXIoeyBoYXNUZXh0OiAnMy4xJyB9KS5maWx0ZXIoeyBoYXNUZXh0OiAnUHJvJyB9KS5maXJzdCgpO1xuICAgICAgICBpZiAoKGF3YWl0IGJyb2FkVGFyZ2V0LmNvdW50KCkpID4gMCkge1xuICAgICAgICAgIGF3YWl0IGJyb2FkVGFyZ2V0LmNsaWNrKCk7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1tQcm9dIOKchSBTZWxlY3RlZCAzLjEgUHJvIHZpYSBicm9hZCBtYXRjaCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnNvbGUud2FybihgW1Byb10g4pqg77iPIENvdWxkIG5vdCBmaW5kIGV4YWN0IG1vZGVsICR7bW9kZWxOYW1lfSwga2VlcGluZyBjdXJyZW50LmApO1xuICAgICAgICAgIGF3YWl0IHBhZ2Uua2V5Ym9hcmQucHJlc3MoJ0VzY2FwZScpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDEwMDApO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgY29uc29sZS5lcnJvcihgW1Byb10g4p2MIE1vZGVsIHNlbGVjdGlvbiBmYWlsZWQ6ICR7ZS5tZXNzYWdlfWApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaW5zZXJ0WW91VHViZVZpZGVvKHBhZ2U6IFBhZ2UsIHVybDogc3RyaW5nKSB7XG4gICAgY29uc29sZS5sb2coYFtQcm9dIEluc2VydGluZyBZb3VUdWJlIFZpZGVvOiAke3VybH1gKTtcblxuICAgIC8vIDEuIEZpbmQgYW5kIGNsaWNrIHRoZSBBZGQgQ29udGVudCAoKykgYnV0dG9uIChQaG9lbml4IFN0cmF0ZWd5KVxuICAgIGxldCBhZGRCdG4gPSBwYWdlXG4gICAgICAubG9jYXRvcignW2RhdGEtdGVzdC1pZD1cImFkZC1tZWRpYS1idXR0b25cIl0sIFtkYXRhLXRlc3Q9XCJzZWxlY3RNZWRpYU1lbnVcIl0nKVxuICAgICAgLmZpcnN0KCk7XG4gICAgaWYgKCEoYXdhaXQgYWRkQnRuLmlzVmlzaWJsZSgpKSkge1xuICAgICAgYWRkQnRuID0gcGFnZS5sb2NhdG9yKCdidXR0b246aGFzLXRleHQoXCJhZGRcIiksIGJ1dHRvblthcmlhLWxhYmVsKj1cIkFkZCBjb250ZW50XCIgaV0nKS5maXJzdCgpO1xuICAgIH1cbiAgICBhd2FpdCBhZGRCdG4ud2FpdEZvcih7IHN0YXRlOiAndmlzaWJsZScsIHRpbWVvdXQ6IDE1MDAwIH0pO1xuICAgIGF3YWl0IGFkZEJ0bi5jbGljaygpO1xuICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMjAwMCk7XG5cbiAgICAvLyAyLiBGaW5kIHRoZSBZb3VUdWJlIG9wdGlvbiBpbiB0aGUgbWVudSAoUGhvZW5peCBTdHJhdGVneSlcbiAgICBjb25zdCBtZW51SXRlbXMgPSBwYWdlLmxvY2F0b3IoJ2J1dHRvbiwgW3JvbGU9XCJtZW51aXRlbVwiXSwgLm1hdC1tZGMtbWVudS1pdGVtLCAubWF0LW1lbnUtaXRlbScpO1xuICAgIGNvbnN0IGFsbEl0ZW1zID0gYXdhaXQgbWVudUl0ZW1zLmFsbElubmVyVGV4dHMoKTtcbiAgICBjb25zb2xlLmxvZyhgW1Byb10gTWVudSBpdGVtcyBmb3VuZDogJHthbGxJdGVtcy5qb2luKCcsICcpfWApO1xuXG4gICAgbGV0IHl0QnRuID0gbWVudUl0ZW1zLmZpbHRlcih7IGhhc1RleHQ6IC9Zb3VUdWJlIFZpZGVvL2kgfSkuZmlyc3QoKTtcbiAgICBpZiAoIShhd2FpdCB5dEJ0bi5jb3VudCgpKSkge1xuICAgICAgeXRCdG4gPSBtZW51SXRlbXMuZmlsdGVyKHsgaGFzVGV4dDogL1lvdVR1YmUvaSB9KS5maXJzdCgpO1xuICAgIH1cblxuICAgIGlmICgoYXdhaXQgeXRCdG4uY291bnQoKSkgPT09IDApIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1tQcm9dIOKdjCBZb3VUdWJlIG9wdGlvbiBub3QgZm91bmQgaW4gbWVudS4gQ2hlY2tpbmcgcGx1Z2luIHN0YXRlLi4uJyk7XG4gICAgICBhd2FpdCBwYWdlLnNjcmVlbnNob3QoeyBwYXRoOiAnL3RtcC9wcm9fbWVudV9lcnJvci5qcGcnIH0pO1xuICAgICAgYXdhaXQgcGFnZS5rZXlib2FyZC5wcmVzcygnRXNjYXBlJyk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1lPVVRVQkVfUExVR0lOX01JU1NJTkcnKTtcbiAgICB9XG5cbiAgICBhd2FpdCB5dEJ0bi5jbGljaygpO1xuICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMzAwMCk7XG5cbiAgICAvLyAzLiBGaW5kIGFuZCBmaWxsIHRoZSBVUkwgaW5wdXQgaW4gdGhlIGRpYWxvZyAoUGhvZW5peCBTdHJhdGVneSlcbiAgICBjb25zdCBkaWFsb2cgPSBwYWdlLmxvY2F0b3IoJ21hdC1kaWFsb2ctY29udGFpbmVyLCBbcm9sZT1cImRpYWxvZ1wiXScpLmZpcnN0KCk7XG4gICAgYXdhaXQgZGlhbG9nLndhaXRGb3IoeyBzdGF0ZTogJ3Zpc2libGUnLCB0aW1lb3V0OiAxMDAwMCB9KTtcblxuICAgIGNvbnN0IGlucHV0cyA9IGRpYWxvZy5sb2NhdG9yKCdpbnB1dCcpO1xuICAgIGNvbnN0IGlucHV0Q291bnQgPSBhd2FpdCBpbnB1dHMuY291bnQoKTtcbiAgICBsZXQgdXJsSW5wdXQ6IExvY2F0b3IgfCBudWxsID0gbnVsbDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRDb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCBwaCA9ICgoYXdhaXQgaW5wdXRzLm50aChpKS5nZXRBdHRyaWJ1dGUoJ3BsYWNlaG9sZGVyJykpIHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgY29uc3QgdHlwZSA9ICgoYXdhaXQgaW5wdXRzLm50aChpKS5nZXRBdHRyaWJ1dGUoJ3R5cGUnKSkgfHwgJycpLnRvTG93ZXJDYXNlKCk7XG4gICAgICBpZiAocGguaW5jbHVkZXMoJ3VybCcpIHx8IHBoLmluY2x1ZGVzKCdsaW5rJykgfHwgcGguaW5jbHVkZXMoJ3lvdXR1YmUnKSB8fCB0eXBlID09PSAndXJsJykge1xuICAgICAgICB1cmxJbnB1dCA9IGlucHV0cy5udGgoaSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghdXJsSW5wdXQpIHVybElucHV0ID0gaW5wdXRzLmZpcnN0KCk7XG5cbiAgICBpZiAodXJsSW5wdXQpIHtcbiAgICAgIGF3YWl0IHVybElucHV0LmNsaWNrKCk7XG4gICAgICBhd2FpdCB1cmxJbnB1dC5maWxsKCcnKTsgLy8gQ2xlYXIgZmlyc3RcbiAgICAgIGF3YWl0IHVybElucHV0LnR5cGUodXJsLCB7IGRlbGF5OiAxMCB9KTtcbiAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMTAwMCk7XG4gICAgICBhd2FpdCB1cmxJbnB1dC5wcmVzcygnRW50ZXInKTtcblxuICAgICAgY29uc29sZS5sb2coJ1tQcm9dIOKPsyBXYWl0aW5nIGZvciB2aWRlbyBwcmV2aWV3IHRvIGxvYWQgaW4gZGlhbG9nLi4uJyk7XG4gICAgICAvLyBXYWl0IGZvciB0aGUgXCJZb3VUdWJlIFZpZGVvXCIgZ2VuZXJpYyBoZWFkZXIgaW4gZGlhbG9nIHRvIHBvdGVudGlhbGx5IGNoYW5nZSBvciBmb3IgYSBwcmV2aWV3IHRvIGFwcGVhclxuICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCg1MDAwKTtcbiAgICB9XG5cbiAgICAvLyA0LiBDbGljayBTYXZlL0luc2VydCAod2FpdCBmb3IgaXQgdG8gYmUgZW5hYmxlZClcbiAgICBjb25zdCBzYXZlQnRuID0gZGlhbG9nXG4gICAgICAubG9jYXRvcignYnV0dG9uOmhhcy10ZXh0KFwiU2F2ZVwiKSwgYnV0dG9uOmhhcy10ZXh0KFwiSW5zZXJ0XCIpLCBbZGF0YS10ZXN0LWlkPVwic2F2ZS1idXR0b25cIl0nKVxuICAgICAgLmZpcnN0KCk7XG4gICAgYXdhaXQgc2F2ZUJ0bi53YWl0Rm9yKHsgc3RhdGU6ICd2aXNpYmxlJywgdGltZW91dDogNTAwMCB9KTtcblxuICAgIC8vIEVuc3VyZSBidXR0b24gaXMgc3RhYmxlXG4gICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgyMDAwKTtcblxuICAgIGF3YWl0IHNhdmVCdG4uY2xpY2soeyBmb3JjZTogdHJ1ZSB9KTtcbiAgICBjb25zb2xlLmxvZygnW1Byb10gQ2xpY2tlZCBTYXZlLiBXYWl0aW5nIGZvciBkaWFsb2cgdG8gY2xvc2UuLi4nKTtcblxuICAgIGF3YWl0IGRpYWxvZy53YWl0Rm9yKHsgc3RhdGU6ICdoaWRkZW4nLCB0aW1lb3V0OiAxNTAwMCB9KTtcblxuICAgIC8vIDUuIFZFUklGWSBBVFRBQ0hNRU5UXG4gICAgY29uc29sZS5sb2coJ1tQcm9dIFZlcmlmeWluZyB2aWRlbyBhdHRhY2htZW50Li4uJyk7XG4gICAgY29uc3QgdmlkZW9DaGlwID0gcGFnZVxuICAgICAgLmxvY2F0b3IoXG4gICAgICAgICdtcy1maWxlLWNoaXAsIG1zLW1lZGlhLWNoaXAsIC52aWRlby1jaGlwLCBbZGF0YS10ZXN0LWlkPVwibWVkaWEtY2hpcFwiXSwgLmNoaXAtY29udGVudCdcbiAgICAgIClcbiAgICAgIC5maXJzdCgpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB2aWRlb0NoaXAud2FpdEZvcih7IHN0YXRlOiAndmlzaWJsZScsIHRpbWVvdXQ6IDI1MDAwIH0pO1xuICAgICAgY29uc29sZS5sb2coJ1tQcm9dIOKchSBWaWRlbyBzdWNjZXNzZnVsbHkgYXR0YWNoZWQgdG8gcHJvbXB0LicpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUud2FybignW1Byb10g4pqg77iPIENvdWxkIG5vdCB2ZXJpZnkgdmlkZW8gY2hpcCB2aXNpYmlsaXR5LicpO1xuICAgICAgYXdhaXQgcGFnZS5zY3JlZW5zaG90KHsgcGF0aDogJy90bXAvcHJvX2F0dGFjaG1lbnRfZXJyb3IuanBnJyB9KTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZygnW1Byb10gV2FpdGluZyBmb3IgdmlkZW8gaW5kZXhpbmcgKDI1cykuLi4nKTtcbiAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDI1MDAwKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2V0VGhpbmtpbmdMZXZlbChwYWdlOiBQYWdlLCBsZXZlbDogJ0xvdycgfCAnTWVkaXVtJyB8ICdIaWdoJykge1xuICAgIGNvbnNvbGUubG9nKGBbUHJvXSBTZXR0aW5nIFRoaW5raW5nIExldmVsIHRvOiAke2xldmVsfWApO1xuICAgIGNvbnN0IHRvZ2dsZSA9IHBhZ2UubG9jYXRvcignbXMtdGhpbmtpbmctbGV2ZWwtc2V0dGluZyBtYXQtc2xpZGUtdG9nZ2xlJyk7XG4gICAgaWYgKCEoYXdhaXQgdG9nZ2xlLmdldEF0dHJpYnV0ZSgnY2xhc3MnKSk/LmluY2x1ZGVzKCdtYXQtY2hlY2tlZCcpKSB7XG4gICAgICBhd2FpdCB0b2dnbGUuY2xpY2soKTtcbiAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoNTAwKTtcbiAgICB9XG5cbiAgICBhd2FpdCBwYWdlLmxvY2F0b3IoJ21zLXRoaW5raW5nLWxldmVsLXNldHRpbmcgbWF0LXNlbGVjdCcpLmNsaWNrKCk7XG4gICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCg1MDApO1xuICAgIGF3YWl0IHBhZ2UubG9jYXRvcihgbWF0LW9wdGlvbjpoYXMtdGV4dChcIiR7bGV2ZWx9XCIpYCkuY2xpY2soKTtcbiAgICBhd2FpdCBwYWdlLndhaXRGb3JUaW1lb3V0KDEwMDApO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBlbnN1cmVQYWlkUHJvamVjdChwYWdlOiBQYWdlKSB7XG4gICAgY29uc29sZS5sb2coJ1tQcm9dIEVuc3VyaW5nIGFjdGl2ZSBwcm9qZWN0OiBUaGUgTmV3IEZ1c2UnKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcHJvamVjdEJ0biA9IHBhZ2VcbiAgICAgICAgLmxvY2F0b3IoXG4gICAgICAgICAgJy5wYWlkLWFwaS1rZXktY2FyZCwgYnV0dG9uW2FyaWEtbGFiZWwqPVwicHJvamVjdFwiIGldLCBidXR0b246aGFzLXRleHQoXCJObyBBUEkgS2V5XCIpLCAucHJvamVjdC1zZWxlY3Rvci1idXR0b24nXG4gICAgICAgIClcbiAgICAgICAgLmZpcnN0KCk7XG4gICAgICBhd2FpdCBwcm9qZWN0QnRuLndhaXRGb3IoeyBzdGF0ZTogJ3Zpc2libGUnLCB0aW1lb3V0OiAxNTAwMCB9KTtcbiAgICAgIGF3YWl0IHByb2plY3RCdG4uY2xpY2soKTtcbiAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMjUwMCk7XG5cbiAgICAgIGNvbnN0IHByb2plY3RTZWxlY3QgPSBwYWdlXG4gICAgICAgIC5sb2NhdG9yKCdtYXQtc2VsZWN0W2FyaWEtbGFiZWwqPVwicHJvamVjdFwiIGldLCAubWF0LW1kYy1zZWxlY3QsIFtyb2xlPVwiY29tYm9ib3hcIl0nKVxuICAgICAgICAuZmlyc3QoKTtcbiAgICAgIGF3YWl0IHByb2plY3RTZWxlY3QuY2xpY2soKTtcbiAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMjAwMCk7XG5cbiAgICAgIGNvbnN0IGZ1c2VPcHRpb24gPSBwYWdlXG4gICAgICAgIC5sb2NhdG9yKCdtYXQtb3B0aW9uOmhhcy10ZXh0KFwiVGhlIE5ldyBGdXNlXCIpLCAubWF0LW1kYy1vcHRpb246aGFzLXRleHQoXCJUaGUgTmV3IEZ1c2VcIiknKVxuICAgICAgICAuZmlyc3QoKTtcbiAgICAgIGlmICgoYXdhaXQgZnVzZU9wdGlvbi5jb3VudCgpKSA+IDApIHtcbiAgICAgICAgYXdhaXQgZnVzZU9wdGlvbi5jbGljaygpO1xuICAgICAgICBjb25zb2xlLmxvZygnW1Byb10g4pyFIFNlbGVjdGVkIFwiVGhlIE5ldyBGdXNlXCIgcHJvamVjdCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgZmlyc3RPcHQgPSBwYWdlLmxvY2F0b3IoJ21hdC1vcHRpb24sIC5tYXQtbWRjLW9wdGlvbicpLmZpcnN0KCk7XG4gICAgICAgIGlmICgoYXdhaXQgZmlyc3RPcHQuY291bnQoKSkgPiAwKSBhd2FpdCBmaXJzdE9wdC5jbGljaygpO1xuICAgICAgfVxuICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgxNTAwKTtcblxuICAgICAgY29uc3QgY29uZmlybUJ0biA9IHBhZ2VcbiAgICAgICAgLmxvY2F0b3IoJ2J1dHRvbjpoYXMtdGV4dChcIlNlbGVjdCBrZXlcIiksIGJ1dHRvbjpoYXMtdGV4dChcIkNvbmZpcm1cIiksIC5zZWxlY3Qta2V5LWJ1dHRvbicpXG4gICAgICAgIC5maXJzdCgpO1xuICAgICAgaWYgKGF3YWl0IGNvbmZpcm1CdG4uaXNWaXNpYmxlKCkpIHtcbiAgICAgICAgYXdhaXQgY29uZmlybUJ0bi5jbGljaygpO1xuICAgICAgICBjb25zb2xlLmxvZygnW1Byb10g4pyFIFByb2plY3Qgc2VsZWN0aW9uIGNvbmZpcm1lZCcpO1xuICAgICAgfVxuICAgICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgzMDAwKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGNvbnNvbGUud2FybihgW1Byb10gUHJvamVjdCBzZWxlY3Rpb24gY2hlY2sgZmFpbGVkOiAke2UubWVzc2FnZX0uIChNYXkgYWxyZWFkeSBiZSBzZXQpYCk7XG4gICAgICBhd2FpdCBwYWdlLmtleWJvYXJkLnByZXNzKCdFc2NhcGUnKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGdldEFJUmVzcG9uc2UocGFnZTogUGFnZSwgcHJvbXB0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHRleHRhcmVhID0gcGFnZVxuICAgICAgLmxvY2F0b3IoJ3RleHRhcmVhW2FyaWEtbGFiZWwqPVwicHJvbXB0XCJdLCBkaXZbY29udGVudGVkaXRhYmxlPVwidHJ1ZVwiXScpXG4gICAgICAuZmlyc3QoKTtcbiAgICBhd2FpdCB0ZXh0YXJlYS53YWl0Rm9yKHsgc3RhdGU6ICd2aXNpYmxlJywgdGltZW91dDogMzAwMDAgfSk7XG4gICAgYXdhaXQgdGV4dGFyZWEuY2xpY2soKTtcbiAgICBhd2FpdCB0ZXh0YXJlYS5maWxsKHByb21wdCk7XG4gICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCg1MDApO1xuXG4gICAgY29uc3QgcnVuQnRuID0gcGFnZVxuICAgICAgLmxvY2F0b3IoXG4gICAgICAgICdidXR0b25bYXJpYS1sYWJlbCo9XCJSdW5cIiBpXSwgYnV0dG9uOmhhcy10ZXh0KFwiUnVuXCIpLCBidXR0b25bZGF0YS10ZXN0LWlkPVwicnVuLWJ1dHRvblwiXSdcbiAgICAgIClcbiAgICAgIC5maXJzdCgpO1xuICAgIGF3YWl0IHJ1bkJ0bi53YWl0Rm9yKHsgc3RhdGU6ICd2aXNpYmxlJywgdGltZW91dDogMTAwMDAgfSk7XG5cbiAgICAvLyBFeHBsaWNpdGx5IHByZXNzIEVudGVyIEFORCBjbGljayBSdW4gdG8gYmUgc3VyZVxuICAgIGF3YWl0IHBhZ2Uua2V5Ym9hcmQucHJlc3MoJ0VudGVyJyk7XG4gICAgYXdhaXQgcGFnZS53YWl0Rm9yVGltZW91dCgxMDAwKTtcblxuICAgIGlmICgoYXdhaXQgcnVuQnRuLmlzVmlzaWJsZSgpKSAmJiAhKGF3YWl0IHJ1bkJ0bi5pc0Rpc2FibGVkKCkpKSB7XG4gICAgICBhd2FpdCBydW5CdG4uY2xpY2soeyBmb3JjZTogdHJ1ZSB9KTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZygnW1Byb10gV2FpdGluZyBmb3IgQUkgY29tcGxldGlvbi4uLicpO1xuXG4gICAgLy8gRGV0ZWN0IGVycm9ycyBkdXJpbmcgd2FpdFxuICAgIGNvbnN0IGVycm9yVG9hc3QgPSBwYWdlXG4gICAgICAubG9jYXRvcihcbiAgICAgICAgJ21hdC1zbmFjay1iYXItY29udGFpbmVyLCAuZXJyb3ItbWVzc2FnZSwgOnRleHQoXCJQZXJtaXNzaW9uIGRlbmllZFwiKSwgOnRleHQoXCJGYWlsZWQgdG8gZ2VuZXJhdGVcIiknXG4gICAgICApXG4gICAgICAuZmlyc3QoKTtcblxuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgd2hpbGUgKERhdGUubm93KCkgLSBzdGFydFRpbWUgPCAzNjAwMDApIHtcbiAgICAgIC8vIDYgbWluIHRpbWVvdXRcbiAgICAgIGlmIChhd2FpdCBlcnJvclRvYXN0LmlzVmlzaWJsZSgpKSB7XG4gICAgICAgIGNvbnN0IGVyclRleHQgPSBhd2FpdCBlcnJvclRvYXN0LmlubmVyVGV4dCgpO1xuICAgICAgICBjb25zb2xlLmVycm9yKGBbUHJvXSDinYwgRGV0ZWN0ZWQgRXJyb3I6ICR7ZXJyVGV4dH1gKTtcbiAgICAgICAgLy8gSWYgaXQgaXMgYSBwZXJtaXNzaW9uIGVycm9yLCB3ZSBzaG91bGQgdHJ5IHRvIHN3aXRjaCBwcm9qZWN0IG9yIG5vdGlmeVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEFJX1NUVURJT19FUlJPUjogJHtlcnJUZXh0fWApO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjb3B5QnRuID0gcGFnZS5sb2NhdG9yKCdidXR0b25bYXJpYS1sYWJlbCo9XCJDb3B5XCIgaV0nKS5sYXN0KCk7XG4gICAgICBpZiAoYXdhaXQgY29weUJ0bi5pc1Zpc2libGUoKSkgYnJlYWs7XG5cbiAgICAgIGF3YWl0IHBhZ2Uud2FpdEZvclRpbWVvdXQoMzAwMCk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzcG9uc2VDb250YWluZXIgPSBwYWdlXG4gICAgICAubG9jYXRvcignbXMtY2hhdC10dXJuLm1vZGVsIC50dXJuLWNvbnRlbnQsIC5jaGF0LXR1cm4tY29udGFpbmVyLm1vZGVsIC50dXJuLWNvbnRlbnQnKVxuICAgICAgLmxhc3QoKTtcbiAgICByZXR1cm4gYXdhaXQgcmVzcG9uc2VDb250YWluZXIuaW5uZXJUZXh0KCk7XG4gIH1cblxuICBhc3luYyBwcm9jZXNzVmlkZW8odmlkZW86IFZpZGVvRW50cnkpIHtcbiAgICBpZiAodmlkZW8uc3RhdHVzID09PSAnY29tcGxldGVkJykgcmV0dXJuO1xuXG4gICAgbGV0IHJldHJpZXMgPSAyO1xuICAgIHdoaWxlIChyZXRyaWVzID49IDApIHtcbiAgICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCB0aGlzLmNvbnRleHQhLm5ld1BhZ2UoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHBhZ2UuZ290byhBSV9TVFVESU9fVVJMLCB7IHdhaXRVbnRpbDogJ25ldHdvcmtpZGxlJyB9KTtcbiAgICAgICAgYXdhaXQgdGhpcy5kaXNtaXNzRGlhbG9ncyhwYWdlKTtcbiAgICAgICAgYXdhaXQgdGhpcy5lbnN1cmVQYWlkUHJvamVjdChwYWdlKTtcblxuICAgICAgICAvLyAtLS0gU1RBR0UgMTogVFJJQUdFIChGTEFTSCkgLS0tXG4gICAgICAgIGNvbnNvbGUubG9nKGBcXG4tLS0gU1RBR0UgMTogVHJpYWdlICMke3ZpZGVvLmluZGV4fSAtLS1gKTtcbiAgICAgICAgYXdhaXQgdGhpcy5zZWxlY3RNb2RlbChwYWdlLCBUUklBR0VfTU9ERUwpO1xuICAgICAgICBhd2FpdCB0aGlzLmluc2VydFlvdVR1YmVWaWRlbyhwYWdlLCB2aWRlby51cmwpO1xuXG4gICAgICAgIGNvbnN0IHRyaWFnZVByb21wdCA9IGBZb3UgYXJlIGEgdmlkZW8gdGVjaG5pY2FsIGFuYWx5c3QuIFBlcmZvcm0gYSB2aXN1YWwgc2NhbiBvZiB0aGlzIGVudGlyZSB2aWRlbyBhdCBhcHByb3hpbWF0ZWx5IDEgRlBTLiBJZGVudGlmeSBldmVyeSB0aW1lc3RhbXAgd2hlcmUgYSBuZXcgYXJjaGl0ZWN0dXJhbCBkaWFncmFtLCBjb2RlIHNuaXBwZXQsIG9yIG1ham9yIHRlY2huaWNhbCBVSSBzaGlmdCBvY2N1cnMuIEZvcm1hdCB5b3VyIHJlc3BvbnNlIGFzIGEgbGlzdCBvZiB0aW1lc3RhbXBzIChISDpNTTpTUykgZm9sbG93ZWQgYnkgYSBzaG9ydCBkZXNjcmlwdGlvbjogW1RTXSAtIFtEZXNjcmlwdGlvbl0uIEZvY3VzIG9ubHkgb24gdGhlIG1vc3QgdGVjaG5pY2FsbHkgZGVuc2UgbW9tZW50cy5gO1xuXG4gICAgICAgIGNvbnN0IHRyaWFnZVJlc3BvbnNlID0gYXdhaXQgdGhpcy5nZXRBSVJlc3BvbnNlKHBhZ2UsIHRyaWFnZVByb21wdCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbUHJvXSBUcmlhZ2UgUmVzdWx0czpcXG4ke3RyaWFnZVJlc3BvbnNlfWApO1xuXG4gICAgICAgIGNvbnN0IHRzTWF0Y2hlcyA9IHRyaWFnZVJlc3BvbnNlLm1hdGNoKC8oXFxkezEsMn06XFxkezJ9OlxcZHsyfXxcXGR7MSwyfTpcXGR7Mn0pL2cpO1xuICAgICAgICB2aWRlby5ob3RzcG90cyA9ICh0c01hdGNoZXMgfHwgW10pLm1hcCgodHMpID0+ICh7XG4gICAgICAgICAgdGltZXN0YW1wOiB0cyxcbiAgICAgICAgICByZWFzb246ICdUZWNobmljYWwgSG90c3BvdCcsXG4gICAgICAgIH0pKTtcbiAgICAgICAgdmlkZW8uc3RhdHVzID0gJ3RyaWFnZWQnO1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKGBbUHJvXSBUcmlhZ2UgQ29tcGxldGUuIEZvdW5kICR7dmlkZW8uaG90c3BvdHMubGVuZ3RofSBob3RzcG90cy5gKTtcblxuICAgICAgICAvLyAtLS0gU1RBR0UgMjogREVFUCBBTkFMWVNJUyAoUFJPKSAtLS1cbiAgICAgICAgY29uc29sZS5sb2coYFxcbi0tLSBTVEFHRSAyOiBEZWVwIEFuYWx5c2lzICMke3ZpZGVvLmluZGV4fSAtLS1gKTtcbiAgICAgICAgYXdhaXQgdGhpcy5zZWxlY3RNb2RlbChwYWdlLCBERUVQX01PREVMKTtcbiAgICAgICAgYXdhaXQgdGhpcy5zZXRUaGlua2luZ0xldmVsKHBhZ2UsICdIaWdoJyk7XG5cbiAgICAgICAgbGV0IGNvbXByZWhlbnNpdmVBbmFseXNpcyA9IGAjIFBybyBUZWNobmljYWwgQW5hbHlzaXM6ICR7dmlkZW8udGl0bGV9XFxuXFxuYDtcblxuICAgICAgICBmb3IgKGNvbnN0IGhvdHNwb3Qgb2YgKHZpZGVvLmhvdHNwb3RzIHx8IFtdKS5zbGljZSgwLCA1KSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBbUHJvXSBEZWVwbHkgcmVhc29uaW5nIG92ZXIgaG90c3BvdDogJHtob3RzcG90LnRpbWVzdGFtcH1gKTtcbiAgICAgICAgICBjb25zdCBkZWVwUHJvbXB0ID0gYFBlcmZvcm0gYW4gZXh0ZW5zaXZlIGludGVybmFsIHJlYXNvbmluZyBjaGFpbiB0byBhbmFseXplIHRoZSB2aXN1YWwgaW5mb3JtYXRpb24gYXQgZXhhY3RseSAke2hvdHNwb3QudGltZXN0YW1wfS4gSWRlbnRpZnkgdGhlIGFyY2hpdGVjdHVyYWwgZGlhZ3JhbXMsIGNvbXBvbmVudHMsIG9yIGNvZGUgc25pcHBldHMgc2hvd24uIERlc2NyaWJlIHRoZW0gd2l0aCBoaWdoIHRlY2huaWNhbCBmaWRlbGl0eS5gO1xuXG4gICAgICAgICAgY29uc3QgZGVlcFJlc3VsdCA9IGF3YWl0IHRoaXMuZ2V0QUlSZXNwb25zZShwYWdlLCBkZWVwUHJvbXB0KTtcbiAgICAgICAgICBjb21wcmVoZW5zaXZlQW5hbHlzaXMgKz0gYCMjIyBBbmFseXNpcyBAICR7aG90c3BvdC50aW1lc3RhbXB9XFxuJHtkZWVwUmVzdWx0fVxcblxcbmA7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZXBvcnRQYXRoID0gcGF0aC5qb2luKHRoaXMucmVwb3J0c0RpciwgYHByb18ke3ZpZGVvLmluZGV4fV8ke3ZpZGVvLnZpZGVvSWR9Lm1kYCk7XG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMocmVwb3J0UGF0aCwgY29tcHJlaGVuc2l2ZUFuYWx5c2lzKTtcbiAgICAgICAgY29uc29sZS5sb2coYFtQcm9dIOKchSBGaW5hbCBSZXBvcnQgU2F2ZWQ6ICR7cmVwb3J0UGF0aH1gKTtcblxuICAgICAgICB2aWRlby5zdGF0dXMgPSAnY29tcGxldGVkJztcbiAgICAgICAgdGhpcy5zYXZlU3RhdGUoKTtcbiAgICAgICAgYXdhaXQgcGFnZS5jbG9zZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBbUHJvXSDinYwgQXR0ZW1wdCBmYWlsZWQ6ICR7ZS5tZXNzYWdlfWApO1xuICAgICAgICByZXRyaWVzLS07XG4gICAgICAgIGF3YWl0IHBhZ2UuY2xvc2UoKTtcbiAgICAgICAgaWYgKHJldHJpZXMgPj0gMCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBbUHJvXSDwn5SEIFJldHJ5aW5nIGluIDEwcy4uLiAoJHtyZXRyaWVzfSBsZWZ0KWApO1xuICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyKSA9PiBzZXRUaW1lb3V0KHIsIDEwMDAwKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBhc3luYyBydW4oc3RhcnRJbmRleDogbnVtYmVyLCBlbmRJbmRleDogbnVtYmVyKSB7XG4gICAgYXdhaXQgdGhpcy5pbml0aWFsaXplKCk7XG5cbiAgICBjb25zdCBsaWJyYXJ5UGF0aCA9XG4gICAgICAnL1VzZXJzL2RhbmllbGdvbGRiZXJnL0Rlc2t0b3AvQTEtSW50ZXItTExNLUNvbS9teS1haS1rbm93bGVkZ2UtYmFzZS92aWRlby1saWJyYXJ5L2FpX3ZpZGVvX2xpYnJhcnkuaHRtbCc7XG4gICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhsaWJyYXJ5UGF0aCwgJ3V0Zi04Jyk7XG4gICAgY29uc3QgcXVldWU6IFZpZGVvRW50cnlbXSA9IFtdO1xuXG4gICAgY29uc3Qgcm93UmVnZXggPVxuICAgICAgLzx0cj5cXHMqPHRkW14+XSo+XFxzKihcXGQrKVxccyo8XFwvdGQ+XFxzKjx0ZFtePl0qPlxccyo8YVxccytocmVmPVwiKFteXCJdKylcIltePl0qPihbXjxdKyk8XFwvYT5cXHMqPFxcL3RkPi9nO1xuICAgIGxldCBtYXRjaDtcbiAgICB3aGlsZSAoKG1hdGNoID0gcm93UmVnZXguZXhlYyhjb250ZW50KSkgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gcGFyc2VJbnQobWF0Y2hbMV0pO1xuICAgICAgaWYgKGluZGV4IDw9IHN0YXJ0SW5kZXggJiYgaW5kZXggPj0gZW5kSW5kZXgpIHtcbiAgICAgICAgY29uc3QgdXJsID0gbWF0Y2hbMl07XG4gICAgICAgIGNvbnN0IHZpZGVvSWQgPSB1cmwubWF0Y2goL3Y9KFteJl0rKS8pPy5bMV0gfHwgdXJsLnNwbGl0KCcvJykucG9wKCkgfHwgJyc7XG4gICAgICAgIHF1ZXVlLnB1c2goe1xuICAgICAgICAgIGluZGV4LFxuICAgICAgICAgIHVybCxcbiAgICAgICAgICB0aXRsZTogbWF0Y2hbM10udHJpbSgpLFxuICAgICAgICAgIHZpZGVvSWQsXG4gICAgICAgICAgc3RhdHVzOiAncGVuZGluZycsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHF1ZXVlLnNvcnQoKGEsIGIpID0+IGIuaW5kZXggLSBhLmluZGV4KTtcbiAgICB0aGlzLmRhdGEucXVldWUgPSBxdWV1ZTtcbiAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuXG4gICAgZm9yIChjb25zdCB2aWRlbyBvZiBxdWV1ZSkge1xuICAgICAgY29uc29sZS5sb2coYFxcbvCfmoAgU3RhcnRpbmcgUHJvIFByb2Nlc3NpbmcgZm9yICMke3ZpZGVvLmluZGV4fTogJHt2aWRlby50aXRsZX1gKTtcbiAgICAgIGF3YWl0IHRoaXMucHJvY2Vzc1ZpZGVvKHZpZGVvKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5jb250ZXh0KSBhd2FpdCB0aGlzLmNvbnRleHQuY2xvc2UoKTtcbiAgfVxufVxuXG4vLyBDTEkgRW50cnlwb2ludFxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIGNvbnN0IHByb2Nlc3NvciA9IG5ldyBQcm9WaXN1YWxQcm9jZXNzb3IoKTtcbiAgY29uc3Qgc3RhcnQgPSBwYXJzZUludChwcm9jZXNzLmFyZ3ZbMl0pIHx8IDY5MjtcbiAgY29uc3QgZW5kID0gcGFyc2VJbnQocHJvY2Vzcy5hcmd2WzNdKSB8fCA2NDg7XG4gIHByb2Nlc3Nvci5ydW4oc3RhcnQsIGVuZCkuY2F0Y2goY29uc29sZS5lcnJvcik7XG59XG4iXX0=