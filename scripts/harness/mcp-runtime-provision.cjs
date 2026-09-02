#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const POLICY_PATH = path.join(REPO_ROOT, 'data/harness/managed-mcp-runtime.json');
const CANONICAL_ROOT = REPO_ROOT;
const LEGACY_ROOT = '/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse';

function parseArgs(argv) {
  const command = argv.find((arg) => !arg.startsWith('-')) || 'status';
  return {
    command,
    apply: argv.includes('--apply'),
    json: argv.includes('--json'),
    home: valueAfter(argv, '--home') || os.homedir(),
    runtimeRoot: valueAfter(argv, '--runtime-root'),
  };
}

function valueAfter(argv, flag) {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : null;
}

function loadPolicy() {
  return JSON.parse(fs.readFileSync(POLICY_PATH, 'utf8'));
}

function expandHome(value, home) {
  return value === '~' ? home : value.startsWith('~/') ? path.join(home, value.slice(2)) : value;
}

function stablePackageInput(policy) {
  return policy.packages.map(({ name, version, bin, wrapper, integrity, secret }) => ({
    name,
    version,
    bin,
    wrapper,
    integrity,
    secret: secret || null,
  }));
}

function releaseId(policy) {
  return crypto.createHash('sha256').update(JSON.stringify(stablePackageInput(policy))).digest('hex').slice(0, 16);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
}

