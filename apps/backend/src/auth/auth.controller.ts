import { Controller, Post, Body, UseGuards, Get, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { FirebaseAuthGuard } from './firebase-auth.guard.js';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(FirebaseAuthGuard)
  async login(@Req() req: Request) {
    const firebaseToken = req.headers.authorization?.split('Bearer ')[1];
    return this.authService.authenticate(firebaseToken);
  }

  @Post('logout')
  @UseGuards(FirebaseAuthGuard)
  async logout(@Req() req: Request) {
    const token = req.headers.authorization?.split('Bearer ')[1];
    return this.authService.logout(token);
  }

  @Get('google')
  async googleAuth(@Res() res: Response) {
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/google-callback`;
    res.redirect(redirectUrl);
  }

  @Get('google/callback')
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    // Handle Google OAuth callback
    // This will be implemented when we set up Google OAuth
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
}