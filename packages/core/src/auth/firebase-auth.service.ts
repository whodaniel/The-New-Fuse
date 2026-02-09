import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
@Injectable()
export class FirebaseAuthService {
  private readonly logger = new Logger(FirebaseAuthService.name);
  private readonly firebaseApp: admin.app.App;
  constructor(private readonly configService: ConfigService) {
    const serviceAccount = {
      projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
      privateKey: this.configService.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
      clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
    };
    this.firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: this.configService.get<string>('FIREBASE_DATABASE_URL'),
    });
  }

  async verifyToken(token: string): Promise<admin.auth.DecodedIdToken> {
    try {
      const decodedToken = await this.firebaseApp.auth().verifyIdToken(token);
      this.logger.debug('Token verified successfully');
      return decodedToken;
    } catch (error) {
      this.logger.error('Token verification failed', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getUser(uid: string): Promise<admin.auth.UserRecord> {
    try {
      const user = await this.firebaseApp.auth().getUser(uid);
      this.logger.debug('User retrieved successfully');
      return user;
    } catch (error) {
      this.logger.error('Failed to get user', error);
      throw new UnauthorizedException('User not found');
    }
  }

  async getUserByEmail(email: string): Promise<admin.auth.UserRecord> {
    try {
      const user = await this.firebaseApp.auth().getUserByEmail(email);
      this.logger.debug('User retrieved by email successfully');
      return user;
    } catch (error) {
      this.logger.error('Failed to get user by email', error);
      throw new UnauthorizedException('User not found');
    }
  }

  async createUser(userData: admin.auth.CreateRequest): Promise<admin.auth.UserRecord> {
    try {
      const user = await this.firebaseApp.auth().createUser(userData);
      this.logger.log('User created successfully');
      return user;
    } catch (error) {
      this.logger.error('Failed to create user', error);
      throw new UnauthorizedException('Failed to create user');
    }
  }

  async updateUser(uid: string, userData: admin.auth.UpdateRequest): Promise<admin.auth.UserRecord> {
    try {
      const user = await this.firebaseApp.auth().updateUser(uid, userData);
      this.logger.log('User updated successfully');
      return user;
    } catch (error) {
      this.logger.error('Failed to update user', error);
      throw new UnauthorizedException('Failed to update user');
    }
  }

  async deleteUser(uid: string): Promise<void> {
    try {
      await this.firebaseApp.auth().deleteUser(uid);
      this.logger.log('User deleted successfully');
    } catch (error) {
      this.logger.error('Failed to delete user', error);
      throw new UnauthorizedException('Failed to delete user');
    }
  }

  async setCustomUserClaims(uid: string, claims: object): Promise<void> {
    try {
      await this.firebaseApp.auth().setCustomUserClaims(uid, claims);
      this.logger.log('Custom claims set successfully');
    } catch (error) {
      this.logger.error('Failed to set custom claims', error);
      throw new UnauthorizedException('Failed to set custom claims');
    }
  }

  async createCustomToken(uid: string, additionalClaims?: object): Promise<string> {
    try {
      const token = await this.firebaseApp.auth().createCustomToken(uid, additionalClaims);
      this.logger.debug('Custom token created successfully');
      return token;
    } catch (error) {
      this.logger.error('Failed to create custom token', error);
      throw new UnauthorizedException('Failed to create custom token');
    }
  }

  async generatePasswordResetLink(email: string): Promise<string> {
    try {
      const link = await this.firebaseApp.auth().generatePasswordResetLink(email);
      this.logger.log('Password reset link generated');
      return link;
    } catch (error) {
      this.logger.error('Failed to generate password reset link', error);
      throw new UnauthorizedException('Failed to generate password reset link');
    }
  }

  async generateEmailVerificationLink(email: string): Promise<string> {
    try {
      const link = await this.firebaseApp.auth().generateEmailVerificationLink(email);
      this.logger.log('Email verification link generated');
      return link;
    } catch (error) {
      this.logger.error('Failed to generate email verification link', error);
      throw new UnauthorizedException('Failed to generate email verification link');
    }
  }

  async listUsers(maxResults?: number, pageToken?: string): Promise<admin.auth.ListUsersResult> {
    try {
      const users = await this.firebaseApp.auth().listUsers(maxResults, pageToken);
      this.logger.debug('Users listed successfully');
      return users;
    } catch (error) {
      this.logger.error('Failed to list users', error);
      throw new UnauthorizedException('Failed to list users');
    }
  }

  async revokeRefreshTokens(uid: string): Promise<void> {
    try {
      await this.firebaseApp.auth().revokeRefreshTokens(uid);
      this.logger.log('Refresh tokens revoked successfully');
    } catch (error) {
      this.logger.error('Failed to revoke refresh tokens', error);
      throw new UnauthorizedException('Failed to revoke refresh tokens');
    }
  }

  async verifySessionCookie(sessionCookie: string, checkRevoked?: boolean): Promise<admin.auth.DecodedIdToken> {
    try {
      const decodedToken = await this.firebaseApp.auth().verifySessionCookie(sessionCookie, checkRevoked);
      this.logger.debug('Session cookie verified successfully');
      return decodedToken;
    } catch (error) {
      this.logger.error('Failed to verify session cookie', error);
      throw new UnauthorizedException('Invalid session cookie');
    }
  }

  async createSessionCookie(idToken: string, expiresIn: number): Promise<string> {
    try {
      const sessionCookie = await this.firebaseApp.auth().createSessionCookie(idToken, { expiresIn });
      this.logger.debug('Session cookie created successfully');
      return sessionCookie;
    } catch (error) {
      this.logger.error('Failed to create session cookie', error);
      throw new UnauthorizedException('Failed to create session cookie');
    }
  }
}