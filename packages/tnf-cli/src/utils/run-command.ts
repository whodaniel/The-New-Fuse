import { spawn } from 'node:child_process';

/**
 * Marks a rejection caused by `timeoutMs` elapsing, so callers can distinguish
 * "the work failed" from "the work never finished".
 *
 * This distinction matters for the full-auto loop: an unbounded child that
 * never exits used to leave the loop awaiting forever while its state file
 * still read `mode: "running"`. The autopilot was dead and nothing said so.
 */
export class CommandTimeoutError extends Error {
  readonly timeoutMs: number;
  constructor(cmd: string, timeoutMs: number) {
    super(`${cmd} timed out after ${Math.round(timeoutMs / 1000)}s and was killed`);
    this.name = 'CommandTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

/** Grace period between SIGTERM and SIGKILL when a timeout fires. */
export const KILL_GRACE_MS = 10_000;

export type SpawnWithTimeoutOptions = {
  cwd: string;
  env?: NodeJS.ProcessEnv;
  isBackground?: boolean;
  /** Kill the child and reject with CommandTimeoutError after this long.
   *  Omit (or pass 0) for unbounded execution. */
  timeoutMs?: number;
  /** Overridable for tests; defaults to inheriting the parent's stdio. */
  stdio?: 'inherit' | 'ignore' | 'pipe';
};

/**
 * Spawn a child process and resolve when it exits 0.
 *
 * Rejects with CommandTimeoutError if `timeoutMs` elapses first — the child is
 * sent SIGTERM so it can flush state, then SIGKILL after KILL_GRACE_MS if it
 * ignores that. The promise settles exactly once in every path.
 */
export async function spawnWithTimeout(
  cmd: string,
  args: string[],
  options: SpawnWithTimeoutOptions
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const stdio = options.stdio ?? (options.isBackground ? 'ignore' : 'inherit');
    const child = spawn(cmd, args, {
      cwd: options.cwd,
      env: { ...process.env, ...(options.env || {}) },
      stdio,
      detached: options.isBackground,
    });

    if (options.isBackground) {
      child.unref();
      return resolve();
    }

    let timer: NodeJS.Timeout | undefined;
    let killTimer: NodeJS.Timeout | undefined;
    let timedOut = false;

    const clearTimers = () => {
      if (timer) clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
    };

    if (options.timeoutMs && options.timeoutMs > 0) {
      timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
        killTimer = setTimeout(() => child.kill('SIGKILL'), KILL_GRACE_MS);
        killTimer.unref?.();
      }, options.timeoutMs);
    }

    child.on('error', (error: NodeJS.ErrnoException) => {
      clearTimers();
      if (error?.code === 'ENOENT') {
        reject(new Error(`'${cmd}' is not installed or not on PATH`));
        return;
      }
      reject(error);
    });

    child.on('close', (code) => {
      clearTimers();
      if (timedOut) return reject(new CommandTimeoutError(cmd, options.timeoutMs!));
      if (code === 0) return resolve();
      reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}
