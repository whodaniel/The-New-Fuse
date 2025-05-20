import { Request, Response } from "express";
export declare class AuthController {
  private authService;
  private logger;
  constructor(authService: unknown, logger: unknown);
  login(req: Request, res: Response): Promise<void>;
  register(req: Request, res: Response): Promise<void>;
}
export declare const authController: AuthController;
