/**
 * Shared agent-browser routing helpers for TNF CLI.
 *
 * Primary interactive browser path for TNF agents.
 * Read-only public extraction belongs to Crawl4AI.
 * packages/tnf-browser extension/WebSocket mode is legacy only.
 */
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

export const AGENT_BROWSER_OPERATIONS = [
  'open',
  'snapshot',
  'click',
  'fill',
  'type',
  'press',
  'wait',
  'get',
  'back',
  'forward',
  'reload',
  'close',
  'state_load',
  'state_save',
  'profiles',
] as const;

export type AgentBrowserOperation = (typeof AGENT_BROWSER_OPERATIONS)[number];

export interface AgentBrowserRequest {
  operation: AgentBrowserOperation;
  target?: string;
  value?: string;
  profile?: string;
  stateFile?: string;
  session?: string;
  headed?: boolean;
  json?: boolean;
}

const OPERATION_ARGS: Record<AgentBrowserOperation, string[]> = {
  open: ['open'],
  snapshot: ['snapshot', '-i'],
  click: ['click'],
  fill: ['fill'],
  type: ['type'],
  press: ['press'],
  wait: ['wait'],
  get: ['get'],
  back: ['back'],
  forward: ['forward'],
  reload: ['reload'],
  close: ['close'],
  state_load: ['state', 'load'],
  state_save: ['state', 'save'],
  profiles: ['profiles'],
};

export function normalizeAgentBrowserOperation(raw: string): AgentBrowserOperation {
  const normalized = String(raw || '')
    .trim()
    .replace(/-/g, '_') as AgentBrowserOperation;
  if (!AGENT_BROWSER_OPERATIONS.includes(normalized)) {
    throw new Error(`Unsupported browser operation: ${String(raw)}`);
  }
  return normalized;
}

export function resolveTnfRepoRoot(startDir: string): string {
  const searchRoots = [path.resolve(startDir), MODULE_DIR];
  for (const root of searchRoots) {
    let current = root;
    for (let i = 0; i < 12; i += 1) {
      const marker = path.join(current, 'packages', 'tnf-cli', 'package.json');
      if (fs.existsSync(marker)) return current;
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }
  return path.resolve(startDir);
}

export function resolveAgentBrowserBin(
  repoRoot: string,
  env: NodeJS.ProcessEnv = process.env
): string {
  if (env.AGENT_BROWSER_BIN) return env.AGENT_BROWSER_BIN;

  const candidates = [
    path.join(
      repoRoot,
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'agent-browser.cmd' : 'agent-browser'
    ),
    path.join(
      repoRoot,
      'packages',
      'tnf-cli',
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'agent-browser.cmd' : 'agent-browser'
    ),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return 'agent-browser';
}

export function buildAgentBrowserArgs(request: AgentBrowserRequest): string[] {
  const operation = normalizeAgentBrowserOperation(request.operation);
  const args: string[] = [];
  if (request.profile) args.push('--profile', request.profile);
  if (request.stateFile) args.push('--state', request.stateFile);
  if (request.session) args.push('--session', request.session);

  args.push(...OPERATION_ARGS[operation]);

  if (request.target) args.push(request.target);
  if (request.value) args.push(request.value);
  if (request.headed && operation === 'open') args.push('--headed');
  if (request.json !== false) args.push('--json');
  return args;
}

export function runAgentBrowser(
  startDir: string,
  request: AgentBrowserRequest,
  options: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    stdio?: 'inherit' | 'pipe';
  } = {}
): Promise<{ code: number; stdout: string; stderr: string }> {
  const env = options.env ?? process.env;
  const repoRoot = resolveTnfRepoRoot(startDir);
  const bin = resolveAgentBrowserBin(repoRoot, env);
  const args = buildAgentBrowserArgs(request);

  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      cwd: options.cwd ?? process.cwd(),
      env,
      stdio: options.stdio === 'inherit' ? 'inherit' : ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr?.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') {
        reject(
          new Error(
            'agent-browser is not installed. Run `pnpm --filter @the-new-fuse/tnf-cli add agent-browser@0.26.0` ' +
              'or set AGENT_BROWSER_BIN to its executable.'
          )
        );
        return;
      }
      reject(error);
    });
    child.on('close', (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}
