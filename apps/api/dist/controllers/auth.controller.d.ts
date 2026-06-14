import { Request } from 'express';
import { GenerateInviteCodeDto, LoginDto, RegisterDto, SupabaseAuthDto } from '../dtos/auth.dto';
import { AuthService } from '../services/auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto, req?: Request): Promise<import("../dtos/auth.dto").TokenDto & {
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
    }>;
    register(registerDto: RegisterDto, req?: Request): Promise<import("../dtos/auth.dto").TokenDto & {
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
    }>;
    supabaseExchange(dto: SupabaseAuthDto): Promise<import("../dtos/auth.dto").TokenDto & {
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
    }>;
    invitePolicy(): Promise<{
        inviteOnly: boolean;
        envCodeCount: number;
        dbCodeCount: number;
    }>;
    generateInviteCode(dto: GenerateInviteCodeDto, req: any): Promise<{
        id: string;
        code: string;
        label: string | null;
        federation_id: string | null;
        status: "ACTIVE" | "DISABLED";
        max_uses: number;
        used_count: number;
        expires_at: Date | string | null;
        last_used_at: Date | string | null;
        created_by_user_id: string | null;
        metadata: unknown;
        created_at: Date | string;
        updated_at: Date | string;
    }>;
    listInviteCodes(req: any): Promise<{
        id: string;
        code: string;
        label: string | null;
        federation_id: string | null;
        status: "ACTIVE" | "DISABLED";
        max_uses: number;
        used_count: number;
        expires_at: Date | string | null;
        last_used_at: Date | string | null;
        created_by_user_id: string | null;
        metadata: unknown;
        created_at: Date | string;
        updated_at: Date | string;
    }[]>;
    disableInviteCode(inviteId: string, req: any): Promise<{
        id: string;
        code: string;
        label: string | null;
        federation_id: string | null;
        status: "ACTIVE" | "DISABLED";
        max_uses: number;
        used_count: number;
        expires_at: Date | string | null;
        last_used_at: Date | string | null;
        created_by_user_id: string | null;
        metadata: unknown;
        created_at: Date | string;
        updated_at: Date | string;
    }>;
    refresh(body: {
        refreshToken?: string;
        refresh_token?: string;
    }): Promise<import("../dtos/auth.dto").TokenDto & {
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
    }>;
    logout(): Promise<{
        success: boolean;
        message: string;
        timestamp: string;
    }>;
    me(req: any): Promise<{
        id: any;
        email: any;
        username: any;
        name: any;
        role: any;
        roles: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    session(req: Request): Promise<{
        authenticated: boolean;
        user: null;
    } | {
        authenticated: boolean;
        user: {
            id: string;
            email: string;
            username: string | null;
            name: string | null;
            role: "USER" | "ADMIN" | "SUPER_ADMIN" | "AGENCY_OWNER" | "AGENCY_ADMIN" | "AGENCY_MANAGER" | "AGENT_OPERATOR";
            roles: string[];
        };
    }>;
    private assertAdmin;
}
//# sourceMappingURL=auth.controller.d.ts.map