import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
const CLI_VERSION = (() => {
    try {
        const pkgPath = path.join(__dirname, '../package.json');
        return JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version || '1.0.0';
    }
    catch {
        return '1.0.0';
    }
})();
export class ACPService {
    constructor(options = {}) {
        this.httpServer = null;
        this.wsServer = null;
        this.clients = new Set();
        this.sessions = new Map();
        this.options = {
            port: options.port ?? 0,
            hostname: options.hostname ?? '127.0.0.1',
            cwd: options.cwd ?? process.cwd(),
        };
    }
    async start() {
        return new Promise((resolve, reject) => {
            this.httpServer = createServer((req, res) => {
                this.handleHttpRequest(req, res);
            });
            this.wsServer = new WebSocketServer({ server: this.httpServer });
            this.wsServer.on('connection', (ws, req) => {
                this.handleWebSocketConnection(ws, req);
            });
            this.httpServer.listen(this.options.port, this.options.hostname, () => {
                const address = this.httpServer.address();
                resolve({ port: address.port, hostname: address.address });
            });
            this.httpServer.on('error', reject);
        });
    }
    async stop() {
        return new Promise((resolve, reject) => {
            for (const client of this.clients) {
                client.terminate();
            }
            this.clients.clear();
            this.wsServer?.close((err) => {
                if (err)
                    reject(err);
                else {
                    this.httpServer?.close((err) => {
                        if (err)
                            reject(err);
                        else
                            resolve();
                    });
                }
            });
        });
    }
    handleHttpRequest(req, res) {
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
    handleWebSocketConnection(ws, req) {
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
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleACPMessage(ws, message);
            }
            catch (err) {
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
    handleACPMessage(ws, message) {
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
    broadcast(message, exclude) {
        const payload = JSON.stringify(message);
        for (const client of this.clients) {
            if (client !== exclude && client.readyState === WebSocket.OPEN) {
                client.send(payload);
            }
        }
    }
}
//# sourceMappingURL=ACPService.js.map