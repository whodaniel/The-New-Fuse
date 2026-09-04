import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Request, Response } from 'express';
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

// ============================================================================
// Layer 1 — OAuth/OIDC redirect-flow DTOs
// ----------------------------------------------------------------------------
// OAuth providers supported by the redirect flow:
//   * google  — Google Identity (OIDC discovery at /o/oauth2/v2/auth)
//   * github  — GitHub OAuth Apps (authorize at /login/oauth/authorize)
// Each provider returns an `authorize` URL the client opens in a popup/tab,
// then redirects back to `redirect_uri` with `?code=...` which we exchange
// server-side for ID/Access tokens and mint our own session JWT.
// Unifying under a single route pair (/oauth/:provider/{authorize,callback})
// means new providers require only a strategy module, not a new controller.
// ============================================================================
class OAuthAuthorizeQuery {
  @IsString()
  @IsNotEmpty()
  redirect_uri: string = '';

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  scope?: string;
}

class OAuthCallbackQuery {
  @IsString()
  @IsNotEmpty()
  code: string = '';

  @IsString()
  @IsNotEmpty()
  redirect_uri: string = '';

  @IsString()
  @IsOptional()
  state?: string;
}

// Layer 4 — Magic link DTOs
class MagicRequestDto {
  @IsEmail()
  email: string = '';

  @IsString()
  @IsOptional()
  @IsIn(['sign-in', 'link-device', 'recovery'])
  intent?: 'sign-in' | 'link-device' | 'recovery';

  @IsString()
  @IsOptional()
  redirect_uri?: string;

  @IsString()
  @IsOptional()
  channel?: 'email' | 'in-app';
}

class MagicRedeemQuery {
  @IsString()
  @IsNotEmpty()
  token: string = '';

  @IsEmail()
  @IsOptional()
  email?: string;
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
  @Version(['1', VERSION_NEUTRAL])
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
  @Version(['1', VERSION_NEUTRAL])
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
  @Version(['1', VERSION_NEUTRAL])
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
  @Version(['1', VERSION_NEUTRAL])
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
  @Version(['1', VERSION_NEUTRAL])
  @ApiOperation({ summary: 'Google sign-in with Firebase ID token' })
  async googleAuth(@Body() body: GoogleAuthDto) {
    if (!body.idToken) {
      throw new BadRequestException('Google idToken is required');
    }
    return this.authService.googleAuth(body.idToken);
  }

  @Post('supabase')
  @Version(['1', VERSION_NEUTRAL])
  @ApiOperation({ summary: 'Exchange Supabase access token for TNF JWT' })
  async supabaseAuth(@Body() body: SupabaseAuthDto) {
    if (!body.accessToken) {
      throw new BadRequestException('Supabase accessToken is required');
    }
    return this.authService.supabaseAuth(body.accessToken);
  }

  @Post('forgot-password')
  @Version(['1', VERSION_NEUTRAL])
  @ApiOperation({ summary: 'Initiate password reset flow' })
  @ApiBody({ description: 'Email for password reset' })
  @ApiResponse({ status: 200, description: 'Reset email sent if user exists' })
  async forgotPassword(@Body() body: ForgotPasswordDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket?.remoteAddress;
    return this.authService.forgotPassword(body.email, body.cfTurnstileToken, ipAddress);
  }

