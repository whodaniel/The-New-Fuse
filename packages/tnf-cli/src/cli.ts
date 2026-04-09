import chalk from 'chalk';
import { spawn, spawnSync } from 'child_process';
import { Command } from 'commander';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import type { AgentMessage } from './RedisAgentClient.js';
import { RedisAgentClient } from './RedisAgentClient.js';

const program = new Command();
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const SUPER_ADMIN_ENV_KEY = 'TNF_SUPER_ADMIN_TOKEN';
const SUPER_ADMIN_INPUT_ENV_KEY = 'TNF_SUPER_ADMIN_INPUT_TOKEN';
const RUNNABLE_SCRIPT_EXTENSIONS = new Set([
  '.sh',
  '.bash',
  '.zsh',
  '.js',
  '.cjs',
  '.mjs',
  '.ts',
  '.tsx',
  '.py',
]);

async function runCommand(
  cmd: string,
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: options.cwd || repoRoot,
      env: { ...process.env, ...(options.env || {}) },
      stdio: 'inherit',
    });

    child.on('error', (error: NodeJS.ErrnoException) => {
      if (error?.code === 'ENOENT') {
        reject(new Error(`'${cmd}' is not installed or not on PATH`));
        return;
      }
      reject(error);
    });
    child.on('close', (code) => {
      if (code === 0) return resolve();
      reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

function requireSuperAdmin(
  options: { superAdminToken?: string } | undefined,
  commandLabel: string
): void {
  const expected = process.env[SUPER_ADMIN_ENV_KEY];
  const provided =
    options?.superAdminToken ||
    process.env[SUPER_ADMIN_INPUT_ENV_KEY] ||
    process.env.CI_SUPER_ADMIN_TOKEN;

  if (!expected) {
    throw new Error(
      `Super Admin auth is not configured. Set ${SUPER_ADMIN_ENV_KEY} in the execution environment.`
    );
  }

  if (!provided || provided !== expected) {
    throw new Error(
      `Super Admin authentication required for '${commandLabel}'. Provide --super-admin-token or ${SUPER_ADMIN_INPUT_ENV_KEY}.`
    );
  }
}

function isExecutableFile(filePath: string): boolean {
  try {
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) return false;
    if (process.platform === 'win32') return true;
    return (stats.mode & 0o111) !== 0;
  } catch {
    return false;
  }
}

function findExecutableOnPath(commandName: string): string | null {
  const pathEnv = process.env.PATH || '';
  for (const directory of pathEnv.split(path.delimiter)) {
    if (!directory) continue;
    const candidate = path.join(directory, commandName);
    if (isExecutableFile(candidate)) return candidate;
  }
  return null;
}

function resolveVoiceBridgeCommand(commandName: string): string {
  const overrideEnvKey = `TNF_VOICE_${commandName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_CMD`;
  const override = process.env[overrideEnvKey];
  if (override) {
    const expanded = override.startsWith('~')
      ? path.join(process.env.HOME || '', override.slice(1))
      : override;
    if (!isExecutableFile(expanded)) {
      throw new Error(
        `${overrideEnvKey} is set but does not point to an executable file: ${expanded}`
      );
    }
    return expanded;
  }

  const onPath = findExecutableOnPath(commandName);
  if (onPath) return onPath;

  const homeBin = process.env.HOME ? path.join(process.env.HOME, 'bin', commandName) : '';
  if (homeBin && isExecutableFile(homeBin)) return homeBin;

  throw new Error(
    `Voice Bridge command '${commandName}' not found. Install Voice Bridge and ensure '${commandName}' is on PATH, or set ${overrideEnvKey}.`
  );
}

async function runVoiceBridgeCommand(commandName: string, args: string[] = []): Promise<void> {
  const executable = resolveVoiceBridgeCommand(commandName);
  await runCommand(executable, args, { cwd: process.cwd() });
}

function normalizeVoiceProfile(raw?: string): string {
  const profile = (raw || 'main')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return profile || 'main';
}

function isDefaultVoiceProfile(profile: string): boolean {
  return profile === 'main' || profile === 'default' || profile === 'primary';
}

function inferVoiceBridgePort(profileInput?: string, explicitPort?: string): number {
  if (explicitPort) {
    const port = Number.parseInt(explicitPort, 10);
    if (!Number.isFinite(port) || port <= 0) {
      throw new Error(`Invalid --port value: ${explicitPort}`);
    }
    return port;
  }

  const envPort = process.env.VOICEBRIDGE_PORT;
  if (envPort) {
    const port = Number.parseInt(envPort, 10);
    if (Number.isFinite(port) && port > 0) return port;
  }

  const profile = normalizeVoiceProfile(profileInput);
  if (isDefaultVoiceProfile(profile)) return 50005;

  const cksum = spawnSync('cksum', {
    input: profile,
    encoding: 'utf8',
    env: process.env,
  });

  if (cksum.status === 0) {
    const token = (cksum.stdout || '').trim().split(/\s+/)[0];
    const hash = Number.parseInt(token || '', 10);
    if (Number.isFinite(hash)) {
      return 50005 + (hash % 400) + 1;
    }
  }

  let fallbackHash = 0;
  for (const char of profile) fallbackHash = (fallbackHash * 33 + char.charCodeAt(0)) >>> 0;
  return 50005 + (fallbackHash % 400) + 1;
}

function readVoiceBridgeJson(
  pathname: string,
  method: 'GET' | 'POST' = 'GET',
  port = 50005
): unknown {
  const url = `http://127.0.0.1:${port}${pathname}`;
  const args = ['-fsS', url];
  if (method === 'POST') args.unshift('-X', 'POST');
  const result = spawnSync('curl', args, {
    encoding: 'utf8',
    env: process.env,
  });
  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    throw new Error(
      `Voice Bridge API call failed for ${method} ${pathname} on 127.0.0.1:${port}. ${
        stderr || `Is voice server running on 127.0.0.1:${port}?`
      }`
    );
  }

  const body = (result.stdout || '').trim();
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`Voice Bridge API returned non-JSON for ${method} ${pathname}: ${body}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function resolveVoiceBridgeStateDir(): string {
  const explicit = (process.env.VOICEBRIDGE_STATE_DIR || '').trim();
  if (explicit) return explicit;
  if (repoRoot && fs.existsSync(repoRoot)) return path.join(repoRoot, '.voicebridge');
  return path.join(process.env.HOME || process.cwd(), '.voicebridge');
}

type VoiceSessionState = {
  profile: string;
  port: number;
  voicePid?: number;
  listenPid?: number;
  startedAt: string;
};

function voiceSessionFile(profileInput?: string): string {
  const profile = normalizeVoiceProfile(profileInput);
  const stateDir = resolveVoiceBridgeStateDir();
  fs.mkdirSync(stateDir, { recursive: true });
  return path.join(stateDir, `tnf_voice_session_${profile}.json`);
}

function writeVoiceSession(session: VoiceSessionState): void {
  const file = voiceSessionFile(session.profile);
  fs.writeFileSync(file, `${JSON.stringify(session, null, 2)}\n`, 'utf8');
}

function readVoiceSession(profileInput?: string): VoiceSessionState | null {
  const file = voiceSessionFile(profileInput);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as VoiceSessionState;
  } catch {
    return null;
  }
}

function removeVoiceSession(profileInput?: string): void {
  const file = voiceSessionFile(profileInput);
  if (fs.existsSync(file)) fs.rmSync(file, { force: true });
}

function parseProcessTable(): Array<{ pid: number; cmd: string }> {
  const result = spawnSync('ps', ['-Ao', 'pid=,command='], {
    encoding: 'utf8',
    env: process.env,
  });
  if (result.status !== 0) return [];
  return (result.stdout || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const firstWhitespace = line.search(/\s/);
      if (firstWhitespace <= 0) return { pid: Number.NaN, cmd: '' };
      const pidText = line.slice(0, firstWhitespace).trim();
      const cmd = line.slice(firstWhitespace).trim();
      const pid = Number.parseInt(pidText, 10);
      return { pid, cmd };
    })
    .filter((entry) => Number.isFinite(entry.pid) && entry.pid > 0 && entry.cmd.length > 0);
}

function matchesVoiceProfileProcess(cmd: string, profileInput?: string): boolean {
  const profile = normalizeVoiceProfile(profileInput);
  const isDefault = isDefaultVoiceProfile(profile);
  const profilePattern = new RegExp(
    `(?:^|\\s)--profile(?:=|\\s+)${escapeRegExp(profile)}(?:\\s|$)`,
    'i'
  );
  const hasProfileFlag = /(?:^|\s)--profile(?:=|\s+)/i.test(cmd);
  const argv0 = (cmd.trim().split(/\s+/)[0] || '').toLowerCase();
  const argv0Base = path.basename(argv0);
  const cmdLower = cmd.toLowerCase();

  const isVoiceWrapper = argv0Base === 'voice';
  const isListenWrapper = argv0Base === 'listen';
  const isProfiledPythonWorker =
    cmdLower.includes('voice_server.py') ||
    cmdLower.includes('stream_watch.py') ||
    cmdLower.includes('voice-response-audio-watch.py');

  if (profilePattern.test(cmd)) {
    if (isVoiceWrapper || isListenWrapper || isProfiledPythonWorker) return true;
  }

  if (!isDefault || hasProfileFlag) return false;

  if (isVoiceWrapper || isListenWrapper || isProfiledPythonWorker) return true;
  return false;
}

function findVoiceProfilePids(profileInput?: string): number[] {
  return parseProcessTable()
    .filter((entry) => matchesVoiceProfileProcess(entry.cmd, profileInput))
    .map((entry) => entry.pid);
}

function findMainProfileInterferencePids(activeProfiles: string[]): number[] {
  const normalizedActive = new Set(activeProfiles.map((p) => normalizeVoiceProfile(p)));
  for (const profile of normalizedActive) {
    if (isDefaultVoiceProfile(profile)) return [];
  }
  return findVoiceProfilePids('main');
}

function isPidAlive(pid: number): boolean {
  if (!Number.isFinite(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function terminatePids(
  pids: number[],
  options: { graceMs?: number; killMs?: number } = {}
): Promise<{ stopped: number[]; notFound: number[]; forceKilled: number[] }> {
  const graceMs = options.graceMs ?? 1800;
  const killMs = options.killMs ?? 1200;
  const unique = Array.from(new Set(pids.filter((pid) => Number.isFinite(pid) && pid > 0)));
  const notFound: number[] = [];
  const stopped: number[] = [];
  const forceKilled: number[] = [];

  for (const pid of unique) {
    if (!isPidAlive(pid)) {
      notFound.push(pid);
      continue;
    }
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      notFound.push(pid);
    }
  }

  const waitUntil = Date.now() + graceMs;
  while (Date.now() < waitUntil) {
    const alive = unique.filter((pid) => isPidAlive(pid));
    if (alive.length === 0) break;
    await sleep(120);
  }

  const stillAlive = unique.filter((pid) => isPidAlive(pid));
  if (stillAlive.length > 0) {
    for (const pid of stillAlive) {
      try {
        process.kill(pid, 'SIGKILL');
        forceKilled.push(pid);
      } catch {
        // ignore
      }
    }
    await sleep(killMs);
  }

  for (const pid of unique) {
    if (!isPidAlive(pid)) stopped.push(pid);
  }

  return { stopped, notFound, forceKilled };
}

function spawnDetachedVoiceCommand(
  commandName: string,
  args: string[],
  env: NodeJS.ProcessEnv
): number {
  const executable = resolveVoiceBridgeCommand(commandName);
  const child = spawn(executable, args, {
    cwd: process.cwd(),
    env,
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  if (!child.pid) throw new Error(`Failed to start detached command: ${commandName}`);
  return child.pid;
}

async function waitForVoiceServer(port: number, timeoutMs = 12000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const probe = spawnSync('curl', ['-fsS', `http://127.0.0.1:${port}/`], {
      encoding: 'utf8',
      env: process.env,
    });
    if (probe.status === 0) return true;
    await sleep(220);
  }
  return false;
}

function voiceProfileSuffix(profileInput?: string): string {
  const profile = normalizeVoiceProfile(profileInput);
  return isDefaultVoiceProfile(profile) ? '' : `_${profile}`;
}

function voiceProfileLastInputFiles(profileInput?: string): { tsPath: string; textPath: string } {
  const suffix = voiceProfileSuffix(profileInput);
  return {
    tsPath: `/tmp/voice_last_user_input_ts${suffix}`,
    textPath: `/tmp/voice_last_user_input_text${suffix}`,
  };
}

function normalizeRelayText(raw: string): string {
  return (raw || '').replace(/\s+/g, ' ').trim();
}

function relayTextHash(text: string): string {
  return createHash('sha1').update(text).digest('hex');
}

function isRelayControlSignal(text: string): boolean {
  const normalized = normalizeRelayText(text).toLowerCase();
  if (!normalized) return true;
  if (normalized.startsWith('hb ')) return true;
  if (/\bheartbeat\b/.test(normalized)) return true;
  if (/\bkeep polling\b/.test(normalized)) return true;
  if (/\bcontinue polling\b/.test(normalized)) return true;
  return false;
}

function postVoiceSend(port: number, text: string): { ok: boolean; body: string; error?: string } {
  const payload = JSON.stringify({ text });
  const result = spawnSync(
    'curl',
    [
      '-fsS',
      '--max-time',
      '2',
      '-X',
      'POST',
      `http://127.0.0.1:${port}/send`,
      '-H',
      'Content-Type: application/json',
      '--data',
      payload,
    ],
    {
      encoding: 'utf8',
      env: process.env,
    }
  );
  if (result.status !== 0) {
    return {
      ok: false,
      body: '',
      error: (result.stderr || '').trim() || `curl exit ${result.status}`,
    };
  }
  return { ok: true, body: (result.stdout || '').trim() };
}

function postVoiceActivate(port: number): { ok: boolean; body: string; error?: string } {
  const result = spawnSync(
    'curl',
    ['-fsS', '--max-time', '2', '-X', 'POST', `http://127.0.0.1:${port}/activate`],
    {
      encoding: 'utf8',
      env: process.env,
    }
  );
  if (result.status !== 0) {
    return {
      ok: false,
      body: '',
      error: (result.stderr || '').trim() || `curl exit ${result.status}`,
    };
  }
  return { ok: true, body: (result.stdout || '').trim() };
}

type RelayDirectionState = {
  id: string;
  fromProfile: string;
  toProfile: string;
  fromPort: number;
  toPort: number;
  forwarded: number;
  acked: number;
  skippedEcho: number;
  skippedControl: number;
  sendFailed: number;
};

type RelayPendingDelivery = {
  msgId: string;
  hash: string;
  fromProfile: string;
  toProfile: string;
  at: number;
};

function relayDirection(
  fromProfile: string,
  toProfile: string,
  fromPort: number,
  toPort: number
): RelayDirectionState {
  return {
    id: `${fromProfile}->${toProfile}`,
    fromProfile: normalizeVoiceProfile(fromProfile),
    toProfile: normalizeVoiceProfile(toProfile),
    fromPort,
    toPort,
    forwarded: 0,
    acked: 0,
    skippedEcho: 0,
    skippedControl: 0,
    sendFailed: 0,
  };
}

function readVoiceProfileLastInput(
  profileInput?: string
): { ts: number; text: string; hash: string } | null {
  const { tsPath, textPath } = voiceProfileLastInputFiles(profileInput);
  if (!fs.existsSync(tsPath) || !fs.existsSync(textPath)) return null;

  let ts = Number.NaN;
  let text = '';
  try {
    ts = Number.parseFloat((fs.readFileSync(tsPath, 'utf8') || '').trim());
    text = normalizeRelayText(fs.readFileSync(textPath, 'utf8') || '');
  } catch {
    return null;
  }

  if (!Number.isFinite(ts) || ts <= 0 || !text) return null;
  return { ts, text, hash: relayTextHash(text) };
}

function voiceProfileLastAssistantOutputFiles(profileInput?: string): {
  tsPath: string;
  textPath: string;
} {
  const suffix = voiceProfileSuffix(profileInput);
  return {
    tsPath: `/tmp/voice_last_assistant_output_ts${suffix}`,
    textPath: `/tmp/voice_last_assistant_output_text${suffix}`,
  };
}

function readVoiceProfileLastAssistantOutput(
  profileInput?: string
): { ts: number; text: string; hash: string } | null {
  const { tsPath, textPath } = voiceProfileLastAssistantOutputFiles(profileInput);
  if (!fs.existsSync(tsPath) || !fs.existsSync(textPath)) return null;

  let ts = Number.NaN;
  let text = '';
  try {
    ts = Number.parseFloat((fs.readFileSync(tsPath, 'utf8') || '').trim());
    text = normalizeRelayText(fs.readFileSync(textPath, 'utf8') || '');
  } catch {
    return null;
  }

  if (!Number.isFinite(ts) || ts <= 0 || !text) return null;
  return { ts, text, hash: relayTextHash(text) };
}

