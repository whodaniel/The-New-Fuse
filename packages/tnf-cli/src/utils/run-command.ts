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
function signalProcessTree(pid: number | undefined, signal: NodeJS.Signals): void {
  if (!pid || !Number.isFinite(pid) || pid <= 0) return;
  // Prefer the process group so nested CLI children (orchestrate workers,
  // pnpm/tsx wrappers) do not outlive a timed-out parent. Falls back to the
  // direct child when the group signal is not available.
  try {
    process.kill(-pid, signal);
    return;
  } catch {
    /* group kill unavailable — fall through */
  }
  try {
    process.kill(pid, signal);
  } catch {
    /* already reaped */
  }
}

export async function spawnWithTimeout(
  cmd: string,
  args: string[],
  options: SpawnWithTimeoutOptions
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const stdio = options.stdio ?? (options.isBackground ? 'ignore' : 'inherit');
    // Timed foreground work gets its own process group so timeout can SIGTERM
    // the whole tree. Background jobs stay detached + unref'd as before.
    const useTimeoutGroup = Boolean(options.timeoutMs && options.timeoutMs > 0);
    const child = spawn(cmd, args, {
      cwd: options.cwd,
      env: { ...process.env, ...(options.env || {}) },
      stdio,
      detached: options.isBackground || useTimeoutGroup,
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

    if (useTimeoutGroup) {
      timer = setTimeout(() => {
        timedOut = true;
        signalProcessTree(child.pid, 'SIGTERM');
        killTimer = setTimeout(() => signalProcessTree(child.pid, 'SIGKILL'), KILL_GRACE_MS);
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
