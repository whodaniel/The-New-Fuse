const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const cheerio = require('cheerio');

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
const SCOUT_PROVIDER = (process.env.SCOUT_PROVIDER || 'auto').toLowerCase();
const SEARXNG_BASE_URL = process.env.SEARXNG_BASE_URL;
const SEARXNG_NEWS_ENGINES = process.env.SEARXNG_NEWS_ENGINES || '';
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const TAVILY_SEARCH_DEPTH = process.env.TAVILY_SEARCH_DEPTH || 'basic';
const EXA_API_KEY = process.env.EXA_API_KEY;
const CRAWL4AI_ENABLED = String(process.env.CRAWL4AI_ENABLED || '').toLowerCase() === 'true';
const CRAWL4AI_MAX_URLS = Number.parseInt(process.env.CRAWL4AI_MAX_URLS || '5', 10);
const CRAWL4AI_PYTHON_BIN = process.env.CRAWL4AI_PYTHON_BIN || 'python3';
const CRAWL4AI_SCRIPT_PATH = path.resolve(__dirname, './crawl4ai_enrich.py');
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

function buildScoutTaskId(title, link) {
  const titleHash = crypto
    .createHash('sha1')
    .update(`${title || ''}|${link || ''}`)
    .digest('hex')
    .slice(0, 8);

  return `task_scout_${Date.now()}_${crypto.randomUUID()}_${titleHash}`;
}

function buildSearxngSearchUrl(query) {
  if (!SEARXNG_BASE_URL) {
    throw new Error('SEARXNG_BASE_URL is not set. Refusing to run without live source.');
  }

  const base = new URL(SEARXNG_BASE_URL);
  const searchPath = base.pathname.endsWith('/search')
    ? base.pathname
    : `${base.pathname.replace(/\/$/, '')}/search`;
  base.pathname = searchPath;
  base.searchParams.set('q', query);
  base.searchParams.set('format', 'html');
  base.searchParams.set('time_range', 'day');
  base.searchParams.set('categories', 'general,news');
  base.searchParams.set('language', 'en-US');

  if (SEARXNG_NEWS_ENGINES) {
    base.searchParams.set('engines', SEARXNG_NEWS_ENGINES);
  }

  return base.toString();
}

async function fetchLiveFindings() {
  if (!['auto', 'exa', 'tavily', 'searxng'].includes(SCOUT_PROVIDER)) {
    throw new Error(
      `Unsupported SCOUT_PROVIDER="${SCOUT_PROVIDER}". Supported values: auto, exa, tavily, searxng`
    );
  }

  if (SCOUT_PROVIDER === 'exa') {
    if (!EXA_API_KEY) {
      throw new Error('EXA_API_KEY is required when SCOUT_PROVIDER=exa');
    }
    return fetchExaFindings();
  }

  if (SCOUT_PROVIDER === 'searxng') {
    return fetchSearxngFindings();
  }

  if (SCOUT_PROVIDER === 'tavily') {
    if (!TAVILY_API_KEY) {
      throw new Error('TAVILY_API_KEY is required when SCOUT_PROVIDER=tavily');
    }
    return fetchTavilyFindings();
  }

  // auto: highest priority is Exa, then Tavily, then SearXNG
  if (EXA_API_KEY) {
    try {
      return await fetchExaFindings();
    } catch (error) {
      console.warn('⚠️ Exa scout failed:', error.message);
    }
  }

  if (TAVILY_API_KEY) {
    try {
      return await fetchTavilyFindings();
    } catch (error) {
      console.warn('⚠️ Tavily scout failed:', error.message);
    }
  }

  return fetchSearxngFindings();
}

