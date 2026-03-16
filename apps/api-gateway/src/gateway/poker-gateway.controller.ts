import { All, Body, Controller, HttpStatus, Query, Req, Res, Version } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';

@ApiTags('poker')
@Controller('poker')
export class PokerGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  @All('**')
  @Version('1')
  @ApiOperation({ summary: 'Proxy all poker and casino game requests' })
  async proxyPokerRequest(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: any,
    @Query() query: any
  ) {
    const path = req.path.replace(/^\/api\/v1\/poker/, '') || '/';

    try {
      const response = await this.proxyService.proxyRequest(
        'casin8',
        path,
        req.method,
        req.headers as Record<string, string>,
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