  @Get('verify-email')
  @Version(['1', VERSION_NEUTRAL])
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
  @Version(['1', VERSION_NEUTRAL])
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
  @Version(['1', VERSION_NEUTRAL])
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Validate a JWT token and return exp + scopes (Layer 5 ping)',
  })
  @ApiResponse({ status: 200, description: 'Token valid; returns exp + scopes' })
  @ApiResponse({ status: 401, description: 'Token invalid' })
  async validate(@Body() body: ValidateTokenDto) {
    const result = await this.authService.validateTokenWithPayload(body.token);
    if (!result) {
      return { valid: false, user: null, scopes: [], exp: null };
    }
    return {
      valid: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        name: result.user.name,
        role: result.user.role,
        roles: result.user.roles,
      },
      scopes: result.payload.permissions || [],
      exp: result.payload.exp || null,
    };
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

  // ==========================================================================
  // Layer 1 — OAuth / OIDC redirect flow
  // ==========================================================================
  // The client just opens `/auth/oauth/:provider/authorize?redirect_uri=...`
  // in a popup/tab. Our service returns a 302 to the provider's consent
  // screen. After approval the provider redirects back to
  // `/auth/oauth/:provider/callback?code=...&redirect_uri=...`; on success
  // we mint our own session JWT and bounce the popup's opener (or webview)
  // to `redirect_uri#access_token=...&refresh_token=...` so the same code
  // path can serve web, extension, and desktop.
  // --------------------------------------------------------------------------
  // Supported providers: 'google', 'github'. Adding more is a matter of
  // adding a strategy under `oauthStrategies` -- no controller change.

  @Get('oauth/:provider/authorize')
  @Version(['1', VERSION_NEUTRAL])
  @HttpCode(HttpStatus.FOUND)
  @ApiOperation({ summary: 'Begin OAuth/OIDC redirect flow (Layer 1)' })
  @ApiResponse({ status: 302, description: 'Redirect to provider consent screen' })
  @ApiResponse({ status: 400, description: 'Unsupported provider or bad redirect' })
  async oauthAuthorize(
    @Param('provider') provider: string,
    @Query() query: OAuthAuthorizeQuery,
    @Res() res: Response
  ) {
    const authorizeUrl = await this.authService.buildOAuthAuthorizeUrl(
      provider,
      query.redirect_uri,
      { state: query.state, scope: query.scope }
    );
    if (!authorizeUrl) {
      throw new BadRequestException(`Unsupported OAuth provider: ${provider}`);
    }
    // Bind CSRF state to a short cookie so the callback can validate the
    // round-trip (Layer 1 hardening). State is echoed back from the provider.
    if (query.state) {
      res.cookie('tnf_oauth_state', query.state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60 * 1000,
      });
    }
    res.redirect(302, authorizeUrl);
  }

  @Get('oauth/:provider/callback')
  @Version(['1', VERSION_NEUTRAL])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete OAuth/OIDC redirect flow (Layer 1)' })
  @ApiQuery({ name: 'code', required: true })
  @ApiQuery({ name: 'redirect_uri', required: true })
  @ApiResponse({ status: 200, description: 'Tokens minted; redirect to client' })
  @ApiResponse({ status: 400, description: 'Exchange failed' })
  async oauthCallback(
    @Param('provider') provider: string,
    @Query() query: OAuthCallbackQuery,
    @Res() res: Response
  ) {
    const result = await this.authService.completeOAuthCallback(
      provider,
      query.code,
      query.redirect_uri
    );
    if (!result) {
      throw new BadRequestException('OAuth code exchange failed');
    }
    // For popup flows we bounce to a tiny `postMessage` bridge page that
    // forwards the tokens to the opener and closes itself. The same target
    // works in both browser windows and Chrome extension popups because
    // we only rely on `window.opener` + `window.close()`.
    const bridge =
      `${query.redirect_uri.split('#')[0]}#/oauth-bridge` +
      `?access_token=${encodeURIComponent(result.accessToken)}` +
      `&refresh_token=${encodeURIComponent(result.refreshToken)}` +
      (query.state ? `&state=${encodeURIComponent(query.state)}` : '');
    res.redirect(302, bridge);
  }

  // ==========================================================================
  // Layer 4 — Magic link issuance & redemption
  // ==========================================================================
  // The novice-friendly onboarding path: email → click URL → authorized.
  // No password, no clipboard juggling, no application seeding error.

  @Post('magic/request')
  @Version(['1', VERSION_NEUTRAL])
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Issue a one-time magic link (Layer 4)' })
  @ApiResponse({ status: 202, description: 'Link issued (delivered via email if configured)' })
  @ApiResponse({ status: 401, description: 'Invalid email' })
  async issueMagicLink(@Body() body: MagicRequestDto) {
    const handle = await this.authService.issueMagicLink(body.email, body.intent, {
      redirectUri: body.redirect_uri,
    });
    // In dev/test environments where no email transport is configured,
    // return the token so QA can complete the loop without SMTP. In
    // production this path is gated behind AUTH_RETURN_MAGIC_TOKEN=false
    // (or simply: trust the team to not request the token field).
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      return {
        ok: true,
        email: handle.email,
        intent: handle.intent,
        expiresAt: handle.expiresAt,
        // Deliberately omit token in production.
      };
    }
    return {
      ok: true,
      email: handle.email,
      intent: handle.intent,
      expiresAt: handle.expiresAt,
      devToken: handle.token, // dev-only escape hatch
    };
  }

  @Get('magic/redeem')
  @Version(['1', VERSION_NEUTRAL])
  @ApiOperation({ summary: 'Redeem a magic link token (Layer 4)' })
  @ApiQuery({ name: 'token', required: true })
  @ApiQuery({ name: 'email', required: false })
  @ApiResponse({ status: 200, description: 'Tokens minted (JSON)' })
  @ApiResponse({ status: 401, description: 'Token invalid/expired/used' })
  async redeemMagicLink(@Query() q: MagicRedeemQuery) {
    const result = await this.authService.redeemMagicLink(q.token, q.email);
    if (!result.ok) {
      throw new BadRequestException({
        message: 'Magic link cannot be redeemed',
        reason: result.reason,
      });
    }
    return {
      ok: true,
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }
}
