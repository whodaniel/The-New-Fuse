// src/controllers/auth.controller.ts
import { injectable, inject } from "inversify";
import type { TYPES } from '../core/di/types.js';
import { Request, Response, NextFunction } from "express";
import { User } from '../types/auth.js';

@injectable()
export class AuthController {
  constructor(
    @inject(TYPES.AuthService) private authService: any,
    @inject(TYPES.Logger) private logger: any,
  ) {}

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      res.status(200).json(result);
    } catch(error: unknown) {
      this.logger.error("Login failed", { error });
      res.status(401).json({ error: "Authentication failed" });
    }
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const userData = req.body;
      const user = await this.authService.register(userData);
      res.status(201).json({ user });
    } catch(error: unknown) {
      this.logger.error("Registration failed", { error });
      res.status(400).json({ error: "Registration failed" });
    }
  }
}

// Export an instance for compatibility with existing code
export const authController = new AuthController(null, console);
