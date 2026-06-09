#!/usr/bin/env node
/**
 * TNF DevOps & Build Specialist Agent
 *
 * Audits Docker, CI/CD, bundles, environment parity, and deployments.
 *
 * Usage:
 *   node scripts/agents/webdev-devops-skill.cjs --target <dir> --report <path>
 */

'use strict';

const fs = require('fs');
const path = require('path');

const { singleInstanceGuard } = require('../lib/tnf-single-instance-guard.cjs');

const target = process.argv.includes('--target') ? process.argv[process.argv.indexOf('--target') + 1] : '.';
const reportPath = process.argv.includes('--report') ? process.argv[process.argv.indexOf('--report') + 1] : 'devops-audit-report.json';

const lockName = `devops-${target.replace(/[^a-z0-9]/gi, '-')}`;
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

// ── Heuristic: Dockerfile quality ──
function analyzeDocker(targetDir) {
  const dockerfilePath = path.join(targetDir, 'Dockerfile');
  const dockerIgnorePath = path.join(targetDir, '.dockerignore');

  if (!fs.existsSync(dockerfilePath)) {
    addFinding('suggestion', 'docker',
      'No Dockerfile found — no containerized build',
      targetDir, null,
      'Create a Dockerfile for reproducible, deployable builds');
    return { foundDockerfile: false };
  }

  const content = fs.readFileSync(dockerfilePath, 'utf8');
  let issues = 0;

  // Check for multi-stage build
  if (!content.includes('FROM') || !content.match(/FROM\s+\S+\s+as\s+\S+/i)) {
    addFinding('warning', 'docker',
      'Not using multi-stage build — image size likely large',
      dockerfilePath, null,
      'Use multi-stage: FROM node:18 AS builder, then FROM node:18-alpine AS production');
    issues++;
  } else {
    addPraise('docker', 'Multi-stage build detected');
  }

  // Check for .dockerignore
  if (!fs.existsSync(dockerIgnorePath)) {
    addFinding('warning', 'docker',
      'No .dockerignore — unnecessary files may be included',
      targetDir, null,
      'Add .dockerignore to exclude node_modules, .git, and .env');
  } else {
    addPraise('docker', '.dockerignore present');
  }

  // Check for large RUN layers (bad caching)
  const lines = content.split('\n');
  let installOnSingleLine = false;
  lines.forEach((line, idx) => {
    if (line.startsWith('RUN') && (line.includes('npm install') || line.includes('pnpm install'))) {
      if (!line.includes('&&')) {
        addFinding('suggestion', 'docker',
          'Separate RUN layer for package install — layer caching suboptimal',
          dockerfilePath, idx + 1,
          'Chain commands with && to create fewer layers');
      } else {
        installOnSingleLine = true;
      }
    }
  });

  if (installOnSingleLine) {
    addPraise('docker', 'Package install commands chained for optimal layer caching');
  }

  return { foundDockerfile: true, issues };
}

// ── Heuristic: CI/CD pipeline ──
function analyzeCI(targetDir) {
  const ciDir = path.join(targetDir, '.github', 'workflows');
  const gitlabCi = path.join(targetDir, '.gitlab-ci.yml');
  const jenkinsFile = path.join(targetDir, 'Jenkinsfile');

  let foundCI = false;

  if (fs.existsSync(ciDir)) {
    foundCI = true;
    addPraise('ci', 'GitHub Actions workflows found');
  }
  if (fs.existsSync(gitlabCi)) {
    foundCI = true;
    addPraise('ci', 'GitLab CI configuration found');
  }
  if (fs.existsSync(jenkinsFile)) {
    foundCI = true;
    addPraise('ci', 'Jenkins pipeline found');
  }

  if (!foundCI) {
    addFinding('warning', 'ci',
      'No CI/CD pipeline detected',
      targetDir, null,
      'Add GitHub Actions, GitLab CI, or Jenkins for automated testing and deployment');
  }

  return { foundCI };
}

