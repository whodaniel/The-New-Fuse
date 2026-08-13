import { createServer, IncomingMessage, ServerResponse } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { spawn, spawnSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const CLI_VERSION = (() => {
  try {
    const pkgPath = path.join(__dirname, '../package.json');
    return JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version || '1.0.0';
  } catch { return '1.0.0'; }
})();
import * as os from 'os';

export interface ServeOptions {
  port?: number;
  hostname?: string;
  mdns?: boolean;
  mdnsDomain?: string;
  cors?: string[];
  cwd?: string;
}

export interface ServeStatus {
  port: number;
  hostname: string;
  pid: number;
  url: string;
  startedAt: string;
}

export class ServeService {
  private httpServer: ReturnType<typeof createServer> | null = null;
  private wsServer: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private options: Required<ServeOptions>;

  constructor(options: ServeOptions = {}) {
    this.options = {
      port: options.port ?? 0,
      hostname: options.hostname ?? '127.0.0.1',
      mdns: options.mdns ?? false,
      mdnsDomain: options.mdnsDomain ?? 'tnf.local',
      cors: options.cors ?? [],
      cwd: options.cwd ?? process.cwd(),
    };
  }

  async start(): Promise<ServeStatus> {
    return new Promise((resolve, reject) => {
      this.httpServer = createServer((req, res) => {
        this.handleHttpRequest(req, res);
      });

      this.wsServer = new WebSocketServer({ server: this.httpServer });

      this.wsServer.on('connection', (ws: WebSocket) => {
        this.handleWebSocketConnection(ws);
      });

      const hostname = this.options.mdns ? '0.0.0.0' : this.options.hostname;

      this.httpServer.listen(this.options.port, hostname, () => {
        const address = this.httpServer!.address() as { port: number; address: string };
        const url = this.options.mdns
          ? `http://${this.options.mdnsDomain}:${address.port}`
          : `http://${address.address}:${address.port}`;

        resolve({
          port: address.port,
          hostname: address.address,
          pid: process.pid,
          url,
          startedAt: new Date().toISOString(),
        });
      });

      this.httpServer.on('error', reject);

      if (this.options.mdns) {
        this.broadcastMDNS();
      }
    });
  }

  private handleHttpRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    const allowedOrigins = ['http://localhost', 'http://127.0.0.1', ...this.options.cors];
    const origin = req.headers.origin || '';
    const isAllowed = allowedOrigins.some(o => origin.startsWith(o)) || this.options.cors.includes('*');

    if (req.headers.origin) {
      res.setHeader('Access-Control-Allow-Origin', isAllowed ? origin : '');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (url.pathname === '/health' || url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        service: 'tnf-server',
        version: CLI_VERSION,
        pid: process.pid,
        clients: this.clients.size,
        cwd: this.options.cwd,
      }));
      return;
    }

    if (url.pathname === '/api/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        pid: process.pid,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        clients: this.clients.size,
      }));
      return;
    }

    res.writeHead(404);
    res.end('Not Found');
  }

  private handleWebSocketConnection(ws: WebSocket): void {
    this.clients.add(ws);

    ws.send(JSON.stringify({ type: 'connected', pid: process.pid }));

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch {}
    });

    ws.on('close', () => {
      this.clients.delete(ws);
    });

    ws.on('error', () => {
      this.clients.delete(ws);
    });
  }

  private handleMessage(ws: WebSocket, message: any): void {
    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;

      case 'run':
        this.executeCommand(ws, message.command, message.args || []);
        break;

      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
    }
  }

  private executeCommand(ws: WebSocket, command: string, args: string[]): void {
    const child = spawn(command, args, {
      cwd: this.options.cwd,
      shell: true,
    });

    child.stdout.on('data', (data) => {
      ws.send(JSON.stringify({ type: 'stdout', data: data.toString() }));
    });

    child.stderr.on('data', (data) => {
      ws.send(JSON.stringify({ type: 'stderr', data: data.toString() }));
    });

    child.on('close', (code) => {
      ws.send(JSON.stringify({ type: 'exit', code }));
    });

    child.on('error', (err) => {
      ws.send(JSON.stringify({ type: 'error', message: err.message }));
    });
  }

private broadcastMDNS(): void {
try {
if (process.platform === 'darwin') {
spawnSync('dns-sd', [
'-R',
`"TNF Server"`,
'_http._tcp',
'.',
String(this.options.port),
]);
}
} catch {}
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
}
