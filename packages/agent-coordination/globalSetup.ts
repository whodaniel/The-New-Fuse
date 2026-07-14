import { execFileSync, spawn } from 'node:child_process';

const PORT = process.env.REDIS_TEST_PORT ? Number(process.env.REDIS_TEST_PORT) : 16379;
const REDIS_BIN = process.env.REDIS_SERVER_BIN || 'redis-server';

/**
 * Starts a REAL local redis-server (functional, not a mock) for the test run.
 * The agent-coordination suite exercises the real coordination code paths
 * against this live Redis instance via the real UnifiedRedisService.
 */
export default async function globalSetup() {
  const proc = spawn(
    REDIS_BIN,
    [
      '--port',
      String(PORT),
      '--bind',
      '127.0.0.1',
      '--save',
      '',
      '--appendonly',
      'no',
      '--daemonize',
      'no',
    ],
    { stdio: 'ignore' }
  );

  process.env.REDIS_URL = `redis://127.0.0.1:${PORT}`;

  const deadline = Date.now() + 20000;
  let ready = false;
  while (Date.now() < deadline) {
    try {
      const out = execFileSync('redis-cli', ['-p', String(PORT), 'ping'], {
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .toString()
        .trim();
      if (out === 'PONG') {
        ready = true;
        break;
      }
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  if (!ready) {
    try {
      proc.kill('SIGTERM');
    } catch {
      // ignore
    }
    throw new Error('redis-server did not become ready in time');
  }

  (globalThis as any).__REDIS_PROC__ = proc;
}
