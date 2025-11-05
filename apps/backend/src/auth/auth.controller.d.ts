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
    register(registerDto: RegisterDto): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
        };
    }>;
    loginWithEmail(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
        };
    }>;
    loginWithFirebase(req: Request): Promise<{
        message: string;
    }>;
    logout(req: Request): Promise<{
        message: string;
    }>;
    googleAuth(res: Response): Promise<void>;
    googleAuthCallback(req: Request, res: Response): Promise<void>;
}
export {};
//# sourceMappingURL=auth.controller.d.ts.map