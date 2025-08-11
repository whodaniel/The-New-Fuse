import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
@Controller()
export class AppController {
  // Implementation needed
}
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
  // Implementation needed
}
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): object {
  // Implementation needed
}
    return {
  // Implementation needed
}
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Fuse Core API'
    };
  }
}