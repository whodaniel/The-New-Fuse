#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from 'playwright';

const argv = new Set(process.argv.slice(2));
const spawnServer = argv.has('--spawn');
const port = Number(process.env.SMOKE_PORT || 4313);
const baseUrl = process.env.BASE_URL || `http://127.0.0.1:${port}`;
const serverPath = path.resolve(process.cwd(), 'server.js');
const smokeToken = process.env.SMOKE_API_TOKEN || 'smoke-token';
const storageKey = 'casin8_client_v2';

async function call({ method = 'GET', endpoint, body, token = smokeToken }) {
  const url = `${baseUrl}${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // Keep raw text for diagnostics.
  }
  return { ok: res.ok, status: res.status, json, text, endpoint, method };
}

function assertResult(result, predicate, label) {
  if (!result.ok) {
    throw new Error(`${label} failed HTTP ${result.status}: ${result.text}`);
  }
  if (!predicate(result.json)) {
    throw new Error(`${label} failed predicate: ${JSON.stringify(result.json)}`);
  }
}

async function waitForHealth() {
  for (let i = 0; i < 120; i += 1) {
    try {
      const out = await call({ endpoint: '/api/health' });
      if (out.ok) return;
    } catch {
      // retry
    }
    await sleep(250);
  }
  throw new Error('Server health check timed out');
}

async function seedRollout() {
  const rolloutId = `rollout-ui-smoke-${Date.now()}`;
  const out = await call({
    method: 'POST',
    endpoint: '/api/strategy/traits/rollout',
    body: {
      rolloutId,
      agentIds: ['agent-omega', 'agent-alpha', 'agent-it-1'],
      canaryPercent: 34,
      rollback: {
        maxLossBps: 300,
        maxVolatilityBps: 1800,
        maxFairnessAlerts: 2,
      },
    },
  });
  assertResult(out, (j) => j?.ok === true && j?.rollout?.rolloutId === rolloutId, 'seed rollout');
  return rolloutId;
}

async function runBrowserSmoke(rolloutId) {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ baseURL: baseUrl });
    await context.addInitScript(
      ({ key, token }) => {
        localStorage.setItem(key, JSON.stringify({ apiToken: token }));
      },
      { key: storageKey, token: smokeToken }
    );

    const page = await context.newPage();
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: 'Trait Dashboard' }).click();
    await page.waitForFunction(() => {
      const el = document.querySelector('#agent-console-output');
      return !!el && el.textContent.includes('"rollouts"');
    });

    await page.locator('#trait-freeze').check();
    await page.getByRole('button', { name: 'Apply Freeze' }).click();
    await page.waitForFunction(() => {
      const el = document.querySelector('#agent-console-output');
      return !!el && el.textContent.includes('"freeze": true');
    });

    await page.locator('#trait-rollout-id').fill(rolloutId);
    await page.getByRole('button', { name: 'Get Rollout' }).click();
    await page.waitForFunction(
      (expectedRolloutId) => {
        const el = document.querySelector('#agent-console-output');
        return !!el && el.textContent.includes(expectedRolloutId);
      },
      rolloutId
    );

    const artifactId = `artifact-ui-smoke-${Date.now()}`;
    await page.locator('#trait-artifact-id').fill(artifactId);
    await page.getByRole('button', { name: 'Revoke Artifact' }).click();
    await page.waitForFunction(
      (expectedArtifactId) => {
        const el = document.querySelector('#agent-console-output');
        return (
          !!el && el.textContent.includes(expectedArtifactId) && el.textContent.includes('"revoked": true')
        );
      },
      artifactId
    );

    const outDir = path.resolve(process.cwd(), 'output', 'playwright');
    await fs.mkdir(outDir, { recursive: true });
    await page.screenshot({ path: path.join(outDir, 'trait-ui-smoke.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

async function main() {
  let child = null;
  let childLogBuffer = '';
  if (spawnServer) {
    child = spawn(process.execPath, [serverPath], {
      env: {
        ...process.env,
        PORT: String(port),
        CASIN8_API_TOKENS: JSON.stringify({ [smokeToken]: ['admin', 'poker'] }),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout?.on('data', (chunk) => {
      childLogBuffer += String(chunk || '');
      if (childLogBuffer.length > 12_000) {
        childLogBuffer = childLogBuffer.slice(-12_000);
      }
    });
    child.stderr?.on('data', (chunk) => {
      childLogBuffer += String(chunk || '');
      if (childLogBuffer.length > 12_000) {
        childLogBuffer = childLogBuffer.slice(-12_000);
      }
    });
    try {
      await waitForHealth();
    } catch (err) {
      const detail = childLogBuffer.trim() || 'no server output captured';
      throw new Error(`${err?.message || err}; server logs: ${detail}`);
    }
  }

  try {
    const rolloutId = await seedRollout();
    await runBrowserSmoke(rolloutId);
    console.log('Trait UI smoke passed');
    console.log(`- rolloutId: ${rolloutId}`);
    console.log('- screenshot: output/playwright/trait-ui-smoke.png');
  } finally {
    if (child) {
      child.kill('SIGTERM');
      await sleep(100);
    }
  }
}

main().catch((err) => {
  console.error(`Trait UI smoke failed: ${err?.message || err}`);
  process.exit(1);
});
