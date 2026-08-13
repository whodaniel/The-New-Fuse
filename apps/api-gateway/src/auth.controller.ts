import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {
    console.log('AuthController initialized');
  }

  @Get('status')
  async status() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Post('register')
  async register(@Body() body: any) {
    return { message: 'Registered successfully' };
  }

  @Post('login')
  async login(@Body() body: any) {
    return { message: 'Login successful', token: 'fake-jwt' };
  }

  @Post('refresh')
  async refresh(@Body() body: any) {
    return { message: 'Refresh token successful', token: 'fake-jwt-refresh' };
  }

  @Get('me')
  async me(@Req() req: any) {
    return { userId: 'fake-user-id', email: 'fake@email.com' };
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: any) {
    return { message: 'Email verified' };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: any) {
    return { message: 'Forgot password email sent' };
  }

  @Post('reset-password')
  async resetPassword(@Body() body: any) {
    return { message: 'Reset password email sent' };
  }

  @Post('logout')
  async logout(@Req() req: any) {
    return { message: 'Logged out successfully' };
  }

  @Post('validate')
  async validate(@Req() req: any) {
    return { message: 'Token valid' };
  }
}
