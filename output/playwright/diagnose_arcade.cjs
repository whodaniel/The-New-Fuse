const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto('https://ai-arcade.xyz', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  const buttons = await page.getByRole('button').allTextContents();
  console.log('BUTTONS:', buttons.slice(0, 80));
  const links = await page.getByRole('link').allTextContents();
  console.log('LINKS:', links.slice(0, 80));

  const openAudioCard = page.locator(':text("Open Audio Deck")').first();
  await openAudioCard.click();
  await page.waitForTimeout(1500);
  const bodyText = await page.locator('body').innerText();
  console.log('HAS_FREE_OPEN:', /FREE\s*\/\s*OPEN/i.test(bodyText));
  console.log('HAS_LAUNCH_EXPERIENCE:', /Launch Experience/i.test(bodyText));
  const buttonsAfter = await page.getByRole('button').allTextContents();
  console.log('BUTTONS_AFTER:', buttonsAfter.slice(0, 120));

  const pageEvent = context.waitForEvent('page', { timeout: 7000 }).then(p=>p.url()).catch(()=>null);
  const maybeLaunch = page.getByRole('button', { name: /launch/i }).first();
  if (await maybeLaunch.count()) {
    await maybeLaunch.click();
  } else {
    const listen = page.getByRole('button', { name: /^LISTEN$/i }).first();
    if (await listen.count()) await listen.click();
  }
  const newUrl = await pageEvent;
  console.log('NEW_PAGE_URL:', newUrl);

  await browser.close();
})();
