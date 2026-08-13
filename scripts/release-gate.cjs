#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const args = new Set(process.argv.slice(2));
const strictMode = args.has('--strict');
const withTypeChecks = strictMode || args.has('--with-type-checks');
const runApiSmoke = args.has('--api-smoke') || process.env.RUN_API_SMOKE === '1';
const commandTimeoutMs = Number(process.env.RELEASE_GATE_TIMEOUT_MS || '900000');

let failed = false;

const section = (title) => {
  console.log(`\n== ${title} ==`);
};

const pass = (msg) => console.log(`PASS: ${msg}`);
const warn = (msg) => console.log(`WARN: ${msg}`);
const fail = (msg) => {
  failed = true;
  console.error(`FAIL: ${msg}`);
};

const run = (cmd, cmdArgs, opts = {}) => {
  const pretty = [cmd, ...cmdArgs].join(' ');
  console.log(`$ ${pretty}`);
  const result = spawnSync(cmd, cmdArgs, {
    cwd: repoRoot,
    stdio: 'inherit',
    env: { ...process.env, ...(opts.env || {}) },
    shell: false,
    timeout: opts.timeoutMs || commandTimeoutMs,
  });
  if (result.error && result.error.code === 'ETIMEDOUT') {
    fail(`Command timed out after ${opts.timeoutMs || commandTimeoutMs}ms: ${pretty}`);
    return false;
  }
  if (result.status !== 0) {
    fail(`Command failed (${result.status}): ${pretty}`);
    return false;
  }
  pass(`Command succeeded: ${pretty}`);
  return true;
};

const ensureFile = (relativePath) => {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    fail(`Missing required file: ${relativePath}`);
    return null;
  }
  pass(`Found required file: ${relativePath}`);
  return fullPath;
};

const readUtf8 = (relativePath) => {
  const fullPath = ensureFile(relativePath);
  if (!fullPath) return '';
  return fs.readFileSync(fullPath, 'utf8');
};

const checkRequiredEnvExamples = () => {
  section('Environment Baseline');
  const envFile = '.env.production.example';
  const raw = readUtf8(envFile);
  if (!raw) return;

  const required = ['NODE_ENV', 'JWT_SECRET', 'DATABASE_URL'];
  for (const key of required) {
    const regex = new RegExp(`^${key}=`, 'm');
    if (!regex.test(raw)) {
      fail(`${envFile} missing ${key}`);
    } else {
      pass(`${envFile} declares ${key}`);
    }
  }
};

const checkCriticalNoMockFallbacks = () => {
  section('Critical UI De-Mock Checks');

  const checks = [
    {
      file: 'apps/frontend/src/pages/WorkspaceChatPage.tsx',
      forbidden: ['fallbackMessages', 'seedMessages', 'setTimeout(() =>', 'mock'],
    },
    {
      file: 'apps/frontend/src/pages/workspace/WorkspaceAnalytics.tsx',
      forbidden: ['setTimeout(() =>', 'mockData', 'sampleData', 'generateMock'],
    },
    {
      file: 'apps/frontend/src/pages/Admin/WorkspaceManagement.tsx',
      forbidden: ['mockWorkspaces', 'sampleWorkspaces', 'fallbackWorkspaces'],
    },
    {
      file: 'apps/frontend/src/pages/workflow-pages/WorkflowBuilderEnhanced.tsx',
      forbidden: ['Workflow Executed (Demo)', 'demo mode', 'mock save'],
    },
  ];

  for (const check of checks) {
    const content = readUtf8(check.file);
    if (!content) continue;

    let localFail = false;
    for (const needle of check.forbidden) {
      if (content.includes(needle)) {
        fail(`${check.file} contains forbidden marker: "${needle}"`);
        localFail = true;
      }
    }

    if (!localFail) {
      pass(`${check.file} has no forbidden fallback markers`);
    }
  }
};

const checkLocalRuntimeBoundary = () => {
  section('Local Runtime + Clean Room Boundary');
  run('node', ['scripts/protocols/validate-local-runtime-boundary.cjs']);
  run('node', ['scripts/protocols/validate-cleanroom-boundary.cjs']);
};

const checkCommandGates = () => {
  section('Build + Type Gates');

  if (!withTypeChecks) {
    warn('Skipping type/build gates in quick mode (use --strict or --with-type-checks)');
    return;
  }

  const commands = [
    {
      cmd: 'pnpm',
      args: ['--filter', '@the-new-fuse/frontend-app', 'run', 'build'],
      opts: {
        env: {
          // Compression is validated in deployment environments; disable for gate determinism.
          VITE_BUILD_COMPRESS: 'false',
        },
      },
    },
    { cmd: 'node', args: ['scripts/check-frontend-bundle-size.cjs'] },
    { cmd: 'pnpm', args: ['--filter', '@the-new-fuse/api-server', 'run', 'type-check'] },
  ];

  if (strictMode) {
    commands.push({ cmd: 'pnpm', args: ['--filter', '@the-new-fuse/api-server', 'run', 'build'] });
  }

  for (const { cmd, args: cmdArgs, opts } of commands) {
    run(cmd, cmdArgs, opts);
  }
};

const checkApiSmoke = () => {
  section('API Smoke Gate');
  run('bash', ['scripts/smoke-api-demock.sh']);
};

const main = () => {
  console.log(`TNF release gate starting (${strictMode ? 'strict' : 'quick'} mode)`);

  checkRequiredEnvExamples();
  checkLocalRuntimeBoundary();
  checkCriticalNoMockFallbacks();
  checkCommandGates();

  if (runApiSmoke) {
    checkApiSmoke();
  } else {
    warn('Skipping API smoke gate (set RUN_API_SMOKE=1 or pass --api-smoke)');
  }

  if (failed) {
    console.error('\nRelease gate status: FAILED');
    process.exit(1);
  }

  console.log('\nRelease gate status: PASSED');
};

main();
