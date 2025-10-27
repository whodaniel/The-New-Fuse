import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { compare, hash } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

// This is a temporary auth service. Replace with a real one.

@Injectable()
export class AuthenticationService extends EventEmitter {
  private readonly logger = new Logger(AuthenticationService.name);
  private db = {
    users: new Map<string, any>(),
    sessions: new Map<string, any>(),
    loginAttempts: new Array<any>(),
  };

  constructor() {
    super();
    // Add a dummy user for testing
    hash('password', 10).then(hashedPassword => {
      this.db.users.set('testuser', {
        id: '1',
        username: 'testuser',
        password: hashedPassword,
        locked: false,
      });
    });
  }

  async login(username: string, password, deviceInfo) {
    this.logger.log(`Login attempt for ${username}`);
    return {
      id: uuidv4(),
      userId: '1',
      token: uuidv4(),
      refreshToken: uuidv4(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      deviceInfo,
    };
  }

  async logout(sessionId: string) {
    this.logger.log(`Logout for session ${sessionId}`);
    this.db.sessions.delete(sessionId);
  }

  async refreshToken(refreshToken: string, deviceInfo) {
    this.logger.log(`Refresh token`);
    return {
      id: uuidv4(),
      userId: '1',
      token: uuidv4(),
      refreshToken: uuidv4(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      deviceInfo,
    };
  }
}
