import { Module } from '@nestjs/common';
import { ConfigurationService } from './configuration.service.js';

@Module({
  providers: [ConfigurationService],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}
