import { All, Body, Controller, HttpStatus, Query, Req, Res, Version } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';

@ApiTags('analytics-gateway')
@Controller('analytics')
export class AnalyticsGatewayController {
  constructor(private readonly proxyService: ProxyService) {}
  private shouldFallback(status: number): boolean {
    return status === 404 || status >= 500;
  }

  @All('*path')
  @Version('1')
  @ApiOperation({ summary: 'Proxy analytics requests to Agency Hub service' })
  async proxyAnalytics(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: any,
    @Query() query: any
  ) {
    const originalUrl = req.originalUrl || req.url || '';
    const withoutQuery = originalUrl.split('?')[0] || '';

    // Extract the portion of the path after /api/v1/analytics
    const match = withoutQuery.match(/^\/api\/v\d+\/analytics(.*)$/);
    let path = match ? match[1] : withoutQuery;

    if (!path) path = '/';
    if (!path.startsWith('/')) path = `/${path}`;

    // Backend analytics routes are mounted under @Controller('analytics/default').
    // Keep an /analytics-prefixed target path for backend compatibility.
    const targetPath = path.startsWith('/analytics') ? path : `/analytics${path}`;

    try {
      const headers: Record<string, string> = {
        'X-Gateway': 'the-new-fuse-api-gateway',
        'X-Forwarded-By': 'api-gateway',
      };

      if (req.headers.authorization) {
        headers.Authorization = String(req.headers.authorization);
      }
      if (req.headers['x-api-key']) {
        headers['x-api-key'] = String(req.headers['x-api-key']);
      }

      const primaryResponse = await this.proxyService.proxyRequest(
        'backend',
        targetPath,
        req.method,
        headers,
        body,
        query
      );
      if (!this.shouldFallback(primaryResponse.status)) {
        return res.status(primaryResponse.status).json(primaryResponse.data);
      }

      try {
        const fallbackResponse = await this.proxyService.proxyRequest(
          'api',
          targetPath,
          req.method,
          headers,
          body,
          query
        );
        return res.status(fallbackResponse.status).json(fallbackResponse.data);
      } catch {
        // Preserve backend response when fallback service is unavailable.
        return res.status(primaryResponse.status).json(primaryResponse.data);
      }
    } catch (error: any) {
      const headers: Record<string, string> = {
        'X-Gateway': 'the-new-fuse-api-gateway',
        'X-Forwarded-By': 'api-gateway',
      };
      if (req.headers.authorization) {
        headers.Authorization = String(req.headers.authorization);
      }
      if (req.headers['x-api-key']) {
        headers['x-api-key'] = String(req.headers['x-api-key']);
      }

      try {
        const fallbackResponse = await this.proxyService.proxyRequest(
          'api',
          targetPath,
          req.method,
          headers,
          body,
          query
        );
        return res.status(fallbackResponse.status).json(fallbackResponse.data);
      } catch (fallbackError: any) {
        const status = fallbackError.response?.status || HttpStatus.BAD_GATEWAY;
        const data = fallbackError.response?.data || {
          message: 'Analytics service unavailable',
          error: fallbackError.message || error.message,
        };
        return res.status(status).json(data);
      }
    }
  }
}
