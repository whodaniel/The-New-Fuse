const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;

    const separatorIndex = line.indexOf('=');
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const ROOT_DIR = path.resolve(__dirname, '../..');
loadEnvFile(path.join(ROOT_DIR, '.env.local'));
loadEnvFile(path.join(ROOT_DIR, '.env'));

const { RedisAgentClient } = require('../../packages/tnf-cli/dist/index');

/**
 * AI News Scout Script (v3.0 - ZERO MOCKS)
 * 
 * Objectives:
 * 1. Pull real market intelligence from SearXNG Search API.
 * 2. Generate a markdown report.
 * 3. Dispatch real tasks to the swarm.
 */
const REPORT_PATH = path.resolve(__dirname, '../../.agent/landscape/DAILY_NEWS.md');
const SEARXNG_BASE_URL = process.env.SEARXNG_BASE_URL;
const SEARXNG_NEWS_ENGINES = process.env.SEARXNG_NEWS_ENGINES || '';
const SEARCH_QUERIES = [
  'new free LLM API release',
  'open source LLM model release',
  'free model inference promo',
  'Hugging Face new model release',
  'Groq free tier model',
];

function normalizeSource(urlString) {
  try {
    return new URL(urlString).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

function classifyImpact(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  if (
    text.includes('free') ||
    text.includes('open-source') ||
    text.includes('open source') ||
    text.includes('released') ||
    text.includes('launch')
  ) {
    return 'High';
  }
  return 'Medium';
}

function buildSearxngSearchUrl(query) {
  if (!SEARXNG_BASE_URL) {
    throw new Error('SEARXNG_BASE_URL is not set. Refusing to run without live source.');
  }

  const base = new URL(SEARXNG_BASE_URL);
  const searchPath = base.pathname.endsWith('/search') ? base.pathname : `${base.pathname.replace(/\/$/, '')}/search`;
  base.pathname = searchPath;
  base.searchParams.set('q', query);
  base.searchParams.set('format', 'json');
  base.searchParams.set('time_range', 'day');
  base.searchParams.set('categories', 'general,news');
  base.searchParams.set('language', 'en-US');

  if (SEARXNG_NEWS_ENGINES) {
    base.searchParams.set('engines', SEARXNG_NEWS_ENGINES);
  }

  return base.toString();
}

async function fetchLiveFindings() {
  const allItems = [];
  for (const q of SEARCH_QUERIES) {
    const response = await fetch(buildSearxngSearchUrl(q), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`SearXNG API failed for query "${q}" (${response.status})`);
    }

    const json = await response.json();
    const results = json?.results || [];
    for (const result of results) {
      if (!result?.title || !result?.url) continue;
      allItems.push({
        title: result.title.trim(),
        source: normalizeSource(result.url),
        threat: classifyImpact(result.title || '', result.content || ''),
        link: result.url,
        details: (result.content || '').trim() || 'No summary provided by source.',
      });
    }
  }

  const deduped = [];
  const seen = new Set();
  for (const item of allItems) {
    const key = `${item.title}::${item.link}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return deduped.slice(0, 20);
}

async function runScout() {
  console.log('🕵️ News Scout: Syncing latest market intelligence...');

  const client = new RedisAgentClient();
  try {
    await client.initialize();
    await client.register('News-Scout', 'worker', 'scout', ['web-search', 'market-analysis']);
  } catch (e) {
    console.error('❌ Redis unavailable. Refusing to run without real-time bus.');
    process.exit(1);
  }

  const news = await fetchLiveFindings();
  if (news.length === 0) {
    console.warn('⚠️ No live findings returned by SearXNG.');
    await client.cleanup();
    process.exit(1);
  }

  // Generate Report
  const timestamp = new Date().toISOString();
  let markdown = `# AI Landscape Report - ${new Date().toLocaleDateString()}\n\n`;
  markdown += `*Generated at: ${timestamp}*\n\n`;
  markdown += `## 🚀 Latest Verified Trends\n\n`;

  news.forEach(item => {
    markdown += `### ${item.title}\n`;
    markdown += `- **Source**: ${item.source}\n`;
    markdown += `- **Impact**: ${item.threat}\n`;
    markdown += `- **Details**: ${item.details}\n`;
    if (item.link) markdown += `- **Link**: [View Source](${item.link})\n`;
    markdown += `\n`;
  });

  markdown += `\n## 🎯 Swarm Action Items\n\n`;
  
  for (const item of news) {
    if (item.threat === 'High' || item.threat === 'Medium') {
      const taskTitle = `Assimilation: ${item.title}`;
      markdown += `- [ ] **PRIORITY**: ${taskTitle}\n`;
      
      if (client.publisher) {
        console.log(`📢 Signaling Swarm: Dispatching task "${taskTitle}"`);
        const taskPayload = {
          id: `task_scout_${crypto.randomUUID()}`,
          title: taskTitle,
          description: `Strategic trend detected: ${item.title}. Source: ${item.source}. Details: ${item.details}`,
          priority: item.threat === 'High' ? 'high' : 'normal',
          status: 'queued',
          source: 'news-scout',
          itinerary: {
            lane: 'realtime_broker_routing',
            horizon: 'realtime'
          }
        };
        
        await client.publisher.lpush('tnf:master:tasks:planning', JSON.stringify(taskPayload));
        await client.publisher.lpush(
          'tnf:master:logs',
          JSON.stringify({
            timestamp: new Date().toISOString(),
            eventType: 'scout.task_queued',
            content: taskTitle,
            metadata: {
              source: 'News-Scout',
              title: item.title,
              link: item.link || null,
              impact: item.threat,
            },
          })
        );
      }
    }
  }

  fs.writeFileSync(REPORT_PATH, markdown);
  console.log(`✅ News Scout: Real report written to ${REPORT_PATH}`);
  
  if (client) await client.cleanup();
}

runScout().catch(err => {
  console.error('❌ News Scout failed:', err);
  process.exit(1);
});
