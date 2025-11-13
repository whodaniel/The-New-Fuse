import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto, request: Request): Promise<import("./auth.service").LoginResponse>;
    login(loginDto: LoginDto, request: Request): Promise<import("./auth.service").LoginResponse>;
    refresh(refreshToken: string, request: Request): Promise<import("./auth.service").AuthTokens>;
    logout(user: {
        userId: string;
    }, request: Request): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=auth.controller.d.ts.map