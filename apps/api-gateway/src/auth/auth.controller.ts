import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { Request } from 'express';
import { GatewayAuthGuard } from './gateway-auth.guard';
import { GatewayAuthService } from './gateway-auth.service';

class LoginDto {
  @IsEmail()
  email: string = '';

  @IsString()
  password: string = '';

  @IsString()
  @IsOptional()
  cfTurnstileToken?: string;
}

class RegisterDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  email: string = '';

  @IsString()
  @MinLength(8)
  password: string = '';

  @IsString()
  @IsOptional()
  cfTurnstileToken?: string;
}

class RefreshDto {
  @IsString()
  @IsOptional()
  refreshToken?: string;

  @IsString()
  @IsOptional()
  refresh_token?: string;
}

class GoogleAuthDto {
  @IsString()
  idToken: string = '';
}

class SupabaseAuthDto {
  @IsString()
  accessToken: string = '';
}

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: GatewayAuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ description: 'Login credentials' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(@Body() body: LoginDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket?.remoteAddress;
    return this.authService.login(body.email, body.password, body.cfTurnstileToken, ipAddress);
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiBody({ description: 'Registration data' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  async register(@Body() body: RegisterDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket?.remoteAddress;
    return this.authService.register(
      body.name,
      body.email,
      body.password,
      body.cfTurnstileToken,
      ipAddress
    );
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh authentication token' })
  @ApiBody({ description: 'Refresh token payload' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  async refresh(@Body() body: RefreshDto) {
    const refreshToken = body.refreshToken || body.refresh_token;
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }
    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  @UseGuards(GatewayAuthGuard)
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  logout() {
    return {
      success: true,
      message: 'Successfully logged out',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('me')
  @UseGuards(GatewayAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user details' })
  @ApiResponse({ status: 200, description: 'User details retrieved successfully' })
  async getMe(@Req() req: any) {
    const user = await this.authService.me(req.user.id);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  @Post('google')
  @ApiOperation({ summary: 'Google sign-in with Firebase ID token' })
  async googleAuth(@Body() body: GoogleAuthDto) {
    if (!body.idToken) {
      throw new BadRequestException('Google idToken is required');
    }
    return this.authService.googleAuth(body.idToken);
  }

  @Post('supabase')
  @ApiOperation({ summary: 'Exchange Supabase access token for TNF JWT' })
  async supabaseAuth(@Body() body: SupabaseAuthDto) {
    if (!body.accessToken) {
      throw new BadRequestException('Supabase accessToken is required');
    }
    return this.authService.supabaseAuth(body.accessToken);
  }

  @Get('session')
  @ApiOperation({ summary: 'Get lightweight auth session status' })
  @ApiResponse({ status: 200, description: 'Session payload' })
  async session(@Req() req: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { authenticated: false, user: null };
    }

    const token = authHeader.slice(7);
    try {
      const user = await this.authService.validateToken(token);
      return {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          role: user.role,
          roles: user.roles,
        },
      };
    } catch {
      return { authenticated: false, user: null };
    }
  }
}
