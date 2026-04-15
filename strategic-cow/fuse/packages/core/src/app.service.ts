import { Injectable } from '@nestjs/common';
@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to Fuse API - Core Package';
  }

  getVersion(): string {
    return '1.0.0';
  }

  getStatus(): any {
    return {
      service: 'Fuse Core',
      status: 'running',
      version: this.getVersion(),
      timestamp: new Date().toISOString()
    };
  }
}