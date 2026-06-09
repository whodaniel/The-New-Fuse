#!/usr/bin/env node
/**
 * TNF Security Specialist Agent
 *
 * Audits XSS, CSRF, injection, auth flows, secret exposure,
 * dependency vulnerabilities, and security headers.
 *
 * Usage:
 *   node scripts/agents/webdev-security-skill.cjs --target <dir> --report <path>
 */

'use strict';

const fs = require('fs');
const path = require('path');

const { singleInstanceGuard } = require('../lib/tnf-single-instance-guard.cjs');

const target = process.argv.includes('--target') ? process.argv[process.argv.indexOf('--target') + 1] : '.';
const reportPath = process.argv.includes('--report') ? process.argv[process.argv.indexOf('--report') + 1] : 'security-audit-report.json';

const lockName = `security-${target.replace(/[^a-z0-9]/gi, '-')}`;
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

// ── Heuristic: XSS — dangerous innerHTML / direct DOM manipulation ──
function analyzeXSS(targetDir) {
  const files = walkFiles(targetDir, { extensions: ['.tsx', '.jsx', '.ts', '.js'] });
  let dangerousPatterns = 0;

  for (const file of files) {
    if (file.includes('/node_modules/')) continue;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      if (line.includes('dangerouslySetInnerHTML') && !line.includes('//')) {
        dangerousPatterns++;
        addFinding('critical', 'xss',
          'dangerouslySetInnerHTML found — raw HTML injection risk',
          file, idx + 1,
          'Sanitize with DOMPurify or switch to safe text rendering');
      }
      if (line.includes('.innerHTML') && !line.includes('//')) {
        dangerousPatterns++;
        addFinding('critical', 'xss',
          'Direct .innerHTML assignment — raw HTML injection risk',
          file, idx + 1,
          'Use .textContent instead, or sanitize with DOMPurify');
      }
    });
  }

  if (dangerousPatterns === 0) {
    addPraise('xss', 'No dangerous innerHTML or raw innerHTML patterns found');
  }

  return { dangerousPatterns };
}

// ── Heuristic: CSRF token usage ──
function analyzeCSRF(targetDir) {
  const files = walkFiles(targetDir, { extensions: ['.ts', '.js', '.tsx', '.jsx'] });
  let foundCsrfToken = false;
  let foundFetchWithoutToken = false;

  for (const file of files) {
    if (file.includes('/node_modules/')) continue;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      if (line.includes('X-CSRF-Token') || line.includes('csrfToken') || line.includes('xsrfToken')) {
        foundCsrfToken = true;
      }
      if (line.includes('fetch(') && line.includes('POST') && !line.includes('credentials')) {
        foundFetchWithoutToken = true;
      }
    });
  }

  if (!foundCsrfToken && foundFetchWithoutToken) {
    addFinding('warning', 'csrf',
      'No CSRF token protection found on POST requests',
      targetDir, null,
      'Add CSRF tokens for state-changing requests, or use SameSite=Lax cookies');
  } else if (foundCsrfToken) {
    addPraise('csrf', 'CSRF token protection detected');
  }

  return { foundCsrfToken };
}

// ── Heuristic: Secret exposure in client bundle ──
function analyzeSecretExposure(targetDir) {
  const files = walkFiles(targetDir, { extensions: ['.tsx', '.jsx', '.ts', '.js'] });
  let exposedSecrets = 0;
  const sensitivePatterns = [
    /process\.env\.(NEXT_PUBLIC_|REACT_APP_)/,
    /process\.env\.(API_KEY|SECRET|TOKEN|PASSWORD|DATABASE_URL)/,
  ];

  for (const file of files) {
    if (file.includes('/node_modules/') || file.includes('/.next/')) continue;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      for (const pattern of sensitivePatterns) {
        if (pattern.test(line) && !line.includes('//')) {
          exposedSecrets++;
          addFinding('critical', 'secrets',
            `Potential secret exposure: ${line.trim().substring(0, 60)}...`,
            file, idx + 1,
            'Move secrets to server-side only, never expose to client bundle');
        }
      }
    });
  }

  if (exposedSecrets === 0) {
    addPraise('secrets', 'No exposed secrets in client-side code');
  }

  return { exposedSecrets };
}

