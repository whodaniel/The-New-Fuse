import { All, Body, Controller, HttpStatus, Query, Req, Res, Version } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProxyService } from '../proxy/proxy.service.js';

@ApiTags('poker')
@Controller('poker')
export class PokerGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  @All('*path')
  @Version('1')
  @ApiOperation({ summary: 'Proxy all poker and casino game requests' })
  async proxyPokerRequest(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: any,
    @Query() query: any
  ) {
    const originalUrl = req.originalUrl || req.url || '';
    const withoutQuery = originalUrl.split('?')[0] || '';
    // Extract the portion of the path after /api/v1/poker
    const match = withoutQuery.match(/^\/api\/v\d+\/poker(.*)$/);
    let path = match ? match[1] : withoutQuery;

    if (!path) path = '/';
    if (!path.startsWith('/')) path = `/${path}`;

    // Reduce forwarded headers to avoid oversized header errors.
    const forwardedHeaders: Record<string, string> = {
      Accept: (req.headers.accept as string) || 'application/json',
      'Content-Type': (req.headers['content-type'] as string) || 'application/json',
    };
    if (req.headers.authorization) {
      forwardedHeaders.Authorization = req.headers.authorization as string;
    }
    if (req.headers['x-api-key']) {
      forwardedHeaders['x-api-key'] = req.headers['x-api-key'] as string;
    }

    try {
      const response = await this.proxyService.proxyRequest(
        'casin8',
        path,
        req.method,
        forwardedHeaders,
        body,
        query
      );

      return res.status(response.status).json(response.data);
    } catch (error: any) {
      const status = error.response?.status || HttpStatus.BAD_GATEWAY;
      const data = error.response?.data || {
        message: 'Poker service unavailable',
        error: error.message,
      };
      return res.status(status).json(data);
    }
  }
}
