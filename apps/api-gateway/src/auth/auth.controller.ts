/**
 * Authentication Controller
 * Proxies authentication requests to backend services
 */

import {
  Controller,
  Post,
  Body,
  Headers,
  Res,
  HttpStatus,
  Version,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly proxyService: ProxyService) {}

  @Post('login')
  @Version('1')
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ description: 'Login credentials' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response,
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'backend',
        '/api/auth/login',
        'POST',
        headers,
        body
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Authentication service unavailable',
        error: error.message,
      });
    }
  }

  @Post('register')
  @Version('1')
  @ApiOperation({ summary: 'User registration' })
  @ApiBody({ description: 'Registration data' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'Invalid registration data' })
  async register(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response,
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'backend',
        '/api/auth/register',
        'POST',
        headers,
        body
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Authentication service unavailable',
        error: error.message,
      });
    }
  }

  @Post('refresh')
  @Version('1')
  @ApiOperation({ summary: 'Refresh authentication token' })
  @ApiBody({ description: 'Refresh token data' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response,
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'backend',
        '/api/auth/refresh',
        'POST',
        headers,
        body
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Authentication service unavailable',
        error: error.message,
      });
    }
  }

  @Post('logout')
  @Version('1')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @Headers() headers: Record<string, string>,
    @Res() res: Response,
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'backend',
        '/api/auth/logout',
        'POST',
        headers
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Authentication service unavailable',
        error: error.message,
      });
    }
  }
}