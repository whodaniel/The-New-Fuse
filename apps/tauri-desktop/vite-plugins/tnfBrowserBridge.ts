/**
 * Vite middleware that bridges the desktop UI to the TNF interactive browser.
 *
 * Default backend is agent-browser (no :7331 extension/WebSocket). Set
 * TNF_BROWSER_BACKEND=legacy to use the old packages/tnf-browser runtime on
 * ws://127.0.0.1:7331. The legacy server rejects browser Origins, so that path
 * still connects from Node without an Origin header.
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

import {
  preferredBackend,
  runMappedCommand,
  startAgentBrowser,
  statusAgentBrowser,
} from './agentBrowserBackend';

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

/** Keeps idle SSE streams from being dropped by the dev server or a proxy. */
const SSE_HEARTBEAT_MS = 25000;

/** Events worth pushing to the UI. Drop high-volume frames like `response`. */
const UI_EVENTS = new Set(['extensionConnected', 'extensionDisconnected', 'urlChanged']);

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
  sseClients: Set<http.ServerResponse>;
};

const state: BridgeState = {
  ws: null,
  pending: new Map(),
  runtimeConnected: false,
  lastError: null,
  daemon: null,
  sseClients: new Set(),
};

function broadcastEvent(msg: Record<string, unknown>): void {
  const payload = `data: ${JSON.stringify(msg)}\n\n`;
  for (const client of state.sseClients) {
    try {
      client.write(payload);
    } catch {
      state.sseClients.delete(client);
    }
  }
}

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

    if (msg.type === 'event') {
      const eventName = typeof msg.event === 'string' ? msg.event : '';
      if (eventName === 'extensionConnected') {
        state.runtimeConnected = true;
      } else if (eventName === 'extensionDisconnected') {
        state.runtimeConnected = false;
      }
      if (UI_EVENTS.has(eventName)) {
        broadcastEvent(msg);
      }
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

async function startDaemon(): Promise<{
  ok: boolean;
  message: string;
  command: string;
  already_running?: boolean;
}> {
  if (preferredBackend() === 'agent-browser') {
    return startAgentBrowser('about:blank');
  }

  const cli = resolveCliPath();
  const command = `node ${cli} start`;

  if (state.daemon && !state.daemon.killed) {
    return { ok: true, message: 'Legacy TNF Browser daemon already spawning', command };
  }
  if (!fs.existsSync(cli)) {
    return { ok: false, message: `Legacy CLI not found at ${cli}`, command };
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
      message: 'Legacy TNF Browser start requested (extension + WS on :7331)',
      command,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, message, command };
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
            if (preferredBackend() === 'agent-browser') {
              sendJson(res, 200, await statusAgentBrowser(state.lastError));
              return;
            }
            const listening = await portOpen();
            sendJson(res, 200, {
              listening,
              hasToken: Boolean(readToken()),
              connected: Boolean(state.ws && state.ws.readyState === WebSocket.OPEN),
              runtimeConnected: state.runtimeConnected,
              lastError: state.lastError,
              port: DEFAULT_PORT,
              tokenPath: TOKEN_PATH,
              backend: 'legacy',
            });
            return;
          }

          if (pathname === `${BASE}/connect` && req.method === 'POST') {
            if (preferredBackend() === 'agent-browser') {
              const status = await statusAgentBrowser(state.lastError);
              if (!status.listening) {
                throw new Error(
                  'agent-browser is not available. Run Start Runtime or install agent-browser.'
                );
              }
              sendJson(res, 200, {
                ok: true,
                connected: true,
                runtimeConnected: true,
                backend: 'agent-browser',
              });
              return;
            }
            await connect();
            sendJson(res, 200, {
              ok: true,
              connected: true,
              runtimeConnected: state.runtimeConnected,
              backend: 'legacy',
            });
            return;
          }

          if (pathname === `${BASE}/disconnect` && req.method === 'POST') {
            disconnect();
            sendJson(res, 200, { ok: true, connected: false });
            return;
          }

          if (pathname === `${BASE}/start` && req.method === 'POST') {
            const result = await startDaemon();
            sendJson(res, result.ok ? 200 : 500, result);
            return;
          }

          if (pathname === `${BASE}/events` && req.method === 'GET') {
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache, no-transform',
              Connection: 'keep-alive',
            });
            res.write(': connected\n\n');
            state.sseClients.add(res);
            // Comment-frame heartbeat so idle streams are not dropped as stale.
            const heartbeat = setInterval(() => {
              try {
                res.write(': ping\n\n');
              } catch {
                clearInterval(heartbeat);
                state.sseClients.delete(res);
              }
            }, SSE_HEARTBEAT_MS);
            const cleanup = () => {
              clearInterval(heartbeat);
              state.sseClients.delete(res);
            };
            req.on('close', cleanup);
            req.on('error', cleanup);
            res.on('close', cleanup);
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
            if (preferredBackend() === 'agent-browser') {
              const result = await runMappedCommand(action, body.params || {});
              sendJson(res, 200, { ok: true, result, backend: 'agent-browser' });
              return;
            }
            if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
              await connect();
            }
            const result = await command(action, body.params || {}, body.tabId ?? null);
            sendJson(res, 200, { ok: true, result, backend: 'legacy' });
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
