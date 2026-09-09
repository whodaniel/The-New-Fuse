/**
 * Contract guard for operator-initiated turn interrupts (Esc / Ctrl-C in the
 * TNF TUI, 2026-09-05).
 *
 * Before this change there was NO way to interrupt a running agent turn: the
 * LLM fetch had no user-facing AbortSignal, Ctrl-C during the busy phase
 * killed the whole process, and the provider fallback chain would happily
 * resurrect a turn on a different provider after a failure.
 *
 * LLMOptions.signal must therefore:
 *   1. abort the in-flight HTTP request immediately (AbortError),
 *   2. never trigger a retry or a fallback-chain walk (one request, done),
 *   3. stop chatCompleteWithTools between tool iterations,
 *   4. leave the non-signal path byte-for-byte identical (happy path still works).
 *
 * Tests drive LLMClient through the Strategy-1 env triple against a local
 * HTTP server, with a credentialed "backup" provider in a fixture
 * model-providers.json so any wrongful fallback walk shows up as an extra
 * request against the same server.
 *
 * Run: tsx src/utils/llm-client-abort.test.ts
 */
import * as fs from 'node:fs';
import * as http from 'node:http';
import * as os from 'node:os';
import * as path from 'node:path';
import { LLMClient } from './llm-client.js';

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean, detail = ''): void {
  if (cond) {
    console.log(`  PASS  ${name}`);
    pass += 1;
  } else {
    console.log(`  FAIL  ${name} ${detail}`);
    fail += 1;
  }
}

const PREV: Record<string, string | undefined> = {
  TNF_LLM_BASE_URL: process.env.TNF_LLM_BASE_URL,
  TNF_LLM_API_KEY: process.env.TNF_LLM_API_KEY,
  TNF_LLM_MODEL: process.env.TNF_LLM_MODEL,
  TNF_LLM_TIMEOUT_MS: process.env.TNF_LLM_TIMEOUT_MS,
  TNF_LLM_RETRY_MAX: process.env.TNF_LLM_RETRY_MAX,
  TNF_LLM_RETRY_BASE_MS: process.env.TNF_LLM_RETRY_BASE_MS,
  TNF_LLM_STREAM: process.env.TNF_LLM_STREAM,
  TNF_PROVIDER_CONFIG_PATH: process.env.TNF_PROVIDER_CONFIG_PATH,
  TNF_DEFAULT_MODEL_PATH: process.env.TNF_DEFAULT_MODEL_PATH,
  ABORT_BACKUP_KEY: process.env.ABORT_BACKUP_KEY,
};

function restoreEnv(): void {
  for (const [key, value] of Object.entries(PREV)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-abort-'));
const providersPath = path.join(tmpRoot, 'model-providers.json');

interface TestServer {
  url: string;
  close: () => Promise<void>;
  /** Total requests received. */
  count(): number;
  /** Switch response behavior. */
  setMode(mode: 'hang' | 'tool_calls' | 'ok' | 'http500'): void;
}

function startTestServer(): Promise<TestServer> {
  let mode: TestServer['setMode'] extends (m: infer M) => void ? M : never = 'ok';
  let requests = 0;
  const server = http.createServer((req, res) => {
    requests += 1;
    if (mode === 'hang') {
      // Never respond; the abort must unwind the request, not the server.
      return;
    }
    if (mode === 'http500') {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'server exploded' } }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (mode === 'tool_calls') {
      res.end(
        JSON.stringify({
          choices: [
            {
              finish_reason: 'tool_calls',
              message: {
                role: 'assistant',
                content: '',
                tool_calls: [
                  {
                    id: 'call_1',
                    type: 'function',
                    function: { name: 'bash', arguments: '{"command":"echo hi"}' },
                  },
                ],
              },
            },
          ],
        })
      );
      return;
    }
    res.end(JSON.stringify({ choices: [{ message: { role: 'assistant', content: 'ok' } }] }));
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      resolve({
        url: `http://127.0.0.1:${port}/v1`,
        close: () => new Promise<void>((res) => server.close(() => res())),
        count: () => requests,
        setMode: (next) => {
          mode = next;
        },
      });
    });
  });
}

