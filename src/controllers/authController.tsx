import { Request, Response } from "express";
import { Injectable } from "@nestjs/common";
import { AuthService } from '../services/authService.js';

@Injectable()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // login method
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  // register method
  async register(req: Request, res: Response): Promise<void> {
    try {
      const userData = req.body;
      const result = await this.authService.register(userData);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  // logout method
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      await this.authService.logout(token || '');
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  // check session
  async checkSession(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        res.status(401).json({ message: 'No token provided' });
        return;
      }
      const session = await this.authService.validateSession(token);
      res.json(session);
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  }

  // initiate password reset
  async initiatePasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      await this.authService.initiatePasswordReset(email);
      res.status(200).json({ message: 'Password reset email sent' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  // verify email
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;
      await this.authService.verifyEmail(token);
      res.status(200).json({ message: 'Email verified successfully' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}
