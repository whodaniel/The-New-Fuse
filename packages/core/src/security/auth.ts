import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SecurityService } from './security.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor(private readonly securityService: SecurityService) {
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-for-dev';
  }

  async validateUser(password: string, hash: string): Promise<boolean> {
    return this.securityService.comparePassword(password, hash);
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: jwt.sign(payload, this.jwtSecret, { expiresIn: '60s' }),
    };
  }
}
