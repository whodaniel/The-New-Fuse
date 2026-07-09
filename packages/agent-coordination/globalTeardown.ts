import { execFileSync } from 'node:child_process';

const PORT = process.env.REDIS_TEST_PORT ? Number(process.env.REDIS_TEST_PORT) : 16379;

/**
 * Shuts down the REAL local redis-server started in globalSetup.
 */
export default async function globalTeardown() {
  try {
    execFileSync('redis-cli', ['-p', String(PORT), 'shutdown', 'nosave'], { stdio: 'ignore' });
  } catch {
    // already stopped
  }
  const proc = (globalThis as any).__REDIS_PROC__;
  if (proc) {
    try {
      proc.kill('SIGTERM');
    } catch {
      // ignore
    }
  }
}
