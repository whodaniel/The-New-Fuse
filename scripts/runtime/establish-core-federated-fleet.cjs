#!/usr/bin/env node
/**
 * Establish the core federated fleet for a local OSS TNF install.
 *
 * Default post-install / post-onboard / `tnf fleet establish` behavior:
 *   1. Endow this machine's TNF CLI identity as Local Sub-Director
 *   2. Sync Subdirector + master-heartbeat runtimes under ~/.tnf
 *   3. Ensure Redis (+ optional local relay)
 *   4. Reclaim com.tnf.local-subdirector / com.tnf.master-heartbeat for the
 *      real daemons; relocate any hijacked probe/reconcile jobs to new labels
 *   5. Install terminal heartbeat + director harness crons
 *   6. Install Subdirector worker pair (codegen + infra) crons
 *   7. Seed local MCP config when missing
 *   8. Register core agents in Redis (no cloud Super Director binding)
 *
 * Opt out: TNF_SKIP_CORE_FLEET=1
 * Dry run: --dry-run
 * Force rewrite of agent identity: --force-identity
 */

'use strict';

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawnSync, execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '../..');
const HOME = os.homedir();
const TNF_HOME = path.join(HOME, '.tnf');
const LAUNCH_AGENTS = path.join(HOME, 'Library', 'LaunchAgents');
const UID = typeof process.getuid === 'function' ? process.getuid() : 501;
const LAUNCH_DOMAIN = `gui/${UID}`;

const DEFAULT_IDENTITY = {
  name: 'tnf-local-subdirector',
  role: 'director',
  dacc_role: 'director',
  director_tier: 'sub',
  platform: 'tnf',
  embodiment: 'sub-director',
  corporate_title: 'Local Sub-Director',
  nft_id: process.env.LOCAL_SUBDIRECTOR_NFT_ID || 'unregistered',
  wallet_address:
    process.env.LOCAL_SUBDIRECTOR_WALLET_ADDRESS ||
    '0x0000000000000000000000000000000000000000',
  notes:
    'Default Local Sub-Director endowment written by establish-core-federated-fleet. Cloud Super Director binding is optional and credential-gated.',
};

/** launchd StartInterval for com.tnf.local-subdirector, in seconds. */
const LOCAL_SUBDIRECTOR_INTERVAL_SEC = 300;

const WORKERS = [
  {
    scheduleId: 'tnf-subdirector-codegen-worker',
    cadence: '*/5 * * * *',
    scriptRel: 'scripts/agents/subdirector-codegen-worker-cycle.sh',
    registryId: 'agent_hermes-codegen-worker_1782364000001',
    name: 'hermes-codegen-worker',
  },
  {
    scheduleId: 'tnf-subdirector-infra-worker',
    cadence: '*/15 * * * *',
    scriptRel: 'scripts/agents/subdirector-infra-worker-cycle.sh',
    registryId: 'agent_hermes-infra-worker_1782364000002',
    name: 'hermes-infra-worker',
  },
];

const args = new Set(process.argv.slice(2));
const DRY = args.has('--dry-run') || args.has('--dry');
const FORCE_IDENTITY = args.has('--force-identity');
const SKIP =
  process.env.TNF_SKIP_CORE_FLEET === '1' ||
  process.env.TNF_SKIP_CORE_FLEET === 'true' ||
  args.has('--skip');

const receipt = {
  ok: false,
  generatedAt: new Date().toISOString(),
  dryRun: DRY,
  root: ROOT,
  steps: [],
  warnings: [],
  errors: [],
};

function log(msg) {
  console.log(`[core-fleet] ${msg}`);
}

function record(step, status, detail) {
  receipt.steps.push({ step, status, detail: detail || null, at: new Date().toISOString() });
  const icon = status === 'ok' ? '✓' : status === 'skip' ? '·' : status === 'warn' ? '!' : '✗';
  log(`${icon} ${step}${detail ? `: ${detail}` : ''}`);
}

