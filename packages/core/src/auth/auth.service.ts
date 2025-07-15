import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface UserData {
  id: string;
  email: string;
  name?: string;
  roles?: string[];
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async validateUser(email: string, password: string): Promise<UserData | null> {
    // This is a placeholder implementation
    // In a real app, you would validate against a database
    if (email && password) {
      return {
        id: '1',
        email,
        name: 'Test User',
        roles: ['user'],
      };
    }
    return null;
  }

  async login(user: UserData) {
    const payload = {
      email: user.email,
      sub: user.id,
      roles: user.roles || ['user'],
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
    };
  }

  async register(userData: {
    email: string;
    password: string;
    name?: string;
  }): Promise<UserData> {
    // This is a placeholder implementation
    // In a real app, you would save to a database
    return {
      id: Date.now().toString(),
      email: userData.email,
      name: userData.name || 'New User',
      roles: ['user'],
    };
  }

  async validateToken(token: string): Promise<UserData | null> {
    try {
      const payload = this.jwtService.verify(token);
      return {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles,
      };
    } catch {
      return null;
    }
  }
}