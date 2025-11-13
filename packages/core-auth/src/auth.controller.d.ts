import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import type { LoginDto, RegisterDto, RefreshTokenDto, AuthResponse } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<AuthResponse>;
    login(loginDto: LoginDto): Promise<AuthResponse>;
    refresh(refreshTokenDto: RefreshTokenDto): Promise<AuthResponse>;
    logout(): Promise<{
        message: string;
    }>;
    googleLogin(): Promise<void>;
    googleCallback(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=auth.controller.d.ts.map