function run(cmd, cmdArgs, opts = {}) {
  if (DRY) {
    record(opts.step || cmd, 'skip', `dry-run: ${cmd} ${(cmdArgs || []).join(' ')}`);
    return { status: 0, stdout: '', stderr: '' };
  }
  const result = spawnSync(cmd, cmdArgs || [], {
    cwd: opts.cwd || ROOT,
    encoding: 'utf8',
    env: { ...process.env, ...(opts.env || {}) },
    stdio: opts.stdio || ['ignore', 'pipe', 'pipe'],
    timeout: opts.timeoutMs || 120000,
  });
  if (result.status !== 0 && !opts.allowFail) {
    const err = (result.stderr || result.stdout || '').trim().slice(0, 400);
    throw new Error(`${cmd} ${(cmdArgs || []).join(' ')} failed (${result.status}): ${err}`);
  }
  return result;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  if (DRY) {
    record('copy', 'skip', `${src} -> ${dest}`);
    return;
  }
  fs.copyFileSync(src, dest);
  try {
    fs.chmodSync(dest, 0o755);
  } catch {
    /* ignore */
  }
}

function syncServiceHome(serviceName, scriptRel) {
  const serviceHome = path.join(TNF_HOME, serviceName);
  const binDir = path.join(serviceHome, 'bin');
  const libDir = path.join(serviceHome, 'lib');
  const srcScript = path.join(ROOT, scriptRel);
  const srcLib = path.join(ROOT, 'scripts', 'lib');
  ensureDir(binDir);
  ensureDir(libDir);
  ensureDir(path.join(serviceHome, 'logs'));
  ensureDir(path.join(serviceHome, 'state'));
  if (!fs.existsSync(srcScript)) {
    throw new Error(`missing runtime script: ${srcScript}`);
  }
  copyFile(srcScript, path.join(binDir, path.basename(srcScript)));
  copyFile(srcScript, path.join(TNF_HOME, 'bin', path.basename(srcScript)));
  if (fs.existsSync(srcLib)) {
    for (const name of fs.readdirSync(srcLib)) {
      if (!/\.(cjs|js|sh)$/.test(name)) continue;
      copyFile(path.join(srcLib, name), path.join(libDir, name));
      copyFile(path.join(srcLib, name), path.join(TNF_HOME, 'lib', name));
    }
  }
  record(`sync:${serviceName}`, 'ok', serviceHome);
}

function writeIdentity() {
  const identityPath = path.join(TNF_HOME, 'agent.yaml');
  ensureDir(TNF_HOME);
  // Always ensure crypto/NFT identity exists, even when agent.yaml already set.
  const localIds = ensureLocalSubdirectorCryptoIdentity();
  if (fs.existsSync(identityPath) && !FORCE_IDENTITY) {
    const existing = fs.readFileSync(identityPath, 'utf8');
    if (/director_tier:\s*sub|embodiment:\s*sub-director|name:\s*tnf-local-subdirector/.test(existing)) {
      // Keep nft fields current without rewriting other operator notes.
      if (!DRY && !/nft_id:\s*local-oss-/.test(existing) && localIds.nftId.startsWith('local-oss-')) {
        let updated = existing;
        if (/^nft_id:/m.test(updated)) {
          updated = updated.replace(/^nft_id:.*$/m, `nft_id: ${localIds.nftId}`);
        } else {
          updated += `\nnft_id: ${localIds.nftId}\n`;
        }
        if (/^wallet_address:/m.test(updated)) {
          updated = updated.replace(
            /^wallet_address:.*$/m,
            `wallet_address: "${localIds.walletAddress}"`
          );
        }
        fs.writeFileSync(identityPath, updated.endsWith('\n') ? updated : `${updated}\n`, {
          mode: 0o600,
        });
      }
      record('identity', 'ok', `already Local Sub-Director (${identityPath})`);
      return identityPath;
    }
    receipt.warnings.push(
      'agent.yaml exists without sub-director markers; leaving untouched (pass --force-identity)'
    );
    record('identity', 'warn', 'existing agent.yaml not overwritten');
    return identityPath;
  }
  const yaml = [
    `# Written by establish-core-federated-fleet at ${receipt.generatedAt}`,
    `name: ${DEFAULT_IDENTITY.name}`,
    `role: ${DEFAULT_IDENTITY.role}`,
    `dacc_role: ${DEFAULT_IDENTITY.dacc_role}`,
    `director_tier: ${DEFAULT_IDENTITY.director_tier}`,
    `platform: ${DEFAULT_IDENTITY.platform}`,
    `embodiment: ${DEFAULT_IDENTITY.embodiment}`,
    `corporate_title: "${DEFAULT_IDENTITY.corporate_title}"`,
    `nft_id: ${localIds.nftId}`,
    `wallet_address: "${localIds.walletAddress}"`,
    `notes: "${DEFAULT_IDENTITY.notes}"`,
    '',
  ].join('\n');
  if (!DRY) fs.writeFileSync(identityPath, yaml, { mode: 0o600 });
  record('identity', 'ok', identityPath);
  return identityPath;
}

