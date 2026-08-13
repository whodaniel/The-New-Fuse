import { createServer, IncomingMessage, ServerResponse } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

const CLI_VERSION = (() => {
  try {
    const pkgPath = path.join(__dirname, '../package.json');
    return JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version || '1.0.0';
  } catch { return '1.0.0'; }
})();

export interface ACPServerOptions {
  port?: number;
  hostname?: string;
  cwd?: string;
}

export interface ACPMessage {
  id: string;
  type: 'request' | 'response' | 'notification';
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: { code: number; message: string };
}

export class ACPService {
  private httpServer: ReturnType<typeof createServer> | null = null;
  private wsServer: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private sessions: Map<string, { id: string; createdAt: Date; metadata?: Record<string, unknown> }> = new Map();
  private options: Required<ACPServerOptions>;

  constructor(options: ACPServerOptions = {}) {
    this.options = {
      port: options.port ?? 0,
      hostname: options.hostname ?? '127.0.0.1',
      cwd: options.cwd ?? process.cwd(),
    };
  }

  async start(): Promise<{ port: number; hostname: string }> {
    return new Promise((resolve, reject) => {
      this.httpServer = createServer((req, res) => {
        this.handleHttpRequest(req, res);
      });

      this.wsServer = new WebSocketServer({ server: this.httpServer });

      this.wsServer.on('connection', (ws: WebSocket, req) => {
        this.handleWebSocketConnection(ws, req);
      });

      this.httpServer.listen(this.options.port, this.options.hostname, () => {
        const address = this.httpServer!.address() as { port: number; address: string };
        resolve({ port: address.port, hostname: address.address });
      });

      this.httpServer.on('error', reject);
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      for (const client of this.clients) {
        client.terminate();
      }
      this.clients.clear();

      this.wsServer?.close((err) => {
        if (err) reject(err);
        else {
          this.httpServer?.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        }
      });
    });
  }

  private handleHttpRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    if (url.pathname === '/health' || url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        protocol: 'ACP',
        version: CLI_VERSION,
        clients: this.clients.size,
        sessions: this.sessions.size,
      }));
      return;
    }

    if (url.pathname === '/sessions') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(Array.from(this.sessions.values())));
      return;
    }

    res.writeHead(404);
    res.end('Not Found');
  }

  private handleWebSocketConnection(ws: WebSocket, req: IncomingMessage): void {
    this.clients.add(ws);

    const sessionId = randomUUID();
    this.sessions.set(sessionId, {
      id: sessionId,
      createdAt: new Date(),
    });

    ws.send(JSON.stringify({
      id: sessionId,
      type: 'notification',
      method: 'session.created',
      params: { sessionId },
    }));

    ws.on('message', (data: Buffer) => {
      try {
        const message: ACPMessage = JSON.parse(data.toString());
        this.handleACPMessage(ws, message);
      } catch (err) {
        ws.send(JSON.stringify({
          id: '',
          type: 'response',
          error: { code: -32700, message: 'Parse error' },
        }));
      }
    });

    ws.on('close', () => {
      this.clients.delete(ws);
      this.sessions.delete(sessionId);
    });

    ws.on('error', () => {
      this.clients.delete(ws);
      this.sessions.delete(sessionId);
    });
  }

  private handleACPMessage(ws: WebSocket, message: ACPMessage): void {
    switch (message.method) {
      case 'ping':
        ws.send(JSON.stringify({
          id: message.id,
          type: 'response',
          result: { pong: true },
        }));
        break;

      case 'session.list':
        ws.send(JSON.stringify({
          id: message.id,
          type: 'response',
          result: Array.from(this.sessions.values()),
        }));
        break;

      default:
        this.broadcast(message, ws);
    }
  }

  private broadcast(message: ACPMessage, exclude?: WebSocket): void {
    const payload = JSON.stringify(message);
    for (const client of this.clients) {
      if (client !== exclude && client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }
}
