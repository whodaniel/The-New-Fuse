#!/usr/bin/env node
/* eslint-disable no-console */
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const CANONICAL_OUTPUT = 'data/agent-registry';
const REGISTRY_FILES = [
  'agent-card.schema.json',
  'agent-cards.json',
  'agents.json',
  'master_user_agents.json',
  'agent_capabilities.json',
  'agent_tags.json',
  'agent_relationships.json',
  'registry_summary.json',
  'schema.sql',
];

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = sortDeep(value[key]);
    }
    return out;
  }
  return value;
}

function normalizeJsonByFile(file, value) {
  if (file === 'registry_summary.json') {
    const copy = { ...value };
    delete copy.generatedAt;
    return sortDeep(copy);
  }

  if (file === 'agent_capabilities.json' || file === 'agent_tags.json' || file === 'agent_relationships.json') {
    if (!Array.isArray(value)) return value;
    return value.map((entry) => {
      if (!entry || typeof entry !== 'object') return entry;
      const copy = { ...entry };
      delete copy.id;
      return sortDeep(copy);
    });
  }

  return sortDeep(value);
}

async function runBuildScript(repoRoot, outDirAbs) {
  const scriptPath = path.join(repoRoot, 'scripts/agent-registry/build-agent-registry.mjs');
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, '--out', outDirAbs], {
      cwd: repoRoot,
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`build-agent-registry exited with code ${code}`));
    });
  });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readComparableContent(filePath, fileName) {
  const raw = await fs.readFile(filePath, 'utf8');
  if (fileName.endsWith('.json')) {
    const parsed = JSON.parse(raw);
    const normalized = normalizeJsonByFile(fileName, parsed);
    return `${JSON.stringify(normalized, null, 2)}\n`;
  }
  return raw.replace(/\r\n/g, '\n');
}

async function main() {
  const repoRoot = process.cwd();
  const canonicalAbs = path.join(repoRoot, CANONICAL_OUTPUT);

  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'tnf-agent-registry-check-'));
  const generatedAbs = path.join(tempRoot, 'registry');

  try {
    await runBuildScript(repoRoot, generatedAbs);

    const missingCanonical = [];
    const missingGenerated = [];
    const drifted = [];

    for (const fileName of REGISTRY_FILES) {
      const canonicalPath = path.join(canonicalAbs, fileName);
      const generatedPath = path.join(generatedAbs, fileName);

      const hasCanonical = await fileExists(canonicalPath);
      const hasGenerated = await fileExists(generatedPath);

      if (!hasCanonical) {
        missingCanonical.push(fileName);
        continue;
      }
      if (!hasGenerated) {
        missingGenerated.push(fileName);
        continue;
      }

      const [canonicalNormalized, generatedNormalized] = await Promise.all([
        readComparableContent(canonicalPath, fileName),
        readComparableContent(generatedPath, fileName),
      ]);

      if (canonicalNormalized !== generatedNormalized) {
        drifted.push(fileName);
      }
    }

    if (missingCanonical.length || missingGenerated.length || drifted.length) {
      console.error('[agent-registry:check] drift detected.');
      if (missingCanonical.length) {
        console.error(`[agent-registry:check] missing canonical files: ${missingCanonical.join(', ')}`);
      }
      if (missingGenerated.length) {
        console.error(`[agent-registry:check] missing generated files: ${missingGenerated.join(', ')}`);
      }
      if (drifted.length) {
        console.error(`[agent-registry:check] changed files: ${drifted.join(', ')}`);
      }
      console.error('[agent-registry:check] Run: pnpm agents:registry:build');
      process.exit(1);
    }

    console.log('[agent-registry:check] no drift detected.');
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`[agent-registry:check] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