/**
 * Provision machine-local Subdirector crypto identity for OSS installs.
 * Does not mint a chain NFT; produces a stable local NFT id + Ed25519 keys so
 * cloud Super Director sync can activate once a cloud Redis URL is configured.
 */
function ensureLocalSubdirectorCryptoIdentity() {
  const crypto = require('node:crypto');
  const identityModPath = path.join(ROOT, 'scripts/lib/tnf-identity.cjs');
  const serviceHome = path.join(TNF_HOME, 'local-subdirector');
  const identityEnvPath = path.join(serviceHome, 'identity.env');
  ensureDir(serviceHome);

  if (fs.existsSync(identityEnvPath) && !FORCE_IDENTITY) {
    const envText = fs.readFileSync(identityEnvPath, 'utf8');
    const pick = (key, fallback) => {
      const m = envText.match(new RegExp(`^${key}=(.*)$`, 'm'));
      return m ? m[1].trim() : fallback;
    };
    const nftId = pick('LOCAL_SUBDIRECTOR_NFT_ID', 'unregistered');
    const walletAddress = pick(
      'LOCAL_SUBDIRECTOR_WALLET_ADDRESS',
      '0x0000000000000000000000000000000000000000'
    );
    if (nftId !== 'unregistered') {
      record('nft-identity', 'ok', `existing ${nftId}`);
      return { nftId, walletAddress };
    }
  }

  const machineSeed = [
    os.hostname(),
    os.userInfo().username,
    process.env.TNF_MACHINE_ID || '',
    fs.existsSync('/etc/machine-id') ? fs.readFileSync('/etc/machine-id', 'utf8').trim() : '',
  ].join('|');
  const digest = crypto.createHash('sha256').update(machineSeed).digest('hex');
  const nftId = process.env.LOCAL_SUBDIRECTOR_NFT_ID || `local-oss-${digest.slice(0, 16)}`;
  const walletAddress =
    process.env.LOCAL_SUBDIRECTOR_WALLET_ADDRESS || `0x${digest.slice(0, 40)}`;

  let signingPem = process.env.LOCAL_SUBDIRECTOR_SIGNING_KEY_PEM || '';
  if (!signingPem && fs.existsSync(identityModPath)) {
    const identity = require(identityModPath);
    const keyInfo = identity.ensureAgentKeypair(DEFAULT_IDENTITY.name);
    signingPem = fs.readFileSync(keyInfo.privateKeyPath, 'utf8').trim();
    try {
      identity.setAgentRole(DEFAULT_IDENTITY.name, 'sub-director', {
        note: 'core-federated-fleet-establish',
      });
    } catch (err) {
      receipt.warnings.push(`role registry: ${err.message}`);
    }
  }

  // Optional X25519 encryption key for future cloud bridge payloads.
  let encryptionPem = process.env.LOCAL_SUBDIRECTOR_ENCRYPTION_KEY_PEM || '';
  if (!encryptionPem) {
    const { privateKey } = crypto.generateKeyPairSync('x25519');
    encryptionPem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString().trim();
  }

  const envBody = [
    `# Local Sub-Director OSS identity — generated ${receipt.generatedAt}`,
    `LOCAL_SUBDIRECTOR_ACTOR_ID=${DEFAULT_IDENTITY.name}`,
    `LOCAL_SUBDIRECTOR_NFT_ID=${nftId}`,
    `LOCAL_SUBDIRECTOR_WALLET_ADDRESS=${walletAddress}`,
    `LOCAL_SUBDIRECTOR_SIGNING_KEY_PEM=${signingPem.replace(/\n/g, '\\n')}`,
    `LOCAL_SUBDIRECTOR_ENCRYPTION_KEY_PEM=${encryptionPem.replace(/\n/g, '\\n')}`,
    '',
  ].join('\n');

  if (!DRY) {
    fs.writeFileSync(identityEnvPath, envBody, { mode: 0o600 });
    // Materialize PEM files for LaunchAgent consumption (no multiline env).
    fs.writeFileSync(path.join(serviceHome, 'signing.pkcs8.pem'), `${signingPem}\n`, {
      mode: 0o600,
    });
    fs.writeFileSync(path.join(serviceHome, 'encryption.pkcs8.pem'), `${encryptionPem}\n`, {
      mode: 0o600,
    });
  }
  record('nft-identity', 'ok', nftId);
  return { nftId, walletAddress };
}

