#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const dns = require('dns').promises;
const http = require('http');
const https = require('https');
const tls = require('tls');

function parseArgs(argv) {
  const args = {
    config: process.env.HOSTMARIA_PROJECTS_FILE || path.join(os.homedir(), '.tnf', 'hostmaria', 'projects.txt'),
    outDir: process.env.HOSTMARIA_REPORT_DIR || path.join(os.homedir(), '.tnf', 'hostmaria', 'reports'),
    timeoutMs: Number.parseInt(process.env.HOSTMARIA_HTTP_TIMEOUT_MS || '20000', 10),
    tlsWarnDays: Number.parseInt(process.env.HOSTMARIA_TLS_WARN_DAYS || '21', 10),
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
    } else if (arg === '--tls-warn-days' && argv[i + 1]) {
      args.tlsWarnDays = Number.parseInt(argv[++i], 10);
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/runtime/hostmaria-preservation-check.cjs [options]

Options:
  --config <path>         Projects list file (default: ~/.tnf/hostmaria/projects.txt)
  --out-dir <path>        Report output dir (default: ~/.tnf/hostmaria/reports)
  --timeout-ms <ms>       HTTP timeout in ms (default: 20000)
  --tls-warn-days <days>  TLS warning threshold in days (default: 21)
`);
}

function toIso(value) {
  try {
    return new Date(value).toISOString();
  } catch {
    return null;
  }
}

function normalizeTarget(input) {
  const raw = String(input || '').trim();
  if (!raw || raw.startsWith('#')) return null;
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withScheme);
    return {
      source: raw,
      url: parsed.toString(),
      host: parsed.hostname,
      protocol: parsed.protocol,
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

async function resolveHost(hostname) {
  const out = { a: [], aaaa: [] };
  try {
    out.a = await dns.resolve4(hostname);
  } catch {
    out.a = [];
  }
  try {
    out.aaaa = await dns.resolve6(hostname);
  } catch {
    out.aaaa = [];
  }
  return out;
}

function requestUrl(url, timeoutMs, maxRedirects) {
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
          timeMs: Date.now() - started,
          error: `Invalid URL: ${String(error.message || error)}`,
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
            'User-Agent': 'tnf-hostmaria-preservation-check/1.0',
            Accept: '*/*',
          },
        },
        (res) => {
          const statusCode = Number(res.statusCode || 0);
          const location = res.headers.location;
          if (location && statusCode >= 300 && statusCode < 400 && redirectsLeft > 0) {
            const next = new URL(location, currentUrl).toString();
            res.resume();
            run(next, redirectsLeft - 1);
            return;
          }

          res.on('data', () => {
            // Discard body; keep network overhead minimal.
          });
          res.on('end', () => {
            resolve({
              ok: statusCode >= 200 && statusCode < 400,
              statusCode,
              finalUrl: currentUrl,
              timeMs: Date.now() - started,
              error: null,
            });
          });
        }
      );

      req.on('timeout', () => {
        req.destroy(new Error(`Timeout after ${timeoutMs}ms`));
      });

      req.on('error', (error) => {
        resolve({
          ok: false,
          statusCode: 0,
          finalUrl: currentUrl,
          timeMs: Date.now() - started,
          error: String(error.message || error),
        });
      });

      req.end();
    };

    run(url, maxRedirects);
  });
}

function readTlsCert(hostname, timeoutMs) {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: hostname,
        port: 443,
        servername: hostname,
        rejectUnauthorized: false,
        timeout: timeoutMs,
      },
      () => {
        try {
          const cert = socket.getPeerCertificate();
          socket.end();
          if (!cert || !cert.valid_to) {
            resolve({ ok: false, error: 'No certificate data returned' });
            return;
          }
          const validTo = new Date(cert.valid_to);
          const daysRemaining = Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          resolve({
            ok: true,
            validTo: validTo.toISOString(),
            daysRemaining,
            issuer: cert.issuer || null,
            subject: cert.subject || null,
          });
        } catch (error) {
          resolve({ ok: false, error: String(error.message || error) });
        }
      }
    );

    socket.on('timeout', () => {
      socket.destroy(new Error(`TLS timeout after ${timeoutMs}ms`));
    });

    socket.on('error', (error) => {
      resolve({ ok: false, error: String(error.message || error) });
    });
  });
}

function deriveSeverity(httpResult, tlsResult, tlsWarnDays) {
  let severity = 'ok';
  const reasons = [];

  if (!httpResult.ok) {
    severity = 'critical';
    reasons.push(httpResult.error || `HTTP status ${httpResult.statusCode}`);
  } else if (httpResult.statusCode >= 400) {
    severity = 'warning';
    reasons.push(`HTTP status ${httpResult.statusCode}`);
  }

  if (!tlsResult.ok) {
    if (severity !== 'critical') severity = 'warning';
    reasons.push(tlsResult.error || 'TLS check failed');
  } else if (tlsResult.daysRemaining <= 0) {
    severity = 'critical';
    reasons.push(`TLS expired (${tlsResult.daysRemaining} days)`);
  } else if (tlsResult.daysRemaining <= tlsWarnDays && severity !== 'critical') {
    severity = 'warning';
    reasons.push(`TLS nearing expiry (${tlsResult.daysRemaining} days)`);
  }

  return { severity, reasons };
}

async function checkTarget(target, timeoutMs, tlsWarnDays, maxRedirects) {
  const [dnsResult, httpResult, tlsResult] = await Promise.all([
    resolveHost(target.host),
    requestUrl(target.url, timeoutMs, maxRedirects),
    target.protocol === 'https:' ? readTlsCert(target.host, timeoutMs) : Promise.resolve({ ok: false, error: 'Non-HTTPS target' }),
  ]);

  const { severity, reasons } = deriveSeverity(httpResult, tlsResult, tlsWarnDays);
  return {
    target: target.source,
    normalizedUrl: target.url,
    host: target.host,
    dns: dnsResult,
    http: httpResult,
    tls: tlsResult,
    severity,
    reasons,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  await fsp.mkdir(args.outDir, { recursive: true });

  const targets = await readTargets(args.config);
  if (targets.length === 0) {
    const payload = {
      generatedAt: new Date().toISOString(),
      status: 'warning',
      message: `No targets found in config: ${args.config}`,
      config: args.config,
      checks: [],
      summary: { total: 0, ok: 0, warning: 0, critical: 0 },
    };
    await fsp.writeFile(path.join(args.outDir, 'hostmaria-preservation-latest.json'), JSON.stringify(payload, null, 2));
    console.log(JSON.stringify(payload));
    process.exitCode = 1;
    return;
  }

  const checks = [];
  for (const target of targets) {
    // Sequential execution avoids burst traffic and keeps reports deterministic.
    // eslint-disable-next-line no-await-in-loop
    checks.push(await checkTarget(target, args.timeoutMs, args.tlsWarnDays, args.maxRedirects));
  }

  const summary = checks.reduce(
    (acc, row) => {
      acc.total += 1;
      acc[row.severity] += 1;
      return acc;
    },
    { total: 0, ok: 0, warning: 0, critical: 0 }
  );

  const report = {
    generatedAt: new Date().toISOString(),
    config: args.config,
    status: summary.critical > 0 ? 'critical' : summary.warning > 0 ? 'warning' : 'ok',
    thresholds: {
      tlsWarnDays: args.tlsWarnDays,
      timeoutMs: args.timeoutMs,
    },
    summary,
    checks,
  };

  const latestPath = path.join(args.outDir, 'hostmaria-preservation-latest.json');
  const historyPath = path.join(args.outDir, 'hostmaria-preservation-history.jsonl');
  await fsp.writeFile(latestPath, JSON.stringify(report, null, 2), 'utf8');
  await fsp.appendFile(historyPath, `${JSON.stringify(report)}\n`, 'utf8');

  const lines = checks.map((row) => {
    const httpCode = row.http?.statusCode || 0;
    const tlsDays = row.tls?.daysRemaining;
    const tlsLabel = Number.isFinite(tlsDays) ? `${tlsDays}d` : 'n/a';
    return `${row.severity.toUpperCase()} ${row.host} http=${httpCode} tls=${tlsLabel}`;
  });
  console.log(lines.join('\n'));
  console.log(`Summary: total=${summary.total} ok=${summary.ok} warning=${summary.warning} critical=${summary.critical}`);
  console.log(`Report: ${latestPath}`);

  if (summary.critical > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
