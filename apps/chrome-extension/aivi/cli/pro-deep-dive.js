/**
 * Pro Deep Dive Processor (Stage 2)
 *
 * Automates Gemini 3.1 Pro (Thinking: High) in AI Studio for
 * deep technical analysis of hotspots identified during Stage 1 Triage.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const AI_STUDIO_URL = 'https://aistudio.google.com/app/prompts/new_chat';
const DEEP_MODEL = 'Gemini 3.1 Pro Preview';
const DATA_DIR = '/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data';
const REPORTS_DIR = path.join(DATA_DIR, 'video-reports');
const PRO_REPORTS_DIR = path.join(DATA_DIR, 'pro-deep-dives');

fs.mkdirSync(PRO_REPORTS_DIR, { recursive: true });

async function dismissDialogs(page) {
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

async function ensurePaidProject(page) {
  console.log('[DeepDive] Ensuring active project: The New Fuse');
  try {
    const projectBtn = page
      .locator(
        '.paid-api-key-card, button[aria-label*="project" i], button:has-text("No API Key"), .project-selector-button'
      )
      .first();
    await projectBtn.waitFor({ state: 'visible', timeout: 15000 });
    await projectBtn.click();
    await page.waitForTimeout(2000);

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
      console.log('[DeepDive] ✅ Selected "The New Fuse" project');
    } else {
      const firstOpt = page.locator('mat-option, .mat-mdc-option').first();
      if ((await firstOpt.count()) > 0) await firstOpt.click();
    }
    await page.waitForTimeout(1500);

    const confirmBtn = page
      .locator('button:has-text("Select key"), button:has-text("Confirm"), .select-key-button')
      .first();
    if (await confirmBtn.isVisible()) await confirmBtn.click();
    await page.waitForTimeout(3000);
  } catch (e) {
    console.warn(`[DeepDive] Project selection check failed: ${e.message}`);
    await page.keyboard.press('Escape');
  }
}

async function selectModel(page, modelName) {
  console.log(`[DeepDive] Ensuring model: ${modelName}`);
  try {
    const modelBtn = page
      .locator(
        '.settings-item.settings-model-selector, button:has-text("Gemini"), button[aria-label*="model" i]'
      )
      .first();
    await modelBtn.waitFor({ state: 'visible', timeout: 15000 });

    const currentText = await modelBtn.innerText();
    if (currentText.includes(modelName)) {
      console.log(`[DeepDive] ✅ Model ${modelName} already selected.`);
      return;
    }

    await modelBtn.click();
    await page.waitForTimeout(1500);

    const options = page.locator(
      '[role="menuitem"], [role="option"], .mat-mdc-menu-item, mat-option'
    );
    const target = options.filter({ hasText: modelName }).first();

    if ((await target.count()) > 0) {
      await target.click();
      console.log(`[DeepDive] ✅ Switched to ${modelName}`);
    } else {
      console.warn(`[DeepDive] ⚠️ Could not find exact model ${modelName}.`);
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(1000);
  } catch (e) {
    console.error(`[DeepDive] ❌ Model selection failed: ${e.message}`);
  }
}

async function setThinkingLevel(page, level) {
  console.log(`[DeepDive] Setting Thinking Level to: ${level}`);
  try {
    const toggle = page.locator('ms-thinking-level-setting mat-slide-toggle');
    if (!(await toggle.getAttribute('class')).includes('mat-checked')) {
      await toggle.click();
      await page.waitForTimeout(1000);
    }

    await page.locator('ms-thinking-level-setting mat-select').click();
    await page.waitForTimeout(1000);
    await page.locator(`mat-option:has-text("${level}")`).click();
    await page.waitForTimeout(1000);
  } catch (e) {
    console.warn('[DeepDive] ⚠️ Thinking Level adjustment failed (might be default).');
  }
}

async function addYouTubeVideo(page, url) {
  console.log(`[DeepDive] Inserting YouTube Video: ${url}`);

  // 1. Open Menu
  const addBtn = page
    .locator(
      '[data-test-id="add-media-button"], [data-test="selectMediaMenu"], button[aria-label*="Add content" i]'
    )
    .first();
  await addBtn.waitFor({ state: 'visible', timeout: 15000 });
  await addBtn.click();
  await page.waitForTimeout(2000);

  // 2. Select YouTube (be aggressive)
  const menuItems = page.locator('button, [role="menuitem"], .mat-mdc-menu-item, .mat-menu-item');
  const ytBtn = menuItems.filter({ hasText: /YouTube/i }).first();

  if ((await ytBtn.count()) === 0) {
    console.error('[DeepDive] ❌ YouTube plugin not found in menu. Logging items...');
    const items = await menuItems.allInnerTexts();
    console.log(`[DeepDive] Found: ${items.join(', ')}`);
    throw new Error('YOUTUBE_PLUGIN_MISSING');
  }

  await ytBtn.click();
  await page.waitForTimeout(3000);

  // 3. Fill Dialog via direct evaluation (Bypasses locator issues)
  const dialog = page.locator('mat-dialog-container, [role="dialog"]').first();
  await dialog.waitFor({ state: 'visible', timeout: 10000 });

  await page.evaluate((ytUrl) => {
    const inputs = document.querySelectorAll('mat-dialog-container input');
    for (const input of inputs) {
      if (
        input.placeholder?.toLowerCase().includes('url') ||
        input.getAttribute('aria-label')?.toLowerCase().includes('youtube')
      ) {
        input.value = ytUrl;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
    }
    // Fallback to first input
    if (inputs.length > 0) {
      inputs[0].value = ytUrl;
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, url);

  await page.waitForTimeout(2000);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(5000);

  // 4. Click Save
  const saveBtn = dialog
    .locator('button:has-text("Save"), button:has-text("Insert"), [data-test-id="save-button"]')
    .first();
  await saveBtn.click({ force: true });

  await dialog.waitFor({ state: 'hidden', timeout: 15000 });

  // 5. Verify Chip
  const videoChip = page
    .locator('ms-file-chip, ms-media-chip, .video-chip, .chip-content, mat-chip')
    .first();
  await videoChip.waitFor({ state: 'visible', timeout: 30000 });
  console.log('[DeepDive] ✅ Video successfully attached to prompt area.');
}

async function getAIResponse(page, prompt) {
  const textarea = page
    .locator('textarea[aria-label*="prompt"], div[contenteditable="true"]')
    .first();
  await textarea.waitFor({ state: 'visible', timeout: 30000 });
  await textarea.click();
  await textarea.fill(prompt);
  await page.waitForTimeout(1000);

  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
  await page.keyboard.press(`${modifier}+Enter`);
  await page.waitForTimeout(2000);

  const runBtn = page
    .locator(
      'button[aria-label*="Run" i], button:has-text("Run"), button[data-test-id="run-button"]'
    )
    .first();
  if ((await runBtn.isVisible()) && !(await runBtn.isDisabled())) {
    await runBtn.click({ force: true });
  }

  console.log('[DeepDive] Waiting for deep thinking...');
  const copyBtn = page.locator('button[aria-label*="Copy" i]').last();
  await copyBtn.waitFor({ state: 'visible', timeout: 600000 }); // 10 min for Thinking models

  const responseContainer = page
    .locator('ms-chat-turn.model .turn-content, .chat-turn-container.model .turn-content')
    .last();
  return await responseContainer.innerText();
}

async function runDeepDive(index, videoId, url) {
  const triageFile = path.join(REPORTS_DIR, `api_${index}_${videoId}.md`);
  if (!fs.existsSync(triageFile)) {
    console.error(`[DeepDive] ❌ Triage report missing for #${index}`);
    return;
  }

  const content = fs.readFileSync(triageFile, 'utf8');
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
  if (!jsonMatch) {
    console.error(`[DeepDive] ❌ No JSON analysis found in triage report`);
    return;
  }

  const triageData = JSON.parse(jsonMatch[1]);
  const hotspots = triageData.visualContextFlags || [];
  if (hotspots.length === 0) {
    console.log(`[DeepDive] ⏭️ No visual hotspots identified for #${index}`);
    return;
  }

  console.log(`[DeepDive] 🚀 Deep diving into #${index}: ${hotspots.length} hotspots found.`);

  const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-alt');
  const browser = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    channel: 'chrome',
    viewport: { width: 1440, height: 900 },
    args: ['--no-first-run', '--no-default-browser-check'],
  });

  const page = await browser.newPage();
  try {
    await page.goto(AI_STUDIO_URL, { waitUntil: 'networkidle' });
    await dismissDialogs(page);
    await ensurePaidProject(page);
    await selectModel(page, DEEP_MODEL);
    await setThinkingLevel(page, 'High');
    await addYouTubeVideo(page, url);

    let deepIntelligence = `# Pro Deep Dive Intelligence: ${videoId}\n\n`;

    // Process top 3 most technical hotspots to save time but get depth
    for (const spot of hotspots.slice(0, 3)) {
      console.log(`[DeepDive] 🧠 Analyzing hotspot @ ${spot.timestamp}: ${spot.description}`);
      const prompt = `Perform an extensive technical deep-dive into the architectural diagram or code shown at exactly ${spot.timestamp}. 
      Reconstruct the logic, components, and data flow. Format your findings as structured technical intelligence.`;

      const result = await getAIResponse(page, prompt);
      deepIntelligence += `## 🦾 Hotspot Analysis @ ${spot.timestamp}\n**Context:** ${spot.description}\n\n${result}\n\n---\n\n`;
    }

    const outputFile = path.join(PRO_REPORTS_DIR, `deep_${index}_${videoId}.md`);
    fs.writeFileSync(outputFile, deepIntelligence);
    console.log(`[DeepDive] ✅ Deep Intelligence saved to ${outputFile}`);
  } catch (e) {
    console.error(`[DeepDive] ❌ Automation error:`, e.message);
  } finally {
    await browser.close();
  }
}

// CLI
if (require.main === module) {
  const index = process.argv[2];
  const videoId = process.argv[3];
  const url = process.argv[4];
  if (!index || !videoId || !url) {
    console.log('Usage: node pro-deep-dive.js <index> <videoId> <url>');
    process.exit(1);
  }
  runDeepDive(index, videoId, url).catch(console.error);
}