function plistPointsTo(plistPath, needle) {
  try {
    const text = fs.readFileSync(plistPath, 'utf8');
    return text.includes(needle);
  } catch {
    return false;
  }
}

function relocateHijackedLabel(label, expectedNeedle, relocatedLabel, relocatedInterval) {
  const src = path.join(LAUNCH_AGENTS, `${label}.plist`);
  if (!fs.existsSync(src)) {
    record(`relocate:${label}`, 'skip', 'plist missing');
    return;
  }
  if (plistPointsTo(src, expectedNeedle)) {
    record(`relocate:${label}`, 'ok', 'already points at real runtime');
    return;
  }
  const dest = path.join(LAUNCH_AGENTS, `${relocatedLabel}.plist`);
  const raw = fs.readFileSync(src, 'utf8');
  let relocated = raw.replace(new RegExp(`<string>${label}</string>`, 'g'), `<string>${relocatedLabel}</string>`);
  relocated = relocated.replace(/<key>KeepAlive<\/key>\s*<true\/>\s*/g, '');
  // Deduplicate / ensure a single StartInterval for interval jobs.
  relocated = relocated.replace(/<key>StartInterval<\/key>\s*<integer>\d+<\/integer>\s*/g, '');
  relocated = relocated.replace(
    /<\/dict>\s*<\/plist>/,
    `  <key>StartInterval</key>\n    <integer>${relocatedInterval}</integer>\n</dict>\n</plist>`
  );
  // If relocation captured a dangling ProgramArguments path, retarget known
  // replacements (observed: old com.tnf.local-subdirector pointed at a deleted
  // scripts/cron/tnf-agent-fleet-health-probe.cjs).
  const danglingHealthProbe = 'scripts/cron/tnf-agent-fleet-health-probe.cjs';
  if (relocated.includes(danglingHealthProbe)) {
    const replacement = path.join(ROOT, 'scripts/agents/tnf-fleet-health-probe-cycle.sh');
    if (fs.existsSync(replacement)) {
      relocated = relocated.replace(
        /<key>ProgramArguments<\/key>\s*<array>[\s\S]*?<\/array>/,
        `<key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${replacement}</string>
    </array>`
      );
    }
  }
  // Ensure PATH includes common node homes for child `node` invocations.
  if (!relocated.includes('.hermes/node/bin')) {
    relocated = relocated.replace(
      /<key>PATH<\/key>\s*<string>[^<]*<\/string>/,
      `<key>PATH</key>
        <string>${path.dirname(process.execPath)}:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>`
    );
  }
  if (!DRY) {
    fs.writeFileSync(dest, relocated);
    try {
      execFileSync('launchctl', ['bootout', `${LAUNCH_DOMAIN}/${label}`], { stdio: 'ignore' });
    } catch {
      /* ignore */
    }
    try {
      execFileSync('launchctl', ['bootout', `${LAUNCH_DOMAIN}/${relocatedLabel}`], {
        stdio: 'ignore',
      });
    } catch {
      /* ignore */
    }
    try {
      execFileSync('launchctl', ['bootstrap', LAUNCH_DOMAIN, dest], { stdio: 'ignore' });
    } catch {
      try {
        execFileSync('launchctl', ['load', '-w', dest], { stdio: 'ignore' });
      } catch {
        /* ignore */
      }
    }
  }
  record(`relocate:${label}`, 'ok', `-> ${relocatedLabel}`);
}

