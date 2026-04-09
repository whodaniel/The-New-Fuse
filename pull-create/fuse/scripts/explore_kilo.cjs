const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('Launching browser in regular mode...');
  const userDataDir = '/tmp/kilo_ai_session';
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  console.log('Navigating to https://app.kilo.ai/claw ...');
  await page.goto('https://app.kilo.ai/claw', { waitUntil: 'load' });

  console.log(
    'Waiting up to 3 minutes for you to sign in if required (looking for the main app container)...'
  );

  let signedIn = false;
  for (let i = 0; i < 60; i++) {
    // Let's check for 5 minutes (60 * 5s)
    const url = page.url();
    console.log(`Current URL: ${url}`);

    // Wait until we reach /claw or equivalent, and NOT sign_in, login, auth, or getting started
    if (url.includes('/claw') && !url.includes('sign_in') && !url.includes('login')) {
      await page.waitForTimeout(5000);
      signedIn = true;
      break;
    }
    await page.waitForTimeout(5000);
  }

  if (!signedIn) {
    console.log('It still looks like we are on a login/auth page. Extracting what I see...');
  } else {
    console.log('Appears signed in! Extracting UI elements...');
  }

  await page.waitForTimeout(10000); // 10s wait for loading states to finish

  const uiData = await page.evaluate(() => {
    const interestingSelectors =
      'button, a, nav, [role="button"], [role="navigation"], [role="menu"], [role="dialog"], input, textarea, select, h1, h2, h3, h4, span.sidebar-item, div.panel';
    const nodes = document.querySelectorAll(interestingSelectors);
    const elements = [];

    nodes.forEach((node) => {
      const tag = node.tagName.toLowerCase();
      const text = node.innerText ? node.innerText.trim() : '';
      let ariaLabel = node.getAttribute('aria-label') || '';
      let placeholder = node.getAttribute('placeholder') || '';
      let href = node.getAttribute('href') || '';
      let type = node.getAttribute('type') || '';
      let title = node.getAttribute('title') || '';

      let container = 'main';
      if (node.closest('nav') || node.closest('aside') || node.closest('[class*="sidebar"]'))
        container = 'sidebar';
      else if (node.closest('header') || node.closest('[class*="header"]')) container = 'header';

      if (
        text ||
        ariaLabel ||
        placeholder ||
        title ||
        ['input', 'textarea', 'select'].includes(tag)
      ) {
        elements.push({
          tag,
          type: type || undefined,
          text: text ? (text.length > 50 ? text.substring(0, 50) + '...' : text) : undefined,
          ariaLabel: ariaLabel || undefined,
          placeholder: placeholder || undefined,
          title: title || undefined,
          href: href || undefined,
          container,
        });
      }
    });
    return elements;
  });

  fs.writeFileSync(
    '/tmp/kilo_ui_extraction.json',
    JSON.stringify(
      {
        sidebarTools: uiData.filter((x) => x.container === 'sidebar'),
        headerTools: uiData.filter((x) => x.container === 'header'),
        mainAreaTools: uiData.filter((x) => x.container === 'main'),
      },
      null,
      2
    )
  );

  console.log('Extraction complete! Wrote results to /tmp/kilo_ui_extraction.json');
  await context.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
