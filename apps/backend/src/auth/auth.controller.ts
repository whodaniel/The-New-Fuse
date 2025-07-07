import { Controller, Post, Body, UseGuards, Get, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { Request, Response } from 'express';
import { IsEmail, IsString, MinLength } from 'class-validator';

class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;
}

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const { email, password, name } = registerDto;
    return this.authService.register(email, password, name);
  }

  @Post('login')
  async loginWithEmail(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('login/firebase')
  @UseGuards(FirebaseAuthGuard)
  async loginWithFirebase(@Req() req: Request) {
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