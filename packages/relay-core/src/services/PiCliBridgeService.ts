import { spawn } from 'child_process';

import { Logger } from '../utils/Logger.js';

export interface PiRunRequest {
  prompt: string;
  cwd?: string;
  provider?: string;
  model?: string;
  sessionKey?: string;
  continueSession?: boolean;
  skillPaths?: string[];
  extraArgs?: string[];
  timeoutMs?: number;
  env?: Record<string, string>;
}

export interface PiProviderFailure {
  category: 'rate_limit' | 'auth' | 'timeout' | 'availability' | 'unknown';
  message: string;
  provider?: string;
  model?: string;
}

export interface PiRunResult {
  ok: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  command: string[];
  sessionKey?: string;
  providerFailures: PiProviderFailure[];
}

const PROVIDER_FAILURE_PATTERNS: Array<{
  category: PiProviderFailure['category'];
  regex: RegExp;
}> = [
  { category: 'rate_limit', regex: /\b(429|rate[\s_-]?limit|quota|resource exhausted)\b/i },
  {
    category: 'auth',
    regex:
      /\b(401|403|unauthorized|forbidden|invalid api key|no api key|missing api key|api key not found|authentication failed)\b/i,
  },
  { category: 'timeout', regex: /\b(timeout|timed out|deadline exceeded|etimedout)\b/i },
  {
    category: 'availability',
    regex: /\b(503|service unavailable|overloaded|connection refused|network error)\b/i,
  },
];

function detectProviderFailures(
  text: string,
  provider?: string,
  model?: string
): PiProviderFailure[] {
  const failures: PiProviderFailure[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    for (const pattern of PROVIDER_FAILURE_PATTERNS) {
      if (pattern.regex.test(line)) {
        failures.push({
          category: pattern.category,
          message: line.slice(0, 600),
          provider,
          model,
        });
        break;
      }
    }
  }

  if (failures.length === 0 && /error|failed|exception/i.test(text)) {
    failures.push({
      category: 'unknown',
      message: text.slice(0, 600),
      provider,
      model,
    });
  }

  const dedup = new Map<string, PiProviderFailure>();
  for (const failure of failures) {
    const key = `${failure.category}:${failure.message}`;
    if (!dedup.has(key)) dedup.set(key, failure);
  }
  return Array.from(dedup.values());
}

/**
 * Deterministic execution bridge around Pi CLI so TNF orchestrators/directors
 * can call Pi as a worker without coupling to Pi's internal runtime.
 */
export class PiCliBridgeService {
  private readonly logger: Logger;
  private readonly binary: string;

  constructor(logger: Logger, binary = process.env.PI_BINARY || 'pi') {
    this.logger = logger;
    this.binary = binary;
  }

  async run(request: PiRunRequest): Promise<PiRunResult> {
    const startedAt = Date.now();
    const timeoutMs = request.timeoutMs || 10 * 60 * 1000;

    const args: string[] = ['-p'];
    if (request.provider) args.push('--provider', request.provider);
    if (request.model) args.push('--model', request.model);
    if (request.sessionKey) args.push('--session', request.sessionKey);
    if (request.continueSession) args.push('--continue');

    const skillPaths = Array.isArray(request.skillPaths) ? request.skillPaths : [];
    for (const skillPath of skillPaths) {
      if (skillPath && skillPath.trim()) {
        args.push('--skill', skillPath.trim());
      }
    }

    if (Array.isArray(request.extraArgs)) {
      args.push(...request.extraArgs.filter((value) => Boolean(value && value.trim())));
    }

    args.push(request.prompt);

    return new Promise((resolve) => {
      const child = spawn(this.binary, args, {
        cwd: request.cwd,
        env: {
          ...process.env,
          ...(request.env || {}),
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      let finished = false;

      const finish = (exitCode: number | null) => {
        if (finished) return;
        finished = true;
        const providerFailures = detectProviderFailures(
          `${stdout}\n${stderr}`,
          request.provider,
          request.model
        );
        resolve({
          ok: exitCode === 0,
          exitCode,
          stdout,
          stderr,
          durationMs: Date.now() - startedAt,
          command: [this.binary, ...args],
          sessionKey: request.sessionKey,
          providerFailures,
        });
      };

      const timeout = setTimeout(() => {
        stderr += `\n[pi-bridge] timeout after ${timeoutMs}ms`;
        this.logger.warn(`Pi run timed out after ${timeoutMs}ms`);
        child.kill('SIGTERM');
      }, timeoutMs);

      child.stdout.on('data', (chunk) => {
        stdout += String(chunk);
      });

      child.stderr.on('data', (chunk) => {
        stderr += String(chunk);
      });

      child.on('error', (error) => {
        stderr += `\n[pi-bridge] spawn error: ${error.message}`;
      });

      child.on('close', (exitCode) => {
        clearTimeout(timeout);
        finish(exitCode);
      });
    });
  }
}
