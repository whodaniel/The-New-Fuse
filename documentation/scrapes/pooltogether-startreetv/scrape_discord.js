// Scrape Discord search results (pages 1-32+)
(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const results = [];
  let page = 1;
  const maxPages = 32;

  while (page <= maxPages) {
    console.log(`Scraping page ${page}...`);

    // Wait for results to load (wait for at least one search result)
    let tries = 0;
    while (document.querySelectorAll('[id^="search-result-"]').length === 0 && tries < 20) {
      await sleep(500);
      tries++;
    }

    // Extract messages
    const items = document.querySelectorAll('[id^="search-result-"]');
    items.forEach((el) => {
      // Avoid duplicates by checking if we already have this content/date combo for this channel
      // Or just push and dedupe later. Pushing all for safety.
      // Refine selector to avoid nested hits: only look at the main container
      if (el.parentElement.closest('[id^="search-result-"]')) return; // Skip nested

      const dateEl = el.querySelector('time');
      const date = dateEl ? dateEl.getAttribute('datetime') : null;

      const contentEl = el.querySelector('[id^="message-content-"]');
      const content = contentEl ? contentEl.innerText : el.innerText; // Fallback

      const channelEl = el.querySelector('[class*="channelName-"]');
      const channel = channelEl ? channelEl.innerText : 'Unknown';

      if (content && date) {
        results.push({ page, date, content, channel });
      }
    });

    // Check for Next button
    // The "Next" button usually has an aria-label or text.
    // In the snapshot, it was just "Next".
    const buttons = Array.from(document.querySelectorAll('button'));
    const nextBtn = buttons.find((b) => b.innerText === 'Next' && !b.disabled);

    if (nextBtn) {
      nextBtn.click();
      await sleep(2000); // Wait for load
      page++;
    } else {
      console.log('No Next button found or disabled. Stopping.');
      break;
    }
  }

  return results;
})();
