import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService, User } from '@the-new-fuse/database';
import { GenerateInviteCodeDto, LoginDto, RegisterDto, SupabaseAuthDto, TokenDto } from '../dtos/auth.dto';
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
export declare class AuthService {
    private readonly db;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    private supabase;
    constructor(db: DatabaseService, jwtService: JwtService, configService: ConfigService);
    supabaseExchange(dto: SupabaseAuthDto): Promise<AuthResponse>;
    private makeUsernameUnique;
    validateToken(token: string): Promise<User>;
    login(loginDto: LoginDto, meta?: AuthRequestMeta): Promise<AuthResponse>;
    register(registerDto: RegisterDto, meta?: AuthRequestMeta): Promise<AuthResponse>;
    private isMasterSuperAdmin;
    getInvitePolicy(): Promise<{
        inviteOnly: boolean;
        envCodeCount: number;
        dbCodeCount: number;
    }>;
    validateInviteCode(inviteCode: string): Promise<InviteValidationResult>;
    generateInviteCode(payload: GenerateInviteCodeDto, actorUserId?: string): Promise<InviteCodeRow>;
    listInviteCodes(limit?: number): Promise<InviteCodeRow[]>;
    disableInviteCode(inviteId: string): Promise<InviteCodeRow>;
    refresh(refreshToken: string): Promise<AuthResponse>;
    logout(): Promise<void>;
    getCurrentUser(userId: string): Promise<User | null>;
    updateCurrentUserProfile(userId: string, profileData: {
        displayName?: string;
        bio?: string;
        preferences?: {
            theme?: 'light' | 'dark' | 'system';
            notifications?: boolean;
        };
    }): Promise<{
        id: string;
        email: string;
        username: string | null;
        name: string | null;
        displayName: string | null;
        bio: {};
        role: "USER" | "ADMIN" | "SUPER_ADMIN" | "AGENCY_OWNER" | "AGENCY_ADMIN" | "AGENCY_MANAGER" | "AGENT_OPERATOR";
        roles: string[];
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        preferences: {};
    }>;
    private verifyTurnstileIfEnabled;
    private generateTokens;
    private resolvePermissions;
    private resolveRoles;
    private verifyInviteCodeIfEnabled;
    private validateInviteCodeRaw;
    private getInviteCodesFromConfig;
    private generateInviteCodeValue;
    private consumeDbInviteCode;
    private buildDisplayName;
    private sanitizeUsername;
    private generateUniqueUsername;
    private resolveTenantIdClaim;
}
export {};
//# sourceMappingURL=auth.service.d.ts.map