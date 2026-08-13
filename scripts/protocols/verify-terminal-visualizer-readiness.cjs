#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');

function parseArgs(argv) {
  return {
    json: argv.includes('--json'),
  };
}

function exists(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  return { relativePath, fullPath, ok: fs.existsSync(fullPath) };
}

function fileIncludes(relativePath, pattern) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    return { relativePath, pattern, ok: false, reason: 'missing_file' };
  }
  const body = fs.readFileSync(fullPath, 'utf8');
  return { relativePath, pattern, ok: body.includes(pattern) };
}

function buildChecks() {
  return [
    exists('apps/frontend/public/visualizations/terminals/index.html'),
    exists('apps/frontend/public/visualizations/terminals/data/twip-terminal-macro-board.state.json'),
    exists('apps/frontend/public/visualizations/terminals/data/twip-terminal-macro-board-latest.md'),
    fileIncludes('apps/frontend/src/ComprehensiveRouter.tsx', '/visualizations/terminals'),
    fileIncludes('apps/frontend/src/routes/core.routes.tsx', '/visualizations/terminals'),
    fileIncludes('apps/frontend/src/pages/Visualizations.tsx', '/visualizations/terminals'),
    fileIncludes('scripts/protocols/twip-macro-board.cjs', 'frontendTerminalDir'),
    fileIncludes('scripts/protocols/twip-macro-board.cjs', 'writeFrontendArtifacts'),
  ];
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const checks = buildChecks();
  const failed = checks.filter((check) => !check.ok);
  const ok = failed.length === 0;
  const result = {
    ok,
    checks,
    summary: {
      total: checks.length,
      passed: checks.length - failed.length,
      failed: failed.length,
    },
  };

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`terminal-visualizer readiness: ${ok ? 'pass' : 'fail'}`);
    for (const check of checks) {
      const label = check.relativePath;
      const detail = check.pattern ? ` contains "${check.pattern}"` : '';
      console.log(`- [${check.ok ? 'ok' : 'fail'}] ${label}${detail}`);
    }
  }

  if (!ok) process.exit(2);
}

main();
