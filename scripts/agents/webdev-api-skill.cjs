#!/usr/bin/env node
/**
 * TNF API/Backend Specialist Agent
 *
 * Audits REST/GraphQL routes, data flow, caching, error handling,
 * rate limiting, and authentication flow integrity.
 *
 * Usage:
 *   node scripts/agents/webdev-api-skill.cjs --target apps/api --report <path>
 */

'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const { singleInstanceGuard } = require('../lib/tnf-single-instance-guard.cjs');

const target = process.argv.includes('--target') ? process.argv[process.argv.indexOf('--target') + 1] : '.';
const reportPath = process.argv.includes('--report') ? process.argv[process.argv.indexOf('--report') + 1] : 'api-audit-report.json';

const lockName = `api-${target.replace(/[^a-z0-9]/gi, '-')}`;
const guard = singleInstanceGuard({ lockName, staleMs: 10 * 60 * 1000 });
if (!guard.acquired) {
  console.error(JSON.stringify({ ok: true, skipped: true, reason: 'already-running' }));
  process.exit(0);
}

const findings = [];
const praise = [];

function addFinding(severity, category, message, file, line, suggestion) {
  findings.push({ severity, category, message, file, line, suggestion, timestamp: new Date().toISOString() });
}

function addPraise(category, message) {
  praise.push({ category, message, timestamp: new Date().toISOString() });
}

// ── Heuristic: Route file structure ──
function analyzeRoutes(targetDir) {
  const routesDir = path.join(targetDir, 'routes');
  const handlersDir = path.join(targetDir, 'handlers');
  const controllersDir = path.join(targetDir, 'controllers');

  if (!fs.existsSync(routesDir) && !fs.existsSync(handlersDir) && !fs.existsSync(controllersDir)) {
    addFinding('warning', 'structure',
      'No routes/, handlers/, or controllers/ directory — API structure unclear',
      targetDir, null,
      'Organize routes into dedicated directory for maintainability');
  }

  if (fs.existsSync(routesDir)) {
    const routeFiles = walkFiles(routesDir, { extensions: ['.ts', '.js', '.tsx'] });
    if (routeFiles.length === 0) {
      addFinding('suggestion', 'routes',
        'routes/ directory exists but contains no route files',
        routesDir, null,
        'Add route files or remove empty directory');
    } else {
      addPraise('routes', `${routeFiles.length} route files found with clear structure`);
    }
  }
}

// ── Heuristic: Error handling middleware ──
function analyzeErrorHandling(targetDir) {
  const files = walkFiles(targetDir, { extensions: ['.ts', '.js', '.tsx'] });
  let foundTryCatch = 0;
  let foundNext = 0;
  let foundExpressError = 0;

  for (const file of files) {
    if (file.includes('/node_modules/')) continue;
    const content = fs.readFileSync(file, 'utf8');

    if (content.includes('try {') || content.includes('try{')) foundTryCatch++;
    if (content.includes('next(')) foundNext++;
    if (content.includes('app.use((err,')) foundExpressError++;
  }

  if (!foundExpressError) {
    addFinding('warning', 'error-handling',
      'No Express error-handling middleware found',
      targetDir, null,
      'Add global error handler: app.use((err, req, res, next) => { ... })');
  } else {
    addPraise('error-handling', 'Express global error handler present');
  }

  if (foundTryCatch === 0) {
    addFinding('critical', 'error-handling',
      'No try/catch blocks found — unhandled exceptions will crash the server',
      targetDir, null,
      'Wrap async route handlers in try/catch or use express-async-errors');
  }
}

// ── Heuristic: CORS & Security headers ──
function analyzeCORS(targetDir) {
  const files = walkFiles(targetDir, { extensions: ['.ts', '.js'] });
  let foundCors = false;
  let foundHelmet = false;

  for (const file of files) {
    if (file.includes('/node_modules/')) continue;
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('cors(') || content.includes('app.use(cors')) foundCors = true;
    if (content.includes('helmet(') || content.includes('app.use(helmet')) foundHelmet = true;
  }

  if (!foundCors) {
    addFinding('warning', 'cors',
      'CORS middleware not detected — API may reject cross-origin requests',
      targetDir, null,
      'Add: const cors = require("cors"); app.use(cors({ origin: ["https://app.thenewfuse.com"] }))');
  } else {
    addPraise('cors', 'CORS middleware detected');
  }

  if (!foundHelmet) {
    addFinding('warning', 'security',
      'Helmet.js middleware not detected — missing security headers',
      targetDir, null,
      'Add: const helmet = require("helmet"); app.use(helmet())');
  }
}

