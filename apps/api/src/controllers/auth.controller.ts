import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { hasAuthorizationLevel } from '../auth/auth-policy';
import { GenerateInviteCodeDto, LoginDto, RegisterDto } from '../dtos/auth.dto';
import { AuthGuard } from '../guards/auth.guard';
import { AuthService } from '../services/auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(@Body() loginDto: LoginDto, @Req() req?: Request) {
    const ipAddress = req?.ip || req?.socket?.remoteAddress;
    return this.authService.login(loginDto, { ipAddress });
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  async register(@Body() registerDto: RegisterDto, @Req() req?: Request) {
    const ipAddress = req?.ip || req?.socket?.remoteAddress;
    return this.authService.register(registerDto, { ipAddress });
  }

  @Get('invite-policy')
  @ApiOperation({ summary: 'Get invite-only registration policy state' })
  @ApiResponse({ status: 200, description: 'Invite policy payload' })
  async invitePolicy() {
    return this.authService.getInvitePolicy();
  }

  @Post('invite-codes/generate')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Generate a registration invite code (admin only)' })
  @ApiResponse({ status: 201, description: 'Invite code generated' })
  async generateInviteCode(@Body() dto: GenerateInviteCodeDto, @Req() req: any) {
    this.assertAdmin(req?.user);
    return this.authService.generateInviteCode(dto, req?.user?.id);
  }

  @Get('invite-codes')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'List registration invite codes (admin only)' })
  @ApiResponse({ status: 200, description: 'Invite code list' })
  async listInviteCodes(@Req() req: any) {
    this.assertAdmin(req?.user);
    return this.authService.listInviteCodes();
  }

  @Post('invite-codes/:inviteId/disable')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Disable registration invite code (admin only)' })
  @ApiResponse({ status: 200, description: 'Invite code disabled' })
  async disableInviteCode(@Param('inviteId') inviteId: string, @Req() req: any) {
    this.assertAdmin(req?.user);
    if (!inviteId) throw new BadRequestException('Invite ID is required');
    return this.authService.disableInviteCode(inviteId);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  async refresh(@Body() body: { refreshToken?: string; refresh_token?: string }) {
    const refreshToken = body?.refreshToken || body?.refresh_token;
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }
    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout() {
    await this.authService.logout();
    return {
      success: true,
      message: 'Successfully logged out',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  async me(@Req() req: any) {
    const currentUser = req.user;
    return {
      id: currentUser.id,
      email: currentUser.email,
      username: currentUser.username,
      name: currentUser.name,
      role: currentUser.role,
      roles: currentUser.roles,
      isActive: currentUser.isActive,
      createdAt: currentUser.createdAt,
      updatedAt: currentUser.updatedAt,
    };
  }

  @Get('session')
  @ApiOperation({ summary: 'Get lightweight auth session status' })
  @ApiResponse({ status: 200, description: 'Session payload' })
  async session(@Req() req: Request) {
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

  private assertAdmin(user: any) {
    const isAdmin = hasAuthorizationLevel(user || {}, 'admin');
    if (!isAdmin) throw new ForbiddenException('Admin access required');
  }
}
