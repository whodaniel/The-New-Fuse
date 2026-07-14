import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Request } from 'express';
import { GatewayAuthGuard } from './gateway-auth.guard';
import { GatewayAuthService } from './gateway-auth.service';

class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

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

class ForgotPasswordDto {
  @IsEmail()
  email: string = '';

  @IsString()
  @IsOptional()
  cfTurnstileToken?: string;
}

class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string = '';

  @IsString()
  @MinLength(8)
  newPassword: string = '';

  @IsString()
  @MinLength(8)
  confirmPassword: string = '';
}

class ValidateTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string = '';
}

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: GatewayAuthService) {}

  @Post('login')
  @Version(['1', VERSION_NEUTRAL])
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
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  logout() {
    // GatewayAuthGuard already verified the user's identity and JWT
    // This endpoint is a no-op; actual cleanup happens client-side
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

  @Post('forgot-password')
  @ApiOperation({ summary: 'Initiate password reset flow' })
  @ApiBody({ description: 'Email for password reset' })
  @ApiResponse({ status: 200, description: 'Reset email sent if user exists' })
  async forgotPassword(@Body() body: ForgotPasswordDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket?.remoteAddress;
    return this.authService.forgotPassword(body.email, body.cfTurnstileToken, ipAddress);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email using token after registration' })
  @ApiResponse({ status: 302, description: 'Redirect to success page after verification' })
  async verifyEmail() {
    // Placeholder for email verification redirect logic
    // Implementation can mean rendering a React SPA route; return helpful object here
    return {
      success: true,
      message: 'Email verification initiated. Redirect to application to complete.',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Complete password reset using token' })
  @ApiBody({ description: 'Reset token and new password' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  async resetPassword(@Body() body: ResetPasswordDto) {
    // Validate dto
    if (body.newPassword !== body.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Get('status')
  @Version('1')
  @ApiOperation({ summary: 'Get lightweight auth session status' })
  @ApiResponse({ status: 200, description: 'Session payload' })
  async status(@Req() req: any) {
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

  @Post('validate')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Validate a JWT token without user retrieval' })
  @ApiResponse({ status: 200, description: 'Token valid' })
  @ApiResponse({ status: 401, description: 'Token invalid' })
  async validate(@Body() body: ValidateTokenDto) {
    try {
      const payload = await this.authService.validateToken(body.token);
      return { valid: true, payload };
    } catch {
      return { valid: false, payload: null };
    }
  }

  @Get('session')
  @Version('1')
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
