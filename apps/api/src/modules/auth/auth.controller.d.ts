import { AuthService } from './auth.service';
import { Request, Response } from 'express';
declare class RegisterDto {
    email: string;
    password: string;
    name: string;
}
declare class LoginDto {
    email: string;
    password: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto, req: Request): Promise<any>;
    loginWithEmail(loginDto: LoginDto, req: Request): Promise<any>;
    loginWithFirebase(req: Request): Promise<any>;
    logout(req: Request): Promise<any>;
    googleAuth(res: Response): Promise<void>;
    googleAuthCallback(req: Request, res: Response): Promise<void>;
}
export {};
//# sourceMappingURL=auth.controller.d.ts.map