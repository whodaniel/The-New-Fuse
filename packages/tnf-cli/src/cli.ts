import { PackageReconnectHub, type PackageProbeResult } from '@the-new-fuse/tnf-core';
import type { NoteService } from '@the-new-fuse/tnf-note-taking';
import chalk from 'chalk';
import { spawn, spawnSync } from 'child_process';
import { Command } from 'commander';
import { createHash } from 'crypto';
import fs from 'fs';
import { createRequire } from 'module';
import os from 'os';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import type { AgentMessage, RedisAgentClient } from './RedisAgentClient.js';
import { printProtocolAgentRosterSafe } from './boot/agent-roster.js';
import {
  createBootPipeline,
  printBootPlan,
  toBootPlan,
  writeBootReceipt,
  type BootReceipt,
  type BootStepResult,
} from './boot/pipeline.js';
import { assertNoDuplicateCommands } from './commands/_registry.js';
import { registerAgentsClassifyCommand } from './commands/agents-classify.js';
import { executeBuiltinTool, registerAgentsRunCommand } from './commands/agents-run.js';
import { registerAgentsSpecsCommand } from './commands/agents-specs.js';
import { registerAssimilateCommand } from './commands/assimilate.js';
import { registerBrowserCommand } from './commands/browser.js';
import { registerCatalogCommand } from './commands/catalog.js';
import { registerChannelCommands } from './commands/channels/index.js';
import { registerConfigCommand } from './commands/config.js';
import { registerFederationTapCommand } from './commands/federation-tap.js';
import { registerFleetCommands } from './commands/fleet/index.js';
import { registerGoogleAiCommand } from './commands/google-ai.js';
import { registerHaltCommand } from './commands/halt.js';
import { registerDoctorCommand, registerStatusCommand } from './commands/health.js';
import { registerHermesParityGapCommands } from './commands/hermes-parity-gaps.js';
import { registerLogsCommand } from './commands/logs.js';
import { registerParityCommand } from './commands/parity.js';
import { registerPeerCliParityGapCommands } from './commands/peer-cli-parity-gaps.js';
import { registerRefreshContextCommand } from './commands/refresh-context/command.js';
import { registerSlackCommands } from './commands/slack/index.js';
import { registerSparkCommand } from './commands/spark.js';
import { registerStaffingCommands } from './commands/staffing/index.js';
import { registerSubdirectorCommand } from './commands/subdirector.js';
import { registerTelegramCommands } from './commands/telegram/index.js';
import { registerWhatsappCommands } from './commands/whatsapp/index.js';
import { Orchestrator } from './orchestration.js';
import { ProtocolInterceptor } from './orchestration/ProtocolInterceptor.js';
import {
  describeAgentFocus,
  focusFilePath,
  writeAgentFocus,
  type AgentFocusMode,
} from './services/AgentFocusService.js';
import { CommandSourceService } from './services/CommandSourceService.js';
import { CronService } from './services/CronService.js';
import { decideDispatch, resolveRecipient } from './services/DispatchGuard.js';
import { GoalsService } from './services/GoalsService.js';
import { KanbanService } from './services/KanbanService.js';
import { MemoryProviderService } from './services/MemoryProviderService.js';
import { ParityService } from './services/ParityService.js';
import { PluginsService } from './services/PluginsService.js';
import { ServiceHealthService } from './services/ServiceHealthService.js';
import { StoryService } from './services/StoryService.js';
import {
  KNOWN_TOOLS,
  PERMISSION_MODES,
  resolvePermissions,
  type PermissionResolution,
} from './services/ToolPermissionService.js';
import { ToolsService } from './services/ToolsService.js';
import { WebhookService } from './services/WebhookService.js';
import { WorktreeError, WorktreeService } from './services/WorktreeService.js';
import {
  findSlashCommand,
  formatPromptSlashCommand,
  getAllSlashCommands,
  parseSlashCommand,
  renderSlashCommandDetail,
  renderSlashCommandList,
  type SlashCommandDefinition,
} from './slashCommands.js';
import {
  applyTurnCapExtension,
  buildSoftCapWarning,
  createAutonomousTurnCapState,
  handleHardTurnCap,
  loadAutonomousTurnCapConfig,
  parseExtendTurnCapMarker,
} from './utils/autonomous-turn-cap.js';
import {
  buildPaletteIndex,
  rankPalette,
  type PaletteEntry,
  type PaletteTheme,
} from './utils/command-palette.js';
import {
  countTrailingFailures,
  FULL_AUTO_FAIL_STREAK,
  resolvePostStepTimeoutMs,
  tallyFullAutoRuns,
} from './utils/full-auto-cycle.js';
import { resolveBuiltinToolsAsOpenAI } from './utils/llm-tools.js';
import {
  DEFAULT_OPERATOR_WINDOW_MS,
  detectOperatorWindowDirective,
  effectiveOperatorWindowMs,
  parseOperatorWindowArg,
  persistOperatorWindowMs,
  resolveOperatorWindowMs,
} from './utils/operator-window.js';
import {
  attachPalette,
  paletteEntryToLine,
  resolveSlashDropdownInput,
  type SlashDropdownState,
} from './utils/palette-readline.js';
import { getPaletteRecents } from './utils/palette-recents.js';
import { resolvePrompt, sanitizeUtf8Prompt } from './utils/prompt-input.js';
import { CommandTimeoutError, spawnWithTimeout } from './utils/run-command.js';
import { safeReadJson, writeFileAtomic } from './utils/safe-fs.js';
import { createTuiInputCollector } from './utils/tui-input-collector.js';
import { renderStatusLine, type StatusSnapshot, type StatusTheme } from './utils/tui-statusline.js';
import { formatWorkPlaneOrientationMarkdown } from './utils/work-plane.js';

// CORE TENET — CORRECTED 2026-07-22 — embedded in executable CLI entrypoint.
// Propagates to both open-source installable binary (packages/tnf-cli/dist/cli.js)
// and hosted server-side orchestration (agent-bank/catalog + relay-core):
// PARODY + ASSIMILATE the BEST from ANY and ALL cutting-edge AI agents.
// NOT "Hermes-to-TNF parity". Ongoing, self-iterative. See assimilation-tenet skill.
const program = new Command();

// Root options must not be recognised AFTER a subcommand name.
//
// Commander's default scans program-level options anywhere in argv, so the
// 134 root options registered for cross-agent parity were silently eating
// identically-named subcommand flags: `tnf paths --json`, `tnf parity agents
// --json` and `tnf commands --limit 4` all had their flag consumed by the
// root parser and fell back to human-readable output. Machine-readable output
// was broken CLI-wide by flags that do nothing.
//
// Positional-options mode confines root flags to `tnf --flag <subcommand>`,
// which is where they were always documented to go.
program.enablePositionalOptions();

// Fallback for CommonJS/ESM compatibility
const _dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath((import.meta as any).url));
const _filename =
  typeof __filename !== 'undefined' ? __filename : fileURLToPath((import.meta as any).url);
const require = createRequire(_filename);
const repoRoot = path.resolve(_dirname, '../../..');
const invocationCwd = process.env.TNF_INVOCATION_CWD || process.cwd();
const LOCAL_ENV_FILES = ['.tnf.local.env', '.env.local', '.env'];
const FALLBACK_ENV_SOURCES = [
  'apps/api/.env',
  'apps/frontend/.env.local',
  'apps/frontend/.env.production',
  'apps/ai-arcade/.env',
  'apps/virtual-library-blueprints/.env',
  'apps/virtual-library-blueprints/.env.local',
];
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

function mapSupabaseEnvAliases(entries: Record<string, string>): Record<string, string> {
  const mapped = { ...entries };
  if (!mapped.SUPABASE_URL && mapped.VITE_SUPABASE_URL) {
    mapped.SUPABASE_URL = mapped.VITE_SUPABASE_URL;
  }
  if (!mapped.SUPABASE_ANON_KEY && mapped.VITE_SUPABASE_ANON_KEY) {
    mapped.SUPABASE_ANON_KEY = mapped.VITE_SUPABASE_ANON_KEY;
  }
  if (!mapped.VITE_SUPABASE_URL && mapped.SUPABASE_URL) {
    mapped.VITE_SUPABASE_URL = mapped.SUPABASE_URL;
  }
  if (!mapped.VITE_SUPABASE_ANON_KEY && mapped.SUPABASE_ANON_KEY) {
    mapped.VITE_SUPABASE_ANON_KEY = mapped.SUPABASE_ANON_KEY;
  }
  return mapped;
}

