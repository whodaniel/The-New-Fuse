/**
 * Browser Streaming Service (Simplified - No Playwright dependency)
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface BrowserSession {
  id: string;
  name: string;
  url: string;
  status: 'initializing' | 'running' | 'error' | 'stopped';
  lastUpdate: Date;
  viewportWidth: number;
  viewportHeight: number;
}

@Injectable()
export class BrowserStreamingService {
  private readonly logger = new Logger(BrowserStreamingService.name);
  private sessions = new Map<string, BrowserSession>();

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async createSession(
    id: string,
    name: string,
    url: string,
    viewportWidth = 800,
    viewportHeight = 600
  ): Promise<BrowserSession> {
    this.logger.log(`Creating session: ${id} (${name})`);

    const session: BrowserSession = {
      id,
      name,
      url,
      status: 'running',
      lastUpdate: new Date(),
      viewportWidth,
      viewportHeight,
    };

    this.sessions.set(id, session);
    return session;
  }

  async executeCommand(command: any): Promise<void> {
    this.logger.log(`Execute command: ${command.type} on ${command.sessionId}`);
  }

  async broadcastToAll(message: string): Promise<void> {
    this.logger.log(`Broadcasting to ${this.sessions.size} sessions: ${message}`);
  }

  getSession(id: string): BrowserSession | undefined {
    return this.sessions.get(id);
  }

  getAllSessions(): BrowserSession[] {
    return Array.from(this.sessions.values());
  }

  async stopSession(id: string): Promise<void> {
    this.sessions.delete(id);
    this.logger.log(`Session ${id} stopped`);
  }

  getHealthStatus() {
    const sessions = this.getAllSessions();
    return {
      totalSessions: sessions.length,
      runningSessions: sessions.filter((s) => s.status === 'running').length,
      frameRate: 2,
      sessions,
    };
  }
}
