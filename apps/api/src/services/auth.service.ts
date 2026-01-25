import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService, User } from '@the-new-fuse/database';
import { compare, hash } from 'bcrypt';
import { LoginDto, RegisterDto, TokenDto } from '../dtos/auth.dto';

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

  async login(loginDto: LoginDto): Promise<TokenDto> {
    const user = await this.db.users.findByEmail(loginDto.email);

    // Note: Drizzle User type includes hashedPassword
    if (!user || !user.hashedPassword || !(await compare(loginDto.password, user.hashedPassword))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async register(registerDto: RegisterDto): Promise<TokenDto> {
    const existingUser = await this.db.users.findByEmailOrUsername(registerDto.email);
    // Also check username if separated in future, but findByEmailOrUsername handles both usually implies one arg.
    // DrizzleUserRepository.findByEmailOrUsername takes string.
    // If we want to check both independently:
    const existingUsername = await this.db.users.findByUsername(registerDto.username);

    if (existingUser || existingUsername) {
      throw new UnauthorizedException('User already exists');
    }

    const hashedPassword = await hash(registerDto.password, 10);
    const user = await this.db.users.create({
      ...registerDto,
      hashedPassword,
      // Default fields
      role: 'USER',
      isActive: true,
      emailVerified: false,
    } as any); // Casting as any to match NewUser exact shape if needed, or rely on partial

    return this.generateTokens(user);
  }

  async refresh(refreshToken: string): Promise<TokenDto> {
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

  private async generateTokens(user: User): Promise<TokenDto> {
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

    return { accessToken, refreshToken };
  }
}
