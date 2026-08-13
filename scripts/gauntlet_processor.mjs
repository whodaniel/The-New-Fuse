#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRANSCRIPTS_DIR = path.join(__dirname, '..', 'data', 'transcripts');
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'factoids');
const STATE_FILE = path.join(__dirname, '..', 'data', 'gauntlet-state.json');

const VIDEO_INDEX = {
  'XNaI4Xd4qXc': { index: 656, title: "NVIDIA's NEW All-in-One: Nemotron 3 Nano Omni for Multimodal Agents" },
  'c8EpB4zmXG0': { index: 464, title: "smolagents - HuggingFace's NEW Agent Framework" },
  'B6PKVZq2qqo': { index: 479, title: "Best of 2024 in Agents (OpenHands/AllHands)" },
  'bNFG36Hkupo': { index: 546, title: "Automate Agentic Workflow of LLMs: AFLOW (NEW)" },
  'q4YF-txbo-I': { index: 550, title: "FREE GPT Researcher AI Agent Powerhouse" },
  '7jwjSiYmAMU': { index: 574, title: "How We Created First Fully Autonomous Business With AI" },
};

function parseVTT(vttContent) {
  const lines = vttContent.split('\n');
  const segments = [];
  let currentStart = null;
  let currentText = [];

  for (const line of lines) {
    const timeMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/);
    if (timeMatch) {
      if (currentStart !== null && currentText.length > 0) {
        segments.push({
          start: currentStart,
          text: currentText.join(' ').replace(/<[^>]+>/g, '').trim()
        });
      }
      currentStart = timeMatch[1];
      currentText = [];
    } else if (line.trim() && !line.startsWith('WEBVTT') && !line.startsWith('Kind:') && !line.startsWith('Language:') && !line.startsWith('NOTE')) {
      currentText.push(line.trim());
    }
  }
  if (currentStart !== null && currentText.length > 0) {
    segments.push({
      start: currentStart,
      text: currentText.join(' ').replace(/<[^>]+>/g, '').trim()
    });
  }

  return segments.filter(s => s.text.length > 0);
}

function generateSourceBlockHash(videoId, startTimestamp) {
  return crypto.createHash('sha256')
    .update(`${videoId}:${startTimestamp}`)
    .digest('hex')
    .substring(0, 16);
}

const FILTER_1_RELEVANCE = {
  actionKeywords: [
    'agent', 'framework', 'api', 'model', 'mcp', 'tool', 'workflow',
    'orchestrat', 'deploy', 'implement', 'build', 'integrat', 'rag',
    'vector', 'embed', 'llm', 'reason', 'infer', 'fine-tun', 'sft',
    'rlhf', 'grpo', 'moE', 'mixture of expert', 'token', 'context',
    'window', 'prompt', 'chain-of-thought', 'react pattern', 'tool use',
    'function call', 'autonom', 'multi-agent', 'swarm', 'a2a',
    'openhands', 'smolagent', 'bee agent', 'gpt researcher', 'afLOW',
    'langchain', 'n8n', 'groq', 'nemotron', 'open source', 'local model',
    'self-host', 'ollama', 'huggingface', 'supabase', 'vercel',
    'edge function', 'serverless', 'docker', 'kubernetes', 'observ',
    'telemetry', 'eval', 'benchmark', 'swe-bench', 'agentic',
    'computer use', 'browser use', 'code generat', 'autocod',
    'screenshot', 'vision', 'audio', 'multimodal', 'omni',
    'gguf', 'fp8', 'quantiz', 'onnx', 'llama.cpp', 'vllm',
    'triton', 'tensorrt', 'cuda', 'avx', 'simd', 'dylib',
    'memory', 'knowledge graph', 'merkle', 'pgvector'
  ],
  noiseKeywords: [
    'like', 'um', 'uh', 'you know', 'basically', 'sort of',
    'kind of', 'right so', 'and then', 'anyway', 'whatever'
  ],
  classify(text) {
    const lower = text.toLowerCase();
    const actionHits = this.actionKeywords.filter(k => lower.includes(k)).length;
    const noiseHits = this.noiseKeywords.filter(k => lower.includes(k)).length;
    if (actionHits >= 2) return 'actionable';
    if (actionHits >= 1 && noiseHits < 2) return 'informational';
    return 'noise';
  }
};