function atomicWrite(file, contents, mode = 0o600) {
  ensureDir(path.dirname(file));
  const temp = `${file}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temp, contents, { mode });
  fs.renameSync(temp, file);
  fs.chmodSync(file, mode);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env || process.env,
    encoding: 'utf8',
    stdio: options.inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
    timeout: options.timeout || 300_000,
  });
  if (result.error || result.status !== 0) {
    const detail = result.error?.message || result.stderr?.trim() || `${command} exited ${result.status}`;
    throw new Error(detail);
  }
  return result.stdout || '';
}

function packageDirectory(nodeModules, packageName) {
  return path.join(nodeModules, ...packageName.split('/'));
}

function validatePolicy(policy) {
  const errors = [];
  const wrappers = new Set();
  for (const pkg of policy.packages || []) {
    if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(pkg.version)) {
      errors.push(`${pkg.name}: version is not an exact semver`);
    }
    if (!String(pkg.integrity || '').startsWith('sha512-')) errors.push(`${pkg.name}: sha512 integrity missing`);
    if (wrappers.has(pkg.wrapper)) errors.push(`${pkg.wrapper}: duplicate wrapper`);
    wrappers.add(pkg.wrapper);
  }
  return errors;
}

function validateRelease(releaseDir, policy) {
  const errors = [];
  let lock = null;
  try {
    lock = JSON.parse(fs.readFileSync(path.join(releaseDir, 'package-lock.json'), 'utf8'));
  } catch (error) {
    return [`package-lock.json unavailable: ${error.message}`];
  }
  for (const pkg of policy.packages) {
    const packageDir = packageDirectory(path.join(releaseDir, 'node_modules'), pkg.name);
    const packageJsonPath = path.join(packageDir, 'package.json');
    const executable = path.join(packageDir, pkg.bin);
    if (!fs.existsSync(packageJsonPath)) {
      errors.push(`${pkg.name}: package.json missing`);
      continue;
    }
    const installed = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (installed.version !== pkg.version) errors.push(`${pkg.name}: expected ${pkg.version}, found ${installed.version}`);
    if (!fs.existsSync(executable)) errors.push(`${pkg.name}: executable ${pkg.bin} missing`);
    const lockKey = `node_modules/${pkg.name}`;
    const locked = lock.packages?.[lockKey];
    if (!locked) errors.push(`${pkg.name}: package-lock entry missing`);
    else {
      if (locked.version !== pkg.version) errors.push(`${pkg.name}: package-lock version drift`);
      if (locked.integrity !== pkg.integrity) errors.push(`${pkg.name}: package-lock integrity drift`);
    }
  }
  return errors;
}

function launcherSource() {
  return `#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const name = path.basename(process.argv[1]).replace(/^tnf-mcp-/, '');
const state = JSON.parse(fs.readFileSync(path.join(root, 'runtime-state.json'), 'utf8'));
const target = state.packages.find((entry) => entry.wrapper === name);
if (!target) { console.error('Unknown TNF managed MCP wrapper: ' + name); process.exit(64); }
const packageDir = path.join(root, 'current', 'node_modules', ...target.name.split('/'));
const executable = path.join(packageDir, target.bin);
const env = { ...process.env };
if (target.secret) {
  if (process.platform !== 'darwin' || target.secret.provider !== 'macos-keychain') {
    console.error('Secret provider unavailable for ' + name); process.exit(78);
  }
  const account = env[target.secret.accountEnv];
  if (!account) { console.error('Keychain account environment is unset for ' + name); process.exit(78); }
  const secret = spawnSync('/usr/bin/security', ['find-generic-password', '-w', '-s', target.secret.service, '-a', account], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  if (secret.status !== 0 || !secret.stdout.trim()) { console.error('Required Keychain item unavailable for ' + name); process.exit(78); }
  env[target.secret.environmentVariable] = secret.stdout.trim();
}
const child = spawn(process.execPath, [executable, ...process.argv.slice(2)], { env, stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, () => child.kill(signal));
child.on('error', (error) => { console.error(error.message); process.exit(70); });
child.on('exit', (code, signal) => { if (signal) process.kill(process.pid, signal); else process.exit(code ?? 1); });
`;
}

function acquireLock(runtimeRoot) {
  ensureDir(runtimeRoot);
  const lockDir = path.join(runtimeRoot, '.provision.lock');
  try {
    fs.mkdirSync(lockDir);
    atomicWrite(path.join(lockDir, 'owner.json'), `${JSON.stringify({ pid: process.pid, at: new Date().toISOString() }, null, 2)}\n`);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    let owner = {};
    try { owner = JSON.parse(fs.readFileSync(path.join(lockDir, 'owner.json'), 'utf8')); } catch {}
    if (owner.pid) {
      try { process.kill(owner.pid, 0); throw new Error(`provision lock held by live pid ${owner.pid}`); } catch (probe) {
        if (!['ESRCH', 'EPERM'].includes(probe.code)) throw probe;
        if (probe.code === 'EPERM') throw new Error(`cannot verify provision lock owner pid ${owner.pid}`);
      }
    }
    const age = Date.now() - fs.statSync(lockDir).mtimeMs;
    if (age < 15 * 60_000) throw new Error('provision lock exists and is not stale');
    fs.rmSync(lockDir, { recursive: true });
    fs.mkdirSync(lockDir);
    atomicWrite(path.join(lockDir, 'owner.json'), `${JSON.stringify({ pid: process.pid, at: new Date().toISOString() }, null, 2)}\n`);
  }
  return () => fs.rmSync(lockDir, { recursive: true, force: true });
}

function installRelease(runtimeRoot, policy) {
  const id = releaseId(policy);
  const releases = path.join(runtimeRoot, 'releases');
  const releaseDir = path.join(releases, id);
  ensureDir(releases);
  if (!fs.existsSync(releaseDir)) {
    const staging = path.join(releases, `.staging-${id}-${process.pid}`);
    fs.rmSync(staging, { recursive: true, force: true });
    ensureDir(staging);
    const dependencies = Object.fromEntries(policy.packages.map((pkg) => [pkg.name, pkg.version]));
    atomicWrite(path.join(staging, 'package.json'), `${JSON.stringify({ private: true, dependencies }, null, 2)}\n`);
    try {
      run('npm', ['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: staging });
      run('npm', ['ci', '--ignore-scripts', '--omit=dev', '--no-audit', '--no-fund'], { cwd: staging });
      const errors = validateRelease(staging, policy);
      if (errors.length) throw new Error(errors.join('; '));
      fs.renameSync(staging, releaseDir);
    } catch (error) {
      fs.rmSync(staging, { recursive: true, force: true });
      throw error;
    }
  }
  const errors = validateRelease(releaseDir, policy);
  if (errors.length) throw new Error(`release validation failed: ${errors.join('; ')}`);
  const currentTemp = path.join(runtimeRoot, `.current-${process.pid}`);
  fs.rmSync(currentTemp, { force: true });
  fs.symlinkSync(path.relative(runtimeRoot, releaseDir), currentTemp);
  fs.renameSync(currentTemp, path.join(runtimeRoot, 'current'));
  return { id, releaseDir };
}

function installWrappers(runtimeRoot, policy, id) {
  const binDir = path.join(runtimeRoot, 'bin');
  ensureDir(binDir);
  const launcher = path.join(binDir, 'tnf-mcp-launcher');
  atomicWrite(launcher, launcherSource(), 0o700);
  for (const pkg of policy.packages) {
    const wrapper = path.join(binDir, `tnf-mcp-${pkg.wrapper}`);
    const temp = `${wrapper}.tmp-${process.pid}`;
    fs.rmSync(temp, { force: true });
    fs.symlinkSync('tnf-mcp-launcher', temp);
    fs.renameSync(temp, wrapper);
  }
  atomicWrite(path.join(runtimeRoot, 'runtime-state.json'), `${JSON.stringify({ schemaVersion: 1, releaseId: id, packages: stablePackageInput(policy) }, null, 2)}\n`);
}

function provision(runtimeRoot, policy, apply) {
  if (!apply) return { changed: false, planned: true, releaseId: releaseId(policy), runtimeRoot };
  const releaseLock = acquireLock(runtimeRoot);
  try {
    const release = installRelease(runtimeRoot, policy);
    installWrappers(runtimeRoot, policy, release.id);
    return { changed: true, releaseId: release.id, runtimeRoot, releaseDir: release.releaseDir };
  } finally {
    releaseLock();
  }
}

function stripTomlServer(text, name) {
  const lines = text.split(/\r?\n/);
  let skipping = false;
  const base = `mcp_servers.${name}`;
  const quoted = `mcp_servers."${name}"`;
  const kept = [];
  for (const line of lines) {
    const header = line.match(/^\s*\[([^\]]+)\]\s*$/)?.[1];
    if (header) skipping = header === base || header.startsWith(`${base}.`) || header === quoted || header.startsWith(`${quoted}.`);
    if (!skipping) kept.push(line);
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();
}

function setTomlServer(text, name, block) {
  return `${stripTomlServer(text, name)}\n\n[mcp_servers."${name}"]\n${block.trim()}\n`;
}

function extractTomlEnv(text, server, key) {
  const lines = text.split(/\r?\n/);
  let inSection = false;
  const desired = new Set([`mcp_servers.${server}.env`, `mcp_servers."${server}".env`]);
  for (const line of lines) {
    const header = line.match(/^\s*\[([^\]]+)\]\s*$/)?.[1];
    if (header) inSection = desired.has(header);
    if (!inSection) continue;
    const match = line.match(new RegExp(`^\\s*${key}\\s*=\\s*"((?:\\\\.|[^"\\\\])*)"\\s*$`));
    if (match) return JSON.parse(`"${match[1]}"`);
  }
  return null;
}

