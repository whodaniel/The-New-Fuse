import { All, Body, Controller, HttpStatus, Query, Req, Res } from '@nestjs/common';
// @ts-ignore
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';

@ApiTags('analytics-gateway')
@Controller('analytics')
export class AnalyticsGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  @All('*path')
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

    // Fix: Backend expects /analytics prefix or direct routes?
    // The backend AnalyticsController has @Controller('analytics')
    // So if we proxy to Agency Hub, we might need to prepend /analytics if it's stripped
    const targetPath = path.startsWith('/analytics') ? path : `/analytics${path}`;

    try {
      const headers = {
        'X-Gateway': 'the-new-fuse-api-gateway',
        'X-Forwarded-By': 'api-gateway',
      };
      return await this.proxyService.proxyRequest(
        'casin8',
        targetPath,
        req.method,
        headers,
        body,
        query
      );
    } catch (error: any) {
      const status = error.response?.status || HttpStatus.BAD_GATEWAY;
      const data = error.response?.data || {
        message: 'Analytics service unavailable',
        error: error.message,
      };
      return res.status(status).json(data);
    }
  }
}
