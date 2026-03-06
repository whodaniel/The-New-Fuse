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

type JwtPayload = {
  sub: string;
  username: string | null;
  email: string;
  roles: string[];
  permissions: string[];
  tenantId?: string;
};

type AuthRequestMeta = {
  ipAddress?: string;
};

type TurnstileVerificationResponse = {
  success: boolean;
  'error-codes'?: string[];
};

const isTruthy = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value !== 'string') return false;

  const normalized = value.trim().toLowerCase();
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(normalized);
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
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async login(loginDto: LoginDto, meta: AuthRequestMeta = {}): Promise<AuthResponse> {
    await this.verifyTurnstileIfEnabled(loginDto.cfTurnstileToken, meta.ipAddress);

    const user = await this.db.users.findByEmail(loginDto.email);

    if (!user || !user.hashedPassword || !(await compare(loginDto.password, user.hashedPassword))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    return this.generateTokens(user);
  }

  async register(registerDto: RegisterDto, meta: AuthRequestMeta = {}): Promise<AuthResponse> {
    await this.verifyTurnstileIfEnabled(registerDto.cfTurnstileToken, meta.ipAddress);
    this.verifyInviteCodeIfEnabled(registerDto.inviteCode);

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
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.get<string>('JWT_SECRET');

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: refreshSecret,
      });

      const user = await this.db.users.findById(payload.sub);
      if (!user) throw new Error('User not found');

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(): Promise<void> {
    // Stateless JWT logout handled client-side for now.
  }

  async getCurrentUser(userId: string): Promise<User | null> {
    return this.db.users.findById(userId);
  }

  private async verifyTurnstileIfEnabled(token: string | undefined, ipAddress?: string) {
    const requireTurnstile = isTruthy(this.configService.get('AUTH_REQUIRE_TURNSTILE'));
    if (!requireTurnstile) {
      return;
    }

    if (!token) {
      throw new UnauthorizedException('Cloudflare Turnstile token is required');
    }

    const secret =
      this.configService.get<string>('CLOUDFLARE_TURNSTILE_SECRET_KEY') ||
      this.configService.get<string>('TURNSTILE_SECRET_KEY');

    if (!secret) {
      throw new UnauthorizedException(
        'Cloudflare Turnstile is enabled but no secret key is configured'
      );
    }

    const body = new URLSearchParams();
    body.append('secret', secret);
    body.append('response', token);
    if (ipAddress) {
      body.append('remoteip', ipAddress);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new UnauthorizedException('Unable to validate Cloudflare Turnstile token');
    }

    const result = (await response.json()) as TurnstileVerificationResponse;
    if (!result.success) {
      throw new UnauthorizedException('Cloudflare Turnstile validation failed');
    }
  }

  private async generateTokens(user: User): Promise<AuthResponse> {
    const roles = this.resolveRoles(user);
    const explicitPermissions = Array.isArray((user as any).permissions)
      ? ((user as any).permissions as string[])
      : [];
    const permissions = this.resolvePermissions(roles, explicitPermissions);

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      roles,
      permissions,
    };

    const tenantId = this.resolveTenantIdClaim(user);
    if (tenantId) {
      payload.tenantId = tenantId;
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          this.configService.get<string>('JWT_SECRET'),
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
        roles,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
      },
    };
  }

  private resolvePermissions(roles: string[], explicitPermissions: string[] = []): string[] {
    const normalized = new Set(roles);
    const permissions = new Set<string>([
      'profile:read',
      'profile:update',
      'workspace:read',
      'agents:read',
      'chat:read',
      'chat:write',
    ]);

    const isAdmin =
      normalized.has('ADMIN') ||
      normalized.has('admin') ||
      normalized.has('SUPER_ADMIN') ||
      normalized.has('super_admin');
    const isSystem =
      normalized.has('SUPER_ADMIN') ||
      normalized.has('super_admin') ||
      normalized.has('SYSTEM') ||
      normalized.has('system');

    if (isAdmin || isSystem) {
      permissions.add('admin:access');
      permissions.add('handoff:publish');
      permissions.add('handoff:read:any');
      permissions.add('handoff:ack:any');
    }

    if (isSystem) {
      permissions.add('system:access');
    }

    for (const permission of explicitPermissions) {
      if (typeof permission === 'string' && permission.trim().length > 0) {
        permissions.add(permission.trim());
      }
    }

    return [...permissions];
  }

  private resolveRoles(user: User): string[] {
    const roleCandidates = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [user.role];
    const roles = new Set<string>();

    for (const role of roleCandidates) {
      if (typeof role !== 'string' || role.trim().length === 0) continue;
      const raw = role.trim();
      const upper = raw.toUpperCase();
      const lower = raw.toLowerCase();
      roles.add(upper);
      roles.add(lower);
    }

    if (roles.has('SUPER_ADMIN') || roles.has('super_admin')) {
      roles.add('SYSTEM');
      roles.add('system');
      roles.add('ADMIN');
      roles.add('admin');
    } else if (roles.has('ADMIN') || roles.has('admin')) {
      roles.add('admin');
    }

    return [...roles];
  }

  private verifyInviteCodeIfEnabled(inviteCode: string | undefined): void {
    const inviteOnly = isTruthy(this.configService.get('AUTH_INVITE_ONLY'));
    if (!inviteOnly) {
      return;
    }

    const codesValue = this.configService.get<string>('AUTH_INVITE_CODES') || '';
    const allowedCodes = codesValue
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    const submittedCode = inviteCode?.trim();
    if (!submittedCode || !allowedCodes.includes(submittedCode)) {
      throw new UnauthorizedException('Valid invitation code is required');
    }
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

  private resolveTenantIdClaim(user: User): string | undefined {
    const tenantId = (user as any).tenantId;
    if (typeof tenantId === 'string' && tenantId.trim().length > 0) {
      return tenantId.trim();
    }
    return undefined;
  }
}
