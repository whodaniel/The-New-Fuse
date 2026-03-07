#!/usr/bin/env node
import { chromium } from 'playwright';

function arg(name, fallback = '') {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  if (found) return found.slice(prefix.length);
  return process.env[name.toUpperCase().replace(/-/g, '_')] || fallback;
}

const appName = arg('app-name', 'tnf-zeroclaw-sandbox-discord');
const headless = arg('headless', 'false') === 'true';
const timeoutMs = Number(arg('timeout-ms', '900000')); // 15m
const userDataDir = arg('user-data-dir', '.tmp/discord-playwright-profile');
const executablePath = arg(
  'executable-path',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
);

async function clickIfVisible(page, selectors) {
  for (const selector of selectors) {
    const loc = page.locator(selector).first();
    if (await loc.isVisible().catch(() => false)) {
      await loc.click({ timeout: 5000 }).catch(() => {});
      return true;
    }
  }
  return false;
}

async function waitForAny(page, selectors, timeout) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    for (const selector of selectors) {
      const loc = page.locator(selector).first();
      if (await loc.isVisible().catch(() => false)) return selector;
    }
    await page.waitForTimeout(1000);
  }
  throw new Error(`Timeout waiting for selectors: ${selectors.join(' | ')}`);
}

async function ensureLoggedIn(page) {
  await page.goto('https://discord.com/developers/applications', { waitUntil: 'domcontentloaded' });
  const sel = await waitForAny(
    page,
    [
      'button:has-text("New Application")',
      'a:has-text("New Application")',
      'button:has-text("Log In")',
      'a:has-text("Log In")',
      'text=Login',
    ],
    timeoutMs,
  );

  if (sel.includes('Log In') || sel.includes('Login')) {
    console.log('LOGIN_REQUIRED: Please complete Discord login in the opened browser window. Waiting...');
    await waitForAny(
      page,
      ['button:has-text("New Application")', 'a:has-text("New Application")'],
      timeoutMs,
    );
  }
}

async function createOrReuseApp(page, name) {
  const appLink = page.locator(`a:has-text("${name}")`).first();
  if (await appLink.isVisible().catch(() => false)) {
    await appLink.click();
    return 'reused';
  }

  const opened = await clickIfVisible(page, ['button:has-text("New Application")', 'a:has-text("New Application")']);
  if (!opened) throw new Error('Could not find New Application button');

  const nameInput = page.locator('input[placeholder*="Name"], input[name="name"], input').first();
  await nameInput.fill(name);

  const createClicked = await clickIfVisible(page, [
    'button:has-text("Create")',
    'button:has-text("Create Application")',
  ]);
  if (!createClicked) throw new Error('Could not click Create Application');

  await page.waitForTimeout(2500);
  return 'created';
}

async function setupBot(page) {
  await clickIfVisible(page, ['a:has-text("Bot")', 'button:has-text("Bot")']);
  await page.waitForTimeout(1200);

  if (await clickIfVisible(page, ['button:has-text("Add Bot")'])) {
    await page.waitForTimeout(400);
    await clickIfVisible(page, [
      'button:has-text("Yes, do it!")',
      'button:has-text("Yes, do it")',
      'button:has-text("Yes")',
    ]);
    await page.waitForTimeout(1200);
  }

  // Try enabling common privileged intents.
  for (const label of ['MESSAGE CONTENT INTENT', 'SERVER MEMBERS INTENT', 'PRESENCE INTENT']) {
    const row = page.locator(`text=${label}`).first();
    if (await row.isVisible().catch(() => false)) {
      await row.click({ timeout: 2000 }).catch(() => {});
    }
  }

  await clickIfVisible(page, [
    'button:has-text("Save Changes")',
    'button:has-text("Save")',
  ]);
}

async function buildInvite(page) {
  await clickIfVisible(page, ['a:has-text("OAuth2")', 'button:has-text("OAuth2")']);
  await page.waitForTimeout(1200);
  await clickIfVisible(page, ['a:has-text("URL Generator")', 'button:has-text("URL Generator")']);
  await page.waitForTimeout(1200);

  for (const scope of ['bot', 'applications.commands']) {
    await clickIfVisible(page, [
      `label:has-text("${scope}")`,
      `text=${scope}`,
    ]);
  }

  const perms = [
    'View Channels',
    'Send Messages',
    'Read Message History',
    'Attach Files',
    'Embed Links',
    'Use Application Commands',
  ];
  for (const perm of perms) {
    await clickIfVisible(page, [`label:has-text("${perm}")`, `text=${perm}`]);
  }

  const candidateInputs = page.locator('input[readonly], input[type="text"]');
  const count = await candidateInputs.count();
  for (let i = 0; i < count; i += 1) {
    const val = (await candidateInputs.nth(i).inputValue().catch(() => '')).trim();
    if (val.startsWith('https://discord.com/oauth2/authorize')) return val;
  }

  const href = await page
    .locator('a[href*="discord.com/oauth2/authorize"]')
    .first()
    .getAttribute('href')
    .catch(() => null);
  return href || '';
}

async function main() {
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless,
    viewport: { width: 1440, height: 1000 },
    executablePath,
  });

  const page = context.pages()[0] || (await context.newPage());

  try {
    await ensureLoggedIn(page);
    const mode = await createOrReuseApp(page, appName);
    await setupBot(page);
    const inviteUrl = await buildInvite(page);

    await page.screenshot({ path: '.tmp/discord-setup-final.png', fullPage: true }).catch(() => {});

    console.log(`APP_STATUS: ${mode}`);
    console.log(`APP_NAME: ${appName}`);
    if (inviteUrl) {
      console.log(`INVITE_URL: ${inviteUrl}`);
      await page.goto(inviteUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
      console.log('INVITE_PAGE_OPENED: true');
    } else {
      console.log('INVITE_URL: NOT_FOUND');
    }

    console.log('NEXT_ACTION: If prompted, select the target server and authorize the bot invite.');
    await page.waitForTimeout(120000);
  } finally {
    await context.close();
  }
}

main().catch((err) => {
  console.error('DISCORD_SETUP_FAILED:', err.message);
  process.exit(1);
});