// ── Heuristic: Build configuration ──
function analyzeBuild(targetDir) {
  const packageJson = path.join(targetDir, 'package.json');

  if (!fs.existsSync(packageJson)) {
    addFinding('warning', 'build',
      'No package.json — cannot analyze build config',
      targetDir, null,
      'Add package.json with build scripts');
    return {};
  }

  const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
  const scripts = pkg.scripts || {};

  if (!scripts.build) {
    addFinding('warning', 'build',
      'No "build" script in package.json',
      packageJson, null,
      'Add: "build": "next build" or "build": "vite build"');
  } else {
    addPraise('build', `Build script: ${scripts.build}`);
  }

  if (!scripts.lint) {
    addFinding('suggestion', 'build',
      'No "lint" script in package.json',
      packageJson, null,
      'Add: "lint": "eslint ." and enforce in CI');
  }

  if (!scripts.test) {
    addFinding('suggestion', 'build',
      'No "test" script in package.json',
      packageJson, null,
      'Add: "test": "vitest run" or "jest" and enforce in CI');
  }

  // Check for bundler config
  const viteConfig = path.join(targetDir, 'vite.config.ts');
  const nextConfig = path.join(targetDir, 'next.config.ts');
  if (!fs.existsSync(viteConfig) && !fs.existsSync(nextConfig)) {
    addFinding('suggestion', 'build',
      'No bundler config (vite.config.ts or next.config.ts) found',
      targetDir, null,
      'Add bundler configuration for optimization');
  }

  return { scripts: Object.keys(scripts) };
}

// ── Heuristic: Environment parity ──
function analyzeEnvironments(targetDir) {
  const envFiles = ['.env', '.env.production', '.env.staging', '.env.development'];
  let foundProduction = false;

  for (const envFile of envFiles) {
    if (fs.existsSync(path.join(targetDir, envFile))) {
      if (envFile === '.env.production') foundProduction = true;
      addPraise('environment', `Environment file: ${envFile}`);
    }
  }

  if (!foundProduction) {
    addFinding('suggestion', 'environment',
      'No .env.production file — production variables may be ad-hoc',
      targetDir, null,
      'Add .env.production and validate against staging before deploy');
  }

  return { foundProduction };
}

// ── Heuristic: Monitoring ──
function analyzeMonitoring(targetDir) {
  const files = walkFiles(targetDir, { extensions: ['.ts', '.js', '.tsx'] });
  let foundErrorTracking = false;
  let foundAnalytics = false;

  for (const file of files) {
    if (file.includes('/node_modules/')) continue;
    const content = fs.readFileSync(file, 'utf8');

    if (content.includes('Sentry') || content.includes('@sentry')) {
      foundErrorTracking = true;
    }
    if (content.includes('gtag') || content.includes('plausible') || content.includes('analytics')) {
      foundAnalytics = true;
    }
  }

  if (!foundErrorTracking) {
    addFinding('suggestion', 'monitoring',
      'No error tracking (Sentry, etc.) detected',
      targetDir, null,
      'Add Sentry or similar for production error monitoring');
  } else {
    addPraise('monitoring', 'Error tracking detected');
  }

  if (!foundAnalytics) {
    addFinding('suggestion', 'monitoring',
      'No analytics or RUM detected',
      targetDir, null,
      'Add Google Analytics, Plausible, or Vercel Analytics');
  } else {
    addPraise('monitoring', 'Analytics/RUM detected');
  }

  return { foundErrorTracking, foundAnalytics };
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
  docker: analyzeDocker(target),
  ci: analyzeCI(target),
  build: analyzeBuild(target),
  environment: analyzeEnvironments(target),
  monitoring: analyzeMonitoring(target),
};

const report = {
  agent: 'devops',
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
console.log(`[devops-agent] Report written to ${reportPath}`);
console.log(`[devops-agent] Findings: ${findings.length} | Praises: ${praise.length}`);

guard.release();
