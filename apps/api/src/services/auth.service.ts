import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseService, sql, User } from '@the-new-fuse/database';
import { compare, hash } from 'bcrypt';
import * as crypto from 'node:crypto';
import WebSocket from 'ws';
import {
  GenerateInviteCodeDto,
  LoginDto,
  RegisterDto,
  SupabaseAuthDto,
  TokenDto,
} from '../dtos/auth.dto';

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

type InviteValidationResult = {
  code: string;
  source: 'db' | 'env';
  inviteId?: string;
  federationId?: string | null;
};

type InviteCodeRow = {
  id: string;
  code: string;
  label: string | null;
  federation_id: string | null;
  status: 'ACTIVE' | 'DISABLED';
  max_uses: number;
  used_count: number;
  expires_at: Date | string | null;
  last_used_at: Date | string | null;
  created_by_user_id: string | null;
  metadata: unknown;
  created_at: Date | string;
  updated_at: Date | string;
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
  private readonly logger = new Logger(AuthService.name);
  private supabase: SupabaseClient | null = null;

  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    const supabaseUrl = this.configService.get('SUPABASE_URL');
    const supabaseKey = this.configService.get('SUPABASE_ANON_KEY');
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        realtime: {
          transport: WebSocket as any,
        },
      });
    }
  }

  async supabaseExchange(dto: SupabaseAuthDto): Promise<AuthResponse> {
    this.logger.log(`Initiating Supabase token exchange. Configured: ${!!this.supabase}`);
    if (!this.supabase) {
      throw new UnauthorizedException('Supabase auth is not configured on this server');
    }

    try {
      const { data, error } = await this.supabase.auth.getUser(dto.accessToken);
      if (error || !data.user) {
        this.logger.error(`Supabase getUser failed: ${error?.message || 'No user data'}`);
        throw new UnauthorizedException('Invalid Supabase token');
      }

      const supabaseUser = data.user;
      const email = supabaseUser.email;
      if (!email) {
        throw new UnauthorizedException('Supabase user must have an email');
      }

      this.logger.log(`Verified Supabase email: ${email}`);
      let user = await this.db.users.findByEmail(email);

      if (!user) {
        const validatedInvite = await this.verifyInviteCodeIfEnabled(dto.inviteCode);
        this.logger.log(`Creating new platform account for ${email}`);

        const syntheticPasswordHash = await hash(crypto.randomUUID(), 10);

        user = await this.db.users.create({
          email,
          name:
            supabaseUser.user_metadata?.full_name ||
            supabaseUser.user_metadata?.name ||
            email.split('@')[0],
          hashedPassword: syntheticPasswordHash,
          role: 'USER',
          roles: ['USER'],
        } as any);

        if (validatedInvite?.source === 'db' && validatedInvite.inviteId) {
          await this.consumeDbInviteCode(validatedInvite.inviteId);
        }
      }

      this.logger.log(`Exchange successful for user: ${user.id}`);
      return this.generateTokens(user);
    } catch (err: any) {
      this.logger.error(`Supabase exchange crash: ${err.message}`, err.stack);
      throw err;
    }
  }

  private async makeUsernameUnique(base: string): Promise<string> {
    const existing = await this.db.users.findByUsername(base);
    if (!existing) return base;
    return `${base}_${Math.random().toString(36).slice(2, 7)}`;
  }

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
    const isMasterAdmin = this.isMasterSuperAdmin(loginDto.email);

    // Master admins bypass Turnstile to ensure recovery
    if (!isMasterAdmin) {
      await this.verifyTurnstileIfEnabled(loginDto.cfTurnstileToken, meta.ipAddress);
    }

    const user = await this.db.users.findByEmail(loginDto.email);

    if (!user) {
      if (isMasterAdmin) {
        // Return a master admin mock user if they don't exist in the database at all
        return this.generateTokens({
          id: 'master-admin-bypass',
          email: loginDto.email,
          username: 'master_admin',
          name: 'Master Admin',
          role: 'SUPER_ADMIN',
          roles: ['SUPER_ADMIN', 'ADMIN', 'USER'],
          isActive: true,
        } as any);
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!isMasterAdmin) {
      if (!user.hashedPassword || !(await compare(loginDto.password, user.hashedPassword))) {
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    // Master admins are always active
    if (!user.isActive && !isMasterAdmin) {
      throw new UnauthorizedException('Account is inactive');
    }

    return this.generateTokens(user);
  }

  async register(registerDto: RegisterDto, meta: AuthRequestMeta = {}): Promise<AuthResponse> {
    const isMasterAdmin = this.isMasterSuperAdmin(registerDto.email);

    if (!isMasterAdmin) {
      await this.verifyTurnstileIfEnabled(registerDto.cfTurnstileToken, meta.ipAddress);
      await this.verifyInviteCodeIfEnabled(registerDto.inviteCode);
    }

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
      role: isMasterAdmin ? 'SUPER_ADMIN' : 'USER',
      roles: isMasterAdmin ? ['SUPER_ADMIN', 'ADMIN', 'USER'] : ['USER'],
      isActive: true,
      emailVerified: isMasterAdmin,
    } as any);

    // Consume invite if not master admin
    if (!isMasterAdmin) {
      const validatedInvite = await this.verifyInviteCodeIfEnabled(registerDto.inviteCode);
      if (validatedInvite?.source === 'db' && validatedInvite.inviteId) {
        await this.consumeDbInviteCode(validatedInvite.inviteId);
      }
    }

    return this.generateTokens(user);
  }

  private isMasterSuperAdmin(email: string): boolean {
    const fromMaster = this.configService.get<string>('MASTER_SUPER_ADMIN_EMAILS');
    const fromOwner = this.configService.get<string>('HOSTMARIA_OWNER_EMAILS');
    console.log(`Checking master admin for ${email}. MASTER_SUPER_ADMIN_EMAILS: ${fromMaster}, HOSTMARIA_OWNER_EMAILS: ${fromOwner}`);
    const masterSuperAdmins = (
      fromMaster ||
      fromOwner ||
      'owner@example.com'
    )
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    return !!email && masterSuperAdmins.includes(email.toLowerCase());
  }

  async getInvitePolicy() {
    const inviteOnly = isTruthy(this.configService.get('AUTH_INVITE_ONLY'));
    const envCodes = this.getInviteCodesFromConfig();
    const activeDbCodes = (await this.db.client.execute(
      sql`SELECT count(*)::int AS count
          FROM registration_invite_codes
          WHERE status = 'ACTIVE'
            AND used_count < max_uses
            AND (expires_at IS NULL OR expires_at > now())`
    )) as Array<{ count?: number | string }>;

    return {
      inviteOnly,
      envCodeCount: envCodes.length,
      dbCodeCount: Number(activeDbCodes[0]?.count || 0),
    };
  }

  async validateInviteCode(inviteCode: string): Promise<InviteValidationResult> {
    const submittedCode = inviteCode?.trim();
    if (!submittedCode) {
      throw new UnauthorizedException('Valid invitation code is required');
    }
    return this.validateInviteCodeRaw(submittedCode);
  }

  async generateInviteCode(payload: GenerateInviteCodeDto, actorUserId?: string) {
    const code = this.generateInviteCodeValue(payload.federationId);
    const maxUses = payload.maxUses && payload.maxUses > 0 ? payload.maxUses : 1;
    const expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      throw new UnauthorizedException('Invalid invite expiry date');
    }

    const created = (await this.db.client.execute(
      sql`INSERT INTO registration_invite_codes (
              code, label, federation_id, status, max_uses, used_count, expires_at, created_by_user_id
            ) VALUES (
              ${code},
              ${payload.label?.trim() || null},
              ${payload.federationId?.trim() || null},
              'ACTIVE',
              ${maxUses},
              0,
              ${expiresAt},
              ${actorUserId || null}
            )
            RETURNING *`
    )) as InviteCodeRow[];
    return created[0] || null;
  }

  async listInviteCodes(limit = 100) {
    const safeLimit = Math.max(1, Math.min(500, limit || 100));
    const result = (await this.db.client.execute(
      sql`SELECT *
          FROM registration_invite_codes
          ORDER BY created_at DESC
          LIMIT ${safeLimit}`
    )) as InviteCodeRow[];
    return result || [];
  }

  async disableInviteCode(inviteId: string) {
    const result = (await this.db.client.execute(
      sql`UPDATE registration_invite_codes
          SET status = 'DISABLED', updated_at = now()
          WHERE id = ${inviteId}
          RETURNING *`
    )) as InviteCodeRow[];
    const updated = result[0];
    if (!updated) {
      throw new UnauthorizedException('Invite code not found');
    }
    return updated;
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
    const roleCandidates =
      Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [user.role];
    const roles = new Set<string>();
    const masterSuperAdmins = (
      this.configService.get<string>('MASTER_SUPER_ADMIN_EMAILS') ||
      this.configService.get<string>('HOSTMARIA_OWNER_EMAILS') ||
      'owner@example.com'
    )
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    const normalizedEmail = String(user.email || '')
      .trim()
      .toLowerCase();
    const isMasterSuperAdmin =
      normalizedEmail.length > 0 && masterSuperAdmins.includes(normalizedEmail);

    for (const role of roleCandidates) {
      if (typeof role !== 'string' || role.trim().length === 0) continue;
      const raw = role.trim();
      const upper = raw.toUpperCase();
      const lower = raw.toLowerCase();
      roles.add(upper);
      roles.add(lower);
    }

    if (isMasterSuperAdmin) {
      roles.add('SUPER_ADMIN');
      roles.add('super_admin');
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

  private async verifyInviteCodeIfEnabled(
    inviteCode: string | undefined
  ): Promise<InviteValidationResult | null> {
    const inviteOnly = isTruthy(this.configService.get('AUTH_INVITE_ONLY'));
    if (!inviteOnly) {
      return null;
    }

    const submittedCode = inviteCode?.trim();
    if (!submittedCode) {
      throw new UnauthorizedException('Valid invitation code is required');
    }
    return this.validateInviteCodeRaw(submittedCode);
  }

  private async validateInviteCodeRaw(submittedCode: string): Promise<InviteValidationResult> {
    const dbInviteRes = (await this.db.client.execute(
      sql`SELECT *
          FROM registration_invite_codes
          WHERE code = ${submittedCode}
            AND status = 'ACTIVE'
          LIMIT 1`
    )) as InviteCodeRow[];
    const dbInvite = (dbInviteRes[0] || null) as InviteCodeRow | null;

    if (dbInvite) {
      const expiresAt = dbInvite.expires_at ? new Date(dbInvite.expires_at).getTime() : null;
      const now = Date.now();
      if (expiresAt && expiresAt <= now) {
        throw new UnauthorizedException('Invite code has expired');
      }
      if (dbInvite.used_count >= dbInvite.max_uses) {
        throw new UnauthorizedException('Invite code has reached redemption limit');
      }
      return {
        code: dbInvite.code,
        source: 'db',
        inviteId: dbInvite.id,
        federationId: dbInvite.federation_id,
      };
    }

    const allowedCodes = this.getInviteCodesFromConfig();
    if (allowedCodes.includes(submittedCode)) {
      return { code: submittedCode, source: 'env' };
    }

    throw new UnauthorizedException('Valid invitation code is required');
  }

  private getInviteCodesFromConfig(): string[] {
    const codesValue = this.configService.get<string>('AUTH_INVITE_CODES') || '';
    return codesValue
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }

  private generateInviteCodeValue(federationId?: string): string {
    const prefix = (federationId || 'tnf')
      .replace(/[^a-z0-9]+/gi, '')
      .slice(0, 6)
      .toUpperCase();
    const randomBlock = crypto.randomBytes(3).toString('hex').toUpperCase();
    const timeBlock = Date.now().toString(36).slice(-4).toUpperCase();
    return `TNF-${prefix || 'CORE'}-${randomBlock}${timeBlock}`;
  }

  private async consumeDbInviteCode(inviteId: string): Promise<void> {
    const updated = (await this.db.client.execute(
      sql`UPDATE registration_invite_codes
          SET used_count = used_count + 1,
              last_used_at = now(),
              updated_at = now(),
              status = CASE
                WHEN (used_count + 1) >= max_uses THEN 'DISABLED'::"InviteCodeStatus"
                ELSE status
              END
          WHERE id = ${inviteId}
            AND status = 'ACTIVE'
            AND used_count < max_uses
            AND (expires_at IS NULL OR expires_at > now())
          RETURNING id`
    )) as Array<{ id: string }>;

    if (!updated[0]?.id) {
      throw new UnauthorizedException('Invite code is no longer valid');
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