function keychainHas(secret) {
  if (process.platform !== 'darwin') return false;
  const account = process.env[secret.accountEnv];
  if (!account) return false;
  return spawnSync('/usr/bin/security', ['find-generic-password', '-s', secret.service, '-a', account], { stdio: 'ignore' }).status === 0;
}

function keychainPut(secret, value) {
  if (process.platform !== 'darwin') throw new Error('macOS Keychain is required for this host migration');
  const account = process.env[secret.accountEnv];
  if (!account) throw new Error(`${secret.accountEnv} is unset; cannot select Keychain account`);
  const result = spawnSync('/usr/bin/security', ['add-generic-password', '-U', '-s', secret.service, '-a', account, '-w', value], { stdio: 'ignore' });
  if (result.status !== 0) throw new Error(`failed to write Keychain service ${secret.service}`);
}

function backupFiles(home, files) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const root = path.join(home, '.tnf/backups/mcp-runtime', stamp);
  const backedUp = [];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const relative = path.relative(home, file);
    const destination = path.join(root, relative);
    ensureDir(path.dirname(destination));
    fs.copyFileSync(file, destination, fs.constants.COPYFILE_EXCL);
    fs.chmodSync(destination, 0o600);
    backedUp.push({ file, destination, sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') });
  }
  return { root, files: backedUp };
}