function ensureRedis() {
  const script = path.join(ROOT, 'scripts/runtime/redis-local-bootstrap.sh');
  if (!fs.existsSync(script)) {
    record('redis', 'warn', 'bootstrap script missing');
    return;
  }
  try {
    const redisAction = process.platform === 'darwin' ? 'launchd-start' : 'start';
    run('bash', [script, redisAction], { step: 'redis', allowFail: true });
    const ping = spawnSync('redis-cli', ['ping'], { encoding: 'utf8' });
    if ((ping.stdout || '').trim() === 'PONG') {
      record('redis', 'ok', 'PONG');
    } else {
      record('redis', 'warn', 'not reachable after start');
      receipt.warnings.push('Redis not reachable; fleet registration skipped later');
    }
  } catch (err) {
    record('redis', 'warn', err.message);
    receipt.warnings.push(err.message);
  }
}

function ensureRelayBestEffort() {
  // Local OSS stack: prefer an already-running local relay; do not fail establish
  // if relay packages are incomplete. Cloud Super Director binding is intentionally
  // not attempted here.
  try {
    const probe = spawnSync('bash', ['-lc', 'curl -sf --max-time 1 http://127.0.0.1:3000/health || curl -sf --max-time 1 http://127.0.0.1:3000/ || true'], {
      encoding: 'utf8',
    });
    if ((probe.stdout || '').trim()) {
      record('relay', 'ok', 'local relay already healthy');
      return;
    }
  } catch {
    /* continue */
  }

  if (process.env.TNF_CORE_FLEET_SKIP_RELAY === '1') {
    record('relay', 'skip', 'TNF_CORE_FLEET_SKIP_RELAY=1');
    return;
  }

  const factoryBoot = path.join(ROOT, 'scripts/orchestrator/factory-boot.sh');
  if (!fs.existsSync(factoryBoot)) {
    record('relay', 'warn', 'factory-boot.sh missing');
    return;
  }
  try {
    run(
      'bash',
      [factoryBoot],
      {
        step: 'relay',
        allowFail: true,
        env: {
          FACTORY_BOOT_SKIP_API: '1',
          FACTORY_BOOT_LIGHT: '1',
        },
        timeoutMs: 90000,
      }
    );
    record('relay', 'ok', 'factory-boot invoked (best-effort)');
  } catch (err) {
    record('relay', 'warn', err.message);
    receipt.warnings.push(`relay: ${err.message}`);
  }
}

function installServices() {
  const pairs = [
    ['scripts/runtime/local-subdirector-service.sh', 'install'],
    ['scripts/runtime/tnf-master-heartbeat-service.sh', 'install'],
    ['scripts/runtime/harness-boot.sh', null],
  ];
  for (const [rel, action] of pairs) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      record(rel, 'warn', 'missing');
      continue;
    }
    try {
      if (action) run('bash', [abs, action], { step: path.basename(rel), allowFail: false });
      else run('bash', [abs], { step: path.basename(rel), allowFail: true });
      record(path.basename(rel), 'ok', action || 'boot');
    } catch (err) {
      record(path.basename(rel), 'warn', err.message);
      receipt.warnings.push(err.message);
    }
  }
}

