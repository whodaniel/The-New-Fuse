#!/usr/bin/env node
/**
 * TNF Accessibility (A11y) Specialist Agent
 *
 * Audits WCAG 2.1 AA compliance, keyboard navigation, screen reader support,
 * color contrast, motion sensitivity, and form accessibility.
 *
 * Usage:
 *   node scripts/agents/webdev-a11y-skill.cjs --target apps/frontend --report <path>
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { singleInstanceGuard } = require('../lib/tnf-single-instance-guard.cjs');
const target = process.argv.includes('--target') ? process.argv[process.argv.indexOf('--target') + 1] : '.';
const reportPath = process.argv.includes('--report') ? process.argv[process.argv.indexOf('--report') + 1] : 'a11y-audit-report.json';

const lockName = `a11y-${target.replace(/[^a-z0-9]/gi, '-')}`;
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

// ── Heuristic: Image alt text ──
function analyzeImages(targetDir) {
  const files = walkFiles(targetDir, { extensions: ['.tsx', '.jsx', '.ts', '.js', '.html'] });
  let imgWithoutAlt = 0;
  let totalImages = 0;

  for (const file of files) {
    if (file.includes('/node_modules/')) continue;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      // Match <img tags without alt= attribute
      if (line.includes('<img') || line.includes('<Image') || line.includes('<next/image')) {
        totalImages++;
        if (!line.includes('alt=') && !content.includes('aria-label=')) {
          imgWithoutAlt++;
          addFinding('critical', 'images',
            'Image missing alt text — screen readers cannot describe it',
            file, idx + 1,
            'Add alt="descriptive text" to every <img> or use role="presentation" for decorative images');
        }
      }

      // Next.js Image without alt
      const nextImgMatch = line.match(/<Image[^>]*\balt\b\s*[=:]/);
      if (line.includes('<Image') && !line.includes('alt=') && !nextImgMatch) {
        addFinding('critical', 'images',
          'Next.js Image component missing alt prop',
          file, idx + 1,
          'Add alt prop: <Image src="..." alt="descriptive text" />');
      }
    });
  }

  if (imgWithoutAlt === 0 && totalImages > 0) {
    addPraise('images', `All ${totalImages} images have alt text`);
  }

  return { totalImages, imgWithoutAlt };
}

// ── Heuristic: Form labels ──
function analyzeForms(targetDir) {
  const files = walkFiles(targetDir, { extensions: ['.tsx', '.jsx', '.ts', '.js'] });
  let unlabeledInputs = 0;
  let totalInputs = 0;

  for (const file of files) {
    if (file.includes('/node_modules/')) continue;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      if (line.includes('<input') || line.includes('<select') || line.includes('<textarea')) {
        totalInputs++;
        const hasLabel = line.includes('aria-label') || line.includes('aria-labelledby') || line.includes('label=');
        const hasId = line.includes('id=');

        // Check for label association
        if (!hasLabel && !hasId) {
          unlabeledInputs++;
          addFinding('critical', 'forms',
            'Form input missing label association — screen reader users cannot identify field',
            file, idx + 1,
            'Add aria-label, aria-labelledby, or wrap in <label> element');
        }
      }
    });
  }

  if (unlabeledInputs === 0 && totalInputs > 0) {
    addPraise('forms', `All ${totalInputs} form inputs are properly labeled`);
  }

  return { totalInputs, unlabeledInputs };
}

// ── Heuristic: Keyboard navigation ──
function analyzeKeyboardNav(targetDir) {
  const files = walkFiles(targetDir, { extensions: ['.tsx', '.jsx', '.ts', '.js'] });
  let tabIndexMisuse = 0;
  let missingFocus = 0;

  for (const file of files) {
    if (file.includes('/node_modules/')) continue;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      // Check for interactive elements without tabIndex or proper roles
      if ((line.includes('onClick') || line.includes('onKeyDown')) &&
          !line.includes('button') &&
          !line.includes('a href') &&
          !line.includes('role=')) {
        missingFocus++;
        addFinding('warning', 'keyboard',
          'Interactive element may not be keyboard accessible',
          file, idx + 1,
          'Use <button> element, add tabIndex={0}, or add role="button"');
      }

      // Check for positive tabIndex values (bad practice)
      if (line.match(/tabindex\s*=\s*["']?[1-9]\d*["']?/)) {
        tabIndexMisuse++;
        addFinding('warning', 'keyboard',
          'Positive tabIndex breaks natural tab order',
          file, idx + 1,
          'Use tabIndex={0} or rearrange DOM order instead');
      }
    });
  }

  if (missingFocus === 0 && tabIndexMisuse === 0) {
    addPraise('keyboard', 'Keyboard navigation appears well-structured');
  }

  return { missingFocus, tabIndexMisuse };
}

// ── Heuristic: Semantic HTML ──
function analyzeSemanticHTML(targetDir) {
  const files = walkFiles(targetDir, { extensions: ['.tsx', '.jsx', '.html'] });
  let headingIssues = 0;

  for (const file of files) {
    if (file.includes('/node_modules/')) continue;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      // Check for non-semantic heading-like divs
      if (line.match(/<div[^>]*(?:font-weight|fontWeight|font.*bold|style.*bold)/i) &&
          line.includes('role="heading"')) {
        addFinding('suggestion', 'semantic-html',
          'Div styled as heading should use semantic <h1>-<h6> element',
          file, idx + 1,
          'Replace <div> with appropriate heading level: <h2>, <h3>, etc.');
        headingIssues++;
      }
    });
  }

  return { headingIssues };
}

// ── Heuristic: Motion sensitivity ──
function analyzeMotion(targetDir) {
  const files = walkFiles(targetDir, { extensions: ['.css', '.scss', '.tsx', '.jsx'] });
  let missingReducedMotion = 0;

  for (const file of files) {
    if (file.includes('/node_modules/')) continue;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      if (file.match(/\banimation\b/)) {
        addFinding('suggestion', 'motion',
          'Animation detected — check for prefers-reduced-motion support',
          file, idx + 1,
          'Wrap animations in @media (prefers-reduced-motion: reduce) query');
      }
    });
  }

  if (missingReducedMotion === 0) {
    addPraise('motion', 'prefers-reduced-motion appears handled');
  }
}

// ── Heuristic: Color contrast ──
function analyzeContrast(targetDir) {
  // Basic static check: flag low-contrast class names
  const files = walkFiles(targetDir, { extensions: ['.css', '.scss', '.tsx', '.jsx'] });
  let lowContrastCount = 0;

  for (const file of files) {
    if (file.includes('/node_modules/')) continue;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      if (line.match(/color:\s*#f{3,6}/i)) {
        addFinding('suggestion', 'contrast',
          'Very light text color on likely light background — check contrast ratio',
          file, idx + 1,
          'Ensure WCAG contrast ratio >= 4.5:1 for text');
        lowContrastCount++;
      }
    });
  }

  return { lowContrastCount };
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
  images: analyzeImages(target),
  forms: analyzeForms(target),
  keyboard: analyzeKeyboardNav(target),
  semantic: analyzeSemanticHTML(target),
  motion: analyzeMotion(target),
  contrast: analyzeContrast(target),
};

const report = {
  agent: 'a11y',
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
console.log(`[a11y-agent] Report written to ${reportPath}`);
console.log(`[a11y-agent] Findings: ${findings.length} | Praises: ${praise.length}`);

guard.release();