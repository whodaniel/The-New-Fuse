#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const http = require('http');
const https = require('https');

function parseArgs(argv) {
  const args = {
    config: process.env.HOSTMARIA_PROJECTS_FILE || path.join(os.homedir(), '.tnf', 'hostmaria', 'projects.txt'),
    outDir: process.env.HOSTMARIA_ARCHIVE_DIR || path.join(os.homedir(), '.tnf', 'hostmaria', 'archive'),
    timeoutMs: Number.parseInt(process.env.HOSTMARIA_ARCHIVE_TIMEOUT_MS || '25000', 10),
    maxRedirects: 5,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--config' && argv[i + 1]) {
      args.config = argv[++i];
    } else if (arg === '--out-dir' && argv[i + 1]) {
      args.outDir = argv[++i];
    } else if (arg === '--timeout-ms' && argv[i + 1]) {
      args.timeoutMs = Number.parseInt(argv[++i], 10);
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/runtime/hostmaria-daily-archive.cjs [options]

Options:
  --config <path>      Projects list file (default: ~/.tnf/hostmaria/projects.txt)
  --out-dir <path>     Archive output dir (default: ~/.tnf/hostmaria/archive)
  --timeout-ms <ms>    HTTP timeout in ms (default: 25000)
`);
}

function normalizeTarget(raw) {
  const value = String(raw || '').trim();
  if (!value || value.startsWith('#')) return null;
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(withScheme);
    return {
      source: value,
      base: `${parsed.protocol}//${parsed.host}`,
      host: parsed.hostname,
    };
  } catch {
    return null;
  }
}

async function readTargets(configPath) {
  try {
    const raw = await fsp.readFile(configPath, 'utf8');
    return raw
      .split('\n')
      .map((line) => normalizeTarget(line))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function fetchText(url, timeoutMs, maxRedirects) {
  return new Promise((resolve) => {
    const started = Date.now();

    const run = (currentUrl, redirectsLeft) => {
      let parsed;
      try {
        parsed = new URL(currentUrl);
      } catch (error) {
        resolve({
          ok: false,
          statusCode: 0,
          finalUrl: currentUrl,
          body: '',
          headers: {},
          error: `Invalid URL: ${String(error.message || error)}`,
          timeMs: Date.now() - started,
        });
        return;
      }

      const lib = parsed.protocol === 'https:' ? https : http;
      const req = lib.request(
        currentUrl,
        {
          method: 'GET',
          timeout: timeoutMs,
          headers: {
            'User-Agent': 'tnf-hostmaria-daily-archive/1.0',
            Accept: '*/*',
          },
        },
        (res) => {
          const chunks = [];
          const statusCode = Number(res.statusCode || 0);
          const location = res.headers.location;
          if (location && statusCode >= 300 && statusCode < 400 && redirectsLeft > 0) {
            const next = new URL(location, currentUrl).toString();
            res.resume();
            run(next, redirectsLeft - 1);
            return;
          }

          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            resolve({
              ok: statusCode >= 200 && statusCode < 400,
              statusCode,
              finalUrl: currentUrl,
              body: Buffer.concat(chunks).toString('utf8'),
              headers: res.headers || {},
              error: null,
              timeMs: Date.now() - started,
            });
          });
        }
      );

      req.on('timeout', () => req.destroy(new Error(`Timeout after ${timeoutMs}ms`)));
      req.on('error', (error) =>
        resolve({
          ok: false,
          statusCode: 0,
          finalUrl: currentUrl,
          body: '',
          headers: {},
          error: String(error.message || error),
          timeMs: Date.now() - started,
        })
      );
      req.end();
    };

    run(url, maxRedirects);
  });
}

function sanitizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function archiveTarget(target, dateDir, timeoutMs, maxRedirects) {
  const targetDir = path.join(dateDir, sanitizeName(target.host));
  await fsp.mkdir(targetDir, { recursive: true });

  const endpoints = [
    { label: 'index', path: '/' },
    { label: 'robots', path: '/robots.txt' },
    { label: 'sitemap', path: '/sitemap.xml' },
  ];

  const captures = [];
  for (const endpoint of endpoints) {
    const url = `${target.base}${endpoint.path}`;
    // eslint-disable-next-line no-await-in-loop
    const result = await fetchText(url, timeoutMs, maxRedirects);
    const ext =
      endpoint.label === 'index'
        ? '.html'
        : endpoint.label === 'sitemap'
          ? '.xml'
          : '.txt';
    const bodyPath = path.join(targetDir, `${endpoint.label}${ext}`);
    const metaPath = path.join(targetDir, `${endpoint.label}.meta.json`);

    // Always write files to keep deterministic archive history.
    // eslint-disable-next-line no-await-in-loop
    await fsp.writeFile(bodyPath, result.body || '', 'utf8');
    // eslint-disable-next-line no-await-in-loop
    await fsp.writeFile(
      metaPath,
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          target: target.source,
          url,
          statusCode: result.statusCode,
          ok: result.ok,
          finalUrl: result.finalUrl,
          error: result.error,
          headers: result.headers,
          timeMs: result.timeMs,
        },
        null,
        2
      ),
      'utf8'
    );

    captures.push({
      endpoint: endpoint.label,
      url,
      statusCode: result.statusCode,
      ok: result.ok,
      error: result.error,
      bodyPath,
      metaPath,
    });
  }

  return {
    target: target.source,
    host: target.host,
    captures,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const targets = await readTargets(args.config);
  const dateStamp = new Date().toISOString().slice(0, 10);
  const dateDir = path.join(args.outDir, dateStamp);
  await fsp.mkdir(dateDir, { recursive: true });

  if (targets.length === 0) {
    const payload = {
      archivedAt: new Date().toISOString(),
      status: 'warning',
      message: `No targets found in config: ${args.config}`,
      config: args.config,
      targets: [],
    };
    await fsp.writeFile(path.join(dateDir, 'archive-summary.json'), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
    process.exitCode = 1;
    return;
  }

  const archived = [];
  for (const target of targets) {
    // eslint-disable-next-line no-await-in-loop
    archived.push(await archiveTarget(target, dateDir, args.timeoutMs, args.maxRedirects));
  }

  const summary = {
    archivedAt: new Date().toISOString(),
    config: args.config,
    outDir: dateDir,
    targetCount: archived.length,
    archived,
  };

  await fsp.writeFile(path.join(dateDir, 'archive-summary.json'), JSON.stringify(summary, null, 2), 'utf8');
  await fsp.writeFile(path.join(args.outDir, 'latest-archive-summary.json'), JSON.stringify(summary, null, 2), 'utf8');

  console.log(`Archived ${archived.length} target(s) to ${dateDir}`);
  for (const row of archived) {
    const okCount = row.captures.filter((capture) => capture.ok).length;
    console.log(`${row.host} endpoints_ok=${okCount}/${row.captures.length}`);
  }
}

main().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
