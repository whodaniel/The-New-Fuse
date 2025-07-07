import { AuthService } from './auth.service';
import { Request, Response } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(req: Request): Promise<any>;
    logout(req: Request): Promise<any>;
    googleAuth(res: Response): Promise<void>;
    googleAuthCallback(req: Request, res: Response): Promise<void>;
}
