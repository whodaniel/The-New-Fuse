import { PackageReconnectHub, type PackageProbeResult } from '@the-new-fuse/tnf-core';
import { NoteService } from '@the-new-fuse/tnf-note-taking';
import chalk from 'chalk';
import { spawn, spawnSync } from 'child_process';
import { Command } from 'commander';
import { createHash } from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import type { AgentMessage } from './RedisAgentClient.js';
import { RedisAgentClient } from './RedisAgentClient.js';
import { registerAgentsClassifyCommand } from './commands/agents-classify.js';
import { registerAssimilateCommand } from './commands/assimilate.js';
import { registerRefreshContextCommand } from './commands/refresh-context/command.js';
import { registerTelegramSendCommand } from './commands/telegram/send.js';
import { registerTelegramStartCommand } from './commands/telegram/start.js';
import { registerTelegramStatusCommand } from './commands/telegram/status.js';
import { registerTelegramStopCommand } from './commands/telegram/stop.js';
import { Orchestrator } from './orchestration.js';
import { ProtocolInterceptor } from './orchestration/ProtocolInterceptor.js';
import { CronService } from './services/CronService.js';
import { GoalsService } from './services/GoalsService.js';
import { KanbanService } from './services/KanbanService.js';
import { MemoryProviderService } from './services/MemoryProviderService.js';
import { PluginsService } from './services/PluginsService.js';
import { StoryService } from './services/StoryService.js';
import { ToolsService } from './services/ToolsService.js';
import { WebhookService } from './services/WebhookService.js';
import {
  findSlashCommand,
  formatPromptSlashCommand,
  getAllSlashCommands,
  parseSlashCommand,
  renderSlashCommandDetail,
  renderSlashCommandList,
  type SlashCommandDefinition,
} from './slashCommands.js';

const program = new Command();
// Fallback for CommonJS/ESM compatibility
const _dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath((import.meta as any).url));
const _filename =
  typeof __filename !== 'undefined' ? __filename : fileURLToPath((import.meta as any).url);
const repoRoot = path.resolve(_dirname, '../../..');
const invocationCwd = process.env.TNF_INVOCATION_CWD || process.cwd();
const LOCAL_ENV_FILES = ['.env', '.env.local', '.tnf.local.env'];
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

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

function parseEnvValue(rawValue: string): string {
  const value = rawValue.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function loadLocalEnv(rootDir: string): void {
  const exportedKeys = new Set(Object.keys(process.env));
  for (const envFile of LOCAL_ENV_FILES) {
    const envPath = path.join(rootDir, envFile);
    if (!fs.existsSync(envPath)) continue;

    for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const normalizedLine = line.startsWith('export ')
        ? line.slice('export '.length).trim()
        : line;
      const separatorIndex = normalizedLine.indexOf('=');
      if (separatorIndex <= 0) continue;

      const key = normalizedLine.slice(0, separatorIndex).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || exportedKeys.has(key)) continue;

      process.env[key] = parseEnvValue(normalizedLine.slice(separatorIndex + 1));
    }
  }
}

loadLocalEnv(repoRoot);

try {
  if (process.cwd() !== repoRoot) {
    process.chdir(repoRoot);
  }
} catch (error: any) {
  console.warn(
    chalk.yellow(`Warning: failed to switch to TNF repo root: ${error?.message || error}`)
  );
}

async function runCommand(
  cmd: string,
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv; isBackground?: boolean } = {}
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const stdio = options.isBackground ? 'ignore' : 'inherit';
    const child = spawn(cmd, args, {
      cwd: options.cwd || repoRoot,
      env: { ...process.env, ...(options.env || {}) },
      stdio,
      detached: options.isBackground,
    });

    if (options.isBackground) {
      child.unref();
      return resolve();
    }

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

async function runTnfCliEntrypoint(args: string[]): Promise<void> {
  const env = { TNF_INVOCATION_CWD: invocationCwd };
  if (_filename.endsWith('.ts')) {
    await runCommand('pnpm', ['exec', 'tsx', _filename, ...args], { env });
    return;
  }
  await runCommand(process.execPath, [_filename, ...args], { cwd: repoRoot, env });
}

async function runTurnZeroOnboardSurface(options: { repair?: boolean } = {}): Promise<void> {
  const args = ['scripts/tnf-onboard.cjs', '--runtime-timeout-ms', '1000'];
  if (options.repair) args.push('--repair');
  await runCommand('node', args);
}

async function ensureTurnZeroForAgentEntrypoint(): Promise<void> {
  if (isTruthyEnv(process.env.TNF_SKIP_TURN_ZERO_ONBOARD)) {
    console.warn(
      chalk.yellow(
        '[TNF Harness] Skipping Turn Zero onboarding because TNF_SKIP_TURN_ZERO_ONBOARD is set.'
      )
    );
    return;
  }

  console.log(chalk.bold.cyan('\n[TNF Harness] Turn Zero onboarding before interactive agent\n'));
  await runTurnZeroOnboardSurface();
}

function isTruthyEnv(value: string | undefined): boolean {
  return typeof value === 'string' && ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function normalizeToken(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function resolveProvidedSuperAdminToken(options?: { superAdminToken?: string }): {
  token?: string;
  source?: string;
} {
  const candidates = [
    { token: normalizeToken(options?.superAdminToken), source: '--super-admin-token' },
    {
      token: normalizeToken(process.env[SUPER_ADMIN_INPUT_ENV_KEY]),
      source: SUPER_ADMIN_INPUT_ENV_KEY,
    },
    { token: normalizeToken(process.env.CI_SUPER_ADMIN_TOKEN), source: 'CI_SUPER_ADMIN_TOKEN' },
    { token: normalizeToken(process.env[SUPER_ADMIN_ENV_KEY]), source: SUPER_ADMIN_ENV_KEY },
  ];
  return candidates.find((candidate) => Boolean(candidate.token)) ?? {};
}

function requireSuperAdmin(
  options: { superAdminToken?: string } | undefined,
  commandLabel: string
): void {
  const expected = normalizeToken(process.env[SUPER_ADMIN_ENV_KEY]);
  const provided = resolveProvidedSuperAdminToken(options);

  if (!expected) {
    throw new Error(
      `Super Admin auth is not configured. Set ${SUPER_ADMIN_ENV_KEY} in the execution environment (e.g. ~/.zshrc or .env).`
    );
  }

  if (!provided.token) {
    throw new Error(
      `Super Admin authentication required for '${commandLabel}'.\n` +
        `No token provided. Ways to authenticate:\n` +
        ` 1. CLI Option: tnf ... --super-admin-token YOUR_TOKEN\n` +
        ` 2. Env Var: export ${SUPER_ADMIN_INPUT_ENV_KEY}=YOUR_TOKEN\n` +
        ` 3. CI Secret: Set CI_SUPER_ADMIN_TOKEN in your CI/CD settings.\n` +
        ` 4. Env Var: export ${SUPER_ADMIN_ENV_KEY}=YOUR_TOKEN`
    );
  }

  if (provided.token !== expected) {
    throw new Error(
      `Super Admin authentication failed for '${commandLabel}'. Token from ${provided.source || 'unknown source'} does not match ${SUPER_ADMIN_ENV_KEY}.`
    );
  }

  // Normalize downstream command behavior to the input token channel.
  if (!process.env[SUPER_ADMIN_INPUT_ENV_KEY]) {
    process.env[SUPER_ADMIN_INPUT_ENV_KEY] = provided.token;
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

  let hash = 0;
  for (const char of profile) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return 50005 + (hash % 400) + 1;
}

async function readVoiceBridgeJson(
  pathname: string,
  method: 'GET' | 'POST' = 'GET',
  port = 50005
): Promise<unknown> {
  const url = `http://127.0.0.1:${port}${pathname}`;
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) {
      throw new Error(
        `Voice Bridge API call failed for ${method} ${pathname} on 127.0.0.1:${port} (HTTP ${response.status}).`
      );
    }
    const body = await response.text();
    if (!body) return {};
    try {
      return JSON.parse(body);
    } catch {
      throw new Error(`Voice Bridge API returned non-JSON for ${method} ${pathname}: ${body}`);
    }
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.code === 'ECONNREFUSED') {
      throw new Error(
        `Voice Bridge API call failed for ${method} ${pathname} on 127.0.0.1:${port}. Is voice server running?`
      );
    }
    throw err;
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
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`, {
        signal: AbortSignal.timeout(450),
      });
      if (response.ok) return true;
    } catch {}
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

async function postVoiceSend(
  port: number,
  text: string
): Promise<{ ok: boolean; body: string; error?: string }> {
  const payload = JSON.stringify({ text });
  try {
    const response = await fetch(`http://127.0.0.1:${port}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) {
      return {
        ok: false,
        body: '',
        error: `HTTP ${response.status}`,
      };
    }
    const body = await response.text();
    return { ok: true, body: body.trim() };
  } catch (err: any) {
    return {
      ok: false,
      body: '',
      error: err.message || 'fetch failed',
    };
  }
}

async function postVoiceActivate(
  port: number
): Promise<{ ok: boolean; body: string; error?: string }> {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/activate`, {
      method: 'POST',
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) {
      return {
        ok: false,
        body: '',
        error: `HTTP ${response.status}`,
      };
    }
    const body = await response.text();
    return { ok: true, body: body.trim() };
  } catch (err: any) {
    return {
      ok: false,
      body: '',
      error: err.message || 'fetch failed',
    };
  }
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
type ControlPlaneProvider = 'local' | 'cloud_runtime';
type SelfImprovementArtifactStatus = {
  path: string;
  exists: boolean;
  bytes: number;
  updatedAt: string | null;
};
type SelfImprovementArtifactsIndex = {
  liveLinkCrawlJson: string;
  semanticAuditJson: string;
  authPathAuditJson: string;
  scorecardJson: string;
  scorecardMd: string;
  architectureMermaid: string;
  runLog: string;
};
type SelfImprovementRunCliOptions = {
  baseUrl?: string;
  apiUrl?: string;
  maxDepth?: string;
  maxPages?: string;
  maxExternal?: string;
  skipBuild?: boolean;
  skipLiveLinks?: boolean;
  skipSemantic?: boolean;
  skipAuth?: boolean;
  skipScorecard?: boolean;
  skipMermaid?: boolean;
  note?: string;
  superAdminToken?: string;
};
type FullAutoRunEvent = {
  cycle: number;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  ok: boolean;
  error?: string;
};
type FullAutoState = {
  mode: 'running' | 'idle';
  updatedAt: string;
  intervalMinutes: number;
  maxCycles: number;
  completedCycles: number;
  failedCycles: number;
  lastRun?: FullAutoRunEvent;
};

const CONTROL_PLANE_PROVIDER_ENV_KEY = 'TNF_CONTROL_PLANE_PROVIDER';
const MASTER_CLOCK_PROVIDER_ENV_KEY = 'TNF_MASTER_CLOCK_PROVIDER';
const SUPER_CYCLE_PROVIDER_ENV_KEY = 'TNF_SUPER_CYCLE_PROVIDER';
const DEFAULT_SELF_IMPROVEMENT_BASE_URL = 'https://thenewfuse.com';
const DEFAULT_SELF_IMPROVEMENT_API_URL = 'https://api.thenewfuse.com';
const DEFAULT_FULL_AUTO_INTERVAL_MINUTES = 30;
const FULL_AUTO_STATE_PATH = path.join(repoRoot, 'docs/operations/tnf-full-auto-state.json');
const FULL_AUTO_RUN_LOG_PATH = path.join(repoRoot, 'docs/operations/tnf-full-auto-runs.jsonl');
const FULL_AUTO_DAEMON_LOG_PATH = path.join(repoRoot, 'docs/operations/tnf-full-auto-daemon.log');

const SELF_IMPROVEMENT_ARTIFACTS: SelfImprovementArtifactsIndex = {
  liveLinkCrawlJson: path.join(repoRoot, 'apps/frontend/docs/audits/live-link-crawl.json'),
  semanticAuditJson: path.join(
    repoRoot,
    'apps/frontend/docs/audits/all-routes-semantic-audit.json'
  ),
  authPathAuditJson: path.join(repoRoot, 'apps/frontend/docs/audits/auth-path-audit.json'),
  scorecardJson: path.join(repoRoot, 'apps/frontend/docs/audits/self-improvement-scorecard.json'),
  scorecardMd: path.join(repoRoot, 'apps/frontend/docs/audits/self-improvement-scorecard.md'),
  architectureMermaid: path.join(repoRoot, 'docs/architecture/tnf-master-framework.mmd'),
  runLog: path.join(repoRoot, 'docs/operations/tnf-self-improvement-run-log.md'),
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

async function runFastHarnessProtocolGate(label: string): Promise<void> {
  console.log(chalk.dim(`[TNF Harness] Protocol gate before ${label}`));
  new ProtocolInterceptor(repoRoot).runPreFlightChecks();
  await runCommand('node', ['scripts/protocols/validate-turn-zero-authority.cjs', '--mode=ci']);
}

function resolveControlPlaneProvider(
  options: { provider?: string; local?: boolean } = {},
  envKeys: string[] = []
): ControlPlaneProvider {
  if (options.local) return 'local';

  const envCandidate = envKeys
    .map((key) => normalizeToken(process.env[key]))
    .find((value): value is string => Boolean(value));
  const candidate =
    normalizeToken(options.provider) ??
    envCandidate ??
    normalizeToken(process.env[CONTROL_PLANE_PROVIDER_ENV_KEY]);
  const normalized = (candidate || 'local').toLowerCase();

  if (normalized === 'local' || normalized === 'cloud_runtime') {
    return normalized as ControlPlaneProvider;
  }
  throw new Error(
    `Unsupported provider '${candidate}'. Supported providers: local, cloud_runtime.`
  );
}

function assertCloudRuntimeAvailable(commandLabel: string): void {
  if (findExecutableOnPath('cloud_runtime')) return;
  throw new Error(
    `CloudRuntime CLI is required for '${commandLabel}' when provider is cloud_runtime. Install CloudRuntime CLI or pass --provider local.`
  );
}

function resolveSelfImprovementBaseUrl(input?: string): string {
  return (
    normalizeToken(input) ??
    normalizeToken(process.env.TNF_BASE_URL) ??
    normalizeToken(process.env.PUBLIC_BASE_URL) ??
    DEFAULT_SELF_IMPROVEMENT_BASE_URL
  );
}

function resolveSelfImprovementApiUrl(input?: string): string {
  return (
    normalizeToken(input) ??
    normalizeToken(process.env.TNF_API_BASE_URL) ??
    normalizeToken(process.env.TNF_API_BASE) ??
    normalizeToken(process.env.TNF_API_URL) ??
    normalizeToken(process.env.API_BASE_URL) ??
    DEFAULT_SELF_IMPROVEMENT_API_URL
  );
}

function parsePositiveIntegerOption(
  input: string | undefined,
  fallback: number,
  label: string
): number {
  if (typeof input === 'undefined') return fallback;
  const parsed = Number.parseInt(input, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${label} value '${input}'. Use a positive integer.`);
  }
  return parsed;
}

function parseNonNegativeIntegerOption(
  input: string | undefined,
  fallback: number,
  label: string
): number {
  if (typeof input === 'undefined') return fallback;
  const parsed = Number.parseInt(input, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid ${label} value '${input}'. Use a non-negative integer.`);
  }
  return parsed;
}

function collectSelfImprovementArtifactStatus(): SelfImprovementArtifactStatus[] {
  const tracked = [
    SELF_IMPROVEMENT_ARTIFACTS.liveLinkCrawlJson,
    SELF_IMPROVEMENT_ARTIFACTS.semanticAuditJson,
    SELF_IMPROVEMENT_ARTIFACTS.authPathAuditJson,
    SELF_IMPROVEMENT_ARTIFACTS.scorecardJson,
    SELF_IMPROVEMENT_ARTIFACTS.scorecardMd,
    SELF_IMPROVEMENT_ARTIFACTS.architectureMermaid,
    SELF_IMPROVEMENT_ARTIFACTS.runLog,
  ];
  return tracked.map((absPath) => {
    if (!fs.existsSync(absPath)) {
      return { path: absPath, exists: false, bytes: 0, updatedAt: null };
    }
    const stats = fs.statSync(absPath);
    return {
      path: absPath,
      exists: true,
      bytes: stats.size,
      updatedAt: stats.mtime.toISOString(),
    };
  });
}

function assertExpectedArtifacts(
  expectedPaths: string[],
  startedAtMs: number
): { missing: string[]; stale: string[] } {
  const missing: string[] = [];
  const stale: string[] = [];
  const freshnessFloor = startedAtMs - 2000;

  for (const artifactPath of expectedPaths) {
    if (!fs.existsSync(artifactPath)) {
      missing.push(artifactPath);
      continue;
    }
    const mtime = fs.statSync(artifactPath).mtimeMs;
    if (mtime < freshnessFloor) {
      stale.push(artifactPath);
    }
  }

  return { missing, stale };
}

function readGitOutput(args: string[]): string {
  const result = spawnSync('git', args, { cwd: repoRoot, encoding: 'utf8' });
  if (result.status !== 0) return 'unknown';
  const value = String(result.stdout || '').trim();
  return value || 'unknown';
}

function appendSelfImprovementRunLog(note: string): string {
  const logPath = SELF_IMPROVEMENT_ARTIFACTS.runLog;
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  if (!fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, '# TNF Self-Improvement Run Log\n\n', 'utf8');
  }

  const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', ' UTC');
  const branch = readGitOutput(['rev-parse', '--abbrev-ref', 'HEAD']);
  const commit = readGitOutput(['rev-parse', '--short', 'HEAD']);
  const entry = [
    `## ${timestamp}`,
    `- Note: ${note}`,
    `- Branch: ${branch}`,
    `- Commit: ${commit}`,
    '',
  ].join('\n');
  fs.appendFileSync(logPath, `${entry}\n`, 'utf8');
  return logPath;
}

function buildSelfImprovementRunCliArgs(options: SelfImprovementRunCliOptions): string[] {
  const args = ['self-improvement', 'run'];
  if (options.baseUrl) args.push('--base-url', options.baseUrl);
  if (options.apiUrl) args.push('--api-url', options.apiUrl);
  if (options.maxDepth) args.push('--max-depth', options.maxDepth);
  if (options.maxPages) args.push('--max-pages', options.maxPages);
  if (options.maxExternal) args.push('--max-external', options.maxExternal);
  if (options.skipBuild) args.push('--skip-build');
  if (options.skipLiveLinks) args.push('--skip-live-links');
  if (options.skipSemantic) args.push('--skip-semantic');
  if (options.skipAuth) args.push('--skip-auth');
  if (options.skipScorecard) args.push('--skip-scorecard');
  if (options.skipMermaid) args.push('--skip-mermaid');
  if (options.note) args.push('--note', options.note);
  if (options.superAdminToken) args.push('--super-admin-token', options.superAdminToken);
  return args;
}

function buildSelfImprovementStatusCliArgs(options: { skipStrictStatus?: boolean }): string[] {
  const args = ['self-improvement', 'status'];
  if (!options.skipStrictStatus) args.push('--strict');
  return args;
}

function ensureParentDir(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function appendJsonLine(filePath: string, payload: unknown): void {
  ensureParentDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(payload)}\n`, 'utf8');
}

function writeFullAutoState(state: FullAutoState): void {
  ensureParentDir(FULL_AUTO_STATE_PATH);
  fs.writeFileSync(FULL_AUTO_STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

function readFullAutoState(): FullAutoState | null {
  if (!fs.existsSync(FULL_AUTO_STATE_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(FULL_AUTO_STATE_PATH, 'utf8')) as FullAutoState;
  } catch {
    return null;
  }
}

function readLastJsonLine(filePath: string): any | null {
  if (!fs.existsSync(filePath)) return null;
  const lines = fs
    .readFileSync(filePath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  try {
    return JSON.parse(lines[lines.length - 1]);
  } catch {
    return null;
  }
}

async function sleepMs(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

const HOOKS_EXIT_CODES = {
  SUCCESS: 0,
  INVALID_ARGUMENTS: 2,
  RESOURCE_NOT_FOUND: 3,
  VALIDATION_FAILURE: 4,
  EXECUTION_FAILURE: 5,
  AUTHORIZATION_DENIED: 6,
  PARTIAL_SUCCESS: 7,
} as const;
const HOOK_CHAIN_NAME_PATTERN = /^[a-z0-9]([a-z0-9_-]{1,62}[a-z0-9])?$/;
const HOOK_EVENT_PATTERN = /^[a-z0-9]+(\.[a-z0-9_]+)+$/;
const HOOK_CHAIN_EXTENSIONS = new Set(['.json', '.yaml', '.yml']);
const HOOK_RUN_STATUSES = new Set([
  'queued',
  'running',
  'completed',
  'failed',
  'blocked',
  'cancelled',
  'dry_run',
]);
const HOOK_RUN_LOG_PATH =
  normalizeToken(process.env.TNF_HOOKS_RUN_LOG) ||
  (process.env.HOME
    ? path.join(process.env.HOME, '.tnf', 'hooks', 'runs.jsonl')
    : path.join(repoRoot, '.tnf', 'hooks', 'runs.jsonl'));

type HookDiagnosticLevel = 'error' | 'warning';
type HookDiagnostic = {
  level: HookDiagnosticLevel;
  code: string;
  message: string;
  path?: string;
};
type HookStepPlanEntry = {
  step: string;
  runner: string;
  condition: string;
  will_run: boolean;
  reason?: string;
};
type HookConditionResult = {
  supported: boolean;
  value: boolean;
  reason: string;
};
type HookRunRecord = Record<string, unknown> & {
  run_id: string;
  chain?: string;
  status?: string;
  trigger_event?: string | null;
  trace_id?: string | null;
  started_at?: string;
  ended_at?: string | null;
  steps?: unknown[];
};

class HookCliError extends Error {
  exitCode: number;

  constructor(message: string, exitCode: number) {
    super(message);
    this.name = 'HookCliError';
    this.exitCode = exitCode;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toHookRecord(value: unknown): Record<string, unknown> | null {
  return isPlainObject(value) ? value : null;
}

function addHookDiagnostic(
  diagnostics: HookDiagnostic[],
  level: HookDiagnosticLevel,
  code: string,
  message: string,
  path?: string
): void {
  diagnostics.push({ level, code, message, path });
}

function resolveByPath(root: unknown, pathExpression: string): unknown {
  const expression = pathExpression.trim();
  if (!expression) return undefined;
  const tokens = expression
    .split('.')
    .map((token) => token.trim())
    .filter(Boolean);
  let cursor: unknown = root;
  for (const token of tokens) {
    if (!isPlainObject(cursor) && !Array.isArray(cursor)) return undefined;
    if (!(token in (cursor as Record<string, unknown>))) return undefined;
    cursor = (cursor as Record<string, unknown>)[token];
  }
  return cursor;
}

function pickFirstString(root: unknown, candidates: string[]): string | null {
  for (const candidate of candidates) {
    const value = resolveByPath(root, candidate);
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function collectHookFilesInDir(rootDir: string): string[] {
  if (!fs.existsSync(rootDir)) return [];
  const output: string[] = [];
  const stack: string[] = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const absPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (HOOK_CHAIN_EXTENSIONS.has(ext)) {
        output.push(absPath);
      }
    }
  }

  return output.sort((a, b) => a.localeCompare(b));
}

function resolveHookRegistryDirs(): string[] {
  const cwd = process.cwd();
  const envRaw =
    normalizeToken(process.env.TNF_HOOKS_REGISTRY_DIRS) ??
    normalizeToken(process.env.TNF_HOOKS_REGISTRY_DIR) ??
    normalizeToken(process.env.TNF_HOOK_REGISTRY_DIR);
  const envDirs = (envRaw || '')
    .split(path.delimiter)
    .map((dir) => dir.trim())
    .filter(Boolean)
    .map((dir) => (path.isAbsolute(dir) ? dir : path.resolve(cwd, dir)));

  const defaults = [
    path.join(cwd, '.tnf', 'hooks'),
    path.join(repoRoot, '.tnf', 'hooks'),
    path.join(repoRoot, 'config', 'hooks'),
    process.env.HOME ? path.join(process.env.HOME, '.tnf', 'hooks') : '',
  ].filter(Boolean);

  return Array.from(new Set([...envDirs, ...defaults]));
}

async function parseYamlContent(raw: string, filePath: string): Promise<unknown> {
  const dynamicImport = new Function('specifier', 'return import(specifier);') as (
    specifier: string
  ) => Promise<any>;

  let yamlModule: any;
  try {
    yamlModule = await dynamicImport('js-yaml');
  } catch (error: any) {
    throw new HookCliError(
      `YAML parsing unavailable for ${filePath}. Install js-yaml. (${error?.message || error})`,
      HOOKS_EXIT_CODES.VALIDATION_FAILURE
    );
  }

  const loadFn =
    typeof yamlModule?.load === 'function'
      ? yamlModule.load
      : typeof yamlModule?.default?.load === 'function'
        ? yamlModule.default.load
        : null;

  if (!loadFn) {
    throw new HookCliError(
      `YAML parser is not available for ${filePath}.`,
      HOOKS_EXIT_CODES.VALIDATION_FAILURE
    );
  }

  try {
    return loadFn(raw);
  } catch (error: any) {
    throw new HookCliError(
      `Invalid YAML in ${filePath}: ${error?.message || error}`,
      HOOKS_EXIT_CODES.VALIDATION_FAILURE
    );
  }
}

async function parseJsonOrYamlFile(filePath: string): Promise<unknown> {
  const ext = path.extname(filePath).toLowerCase();
  const raw = fs.readFileSync(filePath, 'utf8');

  if (ext === '.json') {
    try {
      return JSON.parse(raw);
    } catch (error: any) {
      throw new HookCliError(
        `Invalid JSON in ${filePath}: ${error?.message || error}`,
        HOOKS_EXIT_CODES.VALIDATION_FAILURE
      );
    }
  }

  if (ext === '.yaml' || ext === '.yml') {
    return parseYamlContent(raw, filePath);
  }

  try {
    return JSON.parse(raw);
  } catch {
    return parseYamlContent(raw, filePath);
  }
}

async function findHookChainFileByName(chainName: string): Promise<string | null> {
  const normalizedName = chainName.trim();
  if (!normalizedName) return null;

  const candidateDirs = resolveHookRegistryDirs();
  for (const dir of candidateDirs) {
    for (const ext of HOOK_CHAIN_EXTENSIONS) {
      const candidate = path.join(dir, `${normalizedName}${ext}`);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
    }
  }

  for (const dir of candidateDirs) {
    const files = collectHookFilesInDir(dir);
    for (const filePath of files) {
      const base = path.basename(filePath, path.extname(filePath));
      if (base === normalizedName) {
        return filePath;
      }
    }
  }

  for (const dir of candidateDirs) {
    const files = collectHookFilesInDir(dir);
    for (const filePath of files) {
      try {
        const parsed = await parseJsonOrYamlFile(filePath);
        const chain = toHookRecord(parsed);
        const metadata = toHookRecord(chain?.metadata);
        const metadataName = metadata?.name;
        if (typeof metadataName === 'string' && metadataName.trim() === normalizedName) {
          return filePath;
        }
      } catch {
        // Ignore parse failures while searching registry files.
      }
    }
  }

  return null;
}

function validateHookChainDefinition(chainInput: unknown): HookDiagnostic[] {
  const diagnostics: HookDiagnostic[] = [];
  const chain = toHookRecord(chainInput);
  if (!chain) {
    addHookDiagnostic(
      diagnostics,
      'error',
      'CHAIN_NOT_OBJECT',
      'HookChain definition must be an object.'
    );
    return diagnostics;
  }

  if (chain.apiVersion !== 'tnf.hooks/v2') {
    addHookDiagnostic(
      diagnostics,
      'error',
      'INVALID_API_VERSION',
      "apiVersion must equal 'tnf.hooks/v2'.",
      'apiVersion'
    );
  }
  if (chain.kind !== 'HookChain') {
    addHookDiagnostic(diagnostics, 'error', 'INVALID_KIND', "kind must equal 'HookChain'.", 'kind');
  }

  const metadata = toHookRecord(chain.metadata);
  if (!metadata) {
    addHookDiagnostic(
      diagnostics,
      'error',
      'MISSING_METADATA',
      'metadata is required and must be an object.',
      'metadata'
    );
  } else {
    if (typeof metadata.name !== 'string' || !HOOK_CHAIN_NAME_PATTERN.test(metadata.name)) {
      addHookDiagnostic(
        diagnostics,
        'error',
        'INVALID_METADATA_NAME',
        'metadata.name must match ^[a-z0-9]([a-z0-9_-]{1,62}[a-z0-9])?$',
        'metadata.name'
      );
    }
    if (!Number.isInteger(metadata.version) || (metadata.version as number) < 1) {
      addHookDiagnostic(
        diagnostics,
        'error',
        'INVALID_METADATA_VERSION',
        'metadata.version must be an integer >= 1.',
        'metadata.version'
      );
    }
    if (typeof metadata.owner !== 'string' || metadata.owner.trim().length === 0) {
      addHookDiagnostic(
        diagnostics,
        'error',
        'INVALID_METADATA_OWNER',
        'metadata.owner must be a non-empty string.',
        'metadata.owner'
      );
    }
  }

  const spec = toHookRecord(chain.spec);
  if (!spec) {
    addHookDiagnostic(
      diagnostics,
      'error',
      'MISSING_SPEC',
      'spec is required and must be an object.',
      'spec'
    );
    return diagnostics;
  }

  const trigger = toHookRecord(spec.trigger);
  if (!trigger) {
    addHookDiagnostic(
      diagnostics,
      'error',
      'MISSING_TRIGGER',
      'spec.trigger is required and must be an object.',
      'spec.trigger'
    );
  } else {
    if (typeof trigger.event !== 'string' || !HOOK_EVENT_PATTERN.test(trigger.event)) {
      addHookDiagnostic(
        diagnostics,
        'error',
        'INVALID_TRIGGER_EVENT',
        'spec.trigger.event must match ^[a-z0-9]+(\\.[a-z0-9_]+)+$',
        'spec.trigger.event'
      );
    }
    if (trigger.mode !== 'async' && trigger.mode !== 'sync_gate') {
      addHookDiagnostic(
        diagnostics,
        'error',
        'INVALID_TRIGGER_MODE',
        "spec.trigger.mode must be 'async' or 'sync_gate'.",
        'spec.trigger.mode'
      );
    }
    if (typeof trigger.match !== 'undefined') {
      const match = toHookRecord(trigger.match);
      if (!match) {
        addHookDiagnostic(
          diagnostics,
          'error',
          'INVALID_TRIGGER_MATCH',
          'spec.trigger.match must be an object when provided.',
          'spec.trigger.match'
        );
      } else {
        if (
          typeof match.path_regex !== 'undefined' &&
          (typeof match.path_regex !== 'string' || match.path_regex.trim().length === 0)
        ) {
          addHookDiagnostic(
            diagnostics,
            'error',
            'INVALID_PATH_REGEX',
            'spec.trigger.match.path_regex must be a non-empty string.',
            'spec.trigger.match.path_regex'
          );
        }
        if (
          typeof match.command_regex !== 'undefined' &&
          (typeof match.command_regex !== 'string' || match.command_regex.trim().length === 0)
        ) {
          addHookDiagnostic(
            diagnostics,
            'error',
            'INVALID_COMMAND_REGEX',
            'spec.trigger.match.command_regex must be a non-empty string.',
            'spec.trigger.match.command_regex'
          );
        }
        if (typeof match.source_in !== 'undefined') {
          if (!Array.isArray(match.source_in) || match.source_in.length === 0) {
            addHookDiagnostic(
              diagnostics,
              'error',
              'INVALID_SOURCE_IN',
              'spec.trigger.match.source_in must be a non-empty array when provided.',
              'spec.trigger.match.source_in'
            );
          } else {
            for (let i = 0; i < match.source_in.length; i += 1) {
              if (
                typeof match.source_in[i] !== 'string' ||
                match.source_in[i].trim().length === 0
              ) {
                addHookDiagnostic(
                  diagnostics,
                  'error',
                  'INVALID_SOURCE_IN_ITEM',
                  'spec.trigger.match.source_in items must be non-empty strings.',
                  `spec.trigger.match.source_in.${i}`
                );
              }
            }
          }
        }
      }
    }

    if (typeof trigger.dedupe !== 'undefined') {
      const dedupe = toHookRecord(trigger.dedupe);
      if (!dedupe) {
        addHookDiagnostic(
          diagnostics,
          'error',
          'INVALID_TRIGGER_DEDUPE',
          'spec.trigger.dedupe must be an object when provided.',
          'spec.trigger.dedupe'
        );
      } else {
        if (typeof dedupe.key !== 'string' || dedupe.key.trim().length === 0) {
          addHookDiagnostic(
            diagnostics,
            'error',
            'INVALID_DEDUPE_KEY',
            'spec.trigger.dedupe.key must be a non-empty string.',
            'spec.trigger.dedupe.key'
          );
        }
        if (!Number.isInteger(dedupe.window_ms) || (dedupe.window_ms as number) < 0) {
          addHookDiagnostic(
            diagnostics,
            'error',
            'INVALID_DEDUPE_WINDOW',
            'spec.trigger.dedupe.window_ms must be an integer >= 0.',
            'spec.trigger.dedupe.window_ms'
          );
        }
      }
    }
  }

  const execution = toHookRecord(spec.execution);
  if (!execution) {
    addHookDiagnostic(
      diagnostics,
      'error',
      'MISSING_EXECUTION',
      'spec.execution is required and must be an object.',
      'spec.execution'
    );
  } else {
    if (!Number.isInteger(execution.max_run_time_ms) || (execution.max_run_time_ms as number) < 1) {
      addHookDiagnostic(
        diagnostics,
        'error',
        'INVALID_MAX_RUN_TIME',
        'spec.execution.max_run_time_ms must be an integer >= 1.',
        'spec.execution.max_run_time_ms'
      );
    }
    const concurrency = execution.concurrency;
    if (!['unbounded', 'single_per_key', 'fixed'].includes(String(concurrency || ''))) {
      addHookDiagnostic(
        diagnostics,
        'error',
        'INVALID_CONCURRENCY',
        "spec.execution.concurrency must be 'unbounded', 'single_per_key', or 'fixed'.",
        'spec.execution.concurrency'
      );
    }
    if (execution.concurrency === 'fixed') {
      if (
        !Number.isInteger(execution.fixed_concurrency) ||
        (execution.fixed_concurrency as number) < 1
      ) {
        addHookDiagnostic(
          diagnostics,
          'error',
          'INVALID_FIXED_CONCURRENCY',
          'spec.execution.fixed_concurrency must be an integer >= 1 when concurrency=fixed.',
          'spec.execution.fixed_concurrency'
        );
      }
    }
    if (!['fail', 'continue'].includes(String(execution.on_chain_error || ''))) {
      addHookDiagnostic(
        diagnostics,
        'error',
        'INVALID_CHAIN_ERROR_POLICY',
        "spec.execution.on_chain_error must be 'fail' or 'continue'.",
        'spec.execution.on_chain_error'
      );
    }
  }

  const context = toHookRecord(spec.context);
  if (!context) {
    addHookDiagnostic(
      diagnostics,
      'error',
      'MISSING_CONTEXT',
      'spec.context is required and must be an object.',
      'spec.context'
    );
  } else {
    if (!['immutable', 'mutable'].includes(String(context.model || ''))) {
      addHookDiagnostic(
        diagnostics,
        'error',
        'INVALID_CONTEXT_MODEL',
        "spec.context.model must be 'immutable' or 'mutable'.",
        'spec.context.model'
      );
    }
    if (
      typeof context.write_root !== 'string' ||
      !/^[a-zA-Z0-9_.-]+$/.test(context.write_root || '')
    ) {
      addHookDiagnostic(
        diagnostics,
        'error',
        'INVALID_CONTEXT_WRITE_ROOT',
        'spec.context.write_root must match ^[a-zA-Z0-9_.-]+$',
        'spec.context.write_root'
      );
    }
  }

  const steps = Array.isArray(spec.steps) ? spec.steps : null;
  if (!steps || steps.length === 0) {
    addHookDiagnostic(
      diagnostics,
      'error',
      'MISSING_STEPS',
      'spec.steps must be a non-empty array.',
      'spec.steps'
    );
  } else {
    const seenStepIds = new Set<string>();
    for (let i = 0; i < steps.length; i += 1) {
      const stepPath = `spec.steps.${i}`;
      const step = toHookRecord(steps[i]);
      if (!step) {
        addHookDiagnostic(
          diagnostics,
          'error',
          'INVALID_STEP',
          'Each step must be an object.',
          stepPath
        );
        continue;
      }

      const stepId = step.id;
      if (typeof stepId !== 'string' || !HOOK_CHAIN_NAME_PATTERN.test(stepId)) {
        addHookDiagnostic(
          diagnostics,
          'error',
          'INVALID_STEP_ID',
          'step.id must match ^[a-z0-9]([a-z0-9_-]{1,62}[a-z0-9])?$',
          `${stepPath}.id`
        );
      } else if (seenStepIds.has(stepId)) {
        addHookDiagnostic(
          diagnostics,
          'error',
          'DUPLICATE_STEP_ID',
          `Duplicate step id '${stepId}'.`,
          `${stepPath}.id`
        );
      } else {
        seenStepIds.add(stepId);
      }

      if (
        typeof step.runner !== 'string' ||
        !['shell', 'node', 'agent', 'mcp', 'webhook'].includes(step.runner)
      ) {
        addHookDiagnostic(
          diagnostics,
          'error',
          'INVALID_STEP_RUNNER',
          'step.runner must be one of: shell, node, agent, mcp, webhook.',
          `${stepPath}.runner`
        );
      }
      if (!Number.isInteger(step.timeout_ms) || (step.timeout_ms as number) < 1) {
        addHookDiagnostic(
          diagnostics,
          'error',
          'INVALID_STEP_TIMEOUT',
          'step.timeout_ms must be an integer >= 1.',
          `${stepPath}.timeout_ms`
        );
      }
      if (typeof step.if !== 'string' || step.if.trim().length === 0) {
        addHookDiagnostic(
          diagnostics,
          'error',
          'INVALID_STEP_CONDITION',
          'step.if must be a non-empty string.',
          `${stepPath}.if`
        );
      }
      if (
        typeof step.on_failure !== 'string' ||
        !['stop', 'continue', 'branch'].includes(step.on_failure)
      ) {
        addHookDiagnostic(
          diagnostics,
          'error',
          'INVALID_ON_FAILURE',
          'step.on_failure must be one of: stop, continue, branch.',
          `${stepPath}.on_failure`
        );
      }

      if (step.runner === 'shell') {
        if (typeof step.command !== 'string' || step.command.trim().length === 0) {
          addHookDiagnostic(
            diagnostics,
            'error',
            'MISSING_SHELL_COMMAND',
            'shell runner requires non-empty command.',
            `${stepPath}.command`
          );
        }
      } else if (step.runner === 'node') {
        if (typeof step.module !== 'string' || step.module.trim().length === 0) {
          addHookDiagnostic(
            diagnostics,
            'error',
            'MISSING_NODE_MODULE',
            'node runner requires module.',
            `${stepPath}.module`
          );
        }
        if (typeof step.function !== 'string' || step.function.trim().length === 0) {
          addHookDiagnostic(
            diagnostics,
            'error',
            'MISSING_NODE_FUNCTION',
            'node runner requires function.',
            `${stepPath}.function`
          );
        }
      } else if (step.runner === 'agent') {
        const selector = toHookRecord(step.agent_selector);
        if (!selector) {
          addHookDiagnostic(
            diagnostics,
            'error',
            'MISSING_AGENT_SELECTOR',
            'agent runner requires agent_selector.',
            `${stepPath}.agent_selector`
          );
        } else {
          if (
            typeof selector.type !== 'string' ||
            !['id', 'role', 'capability'].includes(selector.type)
          ) {
            addHookDiagnostic(
              diagnostics,
              'error',
              'INVALID_AGENT_SELECTOR_TYPE',
              'agent_selector.type must be one of: id, role, capability.',
              `${stepPath}.agent_selector.type`
            );
          }
          if (typeof selector.value !== 'string' || selector.value.trim().length === 0) {
            addHookDiagnostic(
              diagnostics,
              'error',
              'INVALID_AGENT_SELECTOR_VALUE',
              'agent_selector.value must be a non-empty string.',
              `${stepPath}.agent_selector.value`
            );
          }
        }
        if (typeof step.prompt !== 'string' || step.prompt.trim().length === 0) {
          addHookDiagnostic(
            diagnostics,
            'error',
            'MISSING_AGENT_PROMPT',
            'agent runner requires prompt.',
            `${stepPath}.prompt`
          );
        }
      } else if (step.runner === 'mcp') {
        if (typeof step.tool !== 'string' || step.tool.trim().length === 0) {
          addHookDiagnostic(
            diagnostics,
            'error',
            'MISSING_MCP_TOOL',
            'mcp runner requires tool.',
            `${stepPath}.tool`
          );
        }
      } else if (step.runner === 'webhook') {
        if (typeof step.url !== 'string' || step.url.trim().length === 0) {
          addHookDiagnostic(
            diagnostics,
            'error',
            'MISSING_WEBHOOK_URL',
            'webhook runner requires url.',
            `${stepPath}.url`
          );
        }
        if (
          typeof step.method !== 'string' ||
          !['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(step.method)
        ) {
          addHookDiagnostic(
            diagnostics,
            'error',
            'INVALID_WEBHOOK_METHOD',
            'webhook runner method must be one of: GET, POST, PUT, PATCH, DELETE.',
            `${stepPath}.method`
          );
        }
      }

      if (typeof step.retry !== 'undefined') {
        const retry = toHookRecord(step.retry);
        if (!retry) {
          addHookDiagnostic(
            diagnostics,
            'error',
            'INVALID_RETRY',
            'step.retry must be an object when provided.',
            `${stepPath}.retry`
          );
        } else {
          if (!Number.isInteger(retry.max_attempts) || (retry.max_attempts as number) < 0) {
            addHookDiagnostic(
              diagnostics,
              'error',
              'INVALID_RETRY_MAX_ATTEMPTS',
              'retry.max_attempts must be an integer >= 0.',
              `${stepPath}.retry.max_attempts`
            );
          }
          if (
            typeof retry.backoff_ms !== 'undefined' &&
            (!Number.isInteger(retry.backoff_ms) || (retry.backoff_ms as number) < 0)
          ) {
            addHookDiagnostic(
              diagnostics,
              'error',
              'INVALID_RETRY_BACKOFF',
              'retry.backoff_ms must be an integer >= 0 when provided.',
              `${stepPath}.retry.backoff_ms`
            );
          }
        }
      }
    }
  }

  const security = toHookRecord(spec.security);
  if (!security) {
    addHookDiagnostic(
      diagnostics,
      'error',
      'MISSING_SECURITY',
      'spec.security is required and must be an object.',
      'spec.security'
    );
  } else {
    if (typeof security.policy_pack !== 'string' || security.policy_pack.trim().length === 0) {
      addHookDiagnostic(
        diagnostics,
        'error',
        'INVALID_POLICY_PACK',
        'spec.security.policy_pack must be a non-empty string.',
        'spec.security.policy_pack'
      );
    }
    if (
      typeof security.approval_policy !== 'string' ||
      !['none', 'on_high_risk', 'always'].includes(security.approval_policy)
    ) {
      addHookDiagnostic(
        diagnostics,
        'error',
        'INVALID_APPROVAL_POLICY',
        'spec.security.approval_policy must be one of: none, on_high_risk, always.',
        'spec.security.approval_policy'
      );
    }
  }

  return diagnostics;
}

function extractEventType(event: Record<string, unknown>): string | null {
  return pickFirstString(event, [
    'event_type',
    'eventType',
    'event',
    'type',
    'payload.event_type',
    'payload.type',
  ]);
}

function evaluateHookTriggerMatch(
  chain: Record<string, unknown>,
  event: Record<string, unknown>,
  diagnostics: HookDiagnostic[]
): { matched: boolean; expectedEvent: string | null; receivedEvent: string | null } {
  const spec = toHookRecord(chain.spec);
  const trigger = toHookRecord(spec?.trigger);
  const expectedEvent = typeof trigger?.event === 'string' ? trigger.event : null;
  const receivedEvent = extractEventType(event);
  let matched = true;

  if (expectedEvent && receivedEvent && expectedEvent !== receivedEvent) {
    matched = false;
    addHookDiagnostic(
      diagnostics,
      'warning',
      'TRIGGER_EVENT_MISMATCH',
      `Trigger event '${expectedEvent}' does not match fixture event '${receivedEvent}'.`,
      'spec.trigger.event'
    );
  } else if (expectedEvent && !receivedEvent) {
    matched = false;
    addHookDiagnostic(
      diagnostics,
      'warning',
      'EVENT_TYPE_MISSING',
      'Event fixture has no detectable event type.',
      'event'
    );
  }

  const match = toHookRecord(trigger?.match);
  if (!match) {
    return { matched, expectedEvent, receivedEvent };
  }

  if (typeof match.path_regex === 'string') {
    const pathCandidate = pickFirstString(event, [
      'filepath',
      'path',
      'file.path',
      'payload.filepath',
      'payload.path',
      'payload.file.path',
    ]);
    if (!pathCandidate) {
      matched = false;
      addHookDiagnostic(
        diagnostics,
        'warning',
        'MATCH_PATH_MISSING',
        'Trigger defines path_regex but event fixture has no filepath/path value.',
        'spec.trigger.match.path_regex'
      );
    } else {
      try {
        if (!new RegExp(match.path_regex).test(pathCandidate)) {
          matched = false;
          addHookDiagnostic(
            diagnostics,
            'warning',
            'MATCH_PATH_REGEX_MISS',
            `Event path '${pathCandidate}' does not match path_regex.`,
            'spec.trigger.match.path_regex'
          );
        }
      } catch (error: any) {
        matched = false;
        addHookDiagnostic(
          diagnostics,
          'error',
          'INVALID_MATCH_PATH_REGEX',
          `Invalid path_regex: ${error?.message || error}`,
          'spec.trigger.match.path_regex'
        );
      }
    }
  }

  if (typeof match.command_regex === 'string') {
    const commandCandidate = pickFirstString(event, ['command', 'payload.command', 'payload.cmd']);
    if (!commandCandidate) {
      matched = false;
      addHookDiagnostic(
        diagnostics,
        'warning',
        'MATCH_COMMAND_MISSING',
        'Trigger defines command_regex but event fixture has no command value.',
        'spec.trigger.match.command_regex'
      );
    } else {
      try {
        if (!new RegExp(match.command_regex).test(commandCandidate)) {
          matched = false;
          addHookDiagnostic(
            diagnostics,
            'warning',
            'MATCH_COMMAND_REGEX_MISS',
            `Event command does not match command_regex.`,
            'spec.trigger.match.command_regex'
          );
        }
      } catch (error: any) {
        matched = false;
        addHookDiagnostic(
          diagnostics,
          'error',
          'INVALID_MATCH_COMMAND_REGEX',
          `Invalid command_regex: ${error?.message || error}`,
          'spec.trigger.match.command_regex'
        );
      }
    }
  }

  if (Array.isArray(match.source_in) && match.source_in.length > 0) {
    const sourceCandidate = pickFirstString(event, ['source', 'payload.source']);
    if (!sourceCandidate) {
      matched = false;
      addHookDiagnostic(
        diagnostics,
        'warning',
        'MATCH_SOURCE_MISSING',
        'Trigger defines source_in but event fixture has no source value.',
        'spec.trigger.match.source_in'
      );
    } else if (!match.source_in.includes(sourceCandidate)) {
      matched = false;
      addHookDiagnostic(
        diagnostics,
        'warning',
        'MATCH_SOURCE_MISS',
        `Event source '${sourceCandidate}' is not allowed by source_in.`,
        'spec.trigger.match.source_in'
      );
    }
  }

  return { matched, expectedEvent, receivedEvent };
}

function evaluateHookCondition(
  rawCondition: string,
  stepState: Record<string, { success: boolean }>
): HookConditionResult {
  const condition = rawCondition.trim();
  if (!condition) {
    return { supported: false, value: false, reason: 'empty condition expression' };
  }
  if (condition === 'true') {
    return { supported: true, value: true, reason: 'literal true' };
  }
  if (condition === 'false') {
    return { supported: true, value: false, reason: 'literal false' };
  }

  const explicitComparison = condition.match(
    /^steps\.([a-z0-9]([a-z0-9_-]{1,62}[a-z0-9])?)\.success\s*(==|!=)\s*(true|false)$/i
  );
  if (explicitComparison) {
    const stepId = explicitComparison[1];
    const operator = explicitComparison[3];
    const expected = explicitComparison[4].toLowerCase() === 'true';
    const resolved = stepState[stepId];
    if (!resolved) {
      return { supported: false, value: false, reason: `unknown step reference '${stepId}'` };
    }
    const value = operator === '==' ? resolved.success === expected : resolved.success !== expected;
    return {
      supported: true,
      value,
      reason: value
        ? 'expression true'
        : `expression false (${stepId}.success=${resolved.success})`,
    };
  }

  const implicitBoolean = condition.match(
    /^(!)?steps\.([a-z0-9]([a-z0-9_-]{1,62}[a-z0-9])?)\.success$/i
  );
  if (implicitBoolean) {
    const negate = Boolean(implicitBoolean[1]);
    const stepId = implicitBoolean[2];
    const resolved = stepState[stepId];
    if (!resolved) {
      return { supported: false, value: false, reason: `unknown step reference '${stepId}'` };
    }
    const value = negate ? !resolved.success : resolved.success;
    return {
      supported: true,
      value,
      reason: value
        ? 'expression true'
        : `expression false (${stepId}.success=${resolved.success})`,
    };
  }

  return {
    supported: false,
    value: false,
    reason: 'unsupported condition expression (supports literals and steps.<id>.success checks)',
  };
}

function collectStringLeaves(
  value: unknown,
  pathPrefix: string,
  output: Array<{ path: string; value: string }>
): void {
  if (typeof value === 'string') {
    output.push({ path: pathPrefix, value });
    return;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      collectStringLeaves(value[i], `${pathPrefix}.${i}`, output);
    }
    return;
  }
  if (isPlainObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      const childPath = pathPrefix ? `${pathPrefix}.${key}` : key;
      collectStringLeaves(child, childPath, output);
    }
  }
}

function resolveTemplateValue(scope: Record<string, unknown>, expression: string): unknown {
  const expr = expression.trim();
  if (!expr) return undefined;
  const direct = resolveByPath(scope, expr);
  if (typeof direct !== 'undefined') return direct;
  if (expr.startsWith('event.')) {
    return resolveByPath(scope, `event.payload.${expr.slice('event.'.length)}`);
  }
  return undefined;
}

function collectUnresolvedTemplates(
  step: Record<string, unknown>,
  scope: Record<string, unknown>
): Array<{ field: string; expression: string }> {
  const leaves: Array<{ path: string; value: string }> = [];
  collectStringLeaves(step, '', leaves);

  const unresolved: Array<{ field: string; expression: string }> = [];
  for (const leaf of leaves) {
    const matches = leaf.value.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g);
    for (const match of matches) {
      const expression = (match[1] || '').trim();
      if (!expression) continue;
      const resolved = resolveTemplateValue(scope, expression);
      if (typeof resolved === 'undefined') {
        unresolved.push({ field: leaf.path, expression });
      }
    }
  }

  return unresolved;
}

function buildHookStepPlan(
  chain: Record<string, unknown>,
  event: Record<string, unknown>,
  triggerMatched: boolean,
  diagnostics: HookDiagnostic[]
): HookStepPlanEntry[] {
  const spec = toHookRecord(chain.spec);
  const steps = (spec?.steps || []) as unknown[];
  const plan: HookStepPlanEntry[] = [];
  const stepState: Record<string, { success: boolean }> = {};

  for (let i = 0; i < steps.length; i += 1) {
    const stepRaw = toHookRecord(steps[i]) || {};
    const stepId = typeof stepRaw.id === 'string' ? stepRaw.id : `step_${i + 1}`;
    const runner = typeof stepRaw.runner === 'string' ? stepRaw.runner : 'unknown';
    const condition = typeof stepRaw.if === 'string' ? stepRaw.if : 'false';

    if (!triggerMatched) {
      plan.push({
        step: stepId,
        runner,
        condition,
        will_run: false,
        reason: 'trigger mismatch',
      });
      stepState[stepId] = { success: false };
      continue;
    }

    const conditionResult = evaluateHookCondition(condition, stepState);
    if (!conditionResult.supported) {
      addHookDiagnostic(
        diagnostics,
        'warning',
        'UNSUPPORTED_CONDITION',
        `Step '${stepId}' condition could not be evaluated: ${conditionResult.reason}`,
        `spec.steps.${i}.if`
      );
    }

    let willRun = conditionResult.supported && conditionResult.value;
    let reason = willRun ? 'condition true' : conditionResult.reason;

    const templateScope: Record<string, unknown> = {
      event,
      steps: Object.fromEntries(
        Object.entries(stepState).map(([id, state]) => [id, { success: state.success }])
      ),
    };
    const unresolved = collectUnresolvedTemplates(stepRaw, templateScope);
    if (unresolved.length > 0) {
      willRun = false;
      reason = 'unresolved templates';
      for (const miss of unresolved) {
        addHookDiagnostic(
          diagnostics,
          'warning',
          'UNRESOLVED_TEMPLATE',
          `Step '${stepId}' has unresolved template '{{${miss.expression}}}' in ${miss.field}.`,
          `spec.steps.${i}.${miss.field}`
        );
      }
    }

    plan.push({
      step: stepId,
      runner,
      condition,
      will_run: willRun,
      reason,
    });
    stepState[stepId] = { success: willRun };
  }

  return plan;
}

function mapHookRunnerToWorkflowNodeType(runner: string): string {
  switch (runner) {
    case 'shell':
      return 'sandbox_execution';
    case 'node':
      return 'transform';
    case 'agent':
      return 'agent_task';
    case 'mcp':
      return 'mcp-tool';
    case 'webhook':
      return 'webhook';
    default:
      return 'custom';
  }
}

function buildWorkflowProjection(
  chain: Record<string, unknown>,
  plan: HookStepPlanEntry[]
): Record<string, unknown> {
  const spec = toHookRecord(chain.spec) || {};
  const trigger = toHookRecord(spec.trigger) || {};
  const execution = toHookRecord(spec.execution) || {};
  const stepList = Array.isArray(spec.steps) ? spec.steps : [];

  const nodes: Array<Record<string, unknown>> = [];
  const connections: Array<Record<string, unknown>> = [];

  nodes.push({
    id: 'start',
    type: 'start',
    name: 'HookChain Start',
    description: 'Synthetic start node for HookChain projection',
    position: { x: 0, y: 0 },
    config: {},
    inputs: [],
    outputs: [{ id: 'out', name: 'event', type: 'object' }],
    metadata: { generated_by: 'tnf hooks test' },
  });

  let previousNodeId = 'start';
  let previousOutputId = 'out';
  for (let i = 0; i < stepList.length; i += 1) {
    const step = toHookRecord(stepList[i]) || {};
    const stepId = typeof step.id === 'string' ? step.id : `step_${i + 1}`;
    const nodeId = `hook_${stepId}`;
    const nodeType = mapHookRunnerToWorkflowNodeType(
      typeof step.runner === 'string' ? step.runner : 'custom'
    );
    const planEntry = plan.find((entry) => entry.step === stepId);

    nodes.push({
      id: nodeId,
      type: nodeType,
      name: stepId,
      description: `Hook step '${stepId}' (${String(step.runner || 'unknown')})`,
      position: { x: (i + 1) * 280, y: 140 },
      config: {
        runner: step.runner || 'unknown',
        timeout_ms: step.timeout_ms ?? null,
        command: step.command ?? null,
        module: step.module ?? null,
        function: step.function ?? null,
        tool: step.tool ?? null,
        url: step.url ?? null,
        method: step.method ?? null,
        on_failure: step.on_failure ?? null,
      },
      inputs: [{ id: 'in', name: 'input', type: 'object', required: false }],
      outputs: [{ id: 'success', name: 'success', type: 'boolean' }],
      conditions:
        typeof step.if === 'string' && step.if.trim().length > 0
          ? [{ id: `cond_${stepId}`, expression: step.if, outputId: 'success' }]
          : [],
      retry:
        toHookRecord(step.retry) && typeof toHookRecord(step.retry)?.max_attempts === 'number'
          ? {
              enabled: (toHookRecord(step.retry)?.max_attempts as number) > 0,
              maxAttempts: toHookRecord(step.retry)?.max_attempts ?? 0,
              delayMs: toHookRecord(step.retry)?.backoff_ms ?? 0,
              backoffMultiplier: 1,
              maxDelayMs: toHookRecord(step.retry)?.backoff_ms ?? 0,
            }
          : undefined,
      timeout: typeof step.timeout_ms === 'number' ? step.timeout_ms : undefined,
      metadata: {
        generated_by: 'tnf hooks test',
        hook_step_id: stepId,
        condition: step.if ?? null,
        projected_will_run: planEntry?.will_run ?? false,
        projected_reason: planEntry?.reason ?? null,
      },
    });

    connections.push({
      id: `conn_${previousNodeId}_to_${nodeId}`,
      sourceNodeId: previousNodeId,
      sourceOutputId: previousOutputId,
      targetNodeId: nodeId,
      targetInputId: 'in',
      metadata: { generated_by: 'tnf hooks test' },
    });

    previousNodeId = nodeId;
    previousOutputId = 'success';
  }

  nodes.push({
    id: 'end',
    type: 'end',
    name: 'HookChain End',
    description: 'Synthetic end node for HookChain projection',
    position: { x: (stepList.length + 1) * 280, y: 140 },
    config: {},
    inputs: [{ id: 'in', name: 'input', type: 'object', required: false }],
    outputs: [],
    metadata: { generated_by: 'tnf hooks test' },
  });

  connections.push({
    id: `conn_${previousNodeId}_to_end`,
    sourceNodeId: previousNodeId,
    sourceOutputId: previousOutputId,
    targetNodeId: 'end',
    targetInputId: 'in',
    metadata: { generated_by: 'tnf hooks test' },
  });

  return {
    version: 'hookchain.v2-projection.1',
    nodes,
    connections,
    variables: [],
    triggers: [
      {
        id: 'hook_trigger',
        type: 'agent_event',
        name: typeof trigger.event === 'string' ? trigger.event : 'hook.trigger',
        enabled: true,
        config: {
          event: trigger.event ?? null,
          mode: trigger.mode ?? null,
          match: trigger.match ?? null,
        },
        conditions: [],
      },
    ],
    settings: {
      parallel: false,
      maxConcurrentExecutions:
        execution.concurrency === 'fixed' && typeof execution.fixed_concurrency === 'number'
          ? execution.fixed_concurrency
          : 1,
      timeoutMs: typeof execution.max_run_time_ms === 'number' ? execution.max_run_time_ms : 600000,
      retryPolicy: {
        enabled: true,
        maxAttempts: 1,
        delayMs: 0,
        backoffMultiplier: 1,
        maxDelayMs: 0,
      },
      errorHandling: {
        onError: execution.on_chain_error === 'continue' ? 'continue' : 'stop',
        captureErrors: true,
        notifyOnError: false,
      },
      logging: {
        level: 'info',
        includeInputs: false,
        includeOutputs: true,
        includeTiming: true,
        retentionDays: 14,
      },
      notifications: {
        onStart: false,
        onComplete: false,
        onError: false,
        channels: [],
      },
    },
  };
}

function formatHookDiagnostics(
  diagnostics: HookDiagnostic[],
  level: HookDiagnosticLevel
): Array<{ code: string; message: string; path?: string }> {
  return diagnostics
    .filter((entry) => entry.level === level)
    .map((entry) => ({
      code: entry.code,
      message: entry.message,
      ...(entry.path ? { path: entry.path } : {}),
    }));
}

function parseHookDurationMs(raw: string | undefined): number | null {
  if (!raw) return null;
  const match = raw.trim().match(/^(\d+)(ms|s|m|h|d)$/i);
  if (!match) return null;
  const amount = Number.parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  if (!Number.isFinite(amount)) return null;
  switch (unit) {
    case 'ms':
      return amount;
    case 's':
      return amount * 1000;
    case 'm':
      return amount * 60 * 1000;
    case 'h':
      return amount * 60 * 60 * 1000;
    case 'd':
      return amount * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}

function createHookRunId(prefix = 'run'): string {
  const seed = `${Date.now()}:${process.pid}:${Math.random()}`;
  const digest = createHash('sha256').update(seed).digest('hex').slice(0, 10);
  return `${prefix}_${Date.now().toString(36)}_${digest}`;
}

function readHookRunRecords(filePath = HOOK_RUN_LOG_PATH): HookRunRecord[] {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8');
  const records: HookRunRecord[] = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (isPlainObject(parsed) && typeof parsed.run_id === 'string') {
        records.push(parsed as HookRunRecord);
      }
    } catch {
      // Ignore corrupt historical lines; logs should be readable even after partial writes.
    }
  }
  return records;
}

function writeHookRunRecord(record: HookRunRecord): void {
  appendJsonLine(HOOK_RUN_LOG_PATH, record);
}

function findHookRunRecord(runId: string): HookRunRecord | null {
  const records = readHookRunRecords();
  for (let i = records.length - 1; i >= 0; i -= 1) {
    if (records[i].run_id === runId) return records[i];
  }
  return null;
}

function normalizeHookStatus(raw: string | undefined): string | null {
  const normalized = normalizeToken(raw)?.toLowerCase();
  if (!normalized) return null;
  return HOOK_RUN_STATUSES.has(normalized) ? normalized : null;
}

function filterHookRunRecords(
  records: HookRunRecord[],
  options: {
    run?: string;
    chain?: string;
    since?: string;
    limit?: string;
    status?: string;
    step?: string;
    tenant?: string;
    traceId?: string;
  }
): HookRunRecord[] {
  const run = normalizeToken(options.run);
  const chain = normalizeToken(options.chain);
  const step = normalizeToken(options.step);
  const tenant = normalizeToken(options.tenant);
  const traceId = normalizeToken(options.traceId);
  const status = normalizeHookStatus(options.status);
  const sinceMs = parseHookDurationMs(options.since);
  const sinceCutoff = sinceMs == null ? null : Date.now() - sinceMs;
  const limitRaw = Number.parseInt(options.limit || '50', 10);
  const limit = Math.max(1, Math.min(1000, Number.isFinite(limitRaw) ? limitRaw : 50));

  return records
    .filter((record) => {
      if (run && record.run_id !== run) return false;
      if (chain && String(record.chain || '') !== chain) return false;
      if (status && String(record.status || '').toLowerCase() !== status) return false;
      if (tenant && String(record.tenant || '') !== tenant) return false;
      if (traceId && String(record.trace_id || '') !== traceId) return false;
      if (sinceCutoff != null) {
        const stamp = Date.parse(String(record.started_at || record.queued_at || ''));
        if (!Number.isFinite(stamp) || stamp < sinceCutoff) return false;
      }
      if (step) {
        const steps = Array.isArray(record.steps) ? record.steps : [];
        const hasStep = steps.some((entry) => {
          const stepRecord = toHookRecord(entry);
          return String(stepRecord?.id || stepRecord?.step || '') === step;
        });
        if (!hasStep) return false;
      }
      return true;
    })
    .slice(-limit)
    .reverse();
}

function printHookLogsSummary(payload: Record<string, unknown>): void {
  const records = Array.isArray(payload.records) ? payload.records : [];
  console.log(chalk.bold('\nHookChain Logs\n'));
  console.log(`Store: ${chalk.dim(String(payload.store || HOOK_RUN_LOG_PATH))}`);
  console.log(`Records: ${chalk.cyan(String(records.length))}\n`);
  for (const record of records as HookRunRecord[]) {
    const status = String(record.status || 'unknown');
    const statusText =
      status === 'completed'
        ? chalk.green(status)
        : status === 'failed' || status === 'blocked'
          ? chalk.red(status)
          : chalk.yellow(status);
    console.log(
      `- ${chalk.cyan(record.run_id)} ${statusText} ${chalk.dim(
        String(record.started_at || record.queued_at || '')
      )}`
    );
    console.log(
      `  chain=${String(record.chain || 'unknown')} event=${String(
        record.trigger_event || 'unknown'
      )} trace=${String(record.trace_id || 'none')}`
    );
    const steps = Array.isArray(record.steps) ? record.steps : [];
    if (steps.length > 0) {
      console.log(`  steps=${steps.length}`);
    }
  }
  console.log('');
}

function deriveHookDecisionReason(record: HookRunRecord): string {
  const status = String(record.status || 'unknown').toLowerCase();
  if (status === 'blocked') return 'REQUIRE_APPROVAL_OR_POLICY_BLOCK';
  if (status === 'failed') return 'HOOK_RUN_FAILED';
  if (status === 'cancelled') return 'HOOK_RUN_CANCELLED';
  if (status === 'completed') return 'HOOK_RUN_COMPLETED';
  if (status === 'dry_run') return 'DRY_RUN_NO_SIDE_EFFECTS';
  if (status === 'queued') return 'REPLAY_QUEUED';
  return 'STATUS_UNKNOWN';
}

function buildHookExplainPayload(
  record: HookRunRecord,
  options: { step?: string; showPolicySource?: boolean } = {}
): Record<string, unknown> {
  const stepFilter = normalizeToken(options.step);
  const steps = (Array.isArray(record.steps) ? record.steps : [])
    .map((entry) => toHookRecord(entry))
    .filter(Boolean) as Array<Record<string, unknown>>;
  const filteredSteps = stepFilter
    ? steps.filter((entry) => String(entry.id || entry.step || '') === stepFilter)
    : steps;
  const warnings = Array.isArray(record.warnings) ? record.warnings : [];
  const errors = Array.isArray(record.errors) ? record.errors : [];
  const gateDecisions = Array.isArray(record.gate_decisions)
    ? record.gate_decisions
    : [
        {
          gate: 'hook-run-status',
          decision:
            String(record.status || '').toLowerCase() === 'blocked'
              ? 'DENY_OR_REQUIRE_APPROVAL'
              : errors.length > 0
                ? 'FAIL'
                : 'ALLOW',
          reason: deriveHookDecisionReason(record),
          ...(options.showPolicySource
            ? { policy_source: record.policy_pack || record.security_policy || null }
            : {}),
        },
      ];

  return {
    run_id: record.run_id,
    decision_summary: {
      final_status: record.status || 'unknown',
      reason: deriveHookDecisionReason(record),
      warning_count: warnings.length,
      error_count: errors.length,
    },
    gate_decisions: gateDecisions,
    step_analysis: filteredSteps.map((step) => ({
      id: step.id || step.step || 'unknown',
      status: step.status || (step.will_run === false ? 'skipped' : 'unknown'),
      runner: step.runner || null,
      reason: step.reason || step.error || null,
      duration_ms: step.duration_ms ?? null,
      attempt: step.attempt ?? null,
    })),
    warnings,
    errors,
    source: {
      log_path: HOOK_RUN_LOG_PATH,
      trace_id: record.trace_id || null,
      chain: record.chain || null,
      source_run_id: record.source_run_id || null,
    },
  };
}

function printHookExplainSummary(payload: Record<string, unknown>): void {
  const summary = toHookRecord(payload.decision_summary) || {};
  const gates = Array.isArray(payload.gate_decisions) ? payload.gate_decisions : [];
  const steps = Array.isArray(payload.step_analysis) ? payload.step_analysis : [];
  console.log(chalk.bold('\nHookChain Explain\n'));
  console.log(`Run: ${chalk.cyan(String(payload.run_id || 'unknown'))}`);
  console.log(
    `Status: ${chalk.yellow(String(summary.final_status || 'unknown'))} (${String(
      summary.reason || 'unknown'
    )})`
  );
  if (gates.length > 0) {
    console.log(chalk.bold('\nGate Decisions:'));
    for (const gate of gates as Array<Record<string, unknown>>) {
      console.log(
        `- ${String(gate.gate || 'gate')}: ${chalk.cyan(
          String(gate.decision || 'unknown')
        )} ${chalk.dim(String(gate.reason || ''))}`
      );
    }
  }
  if (steps.length > 0) {
    console.log(chalk.bold('\nSteps:'));
    for (const step of steps as Array<Record<string, unknown>>) {
      console.log(
        `- ${String(step.id || 'unknown')}: ${String(step.status || 'unknown')} ${chalk.dim(
          String(step.reason || '')
        )}`
      );
    }
  }
  console.log('');
}

function printHookTestSummary(payload: Record<string, unknown>): void {
  const chain = toHookRecord(payload.chain) || {};
  const event = toHookRecord(payload.event) || {};
  const compiled = toHookRecord(payload.compiled) || {};
  const warnings = Array.isArray(payload.warnings) ? payload.warnings : [];
  const errors = Array.isArray(payload.errors) ? payload.errors : [];
  const plan = Array.isArray(payload.plan) ? payload.plan : [];
  const valid = payload.valid === true;
  const exitCode = payload.exit_code;

  console.log(chalk.bold('\nHookChain Test\n'));
  console.log(`Chain: ${chalk.cyan(String(chain.name || 'unknown'))}`);
  if (typeof chain.source === 'string') {
    console.log(`Source: ${chalk.dim(chain.source)}`);
  }
  console.log(
    `Event: ${chalk.cyan(String(event.received_event || 'unknown'))} (expected ${chalk.cyan(
      String(event.expected_event || 'unknown')
    )})`
  );
  console.log(
    `Trigger matched: ${event.matched === true ? chalk.green('yes') : chalk.yellow('no')}`
  );
  console.log(
    `Compiled: ${chalk.cyan(String(compiled.node_count || 0))} nodes, ${chalk.cyan(
      String(compiled.edge_count || 0)
    )} edges`
  );
  console.log(
    `Result: ${
      valid
        ? warnings.length > 0
          ? chalk.yellow('VALID_WITH_WARNINGS')
          : chalk.green('VALID')
        : chalk.red('INVALID')
    } (exit ${chalk.cyan(String(exitCode))})`
  );

  if (errors.length > 0) {
    console.log(chalk.red('\nErrors:'));
    for (const entry of errors as Array<Record<string, unknown>>) {
      const code = String(entry.code || 'ERROR');
      const message = String(entry.message || '');
      const pathText = typeof entry.path === 'string' ? chalk.dim(` (${entry.path})`) : '';
      console.log(`- [${code}] ${message}${pathText}`);
    }
  }

  if (warnings.length > 0) {
    console.log(chalk.yellow('\nWarnings:'));
    for (const entry of warnings as Array<Record<string, unknown>>) {
      const code = String(entry.code || 'WARN');
      const message = String(entry.message || '');
      const pathText = typeof entry.path === 'string' ? chalk.dim(` (${entry.path})`) : '';
      console.log(`- [${code}] ${message}${pathText}`);
    }
  }

  if (plan.length > 0) {
    console.log(chalk.bold('\nPlan:'));
    for (const step of plan as Array<Record<string, unknown>>) {
      const stepName = String(step.step || 'unknown-step');
      const willRun = step.will_run === true;
      const reason = typeof step.reason === 'string' ? ` (${step.reason})` : '';
      console.log(
        `- ${stepName}: ${
          willRun ? chalk.green('will_run=true') : chalk.yellow('will_run=false')
        }${chalk.dim(reason)}`
      );
    }
  }
  console.log('');
}

const cliEntryPath = fileURLToPath(import.meta.url);

// =============================================================================
// PLATFORM_TAXONOMY (Phase 8, audit 2026-06-14 consistency review)
// Single source of truth for agent-platform values. Derived from the union
// of:
//   - AGENT_PLATFORM_TRAITS (cli.ts legacy): the runtime defaults used by
//     `tnf register <platform>` and `tnf traits list agent_platforms`.
//   - Bank targets in scripts/agents/reconcile-agent-banks.cjs:293-306
//     (codex|claude|gemini|opencode|kilo|augment|tnf|hermes|cursor|project).
// Updated whenever a new agent platform is onboarded. Consumed by:
//   - `tnf register <platform>` default argument
//   - `tnf traits list agent_platforms`
//   - `tnf agents bank reconcile --targets` (validation only)
//   - `tainf agents classify` (heuristic for fulfillment.vendor)
// =============================================================================
export const PLATFORM_TAXONOMY: string[] = [
  // AGENT_PLATFORM_TRAITS (canonical runtime)
  'antigravity',
  'browser',
  'claude',
  'gemini',
  'jules',
  'pi',
  'vscode',
  // Bank-target-only (added in Phase 8 to align with reconcile-agent-banks.cjs)
  'augment',
  'codex',
  'cursor',
  'hermes',
  'kilo',
  'opencode',
  'project',
  'tnf',
];
// DACC-v1 hierarchy values surfaced by `tnf traits list agent_roles`. These
// two arrays are the contract for `tnf traits list`. Adding a new role or
// platform here is the canonical way to extend the runtime taxonomy.
const AGENT_ROLE_TRAITS = ['director', 'orchestrator', 'broker', 'worker', 'participant'];
const AGENT_PLATFORM_TRAITS = PLATFORM_TAXONOMY;
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
  'tnf self-improvement run',
  'tnf full-auto once|start',
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
const PROVIDER_ROUTED_COMMAND_TRAITS = [
  'tnf master-clock start|logs|status',
  'tnf super-cycle event|status',
];
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
  // Phase 8: derive the discovered_* groups from the agent-registry snapshot
  // when present. The hard-coded groups (agent_roles, agent_platforms) remain
  // the canonical contract because `tnf register` validates against them.
  // The discovered groups surface what is actually in use in this repo's
  // persona .md files, so operators can see drift between the canonical
  // taxonomy and reality at a glance.
  let discoveredWorkerActions: string[] = [];
  let discoveredPlatforms: string[] = [];
  let discoveredVendors: string[] = [];
  let discoveredDaccRoles: string[] = [];
  for (const candidate of [
    path.join(process.cwd(), '.tnf', 'agent-registry-snapshot.json'),
    path.join(process.env.HOME || '', '.tnf', 'agent-registry-snapshot.json'),
  ]) {
    try {
      if (!fs.existsSync(candidate)) continue;
      const parsed = JSON.parse(fs.readFileSync(candidate, 'utf-8'));
      const agents = Array.isArray(parsed?.agents) ? parsed.agents : [];
      const actions = new Set<string>();
      const platforms = new Set<string>();
      const vendors = new Set<string>();
      const dacc = new Set<string>();
      for (const a of agents) {
        const wa = a?.workerAction ?? a?.role;
        if (typeof wa === 'string' && wa.trim()) actions.add(wa);
        const pl = a?.fulfillment?.vendor ?? a?.platform;
        if (typeof pl === 'string' && pl.trim()) platforms.add(pl);
        const vendor = a?.fulfillment?.vendor;
        if (typeof vendor === 'string' && vendor.trim()) vendors.add(vendor);
        const dr = a?.traits?.daccRole ?? a?.qualities?.daccRole;
        if (typeof dr === 'string' && dr.trim()) dacc.add(dr);
      }
      discoveredWorkerActions = Array.from(actions).sort();
      discoveredPlatforms = Array.from(platforms).sort();
      discoveredVendors = Array.from(vendors).sort();
      discoveredDaccRoles = Array.from(dacc).sort();
      break;
    } catch {
      // ignore parse errors; keep derived lists empty
    }
  }
  return [
    { name: 'agent_roles', values: AGENT_ROLE_TRAITS },
    { name: 'agent_platforms', values: AGENT_PLATFORM_TRAITS },
    { name: 'super_admin_protected', values: SUPER_ADMIN_COMMAND_TRAITS },
    { name: 'redis_required', values: REDIS_COMMAND_TRAITS },
    { name: 'provider_routed', values: PROVIDER_ROUTED_COMMAND_TRAITS },
    ...(discoveredWorkerActions.length > 0
      ? [{ name: 'discovered_worker_actions', values: discoveredWorkerActions }]
      : []),
    ...(discoveredPlatforms.length > 0
      ? [{ name: 'discovered_platforms', values: discoveredPlatforms }]
      : []),
    ...(discoveredVendors.length > 0
      ? [{ name: 'discovered_vendors', values: discoveredVendors }]
      : []),
    ...(discoveredDaccRoles.length > 0
      ? [{ name: 'discovered_dacc_roles', values: discoveredDaccRoles }]
      : []),
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
        {
          path: 'tnf agents bank reconcile [--targets all]',
          description: 'Reconcile and distribute multitenant agent-definition banks',
        },
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
      title: 'Forefront Ops',
      entries: [
        {
          path: 'tnf browser-control',
          description: 'Serve standalone HTML browser control + federation node panel',
        },
        {
          path: 'tnf forefront',
          description: 'Boot harness + relay + local UI and open browser control',
        },
        { path: 'tnf forefront status', description: 'Show latest forefront boot receipt' },
        { path: 'tnf local-ui', description: 'Boot TNF local UI (web shell) with harness + relay' },
        { path: 'tnf local-ui --tauri', description: 'Boot native Tauri desktop operator shell' },
        {
          path: 'tnf assimilate link cursor',
          description: 'Onboard Cursor CLI into TNF harness protocol',
        },
      ],
    },
    {
      title: 'Core Ops',
      entries: [
        { path: 'tnf onboard', description: 'Run TNF frontload onboarding' },
        { path: 'tnf doctor', description: 'Run TNF diagnostics' },
        {
          path: 'tnf hooks test --chain <name>|--file <path> --event <event.json>',
          description: 'Validate and dry-run HookChain definitions without side effects',
        },
        {
          path: 'tnf hooks logs [--run <run_id>|--chain <name>]',
          description: 'Read HookChain run records from the local JSONL store',
        },
        {
          path: 'tnf hooks replay --run <run_id>',
          description: 'Queue replay records with trace and idempotency lineage',
        },
        {
          path: 'tnf hooks explain --run <run_id>',
          description: 'Explain HookChain status, gates, and step decisions',
        },
        {
          path: 'tnf self-improvement run',
          description: 'Run deterministic TNF self-improvement loop with artifact verification',
        },
        {
          path: 'tnf self-improvement status [--strict]',
          description: 'Inspect self-improvement artifacts and scorecard health',
        },
        {
          path: 'tnf full-auto start [--interval-minutes 30]',
          description: 'Run unattended self-improvement cycles in a loop',
        },
        {
          path: 'tnf full-auto provision [--targets all]',
          description: 'Propagate full-auto command+skill to detected agent runtimes',
        },
        {
          path: 'tnf library status [--refresh]',
          description: 'Show canonical Virtual Library status',
        },
        {
          path: 'tnf library audit',
          description: 'Generate Virtual Library surface audit artifacts',
        },
        {
          path: 'tnf library sync [--apply] [--delete]',
          description: 'Mirror canonical Virtual Library into TNF app path',
        },
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
        {
          path: 'tnf cursor [args...]',
          description: 'Pass through Cursor CLI with TNF harness MCP routing',
        },
        {
          path: 'tnf assimilate link cursor',
          description: 'Onboard Cursor CLI into TNF harness protocol',
        },
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

function findFullAutoStartProcesses(): Array<{ pid: number; cmd: string }> {
  return parseProcessTable().filter((entry) => {
    if (entry.pid === process.pid) return false;
    return /\bfull-auto\s+start\b/.test(entry.cmd);
  });
}

function buildFullAutoStartArgs(
  options: SelfImprovementRunCliOptions & {
    intervalMinutes?: string;
    maxCycles?: string;
    broadcast?: boolean;
    strict?: boolean;
    skipStrictStatus?: boolean;
  }
): string[] {
  const args = ['full-auto', 'start'];
  if (options.intervalMinutes) args.push('--interval-minutes', options.intervalMinutes);
  if (options.maxCycles) args.push('--max-cycles', options.maxCycles);
  if (options.baseUrl) args.push('--base-url', options.baseUrl);
  if (options.apiUrl) args.push('--api-url', options.apiUrl);
  if (options.maxDepth) args.push('--max-depth', options.maxDepth);
  if (options.maxPages) args.push('--max-pages', options.maxPages);
  if (options.maxExternal) args.push('--max-external', options.maxExternal);
  if (options.skipBuild) args.push('--skip-build');
  if (options.skipLiveLinks) args.push('--skip-live-links');
  if (options.skipSemantic) args.push('--skip-semantic');
  if (options.skipAuth) args.push('--skip-auth');
  if (options.skipScorecard) args.push('--skip-scorecard');
  if (options.skipMermaid) args.push('--skip-mermaid');
  if (options.skipStrictStatus) args.push('--skip-strict-status');
  if (options.broadcast) args.push('--broadcast');
  if (options.strict) args.push('--strict');
  if (options.superAdminToken) args.push('--super-admin-token', options.superAdminToken);
  return args;
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

/**
 * Resolve a passthrough command name to its absolute executable path.
 *
 * When `tnf` is launched via `pnpm exec tsx`, the child process inherits
 * a PATH where pnpm may intercept bare command names (e.g. `hermes`) and
 * fail with ERR_PNPM_RECURSIVE_EXEC_NO_PACKAGE because `hermes` is not a
 * workspace package.  Resolving to an absolute path bypasses pnpm's
 * interception and invokes the real binary directly.
 */
function resolvePassthroughCommand(cliName: string): string {
  // 1. Try standard PATH resolution (findExecutableOnPath uses the
  //    process's own PATH, which includes ~/.local/bin etc.)
  const onPath = findExecutableOnPath(cliName);
  if (onPath) return onPath;

  // 2. Fallback: well-known install locations
  const homeBin = path.join(os.homedir(), '.local', 'bin', cliName);
  if (isExecutableFile(homeBin)) return homeBin;

  // 3. Hermes-specific: ~/.hermes/hermes-agent/venv/bin/hermes
  if (cliName === 'hermes') {
    const hermesHome =
      normalizeToken(process.env.HERMES_HOME) ?? path.join(os.homedir(), '.hermes');
    const venvHermes = path.join(hermesHome, 'hermes-agent', 'venv', 'bin', 'hermes');
    if (isExecutableFile(venvHermes)) return venvHermes;
  }

  // 4. Cursor-specific install locations
  if (cliName === 'cursor') {
    const cursorCandidates = [
      path.join(os.homedir(), '.local', 'bin', 'cursor'),
      '/Applications/Cursor.app/Contents/Resources/app/bin/cursor',
      path.join(os.homedir(), '.cursor', 'bin', 'cursor'),
    ];
    for (const candidate of cursorCandidates) {
      if (isExecutableFile(candidate)) return candidate;
    }
  }

  // Return the bare name as last resort (will fail with ENOENT if not found)
  return cliName;
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

function isHermesPassthroughArgv(argv: string[]): boolean {
  const subcommand = argv[2];
  return subcommand === 'hermes';
}

function isGeminiPassthroughArgv(argv: string[]): boolean {
  const subcommand = argv[2];
  return subcommand === 'gemini';
}

function isCursorPassthroughArgv(argv: string[]): boolean {
  const subcommand = argv[2];
  return subcommand === 'cursor';
}

let cachedTopLevelCommands: Record<string, Set<string>> = {};

function getTnfTopLevelCommands(): Set<string> {
  return new Set(
    program.commands.map((command) => command.name()).filter((name) => !!name && name !== 'help')
  );
}

function parseTopLevelCommands(helpText: string): Set<string> {
  const commands = new Set<string>();
  const lines = helpText.split(/\r?\n/);
  const commandsIndex = lines.findIndex((line) => line.trim() === 'Commands:');
  if (commandsIndex < 0) return commands;

  for (const line of lines.slice(commandsIndex + 1)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('Examples:') || trimmed.startsWith('Docs:') || trimmed.startsWith('Run'))
      break;

    const match = line.match(/^\s{2,}([a-z][a-z0-9-]*)(?:\s+\*)?\s{2,}/i);
    if (match?.[1]) {
      commands.add(match[1]);
    }
  }

  return commands;
}

function getTopLevelCommands(cliName: string): Set<string> {
  if (cachedTopLevelCommands[cliName]) {
    return cachedTopLevelCommands[cliName];
  }

  try {
    const result = spawnSync(cliName, ['--no-color', '--help'], {
      encoding: 'utf8',
      env: process.env,
    });
    const output = `${result.stdout || ''}\n${result.stderr || ''}`;
    cachedTopLevelCommands[cliName] = parseTopLevelCommands(output);
  } catch {
    cachedTopLevelCommands[cliName] = new Set();
  }

  return cachedTopLevelCommands[cliName];
}

function resolveImplicitPassthroughArgs(
  argv: string[]
): { cliName: string; args: string[] } | null {
  const subcommand = argv[2];
  const tnfCommands = getTnfTopLevelCommands();
  const passthroughTargets = ['openclaw', 'hermes', 'gemini', 'cursor'];

  if (!subcommand || subcommand === 'help') {
    const helpTarget = argv[3];
    if (!helpTarget) return null;
    if (tnfCommands.has(helpTarget)) return null;

    for (const target of passthroughTargets) {
      if (getTopLevelCommands(target).has(helpTarget)) {
        return { cliName: target, args: [helpTarget, '--help'] };
      }
    }
    return null;
  }

  if (tnfCommands.has(subcommand)) return null;

  for (const target of passthroughTargets) {
    if (getTopLevelCommands(target).has(subcommand)) {
      return { cliName: target, args: argv.slice(2) };
    }
  }
  return null;
}

function buildOpenClawCompatibilityEntries(): OpenClawCompatibilityEntry[] {
  const tnfTopLevelCommands = getTnfTopLevelCommands();
  return Array.from(getTopLevelCommands('openclaw'))
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

const pkgVersion =
  JSON.parse(fs.readFileSync(path.join(_dirname, '../package.json'), 'utf8')).version || '1.0.0';

program
  .name('tnf')
  .description(
    'TNF CLI - Unified Command Surface for TNF Operations\n\n' +
      '🔑 Super Admin Authentication:\n' +
      '  Certain restricted commands require a Super Admin token.\n' +
      '  You must set the TNF_SUPER_ADMIN_TOKEN in your environment as the master secret.\n' +
      '  To authenticate a command, you can:\n' +
      '    - Use the --super-admin-token <token> flag\n' +
      '    - Set the TNF_SUPER_ADMIN_INPUT_TOKEN environment variable\n' +
      '    - Set the CI_SUPER_ADMIN_TOKEN environment variable (for CI/CD)'
  )
  .version(pkgVersion)
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

type BootPlanStep = {
  label: string;
  critical: boolean;
  launches: string[];
  notes?: string[];
};

function buildBootPlan(nonInteractive?: boolean): BootPlanStep[] {
  return [
    {
      label: 'Turn Zero onboarding surface',
      critical: true,
      launches: ['node scripts/tnf-onboard.cjs --runtime-timeout-ms 1000'],
      notes: [
        'Prints canonical state and the raw-agent prompt before boot auth or runtime launch.',
      ],
    },
    {
      label: 'Port preflight',
      critical: false,
      launches: ['node scripts/tnf-ports.cjs preflight'],
      notes: [
        'Occupied TNF runtimes are allowed only when their health endpoints match the expected service.',
        'Use --strict-gates or FACTORY_BOOT_PORT_PREFLIGHT_STRICT=true to fail on other occupied required ports.',
      ],
    },
    {
      label: 'Verifying environment variables',
      critical: false,
      launches: ['bash scripts/validate-env.sh'],
    },
    {
      label: 'Mounting volumes',
      critical: true,
      launches: [
        'mkdir -p .agent/runtime-state .agent/runtime-logs .agent/test-reports data/agent-registry',
      ],
    },
    {
      label: 'MCP health check',
      critical: false,
      launches: ['node scripts/mcp-health-check.cjs'],
      notes: ['Warning-only local service misses are non-fatal unless TNF_MCP_HEALTH_STRICT=1.'],
    },
    {
      label: 'Directive rotation scheduler',
      critical: false,
      launches: ['pnpm run factory:supercycle (detached)'],
    },
    {
      label: 'LLM provider tester',
      critical: false,
      launches: ['node scripts/swarm/llm-provider-tester.cjs (detached)'],
    },
    {
      label: 'Model fallback / ZeroClaw sandbox wake',
      critical: false,
      launches: ['node scripts/orchestrator/zeroclaw-boot.cjs'],
      notes: ['CloudRuntime wake-up is optional when cloud_runtime CLI is absent.'],
    },
    {
      label: 'Handoff matrix',
      critical: false,
      launches: ['node scripts/RelayHealthCheck.cjs when present'],
    },
    {
      label: 'Platform gateways / relay factory',
      critical: false,
      launches: [
        'bash scripts/orchestrator/factory-boot.sh',
        'packages/relay-core/dist/standalone-relay.js',
        'packages/relay-core/dist/master-clock.js',
        'packages/relay-core/dist/broker-agent.js',
        'packages/relay-core/dist/director-agent.js',
        'scripts/swarm/project-planner.cjs',
        '@the-new-fuse/workflow-engine src/orchestrator/start.ts',
        'scripts/orchestrator/factory-supervisor.sh',
      ],
    },
    {
      label: 'Agent swarm',
      critical: true,
      launches: [
        'Redis server',
        'scripts/redis-ws-bridge.cjs',
        'scripts/antigravity-redis-wrapper.cjs',
        'scripts/claude-redis-wrapper.cjs',
        'scripts/gemini-redis-wrapper.cjs',
        'scripts/jules-redis-wrapper.cjs',
        'scripts/pi-redis-wrapper.cjs',
        'scripts/model-watchdog-failover-consumer.cjs',
      ],
      notes: [
        'macOS Terminal tab launches are verified by process check before success is printed.',
      ],
    },
    {
      label: 'OpenClaw MCP/client surface',
      critical: false,
      launches: ['node scripts/tnf-start-ai.cjs openclaw'],
      notes: ['If openclaw CLI is absent, boot provisions MCP config with --no-launch.'],
    },
    {
      label: 'Hermes operator',
      critical: false,
      launches: ['hermes --daemon (detached)'],
    },
    {
      label: 'Browser control panel',
      critical: false,
      launches: nonInteractive
        ? ['skipped by --non-interactive']
        : ['open https://thenewfuse.com/health'],
    },
    {
      label: 'System health verification',
      critical: false,
      launches: ['bash scripts/system-health-verification.sh'],
    },
    {
      label: 'Interactive TNF Agent attach',
      critical: false,
      launches: nonInteractive
        ? ['skipped by --non-interactive']
        : ['start TNF Agent operator lane when stdin is a TTY'],
      notes: ['Use --no-attach-agent to leave the shell prompt after boot.'],
    },
  ];
}

function printBootPlan(name: string, nonInteractive?: boolean): void {
  console.log(chalk.bold.cyan(`\nTNF Boot Plan: ${name}\n`));
  for (const [index, step] of buildBootPlan(nonInteractive).entries()) {
    const critical = step.critical ? chalk.red('critical') : chalk.yellow('warning-only');
    console.log(`${index + 1}. ${chalk.bold(step.label)} (${critical})`);
    for (const launch of step.launches) {
      console.log(`   - ${launch}`);
    }
    for (const note of step.notes || []) {
      console.log(chalk.dim(`   note: ${note}`));
    }
  }
  console.log('');
}

type InteractiveSlashContext = {
  messages: ChatMessage[];
  systemMessageCount: number;
  client?: {
    model?: string;
    providerName?: string;
    baseUrl?: string;
    resolveProvider?: () => void;
    getProviderCatalog?: () => Array<{
      id?: string;
      model?: string;
      costPerMtokens?: number;
    }>;
  };
};

type SlashCommandOutcome = { handled: false } | { handled: true; exit?: boolean; prompt?: string };

function printSlashText(text: string): void {
  console.log('');
  console.log(text);
  console.log('');
}

function printSlashCommandList(): void {
  printSlashText(renderSlashCommandList(invocationCwd));
}

function printSlashCommandDetail(command: SlashCommandDefinition): void {
  printSlashText(renderSlashCommandDetail(command));
}

function createSlashCompleter(projectRoot: string): (line: string) => [string[], string] {
  return (line: string): [string[], string] => {
    if (line.startsWith('/') && !line.includes(' ')) {
      const commands = getSlashCommandMatches(projectRoot, line).map((cmd) => `/${cmd.name}`);
      const hits = commands.filter((command) => command.startsWith(line));
      return [hits.length ? hits : commands, line];
    }
    return [[], line];
  };
}

type SlashDropdownState = {
  visible: boolean;
  query: string;
  selectedIndex: number;
  selectedCommand: string | null;
};

function getSlashCommandMatches(projectRoot: string, line: string): SlashCommandDefinition[] {
  const normalizedLine = line.startsWith('/') ? line : `/${line}`;
  const query = normalizedLine.slice(1).toLowerCase();
  return getAllSlashCommands(projectRoot)
    .filter((command) => {
      if (!query) return true;
      if (command.name.startsWith(query)) return true;
      return command.aliases?.some((alias) => alias.startsWith(query)) || false;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function renderSlashCommandDropdown(
  projectRoot: string,
  state: SlashDropdownState,
  limit = 14
): string {
  const allCommands = getSlashCommandMatches(projectRoot, state.query);
  const safeSelectedIndex = Math.min(
    Math.max(state.selectedIndex, 0),
    Math.max(0, allCommands.length - 1)
  );
  const startIndex = Math.max(
    0,
    Math.min(safeSelectedIndex - limit + 1, Math.max(0, allCommands.length - limit))
  );
  const commands = allCommands.slice(startIndex, startIndex + limit);
  const maxNameLength = Math.max(...commands.map((command) => command.name.length), 4);
  const lines = [
    chalk.bold('Slash commands'),
    ...(startIndex > 0 ? [chalk.dim(`  ... ${startIndex} previous`)] : []),
    ...commands.map((command, index) => {
      const absoluteIndex = startIndex + index;
      const selected = absoluteIndex === safeSelectedIndex;
      const name = `/${command.name}`.padEnd(maxNameLength + 1);
      const marker = selected ? chalk.green('›') : ' ';
      const label = selected ? chalk.inverse(name) : chalk.cyan(name);
      return `${marker} ${label} ${chalk.dim(command.summary)}`;
    }),
  ];
  if (allCommands.length > startIndex + commands.length) {
    lines.push(chalk.dim(`  ... ${allCommands.length - startIndex - commands.length} more`));
  }
  lines.push(chalk.dim('  ↑/↓ select, Enter run, Tab complete, type to filter.'));
  return lines.join('\n');
}

function setReadlineLine(rl: readline.Interface, line: string): void {
  (rl as any).line = line;
  (rl as any).cursor = line.length;
  (rl as any)._refreshLine?.();
}

function resolveSlashDropdownInput(input: string, state: SlashDropdownState): string {
  const trimmed = input.trim();
  if (
    state.visible &&
    state.selectedCommand &&
    trimmed === state.query.trim() &&
    trimmed.startsWith('/')
  ) {
    const selected = `/${state.selectedCommand}`;
    state.visible = false;
    state.selectedCommand = null;
    return selected;
  }
  state.visible = false;
  state.selectedCommand = null;
  return input;
}

function attachSlashCommandDropdown(
  rl: readline.Interface,
  projectRoot: string
): SlashDropdownState {
  const state: SlashDropdownState = {
    visible: false,
    query: '',
    selectedIndex: 0,
    selectedCommand: null,
  };
  if (!process.stdin.isTTY) return state;

  readline.emitKeypressEvents(process.stdin, rl);

  const onKeypress = (_value: string, key: any) => {
    const keyName = key?.name;
    if (['return', 'enter'].includes(keyName)) {
      state.visible = false;
      state.selectedCommand = null;
      return;
    }

    const currentLine =
      state.visible && ['up', 'down'].includes(keyName)
        ? state.query
        : String((rl as any).line || '');
    if (!currentLine.startsWith('/') || currentLine.includes(' ')) {
      state.visible = false;
      state.selectedCommand = null;
      return;
    }

    const matches = getSlashCommandMatches(projectRoot, currentLine);
    if (matches.length === 0) {
      state.visible = false;
      state.selectedCommand = null;
      return;
    }

    if (!state.visible || state.query !== currentLine) {
      state.selectedIndex = 0;
    }
    if (keyName === 'down') {
      state.selectedIndex = (state.selectedIndex + 1) % matches.length;
    } else if (keyName === 'up') {
      state.selectedIndex = (state.selectedIndex - 1 + matches.length) % matches.length;
    }

    state.visible = true;
    state.query = currentLine;
    state.selectedCommand = matches[state.selectedIndex]?.name || null;

    process.stdout.write(`\n${renderSlashCommandDropdown(projectRoot, state)}\n`);
    setReadlineLine(
      rl,
      ['up', 'down'].includes(keyName) && state.selectedCommand
        ? `/${state.selectedCommand}`
        : currentLine
    );
  };

  process.stdin.on('keypress', onKeypress);
  rl.once('close', () => {
    process.stdin.off('keypress', onKeypress);
  });
  return state;
}

async function runSlashCliCommand(command: SlashCommandDefinition, args: string[]): Promise<void> {
  if (!command.cliCommand?.length) {
    throw new Error(`Slash command /${command.name} is not mapped to a CLI command.`);
  }
  await runTnfCliEntrypoint([...command.cliCommand, ...args]);
}

async function showCurrentModel(): Promise<void> {
  const { LLMClient } = await import('./utils/llm-client.js');
  const client = await LLMClient.create('orchestrator');
  console.log(chalk.bold('\nModel\n'));
  console.log(`  Provider: ${chalk.cyan(client.providerName || 'unknown')}`);
  console.log(`  Model:    ${chalk.cyan(client.model)}`);
  console.log(`  Base URL: ${chalk.dim(client.baseUrl)}`);
  console.log('');
}

function setInteractiveModel(client: InteractiveSlashContext['client'], modelName: string): void {
  process.env.TNF_LLM_MODEL = modelName;
  if (client) {
    client.model = modelName;
  }
  console.log(chalk.green(`  Model set for this session: ${modelName}`));
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function estimateSessionTokens(messages: ChatMessage[]): {
  total: number;
  user: number;
  assistant: number;
  system: number;
} {
  return messages.reduce(
    (acc, message) => {
      const count = estimateTokens(message.content);
      acc.total += count;
      acc[message.role] += count;
      return acc;
    },
    { total: 0, user: 0, assistant: 0, system: 0 }
  );
}

function estimateSessionCost(
  client: InteractiveSlashContext['client'],
  tokenCount: number
): number | null {
  const providers = client?.getProviderCatalog?.() || [];
  const provider = providers.find(
    (candidate) => candidate.id === client?.providerName || candidate.model === client?.model
  );
  if (typeof provider?.costPerMtokens !== 'number') return null;
  return (tokenCount / 1_000_000) * provider.costPerMtokens;
}

function printSessionCost(context: InteractiveSlashContext): void {
  const tokens = estimateSessionTokens(context.messages);
  const estimatedCost = estimateSessionCost(context.client, tokens.total);
  console.log(chalk.bold('\nCost\n'));
  console.log(`  Tokens:    ${tokens.total} estimated`);
  console.log(`  User:      ${tokens.user}`);
  console.log(`  Assistant: ${tokens.assistant}`);
  console.log(`  System:    ${tokens.system}`);
  if (estimatedCost !== null) {
    console.log(`  Cost:      ~$${estimatedCost.toFixed(6)} estimated`);
  } else {
    console.log(chalk.dim('  Cost:      provider price metadata unavailable'));
  }
  console.log(chalk.dim('  Note: local estimate, not provider billing telemetry.'));
  console.log('');
}

async function handleOneShotSlashInput(input: string): Promise<boolean> {
  const parsed = parseSlashCommand(input);
  if (!parsed) return false;

  const command = findSlashCommand(parsed.name, invocationCwd);
  if (!command) {
    console.error(chalk.red(`Unknown slash command: /${parsed.rawName}`));
    console.error(chalk.dim('Run `tnf /help` or `tnf slash list`.'));
    process.exitCode = 1;
    return true;
  }

  if (command.name === 'help') {
    const target = parsed.args[0];
    if (!target) {
      printSlashCommandList();
      return true;
    }
    const detail = findSlashCommand(target, invocationCwd);
    if (!detail) {
      console.error(chalk.red(`Unknown slash command: /${target}`));
      process.exitCode = 1;
      return true;
    }
    printSlashCommandDetail(detail);
    return true;
  }

  if (command.name === 'commands') {
    printSlashCommandList();
    return true;
  }

  if (command.name === 'exit' || command.aliases?.includes('quit')) {
    return true;
  }

  if (command.name === 'clear' || command.name === 'compact') {
    console.log(chalk.dim(`/${command.name} only affects an active TNF chat/TUI transcript.`));
    return true;
  }

  if (command.name === 'cost') {
    console.log(chalk.bold('\nCost\n'));
    console.log(chalk.dim('  No active chat transcript in one-shot CLI mode.'));
    console.log(
      chalk.dim('  Run /cost inside `tnf tui` or `tnf ai chat` for session estimates.\n')
    );
    return true;
  }

  if (command.name === 'model') {
    const modelName = parsed.args.join(' ').trim();
    if (!modelName) {
      await showCurrentModel();
      return true;
    }
    await runTnfCliEntrypoint(['config', 'set', 'model', modelName]);
    console.log(chalk.green(`Persisted TNF model preference: ${modelName}`));
    return true;
  }

  if (command.mode === 'cli') {
    await runSlashCliCommand(command, parsed.args);
    return true;
  }

  if (command.mode === 'prompt') {
    console.log(formatPromptSlashCommand(command, parsed.args));
    return true;
  }

  printSlashCommandDetail(command);
  return true;
}

async function handleInteractiveSlashCommand(
  input: string,
  context: InteractiveSlashContext
): Promise<SlashCommandOutcome> {
  const parsed = parseSlashCommand(input);
  if (!parsed) return { handled: false };

  const command = findSlashCommand(parsed.name, invocationCwd);
  if (!command) {
    console.log(chalk.red(`  Unknown slash command: /${parsed.rawName}`));
    console.log(chalk.dim('  Run /help to list available commands.'));
    return { handled: true };
  }

  if (command.name === 'help') {
    const target = parsed.args[0];
    if (!target) {
      printSlashCommandList();
      return { handled: true };
    }
    const detail = findSlashCommand(target, invocationCwd);
    if (!detail) {
      console.log(chalk.red(`  Unknown slash command: /${target}`));
      return { handled: true };
    }
    printSlashCommandDetail(detail);
    return { handled: true };
  }

  if (command.name === 'commands') {
    printSlashCommandList();
    return { handled: true };
  }

  if (command.name === 'exit' || command.aliases?.includes('quit')) {
    return { handled: true, exit: true };
  }

  if (command.name === 'clear' || command.name === 'compact') {
    context.messages.length = context.systemMessageCount;
    console.log(
      chalk.dim(`  ${command.name === 'compact' ? 'Transcript compacted' : 'History cleared'}`)
    );
    return { handled: true };
  }

  if (command.name === 'cost') {
    printSessionCost(context);
    return { handled: true };
  }

  if (command.name === 'model') {
    const modelName = parsed.args.join(' ').trim();
    if (!modelName) {
      console.log(chalk.dim(`  Provider: ${context.client?.providerName || 'unknown'}`));
      console.log(chalk.dim(`  Model: ${context.client?.model || 'unknown'}`));
      if (context.client?.baseUrl) console.log(chalk.dim(`  Base URL: ${context.client.baseUrl}`));
      return { handled: true };
    }
    setInteractiveModel(context.client, modelName);
    return { handled: true };
  }

  if (command.mode === 'cli') {
    await runSlashCliCommand(command, parsed.args);
    return { handled: true };
  }

  if (command.mode === 'prompt') {
    return { handled: true, prompt: formatPromptSlashCommand(command, parsed.args) };
  }

  printSlashCommandDetail(command);
  return { handled: true };
}

program
  .command('boot')
  .alias('boor')
  .description('Master entry point to boot the entire TNF stack')
  .argument('[name]', 'Profile/Instance name to boot', 'goldberg')
  .option(
    '--super-admin-token <token>',
    'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)'
  )
  .option('--non-interactive', 'Skip interactive client launches (OpenClaw UI and browser open)')
  .option('--no-attach-agent', 'Do not attach the interactive TNF Agent after a successful boot')
  .option('--plan', 'Print the boot launch graph without starting processes')
  .option('--strict-gates', 'Treat all boot step failures as fatal')
  .option('--skip-env-validation', 'Skip template environment validation step')
  .action(
    async (
      name: string,
      options: {
        superAdminToken?: string;
        nonInteractive?: boolean;
        attachAgent?: boolean;
        plan?: boolean;
        strictGates?: boolean;
        skipEnvValidation?: boolean;
      }
    ) => {
      try {
        if (options.plan) {
          printBootPlan(name, options.nonInteractive);
          return;
        }
        await runTurnZeroOnboardSurface();
        requireSuperAdmin(options, 'boot');
        console.log(chalk.bold.cyan(`\n🚀 Booting TNF Stack: ${chalk.yellow(name)}\n`));
        if (options.nonInteractive) {
          console.log(chalk.dim('Boot mode: non-interactive'));
        }
        if (options.strictGates) {
          console.log(chalk.dim('Gate mode: strict'));
        }

        type BootStep = {
          label: string;
          critical: boolean;
          action: () => Promise<void>;
        };

        const steps: BootStep[] = [
          {
            label: 'Checking port preflight',
            critical: false,
            action: async () => {
              const args = ['scripts/tnf-ports.cjs', 'preflight'];
              if (options.strictGates) args.push('--strict');
              await runCommand('node', args);
            },
          },
          {
            label: 'Verifying environment variables',
            critical: false,
            action: async () => {
              if (options.skipEnvValidation) {
                console.log(chalk.dim('   Skipped (--skip-env-validation)'));
                return;
              }
              await runCommand('bash', ['scripts/validate-env.sh']);
            },
          },
          {
            label: 'Mounting volumes (ensuring directories)',
            critical: true,
            action: async () => {
              const dirs = [
                '.agent/runtime-state',
                '.agent/runtime-logs',
                '.agent/test-reports',
                'data/agent-registry',
              ];
              for (const dir of dirs) {
                if (!fs.existsSync(path.join(repoRoot, dir))) {
                  fs.mkdirSync(path.join(repoRoot, dir), { recursive: true });
                  console.log(chalk.dim(`   Created ${dir}`));
                }
              }
            },
          },
          {
            label: 'Starting LLM health monitor',
            critical: false,
            action: async () => {
              await runCommand('node', ['scripts/mcp-health-check.cjs']);
            },
          },
          {
            label: 'Starting directive rotation scheduler',
            critical: false,
            action: async () => {
              // Run supercycle flywheel in background if not already running
              await runCommand('pnpm', ['run', 'factory:supercycle'], { isBackground: true });
            },
          },
          {
            label: 'Starting LLM provider tester agent',
            critical: false,
            action: async () => {
              // Run tester agent in background to continuously cycle through API keys and ensure viability
              await runCommand('node', ['scripts/swarm/llm-provider-tester.cjs'], {
                isBackground: true,
              });
            },
          },
          {
            label: 'Starting model fallback chain',
            critical: false,
            action: async () => {
              await runCommand('node', ['scripts/orchestrator/zeroclaw-boot.cjs']);
            },
          },
          {
            label: 'Initializing handoff matrix',
            critical: false,
            action: async () => {
              await runCommand('node', [
                'scripts/protocols/enforce-session-handoff.cjs',
                '--mode=ci',
              ]);
            },
          },
          {
            label: 'Starting platform gateways',
            critical: false,
            action: async () => {
              await runCommand('bash', ['scripts/orchestrator/factory-boot.sh'], {
                env: {
                  FACTORY_BOOT_REDIS_FAIL_OPEN: options.strictGates ? 'false' : 'true',
                  FACTORY_BOOT_PORT_PREFLIGHT_STRICT: options.strictGates ? 'true' : 'false',
                },
              });
            },
          },
          {
            label: 'Booting agent swarm',
            critical: true,
            action: async () => {
              await runCommand('bash', ['scripts/start-agent-network.sh', '--all']);
            },
          },
          {
            label: 'Starting OpenClaw gateway',
            critical: false,
            action: async () => {
              const args = ['scripts/tnf-start-ai.cjs', 'openclaw'];
              if (options.strictGates) args.push('--require-doctor');
              if (options.nonInteractive || !findExecutableOnPath('openclaw')) {
                args.push('--no-launch');
                if (!findExecutableOnPath('openclaw')) {
                  console.log(
                    chalk.dim(
                      '   OpenClaw CLI not found; provisioning MCP config without launching client'
                    )
                  );
                }
              }
              await runCommand('node', args);
            },
          },
          {
            label: 'Starting Hermes operator agent',
            critical: false,
            action: async () => {
              // Spawn hermes in detached background mode
              await runCommand('hermes', ['--daemon'], { isBackground: true });
            },
          },
          {
            label: 'Bringing up browser control panel',
            critical: false,
            action: async () => {
              if (options.nonInteractive) {
                console.log(chalk.dim('   Skipped (--non-interactive)'));
                return;
              }
              console.log(chalk.cyan('   Launch forefront: tnf forefront'));
              console.log(chalk.cyan('   Launch local UI: tnf local-ui'));
              console.log(chalk.cyan('   Tauri shell:    tnf local-ui --tauri'));
            },
          },
          {
            label: 'Executing self-test and reporting status',
            critical: false,
            action: async () => {
              await runCommand('bash', ['scripts/system-health-verification.sh']);
            },
          },
        ];

        const warnings: string[] = [];
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          process.stdout.write(chalk.white(`[${i + 1}/${steps.length}] ${step.label}... `));
          try {
            await step.action();
            process.stdout.write(chalk.green('OK\n'));
          } catch (err: any) {
            process.stdout.write(chalk.red('FAILED\n'));
            const message = err?.message || String(err);
            const isFatal = Boolean(options.strictGates) || step.critical;
            if (isFatal) {
              console.error(chalk.red(`   Error in step "${step.label}": ${message}`));
              throw new Error(`Critical boot failure in step: ${step.label}`);
            }
            const warningLine = `${step.label}: ${message}`;
            warnings.push(warningLine);
            console.error(chalk.yellow(`   Warning in step "${step.label}": ${message}`));
          }
        }

        console.log(chalk.bold.green(`\n✅ TNF Stack "${name}" is now operational!\n`));
        if (warnings.length > 0) {
          console.log(chalk.yellow(`⚠️  Completed with ${warnings.length} warning(s):`));
          for (const warning of warnings) {
            console.log(chalk.yellow(`   - ${warning}`));
          }
          console.log('');
        }

        if (options.attachAgent !== false && !options.nonInteractive && process.stdin.isTTY) {
          console.log(
            chalk.cyan('Attaching TNF Agent operator lane. Use /exit to return to the shell.')
          );
          await startInteractiveAgent();
        } else if (options.attachAgent === false) {
          console.log(chalk.dim('Interactive TNF Agent attach skipped (--no-attach-agent).'));
        } else if (options.nonInteractive) {
          console.log(chalk.dim('Interactive TNF Agent attach skipped (--non-interactive).'));
        } else {
          console.log(chalk.dim('Interactive TNF Agent attach skipped (stdin is not a TTY).'));
        }
      } catch (err: any) {
        console.error(chalk.red(`\n❌ Boot sequence aborted: ${err.message}`));
        process.exit(1);
      }
    }
  );

program
  .command('tui')
  .description('Launch the TNF TUI agent — always-on interactive LLM session')
  .action(async () => {
    try {
      await runTurnZeroOnboardSurface();
      await startTuiAgent();
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('gateway')
  .description('Start the TNF gateway service — persistent LLM-powered relay')
  .action(async () => {
    try {
      await startGatewayService();
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('register')
  .description('Register and listen as an agent')
  .argument('[name]', 'Agent name', process.env.AGENT_NAME || 'unnamed-agent')
  .argument(
    '[role]',
    `Agent role (${AGENT_ROLE_TRAITS.join(', ')})`,
    process.env.AGENT_ROLE || 'worker'
  )
  .argument(
    '[platform]',
    `Agent platform (${PLATFORM_TAXONOMY.join(', ')})`,
    process.env.AGENT_PLATFORM || 'vscode'
  )
  .option('-d, --daemon', 'Run in daemon mode (register and exit immediately)', false)
  .option('--dacc-role <role>', `DACC-v1 hierarchy position (${AGENT_ROLE_TRAITS.join(', ')})`)
  .option(
    '--worker-action <action>',
    'Worker action primitive (e.g. code_generation, cli_coder, orchestrator)'
  )
  .option('--dacc-role-from-config', 'Read dacc_role from ~/.tnf/agent.yaml', false)
  .action(async (name, role, platform, options) => {
    const client = new RedisAgentClient();
    try {
      // Phase 8: validate role and platform are in canonical taxonomy.
      if (!AGENT_ROLE_TRAITS.includes(role)) {
        console.error(
          chalk.yellow(
            `⚠ role '${role}' is not in the canonical DACC-v1 role traits ` +
              `(${AGENT_ROLE_TRAITS.join(', ')}). Proceeding for backward ` +
              `compatibility, but consider registering with a canonical role.`
          )
        );
      }
      if (!PLATFORM_TAXONOMY.includes(platform)) {
        console.error(
          chalk.yellow(
            `⚠ platform '${platform}' is not in PLATFORM_TAXONOMY ` +
              `(${PLATFORM_TAXONOMY.join(', ')}). Proceeding for backward ` +
              `compatibility.`
          )
        );
      }
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
        completer: createSlashCompleter(repoRoot),
      });
      const slashDropdown = attachSlashCommandDropdown(rl, repoRoot);

      rl.on('line', async (line) => {
        const resolvedLine = resolveSlashDropdownInput(line, slashDropdown);
        if (resolvedLine.trim()) {
          await client.send(resolvedLine.trim());
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
  .option('--repair', 'Scaffold missing onboarding files and config stubs')
  .option('--allow-local-db', 'Allow local DATABASE_URL for this run')
  .option('--require-cloud-db', 'Require cloud DATABASE_URL for this run')
  .option('--no-require-cloud-db', 'Allow non-cloud DATABASE_URL for this run')
  .option('--database-url <url>', 'Override DATABASE_URL for this run')
  .option('--runtime-timeout-ms <ms>', 'Runtime snapshot timeout in milliseconds')
  .action(
    async (options: {
      repair?: boolean;
      allowLocalDb?: boolean;
      requireCloudDb?: boolean;
      databaseUrl?: string;
      runtimeTimeoutMs?: string;
    }) => {
      try {
        const args = ['scripts/tnf-onboard.cjs'];
        if (options.repair) args.push('--repair');
        if (options.allowLocalDb) args.push('--allow-local-db');
        if (typeof options.requireCloudDb === 'boolean') {
          args.push(options.requireCloudDb ? '--require-cloud-db' : '--no-require-cloud-db');
        }
        if (options.databaseUrl) args.push('--database-url', options.databaseUrl);
        if (options.runtimeTimeoutMs) args.push('--runtime-timeout-ms', options.runtimeTimeoutMs);
        await runCommand('node', args);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

const protocol = program
  .command('protocol')
  .description('Validate TNF framework protocols and harness boundaries');

protocol
  .command('health')
  .description('Aggregate protocol health report')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    const interceptor = new ProtocolInterceptor(repoRoot);
    const state = interceptor.getStateSummary();

    if (options.json) {
      console.log(JSON.stringify(state, null, 2));
      return;
    }

    const turnZeroOk = (state.turnZero as Record<string, number>).missing === 0;
    const livingSynced = (state.livingState as Record<string, boolean>).synchronized;
    const disclosureReady = (state.disclosure as Record<string, unknown>).ready as {
      ready: boolean;
    };

    console.log(chalk.bold.cyan('\n[TNF Protocol Health]\n'));
    console.log(`Turn Zero: ${turnZeroOk ? chalk.green('OK') : chalk.red('MISSING ARTIFACTS')}`);
    console.log(
      `Living State: ${livingSynced ? chalk.green('SYNCED') : chalk.yellow('NOT SYNCED')}`
    );
    console.log(
      `Disclosure: ${disclosureReady.ready ? chalk.green('READY') : chalk.yellow('WARNINGS')}`
    );
    console.log(
      `Directives: ${chalk.cyan(`${(state.directives as Record<string, number>).pending} pending`)}`
    );
    console.log(
      `\nOverall: ${turnZeroOk && livingSynced && disclosureReady.ready ? chalk.green('HEALTHY') : chalk.yellow('DEGRADED')}\n`
    );
  });

protocol
  .command('directives')
  .description('Manage directive conversion ledger')
  .option('--list', 'List all directives')
  .option('--pending', 'List only pending directives')
  .option('--claim <id>', 'Claim a directive by ID')
  .option('--complete <id>', 'Mark a directive as completed')
  .option('--summary', 'Show directive summary')
  .action(
    (options: {
      list?: boolean;
      pending?: boolean;
      claim?: string;
      complete?: string;
      summary?: boolean;
    }) => {
      const interceptor = new ProtocolInterceptor(repoRoot);

      if (
        options.summary ||
        (!options.list && !options.pending && !options.claim && !options.complete)
      ) {
        const summary = interceptor.directives.getSummary();
        console.log(chalk.bold.cyan('\n[Directive Conversion Ledger]\n'));
        console.log(`  Pending:    ${chalk.yellow(summary.pending)}`);
        console.log(`  Claimed:    ${chalk.blue(summary.claimed)}`);
        console.log(`  Completed:  ${chalk.green(summary.completed)}`);
        console.log(`  Cancelled:  ${chalk.dim(summary.cancelled)}`);
        console.log('');
        return;
      }

      if (options.claim) {
        const record = interceptor.directives.claim(options.claim, 'cli');
        if (record) {
          console.log(chalk.green(`Claimed directive: ${record.id}`));
        } else {
          console.log(chalk.yellow(`Directive not found or not claimable: ${options.claim}`));
        }
        return;
      }

      if (options.complete) {
        const record = interceptor.directives.complete(options.complete);
        if (record) {
          console.log(chalk.green(`Completed directive: ${record.id}`));
        } else {
          console.log(chalk.yellow(`Directive not found: ${options.complete}`));
        }
        return;
      }

      const records = interceptor.directives.list(options.pending ? 'pending' : undefined);
      if (records.length === 0) {
        console.log(chalk.dim('No directives in ledger.'));
        return;
      }

      console.log(chalk.bold.cyan('\n[Directives]\n'));
      for (const r of records) {
        const statusColor =
          r.status === 'completed'
            ? chalk.green
            : r.status === 'claimed'
              ? chalk.blue
              : chalk.yellow;
        console.log(`  ${chalk.cyan(r.id)} ${statusColor(r.status)} ${r.directive}`);
      }
      console.log('');
    }
  );

protocol
  .command('sync')
  .description('Synchronize living state with a status update')
  .option('--status <text>', 'Status string to append', '[STATUS:SYNCHRONIZED]')
  .option('--directive <text>', 'Directive to record in living state')
  .action(async (options: { status?: string; directive?: string }) => {
    const interceptor = new ProtocolInterceptor(repoRoot);
    if (options.directive) {
      await interceptor.livingState.updateDirective(options.directive);
    }
    await interceptor.livingState.markSynced();
    console.log(chalk.green(`[Living State] ${options.status || '[STATUS:SYNCHRONIZED]'}\n`));
  });

protocol
  .command('gate')
  .description('Run all protocol gates: Turn Zero, handoff source drift, session handoff')
  .option('--mode <mode>', 'Gate mode (ci, pre-push, pre-commit)', 'ci')
  .action(async (options: { mode?: string }) => {
    try {
      const interceptor = new ProtocolInterceptor(repoRoot);
      const checks = await interceptor.runPreFlightChecks();

      console.log(chalk.bold.cyan('\n[TNF Protocol Gate]\n'));
      console.log(`Mode: ${chalk.yellow(options.mode || 'ci')}`);

      if (!checks.allPassed) {
        console.warn(
          chalk.yellow(`Pre-flight: ${checks.checks.filter((c) => !c.passed).length} issue(s)`)
        );
        for (const check of checks.checks.filter((c) => !c.passed)) {
          console.warn(chalk.dim(`  - ${check.name}: ${check.details}`));
        }
      } else {
        console.log(chalk.green('Pre-flight: OK'));
      }

      await runCommand('node', [
        'scripts/protocols/validate-turn-zero-authority.cjs',
        `--mode=${options.mode || 'ci'}`,
      ]);
      await runCommand('node', [
        'scripts/protocols/validate-handoff-source-drift.cjs',
        '--mode=ci',
      ]);
      await runCommand('node', [
        'scripts/protocols/enforce-session-handoff.cjs',
        `--mode=${options.mode || 'ci'}`,
      ]);

      console.log(chalk.green('\n[TNF Protocol Gate] All checks passed.\n'));
    } catch (err: any) {
      console.error(chalk.red(`Protocol gate failed: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('doctor')
  .description('Run TNF diagnostics')
  .option('--mode <mode>', 'Execution mode: cloud (default) or local')
  .option('--allow-local-db', 'Allow local DATABASE_URL for this run')
  .option('--require-cloud-db', 'Require cloud DATABASE_URL for this run')
  .option('--no-require-cloud-db', 'Allow non-cloud DATABASE_URL for this run')
  .option('--database-url <url>', 'Override DATABASE_URL for this run')
  .option('--skip-protocol', 'Skip the TNF protocol validation panel')
  .action(
    async (options: {
      mode?: string;
      allowLocalDb?: boolean;
      requireCloudDb?: boolean;
      databaseUrl?: string;
      skipProtocol?: boolean;
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
        if (!options.skipProtocol) {
          console.log(chalk.bold.cyan('\n[TNF Doctor] Protocol validation panel\n'));
          await runFastHarnessProtocolGate('tnf doctor');
          await runCommand('node', ['scripts/validate-protocol-schemas.cjs']);
        }
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

program
  .command('mapreduce')
  .description('Run a Map-Reduce agent coordination workflow')
  .option('-i, --input <path>', 'JSON file containing input data array')
  .option('-m, --map <script>', 'Path to JavaScript file defining mapFn')
  .option('-r, --reduce <script>', 'Path to JavaScript file defining reduceFn')
  .option('-c, --concurrency <number>', 'Map concurrency level', '5')
  .option('-d, --redis <url>', 'Redis URL for agent network')
  .option('--no-local-fallback', 'Disable local fallback if Redis connection fails')
  .option('--demo', 'Run a beautiful word-count demo workflow')
  .action(
    async (options: {
      input?: string;
      map?: string;
      reduce?: string;
      concurrency?: string;
      redis?: string;
      localFallback?: boolean;
      demo?: boolean;
    }) => {
      try {
        const args = ['scripts/tnf-mapreduce.cjs'];
        if (options.input) args.push('--input', options.input);
        if (options.map) args.push('--map', options.map);
        if (options.reduce) args.push('--reduce', options.reduce);
        if (options.concurrency) args.push('--concurrency', options.concurrency);
        if (options.redis) args.push('--redis', options.redis);
        if (options.localFallback === false) args.push('--no-local-fallback');
        if (options.demo) args.push('--demo');
        await runCommand('node', args);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

program
  .command('ports')
  .description('Inspect and manage TNF development ports')
  .allowUnknownOption(true)
  .argument('[args...]', 'Arguments passed to scripts/tnf-ports.cjs')
  .action(async (args: string[] = []) => {
    try {
      await runCommand('node', ['scripts/tnf-ports.cjs', ...normalizeForwardedArgs(args)]);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const handoff = program
  .command('handoff')
  .description('Session handoff utilities for TNF continuity');

handoff
  .command('show')
  .description('Show the canonical TNF session handoff')
  .option('--json', 'Print raw SESSION_HANDOFF_LATEST.json')
  .action((options: { json?: boolean }) => {
    try {
      const handoffJsonPath = 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json';
      const handoffMdPath = 'docs/protocols/reports/SESSION_HANDOFF_LATEST.md';
      const handoffJson = readJsonFileIfPresent(handoffJsonPath);
      if (options.json) {
        if (!handoffJson) {
          throw new Error(`Missing or invalid ${handoffJsonPath}`);
        }
        console.log(JSON.stringify(handoffJson, null, 2));
        return;
      }

      console.log(chalk.bold('\nTNF Session Handoff\n'));
      if (handoffJson) {
        console.log(`  id:          ${handoffJson.handoff_id || 'unknown'}`);
        console.log(`  created_at:  ${handoffJson.created_at || 'unknown'}`);
        console.log(`  owner:       ${handoffJson.owner || 'unknown'}`);
        console.log(`  priority:    ${handoffJson?.continuation?.priority || 'unknown'}`);
        const nextActions = Array.isArray(handoffJson.next_actions) ? handoffJson.next_actions : [];
        console.log(`  next_actions:${nextActions.length}`);
        nextActions.slice(0, 5).forEach((action: any, index: number) => {
          const label =
            typeof action === 'string'
              ? action
              : action?.summary || action?.description || JSON.stringify(action);
          console.log(`    ${index + 1}. ${label}`);
        });
      } else {
        console.log(chalk.yellow(`  Missing or invalid ${handoffJsonPath}`));
      }

      const mdPreview = readTextFileIfPresent(handoffMdPath, 900);
      if (mdPreview) {
        console.log(chalk.dim('\nMarkdown preview:\n'));
        console.log(mdPreview);
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

handoff
  .command('validate')
  .description('Validate session handoff freshness, schema, and changed-path coverage')
  .option('--mode <mode>', 'Validation mode passed to enforce-session-handoff.cjs', 'ci')
  .action(async (options: { mode?: string }) => {
    try {
      await runCommand('node', [
        'scripts/protocols/enforce-session-handoff.cjs',
        `--mode=${options.mode || 'ci'}`,
      ]);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

handoff
  .command('emit')
  .description('Emit SESSION_HANDOFF_LATEST.json and markdown mirror')
  .option('--owner <owner>', 'Handoff owner')
  .option('--targets <targets>', 'Comma-separated target agents')
  .option('--priority <priority>', 'Continuation priority')
  .option('--project-ids <ids>', 'Comma-separated project ids')
  .option('--scope <scope>', 'Handoff scope')
  .option('--summary <items>', 'Summary items separated by ||')
  .option('--next-actions <items>', 'Next actions separated by ||')
  .option('--resume-checklist <items>', 'Resume checklist items separated by ||')
  .option('--auto-verify', 'Run verification while emitting handoff')
  .action(
    async (options: {
      owner?: string;
      targets?: string;
      priority?: string;
      projectIds?: string;
      scope?: string;
      summary?: string;
      nextActions?: string;
      resumeChecklist?: string;
      autoVerify?: boolean;
    }) => {
      try {
        const args = ['scripts/protocols/emit-session-handoff.cjs'];
        if (options.owner) args.push('--owner', options.owner);
        if (options.targets) args.push('--targets', options.targets);
        if (options.priority) args.push('--priority', options.priority);
        if (options.projectIds) args.push('--project-ids', options.projectIds);
        if (options.scope) args.push('--scope', options.scope);
        if (options.summary) args.push('--summary', options.summary);
        if (options.nextActions) args.push('--next-actions', options.nextActions);
        if (options.resumeChecklist) args.push('--resume-checklist', options.resumeChecklist);
        if (options.autoVerify) args.push('--auto-verify');
        await runCommand('node', args);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

handoff
  .command('refresh')
  .description('Emit a verified handoff and then validate it')
  .option('--mode <mode>', 'Validation mode passed to enforce-session-handoff.cjs', 'ci')
  .action(async (options: { mode?: string }) => {
    try {
      await runCommand('node', ['scripts/protocols/emit-session-handoff.cjs', '--auto-verify']);
      await runCommand('node', [
        'scripts/protocols/enforce-session-handoff.cjs',
        `--mode=${options.mode || 'ci'}`,
      ]);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

protocol
  .command('validate')
  .description('Run the canonical TNF protocol validation suite')
  .option('--mode <mode>', 'Session handoff validation mode', 'ci')
  .option('--skip-local-runtime', 'Skip local runtime boundary validation')
  .action(async (options: { mode?: string; skipLocalRuntime?: boolean }) => {
    try {
      await runCommand('node', ['scripts/protocols/validate-turn-zero-authority.cjs', '--mode=ci']);
      await runCommand('node', [
        'scripts/protocols/validate-handoff-source-drift.cjs',
        '--mode=ci',
      ]);
      await runCommand('node', ['scripts/validate-protocol-schemas.cjs']);
      await runCommand('node', [
        'scripts/protocols/enforce-session-handoff.cjs',
        `--mode=${options.mode || 'ci'}`,
      ]);
      if (!options.skipLocalRuntime) {
        await runCommand('node', ['scripts/protocols/validate-local-runtime-boundary.cjs']);
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

protocol
  .command('turn-zero')
  .description('Validate Turn Zero authority and run the onboarding surface')
  .option('--repair', 'Run onboarding repair before validation')
  .action(async (options: { repair?: boolean }) => {
    try {
      await runTurnZeroOnboardSurface({ repair: options.repair });
      await runCommand('node', ['scripts/protocols/validate-turn-zero-authority.cjs', '--mode=ci']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

protocol
  .command('schemas')
  .description('Validate protocol schema fixtures')
  .action(async () => {
    try {
      await runCommand('node', ['scripts/validate-protocol-schemas.cjs']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

protocol
  .command('local-runtime')
  .description('Validate local runtime boundary rules')
  .action(async () => {
    try {
      await runCommand('node', ['scripts/protocols/validate-local-runtime-boundary.cjs']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const state = program
  .command('state')
  .description('Inspect canonical TNF living state, ledger, handoff, and runtime snapshot');

state
  .command('show')
  .description('Show the current TNF harness state packet')
  .option('--full', 'Print full text instead of excerpts')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { full?: boolean; json?: boolean }) => {
    try {
      const maxChars = options.full ? 200_000 : 1600;
      const payload = {
        turnZeroMandatePresent: fs.existsSync(
          path.join(repoRoot, 'docs/protocols/TURN_ZERO_MANDATE.md')
        ),
        livingState: readTextFileIfPresent('docs/protocols/LIVING_STATE.md', maxChars),
        ledger: readTextFileIfPresent('docs/protocols/AGENT_STATUS_LEDGER.md', maxChars),
        handoff: readJsonFileIfPresent('docs/protocols/reports/SESSION_HANDOFF_LATEST.json'),
        homeHandoff: readAbsoluteJsonFileIfPresent(getHomeHandoffPath()),
        runtimeState: readJsonFileIfPresent('.agent/runtime-state.json'),
        mcpServers: getMcpServerNames(readJsonFileIfPresent('.agent/runtime-state.json')),
      };
      const handoffDivergence = getHandoffDivergence(payload.handoff, payload.homeHandoff);
      if (options.json) {
        console.log(JSON.stringify({ ...payload, handoffDivergence }, null, 2));
        return;
      }
      console.log(chalk.bold('\nTNF Harness State\n'));
      console.log(
        `Turn Zero mandate: ${payload.turnZeroMandatePresent ? chalk.green('present') : chalk.red('missing')}`
      );
      console.log(
        `Repo handoff: ${payload.handoff?.handoff_id || chalk.yellow('unavailable')} (${payload.handoff?.created_at || 'unknown'})`
      );
      console.log(
        `Home handoff: ${payload.homeHandoff?.handoff_id || payload.homeHandoff?.session || chalk.yellow('unavailable')} (${payload.homeHandoff?.created_at || payload.homeHandoff?.generatedAt || 'unknown'})`
      );
      if (handoffDivergence) {
        console.log(chalk.yellow(`Handoff divergence: ${handoffDivergence}`));
      }
      console.log(
        `MCP servers: ${payload.mcpServers.length ? payload.mcpServers.join(', ') : 'unavailable'}`
      );
      console.log(chalk.bold('\nLiving State\n'));
      console.log(payload.livingState || chalk.yellow('Unavailable.'));
      console.log(chalk.bold('\nHandoff\n'));
      console.log(
        payload.handoff
          ? JSON.stringify(payload.handoff, null, 2).slice(0, maxChars)
          : chalk.yellow('Unavailable.')
      );
      console.log(chalk.bold('\nLedger\n'));
      console.log(payload.ledger || chalk.yellow('Unavailable.'));
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const harness = program.command('harness').description('TNF terminal harness lifecycle commands');

harness
  .command('boot')
  .description('Boot relay monitor, terminal heartbeat, and director harness processes')
  .action(async () => {
    try {
      await runCommand('bash', ['scripts/runtime/harness-boot.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const registry = program
  .command('registry')
  .description('Agent registry source-of-truth and live bus utilities');

registry
  .command('check')
  .description('Validate the repo agent registry snapshot')
  .action(async () => {
    try {
      await runCommand('node', ['scripts/agent-registry/check-agent-registry.mjs']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

registry
  .command('build')
  .description('Rebuild the repo agent registry snapshot')
  .action(async () => {
    try {
      await runCommand('node', ['scripts/agent-registry/build-agent-registry.mjs']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

registry
  .command('reconcile')
  .description('Reconcile TNF and Claude agent-bank files')
  .option('--targets <targets>', 'Targets passed to reconcile-agent-banks.cjs', 'all')
  .action(async (options: { targets?: string }) => {
    try {
      await runCommand('node', [
        'scripts/agents/reconcile-agent-banks.cjs',
        '--targets',
        options.targets || 'all',
      ]);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

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

mcp
  .command('sync')
  .description('Sync MCP config between the repo source of truth and the user-local CLI config')
  .option('--from <source>', 'Sync source (repo)', 'repo')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { from?: string; json?: boolean }) => {
    try {
      if ((options.from || 'repo') !== 'repo') {
        throw new Error(
          "Only '--from repo' is currently supported to protect the canonical source of truth."
        );
      }
      const mcpManager = new MCPManagerService();
      const result = mcpManager.syncFromRepo(repoRoot);
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }
      console.log(
        chalk.green(
          `✅ Synced ${result.imported} MCP server(s) from ${path.relative(repoRoot, result.configPath)} to the user-local TNF MCP config`
        )
      );
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

mcp
  .command('health')
  .description('Run the TNF MCP health check against configured MCP servers')
  .action(async () => {
    try {
      await runCommand('node', ['scripts/mcp-health-check.cjs']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

mcp
  .command('add')
  .description('Add an MCP server')
  .argument('<name>', 'Server name')
  .requiredOption('--command <cmd>', 'Command to run')
  .option('--args <args...>', 'Arguments for the command')
  .option('--env <json>', 'Environment variables as JSON (alias: --environment)')
  .option('--environment <json>', 'Environment variables as JSON (kilo parity)')
  .option('--type <type>', 'Server type (local|remote|sse|ws)', 'local')
  .option('--cwd <path>', 'Working directory')
  .option('--enabled <bool>', 'Enable server (true|false)', 'true')
  .action(
    (
      name: string,
      options: {
        command: string;
        args?: string[];
        env?: string;
        environment?: string;
        type?: string;
        cwd?: string;
        enabled?: string;
      }
    ) => {
      try {
        let env: Record<string, string> | undefined;
        const envJson = options.environment || options.env;
        if (envJson) {
          env = JSON.parse(envJson);
        }
        const mcpManager = new MCPManagerService();
        mcpManager.addServer(name, {
          command: options.command,
          args: options.args,
          env,
          environment: env,
          type: options.type as 'local' | 'remote' | 'sse' | 'ws',
          cwd: options.cwd,
          enabled: options.enabled !== 'false',
        });
        console.log(
          chalk.green(
            `✅ Added MCP server '${name}' (type: ${options.type}, enabled: ${options.enabled !== 'false'})`
          )
        );
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

mcp
  .command('list')
  .alias('ls')
  .description('List MCP servers and their status')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const mcpManager = new MCPManagerService();
      const servers = mcpManager.listServers();
      if (options.json) {
        console.log(JSON.stringify(servers, null, 2));
        return;
      }
      console.log(chalk.bold('\nMCP Servers\n'));
      if (servers.length === 0) {
        console.log(chalk.dim('No MCP servers configured'));
      } else {
        for (const server of servers) {
          const status = server.running ? chalk.green('running') : chalk.yellow('stopped');
          const enabled = server.enabled ? chalk.green('on') : chalk.red('off');
          const type = server.type || 'local';
          const oauth = server.oauth?.enabled
            ? server.oauth.authenticated
              ? chalk.green('auth ✓')
              : chalk.red('auth ✗')
            : '';
          console.log(` ${chalk.cyan(server.name)}: ${status} [${type}] [${enabled}] ${oauth}`);
        }
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

mcp
  .command('auth')
  .description('Authenticate with an OAuth-enabled MCP server')
  .argument('[name]', 'Server name')
  .action(async (name?: string) => {
    try {
      const mcpManager = new MCPManagerService();
      if (!name) {
        const servers = mcpManager.listServers().filter((s) => s.oauth?.enabled);
        if (servers.length === 0) {
          console.log(chalk.yellow('No OAuth-enabled MCP servers configured'));
          process.exit(0);
        }
        console.log(chalk.bold('\nOAuth-enabled servers:\n'));
        for (const s of servers) {
          console.log(`  ${chalk.cyan(s.name)}`);
        }
        console.log('');
        return;
      }
      const result = await mcpManager.authenticate(name);
      console.log(chalk.cyan(`\n  Authorize URL: ${result.url}`));
      if (result.code) {
        console.log(chalk.dim(`  State: ${result.code}`));
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

mcp
  .command('logout')
  .description('Remove OAuth credentials for an MCP server')
  .argument('[name]', 'Server name')
  .action((name?: string) => {
    try {
      if (!name) {
        console.log(chalk.yellow('Please specify a server name'));
        process.exit(1);
      }
      const mcpManager = new MCPManagerService();
      if (mcpManager.logout(name)) {
        console.log(chalk.green(`✅ Logged out from '${name}'`));
      } else {
        console.log(chalk.yellow(`No credentials found for '${name}'`));
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

mcp
  .command('debug')
  .description('Debug OAuth connection for an MCP server')
  .argument('<name>', 'Server name')
  .option('--json', 'Output machine-readable JSON')
  .action(async (name: string, options: { json?: boolean }) => {
    try {
      const mcpManager = new MCPManagerService();
      const result = await mcpManager.debugConnection(name);
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }
      console.log(chalk.bold(`\nMCP Server: ${name}\n`));
      for (const diag of result.diagnostics) {
        console.log(`  ${diag}`);
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

mcp
  .command('enable <name>')
  .description('Enable an MCP server (kilo parity: per-server toggle)')
  .action((name: string) => {
    try {
      const mcpManager = new MCPManagerService();
      if (mcpManager.enableServer(name)) {
        console.log(chalk.green(`✅ MCP server '${name}' enabled`));
      } else {
        console.log(chalk.red(`MCP server '${name}' not found`));
        process.exit(1);
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

mcp
  .command('disable <name>')
  .description('Disable an MCP server without removing it (kilo parity: per-server toggle)')
  .action((name: string) => {
    try {
      const mcpManager = new MCPManagerService();
      if (mcpManager.disableServer(name)) {
        console.log(chalk.green(`✅ MCP server '${name}' disabled`));
      } else {
        console.log(chalk.red(`MCP server '${name}' not found`));
        process.exit(1);
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// ── Marketplace commands ──────────────────────────────────────────────
const marketplace = program.command('marketplace').description('Marketplace asset management');

marketplace
  .command('list')
  .description('List published catalog items from the marketplace')
  .option(
    '--kind <kind>',
    'Filter by kind (agent, agent_template, experience, mcp_server, model, prompt, skill, workflow)'
  )
  .option('--category <cat>', 'Filter by category')
  .option('--json', 'Output machine-readable JSON')
  .action(async (options: { kind?: string; category?: string; json?: boolean }) => {
    try {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        console.error(chalk.red('Error: DATABASE_URL environment variable is not set'));
        process.exit(1);
      }

      let whereClauses: string[] = ["publication_status = 'published'"];
      if (options.kind) whereClauses.push(`kind = '${options.kind.replace(/'/g, "''")}'`);
      if (options.category)
        whereClauses.push(`category = '${options.category.replace(/'/g, "''")}'`);
      const whereClause = whereClauses.join(' AND ');

      const sql = `SELECT id, slug, name, kind, category, rating, total_runs, success_rate, price_per_run, status FROM marketplace_catalog_items WHERE ${whereClause} ORDER BY kind, name;`;

      const psqlArgs = [databaseUrl, '-t', '-A', '-F', '|', '-c', sql];

      const { execSync } = await import('child_process');
      const raw = execSync(`psql "${databaseUrl}" -t -A -F '|' -c "${sql.replace(/"/g, '\\"')}"`, {
        encoding: 'utf-8',
        timeout: 15000,
        env: { ...process.env },
      });

      const lines = raw
        .trim()
        .split('\n')
        .filter((l: string) => l.length > 0);

      if (options.json) {
        const items = lines.map((line: string) => {
          const [
            id,
            slug,
            name,
            kind,
            category,
            rating,
            totalRuns,
            successRate,
            pricePerRun,
            status,
          ] = line.split('|');
          return {
            id,
            slug,
            name,
            kind,
            category,
            rating: parseFloat(rating),
            totalRuns: parseInt(totalRuns, 10),
            successRate: parseFloat(successRate),
            pricePerRun: parseFloat(pricePerRun),
            status,
          };
        });
        console.log(JSON.stringify(items, null, 2));
        return;
      }

      if (lines.length === 0) {
        console.log(chalk.yellow('No published catalog items found'));
        return;
      }

      console.log(chalk.bold('\nMarketplace Catalog Items\n'));
      for (const line of lines) {
        const [
          id,
          slug,
          name,
          kind,
          category,
          rating,
          totalRuns,
          successRate,
          pricePerRun,
          status,
        ] = line.split('|');
        const priceTag =
          parseFloat(pricePerRun) > 0 ? chalk.yellow(`$${pricePerRun}/run`) : chalk.green('free');
        const statusTag = status === 'online' ? chalk.green('online') : chalk.dim(status);
        console.log(
          `  ${chalk.cyan(slug)}  ${chalk.white(name)}  [${chalk.magenta(kind)}] [${chalk.blue(category)}]  ★${rating}  ${totalRuns} runs  ${successRate}%  ${priceTag}  ${statusTag}`
        );
      }
      console.log(chalk.dim(`\n  ${lines.length} item(s)\n`));
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

marketplace
  .command('stats')
  .description('Show marketplace breakdown by kind (counts, free vs paid)')
  .action(async () => {
    try {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        console.error(chalk.red('Error: DATABASE_URL environment variable is not set'));
        process.exit(1);
      }

      const sql = `SELECT kind, COUNT(*) AS total, COUNT(*) FILTER (WHERE price_per_run = 0) AS free, COUNT(*) FILTER (WHERE price_per_run > 0) AS paid, ROUND(AVG(rating)::numeric, 2) AS avg_rating, SUM(total_runs) AS total_runs FROM marketplace_catalog_items WHERE publication_status = 'published' GROUP BY kind ORDER BY kind;`;

      const { execSync } = await import('child_process');
      const raw = execSync(`psql "${databaseUrl}" -t -A -F '|' -c "${sql.replace(/"/g, '\\"')}"`, {
        encoding: 'utf-8',
        timeout: 15000,
        env: { ...process.env },
      });

      const lines = raw
        .trim()
        .split('\n')
        .filter((l: string) => l.length > 0);

      if (lines.length === 0) {
        console.log(chalk.yellow('No published catalog items found'));
        return;
      }

      console.log(chalk.bold('\nMarketplace Stats by Kind\n'));
      console.log(chalk.dim('  Kind                Total   Free   Paid   Avg★   Total Runs'));
      console.log(chalk.dim('  ─────────────────── ──────  ────   ────   ─────  ───────────'));
      for (const line of lines) {
        const [kind, total, free, paid, avgRating, totalRuns] = line.split('|');
        const kindPadded = kind.padEnd(20);
        console.log(
          `  ${chalk.magenta(kindPadded)} ${chalk.white(total.padStart(5))}   ${chalk.green(free.padStart(4))}   ${chalk.yellow(paid.padStart(4))}   ${avgRating.padStart(5)}   ${totalRuns.padStart(11)}`
        );
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

marketplace
  .command('seed')
  .description('Run the marketplace seed script against $DATABASE_URL')
  .action(async () => {
    try {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        console.error(chalk.red('Error: DATABASE_URL environment variable is not set'));
        process.exit(1);
      }

      const seedPath = path.resolve(repoRoot, 'scripts/marketplace/seed-catalog-items.sql');
      if (!fs.existsSync(seedPath)) {
        console.error(chalk.red(`Error: Seed script not found at ${seedPath}`));
        process.exit(1);
      }

      console.log(chalk.blue('Seeding marketplace catalog items...'));
      await runCommand('psql', [databaseUrl, '-f', seedPath], { cwd: repoRoot });
      console.log(chalk.green('✅ Marketplace catalog items seeded successfully'));
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

marketplace
  .command('curate')
  .description('Trigger the marketplace research crawl to discover and curate new items')
  .action(async () => {
    try {
      const port = process.env.TNF_API_PORT || '3001';
      const url = `http://localhost:${port}/marketplace/research/crawl/run`;
      console.log(chalk.blue(`Triggering marketplace curation crawl at ${url}...`));

      const response = await fetch(url, { method: 'POST' });
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${body || response.statusText}`);
      }

      const data = await response.json();
      console.log(chalk.green('✅ Crawl triggered successfully'));
      if (data.runId) {
        console.log(chalk.dim(`  Run ID: ${data.runId}`));
        console.log(chalk.dim(`  Check status with: tnf marketplace crawl-status ${data.runId}`));
      } else {
        console.log(chalk.dim(`  Response: ${JSON.stringify(data)}`));
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

marketplace
  .command('crawl-status')
  .description('Check marketplace crawl run status')
  .argument('[runId]', 'Specific crawl run ID to check')
  .action(async (runId?: string) => {
    try {
      const port = process.env.TNF_API_PORT || '3001';
      const url = runId
        ? `http://localhost:${port}/marketplace/research/crawl/runs/${runId}`
        : `http://localhost:${port}/marketplace/research/crawl/runs`;
      console.log(chalk.blue(`Fetching crawl status from ${url}...`));

      const response = await fetch(url);
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${body || response.statusText}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        console.log(chalk.bold('\nCrawl Runs\n'));
        if (data.length === 0) {
          console.log(chalk.dim('No crawl runs found'));
        } else {
          for (const run of data) {
            const statusColor =
              run.status === 'completed'
                ? chalk.green
                : run.status === 'failed'
                  ? chalk.red
                  : chalk.yellow;
            console.log(
              `  ${chalk.cyan(run.id || run.runId || '?')}  ${statusColor(run.status || '?')}  ${chalk.dim(run.startedAt || run.created_at || '')}  items: ${run.itemsFound ?? run.items_found ?? '?'}`
            );
          }
        }
        console.log('');
      } else {
        const statusColor =
          data.status === 'completed'
            ? chalk.green
            : data.status === 'failed'
              ? chalk.red
              : chalk.yellow;
        console.log(chalk.bold('\nCrawl Run Status\n'));
        console.log(`  ID:      ${chalk.cyan(data.id || data.runId || '?')}`);
        console.log(`  Status:  ${statusColor(data.status || '?')}`);
        if (data.startedAt || data.created_at) {
          console.log(`  Started: ${data.startedAt || data.created_at}`);
        }
        if (data.completedAt || data.completed_at) {
          console.log(`  Ended:   ${data.completedAt || data.completed_at}`);
        }
        if (data.itemsFound !== undefined || data.items_found !== undefined) {
          console.log(`  Items:   ${data.itemsFound ?? data.items_found}`);
        }
        if (data.error) {
          console.log(`  Error:   ${chalk.red(data.error)}`);
        }
        console.log('');
      }
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

ai.command('models')
  .description('List available models for the current provider')
  .action(async () => {
    try {
      const { LLMClient } = await import('./utils/llm-client.js');
      const client = await LLMClient.create();
      console.log(chalk.blue('\nFetching available models...'));
      const models = await client.fetchAvailableModels();
      if (models.length === 0) {
        console.log(chalk.yellow('No models found or provider does not support listing.'));
      } else {
        console.log(chalk.green(`\nAvailable models:`));
        models.forEach((m: string) => console.log(` - ${m}`));
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

ai.command('chat')
  .description('Interactive chat with LLM (Ctrl+C or .exit to quit)')
  .option('-m, --model <model>', 'Model to use')
  .option('-t, --temperature <temp>', 'Temperature (0-2)', '0.7')
  .option('--system <prompt>', 'System prompt')
  .action(async (opts) => {
    try {
      const readline = await import('readline');
      const { LLMClient } = await import('./utils/llm-client.js');
      const client = await LLMClient.create('orchestrator');

      // Override model if specified
      if (opts.model) {
        process.env.TNF_LLM_MODEL = opts.model;
        await client.resolveProvider(); // Re-resolve with new model
      }

      const messages: ChatMessage[] = [];
      if (opts.system) {
        messages.push({ role: 'system', content: opts.system });
      }

      console.log(chalk.blue('\n📟 TNF CLI Chat'));
      console.log(chalk.dim('Type /help for commands, /exit to quit, /clear to clear history\n'));
      console.log(chalk.dim('Provider: ' + client.baseUrl));
      console.log(chalk.dim('Model: ' + client.model + '\n'));

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        completer: createSlashCompleter(repoRoot),
      });
      const slashDropdown = attachSlashCommandDropdown(rl, repoRoot);

      const ask = (prompt: string): Promise<string> =>
        new Promise((resolve) => rl.question(prompt, resolve));

      while (true) {
        const input = resolveSlashDropdownInput(await ask(chalk.green('\n> ')), slashDropdown);
        const trimmed = input.trim();
        if (trimmed === '.exit') break;
        if (trimmed === '.clear') {
          messages.length = opts.system ? 1 : 0;
          console.log(chalk.dim('History cleared'));
          continue;
        }
        if (!trimmed) continue;

        let outbound = trimmed;
        const slashOutcome = await handleInteractiveSlashCommand(trimmed, {
          messages,
          systemMessageCount: opts.system ? 1 : 0,
          client,
        });
        if (slashOutcome.handled) {
          if (slashOutcome.exit) break;
          if (!slashOutcome.prompt) continue;
          outbound = slashOutcome.prompt;
        }

        messages.push({ role: 'user' as const, content: outbound });

        try {
          const response = await client.chatComplete(messages, {
            temperature: parseFloat(opts.temperature),
          });
          console.log(chalk.cyan('\nA: ' + response));
          messages.push({ role: 'assistant' as const, content: response });
        } catch (err: any) {
          console.error(chalk.red('Error: ' + err.message));
        }
      }

      rl.close();
      console.log(chalk.blue('\n👋 Chat session ended'));
    } catch (err: any) {
      console.error(chalk.red('Error: ' + err.message));
      process.exit(1);
    }
  });

program
  .command('chat')
  .description('Start an interactive chat session with the TNF Orchestrator (Gemini OAuth)')
  .argument('[query...]', 'Initial message')
  .action(async (query: string[]) => {
    try {
      const systemPromptPath = path.join(repoRoot, '.agent/SYSTEM_PROMPT.md');
      const systemPrompt = fs.existsSync(systemPromptPath)
        ? fs.readFileSync(systemPromptPath, 'utf8')
        : 'You are the TNF Orchestrator agent.';

      const args = ['--prompt-interactive', systemPrompt];
      if (query.length > 0) {
        args.push(query.join(' '));
      }

      // Ensure MCP config is loaded
      const mcpConfigPath = path.join(repoRoot, 'data/mcp.clients/gemini.mcp.json');
      const env: Record<string, string> = {};
      if (fs.existsSync(mcpConfigPath)) {
        env.TNF_MCP_CONFIG_PATH = mcpConfigPath;
        env.MCP_CONFIG_PATH = mcpConfigPath;
      }

      await runCommand('gemini', args, { env });
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

program
  .command('hermes')
  .description('Pass through any Hermes Agent CLI command')
  .argument('[args...]', 'Arguments forwarded to hermes');

program
  .command('gemini')
  .description('DEPRECATED: Use `tnf agy` instead. Pass through any Gemini CLI command')
  .argument('[args...]', 'Arguments forwarded to gemini');

program
  .command('cursor')
  .description('Pass through any Cursor CLI command with TNF harness MCP routing')
  .argument('[args...]', 'Arguments forwarded to cursor')
  .action(async (args: string[]) => {
    await runPassthrough('cursor', args);
  });

program
  .command('agy')
  .description('Pass through any Antigravity Agent CLI command (uses Gemini models)')
  .argument('[args...]', 'Arguments forwarded to agy')
  .option('--dangerously-skip-permissions', 'Skip all permission prompts')
  .action(async (args: string[], options: { dangerouslySkipPermissions?: boolean }) => {
    try {
      const agyArgs = [...args];
      if (options.dangerouslySkipPermissions) {
        agyArgs.unshift('--dangerously-skip-permissions');
      }
      await runCommand('agy', agyArgs);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const relay = program.command('relay').description('Relay operations');
relay
  .command('start')
  .description('Start relay-core relay service')
  .option(
    '--super-admin-token <token>',
    'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)'
  )
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
  .option(
    '--super-admin-token <token>',
    'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)'
  )
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
  .option(
    '--super-admin-token <token>',
    'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)'
  )
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
  .option(
    '--super-admin-token <token>',
    'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)'
  )
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
  .option(
    '--super-admin-token <token>',
    'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)'
  )
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
  .option(
    '--super-admin-token <token>',
    'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)'
  )
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
  .option(
    '--super-admin-token <token>',
    'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)'
  )
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
  .option(
    '--super-admin-token <token>',
    'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)'
  )
  .action(async (options: { superAdminToken?: string }) => {
    try {
      requireSuperAdmin(options, 'jules cron-install');
      await runCommand('bash', ['scripts/install-jules-cron.sh']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const mirror = program.command('mirror').description('iPhone mirroring and AI vision operations');

mirror
  .command('setup')
  .description('Install dependencies for mirroring (UxPlay, Python libs)')
  .action(async () => {
    try {
      console.log(chalk.blue('Installing system dependencies (Homebrew libraries for UxPlay)...'));
      await runCommand('brew', [
        'install',
        'cmake',
        'libplist',
        'openssl@3',
        'pkg-config',
        'gstreamer',
        'gst-plugins-base',
        'gst-plugins-good',
        'gst-plugins-bad',
        'gst-libav',
      ]);

      console.log(chalk.blue('Checking for UxPlay binary...'));
      try {
        await runCommand('which', ['uxplay']);
        console.log(chalk.green('UxPlay already installed.'));
      } catch {
        console.log(chalk.yellow('UxPlay not found. Building from source...'));
        const tmpDir = '/tmp/uxplay-build';
        await runCommand('rm', ['-rf', tmpDir]);
        await runCommand('git', ['clone', 'https://github.com/FDH2/UxPlay.git', tmpDir]);
        const buildCmd = `cd ${tmpDir} && cmake . && make`;
        await runCommand('bash', ['-c', buildCmd]);
        await runCommand('sudo', ['make', '-C', tmpDir, 'install']);
        console.log(chalk.green('UxPlay built and installed successfully.'));
      }

      console.log(chalk.blue('Installing Python dependencies...'));
      try {
        await runCommand('pip', ['install', 'pyautogui', 'opencv-python', 'numpy']);
      } catch {
        await runCommand('pip3', ['install', 'pyautogui', 'opencv-python', 'numpy']);
      }
      console.log(chalk.green('Setup complete!'));
    } catch (err: any) {
      console.error(chalk.red(`Error during setup: ${err.message}`));
      process.exit(1);
    }
  });

mirror
  .command('start')
  .description('Start the Vision Bridge mirroring server')
  .action(async () => {
    try {
      await runCommand('python3', ['scripts/iphone_ai_mirror.py']);
    } catch (err: any) {
      console.error(chalk.red(`Error starting mirror: ${err.message}`));
      process.exit(1);
    }
  });

const forge = program
  .command('forge')
  .description('LLVM-powered JIT compilation and native optimization');

forge
  .command('status')
  .description('Check the status of the LLVM/Forge toolchain')
  .action(async () => {
    try {
      console.log(chalk.blue('Checking Forge toolchain...'));
      await runCommand('clang', ['--version']);
      console.log(chalk.green('LLVM/Clang is ready.'));
    } catch {
      console.log(chalk.red('LLVM/Clang not found. Run "tnf mirror setup" to install.'));
    }
  });

forge
  .command('test-math')
  .description('Run a JIT compilation speed test (Python vs Forged C)')
  .action(async () => {
    try {
      console.log(chalk.blue('Starting math speed test...'));
      await runCommand('python3', ['scripts/tnf_forge.py']);
    } catch (err: any) {
      console.error(chalk.red(`Forge test failed: ${err.message}`));
    }
  });

forge
  .command('test-python')
  .description('Run a Python Hot-Swap test (Injected Native Code)')
  .action(async () => {
    try {
      console.log(chalk.blue('Starting Python acceleration test...'));
      await runCommand('python3', ['scripts/python_accelerator.py']);
    } catch (err: any) {
      console.error(chalk.red(`Acceleration test failed: ${err.message}`));
    }
  });

forge
  .command('test-gateway')
  .description('Run Omni-TNF Gateway Native Accelerator test (Phase 2 Scaffolding)')
  .action(async () => {
    try {
      console.log(chalk.blue('Starting Omni-TNF Gateway native test...'));
      await runCommand('python3', ['scripts/omni_gateway_accelerator.py']);
    } catch (err: any) {
      console.error(chalk.red(`Gateway test failed: ${err.message}`));
    }
  });

function resolveMasterClockLogDir(): string {
  return (
    normalizeToken(process.env.LOG_DIR) ??
    path.join(process.env.HOME || '/tmp', '.tnf-master-clock')
  );
}

function resolveLatestMasterClockLogPath(logDir: string): string | null {
  if (!fs.existsSync(logDir) || !fs.statSync(logDir).isDirectory()) return null;
  const candidates = fs
    .readdirSync(logDir)
    .filter((entry) => /^master-\d{4}-\d{2}-\d{2}\.jsonl$/.test(entry))
    .sort();
  if (candidates.length === 0) return null;
  return path.join(logDir, candidates[candidates.length - 1]);
}

const masterClock = program
  .command('master-clock')
  .description('Master clock controls (provider-routed; local default)');
masterClock
  .command('start')
  .description('Start master-clock locally (default) or via a provider adapter')
  .option('--provider <provider>', 'Control-plane provider: local|cloud_runtime')
  .option('--local', 'Legacy shortcut for --provider local', false)
  .option(
    '--service <name>',
    'CloudRuntime service name for master clock (used when --provider cloud_runtime)',
    'tnf-master-clock'
  )
  .option(
    '--super-admin-token <token>',
    'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)'
  )
  .action(
    async (options: {
      provider?: string;
      local?: boolean;
      service: string;
      superAdminToken?: string;
    }) => {
      try {
        requireSuperAdmin(options, 'master-clock start');
        const provider = resolveControlPlaneProvider(options, [MASTER_CLOCK_PROVIDER_ENV_KEY]);
        if (provider === 'local') {
          await runCommand('pnpm', ['--filter', '@the-new-fuse/relay-core', 'run', 'master-clock']);
          return;
        }

        assertCloudRuntimeAvailable('master-clock start');
        console.log(chalk.cyan(`Starting master clock on CloudRuntime service ${options.service}`));
        await runCommand('cloud_runtime', ['up', '--service', options.service]);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

masterClock
  .command('logs')
  .description('Tail master-clock logs (local by default, CloudRuntime as provider fallback)')
  .option('--provider <provider>', 'Control-plane provider: local|cloud_runtime')
  .option('--local', 'Legacy shortcut for --provider local', false)
  .option(
    '--service <name>',
    'CloudRuntime service name for master clock (used when --provider cloud_runtime)',
    'tnf-master-clock'
  )
  .option('--lines <n>', 'Number of local log lines to show', '120')
  .option('--no-follow', 'Show local log tail and exit')
  .option(
    '--super-admin-token <token>',
    'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)'
  )
  .action(
    async (options: {
      provider?: string;
      local?: boolean;
      service: string;
      lines?: string;
      follow?: boolean;
      superAdminToken?: string;
    }) => {
      try {
        requireSuperAdmin(options, 'master-clock logs');
        const provider = resolveControlPlaneProvider(options, [MASTER_CLOCK_PROVIDER_ENV_KEY]);
        if (provider === 'local') {
          const logDir = resolveMasterClockLogDir();
          const logPath = resolveLatestMasterClockLogPath(logDir);
          if (!logPath) {
            throw new Error(
              `No local master-clock log file found in ${logDir}. Start master-clock first or set LOG_DIR.`
            );
          }
          const lines = parsePositiveIntegerOption(options.lines, 120, '--lines');
          const args =
            options.follow === false
              ? ['-n', String(lines), logPath]
              : ['-n', String(lines), '-f', logPath];
          await runCommand('tail', args, { cwd: process.cwd() });
          return;
        }

        assertCloudRuntimeAvailable('master-clock logs');
        await runCommand('cloud_runtime', ['logs', '--service', options.service]);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

masterClock
  .command('status')
  .description('Show master-clock status (provider-routed)')
  .option('--provider <provider>', 'Control-plane provider: local|cloud_runtime')
  .option('--local', 'Legacy shortcut for --provider local', false)
  .option(
    '--service <name>',
    'CloudRuntime service name for master clock (used when --provider cloud_runtime)',
    'tnf-master-clock'
  )
  .option('--json', 'Output machine-readable JSON for local status checks')
  .option(
    '--super-admin-token <token>',
    'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)'
  )
  .action(
    async (options: {
      provider?: string;
      local?: boolean;
      service: string;
      json?: boolean;
      superAdminToken?: string;
    }) => {
      try {
        requireSuperAdmin(options, 'master-clock status');
        const provider = resolveControlPlaneProvider(options, [MASTER_CLOCK_PROVIDER_ENV_KEY]);
        if (provider === 'local') {
          const logDir = resolveMasterClockLogDir();
          const logPath = resolveLatestMasterClockLogPath(logDir);
          const payload = {
            provider,
            logDir,
            latestLogPath: logPath,
            latestLogUpdatedAt: logPath ? fs.statSync(logPath).mtime.toISOString() : null,
            redisUrlConfigured: Boolean(normalizeToken(process.env.REDIS_URL)),
            relayUrl: normalizeToken(process.env.RELAY_URL) ?? null,
          };
          if (options.json) {
            console.log(JSON.stringify(payload, null, 2));
          } else {
            console.log(chalk.bold('\nMaster Clock Local Status\n'));
            console.log(`Provider: ${chalk.cyan(provider)}`);
            console.log(
              `Redis configured: ${payload.redisUrlConfigured ? chalk.green('yes') : chalk.yellow('no')}`
            );
            console.log(`Relay URL: ${chalk.dim(payload.relayUrl || 'not set')}`);
            console.log(`Log dir: ${chalk.dim(logDir)}`);
            console.log(
              `Latest log: ${
                logPath
                  ? `${chalk.green(path.relative(repoRoot, logPath))} ${chalk.dim(`(${payload.latestLogUpdatedAt})`)}`
                  : chalk.yellow('none')
              }`
            );
            console.log(
              chalk.dim(
                "\nUse 'tnf super-cycle status --provider local' for runtime process snapshot.\n"
              )
            );
          }
          return;
        }

        assertCloudRuntimeAvailable('master-clock status');
        await runCommand('cloud_runtime', ['status', '--service', options.service]);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

const superCycle = program
  .command('super-cycle')
  .description('Super-cycle controls (provider-routed; local default)');
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
  .option('--provider <provider>', 'Control-plane provider: local|cloud_runtime')
  .option('--local', 'Legacy shortcut for --provider local', false)
  .option(
    '--service <name>',
    'CloudRuntime service name (used when --provider cloud_runtime)',
    'tnf-master-clock'
  )
  .option(
    '--super-admin-token <token>',
    'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)'
  )
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
      provider?: string;
      local?: boolean;
      service: string;
      superAdminToken?: string;
    }) => {
      try {
        requireSuperAdmin(options, 'super-cycle event');
        const provider = resolveControlPlaneProvider(options, [SUPER_CYCLE_PROVIDER_ENV_KEY]);
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

        if (provider === 'local') {
          await runCommand('pnpm', baseArgs);
          return;
        }

        assertCloudRuntimeAvailable('super-cycle event');
        console.log(
          chalk.cyan(`Sending super-cycle event via CloudRuntime service ${options.service}`)
        );
        await runCommand('cloud_runtime', [
          'run',
          '--service',
          options.service,
          'pnpm',
          ...baseArgs,
        ]);
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
  .option(
    '--super-admin-token <token>',
    'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)'
  )
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
  .option(
    '--super-admin-token <token>',
    'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)'
  )
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
  .option(
    '--super-admin-token <token>',
    'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)'
  )
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
  .description('Read super-cycle state snapshot (provider-routed)')
  .option('--provider <provider>', 'Control-plane provider: local|cloud_runtime')
  .option('--local', 'Legacy shortcut for --provider local', false)
  .option(
    '--service <name>',
    'CloudRuntime service name (used when --provider cloud_runtime)',
    'tnf-master-clock'
  )
  .option(
    '--super-admin-token <token>',
    'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)'
  )
  .action(
    async (options: {
      provider?: string;
      local?: boolean;
      service: string;
      superAdminToken?: string;
    }) => {
      try {
        requireSuperAdmin(options, 'super-cycle status');
        const provider = resolveControlPlaneProvider(options, [SUPER_CYCLE_PROVIDER_ENV_KEY]);
        if (provider === 'local') {
          await runCommand('pnpm', [
            '--filter',
            '@the-new-fuse/relay-core',
            'run',
            'super-cycle:status',
          ]);
          return;
        }

        assertCloudRuntimeAvailable('super-cycle status');
        await runCommand('cloud_runtime', [
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
    }
  );

program
  .command('run')
  .description('Execute any root package script through unified TNF CLI')
  .argument('<script>', 'Root package.json script name')
  .argument('[args...]', 'Arguments to forward')
  .option(
    '--super-admin-token <token>',
    'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)'
  )
  .option('--skip-protocol-gate', 'Skip fast TNF protocol gate before execution')
  .action(
    async (
      script: string,
      args: string[],
      options: { superAdminToken?: string; skipProtocolGate?: boolean }
    ) => {
      try {
        requireSuperAdmin(options, 'run');
        if (!options.skipProtocolGate) {
          await runFastHarnessProtocolGate(`tnf run ${script}`);
        }
        const cmdArgs = ['run', script];
        if (args.length > 0) cmdArgs.push('--', ...args);
        await runCommand('pnpm', cmdArgs);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

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
  .option('--skip-protocol-gate', 'Skip fast TNF protocol gate before execution')
  .action(async (target: string, args: string[], options: { skipProtocolGate?: boolean }) => {
    try {
      if (!options.skipProtocolGate) {
        await runFastHarnessProtocolGate(`tnf scripts run ${target}`);
      }
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

const library = program
  .command('library')
  .description('Virtual Library consolidation, audit, and mirror sync operations');

library
  .command('audit')
  .description('Generate canonical Virtual Library surface map and report')
  .action(async () => {
    try {
      await runCommand('python3', ['scripts/autonomy/virtual_library_surface_audit.py']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

library
  .command('sync')
  .description('Sync canonical Virtual Library repo into TNF mirror (dry-run by default)')
  .option('--apply', 'Apply sync changes (default: dry-run)')
  .option('--delete', 'Allow deletions in mirror during sync')
  .action(async (options: { apply?: boolean; delete?: boolean }) => {
    try {
      const args = ['scripts/autonomy/sync_virtual_library_mirror.sh'];
      if (options.apply) args.push('--apply');
      if (options.delete) args.push('--delete');
      await runCommand('bash', args);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

library
  .command('status')
  .description('Show Virtual Library canonicalization status')
  .option('--refresh', 'Rebuild audit map before reading status')
  .option('--json', 'Output machine-readable JSON')
  .action(async (options: { refresh?: boolean; json?: boolean }) => {
    try {
      if (options.refresh) {
        await runCommand('python3', ['scripts/autonomy/virtual_library_surface_audit.py']);
      }

      const mapPath = path.join(
        repoRoot,
        'docs/protocols/storage/tnf-virtual-library-surface-map.json'
      );
      if (!fs.existsSync(mapPath)) {
        throw new Error(
          `Surface map not found at ${mapPath}. Run 'tnf library audit' to generate it.`
        );
      }

      const data = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
      if (options.json) {
        console.log(JSON.stringify(data, null, 2));
        return;
      }

      const canonical = data?.canonicalization?.canonical_codebase || 'n/a';
      const mirror = data?.canonicalization?.monorepo_mirror_codebase || 'n/a';
      const drift = data?.canonicalization?.drift || {};
      const generatedAt = data?.generated_at_utc || 'n/a';
      const tables = Array.isArray(data?.surfaces?.story_data_authoritative_tables)
        ? data.surfaces.story_data_authoritative_tables
        : [];

      console.log(chalk.bold('\n📚 TNF Virtual Library Status\n'));
      console.log(`   Generated: ${chalk.dim(generatedAt)}`);
      console.log(`   Canonical: ${chalk.cyan(canonical)}`);
      console.log(`   Mirror:    ${chalk.cyan(mirror)}`);
      console.log(
        `   Drift: head=${chalk.yellow(String(!!drift.head_mismatch))} branch=${chalk.yellow(
          String(!!drift.branch_mismatch)
        )} remote=${chalk.yellow(String(!!drift.remote_mismatch))}`
      );
      console.log(`   Story authority tables: ${chalk.green(String(tables.length))}`);
      for (const table of tables) {
        console.log(`     - ${table}`);
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const selfImprovement = program
  .command('self-improvement')
  .description('Deterministic TNF self-improvement loop and artifact controls');

selfImprovement
  .command('run')
  .description('Run full self-improvement loop (build, audits, scorecard, architecture map)')
  .option('--base-url <url>', 'Public base URL used by semantic/auth audits')
  .option('--api-url <url>', 'API base URL used by auth audit')
  .option('--max-depth <n>', 'Max crawl depth for live link audit', '5')
  .option('--max-pages <n>', 'Max page count for live link audit', '500')
  .option('--max-external <n>', 'Max external URL checks for live link audit', '400')
  .option('--skip-build', 'Skip frontend build stage')
  .option('--skip-live-links', 'Skip live-link crawl stage')
  .option('--skip-semantic', 'Skip semantic route audit stage')
  .option('--skip-auth', 'Skip auth path audit stage')
  .option('--skip-scorecard', 'Skip self-improvement scorecard generation stage')
  .option('--skip-mermaid', 'Skip architecture mermaid generation stage')
  .option('--note <text>', 'Override protocol run-log note')
  .option('--json', 'Output machine-readable JSON summary')
  .option(
    '--super-admin-token <token>',
    'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)'
  )
  .action(
    async (
      options: {
        baseUrl?: string;
        apiUrl?: string;
        maxDepth?: string;
        maxPages?: string;
        maxExternal?: string;
        skipBuild?: boolean;
        skipLiveLinks?: boolean;
        skipSemantic?: boolean;
        skipAuth?: boolean;
        skipScorecard?: boolean;
        skipMermaid?: boolean;
        note?: string;
        json?: boolean;
        superAdminToken?: string;
      } = {}
    ) => {
      try {
        requireSuperAdmin(options, 'self-improvement run');
        const startedAt = new Date();
        const startedAtMs = startedAt.getTime();
        const baseUrl = resolveSelfImprovementBaseUrl(options.baseUrl);
        const apiUrl = resolveSelfImprovementApiUrl(options.apiUrl);
        const maxDepth = parsePositiveIntegerOption(options.maxDepth, 5, '--max-depth');
        const maxPages = parsePositiveIntegerOption(options.maxPages, 500, '--max-pages');
        const maxExternal = parsePositiveIntegerOption(options.maxExternal, 400, '--max-external');
        const frontendCwd = path.join(repoRoot, 'apps/frontend');
        const expectedArtifacts: string[] = [];

        if (!options.skipBuild) {
          await runCommand('pnpm', ['--filter', '@the-new-fuse/frontend-app', 'run', 'build']);
        }
        if (!options.skipLiveLinks) {
          await runCommand('pnpm', ['run', 'audit:live-links'], {
            cwd: frontendCwd,
            env: {
              LIVE_AUDIT_MAX_DEPTH: String(maxDepth),
              LIVE_AUDIT_MAX_PAGES: String(maxPages),
              LIVE_AUDIT_MAX_EXTERNAL: String(maxExternal),
              FAIL_ON_BROKEN: '1',
            },
          });
          expectedArtifacts.push(SELF_IMPROVEMENT_ARTIFACTS.liveLinkCrawlJson);
        }
        if (!options.skipSemantic) {
          await runCommand('pnpm', ['run', 'audit:all-routes-semantic'], {
            cwd: frontendCwd,
            env: {
              SEMANTIC_AUDIT_BASE_URL: baseUrl,
              FAIL_ON_SEMANTIC_ISSUES: '1',
            },
          });
          expectedArtifacts.push(SELF_IMPROVEMENT_ARTIFACTS.semanticAuditJson);
        }
        if (!options.skipAuth) {
          await runCommand('pnpm', ['run', 'audit:auth-paths'], {
            cwd: frontendCwd,
            env: {
              AUTH_AUDIT_PUBLIC_BASE_URL: baseUrl,
              AUTH_AUDIT_API_BASE_URL: apiUrl,
              FAIL_ON_AUTH_ISSUES: '1',
            },
          });
          expectedArtifacts.push(SELF_IMPROVEMENT_ARTIFACTS.authPathAuditJson);
        }
        if (!options.skipScorecard) {
          await runCommand('pnpm', ['run', 'audit:self-improvement-scorecard'], {
            cwd: frontendCwd,
            env: {
              FAIL_ON_SCORECARD: '1',
            },
          });
          expectedArtifacts.push(
            SELF_IMPROVEMENT_ARTIFACTS.scorecardJson,
            SELF_IMPROVEMENT_ARTIFACTS.scorecardMd
          );
        }
        if (!options.skipMermaid) {
          await runCommand('python3', [
            'scripts/architecture/generate_tnf_master_mermaid.py',
            '--repo',
            repoRoot,
            '--out',
            SELF_IMPROVEMENT_ARTIFACTS.architectureMermaid,
          ]);
          expectedArtifacts.push(SELF_IMPROVEMENT_ARTIFACTS.architectureMermaid);
        }

        const runNote =
          normalizeToken(options.note) ||
          `Executed via tnf self-improvement run (base-url=${baseUrl}, api-url=${apiUrl})`;
        const runLogPath = appendSelfImprovementRunLog(runNote);
        expectedArtifacts.push(runLogPath);

        const verification = assertExpectedArtifacts(expectedArtifacts, startedAtMs);
        if (verification.missing.length > 0) {
          throw new Error(`Missing expected artifacts:\n- ${verification.missing.join('\n- ')}`);
        }
        if (verification.stale.length > 0) {
          throw new Error(
            `Stale artifact timestamps detected:\n- ${verification.stale.join('\n- ')}`
          );
        }

        const payload = {
          ok: true,
          startedAt: startedAt.toISOString(),
          finishedAt: new Date().toISOString(),
          baseUrl,
          apiUrl,
          expectedArtifacts: expectedArtifacts.map((p) => path.relative(repoRoot, p)),
          artifacts: collectSelfImprovementArtifactStatus().map((entry) => ({
            ...entry,
            path: path.relative(repoRoot, entry.path),
          })),
        };

        if (options.json) {
          console.log(JSON.stringify(payload, null, 2));
          return;
        }

        console.log(chalk.bold('\nTNF Self-Improvement Run Complete\n'));
        console.log(`Base URL: ${chalk.cyan(baseUrl)}`);
        console.log(`API URL: ${chalk.cyan(apiUrl)}`);
        console.log(`Artifacts verified: ${chalk.green(String(payload.expectedArtifacts.length))}`);
        console.log(`Run log: ${chalk.dim(path.relative(repoRoot, runLogPath))}`);
        console.log('');
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

selfImprovement
  .command('status')
  .description('Show current self-improvement artifact and scorecard state')
  .option('--strict', 'Exit non-zero when required artifacts are missing or scorecard fails')
  .option('--json', 'Output machine-readable JSON')
  .action(async (options: { strict?: boolean; json?: boolean } = {}) => {
    try {
      const required = [
        SELF_IMPROVEMENT_ARTIFACTS.liveLinkCrawlJson,
        SELF_IMPROVEMENT_ARTIFACTS.semanticAuditJson,
        SELF_IMPROVEMENT_ARTIFACTS.authPathAuditJson,
        SELF_IMPROVEMENT_ARTIFACTS.scorecardJson,
        SELF_IMPROVEMENT_ARTIFACTS.architectureMermaid,
      ];
      const artifacts = collectSelfImprovementArtifactStatus();
      const missingRequired = required.filter((artifactPath) => !fs.existsSync(artifactPath));

      let scorecard: any = null;
      if (fs.existsSync(SELF_IMPROVEMENT_ARTIFACTS.scorecardJson)) {
        scorecard = JSON.parse(fs.readFileSync(SELF_IMPROVEMENT_ARTIFACTS.scorecardJson, 'utf8'));
      }

      const scorecardPassed = scorecard?.overall?.passed === true;
      const payload = {
        ok: missingRequired.length === 0 && (scorecard ? scorecardPassed : false),
        missingRequired: missingRequired.map((artifactPath) =>
          path.relative(repoRoot, artifactPath)
        ),
        scorecard: scorecard
          ? {
              generatedAt: scorecard.generatedAt ?? null,
              passed: Boolean(scorecard?.overall?.passed),
              requiredAuditsPresent: Boolean(scorecard?.overall?.requiredAuditsPresent),
            }
          : null,
        artifacts: artifacts.map((entry) => ({
          ...entry,
          path: path.relative(repoRoot, entry.path),
        })),
      };

      if (options.json) {
        console.log(JSON.stringify(payload, null, 2));
      } else {
        console.log(chalk.bold('\nTNF Self-Improvement Status\n'));
        console.log(`Overall: ${payload.ok ? chalk.green('PASS') : chalk.red('FAIL')}`);
        if (payload.scorecard) {
          console.log(
            `Scorecard: ${payload.scorecard.passed ? chalk.green('PASS') : chalk.red('FAIL')} (${chalk.dim(payload.scorecard.generatedAt || 'unknown')})`
          );
        } else {
          console.log(`Scorecard: ${chalk.yellow('missing')}`);
        }

        if (payload.missingRequired.length > 0) {
          console.log(chalk.yellow('\nMissing required artifacts:'));
          for (const item of payload.missingRequired) {
            console.log(`- ${item}`);
          }
        }
        console.log('');
      }

      if (options.strict && !payload.ok) {
        process.exit(1);
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

selfImprovement
  .command('scorecard')
  .description('Generate self-improvement scorecard from existing audit artifacts')
  .option('--no-fail', 'Do not fail even if scorecard checks fail')
  .action(async (options: { fail?: boolean } = {}) => {
    try {
      await runCommand('pnpm', ['run', 'audit:self-improvement-scorecard'], {
        cwd: path.join(repoRoot, 'apps/frontend'),
        env: {
          FAIL_ON_SCORECARD: options.fail === false ? '0' : '1',
        },
      });
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

selfImprovement
  .command('mermaid')
  .description('Generate TNF master framework mermaid architecture map')
  .option(
    '--out <path>',
    'Output file path',
    path.relative(repoRoot, SELF_IMPROVEMENT_ARTIFACTS.architectureMermaid)
  )
  .action(async (options: { out?: string } = {}) => {
    try {
      const outPath = options.out
        ? path.resolve(repoRoot, options.out)
        : SELF_IMPROVEMENT_ARTIFACTS.architectureMermaid;
      await runCommand('python3', [
        'scripts/architecture/generate_tnf_master_mermaid.py',
        '--repo',
        repoRoot,
        '--out',
        outPath,
      ]);
      console.log(chalk.green(`Wrote ${path.relative(repoRoot, outPath)}`));
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

selfImprovement
  .command('log')
  .description('Append a self-improvement note to the run log')
  .argument('<note...>', 'Note text')
  .action((noteParts: string[]) => {
    try {
      const note = noteParts.join(' ').trim();
      if (!note) {
        throw new Error('Note text is required');
      }
      const logPath = appendSelfImprovementRunLog(note);
      console.log(chalk.green(`Updated ${path.relative(repoRoot, logPath)}`));
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const fullAuto = program
  .command('full-auto')
  .description('Run unattended TNF automation loops with persisted state/logging');

fullAuto
  .command('provision')
  .description('Install full-auto command+skill artifacts into detected agent runtimes')
  .option(
    '--targets <list>',
    'Comma-separated targets: codex,claude,gemini,opencode,kilo,augment,tnf,hermes,project,all',
    'all'
  )
  .option('--dry-run', 'Preview changes without writing files')
  .option('--json', 'Output machine-readable JSON summary')
  .action(async (options: { targets?: string; dryRun?: boolean; json?: boolean } = {}) => {
    try {
      const args = ['scripts/agents/provision-full-auto-network.cjs'];
      if (options.targets) args.push('--targets', options.targets);
      if (options.dryRun) args.push('--dry-run');
      if (options.json) args.push('--json');
      await runCommand('node', args);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

fullAuto
  .command('once')
  .description('Run one unattended cycle (self-improvement + optional orchestration broadcast)')
  .option('--base-url <url>', 'Public base URL used by semantic/auth audits')
  .option('--api-url <url>', 'API base URL used by auth audit')
  .option('--max-depth <n>', 'Max crawl depth for live link audit')
  .option('--max-pages <n>', 'Max page count for live link audit')
  .option('--max-external <n>', 'Max external URL checks for live link audit')
  .option('--skip-build', 'Skip frontend build stage')
  .option('--skip-live-links', 'Skip live-link crawl stage')
  .option('--skip-semantic', 'Skip semantic route audit stage')
  .option('--skip-auth', 'Skip auth path audit stage')
  .option('--skip-scorecard', 'Skip self-improvement scorecard generation stage')
  .option('--skip-mermaid', 'Skip architecture mermaid generation stage')
  .option('--skip-strict-status', 'Do not fail the full-auto cycle on self-improvement status')
  .option('--note <text>', 'Override protocol run-log note')
  .option('--broadcast', 'Also run `tnf orchestrate self-improvement` after loop completion')
  .option('--json', 'Output machine-readable JSON summary')
  .option(
    '--super-admin-token <token>',
    'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)'
  )
  .action(
    async (
      options: SelfImprovementRunCliOptions & {
        broadcast?: boolean;
        json?: boolean;
        skipStrictStatus?: boolean;
      }
    ) => {
      try {
        requireSuperAdmin(options, 'full-auto once');

        const startedAt = new Date();
        const cycleArgs = buildSelfImprovementRunCliArgs(options);
        await runSelfCli(cycleArgs);

        if (options.broadcast) {
          await runSelfCli(['orchestrate', 'self-improvement']);
        }

        await runSelfCli(buildSelfImprovementStatusCliArgs(options));
        const finishedAt = new Date();
        const event: FullAutoRunEvent = {
          cycle: 1,
          startedAt: startedAt.toISOString(),
          finishedAt: finishedAt.toISOString(),
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          ok: true,
        };

        appendJsonLine(FULL_AUTO_RUN_LOG_PATH, event);
        writeFullAutoState({
          mode: 'idle',
          updatedAt: finishedAt.toISOString(),
          intervalMinutes: 0,
          maxCycles: 1,
          completedCycles: 1,
          failedCycles: 0,
          lastRun: event,
        });

        if (options.json) {
          console.log(JSON.stringify(event, null, 2));
          return;
        }

        console.log(chalk.bold('\nTNF Full-Auto Cycle Complete\n'));
        console.log(`Duration: ${chalk.cyan(`${event.durationMs}ms`)}`);
        console.log(`Run log: ${chalk.dim(path.relative(repoRoot, FULL_AUTO_RUN_LOG_PATH))}`);
        console.log(`State: ${chalk.dim(path.relative(repoRoot, FULL_AUTO_STATE_PATH))}`);
        console.log('');
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

fullAuto
  .command('start')
  .description('Run continuous unattended cycles in the current terminal process')
  .option(
    '--interval-minutes <n>',
    'Wait time between cycles',
    String(DEFAULT_FULL_AUTO_INTERVAL_MINUTES)
  )
  .option('--max-cycles <n>', 'Number of cycles before stop (0 = run forever)', '0')
  .option('--base-url <url>', 'Public base URL used by semantic/auth audits')
  .option('--api-url <url>', 'API base URL used by auth audit')
  .option('--max-depth <n>', 'Max crawl depth for live link audit')
  .option('--max-pages <n>', 'Max page count for live link audit')
  .option('--max-external <n>', 'Max external URL checks for live link audit')
  .option('--skip-build', 'Skip frontend build stage')
  .option('--skip-live-links', 'Skip live-link crawl stage')
  .option('--skip-semantic', 'Skip semantic route audit stage')
  .option('--skip-auth', 'Skip auth path audit stage')
  .option('--skip-scorecard', 'Skip self-improvement scorecard generation stage')
  .option('--skip-mermaid', 'Skip architecture mermaid generation stage')
  .option('--skip-strict-status', 'Do not fail cycles on self-improvement status')
  .option('--broadcast', 'Also run `tnf orchestrate self-improvement` after each cycle')
  .option('--strict', 'Stop loop on first cycle failure')
  .option(
    '--super-admin-token <token>',
    'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)'
  )
  .action(
    async (
      options: SelfImprovementRunCliOptions & {
        intervalMinutes?: string;
        maxCycles?: string;
        broadcast?: boolean;
        strict?: boolean;
        skipStrictStatus?: boolean;
      }
    ) => {
      try {
        requireSuperAdmin(options, 'full-auto start');

        const intervalMinutes = parsePositiveIntegerOption(
          options.intervalMinutes,
          DEFAULT_FULL_AUTO_INTERVAL_MINUTES,
          '--interval-minutes'
        );
        const maxCycles = parseNonNegativeIntegerOption(options.maxCycles, 0, '--max-cycles');
        const cycleArgs = buildSelfImprovementRunCliArgs(options);
        const intervalMs = intervalMinutes * 60 * 1000;
        let completedCycles = 0;
        let failedCycles = 0;

        writeFullAutoState({
          mode: 'running',
          updatedAt: new Date().toISOString(),
          intervalMinutes,
          maxCycles,
          completedCycles,
          failedCycles,
        });

        console.log(chalk.bold('\nTNF Full-Auto Loop Started\n'));
        console.log(`Interval: ${chalk.cyan(`${intervalMinutes} minute(s)`)}`);
        console.log(`Max cycles: ${chalk.cyan(maxCycles === 0 ? 'unbounded' : String(maxCycles))}`);
        console.log(`State: ${chalk.dim(path.relative(repoRoot, FULL_AUTO_STATE_PATH))}`);
        console.log('');

        let cycle = 0;
        while (maxCycles === 0 || cycle < maxCycles) {
          cycle += 1;
          const startedAt = new Date();
          let event: FullAutoRunEvent = {
            cycle,
            startedAt: startedAt.toISOString(),
            finishedAt: startedAt.toISOString(),
            durationMs: 0,
            ok: false,
          };

          try {
            await runSelfCli(cycleArgs);
            if (options.broadcast) {
              await runSelfCli(['orchestrate', 'self-improvement']);
            }
            await runSelfCli(buildSelfImprovementStatusCliArgs(options));

            const finishedAt = new Date();
            event = {
              cycle,
              startedAt: startedAt.toISOString(),
              finishedAt: finishedAt.toISOString(),
              durationMs: finishedAt.getTime() - startedAt.getTime(),
              ok: true,
            };
            completedCycles += 1;
            console.log(
              chalk.green(
                `[full-auto] cycle ${cycle} completed in ${Math.round(event.durationMs / 1000)}s`
              )
            );
          } catch (err: any) {
            const finishedAt = new Date();
            event = {
              cycle,
              startedAt: startedAt.toISOString(),
              finishedAt: finishedAt.toISOString(),
              durationMs: finishedAt.getTime() - startedAt.getTime(),
              ok: false,
              error: err instanceof Error ? err.message : String(err),
            };
            failedCycles += 1;
            console.error(chalk.red(`[full-auto] cycle ${cycle} failed: ${event.error}`));

            appendJsonLine(FULL_AUTO_RUN_LOG_PATH, event);
            writeFullAutoState({
              mode: options.strict ? 'idle' : 'running',
              updatedAt: new Date().toISOString(),
              intervalMinutes,
              maxCycles,
              completedCycles,
              failedCycles,
              lastRun: event,
            });

            if (options.strict) {
              throw err;
            }
          }

          appendJsonLine(FULL_AUTO_RUN_LOG_PATH, event);
          writeFullAutoState({
            mode: 'running',
            updatedAt: new Date().toISOString(),
            intervalMinutes,
            maxCycles,
            completedCycles,
            failedCycles,
            lastRun: event,
          });

          if (maxCycles > 0 && cycle >= maxCycles) {
            break;
          }

          console.log(
            chalk.dim(`[full-auto] sleeping ${intervalMinutes} minute(s) before next cycle...`)
          );
          await sleepMs(intervalMs);
        }

        writeFullAutoState({
          mode: 'idle',
          updatedAt: new Date().toISOString(),
          intervalMinutes,
          maxCycles,
          completedCycles,
          failedCycles,
          lastRun: readLastJsonLine(FULL_AUTO_RUN_LOG_PATH) || undefined,
        });

        console.log(chalk.bold('\nTNF Full-Auto Loop Complete\n'));
        console.log(`Completed cycles: ${chalk.green(String(completedCycles))}`);
        console.log(
          `Failed cycles: ${failedCycles > 0 ? chalk.yellow(String(failedCycles)) : chalk.green('0')}`
        );
        console.log('');
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

const fullAutoDaemon = fullAuto
  .command('daemon')
  .description('Compatibility wrapper for detached full-auto loop operations');

fullAutoDaemon
  .command('start')
  .description('Start `tnf full-auto start` as a detached background process')
  .option(
    '--interval-minutes <n>',
    'Wait time between cycles',
    String(DEFAULT_FULL_AUTO_INTERVAL_MINUTES)
  )
  .option('--max-cycles <n>', 'Number of cycles before stop (0 = run forever)', '0')
  .option('--base-url <url>', 'Public base URL used by semantic/auth audits')
  .option('--api-url <url>', 'API base URL used by auth audit')
  .option('--max-depth <n>', 'Max crawl depth for live link audit')
  .option('--max-pages <n>', 'Max page count for live link audit')
  .option('--max-external <n>', 'Max external URL checks for live link audit')
  .option('--skip-build', 'Skip frontend build stage')
  .option('--skip-live-links', 'Skip live-link crawl stage')
  .option('--skip-semantic', 'Skip semantic route audit stage')
  .option('--skip-auth', 'Skip auth path audit stage')
  .option('--skip-scorecard', 'Skip self-improvement scorecard generation stage')
  .option('--skip-mermaid', 'Skip architecture mermaid generation stage')
  .option('--skip-strict-status', 'Do not fail cycles on self-improvement status')
  .option('--broadcast', 'Also run `tnf orchestrate self-improvement` after each cycle')
  .option('--strict', 'Stop loop on first cycle failure')
  .option('--force', 'Start another detached loop even if one is already visible')
  .option('--json', 'Output machine-readable JSON')
  .option(
    '--super-admin-token <token>',
    'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)'
  )
  .action(
    async (
      options: SelfImprovementRunCliOptions & {
        intervalMinutes?: string;
        maxCycles?: string;
        broadcast?: boolean;
        strict?: boolean;
        skipStrictStatus?: boolean;
        force?: boolean;
        json?: boolean;
      }
    ) => {
      try {
        requireSuperAdmin(options, 'full-auto daemon start');

        const existing = findFullAutoStartProcesses();
        if (existing.length > 0 && !options.force) {
          const payload = {
            started: false,
            reason: 'already-running',
            processes: existing,
            logPath: path.relative(repoRoot, FULL_AUTO_DAEMON_LOG_PATH),
          };
          if (options.json) {
            console.log(JSON.stringify(payload, null, 2));
            return;
          }
          console.log(chalk.yellow('TNF full-auto daemon is already running.'));
          for (const proc of existing) {
            console.log(`- pid=${chalk.cyan(String(proc.pid))} ${chalk.dim(proc.cmd)}`);
          }
          console.log(`Log: ${chalk.dim(path.relative(repoRoot, FULL_AUTO_DAEMON_LOG_PATH))}`);
          return;
        }

        ensureParentDir(FULL_AUTO_DAEMON_LOG_PATH);
        const outFd = fs.openSync(FULL_AUTO_DAEMON_LOG_PATH, 'a');
        const errFd = fs.openSync(FULL_AUTO_DAEMON_LOG_PATH, 'a');
        const args = buildFullAutoStartArgs(options);
        const child = spawn(process.execPath, [...process.execArgv, cliEntryPath, ...args], {
          cwd: repoRoot,
          detached: true,
          env: {
            ...process.env,
            TNF_INVOCATION_CWD: invocationCwd,
            [SUPER_ADMIN_INPUT_ENV_KEY]:
              process.env[SUPER_ADMIN_INPUT_ENV_KEY] ||
              process.env[SUPER_ADMIN_ENV_KEY] ||
              options.superAdminToken ||
              '',
          },
          stdio: ['ignore', outFd, errFd],
        });
        child.unref();
        fs.closeSync(outFd);
        fs.closeSync(errFd);

        const payload = {
          started: true,
          pid: child.pid,
          command: ['tnf', ...args],
          logPath: path.relative(repoRoot, FULL_AUTO_DAEMON_LOG_PATH),
        };
        if (options.json) {
          console.log(JSON.stringify(payload, null, 2));
          return;
        }

        console.log(chalk.green('TNF full-auto daemon started.'));
        console.log(`PID: ${chalk.cyan(String(child.pid))}`);
        console.log(`Command: ${chalk.dim(payload.command.join(' '))}`);
        console.log(`Log: ${chalk.dim(payload.logPath)}`);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

fullAutoDaemon
  .command('status')
  .description('Show detached full-auto loop process and persisted state')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean } = {}) => {
    try {
      const state = readFullAutoState();
      const lastRun = readLastJsonLine(FULL_AUTO_RUN_LOG_PATH);
      const processes = findFullAutoStartProcesses();
      const payload = {
        running: processes.length > 0,
        processes,
        state,
        lastRun,
        statePath: path.relative(repoRoot, FULL_AUTO_STATE_PATH),
        runLogPath: path.relative(repoRoot, FULL_AUTO_RUN_LOG_PATH),
        daemonLogPath: path.relative(repoRoot, FULL_AUTO_DAEMON_LOG_PATH),
      };

      if (options.json) {
        console.log(JSON.stringify(payload, null, 2));
        return;
      }

      console.log(chalk.bold('\nTNF Full-Auto Daemon Status\n'));
      console.log(`Running: ${payload.running ? chalk.green('yes') : chalk.yellow('no')}`);
      for (const proc of processes) {
        console.log(`- pid=${chalk.cyan(String(proc.pid))} ${chalk.dim(proc.cmd)}`);
      }
      if (state) {
        console.log(
          `Mode: ${state.mode === 'running' ? chalk.green('running') : chalk.cyan('idle')}`
        );
        console.log(`Updated: ${chalk.dim(state.updatedAt)}`);
        console.log(`Completed cycles: ${chalk.green(String(state.completedCycles))}`);
        console.log(
          `Failed cycles: ${state.failedCycles > 0 ? chalk.yellow(String(state.failedCycles)) : chalk.green('0')}`
        );
      }
      if (lastRun) {
        console.log(
          `Last cycle: cycle=${lastRun.cycle} ok=${lastRun.ok} durationMs=${lastRun.durationMs}`
        );
      }
      console.log(`Log: ${chalk.dim(payload.daemonLogPath)}`);
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

fullAuto
  .command('status')
  .description('Show persisted full-auto loop state and latest cycle result')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean } = {}) => {
    try {
      const state = readFullAutoState();
      const lastRun = readLastJsonLine(FULL_AUTO_RUN_LOG_PATH);
      const payload = {
        state,
        lastRun,
        statePath: path.relative(repoRoot, FULL_AUTO_STATE_PATH),
        runLogPath: path.relative(repoRoot, FULL_AUTO_RUN_LOG_PATH),
      };

      if (options.json) {
        console.log(JSON.stringify(payload, null, 2));
        return;
      }

      console.log(chalk.bold('\nTNF Full-Auto Status\n'));
      if (!state) {
        console.log(chalk.yellow('No full-auto state file found yet.'));
      } else {
        console.log(
          `Mode: ${state.mode === 'running' ? chalk.green('running') : chalk.cyan('idle')}`
        );
        console.log(`Updated: ${chalk.dim(state.updatedAt)}`);
        console.log(`Interval: ${chalk.cyan(`${state.intervalMinutes} minute(s)`)}`);
        console.log(
          `Max cycles: ${chalk.cyan(state.maxCycles === 0 ? 'unbounded' : String(state.maxCycles))}`
        );
        console.log(`Completed cycles: ${chalk.green(String(state.completedCycles))}`);
        console.log(
          `Failed cycles: ${state.failedCycles > 0 ? chalk.yellow(String(state.failedCycles)) : chalk.green('0')}`
        );
      }

      if (lastRun) {
        console.log('\nLast cycle:');
        console.log(`- cycle=${lastRun.cycle} ok=${lastRun.ok} durationMs=${lastRun.durationMs}`);
        if (lastRun.error) {
          console.log(`- error=${lastRun.error}`);
        }
      }

      console.log(`\nState file: ${chalk.dim(path.relative(repoRoot, FULL_AUTO_STATE_PATH))}`);
      console.log(`Run log: ${chalk.dim(path.relative(repoRoot, FULL_AUTO_RUN_LOG_PATH))}`);
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const zeroTurnCommand = program
  .command('zero-turn')
  .description(
    'TNF zero-turn autonomous boot — native self-contained operation without external dependencies'
  );

zeroTurnCommand
  .command('boot')
  .description('Boot TNF for indefinite autonomous operation with zero manual turns')
  .option('--profile <name>', 'Profile/instance name', 'default')
  .option('--model <model>', 'LLM model to use', 'minimaxai/minimax-m3')
  .option('--no-daemon', 'Run in foreground mode (for debugging)')
  .option('--plan', 'Print boot plan without executing')
  .option(
    '--super-admin-token <token>',
    'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)'
  )
  .action(
    async (options: {
      profile?: string;
      model?: string;
      daemon?: boolean;
      plan?: boolean;
      superAdminToken?: string;
    }) => {
      try {
        requireSuperAdmin(options, 'zero-turn boot');

        console.log(chalk.bold.cyan('\n🚀 TNF Zero-Turn Autonomous Boot\n'));
        console.log(chalk.dim(`Profile: ${options.profile}`));
        console.log(chalk.dim(`Model: ${options.model}`));
        console.log(chalk.dim(`Mode: ${options.daemon !== false ? 'daemon' : 'foreground'}\n`));

        if (options.plan) {
          console.log(chalk.bold('\nBoot Plan:\n'));
          console.log('  [1] Set working model configuration');
          console.log('  [2] Start TNF agent daemon (autonomous thinking every 120s)');
          console.log('  [3] Start TNF director loop (local orchestration)');
          console.log('  [4] Start terminal heartbeat pulse (session monitoring)');
          console.log('  [5] Register agents on TNF bus');
          console.log('  [6] Verify autonomous operation\n');
          return;
        }

        type BootStep = {
          label: string;
          critical: boolean;
          action: () => Promise<void>;
        };

        const steps: BootStep[] = [
          {
            label: 'Setting working model',
            critical: true,
            action: async () => {
              await runCommand('hermes', [
                'config',
                'set',
                'model',
                options.model || 'nvidia/z-ai/glm-5',
              ]);
            },
          },
          {
            label: 'Starting TNF agent daemon',
            critical: true,
            action: async () => {
              const daemonArgs = options.daemon !== false ? ['live'] : ['live', '--foreground'];
              await runCommand(
                'python3',
                [path.join(os.homedir(), '.hermes/scripts/tnf-agent-daemon.py'), ...daemonArgs],
                {
                  isBackground: options.daemon !== false,
                }
              );
            },
          },
          {
            label: 'Starting TNF director loop',
            critical: false,
            action: async () => {
              await runCommand(
                'node',
                [path.join(os.homedir(), '.tnf/bin/tnf-director-loop.cjs')],
                {
                  isBackground: true,
                }
              );
            },
          },
          {
            label: 'Starting terminal heartbeat pulse',
            critical: false,
            action: async () => {
              await runCommand(
                'node',
                [path.join(os.homedir(), '.tnf/bin/terminal-heartbeat-pulse.cjs')],
                {
                  isBackground: true,
                }
              );
            },
          },
          {
            label: 'Verifying agent registration',
            critical: true,
            action: async () => {
              const { execSync } = await import('child_process');
              try {
                const output = execSync('redis-cli HGETALL tnf:agent-registry', {
                  encoding: 'utf8',
                });
                if (output.trim()) {
                  console.log(chalk.dim('   Agents registered on TNF bus'));
                } else {
                  throw new Error('No agents found in tnf:agent-registry');
                }
              } catch (err: any) {
                if (err.message.includes('redis-cli')) {
                  console.log(chalk.yellow('   Redis CLI not available, skipping verification'));
                } else {
                  throw err;
                }
              }
            },
          },
          {
            label: 'Verifying heartbeat cron',
            critical: false,
            action: async () => {
              try {
                const { execSync } = await import('child_process');
                const output = execSync('hermes cronjob action=list', { encoding: 'utf8' });
                if (output.includes('heartbeat')) {
                  console.log(chalk.dim('   Heartbeat self-wake cron active'));
                } else {
                  console.log(chalk.yellow('   Heartbeat cron not found, installing...'));
                  // Use the canonical TNF repo path. The symlink at
                  // ~/.hermes/scripts/tnf-heartbeat-selfwake.py points here too,
                  // but TNF should source scripts from its own tree.
                  const tnfScript = path.join(
                    repoRoot,
                    'scripts',
                    'agents',
                    'tnf-heartbeat-selfwake.py'
                  );
                  await runCommand('hermes', [
                    'cronjob',
                    'action=create',
                    '--schedule',
                    '*/5 * * * *',
                    '--script',
                    path.join(os.homedir(), '.hermes/scripts/tnf-heartbeat-selfwake.py'),
                    '--name',
                    'TNF Heartbeat Self-Wake',
                    '--no-agent',
                  ]);
                }
              } catch (err: any) {
                console.log(chalk.yellow('   Cron verification skipped'));
              }
            },
          },
        ];

        const warnings: string[] = [];
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          process.stdout.write(chalk.white(`[${i + 1}/${steps.length}] ${step.label}... `));
          try {
            await step.action();
            process.stdout.write(chalk.green('OK\n'));
          } catch (err: any) {
            process.stdout.write(chalk.red('FAILED\n'));
            const message = err?.message || String(err);
            if (step.critical) {
              console.error(chalk.red(`   Error: ${message}`));
              throw new Error(`Critical boot failure in step: ${step.label}`);
            }
            warnings.push(`${step.label}: ${message}`);
            console.error(chalk.yellow(`   Warning: ${message}`));
          }
        }

        console.log(chalk.bold.green('\n✅ TNF Zero-Turn Autonomous Boot Complete!\n'));
        console.log(chalk.dim('   The system is now running autonomously indefinitely.\n'));
        console.log(chalk.dim('   Autonomous signals:\n'));
        console.log(chalk.dim('   - Thinks autonomously every 120s (daemon live mode)'));
        console.log(chalk.dim('   - Publishes health assessments to TNF bus'));
        console.log(chalk.dim('   - Self-heals via heartbeat cron (restarts dead processes)'));
        console.log(chalk.dim('   - Consumes tasks from tnf:master:tasks:realtime\n'));

        if (warnings.length > 0) {
          console.log(chalk.yellow(`⚠️  Completed with ${warnings.length} warning(s):\n`));
          for (const warning of warnings) {
            console.log(chalk.yellow(`   - ${warning}\n`));
          }
        }

        console.log(chalk.dim('   Reference commands:\n'));
        console.log(chalk.dim('   - pgrep -af tnf-agent-daemon'));
        console.log(chalk.dim('   - pgrep -af tnf-director-loop'));
        console.log(chalk.dim('   - redis-cli HGETALL tnf:agent-registry'));
        console.log(chalk.dim('   - tail -f ~/.tnf/logs/daemon.log\n'));
      } catch (err: any) {
        console.error(chalk.red(`\n❌ Zero-turn boot aborted: ${err.message}\n`));
        process.exit(1);
      }
    }
  );

zeroTurnCommand
  .command('status')
  .description('Check TNF zero-turn autonomous operation status')
  .option('--json', 'Output machine-readable JSON')
  .action(async (options: { json?: boolean } = {}) => {
    try {
      const status: any = {
        timestamp: new Date().toISOString(),
        daemon: false,
        director: false,
        heartbeat: false,
        agents: [],
      };

      const { execSync } = await import('child_process');

      try {
        const daemonOutput = execSync('pgrep -af tnf-agent-daemon', {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore'],
        });
        status.daemon = daemonOutput.trim().length > 0;
        if (status.daemon) {
          console.log(chalk.green('✅ TNF Agent Daemon: running'));
        } else {
          console.log(chalk.red('❌ TNF Agent Daemon: not running'));
        }
      } catch {
        console.log(chalk.red('❌ TNF Agent Daemon: not running'));
      }

      try {
        const directorOutput = execSync('pgrep -af tnf-director-loop', {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore'],
        });
        status.director = directorOutput.trim().length > 0;
        if (status.director) {
          console.log(chalk.green('✅ TNF Director Loop: running'));
        } else {
          console.log(chalk.red('❌ TNF Director Loop: not running'));
        }
      } catch {
        console.log(chalk.red('❌ TNF Director Loop: not running'));
      }

      try {
        const heartbeatOutput = execSync('pgrep -af terminal-heartbeat-pulse', {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore'],
        });
        status.heartbeat = heartbeatOutput.trim().length > 0;
        if (status.heartbeat) {
          console.log(chalk.green('✅ Terminal Heartbeat: running'));
        } else {
          console.log(chalk.red('❌ Terminal Heartbeat: not running'));
        }
      } catch {
        console.log(chalk.red('❌ Terminal Heartbeat: not running'));
      }

      try {
        const registryOutput = execSync('redis-cli HGETALL tnf:agent-registry', {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore'],
        });
        const lines = registryOutput.trim().split('\n');
        for (let i = 0; i < lines.length; i += 2) {
          const agentId = lines[i];
          const agentData = lines[i + 1];
          if (agentId && agentData) {
            try {
              const parsed = JSON.parse(agentData);
              status.agents.push({
                id: agentId,
                name: parsed.name,
                role: parsed.role,
                status: parsed.status,
                lastSeen: parsed.lastSeen,
              });
            } catch {
              status.agents.push({ id: agentId, raw: agentData });
            }
          }
        }
        if (status.agents.length > 0) {
          console.log(chalk.green(`\n✅ ${status.agents.length} agent(s) registered on TNF bus:`));
          for (const agent of status.agents) {
            console.log(
              chalk.dim(
                `   - ${agent.id} (${agent.name || 'unknown'}) - ${agent.role || 'unknown'}`
              )
            );
          }
        } else {
          console.log(chalk.yellow('\n⚠️  No agents registered on TNF bus'));
        }
      } catch {
        console.log(chalk.yellow('\n⚠️  Could not query agent registry (Redis unavailable)'));
      }

      if (options.json) {
        console.log(JSON.stringify(status, null, 2));
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

zeroTurnCommand
  .command('stop')
  .description('Stop TNF zero-turn autonomous operation')
  .action(async () => {
    try {
      console.log(chalk.yellow('Stopping TNF zero-turn autonomous services...\n'));

      const { execSync } = await import('child_process');

      const processes = [
        { name: 'TNF Agent Daemon', pattern: 'tnf-agent-daemon' },
        { name: 'TNF Director Loop', pattern: 'tnf-director-loop' },
        { name: 'Terminal Heartbeat', pattern: 'terminal-heartbeat-pulse' },
      ];

      for (const proc of processes) {
        try {
          execSync(`pkill -f ${proc.pattern}`, { stdio: 'ignore' });
          console.log(chalk.green(`✅ ${proc.name}: stopped`));
        } catch {
          console.log(chalk.dim(`   ${proc.name}: not running`));
        }
      }

      console.log(chalk.green('\n✅ TNF zero-turn autonomous operation stopped\n'));
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
                const activateResult = await postVoiceActivate(port);
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
            const sendResult = await postVoiceSend(direction.toPort, input.text);
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
  .action(async (options: { profile?: string; port?: string; json?: boolean }) => {
    try {
      const port = inferVoiceBridgePort(options.profile, options.port);
      const payload = (await readVoiceBridgeJson('/activate', 'POST', port)) as Record<
        string,
        unknown
      >;
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
  .action(async (options: { profile?: string; port?: string; json?: boolean }) => {
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

      const serverReachable = await waitForVoiceServer(port, 1000);

      let micState: Record<string, unknown> | null = null;
      let kwsState: Record<string, unknown> | null = null;
      if (serverReachable) {
        micState = (await readVoiceBridgeJson('/mic_state', 'GET', port)) as Record<
          string,
          unknown
        >;
        kwsState = (await readVoiceBridgeJson('/kws_state', 'GET', port)) as Record<
          string,
          unknown
        >;
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
              const result = await postVoiceActivate(snapshot.port);
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

const hooks = program
  .command('hooks')
  .description('HookChain operations (logs, test, replay, explain)');

hooks
  .command('test')
  .description('Validate and dry-run a HookChain against an event fixture')
  .option('--chain <name>', 'HookChain name from registry')
  .option('--file <path>', 'Local HookChain definition file (JSON/YAML)')
  .option('--event <path>', 'Event fixture file (JSON/YAML)')
  .option('--strict', 'Fail when warnings are present')
  .option('--render-plan', 'Include compiled node/edge render plan')
  .option('--record', `Append this dry-run result to ${HOOK_RUN_LOG_PATH}`)
  .option('--json', 'Output machine-readable JSON')
  .option('--tenant <id>', 'Override tenant/workspace scope')
  .option('--trace-id <uuid>', 'Attach correlation ID')
  .option('--verbose', 'Include debug fields and execution timings')
  .action(
    async (options: {
      chain?: string;
      file?: string;
      event?: string;
      strict?: boolean;
      renderPlan?: boolean;
      record?: boolean;
      json?: boolean;
      tenant?: string;
      traceId?: string;
      verbose?: boolean;
    }) => {
      const startedAt = Date.now();
      const diagnostics: HookDiagnostic[] = [];

      try {
        const hasChainName = typeof options.chain === 'string' && options.chain.trim().length > 0;
        const hasChainFile = typeof options.file === 'string' && options.file.trim().length > 0;
        if (hasChainName === hasChainFile) {
          throw new HookCliError(
            "Provide exactly one of '--chain <name>' or '--file <path>'.",
            HOOKS_EXIT_CODES.INVALID_ARGUMENTS
          );
        }
        if (!options.event || options.event.trim().length === 0) {
          throw new HookCliError(
            "Missing required '--event <path>' fixture.",
            HOOKS_EXIT_CODES.INVALID_ARGUMENTS
          );
        }

        const eventPath = path.isAbsolute(options.event)
          ? options.event
          : path.resolve(process.cwd(), options.event);
        if (!fs.existsSync(eventPath) || !fs.statSync(eventPath).isFile()) {
          throw new HookCliError(
            `Event fixture not found: ${eventPath}`,
            HOOKS_EXIT_CODES.RESOURCE_NOT_FOUND
          );
        }

        const parsedEvent = await parseJsonOrYamlFile(eventPath);
        const event = toHookRecord(parsedEvent);
        if (!event) {
          throw new HookCliError(
            `Event fixture must parse to an object: ${eventPath}`,
            HOOKS_EXIT_CODES.VALIDATION_FAILURE
          );
        }

        let chainPath = '';
        if (hasChainFile && options.file) {
          chainPath = path.isAbsolute(options.file)
            ? options.file
            : path.resolve(process.cwd(), options.file);
          if (!fs.existsSync(chainPath) || !fs.statSync(chainPath).isFile()) {
            throw new HookCliError(
              `HookChain file not found: ${chainPath}`,
              HOOKS_EXIT_CODES.RESOURCE_NOT_FOUND
            );
          }
        } else if (hasChainName && options.chain) {
          const discovered = await findHookChainFileByName(options.chain.trim());
          if (!discovered) {
            throw new HookCliError(
              `HookChain '${options.chain.trim()}' was not found in registry dirs: ${resolveHookRegistryDirs().join(', ')}`,
              HOOKS_EXIT_CODES.RESOURCE_NOT_FOUND
            );
          }
          chainPath = discovered;
        }

        const parsedChain = await parseJsonOrYamlFile(chainPath);
        diagnostics.push(...validateHookChainDefinition(parsedChain));

        const chain = toHookRecord(parsedChain);
        if (!chain) {
          addHookDiagnostic(
            diagnostics,
            'error',
            'CHAIN_NOT_OBJECT',
            'Parsed HookChain definition must be an object.'
          );
        }

        const triggerEvaluation = chain
          ? evaluateHookTriggerMatch(chain, event, diagnostics)
          : { matched: false, expectedEvent: null, receivedEvent: extractEventType(event) };
        const plan = chain
          ? buildHookStepPlan(chain, event, triggerEvaluation.matched, diagnostics)
          : [];
        const workflowProjection = chain ? buildWorkflowProjection(chain, plan) : null;
        const compiled = {
          node_count: plan.length,
          edge_count: plan.length > 0 ? plan.length - 1 : 0,
          workflow_node_count: Array.isArray(workflowProjection?.nodes)
            ? workflowProjection.nodes.length
            : 0,
          workflow_connection_count: Array.isArray(workflowProjection?.connections)
            ? workflowProjection.connections.length
            : 0,
        };

        const errors = formatHookDiagnostics(diagnostics, 'error');
        const warnings = formatHookDiagnostics(diagnostics, 'warning');
        const strict = options.strict === true;
        const valid = errors.length === 0 && (!strict || warnings.length === 0);

        let exitCode: number = HOOKS_EXIT_CODES.SUCCESS;
        if (!valid) {
          exitCode = HOOKS_EXIT_CODES.VALIDATION_FAILURE;
        } else if (warnings.length > 0) {
          exitCode = HOOKS_EXIT_CODES.PARTIAL_SUCCESS;
        }

        const metadata = toHookRecord(chain?.metadata);
        const chainName =
          typeof metadata?.name === 'string'
            ? metadata.name
            : hasChainName && options.chain
              ? options.chain
              : path.basename(chainPath, path.extname(chainPath));

        const payload: Record<string, unknown> = {
          valid,
          strict,
          exit_code: exitCode,
          chain: {
            name: chainName,
            version: metadata?.version ?? null,
            source: chainPath,
          },
          event: {
            fixture: eventPath,
            expected_event: triggerEvaluation.expectedEvent,
            received_event: triggerEvaluation.receivedEvent,
            matched: triggerEvaluation.matched,
            tenant: options.tenant || null,
            trace_id: options.traceId || null,
          },
          compiled,
          plan,
          warnings,
          errors,
        };

        if (options.renderPlan) {
          payload.render_plan = {
            nodes: plan.map((entry, index) => ({
              id: entry.step,
              index,
              runner: entry.runner,
            })),
            edges:
              plan.length > 1
                ? plan.slice(0, -1).map((entry, index) => ({
                    from: entry.step,
                    to: plan[index + 1].step,
                  }))
                : [],
            workflow_definition: workflowProjection,
          };
        }

        if (options.verbose) {
          payload.debug = {
            registry_dirs: resolveHookRegistryDirs(),
            run_log_path: HOOK_RUN_LOG_PATH,
            evaluated_at: new Date().toISOString(),
            duration_ms: Date.now() - startedAt,
          };
        }

        if (options.record) {
          const runId = createHookRunId('dryrun');
          const runRecord: HookRunRecord = {
            run_id: runId,
            status: 'dry_run',
            chain: chainName,
            chain_source: chainPath,
            trigger_event: triggerEvaluation.receivedEvent,
            expected_event: triggerEvaluation.expectedEvent,
            trace_id: options.traceId || null,
            tenant: options.tenant || null,
            started_at: new Date(startedAt).toISOString(),
            ended_at: new Date().toISOString(),
            duration_ms: Date.now() - startedAt,
            valid,
            exit_code: exitCode,
            event_fixture: eventPath,
            event,
            plan,
            steps: plan.map((entry) => ({
              id: entry.step,
              runner: entry.runner,
              status: entry.will_run ? 'planned' : 'skipped',
              reason: entry.reason || null,
            })),
            warnings,
            errors,
            dry_run: true,
          };
          writeHookRunRecord(runRecord);
          payload.run_id = runId;
          payload.recorded_to = HOOK_RUN_LOG_PATH;
        }

        if (options.json) {
          console.log(JSON.stringify(payload, null, 2));
        } else {
          printHookTestSummary(payload);
          if (options.record) {
            console.log(chalk.dim(`Recorded dry-run: ${payload.run_id} -> ${HOOK_RUN_LOG_PATH}\n`));
          }
        }

        if (exitCode !== HOOKS_EXIT_CODES.SUCCESS) {
          process.exit(exitCode);
        }
      } catch (error: any) {
        const exitCode =
          error instanceof HookCliError ? error.exitCode : HOOKS_EXIT_CODES.EXECUTION_FAILURE;
        const message = error?.message || String(error);
        if (options.json) {
          console.log(
            JSON.stringify(
              {
                valid: false,
                exit_code: exitCode,
                errors: [{ code: 'HOOK_TEST_FAILED', message }],
              },
              null,
              2
            )
          );
        } else {
          console.error(chalk.red(`Error: ${message}`));
        }
        process.exit(exitCode);
      }
    }
  );

hooks
  .command('logs')
  .description('Read HookChain run logs')
  .option('--run <run_id>', 'Fetch one run timeline')
  .option('--chain <name>', 'Filter by HookChain name')
  .option('--since <duration>', 'Relative window, e.g. 15m, 2h, 1d')
  .option('--limit <n>', 'Maximum records to return (default 50, max 1000)')
  .option(
    '--status <status>',
    'Filter by queued|running|completed|failed|blocked|cancelled|dry_run'
  )
  .option('--step <id>', 'Filter to runs containing a step id')
  .option('--tenant <id>', 'Filter by tenant/workspace scope')
  .option('--trace-id <uuid>', 'Filter by correlation ID')
  .option('--verbose', 'Include store and filter debug fields')
  .option('--json', 'Output machine-readable JSON')
  .action(
    (options: {
      run?: string;
      chain?: string;
      since?: string;
      limit?: string;
      status?: string;
      step?: string;
      tenant?: string;
      traceId?: string;
      verbose?: boolean;
      json?: boolean;
    }) => {
      try {
        if (options.status && !normalizeHookStatus(options.status)) {
          throw new HookCliError(
            `Invalid --status '${options.status}'. Use one of: ${Array.from(HOOK_RUN_STATUSES).join(', ')}`,
            HOOKS_EXIT_CODES.INVALID_ARGUMENTS
          );
        }
        if (options.since && parseHookDurationMs(options.since) == null) {
          throw new HookCliError(
            'Invalid --since duration. Use a number plus ms, s, m, h, or d.',
            HOOKS_EXIT_CODES.INVALID_ARGUMENTS
          );
        }

        const records = filterHookRunRecords(readHookRunRecords(), options);
        const payload: Record<string, unknown> = {
          ok: true,
          exit_code: HOOKS_EXIT_CODES.SUCCESS,
          store: HOOK_RUN_LOG_PATH,
          count: records.length,
          records,
        };
        if (options.verbose) {
          payload.debug = {
            filters: {
              run: options.run || null,
              chain: options.chain || null,
              since: options.since || null,
              limit: options.limit || '50',
              status: options.status || null,
              step: options.step || null,
              tenant: options.tenant || null,
              trace_id: options.traceId || null,
            },
            registry_dirs: resolveHookRegistryDirs(),
          };
        }

        if (options.json) {
          console.log(JSON.stringify(payload, null, 2));
        } else {
          printHookLogsSummary(payload);
        }
      } catch (error: any) {
        const exitCode =
          error instanceof HookCliError ? error.exitCode : HOOKS_EXIT_CODES.EXECUTION_FAILURE;
        const message = error?.message || String(error);
        if (options.json) {
          console.log(JSON.stringify({ ok: false, exit_code: exitCode, message }, null, 2));
        } else {
          console.error(chalk.red(`Error: ${message}`));
        }
        process.exit(exitCode);
      }
    }
  );

hooks
  .command('replay')
  .description('Queue a deterministic replay record for a HookChain run')
  .requiredOption('--run <run_id>', 'Source run id')
  .option(
    '--from-step <id>',
    'Restart at specific step (default: first failed/blocked/skipped step)'
  )
  .option('--event-override <path>', 'Replace original event payload with a JSON/YAML fixture')
  .option('--force', 'Allow replay of completed or otherwise safe-looking runs')
  .option('--tenant <id>', 'Override tenant/workspace scope')
  .option('--trace-id <uuid>', 'Attach replacement correlation ID')
  .option('--verbose', 'Include source/debug fields')
  .option('--json', 'Output machine-readable JSON')
  .action(
    async (options: {
      run: string;
      fromStep?: string;
      eventOverride?: string;
      force?: boolean;
      tenant?: string;
      traceId?: string;
      verbose?: boolean;
      json?: boolean;
    }) => {
      try {
        const source = findHookRunRecord(options.run);
        if (!source) {
          throw new HookCliError(
            `Hook run not found: ${options.run}`,
            HOOKS_EXIT_CODES.RESOURCE_NOT_FOUND
          );
        }

        const status = String(source.status || '').toLowerCase();
        const replayable = ['failed', 'blocked', 'cancelled', 'dry_run'].includes(status);
        if (!replayable && !options.force) {
          throw new HookCliError(
            `Run ${source.run_id} has status '${status || 'unknown'}'. Use --force to queue a replay anyway.`,
            HOOKS_EXIT_CODES.AUTHORIZATION_DENIED
          );
        }

        let eventPayload: unknown = source.event || source.original_event || null;
        let eventOverridePath: string | null = null;
        if (options.eventOverride) {
          eventOverridePath = path.isAbsolute(options.eventOverride)
            ? options.eventOverride
            : path.resolve(process.cwd(), options.eventOverride);
          if (!fs.existsSync(eventOverridePath) || !fs.statSync(eventOverridePath).isFile()) {
            throw new HookCliError(
              `Event override not found: ${eventOverridePath}`,
              HOOKS_EXIT_CODES.RESOURCE_NOT_FOUND
            );
          }
          eventPayload = await parseJsonOrYamlFile(eventOverridePath);
        }

        const steps = Array.isArray(source.steps) ? source.steps : [];
        const failedStep = steps
          .map((entry) => toHookRecord(entry))
          .find((entry) =>
            ['failed', 'blocked', 'skipped'].includes(String(entry?.status || '').toLowerCase())
          );
        const fromStep =
          normalizeToken(options.fromStep) ||
          (failedStep ? String(failedStep.id || failedStep.step || '') : null) ||
          null;
        if (fromStep) {
          const hasStep = steps.some((entry) => {
            const stepRecord = toHookRecord(entry);
            return String(stepRecord?.id || stepRecord?.step || '') === fromStep;
          });
          if (steps.length > 0 && !hasStep) {
            throw new HookCliError(
              `Step '${fromStep}' was not found in run ${source.run_id}.`,
              HOOKS_EXIT_CODES.RESOURCE_NOT_FOUND
            );
          }
        }

        const replayRunId = createHookRunId('replay');
        const queuedAt = new Date().toISOString();
        const replayRecord: HookRunRecord = {
          run_id: replayRunId,
          source_run_id: source.run_id,
          status: 'queued',
          chain: source.chain,
          chain_source: source.chain_source,
          trigger_event: source.trigger_event ?? null,
          trace_id: options.traceId || source.trace_id || null,
          tenant: options.tenant || source.tenant || null,
          queued_at: queuedAt,
          started_at: queuedAt,
          replay_mode: fromStep ? 'from_step' : 'from_start',
          from_step: fromStep,
          force: options.force === true,
          event_override: eventOverridePath,
          event: eventPayload,
          idempotency_lineage: [source.idempotency_key, source.run_id].filter(Boolean),
          steps: steps.map((entry) => {
            const stepRecord = toHookRecord(entry) || {};
            return {
              ...stepRecord,
              status:
                fromStep && String(stepRecord.id || stepRecord.step || '') !== fromStep
                  ? 'carried_forward'
                  : 'queued',
            };
          }),
        };
        writeHookRunRecord(replayRecord);

        const payload: Record<string, unknown> = {
          ok: true,
          exit_code: HOOKS_EXIT_CODES.SUCCESS,
          source_run_id: source.run_id,
          replay_run_id: replayRunId,
          status: 'queued',
          replay_mode: replayRecord.replay_mode,
          from_step: fromStep,
          queued_at: queuedAt,
          store: HOOK_RUN_LOG_PATH,
        };
        if (options.verbose) {
          payload.source = source;
          payload.replay_record = replayRecord;
        }

        if (options.json) {
          console.log(JSON.stringify(payload, null, 2));
        } else {
          console.log(chalk.bold('\nHookChain Replay\n'));
          console.log(`Source: ${chalk.cyan(source.run_id)}`);
          console.log(`Replay: ${chalk.cyan(replayRunId)}`);
          console.log(`Status: ${chalk.yellow('queued')}`);
          console.log(`Store: ${chalk.dim(HOOK_RUN_LOG_PATH)}\n`);
        }
      } catch (error: any) {
        const exitCode =
          error instanceof HookCliError ? error.exitCode : HOOKS_EXIT_CODES.EXECUTION_FAILURE;
        const message = error?.message || String(error);
        if (options.json) {
          console.log(JSON.stringify({ ok: false, exit_code: exitCode, message }, null, 2));
        } else {
          console.error(chalk.red(`Error: ${message}`));
        }
        process.exit(exitCode);
      }
    }
  );

hooks
  .command('explain')
  .description('Explain HookChain decisions for a recorded run')
  .requiredOption('--run <run_id>', 'Run id to explain')
  .option('--step <id>', 'Focus on one step')
  .option('--show-policy-source', 'Include policy pack/rule source when present')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { run: string; step?: string; showPolicySource?: boolean; json?: boolean }) => {
    try {
      const record = findHookRunRecord(options.run);
      if (!record) {
        throw new HookCliError(
          `Hook run not found: ${options.run}`,
          HOOKS_EXIT_CODES.RESOURCE_NOT_FOUND
        );
      }
      const payload = {
        ok: true,
        exit_code: HOOKS_EXIT_CODES.SUCCESS,
        ...buildHookExplainPayload(record, {
          step: options.step,
          showPolicySource: options.showPolicySource,
        }),
      };
      if (options.json) {
        console.log(JSON.stringify(payload, null, 2));
      } else {
        printHookExplainSummary(payload);
      }
    } catch (error: any) {
      const exitCode =
        error instanceof HookCliError ? error.exitCode : HOOKS_EXIT_CODES.EXECUTION_FAILURE;
      const message = error?.message || String(error);
      if (options.json) {
        console.log(JSON.stringify({ ok: false, exit_code: exitCode, message }, null, 2));
      } else {
        console.error(chalk.red(`Error: ${message}`));
      }
      process.exit(exitCode);
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
  .command('orchestrate')
  .description('Alias for `tnf orchestrate`')
  .argument('<workflow>', 'Workflow name (health-check|code-review|self-improvement)')
  .option('--path <path>', 'Path for code-review workflow')
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

// ---------------------------------------------------------------------------
// Persistent Agent Daemon — the live heart of TNF
// ---------------------------------------------------------------------------
const agentsLive = agents
  .command('live')
  .description('Start persistent agent daemon (LLM + Redis bus + heartbeat + autonomous thinking)');

agentsLive
  .command('start')
  .description('Start the persistent agent daemon in live mode')
  .option('--model <model>', 'Override LLM model (default: minimaxai/minimax-m3)')
  .option('--interval <seconds>', 'Autonomous think interval in seconds', '120')
  .option('--agent-id <id>', 'Override agent ID')
  .option('--agent-name <name>', 'Override agent display name')
  .action(
    async (options: {
      model?: string;
      interval?: string;
      agentId?: string;
      agentName?: string;
    }) => {
      try {
        // Resolve python interpreter — strictly within the TNF runtime tree.
        //   1. $TNF_PYTHON override (explicit user choice; never a Hermes path).
        //   2. $TNF_HOME/venv/bin/python3 (canonical TNF venv).
        //   3. System `python3` — last resort (user must have deps system-wide).
        const tnfHome = process.env.TNF_HOME || path.join(os.homedir(), '.tnf');
        if (process.env.TNF_PYTHON && process.env.TNF_PYTHON.includes('/.hermes/')) {
          throw new Error('Refusing to use a Hermes-venv python as $TNF_PYTHON.');
        }
        const tnfVenv = path.join(tnfHome, 'venv', 'bin', 'python3');
        const pythonBin = process.env.TNF_PYTHON || (fs.existsSync(tnfVenv) ? tnfVenv : 'python3');
        const script = path.join(repoRoot, 'scripts', 'agents', 'tnf-agent-daemon.py');
        const args = [script, 'live'];
        if (options.model) args.push('--model', options.model);
        if (options.interval) args.push('--interval', options.interval);
        if (options.agentId) args.push('--agent-id', options.agentId);
        if (options.agentName) args.push('--agent-name', options.agentName);
        console.log(chalk.dim(`[tnf agents live] python: ${pythonBin}`));
        console.log(chalk.dim(`[tnf agents live] script: ${script}`));
        await runCommand(pythonBin, args, { isBackground: true });
        console.log(chalk.green('✅ TNF agent daemon detached as background process'));
        console.log(chalk.dim('   Verify: tnf agents live status'));
        console.log(chalk.dim('   Stop:    pkill -f tnf-agent-daemon.py'));
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

agentsLive
  .command('watch')
  .description('Start bus-listener-only daemon (no LLM, Redis pub/sub + heartbeat)')
  .option('--agent-id <id>', 'Override agent ID')
  .action(async (options: { agentId?: string }) => {
    try {
      const tnfHome = process.env.TNF_HOME || path.join(os.homedir(), '.tnf');
      const tnfVenv = path.join(tnfHome, 'venv', 'bin', 'python3');
      const pythonBin = process.env.TNF_PYTHON || (fs.existsSync(tnfVenv) ? tnfVenv : 'python3');
      const script = path.join(repoRoot, 'scripts', 'agents', 'tnf-agent-daemon.py');
      const args = [script, 'watch'];
      if (options.agentId) args.push('--agent-id', options.agentId);
      console.log(chalk.dim(`[tnf agents watch] python: ${pythonBin}`));
      await runCommand(pythonBin, args, { isBackground: true });
      console.log(chalk.green('✅ TNF bus-listener daemon detached'));
      console.log(chalk.dim('   Verify: pgrep -af tnf-agent-daemon'));
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

agentsLive
  .command('once')
  .description('Single heartbeat + registration check then exit')
  .action(async () => {
    try {
      const tnfHome = process.env.TNF_HOME || path.join(os.homedir(), '.tnf');
      const tnfVenv = path.join(tnfHome, 'venv', 'bin', 'python3');
      const pythonBin = process.env.TNF_PYTHON || (fs.existsSync(tnfVenv) ? tnfVenv : 'python3');
      const script = path.join(repoRoot, 'scripts', 'agents', 'tnf-agent-daemon.py');
      await runCommand(pythonBin, [script, 'once']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

agentsLive
  .command('status')
  .description('Show daemon process and bus health')
  .action(async () => {
    try {
      const tnfHome = process.env.TNF_HOME || path.join(os.homedir(), '.tnf');
      const tnfVenv = path.join(tnfHome, 'venv', 'bin', 'python3');
      const pythonBin = process.env.TNF_PYTHON || (fs.existsSync(tnfVenv) ? tnfVenv : 'python3');
      const script = path.join(repoRoot, 'scripts', 'agents', 'tnf-agent-daemon.py');
      await runCommand(pythonBin, [script, 'status']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const agentsBank = agents
  .command('bank')
  .description('Agent bank governance and cross-runtime distribution');

agentsBank
  .command('reconcile')
  .description(
    'Restore/sync agent banks and provision imported Claude agent definitions across runtime homes'
  )
  .option(
    '--targets <list>',
    `Comma-separated targets (${PLATFORM_TAXONOMY.join(', ')}, all)`,
    'all'
  )
  .option('--dry-run', 'Preview changes without writing files')
  .option('--json', 'Output machine-readable JSON summary')
  .option('--skip-restore', 'Skip restoring .agent/agents from git history when missing')
  .option('--skip-imported-sync', 'Skip creating missing .skills/imported-claude-agents wrappers')
  .option('--skip-provision', 'Skip runtime-home provisioning stage')
  .action(
    async (
      options: {
        targets?: string;
        dryRun?: boolean;
        json?: boolean;
        skipRestore?: boolean;
        skipImportedSync?: boolean;
        skipProvision?: boolean;
      } = {}
    ) => {
      try {
        const args = ['scripts/agents/reconcile-agent-banks.cjs'];
        if (options.targets) args.push('--targets', options.targets);
        if (options.dryRun) args.push('--dry-run');
        if (options.json) args.push('--json');
        if (options.skipRestore) args.push('--skip-restore');
        if (options.skipImportedSync) args.push('--skip-imported-sync');
        if (options.skipProvision) args.push('--skip-provision');
        await runCommand('node', args);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

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

// ============================================================================
// tnf alive — Unified Persistent Stack Activation
//
// Brings up the complete autonomously-running TNF stack in one command:
//   1. Persistent agent daemon (LLM + Redis bus + heartbeat + autonomous think)
//   2. A2A bridge (interoperability with any other runtime that speaks the bus,
//      wired explicitly via tnf bridge). Optional based on --bridge flag.
//   3. Self-wake heartbeat cron (script-only, no LLM cost).
//   4. Health status snapshot to tnf:alive:status.
// All sources are TNF-owned. No Hermes dependencies.
// ============================================================================

const aliveCommand = program
  .command('alive')
  .description(
    'Activate TNF persistent stack (daemon + heartbeat sentinel) so it stays running autonomously'
  );

aliveCommand
  .command('up')
  .description('Bring up the persistent TNF agent daemon + heartbeat cron')
  .option('--model <model>', 'LLM model override (default: minimaxai/minimax-m3)')
  .option('--interval <seconds>', 'Autonomous think interval in seconds', '120')
  .option(
    '--no-bridge',
    'Skip bridge (deprecated alias; bridge is wired separately via `tnf bridge`)'
  )
  .option('--install-cron', 'Ensure heartbeat self-wake cron is installed (idempotent)')
  .option('--dry-run', 'Print what would run without starting anything')
  .action(
    async (options: {
      model?: string;
      interval?: string;
      bridge?: boolean;
      installCron?: boolean;
      dryRun?: boolean;
    }) => {
      try {
        console.log(chalk.bold.cyan('\n=== tnf alive up — Persistent Stack Activation ===\n'));

        const tnfHome = process.env.TNF_HOME || path.join(os.homedir(), '.tnf');
        const tnfVenv = path.join(tnfHome, 'venv', 'bin', 'python3');
        const pythonBin = process.env.TNF_PYTHON || (fs.existsSync(tnfVenv) ? tnfVenv : 'python3');
        const repoAgentsDir = path.join(repoRoot, 'scripts', 'agents');
        const daemonScript = path.join(repoAgentsDir, 'tnf-agent-daemon.py');

        // Step 0: Verify venv / python is usable
        if (!fs.existsSync(daemonScript)) {
          throw new Error(`TNF daemon script not found at ${daemonScript}`);
        }
        console.log(chalk.dim(`[1/4] python:  ${pythonBin}`));
        console.log(chalk.dim(`      script: ${daemonScript}`));

        // Step 1: Stack alive on bus
        if (options.dryRun) {
          console.log(chalk.yellow('[dry-run] would start: tnf-agent-daemon live'));
          console.log(chalk.yellow('[dry-run] would install: tnf-heartbeat-selfwake cron'));
          return;
        }

        // Step 2: Provision venv if needed (one-time, idempotent)
        if (!fs.existsSync(tnfVenv) && pythonBin === 'python3') {
          console.log(chalk.yellow('[2/4] Provisioning ~/.tnf/venv (one-time)...'));
          await runCommand('python3', ['-m', 'venv', path.join(tnfHome, 'venv')]);
          await runCommand(path.join(tnfHome, 'venv', 'bin', 'pip'), [
            'install',
            '-q',
            '-r',
            path.join(repoAgentsDir, 'requirements.txt'),
          ]);
        } else {
          console.log(
            chalk.dim(
              '[2/4] venv: ' + (fs.existsSync(tnfVenv) ? tnfVenv : 'system python3 (no venv)')
            )
          );
        }

        // Step 3: Start agent daemon (detached, live mode)
        console.log(chalk.dim('[3/4] Starting tnf-agent-daemon (live mode)...'));
        const daemonArgs = [daemonScript, 'live'];
        if (options.model) daemonArgs.push('--model', options.model);
        if (options.interval) daemonArgs.push('--interval', options.interval);
        await runCommand(pythonBin, daemonArgs, { isBackground: true });
        console.log(chalk.green('      ✅ daemon detached'));

        // Step 4: Heartbeat cron
        if (options.installCron) {
          console.log(chalk.dim('[4/4] Installing heartbeat self-wake cron (every 5 min)...'));
          const heartbeatScript = path.join(repoAgentsDir, 'tnf-heartbeat-selfwake.py');
          await runCommand('hermes', [
            'cronjob',
            'action=create',
            '--schedule',
            '*/5 * * * *',
            '--script',
            heartbeatScript,
            '--name',
            'TNF Heartbeat Self-Wake',
            '--no-agent',
          ]);
        } else {
          console.log(chalk.dim('[4/4] Skipping cron install (use --install-cron to enable)'));
        }

        // Heartbeat status
        console.log(chalk.dim('\n--- Health Snapshot ---\n'));
        const { execSync } = await import('child_process');
        try {
          const psOut = execSync('ps -eo pid,etime,command', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore'],
          });
          const matches = psOut
            .split('\n')
            .filter((l) => /tnf-agent-daemon\.py\b/.test(l) && !l.includes('grep'));
          if (matches.length) {
            console.log(chalk.green('✅ tnf-agent-daemon process:'));
            for (const m of matches.slice(0, 3)) console.log(chalk.dim('   ' + m.trim()));
          } else {
            console.log(
              chalk.red(
                '❌ tnf-agent-daemon NOT running (yet — it may still be starting or failed; check log)'
              )
            );
          }
        } catch {
          console.log(chalk.red('❌ process query failed'));
        }

        // Persist status to Redis for cross-process visibility
        try {
          const busUrl = process.env.REDIS_URL || 'redis://localhost:6379';
          const r = await import('ioredis').then((m) => (m.default ? new m.default(busUrl) : null));
          if (r) {
            await r.hset('tnf:alive:status', {
              started_at: new Date().toISOString(),
              model: options.model || process.env.TNF_LLM_MODEL || 'minimaxai/minimax-m3',
              python: pythonBin,
              pid: String(process.pid),
            });
            await r.quit();
            console.log(chalk.green('✅ Status posted to tnf:alive:status (Redis)'));
          }
        } catch (err) {
          console.log(
            chalk.dim(
              '   (Redis status post skipped: ' +
                (err instanceof Error ? err.message : String(err)) +
                ')'
            )
          );
        }

        console.log(chalk.bold.green('\n✅ TNF alive — running autonomously.\n'));
        console.log(chalk.dim('   Verify:  tnf alive status'));
        console.log(chalk.dim('   Forefront: tnf forefront'));
        console.log(chalk.dim('   Stop:    tnf alive down'));
        console.log(chalk.dim('   Logs:    tail -f ~/.tnf/logs/daemon.log\n'));
      } catch (err: any) {
        console.error(chalk.red(`\n❌ tnf alive up failed: ${err.message}`));
        process.exit(1);
      }
    }
  );

aliveCommand
  .command('status')
  .description('Show whether the persistent TNF stack is alive')
  .option('--json', 'Output JSON status')
  .action(async (options: { json?: boolean } = {}) => {
    const { execSync } = await import('child_process');
    const result: any = {
      timestamp: new Date().toISOString(),
      daemon: { running: false, pids: [] as string[] },
      bridge: { running: false, pids: [] as string[] },
      heartbeat_cron: { installed: false, jobId: '' },
      redis_status: {},
    };

    // Probe processes with precise regex match on full command line.
    let procDump = '';
    try {
      procDump = execSync('ps -eo pid,etime,command', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
    } catch {}
    const procLines = procDump.split('\n').slice(1); // drop header
    const realProcs = procLines.filter((l) => l.trim() && !l.includes('grep '));
    const daemonProcs = realProcs.filter((l) => /tnf-agent-daemon\.py\b/.test(l));
    if (daemonProcs.length > 0) {
      result.daemon.running = true;
      result.daemon.pids = daemonProcs.map((l) => l.trim().slice(0, 120));
    }
    const bridgeProcs = realProcs.filter((l) => /hermes-tnf-a2a-bridge\.py\b/.test(l));
    if (bridgeProcs.length > 0) {
      result.bridge.running = true;
      result.bridge.pids = bridgeProcs.map((l) => l.trim().slice(0, 120));
    }

    try {
      const out = execSync('hermes cronjob action=list 2>&1', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      if (out.toLowerCase().includes('tnf heartbeat')) {
        result.heartbeat_cron.installed = true;
      }
    } catch {}
    try {
      const out = execSync('redis-cli HGETALL tnf:alive:status 2>&1', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim();
      if (out) {
        const lines = out.split('\n');
        for (let i = 0; i < lines.length - 1; i += 2) {
          result.redis_status[lines[i]] = lines[i + 1];
        }
      }
    } catch {}

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    console.log(chalk.bold('\n=== tnf alive status ===\n'));
    console.log(
      result.daemon.running
        ? chalk.green(`✅ TNF Agent Daemon: running (${result.daemon.pids.length} pid(s))`)
        : chalk.red('❌ TNF Agent Daemon: not running')
    );
    if (result.daemon.pids.length) {
      for (const p of result.daemon.pids.slice(0, 3)) console.log(chalk.dim('   ' + p));
    }
    console.log(
      result.bridge.running
        ? chalk.green(`✅ A2A Bridge: running`)
        : chalk.dim('⚪ A2A Bridge: not running (start with `tnf bridge start`)')
    );
    console.log(
      result.heartbeat_cron.installed
        ? chalk.green('✅ Heartbeat self-wake cron: installed')
        : chalk.dim('⚪ Heartbeat cron: not installed (run `tnf alive up --install-cron`)')
    );
    if (Object.keys(result.redis_status).length > 0) {
      console.log(chalk.dim('\nRedis status:'));
      for (const [k, v] of Object.entries(result.redis_status)) {
        console.log(chalk.dim(`   ${k}: ${String(v).slice(0, 60)}`));
      }
    }
    console.log('');
  });

aliveCommand
  .command('down')
  .description('Stop all TNF persistent stack components')
  .action(async () => {
    console.log(chalk.yellow('\nStopping TNF persistent stack...\n'));
    const { execSync } = await import('child_process');
    const targets = [
      { name: 'TNF Agent Daemon', pattern: 'tnf-agent-daemon.py' },
      { name: 'A2A Bridge', pattern: 'hermes-tnf-a2a-bridge.py' },
    ];
    for (const t of targets) {
      try {
        const out = execSync(`pgrep -f ${t.pattern}`, {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore'],
        }).trim();
        if (out) {
          execSync(`pkill -f ${t.pattern}`, { encoding: 'utf8', stdio: 'pipe' });
          console.log(chalk.green(`✅ Stopped ${t.name} (${out.split('\n').length} pid(s))`));
        } else {
          console.log(chalk.dim(`⚪ ${t.name}: not running`));
        }
      } catch {
        console.log(chalk.dim(`⚪ ${t.name}: not running`));
      }
    }
    console.log(chalk.green('\n✅ TNF persistent stack stopped.\n'));
    console.log(
      chalk.dim('   Note: heartbeat cron (if installed) still fires every 5 min to auto-restart.')
    );
    console.log(chalk.dim('   To remove cron: hermes cronjob action=remove --id <jobId>\n'));
  });

// ============================================================================
// tnf bridge — A2A bus bridge controller
// ============================================================================

const bridgeCommand = program
  .command('bridge')
  .description(
    'Control the TNF A2A bridge (inter-runtime bus translator) — start/stop/status/test'
  );

bridgeCommand
  .command('start')
  .description('Start the A2A bridge in foreground (detached)')
  .option('--foreground', 'Run synchronously, not detached')
  .action(async (options: { foreground?: boolean } = {}) => {
    const tnfHome = process.env.TNF_HOME || path.join(os.homedir(), '.tnf');
    const tnfVenv = path.join(tnfHome, 'venv', 'bin', 'python3');
    const pythonBin = process.env.TNF_PYTHON || (fs.existsSync(tnfVenv) ? tnfVenv : 'python3');
    const script = path.join(repoRoot, 'scripts', 'agents', 'hermes-tnf-a2a-bridge.py');
    if (!fs.existsSync(script)) {
      console.error(chalk.red(`Bridge script not found: ${script}`));
      process.exit(1);
    }
    if (!options.foreground) {
      await runCommand(pythonBin, [script, '--foreground'], { isBackground: true });
      console.log(chalk.green('✅ Bridge detached'));
      console.log(chalk.dim('   Verify: tnf bridge status'));
    } else {
      await runCommand(pythonBin, [script, '--foreground'], { isBackground: false });
    }
  });

bridgeCommand
  .command('status')
  .description('Show bridge process and bus health')
  .action(async () => {
    const tnfHome = process.env.TNF_HOME || path.join(os.homedir(), '.tnf');
    const tnfVenv = path.join(tnfHome, 'venv', 'bin', 'python3');
    const pythonBin = process.env.TNF_PYTHON || (fs.existsSync(tnfVenv) ? tnfVenv : 'python3');
    const script = path.join(repoRoot, 'scripts', 'agents', 'hermes-tnf-a2a-bridge.py');
    await runCommand(pythonBin, [script, '--status'], { isBackground: false });
  });

bridgeCommand
  .command('stop')
  .description('Stop the running bridge')
  .action(async () => {
    const { execSync } = await import('child_process');
    try {
      execSync('pkill -f hermes-tnf-a2a-bridge.py', { stdio: 'pipe' });
      console.log(chalk.green('✅ Bridge stopped'));
    } catch {
      console.log(chalk.dim('⚪ Bridge not running'));
    }
  });

bridgeCommand
  .command('test')
  .description('Run bridge integration self-test')
  .action(async () => {
    const tnfHome = process.env.TNF_HOME || path.join(os.homedir(), '.tnf');
    const tnfVenv = path.join(tnfHome, 'venv', 'bin', 'python3');
    const pythonBin = process.env.TNF_PYTHON || (fs.existsSync(tnfVenv) ? tnfVenv : 'python3');
    const script = path.join(repoRoot, 'scripts', 'agents', 'hermes-tnf-a2a-bridge.py');
    await runCommand(pythonBin, [script, '--test'], { isBackground: false });
  });

// ============================================================================
// tnf heartbeat — Watchdog / self-wake controller
// ============================================================================

const heartbeatCommand = program
  .command('heartbeat')
  .description('Control the TNF self-wake heartbeat (watchdog over the persistent stack)');

heartbeatCommand
  .command('run')
  .description('Run the heartbeat check once (foreground)')
  .option('--cron', 'Output cron-friendly JSON (used by installed cron job)')
  .action(async (options: { cron?: boolean } = {}) => {
    const tnfHome = process.env.TNF_HOME || path.join(os.homedir(), '.tnf');
    const tnfVenv = path.join(tnfHome, 'venv', 'bin', 'python3');
    const pythonBin = process.env.TNF_PYTHON || (fs.existsSync(tnfVenv) ? tnfVenv : 'python3');
    const script = path.join(repoRoot, 'scripts', 'agents', 'tnf-heartbeat-selfwake.py');
    if (!fs.existsSync(script)) {
      console.error(chalk.red(`Heartbeat script not found: ${script}`));
      process.exit(1);
    }
    await runCommand(pythonBin, [script], { isBackground: false });
  });

heartbeatCommand
  .command('install')
  .description('Install heartbeat self-wake cron (runs every 5 minutes)')
  .action(async () => {
    const script = path.join(repoRoot, 'scripts', 'agents', 'tnf-heartbeat-selfwake.py');
    if (!fs.existsSync(script)) {
      console.error(chalk.red(`Heartbeat script not found: ${script}`));
      process.exit(1);
    }
    await runCommand('hermes', [
      'cronjob',
      'action=create',
      '--schedule',
      '*/5 * * * *',
      '--script',
      script,
      '--name',
      'TNF Heartbeat Self-Wake',
      '--no-agent',
    ]);
    console.log(chalk.green('✅ Heartbeat self-wake cron installed (every 5 min)'));
  });

heartbeatCommand
  .command('remove')
  .description('Remove heartbeat self-wake cron by name')
  .action(async () => {
    const { execSync } = await import('child_process');
    try {
      const out = execSync('hermes cronjob action=list 2>&1', { encoding: 'utf8', stdio: 'pipe' });
      const match = out.match(
        /(?:id|job)[":= ]+"?([a-f0-9-]{20,})"?\s+[\s\S]*?TNF Heartbeat Self-Wake/i
      );
      if (!match) {
        console.log(chalk.dim('⚪ Heartbeat cron not found by name.'));
        return;
      }
      const jobId = match[1];
      await runCommand('hermes', ['cronjob', 'action=remove', '--id', jobId]);
      console.log(chalk.green(`✅ Heartbeat cron ${jobId} removed`));
    } catch (err: any) {
      console.error(chalk.red(`Failed: ${err.message}`));
      process.exit(1);
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
  .command('orchestrate')
  .description('Run agent orchestration workflow (health-check|code-review|self-improvement)')
  .argument('<workflow>', 'Workflow name')
  .option('--path <path>', 'Code path for code-review workflow', '.')
  .action(async (workflow: string, options: { path?: string } = {}) => {
    const client = new RedisAgentClient();
    try {
      await client.initialize();
      await client.register(process.env.AGENT_NAME || 'orchestrator-cli', 'orchestrator', 'tnf');
      const orchestrator = new Orchestrator(client);
      const ok = await orchestrator.executeWorkflow(workflow, {
        path: options.path || '.',
      });
      if (!ok) {
        process.exit(1);
      }
    } catch (err: any) {
      if (isRedisUnavailable(err)) {
        logRedisUnavailable(`./tnf orchestrate ${workflow}`);
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

function buildPassthroughEnv(cliName: string): Record<string, string> {
  const env: Record<string, string> = {};
  const mcpConfigPath = path.join(repoRoot, 'data/mcp.clients', `${cliName}.mcp.json`);
  if (fs.existsSync(mcpConfigPath)) {
    env.TNF_MCP_CONFIG_PATH = mcpConfigPath;
    env.MCP_CONFIG_PATH = mcpConfigPath;
  }
  return env;
}

async function runPassthrough(cliName: string, args: string[] = []): Promise<void> {
  const forwardedArgs = normalizeForwardedArgs(args);
  const resolvedCmd = resolvePassthroughCommand(cliName);
  const passthroughEnv = buildPassthroughEnv(cliName);
  const isHermesUpdate = cliName === 'hermes' && forwardedArgs[0] === 'update';

  if (isHermesUpdate) {
    const preflightCleanup = cleanupHermesGitLockFiles();
    if (preflightCleanup.removed.length > 0) {
      console.log(
        chalk.yellow(
          `↺ Removed ${preflightCleanup.removed.length} stale Hermes git lock file(s) before update.`
        )
      );
    }
  }

  try {
    await runCommand(resolvedCmd, forwardedArgs, { env: passthroughEnv });
  } catch (err: any) {
    if (isHermesUpdate) {
      const retryCleanup = cleanupHermesGitLockFiles();
      if (retryCleanup.removed.length > 0) {
        console.log(
          chalk.yellow(
            `↺ Removed ${retryCleanup.removed.length} stale Hermes git lock file(s); retrying update once.`
          )
        );
        try {
          await runCommand(resolvedCmd, forwardedArgs, { env: passthroughEnv });
          return;
        } catch (retryErr: any) {
          err = retryErr;
        }
      }
    }

    // Passthrough commands should exit with the child's exit code, not wrap it as an error.
    // The child process already displayed its own output/errors to the user.
    const exitCodeMatch = err?.message?.match(/exited with code (\d+)/);
    const exitCode = exitCodeMatch ? parseInt(exitCodeMatch[1], 10) : 1;
    process.exit(exitCode);
  }
}

const HERMES_GIT_STALE_LOCK_AGE_FALLBACK_MS = 2 * 60 * 1000;
let cachedLsofAvailable: boolean | null = null;

function resolveHermesRepoPath(): string {
  const hermesHome = normalizeToken(process.env.HERMES_HOME) ?? path.join(os.homedir(), '.hermes');
  return path.join(hermesHome, 'hermes-agent');
}

function isLsofAvailable(): boolean {
  if (cachedLsofAvailable !== null) {
    return cachedLsofAvailable;
  }
  const probe = spawnSync('lsof', ['-v'], { stdio: 'ignore' });
  cachedLsofAvailable = !probe.error;
  return cachedLsofAvailable;
}

function isLockFileInUse(lockPath: string): boolean {
  const probe = spawnSync('lsof', ['-t', lockPath], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  if (probe.error) return false;
  return probe.status === 0 && Boolean((probe.stdout || '').trim());
}

function collectGitLockFiles(rootDir: string, out: string[]): void {
  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(rootDir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const entryPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      collectGitLockFiles(entryPath, out);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.lock')) {
      out.push(entryPath);
    }
  }
}

function cleanupHermesGitLockFiles(): {
  removed: string[];
  skippedInUse: string[];
  skippedRecent: string[];
} {
  const hermesRepo = resolveHermesRepoPath();
  const gitDir = path.join(hermesRepo, '.git');
  if (!fs.existsSync(gitDir)) {
    return { removed: [], skippedInUse: [], skippedRecent: [] };
  }

  const candidates = new Set<string>();
  const directLockFiles = ['index.lock', 'packed-refs.lock', 'FETCH_HEAD.lock', 'shallow.lock'];
  for (const lockName of directLockFiles) {
    const fullPath = path.join(gitDir, lockName);
    if (fs.existsSync(fullPath)) {
      candidates.add(fullPath);
    }
  }

  const refsDir = path.join(gitDir, 'refs');
  if (fs.existsSync(refsDir)) {
    const recursiveLocks: string[] = [];
    collectGitLockFiles(refsDir, recursiveLocks);
    for (const lockPath of recursiveLocks) {
      candidates.add(lockPath);
    }
  }

  const lsofAvailable = isLsofAvailable();
  const fallbackMinAgeMs = lsofAvailable ? 0 : HERMES_GIT_STALE_LOCK_AGE_FALLBACK_MS;
  const now = Date.now();
  const removed: string[] = [];
  const skippedInUse: string[] = [];
  const skippedRecent: string[] = [];

  for (const lockPath of candidates) {
    let stats: fs.Stats;
    try {
      stats = fs.statSync(lockPath);
    } catch {
      continue;
    }
    if (!stats.isFile()) continue;

    if (!lsofAvailable) {
      const ageMs = now - stats.mtimeMs;
      if (ageMs < fallbackMinAgeMs) {
        skippedRecent.push(lockPath);
        continue;
      }
    } else if (isLockFileInUse(lockPath)) {
      skippedInUse.push(lockPath);
      continue;
    }

    try {
      fs.unlinkSync(lockPath);
      removed.push(lockPath);
    } catch {
      // Ignore filesystem race conditions from other concurrent cleanup attempts.
    }
  }

  return { removed, skippedInUse, skippedRecent };
}

// ────────────────────────────────────────────────────────────────────────────
// TNF Command Extensions: ACP, MCP, Auth, Agent, Debug, Session, Remote, etc.
// ────────────────────────────────────────────────────────────────────────────

import { ACPService } from './services/ACPService.js';
import { AgentManagerService } from './services/AgentManagerService.js';
import { AuthService } from './services/AuthService.js';
import {
  generateCompletion,
  getInstallInstructions,
  ShellType,
} from './services/CompletionService.js';
import { DatabaseService } from './services/DatabaseService.js';
import { DebugService } from './services/DebugService.js';
import { MCPManagerService } from './services/MCPManagerService.js';
import { ModelsService } from './services/ModelsService.js';
import { PermissionService } from './services/PermissionService.js';
import {
  ProjectConfigService,
  type ProjectScaffoldKind,
  type ProjectScaffoldResult,
} from './services/ProjectConfigService.js';
import { RemoteService } from './services/RemoteService.js';
import { ServeService } from './services/ServeService.js';
import { SessionManagerService } from './services/SessionManagerService.js';
import { StatsService } from './services/StatsService.js';
import { UpgradeService } from './services/UpgradeService.js';

interface AcpExternalAgentPlan {
  agent: string;
  command: string;
  args: string[];
  endpoint: string;
  cwd: string;
  register: boolean;
  env: Record<string, string>;
}

function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_./:=@+-]+$/.test(value)) return value;
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function buildAcpExternalAgentPlan(
  agent: string,
  command: string,
  args: string[],
  options: {
    hostname: string;
    port: string;
    cwd?: string;
    register?: boolean;
  }
): AcpExternalAgentPlan {
  const parsedPort = parseInt(options.port, 10);
  const port = Number.isFinite(parsedPort) ? parsedPort : 0;
  const hostname = options.hostname || '127.0.0.1';
  const endpoint = `http://${hostname}:${port}`;
  const cwd = path.resolve(options.cwd || process.cwd());

  return {
    agent,
    command,
    args,
    endpoint,
    cwd,
    register: options.register !== false,
    env: {
      TNF_ACP_AGENT: 'true',
      TNF_ACP_AGENT_NAME: agent,
      TNF_ACP_ENDPOINT: endpoint,
      ACP_ENDPOINT: endpoint,
      TNF_AGENT_PLATFORM: agent,
      TNF_AGENT_CAPABILITIES: 'agent_client_protocol,external_cli,reasoning,coding',
    },
  };
}

function renderAcpExternalAgentPlan(plan: AcpExternalAgentPlan): string {
  const envPrefix = Object.entries(plan.env)
    .map(([key, value]) => `${key}=${shellQuote(value)}`)
    .join(' ');
  return `${envPrefix} ${shellQuote(plan.command)} ${plan.args.map(shellQuote).join(' ')}`.trim();
}

async function runAcpExternalAgent(
  plan: AcpExternalAgentPlan,
  options: { hostname: string; port: string; register?: boolean }
): Promise<void> {
  const executable = resolvePassthroughCommand(plan.command);
  if (executable === plan.command && !findExecutableOnPath(plan.command)) {
    throw new Error(
      `'${plan.command}' is not installed or not on PATH. Use --dry-run to inspect the ACP launch contract.`
    );
  }

  const service = new ACPService({
    port: parseInt(options.port, 10) || 0,
    hostname: options.hostname,
    cwd: plan.cwd,
  });
  const address = await service.start();
  const endpoint = `http://${address.hostname}:${address.port}`;
  const env = {
    ...plan.env,
    TNF_ACP_ENDPOINT: endpoint,
    ACP_ENDPOINT: endpoint,
  };
  let client: RedisAgentClient | null = null;

  try {
    if (plan.register) {
      client = new RedisAgentClient();
      await client.initialize();
      const agentInfo = await client.register(`${plan.agent}-acp`, 'worker', plan.agent, [
        'agent_client_protocol',
        'external_cli',
        'reasoning',
        'coding',
      ]);
      console.log(chalk.green(`Registered ACP agent ${agentInfo.id}`));
    }

    console.log(chalk.green(`ACP server listening on ${endpoint}`));
    await runCommand(executable, plan.args, { cwd: plan.cwd, env });
  } finally {
    if (client) {
      await client.cleanup().catch(() => undefined);
    }
    await service.stop().catch(() => undefined);
  }
}

// ACP command
const acp = program.command('acp').description('Start ACP (Agent Client Protocol) server');
acp
  .command('grok')
  .description('Run Grok as a TNF ACP external agent')
  .option('--command <cmd>', 'Grok executable to run', 'grok')
  .option('--port <number>', 'ACP port to advertise/listen on', '0')
  .option('--hostname <hostname>', 'ACP hostname to advertise/listen on', '127.0.0.1')
  .option('--cwd <path>', 'Working directory', process.cwd())
  .option('--dry-run', 'Print the resolved ACP launch contract without starting Grok')
  .option('--no-register', 'Do not register the Grok process in the TNF Redis agent registry')
  .argument('[grokArgs...]', 'Arguments forwarded to the Grok CLI')
  .action(
    async (
      grokArgs: string[],
      options: {
        command: string;
        port: string;
        hostname: string;
        cwd?: string;
        dryRun?: boolean;
        register?: boolean;
      }
    ) => {
      try {
        const forwardedArgs = normalizeForwardedArgs(grokArgs || []);
        const plan = buildAcpExternalAgentPlan(
          'grok',
          options.command || 'grok',
          forwardedArgs.length ? forwardedArgs : ['agent', 'test', '-o'],
          options
        );

        if (options.dryRun) {
          console.log(
            JSON.stringify(
              {
                protocol: 'ACP',
                agent: plan.agent,
                command: plan.command,
                args: plan.args,
                cwd: plan.cwd,
                register: plan.register,
                endpoint: plan.endpoint,
                env: plan.env,
                shell: renderAcpExternalAgentPlan(plan),
              },
              null,
              2
            )
          );
          return;
        }

        await runAcpExternalAgent(plan, options);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

acp
  .option('--port <number>', 'Port to listen on', '0')
  .option('--hostname <hostname>', 'Hostname to listen on', '127.0.0.1')
  .option('--cwd <path>', 'Working directory', process.cwd())
  .action(async (options: { port: string; hostname: string; cwd: string }) => {
    try {
      const service = new ACPService({
        port: parseInt(options.port, 10) || 0,
        hostname: options.hostname,
        cwd: options.cwd,
      });
      const { port, hostname } = await service.start();
      console.log(chalk.green(`✅ ACP server started on ${hostname}:${port}`));
      console.log(chalk.dim('Press Ctrl+C to stop'));

      process.on('SIGINT', async () => {
        await service.stop();
        process.exit(0);
      });
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// Auth commands
const auth = program.command('auth').description('Manage credentials');
const authService = new AuthService();

auth
  .command('login')
  .description('Log in to a provider')
  .argument('[url]', 'OAuth URL or provider name')
  .action(async (url?: string) => {
    try {
      const result = await authService.login(url || '', url?.startsWith('http') ? url : undefined);
      if (result.success) {
        console.log(chalk.green(`✅ ${result.message}`));
      } else {
        console.log(chalk.yellow(result.message));
        if (result.url) {
          console.log(chalk.cyan(`  URL: ${result.url}`));
        }
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

auth
  .command('logout')
  .description('Log out from a configured provider')
  .argument('<provider>', 'Provider name')
  .action((provider: string) => {
    try {
      if (authService.logout(provider)) {
        console.log(chalk.green(`✅ Logged out from '${provider}'`));
      } else {
        console.log(chalk.yellow(`No credentials found for '${provider}'`));
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

auth
  .command('list')
  .alias('ls')
  .description('List providers')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const providers = authService.listProviders();
      if (options.json) {
        console.log(JSON.stringify(providers, null, 2));
        return;
      }
      console.log(chalk.bold('\nConfigured Providers\n'));
      for (const p of providers) {
        const status = p.authenticated ? chalk.green('✓') : chalk.red('✗');
        const type = chalk.dim(`(${p.type})`);
        console.log(`  ${status} ${chalk.cyan(p.name)} ${type}`);
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// Agent commands (extended)
const agentManager = new AgentManagerService();

const agentCreate = program.command('agent').description('Manage agents');

agentCreate
  .command('create')
  .description('Create a new agent')
  .argument('<name>', 'Agent name')
  .option('--role <role>', 'Agent role (orchestrator|broker|worker|participant)', 'participant')
  .option('--platform <platform>', 'Agent platform', 'vscode')
  .option('--capabilities <caps...>', 'Agent capabilities')
  .action((name: string, options: { role: string; platform: string; capabilities?: string[] }) => {
    try {
      const agent = agentManager.create(name, options.role as any, options.platform as any, {
        capabilities: options.capabilities,
      });
      console.log(chalk.green(`✅ Created agent '${name}'`));
      console.log(`  ID: ${chalk.dim(agent.id)}`);
      console.log(`  Role: ${agent.role}`);
      console.log(`  Platform: ${agent.platform}`);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

agentCreate
  .command('list')
  .description('List all available agents')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const agents = agentManager.list();
      if (options.json) {
        console.log(JSON.stringify(agents, null, 2));
        return;
      }
      console.log(chalk.bold('\nAgents\n'));
      if (agents.length === 0) {
        console.log(chalk.dim('No agents configured'));
      } else {
        for (const a of agents) {
          const status = a.isOnline ? chalk.green('online') : chalk.yellow('offline');
          console.log(`  ${chalk.cyan(a.name)} (${a.role}/${a.platform}): ${status}`);
        }
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// Debug commands
const debug = program.command('debug').description('Debugging and troubleshooting tools');
const debugService = new DebugService();

debug
  .command('config')
  .description('Show resolved configuration')
  .option('--path <key>', 'Get specific config path')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { path?: string; json?: boolean }) => {
    try {
      if (options.path) {
        const value = debugService.getConfigPath(options.path);
        if (options.json) {
          console.log(JSON.stringify({ path: options.path, value }, null, 2));
        } else {
          console.log(
            value !== undefined ? JSON.stringify(value, null, 2) : chalk.yellow('undefined')
          );
        }
      } else {
        const config = debugService.getConfig();
        if (options.json) {
          console.log(JSON.stringify(config, null, 2));
        } else {
          console.log(chalk.bold('\nConfiguration\n'));
          console.log(JSON.stringify(config, null, 2));
        }
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

debug
  .command('lsp')
  .description('LSP debugging utilities')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const lsp = debugService.debugLSP();
      if (options.json) {
        console.log(JSON.stringify(lsp, null, 2));
      } else {
        console.log(chalk.bold('\nLSP Status\n'));
        console.log(`  Available: ${lsp.available ? chalk.green('yes') : chalk.red('no')}`);
        if (lsp.path) console.log(`  Path: ${chalk.dim(lsp.path)}`);
        if (lsp.version) console.log(`  Version: ${chalk.dim(lsp.version)}`);
        if (lsp.error) console.log(`  Error: ${chalk.red(lsp.error)}`);
        console.log('');
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

debug
  .command('rg')
  .description('ripgrep debugging utilities')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const rg = debugService.debugRg();
      if (options.json) {
        console.log(JSON.stringify(rg, null, 2));
      } else {
        console.log(chalk.bold('\nripgrep Status\n'));
        console.log(`  Available: ${rg.available ? chalk.green('yes') : chalk.red('no')}`);
        if (rg.path) console.log(`  Path: ${chalk.dim(rg.path)}`);
        if (rg.version) console.log(`  Version: ${chalk.dim(rg.version)}`);
        console.log('');
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

debug
  .command('file')
  .description('File system debugging utilities')
  .argument('<path>', 'File path to debug')
  .option('--json', 'Output machine-readable JSON')
  .action((filePath: string, options: { json?: boolean }) => {
    try {
      const info = debugService.debugFile(filePath);
      if (options.json) {
        console.log(JSON.stringify(info, null, 2));
      } else {
        console.log(chalk.bold('\nFile Info\n'));
        console.log(`  Path: ${chalk.cyan(filePath)}`);
        console.log(`  Exists: ${info.exists ? chalk.green('yes') : chalk.red('no')}`);
        if (info.exists) {
          if (info.size !== undefined) console.log(`  Size: ${info.size} bytes`);
          if (info.modified) console.log(`  Modified: ${chalk.dim(info.modified)}`);
          if (info.permissions) console.log(`  Permissions: ${info.permissions}`);
        }
        if (info.error) console.log(`  Error: ${chalk.red(info.error)}`);
        console.log('');
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

debug
  .command('scrap')
  .description('List all known projects')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const projects = debugService.listProjects();
      if (options.json) {
        console.log(JSON.stringify(projects, null, 2));
      } else {
        console.log(chalk.bold('\nKnown Projects\n'));
        for (const p of projects) {
          console.log(`  ${chalk.cyan(p.name)}: ${chalk.dim(p.path)}`);
        }
        console.log('');
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

debug
  .command('skill')
  .description('List all available skills')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const skills = debugService.listSkills();
      if (options.json) {
        console.log(JSON.stringify(skills, null, 2));
      } else {
        console.log(chalk.bold('\nAvailable Skills\n'));
        for (const s of skills) {
          console.log(`  ${chalk.cyan(s.name)} (${chalk.dim(s.source)})`);
        }
        console.log('');
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

debug
  .command('snapshot')
  .description('Snapshot debugging utilities')
  .option('--output <path>', 'Output file path')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { output?: string; json?: boolean }) => {
    try {
      const { path: snapshotPath, data } = debugService.createSnapshot(options.output);
      if (options.json) {
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log(chalk.green(`✅ Snapshot saved to ${snapshotPath}`));
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

debug
  .command('agent')
  .description('Show agent configuration details')
  .argument('<name>', 'Agent name')
  .option('--json', 'Output machine-readable JSON')
  .action((name: string, options: { json?: boolean }) => {
    try {
      const agent = agentManager.getByName(name) || agentManager.get(name);
      if (!agent) {
        console.log(chalk.red(`Agent '${name}' not found`));
        process.exit(1);
      }
      if (options.json) {
        console.log(JSON.stringify(agent, null, 2));
      } else {
        console.log(chalk.bold(`\nAgent: ${name}\n`));
        console.log(`  ID: ${chalk.dim(agent.id)}`);
        console.log(`  Role: ${agent.role}`);
        console.log(`  Platform: ${agent.platform}`);
        console.log(
          `  Status: ${agent.isOnline ? chalk.green('online') : chalk.yellow('offline')}`
        );
        console.log(`  Created: ${chalk.dim(agent.createdAt)}`);
        console.log(`  Last Seen: ${chalk.dim(agent.lastSeen)}`);
        if (agent.capabilities.length > 0) {
          console.log(`  Capabilities: ${agent.capabilities.join(', ')}`);
        }
        console.log('');
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

debug
  .command('paths')
  .description('Show global paths (data, config, cache, state)')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const paths = debugService.getPaths();
      if (options.json) {
        console.log(JSON.stringify(paths, null, 2));
      } else {
        console.log(chalk.bold('\nGlobal Paths\n'));
        console.log(`  Config:  ${chalk.cyan(paths.config)}`);
        console.log(`  Data:    ${chalk.cyan(paths.data)}`);
        console.log(`  Cache:   ${chalk.cyan(paths.cache)}`);
        console.log(`  State:   ${chalk.cyan(paths.state)}`);
        console.log(`  Logs:    ${chalk.cyan(paths.logs)}`);
        console.log('');
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

debug
  .command('wait')
  .description('Wait indefinitely (for debugging)')
  .action(() => {
    console.log(chalk.dim('Waiting... Press Ctrl+C to exit'));
    process.on('SIGINT', () => process.exit(0));
  });

// Config commands (kilo parity: unified config management)
const configCmd = program
  .command('config')
  .description('Manage TNF configuration (kilo.jsonc parity)');

configCmd
  .command('show')
  .description('Show resolved configuration (global + project merge)')
  .option('--json', 'Output machine-readable JSON')
  .option('--path <key>', 'Get specific config path (dot notation)')
  .action((options: { json?: boolean; path?: string }) => {
    try {
      if (options.path) {
        const value = debugService.getConfigPath(options.path);
        if (options.json) {
          console.log(JSON.stringify({ path: options.path, value }, null, 2));
        } else {
          console.log(
            value !== undefined ? JSON.stringify(value, null, 2) : chalk.yellow('undefined')
          );
        }
      } else {
        const config = debugService.getConfig();
        if (options.json) {
          console.log(JSON.stringify(config, null, 2));
        } else {
          console.log(chalk.bold('\nResolved Configuration\n'));
          if (config.$schema) console.log(` Schema: ${chalk.dim(config.$schema)}`);
          if (config.model) console.log(` Model: ${chalk.cyan(config.model)}`);
          if (config.provider) console.log(` Provider: ${chalk.cyan(config.provider)}`);
          if (config.apiBaseUrl) console.log(` API Base: ${chalk.dim(config.apiBaseUrl)}`);
          if (config.permission) {
            console.log(chalk.bold('\n Permissions\n'));
            const bashCount = Object.keys(config.permission.bash || {}).length;
            const readCount = Object.keys(config.permission.read || {}).length;
            const extDirCount = Object.keys(config.permission.external_directory || {}).length;
            console.log(`   Bash rules: ${bashCount}`);
            console.log(`   Read rules: ${readCount}`);
            console.log(`   External dir rules: ${extDirCount}`);
          }
          if (config.mcp) {
            console.log(chalk.bold('\n MCP Servers (inline)\n'));
            for (const [name, server] of Object.entries(config.mcp)) {
              const enabled =
                server.enabled !== false ? chalk.green('enabled') : chalk.red('disabled');
              const type = server.type || 'local';
              console.log(`   ${chalk.cyan(name)}: ${type} ${enabled}`);
            }
          }
          console.log('');
        }
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

configCmd
  .command('get <key>')
  .description('Get a specific config value (dot notation)')
  .action((key: string) => {
    try {
      const value = debugService.getConfigPath(key);
      if (value !== undefined) {
        console.log(typeof value === 'string' ? value : JSON.stringify(value, null, 2));
      } else {
        console.log(chalk.yellow(`Key '${key}' not found`));
        process.exit(1);
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

configCmd
  .command('paths')
  .description('Show config file paths (global + project)')
  .action(() => {
    try {
      const home = os.homedir();
      const globalJsonc = path.join(home, '.config', 'tnf', 'tnf.jsonc');
      const globalJson = path.join(home, '.config', 'tnf', 'config.json');
      const mcpConfig = path.join(home, '.config', 'tnf', 'mcp', 'mcp.json');
      const agentsConfig = path.join(home, '.config', 'tnf', 'agents', 'agents.json');
      const projectJsonc = path.join(process.cwd(), 'tnf.jsonc');
      const projectJson = path.join(process.cwd(), 'tnf.json');

      console.log(chalk.bold('\nConfig Paths\n'));
      console.log(
        ` Global (JSONC): ${fs.existsSync(globalJsonc) ? chalk.green(globalJsonc) : chalk.dim(globalJsonc + ' (not found)')}`
      );
      console.log(
        ` Global (JSON):  ${fs.existsSync(globalJson) ? chalk.green(globalJson) : chalk.dim(globalJson + ' (not found)')}`
      );
      console.log(
        ` MCP servers:    ${fs.existsSync(mcpConfig) ? chalk.green(mcpConfig) : chalk.dim(mcpConfig + ' (not found)')}`
      );
      console.log(
        ` Agents:         ${fs.existsSync(agentsConfig) ? chalk.green(agentsConfig) : chalk.dim(agentsConfig + ' (not found)')}`
      );
      console.log(
        ` Project (JSONC):${fs.existsSync(projectJsonc) ? chalk.green(projectJsonc) : chalk.dim(projectJsonc + ' (not found)')}`
      );
      console.log(
        ` Project (JSON): ${fs.existsSync(projectJson) ? chalk.green(projectJson) : chalk.dim(projectJson + ' (not found)')}`
      );
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

configCmd
  .command('set <key> <value>')
  .description('Set a config value in global tnf.jsonc')
  .action((key: string, value: string) => {
    try {
      const configDir = path.join(os.homedir(), '.config', 'tnf');
      const configPath = path.join(configDir, 'tnf.jsonc');
      let config: Record<string, any> = {};
      if (fs.existsSync(configPath)) {
        let raw = fs.readFileSync(configPath, 'utf8');
        if (configPath.endsWith('.jsonc')) {
          const permService = new PermissionService(undefined, process.cwd());
          raw = permService.stripJsoncCommentsPublic(raw);
        }
        config = JSON.parse(raw);
      }
      let parsedValue: any = value;
      try {
        parsedValue = JSON.parse(value);
      } catch {}
      const parts = key.split('.');
      let target: Record<string, any> = config;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!(parts[i] in target)) target[parts[i]] = {};
        target = target[parts[i]];
      }
      target[parts[parts.length - 1]] = parsedValue;
      if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log(chalk.green(`✅ Set ${key} = ${JSON.stringify(parsedValue)}`));
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// Permission commands (kilo parity: granular bash/read/external_directory permissions)
const permissionCmd = program
  .command('permission')
  .description('Manage permission rules (bash, read, external_directory)');

permissionCmd
  .command('list')
  .description('List all permission rules')
  .option('--type <type>', 'Filter by type (bash|read|external_directory)')
  .option('--scope <scope>', 'Filter by scope (global|project)')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { type?: string; scope?: string; json?: boolean }) => {
    try {
      const permService = new PermissionService(undefined, process.cwd());
      const allRules: Array<{ category: string; pattern: string; action: string; source: string }> =
        [];

      if (!options.type || options.type === 'bash') {
        for (const r of permService.listBashRules()) {
          if (!options.scope || options.scope === r.source) {
            allRules.push({
              category: 'bash',
              pattern: r.pattern,
              action: r.action,
              source: r.source,
            });
          }
        }
      }
      if (!options.type || options.type === 'read') {
        for (const r of permService.listReadRules()) {
          if (!options.scope || options.scope === r.source) {
            allRules.push({
              category: 'read',
              pattern: r.pattern,
              action: r.action,
              source: r.source,
            });
          }
        }
      }
      if (!options.type || options.type === 'external_directory') {
        for (const r of permService.listExternalDirectoryRules()) {
          if (!options.scope || options.scope === r.source) {
            allRules.push({
              category: 'external_directory',
              pattern: r.pattern,
              action: r.action,
              source: r.source,
            });
          }
        }
      }

      if (options.json) {
        console.log(JSON.stringify(allRules, null, 2));
      } else {
        console.log(chalk.bold('\nPermission Rules\n'));
        if (allRules.length === 0) {
          console.log(chalk.dim('No permission rules configured'));
        } else {
          for (const r of allRules) {
            const action = r.action === 'allow' ? chalk.green('allow') : chalk.red('deny');
            console.log(
              ` ${chalk.cyan(r.category)} ${r.pattern}: ${action} (${chalk.dim(r.source)})`
            );
          }
        }
        console.log('');
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

permissionCmd
  .command('add <category> <pattern> <action>')
  .description('Add a permission rule (category: bash|read|external_directory, action: allow|deny)')
  .option('--scope <scope>', 'Scope: global or project', 'global')
  .action((category: string, pattern: string, action: string, options: { scope: string }) => {
    try {
      if (!['bash', 'read', 'external_directory'].includes(category)) {
        console.log(
          chalk.red(`Invalid category '${category}'. Must be: bash, read, or external_directory`)
        );
        process.exit(1);
      }
      if (!['allow', 'deny'].includes(action)) {
        console.log(chalk.red(`Invalid action '${action}'. Must be: allow or deny`));
        process.exit(1);
      }
      const permService = new PermissionService(undefined, process.cwd());
      const scope = options.scope as 'global' | 'project';
      if (category === 'bash') permService.addBashRule(pattern, action as 'allow' | 'deny', scope);
      else if (category === 'read')
        permService.addReadRule(pattern, action as 'allow' | 'deny', scope);
      else permService.addExternalDirectoryRule(pattern, action as 'allow' | 'deny', scope);
      console.log(chalk.green(`✅ Added ${category} rule: ${pattern} → ${action} (${scope})`));
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

permissionCmd
  .command('remove <category> <pattern>')
  .description('Remove a permission rule')
  .option('--scope <scope>', 'Scope: global or project', 'global')
  .action((category: string, pattern: string, options: { scope: string }) => {
    try {
      const permService = new PermissionService(undefined, process.cwd());
      const scope = options.scope as 'global' | 'project';
      let removed = false;
      if (category === 'bash') removed = permService.removeBashRule(pattern, scope);
      else if (category === 'read') removed = permService.removeReadRule(pattern, scope);
      else if (category === 'external_directory')
        removed = permService.removeExternalDirectoryRule(pattern, scope);
      else {
        console.log(
          chalk.red(`Unknown category '${category}'. Must be: bash, read, or external_directory`)
        );
        process.exit(1);
      }
      if (removed) {
        console.log(chalk.green(`✅ Removed ${category} rule: ${pattern} (${scope})`));
      } else {
        console.log(chalk.yellow(`Rule '${pattern}' not found in ${category} (${scope})`));
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

permissionCmd
  .command('check <command>')
  .description('Check if a bash command is allowed by permission rules')
  .option('--type <type>', 'Check type: bash|read|external_directory', 'bash')
  .action((command: string, options: { type: string }) => {
    try {
      const permService = new PermissionService(undefined, process.cwd());
      let result: { allowed: boolean; matchedRule?: string; action?: string; source?: string };
      if (options.type === 'bash') result = permService.checkBashCommand(command);
      else if (options.type === 'read') result = permService.checkReadPath(command);
      else result = permService.checkExternalDirectory(command);
      if (result.allowed) {
        console.log(
          chalk.green(`✅ Allowed`) +
            (result.matchedRule
              ? ` (rule: ${result.matchedRule} → ${result.action}, ${result.source})`
              : ' (no rules matched, default deny)')
        );
      } else {
        console.log(
          chalk.red(`⛔ Denied`) +
            ` (rule: ${result.matchedRule} → ${result.action}, ${result.source})`
        );
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// Project-level config commands (kilo parity: project tnf.json + .tnf/command + .tnf/agent)
const projectCmd = program
  .command('project')
  .description('Project-level configuration (tnf.jsonc, .tnf/command, .tnf/agent)');

const PROJECT_SCAFFOLD_KINDS = new Set<ProjectScaffoldKind>([
  'command',
  'agent',
  'skill',
  'workflow',
  'mcp-server',
]);

function parseProjectScaffoldKind(kind: string): ProjectScaffoldKind {
  const normalized = kind.trim().toLowerCase().replace(/_/g, '-');
  if (normalized === 'mcpserver') return 'mcp-server';
  if (PROJECT_SCAFFOLD_KINDS.has(normalized as ProjectScaffoldKind)) {
    return normalized as ProjectScaffoldKind;
  }
  throw new Error(
    `Invalid scaffold kind '${kind}'. Expected one of: ${Array.from(PROJECT_SCAFFOLD_KINDS).join(', ')}.`
  );
}

function printProjectScaffoldResult(result: ProjectScaffoldResult): void {
  const verb = result.overwritten ? 'Updated' : 'Created';
  console.log(chalk.green(`${verb} ${result.kind} scaffold: ${result.name}`));
  console.log(`  ${chalk.dim(result.filePath)}`);
}

projectCmd
  .command('init')
  .description('Initialize project-level tnf.jsonc and .tnf/ directories')
  .action(() => {
    try {
      const projService = new ProjectConfigService(invocationCwd);
      const existingPath = projService.getConfigPath();
      if (existingPath) {
        console.log(chalk.yellow(`Project config already exists at: ${existingPath}`));
        process.exit(0);
      }
      const createdPath = projService.createDefaultConfig();
      console.log(chalk.green(`✅ Created project config at: ${createdPath}`));
      console.log(chalk.dim(`   Created: .tnf/command/ and .tnf/agent/ directories`));
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

projectCmd
  .command('create')
  .description('Create a project command, agent, skill, workflow, or MCP server scaffold')
  .argument('<kind>', 'command|agent|skill|workflow|mcp-server')
  .argument('<name>', 'Scaffold name')
  .option('--force', 'Overwrite an existing scaffold')
  .action((kind: string, name: string, options: { force?: boolean }) => {
    try {
      const projService = new ProjectConfigService(invocationCwd);
      const result = projService.createScaffold(parseProjectScaffoldKind(kind), name, {
        force: options.force,
      });
      printProjectScaffoldResult(result);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

projectCmd
  .command('show')
  .description('Show project-level configuration')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const projService = new ProjectConfigService(invocationCwd);
      const config = projService.getConfig();
      const commands = projService.getCommands();
      const agents = projService.getAgents();

      if (options.json) {
        console.log(JSON.stringify({ config, commands, agents }, null, 2));
      } else {
        console.log(chalk.bold('\nProject Configuration\n'));
        if (config) {
          if (config.model) console.log(` Model: ${chalk.cyan(config.model)}`);
          if (config.provider) console.log(` Provider: ${chalk.cyan(config.provider)}`);
          if (config.$schema) console.log(` Schema: ${chalk.dim(config.$schema)}`);
          if (config.mcp && Object.keys(config.mcp).length > 0) {
            console.log(chalk.bold('\n Project MCP Servers\n'));
            for (const [name, server] of Object.entries(config.mcp)) {
              const enabled =
                server.enabled !== false ? chalk.green('enabled') : chalk.red('disabled');
              console.log(`   ${chalk.cyan(name)}: ${server.type || 'local'} ${enabled}`);
            }
          }
        } else {
          console.log(chalk.dim('No project config found. Run `tnf project init` to create one.'));
        }

        if (commands.length > 0) {
          console.log(chalk.bold('\n Project Commands (.tnf/command/)\n'));
          for (const cmd of commands) {
            console.log(`   ${chalk.cyan(cmd.name)}: ${chalk.dim(cmd.filePath)}`);
          }
        }
        if (agents.length > 0) {
          console.log(chalk.bold('\n Project Agents (.tnf/agent/)\n'));
          for (const agent of agents) {
            console.log(`   ${chalk.cyan(agent.name)}: ${chalk.dim(agent.filePath)}`);
          }
        }
        console.log('');
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

projectCmd
  .command('commands')
  .description('List project command definitions from .tnf/command/')
  .action(() => {
    try {
      const projService = new ProjectConfigService(invocationCwd);
      const commands = projService.getCommands();
      console.log(chalk.bold('\nProject Commands (.tnf/command/)\n'));
      if (commands.length === 0) {
        console.log(chalk.dim('No project commands found. Add .md files to .tnf/command/'));
      } else {
        for (const cmd of commands) {
          console.log(` ${chalk.cyan(cmd.name)}`);
          const firstLine = cmd.content.split('\n')[0]?.replace(/^#\s*/, '') || '';
          if (firstLine) console.log(`   ${chalk.dim(firstLine)}`);
        }
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

projectCmd
  .command('agents')
  .description('List project agent definitions from .tnf/agent/')
  .action(() => {
    try {
      const projService = new ProjectConfigService(invocationCwd);
      const agents = projService.getAgents();
      console.log(chalk.bold('\nProject Agents (.tnf/agent/)\n'));
      if (agents.length === 0) {
        console.log(chalk.dim('No project agents found. Add .md files to .tnf/agent/'));
      } else {
        for (const agent of agents) {
          console.log(` ${chalk.cyan(agent.name)}`);
          const firstLine = agent.content.split('\n')[0]?.replace(/^#\s*/, '') || '';
          if (firstLine) console.log(`   ${chalk.dim(firstLine)}`);
        }
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// Slash command registry and dispatch
const slashCmd = program.command('slash').description('List and inspect TNF slash commands');

slashCmd
  .command('list')
  .alias('ls')
  .description('List standard, TNF, and project slash commands')
  .action(() => {
    printSlashCommandList();
  });

slashCmd
  .command('show')
  .description('Show details for a slash command')
  .argument('<command>', 'Slash command name, with or without leading /')
  .action((commandName: string) => {
    const command = findSlashCommand(commandName, process.cwd());
    if (!command) {
      console.error(chalk.red(`Unknown slash command: /${commandName.replace(/^\//, '')}`));
      process.exit(1);
    }
    printSlashCommandDetail(command);
  });

slashCmd
  .command('run')
  .description('Run or resolve a slash command')
  .argument('<command>', 'Slash command name, with or without leading /')
  .argument('[args...]', 'Arguments for the slash command')
  .action(async (commandName: string, args: string[]) => {
    const slashInput = `/${commandName.replace(/^\//, '')}${args.length ? ` ${args.join(' ')}` : ''}`;
    await handleOneShotSlashInput(slashInput);
  });

// Session commands
const sessionManager = new SessionManagerService();

const session = program.command('session').description('Manage sessions');

session
  .command('list')
  .description('List sessions')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const sessions = sessionManager.list();
      if (options.json) {
        console.log(JSON.stringify(sessions, null, 2));
      } else {
        console.log(chalk.bold('\nSessions\n'));
        if (sessions.length === 0) {
          console.log(chalk.dim('No sessions found'));
        } else {
          for (const s of sessions) {
            const name = s.name || s.id;
            console.log(`  ${chalk.cyan(name)} (${s.provider}/${s.model}): ${s.messageCount} msgs`);
          }
        }
        console.log('');
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

session
  .command('delete')
  .description('Delete a session')
  .argument('<sessionId>', 'Session ID')
  .action((sessionId: string) => {
    try {
      const result = sessionManager.delete(sessionId);
      if (result.success) {
        console.log(chalk.green(`✅ ${result.message}`));
      } else {
        console.log(chalk.red(result.message));
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// Remote command
program
  .command('remote')
  .description('Enable remote connection for real-time session relay')
  .option('--port <number>', 'Port to listen on', '0')
  .option('--hostname <hostname>', 'Hostname to listen on', '127.0.0.1')
  .option('--mdns', 'Enable mDNS discovery', false)
  .option('--mdns-domain <domain>', 'Custom mDNS domain', 'tnf.local')
  .option('--cors <origins...>', 'Allowed CORS origins')
  .action(
    async (options: {
      port: string;
      hostname: string;
      mdns: boolean;
      mdnsDomain: string;
      cors?: string[];
    }) => {
      try {
        const service = new RemoteService({
          port: parseInt(options.port, 10) || 0,
          hostname: options.hostname,
          mdns: options.mdns,
          mdnsDomain: options.mdnsDomain,
          cors: options.cors,
        });
        const { url } = await service.enable();
        console.log(chalk.green(`✅ Remote relay enabled at ${url}`));
        console.log(chalk.dim('Press Ctrl+C to stop'));

        process.on('SIGINT', async () => {
          await service.disable();
          process.exit(0);
        });
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

// Export command
program
  .command('export')
  .description('Export session data as JSON')
  .argument('[sessionId]', 'Session ID (omit for all sessions)')
  .option('--output <path>', 'Output file path')
  .action(async (sessionId?: string, options?: { output?: string }) => {
    try {
      if (!sessionId && options?.output) {
        await sessionManager.exportAllToStream(options.output);
        console.log(chalk.green(`✅ Exported all sessions (streaming) to ${options.output}`));
        return;
      }

      const data = sessionId
        ? sessionManager.export(sessionId)
        : { sessions: sessionManager.exportAll() };

      if (!data) {
        console.log(chalk.red(`Session '${sessionId}' not found`));
        process.exit(1);
      }

      const json = JSON.stringify(data, null, 2);
      if (options?.output) {
        fs.writeFileSync(options.output, json);
        console.log(chalk.green(`✅ Exported to ${options.output}`));
      } else {
        console.log(json);
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// Import command
program
  .command('import')
  .description('Import session data from JSON file or URL')
  .argument('<file>', 'JSON file path or URL')
  .option('--overwrite', 'Overwrite existing session if ID conflicts')
  .action(async (file: string, options: { overwrite?: boolean }) => {
    try {
      const result = file.startsWith('http')
        ? await sessionManager.importFromUrl(file)
        : sessionManager.importFromFile(file, { overwrite: options.overwrite });

      if (result.success) {
        console.log(chalk.green(`✅ ${result.message}`));
      } else {
        console.log(chalk.red(result.message));
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// Models command
program
  .command('models')
  .description('List all available models')
  .argument('[provider]', 'Provider ID to filter models by')
  .option('--verbose', 'Show detailed model information')
  .option('--refresh', 'Refresh the models cache')
  .option('--json', 'Output machine-readable JSON')
  .action(
    async (
      provider?: string,
      options?: { verbose?: boolean; refresh?: boolean; json?: boolean }
    ) => {
      try {
        const modelsService = new ModelsService();
        const models = await modelsService.listModels(provider, { refresh: options?.refresh });

        if (options?.json) {
          console.log(JSON.stringify(models, null, 2));
          return;
        }

        console.log(chalk.bold('\nAvailable Models\n'));
        if (models.length === 0) {
          console.log(chalk.dim('No models found'));
        } else {
          for (const m of models) {
            if (options?.verbose) {
              console.log(`${chalk.cyan(m.id)} (${m.provider})`);
              if (m.contextWindow)
                console.log(`  Context: ${m.contextWindow.toLocaleString()} tokens`);
              if (m.inputCost !== undefined)
                console.log(`  Input: $${(m.inputCost / 1000000).toFixed(4)}/1M tokens`);
              if (m.outputCost !== undefined)
                console.log(`  Output: $${(m.outputCost / 1000000).toFixed(4)}/1M tokens`);
              console.log('');
            } else {
              console.log(`  ${chalk.cyan(m.id)}`);
            }
          }
        }
        console.log('');
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

// Stats command
program
  .command('stats')
  .description('Show token usage and cost statistics')
  .option('--days <n>', 'Show stats for the last N days', undefined)
  .option('--tools <n>', 'Number of tools to show', undefined)
  .option('--models', 'Show model statistics')
  .option('--project <name>', 'Filter by project')
  .option('--json', 'Output machine-readable JSON')
  .action(
    async (options: {
      days?: string;
      tools?: string;
      models?: boolean;
      project?: string;
      json?: boolean;
    }) => {
      try {
        const statsService = new StatsService();

        const summary = await statsService.getSummary({
          days: options.days ? parseInt(options.days, 10) : undefined,
          project: options.project,
        });

        await statsService.close();

        if (options.json) {
          console.log(JSON.stringify(summary, null, 2));
          return;
        }

        console.log(chalk.bold('\n📊 Usage Statistics\n'));
        console.log(`  Total Tokens: ${chalk.cyan(summary.totalTokens.toLocaleString())}`);
        console.log(`  Total Cost: ${chalk.cyan('$' + summary.totalCost.toFixed(4))}`);
        console.log('');

        if (options.models && Object.keys(summary.byModel).length > 0) {
          console.log(chalk.bold('By Model:'));
          for (const [model, data] of Object.entries(summary.byModel)) {
            console.log(
              `  ${chalk.cyan(model)}: ${data.tokens.toLocaleString()} tokens, $${data.cost.toFixed(4)}`
            );
          }
          console.log('');
        }

        if (Object.keys(summary.byProvider).length > 0) {
          console.log(chalk.bold('By Provider:'));
          for (const [provider, data] of Object.entries(summary.byProvider)) {
            console.log(
              `  ${chalk.cyan(provider)}: ${data.tokens.toLocaleString()} tokens, $${data.cost.toFixed(4)}`
            );
          }
          console.log('');
        }
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

// Database commands
const db = program.command('db').description('Database tools');
const dbService = new DatabaseService();

db.command('path')
  .description('Print the database path')
  .action(() => {
    console.log(dbService.getPath());
  });

db.command('migrate')
  .description('Migrate JSON data to SQLite (merges with existing data)')
  .action(async () => {
    try {
      const result = await dbService.migrate();
      console.log(chalk.green(`✅ Migrated ${result.migrated} files`));
      if (result.errors.length > 0) {
        for (const err of result.errors) {
          console.log(chalk.yellow(err));
        }
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

db.argument('[query]', 'SQL query to execute')
  .option('--format <format>', 'Output format (json|tsv)', 'tsv')
  .description('Open an interactive sqlite3 shell or run a query')
  .action(async (query?: string, options?: { format?: string }) => {
    try {
      if (!query) {
        await dbService.openInteractive();
        return;
      }
      const result = await dbService.query(query, { format: options?.format as 'json' | 'tsv' });
      if (options?.format === 'json') {
        console.log(JSON.stringify(result.rows, null, 2));
      } else {
        console.log(result.columns.join('\t'));
        for (const row of result.rows) {
          console.log(Object.values(row).join('\t'));
        }
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// Serve command
program
  .command('serve')
  .description('Starts a headless tnf server')
  .option('--port <number>', 'Port to listen on', '0')
  .option('--hostname <hostname>', 'Hostname to listen on', '127.0.0.1')
  .option('--mdns', 'Enable mDNS service discovery', false)
  .option('--mdns-domain <domain>', 'Custom mDNS domain', 'tnf.local')
  .option('--cors <origins...>', 'Allowed CORS origins')
  .action(
    async (options: {
      port: string;
      hostname: string;
      mdns: boolean;
      mdnsDomain: string;
      cors?: string[];
    }) => {
      try {
        const service = new ServeService({
          port: parseInt(options.port, 10) || 0,
          hostname: options.hostname,
          mdns: options.mdns,
          mdnsDomain: options.mdnsDomain,
          cors: options.cors,
        });
        const status = await service.start();
        console.log(chalk.green(`✅ TNF server started at ${status.url}`));
        console.log(chalk.dim(`  PID: ${status.pid}`));
        console.log(chalk.dim('Press Ctrl+C to stop'));

        process.on('SIGINT', async () => {
          await service.stop();
          process.exit(0);
        });
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

// Completion command
program
  .command('completion')
  .description('Generate shell completion script')
  .option('--shell <shell>', 'Shell type (zsh|bash|fish)', 'zsh')
  .action((options: { shell: ShellType }) => {
    const completion = generateCompletion(options.shell);
    console.log(completion);
    console.log(chalk.dim('\n' + getInstallInstructions(options.shell)));
  });

// Upgrade command
program
  .command('upgrade')
  .alias('update')
  .description('Upgrade tnf to the latest or a specific version')
  .argument('[target]', 'Version to upgrade to')
  .option('-m, --method <method>', 'Installation method (curl|npm|pnpm|bun|brew)')
  .action(
    async (target?: string, options?: { method?: 'curl' | 'npm' | 'pnpm' | 'bun' | 'brew' }) => {
      try {
        const upgradeService = new UpgradeService();
        const result = await upgradeService.upgrade({ target, method: options?.method });
        if (result.success) {
          console.log(chalk.green(`✅ ${result.message}`));
        } else {
          console.log(chalk.red(result.message));
        }
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

// Uninstall command
program
  .command('uninstall')
  .description('Uninstall tnf and remove all related files')
  .action(async () => {
    try {
      const upgradeService = new UpgradeService();
      const result = await upgradeService.uninstall();
      if (result.success) {
        console.log(chalk.green(`✅ ${result.message}`));
      } else {
        console.log(chalk.red(result.message));
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// Story Architect command group
const story = program.command('story').description('Story Architect utilities and drafting');

story
  .command('doctor')
  .description('Verify Story Architect auth and database access')
  .action(async () => {
    try {
      const storyService = new StoryService();
      console.log(chalk.bold.magenta('\n  Story Architect Preflight Diagnostics'));
      console.log('  ' + '-'.repeat(60));

      const result = await storyService.doctor();

      console.log(`  Supabase URL:  ${chalk.cyan(result.url)}`);
      console.log(
        `  Auth Mode:     ${result.authMode === 'service-role' ? chalk.green('Service Role (Elevated)') : chalk.yellow('Anon (Limited)')}`
      );
      console.log(`  Default Owner: ${chalk.bold(result.owner)}`);

      console.log(`\n  Table Access:`);
      const sessionColor = result.story_sessions.ok ? chalk.green : chalk.red;
      console.log(`  - story_sessions:  ${sessionColor(result.story_sessions.message)}`);

      const eventColor = result.timeline_events.ok ? chalk.green : chalk.red;
      console.log(`  - timeline_events: ${eventColor(result.timeline_events.message)}`);

      if (!result.story_sessions.ok || !result.timeline_events.ok) {
        console.log(
          chalk.yellow('\n  [Advice] End-to-end captures require service-role permissions.')
        );
        console.log(chalk.dim('  Run: export SUPABASE_SERVICE_ROLE_KEY=your-key-here\n'));
      } else {
        console.log(chalk.green('\n  ✅ System is ready for end-to-end story drafting.\n'));
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

story
  .command('create')
  .description('Create a new story drafting session')
  .argument('<title>', 'Session title')
  .option('-d, --description <text>', 'Session description')
  .option('-o, --owner <principal>', 'Owner principal id (defaults to env or daniel)')
  .action(async (title: string, options: { description?: string; owner?: string }) => {
    try {
      const storyService = new StoryService();
      const session = await storyService.createSession({
        title,
        description: options.description,
        ownerPrincipalId: options.owner,
      });

      console.log(chalk.green(`✅ Story session created: ${chalk.bold(session.id)}`));
      console.log(chalk.dim('  Run `tnf story draft` to start answering questions.\n'));
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

story
  .command('draft')
  .alias('resume')
  .description('Start or resume an interactive story drafting session')
  .option('-s, --session <id>', 'Session ID (defaults to active session)')
  .option('-o, --owner <principal>', 'Owner principal id (defaults to env or daniel)')
  .option('--all', 'Include already answered questions', false)
  .action(async (options: { session?: string; owner?: string; all?: boolean }) => {
    try {
      const storyService = new StoryService();
      let sessionId = options.session;
      if (!sessionId) {
        const active = await storyService.getActiveSession(options.owner);
        if (!active) {
          console.error(
            chalk.red('No active story session found. Create one with `tnf story create`.')
          );
          process.exit(1);
        }
        sessionId = active.id;
      }

      console.log(chalk.bold.magenta('\n  Welcome to Story Architect Interactive Drafting'));
      console.log(chalk.dim('  Session: ' + sessionId));
      console.log(chalk.dim('  Type "exit" to quit, press Enter to skip.\n'));

      const allQuestions = storyService.getQuestions();
      const capturedIds = options.all ? [] : await storyService.getCapturedQuestionIds(sessionId);
      const remainingQuestions = allQuestions.filter((q) => !capturedIds.includes(q.id));

      if (remainingQuestions.length === 0) {
        console.log(chalk.green('  All questions have been answered for this session!'));
        console.log(chalk.dim('  Use --all to review or overwrite previous answers.\n'));
        return;
      }

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      for (const q of remainingQuestions) {
        const answer: string = await new Promise((resolve) => {
          console.log(chalk.bold.cyan(`\n  [Era ${q.ring}] ${q.text}`));
          rl.question(chalk.green('  Answer: '), (input) => resolve(input));
        });

        if (answer.toLowerCase() === 'exit') break;
        if (answer.trim() === '') {
          console.log(chalk.dim('  Skipping...'));
          continue;
        }

        console.log(chalk.dim('  Capturing insight...'));
        await storyService.saveCapture({
          sessionId,
          questionId: q.id,
          ring: q.ring,
          shelfCode: q.shelfCode,
          questionText: q.text,
          answerText: answer,
          ownerPrincipalId: options.owner,
        });
        console.log(chalk.green('  ✅ Saved and synced.'));
      }

      rl.close();
      console.log(
        chalk.bold.magenta('\n  Drafting session complete. Check your timeline for updates!\n')
      );
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

story
  .command('list')
  .alias('ls')
  .description('List all story sessions')
  .option('-o, --owner <principal>', 'Owner principal id (defaults to env or daniel)')
  .action(async (options: { owner?: string }) => {
    try {
      const storyService = new StoryService();
      const sessions = await storyService.listSessions(options.owner);
      if (sessions.length === 0) {
        console.log(chalk.yellow('No story sessions found.'));
        return;
      }
      console.log(chalk.bold('\n  Story Architect Sessions:'));
      console.log('  ' + '-'.repeat(60));
      for (const s of sessions) {
        const status = s.status === 'active' ? chalk.green(s.status) : chalk.dim(s.status);
        console.log(`  ${chalk.cyan(s.id)} | ${status} | ${chalk.bold(s.title)}`);
        if (s.description) console.log(`    ${chalk.dim(s.description)}`);
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

story
  .command('active')
  .description('Show the active story session')
  .option('-o, --owner <principal>', 'Owner principal id (defaults to env or daniel)')
  .action(async (options: { owner?: string }) => {
    try {
      const storyService = new StoryService();
      const session = await storyService.getActiveSession(options.owner);
      if (!session) {
        console.log(chalk.yellow('No active story session.'));
        return;
      }
      console.log(chalk.bold('\n  Active Story Session:'));
      console.log(`  ID: ${chalk.cyan(session.id)}`);
      console.log(`  Title: ${chalk.bold(session.title)}`);
      if (session.description) console.log(`  Description: ${session.description}`);
      console.log(`  Created: ${new Date(session.created_at).toLocaleString()}`);
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

story
  .command('timeline')
  .description('List story timeline events')
  .option('-o, --owner <principal>', 'Owner principal id (defaults to env or daniel)')
  .action(async (options: { owner?: string }) => {
    try {
      const storyService = new StoryService();
      const events = await storyService.listTimelineEvents(options.owner);
      if (events.length === 0) {
        console.log(chalk.yellow('No story timeline events found.'));
        return;
      }
      console.log(chalk.bold('\n  Story Timeline:'));
      console.log('  ' + '-'.repeat(60));
      for (const e of events) {
        const era = e.era ? chalk.magenta(`[Era ${e.era}]`) : '';
        console.log(`  ${chalk.dim(e.event_date)} ${era} ${chalk.bold(e.title)}`);
        if (e.description) {
          const lines = e.description.split('\n');
          for (const line of lines) {
            console.log(`    ${chalk.dim(line)}`);
          }
        }
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

story
  .command('capture')
  .description('Manually capture a story insight')
  .argument('<answer>', 'The answer or insight text')
  .option('-q, --question <text>', 'The question text', 'Manual Discovery')
  .option('-s, --session <id>', 'Session ID (defaults to active session)')
  .option('-r, --ring <number>', 'Ring depth (1-5)', '1')
  .option('--shelf <code >', 'Shelf code', 'GEN')
  .option('-o, --owner <principal>', 'Owner principal id (defaults to env or daniel)')
  .action(
    async (
      answer: string,
      options: { question: string; session?: string; ring: string; shelf: string; owner?: string }
    ) => {
      try {
        const storyService = new StoryService();
        let sessionId = options.session;
        if (!sessionId) {
          const active = await storyService.getActiveSession(options.owner);
          if (!active) {
            console.error(chalk.red('No active session found. Please specify --session <id>.'));
            process.exit(1);
          }
          sessionId = active.id;
        }

        const ring = parseInt(options.ring, 10);
        const questionId = Math.floor(Math.random() * 1000000); // Synthetic ID for manual captures

        console.log(chalk.dim(`Capturing insight for session ${sessionId}...`));

        await storyService.saveCapture({
          sessionId,
          questionId,
          ring,
          shelfCode: options.shelf,
          questionText: options.question,
          answerText: answer,
          ownerPrincipalId: options.owner,
        });

        console.log(chalk.green('✅ Story insight captured and synced to timeline.'));
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

// Strategic Goals command group
const goals = program.command('goals').description('Strategic goals and roadmap management');

goals
  .command('list')
  .alias('ls')
  .description('List all strategic goals')
  .option('-s, --status <status>', 'Filter by status (active, completed, paused)')
  .option('-p, --priority <level>', 'Filter by priority')
  .action(async (options: { status?: string; priority?: string }) => {
    try {
      const goalsService = new GoalsService();
      let list = await goalsService.list();

      if (options.status) {
        list = list.filter((g) => g.status === options.status);
      }
      if (options.priority) {
        list = list.filter((g) => g.priority === options.priority);
      }

      if (list.length === 0) {
        console.log(chalk.yellow('No goals found.'));
        return;
      }

      console.log(chalk.bold.blue('\n  TNF Strategic Goals:'));
      console.log('  ' + '-'.repeat(70));

      const priorityColors: Record<string, any> = {
        critical: chalk.red,
        high: chalk.yellow,
        medium: chalk.white,
        low: chalk.dim,
        trivial: chalk.dim,
      };

      for (const g of list) {
        const pColor = priorityColors[g.priority] || chalk.white;
        const status = g.status === 'active' ? chalk.green(g.status) : chalk.dim(g.status);
        const progress = chalk.cyan(`[${g.progress}%]`);

        console.log(
          `  ${status} | ${pColor(g.priority.padEnd(8))} | ${chalk.bold(g.title)} ${progress}`
        );
        if (g.description) console.log(`    ${chalk.dim(g.description)}`);
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

goals
  .command('create')
  .description('Create a new strategic goal')
  .argument('<title>', 'Goal title')
  .option('-d, --description <text>', 'Goal description')
  .option('-p, --priority <level>', 'Priority (critical, high, medium, low)', 'medium')
  .option('-c, --category <name>', 'Category', 'general')
  .action(
    async (title: string, options: { description?: string; priority: any; category: string }) => {
      try {
        const goalsService = new GoalsService();
        const goal = await goalsService.create({
          title,
          description: options.description,
          priority: options.priority,
          category: options.category,
        });

        console.log(chalk.green(`✅ Goal created: ${chalk.bold(goal.title)} (${goal.id})`));
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

goals
  .command('stats')
  .description('Show goals summary statistics')
  .action(async () => {
    try {
      const goalsService = new GoalsService();
      const stats = await goalsService.getStats();

      console.log(chalk.bold.blue('\n  Goals Summary:'));
      console.log('  ' + '-'.repeat(30));
      console.log(`  Total:     ${stats.total}`);
      console.log(`  Active:    ${chalk.green(stats.active)}`);
      console.log(`  Completed: ${chalk.cyan(stats.completed)}`);

      console.log(chalk.bold('\n  By Priority:'));
      for (const [p, count] of Object.entries(stats.byPriority)) {
        console.log(`  ${p.padEnd(10)}: ${count}`);
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// Feedback command - for beta developer feedback integration
const feedback = program.command('feedback').description('Feedback management for beta developers');

// Feedback submit
feedback
  .command('submit')
  .description('Submit feedback (bug, feature, or suggestion)')
  .option('-t, --type <type>', 'Feedback type (bug|feature|ux|other)', 'other')
  .option('-p, --priority <priority>', 'Priority (low|medium|high|critical)', 'medium')
  .option('-m, --message <message>', 'Feedback message (required)')
  .option('-c, --context <context>', 'URL or context')
  .option('--host <host>', 'API host', process.env.TNF_API_HOST || 'http://127.0.0.1:3001')
  .action(
    async (options: {
      type?: string;
      priority?: string;
      message?: string;
      context?: string;
      host?: string;
    }) => {
      try {
        if (!options.message) {
          console.error(chalk.red('--message is required'));
          process.exit(1);
        }
        const host = options.host || process.env.TNF_API_HOST || 'http://127.0.0.1:3001';
        const body = {
          type: options.type || 'other',
          priority: options.priority || 'medium',
          message: options.message,
          contextUrl: options.context || '',
          source: 'beta',
        };
        const url = `${host}/api/feedback`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(5000),
        });
        if (!resp.ok) {
          console.error(
            chalk.red(`Failed to submit feedback (HTTP ${resp.status}). Is backend running?`)
          );
          process.exit(1);
        }
        const response = (await resp.json()) as Record<string, any>;
        const feedbackId = response.id;
        console.log(chalk.green(`✅ Feedback submitted: ${feedbackId}`));
        console.log(chalk.dim(` Type: ${body.type}`));
        console.log(chalk.dim(` Priority: ${body.priority}`));
        if (options.context) {
          console.log(chalk.dim(` Context: ${options.context}`));
        }
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

// Feedback list
feedback
  .command('list')
  .alias('ls')
  .description('List all feedback')
  .option('--status <status>', 'Filter by status (new|triaged|in_progress|done)')
  .option('--type <type>', 'Filter by type (bug|feature|ux|other)')
  .option('--json', 'Output as JSON')
  .option('--host <host>', 'API host', process.env.TNF_API_HOST || 'http://127.0.0.1:3001')
  .action(async (options: { status?: string; type?: string; json?: boolean; host?: string }) => {
    try {
      const host = options.host || process.env.TNF_API_HOST || 'http://127.0.0.1:3001';
      let url = `${host}/api/feedback`;
      const params = new URLSearchParams();
      if (options.status) params.set('status', options.status);
      if (options.type) params.set('type', options.type);
      if (params.toString()) url += `?${params.toString()}`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!resp.ok) {
        console.error(
          chalk.red(`Failed to connect to ${url} (HTTP ${resp.status}). Is backend running?`)
        );
        process.exit(1);
      }
      const allFeedback = (await resp.json()) as any[];
      if (options.json) {
        console.log(JSON.stringify(allFeedback, null, 2));
        return;
      }
      console.log(chalk.bold(`\n📬 Feedback (${allFeedback.length} items)\n`));
      for (const fb of allFeedback) {
        const icon =
          fb.status === 'new'
            ? '🆕'
            : fb.status === 'in_progress'
              ? '🔄'
              : fb.status === 'done'
                ? '✅'
                : '⏳';
        console.log(`   ${icon} ${chalk.cyan(fb.id)} [${fb.type}] ${fb.priority}`);
        console.log(
          chalk.dim(`      ${fb.message?.substring(0, 60)}${fb.message?.length > 60 ? '...' : ''}`)
        );
        console.log(chalk.dim(` Status: ${fb.status} | Created: ${fb.createdAt}\n`));
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// Feedback status
feedback
  .command('status')
  .description('Show feedback status summary')
  .option('--host <host>', 'API host', process.env.TNF_API_HOST || 'http://127.0.0.1:3001')
  .action(async (options: { host?: string }) => {
    try {
      const host = options.host || process.env.TNF_API_HOST || 'http://127.0.0.1:3001';
      const url = `${host}/api/feedback/stats`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!resp.ok) {
        console.error(
          chalk.red(`Failed to connect to ${url} (HTTP ${resp.status}). Is backend running?`)
        );
        process.exit(1);
      }
      const stats = (await resp.json()) as Record<string, any>;
      const byStatus = stats.byStatus || {};
      const byType = stats.byType || {};
      const byPriority = stats.byPriority || {};
      console.log(chalk.bold('\n📊 Feedback Summary\n'));
      console.log(chalk.cyan('By Status:'));
      console.log(
        ` 🆕 New: ${byStatus.new || 0} | 🔄 In Progress: ${byStatus.in_progress || 0} | ✅ Done: ${byStatus.done || 0}`
      );
      console.log(chalk.cyan('\nBy Type:'));
      console.log(
        ` 🐛 Bugs: ${byType.bug || 0} | ✨ Features: ${byType.feature || 0} | 🎨 UX: ${byType.ux || 0} | 📝 Other: ${byType.other || 0}`
      );
      console.log(chalk.cyan('\nBy Priority:'));
      console.log(
        ` 🔴 Critical: ${byPriority.critical || 0} | 🟠 High: ${byPriority.high || 0} | 🟡 Medium: ${byPriority.medium || 0} | 🟢 Low: ${byPriority.low || 0}`
      );
      console.log(chalk.dim(`\n   Total: ${stats.total || 0} items\n`));
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// Extension commands
const extensionCmd = program
  .command('extension')
  .description('Manage TNF extensions (Chrome, VSCode, Tauri)');

const EXTENSION_REGISTRY: Record<
  string,
  { id: string; name: string; type: string; description: string; appDir: string }
> = {
  chrome: {
    id: 'chrome',
    name: 'Fuse Connect (Chrome)',
    type: 'browser-extension',
    description:
      'Universal AI chat bridge — chat detection, federation channels, multi-node connectivity',
    appDir: 'apps/chrome-extension',
  },
  vscode: {
    id: 'vscode',
    name: 'The New Fuse (VSCode)',
    type: 'vscode-extension',
    description:
      'AI dev assistant with multi-provider LLM, A2A protocol, MCP integration & agent federation',
    appDir: 'apps/vscode-extension',
  },
  tauri: {
    id: 'tauri',
    name: 'The New Fuse (Tauri)',
    type: 'desktop-app',
    description: 'Native desktop app for TNF agent network',
    appDir: 'apps/tauri-desktop',
  },
};

function checkExtensionExists(appDir: string): boolean {
  return fs.existsSync(path.join(repoRoot, appDir));
}

function getExtensionVersion(appDir: string): string | null {
  const pkgPath = path.join(repoRoot, appDir, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version || null;
  } catch {
    return null;
  }
}

extensionCmd
  .command('list')
  .description('List available TNF extensions and their status')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const entries = Object.values(EXTENSION_REGISTRY);
      if (options.json) {
        console.log(
          JSON.stringify(
            entries.map((ext) => ({
              ...ext,
              installed: checkExtensionExists(ext.appDir),
              version: getExtensionVersion(ext.appDir),
            })),
            null,
            2
          )
        );
        return;
      }
      console.log(chalk.bold('\nTNF Extensions\n'));
      for (const ext of entries) {
        const installed = checkExtensionExists(ext.appDir);
        const version = getExtensionVersion(ext.appDir);
        const status = installed
          ? chalk.green(`installed${version ? ` v${version}` : ''}`)
          : chalk.dim('not found');
        console.log(` ${chalk.cyan(ext.id.padEnd(8))} ${ext.name.padEnd(30)} ${status}`);
        console.log(` ${''.padEnd(8)} ${chalk.dim(ext.description)}`);
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

extensionCmd
  .command('status')
  .description('Show detailed status for an extension')
  .argument('<extension>', 'Extension ID (chrome, vscode, tauri)')
  .action((extensionId: string) => {
    try {
      const ext = EXTENSION_REGISTRY[extensionId];
      if (!ext) {
        console.error(chalk.red(`Unknown extension: ${extensionId}`));
        console.log(chalk.dim(`Available: ${Object.keys(EXTENSION_REGISTRY).join(', ')}`));
        process.exit(1);
      }
      const installed = checkExtensionExists(ext.appDir);
      const version = getExtensionVersion(ext.appDir);
      const fullPath = path.join(repoRoot, ext.appDir);

      console.log(chalk.bold(`\n${ext.name}\n`));
      console.log(`  ID:          ${chalk.cyan(ext.id)}`);
      console.log(`  Type:        ${ext.type}`);
      console.log(`  Installed:   ${installed ? chalk.green('Yes') : chalk.red('No')}`);
      if (version) console.log(`  Version:     ${chalk.cyan(version)}`);
      console.log(`  Path:        ${chalk.dim(fullPath)}`);
      console.log(`  Description: ${ext.description}`);

      if (installed) {
        const pkgPath = path.join(fullPath, 'package.json');
        if (fs.existsSync(pkgPath)) {
          try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            if (pkg.scripts) {
              console.log(chalk.bold('\n  Available Scripts:\n'));
              for (const [name, cmd] of Object.entries(pkg.scripts)) {
                console.log(`    ${chalk.cyan(name.padEnd(20))} ${chalk.dim(cmd)}`);
              }
            }
            if (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) {
              console.log(chalk.bold('\n  Key Dependencies:\n'));
              const deps = Object.entries(pkg.dependencies);
              for (const [name, ver] of deps.slice(0, 10)) {
                console.log(`    ${chalk.cyan(name)} ${chalk.dim(ver)}`);
              }
              if (deps.length > 10) {
                console.log(`    ${chalk.dim(`... and ${deps.length - 10} more`)}`);
              }
            }
          } catch {}
        }
        const distExists = fs.existsSync(path.join(fullPath, 'dist'));
        console.log(chalk.bold('\n  Build Status:\n'));
        console.log(`    Built:  ${distExists ? chalk.green('Yes') : chalk.dim('No')}`);
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

extensionCmd
  .command('install')
  .description('Build and install an extension locally')
  .argument('<extension>', 'Extension ID (chrome, vscode, tauri)')
  .option('--watch', 'Watch for changes after build')
  .action(async (extensionId: string, options: { watch?: boolean }) => {
    try {
      const ext = EXTENSION_REGISTRY[extensionId];
      if (!ext) {
        console.error(chalk.red(`Unknown extension: ${extensionId}`));
        console.log(chalk.dim(`Available: ${Object.keys(EXTENSION_REGISTRY).join(', ')}`));
        process.exit(1);
      }
      const fullPath = path.join(repoRoot, ext.appDir);
      if (!checkExtensionExists(ext.appDir)) {
        console.error(chalk.red(`Extension source not found at ${fullPath}`));
        process.exit(1);
      }
      if (!fs.existsSync(path.join(fullPath, 'package.json'))) {
        console.error(chalk.red(`No package.json found at ${fullPath}`));
        process.exit(1);
      }

      console.log(chalk.bold(`\nBuilding ${ext.name}...\n`));

      if (extensionId === 'chrome') {
        const buildScript = path.join(fullPath, 'build-v7.sh');
        if (fs.existsSync(buildScript)) {
          await runCommand('bash', [buildScript], { cwd: fullPath });
        } else {
          await runCommand('pnpm', ['run', options.watch ? 'watch' : 'build'], { cwd: fullPath });
        }
      } else if (extensionId === 'vscode') {
        await runCommand('pnpm', ['run', options.watch ? 'watch' : 'compile'], { cwd: fullPath });
        if (!options.watch) {
          console.log(chalk.dim('\nTo install in VSCode:'));
          console.log(chalk.cyan(`  pnpm run package  (in ${fullPath})`));
          console.log(chalk.dim('  then: code --install-extension the-new-fuse-*.vsix'));
        }
      } else if (extensionId === 'tauri') {
        await runCommand('pnpm', ['run', 'build:deps'], { cwd: fullPath });
        await runCommand('pnpm', ['run', options.watch ? 'dev' : 'build'], { cwd: fullPath });
      } else {
        await runCommand('pnpm', ['run', options.watch ? 'watch' : 'build'], { cwd: fullPath });
      }

      console.log(chalk.green(`\n ${ext.name} built successfully\n`));
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const forefrontCommand = program
  .command('forefront')
  .description('Bring TNF to the operator forefront: harness, relay, local UI, browser control');

forefrontCommand
  .command('status')
  .description('Show latest forefront boot receipt')
  .action(() => {
    const receiptPath = path.join(repoRoot, '.agent/runtime-logs/forefront-boot.latest.json');
    if (!fs.existsSync(receiptPath)) {
      console.log(chalk.yellow('No forefront boot receipt found. Run: tnf forefront'));
      return;
    }
    const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
    console.log(chalk.bold.cyan('\n=== TNF Forefront Status ===\n'));
    console.log(JSON.stringify(receipt, null, 2));
    console.log('');
  });

forefrontCommand
  .option('--tauri', 'Launch native Tauri shell instead of web UI')
  .option('--skip-relay', 'Do not start relay-core in background')
  .option('--skip-onboard', 'Skip Turn Zero onboard preflight')
  .option('--skip-cursor', 'Skip Cursor harness onboard')
  .option('--no-open', 'Do not open browser automatically')
  .action(
    async (options: {
      tauri?: boolean;
      skipRelay?: boolean;
      skipOnboard?: boolean;
      skipCursor?: boolean;
      open?: boolean;
    }) => {
      try {
        const args = ['scripts/local-ui/tnf-forefront-boot.cjs'];
        if (options.tauri) args.push('--tauri');
        if (options.skipRelay) args.push('--skip-relay');
        if (options.skipOnboard) args.push('--skip-onboard');
        if (options.skipCursor) args.push('--skip-cursor');
        if (options.open === false) args.push('--no-open');
        await runCommand('node', args);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

program
  .command('browser-control')
  .description(
    'Serve standalone HTML browser control + federation node panel (no Chrome extension required for channels)'
  )
  .option('--skip-relay', 'Do not start relay-core in background')
  .option('--no-open', 'Do not open browser automatically')
  .action(async (options: { skipRelay?: boolean; open?: boolean }) => {
    try {
      const args = ['scripts/local-ui/serve-browser-control.cjs'];
      if (options.skipRelay) args.push('--skip-relay');
      if (options.open === false) args.push('--no-open');
      await runCommand('node', args);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('local-ui')
  .description('Boot TNF local UI (web shell or Tauri desktop) with harness + relay')
  .option('--tauri', 'Launch native Tauri desktop shell')
  .option('--skip-relay', 'Do not start relay-core in background')
  .option('--skip-onboard', 'Skip Turn Zero onboard preflight')
  .option('--build', 'Build production UI bundle instead of starting dev server')
  .action(
    async (options: {
      tauri?: boolean;
      skipRelay?: boolean;
      skipOnboard?: boolean;
      build?: boolean;
    }) => {
      try {
        if (options.build) {
          await runCommand('pnpm', ['run', 'tnf:local-ui:build']);
          return;
        }

        const args = [
          'scripts/local-ui/tnf-local-ui-boot.cjs',
          options.tauri ? '--tauri' : '--web',
        ];
        if (options.skipRelay) args.push('--skip-relay');
        if (options.skipOnboard) args.push('--skip-onboard');
        await runCommand('node', args);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

const packagesCommand = program
  .command('packages')
  .description('Monorepo package reconnect and availability utilities');

function printPackageProbeTable(results: PackageProbeResult[]): void {
  const headers = ['Package', 'Manifest', 'Entry', 'Resolved', 'Runtime', 'Dir'];
  const rows = results.map((result) => [
    result.packageName,
    result.hasMainField &&
    result.hasTypesField &&
    result.hasExportsField &&
    result.hasBuildScript &&
    result.hasTestScript
      ? 'OK'
      : 'WARN',
    result.mainEntryExists ? 'OK' : 'MISS',
    result.resolvedFromWorkspace ? 'OK' : 'MISS',
    result.loadAttempted ? (result.loadSucceeded ? 'OK' : 'FAIL') : 'SKIP',
    result.packageDir,
  ]);

  const widths = headers.map((header, idx) =>
    Math.max(header.length, ...rows.map((row) => row[idx].length))
  );

  const render = (cols: string[]) =>
    cols
      .map((col, idx) => col.padEnd(widths[idx], ' '))
      .join('  ')
      .trimEnd();

  console.log(render(headers));
  console.log(
    widths
      .map((width) => ''.padEnd(width, '-'))
      .join('  ')
      .trimEnd()
  );
  for (const row of rows) {
    const normalized = [...row];
    normalized[1] = row[1] === 'OK' ? chalk.green(row[1]) : chalk.yellow(row[1]);
    normalized[2] = row[2] === 'OK' ? chalk.green(row[2]) : chalk.yellow(row[2]);
    normalized[3] = row[3] === 'OK' ? chalk.green(row[3]) : chalk.yellow(row[3]);
    normalized[4] =
      row[4] === 'OK'
        ? chalk.green(row[4])
        : row[4] === 'FAIL'
          ? chalk.red(row[4])
          : chalk.dim(row[4]);
    console.log(render(normalized));
  }
}

packagesCommand
  .command('status')
  .description('Show reconnect status for all internal workspace packages')
  .option('--runtime', 'Attempt runtime loading for each package entrypoint')
  .option('--json', 'Output JSON instead of table')
  .action(async (options: { runtime?: boolean; json?: boolean }) => {
    try {
      const hub = new PackageReconnectHub(repoRoot);
      const results = await hub.probeAll({ loadRuntime: options.runtime });

      const summary = {
        generatedAt: new Date().toISOString(),
        repoRoot: hub.getRepoRoot(),
        packageCount: results.length,
        manifestReady: results.filter(
          (result) =>
            result.hasMainField &&
            result.hasTypesField &&
            result.hasExportsField &&
            result.hasBuildScript &&
            result.hasTestScript
        ).length,
        entryReady: results.filter((result) => result.mainEntryExists).length,
        resolved: results.filter((result) => result.resolvedFromWorkspace).length,
        runtimeLoadSucceeded: results.filter((result) => result.loadSucceeded).length,
        runtimeLoadAttempted: results.filter((result) => result.loadAttempted).length,
      };

      if (options.json) {
        console.log(JSON.stringify({ summary, results }, null, 2));
        return;
      }

      console.log(chalk.bold('\nTNF Package Reconnect Status\n'));
      console.log(`Repo: ${chalk.dim(summary.repoRoot)}`);
      console.log(
        `Packages=${summary.packageCount} manifest-ready=${summary.manifestReady} entry-ready=${summary.entryReady} resolved=${summary.resolved}`
      );
      if (options.runtime) {
        console.log(
          `Runtime load: success=${summary.runtimeLoadSucceeded}/${summary.runtimeLoadAttempted}`
        );
      }
      console.log('');
      printPackageProbeTable(results);

      const unresolved = results.filter((result) => !result.resolvedFromWorkspace);
      if (unresolved.length > 0) {
        console.log(chalk.yellow(`\nUnresolved packages: ${unresolved.length}`));
        for (const item of unresolved.slice(0, 20)) {
          console.log(`- ${item.packageName}`);
        }
        if (unresolved.length > 20) {
          console.log(chalk.dim(`... and ${unresolved.length - 20} more`));
        }
      }
      if (options.runtime) {
        const runtimeFailures = results.filter(
          (result) => result.loadAttempted && !result.loadSucceeded
        );
        if (runtimeFailures.length > 0) {
          console.log(chalk.yellow(`\nRuntime load failures: ${runtimeFailures.length}`));
          for (const item of runtimeFailures.slice(0, 20)) {
            console.log(`- ${item.packageName}: ${item.loadError || 'unknown error'}`);
          }
          if (runtimeFailures.length > 20) {
            console.log(chalk.dim(`... and ${runtimeFailures.length - 20} more`));
          }
        }
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

packagesCommand
  .command('probe')
  .description('Probe a single package reconnect status by package name')
  .argument('<packageName>', 'Workspace package name (e.g. @the-new-fuse/fairtable-core)')
  .option('--runtime', 'Attempt runtime loading for the package entrypoint')
  .option('--json', 'Output JSON')
  .action(async (packageName: string, options: { runtime?: boolean; json?: boolean }) => {
    try {
      const hub = new PackageReconnectHub(repoRoot);
      const result = await hub.probePackage(packageName, { loadRuntime: options.runtime });

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      console.log(chalk.bold(`\nPackage Probe: ${result.packageName}\n`));
      console.log(`Dir:         ${chalk.cyan(result.packageDir)}`);
      console.log(`Main field:  ${result.hasMainField ? chalk.green('yes') : chalk.red('no')}`);
      console.log(`Types field: ${result.hasTypesField ? chalk.green('yes') : chalk.red('no')}`);
      console.log(`Exports:     ${result.hasExportsField ? chalk.green('yes') : chalk.red('no')}`);
      console.log(`Build script:${result.hasBuildScript ? chalk.green(' yes') : chalk.red(' no')}`);
      console.log(`Test script: ${result.hasTestScript ? chalk.green('yes') : chalk.red('no')}`);
      console.log(`Entry path:  ${result.mainEntryPath || chalk.dim('none')}`);
      console.log(
        `Entry exists:${result.mainEntryExists ? chalk.green(' yes') : chalk.red(' no')}`
      );
      console.log(
        `Resolved:    ${result.resolvedFromWorkspace ? chalk.green(result.resolvedPath || 'yes') : chalk.yellow('no')}`
      );
      if (options.runtime) {
        console.log(
          `Runtime:     ${
            result.loadAttempted
              ? result.loadSucceeded
                ? chalk.green(`loaded (${result.loadMode})`)
                : chalk.red(`failed (${result.loadMode})`)
              : chalk.dim('not attempted')
          }`
        );
        if (result.loadError) {
          console.log(`Load error:  ${chalk.yellow(result.loadError)}`);
        }
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const notesCommand = program.command('notes').description('TNF note-taking workspace commands');

function createNotesService(options: { vaultPath?: string; userId?: string }): NoteService {
  return new NoteService({
    vaultPath: options.vaultPath,
    userId: options.userId,
  });
}

function parseCsvTags(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

function parsePositiveIntOption(raw: string | undefined, fallback: number, label: string): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${label}: ${raw}`);
  }
  return parsed;
}

notesCommand
  .command('status')
  .description('Show TNF note vault status')
  .option('--vault-path <path>', 'Base vault path (default: ~/.tnf/vault)')
  .option('--user-id <id>', 'Vault user id (default: OS user)')
  .option('--json', 'Output JSON')
  .action(async (options: { vaultPath?: string; userId?: string; json?: boolean }) => {
    try {
      const service = createNotesService(options);
      const status = await service.getStatus();
      if (options.json) {
        console.log(JSON.stringify(status, null, 2));
        return;
      }
      console.log(chalk.bold('\nTNF Notes Status\n'));
      console.log(`Vault path: ${chalk.cyan(status.vaultPath)}`);
      console.log(`Notes:      ${status.noteCount}`);
      console.log(`Tags:       ${status.tagCount}`);
      console.log(`Total size: ${status.totalSize} bytes`);
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

notesCommand
  .command('list')
  .description('List notes')
  .option('--tag <tag>', 'Filter by tag')
  .option('--limit <n>', 'Limit results (default: 50)')
  .option('--vault-path <path>', 'Base vault path (default: ~/.tnf/vault)')
  .option('--user-id <id>', 'Vault user id (default: OS user)')
  .option('--json', 'Output JSON')
  .action(
    (options: {
      tag?: string;
      limit?: string;
      vaultPath?: string;
      userId?: string;
      json?: boolean;
    }) => {
      try {
        const service = createNotesService(options);
        const limit = parsePositiveIntOption(options.limit, 50, '--limit');
        const notes = options.tag ? service.getNotesByTag(options.tag) : service.getAllNotes();
        const sorted = [...notes]
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, limit);

        if (options.json) {
          console.log(JSON.stringify(sorted, null, 2));
          return;
        }

        console.log(chalk.bold(`\nTNF Notes (${sorted.length}/${notes.length})\n`));
        for (const note of sorted) {
          const tags = note.tags?.length ? ` [${note.tags.join(', ')}]` : '';
          console.log(`- ${chalk.cyan(note.id)}  ${note.title}${chalk.dim(tags)}`);
        }
        console.log('');
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

notesCommand
  .command('get')
  .description('Get a note by id or exact title')
  .argument('<idOrTitle>', 'Note id or exact note title')
  .option('--vault-path <path>', 'Base vault path (default: ~/.tnf/vault)')
  .option('--user-id <id>', 'Vault user id (default: OS user)')
  .option('--json', 'Output JSON')
  .action((idOrTitle: string, options: { vaultPath?: string; userId?: string; json?: boolean }) => {
    try {
      const service = createNotesService(options);
      const note = service.getNoteById(idOrTitle) || service.getNoteByTitle(idOrTitle);
      if (!note) {
        throw new Error(`Note not found: ${idOrTitle}`);
      }

      if (options.json) {
        console.log(JSON.stringify(note, null, 2));
        return;
      }

      console.log(chalk.bold(`\n${note.title}\n`));
      console.log(chalk.dim(`id=${note.id} updated=${note.updatedAt}`));
      if (note.tags?.length) {
        console.log(chalk.dim(`tags=${note.tags.join(', ')}`));
      }
      console.log('');
      console.log(note.content);
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

notesCommand
  .command('search')
  .description('Search notes by title and content')
  .argument('<query>', 'Search query')
  .option('--limit <n>', 'Limit results (default: 20)')
  .option('--vault-path <path>', 'Base vault path (default: ~/.tnf/vault)')
  .option('--user-id <id>', 'Vault user id (default: OS user)')
  .option('--json', 'Output JSON')
  .action(
    (
      query: string,
      options: { limit?: string; vaultPath?: string; userId?: string; json?: boolean }
    ) => {
      try {
        const service = createNotesService(options);
        const limit = parsePositiveIntOption(options.limit, 20, '--limit');
        const results = service.searchNotes(query, limit);

        if (options.json) {
          console.log(JSON.stringify(results, null, 2));
          return;
        }

        console.log(chalk.bold(`\nSearch Results (${results.length})\n`));
        for (const note of results) {
          console.log(`- ${chalk.cyan(note.id)}  ${note.title}`);
          if (note.snippet) {
            console.log(`  ${chalk.dim(note.snippet)}`);
          }
        }
        console.log('');
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

notesCommand
  .command('create')
  .description('Create a new note')
  .argument('<title>', 'Note title')
  .argument('[content]', 'Optional note content')
  .option('--id <id>', 'Optional explicit note id')
  .option('--tags <csv>', 'Comma-separated tags')
  .option('--vault-path <path>', 'Base vault path (default: ~/.tnf/vault)')
  .option('--user-id <id>', 'Vault user id (default: OS user)')
  .option('--json', 'Output JSON')
  .action(
    async (
      title: string,
      content: string | undefined,
      options: {
        id?: string;
        tags?: string;
        vaultPath?: string;
        userId?: string;
        json?: boolean;
      }
    ) => {
      try {
        const service = createNotesService(options);
        const result = await service.createNote({
          id: options.id,
          title,
          content: content || '',
          tags: parseCsvTags(options.tags),
        });
        if (!result.success) {
          throw new Error(result.error || 'Failed to create note');
        }

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        console.log(chalk.green(`Created note ${result.id}`));
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

notesCommand
  .command('daily')
  .description('Create a daily note')
  .argument('[templateName]', 'Optional template name (looks for note titled "Template: <name>")')
  .option('--vault-path <path>', 'Base vault path (default: ~/.tnf/vault)')
  .option('--user-id <id>', 'Vault user id (default: OS user)')
  .option('--json', 'Output JSON')
  .action(
    async (
      templateName: string | undefined,
      options: { vaultPath?: string; userId?: string; json?: boolean }
    ) => {
      try {
        const service = createNotesService(options);
        const result = await service.createDailyNote(templateName);
        if (!result.success) {
          throw new Error(result.error || 'Failed to create daily note');
        }
        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }
        console.log(chalk.green(`Created daily note ${result.id}`));
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

const toolsCommand = program.command('tools').description('Tools and toolset management');
toolsCommand
  .command('list')
  .description('List all discovered tools/toolsets')
  .action(async () => {
    const service = new ToolsService();
    const toolsets = await service.getToolsets();
    console.log(chalk.bold('\nDiscovered Tools/Toolsets:\n'));
    for (const tool of toolsets) {
      console.log(
        `- ${tool.enabled ? chalk.green('[ON]') : chalk.red('[OFF]')} ${chalk.cyan(tool.name)}: ${tool.description} (${tool.source || 'builtin'})`
      );
    }
  });

const pluginsCommand = program.command('plugins').description('Plugins and skills management');
pluginsCommand
  .command('list')
  .description('List all installed plugins/skills')
  .action(async () => {
    const service = new PluginsService();
    const plugins = await service.list();
    console.log(chalk.bold('\nInstalled Plugins & Skills:\n'));
    for (const plugin of plugins) {
      console.log(
        `- ${chalk.cyan(plugin.name)} (v${plugin.version}): ${plugin.description} [${plugin.category}]`
      );
    }
  });

const cronCommand = program.command('cron').description('Cron and scheduled tasks management');
cronCommand
  .command('list')
  .description('List all scheduled jobs')
  .action(async () => {
    const service = new CronService();
    const jobs = await service.list();
    console.log(chalk.bold('\nScheduled Cron Jobs:\n'));
    for (const job of jobs) {
      console.log(
        `- ${job.enabled ? chalk.green('[ON]') : chalk.red('[OFF]')} ${chalk.cyan(job.name)} (${job.schedule}) -> ${job.command}`
      );
    }
  });

registerAssimilateCommand(program, repoRoot);
registerTelegramStartCommand(program, repoRoot);
registerTelegramStopCommand(program, repoRoot);
registerTelegramStatusCommand(program, repoRoot);
registerTelegramSendCommand(program, repoRoot);
registerAgentsClassifyCommand(program, repoRoot);
registerRefreshContextCommand(program, repoRoot);

const webhookCommand = program.command('webhook').description('Webhook management');
webhookCommand
  .command('list')
  .description('List all configured webhooks')
  .action(async () => {
    const service = new WebhookService();
    const webhooks = await service.list();
    console.log(chalk.bold('\nConfigured Webhooks:\n'));
    for (const webhook of webhooks) {
      console.log(
        `- ${webhook.active ? chalk.green('[ON]') : chalk.red('[OFF]')} ${chalk.cyan(webhook.event)}: ${webhook.url}`
      );
    }
  });

const kanbanCommand = program.command('kanban').description('Kanban board operations');
kanbanCommand
  .command('status')
  .description('Show kanban board status')
  .action(async () => {
    const service = new KanbanService();
    const boards = await service.listBoards();
    console.log(chalk.bold('\nKanban Boards:\n'));
    for (const board of boards) {
      console.log(`- ${chalk.cyan(board.name)}: ${board.columns.length} columns`);
    }
  });

const memoryCommand = program.command('memory').description('Memory provider management');
memoryCommand
  .command('list')
  .description('List all configured memory providers')
  .action(async () => {
    const service = new MemoryProviderService();
    const providers = await service.getProviders();
    console.log(chalk.bold('\nMemory Providers:\n'));
    for (const provider of providers) {
      console.log(
        `- ${provider.enabled ? chalk.green('[ON]') : chalk.red('[OFF]')} ${chalk.cyan(provider.name)} [${provider.type}]`
      );
    }
  });

async function loadTnfSystemPrompt(): Promise<string> {
  const promptPath = path.join(repoRoot, '.agent/SYSTEM_PROMPT.md');
  const fallbackPrompt =
    'You are the TNF Orchestrator — the central agent at the heart of The New Fuse network. You coordinate sub-agents, maintain system health, and drive the network forward.';
  let basePrompt = fallbackPrompt;
  try {
    if (fs.existsSync(promptPath)) {
      basePrompt = fs.readFileSync(promptPath, 'utf8');
    }
  } catch {}

  return `${basePrompt.trim()}\n\n${loadTnfInteractiveContextPack()}`;
}

function readTextFileIfPresent(relativePath: string, maxChars = 1600): string | null {
  const absolutePath = path.join(repoRoot, relativePath);
  try {
    if (!fs.existsSync(absolutePath)) return null;
    return fs.readFileSync(absolutePath, 'utf8').slice(0, maxChars).trim();
  } catch {
    return null;
  }
}

function readJsonFileIfPresent(relativePath: string): any | null {
  const text = readTextFileIfPresent(relativePath, 12000);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function readAbsoluteJsonFileIfPresent(absolutePath: string): any | null {
  const text = readAbsoluteTextFileIfPresent(absolutePath, 12000);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getHomeHandoffPath(): string {
  return path.join(os.homedir(), '.tnf', 'handoff-current.json');
}

function getHandoffDivergence(repoHandoff: any, homeHandoff: any): string | null {
  if (!repoHandoff || !homeHandoff) return null;
  const repoCreated = Date.parse(repoHandoff.created_at || repoHandoff.generatedAt || '');
  const homeCreated = Date.parse(homeHandoff.created_at || homeHandoff.generatedAt || '');
  if (
    repoHandoff.handoff_id &&
    homeHandoff.handoff_id &&
    repoHandoff.handoff_id !== homeHandoff.handoff_id
  ) {
    return homeCreated > repoCreated
      ? 'local-home-newer-than-repo'
      : 'repo-and-home-handoff-id-differ';
  }
  if (Number.isFinite(repoCreated) && Number.isFinite(homeCreated) && homeCreated > repoCreated) {
    return 'local-home-newer-than-repo';
  }
  return null;
}

function summarizeHandoffPacket(handoff: any, source: string): string {
  if (!handoff) return `- ${source}: unavailable`;
  const nextActions = Array.isArray(handoff.next_actions)
    ? handoff.next_actions.length
    : Array.isArray(handoff.immediate_tasks)
      ? handoff.immediate_tasks.length
      : 0;
  const batch = handoff.batch || handoff.phase7?.batch || handoff.current_batch;
  const batchSummary = batch
    ? `\n- ${source} batch: ${batch.batchId || batch.id || 'unknown'} state=${batch.state || 'unknown'} size=${batch.size ?? batch.records?.length ?? 'unknown'}`
    : '';
  return (
    [
      `- ${source}: ${handoff.handoff_id || handoff.session || handoff.session_id || 'unknown'}`,
      `- ${source} created_at: ${handoff.created_at || handoff.generatedAt || handoff.updated || 'unknown'}`,
      `- ${source} priority: ${handoff?.continuation?.priority || handoff.priority || 'unknown'}`,
      `- ${source} next actions: ${nextActions}`,
    ].join('\n') + batchSummary
  );
}

function loadTnfInteractiveContextPack(): string {
  const handoff = readJsonFileIfPresent('docs/protocols/reports/SESSION_HANDOFF_LATEST.json');
  const homeHandoff = readAbsoluteJsonFileIfPresent(getHomeHandoffPath());
  const livingState = readTextFileIfPresent('docs/protocols/LIVING_STATE.md', 1200);
  const ledger = readTextFileIfPresent('docs/protocols/AGENT_STATUS_LEDGER.md', 900);
  const runtimeState = readJsonFileIfPresent('.agent/runtime-state.json');
  const repoMemory = readTextFileIfPresent('MEMORY.md', 900);
  const homeMemory = readAbsoluteTextFileIfPresent(
    path.join(os.homedir(), '.tnf', 'MEMORY.md'),
    900
  );
  const mcpServerNames = getMcpServerNames(runtimeState);
  const handoffDivergence = getHandoffDivergence(handoff, homeHandoff);
  const handoffSummary = [
    summarizeHandoffPacket(handoff, 'repo handoff'),
    summarizeHandoffPacket(homeHandoff, 'home handoff'),
    handoffDivergence
      ? `- Handoff divergence: ${handoffDivergence}`
      : '- Handoff divergence: none detected',
  ].join('\n');

  const runtimeSummary = runtimeState
    ? `- Runtime state: ${countRuntimeField(runtimeState.agents, runtimeState.agentCount ?? runtimeState.counts?.agents)} agents, ${countRuntimeField(runtimeState.llmModels || runtimeState.models, runtimeState.modelCount ?? runtimeState.counts?.llmModels)} models, ${countRuntimeField(runtimeState.mcpServers || runtimeState.mcps, runtimeState.mcpCount ?? runtimeState.counts?.mcpServers)} MCPs`
    : '- Runtime state: unavailable or not JSON';

  return [
    '# TNF Interactive Runtime Context',
    '',
    `- Canonical workspace root: ${repoRoot}`,
    `- Invocation cwd before TNF root anchoring: ${invocationCwd}`,
    '- All relative Turn Zero paths resolve from the canonical workspace root, not the shell directory where the operator typed `tnf`.',
    '- Before claiming a startup file is missing, check the absolute path under the canonical workspace root.',
    '- If asked why `tnf boot` and `tnf` differ: `tnf boot` prepares services; the interactive agent is the attached operator lane. In interactive terminals, boot should attach unless disabled.',
    '',
    '## Canonical Turn Zero Files',
    '',
    `- ${path.join(repoRoot, 'docs/protocols/TURN_ZERO_MANDATE.md')}: ${fs.existsSync(path.join(repoRoot, 'docs/protocols/TURN_ZERO_MANDATE.md')) ? 'present' : 'missing'}`,
    `- ${path.join(repoRoot, 'docs/protocols/LIVING_STATE.md')}: ${fs.existsSync(path.join(repoRoot, 'docs/protocols/LIVING_STATE.md')) ? 'present' : 'missing'}`,
    `- ${path.join(repoRoot, 'docs/protocols/AGENT_STATUS_LEDGER.md')}: ${fs.existsSync(path.join(repoRoot, 'docs/protocols/AGENT_STATUS_LEDGER.md')) ? 'present' : 'missing'}`,
    `- ${path.join(repoRoot, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json')}: ${fs.existsSync(path.join(repoRoot, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json')) ? 'present' : 'missing'}`,
    '',
    '## Current Handoff',
    '',
    handoffSummary,
    '',
    '## Runtime Snapshot',
    '',
    runtimeSummary,
    `- MCP server names: ${mcpServerNames.length ? mcpServerNames.join(', ') : 'unavailable'}`,
    '',
    '## Living State Excerpt',
    '',
    livingState || 'Unavailable.',
    '',
    '## Ledger Excerpt',
    '',
    ledger || 'Unavailable.',
    '',
    '## Memory Excerpts',
    '',
    repoMemory ? `### Repo MEMORY.md\n${repoMemory}` : '### Repo MEMORY.md\nUnavailable.',
    '',
    homeMemory ? `### ~/.tnf/MEMORY.md\n${homeMemory}` : '### ~/.tnf/MEMORY.md\nUnavailable.',
  ].join('\n');
}

function readAbsoluteTextFileIfPresent(absolutePath: string, maxChars = 1600): string | null {
  try {
    if (!fs.existsSync(absolutePath)) return null;
    return fs.readFileSync(absolutePath, 'utf8').slice(0, maxChars).trim();
  } catch {
    return null;
  }
}

function countRuntimeField(value: any, fallback: any): string {
  if (Array.isArray(value)) return String(value.length);
  if (value && typeof value === 'object') return String(Object.keys(value).length);
  if (typeof value === 'number' || typeof value === 'string') return String(value);
  if (typeof fallback === 'number' || typeof fallback === 'string') return String(fallback);
  return 'unknown';
}

function getMcpServerNames(runtimeState: any): string[] {
  const fromRuntime = runtimeState?.mcpServers || runtimeState?.mcps;
  if (Array.isArray(fromRuntime)) {
    return fromRuntime
      .map((entry) => String(entry?.name || entry))
      .filter(Boolean)
      .slice(0, 20);
  }
  if (fromRuntime && typeof fromRuntime === 'object') {
    return Object.keys(fromRuntime).slice(0, 20);
  }

  try {
    return MCPManagerService.loadRepoServers(repoRoot)
      .map((server) => server.name)
      .filter(Boolean)
      .slice(0, 20);
  } catch {
    return [];
  }
}

async function startInteractiveAgent(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer: createSlashCompleter(repoRoot),
  });
  const slashDropdown = attachSlashCommandDropdown(rl, repoRoot);
  let rlClosed = false;
  rl.on('close', () => {
    rlClosed = true;
  });

  const systemPrompt = await loadTnfSystemPrompt();

  const { LLMClient } = await import('./utils/llm-client.js');
  const client = await LLMClient.create('orchestrator');

  const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

  console.log('');
  console.log(chalk.cyan('╔══════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║') + chalk.bold(' TNF Agent — Interactive Session ') + chalk.cyan(' ║'));
  console.log(
    chalk.cyan('║') +
      chalk.dim(' Provider: ') +
      chalk.white(client.providerName || 'unknown') +
      chalk.cyan(' ║')
  );
  console.log(
    chalk.cyan('║') + chalk.dim(' Model: ') + chalk.white(client.model) + chalk.cyan(' ║')
  );
  const catalog = client.getProviderCatalog?.() || [];
  const availableCount = catalog.filter((p: any) => p.hasKey).length;
  console.log(
    chalk.cyan('║') +
      chalk.dim(' Fallbacks: ') +
      chalk.white(`${availableCount} providers available`) +
      chalk.cyan(' ║')
  );
  console.log(chalk.cyan('╚══════════════════════════════════════════════╝'));
  console.log(chalk.dim(' Type /help for commands, /exit to quit, /clear to clear history\n'));

  // Start heartbeat to keep session alive
  const heartbeatInterval = setInterval(async () => {
    try {
      // Simple heartbeat via terminal pulse script
      const pulseScript = path.join(
        process.env.HOME || '/tmp',
        '.tnf/bin/terminal-heartbeat-pulse.cjs'
      );
      if (fs.existsSync(pulseScript)) {
        await runCommand('node', [pulseScript]);
      }
    } catch {
      // Silent fail - heartbeat is best-effort
    }
  }, 30000);

  // Self-prompting: inject fresh context every 5 minutes
  const contextRefreshInterval = setInterval(async () => {
    try {
      // Read living state and handoff for fresh context
      const handoffPath = path.join(repoRoot, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json');
      if (fs.existsSync(handoffPath)) {
        const handoff = JSON.parse(fs.readFileSync(handoffPath, 'utf8'));
        if (handoff.next_actions?.length > 0) {
          const autoPrompt = `\n[Auto-Context Refresh] Current pending actions from handoff:\n${JSON.stringify(handoff.next_actions, null, 2)}\n\nContinue autonomous execution toward these goals.`;
          messages.push({ role: 'system', content: autoPrompt });
        }
      }
    } catch {
      // Silent fail - context refresh is best-effort
    }
  }, 300000);

  const ask = (prompt: string): Promise<string> =>
    new Promise((resolve, reject) => {
      if (rlClosed) return reject(new Error('stdin closed'));

      const timeoutSec = parseInt(process.env.TNF_STALL_DEFENSE_TIMEOUT || '0', 10);

      if (timeoutSec > 0) {
        const ac = new AbortController();
        let answered = false;

        const timer = setTimeout(() => {
          if (answered) return;
          answered = true;
          ac.abort();
          console.log(chalk.yellow('\n⏳ Stall timeout reached. Self-prompting to continue...'));
          resolve(
            process.env.TNF_STALL_DEFENSE_PROMPT ||
              'Continue autonomous execution. Follow your overarching directive.'
          );
        }, timeoutSec * 1000);

        (rl as any).question(prompt, { signal: ac.signal }, (answer: string) => {
          if (answered) return;
          answered = true;
          clearTimeout(timer);
          resolve(answer);
        });
      } else {
        rl.question(prompt, resolve);
      }
    });

  while (true) {
    let input: string;
    try {
      input = resolveSlashDropdownInput(await ask(chalk.green('\n❯ ')), slashDropdown);
    } catch {
      break;
    }
    const trimmed = input.trim();

    if (trimmed === '.exit' || trimmed === '.quit') break;
    if (trimmed === '.clear') {
      messages.length = 1;
      console.log(chalk.dim('  History cleared'));
      continue;
    }
    if (trimmed === '.help') {
      printSlashCommandList();
      continue;
    }
    if (!trimmed) continue;

    let outbound = trimmed;
    const slashOutcome = await handleInteractiveSlashCommand(trimmed, {
      messages,
      systemMessageCount: 1,
      client,
    });
    if (slashOutcome.handled) {
      if (slashOutcome.exit) break;
      if (!slashOutcome.prompt) continue;
      outbound = slashOutcome.prompt;
    }

    messages.push({ role: 'user', content: outbound });

    try {
      const response = await client.chatComplete(messages, { temperature: 0.7 });
      console.log(chalk.cyan('\n  ' + response.replace(/\n/g, '\n  ')));
      messages.push({ role: 'assistant', content: response });
    } catch (err: any) {
      console.error(chalk.red('\n  Error: ' + err.message));
    }
  }

  // Cleanup heartbeat and context refresh
  clearInterval(heartbeatInterval);
  clearInterval(contextRefreshInterval);

  rl.close();
  console.log(chalk.cyan('\n  TNF Agent session ended.\n'));
}

async function startTuiAgent(): Promise<void> {
  console.clear();
  await renderSplash({ compact: true, animate: false });
  console.log('');
  console.log(chalk.bold.cyan('  ⚡ TNF TUI Agent — Always-on LLM session'));
  console.log(chalk.dim('  ─────────────────────────────────────────────'));
  await startInteractiveAgent();
}

async function startGatewayService(): Promise<void> {
  console.log(chalk.bold.cyan('\n  🔷 Starting TNF Gateway Service\n'));

  const { LLMClient } = await import('./utils/llm-client.js');
  const client = await LLMClient.create('orchestrator');

  console.log(chalk.dim(`  Provider: ${client.baseUrl}`));
  console.log(chalk.dim(`  Model:    ${client.model}`));

  const relayDir = path.join(repoRoot, 'packages/relay-core');
  const relayEntry = path.join(relayDir, 'dist', 'standalone-relay.js');

  if (fs.existsSync(relayEntry)) {
    console.log(chalk.dim('  Starting relay gateway on ws://localhost:3000/ws\n'));
    await runCommand('node', [relayEntry], { cwd: relayDir });
  } else {
    const runRelayScript = path.join(relayDir, 'scripts', 'run-relay.cjs');
    if (fs.existsSync(runRelayScript)) {
      await runCommand('node', [runRelayScript], { cwd: relayDir });
    } else {
      console.log(chalk.yellow('  Relay not built. Running factory boot instead.\n'));
      const gatewayScript = path.join(repoRoot, 'scripts/orchestrator/factory-boot.sh');
      if (fs.existsSync(gatewayScript)) {
        await runCommand('bash', [gatewayScript], {
          env: { FACTORY_BOOT_REDIS_FAIL_OPEN: 'true' },
        });
      }
      console.log(chalk.green('\n  ✅ Gateway services started. Waiting...\n'));
      await new Promise<void>((resolve) => {
        const shutdown = () => {
          console.log(chalk.cyan('\n  Gateway shutting down...\n'));
          resolve();
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
      });
    }
  }

  console.log(chalk.cyan('\n  Gateway service stopped.\n'));
}

function normalizeEntrypointArgv(argv: string[]): string[] {
  if (argv[2] !== '--') return argv;
  return [argv[0], argv[1], ...argv.slice(3)];
}

async function main(): Promise<void> {
  const argv = normalizeEntrypointArgv(process.argv);

  const interceptor = new ProtocolInterceptor(repoRoot);
  await interceptor.runPreFlightChecks();

  if (argv.length <= 2) {
    await ensureTurnZeroForAgentEntrypoint();
    await startInteractiveAgent();
    return;
  }
  if (argv[2]?.startsWith('/')) {
    await handleOneShotSlashInput(argv.slice(2).join(' '));
    return;
  }
  if (isOpenClawPassthroughArgv(argv)) {
    await runPassthrough('openclaw', argv.slice(3));
    return;
  }
  if (isHermesPassthroughArgv(argv)) {
    await runPassthrough('hermes', argv.slice(3));
    return;
  }
  if (isGeminiPassthroughArgv(argv)) {
    await runPassthrough('gemini', argv.slice(3));
    return;
  }
  if (isCursorPassthroughArgv(argv)) {
    await runPassthrough('cursor', argv.slice(3));
    return;
  }
  const implicitArgs = resolveImplicitPassthroughArgs(argv);
  if (implicitArgs) {
    await runPassthrough(implicitArgs.cliName, implicitArgs.args);
    return;
  }
  await program.parseAsync(argv);
}

main().catch((err: Error) => {
  console.error(chalk.red(`Error: ${err.message}`));
  process.exit(1);
});
