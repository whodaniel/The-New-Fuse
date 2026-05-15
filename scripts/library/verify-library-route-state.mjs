#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const canonicalRoot = process.env.TNF_VLIB_CANONICAL_ROOT
  ? path.resolve(process.env.TNF_VLIB_CANONICAL_ROOT)
  : path.join(process.env.HOME || '/tmp', 'Projects', 'virtual-library-blueprints');

const targets = [
  {
    label: 'mirror',
    file: path.join(repoRoot, 'apps/virtual-library-blueprints/cloudflare-virtual-library/wrangler.toml')
  },
  {
    label: 'canonical',
    file: path.join(canonicalRoot, 'cloudflare-virtual-library', 'wrangler.toml')
  }
];

function parseTomlLite(text) {
  const lines = text.split(/\r?\n/);
  const result = {
    workersDev: null,
    routes: [],
    vars: {}
  };
  let inVars = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    if (line.startsWith('[') && line.endsWith(']')) {
      inVars = line === '[vars]';
      continue;
    }

    const workersMatch = line.match(/^workers_dev\s*=\s*(true|false)\s*$/);
    if (workersMatch) {
      result.workersDev = workersMatch[1] === 'true';
      continue;
    }

    const routeArrayMatch = line.match(/^routes\s*=\s*\[(.*)\]\s*$/);
    if (routeArrayMatch) {
      const body = routeArrayMatch[1];
      const routeValues = [...body.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
      result.routes.push(...routeValues);
      continue;
    }

    const routeScalarMatch = line.match(/^route\s*=\s*"([^"]+)"\s*$/);
    if (routeScalarMatch) {
      result.routes.push(routeScalarMatch[1]);
      continue;
    }

    if (inVars) {
      const varMatch = line.match(/^([A-Z0-9_]+)\s*=\s*"([^"]*)"\s*$/);
      if (varMatch) {
        result.vars[varMatch[1]] = varMatch[2];
      }
    }
  }

  return result;
}

function deriveState(parsed) {
  if (parsed.workersDev === true && parsed.routes.length === 0) {
    return 'workers_dev_only';
  }
  if (parsed.routes.length > 0) {
    return 'custom_route_configured';
  }
  return 'unknown';
}

function main() {
  const generatedAt = new Date().toISOString();
  const report = {
    spec: 'tnf/library-route-state/1.0',
    generated_at_utc: generatedAt,
    repo_root: repoRoot,
    target_domain: 'library.thenewfuse.com',
    route_policy_decision: 'workers_dev_only',
    files: []
  };

  for (const target of targets) {
    if (!fs.existsSync(target.file)) {
      report.files.push({
        label: target.label,
        file: target.file,
        exists: false
      });
      continue;
    }

    const text = fs.readFileSync(target.file, 'utf8');
    const parsed = parseTomlLite(text);
    report.files.push({
      label: target.label,
      file: target.file,
      exists: true,
      workers_dev: parsed.workersDev,
      routes: parsed.routes,
      derived_state: deriveState(parsed),
      vars: {
        LIBRARY_ROUTE_STATE: parsed.vars.LIBRARY_ROUTE_STATE ?? null,
        LIBRARY_CUSTOM_ROUTE: parsed.vars.LIBRARY_CUSTOM_ROUTE ?? null,
        GCP_LIBRARY_URL: parsed.vars.GCP_LIBRARY_URL ?? null,
        ENVIRONMENT: parsed.vars.ENVIRONMENT ?? null
      }
    });
  }

  const allWorkersDevOnly = report.files
    .filter((f) => f.exists)
    .every((f) => f.derived_state === 'workers_dev_only');
  report.validation = {
    expected_state: 'workers_dev_only',
    all_workers_dev_only: allWorkersDevOnly
  };

  console.log(JSON.stringify(report, null, 2));
}

main();
