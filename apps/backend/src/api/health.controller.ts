import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Basic health check for the application' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'backend-app',
      version: '1.0.0',
    };
  }
}