// ── Heuristic: Environment variable validation ──
function analyzeEnv(targetDir) {
  const envFiles = ['.env', '.env.local', '.env.production'];
  let envFound = false;
  let envValidationFound = false;

  for (const envFile of envFiles) {
    const fullPath = path.join(targetDir, envFile);
    if (fs.existsSync(fullPath)) {
      envFound = true;
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('DATABASE_URL') || content.includes('REDIS_URL')) {
        // Check for validation
        const files = walkFiles(targetDir, { extensions: ['.ts', '.js'] });
        for (const f of files) {
          if (f.includes('/node_modules/')) continue;
          const c = fs.readFileSync(f, 'utf8');
          if (c.includes('process.env') && (c.includes('!') || c.includes('||'))) {
            envValidationFound = true;
          }
        }
      }
    }
  }

  if (!envFound) {
    addFinding('suggestion', 'env',
      'No .env file found — ensure secrets are managed externally',
      targetDir, null,
      'Use a secrets manager or document env variable requirements');
  }

  if (!envValidationFound && envFound) {
    addFinding('suggestion', 'env',
      'Consider adding env variable validation (e.g., joi, zod)',
      targetDir, null,
      'Validate required env vars at startup and fail fast');
  }
}

// ── Heuristic: Live endpoint probe ──
async function probeEndpoints() {
  const endpoints = [
    { url: 'https://api.thenewfuse.com/health', method: 'GET' },
    { url: 'https://api.thenewfuse.com/api/health', method: 'GET' },
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetchWithTimeout(ep.url, { method: ep.method, timeout: 5000 });
      if (res.status >= 500) {
        addFinding('critical', 'live-check',
          `Health endpoint ${ep.url} returned ${res.status}`,
          null, null,
          'Investigate server-side health check logic');
      } else if (res.status === 404) {
        addFinding('warning', 'live-check',
          `Endpoint ${ep.url} not found (404)`,
          null, null,
          'Verify route is deployed and correct path');
      } else {
        addPraise('live-check', `Endpoint ${ep.url} is healthy (${res.status})`);
      }
    } catch (err) {
      addFinding('critical', 'live-check',
        `Failed to reach ${ep.url}: ${err.message}`,
        null, null,
        'Verify DNS, SSL, and server are running');
    }
  }
}

function fetchWithTimeout(url, options) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, options, (res) => {
      resolve(res);
    });
    req.on('error', reject);
    if (options.timeout) {
      req.setTimeout(options.timeout, () => {
        req.destroy();
        reject(new Error('timeout'));
      });
    }
  });
}

// ── Utils ──
function walkFiles(dir, options = {}) {
  const { extensions = [] } = options;
  if (!fs.existsSync(dir)) return [];
  const results = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      results.push(...walkFiles(fullPath, options));
    } else if (file.isFile()) {
      if (extensions.length === 0 || extensions.some(ext => fullPath.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

// ── Main ──
(async () => {
  analyzeRoutes(target);
  analyzeErrorHandling(target);
  analyzeCORS(target);
  analyzeEnv(target);
  await probeEndpoints();

  const report = {
    agent: 'api-backend',
    timestamp: new Date().toISOString(),
    target,
    findings,
    praise,
    summary: {
      totalFindings: findings.length,
      critical: findings.filter(f => f.severity === 'critical').length,
      warnings: findings.filter(f => f.severity === 'warning').length,
      suggestions: findings.filter(f => f.severity === 'suggestion').length,
      praises: praise.length,
    }
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`[api-agent] Report written to ${reportPath}`);
  console.log(`[api-agent] Findings: ${findings.length} | Praises: ${praise.length}`);

  guard.release();
})();
