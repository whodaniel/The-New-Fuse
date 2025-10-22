import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  password: string;
  roles: string[];
  isActive: boolean;
  lockedUntil?: Date;
}

@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    try {
      // This is a placeholder - in a real app, you'd query your database
      const user = await this.findUserByEmail(email);
      if (!user) {
        this.logger.warn('Authentication attempt with invalid email');
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isActive) {
        this.logger.warn('Authentication attempt for inactive user');
        throw new UnauthorizedException('Account is deactivated');
      }

      if (user.lockedUntil && user.lockedUntil > new Date()) {
        this.logger.warn('Authentication attempt for locked user');
        throw new UnauthorizedException('Account is temporarily locked');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn('Authentication failed - invalid password');
        throw new UnauthorizedException('Invalid credentials');
      }

      this.logger.info('User authenticated successfully', { userId: user.id });
      return user;
    } catch (error) {
      this.logger.error('Authentication error', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async login(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles
    };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET', 'default-secret'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m')
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'default-refresh-secret'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d')
    });
    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'default-refresh-secret')
      });
      const user = await this.findUserById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.login(user);
    } catch (error) {
      this.logger.warn('Refresh token validation failed', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUserPermissions(user: User, requiredRole: string): Promise<boolean> {
    return user.roles.includes(requiredRole);
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10);
    return bcrypt.hash(password, saltRounds);
  }

  private async findUserByEmail(email: string): Promise<User | null> {
    // Placeholder implementation - replace with actual database query
    const mockUsers: User[] = [
      {
        id: '1',
        email: 'admin@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        roles: ['admin'],
        isActive: true
      },
      {
        id: '2',
        email: 'user@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        roles: ['user'],
        isActive: true
      }
    ];
    return mockUsers.find(u => u.email === email) || null;
  }

  private async findUserById(id: string): Promise<User | null> {
    // Placeholder implementation - replace with actual database query
    const mockUsers: User[] = [
      {
        id: '1',
        email: 'admin@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        roles: ['admin'],
        isActive: true
      },
      {
        id: '2',
        email: 'user@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        roles: ['user'],
        isActive: true
      }
    ];
    return mockUsers.find(u => u.id === id) || null;
  }
}