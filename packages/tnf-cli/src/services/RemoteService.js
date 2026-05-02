"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteService = void 0;
const http_1 = require("http");
const ws_1 = require("ws");
const crypto_1 = require("crypto");
class RemoteService {
    constructor(options = {}) {
        this.httpServer = null;
        this.wsServer = null;
        this.clients = new Set();
        this.connections = new Map();
        this.options = {
            port: options.port ?? 0,
            hostname: options.hostname ?? '127.0.0.1',
            mdns: options.mdns ?? false,
            mdnsDomain: options.mdnsDomain ?? 'tnf.local',
            cors: options.cors ?? [],
        };
    }
    async enable() {
        return new Promise((resolve, reject) => {
            this.httpServer = (0, http_1.createServer)((req, res) => {
                this.handleHttpRequest(req, res);
            });
            this.wsServer = new ws_1.WebSocketServer({ server: this.httpServer });
            this.wsServer.on('connection', (ws, req) => {
                this.handleWebSocketConnection(ws, req);
            });
            const hostname = this.options.mdns ? '0.0.0.0' : this.options.hostname;
            this.httpServer.listen(this.options.port, hostname, () => {
                const address = this.httpServer.address();
                const url = `ws://${this.options.mdns ? this.options.mdnsDomain : address.address}:${address.port}`;
                resolve({ port: address.port, hostname: address.address, url });
            });
            this.httpServer.on('error', reject);
        });
    }
    async disable() {
        return new Promise((resolve, reject) => {
            for (const client of this.clients) {
                client.terminate();
            }
            this.clients.clear();
            this.connections.clear();
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
                service: 'tnf-remote',
                connections: this.connections.size,
                clients: this.clients.size,
            }));
            return;
        }
        if (url.pathname === '/connections') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(Array.from(this.connections.values())));
            return;
        }
        res.writeHead(404);
        res.end('Not Found');
    }
    handleWebSocketConnection(ws, req) {
        this.clients.add(ws);
        const connectionId = (0, crypto_1.randomUUID)();
        const connection = {
            id: connectionId,
            url: req.url || '/',
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            bytesSent: 0,
            bytesReceived: 0,
        };
        this.connections.set(connectionId, connection);
        ws.on('message', (data) => {
            connection.lastActivity = new Date().toISOString();
            connection.bytesReceived += data.length;
            try {
                const message = JSON.parse(data.toString());
                this.handleRelayMessage(ws, message);
            }
            catch { }
        });
        ws.on('close', () => {
            this.clients.delete(ws);
            this.connections.delete(connectionId);
        });
        ws.on('error', () => {
            this.clients.delete(ws);
            this.connections.delete(connectionId);
        });
    }
    handleRelayMessage(ws, message) {
        switch (message.type) {
            case 'heartbeat':
                ws.send(JSON.stringify({ id: message.id, type: 'heartbeat', payload: { ack: true }, timestamp: new Date().toISOString() }));
                break;
            case 'session_sync':
                this.broadcast({ ...message, timestamp: new Date().toISOString() }, ws);
                break;
            case 'command':
                this.handleCommand(ws, message);
                break;
            default:
                ws.send(JSON.stringify({ id: message.id, type: 'error', payload: { error: 'Unknown message type' }, timestamp: new Date().toISOString() }));
        }
    }
    handleCommand(ws, message) {
        const payload = message.payload;
        switch (payload.action) {
            case 'list':
                ws.send(JSON.stringify({
                    id: message.id,
                    type: 'response',
                    payload: Array.from(this.connections.values()),
                    timestamp: new Date().toISOString(),
                }));
                break;
            default:
                ws.send(JSON.stringify({
                    id: message.id,
                    type: 'response',
                    payload: { success: true },
                    timestamp: new Date().toISOString(),
                }));
        }
    }
    broadcast(message, exclude) {
        const payload = JSON.stringify(message);
        for (const client of this.clients) {
            if (client !== exclude && client.readyState === ws_1.WebSocket.OPEN) {
                client.send(payload);
                const conn = Array.from(this.connections.values()).find(c => c.id);
                if (conn)
                    conn.bytesSent += payload.length;
            }
        }
    }
    getConnections() {
        return Array.from(this.connections.values());
    }
}
exports.RemoteService = RemoteService;
//# sourceMappingURL=RemoteService.js.map