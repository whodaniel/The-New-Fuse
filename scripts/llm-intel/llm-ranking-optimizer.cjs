#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = process.env.TNF_REPO_ROOT || path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(REPO_ROOT, 'data', 'llm-intel');
const INTEL_FILE = path.join(DATA_DIR, 'arena-intel.json');
const RECS_FILE = path.join(DATA_DIR, 'ranking-recommendations.json');

const CONFIG_FILES = {
  'model-providers': path.join(process.env.HOME || '/root', '.tnf', 'model-providers.json'),
  'llm-config': path.join(process.env.HOME || '/root', '.tnf', 'llm-config.json'),
  'provider-config': path.join(process.env.HOME || '/root', '.tnf', 'provider-config.json'),
  'hermes-config': path.join(process.env.HOME || '/root', '.hermes', 'config.yaml'),
  'hermes-fallback': path.join(process.env.HOME || '/root', '.hermes', 'model-fallback-chain.json'),
  'opencode-config': path.join(process.env.HOME || '/root', '.config', 'opencode', 'opencode.json'),
  'openclaw-main-models': path.join(process.env.HOME || '/root', '.openclaw', 'agents', 'main', 'agent', 'models.json'),
};

const NVIDIA_MODEL_MAP = {
  'glm-5.1': 'z-ai/glm-5.1',
  'glm5': 'z-ai/glm5',
  'glm4.7': 'z-ai/glm4.7',
  'kimi-k2.6': 'moonshotai/kimi-k2.6',
  'kimi-k2-instruct-0905': 'moonshotai/kimi-k2-instruct-0905',
  'kimi-k2-thinking': 'moonshotai/kimi-k2-thinking',
  'kimi-k2-instruct': 'moonshotai/kimi-k2-instruct',
  'kimi-k2': 'moonshotai/kimi-k2-instruct',
  'minimax-m2.7': 'minimaxai/minimax-m2.7',
  'minimax-m2.5': 'minimaxai/minimax-m2.5',
  'minimax-m2.1': 'minimaxai/minimax-m2.1',
  'deepseek-v4-flash': 'deepseek-ai/deepseek-v4-flash',
  'deepseek-v4-pro': 'deepseek-ai/deepseek-v4-pro',
  'deepseek-v3.2': 'deepseek-ai/deepseek-v3.2',
  'deepseek-v3.1-terminus': 'deepseek-ai/deepseek-v3.1-terminus',
  'deepseek-r1': 'deepseek-ai/deepseek-r1',
  'qwen3.5-397b': 'qwen/qwen3.5-397b-a17b',
  'qwen3-coder-480b': 'qwen/qwen3-coder-480b-a35b-instruct',
  'qwen3.5-122b': 'qwen/qwen3.5-122b-a10b',
  'qwen3-next-80b': 'qwen/qwen3-next-80b-a3b-instruct',
  'qwen3-next-80b-thinking': 'qwen/qwen3-next-80b-a3b-thinking',
  'qwen3-coder-next': 'qwen/qwen3-coder-next',
  'mistral-large-3': 'mistralai/mistral-large-3-675b-instruct-2512',
  'mistral-medium-3.5': 'mistralai/mistral-medium-3.5-128b',
  'mistral-medium-3': 'mistralai/mistral-medium-3-instruct',
  'devstral-2': 'mistralai/devstral-2-123b-instruct-2512',
  'mistral-small-4': 'mistralai/mistral-small-4-119b-2603',
  'magistral-small': 'mistralai/magistral-small-2506',
  'ministral-14b': 'mistralai/ministral-14b-instruct-2512',
  'gemma-4-31b': 'google/gemma-4-31b-it',
  'gemma-3n': 'google/gemma-3n-e4b-it',
  'gemma-3-27b': 'google/gemma-3-27b-it',
  'llama-4-maverick': 'meta/llama-4-maverick-17b-128e-instruct',
  'llama-3.3-70b': 'meta/llama-3.3-70b-instruct',
  'llama-3.1-405b': 'meta/llama-3.1-405b-instruct',
  'llama-3.2-90b-vision': 'meta/llama-3.2-90b-vision-instruct',
  'llama-guard-4': 'meta/llama-guard-4-12b',
  'gpt-oss-120b': 'openai/gpt-oss-120b',
  'gpt-oss-20b': 'openai/gpt-oss-20b',
  'phi-4-multimodal': 'microsoft/phi-4-multimodal-instruct',
  'phi-4-mini': 'microsoft/phi-4-mini-instruct',
  'phi-3.5-moe': 'microsoft/phi-3.5-moe-instruct',
  'seed-oss-36b': 'bytedance/seed-oss-36b-instruct',
  'yi-large': '01-ai/yi-large',
  'palmyra-creative': 'writer/palmyra-creative-122b',
  'stockmark-2': 'stockmark/stockmark-2-100b-instruct',
  'dracarys': 'abacusai/dracarys-llama-3.1-70b-instruct',
  'claude-opus-4': 'anthropic/claude-opus-4',
  'claude-sonnet-4': 'anthropic/claude-sonnet-4',
  'gpt-5': 'openai/gpt-5',
  'gpt-4o': 'openai/gpt-4o',
  'gemini-2.5-pro': 'google/gemini-2.5-pro',
  'gemini-2.5-flash': 'google/gemini-2.5-flash',
};

