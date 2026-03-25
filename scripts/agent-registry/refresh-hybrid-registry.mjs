#!/usr/bin/env node
/* eslint-disable no-console */
import { spawnSync } from 'node:child_process';

function parseArgs(argv) {
  const options = {
    apiBase: process.env.AGENT_REGISTRY_API_BASE || 'http://localhost:3004',
    snapshotPath: process.env.AGENT_REGISTRY_SNAPSHOT_PATH || 'data/agent-registry/agents.json',
    onlyType: process.env.AGENT_REGISTRY_ONLY_TYPE || '',
    adminToken: process.env.AGENT_REGISTRY_IMPORT_TOKEN || '',
    inquiry:
      process.env.AGENT_REGISTRY_HYBRID_VERIFY_INQUIRY ||
      'Need an orchestrator for hybrid vector and knowledge-graph retrieval with local-first operation',
    reindexAll: false,
    skipBuild: false,
    skipScreen: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if ((arg === '--api-base' || arg === '--api') && argv[i + 1]) {
      options.apiBase = argv[i + 1];
      i += 1;
      continue;
    }
    if ((arg === '--snapshot' || arg === '--snapshot-path') && argv[i + 1]) {
      options.snapshotPath = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--only-type' && argv[i + 1]) {
      options.onlyType = argv[i + 1];
      i += 1;
      continue;
    }
    if ((arg === '--token' || arg === '--admin-token') && argv[i + 1]) {
      options.adminToken = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--inquiry' && argv[i + 1]) {
      options.inquiry = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--reindex-all') {
      options.reindexAll = true;
      continue;
    }
    if (arg === '--skip-build') {
      options.skipBuild = true;
      continue;
    }
    if (arg === '--skip-screen') {
      options.skipScreen = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: node scripts/agent-registry/refresh-hybrid-registry.mjs [options]

Options:
  --api-base <url>        API base URL (default: AGENT_REGISTRY_API_BASE or http://localhost:3004)
  --snapshot <path>       Snapshot path for import (default: data/agent-registry/agents.json)
  --only-type <type>      Optional import filter (local|external|api|mcp)
  --token <token>         Optional x-admin-token for import endpoint
  --reindex-all           Force full trait vector reindex after import
  --inquiry <text>        Verification inquiry used for /traits/screen
  --skip-build            Skip local snapshot rebuild
  --skip-screen           Skip hybrid screen verification step
  --help, -h              Show this help
      `.trim());
      process.exit(0);
    }
  }

  options.apiBase = options.apiBase.replace(/\/+$/, '');
  return options;
}

async function requestJson({ method, url, body, headers = {} }) {
  const response = await fetch(url, {
    method,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const text = await response.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }

  return {
    ok: response.ok,
    status: response.status,
    body: parsed,
  };
}

function runBuildStep() {
  const result = spawnSync('node', ['scripts/agent-registry/build-agent-registry.mjs'], {
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`Snapshot build failed with exit code ${result.status ?? 'unknown'}`);
  }
}

async function main() {
  const options = parseArgs(process.argv);
  const summary = {
    ok: true,
    startedAt: new Date().toISOString(),
    config: {
      apiBase: options.apiBase,
      snapshotPath: options.snapshotPath,
      onlyType: options.onlyType || null,
      reindexAll: options.reindexAll,
      skipBuild: options.skipBuild,
      skipScreen: options.skipScreen,
    },
    steps: {},
  };

  try {
    if (!options.skipBuild) {
      runBuildStep();
      summary.steps.build = { ok: true };
    } else {
      summary.steps.build = { ok: true, skipped: true };
    }

    const importResponse = await requestJson({
      method: 'POST',
      url: `${options.apiBase}/api/agent-registry/import/snapshot`,
      body: {
        snapshotPath: options.snapshotPath,
        ...(options.onlyType ? { onlyType: options.onlyType } : {}),
      },
      headers: options.adminToken ? { 'x-admin-token': options.adminToken } : {},
    });

    summary.steps.importSnapshot = importResponse;
    if (!importResponse.ok) {
      throw new Error(`Import failed with HTTP ${importResponse.status}`);
    }

    if (options.reindexAll) {
      const reindexResponse = await requestJson({
        method: 'POST',
        url: `${options.apiBase}/api/agent-registry/traits/reindex`,
        body: {},
      });
      summary.steps.reindexAll = reindexResponse;
      if (!reindexResponse.ok) {
        throw new Error(`Full reindex failed with HTTP ${reindexResponse.status}`);
      }
    } else {
      summary.steps.reindexAll = { ok: true, skipped: true, reason: 'import already reindexes imported IDs' };
    }

    const statsResponse = await requestJson({
      method: 'GET',
      url: `${options.apiBase}/api/agent-registry/traits/stats`,
    });
    summary.steps.stats = statsResponse;
    if (!statsResponse.ok) {
      throw new Error(`Stats check failed with HTTP ${statsResponse.status}`);
    }

    if (!options.skipScreen) {
      const primaryScreenBody = {
        inquiry: options.inquiry,
        limit: 8,
        threshold: 0.35,
        includeChunks: false,
        useKnowledgeGraph: true,
      };

      let screenResponse = await requestJson({
        method: 'POST',
        url: `${options.apiBase}/api/agent-registry/traits/screen`,
        body: primaryScreenBody,
      });

      // Compatibility fallback for deployments that don't yet accept/use useKnowledgeGraph.
      if (!screenResponse.ok && screenResponse.status === 400) {
        const fallbackBody = {
          inquiry: options.inquiry,
          limit: 8,
          threshold: 0.35,
          includeChunks: false,
        };
        const fallbackResponse = await requestJson({
          method: 'POST',
          url: `${options.apiBase}/api/agent-registry/traits/screen`,
          body: fallbackBody,
        });

        summary.steps.hybridScreenPrimary = {
          ok: screenResponse.ok,
          status: screenResponse.status,
          body: screenResponse.body,
        };
        summary.steps.hybridScreenFallback = fallbackResponse;

        screenResponse = fallbackResponse;
      }

      summary.steps.hybridScreen = screenResponse;
      if (!screenResponse.ok) {
        throw new Error(`Hybrid screen check failed with HTTP ${screenResponse.status}`);
      }

      const screenBody =
        screenResponse.body && typeof screenResponse.body === 'object'
          ? screenResponse.body
          : null;
      const hasKnowledgeGraph =
        !!screenBody && Object.prototype.hasOwnProperty.call(screenBody, 'knowledgeGraph');
      const candidateCount = Array.isArray(screenBody?.candidates) ? screenBody.candidates.length : 0;

      summary.steps.hybridScreenValidation = {
        hasKnowledgeGraph,
        candidateCount,
      };

      if (!hasKnowledgeGraph) {
        summary.steps.hybridScreenWarning =
          'traits/screen response did not include knowledgeGraph; backend may be on an older schema.';
      }
    } else {
      summary.steps.hybridScreen = { ok: true, skipped: true };
    }
  } catch (error) {
    summary.ok = false;
    summary.error = error instanceof Error ? error.message : String(error);
  }

  summary.finishedAt = new Date().toISOString();
  console.log(JSON.stringify(summary, null, 2));
  process.exit(summary.ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
