import { Injectable } from '@nestjs/common';
@Injectable()
export class AppService {
  getHello(): unknown {
    return 'Welcome to Fuse API - Core Package';
  }

  getVersion(): unknown {
    return '1.0.0';
  }

  getStatus(): unknown {
    return {
      service: 'Fuse Core',
      status: 'running',
      version: this.getVersion(),
      timestamp: new Date().toISOString()
    };
  }
}