function migrateSharedJson(config, runtimeRoot) {
  const next = structuredClone(config);
  const changes = [];
  const servers = next.mcpServers || {};
  if (servers['kilo-media-mcp']) {
    delete servers['kilo-media-mcp'];
    changes.push('retired kilo-media-mcp');
  }
  if (servers.jules && !fs.existsSync(path.join(CANONICAL_ROOT, 'packages/jules-skill/src/mcp-server.ts'))) {
    delete servers.jules;
    changes.push('retired missing Jules MCP entrypoint');
  }
  const managedTnf = new Map([
    ['tnf-complete-api-wrapper', 'src/mcp/complete-api-mcp-server.ts'],
    ['tnf-enhanced-mcp-server', 'src/mcp/enhanced-tnf-mcp-server.ts'],
    ['tnf-core-server', 'src/mcp/server.ts'],
    ['tnf-network', 'apps/mcp-servers/tnf-network-mcp/src/index.ts'],
    ['devops-bridge', 'apps/mcp-servers/devops-bridge/src/index.ts'],
  ]);
  for (const [name, entry] of managedTnf) {
    if (!servers[name]) continue;
    servers[name].command = path.join(CANONICAL_ROOT, 'node_modules/.bin/tsx');
    servers[name].args = [path.join(CANONICAL_ROOT, entry)];
    changes.push(`canonicalized ${name}`);
  }
  if (servers.filesystem?.command === 'npx') {
    servers.filesystem.command = path.join(runtimeRoot, 'bin/tnf-mcp-filesystem');
    servers.filesystem.args = (servers.filesystem.args || []).filter((arg) => arg !== '-y' && !String(arg).startsWith('@modelcontextprotocol/server-filesystem'));
    changes.push('managed filesystem runtime');
  }
  return { config: next, changes };
}

