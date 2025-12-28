import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Local User interface for auth service
interface AuthUser {
  id: string;
  username: string;
  email: string;
  roles?: string[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validateUser(username: string, password: string): Promise<AuthUser> {
    // Basic implementation - in real app, validate against database
    return { 
      id: '1', 
      username, 
      email: `${username}@example.com`,
      roles: ['USER'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async login(user: AuthUser) {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateToken(token: string): Promise<AuthUser | null> {
    try {
      const payload = this.jwtService.verify(token);
      return {
        id: payload.sub,
        username: payload.username,
        email: payload.email || `${payload.username}@example.com`,
        roles: payload.roles,
      } as AuthUser;
    } catch {
      return null;
    }
  }
}