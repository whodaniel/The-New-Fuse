#!/usr/bin/env node
// TNF Environment Discovery Adapter (TNF-EDA-001)
//
// Read-only first-run discovery: scans fixed surfaces for local agents,
// infrastructure, providers, apps, information stores, and live model endpoints,
// emits ~/.tnf/environment-manifest.json, never blocks, never mutates the host.
//
// Stable IDs: surface names are part of the public protocol. Add to
// docs/protocols/TNF_ENVIRONMENT_ADAPTER_REGISTRY.json when adding new ones.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const pexecFile = promisify(execFile);
const HOME = os.homedir();
const HOMEDOT_TNF = path.join(HOME, '.tnf');
const OUT = path.join(HOMEDOT_TNF, 'environment-manifest.json');

const PROVIDER_KEY_RE = new RegExp(
  /^(OPENAI|ANTHROPIC|GOOGLE|GEMINI|MISTRAL|NVIDIA|OPENROUTER|DEEPSEEK|GROQ|TOGETHER|FIREWORKS|XAI|COHERE|UPSTAGE|PERPLEXITY|REPLICATE|RUNPOD|MODAL|HUGGINGFACE|GITHUB|TAVILY|SERPER|BRAVE|EXA|JINA|FIRECRAWL)[_-]?([A-Z0-9_]*KEY|TOKEN)$/
);

const KNOWN_AGENTS = [
  'claude','codex','gemini','agy','kilo','opencode','cursor','hermes','agy','agy-cli',
  'agy-cli','openclaw','openinterpreter','aider','cline','continue','roo','windsurf',
  'tabby','pi','agy-coder','trae','agy-dev','hermes-cli','agy-agent','opencode-cli',
];

const KNOWN_INFRA = [
  'redis-server','postgres','qdrant','chroma','ollama','llama-cpp','vllm','comfyui-cli',
  'whisper-cli','elasticsearch','prometheus','grafana','jupyter','sqlite3','mysql',
];

const KNOWN_MODEL_PORTS = [11434, 1234, 5000, 8080, 8081];
const PROBE_BUDGET_MS = 500;

function nowIso() { return new Date().toISOString(); }
async function safeExec(cmd, args = [], timeoutMs = 500) {
  try {
    return await pexecFile(cmd, args, { timeout: timeoutMs, maxBuffer: 1024 * 64 });
  } catch {
    return null;
  }
}

async function probeBinary(name) {
  // Tries `which`, then `--version` (truncated). Both bounded to PROBE_BUDGET_MS.
  const which = await safeExec('which', [name], PROBE_BUDGET_MS);
  if (!which) return { name, binary: null, probe: 'absent' };
  const ver = await safeExec(name, ['--version'], PROBE_BUDGET_MS);
  return { name, binary: which.stdout.trim(), version: ver?.stdout?.trim() || undefined, probe: 'alive' };
}

async function probeListening() {
  const r = await safeExec('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN', '-F', 'pcn'], PROBE_BUDGET_MS);
  if (!r) return [];
  const out = [];
  let entry = {};
  for (const line of r.stdout.split('\n')) {
    if (line.startsWith('p')) { entry = { pid: parseInt(line.slice(1), 10) }; }
    else if (line.startsWith('c')) { entry.cmd = line.slice(1); }
    else if (line.startsWith('n')) {
      entry.addr = line.slice(1);
      if (entry.cmd) out.push(entry);
      entry = {};
    }
  }
  return out;
}

async function probeOllama() {
  try {
    const r = await safeExec('curl', ['-fsS', '--max-time', '1', 'http://localhost:11434/api/tags']);
    if (!r) return null;
    const j = JSON.parse(r.stdout);
    return { name: 'ollama', url: 'http://localhost:11434', models: (j.models || []).map((m) => m.name) };
  } catch { return null; }
}

async function probeProviderEnv() {
  const findings = [];
  for (const [k, v] of Object.entries(process.env)) {
    if (!PROVIDER_KEY_RE.test(k)) continue;
    findings.push({
      name: k.replace(/_KEY$/, '').toLowerCase(),
      keyName: k,
      keyLength: typeof v === 'string' ? v.length : 0,
      source: 'env',
    });
  }
  return findings;
}