function readJson(filePath, fallback) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { return fallback; }
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
}

function readYaml(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const result = {};
    let currentKey = null;
    let currentSubKey = null;
    for (const line of lines) {
      const trimmed = line.trimEnd();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const indent = line.search(/\S/);
      if (indent === 0) {
        const match = trimmed.match(/^(\w[\w_-]*):\s*(.*)/);
        if (match) {
          currentKey = match[1];
          if (match[2]) result[currentKey] = match[2].trim().replace(/^['"]|['"]$/g, '');
          else result[currentKey] = {};
          currentSubKey = null;
        }
      } else if (indent === 2 && typeof result[currentKey] === 'object') {
        const match = trimmed.match(/^(\S+):\s*(.*)/);
        if (match) {
          currentSubKey = match[1];
          if (match[2]) result[currentKey][currentSubKey] = match[2].trim().replace(/^['"]|['"]$/g, '');
          else result[currentKey][currentSubKey] = {};
        }
      }
    }
    return result;
  } catch { return {}; }
}

function normalizeModelName(raw) {
  const lower = raw.toLowerCase().replace(/[^a-z0-9.-]/g, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, '');
  for (const [short, full] of Object.entries(NVIDIA_MODEL_MAP)) {
    if (lower.includes(short.replace(/[^a-z0-9]/g, '')) || lower === short) return full;
  }
  return null;
}

function computeCompositeScores(intel) {
  const latest = intel.snapshots?.[0];
  if (!latest) return [];

  const modelScores = {};

  for (const arena of latest.arenaData || []) {
    if (arena.status !== 'success') continue;
    const weight = arena.sourceType === 'arena' ? 1.0 : 0.7;
    for (const r of arena.rankings || []) {
      const nvidiaId = normalizeModelName(r.model);
      if (!nvidiaId) continue;
      if (!modelScores[nvidiaId]) {
        modelScores[nvidiaId] = { nvidiaId, arenaScores: [], avgArenaScore: 0, bestRank: Infinity };
      }
      modelScores[nvidiaId].arenaScores.push(r.score * weight);
      if (r.rank < modelScores[nvidiaId].bestRank) modelScores[nvidiaId].bestRank = r.rank;
    }
  }

  for (const [id, data] of Object.entries(modelScores)) {
    data.avgArenaScore = data.arenaScores.length > 0
      ? Math.round(data.arenaScores.reduce((a, b) => a + b, 0) / data.arenaScores.length)
      : 0;
  }

  for (const health of latest.nvidiaHealth || []) {
    if (!modelScores[health.model]) {
      modelScores[health.model] = { nvidiaId: health.model, arenaScores: [], avgArenaScore: 0, bestRank: Infinity };
    }
    modelScores[health.model].healthStatus = health.status;
    modelScores[health.model].latencyMs = health.latencyMs;
  }

  const sorted = Object.values(modelScores).sort((a, b) => {
    const aLive = a.healthStatus === 'live' ? 1 : (a.healthStatus === 'timeout' ? 0.5 : 0);
    const bLive = b.healthStatus === 'live' ? 1 : (b.healthStatus === 'timeout' ? 0.5 : 0);
    if (aLive !== bLive) return bLive - aLive;
    if (a.avgArenaScore !== b.avgArenaScore) return b.avgArenaScore - a.avgArenaScore;
    return a.bestRank - b.bestRank;
  });

  sorted.forEach((entry, idx) => { entry.compositeRank = idx + 1; });

  return sorted;
}

function getCurrentPriorityOrder() {
  const mp = readJson(CONFIG_FILES['model-providers'], { providers: [] });
  return mp.providers
    .filter(p => p.endpoint?.includes('nvidia'))
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
    .map(p => ({ id: p.id, model: p.model, priority: p.priority }));
}

function generateRecommendations(compositeScores, currentOrder) {
  const recommendations = [];
  const proposedOrder = compositeScores
    .filter(s => s.healthStatus === 'live' || s.healthStatus === 'timeout' || !s.healthStatus)
    .map((s, idx) => ({ model: s.nvidiaId, proposedPriority: idx }));

  for (const proposed of proposedOrder) {
    const current = currentOrder.find(c => c.model === proposed.model);
    const currentPriority = current?.priority ?? -1;
    const delta = currentPriority >= 0 ? proposed.proposedPriority - currentPriority : null;
    const action = delta === null ? 'add' : (Math.abs(delta) >= 3 ? 'reorder' : 'keep');

    if (action !== 'keep') {
      recommendations.push({
        model: proposed.model,
        action,
        currentPriority: currentPriority >= 0 ? currentPriority : null,
        proposedPriority: proposed.proposedPriority,
        delta: delta ?? 'new',
        reason: action === 'add'
          ? 'Model not in current config but is live on NVIDIA NGC'
          : `Arena score change suggests priority shift of ${Math.abs(delta)} positions`,
        compositeScore: compositeScores.find(s => s.nvidiaId === proposed.model)?.avgArenaScore ?? 0,
        healthStatus: compositeScores.find(s => s.nvidiaId === proposed.model)?.healthStatus ?? 'unknown',
      });
    }
  }

  for (const current of currentOrder) {
    const exists = proposedOrder.some(p => p.model === current.model);
    const health = compositeScores.find(s => s.nvidiaId === current.model)?.healthStatus;
    if (!exists || health === 'eol') {
      recommendations.push({
        model: current.model,
        action: health === 'eol' ? 'remove-eol' : 'demote',
        currentPriority: current.priority,
        proposedPriority: null,
        delta: health === 'eol' ? 'eol' : 'demote-unranked',
        reason: health === 'eol'
          ? 'Model has reached end-of-life on NVIDIA NGC (HTTP 410)'
          : 'Model not found in arena rankings; consider demoting',
        compositeScore: 0,
        healthStatus: health ?? 'unknown',
      });
    }
  }

  return recommendations.sort((a, b) => {
    const order = { 'remove-eol': 0, 'add': 1, 'reorder': 2, 'demote': 3 };
    return (order[a.action] ?? 9) - (order[b.action] ?? 9);
  });
}

function generateNewsDigest(intel) {
  const latest = intel.snapshots?.[0];
  if (!latest) return [];

  const digest = [];
  for (const news of latest.newsData || []) {
    for (const article of news.articles || []) {
      const relevantModels = (article.modelMentions || [])
        .map(m => normalizeModelName(m))
        .filter(Boolean);
      if (relevantModels.length > 0) {
        digest.push({
          title: article.title,
          url: article.url,
          publishedAt: article.publishedAt,
          sentiment: article.sentiment,
          relevantNvidiaModels: [...new Set(relevantModels)],
          source: news.feed,
        });
      }
    }
  }
  return digest.slice(0, 20);
}

function main() {
  const startedAt = new Date().toISOString();
  console.log(`[${startedAt}] LLM Ranking Optimizer starting...`);

  fs.mkdirSync(DATA_DIR, { recursive: true });

  const intel = readJson(INTEL_FILE, { spec: 'tnf/llm-arena-intel/0.1', snapshots: [] });
  if (!intel.snapshots?.length) {
    console.log(JSON.stringify({ ok: false, error: 'No intel data available. Run llm-arena-intel-collector first.' }, null, 2));
    process.exit(1);
  }

  const compositeScores = computeCompositeScores(intel);
  const currentOrder = getCurrentPriorityOrder();
  const recommendations = generateRecommendations(compositeScores, currentOrder);
  const newsDigest = generateNewsDigest(intel);

  const output = {
    spec: 'tnf/llm-ranking-recommendations/0.1',
    generatedAt: startedAt,
    intelSnapshotId: intel.snapshots[0]?.id,
    compositeScores,
    currentPriorityOrder: currentOrder,
    recommendations,
    newsDigest,
    summary: {
      totalModelsScored: compositeScores.length,
      liveModels: compositeScores.filter(s => s.healthStatus === 'live').length,
      recommendationsCount: recommendations.length,
      addAction: recommendations.filter(r => r.action === 'add').length,
      reorderAction: recommendations.filter(r => r.action === 'reorder').length,
      removeEolAction: recommendations.filter(r => r.action === 'remove-eol').length,
      demoteAction: recommendations.filter(r => r.action === 'demote').length,
      newsItems: newsDigest.length,
    },
    advisory: 'This is an advisory report. No config files were modified. Review recommendations and apply manually or via tnf llm-apply-rankings.',
  };

  writeJson(RECS_FILE, output);

  const markdownReport = generateMarkdownReport(output);
  const reportPath = path.join(DATA_DIR, 'ranking-report-latest.md');
  fs.writeFileSync(reportPath, markdownReport, 'utf8');

  console.log(JSON.stringify({
    ok: true,
    summary: output.summary,
    advisory: output.advisory,
  }, null, 2));
}

function generateMarkdownReport(output) {
  const lines = [
    `# LLM Ranking Report`,
    `Generated: ${output.generatedAt}`,
    `Intel Snapshot: ${output.intelSnapshotId}`,
    '',
    '## Summary',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Models Scored | ${output.summary.totalModelsScored} |`,
    `| Live on NVIDIA | ${output.summary.liveModels} |`,
    `| Recommendations | ${output.summary.recommendationsCount} |`,
    `| Add New | ${output.summary.addAction} |`,
    `| Reorder | ${output.summary.reorderAction} |`,
    `| Remove EOL | ${output.summary.removeEolAction} |`,
    `| Demote Unranked | ${output.summary.demoteAction} |`,
    '',
    '## Composite Rankings',
    '',
    '| Rank | Model | Arena Score | Health | Latency |',
    '|------|-------|-------------|--------|---------|',
  ];

  for (const s of output.compositeScores.slice(0, 30)) {
    const health = s.healthStatus || 'unknown';
    const latency = s.latencyMs ? `${s.latencyMs}ms` : '-';
    lines.push(`| ${s.compositeRank} | \`${s.nvidiaId}\` | ${s.avgArenaScore || '-'} | ${health} | ${latency} |`);
  }

  if (output.recommendations.length > 0) {
    lines.push('', '## Recommendations', '', '| Action | Model | Current | Proposed | Reason |', '|--------|-------|---------|----------|--------|');
    for (const r of output.recommendations) {
      lines.push(`| ${r.action} | \`${r.model}\` | ${r.currentPriority ?? '-'} | ${r.proposedPriority ?? '-'} | ${r.reason.slice(0, 60)} |`);
    }
  }

  if (output.newsDigest.length > 0) {
    lines.push('', '## News Digest', '', '| Title | Sentiment | Models |', '|-------|-----------|--------|');
    for (const n of output.newsDigest.slice(0, 10)) {
      const models = n.relevantNvidiaModels.slice(0, 3).join(', ');
      lines.push(`| ${n.title?.slice(0, 50) || '-'} | ${n.sentiment} | ${models} |`);
    }
  }

  lines.push('', '---', '', '> This report is advisory only. No configs were modified.', `> Apply: \`pnpm run tnf:llm:apply-rankings\``);
  return lines.join('\n');
}

try { main(); } catch (e) {
  console.error(JSON.stringify({ ok: false, error: e.message }, null, 2));
  process.exit(1);
}