/**
 * Materialise the Sub-Director Lane 2 runtime from the repo.
 *
 * Must run BEFORE installWorkerCrons(): the crons this installs invoke
 * run_one_envelope.py and model_resolver.py out of ~/.tnf/sub-director/, and
 * until 2026-08-12 those files were hand-placed and untracked — no history, no
 * review, no rollback, invisible to repo search. See
 * docs/protocols/TNF_PROVIDER_RESOLUTION_COHERENCE.md for what that cost.
 *
 * Best-effort by design: a sync failure must not abort fleet establishment,
 * because a stale-but-working runtime beats no fleet at all. It is recorded as
 * a warning so the receipt shows it rather than hiding it.
 */
function syncSubDirectorRuntime() {
  const script = path.join(ROOT, 'scripts', 'sub-director', 'sync-runtime.sh');
  if (!fs.existsSync(script)) {
    record('sync:sub-director-runtime', 'skip', 'sync-runtime.sh not present');
    return;
  }
  try {
    const out = execFileSync('bash', [script], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const changed = out
      .split('\n')
      .filter((l) => /\b(installed|updated|seeded)\b/.test(l))
      .map((l) => l.trim().split(/\s{2,}/)[1] || l.trim());
    record(
      'sync:sub-director-runtime',
      'ok',
      changed.length ? `applied: ${changed.join(', ')}` : 'already in sync'
    );
  } catch (err) {
    record('sync:sub-director-runtime', 'warn', err.message || String(err));
  }
}

function installWorkerCrons() {
  let crontab = '';
  try {
    crontab = execFileSync('crontab', ['-l'], { encoding: 'utf8' });
  } catch {
    crontab = '';
  }
  const lines = crontab.split('\n');
  const kept = lines.filter(
    (line) =>
      line.trim() &&
      !WORKERS.some((w) => line.includes(`# tnf-chronological:${w.scheduleId}`) || line.includes(w.scriptRel))
  );
  const nodeBin = process.execPath;
  for (const worker of WORKERS) {
    const logDir = path.join(TNF_HOME, 'poll-jobs', worker.scheduleId);
    ensureDir(logDir);
    const scriptAbs = path.join(ROOT, worker.scriptRel);
    if (!fs.existsSync(scriptAbs)) {
      record(`worker:${worker.scheduleId}`, 'warn', 'script missing');
      continue;
    }
    try {
      fs.chmodSync(scriptAbs, 0o755);
    } catch {
      /* ignore */
    }
    const entry = `${worker.cadence} cd "${ROOT}" && PATH="${path.dirname(nodeBin)}:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin" bash "${scriptAbs}" >> "${logDir}/cron.log" 2>&1 # tnf-chronological:${worker.scheduleId}`;
    kept.push(entry);
    record(`worker:${worker.scheduleId}`, 'ok', worker.cadence);
  }
  if (!DRY) {
    const tmp = path.join(TNF_HOME, 'core-fleet-crontab.tmp');
    fs.writeFileSync(tmp, `${kept.join('\n').replace(/\n+$/, '')}\n`);
    execFileSync('crontab', [tmp]);
    fs.unlinkSync(tmp);
  }
}

function seedMcpConfig() {
  const candidates = [
    path.join(ROOT, 'data/mcp_config.json'),
    path.join(ROOT, 'tools/config-files/mcp_config.json'),
  ];
  const src = candidates.find((p) => fs.existsSync(p));
  if (!src) {
    record('mcp', 'warn', 'no repo MCP config found');
    return;
  }
  const destDir = path.join(HOME, '.config', 'tnf', 'mcp');
  const dest = path.join(TNF_HOME, 'mcp.json');
  ensureDir(destDir);
  if (!fs.existsSync(dest) || FORCE_IDENTITY) {
    copyFile(src, dest);
  }
  const configDest = path.join(destDir, 'mcp_config.json');
  if (!fs.existsSync(configDest) || FORCE_IDENTITY) {
    copyFile(src, configDest);
  }
  record('mcp', 'ok', dest);
}

/**
 * Seconds between runs for a step cron cadence such as every-5-minutes.
 *
 * Derived from the cadence already declared in WORKERS rather than restated as
 * a constant, so the schedule and the liveness expectation cannot drift apart.
 * Anything not matching that shape yields null, and the agent keeps the flat
 * liveness window.
 */
function cronCadenceSeconds(cadence) {
  const m = /^\*\/(\d+)\s+\*\s+\*\s+\*\s+\*$/.exec(String(cadence || '').trim());
  return m ? Number(m[1]) * 60 : null;
}

/**
 * Cap runtime logs under ~/.tnf.
 *
 * Nothing rotated these. On 2026-08-12 relay stdout alone reached 2.8 GB and
 * ~/.tnf hit 6.5 GB, filling the volume; com.tnf.subdirector-autopilot then
 * died repeatedly with ENOSPC while writing its state file. One service was
 * killed by another service's logging.
 *
 * Best-effort: failing to rotate must never abort fleet establishment.
 */
function rotateRuntimeLogs() {
  const script = path.join(ROOT, 'scripts', 'runtime', 'rotate-tnf-logs.sh');
  if (!fs.existsSync(script)) {
    record('rotate:logs', 'skip', 'rotate-tnf-logs.sh not present');
    return;
  }
  try {
    const out = execFileSync('bash', [script], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const line = out.split('\n').find((l) => l.includes('reclaimed')) || 'nothing over threshold';
    record('rotate:logs', 'ok', line.trim());
  } catch (err) {
    record('rotate:logs', 'warn', err.message || String(err));
  }
}

function redisRegisterCoreAgents() {
  const ping = spawnSync('redis-cli', ['ping'], { encoding: 'utf8' });
  if ((ping.stdout || '').trim() !== 'PONG') {
    record('register', 'skip', 'redis down');
    return;
  }
  const now = new Date().toISOString();
  const agents = [
    {
      id: 'tnf-local-subdirector',
      name: DEFAULT_IDENTITY.name,
      role: 'director',
      platform: 'tnf',
      capabilities: [
        'lane_coordination',
        'cloud_sync',
        'authority_verification',
        'broadcast_super_director_prompt',
        'fleet_establish',
      ],
      // launchd runs this on StartInterval=300, so a 60s liveness window
      // marked a perfectly healthy Sub-Director offline ~80% of the time.
      expectedCadenceSec: LOCAL_SUBDIRECTOR_INTERVAL_SEC,
      extra: {
        daccRole: 'director',
        directorTier: 'sub',
        embodiment: 'sub-director',
        source: 'establish-core-federated-fleet',
      },
    },
    ...WORKERS.map((w) => ({
      id: w.registryId,
      name: w.name,
      role: 'worker',
      platform: 'claude',
      expectedCadenceSec: cronCadenceSeconds(w.cadence),
      capabilities: ['subdirector_authorized'],
      extra: { source: 'establish-core-federated-fleet', subdirector_authorized: true },
    })),
  ];

  for (const agent of agents) {
    const payload = JSON.stringify({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      platform: agent.platform,
      status: 'active',
      isOnline: true,
      capabilities: agent.capabilities,
      registeredAt: now,
      lastSeen: now,
      ...(agent.expectedCadenceSec ? { expectedCadenceSec: agent.expectedCadenceSec } : {}),
      routing: { callableWorker: agent.role === 'worker', directorPoolEligible: true },
      ...agent.extra,
    });
    if (DRY) {
      record(`register:${agent.id}`, 'skip', 'dry-run');
      continue;
    }
    spawnSync('redis-cli', ['HSET', 'tnf:agent-registry', agent.id, payload], {
      encoding: 'utf8',
    });
    record(`register:${agent.id}`, 'ok', agent.role);
  }
}

function writeDefaultEnvHints() {
  const envPath = path.join(TNF_HOME, 'core-fleet.env');
  const body = [
    '# Sourced by operators / wrappers after core fleet establish.',
    'export AGENT_NAME=tnf-local-subdirector',
    'export AGENT_ROLE=director',
    'export AGENT_PLATFORM=tnf',
    'export TNF_DIRECTOR_TIER=sub',
    'export LOCAL_SUBDIRECTOR_ACTOR_ID=tnf-local-subdirector',
    '',
  ].join('\n');
  if (!DRY) fs.writeFileSync(envPath, body, { mode: 0o644 });
  record('env-hints', 'ok', envPath);
}

async function writeReceipt() {
  receipt.ok = receipt.errors.length === 0;
  const outJson = path.join(TNF_HOME, 'core-fleet-latest.json');
  const outMd = path.join(TNF_HOME, 'core-fleet-latest.md');
  ensureDir(TNF_HOME);
  if (!DRY) {
    await fsp.writeFile(outJson, `${JSON.stringify(receipt, null, 2)}\n`);
    const md = [
      '# TNF Core Federated Fleet',
      '',
      `- generatedAt: ${receipt.generatedAt}`,
      `- ok: ${receipt.ok}`,
      `- dryRun: ${receipt.dryRun}`,
      '',
      '## Steps',
      ...receipt.steps.map((s) => `- [${s.status}] ${s.step}${s.detail ? ` — ${s.detail}` : ''}`),
      '',
      receipt.warnings.length ? '## Warnings\n' + receipt.warnings.map((w) => `- ${w}`).join('\n') : '',
      receipt.errors.length ? '## Errors\n' + receipt.errors.map((e) => `- ${e}`).join('\n') : '',
      '',
    ].join('\n');
    await fsp.writeFile(outMd, md);
  }
  log(`receipt -> ${outJson}`);
}

async function main() {
  if (args.has('--help') || args.has('-h')) {
    console.log(`Usage: node scripts/runtime/establish-core-federated-fleet.cjs [--dry-run] [--force-identity] [--skip]
Env:
  TNF_SKIP_CORE_FLEET=1          skip entirely
  TNF_CORE_FLEET_SKIP_RELAY=1    skip relay bring-up
`);
    process.exit(0);
  }

  if (SKIP) {
    log('skipped (TNF_SKIP_CORE_FLEET or --skip)');
    receipt.ok = true;
    receipt.steps.push({ step: 'skip', status: 'skip', detail: 'opt-out', at: new Date().toISOString() });
    await writeReceipt();
    return;
  }

  log(`establishing core federated fleet from ${ROOT}`);
  ensureDir(path.join(TNF_HOME, 'bin'));
  ensureDir(path.join(TNF_HOME, 'lib'));

  try {
    writeIdentity();
    writeDefaultEnvHints();
    syncServiceHome('local-subdirector', 'scripts/runtime/local-subdirector-runtime.cjs');
    syncServiceHome('master-heartbeat', 'scripts/runtime/tnf-master-heartbeat-loop.cjs');
    // Also sync director / heartbeat helpers used by harness
    copyFile(
      path.join(ROOT, 'scripts/runtime/tnf-director-loop.cjs'),
      path.join(TNF_HOME, 'bin', 'tnf-director-loop.cjs')
    );
    copyFile(
      path.join(ROOT, 'scripts/runtime/terminal-heartbeat-pulse.cjs'),
      path.join(TNF_HOME, 'bin', 'terminal-heartbeat-pulse.cjs')
    );

    if (process.platform === 'darwin') {
      relocateHijackedLabel(
        'com.tnf.local-subdirector',
        'local-subdirector-runtime.cjs',
        'com.tnf.fleet-health-probe',
        LOCAL_SUBDIRECTOR_INTERVAL_SEC
      );
      relocateHijackedLabel(
        'com.tnf.master-heartbeat',
        'tnf-master-heartbeat-loop.cjs',
        'com.tnf.master-reconciliation',
        3600
      );
    }

    ensureRedis();
    ensureRelayBestEffort();
    seedMcpConfig();
    syncSubDirectorRuntime();
    rotateRuntimeLogs();
    installServices();
    installWorkerCrons();
    redisRegisterCoreAgents();
  } catch (err) {
    receipt.errors.push(err.message || String(err));
    record('fatal', 'error', err.message || String(err));
  }

  await writeReceipt();
  if (receipt.errors.length) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
