#!/usr/bin/env node
/* eslint-disable no-console */

const path = require('node:path');
const { spawn } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const smokeScript = path.join(repoRoot, 'scripts', 'pi-bridge-smoke.cjs');
const categories = ['rate_limit', 'auth', 'timeout', 'availability'];

function runScenario(category, timeoutMs) {
  return new Promise((resolve) => {
    const args = [smokeScript, '--json', '--failure-category', category];
    const child = spawn('node', args, {
      cwd: repoRoot,
      env: {
        ...process.env,
        PI_BRIDGE_SMOKE_TIMEOUT_MS: String(timeoutMs),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('close', (code) => {
      let parsed = null;
      try {
        parsed = JSON.parse(stdout);
      } catch {
        parsed = null;
      }
      resolve({
        category,
        code,
        ok: code === 0 && parsed && parsed.ok === true,
        parsed,
        stdout,
        stderr,
      });
    });
  });
}

async function main() {
  const timeoutMs = Number(process.env.PI_BRIDGE_SMOKE_TIMEOUT_MS || '90000');
  const startedAt = Date.now();
  const results = [];

  for (const category of categories) {
    // eslint-disable-next-line no-await-in-loop
    const result = await runScenario(category, timeoutMs);
    results.push(result);
    console.log(
      `[${category}] ${result.ok ? 'pass' : 'fail'} (exit=${String(result.code)}, durationMs=${String(
        result.parsed?.durationMs ?? 'n/a'
      )})`
    );
  }

  const failed = results.filter((result) => !result.ok);
  const summary = {
    ok: failed.length === 0,
    durationMs: Date.now() - startedAt,
    scenarios: results.map((result) => ({
      category: result.category,
      ok: result.ok,
      exitCode: result.code,
      runId: result.parsed?.runId || null,
      durationMs: result.parsed?.durationMs || null,
      assertions: result.parsed?.assertions || [],
      errors: result.parsed?.errors || [],
    })),
  };

  console.log(JSON.stringify(summary, null, 2));

  if (failed.length > 0) {
    for (const result of failed) {
      if (result.stderr.trim()) {
        console.error(`[${result.category}] stderr:\n${result.stderr.slice(-2000)}`);
      }
      if (!result.parsed && result.stdout.trim()) {
        console.error(`[${result.category}] stdout (non-JSON):\n${result.stdout.slice(-2000)}`);
      }
    }
  }

  process.exit(summary.ok ? 0 : 2);
}

main().catch((error) => {
  console.error(`pi bridge failure matrix: fatal error: ${error.message}`);
  process.exit(2);
});

