import {
  All,
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';

@ApiTags('timeline')
@Controller('timeline')
export class TimelineGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get('macro')
  @ApiOperation({ summary: 'Compatibility endpoint for timeline macro view' })
  async getTimelineMacroView(
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'api',
        '/api/timeline/events',
        'GET',
        headers,
        undefined,
        query
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Timeline service unavailable',
        error: errorMessage,
      });
    }
  }

  @All('*path')
  @ApiOperation({ summary: 'Proxy timeline requests to the API service' })
  async proxyTimelineRequest(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: any,
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string>
  ) {
    const originalUrl = req.originalUrl || req.url || '';
    const withoutQuery = originalUrl.split('?')[0] || '';
    const match = withoutQuery.match(/^\/api(?:\/v\d+)?\/timeline(.*)$/);
    let suffix = match ? match[1] : '';

    if (!suffix) {
      suffix = '';
    } else if (!suffix.startsWith('/')) {
      suffix = `/${suffix}`;
    }

    const targetPath = `/api/timeline${suffix}`;

    try {
      const response = await this.proxyService.proxyRequest(
        'api',
        targetPath,
        req.method,
        headers,
        body,
        query
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Timeline service unavailable',
        error: errorMessage,
      });
    }
  }
}
