import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const SUPABASE_BASE = Deno.env.get('SUPABASE_URL') || 'https://wslydgtgindrywldatbv.supabase.co';
const STORAGE_PATH = '/storage/v1/object/public/concordance/20260508_124525';
const VIZ_JSON_URL = `${SUPABASE_BASE}${STORAGE_PATH}/concordance_viz_data.json`;
const STATS_JSON_URL = `${SUPABASE_BASE}${STORAGE_PATH}/stats.json`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

let vizDataCache: Record<string, unknown> | null = null;
let statsCache: Record<string, unknown> | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function fetchJson(url: string): Promise<unknown> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Fetch failed: ${resp.status} ${url}`);
  return resp.json();
}

async function getVizData(): Promise<Record<string, unknown>> {
  const now = Date.now();
  if (vizDataCache && now < cacheExpiry) return vizDataCache;
  vizDataCache = (await fetchJson(VIZ_JSON_URL)) as Record<string, unknown>;
  cacheExpiry = now + CACHE_TTL;
  return vizDataCache!;
}

async function getStats(): Promise<Record<string, unknown> | null> {
  try {
    if (!statsCache) {
      statsCache = (await fetchJson(STATS_JSON_URL)) as Record<string, unknown>;
    }
    return statsCache;
  } catch {
    return null;
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

async function handleStats(): Promise<Response> {
  const data = await getVizData();
  const stats = await getStats();
  const m = data.metadata as Record<string, unknown>;
  const categories = data.categories as Record<string, Record<string, unknown>>;

  return jsonResponse({
    total_unique_identifiers: m.totalWords,
    total_occurrences: m.totalOccurrences,
    files_indexed: m.filesIndexed,
    categories: Object.keys(categories).length,
    category_breakdown: Object.fromEntries(
      Object.entries(categories).map(([name, cat]) => [
        name,
        { count: cat.count, total_occurrences: cat.totalOccurrences },
      ])
    ),
    generated: stats?.generated || null,
  });
}

async function handleTop(params: URLSearchParams): Promise<Response> {
  const count = Math.min(parseInt(params.get('count') || '50') || 50, 500);
  const category = params.get('category');

  const data = await getVizData();
  let words = data.topWords as Array<Record<string, unknown>>;

  if (category && data.categories) {
    const categories = data.categories as Record<string, Record<string, unknown>>;
    const cat = categories[category];
    if (cat) {
      const catTopWords = cat.topWords as Array<Record<string, string | number>>;
      const catWordSet = new Set(catTopWords.map((w) => w.word as string));
      words = words.filter((w) => catWordSet.has(w.word as string));
    }
  }

  const top = words.slice(0, count).map((w) => ({
    word: w.word,
    count: w.count,
  }));

  return jsonResponse({ count: top.length, identifiers: top });
}

async function handleLookup(query: string, maxResults: number): Promise<Response> {
  const data = await getVizData();
  const topWords = data.topWords as Array<Record<string, unknown>>;

  const q = query.toLowerCase();
  const matches = topWords
    .filter((w) => (w.word as string).toLowerCase().includes(q))
    .slice(0, maxResults);

  if (matches.length === 0) {
    return jsonResponse({ query, count: 0, identifiers: [] });
  }

  return jsonResponse({
    query,
    count: matches.length,
    identifiers: matches.map((w) => ({
      word: w.word,
      count: w.count,
      files: w.files || [],
    })),
  });
}

async function handlePowerPhrases(group?: string): Promise<Response> {
  const data = await getVizData();
  const topWords = data.topWords as Array<Record<string, unknown>>;

  const groups: Record<string, { title: string; patterns: string[] }> = {
    agent: {
      title: 'Agent Directives',
      patterns: [
        'directive',
        'autonomy',
        'orchestrat',
        'self_prompt',
        'agent_loop',
        'prime_directive',
        'self_improve',
        'coordination',
        'heartbeat',
        'consciousness',
      ],
    },
    communication: {
      title: 'Communication Patterns',
      patterns: [
        'broadcast',
        'relay',
        'dispatch',
        'subscribe',
        'emit',
        'notify',
        'handoff',
        'bridge',
        'channel',
        'message',
        'protocol',
        'negotiate',
      ],
    },
    vocabulary: {
      title: 'Effective Vocabulary',
      patterns: [
        'execute',
        'actualiz',
        'optimize',
        'validate',
        'enrich',
        'transform',
        'orchestrat',
        'compounding',
        'cascade',
        'amplif',
        'accelerat',
        'operationaliz',
      ],
    },
    intelligence: {
      title: 'System Intelligence',
      patterns: [
        'embedding',
        'vector',
        'similarity',
        'retrieval',
        'rag',
        'semantic',
        'knowledge',
        'memory',
        'context_pack',
        'skill_bank',
        'blueprint',
      ],
    },
    resilience: {
      title: 'Resilience Patterns',
      patterns: [
        'retry',
        'fallback',
        'circuit',
        'degraded',
        'graceful',
        'recovery',
        'resilien',
        'timeout',
        'backoff',
        'health_check',
        'watchdog',
      ],
    },
    governance: {
      title: 'Governance and Control',
      patterns: [
        'authorize',
        'permission',
        'policy',
        'compliance',
        'audit',
        'govern',
        'enforce',
        'constraint',
        'mandate',
        'escalat',
      ],
    },
  };

  const selected = group ? { [group]: groups[group] } : groups;
  if (group && !groups[group]) {
    return errorResponse(
      `Unknown group: "${group}". Available: ${Object.keys(groups).join(', ')}`,
      404
    );
  }

  const result: Record<string, unknown> = {};

  for (const [key, g] of Object.entries(selected)) {
    const groupMatches: Record<string, Array<{ word: string; count: number }>> = {};
    for (const pat of g.patterns) {
      const found = topWords
        .filter((w) => (w.word as string).toLowerCase().includes(pat.toLowerCase()))
        .slice(0, 5)
        .map((w) => ({ word: w.word as string, count: w.count as number }));

      if (found.length > 0) {
        groupMatches[pat] = found;
      }
    }
    result[key] = { title: g.title, patterns: groupMatches };
  }

  return jsonResponse(result);
}

async function handleCategories(name?: string): Promise<Response> {
  const data = await getVizData();
  const categories = data.categories as Record<string, Record<string, unknown>>;

  if (name && categories[name]) {
    const cat = categories[name];
    return jsonResponse({
      name,
      count: cat.count,
      total_occurrences: cat.totalOccurrences,
      top_words: cat.topWords,
    });
  }

  if (name && !categories[name]) {
    return errorResponse(
      `Unknown category: "${name}". Available: ${Object.keys(categories).join(', ')}`,
      404
    );
  }

  return jsonResponse({
    categories: Object.entries(categories).map(([catName, cat]) => ({
      name: catName,
      count: cat.count,
      total_occurrences: cat.totalOccurrences,
      sample_words: (cat.topWords as Array<Record<string, unknown>>).slice(0, 5),
    })),
  });
}

async function handleFiles(params: URLSearchParams): Promise<Response> {
  const data = await getVizData();
  const topFiles = data.topFiles as Array<Record<string, unknown>>;

  const search = params.get('search');
  const count = Math.min(parseInt(params.get('count') || '30') || 30, 100);

  let files = topFiles;
  if (search) {
    const q = search.toLowerCase();
    files = files.filter((f) => (f.file as string).toLowerCase().includes(q));
  }

  return jsonResponse({
    count: files.slice(0, count).length,
    files: files.slice(0, count).map((f) => ({
      file: f.file,
      identifiers: f.identifiers,
    })),
  });
}

async function handleDistribution(): Promise<Response> {
  const data = await getVizData();
  const distribution = data.distribution as Record<string, Record<string, number>>;

  return jsonResponse({
    by_frequency: distribution.byFrequency,
    by_length: distribution.byLength,
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const fnPrefix = '/functions/v1/concordance/';
    let path: string;
    if (pathname.startsWith(fnPrefix)) {
      path = pathname.slice(fnPrefix.length);
    } else if (
      pathname === '/functions/v1/concordance' ||
      pathname === '/functions/v1/concordance/'
    ) {
      path = '';
    } else {
      path = pathname.replace(/^\/+|\/+$/g, '');
      const idx = path.indexOf('concordance/');
      if (idx >= 0) {
        path = path.slice(idx + 'concordance/'.length);
      }
    }
    path = path.replace(/^\/+|\/+$/g, '');
    const parts = path.split('/').filter(Boolean);

    const route = parts[0] || '';
    const subRaw = parts.slice(1).join('/') || '';
    const sub = decodeURIComponent(subRaw);
    const params = url.searchParams;

    switch (route) {
      case '':
      case 'stats':
        return await handleStats();

      case 'top':
        return await handleTop(params);

      case 'lookup':
        if (req.method === 'POST') {
          const body = await req.json().catch(() => ({}));
          const query = body.query || params.get('query') || '';
          const max = body.max_results || parseInt(params.get('max_results') || '20') || 20;
          if (!query) return errorResponse('Missing "query" parameter');
          return await handleLookup(query, max);
        }
        const query = params.get('query');
        if (!query)
          return errorResponse(
            'Missing "query" parameter. Use ?query=search_term or POST JSON body'
          );
        return await handleLookup(query, parseInt(params.get('max_results') || '20') || 20);

      case 'power-phrases':
        return await handlePowerPhrases(sub || params.get('group') || undefined);

      case 'categories':
        return await handleCategories(
          sub || decodeURIComponent(params.get('name') || '') || undefined
        );

      case 'files':
        return await handleFiles(params);

      case 'distribution':
        return await handleDistribution();

      default:
        return errorResponse(
          `Unknown route: "${route}". Available: stats, top, lookup, power-phrases, categories, files, distribution`,
          404
        );
    }
  } catch (err) {
    console.error('Concordance API error:', err);
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
});
