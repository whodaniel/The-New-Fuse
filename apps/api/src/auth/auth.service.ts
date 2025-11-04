import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../shared/types';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validateUser(username: string, password: string): Promise<User> {
    // Basic implementation - in real app, validate against database
    return { id: '1', username, email: `${username}@example.com` };
  }

  async login(user: User) {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      return this.jwtService.verify(token);
    } catch {
      return null;
    }
  }
}