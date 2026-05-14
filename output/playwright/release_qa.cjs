const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARCADE_URL = 'https://ai-arcade.xyz';
const MUSIC_URL = 'https://open-audio-deck-production.thenewfuse.com';
const outDir = '/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/output/playwright';
fs.mkdirSync(outDir, { recursive: true });

const results = {
  urls: { ARCADE_URL, MUSIC_URL },
  desktop: {},
  mobile: {},
  music: {},
  launchNewTabUrl: null,
  errors: []
};

async function safe(name, fn) {
  try {
    const v = await fn();
    return { pass: true, detail: v ?? 'ok' };
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    results.errors.push(`${name}: ${msg}`);
    return { pass: false, detail: msg };
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Desktop Arcade checks
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(ARCADE_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.screenshot({ path: path.join(outDir, 'arcade-desktop-home.png'), fullPage: true });

  results.desktop.featuredOpenAudioDeck = await safe('featuredOpenAudioDeck', async () => {
    const card = page.locator('text=Open Audio Deck').first();
    await card.waitFor({ timeout: 15000 });
    return 'Open Audio Deck visible';
  });

  results.desktop.musicFilter = await safe('musicFilter', async () => {
    const musicButton = page.getByRole('button', { name: /music/i }).first();
    await musicButton.click({ timeout: 10000 });
    await page.waitForTimeout(1200);
    const visible = await page.locator('text=Open Audio Deck').first().isVisible();
    if (!visible) throw new Error('Open Audio Deck not visible after Music filter');
    await page.screenshot({ path: path.join(outDir, 'arcade-desktop-music-filter.png'), fullPage: true });
    return 'Music filter retains Open Audio Deck';
  });

  results.desktop.cardCtaListen = await safe('cardCtaListen', async () => {
    const listen = page.getByRole('button', { name: /^listen$/i }).first();
    await listen.waitFor({ timeout: 10000 });
    return 'LISTEN CTA present on card';
  });

  results.desktop.modalCopy = await safe('modalCopy', async () => {
    const detailTrigger = page.getByText('Open Audio Deck').first();
    await detailTrigger.click({ timeout: 10000 });
    await page.waitForTimeout(1200);
    const freeOpen = page.locator('text=/FREE\s*\/\s*OPEN/i').first();
    const launch = page.getByRole('button', { name: /launch experience/i }).first();
    await freeOpen.waitFor({ timeout: 10000 });
    await launch.waitFor({ timeout: 10000 });
    await page.screenshot({ path: path.join(outDir, 'arcade-desktop-modal.png'), fullPage: true });
    return 'Modal shows FREE / OPEN and Launch Experience';
  });

  results.desktop.newTabLaunch = await safe('newTabLaunch', async () => {
    const launchButton = page.getByRole('button', { name: /launch experience/i }).first();
    const [newPage] = await Promise.all([
      context.waitForEvent('page', { timeout: 15000 }),
      launchButton.click()
    ]);
    await newPage.waitForLoadState('domcontentloaded', { timeout: 30000 });
    results.launchNewTabUrl = newPage.url();
    await newPage.screenshot({ path: path.join(outDir, 'music-new-tab-launched.png'), fullPage: true });
    if (!results.launchNewTabUrl.includes('open-audio-deck-production.thenewfuse.com')) {
      throw new Error(`Unexpected launch URL: ${results.launchNewTabUrl}`);
    }
    await newPage.close();
    return `New tab URL: ${results.launchNewTabUrl}`;
  });

  // Mobile arcade checks
  const mobileContext = await browser.newContext({ ...devices['iPhone 13'] });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(ARCADE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await mobilePage.waitForTimeout(2500);
  await mobilePage.screenshot({ path: path.join(outDir, 'arcade-mobile-home.png'), fullPage: true });

  results.mobile.featuredOpenAudioDeck = await safe('mobileFeaturedOpenAudioDeck', async () => {
    const card = mobilePage.locator('text=Open Audio Deck').first();
    await card.waitFor({ timeout: 15000 });
    return 'Open Audio Deck visible on mobile';
  });

  results.mobile.musicFilter = await safe('mobileMusicFilter', async () => {
    const music = mobilePage.getByRole('button', { name: /music/i }).first();
    await music.click({ timeout: 10000 });
    await mobilePage.waitForTimeout(1200);
    const visible = await mobilePage.locator('text=Open Audio Deck').first().isVisible();
    if (!visible) throw new Error('Open Audio Deck missing after mobile Music filter');
    await mobilePage.screenshot({ path: path.join(outDir, 'arcade-mobile-music-filter.png'), fullPage: true });
    return 'Music filter works on mobile';
  });

  // Music app checks
  const musicContext = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  const musicPage = await musicContext.newPage();
  await musicPage.goto(MUSIC_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await musicPage.waitForTimeout(3000);
  await musicPage.screenshot({ path: path.join(outDir, 'music-home.png'), fullPage: true });

  results.music.homepageLoads = await safe('musicHomepageLoads', async () => {
    const title = await musicPage.title();
    if (!title) throw new Error('No page title');
    return `title: ${title}`;
  });

  results.music.trendingLoads = await safe('musicTrendingLoads', async () => {
    const hasTrendingText = await musicPage.locator('text=/trending/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    const cards = await musicPage.locator('img, [class*="track"], [class*="song"]').count();
    if (!hasTrendingText && cards < 3) throw new Error('Trending section/signals not detected');
    return `trendingText=${hasTrendingText}, mediaNodes=${cards}`;
  });

  results.music.searchWorks = await safe('musicSearchWorks', async () => {
    const input = musicPage.locator('input[type="search"], input[placeholder*="Search" i], input[aria-label*="Search" i]').first();
    await input.click({ timeout: 10000 });
    await input.fill('lofi');
    await input.press('Enter');
    await musicPage.waitForTimeout(2500);
    await musicPage.screenshot({ path: path.join(outDir, 'music-search-lofi.png'), fullPage: true });
    return 'Search input accepted query "lofi"';
  });

  results.music.playbackStarts = await safe('musicPlaybackStarts', async () => {
    const playButton = musicPage.locator('button[aria-label*="Play" i], button:has-text("Play"), button:has-text("▶")').first();
    await playButton.click({ timeout: 10000 });
    await musicPage.waitForTimeout(3500);
    const playbackState = await musicPage.evaluate(() => {
      const audio = document.querySelector('audio');
      if (!audio) return { hasAudio: false, playing: false, currentTime: 0 };
      return { hasAudio: true, playing: !audio.paused, currentTime: audio.currentTime };
    });
    await musicPage.screenshot({ path: path.join(outDir, 'music-playback-attempt.png'), fullPage: true });
    if (!playbackState.hasAudio) {
      throw new Error('No audio element found after play click');
    }
    if (!playbackState.playing && playbackState.currentTime <= 0) {
      throw new Error(`Audio not playing, currentTime=${playbackState.currentTime}`);
    }
    return JSON.stringify(playbackState);
  });

  await context.close();
  await mobileContext.close();
  await musicContext.close();
  await browser.close();

  fs.writeFileSync(path.join(outDir, 'release-qa-results.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
})();