async function probeMacApps() {
  if (process.platform !== 'darwin') return [];
  const r = await safeExec('lsappinfo', ['list'], PROBE_BUDGET_MS);
  if (!r) return [];
  return r.stdout
    .split('\n')
    .filter((l) => l.includes('"LSDisplayName"'))
    .map((l) => {
      const m = l.match(/"LSDisplayName"\s*=\s*"([^"]+)"/);
      return m ? { name: m[1], kind: 'macos-app', bundleId: undefined } : null;
    })
    .filter(Boolean)
    .slice(0, 50);
}

async function probeInformationStores() {
  const candidates = [
    ['Documents', path.join(HOME, 'Documents')],
    ['Notes',     path.join(HOME, 'Notes')],
    ['Obsidian',  path.join(HOME, 'Obsidian')],
    ['.knowledge',path.join(HOME, '.knowledge')],
  ];
  const out = [];
  for (const [name, dir] of candidates) {
    try {
      const stat = fs.statSync(dir);
      if (!stat.isDirectory()) continue;
      out.push({ name, kind: 'directory', path: dir, size: 'unknown' });
    } catch { /* absent, skip */ }
  }
  return out;
}

function buildFallbackChain(providers) {
  // Prefer known-free providers first, then known-stable ones, then everything else.
  const order = ['nvidia','google','openrouter','mistral','deepseek','openai','anthropic','groq','together'];
  const present = new Set(providers.map((p) => p.name));
  const chain = [];
  for (const p of order) if (present.has(p)) chain.push(p);
  for (const p of providers) if (!chain.includes(p.name)) chain.push(p.name);
  return chain;
}

function buildMountableAgents(agents) {
  return agents.filter((a) => a.probe === 'alive' && a.binary).map((a) => a.name);
}

function buildParitySkills(agents, infra, models) {
  const skills = [];
  if (agents.some((a) => a.name === 'claude')) skills.push('tnf-agent-ingestion');
  if (agents.some((a) => a.name === 'codex')) skills.push('codex');
  if (infra.some((i) => i.name === 'redis-server')) skills.push('redis-memory-provider');
  if (models.some((m) => m.name === 'ollama')) skills.push('tnf-local-llm-bridge');
  return Array.from(new Set(skills));
}

async function run() {
  fs.mkdirSync(HOMEDOT_TNF, { recursive: true });

  const host = {
    platform: process.platform,
    arch: process.arch,
    hostname: os.hostname(),
    node: process.version,
  };

  const agents = await Promise.all(KNOWN_AGENTS.map(probeBinary));
  const infra  = await Promise.all(KNOWN_INFRA.map(probeBinary));
  const providers = await probeProviderEnv();
  const listening = await probeListening();
  const apps = await probeMacApps();
  const info = await probeInformationStores();
  const liveModels = [];
  const ollama = await probeOllama();
  if (ollama) liveModels.push(ollama);

  const manifest = {
    schemaVersion: '1.0',
    host,
    discoveredAt: nowIso(),
    surfaces: {
      agents: agents.filter((a) => a.binary),
      infrastructure: infra
        .filter((i) => i.binary)
        .map((i) => ({ ...i, status: 'present', ports: listening.filter((l) => l.cmd === i.name).map((l) => l.addr) })),
      providers,
      apps,
      information: info,
      'running-models': liveModels,
      listeningPreview: listening.slice(0, 30),
    },
    decisions: {
      fallback_chain: buildFallbackChain(providers),
      mountable_agents: buildMountableAgents(agents),
      feature_parity: buildParitySkills(agents, infra, liveModels),
      skipped: [
        ...(providers.length === 0 ? [{ surface: 'provider:env', reason: 'no provider keys detected' }] : []),
        ...(apps.length === 0 && process.platform === 'darwin' ? [{ surface: 'app:macos', reason: 'lsappinfo not available' }] : []),
      ],
    },
  };

  fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2));
  process.stdout.write(`[tnf-environment-adapter] wrote ${OUT}\n`);
}

run().catch((err) => {
  process.stderr.write(`[tnf-environment-adapter] fatal: ${err?.stack || err}\n`);
  process.exit(0); // never block the boot
});
