import { Injectable, OnModuleDestroy, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { randomUUID } from 'crypto';
import postgres from 'postgres';

type DbUser = {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string | null;
  role: string;
  roles: string[] | null;
};

type AuthUser = {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  role: string;
  roles: string[];
  emailVerified: boolean;
  isActive: boolean;
};

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  access_token: string;
  refresh_token: string;
  token: string;
  user: AuthUser;
};

type JwtPayload = {
  sub: string;
  username: string | null;
  email: string;
  roles: string[];
  permissions: string[];
};

type TurnstileVerificationResponse = {
  success: boolean;
};

type GoogleTokenInfo = {
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  iss?: string;
};

type SupabaseUserInfo = {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
  user_metadata?: {
    name?: string;
    full_name?: string;
  } | null;
};

const isTruthy = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value !== 'string') return false;
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(value.trim().toLowerCase());
};

@Injectable()
export class GatewayAuthService implements OnModuleDestroy {
  private readonly sql = postgres(
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/thenewfuse'
  );

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async onModuleDestroy() {
    await this.sql.end({ timeout: 5 });
  }

  async login(
    email: string,
    password: string,
    cfTurnstileToken?: string,
    ipAddress?: string
  ): Promise<AuthResponse> {
    await this.verifyTurnstileIfEnabled(cfTurnstileToken, ipAddress);

    const user = await this.findUserByEmail(email);
    if (!user || !user.passwordHash || !(await compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async register(
    name: string | undefined,
    email: string,
    password: string,
    cfTurnstileToken?: string,
    ipAddress?: string
  ): Promise<AuthResponse> {
    await this.verifyTurnstileIfEnabled(cfTurnstileToken, ipAddress);

    const existing = await this.findUserByEmail(email);
    if (existing) {
      throw new UnauthorizedException('User already exists');
    }

    const passwordHash = await hash(password, 10);
    const now = new Date();
    const id = `usr_${randomUUID().replace(/-/g, '').slice(0, 24)}`;

    const inserted = await this.sql<DbUser[]>`
      insert into users (id, email, name, "passwordHash", role, roles, "createdAt", "updatedAt")
      values (${id}, ${email}, ${name?.trim() || null}, ${passwordHash}, ${'USER'}, ${JSON.stringify(['USER'])}::jsonb, ${now}, ${now})
      returning id, email, name, "passwordHash", role, roles
    `;

    const user = inserted[0];
    if (!user) {
      throw new UnauthorizedException('Unable to create user');
    }

    return this.generateTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const refreshSecret = this.getRefreshSecret();

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, { secret: refreshSecret });
      const user = await this.findUserById(payload.sub);
      if (!user) throw new Error('User not found');
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async me(userId: string): Promise<AuthUser | null> {
    const user = await this.findUserById(userId);
    if (!user) return null;
    return this.toAuthUser(user);
  }

  async googleAuth(idToken: string): Promise<AuthResponse> {
    const tokenInfo = await this.verifyGoogleIdToken(idToken);
    const email = (tokenInfo.email || '').trim().toLowerCase();
    if (!email) {
      throw new UnauthorizedException('Google token did not contain an email');
    }

    const emailVerified = `${tokenInfo.email_verified}`.toLowerCase() === 'true';
    if (!emailVerified) {
      throw new UnauthorizedException('Google account email is not verified');
    }

    let user = await this.findUserByEmail(email);
    if (!user) {
      const now = new Date();
      const id = `usr_${randomUUID().replace(/-/g, '').slice(0, 24)}`;
      const inserted = await this.sql<DbUser[]>`
        insert into users (id, email, name, "passwordHash", role, roles, "createdAt", "updatedAt")
        values (
          ${id},
          ${email},
          ${tokenInfo.name?.trim() || null},
          ${null},
          ${'USER'},
          ${JSON.stringify(['USER'])}::jsonb,
          ${now},
          ${now}
        )
        returning id, email, name, "passwordHash", role, roles
      `;
      user = inserted[0] || null;
    } else if (!user.name && tokenInfo.name?.trim()) {
      const updated = await this.sql<DbUser[]>`
        update users
        set name = ${tokenInfo.name.trim()}, "updatedAt" = ${new Date()}
        where id = ${user.id}
        returning id, email, name, "passwordHash", role, roles
      `;
      user = updated[0] || user;
    }

    if (!user) {
      throw new UnauthorizedException('Unable to authenticate Google user');
    }

    return this.generateTokens(user);
  }

  async supabaseAuth(accessToken: string): Promise<AuthResponse> {
    const supabaseUser = await this.verifySupabaseAccessToken(accessToken);
    const email = (supabaseUser.email || '').trim().toLowerCase();
    if (!email) {
      throw new UnauthorizedException('Supabase token did not contain an email');
    }

    let user = await this.findUserByEmail(email);
    const derivedName =
      supabaseUser.user_metadata?.name?.trim() ||
      supabaseUser.user_metadata?.full_name?.trim() ||
      null;

    if (!user) {
      const now = new Date();
      const id = `usr_${randomUUID().replace(/-/g, '').slice(0, 24)}`;
      const inserted = await this.sql<DbUser[]>`
        insert into users (id, email, name, "passwordHash", role, roles, "createdAt", "updatedAt")
        values (
          ${id},
          ${email},
          ${derivedName},
          ${null},
          ${'USER'},
          ${JSON.stringify(['USER'])}::jsonb,
          ${now},
          ${now}
        )
        returning id, email, name, "passwordHash", role, roles
      `;
      user = inserted[0] || null;
    } else if (!user.name && derivedName) {
      const updated = await this.sql<DbUser[]>`
        update users
        set name = ${derivedName}, "updatedAt" = ${new Date()}
        where id = ${user.id}
        returning id, email, name, "passwordHash", role, roles
      `;
      user = updated[0] || user;
    }

    if (!user) {
      throw new UnauthorizedException('Unable to authenticate Supabase user');
    }

    return this.generateTokens(user);
  }

  private async findUserByEmail(email: string): Promise<DbUser | null> {
    const result = await this.sql<DbUser[]>`
      select id, email, name, "passwordHash", role, roles
      from users
      where lower(email) = lower(${email})
      limit 1
    `;
    return result[0] || null;
  }

  private async findUserById(id: string): Promise<DbUser | null> {
    const result = await this.sql<DbUser[]>`
      select id, email, name, "passwordHash", role, roles
      from users
      where id = ${id}
      limit 1
    `;
    return result[0] || null;
  }

  private async verifyTurnstileIfEnabled(token: string | undefined, ipAddress?: string) {
    const requireTurnstile = isTruthy(this.configService.get('AUTH_REQUIRE_TURNSTILE'));
    if (!requireTurnstile) return;

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
    if (ipAddress) body.append('remoteip', ipAddress);

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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

  private async verifyGoogleIdToken(idToken: string): Promise<GoogleTokenInfo> {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    if (!response.ok) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const tokenInfo = (await response.json()) as GoogleTokenInfo;
    const rawAllowedAudiences = [
      this.configService.get<string>('GOOGLE_AUTH_ALLOWED_AUDIENCES'),
      this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_WEB_CLIENT_ID'),
    ]
      .filter(Boolean)
      .join(',');
    const allowedAudiences = rawAllowedAudiences
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (allowedAudiences.length > 0 && tokenInfo.aud && !allowedAudiences.includes(tokenInfo.aud)) {
      throw new UnauthorizedException('Google token audience mismatch');
    }

    const issuer = `${tokenInfo.iss || ''}`.trim();
    if (issuer && issuer !== 'accounts.google.com' && issuer !== 'https://accounts.google.com') {
      throw new UnauthorizedException('Invalid Google token issuer');
    }

    if (!tokenInfo.sub) {
      throw new UnauthorizedException('Invalid Google token payload');
    }

    return tokenInfo;
  }

  private async verifySupabaseAccessToken(accessToken: string): Promise<SupabaseUserInfo> {
    const rawSupabaseUrl =
      this.configService.get<string>('SUPABASE_URL') ||
      this.configService.get<string>('VITE_SUPABASE_URL');
    const supabaseAnonKey =
      this.configService.get<string>('SUPABASE_ANON_KEY') ||
      this.configService.get<string>('SUPABASE_KEY') ||
      this.configService.get<string>('VITE_SUPABASE_ANON_KEY');

    if (!rawSupabaseUrl || !supabaseAnonKey) {
      throw new UnauthorizedException(
        'Supabase auth is not configured (missing SUPABASE_URL or SUPABASE_ANON_KEY)'
      );
    }

    const supabaseUrl = rawSupabaseUrl.replace(/\/$/, '');
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseAnonKey,
      },
    });

    if (!response.ok) {
      throw new UnauthorizedException('Invalid Supabase access token');
    }

    return (await response.json()) as SupabaseUserInfo;
  }

  private async generateTokens(user: DbUser): Promise<AuthResponse> {
    const roles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [user.role];
    const payload: JwtPayload = {
      sub: user.id,
      username: null,
      email: user.email,
      roles,
      permissions:
        roles.includes('SUPER_ADMIN') || roles.includes('ADMIN') ? ['*'] : ['profile:read'],
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.getAccessSecret(),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.getRefreshSecret(),
        expiresIn: '7d',
      }),
    ]);

    const authUser = this.toAuthUser(user);

    return {
      accessToken,
      refreshToken,
      access_token: accessToken,
      refresh_token: refreshToken,
      token: accessToken,
      user: authUser,
    };
  }

  private toAuthUser(user: DbUser): AuthUser {
    const roles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [user.role];
    return {
      id: user.id,
      email: user.email,
      username: null,
      name: user.name,
      role: user.role,
      roles,
      emailVerified: true,
      isActive: true,
    };
  }

  private getAccessSecret(): string {
    return (
      this.configService.get<string>('JWT_SECRET') || process.env.JWT_SECRET || 'dev-secret-key-123'
    );
  }

  private getRefreshSecret(): string {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      process.env.JWT_REFRESH_SECRET ||
      this.getAccessSecret()
    );
  }
}
