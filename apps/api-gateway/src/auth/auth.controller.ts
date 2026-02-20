/**
 * Authentication Controller
 * Proxies authentication requests to backend services
 */

import {
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Logger,
  Post,
  Res,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly proxyService: ProxyService) {}

  @Post('login')
  @Version('1')
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ description: 'Login credentials' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() body: any, @Headers() headers: Record<string, string>, @Res() res: Response) {
    try {
      // NOTE: backend service does not have /api prefix in its main.ts
      const response = await this.proxyService.proxyRequest(
        'backend',
        '/auth/login',
        'POST',
        headers,
        body
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      this.logger.error(`Login proxy failed: ${error.message}`);
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
    @Res() res: Response
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'backend',
        '/auth/register',
        'POST',
        headers,
        body
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      this.logger.error(`Register proxy failed: ${error.message}`);
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
    @Res() res: Response
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'backend',
        '/auth/refresh',
        'POST',
        headers,
        body
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      this.logger.error(`Refresh proxy failed: ${error.message}`);
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
  async logout(@Headers() headers: Record<string, string>, @Res() res: Response) {
    try {
      const response = await this.proxyService.proxyRequest(
        'backend',
        '/auth/logout',
        'POST',
        headers
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      this.logger.error(`Logout proxy failed: ${error.message}`);
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Authentication service unavailable',
        error: error.message,
      });
    }
  }

  @Get('me')
  @Version('1')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user details' })
  @ApiResponse({ status: 200, description: 'User details retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@Headers() headers: Record<string, string>, @Res() res: Response) {
    try {
      // Try backend first
      const response = await this.proxyService.proxyRequest('backend', '/auth/me', 'GET', headers);
      return res.status(response.status).json(response.data);
    } catch (error) {
      this.logger.warn(
        `'me' endpoint proxy to backend failed, trying 'agents' service: ${error.message}`
      );

      try {
        // Fallback to agents service which also implements /auth/me
        const response = await this.proxyService.proxyRequest(
          'agents',
          '/api/auth/me', // agents service DOES have /api prefix
          'GET',
          headers
        );
        return res.status(response.status).json(response.data);
      } catch (fallbackError) {
        this.logger.error(`'me' endpoint proxy failed for all services`);
        return res.status(HttpStatus.BAD_GATEWAY).json({
          message: 'Authentication service unavailable',
          error: fallbackError.message,
        });
      }
    }
  }
}