// ── Heuristic: Auth flow integrity (JWT handling) ──
function analyzeAuth(targetDir) {
  const files = walkFiles(targetDir, { extensions: ['.ts', '.js', '.tsx', '.jsx'] });
  let jwtUsageCount = 0;
  let refreshTokenRotation = false;

  for (const file of files) {
    if (file.includes('/node_modules/')) continue;
    const content = fs.readFileSync(file, 'utf8');

    if (content.includes('localStorage.getItem') && content.includes('token')) {
      addFinding('warning', 'auth',
        'JWT stored in localStorage — vulnerable to XSS theft',
        file, null,
        'Store tokens in httpOnly cookies instead');
    } else if (content.includes('httpOnly') && content.includes('cookie')) {
      addPraise('auth', 'Tokens appear stored in httpOnly cookies');
    }

    if (content.includes('refresh') && (content.includes('rotation') || content.includes('rotate'))) {
      refreshTokenRotation = true;
    }
  }

  if (!refreshTokenRotation) {
    addFinding('suggestion', 'auth',
      'No refresh token rotation detected',
      targetDir, null,
      'Implement refresh token rotation to prevent replay attacks');
  }

  return { jwtUsageCount };  
}

// ── Heuristic: Dependency vulnerability scan (basic) ──
function analyzeDependencies(targetDir) {
  const packageJsonPath = path.join(targetDir, 'package.json');
  let auditable = false;

  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    // Check for known vulnerable package versions (basic heuristic)
    const knownVulnerable = {
      'lodash': '<4.17.21',
      'express': '<4.17.3',
      'jsonwebtoken': '<9.0.0',
      'node-fetch': '<3.0.0',
    };

    for (const [pkgName, vulnerableVersion] of Object.entries(knownVulnerable)) {
      if (allDeps[pkgName]) {
        addFinding('warning', 'dependencies',
          `${pkgName}@${allDeps[pkgName]} — may be vulnerable (< ${vulnerableVersion})`,
          packageJsonPath, null,
          `Run: npm audit or upgrade ${pkgName}`);
      }
    }

    auditable = true;
    addPraise('dependencies', 'Dependencies in package.json — ready for audit');
  } else {
    addFinding('suggestion', 'dependencies',
      'No package.json found — cannot audit dependencies',
      targetDir, null,
      'Ensure package.json exists with dependency declarations');
  }

  return { auditable };
}

// ── Heuristic: HTTP security headers ──
function analyzeHeaders(targetDir) {
  // Look for helmet or custom header middleware
  const files = walkFiles(targetDir, { extensions: ['.ts', '.js', '.tsx'] });
  let foundHelmet = false;

  for (const file of files) {
    if (file.includes('/node_modules/')) continue;
    const content = fs.readFileSync(file, 'utf8');

    if (content.includes('helmet(') || content.includes('app.use(helmet')) {
      foundHelmet = true;
      addPraise('headers', 'Helmet.js security headers detected');
    }

    if (content.includes('Content-Security-Policy') || content.includes('X-Frame-Options')) {
      // Custom headers — still good
    }
  }

  if (!foundHelmet) {
    addFinding('suggestion', 'headers',
      'Helmet.js not detected — security headers may be incomplete',
      targetDir, null,
      'Add: app.use(helmet()) for default security headers');
  }

  return { foundHelmet };
}

// ── Utils ──
function walkFiles(dir, options = {}) {
  const { extensions = [] } = options;
  if (!fs.existsSync(dir)) return [];
  const results = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory() && file.name !== 'node_modules' && !file.name.startsWith('.')) {
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
const stats = {
  xss: analyzeXSS(target),
  csrf: analyzeCSRF(target),
  secrets: analyzeSecretExposure(target),
  auth: analyzeAuth(target),
  dependencies: analyzeDependencies(target),
  headers: analyzeHeaders(target),
};

const report = {
  agent: 'security',
  timestamp: new Date().toISOString(),
  target,
  stats,
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
console.log(`[security-agent] Report written to ${reportPath}`);
console.log(`[security-agent] Findings: ${findings.length} | Praises: ${praise.length}`);

guard.release();
