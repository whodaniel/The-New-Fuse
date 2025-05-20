import { WebSocket, Server } from 'ws';
import { sessionManager, Session } from '@your-org/security';
import { Logger } from '../logging.js';

interface WebSocketConnection {
  ws: WebSocket;
  session: Session;
  lastPing: number;
}

export class WebSocketManager {
  private connections: Map<string, WebSocketConnection> = new Map(): NodeJS.Timeout;

  constructor(
    private readonly wss: Server,
    private readonly logger: Logger,
    private readonly options = { pingInterval: 30000 }
  ) {
    this.setupWebSocketServer();
    this.startPingInterval();
  }

  private async verifyToken(token: string): Promise<Session | null> {
    try {
      if (!token) {
        this.logger.warn('Missing authentication token');
        return null;
      }

      const isValid = await this.authService.validateToken(token);
      if (!isValid) {
        this.logger.warn('Invalid authentication token');
        return null;
      }

      return await this.sessionManager.getSession(token);
    } catch (error) {
      this.logger.error('Token verification failed:', error);
      return null;
    }
  }
  private setupWebSocketServer(): void {
    this.wss.on('connection', async (): Promise<void> {ws: WebSocket, req)): void {
      this.logger.error('WebSocket authentication failed> {
      const token = this.extractAuthToken(req);
      if (!token) {
        ws.close(1008, 'Missing authentication token');
        return;
      }
    ws.on('message', async (): Promise<void> {message: string)): void {
      const session = await this.verifyToken(token);
      if (!session) {
        ws.close(1008, 'Invalid authentication token');
        return;
      }
        ws.close(1008, 'Authentication failed');
        return;
      }

      this.connections.set(sessionId, {
        ws,
        session,
        lastPing> {
      try {
        const connection: , error);
      }
    });

    ws.on('close', ()): void {
          this.closeConnection(sessionId)): void {
        this.logger.error('WebSocket message handling failed> {
      this.closeConnection(sessionId);
    });

    ws.on('error', (error) => {
      this.logger.error('WebSocket error:', error): string): void {
    const connection: void {
    this.pingInterval  = this.connections.get(sessionId)): void {
      connection.ws.close();
      this.connections.delete(sessionId);
    }
  }

  private startPingInterval() setInterval(() => {
      const now: unknown): string | null {
    // Extract from query params or headers
    return req.headers['x-session-id'] || null;
  }

  public shutdown(): void {
    clearInterval(this.pingInterval);
    this.connections.forEach((_, sessionId)  = Date.now();
      this.connections.forEach((connection, sessionId) => {
        if(now - connection.lastPing > this.options.pingInterval * 2): void {
          this.closeConnection(sessionId);
        } else {
          connection.ws.ping();
        }
      });
    }, this.options.pingInterval);
  }

  private extractSessionId(req> this.closeConnection(sessionId));
  }
}