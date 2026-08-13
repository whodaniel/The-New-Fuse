import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getHello(): string {
    return 'Hello from The New Fuse API!';
  }

  getVersion(): string {
    return this.configService.get('APP_VERSION', '1.0.0');
  }

  getEnvironment(): string {
    return this.configService.get('NODE_ENV', 'development');
  }
}