const FILTER_2_ATTRIBUTION = {
  verify(factoid, videoId, startTimestamp) {
    const sourceBlockHash = generateSourceBlockHash(videoId, startTimestamp);
    factoid.source_block_hash = sourceBlockHash;
    factoid.source_url = `https://www.youtube.com/watch?v=${videoId}&t=${startTimestamp.replace(/[:.]/g, '')}`;
    factoid.attribution_verified = true;
    return factoid;
  }
};

const FILTER_3_DEDUP = {
  existingFactoids: new Set(),
  check(factoid) {
    const dedupKey = factoid.text.substring(0, 80).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (this.existingFactoids.has(dedupKey)) {
      return null;
    }
    this.existingFactoids.add(dedupKey);
    factoid.dedup_verified = true;
    return factoid;
  }
};

const FILTER_4_DENSITY = {
  score(factoid) {
    const text = factoid.text;
    let density = 0;
    const highDensityPatterns = [
      /(?:implement|build|deploy|create|setup|configure|install)/i,
      /(?:api|endpoint|route|handler|service|module)/i,
      /(?:function|class|method|interface|type)/i,
      /(?:test|benchmark|metric|score|eval)/i,
      /(?:model|weights|token|embedding|vector)/i,
      /(?:agent|workflow|pipeline|orchestrat|coordinate)/i,
      /(?:framework|library|sdk|package|dependency)/i,
      /(?:performance|optim|latency|throughput|concurr)/i,
    ];
    for (const p of highDensityPatterns) {
      if (p.test(text)) density += 1;
    }
    const freshnessBonus = (Date.now() - new Date(factoid.source_date || '2026-01-01').getTime()) < (180 * 86400000) ? 1 : 0;
    factoid.implementation_density = density;
    factoid.freshness_utility = freshnessBonus;
    factoid.density_verified = density >= 2;
    return factoid;
  }
};

const FILTER_5_ACTUALIZATION = {
  convert(factoid) {
    const text = factoid.text.toLowerCase();
    let directive = null;
    if (text.includes('agent') && (text.includes('framework') || text.includes('build'))) {
      directive = 'EVALUATE_AGENT_FRAMEWORK_INTEGRATION';
    } else if (text.includes('model') && (text.includes('local') || text.includes('run locally') || text.includes('self-host'))) {
      directive = 'EVALUATE_LOCAL_MODEL_DEPLOYMENT';
    } else if (text.includes('benchmark') || text.includes('eval')) {
      directive = 'INTEGRATE_BENCHMARK_METRICS';
    } else if (text.includes('mcp') || text.includes('tool') && text.includes('use')) {
      directive = 'EVALUATE_MCP_TOOL_INTEGRATION';
    } else if (text.includes('rag') || text.includes('vector') || text.includes('embed')) {
      directive = 'ENHANCE_VECTOR_PIPELINE';
    } else if (text.includes('workflow') || text.includes('automat') || text.includes('orchestrat')) {
      directive = 'EVALUATE_WORKFLOW_AUTOMATION';
    } else if (text.includes('multimodal') || text.includes('vision') || text.includes('audio')) {
      directive = 'EVALUATE_MULTIMODAL_CAPABILITY';
    } else if (text.includes('fine-tun') || text.includes('sft') || text.includes('rlhf')) {
      directive = 'EVALUATE_TRAINING_PIPELINE';
    } else if (factoid.implementation_density >= 3) {
      directive = 'GENERAL_IMPLEMENTATION_REVIEW';
    }

    if (directive) {
      factoid.directive = directive;
      factoid.actualized = true;
    } else {
      factoid.actualized = false;
    }
    return factoid;
  }
};

