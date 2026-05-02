"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServeService = void 0;
const http_1 = require("http");
const ws_1 = require("ws");
const child_process_1 = require("child_process");
class ServeService {
    constructor(options = {}) {
        this.httpServer = null;
        this.wsServer = null;
        this.clients = new Set();
        this.options = {
            port: options.port ?? 0,
            hostname: options.hostname ?? '127.0.0.1',
            mdns: options.mdns ?? false,
            mdnsDomain: options.mdnsDomain ?? 'tnf.local',
            cors: options.cors ?? [],
            cwd: options.cwd ?? process.cwd(),
        };
    }
    async start() {
        return new Promise((resolve, reject) => {
            this.httpServer = (0, http_1.createServer)((req, res) => {
                this.handleHttpRequest(req, res);
            });
            this.wsServer = new ws_1.WebSocketServer({ server: this.httpServer });
            this.wsServer.on('connection', (ws) => {
                this.handleWebSocketConnection(ws);
            });
            const hostname = this.options.mdns ? '0.0.0.0' : this.options.hostname;
            this.httpServer.listen(this.options.port, hostname, () => {
                const address = this.httpServer.address();
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
                service: 'tnf-server',
                version: '1.0.0',
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
    handleWebSocketConnection(ws) {
        this.clients.add(ws);
        ws.send(JSON.stringify({ type: 'connected', pid: process.pid }));
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleMessage(ws, message);
            }
            catch { }
        });
        ws.on('close', () => {
            this.clients.delete(ws);
        });
        ws.on('error', () => {
            this.clients.delete(ws);
        });
    }
    handleMessage(ws, message) {
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
    executeCommand(ws, command, args) {
        const child = (0, child_process_1.spawn)(command, args, {
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
    broadcastMDNS() {
        try {
            if (process.platform === 'darwin') {
                (0, child_process_1.spawnSync)('dns-sd', [
                    '-R',
                    `"TNF Server"`,
                    '_http._tcp',
                    '.',
                    String(this.options.port),
                ]);
            }
        }
        catch { }
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
}
exports.ServeService = ServeService;
//# sourceMappingURL=ServeService.js.map