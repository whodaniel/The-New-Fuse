// HTTP Based Audit Script to Bypass WebSocket issues
// Uses built-in fetch (Node 18+)

// Configuration
const HTML_ENDPOINT = 'https://tnf-cloud-sandbox-v2-production.up.railway.app/api/agent/call';
const TARGET_DOMAIN = 'https://thenewfuse.com';

// State
let messageId = 0;
const visitedUrls = new Set();
const queues = [TARGET_DOMAIN];
const pageAudits = [];

log(`🕵️ Starting QA Audit Agent (HTTP Mode) for ${TARGET_DOMAIN}`);
log(`🔌 Using Endpoint: ${HTML_ENDPOINT}`);

async function sendRequest(method, params) {
  const id = (messageId++).toString();
  const payload = {
    jsonrpc: '2.0',
    id,
    method,
    params: method === 'tools/call' ? params : params || {},
  };

  try {
    const response = await fetch(HTML_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.result;
  } catch (e) {
    console.error(`❌ Connection Error: ${e.message}`);
    throw e;
  }
}

async function executeTool(name, args) {
  const result = await sendRequest('tools/call', {
    name,
    arguments: args,
  });

  // log(`DEBUG Tool ${name} raw:`, JSON.stringify(result).substring(0, 100) + '...');

  if (result.content && result.content[0] && result.content[0].text) {
    return { output: result.content[0].text };
  }
  return result;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper to log to both Console and Live View
async function log(msg, level = 'info') {
  log(msg); // Local console
  try {
    // Fire and forget broadcast (don't await to avoid slowing down crawl)
    sendRequest('tools/call', {
      name: 'broadcast_log',
      arguments: { message: msg.replace(/\n/g, ' '), level },
    }).catch((e) => {});
  } catch (e) {}
}

async function auditPage(url) {
  visitedUrls.add(url);
  log(`\n🔍 Analyzing: ${url}`);

  const status = { url, checks: [], score: 100 };

  try {
    // 1. Navigate
    log('  👉 Navigating...');
    await executeTool('browser_navigate', { url });
    // Note: The screenshot happens automatically in the server upon navigate,
    // but the viewer might need time to receive the polling event.
    await sleep(4000);

    // 2. Initial Screenshot (Force update via evaluate)
    log('  📸 Capturing visual state (Above Fold)...');
    // browser_screenshot broadcasting is flaky, use evaluate to trigger broadcast
    await executeTool('browser_evaluate', { script: '"Visual Check Top"' });

    // 3. Evaluate DOM
    log('  🕵️ Investigating DOM...');
    const evaluation = await executeTool('browser_evaluate', {
      script: `(function() {
        // Simple extraction for demo
        const links = Array.from(document.querySelectorAll('a')).map(a => a.href);
        const images = Array.from(document.querySelectorAll('img'));
        const brokenImages = images.filter(i => i.naturalWidth === 0).length;
        const pageTitle = document.title;
        return { links, brokenImages, pageTitle };
      })()`,
    });

    log('  DEBUG Evaluation Output:', evaluation.output);
    const response = JSON.parse(evaluation.output || '{}');
    if (!response.success || !response.result) {
      console.warn('   ⚠️ Evaluation failed or empty:', response.error || 'No result');
      return [];
    }
    const data = response.result;
    log(`  ✅ Title: ${data.pageTitle}`);
    log(`  🔗 Found ${data.links ? data.links.length : 0} links`);

    // 4. Scroll
    log('  📜 Scrolling...');
    await executeTool('browser_evaluate', {
      script: 'window.scrollTo(0, document.body.scrollHeight)',
    });
    await sleep(2000);

    // 5. Final Screenshot (Force update via evaluate)
    log('  📸 Capturing visual state (Footer)...');
    await executeTool('browser_evaluate', { script: '"Visual Check Bottom"' });

    pageAudits.push(status);
    return data.links || [];
  } catch (e) {
    console.error(`  ❌ Failed to audit ${url}:`, e.message);
    return [];
  }
}

async function startCrawl() {
  log('🚀 Initializing Agent Protocol (HTTP)...');
  try {
    // Optional initialize
    await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'qa-audit-bot-http', version: '1.0.0' },
    });
    log('✅ Initialize success');
  } catch (e) {
    console.warn('⚠️ Initialize skipped/failed:', e.message);
  }

  // Force a clear screenshot at start
  log('📸 Taking Initial Connectivity Screenshot...');
  try {
    await executeTool('browser_navigate', { url: TARGET_DOMAIN });
    await sleep(2000);
    await executeTool('browser_screenshot', { path: 'connect.png' });
  } catch (e) {
    log('   (Allowed to fail if no page open)');
  }

  // WARMUP PHASE: Prove Live View is working (Using evaluate to force broadcast)
  log('\n🔥 WARMUP: Generating visual activity for Live View...');
  for (let i = 1; i <= 5; i++) {
    log(`  📸 Warmup Screenshot ${i}/5...`);
    // Use evaluate because we know it broadcasts successfully
    await executeTool('browser_evaluate', { script: `'Warmup Ping ${i}'` });
    await sleep(2000); // Slower pace for visibility
  }

  const MAX_PAGES = 20;
  let count = 0;

  while (queues.length > 0 && count < MAX_PAGES) {
    const nextUrl = queues.shift();
    if (nextUrl && nextUrl.startsWith(TARGET_DOMAIN) && !visitedUrls.has(nextUrl)) {
      const links = await auditPage(nextUrl);
      if (links) {
        links.forEach((l) => {
          if (!visitedUrls.has(l) && !queues.includes(l)) queues.push(l);
        });
      }
      count++;
    } else {
      // if loop hits already visited
    }
  }

  log('\n✅ Audit Complete.');
}

startCrawl().catch((e) => console.error('Fatal:', e));
