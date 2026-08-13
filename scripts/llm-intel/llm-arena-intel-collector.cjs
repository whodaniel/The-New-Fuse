#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const http = require('node:http');

const DATA_DIR = path.join(
  process.env.TNF_REPO_ROOT || path.resolve(__dirname, '..', '..'),
  'data',
  'llm-intel'
);
const INTEL_FILE = path.join(DATA_DIR, 'arena-intel.json');
const HISTORY_DIR = path.join(DATA_DIR, 'history');

const SOURCES = {
  'lm-arena-leaderboard': {
    name: 'LM Arena (Chatbot Arena)',
    url: 'https://lmarena.ai/?leaderboard',
    type: 'arena',
    parser: 'lm-arena',
  },
  'lm-arena-vision': {
    name: 'LM Arena Vision',
    url: 'https://lmarena.ai/?leaderboard&category=vision',
    type: 'arena',
    parser: 'lm-arena',
  },
  'lm-arena-hard': {
    name: 'LM Arena Hard Prompts',
    url: 'https://lmarena.ai/?leaderboard&category=hard',
    type: 'arena',
    parser: 'lm-arena',
  },
  'lm-arena-code': {
    name: 'LM Arena Coding',
    url: 'https://lmarena.ai/?leaderboard&category=coding',
    type: 'arena',
    parser: 'lm-arena',
  },
  'agent-arena': {
    name: 'Agent Arena',
    url: 'https://agent-arena.com/leaderboard',
    type: 'arena',
    parser: 'agent-arena',
  },
  'artificial-analysis': {
    name: 'Artificial Analysis',
    url: 'https://artificialanalysis.ai/leaderboard',
    type: 'benchmark',
    parser: 'artificial-analysis',
  },
  'open-llm-leaderboard': {
    name: 'Open LLM Leaderboard (HuggingFace)',
    url: 'https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard',
    type: 'benchmark',
    parser: 'huggingface',
  },
  'aider-leaderboard': {
    name: 'Aider Coding Leaderboard',
    url: 'https://aider.chat/docs/leaderboards/',
    type: 'benchmark',
    parser: 'aider',
  },
  'swebench': {
    name: 'SWE-bench Leaderboard',
    url: 'https://www.swebench.com/',
    type: 'benchmark',
    parser: 'swebench',
  },
};

const NEWS_FEEDS = [
  {
    name: 'HuggingFace Blog',
    url: 'https://huggingface.co/blog/feed.xml',
    type: 'rss',
  },
  {
    name: 'OpenAI Blog',
    url: 'https://openai.com/blog/rss.xml',
    type: 'rss',
  },
  {
    name: 'Anthropic News',
    url: 'https://www.anthropic.com/rss.xml',
    type: 'rss',
  },
  {
    name: 'r/LocalLLaMA',
    url: 'https://www.reddit.com/r/LocalLLaMA/new/.json',
    type: 'json',
  },
  {
    name: 'r/MachineLearning',
    url: 'https://www.reddit.com/r/MachineLearning/new/.json',
    type: 'json',
  },
];

const NVIDIA_API_BASE = 'https://integrate.api.nvidia.com/v1';

function fetchUrl(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: timeoutMs }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location, timeoutMs).then(resolve, reject);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode, headers: res.headers, body });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function readJson(filePath, fallback) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { return fallback; }
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
}