async function main(): Promise<void> {
  const server = await startTestServer();
  // Credentialed backup provider: if an aborted request ever walks the
  // fallback chain, the backup hits the same server and count() rises.
  fs.writeFileSync(
    providersPath,
    JSON.stringify({
      providers: [
        {
          id: 'abort-backup',
          name: 'Abort Backup',
          model: 'backup-model',
          priority: 5,
          endpoint: server.url,
          envKey: 'ABORT_BACKUP_KEY',
        },
      ],
    })
  );

  process.env.TNF_LLM_BASE_URL = server.url;
  process.env.TNF_LLM_API_KEY = 'primary-key';
  process.env.TNF_LLM_MODEL = 'primary-model';
  process.env.TNF_LLM_TIMEOUT_MS = '30000';
  process.env.TNF_LLM_RETRY_MAX = '3';
  process.env.TNF_LLM_RETRY_BASE_MS = '500';
  process.env.TNF_LLM_STREAM = 'never';
  process.env.TNF_PROVIDER_CONFIG_PATH = providersPath;
  process.env.ABORT_BACKUP_KEY = 'backup-key';
  delete process.env.TNF_DEFAULT_MODEL_PATH;

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  try {
    // ── 1. Happy path with no signal is unchanged ──────────────────────────
    server.setMode('ok');
    const client = await LLMClient.create('abort-test');
    const happy = await client.chatComplete([{ role: 'user', content: 'hi' }]);
    check('happy path without signal still returns content', happy === 'ok', `got ${happy}`);
    check('happy path used exactly one request', server.count() === 1, `count=${server.count()}`);

    // ── 2. Abort during an in-flight request ───────────────────────────────
    server.setMode('hang');
    const abort1 = new AbortController();
    setTimeout(() => abort1.abort(), 150);
    let abortedErr: any = null;
    try {
      await client.chatComplete([{ role: 'user', content: 'hi' }], { signal: abort1.signal });
    } catch (err: any) {
      abortedErr = err;
    }
    check(
      'abort during request rejects with AbortError',
      abortedErr?.name === 'AbortError' || abortedErr?.code === 'ABORT_ERR',
      `got ${abortedErr?.name}:${abortedErr?.message}`
    );
    await sleep(250);
    check(
      'aborted request never walks the fallback chain (no extra requests)',
      server.count() === 2, // 1 (happy path) + 1 (hung primary); a fallback walk would add more
      `count=${server.count()}`
    );

    // ── 3. chatCompleteWithTools stops between tool iterations ─────────────
    server.setMode('tool_calls');
    const abort2 = new AbortController();
    let executorRuns = 0;
    let toolsErr: any = null;
    try {
      await client.chatCompleteWithTools(
        [{ role: 'user', content: 'do work' }],
        async () => {
          executorRuns += 1;
          if (executorRuns === 1) abort2.abort(); // interrupt mid-turn
          return 'tool output';
        },
        { maxIterations: 5, signal: abort2.signal }
      );
    } catch (err: any) {
      toolsErr = err;
    }
    check(
      'tool loop throws AbortError once signal fires',
      toolsErr?.name === 'AbortError',
      `got ${toolsErr?.name}:${toolsErr?.message}`
    );
    check('executor ran exactly once before interrupt', executorRuns === 1, `runs=${executorRuns}`);
    await sleep(250);
    check(
      'no further LLM requests after tool-loop interrupt',
      server.count() === 3, // 1 (happy) + 1 (hung) + 1 (first tool iteration)
      `count=${server.count()}`
    );

    // ── 4. Abort during retry backoff sends no further request ─────────────
    server.setMode('http500');
    const abort3 = new AbortController();
    let retryErr: any = null;
    const retryRequestsBefore = server.count();
    setTimeout(() => abort3.abort(), 120); // during the 500ms backoff window
    try {
      await client.chatComplete([{ role: 'user', content: 'hi' }], { signal: abort3.signal });
    } catch (err: any) {
      retryErr = err;
    }
    check(
      'abort during backoff rejects with AbortError (not retry-exhausted)',
      retryErr?.name === 'AbortError' || retryErr?.code === 'ABORT_ERR',
      `got ${retryErr?.name}:${retryErr?.message}`
    );
    check(
      'abort during backoff sent no additional request',
      server.count() - retryRequestsBefore === 1,
      `delta=${server.count() - retryRequestsBefore}`
    );
  } finally {
    restoreEnv();
    await server.close();
    try {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    } catch {
      /* best-effort cleanup */
    }
  }

  console.log(`\nllm-client-abort: ${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