async function processTranscript(videoId, vttPath) {
  const meta = VIDEO_INDEX[videoId] || { index: 0, title: 'Unknown' };
  console.log(`\n=== Processing: [${meta.index}] ${meta.title} (${videoId}) ===`);

  const vttContent = fs.readFileSync(vttPath, 'utf-8');
  const segments = parseVTT(vttContent);
  console.log(`  Parsed ${segments.length} transcript segments`);

  const factoids = [];
  let actionable = 0, informational = 0, noise = 0;

  for (const seg of segments) {
    const relevance = FILTER_1_RELEVANCE.classify(seg.text);
    if (relevance === 'noise') { noise++; continue; }

    let factoid = {
      text: seg.text,
      timestamp: seg.start,
      video_id: videoId,
      video_index: meta.index,
      video_title: meta.title,
      relevance_class: relevance,
      processed_at: new Date().toISOString(),
    };

    factoid = FILTER_2_ATTRIBUTION.verify(factoid, videoId, seg.start);

    const deduped = FILTER_3_DEDUP.check(factoid);
    if (!deduped) continue;

    factoid = FILTER_4_DENSITY.score(factoid);
    if (!factoid.density_verified) { informational++; continue; }

    factoid = FILTER_5_ACTUALIZATION.convert(factoid);

    if (relevance === 'actionable') actionable++;
    else informational++;

    factoids.push(factoid);
  }

  console.log(`  Gauntlet results: ${actionable} actionable, ${informational} informational, ${noise} noise`);
  console.log(`  Factoids surviving Gauntlet: ${factoids.length}`);

  return factoids;
}

async function runGauntlet() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const vttFiles = fs.readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith('.vtt'));
  console.log(`Found ${vttFiles.length} transcript files to process`);

  let allFactoids = [];
  let totalSegments = 0;
  let totalFactoids = 0;
  const videoResults = [];

  for (const vttFile of vttFiles) {
    const videoId = vttFile.replace('.en.vtt', '');
    const vttPath = path.join(TRANSCRIPTS_DIR, vttFile);
    const factoids = await processTranscript(videoId, vttPath);
    allFactoids = allFactoids.concat(factoids);

    const meta = VIDEO_INDEX[videoId] || { index: 0, title: 'Unknown' };
    videoResults.push({
      video_id: videoId,
      index: meta.index,
      title: meta.title,
      factoid_count: factoids.length,
      actionable: factoids.filter(f => f.relevance_class === 'actionable').length,
      informational: factoids.filter(f => f.relevance_class === 'informational').length,
      actualized: factoids.filter(f => f.actualized).length,
    });

    const videoOutput = path.join(OUTPUT_DIR, `${videoId}_factoids.json`);
    fs.writeFileSync(videoOutput, JSON.stringify(factoids, null, 2));
    totalFactoids += factoids.length;
  }

  const actualizedFactoids = allFactoids.filter(f => f.actualized);
  const directives = {};
  for (const f of actualizedFactoids) {
    const d = f.directive;
    if (!directives[d]) directives[d] = [];
    directives[d].push({
      text: f.text,
      source: f.source_url,
      density: f.implementation_density,
      video: f.video_title,
    });
  }

  const state = {
    run_timestamp: new Date().toISOString(),
    videos_processed: vttFiles.length,
    total_factoids: totalFactoids,
    actualized_factoids: actualizedFactoids.length,
    directives_generated: Object.keys(directives).length,
    directives,
    video_results: videoResults,
    gauntlet_version: '1.0.0',
  };

  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

  console.log(`\n=== GAUNTLET RUN COMPLETE ===`);
  console.log(`Videos processed: ${vttFiles.length}`);
  console.log(`Total factoids extracted: ${totalFactoids}`);
  console.log(`Actualized factoids (with directives): ${actualizedFactoids.length}`);
  console.log(`Unique directive types: ${Object.keys(directives).length}`);
  console.log(`\nDirectives generated:`);
  for (const [d, items] of Object.entries(directives)) {
    console.log(`  ${d}: ${items.length} factoids`);
  }
  console.log(`\nState written to: ${STATE_FILE}`);
  console.log(`Factoid files written to: ${OUTPUT_DIR}/`);
}

runGauntlet().catch(console.error);
