import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SecurityService } from './security.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor(private readonly securityService: SecurityService) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    this.jwtSecret = secret;
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
