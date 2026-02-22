#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const idx = line.indexOf('=');
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

async function checkPerplexity() {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) return { ok: false, reason: 'missing PERPLEXITY_API_KEY' };
  try {
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.PERPLEXITY_MODEL || 'sonar',
        messages: [{ role: 'user', content: 'Reply with exactly ok.' }],
        max_tokens: 8,
      }),
    });
    if (!res.ok) return { ok: false, reason: `http ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

async function checkTavily() {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return { ok: false, reason: 'missing TAVILY_API_KEY' };
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        query: 'latest free llm api',
        topic: 'news',
        search_depth: process.env.TAVILY_SEARCH_DEPTH || 'basic',
        max_results: 1,
      }),
    });
    if (!res.ok) return { ok: false, reason: `http ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

async function checkSearxng() {
  const base = process.env.SEARXNG_BASE_URL;
  if (!base) return { ok: false, reason: 'missing SEARXNG_BASE_URL' };
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/search?q=llm&format=json`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    });
    if (!res.ok) return { ok: false, reason: `http ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

async function main() {
  const root = path.resolve(__dirname, '../..');
  loadEnvFile(path.join(root, '.env.local'));
  loadEnvFile(path.join(root, '.env'));

  const mode = (process.env.SCOUT_PROVIDER || 'auto').toLowerCase();
  console.log(`SCOUT_PROVIDER=${mode}`);

  const results = {
    perplexity: await checkPerplexity(),
    tavily: await checkTavily(),
    searxng: await checkSearxng(),
  };

  for (const [name, result] of Object.entries(results)) {
    if (result.ok) {
      console.log(`✅ ${name}`);
    } else {
      console.log(`❌ ${name}: ${result.reason}`);
    }
  }

  let effective = null;
  if (mode === 'perplexity' || mode === 'tavily' || mode === 'searxng') {
    effective = results[mode].ok ? mode : null;
  } else {
    if (results.perplexity.ok) effective = 'perplexity';
    else if (results.tavily.ok) effective = 'tavily';
    else if (results.searxng.ok) effective = 'searxng';
  }

  if (!effective) {
    console.log('❌ No viable scout provider available');
    process.exit(1);
  }

  console.log(`🎯 effective_provider=${effective}`);
}

main().catch((e) => {
  console.error(`❌ provider-test failed: ${e.message}`);
  process.exit(1);
});
