import { WebSocketServer, WebSocket } from 'ws';
import { TraeMetrics } from './trae-metrics.js';
import { CommandTracker } from './command-tracker.js';

export class UnifiedMonitorService {
 private static instance: UnifiedMonitorService;
 private wss: WebSocketServer;
 private connections: Set<WebSocket> = new Set();
 private metrics = TraeMetrics.getInstance();
 private commands = CommandTracker.getInstance();

 private constructor(port: number) {
 this.wss = new WebSocketServer({ port });
 this.setupHandlers();
 }

 public static init(port: number): UnifiedMonitorService {
 if (!this.instance) {
 this.instance = new UnifiedMonitorService(port);
 }
 return this.instance;
 }

 private setupHandlers() {
 this.wss.on('connection', (ws, req) => {
 this.handleAuthentication(ws, req)
 .then(() => this.addConnection(ws))
 .catch(error => ws.close(1008, error.message));
 });

 this.metrics.onUpdate(metrics => {
 this.broadcast({ type: 'metrics_update', data: metrics });
 });

 this.commands.onCommandStatus((commandId, status) => {
 this.broadcast({ type: 'command_status', commandId, status });
 });
 }

 private async handleAuthentication(ws: WebSocket, req: any) {
 const token = new URL(req.url, 'http://localhost').searchParams.get('token');
 if (!token) throw new Error('Authentication required');

 // Implement actual token verification logic
 const isValid = await this.verifyToken(token);
 if (!isValid) throw new Error('Invalid credentials');
 }

 private addConnection(ws: WebSocket) {
 this.connections.add(ws);
 ws.on('close', () => this.connections.delete(ws));
 ws.send(JSON.stringify(this.metrics.currentMetrics));
 }

 public broadcast(message: object) {
 const payload = JSON.stringify(message);
 this.connections.forEach(ws => {
 if (ws.readyState === WebSocket.OPEN) {
 ws.send(payload);
 }
 });
 }

 public trackCommandExecution(commandId: string) {
 this.commands.track(commandId);
 }

 private async verifyToken(token: string): Promise<boolean> {
 // Implementation would integrate with existing auth system
 return true;
 }
}