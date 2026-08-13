#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const os = require('node:os');

const ROOT = process.cwd();
const RECEIPT_PATH = '.agent/runtime-logs/cursor-harness-onboard.latest.json';
const SKILL_SOURCE = '.agent/skills/tnf-cursor-harness-protocol';
const ASSIMILATION_ROUTES = '.agent/assimilation-routes.json';

const CURSOR_BINARY_CANDIDATES = [
  path.join(os.homedir(), '.local', 'bin', 'cursor'),
  '/Applications/Cursor.app/Contents/Resources/app/bin/cursor',
  path.join(os.homedir(), '.cursor', 'bin', 'cursor'),
];

function parseArgs(argv) {
  return {
    repair: argv.includes('--repair'),
    json: argv.includes('--json'),
    help: argv.includes('-h') || argv.includes('--help'),
  };
}

function exists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function run(cmd, args, extraEnv = {}) {
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });
  if (result.error) {
    return { ok: false, code: 1, error: result.error.message };
  }
  return { ok: (result.status ?? 1) === 0, code: result.status ?? 1 };
}

function commandExists(cmd) {
  const check = spawnSync('sh', ['-lc', `command -v ${cmd}`], { cwd: ROOT });
  return check.status === 0;
}

function isExecutable(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function resolveCursorBinary() {
  if (commandExists('cursor')) return 'cursor';
  for (const candidate of CURSOR_BINARY_CANDIDATES) {
    if (isExecutable(candidate)) return candidate;
  }
  return null;
}

function ensureDir(absPath) {
  fs.mkdirSync(absPath, { recursive: true });
}

function copyDirRecursive(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function readJson(relPath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));
  } catch {
    return null;
  }
}

function writeJson(relPath, payload) {
  const absPath = path.join(ROOT, relPath);
  ensureDir(path.dirname(absPath));
  fs.writeFileSync(absPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function upsertAssimilationRoute(cursorBinary) {
  const current = readJson(ASSIMILATION_ROUTES) || { providers: {} };
  current.providers = current.providers || {};
  current.providers.cursor = {
    linkedAt: new Date().toISOString(),
    binary: cursorBinary,
    harnessSkill: path.join(os.homedir(), '.cursor', 'skills-cursor', 'tnf-harness-protocol'),
    mcpConfig: 'data/mcp.clients/cursor.mcp.json',
    onboardScript: 'scripts/cursor/tnf-cursor-harness-onboard.cjs',
  };
  writeJson(ASSIMILATION_ROUTES, current);
}

function provisionHarnessSkill() {
  const source = path.join(ROOT, SKILL_SOURCE);
  if (!fs.existsSync(source)) {
    return { ok: false, reason: 'missing-source-skill', path: SKILL_SOURCE };
  }

  const destination = path.join(
    os.homedir(),
    '.cursor',
    'skills-cursor',
    'tnf-harness-protocol'
  );
  copyDirRecursive(source, destination);
  return { ok: true, path: destination };
}

function printUsage() {
  console.log('Usage: node scripts/cursor/tnf-cursor-harness-onboard.cjs [options]');
  console.log('');
  console.log('Options:');
  console.log('  --repair   Pass --repair to tnf onboard');
  console.log('  --json     Emit machine-readable receipt');
  console.log('  -h, --help Show help');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  if (!exists('.agent')) {
    console.error('Run from TNF repository root (missing .agent/).');
    process.exit(1);
  }

  const receipt = {
    generatedAt: new Date().toISOString(),
    repoRoot: ROOT,
    steps: [],
    checks: {},
  };

  console.log('=== TNF Cursor Harness Onboard ===');

  const cursorBinary = resolveCursorBinary();
  receipt.checks.cursorBinary = cursorBinary;
  if (cursorBinary) {
    console.log(`✓ Cursor CLI: ${cursorBinary}`);
  } else {
    console.log('⚠ Cursor CLI not found on PATH or standard install locations');
    console.log('  Install via Cursor: Command Palette → "Shell Command: Install cursor command in PATH"');
  }

  const onboardArgs = ['scripts/tnf-onboard.cjs', '--runtime-timeout-ms', '1000'];
  if (args.repair) onboardArgs.push('--repair');

  console.log('\n[1/4] Turn Zero frontload');
  const onboard = run('node', onboardArgs);
  receipt.steps.push({ step: 'tnf-onboard', ok: onboard.ok, code: onboard.code });
  if (!onboard.ok) process.exit(onboard.code || 1);

  console.log('\n[2/4] Terminal harness boot');
  const harness = run('pnpm', ['run', '-s', 'tnf:harness:boot']);
  receipt.steps.push({ step: 'harness-boot', ok: harness.ok, code: harness.code });
  if (!harness.ok) {
    console.warn('⚠ Harness boot partial failure; continuing.');
  }

  console.log('\n[3/4] MCP client generation');
  const mcp = run('pnpm', ['run', '-s', 'tnf:mcp:generate']);
  receipt.steps.push({ step: 'mcp-generate', ok: mcp.ok, code: mcp.code });
  if (!mcp.ok) process.exit(mcp.code || 1);

  receipt.checks.cursorMcpConfig = exists('data/mcp.clients/cursor.mcp.json');
  console.log(
    receipt.checks.cursorMcpConfig
      ? '✓ data/mcp.clients/cursor.mcp.json'
      : '✗ Missing data/mcp.clients/cursor.mcp.json'
  );

  console.log('\n[4/4] Cursor harness skill provision');
  const skill = provisionHarnessSkill();
  receipt.steps.push({ step: 'skill-provision', ...skill });
  if (skill.ok) {
    console.log(`✓ Provisioned harness skill: ${skill.path}`);
  } else {
    console.error(`✗ Failed to provision harness skill (${skill.reason})`);
    process.exit(1);
  }

  upsertAssimilationRoute(cursorBinary || 'cursor');
  receipt.checks.assimilationRoutes = exists(ASSIMILATION_ROUTES);

  writeJson(RECEIPT_PATH, receipt);

  if (args.json) {
    console.log(JSON.stringify(receipt, null, 2));
  } else {
    console.log('\n=== Cursor Harness Onboard Complete ===');
    console.log(`Receipt: ${RECEIPT_PATH}`);
    console.log('Next: tnf assimilate run cursor -- agent --help');
  }
}

main();
