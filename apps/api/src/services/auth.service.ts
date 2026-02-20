import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService, User } from '@the-new-fuse/database';
import { compare, hash } from 'bcrypt';
import { LoginDto, RegisterDto, TokenDto } from '../dtos/auth.dto';

type AuthResponse = TokenDto & {
  access_token: string;
  refresh_token: string;
  token: string;
  user: {
    id: string;
    email: string;
    username: string | null;
    name: string | null;
    role: string;
    roles: string[];
    emailVerified: boolean;
    isActive: boolean;
  };
};

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async validateToken(token: string): Promise<User> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.db.users.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.db.users.findByEmail(loginDto.email);

    if (!user || !user.hashedPassword || !(await compare(loginDto.password, user.hashedPassword))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingEmail = await this.db.users.findByEmail(registerDto.email);
    if (existingEmail) {
      throw new UnauthorizedException('User already exists');
    }

    const username = await this.generateUniqueUsername(registerDto);
    const displayName = this.buildDisplayName(registerDto);
    const hashedPassword = await hash(registerDto.password, 10);

    const user = await this.db.users.create({
      email: registerDto.email,
      username,
      name: displayName,
      hashedPassword,
      role: 'USER',
      roles: ['USER'],
      isActive: true,
      emailVerified: false,
    } as any);

    return this.generateTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.db.users.findById(payload.sub);
      if (!user) throw new Error('User not found');

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(): Promise<void> {
    // Implement token blacklisting if needed
    // For now, logout is handled client-side by removing the token
  }

  async getCurrentUser(userId: string): Promise<User | null> {
    return this.db.users.findById(userId);
  }

  private async generateTokens(user: User): Promise<AuthResponse> {
    const payload = { sub: user.id, username: user.username };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      access_token: accessToken,
      refresh_token: refreshToken,
      token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        roles: user.roles ?? [user.role],
        emailVerified: user.emailVerified,
        isActive: user.isActive,
      },
    };
  }

  private buildDisplayName(registerDto: RegisterDto): string | null {
    if (registerDto.name?.trim()) {
      return registerDto.name.trim();
    }

    const fullName = [registerDto.firstName, registerDto.lastName]
      .filter((value): value is string => !!value?.trim())
      .join(' ')
      .trim();

    return fullName || null;
  }

  private sanitizeUsername(value: string): string {
    const normalized = value
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '');

    return (normalized || 'user').slice(0, 50);
  }

  private async generateUniqueUsername(registerDto: RegisterDto): Promise<string> {
    const emailLocalPart = registerDto.email.split('@')[0] || 'user';
    const baseCandidate =
      registerDto.username || registerDto.name || registerDto.firstName || emailLocalPart;
    const base = this.sanitizeUsername(baseCandidate);

    const existingBase = await this.db.users.findByUsername(base);
    if (!existingBase) {
      return base;
    }

    for (let suffix = 1; suffix < 5000; suffix += 1) {
      const candidate = `${base}_${suffix}`;
      const existing = await this.db.users.findByUsername(candidate);
      if (!existing) {
        return candidate;
      }
    }

    throw new UnauthorizedException('Unable to allocate username');
  }
}
