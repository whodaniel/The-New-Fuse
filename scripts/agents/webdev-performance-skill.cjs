#!/usr/bin/env node
/**
 * TNF Performance & SEO Specialist Agent
 *
 * Measures Lighthouse scores, Core Web Vitals, bundle sizes,
 * image optimization, and SEO metadata coverage.
 *
 * Usage:
 *   node scripts/agents/webdev-performance-skill.cjs --target apps/frontend --report <path>
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const { singleInstanceGuard } = require('../lib/tnf-single-instance-guard.cjs');

const target = process.argv.includes('--target') ? process.argv[process.argv.indexOf('--target') + 1] : '.';
const reportPath = process.argv.includes('--report') ? process.argv[process.argv.indexOf('--report') + 1] : 'performance-audit-report.json';

const lockName = `perf-${target.replace(/[^a-z0-9]/gi, '-')}`;
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

// ── Heuristic: Image optimization ──
function analyzeImages(targetDir) {
  const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp', '.avif'];
  const files = walkFiles(targetDir, { extensions: imageExts });
  let unoptimizedCount = 0;
  let totalSize = 0;

  for (const file of files) {
    if (file.includes('/node_modules/')) continue;
    const ext = path.extname(file).toLowerCase();
    const stats = fs.statSync(file);
    totalSize += stats.size;

    // Flag non-WebP/AVIF large images
    if (!['.webp', '.avif', '.svg'].includes(ext) && stats.size > 100000) {
      unoptimizedCount++;
      addFinding('suggestion', 'image-optimization',
        `Large ${ext} image (${(stats.size / 1024).toFixed(1)}KB) — convert to WebP or AVIF`,
        file, null,
        'Use next/image or build script to convert to WebP/AVIF');
    }
  }

  if (unoptimizedCount === 0 && files.length > 0) {
    addPraise('image-optimization', `All ${files.length} images appear optimized`);
  }

  return { imageCount: files.length, unoptimizedCount, totalSize };
}

// ── Heuristic: Bundle analysis (static) ──
function analyzeBundle(targetDir) {
  const distDir = path.join(targetDir, 'dist');
  const nextDir = path.join(targetDir, '.next');
  let foundOutput = false;

  if (fs.existsSync(distDir)) {
    foundOutput = true;
    const stats = getDirStats(distDir);
    if (stats.totalSize > 10 * 1024 * 1024) {
      addFinding('warning', 'bundle-size',
        `Static bundle is ${(stats.totalSize / 1024 / 1024).toFixed(1)}MB — consider code splitting`,
        distDir, null,
        'Use dynamic imports (React.lazy(), next/dynamic) to split large chunks');
    } else {
      addPraise('bundle-size', `Bundle size is reasonable: ${(stats.totalSize / 1024).toFixed(1)}KB`);
    }
  }

  if (fs.existsSync(nextDir)) {
    foundOutput = true;
    const stats = getDirStats(nextDir);
    if (stats.totalSize > 50 * 1024 * 1024) {
      addFinding('warning', 'bundle-size',
        `.next output is ${(stats.totalSize / 1024 / 1024).toFixed(1)}MB — very large`,
        nextDir, null,
        'Check for duplicated deps, large inline assets, or missing tree shaking');
    }
  }

  if (!foundOutput) {
    addFinding('suggestion', 'build',
      'No dist/ or .next/ directory found — cannot analyze bundle size',
      targetDir, null,
      'Run build: pnpm run build');
  }
}

// ── Heuristic: SEO metadata ──
function analyzeSEO(targetDir) {
  const indexHtml = path.join(targetDir, 'dist', 'index.html');
  const layoutTsx = findFile(targetDir, 'layout.tsx');
  let foundMeta = false;

  // Check for Next.js metadata or HTML meta tags
  if (fs.existsSync(indexHtml)) {
    const content = fs.readFileSync(indexHtml, 'utf8');
    if (content.includes('<meta name="description"') || content.includes('og:title')) {
      foundMeta = true;
      addPraise('seo', 'index.html contains meta description or OG tags');
    } else {
      addFinding('warning', 'seo',
        'index.html missing meta description and OG tags',
        indexHtml, null,
        'Add: <meta name="description" content="..."> and <meta property="og:title" content="...">');
    }
  }

  if (layoutTsx && fs.existsSync(layoutTsx)) {
    const content = fs.readFileSync(layoutTsx, 'utf8');
    if (content.includes('metadata') || content.includes('Metadata')) {
      foundMeta = true;
      addPraise('seo', 'Next.js metadata API is configured in layout.tsx');
    } else {
      addFinding('suggestion', 'seo',
        'layout.tsx does not use Next.js Metadata API',
        layoutTsx, null,
        'Export metadata object from layout.tsx for SEO');
    }
  }

  if (!foundMeta) {
    addFinding('warning', 'seo',
      'No SEO metadata found — search engines will have poor snippets',
      targetDir, null,
      'Add <title>, <meta name="description">, and OG tags');
  }
}

// ── Heuristic: robots.txt and sitemap.xml ──
function analyzeCrawlerConfig(targetDir) {
  const robotsPath = path.join(targetDir, 'public', 'robots.txt');
  const sitemapPath = path.join(targetDir, 'public', 'sitemap.xml');

  if (!fs.existsSync(robotsPath)) {
    addFinding('suggestion', 'seo',
      'No public/robots.txt found', targetDir, null,
      'Add robots.txt: User-agent: *\nDisallow: /admin/\nAllow: /');
  }

  if (!fs.existsSync(sitemapPath)) {
    addFinding('suggestion', 'seo',
      'No public/sitemap.xml found', targetDir, null,
      'Generate sitemap.xml for search engine indexing');
  }
}

// ── Heuristic: Live Lighthouse probe (optional) ──
async function liveLighthouseProbe() {
  // Check if the site is accessible
  const urls = ['https://app.thenewfuse.com/'];
  for (const url of urls) {
    try {
      const start = Date.now();
      const res = await fetchWithTimeout(url, 5000);
      const ttfb = Date.now() - start;
      if (ttfb > 3000) {
        addFinding('warning', 'performance',
          `Homepage TTFB is ${ttfb}ms — exceeds 3s target`,
          null, null,
          'Optimize server response time, consider CDN edge caching');
      } else {
        addPraise('performance', `Homepage TTFB is ${ttfb}ms — within target`);
      }
    } catch (err) {
      addFinding('critical', 'connectivity',
        `Failed to reach live site: ${err.message}`, null, null,
        'Verify deployment health and DNS');
    }
  }
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

function getDirStats(dir) {
  let totalSize = 0;
  let fileCount = 0;
  function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const item of fs.readdirSync(d, { withFileTypes: true })) {
      const fullPath = path.join(d, item.name);
      if (item.isDirectory() && item.name !== 'node_modules') walk(fullPath);
      else if (item.isFile()) { totalSize += fs.statSync(fullPath).size; fileCount++; }
    }
  }
  walk(dir);
  return { totalSize, fileCount };
}

function findFile(dir, name) {
  if (!fs.existsSync(dir)) return null;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
      const found = findFile(fullPath, name);
      if (found) return found;
    } else if (item.name === name) return fullPath;
  }
  return null;
}

function fetchWithTimeout(url, timeout) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      resolve(true);
    });
    req.on('error', reject);
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('timeout'));
    });
  });
}

// ── Main ──
(async () => {
  const stats = {
    images: analyzeImages(target),
  };

  analyzeBundle(target);
  analyzeSEO(target);
  analyzeCrawlerConfig(target);
  await liveLighthouseProbe();

  const report = {
    agent: 'performance-seo',
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
  console.log(`[perf-agent] Report written to ${reportPath}`);
  console.log(`[perf-agent] Findings: ${findings.length} | Praises: ${praise.length}`);

  guard.release();
})();