function enrichFindingsWithCrawl4AI(findings) {
  if (!CRAWL4AI_ENABLED) return findings;
  if (!Array.isArray(findings) || findings.length === 0) return findings;

  const payload = findings.slice(0, Math.max(1, CRAWL4AI_MAX_URLS));
  const result = spawnSync(CRAWL4AI_PYTHON_BIN, [CRAWL4AI_SCRIPT_PATH], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 4 * 1024 * 1024,
  });

  if (result.error) {
    console.warn(`⚠️ Crawl4AI enrich skipped: ${result.error.message}`);
    return findings;
  }
  if (result.status !== 0) {
    const errorMessage = (result.stderr || '').trim() || `exit code ${result.status}`;
    console.warn(`⚠️ Crawl4AI enrich failed: ${errorMessage}`);
    return findings;
  }

  try {
    const enrichedSubset = JSON.parse(result.stdout || '[]');
    if (!Array.isArray(enrichedSubset) || enrichedSubset.length === 0) return findings;

    const byLink = new Map(enrichedSubset.filter((x) => x?.link).map((x) => [x.link, x]));
    return findings.map((item) => {
      const enriched = byLink.get(item.link);
      if (!enriched) return item;
      return {
        ...item,
        details: enriched.details || item.details,
      };
    });
  } catch (error) {
    console.warn(`⚠️ Crawl4AI enrich parse failed: ${error.message}`);
    return findings;
  }
}

async function fetchExaFindings() {
  if (!EXA_API_KEY) {
    throw new Error('EXA_API_KEY is not set');
  }

  const aggregated = [];
  for (const q of SEARCH_QUERIES) {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': EXA_API_KEY,
      },
      body: JSON.stringify({
        query: q,
        category: 'news',
        type: 'auto',
        num_results: 6,
        contents: {
          text: {
            max_characters: 2000,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Exa API failed for "${q}" (${response.status})`);
    }

    const json = await response.json();
    const results = Array.isArray(json?.results) ? json.results : [];
    for (const item of results) {
      if (!item?.url || !item?.title) continue;
      aggregated.push({
        title: String(item.title).trim(),
        source: normalizeSource(item.url),
        threat: classifyImpact(item.title || '', item.text || ''),
        link: String(item.url).trim(),
        details:
          String(item.text || 'No summary provided by source.')
            .substring(0, 300)
            .trim() + '...',
      });
    }
  }

  const deduped = [];
  const seen = new Set();
  for (const item of aggregated) {
    const key = `${item.title}::${item.link}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return deduped.slice(0, 20);
}

async function fetchSearxngFindings() {
  const allItems = [];
  for (const q of SEARCH_QUERIES) {
    const response = await fetch(buildSearxngSearchUrl(q), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Referer: 'https://thenewfuse.com/',
      },
    });

    if (!response.ok) {
      throw new Error(`SearXNG API failed for query "${q}" (${response.status})`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const results = [];

    $('.result:not(.result-images)').each((i, el) => {
      const title = $(el).find('h3 a').text();
      const url = $(el).find('h3 a').attr('href');
      const content = $(el).find('.content').text();
      if (title && url) {
        results.push({ title, url, content });
      }
    });

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

async function fetchTavilyFindings() {
  if (!TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY is not set');
  }

  const aggregated = [];
  for (const q of SEARCH_QUERIES) {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query: q,
        topic: 'news',
        search_depth: TAVILY_SEARCH_DEPTH,
        max_results: 6,
        include_answer: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API failed for "${q}" (${response.status})`);
    }

    const json = await response.json();
    const results = Array.isArray(json?.results) ? json.results : [];
    for (const item of results) {
      if (!item?.url || !item?.title) continue;
      aggregated.push({
        title: String(item.title).trim(),
        source: normalizeSource(item.url),
        threat: classifyImpact(item.title || '', item.content || ''),
        link: String(item.url).trim(),
        details: String(item.content || 'No summary provided by source.').trim(),
      });
    }
  }

  const deduped = [];
  const seen = new Set();
  for (const item of aggregated) {
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

  const liveFindings = await fetchLiveFindings();
  const news = enrichFindingsWithCrawl4AI(liveFindings);
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

  news.forEach((item) => {
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
          id: buildScoutTaskId(item.title, item.link),
          title: taskTitle,
          description: `Strategic trend detected: ${item.title}. Source: ${item.source}. Details: ${item.details}`,
          priority: item.threat === 'High' ? 'high' : 'normal',
          status: 'queued',
          source: 'news-scout',
          itinerary: {
            lane: 'realtime_broker_routing',
            horizon: 'realtime',
          },
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

runScout().catch((err) => {
  console.error('❌ News Scout failed:', err);
  process.exit(1);
});