function clipProtocolText(raw: string, maxChars = 96): string {
  const text = normalizeRelayText(raw);
  if (!text) return '';
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1)}…`;
}

function ageMsFromUnixTs(ts?: number | null): number | null {
  if (!ts || !Number.isFinite(ts) || ts <= 0) return null;
  const nowMs = Date.now();
  const tsMs = Math.round(ts * 1000);
  const age = nowMs - tsMs;
  return age >= 0 ? age : 0;
}

function formatAgeMs(ageMs?: number | null): string {
  if (ageMs === null || typeof ageMs === 'undefined') return 'n/a';
  if (ageMs < 1000) return `${ageMs}ms`;
  const seconds = Math.floor(ageMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `${hours}h ${remMinutes}m`;
}

function findProfilePythonWorkerPids(profileInput: string, scriptName: string): number[] {
  const profile = normalizeVoiceProfile(profileInput);
  const profilePattern = new RegExp(
    `(?:^|\\s)--profile(?:=|\\s+)${escapeRegExp(profile)}(?:\\s|$)`,
    'i'
  );

  return parseProcessTable()
    .filter((entry) => {
      const cmd = entry.cmd;
      if (!cmd.toLowerCase().includes(scriptName.toLowerCase())) return false;
      const argv0 = (cmd.trim().split(/\s+/)[0] || '').toLowerCase();
      if (!path.basename(argv0).includes('python')) return false;
      return profilePattern.test(cmd);
    })
    .map((entry) => entry.pid);
}

function findVoiceRelayPids(fromProfileInput: string, toProfileInput: string): number[] {
  const fromProfile = normalizeVoiceProfile(fromProfileInput);
  const toProfile = normalizeVoiceProfile(toProfileInput);
  const fromPattern = new RegExp(
    `(?:^|\\s)--from(?:=|\\s+)${escapeRegExp(fromProfile)}(?:\\s|$)`,
    'i'
  );
  const toPattern = new RegExp(`(?:^|\\s)--to(?:=|\\s+)${escapeRegExp(toProfile)}(?:\\s|$)`, 'i');

  return parseProcessTable()
    .filter((entry) => {
      const cmd = entry.cmd;
      if (!/(?:^|\s)voice\s+relay(?:\s|$)/i.test(cmd)) return false;
      return fromPattern.test(cmd) && toPattern.test(cmd);
    })
    .map((entry) => entry.pid);
}

function relayLogPath(fromProfileInput: string, toProfileInput: string): string {
  const fromProfile = normalizeVoiceProfile(fromProfileInput);
  const toProfile = normalizeVoiceProfile(toProfileInput);
  return `/tmp/voice_relay_${fromProfile}_${toProfile}.log`;
}

function readLastHeartbeatLine(
  fromProfileInput: string,
  toProfileInput: string
): { line: string; tsIso: string | null; ageMs: number | null } | null {
  const logPath = relayLogPath(fromProfileInput, toProfileInput);
  if (!fs.existsSync(logPath)) return null;

  let body = '';
  try {
    body = fs.readFileSync(logPath, 'utf8');
  } catch {
    return null;
  }
  if (!body) return null;

  const lines = body.split('\n');
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i].trim();
    if (!line.startsWith('HB ')) continue;
    const match = line.match(/^HB\s+([0-9]{4}-[0-9]{2}-[0-9]{2}T[^ ]+)/);
    const tsIso = match ? match[1] : null;
    let ageMs: number | null = null;
    if (tsIso) {
      const parsed = Date.parse(tsIso);
      if (Number.isFinite(parsed)) {
        ageMs = Math.max(0, Date.now() - parsed);
      }
    }
    return { line, tsIso, ageMs };
  }
  return null;
}

type VoiceProtocolSnapshot = {
  profile: string;
  port: number;
  serverUp: boolean;
  streamWatchPids: number[];
  responseAudioPids: number[];
  lastUserInput: { ts: number; text: string; hash: string } | null;
  lastAssistantOutput: { ts: number; text: string; hash: string } | null;
};

async function collectVoiceProtocolSnapshot(
  profileInput: string,
  port: number
): Promise<VoiceProtocolSnapshot> {
  const profile = normalizeVoiceProfile(profileInput);
  const serverUp = await waitForVoiceServer(port, 450);
  return {
    profile,
    port,
    serverUp,
    streamWatchPids: findProfilePythonWorkerPids(profile, 'stream_watch.py'),
    responseAudioPids: findProfilePythonWorkerPids(profile, 'voice-response-audio-watch.py'),
    lastUserInput: readVoiceProfileLastInput(profile),
    lastAssistantOutput: readVoiceProfileLastAssistantOutput(profile),
  };
}

type RootScriptEntry = { name: string; command: string };
type FileScriptEntry = { key: string; relPath: string; absPath: string };
type MenuEntry = { path: string; description: string };
type MenuSection = { title: string; entries: MenuEntry[] };
type TraitGroup = { name: string; values: string[] };
type OpenClawCompatibilityEntry = {
  command: string;
  mode: 'implicit' | 'explicit-only';
  directPath: string | null;
  explicitPath: string;
};
type SplashTheme = 'fuse' | 'atri' | 'neon' | 'ember' | 'mono';
type SplashOptions = {
  theme: SplashTheme;
  animate: boolean;
  speedMs: number;
  compact: boolean;
};

function loadRootScripts(): RootScriptEntry[] {
  const packageJsonPath = path.join(repoRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
    scripts?: Record<string, string>;
  };
  return Object.entries(packageJson.scripts || {})
    .map(([name, command]) => ({ name, command }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function isRunnableScriptFile(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase();
  if (RUNNABLE_SCRIPT_EXTENSIONS.has(ext)) return true;
  const lower = fileName.toLowerCase();
  return lower === 'makefile' || lower === 'justfile';
}

function discoverFileScripts(): FileScriptEntry[] {
  const out: FileScriptEntry[] = [];
  const roots = [path.join(repoRoot, 'scripts'), path.join(repoRoot, 'tools')].filter((p) =>
    fs.existsSync(p)
  );

  const walk = (dir: string) => {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const absPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(absPath);
        continue;
      }
      if (!entry.isFile() || !isRunnableScriptFile(entry.name)) continue;
      const relPath = path.relative(repoRoot, absPath).replace(/\\/g, '/');
      out.push({ key: relPath, relPath, absPath });
    }
  };

  for (const root of roots) walk(root);

  // Include runnable files directly in repo root.
  for (const fileName of fs.readdirSync(repoRoot)) {
    const absPath = path.join(repoRoot, fileName);
    if (!fs.existsSync(absPath) || !fs.statSync(absPath).isFile()) continue;
    if (!isRunnableScriptFile(fileName)) continue;
    const relPath = path.relative(repoRoot, absPath).replace(/\\/g, '/');
    out.push({ key: relPath, relPath, absPath });
  }

  return out.sort((a, b) => a.key.localeCompare(b.key));
}

function resolveFileScript(input: string): FileScriptEntry | null {
  const normalized = input.replace(/\\/g, '/').replace(/^\.?\//, '');
  const candidates = discoverFileScripts();
  const direct = candidates.find((item) => item.relPath === normalized);
  if (direct) return direct;
  const withScriptsPrefix = candidates.find((item) => item.relPath === `scripts/${normalized}`);
  if (withScriptsPrefix) return withScriptsPrefix;
  const withToolsPrefix = candidates.find((item) => item.relPath === `tools/${normalized}`);
  if (withToolsPrefix) return withToolsPrefix;

  const absCandidate = path.resolve(repoRoot, normalized);
  if (
    absCandidate.startsWith(repoRoot) &&
    fs.existsSync(absCandidate) &&
    fs.statSync(absCandidate).isFile() &&
    isRunnableScriptFile(path.basename(absCandidate))
  ) {
    const relPath = path.relative(repoRoot, absCandidate).replace(/\\/g, '/');
    return { key: relPath, relPath, absPath: absCandidate };
  }
  return null;
}

async function runFileScript(file: FileScriptEntry, args: string[]): Promise<void> {
  const ext = path.extname(file.absPath).toLowerCase();
  if (ext === '.sh' || ext === '.bash' || ext === '.zsh') {
    await runCommand('bash', [file.relPath, ...args]);
    return;
  }
  if (ext === '.py') {
    await runCommand('python3', [file.relPath, ...args]);
    return;
  }
  if (ext === '.ts' || ext === '.tsx') {
    await runCommand('node', ['--import', 'tsx', file.relPath, ...args]);
    return;
  }
  if (ext === '.js' || ext === '.cjs' || ext === '.mjs') {
    await runCommand('node', [file.relPath, ...args]);
    return;
  }
  throw new Error(`Unsupported script type for ${file.relPath}`);
}

const cliEntryPath = fileURLToPath(import.meta.url);
const AGENT_ROLE_TRAITS = ['orchestrator', 'broker', 'worker', 'participant'];
const AGENT_PLATFORM_TRAITS = ['antigravity', 'gemini', 'claude', 'jules', 'vscode', 'browser'];
const SUPER_ADMIN_COMMAND_TRAITS = [
  'tnf relay start',
  'tnf jules loop',
  'tnf jules supervisor',
  'tnf jules supervisor-start',
  'tnf jules supervisor-stop',
  'tnf jules supervisor-migrate-from-cron',
  'tnf jules merge-open',
  'tnf jules cron-install',
  'tnf master-clock start|logs|status',
  'tnf super-cycle event|status',
  'tnf skills bank supervisor|supervisor-start|supervisor-stop',
  'tnf run <script>',
];
const REDIS_COMMAND_TRAITS = [
  'tnf register',
  'tnf list',
  'tnf send',
  'tnf orchestrate',
  'tnf convo',
  'tnf agents register|list|send|orchestrate|convo',
];
const CLOUD_FIRST_COMMAND_TRAITS = ['tnf master-clock start', 'tnf super-cycle event|status'];
const SPLASH_THEMES: SplashTheme[] = ['fuse', 'atri', 'neon', 'ember', 'mono'];
const DEFAULT_SPLASH_THEME: SplashTheme = 'fuse';
const DEFAULT_SPLASH_SPEED_MS = 85;

const safeStdoutHandler = (error: NodeJS.ErrnoException) => {
  if (error?.code === 'EPIPE') {
    process.exit(0);
  }
  throw error;
};
process.stdout.on('error', safeStdoutHandler);

function coerceSplashTheme(value?: string): SplashTheme {
  const normalized = (value || '').trim().toLowerCase();
  if (SPLASH_THEMES.includes(normalized as SplashTheme)) {
    return normalized as SplashTheme;
  }
  return DEFAULT_SPLASH_THEME;
}

function parseBooleanEnvFlag(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function normalizeSplashOptions(options: Partial<SplashOptions> = {}): SplashOptions {
  const envTheme = process.env.TNF_SPLASH_THEME;
  const envAnimate = process.env.TNF_SPLASH_ANIMATE;
  const envSpeed = process.env.TNF_SPLASH_SPEED_MS;
  const envCompact = process.env.TNF_SPLASH_COMPACT;

  const theme = coerceSplashTheme(options.theme || envTheme);
  const animate = options.animate ?? parseBooleanEnvFlag(envAnimate, !!process.stdout.isTTY);
  const compact = options.compact ?? parseBooleanEnvFlag(envCompact, false);

  let speedMs = options.speedMs;
  if (speedMs == null) {
    const parsed = Number.parseInt(envSpeed || '', 10);
    speedMs = Number.isFinite(parsed) ? parsed : DEFAULT_SPLASH_SPEED_MS;
  }
  speedMs = Math.max(35, Math.min(240, speedMs));

  return { theme, animate, speedMs, compact };
}

function parseAnimateMode(value?: string): boolean | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'auto') return undefined;
  if (normalized === 'on' || normalized === 'true') return true;
  if (normalized === 'off' || normalized === 'false') return false;
  throw new Error("Invalid --animate mode. Use 'auto', 'on', or 'off'.");
}

type ThemePainter = {
  gradientStops: string[];
};

function getThemePainter(theme: SplashTheme) {
  switch (theme) {
    case 'atri':
      return {
        gradientStops: ['#22d3ee', '#60a5fa', '#a78bfa', '#f472b6'],
      } satisfies ThemePainter;
    case 'neon':
      return {
        gradientStops: ['#22d3ee', '#8b5cf6', '#ec4899'],
      } satisfies ThemePainter;
    case 'ember':
      return {
        gradientStops: ['#f59e0b', '#fb7185', '#ec4899'],
      } satisfies ThemePainter;
    case 'mono':
      return {
        gradientStops: ['#d4d4d8', '#a1a1aa', '#d4d4d8'],
      } satisfies ThemePainter;
    case 'fuse':
    default:
      return {
        gradientStops: ['#2563eb', '#6d28d9', '#be185d'],
      } satisfies ThemePainter;
  }
}

function centerText(raw: string, width: number): string {
  const normalized = raw.trim();
  if (normalized.length >= width) return normalized.slice(0, width);
  const left = Math.floor((width - normalized.length) / 2);
  const right = width - normalized.length - left;
  return `${' '.repeat(left)}${normalized}${' '.repeat(right)}`;
}

function gradientize(raw: string, stops: string[]): string {
  if (raw.length === 0) return raw;
  if (stops.length === 0) return raw;
  if (stops.length === 1) return chalk.hex(stops[0])(raw);
  const maxIdx = stops.length - 1;
  return raw
    .split('')
    .map((char, idx) => {
      const ratio = raw.length <= 1 ? 0 : idx / (raw.length - 1);
      const stopIdx = Math.min(maxIdx, Math.floor(ratio * maxIdx));
      return chalk.hex(stops[stopIdx])(char);
    })
    .join('');
}

const HERO_TNF_LINES = [
  '                                                                                                                                ',
  '                              / ``````````````````````````````*````````````````````````````````^                                ',
  '                            /,.(FW0{\\kFW0{\\kFW0{\\kjW@4\\\\jQ@{(l\\ +{(\\jQ@{(\\jQ@4(\\j314\\\\j3@4(\\jQ@   \\                             ',
  '                          ,, ,,,.~-,y,j~-,_,j~-,_,j~-,_,j~-_,~j|.g,,,,-,,_j_-,,,j~-,u,j~-,.,j~-_., \\\\                           ',
  '                          ,_ `_____`  ,..................l. ___| ___.....................`.  __`__ _                            ',
  "                       //   *^^^` ^    ------------------ !``^`|''``! -------------------     *^^^`  \\`                         ",
  '                        -----------^   \\                 |!((u8|(UA;|                   /   -----------`  V                     ',
  '                     ~~~~~~~~~~~~~~    ,`````````````````|| ,-,|_p_,| ``````````````````\\   ~~~~~~~~~~~~~~~^                    ',
  '                        `             .  `````````` ```` |! ___|___ ! ```` ````````````                                         ',
  "                     `7`   `  `  ` `    |(`*``**`*`\\     |!`^^<|''^ |     ||```**`**`*****`***``****`````  /                    ",
  '                      ```````````````   |( hNJ| JJ|\\\\    |!((k4|(7p;|     ||({U )m53bbFT5J( FTk%JJFFX>    /                     ',
  '                                        |( _,.|.. ,,(\\   |:.,,,|__,,|     ||._.  _:.  ,,:   ,_ ______     ,                     ',
  "                                        |`  _ |    ``_ ` '' ___| ___!     ||___ ,_`_  ................  `                       ",
  "                                        |( \"`<|   '+~~ \\\\\\ `V^T|''U`|     ||''  t'~~   ................//                       ",
  '                                        |(:hm0|(JJ][9(J,,\\\\    |(bo;|     ||(;b );$3  )           /   //                        ',
  '                                        |  _,,|.  _ ,.  .,       ,,,|     || ., ,,,.  |            ~~~                          ',
  "                                        |`    |``__ ````_'  ```     !     ||  `  `'^  |--------------`                          ",
  "                                        |( Ut7| ~~ |``'A\"7*\\ \\\\\\^  `|     ||'7  )7(4  |                                         ",
  '                                        |( _;+|__pp|    jgcm,jj\\\\   |     ||}}n )B<Y  .............  /                          ',
  "                                        |` ___|    ||    `` _____   '     ||____,                , ,                            ",
  "                                        |('` `!   `||   `````^``*  \\`     ||''' t  ____________                                 ",
  '                                        |( UP0|`JJF||\\  \\ \\(k>0G{{)`\\\\    ||(+N )49+           7                                ',
  '                                        |( _,_|..  || \\       - ,_,_-\\\\   ||.___,_.  ``````````                                 ',
  "                                        |`  __| _  ||  `     ` ``__   _`` '| __  ,`_  ,````` ```.`                              ",
  "                                        |( \"^'|   '||   `|    \\`^\"^ ^^\" \\\\ |''' F+~~  |      ..                                 ",
  '                                        |((b;m|(J ,||    |( -   \\()jJ{mk) \\|:;n  ]4(  )........^                                ',
  '                                        |  ,,.|._ _||    |. ,,      .,___,.  ., ,,,.  |                                         ',
  '                                        |`` __|``_ ||    |\'   ` `  `"`` __`__`   \'""  |                                         ',
  '                                        |(7U~7|`~~>||    |(7U~7|-   ``!"4"@1`7G )7P7  |                                         ',
  '                                           ~  |(}~~||    |( n,}|_-    \\  ,,j_wn )   > )                                         ',
  '                                          ~.  `    ||    |` ___| _, . .    __     `  ,                                          ',
  '                                            `< `~  ||    |(\'` \'|  ``!    \\ ""     ,<                                            ',
  '                                            V  >. ~||    |( U;m|.^OF|   ` \\\\ <  >                                               ',
  '                                            >.<  `~ |    |(_,,.|.._,|        ,<  ,  `                                           ',
  '                                              `~>.  |    |` ___|`_`_!           .<                                              ',
  "                                                 >.~|    |( U`'|~ '^|     \\. _>^                                                ",
  '                                                   `-      `   |   ^      \\.<                                                   ',
  '                                                         | ~  .    , _                                                          ',
  '                                                         `   ~ `   ,                                                            ',
  '                                                               -',
];

function buildHugeTnfRows(): string[] {
  return [...HERO_TNF_LINES];
}

function shouldAutoCompactMenuSplash(): boolean {
  if (!process.stdout.isTTY) return false;
  const columns = process.stdout.columns ?? Number.MAX_SAFE_INTEGER;
  const rows = process.stdout.rows ?? Number.MAX_SAFE_INTEGER;
  const fullWidth = Math.max(...HERO_TNF_LINES.map((line) => line.length));
  const fullHeight = HERO_TNF_LINES.length;
  const menuRowBudget = 18;
  return columns < fullWidth || rows < fullHeight + menuRowBudget;
}

function buildSplashLines(options: SplashOptions): string[] {
  const paint = getThemePainter(options.theme);
  const compactWidth = 50;
  const compactWordmark = centerText('THE NEW FUSE', compactWidth);
  const compactTag = centerText('TNF', compactWidth);

  if (options.compact) {
    return [
      '',
      gradientize(compactWordmark, paint.gradientStops),
      gradientize(compactTag, paint.gradientStops),
      '',
    ];
  }

  return buildHugeTnfRows();
}

async function animateLogoMerge(options: SplashOptions): Promise<void> {
  const lines = buildSplashLines(options);
  process.stdout.write('\x1Bc');
  for (const line of lines) console.log(line);
}

async function renderSplash(options: Partial<SplashOptions> = {}): Promise<void> {
  const normalized = normalizeSplashOptions(options);
  if (normalized.animate && process.stdout.isTTY && !normalized.compact) {
    await animateLogoMerge(normalized);
    return;
  }
  const lines = buildSplashLines(normalized);
  for (const line of lines) {
    console.log(line);
  }
}

function collectCommandPaths(command: Command, lineage: string[] = ['tnf']): MenuEntry[] {
  const entries: MenuEntry[] = [];
  for (const sub of command.commands) {
    const name = sub.name();
    if (!name || name === 'help') continue;
    const pathTokens = [...lineage, name];
    entries.push({
      path: pathTokens.join(' '),
      description: sub.description() || '',
    });
    entries.push(...collectCommandPaths(sub, pathTokens));
  }
  return entries;
}