async function probeNvidiaHealth() {
  const apiKey = process.env.NVIDIA_API_KEY || readNvidiaKeyFromEnv();
  if (!apiKey) return [];

  const models = readJson(
    path.join(process.env.HOME || '/root', '.agents', 'skills', 'nvidia-ngc-access', 'references', 'model-catalog.md'),
    null
  );
  const modelIds = [
    'z-ai/glm-5.1', 'moonshotai/kimi-k2.6', 'minimaxai/minimax-m2.7',
    'minimaxai/minimax-m2.5', 'deepseek-ai/deepseek-v4-flash',
    'deepseek-ai/deepseek-v4-pro', 'qwen/qwen3.5-397b-a17b',
    'qwen/qwen3.5-122b-a10b', 'mistralai/mistral-large-3-675b-instruct-2512',
    'mistralai/mistral-medium-3.5-128b', 'mistralai/devstral-2-123b-instruct-2512',
    'mistralai/mistral-small-4-119b-2603', 'mistralai/magistral-small-2506',
    'mistralai/ministral-14b-instruct-2512', 'google/gemma-3n-e4b-it',
    'google/gemma-3-27b-it', 'meta/llama-4-maverick-17b-128e-instruct',
    'meta/llama-3.3-70b-instruct', 'meta/llama-3.1-405b-instruct',
    'meta/llama-3.2-90b-vision-instruct', 'meta/llama-guard-4-12b',
    'openai/gpt-oss-120b', 'openai/gpt-oss-20b',
    'microsoft/phi-4-multimodal-instruct', 'microsoft/phi-4-mini-instruct',
    'bytedance/seed-oss-36b-instruct', 'stockmark/stockmark-2-100b-instruct',
    'abacusai/dracarys-llama-3.1-70b-instruct', 'google/gemma-4-31b-it',
    'moonshotai/kimi-k2-instruct-0905', 'moonshotai/kimi-k2-thinking',
    'moonshotai/kimi-k2-instruct', 'z-ai/glm5', 'z-ai/glm4.7',
    'qwen/qwen3-coder-480b-a35b-instruct', 'qwen/qwen3-next-80b-a3b-instruct',
    'qwen/qwen3-next-80b-a3b-thinking',
  ];

  const results = [];
  const batchSize = 5;
  for (let i = 0; i < modelIds.length; i += batchSize) {
    const batch = modelIds.slice(i, i + batchSize);
    const probes = batch.map(async (modelId) => {
      const start = Date.now();
      try {
        const payload = JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 3,
        });
        const url = new URL('/v1/chat/completions', NVIDIA_API_BASE);
        const mod = url.protocol === 'https:' ? https : http;
        return new Promise((resolve) => {
          const req = mod.request(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            timeout: 15000,
          }, (res) => {
            const body = [];
            res.on('data', (c) => body.push(c));
            res.on('end', () => {
              const latencyMs = Date.now() - start;
              resolve({
                model: modelId,
                status: res.statusCode === 200 ? 'live' : (res.statusCode === 410 ? 'eol' : 'error'),
                httpStatus: res.statusCode,
                latencyMs: res.statusCode === 200 ? latencyMs : null,
              });
            });
          });
          req.on('error', () => resolve({ model: modelId, status: 'error', httpStatus: 0, latencyMs: null }));
          req.on('timeout', () => { req.destroy(); resolve({ model: modelId, status: 'timeout', httpStatus: 0, latencyMs: null }); });
          req.write(payload);
          req.end();
        });
      } catch {
        return { model: modelId, status: 'error', httpStatus: 0, latencyMs: null };
      }
    });
    const batchResults = await Promise.all(probes);
    results.push(...batchResults);
  }
  return results;
}

function readNvidiaKeyFromEnv() {
  const envPath = path.join(process.env.HOME || '/root', '.hermes', '.env');
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      if (line.startsWith('NVIDIA_API_KEY=')) return line.trim().split('=', 2)[1];
    }
  } catch {}
  return '';
}

function extractModelMentions(text) {
  const knownFamilies = [
    'gpt-5', 'gpt-4', 'gpt-oss', 'claude', 'gemini', 'glm', 'kimi',
    'deepseek', 'qwen', 'mistral', 'magistral', 'devstral', 'ministral',
    'llama', 'phi', 'minimax', 'yi', 'gemma', 'seed', 'palmyra',
    'stockmark', 'dracarys', 'codestral', 'pixtral', 'command',
    'starcoder', 'codellama', 'falcon', 'mpt', 'solar',
  ];
  const mentions = [];
  const lower = text.toLowerCase();
  for (const family of knownFamilies) {
    const regex = new RegExp(`${family}[\\w.-]*`, 'gi');
    const matches = lower.match(regex);
    if (matches) {
      for (const m of matches) {
        if (!mentions.includes(m)) mentions.push(m);
      }
    }
  }
  return mentions;
}

async function collectArenaData(sourceKey, source) {
  console.log(`  Collecting arena: ${source.name}...`);
  try {
    const res = await fetchUrl(source.url, 20000);
    const html = res.body || '';
    const rankings = [];

    const scorePattern = /(?:Elo|elo|score|rating)[^\d]*(\d{3,4})/g;
    const modelPattern = new RegExp('(?:class="[^"]*model[^"]*"|data-model="([^"]+)"|>([\\w.-]+(?:-|_)[\\w.-]+(?:-|_)[\\w.-]+)<)', 'g');

    let match;
    const scores = [];
    while ((match = scorePattern.exec(html)) !== null) {
      scores.push(parseInt(match[1], 10));
    }
    const modelNames = [];
    while ((match = modelPattern.exec(html)) !== null) {
      const name = match[1] || match[2];
      if (name) modelNames.push(name.trim());
    }

    for (let i = 0; i < Math.min(modelNames.length, scores.length, 50); i++) {
      rankings.push({
        model: modelNames[i],
        score: scores[i],
        rank: i + 1,
      });
    }

    return {
      source: sourceKey,
      sourceName: source.name,
      sourceType: source.type,
      url: source.url,
      collectedAt: new Date().toISOString(),
      status: res.status === 200 ? 'success' : 'partial',
      rankings,
      rawLength: html.length,
    };
  } catch (e) {
    return {
      source: sourceKey,
      sourceName: source.name,
      sourceType: source.type,
      url: source.url,
      collectedAt: new Date().toISOString(),
      status: 'error',
      error: e.message,
      rankings: [],
    };
  }
}

