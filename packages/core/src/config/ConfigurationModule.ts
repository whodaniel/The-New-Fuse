import { Module, Global } from '@nestjs/common';
import { ConfigurationService } from './ConfigurationService.js';

@Global()
@Module({
  providers: [
    ConfigurationService
  ],
  exports: [
    ConfigurationService
  ]
})
export class ConfigurationModule {}