function buildTypeIndex(): { cliNamespaces: string[]; scriptNamespaces: Record<string, number> } {
  const cliNamespaces = Array.from(
    new Set(
      collectCommandPaths(program)
        .map((entry) => entry.path.split(' ')[1])
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  const scriptNamespaces = loadRootScripts().reduce<Record<string, number>>((acc, script) => {
    const namespace = script.name.includes(':') ? script.name.split(':')[0] : 'root';
    acc[namespace] = (acc[namespace] || 0) + 1;
    return acc;
  }, {});

  return { cliNamespaces, scriptNamespaces };
}

function buildTraitGroups(): TraitGroup[] {
  return [
    { name: 'agent_roles', values: AGENT_ROLE_TRAITS },
    { name: 'agent_platforms', values: AGENT_PLATFORM_TRAITS },
    { name: 'super_admin_protected', values: SUPER_ADMIN_COMMAND_TRAITS },
    { name: 'redis_required', values: REDIS_COMMAND_TRAITS },
    { name: 'cloud_first', values: CLOUD_FIRST_COMMAND_TRAITS },
  ];
}

function buildCommandMenuSections(options: { full?: boolean } = {}): MenuSection[] {
  const sections: MenuSection[] = [
    {
      title: 'Agent Paths',
      entries: [
        { path: 'tnf agents list', description: 'List registered agents' },
        { path: 'tnf agents register [name] [role] [platform]', description: 'Register an agent' },
        { path: 'tnf agents send <message>', description: 'Send a one-off message' },
        {
          path: 'tnf agents orchestrate <workflow>',
          description: 'Run workflow (health-check|code-review|self-improvement)',
        },
        { path: 'tnf agents convo <start|join> [param]', description: 'Manage conversations' },
      ],
    },
    {
      title: 'Taxonomy Paths',
      entries: [
        { path: 'tnf types list', description: 'List command namespaces and script types' },
        { path: 'tnf traits list', description: 'List roles/platforms and command traits' },
        { path: 'tnf paths', description: 'List all available command paths' },
        {
          path: 'tnf splash [--theme fuse|atri|neon|ember|mono]',
          description: 'Render branded splash',
        },
        { path: 'tnf menu', description: 'Show this organized menu' },
      ],
    },
    {
      title: 'Core Ops',
      entries: [
        { path: 'tnf onboard', description: 'Run TNF frontload onboarding' },
        { path: 'tnf doctor', description: 'Run TNF diagnostics' },
        { path: 'tnf scripts list', description: 'List runnable scripts and package commands' },
        {
          path: 'tnf scripts run <target> [args...]',
          description: 'Execute script or file target',
        },
      ],
    },
    {
      title: 'OpenClaw Ops',
      entries: [
        { path: 'tnf openclaw [args...]', description: 'Pass through any OpenClaw CLI command' },
        { path: 'tnf claw [args...]', description: 'Alias for tnf openclaw' },
      ],
    },
    {
      title: 'Compatibility Ops',
      entries: [
        {
          path: 'tnf compat openclaw [--json]',
          description: 'Show TNF to OpenClaw compatibility and migration coverage',
        },
        {
          path: 'tnf compat openclaw instances [--json]',
          description: 'List OpenClaw installations and instances known to TNF',
        },
        {
          path: 'tnf compat openclaw inventory [--json]',
          description: 'Show redacted OpenClaw config and cron inventory',
        },
        {
          path: 'tnf compat openclaw config [--path key.path] [--json]',
          description: 'Show redacted OpenClaw settings or a specific subtree',
        },
        {
          path: 'tnf compat openclaw cron [--json]',
          description: 'List OpenClaw cron jobs with TNF schedule mapping',
        },
        {
          path: 'tnf compat openclaw sync',
          description: 'Sync live OpenClaw runtime state into TNF control-plane records',
        },
        {
          path: 'tnf compat openclaw cleanup [--disable-failing] [--dry-run]',
          description: 'Clean duplicate and failing TNF-managed OpenClaw cron jobs',
        },
      ],
    },
    {
      title: 'Automation Ops',
      entries: [
        { path: 'tnf jules supervisor-status', description: 'Show Jules supervisor status' },
        { path: 'tnf skills bank sync', description: 'Refresh the cross-LLM skill bank' },
        { path: 'tnf reports status', description: 'Show report lifecycle inventory' },
      ],
    },
  ];

  if (options.full) {
    const allPaths = collectCommandPaths(program).sort((a, b) => a.path.localeCompare(b.path));
    const namespaceCounts = allPaths.reduce<Record<string, number>>((acc, entry) => {
      const namespace = entry.path.split(' ')[1] || 'root';
      acc[namespace] = (acc[namespace] || 0) + 1;
      return acc;
    }, {});
    const namespaceEntries = Object.entries(namespaceCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([namespace, count]) => ({
        path: `tnf ${namespace}`,
        description: `${count} CLI command path${count === 1 ? '' : 's'}`,
      }));

    const tnfRootScripts = loadRootScripts()
      .filter(
        (script) =>
          script.name === 'tnf' || script.name === 'tnf-agent' || script.name.startsWith('tnf:')
      )
      .map((script) => ({
        path: `pnpm run ${script.name}`,
        description: script.command,
      }));

    sections.push(
      {
        title: 'CLI Namespace Counts',
        entries: namespaceEntries,
      },
      {
        title: 'TNF Root Package Scripts',
        entries: tnfRootScripts,
      },
      {
        title: 'All CLI Paths',
        entries: allPaths,
      }
    );
  }

  return sections;
}

async function printCommandMenu(
  options: {
    showSplash?: boolean;
    splash?: Partial<SplashOptions>;
    full?: boolean;
  } = {}
): Promise<void> {
  if (options.showSplash !== false) {
    await renderSplash(options.splash);
  }
  const allPaths = collectCommandPaths(program);
  const rootScripts = loadRootScripts();
  const tnfRootScripts = rootScripts.filter(
    (script) =>
      script.name === 'tnf' || script.name === 'tnf-agent' || script.name.startsWith('tnf:')
  );

  console.log(chalk.bold('\nTNF Command Menu\n'));
  console.log(
    chalk.dim(
      `CLI paths: ${allPaths.length} | tnf package scripts: ${tnfRootScripts.length} | total root scripts: ${rootScripts.length}`
    )
  );
  console.log(chalk.dim('Use `tnf menu --full` for expanded inventory.\n'));
  for (const section of buildCommandMenuSections({ full: options.full })) {
    console.log(chalk.cyan(`${section.title}:`));
    for (const entry of section.entries) {
      const paddedPath = entry.path.padEnd(52, ' ');
      console.log(`  ${chalk.green(paddedPath)} ${chalk.dim(entry.description)}`);
    }
    console.log('');
  }
  console.log(chalk.dim('Run `tnf --help` for complete command reference.\n'));
}

async function runSelfCli(args: string[]): Promise<void> {
  await runCommand(process.execPath, [...process.execArgv, cliEntryPath, ...args]);
}

async function runSelfCliWithExit(args: string[]): Promise<void> {
  try {
    await runSelfCli(args);
  } catch (err: any) {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  }
}

function normalizeForwardedArgs(args: string[] = []): string[] {
  if (args.length > 0 && args[0] === '--') {
    return args.slice(1);
  }
  return args;
}

async function runOpenClawPassthrough(args: string[] = []): Promise<void> {
  await runCommand('openclaw', normalizeForwardedArgs(args));
}

async function runOpenClawControl(args: string[] = []): Promise<void> {
  await runCommand('node', ['scripts/openclaw/tnf-openclaw-control.cjs', ...args]);
}

function buildOpenClawTargetArgs(
  options: {
    installation?: string;
    instance?: string;
    stateDir?: string;
    allInstances?: boolean;
  } = {}
): string[] {
  const args: string[] = [];
  if (options.allInstances) args.push('--all-instances');
  if (options.installation) args.push('--installation', options.installation);
  if (options.instance) args.push('--instance', options.instance);
  if (options.stateDir) args.push('--state-dir', options.stateDir);
  return args;
}

function isOpenClawPassthroughArgv(argv: string[]): boolean {
  const subcommand = argv[2];
  return subcommand === 'openclaw' || subcommand === 'claw';
}

let cachedOpenClawTopLevelCommands: Set<string> | null = null;

function getTnfTopLevelCommands(): Set<string> {
  return new Set(
    program.commands.map((command) => command.name()).filter((name) => !!name && name !== 'help')
  );
}

function parseOpenClawTopLevelCommands(helpText: string): Set<string> {
  const commands = new Set<string>();
  const lines = helpText.split(/\r?\n/);
  const commandsIndex = lines.findIndex((line) => line.trim() === 'Commands:');
  if (commandsIndex < 0) return commands;

  for (const line of lines.slice(commandsIndex + 1)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('Examples:') || trimmed.startsWith('Docs:')) break;

    const match = line.match(/^\s{2,}([a-z][a-z0-9-]*)(?:\s+\*)?\s{2,}/i);
    if (match?.[1]) {
      commands.add(match[1]);
    }
  }

  return commands;
}

function getOpenClawTopLevelCommands(): Set<string> {
  if (cachedOpenClawTopLevelCommands) {
    return cachedOpenClawTopLevelCommands;
  }

  try {
    const result = spawnSync('openclaw', ['--no-color', '--help'], {
      encoding: 'utf8',
      env: process.env,
    });
    const output = `${result.stdout || ''}\n${result.stderr || ''}`;
    cachedOpenClawTopLevelCommands = parseOpenClawTopLevelCommands(output);
  } catch {
    cachedOpenClawTopLevelCommands = new Set();
  }

  return cachedOpenClawTopLevelCommands;
}

function resolveImplicitOpenClawArgs(argv: string[]): string[] | null {
  const subcommand = argv[2];
  if (!subcommand || subcommand === 'help') {
    const helpTarget = argv[3];
    if (!helpTarget) return null;
    if (getTnfTopLevelCommands().has(helpTarget)) return null;
    if (!getOpenClawTopLevelCommands().has(helpTarget)) return null;
    return [helpTarget, '--help'];
  }

  if (getTnfTopLevelCommands().has(subcommand)) return null;
  if (!getOpenClawTopLevelCommands().has(subcommand)) return null;
  return argv.slice(2);
}

function buildOpenClawCompatibilityEntries(): OpenClawCompatibilityEntry[] {
  const tnfTopLevelCommands = getTnfTopLevelCommands();
  return Array.from(getOpenClawTopLevelCommands())
    .sort((a, b) => a.localeCompare(b))
    .map((command) => {
      const collidesWithTnf = tnfTopLevelCommands.has(command);
      return {
        command,
        mode: collidesWithTnf ? 'explicit-only' : 'implicit',
        directPath: collidesWithTnf ? null : `tnf ${command}`,
        explicitPath: `tnf openclaw ${command}`,
      };
    });
}

function buildOpenClawCompatibilityReport() {
  const entries = buildOpenClawCompatibilityEntries();
  const implicit = entries.filter((entry) => entry.mode === 'implicit');
  const explicitOnly = entries.filter((entry) => entry.mode === 'explicit-only');
  return {
    totalOpenClawTopLevelCommands: entries.length,
    implicitCommands: implicit.length,
    explicitOnlyCommands: explicitOnly.length,
    entries,
  };
}

program
  .name('tnf')
  .description('TNF CLI - Unified Command Surface for TNF Operations')
  .version('1.0.0')
  .showSuggestionAfterError()
  .showHelpAfterError();

const logMessage = (message: AgentMessage) => {
  const fromName = message.from?.agentName || 'Unknown';
  const fromRole = message.from?.role || '';
  const type = message.type || 'message';
  const content = message.content || '';

  const roleEmoji: Record<string, string> = {
    orchestrator: '👑',
    broker: '🎯',
    worker: '⚙️',
    participant: '💬',
  };

  const emoji = roleEmoji[fromRole] || '📨';

  let color = chalk.white;
  if (fromRole === 'orchestrator') {
    color = chalk.yellow;
  } else if (fromRole === 'broker') {
    color = chalk.cyan;
  } else if (fromRole === 'worker') {
    color = chalk.green;
  }

  console.log(`\n${emoji} [${color.bold(fromName)}] (${chalk.dim(type)}):`);
  console.log(`   ${content}`);

  if (message.metadata?.event) {
    console.log(`   ${chalk.blue('Event:')} ${message.metadata.event}`);
  }

  if (message.expectsResponse) {
    console.log(`   ${chalk.yellow('⏳ Expects response')}`);
  }
};

function isRedisUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return (
    message.includes('Could not connect to Redis') ||
    message.includes('max retries per request') ||
    message.includes('ECONNREFUSED')
  );
}

function logRedisUnavailable(commandHint: string): never {
  console.error(chalk.yellow('Redis is unavailable at localhost:6379.'));
  console.error(chalk.yellow(`Start Redis, then re-run \`${commandHint}\`.`));
  process.exit(1);
}

