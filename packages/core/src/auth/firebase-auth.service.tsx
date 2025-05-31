import { Injectable } from '@nestjs/common';
import { FirebaseConfig } from '../config/firebase.config.js';
import { PrismaClient, Session, User } from '@the-new-fuse/database/client';
import { Logger } from '@the-new-fuse/utils';
import { auth } from 'firebase-admin';

@Injectable()
export class FirebaseAuthService {
  private readonly logger = new Logger(FirebaseAuthService.name);

  constructor(
    private readonly firebaseConfig: FirebaseConfig,
    private readonly prisma: PrismaClient
  ) {}

  async verifyToken(token: string): Promise<auth.DecodedIdToken> {
    try {
      const decodedToken = await this.firebaseConfig.verifyIdToken(token);
      return decodedToken;
    } catch (error: unknown) {
      this.logger.error('Token verification failed:', error);
      throw error;
    }
  }

  async createUserSession(userId: string, token: string): Promise<Session> {
    try {
      const session = await this.prisma.session.create({
        data: {
          userId,
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });
      return session;
    } catch (error: unknown) {
      this.logger.error('Failed to create user session:', error);
      throw error;
    }
  }

  async validateSession(token: string): Promise<(Session & { user: User }) | null> {
    try {
      const session = await this.prisma.session.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!session || new Date() > session.expiresAt) {
        return null;
      }

      return session;
    } catch (error: unknown) {
      this.logger.error('Session validation failed:', error);
      throw error;
    }
  }

  async revokeSession(token: string): Promise<void> {
    try {
      await this.prisma.session.delete({
        where: { token }
      });
    } catch (error: unknown) {
      this.logger.error('Failed to revoke session:', error);
      throw error;
    }
  }
}