import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { hasAuthorizationLevel } from '../auth/auth-policy';
import { GenerateInviteCodeDto, LoginDto, RegisterDto, SupabaseAuthDto } from '../dtos/auth.dto';
import { AuthGuard } from '../guards/auth.guard';
import { AuthLevel, RequireAuthLevel } from '../guards/secure-auth.guard';
import { AuthService } from '../services/auth.service';

const ACCESS_COOKIE = 'tnf_access_token';
const REFRESH_COOKIE = 'tnf_refresh_token';

function setAuthCookies(res: Response, tokens: { accessToken?: string; refreshToken?: string }) {
  const secure = process.env.NODE_ENV === 'production';
  const common = {
    httpOnly: true,
    secure,
    sameSite: (secure ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
  };
  if (tokens.accessToken) {
    res.cookie(ACCESS_COOKIE, tokens.accessToken, { ...common, maxAge: 15 * 60 * 1000 });
  }
  if (tokens.refreshToken) {
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, { ...common, maxAge: 7 * 24 * 60 * 60 * 1000 });
  }
}

function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @RequireAuthLevel(AuthLevel.PUBLIC)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const ipAddress = req?.ip || req?.socket?.remoteAddress;
    const result = await this.authService.login(loginDto, { ipAddress });
    setAuthCookies(res, {
      accessToken:
        (result as any).accessToken || (result as any).access_token || (result as any).token,
      refreshToken: (result as any).refreshToken || (result as any).refresh_token,
    });
    return result;
  }

  @Post('register')
  @RequireAuthLevel(AuthLevel.PUBLIC)
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const ipAddress = req?.ip || req?.socket?.remoteAddress;
    const result = await this.authService.register(registerDto, { ipAddress });
    setAuthCookies(res, {
      accessToken:
        (result as any).accessToken || (result as any).access_token || (result as any).token,
      refreshToken: (result as any).refreshToken || (result as any).refresh_token,
    });
    return result;
  }

  @Post('supabase')
  @RequireAuthLevel(AuthLevel.PUBLIC)
  @ApiOperation({ summary: 'Exchange Supabase token for platform JWT' })
  @ApiResponse({ status: 200, description: 'Exchange successful' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async supabaseExchange(@Body() dto: SupabaseAuthDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.supabaseExchange(dto);
    setAuthCookies(res, {
      accessToken:
        (result as any).accessToken || (result as any).access_token || (result as any).token,
      refreshToken: (result as any).refreshToken || (result as any).refresh_token,
    });
    return result;
  }

  @Get('invite-policy')
  @RequireAuthLevel(AuthLevel.PUBLIC)
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
  @RequireAuthLevel(AuthLevel.PUBLIC)
  @ApiOperation({ summary: 'Refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  async refresh(
    @Body() body: { refreshToken?: string; refresh_token?: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken =
      body?.refreshToken ||
      body?.refresh_token ||
      (req.cookies?.[REFRESH_COOKIE] as string | undefined);
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }
    const result = await this.authService.refresh(refreshToken);
    setAuthCookies(res, {
      accessToken:
        (result as any).accessToken || (result as any).access_token || (result as any).token,
      refreshToken: (result as any).refreshToken || (result as any).refresh_token,
    });
    return result;
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Res({ passthrough: true }) res: Response) {
    await this.authService.logout();
    clearAuthCookies(res);
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
      displayName: currentUser.name || currentUser.username,
      role: currentUser.role,
      roles: currentUser.roles,
      isActive: currentUser.isActive,
      createdAt: currentUser.createdAt,
      updatedAt: currentUser.updatedAt,
      preferences: currentUser.preferences || {
        theme: 'system',
        notifications: true,
      },
    };
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'User profile updated successfully' })
  async updateMe(
    @Req() req: any,
    @Body()
    body: {
      displayName?: string;
      bio?: string;
      preferences?: { theme?: 'light' | 'dark' | 'system'; notifications?: boolean };
    }
  ) {
    return this.authService.updateCurrentUserProfile(req.user.id, body);
  }

  @Get('session')
  @RequireAuthLevel(AuthLevel.PUBLIC)
  @ApiOperation({ summary: 'Get lightweight auth session status' })
  @ApiResponse({ status: 200, description: 'Session payload' })
  async session(@Req() req: Request) {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.[ACCESS_COOKIE] as string | undefined;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;

    if (!token) {
      return { authenticated: false, user: null };
    }

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
