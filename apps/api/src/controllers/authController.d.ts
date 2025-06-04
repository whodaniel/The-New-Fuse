import { Request, Response } from 'express';
declare class AuthController {
    register(req: Request, res: Response): Promise<void>;
}
export declare const authController: AuthController;
export {};
