import {
  Controller,
  Get,
  Headers,
  HttpStatus,
  Res,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';

@Controller('system')
@ApiTags('system')
export class SystemGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  private async proxyMasterClock(headers: Record<string, string>, res: Response) {
    try {
      const response = await this.proxyService.proxyRequest(
        'agents',
        '/api/system/master-clock',
        'GET',
        headers
      );
      return res.status(response.status).json(response.data);
    } catch {
      try {
        const response = await this.proxyService.proxyRequest(
          'backend',
          '/api/system/master-clock',
          'GET',
          headers
        );
        return res.status(response.status).json(response.data);
      } catch (fallbackError) {
        const fallbackErrorMessage =
          fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
        return res.status(HttpStatus.BAD_GATEWAY).json({
          message: 'System telemetry service unavailable',
          error: fallbackErrorMessage,
        });
      }
    }
  }

  // Legacy path: /api/system/master-clock
  @Get('master-clock')
  @Version(VERSION_NEUTRAL)
  @ApiOperation({ summary: 'Get Master Clock telemetry (legacy path)' })
  @ApiResponse({ status: 200, description: 'Master Clock telemetry retrieved successfully' })
  async getMasterClockLegacy(@Headers() headers: Record<string, string>, @Res() res: Response) {
    return this.proxyMasterClock(headers, res);
  }

  // Versioned path: /api/v1/system/master-clock
  @Get('master-clock')
  @Version('1')
  @ApiOperation({ summary: 'Get Master Clock telemetry' })
  @ApiResponse({ status: 200, description: 'Master Clock telemetry retrieved successfully' })
  async getMasterClockV1(@Headers() headers: Record<string, string>, @Res() res: Response) {
    return this.proxyMasterClock(headers, res);
  }
}