function migrateAgy(apply) {
  const probe = spawnSync('agy', ['mcp', 'list'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (probe.error?.code === 'ENOENT') return { available: false, changed: false, changes: [] };
  if (probe.status !== 0) throw new Error(`AGY MCP inventory failed: ${probe.stderr?.trim() || `exit ${probe.status}`}`);
  const desired = new Map([
    ['tnf-complete-api-wrapper', 'src/mcp/complete-api-mcp-server.ts'],
    ['tnf-enhanced-mcp-server', 'src/mcp/enhanced-tnf-mcp-server.ts'],
    ['tnf-core-server', 'src/mcp/server.ts'],
    ['tnf-network', 'apps/mcp-servers/tnf-network-mcp/src/index.ts'],
    ['devops-bridge', 'apps/mcp-servers/devops-bridge/src/index.ts'],
  ]);
  const changes = ['retire AGY jules', 'retire AGY kilo-media-mcp', ...Array.from(desired.keys(), (name) => `canonicalize AGY ${name}`)];
  if (!apply) return { available: true, changed: false, planned: true, changes };
  for (const name of ['jules', 'kilo-media-mcp']) {
    if (!new RegExp(`^${name}\\s`, 'm').test(probe.stdout)) continue;
    run('agy', ['mcp', 'remove', name]);
  }
  const command = path.join(CANONICAL_ROOT, 'node_modules/.bin/tsx');
  for (const [name, entry] of desired) {
    run('agy', ['mcp', 'add', name, command, path.join(CANONICAL_ROOT, entry)]);
  }
  const after = run('agy', ['mcp', 'list']);
  const errors = [];
  if (/\bnpx\b|@latest|kilo-media-mcp|^jules\s/m.test(after)) errors.push('retired or runtime-installer AGY entry remains');
  for (const [name, entry] of desired) {
    if (!after.includes(name) || !after.includes(path.join(CANONICAL_ROOT, entry))) errors.push(`${name}: AGY canonical entry missing`);
  }
  if (errors.length) throw new Error(`AGY migration verification failed: ${errors.join('; ')}`);
  return { available: true, changed: true, changes, before: probe.stdout.trim(), after: after.trim() };
}

function migrateHosts(home, runtimeRoot, policy, apply) {
  const codex = path.join(home, '.codex/config.toml');
  const codexJson = path.join(home, '.codex/mcp_config.json');
  const cursor = path.join(home, '.cursor/mcp.json');
  const cursorDisabled = path.join(home, '.cursor/projects/Users-danielgoldberg/mcp-disabled.json');
  const claude = path.join(home, 'Library/Application Support/Claude/claude_desktop_config.json');
  const files = [codex, codexJson, cursor, cursorDisabled, claude];
  const changes = [];
  if (!apply) return { changed: false, planned: true, files: files.filter(fs.existsSync) };
  const backup = backupFiles(home, files);
  if (fs.existsSync(codex)) {
    const original = fs.readFileSync(codex, 'utf8');
    const exa = policy.packages.find((pkg) => pkg.wrapper === 'exa');
    const inlineSecret = extractTomlEnv(original, 'exa', exa.secret.environmentVariable);
    if (inlineSecret) keychainPut(exa.secret, inlineSecret);
    else if (!keychainHas(exa.secret)) throw new Error('Exa secret is absent from both Codex config and macOS Keychain');
    let next = original.split(LEGACY_ROOT).join(CANONICAL_ROOT);
    next = setTomlServer(next, 'apple-notes', `command = "${path.join(runtimeRoot, 'bin/tnf-mcp-apple-notes')}"\nstartup_timeout_sec = 30`);
    next = setTomlServer(next, 'exa', `command = "${path.join(runtimeRoot, 'bin/tnf-mcp-exa')}"\nstartup_timeout_sec = 30`);
    next = setTomlServer(next, 'browser', `command = "${path.join(runtimeRoot, 'bin/tnf-mcp-browser')}"\nstartup_timeout_sec = 60`);
    atomicWrite(codex, next);
    changes.push('migrated Codex managed servers and canonical TNF paths');
  }
  for (const file of [codexJson, cursor, claude]) {
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, 'utf8').split(LEGACY_ROOT).join(CANONICAL_ROOT);
    const migrated = migrateSharedJson(JSON.parse(raw), runtimeRoot);
    atomicWrite(file, `${JSON.stringify(migrated.config, null, 2)}\n`);
    changes.push(...migrated.changes.map((change) => `${path.relative(home, file)}: ${change}`));
  }
  if (fs.existsSync(cursorDisabled)) {
    const disabled = JSON.parse(fs.readFileSync(cursorDisabled, 'utf8'));
    if (Array.isArray(disabled) && disabled.includes('kilo-media-mcp')) {
      atomicWrite(cursorDisabled, `${JSON.stringify(disabled.filter((name) => name !== 'kilo-media-mcp'), null, 2)}\n`);
      changes.push('removed retired kilo-media-mcp from Cursor disabled registry');
    }
  }
  const agy = migrateAgy(true);
  changes.push(...agy.changes);
  const receipt = { schemaVersion: 1, at: new Date().toISOString(), backup, changes, agy, secrets: [{ service: 'tnf.mcp.exa', contentRecorded: false }] };
  const receiptPath = path.join(runtimeRoot, 'receipts', `host-migration-${Date.now()}.json`);
  atomicWrite(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return { changed: changes.length > 0, backup: backup.root, receipt: receiptPath, changes };
}

function hostConfigFindings(home, runtimeRoot) {
  const findings = [];
  const jsonFiles = [
    path.join(home, '.codex/mcp_config.json'),
    path.join(home, '.cursor/mcp.json'),
    path.join(home, 'Library/Application Support/Claude/claude_desktop_config.json'),
  ];
  const inspectServers = (file, servers) => {
    for (const [name, server] of Object.entries(servers || {})) {
      const command = String(server.command || '');
      const args = (server.args || []).map(String);
      if (['npx', 'bunx'].includes(command) || (command === 'pnpm' && args[0] === 'dlx')) findings.push(`${file}:${name}: runtime package-manager command ${command}`);
      if (args.some((arg) => /@(?:latest|next|canary)(?:$|\s)/.test(arg))) findings.push(`${file}:${name}: mutable version tag`);
      if (name === 'kilo-media-mcp') findings.push(`${file}:${name}: retired server remains configured`);
      if (name === 'jules' && !fs.existsSync(path.join(CANONICAL_ROOT, 'packages/jules-skill/src/mcp-server.ts'))) findings.push(`${file}:${name}: missing Jules entrypoint remains configured`);
    }
  };
  for (const file of jsonFiles) {
    if (!fs.existsSync(file)) continue;
    try { inspectServers(file, JSON.parse(fs.readFileSync(file, 'utf8')).mcpServers); }
    catch (error) { findings.push(`${file}: invalid JSON (${error.message})`); }
  }
  const codex = path.join(home, '.codex/config.toml');
  if (fs.existsSync(codex)) {
    const text = fs.readFileSync(codex, 'utf8');
    if (/^\s*command\s*=\s*"(?:npx|bunx)"/m.test(text) || /^\s*args\s*=\s*\[\s*"dlx"/m.test(text)) findings.push(`${codex}: runtime package-manager command remains`);
    if (/@(?:latest|next|canary)"/.test(text)) findings.push(`${codex}: mutable version tag remains`);
    if (/EXA_API_KEY\s*=/.test(text)) findings.push(`${codex}: inline EXA_API_KEY remains`);
    for (const wrapper of ['apple-notes', 'exa', 'browser']) {
      const expected = path.join(runtimeRoot, `bin/tnf-mcp-${wrapper}`);
      if (!text.includes(`command = "${expected}"`)) findings.push(`${codex}:${wrapper}: managed wrapper not configured`);
    }
  }
  const agy = spawnSync('agy', ['mcp', 'list'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 15_000 });
  if (!agy.error && agy.status === 0) {
    if (/\bnpx\b|@latest|kilo-media-mcp|^jules\s/m.test(agy.stdout)) findings.push('AGY MCP registry: retired or runtime package-manager entry remains');
    for (const [name, entry] of new Map([
      ['tnf-complete-api-wrapper', 'src/mcp/complete-api-mcp-server.ts'],
      ['tnf-enhanced-mcp-server', 'src/mcp/enhanced-tnf-mcp-server.ts'],
      ['tnf-core-server', 'src/mcp/server.ts'],
      ['tnf-network', 'apps/mcp-servers/tnf-network-mcp/src/index.ts'],
      ['devops-bridge', 'apps/mcp-servers/devops-bridge/src/index.ts'],
    ])) {
      if (!agy.stdout.includes(name) || !agy.stdout.includes(path.join(CANONICAL_ROOT, entry))) findings.push(`AGY MCP registry:${name}: canonical entry missing`);
    }
  } else if (!agy.error || agy.error.code !== 'ENOENT') {
    findings.push(`AGY MCP registry inventory failed: ${agy.error?.message || agy.stderr?.trim() || `exit ${agy.status}`}`);
  }
  return findings;
}

function verify(runtimeRoot, policy, home) {
  const errors = [...validatePolicy(policy)];
  const id = releaseId(policy);
  const releaseDir = path.join(runtimeRoot, 'releases', id);
  if (!fs.existsSync(releaseDir)) errors.push(`release ${id} missing`);
  else errors.push(...validateRelease(releaseDir, policy));
  const current = path.join(runtimeRoot, 'current');
  if (!fs.existsSync(current)) errors.push('current release symlink missing');
  else if (fs.realpathSync(current) !== fs.realpathSync(releaseDir)) errors.push('current release does not match policy');
  for (const pkg of policy.packages) {
    const wrapper = path.join(runtimeRoot, 'bin', `tnf-mcp-${pkg.wrapper}`);
    if (!fs.existsSync(wrapper)) errors.push(`${pkg.wrapper}: wrapper missing`);
  }
  errors.push(...hostConfigFindings(home, runtimeRoot));
  return { ok: errors.length === 0, releaseId: id, runtimeRoot, errors };
}

function printResult(result, json) {
  if (json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`TNF managed MCP runtime: ${result.ok === false ? 'FAIL' : 'OK'}`);
    for (const [key, value] of Object.entries(result)) {
      if (['ok', 'changes', 'errors'].includes(key)) continue;
      if (typeof value !== 'object') console.log(`${key}: ${value}`);
    }
    for (const change of result.changes || []) console.log(`CHANGE: ${change}`);
    for (const error of result.errors || []) console.log(`FAIL: ${error}`);
  }
}

function main(argv = process.argv.slice(2)) {
  const opts = parseArgs(argv);
  const policy = loadPolicy();
  const runtimeRoot = opts.runtimeRoot || expandHome(policy.runtimeRoot, opts.home);
  let result;
  if (opts.command === 'provision') result = { ok: true, ...provision(runtimeRoot, policy, opts.apply) };
  else if (opts.command === 'migrate-hosts') result = { ok: true, ...migrateHosts(opts.home, runtimeRoot, policy, opts.apply) };
  else if (opts.command === 'verify' || opts.command === 'status') result = verify(runtimeRoot, policy, opts.home);
  else throw new Error('usage: mcp-runtime-provision.cjs <status|provision|migrate-hosts|verify> [--apply] [--json] [--home PATH] [--runtime-root PATH]');
  printResult(result, opts.json);
  return result.ok === false ? 1 : 0;
}

if (require.main === module) {
  try { process.exitCode = main(); }
  catch (error) { console.error(`mcp-runtime-provision: ${error.message}`); process.exitCode = 1; }
}

module.exports = {
  extractTomlEnv,
  hostConfigFindings,
  loadPolicy,
  migrateSharedJson,
  migrateAgy,
  releaseId,
  setTomlServer,
  stripTomlServer,
  validatePolicy,
};
