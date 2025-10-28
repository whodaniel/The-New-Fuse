/**
 * Code Execution Session Service
 * 
 * This service manages collaborative code execution sessions.
 */
import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@the-new-fuse/database';
import { Session, File } from './types';
import { Subject } from 'rxjs';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private sessions = new Map<string, Session>();
  private sessionEvents = new Subject<{ sessionId: string; event: string; data: any }>();

  constructor(private readonly prisma: PrismaService) {}

  async createSession(): Promise<Session> {
    const sessionId = uuidv4();
    const defaultFile: File = {
      name: 'main.js',
      content: "// Write your code here\n\nconsole.log('Hello, world!');\n",
      language: 'javascript',
    };
    const newSession: Session = {
      id: sessionId,
      files: [defaultFile],
      runtime: 'node',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.sessions.set(sessionId, newSession);
    await this.prisma.codeSession.create({
      data: {
        id: sessionId,
        files: { create: [defaultFile] },
        runtime: 'node',
      },
    });
    this.logger.log(`Session ${sessionId} created.`);
    return newSession;
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId);
    }
    const sessionFromDb = await this.prisma.codeSession.findUnique({
      where: { id: sessionId },
      include: { files: true },
    });
    if (sessionFromDb) {
      const session = { ...sessionFromDb, files: sessionFromDb.files };
      this.sessions.set(sessionId, session);
      return session;
    }
    return undefined;
  }

  async updateFile(sessionId: string, fileName: string, content: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      const file = session.files.find(f => f.name === fileName);
      if (file) {
        file.content = content;
        session.updatedAt = new Date();
        await this.prisma.file.update({
          where: { id: file.id },
          data: { content },
        });
        this.sessionEvents.next({ sessionId, event: 'fileUpdated', data: { fileName, content } });
      }
    }
  }

  getSessionEvents(sessionId: string) {
    return this.sessionEvents.asObservable();
  }
}