program
  .command('register')
  .description('Register and listen as an agent')
  .argument('[name]', 'Agent name', process.env.AGENT_NAME || 'unnamed-agent')
  .argument(
    '[role]',
    'Agent role (orchestrator, broker, worker, participant)',
    process.env.AGENT_ROLE || 'participant'
  )
  .argument(
    '[platform]',
    'Agent platform (antigravity, gemini, claude, jules, vscode, browser)',
    process.env.AGENT_PLATFORM || 'vscode'
  )
  .option('-d, --daemon', 'Run in daemon mode (register and exit immediately)', false)
  .action(async (name, role, platform, options) => {
    const client = new RedisAgentClient();
    try {
      await client.initialize();
      const agentInfo = await client.register(name, role, platform);

      console.log(chalk.green(`\n🤖 Registered as: ${chalk.bold(name)} (${role}) on ${platform}`));
      console.log(`   ID: ${chalk.dim(agentInfo.id)}`);
      console.log(`   Capabilities: ${chalk.dim(agentInfo.capabilities.join(', '))}`);

      if (options.daemon) {
        console.log(chalk.cyan('\n🚀 Daemon mode: Agent registered and running in background'));
        // Keep heartbeat running in background
        // In production, this would be a long-running process
        // For now, just clean up the registration
        await client.cleanup();
        console.log(chalk.green('\n✅ Agent deployment complete'));
        process.exit(0);
      }

      console.log(
        chalk.cyan(
          '\n🎧 Listening for messages... (Type a message and press Enter, or Ctrl+C to exit)\n'
        )
      );

      client.onMessage('*', (msg) => {
        logMessage(msg);
      });

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.on('line', async (line) => {
        if (line.trim()) {
          await client.send(line.trim());
        }
      });

      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n👋 Shutting down...'));
        await client.cleanup();
        process.exit(0);
      });
    } catch (err: any) {
      if (isRedisUnavailable(err)) {
        logRedisUnavailable(`./tnf register ${name} ${role} ${platform}`);
      }
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('onboard')
  .description('Run TNF frontload onboarding')
  .option('--allow-local-db', 'Allow local DATABASE_URL for this run')
  .option('--require-cloud-db', 'Require cloud DATABASE_URL for this run')
  .option('--no-require-cloud-db', 'Allow non-cloud DATABASE_URL for this run')
  .option('--database-url <url>', 'Override DATABASE_URL for this run')
  .action(
    async (options: { allowLocalDb?: boolean; requireCloudDb?: boolean; databaseUrl?: string }) => {
      try {
        const args = ['scripts/tnf-onboard.cjs'];
        if (options.allowLocalDb) args.push('--allow-local-db');
        if (typeof options.requireCloudDb === 'boolean') {
          args.push(options.requireCloudDb ? '--require-cloud-db' : '--no-require-cloud-db');
        }
        if (options.databaseUrl) args.push('--database-url', options.databaseUrl);
        await runCommand('node', args);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

program
  .command('doctor')
  .description('Run TNF diagnostics')
  .option('--mode <mode>', 'Execution mode: cloud (default) or local')
  .option('--allow-local-db', 'Allow local DATABASE_URL for this run')
  .option('--require-cloud-db', 'Require cloud DATABASE_URL for this run')
  .option('--no-require-cloud-db', 'Allow non-cloud DATABASE_URL for this run')
  .option('--database-url <url>', 'Override DATABASE_URL for this run')
  .action(
    async (options: {
      mode?: string;
      allowLocalDb?: boolean;
      requireCloudDb?: boolean;
      databaseUrl?: string;
    }) => {
      try {
        const args = ['scripts/tnf-doctor.cjs'];
        if (options.mode) args.push('--mode', options.mode);
        if (options.allowLocalDb) args.push('--allow-local-db');
        if (typeof options.requireCloudDb === 'boolean') {
          args.push(options.requireCloudDb ? '--require-cloud-db' : '--no-require-cloud-db');
        }
        if (options.databaseUrl) args.push('--database-url', options.databaseUrl);
        await runCommand('node', args);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

const metaskills = program.command('metaskills').description('Meta-skills audit utilities');
metaskills
  .command('audit')
  .description('Audit meta-skills and scaffolding readiness')
  .option('--json', 'Print JSON output')
  .action(async (options: { json?: boolean }) => {
    try {
      const args = ['scripts/tnf-metaskills-audit.cjs'];
      if (options.json) args.push('--json');
      await runCommand('node', args);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const mcp = program.command('mcp').description('MCP utilities');
mcp
  .command('generate')
  .description('Generate MCP clients inventory')
  .action(async () => {
    try {
      await runCommand('node', ['scripts/tnf-generate-mcp-clients.cjs']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const ai = program.command('ai').description('AI launcher commands');
ai.command('start')
  .argument('[provider]', 'codex|claude|gemini', '')
  .description('Start an AI session helper')
  .action(async (provider: string) => {
    try {
      const args = ['scripts/tnf-start-ai.cjs'];
      if (provider) args.push(provider);
      await runCommand('node', args);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('openclaw')
  .description('Pass through any OpenClaw CLI command')
  .argument('[args...]', 'Arguments forwarded to openclaw');

program
  .command('claw')
  .description('Alias for `tnf openclaw`')
  .argument('[args...]', 'Arguments forwarded to openclaw');

const relay = program.command('relay').description('Relay operations');
relay
  .command('start')
  .description('Start relay-core relay service')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'relay start');
      await runCommand('pnpm', ['--filter', '@the-new-fuse/relay-core', 'run', 'relay']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

relay
  .command('monitor')
  .description('Monitor relay channels')
  .action(async () => {
    try {
      await runCommand('node', ['scripts/relay-channel-monitor.cjs']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const jules = program.command('jules').description('Jules automation operations');
jules
  .command('loop')
  .description('Run autonomous Jules loop')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'jules loop');
      await runCommand('bash', ['scripts/jules-autonomous-loop.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
jules
  .command('supervisor')
  .description('Run continuous Jules follow-up supervisor')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'jules supervisor');
      await runCommand('bash', ['scripts/jules-followup-supervisor.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
jules
  .command('supervisor-start')
  .description('Start Jules follow-up supervisor in background')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'jules supervisor-start');
      await runCommand('bash', ['scripts/jules-followup-start.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
jules
  .command('supervisor-stop')
  .description('Stop Jules follow-up supervisor')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'jules supervisor-stop');
      await runCommand('bash', ['scripts/jules-followup-stop.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
jules
  .command('supervisor-status')
  .description('Show Jules follow-up supervisor status')
  .action(async () => {
    try {
      await runCommand('bash', ['scripts/jules-followup-status.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
jules
  .command('supervisor-migrate-from-cron')
  .description('Disable cron follow-up and switch to supervisor mode')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'jules supervisor-migrate-from-cron');
      await runCommand('bash', ['scripts/jules-followup-migrate-from-cron.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
jules
  .command('merge-open')
  .description('Merge all open Jules PRs')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'jules merge-open');
      await runCommand('bash', ['scripts/jules-merge-open-prs.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
jules
  .command('cron-install')
  .description('Install local Jules cron loop')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'jules cron-install');
      await runCommand('bash', ['scripts/install-jules-cron.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const masterClock = program
  .command('master-clock')
  .description('Master clock controls (cloud-first)');
masterClock
  .command('start')
  .description('Start master-clock in cloud via Railway (default) or locally')
  .option('--local', 'Run local master-clock (override cloud-first policy)', false)
  .option('--service <name>', 'Railway service name for master clock', 'tnf-master-clock')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { local: boolean; service: string; superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'master-clock start');
      if (options.local) {
        await runCommand('pnpm', ['--filter', '@the-new-fuse/relay-core', 'run', 'master-clock']);
        return;
      }

      console.log(
        chalk.cyan(`☁️ Starting cloud master clock on Railway service ${options.service}`)
      );
      await runCommand('railway', ['up', '--service', options.service]);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

masterClock
  .command('logs')
  .description('Tail cloud master-clock logs')
  .option('--service <name>', 'Railway service name for master clock', 'tnf-master-clock')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { service: string; superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'master-clock logs');
      await runCommand('railway', ['logs', '--service', options.service]);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

masterClock
  .command('status')
  .description('Show Railway status for master-clock service')
  .option('--service <name>', 'Railway service name for master clock', 'tnf-master-clock')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { service: string; superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'master-clock status');
      await runCommand('railway', ['status', '--service', options.service]);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const superCycle = program.command('super-cycle').description('Super-cycle controls (cloud-first)');
superCycle
  .command('event')
  .description('Send super-cycle register/heartbeat/unregister event')
  .requiredOption('--action <action>', 'register|heartbeat|unregister')
  .requiredOption('--process-id <id>', 'Process identifier')
  .option('--name <name>', 'Process display name')
  .option('--status <status>', 'Process status', 'running')
  .option('--kind <kind>', 'Process kind', 'scheduled-job')
  .option('--owner <owner>', 'Process owner', 'tnf')
  .option('--result <result>', 'Last result')
  .option('--metadata <json>', 'JSON metadata', '{}')
  .option('--local', 'Run local super-cycle client (override cloud-first policy)', false)
  .option('--service <name>', 'Railway service name', 'tnf-master-clock')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(
    async (options: {
      action: string;
      processId: string;
      name?: string;
      status: string;
      kind: string;
      owner: string;
      result?: string;
      metadata: string;
      local: boolean;
      service: string;
      superAdminToken?: string;
    }) => {
      try {
        requireSuperAdmin(options, 'super-cycle event');
        const baseArgs = [
          '--filter',
          '@the-new-fuse/relay-core',
          'run',
          'super-cycle:event',
          '--',
          '--action',
          options.action,
          '--process-id',
          options.processId,
          '--status',
          options.status,
          '--kind',
          options.kind,
          '--owner',
          options.owner,
          '--metadata',
          options.metadata,
        ];
        if (options.name) baseArgs.push('--name', options.name);
        if (options.result) baseArgs.push('--result', options.result);

        if (options.local) {
          await runCommand('pnpm', baseArgs);
          return;
        }

        console.log(
          chalk.cyan(`☁️ Sending super-cycle event via cloud service ${options.service}`)
        );
        await runCommand('railway', ['run', '--service', options.service, 'pnpm', ...baseArgs]);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

const compat = program.command('compat').description('Compatibility and migration utilities');
const compatOpenClaw = compat
  .command('openclaw')
  .description('Show TNF to OpenClaw command-surface compatibility')
  .option('--json', 'Output machine-readable JSON')
  .option('--mode <mode>', 'all|implicit|explicit-only', 'all')
  .action((options: { json?: boolean; mode: string }) => {
    try {
      const report = buildOpenClawCompatibilityReport();
      const normalizedMode = (options.mode || 'all').trim().toLowerCase();
      if (!['all', 'implicit', 'explicit-only'].includes(normalizedMode)) {
        throw new Error("Invalid --mode value. Use 'all', 'implicit', or 'explicit-only'.");
      }

      const entries =
        normalizedMode === 'all'
          ? report.entries
          : report.entries.filter((entry) => entry.mode === normalizedMode);

      if (options.json) {
        console.log(
          JSON.stringify(
            {
              ...report,
              mode: normalizedMode,
              entries,
            },
            null,
            2
          )
        );
        return;
      }

      console.log(chalk.bold('\nOpenClaw Compatibility\n'));
      console.log(
        `   Total OpenClaw top-level commands: ${chalk.cyan(String(report.totalOpenClawTopLevelCommands))}`
      );
      console.log(`   Direct TNF paths: ${chalk.green(String(report.implicitCommands))}`);
      console.log(
        `   Explicit namespace only: ${chalk.yellow(String(report.explicitOnlyCommands))}`
      );
      console.log(`   View: ${chalk.cyan(normalizedMode)}\n`);

      for (const entry of entries) {
        const route =
          entry.mode === 'implicit'
            ? `${chalk.green(entry.directPath || '')} ${chalk.dim(`(also ${entry.explicitPath})`)}`
            : `${chalk.yellow(entry.explicitPath)} ${chalk.dim('(kept explicit to avoid TNF command collision)')}`;
        console.log(`   ${chalk.bold(entry.command.padEnd(18, ' '))} ${route}`);
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

compatOpenClaw
  .command('instances')
  .description('List OpenClaw installations and instances known to TNF')
  .option('--json', 'Output machine-readable JSON')
  .action(async (options: { json?: boolean }) => {
    try {
      const args = ['instances'];
      if (options.json) args.push('--json');
      await runOpenClawControl(args);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

compatOpenClaw
  .command('inventory')
  .description('Show redacted OpenClaw config and cron inventory')
  .option('--json', 'Output machine-readable JSON')
  .option('--installation <id>', 'Installation id')
  .option('--instance <id>', 'Instance/profile id')
  .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
  .option('--all-instances', 'Inspect every discovered instance')
  .action(
    async (options: {
      json?: boolean;
      installation?: string;
      instance?: string;
      stateDir?: string;
      allInstances?: boolean;
    }) => {
      try {
        const args = ['overview', ...buildOpenClawTargetArgs(options)];
        if (options.json) args.push('--json');
        await runOpenClawControl(args);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

compatOpenClaw
  .command('config')
  .description('Show redacted OpenClaw settings or a subtree')
  .option('--path <path>', 'Dot path within openclaw.json')
  .option('--json', 'Output machine-readable JSON')
  .option('--installation <id>', 'Installation id')
  .option('--instance <id>', 'Instance/profile id')
  .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
  .option('--all-instances', 'Read config across every discovered instance')
  .action(
    async (options: {
      path?: string;
      json?: boolean;
      installation?: string;
      instance?: string;
      stateDir?: string;
      allInstances?: boolean;
    }) => {
      try {
        const args = ['config-show', ...buildOpenClawTargetArgs(options)];
        if (options.path) args.push('--path', options.path);
        if (options.json) args.push('--json');
        await runOpenClawControl(args);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

compatOpenClaw
  .command('config-set')
  .description('Set an OpenClaw config value through TNF')
  .argument('<path>', 'Dot path within openclaw.json')
  .argument('<value>', 'Value to set')
  .option('--type <type>', 'string|number|boolean|json|null', 'string')
  .option('--installation <id>', 'Installation id')
  .option('--instance <id>', 'Instance/profile id')
  .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
  .action(
    async (
      targetPath: string,
      value: string,
      options: { type: string; installation?: string; instance?: string; stateDir?: string }
    ) => {
      try {
        await runOpenClawControl([
          'config-set',
          targetPath,
          value,
          '--type',
          options.type,
          ...buildOpenClawTargetArgs(options),
        ]);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

compatOpenClaw
  .command('config-unset')
  .description('Unset an OpenClaw config path through TNF')
  .argument('<path>', 'Dot path within openclaw.json')
  .option('--installation <id>', 'Installation id')
  .option('--instance <id>', 'Instance/profile id')
  .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
  .action(
    async (
      targetPath: string,
      options: { installation?: string; instance?: string; stateDir?: string }
    ) => {
      try {
        await runOpenClawControl(['config-unset', targetPath, ...buildOpenClawTargetArgs(options)]);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

compatOpenClaw
  .command('cron')
  .description('List OpenClaw cron jobs with TNF schedule mapping')
  .option('--json', 'Output machine-readable JSON')
  .option('--installation <id>', 'Installation id')
  .option('--instance <id>', 'Instance/profile id')
  .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
  .option('--all-instances', 'List cron jobs across every discovered instance')
  .action(
    async (options: {
      json?: boolean;
      installation?: string;
      instance?: string;
      stateDir?: string;
      allInstances?: boolean;
    }) => {
      try {
        const args = ['cron-list', ...buildOpenClawTargetArgs(options)];
        if (options.json) args.push('--json');
        await runOpenClawControl(args);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

compatOpenClaw
  .command('cron-enable')
  .description('Enable an OpenClaw cron job through TNF')
  .argument('<job>', 'Job id or name')
  .option('--installation <id>', 'Installation id')
  .option('--instance <id>', 'Instance/profile id')
  .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
  .action(
    async (
      job: string,
      options: { installation?: string; instance?: string; stateDir?: string }
    ) => {
      try {
        await runOpenClawControl(['cron-enable', job, ...buildOpenClawTargetArgs(options)]);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

compatOpenClaw
  .command('cron-disable')
  .description('Disable an OpenClaw cron job through TNF')
  .argument('<job>', 'Job id or name')
  .option('--installation <id>', 'Installation id')
  .option('--instance <id>', 'Instance/profile id')
  .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
  .action(
    async (
      job: string,
      options: { installation?: string; instance?: string; stateDir?: string }
    ) => {
      try {
        await runOpenClawControl(['cron-disable', job, ...buildOpenClawTargetArgs(options)]);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

compatOpenClaw
  .command('sync')
  .description('Sync live OpenClaw runtime state into TNF control-plane records')
  .option('--installation <id>', 'Installation id')
  .option('--instance <id>', 'Instance/profile id')
  .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
  .option('--all-instances', 'Sync every discovered instance')
  .action(
    async (options: {
      installation?: string;
      instance?: string;
      stateDir?: string;
      allInstances?: boolean;
    }) => {
      try {
        const targetArgs = buildOpenClawTargetArgs({
          ...options,
          allInstances: options.allInstances ?? true,
        });
        await runOpenClawControl(['sync-control-plane', '--actor', 'tnf-cli', ...targetArgs]);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

compatOpenClaw
  .command('cleanup')
  .description('Clean duplicate and failing TNF-managed OpenClaw cron jobs')
  .option('--disable-failing', 'Disable TNF-managed jobs currently in error state')
  .option('--dry-run', 'Compute cleanup result without writing OpenClaw cron files')
  .option(
    '--keep-launch-validation-duplicates',
    'Do not prune duplicate TNF Launch Validation one-shot jobs'
  )
  .option('--installation <id>', 'Installation id')
  .option('--instance <id>', 'Instance/profile id')
  .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
  .option('--all-instances', 'Apply cleanup to every discovered instance')
  .action(
    async (options: {
      disableFailing?: boolean;
      dryRun?: boolean;
      keepLaunchValidationDuplicates?: boolean;
      installation?: string;
      instance?: string;
      stateDir?: string;
      allInstances?: boolean;
    }) => {
      try {
        const args = ['cleanup-cron', '--actor', 'tnf-cli', ...buildOpenClawTargetArgs(options)];
        if (options.disableFailing) args.push('--disable-failing');
        if (options.dryRun) args.push('--dry-run');
        if (options.keepLaunchValidationDuplicates) {
          args.push('--keep-launch-validation-duplicates');
        }
        await runOpenClawControl(args);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

compatOpenClaw
  .command('cron-schedule')
  .description('Change an OpenClaw cron job schedule through TNF')
  .argument('<job>', 'Job id or name')
  .option('--cron <expr>', 'Cron expression')
  .option('--tz <tz>', 'Timezone for cron expressions')
  .option('--stagger-ms <ms>', 'Optional stagger milliseconds')
  .option('--every-ms <ms>', 'Repeat interval in milliseconds')
  .option('--anchor-ms <ms>', 'Anchor time in milliseconds for every schedules')
  .option('--at <iso>', 'One-shot ISO timestamp')
  .option('--installation <id>', 'Installation id')
  .option('--instance <id>', 'Instance/profile id')
  .option('--state-dir <path>', 'Ad hoc OpenClaw state directory')
  .action(
    async (
      job: string,
      options: {
        cron?: string;
        tz?: string;
        staggerMs?: string;
        everyMs?: string;
        anchorMs?: string;
        at?: string;
        installation?: string;
        instance?: string;
        stateDir?: string;
      }
    ) => {
      try {
        const args = ['cron-schedule', job];
        if (options.cron) args.push('--cron', options.cron);
        if (options.tz) args.push('--tz', options.tz);
        if (options.staggerMs) args.push('--stagger-ms', options.staggerMs);
        if (options.everyMs) args.push('--every-ms', options.everyMs);
        if (options.anchorMs) args.push('--anchor-ms', options.anchorMs);
        if (options.at) args.push('--at', options.at);
        args.push(...buildOpenClawTargetArgs(options));
        await runOpenClawControl(args);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

const skills = program.command('skills').description('Skill bank operations');
const skillsBank = skills.command('bank').description('Cross-LLM skill bank operations');
skillsBank
  .command('sync')
  .description('Build/refresh cross-LLM skill bank index and snapshots')
  .action(async () => {
    try {
      await runCommand('node', ['scripts/skills/skill-bank-sync.cjs']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
skillsBank
  .command('query')
  .description('Search skill bank index')
  .argument('<query>', 'Search query')
  .action(async (query: string) => {
    try {
      await runCommand('node', ['scripts/skills/skill-bank-query.cjs', query]);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
skillsBank
  .command('ingest')
  .description('Ingest skill-bank export rows into resource registry API')
  .option('--strict', 'Exit non-zero if any records fail')
  .option('--dry-run', 'Validate ingest payload without posting')
  .action(async (options: { strict?: boolean; dryRun?: boolean }) => {
    try {
      const args = ['scripts/skills/skill-bank-ingest.cjs'];
      if (options.strict) args.push('--strict');
      if (options.dryRun) args.push('--dry-run');
      await runCommand('node', args);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
skillsBank
  .command('retry-pending')
  .description('Retry pending failed skill-bank ingests')
  .option('--strict', 'Exit non-zero if any records still fail')
  .action(async (options: { strict?: boolean }) => {
    try {
      const args = ['scripts/skills/skill-bank-retry-pending.cjs'];
      if (options.strict) args.push('--strict');
      await runCommand('node', args);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
skillsBank
  .command('supervisor')
  .description('Run continuous skill-bank sync/ingest/retry supervisor')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'skills bank supervisor');
      await runCommand('bash', ['scripts/skills/skill-bank-supervisor.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
skillsBank
  .command('supervisor-start')
  .description('Start skill-bank supervisor in background')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'skills bank supervisor-start');
      await runCommand('bash', ['scripts/skills/skill-bank-supervisor-start.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
skillsBank
  .command('supervisor-stop')
  .description('Stop skill-bank supervisor')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'skills bank supervisor-stop');
      await runCommand('bash', ['scripts/skills/skill-bank-supervisor-stop.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
skillsBank
  .command('supervisor-status')
  .description('Show skill-bank supervisor status')
  .action(async () => {
    try {
      await runCommand('bash', ['scripts/skills/skill-bank-supervisor-status.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

superCycle
  .command('status')
  .description('Read super-cycle state snapshot')
  .option('--local', 'Read from local Redis via local client', false)
  .option('--service <name>', 'Railway service name', 'tnf-master-clock')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (options: { local: boolean; service: string; superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'super-cycle status');
      if (options.local) {
        await runCommand('pnpm', [
          '--filter',
          '@the-new-fuse/relay-core',
          'run',
          'super-cycle:status',
        ]);
        return;
      }
      await runCommand('railway', [
        'run',
        '--service',
        options.service,
        'pnpm',
        '--filter',
        '@the-new-fuse/relay-core',
        'run',
        'super-cycle:status',
      ]);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('run')
  .description('Execute any root package script through unified TNF CLI')
  .argument('<script>', 'Root package.json script name')
  .argument('[args...]', 'Arguments to forward')
  .option('--super-admin-token <token>', 'Super Admin authentication token')
  .action(async (script: string, args: string[], options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'run');
      const cmdArgs = ['run', script];
      if (args.length > 0) cmdArgs.push('--', ...args);
      await runCommand('pnpm', cmdArgs);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const scriptsCommand = program
  .command('scripts')
  .description('Discover and run repo scripts and root package scripts');

scriptsCommand
  .command('list')
  .description('List runnable scripts from package.json, scripts/**, tools/**, and repo root')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const rootScripts = loadRootScripts();
      const fileScripts = discoverFileScripts();
      if (options.json) {
        console.log(
          JSON.stringify(
            {
              rootScripts,
              fileScripts: fileScripts.map((s) => s.relPath),
            },
            null,
            2
          )
        );
        return;
      }

      console.log(chalk.bold('\nRoot package scripts:\n'));
      for (const script of rootScripts) {
        console.log(`- ${chalk.cyan(script.name)}: ${chalk.dim(script.command)}`);
      }

      console.log(chalk.bold('\nRunnable files (scripts/**, tools/**, repo root):\n'));
      for (const script of fileScripts) {
        console.log(`- ${chalk.green(script.relPath)}`);
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

scriptsCommand
  .command('run')
  .description('Run either a root package script or a runnable file path')
  .argument(
    '<target>',
    'Root script name OR runnable file path (scripts/**, tools/**, or repo root)'
  )
  .argument('[args...]', 'Arguments to forward')
  .action(async (target: string, args: string[]) => {
    try {
      const rootScripts = loadRootScripts();
      const rootMatch = rootScripts.find((s) => s.name === target);
      if (rootMatch) {
        const cmdArgs = ['run', target];
        if (args.length > 0) cmdArgs.push('--', ...args);
        await runCommand('pnpm', cmdArgs);
        return;
      }

      const fileScript = resolveFileScript(target);
      if (fileScript) {
        await runFileScript(fileScript, args);
        return;
      }

      throw new Error(
        `Unknown target '${target}'. Use 'tnf scripts list' to see available scripts.`
      );
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const voiceBridgeCommand = program
  .command('voice')
  .description('Voice Bridge commands (listen, anchor target, and response audio)');

function appendVoiceProfileArg(args: string[], profile?: string): string[] {
  if (!profile) return args;
  return [...args, '--profile', normalizeVoiceProfile(profile)];
}

voiceBridgeCommand
  .command('up')
  .description('Start profile-scoped Voice Bridge background runtime')
  .option('--profile <name>', 'Voice Bridge profile (default: main)')
  .option('--with-listen', 'Also start listen sidecar in background')
  .option('--port <number>', 'Voice Bridge port override')
  .option('--open', 'Open Voice Bridge browser UI')
  .option('--json', 'Output machine-readable JSON')
  .action(
    async (
      options: {
        profile?: string;
        withListen?: boolean;
        port?: string;
        open?: boolean;
        json?: boolean;
      } = {}
    ) => {
      try {
        const profile = normalizeVoiceProfile(options.profile);
        const port = inferVoiceBridgePort(profile, options.port);

        const existing = findVoiceProfilePids(profile);
        const preStop = existing.length > 0 ? await terminatePids(existing) : null;

        const sharedEnv: NodeJS.ProcessEnv = {
          ...process.env,
          VOICEBRIDGE_PROFILE: profile,
          VOICEBRIDGE_PORT: String(port),
        };

        const voiceArgs = ['--profile', profile];
        if (options.port) voiceArgs.push('--port', options.port);
        if (!options.open) voiceArgs.push('--no-open');
        const voicePid = spawnDetachedVoiceCommand('voice', voiceArgs, sharedEnv);

        let listenPid: number | undefined;
        if (options.withListen) {
          listenPid = spawnDetachedVoiceCommand('listen', ['--profile', profile], {
            ...sharedEnv,
            LISTEN_DELIVERY_MODE: process.env.LISTEN_DELIVERY_MODE || 'auto',
          });
        }

        writeVoiceSession({
          profile,
          port,
          voicePid,
          listenPid,
          startedAt: new Date().toISOString(),
        });

        const serverReady = await waitForVoiceServer(port, 12000);
        const payload = {
          ok: true,
          profile,
          port,
          serverReady,
          voicePid,
          listenPid: listenPid ?? null,
          preStoppedPids: preStop?.stopped ?? [],
        };

        if (options.json) {
          console.log(JSON.stringify(payload, null, 2));
          return;
        }

        console.log(chalk.green(`✅ Voice Bridge up for profile '${profile}'`));
        console.log(`Port: ${chalk.cyan(String(port))}`);
        console.log(`Voice PID: ${chalk.cyan(String(voicePid))}`);
        if (typeof listenPid === 'number') {
          console.log(`Listen PID: ${chalk.cyan(String(listenPid))}`);
        }
        if (preStop && preStop.stopped.length > 0) {
          console.log(
            chalk.dim(`Stopped existing profile processes: ${preStop.stopped.join(', ')}`)
          );
        }
        if (serverReady) {
          console.log(chalk.green(`Server reachable at http://127.0.0.1:${port}`));
        } else {
          console.log(
            chalk.yellow(
              `Server not reachable yet on 127.0.0.1:${port} (startup still warming or failed).`
            )
          );
        }
        console.log(
          chalk.dim(`Use 'tnf voice down --profile ${profile}' to stop this profile runtime.`)
        );
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

voiceBridgeCommand
  .command('down')
  .description('Stop profile-scoped Voice Bridge background runtime')
  .option('--profile <name>', 'Voice Bridge profile (default: main)')
  .option('--json', 'Output machine-readable JSON')
  .action(async (options: { profile?: string; json?: boolean } = {}) => {
    try {
      const profile = normalizeVoiceProfile(options.profile);
      const session = readVoiceSession(profile);
      const pids = new Set<number>();

      if (session?.voicePid) pids.add(session.voicePid);
      if (session?.listenPid) pids.add(session.listenPid);
      for (const pid of findVoiceProfilePids(profile)) pids.add(pid);

      const result = await terminatePids(Array.from(pids));
      removeVoiceSession(profile);

      const payload = {
        ok: true,
        profile,
        requestedPids: Array.from(pids),
        stoppedPids: result.stopped,
        notFoundPids: result.notFound,
        forceKilledPids: result.forceKilled,
      };

      if (options.json) {
        console.log(JSON.stringify(payload, null, 2));
        return;
      }

      console.log(chalk.green(`✅ Voice Bridge down for profile '${profile}'`));
      if (result.stopped.length > 0) {
        console.log(`Stopped: ${chalk.cyan(result.stopped.join(', '))}`);
      } else {
        console.log(chalk.dim('No live profile processes were found.'));
      }
      if (result.forceKilled.length > 0) {
        console.log(chalk.yellow(`Force-killed: ${result.forceKilled.join(', ')}`));
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

voiceBridgeCommand
  .command('relay')
  .description('Relay transcribed input between Voice Bridge profiles')
  .requiredOption('--from <profile>', 'Source profile')
  .requiredOption('--to <profile>', 'Target profile')
  .option('--bidirectional', 'Enable reverse relay path (to -> from)')
  .option('--require-live', 'Fail fast if either relay endpoint is down at startup')
  .option('--keep-main', 'Do not auto-stop stray main profile runtime during non-main relay')
  .option('--from-port <number>', 'Source profile port override')
  .option('--to-port <number>', 'Target profile port override')
  .option('--interval-ms <number>', 'Poll interval in ms', '200')
  .option('--ack-window-ms <number>', 'ACK guard window in ms', '15000')
  .option('--dedupe-window-ms <number>', 'Route dedupe window in ms', '8000')
  .option(
    '--heartbeat-ms <number>',
    'Heartbeat poll + auto-heal interval in ms (0 disables)',
    '5000'
  )
  .option('--heartbeat-log-ms <number>', 'Heartbeat status log cadence in ms', '15000')
  .option('--no-heartbeat-heal', 'Disable heartbeat /activate auto-heal calls')
  .action(
    async (
      options: {
        from: string;
        to: string;
        bidirectional?: boolean;
        requireLive?: boolean;
        keepMain?: boolean;
        fromPort?: string;
        toPort?: string;
        intervalMs?: string;
        ackWindowMs?: string;
        dedupeWindowMs?: string;
        heartbeatMs?: string;
        heartbeatLogMs?: string;
        heartbeatHeal?: boolean;
      } = {} as {
        from: string;
        to: string;
        bidirectional?: boolean;
        requireLive?: boolean;
        keepMain?: boolean;
        fromPort?: string;
        toPort?: string;
        intervalMs?: string;
        ackWindowMs?: string;
        dedupeWindowMs?: string;
        heartbeatMs?: string;
        heartbeatLogMs?: string;
        heartbeatHeal?: boolean;
      }
    ) => {
      const parsePositiveInt = (
        value: string | undefined,
        fallback: number,
        label: string
      ): number => {
        if (typeof value === 'undefined') return fallback;
        const parsed = Number.parseInt(value, 10);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          throw new Error(`Invalid ${label}: ${value}`);
        }
        return parsed;
      };
      const parseNonNegativeInt = (
        value: string | undefined,
        fallback: number,
        label: string
      ): number => {
        if (typeof value === 'undefined') return fallback;
        const parsed = Number.parseInt(value, 10);
        if (!Number.isFinite(parsed) || parsed < 0) {
          throw new Error(`Invalid ${label}: ${value}`);
        }
        return parsed;
      };

      try {
        const fromProfile = normalizeVoiceProfile(options.from);
        const toProfile = normalizeVoiceProfile(options.to);
        if (fromProfile === toProfile) {
          throw new Error('--from and --to must be different profiles');
        }

        const intervalMs = parsePositiveInt(options.intervalMs, 200, '--interval-ms');
        const ackWindowMs = parsePositiveInt(options.ackWindowMs, 15000, '--ack-window-ms');
        const dedupeWindowMs = parsePositiveInt(options.dedupeWindowMs, 8000, '--dedupe-window-ms');
        const heartbeatMs = parseNonNegativeInt(options.heartbeatMs, 5000, '--heartbeat-ms');
        const heartbeatLogMs = parsePositiveInt(
          options.heartbeatLogMs,
          15000,
          '--heartbeat-log-ms'
        );
        const heartbeatHeal = options.heartbeatHeal !== false;
        const fromPort = inferVoiceBridgePort(fromProfile, options.fromPort);
        const toPort = inferVoiceBridgePort(toProfile, options.toPort);

        const mainInterferencePids = findMainProfileInterferencePids([fromProfile, toProfile]);
        if (mainInterferencePids.length > 0) {
          if (options.keepMain) {
            console.log(
              chalk.yellow(
                `⚠️ main-profile runtime still active (${mainInterferencePids.join(
                  ', '
                )}); overlap risk remains because --keep-main was set.`
              )
            );
          } else {
            const stoppedMain = await terminatePids(mainInterferencePids);
            removeVoiceSession('main');
            const stoppedList =
              stoppedMain.stopped.length > 0 ? stoppedMain.stopped.join(', ') : 'none';
            console.log(
              chalk.yellow(
                `Isolated relay pair by stopping main-profile runtime pids: ${stoppedList}`
              )
            );
          }
        }

        type RelayRuntimeDirection = RelayDirectionState & {
          lastSignalTs: number;
          lastSignalHash: string;
        };

        const directions: RelayRuntimeDirection[] = [
          {
            ...relayDirection(fromProfile, toProfile, fromPort, toPort),
            lastSignalTs: 0,
            lastSignalHash: '',
          },
        ];
        if (options.bidirectional) {
          directions.push({
            ...relayDirection(toProfile, fromProfile, toPort, fromPort),
            lastSignalTs: 0,
            lastSignalHash: '',
          });
        }

        const pendingByTarget = new Map<string, Map<string, RelayPendingDelivery>>();
        const recentRouteHashes = new Map<string, number>();
        const ackedMsgIds = new Set<string>();
        const endpointByProfile = new Map<string, number>([
          [fromProfile, fromPort],
          [toProfile, toPort],
        ]);
        const heartbeatMisses = new Map<string, number>();
        heartbeatMisses.set(fromProfile, 0);
        heartbeatMisses.set(toProfile, 0);
        let lastHeartbeatAt = 0;
        let lastHeartbeatLogAt = 0;

        const getPendingMap = (profile: string): Map<string, RelayPendingDelivery> => {
          const normalized = normalizeVoiceProfile(profile);
          if (!pendingByTarget.has(normalized)) {
            pendingByTarget.set(normalized, new Map<string, RelayPendingDelivery>());
          }
          return pendingByTarget.get(normalized)!;
        };

        const nowMs = () => Date.now();

        const cleanupAgingState = () => {
          const now = nowMs();
          for (const [, deliveries] of pendingByTarget) {
            for (const [hash, delivery] of deliveries) {
              if (now - delivery.at > ackWindowMs) deliveries.delete(hash);
            }
          }
          for (const [key, at] of recentRouteHashes) {
            if (now - at > dedupeWindowMs) recentRouteHashes.delete(key);
          }
        };

        const fromReady = await waitForVoiceServer(fromPort, 1000);
        const toReady = await waitForVoiceServer(toPort, 1000);
        if (options.requireLive && (!fromReady || !toReady)) {
          const down: string[] = [];
          if (!fromReady) down.push(`${fromProfile}:${fromPort}`);
          if (!toReady) down.push(`${toProfile}:${toPort}`);
          throw new Error(
            `Relay endpoints not live at startup: ${down.join(', ')}. Start runtimes with 'tnf voice up --profile <name>' first, or rerun relay without --require-live to wait.`
          );
        }
        console.log(chalk.bold('\nVoice Relay'));
        console.log(
          `Path: ${chalk.cyan(fromProfile)}:${fromPort} -> ${chalk.cyan(toProfile)}:${toPort}`
        );
        console.log(
          `Bidirectional: ${options.bidirectional ? chalk.green('ON') : chalk.yellow('OFF')}`
        );
        console.log(`Source signal: /tmp/voice_last_user_input_* (profile-scoped)`);
        console.log(
          `Endpoints: from=${fromReady ? chalk.green('UP') : chalk.yellow('DOWN')} | to=${
            toReady ? chalk.green('UP') : chalk.yellow('DOWN')
          }`
        );
        console.log(chalk.dim('Loop guards active: msg_id + ACK + hash dedupe'));
        console.log(
          chalk.dim(
            `Heartbeat: ${
              heartbeatMs > 0
                ? `${heartbeatMs}ms (${heartbeatHeal ? '/activate auto-heal ON' : '/activate auto-heal OFF'})`
                : 'OFF'
            }`
          )
        );
        console.log(chalk.dim('Press Ctrl+C to stop relay.\n'));

        let running = true;
        const handleSignal = (signal: NodeJS.Signals) => {
          if (!running) return;
          running = false;
          console.log(chalk.yellow(`\nReceived ${signal}. Stopping relay...`));
        };
        process.once('SIGINT', handleSignal);
        process.once('SIGTERM', handleSignal);

        while (running) {
          cleanupAgingState();
          const now = nowMs();

          if (heartbeatMs > 0 && now - lastHeartbeatAt >= heartbeatMs) {
            lastHeartbeatAt = now;
            const up: string[] = [];
            const down: string[] = [];
            const healed: string[] = [];
            const healFailed: string[] = [];

            for (const [profile, port] of endpointByProfile.entries()) {
              const live = await waitForVoiceServer(port, 450);
              if (live) {
                heartbeatMisses.set(profile, 0);
                up.push(`${profile}:${port}`);
              } else {
                const misses = (heartbeatMisses.get(profile) || 0) + 1;
                heartbeatMisses.set(profile, misses);
                down.push(`${profile}:${port}#${misses}`);
              }

              if (heartbeatHeal) {
                const activateResult = postVoiceActivate(port);
                if (activateResult.ok) {
                  healed.push(profile);
                } else {
                  healFailed.push(profile);
                }
              }
            }

            const shouldLogHeartbeat =
              down.length > 0 || now - lastHeartbeatLogAt >= Math.max(heartbeatLogMs, heartbeatMs);
            if (shouldLogHeartbeat) {
              lastHeartbeatLogAt = now;
              const statusChunk =
                down.length > 0
                  ? chalk.yellow(`down=[${down.join(', ')}]`)
                  : chalk.green(`up=[${up.join(', ')}]`);
              const healChunk = heartbeatHeal
                ? ` heal=${healFailed.length > 0 ? `partial(ok:${healed.join(',') || '-'} fail:${healFailed.join(',')})` : `ok(${healed.join(',') || '-'})`}`
                : '';
              console.log(
                chalk.dim(`HB ${new Date(now).toISOString()} ${statusChunk}${healChunk}`)
              );
            }
          }

          for (const direction of directions) {
            const input = readVoiceProfileLastInput(direction.fromProfile);
            if (!input) continue;
            if (input.ts <= direction.lastSignalTs) continue;
            direction.lastSignalTs = input.ts;

            // Guard against repeated identical source signals at same timestamp cadence.
            if (direction.lastSignalHash === input.hash) {
              continue;
            }
            direction.lastSignalHash = input.hash;

            // ACK guard: if this hash was recently delivered into this source profile,
            // treat the observed signal as acknowledgment and do not forward.
            const pendingForSource = getPendingMap(direction.fromProfile);
            const ackCandidate = pendingForSource.get(input.hash);
            if (ackCandidate && now - ackCandidate.at <= ackWindowMs) {
              if (!ackedMsgIds.has(ackCandidate.msgId)) {
                ackedMsgIds.add(ackCandidate.msgId);
                direction.acked += 1;
                console.log(
                  chalk.dim(
                    `ACK ${ackCandidate.msgId} (${direction.fromProfile} observed relay-return hash)`
                  )
                );
              }
              pendingForSource.delete(input.hash);
              continue;
            }

            const routeKey = `${direction.id}:${input.hash}`;
            const recentForwardAt = recentRouteHashes.get(routeKey) || 0;
            if (recentForwardAt && now - recentForwardAt <= dedupeWindowMs) {
              direction.skippedEcho += 1;
              continue;
            }

            const pendingForTarget = getPendingMap(direction.toProfile);
            const pendingEcho = pendingForTarget.get(input.hash);
            if (pendingEcho && now - pendingEcho.at <= dedupeWindowMs) {
              direction.skippedEcho += 1;
              continue;
            }

            if (isRelayControlSignal(input.text)) {
              direction.skippedControl += 1;
              continue;
            }

            const msgId = `${direction.fromProfile}_${direction.toProfile}_${now.toString(36)}_${input.hash.slice(0, 8)}`;
            const sendResult = postVoiceSend(direction.toPort, input.text);
            if (!sendResult.ok) {
              direction.sendFailed += 1;
              console.log(
                chalk.yellow(
                  `SEND_FAIL ${msgId} ${direction.id} (${sendResult.error || 'unknown send error'})`
                )
              );
              continue;
            }

            direction.forwarded += 1;
            recentRouteHashes.set(routeKey, now);
            pendingForTarget.set(input.hash, {
              msgId,
              hash: input.hash,
              fromProfile: direction.fromProfile,
              toProfile: direction.toProfile,
              at: now,
            });

            console.log(chalk.green(`FWD ${msgId} ${direction.id} :: ${input.text}`));
          }

          await sleep(intervalMs);
        }

        process.removeListener('SIGINT', handleSignal);
        process.removeListener('SIGTERM', handleSignal);

        const summary = directions.map((d) => ({
          path: d.id,
          forwarded: d.forwarded,
          acked: d.acked,
          skippedEcho: d.skippedEcho,
          skippedControl: d.skippedControl,
          sendFailed: d.sendFailed,
        }));
        console.log(chalk.bold('\nRelay summary'));
        for (const item of summary) {
          console.log(
            `${chalk.cyan(item.path)} forwarded=${item.forwarded} acked=${item.acked} ` +
              `skippedEcho=${item.skippedEcho} skippedControl=${item.skippedControl} sendFailed=${item.sendFailed}`
          );
        }
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

voiceBridgeCommand
  .command('start')
  .description('Start Voice Bridge server + injection bridge (wrapper around `voice`)')
  .option('--profile <name>', 'Voice Bridge profile (default: main)')
  .option('--port <number>', 'Voice Bridge port override')
  .option('--no-open', 'Do not open Voice Bridge browser UI')
  .argument('[args...]', 'Arguments forwarded to voice command')
  .action(
    async (
      args: string[] = [],
      options: { profile?: string; port?: string; open?: boolean } = {}
    ) => {
      try {
        let forwarded = [...args];
        if (options.profile) forwarded = appendVoiceProfileArg(forwarded, options.profile);
        if (options.port) forwarded.push('--port', options.port);
        if (options.open === false) forwarded.push('--no-open');
        await runVoiceBridgeCommand('voice', forwarded);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

voiceBridgeCommand
  .command('listen')
  .description('Start microphone transcription loop (wrapper around `listen`)')
  .option('--profile <name>', 'Voice Bridge profile (default: main)')
  .argument('[args...]', 'Arguments forwarded to listen command')
  .action(async (args: string[] = [], options: { profile?: string } = {}) => {
    try {
      let forwarded = [...args];
      if (options.profile) forwarded = appendVoiceProfileArg(forwarded, options.profile);
      await runVoiceBridgeCommand('listen', forwarded);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

voiceBridgeCommand
  .command('activate')
  .description('Call local Voice Bridge /activate to auto-heal watcher daemons')
  .option('--profile <name>', 'Voice Bridge profile (default: main)')
  .option('--port <number>', 'Voice Bridge API port override')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { profile?: string; port?: string; json?: boolean }) => {
    try {
      const port = inferVoiceBridgePort(options.profile, options.port);
      const payload = readVoiceBridgeJson('/activate', 'POST', port) as Record<string, unknown>;
      const started = Array.isArray(payload.started) ? payload.started.map(String) : [];
      if (options.json) {
        console.log(
          JSON.stringify(
            { ok: true, profile: normalizeVoiceProfile(options.profile), port, started },
            null,
            2
          )
        );
        return;
      }
      if (started.length === 0) {
        console.log(chalk.green('✅ Voice Bridge activate succeeded (nothing needed to start).'));
      } else {
        console.log(
          chalk.green(`✅ Voice Bridge activate succeeded. Started: ${started.join(', ')}`)
        );
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

voiceBridgeCommand
  .command('status')
  .description('Show local Voice Bridge server + command availability')
  .option('--profile <name>', 'Voice Bridge profile (default: main)')
  .option('--port <number>', 'Voice Bridge API port override')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { profile?: string; port?: string; json?: boolean }) => {
    try {
      const profile = normalizeVoiceProfile(options.profile);
      const port = inferVoiceBridgePort(profile, options.port);
      const knownCommands = [
        'voice',
        'listen',
        'voice-target-here',
        'voice-target-pick',
        'voice-target-show',
        'voice-target-clear',
        'voice-mic-toggle',
        'voice-response-audio-toggle',
      ];

      const commandStatus = knownCommands.map((name) => {
        try {
          return { name, available: true, path: resolveVoiceBridgeCommand(name) };
        } catch {
          return { name, available: false, path: null };
        }
      });

      const healthProbe = spawnSync('curl', ['-fsS', `http://127.0.0.1:${port}/`], {
        encoding: 'utf8',
        env: process.env,
      });
      const serverReachable = healthProbe.status === 0;

      let micState: Record<string, unknown> | null = null;
      let kwsState: Record<string, unknown> | null = null;
      if (serverReachable) {
        micState = readVoiceBridgeJson('/mic_state', 'GET', port) as Record<string, unknown>;
        kwsState = readVoiceBridgeJson('/kws_state', 'GET', port) as Record<string, unknown>;
      }

      const payload = {
        profile,
        port,
        serverReachable,
        micState,
        kwsState,
        commands: commandStatus,
      };

      if (options.json) {
        console.log(JSON.stringify(payload, null, 2));
        return;
      }

      console.log(chalk.bold('\nVoice Bridge status\n'));
      console.log(`Profile: ${chalk.cyan(profile)} | Port: ${chalk.cyan(String(port))}`);
      console.log(
        `Server: ${serverReachable ? chalk.green('UP') : chalk.red('DOWN')} (127.0.0.1:${port})`
      );
      if (serverReachable) {
        const paused = micState?.paused === true;
        const kwsEnabled = kwsState?.enabled === true;
        const ingestUrl = typeof kwsState?.ingest_url === 'string' ? kwsState.ingest_url : '';
        console.log(`Mic: ${paused ? chalk.yellow('PAUSED') : chalk.green('ACTIVE')}`);
        console.log(`Cloud forwarding: ${kwsEnabled ? chalk.green('ON') : chalk.yellow('OFF')}`);
        if (ingestUrl) {
          console.log(`Ingest URL: ${chalk.dim(ingestUrl)}`);
        }
      } else {
        console.log(
          chalk.dim(
            `Run \`tnf voice start --profile ${profile}\` to bring up Voice Bridge for this profile.`
          )
        );
      }

      console.log('\nCommands:');
      for (const command of commandStatus) {
        const status = command.available ? chalk.green('available') : chalk.red('missing');
        const details = command.path ? chalk.dim(command.path) : '';
        console.log(`- ${command.name}: ${status}${details ? ` (${details})` : ''}`);
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const voiceProtocolCommand = voiceBridgeCommand
  .command('protocol')
  .description('Observe and watch multi-profile voice cooperation protocol health');

voiceProtocolCommand
  .command('status')
  .description('Show current relay + watcher + signal health for a profile pair')
  .option('--from <profile>', 'Source profile (default: a)', 'a')
  .option('--to <profile>', 'Target profile (default: b)', 'b')
  .option('--from-port <number>', 'Source profile port override')
  .option('--to-port <number>', 'Target profile port override')
  .option('--json', 'Output machine-readable JSON')
  .action(
    async (
      options: {
        from?: string;
        to?: string;
        fromPort?: string;
        toPort?: string;
        json?: boolean;
      } = {}
    ) => {
      try {
        const fromProfile = normalizeVoiceProfile(options.from);
        const toProfile = normalizeVoiceProfile(options.to);
        if (fromProfile === toProfile) {
          throw new Error('--from and --to must be different profiles');
        }

        const fromPort = inferVoiceBridgePort(fromProfile, options.fromPort);
        const toPort = inferVoiceBridgePort(toProfile, options.toPort);

        const [fromSnapshot, toSnapshot] = await Promise.all([
          collectVoiceProtocolSnapshot(fromProfile, fromPort),
          collectVoiceProtocolSnapshot(toProfile, toPort),
        ]);
        const relayPids = findVoiceRelayPids(fromProfile, toProfile);
        const relayHeartbeat = readLastHeartbeatLine(fromProfile, toProfile);
        const relayLog = relayLogPath(fromProfile, toProfile);
        const mainInterferencePids = findMainProfileInterferencePids([fromProfile, toProfile]);

        const payload = {
          pair: {
            from: fromProfile,
            to: toProfile,
            fromPort,
            toPort,
          },
          relay: {
            running: relayPids.length > 0,
            pids: relayPids,
            logPath: relayLog,
            heartbeat: relayHeartbeat,
          },
          interference: {
            mainProfilePids: mainInterferencePids,
          },
          profiles: {
            [fromProfile]: fromSnapshot,
            [toProfile]: toSnapshot,
          },
        };

        if (options.json) {
          console.log(JSON.stringify(payload, null, 2));
          return;
        }

        console.log(chalk.bold('\nVoice Protocol Status\n'));
        console.log(
          `Pair: ${chalk.cyan(fromProfile)}:${fromPort} <-> ${chalk.cyan(toProfile)}:${toPort}`
        );
        console.log(
          `Relay: ${
            relayPids.length > 0
              ? chalk.green(`RUNNING (${relayPids.join(', ')})`)
              : chalk.yellow('NOT RUNNING')
          }`
        );
        if (relayHeartbeat) {
          console.log(
            `Heartbeat: ${chalk.dim(relayHeartbeat.line)} (age ${formatAgeMs(relayHeartbeat.ageMs)})`
          );
        } else {
          console.log(`Heartbeat: ${chalk.yellow('none observed yet')} (${chalk.dim(relayLog)})`);
        }
        if (mainInterferencePids.length > 0) {
          console.log(
            chalk.yellow(
              `Interference: main-profile runtime active (${mainInterferencePids.join(
                ', '
              )}). Run 'tnf voice down --profile main' to isolate this pair.`
            )
          );
        }

        const printProfile = (snapshot: VoiceProtocolSnapshot) => {
          const userAge = formatAgeMs(ageMsFromUnixTs(snapshot.lastUserInput?.ts ?? null));
          const outAge = formatAgeMs(ageMsFromUnixTs(snapshot.lastAssistantOutput?.ts ?? null));
          console.log(
            `\n[${snapshot.profile}] server=${snapshot.serverUp ? chalk.green('UP') : chalk.red('DOWN')} ` +
              `stream_watch=${snapshot.streamWatchPids.length} response_audio=${snapshot.responseAudioPids.length}`
          );
          console.log(
            `last_user_input: ${chalk.cyan(userAge)} ${
              snapshot.lastUserInput
                ? chalk.dim(clipProtocolText(snapshot.lastUserInput.text))
                : chalk.dim('n/a')
            }`
          );
          console.log(
            `last_assistant_output: ${chalk.cyan(outAge)} ${
              snapshot.lastAssistantOutput
                ? chalk.dim(clipProtocolText(snapshot.lastAssistantOutput.text))
                : chalk.dim('n/a')
            }`
          );
        };

        printProfile(fromSnapshot);
        printProfile(toSnapshot);
        console.log('');
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

voiceProtocolCommand
  .command('watch')
  .description('Continuously poll and report cooperation protocol health')
  .option('--from <profile>', 'Source profile (default: a)', 'a')
  .option('--to <profile>', 'Target profile (default: b)', 'b')
  .option('--from-port <number>', 'Source profile port override')
  .option('--to-port <number>', 'Target profile port override')
  .option('--interval-ms <number>', 'Polling interval in ms', '5000')
  .option('--no-heal', 'Disable /activate auto-heal pulse on each poll')
  .option('--once', 'Print one snapshot and exit')
  .option('--json', 'Emit one JSON object per poll line')
  .action(
    async (
      options: {
        from?: string;
        to?: string;
        fromPort?: string;
        toPort?: string;
        intervalMs?: string;
        heal?: boolean;
        once?: boolean;
        json?: boolean;
      } = {}
    ) => {
      const parsePositiveInt = (
        value: string | undefined,
        fallback: number,
        label: string
      ): number => {
        if (typeof value === 'undefined') return fallback;
        const parsed = Number.parseInt(value, 10);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          throw new Error(`Invalid ${label}: ${value}`);
        }
        return parsed;
      };

      try {
        const fromProfile = normalizeVoiceProfile(options.from);
        const toProfile = normalizeVoiceProfile(options.to);
        if (fromProfile === toProfile) {
          throw new Error('--from and --to must be different profiles');
        }
        const fromPort = inferVoiceBridgePort(fromProfile, options.fromPort);
        const toPort = inferVoiceBridgePort(toProfile, options.toPort);
        const intervalMs = parsePositiveInt(options.intervalMs, 5000, '--interval-ms');
        const heal = options.heal !== false;

        if (!options.json) {
          console.log(chalk.bold('\nVoice Protocol Watch'));
          console.log(
            `Pair: ${chalk.cyan(fromProfile)}:${fromPort} <-> ${chalk.cyan(toProfile)}:${toPort}`
          );
          console.log(`Poll interval: ${chalk.cyan(String(intervalMs))}ms`);
          console.log(`Auto-heal pulse: ${heal ? chalk.green('ON') : chalk.yellow('OFF')}`);
          console.log(chalk.dim('Press Ctrl+C to stop.\n'));
        }

        let running = true;
        const handleSignal = (signal: NodeJS.Signals) => {
          if (!running) return;
          running = false;
          if (!options.json) {
            console.log(chalk.yellow(`\nReceived ${signal}. Stopping protocol watch...`));
          }
        };
        process.once('SIGINT', handleSignal);
        process.once('SIGTERM', handleSignal);

        while (running) {
          const [fromSnapshot, toSnapshot] = await Promise.all([
            collectVoiceProtocolSnapshot(fromProfile, fromPort),
            collectVoiceProtocolSnapshot(toProfile, toPort),
          ]);

          const healResults: Array<{ profile: string; ok: boolean }> = [];
          if (heal) {
            for (const snapshot of [fromSnapshot, toSnapshot]) {
              if (!snapshot.serverUp) {
                healResults.push({ profile: snapshot.profile, ok: false });
                continue;
              }
              const result = postVoiceActivate(snapshot.port);
              healResults.push({ profile: snapshot.profile, ok: result.ok });
            }
          }

          const relayPids = findVoiceRelayPids(fromProfile, toProfile);
          const relayHeartbeat = readLastHeartbeatLine(fromProfile, toProfile);
          const mainInterferencePids = findMainProfileInterferencePids([fromProfile, toProfile]);
          const nowIso = new Date().toISOString();
          const linePayload = {
            now: nowIso,
            pair: {
              from: fromProfile,
              to: toProfile,
              fromPort,
              toPort,
            },
            relay: {
              running: relayPids.length > 0,
              pids: relayPids,
              heartbeat: relayHeartbeat,
            },
            interference: {
              mainProfilePids: mainInterferencePids,
            },
            heal: {
              enabled: heal,
              results: healResults,
            },
            profiles: {
              [fromProfile]: fromSnapshot,
              [toProfile]: toSnapshot,
            },
          };

          if (options.json) {
            console.log(JSON.stringify(linePayload));
          } else {
            const summarize = (snapshot: VoiceProtocolSnapshot) =>
              `${snapshot.profile}{srv:${snapshot.serverUp ? 'up' : 'down'} sw:${snapshot.streamWatchPids.length} ra:${snapshot.responseAudioPids.length}` +
              ` in:${formatAgeMs(ageMsFromUnixTs(snapshot.lastUserInput?.ts ?? null))}` +
              ` out:${formatAgeMs(ageMsFromUnixTs(snapshot.lastAssistantOutput?.ts ?? null))}}`;
            const hbAge = relayHeartbeat ? formatAgeMs(relayHeartbeat.ageMs) : 'n/a';
            const healSummary = heal
              ? ` heal=${healResults.map((r) => `${r.profile}:${r.ok ? 'ok' : 'fail'}`).join(',')}`
              : '';
            const interferenceSummary =
              mainInterferencePids.length > 0
                ? ` main=${chalk.yellow(`active(${mainInterferencePids.length})`)}`
                : ` main=${chalk.green('clear')}`;
            console.log(
              `${chalk.dim(nowIso)} relay:${relayPids.length > 0 ? chalk.green('up') : chalk.red('down')} ` +
                `hb:${chalk.cyan(hbAge)} ${summarize(fromSnapshot)} ${summarize(toSnapshot)}${interferenceSummary}${healSummary}`
            );
          }

          if (options.once) break;
          await sleep(intervalMs);
        }

        process.removeListener('SIGINT', handleSignal);
        process.removeListener('SIGTERM', handleSignal);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

const voiceTargetCommand = voiceBridgeCommand
  .command('target')
  .description('Manage destination anchor for transcribed text');

voiceTargetCommand
  .command('here')
  .description('Anchor transcription destination to current terminal tab')
  .option('--profile <name>', 'Voice Bridge profile (default: main)')
  .argument('[args...]', 'Arguments forwarded to voice-target-here')
  .action(async (args: string[] = [], options: { profile?: string } = {}) => {
    try {
      let forwarded = [...args];
      if (options.profile) forwarded = appendVoiceProfileArg(forwarded, options.profile);
      await runVoiceBridgeCommand('voice-target-here', forwarded);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

voiceTargetCommand
  .command('pick')
  .description('Anchor destination to currently focused app/window after delay')
  .option('--profile <name>', 'Voice Bridge profile (default: main)')
  .argument('[args...]', 'Arguments forwarded to voice-target-pick')
  .action(async (args: string[] = [], options: { profile?: string } = {}) => {
    try {
      let forwarded = [...args];
      if (options.profile) forwarded = appendVoiceProfileArg(forwarded, options.profile);
      await runVoiceBridgeCommand('voice-target-pick', forwarded);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

voiceTargetCommand
  .command('show')
  .description('Show current transcription destination anchor')
  .option('--profile <name>', 'Voice Bridge profile (default: main)')
  .action(async (options: { profile?: string } = {}) => {
    try {
      const forwarded = options.profile ? appendVoiceProfileArg([], options.profile) : [];
      await runVoiceBridgeCommand('voice-target-show', forwarded);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

voiceTargetCommand
  .command('clear')
  .description('Clear destination anchor')
  .option('--profile <name>', 'Voice Bridge profile (default: main)')
  .action(async (options: { profile?: string } = {}) => {
    try {
      const forwarded = options.profile ? appendVoiceProfileArg([], options.profile) : [];
      await runVoiceBridgeCommand('voice-target-clear', forwarded);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const voiceMicCommand = voiceBridgeCommand
  .command('mic')
  .description('Microphone capture controls');
voiceMicCommand
  .command('toggle')
  .description('Toggle microphone capture on/off')
  .option('--profile <name>', 'Voice Bridge profile (default: main)')
  .action(async (options: { profile?: string } = {}) => {
    try {
      const forwarded = options.profile ? appendVoiceProfileArg([], options.profile) : [];
      await runVoiceBridgeCommand('voice-mic-toggle', forwarded);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const voiceResponseAudioCommand = voiceBridgeCommand
  .command('response-audio')
  .description('AI response audio playback controls');

voiceResponseAudioCommand
  .command('toggle')
  .description('Toggle AI response audio on/off')
  .option('--profile <name>', 'Voice Bridge profile (default: main)')
  .action(async (options: { profile?: string } = {}) => {
    try {
      const forwarded = options.profile ? appendVoiceProfileArg([], options.profile) : [];
      await runVoiceBridgeCommand('voice-response-audio-toggle', forwarded);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

voiceResponseAudioCommand
  .command('on')
  .description('Enable AI response audio')
  .option('--profile <name>', 'Voice Bridge profile (default: main)')
  .action(async (options: { profile?: string } = {}) => {
    try {
      const forwarded = options.profile
        ? ['--profile', normalizeVoiceProfile(options.profile), '--on']
        : ['--on'];
      await runVoiceBridgeCommand('voice-response-audio-toggle', forwarded);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

voiceResponseAudioCommand
  .command('off')
  .description('Disable AI response audio')
  .option('--profile <name>', 'Voice Bridge profile (default: main)')
  .action(async (options: { profile?: string } = {}) => {
    try {
      const forwarded = options.profile
        ? ['--profile', normalizeVoiceProfile(options.profile), '--off']
        : ['--off'];
      await runVoiceBridgeCommand('voice-response-audio-toggle', forwarded);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

voiceResponseAudioCommand
  .command('status')
  .description('Show AI response audio state')
  .option('--profile <name>', 'Voice Bridge profile (default: main)')
  .action(async (options: { profile?: string } = {}) => {
    try {
      const forwarded = options.profile
        ? ['--profile', normalizeVoiceProfile(options.profile), '--status']
        : ['--status'];
      await runVoiceBridgeCommand('voice-response-audio-toggle', forwarded);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('menu')
  .description('Show an organized TNF command menu')
  .option('--theme <theme>', `Splash theme: ${SPLASH_THEMES.join('|')}`)
  .option('--animate <mode>', 'Splash animation mode: auto|on|off')
  .option('--speed <ms>', 'Splash animation speed in milliseconds')
  .option('--compact', 'Use compact splash layout')
  .option('--no-splash', 'Disable splash graphic')
  .option('--full', 'Include expanded command inventory')
  .option('--json', 'Output machine-readable JSON')
  .action(
    async (options: {
      json?: boolean;
      splash?: boolean;
      theme?: string;
      animate?: string;
      speed?: string;
      compact?: boolean;
      full?: boolean;
    }) => {
      try {
        const sections = buildCommandMenuSections({ full: options.full });
        if (options.json) {
          console.log(JSON.stringify(sections, null, 2));
          return;
        }

        const speedMs = options.speed ? Number.parseInt(options.speed, 10) : undefined;
        const compact = options.compact ?? shouldAutoCompactMenuSplash();
        await printCommandMenu({
          showSplash: options.splash,
          splash: {
            theme: coerceSplashTheme(options.theme),
            animate: parseAnimateMode(options.animate),
            speedMs: Number.isFinite(speedMs) ? speedMs : undefined,
            compact,
          },
          full: options.full,
        });
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

program
  .command('splash')
  .description('Render TNF branded splash only')
  .option('--theme <theme>', `Splash theme: ${SPLASH_THEMES.join('|')}`)
  .option('--animate <mode>', 'Splash animation mode: auto|on|off')
  .option('--speed <ms>', 'Splash animation speed in milliseconds')
  .option('--compact', 'Use compact splash layout')
  .action(
    async (options: { theme?: string; animate?: string; speed?: string; compact?: boolean }) => {
      try {
        const speedMs = options.speed ? Number.parseInt(options.speed, 10) : undefined;
        await renderSplash({
          theme: coerceSplashTheme(options.theme),
          animate: parseAnimateMode(options.animate),
          speedMs: Number.isFinite(speedMs) ? speedMs : undefined,
          compact: options.compact,
        });
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

program
  .command('paths')
  .description('List all command paths in the TNF CLI')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const paths = collectCommandPaths(program).sort((a, b) => a.path.localeCompare(b.path));
      if (options.json) {
        console.log(JSON.stringify(paths, null, 2));
        return;
      }

      console.log(chalk.bold('\nTNF Command Paths\n'));
      for (const entry of paths) {
        const paddedPath = entry.path.padEnd(52, ' ');
        console.log(`  ${chalk.green(paddedPath)} ${chalk.dim(entry.description)}`);
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const types = program.command('types').description('Command namespace and script type inventory');
types
  .command('list')
  .description('List TNF command namespaces and root script namespaces')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const typeIndex = buildTypeIndex();
      if (options.json) {
        console.log(JSON.stringify(typeIndex, null, 2));
        return;
      }

      console.log(chalk.bold('\nTNF Types\n'));
      console.log(chalk.cyan('CLI namespaces:'));
      for (const namespace of typeIndex.cliNamespaces) {
        console.log(`  - ${chalk.green(namespace)}`);
      }

      console.log(`\n${chalk.cyan('Root script namespaces:')}`);
      for (const [namespace, count] of Object.entries(typeIndex.scriptNamespaces).sort(([a], [b]) =>
        a.localeCompare(b)
      )) {
        console.log(`  - ${chalk.green(namespace)} ${chalk.dim(`(${count} scripts)`)}`);
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const traits = program.command('traits').description('Role/platform and command behavior traits');
traits
  .command('list')
  .description('List TNF traits for agents and command families')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const groups = buildTraitGroups();
      if (options.json) {
        console.log(JSON.stringify(groups, null, 2));
        return;
      }

      console.log(chalk.bold('\nTNF Traits\n'));
      for (const group of groups) {
        console.log(chalk.cyan(`${group.name}:`));
        for (const value of group.values) {
          console.log(`  - ${chalk.green(value)}`);
        }
        console.log('');
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const agents = program.command('agents').description('Agent-focused command paths');
agents
  .command('list')
  .description('Alias for `tnf list`')
  .action(async () => runSelfCliWithExit(['list']));
agents
  .command('register')
  .description('Alias for `tnf register`')
  .argument('[name]', 'Agent name')
  .argument('[role]', 'Agent role')
  .argument('[platform]', 'Agent platform')
  .option('-d, --daemon', 'Run in daemon mode (register and exit immediately)', false)
  .action(
    async (name?: string, role?: string, platform?: string, options: { daemon?: boolean } = {}) => {
      const args = ['register'];
      if (name) args.push(name);
      if (role) args.push(role);
      if (platform) args.push(platform);
      if (options.daemon) args.push('--daemon');
      await runSelfCliWithExit(args);
    }
  );
agents
  .command('send')
  .description('Alias for `tnf send`')
  .argument('<message>', 'Message to send')
  .option('-t, --to <agentId>', 'Recipient agent ID')
  .option('-n, --name <name>', 'Sender name')
  .action(async (message: string, options: { to?: string; name?: string } = {}) => {
    const args = ['send', message];
    if (options.to) args.push('--to', options.to);
    if (options.name) args.push('--name', options.name);
    await runSelfCliWithExit(args);
  });

agents
  .command('convo')
  .description('Alias for `tnf convo`')
  .argument('<action>', 'Action (start|join)')
  .argument('[param]', 'Topic for start or ID for join')
  .action(async (action: string, param?: string) => {
    const args = ['convo', action];
    if (param) args.push(param);
    await runSelfCliWithExit(args);
  });

program
  .command('menu')
  .description('Show an organized TNF command menu')
  .option('--theme <theme>', `Splash theme: ${SPLASH_THEMES.join('|')}`)
  .option('--animate <mode>', 'Splash animation mode: auto|on|off')
  .option('--speed <ms>', 'Splash animation speed in milliseconds')
  .option('--compact', 'Use compact splash layout')
  .option('--no-splash', 'Disable splash graphic')
  .option('--full', 'Include expanded command inventory')
  .option('--json', 'Output machine-readable JSON')
  .action(
    async (options: {
      json?: boolean;
      splash?: boolean;
      theme?: string;
      animate?: string;
      speed?: string;
      compact?: boolean;
      full?: boolean;
    }) => {
      try {
        const sections = buildCommandMenuSections({ full: options.full });
        if (options.json) {
          console.log(JSON.stringify(sections, null, 2));
          return;
        }

        const speedMs = options.speed ? Number.parseInt(options.speed, 10) : undefined;
        const compact = options.compact ?? shouldAutoCompactMenuSplash();
        await printCommandMenu({
          showSplash: options.splash,
          splash: {
            theme: coerceSplashTheme(options.theme),
            animate: parseAnimateMode(options.animate),
            speedMs: Number.isFinite(speedMs) ? speedMs : undefined,
            compact,
          },
          full: options.full,
        });
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

program
  .command('splash')
  .description('Render TNF branded splash only')
  .option('--theme <theme>', `Splash theme: ${SPLASH_THEMES.join('|')}`)
  .option('--animate <mode>', 'Splash animation mode: auto|on|off')
  .option('--speed <ms>', 'Splash animation speed in milliseconds')
  .option('--compact', 'Use compact splash layout')
  .action(
    async (options: { theme?: string; animate?: string; speed?: string; compact?: boolean }) => {
      try {
        const speedMs = options.speed ? Number.parseInt(options.speed, 10) : undefined;
        await renderSplash({
          theme: coerceSplashTheme(options.theme),
          animate: parseAnimateMode(options.animate),
          speedMs: Number.isFinite(speedMs) ? speedMs : undefined,
          compact: options.compact,
        });
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

program
  .command('paths')
  .description('List all command paths in the TNF CLI')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const paths = collectCommandPaths(program).sort((a, b) => a.path.localeCompare(b.path));
      if (options.json) {
        console.log(JSON.stringify(paths, null, 2));
        return;
      }

      console.log(chalk.bold('\nTNF Command Paths\n'));
      for (const entry of paths) {
        const paddedPath = entry.path.padEnd(52, ' ');
        console.log(`  ${chalk.green(paddedPath)} ${chalk.dim(entry.description)}`);
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const types = program.command('types').description('Command namespace and script type inventory');
types
  .command('list')
  .description('List TNF command namespaces and root script namespaces')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const typeIndex = buildTypeIndex();
      if (options.json) {
        console.log(JSON.stringify(typeIndex, null, 2));
        return;
      }

      console.log(chalk.bold('\nTNF Types\n'));
      console.log(chalk.cyan('CLI namespaces:'));
      for (const namespace of typeIndex.cliNamespaces) {
        console.log(`  - ${chalk.green(namespace)}`);
      }

      console.log(`\n${chalk.cyan('Root script namespaces:')}`);
      for (const [namespace, count] of Object.entries(typeIndex.scriptNamespaces).sort(([a], [b]) =>
        a.localeCompare(b)
      )) {
        console.log(`  - ${chalk.green(namespace)} ${chalk.dim(`(${count} scripts)`)}`);
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const traits = program.command('traits').description('Role/platform and command behavior traits');
traits
  .command('list')
  .description('List TNF traits for agents and command families')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const groups = buildTraitGroups();
      if (options.json) {
        console.log(JSON.stringify(groups, null, 2));
        return;
      }

      console.log(chalk.bold('\nTNF Traits\n'));
      for (const group of groups) {
        console.log(chalk.cyan(`${group.name}:`));
        for (const value of group.values) {
          console.log(`  - ${chalk.green(value)}`);
        }
        console.log('');
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const agents = program.command('agents').description('Agent-focused command paths');
agents
  .command('list')
  .description('Alias for `tnf list`')
  .action(async () => runSelfCliWithExit(['list']));
agents
  .command('register')
  .description('Alias for `tnf register`')
  .argument('[name]', 'Agent name')
  .argument('[role]', 'Agent role')
  .argument('[platform]', 'Agent platform')
  .option('-d, --daemon', 'Run in daemon mode (register and exit immediately)', false)
  .action(
    async (name?: string, role?: string, platform?: string, options: { daemon?: boolean } = {}) => {
      const args = ['register'];
      if (name) args.push(name);
      if (role) args.push(role);
      if (platform) args.push(platform);
      if (options.daemon) args.push('--daemon');
      await runSelfCliWithExit(args);
    }
  );
agents
  .command('send')
  .description('Alias for `tnf send`')
  .argument('<message>', 'Message to send')
  .option('-t, --to <agentId>', 'Recipient agent ID')
  .option('-n, --name <name>', 'Sender name')
  .action(async (message: string, options: { to?: string; name?: string } = {}) => {
    const args = ['send', message];
    if (options.to) args.push('--to', options.to);
    if (options.name) args.push('--name', options.name);
    await runSelfCliWithExit(args);
  });
agents
  .command('orchestrate')
  .description('Alias for `tnf orchestrate`')
  .argument('<workflow>', 'Workflow name')
  .option('-p, --path <path>', 'Target path for code-review')
  .action(async (workflow: string, options: { path?: string } = {}) => {
    const args = ['orchestrate', workflow];
    if (options.path) args.push('--path', options.path);
    await runSelfCliWithExit(args);
  });
agents
  .command('convo')
  .description('Alias for `tnf convo`')
  .argument('<action>', 'Action (start|join)')
  .argument('[param]', 'Topic for start or ID for join')
  .action(async (action: string, param?: string) => {
    const args = ['convo', action];
    if (param) args.push(param);
    await runSelfCliWithExit(args);
  });

program
  .command('menu')
  .description('Show an organized TNF command menu')
  .option('--theme <theme>', `Splash theme: ${SPLASH_THEMES.join('|')}`)
  .option('--animate <mode>', 'Splash animation mode: auto|on|off')
  .option('--speed <ms>', 'Splash animation speed in milliseconds')
  .option('--compact', 'Use compact splash layout')
  .option('--no-splash', 'Disable splash graphic')
  .option('--full', 'Include expanded command inventory')
  .option('--json', 'Output machine-readable JSON')
  .action(
    async (options: {
      json?: boolean;
      splash?: boolean;
      theme?: string;
      animate?: string;
      speed?: string;
      compact?: boolean;
      full?: boolean;
    }) => {
      try {
        const sections = buildCommandMenuSections({ full: options.full });
        if (options.json) {
          console.log(JSON.stringify(sections, null, 2));
          return;
        }

        const speedMs = options.speed ? Number.parseInt(options.speed, 10) : undefined;
        const compact = options.compact ?? shouldAutoCompactMenuSplash();
        await printCommandMenu({
          showSplash: options.splash,
          splash: {
            theme: coerceSplashTheme(options.theme),
            animate: parseAnimateMode(options.animate),
            speedMs: Number.isFinite(speedMs) ? speedMs : undefined,
            compact,
          },
          full: options.full,
        });
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

program
  .command('splash')
  .description('Render TNF branded splash only')
  .option('--theme <theme>', `Splash theme: ${SPLASH_THEMES.join('|')}`)
  .option('--animate <mode>', 'Splash animation mode: auto|on|off')
  .option('--speed <ms>', 'Splash animation speed in milliseconds')
  .option('--compact', 'Use compact splash layout')
  .action(
    async (options: { theme?: string; animate?: string; speed?: string; compact?: boolean }) => {
      try {
        const speedMs = options.speed ? Number.parseInt(options.speed, 10) : undefined;
        await renderSplash({
          theme: coerceSplashTheme(options.theme),
          animate: parseAnimateMode(options.animate),
          speedMs: Number.isFinite(speedMs) ? speedMs : undefined,
          compact: options.compact,
        });
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

program
  .command('paths')
  .description('List all command paths in the TNF CLI')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const paths = collectCommandPaths(program).sort((a, b) => a.path.localeCompare(b.path));
      if (options.json) {
        console.log(JSON.stringify(paths, null, 2));
        return;
      }

      console.log(chalk.bold('\nTNF Command Paths\n'));
      for (const entry of paths) {
        const paddedPath = entry.path.padEnd(52, ' ');
        console.log(`  ${chalk.green(paddedPath)} ${chalk.dim(entry.description)}`);
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const types = program.command('types').description('Command namespace and script type inventory');
types
  .command('list')
  .description('List TNF command namespaces and root script namespaces')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const typeIndex = buildTypeIndex();
      if (options.json) {
        console.log(JSON.stringify(typeIndex, null, 2));
        return;
      }

      console.log(chalk.bold('\nTNF Types\n'));
      console.log(chalk.cyan('CLI namespaces:'));
      for (const namespace of typeIndex.cliNamespaces) {
        console.log(`  - ${chalk.green(namespace)}`);
      }

      console.log(`\n${chalk.cyan('Root script namespaces:')}`);
      for (const [namespace, count] of Object.entries(typeIndex.scriptNamespaces).sort(([a], [b]) =>
        a.localeCompare(b)
      )) {
        console.log(`  - ${chalk.green(namespace)} ${chalk.dim(`(${count} scripts)`)}`);
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const traits = program.command('traits').description('Role/platform and command behavior traits');
traits
  .command('list')
  .description('List TNF traits for agents and command families')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const groups = buildTraitGroups();
      if (options.json) {
        console.log(JSON.stringify(groups, null, 2));
        return;
      }

      console.log(chalk.bold('\nTNF Traits\n'));
      for (const group of groups) {
        console.log(chalk.cyan(`${group.name}:`));
        for (const value of group.values) {
          console.log(`  - ${chalk.green(value)}`);
        }
        console.log('');
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const agents = program.command('agents').description('Agent-focused command paths');
agents
  .command('list')
  .description('Alias for `tnf list`')
  .action(async () => runSelfCliWithExit(['list']));
agents
  .command('register')
  .description('Alias for `tnf register`')
  .argument('[name]', 'Agent name')
  .argument('[role]', 'Agent role')
  .argument('[platform]', 'Agent platform')
  .option('-d, --daemon', 'Run in daemon mode (register and exit immediately)', false)
  .action(
    async (name?: string, role?: string, platform?: string, options: { daemon?: boolean } = {}) => {
      const args = ['register'];
      if (name) args.push(name);
      if (role) args.push(role);
      if (platform) args.push(platform);
      if (options.daemon) args.push('--daemon');
      await runSelfCliWithExit(args);
    }
  );
agents
  .command('send')
  .description('Alias for `tnf send`')
  .argument('<message>', 'Message to send')
  .option('-t, --to <agentId>', 'Recipient agent ID')
  .option('-n, --name <name>', 'Sender name')
  .action(async (message: string, options: { to?: string; name?: string } = {}) => {
    const args = ['send', message];
    if (options.to) args.push('--to', options.to);
    if (options.name) args.push('--name', options.name);
    await runSelfCliWithExit(args);
  });
agents
  .command('orchestrate')
  .description('Alias for `tnf orchestrate`')
  .argument('<workflow>', 'Workflow name')
  .option('-p, --path <path>', 'Target path for code-review')
  .action(async (workflow: string, options: { path?: string } = {}) => {
    const args = ['orchestrate', workflow];
    if (options.path) args.push('--path', options.path);
    await runSelfCliWithExit(args);
  });
agents
  .command('convo')
  .description('Alias for `tnf convo`')
  .argument('<action>', 'Action (start|join)')
  .argument('[param]', 'Topic for start or ID for join')
  .action(async (action: string, param?: string) => {
    const args = ['convo', action];
    if (param) args.push(param);
    await runSelfCliWithExit(args);
  });

program
  .command('menu')
  .description('Show an organized TNF command menu')
  .option('--theme <theme>', `Splash theme: ${SPLASH_THEMES.join('|')}`)
  .option('--animate <mode>', 'Splash animation mode: auto|on|off')
  .option('--speed <ms>', 'Splash animation speed in milliseconds')
  .option('--compact', 'Use compact splash layout')
  .option('--no-splash', 'Disable splash graphic')
  .option('--full', 'Include expanded command inventory')
  .option('--json', 'Output machine-readable JSON')
  .action(
    async (options: {
      json?: boolean;
      splash?: boolean;
      theme?: string;
      animate?: string;
      speed?: string;
      compact?: boolean;
      full?: boolean;
    }) => {
      try {
        const sections = buildCommandMenuSections({ full: options.full });
        if (options.json) {
          console.log(JSON.stringify(sections, null, 2));
          return;
        }

        const speedMs = options.speed ? Number.parseInt(options.speed, 10) : undefined;
        const compact = options.compact ?? shouldAutoCompactMenuSplash();
        await printCommandMenu({
          showSplash: options.splash,
          splash: {
            theme: coerceSplashTheme(options.theme),
            animate: parseAnimateMode(options.animate),
            speedMs: Number.isFinite(speedMs) ? speedMs : undefined,
            compact,
          },
          full: options.full,
        });
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

program
  .command('splash')
  .description('Render TNF branded splash only')
  .option('--theme <theme>', `Splash theme: ${SPLASH_THEMES.join('|')}`)
  .option('--animate <mode>', 'Splash animation mode: auto|on|off')
  .option('--speed <ms>', 'Splash animation speed in milliseconds')
  .option('--compact', 'Use compact splash layout')
  .action(
    async (options: { theme?: string; animate?: string; speed?: string; compact?: boolean }) => {
      try {
        const speedMs = options.speed ? Number.parseInt(options.speed, 10) : undefined;
        await renderSplash({
          theme: coerceSplashTheme(options.theme),
          animate: parseAnimateMode(options.animate),
          speedMs: Number.isFinite(speedMs) ? speedMs : undefined,
          compact: options.compact,
        });
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

program
  .command('paths')
  .description('List all command paths in the TNF CLI')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const paths = collectCommandPaths(program).sort((a, b) => a.path.localeCompare(b.path));
      if (options.json) {
        console.log(JSON.stringify(paths, null, 2));
        return;
      }

      console.log(chalk.bold('\nTNF Command Paths\n'));
      for (const entry of paths) {
        const paddedPath = entry.path.padEnd(52, ' ');
        console.log(`  ${chalk.green(paddedPath)} ${chalk.dim(entry.description)}`);
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const types = program.command('types').description('Command namespace and script type inventory');
types
  .command('list')
  .description('List TNF command namespaces and root script namespaces')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const typeIndex = buildTypeIndex();
      if (options.json) {
        console.log(JSON.stringify(typeIndex, null, 2));
        return;
      }

      console.log(chalk.bold('\nTNF Types\n'));
      console.log(chalk.cyan('CLI namespaces:'));
      for (const namespace of typeIndex.cliNamespaces) {
        console.log(`  - ${chalk.green(namespace)}`);
      }

      console.log(`\n${chalk.cyan('Root script namespaces:')}`);
      for (const [namespace, count] of Object.entries(typeIndex.scriptNamespaces).sort(([a], [b]) =>
        a.localeCompare(b)
      )) {
        console.log(`  - ${chalk.green(namespace)} ${chalk.dim(`(${count} scripts)`)}`);
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const traits = program.command('traits').description('Role/platform and command behavior traits');
traits
  .command('list')
  .description('List TNF traits for agents and command families')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const groups = buildTraitGroups();
      if (options.json) {
        console.log(JSON.stringify(groups, null, 2));
        return;
      }

      console.log(chalk.bold('\nTNF Traits\n'));
      for (const group of groups) {
        console.log(chalk.cyan(`${group.name}:`));
        for (const value of group.values) {
          console.log(`  - ${chalk.green(value)}`);
        }
        console.log('');
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const agents = program.command('agents').description('Agent-focused command paths');
agents
  .command('list')
  .description('Alias for `tnf list`')
  .action(async () => runSelfCliWithExit(['list']));
agents
  .command('register')
  .description('Alias for `tnf register`')
  .argument('[name]', 'Agent name')
  .argument('[role]', 'Agent role')
  .argument('[platform]', 'Agent platform')
  .option('-d, --daemon', 'Run in daemon mode (register and exit immediately)', false)
  .action(
    async (name?: string, role?: string, platform?: string, options: { daemon?: boolean } = {}) => {
      const args = ['register'];
      if (name) args.push(name);
      if (role) args.push(role);
      if (platform) args.push(platform);
      if (options.daemon) args.push('--daemon');
      await runSelfCliWithExit(args);
    }
  );
agents
  .command('send')
  .description('Alias for `tnf send`')
  .argument('<message>', 'Message to send')
  .option('-t, --to <agentId>', 'Recipient agent ID')
  .option('-n, --name <name>', 'Sender name')
  .action(async (message: string, options: { to?: string; name?: string } = {}) => {
    const args = ['send', message];
    if (options.to) args.push('--to', options.to);
    if (options.name) args.push('--name', options.name);
    await runSelfCliWithExit(args);
  });
agents
  .command('orchestrate')
  .description('Alias for `tnf orchestrate`')
  .argument('<workflow>', 'Workflow name')
  .option('-p, --path <path>', 'Target path for code-review')
  .action(async (workflow: string, options: { path?: string } = {}) => {
    const args = ['orchestrate', workflow];
    if (options.path) args.push('--path', options.path);
    await runSelfCliWithExit(args);
  });
agents
  .command('convo')
  .description('Alias for `tnf convo`')
  .argument('<action>', 'Action (start|join)')
  .argument('[param]', 'Topic for start or ID for join')
  .action(async (action: string, param?: string) => {
    const args = ['convo', action];
    if (param) args.push(param);
    await runSelfCliWithExit(args);
  });

program
  .command('list')
  .description('List all registered agents')
  .action(async () => {
    const client = new RedisAgentClient();
    try {
      await client.initialize();
      const agents = await client.listAgents();

      console.log(chalk.bold('\n📋 Registered Agents:\n'));

      if (agents.length === 0) {
        console.log('   No agents registered');
      } else {
        agents.forEach((agent) => {
          const statusIcon = agent.isOnline ? chalk.green('🟢') : chalk.red('🔴');
          const roleIcon: Record<string, string> = {
            orchestrator: '👑',
            broker: '🎯',
            worker: '⚙️',
            participant: '💬',
          };
          const icon = roleIcon[agent.role] || '📦';

          console.log(`${statusIcon} ${icon} ${chalk.bold(agent.name)} (${agent.platform})`);
          console.log(`      Role: ${agent.role}`);
          console.log(`      ID: ${chalk.dim(agent.id)}`);
          console.log(`      Last seen: ${chalk.dim(agent.lastSeen)}`);
          console.log('');
        });
      }
    } catch (err: any) {
      if (isRedisUnavailable(err)) {
        logRedisUnavailable('./tnf list');
      }
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    } finally {
      await client.cleanup();
    }
  });

program
  .command('send')
  .description('Send a single message')
  .argument('<message>', 'Message to send')
  .option('-t, --to <agentId>', 'Recipient agent ID')
  .option('-n, --name <name>', 'Sender name', process.env.AGENT_NAME || 'cli-sender')
  .action(async (message, options) => {
    const client = new RedisAgentClient();
    try {
      await client.initialize();
      await client.register(options.name, 'participant', 'vscode');
      await client.send(message, { to: options.to ? { agentId: options.to } : undefined });

      console.log(chalk.green('📤 Message sent'));

      // Wait a bit for responses
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err: any) {
      if (isRedisUnavailable(err)) {
        logRedisUnavailable('./tnf send <message>');
      }
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    } finally {
      await client.cleanup();
    }
  });

program
  .command('convo')
  .description('Manage conversations')
  .argument('<action>', 'Action (start, join)')
  .argument('[param]', 'Topic for start, ID for join')
  .action(async (action, param) => {
    const client = new RedisAgentClient();
    try {
      await client.initialize();
      await client.register('convo-cli', 'participant', 'vscode');

      if (action === 'start') {
        const id = await client.startConversation(param || 'general');
        console.log(chalk.green(`💬 Started conversation: ${chalk.bold(param || 'general')}`));
        console.log(`   ID: ${chalk.dim(id)}`);
      } else if (action === 'join') {
        if (!param) {
          throw new Error('Conversation ID required to join');
        }
        client.joinConversation(param);
        console.log(chalk.green(`🔗 Joined conversation: ${chalk.dim(param)}`));
      }

      console.log(chalk.cyan('\nType messages and press Enter (Ctrl+C to exit)\n'));

      client.onMessage('*', (msg) => {
        logMessage(msg);
      });

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.on('line', async (line) => {
        if (line.trim()) {
          await client.send(line.trim());
        }
      });

      process.on('SIGINT', async () => {
        await client.cleanup();
        process.exit(0);
      });
    } catch (err: any) {
      if (isRedisUnavailable(err)) {
        logRedisUnavailable(`./tnf convo ${action}${param ? ` ${param}` : ''}`);
      }
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// ────────────────────────────────────────────────────────────────────────────
// Reports lifecycle management
// ────────────────────────────────────────────────────────────────────────────
const reports = program
  .command('reports')
  .description('Report lifecycle management — rotation, metadata, trending');

reports
  .command('status')
  .description('Show report inventory: counts per type, disk usage, and lifecycle metadata')
  .option('--json', 'Output machine-readable JSON')
  .action(async (options: { json?: boolean }) => {
    try {
      const reportDir = path.join(repoRoot, '.agent/test-reports');
      if (!fs.existsSync(reportDir)) {
        console.log(chalk.yellow('No reports directory found at .agent/test-reports'));
        process.exit(0);
      }
      const files = fs
        .readdirSync(reportDir)
        .filter((f) => f.endsWith('.json') && !f.startsWith('_'));

      const counts: Record<string, number> = {};
      let totalBytes = 0;
      for (const file of files) {
        const prefix = file.replace(/-\d{13}\.json$/, '');
        counts[prefix] = (counts[prefix] || 0) + 1;
        try {
          totalBytes += fs.statSync(path.join(reportDir, file)).size;
        } catch {
          /* skip */
        }
      }

      // Check for rolling summary
      const summaryPath = path.join(reportDir, '_rolling-summary.json');
      let summary: any = null;
      if (fs.existsSync(summaryPath)) {
        try {
          summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
        } catch {
          /* skip */
        }
      }

      if (options.json) {
        console.log(
          JSON.stringify({ counts, totalBytes, totalFiles: files.length, summary }, null, 2)
        );
        return;
      }

      console.log(chalk.bold('\n📋 Report Inventory\n'));
      console.log(`   Directory: ${chalk.dim('.agent/test-reports')}`);
      console.log(`   Total files: ${chalk.cyan(String(files.length))}`);
      console.log(`   Total size: ${chalk.cyan((totalBytes / 1024).toFixed(1) + ' KB')}\n`);

      for (const [prefix, count] of Object.entries(counts).sort()) {
        const meta = summary?.types?.[prefix];
        const domain = meta?.domain || 'unknown';
        const lifecycle = meta?.lifecycle || 'unknown';
        const avgScore = meta?.recentAvgScore;
        const trend = meta?.trend;

        console.log(
          `   ${chalk.green(prefix)}: ${chalk.bold(String(count))} files` +
            `  ${chalk.dim(`[${domain}/${lifecycle}]`)}` +
            (avgScore != null ? `  avg=${chalk.cyan(avgScore + '%')}` : '') +
            (trend
              ? `  trend=${trend === 'declining' ? chalk.red(trend) : chalk.green(trend)}`
              : '')
        );
      }

      if (summary?.generatedAt) {
        console.log(`\n   Summary last updated: ${chalk.dim(summary.generatedAt)}`);
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

reports
  .command('prune')
  .description('Prune old reports and regenerate the rolling summary')
  .option('--max-per-type <n>', 'Maximum reports to keep per type', '50')
  .option('--max-age-days <n>', 'Maximum report age in days', '7')
  .option('--dry-run', 'Show what would be pruned without deleting')
  .action(async (options: { maxPerType: string; maxAgeDays: string; dryRun?: boolean }) => {
    try {
      const env: Record<string, string> = {};
      if (options.maxPerType) env.REPORT_MAX_PER_TYPE = options.maxPerType;
      if (options.maxAgeDays) {
        env.REPORT_MAX_AGE_MS = String(parseInt(options.maxAgeDays, 10) * 86400000);
      }
      if (options.dryRun) {
        // In dry-run mode, just show counts without actually pruning
        const reportDir = path.join(repoRoot, '.agent/test-reports');
        if (!fs.existsSync(reportDir)) {
          console.log(chalk.yellow('No reports directory found.'));
          process.exit(0);
        }

        const maxPerType = parseInt(options.maxPerType, 10);
        const maxAgeMs = parseInt(options.maxAgeDays, 10) * 86400000;
        const now = Date.now();
        const prefixes = ['test-report', 'integration-report', 'uiux-report'];

        console.log(chalk.bold('\n🔍 Dry Run — Reports that WOULD be pruned:\n'));
        for (const prefix of prefixes) {
          const files = fs
            .readdirSync(reportDir)
            .filter((f) => f.startsWith(prefix + '-') && f.endsWith('.json'))
            .sort();

          let wouldPrune = 0;
          for (const file of files) {
            const tsMatch = file.match(/(\d{13})\.json$/);
            if (tsMatch && parseInt(tsMatch[1], 10) < now - maxAgeMs) {
              wouldPrune++;
            }
          }
          const remaining = files.length - wouldPrune;
          if (remaining > maxPerType) {
            wouldPrune += remaining - maxPerType;
          }

          console.log(
            `   ${chalk.green(prefix)}: ${chalk.red(String(wouldPrune))} pruned, ${chalk.cyan(String(Math.max(0, files.length - wouldPrune)))} kept`
          );
        }
        console.log('');
        return;
      }

      await runCommand('node', ['scripts/swarm/report-lifecycle.cjs'], { env });
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

reports
  .command('summary')
  .description('Display the rolling summary dashboard')
  .option('--json', 'Output raw rolling summary JSON')
  .action(async (options: { json?: boolean }) => {
    try {
      const summaryPath = path.join(repoRoot, '.agent/test-reports/_rolling-summary.json');
      if (!fs.existsSync(summaryPath)) {
        console.log(
          chalk.yellow('No rolling summary found. Run `tnf reports prune` to generate one.')
        );
        process.exit(0);
      }

      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

      if (options.json) {
        console.log(JSON.stringify(summary, null, 2));
        return;
      }

      console.log(chalk.bold('\n📊 Rolling Summary Dashboard\n'));
      console.log(`   Generated: ${chalk.dim(summary.generatedAt)}`);
      console.log(`   Window: last ${summary.config?.summaryWindow || '?'} reports per type\n`);

      for (const [type, data] of Object.entries(summary.types || {}) as [string, any][]) {
        const trendColor = data.trend === 'declining' ? chalk.red : chalk.green;
        const scoreColor =
          (data.recentAvgScore ?? 0) >= 80
            ? chalk.green
            : (data.recentAvgScore ?? 0) >= 60
              ? chalk.yellow
              : chalk.red;

        console.log(`   ${chalk.bold(type)} ${chalk.dim(`(${data.domain}/${data.lifecycle})`)}`);
        console.log(`     Owner: ${chalk.dim(data.owner)}`);
        console.log(`     On disk: ${chalk.cyan(String(data.totalOnDisk))}`);
        console.log(
          `     Avg score: ${scoreColor(data.recentAvgScore != null ? data.recentAvgScore + '%' : 'n/a')}`
        );
        console.log(
          `     Min/Max: ${data.recentMinScore ?? 'n/a'}% / ${data.recentMaxScore ?? 'n/a'}%`
        );
        console.log(`     Trend: ${trendColor(data.trend)}`);
        if (data.latestReport) {
          console.log(
            `     Latest: ${chalk.dim(data.latestReport.file)} (${data.latestReport.status})`
          );
        }
        console.log('');
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

reports
  .command('trends')
  .description('Show score trends for a specific report type')
  .argument('[type]', 'Report type (test-report, integration-report, uiux-report)', 'test-report')
  .option('--limit <n>', 'Number of recent reports to show', '20')
  .action(async (type: string, options: { limit: string }) => {
    try {
      const reportDir = path.join(repoRoot, '.agent/test-reports');
      if (!fs.existsSync(reportDir)) {
        console.log(chalk.yellow('No reports directory found.'));
        process.exit(0);
      }

      const limit = parseInt(options.limit, 10);
      const files = fs
        .readdirSync(reportDir)
        .filter((f) => f.startsWith(type + '-') && f.endsWith('.json'))
        .sort()
        .slice(-limit);

      if (files.length === 0) {
        console.log(chalk.yellow(`No reports found for type: ${type}`));
        process.exit(0);
      }

      console.log(chalk.bold(`\n📈 Score Trends: ${type} (last ${files.length})\n`));

      const maxBarWidth = 40;
      for (const file of files) {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(reportDir, file), 'utf8'));
          const score = data.overall?.score ?? 0;
          const status = data.overall?.status ?? '?';
          const ts = data.timestamp ? new Date(data.timestamp).toLocaleString() : 'unknown';

          const barFill = Math.round((score / 100) * maxBarWidth);
          const bar = '█'.repeat(barFill) + '░'.repeat(maxBarWidth - barFill);
          const scoreColor = score >= 80 ? chalk.green : score >= 60 ? chalk.yellow : chalk.red;

          console.log(
            `   ${chalk.dim(ts)}  ${scoreColor(bar)} ${scoreColor.bold(String(score) + '%')} ${chalk.dim(status)}`
          );
        } catch {
          /* skip corrupt */
        }
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

async function main(): Promise<void> {
  if (process.argv.length <= 2) {
    await printCommandMenu({
      splash: {
        compact: shouldAutoCompactMenuSplash(),
      },
    });
    return;
  }
  if (isOpenClawPassthroughArgv(process.argv)) {
    await runOpenClawPassthrough(process.argv.slice(3));
    return;
  }
  const implicitOpenClawArgs = resolveImplicitOpenClawArgs(process.argv);
  if (implicitOpenClawArgs) {
    await runOpenClawPassthrough(implicitOpenClawArgs);
    return;
  }
  await program.parseAsync(process.argv);
}

main().catch((err: Error) => {
  console.error(chalk.red(`Error: ${err.message}`));
  process.exit(1);
});
