import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { IsEmail, IsString } from 'class-validator';
import { Request, Response } from 'express';
import { RegisterDto } from '../dto/register.dto';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

@Controller('auth')
@SkipThrottle() // Skip global rate limiting for auth controller, apply specific limits
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 registrations per minute
  async register(@Body() registerDto: RegisterDto) {
    const { email, password, name } = registerDto;
    return this.authService.register(email, password, name);
  }

  @Post('verify-email')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 verifications per minute
  async verifyEmail(@Body('token') token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 resend attempts per minute
  async resendVerification(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    return this.authService.resendVerification(email);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 login attempts per minute
  async loginWithEmail(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
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

  @Get('me')
  async getCurrentUser(@Req() req: Request) {
    return this.authService.resolveCurrentUserFromAuthHeader(req.headers.authorization);
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
  async unstoppableDomainsAuth(
    @Body()
    body: {
      domain: string;
      walletAddress: string;
      walletType?: string;
      message: string;
      signature: string;
    }
  ) {
    const { domain, walletAddress, walletType, message, signature } = body;

    // Validate input
    if (!domain || !walletAddress) {
      throw new BadRequestException('Domain and wallet address are required');
    }

    // Validate signature presence
    if (!message || !signature) {
      throw new BadRequestException('Message and signature are required for authentication');
    }

    // Find or create user with Unstoppable Domain
    const user = await this.authService.findOrCreateUnstoppableDomainsUser(
      domain,
      walletAddress,
      message,
      signature,
      walletType
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
      },
    };
  }
}
