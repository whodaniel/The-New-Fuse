#!/usr/bin/env node
/**
 * TNF Frontend/UI/UX Specialist Agent
 *
 * Audits React/Next.js, Tailwind, component architecture, and visual polish.
 * Outputs standardized JSON report for the orchestrator.
 *
 * Usage:
 *   node scripts/agents/webdev-frontend-skill.cjs --target apps/frontend --report <path>
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { singleInstanceGuard } = require('../lib/tnf-single-instance-guard.cjs');

// Parse args
const target = process.argv.includes('--target') ? process.argv[process.argv.indexOf('--target') + 1] : '.';
const reportPath = process.argv.includes('--report') ? process.argv[process.argv.indexOf('--report') + 1] : 'frontend-audit-report.json';

// Guard — prevent duplicate runs for same target
const lockName = `frontend-${target.replace(/[^a-z0-9]/gi, '-')}`;
const guard = singleInstanceGuard({ lockName, staleMs: 10 * 60 * 1000 });
if (!guard.acquired) {
  console.error(JSON.stringify({ ok: true, skipped: true, reason: 'already-running', lock: guard.existingLock }));
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

// ── Heuristic: Component file analysis ──
function analyzeComponents(targetDir) {
  const files = walkFiles(targetDir, { extensions: ['.tsx', '.ts', '.jsx', '.js'] });
  let componentCount = 0;
  let classComponentCount = 0;
  let inlineStyleCount = 0;
  let consoleLogCount = 0;
  let magicNumberCount = 0;

  for (const file of files) {
    if (file.includes('/node_modules/')) continue;
    if (file.includes('/.next/')) continue;
    if (file.includes('/dist/')) continue;

    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    // Check for class components (should warn)
    if (lines.some(l => l.includes('class') && l.includes('extends') && l.includes('Component'))) {
      classComponentCount++;
      addFinding('warning', 'components',
        'Class component detected — consider migrating to functional with hooks',
        file, null,
        'Refactor to function component + useState/useEffect');
    }

    // Check for inline styles (bad practice with Tailwind)
    lines.forEach((line, idx) => {
      if (line.match(/style\s*=\s*\{\{[^}]+\}\}/)) {
        inlineStyleCount++;
        addFinding('suggestion', 'styling',
          'Inline style object detected — use Tailwind utility classes instead',
          file, idx + 1,
          'Replace style={{...}} with className="..." using Tailwind utilities');
      }
    });

    // Check for console.log
    lines.forEach((line, idx) => {
      if (line.includes('console.log') && !line.includes('//')) {
        consoleLogCount++;
      }
    });

    // Check for magic numbers
    lines.forEach((line, idx) => {
      if (line.match(/\b\d{3,}\b/) && !line.includes('//') && !line.includes('px') && !line.includes('ms')) {
        magicNumberCount++;
      }
    });

    componentCount++;
  }

  // Summary
  if (classComponentCount === 0) addPraise('components', 'All components are functional (hooks-based)');
  if (inlineStyleCount === 0) addPraise('styling', 'No inline style objects — clean Tailwind usage');
  if (consoleLogCount === 0) addPraise('hygiene', 'No stray console.log statements found');

  return { componentCount, classComponentCount, inlineStyleCount, consoleLogCount };
}

// ── Heuristic: Tailwind config quality ──
function analyzeTailwind(targetDir) {
  const tailwindPaths = [
    path.join(targetDir, 'tailwind.config.ts'),
    path.join(targetDir, 'tailwind.config.js'),
  ];
  let tailwindFound = false;

  for (const twPath of tailwindPaths) {
    if (fs.existsSync(twPath)) {
      tailwindFound = true;
      const content = fs.readFileSync(twPath, 'utf8');
      if (!content.includes('content:')) {
        addFinding('critical', 'tailwind-config',
          'tailwind.config is missing content array — purging will break',
          twPath, null,
          'Add content: ["./src/**/*.{ts,tsx}"] to tailwind.config');
      }
      if (content.includes('darkMode:') && !content.includes('class')) {
        addFinding('suggestion', 'tailwind-config',
          'Consider using darkMode: "class" for manual dark mode control',
          twPath, null,
          'Set darkMode: "class" and control via parent class');
      }
      break;
    }
  }

  if (!tailwindFound) {
    addFinding('warning', 'tailwind-config',
      'No tailwind.config found — using default configuration',
      targetDir, null,
      'Consider creating a custom tailwind.config for theme customization');
  }

  return { tailwindFound };
}

// ── Heuristic: Route structure ──
function analyzeRouting(targetDir) {
  const pagesDir = path.join(targetDir, 'pages');
  const appDir = path.join(targetDir, 'app');

  if (!fs.existsSync(pagesDir) && !fs.existsSync(appDir)) {
    addFinding('suggestion', 'routing',
      'Neither pages/ nor app/ directory found — may not be using Next.js',
      targetDir, null,
      'Next.js applications should use either pages/ or app/ routing');
  }

  if (fs.existsSync(pagesDir) && fs.existsSync(appDir)) {
    addFinding('warning', 'routing',
      'Both pages/ and app/ directories exist — hybrid routing can cause conflicts',
      targetDir, null,
      'Consider migrating fully to app/ directory');
  }

  if (fs.existsSync(appDir)) {
    addPraise('routing', 'Using Next.js App Router (app/ directory)');
  }
}

// ── Heuristic: State management ──
function analyzeStateManagement(targetDir) {
  const packageJsonPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps['zustand']) addPraise('state', 'Using Zustand for state management — lightweight and performant');
    if (deps['redux']) addFinding('suggestion', 'state', 'Consider migrating from Redux to Zustand for simpler API', packageJsonPath, null, 'Zustand has fewer boilerplate and better TypeScript support');
    if (deps['recoil']) addFinding('warning', 'state', 'Recoil is experimental — consider migration', packageJsonPath, null, 'Zustand or React Context are more stable alternatives');
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
const stats = {
  components: analyzeComponents(target),
  tailwind: analyzeTailwind(target),
}

analyzeRouting(target);
analyzeStateManagement(target);

// Write report
const report = {
  agent: 'frontend-ui-ux',
  timestamp: new Date().toISOString(),
  target,
  stats,
  findings, praise,
  summary: {
    totalFindings: findings.length,
    critical: findings.filter(f => f.severity === 'critical').length,
    warnings: findings.filter(f => f.severity === 'warning').length,
    suggestions: findings.filter(f => f.severity === 'suggestion').length,
    praises: praise.length,
  }
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
console.log(`[frontend-agent] Report written to ${reportPath}`);
console.log(`[frontend-agent] Findings: ${findings.length} | Praises: ${praise.length}`);

_guard.release();
