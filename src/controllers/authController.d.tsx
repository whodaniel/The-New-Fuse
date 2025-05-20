import { Request, Response } from "express";
export declare class AuthController {
  private readonly authService;
  constructor(authService: AuthService);
  login(req: Request, res: Response): Promise<void>;
  register(req: Request, res: Response): Promise<void>;
  logout(req: Request, res: Response): Promise<void>;
  checkSession(req: Request, res: Response): Promise<void>;
  initiatePasswordReset(req: Request, res: Response): Promise<void>;
  verifyEmail(req: Request, res: Response): Promise<void>;
}
