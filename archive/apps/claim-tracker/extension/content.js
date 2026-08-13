console.log('ClaimTracker: Monitoring chat...');

// Target the Facebook Live chat container
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const text = node.innerText || '';
        if (text.toLowerCase().includes('sold') || text.includes('$')) {
          console.log('Potential Claim Detected:', text);
          // Future: Send to Cloudflare API
        }
      }
    });
  });
});

// Start observing the document body for now
observer.observe(document.body, { childList: true, subtree: true });
