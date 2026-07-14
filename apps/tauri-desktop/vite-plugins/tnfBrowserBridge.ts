/**
 * Vite middleware that bridges the desktop UI to TNF Browser (ws://127.0.0.1:7331).
 *
 * The TNF Browser server rejects browser Origins, so the UI must not open a
 * WebSocket from the page. This Node-side bridge connects without Origin and
 * exposes a same-origin HTTP API under /__tnf-browser/*.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Connect, Plugin } from 'vite';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

type WsCtor = new (
  url: string,
  opts?: { origin?: string }
) => {
  readyState: number;
  on(event: string, cb: (...args: unknown[]) => void): void;
  send(data: string): void;
  close(): void;
};

const WebSocket = require('ws') as WsCtor & {
  OPEN: number;
  CONNECTING: number;
};

const DEFAULT_PORT = 7331;
const TOKEN_PATH = path.join(os.homedir(), 'tnf-browser', 'token');
const BASE = '/__tnf-browser';

type Pending = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
};

type BridgeState = {
  ws: InstanceType<WsCtor> | null;
  pending: Map<string, Pending>;
  runtimeConnected: boolean;
  lastError: string | null;
  daemon: ChildProcess | null;
};

const state: BridgeState = {
  ws: null,
  pending: new Map(),
  runtimeConnected: false,
  lastError: null,
  daemon: null,
};

function readToken(): string {
  try {
    return fs.readFileSync(TOKEN_PATH, 'utf8').trim();
  } catch {
    return '';
  }
}

function wsUrl(port = DEFAULT_PORT): string {
  const token = readToken();
  const url = new URL(`ws://127.0.0.1:${port}/`);
  if (token) url.searchParams.set('token', token);
  return url.toString();
}

function portOpen(port = DEFAULT_PORT, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host }, () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.setTimeout(400, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function disconnect(): void {
  for (const [, p] of state.pending) {
    clearTimeout(p.timer);
    p.reject(new Error('Disconnected'));
  }
  state.pending.clear();
  if (state.ws) {
    try {
      state.ws.close();
    } catch {
      /* ignore */
    }
  }
  state.ws = null;
  state.runtimeConnected = false;
}

function attachMessageHandler(ws: InstanceType<WsCtor>): void {
  ws.on('message', (raw: unknown) => {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }

    if (msg.type === 'event' && msg.event === 'extensionConnected') {
      state.runtimeConnected = true;
      return;
    }
    if (msg.type === 'event' && msg.event === 'extensionDisconnected') {
      state.runtimeConnected = false;
      return;
    }

    const id = typeof msg.id === 'string' ? msg.id : '';
    if (!id || !state.pending.has(id)) return;
    const pending = state.pending.get(id)!;
    state.pending.delete(id);
    clearTimeout(pending.timer);
    if (typeof msg.error === 'string') {
      pending.reject(new Error(msg.error));
      return;
    }
    pending.resolve(msg.result);
  });

  ws.on('close', () => {
    if (state.ws === ws) {
      state.ws = null;
      state.runtimeConnected = false;
    }
  });

  ws.on('error', (err: unknown) => {
    state.lastError = err instanceof Error ? err.message : String(err);
  });
}

async function connect(port = DEFAULT_PORT): Promise<void> {
  if (state.ws && state.ws.readyState === WebSocket.OPEN) return;

  const listening = await portOpen(port);
  if (!listening) {
    throw new Error(`TNF Browser is not listening on 127.0.0.1:${port}. Run: tnf-browser start`);
  }

  const token = readToken();
  if (!token) {
    throw new Error(`Missing auth token at ${TOKEN_PATH}. Start TNF Browser first.`);
  }

  disconnect();

  await new Promise<void>((resolve, reject) => {
    const ws = new WebSocket(wsUrl(port));
    const timer = setTimeout(() => {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      reject(new Error('TNF Browser WebSocket connect timed out'));
    }, 8000);

    ws.on('open', () => {
      clearTimeout(timer);
      state.ws = ws;
      state.lastError = null;
      attachMessageHandler(ws);
      resolve();
    });

    ws.on('error', (err: unknown) => {
      clearTimeout(timer);
      const message = err instanceof Error ? err.message : String(err);
      state.lastError = message;
      reject(new Error(`TNF Browser connect failed: ${message}`));
    });
  });
}

function command(
  action: string,
  params: Record<string, unknown> = {},
  tabId?: number | null
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
      reject(new Error('Not connected to TNF Browser'));
      return;
    }
    const id = `ui_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const timer = setTimeout(() => {
      state.pending.delete(id);
      reject(new Error(`Command ${action} timed out`));
    }, 32000);
    state.pending.set(id, { resolve, reject, timer });
    const payload: Record<string, unknown> = { id, action, params };
    if (tabId != null) payload.tabId = tabId;
    state.ws.send(JSON.stringify(payload));
  });
}

function resolveCliPath(): string {
  return path.resolve(__dirname, '../../../packages/tnf-browser/bin/cli.js');
}

function startDaemon(): { ok: boolean; message: string } {
  if (state.daemon && !state.daemon.killed) {
    return { ok: true, message: 'TNF Browser daemon already spawning' };
  }
  const cli = resolveCliPath();
  if (!fs.existsSync(cli)) {
    return { ok: false, message: `CLI not found at ${cli}` };
  }
  try {
    const child = spawn(process.execPath, [cli, 'start'], {
      detached: true,
      stdio: 'ignore',
      env: { ...process.env },
    });
    child.unref();
    state.daemon = child;
    return {
      ok: true,
      message: 'TNF Browser start requested (opens managed Chromium + WS on :7331)',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, message };
  }
}

function readBody(req: Connect.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  const json = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(json);
}

export function tnfBrowserBridgePlugin(): Plugin {
  return {
    name: 'tnf-browser-bridge',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (!url.startsWith(BASE)) {
          next();
          return;
        }

        const pathname = url.split('?')[0];

        try {
          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }

          if (pathname === `${BASE}/status` && req.method === 'GET') {
            const listening = await portOpen();
            sendJson(res, 200, {
              listening,
              hasToken: Boolean(readToken()),
              connected: Boolean(state.ws && state.ws.readyState === WebSocket.OPEN),
              runtimeConnected: state.runtimeConnected,
              lastError: state.lastError,
              port: DEFAULT_PORT,
              tokenPath: TOKEN_PATH,
            });
            return;
          }

          if (pathname === `${BASE}/connect` && req.method === 'POST') {
            await connect();
            sendJson(res, 200, {
              ok: true,
              connected: true,
              runtimeConnected: state.runtimeConnected,
            });
            return;
          }

          if (pathname === `${BASE}/disconnect` && req.method === 'POST') {
            disconnect();
            sendJson(res, 200, { ok: true, connected: false });
            return;
          }

          if (pathname === `${BASE}/start` && req.method === 'POST') {
            const result = startDaemon();
            sendJson(res, result.ok ? 200 : 500, result);
            return;
          }

          if (pathname === `${BASE}/command` && req.method === 'POST') {
            const raw = await readBody(req);
            const body = raw ? JSON.parse(raw) : {};
            const action = String(body.action || '');
            if (!action) {
              sendJson(res, 400, { error: 'action required' });
              return;
            }
            if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
              await connect();
            }
            const result = await command(action, body.params || {}, body.tabId ?? null);
            sendJson(res, 200, { ok: true, result });
            return;
          }

          sendJson(res, 404, { error: 'Not found' });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          state.lastError = message;
          sendJson(res, 500, { error: message });
        }
      });
    },
  };
}