async function collectNewsFeed(feed) {
  console.log(`  Collecting news: ${feed.name}...`);
  try {
    const res = await fetchUrl(feed.url, 15000);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const body = res.body;
    const articles = [];

    if (feed.type === 'json') {
      try {
        const data = JSON.parse(body);
        const posts = data?.data?.children || [];
        for (const post of posts.slice(0, 10)) {
          const d = post?.data || {};
          const mentions = extractModelMentions(`${d.title || ''} ${d.selftext || ''}`);
          if (mentions.length > 0) {
            articles.push({
              title: d.title,
              url: `https://reddit.com${d.permalink}`,
              publishedAt: new Date(d.created_utc * 1000).toISOString(),
              score: d.score,
              modelMentions: mentions,
              sentiment: d.score > 50 ? 'positive' : d.score > 10 ? 'neutral' : 'negative',
            });
          }
        }
      } catch {}
    } else {
      const titleRegex = /<title>([^<]+)<\/title>/gi;
      const linkRegex = /<link>([^<]+)<\/link>/gi;
      const titles = [];
      const links = [];
      let m;
      while ((m = titleRegex.exec(body)) !== null) titles.push(m[1]);
      while ((m = linkRegex.exec(body)) !== null) links.push(m[1]);

      for (let i = 0; i < Math.min(titles.length, links.length, 10); i++) {
        const mentions = extractModelMentions(titles[i]);
        if (mentions.length > 0) {
          articles.push({
            title: titles[i],
            url: links[i],
            publishedAt: new Date().toISOString(),
            modelMentions: mentions,
            sentiment: 'neutral',
          });
        }
      }
    }

    return {
      feed: feed.name,
      url: feed.url,
      collectedAt: new Date().toISOString(),
      status: 'success',
      articles,
    };
  } catch (e) {
    return {
      feed: feed.name,
      url: feed.url,
      collectedAt: new Date().toISOString(),
      status: 'error',
      error: e.message,
      articles: [],
    };
  }
}

async function main() {
  const startedAt = new Date().toISOString();
  console.log(`[${startedAt}] LLM Arena Intel Collector starting...`);

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(HISTORY_DIR, { recursive: true });

  const previous = readJson(INTEL_FILE, { spec: 'tnf/llm-arena-intel/0.1', snapshots: [] });

  const snapshot = {
    id: `intel_${Date.now()}`,
    collectedAt: startedAt,
    arenaData: [],
    newsData: [],
    nvidiaHealth: [],
    summary: {},
  };

  console.log('Collecting arena/benchmark data...');
  for (const [key, source] of Object.entries(SOURCES)) {
    const result = await collectArenaData(key, source);
    snapshot.arenaData.push(result);
  }

  console.log('Collecting news/sentiment data...');
  for (const feed of NEWS_FEEDS) {
    const result = await collectNewsFeed(feed);
    snapshot.newsData.push(result);
  }

  console.log('Probing NVIDIA NGC health...');
  snapshot.nvidiaHealth = await probeNvidiaHealth();

  const liveCount = snapshot.nvidiaHealth.filter(h => h.status === 'live').length;
  const slowCount = snapshot.nvidiaHealth.filter(h => h.status === 'timeout').length;
  const eolCount = snapshot.nvidiaHealth.filter(h => h.status === 'eol').length;
  const totalRankings = snapshot.arenaData.reduce((sum, a) => sum + (a.rankings?.length || 0), 0);
  const totalArticles = snapshot.newsData.reduce((sum, n) => sum + (n.articles?.length || 0), 0);

  snapshot.summary = {
    arenaSources: snapshot.arenaData.length,
    arenaSourcesOk: snapshot.arenaData.filter(a => a.status === 'success').length,
    totalRankings,
    newsFeeds: snapshot.newsData.length,
    newsFeedsOk: snapshot.newsData.filter(n => n.status === 'success').length,
    totalArticles,
    nvidiaModelsProbed: snapshot.nvidiaHealth.length,
    nvidiaLive: liveCount,
    nvidiaSlow: slowCount,
    nvidiaEol: eolCount,
  };

  snapshot.completedAt = new Date().toISOString();

  const intel = {
    spec: 'tnf/llm-arena-intel/0.1',
    lastUpdated: snapshot.completedAt,
    snapshots: [snapshot, ...(previous.snapshots || [])].slice(0, 30),
  };

  writeJson(INTEL_FILE, intel);

  const historyFile = path.join(HISTORY_DIR, `intel_${new Date().toISOString().slice(0, 10)}.json`);
  writeJson(historyFile, intel);

  const latestFile = path.join(DATA_DIR, 'arena-intel-latest.json');
  writeJson(latestFile, snapshot);

  console.log(JSON.stringify({
    ok: true,
    snapshotId: snapshot.id,
    summary: snapshot.summary,
  }, null, 2));
}

main().catch((e) => {
  console.error(JSON.stringify({ ok: false, error: e.message }, null, 2));
  process.exit(1);
});