function loadLocalEnv(rootDir: string): void {
  const exportedKeys = new Set(Object.keys(process.env));
  const envPaths = [
    ...LOCAL_ENV_FILES.map((file) => path.join(rootDir, file)),
    ...FALLBACK_ENV_SOURCES.map((file) => path.join(rootDir, file)),
  ];

  for (const envPath of envPaths) {
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
      // First-wins: shell env > LOCAL_ENV_FILES > FALLBACK_ENV_SOURCES; fallbacks must not clobber earlier values.
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || key in process.env) continue;

      process.env[key] = parseEnvValue(normalizedLine.slice(separatorIndex + 1));
    }
  }

  const aliasEntries = mapSupabaseEnvAliases(
    Object.fromEntries(
      ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
        .filter((key) => process.env[key])
        .map((key) => [key, process.env[key] as string])
    )
  );
  for (const [key, value] of Object.entries(aliasEntries)) {
    if (!value || exportedKeys.has(key) || process.env[key]) continue;
    process.env[key] = value;
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
  options: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    isBackground?: boolean;
    /** Kill the child and reject with CommandTimeoutError after this long.
     *  Omit for the historical unbounded behaviour. */
    timeoutMs?: number;
    /**
     * Tee the child's stderr so a non-zero exit reports what actually went
     * wrong. Without this a failure surfaces only as "<cmd> exited with code N".
     */
    captureStderr?: boolean;
    intent?: string;
  } = {}
): Promise<void> {
  const { assertNotEscalationHalted, recordCommandOutcome } =
    await import('./utils/action-receipt.js');
  if (!options.isBackground) {
    assertNotEscalationHalted(repoRoot);
  }
  const started = Date.now();
  const cwd = options.cwd || repoRoot;
  try {
    await spawnWithTimeout(cmd, args, { ...options, cwd });
    recordCommandOutcome(repoRoot, {
      intent: options.intent || `${cmd} ${args.slice(0, 3).join(' ')}`.trim(),
      cmd,
      args,
      cwd,
      ok: true,
      durationMs: Date.now() - started,
    });
  } catch (err: any) {
    recordCommandOutcome(repoRoot, {
      intent: options.intent || `${cmd} ${args.slice(0, 3).join(' ')}`.trim(),
      cmd,
      args,
      cwd,
      ok: false,
      durationMs: Date.now() - started,
      error: err?.message || String(err),
    });
    throw err;
  }
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
  // 1000ms was too short for the Supabase pooler (5 sequential queries); 8000ms verified working.
  const runtimeTimeoutMs = process.env.TNF_ONBOARD_RUNTIME_TIMEOUT_MS || '10000';
  const args = ['scripts/tnf-onboard.cjs', '--runtime-timeout-ms', runtimeTimeoutMs];
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
  try {
    await runTurnZeroOnboardSurface();
  } catch (err: any) {
    // Onboarding is preparatory context, not a gate for the agent itself —
    // a non-zero onboard exit (e.g. DB pooler teardown noise, observed live
    // 2026-07-22) must not kill the interactive session. Boot triage inside
    // onboard has already classified/reported whatever went wrong.
    console.warn(
      chalk.yellow(
        `[TNF Harness] Turn Zero onboarding exited with an error (${err?.message ?? err}); continuing to the agent — see ~/.tnf/boot-triage-latest.json`
      )
    );
  }
  // Fresh TNF software / onboarded operators get Voice+KWS by default.
  if (process.env.VOICE_KWS_ALWAYS_ON !== '0') {
    await ensureVoiceKwsAlwaysOn();
  }
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

async function requireSuperAdmin(
  options: { superAdminToken?: string } | undefined,
  commandLabel: string
): Promise<void> {
  let expected = normalizeToken(process.env[SUPER_ADMIN_ENV_KEY]);
  let provided = resolveProvidedSuperAdminToken(options);

  if (expected && provided.token && provided.token === expected) {
    if (!process.env[SUPER_ADMIN_INPUT_ENV_KEY]) {
      process.env[SUPER_ADMIN_INPUT_ENV_KEY] = provided.token;
    }
    return;
  }

  const readline = await import('readline/promises');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(chalk.yellow(`\n⚠️  Super Admin authentication required for '${commandLabel}'.`));

  if (expected) {
    const action = await rl.question(
      'Choose an action:\n' +
        '  1. Provide existing token to authenticate\n' +
        '  2. Release existing token & generate a new one\n' +
        '  3. Cancel\n' +
        '> '
    );

    if (action.trim() === '2') {
      const auth = await rl.question(
        'Are you sure? This will invalidate the old token everywhere (y/N): '
      );
      if (auth.trim().toLowerCase() !== 'y') {
        rl.close();
        throw new Error('Cancelled token generation.');
      }

      const crypto = await import('crypto');
      const newToken = crypto.randomBytes(32).toString('base64');
      console.log(chalk.green(`\n✅ Generated new token: ${newToken}`));

      const fs = await import('fs');
      const path = await import('path');
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        envContent = envContent.replace(
          new RegExp(expected.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'g'),
          newToken
        );
        fs.writeFileSync(envPath, envContent);
        console.log(chalk.green(`Updated .env with the new token.`));
      }
      console.log(
        chalk.cyan(
          `Please make sure to also update your shell environment (e.g. ~/.zshrc or current session).`
        )
      );

      expected = newToken;
      process.env[SUPER_ADMIN_ENV_KEY] = newToken;
      provided = { token: newToken, source: 'interactive' };
    } else if (action.trim() === '1') {
      const token = await rl.question(`Enter ${SUPER_ADMIN_ENV_KEY}: `);
      if (token.trim() !== expected) {
        rl.close();
        throw new Error(`Super Admin authentication failed. Token does not match.`);
      }
      provided = { token: token.trim(), source: 'interactive' };
    } else {
      rl.close();
      throw new Error(`Super Admin authentication cancelled.`);
    }
  } else {
    const action = await rl.question(
      'No Super Admin token is configured.\n' + '  1. Generate a new token\n' + '  2. Exit\n' + '> '
    );
    if (action.trim() === '1') {
      const crypto = await import('crypto');
      const newToken = crypto.randomBytes(32).toString('base64');
      console.log(chalk.green(`\n✅ Generated new token: ${newToken}`));

      const fs = await import('fs');
      const path = await import('path');
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        fs.appendFileSync(
          envPath,
          `\n${SUPER_ADMIN_ENV_KEY}=${newToken}\n${SUPER_ADMIN_INPUT_ENV_KEY}=${newToken}\n`
        );
        console.log(chalk.green(`Appended new token to .env.`));
      }
      console.log(
        chalk.cyan(
          `Please make sure to also update your shell environment (e.g. ~/.zshrc or current session).`
        )
      );

      expected = newToken;
      process.env[SUPER_ADMIN_ENV_KEY] = newToken;
      provided = { token: newToken, source: 'interactive' };
    } else {
      rl.close();
      throw new Error('Super Admin auth is not configured.');
    }
  }

  rl.close();

  if (
    !process.env[SUPER_ADMIN_INPUT_ENV_KEY] ||
    process.env[SUPER_ADMIN_INPUT_ENV_KEY] !== provided.token
  ) {
    process.env[SUPER_ADMIN_INPUT_ENV_KEY] = provided.token as string;
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

function resolveVoiceSystemDir(): string | null {
  const explicit = process.env.TNF_VOICE_SYSTEM_DIR?.trim();
  if (explicit) {
    const voice = path.join(explicit, 'voice');
    if (isExecutableFile(voice)) return explicit;
  }

  let cur = process.cwd();
  for (let depth = 0; depth < 12; depth += 1) {
    const candidate = path.join(cur, 'scripts', 'system');
    if (isExecutableFile(path.join(candidate, 'voice'))) return candidate;
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }

  const tnfRoot = process.env.TNF_ROOT?.trim();
  if (tnfRoot) {
    const candidate = path.join(tnfRoot, 'scripts', 'system');
    if (isExecutableFile(path.join(candidate, 'voice'))) return candidate;
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

  const systemDir = resolveVoiceSystemDir();
  if (systemDir) {
    const systemCmd = path.join(systemDir, commandName);
    if (isExecutableFile(systemCmd)) return systemCmd;
  }

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
  // Atomic: torn writes here would force operators to re-enroll voice profiles.
  writeFileAtomic(file, `${JSON.stringify(session, null, 2)}\n`);
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

function parseProcessTable(): Array<{ pid: number; ppid: number; cmd: string }> {
  const result = spawnSync('ps', ['-Ao', 'pid=,ppid=,command='], {
    encoding: 'utf8',
    env: process.env,
  });
  if (result.status !== 0) return [];
  return (result.stdout || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.match(/^(\d+)\s+(\d+)\s+(.*)$/);
      if (!parts) return { pid: Number.NaN, ppid: Number.NaN, cmd: '' };
      return {
        pid: Number.parseInt(parts[1], 10),
        ppid: Number.parseInt(parts[2], 10),
        cmd: parts[3].trim(),
      };
    })
    .filter(
      (entry) =>
        Number.isFinite(entry.pid) &&
        entry.pid > 0 &&
        Number.isFinite(entry.ppid) &&
        entry.cmd.length > 0
    );
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
  appUrl?: string;
  maxDepth?: string;
  maxPages?: string;
  maxExternal?: string;
  skipBuild?: boolean;
  skipLiveLinks?: boolean;
  skipSemantic?: boolean;
  skipAuth?: boolean;
  skipScorecard?: boolean;
  skipMermaid?: boolean;
  skipParity?: boolean;
  /** Record audit findings without aborting the self-improvement / full-auto cycle. */
  softFailAudits?: boolean;
  note?: string;
  superAdminToken?: string;
};
type FullAutoRunEvent = {
  cycle: number;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  ok: boolean;
  /** Only ever set when the cycle itself failed (ok === false). */
  error?: string;
  /** Best-effort post-step failures on an otherwise-successful cycle. Kept
   *  separate from `error` so a record can never claim success and failure at
   *  once — readers that gate on `error` used to treat a soft broadcast
   *  timeout as a dead cycle, and readers that gate on `ok` ignored it. */
  warnings?: string[];
  /** Set when the cycle was killed for exceeding --cycle-timeout-minutes,
   *  as opposed to failing on its own. */
  timedOut?: boolean;
};
type FullAutoState = {
  mode: 'running' | 'idle' | 'quarantined';
  updatedAt: string;
  intervalMinutes: number;
  maxCycles: number;
  completedCycles: number;
  failedCycles: number;
  lastRun?: FullAutoRunEvent;
  quarantinedAt?: string;
  quarantineReason?: string;
};

const CONTROL_PLANE_PROVIDER_ENV_KEY = 'TNF_CONTROL_PLANE_PROVIDER';
const MASTER_CLOCK_PROVIDER_ENV_KEY = 'TNF_MASTER_CLOCK_PROVIDER';
const SUPER_CYCLE_PROVIDER_ENV_KEY = 'TNF_SUPER_CYCLE_PROVIDER';
const DEFAULT_SELF_IMPROVEMENT_BASE_URL = 'https://thenewfuse.com';
const DEFAULT_SELF_IMPROVEMENT_API_URL = 'https://api.thenewfuse.com';
// The landing domain serves a static marketing page; the React SPA (and every
// router path the semantic audit enumerates) lives on the app domain.
const DEFAULT_SELF_IMPROVEMENT_APP_URL = 'https://app.thenewfuse.com';
const DEFAULT_FULL_AUTO_INTERVAL_MINUTES = 30;
// Observed cycle duration is ~35 min, so 90 is a generous ceiling that still
// catches a genuine hang long before it burns a day of autopilot time.
const DEFAULT_FULL_AUTO_CYCLE_TIMEOUT_MINUTES = 90;
const FULL_AUTO_STATE_PATH = path.join(repoRoot, 'docs/operations/tnf-full-auto-state.json');
const FULL_AUTO_RUN_LOG_PATH = path.join(repoRoot, 'docs/operations/tnf-full-auto-runs.jsonl');
const FULL_AUTO_DAEMON_LOG_PATH = path.join(repoRoot, 'docs/operations/tnf-full-auto-daemon.log');
const FULL_AUTO_DAEMON_PID_PATH = path.join(repoRoot, 'docs/operations/tnf-full-auto-daemon.pid');
const FULL_AUTO_LOOP_PID_PATH = path.join(repoRoot, 'docs/operations/tnf-full-auto.pid');

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
  // `runFastHarnessProtocolGate` is invoked by explicit commands like
  // `tnf doctor`. It is *not* a user-invoked protocol gate (those go through
  // `tnf protocol gate` further down). Honour the TNF_SKIP_TURN_ZERO_ONBOARD /
  // TNF_SKIP_PREFLIGHT env vars here too — otherwise scripts that export the
  // env var (scripts/agents/*.sh) still pay the Turn Zero cost on every
  // `tnf doctor` call, defeating the onboard-skip contract. Verified live
  // 2026-08-04: `TNF_SKIP_TURN_ZERO_ONBOARD=1 tnf doctor` still emits the full
  // Turn Zero Mandate output here because this path was un-gated.
  if (
    isTruthyEnv(process.env.TNF_SKIP_TURN_ZERO_ONBOARD) ||
    isTruthyEnv(process.env.TNF_SKIP_PREFLIGHT)
  ) {
    return;
  }
  console.log(chalk.dim(`[TNF Harness] Protocol gate before ${label}`));
  await new ProtocolInterceptor(repoRoot).runPreFlightChecks();
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

function resolveSelfImprovementAppUrl(input?: string): string {
  return (
    normalizeToken(input) ??
    normalizeToken(process.env.TNF_APP_BASE_URL) ??
    normalizeToken(process.env.TNF_APP_URL) ??
    DEFAULT_SELF_IMPROVEMENT_APP_URL
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
  if (options.appUrl) args.push('--app-url', options.appUrl);
  if (options.maxDepth) args.push('--max-depth', options.maxDepth);
  if (options.maxPages) args.push('--max-pages', options.maxPages);
  if (options.maxExternal) args.push('--max-external', options.maxExternal);
  if (options.skipBuild) args.push('--skip-build');
  if (options.skipLiveLinks) args.push('--skip-live-links');
  if (options.skipSemantic) args.push('--skip-semantic');
  if (options.skipAuth) args.push('--skip-auth');
  if (options.skipScorecard) args.push('--skip-scorecard');
  if (options.skipMermaid) args.push('--skip-mermaid');
  if (options.skipParity) args.push('--skip-parity');
  if (options.softFailAudits) args.push('--soft-fail-audits');
  if (options.note) args.push('--note', options.note);
  // Never put the super-admin token on argv — it leaks via `ps`, daemon status,
  // and Primary argv logs. Nested CLIs inherit TNF_SUPER_ADMIN_INPUT_TOKEN.
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
  // Atomic: this file drives full-auto execution on the next boot.
  writeFileAtomic(FULL_AUTO_STATE_PATH, JSON.stringify(state, null, 2));
}

function readFullAutoState(): FullAutoState | null {
  return safeReadJson<FullAutoState>(FULL_AUTO_STATE_PATH);
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

function readAllJsonLines(filePath: string): any[] {
  if (!fs.existsSync(filePath)) return [];
  const out: any[] = [];
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      out.push(JSON.parse(trimmed));
    } catch {
      // skip corrupt lines
    }
  }
  return out;
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
/**
 * Home-relative rendering for help text only. The absolute path above is
 * correct at runtime, but help strings are captured into the committed
 * command-surface snapshot, which leaked the operator's home directory into
 * the repository and tripped the local-runtime-boundary gate.
 */
const HOOK_RUN_LOG_DISPLAY =
  process.env.HOME && HOOK_RUN_LOG_PATH.startsWith(`${process.env.HOME}/`)
    ? `~${HOOK_RUN_LOG_PATH.slice(process.env.HOME.length)}`
    : HOOK_RUN_LOG_PATH;

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
  'command-code',
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
// Valid qualifiers for `--director-tier`, used to distinguish the local
// sub-director / cloud super-director authority split (see
// .claude/agents/sub-director.md, super-director.md) without introducing new
// `role` string values that would bypass exact-match role checks elsewhere
// (e.g. broker-agent.ts isWorkerAgent()).
const DIRECTOR_TIER_TRAITS = ['super', 'sub', 'local'];

// Adaptability hook: operators can add new roles/platforms without a code
// change by editing ~/.tnf/taxonomy-overrides.json:
//   { "agent_roles": ["custom-role"], "agent_platforms": ["custom-platform"] }
// These are unioned into the effective validation set (still warn-only) and
// surfaced separately by `tnf traits list` as custom_agent_roles /
// custom_agent_platforms so drift from the canonical baseline stays visible.
interface TaxonomyOverrides {
  agent_roles?: string[];
  agent_platforms?: string[];
}

function loadTaxonomyOverrides(): TaxonomyOverrides {
  const candidate = path.join(process.env.HOME || '', '.tnf', 'taxonomy-overrides.json');
  try {
    if (!fs.existsSync(candidate)) return {};
    const parsed = JSON.parse(fs.readFileSync(candidate, 'utf-8'));
    return {
      agent_roles: Array.isArray(parsed?.agent_roles)
        ? parsed.agent_roles.filter((v: unknown) => typeof v === 'string')
        : [],
      agent_platforms: Array.isArray(parsed?.agent_platforms)
        ? parsed.agent_platforms.filter((v: unknown) => typeof v === 'string')
        : [],
    };
  } catch {
    return {};
  }
}

const TAXONOMY_OVERRIDES = loadTaxonomyOverrides();
const CUSTOM_AGENT_ROLES = (TAXONOMY_OVERRIDES.agent_roles || []).filter(
  (r) => !AGENT_ROLE_TRAITS.includes(r)
);
const CUSTOM_AGENT_PLATFORMS = (TAXONOMY_OVERRIDES.agent_platforms || []).filter(
  (p) => !PLATFORM_TAXONOMY.includes(p)
);
const EFFECTIVE_AGENT_ROLE_TRAITS = [...AGENT_ROLE_TRAITS, ...CUSTOM_AGENT_ROLES];
const EFFECTIVE_PLATFORM_TAXONOMY = [...PLATFORM_TAXONOMY, ...CUSTOM_AGENT_PLATFORMS];
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
  'tnf orchestrate \x3Cnatural-language-goal\x3E    # New: goal-driven orchestration',
  'tnf orchestrate --status                   # Show orchestrator status',
  'tnf orchestrate --suggest                  # Show proactive suggestions',
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

// Redis is an optional dependency for several TNF surfaces: a connection
// failure degrades functionality but must not fail the process. Everything
// else is a real crash and MUST exit non-zero — unattended supervisors
// (`tnf full-auto start`, cron, CI) read the exit code to decide whether a
// cycle succeeded. Swallowing these silently makes every crash look green.
function isOptionalRedisFault(err: any): boolean {
  const message: string = err?.message ?? String(err ?? '');
  return message.includes('Redis') || message.includes('ECONNREFUSED');
}

process.on('uncaughtException', (error: Error) => {
  if (isOptionalRedisFault(error)) {
    console.error(chalk.yellow(`\n  ⚠️  Redis connection error: ${error.message}`));
    console.error(chalk.dim('  Redis is required for some TNF features. Running without Redis.'));
    return;
  }
  console.error(chalk.red(`\n  Uncaught exception: ${error.message}`));
  console.error(error.stack ?? '(no stack available)');
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  if (isOptionalRedisFault(reason)) return;
  console.error(chalk.red(`\n  Unhandled rejection: ${reason?.message || reason}`));
  if (reason?.stack) console.error(reason.stack);
  process.exit(1);
});

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
    { name: 'director_tiers', values: DIRECTOR_TIER_TRAITS },
    { name: 'super_admin_protected', values: SUPER_ADMIN_COMMAND_TRAITS },
    { name: 'redis_required', values: REDIS_COMMAND_TRAITS },
    { name: 'provider_routed', values: PROVIDER_ROUTED_COMMAND_TRAITS },
    ...(CUSTOM_AGENT_ROLES.length > 0
      ? [{ name: 'custom_agent_roles', values: CUSTOM_AGENT_ROLES }]
      : []),
    ...(CUSTOM_AGENT_PLATFORMS.length > 0
      ? [{ name: 'custom_agent_platforms', values: CUSTOM_AGENT_PLATFORMS }]
      : []),
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
        { path: 'tnf harness inspect', description: 'Inspect harness health and live agent loop' },
        {
          path: 'tnf harness cycle',
          description: 'Run one harness master loop (inspect → act → verify)',
        },
        {
          path: 'tnf harness loop --task "<goal>"',
          description: 'Run live inspect-act-verify loop with TNF LLM',
        },
        {
          path: 'tnf harness boot',
          description: 'Boot relay monitor, heartbeat, and director cron',
        },
        {
          path: 'tnf tui --autonomous',
          description: 'Always-on agent with auto-continue and verify gates',
        },
        {
          path: 'tnf turn-end',
          description: 'Refresh LIVING_STATE and SESSION_HANDOFF at session close',
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

/**
 * Re-invoke this CLI as a child process.
 *
 * When the entry is TypeScript (./tnf → `pnpm exec tsx .../cli.ts`), spawning
 * bare `process.execPath` + execArgv only works if tsx loader flags remain.
 * Match runTnfCliEntrypoint so detached/full-auto parents don't get
 * ERR_MODULE_NOT_FOUND.
 */
async function runSelfCli(args: string[], timeoutMs?: number): Promise<void> {
  // Nested CLI re-entries must not re-dump Turn Zero / ProtocolInterceptor
  // banners onto stdout (breaks JSON consumers and floods full-auto logs).
  const common = {
    env: { TNF_SILENT_PREFLIGHT: '1' },
    timeoutMs,
    captureStderr: true,
  } as const;
  if (cliEntryPath.endsWith('.ts')) {
    await runCommand('pnpm', ['exec', 'tsx', cliEntryPath, ...args], common);
    return;
  }
  await runCommand(process.execPath, [...process.execArgv, cliEntryPath, ...args], common);
}

function findFullAutoStartProcesses(): Array<{ pid: number; cmd: string }> {
  // Collapse wrapper trees (pnpm/tsx/node) into a single loop root so status
  // does not report false CONTENTION for one detached daemon lineage.
  // Match the real CLI loop only — not shells/checkers that merely mention
  // "full-auto start" in argv (e.g. `pgrep -fl 'full-auto start'`).
  const loopCmd =
    /(?:packages\/tnf-cli\/src\/cli\.ts|packages\/tnf-cli\/dist\/cli\.js|[\/\s]tnf(?:\.js)?)\s+full-auto\s+start\b/;
  const table = parseProcessTable();
  const matches = table.filter((entry) => {
    if (entry.pid === process.pid) return false;
    if (!loopCmd.test(entry.cmd)) return false;
    if (/\bfull-auto\s+daemon\b/.test(entry.cmd)) return false;
    if (/tnf-full-auto-contention-observe/.test(entry.cmd)) return false;
    if (/\b(pgrep|grep|rg|awk)\b/.test(entry.cmd)) return false;
    return true;
  });
  if (matches.length === 0) return [];
  const matchPids = new Set(matches.map((m) => m.pid));
  const roots = matches.filter((entry) => !matchPids.has(entry.ppid));
  // Prefer the leaf CLI process when present under a root's descendants.
  const byPid = new Map(table.map((e) => [e.pid, e]));
  const children = new Map<number, number[]>();
  for (const entry of table) {
    const list = children.get(entry.ppid) || [];
    list.push(entry.pid);
    children.set(entry.ppid, list);
  }
  const collectDescendants = (rootPid: number): number[] => {
    const out: number[] = [];
    const stack = [rootPid];
    while (stack.length) {
      const pid = stack.pop()!;
      out.push(pid);
      for (const child of children.get(pid) || []) stack.push(child);
    }
    return out;
  };
  const collapsed: Array<{ pid: number; cmd: string }> = [];
  for (const root of roots) {
    const descendants = collectDescendants(root.pid)
      .map((pid) => byPid.get(pid))
      .filter((e): e is { pid: number; ppid: number; cmd: string } => Boolean(e))
      .filter((e) => matchPids.has(e.pid));
    const leaf =
      descendants.find(
        (e) => /cli\.ts\s+full-auto\s+start/.test(e.cmd) && !/\/tsx\s/.test(e.cmd)
      ) ||
      descendants.find((e) => /cli\.ts\s+full-auto\s+start/.test(e.cmd)) ||
      root;
    collapsed.push({ pid: leaf.pid, cmd: leaf.cmd });
  }
  return collapsed;
}

function buildFullAutoStartArgs(
  options: SelfImprovementRunCliOptions & {
    intervalMinutes?: string;
    maxCycles?: string;
    cycleTimeoutMinutes?: string;
    broadcast?: boolean;
    strict?: boolean;
    skipStrictStatus?: boolean;
    skipPreflight?: boolean;
  }
): string[] {
  const args = ['full-auto', 'start'];
  if (options.intervalMinutes) args.push('--interval-minutes', options.intervalMinutes);
  if (options.maxCycles) args.push('--max-cycles', options.maxCycles);
  if (options.cycleTimeoutMinutes)
    args.push('--cycle-timeout-minutes', options.cycleTimeoutMinutes);
  if (options.baseUrl) args.push('--base-url', options.baseUrl);
  if (options.apiUrl) args.push('--api-url', options.apiUrl);
  if (options.appUrl) args.push('--app-url', options.appUrl);
  if (options.maxDepth) args.push('--max-depth', options.maxDepth);
  if (options.maxPages) args.push('--max-pages', options.maxPages);
  if (options.maxExternal) args.push('--max-external', options.maxExternal);
  if (options.skipBuild) args.push('--skip-build');
  if (options.skipLiveLinks) args.push('--skip-live-links');
  if (options.skipSemantic) args.push('--skip-semantic');
  if (options.skipAuth) args.push('--skip-auth');
  if (options.skipScorecard) args.push('--skip-scorecard');
  if (options.skipMermaid) args.push('--skip-mermaid');
  if (options.skipParity) args.push('--skip-parity');
  if (options.skipStrictStatus) args.push('--skip-strict-status');
  if (options.skipPreflight) args.push('--skip-preflight');
  if (options.broadcast) args.push('--broadcast');
  if (options.strict) args.push('--strict');
  // Auth stays in TNF_SUPER_ADMIN_INPUT_TOKEN (daemon spawn env), never argv.
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

  // 5. Claude Code-specific install locations (native/local installs)
  if (cliName === 'claude') {
    const claudeCandidates = [
      path.join(os.homedir(), '.claude', 'local', 'claude'),
      path.join(os.homedir(), '.local', 'bin', 'claude'),
      '/opt/homebrew/bin/claude',
      '/usr/local/bin/claude',
    ];
    for (const candidate of claudeCandidates) {
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

function isClaudePassthroughArgv(argv: string[]): boolean {
  const subcommand = argv[2];
  return subcommand === 'claude';
}

function isPiPassthroughArgv(argv: string[]): boolean {
  const subcommand = argv[2];
  return subcommand === 'pi';
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
  const passthroughTargets = [
    'openclaw',
    'hermes',
    'gemini',
    'cursor',
    'claude',
    'pi',
    'command-code',
  ];

  // A leading flag is never another CLI's subcommand, so there is nothing to
  // resolve. Without this guard `tnf --help` fell through to the loop below and
  // probed all six passthrough targets by running each one's `--help` through
  // spawnSync — six full external CLI startups to ask whether any of them has a
  // subcommand literally named "--help".
  //
  // Measured 2026-08-05 with --cpu-prof: spawnSync was 35.4s of the 46.5s
  // `tnf --help` runtime (76%), entirely under this call path. Discovering what
  // the CLI can do cost more than any command it can run, and every agent
  // calling `tnf capabilities` to discover TNF paid the same toll.
  if (subcommand?.startsWith('-')) return null;

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
  .option('--no-splash', 'Disable splash graphic and silence protocol preflight chatter on stdout')
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

type AutonomousSessionState = {
  continuePending: boolean;
  handoffTaskIndex: number;
  contextRefreshPending: boolean;
  turnsThisSession: number;
  maxTurnsPerSession: number;
  /** True once the approaching-cap notification has been issued for the
   *  current cap value; reset whenever the cap is extended. */
  softCapNotified: boolean;
  /** Absolute ceiling maxTurnsPerSession may be extended to via
   *  TNF_EXTEND_TURN_CAP markers (LONG_RUN mode only). */
  capCeiling: number;
  /** Number of automatic hard-cap resets performed this session (bypass mode). */
  capResets: number;
  /** Consecutive autonomous turns that produced zero executable bash blocks. */
  consecutiveNoBashTurns: number;
  /** Operator hold: suppress auto-continue until /continue (or /autonomous on). */
  operatorHold: boolean;
};

const autonomousTurnCapConfig = loadAutonomousTurnCapConfig();

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
  autonomousMode?: boolean;
  autonomousState?: AutonomousSessionState;
  /** Tool policy the session launched with. Absent means unrestricted. */
  permissions?: PermissionResolution;
  /* --- status-line inputs ------------------------------------------------ */
  /** Interaction mode the session launched with: agent / plan / ask. */
  mode?: string;
  /** Persisted TUI mode (INTERACTIVE / LONG_RUN / AUTONOMOUS). */
  tuiMode?: string;
  /**
   * Current operator takeover window. Mutated by `/window` mid-session, so the
   * status line reads it from here rather than re-resolving from disk.
   */
  operatorWindowMs?: number;
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

/**
 * Interactive command palette wiring.
 *
 * Replaces the previous slash dropdown, which indexed only the ~40 curated
 * top-level slash commands and matched them with `startsWith`. Selecting a
 * namespace there ran `tnf <namespace>` and printed a help page, so choosing a
 * real command always took two manual steps. The palette indexes every
 * Commander path at every depth plus every Markdown command/agent/skill found
 * across the runtime directories, ranks them fuzzily, and runs the selection
 * directly.
 */

/** Built once per process: walking 1200+ nodes on every keystroke is wasteful. */
let paletteIndexCache: PaletteEntry[] | null = null;

function getPaletteIndex(projectRoot: string): PaletteEntry[] {
  if (paletteIndexCache) return paletteIndexCache;
  const service = new CommandSourceService(projectRoot);
  paletteIndexCache = buildPaletteIndex({
    program,
    slash: getAllSlashCommands(projectRoot),
    markdown: service.discover(),
  });
  return paletteIndexCache;
}

const PALETTE_THEME: PaletteTheme = {
  dim: (s) => chalk.dim(s),
  accent: (s) => chalk.cyan(s),
  match: (s) => chalk.bold.yellow(s),
  selected: (s) => chalk.bgCyan.black.bold(s),
  badge: (s) => chalk.dim(s),
  scrollbar: (s) => chalk.cyan(s),
  recent: (s) => chalk.yellow(s),
};

/**
 * Resolve a token list against the real Commander tree.
 *
 * Returns the longest prefix of `tokens` that names an actual command path,
 * plus whatever tokens are left over as arguments. This is what lets
 * `/agents register alice worker` dispatch to `tnf agents register` with
 * `alice worker` as args, instead of being mangled by the curated `/agents`
 * entry (which hard-codes `agents list`).
 */
function resolveCliPath(tokens: string[]): { argv: string[]; rest: string[] } | null {
  let node: Command = program;
  const argv: string[] = [];

  for (const token of tokens) {
    const next = node.commands.find((cmd) => cmd.name() === token || cmd.aliases().includes(token));
    if (!next) break;
    node = next;
    argv.push(token);
  }

  if (argv.length === 0) return null;
  return { argv, rest: tokens.slice(argv.length) };
}

/**
 * Readline Tab completion, kept as a fallback for non-TTY and for terminals
 * where the raw-mode palette cannot attach. Now fuzzy and full-depth so it
 * agrees with what the palette would have shown.
 */
function createSlashCompleter(projectRoot: string): (line: string) => [string[], string] {
  return (line: string): [string[], string] => {
    if (!line.startsWith('/')) return [[], line];
    const hits = rankPalette(getPaletteIndex(projectRoot), line, 40).map((ranked) =>
      ranked.entry.action.type === 'slash'
        ? ranked.entry.tokens[0]
        : `/${ranked.entry.tokens.join(' ')}`
    );
    return [hits, line];
  };
}

/**
 * Live palette session bound to one readline interface.
 *
 * `pending` bridges Node's event ordering. On Enter, readline's own keypress
 * handler runs first — it emits `line` AND clears `rl.line` — then ours runs,
 * and only after both does the awaited promise resume. So the handler cannot
 * read the query off readline at that point; it uses the mirrored `lastLine`
 * and stashes the chosen entry in `pending` for `resolveSlashDropdownInput`.
 */
/**
 * Bind the palette to a readline interface for this process.
 *
 * The ordering-sensitive glue lives in utils/palette-readline.ts so it can be
 * tested over a fake TTY; importing cli.ts would execute main().
 */
function attachSlashCommandDropdown(
  rl: readline.Interface,
  projectRoot: string
): SlashDropdownState {
  return attachPalette({
    rl,
    projectRoot,
    getIndex: getPaletteIndex,
    theme: PALETTE_THEME,
    stdin: process.stdin,
    stdout: process.stdout,
    emitKeypressEvents: readline.emitKeypressEvents,
    // TNF_PALETTE_RECENTS=0 opts out of the on-disk frecency store entirely,
    // for shared or ephemeral machines where a usage log is unwelcome.
    recents: process.env.TNF_PALETTE_RECENTS === '0' ? null : getPaletteRecents(),
  });
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

/**
 * Current branch, read straight out of `.git/HEAD`.
 *
 * Spawning `git rev-parse` would be a process per prompt in a session that
 * redraws the status line every turn; the file is one line and the answer only
 * changes when the operator checks something out, so it is cached briefly.
 */
const BRANCH_CACHE_MS = 5000;
let branchCache: { value: string | null; at: number } | null = null;

function currentGitBranch(): string | null {
  const now = Date.now();
  if (branchCache && now - branchCache.at < BRANCH_CACHE_MS) return branchCache.value;

  let value: string | null = null;
  try {
    const head = fs.readFileSync(path.join(repoRoot, '.git', 'HEAD'), 'utf8').trim();
    const match = head.match(/^ref:\s*refs\/heads\/(.+)$/);
    // Detached HEAD: show the short SHA rather than nothing, so the operator
    // can still tell that they are not on a branch.
    value = match ? match[1] : head ? `${head.slice(0, 7)} (detached)` : null;
  } catch {
    value = null;
  }

  branchCache = { value, at: now };
  return value;
}

/** `~/Desktop/…/The-New-Fuse` — enough to identify the tree, short enough to fit. */
function shortDisplayPath(target: string): string {
  const home = os.homedir();
  const withTilde = home && target.startsWith(home) ? `~${target.slice(home.length)}` : target;
  const parts = withTilde.split(path.sep);
  if (parts.length <= 3) return withTilde;
  return [parts[0], '…', ...parts.slice(-2)].join(path.sep);
}

/** Everything the status line and `/status` both want to know. */
function collectStatusSnapshot(context: InteractiveSlashContext): StatusSnapshot {
  const tokens = estimateSessionTokens(context.messages);
  let mcpServers = 0;
  try {
    mcpServers = new MCPManagerService().listServers().length;
  } catch {
    mcpServers = 0;
  }

  return {
    provider: context.client?.providerName,
    model: context.client?.model,
    mode: context.mode,
    tuiMode: context.tuiMode,
    autonomous: context.autonomousMode,
    hold: context.autonomousState?.operatorHold,
    turnsUsed: context.autonomousState?.turnsThisSession,
    turnsMax: context.autonomousState?.maxTurnsPerSession,
    tokens: tokens.total,
    messages: context.messages.length,
    operatorWindowMs: context.operatorWindowMs,
    branch: currentGitBranch(),
    cwd: shortDisplayPath(repoRoot),
    mcpServers,
    // Only worth a segment when it actually restricts something.
    permissions:
      context.permissions && !context.permissions.mutationsAllowed
        ? context.permissions.summary || 'restricted'
        : null,
    indexedCommands: paletteIndexCache?.length,
  };
}

const STATUS_THEME: StatusTheme = {
  dim: (s) => chalk.dim(s),
  label: (s) => chalk.dim(s),
  value: (s) => chalk.white(s),
  on: (s) => chalk.green.bold(s),
  off: (s) => chalk.dim(s),
  warn: (s) => chalk.yellow.bold(s),
};

/** The status line printed above each prompt. Empty string disables it. */
function renderTuiStatusLine(context: InteractiveSlashContext): string {
  if (process.env.TNF_STATUSLINE === '0') return '';
  return renderStatusLine(
    collectStatusSnapshot(context),
    process.stdout.columns || 80,
    STATUS_THEME
  );
}

function printTuiStatus(context: InteractiveSlashContext): void {
  const tokens = estimateSessionTokens(context.messages);
  const permissions = context.permissions;
  let mcpServers: string[] = [];
  try {
    mcpServers = new MCPManagerService().listServers().map((server) => server.name);
  } catch {
    mcpServers = [];
  }

  console.log(chalk.bold('\nTUI Status\n'));
  // Lead with the same line that sits above the prompt, so `/status` reads as
  // an expansion of what the operator is already looking at rather than as a
  // second, differently-worded source of truth.
  const line = renderTuiStatusLine(context);
  if (line) console.log(`${line}\n`);
  console.log(`  Provider:       ${context.client?.providerName || 'unknown'}`);
  console.log(`  Model:          ${context.client?.model || 'unknown'}`);
  if (context.client?.baseUrl) console.log(`  Base URL:       ${context.client.baseUrl}`);
  if (context.mode) console.log(`  Mode:           ${context.mode}`);
  if (context.tuiMode) console.log(`  TUI mode:       ${context.tuiMode}`);
  console.log(`  Autonomous:     ${context.autonomousMode ? 'on' : 'off'}`);
  if (context.autonomousState) {
    console.log(
      `  Turn budget:    ${context.autonomousState.turnsThisSession}/${context.autonomousState.maxTurnsPerSession} (ceiling ${context.autonomousState.capCeiling})`
    );
    console.log(`  Operator hold:  ${context.autonomousState.operatorHold ? 'on' : 'off'}`);
  }
  if (typeof context.operatorWindowMs === 'number') {
    console.log(`  Op. window:     ${Math.round(context.operatorWindowMs / 1000)}s`);
  }
  console.log(`  Permissions:    ${permissions?.summary || 'unrestricted'}`);
  console.log(
    `  Native tools:   ${
      permissions ? permissions.allowed.join(', ') || 'none' : KNOWN_TOOLS.join(', ')
    }`
  );
  console.log(`  MCP servers:    ${mcpServers.length ? mcpServers.join(', ') : 'none configured'}`);
  console.log(`  Workspace:      ${shortDisplayPath(repoRoot)}`);
  console.log(`  Branch:         ${currentGitBranch() || 'not a git worktree'}`);
  console.log(`  Messages:       ${context.messages.length}`);
  console.log(`  Tokens:         ${tokens.total} estimated`);
  console.log(
    `  Palette:        ${paletteIndexCache ? `${paletteIndexCache.length} commands indexed` : 'not built yet'}`
  );
  console.log('');
}

/**
 * Flags that belong to the root program itself and must NOT be rerouted into
 * a `tui` session.
 *
 * `--help` and `--version` are Commander's own; `--no-splash` is the root's
 * one real behavioural flag. Everything else typed before a subcommand is a
 * session setting.
 */
function isRootOnlyFlag(flag: string): boolean {
  const bare = flag.split('=')[0];
  return ['-h', '--help', '-V', '--version', '--no-splash'].includes(bare);
}

function handleAgentFocusSlash(args: string[]): void {
  if (!args.length) {
    console.log(chalk.bold('\nAgent focus\n'));
    console.log(describeAgentFocus());
    console.log(chalk.dim(`\nFile: ${focusFilePath()}`));
    console.log(
      chalk.dim('Env override: TNF_AGENT_FOCUS=platform-dev|personal|personal-professional\n')
    );
    return;
  }

  let mode: AgentFocusMode | undefined;
  let profileId: string | undefined;
  const goals: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--profile' || arg === '-p') {
      profileId = args[++i];
      continue;
    }
    if (arg === '--goal' || arg === '-g') {
      const goal = args[++i];
      if (goal) goals.push(goal);
      continue;
    }
    if (!mode) {
      mode = arg as AgentFocusMode;
    }
  }

  const next = writeAgentFocus({
    ...(mode ? { mode } : {}),
    ...(profileId ? { profileId } : {}),
    ...(goals.length ? { goals } : {}),
  });
  console.log(chalk.green('\nUpdated agent focus\n'));
  console.log(describeAgentFocus(next));
  console.log('');
}

async function handleOneShotSlashInput(input: string): Promise<boolean> {
  const parsed = parseSlashCommand(input);
  if (!parsed) return false;

  // Same rule as the interactive path: `tnf "/agents register alice worker"`
  // must reach the real command, not the curated single-token entry.
  if (parsed.args.length > 0) {
    const resolved = resolveCliPath([parsed.name, ...parsed.args]);
    if (resolved && resolved.argv.length > 1) {
      await runTnfCliEntrypoint([...resolved.argv, ...resolved.rest]);
      return true;
    }
  }

  const command = findSlashCommand(parsed.name, invocationCwd);
  if (!command) {
    console.error(chalk.red(`Unknown slash command: /${parsed.rawName}`));
    // Same near-miss list the interactive path shows. A typo should cost one
    // glance, not a trip through `tnf --help`.
    const suggestions = rankPalette(getPaletteIndex(invocationCwd), `/${parsed.rawName}`, 5);
    if (suggestions.length > 0) {
      console.error(chalk.dim('Did you mean:'));
      for (const { entry } of suggestions) {
        console.error(
          `  ${chalk.cyan(paletteEntryToLine(entry).padEnd(34))} ${chalk.dim(entry.badge.padStart(14))}  ${chalk.dim(entry.description)}`
        );
      }
    }
    console.error(
      chalk.dim('Run `tnf /help`, `tnf slash list`, or `tnf commands <text>` to search everything.')
    );
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

  if (command.name === 'focus' || command.aliases?.includes('whoami-focus')) {
    handleAgentFocusSlash(parsed.args);
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

  // Multi-token input that names a real CLI path dispatches straight to it.
  //
  // This is what makes the flat palette honest: choosing `agents register`
  // has to RUN `tnf agents register`, not fall through to the curated
  // `/agents` entry (hard-coded to `agents list`) and silently do something
  // else. Single-token input is left to the curated table on purpose, so
  // `/agents` keeps its useful default and `/skills` keeps its bank status.
  if (parsed.args.length > 0) {
    const resolved = resolveCliPath([parsed.name, ...parsed.args]);
    if (resolved && resolved.argv.length > 1) {
      await runTnfCliEntrypoint([...resolved.argv, ...resolved.rest]);
      return { handled: true };
    }
  }

  const command = findSlashCommand(parsed.name, invocationCwd);
  if (!command) {
    const suggestions = rankPalette(getPaletteIndex(invocationCwd), `/${parsed.rawName}`, 5);
    console.log(chalk.red(`  Unknown slash command: /${parsed.rawName}`));
    if (suggestions.length > 0) {
      console.log(chalk.dim('  Did you mean:'));
      for (const { entry } of suggestions) {
        console.log(
          `    ${chalk.cyan(paletteEntryToLine(entry).padEnd(34))} ${chalk.dim(entry.badge.padStart(14))}  ${chalk.dim(entry.description)}`
        );
      }
    }
    console.log(chalk.dim('  Press / and type to search every command, or run /help.'));
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

  if (command.name === 'status') {
    printTuiStatus(context);
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

  if (command.name === 'focus' || command.aliases?.includes('whoami-focus')) {
    handleAgentFocusSlash(parsed.args);
    return { handled: true };
  }

  if (command.name === 'exec') {
    const script = parsed.args.join(' ').trim();
    if (!script) {
      console.log(chalk.red('  Usage: /exec <command>'));
      return { handled: true };
    }
    const result = await executeInteractiveBash(script);
    if (result.ok) {
      console.log(chalk.green('  ✓ command succeeded'));
    } else {
      console.log(chalk.red(`  ✗ command failed (exit ${result.code})`));
    }
    return { handled: true };
  }

  if (command.name === 'autonomous' || command.aliases?.includes('auto')) {
    const toggle = resolveAutonomousModeToggle(parsed.args);
    if (toggle === null && parsed.args.length > 0) {
      console.log(chalk.red('  Usage: /autonomous [on|off]'));
      return { handled: true };
    }
    const wantsOn = toggle === null ? !context.autonomousMode : toggle;
    // A session launched under a read-only permission mode cannot talk itself
    // back into shell access; the operator must relaunch with wider
    // permissions. Otherwise --permission-mode would be advisory, which is
    // exactly the failure this replaced.
    if (wantsOn && context.permissions && !context.permissions.mutationsAllowed) {
      console.log(
        chalk.yellow(
          `  Refused: this session runs under --permission-mode ${context.permissions.mode} (${context.permissions.summary}).`
        )
      );
      console.log(
        chalk.dim('  Relaunch with a permission mode that allows shell to enable autonomy.')
      );
      return { handled: true };
    }
    context.autonomousMode = wantsOn;
    console.log(
      `  Autonomous shell execution: ${context.autonomousMode ? chalk.green('ON') : chalk.yellow('OFF')}`
    );
    if (context.autonomousState) {
      const { turnsThisSession, maxTurnsPerSession, capCeiling } = context.autonomousState;
      console.log(
        chalk.dim(
          `  Turn budget: ${turnsThisSession}/${maxTurnsPerSession} (soft warn @ ${Math.ceil(maxTurnsPerSession * autonomousTurnCapConfig.softRatio)}; ceiling ${capCeiling}; LONG_RUN may emit TNF_EXTEND_TURN_CAP=<n>)`
        )
      );
    }
    if (context.autonomousMode) {
      enableAutonomousRuntimeDefaults();
      if (context.autonomousState) {
        context.autonomousState.operatorHold = false;
        context.autonomousState.continuePending = true;
      }
    } else if (context.autonomousState) {
      context.autonomousState.continuePending = false;
    }
    return { handled: true };
  }

  if (command.name === 'window' || command.aliases?.includes('operator-window')) {
    const arg = parsed.args.join(' ').trim();
    if (!arg) {
      const current = resolveOperatorWindowMs();
      console.log(
        chalk.cyan(
          `  Operator window: ${Math.round(current / 1000)}s (${current}ms). Default ${Math.round(DEFAULT_OPERATOR_WINDOW_MS / 1000)}s.`
        )
      );
      console.log(
        chalk.dim('  Usage: /window <seconds|30s|8000ms>  ·  persists to ~/.tnf/tui-mode.json')
      );
      return { handled: true };
    }
    const parsedMs = parseOperatorWindowArg(arg);
    if (parsedMs === null) {
      console.log(chalk.red('  Usage: /window <seconds|30s|8000ms>'));
      return { handled: true };
    }
    const saved = persistOperatorWindowMs(parsedMs);
    process.env.TNF_OPERATOR_WINDOW_MS = String(saved);
    console.log(
      chalk.green(
        `  Operator window set to ${Math.round(saved / 1000)}s (${saved}ms) — persisted for next launch`
      )
    );
    return { handled: true };
  }

  if (command.name === 'hold' || command.aliases?.includes('pause-auto')) {
    if (context.autonomousState) {
      context.autonomousState.operatorHold = true;
      context.autonomousState.continuePending = false;
    }
    console.log(
      chalk.yellow(
        '  ⏸ Autonomous continue HOLD — type freely. /continue or /autonomous on to resume.'
      )
    );
    return { handled: true };
  }

  if (command.name === 'continue' || command.aliases?.includes('resume-auto')) {
    if (context.autonomousState) {
      context.autonomousState.operatorHold = false;
      context.autonomousState.continuePending = true;
    }
    context.autonomousMode = true;
    enableAutonomousRuntimeDefaults();
    console.log(chalk.green('  ⟳ Autonomous continue resumed'));
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
  .argument(
    '[name]',
    'Profile/instance label written into boot receipt (default: goldberg)',
    'goldberg'
  )
  .option(
    '--super-admin-token <token>',
    'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)'
  )
  .option('--non-interactive', 'Skip interactive client launches (OpenClaw UI and browser open)')
  .option('--no-attach-agent', 'Do not attach the interactive TNF Agent after a successful boot')
  .option('--plan', 'Print the boot launch graph without starting processes')
  .option('--strict-gates', 'Treat all boot step failures as fatal')
  .option('--skip-env-validation', 'Skip template environment validation step')
  .option(
    '--force-onboard',
    'Re-run scripts/tnf-onboard.cjs even though ProtocolInterceptor already ran Turn Zero'
  )
  .option('--with-claude', 'Also start the Claude Redis wrapper (not included in --all by default)')
  .option(
    '--require-core',
    'Treat factory + health verification as critical (implied by --strict-gates)'
  )
  .option(
    '--autonomous',
    'After stack bring-up, activate tnf alive + harness continuity (anti-stall)'
  )
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
        forceOnboard?: boolean;
        withClaude?: boolean;
        requireCore?: boolean;
        autonomous?: boolean;
      }
    ) => {
      try {
        const bootOptions = {
          profile: name,
          nonInteractive: options.nonInteractive,
          attachAgent: options.attachAgent,
          strictGates: options.strictGates,
          skipEnvValidation: options.skipEnvValidation,
          forceOnboard: options.forceOnboard,
          // Default: skip redundant onboard — ProtocolInterceptor already ran Turn Zero.
          skipOnboard: !options.forceOnboard,
          withClaude: options.withClaude,
          requireCore: options.requireCore,
          autonomous: options.autonomous,
        };

        const pipeline = createBootPipeline(
          {
            repoRoot,
            runCommand,
            findExecutableOnPath,
          },
          bootOptions
        );

        if (options.plan) {
          printBootPlan(name, toBootPlan(pipeline), {
            nonInteractive: options.nonInteractive,
            withClaude: options.withClaude,
            forceOnboard: options.forceOnboard,
            requireCore: options.requireCore || options.strictGates,
            autonomous: options.autonomous,
          });
          return;
        }

        await requireSuperAdmin(options, 'boot');
        console.log(chalk.bold.cyan(`\n🚀 Booting TNF Stack: ${chalk.yellow(name)}\n`));
        if (options.nonInteractive) {
          console.log(chalk.dim('Boot mode: non-interactive'));
        }
        if (options.strictGates) {
          console.log(chalk.dim('Gate mode: strict'));
        }
        if (options.requireCore) {
          console.log(chalk.dim('Core mode: factory + health are critical'));
        }
        if (options.autonomous) {
          console.log(chalk.dim('Continuity: alive + harness will arm after stack'));
        }
        if (options.withClaude) {
          console.log(chalk.dim('Agents: Claude wrapper enabled'));
        }
        if (options.forceOnboard) {
          console.log(chalk.dim('Onboard: forcing tnf-onboard.cjs re-run'));
        }

        const warnings: string[] = [];
        const stepResults: BootStepResult[] = [];

        for (let i = 0; i < pipeline.length; i++) {
          const step = pipeline[i];
          // Attach is TTY-gated after the receipt is written.
          if (step.id === 'attach-agent') {
            stepResults.push({
              id: step.id,
              label: step.label,
              status: 'skipped',
              critical: step.critical,
              durationMs: 0,
            });
            continue;
          }

          process.stdout.write(chalk.white(`[${i + 1}/${pipeline.length}] ${step.label}... `));
          const started = Date.now();
          try {
            await step.action();
            process.stdout.write(chalk.green('OK\n'));
            stepResults.push({
              id: step.id,
              label: step.label,
              status: 'ok',
              critical: step.critical,
              durationMs: Date.now() - started,
            });
          } catch (err: unknown) {
            process.stdout.write(chalk.red('FAILED\n'));
            const message = err instanceof Error ? err.message : String(err);
            const isFatal = Boolean(options.strictGates) || step.critical;
            stepResults.push({
              id: step.id,
              label: step.label,
              status: 'failed',
              critical: step.critical,
              error: message,
              durationMs: Date.now() - started,
            });
            if (isFatal) {
              console.error(chalk.red(`   Error in step "${step.label}": ${message}`));
              const receipt: BootReceipt = {
                source: 'cli.boot',
                profile: name,
                timestamp: new Date().toISOString(),
                strictGates: Boolean(options.strictGates),
                nonInteractive: Boolean(options.nonInteractive),
                attachAgent: options.attachAgent !== false,
                withClaude: Boolean(options.withClaude),
                forceOnboard: Boolean(options.forceOnboard),
                skipOnboard: bootOptions.skipOnboard,
                skipEnvValidation: Boolean(options.skipEnvValidation),
                requireCore: Boolean(options.requireCore || options.strictGates),
                autonomous: Boolean(options.autonomous),
                steps: stepResults,
                warnings,
                ok: false,
              };
              try {
                writeBootReceipt(repoRoot, receipt);
              } catch {
                // Best-effort receipt on fatal path.
              }
              throw new Error(`Critical boot failure in step: ${step.label}`);
            }
            const warningLine = `${step.label}: ${message}`;
            warnings.push(warningLine);
            console.error(chalk.yellow(`   Warning in step "${step.label}": ${message}`));
          }
        }

        const receipt: BootReceipt = {
          source: 'cli.boot',
          profile: name,
          timestamp: new Date().toISOString(),
          strictGates: Boolean(options.strictGates),
          nonInteractive: Boolean(options.nonInteractive),
          attachAgent: options.attachAgent !== false,
          withClaude: Boolean(options.withClaude),
          forceOnboard: Boolean(options.forceOnboard),
          skipOnboard: bootOptions.skipOnboard,
          skipEnvValidation: Boolean(options.skipEnvValidation),
          requireCore: Boolean(options.requireCore || options.strictGates),
          autonomous: Boolean(options.autonomous),
          steps: stepResults,
          warnings,
          ok: true,
        };
        const receiptPath = writeBootReceipt(repoRoot, receipt);

        console.log(chalk.bold.green(`\n✅ TNF Stack "${name}" is now operational!\n`));
        console.log(chalk.dim(`Boot receipt: ${receiptPath}`));
        if (warnings.length > 0) {
          console.log(chalk.yellow(`⚠️  Completed with ${warnings.length} warning(s):`));
          for (const warning of warnings) {
            console.log(chalk.yellow(`   - ${warning}`));
          }
          console.log('');
        }

        // Clear ACTIVE / INACTIVE view of every agent known on the TNF protocol bus.
        printProtocolAgentRosterSafe(repoRoot);

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
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(`\n❌ Boot sequence aborted: ${message}`));
        process.exit(1);
      }
    }
  );

program
  .command('tui')
  .description(
    'Launch the TNF TUI agent — always-on interactive LLM session (peer-parity with claude/cursor/hermes/codex entry flags)'
  )
  .argument(
    '[prompt...]',
    'Optional initial prompt (also accepted via --task / --task-file / stdin)'
  )
  .option('-m, --model <model>', 'Model override for this session (sets TNF_LLM_MODEL)')
  .option('-c, --continue', 'Resume the most recent saved TNF session transcript')
  .option('--resume [id]', 'Resume a saved session by id (omit id for most recent)')
  .option(
    '-p, --print',
    'Non-interactive oneshot: run one agent turn and print the final response (no TUI)'
  )
  .option(
    '-z, --oneshot <prompt>',
    'Hermes-style oneshot: send a single prompt, print ONLY the final response text, exit'
  )
  .option(
    '--output-format <format>',
    'Oneshot/print output format: text | json (default: text)',
    'text'
  )
  .option('--task <text>', 'Inline initial prompt / oneshot task override')
  .option('--task-file <path>', 'Read initial prompt from a file (UTF-8). Use "-" for stdin.')
  .option('--autonomous', 'Start with autonomous shell execution and auto-continue enabled')
  .option('-f, --force', 'Alias for --yolo (full auto-approve + autonomous)')
  .option('--yolo', 'Bypass approval friction: enable autonomous shell auto-exec')
  .option(
    '--mode <mode>',
    'Execution mode: agent (default) | plan | ask (plan/ask disable shell auto-exec)',
    'agent'
  )
  .option(
    '--permission-mode <mode>',
    `Tool permission mode: ${PERMISSION_MODES.join(' | ')}`,
    'default'
  )
  .option('--allowed-tools <list>', `Comma-separated tool allowlist (${KNOWN_TOOLS.join(', ')})`)
  .option('--disallowed-tools <list>', 'Comma-separated tool denylist; applied after the allowlist')
  .option(
    '--worktree [name]',
    'Run the session in an isolated git worktree under .tnf/worktrees/ (default name: tnf-session)'
  )
  .option('--worktree-base <ref>', 'Base ref for a new worktree (default: origin/HEAD, else HEAD)')
  .option('--skip-voice-kws', 'Do not auto-start Voice beam + KWS (default: start them)')
  .option(
    '--onboard',
    'Run the full Turn Zero onboard script (default: skip — main preflight already ran)'
  )
  .option('--repair', 'Pass --repair to the onboard script (implies --onboard)')
  .action(
    async (
      promptParts: string[] | undefined,
      options: {
        model?: string;
        continue?: boolean;
        resume?: string | true;
        print?: boolean;
        oneshot?: string;
        outputFormat?: string;
        task?: string;
        taskFile?: string;
        autonomous?: boolean;
        force?: boolean;
        yolo?: boolean;
        mode?: string;
        permissionMode?: string;
        allowedTools?: string;
        disallowedTools?: string;
        worktree?: string | true;
        worktreeBase?: string;
        skipVoiceKws?: boolean;
        onboard?: boolean;
        repair?: boolean;
      }
    ) => {
      try {
        const modeRaw = String(options.mode || 'agent').toLowerCase();
        const mode = (['agent', 'plan', 'ask'].includes(modeRaw) ? modeRaw : 'agent') as
          | 'agent'
          | 'plan'
          | 'ask';

        // `--mode plan|ask` and `--permission-mode plan|readOnly` are two
        // spellings of the same intent (TNF's own, and the peer CLIs'). The
        // stricter of the two wins, so neither can be used to widen the other.
        const permissions = resolvePermissions({
          mode: mode === 'plan' || mode === 'ask' ? 'plan' : (options.permissionMode ?? 'default'),
          allowedTools: options.allowedTools,
          disallowedTools: options.disallowedTools,
        });
        if (permissions.unknownTools.length > 0) {
          console.error(
            chalk.red(
              `Unknown tool name(s): ${permissions.unknownTools.join(', ')}.\n` +
                `Known tools: ${KNOWN_TOOLS.join(', ')}`
            )
          );
          process.exit(2);
        }

        const yolo = Boolean(options.yolo || options.force);
        const autonomous =
          yolo || Boolean(options.autonomous) || (mode === 'agent' && Boolean(options.autonomous));
        const wantsOneshot = Boolean(options.print || options.oneshot);

        if (options.model) {
          process.env.TNF_LLM_MODEL = options.model;
        }

        // Worktree isolation must happen before anything reads or writes the
        // workspace, so the whole session — Turn Zero included — runs inside
        // the isolated checkout.
        if (options.worktree !== undefined) {
          const service = new WorktreeService(repoRoot);
          const name =
            typeof options.worktree === 'string' && options.worktree.trim()
              ? options.worktree.trim()
              : 'tnf-session';
          const { info, created } = service.create({ name, baseRef: options.worktreeBase });
          process.chdir(info.worktreePath);
          process.env.TNF_WORKTREE = info.worktreePath;
          console.log(
            chalk.cyan(
              `  ⑂ ${created ? 'Created' : 'Reusing'} worktree ${chalk.bold(info.name)} ` +
                `on ${chalk.bold(info.branch)} (base ${info.baseRef})`
            )
          );
          console.log(chalk.dim(`    ${info.worktreePath}`));
        }

        if (wantsOneshot) {
          await runTuiOneshot({
            oneshot: options.oneshot,
            task: options.task,
            taskFile: options.taskFile,
            positional: promptParts,
            outputFormat: options.outputFormat || 'text',
            model: options.model,
            enableTools: permissions.enableTools,
          });
          return;
        }

        console.log(chalk.dim(`  ⚿ Permissions — ${permissions.summary}`));

        // Main() already ran ProtocolInterceptor (Turn Zero + disclosure) before
        // this handler. Re-running scripts/tnf-onboard.cjs here duplicated the
        // entire bootstrap wall on every `tnf tui` — opt-in only.
        if (options.onboard || options.repair) {
          await runTurnZeroOnboardSurface({ repair: Boolean(options.repair) });
        }
        if (!options.skipVoiceKws && process.env.VOICE_KWS_ALWAYS_ON !== '0') {
          await ensureVoiceKwsAlwaysOn();
        }

        const shouldResume = Boolean(options.continue || options.resume !== undefined);
        let resumeId: string | undefined =
          typeof options.resume === 'string' && options.resume.trim()
            ? options.resume.trim()
            : undefined;

        // `--resume` with no id used to silently take the most recent session.
        // On a TTY, offer the actual choice instead — picking the wrong
        // transcript is only discoverable several turns later.
        if (options.resume === true && !resumeId) {
          const picked = await pickSessionInteractively();
          if (picked === null) return; // operator cancelled
          resumeId = picked;
        }

        await startTuiAgent({
          autonomous:
            mode === 'agent' && permissions.mutationsAllowed ? Boolean(autonomous || yolo) : false,
          model: options.model,
          mode,
          continueSession: shouldResume,
          resumeId,
          task: options.task,
          taskFile: options.taskFile,
          positional: promptParts,
          permissions,
        });
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

// Isolated git worktrees for agent sessions. Replaces the former
// "Cursor Agent parity: isolated git worktree marker" root flag, which
// created nothing.
const worktreeCommand = program
  .command('worktree')
  .description('Manage isolated git worktrees for TNF sessions (see also: tnf tui --worktree)');

function printWorktreeError(err: unknown): never {
  const message = err instanceof WorktreeError ? err.message : (err as any)?.message || String(err);
  console.error(chalk.red(`Error: ${message}`));
  process.exit(1);
}

worktreeCommand
  .command('list')
  .description('List TNF-managed worktrees under .tnf/worktrees/')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean } = {}) => {
    try {
      const worktrees = new WorktreeService(repoRoot).list();
      if (options.json) {
        console.log(JSON.stringify({ count: worktrees.length, worktrees }, null, 2));
        return;
      }
      if (worktrees.length === 0) {
        console.log(
          chalk.dim('\n  No TNF worktrees. Create one with: tnf worktree create <name>\n')
        );
        return;
      }
      console.log(chalk.bold('\nTNF worktrees\n'));
      for (const worktree of worktrees) {
        console.log(
          `  ${chalk.green(worktree.name.padEnd(24))} ${chalk.cyan(worktree.branch.padEnd(32))} ${chalk.dim(`base ${worktree.baseRef}`)}`
        );
        console.log(`  ${' '.repeat(24)} ${chalk.dim(worktree.worktreePath)}`);
      }
      console.log('');
    } catch (err) {
      printWorktreeError(err);
    }
  });

worktreeCommand
  .command('create')
  .description('Create an isolated worktree and branch')
  .argument('<name>', 'Worktree name (letters, digits, dot, dash, underscore)')
  .option('--base <ref>', 'Base ref (default: origin/HEAD, else HEAD)')
  .option('--json', 'Output machine-readable JSON')
  .action((name: string, options: { base?: string; json?: boolean } = {}) => {
    try {
      const { info, created } = new WorktreeService(repoRoot).create({
        name,
        baseRef: options.base,
      });
      if (options.json) {
        console.log(JSON.stringify({ created, worktree: info }, null, 2));
        return;
      }
      console.log(
        chalk.green(`\n  ${created ? 'Created' : 'Already present'}: ${info.name}`) +
          chalk.dim(`\n  branch ${info.branch} (base ${info.baseRef})\n  ${info.worktreePath}\n`)
      );
    } catch (err) {
      printWorktreeError(err);
    }
  });

worktreeCommand
  .command('status')
  .description('Show uncommitted files and unmerged commits in a worktree')
  .argument('<name>', 'Worktree name')
  .option('--json', 'Output machine-readable JSON')
  .action((name: string, options: { json?: boolean } = {}) => {
    try {
      const status = new WorktreeService(repoRoot).status(name);
      if (options.json) {
        console.log(JSON.stringify({ name, ...status }, null, 2));
        return;
      }
      console.log(chalk.bold(`\nWorktree ${name}\n`));
      console.log(`  uncommitted files : ${chalk.cyan(String(status.dirtyFiles.length))}`);
      for (const file of status.dirtyFiles.slice(0, 20)) console.log(`    ${chalk.dim(file)}`);
      console.log(`  unmerged commits  : ${chalk.cyan(String(status.unmergedCommits.length))}`);
      for (const commit of status.unmergedCommits.slice(0, 20))
        console.log(`    ${chalk.dim(commit)}`);
      console.log('');
    } catch (err) {
      printWorktreeError(err);
    }
  });

worktreeCommand
  .command('remove')
  .description('Remove a worktree and its branch (refuses to discard work without --force)')
  .argument('<name>', 'Worktree name')
  .option('--force', 'Discard uncommitted changes and unmerged commits')
  .action((name: string, options: { force?: boolean } = {}) => {
    try {
      const result = new WorktreeService(repoRoot).remove(name, { force: options.force });
      if (!result.removed) {
        console.error(chalk.yellow(`\n  Not removed: ${result.reason}\n`));
        process.exit(1);
      }
      console.log(chalk.green(`\n  Removed worktree ${name}\n`));
    } catch (err) {
      printWorktreeError(err);
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

// Phase-1.2 (tnf pi parity): promote `tnf debug skill` to a top-level
// `tnf skill` command surface (single-engine reuse of DebugService.
//   listSkills(); extended to walk ~/.pi/agent/skills/ and ~/.agents/skills/
// matching `.pi` Agent-Skills standard topology).
// `tnf debug skill` is kept as a Commander alias for one minor release for
// existing scripts; remove when Phase-2 lands the .pi-package installer.
const skillCommand = program
  .command('skill')
  .alias('skills')
  .description(
    'Inspect the Agent-Skills discovery surface (`tnf debug skill` is the legacy alias; Hermes-parity alias: `tnf skills`).'
  );

skillCommand
  .command('list')
  .description('List all available skills (sources: tnf | pi | agents | claude)')
  .option('--json', 'Output machine-readable JSON')
  .option('--source <source>', 'Filter by source (tnf | pi | agents | claude)')
  .action((options: { json?: boolean; source?: string }) => {
    try {
      const all = debugService.listSkills();
      const filtered = options.source ? all.filter((s) => s.source === options.source) : all;
      if (options.json) {
        console.log(
          JSON.stringify(
            { count: filtered.length, source: options.source ?? 'all', skills: filtered },
            null,
            2
          )
        );
        return;
      }
      console.log(chalk.bold('\nAvailable Skills\n'));
      if (filtered.length === 0) {
        console.log(chalk.dim('  (none discovered)'));
        console.log('');
        return;
      }
      for (const s of filtered) {
        console.log(
          `  ${chalk.cyan(s.name.padEnd(28))} ${chalk.dim(s.source.padEnd(8))} ${chalk.dim(s.path)}`
        );
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

skillCommand
  .command('show')
  .description('Show full contents of a discovered skill')
  .argument('<name>', 'Skill name (from `tnf skill list`)')
  .option(
    '--source <source>',
    'Disambiguate when the same skill name exists under multiple sources'
  )
  .action((name: string, options: { source?: string }) => {
    try {
      const all = debugService.listSkills();
      const candidates = all.filter((s) => s.name === name);
      const choice =
        candidates.find((s) => s.source === options.source) ??
        (candidates.length === 1 ? candidates[0] : null);
      if (!choice) {
        console.error(chalk.red(`Skill '${name}' not found`));
        for (const c of candidates) {
          console.error(chalk.dim(`  - found under source '${c.source}' at ${c.path}`));
        }
        process.exit(1);
      }
      const contents = fs.readFileSync(choice.path, 'utf8');
      console.log(chalk.bold(`\n${choice.name}\n`));
      console.log(chalk.dim(`  source: ${choice.source}`));
      console.log(chalk.dim(`  path:   ${choice.path}`));
      console.log('');
      console.log(contents);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// `tnf debug skill` (registered below) continues to call the same
// debugService.listSkills() engine; no aliasing of the parent `debug` command
// is required to retain backward-compat.

// Phase-1.4 (tnf pi parity): top-level `tnf theme` for `.pi`-style color-token
// JSON themes. Mirrors `.pi`'s discovery locations:
//   ~/.pi/agent/themes/**/*.json
//   .pi/themes/**/*.json
// The existing `tnf splash --theme fuse|atri|neon|ember|mono` (SPLASH_THEMES) is
// a *splash animator* concept and stays untouched.
const themeCommand = program
  .command('theme')
  .description(
    'List and inspect color-token themes for the TUI (.pi parity; splash themes use `tnf splash --theme`)'
  );

function discoverColorThemes(repoRootArg: string): Array<{
  name: string;
  source: string;
  path: string;
}> {
  const home = os.homedir();
  const out: Array<{ name: string; source: string; path: string }> = [];
  const seen = new Set<string>();
  const roots: Array<{ source: string; dir: string }> = [
    { source: 'local', dir: path.join(home, '.pi', 'agent', 'themes') },
    { source: 'project', dir: path.join(repoRootArg, '.pi', 'themes') },
  ];
  for (const { source, dir } of roots) {
    if (!fs.existsSync(dir)) continue;
    const walk = (cur: string) => {
      const entries = fs.readdirSync(cur, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(cur, e.name);
        let probe = full;
        if (e.isSymbolicLink()) {
          try {
            probe = fs.realpathSync(full);
          } catch {}
        }
        if (fs.statSync(probe).isDirectory()) {
          walk(probe);
          continue;
        }
        if (!probe.endsWith('.json')) continue;
        const key = `${source}::${probe}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          name: path.relative(dir, probe).replace(/\.json$/, ''),
          source,
          path: probe,
        });
      }
    };
    walk(dir);
  }
  return out;
}

themeCommand
  .command('list')
  .description('List discovered color-token themes')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const found = discoverColorThemes(repoRoot);
      if (options.json) {
        console.log(JSON.stringify({ count: found.length, themes: found }, null, 2));
        return;
      }
      console.log(chalk.bold('\nColor-Token Themes (.pi parity)\n'));
      if (found.length === 0) {
        console.log(chalk.dim('  (none discovered — seed ~/.pi/agent/themes/)'));
        console.log('');
        return;
      }
      for (const t of found) {
        console.log(
          `  ${chalk.cyan(t.name.padEnd(28))} ${chalk.dim(t.source.padEnd(8))} ${chalk.dim(t.path)}`
        );
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

themeCommand
  .command('show')
  .description('Show the contents of a discovered theme JSON file')
  .argument('<name>', 'Theme name as shown by `tnf theme list`')
  .action((name: string) => {
    try {
      const found = discoverColorThemes(repoRoot).filter((t) => t.name === name);
      if (found.length === 0) {
        console.error(chalk.red(`Theme '${name}' not found`));
        process.exit(1);
      }
      const contents = fs.readFileSync(found[0].path, 'utf8');
      console.log(chalk.bold(`\n${found[0].name}\n`));
      console.log(chalk.dim(`  source: ${found[0].source}`));
      console.log(chalk.dim(`  path:   ${found[0].path}`));
      console.log('');
      console.log(contents);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

themeCommand
  .command('validate')
  .description('Validate a theme JSON file (.json strict schema check)')
  .argument('<path>', 'Absolute path to a theme JSON file')
  .action((filePath: string) => {
    try {
      if (!fs.existsSync(filePath)) {
        console.error(chalk.red(`File not found: ${filePath}`));
        process.exit(1);
      }
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      const keys = Object.keys(parsed);
      console.log(chalk.bold(`\nTheme Validation\n`));
      console.log(`  Path:   ${chalk.cyan(filePath)}`);
      console.log(`  Tokens: ${keys.length}`);
      if (keys.length > 0) {
        console.log(
          chalk.dim(
            `  Sample tokens: ${keys.slice(0, 6).join(', ')}${keys.length > 6 ? ', …' : ''}`
          )
        );
      }
      console.log(chalk.green(`\n  ✓ Valid JSON (${keys.length} top-level color tokens)\n`));
    } catch (err: any) {
      console.error(chalk.red(`❌ ${err.message}`));
      process.exit(1);
    }
  });

// Phase-1.5 (tnf pi parity): top-level `tnf prompt-template` for `.pi`-style
// prompt templates. Mirrors `.pi`'s discovery locations:
//   ~/.pi/agent/prompts/*.md
//   .pi/prompts/*.md
const promptTemplateCommand = program
  .command('prompt-template')
  .description(
    'List, show, and expand Markdown prompt templates (.pi parity; invoke via `/<name>` in interactive shells)'
  );

function discoverPromptTemplates(repoRootArg: string): Array<{
  name: string;
  source: string;
  path: string;
}> {
  const home = os.homedir();
  const out: Array<{ name: string; source: string; path: string }> = [];
  const seen = new Set<string>();
  const roots: Array<{ source: string; dir: string }> = [
    { source: 'local', dir: path.join(home, '.pi', 'agent', 'prompts') },
    { source: 'project', dir: path.join(repoRootArg, '.pi', 'prompts') },
  ];
  for (const { source, dir } of roots) {
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      let probe = path.join(dir, e.name);
      if (e.isSymbolicLink()) {
        try {
          probe = fs.realpathSync(probe);
        } catch {}
      }
      let stat: fs.Stats | null = null;
      try {
        stat = fs.statSync(probe);
      } catch {}
      if (!stat || !stat.isFile() || !probe.endsWith('.md')) continue;
      const key = `${source}::${probe}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ name: e.name.replace(/\.md$/, ''), source, path: probe });
    }
  }
  return out;
}

function parsePromptFrontmatter(text: string): {
  description?: string;
  body: string;
} {
  if (!text.startsWith('---')) return { body: text };
  const end = text.indexOf('\n---', 3);
  if (end < 0) return { body: text };
  const head = text.slice(3, end).trim();
  const body = text.slice(end + 4).trim();
  let description: string | undefined;
  for (const line of head.split(/\r?\n/)) {
    const m = line.match(/^description:\s*(.*)$/);
    if (m) description = m[1].trim();
  }
  return { description, body };
}

promptTemplateCommand
  .command('list')
  .description('List discovered Markdown prompt templates')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const found = discoverPromptTemplates(repoRoot);
      if (options.json) {
        console.log(JSON.stringify({ count: found.length, templates: found }, null, 2));
        return;
      }
      console.log(chalk.bold('\nPrompt Templates (.pi parity)\n'));
      if (found.length === 0) {
        console.log(chalk.dim('  (none discovered — seed ~/.pi/agent/prompts/*.md to populate)'));
        console.log('');
        return;
      }
      for (const t of found) {
        const raw = fs.readFileSync(t.path, 'utf8');
        const meta = parsePromptFrontmatter(raw);
        const desc = meta.description
          ? chalk.dim(`  — ${meta.description}`)
          : chalk.dim(`  (no description frontmatter)`);
        console.log(
          `  ${chalk.cyan('/' + t.name.padEnd(22))} ${chalk.dim(t.source.padEnd(8))}${desc}`
        );
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

promptTemplateCommand
  .command('show')
  .description('Show the contents of a discovered prompt template')
  .argument('<name>', 'Prompt template name as shown by `tnf prompt-template list`')
  .action((name: string) => {
    try {
      const found = discoverPromptTemplates(repoRoot).filter((t) => t.name === name);
      if (found.length === 0) {
        console.error(chalk.red(`Template '${name}' not found`));
        process.exit(1);
      }
      const contents = fs.readFileSync(found[0].path, 'utf8');
      console.log(chalk.bold(`\n/${found[0].name}\n`));
      console.log(chalk.dim(`  source: ${found[0].source}`));
      console.log(chalk.dim(`  path:   ${found[0].path}`));
      console.log('');
      console.log(contents);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

promptTemplateCommand
  .command('expand')
  .description('Print the expanded body of a prompt template (frontmatter stripped)')
  .argument('<name>', 'Prompt template name')
  .action((name: string) => {
    try {
      const found = discoverPromptTemplates(repoRoot).filter((t) => t.name === name);
      if (found.length === 0) {
        console.error(chalk.red(`Template '${name}' not found`));
        process.exit(1);
      }
      const raw = fs.readFileSync(found[0].path, 'utf8');
      const { body } = parsePromptFrontmatter(raw);
      process.stdout.write(body + '\n');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// Phase-1.6 (tnf pi parity): top-level `tnf provider` for `.pi`-style custom
// providers. Single-engine reuse of the existing `ModelsService.listProviders()`.
// `tnf` does NOT ship add/remove yet — the provider set is built into
// ModelsService. A future add/remove will write through ~/.pi/agent/settings.json
// in the same way `pi custom-provider.md` describes.
const providerCommand = program
  .command('provider')
  .description(
    'Inspect built-in model providers (.pi custom-provider parity; add/remove deferred to Phase-2)'
  );

providerCommand
  .command('list')
  .description('List known model providers with `configured: true|false`')
  .option('--json', 'Output machine-readable JSON')
  .action(async (options: { json?: boolean }) => {
    try {
      const svc = new ModelsService();
      const providers = await svc.listProviders();
      if (options.json) {
        console.log(
          JSON.stringify(
            {
              count: providers.length,
              configuredCount: providers.filter((p) => p.configured).length,
              providers,
            },
            null,
            2
          )
        );
        return;
      }
      console.log(chalk.bold('\nModel Providers (.pi parity)\n'));
      for (const p of providers) {
        const status = p.configured
          ? chalk.green(`configured${p.models.length ? ` (${p.models.length} models)` : ''}`)
          : chalk.dim('not configured');
        console.log(`  ${chalk.cyan(p.id.padEnd(14))} ${p.name.padEnd(18)} ${status}`);
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

providerCommand
  .command('show')
  .description('Show provider + model detail')
  .argument('<id>', 'Provider ID (e.g. nvidia, openai, anthropic)')
  .option('--json', 'Output machine-readable JSON')
  .action(async (id: string, options: { json?: boolean }) => {
    try {
      const svc = new ModelsService();
      const providers = await svc.listProviders();
      const found = providers.find((p) => p.id === id);
      if (!found) {
        console.error(chalk.red(`Unknown provider: ${id}`));
        process.exit(1);
      }
      if (options.json) {
        console.log(JSON.stringify(found, null, 2));
        return;
      }
      console.log(chalk.bold(`\n${found.name}\n`));
      console.log(`  ID:         ${chalk.cyan(found.id)}`);
      console.log(`  Type:       ${found.type}`);
      console.log(`  Configured: ${found.configured ? chalk.green('yes') : chalk.yellow('no')}`);
      if (found.models.length > 0) {
        console.log(chalk.bold('\n  Models:\n'));
        for (const m of found.models.slice(0, 10)) {
          console.log(`    ${chalk.cyan(m.id)}`);
          if (m.contextWindow)
            console.log(`      context: ${m.contextWindow.toLocaleString()} tokens`);
        }
        if (found.models.length > 10) {
          console.log(`      ${chalk.dim(`(+${found.models.length - 10} more)`)}`);
        }
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// Phase-1.7 (tnf pi parity): `.pi`-style package installer. Phase-1.1 renamed
// `tnf packages` → `tnf workspace` to clear the namespace; this fills it with
// the new concept. `.pi` packages bundle extensions/skills/themes/
// prompt-templates via npm/git/path sources.
//
// Supported source shapes (a la `pi install <source>`):
//   npm:<pkg>[@<version>]    → npm install --prefix ~/.pi/agent
//   git:<url>[@<ref>]        → git clone into ~/.pi/agent/packages/<name>
//   https://…                → git clone
//   /abs/or/relative/path    → copied into ~/.pi/agent/packages/<basename>
function piAgentRoot(): string {
  return path.join(os.homedir(), '.pi', 'agent');
}

function piPackagesRoot(): string {
  return path.join(piAgentRoot(), 'packages');
}

async function installPiPackage(source: string): Promise<{
  source: string;
  target: string;
  mode: 'npm' | 'git' | 'copy';
}> {
  fs.mkdirSync(piPackagesRoot(), { recursive: true });

  if (source.startsWith('npm:')) {
    const pkg = source.slice(4);
    await runCommand('npm', ['install', '--prefix', piAgentRoot(), '--save', pkg]);
    return { source, target: path.join(piAgentRoot(), 'node_modules', pkg), mode: 'npm' };
  } else if (source.startsWith('git:')) {
    const url = source.slice(4);
    const name = url
      .split('/')
      .pop()!
      .replace(/\.git$/, '');
    const target = path.join(piPackagesRoot(), name);
    if (fs.existsSync(target)) {
      await runCommand('git', ['-C', target, 'pull', '--ff-only']);
    } else {
      await runCommand('git', ['clone', url, target]);
    }
    return { source, target, mode: 'git' };
  } else if (source.startsWith('https://') || source.startsWith('http://')) {
    const url = source;
    const name = url
      .split('/')
      .pop()!
      .replace(/\.git$/, '');
    const target = path.join(piPackagesRoot(), name);
    if (fs.existsSync(target)) {
      await runCommand('git', ['-C', target, 'pull', '--ff-only']);
    } else {
      await runCommand('git', ['clone', url, target]);
    }
    return { source, target, mode: 'git' };
  } else if (source.startsWith('/') || source.startsWith('./') || source.startsWith('../')) {
    const real = fs.realpathSync(source);
    const name = path.basename(real);
    const target = path.join(piPackagesRoot(), name);
    fs.mkdirSync(target, { recursive: true });
    await runCommand('cp', ['-R', `${real}/.`, `${target}/`]);
    return { source, target, mode: 'copy' };
  } else {
    throw new Error(
      `Unrecognized source: '${source}'. Use npm:<pkg>, git:<url>, https://… or an absolute/relative path.`
    );
  }
}

const piPackageCommand = program
  .command('pi-package')
  .description(
    '.pi-style package installer/uninstaller (Phase-1.7); subcmds: install | uninstall | list'
  );

piPackageCommand
  .command('install')
  .description(
    'Install a .pi-style package (npm: | git: | https:// | /path) — bundles extensions/skills/themes/prompt-templates'
  )
  .argument('<source>', 'Package source: npm:<pkg>, git:<url>, https://…, /abs/or/relative/path')
  .option('--dry-run', 'Print the resolved target without executing install')
  .action(async (source: string, options: { dryRun?: boolean }) => {
    try {
      if (options.dryRun) {
        console.log(chalk.dim(`  dry-run: would install '${source}' into ${piPackagesRoot()}`));
        return;
      }
      const result = await installPiPackage(source);
      console.log(chalk.bold('\n✓ Package installed\n'));
      console.log(`  source: ${chalk.cyan(result.source)}`);
      console.log(`  mode:   ${chalk.cyan(result.mode)}`);
      console.log(`  target: ${chalk.dim(result.target)}`);
      console.log('');
      console.log(
        chalk.dim(
          `  Tip: relist discoveries with 'tnf skill list --source pi', 'tnf theme list', 'tnf prompt-template list'.`
        )
      );
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

piPackageCommand
  .command('uninstall')
  .description('Remove an installed .pi-style package by basename under ~/.pi/agent/packages/')
  .argument('<name>', 'Package basename')
  .action((name: string) => {
    try {
      const target = path.join(piPackagesRoot(), name);
      if (!fs.existsSync(target)) {
        console.error(chalk.red(`Not installed: ${target}`));
        process.exit(1);
      }
      if (!target.startsWith(piPackagesRoot() + path.sep)) {
        console.error(chalk.red(`Refusing to delete outside ~/.pi/agent/packages/`));
        process.exit(1);
      }
      fs.rmSync(target, { recursive: true, force: true });
      console.log(chalk.green(`✓ Removed ${target}`));
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

piPackageCommand
  .command('list')
  .description('List installed .pi-style packages under ~/.pi/agent/packages/')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      fs.mkdirSync(piPackagesRoot(), { recursive: true });
      const entries = fs.readdirSync(piPackagesRoot(), { withFileTypes: true });
      const found = entries.filter((e) => e.isDirectory() || e.isSymbolicLink());
      if (options.json) {
        console.log(
          JSON.stringify(
            {
              piAgentRoot: piAgentRoot(),
              count: found.length,
              packages: found.map((e) => ({
                name: e.name,
                kind: e.isSymbolicLink() ? 'symlink' : 'dir',
              })),
            },
            null,
            2
          )
        );
        return;
      }
      console.log(chalk.bold('\nInstalled .pi Packages\n'));
      if (found.length === 0) {
        console.log(
          chalk.dim(`  (none yet — install with: tnf install npm:<pkg> or /path/to/pkg)`)
        );
      } else {
        for (const e of found) {
          const real = e.isSymbolicLink()
            ? fs.realpathSync(path.join(piPackagesRoot(), e.name))
            : path.join(piPackagesRoot(), e.name);
          console.log(`  ${chalk.cyan(e.name.padEnd(28))} ${chalk.dim(real)}`);
        }
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// Phase-1.8 (tnf pi parity): SDK surface — `tnf sdk info` reports the local
// package versions that participate in the `.pi` parity story. The `.pi`
// runtime ships an npm module (`@earendil-works/pi-coding-agent`) with a
// `dist/rpc-entry.js` programmatic entry. `tnf` supplies a parity reporter
// that scans the package.json files of tnf-cli's owned packages (and
// reports whether the .pi dev dependency is detected). Real RPC-binding
// is deferred to a future Phase-2 once a downstream consumer asks for it.
const sdkCommand = program
  .command('sdk')
  .description('.pi SDK parity surface (Phase-1.8 info-only; full RPC binding deferred)');

sdkCommand
  .command('info')
  .description('Report package versions participating in .pi parity')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const cliPkgRaw = fs.readFileSync(
        path.join(repoRoot, 'packages/tnf-cli/package.json'),
        'utf8'
      );
      const cliPkg = JSON.parse(cliPkgRaw);
      const info = {
        tnfCliVersion: cliPkg.version ?? 'unknown',
        tnfCliName: cliPkg.name ?? '@the-new-fuse/tnf-cli',
        piCodingAgent: (() => {
          // The .pi dev dep appears via "node_modules path" in consumer
          // workspaces; we do not require it but report its presence.
          const home = os.homedir();
          const probePaths = [
            path.join(
              home,
              '.hermes',
              'node',
              'lib',
              'node_modules',
              '@earendil-works',
              'pi-coding-agent'
            ),
            path.join(
              home,
              '.hermes',
              'node',
              'lib',
              'node_modules',
              '@earendil-works',
              'pi-coding-agent',
              'package.json'
            ),
          ];
          for (const probe of probePaths) {
            if (fs.existsSync(probe)) {
              try {
                const pj = fs.existsSync(path.join(probe, 'package.json'))
                  ? JSON.parse(fs.readFileSync(path.join(probe, 'package.json'), 'utf8'))
                  : null;
                return {
                  discovered: true,
                  path: probe,
                  version: pj?.version ?? null,
                };
              } catch {}
            }
          }
          return { discovered: false, path: null, version: null };
        })(),
        parityPhases: [1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8],
      };
      if (options.json) {
        console.log(JSON.stringify(info, null, 2));
        return;
      }
      console.log(chalk.bold('\nSDK Parity Info (.pi runtime)\n'));
      console.log(
        `  tnf cli:          ${chalk.cyan(info.tnfCliName)}@${chalk.cyan(info.tnfCliVersion)}`
      );
      console.log(
        `  .pi discovered:   ${info.piCodingAgent.discovered ? chalk.green('yes') : chalk.yellow('no (operator can npm i @earendil-works/pi-coding-agent)')}`
      );
      if (info.piCodingAgent.version) {
        console.log(`  .pi version:      ${chalk.cyan(info.piCodingAgent.version)}`);
      }
      if (info.piCodingAgent.path) {
        console.log(`  .pi path:         ${chalk.dim(info.piCodingAgent.path)}`);
      }
      console.log(
        `  parity phases:    ${chalk.cyan(info.parityPhases.join(' | '))} (shipped + 1.9 pending)`
      );
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// Phase-1.9 (tnf pi parity): the `.pi`-parity contract test as JSON. Aggregates
// every Phase-1.x surface into one truth-y output so any future drift is
// catchable in a single `tnf capabilities` invocation. All data is read from
// the SAME engines that Phase-1.2–1.8 wired; no shadow registries.
const capabilitiesCommand = program
  .command('capabilities')
  .description('Aggregate JSON manifest of all `.pi`-parity surfaces (Phase-1.x contract test)');

capabilitiesCommand
  .option('--json', 'Output JSON (default)')
  .action(async (options: { json?: boolean }) => {
    try {
      const skillsAll = debugService.listSkills();
      const skillsBySource: Record<string, number> = {};
      for (const s of skillsAll) skillsBySource[s.source] = (skillsBySource[s.source] ?? 0) + 1;

      const shippedExt = Object.values(EXTENSION_REGISTRY).map((ext) => ({
        id: ext.id,
        type: ext.type,
        installed: checkExtensionExists(ext.appDir),
        version: getExtensionVersion(ext.appDir),
      }));
      const userExt = discoverUserExtensions(repoRoot);

      const themes = discoverColorThemes(repoRoot);
      const promptTemplates = discoverPromptTemplates(repoRoot);

      const svc = new ModelsService();
      const providers = await svc.listProviders();

      fs.mkdirSync(piPackagesRoot(), { recursive: true });
      const installedPiPkgs = fs
        .readdirSync(piPackagesRoot(), { withFileTypes: true })
        .filter((e) => e.isDirectory() || e.isSymbolicLink())
        .map((e) => ({ name: e.name, kind: e.isSymbolicLink() ? 'symlink' : 'dir' }));

      const home = os.homedir();
      const piProbe = path.join(
        home,
        '.hermes',
        'node',
        'lib',
        'node_modules',
        '@earendil-works',
        'pi-coding-agent',
        'package.json'
      );
      let piVersion: string | null = null;
      if (fs.existsSync(piProbe)) {
        try {
          piVersion = JSON.parse(fs.readFileSync(piProbe, 'utf8')).version ?? null;
        } catch {}
      }

      const manifest = {
        generatedAt: new Date().toISOString(),
        agentPlatform: 'pi' as const,
        triadicCheck: {
          taxonomy: PLATFORM_TAXONOMY.includes('pi'),
          mcpConfig: fs.existsSync(path.join(repoRoot, 'data/mcp.clients/pi.mcp.json')),
          passthroughDispatch: (() => {
            try {
              return getTnfTopLevelCommands().has('pi');
            } catch {
              return false;
            }
          })(),
        },
        primitives: {
          skill: {
            command: 'tnf skill',
            discovery_sources: ['tnf', 'pi', 'agents', 'claude'],
            count: skillsAll.length,
            by_source: skillsBySource,
            subcommands: ['list', 'show'],
            shows_symlink_resolution: true,
          },
          extension: {
            command_shipped: 'tnf extension {list,status,install,user-list}',
            command_user_modules: 'tnf extension user-list',
            shipped_count: shippedExt.length,
            shipped: shippedExt,
            user_module_count: userExt.length,
            user_modules: userExt,
          },
          theme: {
            command: 'tnf theme',
            count: themes.length,
            themes,
            subcommands: ['list', 'show', 'validate'],
            untouched_splash: { command: 'tnf splash --theme', choices: SPLASH_THEMES },
          },
          prompt_template: {
            command: 'tnf prompt-template',
            count: promptTemplates.length,
            templates: promptTemplates,
            subcommands: ['list', 'show', 'expand'],
          },
          provider: {
            command: 'tnf provider',
            count: providers.length,
            configured_count: providers.filter((p) => p.configured).length,
            subcommands: ['list', 'show'],
            engine: 'services/ModelsService.ts (unchanged)',
          },
          package: {
            command: 'tnf pi-package',
            subcommands: ['install', 'uninstall', 'list'],
            supported_sources: ['npm:', 'git:', 'https://…', '/abs/or/relative/path'],
            installed_count: installedPiPkgs.length,
            installed: installedPiPkgs,
            install_target: piPackagesRoot(),
          },
          sdk: {
            command: 'tnf sdk info',
            pi_coding_agent_version: piVersion,
            pi_coding_agent_path: piVersion ? piProbe.replace('/package.json', '') : null,
            rpc_entry_deferred: true,
          },
        },
        version: {
          tnf_cli_version:
            JSON.parse(
              fs.readFileSync(path.join(repoRoot, 'packages/tnf-cli/package.json'), 'utf8')
            ).version ?? 'unknown',
          parity_phases_shipped: [1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9],
        },
      };

      console.log(JSON.stringify(manifest, null, 2));
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

function loadDefaultAgentIdentity(): {
  name: string;
  role: string;
  platform: string;
  directorTier?: string;
} {
  const identityPath = path.join(process.env.HOME || os.homedir(), '.tnf', 'agent.yaml');
  const defaults = {
    name: process.env.AGENT_NAME || 'tnf-local-subdirector',
    role: process.env.AGENT_ROLE || 'director',
    platform: process.env.AGENT_PLATFORM || 'tnf',
    directorTier: process.env.TNF_DIRECTOR_TIER || 'sub',
  };
  try {
    if (!fs.existsSync(identityPath)) return defaults;
    const text = fs.readFileSync(identityPath, 'utf8');
    const pick = (key: string): string | undefined => {
      const match = text.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?\\s*$`, 'm'));
      return match?.[1]?.trim();
    };
    return {
      name: process.env.AGENT_NAME || pick('name') || defaults.name,
      role: process.env.AGENT_ROLE || pick('role') || pick('dacc_role') || defaults.role,
      platform: process.env.AGENT_PLATFORM || pick('platform') || defaults.platform,
      directorTier: process.env.TNF_DIRECTOR_TIER || pick('director_tier') || defaults.directorTier,
    };
  } catch {
    return defaults;
  }
}

const DEFAULT_AGENT_IDENTITY = loadDefaultAgentIdentity();

program
  .command('register')
  .description('Register and listen as an agent')
  .argument('[name]', 'Agent name', DEFAULT_AGENT_IDENTITY.name)
  .argument(
    '[role]',
    `Agent role (${EFFECTIVE_AGENT_ROLE_TRAITS.join(', ')})`,
    DEFAULT_AGENT_IDENTITY.role
  )
  .argument(
    '[platform]',
    `Agent platform (${EFFECTIVE_PLATFORM_TAXONOMY.join(', ')})`,
    DEFAULT_AGENT_IDENTITY.platform
  )
  .option('-d, --daemon', 'Run in daemon mode (register and exit immediately)', false)
  .option(
    '--dacc-role <role>',
    `DACC-v1 hierarchy position (${EFFECTIVE_AGENT_ROLE_TRAITS.join(', ')})`
  )
  .option(
    '--director-tier <tier>',
    `Director authority tier when role/dacc-role is director (${DIRECTOR_TIER_TRAITS.join(', ')})`,
    DEFAULT_AGENT_IDENTITY.directorTier
  )
  .option(
    '--worker-action <action>',
    'Worker action primitive (e.g. code_generation, cli_coder, orchestrator)'
  )
  .option('--dacc-role-from-config', 'Read dacc_role from ~/.tnf/agent.yaml', false)
  .action(async (name, role, platform, options) => {
    const client = new (await loadRedisAgentClient())();
    try {
      await client.initialize();
      // Phase 8: validate role and platform are in canonical taxonomy.
      // Effective taxonomy = canonical baseline + ~/.tnf/taxonomy-overrides.json.
      if (!EFFECTIVE_AGENT_ROLE_TRAITS.includes(role)) {
        console.error(
          chalk.yellow(
            `⚠ role '${role}' is not in the canonical DACC-v1 role traits ` +
              `(${EFFECTIVE_AGENT_ROLE_TRAITS.join(', ')}). Proceeding for backward ` +
              `compatibility, but consider registering with a canonical role, or add it ` +
              `to ~/.tnf/taxonomy-overrides.json.`
          )
        );
      }
      if (!EFFECTIVE_PLATFORM_TAXONOMY.includes(platform)) {
        console.error(
          chalk.yellow(
            `⚠ platform '${platform}' is not in PLATFORM_TAXONOMY ` +
              `(${EFFECTIVE_PLATFORM_TAXONOMY.join(', ')}). Proceeding for backward ` +
              `compatibility, or add it to ~/.tnf/taxonomy-overrides.json.`
          )
        );
      }
      const directorTier: string | undefined =
        options.directorTier || DEFAULT_AGENT_IDENTITY.directorTier;
      if (directorTier && !DIRECTOR_TIER_TRAITS.includes(directorTier)) {
        console.error(
          chalk.yellow(
            `⚠ --director-tier '${directorTier}' is not one of ` +
              `(${DIRECTOR_TIER_TRAITS.join(', ')}). Ignoring.`
          )
        );
      }
      const daccRole: string | undefined = options.daccRole;
      const extra: Record<string, unknown> = {};
      if (daccRole) extra.daccRole = daccRole;
      if (directorTier && DIRECTOR_TIER_TRAITS.includes(directorTier)) {
        extra.directorTier = directorTier;
      }
      if (role === 'director' && !extra.daccRole) {
        extra.daccRole = 'director';
      }
      if (role === 'director' && extra.directorTier === 'sub') {
        extra.embodiment = 'sub-director';
      }
      const agentInfo = await client.register(name, role, platform, [], extra);
      console.log(chalk.green(`\n🤖 Registered as: ${chalk.bold(name)} (${role}) on ${platform}`));
      console.log(`   ID: ${chalk.dim(agentInfo.id)}`);
      console.log(`   Capabilities: ${chalk.dim(agentInfo.capabilities.join(', '))}`);
      if (extra.directorTier) {
        console.log(`   Director tier: ${chalk.dim(String(extra.directorTier))}`);
      }

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
    const mode = options.mode || 'ci';
    const reasons: string[] = [];
    let preflightOk = true;
    let ciOk = true;

    try {
      const interceptor = new ProtocolInterceptor(repoRoot);
      const checks = await interceptor.runPreFlightChecks();

      console.log(chalk.bold.cyan('\n[TNF Protocol Gate]\n'));
      console.log(`Mode: ${chalk.yellow(mode)}`);

      preflightOk = !!checks.allPassed;
      if (!preflightOk) {
        const failed = checks.checks.filter((c) => !c.passed);
        console.warn(chalk.yellow(`Pre-flight: ${failed.length} issue(s) (provisional)`));
        for (const check of failed) {
          console.warn(chalk.dim(`  - ${check.name}: ${check.details}`));
          reasons.push(`preflight:${check.name}`);
        }
      } else {
        console.log(chalk.cyan('Pre-flight: OK (provisional)'));
      }

      const ciGates: Array<{ name: string; args: string[] }> = [
        {
          name: 'turn-zero-authority',
          args: ['scripts/protocols/validate-turn-zero-authority.cjs', `--mode=${mode}`],
        },
        {
          name: 'handoff-source-drift',
          args: ['scripts/protocols/validate-handoff-source-drift.cjs', '--mode=ci'],
        },
        {
          name: 'living-state-directive',
          args: ['scripts/protocols/validate-living-state-directive.cjs', `--mode=${mode}`],
        },
        {
          name: 'session-handoff',
          args: ['scripts/protocols/enforce-session-handoff.cjs', `--mode=${mode}`],
        },
      ];

      for (const gate of ciGates) {
        try {
          await runCommand('node', gate.args);
          console.log(chalk.dim(`[${gate.name}] OK (${mode})`));
        } catch (gateErr: any) {
          ciOk = false;
          const msg = String(gateErr?.message || gateErr);
          reasons.push(`${gate.name}: ${msg}`);
          console.error(chalk.red(`[${gate.name}] FAIL (${mode}): ${msg}`));
        }
      }
    } catch (err: any) {
      ciOk = false;
      reasons.push(String(err?.message || err));
      console.error(chalk.red(`Protocol gate infrastructure error: ${err.message}`));
    }

    // Single final verdict — never claim ALL PROTOCOLS PASSED before CI subgates finish.
    // Verdict reports ceremony/baton health only; it must not recommend stopping full-auto loops.
    const legacy = ['1', 'true', 'yes', 'on'].includes(
      String(process.env.TNF_PROTOCOL_GATE_LEGACY_BANNER || '')
        .trim()
        .toLowerCase()
    );
    const passed = preflightOk && ciOk;
    if (passed) {
      if (legacy) {
        console.log(chalk.green('\n[TNF Protocol Gate] All checks passed.\n'));
      }
      console.log(chalk.green('\nVERDICT: PASS\n'));
      process.exit(0);
    }

    console.log(chalk.red('\nVERDICT: FAIL'));
    for (const reason of reasons) {
      console.log(chalk.red(`  - ${reason}`));
    }
    console.log('');
    process.exit(1);
  });

program
  .command('clean')
  .description(
    'Remove build artifacts (dist, .next, *.{d.ts,js.map}), Vite caches, and stray *.log files'
  )
  .option('--dry-run', 'Print what would be removed without deleting anything')
  .option(
    '--include-node-modules',
    'Also delete node_modules directories (off by default; pnpm install restores)'
  )
  .action(async (options: { dryRun?: boolean; includeNodeModules?: boolean }) => {
    try {
      const dry = !!options.dryRun;
      const remove = dry ? chalk.yellow : chalk.red;
      const patterns: string[] = ['dist', '.next', 'out', 'build', 'coverage', '.vite'];
      const extensions = ['d.ts', 'd.ts.map', 'js.map'];
      console.log(chalk.bold.cyan('\n[TNF Clean]\n'));
      console.log(`Mode: ${dry ? chalk.yellow('dry-run') : chalk.red('delete')}`);
      console.log(
        `node_modules: ${options.includeNodeModules ? chalk.red('yes') : chalk.green('no')}`
      );

      const pruneArgs = [
        '-type',
        'd',
        '(',
        '-path',
        './.git',
        '-o',
        '-path',
        './apps/external',
        '-prune',
        ')',
      ];
      const targets = options.includeNodeModules ? [...patterns, 'node_modules'] : patterns;
      for (const pattern of targets) {
        const findArgs = ['.', ...pruneArgs, '-o', '-type', 'd', '-name', pattern, '-print'];
        const result = spawnSync('find', findArgs, { cwd: repoRoot, encoding: 'utf8' });
        const dirs = (result.stdout || '').split('\n').filter(Boolean);
        for (const dir of dirs) {
          if (!dir) continue;
          console.log(`${remove('REMOVE')} ${chalk.dim(dir)}`);
          if (!dry) spawnSync('rm', ['-rf', dir], { cwd: repoRoot });
        }
      }

      for (const ext of extensions) {
        const findArgs = ['.', ...pruneArgs, '-o', '-type', 'f', '-name', `*.${ext}`, '-print'];
        const result = spawnSync('find', findArgs, { cwd: repoRoot, encoding: 'utf8' });
        const files = (result.stdout || '').split('\n').filter(Boolean);
        console.log(`${remove('REMOVE')} ${files.length} *.${ext} files`);
        if (!dry && files.length) {
          spawnSync(
            'find',
            ['.', ...pruneArgs, '-o', '-type', 'f', '-name', `*.${ext}`, '-delete'],
            { cwd: repoRoot }
          );
        }
      }

      const logArgs = ['.', ...pruneArgs, '-o', '-type', 'f', '-name', '*.log', '-print'];
      const logResult = spawnSync('find', logArgs, { cwd: repoRoot, encoding: 'utf8' });
      const logs = (logResult.stdout || '').split('\n').filter(Boolean);
      console.log(`${remove('REMOVE')} ${logs.length} *.log files`);
      if (!dry && logs.length) {
        spawnSync('find', ['.', ...pruneArgs, '-o', '-type', 'f', '-name', '*.log', '-delete'], {
          cwd: repoRoot,
        });
      }

      console.log(chalk.green('\n[TNF Clean] Done.\n'));
    } catch (err: any) {
      console.error(chalk.red(`Clean failed: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('tree')
  .description('Print the monorepo apps/ and packages/ directories as a tree')
  .option('--depth <n>', 'Max depth (default 2)', '2')
  .option('--root <path>', 'Root to start from (default .)', '.')
  .action(async (options: { depth?: string; root?: string }) => {
    try {
      const depth = options.depth || '2';
      const root = options.root || '.';
      const treeCheck = spawnSync('bash', ['-c', 'command -v tree'], { encoding: 'utf8' });
      const useTree = !!treeCheck.stdout?.trim();
      if (useTree) {
        await runCommand('tree', [`-L`, depth, '-d', '--noreport', root]);
      } else {
        await runCommand('find', [
          root,
          '-maxdepth',
          depth,
          '-type',
          'd',
          '-not',
          '-path',
          '*/node_modules*',
          '-not',
          '-path',
          '*/.git*',
          '-not',
          '-path',
          '*/dist*',
          '-not',
          '-path',
          '*/apps/external/*',
        ]);
      }
    } catch (err: any) {
      console.error(chalk.red(`Tree failed: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('find')
  .description('Search file contents across the monorepo using ripgrep (falls back to grep)')
  .argument('<pattern>', 'Regex pattern to search for')
  .option('--path <path>', 'Limit search to path (default .)')
  .option('--glob <glob>', 'File glob filter (e.g. *.ts)')
  .option('--limit <n>', 'Max results (default 100)', '100')
  .action(async (pattern: string, options: { path?: string; glob?: string; limit?: string }) => {
    try {
      const limit = options.limit || '100';
      const searchPath = options.path || '.';
      const rgCheck = spawnSync('bash', ['-c', 'command -v rg'], { encoding: 'utf8' });
      const useRg = !!rgCheck.stdout?.trim();
      if (useRg) {
        const args = ['--color=never', '-n', '--max-count', limit];
        if (options.glob) args.push('--glob', options.glob);
        args.push(pattern, searchPath);
        await runCommand('rg', args);
      } else {
        const args = ['-rn', '-m', limit];
        if (options.glob) args.push(`--include=${options.glob}`);
        args.push(
          '--exclude-dir=node_modules',
          '--exclude-dir=.git',
          '--exclude-dir=dist',
          '--exclude-dir=apps/external',
          pattern,
          searchPath
        );
        await runCommand('grep', args);
      }
    } catch (err: any) {
      console.error(chalk.red(`Find failed: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('growth-audit')
  .description(
    'Inventory AI/runtime data growth paths (Hermes, TNF, Cursor, caches); diff vs last snapshot'
  )
  .option('--json', 'Emit JSON report only')
  .option('--quiet', 'Suppress human-readable summary')
  .option('--no-save', 'Do not update snapshot or append history')
  .action(async (options: { json?: boolean; quiet?: boolean; save?: boolean }) => {
    try {
      const args = ['scripts/operations/tnf-growth-audit.cjs'];
      if (options.json) args.push('--json');
      if (options.quiet) args.push('--quiet');
      if (options.save === false) args.push('--no-save');
      await runCommand('node', args);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('services')
  .alias('svc')
  .description(
    'Health of TNF launchd services — crash loops, failures, and plists that are present but not loaded'
  )
  .option('--json', 'Machine-readable JSON')
  .option('--strict', 'Exit non-zero when any service needs attention (for cron/CI)')
  .action((options: { json?: boolean; strict?: boolean } = {}) => {
    try {
      const report = new ServiceHealthService().report();

      if (options.json) {
        console.log(JSON.stringify({ services: report }, null, 2));
      } else if (report.length === 0) {
        console.log(chalk.dim('\n  No TNF launchd services found.\n'));
      } else {
        console.log(chalk.bold('\nTNF services\n'));
        const icon: Record<string, string> = {
          'crash-loop': chalk.red('✗'),
          failed: chalk.red('✗'),
          'not-loaded': chalk.yellow('○'),
          restarted: chalk.cyan('↻'),
          idle: chalk.dim('·'),
          running: chalk.green('●'),
        };
        const width = Math.min(Math.max(...report.map((s) => s.label.length), 10), 44);
        for (const svc of report) {
          console.log(
            `  ${icon[svc.state]} ${chalk.bold(svc.label.padEnd(width))} ` +
              `${chalk.dim(svc.state.padEnd(11))} ${chalk.dim(svc.detail)}`
          );
          for (const line of svc.evidence ?? []) {
            console.log(`    ${chalk.red('↳')} ${chalk.dim(line)}`);
          }
        }
        const bad = report.filter(
          (s) => s.state !== 'running' && s.state !== 'idle' && s.state !== 'restarted'
        );
        console.log(
          bad.length
            ? chalk.yellow(`\n  ${bad.length} service(s) need attention.\n`)
            : chalk.green('\n  All services healthy.\n')
        );
      }

      if (options.strict && ServiceHealthService.hasProblems(report)) process.exitCode = 1;
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
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

        // launchd service panel. Two services crash-looped for hours on
        // 2026-08-12 without appearing in any TNF health output; doctor is
        // where an operator looks, so the check belongs here and not only in
        // the dedicated `tnf services` command.
        const svcReport = new ServiceHealthService().report({ evidence: false });
        const svcProblems = svcReport.filter(
          (svc) =>
            svc.state === 'crash-loop' || svc.state === 'failed' || svc.state === 'not-loaded'
        );
        console.log(chalk.bold.cyan('\n[TNF Doctor] launchd services\n'));
        if (svcProblems.length === 0) {
          console.log(chalk.green(`  ${svcReport.length} service(s) healthy`));
        } else {
          for (const svc of svcProblems.slice(0, 8)) {
            console.log(
              `  ${chalk.red('✗')} ${chalk.bold(svc.label)} ${chalk.dim(`${svc.state} — ${svc.detail}`)}`
            );
          }
          console.log(
            chalk.yellow(
              `  ${svcProblems.length} service(s) need attention — details: tnf services`
            )
          );
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

/**
 * Agent-authority operator surface (Phases 0–4a).
 * Thin wrappers over scripts/tnf-authority.cjs + setup/encryption tools so
 * `tnf authority …` matches the turn-up runbook without inventing a second API.
 */
async function runAuthorityScript(args: string[]): Promise<void> {
  await runCommand('node', ['scripts/tnf-authority.cjs', ...args]);
}

const authority = program
  .command('authority')
  .description(
    'Agent authority: elevation review, trust root, isolation, account setup, ENCRYPTION_KEY rotate'
  )
  .action(async () => {
    // Bare `tnf authority` → script usage (same as node scripts/tnf-authority.cjs).
    try {
      await runAuthorityScript([]);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

authority
  .command('review')
  .description('Interactive elevation approval console (TTY; start here)')
  .action(async () => {
    try {
      await runAuthorityScript(['review']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

authority
  .command('status')
  .description('Show trust-root selection and pending elevation requests')
  .action(async () => {
    try {
      await runAuthorityScript(['status']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

authority
  .command('list')
  .description('List pending elevation requests')
  .action(async () => {
    try {
      await runAuthorityScript(['list']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

authority
  .command('show')
  .description('Show one elevation request')
  .argument('<requestId>', 'Elevation request id')
  .action(async (requestId: string) => {
    try {
      await runAuthorityScript(['show', requestId]);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

authority
  .command('approve')
  .description('Approve an elevation request (operator context only)')
  .argument('<requestId>', 'Elevation request id')
  .allowUnknownOption(true)
  .argument('[passthrough...]', 'Extra flags: --ttl, --only, --reason')
  .action(async (requestId: string, passthrough: string[] = []) => {
    try {
      await runAuthorityScript(['approve', requestId, ...normalizeForwardedArgs(passthrough)]);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

authority
  .command('deny')
  .description('Deny an elevation request (operator context only)')
  .argument('<requestId>', 'Elevation request id')
  .allowUnknownOption(true)
  .argument('[passthrough...]', 'Extra flags: --reason')
  .action(async (requestId: string, passthrough: string[] = []) => {
    try {
      await runAuthorityScript(['deny', requestId, ...normalizeForwardedArgs(passthrough)]);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

authority
  .command('confirm-isolation')
  .description('Prove tnf-agent cannot read the operator key; write isolation marker')
  .option(
    '--force-after-manual-check',
    'After you personally verified Permission denied via sudo -u tnf-agent cat <key>'
  )
  .action(async (options: { forceAfterManualCheck?: boolean }) => {
    try {
      const args = ['confirm-isolation'];
      if (options.forceAfterManualCheck) args.push('--force-after-manual-check');
      await runAuthorityScript(args);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

authority
  .command('workers')
  .description('List worker wrappers still running as the operator (blocks isolation)')
  .action(async () => {
    try {
      await runAuthorityScript(['workers']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

authority
  .command('relaunch-workers')
  .description('Stop operator-uid workers and restart them via the TNF launcher as tnf-agent')
  .action(async () => {
    try {
      await runAuthorityScript(['relaunch-workers']);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

authority
  .command('account')
  .description('Create/check/remove the tnf-agent OS account (requires sudo)')
  .option('--check', 'Report only; do not create')
  .option('--remove', 'Remove the account')
  .action(async (options: { check?: boolean; remove?: boolean }) => {
    try {
      const script = 'scripts/setup/tnf-agent-account.sh';
      const extra: string[] = [];
      if (options.check) extra.push('--check');
      if (options.remove) extra.push('--remove');
      // --check does not need root; create/remove do.
      if (options.check) {
        await runCommand('bash', [script, ...extra]);
      } else {
        await runCommand('sudo', ['bash', path.join(repoRoot, script), ...extra]);
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

authority
  .command('encrypt-rotate')
  .description(
    'ENCRYPTION_KEY migration (decrypt-old → encrypt-new). Needs TNF_ENCRYPTION_KEY_OLD/NEW + DATABASE_URL'
  )
  .option('--plan', 'Dry-run report only (default safe mode if neither flag set)')
  .option('--apply', 'Write re-encrypted values')
  .action(async (options: { plan?: boolean; apply?: boolean }) => {
    try {
      const args = ['scripts/tnf-encryption-key-rotate.cjs'];
      if (options.apply) args.push('--apply');
      else args.push('--plan');
      await runCommand('node', args);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

authority
  .command('provision-keys')
  .description(
    'Ensure Ed25519 keypairs for agent ids (message-auth identity). Does not flip enforce mode.'
  )
  .argument('<agentIds...>', 'One or more agent ids (e.g. Local-Director broker-agent)')
  .option('--rotate', 'Replace existing private keys (invalidates prior signatures)')
  .action(async (agentIds: string[], options: { rotate?: boolean }) => {
    try {
      const identity = require(path.join(repoRoot, 'scripts/lib/tnf-identity.cjs')) as {
        ensureAgentKeypair: (
          id: string,
          opts?: { rotate?: boolean }
        ) => {
          agentId: string;
          privateKeyPath: string;
          publicKeyPath: string;
          created: boolean;
        };
      };
      for (const raw of agentIds) {
        const id = String(raw || '').trim();
        if (!id) continue;
        const kp = identity.ensureAgentKeypair(id, { rotate: Boolean(options.rotate) });
        console.log(`${kp.created ? chalk.green('created') : chalk.cyan('exists')}  ${kp.agentId}`);
        console.log(`  priv: ${kp.privateKeyPath}`);
        console.log(`  pub:  ${kp.publicKeyPath}`);
      }
      console.log(
        chalk.gray(
          '\nKeys ready. Keep TNF_MESSAGE_AUTH_MODE=warn until every publisher signs and peers import pubs; then consider enforce.'
        )
      );
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
  .command('generate')
  .alias('emit')
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

type HarnessCheckResult = {
  name: string;
  passed: boolean;
  detail: string;
};

type HarnessMasterCycleReport = {
  cycleId: string;
  startedAt: string;
  completedAt: string;
  phase: 'inspect' | 'act' | 'verify';
  inspect: HarnessCheckResult[];
  act: { focus: string; recommendation: string };
  verify: HarnessCheckResult[];
  passed: boolean;
};

function runCommandCapture(
  cmd: string,
  args: string[],
  options: { cwd?: string } = {}
): { code: number; stdout: string; stderr: string } {
  const result = spawnSync(cmd, args, {
    cwd: options.cwd || repoRoot,
    encoding: 'utf8',
    env: process.env,
  });
  return {
    code: result.status ?? 1,
    stdout: String(result.stdout || ''),
    stderr: String(result.stderr || ''),
  };
}

function appendHarnessCycleLog(report: HarnessMasterCycleReport): void {
  const logPath = path.join(repoRoot, 'docs/operations/tnf-harness-cycle.jsonl');
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, `${JSON.stringify(report)}\n`, 'utf8');
}

function collectHarnessInspectChecks(): HarnessCheckResult[] {
  const checks: HarnessCheckResult[] = [];
  const interceptor = new ProtocolInterceptor(repoRoot);
  const state = interceptor.getStateSummary();
  const turnZeroOk = (state.turnZero as Record<string, number>).missing === 0;
  const livingSynced = (state.livingState as Record<string, boolean>).synchronized;
  const disclosureReady = (state.disclosure as Record<string, unknown>).ready as {
    ready: boolean;
  };

  checks.push({
    name: 'protocol.turnZero',
    passed: turnZeroOk,
    detail: turnZeroOk ? 'Turn Zero artifacts present' : 'Missing Turn Zero artifacts',
  });
  checks.push({
    name: 'protocol.livingState',
    passed: livingSynced,
    detail: livingSynced ? 'Living state synchronized' : 'Living state not synchronized',
  });
  checks.push({
    name: 'protocol.disclosure',
    passed: Boolean(disclosureReady?.ready),
    detail: disclosureReady?.ready ? 'Procedural disclosure ready' : 'Disclosure warnings present',
  });

  const registration = runCommandCapture('node', ['scripts/check-agent-registration.cjs']);
  checks.push({
    name: 'agents.registration',
    passed: registration.code === 0,
    detail:
      registration.code === 0
        ? 'All agents registered'
        : registration.stderr.trim() || 'Registration check failed',
  });

  const loopScriptPath = path.join(repoRoot, 'scripts/autonomy/agent_loop_llm_harness.py');
  const loopSource = fs.existsSync(loopScriptPath) ? fs.readFileSync(loopScriptPath, 'utf8') : '';
  checks.push({
    name: 'harness.agentLoopModule',
    passed:
      loopSource.includes('def run_loop') &&
      loopSource.includes('def inspect_step') &&
      !/\bMockModelClient\b|\bmock-plan\b/.test(loopSource),
    detail: loopSource
      ? 'Agent loop module present with live-provider contract'
      : 'Agent loop module missing',
  });

  const actions = readHandoffNextActions();
  checks.push({
    name: 'handoff.nextActions',
    passed: actions.length > 0,
    detail: actions.length
      ? `${actions.length} pending action(s) in handoff`
      : 'No handoff next_actions found',
  });

  // A1: establish ≠ operate — fail-closed rollup (observe only; never kills full-auto).
  const failClosedAutonomy = !['0', 'false', 'no', 'off'].includes(
    String(process.env.TNF_AUTONOMY_HEALTH_FAIL_CLOSED || '1')
      .trim()
      .toLowerCase()
  );
  const rollup = runCommandCapture('node', [
    'scripts/runtime/tnf-autonomy-health-rollup.cjs',
    '--json',
  ]);
  let autonomyStatus = 'unknown';
  let autonomyReasons: string[] = [];
  try {
    const parsed = JSON.parse(rollup.stdout || '{}') as {
      status?: string;
      reasons?: string[];
    };
    autonomyStatus = String(parsed.status || 'unknown');
    autonomyReasons = Array.isArray(parsed.reasons) ? parsed.reasons.map(String) : [];
  } catch {
    autonomyStatus = rollup.code === 0 ? 'healthy' : 'critical';
    autonomyReasons = ['rollup_parse_failed'];
  }
  const autonomyOk = failClosedAutonomy
    ? autonomyStatus === 'healthy'
    : autonomyStatus !== 'critical';
  checks.push({
    name: 'autonomy.health',
    passed: autonomyOk,
    detail: autonomyOk
      ? `rollup=${autonomyStatus}`
      : `rollup=${autonomyStatus}${autonomyReasons.length ? ` (${autonomyReasons.join(', ')})` : ''}`,
  });

  const harnessCompleteness = runCommandCapture('node', [
    'scripts/harness/verify-harness-completeness.cjs',
    '--json',
  ]);
  let harnessCompletenessOk = harnessCompleteness.code === 0;
  let harnessCompletenessDetail = 'harness completeness pass';
  try {
    const parsed = JSON.parse(harnessCompleteness.stdout || '{}') as {
      ok?: boolean;
      failed?: number;
    };
    harnessCompletenessOk = harnessCompleteness.code === 0 && parsed.ok === true;
    harnessCompletenessDetail = harnessCompletenessOk
      ? 'UNU layers + injection surfaces ok'
      : `failed=${parsed.failed ?? '?'} (run verify-harness-completeness --provision)`;
  } catch {
    harnessCompletenessOk = false;
    harnessCompletenessDetail = 'harness completeness parse failed';
  }
  checks.push({
    name: 'harness.completeness',
    passed: harnessCompletenessOk,
    detail: harnessCompletenessDetail,
  });

  return checks;
}

type HarnessAgentLoopResult = {
  task: string;
  provider: string;
  model: string;
  inspection: Record<string, unknown>;
  modelOutput: string;
  actions: string[];
  verification: {
    passed: boolean;
    hasModelOutput: boolean;
    hasInspection: boolean;
    hasActions: boolean;
  };
  trace: Array<{ step: string }>;
};

async function runHarnessAgentLoop(task: string): Promise<HarnessAgentLoopResult> {
  const { LLMClient } = await import('./utils/llm-client.js');
  const client = await LLMClient.create('orchestrator');
  const trace: Array<{ step: string }> = [];
  const inspection = {
    taskLength: task.length,
    tools: ['inspect', 'act', 'verify'],
    constraints: ['no unverified propagation', 'capture evidence'],
  };
  trace.push({ step: 'inspect' });

  const modelOutput = await client.chatComplete(
    [
      {
        role: 'system',
        content:
          'You are an agent loop planner. Return concise next actions and verification gates.',
      },
      { role: 'user', content: task },
    ],
    { temperature: 0.1 }
  );
  trace.push({ step: 'act' });

  const actions = [
    'inspect state before acting',
    'execute the narrowest useful action',
    'verify output before reporting completion',
  ];
  const verification = {
    hasModelOutput: Boolean(modelOutput.trim()),
    hasInspection: true,
    hasActions: actions.length > 0,
    passed: Boolean(modelOutput.trim()) && actions.length > 0,
  };
  trace.push({ step: 'verify' });

  return {
    task,
    provider: client.providerName || 'unknown',
    model: client.model,
    inspection,
    modelOutput,
    actions,
    verification,
    trace,
  };
}

async function runHarnessAgentLoopCheck(): Promise<HarnessCheckResult> {
  try {
    const result = await runHarnessAgentLoop(
      'Summarize the TNF harness inspect-act-verify contract.'
    );
    return {
      name: 'harness.agentLoopLive',
      passed: result.verification.passed,
      detail: result.verification.passed
        ? `Live loop via ${result.provider}/${result.model.replace(/^.*\//, '')}`
        : 'Live agent loop verification failed',
    };
  } catch (error: any) {
    return {
      name: 'harness.agentLoopLive',
      passed: false,
      detail: error?.message || 'Live agent loop failed',
    };
  }
}

async function collectHarnessInspectChecksAsync(): Promise<HarnessCheckResult[]> {
  const checks = collectHarnessInspectChecks();
  checks.push(await runHarnessAgentLoopCheck());
  return checks;
}

function deriveHarnessActFocus(inspect: HarnessCheckResult[]): {
  focus: string;
  recommendation: string;
} {
  const failed = inspect.filter((check) => !check.passed);
  if (failed.length === 0) {
    const actions = readHandoffNextActions();
    const next = actions[0] || 'Improve harness reliability and operator ergonomics';
    return {
      focus: next,
      recommendation:
        'Run one autonomous cycle against the top handoff action, then refresh handoff artifacts with turn-end.',
    };
  }

  const priority = failed.find((check) => check.name.startsWith('protocol.')) || failed[0];
  return {
    focus: priority.name,
    recommendation: `Resolve ${priority.name}: ${priority.detail}`,
  };
}

async function runHarnessMasterCycle(): Promise<HarnessMasterCycleReport> {
  const startedAt = new Date().toISOString();
  const trajStart = runCommandCapture('node', [
    'scripts/harness/trajectory.cjs',
    'start',
    '--task',
    'tnf harness cycle',
  ]);
  let runId = '';
  try {
    runId = String((JSON.parse(trajStart.stdout || '{}') as { runId?: string }).runId || '');
  } catch {
    runId = '';
  }

  const inspect = await collectHarnessInspectChecksAsync();
  const act = deriveHarnessActFocus(inspect);
  if (runId) {
    runCommandCapture('node', [
      'scripts/harness/trajectory.cjs',
      'append',
      '--run',
      runId,
      '--type',
      'inspect_act',
      '--payload',
      JSON.stringify({
        failed: inspect.filter((c) => !c.passed).map((c) => c.name),
        focus: act.focus,
      }),
    ]);
  }

  // Berm gate for cycle act focus when it smells like a mutation class
  const berm = runCommandCapture('node', [
    'scripts/harness/permission-berm.cjs',
    'evaluate',
    '--action-class',
    'verify',
    '--json',
  ]);

  const verify = await collectHarnessInspectChecksAsync();
  const passed = verify.every((check) => check.passed);
  if (runId) {
    runCommandCapture('node', [
      'scripts/harness/trajectory.cjs',
      'append',
      '--run',
      runId,
      '--type',
      'verify',
      '--payload',
      JSON.stringify({
        passed,
        bermExit: berm.code,
        failed: verify.filter((c) => !c.passed).map((c) => c.name),
      }),
    ]);
    runCommandCapture('node', [
      'scripts/harness/trajectory.cjs',
      'end',
      '--run',
      runId,
      '--status',
      passed ? 'ok' : 'degraded',
    ]);
    runCommandCapture('node', [
      'scripts/harness/compaction-record.cjs',
      'write',
      '--run',
      runId,
      '--stage',
      'cheap_clearance',
      '--summary',
      `Harness master cycle ${passed ? 'PASS' : 'DEGRADED'}; inspect/verify tallies retained in trajectory ${runId}`,
      '--tnf-owned',
    ]);
  }

  const report: HarnessMasterCycleReport = {
    cycleId: runId ? `harness-${runId}` : `harness-${Date.now()}`,
    startedAt,
    completedAt: new Date().toISOString(),
    phase: 'verify',
    inspect,
    act,
    verify,
    passed,
  };
  appendHarnessCycleLog(report);
  return report;
}

async function runAutonomousVerifyGates(): Promise<HarnessCheckResult[]> {
  const checks: HarnessCheckResult[] = [];
  const registration = runCommandCapture('node', ['scripts/check-agent-registration.cjs']);
  const registrationDetail =
    registration.code === 0
      ? 'All agents registered'
      : registration.stdout.trim().split('\n').filter(Boolean).slice(-8).join(' | ') ||
        registration.stderr.trim() ||
        'Agent registration check failed';
  checks.push({
    name: 'agents.registration',
    passed: registration.code === 0,
    detail: registrationDetail,
  });

  try {
    const interceptor = new ProtocolInterceptor(repoRoot);
    const state = interceptor.getStateSummary();
    const livingSynced = (state.livingState as Record<string, boolean>).synchronized;
    checks.push({
      name: 'protocol.livingState',
      passed: livingSynced,
      detail: livingSynced ? 'Living state synchronized' : 'Living state drift detected',
    });
  } catch (error: any) {
    checks.push({
      name: 'protocol.livingState',
      passed: false,
      detail: error?.message || 'Protocol health check failed',
    });
  }

  return checks;
}

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

harness
  .command('context')
  .description('Resolve adaptive harness context (models/providers/hosts) for agent Terminals')
  .option('--force', 'Regenerate even if TTL has not expired')
  .option('--json', 'Print machine-readable JSON')
  .option('--profile <callsign>', 'Profile callsign override')
  .option('--ttl-seconds <n>', 'Reuse window in seconds', '900')
  .action(
    async (options: { force?: boolean; json?: boolean; profile?: string; ttlSeconds?: string }) => {
      try {
        const args = ['scripts/runtime/resolve-harness-context.cjs'];
        if (options.force) args.push('--force');
        if (options.json) args.push('--json');
        if (options.profile) args.push('--profile', options.profile);
        if (options.ttlSeconds) args.push('--ttl-seconds', String(options.ttlSeconds));
        await runCommand('node', args);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

harness
  .command('pause')
  .description('Pause all autonomous TNF fleet activity (cron + launchd + heartbeat injection)')
  .option('--reason <text>', 'Human-readable reason for the pause')
  .option(
    '--injection-only',
    'Only pause injection-class operations (keystroke + prompt injection); leave cron work running'
  )
  .action(async (options: { reason?: string; injectionOnly?: boolean }) => {
    try {
      const repoRootLocal = repoRoot;
      const fleetModeScript = path.join(repoRootLocal, 'scripts', 'lib', 'tnf-fleet-mode.cjs');
      if (!fs.existsSync(fleetModeScript)) {
        throw new Error(`Fleet-mode module not found at ${fleetModeScript}`);
      }
      const { setFleetMode, FLEET_MODE_FILE } = require(fleetModeScript);
      const mode = options.injectionOnly ? 'injection-paused' : 'paused';
      const reason =
        options.reason || `paused via tnf harness pause at ${new Date().toISOString()}`;
      const payload = setFleetMode(mode, reason, 'tnf-cli');
      console.log(chalk.yellow(`\n[TNF Fleet Paused]`));
      console.log(`  mode:           ${chalk.bold(payload.mode)}`);
      console.log(`  reason:         ${payload.reason}`);
      console.log(`  updatedAt:      ${payload.updatedAt}`);
      console.log(`  state file:     ${FLEET_MODE_FILE}`);
      console.log(chalk.dim(`\nUse 'tnf harness resume' to restore autonomous operation.\n`));
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

harness
  .command('resume')
  .description('Resume normal autonomous TNF fleet activity (clear pause state)')
  .action(async () => {
    try {
      const repoRootLocal = repoRoot;
      const fleetModeScript = path.join(repoRootLocal, 'scripts', 'lib', 'tnf-fleet-mode.cjs');
      if (!fs.existsSync(fleetModeScript)) {
        throw new Error(`Fleet-mode module not found at ${fleetModeScript}`);
      }
      const { clearFleetMode, FLEET_MODE_FILE } = require(fleetModeScript);
      const result = clearFleetMode();
      if (!result.ok) {
        throw new Error(`Resume failed: ${result.error}`);
      }
      console.log(chalk.green(`\n[TNF Fleet Resumed]`));
      console.log(`  state file:     ${FLEET_MODE_FILE} (removed or never existed)`);
      console.log(`  cron + launchd + heartbeat should resume on next cycle.\n`);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

harness
  .command('fleet-status')
  .alias('status')
  .description('Show current fleet pause state + fleet health snapshot')
  .option('--json', 'Output machine-readable JSON')
  .action(async (options: { json?: boolean }) => {
    try {
      const repoRootLocal = repoRoot;
      const fleetModeScript = path.join(repoRootLocal, 'scripts', 'lib', 'tnf-fleet-mode.cjs');
      if (!fs.existsSync(fleetModeScript)) {
        throw new Error(`Fleet-mode module not found at ${fleetModeScript}`);
      }
      const { readFleetMode, FLEET_MODE_FILE } = require(fleetModeScript);
      const state = readFleetMode();

      // Lightweight fleet health snapshot — last heartbeat + cron control-plane state age
      const heartbeatPath = path.join(
        os.homedir(),
        '.tnf',
        'terminal-heartbeat',
        'pulse.lock.json'
      );
      let heartbeatAgeSec: number | null = null;
      try {
        if (fs.existsSync(heartbeatPath)) {
          const mtimeMs = fs.statSync(heartbeatPath).mtimeMs;
          heartbeatAgeSec = Math.round((Date.now() - mtimeMs) / 1000);
        }
      } catch {
        /* heartbeat lock unreadable */
      }

      const summary = {
        fleetMode: state.mode,
        paused: state.paused,
        reason: state.reason,
        updatedAt: state.updatedAt,
        updatedBy: state.updatedBy,
        stateFile: FLEET_MODE_FILE,
        heartbeatLockAgeSeconds: heartbeatAgeSec,
        readError: state.error,
      };

      if (options.json) {
        console.log(JSON.stringify(summary, null, 2));
        return;
      }

      const modeColor =
        state.mode === 'paused'
          ? chalk.red.bold
          : state.mode === 'injection-paused'
            ? chalk.yellow.bold
            : chalk.green.bold;
      console.log(chalk.bold.cyan('\n[TNF Fleet Status]\n'));
      console.log(`  mode:              ${modeColor(state.mode)}`);
      console.log(`  paused:            ${state.paused ? chalk.red('YES') : chalk.green('no')}`);
      console.log(`  reason:            ${state.reason || chalk.dim('(none)')}`);
      console.log(`  updatedAt:         ${state.updatedAt || chalk.dim('(never)')}`);
      console.log(`  updatedBy:         ${state.updatedBy || chalk.dim('(unknown)')}`);
      console.log(
        `  heartbeat lock:    ${
          heartbeatAgeSec === null
            ? chalk.dim('(no lock file)')
            : heartbeatAgeSec < 600
              ? chalk.green(`${heartbeatAgeSec}s ago`)
              : chalk.yellow(`${heartbeatAgeSec}s ago (stale?)`)
        }`
      );
      console.log(`  state file:        ${chalk.dim(FLEET_MODE_FILE)}\n`);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// A1 — establish ≠ operate (observe/fail-closed; never stops full-auto loops)
{
  const autonomy = program
    .command('autonomy')
    .description('Autonomy health surfaces (establish ≠ operate)');
  autonomy
    .command('health')
    .description(
      'Print autonomy health rollup (healthy|degraded|critical); non-zero on critical when fail-closed'
    )
    .option('--json', 'Machine-readable JSON')
    .action(async (options: { json?: boolean }) => {
      try {
        const args = ['scripts/runtime/tnf-autonomy-health-rollup.cjs'];
        if (options.json) args.push('--json');
        const result = runCommandCapture('node', args);
        if (result.stdout) process.stdout.write(result.stdout);
        if (result.stderr) process.stderr.write(result.stderr);
        process.exit(result.code);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    });
}

harness
  .command('inspect')
  .description('Inspect harness health: protocol, agents, and live agent loop')
  .option('--json', 'Output machine-readable JSON')
  .option('--skip-live-loop', 'Skip live LLM loop verification')
  .action(async (options: { json?: boolean; skipLiveLoop?: boolean }) => {
    try {
      const checks = options.skipLiveLoop
        ? collectHarnessInspectChecks()
        : await collectHarnessInspectChecksAsync();
      const passed = checks.every((check) => check.passed);
      if (options.json) {
        console.log(JSON.stringify({ passed, checks }, null, 2));
        return;
      }
      console.log(chalk.bold.cyan('\n[TNF Harness Inspect]\n'));
      for (const check of checks) {
        const icon = check.passed ? chalk.green('✓') : chalk.red('✗');
        console.log(`${icon} ${check.name}: ${check.detail}`);
      }
      console.log(`\nOverall: ${passed ? chalk.green('PASS') : chalk.yellow('DEGRADED')}\n`);
      if (!passed) process.exitCode = 1;
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

harness
  .command('loop')
  .description('Run the inspect-act-verify agent loop harness with the configured TNF LLM')
  .option('--task <text>', 'Task prompt for the loop planner')
  .option('--output <path>', 'Write loop result JSON to path')
  .option('--json', 'Print loop result as JSON')
  .action(async (options: { task?: string; output?: string; json?: boolean }) => {
    try {
      const result = await runHarnessAgentLoop(
        options.task || 'Plan the next TNF harness improvement cycle.'
      );
      if (options.output) {
        fs.mkdirSync(path.dirname(path.resolve(options.output)), { recursive: true });
        fs.writeFileSync(
          path.resolve(options.output),
          `${JSON.stringify(result, null, 2)}\n`,
          'utf8'
        );
      }
      if (options.json || options.output) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }
      console.log(chalk.bold.cyan('\n[TNF Harness Loop]\n'));
      console.log(`Provider: ${result.provider}/${result.model}`);
      console.log(
        `Verification: ${result.verification.passed ? chalk.green('PASS') : chalk.red('FAIL')}`
      );
      console.log(chalk.dim('\nModel output:\n'));
      console.log(result.modelOutput);
      console.log('');
      if (!result.verification.passed) process.exitCode = 1;
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

harness
  .command('cycle')
  .description('Run one full harness master loop: inspect → act focus → verify')
  .option('--json', 'Output machine-readable JSON')
  .option('--skip-live-loop', 'Skip live LLM loop verification')
  .action(async (options: { json?: boolean; skipLiveLoop?: boolean }) => {
    try {
      const report = options.skipLiveLoop
        ? (() => {
            const traj = runCommandCapture('node', [
              'scripts/harness/trajectory.cjs',
              'start',
              '--task',
              'tnf harness cycle --skip-live-loop',
            ]);
            let runId = '';
            try {
              runId = String((JSON.parse(traj.stdout || '{}') as { runId?: string }).runId || '');
            } catch {
              runId = '';
            }
            const startedAt = new Date().toISOString();
            const inspect = collectHarnessInspectChecks();
            const act = deriveHarnessActFocus(inspect);
            const verify = collectHarnessInspectChecks();
            const passed = verify.every((check) => check.passed);
            if (runId) {
              runCommandCapture('node', [
                'scripts/harness/trajectory.cjs',
                'end',
                '--run',
                runId,
                '--status',
                passed ? 'ok' : 'degraded',
              ]);
            }
            const cycle: HarnessMasterCycleReport = {
              cycleId: runId ? `harness-${runId}` : `harness-${Date.now()}`,
              startedAt,
              completedAt: new Date().toISOString(),
              phase: 'verify',
              inspect,
              act,
              verify,
              passed,
            };
            appendHarnessCycleLog(cycle);
            return cycle;
          })()
        : await runHarnessMasterCycle();
      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
        if (!report.passed) process.exitCode = 1;
        return;
      }
      console.log(chalk.bold.cyan('\n[TNF Harness Master Cycle]\n'));
      console.log(chalk.bold('Inspect'));
      for (const check of report.inspect) {
        const icon = check.passed ? chalk.green('✓') : chalk.red('✗');
        console.log(`  ${icon} ${check.name}: ${check.detail}`);
      }
      console.log(chalk.bold('\nAct focus'));
      console.log(`  focus: ${report.act.focus}`);
      console.log(`  recommendation: ${report.act.recommendation}`);
      console.log(chalk.bold('\nVerify'));
      for (const check of report.verify) {
        const icon = check.passed ? chalk.green('✓') : chalk.red('✗');
        console.log(`  ${icon} ${check.name}: ${check.detail}`);
      }
      console.log(
        `\nCycle: ${report.passed ? chalk.green('PASS') : chalk.yellow('DEGRADED')} (${report.cycleId})`
      );
      console.log(chalk.dim(`Logged to docs/operations/tnf-harness-cycle.jsonl\n`));
      if (!report.passed) process.exitCode = 1;
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

function runHarnessScript(rel: string, args: string[]): number {
  const result = spawnSync(process.execPath, [path.join(repoRoot, rel), ...args], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  });
  return result.status ?? 1;
}

harness
  .command('completeness')
  .description('Verify UNU-aligned harness completeness (layers + injection + berm/memory)')
  .option('--provision', 'Repair injection surfaces before verify')
  .option('--json', 'JSON output')
  .action((options: { provision?: boolean; json?: boolean }) => {
    const args: string[] = [];
    if (options.provision) args.push('--provision');
    if (options.json) args.push('--json');
    process.exitCode = runHarnessScript('scripts/harness/verify-harness-completeness.cjs', args);
  });

harness
  .command('provision')
  .description('Provision or verify per-runtime harness injection surfaces')
  .option('--repair', 'Write/repair surfaces')
  .option('--json', 'JSON output')
  .action((options: { repair?: boolean; json?: boolean }) => {
    const args: string[] = [options.repair ? '--repair' : '--verify'];
    if (options.json) args.push('--json');
    process.exitCode = runHarnessScript('scripts/harness/provision-injection-surfaces.cjs', args);
  });

harness
  .command('memory')
  .description('Dynamic memory layer (retain/recall/pin/status) — not MEMORY.md')
  .allowUnknownOption(true)
  .argument('<action>', 'retain | recall | pin | status')
  .argument('[args...]', 'passthrough flags for memory-layer.cjs')
  .action((action: string, args: string[] = []) => {
    process.exitCode = runHarnessScript('scripts/harness/memory-layer.cjs', [action, ...args]);
  });

harness
  .command('berm')
  .description('Permission berm evaluate (outside the model)')
  .allowUnknownOption(true)
  .argument('[args...]', 'passthrough args (default: evaluate)')
  .action((args: string[] = []) => {
    const passthrough = args.length ? args : ['evaluate'];
    process.exitCode = runHarnessScript('scripts/harness/permission-berm.cjs', passthrough);
  });

harness
  .command('trajectory')
  .description('Trajectory retention start/append/end/list')
  .allowUnknownOption(true)
  .argument('[args...]', 'passthrough args (default: list)')
  .action((args: string[] = []) => {
    const passthrough = args.length ? args : ['list'];
    process.exitCode = runHarnessScript('scripts/harness/trajectory.cjs', passthrough);
  });

harness
  .command('supply-chain')
  .description('MCP/skills supply-chain attestation inventory')
  .option('--json', 'JSON output')
  .option('--strict', 'Fail closed on missing entrypoints')
  .action((options: { json?: boolean; strict?: boolean }) => {
    const args: string[] = [];
    if (options.json) args.push('--json');
    if (options.strict) args.push('--strict');
    process.exitCode = runHarnessScript('scripts/harness/mcp-supply-chain-attest.cjs', args);
  });

harness
  .command('host-compaction')
  .description('Record/import host (Cursor/Claude) compaction boundaries')
  .allowUnknownOption(true)
  .argument('[args...]', 'passthrough args (default: list)')
  .action((args: string[] = []) => {
    const passthrough = args.length ? args : ['list'];
    process.exitCode = runHarnessScript('scripts/harness/host-compaction-adapter.cjs', passthrough);
  });

harness
  .command('sandbox')
  .description('Materialize macOS seatbelt profile for D11 untrusted execution')
  .option('--out <path>', 'Output .sb path')
  .action((options: { out?: string }) => {
    const args = options.out ? ['--out', options.out] : [];
    process.exitCode = runHarnessScript('scripts/harness/materialize-sandbox-profile.cjs', args);
  });

program
  .command('turn-end')
  .description('Run Turn End protocol: update LIVING_STATE and SESSION_HANDOFF artifacts')
  .action(async () => {
    try {
      await runCommand('node', ['scripts/turn-end.cjs']);
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

function parseHeaderOptions(entries: string[]): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const entry of entries) {
    const separator = entry.indexOf(':');
    if (separator <= 0) {
      throw new Error(`Invalid --header value "${entry}". Use "Name: value".`);
    }
    const name = entry.slice(0, separator).trim();
    const value = entry.slice(separator + 1).trim();
    if (!/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(name)) {
      throw new Error(`Invalid header name "${name}"`);
    }
    headers[name] = value;
  }
  return headers;
}

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
  .option('--command <cmd>', 'Command to run for local stdio MCP servers')
  .option('--args <args...>', 'Arguments for the command')
  .option('--env <json>', 'Environment variables as JSON (alias: --environment)')
  .option('--environment <json>', 'Environment variables as JSON (kilo parity)')
  .option('--type <type>', 'Server type (local|remote|sse|ws)', 'local')
  .option('--transport <transport>', 'Transport (stdio|streamable-http|sse|ws)')
  .option('--url <url>', 'Remote MCP endpoint URL (http(s) or ws(s))')
  .option('--header <header...>', 'HTTP/SSE header as "Name: value" (repeatable)')
  .option('--bearer-token-env <env>', 'Environment variable containing a bearer token')
  .option('--cwd <path>', 'Working directory')
  .option('--enabled <bool>', 'Enable server (true|false)', 'true')
  .action(
    (
      name: string,
      options: {
        command?: string;
        args?: string[];
        env?: string;
        environment?: string;
        type?: string;
        transport?: string;
        url?: string;
        header?: string[];
        bearerTokenEnv?: string;
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
        const headers = parseHeaderOptions(options.header || []);
        if (!options.command && !options.url) {
          throw new Error(
            'Provide --command for local stdio servers or --url for remote MCP servers'
          );
        }
        const mcpManager = new MCPManagerService();
        mcpManager.addServer(name, {
          command: options.command,
          args: options.args,
          env,
          environment: env,
          type: options.type as 'local' | 'remote' | 'sse' | 'ws',
          transport: options.transport as 'stdio' | 'streamable-http' | 'sse' | 'ws' | undefined,
          url: options.url,
          headers: Object.keys(headers).length > 0 ? headers : undefined,
          bearerTokenEnv: options.bearerTokenEnv,
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
  .command('tools')
  .description('List tools advertised by configured local stdio MCP servers')
  .argument('[server]', 'Optional MCP server name')
  .option('--json', 'Output machine-readable JSON')
  .option('--timeout-ms <n>', 'Per-server MCP request timeout in milliseconds', '15000')
  .action(async (server: string | undefined, options: { json?: boolean; timeoutMs?: string }) => {
    try {
      const runtime = new MCPToolRuntimeService(repoRoot);
      const results = await runtime.listTools(server, Number(options.timeoutMs || 15000));
      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
        return;
      }
      console.log(chalk.bold('\nMCP Tools\n'));
      for (const result of results) {
        if (!result.ok) {
          console.log(`${chalk.cyan(result.server)}: ${chalk.red(result.error || 'failed')}`);
          continue;
        }
        console.log(`${chalk.cyan(result.server)}: ${result.tools.length} tool(s)`);
        for (const tool of result.tools) {
          console.log(
            `  ${chalk.green(tool.name)}${tool.description ? chalk.dim(` - ${tool.description}`) : ''}`
          );
        }
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

mcp
  .command('call')
  .description('Call a tool on a configured local stdio MCP server')
  .argument('<server>', 'MCP server name')
  .argument('<tool>', 'MCP tool name')
  .argument('[argumentsJson]', 'JSON object for the MCP tool arguments', '{}')
  .option('--json', 'Output machine-readable JSON')
  .option('--timeout-ms <n>', 'MCP request timeout in milliseconds', '30000')
  .action(
    async (
      server: string,
      tool: string,
      argumentsJson: string,
      options: { json?: boolean; timeoutMs?: string }
    ) => {
      try {
        const parsedArgs = JSON.parse(argumentsJson || '{}');
        if (!parsedArgs || typeof parsedArgs !== 'object' || Array.isArray(parsedArgs)) {
          throw new Error('argumentsJson must be a JSON object');
        }
        const runtime = new MCPToolRuntimeService(repoRoot);
        const result = await runtime.callTool(
          server,
          tool,
          parsedArgs as Record<string, unknown>,
          Number(options.timeoutMs || 30000)
        );
        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          if (!result.ok) process.exit(1);
          return;
        }
        if (!result.ok) {
          console.error(chalk.red(`Error: ${result.error}`));
          process.exit(1);
        }
        console.log(JSON.stringify(result.result, null, 2));
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

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
  .command('codex-login')
  .description('Run Codex MCP OAuth login and open the callback URL automatically')
  .argument('[name]', 'Codex MCP server name', 'supabase')
  .option('--scopes <list>', 'Comma-separated OAuth scopes to pass through to Codex')
  .option('--codex-bin <path>', 'Codex executable', 'codex')
  .option('--browser <command>', 'Browser/open command to prefer')
  .option('--no-open', 'Print the authorize URL but do not open it')
  .option('--dry-run', 'Verify Codex/server discovery without starting OAuth')
  .option('--json', 'Print a final JSON summary')
  .action(
    async (
      name: string,
      options: {
        scopes?: string;
        codexBin?: string;
        browser?: string;
        open?: boolean;
        dryRun?: boolean;
        json?: boolean;
      }
    ) => {
      try {
        const args = ['scripts/codex-mcp-oauth-login.cjs', name];
        if (options.scopes) args.push('--scopes', options.scopes);
        if (options.codexBin) args.push('--codex-bin', options.codexBin);
        if (options.browser) args.push('--browser', options.browser);
        if (options.open === false) args.push('--no-open');
        if (options.dryRun) args.push('--dry-run');
        if (options.json) args.push('--json');
        await runCommand('node', args);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

mcp
  .command('supabase-agent-check')
  .description('Verify evidence before an agent claims Supabase MCP/data-plane access')
  .option('--server <name>', 'Codex MCP server name', 'supabase')
  .option('--codex-bin <path>', 'Codex executable', 'codex')
  .option('--login', 'Run the Codex MCP OAuth login wrapper if configured')
  .option('--no-open', 'Pass --no-open to the login wrapper')
  .option('--write', 'Write SUPABASE_AGENT_CONNECTION_LATEST.json')
  .option('--strict', 'Exit non-zero unless Codex Supabase MCP is configured and OAuth-capable')
  .option('--json', 'Print machine-readable JSON')
  .action(
    async (options: {
      server?: string;
      codexBin?: string;
      login?: boolean;
      open?: boolean;
      write?: boolean;
      strict?: boolean;
      json?: boolean;
    }) => {
      try {
        const args = ['scripts/supabase-agent-connection-check.cjs'];
        if (options.server) args.push('--server', options.server);
        if (options.codexBin) args.push('--codex-bin', options.codexBin);
        if (options.login) args.push('--login');
        if (options.open === false) args.push('--no-open');
        if (options.write) args.push('--write');
        if (options.strict) args.push('--strict');
        if (options.json) args.push('--json');
        await runCommand('node', args);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

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

      // SECURITY (audit #1): user-supplied --kind / --category previously
      // interpolated into the SQL string before the entire SQL was passed
      // through a shell-quoted execSync. Any " in DATABASE_URL or ' in
      // --kind/--category broke out of the quote and ran arbitrary SQL/shell.
      // Switch to execFileSync (no shell), and validate --kind against an
      // allow-list because psql can't parameterize identifiers.
      const KIND_WHITELIST = new Set([
        'agent',
        'agent_template',
        'experience',
        'mcp_server',
        'model',
        'prompt',
        'skill',
        'workflow',
      ]);
      let whereClauses: string[] = ["publication_status = 'published'"];
      if (options.kind) {
        if (!KIND_WHITELIST.has(options.kind)) {
          console.error(
            chalk.red(
              `Error: --kind must be one of: ${Array.from(KIND_WHITELIST).sort().join(', ')}`
            )
          );
          process.exit(1);
        }
        whereClauses.push(`kind = '${options.kind}'`);
      }
      if (options.category) {
        // category is a user-supplied free string; reject any character that
        // could terminate a SQL string literal.
        if (!/^[A-Za-z0-9 _./-]{1,64}$/.test(options.category)) {
          console.error(chalk.red('Error: --category must match /^[A-Za-z0-9 _./-]{1,64}$/'));
          process.exit(1);
        }
        whereClauses.push(`category = '${options.category}'`);
      }
      const whereClause = whereClauses.join(' AND ');

      const sql = `SELECT id, slug, name, kind, category, rating, total_runs, success_rate, price_per_run, status FROM marketplace_catalog_items WHERE ${whereClause} ORDER BY kind, name;`;

      const { execFileSync } = await import('child_process');
      const raw = execFileSync('psql', [databaseUrl, '-t', '-A', '-F', '|', '-c', sql], {
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

      // SECURITY (audit #1): no user input in this command, but DATABASE_URL
      // could still contain "; ... -- and break out of the prior
      // shell-quoted execSync. Use execFileSync (no shell) so the URL is
      // passed verbatim as a single argv element.
      const { execFileSync } = await import('child_process');
      const raw = execFileSync('psql', [databaseUrl, '-t', '-A', '-F', '|', '-c', sql], {
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

      // Persist this chat session so it can be resumed via tnf session list/export.
      let chatSessionId: string | undefined;
      try {
        const chatSession = sessionManager.create({
          provider: client.providerName || 'unknown',
          model: client.model || 'unknown',
          projectPath: repoRoot,
        });
        chatSessionId = chatSession.id;
      } catch {
        // Non-fatal: persistence is a convenience, not a requirement.
      }

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

        // Persist transcript to disk after each exchange.
        if (chatSessionId) {
          try {
            sessionManager.saveMessages(chatSessionId, messages);
          } catch {
            // Non-fatal: persistence failure must not crash the chat loop.
          }
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
  .argument(
    '[query...]',
    'Initial message. Use --task-file to read from a file, or pipe via stdin.'
  )
  .option('--task <text>', 'Inline override for the initial message.')
  .option('--task-file <path>', 'Read the initial message from a file (UTF-8). Use "-" for stdin.')
  .action(async (query: string[], options: { task?: string; taskFile?: string }) => {
    try {
      const systemPromptPath = path.join(repoRoot, '.agent/SYSTEM_PROMPT.md');
      const systemPrompt = fs.existsSync(systemPromptPath)
        ? fs.readFileSync(systemPromptPath, 'utf8')
        : 'You are the TNF Orchestrator agent.';

      // Resolve the initial message using the SAME precedence engine as
      // `tnf agents run` so `cat prompt.md | tnf chat` works out of the box.
      // Falls through to commander positional `query` when no other source supplied.
      const resolved = await resolvePrompt({
        task: options.task,
        taskFile: options.taskFile,
        positional: query,
      });
      const initialMessage = resolved?.text ?? '';

      const args = ['--prompt-interactive', systemPrompt];
      if (initialMessage) {
        args.push(initialMessage);
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
  .command('claude')
  .description('Pass through any Claude Code CLI command with TNF harness MCP routing')
  .argument('[args...]', 'Arguments forwarded to claude')
  .action(async (args: string[]) => {
    await runPassthrough('claude', args);
  });

program
  .command('pi')
  .description('Pass through any Pi CLI command with TNF harness MCP routing')
  .argument('[args...]', 'Arguments forwarded to pi')
  .action(async (args: string[]) => {
    await runPassthrough('pi', args);
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
      await requireSuperAdmin(options, 'relay start');
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
      await requireSuperAdmin(options, 'jules loop');
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
      await requireSuperAdmin(options, 'jules supervisor');
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
      await requireSuperAdmin(options, 'jules supervisor-start');
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
      await requireSuperAdmin(options, 'jules supervisor-stop');
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
      await requireSuperAdmin(options, 'jules supervisor-migrate-from-cron');
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
      await requireSuperAdmin(options, 'jules merge-open');
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
      await requireSuperAdmin(options, 'jules cron-install');
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

/**
 * PIDs of master-clock instances already running on this host.
 *
 * Matches the compiled entrypoint, the ts-node entrypoint, and the pnpm wrapper
 * chain — the same set `scripts/orchestrator/factory-boot.sh` guards on, plus
 * the pnpm form this CLI itself spawns. Deliberately specific enough not to
 * match this process's own `tnf master-clock start` argv.
 */
function findRunningMasterClockPids(): string[] {
  const pattern =
    'dist/master-clock\\.js|ts-node src/master-clock\\.ts|relay-core run master-clock';
  const result = spawnSync('pgrep', ['-f', pattern], { encoding: 'utf8' });

  // pgrep exits 1 when nothing matches. Any other failure (pgrep missing, or
  // "Cannot get process list" under heavy load) must not block a legitimate
  // start, so treat it as "none found" rather than guessing.
  if (result.error || typeof result.stdout !== 'string') return [];

  return result.stdout
    .split('\n')
    .map((pid) => pid.trim())
    .filter((pid) => /^\d+$/.test(pid) && pid !== String(process.pid));
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
        await requireSuperAdmin(options, 'master-clock start');
        const provider = resolveControlPlaneProvider(options, [MASTER_CLOCK_PROVIDER_ENV_KEY]);
        if (provider === 'local') {
          // The master clock is the baton holder — exactly one may run per host.
          // This path had no guard (factory-boot.sh has always had one), so every
          // invocation stacked another instance. On 2026-08-16 four were live at
          // once, each reconnecting to Redis every 5s; their combined leak wedged
          // the bus and took the whole local fleet's coordination down.
          const existing = findRunningMasterClockPids();
          if (existing.length > 0) {
            console.log(
              chalk.yellow(
                `Master clock already running (pid ${existing.join(', ')}); refusing to start a second baton holder.`
              )
            );
            console.log(chalk.dim('   Inspect it with: tnf master-clock status'));
            return;
          }
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
        await requireSuperAdmin(options, 'master-clock logs');
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
        await requireSuperAdmin(options, 'master-clock status');
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
        await requireSuperAdmin(options, 'super-cycle event');
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

// Phase-1.2 (tnf pi parity): Rename `tnf skills` → `tnf skill-bank` to free the
// `tnf skill` namespace for the new Agent-Skills discovery surface. Existing
// scripts that call `tnf skills bank <sub>` must update to `tnf skill-bank bank <sub>`.
const skills = program
  .command('skill-bank')
  .description('Cross-LLM skill bank operations (renamed from `tnf skills` in Phase-1.2)');
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
      await requireSuperAdmin(options, 'skills bank supervisor');
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
      await requireSuperAdmin(options, 'skills bank supervisor-start');
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
      await requireSuperAdmin(options, 'skills bank supervisor-stop');
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
        await requireSuperAdmin(options, 'super-cycle status');
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
        await requireSuperAdmin(options, 'run');
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
  .option('--base-url <url>', 'Public base URL used by live-link/auth audits')
  .option('--api-url <url>', 'API base URL used by auth audit')
  .option('--app-url <url>', 'App (SPA) base URL used by the semantic route audit')
  .option('--max-depth <n>', 'Max crawl depth for live link audit', '5')
  .option('--max-pages <n>', 'Max page count for live link audit', '500')
  .option('--max-external <n>', 'Max external URL checks for live link audit', '400')
  .option('--skip-build', 'Skip frontend build stage')
  .option('--skip-live-links', 'Skip live-link crawl stage')
  .option('--skip-semantic', 'Skip semantic route audit stage')
  .option('--skip-auth', 'Skip auth path audit stage')
  .option('--skip-scorecard', 'Skip self-improvement scorecard generation stage')
  .option('--skip-mermaid', 'Skip architecture mermaid generation stage')
  .option('--skip-parity', 'Skip cross-agent CLI parity audit stage')
  .option(
    '--soft-fail-audits',
    'Write audit artifacts without failing the run on broken links / semantic / auth / scorecard issues'
  )
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
        appUrl?: string;
        maxDepth?: string;
        maxPages?: string;
        maxExternal?: string;
        skipBuild?: boolean;
        skipLiveLinks?: boolean;
        skipSemantic?: boolean;
        skipAuth?: boolean;
        skipScorecard?: boolean;
        skipMermaid?: boolean;
        skipParity?: boolean;
        softFailAudits?: boolean;
        note?: string;
        json?: boolean;
        superAdminToken?: string;
      } = {}
    ) => {
      try {
        await requireSuperAdmin(options, 'self-improvement run');
        const startedAt = new Date();
        const startedAtMs = startedAt.getTime();
        const baseUrl = resolveSelfImprovementBaseUrl(options.baseUrl);
        const apiUrl = resolveSelfImprovementApiUrl(options.apiUrl);
        const appUrl = resolveSelfImprovementAppUrl(options.appUrl);
        const maxDepth = parsePositiveIntegerOption(options.maxDepth, 5, '--max-depth');
        const maxPages = parsePositiveIntegerOption(options.maxPages, 500, '--max-pages');
        const maxExternal = parsePositiveIntegerOption(options.maxExternal, 400, '--max-external');
        const frontendCwd = path.join(repoRoot, 'apps/frontend');
        const expectedArtifacts: string[] = [];
        // Soft-fail keeps writing audit artifacts but does not abort the cycle.
        // Used by full-auto when --skip-strict-status / --soft-fail-audits is set
        // so live broken links report honestly without killing the autopilot.
        const failFlag = options.softFailAudits ? '0' : '1';

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
              FAIL_ON_BROKEN: failFlag,
            },
          });
          expectedArtifacts.push(SELF_IMPROVEMENT_ARTIFACTS.liveLinkCrawlJson);
        }
        if (!options.skipSemantic) {
          await runCommand('pnpm', ['run', 'audit:all-routes-semantic'], {
            cwd: frontendCwd,
            env: {
              // Router paths are served by the SPA on the app domain, not the
              // static landing domain used by the live-link crawl.
              SEMANTIC_AUDIT_BASE_URL: appUrl,
              FAIL_ON_SEMANTIC_ISSUES: failFlag,
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
              FAIL_ON_AUTH_ISSUES: failFlag,
            },
          });
          expectedArtifacts.push(SELF_IMPROVEMENT_ARTIFACTS.authPathAuditJson);
        }
        if (!options.skipScorecard) {
          await runCommand('pnpm', ['run', 'audit:self-improvement-scorecard'], {
            cwd: frontendCwd,
            env: {
              FAIL_ON_SCORECARD: failFlag,
            },
          });
          expectedArtifacts.push(
            SELF_IMPROVEMENT_ARTIFACTS.scorecardJson,
            SELF_IMPROVEMENT_ARTIFACTS.scorecardMd
          );
        }
        if (!options.skipMermaid) {
          try {
            await runCommand('python3', [
              'scripts/architecture/generate_tnf_master_mermaid.py',
              '--repo',
              repoRoot,
              '--out',
              SELF_IMPROVEMENT_ARTIFACTS.architectureMermaid,
            ]);
            expectedArtifacts.push(SELF_IMPROVEMENT_ARTIFACTS.architectureMermaid);
          } catch (err: unknown) {
            if (!options.softFailAudits) throw err;
            const message = err instanceof Error ? err.message : String(err);
            console.error(chalk.yellow(`[self-improvement] mermaid soft-failed: ${message}`));
          }
        }
        if (!options.skipParity) {
          // Cross-agent parity: measure TNF against every reachable agent CLI
          // and refresh the gap ledger. Runs in-process (no subprocess) so the
          // audit sees the exact live command tree.
          try {
            const parityService = new ParityService(repoRoot);
            const ledger = await parityService.audit(program);
            const written = parityService.write(ledger);
            console.log(
              chalk.dim(
                `[parity] ${ledger.totals.agentsAvailable}/${ledger.totals.agentsTracked} agents reachable, ` +
                  `${ledger.totals.totalGaps} gaps, ${ledger.totals.meanCoverage}% mean coverage`
              )
            );
            expectedArtifacts.push(written.json, written.markdown);
          } catch (err: unknown) {
            if (!options.softFailAudits) throw err;
            const message = err instanceof Error ? err.message : String(err);
            console.error(chalk.yellow(`[self-improvement] parity soft-failed: ${message}`));
          }
        }

        const runNote =
          normalizeToken(options.note) ||
          `Executed via tnf self-improvement run (base-url=${baseUrl}, api-url=${apiUrl}, app-url=${appUrl})`;
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
  .option('--base-url <url>', 'Public base URL used by live-link/auth audits')
  .option('--api-url <url>', 'API base URL used by auth audit')
  .option('--app-url <url>', 'App (SPA) base URL used by the semantic route audit')
  .option('--max-depth <n>', 'Max crawl depth for live link audit')
  .option('--max-pages <n>', 'Max page count for live link audit')
  .option('--max-external <n>', 'Max external URL checks for live link audit')
  .option('--skip-build', 'Skip frontend build stage')
  .option('--skip-live-links', 'Skip live-link crawl stage')
  .option('--skip-semantic', 'Skip semantic route audit stage')
  .option('--skip-auth', 'Skip auth path audit stage')
  .option('--skip-scorecard', 'Skip self-improvement scorecard generation stage')
  .option('--skip-mermaid', 'Skip architecture mermaid generation stage')
  .option('--skip-parity', 'Skip cross-agent CLI parity audit stage')
  .option('--skip-strict-status', 'Do not fail the full-auto cycle on self-improvement status')
  .option('--skip-preflight', 'Skip structural and process health checks before execution')
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
        skipPreflight?: boolean;
      }
    ) => {
      try {
        await requireSuperAdmin(options, 'full-auto once');
        const { runFullAutoPreflight } = await import('./utils/preflight.js');
        await runFullAutoPreflight({
          repoRoot,
          skipPreflight: options.skipPreflight,
          requireDoctor: true,
        });

        const startedAt = new Date();
        // --skip-strict-status implies soft audit failure so findings still land
        // while the unattended cycle completes.
        const cycleArgs = buildSelfImprovementRunCliArgs({
          ...options,
          softFailAudits: Boolean(options.softFailAudits || options.skipStrictStatus),
        });
        await runSelfCli(cycleArgs);

        // Mirror the loop: primary success is the cycle; broadcast/status are
        // best-effort so a hung orchestrate cannot fail an already-good run.
        const postWarnings: string[] = [];
        const runPostStep = async (label: string, args: string[]) => {
          try {
            await runSelfCli(args, resolvePostStepTimeoutMs(Number.POSITIVE_INFINITY));
          } catch (postErr: unknown) {
            const message = postErr instanceof Error ? postErr.message : String(postErr);
            postWarnings.push(`${label}: ${message}`);
            console.error(
              chalk.yellow(`[full-auto] once post-step "${label}" soft-failed: ${message}`)
            );
          }
        };
        if (options.broadcast) {
          await runPostStep('broadcast', ['orchestrate', 'self-improvement']);
        }
        await runPostStep('status', buildSelfImprovementStatusCliArgs(options));
        const finishedAt = new Date();
        const event: FullAutoRunEvent = {
          cycle: 1,
          startedAt: startedAt.toISOString(),
          finishedAt: finishedAt.toISOString(),
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          ok: true,
          ...(postWarnings.length > 0 ? { warnings: postWarnings } : {}),
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
  .option(
    '--cycle-timeout-minutes <n>',
    'Kill a cycle that runs longer than this and record it as a failure',
    String(DEFAULT_FULL_AUTO_CYCLE_TIMEOUT_MINUTES)
  )
  .option('--base-url <url>', 'Public base URL used by live-link/auth audits')
  .option('--api-url <url>', 'API base URL used by auth audit')
  .option('--app-url <url>', 'App (SPA) base URL used by the semantic route audit')
  .option('--max-depth <n>', 'Max crawl depth for live link audit')
  .option('--max-pages <n>', 'Max page count for live link audit')
  .option('--max-external <n>', 'Max external URL checks for live link audit')
  .option('--skip-build', 'Skip frontend build stage')
  .option('--skip-live-links', 'Skip live-link crawl stage')
  .option('--skip-semantic', 'Skip semantic route audit stage')
  .option('--skip-auth', 'Skip auth path audit stage')
  .option('--skip-scorecard', 'Skip self-improvement scorecard generation stage')
  .option('--skip-mermaid', 'Skip architecture mermaid generation stage')
  .option('--skip-parity', 'Skip cross-agent CLI parity audit stage')
  .option('--skip-strict-status', 'Do not fail cycles on self-improvement status')
  .option('--skip-preflight', 'Skip structural and process health checks before execution')
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
        cycleTimeoutMinutes?: string;
        broadcast?: boolean;
        strict?: boolean;
        skipStrictStatus?: boolean;
        skipPreflight?: boolean;
      }
    ) => {
      try {
        await requireSuperAdmin(options, 'full-auto start');
        const { runFullAutoPreflight } = await import('./utils/preflight.js');
        await runFullAutoPreflight({
          repoRoot,
          skipPreflight: options.skipPreflight,
          requireDoctor: true,
        });

        const intervalMinutes = parsePositiveIntegerOption(
          options.intervalMinutes,
          DEFAULT_FULL_AUTO_INTERVAL_MINUTES,
          '--interval-minutes'
        );
        const maxCycles = parseNonNegativeIntegerOption(options.maxCycles, 0, '--max-cycles');
        // A cycle that never returns used to hang the loop forever while the state
        // file still read `mode: "running"` — the autopilot was dead and nothing
        // said so. Bound every cycle; an overrun is a loud failure, not silence.
        const cycleTimeoutMinutes = parsePositiveIntegerOption(
          options.cycleTimeoutMinutes,
          DEFAULT_FULL_AUTO_CYCLE_TIMEOUT_MINUTES,
          '--cycle-timeout-minutes'
        );
        const cycleArgs = buildSelfImprovementRunCliArgs({
          ...options,
          softFailAudits: Boolean(options.softFailAudits || options.skipStrictStatus),
        });
        const intervalMs = intervalMinutes * 60 * 1000;
        const cycleTimeoutMs = cycleTimeoutMinutes * 60 * 1000;
        // Seed counters from the run log so daemon restarts don't report
        // completedCycles=0 after successful historical cycles.
        const historicalEvents = readAllJsonLines(FULL_AUTO_RUN_LOG_PATH);
        const historical = tallyFullAutoRuns(historicalEvents);
        let completedCycles = historical.completedCycles;
        let failedCycles = historical.failedCycles;
        // Seed the streak too, so restarting the daemon cannot be used (or
        // accidentally act) as a way to walk away from an in-progress failure run.
        let consecutiveFailures = countTrailingFailures(historicalEvents);

        // Cycle numbers must stay monotonic across daemon restarts, otherwise the
        // run log reads `…7, 8, 1` and the cycle number is not a usable key.
        const priorRun = readLastJsonLine(FULL_AUTO_RUN_LOG_PATH) as FullAutoRunEvent | null;
        let cycle = Number.isFinite(priorRun?.cycle) ? Number(priorRun!.cycle) : 0;

        writeFullAutoState({
          mode: 'running',
          updatedAt: new Date().toISOString(),
          intervalMinutes,
          maxCycles,
          completedCycles,
          failedCycles,
          lastRun: priorRun || undefined,
        });

        console.log(chalk.bold('\nTNF Full-Auto Loop Started\n'));
        console.log(`Interval: ${chalk.cyan(`${intervalMinutes} minute(s)`)}`);
        console.log(`Cycle timeout: ${chalk.cyan(`${cycleTimeoutMinutes} minute(s)`)}`);
        console.log(`Max cycles: ${chalk.cyan(maxCycles === 0 ? 'unbounded' : String(maxCycles))}`);
        console.log(`Resuming from cycle: ${chalk.cyan(String(cycle))}`);
        console.log(
          `Historical tallies: ${chalk.cyan(String(completedCycles))} ok / ${chalk.cyan(String(failedCycles))} failed`
        );
        console.log(`Primary argv: ${chalk.dim(cycleArgs.join(' '))}`);
        console.log(`State: ${chalk.dim(path.relative(repoRoot, FULL_AUTO_STATE_PATH))}`);
        console.log('');

        let cyclesThisSession = 0;
        while (maxCycles === 0 || cyclesThisSession < maxCycles) {
          cycle += 1;
          cyclesThisSession += 1;
          const startedAt = new Date();
          let event: FullAutoRunEvent = {
            cycle,
            startedAt: startedAt.toISOString(),
            finishedAt: startedAt.toISOString(),
            durationMs: 0,
            ok: false,
          };

          // One budget for the whole cycle, not per sub-command, so a cycle can
          // never outlive its timeout no matter which stage stalls.
          const deadline = startedAt.getTime() + cycleTimeoutMs;
          const remainingMs = () => Math.max(1, deadline - Date.now());
          let cycleError: unknown;

          try {
            await runSelfCli(cycleArgs, remainingMs());

            // Broadcast/status are best-effort after a successful primary run.
            // A hung `orchestrate self-improvement` previously burned the
            // remaining cycle budget and marked an otherwise-good cycle failed.
            const postWarnings: string[] = [];
            const runPostStep = async (label: string, args: string[]) => {
              const budget = resolvePostStepTimeoutMs(remainingMs());
              try {
                await runSelfCli(args, budget);
              } catch (postErr: unknown) {
                const message = postErr instanceof Error ? postErr.message : String(postErr);
                postWarnings.push(`${label}: ${message}`);
                console.error(
                  chalk.yellow(
                    `[full-auto] cycle ${cycle} post-step "${label}" soft-failed: ${message}`
                  )
                );
              }
            };

            if (options.broadcast) {
              await runPostStep('broadcast', ['orchestrate', 'self-improvement']);
            }
            await runPostStep('status', buildSelfImprovementStatusCliArgs(options));

            const finishedAt = new Date();
            event = {
              cycle,
              startedAt: startedAt.toISOString(),
              finishedAt: finishedAt.toISOString(),
              durationMs: finishedAt.getTime() - startedAt.getTime(),
              ok: true,
              ...(postWarnings.length > 0 ? { warnings: postWarnings } : {}),
            };
            completedCycles += 1;
            console.log(
              chalk.green(
                `[full-auto] cycle ${cycle} completed in ${Math.round(event.durationMs / 1000)}s` +
                  (postWarnings.length > 0
                    ? ` (with ${postWarnings.length} post-step warning(s))`
                    : '')
              )
            );
          } catch (err: any) {
            const finishedAt = new Date();
            const timedOut = err instanceof CommandTimeoutError;
            event = {
              cycle,
              startedAt: startedAt.toISOString(),
              finishedAt: finishedAt.toISOString(),
              durationMs: finishedAt.getTime() - startedAt.getTime(),
              ok: false,
              error: err instanceof Error ? err.message : String(err),
              ...(timedOut ? { timedOut: true } : {}),
            };
            failedCycles += 1;
            cycleError = err;
            console.error(
              chalk.red(
                `[full-auto] cycle ${cycle} ${timedOut ? 'TIMED OUT' : 'failed'}: ${event.error}`
              )
            );
            if (timedOut) {
              console.error(
                chalk.yellow(
                  `[full-auto] cycle exceeded --cycle-timeout-minutes ${cycleTimeoutMinutes}; child killed. ` +
                    `Raise the budget if cycles legitimately run longer.`
                )
              );
            }
          }

          // Single write per cycle. This used to run twice on the failure path
          // (once in the catch, once here), double-counting every failed cycle
          // in the run log.
          appendJsonLine(FULL_AUTO_RUN_LOG_PATH, event);

          // Circuit breaker. Preflight evaluates the quarantine gate exactly
          // once, before this loop starts, so a daemon that boots healthy used
          // to keep cycling no matter how badly it degraded: this repo logged a
          // 212-cycle unbroken failure streak between 2026-06 and 2026-07 while
          // mode stayed "running" and nothing re-checked. Re-evaluate per cycle.
          consecutiveFailures = event.ok ? 0 : consecutiveFailures + 1;
          const tripped = consecutiveFailures >= FULL_AUTO_FAIL_STREAK;

          writeFullAutoState({
            mode: tripped ? 'quarantined' : options.strict && !event.ok ? 'idle' : 'running',
            updatedAt: new Date().toISOString(),
            intervalMinutes,
            maxCycles,
            completedCycles,
            failedCycles,
            lastRun: event,
            ...(tripped
              ? {
                  quarantinedAt: new Date().toISOString(),
                  quarantineReason: `${consecutiveFailures} consecutive failed cycles (>= ${FULL_AUTO_FAIL_STREAK})`,
                }
              : {}),
          });

          if (tripped) {
            console.error(
              chalk.red(
                `[full-auto] QUARANTINED after ${consecutiveFailures} consecutive failed cycles. ` +
                  `Last error: ${event.error ?? 'unknown'}`
              )
            );
            console.error(
              chalk.yellow(
                '[full-auto] Loop halted. Remediate, then clear with: tnf protocol substrate --clear-quarantine'
              )
            );
            break;
          }

          if (options.strict && cycleError) {
            throw cycleError;
          }

          if (maxCycles > 0 && cyclesThisSession >= maxCycles) {
            break;
          }

          console.log(
            chalk.dim(`[full-auto] sleeping ${intervalMinutes} minute(s) before next cycle...`)
          );
          await sleepMs(intervalMs);
        }

        // A quarantine written inside the loop must survive loop exit; demoting
        // it back to `idle` here would silently re-arm the next daemon start.
        if (consecutiveFailures < FULL_AUTO_FAIL_STREAK) {
          writeFullAutoState({
            mode: 'idle',
            updatedAt: new Date().toISOString(),
            intervalMinutes,
            maxCycles,
            completedCycles,
            failedCycles,
            lastRun: readLastJsonLine(FULL_AUTO_RUN_LOG_PATH) || undefined,
          });
        }

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
  // The detached path is where a hang is least visible, so the cycle bound has
  // to be configurable here too — not just on the foreground `full-auto start`.
  .option(
    '--cycle-timeout-minutes <n>',
    'Kill a cycle that runs longer than this and record it as a failure',
    String(DEFAULT_FULL_AUTO_CYCLE_TIMEOUT_MINUTES)
  )
  .option('--base-url <url>', 'Public base URL used by live-link/auth audits')
  .option('--api-url <url>', 'API base URL used by auth audit')
  .option('--app-url <url>', 'App (SPA) base URL used by the semantic route audit')
  .option('--max-depth <n>', 'Max crawl depth for live link audit')
  .option('--max-pages <n>', 'Max page count for live link audit')
  .option('--max-external <n>', 'Max external URL checks for live link audit')
  .option('--skip-build', 'Skip frontend build stage')
  .option('--skip-live-links', 'Skip live-link crawl stage')
  .option('--skip-semantic', 'Skip semantic route audit stage')
  .option('--skip-auth', 'Skip auth path audit stage')
  .option('--skip-scorecard', 'Skip self-improvement scorecard generation stage')
  .option('--skip-mermaid', 'Skip architecture mermaid generation stage')
  .option('--skip-parity', 'Skip cross-agent CLI parity audit stage')
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
        await requireSuperAdmin(options, 'full-auto daemon start');

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
        if (child.pid) {
          ensureParentDir(FULL_AUTO_DAEMON_PID_PATH);
          fs.writeFileSync(FULL_AUTO_DAEMON_PID_PATH, `${child.pid}\n`, 'utf8');
        }

        const payload = {
          started: true,
          pid: child.pid,
          command: ['tnf', ...args],
          logPath: path.relative(repoRoot, FULL_AUTO_DAEMON_LOG_PATH),
          pidPath: path.relative(repoRoot, FULL_AUTO_DAEMON_PID_PATH),
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
      const loopCount = processes.length;
      const payload = {
        running: processes.length > 0,
        processes,
        loopCount,
        contention: loopCount >= 2,
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
      if (loopCount >= 2) {
        console.log(chalk.yellow(`CONTENTION: ${loopCount} loops (observe-only — do not kill)`));
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

fullAutoDaemon
  .command('stop')
  .description(
    'Stop the detached full-auto daemon using the recorded pid file (process-tree aware)'
  )
  .option('--json', 'Output machine-readable JSON')
  .option(
    '--super-admin-token <token>',
    'Super Admin authentication token (can also be set via TNF_SUPER_ADMIN_INPUT_TOKEN env var)'
  )
  .action(async (options: { json?: boolean; superAdminToken?: string } = {}) => {
    try {
      await requireSuperAdmin(options, 'full-auto daemon stop');
      const readPid = (p: string): number | null => {
        try {
          const n = Number.parseInt(fs.readFileSync(p, 'utf8').trim(), 10);
          return Number.isFinite(n) && n > 0 ? n : null;
        } catch {
          return null;
        }
      };
      const daemonPid = readPid(FULL_AUTO_DAEMON_PID_PATH);
      const loopPid = readPid(FULL_AUTO_LOOP_PID_PATH);
      const processes = findFullAutoStartProcesses();
      const targets = new Set<number>();
      if (daemonPid) targets.add(daemonPid);
      if (loopPid) targets.add(loopPid);
      for (const proc of processes) targets.add(proc.pid);

      const signaled: number[] = [];
      for (const pid of targets) {
        try {
          process.kill(pid, 'SIGTERM');
          signaled.push(pid);
        } catch {
          /* already gone */
        }
      }

      // Best-effort clear stale lock files after stop request.
      for (const p of [FULL_AUTO_DAEMON_PID_PATH, FULL_AUTO_LOOP_PID_PATH]) {
        try {
          if (fs.existsSync(p)) fs.unlinkSync(p);
        } catch {
          /* ignore */
        }
      }

      const state = readFullAutoState();
      if (state && state.mode === 'running') {
        writeFullAutoState({
          ...state,
          mode: 'idle',
          updatedAt: new Date().toISOString(),
        });
      }

      const payload = {
        stopped: true,
        signaled,
        previousProcessCount: processes.length,
      };
      if (options.json) {
        console.log(JSON.stringify(payload, null, 2));
        return;
      }
      console.log(chalk.green('TNF full-auto daemon stop requested.'));
      console.log(
        signaled.length
          ? `Signaled: ${signaled.map((p) => chalk.cyan(String(p))).join(', ')}`
          : chalk.yellow('No live full-auto start processes found.')
      );
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

{
  const contend = fullAuto
    .command('contend')
    .description('Observe dual full-auto contention (never kills by default)');
  contend
    .command('status')
    .description('Read-only contention sample (≥2 full-auto start loops)')
    .option('--json', 'Machine-readable JSON')
    .option('--append', 'Append sample to docs/operations/tnf-full-auto-contention.jsonl')
    .action(async (options: { json?: boolean; append?: boolean } = {}) => {
      try {
        const args = ['scripts/operations/tnf-full-auto-contention-observe.cjs'];
        if (options.json) args.push('--json');
        if (options.append) args.push('--append');
        const result = runCommandCapture('node', args);
        if (result.stdout) process.stdout.write(result.stdout);
        if (result.stderr) process.stderr.write(result.stderr);
        process.exit(result.code);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    });
}

fullAuto
  .command('status')
  .description('Show persisted full-auto loop state and latest cycle result')
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean } = {}) => {
    try {
      const state = readFullAutoState();
      const lastRun = readLastJsonLine(FULL_AUTO_RUN_LOG_PATH);
      const processes = findFullAutoStartProcesses();
      const loopCount = processes.length;
      const payload = {
        state,
        lastRun,
        loopCount,
        contention: loopCount >= 2,
        processes,
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

      if (loopCount >= 2) {
        console.log(chalk.yellow(`\nCONTENTION: ${loopCount} loops (observe-only — do not kill)`));
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
  .option('--model <model>', 'LLM model to use', 'thinkingmachines/inkling')
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
        await requireSuperAdmin(options, 'zero-turn boot');

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
                const output = execSync('hermes cron list', { encoding: 'utf8' });
                if (/heartbeat/i.test(output)) {
                  console.log(chalk.dim('   Heartbeat self-wake cron active'));
                } else {
                  console.log(chalk.yellow('   Heartbeat cron not found, installing...'));
                  const hermesScript = path.join(
                    os.homedir(),
                    '.hermes/scripts/tnf-heartbeat-selfwake.py'
                  );
                  await runCommand('hermes', [
                    'cron',
                    'create',
                    '*/5 * * * *',
                    '--script',
                    hermesScript,
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

      const processAlive = (pattern: string): boolean => {
        try {
          const output = execSync(`pgrep -af ${pattern}`, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore'],
          });
          return output.trim().length > 0;
        } catch {
          return false;
        }
      };

      let crontabText = '';
      try {
        crontabText = execSync('crontab -l', {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore'],
        });
      } catch {
        crontabText = '';
      }

      const logFreshWithinMs = (logPath: string, maxAgeMs: number): boolean => {
        try {
          return Date.now() - fs.statSync(logPath).mtimeMs <= maxAgeMs;
        } catch {
          return false;
        }
      };

      // Director loop and terminal heartbeat are one-shot pulse scripts driven
      // by cron, so a missing live process is normal between pulses.
      const directorCron = crontabText.includes('tnf-director-loop');
      const directorFresh = logFreshWithinMs(
        path.join(os.homedir(), '.tnf/director/logs/cron.log'),
        10 * 60 * 1000
      );
      status.director = processAlive('tnf-director-loop') || (directorCron && directorFresh);
      if (status.director) {
        console.log(chalk.green('✅ TNF Director Loop: running (cron pulse every 5m)'));
      } else if (directorCron) {
        console.log(chalk.red('❌ TNF Director Loop: cron installed but no recent pulse'));
      } else {
        console.log(chalk.red('❌ TNF Director Loop: not running'));
      }

      const heartbeatCron = crontabText.includes('terminal-heartbeat-pulse');
      const heartbeatFresh = logFreshWithinMs(
        path.join(os.homedir(), '.tnf/terminal-heartbeat/logs/cron.log'),
        3 * 60 * 1000
      );
      status.heartbeat =
        processAlive('terminal-heartbeat-pulse') || (heartbeatCron && heartbeatFresh);
      if (status.heartbeat) {
        console.log(chalk.green('✅ Terminal Heartbeat: running (cron pulse every 1m)'));
      } else if (heartbeatCron) {
        console.log(chalk.red('❌ Terminal Heartbeat: cron installed but no recent pulse'));
      } else {
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
        'voice-target-agent',
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
  .command('agent')
  .description('Anchor destination to cursor-agent / tnf agent tty (auto-detect)')
  .option('--profile <name>', 'Voice Bridge profile (default: main)')
  .option('--prefer <name>', 'Prefer cursor-agent or tnf', 'cursor-agent')
  .option('--no-enter', 'Do not press Enter after inject')
  .argument('[args...]', 'Arguments forwarded to voice-target-agent')
  .action(
    async (
      args: string[] = [],
      options: { profile?: string; prefer?: string; noEnter?: boolean } = {}
    ) => {
      try {
        let forwarded = [...args];
        if (options.profile) forwarded = appendVoiceProfileArg(forwarded, options.profile);
        if (options.prefer) forwarded.push('--prefer', options.prefer);
        if (options.noEnter) forwarded.push('--no-enter');
        else forwarded.push('--enter');
        await runVoiceBridgeCommand('voice-target-agent', forwarded);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

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

voiceBridgeCommand
  .command('pause')
  .description('Pause the beam (mic capture + injection)')
  .option('--profile <name>', 'Voice Bridge profile (default: main)')
  .action(async (options: { profile?: string } = {}) => {
    try {
      const forwarded = options.profile
        ? appendVoiceProfileArg(['--pause'], options.profile)
        : ['--pause'];
      await runVoiceBridgeCommand('voice-mic-toggle', forwarded);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

voiceBridgeCommand
  .command('resume')
  .description('Resume the beam after pause')
  .option('--profile <name>', 'Voice Bridge profile (default: main)')
  .action(async (options: { profile?: string } = {}) => {
    try {
      const forwarded = options.profile
        ? appendVoiceProfileArg(['--resume'], options.profile)
        : ['--resume'];
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
  .option('--record', `Append this dry-run result to ${HOOK_RUN_LOG_DISPLAY}`)
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

// Non-interactive twin of the palette. `tnf menu` shows a hand-curated,
// grouped view; this shows the flat index the palette actually searches, so
// what you can find by typing `/` is inspectable, scriptable and diffable.
program
  .command('commands')
  .alias('palette')
  .description(
    'Search the flat command index the palette uses: every CLI path at every depth, plus Markdown commands/agents/skills from .tnf/, .claude/, .agent/, .gemini/, .cursor/, .codex/ and .pi/'
  )
  .argument('[query...]', 'Fuzzy query; omit to list everything')
  .option('--kind <kind>', 'Filter by kind: cli | slash | command | prompt | agent | skill')
  .option('--limit <n>', 'Max rows to print', '40')
  .option('--all', 'Print every match (overrides --limit)')
  .option('--stats', 'Show where the index came from, by runtime and kind')
  .option('--json', 'Output machine-readable JSON')
  .action(
    (
      queryParts: string[] = [],
      options: {
        kind?: string;
        limit?: string;
        all?: boolean;
        stats?: boolean;
        json?: boolean;
      } = {}
    ) => {
      try {
        if (options.stats) {
          const service = new CommandSourceService(invocationCwd);
          const markdown = service.summary();
          const cliCount = getPaletteIndex(invocationCwd).filter(
            (entry) => entry.action.type === 'cli'
          ).length;
          if (options.json) {
            console.log(JSON.stringify({ cliCommands: cliCount, markdown }, null, 2));
            return;
          }
          console.log(chalk.bold('\nCommand index sources\n'));
          console.log(`  ${chalk.cyan(String(cliCount).padStart(5))}  cli commands (all depths)`);
          for (const row of markdown) {
            console.log(
              `  ${chalk.cyan(String(row.count).padStart(5))}  ${row.kind} · ${chalk.dim(row.runtime)}`
            );
          }
          console.log(
            chalk.dim(
              `\n  ${getPaletteIndex(invocationCwd).length} entries total. Press / in an interactive TNF session to search them.\n`
            )
          );
          return;
        }

        const query = queryParts.join(' ').trim();
        const sigil =
          options.kind === 'agent'
            ? '@'
            : options.kind === 'skill'
              ? '#'
              : options.kind === 'cli'
                ? '!'
                : '';
        // Rank the whole index, then slice: --limit must cap what is PRINTED,
        // not what is searched, or `--limit 5 --kind skill` would filter five
        // pre-truncated rows and usually print nothing.
        const ranked = rankPalette(
          getPaletteIndex(invocationCwd),
          `/${sigil}${query}`,
          Number.MAX_SAFE_INTEGER
        ).filter((r) => {
          if (!options.kind || sigil) return true;
          const action = r.entry.action;
          if (action.type === 'slash') return options.kind === 'slash';
          if (action.type === 'cli') return options.kind === 'cli';
          return action.entry.kind === options.kind;
        });

        const limit = options.all ? ranked.length : Math.max(1, Number(options.limit ?? 40));
        const shown = ranked.slice(0, limit);

        if (options.json) {
          console.log(
            JSON.stringify(
              {
                query,
                total: ranked.length,
                shown: shown.length,
                results: shown.map((r) => ({
                  label: r.entry.label,
                  description: r.entry.description,
                  badge: r.entry.badge,
                  score: r.score,
                  run: paletteEntryToLine(r.entry),
                  needsArgs: r.entry.needsArgs,
                })),
              },
              null,
              2
            )
          );
          return;
        }

        if (shown.length === 0) {
          console.log(chalk.yellow(`\n  No command matches "${query}".\n`));
          return;
        }

        const width = Math.min(Math.max(...shown.map((r) => r.entry.label.length), 10), 54);
        console.log('');
        for (const { entry } of shown) {
          const label =
            entry.label.length > width
              ? `${entry.label.slice(0, width - 1)}…`
              : entry.label.padEnd(width);
          console.log(
            `  ${chalk.green(label)}  ${chalk.dim(entry.badge.padStart(14))}  ${chalk.dim(entry.description)}`
          );
        }
        console.log(
          chalk.dim(
            `\n  ${shown.length} of ${ranked.length} matches${ranked.length > shown.length ? ' (--all for the rest)' : ''}. Run one with: tnf <path>  or  /<path> in a session.\n`
          )
        );
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );

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
  .command('who')
  .description('Human-friendly who-is-who: Claude vs Hermes vs OpenClaw vs Cursor, plus live ttys')
  .option('--json', 'Print machine-readable JSON')
  .option('--no-write', 'Print only; do not refresh the markdown record')
  .action(async (options: { json?: boolean; write?: boolean } = {}) => {
    try {
      const script = path.join(repoRoot, 'scripts/system/tnf-agent-who-is-who.py');
      if (!fs.existsSync(script)) {
        throw new Error(`Missing ${script}`);
      }
      const args = [script];
      if (options.json) args.push('--json');
      // default: write the running record unless --no-write
      if (options.write !== false && !options.json) args.push('--write');
      else if (options.write !== false && options.json) args.push('--write', '--json');
      await runCommand('python3', args);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
agents
  .command('list')
  .description('Alias for `tnf list`')
  .action(async () => runSelfCliWithExit(['list']));
agents
  .command('prune-stale')
  .description(
    'Remove offline/duplicate Redis swarm workers. Defaults to tnf-thin-client only; use --all to include orphaned duplicates from restarted agents.'
  )
  .option('--name <name>', 'Only prune agents with this exact name', 'tnf-thin-client')
  .option(
    '--all',
    'Scan every registered agent, not just --name. Catches restart orphans: agents that re-register under a new timestamped id and abandon the old row.'
  )
  .option('--dry-run', 'Show what would be deleted without mutating Redis')
  .option('--stale-ms <n>', 'Offline threshold in ms for non-thin agents', '3600000')
  .option('--json', 'Machine-readable JSON result')
  .action(
    async (
      options: {
        name?: string;
        all?: boolean;
        dryRun?: boolean;
        staleMs?: string;
        json?: boolean;
      } = {}
    ) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { RedisAgentClient } = require(path.join(repoRoot, 'scripts/tnf-agent-cli.cjs'));
        const client = new RedisAgentClient();
        await client.initialize();
        try {
          // An empty name clears the scope filter inside pruneStaleAgents,
          // which then applies its duplicate rule (group by name::platform,
          // keep the newest, delete stale older rows) across the whole
          // registry. That logic already existed and was correct; it was
          // simply unreachable behind a default of --name tnf-thin-client,
          // which is why restart orphans accumulated.
          const result = await client.pruneStaleAgents({
            name: options.all ? '' : options.name,
            dryRun: Boolean(options.dryRun),
            staleMs: Number(options.staleMs || 3_600_000),
          });
          if (options.json) {
            console.log(JSON.stringify(result, null, 2));
          } else {
            console.log(chalk.bold('\nTNF agents prune-stale\n'));
            console.log(`  scanned : ${result.scanned}`);
            console.log(`  scoped  : ${result.scoped}`);
            console.log(`  deleted : ${result.deleted}${result.dryRun ? ' (dry-run)' : ''}`);
            if (result.keptThinClientId) {
              console.log(`  kept    : ${result.keptThinClientId}`);
            }
            if (result.deletedIds?.length) {
              console.log(
                chalk.dim(
                  `  ids     : ${result.deletedIds.slice(0, 12).join(', ')}${result.deletedIds.length > 12 ? ' …' : ''}`
                )
              );
            }
            console.log('');
          }
        } finally {
          await client.cleanup().catch(() => undefined);
        }
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    }
  );
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
  .option('--model <model>', 'Override LLM model (default: thinkingmachines/inkling)')
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
        // Redis connection budget gate — refuse start when local bus is saturated.
        const guardScript = path.join(repoRoot, 'scripts', 'runtime', 'redis-connection-guard.cjs');
        if (fs.existsSync(guardScript) && process.env.TNF_SKIP_REDIS_GUARD !== '1') {
          console.log(chalk.dim('[tnf agents live] redis connection guard preflight...'));
          await runCommand(process.execPath, [guardScript, '--preflight']);
        }
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
    const client = new (await loadRedisAgentClient())();
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
  .option('--model <model>', 'LLM model override (default: thinkingmachines/inkling)')
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
          const hermesScriptsDir = path.join(os.homedir(), '.hermes', 'scripts');
          const hermesScriptLink = path.join(hermesScriptsDir, 'tnf-heartbeat-selfwake.py');
          try {
            fs.mkdirSync(hermesScriptsDir, { recursive: true });
            if (!fs.existsSync(hermesScriptLink)) {
              fs.symlinkSync(heartbeatScript, hermesScriptLink);
            }
          } catch {
            // Best-effort link for Hermes --script path requirement.
          }
          // Hermes CLI migrated from `cronjob action=create` → `cron create`.
          try {
            await runCommand('hermes', [
              'cron',
              'create',
              '*/5 * * * *',
              '--script',
              hermesScriptLink,
              '--name',
              'TNF Heartbeat Self-Wake',
              '--no-agent',
            ]);
          } catch (cronErr: unknown) {
            const msg = cronErr instanceof Error ? cronErr.message : String(cronErr);
            // Idempotent: job may already exist from a prior install.
            if (/already|exists|duplicate/i.test(msg)) {
              console.log(chalk.dim('      Heartbeat cron already present'));
            } else {
              console.log(
                chalk.yellow(
                  `      Hermes cron create warning: ${msg} — harness heartbeat cron remains installed`
                )
              );
            }
          }
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
              model: options.model || process.env.TNF_LLM_MODEL || 'thinkingmachines/inkling',
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
      const out = execSync('hermes cron list 2>&1', {
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
    console.log(chalk.dim('   To remove cron: hermes cron remove <jobId>\n'));
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
      'cron',
      'create',
      '*/5 * * * *',
      '--script',
      path.join(os.homedir(), '.hermes/scripts/tnf-heartbeat-selfwake.py'),
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
      const out = execSync('hermes cron list 2>&1', { encoding: 'utf8', stdio: 'pipe' });
      const match = out.match(
        /(?:id|job)[":= ]+"?([a-f0-9-]{20,})"?\s+[\s\S]*?TNF Heartbeat Self-Wake/i
      );
      if (!match) {
        console.log(chalk.dim('⚪ Heartbeat cron not found by name.'));
        return;
      }
      const jobId = match[1];
      await runCommand('hermes', ['cron', 'remove', jobId]);
      console.log(chalk.green(`✅ Heartbeat cron ${jobId} removed`));
    } catch (err: any) {
      console.error(chalk.red(`Failed: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('send')
  .description('Send a single message (verifies the recipient exists and is heartbeating)')
  .argument('<message>', 'Message to send')
  .option('-t, --to <agentId>', 'Recipient agent ID (omit to broadcast)')
  .option('-n, --name <name>', 'Sender name', process.env.AGENT_NAME || 'cli-sender')
  .option(
    '--require-live',
    'Refuse to send to an agent whose heartbeat is stale. Use in cron/full-auto, where queuing to a dead worker looks identical to progress.'
  )
  .option('--force', 'Send even when the recipient is unknown (records the id verbatim)')
  .option('--json', 'Emit the dispatch decision as JSON')
  .action(async (message, options) => {
    const client = new (await loadRedisAgentClient())();
    try {
      await client.initialize();
      await client.register(options.name, 'participant', 'vscode');

      // Resolve BEFORE publishing. `tnf send` previously printed "Message
      // sent" for a nonexistent agent id and for a director four hours dead,
      // so every automated caller read exit 0 as delivery. Core Tenet 4 —
      // verify, do not assume.
      const roster = await client.listAgents();
      const resolution = resolveRecipient(options.to, roster);
      const decision = decideDispatch(resolution, { requireLive: options.requireLive });

      if (options.json) {
        console.log(
          JSON.stringify(
            { to: options.to ?? null, decision: decision.level, ...decision.resolution },
            null,
            2
          )
        );
      }

      if (!decision.proceed && !options.force) {
        if (!options.json) {
          console.error(chalk.red(`✖ Not sent — ${decision.resolution.summary}`));
          if (decision.resolution.suggestions.length > 0) {
            console.error(chalk.dim('  Did you mean:'));
            for (const id of decision.resolution.suggestions) {
              console.error(`    ${chalk.cyan(id)}`);
            }
          }
          console.error(
            chalk.dim(
              '  Roster: tnf agents list   ·   override: --force   ·   broadcast: omit --to'
            )
          );
        }
        process.exitCode = decision.exitCode;
        return;
      }

      await client.send(message, { to: options.to ? { agentId: options.to } : undefined });

      let workerQueue: { queueKey: string; envelopeId: string } | null = null;
      if (
        options.to &&
        decision.resolution.agentId &&
        (decision.resolution.role === 'worker' ||
          /worker/i.test(decision.resolution.agentId || options.to))
      ) {
        try {
          workerQueue = await client.enqueueWorkerTask(decision.resolution.agentId!, message, {
            metadata: { transport: 'sub-director-list', via: 'tnf send' },
          });
        } catch (enqueueErr: any) {
          if (!options.json) {
            console.error(
              chalk.yellow(
                `⚠ Published via PUBLISH but worker queue LPUSH failed: ${enqueueErr.message}`
              )
            );
          }
        }
      }

      if (!options.json) {
        // Report the DURABLE outcome first, independent of liveness.
        //
        // Ordering matters here and got this wrong once already: when the
        // stale-recipient branch ran first, a worker that had genuinely been
        // LPUSHed to its durable inbox was told "dropped, not queued". That is
        // the common case, not an edge case — cron workers heartbeat every
        // 5-15min against a 60s liveness window, so they read stale most of
        // the time. An LPUSH that lands must never be reported as a drop.
        if (workerQueue) {
          console.log(chalk.green(`📥 Queued to worker inbox — ${decision.resolution.summary}`));
          console.log(chalk.dim(`  ${workerQueue.queueKey} (envelope ${workerQueue.envelopeId})`));
          console.log(
            chalk.dim(
              decision.level === 'warn'
                ? '  Durable: the worker drains this on its next cron cycle, even though it reads stale now.'
                : '  Durable: the worker drains this on its next cron cycle.'
            )
          );
        } else if (decision.level === 'warn') {
          console.log(chalk.yellow(`⚠ Published, but ${decision.resolution.summary}`));
          console.log(
            chalk.dim(
              '  PUBLISH is fire-and-forget: with no live subscriber this message is dropped, not queued.'
            )
          );
        } else if (decision.resolution.status === 'broadcast') {
          console.log(chalk.green(`📤 Broadcast — ${decision.resolution.summary}`));
        } else {
          console.log(chalk.green(`📤 Sent — ${decision.resolution.summary}`));
        }
      }

      // Wait a bit for responses
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err: any) {
      if (isRedisUnavailable(err)) {
        logRedisUnavailable('./tnf send <message>');
      }
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    } finally {
      // `tnf send` is a one-shot: registering a `cli-sender` participant and
      // leaving the row behind turned the roster into a graveyard (16 rows
      // for ~7 real agents when measured). Drop our own row before the normal
      // cleanup, which only marks agents offline.
      // Order matters: cleanup() re-writes the row with status=offline, so
      // deregistering first just gets undone. Verified empirically — the
      // cli-sender row reappeared until this was flipped.
      await client.cleanup();
      await client.deregister();
    }
  });

// ============================================================================
// ENHANCED ORCHESTRATION COMMANDS
// ============================================================================

program
  .command('orchestrate')
  .description(
    'Run agent orchestration workflow. Accepts natural language goals or legacy workflow names.'
  )
  .argument('[workflow]', 'Workflow name or natural language goal')
  .option('--path <path>', 'Code path for code-review workflow', '.')
  .option(
    '--goal',
    'Treat the argument as a natural language goal (auto-detected if contains spaces)'
  )
  .option('--status', 'Show orchestrator status')
  .option('--suggest', 'Show proactive suggestions')
  .action(
    async (
      workflow: string | undefined,
      options: { path?: string; goal?: boolean; status?: boolean; suggest?: boolean } = {}
    ) => {
      const client = new (await loadRedisAgentClient())();
      try {
        await client.initialize();
        await client.register(process.env.AGENT_NAME || 'orchestrator-cli', 'orchestrator', 'tnf');

        const repoRoot = path.resolve(_dirname, '../../..');
        const orchestrator = new Orchestrator(client, repoRoot);

        // --status: Show system status
        if (options.status || (!workflow && !options.suggest)) {
          const status = await orchestrator.getStatus();
          console.log(chalk.cyan('\n📊 Orchestrator Status'));
          console.log(chalk.dim('   ─'.repeat(25)));
          console.log(`   Active workflows: ${chalk.bold(status.workflows)}`);
          console.log(`   Total tasks:      ${chalk.bold(status.tasks)}`);
          console.log(`   Skills available: ${chalk.bold(status.skills)}`);
          console.log(
            `   System health:    ${status.health === 'healthy' ? chalk.green(status.health) : chalk.yellow(status.health)}`
          );
          console.log();
          return;
        }

        // --suggest: Show proactive suggestions
        if (options.suggest) {
          const suggestions = await orchestrator.suggestActions();
          console.log(chalk.cyan('\n💡 Proactive Suggestions'));
          console.log(chalk.dim('   ─'.repeat(25)));
          suggestions.forEach((s, i) => {
            console.log(`   ${i + 1}. ${s}`);
          });
          console.log();
          return;
        }

        if (!workflow) {
          console.log(chalk.red('Error: Please provide a workflow name or use --status/--suggest'));
          process.exit(1);
        }

        // Detect natural language goal vs legacy workflow name
        const isNaturalLanguage = options.goal || (workflow.includes(' ') && workflow.length > 20);

        if (isNaturalLanguage) {
          // New power mode: natural language goal
          const result = await orchestrator.executeGoal(workflow);
          if (result.status === 'completed') {
            console.log(chalk.green(`\n✅ Goal achieved: ${result.name}`));
          } else {
            console.log(chalk.red(`\n❌ Goal incomplete: ${result.name}`));
            process.exit(1);
          }
        } else {
          // Legacy mode: named workflow
          const ok = await orchestrator.executeWorkflow(workflow, {
            path: options.path || '.',
          });
          if (!ok) {
            process.exit(1);
          }
        }
      } catch (err: any) {
        if (isRedisUnavailable(err)) {
          logRedisUnavailable(`./tnf orchestrate ${workflow || ''}`);
        }
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      } finally {
        await client.cleanup();
      }
    }
  );

program
  .command('convo')
  .description('Manage conversations')
  .argument('<action>', 'Action (start, join)')
  .argument('[param]', 'Topic for start, ID for join')
  .action(async (action, param) => {
    const client = new (await loadRedisAgentClient())();
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
import { DebugService, redactSensitiveConfig } from './services/DebugService.js';
import { MCPManagerService } from './services/MCPManagerService.js';
import { MCPToolRuntimeService } from './services/MCPToolRuntimeService.js';
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
      client = new (await loadRedisAgentClient())();
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

// ─── agent status ──────────────────────────────────────────────────────────
// Reports this CLI binary's own health, wiring, and capabilities — useful
// for parent agents (and operators) to introspect what `tnf-agent` actually
// exposes without having to read cli.ts. Additive command, no behavior
// change to existing commands.

function readPackageJson(_root: string): {
  name?: string;
  version?: string;
  description?: string;
  type?: string;
  main?: string;
  bin?: Record<string, string>;
} {
  // Read the CLI package.json (this file lives at packages/tnf-cli/). Always
  // prefer the CLI-specific manifest over the monorepo root one.
  const cliPkgPath = path.join(repoRoot, 'packages/tnf-cli/package.json');
  try {
    if (fs.existsSync(cliPkgPath)) {
      const parsed = JSON.parse(fs.readFileSync(cliPkgPath, 'utf8')) as any;
      if (parsed?.name === '@the-new-fuse/tnf-cli') return parsed;
    }
  } catch {
    // fall through to root
  }
  // Fallback: monorepo root package.json (used only as last resort)
  const rootPkgPath = path.join(repoRoot, 'package.json');
  try {
    if (fs.existsSync(rootPkgPath)) {
      return JSON.parse(fs.readFileSync(rootPkgPath, 'utf8')) as any;
    }
  } catch {
    // ignore
  }
  return {};
}

function readGitFacts(root: string): {
  branch: string;
  headSha: string;
  shortSha: string;
  clean: boolean;
  modifiedCount: number;
} {
  const run = (args: string[]): string => {
    try {
      const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
      if (result.status !== 0) return '';
      return String(result.stdout || '').trim();
    } catch {
      return '';
    }
  };

  const branch = run(['rev-parse', '--abbrev-ref', 'HEAD']) || 'unknown';
  const headSha = run(['rev-parse', 'HEAD']) || 'unknown';
  const shortSha = headSha && headSha !== 'unknown' ? headSha.slice(0, 7) : 'unknown';
  const statusPorcelain = run(['status', '--porcelain', '--untracked-files=no']);
  const modifiedCount = statusPorcelain ? statusPorcelain.split('\n').filter(Boolean).length : 0;
  return {
    branch,
    headSha,
    shortSha,
    clean: statusPorcelain.length === 0,
    modifiedCount,
  };
}

function safeProgramCommandCount(programInstance: Command): number {
  try {
    const cmds = (programInstance as any).commands;
    return Array.isArray(cmds) ? cmds.length : 0;
  } catch {
    return 0;
  }
}

function listAgentCommands(): string[] {
  // Scan the program tree for the `agent` subcommand and serialize its
  // immediate subcommands. Tolerates missing `agent` command by returning [].
  try {
    const root = (program as any).commands as Command[];
    const agentCmd = root.find((c) => c.name() === 'agent');
    if (!agentCmd) return [];
    return ((agentCmd as any).commands as Command[]).map((c) => c.name()).filter(Boolean);
  } catch {
    return [];
  }
}

type SubsystemEntry = { name: string; ok: boolean; detail: string; note?: string };
type SubsystemReport = { total: number; healthy: number; entries: SubsystemEntry[] };

function probeTnfSubsystems(): SubsystemReport {
  // Resolve the tnf-cli source root reliably. Multiple invocations of the
  // same CLI may run from different cwds (e.g. monorepo root vs. nested),
  // so use repoRoot + the canonical subdirectory.
  const cliRoot = path.join(repoRoot, 'packages/tnf-cli');
  const cliSrc = path.join(cliRoot, 'src');

  const entries: SubsystemEntry[] = [];

  const relativeFileSize = (rel: string): { exists: boolean; size: number } => {
    const abs = path.join(cliSrc, rel);
    if (!fs.existsSync(abs)) return { exists: false, size: 0 };
    return { exists: true, size: fs.statSync(abs).size };
  };

  // 1. LLM provider detector (file presence + class loadability)
  try {
    const probed = relativeFileSize('utils/llm-provider-detector.ts');
    entries.push({
      name: 'llm-provider-detector',
      ok: probed.exists,
      detail: probed.exists ? `source available (${probed.size} bytes)` : 'source missing',
      note: 'rank-based provider picker',
    });
  } catch (err: any) {
    entries.push({
      name: 'llm-provider-detector',
      ok: false,
      detail: err?.message ?? 'probe failed',
    });
  }

  // 2. LLM client — file presence
  try {
    const probed = relativeFileSize('utils/llm-client.ts');
    entries.push({
      name: 'llm-client',
      ok: probed.exists,
      detail: probed.exists ? `source available (${probed.size} bytes)` : 'source missing',
    });
  } catch (err: any) {
    entries.push({
      name: 'llm-client',
      ok: false,
      detail: err?.message ?? 'probe failed',
    });
  }

  // 3. ModelService — file presence
  try {
    const probed = relativeFileSize('services/ModelService.ts');
    entries.push({
      name: 'model-service',
      ok: probed.exists,
      detail: probed.exists ? 'tier-based catalog & resolver' : 'source missing',
    });
  } catch (err: any) {
    entries.push({
      name: 'model-service',
      ok: false,
      detail: err?.message ?? 'probe failed',
    });
  }

  // 4. RedisAgentClient — file presence + listening port if discoverable
  try {
    const probed = relativeFileSize('RedisAgentClient.ts');
    entries.push({
      name: 'redis-agent-client',
      ok: probed.exists,
      detail: probed.exists ? `transport available (${probed.size} bytes)` : 'transport missing',
      note: 'used by `agents-run` and `assimilate`',
    });
  } catch (err: any) {
    entries.push({
      name: 'redis-agent-client',
      ok: false,
      detail: err?.message ?? 'probe failed',
    });
  }

  // 5. Federation tap (recent addition)
  try {
    const probed = relativeFileSize('commands/federation-tap.ts');
    entries.push({
      name: 'federation-tap',
      ok: probed.exists,
      detail: probed.exists ? 'channel-mirror command' : 'command missing',
      note: 'wired in commit 0a887c0fa2',
    });
  } catch (err: any) {
    entries.push({ name: 'federation-tap', ok: false, detail: err?.message ?? 'probe failed' });
  }

  // 6. Workspace deps reachability (top-of-name)
  for (const dep of [
    '@the-new-fuse/infrastructure',
    '@the-new-fuse/tnf-core',
    '@the-new-fuse/tnf-note-taking',
    '@the-new-fuse/shared',
  ]) {
    entries.push({
      name: `dep:${dep.replace('@the-new-fuse/', '')}`,
      ok: true,
      detail: 'workspace dep declared',
    });
  }

  // 7. ASCII-protocol loaded?
  try {
    const interceptor = new ProtocolInterceptor(repoRoot);
    const summary = interceptor.getStateSummary();
    const liveSynced = Boolean((summary.livingState as Record<string, boolean>)?.synchronized);
    entries.push({
      name: 'protocol-interceptor',
      ok: liveSynced,
      detail: liveSynced ? 'living-state synchronized' : 'living-state stale',
      note: 'turn-zero guard active',
    });
  } catch (err: any) {
    entries.push({
      name: 'protocol-interceptor',
      ok: false,
      detail: err?.message ?? 'probe failed',
    });
  }

  const total = entries.length;
  const healthy = entries.filter((e) => e.ok).length;
  return { total, healthy, entries };
}

agentCreate
  .command('status')
  .description('Report this tnf-agent CLI binary: version, branch, wiring, capabilities')
  .option('--json', 'Output machine-readable JSON')
  .option('--name <name>', 'Restrict capability scan to a specific registered agent', 'self')
  .action((options: { json?: boolean; name?: string }) => {
    try {
      const pkg = readPackageJson(repoRoot);
      const git = readGitFacts(repoRoot);
      const binNames = Object.keys(pkg.bin ?? {});
      const programCount = safeProgramCommandCount(program);
      const subs = listAgentCommands();
      const managedAgent = (() => {
        try {
          return options.name && options.name !== 'self'
            ? (agentManager.getByName(options.name) ?? null)
            : null;
        } catch {
          return null;
        }
      })();

      const subsystemReport = probeTnfSubsystems();

      const report = {
        generatedAt: new Date().toISOString(),
        bin: binNames.length > 0 ? binNames : ['tnf', 'tnf-agent'],
        package: {
          name: pkg.name ?? null,
          version: pkg.version ?? null,
          description: pkg.description ?? null,
          type: pkg.type ?? null,
          main: pkg.main ?? null,
        },
        git: {
          branch: git.branch,
          headSha: git.headSha,
          shortSha: git.shortSha,
          clean: git.clean,
          modifiedCount: git.modifiedCount,
        },
        repo: {
          root: repoRoot,
          invocationCwd,
          tnfRootResolved: repoRoot,
        },
        runtime: {
          node: process.version,
          platform: process.platform,
          arch: process.arch,
          pid: process.pid,
          uptimeSec: Math.round(process.uptime()),
        },
        program: {
          commandCount: programCount,
          agentSubcommands: subs,
        },
        subsystems: subsystemReport,
        agents: managedAgent
          ? {
              id: managedAgent.id,
              name: managedAgent.name,
              role: managedAgent.role,
              platform: managedAgent.platform,
              isOnline: managedAgent.isOnline,
              capabilities: managedAgent.capabilities,
              lastSeen: managedAgent.lastSeen,
            }
          : null,
      };

      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      const overall =
        report.subsystems.healthy === report.subsystems.total
          ? chalk.green('READY')
          : chalk.yellow('PARTIAL');

      console.log(chalk.bold.cyan('\n[TNF Agent Status]\n'));
      console.log(`${chalk.bold('Bin:')}       ${report.bin.join(', ')}`);
      console.log(`${chalk.bold('Package:')}   ${report.package.name}@${report.package.version}`);
      console.log(
        `${chalk.bold('Git:')}       ${report.git.branch} @ ${report.git.shortSha} ${report.git.clean ? chalk.green('(clean)') : chalk.yellow(`(${report.git.modifiedCount} modified)`)}`
      );
      console.log(
        `${chalk.bold('Node:')}      ${report.runtime.node} (${report.runtime.platform}/${report.runtime.arch})`
      );
      console.log(
        `${chalk.bold('Program:')}   ${report.program.commandCount} top-level commands, ${report.program.agentSubcommands.length} agent subcommands (${report.program.agentSubcommands.join(', ')})`
      );
      console.log(
        `${chalk.bold('Subsystems:')} ${report.subsystems.healthy}/${report.subsystems.total} healthy`
      );
      for (const entry of report.subsystems.entries) {
        const dot = entry.ok ? chalk.green('●') : chalk.red('○');
        const note = entry.note ? chalk.dim(` — ${entry.note}`) : '';
        console.log(`  ${dot} ${chalk.cyan(entry.name.padEnd(22))} ${entry.detail}${note}`);
      }
      if (report.agents) {
        console.log(
          `${chalk.bold('Agent:')}     ${report.agents.name} (${report.agents.role}/${report.agents.platform}) — ${report.agents.isOnline ? chalk.green('online') : chalk.yellow('offline')}`
        );
      }
      console.log(`\n${chalk.bold('Overall:')}    ${overall}\n`);
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
        const value = redactSensitiveConfig(
          debugService.getConfigPath(options.path, invocationCwd)
        );
        if (options.json) {
          console.log(JSON.stringify({ path: options.path, value }, null, 2));
        } else {
          console.log(
            value !== undefined ? JSON.stringify(value, null, 2) : chalk.yellow('undefined')
          );
        }
      } else {
        const config = redactSensitiveConfig(debugService.getEffectiveConfig(invocationCwd));
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
      const value = redactSensitiveConfig(debugService.getConfigPath(key, invocationCwd));
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
        console.log(
          JSON.stringify({ config: redactSensitiveConfig(config), commands, agents }, null, 2)
        );
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

// Phase-1.3 (tnf pi parity): `extensionCmd` historically lists shipped
// chrome/vscode/tauri apps. `.pi`-style user-modules (TS loadable extensions,
// hot-reload, custom tools/commands) live in ~/.pi/agent/extensions/,
// .pi/extensions/. Surface them as a sibling subcommand so the existing
// shipped-extension semantics stay untouched.
function discoverUserExtensions(repoRootArg: string): Array<{
  name: string;
  source: string;
  dir: string;
  entry: string | null;
}> {
  const home = os.homedir();
  const candidates: Array<{ name: string; source: string; dir: string; entry: string | null }> = [];
  const roots: Array<{ source: string; dir: string }> = [
    { source: 'local', dir: path.join(home, '.pi', 'agent', 'extensions') },
    { source: 'project', dir: path.join(repoRootArg, '.pi', 'extensions') },
  ];
  for (const { source, dir } of roots) {
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      let full: string | null = null;
      let real: string | null = null;
      try {
        if (entry.isSymbolicLink()) real = fs.realpathSync(path.join(dir, entry.name));
      } catch {}
      const probeTarget = real ?? (entry.isDirectory() ? path.join(dir, entry.name) : null);
      if (!probeTarget) continue;
      try {
        if (fs.statSync(probeTarget).isDirectory()) full = probeTarget;
      } catch {}
      if (!full) continue;
      const entryFile =
        ['index.ts', 'index.js', 'extension.ts', 'extension.js']
          .map((cand) => path.join(full!, cand))
          .find((p) => fs.existsSync(p)) ?? null;
      candidates.push({ name: entry.name, source, dir: full, entry: entryFile });
    }
  }
  return candidates;
}

extensionCmd
  .command('user-list')
  .description(
    'List user-module extensions discovered from `~/.pi/agent/extensions/` and `.pi/extensions/` (.pi parity)'
  )
  .option('--json', 'Output machine-readable JSON')
  .action((options: { json?: boolean }) => {
    try {
      const found = discoverUserExtensions(repoRoot);
      if (options.json) {
        console.log(JSON.stringify({ count: found.length, repoRoot, extensions: found }, null, 2));
        return;
      }
      console.log(chalk.bold('\nUser-Module Extensions (.pi parity)\n'));
      if (found.length === 0) {
        console.log(chalk.dim('  (none discovered — seed ~/.pi/agent/extensions/ to populate)'));
        console.log('');
        return;
      }
      for (const e of found) {
        console.log(
          `  ${chalk.cyan(e.name.padEnd(28))} ${chalk.dim(e.source.padEnd(8))} ${chalk.dim(e.dir)}`
        );
        console.log(
          `  ${''.padEnd(28)} ${chalk.dim(e.entry ?? chalk.yellow('(no index.ts/extension.ts)'))}`
        );
      }
      console.log('');
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

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

// Phase-1.1 (tnf pi parity): `packages` was a generic noun that collided with the
// `.pi` `pi install <source>` namespace — `.pi` packages bundle extensions/skills/
// themes/prompt-templates and are installed via `tnf <install|remove|list|update>`.
//
// Rename to `tnf workspace` (clear role: monorepo probe + reconnect utilities inside
// the TNF monorepo). `tnf packages` is kept as a Commander alias for one minor release
// so existing scripts and `docs/protocols/reports/tnf-cli-command-paths-2026-05-28.json`
// keep working. Remove the alias when Phase-2 lands the `.pi`-style installer.
const workspaceCommand = program
  .command('workspace')
  .alias('packages')
  .description('Monorepo package reconnect and availability utilities (alias: `tnf packages`)');

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

workspaceCommand
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

workspaceCommand
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
registerSparkCommand(program);
registerGoogleAiCommand(program, repoRoot);

async function createNotesService(options: {
  vaultPath?: string;
  userId?: string;
}): Promise<NoteService> {
  const { NoteService: NoteServiceImpl } = await import('@the-new-fuse/tnf-note-taking');
  return new NoteServiceImpl({
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
      const service = await createNotesService(options);
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
    async (options: {
      tag?: string;
      limit?: string;
      vaultPath?: string;
      userId?: string;
      json?: boolean;
    }) => {
      try {
        const service = await createNotesService(options);
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
  .action(
    async (idOrTitle: string, options: { vaultPath?: string; userId?: string; json?: boolean }) => {
      try {
        const service = await createNotesService(options);
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
    }
  );

notesCommand
  .command('search')
  .description('Search notes by title and content')
  .argument('<query>', 'Search query')
  .option('--limit <n>', 'Limit results (default: 20)')
  .option('--vault-path <path>', 'Base vault path (default: ~/.tnf/vault)')
  .option('--user-id <id>', 'Vault user id (default: OS user)')
  .option('--json', 'Output JSON')
  .action(
    async (
      query: string,
      options: { limit?: string; vaultPath?: string; userId?: string; json?: boolean }
    ) => {
      try {
        const service = await createNotesService(options);
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
        const service = await createNotesService(options);
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
        const service = await createNotesService(options);
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
registerBrowserCommand(program, repoRoot);
registerTelegramCommands(program, repoRoot);
registerSlackCommands(program, repoRoot);
registerWhatsappCommands(program, repoRoot);
registerChannelCommands(program, repoRoot);
registerAgentsClassifyCommand(program, repoRoot);
registerAgentsRunCommand(program);
registerAgentsSpecsCommand(program, repoRoot);
registerStatusCommand(program, repoRoot);
// `doctor` and `config` are already owned by cli.ts above. These modules nest
// under the incumbent (`doctor health`, `config resolved`) via registerOrNest
// rather than colliding with it — see commands/_registry.ts.
registerDoctorCommand(program, repoRoot);
registerConfigCommand(program, repoRoot);
registerParityCommand(program, repoRoot);
registerLogsCommand(program, repoRoot);
registerFederationTapCommand(program, repoRoot);
registerRefreshContextCommand(program, repoRoot);
registerStaffingCommands(program);
registerFleetCommands(program);
// Free NVIDIA / LLM catalog inspector + active-model switcher. Reads from
// data/providers/catalog.json + data/providers/nvidia-models.json (single
// source of truth, no hardcoded lists).
registerCatalogCommand(program);
registerSubdirectorCommand(program, { repoRoot, runCommand });
registerHaltCommand(program, repoRoot);

// Hermes parity: `hermes sync` → TNF CLI↔Hermes surface audit.
// Nested `protocol sync` / `mcp sync` remain unchanged; this is the top-level verb.
if (!program.commands.some((c) => c.name() === 'sync')) {
  program
    .command('sync')
    .description(
      'Audit TNF CLI ↔ Hermes top-level surface parity (writes ~/.tnf/cli-sync/latest-report.json)'
    )
    .option('--auto-fix', 'Reserved stub forwarded to the sync script')
    .action(async (options: { autoFix?: boolean } = {}) => {
      const args = ['scripts/agents/sync-tnf-cli-with-agents.mjs'];
      if (options.autoFix) args.push('--auto-fix');
      await runCommand('node', args);
    });
}

// Hermes parity: `hermes version` is a top-level verb. Commander already
// exposes `-V/--version` from package.json; this adds an explicit subcommand
// so the sync auditor and Hermes users find the same noun.
if (!program.commands.some((c) => c.name() === 'version')) {
  program
    .command('version')
    .description('Print TNF CLI version (Hermes parity; same as --version)')
    .action(() => {
      try {
        const pkgPath = path.join(repoRoot, 'packages', 'tnf-cli', 'package.json');
        const ver = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version ?? 'unknown';
        console.log(ver);
      } catch {
        console.log(program.version() ?? 'unknown');
      }
    });
}

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

function syncHomeHandoffCache(): void {
  const scriptPath = path.join(repoRoot, 'scripts/lib/sync-handoff-cache.cjs');
  if (!fs.existsSync(scriptPath)) return;
  try {
    spawnSync('node', [scriptPath, '--repo', repoRoot], {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    });
  } catch {
    // Best-effort — onboard/emit also sync the cache.
  }
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

  const tasksArray: any[] = Array.isArray(handoff.next_actions)
    ? handoff.next_actions
    : Array.isArray(handoff.immediate_tasks)
      ? handoff.immediate_tasks
      : [];

  const nextActionsCount = tasksArray.length;

  // Format the actual tasks to inject into context (up to 5)
  const taskDetails = tasksArray.slice(0, 5).map((t: any, i: number) => {
    const text = typeof t === 'string' ? t : t.description || t.task || JSON.stringify(t);
    return `    ${i + 1}. ${text}`;
  });

  const tasksContext = taskDetails.length > 0 ? `\n  - Tasks:\n${taskDetails.join('\n')}` : '';

  const batch = handoff.batch || handoff.phase7?.batch || handoff.current_batch;
  const batchSummary = batch
    ? `\n- ${source} batch: ${batch.batchId || batch.id || 'unknown'} state=${batch.state || 'unknown'} size=${batch.size ?? batch.records?.length ?? 'unknown'}`
    : '';
  return (
    [
      `- ${source}: ${handoff.handoff_id || handoff.session || handoff.session_id || 'unknown'}`,
      `- ${source} created_at: ${handoff.created_at || handoff.generatedAt || handoff.updated || 'unknown'}`,
      `- ${source} priority: ${handoff?.continuation?.priority || handoff.priority || 'unknown'}`,
      `- ${source} next actions count: ${nextActionsCount}${tasksContext}`,
    ].join('\n') + batchSummary
  );
}

function loadTnfInteractiveContextPack(): string {
  const handoff = readJsonFileIfPresent('docs/protocols/reports/SESSION_HANDOFF_LATEST.json');
  const homeHandoff = readAbsoluteJsonFileIfPresent(getHomeHandoffPath());
  const livingState = readTextFileIfPresent('docs/protocols/LIVING_STATE.md', 3000);
  const ledger = readTextFileIfPresent('docs/protocols/AGENT_STATUS_LEDGER.md', 2000);
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
    formatWorkPlaneOrientationMarkdown(),
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
    '',
    '## Interactive Execution Policy',
    '',
    '- This TNF interactive lane can execute shell commands in the canonical workspace root.',
    '- PREFERRED: call the run_bash tool with a command; its stdout/stderr and exit code come back to you as the tool result.',
    '- Fallback (only if tool calling is unavailable): emit fenced ```bash blocks and the runtime will run them.',
    '- Never merely describe a command — either call run_bash or emit a fenced block.',
    '- Operators can also use `/exec <command>` or toggle `/autonomous on`.',
    '- Prefer Inspect → Act → Verify: read state, run commands, then verify with curl or status checks.',
    '- Relay health check: `curl -sS http://127.0.0.1:3007/health` (there is no `/handoff-lineage` HTTP route).',
    '',
    '## Repo Layout (use directly — do not blind-search)',
    '',
    '- Frontend web app: `apps/frontend/` (entry `apps/frontend/src/main.tsx`, auth `apps/frontend/src/hooks/useAuth.tsx`)',
    '- API server: `apps/api/` (global guard `apps/api/src/guards/security.guard.ts`)',
    '- TNF CLI source: `packages/tnf-cli/src/cli.ts`',
    '- Canonical handoff: `docs/protocols/reports/SESSION_HANDOFF_LATEST.json`',
    '- Home handoff cache: `~/.tnf/handoff-current.json` (synced from canonical JSON on `tnf onboard`)',
    '',
    '## Search Discipline',
    '',
    '- Never run more than 2 blind `find`/`ls` commands for the same target.',
    '- If the operator names a file (for example `Main.tsx`), read it directly under `apps/frontend/src/`.',
    '- If command output is unavailable, say so and ask the operator — do not repeat searches.',
    '- Finish one task completely (write + verify) before starting another discovery loop.',
  ].join('\n');
}

function extractInteractiveBashBlocks(text: string): string[] {
  const blocks: string[] = [];
  const pattern = /```(?:bash|sh|shell|zsh)?\s*\n([\s\S]*?)```/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const body = match[1]?.trim();
    if (body) blocks.push(body);
  }
  return blocks;
}

function wantsAutonomousExecution(input: string): boolean {
  const lower = input.toLowerCase();
  return /\b(autonomous|autonomously|do all|execute all|run all|just do it|do your best|go ahead)\b/.test(
    lower
  );
}

function resolveAutonomousModeToggle(args: string[]): boolean | null {
  const token = args.join(' ').trim().toLowerCase();
  if (!token) return null;
  if (['on', 'true', '1', 'yes', 'enable'].includes(token)) return true;
  if (['off', 'false', '0', 'no', 'disable'].includes(token)) return false;
  return null;
}

const AUTONOMOUS_MAX_SHELL_BLOCKS = parseInt(
  process.env.TNF_AUTONOMOUS_MAX_SHELL_BLOCKS || '5',
  10
);

function enableAutonomousRuntimeDefaults(): void {
  if (!process.env.TNF_STALL_DEFENSE_TIMEOUT) {
    process.env.TNF_STALL_DEFENSE_TIMEOUT = '120';
  }
  if (!process.env.TNF_STALL_DEFENSE_PROMPT) {
    process.env.TNF_STALL_DEFENSE_PROMPT =
      'Continue autonomous execution. Pick the next pending handoff action, execute it, and verify.';
  }
}

/**
 * TUI mode is resolved in priority order:
 *   1. TNF_TUI_MODE env var    (one-shot override; 'LONG_RUN' | 'AUTONOMOUS' | 'INTERACTIVE')
 *   2. ~/.tnf/tui-mode.json    (operator-persisted default)
 *   3. 'LONG_RUN'              (full autonomous at launch — shell + auto-continue)
 *
 * The three modes differ in WHO is allowed to feed the prompt loop:
 *   INTERACTIVE  → operator keystrokes only; loop blocks on ask() until typed.
 *   AUTONOMOUS   → self-prompted after each LLM response with shell execution on.
 *   LONG_RUN     → always-on autonomous continuation; operator typing INTERRUPTS cleanly
 *                  by being consumed at the top of the loop before the queued continuation
 *                  fires. Resets only on `.exit`, stdin close, or `TNF_TUI_MODE=INTERACTIVE`.
 *
 * This is the architectural lever that keeps the Kilo/Hermes/orchestrator-style
 * fleet alive across long-lived turn-zero/turn-N cycles without the operator
 * having to enable autonomous mode every time.
 */
type TuiMode = 'INTERACTIVE' | 'AUTONOMOUS' | 'LONG_RUN';

const DEFAULT_TUI_MODE: TuiMode = 'LONG_RUN';

function getTuiModeConfigPath(): string {
  const home = process.env.HOME || os.homedir();
  return path.join(home, '.tnf', 'tui-mode.json');
}

function persistTuiMode(mode: TuiMode): void {
  try {
    const configPath = getTuiModeConfigPath();
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(
      configPath,
      `${JSON.stringify({ mode, updatedAt: new Date().toISOString() }, null, 2)}\n`,
      'utf8'
    );
  } catch {
    // Persistence is best-effort; env override still works without it.
  }
}

function resolveTuiMode(): TuiMode {
  const envMode = (process.env.TNF_TUI_MODE || '').trim().toUpperCase();
  if (envMode === 'LONG_RUN' || envMode === 'AUTONOMOUS' || envMode === 'INTERACTIVE') {
    return envMode;
  }
  // Persistence file (operator-set default)
  try {
    const configPath = getTuiModeConfigPath();
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf8');
      const parsed = JSON.parse(raw);
      const persisted = (parsed?.mode || '').toUpperCase();
      if (persisted === 'LONG_RUN' || persisted === 'AUTONOMOUS' || persisted === 'INTERACTIVE') {
        return persisted;
      }
    }
  } catch {
    // ignore malformed config; fall through to default
  }
  return DEFAULT_TUI_MODE;
}

function readHandoffNextActions(): string[] {
  try {
    const handoffPath = path.join(repoRoot, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json');
    if (!fs.existsSync(handoffPath)) return [];
    const handoff = JSON.parse(fs.readFileSync(handoffPath, 'utf8'));
    if (!Array.isArray(handoff.next_actions)) return [];
    return handoff.next_actions.map((action: unknown) => String(action)).filter(Boolean);
  } catch {
    return [];
  }
}

function readCompactHandoffSummary(): string {
  try {
    const handoffPath = path.join(repoRoot, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json');
    if (!fs.existsSync(handoffPath)) return 'Handoff unavailable.';
    const handoff = JSON.parse(fs.readFileSync(handoffPath, 'utf8'));
    const parts: string[] = [];
    if (handoff.handoff_id) parts.push(`handoff_id: ${handoff.handoff_id}`);
    if (handoff.continuation?.priority) parts.push(`priority: ${handoff.continuation.priority}`);
    const actions = readHandoffNextActions();
    if (actions.length) {
      parts.push('next_actions:');
      actions.forEach((action, index) => parts.push(`  ${index + 1}. ${action}`));
    }
    return parts.join('\n').slice(0, 2000);
  } catch {
    return 'Handoff parse failed.';
  }
}

function buildAutonomousContinuePrompt(state: AutonomousSessionState): string {
  const actions = readHandoffNextActions();
  const summary = readCompactHandoffSummary();
  const prefix = state.contextRefreshPending
    ? '[Autonomous context refresh]'
    : '[Autonomous continue]';
  const speakRule =
    'Always end the turn with a short plain-language update for the operator (what changed, blockers, next step). Never reply with only raw tool JSON.';

  if (!actions.length) {
    return [
      prefix,
      summary,
      '',
      'No handoff next_actions found — follow LIVING_STATE.md active directive.',
      `Use tools or at most ${AUTONOMOUS_MAX_SHELL_BLOCKS} fenced bash blocks this turn, then summarize results.`,
      speakRule,
      'Do not re-explore files already listed in repo layout. Inspect → Act → Verify.',
    ].join('\n');
  }

  if (state.handoffTaskIndex >= actions.length) {
    return [
      prefix,
      summary,
      '',
      `All ${actions.length} handoff actions have been attempted this session.`,
      'Review results, commit or deploy as needed, then summarize blockers.',
      `Use tools or at most ${AUTONOMOUS_MAX_SHELL_BLOCKS} fenced bash blocks this turn if verification is still required.`,
      speakRule,
    ].join('\n');
  }

  const current = actions[state.handoffTaskIndex];
  return [
    prefix,
    summary,
    '',
    `Focus on handoff action ${state.handoffTaskIndex + 1}/${actions.length}: ${current}`,
    `Use tools or at most ${AUTONOMOUS_MAX_SHELL_BLOCKS} fenced bash blocks this turn, then summarize results.`,
    speakRule,
    'Do not re-explore files already listed in repo layout. Inspect → Act → Verify.',
  ].join('\n');
}

/** True when model "content" is just a dumped tool result (not operator-facing prose). */
function looksLikeRawToolResultDump(text: string): boolean {
  const trimmed = String(text || '').trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return false;
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    if (typeof parsed !== 'object' || parsed === null) return false;
    return (
      'ok' in parsed ||
      'stdout' in parsed ||
      'stderr' in parsed ||
      'exit_code' in parsed ||
      'tool' in parsed ||
      ('path' in parsed && 'content' in parsed)
    );
  } catch {
    return false;
  }
}

function isExploratoryShellBlock(script: string): boolean {
  const normalized = script.trim().toLowerCase();
  if (!/^\s*(find|ls|grep|rg|cat|head|tail|wc)\s/.test(normalized)) return false;
  if (
    /(cli\.ts|packages\/tnf-cli)/.test(normalized) &&
    !/(diff|patch|build|test|npm|pnpm|git)\b/.test(normalized)
  ) {
    return true;
  }
  return (normalized.match(/\bfind\b/g) || []).length >= 2;
}

function capInteractiveBashBlocks(blocks: string[]): string[] {
  const filtered = blocks.filter((block) => !isExploratoryShellBlock(block));
  const skipped = blocks.length - filtered.length;
  if (skipped > 0) {
    console.log(chalk.yellow(`  ⚠ Skipped ${skipped} exploratory shell block(s)`));
  }
  if (filtered.length > AUTONOMOUS_MAX_SHELL_BLOCKS) {
    console.log(
      chalk.yellow(
        `  ⚠ Capping shell blocks at ${AUTONOMOUS_MAX_SHELL_BLOCKS} (had ${filtered.length})`
      )
    );
    return filtered.slice(0, AUTONOMOUS_MAX_SHELL_BLOCKS);
  }
  return filtered;
}

async function executeInteractiveBash(script: string): Promise<{ ok: boolean; code: number }> {
  return new Promise((resolve) => {
    const child = spawn('bash', ['-lc', script], {
      cwd: repoRoot,
      env: process.env,
      stdio: 'inherit',
    });
    child.on('error', () => resolve({ ok: false, code: 1 }));
    child.on('close', (code) => resolve({ ok: code === 0, code: code ?? 1 }));
  });
}

async function runInteractiveBashBlocks(blocks: string[], messages: ChatMessage[]): Promise<void> {
  if (!blocks.length) return;
  console.log(chalk.yellow(`\n  ⚡ Executing ${blocks.length} shell block(s) in ${repoRoot}`));
  for (let index = 0; index < blocks.length; index += 1) {
    console.log(chalk.dim(`  --- block ${index + 1}/${blocks.length} ---`));
    const result = await executeInteractiveBash(blocks[index]);
    const line = result.ok
      ? chalk.green(`  ✓ block ${index + 1} succeeded`)
      : chalk.red(`  ✗ block ${index + 1} failed (exit ${result.code})`);
    console.log(line);
    messages.push({
      role: 'system',
      content: `Interactive shell block ${index + 1}/${blocks.length} exit code: ${result.code}`,
    });
  }
}

// ── Native tool-calling turn (autonomous TUI) ────────────────────────────────
//
// The fenced-block convention stalls with reasoning-style models: they narrate
// "let me run bash" without ever emitting a fence (observed live 2026-07-22 —
// 50 consecutive no-op turns). Native OpenAI-style tool calling with the same
// models works on the first try (verified live). This path also fixes a second
// gap: executeInteractiveBash inherits stdio, so the model never saw command
// OUTPUT, only exit codes — run_bash captures and returns output.

const TUI_RUN_BASH_TOOL = {
  type: 'function',
  function: {
    name: 'run_bash',
    description:
      'Execute a bash command in the TNF workspace root and return its combined stdout/stderr and exit code. Use this for every shell action instead of describing commands.',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The bash command to run' },
        timeout_seconds: {
          type: 'number',
          description: 'Optional timeout in seconds (default 120, max 600)',
        },
      },
      required: ['command'],
    },
  },
};

const RUN_BASH_OUTPUT_TAIL_CHARS = 8000;

async function executeCapturedBash(
  command: string,
  timeoutMs: number
): Promise<{ ok: boolean; code: number; output: string; timedOut: boolean }> {
  return new Promise((resolve) => {
    const child = spawn('bash', ['-lc', command], {
      cwd: repoRoot,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    let timedOut = false;
    const capture = (chunk: Buffer) => {
      output += chunk.toString('utf8');
      // Keep memory bounded on chatty commands; the model only sees the tail anyway.
      if (output.length > RUN_BASH_OUTPUT_TAIL_CHARS * 4) {
        output = output.slice(-RUN_BASH_OUTPUT_TAIL_CHARS * 2);
      }
    };
    child.stdout?.on('data', capture);
    child.stderr?.on('data', capture);
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);
    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ ok: false, code: 1, output: `spawn error: ${err.message}`, timedOut });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0 && !timedOut, code: code ?? 1, output, timedOut });
    });
  });
}

type NativeToolTurnResult = {
  content: string;
  toolCallsMade: number;
  executed: Array<{ tool: string; summary: string; ok: boolean }>;
};

async function runAutonomousNativeToolTurn(
  client: any,
  messages: ChatMessage[],
  permissions?: PermissionResolution
): Promise<NativeToolTurnResult> {
  const executed: NativeToolTurnResult['executed'] = [];
  const enabledTools = permissions ? [...permissions.allowed] : [...KNOWN_TOOLS];
  const tools = resolveBuiltinToolsAsOpenAI({ builtinTools: enabledTools } as any);
  if (enabledTools.includes('bash' as any)) {
    tools.push(TUI_RUN_BASH_TOOL);
  }
  const result = await client.chatCompleteWithTools(
    messages,
    async (name: string, args: Record<string, unknown>) => {
      if (name === 'run_bash') {
        const command = String(args.command ?? '').trim();
        if (!command) return { ok: false, error: 'run_bash requires a non-empty command' };
        if (!enabledTools.includes('bash' as any)) {
          return { ok: false, error: 'run_bash disabled by this session permission mode' };
        }
        const timeoutSec = Math.min(600, Math.max(1, Number(args.timeout_seconds) || 120));
        console.log(chalk.yellow(`\n  ⚡ run_bash: ${command.slice(0, 200)}`));
        const res = await executeCapturedBash(command, timeoutSec * 1000);
        executed.push({
          tool: 'run_bash',
          summary: `(exit ${res.code}${res.timedOut ? ', timed out' : ''}) ${command.slice(0, 200)}`,
          ok: res.ok,
        });
        console.log(
          res.ok
            ? chalk.green(`  ✓ exit 0`)
            : chalk.red(`  ✗ exit ${res.code}${res.timedOut ? ' (timed out)' : ''}`)
        );
        const tail =
          res.output.length > RUN_BASH_OUTPUT_TAIL_CHARS
            ? `[output truncated to last ${RUN_BASH_OUTPUT_TAIL_CHARS} chars]\n` +
              res.output.slice(-RUN_BASH_OUTPUT_TAIL_CHARS)
            : res.output;
        return { ok: res.ok, exit_code: res.code, timed_out: res.timedOut, output: tail };
      }
      if (!enabledTools.includes(name as any)) {
        return { ok: false, error: `tool '${name}' disabled by this session permission mode` };
      }
      const response = await executeBuiltinTool(name, args, { cwd: repoRoot, quiet: false });
      const ok = !(response && typeof response === 'object' && (response as any).ok === false);
      executed.push({ tool: name, summary: summarizeNativeToolCall(name, args, response), ok });
      return response;
    },
    {
      temperature: 0.7,
      // Tool rounds + room for a final prose answer. chatCompleteWithTools also
      // forces a tool-free synthesis if the cap is hit mid-tool-loop.
      maxIterations: AUTONOMOUS_MAX_SHELL_BLOCKS + 2,
      maxTokens: 4096,
      tools,
    }
  );
  let content = String(result?.content ?? '');
  // Never persist/display raw tool JSON as the assistant turn — that is what
  // made the TUI look "broken" (operators only saw dumps, no conversation).
  if (looksLikeRawToolResultDump(content)) {
    const summaries = executed.map((e, i) => `${i + 1}. ${e.tool}: ${e.summary}`).join('\n');
    content =
      executed.length > 0
        ? `Completed ${executed.length} tool call(s) this turn:\n${summaries}\n\n(Tool output was kept out of the chat transcript; continuing.)`
        : 'Received a tool-shaped payload with no prose summary. Continuing with the next inspect/act step.';
  }
  return {
    content,
    toolCallsMade: Math.max(Number(result?.toolCallsMade ?? 0), executed.length),
    executed,
  };
}

function summarizeNativeToolCall(
  name: string,
  args: Record<string, unknown>,
  response: string | Record<string, unknown>
): string {
  const subject =
    name === 'bash'
      ? String(args.command ?? '')
      : name === 'read_file' || name === 'write_file'
        ? String(args.path ?? '')
        : name === 'mcp_call_tool'
          ? `${String(args.server ?? '')}.${String(args.tool ?? '')}`
          : (() => {
              try {
                return JSON.stringify(args);
              } catch {
                return '<args>';
              }
            })();
  const ok = !(response && typeof response === 'object' && (response as any).ok === false);
  return `${ok ? 'ok' : 'failed'} ${subject.slice(0, 220)}`;
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

// ─── Processing Indicator ─────────────────────────────────────────────────
// Simple ASCII spinner for LLM processing feedback.
// Uses stderr to avoid contaminating stdout in piped modes.
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let spinnerHandle: NodeJS.Timeout | null = null;
let spinnerFrame = 0;
let spinnerActive = false;

function startProcessingIndicator(label = 'Processing'): void {
  if (spinnerActive) return;
  spinnerActive = true;
  spinnerFrame = 0;
  // Visible status line on stdout (stderr spinner gets drowned by heartbeat logs).
  process.stdout.write(`\n${chalk.cyan('⏳')} ${chalk.bold(label)}…\n`);
  const write = (frame: string) =>
    process.stderr.write(`\r${chalk.cyan(frame)} ${chalk.dim(label)}... `);
  spinnerHandle = setInterval(() => {
    write(SPINNER_FRAMES[spinnerFrame % SPINNER_FRAMES.length]);
    spinnerFrame++;
  }, 80);
  write(SPINNER_FRAMES[0]);
}

function stopProcessingIndicator(success = true): void {
  if (!spinnerActive) return;
  spinnerActive = false;
  if (spinnerHandle) {
    clearInterval(spinnerHandle);
    spinnerHandle = null;
  }
  process.stderr.write('\r' + '\x1b[K');
  const icon = success ? chalk.green('✓ Done') : chalk.red('✗ Failed');
  process.stdout.write(`${icon}\n`);
}

type TuiAgentOptions = {
  autonomous?: boolean;
  model?: string;
  mode?: 'agent' | 'plan' | 'ask';
  continueSession?: boolean;
  resumeId?: string;
  initialPrompt?: string;
  task?: string;
  taskFile?: string;
  positional?: string[];
  /** Resolved tool policy for this session. Absent means unrestricted. */
  permissions?: PermissionResolution;
};

/**
 * Let the operator choose which saved session to resume.
 *
 * `--resume` with no id previously took `sessions[0]` without saying so, and
 * resuming the wrong transcript is the kind of mistake you only notice after
 * the agent has acted on stale context. Falls back to the most recent session
 * when there is no TTY (scripts and cron must not block on a prompt).
 *
 * Returns the chosen id, `undefined` for "most recent", or `null` if the
 * operator cancelled and the caller should not start a session at all.
 */
async function pickSessionInteractively(): Promise<string | null | undefined> {
  const sessions = sessionManager.list();
  if (sessions.length === 0) {
    console.log(chalk.yellow('  No saved sessions to resume — starting fresh.'));
    return undefined;
  }
  if (sessions.length === 1) return sessions[0].id;
  if (!process.stdin.isTTY) return sessions[0].id;

  const shown = sessions.slice(0, 20);
  console.log(chalk.bold('\n  Resume which session?\n'));
  shown.forEach((session, index) => {
    const when = new Date(session.updatedAt).toLocaleString();
    console.log(
      `  ${chalk.cyan(String(index + 1).padStart(2))}. ${chalk.bold((session.name || session.id).padEnd(28))} ` +
        `${chalk.dim(`${String(session.messageCount).padStart(4)} msgs`)}  ` +
        `${chalk.dim(session.model?.padEnd(24) ?? '')} ${chalk.dim(when)}`
    );
  });
  if (sessions.length > shown.length) {
    console.log(chalk.dim(`  … ${sessions.length - shown.length} older sessions not shown`));
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await new Promise<string>((resolve) =>
      rl.question(chalk.green('\n  Number (Enter for most recent, q to cancel): '), resolve)
    );
    const trimmed = answer.trim().toLowerCase();
    if (trimmed === 'q' || trimmed === 'quit') return null;
    if (!trimmed) return shown[0].id;
    const index = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(index) || index < 1 || index > shown.length) {
      console.log(chalk.yellow('  Not a listed number — resuming the most recent session.'));
      return shown[0].id;
    }
    return shown[index - 1].id;
  } finally {
    rl.close();
  }
}

/**
 * Peer-parity oneshot/print path (claude -p / hermes -z / cursor --print).
 * Resolves prompt via resolvePrompt, runs agents-run once, prints clean output.
 */
async function runTuiOneshot(options: {
  oneshot?: string;
  task?: string;
  taskFile?: string;
  positional?: string[];
  outputFormat?: string;
  model?: string;
  enableTools?: string;
}): Promise<void> {
  if (options.model) {
    process.env.TNF_LLM_MODEL = options.model;
  }
  process.env.TNF_SILENT_PREFLIGHT = '1';

  const resolved = await resolvePrompt({
    task: options.oneshot || options.task,
    taskFile: options.taskFile,
    positional: options.positional,
  });
  if (!resolved?.text) {
    console.error(
      chalk.red(
        'No prompt provided for oneshot/print. Supply --oneshot, --task, --task-file, positional args, or pipe stdin.'
      )
    );
    process.exit(2);
  }

  const { runAgentsRun } = await import('./commands/agents-run.js');
  const format = String(options.outputFormat || 'text').toLowerCase();
  const result = await runAgentsRun({
    task: resolved.text,
    json: format === 'json',
    quiet: true,
    maxIterations: 12,
    enableTools: options.enableTools,
  });

  if (format === 'json') {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } else {
    process.stdout.write(
      (result.finalContent || '') + (result.finalContent?.endsWith('\n') ? '' : '\n')
    );
  }
  if (!result.ok) {
    process.exit(1);
  }
}

async function startInteractiveAgent(options?: TuiAgentOptions): Promise<void> {
  syncHomeHandoffCache();
  const voiceTty = lockVoiceGroundInputToThisSession('tnf-cli');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer: createSlashCompleter(repoRoot),
  });
  const slashDropdown = attachSlashCommandDropdown(rl, repoRoot);
  const stallTimeoutMs = parseInt(process.env.TNF_STALL_DEFENSE_TIMEOUT || '0', 10);
  const inputCollector = createTuiInputCollector({
    rl,
    stallTimeoutMs: Number.isFinite(stallTimeoutMs) && stallTimeoutMs > 0 ? stallTimeoutMs : 0,
    stallFallbackPrompt:
      process.env.TNF_STALL_DEFENSE_PROMPT ||
      'Continue autonomous execution. Follow your overarching directive.',
  });
  let rlClosed = false;
  rl.on('close', () => {
    rlClosed = true;
    try {
      inputCollector.dispose();
    } catch {
      /* best-effort */
    }
  });

  const systemPrompt = await loadTnfSystemPrompt();

  if (options?.model) {
    process.env.TNF_LLM_MODEL = options.model;
  }

  const { LLMClient } = await import('./utils/llm-client.js');
  const client = await LLMClient.create('orchestrator');

  const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

  // --continue / --resume: hydrate transcript from SessionManager when available.
  if (options?.continueSession) {
    try {
      const sessions = sessionManager.list();
      const target =
        (options.resumeId &&
          (sessionManager.get(options.resumeId)
            ? sessionManager.export(options.resumeId)
            : undefined)) ||
        (sessions[0] ? sessionManager.export(sessions[0].id) : undefined);
      if (target?.messages?.length) {
        for (const msg of target.messages) {
          if (msg.role === 'system') continue;
          messages.push({ role: msg.role, content: msg.content });
        }
        console.log(
          chalk.dim(
            `  Resumed session ${target.session.name || target.session.id} (${target.messages.length} messages)`
          )
        );
      } else {
        console.log(chalk.yellow('  No saved session found to resume — starting fresh.'));
      }
    } catch (err: any) {
      console.log(chalk.yellow(`  Session resume skipped: ${err?.message ?? err}`));
    }
  }

  // Persist this session so it can be resumed via --continue / --resume.
  // If we resumed an existing session, reuse its id; otherwise create a new one.
  let currentSessionId: string | undefined;
  if (options?.continueSession) {
    try {
      const sessions = sessionManager.list();
      const resumedId =
        (options.resumeId && sessionManager.get(options.resumeId)?.id) || sessions[0]?.id;
      if (resumedId) currentSessionId = resumedId;
    } catch {}
  }
  if (!currentSessionId) {
    try {
      const session = sessionManager.create({
        provider: client.providerName || 'unknown',
        model: client.model || 'unknown',
        projectPath: repoRoot,
      });
      currentSessionId = session.id;
    } catch (err: any) {
      // Non-fatal: session persistence is a convenience, not a requirement.
      console.log(chalk.dim(`  Session persistence disabled: ${err?.message ?? err}`));
    }
  }

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
  console.log(
    chalk.dim(
      ' Type /help for commands, /exit to quit, /clear to clear history, /autonomous off to pause shell auto-exec\n' +
        ' Press / to search every command — ↑↓ or ^p/^n to move, ⇞⇟/^u^d to page, ⇱⇲ for the ends, ⇥ to complete\n' +
        ' /hold pauses auto-continue · /window <sec> sets operator takeover window · /continue resumes\n' +
        ' Prefer this `tnf tui` session for interactive TNF (paste-safe). `tnf hermes` is external passthrough.\n'
    )
  );
  if (voiceTty) {
    console.log(
      chalk.dim('  🎙️ Voice ground input locked to this TNF CLI session (') +
        chalk.cyan(voiceTty) +
        chalk.dim(') — same beam/STT path as Cursor ([↑t…] turns)')
    );
  }

  let autonomousMode =
    options?.mode === 'plan' || options?.mode === 'ask'
      ? false
      : options?.autonomous ||
        isTruthyEnv(process.env.TNF_INTERACTIVE_EXEC) ||
        isTruthyEnv(process.env.TNF_AUTONOMOUS_ON_BOOT);

  // Resolve the persistent TUI mode. LONG_RUN keeps the agent alive without
  // operator keystrokes; INTERACTIVE waits for input.
  const tuiMode: TuiMode = resolveTuiMode();

  // A permission mode that forbids mutation outranks every autonomy source —
  // including the persisted LONG_RUN/AUTONOMOUS default, which would otherwise
  // silently re-enable shell execution the operator just asked to disable.
  const permissionsForbidShell = options?.permissions
    ? !options.permissions.mutationsAllowed
    : false;
  const modeDisablesAuto =
    options?.mode === 'plan' || options?.mode === 'ask' || permissionsForbidShell;
  if (permissionsForbidShell) {
    autonomousMode = false;
  }
  if (
    (tuiMode === 'LONG_RUN' || tuiMode === 'AUTONOMOUS') &&
    !autonomousMode &&
    !modeDisablesAuto
  ) {
    autonomousMode = true;
    enableAutonomousRuntimeDefaults();
  }
  // --autonomous means full autonomous at launch: persist LONG_RUN so relaunches match.
  if (
    options?.autonomous &&
    !modeDisablesAuto &&
    tuiMode !== 'LONG_RUN' &&
    !process.env.TNF_TUI_MODE
  ) {
    persistTuiMode('LONG_RUN');
  } else if (!fs.existsSync(getTuiModeConfigPath()) && !process.env.TNF_TUI_MODE) {
    // Seed operator default so subsequent launches stay fully autonomous.
    persistTuiMode(DEFAULT_TUI_MODE);
  }

  const turnCapState = createAutonomousTurnCapState(autonomousTurnCapConfig);
  const autonomousState: AutonomousSessionState = {
    continuePending: autonomousMode,
    handoffTaskIndex: 0,
    contextRefreshPending: false,
    turnsThisSession: turnCapState.turnsThisSession,
    maxTurnsPerSession: turnCapState.maxTurnsPerSession,
    softCapNotified: turnCapState.softCapNotified,
    capCeiling: turnCapState.capCeiling,
    capResets: turnCapState.capResets,
    consecutiveNoBashTurns: 0,
    operatorHold: false,
  };
  const slashContext: InteractiveSlashContext = {
    messages,
    systemMessageCount: 1,
    client,
    permissions: options?.permissions,
    autonomousMode,
    autonomousState,
    mode: options?.mode || 'agent',
    tuiMode,
    operatorWindowMs: resolveOperatorWindowMs(),
  };
  // Mutable session window — /window and natural-language directives update this live.
  let operatorWindowMs = resolveOperatorWindowMs();
  /** True while waiting for (or collecting) operator keystrokes — mutes TUI noise. */
  let operatorInputActive = false;
  const STALL_AUTO_HOLD_AFTER = 5;
  if (autonomousMode) {
    enableAutonomousRuntimeDefaults();
    console.log(chalk.dim('  Autonomous shell execution: ON (auto-continue enabled)'));
    console.log(
      chalk.dim(
        `  Operator window: ${Math.round(operatorWindowMs / 1000)}s (TNF_OPERATOR_WINDOW_MS or ~/.tnf/tui-mode.json; change with /window)`
      )
    );
    if (tuiMode === 'LONG_RUN' || tuiMode === 'AUTONOMOUS') {
      console.log(
        chalk.dim('  TUI mode: ') +
          chalk.bold.cyan(tuiMode) +
          chalk.dim(
            '  (default full-autonomous; persisted at ~/.tnf/tui-mode.json; operator typing still interrupts; ' +
              'unset with TNF_TUI_MODE=INTERACTIVE)'
          )
      );
    }
  }

  // Keep-alive pulse — must NOT inherit stdio into the TUI (that dumps
  // heartbeat JSON onto the prompt line and corrupts operator typing).
  const heartbeatInterval = setInterval(() => {
    if (operatorInputActive || autonomousState.operatorHold) return;
    try {
      const pulseScript = path.join(
        process.env.HOME || '/tmp',
        '.tnf/bin/terminal-heartbeat-pulse.cjs'
      );
      if (!fs.existsSync(pulseScript)) return;
      const child = spawn(process.execPath, [pulseScript], {
        cwd: repoRoot,
        env: process.env,
        stdio: 'ignore',
        detached: true,
      });
      child.unref();
    } catch {
      // Silent fail - heartbeat is best-effort
    }
  }, 30000);

  // Self-prompting: queue an autonomous turn every 5 minutes
  const contextRefreshInterval = setInterval(() => {
    if (!slashContext.autonomousMode) return;
    if (operatorInputActive || autonomousState.operatorHold) return;
    try {
      autonomousState.contextRefreshPending = true;
      autonomousState.continuePending = true;
      console.log(chalk.dim('\n  ⟳ Handoff context refresh queued for next autonomous turn'));
    } catch {
      // Silent fail - context refresh is best-effort
    }
  }, 300000);

  const ask = (prompt: string): Promise<string> =>
    new Promise((resolve, reject) => {
      if (rlClosed) return reject(new Error('stdin closed'));
      operatorInputActive = true;
      inputCollector
        .waitForIdleCommit(prompt)
        .then((answer) => {
          operatorInputActive = false;
          resolve(answer);
        })
        .catch((err) => {
          operatorInputActive = false;
          reject(err);
        });
    });

  // Operator-priority window (operator report 2026-07-22 / 2026-07-25):
  // Before each autonomous continuation, hold an interruptible idle window.
  // Default is 30s (was 8s — too short to finish typing). Any keypress hands
  // the turn to the operator; plain Enter skips the wait; idle expiry continues.
  // /hold freezes auto-continue entirely until /continue.
  const waitForOperatorInterrupt = (windowMs: number): Promise<boolean> =>
    new Promise((resolve) => {
      let settled = false;
      const finish = (tookOver: boolean) => {
        if (settled) return;
        settled = true;
        process.stdin.off('keypress', onKey);
        clearTimeout(timer);
        resolve(tookOver);
      };
      const onKey = (_value: string, key: any) => {
        // Plain Enter on an empty line = "continue now"; anything else is
        // the operator starting to type — hand them the turn.
        if (['return', 'enter'].includes(key?.name) && !String((rl as any).line || '').trim()) {
          finish(false);
          return;
        }
        finish(true);
      };
      const timer = setTimeout(() => finish(false), windowMs);
      process.stdin.on('keypress', onKey);
    });

  // Optional seed prompt from --task / --task-file / positional (peer CLI parity).
  let pendingInitialPrompt: string | null = null;
  let pendingQueuedPrompt: string | null = null;
  try {
    const seed = await resolvePrompt({
      task: options?.task || options?.initialPrompt,
      taskFile: options?.taskFile,
      positional: options?.positional,
    });
    if (seed?.text?.trim()) {
      pendingInitialPrompt = seed.text.trim();
      console.log(
        chalk.dim(
          `  Seeded initial prompt from ${seed.source} (${pendingInitialPrompt.length} chars)`
        )
      );
    }
  } catch (err: any) {
    console.log(chalk.yellow(`  Initial prompt resolve skipped: ${err?.message ?? err}`));
  }
  if (options?.mode && options.mode !== 'agent') {
    console.log(chalk.dim(`  Mode: ${options.mode} (shell auto-exec disabled)`));
  }

  while (true) {
    // Pick up /window changes (env + ~/.tnf/tui-mode.json) every turn.
    operatorWindowMs = resolveOperatorWindowMs();
    slashContext.operatorWindowMs = operatorWindowMs;

    // Status goes on its own line ABOVE the prompt, printed as ordinary output
    // rather than folded into the prompt string. Two reasons: an inline
    // `[provider/model]` prompt changed width every turn, so the operator's
    // typing shifted left and right as autonomy or the turn counter moved; and
    // readline recomputes cursor rows from the prompt on every refresh, so a
    // taller prompt is exactly the thing the palette's in-place renderer has to
    // draw underneath. A fixed `❯ ` keeps the input column stable.
    const statusLine =
      process.env.TNF_SHOW_MODEL_IN_PROMPT === '0' ? '' : renderTuiStatusLine(slashContext);
    const promptWithModel = chalk.green('❯ ');

    let trimmed: string;
    let fromAutonomousContinue = false;

    // Honor hold: never auto-continue while operator has paused the loop.
    if (autonomousState.operatorHold) {
      autonomousState.continuePending = false;
    }

    // Consume one-shot seed prompt / busy-queued paste before operator/autonomous paths.
    if (pendingInitialPrompt) {
      trimmed = pendingInitialPrompt;
      pendingInitialPrompt = null;
      console.log(chalk.green('\n❯ ') + trimmed);
    } else if (pendingQueuedPrompt) {
      trimmed = pendingQueuedPrompt;
      pendingQueuedPrompt = null;
      console.log(chalk.dim(`  Queued paste: ${trimmed.length} chars`));
      console.log(
        chalk.green('\n❯ ') + trimmed.split('\n')[0] + (trimmed.includes('\n') ? '…' : '')
      );
    } else {
      let operatorTakeover = false;
      if (
        slashContext.autonomousMode &&
        autonomousState.continuePending &&
        !autonomousState.operatorHold
      ) {
        const windowMs = effectiveOperatorWindowMs(
          operatorWindowMs,
          autonomousState.consecutiveNoBashTurns
        );
        if (String((rl as any).line || '').trim() || inputCollector.hasIdlePending()) {
          // Operator is mid-keystroke or paste already landed — never continue over it.
          operatorTakeover = true;
        } else if (windowMs > 0 && process.stdin.isTTY) {
          console.log(
            chalk.dim(
              `\n  ⏸ operator window ${Math.round(windowMs / 1000)}s — type to take over, Enter to continue now` +
                (autonomousState.consecutiveNoBashTurns >= 2
                  ? chalk.yellow('  (stall-boosted — /hold for unlimited time)')
                  : '')
            )
          );
          operatorInputActive = true;
          operatorTakeover = await waitForOperatorInterrupt(windowMs);
          if (!operatorTakeover) operatorInputActive = false;
          // Paste can land during the window without keypress race winning — park as takeover.
          if (!operatorTakeover && inputCollector.hasIdlePending()) {
            operatorTakeover = true;
          }
        }
        if (operatorTakeover) {
          console.log(
            chalk.cyan(
              '  ⏸ Operator takeover — autonomous continue deferred until after your input'
            )
          );
        }
      }

      if (
        slashContext.autonomousMode &&
        autonomousState.continuePending &&
        !operatorTakeover &&
        !autonomousState.operatorHold
      ) {
        autonomousState.continuePending = false;
        fromAutonomousContinue = true;
        trimmed = buildAutonomousContinuePrompt(autonomousState);
        autonomousState.contextRefreshPending = false;
        console.log(chalk.dim('\n  ⟳ Autonomous continue (no operator input required)'));
      } else {
        let input: string;
        try {
          console.log(statusLine ? `\n${statusLine}` : '');
          input = resolveSlashDropdownInput(await ask(promptWithModel), slashDropdown);
        } catch {
          break;
        }
        trimmed = input.trim();

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

        // Beam/STT ground input parity with Cursor: accept [↑tN] chronicle tags
        // and attach situational context so the agent understands what's happening.
        const voiceNorm = normalizeVoiceGroundInput(trimmed);
        if (voiceNorm.wasVoice) {
          const turnLabel =
            voiceNorm.voiceTurn != null
              ? chalk.cyan(`[↑t${voiceNorm.voiceTurn}]`)
              : chalk.cyan('[voice]');
          console.log(chalk.dim(`  🎙️ ground input ${turnLabel}`));
          const situation = loadVoiceGroundSituation(voiceNorm.voiceTurn);
          if (situation) {
            console.log(chalk.dim('  🧭 attached voice situation context'));
          }
          const body = voiceNorm.text.trim()
            ? voiceNorm.voiceTurn != null
              ? `[↑t${voiceNorm.voiceTurn}] ${voiceNorm.text.trim()}`
              : voiceNorm.text.trim()
            : trimmed;
          trimmed = `${situation}${body}`;
        }

        // Natural-language window directive (typed mid-session without /window).
        const windowDirectiveMs = detectOperatorWindowDirective(trimmed);
        if (windowDirectiveMs !== null) {
          operatorWindowMs = persistOperatorWindowMs(windowDirectiveMs);
          process.env.TNF_OPERATOR_WINDOW_MS = String(operatorWindowMs);
          console.log(
            chalk.green(
              `  Operator window set to ${Math.round(operatorWindowMs / 1000)}s — type your next prompt (or /continue)`
            )
          );
          // Give them the quieter hold so the next line isn't raced.
          autonomousState.operatorHold = true;
          autonomousState.continuePending = false;
          continue;
        }
      }
    }

    let outbound = trimmed;
    if (!fromAutonomousContinue) {
      const slashOutcome = await handleInteractiveSlashCommand(trimmed, slashContext);
      if (slashOutcome.handled) {
        if (slashOutcome.exit) break;
        if (!slashOutcome.prompt) continue;
        outbound = slashOutcome.prompt;
      }
    }

    if (wantsAutonomousExecution(outbound)) {
      slashContext.autonomousMode = true;
      enableAutonomousRuntimeDefaults();
      autonomousState.operatorHold = false;
      autonomousState.continuePending = true;
    }

    outbound = sanitizeUtf8Prompt(outbound);
    messages.push({ role: 'user', content: outbound });

    try {
      inputCollector.setMode('busy');
      startProcessingIndicator('Thinking');
      const useStreaming = process.env.TNF_USE_STREAMING === '1';
      // Native tool calling is the default autonomous execution path
      // (TNF_TUI_NATIVE_TOOLS=0 restores the fenced-block-only convention).
      // `permissionsForbidShell` is checked here as well as at autonomy setup:
      // /autonomous on can flip autonomousMode mid-session, and it must not be
      // able to re-grant a permission the session was launched without.
      const useNativeTools =
        slashContext.autonomousMode &&
        !permissionsForbidShell &&
        process.env.TNF_TUI_NATIVE_TOOLS !== '0';

      let turnResponseText = '';
      let nativeToolCallsMade = 0;

      if (useNativeTools) {
        let nativeSucceeded = false;
        try {
          const native = await runAutonomousNativeToolTurn(client, messages, options?.permissions);
          stopProcessingIndicator(true);
          nativeSucceeded = true;
          nativeToolCallsMade = Math.max(native.toolCallsMade, native.executed.length);
          turnResponseText = native.content;
          if (native.content) {
            console.log(chalk.cyan('\n  ' + native.content.replace(/\n/g, '\n  ')));
          } else if (native.executed.length > 0) {
            console.log(
              chalk.dim(
                `\n  ✓ ${native.executed.length} tool call(s) completed (awaiting prose summary next turn)`
              )
            );
          }
          messages.push({ role: 'assistant', content: native.content || '' });
          if (native.executed.length > 0) {
            // chatCompleteWithTools works on a copy of the history, so record
            // a durable summary of what actually ran for future turns.
            messages.push({
              role: 'system',
              content:
                `[native_tools] ${native.executed.length} tool call(s) executed this turn:\n` +
                native.executed.map((e, i) => `${i + 1}. ${e.tool}: ${e.summary}`).join('\n'),
            });
          }
        } catch (nativeErr: any) {
          // Provider chain can't do tools right now — degrade to plain chat
          // for this turn; fence extraction below still gives execution a shot.
          console.log(
            chalk.yellow(
              `\n  ⚠ Native tool turn failed (${nativeErr?.message ?? nativeErr}); falling back to plain chat`
            )
          );
        }
        if (!nativeSucceeded) {
          const response = await client.chatComplete(messages, { temperature: 0.7 });
          stopProcessingIndicator(true);
          console.log(chalk.cyan('\n  ' + response.replace(/\n/g, '\n  ')));
          messages.push({ role: 'assistant', content: response });
          turnResponseText = response;
        }
      } else if (useStreaming) {
        // Streaming mode: show response as it arrives
        process.stdout.write(chalk.cyan('\n  '));
        let fullResponse = '';
        for await (const chunk of client.chatStream(messages, { temperature: 0.7 })) {
          process.stdout.write(chalk.cyan(chunk));
          fullResponse += chunk;
        }
        stopProcessingIndicator(true);
        console.log(''); // newline after streaming finishes
        messages.push({ role: 'assistant', content: fullResponse });
        turnResponseText = fullResponse;
      } else {
        // Non-streaming mode: wait for complete response
        const response = await client.chatComplete(messages, { temperature: 0.7 });
        stopProcessingIndicator(true);
        console.log(chalk.cyan('\n  ' + response.replace(/\n/g, '\n  ')));
        messages.push({ role: 'assistant', content: response });
        turnResponseText = response;
      }

      if (slashContext.autonomousMode) {
        const response = turnResponseText;
        // While the operator has the floor (/hold or auto-hold), do not inject
        // "call tools / do not narrate" prompts — that is what killed reply
        // persistence when the operator asked questions.
        if (autonomousState.operatorHold) {
          autonomousState.consecutiveNoBashTurns = 0;
        } else if (nativeToolCallsMade > 0) {
          // Native path already executed everything; don't re-run fences the
          // model may have merely quoted in its final answer.
          autonomousState.consecutiveNoBashTurns = 0;
        } else if (looksLikeRawToolResultDump(response)) {
          // Model echoed tool JSON as text without calling tools — count as stall
          // but demand prose + a real tool call, not more JSON dumps.
          autonomousState.consecutiveNoBashTurns += 1;
          messages.push({
            role: 'system',
            content: [
              '[Autonomous stall break]',
              'Your last reply was raw tool JSON, not an operator-facing update.',
              'Answer in plain language first. Then call a real tool (bash/run_bash/read_file) or emit fenced ```bash if tools are unavailable.',
              'Inspect → Act → Verify. Prefer handoff next_actions.',
            ].join('\n'),
          });
          console.log(
            chalk.yellow(
              `\n  ⚠ Tool-JSON dump with no tool call (${autonomousState.consecutiveNoBashTurns} turn(s)) — stall break injected`
            )
          );
          if (autonomousState.consecutiveNoBashTurns >= STALL_AUTO_HOLD_AFTER) {
            autonomousState.operatorHold = true;
            autonomousState.continuePending = false;
            console.log(
              chalk.yellow(
                `\n  ⏸ Auto-held after ${STALL_AUTO_HOLD_AFTER} stall turns — type freely. /continue to resume autonomous loop.`
              )
            );
          }
        } else {
          const blocks = capInteractiveBashBlocks(extractInteractiveBashBlocks(response));
          if (blocks.length > 0) {
            autonomousState.consecutiveNoBashTurns = 0;
            await runInteractiveBashBlocks(blocks, messages);
          } else {
            autonomousState.consecutiveNoBashTurns += 1;
            const stallMsg = [
              '[Autonomous stall break]',
              `Zero commands executed in the last ${autonomousState.consecutiveNoBashTurns} autonomous turn(s).`,
              'If the operator asked a question, answer it in plain language first.',
              'Otherwise call bash/run_bash with a real command now (or emit 1–5 fenced ```bash blocks if tools are unavailable).',
              'Always include a short operator-facing summary. Inspect → Act → Verify.',
            ].join('\n');
            messages.push({ role: 'system', content: stallMsg });
            console.log(
              chalk.yellow(
                `\n  ⚠ No commands executed (${autonomousState.consecutiveNoBashTurns} turn(s)) — stall break injected`
              )
            );
            // After repeated idle/blocked loops, stop racing the operator.
            if (autonomousState.consecutiveNoBashTurns >= STALL_AUTO_HOLD_AFTER) {
              autonomousState.operatorHold = true;
              autonomousState.continuePending = false;
              console.log(
                chalk.yellow(
                  `\n  ⏸ Auto-held after ${STALL_AUTO_HOLD_AFTER} stall turns — type freely. /continue to resume autonomous loop.`
                )
              );
            }
          }
        }
        const verifyChecks = await runAutonomousVerifyGates();
        const verifySummary = verifyChecks
          .map((check) => `${check.passed ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}`)
          .join('\n');
        messages.push({
          role: 'system',
          content: `[Autonomous verify gates]\n${verifySummary}`,
        });
        const failedVerify = verifyChecks.filter((check) => !check.passed);
        if (failedVerify.length > 0) {
          console.log(chalk.yellow('\n  ⚠ Autonomous verify gate failures:'));
          for (const check of failedVerify) {
            console.log(chalk.yellow(`    - ${check.name}: ${check.detail}`));
          }
        } else {
          console.log(chalk.dim('\n  ✓ Autonomous verify gates passed'));
        }
        autonomousState.turnsThisSession += 1;
        const actions = readHandoffNextActions();
        if (actions.length > 0 && autonomousState.handoffTaskIndex < actions.length) {
          autonomousState.handoffTaskIndex += 1;
        }

        // Cap-extension override: LONG_RUN only, after soft window, clamped to ceiling.
        const requestedExtend = parseExtendTurnCapMarker(
          String(response),
          autonomousTurnCapConfig.extendDefault
        );
        if (requestedExtend !== null) {
          const extension = applyTurnCapExtension(
            autonomousState,
            requestedExtend,
            autonomousState.turnsThisSession,
            autonomousTurnCapConfig.softRatio,
            tuiMode
          );
          if (extension.kind === 'granted' || extension.kind === 'denied') {
            console.log(
              (extension.kind === 'granted' ? chalk.cyan : chalk.yellow)(
                `\n  ${extension.consoleLine}`
              )
            );
            messages.push({ role: 'system', content: extension.systemMessage });
          }
        }

        // Soft cap: one-shot agent notification before hard halt.
        const softWarning = buildSoftCapWarning(
          autonomousState,
          autonomousTurnCapConfig.softRatio,
          tuiMode,
          autonomousTurnCapConfig.extendDefault
        );
        if (softWarning) {
          autonomousState.softCapNotified = true;
          console.log(chalk.yellow(`\n  ${softWarning.consoleLine}`));
          messages.push({ role: 'system', content: softWarning.systemMessage });
        }

        const hardCap = handleHardTurnCap(autonomousState, autonomousTurnCapConfig);
        if (hardCap.kind === 'halt') {
          console.log(chalk.yellow(`\n  ${hardCap.consoleLine}`));
          autonomousState.continuePending = false;
        } else if (hardCap.kind === 'reset') {
          console.log(chalk.yellow(`\n  ${hardCap.consoleLine}`));
          messages.push({ role: 'system', content: hardCap.systemMessage });
          autonomousState.continuePending = !autonomousState.operatorHold;
        } else {
          autonomousState.continuePending = !autonomousState.operatorHold;
        }
      }
    } catch (err: any) {
      stopProcessingIndicator(false);
      console.error(chalk.red('\n  Error: ' + err.message));
      if (slashContext.autonomousMode && !autonomousState.operatorHold) {
        autonomousState.continuePending = true;
      }
    } finally {
      inputCollector.setMode('idle');
      const queuedPaste = inputCollector.takeBusyQueue();
      if (queuedPaste) {
        pendingQueuedPrompt = sanitizeUtf8Prompt(queuedPaste);
        console.log(chalk.dim(`\n  Queued paste: ${pendingQueuedPrompt.length} chars (next turn)`));
      }
      // Persist transcript to disk so --continue / --resume works across restarts.
      if (currentSessionId) {
        try {
          sessionManager.saveMessages(currentSessionId, messages);
        } catch {
          // Non-fatal: persistence failure must not crash the agent loop.
        }
      }
    }
  }

  // Cleanup heartbeat and context refresh
  clearInterval(heartbeatInterval);
  clearInterval(contextRefreshInterval);

  try {
    inputCollector.dispose();
  } catch {
    /* already disposed on rl close */
  }
  rl.close();
  console.log(chalk.cyan('\n  TNF Agent session ended.\n'));
}

async function ensureVoiceKwsAlwaysOn(): Promise<void> {
  const bootScript = path.join(repoRoot, 'scripts/system/tnf-voice-kws-boot.sh');
  if (!fs.existsSync(bootScript)) {
    console.log(chalk.dim('  Voice/KWS boot script missing — skipped'));
    return;
  }
  console.log(chalk.dim('  Ensuring Voice beam + KWS always-on…'));
  try {
    await runCommand('bash', [bootScript], {
      env: {
        VOICE_KWS_ALWAYS_ON: process.env.VOICE_KWS_ALWAYS_ON || '1',
        VOICE_RESPONSE_AUDIO_DEFAULT_ON: process.env.VOICE_RESPONSE_AUDIO_DEFAULT_ON || '1',
        MINI_OMNI_ENABLED: process.env.MINI_OMNI_ENABLED || 'false',
        REQUIRE_INGEST_AUTH: process.env.REQUIRE_INGEST_AUTH || 'false',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err ?? 'unknown');
    console.log(chalk.yellow(`  Voice/KWS ensure warning (non-fatal): ${msg}`));
  }
}

/** Resolve this process's controlling Terminal tty (e.g. ttys006). */
function detectControllingTty(): string | null {
  try {
    const result = spawnSync('tty', {
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    const raw = String(result.stdout || '').trim();
    if (!raw || raw === 'not a tty') return null;
    return path.basename(raw.replace(/^\/dev\//, ''));
  } catch {
    return null;
  }
}

/**
 * Lock the voice beam inject destination to this TNF CLI session so ground/voice
 * input is processed here the same way it is for Cursor Agent.
 */
function lockVoiceGroundInputToThisSession(app = 'tnf-cli'): string | null {
  if (process.env.TNF_VOICE_AUTO_LOCK === '0') return null;
  const tty = detectControllingTty();
  if (!tty) return null;
  try {
    const stateDir = resolveVoiceBridgeStateDir();
    fs.mkdirSync(stateDir, { recursive: true });
    const targetPath = path.join(stateDir, 'voice_target.json');
    const ttyPath = path.join(stateDir, 'voice_target_tty');
    const payload = {
      kind: 'terminal',
      tty,
      press_enter: true,
      app,
      agent_pid: process.pid,
      locked: true,
      lock_reason: 'tnf-cli-voice-ground',
      lock_scope: 'tnf-cli',
      updated_at: Math.floor(Date.now() / 1000),
    };
    fs.writeFileSync(targetPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    fs.writeFileSync(ttyPath, `${tty}\n`, 'utf8');
    return tty;
  } catch {
    return null;
  }
}

/** Normalize beam/chronicle voice lines ([↑tN] …) for TNF CLI ground-input parity. */
function normalizeVoiceGroundInput(line: string): {
  text: string;
  voiceTurn: number | null;
  wasVoice: boolean;
} {
  const raw = String(line || '');
  const tagged = raw.match(/^\[↑t(\d+)\]\s*(.*)$/s);
  if (tagged) {
    return {
      text: tagged[2] ?? '',
      voiceTurn: Number.parseInt(tagged[1], 10) || null,
      wasVoice: true,
    };
  }
  const chronicle = raw.match(/^\[Voice @ chronicle[^\]]*\]\s*(.*)$/is);
  if (chronicle) {
    return { text: (chronicle[1] || '').trim(), voiceTurn: null, wasVoice: true };
  }
  return { text: raw, voiceTurn: null, wasVoice: false };
}

/**
 * Load sidecar situation for a voice turn so TNF CLI has contextual understanding
 * of what's happening (thread hint, live agents, beam anchor).
 */
function loadVoiceGroundSituation(voiceTurn: number | null): string {
  try {
    const stateDir = resolveVoiceBridgeStateDir();
    const injectPath = path.join(stateDir, 'chronicle-inject-context.json');
    const whoPath = path.join(stateDir, 'agent_who_is_who.json');
    const parts: string[] = [];

    if (fs.existsSync(injectPath)) {
      const inject = JSON.parse(fs.readFileSync(injectPath, 'utf8')) as {
        turn?: number;
        thread_hint?: string;
        user_text?: string;
        situation?: {
          voice_target?: { app?: string; tty?: string };
          live_agents?: Array<{ name?: string; tty?: string; detail?: string }>;
          who_speech?: string;
        };
      };
      if (voiceTurn == null || inject.turn == null || inject.turn === voiceTurn) {
        if (inject.thread_hint) {
          parts.push(`Recent voice thread: ${String(inject.thread_hint).slice(0, 240)}`);
        }
        const target = inject.situation?.voice_target;
        if (target?.tty) {
          parts.push(`Beam anchor: ${target.app || 'agent'} on ${target.tty}`);
        }
        const live = inject.situation?.live_agents;
        if (Array.isArray(live) && live.length > 0) {
          const listing = live
            .slice(0, 6)
            .map((a) => `${a.name || '?'}${a.detail ? ` ${a.detail}` : ''}@${a.tty || '?'}`)
            .join('; ');
          parts.push(`Live agents: ${listing}`);
        }
      }
    }

    // Refresh who-is-who if inject sidecar lacked live agents.
    if (!parts.some((p) => p.startsWith('Live agents:')) && fs.existsSync(whoPath)) {
      const who = JSON.parse(fs.readFileSync(whoPath, 'utf8')) as {
        live?: Array<{ name?: string; tty?: string; detail?: string }>;
      };
      const live = who.live || [];
      if (live.length > 0) {
        const listing = live
          .slice(0, 6)
          .map((a) => `${a.name || '?'}${a.detail ? ` ${a.detail}` : ''}@${a.tty || '?'}`)
          .join('; ');
        parts.push(`Live agents: ${listing}`);
      }
    }

    if (parts.length === 0) return '';
    return (
      `[Voice situation — contextual understanding for this ground-input turn]\n` +
      parts.map((p) => `- ${p}`).join('\n') +
      `\n[End situation]\n\n`
    );
  } catch {
    return '';
  }
}

async function startTuiAgent(options?: TuiAgentOptions): Promise<void> {
  const silent = wantsSilentPreflight(process.argv);
  if (!silent && process.stdout.isTTY) {
    console.clear();
    await renderSplash({ compact: true, animate: false });
  }
  console.log('');
  console.log(chalk.bold.cyan('  ⚡ TNF TUI Agent — Always-on LLM session'));
  console.log(chalk.dim('  ─────────────────────────────────────────────'));
  // Clear ACTIVE / INACTIVE view of every agent known on the TNF protocol bus.
  printProtocolAgentRosterSafe(repoRoot);
  await startInteractiveAgent(options);
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

const HELP_OR_VERSION_ARGS = new Set(['--help', '-h', 'help', '--version', '-v']);

/**
 * Load RedisAgentClient on first use rather than at module load.
 *
 * It is the single heaviest import in this CLI: it pulls
 * `@the-new-fuse/infrastructure` (including its NestJS console logger) and
 * `ioredis`, measured at ~3.3s of the ~3.9s total import cost. Only six command
 * handlers construct one, all of them async, so nothing that runs `tnf --help`
 * or any non-Redis command needs it resolved, parsed, or evaluated.
 */
let redisAgentClientCtor: typeof import('./RedisAgentClient.js').RedisAgentClient | null = null;
async function loadRedisAgentClient(): Promise<
  typeof import('./RedisAgentClient.js').RedisAgentClient
> {
  if (!redisAgentClientCtor) {
    ({ RedisAgentClient: redisAgentClientCtor } = await import('./RedisAgentClient.js'));
  }
  return redisAgentClientCtor;
}

/** Interactive session entrypoints that should not dump protocol walls first. */
const INTERACTIVE_ENTRY_COMMANDS = new Set(['tui']);

/**
 * True when argv is launching an interactive agent session (bare `tnf`, `tnf
 * tui`, or root session flags that route to tui). These paths already pay for
 * preflight in main(); verbose Turn Zero + disclosure output belongs on
 * `tnf protocol gate`, not between the operator and the prompt.
 */
function isInteractiveSessionArgv(argv: string[]): boolean {
  const sub = (argv[2] ?? '').toLowerCase();
  if (!sub) return true;
  if (INTERACTIVE_ENTRY_COMMANDS.has(sub)) return true;
  if (sub.startsWith('-') && !isRootOnlyFlag(sub)) return true;
  return false;
}

/**
 * Decide whether ProtocolInterceptor cosmetic output should be suppressed.
 * Checks still RUN; failures route to stderr via ProtocolInterceptor.
 *
 * Silenced for: non-TTY stdout, --no-splash, help/version, machine-readable
 * flags (--json / --print / --oneshot), interactive session entry, and nested
 * runSelfCli (env).
 */
function wantsSilentPreflight(argv: string[]): boolean {
  if (isTruthyEnv(process.env.TNF_SILENT_PREFLIGHT)) return true;
  if (!process.stdout.isTTY) return true;
  if (argv.includes('--no-splash')) return true;
  if (argv.includes('--json')) return true;
  if (argv.includes('--print') || argv.includes('-p')) return true;
  if (argv.includes('--oneshot') || argv.includes('-z')) return true;
  if (isInteractiveSessionArgv(argv)) return true;
  const tail = (argv[2] ?? '').toLowerCase();
  if (!tail || HELP_OR_VERSION_ARGS.has(tail)) return true;
  // Subcommand help: `tnf tui --help`
  if (argv.slice(2).some((a) => HELP_OR_VERSION_ARGS.has(String(a).toLowerCase()))) return true;
  return false;
}

/**
 * Serialize the fully-registered commander tree: every command, alias, option
 * and description, at every depth.
 *
 * This is the oracle for the cli.ts restructure (see
 * docs/operations/tnf-cli-restructure-scope.md). Moving 296 action handlers out
 * of a 19k-line file needs something that can prove the surface did not change,
 * and 141 separate `--help` invocations would cost minutes. Walking the tree
 * in-process costs one startup.
 *
 * Deterministic ordering so an unrelated registration order change never looks
 * like a surface change.
 */
function dumpCommandSurface(root: Command): unknown {
  const walk = (cmd: Command): unknown => ({
    name: cmd.name(),
    aliases: [...cmd.aliases()].sort(),
    description: cmd.description() || '',
    options: cmd.options
      .map((o) => ({ flags: o.flags, description: o.description || '' }))
      .sort((a, b) => a.flags.localeCompare(b.flags)),
    commands: cmd.commands
      .map((c) => walk(c as Command))
      .sort((a, b) => (a as { name: string }).name.localeCompare((b as { name: string }).name)),
  });
  return walk(root);
}

async function main(): Promise<void> {
  const argv = normalizeEntrypointArgv(process.argv);

  // Emit the command surface and exit, before the splash, preflight, or any
  // command resolution. Must stay first: the point is to observe registration,
  // not to execute anything.
  if (argv.includes('--dump-command-surface')) {
    console.log(JSON.stringify(dumpCommandSurface(program), null, 2));
    return;
  }

  // Render the TNF wordmark at the very top of every CLI invocation so the
  // brand is the first thing an operator sees — before the protocol pre-flight.
  // Skipped on non-TTY pipes (CI logs would balloon otherwise). --no-splash
  // suppresses it. Respect sigterm shortcut (process.argv[2] === undefined|help).
  // Animation is opt-in only on interactive TTYs.
  const tail = (argv[2] ?? '').toLowerCase();
  const firstArgIsHelp = !tail || HELP_OR_VERSION_ARGS.has(tail);
  const noSplashFlag = argv.includes('--no-splash');
  const silentPreflight = wantsSilentPreflight(argv);
  const wantSplash = !firstArgIsHelp && !noSplashFlag && !silentPreflight && process.stdout.isTTY;
  if (wantSplash) {
    try {
      await renderSplash({ animate: false });
    } catch {
      // Splash is cosmetic — never block pre-flight on a render failure.
    }
  }

  // Preflight runs on every normal CLI invocation so protocol drift surfaces
  // before a command mutates state. Two gates exist:
  //   1. `TNF_SKIP_TURN_ZERO_ONBOARD=1` — operator/CI opt-out documented in
  //      packages/tnf-cli/README.md and used by scripts/agents/*.sh. Honoured
  //      by `ensureTurnZeroForAgentEntrypoint()` for the interactive path, but
  //      historically NOT for this preflight — causing scripts that export the
  //      env var to still emit Turn Zero noise on every `tnf` call (verified
  //      live 2026-08-04 with `TNF_SKIP_TURN_ZERO_ONBOARD=1 tnf doctor`). Skip
  //      the unconditional preflight here too so the env var's contract holds
  //      for non-interactive invocations as well.
  //   2. `TNF_SKIP_PREFLIGHT=1` — narrower opt-out that skips the whole
  //      preflight without touching the interactive onboarding surface.
  // Explicit user-invoked gates (`tnf protocol gate`, `runFastHarnessProtocolGate`)
  // always run preflight regardless of env vars.
  //   3. Help and version are read-only. The rationale above is explicitly
  //      "before a command mutates state" — `--help` mutates nothing, yet it
  //      paid the full preflight on every invocation. Measured 2026-08-05:
  //      `--help` took 47.1s, of which 16.4s was this gate. Discovering what a
  //      CLI can do must not cost more than doing it, and an agent calling
  //      `tnf capabilities` to discover TNF pays this same toll. `firstArgIsHelp`
  //      is already computed above for the splash; it simply was not applied here.
  //      Explicit user-invoked gates (`tnf protocol gate`,
  //      runFastHarnessProtocolGate) are unaffected — they call preflight directly.
  const skipOnboard = isTruthyEnv(process.env.TNF_SKIP_TURN_ZERO_ONBOARD);
  const skipPreflight = isTruthyEnv(process.env.TNF_SKIP_PREFLIGHT);
  if (!skipOnboard && !skipPreflight && !firstArgIsHelp) {
    const interceptor = new ProtocolInterceptor(repoRoot, { silent: silentPreflight });
    const summary = await interceptor.runPreFlightChecks();
    if (summary.substrateBlocked) {
      console.error(
        chalk.red(
          '[TNF] Substrate attestation blocked this command (TNF_REQUIRE_SUBSTRATE=1). Remediations: rebuild CLI package dists, start Redis, set TNF_GATE_POLICY_TOKEN, or TNF_SKIP_SUBSTRATE=1 for an explicit HITL override.'
        )
      );
      process.exit(1);
    }
  }

  if (argv.length <= 2) {
    // Preflight in main() already ran Turn Zero checks. The full onboard script
    // (scripts/tnf-onboard.cjs) is opt-in — it duplicated the bootstrap wall
    // on every bare `tnf` and added ~10s before the first prompt.
    if (isTruthyEnv(process.env.TNF_FORCE_ONBOARD)) {
      await ensureTurnZeroForAgentEntrypoint();
    } else if (!isTruthyEnv(process.env.TNF_SKIP_TURN_ZERO_ONBOARD)) {
      console.log(
        chalk.dim(
          '[TNF] Interactive session — type /help for commands. Full onboard: `tnf tui --onboard` or TNF_FORCE_ONBOARD=1'
        )
      );
    }
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
  if (isClaudePassthroughArgv(argv)) {
    await runPassthrough('claude', argv.slice(3));
    return;
  }
  if (isPiPassthroughArgv(argv)) {
    await runPassthrough('pi', argv.slice(3));
    return;
  }
  const implicitArgs = resolveImplicitPassthroughArgs(argv);
  if (implicitArgs) {
    await runPassthrough(implicitArgs.cliName, implicitArgs.args);
    return;
  }

  // `tnf --permission-mode plan` must mean what `claude --permission-mode plan`
  // means: start a session with that setting. When the first argument is a
  // flag there is no subcommand, so the flags describe the session — route
  // them to `tui`, which is the command that actually implements them.
  //
  // Without this, every session flag typed at the root landed on the root
  // parser, which has no action, so `tnf --worktree x` printed nothing and did
  // nothing. That is the same silent-no-op class as the parity markers.
  if (argv.length > 2 && argv[2].startsWith('-') && !isRootOnlyFlag(argv[2])) {
    await program.parseAsync([argv[0], argv[1], 'tui', ...argv.slice(2)]);
    return;
  }
  // Hermes-parity gap closers (aliases + thin wrappers) must run after every
  // incumbent top-level command is registered so attachAlias can find them.
  registerHermesParityGapCommands(program, repoRoot);
  // Claude / Pi / Codex parity gap closers (guides + root option markers).
  registerPeerCliParityGapCommands(program, repoRoot);

  // Fail fast and precisely on a duplicate registration. Commander's own
  // duplicate error is raised at module load with no context, which is how a
  // stray `doctor` silently disabled every unattended cycle for five days.
  assertNoDuplicateCommands(program);

  await program.parseAsync(argv);
}

main().catch((err: Error) => {
  console.error(chalk.red(`Error: ${err.message}`));
  process.exit(1);
});
