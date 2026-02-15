import { Controller, Post, Body, UseGuards, Get, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { Request, Response } from 'express';
import { IsEmail, IsString } from 'class-validator';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from '../dto/register.dto';

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

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
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow - Passport handles the redirect
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/google/callback?token=${token}`);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // Initiates GitHub OAuth flow - Passport handles the redirect
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/github/callback?token=${token}`);
  }

  @Post('unstoppable-domains')
  async unstoppableDomainsAuth(@Body() body: { domain: string; walletAddress: string; walletType?: string }) {
    const { domain, walletAddress, walletType } = body;

    // Validate input
    if (!domain || !walletAddress) {
      throw new Error('Domain and wallet address are required');
    }

    // Find or create user with Unstoppable Domain
    const user = await this.authService.findOrCreateUnstoppableDomainsUser(
      domain,
      walletAddress,
      walletType,
    );

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email || domain,
      role: user.role || 'user',
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email || domain,
        name: user.name || domain,
        role: user.role || 'user',
        photoURL: user.photoURL,
      },
    };
  }
}
