import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): unknown {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): unknown {
    return {
status: 'ok',
  }      timestamp: new Date().toISOString(),
      service: 'Fuse Core API'
    };
  }
}