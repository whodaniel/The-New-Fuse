#!/usr/bin/env node
/**
 * Start Story Architect (:43120) + KWS (:43110) for Virtual Library browser voice.
 * Browser-safe companion to Tauri `ensure_library_audio_stack`.
 *
 * Usage:
 *   node scripts/library/ensure-library-audio-stack.cjs
 *   node scripts/library/ensure-library-audio-stack.cjs --json
 */
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const JSON_MODE = process.argv.includes('--json');

function log(msg) {
  if (!JSON_MODE) console.log(msg);
}

function probe(url, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

function resolveKwsDir() {
  const candidates = [
    path.join(ROOT, 'apps/extensions/audio-trigger-kws-mvp'),
    path.join(ROOT, '../TNF-Extensions/audio-trigger-kws-mvp'),
  ];
  return candidates.find((dir) => fs.existsSync(path.join(dir, 'src/server.ts')));
}

function resolveRelayDir() {
  const candidates = [
    path.join(ROOT, 'apps/virtual-library-blueprints/ai-relay'),
    path.join(ROOT, 'apps/extensions/virtual-library-blueprints/ai-relay'),
    path.join(ROOT, '../TNF-Extensions/virtual-library-blueprints/ai-relay'),
  ];
  return candidates.find((dir) => fs.existsSync(path.join(dir, 'server.mjs')));
}

function detach(cmd, args, opts) {
  const child = spawn(cmd, args, {
    ...opts,
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  return child.pid;
}

async function waitFor(url, label, attempts = 20) {
  for (let i = 0; i < attempts; i += 1) {
    if (await probe(url)) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  log(`[library-audio] ${label} did not become ready at ${url}`);
  return false;
}

async function main() {
  const relayDir = resolveRelayDir();
  if (!relayDir) {
    const err = 'Story Architect ai-relay/server.mjs not found';
    if (JSON_MODE) {
      console.log(JSON.stringify({ ok: false, error: err }));
      process.exit(1);
    }
    console.error(err);
    process.exit(1);
  }

  const storyUrl = 'http://127.0.0.1:43120/v1/health';
  const kwsUrl = 'http://127.0.0.1:43110/healthz';

  let storyAlready = await probe(storyUrl);
  let kwsAlready = await probe(kwsUrl);

  if (!storyAlready) {
    log('[library-audio] starting Story Architect on :43120');
    detach(process.execPath, [path.join(relayDir, 'server.mjs')], {
      cwd: relayDir,
      env: { ...process.env, PORT: '43120', RELAY_PORT: '43120' },
    });
  } else {
    log('[library-audio] Story Architect already up');
  }

  if (!kwsAlready) {
    const kwsDir = resolveKwsDir();
    if (!kwsDir) {
      log('[library-audio] KWS package not found (apps/extensions/audio-trigger-kws-mvp)');
    } else {
      log('[library-audio] starting KWS on :43110');
      // Not in pnpm workspace — run package-local via npx tsx.
      detach(process.execPath, ['npx', '--yes', 'tsx', 'src/server.ts'], {
        cwd: kwsDir,
        env: { ...process.env, APP_PORT: '43110', PORT: '43110' },
      });
    }
  } else {
    log('[library-audio] KWS already up');
  }

  const storyOk = storyAlready || (await waitFor(storyUrl, 'Story Architect'));
  const kwsOk = kwsAlready || (await waitFor(kwsUrl, 'KWS'));
  const result = {
    ok: storyOk && kwsOk,
    storyArchitect: storyAlready ? 'already_up' : storyOk ? 'started' : 'failed',
    kws: kwsAlready ? 'already_up' : kwsOk ? 'started' : 'failed',
    ports: { storyArchitect: 43120, kws: 43110 },
  };

  if (JSON_MODE) console.log(JSON.stringify(result));
  else {
    log(
      `[library-audio] done: story=${result.storyArchitect} kws=${result.kws}`
    );
  }
  process.exit(result.ok ? 0 : 1);
}

main().catch((err) => {
  if (JSON_MODE) console.log(JSON.stringify({ ok: false, error: String(err) }));
  else console.error(err);
  process.exit(1);
});
