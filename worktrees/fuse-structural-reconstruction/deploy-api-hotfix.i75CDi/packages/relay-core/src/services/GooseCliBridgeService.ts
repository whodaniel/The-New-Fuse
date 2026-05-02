import { spawn } from 'child_process';
import { Logger } from '../utils/Logger.js';

export interface GooseRunRequest {
  prompt: string;
  cwd?: string;
  extraArgs?: string[];
  timeoutMs?: number;
  env?: Record<string, string>;
}

export interface GooseRunResult {
  ok: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  command: string[];
}

/**
 * Thin execution bridge around Goose CLI so TNF orchestrators can call Goose
 * as a deterministic sub-agent without coupling to Goose internals.
 */
export class GooseCliBridgeService {
  private readonly logger: Logger;
  private readonly binary: string;

  constructor(logger: Logger, binary = process.env.GOOSE_BINARY || 'goose') {
    this.logger = logger;
    this.binary = binary;
  }

  async run(request: GooseRunRequest): Promise<GooseRunResult> {
    const startedAt = Date.now();
    const args = ['run', request.prompt, ...(request.extraArgs || [])];
    const timeoutMs = request.timeoutMs || 10 * 60 * 1000;

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

      const done = (exitCode: number | null) => {
        if (finished) return;
        finished = true;
        resolve({
          ok: exitCode === 0,
          exitCode,
          stdout,
          stderr,
          durationMs: Date.now() - startedAt,
          command: [this.binary, ...args],
        });
      };

      const timer = setTimeout(() => {
        stderr += `\n[goose-bridge] timeout after ${timeoutMs}ms`;
        this.logger.warn(`Goose run timed out after ${timeoutMs}ms`);
        child.kill('SIGTERM');
      }, timeoutMs);

      child.stdout.on('data', (chunk) => {
        stdout += String(chunk);
      });
      child.stderr.on('data', (chunk) => {
        stderr += String(chunk);
      });

      child.on('error', (error) => {
        stderr += `\n[goose-bridge] spawn error: ${error.message}`;
      });

      child.on('close', (exitCode) => {
        clearTimeout(timer);
        done(exitCode);
      });
    });
  }
}
