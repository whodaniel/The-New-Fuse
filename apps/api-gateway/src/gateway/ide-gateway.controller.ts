/**
 * IDE Gateway Controller
 * Unified endpoint for Theia IDE operations
 */

import { All, Controller, Get, Headers, HttpStatus, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';

@Controller('ide')
@ApiTags('ide')
export class IdeGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get('health')
  @ApiOperation({ summary: 'Check IDE health status' })
  @ApiResponse({ status: 200, description: 'IDE is healthy' })
  @ApiResponse({ status: 503, description: 'IDE is unavailable' })
  async getHealth(@Headers() headers: Record<string, string>, @Res() res: Response) {
    try {
      const response = await this.proxyService.proxyRequest('theia-ide', '/health', 'GET', headers);

      return res.status(response.status).json(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'IDE service unavailable';
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'unavailable',
        message: errorMessage,
      });
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Get IDE status and capabilities' })
  @ApiResponse({ status: 200, description: 'IDE status retrieved successfully' })
  async getStatus(@Headers() headers: Record<string, string>, @Res() res: Response) {
    try {
      const response = await this.proxyService.proxyRequest(
        'theia-ide',
        '/services',
        'GET',
        headers
      );

      return res.status(response.status).json({
        status: 'running',
        version: '2.0.0',
        theiaVersion: '1.65.2',
        capabilities: {
          aiIntegration: true,
          mcpSupport: true,
          extensionSupport: true,
          terminalAccess: true,
          debugger: true,
        },
        services: response.data,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(HttpStatus.BAD_GATEWAY).json({
        status: 'error',
        message: 'Failed to retrieve IDE status',
        error: errorMessage,
      });
    }
  }

  @Get('config')
  @ApiOperation({ summary: 'Get IDE configuration' })
  @ApiResponse({ status: 200, description: 'IDE configuration retrieved successfully' })
  async getConfig(@Headers() headers: Record<string, string>, @Res() res: Response) {
    // Return IDE configuration
    return res.status(HttpStatus.OK).json({
      port: 3007,
      hostname: '0.0.0.0',
      features: {
        ai: {
          anthropic: {
            enabled: true,
            models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
          },
          openai: {
            enabled: true,
            models: ['gpt-4o', 'gpt-4o-mini'],
          },
          ollama: {
            enabled: false,
          },
          huggingface: {
            enabled: false,
          },
        },
        extensions: {
          enabled: true,
          marketplaceUrl: 'https://open-vsx.org/api',
        },
        mcp: {
          enabled: true,
          servers: ['filesystem', 'git', 'sqlite', 'web-search', 'github'],
        },
      },
    });
  }

  @All('*path')
  @ApiOperation({ summary: 'Proxy all other requests to IDE' })
  @ApiResponse({ status: 200, description: 'Request proxied successfully' })
  async proxyToIde(
    @Req() req: Request,
    @Res() res: Response,
    @Headers() headers: Record<string, string>
  ) {
    try {
      const path = req.path.replace('/v1/ide', '');
      const response = await this.proxyService.proxyRequest(
        'theia-ide',
        path || '/',
        req.method,
        headers,
        req.body
      );

      return res.status(response.status).send(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'IDE service unavailable',
        error: errorMessage,
      });
    }
  }
}
